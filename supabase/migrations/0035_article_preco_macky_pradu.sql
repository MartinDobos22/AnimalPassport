-- AnimalPassport — nový článok poradne: "Prečo mačky pradú?"
-- Verejný, globálny obsah BEZ vlastníka (rovnako ako 0019_articles_seed.sql).
-- Prvý článok o mačkách — rozširuje poradňu za rámec psov.
-- Idempotentné: re-run aktualizuje článok podľa slug.
-- Vyžaduje 0018_articles.sql.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'preco-macky-pradu',
    'zdravie',
    array['cat']::text[],
    'Prečo mačky pradú?',
    'Prečo mačky pradú a znamená to vždy spokojnosť? Čo hovorí výskum o prosebnom pradení, hojivých frekvenciách a kedy je pradenie signál, že mačke nie je dobre.',
    'Mačka sa ti usadí na kolenách, privrie oči a rozbehne ten typický jemný motor. Pradenie automaticky spájame so spokojnosťou — lenže mačky pradú aj vtedy, keď im vôbec do smiechu nie je.',
    '[
      {
        "heading": "Pradenie nie je len o spokojnosti",
        "blocks": [
          {"type": "paragraph", "text": "Áno, mačky často pradú, keď sú uvoľnené a spokojné. Vedci však pozorovali pradenie aj v situáciách, ktoré sú od pohody na míle vzdialené:"},
          {"type": "bullets", "items": [
            "U veterinára, v strese alebo pri bolesti.",
            "Pri zranení či vážnej chorobe, niekedy aj v posledných chvíľach života.",
            "U mačiat, ktoré pradú už pár dní po narodení pri kojení."
          ]},
          {"type": "paragraph", "text": "To naznačuje, že pradenie je aj forma sebaupokojenia — mačka si ním pomáha zvládať stres podobne, ako si človek pohmkáva pod nos."}
        ]
      },
      {
        "heading": "Prosba skrytá v pradení",
        "blocks": [
          {"type": "paragraph", "text": "Výskum University of Sussex (McComb a kol., 2009) odhalil, že mačky vedia do pradenia votkať vysoký, naliehavý tón, ktorý pripomína detský plač. Hovorí sa mu „prosebné pradenie“."},
          {"type": "bullets", "items": [
            "Ľudia ho vnímajú ako **naliehavejšie** a ťažšie sa ignoruje.",
            "Mačky ho používajú najmä vtedy, keď niečo chcú — typicky **jedlo**.",
            "Vo frekvencii sa skrýva podnet, na ktorý sme ako ľudia mimoriadne citliví."
          ]},
          {"type": "callout", "variant": "info", "text": "Ak máš pocit, že ťa mačka pradením prehovára k skorším raňajkám, nie si ďaleko od pravdy."}
        ]
      },
      {
        "heading": "Môže pradenie liečiť?",
        "blocks": [
          {"type": "paragraph", "text": "Pradenie sa pohybuje zväčša v rozsahu približne 25 až 150 Hz. Časť bioakustického výskumu naznačuje, že nízke frekvencie v tomto pásme môžu podporovať hojenie kostí a tkanív."},
          {"type": "paragraph", "text": "Ide zatiaľ o hypotézu, nie o dokázaný liečivý efekt. Pomohla by však vysvetliť, prečo mačky pradú aj vtedy, keď sa zotavujú alebo sú zranené — akoby si samy dopriavali upokojujúcu, jemnú vibráciu."}
        ]
      },
      {
        "heading": "Ako pradeniu rozumieť",
        "blocks": [
          {"type": "paragraph", "text": "Pradenie čítaj vždy v kontexte celého tela mačky. Ten istý zvuk môže znamenať blaho aj tieseň:"},
          {"type": "bullets", "items": [
            "**Spokojné pradenie:** uvoľnené telo, privreté oči, prípadne „šliapanie“ labkami.",
            "**Varovné pradenie:** mačka sa skrýva, nežerie, je apatická alebo pradie pri zjavnej bolesti."
          ]},
          {"type": "callout", "variant": "tip", "text": "Keď mačka pradie inak než zvyčajne, poznač si to spolu so zmenou chuti do jedla do [zdravotného pasu](/poradna/digitalny-zdravotny-pas-pre-psa) — veterinár potom ľahšie odlíši spokojné pradenie od bolesti."},
          {"type": "paragraph", "text": "Nabudúce, keď sa mačka rozpradie, vypočuj si nielen ten zvuk, ale aj to, čo ti ním hovorí."}
        ]
      },
      {
        "heading": "Ako mačke rozumieť ešte lepšie",
        "blocks": [
          {"type": "paragraph", "text": "Pradenie je len jeden z mnohých spôsobov, akými s tebou mačka komunikuje. Aby si jej signálom rozumel správne, sleduj ho vždy spolu s ostatnou rečou tela:"},
          {"type": "bullets", "items": [
            "**Chvost** — vztýčený s jemne zahnutou špičkou znamená priateľské naladenie, našponovaný a naježený strach či podráždenie.",
            "**Uši** — dopredu natočené značia záujem, pritisnuté dozadu tieseň alebo hrozbu.",
            "**Oči** — pomalé žmurkanie je mačacie vyznanie dôvery; skús mu ho opätovať.",
            "**Mrnkanie** — dospelé mačky mrnčia takmer výhradne na ľudí, nie medzi sebou; je to naučený spôsob, ako si vypýtať pozornosť."
          ]},
          {"type": "paragraph", "text": "Keď tieto signály čítaš spolu, pradenie dostane jasnejší význam. Uvoľnená mačka s privretými očami a pomaly kmitajúcim chvostom, ktorá ti pradie na kolenách, ti hovorí, že sa cíti bezpečne. Naopak mačka, ktorá pradie skrčená v kúte s pritisnutými ušami, sa skôr upokojuje sama. Čím lepšie poznáš celý repertoár, tým skôr zbadáš, keď sa niečo zmení."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Pradú mačky len keď sú spokojné?", "a": "Nie. Mačky pradú aj v strese, pri bolesti či chorobe. Pradenie slúži aj na sebaupokojenie, preto ho treba vždy čítať v kontexte celkového správania."},
      {"q": "Prečo mačka pradie, keď chce jedlo?", "a": "Ide o takzvané prosebné pradenie — mačka doň votká vysoký tón pripomínajúci detský plač, ktorý ľudia vnímajú ako naliehavý a ťažšie ho ignorujú."},
      {"q": "Ako mačka vlastne pradie?", "a": "Pradenie vzniká rytmickým sťahovaním svalov hrtana, ktoré rozkmitá hlasivky pri nádychu aj výdychu. Preto znie plynulo a takmer neprerušovane."},
      {"q": "Môže byť pradenie príznakom, že mačke nie je dobre?", "a": "Áno. Ak mačka pradie a zároveň sa skrýva, nežerie, je apatická alebo pôsobí, že ju niečo bolí, poraď sa s veterinárom."}
    ]'::jsonb,
    array['preco-psy-naklanaju-hlavu', 'preco-psy-zeru-travu']::text[],
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=70',
    'Mačka spokojne odpočíva a pradie.',
    'Zdroj: Unsplash',
    'passport',
    null,
    '[
      {"label": "Cornell Feline Health Center (Cornell University)", "url": "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center"},
      {"label": "International Cat Care", "url": "https://icatcare.org/"},
      {"label": "McComb et al. (2009), Current Biology — the cry embedded within the purr", "url": "https://www.cell.com/current-biology/"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    11
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
