-- AnimalPassport — doplnenie titulnej fotografie článku poradne
-- UPDATE existujúceho záznamu v tabuľke articles (nie INSERT). Idempotentné.
-- Fotka: Pexels (voľná licencia).

update articles
set cover_image  = 'https://images.pexels.com/photos/11635213/pexels-photo-11635213.jpeg?auto=compress&cs=tinysrgb&w=1200',
    cover_alt    = 'Andulka (papagáj vlnkovaný) zblízka',
    cover_credit = 'Foto: Pexels'
where slug = 'preco-papagaje-rozpravaju';
