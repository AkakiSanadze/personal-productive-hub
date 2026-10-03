import { $ } from '../core/dom';
import { formatClock, greetingKey } from '../core/format';
import { onLangChange, t } from '../core/i18n';
import { onTick } from '../core/ticker';

export function mountClock(): void {
  const clock = $<HTMLTimeElement>('#clock');
  const greeting = $('#greeting');
  let lastText = '';

  const render = () => {
    const now = new Date();
    const text = formatClock(now);
    if (text === lastText) return;
    lastText = text;
    clock.textContent = text;
    clock.dateTime = now.toISOString();
    greeting.textContent = t(greetingKey(now.getHours()));
  };

  render();
  onTick(render);
  onLangChange(() => {
    lastText = '';
    render();
  });
}
