/*
 * Main UI renderer. Observes state changes and updates the DOM
 * accordingly. All rendering logic is encapsulated here to keep
 * presentation concerns separate from state and engine logic.
 */

import { Typewriter } from './typewriter.js';
import { showToast } from './toasts.js';

// Helper to format seconds as mm:ss
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function initUI(engine, state) {
  const root = document.getElementById('app');
  // Build a stable layout once so re-renders don't fight flex/overflow.
  root.innerHTML = '';

  const topbar = document.createElement('div');
  topbar.className = 'topbar';
  root.appendChild(topbar);

  const layout = document.createElement('div');
  layout.className = 'layout';
  root.appendChild(layout);

  // Create containers for responsive columns
  const leftCol = document.createElement('div');
  leftCol.className = 'left-column';
  const rightCol = document.createElement('div');
  rightCol.className = 'right-column';
  layout.appendChild(leftCol);
  layout.appendChild(rightCol);

  // Keep track of typewriters per call
  const typewriters = {};

  // Subscribe to state changes
  state.subscribe((s) => {
    // Render toasts
    if (s.toasts && s.toasts.length > 0) {
      // Show and clear toasts
      s.toasts.forEach((t) => showToast(t.message, t.variant));
      state.update((prev) => ({ toasts: [] }));
    }
    // Render topbar
    renderTopbar(topbar, s);
    // Render call queue
    renderQueue(leftCol, s, engine);
    // Render active call / dispatch panel / report
    renderRight(rightCol, s, engine, typewriters);
  });
}

function renderTopbar(topbar, state) {
  topbar.innerHTML = '';
  const hudItems = [
    { title: 'Turno', value: state.currentTurn || 1 },
    { title: 'Tempo', value: formatTime(state.timeRemaining || 0) },
    { title: 'Pontos', value: state.points || 0 },
    { title: 'Chamadas', value: (state.calls || []).length },
    { title: 'Rank', value: computeRank(state.xp || 0) },
  ];
  hudItems.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'hud-item';
    const t = document.createElement('div');
    t.className = 'hud-title';
    t.textContent = item.title;
    const v = document.createElement('div');
    v.className = 'hud-value';
    v.textContent = item.value;
    div.appendChild(t);
    div.appendChild(v);
    topbar.appendChild(div);
  });
}

function computeRank(xp) {
  if (xp < 50) return 'Cadete';
  if (xp < 150) return 'Soldado';
  if (xp < 300) return 'Sargento';
  return 'Tenente';
}

function renderQueue(container, state, engine) {
  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.textContent = 'Fila de Chamadas';
  card.appendChild(header);

  const list = document.createElement('div');
  list.className = 'queue-list';
  card.appendChild(list);
  (state.calls || []).forEach((call) => {
    const item = document.createElement('div');
    item.className = 'card';
    item.style.cursor = 'pointer';
    const title = document.createElement('div');
    title.className = 'card-header';
    title.textContent = call.title;
    const body = document.createElement('div');
    body.className = 'card-body';
    body.textContent = `Gravidade: ${call.severity}`;
    item.appendChild(title);
    item.appendChild(body);
    item.addEventListener('click', () => {
      // Always allow opening the selected call (queued/active/waiting/resolved)
      // so the player can finish dispatch or read the report.
      if (call.status === 'queued') {
        engine.activateCall(call.id);
      } else {
        // just focus it
        engine.focusCall(call.id);
      }
    });
    if (call.status !== 'queued') item.style.opacity = 0.85;
    list.appendChild(item);
  });

  // Helpful empty state
  if ((state.calls || []).length === 0) {
    const empty = document.createElement('div');
    empty.className = 'card-body';
    empty.style.opacity = '0.8';
    empty.textContent = 'Sem chamadas no momento.';
    card.appendChild(empty);
  }

  container.appendChild(card);
}

function renderRight(container, state, engine, typewriters) {
  container.innerHTML = '';
  const activeCallId = state.activeCallId;
  const call = (state.calls || []).find((c) => c.id === activeCallId);
  if (!call) {
    // Show placeholder
    const card = document.createElement('div');
    card.className = 'card';
    const header = document.createElement('div');
    header.className = 'card-header';
    header.textContent = 'Nenhuma chamada ativa';
    const body = document.createElement('div');
    body.className = 'card-body';
    body.textContent = 'Selecione uma chamada na fila para começar.';
    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);
    return;
  }
  // Card for active call
  const card = document.createElement('div');
  card.className = 'card';
  // Header
  const header = document.createElement('div');
  header.className = 'card-header';
  header.textContent = call.title;
  card.appendChild(header);
  // Conversation area
  const convo = document.createElement('div');
  convo.className = 'card-body';
  convo.style.maxHeight = '200px';
  convo.style.overflowY = 'auto';
  // Create or update typewriter for this call
  if (!typewriters[call.id]) {
    typewriters[call.id] = new Typewriter(convo, () => {});
    // Append initial logs
    typewriters[call.id].enqueue(call.logs);
  } else {
    // Check if new logs were added
    const typed = convo.querySelectorAll('.transcript-line').length;
    if (call.logs.length > typed) {
      const newLines = call.logs.slice(typed);
      typewriters[call.id].enqueue(newLines);
    }
  }
  card.appendChild(convo);
  // Determine what to show: question or dispatch
  if (call.status === 'active') {
    const currentQuestion = call.currentQuestion;
    if (currentQuestion) {
      // Show question prompt and button
      const qCard = document.createElement('div');
      qCard.className = 'card';
      const qHeader = document.createElement('div');
      qHeader.className = 'card-header';
      qHeader.textContent = 'Pergunta';
      const qBody = document.createElement('div');
      qBody.className = 'card-body';
      qBody.textContent = currentQuestion.prompt;
      const qFooter = document.createElement('div');
      qFooter.className = 'card-footer';
      const askBtn = document.createElement('button');
      askBtn.className = 'btn btn-primary';
      askBtn.textContent = 'Perguntar';
      askBtn.addEventListener('click', () => {
        // Provide predetermined answer defined in case
        const answer = {
          value: currentQuestion.response || '...',
          logLine: currentQuestion.response || '...',
          addFacts: currentQuestion.addsFacts || {},
        };
        engine.answerQuestion(call.id, currentQuestion.id, answer);
      });
      qFooter.appendChild(askBtn);
      qCard.appendChild(qHeader);
      qCard.appendChild(qBody);
      qCard.appendChild(qFooter);
      card.appendChild(qCard);
    } else {
      // Should not happen; if no question we wait for dispatch
    }
  } else if (call.status === 'waiting') {
    // Dispatch panel
    const dCard = document.createElement('div');
    dCard.className = 'card';
    const dHeader = document.createElement('div');
    dHeader.className = 'card-header';
    dHeader.textContent = 'Despacho de Unidades';
    dCard.appendChild(dHeader);
    const dBody = document.createElement('div');
    dBody.className = 'card-body';
    // Filter units by agency and region (simplified: by agency only)
    const availableUnits = (state.units || []).filter((u) => u.agency === call.agency);
    const selectedSet = new Set(call.dispatchSelection || []);
    availableUnits.forEach((unit) => {
      const label = document.createElement('label');
      label.style.display = 'block';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = unit.unitId;
      checkbox.checked = selectedSet.has(unit.unitId);
      checkbox.addEventListener('change', (e) => {
        engine.setDispatchSelection(call.id, unit.unitId, e.target.checked);
      });
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${unit.name} (${unit.role})`));
      dBody.appendChild(label);
    });
    dCard.appendChild(dBody);
    const dFooter = document.createElement('div');
    dFooter.className = 'card-footer';
    const dispatchBtn = document.createElement('button');
    dispatchBtn.className = 'btn btn-success';
    dispatchBtn.textContent = 'Despachar';
    dispatchBtn.addEventListener('click', () => {
      const selected = call.dispatchSelection || [];
      engine.dispatchUnits(call.id, selected);
    });
    dFooter.appendChild(dispatchBtn);
    dCard.appendChild(dFooter);
    card.appendChild(dCard);
  } else if (call.status === 'resolved') {
    // Report panel
    const rCard = document.createElement('div');
    rCard.className = 'card';
    const rHeader = document.createElement('div');
    rHeader.className = 'card-header';
    rHeader.textContent = 'Relatório da Chamada';
    const rBody = document.createElement('div');
    rBody.className = 'card-body';
    rBody.innerHTML = `<p>Resultado: ${call.outcome}</p><p>Despacho: ${call.dispatchChosen.map((id) => {
      const unit = state.units.find((u) => u.unitId === id);
      return unit ? unit.name : id;
    }).join(', ')}</p>`;
    rCard.appendChild(rHeader);
    rCard.appendChild(rBody);

    const rFooter = document.createElement('div');
    rFooter.className = 'card-footer';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Encerrar e voltar';
    closeBtn.addEventListener('click', () => engine.closeActiveCall());
    rFooter.appendChild(closeBtn);
    rCard.appendChild(rFooter);
    card.appendChild(rCard);
  }
  container.appendChild(card);
}