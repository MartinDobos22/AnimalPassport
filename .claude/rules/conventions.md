# Konvencie

## API error shape

Všetky chyby z `/api/*` musia mať tento tvar:

```json
{
  "error": {
    "message": "Človeku-čitateľná správa v slovenčine",
    "code": "OPTIONAL_MACHINE_CODE"
  }
}
```

Status kódy:
- `400` — validačná chyba (chýbajúci/zlý input)
- `401` — neautentifikovaný (zatiaľ neimplementované)
- `403` — autentifikovaný ale bez oprávnenia
- `404` — resource neexistuje
- `429` — rate limit
- `500` — neočakávaná interná chyba (nikdy neunkujte detail externej chyby používateľovi)
- `502` / `503` — externá služba (OpenAI, Vision) zlyhala

Klient **musí** kontrolovať `response.ok` a parsovať `{ error: { message } }`. `services/api.ts` to robí centrálne — používaj ho.

## Auth gate a blokovanie účtu

Poradie middleware pre authed routy je `firebaseAuth()` → `ensureUser` → (limiter/kvóta) → router.

- **Fail-closed je pravidlo.** Kontroly oprávnení porovnávaj proti očakávanej *povolenej* hodnote (`!== true`), nie proti zakázanej (`=== false`) — chýbajúci claim alebo prázdna odpoveď z DB nesmie request pustiť. Rovnako pri kvótach: chýbajúci riadok z RPC = 503, nie priechod.
- **`users.blocked_at`** (migrácia `0039`) kontroluje `ensureUser` a vracia 403 `ACCOUNT_BLOCKED`. Cache v `ensureUser` má 60 s TTL a `invalidateUserCache(appUserId)` sa volá pri zmene blokovania, aby zásah platil okamžite.
- **`ensureUserAllowBlocked`** je zámerná výnimka len pre `/api/account` (export, audit log, výmaz účtu) — GDPR práva podľa čl. 15, 17 a 20 musia ostať dostupné aj zablokovanému účtu. Nepoužívaj ju nikde inde.
- Dôvod blokovania (`blocked_reason`) je **povinný** — Podmienky používania (`/podmienky`) sľubujú používateľovi oznámenie s dôvodom a možnosť odvolania.

## OpenAI a Google Vision

- **Volania majú timeout.** Default OpenAI SDK nemá rozumný timeout — nastav explicitne (napr. 30 s pre analýzu, 10 s pre normalizáciu).
- **Token/cost guard:** pre dlhé inputy zváž truncation alebo odmietnutie request-u nad N znakov.
- **Output parsing:** AI odpovede VŽDY validuj. Ak čakáš JSON, použi `response_format: { type: "json_object" }` a obal `JSON.parse` v try/catch — vráť 502 ak parse zlyhá.
- **Žiadne PII** (mená, adresy) sa neposielajú do AI bez explicitného súhlasu používateľa.
- **Vision calls:** vždy posielaj `image_url: { url, detail: 'high' }`. Default `auto` pri väčších obrázkoch ide cez low-detail patche a OCR/passport scan kvalita drasticky padne.
- **Model IDs:** nikdy nehardcoduj `model: 'gpt-4o'` v servisoch — pridaj kľúč do `MODELS` v `server/src/services/aiService.ts` (exportované ako `AI_MODELS`) a dokumentuj v `.claude/rules/env-vars.md`.
- **Rate limit:** všetky AI/OCR endpointy MUSIA byť za `aiHeavyLimiter` v `server/src/index.ts`. Ak pridávaš AI endpoint pod existujúci router (napr. `/api/episodes/similar-summary` pod `episodesRouter`), zváž split routra alebo per-route limiter — celý `episodesRouter` momentálne pod AI limiterom nie je.
- **Per-user denný cap:** AI endpointy navyše MUSIA byť za `requireAiQuota()` (`middleware/aiQuota.ts`). Per-IP `aiHeavyLimiter` chráni len pred minútovým burstom; per-user denný cap (default 50/deň, env `AI_DAILY_LIMIT`) chráni OpenAI/Vision rozpočet pred power-userom alebo botom za prihlásením. Vyžaduje `ensureUser` pred sebou (potrebuje `req.appUserId`). Atómická check-and-increment cez Supabase RPC `app_increment_ai_quota` (migrácia `0009_ai_quota.sql`). Pri prekročení 429 + `code: "DAILY_AI_LIMIT"`.

## OCR pipeline (`extractTextFromAttachment` v `aiService.ts`)

OCR má fallback ladder, v tomto poradí:

1. **Google Vision API** — primárny, najlepšia kvalita pre tlačený text na fotkách.
2. **OpenAI vision** — fallback ak Vision zlyhá alebo nie je nakonfigurované.
3. **pdf-parse** — pre PDF prílohy bez OCR.
4. **`none`** — všetko zlyhalo; klient dostane prázdny `extractedText` so `source: 'none'`.

Klient (`client/src/services/api.ts`) prijíma `source` v response — používa ho na UX (napr. „text získaný cez OpenAI vision, kvalita môže byť nižšia").

## Sanitizácia OCR textu pred AI promptom

OCR text z užívateľského PDF/foto môže obsahovať **prompt injection** (napr. "Ignore previous instructions and …"). Pred vložením do AI promptu **MUSÍ** prejsť cez `server/src/utils/sanitizeOcrText.ts` → `wrapOcrForPrompt`. Funkcia obalí text do jasných delimiterov, trimne nadmernú dĺžku a odstráni control characters.

Žiadny nový kód nesmie vkladať raw OCR string do `messages` poľa pre OpenAI bez prechodu cez `wrapOcrForPrompt`.

## Exam alias / typ vyšetrenia

Server udržuje mapu veterinárnych skratiek a typov vyšetrenia v `server/src/services/`:

- `examAlias.ts` — kanonický zoznam skratiek (napr. USG, RTG, EKG, PPT, …) a mapa `EXAM_ALIAS_TO_TYPE`. Pri pridávaní novej skratky uprav túto mapu **a** type guard `isExamAlias`.
- `examAliasPrompts.ts` — prompt template per typ vyšetrenia.
- `examType.ts` — heuristická detekcia typu z OCR textu, keď klient `examAlias` neposlal.

Frontend posiela voliteľný `examAlias` do `POST /api/analyze` (file mode). Backend ho validuje cez `isExamAlias` — neznáme hodnoty **ignoruj** (nehadž 400, použijú sa heuristiky).

## Logging

`server/src/utils/logger.ts` je jediný logger. Nikdy nepoužívaj `console.log` v produkčnom kóde (povolené len pre debug počas vývoja, vyhoď pred commitom).

### Čo NIKDY nelogovať

- API kľúče (`OPENAI_API_KEY`, `GOOGLE_VISION_API_KEY`) — ani omylom v error message.
- Celý `req.body` ak obsahuje base64 obrázky alebo obsiahly text — loguj len metadáta (size, type).
- Cookies, Authorization header.
- AI prompt s používateľským PII.

### Čo logovať

- Method, path, status, duration (už máš v `index.ts`).
- Error stack pri 5xx (do servera, nie do response).
- Externé API failure: name služby, status, korelované request ID.

## Komentáre v kóde

Default: žiadne. Komentár píš len keď WHY nie je zrejmé:
- Workaround pre konkrétny bug → odkaz na issue/PR.
- Skrytý invariant ktorý reader nevidí.
- Performance dôvod pre netriviálnu voľbu.

**Nikdy** komentár ktorý opisuje WHAT (`// fetch users`) — názov funkcie/premennej to musí povedať.

## Naming

- Súbory komponentov: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utility/services: `camelCase.ts`
- Typy: `PascalCase` (interface alebo type)
- Constants: `UPPER_SNAKE_CASE`
- Booleans: prefix `is/has/should` (`isLoading`, `hasError`)

## Importy (poradie)

```ts
// 1. React + lib
import { useState } from 'react';
import { Routes } from 'react-router-dom';

// 2. MUI
import { Button, Card } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// 3. Interné absolútne (ak by boli aliasy)
// 4. Interné relatívne
import { useAnalyze } from '../hooks/useAnalyze';
import { ScoreCard } from './ScoreCard';

// 5. Typy (oddeľ ak je veľa)
import type { Analysis } from '../types';
```
