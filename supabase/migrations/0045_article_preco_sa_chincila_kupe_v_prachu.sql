-- AnimalPassport — nový článok poradne: "Prečo sa chinčila kúpe v prachu?"
-- Prvý článok o chinčilách.
-- cover_image: reálna fotka z Wikimedia Commons (voľná licencia).
-- Idempotentné: re-run aktualizuje článok podľa slug. Vyžaduje 0018 + 0028 + 0024 + 0022.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'preco-sa-chincila-kupe-v-prachu',
    'zdravie',
    array['chinchilla']::text[],
    'Prečo sa chinčila kúpe v prachu (a nikdy nie vo vode)',
    'Prečo sa chinčila kúpe v prachu a voda je pre ňu nebezpečná? Najhustejšia srsť medzi cicavcami, prachový kúpeľ, citlivosť na teplo a kedy spozornieť.',
    'Predstav si zviera, ktoré sa umyje tak, že sa vyváľa v prachu — a naopak obyčajný kúpeľ vo vode by mu mohol vážne uškodiť. Presne taká je chinčila. Za jej nezvyčajnou hygienou je najhustejšia srsť spomedzi všetkých suchozemských cicavcov.',
    '[
      {
        "heading": "Srsť taká hustá, že je to problém",
        "blocks": [
          {"type": "paragraph", "text": "Kým človeku rastie z jedného chlpového folikulu jeden vlas, chinčile ich rastie aj niekoľko desiatok. Výsledkom je neuveriteľne hustá, jemná srsť, ktorá ju v chladných andských výškach chráni pred zimou. Tá istá hustota však robí z vody nepriateľa."},
          {"type": "bullets", "items": [
            "Hustá srsť pri kontakte s vodou **nasiakne a veľmi dlho schne**.",
            "Vlhkosť pri koži vytvára ideálne prostredie pre **plesne a kožné infekcie**.",
            "Mokrá chinčila sa navyše ľahko **podchladí**."
          ]},
          {"type": "callout", "variant": "warning", "text": "Chinčilu nikdy neumývaj vo vode. To, čo je pre iné zvieratá bežná hygiena, je pre ňu vážne zdravotné riziko."}
        ]
      },
      {
        "heading": "Prečo funguje kúpeľ v prachu",
        "blocks": [
          {"type": "paragraph", "text": "V prírode sa chinčily kúpu v jemnom sopečnom popole a piesku. Doma im tento rituál nahrádza špeciálny chinčilový prach:"},
          {"type": "bullets", "items": [
            "Jemné čiastočky prachu vniknú do srsti a **naviažu na seba prebytočné mazivo a vlhkosť**.",
            "Keď sa chinčila vyváľa a otrasie, **prach aj s nečistotami vypadne**.",
            "Srsť tak zostáva **čistá, suchá a nadýchaná** — bez jedinej kvapky vody."
          ]},
          {"type": "paragraph", "text": "Váľanie sa v prachu je zároveň zábava aj psychická pohoda — je to pre chinčilu prirodzené správanie, ktoré jej robí radosť."}
        ]
      },
      {
        "heading": "Ako na prachový kúpeľ správne",
        "blocks": [
          {"type": "bullets", "items": [
            "Používaj len **jemný chinčilový prach** — nie ostrý piesok, ktorý dráždi kožu a oči.",
            "Ponúkni kúpeľ v miske alebo domčeku **pár krát týždenne, vždy len na pár minút**.",
            "Po kúpeli **prach vyber** — ak ho necháš stále vnútri, znečistí sa a chinčila sa v ňom prestane kúpať."
          ]},
          {"type": "callout", "variant": "info", "text": "Priveľa kúpeľov vysušuje kožu. Ak chinčila začne mať šupinatú alebo podráždenú kožu, kúpele obmedz. Naopak zaolejovaná, zlepená srsť signalizuje, že kúpeľov je málo."}
        ]
      },
      {
        "heading": "Voda nie je jediné, čoho sa chinčila bojí",
        "blocks": [
          {"type": "paragraph", "text": "Andský pôvod ovplyvňuje aj ďalšie potreby chinčily. Rovnako ako vodu, zle znáša aj teplo a vlhko:"},
          {"type": "bullets", "items": [
            "Ľahko sa **prehreje** — ideálne jej je v chlade (zhruba do 20 °C), teploty nad 25 °C sú nebezpečné.",
            "**Vysoká vlhkosť** vzduchu srsti škodí podobne ako priama voda.",
            "Prehriatie spoznáš podľa **ležania na boku, apatie a červených uší** — vtedy koná rýchlo a chinčilu ochlaď."
          ]},
          {"type": "callout", "variant": "tip", "text": "Stav srsti a citlivosť na teplo veľa prezradia — zaznamenávaj si ich spolu s kúpeľmi do [zdravotného pasu](/poradna/digitalny-zdravotny-pas-pre-psa), nech máš prehľad, či je u chinčily všetko v poriadku."}
        ]
      },
      {
        "heading": "Kedy spozornieť",
        "blocks": [
          {"type": "paragraph", "text": "Zdravá chinčila má suchú, nadýchanú srsť, je čulá a zvedavá. Zverolekára vyhľadaj, keď:"},
          {"type": "bullets", "items": [
            "Srsť je **vlhká, zlepená, vypadáva** alebo má holé miesta.",
            "Koža je **červená, šupinatá alebo sa objavia chrasty** (možná pleseň).",
            "Chinčila je **apatická, prehriata alebo prestáva žrať**."
          ]},
          {"type": "paragraph", "text": "Väčšine kožných problémov predídeš jednoducho: suchý prachový kúpeľ, chladné a suché prostredie a žiadna voda na srsti. Keď rešpektuješ, na čo je chinčila stavaná, odmení sa ti hodvábne jemným kožúškom a rokmi dobrého zdravia. A ešte jedna zvláštnosť na záver: chinčily patria medzi najdlhovekejšie drobné hlodavce — pri dobrej starostlivosti sa dožívajú aj pätnásť rokov, takže sa oplatí nastaviť im podmienky správne hneď od začiatku."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Prečo sa chinčila nesmie kúpať vo vode?", "a": "Má mimoriadne hustú srsť, ktorá vodu dlho drží. Vlhkosť pri koži spôsobuje plesne a kožné infekcie a mokrá chinčila sa ľahko podchladí. Namiesto vody sa kúpe v jemnom prachu."},
      {"q": "Ako často má mať chinčila prachový kúpeľ?", "a": "Zvyčajne pár krát týždenne, vždy len na pár minút. Priveľa kúpeľov vysušuje kožu, primálo vedie k zaolejovanej, zlepenej srsti."},
      {"q": "Aký prach použiť na kúpeľ?", "a": "Len jemný špeciálny chinčilový prach, nie ostrý piesok. Ostrý piesok by dráždil kožu a oči."},
      {"q": "Znáša chinčila teplo?", "a": "Zle. Pochádza z chladných And a prehreje sa už nad približne 25 °C. Potrebuje chladné a suché prostredie; vysoká vlhkosť jej srsti škodí podobne ako voda."}
    ]'::jsonb,
    array[]::text[],
    'https://commons.wikimedia.org/wiki/Special:FilePath/Chinchilla_lanigera.jpg?width=1200',
    'Chinčila vlnatá (Chinchilla lanigera)',
    'Foto: Wikimedia Commons',
    'passport',
    null,
    '[
      {"label": "RSPCA — Chinchillas", "url": "https://www.rspca.org.uk/adviceandwelfare/pets/rodents/chinchillas"},
      {"label": "PDSA — Chinchilla care", "url": "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/small-pets/chinchillas"},
      {"label": "VCA Animal Hospitals — Chinchillas", "url": "https://vcahospitals.com/know-your-pet/chinchillas-general"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    21
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
