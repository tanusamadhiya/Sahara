// Web Audio API Emergency Siren and Warning Beep Synthesizer
let audioCtx: AudioContext | null = null;
let sirenInterval: any = null;
let osc1: OscillatorNode | null = null;
let osc2: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isMutedGlobal = false;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function setSirenMute(muted: boolean) {
  isMutedGlobal = muted;
  if (muted && gainNode) {
    gainNode.gain.setValueAtTime(0, getAudioContext().currentTime);
  } else if (!muted && gainNode) {
    gainNode.gain.setValueAtTime(0.12, getAudioContext().currentTime);
  }
}

export function isSirenMuted(): boolean {
  return isMutedGlobal;
}

export function playWarningBeep() {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ctx.currentTime); // High pitch alert chirp
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Warning beep audio context could not trigger:", e);
  }
}

export function startEmergencySiren() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    if (osc1 || osc2) return; // Already playing

    gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(isMutedGlobal ? 0 : 0.12, ctx.currentTime);

    // Detuned dual oscillators for thick analog sirens
    osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.connect(gainNode);

    osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.connect(gainNode);

    osc1.start();
    osc2.start();

    // Modulate siren pitch every 450ms for a wailing effect
    let wavePhase = false;
    sirenInterval = setInterval(() => {
      const activeCtx = getAudioContext();
      if (!activeCtx || !osc1 || !osc2) return;
      const targetFreq1 = wavePhase ? 680 : 420;
      const targetFreq2 = wavePhase ? 688 : 428;

      osc1.frequency.exponentialRampToValueAtTime(targetFreq1, activeCtx.currentTime + 0.38);
      osc2.frequency.exponentialRampToValueAtTime(targetFreq2, activeCtx.currentTime + 0.38);

      wavePhase = !wavePhase;
    }, 450);

  } catch (e) {
    console.warn("Emergency siren failed to boot:", e);
  }
}

export function stopEmergencySiren() {
  try {
    if (sirenInterval) {
      clearInterval(sirenInterval);
      sirenInterval = null;
    }
    if (osc1) {
      osc1.stop();
      osc1.disconnect();
      osc1 = null;
    }
    if (osc2) {
      osc2.stop();
      osc2.disconnect();
      osc2 = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
  } catch (e) {
    console.warn("Siren stop teardown failed:", e);
  }
}

export function playHeartbeatSound() {
  if (isMutedGlobal) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    
    // First thump (lub)
    const playThump = (timeOffset: number, frequency: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + timeOffset);
      gain.gain.setValueAtTime(volume, ctx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.2);

      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.25);
    };

    playThump(0, 65, 0.4);      // Lub
    playThump(0.18, 58, 0.3);    // Dub
  } catch (e) {
    console.warn("Heartbeat failed to trigger:", e);
  }
}
