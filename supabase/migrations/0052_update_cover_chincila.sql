-- AnimalPassport — doplnenie titulnej fotografie článku poradne
-- UPDATE existujúceho záznamu v tabuľke articles (nie INSERT). Idempotentné.
-- Fotka: Wikimedia Commons (voľná licencia).

update articles
set cover_image  = 'https://commons.wikimedia.org/wiki/Special:FilePath/Chinchilla_lanigera.jpg?width=1200',
    cover_alt    = 'Chinčila vlnatá (Chinchilla lanigera)',
    cover_credit = 'Foto: Wikimedia Commons'
where slug = 'preco-sa-chincila-kupe-v-prachu';
