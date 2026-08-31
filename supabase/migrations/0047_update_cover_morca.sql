-- AnimalPassport — doplnenie titulnej fotografie článku poradne
-- UPDATE existujúceho záznamu v tabuľke articles (nie INSERT). Idempotentné.
-- Fotka: Pexels (voľná licencia).

update articles
set cover_image  = 'https://images.pexels.com/photos/1093126/pexels-photo-1093126.jpeg?auto=compress&cs=tinysrgb&w=1200',
    cover_alt    = 'Dve morčatá zblízka',
    cover_credit = 'Foto: Pexels'
where slug = 'morca-a-vitamin-c';
