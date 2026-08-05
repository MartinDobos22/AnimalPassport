-- Pawly — zablokovanie používateľského účtu.
-- Firebase disable/delete zaberie až po expirácii ID tokenu (do 1 h), lebo
-- verifyIdToken sa bez checkRevoked na Firebase nepýta. Tento vlastný príznak
-- kontroluje ensureUser pri každom requeste, takže blok platí okamžite,
-- a zároveň nesie dôvod + čas pre doloženie zásahu (Podmienky používania).
-- Vyžaduje 0001 (users).

alter table users add column if not exists blocked_at timestamptz;
alter table users add column if not exists blocked_reason text;

comment on column users.blocked_at is
  'Čas zablokovania účtu. NULL = aktívny účet. Kontroluje ensureUser (403 ACCOUNT_BLOCKED).';
comment on column users.blocked_reason is
  'Dôvod zablokovania — podklad pre oznámenie používateľovi podľa Podmienok používania.';
