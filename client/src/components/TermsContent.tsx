import { useTranslation } from 'react-i18next';
import { Box, Card, CardContent, Stack, Typography, alpha, useTheme } from '@mui/material';
import { Gavel as GavelIcon } from '@mui/icons-material';

interface Section {
  title: string;
  body: string[];
}

const SK_SECTIONS: Section[] = [
  {
    title: 'Čoho sa tieto podmienky týkajú',
    body: [
      'Podmienky upravujú používanie aplikácie Pawly — analýzy krmiva, profilov zvierat, zdravotného pasu, denníka epizód a karty pre veterinára.',
      'Registráciou účtu s týmito podmienkami súhlasíš. Ak s nimi nesúhlasíš, aplikáciu nepoužívaj.',
      'Spracovanie osobných údajov rieši samostatný dokument Ochrana súkromia.',
    ],
  },
  {
    title: 'Účet',
    body: [
      'Účet je osobný. Prihlasovacie údaje neposkytuj iným osobám.',
      'Pri registrácii uveď funkčnú e-mailovú adresu, ku ktorej máš dlhodobý prístup. Adresu je potrebné overiť; bez overenia zostáva účet neaktívny.',
      'Jednorazové a dočasné e-mailové adresy neodporúčame — pri strate prístupu k schránke ti nedokážeme obnoviť heslo ani účet a hrozí, že adresu neskôr získa iná osoba.',
      'Na jednu osobu pripadá jeden účet. Zakladanie ďalších účtov s cieľom obísť limity služby je porušením týchto podmienok.',
    ],
  },
  {
    title: 'Ako smieš službu používať',
    body: [
      'Pawly používaj na starostlivosť o vlastné zvieratá alebo o zvieratá, ktoré máš v opatere.',
      'Nesmieš: obchádzať limity služby (najmä zakladaním viacerých účtov alebo automatizovanými volaniami mimo aplikácie), pokúšať sa o prístup k účtom a údajom iných používateľov, zaťažovať službu spôsobom, ktorý ohrozuje jej prevádzku, vkladať protiprávny obsah, ani zasahovať do technickej ochrany služby.',
      'AI funkcie sú určené na starostlivosť o zvieratá. Ich používanie na nesúvisiace účely považujeme za zneužitie.',
    ],
  },
  {
    title: 'Aplikácia nenahrádza veterinára',
    body: [
      'Výstupy AI (analýza krmiva, interpretácia zdravotnej karty, zhrnutia epizód) sú informatívne a môžu obsahovať chyby.',
      'Pawly neposkytuje veterinárnu diagnostiku ani liečbu. Pri zdravotnom probléme zvieraťa sa vždy obráť na veterinárneho lekára.',
      'Rozhodnutia o zdraví zvieraťa robíš na vlastnú zodpovednosť.',
    ],
  },
  {
    title: 'Obmedzenie, zablokovanie a zrušenie účtu',
    body: [
      'Ak zistíme konanie v rozpore s týmito podmienkami, môžeme podľa jeho závažnosti účet upozorniť, dočasne obmedziť jeho prístup k AI funkciám, zablokovať ho alebo zrušiť.',
      'Za dôvod na zásah považujeme najmä: obchádzanie limitov službou viacerých účtov alebo automatizovanými volaniami, pokusy o prístup k cudzím účtom či údajom, konanie ohrozujúce prevádzku alebo bezpečnosť služby, uvedenie nepravdivých údajov pri registrácii, vkladanie protiprávneho obsahu a zneužívanie AI funkcií na nesúvisiace účely.',
      'O zásahu ťa informujeme e-mailom na adresu účtu spolu s dôvodom. Bez predchádzajúceho upozornenia zasiahneme len pri závažnom porušení — najmä pri protiprávnom konaní, útoku na službu alebo ohrození údajov iných používateľov.',
      'Zablokovanie je vratné. Zrušenie účtu s výmazom údajov je krajný krok pri závažnom alebo opakovanom porušení.',
      'Účet môžeš kedykoľvek zrušiť aj ty — tlačidlom „Zmazať účet“ v menu.',
    ],
  },
  {
    title: 'Čo sa stane s údajmi',
    body: [
      'Pri zablokovaní účtu tvoje údaje nemažeme — zostávajú uložené a po odblokovaní k nim máš opäť prístup.',
      'Pri zrušení účtu sa údaje mažú podľa dokumentu Ochrana súkromia.',
      'Aj po zrušení si môžeme ponechať minimálny záznam o zásahu (e-mailová adresa, dôvod a dátum) na predchádzanie opakovanému zneužitiu služby, najviac 12 mesiacov. Právnym základom je náš oprávnený záujem podľa čl. 6 ods. 1 písm. f) GDPR; proti tomuto spracúvaniu môžeš namietať podľa čl. 21 GDPR.',
    ],
  },
  {
    title: 'Ako sa odvolať',
    body: [
      'Ak si myslíš, že sme zasiahli neoprávnene, napíš na support@pawly.sk. Uveď e-mail účtu a stručný popis.',
      'Podnet posúdime a odpovieme najneskôr do 30 dní. Ak sa ukáže, že sme sa mýlili, účet bezodkladne obnovíme.',
      'Máš tiež právo obrátiť sa na Úrad na ochranu osobných údajov SR alebo na súd.',
    ],
  },
  {
    title: 'Dostupnosť služby a zmeny podmienok',
    body: [
      'Pawly je poskytovaná „tak, ako je“, bez záruky nepretržitej dostupnosti. Službu môžeme odstaviť na údržbu alebo obmedziť jej funkcie.',
      'AI funkcie majú denné limity, ktoré chránia prevádzku pred nadmerným zaťažením.',
      'Podmienky môžeme zmeniť. O podstatnej zmene ťa upozorníme e-mailom alebo v aplikácii aspoň 14 dní vopred. Ak so zmenou nesúhlasíš, môžeš účet zrušiť.',
    ],
  },
  {
    title: 'Kontakt',
    body: [
      'Otázky k podmienkam aj odvolania proti zásahu: support@pawly.sk.',
      'Tieto podmienky sa riadia právom Slovenskej republiky. Tým nie sú dotknuté tvoje práva spotrebiteľa podľa kogentných predpisov.',
    ],
  },
];

const EN_SECTIONS: Section[] = [
  {
    title: 'What these terms cover',
    body: [
      'These terms govern your use of Pawly — food analysis, pet profiles, the health passport, the episode diary and the vet card.',
      'By registering an account you agree to them. If you do not agree, please do not use the app.',
      'Processing of personal data is covered by a separate document, the Privacy Policy.',
    ],
  },
  {
    title: 'Your account',
    body: [
      'Your account is personal. Do not share your credentials.',
      'Register with a working email address you will keep access to. The address must be verified; until then the account stays inactive.',
      'We advise against disposable or temporary email addresses — if you lose access to the mailbox we cannot restore your password or account, and the address may later be taken over by someone else.',
      'One account per person. Creating additional accounts to work around service limits breaches these terms.',
    ],
  },
  {
    title: 'How you may use the service',
    body: [
      'Use Pawly to care for your own animals or animals in your care.',
      'You must not: circumvent service limits (in particular by creating multiple accounts or making automated calls outside the app), attempt to access other users’ accounts or data, load the service in a way that threatens its operation, submit unlawful content, or interfere with the technical protection of the service.',
      'AI features are intended for animal care. Using them for unrelated purposes is considered abuse.',
    ],
  },
  {
    title: 'The app does not replace a vet',
    body: [
      'AI outputs (food analysis, health card interpretation, episode summaries) are informational and may contain errors.',
      'Pawly does not provide veterinary diagnosis or treatment. Always consult a veterinarian about your animal’s health.',
      'Decisions about your animal’s health remain your responsibility.',
    ],
  },
  {
    title: 'Restricting, blocking and closing an account',
    body: [
      'If we find conduct that breaches these terms, we may — depending on its seriousness — warn the account, temporarily restrict its access to AI features, block it, or close it.',
      'Grounds for action include in particular: circumventing limits through multiple accounts or automated calls, attempts to access other users’ accounts or data, conduct endangering the operation or security of the service, false information at registration, unlawful content, and abuse of AI features for unrelated purposes.',
      'We will notify you by email to the account address, stating the reason. We act without prior warning only in serious cases — in particular unlawful conduct, attacks on the service, or risk to other users’ data.',
      'Blocking is reversible. Closing an account with deletion of data is a last resort for serious or repeated breaches.',
      'You can close your account at any time using “Delete account” in the menu.',
    ],
  },
  {
    title: 'What happens to your data',
    body: [
      'If your account is blocked we do not delete your data — it stays stored and becomes available again once the block is lifted.',
      'If the account is closed, data is deleted as described in the Privacy Policy.',
      'Even after closure we may keep a minimal record of the action (email address, reason and date) to prevent repeated abuse, for no longer than 12 months. The legal basis is our legitimate interest under Art. 6(1)(f) GDPR; you may object under Art. 21 GDPR.',
    ],
  },
  {
    title: 'How to appeal',
    body: [
      'If you believe we acted wrongly, write to support@pawly.sk with your account email and a short description.',
      'We will review it and reply within 30 days at the latest. If we got it wrong, we will restore the account without delay.',
      'You also have the right to contact the Slovak Data Protection Authority or a court.',
    ],
  },
  {
    title: 'Availability and changes to these terms',
    body: [
      'Pawly is provided “as is”, without a guarantee of uninterrupted availability. We may take the service down for maintenance or limit its features.',
      'AI features have daily limits that protect the service from excessive load.',
      'We may change these terms. We will announce any material change by email or in the app at least 14 days in advance. If you disagree, you may close your account.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'Questions about these terms and appeals against an action: support@pawly.sk.',
      'These terms are governed by the law of the Slovak Republic. Your mandatory consumer rights are not affected.',
    ],
  },
];

interface TermsContentProps {
  showHeader?: boolean;
}

export default function TermsContent({ showHeader = true }: TermsContentProps) {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const lang = i18n.language?.toLowerCase().startsWith('en') ? 'en' : 'sk';
  const sections = lang === 'en' ? EN_SECTIONS : SK_SECTIONS;
  const title = lang === 'en' ? 'Terms of Use' : 'Podmienky používania';
  const subtitle =
    lang === 'en'
      ? 'The rules for using Pawly, and when we may restrict an account.'
      : 'Pravidlá používania Pawly a kedy môžeme zasiahnuť do účtu.';
  const updated = lang === 'en' ? 'Last updated' : 'Posledná aktualizácia';

  return (
    <Box>
      {showHeader && (
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12),
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GavelIcon />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
        {updated}: 2026-08-05 · {t('supportEmail')}
      </Typography>

      <Stack spacing={2}>
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
                {section.title}
              </Typography>
              <Stack component="ul" spacing={1} sx={{ pl: 2.5, m: 0 }}>
                {section.body.map((line) => (
                  <li key={line}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {line}
                    </Typography>
                  </li>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
