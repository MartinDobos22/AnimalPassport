-- AnimalPassport — nový článok poradne: "Prečo psy nakláňajú hlavu?"
-- Verejný, globálny obsah BEZ vlastníka (rovnako ako 0019_articles_seed.sql).
-- Idempotentné: re-run aktualizuje článok podľa slug.
-- Vyžaduje 0018_articles.sql.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'preco-psy-naklanaju-hlavu',
    'zdravie',
    array['dog']::text[],
    'Prečo psy nakláňajú hlavu, keď na ne hovoríte?',
    'Prečo psy nakláňajú hlavu nabok? Čo o tom hovorí výskum, ktoré plemená to robia častejšie a kedy je trvalý náklon hlavy dôvod na návštevu veterinára.',
    'Poviete psovi názov jeho obľúbenej hračky a on nakloní hlavu nabok, akoby chcel lepšie rozumieť. Je to jeden z najroztomilejších psích prejavov — a veda konečne tuší, prečo to robí.',
    '[
      {
        "heading": "Nie je to len roztomilé — pes možno naozaj počúva",
        "blocks": [
          {"type": "paragraph", "text": "V roku 2021 sa téme venoval tím Family Dog Project na Univerzite Eötvösa Loránda v Budapešti (výsledky vyšli v časopise Animal Cognition). Vedci sledovali psov pri učení sa názvov hračiek a všimli si zaujímavý vzor."},
          {"type": "bullets", "items": [
            "Takzvané **nadané** psy, ktoré si dokázali zapamätať názvy hračiek, nakláňali hlavu oveľa častejšie.",
            "Náklon prišiel najmä vtedy, keď pes počul **známe, zmysluplné slovo** — napríklad názov konkrétnej hračky.",
            "U bežných psov, ktoré si názvy nezapamätali, bolo naklánanie **zriedkavé**."
          ]},
          {"type": "paragraph", "text": "Vedci preto naznačujú, že naklonenie hlavy môže súvisieť so spracovaním významovej, pre psa dôležitej informácie — akýmsi sústredením sa na to, čo počuje."}
        ]
      },
      {
        "heading": "Ďalšie vysvetlenia, ktoré dávajú zmysel",
        "blocks": [
          {"type": "paragraph", "text": "Naklonenie hlavy pravdepodobne nemá jedinú príčinu — spolu pôsobí viac faktorov:"},
          {"type": "bullets", "items": [
            "**Lepšie počutie** — natočením uší pes presnejšie určí, odkiaľ zvuk prichádza.",
            "**Lepší výhľad** — dlhší ňufák môže psovi čiastočne zakrývať spodnú časť ľudskej tváre; naklonením si odkryje výraz aj pery.",
            "**Sociálna odmena** — keď pes nakloní hlavu, ľudia zareagujú nadšene, čím správanie nevedomky posilňujú."
          ]},
          {"type": "callout", "variant": "info", "text": "Prieskum naznačil, že psy s dlhším ňufákom nakláňajú hlavu častejšie než plemená s plochou tvárou — čo podporuje hypotézu o výhľade. Nejde však o definitívny dôkaz."}
        ]
      },
      {
        "heading": "Kedy naklonená hlava nie je len tak",
        "blocks": [
          {"type": "paragraph", "text": "Občasné naklonenie pri rozhovore alebo neznámom zvuku je úplne normálne a zdravé. Pozor však treba dať, keď je náklon hlavy náhly, trvalý alebo mimovoľný:"},
          {"type": "bullets", "items": [
            "Pes drží hlavu naklonenú **stále, aj v pokoji** — môže ísť o problém s vnútorným uchom alebo rovnováhou.",
            "Sprevádza ho **strata rovnováhy, chôdza do kruhu, mimovoľný pohyb očí** alebo vracanie.",
            "Časté **škrabanie ucha, zápach alebo bolestivosť** — možný zápal ucha."
          ]},
          {"type": "callout", "variant": "warning", "text": "Trvalý náklon hlavy (nie reakcia na tvoj hlas, ale stály stav) je veterinárny prípad — často ide o zápal stredného alebo vnútorného ucha, prípadne poruchu rovnováhy. Neodkladaj návštevu."}
        ]
      },
      {
        "heading": "Čo z toho pre majiteľa",
        "blocks": [
          {"type": "paragraph", "text": "Pri bežnom, reakčnom nakláňaní hlavy sa niet čoho báť — je to znak pozornosti a možno aj snahy porozumieť. Pokojne ho využi: krátke, jasné slová a nadšený tón psa motivujú počúvať."},
          {"type": "callout", "variant": "tip", "text": "Trvalý náklon a jeho prvý výskyt patria do [zdravotného pasu](/poradna/digitalny-zdravotny-pas-pre-psa) — veterinár tak pri diagnostike rovno vidí, odkedy problém trvá a čo ho sprevádza."},
          {"type": "paragraph", "text": "Takže keď na teba pes nabudúce nakloní hlavu, možno naozaj sústredene rozoberá, čo si práve povedal."}
        ]
      },
      {
        "heading": "Ako to využiť pri komunikácii so psom",
        "blocks": [
          {"type": "paragraph", "text": "Keď už vieš, že náklon hlavy súvisí so sústredením, môžeš mu vyjsť v ústrety. Psy reagujú najmä na krátke, zreteľné slová a na tón hlasu, nie na dlhé vety. Pár tipov, ktoré tréning uľahčia:"},
          {"type": "bullets", "items": [
            "Používaj pre každý povel **jedno stále slovo**, nie zakaždým iné.",
            "Spájaj slovo vždy s tou istou situáciou, nech si ho pes prepojí s významom.",
            "Odmeň pozornosť nadšeným tónom alebo maškrtou hneď, ako pes zareaguje.",
            "Nepreháňaj to — aj pozorný pes sa unaví a potrebuje prestávky."
          ]},
          {"type": "paragraph", "text": "Náklon hlavy je pekná pripomienka, že pes ťa naozaj počúva a snaží sa ti porozumieť. Ak mu dáš zrozumiteľné signály, uľahčíš mu prácu a posilníš vaše puto."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Prečo pes nakláňa hlavu, keď na neho hovorím?", "a": "Pravdepodobne kombinuje viac dôvodov — lepšie počuje a lokalizuje zvuk, lepšie vidí tvoju tvár a zároveň spracúva slová, ktoré pozná. Výskum spája časté naklánanie so sústredením na zmysluplné podnety."},
      {"q": "Znamená naklánanie hlavy, že je pes inteligentný?", "a": "Nie priamo. Štúdia zistila, že psy, ktoré si dobre pamätajú názvy hračiek, nakláňali hlavu častejšie, no naklánanie samo o sebe nie je meradlo inteligencie."},
      {"q": "Nakláňajú niektoré plemená hlavu viac?", "a": "Prieskum naznačil, že psy s dlhším ňufákom to robia častejšie než plemená s plochou tvárou, pravdepodobne kvôli lepšiemu výhľadu. Nejde však o pravidlo platné pre každého psa."},
      {"q": "Kedy je naklonená hlava dôvod na návštevu veterinára?", "a": "Keď pes drží hlavu naklonenú stále (aj v pokoji), stráca rovnováhu, chodí do kruhu, škriabe si ucho alebo vracia. Môže ísť o zápal ucha alebo poruchu rovnováhy."}
    ]'::jsonb,
    array['preco-psy-zeru-travu', 'digitalny-zdravotny-pas-pre-psa']::text[],
    'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=70',
    'Pes s naklonenou hlavou pozorne počúva.',
    'Zdroj: Unsplash',
    'passport',
    null,
    '[
      {"label": "American Kennel Club — Why Do Dogs Tilt Their Heads?", "url": "https://www.akc.org/expert-advice/lifestyle/why-do-dogs-tilt-their-heads/"},
      {"label": "ELTE Family Dog Project (Univerzita Eötvösa Loránda)", "url": "https://familydogproject.elte.hu/"},
      {"label": "Sommese et al. (2022), Animal Cognition — head-tilting in dogs", "url": "https://link.springer.com/journal/10071"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    10
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
