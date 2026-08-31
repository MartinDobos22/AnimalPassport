-- AnimalPassport — nový článok poradne: "Prečo plaz potrebuje teplo a UVB svetlo"
-- Prvý článok o plazoch (korytnačky, agamy, gekóny, …).
-- cover_image: reálna fotka z fotobanky Pexels (voľná licencia).
-- Idempotentné: re-run aktualizuje článok podľa slug. Vyžaduje 0018 + 0028 + 0024 + 0022.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'plaz-teplo-a-uvb-svetlo',
    'zdravie',
    array['turtle', 'tortoise', 'lizard', 'bearded_dragon', 'gecko']::text[],
    'Prečo plaz potrebuje teplo a UVB svetlo (a čo sa stane bez nich)',
    'Prečo korytnačky a plazy potrebujú teplo aj UVB svetlo? Ektotermia, vitamín D3 a metabolické ochorenie kostí (MBD) — najčastejšia smrteľná chyba v chove plazov a ako jej predísť.',
    'Korytnačka či agama nezomrie zo dňa na deň. Chradne pomaly a potichu — mäknú jej kosti, deformuje sa pancier, prestáva žrať. A na vine nebýva choroba, ale dve veci, ktoré v teráriu chýbali: správne teplo a UVB svetlo.',
    '[
      {
        "heading": "Plaz je studenokrvný — teplo si musí požičať",
        "blocks": [
          {"type": "paragraph", "text": "Na rozdiel od psa či mačky si plazy nevyrábajú vlastné telesné teplo. Sú ektotermné (studenokrvné) — ich telesná teplota, trávenie aj imunita závisia od prostredia. V prírode sa striedavo vyhrievajú na slnku a chladia v tieni; v teráriu im tento výber musíš vytvoriť ty."},
          {"type": "bullets", "items": [
            "Terárium potrebuje **teplotný gradient** — teplý koniec na vyhrievanie a chladnejšiu zónu.",
            "Plaz sa medzi nimi presúva a **sám si reguluje** teplotu.",
            "Teploty sú **druhovo špecifické** — púštna agama a vodná korytnačka majú úplne iné nároky."
          ]},
          {"type": "callout", "variant": "warning", "text": "Pri nízkej teplote plaz nestrávi potravu — tá mu môže v žalúdku začať hniť. Chlad je jednou z najčastejších príčin zdravotných problémov u domácich plazov."}
        ]
      },
      {
        "heading": "UVB svetlo: neviditeľné, no životne dôležité",
        "blocks": [
          {"type": "paragraph", "text": "Druhá vec, ktorú slnko v prírode dodáva zadarmo, je UVB žiarenie. Plaz ho potrebuje na to, aby si v koži vytvoril vitamín D3 — a bez D3 nedokáže vstrebávať vápnik z potravy."},
          {"type": "paragraph", "text": "Bez UVB (alebo bez doplnkov D3 a vápnika) sa rozvíja metabolické ochorenie kostí (MBD) — jeden z najčastejších a najsmutnejších dôvodov, prečo domáce plazy hynú:"},
          {"type": "bullets", "items": [
            "**Príznaky MBD** — mäkký alebo deformovaný pancier, krivá čeľusť, opuchnuté končatiny, zlomeniny, tras a kŕče.",
            "Postihuje najmä **korytnačky, leguány a agamy** pri zlom chove.",
            "Je do veľkej miery **preventabilné** — no v pokročilom štádiu už nezvratné."
          ]}
        ]
      },
      {
        "heading": "Časté chyby s osvetlením a teplom",
        "blocks": [
          {"type": "bullets", "items": [
            "**Sklo a plexisklo blokujú UVB** — žiarovka musí svietiť priamo, bez krytu medzi ňou a plazom.",
            "**UVB trubice starnú** — UVB slabne, aj keď svetlo ešte svieti; meň ich podľa výrobcu (často po 6 až 12 mesiacoch).",
            "**Odhad namiesto teplomera** — bez teplomera a termostatu netušíš skutočnú teplotu.",
            "**Jedna teplota v celom teráriu** — plaz potrebuje gradient, nie rovnomerné teplo."
          ]},
          {"type": "callout", "variant": "info", "text": "Vápnikové a D3 doplnky často treba aj popri UVB, najmä u rastúcich mláďat a gravidných samíc. Konkrétny režim doplnkov sa líši podľa druhu — iné potrebuje bylinožravá korytnačka a iné mäsožravý gekón."}
        ]
      },
      {
        "heading": "Ako to nastaviť správne",
        "blocks": [
          {"type": "paragraph", "text": "Základ dobrého terária je napodobniť podmienky, na ktoré je daný druh prispôsobený. Pár pilierov, ktoré platia takmer vždy:"},
          {"type": "bullets", "items": [
            "Zisti **presné nároky svojho druhu** (teploty dňa a noci, typ UVB, vlhkosť) — nie plazy vo všeobecnosti.",
            "Vytvor **teplotný gradient** s vyhrievacím miestom a tieňom.",
            "Nainštaluj **vhodný zdroj UVB** a zapíš si dátum výmeny.",
            "**Meraj teplotu** teplomermi a riaď ju termostatom, nie odhadom.",
            "Zabezpeč **režim deň a noc** — svetlo a teplo v noci väčšine druhov uber."
          ]},
          {"type": "callout", "variant": "tip", "text": "Keďže sa u plazov problém prejaví pomaly, oplatí sa viesť si druh, teploty aj dátum výmeny UVB v [zdravotnom pase](/poradna/digitalny-zdravotny-pas-pre-psa) — zhoršovanie tak zbadáš včas."}
        ]
      },
      {
        "heading": "Kedy k veterinárovi",
        "blocks": [
          {"type": "paragraph", "text": "Plazy sú majstri v skrývaní slabosti, takže príznaky treba brať vážne hneď, ako sa objavia. Vyhľadaj veterinára, ktorý ošetruje plazy, keď:"},
          {"type": "bullets", "items": [
            "Plaz **odmieta žrať, chudne** alebo je nezvyčajne apatický.",
            "**Mäkne mu pancier**, deformuje sa čeľusť či končatiny, alebo sa trasie.",
            "Má **opuchy, ťažkosti s pohybom alebo dýchaním**."
          ]},
          {"type": "paragraph", "text": "Nie každý veterinár plazy ošetruje — vopred si nájdi takého, ktorý sa venuje exotom. Správne teplo a svetlo pritom väčšine problémov predídu úplne. Pri plazoch platí dvojnásobne, že dobré terárium je najlepší liek."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Prečo plaz potrebuje UVB svetlo?", "a": "UVB umožňuje plazovi vytvoriť v koži vitamín D3, bez ktorého nevstrebáva vápnik. Bez UVB alebo doplnkov D3 hrozí metabolické ochorenie kostí s mäknutím a deformáciami kostí."},
      {"q": "Stačí plazovi obyčajná žiarovka na teplo?", "a": "Teplo a UVB sú dve rôzne veci. Bežná žiarovka dá teplo, ale nie UVB. Navyše sklo či plexisklo UVB blokuje, takže zdroj musí svietiť priamo na plaza."},
      {"q": "Prečo treba UVB trubicu meniť, keď ešte svieti?", "a": "UVB žiarenie slabne rýchlejšie než viditeľné svetlo. Trubica môže svietiť a pritom už nedávať dosť UVB, preto ju meň podľa pokynov výrobcu, často po 6 až 12 mesiacoch."},
      {"q": "Čo je metabolické ochorenie kostí u plazov?", "a": "Je to porucha z nedostatku vápnika a D3, pri ktorej mäknú a deformujú sa kosti a pancier. Býva dôsledkom chýbajúceho UVB alebo zlej stravy a v pokročilom štádiu je nezvratné."}
    ]'::jsonb,
    array[]::text[],
    'https://images.pexels.com/photos/20549160/pexels-photo-20549160.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Agama fúzatá vyhrievajúca sa na kameni',
    'Foto: Pexels',
    'passport',
    null,
    '[
      {"label": "Association of Reptilian and Amphibian Veterinarians (ARAV)", "url": "https://arav.org/"},
      {"label": "RSPCA — Reptiles", "url": "https://www.rspca.org.uk/adviceandwelfare/pets/reptiles"},
      {"label": "The Tortoise Trust", "url": "https://www.tortoisetrust.org/"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    20
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
