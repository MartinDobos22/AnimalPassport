-- AnimalPassport — nový článok poradne: "Prečo nové akvárium zabíja rybičky"
-- Prvý článok o rybičkách (species = fish).
-- cover_image: reálna fotka z fotobanky Pexels (voľná licencia).
-- Idempotentné: re-run aktualizuje článok podľa slug. Vyžaduje 0018 + 0028 + 0024 + 0022.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'preco-nove-akvarium-zabija-rybicky',
    'zdravie',
    array['fish']::text[],
    'Prečo nové akvárium zabíja rybičky (a ako tomu predísť)',
    'Prečo v novom akváriu hynú rybičky, aj keď je voda číra? Vysvetlenie dusíkového cyklu, amoniaku a „new tank syndrome" — plus ako nádrž bezpečne zabehnúť.',
    'Kúpiš akvárium, napustíš vodu, o hodinu pridáš rybičky — a o týždeň zahynú jedna po druhej. Nie je to smola ani zlá voda z vodovodu. Je to najčastejšia chyba začiatočníkov a má meno: chýbajúci dusíkový cyklus.',
    '[
      {
        "heading": "Neviditeľný zabijak: amoniak",
        "blocks": [
          {"type": "paragraph", "text": "Rybičky nepretržite vylučujú odpad a spolu s rozkladajúcim sa krmivom sa z neho uvoľňuje amoniak. Ten je pre ryby vysoko jedovatý už v malých koncentráciách — poškodzuje žiabre, dusí ich a oslabuje imunitu. V zabehnutom akváriu ho priebežne odbúravajú užitočné baktérie. V novom akváriu tieto baktérie ešte nie sú."},
          {"type": "bullets", "items": [
            "Zdroje amoniaku: **trus rýb, zvyšky krmiva, uhynuté rastliny**.",
            "Rybe dokáže uškodiť už **veľmi nízka koncentrácia** amoniaku.",
            "Číra voda neznamená bezpečná voda — **amoniak nevidno ani necítiť**."
          ]}
        ]
      },
      {
        "heading": "Dusíkový cyklus vysvetlený jednoducho",
        "blocks": [
          {"type": "paragraph", "text": "V zdravom akváriu neustále prebieha proces, ktorý premieňa jed na menej škodlivé látky. Zabezpečujú ho dva druhy užitočných baktérií, ktoré osídlia filter a povrchy v nádrži:"},
          {"type": "bullets", "ordered": true, "items": [
            "**Amoniak** (jedovatý) → baktérie ho menia na **dusitany**.",
            "**Dusitany** (stále jedovaté) → iné baktérie ich menia na **dusičnany**.",
            "**Dusičnany** (oveľa menej škodlivé) → odstraňuješ ich čiastočnou výmenou vody."
          ]},
          {"type": "paragraph", "text": "Kým sa tieto baktérie dostatočne namnožia, prejdú spravidla 4 až 8 týždňov. Tomuto obdobiu sa hovorí zabehávanie akvária a preskočiť sa nedá."}
        ]
      },
      {
        "heading": "Ako akvárium bezpečne zabehnúť",
        "blocks": [
          {"type": "paragraph", "text": "Trik je nechať baktérie narásť ešte predtým, než pridáš ryby — takzvané cyklovanie naprázdno:"},
          {"type": "bullets", "items": [
            "**Nasadenie bez rýb** — pridávaj malý zdroj amoniaku (napr. štipku krmiva) a nechaj filter nepretržite bežať.",
            "**Testuj vodu** kvapkovými testami na amoniak, dusitany a dusičnany.",
            "**Cyklus je hotový**, keď amoniak aj dusitany klesnú na nulu a objavia sa dusičnany.",
            "**Urýchli to** naočkovaním filtračnej hmoty alebo média zo zabehnutého akvária."
          ]},
          {"type": "callout", "variant": "warning", "text": "Nikdy nenasadzuj plný počet rýb naraz do nového akvária. Preťažíš tým systém amoniakom skôr, než ho baktérie stihnú spracovať."}
        ]
      },
      {
        "heading": "Bežné chyby, ktoré cyklus zabíjajú",
        "blocks": [
          {"type": "bullets", "items": [
            "**Prehnané kŕmenie** — nezjedené krmivo je hlavný zdroj amoniaku. Kŕm málo a menej často.",
            "**Umývanie filtra pod vodovodom** — chlór zabije baktérie; filtračnú hmotu preplachuj len v odobratej akváriovej vode.",
            "**Priveľké výmeny vody či silné čistenie na začiatku** — zničíš práve budujúcu sa kolóniu baktérií.",
            "**Nepoužitie odchlorovača** — chlór a chloramín z vodovodu sú toxické pre ryby aj baktérie."
          ]},
          {"type": "callout", "variant": "tip", "text": "Pri akváriu je história zlato — dátum nasadenia, výsledky testov vody aj úhyny si zapisuj do [zdravotného pasu](/poradna/digitalny-zdravotny-pas-pre-psa) a rýchlo uvidíš, kde je chyba."}
        ]
      },
      {
        "heading": "Keď je už neskoro: ako zachrániť ryby",
        "blocks": [
          {"type": "paragraph", "text": "Ak si ryby nasadil priskoro a začínajú javiť príznaky otravy — dýchajú pri hladine, majú stiahnuté plutvy, sú apatické alebo strácajú farbu — konaj hneď:"},
          {"type": "bullets", "items": [
            "Okamžite sprav **čiastočnú výmenu vody** (odchlorovanou, rovnako teplou), aby si zriedil amoniak.",
            "Dočasne **zastav alebo výrazne obmedz kŕmenie**.",
            "Ak ho máš, pridaj **prípravok viažuci amoniak** alebo odchlorovač s detoxikáciou.",
            "**Otestuj vodu**, aby si vedel, čo presne rieši."
          ]},
          {"type": "paragraph", "text": "Trpezlivosť je pri akváriu tá najlacnejšia poistka. Pár týždňov čakania na zabehnutie ušetrí ryby aj tvoje nervy — a z „prekliateho“ akvária, v ktorom nič neprežije, sa stane stabilný a zdravý domov. A ešte rada pre začiatočníkov: prvé ryby voľ otužilé, nenáročné druhy a nasaď len zopár kusov — ušetríš tým citlivejšie ryby, kým sa nádrž ešte len usádza."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Prečo mi v novom akváriu hynú ryby, aj keď je voda číra?", "a": "Číra voda môže obsahovať jedovatý amoniak, ktorý nevidno ani necítiť. V novom akváriu chýbajú baktérie, ktoré ho odbúravajú — nádrž treba najprv zabehnúť."},
      {"q": "Ako dlho trvá zabehnutie akvária?", "a": "Zvyčajne 4 až 8 týždňov, kým sa namnožia užitočné baktérie premieňajúce amoniak na menej škodlivé látky. Proces sa dá urýchliť médiom zo zabehnutej nádrže."},
      {"q": "Môžem pridať všetky ryby naraz?", "a": "Nie. Do nového akvária nasadzuj ryby postupne a v malom počte, inak systém preťažíš amoniakom skôr, než ho baktérie stihnú spracovať."},
      {"q": "Prečo sa nemá filter umývať pod vodovodom?", "a": "Chlór z vodovodnej vody zabije užitočné baktérie vo filtri. Filtračnú hmotu preto preplachuj len v odobratej akváriovej vode."}
    ]'::jsonb,
    array[]::text[],
    'https://images.pexels.com/photos/9890560/pexels-photo-9890560.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Rybičky v akváriu',
    'Foto: Pexels',
    'passport',
    null,
    '[
      {"label": "RSPCA — Caring for your fish", "url": "https://www.rspca.org.uk/adviceandwelfare/pets/fish"},
      {"label": "Practical Fishkeeping — the nitrogen cycle", "url": "https://www.practicalfishkeeping.co.uk/"},
      {"label": "AVMA — Selecting a pet fish", "url": "https://www.avma.org/resources-tools/pet-owners/petcare/selecting-pet-fish"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    19
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
