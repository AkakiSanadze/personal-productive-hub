let ctx: AudioContext | null = null;
let loop: ReturnType<typeof setInterval> | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function beep(ac: AudioContext, freq: number, at: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.4, at);
  gain.gain.exponentialRampToValueAtTime(0.01, at + 0.5);
  osc.start(at);
  osc.stop(at + 0.5);
}

/** Two-tone alarm beep. */
export function playAlarm(): void {
  const ac = audio();
  if (!ac) return;
  beep(ac, 880, ac.currentTime);
  beep(ac, 1100, ac.currentTime + 0.2);
}

export function startAlarmLoop(): void {
  if (loop) return;
  playAlarm();
  loop = setInterval(playAlarm, 3000);
}

export function stopAlarmLoop(): void {
  if (loop) clearInterval(loop);
  loop = null;
}
