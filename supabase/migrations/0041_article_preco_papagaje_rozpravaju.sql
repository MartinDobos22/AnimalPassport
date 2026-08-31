-- AnimalPassport — nový článok poradne: "Prečo papagáje rozprávajú?"
-- cover_image: reálna fotka z fotobanky Pexels (voľná licencia).
-- Idempotentné: re-run aktualizuje článok podľa slug. Vyžaduje 0018 + 0028 + 0024 + 0022.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'preco-papagaje-rozpravaju',
    'zdravie',
    array['parrot', 'budgerigar']::text[],
    'Prečo papagáje (a andulky) napodobňujú ľudskú reč?',
    'Ako a prečo papagáje rozprávajú? Vzácna schopnosť hlasového učenia, orgán syrinx namiesto hlasiviek a sociálny dôvod kŕdľa — plus čo to znamená pre chovateľa.',
    'Papagáj, ktorý zavolá „ahoj“, keď vojdeš do dverí, nie je len roztomilý trik. Za jeho „rečou“ je vzácna schopnosť, ktorú v živočíšnej ríši zvláda len hŕstka druhov — a hlboký sociálny dôvod.',
    '[
      {
        "heading": "Vzácny klub hlasových imitátorov",
        "blocks": [
          {"type": "paragraph", "text": "Väčšina zvierat vydáva zvuky, s ktorými sa narodí. Papagáje, andulky a spevavce sú výnimka — patria medzi takzvaných hlasových učňov, ktorí sa nové zvuky učia napodobňovaním. Túto schopnosť zdieľajú s prekvapivo malým klubom, do ktorého patrí aj človek."},
          {"type": "paragraph", "text": "Preto papagáj dokáže pochytiť nielen slová, ale aj pípanie mikrovlnky, zvonček pri dverách či štekot psa."}
        ]
      },
      {
        "heading": "Ako to dokáže bez pier a hlasiviek",
        "blocks": [
          {"type": "paragraph", "text": "Papagáj nemá hlasivky ako my. Zvuk tvorí orgánom zvaným syrinx, uloženým hlboko v hrudi na rozvetvení priedušnice. V kombinácii s mimoriadne pohyblivým jazykom a hrdlom tak vie tvarovať prekvapivo čisté „ľudské“ hlásky."}
        ]
      },
      {
        "heading": "Prečo to robí — je to o kŕdli",
        "blocks": [
          {"type": "paragraph", "text": "V prírode žijú papagáje vo veľkých kŕdľoch a napodobňovaním spoločných volaní si upevňujú väzby a dávajú najavo „patríme k sebe“. V domácnosti sa ich kŕdľom stávaš ty. Napodobňovaním tvojej reči sa snaží zapadnúť a získať tvoju pozornosť."},
          {"type": "callout", "variant": "info", "text": "Neznamená to, že papagáj slovám rozumie ako človek. Dokáže si ich však spájať s kontextom — napríklad pozdrav s tvojím príchodom. Výnimoční jedinci (známy je papagáj Alex) zvládli v pokusoch aj základné pojmy ako farby či počty."}
        ]
      },
      {
        "heading": "Čo to znamená pre chovateľa",
        "blocks": [
          {"type": "paragraph", "text": "Reč je prejav sociálnej, inteligentnej bytosti, ktorá potrebuje kontakt a zamestnanie. Nudiaci sa papagáj trpí:"},
          {"type": "bullets", "items": [
            "Dopraj mu **denne interakciu a mentálne podnety** (hračky, hľadanie potravy).",
            "**Nie každý jedinec bude rozprávať** — je to individuálne a netreba to vynucovať.",
            "**Náhla strata „reči“, apatia alebo vyškubávanie peria** môžu signalizovať stres alebo chorobu."
          ]},
          {"type": "callout", "variant": "tip", "text": "U vtákov, ktoré chorobu dlho skrývajú, je cenný každý záznam — zmeny v hlase, perí či správaní si preto priebežne ukladaj do [zdravotného pasu](/poradna/digitalny-zdravotny-pas-pre-psa)."}
        ]
      },
      {
        "heading": "Ako podporiť hovorenie a spokojnosť papagája",
        "blocks": [
          {"type": "paragraph", "text": "Či papagáj prehovorí, závisí od druhu, povahy aj od toho, koľko sa mu venuješ — nie je to súťaž a netreba to vynucovať. Ak by si ho chcel k reči jemne povzbudiť, pomôže trpezlivosť a pravidelnosť:"},
          {"type": "bullets", "items": [
            "**Opakovanie v kontexte** — ten istý pozdrav vždy pri príchode, to isté slovo vždy pri kŕmení.",
            "**Nadšený tón** — vtáky priťahujú výrazné, veselo znejúce slová viac než monotónnu reč.",
            "**Krátke, časté chvíle** — pár minút denne funguje lepšie než dlhé, únavné lekcie.",
            "**Žiadny nátlak** — nikdy vtáka za mlčanie netrestaj; stres hovoreniu bráni."
          ]},
          {"type": "paragraph", "text": "Ešte dôležitejšia než reč je celková pohoda. Papagáj je bystrý spoločenský tvor, ktorý sa v izolácii a nude trápi. Dopraj mu dostatok interakcie každý deň, ponúkni hračky, vetvičky na hlodanie a úlohy, pri ktorých si potravu musí vypracovať, a zabezpeč pravidelný režim svetla a spánku."},
          {"type": "paragraph", "text": "Nudiaci sa alebo osamelý papagáj to dá najavo — kričaním, apatiou alebo vyškubávaním peria. Spokojný vták je zvedavý, aktívny a ukecaný prirodzene, bez toho, aby si ho k tomu musel nútiť. Ak papagáj náhle stíchne, prestane žrať alebo si začne škubať perie, neber to ako vzdor — u vtákov to býva jeden z prvých signálov stresu alebo choroby, ktorý stojí za včasnú kontrolu u zverolekára."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Prečo papagáje napodobňujú ľudskú reč?", "a": "Sú to sociálne kŕdľové zvieratá a napodobňovaním zvukov si upevňujú väzby. Doma sa ich kŕdľom stáva človek, takže napodobňujú jeho reč, aby zapadli a získali pozornosť."},
      {"q": "Rozumie papagáj slovám, ktoré hovorí?", "a": "Nie tak ako človek, no dokáže si slová spájať s kontextom, napríklad pozdrav s príchodom. Niektoré výnimočné jedince zvládli v pokusoch aj základné pojmy."},
      {"q": "Ako papagáj tvorí hlas bez hlasiviek?", "a": "Používa orgán zvaný syrinx uložený v hrudi, spolu s veľmi pohyblivým jazykom a hrdlom. Práve preto vie napodobniť aj čisté ľudské hlásky."},
      {"q": "Prečo môj papagáj nerozpráva?", "a": "Je to individuálne — nie každý jedinec rozpráva a netreba to vynucovať. Ak však prestal byť aktívny alebo si škube perie, môže ísť o stres či zdravotný problém."}
    ]'::jsonb,
    array[]::text[],
    'https://images.pexels.com/photos/11635213/pexels-photo-11635213.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Andulka (papagáj vlnkovaný) zblízka',
    'Foto: Pexels',
    'passport',
    null,
    '[
      {"label": "World Parrot Trust", "url": "https://www.parrots.org/"},
      {"label": "The Alex Foundation (Irene Pepperberg)", "url": "https://alexfoundation.org/"},
      {"label": "RSPB — birds and behaviour", "url": "https://www.rspb.org.uk/"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    17
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
