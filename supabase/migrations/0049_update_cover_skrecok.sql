-- AnimalPassport — doplnenie titulnej fotografie článku poradne
-- UPDATE existujúceho záznamu v tabuľke articles (nie INSERT). Idempotentné.
-- Fotka: Pexels (voľná licencia).

update articles
set cover_image  = 'https://images.pexels.com/photos/2013665/pexels-photo-2013665.jpeg?auto=compress&cs=tinysrgb&w=1200',
    cover_alt    = 'Škrečok na dlani',
    cover_credit = 'Foto: Pexels'
where slug = 'preco-je-skrecok-aktivny-v-noci';
