-- AnimalPassport — nový článok poradne: "Prečo morča potrebuje vitamín C"
-- cover_image: reálna fotka z fotobanky Pexels (voľná licencia).
-- Idempotentné: re-run aktualizuje článok podľa slug. Vyžaduje 0018 + 0028 + 0024 + 0022.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'morca-a-vitamin-c',
    'zdravie',
    array['guinea_pig']::text[],
    'Prečo morča potrebuje vitamín C (a ako mu ho dodať)',
    'Morča si nevie samo vyrobiť vitamín C a bez neho dostane skorbut. Aké sú príznaky nedostatku, koľko C morča potrebuje a ktoré potraviny sú najlepší zdroj.',
    'Morča má jednu prekvapivú vlastnosť, ktorú zdieľa s človekom a takmer so žiadnym iným domácim cicavcom: nedokáže si samo vyrobiť vitamín C. Ak mu ho nedodáš v strave, doplatí na to zdravím.',
    '[
      {
        "heading": "Prečo si morča vitamín C nevie vyrobiť",
        "blocks": [
          {"type": "paragraph", "text": "Väčšina cicavcov si vitamín C syntetizuje v pečeni. Morčatá (a mimochodom aj ľudia) o túto schopnosť v evolúcii prišli — chýba im na to potrebný enzým. Preto musia celé množstvo prijať z potravy, každý deň."},
          {"type": "paragraph", "text": "Denná potreba je približne 10 až 30 mg, pričom brezivé samice a choré zvieratá potrebujú viac."}
        ]
      },
      {
        "heading": "Čo spôsobí nedostatok",
        "blocks": [
          {"type": "paragraph", "text": "Dlhodobý nedostatok vitamínu C vedie k skorbutu. Vitamín C je totiž nevyhnutný pre tvorbu kolagénu — stavebnej látky kĺbov, ciev a kože:"},
          {"type": "bullets", "items": [
            "Apatia, neochota pohybovať sa, stuhnutá chôdza.",
            "Opuchnuté, bolestivé kĺby a krívanie.",
            "Krvácanie ďasien, uvoľnené zuby, zhoršené hojenie.",
            "Matná srsť, strata chuti do jedla a chudnutie."
          ]},
          {"type": "callout", "variant": "warning", "text": "Skorbut je bez liečby smrteľný, no pri včasnom podchytení sa dá zvládnuť. Pri týchto príznakoch navštív veterinára — nediagnostikuj a nedávkuj vitamín naslepo."}
        ]
      },
      {
        "heading": "Ako vitamín C spoľahlivo dodať",
        "blocks": [
          {"type": "bullets", "items": [
            "**Čerstvá zelenina bohatá na C** — najmä paprika (výborný zdroj), listová zelenina a vňať; denne a pestro.",
            "**Kvalitné morčacie pelety** obohatené o vitamín C — pozor, C sa v nich časom rozkladá, preto kupuj menšie balenia a skladuj ich v suchu a tme.",
            "**Seno a voda** neustále — vlákninu morča potrebuje rovnako ako králik."
          ]},
          {"type": "callout", "variant": "info", "text": "Nespoliehaj sa na vitamín C kvapkaný do vody. Rýchlo sa v nej rozkladá a mení jej chuť, takže morča často pije menej — a aj tak nedostane spoľahlivú dávku."}
        ]
      },
      {
        "heading": "Na čo nezabudnúť",
        "blocks": [
          {"type": "bullets", "items": [
            "Nikdy nekŕm morča granulami pre králiky, psy či mačky — neobsahujú vitamín C.",
            "Novú zeleninu zaraď postupne, aby si nespôsobil tráviace ťažkosti.",
            "Pri chorobe alebo gravidite sa poraď s veterinárom o zvýšenej potrebe."
          ]},
          {"type": "callout", "variant": "tip", "text": "Denné pozorovanie má cenu len keď si ho pamätáš — pár slov o strave a hmotnosti do [zdravotného pasu](/poradna/digitalny-zdravotny-pas-pre-psa) ti pri morčati pomôže zachytiť problém včas."}
        ]
      },
      {
        "heading": "Ako zostaviť zdravý jedálniček morčaťa",
        "blocks": [
          {"type": "paragraph", "text": "Vitamín C je najznámejšia, no nie jediná potreba morčaťa. Zdravý jedálniček stojí na troch pilieroch, ktoré fungujú spolu:"},
          {"type": "bullets", "items": [
            "**Seno neobmedzene** — základ trávenia aj obrusovania stále rastúcich zubov; malo by tvoriť väčšinu dennej stravy.",
            "**Čerstvá zelenina a vňať denne** — zdroj vitamínov vrátane C; ponúkaj pestro a v primeraných porciách.",
            "**Malé množstvo kvalitných peliet** pre morčatá — doplnok, nie hlavné jedlo."
          ]},
          {"type": "paragraph", "text": "K tomu vždy čerstvá voda. Čomu sa vyhnúť: ovocie len ako vzácna maškrta (veľa cukru), žiadne pečivo, sladkosti ani mliečne výrobky — morčatá sú výhradne bylinožravce."},
          {"type": "paragraph", "text": "Rovnako dôležité ako strava je pravidelné pozorovanie. Morčatá sú korisť a inštinktívne skrývajú slabosť, takže príznaky choroby si všimneš neskoro. Sleduj preto denne, či morča normálne žerie, pije a trúsi a či je čulé. Náhla strata chuti do jedla, chudnutie alebo skrývanie sú varovné signály — a keďže tieto zvieratá chátrajú rýchlo, oplatí sa reagovať skôr než neskôr. Drobná rada na záver: morčatá sú spoločenské a v samote strádajú, preto sa takmer vždy chovajú aspoň vo dvojici — vo dvojici morča lepšie žerie, je čulejšie a jeho zdravie sa ľahšie ustráži."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Prečo morča potrebuje vitamín C zo stravy?", "a": "Na rozdiel od väčšiny cicavcov si ho nevie samo vyrobiť, chýba mu potrebný enzým. Musí ho preto prijať z potravy každý deň."},
      {"q": "Aké sú príznaky nedostatku vitamínu C?", "a": "Apatia, opuchnuté a bolestivé kĺby, krívanie, krvácanie ďasien, matná srsť a strata chuti do jedla. Ide o skorbut a patrí k veterinárovi."},
      {"q": "Stačí vitamín C v napájačke?", "a": "Nie je spoľahlivý — vo vode sa rýchlo rozkladá a mení jej chuť, takže morča pije menej. Lepšie je dodať C čerstvou zeleninou a kvalitnými peletami."},
      {"q": "Ktoré potraviny majú veľa vitamínu C?", "a": "Výborným zdrojom je paprika, ďalej listová zelenina a rôzna vňať. Podávaj ich čerstvé a pestro, popri neobmedzenom sene."}
    ]'::jsonb,
    array['seno-zaklad-jedalnicka-kralika']::text[],
    'https://images.pexels.com/photos/1093126/pexels-photo-1093126.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'Dve morčatá zblízka',
    'Foto: Pexels',
    'passport',
    null,
    '[
      {"label": "RSPCA — Guinea pig diet", "url": "https://www.rspca.org.uk/adviceandwelfare/pets/rodents/guineapigs/diet"},
      {"label": "PDSA — Feeding your guinea pig", "url": "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/guinea-pigs/what-do-guinea-pigs-eat"},
      {"label": "Cornell Richard P. Riney Canine Health Center / veterinary resources", "url": "https://www.vet.cornell.edu/"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    16
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
