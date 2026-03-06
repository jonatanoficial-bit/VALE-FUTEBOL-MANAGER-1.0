/*
 * Global game state management.
 * The state module stores all mutable game data and notifies
 * subscribed listeners whenever the state changes. Each update
 * should produce a new state object to allow for simple diffing
 * within the UI layer.
 */

export const createState = (initialState = {}) => {
  let state = { ...initialState };
  const listeners = new Set();

  // Notify all listeners of a state change
  function notify() {
    for (const fn of listeners) {
      fn(state);
    }
  }

  return {
    get() {
      return state;
    },
    // Replace entire state
    set(newState) {
      state = { ...newState };
      notify();
    },
    // Update state via an updater function
    update(updater) {
      const newState = updater(state);
      state = { ...state, ...newState };
      notify();
    },
    // Subscribe to state changes; returns an unsubscribe function
    subscribe(fn) {
      listeners.add(fn);
      // Immediately call with current state
      fn(state);
      return () => listeners.delete(fn);
    }
  };
};