-- Pawly — zrkadlo stavu overenia e-mailu a spôsobu prihlásenia.
-- Zdrojom pravdy zostáva claim `email_verified` v Firebase ID tokene. Tieto
-- stĺpce sú len jeho odtlačok pre admin prehľad a štatistiku — zapisuje ich
-- ensureUser z overeného tokenu, NIKDY nie z tela requestu, takže hodnotu
-- nevie klient ovplyvniť.
-- Vyžaduje 0001 (users).

alter table users add column if not exists email_verified boolean not null default false;
alter table users add column if not exists email_verified_at timestamptz;
alter table users add column if not exists auth_provider text;

comment on column users.email_verified is
  'Odtlačok claimu email_verified z ID tokenu pri poslednom requeste. Zdroj pravdy je Firebase.';
comment on column users.email_verified_at is
  'Kedy sme účet prvýkrát videli s overeným e-mailom.';
comment on column users.auth_provider is
  'firebase.sign_in_provider z ID tokenu — password, google.com, … Rozlíši overenie mailom od Google prihlásenia.';
