-- Pawly — používateľské recenzie aplikácie (reviews)
-- Prihlásený používateľ môže nechať jednu recenziu (hviezdičky + voliteľný text).
-- Recenzia je najprv `pending`; admin ju v moderácii schváli (`approved`) alebo
-- zamietne (`rejected`). Len schválené sa zobrazujú verejne na landing page.
-- Čítanie verejných recenzií ide cez backend service_role (RLS deny-by-default).
-- Vyžaduje 0001 (users, set_updated_at).

create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references users(id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  body         text,
  author_name  text,
  pet_name     text,
  locale       text not null default 'sk',
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderated_at timestamptz,
  moderated_by text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Verejný výpis číta len schválené, zoradené podľa schválenia; index to pokrýva.
create index if not exists reviews_status_moderated_idx on reviews(status, moderated_at desc);

create trigger reviews_set_updated_at
  before update on reviews
  for each row execute function set_updated_at();

-- Autorizácia sa vynucuje v API vrstve (scope na user_id, moderácia cez requireAdmin).
-- service_role obchádza RLS; žiadne anon/authenticated policies.
alter table reviews enable row level security;
