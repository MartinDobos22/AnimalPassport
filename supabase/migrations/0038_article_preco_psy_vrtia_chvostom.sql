-- AnimalPassport — nový článok poradne: "Prečo psy vrtia chvostom?"
-- Verejný, globálny obsah BEZ vlastníka (rovnako ako 0019_articles_seed.sql).
-- Idempotentné: re-run aktualizuje článok podľa slug.
-- Vyžaduje 0018_articles.sql.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'preco-psy-vrtia-chvostom',
    'zdravie',
    array['dog']::text[],
    'Prečo psy vrtia chvostom (a čo tým hovoria)',
    'Vrtenie chvostom nie je vždy znak radosti. Čo prezrádza výška, rýchlosť a smer kmitu, prečo psy vrtia inak doľava a doprava a ako psovi lepšie rozumieť.',
    'Pes zavrtí chvostom a my automaticky čítame „mám ťa rád“. Lenže vrtenie chvostom nie je jednoznačný úsmev — je to reč, ktorá má smer, výšku aj rýchlosť, a niekedy znamená pravý opak radosti.',
    '[
      {
        "heading": "Vrtenie nie je vždy radosť",
        "blocks": [
          {"type": "paragraph", "text": "Chvost je pre psa hlavný komunikačný nástroj. Vrtenie znamená vzrušenie a pripravenosť reagovať — a to môže byť pozitívne aj negatívne. Kľúč je v tom, ako presne pes chvostom hýbe:"},
          {"type": "bullets", "items": [
            "**Vysoko zdvihnutý, stuhnutý a rýchly** kmit — napätie, ostražitosť, možná hrozba.",
            "**Nízko posadený, rýchly kmit medzi nohami** — strach alebo neistota.",
            "**Široké, uvoľnené vrtenie celým zadkom** — priateľské, pohodové naladenie."
          ]},
          {"type": "callout", "variant": "info", "text": "Vrtiaci chvost preto nie je automatická pozvánka na hladenie. Vždy ho čítaj spolu s ušami, postojom a mimikou psa."}
        ]
      },
      {
        "heading": "Vľavo, alebo vpravo? Na strane záleží",
        "blocks": [
          {"type": "paragraph", "text": "Taliansky výskum (Quaranta a kol., 2007) priniesol prekvapivé zistenie: psy nevrtia symetricky."},
          {"type": "bullets", "items": [
            "Pri niečom **príjemnom** (napríklad pri majiteľovi) vrtia chvostom viac **doprava**.",
            "Pri niečom, z čoho majú **obavy**, sa vrtenie prikláňa **doľava**.",
            "Súvisí to s tým, ktorá mozgová hemisféra situáciu spracúva."
          ]},
          {"type": "paragraph", "text": "Neskoršie štúdie ukázali, že aj iné psy si tejto asymetrie všímajú a podľa nej reagujú — takže je to reč, ktorej rozumejú medzi sebou."}
        ]
      },
      {
        "heading": "Šteňatá sa to učia",
        "blocks": [
          {"type": "paragraph", "text": "Novonarodené šteňatá chvostom takmer nevrtia — začínajú približne okolo šiesteho týždňa, keď sa rozbieha sociálna komunikácia so súrodencami a matkou. Vrtenie je teda naučená súčasť „reči“, nie vrodený reflex radosti."}
        ]
      },
      {
        "heading": "Ako psovi lepšie rozumieť",
        "blocks": [
          {"type": "paragraph", "text": "Namiesto jediného „vrtí = teší sa“ sleduj celkový obraz:"},
          {"type": "bullets", "items": [
            "**Výšku chvosta** — vysoko znamená istotu alebo napätie, nízko neistotu.",
            "**Rýchlosť a rozsah** kmitu.",
            "**Zvyšok tela** — uvoľnené vs. stuhnuté držanie, uši, tlama."
          ]},
          {"type": "callout", "variant": "tip", "text": "Náhla zmena v reči tela alebo nálade psa stojí za poznámku v [zdravotnom pase](/poradna/digitalny-zdravotny-pas-pre-psa) — súvislosti ako bolesť či stres sa tak odhalia skôr."},
          {"type": "paragraph", "text": "Keď sa nabudúce pes rozvrtí, pozri sa pozornejšie — možno ti hovorí viac než len to, že je rád."}
        ]
      },
      {
        "heading": "Reč tela nekončí pri chvoste",
        "blocks": [
          {"type": "paragraph", "text": "Chvost je len jedna veta z celého príbehu, ktorý ti pes rozpráva telom. Aby si mu rozumel, čítaj ho ako celok:"},
          {"type": "bullets", "items": [
            "**Uši** — dopredu natočené značia záujem, pritisnuté dozadu strach alebo podriadenie.",
            "**Postoj** — uvoľnené, mierne prehnuté telo je pohoda; strnulé a nahnuté dopredu napätie.",
            "**Oči a tlama** — mäkký pohľad a pootvorená papuľa značia pokoj; strnulý pohľad a obnažené zuby varovanie.",
            "**Srsť** — naježená srsť na chrbte prezrádza silné vzrušenie, príjemné aj nepríjemné."
          ]},
          {"type": "paragraph", "text": "Nebezpečné nedorozumenia vznikajú práve vtedy, keď človek vytrhne jeden signál z kontextu. Klasický príklad je dieťa, ktoré vidí vrtiaci chvost a bezhlavo sa vrhne psa objať — hoci zvyšok tela kričí, že pes je vystrašený. Preto uč hlavne deti pravidlo: k cudziemu psovi sa nepribližuj len preto, že vrtí chvostom."},
          {"type": "paragraph", "text": "Reč tela sa dá čítať aj opačne — pes pozorne sleduje tú tvoju. Pokojný postoj, tichý hlas a žiadne náhle pohyby psovi signalizujú, že sa nemá čoho báť, a uľahčia každé stretnutie. Vzájomné čítanie signálov je základ dôvery medzi psom a človekom — a čím pozornejšie sleduješ celé telo, nielen chvost, tým menej nedorozumení medzi vami vznikne a tým pokojnejší a istejší pes bude."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Znamená vrtenie chvostom vždy, že je pes šťastný?", "a": "Nie. Vrtenie signalizuje vzrušenie, ktoré môže byť aj negatívne — strach či napätie. Dôležitá je výška, rýchlosť a celková reč tela."},
      {"q": "Čo znamená, keď pes vrtí chvostom vysoko a stuhnuto?", "a": "Zvyčajne napätie alebo ostražitosť, niekedy predzvesť agresie. Takýto chvost nie je pozvánka na hladenie."},
      {"q": "Je pravda, že psy vrtia inak doľava a doprava?", "a": "Áno. Výskum zistil, že pri príjemných podnetoch psy vrtia viac doprava a pri nepríjemných doľava, čo súvisí s prácou mozgových hemisfér."},
      {"q": "Odkedy šteňatá vrtia chvostom?", "a": "Vrtieť začínajú približne okolo šiesteho týždňa života, keď sa rozvíja ich sociálna komunikácia. U novonarodených šteniat sa vrtenie takmer neobjavuje."}
    ]'::jsonb,
    array['preco-psy-naklanaju-hlavu', 'preco-psy-zeru-travu']::text[],
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1200&q=70',
    'Pes vrtiaci chvostom vonku v tráve.',
    'Zdroj: Unsplash',
    'passport',
    null,
    '[
      {"label": "Quaranta et al. (2007), Current Biology — asymmetric tail-wagging in dogs", "url": "https://www.cell.com/current-biology/"},
      {"label": "American Kennel Club — Tail Wagging: What Does It Mean?", "url": "https://www.akc.org/expert-advice/health/tail-wagging-what-does-it-mean/"},
      {"label": "University of Lincoln — animal behaviour research", "url": "https://www.lincoln.ac.uk/"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    14
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
