/*
 * Typewriter effect. Animates a sequence of lines, appending each
 * character with a slight delay to simulate the feel of a live
 * conversation. Users can click to skip the animation and reveal
 * immediately.
 */

export class Typewriter {
  constructor(targetEl, onComplete) {
    this.target = targetEl;
    this.onComplete = onComplete;
    this.queue = [];
    this.active = false;
    this.speed = 30; // milliseconds per character
    this.skip = false;
    this._clickHandler = () => {
      this.skip = true;
    };
  }

  enqueue(lines) {
    if (!Array.isArray(lines)) lines = [lines];
    this.queue.push(...lines);
    if (!this.active) this._run();
  }

  _run() {
    if (this.queue.length === 0) {
      this.active = false;
      if (this.onComplete) this.onComplete();
      return;
    }
    this.active = true;
    const line = this.queue.shift();
    const span = document.createElement('div');
    span.className = 'transcript-line';
    this.target.appendChild(span);
    document.addEventListener('click', this._clickHandler, { once: true });
    let i = 0;
    const nextChar = () => {
      if (this.skip) {
        span.textContent += line.slice(i);
        this.skip = false;
        clearInterval(timer);
        this._run();
        return;
      }
      span.textContent += line[i];
      i++;
      if (i >= line.length) {
        clearInterval(timer);
        this._run();
      }
    };
    const timer = setInterval(nextChar, this.speed);
  }
}