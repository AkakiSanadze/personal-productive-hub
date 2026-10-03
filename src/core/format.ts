/** Pure helpers — unit-tested in tests/unit. */

const pad = (n: number) => String(n).padStart(2, '0');

/** 1500 → "25:00" */
export function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** 3725 → "01:02:05" */
export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function formatClock(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatHM(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type GreetingKey =
  'greeting.morning' | 'greeting.afternoon' | 'greeting.evening' | 'greeting.night';

export function greetingKey(hour: number): GreetingKey {
  if (hour >= 5 && hour < 12) return 'greeting.morning';
  if (hour >= 12 && hour < 17) return 'greeting.afternoon';
  if (hour >= 17 && hour < 21) return 'greeting.evening';
  return 'greeting.night';
}

/** Remaining ms for a timer that is either running (endTime) or paused (remainingMs). */
export function remainingMs(
  timer: { endTime: number | null; remainingMs: number },
  now = Date.now(),
): number {
  return timer.endTime === null ? timer.remainingMs : Math.max(0, timer.endTime - now);
}

/** Seconds shown to the user — ceil, so a fresh 25:00 timer doesn't instantly show 24:59. */
export function displaySeconds(ms: number): number {
  return Math.ceil(ms / 1000);
}

export function formatPrice(price: number, currency: 'usd' | 'eur' = 'usd'): string {
  const digits = price >= 1000 ? 0 : price >= 1 ? 2 : price >= 0.01 ? 4 : 6;
  const n = price.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return (currency === 'eur' ? '€' : '$') + n;
}

/** Adds https:// when missing and rejects non-http(s) schemes such as `javascript:`. */
export function normalizeUrl(input: string): string | null {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = 'https://' + raw;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
    return url.href;
  } catch {
    return null;
  }
}

const GRADIENTS = [
  'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  'linear-gradient(135deg, #00b894 0%, #55efc4 100%)',
  'linear-gradient(135deg, #fdcb6e 0%, #ffeaa7 100%)',
  'linear-gradient(135deg, #e17055 0%, #fab1a0 100%)',
  'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)',
  'linear-gradient(135deg, #d63384 0%, #ff6bcb 100%)',
  'linear-gradient(135deg, #20c997 0%, #63e6be 100%)',
];

/** Stable gradient for a given seed string. */
export function gradientFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length]!;
}
