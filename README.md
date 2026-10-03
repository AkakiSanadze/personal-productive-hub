# Personal Productive Hub (PPH)

**A free, open-source, privacy-first productivity dashboard** — tasks, notes, quick links, Pomodoro, countdowns and live crypto prices on one beautiful screen.

> 🇬🇪 ქართული და 🇬🇧 English · No accounts · No tracking · Your data never leaves your browser

## Features

- 📋 **Tasks** — add, complete, delete; synced across open tabs
- 📝 **Quick notes** — autosaved as you type
- 🔗 **Quick links** — one-click shortcuts with safe URL validation
- 💰 **Crypto prices** — BTC, ETH, SOL, ADA, SUI, ATOM, VVV, DIEM with 24h change (CoinGecko)
- 🍅 **Pomodoro / Break / Deep Work** — accurate even in background tabs, survives reloads
- ⏳ **Multiple named countdowns** with alarm and desktop notifications
- 🌗 Dark / light / system theme · 🌐 Georgian & English

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright)
npm run lint       # ESLint + Prettier
npm run build      # production build → dist/
```

### Project structure

```
src/
  core/      storage, migration, i18n, formatting, audio, notifications
  widgets/   one module per widget (todos, notes, links, crypto, pomodoro, countdowns, clock)
  locales/   ka.ts (source of truth), en.ts
  styles/
tests/
  unit/      Vitest
  e2e/       Playwright
```

### Adding a translation

Copy `src/locales/en.ts` to `src/locales/<lang>.ts`, translate the values, and register it in `src/core/i18n.ts`. TypeScript will flag any missing keys.

## Privacy

PPH stores everything locally in your browser. The only network request is to the public CoinGecko API for crypto prices. No analytics, no cookies, no accounts.

## Roadmap

Browser extension (Chrome/Firefox new tab) · installable PWA · drag & drop widget layout · command palette · weather · focus statistics · backup/import. See the issues for details.

## License

[MIT](LICENSE)
