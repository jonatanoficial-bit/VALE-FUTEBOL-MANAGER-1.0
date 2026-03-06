/*
 * Simple deterministic pseudo-random number generator.
 * The game uses this generator with an optional seed so that
 * the sequence of spawned calls and events can be reproduced.
 */

export class RNG {
  constructor(seed = Date.now()) {
    // Use a 32‑bit integer for the internal state
    this._state = typeof seed === 'number' ? seed >>> 0 : this._hash(seed);
  }

  // Hash a string into a 32‑bit integer
  _hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Return a float in [0,1)
  next() {
    // xorshift* 32‑bit generator
    let x = this._state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this._state = x >>> 0;
    return (this._state >>> 0) / 4294967296;
  }

  // Return an integer in [0, max)
  int(max) {
    return Math.floor(this.next() * max);
  }

  // Shuffle array in place
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}