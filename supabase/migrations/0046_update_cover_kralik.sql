-- AnimalPassport — doplnenie titulnej fotografie článku poradne
-- UPDATE existujúceho záznamu v tabuľke articles (nie INSERT). Idempotentné.
-- Fotka: Pexels (voľná licencia).

update articles
set cover_image  = 'https://images.pexels.com/photos/4588071/pexels-photo-4588071.jpeg?auto=compress&cs=tinysrgb&w=1200',
    cover_alt    = 'Portrét domáceho králika',
    cover_credit = 'Foto: Pexels'
where slug = 'seno-zaklad-jedalnicka-kralika';
