import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/300.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/main.css';

import { $ } from './core/dom';
import { applyTranslations, getLang, setLang } from './core/i18n';
import { migrateLegacy } from './core/migrate';
import { applyTheme, getSettings, updateSettings } from './core/settings';
import { LocalStorageBackend, Store } from './core/storage';
import { KEYS, type ThemeChoice } from './core/types';
import { mountClock } from './widgets/clock';
import { mountCountdowns } from './widgets/countdowns';
import { mountCrypto } from './widgets/crypto';
import { mountLinks } from './widgets/links';
import { mountNotes } from './widgets/notes';
import { mountPomodoro } from './widgets/pomodoro';
import { mountTodos } from './widgets/todos';

async function main() {
  const store = new Store(new LocalStorageBackend());
  await store.init();
  migrateLegacy(store);

  const settings = getSettings(store);
  applyTheme(settings.theme);
  setLang(settings.lang);

  // Header controls
  const langBtn = $<HTMLButtonElement>('#langBtn');
  const syncLangBtn = () => (langBtn.textContent = getLang() === 'ka' ? 'EN' : 'KA');
  syncLangBtn();
  langBtn.addEventListener('click', () => {
    updateSettings(store, { lang: getLang() === 'ka' ? 'en' : 'ka' });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]').forEach((btn) =>
    btn.addEventListener('click', () => {
      updateSettings(store, { theme: btn.dataset.themeChoice as ThemeChoice });
    }),
  );

  // Settings changes (from this tab or another) drive theme + language.
  store.subscribe(KEYS.settings, () => {
    const s = getSettings(store);
    applyTheme(s.theme);
    if (s.lang !== getLang()) {
      setLang(s.lang);
      syncLangBtn();
    }
  });

  mountClock();
  mountTodos(store);
  mountNotes(store);
  mountLinks(store);
  mountCrypto(store);
  mountPomodoro(store);
  mountCountdowns(store);

  applyTranslations();
  document.documentElement.classList.add('ready');
}

void main();
