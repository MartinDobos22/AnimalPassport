# Návrh rozšírenia aplikácie: Zdravotný pas psa

Tento dokument definuje návrh dátového modelu, API vrstvy, UX flow a notifikačných pravidiel pre rozšírenie aplikácie o zdravotný, medikačný a finančný denník psa.

## 1) Dátový model (relational-first, rozšíriteľný)

> Odporúčanie: PostgreSQL + UUID PK + `createdAt/updatedAt` na všetkých tabuľkách. Cudzie kľúče vždy s indexom.

## 1.1 Core: pes a profil

### `dogs`
- `id` (uuid, pk)
- `ownerId` (uuid, fk -> users.id)
- `name` (text, not null)
- `breed` (text)
- `dateOfBirth` (date)
- `sex` (enum: MALE, FEMALE, UNKNOWN)
- `weightKg` (numeric(5,2))
- `photoUrl` (text)
- `microchipNumber` (text, nullable)
- `passportNumber` (text, nullable)
- `notes` (text) — všeobecné „na čo si dať pozor“

### `dog_allergies`
- `id` (uuid, pk)
- `dogId` (uuid, fk -> dogs.id)
- `type` (enum: FOOD, MEDICATION, OTHER)
- `label` (text, not null)
- `severity` (enum: LOW, MEDIUM, HIGH, nullable)
- `reactionDescription` (text, nullable)

### `dog_chronic_conditions`
- `id` (uuid, pk)
- `dogId` (uuid)
- `name` (text, not null)
- `description` (text)
- `diagnosedAt` (date, nullable)
- `status` (enum: ACTIVE, RESOLVED)

### `dog_procedures`
- `id` (uuid, pk)
- `dogId` (uuid)
- `type` (enum: SURGERY, CASTRATION, HOSPITALIZATION, EXAMINATION, OTHER)
- `title` (text)
- `procedureDate` (date)
- `notes` (text)

---

## 1.2 Vakcíny, odčervenie, antiparazitiká

### `vaccinations`
- `id` (uuid, pk)
- `dogId` (uuid, indexed)
- `vaccineType` (enum: RABIES, COMBINED, OTHER)
- `name` (text, not null)
- `dateApplied` (date, not null)
- `validUntil` (date, not null)
- `batchNumber` (text, nullable)
- `source` (enum: PASSPORT, RECEIPT, MANUAL)

**Odvodený stav (neukladať natvrdo):**
- `VALID` = `validUntil > today + expiringSoonThresholdDays`
- `EXPIRING_SOON` = `validUntil between today and today + threshold`
- `EXPIRED` = `validUntil < today`

### `dewormings`
- `id` (uuid, pk)
- `dogId` (uuid, indexed)
- `productName` (text, not null)
- `dateGiven` (date, not null)
- `intervalDays` (int, not null, default 90)
- `nextDueDate` (date, generated or computed on write)

### `ectoparasite_treatments`
- `id` (uuid, pk)
- `dogId` (uuid, indexed)
- `productName` (text, not null)
- `form` (enum: TABLET, SPOT_ON, COLLAR, OTHER)
- `dateGiven` (date, not null)
- `intervalDays` (int, nullable)
- `durationDays` (int, nullable)
- `nextDueDate` (date, nullable, computed: `dateGiven + coalesce(intervalDays, durationDays)`)

**Constraint:** musí byť zadané aspoň jedno z `intervalDays` / `durationDays`.

### `record_attachments`
Unifikované prílohy k záznamom (pas, bloček, prepúšťacia správa).
- `id` (uuid, pk)
- `dogId` (uuid)
- `entityType` (enum: VACCINATION, DEWORMING, ECTOPARASITE, VET_VISIT, MEDICATION, DIET_ENTRY, EXPENSE)
- `entityId` (uuid)
- `storageUrl` (text)
- `fileName` (text)
- `mimeType` (text)
- `takenAt` (timestamptz, nullable)

---

## 1.3 Vet Visits modul

### `vet_visits`
- `id` (uuid, pk)
- `dogId` (uuid, indexed)
- `date` (date, not null)
- `clinicName` (text, not null)
- `vetName` (text, nullable)
- `reason` (text, not null)
- `findings` (text)
- `diagnosis` (text)
- `recommendations` (text)
- `dietChangeNote` (text, nullable)
- `nextCheckDate` (date, nullable)

### `vet_visit_attachments`
Ak chcete samostatnú tabuľku namiesto polymorfnej:
- `id` (uuid, pk)
- `vetVisitId` (uuid, indexed)
- `storageUrl`, `fileName`, `mimeType`

---

## 1.4 Lieky a suplementy

### `medications`
- `id` (uuid, pk)
- `dogId` (uuid, indexed)
- `name` (text, not null)
- `reason` (text)
- `dose` (text)
- `frequencyType` (enum: DAILY_TIMES, EVERY_X_HOURS, CUSTOM_TEXT)
- `frequencyValue` (jsonb) — napr. `{ "timesPerDay": 2, "times": ["08:00", "20:00"] }`
- `frequencyText` (text, fallback pre custom)
- `startDate` (date, not null)
- `endDate` (date, nullable)
- `longTerm` (boolean, default false)
- `fromVetVisitId` (uuid, nullable, fk -> vet_visits.id)
- `isActive` (boolean, computed or denormalized)

### `medication_dose_logs`
Adherence checklist.
- `id` (uuid, pk)
- `medicationId` (uuid, indexed)
- `scheduledFor` (timestamptz, indexed)
- `status` (enum: PENDING, TAKEN, SKIPPED)
- `checkedAt` (timestamptz, nullable)
- `note` (text, nullable)

---

## 1.5 Výživa a granule

### `diet_entries`
- `id` (uuid, pk)
- `dogId` (uuid, indexed)
- `foodId` (uuid, nullable)
- `foodName` (text, nullable; required ak `foodId` je null)
- `startedAt` (date, not null)
- `endedAt` (date, nullable)
- `reactionNotes` (text, nullable)
- `isCurrent` (boolean, indexed)
- `suitabilityStatus` (enum: SUITABLE, RISKY, UNSUITABLE, nullable)
- `suitabilityReasons` (jsonb, nullable)

### Napojenie na existujúci algoritmus
- Pri `create/update diet_entry` zavolať existujúcu evaluačnú službu.
- Výsledok uložiť ako snapshot (`suitabilityStatus/reasons`) + možnosť „recompute“ tlačidlom.
- Pri zmene alergií/diagnóz spustiť background re-evaluation pre `isCurrent=true`.

---

## 1.6 Finančný denník

### `expenses`
- `id` (uuid, pk)
- `dogId` (uuid, indexed)
- `date` (date, not null)
- `amount` (numeric(10,2), not null)
- `currency` (char(3), default EUR)
- `category` (enum: VET_VISIT, MEDICATION, FOOD, OTHER)
- `relatedVetVisitId` (uuid, nullable)
- `relatedDietEntryId` (uuid, nullable)
- `relatedMedicationId` (uuid, nullable)
- `note` (text, nullable)

**Pravidlo:** minimálne 1 referencia je voliteľná, ale pre rýchle UX je vhodné ju predvyplniť pri vytváraní z detailu návštevy/krmiva.

---

## 1.7 Notifikácie a timeline

### `reminders`
- `id` (uuid, pk)
- `dogId` (uuid, indexed)
- `sourceType` (enum: VACCINATION, DEWORMING, ECTOPARASITE, MEDICATION, VET_VISIT)
- `sourceId` (uuid)
- `kind` (enum: DUE_SOON, DUE_TODAY, OVERDUE, DOSE_TIME)
- `scheduledFor` (timestamptz, indexed)
- `status` (enum: PENDING, SENT, DISMISSED)
- `channel` (enum: PUSH, EMAIL, IN_APP)

### `timeline_events` (voliteľná materializácia)
- `id` (uuid, pk)
- `dogId` (uuid, indexed)
- `eventType` (enum: VACCINATION, DEWORMING, ECTOPARASITE, VET_VISIT, MEDICATION_START, MEDICATION_DOSE, DIET_CHANGE, NOTE, EXPENSE)
- `eventDate` (timestamptz, indexed)
- `title` (text)
- `summary` (text)
- `sourceType` + `sourceId`
- `payload` (jsonb)

Ak nechcete duplicitu, timeline skladáte cez `UNION ALL` view z doménových tabuliek.

---

## 2) API vrstva (REST návrh)

Base: `/api/v1`

## 2.1 Dogs
- `POST /dogs`
- `GET /dogs/:dogId`
- `PATCH /dogs/:dogId`
- `GET /dogs/:dogId/profile` (vráti core + allergies + chronic conditions + procedures)
- `PUT /dogs/:dogId/profile/health`

## 2.2 Vaccinations / Deworming / Ectoparasites
- `POST /dogs/:dogId/vaccinations`
- `GET /dogs/:dogId/vaccinations?status=VALID|EXPIRING_SOON|EXPIRED`
- `GET /dogs/:dogId/vaccinations/:id`
- `PATCH /dogs/:dogId/vaccinations/:id`
- `DELETE /dogs/:dogId/vaccinations/:id`

- `POST /dogs/:dogId/dewormings`
- `GET /dogs/:dogId/dewormings`
- `PATCH /dogs/:dogId/dewormings/:id`
- `DELETE /dogs/:dogId/dewormings/:id`

- `POST /dogs/:dogId/ectoparasites`
- `GET /dogs/:dogId/ectoparasites`
- `PATCH /dogs/:dogId/ectoparasites/:id`
- `DELETE /dogs/:dogId/ectoparasites/:id`

## 2.3 Vet Visits
- `POST /dogs/:dogId/vet-visits`
- `GET /dogs/:dogId/vet-visits?page=1&pageSize=20`
- `GET /dogs/:dogId/vet-visits/:visitId`
- `PATCH /dogs/:dogId/vet-visits/:visitId`
- `DELETE /dogs/:dogId/vet-visits/:visitId`
- `POST /dogs/:dogId/vet-visits/:visitId/attachments` (multipart upload)

## 2.4 Medications
- `POST /dogs/:dogId/medications`
- `GET /dogs/:dogId/medications?active=true`
- `GET /dogs/:dogId/medications/:id`
- `PATCH /dogs/:dogId/medications/:id`
- `POST /dogs/:dogId/medications/:id/dose-logs` (check/uncheck dávky)
- `GET /dogs/:dogId/medications/:id/dose-logs?from=&to=`

## 2.5 Diet
- `POST /dogs/:dogId/diet-entries`
- `GET /dogs/:dogId/diet-entries`
- `PATCH /dogs/:dogId/diet-entries/:id`
- `POST /dogs/:dogId/diet-entries/:id/reaction-note`
- `POST /dogs/:dogId/diet-entries/:id/recompute-suitability`
- `GET /dogs/:dogId/diet/current`

## 2.6 Expenses
- `POST /dogs/:dogId/expenses`
- `GET /dogs/:dogId/expenses?from=&to=&category=`
- `PATCH /dogs/:dogId/expenses/:id`
- `DELETE /dogs/:dogId/expenses/:id`
- `GET /dogs/:dogId/expenses/summary?period=month|year`
- `GET /dogs/:dogId/expenses/by-category?from=&to=`

## 2.7 Špeciálne endpointy
- `GET /dogs/:dogId/semaphores`
  - response: `{ vaccination: VALID|EXPIRING_SOON|EXPIRED, deworming: ..., ectoparasite: ... }`
- `GET /dogs/:dogId/vet-card`
  - agregovaný read-only payload pre „Karta pre veta“
- `GET /dogs/:dogId/timeline?types=...&from=&to=&cursor=`
- `POST /dogs/:dogId/attachments` (generic upload)

---

## 3) Výpočet „Karta pre veta“ (agregácie)

## Sekcie karty
1. Identita psa
2. Dlhodobé diagnózy
3. Alergie a nežiaduce reakcie
4. Aktuálne lieky/suplementy
5. Očkovania (posledná besnota + kombinovaná)
6. Posledné odčervenie + antiparazitikum
7. Nedávne významné udalosti

## Query logika (pseudo)
- **Identita:** `dogs` + vek: `age(now(), dateOfBirth)`
- **Diagnózy:** union `dog_chronic_conditions where ACTIVE` + posledné relevantné `vet_visits.diagnosis`
- **Aktuálne lieky:** `medications where (longTerm=true OR endDate >= current_date) AND startDate <= current_date`
- **Vakcinácie:** pre každý typ (`RABIES`, `COMBINED`) `ORDER BY dateApplied DESC LIMIT 1`
- **Odčervenie/ecto:** posledný záznam podľa `dateGiven`
- **Významné udalosti:** top N z `dog_procedures` + vet návštevy s diagnosis/recommendation tagom

## Export možnosti
- PDF export server-side (`/vet-card/export.pdf`)
- Share link s expiráciou (`/share/:token`, read-only)
- QR kód, ktorý otvorí share link

---

## 4) Timeline + Dashboard

## 4.1 Timeline skladanie

### Varianta A: dynamický view (bez duplicity)
`SELECT ... FROM vaccinations UNION ALL SELECT ... FROM dewormings ...`

**Výhoda:** žiadna sync logika.
**Nevýhoda:** zložitejší query planner pri veľkých dátach.

### Varianta B: `timeline_events` materializácia
- Pri každom create/update/delete spustiť event projector.
- Ideálne, ak chcete fulltext, rýchle filtre a cursor pagination.

## 4.2 Filtrácia
- `types[]`
- dátum od-do
- fulltext v title/summary
- cursor pagination podľa `(eventDate, id)`

## 4.3 Dashboard payload
`GET /dogs/:dogId/dashboard`
- `dogCard` (foto + základné údaje)
- `semaphores` (vakcína, odčervenie, kliešte/blchy)
- `nextTasks[]`
  - najbližšia kontrola (`nextCheckDate`)
  - najbližšia vakcína (`validUntil`)
  - odčervenie/ecto (`nextDueDate`)
  - dnešné dávky liekov (`medication_dose_logs`)
- `quickActions`
  - „Pridať návštevu“
  - „Pridať vakcínu“
  - „Karta pre veta“

---

## 5) UX flow – rýchle zadanie údajov po návšteve veta

## 5.1 Primárny flow: 3-krokový wizard „Po návšteve veta“

### Krok 1: Návšteva (povinné minimum)
- Dátum, klinika, dôvod
- Voliteľne vet, diagnóza, odporúčania, nextCheckDate
- CTA: „Pokračovať"

### Krok 2: Čo sa dnes udialo
Checkbox sekcie:
- [ ] Pridané očkovanie
- [ ] Podané odčervenie
- [ ] Podané antiparazitikum
- [ ] Predpísané lieky
- [ ] Zmena diéty

Každá sekcia sa rozbalí inline mini-formom (prefill dnešného dátumu + väzba na `vetVisitId`).

### Krok 3: Doklady a suma
- Upload fotky pasu/bločku/správy
- Pole „Celkový náklad“ + kategória (prednastavené VET_VISIT)
- Prepínač „Pridať aj samostatný nákup liekov/krmiva“
- CTA: „Uložiť všetko"

## 5.2 One-action create (transakčne)
`POST /dogs/:dogId/intake/after-vet-visit`

Payload obsahuje:
- `vetVisit`
- `vaccinations[]`
- `deworming?`
- `ectoparasite?`
- `medications[]`
- `dietEntry?`
- `expense?`
- `attachments[]`

Server:
1. začne DB transakciu,
2. uloží vet visit,
3. vytvorí pod-záznamy s `fromVetVisitId`,
4. naplánuje reminders,
5. commit + return súhrn.

---

## 6) Notifikačné pravidlá (MVP)

## 6.1 Vakcíny
- DUE_SOON: 30 dní pred `validUntil`
- DUE_TODAY: v deň `validUntil`
- OVERDUE: 1, 7, 14 dní po expiracii

## 6.2 Odčervenie / Ecto
- DUE_SOON: 7 dní pred `nextDueDate`
- DUE_TODAY: v deň splatnosti
- OVERDUE: každých 7 dní do potvrdenia nového podania

## 6.3 Lieky
- Generovať dose reminders podľa `frequencyValue`
- Tolerančné okno check-in napr. ±2h
- Ak dávka nebola potvrdená do konca dňa => status `SKIPPED` (cron)

## 6.4 Úložisko notifikácií
- všetko do `reminders`
- deduplikácia unique key: `(sourceType, sourceId, kind, scheduledFor)`
- worker job každých 5 minút: pending -> sent

---

## 7) UI komponenty (MVP návrh)

- `DogProfileFormExtended` (tabs: Basic, Health)
- `VaccinationForm`, `DewormingForm`, `EctoparasiteForm`
- `VetVisitWizard` (3 kroky)
- `MedicationQuickAdd` (po uložení návštevy hneď „+ pridať liek“)
- `DietCurrentCard` + `TryFoodButton`
- `ExpenseQuickAdd` (predvyplnené z kontextu návštevy/diéty)
- `VetCardScreen` (read-only, tlač export)
- `TimelineFeed` + filter chips
- `DashboardSemaphores` + `UpcomingTasksList`

---

## 8) Stavové pravidlá pre semafory

Vypočítajte vždy z posledných relevantných záznamov:
- **Vakcíny:** min status zo sledovaných vakcín (ak jedna kritická expiruje => dashboard upozorniť)
- **Odčervenie:** podľa najbližšieho `nextDueDate`
- **Ectoparasite:** podľa najbližšieho `nextDueDate`

Odporúčané prahy:
- `EXPIRING_SOON` pre vakcíny: 30 dní
- `EXPIRING_SOON` pre odčervenie/ecto: 7 dní

---

## 9) Implementačný plán po iteráciách

1. **DB migrácie + CRUD API** (dogs profile extension, vaccinations/deworming/ecto, vet visits).
2. **Wizard + attachments + quick expense**.
3. **Medications adherence + reminder worker**.
4. **DietEntry napojenie na existujúci suitability engine**.
5. **Vet Card + Dashboard semafory + Timeline**.
6. **Export (PDF/share link/QR)**.

Týmto postupom získate použiteľný MVP už po 1.–2. iterácii a následne iba pridávate „smart“ vrstvy (notifikácie, agregácie, export).
