/** Single shared ticker so all timers update in lockstep with one interval. */
type Tick = (now: number) => void;
const subs = new Set<Tick>();
let handle: ReturnType<typeof setInterval> | null = null;

export function onTick(cb: Tick): () => void {
  subs.add(cb);
  if (!handle) handle = setInterval(() => subs.forEach((s) => s(Date.now())), 250);
  return () => {
    subs.delete(cb);
    if (subs.size === 0 && handle) {
      clearInterval(handle);
      handle = null;
    }
  };
}
