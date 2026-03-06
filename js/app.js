/*
 * Application bootstrap. Creates the state store and engine,
 * initializes the UI, loads data and starts the first game turn.
 */

import { createState } from './state.js';
import { Engine } from './core/engine.js';
import { initUI } from './ui/render.js';
import { showToast } from './ui/toasts.js';

async function main() {
  const initialState = {
    currentTurn: 1,
    timeRemaining: 0,
    points: 0,
    xp: 0,
    career: { warnings: 0, promotions: 0 },
    toasts: [],
  };
  const state = createState(initialState);
  const engine = new Engine(state);
  try {
    await engine.init();
    initUI(engine, state);
    engine.startTurn(600); // 10 minute default turn
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Erro ao iniciar o jogo', 'error');
  }
}

main();