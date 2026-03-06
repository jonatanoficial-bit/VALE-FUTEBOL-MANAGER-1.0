/*
 * Save system using localStorage. Provides simple functions to
 * persist and restore game state. Save slots are stored under
 * a prefix to avoid collisions with other web applications.
 */

const PREFIX = 'lcd_operator_save_';

export function saveState(slot, state) {
  try {
    localStorage.setItem(PREFIX + slot, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Não foi possível salvar o jogo:', err);
    return false;
  }
}

export function loadState(slot) {
  try {
    const data = localStorage.getItem(PREFIX + slot);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('Não foi possível carregar o jogo:', err);
    return null;
  }
}