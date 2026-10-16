// Rich Web Audio Desi Synthesizer & Multi-Track Music Sequencer.
// Zero external audio files — 100% procedural tabla, sitar, santoor, dhol, shehnai & arcade SFX.

export const MUSIC_TRACKS = [
  { id: 'lofi', name: 'Mumbai Lo-Fi Tabla', icon: '🌙' },
  { id: 'baraat', name: 'Baraat Dhol Beats', icon: '🥁' },
  { id: 'royal', name: 'Rajasthani Santoor', icon: '👑' },
];

class SoundEngine {
  ctx = null;
  master = null;
  musicGain = null;
  sfxGain = null;
  muted = false;
  musicOn = true;
  trackId = 'lofi';
  musicTimer = null;
  step = 0;
  nextNoteTime = 0;
  unlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.init();
        if (this.musicOn && !this.muted && !this.musicTimer) {
          this.startMusic();
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  init() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();

      // Master dynamics compressor to keep everything warm, punchy, and clip-free
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 18;
      comp.ratio.value = 4;
      comp.attack.value = 0.005;
      comp.release.value = 0.18;

      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.36;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.85;

      this.musicGain.connect(comp);
      this.sfxGain.connect(comp);
      comp.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
    return this.ctx;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0.0001 : 0.9, this.ctx.currentTime, 0.03);
    }
    if (m) this.stopMusic(false);
    else if (this.musicOn) this.startMusic();
  }

  cycleTrack() {
    const idx = MUSIC_TRACKS.findIndex((t) => t.id === this.trackId);
    const next = MUSIC_TRACKS[(idx + 1) % MUSIC_TRACKS.length];
    this.trackId = next.id;
    if (!this.musicOn) {
      this.musicOn = true;
      this.startMusic();
    } else {
      this.step = 0;
    }
    this.click();
    return { musicOn: this.musicOn, track: next };
  }

  toggleMusic() {
    if (this.musicOn) {
      this.stopMusic(true);
    } else {
      this.musicOn = true;
      this.startMusic();
    }
    return this.musicOn;
  }

  // ---------- Low-level synth primitives ----------
  tone({ type = 'sine', f0, f1, t = 0, dur = 0.2, gain = 0.15, attack = 0.008, filter, dest, absTime }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const start = (absTime ?? ctx.currentTime) + t;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f0), start);
    if (f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(gain, start + Math.min(attack, dur * 0.4));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    let node = osc;
    if (filter) {
      const bf = ctx.createBiquadFilter();
      bf.type = filter.type || 'lowpass';
      bf.frequency.setValueAtTime(filter.f || 1200, start);
      if (filter.fEnd) bf.frequency.exponentialRampToValueAtTime(filter.fEnd, start + dur);
      bf.Q.value = filter.q || 1;
      osc.connect(bf);
      node = bf;
    }
    node.connect(g);
    g.connect(dest || this.sfxGain || ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  noise({ t = 0, dur = 0.1, gain = 0.2, f = 1200, q = 1.5, type = 'bandpass', dest, absTime }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const start = (absTime ?? ctx.currentTime) + t;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 1.4);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bf = ctx.createBiquadFilter();
    bf.type = type;
    bf.frequency.value = f;
    bf.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(bf);
    bf.connect(g);
    g.connect(dest || this.sfxGain || ctx.destination);
    src.start(start);
  }

  // Synthesized Tabla / Dholak strokes
  tabla(bol, absTime, dest) {
    const d = dest || this.musicGain;
    if (bol === 'dha' || bol === 'dhin') {
      // Bayan (bass gumki) + Dayan (tuned rim)
      this.tone({ type: 'sine', f0: 95, f1: bol === 'dhin' ? 128 : 68, dur: 0.26, gain: 0.28, attack: 0.006, dest: d, absTime });
      this.tone({ type: 'triangle', f0: 293.66, f1: 290, dur: 0.22, gain: 0.12, attack: 0.004, dest: d, absTime });
      this.noise({ dur: 0.035, gain: 0.08, f: 1800, dest: d, absTime });
    } else if (bol === 'ge') {
      this.tone({ type: 'sine', f0: 82, f1: 118, dur: 0.22, gain: 0.25, attack: 0.008, dest: d, absTime });
    } else if (bol === 'na' || bol === 'ta') {
      // Sharp Dayan chanti stroke
      this.tone({ type: 'triangle', f0: 587.33, f1: 580, dur: 0.14, gain: 0.14, attack: 0.003, dest: d, absTime });
      this.tone({ type: 'sine', f0: 293.66, dur: 0.16, gain: 0.11, attack: 0.003, dest: d, absTime });
      this.noise({ dur: 0.025, gain: 0.1, f: 3200, dest: d, absTime });
    } else if (bol === 'tin' || bol === 'tun') {
      // Open resonant bell-like syahi stroke
      this.tone({ type: 'sine', f0: 329.63, dur: 0.28, gain: 0.14, attack: 0.004, dest: d, absTime });
      this.tone({ type: 'triangle', f0: 659.25, dur: 0.15, gain: 0.06, attack: 0.003, dest: d, absTime });
    } else if (bol === 'ti' || bol === 're' || bol === 'ka') {
      // Crisp muted finger tap
      this.noise({ dur: 0.04, gain: 0.09, f: 1400, q: 2.5, dest: d, absTime });
      this.tone({ type: 'triangle', f0: 210, f1: 140, dur: 0.045, gain: 0.09, dest: d, absTime });
    }
  }

  // Plucked Sitar / Santoor note with jawari buzz
  sitarNote(freq, dur = 0.55, gain = 0.11, absTime, dest) {
    const d = dest || this.musicGain;
    this.tone({
      type: 'sawtooth',
      f0: freq * 0.992,
      f1: freq,
      dur,
      gain,
      attack: 0.012,
      filter: { type: 'bandpass', f: freq * 2.4, fEnd: freq * 1.3, q: 2.2 },
      dest: d,
      absTime,
    });
    // Sympathetic chikari string shimmer
    this.tone({
      type: 'triangle',
      f0: freq * 2,
      dur: dur * 0.7,
      gain: gain * 0.45,
      attack: 0.005,
      dest: d,
      absTime,
    });
  }

  play(fn) {
    if (this.muted || !this.init()) return;
    try {
      fn();
    } catch {
      /* audio is best-effort */
    }
  }

  // ---------- Game Sound Effects ----------
  click() {
    this.play(() => {
      this.tone({ type: 'triangle', f0: 520, f1: 780, dur: 0.045, gain: 0.09, attack: 0.002 });
    });
  }

  pop() {
    this.play(() => {
      this.tone({ type: 'sine', f0: 380, f1: 860, dur: 0.08, gain: 0.12, attack: 0.004 });
    });
  }

  dice() {
    this.play(() => {
      try { navigator.vibrate?.([18, 30, 18]); } catch { /* ignore */ }
      for (let i = 0; i < 8; i++) {
        const t = i * 0.08 + Math.random() * 0.02;
        this.noise({ t, dur: 0.045, gain: 0.24, f: 1600 + i * 220, q: 2 });
        this.tone({ type: 'triangle', f0: 280 + i * 55, f1: 180, t, dur: 0.04, gain: 0.12 });
      }
      // Final settle clack
      this.tone({ type: 'sine', f0: 587.33, f1: 880, t: 0.72, dur: 0.14, gain: 0.11 });
    });
  }

  hop(stepIndex = 0) {
    this.play(() => {
      // Musical pentatonic scale step so walking around the board sounds super satisfying!
      const scale = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.5];
      const f = scale[stepIndex % scale.length];
      this.tone({ type: 'triangle', f0: f * 0.85, f1: f, dur: 0.085, gain: 0.12, attack: 0.004 });
      this.tone({ type: 'sine', f0: f * 2, dur: 0.06, gain: 0.04, attack: 0.003 });
    });
  }

  double() {
    this.play(() => {
      this.dhol();
      [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
        this.sitarNote(f, 0.35, 0.13, this.ctx.currentTime + i * 0.055, this.sfxGain);
      });
    });
  }

  cash() {
    this.play(() => {
      [987.77, 1318.5, 1567.98, 2093].forEach((f, i) => {
        this.tone({ type: 'triangle', f0: f, t: i * 0.045, dur: 0.42, gain: 0.14 });
        this.tone({ type: 'sine', f0: f * 2, t: i * 0.045, dur: 0.22, gain: 0.05 });
      });
    });
  }

  coins() {
    this.play(() => {
      const notes = [1567.98, 1760, 1975.53, 2093, 2349.32, 2637.02];
      for (let i = 0; i < 11; i++) {
        const f = notes[i % notes.length];
        this.tone({ type: 'triangle', f0: f, t: i * 0.048, dur: 0.2, gain: 0.09 });
      }
    });
  }

  sitar() {
    this.play(() => {
      const raga = [293.66, 369.99, 440, 554.37, 587.33, 739.99, 880];
      raga.forEach((f, i) => {
        this.sitarNote(f, 0.55, 0.11, this.ctx.currentTime + i * 0.065, this.sfxGain);
      });
    });
  }

  dhol() {
    this.play(() => {
      // Punjaabi Dhol: Dhum - Chak - Dhum - Dhum - Chak
      const hits = [
        [0, 'dha'],
        [0.12, 'na'],
        [0.24, 'dha'],
        [0.34, 'dhin'],
        [0.44, 'na'],
      ];
      hits.forEach(([t, bol]) => this.tabla(bol, this.ctx.currentTime + t, this.sfxGain));
    });
  }

  siren() {
    this.play(() => {
      try { navigator.vibrate?.([80, 50, 120]); } catch { /* ignore */ }
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, t);
      for (let i = 1; i <= 5; i++) {
        osc.frequency.linearRampToValueAtTime(i % 2 ? 1120 : 580, t + i * 0.26);
      }
      const bf = ctx.createBiquadFilter();
      bf.type = 'lowpass';
      bf.frequency.value = 2400;
      g.gain.setValueAtTime(0.11, t);
      g.gain.setValueAtTime(0.11, t + 1.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(bf);
      bf.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.45);
    });
  }

  horn() {
    this.play(() => {
      // Classic Indian Truck "Horn OK Please" melody!
      const notes = [
        [440, 0, 0.11],
        [493.88, 0.12, 0.11],
        [554.37, 0.24, 0.11],
        [587.33, 0.36, 0.22],
        [493.88, 0.6, 0.12],
        [587.33, 0.74, 0.3],
      ];
      notes.forEach(([f, t, dur]) => {
        this.tone({ type: 'sawtooth', f0: f, t, dur, gain: 0.08, filter: { type: 'bandpass', f: f * 2, q: 2 } });
      });
    });
  }

  tension() {
    this.play(() => {
      // Dramatic Indian TV serial "Dhum Tana" sting
      [246.94, 233.08, 220].forEach((f, i) => {
        this.tone({ type: 'sawtooth', f0: f, t: i * 0.14, dur: 0.48, gain: 0.09, attack: 0.02, filter: { type: 'lowpass', f: 900 } });
      });
      this.tabla('dha', this.ctx.currentTime, this.sfxGain);
    });
  }

  stamp() {
    this.play(() => {
      try { navigator.vibrate?.(45); } catch { /* ignore */ }
      this.tone({ f0: 140, f1: 38, dur: 0.22, gain: 0.48 });
      this.noise({ dur: 0.09, gain: 0.32, f: 650 });
      this.tone({ type: 'triangle', f0: 587.33, f1: 880, t: 0.12, dur: 0.25, gain: 0.12 });
    });
  }

  build(level = 1) {
    this.play(() => {
      [0, 0.09, 0.18].forEach((t, i) => {
        this.noise({ t, dur: 0.045, gain: 0.22, f: 900 + i * 300 });
        this.tone({ type: 'triangle', f0: 440 + i * 110, t, dur: 0.08, gain: 0.1 });
      });
      if (level >= 5) {
        // Royal Haveli fanfare!
        [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
          this.tone({ type: 'sawtooth', f0: f, t: 0.25 + i * 0.08, dur: 0.45, gain: 0.11, filter: { type: 'lowpass', f: 2200 } });
        });
      } else {
        this.tone({ type: 'triangle', f0: 587.33, f1: 880, t: 0.26, dur: 0.26, gain: 0.14 });
      }
    });
  }

  whoosh(deck = 'kismet') {
    this.play(() => {
      this.noise({ dur: 0.26, gain: 0.16, f: 900 });
      if (deck === 'kismet') {
        // Parrot flute trill
        [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
          this.tone({ type: 'sine', f0: f, t: 0.06 + i * 0.05, dur: 0.2, gain: 0.09 });
        });
      } else {
        // Rishtedaar gossip chime
        [440, 554.37, 659.25, 554.37].forEach((f, i) => {
          this.tone({ type: 'triangle', f0: f, t: 0.06 + i * 0.06, dur: 0.2, gain: 0.1 });
        });
      }
    });
  }

  bid() {
    this.play(() => {
      this.tone({ type: 'triangle', f0: 660, f1: 990, dur: 0.12, gain: 0.14 });
      this.tabla('na', this.ctx.currentTime, this.sfxGain);
    });
  }

  turn() {
    this.play(() => {
      try { navigator.vibrate?.(25); } catch { /* ignore */ }
      // Temple bell chime for "Your Turn"
      this.tone({ type: 'sine', f0: 880, dur: 0.55, gain: 0.12, attack: 0.004 });
      this.tone({ type: 'triangle', f0: 1760, dur: 0.35, gain: 0.05, attack: 0.003 });
    });
  }

  taunt() {
    this.play(() => {
      this.tone({ type: 'sine', f0: 520, f1: 920, dur: 0.11, gain: 0.12 });
      this.tone({ type: 'triangle', f0: 920, f1: 680, t: 0.1, dur: 0.12, gain: 0.1 });
    });
  }

  victory() {
    this.dhol();
    setTimeout(() => this.sitar(), 320);
    setTimeout(() => this.coins(), 820);
  }

  // ---------- Lookahead Procedural Music Sequencer ----------
  startMusic() {
    if (this.muted || !this.init()) return;
    this.musicOn = true;
    clearInterval(this.musicTimer);
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    const scheduleAhead = 0.14;
    const lookaheadMs = 50;

    this.musicTimer = setInterval(() => {
      if (!this.musicOn || this.muted || !this.ctx || document.hidden) return;
      if (this.nextNoteTime < this.ctx.currentTime - 0.2) {
        this.nextNoteTime = this.ctx.currentTime + 0.02;
      }
      while (this.nextNoteTime < this.ctx.currentTime + scheduleAhead) {
        this.scheduleStep(this.step, this.nextNoteTime);
        const stepDur = this.trackId === 'baraat' ? 0.165 : this.trackId === 'royal' ? 0.19 : 0.21;
        this.nextNoteTime += stepDur;
        this.step = (this.step + 1) % 32;
      }
    }, lookaheadMs);
  }

  scheduleStep(step, time) {
    const s16 = step % 16;

    if (this.trackId === 'lofi') {
      // Track 1: Mumbai Lo-Fi Tabla & Sitar (Teen Taal inspired chill groove in D Khamaj)
      const tablaPattern = [
        'dha', 'ti', 'dhin', null,
        'dhin', 'ti', 'dha', 'ge',
        'dha', 'ti', 'tin', null,
        'ta', 'ti', 'dhin', 'dhin',
      ];
      const bol = tablaPattern[s16];
      if (bol) this.tabla(bol, time, this.musicGain);

      // Warm sub-bass & harmonium pad on bar starts
      if (s16 === 0 || s16 === 8) {
        const root = step < 16 ? 146.83 : 130.81; // D3 -> C3
        const third = step < 16 ? 185.0 : 164.81;
        const fifth = step < 16 ? 220.0 : 196.0;
        this.tone({ type: 'sine', f0: root / 2, dur: 1.5, gain: 0.18, attack: 0.04, dest: this.musicGain, absTime: time });
        [root, third, fifth].forEach((f) => {
          this.tone({
            type: 'triangle',
            f0: f,
            dur: 1.45,
            gain: 0.045,
            attack: 0.08,
            filter: { type: 'lowpass', f: 650 },
            dest: this.musicGain,
            absTime: time,
          });
        });
      }

      // Melodic Sitar phrases
      const melody = [
        293.66, null, 369.99, 440,
        null, 554.37, 493.88, 440,
        369.99, null, 329.63, 369.99,
        440, null, 293.66, null,
        261.63, null, 329.63, 392.0,
        null, 440, 392.0, 329.63,
        293.66, 329.63, 369.99, null,
        293.66, null, null, null,
      ];
      const note = melody[step];
      if (note) {
        this.sitarNote(note, 0.42, 0.065, time, this.musicGain);
      }
    } else if (this.trackId === 'baraat') {
      // Track 2: Punjabi Dhol & Brass Baraat (Keherwa / Bhangra groove)
      const bhangra = [
        'dha', null, 'na', 'dha',
        null, 'dhin', 'na', 'ti',
        'dha', 'dha', 'na', 'dhin',
        null, 'na', 'dhin', 'ta',
      ];
      const bol = bhangra[s16];
      if (bol) this.tabla(bol, time, this.musicGain);

      // Tumbi bass bounce
      if (s16 % 2 === 0) {
        const bass = step < 16 ? 146.83 : 164.81;
        this.tone({ type: 'triangle', f0: bass, f1: bass * 0.96, dur: 0.18, gain: 0.14, dest: this.musicGain, absTime: time });
      }

      // Festive Shehnai / Tumbi riff
      const riff = [
        587.33, 587.33, 659.25, 587.33,
        739.99, null, 659.25, 587.33,
        523.25, 587.33, 659.25, null,
        493.88, 523.25, 587.33, null,
      ];
      const fn = riff[s16];
      if (fn) {
        this.tone({
          type: 'sawtooth',
          f0: fn,
          dur: 0.2,
          gain: 0.055,
          attack: 0.015,
          filter: { type: 'bandpass', f: fn * 1.8, q: 2.5 },
          dest: this.musicGain,
          absTime: time,
        });
      }
    } else {
      // Track 3: Royal Rajasthani Santoor & Bansuri
      if (s16 === 0) {
        // Tanpura drone Sa - Pa - Sa
        [146.83, 220, 293.66].forEach((f, i) => {
          this.tone({ type: 'sine', f0: f, t: i * 0.1, dur: 2.6, gain: 0.055, attack: 0.12, dest: this.musicGain, absTime: time });
        });
      }
      const taal = ['dha', null, 'tin', 'ti', 'dhin', null, 'na', null, 'dha', null, 'tun', 'ti', 'ta', null, 'dhin', null];
      if (taal[s16]) this.tabla(taal[s16], time, this.musicGain);

      const santoor = [
        587.33, 659.25, 739.99, 880,
        739.99, 659.25, 587.33, 493.88,
        440, 493.88, 587.33, 659.25,
        587.33, 493.88, 440, 369.99,
      ];
      const sn = santoor[s16];
      if (sn && (step % 2 === 0 || step % 7 === 0)) {
        this.tone({ type: 'triangle', f0: sn, dur: 0.35, gain: 0.06, attack: 0.004, dest: this.musicGain, absTime: time });
        this.tone({ type: 'sine', f0: sn * 2, dur: 0.2, gain: 0.025, attack: 0.003, dest: this.musicGain, absTime: time });
      }
    }
  }

  stopMusic(userInitiated = true) {
    if (userInitiated) this.musicOn = false;
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}

export const sounds = new SoundEngine();
