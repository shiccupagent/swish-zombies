// Procedural Web Audio Synthesizer for Swish Zombies
// Zero external audio asset dependencies — pure synthesized acoustics

export class AudioSynth {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  playShot(heavy: boolean = false): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const dur = heavy ? 0.38 : 0.24;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.25));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(heavy ? 650 : 950, t);
    flt.frequency.exponentialRampToValueAtTime(70, t + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.75 : 0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

    // Punch transient
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);
    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);

    src.connect(flt);
    flt.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
  }

  playShellLoad(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(190, t + 0.07);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.07);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  playPumpAction(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(110, t + 0.06);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.06);
  }

  playEmpty(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(700, t);
    o.frequency.setValueAtTime(400, t + 0.03);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.08);
  }

  playMeleeBash(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    // Low blunt crunch
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.16);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.16);

    // Impact crack
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.08), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.2));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 1400;
    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.4, t);
    snapGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    src.connect(flt);
    flt.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    src.start(t);
  }

  playZombieGroan(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    const startF = 85 + Math.random() * 45;
    o.frequency.setValueAtTime(startF, t);
    o.frequency.exponentialRampToValueAtTime(startF * 0.55, t + 0.4);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.4);
  }

  playZombieBite(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.12);
  }

  playScreamerShriek(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(600, t);
    o.frequency.linearRampToValueAtTime(1400, t + 0.25);
    o.frequency.exponentialRampToValueAtTime(450, t + 0.6);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.6);
  }

  playBossRoar(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(65, t);
    o.frequency.linearRampToValueAtTime(95, t + 0.35);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.9);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.9);
  }

  playBossSlam(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.45);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.45);
  }

  playExplosion(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const dur = 0.5;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(450, t);
    flt.frequency.exponentialRampToValueAtTime(50, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.75, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(this.ctx.destination);
    src.start(t);
  }

  playTurretFire(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(380, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.08);
  }

  playLightningProc(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(1100, t);
    o.frequency.linearRampToValueAtTime(320, t + 0.14);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.14);
  }

  playPickup(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(650, t);
    o.frequency.setValueAtTime(1050, t + 0.08);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.16);
  }

  playRoundStart(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [220, 277, 330, 440].forEach((freq, idx) => {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, t + idx * 0.09);
      g.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.09 + 0.28);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t + idx * 0.09);
      o.stop(t + idx * 0.09 + 0.28);
    });
  }

  playRoundClear(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, idx) => {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.22, t + idx * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.1 + 0.35);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t + idx * 0.1);
      o.stop(t + idx * 0.1 + 0.35);
    });
  }

  playRotorThump(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(75, t);
    o.frequency.exponentialRampToValueAtTime(25, t + 0.08);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.08);
  }

  playPistolShot(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    g.gain.setValueAtTime(0.45, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);

    // Crack
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.08), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.15));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'highpass';
    flt.frequency.value = 1200;
    const snap = this.ctx.createGain();
    snap.gain.setValueAtTime(0.4, t);
    snap.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    src.connect(flt);
    flt.connect(snap);
    snap.connect(this.ctx.destination);
    src.start(t);
  }

  playSmgShot(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);

    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.06), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.2));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 1600;
    const snap = this.ctx.createGain();
    snap.gain.setValueAtTime(0.3, t);
    snap.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    src.connect(flt);
    flt.connect(snap);
    snap.connect(this.ctx.destination);
    src.start(t);
  }

  playRifleShot(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);

    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.14), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.25));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(1400, t);
    flt.frequency.exponentialRampToValueAtTime(200, t + 0.14);
    const snap = this.ctx.createGain();
    snap.gain.setValueAtTime(0.5, t);
    snap.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
    src.connect(flt);
    flt.connect(snap);
    snap.connect(this.ctx.destination);
    src.start(t);
  }

  playSniperShot(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);

    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.35), this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(2200, t);
    flt.frequency.exponentialRampToValueAtTime(300, t + 0.35);
    const snap = this.ctx.createGain();
    snap.gain.setValueAtTime(0.65, t);
    snap.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    src.connect(flt);
    flt.connect(snap);
    snap.connect(this.ctx.destination);
    src.start(t);
  }

  playRayGunShot(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.22);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    // FM modulation for alien laser wobble
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    mod.type = 'sine';
    mod.frequency.setValueAtTime(45, t);
    modGain.gain.setValueAtTime(200, t);
    mod.connect(modGain);
    modGain.connect(osc.frequency);
    mod.start(t);
    mod.stop(t + 0.22);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  playMysteryBoxJingle(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const notes = [392, 440, 523, 587, 659, 784, 880, 1046]; // Carnival tune
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const startT = t + idx * 0.12;
      g.gain.setValueAtTime(0.18, startT);
      g.gain.exponentialRampToValueAtTime(0.01, startT + 0.2);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(startT);
      o.stop(startT + 0.2);
    });
  }

  playPackAPunch(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const notes = [261, 329, 392, 523, 659, 784, 1046, 1318];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      const startT = t + idx * 0.08;
      g.gain.setValueAtTime(0.22, startT);
      g.gain.exponentialRampToValueAtTime(0.01, startT + 0.25);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(startT);
      o.stop(startT + 0.25);
    });
  }

  playMagInsert(): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }
}

