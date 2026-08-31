-- AnimalPassport — nový článok poradne: "Prečo je škrečok v noci aktívny?"
-- cover_image: reálna fotka z fotobanky Pexels (voľná licencia).
-- Idempotentné: re-run aktualizuje článok podľa slug. Vyžaduje 0018 + 0028 + 0024 + 0022.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'preco-je-skrecok-aktivny-v-noci',
    'zdravie',
    array['hamster']::text[],
    'Prečo je škrečok v noci aktívny (a prečo ho nebudiť)',
    'Prečo škrečok cez deň spí a v noci behá v kolese? Nočný režim, dôvod jeho pôvodu, prečo ho nemáš budiť a kedy je nehybnosť dôvod na obavy.',
    'Kúpiš deťom škrečka a cez deň z neho nie je žiadna zábava — spí ako drevo. Nie je pokazený ani lenivý. Robí presne to, na čo ho státisíce rokov evolúcie nastavili: šetrí sily na noc.',
    '[
      {
        "heading": "Tvor stvorený pre šero a noc",
        "blocks": [
          {"type": "paragraph", "text": "Škrečky sú prevažne nočné a súmračné zvieratá — najaktívnejšie sú za šera a v noci. Nie je to rozmar. Sýrsky škrečok pochádza zo suchých, horúcich oblastí, kde je cez deň horúco a nebezpečno. Nočný režim ho chráni pred predátormi aj pred pálivým slnkom."},
          {"type": "callout", "variant": "info", "text": "Preto škrečok nie je ideálny maznáčik pre malé deti, ktoré sa chcú hrať poobede — vtedy práve tvrdo spí."}
        ]
      },
      {
        "heading": "Prečo ho nemáš budiť",
        "blocks": [
          {"type": "paragraph", "text": "Vytrhnutie zo spánku je pre škrečka veľký stres. Prebudený a vyľakaný škrečok sa navyše môže brániť pohryznutím — nie zo zlomyseľnosti, ale z ľaku:"},
          {"type": "bullets", "items": [
            "Nechaj ho vyspať cez deň, klietku vtedy zbytočne neruš.",
            "Interakciu a kŕmenie plánuj na podvečer a večer, keď sa sám prebudí.",
            "Pristupuj k nemu pomaly a potichu, nech ho neprekvapíš."
          ]}
        ]
      },
      {
        "heading": "Nočné maratóny a koleso",
        "blocks": [
          {"type": "paragraph", "text": "V noci by škrečok v prírode prebehol za potravou obrovské vzdialenosti. Koleso mu tento prirodzený pohyb umožňuje aj v klietke — preto v ňom v noci nabehá aj niekoľko kilometrov:"},
          {"type": "bullets", "items": [
            "Koleso musí byť **dosť veľké**, aby škrečok nemusel prehýbať chrbát.",
            "Voľ **plnú bežeckú plochu** (nie mriežkovú), aby si neporanil labky.",
            "Dopraj mu aj dostatok priestoru, hlbokú podstielku na hrabanie a úkryty."
          ]}
        ]
      },
      {
        "heading": "Kedy spozornieť",
        "blocks": [
          {"type": "paragraph", "text": "Nočný spánok je normálny, no niektoré signály si vyžadujú pozornosť:"},
          {"type": "bullets", "items": [
            "Škrečok je apatický a nehybný **aj večer**, keď má byť aktívny.",
            "Prestal žrať, hromadiť potravu alebo behať v kolese.",
            "Za chladu môže upadnúť do stavu podobného spánku (torpor) a pôsobiť ako mŕtvy."
          ]},
          {"type": "callout", "variant": "tip", "text": "Škrečok chorobu skrýva do poslednej chvíle — drobné zmeny v aktivite či chuti do jedla preto zapisuj do [zdravotného pasu](/poradna/digitalny-zdravotny-pas-pre-psa), nech ich zachytíš skôr."}
        ]
      },
      {
        "heading": "Ako škrečkovi prispôsobiť dom a režim",
        "blocks": [
          {"type": "paragraph", "text": "Keď rešpektuješ škrečkov nočný režim, odmení sa ti dôverou a pokojnejším správaním. Pár úprav domácnosti aj návykov spraví veľký rozdiel:"},
          {"type": "bullets", "items": [
            "**Umiestnenie klietky** — daj ju do tichej miestnosti, kde cez deň nie je ruch ani ostré svetlo, aby škrečok mohol nerušene spať.",
            "**Večerný rituál** — kŕmenie, čistenie aj hru plánuj na podvečer; škrečok si zvykne a bude ťa vtedy sám vyhľadávať.",
            "**Priestor a podnety** — dopraj mu veľkú klietku, hlbokú podstielku na hrabanie tunelov, úkryty a materiály na hlodanie.",
            "**Šetrné budenie** — ak ho naozaj musíš vyrušiť, urob to jemne hlasom, nie náhlym siahnutím do pelieška."
          ]},
          {"type": "paragraph", "text": "Nočná aktivita má aj praktickú stránku: koleso môže vŕzgať a rušiť spánok. Vyber preto tiché, kvalitné koleso a klietku umiestni mimo spálne, nie k posteli detí."},
          {"type": "paragraph", "text": "A ešte jedna dôležitá vec — škrečky sa dožívajú len asi dvoch až troch rokov a starnú rýchlo. Zmeny v aktivite, chudnutie či menší záujem o koleso preto neber na ľahkú váhu; u tohto krátko žijúceho zvieraťa má včasná návšteva veterinára o to väčšiu cenu. A ešte drobnosť, ktorá prekvapí: väčšina škrečkov sú samotári a k iným škrečkom bývajú agresívni — na rozdiel od morčiat či potkanov ich preto chovaj radšej po jednom v klietke."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Prečo je škrečok cez deň stále schovaný a spí?", "a": "Škrečky sú prevažne nočné a súmračné zvieratá. Cez deň spia, aby sa v prírode vyhli predátorom a horúčave — najaktívnejšie sú večer a v noci."},
      {"q": "Môžem škrečka zobudiť, keď sa s ním chcem hrať?", "a": "Radšej nie. Budenie ho stresuje a vyľakaný škrečok môže aj pohrýzť. Naplánuj hru na podvečer, keď sa prebudí sám."},
      {"q": "Prečo škrečok v noci toľko behá v kolese?", "a": "Napodobňuje to prirodzený pohyb za potravou, pri ktorom by v prírode prebehol veľké vzdialenosti. Koleso mu tento pohyb umožňuje aj v klietke."},
      {"q": "Je normálne, že je škrečok nehybný a studený?", "a": "Za chladu môže upadnúť do stavu podobného spánku (torpor), keď pôsobí ako mŕtvy. Zohrej ho postupne a poraď sa s veterinárom; sleduj aj chuť do jedla a aktivitu."}
    ]'::jsonb,
    array[]::text[],
    'https://images.pexels.com/photos/2013665/pexels-photo-2013665.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Škrečok na dlani',
    'Foto: Pexels',
    'passport',
    null,
    '[
      {"label": "RSPCA — Hamster behaviour", "url": "https://www.rspca.org.uk/adviceandwelfare/pets/rodents/hamsters"},
      {"label": "PDSA — Hamster care", "url": "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/small-pets/hamsters"},
      {"label": "Blue Cross — Hamsters as pets", "url": "https://www.bluecross.org.uk/advice/small-pets/"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    18
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
