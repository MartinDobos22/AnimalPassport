-- AnimalPassport — nový článok poradne: "Seno, nie mrkva, je základ jedálnička králika"
-- Prvý článok o králikoch — rozširuje poradňu na ďalšie druhy.
-- cover_image: reálna fotka z fotobanky Pexels (voľná licencia).
-- Idempotentné: re-run aktualizuje článok podľa slug. Vyžaduje 0018 + 0028 (species) + 0024 (cover_alt) + 0022 (status).

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'seno-zaklad-jedalnicka-kralika',
    'krmivo',
    array['rabbit']::text[],
    'Seno, nie mrkva: čo naozaj patrí do misky králika',
    'Prečo je seno základom jedálnička králika a mrkva len občasná maškrta. Čo králik potrebuje jesť, prečo je vláknina životne dôležitá a kedy hrozí zástava čriev.',
    'Za všetko môže Bugs Bunny. Vďaka nemu si polovica sveta myslí, že králik sníva o mrkve — pravda je však taká, že mrkva by v jeho miske mala byť vzácnou výnimkou, nie základom.',
    '[
      {
        "heading": "Základ je seno, a to neobmedzene",
        "blocks": [
          {"type": "paragraph", "text": "Zdravý králik by mal mať 24 hodín denne prístup ku kvalitnému senu. Malo by tvoriť zhruba 80 až 90 % jeho stravy. Nie je to len výplň — je to zároveň palivo aj nástroj na údržbu tela:"},
          {"type": "bullets", "items": [
            "Vláknina zo sena poháňa **neustály pohyb čriev**, ktorý králik životne potrebuje.",
            "Žuvanie sena **obrusuje zuby**, ktoré králikovi rastú celý život.",
            "Seno ho **zamestnáva** a znižuje nudu aj stres."
          ]},
          {"type": "callout", "variant": "warning", "text": "Ak králik prestane žrať a trúsiť čo i len na pár hodín, môže ísť o zástavu čriev (GI stáza) — život ohrozujúci stav. Neodkladaj návštevu veterinára."}
        ]
      },
      {
        "heading": "Prečo je mrkva len maškrta",
        "blocks": [
          {"type": "paragraph", "text": "Mrkva je koreňová zelenina s vysokým obsahom cukru a škrobu. Pre králičie črevá, nastavené na vlákninu a nie na cukry, je to záťaž. Priveľa mrkvy vedie k obezite, zubným problémom a rozhádzanej črevnej flóre."},
          {"type": "bullets", "items": [
            "Mrkvu podávaj len ako **občasnú, malú maškrtu**.",
            "Paradoxne zdravšia je **vňať** než samotný koreň.",
            "To isté platí pre **ovocie** — len malý kúsok a len občas."
          ]}
        ]
      },
      {
        "heading": "Čo teda do misky patrí",
        "blocks": [
          {"type": "bullets", "items": [
            "**Seno** (timotejka, lúčne) — neobmedzene, základ všetkého.",
            "**Čerstvá vňať a byliny** — denne, postupne a pestro (napr. listová zelenina, žihľava, bylinky).",
            "**Granule** — len malé, odmerané množstvo kvalitných peliet, nie farebné müsli zmesi.",
            "**Čerstvá voda** — vždy dostupná."
          ]},
          {"type": "callout", "variant": "info", "text": "Zmeny v jedálničku rob postupne počas niekoľkých dní. Náhla zmena naruší citlivú črevnú rovnováhu a spôsobí hnačku."}
        ]
      },
      {
        "heading": "Signály, že niečo nie je v poriadku",
        "blocks": [
          {"type": "bullets", "items": [
            "Králik nežerie alebo netrúsi (menej alebo žiadne bobky).",
            "Mäkká stolica, hnačka alebo zalepené okolie zadku.",
            "Chudnutie, apatia alebo prehnané slinenie (možný zubný problém)."
          ]},
          {"type": "callout", "variant": "tip", "text": "Kde sa dá, sleduj hmotnosť a chuť do jedla — u drobných zvierat sa problém prejaví rýchlo a záznam v [zdravotnom pase](/poradna/digitalny-zdravotny-pas-pre-psa) pomôže veterinárovi včas."}
        ]
      },
      {
        "heading": "Bežné chyby v kŕmení králika",
        "blocks": [
          {"type": "paragraph", "text": "Väčšina problémov s trávením u domácich králikov nepramení zo zlej vôle majiteľa, ale z pár rozšírených omylov. Vyhni sa im a ušetríš králika aj svoju peňaženku za veterinára:"},
          {"type": "bullets", "items": [
            "**Müsli zmesi** — farebné zmesi lákajú oko, no králik si z nich vyzobe len sladké kúsky a zvyšok nechá. Voľ radšej jednotné pelety.",
            "**Priveľa peliet** — pelety majú byť len malý doplnok, nie základ. Priveľa ich potláča príjem sena a vedie k obezite.",
            "**Náhle zmeny** — nové krmivo či zeleninu zaraď postupne počas niekoľkých dní, inak riskuješ hnačku.",
            "**Ľudské maškrty** — pečivo, sušienky ani tyčinky s obilím a cukrom do misky nepatria.",
            "**Málo sena** — ak seno zvlhne alebo zapáchne, králik ho odmietne; dopĺňaj ho čerstvé a dbaj na kvalitu."
          ]},
          {"type": "paragraph", "text": "Zdravý králik strávi väčšinu dňa prežúvaním sena a pravidelne trúsi množstvo malých, tuhých bobkov. Práve stály prísun vlákniny a pestrá čerstvá zelenina sú tajomstvom dlhého a zdravého králičieho života — nie plná miska granúl. A ešte jedno: seno musí byť naozaj kvalitné a voňavé — zaprášené či zapáchnuté ho králik odmieta a rovno tým trpí aj jeho trávenie, takže na kvalite základnej suroviny sa neoplatí šetriť."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Môže králik jesť mrkvu?", "a": "Áno, ale len ako občasnú malú maškrtu. Mrkva má veľa cukru a škrobu, takže vo väčšom množstve škodí — základom stravy má byť seno."},
      {"q": "Koľko sena králik potrebuje?", "a": "Neobmedzene. Seno by malo byť dostupné nepretržite a tvoriť približne 80 až 90 % dennej stravy."},
      {"q": "Prečo je vláknina pre králika taká dôležitá?", "a": "Poháňa neustály pohyb čriev, bez ktorého hrozí život ohrozujúca zástava trávenia, a zároveň obrusuje zuby, ktoré rastú celý život."},
      {"q": "Čo robiť, keď králik prestane žrať?", "a": "Konaj rýchlo — aj pár hodín bez žrania a trusu môže znamenať zástavu čriev. Bezodkladne kontaktuj veterinára."}
    ]'::jsonb,
    array['morca-a-vitamin-c']::text[],
    'https://images.pexels.com/photos/4588071/pexels-photo-4588071.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Portrét domáceho králika',
    'Foto: Pexels',
    'passport',
    null,
    '[
      {"label": "RSPCA — Rabbit diet", "url": "https://www.rspca.org.uk/adviceandwelfare/pets/rabbits/diet"},
      {"label": "PDSA — Feeding your rabbit", "url": "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/rabbits/feeding-rabbits"},
      {"label": "The Rabbit Welfare Association & Fund", "url": "https://rabbitwelfare.co.uk/"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    15
  )
on conflict (slug) do update set
  category = excluded.category,
  species = excluded.species,
  title = excluded.title,
  description = excluded.description,
  intro = excluded.intro,
  sections = excluded.sections,
  faqs = excluded.faqs,
  related_slugs = excluded.related_slugs,
  cover_image = excluded.cover_image,
  cover_alt = excluded.cover_alt,
  cover_credit = excluded.cover_credit,
  cta_intent = excluded.cta_intent,
  author = excluded.author,
  sources = excluded.sources,
  updated = excluded.updated,
  published = excluded.published,
  status = excluded.status,
  position = excluded.position;
