-- AnimalPassport — media knižnica nahratých obrázkov článkov poradne.
-- Eviduje objekty v bucketе `article-images` (viď 0020) + metadáta, aby admin
-- vedel obrázok znovupoužiť, editovať popis/autora/alt a mazať.
-- RLS deny-by-default (žiadna policy) → prístup výhradne server-side cez
-- service_role. Vyžaduje 0020 (article-images bucket).

create table if not exists media_images (
  id uuid primary key default gen_random_uuid(),
  object_path text not null unique,
  url text not null,
  alt text,
  caption text,
  author text,
  width integer,
  height integer,
  mime text,
  size_bytes integer,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists media_images_created_at_idx on media_images (created_at desc);

alter table media_images enable row level security;
