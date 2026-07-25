-- AnimalPassport — pútací text (teaser) článku pre kartu v zozname poradne.
-- Krátky text zobrazený na karte namiesto meta popisu (description); ak chýba,
-- karta použije description ako fallback. Voliteľné pole. Vyžaduje 0018 (articles).

alter table articles add column if not exists teaser text;
