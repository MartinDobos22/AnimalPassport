-- AnimalPassport — štruktúrovaný výsledok vyšetrenia (vet_visits.exam_result)
-- Doplní k voľnému textu findings/diagnosis strojovo čitateľný výsledok, aby
-- Prehľad zdravia vedel dlaždicu vyšetrenia ofarbiť (v norme / odchýlka /
-- nejednoznačné). Nullable — staré aj neurčené návštevy ostávajú bez výsledku.
-- Zápis ide cez app_update/create_health_row (0006), ktoré berú reálne stĺpce
-- tabuľky dynamicky, takže nový stĺpec je writable bez zmeny allowlistu.
-- Vyžaduje 0002 (vet_visits).

alter table public.vet_visits
  add column if not exists exam_result text
  check (exam_result is null or exam_result in ('NORMAL', 'ABNORMAL', 'INCONCLUSIVE'));
