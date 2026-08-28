# Environment premenné

## Server (`server/.env`)

| Premenná | Povinná | Default | Popis |
|---|---|---|---|
| `PORT` | nie | `3001` | Port Express servera |
| `OPENAI_API_KEY` | áno (na analýzu) | — | Kľúč pre OpenAI API |
| `GOOGLE_VISION_API_KEY` | áno (na OCR) | — | Kľúč pre Google Vision API |
| `NODE_ENV` | nie | `development` | `production` v deployi |
| `CORS_ORIGIN` | odporúčané v prod | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed originy. `server/src/index.ts` ich reálne číta (split podľa `,`); ak premenná chýba, fallbackne na localhost. V prod (Render) nastav na Netlify URL **bez** koncového `/`. |
| `FIREBASE_PROJECT_ID` | áno (auth) | — | Firebase projekt ID (Service Account). |
| `FIREBASE_CLIENT_EMAIL` | áno (auth) | — | Service Account client email. |
| `FIREBASE_PRIVATE_KEY` | áno (auth) | — | Service Account privátny kľúč; novelines ako `\n` v úvodzovkách (`config/firebase.ts` ich nahradí). Z Firebase Console → Project Settings → Service Accounts → Generate new private key. |
| `SUPABASE_URL` | áno (DB) | — | URL Supabase projektu. Z Supabase Dashboard → Project Settings → API. |
| `SUPABASE_SERVICE_ROLE_KEY` | áno (DB) | — | **TAJOMSTVO** — service_role kľúč (obchádza RLS). Výhradne server-side, NIKDY do klienta. Z Supabase Dashboard → Project Settings → API. Číta `config/supabase.ts`. |
| `AI_DAILY_LIMIT` | nie | `200` | Maximum AI volaní (analyze, OCR, interpret-passport, food-safety, similar-summary) na používateľa za kalendárny deň (UTC). Cost safety net — chráni pred power-userom/botom ktorý by vyžral OpenAI/Vision kredit. Default je `200`, aby nový user pri onboardingu (nahratie celej histórie z pasu = mnoho strán × OCR + per-dokument interpret) nenarazil na limit uprostred prvého importu; kolektívny abuse chráni `AI_GLOBAL_DAILY_CAP`. Vynucuje `middleware/aiQuota.ts` cez Supabase RPC `app_increment_ai_quota`. Pri prekročení vracia 429 s `code: "DAILY_AI_LIMIT"`. |
| `AI_GLOBAL_DAILY_CAP` | nie | `5000` | Globálny kolektívny denný strop AI volaní naprieč všetkými usermi. Kill switch ak by trending alebo botnet vystrelil OpenAI faktúru. Vynucuje `middleware/aiQuota.ts` cez Supabase RPC `app_increment_global_ai_quota` (migrácia `0011_global_ai_quota.sql`). Pri 80% prahu loguje WARN; pri prekročení limitu vracia 503 s `code: "AI_GLOBAL_CAP_EXCEEDED"`. |
| `ADMIN_EMAILS` | nie (povinné pre admin) | prázdne (žiadny admin) | Comma-separated zoznam e-mailov s admin oprávnením (správa článkov poradne). Porovnáva sa case-insensitive proti `req.user.email` z Firebase tokenu. Vynucuje `middleware/requireAdmin.ts` na `/api/admin/articles` (write). `GET /api/admin/status` vráti `{ isAdmin }`. Bez nastavenia nemá admin práva nikto. |
| `NETLIFY_BUILD_HOOK_URL` | nie (povinné pre „Publikovať na web" a auto-redeploy) | prázdne (feature vráti 503 / auto-redeploy sa ticho preskočí) | URL Netlify build hooku. Spustí rebuild webu (prerender z DB). Vytvor v Netlify → Site settings → Build & deploy → Build hooks. Je to secret (kto pozná URL, spustí build) — nikdy ho neloguj. Volá sa z troch miest cez `services/netlifyPublishService.ts`: (1) explicitne `POST /api/admin/articles/publish` (batch tlačidlo „Publikovať na web") — bez env vráti 503 `PUBLISH_NOT_CONFIGURED`; (2) **automaticky pri prechode článku na `published`** cez `POST /api/admin/articles/:slug/status` (safe variant — zlyhanie buildu nezhodí zmenu statusu, response nesie `buildTriggered`); (3) **cron scheduled publish** `POST /api/cron/articles-schedule` keď sa publikovali/stiahli naplánované články. Pri (2) a (3) sa bez env redeploy ticho preskočí (`buildTriggered: false`). Automatické spustenia (2) a (3) sú **throttlované** (viď `NETLIFY_BUILD_MIN_INTERVAL_MINUTES`) — séria publikovaní za sebou sa zlieva do jedného buildu; batch tlačidlo (1) ide vždy okamžite. |
| `NETLIFY_BUILD_MIN_INTERVAL_MINUTES` | nie | `5` | Minimálny odstup medzi automatickými Netlify buildmi (auto-redeploy po publish a cron scheduled publish). Prvý publish po tomto okne spustí build hneď, ďalšie v rámci okna sa zlejú do jedného trailing buildu — chráni Netlify build minúty pri sérii publikovaní. Stav je in-memory (per-proces), na free-tier single-instance hostingu stačí. `0` = throttle vypnutý (každý publish spustí build). Batch tlačidlo „Publikovať na web" throttle obchádza. |

> **Supabase premenné sú povinné pre DB.** `server/src/config/supabase.ts` fail-fastne ak `SUPABASE_URL` alebo `SUPABASE_SERVICE_ROLE_KEY` chýba. service_role kľúč obchádza RLS — autorizácia sa vynucuje v API vrstve (scope na `req.appUserId` cez `middleware/ensureUser.ts`).

> **Auth premenné sú povinné.** `server/src/config/firebase.ts` fail-fastne pri prvom overení tokenu ak ktorákoľvek `FIREBASE_*` chýba. Všetky `/api/*` endpointy okrem `/api/health` overujú Firebase ID token cez `middleware/firebaseAuth.ts`.

## Model override premenné (server)

Voliteľné — slúžia na A/B testing kvality vs ceny bez code change. Default je v `server/src/services/aiService.ts` (`MODELS`). Ak premenná nie je nastavená, použije sa default. Hodnota musí byť validný OpenAI model ID (`gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, …).

| Premenná | Default | Endpoint / funkcia |
|---|---|---|
| `MODEL_OCR_NORMALIZE` | `gpt-4o-mini` | OCR text cleanup (`normalizeExtractedTextWithOpenAI`) |
| `MODEL_OCR_VISION` | `gpt-4o` | OCR fallback po Google Vision (`extractTextFromImageWithOpenAI`) |
| `MODEL_DOC_CONTEXT` | `gpt-4o-mini` | Document type detection (`analyzeDocumentContextWithOpenAI`) |
| `MODEL_EXAM_ANALYSIS` | `gpt-4o` | Analýza vyšetrenia z OCR textu (`analyzeExamDocumentWithOpenAI`) |
| `MODEL_VET_FILE` | `gpt-4o` | Multi-image vakc. preukaz (`analyzeVetFile`) |
| `MODEL_PASSPORT_INTERPRET` | `gpt-4o` | JSON extract z passport textu (`interpretHealthPassportWithOpenAI`). Kľúčový krok pre kvalitu extrahovaných zdravotných záznamov — default je plný `gpt-4o` (nie mini) kvôli presnosti dátumov, typov záznamov a identifikátorov. Pre lacnejšiu prevádzku možno prepnúť na `gpt-4o-mini`. |
| `MODEL_PASSPORT_VISION` | `gpt-4.1` | Jednokrokové vision volanie: obrázok dokumentu → štruktúrované záznamy (`interpretHealthPassportFromImage`), bez samostatného OCR kroku. Aktívne len keď klient beží v `VITE_EXTRACTION_MODE=vision`. Musí to byť model s vision podporou. |
| `MODEL_MEDICATION_SCAN` | `gpt-4o` | Rozpoznanie obalu prípravku z fotky (`scanMedicationPackage`, `POST /api/scan-medication`). Musí to byť model s vision podporou. |
| `MODEL_EPISODE_SUMMARY` | `gpt-4o-mini` | Similar-episode summary |
| `MODEL_FOOD_SAFETY` | `gpt-4o-mini` | Food safety Q&A |
| `MODEL_FEED_ANALYSIS` | `gpt-4o` | Analýza krmiva (text) |
| `MODEL_ARTICLE_AUTHORING` | `gpt-4o-mini` | AI generovanie obsahu článkov (meta popis, úvod, FAQ, osnova, source-check) |
| `MODEL_ARTICLE_REWRITE` | `gpt-4o` | AI preformulovanie textu článku |

> Vision endpointy (`MODEL_OCR_VISION`, `MODEL_VET_FILE`) musia byť modely s vision podporou. Inak server vráti 502.

## Klient (`client/.env`)

Vite env premenné MUSIA mať prefix `VITE_` aby boli dostupné v kóde.

| Premenná | Povinná | Default | Popis |
|---|---|---|---|
| `VITE_API_URL` | nie (dev) | `''` (relatívne, cez Vite proxy na `:3001`) | Plná base URL pre API v produkcii (napr. `https://api.example.com`). Konzumuje sa v `client/src/services/api.ts`. |
| `VITE_EXTRACTION_MODE` | nie | prázdne (`ocr`) | Režim AI importu zdravotného pasu. `vision` = obrázok dokumentu ide priamo do modelu (`POST /api/interpret-passport` s `attachment`), jedno volanie na dokument, bez samostatného OCR kroku — presnejšie na husté tabuľky a miešaný tlačený+ručný text, menej AI volaní. Čokoľvek iné (default) = klasická OCR → text → interpret cesta. Konzumuje sa v `components/healthPassport/AddRecord/useAiImport.ts`. Serverový model pre vision je `MODEL_PASSPORT_VISION`. |
| `VITE_INACTIVITY_TIMEOUT_MINUTES` | nie | `30` | Po koľkých minútach bez interakcie sa prihlásený používateľ automaticky odhlási. Minútu pred vypršaním sa zobrazí dialóg s odpočtom a možnosťou zostať prihlásený. `0` = funkcia vypnutá; chýbajúca alebo neplatná hodnota = default. Konzumuje sa v `components/InactivityLogout.tsx`, logiku drží `hooks/useInactivityLogout.ts`. Odpočet sa meria z wall-clock pečiatky v `localStorage` (`granule-check-last-activity`), takže prežije uspatie zariadenia a je zdieľaný medzi kartami. |
| `VITE_FIREBASE_API_KEY` | áno (auth) | — | Firebase Web App apiKey. |
| `VITE_FIREBASE_AUTH_DOMAIN` | áno (auth) | — | Firebase authDomain (`<projekt>.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | áno (auth) | — | Firebase projekt ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | nie | — | Firebase storage bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | nie | — | Firebase messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | áno (auth) | — | Firebase Web App appId. Z Firebase Console → Project Settings → Your apps → Web app → SDK config. |
| `VITE_STRIPE_PAYMENT_LINK` | nie | prázdne (feature skrytá) | URL Stripe Payment Linku pre dobrovoľný donate (Fáza 0 monetizácie). Vytvor v Stripe Dashboard → Payment Links. Konzumuje sa v `Layout.tsx` a `AboutPage.tsx`. Ak nie je nastavená, "Podporiť projekt" UI prvky sa nezobrazia. **Po vytvorení Payment Linku nastav `success_url` na `https://<tvoj-host>/dakujeme`** — tam aplikácia ukáže "Ďakujeme" page (`DonateThanksPage.tsx`). Bez toho user po platbe pristane na Stripe default page (nezistí, že platba dorazila do Pawly kontextu). |
| `VITE_ADSENSE_CLIENT` | nie | prázdne (reklamy vypnuté) | Google AdSense Publisher ID vo formáte `ca-pub-XXXXXXXXXXXXXXXX`. Master feature-flag pre reklamy — kým nie je nastavené, `main.tsx` neinjektuje AdSense skript a `AdUnit` nič nevykreslí. Konzumuje sa cez `utils/adsense.ts`. Skript sa načíta **len v PROD**. Postup schválenia a nastavenia: `docs/adsense-setup.md`. |
| `VITE_ADSENSE_SLOT_ARTICLE` | nie | prázdne (in-article jednotka skrytá) | Slot ID reklamnej jednotky pre in-article reklamu v `ArticleView` (AdSense → Ads → By ad unit → Display ad). Bez neho sa `AdUnit` nevykreslí ani keď je `VITE_ADSENSE_CLIENT` nastavený. Nepotrebné pri Auto Ads (tie slot ID nevyžadujú). |
| `VITE_PLAUSIBLE_SRC` | nie | prázdne (analytika vypnutá) | Master feature-flag pre analytiku. URL Plausible skriptu z install snippetu (nový formát `https://plausible.io/js/pa-XXXX.js` — doména je v ňom zabudovaná, samostatná env netreba). Kým nie je nastavené, `main.tsx` neinjektuje skript a `track()` je no-op. Cookieless, GDPR-friendly — **žiadny cookie banner netreba**. Skript sa načíta **len v PROD**. Konzumuje sa cez `utils/analytics.ts`. Meria pageviews automaticky + funnel eventy: landing CTA (`cta_start`, `cta_register`, `cta_login`, `cta_profile`, `cta_analyze`), demá (`demo_sample`, `food_query`) a **dokončená registrácia** `sign_up` (`method`: `email`/`google`, fire z `AuthContext` len pri reálne novom účte) — to je konverzný endpoint funnelu. Alternatíva: vložiť Plausible snippet priamo do `client/index.html` `<head>` (vtedy env netreba, `track()` funguje cez `window.plausible`). |

> **Konvencia:** premenná sa volá `VITE_API_URL`, nie `VITE_API_BASE_URL`. Ak ju premenuješ v kóde, updatni aj túto tabuľku, README a `.env.example`.

### Build-time premenné (klient) — sync článkov z DB

Tieto sa čítajú LEN počas buildu v `client/scripts/syncArticles.mjs` (prebuild krok). **Nemajú prefix `VITE_`** a **nebundlujú sa do klienta** — bežia v Node počas buildu (na Netlify build env, server-side). Slúžia na obnovenie mirroru `client/src/content/poradna/articles.data.json` zo Supabase pred prerenderom.

| Premenná | Povinná | Default | Popis |
|---|---|---|---|
| `SUPABASE_URL` | **áno na deploy builde** (Netlify) | — | URL Supabase projektu (rovnaká ako server). Lokálne a v GitHub Actions nepovinná — sync sa preskočí a použije sa committed mirror. |
| `SUPABASE_SERVICE_ROLE_KEY` | **áno na deploy builde** (Netlify) | — | service_role kľúč (alias `SUPABASE_SERVICE_KEY`). Číta sa len pri builde; **nikdy sa nedostane do klientského bundla**. |
| `ARTICLES_SYNC_OPTIONAL` | nie | prázdne | `1` = vráti staré mäkké správanie (chýbajúce credentials len varujú aj na deploy builde). Únikový ventil pre výnimočný deploy bez DB. |

> **Chýbajúce credentials zhodia deploy build.** Keď `syncArticles.mjs` nenájde `SUPABASE_URL`/kľúč a beží pod `NETLIFY`, build **zámerne padne**. Gate je zámerne len `NETLIFY`, nie `CI` — GitHub Actions buduje len na overenie, nenasadzuje, a tie credentials mať nemusí. Tichý fallback tu totiž de-indexuje web: novo publikované články ostanú mimo mirroru, neprerendrujú sa, nedostanú sa do `sitemap.xml` a Google ich zaradí ako neindexované. Padnutý build je lacnejší než stratené pozície vo vyhľadávaní.
>
> **Prechodné zlyhanie DB** (fetch timeout, HTTP chyba, 0 riadkov) build **nezhodí** — použije posledný committed `articles.data.json`, takže výpadok Supabase neblokuje deploy. Cenou je, že sa nasadí obsah z posledného buildu.
>
> Po editácii obsahu v DB treba **re-trigger buildu** (Netlify build hook), aby sa zmena premietla do prerendrovaného HTML (SEO). Zdroj pravdy je DB; mirror je cache + fallback.

## Pravidlá

- **NIKDY** necommituj `.env` (musí byť v `.gitignore`).
- Pridaj `.env.example` ako šablónu pre nových developerov (bez hodnôt).
- Server: čítaj env len v `index.ts` alebo dedikovanom `config.ts`. Nepoužívaj `process.env.X` rozsypané po celom kóde.
- Klient: prístup cez `import.meta.env.VITE_*`.
- Feature flag pre nepripravené veci: ak pridáš novú externú službu, zabaľ použitie do `isXEnabled()` checku ktorý vráti false ak chýba kľúč.

## Pri pridávaní novej env premennej

1. Pridaj do `.env.example`.
2. Zdokumentuj v tejto tabuľke.
3. Validuj prítomnosť pri starte servera ak je povinná (fail-fast).
4. Klient: prefix `VITE_`, inak Vite ju nezachytí.

## Dev vs Prod (Supabase)

`SUPABASE_SERVICE_ROLE_KEY` obchádza RLS. Mať ho lokálne pre **produkčný** projekt je najčastejší zdroj leakov (commit do gitu, screen share, ukradnutý laptop). Preto:

1. Vytvor druhý Supabase projekt `animalpassport-dev` (Free tier stačí na dev).
2. Spusti všetky migrácie z `supabase/migrations/` na dev projekte v poradí 0001 → 0008+ cez Supabase SQL editor.
3. V lokálnom `server/.env` použi **dev** `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY`.
4. Produkčný `SUPABASE_SERVICE_ROLE_KEY` drž **výhradne** v Render env premenných. Nikdy nie v lokálnom `.env`, v žiadnom CI logu, v PR komentári.
5. Pri rotácii prod kľúča (po incidente alebo plánovanej rotácii): Supabase Dashboard → Settings → API → Reset service_role → updatni Render → redeploy.

Backup checklist a postup pri leaku: `docs/security-checklist.md`.
