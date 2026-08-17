# Repo shape

```
AnimalPassport/
├── client/                          # Frontend (React 18 + MUI 6 + Vite + PWA)
│   ├── public/
│   │   ├── manifest.json            # PWA manifest
│   │   ├── sw.js                    # Service Worker — CACHE_VERSION='animalPassport-vN', bumpuj!
│   │   ├── offline.html             # Self-contained offline fallback (žiadne externé requesty)
│   │   └── icons/                   # icon-192.png, icon-512.png
│   ├── src/
│   │   ├── main.tsx                 # Entry, registruje SW (len v PROD)
│   │   ├── App.tsx                  # ThemeProvider + Router + SK slugy
│   │   ├── theme.ts                 # MD3 light + dark, JEDINÉ MIESTO PRE FARBY
│   │   ├── components/              # Reusable UI (PascalCase.tsx)
│   │   │   ├── episodes/            # Komponenty pre denník epizód
│   │   │   ├── healthPassport/      # Komponenty pre zdravotný pas (timeline, add-record, …)
│   │   │   └── vetCard/             # Komponenty pre kartu pre veterinára (export)
│   │   ├── pages/                   # Route-level komponenty (7 stránok)
│   │   ├── hooks/                   # Custom hooky (useFoo.ts, jeden hook/file)
│   │   ├── services/                # API klienti (api.ts, dogHealthApi.ts)
│   │   ├── utils/                   # Čisté helpery (logger, imageDownscale, episodeFilters, vetVisitHelper)
│   │   └── types/                   # TS typy (index.ts, healthEpisode.ts, dogHealth.ts)
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── server/                          # Backend (Express 4 + TS, OpenAI + Google Vision)
│   ├── src/
│   │   ├── index.ts                 # Express bootstrap, CORS, rate limiters (global + AI-heavy)
│   │   ├── routes/                  # 4 routes: analyze, episodes, extractText, interpretPassport
│   │   ├── services/                # AI/OCR/business: aiService, episodeAiService, examAlias*, examType
│   │   ├── middleware/              # errorHandler (vždy posledný app.use)
│   │   ├── utils/                   # logger, sanitizeOcrText (sanitizuje OCR pred vložením do promptu)
│   │   └── types/                   # TS typy (index.ts, episode.ts)
│   ├── tsconfig.json
│   └── package.json
├── docs/                            # Produktové dokumenty
│   └── dog-health-modules-design.md # Návrh dátového modelu zdravotného pasu (cieľ: PostgreSQL)
├── .claude/                         # Pravidlá, skills, agenti, hooks, settings.json
├── .github/workflows/               # CI: client, server, audit, gitleaks
├── CLAUDE.md                        # Hlavný systémový prompt (root)
└── README.md
```

## Aktuálne stránky (`client/src/pages/`)

| Súbor | Route | Doména |
|---|---|---|
| `AnalyzePage.tsx` | `/` | Analýza krmiva (textom alebo súborom) |
| `PetProfilePage.tsx` | `/profily` | Profily zvierat |
| `HistoryPage.tsx` | `/historia` | História analýz (localStorage) |
| `HealthPassportPage.tsx` | `/zdravotny-pas`, `/zdravotny-pas/prehlad`, `/zdravotny-pas/zaznamy`, `/zdravotny-pas/novy-zaznam` | Zdravotný pas |
| `VetCardPage.tsx` | `/karta-pre-veterinara` | Print-friendly karta pre veterinára |
| `EpisodeDiaryPage.tsx` | `/dennik` | Denník zdravotných epizód |
| `AboutPage.tsx` | `/o-aplikacii` | O aplikácii |
| `TermsRoute.tsx` → `TermsPage.tsx` | `/podmienky` | Podmienky používania (verejné, SK+EN cez `TermsContent.tsx`). Obsahuje klauzulu o obmedzení/zablokovaní/zrušení účtu — pri zmene mechanizmu blokovania updatni **aj** tento text. |

## Aktuálne API endpointy (`server/src/routes/`)

| Súbor | Endpoint | Rate limit | Účel |
|---|---|---|---|
| `analyze.ts` | `POST /api/analyze` | `aiHeavyLimiter` (20/min) | Textová alebo súborová analýza krmiva |
| `episodes.ts` | `GET/POST /api/episodes/*` | `aiHeavyLimiter` (20/min) | Epizódy + `POST /similar-summary` (AI, navyše `requireAiQuota()` per-route) |
| `extractText.ts` | `POST /api/extract-text` | `aiHeavyLimiter` | OCR fallback ladder (Vision → OpenAI → pdf-parser) |
| `interpretPassport.ts` | `POST /api/interpret-passport` | `aiHeavyLimiter` | AI parsing zdravotného pasu (vakcinácie, …) |
| `scanMedication.ts` | `POST /api/scan-medication` | `aiHeavyLimiter` + `requireAiQuota()` | Rozpoznanie **obalu prípravku** z fotky (blister, škatuľka, pipeta) → názov, účinné látky, šarža, expirácia balenia, navrhnutý typ záznamu. Vracia LEN prečítané údaje; bezpečnostné kontroly (expirácia, hmotnostný rozsah, druh) robí klient v `utils/medicationScanChecks.ts`. Odlišuje sa od `interpret-passport`, ktorý spracúva **dokumenty**, nie produkty. |
| `consent.ts` | `GET/POST /api/consent/ai-processing` | `globalLimiter` | Trvalý súhlas s AI/OCR spracovaním zdravotných dokumentov (`users.ai_processing_consent_at`, migrácia `0041`). Zdroj pravdy pre `privacyGuard` — súhlas sa NEBERIE z tela AI requestu. |
| `articles.ts` | `GET /api/articles`, `GET /api/articles/:slug` | `globalLimiter`, **bez auth** | Verejné články poradne (read-only z DB). Mountnuté PRED `firebaseAuth`. |
| `admin.ts` | `GET /api/admin/status`, `GET/POST/PUT/DELETE /api/admin/articles[/:slug]`, `POST /api/admin/articles/upload-image`, `POST /api/admin/articles/publish` | `firebaseAuth` + `ensureUser` (+ `requireAdmin` na `/articles`) | Admin správa článkov (write, upload cover obrázka, publish = Netlify build hook). Gate cez env `ADMIN_EMAILS`. `status` vráti `{ isAdmin }`. |
| `admin.ts` (users) | `GET /api/admin/users`, `POST /api/admin/users/:id/admin`, `POST /api/admin/users/:id/blocked` | `firebaseAuth` + `ensureUser` + `requireAdmin` | Správa účtov. `blocked` nastaví `users.blocked_at` + `blocked_reason` (migrácia `0039`); dôvod je pri blokovaní povinný. Zoznam vracia aj `emailVerified` / `emailVerifiedAt` / `authProvider` (migrácia `0040`). |
| `index.ts` | `GET /api/health` | (žiadny) | Health check |

> **Vzor:** `/api/episodes/similar-summary` je AI volanie pod `episodesRouter`. Celý router je za `aiHeavyLimiter`, ale `requireAiQuota()` je aplikované **per-route** len na `/similar-summary` (`episodes.ts`), aby bežné CRUD čítania/zápisy epizód nekonzumovali denný AI cap. Tento vzor (router-wide limiter + per-route quota) replikuj pri pridávaní AI endpointu pod zmiešaný router.

## Kde čo pridať

| Čo pridávaš | Kam |
|---|---|
| Nový API endpoint | `server/src/routes/<resource>.ts`, registruj v `server/src/index.ts`. Ak volá AI/OCR, daj pod `aiHeavyLimiter`. |
| Nová biznis služba (server) | `server/src/services/<Service>.ts` |
| Nová UI stránka | `client/src/pages/<Name>Page.tsx`, route v `App.tsx` (SK slug) |
| Reusable UI komponent | `client/src/components/<Name>.tsx` (root) alebo do `episodes/`, `healthPassport/`, `vetCard/` subadresára podľa domény |
| Hook pre data/štát | `client/src/hooks/use<Name>.ts` |
| API call wrapper | rozšír `client/src/services/api.ts` (general) alebo `dogHealthApi.ts` (zdravotný pas) |
| Zdieľaný typ klient↔server | duplikuj v `client/src/types/` aj `server/src/types/` (zatiaľ nie je shared package — vedome akceptovaný drift risk) |
| Env premenná | `.env` (lokálne), zdokumentuj v `.claude/rules/env-vars.md` a `README.md` |
| Nová doména (napr. nutričný plán) | Zváž vlastný komponent subadresár, vlastný hook, vlastný `*Api.ts` service. Riadi sa rovnakou štruktúrou ako `episodes/` a `healthPassport/`. |

## Čo NIE je súčasť repo (a nepridávaj bez explicitnej úlohy)

- `node_modules/` — gitignored
- `dist/`, `build/` — build outputy, gitignored
- `.env`, `.env.local` — secrets, NIKDY nekomituj
- Lock súbory iné než `package-lock.json` (žiadny pnpm/yarn)
- Databáza — všetka perzistencia ide zatiaľ cez `localStorage` na klientovi (pozri `docs/dog-health-modules-design.md` pre cieľový stav)
