import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  DeleteOutline as DeleteIcon,
  HistoryOutlined as HistoryIcon,
  OpenInNew as OpenInNewIcon,
  Save as SaveIcon,
  InfoOutlined as InfoIcon,
  Flag as FlagIcon,
  BarChart as BarChartIcon,
  VerifiedUser as VerifiedUserIcon,
  AutoAwesome as AutoAwesomeIcon,
  Article as ArticleIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import PageContainer from '../../components/ui/PageContainer';
import SectionCardHeader from '../../components/ui/SectionCardHeader';
import { ANIMAL_SPECIES, type AnimalType } from '../../constants/animalSpecies';
import ArticleRichEditor from '../../components/admin/articleEditor/ArticleRichEditor';
import RelatedArticlesPicker from '../../components/admin/articleEditor/RelatedArticlesPicker';
import ImagePickerButton from '../../components/admin/articleEditor/ImagePickerButton';
import ArticleVersionsDrawer from '../../components/admin/ArticleVersionsDrawer';
import ArticleValidationPanel from '../../components/admin/ArticleValidationPanel';
import ArticleBody from '../../components/public/ArticleBody';
import Callout from '../../components/public/Callout';
import {
  autosaveArticle,
  changeArticleStatus,
  createAdminArticle,
  generateArticleAi,
  getAdminArticle,
  getAdminStatus,
  getArticleAiLog,
  getArticleMetric,
  getArticleValidation,
  listArticleVersions,
  updateAdminArticle,
} from '../../services/adminApi';
import { articleRefreshFlags } from '../../utils/articleRefreshFlags';
import { slugifyHeading } from '../../utils/slugifyHeading';
import {
  ARTICLE_STATUS_TRANSITIONS,
  STATUS_COLORS,
  STATUS_LABELS,
  transitionActionLabel,
} from '../../utils/articleWorkflow';
import { ARTICLE_DISCLAIMER } from '../../content/poradna/articles';
import type {
  AdminArticle,
  AiGenerationLog,
  ArticleAiType,
  ArticleMetrics,
  ArticleStatus,
  ArticleValidation,
} from '../../content/poradna/types';

function emptyArticle(): AdminArticle {
  return {
    slug: '',
    category: 'krmivo',
    species: [],
    title: '',
    description: '',
    intro: '',
    sections: [],
    faqs: [],
    relatedSlugs: [],
    updated: new Date().toISOString().slice(0, 10),
    coverImage: '',
    ctaIntent: 'food',
    author: '',
    sources: [],
    published: false,
    position: 0,
    status: 'draft',
    assignedTo: '',
    internalNotes: '',
    scheduledFor: '',
    coverAlt: '',
    coverCredit: '',
  };
}

const PUBLISH_CHECKLIST = [
  'Obsah skontroloval človek (nie len AI).',
  'Pri zdravotných tvrdeniach sú uvedené zdroje.',
  'Titulok, meta popis a úvod sú vyplnené.',
  'Odkazy a obrázky fungujú.',
];

// Prechody, ktoré smie vykonať len admin (schválenie/publikovanie/archivácia).
// Editor bez admin práv môže len poslať na schválenie alebo vrátiť do konceptu.
const ADMIN_ONLY_STATUSES: ReadonlySet<ArticleStatus> = new Set([
  'approved',
  'scheduled',
  'published',
  'archived',
]);

// Doplnkový checklist keď bol použitý AI obsah (audit/kontrola pred publikovaním).
const AI_REVIEW_CHECKLIST = [
  'AI text: skontrolované fakty.',
  'AI text: skontrolované zdroje.',
  'AI text: upravený tón.',
  'AI text: odstránené neoverené tvrdenia.',
];

function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  if (!local) return '';
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

// Plochý text tela článku ako kontext pre AI akcie.
function articleBodyText(article: AdminArticle): string {
  return article.sections
    .flatMap((s) => [
      s.heading,
      ...s.blocks.flatMap((b) => {
        if (b.type === 'bullets') return b.items;
        if (
          b.type === 'paragraph' ||
          b.type === 'subheading' ||
          b.type === 'quote' ||
          b.type === 'callout'
        )
          return [b.text];
        return [];
      }),
    ])
    .filter((t) => t.trim().length > 0)
    .join('\n');
}

export default function AdminArticleEditPage() {
  const theme = useTheme();
  const { t } = useTranslation('healthPassport');
  const speciesLabels = t('profiles.species', { returnObjects: true }) as Record<string, string>;
  const speciesLabel = (key: string) => speciesLabels[key] ?? key;
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const isNew = !slug;

  const [form, setForm] = useState<AdminArticle>(emptyArticle());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistChecked, setChecklistChecked] = useState<boolean[]>([]);
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [validation, setValidation] = useState<ArticleValidation | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [metric, setMetric] = useState<ArticleMetrics | null>(null);
  const [aiBusy, setAiBusy] = useState<ArticleAiType | null>(null);
  const [aiLog, setAiLog] = useState<AiGenerationLog[]>([]);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Posledný uložený/načítaný stav (JSON) — autosave beží len pri reálnej zmene.
  const savedSnapshotRef = useRef<string>('');
  // Používateľ ručne upravil slug → prestaneme ho auto-generovať z titulku.
  const slugTouchedRef = useRef<boolean>(!isNew);

  // Lišta editora sa portáluje do tejto sticky hlavičky, aby bola vždy viditeľná
  // počas editácie tela (spoľahlivejšie než position: sticky vo vnorenom Card).
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    getAdminStatus()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    getAdminArticle(slug)
      .then((a) => {
        setForm(a);
        savedSnapshotRef.current = JSON.stringify(a);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    listArticleVersions(slug)
      .then((v) => setLatestVersion(v[0]?.versionNumber ?? 0))
      .catch(() => setLatestVersion(null));
    setValidationLoading(true);
    getArticleValidation(slug)
      .then(setValidation)
      .catch(() => setValidation(null))
      .finally(() => setValidationLoading(false));
    getArticleMetric(slug)
      .then(setMetric)
      .catch(() => setMetric(null));
    getArticleAiLog(slug)
      .then(setAiLog)
      .catch(() => setAiLog([]));
  }, [slug, isNew]);

  // Autosave konceptu: po 8 s nečinnosti uloží snapshot verzie, ak nastala
  // zmena. Nemení živý článok — len zachová rozpracovanú prácu vo verziách.
  useEffect(() => {
    if (isNew || !slug || loading) return;
    const current = JSON.stringify(form);
    if (current === savedSnapshotRef.current) return;
    const timer = setTimeout(() => {
      autosaveArticle(slug, form)
        .then(({ savedAt }) => {
          savedSnapshotRef.current = current;
          setAutosavedAt(savedAt);
        })
        .catch(() => {
          /* autosave je best-effort; chyby nerušia editáciu */
        });
    }, 8000);
    return () => clearTimeout(timer);
  }, [form, slug, isNew, loading]);

  const set = <K extends keyof AdminArticle>(key: K, val: AdminArticle[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const faqs = form.faqs ?? [];
  const sources = form.sources ?? [];

  const loadValidation = () => {
    if (isNew || !slug) return;
    setValidationLoading(true);
    getArticleValidation(slug)
      .then(setValidation)
      .catch(() => setValidation(null))
      .finally(() => setValidationLoading(false));
  };

  const focusField = (field: string) => {
    setTab(0);
    setTimeout(() => {
      const el = document.getElementById(`field-${field}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 100);
  };

  const cleanedPayload = (): AdminArticle => ({
    ...form,
    faqs: faqs.filter((f) => f.q.trim() || f.a.trim()),
    sources: sources.filter((s) => s.label.trim() || s.url.trim()),
    sections: form.sections.map((s) => ({
      ...s,
      blocks: s.blocks.map((b) =>
        b.type === 'bullets' ? { ...b, items: b.items.filter((i) => i.trim().length > 0) } : b
      ),
    })),
  });

  // Uloženie obsahu/metadát — NEMENÍ stav (ten ide len cez prechody nižšie).
  const saveContent = async (): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const payload = cleanedPayload();
      if (isNew) {
        const created = await createAdminArticle(payload);
        navigate(`/admin/clanky/${created.slug}`);
        return true;
      }
      const updated = await updateAdminArticle(slug, payload);
      setForm(updated);
      savedSnapshotRef.current = JSON.stringify(updated);
      setNotice('Uložené.');
      loadValidation();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Náhľad musí odrážať práve rozpracovanú prácu. „Otvoriť náhľad" fetchuje
  // uložený obsah, preto pri neuložených zmenách najprv uložíme a až potom
  // presmerujeme (blank tab otvoríme synchronne, aby ho neblokoval popup blocker).
  const openPreview = async () => {
    const href = `/admin/clanky/${slug}/nahlad`;
    const hasUnsaved = JSON.stringify(form) !== savedSnapshotRef.current;
    if (!hasUnsaved) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    const previewWindow = window.open('', '_blank');
    const ok = await saveContent();
    if (ok && previewWindow) previewWindow.location.href = href;
    else previewWindow?.close();
  };

  // Zmena stavu cez workflow. Najprv uloží obsah (aby server validoval aktuálne
  // dáta, napr. pri publikovaní), potom zmení stav cez validovaný prechod.
  const runStatus = async (target: ArticleStatus, opts?: { scheduledFor?: string }) => {
    if (isNew || !slug) {
      setError('Najprv ulož článok.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateAdminArticle(slug, cleanedPayload());
      const { article: updated, buildTriggered } = await changeArticleStatus(slug, target, opts);
      setForm(updated);
      savedSnapshotRef.current = JSON.stringify(updated);
      setLatestVersion((v) => (v == null ? v : v + 1));
      setNotice(
        buildTriggered
          ? `Stav: ${STATUS_LABELS[target]}. Spustil sa build webu — zmeny budú online o pár minút.`
          : `Stav: ${STATUS_LABELS[target]}.`
      );
      loadValidation();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Akcia podľa cieľového stavu: publish cez checklist, schedule cez dialóg.
  const handleTransition = (target: ArticleStatus) => {
    if (target === 'published') {
      const list =
        aiLog.length > 0 ? [...PUBLISH_CHECKLIST, ...AI_REVIEW_CHECKLIST] : PUBLISH_CHECKLIST;
      setChecklistChecked(list.map(() => false));
      setChecklistOpen(true);
      return;
    }
    if (target === 'scheduled') {
      setScheduleAt(toLocalInput(form.scheduledFor));
      setScheduleOpen(true);
      return;
    }
    void runStatus(target);
  };

  const allowedTransitions = ARTICLE_STATUS_TRANSITIONS[form.status];
  const hasAi = aiLog.length > 0;
  const publishChecklist = hasAi
    ? [...PUBLISH_CHECKLIST, ...AI_REVIEW_CHECKLIST]
    : PUBLISH_CHECKLIST;

  const runAi = async (type: ArticleAiType, instruction?: string) => {
    if (isNew || !slug) {
      setError('Najprv ulož článok, potom môžeš použiť AI.');
      return;
    }
    setAiBusy(type);
    setError(null);
    try {
      const result = await generateArticleAi({
        type,
        articleSlug: slug,
        title: form.title,
        bodyText: type === 'rewrite' ? form.intro : articleBodyText(form),
        instruction,
        category: form.category,
        sources: sources.filter((s) => s.url.trim()),
      });
      if (type === 'meta_description' && result.text) set('description', result.text);
      else if (type === 'summary' && result.text) set('intro', result.text);
      else if (type === 'rewrite' && result.text) set('intro', result.text);
      else if (type === 'faq' && result.faqs) set('faqs', [...faqs, ...result.faqs]);
      else if (type === 'outline' && result.headings) {
        set('sections', [
          ...form.sections,
          ...result.headings.map((h) => ({
            heading: h,
            blocks: [{ type: 'paragraph' as const, text: '' }],
          })),
        ]);
      } else if (type === 'source_check') setAiNote(result.text ?? 'Bez poznámok.');
      getArticleAiLog(slug)
        .then(setAiLog)
        .catch(() => {});
      setNotice('AI návrh pridaný — over a uprav podľa potreby.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAiBusy(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: (t) => t.zIndex.appBar - 1,
          bgcolor: 'background.default',
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: theme.spacing(2),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: theme.spacing(1) }}>
          <IconButton onClick={() => navigate('/admin/clanky')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            {isNew ? 'Nový článok' : 'Upraviť článok'}
          </Typography>
          {autosavedAt && (
            <Typography variant="caption" color="text.secondary">
              Automaticky uložené o {new Date(autosavedAt).toLocaleTimeString('sk-SK')}
            </Typography>
          )}
          {!isNew && (
            <Button variant="text" startIcon={<OpenInNewIcon />} onClick={openPreview}>
              Otvoriť náhľad
            </Button>
          )}
          {!isNew && (
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setVersionsOpen(true)}
            >
              História verzií
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveContent}
            disabled={saving}
          >
            {saving ? 'Ukladám…' : 'Uložiť'}
          </Button>
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v as number)}>
          <Tab label="Editor" />
          <Tab label="Náhľad" />
          <Tab label="Kontrola" />
        </Tabs>

        {tab === 0 && <Box ref={setToolbarSlot} sx={{ mt: theme.spacing(0.5) }} />}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: theme.spacing(2) }}>
          {error}
        </Alert>
      )}

      {tab === 2 && (
        <ArticleValidationPanel
          validation={validation}
          loading={validationLoading}
          onRefresh={loadValidation}
          onFocusField={focusField}
        />
      )}

      {tab === 1 && (
        <Box sx={{ maxWidth: 720, mx: 'auto' }}>
          <Typography variant="h3" component="h1" sx={{ mb: theme.spacing(2) }}>
            {form.title || '(bez titulku)'}
          </Typography>
          {form.intro && (
            <Typography
              variant="h6"
              component="p"
              sx={{ fontWeight: 400, color: 'text.secondary', mb: theme.spacing(3) }}
            >
              {form.intro}
            </Typography>
          )}
          <Divider sx={{ mb: theme.spacing(3) }} />
          <ArticleBody sections={form.sections} />
          {faqs.length > 0 && (
            <Box component="section" sx={{ mt: theme.spacing(4) }}>
              <Typography variant="h5" component="h2" sx={{ mb: theme.spacing(2) }}>
                Časté otázky
              </Typography>
              {faqs.map((f, i) => (
                <Box key={i} sx={{ mb: theme.spacing(2) }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {f.q}
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.8 }}>
                    {f.a}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          <Box sx={{ mt: theme.spacing(3) }}>
            <Callout variant="info" title="Upozornenie" text={ARTICLE_DISCLAIMER} />
          </Box>
        </Box>
      )}

      {tab === 0 && (
        <Stack spacing={theme.spacing(2)}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <SectionCardHeader
                icon={<InfoIcon />}
                accent={theme.palette.primary.main}
                title="Základné údaje"
              />
              <Stack spacing={theme.spacing(2)}>
                <TextField
                  id="field-title"
                  label="Titulok (H1)"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({
                      ...f,
                      title,
                      // Auto-slug z titulku, kým ho admin ručne neupravil (len nový článok).
                      ...(isNew && !slugTouchedRef.current ? { slug: slugifyHeading(title) } : {}),
                    }));
                  }}
                  fullWidth
                  size="small"
                />
                <TextField
                  id="field-slug"
                  label="Slug (URL)"
                  value={form.slug}
                  onChange={(e) => {
                    slugTouchedRef.current = true;
                    set('slug', e.target.value);
                  }}
                  disabled={!isNew}
                  helperText={
                    isNew
                      ? 'Automaticky z titulku; môžeš prepísať. Po vytvorení sa nemení.'
                      : 'Slug sa po vytvorení nemení.'
                  }
                  fullWidth
                  size="small"
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={theme.spacing(2)}>
                  <TextField
                    select
                    label="Kategória"
                    value={form.category}
                    onChange={(e) => set('category', e.target.value as AdminArticle['category'])}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="krmivo">Krmivo a výživa</MenuItem>
                    <MenuItem value="zdravie">Zdravie a prevencia</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="CTA cieľ"
                    value={form.ctaIntent}
                    onChange={(e) => set('ctaIntent', e.target.value as AdminArticle['ctaIntent'])}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="food">Analýza krmiva</MenuItem>
                    <MenuItem value="passport">Zdravotný pas</MenuItem>
                  </TextField>
                </Stack>
                <Autocomplete
                  multiple
                  size="small"
                  options={ANIMAL_SPECIES as readonly AnimalType[]}
                  value={(form.species ?? []) as AnimalType[]}
                  onChange={(_e, value) => set('species', value)}
                  getOptionLabel={(opt) => speciesLabel(opt)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Druh zvieraťa (filter)"
                      helperText="Pre koho je článok určený. Prázdne = bez viazania na druh."
                    />
                  )}
                />
                <TextField
                  id="field-description"
                  label="Popis do zoznamu / SEO"
                  helperText="Meta popis (SEO). Povinný až pred publikovaním."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                />
                <TextField
                  id="field-teaser"
                  label="Pútač (text na karte v zozname)"
                  helperText="Krátky pútací text na karte článku. Ak prázdny, použije sa popis."
                  value={form.teaser ?? ''}
                  onChange={(e) => set('teaser', e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                />
                <Autocomplete
                  multiple
                  freeSolo
                  size="small"
                  options={[] as string[]}
                  value={form.tags ?? []}
                  onChange={(_e, value) =>
                    set(
                      'tags',
                      value.map((v) => v.trim().replace(/^#/, '')).filter((v) => v.length > 0)
                    )
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Hashtagy (SEO)"
                      helperText="Kľúčové slová pre Google. Napíš slovo a stlač Enter."
                    />
                  )}
                />
                <TextField
                  id="field-intro"
                  label="Perex (úvodný odsek)"
                  helperText="Výrazný úvodný odsek pod nadpisom článku."
                  value={form.intro ?? ''}
                  onChange={(e) => set('intro', e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                />
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={theme.spacing(2)}
                  alignItems="flex-start"
                >
                  <Stack spacing={1} sx={{ flexGrow: 1, width: '100%' }}>
                    <TextField
                      id="field-coverImage"
                      label="URL titulného obrázka"
                      value={form.coverImage ?? ''}
                      onChange={(e) => set('coverImage', e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      id="field-coverAlt"
                      label="Alt text titulného obrázka"
                      value={form.coverAlt ?? ''}
                      onChange={(e) => set('coverAlt', e.target.value)}
                      size="small"
                      fullWidth
                      helperText="Popis obrázka pre prístupnosť a zdieľanie (og:image:alt)."
                    />
                    <TextField
                      id="field-coverCredit"
                      label="Zdroj titulného obrázka"
                      value={form.coverCredit ?? ''}
                      onChange={(e) => set('coverCredit', e.target.value)}
                      size="small"
                      fullWidth
                      helperText={'Popisok pod obrázkom, napr. „Zdroj: Unsplash". Nepovinné.'}
                    />
                    <Box sx={{ alignSelf: 'flex-start' }}>
                      <ImagePickerButton
                        label="Vybrať / nahrať titulnú fotku"
                        onPicked={(media) =>
                          setForm((f) => ({
                            ...f,
                            coverImage: media.url,
                            coverAlt: f.coverAlt?.trim() ? f.coverAlt : (media.alt ?? ''),
                            coverCredit: f.coverCredit?.trim()
                              ? f.coverCredit
                              : media.author
                                ? `Zdroj: ${media.author}`
                                : (f.coverCredit ?? ''),
                          }))
                        }
                      />
                    </Box>
                    {form.coverImage && (
                      <Box
                        component="img"
                        src={form.coverImage}
                        alt=""
                        sx={{
                          width: '100%',
                          maxWidth: theme.spacing(40),
                          borderRadius: theme.shape.borderRadius,
                          objectFit: 'cover',
                        }}
                      />
                    )}
                  </Stack>
                  <TextField
                    label="Autor"
                    value={form.author ?? ''}
                    onChange={(e) => set('author', e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Stack>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={theme.spacing(2)}
                  alignItems="center"
                >
                  <TextField
                    label="Dátum aktualizácie"
                    type="date"
                    value={form.updated}
                    onChange={(e) => set('updated', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Poradie"
                    type="number"
                    value={form.position}
                    onChange={(e) => set('position', Number(e.target.value))}
                    size="small"
                    sx={{ width: theme.spacing(14) }}
                  />
                </Stack>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Súvisiace články
                  </Typography>
                  <RelatedArticlesPicker
                    value={form.relatedSlugs ?? []}
                    onChange={(slugs) => set('relatedSlugs', slugs)}
                    currentSlug={isNew ? undefined : form.slug}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <SectionCardHeader
                icon={<FlagIcon />}
                accent={theme.palette.secondary.main}
                title="Redakčný stav"
              />
              <Stack spacing={theme.spacing(2)}>
                <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Status:
                    </Typography>
                    <Chip
                      label={STATUS_LABELS[form.status]}
                      color={STATUS_COLORS[form.status]}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Posledná zmena: {form.updated}
                  </Typography>
                  {latestVersion != null && (
                    <Typography variant="body2" color="text.secondary">
                      Verzia: v{latestVersion}
                    </Typography>
                  )}
                  {form.scheduledFor && form.status === 'scheduled' && (
                    <Typography variant="body2" color="text.secondary">
                      Naplánované na {new Date(form.scheduledFor).toLocaleString('sk-SK')}
                    </Typography>
                  )}
                </Stack>

                {isNew ? (
                  <Typography variant="caption" color="text.secondary">
                    Po uložení sa článok vytvorí ako koncept a sprístupnia sa redakčné akcie.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                    {allowedTransitions.map((target) => {
                      const adminOnly = ADMIN_ONLY_STATUSES.has(target);
                      const blocked = adminOnly && !isAdmin;
                      const button = (
                        <Button
                          key={target}
                          size="small"
                          variant="outlined"
                          disabled={saving || blocked}
                          color={
                            target === 'published'
                              ? 'success'
                              : target === 'archived'
                                ? 'inherit'
                                : 'primary'
                          }
                          onClick={() => handleTransition(target)}
                        >
                          {transitionActionLabel(form.status, target)}
                        </Button>
                      );
                      return blocked ? (
                        <Tooltip key={target} title="Túto akciu môže vykonať len administrátor.">
                          <span>{button}</span>
                        </Tooltip>
                      ) : (
                        button
                      );
                    })}
                  </Stack>
                )}

                <TextField
                  label="Priradené (e-mail editora)"
                  value={form.assignedTo ?? ''}
                  onChange={(e) => set('assignedTo', e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Interné poznámky (nezobrazujú sa verejne)"
                  value={form.internalNotes ?? ''}
                  onChange={(e) => set('internalNotes', e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>

          {!isNew && (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <SectionCardHeader
                  icon={<BarChartIcon />}
                  accent={theme.palette.info.main}
                  title="Výkon článku (30 dní)"
                />
                <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: theme.spacing(1) }}>
                  <Typography variant="body2">
                    <strong>Zobrazenia:</strong> {metric?.views ?? 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>CTA kliky:</strong> {metric?.ctaClicks ?? 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>CTR:</strong> {((metric?.ctr ?? 0) * 100).toFixed(1)} %
                  </Typography>
                  <Typography variant="body2">
                    <strong>Scroll 90 %:</strong>{' '}
                    {metric && metric.views > 0
                      ? `${((metric.scroll90 / metric.views) * 100).toFixed(0)} %`
                      : '—'}
                  </Typography>
                </Stack>
                {articleRefreshFlags(form, metric).map((flag) => (
                  <Alert key={flag.key} severity="warning" sx={{ mt: 1 }}>
                    {flag.message}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <SectionCardHeader
                icon={<VerifiedUserIcon />}
                accent={theme.palette.success.main}
                title="Odborná kontrola"
              />
              {form.category === 'zdravie' && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1 }}
                >
                  Zdravotný článok: pred publikovaním je povinný disclaimer, dátum poslednej
                  kontroly a úroveň rizika. Pri vysokom riziku aj medicínska kontrola a fact-check.
                </Typography>
              )}
              <Stack spacing={theme.spacing(2)}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={theme.spacing(2)}>
                  <TextField
                    id="field-riskLevel"
                    select
                    label="Úroveň rizika"
                    value={form.riskLevel ?? ''}
                    onChange={(e) =>
                      set('riskLevel', (e.target.value || undefined) as AdminArticle['riskLevel'])
                    }
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="">— nezvolené —</MenuItem>
                    <MenuItem value="low">Nízke (všeobecná starostlivosť)</MenuItem>
                    <MenuItem value="medium">Stredné (výživa, alergie, trávenie)</MenuItem>
                    <MenuItem value="high">Vysoké (choroby, lieky, urgentné stavy)</MenuItem>
                  </TextField>
                  <TextField
                    id="field-lastContentReviewAt"
                    label="Dátum poslednej kontroly"
                    type="date"
                    value={(form.lastContentReviewAt ?? '').slice(0, 10)}
                    onChange={(e) => set('lastContentReviewAt', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Ďalšia kontrola"
                    type="date"
                    value={(form.nextReviewDueAt ?? '').slice(0, 10)}
                    onChange={(e) => set('nextReviewDueAt', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={theme.spacing(2)}>
                  <TextField
                    label="Kontroloval(a)"
                    value={form.reviewedBy ?? ''}
                    onChange={(e) => set('reviewedBy', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Titul / rola kontrolóra"
                    value={form.reviewerTitle ?? ''}
                    onChange={(e) => set('reviewerTitle', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Dátum kontroly"
                    type="date"
                    value={(form.reviewedAt ?? '').slice(0, 10)}
                    onChange={(e) => set('reviewedAt', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={theme.spacing(2)}>
                  <TextField
                    id="field-factCheckedBy"
                    label="Fact-check (kto)"
                    value={form.factCheckedBy ?? ''}
                    onChange={(e) => set('factCheckedBy', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Fact-check (dátum)"
                    type="date"
                    value={(form.factCheckedAt ?? '').slice(0, 10)}
                    onChange={(e) => set('factCheckedAt', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={theme.spacing(2)}>
                  <TextField
                    id="field-medicalReviewedBy"
                    label="Medicínska kontrola (kto)"
                    value={form.medicalReviewedBy ?? ''}
                    onChange={(e) => set('medicalReviewedBy', e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Medicínska kontrola (dátum)"
                    type="date"
                    value={(form.medicalReviewedAt ?? '').slice(0, 10)}
                    onChange={(e) => set('medicalReviewedAt', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <TextField
                  id="field-disclaimer"
                  label="Disclaimer (ak prázdne, použije sa globálny)"
                  value={form.disclaimer ?? ''}
                  onChange={(e) => set('disclaimer', e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>

          {!isNew && (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <SectionCardHeader
                  icon={<AutoAwesomeIcon />}
                  accent={theme.palette.diet.main}
                  title="AI asistent"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 1 }}
                >
                  AI len navrhuje — výstup vždy skontroluj a uprav. Každé volanie sa loguje (audit +
                  náklady) a pred publikovaním si vyžiada AI kontrolu.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {(
                    [
                      ['meta_description', 'Meta popis'],
                      ['summary', 'Úvod'],
                      ['rewrite', 'Vylepšiť úvod'],
                      ['faq', 'Navrhnúť FAQ'],
                      ['outline', 'Osnova sekcií'],
                      ['source_check', 'Skontrolovať zdroje'],
                    ] as [ArticleAiType, string][]
                  ).map(([type, label]) => (
                    <Button
                      key={type}
                      size="small"
                      variant="outlined"
                      disabled={aiBusy !== null}
                      onClick={() => void runAi(type)}
                    >
                      {aiBusy === type ? 'Generujem…' : label}
                    </Button>
                  ))}
                </Stack>
                {aiLog.length > 0 && (
                  <Box sx={{ mt: theme.spacing(2) }}>
                    <Typography variant="caption" color="text.secondary">
                      AI log ({aiLog.length}) — posledné:
                    </Typography>
                    <Stack sx={{ mt: 0.5 }}>
                      {aiLog.slice(0, 5).map((g) => (
                        <Typography key={g.id} variant="caption" color="text.secondary">
                          {new Date(g.createdAt).toLocaleString('sk-SK')} · {g.type} · {g.model} ·{' '}
                          {g.inputTokens ?? '?'}+{g.outputTokens ?? '?'} tok ·{' '}
                          {g.estimatedCost != null ? `$${g.estimatedCost.toFixed(4)}` : '—'}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <SectionCardHeader
                icon={<ArticleIcon />}
                accent={theme.palette.primary.main}
                title="Obsah článku"
              />
              <ArticleRichEditor
                value={form.sections}
                onChange={(sections) => set('sections', sections)}
                toolbarContainer={toolbarSlot}
              />
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <SectionCardHeader
                icon={<QuestionAnswerIcon />}
                accent={theme.palette.info.main}
                title="Často kladené otázky (FAQ)"
              />
              <Stack spacing={theme.spacing(1.5)}>
                {faqs.map((f, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <Stack spacing={1} sx={{ flexGrow: 1 }}>
                      <TextField
                        label={`Otázka #${i + 1}`}
                        value={f.q}
                        onChange={(e) =>
                          set(
                            'faqs',
                            faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x))
                          )
                        }
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label="Odpoveď"
                        value={f.a}
                        onChange={(e) =>
                          set(
                            'faqs',
                            faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x))
                          )
                        }
                        multiline
                        minRows={2}
                        size="small"
                        fullWidth
                      />
                    </Stack>
                    <IconButton
                      color="error"
                      onClick={() =>
                        set(
                          'faqs',
                          faqs.filter((_, j) => j !== i)
                        )
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => set('faqs', [...faqs, { q: '', a: '' }])}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Pridať otázku
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <SectionCardHeader
                icon={<LinkIcon />}
                accent={theme.palette.secondary.main}
                title="Zdroje"
              />
              <Stack spacing={theme.spacing(1.5)}>
                {sources.map((s, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <TextField
                      label="Názov"
                      value={s.label}
                      onChange={(e) =>
                        set(
                          'sources',
                          sources.map((x, j) => (j === i ? { ...x, label: e.target.value } : x))
                        )
                      }
                      size="small"
                      sx={{ flexGrow: 1 }}
                    />
                    <TextField
                      label="URL"
                      value={s.url}
                      onChange={(e) =>
                        set(
                          'sources',
                          sources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x))
                        )
                      }
                      size="small"
                      sx={{ flexGrow: 1 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() =>
                        set(
                          'sources',
                          sources.filter((_, j) => j !== i)
                        )
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => set('sources', [...sources, { label: '', url: '' }])}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Pridať zdroj
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Divider />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveContent}
            disabled={saving}
            sx={{ alignSelf: 'flex-start' }}
          >
            {saving ? 'Ukladám…' : 'Uložiť článok'}
          </Button>
        </Stack>
      )}

      {!isNew && (
        <ArticleVersionsDrawer
          open={versionsOpen}
          slug={slug ?? ''}
          current={form}
          onClose={() => setVersionsOpen(false)}
          onRestored={(article) => {
            setForm(article);
            setVersionsOpen(false);
            setNotice(`Obnovená verzia článku „${article.title}".`);
          }}
        />
      )}

      <Dialog open={checklistOpen} onClose={() => setChecklistOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Kontrola pred publikovaním</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(1) }}>
            Pri témach ako zdravie psa over, že obsah je v poriadku. Publikovať môžeš až po
            odškrtnutí všetkých bodov.
          </Typography>
          {validation && validation.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: theme.spacing(2) }}>
              Najprv oprav chyby (pozri tab „Kontrola"):
              <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: theme.spacing(3) }}>
                {validation.errors.map((c) => (
                  <li key={c.key}>{c.message}</li>
                ))}
              </Box>
            </Alert>
          )}
          <Stack>
            {publishChecklist.map((item, i) => (
              <FormControlLabel
                key={i}
                control={
                  <Checkbox
                    checked={checklistChecked[i] ?? false}
                    onChange={(e) =>
                      setChecklistChecked((prev) => {
                        const next = [...prev];
                        next[i] = e.target.checked;
                        return next;
                      })
                    }
                  />
                }
                label={item}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChecklistOpen(false)}>Zrušiť</Button>
          <Button
            variant="contained"
            disabled={
              saving ||
              (validation != null && !validation.canPublish) ||
              checklistChecked.length === 0 ||
              !checklistChecked.every(Boolean)
            }
            onClick={() => {
              setChecklistOpen(false);
              void runStatus('published');
            }}
          >
            Publikovať
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Naplánovať publikovanie</DialogTitle>
        <DialogContent>
          <TextField
            label="Publikovať o"
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
          <Typography variant="caption" color="text.secondary">
            V naplánovanom čase článok automaticky zverejní cron.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>Zrušiť</Button>
          <Button
            variant="contained"
            disabled={saving || !scheduleAt}
            onClick={() => {
              const iso = fromLocalInput(scheduleAt);
              if (!iso) return;
              setScheduleOpen(false);
              void runStatus('scheduled', { scheduledFor: iso });
            }}
          >
            Naplánovať
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(aiNote)} onClose={() => setAiNote(null)} fullWidth maxWidth="sm">
        <DialogTitle>AI kontrola zdrojov</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {aiNote}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiNote(null)}>Zavrieť</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        message={notice ?? ''}
      />
    </PageContainer>
  );
}
