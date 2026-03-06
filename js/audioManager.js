export class AudioManager{
  constructor(){
    this.ctx = null;
    this.muted = false;
  }

  ensure(){
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }

  ping(freq=660, dur=0.07, type='sine', gain=0.05){
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(gain, t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0+dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0+dur+0.02);
  }

  // Friendly names used by UI/Managers
  playIncoming(freq=740, gain=0.05){ this.ping(freq, 0.10, 'triangle', gain); }
  playSelect(){ this.ping(520, 0.06, 'sine', 0.04); }
  playType(){ this.ping(900, 0.03, 'triangle', 0.025); }
  playDispatch(){ this.ping(520, 0.07, 'sawtooth', 0.04); }
  playResolve(){ this.ping(980, 0.08, 'sine', 0.05); this.ping(1170, 0.10, 'sine', 0.045); }
  playError(){ this.ping(220, 0.12, 'square', 0.04); }
}
