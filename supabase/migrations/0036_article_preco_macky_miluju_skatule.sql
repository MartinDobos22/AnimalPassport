-- AnimalPassport — nový článok poradne: "Prečo mačky milujú škatule?"
-- Verejný, globálny obsah BEZ vlastníka (rovnako ako 0019_articles_seed.sql).
-- Idempotentné: re-run aktualizuje článok podľa slug.
-- Vyžaduje 0018_articles.sql.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'preco-macky-miluju-skatule',
    'zdravie',
    array['cat']::text[],
    'Prečo mačky milujú škatule?',
    'Prečo si mačka radšej sadne do prázdnej škatule než do drahej hračky? Bezpečie, teplo a inštinkt ohraničeného priestoru — čo o tom hovorí výskum.',
    'Rozbalíš drahú hračku, mačka ju odignoruje a s blaženou istotou sa usadí do prázdnej škatule. Klasika, na ktorej sa smeje celý internet — no za „if it fits, I sits“ je prekvapivo solídna veda.',
    '[
      {
        "heading": "Škatuľa znamená bezpečie",
        "blocks": [
          {"type": "paragraph", "text": "Pre mačku nie je uzavretý priestor väzenie, ale útočisko. V škatuli má prehľad, má krytý chrbát a v prípade potreby z nej dokáže rýchlo vyštartovať. Ako pôvodne samotárska šelma sa mačka pri strese neupokojuje konfrontáciou, ale skrytím sa."},
          {"type": "bullets", "items": [
            "Uzavretý priestor **znižuje stres** a pocit ohrozenia.",
            "Škatuľa slúži ako úkryt aj ako miesto na **prepad** koristi (či nôh okoloidúcich).",
            "Steny dávajú istotu, že sa k mačke nikto nepriblíži zozadu."
          ]},
          {"type": "callout", "variant": "info", "text": "Štúdia Utrechtskej univerzity (2014) zistila, že mačky v útulku, ktoré dostali škatuľu, sa novému prostrediu prispôsobili rýchlejšie a boli menej vystresované než mačky bez nej."}
        ]
      },
      {
        "heading": "Teplý kút v studenom svete",
        "blocks": [
          {"type": "paragraph", "text": "Mačky majú komfortnú teplotu vyššiu, než by sme čakali — pohodlne im je približne pri 30 až 36 °C, teda výrazne teplejšie, než býva v našich domácnostiach. Vlnitá lepenka dobre izoluje a udrží teplo, takže škatuľa funguje ako malý tepelný ostrov."},
          {"type": "paragraph", "text": "Preto mačka často zvolí obyčajný kartón pred drahým pelieškom — jednoducho v ňom nie je zima."}
        ]
      },
      {
        "heading": "Sadnem si, aj keď tam nič nie je",
        "blocks": [
          {"type": "paragraph", "text": "Fenomén ide ešte ďalej. V roku 2021 výskumníci zistili, že mačky si sadali nielen do škatúľ, ale aj do štvorcov vyznačených páskou na podlahe — a dokonca do obrazcov, ktoré štvorec len opticky naznačovali (tzv. Kanizsov klam)."},
          {"type": "paragraph", "text": "Naznačuje to, že mačku neláka len fyzická škatuľa, ale samotný obrys ohraničeného priestoru. Inštinkt „schovaj sa do rohu“ je zjavne silnejší než logika."}
        ]
      },
      {
        "heading": "Čo z toho pre teba",
        "blocks": [
          {"type": "paragraph", "text": "Škatuľová vášeň je zdravá a lacná zábava, ktorú vieš využiť v prospech mačky:"},
          {"type": "bullets", "items": [
            "Ponúkni škatuľu pri **sťahovaní, návšteve alebo inej stresovej zmene** — dá mačke pocit kontroly.",
            "Rozmiestni **viac úkrytov** po byte, nech má mačka vždy kam ustúpiť.",
            "Ak sa mačka zrazu prestane skrývať alebo naopak skrýva neustále, sleduj aj ostatné správanie."
          ]},
          {"type": "callout", "variant": "tip", "text": "Ak sa mačka zrazu skrýva nonstop alebo prestane žrať, taký obrat si zapíš do [zdravotného pasu](/poradna/digitalny-zdravotny-pas-pre-psa) — pomôže odlíšiť bežnú pohodu od stresu či bolesti."}
        ]
      },
      {
        "heading": "Ako škatuľu využiť naplno",
        "blocks": [
          {"type": "paragraph", "text": "Keď vieš, prečo mačka škatule miluje, môžeš z obyčajného kartónu spraviť užitočný nástroj pohody. Nemusíš kupovať drahé pelechy — často stačí to, čo máš doma:"},
          {"type": "bullets", "items": [
            "**Umiestnenie** — polož škatuľu do pokojného kúta s výhľadom do miestnosti, nie do prievanu či rušného priechodu.",
            "**Vyvýšené miesto** — mačky milujú prehľad zhora, takže škatuľa na poličke alebo parapete boduje dvojnásobne.",
            "**Viac úkrytov** — v domácnosti s viacerými mačkami daj každej vlastný priestor, predídeš tak napätiu a súbojom o teritórium.",
            "**Obmena** — občas škatuľu vymeň alebo do nej prerež okienko; novinka mačku zabaví a podnieti prieskum."
          ]},
          {"type": "paragraph", "text": "Škatuľa skvele poslúži aj pri stresových situáciách — pri sťahovaní, návšteve, ohňostroji či ceste k veterinárovi. Prenosku, ktorú necháš doma otvorenú ako bežný úkryt, prestane mačka vnímať ako pascu a v deň návštevy sa ti do nej dostane oveľa ľahšie. Z lacného kartónu sa tak stane malý ostrov istoty, ktorý mačke pomáha zvládať zmeny."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Prečo majú mačky tak rady škatule?", "a": "Uzavretý priestor im dáva pocit bezpečia, umožňuje úkryt aj prepad koristi a dobre drží teplo. Škatuľa tak spĺňa hneď niekoľko inštinktívnych potrieb naraz."},
      {"q": "Je normálne, že sa mačka stále skrýva v škatuli?", "a": "Občasné skrývanie je úplne bežné a zdravé. Ak sa však mačka skrýva nepretržite, nežerie alebo je apatická, môže ísť o stres alebo zdravotný problém — poraď sa s veterinárom."},
      {"q": "Prečo si mačka sadá aj do štvorca z pásky na zemi?", "a": "Výskum naznačuje, že mačku priťahuje samotný obrys ohraničeného priestoru, nielen fyzická škatuľa. Sadla si dokonca aj do opticky naznačeného štvorca."},
      {"q": "Pomôže škatuľa vystresovanej mačke?", "a": "Áno. Úkryt jej dáva pocit kontroly a podľa výskumu pomáha rýchlejšie sa vyrovnať s novým alebo stresujúcim prostredím."}
    ]'::jsonb,
    array['preco-macky-pradu', 'preco-psy-naklanaju-hlavu']::text[],
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=70',
    'Mačka sediaca v kartónovej škatuli.',
    'Zdroj: Unsplash',
    'passport',
    null,
    '[
      {"label": "Vinke et al. (2014), Applied Animal Behaviour Science — hiding boxes for shelter cats", "url": "https://www.sciencedirect.com/journal/applied-animal-behaviour-science"},
      {"label": "International Cat Care", "url": "https://icatcare.org/"},
      {"label": "Cornell Feline Health Center (Cornell University)", "url": "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    12
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
