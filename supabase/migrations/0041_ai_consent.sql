-- Pawly — trvalý súhlas s AI/OCR spracovaním zdravotných dokumentov.
-- Doteraz sa súhlas zbieral checkboxom pri KAŽDEJ analýze a putoval v tele
-- requestu, takže zdrojom pravdy bol klient. Od tejto migrácie je zdrojom
-- pravdy DB: používateľ udelí súhlas raz, server ho číta v ensureUser a
-- privacyGuard rozhoduje podľa neho, nie podľa poľa v requeste.
-- NULL = súhlas neudelený (fail-closed). Odvolanie = späť na NULL.
-- Vyžaduje 0001 (users).

alter table users add column if not exists ai_processing_consent_at timestamptz;

comment on column users.ai_processing_consent_at is
  'Kedy používateľ udelil výslovný súhlas s AI/OCR spracovaním zdravotných dokumentov. NULL = neudelený alebo odvolaný; autorizácia je fail-closed.';
