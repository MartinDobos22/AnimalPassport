-- AnimalPassport — doplnenie titulnej fotografie článku poradne
-- UPDATE existujúceho záznamu v tabuľke articles (nie INSERT). Idempotentné.
-- Fotka: Pexels (voľná licencia).

update articles
set cover_image  = 'https://images.pexels.com/photos/9890560/pexels-photo-9890560.jpeg?auto=compress&cs=tinysrgb&w=1200',
    cover_alt    = 'Rybičky v akváriu',
    cover_credit = 'Foto: Pexels'
where slug = 'preco-nove-akvarium-zabija-rybicky';
