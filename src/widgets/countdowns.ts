import { startAlarmLoop, stopAlarmLoop } from '../core/audio';
import { $, h, svg } from '../core/dom';
import { displaySeconds, formatHMS, remainingMs } from '../core/format';
import { onLangChange, t } from '../core/i18n';
import { notify, requestNotificationPermission } from '../core/notify';
import type { Store } from '../core/storage';
import { onTick } from '../core/ticker';
import { KEYS, uid, type Countdown } from '../core/types';

const R = 20;
const CIRC = 2 * Math.PI * R;

export function mountCountdowns(store: Store): void {
  const form = $<HTMLFormElement>('#countdownForm');
  const labelIn = $<HTMLInputElement>('#countdownLabel');
  const hIn = $<HTMLInputElement>('#countdownHours');
  const mIn = $<HTMLInputElement>('#countdownMinutes');
  const sIn = $<HTMLInputElement>('#countdownSeconds');
  const list = $('#countdownsList');

  /** Ringing ids are per-tab UI state, not persisted. */
  const ringing = new Set<string>();

  const get = () => store.get<Countdown[]>(KEYS.countdowns, []);
  const save = (cds: Countdown[]) => store.set(KEYS.countdowns, cds);
  const update = (id: string, fn: (c: Countdown) => Countdown) =>
    save(get().map((c) => (c.id === id ? fn(c) : c)));

  const syncAlarm = () => (ringing.size ? startAlarmLoop() : stopAlarmLoop());

  const actionBtn = (action: string, label: string, text: string, extra = '') =>
    h('button', {
      type: 'button',
      class: extra,
      'data-action': action,
      'aria-label': label,
      title: label,
      text,
    });

  const render = () => {
    const now = Date.now();
    list.replaceChildren(
      ...get().map((cd) => {
        const ms = remainingMs(cd, now);
        const isRinging = ringing.has(cd.id);
        const running = cd.endTime !== null;
        const ringEl = svg('svg', {
          class: 'countdown-ring',
          viewBox: '0 0 50 50',
          'aria-hidden': 'true',
        });
        ringEl.append(
          svg('circle', { class: 'countdown-ring-bg', cx: 25, cy: 25, r: R }),
          svg('circle', {
            class: 'countdown-ring-progress',
            cx: 25,
            cy: 25,
            r: R,
            'stroke-dasharray': CIRC,
            'stroke-dashoffset': CIRC * (1 - ms / cd.totalMs),
          }),
        );
        return h(
          'div',
          { class: `countdown-item${isRinging ? ' ringing' : ''}`, 'data-id': cd.id },
          h('div', { class: 'countdown-item-icon', 'aria-hidden': 'true', text: '⏱️' }),
          h(
            'div',
            { class: 'countdown-item-info' },
            h('div', { class: 'countdown-item-label', text: cd.label }),
            h('div', {
              class: 'countdown-item-time',
              role: 'timer',
              text: formatHMS(displaySeconds(ms)),
            }),
          ),
          ringEl,
          h(
            'div',
            { class: 'countdown-item-actions' },
            isRinging
              ? actionBtn('silence', t('countdown.silence'), t('countdown.silence'))
              : actionBtn(
                  'toggle',
                  t(running ? 'countdown.pause' : 'countdown.resume'),
                  running ? '⏸' : '▶️',
                ),
            actionBtn('reset', t('countdown.reset'), '↺'),
            actionBtn('delete', t('countdown.delete'), '×', 'delete'),
          ),
        );
      }),
    );
  };

  /** Cheap per-tick update of times and rings; full render only when something finishes. */
  const tick = (now: number) => {
    let finished = false;
    for (const cd of get()) {
      if (cd.endTime === null) continue;
      const ms = remainingMs(cd, now);
      if (ms <= 0) {
        finished = true;
        ringing.add(cd.id);
        notify(t('countdown.done', { label: cd.label }));
        update(cd.id, (c) => ({ ...c, endTime: null, remainingMs: 0 }));
        continue;
      }
      const row = list.querySelector<HTMLElement>(`[data-id="${CSS.escape(cd.id)}"]`);
      if (!row) continue;
      row.querySelector('.countdown-item-time')!.textContent = formatHMS(displaySeconds(ms));
      row
        .querySelector('.countdown-ring-progress')!
        .setAttribute('stroke-dashoffset', String(CIRC * (1 - ms / cd.totalMs)));
    }
    if (finished) syncAlarm();
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const num = (el: HTMLInputElement) => Math.max(0, parseInt(el.value, 10) || 0);
    const totalMs = (num(hIn) * 3600 + num(mIn) * 60 + num(sIn)) * 1000;
    if (totalMs <= 0) return;
    requestNotificationPermission();
    const label = labelIn.value.trim() || t('countdown.label', { n: get().length + 1 });
    save([
      ...get(),
      { id: uid(), label, totalMs, endTime: Date.now() + totalMs, remainingMs: totalMs },
    ]);
    form.reset();
  });

  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    const id = btn?.closest<HTMLElement>('.countdown-item')?.dataset.id;
    if (!btn || !id) return;
    switch (btn.dataset.action) {
      case 'toggle':
        update(id, (c) =>
          c.endTime !== null
            ? { ...c, endTime: null, remainingMs: remainingMs(c) }
            : { ...c, endTime: Date.now() + (c.remainingMs > 0 ? c.remainingMs : c.totalMs) },
        );
        break;
      case 'silence':
        ringing.delete(id);
        syncAlarm();
        render();
        break;
      case 'reset':
        ringing.delete(id);
        syncAlarm();
        update(id, (c) => ({ ...c, endTime: null, remainingMs: c.totalMs }));
        break;
      case 'delete':
        ringing.delete(id);
        syncAlarm();
        save(get().filter((c) => c.id !== id));
        break;
    }
  });

  store.subscribe(KEYS.countdowns, render);
  onLangChange(render);
  onTick(tick);
  render();
}
