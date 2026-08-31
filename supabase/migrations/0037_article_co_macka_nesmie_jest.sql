-- AnimalPassport — nový článok poradne: "Čo mačka nesmie jesť"
-- Verejný, globálny obsah BEZ vlastníka (rovnako ako 0019_articles_seed.sql).
-- Idempotentné: re-run aktualizuje článok podľa slug.
-- Vyžaduje 0018_articles.sql.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'co-macka-nesmie-jest',
    'krmivo',
    array['cat']::text[],
    'Čo mačka nesmie jesť',
    'Zoznam potravín a látok nebezpečných pre mačku: cibuľa, čokoláda, hrozno, mlieko a ľudské lieky. Prečo mačka znáša menej než človek a čo robiť pri otrave.',
    'Mačka je maškrtná, no zároveň prekvapivo dôverčivá — kúsok z taniera si nepýta dvakrát. Problém je, že viaceré bežné potraviny a lieky sú pre ňu oveľa nebezpečnejšie než pre nás, niekedy až smrteľne.',
    '[
      {
        "heading": "Prečo mačka znáša menej než človek",
        "blocks": [
          {"type": "paragraph", "text": "Mačka je striktný mäsožravec a jej pečeň spracúva niektoré látky inak než tá naša — časť z nich dokáže odbúravať len veľmi pomaly alebo vôbec. Preto jej uškodí aj množstvo, ktoré by človek ani nezaregistroval. Navyše je malá, takže „troška“ je pre ňu v prepočte na hmotnosť veľká dávka."}
        ]
      },
      {
        "heading": "Najnebezpečnejšie potraviny",
        "blocks": [
          {"type": "bullets", "items": [
            "**Cibuľa, cesnak, pór a pažítka** — poškodzujú červené krvinky, a to aj varené, sušené či v prášku. Mačky sú na ne obzvlášť citlivé.",
            "**Čokoláda a kofeín** — teobromín a kofeín spôsobujú búšenie srdca, kŕče až ohrozenie života.",
            "**Hrozno a hrozienka** — spájané s poškodením obličiek; radšej sa im vyhni úplne.",
            "**Alkohol a surové kysnuté cesto** — toxické už v malom množstve, cesto navyše kvasí v žalúdku.",
            "**Surové ryby vo veľkom** — obsahujú enzým, ktorý rozkladá vitamín B1 (tiamín); dlhodobo hrozí jeho nedostatok."
          ]},
          {"type": "callout", "variant": "warning", "text": "Paracetamol a podobné lieky proti bolesti pre ľudí sú pre mačky mimoriadne jedovaté — už jedna tableta môže byť smrteľná. Nikdy nedávaj mačke lieky určené ľuďom bez pokynu veterinára."}
        ]
      },
      {
        "heading": "Mýtus o miske mlieka",
        "blocks": [
          {"type": "paragraph", "text": "Klasický obrázok mačky s miskou mlieka je zavádzajúci. Väčšina dospelých mačiek je laktózovo intolerantná — mlieko im nie je priamo jedom, ale spôsobuje hnačku a tráviace ťažkosti. Čistá voda je vždy lepšia voľba."},
          {"type": "callout", "variant": "info", "text": "Pozor aj na dlhodobé kŕmenie mačky psím krmivom. Nie je akútne jedovaté, no chýba v ňom taurín — aminokyselina, ktorú mačka nevyhnutne potrebuje pre srdce a zrak."}
        ]
      },
      {
        "heading": "Čo robiť pri podozrení na otravu",
        "blocks": [
          {"type": "paragraph", "text": "Ak mačka zjedla niečo rizikové, koná sa rýchlo. Priprav si informácie a bezodkladne volaj veterinára alebo pohotovosť:"},
          {"type": "bullets", "items": [
            "**Čo a približne koľko** mačka zjedla a **kedy**.",
            "**Hmotnosť** mačky a aktuálne príznaky (vracanie, slabosť, slinenie, kŕče).",
            "Ak vieš, **odlož obal** alebo zvyšok látky."
          ]},
          {"type": "callout", "variant": "warning", "text": "Nevyvolávaj zvracanie na vlastnú päsť — pri niektorých látkach to škodí viac než pomáha. Postupuj len podľa pokynov veterinára."},
          {"type": "callout", "variant": "tip", "text": "Alergie, intolerancie a zdravotné stavy mačky si vieš viesť v jej profile. Pri [analýze krmiva](/poradna/analyza-krmiva-pre-psa) ťa Pawly upozorní na rizikové zložky voči profilu zvieraťa. Psí náprotivok tejto témy nájdeš v článku [čo nesmie pes jesť](/poradna/co-nesmie-pes-jest)."}
        ]
      },
      {
        "heading": "Ako otrave predísť",
        "blocks": [
          {"type": "paragraph", "text": "Najlepšia liečba otravy je tá, ktorá nikdy nie je potrebná. Väčšine problémov predídeš pár jednoduchými návykmi v domácnosti:"},
          {"type": "bullets", "items": [
            "**Skladovanie** — rizikové potraviny (cibuľu, cesnak, čokoládu, hrozno) drž v zatvorených skrinkách, nie voľne na linke.",
            "**Lieky mimo dosahu** — tabletky nikdy nenechávaj na nočnom stolíku; mačka ľahko zhodí a prehryzne blister.",
            "**Žiadne zvyšky zo stola** — aj s dobrým úmyslom môžeš mačke podať niečo, čo jej uškodí; drž sa krmiva a bezpečných maškŕt.",
            "**Rastliny** — pozor aj na izbové kvety; viaceré (napríklad ľalie) sú pre mačky vysoko toxické."
          ]},
          {"type": "paragraph", "text": "Pouč aj deti a návštevy, čo mačke nesmú dať. A maj po ruke kontakt na svojho veterinára aj na najbližšiu pohotovosť — pri otrave často rozhoduje čas a pár minút hľadania čísla môže byť tých najdôležitejších."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Smie mačka mlieko?", "a": "Väčšina dospelých mačiek je laktózovo intolerantná, takže mlieko im spôsobuje hnačku a tráviace ťažkosti. Nie je to priamo jed, ale lepšia je čistá voda."},
      {"q": "Je čokoláda nebezpečná aj pre mačky?", "a": "Áno. Čokoláda obsahuje teobromín a kofeín, ktoré sú pre mačky toxické a môžu spôsobiť búšenie srdca, kŕče až ohrozenie života."},
      {"q": "Prečo je pre mačku nebezpečný paracetamol?", "a": "Mačka ho nedokáže bezpečne odbúrať a už veľmi malá dávka jej môže poškodiť pečeň a červené krvinky. Nikdy nepodávaj mačke ľudské lieky bez pokynu veterinára."},
      {"q": "Môže mačka dlhodobo jesť psie krmivo?", "a": "Nie. Psie krmivo neobsahuje dostatok taurínu, ktorý mačka potrebuje pre srdce a zrak. Krátkodobo neuškodí, dlhodobo spôsobí vážny deficit."},
      {"q": "Čo robiť, keď mačka zje niečo zakázané?", "a": "Bezodkladne kontaktuj veterinára alebo pohotovosť a uveď, čo a koľko mačka zjedla, kedy a akú má hmotnosť. Nečakaj na príznaky a nevyvolávaj zvracanie bez pokynu."}
    ]'::jsonb,
    array['co-nesmie-pes-jest', 'preco-macky-pradu']::text[],
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=70',
    'Mačka pri miske s jedlom.',
    'Zdroj: Unsplash',
    'food',
    null,
    '[
      {"label": "ASPCA — Animal Poison Control (People Foods to Avoid)", "url": "https://www.aspca.org/pet-care/animal-poison-control/people-foods-avoid-feeding-your-pets"},
      {"label": "International Cat Care", "url": "https://icatcare.org/"},
      {"label": "Cornell Feline Health Center (Cornell University)", "url": "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    13
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
