-- AnimalPassport — doplnenie titulnej fotografie článku poradne
-- UPDATE existujúceho záznamu v tabuľke articles (nie INSERT). Idempotentné.
-- Fotka: Pexels (voľná licencia).

update articles
set cover_image  = 'https://images.pexels.com/photos/20549160/pexels-photo-20549160.jpeg?auto=compress&cs=tinysrgb&w=1200',
    cover_alt    = 'Agama fúzatá vyhrievajúca sa na kameni',
    cover_credit = 'Foto: Pexels'
where slug = 'plaz-teplo-a-uvb-svetlo';
