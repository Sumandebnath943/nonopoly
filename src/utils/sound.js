// Web Audio synth — dhol, sitar, siren, coins. No audio files needed.

class SoundEngine {
  ctx = null;
  muted = false;
  musicOn = false;
  musicTimer = null;

  init() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setMuted(m) {
    this.muted = m;
    if (m) this.stopMusic();
  }

  tone({ type = 'sine', f0, f1, t = 0, dur = 0.2, gain = 0.15, attack = 0.01, filter }) {
    const ctx = this.ctx;
    const start = ctx.currentTime + t;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, start);
    if (f1) osc.frequency.exponentialRampToValueAtTime(f1, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    let node = osc;
    if (filter) {
      const bf = ctx.createBiquadFilter();
      bf.type = filter.type;
      bf.frequency.value = filter.f;
      bf.Q.value = filter.q || 1;
      osc.connect(bf);
      node = bf;
    }
    node.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  noise({ t = 0, dur = 0.1, gain = 0.2, f = 1200 }) {
    const ctx = this.ctx;
    const start = ctx.currentTime + t;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bf = ctx.createBiquadFilter();
    bf.type = 'bandpass';
    bf.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(bf);
    bf.connect(g);
    g.connect(ctx.destination);
    src.start(start);
  }

  play(fn) {
    if (this.muted || !this.init()) return;
    try {
      fn();
    } catch {
      /* audio is best-effort */
    }
  }

  dice() {
    this.play(() => {
      for (let i = 0; i < 7; i++) this.noise({ t: i * 0.09 + Math.random() * 0.03, dur: 0.05, gain: 0.25, f: 1800 + Math.random() * 1500 });
    });
  }

  hop() {
    this.play(() => this.tone({ f0: 340, f1: 620, dur: 0.07, gain: 0.07 }));
  }

  cash() {
    this.play(() => [988, 1319, 1568, 2093].forEach((f, i) => this.tone({ f0: f, t: i * 0.045, dur: 0.45, gain: 0.12 })));
  }

  coins() {
    this.play(() => {
      for (let i = 0; i < 10; i++) this.tone({ f0: 1800 + Math.random() * 1600, t: i * 0.06, dur: 0.18, gain: 0.07, type: 'triangle' });
    });
  }

  sitar() {
    this.play(() =>
      [261.63, 329.63, 392, 493.88, 523.25, 659.25].forEach((f, i) =>
        this.tone({ type: 'sawtooth', f0: f, f1: f * 1.02, t: i * 0.08, dur: 0.6, gain: 0.08, filter: { type: 'bandpass', f: f * 2, q: 3 } }),
      ),
    );
  }

  dhol() {
    this.play(() => {
      this.tone({ f0: 160, f1: 45, dur: 0.25, gain: 0.4 });
      this.tone({ type: 'triangle', f0: 480, f1: 180, t: 0.13, dur: 0.12, gain: 0.2 });
      this.tone({ f0: 150, f1: 50, t: 0.26, dur: 0.22, gain: 0.32 });
      this.tone({ type: 'triangle', f0: 520, f1: 200, t: 0.36, dur: 0.1, gain: 0.18 });
    });
  }

  siren() {
    this.play(() => {
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, t);
      for (let i = 1; i <= 4; i++) osc.frequency.linearRampToValueAtTime(i % 2 ? 1100 : 620, t + i * 0.32);
      g.gain.setValueAtTime(0.09, t);
      g.gain.setValueAtTime(0.09, t + 1.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.45);
    });
  }

  horn() {
    this.play(() => [0, 0.15].forEach((t) => {
      this.tone({ type: 'square', f0: 440, t, dur: 0.11, gain: 0.06 });
      this.tone({ type: 'triangle', f0: 370, t, dur: 0.11, gain: 0.08 });
    }));
  }

  tension() {
    this.play(() => [220, 207.65, 196].forEach((f, i) => this.tone({ type: 'sawtooth', f0: f, t: i * 0.15, dur: 0.55, gain: 0.07, attack: 0.05 })));
  }

  stamp() {
    this.play(() => {
      this.tone({ f0: 120, f1: 40, dur: 0.18, gain: 0.5 });
      this.noise({ dur: 0.08, gain: 0.35, f: 500 });
    });
  }

  build() {
    this.play(() => {
      [0, 0.1, 0.2].forEach((t) => this.noise({ t, dur: 0.05, gain: 0.25, f: 900 }));
      this.tone({ type: 'triangle', f0: 660, f1: 990, t: 0.3, dur: 0.25, gain: 0.1 });
    });
  }

  whoosh() {
    this.play(() => this.noise({ dur: 0.35, gain: 0.18, f: 700 }));
  }

  bid() {
    this.play(() => this.tone({ type: 'triangle', f0: 700, f1: 900, dur: 0.12, gain: 0.12 }));
  }

  victory() {
    this.dhol();
    setTimeout(() => this.sitar(), 350);
    setTimeout(() => this.coins(), 900);
  }

  toggleMusic() {
    if (this.musicOn) this.stopMusic();
    else this.startMusic();
    return this.musicOn;
  }

  startMusic() {
    if (this.muted || !this.init()) return;
    this.musicOn = true;
    let step = 0;
    const raga = [261.63, 293.66, 329.63, 392, 440, 523.25];
    const tick = () => {
      if (!this.musicOn || this.muted) return;
      if (step % 4 === 0) this.tone({ f0: 110, f1: 55, dur: 0.18, gain: 0.08 });
      else if (step % 2 === 0) this.tone({ type: 'triangle', f0: 330, dur: 0.1, gain: 0.04 });
      if (step % 2 === 0 && Math.random() > 0.3) {
        this.tone({ f0: raga[Math.floor(Math.random() * raga.length)], dur: 0.6, gain: 0.035, attack: 0.05 });
      }
      step = (step + 1) % 16;
      this.musicTimer = setTimeout(tick, 280);
    };
    tick();
  }

  stopMusic() {
    this.musicOn = false;
    clearTimeout(this.musicTimer);
  }
}

export const sounds = new SoundEngine();
