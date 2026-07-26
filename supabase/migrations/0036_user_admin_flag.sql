-- AnimalPassport — per-user admin flag.
-- Doteraz sa admin určoval len z env allowlistu ADMIN_EMAILS. Tento stĺpec
-- umožňuje prideliť admin práva konkrétnemu účtu z UI (správa používateľov).
-- Rozlíšenie admina = ADMIN_EMAILS (bootstrap) ALEBO users.is_admin = true.
-- Vyžaduje 0001 (users).

alter table users add column if not exists is_admin boolean not null default false;
