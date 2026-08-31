-- AnimalPassport — nový článok poradne: "Prečo psy žerú trávu?"
-- Verejný, globálny obsah BEZ vlastníka (rovnako ako 0019_articles_seed.sql).
-- Idempotentné: re-run aktualizuje článok podľa slug.
-- Vyžaduje 0018_articles.sql.

insert into articles
  (slug, category, species, title, description, intro, sections, faqs, related_slugs, cover_image, cover_alt, cover_credit, cta_intent, author, sources, updated, published, status, position)
values
  (
    'preco-psy-zeru-travu',
    'zdravie',
    array['dog']::text[],
    'Prečo psy žerú trávu?',
    'Prečo psy žerú trávu a je to dôvod na obavy? Čo hovorí výskum, kedy ide o normálne správanie a kedy spozornieť. Praktické tipy pre majiteľov psov.',
    'Váš pes sa pri prechádzke skloní a so sústredením labužníka začne trhať trávu. Prvá myšlienka väčšiny majiteľov je, že mu niečo je — no dáta hovoria niečo pokojnejšie.',
    '[
      {
        "heading": "Väčšinou to nie je príznak choroby",
        "blocks": [
          {"type": "paragraph", "text": "Najväčší prieskum na túto tému urobil tím veterinárnej fakulty Kalifornskej univerzity v Davise. Oslovil stovky majiteľov psov a výsledky prekvapili aj samotných odborníkov."},
          {"type": "bullets", "items": [
            "Žranie rastlín je úplne bežné — v prieskume ho robilo takmer **80 % psov**.",
            "Len asi **8 %** psov pôsobilo pred žraním čo i len trochu choro.",
            "Vracia sa iba **okolo 22 %** — teda menšina, nie väčšina, ako sa bežne traduje."
          ]},
          {"type": "paragraph", "text": "Inými slovami, trhanie trávy je súčasť normálneho psieho správania, nie tichý signál, že je niečo v neporiadku. Predstava, že sa pes takto zámerne lieči, keď mu je zle, platí len pre menšinu prípadov."}
        ]
      },
      {
        "heading": "Odkiaľ sa tento zvyk vzal",
        "blocks": [
          {"type": "paragraph", "text": "Prevažuje evolučné vysvetlenie. Rastlinný materiál sa bežne nachádza v truse vlkov aj divých psovitých šeliem. Vedci sa domnievajú, že prehĺtanie tráv mohlo v minulosti pomáhať mechanicky vyháňať črevných parazitov, keďže vláknina urýchli prechod potravy črevom."},
          {"type": "paragraph", "text": "Dnešný domáci maznáčik už zvyčajne také črevá plné parazitov nemá, no inštinkt zostal. K nemu sa pridávajú aj prozaickejšie dôvody."},
          {"type": "subheading", "text": "Ďalšie bežné dôvody"},
          {"type": "bullets", "items": [
            "**Chuť a textúra** — mladá jarná tráva psom jednoducho chutí.",
            "**Nuda** — pes bez dostatku podnetov si zábavu nájde aj na trávniku.",
            "**Vláknina** — pri jednotvárnej strave môže telo hľadať doplnok."
          ]}
        ]
      },
      {
        "heading": "Kedy predsa len spozornieť",
        "blocks": [
          {"type": "paragraph", "text": "Občasné pasenie na čistej lúke je neškodné. Návšteva veterinára má však zmysel v niekoľkých situáciách:"},
          {"type": "bullets", "items": [
            "Pes žerie trávu **náhle, nutkavo a akoby posadnuto**.",
            "Vracanie je **časté** alebo ho sprevádza hnačka, apatia či chudnutie.",
            "Tráva mohla byť ošetrená **herbicídmi, hnojivami alebo slimáčími granulami**, ktoré sú pre psa jedovaté.",
            "Spolu s trávou pes zhltne **ostré predmety** alebo rastliny, ktoré môžu byť toxické."
          ]},
          {"type": "callout", "variant": "warning", "text": "Náhla a silná chuť na trávu býva niekedy prejavom tráviacich ťažkostí. Ak pribudne vracanie, hnačka alebo apatia, nečakaj a poraď sa s veterinárom."}
        ]
      },
      {
        "heading": "Čo s tým robiť",
        "blocks": [
          {"type": "paragraph", "text": "Zdravému psovi netreba pasenie zakazovať. Stačí dávať pozor na to, kde sa pasie, a pravidelne ho odčervovať. Ak ťa vracanie znepokojuje, skús pridať do jedálnička viac vlákniny a sleduj, či sa správanie zmení."},
          {"type": "callout", "variant": "tip", "text": "Ak máš podozrenie, že za pasením môže byť nevhodné zloženie krmiva alebo alergia, pomôže [analýza krmiva](/poradna/analyza-krmiva-pre-psa) a prehľad [odčervenie psa](/poradna/odcervenie-psa). Pri pretrvávajúcich ťažkostiach vždy konzultuj veterinára."},
          {"type": "paragraph", "text": "Trhanie trávy teda vo väčšine prípadov nie je dráma. Je to len tvoj pes, ktorý zostal v niečom trochu vlkom."}
        ]
      },
      {
        "heading": "Je bezpečné nechať psa pásť sa?",
        "blocks": [
          {"type": "paragraph", "text": "Krátka odpoveď znie áno, ak dodržíš pár zásad. Väčšine psov občasné pasenie na čistej lúke nijako neublíži a netreba z neho robiť vedu. Problém nikdy nie je samotná tráva, ale to, čo na nej alebo v nej môže byť."},
          {"type": "bullets", "items": [
            "Vyhýbaj sa okrajom polí, parkov a trávnikov, ktoré mohli byť postriekané.",
            "Po aplikácii hnojiva alebo postreku nechaj plochu aspoň niekoľko dní.",
            "Sleduj, či pes spolu s trávou nezhltol aj odpadky či ohryzené paličky.",
            "Ak si nie si istý pôvodom trávy, radšej psa jemne odveď inam."
          ]},
          {"type": "paragraph", "text": "Ak sa pes pasie len sem-tam a inak je čulý, má chuť do jedla a normálnu stolicu, nie je dôvod na paniku. Ostražitý buď až vtedy, keď sa z príležitostného maškrtenia stane nutkavý, každodenný rituál sprevádzaný vracaním."}
        ]
      }
    ]'::jsonb,
    '[
      {"q": "Je normálne, že pes žerie trávu?", "a": "Áno. Podľa prieskumov je väčšina psov, ktoré žerú trávu, celkovo zdravá a ide o bežné správanie. Pozornosť si zaslúži skôr náhla zmena alebo sprievodné ťažkosti."},
      {"q": "Prečo pes po tráve niekedy vracia?", "a": "Vracia sa len menšina psov, ktoré sa pasú, takže tráva nie je spoľahlivý spôsob, ako sa pes zámerne lieči. Ak pes vracia často, môže ísť o tráviaci problém a treba veterinára."},
      {"q": "Mám psovi žranie trávy zakázať?", "a": "U zdravého psa to zvyčajne netreba. Dôležitejšie je zabezpečiť, aby tráva nebola ošetrená chemikáliami, a psa pravidelne odčervovať."},
      {"q": "Kedy s tým ísť k veterinárovi?", "a": "Keď je pasenie náhle a nutkavé, sprevádza ho časté vracanie, hnačka, apatia alebo chudnutie, prípadne ak pes mohol zjesť jedovatú rastlinu či ošetrenú trávu."}
    ]'::jsonb,
    array['odcervenie-psa', 'co-nesmie-pes-jest']::text[],
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=70',
    'Pes ležiaci v zelenej tráve na slnkom zaliatej lúke.',
    'Zdroj: Unsplash',
    'passport',
    null,
    '[
      {"label": "American Kennel Club — Why Do Dogs Eat Grass?", "url": "https://www.akc.org/expert-advice/nutrition/why-do-dogs-eat-grass/"},
      {"label": "UC Davis School of Veterinary Medicine", "url": "https://www.vetmed.ucdavis.edu/"},
      {"label": "VCA Animal Hospitals — Why Do Dogs Eat Grass?", "url": "https://vcahospitals.com/know-your-pet/why-do-dogs-eat-grass"}
    ]'::jsonb,
    '2026-07-21',
    true,
    'published',
    9
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
