import { $, h } from '../core/dom';
import { gradientFor, normalizeUrl } from '../core/format';
import { onLangChange, t } from '../core/i18n';
import type { Store } from '../core/storage';
import { KEYS, uid, type Link } from '../core/types';

export function mountLinks(store: Store): void {
  const grid = $('#linksGrid');
  const form = $<HTMLFormElement>('#linkForm');
  const nameInput = $<HTMLInputElement>('#linkName');
  const urlInput = $<HTMLInputElement>('#linkUrl');

  const get = () => store.get<Link[]>(KEYS.links, []);

  const render = () => {
    grid.replaceChildren(
      ...get().map((link) => {
        const icon = h('span', { class: 'link-icon', 'aria-hidden': 'true', text: '🔗' });
        icon.style.background = gradientFor(link.url);
        return h(
          'div',
          { class: 'link-item', 'data-id': link.id },
          h(
            'a',
            { class: 'link-anchor', href: link.url, rel: 'noopener noreferrer', title: link.url },
            icon,
            h('span', { class: 'link-name', text: link.name }),
          ),
          h('button', {
            type: 'button',
            class: 'link-delete',
            'aria-label': `${t('links.delete')}: ${link.name}`,
            text: '×',
          }),
        );
      }),
    );
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const url = normalizeUrl(urlInput.value);
    urlInput.setCustomValidity(url || !urlInput.value ? '' : t('links.invalid'));
    if (!url) {
      urlInput.reportValidity();
      return;
    }
    store.set(KEYS.links, [...get(), { id: uid(), name: name || new URL(url).hostname, url }]);
    nameInput.value = '';
    urlInput.value = '';
  });

  urlInput.addEventListener('input', () => urlInput.setCustomValidity(''));

  grid.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.link-delete');
    if (!btn) return;
    const id = btn.closest<HTMLElement>('.link-item')?.dataset.id;
    store.set(
      KEYS.links,
      get().filter((l) => l.id !== id),
    );
  });

  store.subscribe(KEYS.links, render);
  onLangChange(render);
  render();
}
