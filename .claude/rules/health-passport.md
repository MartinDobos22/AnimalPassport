# Zdravotný pas + denník epizód + karta pre veterinára

Tieto tri domény sa rozšírili nad pôvodnú analýzu krmiva. Tento dokument je doplnok k `architecture.md` — konvencie pre prácu s nimi.

## Domény a ich routy

| Doména | URL | Page | Komponenty | Hooks | Service |
|---|---|---|---|---|---|
| Zdravotný pas | `/zdravotny-pas/*` | `HealthPassportPage.tsx` | `components/healthPassport/` | `useAddRecordForm`, `useAiImport`, `useMedicationScan` | `dogHealthApi.ts` |
| Denník epizód | `/dennik` | `EpisodeDiaryPage.tsx` | `components/episodes/` | `useHealthEpisodes`, `useEpisodeStorageSize` | `api.ts` (`fetchSimilarEpisodeSummary`) |
| Karta pre veterinára | `/karta-pre-veterinara` | `VetCardPage.tsx` | `components/vetCard/` | (read-only zo zdielanej perzistencie) | (žiadna AI) |

## Dátový model

Zdroj pravdy je `docs/dog-health-modules-design.md` (cieľový PostgreSQL návrh).

Aktuálne typy v repo:

- `client/src/types/dogHealth.ts` — zdravotný pas (vakcinácie, odčervenie, …)
- `client/src/types/healthEpisode.ts` — epizóda + `EpisodeCategory` + `SimilarEpisodeSummary`
- `server/src/types/episode.ts` — server-side zrkadlo (HealthEpisodeRecord, EpisodeCategory)

> **Pravidlo drift:** žiadny shared package zatiaľ nie je. Pri zmene tvaru epizódy / záznamu zdrav. pasu **uprav typy na oboch stranách**. Skontroluj aj endpoint payload v `client/src/services/api.ts` (`stripAttachments`, `SimilarSummaryRequest`).

## Perzistencia (Supabase)

Profily zvierat aj **všetky zdravotné záznamy** (vakcinácie, odčervenia, ektoparazity, návštevy, lieky, dose-logy, diéta, výdavky, epizódy) a história analýz sú v **Supabase** cez backend. Frontend ich číta/zapisuje cez kontexty:

| Hook / kontext | Zdroj | Obsah |
|---|---|---|
| `usePetProfiles` (`PetProfilesContext`) | `services/petsApi.ts` → `/api/pets` | `PetProfile[]` |
| `useHealthData` (`HealthDataContext`) | `services/healthApi.ts` → `/api/health/*` | všetky zdravotné polia + `savedAnalyses` |
| `useHealthEpisodes` | wrapper nad `useHealthData` | `HealthEpisodeRecord[]` (`add/update/remove` sú async) |

Vytvorenie návštevy s naviazanými záznamami ide cez **`POST /api/health/visit-bundle`** (`addVisitBundle`) — server atomicky vytvorí visit + lieky + dose-logy + … a premapuje id.

V `localStorage` ostávajú už len lokálne preferencie: `granule-check-dark-mode`, `granule-check-active-pet-id`, `granule-check-last-clinic-by-dog`, recent food-safety queries.

### Pravidlá pre localStorage

1. **Kvótu monitoruj** — base64 attachmenty môžu prekročiť 5 MB. Pri novom uploade volaj `useEpisodeStorageSize` (alebo ekvivalent) a uži warning ak nad ~4 MB.
2. **Downscaluj obrázky pred uložením** — `client/src/utils/imageDownscale.ts`. Ulož downscaled verziu, nie originál.
3. **Nikdy neukladaj surové base64 do API payloadu pre AI summary** — `services/api.ts:fetchSimilarEpisodeSummary` používa `stripAttachments` (drop base64 pred odoslaním). Replikuj tento vzor pri akomkoľvek novom AI endpointe.
4. **Migrácie:** zatiaľ žiadna versioning logika. Ak meníš tvar persistovaného objektu, **nastav fallback** v hooku (`if (typeof loaded.field === 'undefined') …`), inak existujúci používatelia prídu o dáta.

## AI v doméne

| Endpoint | Volá z | Účel |
|---|---|---|
| `POST /api/interpret-passport` | `interpretPassportText` (api.ts) | AI parsing fotenej/scanovanej zdravotnej karty → štruktúrované vakcinácie |
| `POST /api/extract-text` | `extractTextFromImage` (api.ts) | Surový OCR fallback ladder |
| `POST /api/episodes/similar-summary` | `fetchSimilarEpisodeSummary` (api.ts) | Zhrnutie podobných minulých epizód pre kontext aktuálnej |
| `POST /api/scan-medication` | `scanMedicationPackage` (api.ts) | Fotka **obalu prípravku** → názov, účinné látky, šarža, expirácia balenia, navrhnutý typ záznamu a interval do ďalšej dávky |

Všetky tieto endpointy vyžadujú `aiHeavyLimiter`. Pri pridávaní novej AI funkcie zachovaj rovnaký vzor — extra service v `server/src/services/<doména>AiService.ts`, route handler tenký, prompt v service.

## UX invarianty

- **Karta pre veterinára** musí byť print-ready (A4) — neuvádzaj UI prvky ktoré majú zmysel len digitálne (sticky nav, action buttony) bez `@media print { display: none }`. Pozri `MuiCssBaseline` override v `theme.ts`.
- **Denník epizód** filter cez `utils/episodeFilters.ts` — žiadne ad-hoc filtre v komponentoch.
- **Zdravotný pas** "Add record" formulár drží stav v `useAddRecordForm` — komponenty len renderujú; ak pridávaš pole, urob to v hooku + v type.
- **AI import** (`useAiImport`) je opt-in tok pre používateľa: explicitné CTA, žiadne automatické skenovanie pri prvom load.
- **`AddRecord` začína výberom režimu** (`CHOOSER`), nie prepínačom záložiek — dlaždice `SCAN` / `AI` / `QUICK` / `MANUAL` s popisom, čo ktorý režim rieši. Nové režimy pridávaj do `MODE_ORDER` a `addRecord.modes.*`, nie ako ďalšiu záložku.
- **Súhlas s AI sa nepýta pri každej analýze.** Je trvalý (`useAiConsent` + `AiConsentDialog`), vypýta si ho až prvá AI akcia a odvoláva sa v nastaveniach. V AI tokoch nesmie pribudnúť ďalší consent checkbox — na obrazovke je len `AiProcessingNote` (jeden riadok + „Ako to funguje?").
- **Fotka obalu v toku pre dokumenty** neskončí slepou chybou: keď analýza zlyhá a je nahratá jedna fotka, `AiImportBody` ponúkne prepnutie do scanu lieku a fotku prenesie (`onScanHandoff` → `initialFile`).
- **Poznámka k lieku patrí do `MedicationRecord.note`** (migrácia `0042`), nie do `reason`. `reason` nesie dôvod podávania; údaje z obalu (účinné látky, šarža, expirácia) idú do `note` — rovnako ako pri vakcinácii, odčervení a ektoparazitikách.
- **Scan obalu lieku** (režim „Odfotiť liek" v `AddRecord`, `useMedicationScan`) drží dva **rôzne** dátumy oddelene: `packageExpiry` (trvanlivosť balenia, „Exp." z obalu — do záznamu ide len ako poznámka) a `nextDueDate` (dokedy prípravok chráni / kedy je ďalšia dávka — riadi pripomienky). Nikdy ich nezlievaj do jedného poľa. AI z obalu iba **číta**; porovnanie s profilom zvieraťa (hmotnostný rozsah, druh, expirácia k dátumu podania) je deterministické v `utils/medicationScanChecks.ts`.

## Pri pridávaní novej zdravotnej domény (napr. nutričný plán)

1. Type v `client/src/types/<doména>.ts` (a v `server/src/types/` ak má backend).
2. Hook v `client/src/hooks/use<Doména>.ts` (s `useLocalStorage` ak treba perzistovať).
3. Subadresár `client/src/components/<doména>/`.
4. Page v `client/src/pages/`, route v `App.tsx` so SK slugom.
5. AI volania v `client/src/services/<doména>Api.ts` (alebo rozšír `api.ts`).
6. Server route + service + types + `aiHeavyLimiter` ak AI.
7. Aktualizuj túto tabuľku a `repo-shape.md`.
