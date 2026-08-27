# npm skripty

Klient (`cd client`) a server (`cd server`) majú samostatné `package.json`. Inštaluj závislosti v každom zvlášť.

## Klient (`client/package.json`)

| Skript | Čo robí | Kedy spustiť |
|---|---|---|
| `npm run dev` | Vite dev server na `:5173` | manuálne počas vývoja |
| `npm run build` | TS build + Vite production build do `dist/` | pred nasadením; CI |
| `npm run preview` | Vite preview production buildu | pre lokálne overenie produkčného buildu |
| `npm run sitemap:check` | Overí, že každá URL v `dist/sitemap.xml` je prerendrovaná 200-URL bez koncovej lomky (súčasť `build`) | po builde, pri ladení SEO |
| `npm run type-check` | `tsc --noEmit` | CI, pre-commit, počas review |
| `npm run lint` | alias na `type-check` (ESLint sa pridá neskôr) | CI |
| `npm test` | placeholder (žiadne testy zatiaľ) | CI |

## Server (`server/package.json`)

| Skript | Čo robí | Kedy spustiť |
|---|---|---|
| `npm run dev` | `tsx watch src/index.ts` na `:3001` | manuálne počas vývoja |
| `npm run build` | `tsc` do `dist/` | pred nasadením |
| `npm start` | `node dist/index.js` | produkcia |
| `npm run type-check` | `tsc --noEmit` | CI |
| `npm run lint` | alias na `type-check` | CI |
| `npm test` | placeholder | CI |

## Pravidlo pre testovanie počas implementácie

- Zmeny v `client/src/**` → `cd client && npm run type-check && npm test`
- Zmeny v `server/src/**` → `cd server && npm run type-check && npm test`
- Zmeny v oboch → spusti oba

Stop hook (`stop-test-gate.cjs`) toto vyhodnotí automaticky a zablokuje koniec turnu ak niečo zlyhá.

## Pravidlo pre Bash

- Keď meníš `client/`, používaj `cd client && <cmd>` v jednom Bash volaní (shell stav nepretrvá medzi volaniami).
- Pre paralelné akcie (klient + server type-check) spusti dve `Bash` tool calls v jednej správe.
