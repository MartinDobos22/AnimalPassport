-- AnimalPassport — hashtagy / kľúčové slová článku (SEO + filtrovanie).
-- Pole reťazcov bez diakritických obmedzení (napr. „výživa", „šteňa").
-- Renderuje sa ako meta keywords a voliteľné viditeľné hashtag chips.
-- Vyžaduje 0018 (articles).

alter table articles add column if not exists tags text[] not null default '{}';
