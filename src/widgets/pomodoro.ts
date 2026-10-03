import { playAlarm } from '../core/audio';
import { $ } from '../core/dom';
import { displaySeconds, formatMMSS, remainingMs } from '../core/format';
import { onLangChange, t } from '../core/i18n';
import { notify, requestNotificationPermission } from '../core/notify';
import type { Store } from '../core/storage';
import { onTick } from '../core/ticker';
import { KEYS, type PomodoroMode, type PomodoroState } from '../core/types';

export const MODE_MS: Record<PomodoroMode, number> = {
  pomodoro: 25 * 60_000,
  break: 5 * 60_000,
  deepwork: 50 * 60_000,
};

const CIRCUMFERENCE = 2 * Math.PI * 100;

const initial = (mode: PomodoroMode = 'pomodoro'): PomodoroState => ({
  mode,
  endTime: null,
  remainingMs: MODE_MS[mode],
});

export function mountPomodoro(store: Store): void {
  const display = $('#timer');
  const ring = $<SVGCircleElement & HTMLElement>('#timerRingProgress');
  const container = $('#timerRingContainer');
  const startBtn = $<HTMLButtonElement>('#startBtn');
  const resetBtn = $<HTMLButtonElement>('#resetBtn');
  const modeBtns = document.querySelectorAll<HTMLButtonElement>(
    '[data-widget="pomodoro"] [data-mode]',
  );

  ring.style.strokeDasharray = String(CIRCUMFERENCE);

  const get = () => store.get<PomodoroState>(KEYS.pomodoro, initial());
  const set = (s: PomodoroState) => store.set(KEYS.pomodoro, s);

  let lastShown = -1;

  const render = (now = Date.now()) => {
    const s = get();
    const ms = remainingMs(s, now);

    if (s.endTime !== null && ms <= 0) {
      set(initial(s.mode));
      notify(t('pomodoro.done'));
      playAlarm();
      return; // store subscription re-renders
    }

    const secs = displaySeconds(ms);
    if (secs !== lastShown) {
      lastShown = secs;
      const text = formatMMSS(secs);
      display.textContent = text;
      document.title = s.endTime !== null ? `${text} · PPH` : t('app.title');
    }
    ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - ms / MODE_MS[s.mode]));
    container.classList.toggle('break', s.mode === 'break');
    container.classList.toggle('deepwork', s.mode === 'deepwork');
    startBtn.textContent = t(s.endTime !== null ? 'pomodoro.pause' : 'pomodoro.start');
    modeBtns.forEach((b) => {
      const active = b.dataset.mode === s.mode;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
  };

  startBtn.addEventListener('click', () => {
    const s = get();
    if (s.endTime !== null) {
      set({ ...s, endTime: null, remainingMs: remainingMs(s) });
    } else {
      requestNotificationPermission();
      set({ ...s, endTime: Date.now() + s.remainingMs });
    }
  });

  resetBtn.addEventListener('click', () => set(initial(get().mode)));

  modeBtns.forEach((b) =>
    b.addEventListener('click', () => set(initial(b.dataset.mode as PomodoroMode))),
  );

  const rerender = () => {
    lastShown = -1;
    render();
  };
  store.subscribe(KEYS.pomodoro, rerender);
  onLangChange(rerender);
  onTick((now) => {
    if (get().endTime !== null) render(now);
  });
  render();
}
