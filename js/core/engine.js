/*
 * Game engine. Coordinates the high‑level simulation including
 * timekeeping, call spawning, question sequencing, dispatching and
 * scoring. This module depends on other modules for protocol
 * management, scoring and state updates.
 */

import { RNG } from './rng.js';
import { loadData } from '../data/loader.js';
import { validateAll } from '../data/validators.js';
// protocol, dispatcher and scoring live in the same directory as engine
import { nextQuestionForCall } from './protocol.js';
import { evaluateDispatch } from './dispatcher.js';
import { computeScore } from './scoring.js';

export class Engine {
  constructor(state) {
    this.state = state;
    this.turnTimer = null;
    this.rng = new RNG();
    this.dataLoaded = false;
  }

  async init() {
    // Load all data files concurrently
    const data = await loadData();
    const valid = validateAll(data);
    if (!valid.ok) {
      throw new Error(valid.errorMessage);
    }
    // Set initial state with data
    this.state.update(() => ({ ...data, calls: [], activeCallId: null }));
    this.dataLoaded = true;
  }

  startTurn(durationSec = 600) {
    if (!this.dataLoaded) return;
    const initialQueue = [];
    // Prepare calls for the turn by shuffling available cases
    const cases = [...this.state.get().cases];
    this.rng.shuffle(cases);
    // Spawn up to maximum queue size initially
    const maxQueue = 5;
    for (let i = 0; i < Math.min(maxQueue, cases.length); i++) {
      const c = cases[i];
      initialQueue.push(this._createCallInstance(c));
    }
    this.state.update((prev) => ({
      currentTurn: (prev.currentTurn || 1),
      timeRemaining: durationSec,
      points: 0,
      xp: 0,
      calls: initialQueue,
      activeCallId: null,
      resolvedCalls: [],
      career: prev.career || { warnings: 0, promotions: 0 },
    }));
    // Start timer
    this._startTimer();
  }

  _startTimer() {
    if (this.turnTimer) clearInterval(this.turnTimer);
    this.turnTimer = setInterval(() => {
      this.state.update((prev) => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          clearInterval(this.turnTimer);
          this.turnTimer = null;
          // End turn automatically
          return { timeRemaining: 0 };
        }
        return { timeRemaining: newTime };
      });
    }, 1000);
  }

  _createCallInstance(caseDef) {
    const id = `${caseDef.caseId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return {
      id,
      caseId: caseDef.caseId,
      title: caseDef.title,
      agency: caseDef.agency,
      severity: caseDef.baseSeverity,
      status: 'queued',
      answers: {},
      facts: {},
      logs: [caseDef.introCallerLine],
      startTime: null,
      timelineIdx: 0,
      dispatchChosen: [],
      // UI selection is persisted here so rerenders (e.g., timer ticks)
      // don't clear the user's chosen units.
      dispatchSelection: [],
      outcome: null,
    };
  }

  setDispatchSelection(callId, unitId, checked) {
    this.state.update((prev) => {
      const calls = (prev.calls || []).map((c) => {
        if (c.id !== callId) return c;
        const current = new Set(c.dispatchSelection || []);
        if (checked) current.add(unitId);
        else current.delete(unitId);
        return { ...c, dispatchSelection: Array.from(current) };
      });
      return { calls };
    });
  }

  activateCall(callId) {
    this.state.update((prev) => {
      const calls = prev.calls.map((c) => {
        if (c.id === callId) return { ...c, status: 'active', startTime: Date.now() };
        return c;
      });
      return { calls, activeCallId: callId };
    });
    // Immediately prepare the first question
    this._advanceCall(callId);
  }

  answerQuestion(callId, questionId, answer) {
    // Append log and record answer
    this.state.update((prev) => {
      const calls = prev.calls.map((c) => {
        if (c.id !== callId) return c;
        const newLogs = [...c.logs, answer.logLine];
        const newAnswers = { ...c.answers, [questionId]: answer.value };
        const newFacts = { ...c.facts, ...answer.addFacts };
        return { ...c, logs: newLogs, answers: newAnswers, facts: newFacts };
      });
      return { calls };
    });
    // Determine next question or proceed to dispatch
    this._advanceCall(callId);
  }

  _advanceCall(callId) {
    const call = this.state.get().calls.find((c) => c.id === callId);
    if (!call) return;
    const caseDef = this.state.get().cases.find((cs) => cs.caseId === call.caseId);
    const nextQ = nextQuestionForCall(call, caseDef);
    if (nextQ) {
      // Add the question to logs via typewriter; UI will prompt user to answer
      this.state.update((prev) => {
        const calls = prev.calls.map((c) => {
          if (c.id === callId) return { ...c, logs: [...c.logs, nextQ.prompt], currentQuestion: nextQ };
          return c;
        });
        return { calls };
      });
    } else {
      // All required questions answered. Offer dispatch selection
      this.state.update((prev) => {
        const calls = prev.calls.map((c) => {
          if (c.id === callId) return { ...c, status: 'waiting' };
          return c;
        });
        return { calls };
      });
    }
  }

  dispatchUnits(callId, unitIds) {
    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      this.state.update((prev) => ({
        toasts: [...(prev.toasts || []), {
          id: Date.now(),
          message: 'Selecione pelo menos 1 unidade para despachar.',
          variant: 'fail',
        }],
      }));
      return;
    }
    // Evaluate dispatch
    const call = this.state.get().calls.find((c) => c.id === callId);
    if (!call) return;
    const caseDef = this.state.get().cases.find((cs) => cs.caseId === call.caseId);
    const result = evaluateDispatch(call, caseDef, unitIds, this.state.get().units);
    const scoreResult = computeScore(call, caseDef, result);
    // Update call status and record outcome
    this.state.update((prev) => {
      const calls = prev.calls.map((c) => {
        if (c.id !== callId) return c;
        return {
          ...c,
          status: 'resolved',
          outcome: result.outcome,
          dispatchChosen: unitIds,
          dispatchSelection: unitIds,
        };
      });
      const resolvedCalls = [...(prev.resolvedCalls || []), callId];
      const points = (prev.points || 0) + scoreResult.points;
      const xp = (prev.xp || 0) + scoreResult.xp;
      return { calls, resolvedCalls, points, xp };
    });
    // Show toast with outcome summary
    this.state.update((prev) => {
      const toasts = [...(prev.toasts || []), { id: Date.now(), message: result.message, variant: result.outcome }];
      return { toasts };
    });
    // Keep the call active so the player can read the report.
    // The UI provides an explicit button to close it.
    this.state.update(() => ({ activeCallId: callId }));
  }

  closeActiveCall() {
    this.state.update(() => ({ activeCallId: null }));
  }

  focusCall(callId) {
    this.state.update(() => ({ activeCallId: callId }));
  }
}