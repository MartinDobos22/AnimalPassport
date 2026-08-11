import { useTranslation } from 'react-i18next';
import { Box, Card, CardContent, Stack, Typography, alpha, useTheme } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface Section {
  title: string;
  body: string[];
}

const SK_SECTIONS: Section[] = [
  {
    title: 'Aké dáta zbierame',
    body: [
      'E-mailová adresa pre registráciu a prihlásenie.',
      'Profily zvierat: meno, plemeno, dátum narodenia, alergie, intolerancie, chronické stavy.',
      'Zdravotné záznamy: vakcinácie, odčervenia, ošetrenia proti ektoparazitom, návštevy veterinára, lieky a ich dávkovanie, kŕmne záznamy, výdavky, zdravotné epizódy, váhové záznamy.',
      'Voliteľné prílohy (fotografie zdravotnej karty) — ukladáme len odkaz na privátne úložisko; pôvodné súbory sa do AI promptov neposielajú.',
      'Uložené analýzy krmiva a história tvojich AI vyhľadávaní.',
    ],
  },
  {
    title: 'Kto má k dátam prístup',
    body: [
      'Ty ako vlastník účtu — kedykoľvek vidíš všetky svoje dáta v aplikácii.',
      'Prevádzkovateľ aplikácie (Pawly) má technický prístup k databáze výhradne na účely prevádzky, údržby a podpory. Prístupy sú obmedzené, chránené 2FA a každý prístup k zdravotným záznamom sa zapisuje do interného audit logu.',
      'Žiadne dáta nepredávame, neposúvame inzerentom ani tretím stranám na marketingové účely.',
    ],
  },
  {
    title: 'Tretie strany (spracovatelia)',
    body: [
      'Supabase (EÚ región) — databáza a úložisko súborov.',
      'Firebase Authentication (Google) — overovanie identity (e-mail/heslo, Google prihlásenie).',
      'OpenAI — AI analýza krmiva, interpretácia zdravotnej karty, sumarizácia podobných epizód. Pred odoslaním do AI z payloadu odstraňujeme identifikátory (uid, e-mail, telefón, číslo čipu/pasu).',
      'Google Vision API — OCR rozpoznávanie textu z fotografií.',
      'Render (hosting backendu).',
    ],
  },
  {
    title: 'Tvoje práva (GDPR)',
    body: [
      'Právo na prístup — všetky tvoje dáta vidíš v aplikácii, navyše si môžeš stiahnuť kompletný JSON export cez tlačidlo „Stiahnuť moje dáta“ v menu.',
      'Právo na opravu — všetky záznamy si môžeš upraviť priamo v aplikácii.',
      'Právo na výmaz — tlačidlo „Zmazať účet“ v menu nezvratne zmaže všetky tvoje dáta vrátane zvierat a zdravotných záznamov.',
      'Právo na prenositeľnosť — export je vo formáte JSON.',
      'Právo namietať a podať sťažnosť dozornému orgánu (Úrad na ochranu osobných údajov SR).',
    ],
  },
  {
    title: 'Doba uchovávania',
    body: [
      'Tvoje dáta uchovávame, kým nezmažeš účet. Po zmazaní účtu sa všetky záznamy okamžite a nezvratne odstránia z databázy. Záložné kópie sa cyklicky prepisujú do 30 dní.',
      'Ak dôjde k zablokovaniu alebo zrušeniu účtu podľa Podmienok používania, môžeme si ponechať minimálny záznam o zásahu (e-mailová adresa, dôvod a dátum) na predchádzanie opakovanému zneužitiu služby, najviac 12 mesiacov. Právnym základom je oprávnený záujem podľa čl. 6 ods. 1 písm. f) GDPR; môžeš proti nemu namietať podľa čl. 21 GDPR.',
    ],
  },
  {
    title: 'Bezpečnosť',
    body: [
      'Komunikácia medzi aplikáciou a serverom je šifrovaná TLS.',
      'Databáza beží v EÚ regióne s šifrovaním v pokoji.',
      'Prístup k zdravotným záznamom je obmedzený na vlastníka cez Row Level Security a kontrolu vlastníctva v každom volaní.',
      'Každé čítanie a zmena zdravotných záznamov sa zapisuje do audit logu.',
    ],
  },
  {
    title: 'Kontakt',
    body: ['Otázky k spracovaniu dát alebo žiadosti podľa GDPR posielaj na support@pawly.sk.'],
  },
];

const EN_SECTIONS: Section[] = [
  {
    title: 'What data we collect',
    body: [
      'Email address for registration and login.',
      'Pet profiles: name, breed, date of birth, allergies, intolerances, chronic conditions.',
      'Health records: vaccinations, dewormings, ectoparasite treatments, vet visits, medications, dose logs, diet entries, expenses, health episodes, weight logs.',
      'Optional attachments (photos of health cards) — we store only a reference to private storage; original files are not sent into AI prompts.',
      'Saved food analyses and your AI search history.',
    ],
  },
  {
    title: 'Who has access',
    body: [
      'You as the account owner — you can see all your data at any time.',
      'The operator (Pawly) has technical access to the database only for operations, maintenance and support. Access is restricted, protected by 2FA, and every read of health records is recorded in an internal audit log.',
      'We never sell data, share it with advertisers, or pass it to third parties for marketing.',
    ],
  },
  {
    title: 'Third-party processors',
    body: [
      'Supabase (EU region) — database and file storage.',
      'Firebase Authentication (Google) — identity verification (email/password, Google sign-in).',
      'OpenAI — AI food analysis, health passport interpretation, similar-episode summaries. We strip identifiers (uid, email, phone, microchip/passport numbers) from the payload before sending.',
      'Google Vision API — OCR text recognition from photos.',
      'Render (backend hosting).',
    ],
  },
  {
    title: 'Your rights (GDPR)',
    body: [
      'Right of access — you can see all your data in the app, and download a full JSON export from the “Download my data” button in the menu.',
      'Right to rectification — you can edit any record in the app.',
      'Right to erasure — the “Delete account” button in the menu irreversibly removes all your data.',
      'Right to data portability — the export is in JSON.',
      'Right to object and to lodge a complaint with the supervisory authority.',
    ],
  },
  {
    title: 'Retention',
    body: [
      'We keep your data until you delete your account. After deletion all records are removed immediately and irreversibly from the live database. Backups cycle out within 30 days.',
      'If an account is blocked or closed under the Terms of Use, we may keep a minimal record of the action (email address, reason and date) to prevent repeated abuse, for no longer than 12 months. The legal basis is legitimate interest under Art. 6(1)(f) GDPR; you may object under Art. 21 GDPR.',
    ],
  },
  {
    title: 'Security',
    body: [
      'All communication between the app and the server is encrypted with TLS.',
      'The database runs in the EU region with at-rest encryption.',
      'Access to health records is restricted to the owner via Row Level Security and per-call ownership checks.',
      'Every read and modification of health records is recorded in an audit log.',
    ],
  },
  {
    title: 'Contact',
    body: ['Questions about data processing or GDPR requests: support@pawly.sk.'],
  },
];

interface PrivacyPolicyContentProps {
  showHeader?: boolean;
}

export default function PrivacyPolicyContent({ showHeader = true }: PrivacyPolicyContentProps) {
  const theme = useTheme();
  const { i18n, t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const lang = i18n.language?.toLowerCase().startsWith('en') ? 'en' : 'sk';
  const sections = lang === 'en' ? EN_SECTIONS : SK_SECTIONS;
  const title = lang === 'en' ? 'Privacy Policy' : 'Ochrana súkromia';
  const subtitle =
    lang === 'en'
      ? 'How Pawly handles your data and your pet’s health records.'
      : 'Ako Pawly narába s tvojimi dátami a zdravotnými záznamami tvojho zvieraťa.';
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
              bgcolor: alpha(theme.palette.success.main, isDark ? 0.18 : 0.12),
              color: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockIcon />
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
        {updated}: 2026-06-03 · {t('supportEmail')}
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
