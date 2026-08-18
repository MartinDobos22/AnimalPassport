-- Pawly — poznámka k lieku.
-- Vakcinácie, odčervenia a ektoparazitiká majú `note` už od 0029; lieky ako
-- jediné nie, takže údaje z obalu (účinné látky, šarža, expirácia balenia)
-- končili v stĺpci `reason`, ktorý má niesť dôvod podávania. Tento stĺpec to
-- rozdeľuje na dve veci, ktoré sú naozaj dve veci.
-- Vyžaduje 0002 (medications).

alter table medications add column if not exists note text;

comment on column medications.note is
  'Voľná poznámka k lieku (údaje z obalu, dávkovacie detaily). Dôvod podávania patrí do `reason`.';
