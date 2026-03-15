# GranuleCheck – Hodnotenie psích granúl 🐕

Inteligentná PWA aplikácia na analýzu zloženia psích granúl a zdravotných podkladov. Môžete skopírovať text pre analýzu granúl alebo nahrať PDF/fotku (napr. veterinárny bloček, krvné testy, alergologické výsledky) a aplikácia vypíše extrahovaný obsah súboru.

## Technológie

| Vrstva | Technológie |
|--------|-------------|
| **Frontend** | React 18, TypeScript, Material UI 5 (MD3 štýl), Vite |
| **Backend** | Node.js, Express, TypeScript |
| **PWA** | Service Worker, Web App Manifest, Offline podpora |

## Štruktúra projektu

```
granule-check/
├── client/                     # Frontend (Vite + React)
│   ├── public/
│   │   ├── manifest.json       # PWA manifest
│   │   ├── offline.html        # Offline fallback stránka
│   │   ├── sw.js               # Service Worker
│   │   └── icons/              # PWA ikony (192px, 512px)
│   ├── src/
│   │   ├── main.tsx            # Vstupný bod
│   │   ├── App.tsx             # Router + Theme provider
│   │   ├── theme.ts            # MD3 light + dark téma
│   │   ├── components/
│   │   │   ├── Layout.tsx      # Spotify-like layout (drawer/bottom nav)
│   │   │   ├── ScoreCard.tsx   # Kruhové skóre 0-100
│   │   │   ├── ProsConsCard.tsx # Výhody / Nevýhody
│   │   │   └── RecommendationChip.tsx # Odporúčania
│   │   ├── pages/
│   │   │   ├── AnalyzePage.tsx # Hlavná stránka s formulárom
│   │   │   ├── HistoryPage.tsx # História uložených analýz
│   │   │   └── AboutPage.tsx   # O aplikácii
│   │   ├── hooks/
│   │   │   ├── useAnalyze.ts   # Hook pre API volanie
│   │   │   └── useLocalStorage.ts # Generic localStorage hook
│   │   ├── services/
│   │   │   └── api.ts          # Fetch wrapper pre /api/analyze
│   │   └── types/
│   │       └── index.ts        # TypeScript rozhrania
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                     # Backend (Express)
│   ├── src/
│   │   ├── index.ts            # Express server (port 3001)
│   │   ├── routes/
│   │   │   └── analyze.ts      # POST /api/analyze
│   │   ├── services/
│   │   │   └── aiService.ts    # Mock AI analýza zloženia
│   │   ├── middleware/
│   │   │   └── errorHandler.ts # Globálny error handler
│   │   └── types/
│   │       └── index.ts        # Zdieľané TypeScript typy
│   ├── tsconfig.json
│   └── package.json
└── README.md
```

## Inštalácia a spustenie

### Predpoklady

- **Node.js 18+** (odporúčame 20 LTS)
- **npm** 9+

### 1. Inštalácia závislostí

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Spustenie vývojového servera

V dvoch termináloch:

```bash
# Terminál 1 – Backend (port 3001)
cd server
npm run dev

# Terminál 2 – Frontend (port 5173)
cd client
npm run dev
```

Aplikácia bude dostupná na **http://localhost:5173**

## Testovanie na mobile

1. Zistite IP adresu vášho počítača (napr. `192.168.1.100`)
2. Uistite sa, že mobil je na rovnakej Wi-Fi sieti
3. Vo `vite.config.ts` pridajte do `server` bloku:
   ```ts
   host: '0.0.0.0'
   ```
4. Na mobile otvorte `http://192.168.1.100:5173`
5. V Chrome: menu → "Pridať na plochu" pre PWA zážitok

## Generovanie PWA ikon

Aktuálne ikony sú placeholder. Pre produkciu:

1. Navštívte [realfavicongenerator.net](https://realfavicongenerator.net)
2. Nahrajte logo vo formáte SVG/PNG (min. 512×512)
3. Stiahnuté ikony nahraďte v `client/public/icons/`

## Konfigurácia AI a OCR

Backend používa:

- `OPENAI_API_KEY` pre analýzu granúl a normalizáciu textu.
- `GOOGLE_VISION_API_KEY` pre OCR sken obrázkov cez Google Vision API.

Príklad `.env` pre backend:

```env
OPENAI_API_KEY=...
GOOGLE_VISION_API_KEY=...
```

## Ďalšie kroky pre produkciu

- [ ] **Databáza** – PostgreSQL / MongoDB pre ukladanie analýz
- [ ] **Autentifikácia** – Prihlasovanie používateľov (Google OAuth, email)
- [ ] **Reálne AI** – Napojenie na Claude / GPT pre skutočnú analýzu
- [ ] **Deployment** – Docker + Vercel (frontend) + Railway/Fly.io (backend)
- [ ] **Testy** – Vitest (unit), Playwright (E2E)
- [ ] **CI/CD** – GitHub Actions pre automatický build a deploy
- [ ] **SEO** – Server-side rendering alebo prerendering
- [ ] **Notifikácie** – Push notifikácie pre nové funkcie

## Produktový návrh rozšírení

Detailný návrh dátového modelu, API vrstvy, UX flow a notifikačných pravidiel pre „zdravotný pas psa“ nájdete v dokumente `docs/dog-health-modules-design.md`.
