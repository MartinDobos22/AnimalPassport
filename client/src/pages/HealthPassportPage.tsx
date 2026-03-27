import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Biotech as BiotechIcon,
  CalendarMonth as CalendarMonthIcon,
  EventNote as EventNoteIcon,
  MedicalServices as MedicalServicesIcon,
  Medication as MedicationIcon,
  PestControl as PestControlIcon,
  ReceiptLong as ReceiptLongIcon,
  Restaurant as RestaurantIcon,
  UploadFile as UploadFileIcon,
  Vaccines as VaccinesIcon,
} from '@mui/icons-material';
import type { PetProfile } from '../types';
import { useAnalyze } from '../hooks/useAnalyze';
import { useLocalStorage } from '../hooks/useLocalStorage';
import AiFormattedText from '../components/AiFormattedText';
import { VetVisitHelper } from '../utils/vetVisitHelper';
import type {
  DewormingRecord,
  DietEntry,
  EctoparasiteRecord,
  ExpenseCategory,
  ExpenseRecord,
  MedicationDoseLog,
  MedicationRecord,
  TimelineEvent,
  ValidityStatus,
  VaccinationRecord,
  VetVisitRecord,
} from '../types/dogHealth';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (date: string, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const computeIntervalDaysFromDates = (dateGiven: string, validUntil: string, fallback: number) => {
  if (!validUntil) return fallback;
  const start = new Date(dateGiven).getTime();
  const end = new Date(validUntil).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return fallback;
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, days || fallback);
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const VISIT_CATEGORY_OPTIONS = [
  {
    main: 'Laboratórne vyšetrenia',
    sub: ['Krvné testy', 'Vyšetrenie moču', 'Vyšetrenie stolice', 'Mikrobiológia (kultivácie)', 'Cytológia', 'Biopsia / histológia'],
  },
  {
    main: 'Alergie a koža',
    sub: ['Kožné scrapings', 'Kožné stery / pásikové testy', 'Alergologické krvné testy', 'Intradermálne alergotesty'],
  },
  {
    main: 'Zobrazovacie metódy',
    sub: ['Röntgen (RTG)', 'Ultrazvuk (USG)', 'CT', 'MRI', 'Endoskopia'],
  },
  {
    main: 'Srdce a cievy',
    sub: ['EKG', 'Meranie krvného tlaku', 'Echokardiografia', 'Röntgen hrudníka'],
  },
  {
    main: 'Očné vyšetrenia',
    sub: ['Vyšetrenie oka', 'Meranie vnútroočného tlaku', 'Test slzivosti', 'Farbiace testy rohovky'],
  },
  {
    main: 'Neurologické vyšetrenia',
    sub: ['Klinické neuro vyšetrenie', 'Pokročilé zobrazovanie (MRI/CT)'],
  },
  {
    main: 'Infekčné ochorenia',
    sub: ['Rýchlotesty (napr. parvo, FeLV/FIV, srdcový červ)', 'Sérologické panely'],
  },
  {
    main: 'Genetické testy',
    sub: ['Dedičné ochorenia', 'Plemenné testy'],
  },
  {
    main: 'Veterinárny pas',
    sub: ['Záznam z veterinárneho pasu'],
  },
] as const;
const EXAM_SUBCATEGORY_TO_ALIAS: Record<string, string> = {
  'Krvné testy': 'krvne_testy',
  'Vyšetrenie moču': 'vysetrenie_mocu',
  'Vyšetrenie stolice': 'vysetrenie_stolice',
  'Mikrobiológia (kultivácie)': 'mikrobiologia',
  Cytológia: 'cytologia',
  'Biopsia / histológia': 'biopsia_histologia',
  'Kožné scrapings': 'kozne_scrapings',
  'Kožné stery / pásikové testy': 'kozne_stery',
  'Alergologické krvné testy': 'alergologicke_krvne_testy',
  'Intradermálne alergotesty': 'intradermalne_alergotesty',
  'Röntgen (RTG)': 'rtg',
  'Ultrazvuk (USG)': 'ultrazvuk',
  CT: 'ct',
  MRI: 'mri',
  Endoskopia: 'endoskopia',
  EKG: 'ekg',
  'Meranie krvného tlaku': 'krvny_tlak',
  Echokardiografia: 'echo',
  'Röntgen hrudníka': 'rtg_hrudnika',
  'Vyšetrenie oka': 'vysetrenie_oka',
  'Meranie vnútroočného tlaku': 'vnutoocny_tlak',
  'Test slzivosti': 'test_slzivosti',
  'Farbiace testy rohovky': 'farbiace_testy_rohovky',
  'Klinické neuro vyšetrenie': 'klinicke_neuro',
  'Pokročilé zobrazovanie (MRI/CT)': 'pokrocile_zobrazovanie',
  'Rýchlotesty (napr. parvo, FeLV/FIV, srdcový červ)': 'rychlotesty',
  'Sérologické panely': 'serologicke_panely',
  'Dedičné ochorenia': 'dedicne_ochorenia',
  'Plemenné testy': 'plemenne_testy',
  'Záznam z veterinárneho pasu': 'veterinarny_pas',
};
const TIMELINE_FILTER_OPTIONS: Array<{ value: 'ALL' | TimelineEvent['type']; label: string }> = [
  { value: 'ALL', label: 'Všetko' },
  { value: 'VACCINATION', label: 'Očkovanie' },
  { value: 'DEWORMING', label: 'Odčervenie' },
  { value: 'ECTOPARASITE', label: 'Ektoparazity' },
  { value: 'VET_VISIT', label: 'Vet návštevy' },
  { value: 'MEDICATION', label: 'Lieky' },
  { value: 'DIET', label: 'Diéta' },
  { value: 'EXPENSE', label: 'Výdavky' },
  { value: 'NOTE', label: 'Poznámky' },
];
const TIMELINE_TYPE_META: Record<TimelineEvent['type'], { label: string; color: 'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'info' }> = {
  VACCINATION: { label: 'Očkovanie', color: 'success' },
  DEWORMING: { label: 'Odčervenie', color: 'secondary' },
  ECTOPARASITE: { label: 'Ektoparazity', color: 'warning' },
  VET_VISIT: { label: 'Návšteva veterinára', color: 'primary' },
  MEDICATION: { label: 'Liečba', color: 'info' },
  DIET: { label: 'Diéta', color: 'success' },
  EXPENSE: { label: 'Výdavok', color: 'error' },
  NOTE: { label: 'Poznámka', color: 'info' },
};

const timelineIconByType: Record<TimelineEvent['type'], JSX.Element> = {
  VACCINATION: <VaccinesIcon fontSize="small" />,
  DEWORMING: <BiotechIcon fontSize="small" />,
  ECTOPARASITE: <PestControlIcon fontSize="small" />,
  VET_VISIT: <MedicalServicesIcon fontSize="small" />,
  MEDICATION: <MedicationIcon fontSize="small" />,
  DIET: <RestaurantIcon fontSize="small" />,
  EXPENSE: <ReceiptLongIcon fontSize="small" />,
  NOTE: <EventNoteIcon fontSize="small" />,
};

type AiDetectedRecordType = 'VACCINATION' | 'DEWORMING' | 'ECTOPARASITE' | 'MEDICATION' | 'NOTE' | 'SKIP';

interface AiDetectedDraftRecord {
  id: string;
  sourceConfidence: 'high' | 'medium' | 'low';
  sourceDisease?: string;
  targetType: AiDetectedRecordType;
  productName: string;
  date: string;
  validUntil: string;
  batchNumber: string;
  intervalDays: number;
}

type WizardAdditionalRecordType = '' | 'VACCINATION' | 'DEWORMING' | 'ECTOPARASITE' | 'MEDICATION';

const KNOWN_DEWORMING_KEYWORDS = ['drontal', 'milbemax', 'milprazon', 'caniverm', 'deworm', 'odcerv'];
const KNOWN_ECTOPARASITE_KEYWORDS = ['simparica', 'bravecto', 'advantix', 'nexgard', 'ecto', 'parazit', 'klie', 'blch'];
const KNOWN_RABIES_KEYWORDS = ['rabies', 'besnot', 'nobivac rabies'];
const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizeDateInput = (value: string) => {
  if (!value) return today();
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return value;
  const dottedMatch = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dottedMatch) {
    const day = dottedMatch[1].padStart(2, '0');
    const month = dottedMatch[2].padStart(2, '0');
    const yearRaw = dottedMatch[3];
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    return `${year}-${month}-${day}`;
  }
  return today();
};

const inferAiTargetType = (disease: string, vaccineName: string): AiDetectedRecordType => {
  const value = `${disease} ${vaccineName}`.toLowerCase();
  if (KNOWN_DEWORMING_KEYWORDS.some((keyword) => value.includes(keyword))) return 'DEWORMING';
  if (KNOWN_ECTOPARASITE_KEYWORDS.some((keyword) => value.includes(keyword))) return 'ECTOPARASITE';
  if (KNOWN_RABIES_KEYWORDS.some((keyword) => value.includes(keyword))) return 'VACCINATION';
  return 'VACCINATION';
};

function statusByDate(targetDate: string, soonDays: number): ValidityStatus {
  const now = new Date(today());
  const t = new Date(targetDate);
  const diff = Math.ceil((t.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'EXPIRED';
  if (diff <= soonDays) return 'EXPIRING_SOON';
  return 'VALID';
}

export default function HealthPassportPage() {
  const [profiles] = useLocalStorage<PetProfile[]>('granule-check-pet-profiles', []);
  const dogProfiles = useMemo(() => profiles.filter((p) => p.animalType === 'dog'), [profiles]);
  const [selectedDogId, setSelectedDogId] = useState(dogProfiles[0]?.id ?? '');

  const [vaccinations, setVaccinations] = useLocalStorage<VaccinationRecord[]>('dog-health-vaccinations', []);
  const [dewormings, setDewormings] = useLocalStorage<DewormingRecord[]>('dog-health-dewormings', []);
  const [ectos, setEctos] = useLocalStorage<EctoparasiteRecord[]>('dog-health-ectos', []);
  const [visits, setVisits] = useLocalStorage<VetVisitRecord[]>('dog-health-visits', []);
  const [medications, setMedications] = useLocalStorage<MedicationRecord[]>('dog-health-medications', []);
  const [doseLogs, setDoseLogs] = useLocalStorage<MedicationDoseLog[]>('dog-health-med-dose-logs', []);
  const [dietEntries, setDietEntries] = useLocalStorage<DietEntry[]>('dog-health-diet-entries', []);
  const [expenses, setExpenses] = useLocalStorage<ExpenseRecord[]>('dog-health-expenses', []);

  const dog = dogProfiles.find((d) => d.id === selectedDogId);

  const dogVaccinations = vaccinations.filter((v) => v.dogId === selectedDogId);
  const dogDewormings = dewormings.filter((v) => v.dogId === selectedDogId);
  const dogEctos = ectos.filter((v) => v.dogId === selectedDogId);
  const dogVisits = visits.filter((v) => v.dogId === selectedDogId);
  const dogMeds = medications.filter((v) => v.dogId === selectedDogId);
  const dogDiet = dietEntries.filter((v) => v.dogId === selectedDogId);
  const dogExpenses = expenses.filter((v) => v.dogId === selectedDogId);

  const lastVaccinationStatus = dogVaccinations.length
    ? statusByDate([...dogVaccinations].sort((a, b) => b.validUntil.localeCompare(a.validUntil))[0].validUntil, 30)
    : 'EXPIRED';
  const lastDewormingStatus = dogDewormings.length
    ? statusByDate([...dogDewormings].sort((a, b) => b.nextDueDate.localeCompare(a.nextDueDate))[0].nextDueDate, 7)
    : 'EXPIRED';
  const lastEctoStatus = dogEctos.length
    ? statusByDate([...dogEctos].sort((a, b) => b.nextDueDate.localeCompare(a.nextDueDate))[0].nextDueDate, 7)
    : 'EXPIRED';

  const timeline: TimelineEvent[] = useMemo(() => {
    const t: TimelineEvent[] = [];
    dogVaccinations.forEach((v) => t.push({ id: `vac-${v.id}`, dogId: v.dogId, type: 'VACCINATION', title: `Očkovanie: ${v.name}`, subtitle: `Platnosť do ${v.validUntil}`, date: v.dateApplied }));
    dogDewormings.forEach((v) => t.push({ id: `dew-${v.id}`, dogId: v.dogId, type: 'DEWORMING', title: `Odčervenie: ${v.productName}`, subtitle: `Ďalší termín ${v.nextDueDate}`, date: v.dateGiven }));
    dogEctos.forEach((v) => t.push({ id: `ect-${v.id}`, dogId: v.dogId, type: 'ECTOPARASITE', title: `Antiparazitikum: ${v.productName}`, subtitle: `Ďalší termín ${v.nextDueDate}`, date: v.dateGiven }));
    dogVisits.forEach((v) => t.push({ id: `visit-${v.id}`, dogId: v.dogId, type: 'VET_VISIT', title: `Návšteva veterinára: ${v.clinicName}`, subtitle: v.reason, date: v.date }));
    dogMeds.forEach((v) => t.push({ id: `med-${v.id}`, dogId: v.dogId, type: 'MEDICATION', title: `Liek: ${v.name}`, subtitle: `${v.dose}, ${v.frequency}`, date: v.startDate }));
    dogDiet.forEach((v) => t.push({ id: `diet-${v.id}`, dogId: v.dogId, type: 'DIET', title: `Diéta: ${v.foodName}`, subtitle: v.suitabilityStatus, date: v.startedAt }));
    dogExpenses.forEach((v) => t.push({ id: `exp-${v.id}`, dogId: v.dogId, type: 'EXPENSE', title: `Výdavok ${v.amount.toFixed(2)} ${v.currency}`, subtitle: v.category, date: v.date }));
    return t.sort((a, b) => b.date.localeCompare(a.date));
  }, [dogVaccinations, dogDewormings, dogEctos, dogVisits, dogMeds, dogDiet, dogExpenses]);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedVisitMainCategory, setSelectedVisitMainCategory] = useState('');
  const [selectedVisitSubcategory, setSelectedVisitSubcategory] = useState('');
  const [wizard, setWizard] = useState({
    date: today(),
    clinicName: '',
    reason: '',
    findings: '',
    diagnosis: '',
    recommendations: '',
    nextCheckDate: '',
    addVaccination: false,
    vaccineName: '',
    vaccineType: 'RABIES' as 'RABIES' | 'COMBINED' | 'OTHER',
    vaccineValidUntil: plusDays(today(), 365),
    addDeworming: false,
    dewormProduct: '',
    dewormValidUntil: plusDays(today(), 90),
    dewormInterval: 90,
    addEcto: false,
    ectoProduct: '',
    ectoForm: 'TABLET' as 'TABLET' | 'SPOT_ON' | 'COLLAR',
    ectoValidUntil: plusDays(today(), 30),
    ectoInterval: 30,
    addMedication: false,
    medName: '',
    medReason: '',
    medDose: '',
    medFrequency: '2x denne',
    medEndDate: '',
    addDiet: false,
    foodName: '',
    reactionNotes: '',
    suitabilityStatus: 'SUITABLE' as 'SUITABLE' | 'RISKY' | 'UNSUITABLE',
    attachmentLabel: '',
    attachmentUrl: '',
    totalExpense: '',
    extraMedicationExpense: '',
    extraFoodExpense: '',
  });

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<{ fileName: string; mimeType: string; base64Data: string } | null>(null);
  const [aiRecordDraft, setAiRecordDraft] = useState({
    date: today(),
    clinicName: '',
    diagnosis: '',
    recommendations: '',
  });
  const [aiRecordFeedback, setAiRecordFeedback] = useState<string | null>(null);
  const [aiDetectedRecords, setAiDetectedRecords] = useState<AiDetectedDraftRecord[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [isEditingVisit, setIsEditingVisit] = useState(false);
  const [selectedTimelineRecord, setSelectedTimelineRecord] = useState<{ id: string; type: TimelineEvent['type'] } | null>(null);
  const [isEditingTimelineRecord, setIsEditingTimelineRecord] = useState(false);
  const [visitDraft, setVisitDraft] = useState({
    date: '',
    clinicName: '',
    vetName: '',
    reason: '',
    findings: '',
    diagnosis: '',
    recommendations: '',
    nextCheckDate: '',
  });
  const [vaccinationDraft, setVaccinationDraft] = useState({
    name: '',
    type: 'RABIES' as 'RABIES' | 'COMBINED' | 'OTHER',
    dateApplied: today(),
    validUntil: plusDays(today(), 365),
    batchNumber: '',
  });
  const [dewormingDraft, setDewormingDraft] = useState({
    productName: '',
    dateGiven: today(),
    intervalDays: 90,
    nextDueDate: plusDays(today(), 90),
  });
  const [ectoDraft, setEctoDraft] = useState({
    productName: '',
    form: 'TABLET' as 'TABLET' | 'SPOT_ON' | 'COLLAR',
    dateGiven: today(),
    intervalDays: 30,
    nextDueDate: plusDays(today(), 30),
  });
  const [medicationDraft, setMedicationDraft] = useState({
    name: '',
    reason: '',
    dose: '',
    frequency: '',
    startDate: today(),
    endDate: '',
  });
  const [dietDraft, setDietDraft] = useState({
    foodName: '',
    startedAt: today(),
    endedAt: '',
    reactionNotes: '',
    suitabilityStatus: 'SUITABLE' as 'SUITABLE' | 'RISKY' | 'UNSUITABLE',
  });
  const [expenseDraft, setExpenseDraft] = useState({
    date: today(),
    amount: '',
    currency: 'EUR',
    category: 'OTHER' as ExpenseCategory,
    note: '',
  });
  const { analyzeFile, fileResult, loadingFile, error: fileAnalyzeError } = useAnalyze();

  useEffect(() => {
    if (!fileResult?.healthPassportInterpretation?.vaccinations) {
      setAiDetectedRecords([]);
      return;
    }

    const records = fileResult.healthPassportInterpretation.vaccinations.map((item, index) => {
      const targetType = inferAiTargetType(item.disease, item.vaccineName);
      const date = normalizeDateInput(item.dateAdministered);
      const fallbackValidUntil = targetType === 'VACCINATION' ? plusDays(date, 365) : plusDays(date, 90);
      const intervalDays = targetType === 'ECTOPARASITE' ? 30 : 90;
      return {
        id: `${Date.now()}-${index}`,
        sourceConfidence: item.confidence,
        sourceDisease: item.disease,
        targetType,
        productName: item.vaccineName || item.disease || 'Neznámy záznam',
        date,
        validUntil: normalizeDateInput(item.validUntil ?? fallbackValidUntil),
        batchNumber: item.batchNumber ?? '',
        intervalDays,
      };
    });

    setAiDetectedRecords(records);
  }, [fileResult]);

  const handleAttachmentFileChange = (file: File | null) => {
    if (!file) {
      setAttachmentFile(null);
      setAttachmentPreviewUrl('');
      setAttachmentError('');
      setPendingAttachment(null);
      return;
    }
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      setAttachmentFile(null);
      setAttachmentPreviewUrl('');
      setAttachmentError('Nepodporovaný typ súboru.');
      setPendingAttachment(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAttachmentFile(null);
      setAttachmentPreviewUrl('');
      setAttachmentError('Súbor je príliš veľký (max 5 MB).');
      setPendingAttachment(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      const base64Data = raw.split(',')[1] ?? '';
      if (!base64Data) {
        setAttachmentPreviewUrl('');
        setAttachmentFile(null);
        setAttachmentError('Nepodarilo sa načítať súbor.');
        setPendingAttachment(null);
        return;
      }
      setAttachmentPreviewUrl(raw);
      setAttachmentFile(file);
      setAttachmentError('');
      setPendingAttachment({ fileName: file.name, mimeType: file.type, base64Data });
    };
    reader.onerror = () => {
      setAttachmentPreviewUrl('');
      setAttachmentFile(null);
      setAttachmentError('Nepodarilo sa načítať súbor.');
      setPendingAttachment(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeAttachment = async () => {
    if (!pendingAttachment || !selectedExamAlias) return;
    await analyzeFile(pendingAttachment, selectedExamAlias);
  };

  const todaysDoseLogs = doseLogs.filter((x) => x.dogId === selectedDogId && x.date === today());

  const toggleDose = (logId: string) => {
    setDoseLogs((prev) => prev.map((item) => (item.id === logId ? { ...item, taken: !item.taken } : item)));
  };

  const monthlyTotal = dogExpenses
    .filter((e) => e.date.slice(0, 7) === today().slice(0, 7))
    .reduce((acc, x) => acc + x.amount, 0);
  const yearlyTotal = dogExpenses
    .filter((e) => e.date.slice(0, 4) === today().slice(0, 4))
    .reduce((acc, x) => acc + x.amount, 0);

  const categorySums = ['VET_VISIT', 'MEDICATION', 'FOOD', 'OTHER'].map((category) => ({
    category,
    amount: dogExpenses.filter((e) => e.category === category).reduce((acc, x) => acc + x.amount, 0),
  }));

  const currentDiet = [...dogDiet].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const selectedVisitSubcategoryOptions = VISIT_CATEGORY_OPTIONS.find((item) => item.main === selectedVisitMainCategory)?.sub ?? [];
  const selectedExamAlias = selectedVisitSubcategory ? EXAM_SUBCATEGORY_TO_ALIAS[selectedVisitSubcategory] : '';
  const selectedWizardAdditionalRecord: WizardAdditionalRecordType = wizard.addVaccination
    ? 'VACCINATION'
    : wizard.addDeworming
      ? 'DEWORMING'
      : wizard.addEcto
        ? 'ECTOPARASITE'
        : wizard.addMedication
          ? 'MEDICATION'
          : '';
  const shouldShowDiagnosisAndRecommendations = Boolean(selectedVisitSubcategory || selectedWizardAdditionalRecord);
  const canProceedWizard = Boolean(wizard.clinicName.trim());

  const handleWizardAdditionalRecordChange = (value: WizardAdditionalRecordType) => {
    setWizard((prev) => ({
      ...prev,
      addVaccination: value === 'VACCINATION',
      addDeworming: value === 'DEWORMING',
      addEcto: value === 'ECTOPARASITE',
      addMedication: value === 'MEDICATION',
      addDiet: false,
    }));
  };

  const saveWizard = () => {
    if (!selectedDogId || !wizard.clinicName.trim()) return;
    const visitBundle = VetVisitHelper.createWizardVisitBundle({
      dogId: selectedDogId,
      draft: wizard,
      mainCategory: selectedVisitMainCategory,
      subcategory: selectedVisitSubcategory,
      attachmentDraft: {
        attachmentLabel: wizard.attachmentLabel,
        attachmentUrl: wizard.attachmentUrl,
        attachmentPreviewUrl,
        attachmentFileName: attachmentFile?.name,
      },
      currentDietEntryId: dogDiet[0]?.id,
      plusDays,
      uid,
    });

    setVisits((prev) => [...prev, visitBundle.visit]);
    if (visitBundle.vaccinations.length) setVaccinations((prev) => [...prev, ...visitBundle.vaccinations]);
    if (visitBundle.dewormings.length) setDewormings((prev) => [...prev, ...visitBundle.dewormings]);
    if (visitBundle.ectos.length) setEctos((prev) => [...prev, ...visitBundle.ectos]);
    if (visitBundle.medications.length) setMedications((prev) => [...prev, ...visitBundle.medications]);
    if (visitBundle.doseLogs.length) setDoseLogs((prev) => [...prev, ...visitBundle.doseLogs]);
    if (visitBundle.dietEntries.length) setDietEntries((prev) => [...prev, ...visitBundle.dietEntries]);
    if (visitBundle.expenses.length) setExpenses((prev) => [...prev, ...visitBundle.expenses]);

    setWizardOpen(false);
    setWizardStep(0);
    setWizard({
      date: today(), clinicName: '', reason: '', findings: '', diagnosis: '', recommendations: '', nextCheckDate: '',
      addVaccination: false, vaccineName: '', vaccineType: 'RABIES', vaccineValidUntil: plusDays(today(), 365),
      addDeworming: false, dewormProduct: '', dewormValidUntil: plusDays(today(), 90), dewormInterval: 90,
      addEcto: false, ectoProduct: '', ectoForm: 'TABLET', ectoValidUntil: plusDays(today(), 30), ectoInterval: 30,
      addMedication: false, medName: '', medReason: '', medDose: '', medFrequency: '2x denne', medEndDate: '',
      addDiet: false, foodName: '', reactionNotes: '', suitabilityStatus: 'SUITABLE',
      attachmentLabel: '', attachmentUrl: '', totalExpense: '', extraMedicationExpense: '', extraFoodExpense: '',
    });
    setAttachmentFile(null);
    setAttachmentPreviewUrl('');
    setAttachmentError('');
    setPendingAttachment(null);
    setSelectedVisitMainCategory('');
    setSelectedVisitSubcategory('');
  };

  const [timelineFilter, setTimelineFilter] = useState<'ALL' | TimelineEvent['type']>('ALL');
  const [timelineSearch, setTimelineSearch] = useState('');
  const visibleTimeline = (timelineFilter === 'ALL' ? timeline : timeline.filter((x) => x.type === timelineFilter))
    .filter((x) => (`${x.title} ${x.subtitle ?? ''}`).toLowerCase().includes(timelineSearch.trim().toLowerCase()));
  const groupedTimeline = useMemo(() => {
    return visibleTimeline.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [visibleTimeline]);
  const timelineStatusSummary = [
    `Očkovanie: ${lastVaccinationStatus}`,
    `Odčervenie: ${lastDewormingStatus}`,
    `Kliešte/blchy: ${lastEctoStatus}`,
  ].join(' | ');
  const handleTimelinePdfExport = () => {
    if (!dog) return;
    const printableTimeline = visibleTimeline.length ? visibleTimeline : timeline;
    if (!printableTimeline.length) return;

    const rows = printableTimeline
      .map((event) => {
        const label = TIMELINE_TYPE_META[event.type].label;
        const subtitle = event.subtitle ? ` (${event.subtitle})` : '';
        return `<tr><td>${escapeHtml(event.date)}</td><td>${escapeHtml(label)}</td><td>${escapeHtml(event.title + subtitle)}</td></tr>`;
      })
      .join('');
    const reportTitle = `Zdravotná timeline - ${dog.name}`;
    const html = `<!doctype html>
<html lang="sk">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(reportTitle)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1f2937; padding: 24px; }
      h1 { margin: 0 0 10px; font-size: 24px; }
      p { margin: 4px 0; }
      .meta { margin-bottom: 16px; }
      .muted { color: #6b7280; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
      th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(reportTitle)}</h1>
    <div class="meta">
      <p><strong>Meno psa:</strong> ${escapeHtml(dog.name)}</p>
      <p><strong>Plemeno:</strong> ${escapeHtml(dog.breed || '–')} | <strong>Váha:</strong> ${escapeHtml(dog.weightKg ? `${dog.weightKg} kg` : '–')}</p>
      <p><strong>Súhrn stavu:</strong> ${escapeHtml(timelineStatusSummary)}</p>
      <p class="muted">Vygenerované: ${escapeHtml(new Date().toLocaleString('sk-SK'))} | Počet záznamov: ${printableTimeline.length}</p>
    </div>
    <table>
      <thead>
        <tr><th>Dátum</th><th>Typ</th><th>Detail</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  const hasSelectedAiDetectedRecords = aiDetectedRecords.some((item) => item.targetType !== 'SKIP');
  const canCreateAiRecord = Boolean(
    selectedDogId
      && aiRecordDraft.clinicName.trim()
      && ((selectedVisitSubcategory || fileResult?.examAnalysis?.examType) || hasSelectedAiDetectedRecords),
  );
  const selectedVisit = selectedVisitId ? dogVisits.find((visit) => visit.id === selectedVisitId) ?? null : null;
  const selectedVaccination = selectedTimelineRecord?.type === 'VACCINATION'
    ? dogVaccinations.find((item) => item.id === selectedTimelineRecord.id) ?? null
    : null;
  const selectedDeworming = selectedTimelineRecord?.type === 'DEWORMING'
    ? dogDewormings.find((item) => item.id === selectedTimelineRecord.id) ?? null
    : null;
  const selectedEcto = selectedTimelineRecord?.type === 'ECTOPARASITE'
    ? dogEctos.find((item) => item.id === selectedTimelineRecord.id) ?? null
    : null;
  const selectedMedication = selectedTimelineRecord?.type === 'MEDICATION'
    ? dogMeds.find((item) => item.id === selectedTimelineRecord.id) ?? null
    : null;
  const selectedDiet = selectedTimelineRecord?.type === 'DIET'
    ? dogDiet.find((item) => item.id === selectedTimelineRecord.id) ?? null
    : null;
  const selectedExpense = selectedTimelineRecord?.type === 'EXPENSE'
    ? dogExpenses.find((item) => item.id === selectedTimelineRecord.id) ?? null
    : null;

  const openVisitDetail = (visitId: string) => {
    const visit = dogVisits.find((item) => item.id === visitId);
    if (!visit) return;
    setSelectedVisitId(visitId);
    setIsEditingVisit(false);
    setVisitDraft({
      date: visit.date,
      clinicName: visit.clinicName,
      vetName: visit.vetName ?? '',
      reason: visit.reason,
      findings: visit.findings ?? '',
      diagnosis: visit.diagnosis ?? '',
      recommendations: visit.recommendations ?? '',
      nextCheckDate: visit.nextCheckDate ?? '',
    });
  };

  const openTimelineRecordDetail = (event: TimelineEvent) => {
    if (event.type === 'VET_VISIT') {
      openVisitDetail(event.id.replace('visit-', ''));
      return;
    }

    const recordId = event.id.replace(/^[^-]+-/, '');
    setSelectedTimelineRecord({ id: recordId, type: event.type });
    setIsEditingTimelineRecord(false);

    if (event.type === 'VACCINATION') {
      const record = dogVaccinations.find((item) => item.id === recordId);
      if (!record) return;
      setVaccinationDraft({
        name: record.name,
        type: record.type,
        dateApplied: record.dateApplied,
        validUntil: record.validUntil,
        batchNumber: record.batchNumber ?? '',
      });
    } else if (event.type === 'DEWORMING') {
      const record = dogDewormings.find((item) => item.id === recordId);
      if (!record) return;
      setDewormingDraft({
        productName: record.productName,
        dateGiven: record.dateGiven,
        intervalDays: record.intervalDays,
        nextDueDate: record.nextDueDate,
      });
    } else if (event.type === 'ECTOPARASITE') {
      const record = dogEctos.find((item) => item.id === recordId);
      if (!record) return;
      setEctoDraft({
        productName: record.productName,
        form: record.form,
        dateGiven: record.dateGiven,
        intervalDays: record.intervalDays ?? 30,
        nextDueDate: record.nextDueDate,
      });
    } else if (event.type === 'MEDICATION') {
      const record = dogMeds.find((item) => item.id === recordId);
      if (!record) return;
      setMedicationDraft({
        name: record.name,
        reason: record.reason,
        dose: record.dose,
        frequency: record.frequency,
        startDate: record.startDate,
        endDate: record.endDate ?? '',
      });
    } else if (event.type === 'DIET') {
      const record = dogDiet.find((item) => item.id === recordId);
      if (!record) return;
      setDietDraft({
        foodName: record.foodName,
        startedAt: record.startedAt,
        endedAt: record.endedAt ?? '',
        reactionNotes: record.reactionNotes ?? '',
        suitabilityStatus: record.suitabilityStatus ?? 'SUITABLE',
      });
    } else if (event.type === 'EXPENSE') {
      const record = dogExpenses.find((item) => item.id === recordId);
      if (!record) return;
      setExpenseDraft({
        date: record.date,
        amount: String(record.amount),
        currency: record.currency,
        category: record.category,
        note: record.note ?? '',
      });
    }
  };

  const saveVisitDetail = () => {
    if (!selectedVisitId) return;
    setVisits((prev) => prev.map((visit) => (
      visit.id !== selectedVisitId
        ? visit
        : {
            ...visit,
            date: visitDraft.date,
            clinicName: visitDraft.clinicName,
            vetName: visitDraft.vetName.trim() || undefined,
            reason: visitDraft.reason,
            findings: visitDraft.findings.trim() || undefined,
            diagnosis: visitDraft.diagnosis.trim() || undefined,
            recommendations: visitDraft.recommendations.trim() || undefined,
            nextCheckDate: visitDraft.nextCheckDate || undefined,
          }
    )));
    setIsEditingVisit(false);
  };

  const deleteSelectedVisit = () => {
    if (!selectedVisitId) return;
    setVisits((prev) => prev.filter((visit) => visit.id !== selectedVisitId));
    setSelectedVisitId(null);
    setIsEditingVisit(false);
  };

  const saveTimelineRecordDetail = () => {
    if (!selectedTimelineRecord) return;
    if (selectedTimelineRecord.type === 'VACCINATION') {
      setVaccinations((prev) => prev.map((item) => (
        item.id !== selectedTimelineRecord.id
          ? item
          : { ...item, name: vaccinationDraft.name, type: vaccinationDraft.type, dateApplied: vaccinationDraft.dateApplied, validUntil: vaccinationDraft.validUntil, batchNumber: vaccinationDraft.batchNumber || undefined }
      )));
    } else if (selectedTimelineRecord.type === 'DEWORMING') {
      setDewormings((prev) => prev.map((item) => (
        item.id !== selectedTimelineRecord.id
          ? item
          : {
              ...item,
              productName: dewormingDraft.productName,
              dateGiven: dewormingDraft.dateGiven,
              intervalDays: computeIntervalDaysFromDates(dewormingDraft.dateGiven, dewormingDraft.nextDueDate, 90),
              nextDueDate: dewormingDraft.nextDueDate,
            }
      )));
    } else if (selectedTimelineRecord.type === 'ECTOPARASITE') {
      setEctos((prev) => prev.map((item) => (
        item.id !== selectedTimelineRecord.id
          ? item
          : {
              ...item,
              productName: ectoDraft.productName,
              form: ectoDraft.form,
              dateGiven: ectoDraft.dateGiven,
              intervalDays: computeIntervalDaysFromDates(ectoDraft.dateGiven, ectoDraft.nextDueDate, 30),
              nextDueDate: ectoDraft.nextDueDate,
            }
      )));
    } else if (selectedTimelineRecord.type === 'MEDICATION') {
      setMedications((prev) => prev.map((item) => (
        item.id !== selectedTimelineRecord.id
          ? item
          : { ...item, name: medicationDraft.name, reason: medicationDraft.reason, dose: medicationDraft.dose, frequency: medicationDraft.frequency, startDate: medicationDraft.startDate, endDate: medicationDraft.endDate || undefined }
      )));
    } else if (selectedTimelineRecord.type === 'DIET') {
      setDietEntries((prev) => prev.map((item) => (
        item.id !== selectedTimelineRecord.id
          ? item
          : { ...item, foodName: dietDraft.foodName, startedAt: dietDraft.startedAt, endedAt: dietDraft.endedAt || undefined, reactionNotes: dietDraft.reactionNotes || undefined, suitabilityStatus: dietDraft.suitabilityStatus }
      )));
    } else if (selectedTimelineRecord.type === 'EXPENSE') {
      setExpenses((prev) => prev.map((item) => (
        item.id !== selectedTimelineRecord.id
          ? item
          : { ...item, date: expenseDraft.date, amount: Number(expenseDraft.amount || 0), currency: expenseDraft.currency, category: expenseDraft.category, note: expenseDraft.note || undefined }
      )));
    }

    setIsEditingTimelineRecord(false);
  };

  const deleteTimelineRecord = () => {
    if (!selectedTimelineRecord) return;
    if (selectedTimelineRecord.type === 'VACCINATION') {
      setVaccinations((prev) => prev.filter((item) => item.id !== selectedTimelineRecord.id));
    } else if (selectedTimelineRecord.type === 'DEWORMING') {
      setDewormings((prev) => prev.filter((item) => item.id !== selectedTimelineRecord.id));
    } else if (selectedTimelineRecord.type === 'ECTOPARASITE') {
      setEctos((prev) => prev.filter((item) => item.id !== selectedTimelineRecord.id));
    } else if (selectedTimelineRecord.type === 'MEDICATION') {
      setMedications((prev) => prev.filter((item) => item.id !== selectedTimelineRecord.id));
      setDoseLogs((prev) => prev.filter((item) => item.medicationId !== selectedTimelineRecord.id));
      setVisits((prev) => prev.map((visit) => ({ ...visit, medicationIds: visit.medicationIds.filter((medId) => medId !== selectedTimelineRecord.id) })));
    } else if (selectedTimelineRecord.type === 'DIET') {
      setDietEntries((prev) => prev.filter((item) => item.id !== selectedTimelineRecord.id));
    } else if (selectedTimelineRecord.type === 'EXPENSE') {
      setExpenses((prev) => prev.filter((item) => item.id !== selectedTimelineRecord.id));
    }
    setSelectedTimelineRecord(null);
    setIsEditingTimelineRecord(false);
  };

  const saveAiRecord = () => {
    if (!canCreateAiRecord || !selectedDogId) return;

    const aiSummary = [
      fileResult?.contextAnalysis?.summary ? `Kontext: ${fileResult.contextAnalysis.summary}` : '',
      fileResult?.examAnalysis?.analysis ? `AI analýza: ${fileResult.examAnalysis.analysis}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const selectedRecords = aiDetectedRecords
      .filter((item) => item.targetType !== 'SKIP')
      .map((item) => ({
        ...item,
        intervalDays: item.intervalDays || (item.targetType === 'ECTOPARASITE' ? 30 : 90),
      }));
    const visitBundle = VetVisitHelper.createAiVisitBundle({
      dogId: selectedDogId,
      draft: aiRecordDraft,
      selectedVisitMainCategory,
      selectedVisitSubcategory,
      examType: fileResult?.examAnalysis?.examType,
      aiSummary,
      selectedRecords,
      attachmentDraft: {
        attachmentLabel: wizard.attachmentLabel,
        attachmentUrl: wizard.attachmentUrl,
        attachmentPreviewUrl,
        attachmentFileName: attachmentFile?.name,
      },
      plusDays,
      uid,
    });

    setVisits((prev) => [...prev, visitBundle.visit]);
    if (visitBundle.vaccinations.length) setVaccinations((prev) => [...prev, ...visitBundle.vaccinations]);
    if (visitBundle.dewormings.length) setDewormings((prev) => [...prev, ...visitBundle.dewormings]);
    if (visitBundle.ectos.length) setEctos((prev) => [...prev, ...visitBundle.ectos]);
    if (visitBundle.medications.length) setMedications((prev) => [...prev, ...visitBundle.medications]);

    setAiRecordFeedback('AI výsledok bol uložený ako zdravotný záznam v timeline.');
    setAiRecordDraft({
      date: today(),
      clinicName: '',
      diagnosis: '',
      recommendations: '',
    });
    setAiDetectedRecords((prev) => prev.map((item) => ({ ...item, targetType: 'SKIP' })));
  };

  if (!dogProfiles.length) {
    return <Alert severity="info">Najprv si vytvorte profil psa v sekcii Profily.</Alert>;
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Zdravotný pas psa</Typography>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Pes</InputLabel>
            <Select value={selectedDogId} label="Pes" onChange={(e) => setSelectedDogId(e.target.value)}>
              {dogProfiles.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => setWizardOpen(true)}>Pridať záznam</Button>
          <Button variant="outlined" href="/karta-pre-veterinara">Karta pre veterinára</Button>
        </Stack>
      </Stack>

      <Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, mb: 2 }}>
        <Card><CardContent><Typography variant="body2">Očkovanie</Typography><Chip label={lastVaccinationStatus} color={lastVaccinationStatus === 'VALID' ? 'success' : lastVaccinationStatus === 'EXPIRING_SOON' ? 'warning' : 'error'} /></CardContent></Card>
        <Card><CardContent><Typography variant="body2">Odčervenie</Typography><Chip label={lastDewormingStatus} color={lastDewormingStatus === 'VALID' ? 'success' : lastDewormingStatus === 'EXPIRING_SOON' ? 'warning' : 'error'} /></CardContent></Card>
        <Card><CardContent><Typography variant="body2">Kliešte/blchy</Typography><Chip label={lastEctoStatus} color={lastEctoStatus === 'VALID' ? 'success' : lastEctoStatus === 'EXPIRING_SOON' ? 'warning' : 'error'} /></CardContent></Card>
        <Card><CardContent><Typography variant="body2">Aktuálna diéta</Typography><Typography variant="subtitle2">{currentDiet?.foodName ?? '–'}</Typography><Typography variant="caption">{currentDiet?.suitabilityStatus ?? 'Bez hodnotenia'}</Typography></CardContent></Card>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Najbližšie úlohy</Typography>
            <Stack spacing={1}>
              {dogVisits.filter((x) => x.nextCheckDate && x.nextCheckDate >= today()).sort((a, b) => (a.nextCheckDate ?? '').localeCompare(b.nextCheckDate ?? '')).slice(0, 3).map((x) => (
                <Typography key={x.id} variant="body2">• Kontrola {x.nextCheckDate} ({x.clinicName})</Typography>
              ))}
              {dogDewormings.slice(-1).map((x) => <Typography key={x.id} variant="body2">• Odčervenie do {x.nextDueDate}</Typography>)}
              {dogEctos.slice(-1).map((x) => <Typography key={x.id} variant="body2">• Antiparazitikum do {x.nextDueDate}</Typography>)}
              {dogMeds.filter((m) => !m.endDate || m.endDate >= today()).slice(0, 2).map((m) => <Typography key={m.id} variant="body2">• Liek: {m.name} ({m.frequency})</Typography>)}
              {todaysDoseLogs.map((log) => {
                const med = dogMeds.find((m) => m.id === log.medicationId);
                return (
                  <Button key={log.id} size="small" variant={log.taken ? 'contained' : 'outlined'} onClick={() => toggleDose(log.id)} sx={{ justifyContent: 'flex-start' }}>
                    {log.taken ? '✓' : '○'} Podanie: {med?.name ?? 'Liek'}
                  </Button>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Výdavky</Typography>
            <Typography variant="body2">Mesiac: {monthlyTotal.toFixed(2)} EUR</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Rok: {yearlyTotal.toFixed(2)} EUR</Typography>
            <Stack spacing={0.5}>{categorySums.map((x) => <Typography key={x.category} variant="caption">{x.category}: {x.amount.toFixed(2)} EUR</Typography>)}</Stack>
          </CardContent>
        </Card>
      </Box>
      </Box>

      <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            sx={{ mb: 1.5, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
          >
            <Box>
              <Typography variant="h6">Timeline</Typography>
              <Typography variant="body2" color="text.secondary">
                Rýchly prehľad po dňoch, s filtrovaním a vyhľadávaním.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <TextField
                size="small"
                label="Hľadať v záznamoch"
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
                sx={{ minWidth: { xs: '100%', md: 280 } }}
              />
              <Button
                variant="outlined"
                onClick={handleTimelinePdfExport}
                disabled={!timeline.length}
              >
                Export timeline PDF
              </Button>
            </Stack>
          </Stack>
          <Tabs value={timelineFilter} onChange={(_e, val) => setTimelineFilter(val)} variant="scrollable" scrollButtons="auto" sx={{ mb: 1.5 }}>
            {TIMELINE_FILTER_OPTIONS.map((option) => <Tab key={option.value} value={option.value} label={option.label} />)}
          </Tabs>
          {!visibleTimeline.length ? (
            <Alert severity="info">Nenašli sa žiadne záznamy pre zvolený filter.</Alert>
          ) : (
            <Stack spacing={2}>
              {Object.entries(groupedTimeline).map(([date, events]) => (
                <Box key={date}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <CalendarMonthIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2">{date}</Typography>
                    <Chip size="small" variant="outlined" label={`${events.length} záznamov`} />
                  </Stack>
                  <Stack spacing={1}>
                    {events.map((event) => {
                      const meta = TIMELINE_TYPE_META[event.type];
                      return (
                        <Card key={event.id} variant="outlined" sx={{ borderLeft: 4, borderLeftColor: `${meta.color}.main` }}>
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {timelineIconByType[event.type]}
                                <Typography variant="subtitle2">{event.title}</Typography>
                              </Stack>
                              <Chip size="small" color={meta.color} label={meta.label} />
                            </Stack>
                            {event.subtitle && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                {event.subtitle}
                              </Typography>
                            )}
                            <Button size="small" sx={{ mt: 1 }} onClick={() => openTimelineRecordDetail(event)}>
                              Otvoriť detail
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
      </Box>

      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Po návšteve veterinára ({wizardStep + 1}/2)</DialogTitle>
        <DialogContent>
          {wizardStep === 0 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vyšetrenie pre zdravotný pas</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Hlavná kategória</InputLabel>
                  <Select
                    value={selectedVisitMainCategory}
                    label="Hlavná kategória"
                    onChange={(e) => {
                      setSelectedVisitMainCategory(e.target.value);
                      setSelectedVisitSubcategory('');
                      setAttachmentFile(null);
                      setAttachmentPreviewUrl('');
                      setAttachmentError('');
                      setPendingAttachment(null);
                    }}
                  >
                    <MenuItem value="">Bez hlavnej kategórie</MenuItem>
                    {VISIT_CATEGORY_OPTIONS.map((item) => (
                      <MenuItem key={item.main} value={item.main}>{item.main}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={!selectedVisitMainCategory}>
                  <InputLabel>Podkategória</InputLabel>
                  <Select
                    value={selectedVisitSubcategory}
                    label="Podkategória"
                    onChange={(e) => {
                      const nextSubcategory = e.target.value;
                      setSelectedVisitSubcategory(nextSubcategory);
                      setAttachmentFile(null);
                      setAttachmentPreviewUrl('');
                      setAttachmentError('');
                      setPendingAttachment(null);
                    }}
                  >
                    <MenuItem value="">Bez podkategórie</MenuItem>
                    {selectedVisitSubcategoryOptions.map((sub) => (
                      <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <TextField label="Dátum" type="date" InputLabelProps={{ shrink: true }} value={wizard.date} onChange={(e) => setWizard({ ...wizard, date: e.target.value })} />
              <TextField label="Klinika" value={wizard.clinicName} onChange={(e) => setWizard({ ...wizard, clinicName: e.target.value })} />
              {shouldShowDiagnosisAndRecommendations && (
                <>
                  <TextField label="Nález / diagnóza" value={wizard.diagnosis} onChange={(e) => setWizard({ ...wizard, diagnosis: e.target.value })} />
                  <TextField label="Odporúčania" value={wizard.recommendations} onChange={(e) => setWizard({ ...wizard, recommendations: e.target.value })} />
                </>
              )}
            </Stack>
          )}
          {wizardStep === 0 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Doplňujúci záznam</InputLabel>
                <Select
                  value={selectedWizardAdditionalRecord}
                  label="Doplňujúci záznam"
                  onChange={(e) => handleWizardAdditionalRecordChange(e.target.value as WizardAdditionalRecordType)}
                >
                  <MenuItem value="">Bez doplňujúceho záznamu</MenuItem>
                  <MenuItem value="VACCINATION">Očkovanie</MenuItem>
                  <MenuItem value="DEWORMING">Odčervenie</MenuItem>
                  <MenuItem value="ECTOPARASITE">Antiparazitikum</MenuItem>
                  <MenuItem value="MEDICATION">Liek</MenuItem>
                </Select>
              </FormControl>
              {wizard.addVaccination && <Stack spacing={1}><TextField label="Názov vakcíny" value={wizard.vaccineName} onChange={(e) => setWizard({ ...wizard, vaccineName: e.target.value })} /><FormControl><InputLabel>Typ</InputLabel><Select value={wizard.vaccineType} label="Typ" onChange={(e) => setWizard({ ...wizard, vaccineType: e.target.value as any })}><MenuItem value="RABIES">RABIES</MenuItem><MenuItem value="COMBINED">COMBINED</MenuItem><MenuItem value="OTHER">OTHER</MenuItem></Select></FormControl><TextField label="Platné do" type="date" InputLabelProps={{ shrink: true }} value={wizard.vaccineValidUntil} onChange={(e) => setWizard({ ...wizard, vaccineValidUntil: e.target.value })} /></Stack>}

              {wizard.addDeworming && <Stack spacing={1}><TextField label="Produkt" value={wizard.dewormProduct} onChange={(e) => setWizard({ ...wizard, dewormProduct: e.target.value })} /><TextField label="Platné do" type="date" InputLabelProps={{ shrink: true }} value={wizard.dewormValidUntil} onChange={(e) => setWizard({ ...wizard, dewormValidUntil: e.target.value })} /></Stack>}

              {wizard.addEcto && <Stack spacing={1}><TextField label="Produkt" value={wizard.ectoProduct} onChange={(e) => setWizard({ ...wizard, ectoProduct: e.target.value })} /><FormControl><InputLabel>Forma</InputLabel><Select value={wizard.ectoForm} label="Forma" onChange={(e) => setWizard({ ...wizard, ectoForm: e.target.value as any })}><MenuItem value="TABLET">tablet</MenuItem><MenuItem value="SPOT_ON">spotOn</MenuItem><MenuItem value="COLLAR">collar</MenuItem></Select></FormControl><TextField label="Platné do" type="date" InputLabelProps={{ shrink: true }} value={wizard.ectoValidUntil} onChange={(e) => setWizard({ ...wizard, ectoValidUntil: e.target.value })} /></Stack>}

              {wizard.addMedication && <Stack spacing={1}><TextField label="Názov" value={wizard.medName} onChange={(e) => setWizard({ ...wizard, medName: e.target.value })} /><TextField label="Dôvod" value={wizard.medReason} onChange={(e) => setWizard({ ...wizard, medReason: e.target.value })} /><TextField label="Dávkovanie" value={wizard.medDose} onChange={(e) => setWizard({ ...wizard, medDose: e.target.value })} /><TextField label="Frekvencia" value={wizard.medFrequency} onChange={(e) => setWizard({ ...wizard, medFrequency: e.target.value })} /><TextField label="Koniec liečby" type="date" InputLabelProps={{ shrink: true }} value={wizard.medEndDate} onChange={(e) => setWizard({ ...wizard, medEndDate: e.target.value })} /></Stack>}
            </Stack>
          )}
          {wizardStep === 0 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {selectedExamAlias ? (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Príloha do zdravotného pasu</Typography>
                  <TextField label="Popis prílohy (napr. pas strana 4)" value={wizard.attachmentLabel} onChange={(e) => setWizard({ ...wizard, attachmentLabel: e.target.value })} />
                  <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                    Vybrať PDF alebo fotku
                    <input
                      type="file"
                      hidden
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => handleAttachmentFileChange(e.target.files?.[0] ?? null)}
                    />
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleAnalyzeAttachment}
                    disabled={loadingFile || !pendingAttachment || Boolean(attachmentError)}
                    startIcon={loadingFile ? <CircularProgress size={16} color="inherit" /> : undefined}
                  >
                    {loadingFile ? 'Analyzujem súbor...' : 'Analyzovať súbor'}
                  </Button>
                </>
              ) : null}
              {attachmentFile && <Chip label={`${attachmentFile.name} (${Math.round(attachmentFile.size / 1024)} kB)`} />}
              {attachmentError && <Alert severity="warning">{attachmentError}</Alert>}
              {fileAnalyzeError && <Alert severity="error">{fileAnalyzeError}</Alert>}
              {fileResult?.contextAnalysis && (
                <Alert severity="info">
                  Typ dokumentu: <strong>{fileResult.contextAnalysis.documentType}</strong> ({fileResult.contextAnalysis.confidence})
                  <br />
                  {fileResult.contextAnalysis.summary}
                </Alert>
              )}
              {fileResult?.examAnalysis && (
                <Alert severity="info">
                  AI analýza vyšetrenia (<strong>{fileResult.examAnalysis.examType}</strong>)
                  <AiFormattedText text={fileResult.examAnalysis.analysis} />
                </Alert>
              )}
              {fileResult?.examAnalysis && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Uložiť AI výsledok ako lekársky záznam
                    </Typography>
                    <Stack spacing={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        Po kontrole AI výsledku môžete jedným klikom pridať záznam priamo do dashboard timeline.
                      </Typography>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                        <TextField
                          fullWidth
                          label="Dátum záznamu"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={aiRecordDraft.date}
                          onChange={(e) => setAiRecordDraft((prev) => ({ ...prev, date: e.target.value }))}
                        />
                        <TextField
                          fullWidth
                          required
                          label="Klinika / veterinár"
                          value={aiRecordDraft.clinicName}
                          onChange={(e) => setAiRecordDraft((prev) => ({ ...prev, clinicName: e.target.value }))}
                        />
                      </Stack>
                      <TextField
                        label="Diagnóza (voliteľné)"
                        value={aiRecordDraft.diagnosis}
                        onChange={(e) => setAiRecordDraft((prev) => ({ ...prev, diagnosis: e.target.value }))}
                      />
                      <TextField
                        label="Odporúčanie (voliteľné)"
                        value={aiRecordDraft.recommendations}
                        onChange={(e) => setAiRecordDraft((prev) => ({ ...prev, recommendations: e.target.value }))}
                      />
                      {aiDetectedRecords.length > 0 && (
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                              AI rozpoznané záznamy (vyberte kam sa majú uložiť)
                            </Typography>
                            <Stack spacing={1.25}>
                              {aiDetectedRecords.map((item) => (
                                <Box key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1 }}>
                                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                    <FormControl fullWidth size="small">
                                      <InputLabel>Typ záznamu</InputLabel>
                                      <Select
                                        label="Typ záznamu"
                                        value={item.targetType}
                                        onChange={(e) => {
                                          const nextType = e.target.value as AiDetectedRecordType;
                                          setAiDetectedRecords((prev) => prev.map((entry) => (
                                            entry.id === item.id ? { ...entry, targetType: nextType } : entry
                                          )));
                                        }}
                                      >
                                        <MenuItem value="VACCINATION">Očkovanie</MenuItem>
                                        <MenuItem value="DEWORMING">Odčervenie</MenuItem>
                                        <MenuItem value="ECTOPARASITE">Antiparazitikum</MenuItem>
                                        <MenuItem value="MEDICATION">Liek / tabletka</MenuItem>
                                        <MenuItem value="NOTE">Iba poznámka návštevy</MenuItem>
                                        <MenuItem value="SKIP">Neukladať</MenuItem>
                                      </Select>
                                    </FormControl>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      label="Názov prípravku"
                                      value={item.productName}
                                      onChange={(e) => {
                                        const nextName = e.target.value;
                                        setAiDetectedRecords((prev) => prev.map((entry) => (
                                          entry.id === item.id ? { ...entry, productName: nextName } : entry
                                        )));
                                      }}
                                    />
                                  </Stack>
                                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
                                    <TextField
                                      size="small"
                                      label="Dátum"
                                      type="date"
                                      InputLabelProps={{ shrink: true }}
                                      value={item.date}
                                      onChange={(e) => {
                                        const nextDate = e.target.value;
                                        setAiDetectedRecords((prev) => prev.map((entry) => (
                                          entry.id === item.id ? { ...entry, date: nextDate } : entry
                                        )));
                                      }}
                                    />
                                    <TextField
                                      size="small"
                                      label="Platnosť do"
                                      type="date"
                                      InputLabelProps={{ shrink: true }}
                                      value={item.validUntil}
                                      onChange={(e) => {
                                        const nextDate = e.target.value;
                                        setAiDetectedRecords((prev) => prev.map((entry) => (
                                          entry.id === item.id ? { ...entry, validUntil: nextDate } : entry
                                        )));
                                      }}
                                    />
                                    <TextField
                                      size="small"
                                      label="Šarža"
                                      value={item.batchNumber}
                                      onChange={(e) => {
                                        const nextBatch = e.target.value;
                                        setAiDetectedRecords((prev) => prev.map((entry) => (
                                          entry.id === item.id ? { ...entry, batchNumber: nextBatch } : entry
                                        )));
                                      }}
                                    />
                                  </Stack>
                                  <Chip
                                    size="small"
                                    sx={{ mt: 1 }}
                                    label={`AI istota: ${item.sourceConfidence}`}
                                    color={item.sourceConfidence === 'high' ? 'success' : item.sourceConfidence === 'medium' ? 'warning' : 'default'}
                                  />
                                </Box>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>
                      )}
                      <Button
                        variant="contained"
                        onClick={saveAiRecord}
                        disabled={!canCreateAiRecord}
                      >
                        Pridať AI záznam do dashboardu
                      </Button>
                      {aiRecordFeedback && <Alert severity="success">{aiRecordFeedback}</Alert>}
                    </Stack>
                  </CardContent>
                </Card>
              )}
              {fileResult?.healthPassportInterpretation && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Detailný rozbor zdravotného pasu (AI)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {fileResult.healthPassportInterpretation.summary}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                      Ako to AI chápe: {fileResult.healthPassportInterpretation.aiUnderstanding}
                    </Typography>
                    <Stack spacing={1}>
                      {fileResult.healthPassportInterpretation.vaccinations.map((vac, index) => (
                        <Box key={`${vac.vaccineName}-${vac.dateAdministered}-${index}`} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {vac.disease || 'Nešpecifikované ochorenie'}
                          </Typography>
                          <Typography variant="caption" display="block">Vakcína: {vac.vaccineName || 'neznáme'}</Typography>
                          <Typography variant="caption" display="block">Podané: {vac.dateAdministered || 'neznámy dátum'}</Typography>
                          {vac.validUntil && <Typography variant="caption" display="block">Platnosť do: {vac.validUntil}</Typography>}
                          {vac.batchNumber && <Typography variant="caption" display="block">Šarža: {vac.batchNumber}</Typography>}
                          {vac.manufacturer && <Typography variant="caption" display="block">Výrobca: {vac.manufacturer}</Typography>}
                          {vac.veterinarian && <Typography variant="caption" display="block">Veterinár/klinika: {vac.veterinarian}</Typography>}
                          {vac.notes && <Typography variant="caption" display="block">Poznámka: {vac.notes}</Typography>}
                          <Chip size="small" sx={{ mt: 0.5 }} label={`Istota AI: ${vac.confidence}`} color={vac.confidence === 'high' ? 'success' : vac.confidence === 'medium' ? 'warning' : 'default'} />
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Stack>
          )}
          {wizardStep === 1 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Výdavky a ďalšia návšteva</Typography>
              <TextField label="Ďalšia kontrola" type="date" InputLabelProps={{ shrink: true }} value={wizard.nextCheckDate} onChange={(e) => setWizard({ ...wizard, nextCheckDate: e.target.value })} />
              <TextField label="Výdavok návštevy" type="number" value={wizard.totalExpense} onChange={(e) => setWizard({ ...wizard, totalExpense: e.target.value })} />
              <TextField label="Výdavok lieky" type="number" value={wizard.extraMedicationExpense} onChange={(e) => setWizard({ ...wizard, extraMedicationExpense: e.target.value })} />
              <TextField label="Výdavok krmivo" type="number" value={wizard.extraFoodExpense} onChange={(e) => setWizard({ ...wizard, extraFoodExpense: e.target.value })} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWizardOpen(false)}>Zrušiť</Button>
          {wizardStep > 0 && <Button onClick={() => setWizardStep((s) => s - 1)}>Späť</Button>}
          {wizardStep < 1
            ? <Button variant="contained" onClick={() => setWizardStep((s) => s + 1)} disabled={!canProceedWizard}>Pokračovať</Button>
            : <Button variant="contained" onClick={saveWizard} disabled={!canProceedWizard}>Uložiť všetko</Button>}
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(selectedVisitId && selectedVisit)}
        onClose={() => {
          setSelectedVisitId(null);
          setIsEditingVisit(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detail veterinárneho záznamu</DialogTitle>
        <DialogContent>
          {!selectedVisit ? null : (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <TextField
                label="Dátum"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={visitDraft.date}
                onChange={(e) => setVisitDraft((prev) => ({ ...prev, date: e.target.value }))}
                disabled={!isEditingVisit}
              />
              <TextField
                label="Klinika"
                value={visitDraft.clinicName}
                onChange={(e) => setVisitDraft((prev) => ({ ...prev, clinicName: e.target.value }))}
                disabled={!isEditingVisit}
              />
              <TextField
                label="Veterinár (voliteľné)"
                value={visitDraft.vetName}
                onChange={(e) => setVisitDraft((prev) => ({ ...prev, vetName: e.target.value }))}
                disabled={!isEditingVisit}
              />
              <TextField
                label="Dôvod návštevy"
                value={visitDraft.reason}
                onChange={(e) => setVisitDraft((prev) => ({ ...prev, reason: e.target.value }))}
                disabled={!isEditingVisit}
              />
              <TextField
                label="Nález"
                multiline
                minRows={3}
                value={visitDraft.findings}
                onChange={(e) => setVisitDraft((prev) => ({ ...prev, findings: e.target.value }))}
                disabled={!isEditingVisit}
              />
              <TextField
                label="Diagnóza"
                value={visitDraft.diagnosis}
                onChange={(e) => setVisitDraft((prev) => ({ ...prev, diagnosis: e.target.value }))}
                disabled={!isEditingVisit}
              />
              <TextField
                label="Odporúčania"
                multiline
                minRows={2}
                value={visitDraft.recommendations}
                onChange={(e) => setVisitDraft((prev) => ({ ...prev, recommendations: e.target.value }))}
                disabled={!isEditingVisit}
              />
              <TextField
                label="Ďalšia kontrola"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={visitDraft.nextCheckDate}
                onChange={(e) => setVisitDraft((prev) => ({ ...prev, nextCheckDate: e.target.value }))}
                disabled={!isEditingVisit}
              />
              {selectedVisit.aiExamType && (
                <Alert severity="info">Zdroj AI záznamu: {selectedVisit.aiExamType}</Alert>
              )}
              {selectedVisit.aiExtractedText && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Originál extrahovaný text zo súboru
                    </Typography>
                    <TextField
                      multiline
                      fullWidth
                      minRows={6}
                      value={selectedVisit.aiExtractedText}
                      InputProps={{ readOnly: true }}
                    />
                  </CardContent>
                </Card>
              )}
              {selectedVisit.attachments?.length ? (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Prílohy
                    </Typography>
                    <Stack spacing={0.5}>
                      {selectedVisit.attachments.map((attachment) => (
                        <Typography key={attachment.id} variant="body2">
                          • {attachment.label} {attachment.fileName ? `(${attachment.fileName})` : ''}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            onClick={deleteSelectedVisit}
          >
            Zmazať
          </Button>
          <Button
            onClick={() => setSelectedVisitId(null)}
          >
            Zavrieť
          </Button>
          {!isEditingVisit ? (
            <Button variant="outlined" onClick={() => setIsEditingVisit(true)}>
              Editovať
            </Button>
          ) : (
            <Button variant="contained" onClick={saveVisitDetail}>
              Uložiť zmeny
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(selectedTimelineRecord)}
        onClose={() => {
          setSelectedTimelineRecord(null);
          setIsEditingTimelineRecord(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detail záznamu</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {selectedTimelineRecord?.type === 'VACCINATION' && selectedVaccination && (
              <>
                <TextField label="Názov vakcíny" value={vaccinationDraft.name} onChange={(e) => setVaccinationDraft((prev) => ({ ...prev, name: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <FormControl disabled={!isEditingTimelineRecord}>
                  <InputLabel>Typ vakcíny</InputLabel>
                  <Select value={vaccinationDraft.type} label="Typ vakcíny" onChange={(e) => setVaccinationDraft((prev) => ({ ...prev, type: e.target.value as any }))}>
                    <MenuItem value="RABIES">RABIES</MenuItem>
                    <MenuItem value="COMBINED">COMBINED</MenuItem>
                    <MenuItem value="OTHER">OTHER</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Dátum podania" type="date" InputLabelProps={{ shrink: true }} value={vaccinationDraft.dateApplied} onChange={(e) => setVaccinationDraft((prev) => ({ ...prev, dateApplied: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Platnosť do" type="date" InputLabelProps={{ shrink: true }} value={vaccinationDraft.validUntil} onChange={(e) => setVaccinationDraft((prev) => ({ ...prev, validUntil: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Šarža (voliteľné)" value={vaccinationDraft.batchNumber} onChange={(e) => setVaccinationDraft((prev) => ({ ...prev, batchNumber: e.target.value }))} disabled={!isEditingTimelineRecord} />
              </>
            )}

            {selectedTimelineRecord?.type === 'DEWORMING' && selectedDeworming && (
              <>
                <TextField label="Produkt" value={dewormingDraft.productName} onChange={(e) => setDewormingDraft((prev) => ({ ...prev, productName: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Dátum podania" type="date" InputLabelProps={{ shrink: true }} value={dewormingDraft.dateGiven} onChange={(e) => setDewormingDraft((prev) => ({ ...prev, dateGiven: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Platné do" type="date" InputLabelProps={{ shrink: true }} value={dewormingDraft.nextDueDate} onChange={(e) => setDewormingDraft((prev) => ({ ...prev, nextDueDate: e.target.value }))} disabled={!isEditingTimelineRecord} />
              </>
            )}

            {selectedTimelineRecord?.type === 'ECTOPARASITE' && selectedEcto && (
              <>
                <TextField label="Produkt" value={ectoDraft.productName} onChange={(e) => setEctoDraft((prev) => ({ ...prev, productName: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <FormControl disabled={!isEditingTimelineRecord}>
                  <InputLabel>Forma</InputLabel>
                  <Select value={ectoDraft.form} label="Forma" onChange={(e) => setEctoDraft((prev) => ({ ...prev, form: e.target.value as any }))}>
                    <MenuItem value="TABLET">tablet</MenuItem>
                    <MenuItem value="SPOT_ON">spotOn</MenuItem>
                    <MenuItem value="COLLAR">collar</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Dátum podania" type="date" InputLabelProps={{ shrink: true }} value={ectoDraft.dateGiven} onChange={(e) => setEctoDraft((prev) => ({ ...prev, dateGiven: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Platné do" type="date" InputLabelProps={{ shrink: true }} value={ectoDraft.nextDueDate} onChange={(e) => setEctoDraft((prev) => ({ ...prev, nextDueDate: e.target.value }))} disabled={!isEditingTimelineRecord} />
              </>
            )}

            {selectedTimelineRecord?.type === 'MEDICATION' && selectedMedication && (
              <>
                <TextField label="Názov lieku" value={medicationDraft.name} onChange={(e) => setMedicationDraft((prev) => ({ ...prev, name: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Dôvod" value={medicationDraft.reason} onChange={(e) => setMedicationDraft((prev) => ({ ...prev, reason: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Dávkovanie" value={medicationDraft.dose} onChange={(e) => setMedicationDraft((prev) => ({ ...prev, dose: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Frekvencia" value={medicationDraft.frequency} onChange={(e) => setMedicationDraft((prev) => ({ ...prev, frequency: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Začiatok" type="date" InputLabelProps={{ shrink: true }} value={medicationDraft.startDate} onChange={(e) => setMedicationDraft((prev) => ({ ...prev, startDate: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Koniec (voliteľné)" type="date" InputLabelProps={{ shrink: true }} value={medicationDraft.endDate} onChange={(e) => setMedicationDraft((prev) => ({ ...prev, endDate: e.target.value }))} disabled={!isEditingTimelineRecord} />
              </>
            )}

            {selectedTimelineRecord?.type === 'DIET' && selectedDiet && (
              <>
                <TextField label="Krmivo" value={dietDraft.foodName} onChange={(e) => setDietDraft((prev) => ({ ...prev, foodName: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Začiatok diéty" type="date" InputLabelProps={{ shrink: true }} value={dietDraft.startedAt} onChange={(e) => setDietDraft((prev) => ({ ...prev, startedAt: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Koniec diéty (voliteľné)" type="date" InputLabelProps={{ shrink: true }} value={dietDraft.endedAt} onChange={(e) => setDietDraft((prev) => ({ ...prev, endedAt: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <FormControl disabled={!isEditingTimelineRecord}>
                  <InputLabel>Hodnotenie</InputLabel>
                  <Select value={dietDraft.suitabilityStatus} label="Hodnotenie" onChange={(e) => setDietDraft((prev) => ({ ...prev, suitabilityStatus: e.target.value as any }))}>
                    <MenuItem value="SUITABLE">SUITABLE</MenuItem>
                    <MenuItem value="RISKY">RISKY</MenuItem>
                    <MenuItem value="UNSUITABLE">UNSUITABLE</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Reakcia" value={dietDraft.reactionNotes} onChange={(e) => setDietDraft((prev) => ({ ...prev, reactionNotes: e.target.value }))} disabled={!isEditingTimelineRecord} />
              </>
            )}

            {selectedTimelineRecord?.type === 'EXPENSE' && selectedExpense && (
              <>
                <TextField label="Dátum" type="date" InputLabelProps={{ shrink: true }} value={expenseDraft.date} onChange={(e) => setExpenseDraft((prev) => ({ ...prev, date: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Suma" type="number" value={expenseDraft.amount} onChange={(e) => setExpenseDraft((prev) => ({ ...prev, amount: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <TextField label="Mena" value={expenseDraft.currency} onChange={(e) => setExpenseDraft((prev) => ({ ...prev, currency: e.target.value }))} disabled={!isEditingTimelineRecord} />
                <FormControl disabled={!isEditingTimelineRecord}>
                  <InputLabel>Kategória</InputLabel>
                  <Select value={expenseDraft.category} label="Kategória" onChange={(e) => setExpenseDraft((prev) => ({ ...prev, category: e.target.value as ExpenseCategory }))}>
                    <MenuItem value="VET_VISIT">VET_VISIT</MenuItem>
                    <MenuItem value="MEDICATION">MEDICATION</MenuItem>
                    <MenuItem value="FOOD">FOOD</MenuItem>
                    <MenuItem value="OTHER">OTHER</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Poznámka" value={expenseDraft.note} onChange={(e) => setExpenseDraft((prev) => ({ ...prev, note: e.target.value }))} disabled={!isEditingTimelineRecord} />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={deleteTimelineRecord}>Zmazať</Button>
          <Button onClick={() => setSelectedTimelineRecord(null)}>Zavrieť</Button>
          {!isEditingTimelineRecord ? (
            <Button variant="outlined" onClick={() => setIsEditingTimelineRecord(true)}>Editovať</Button>
          ) : (
            <Button variant="contained" onClick={saveTimelineRecordDetail}>Uložiť zmeny</Button>
          )}
        </DialogActions>
      </Dialog>

      {dog && (
        <Alert severity="info" sx={{ mt: 2 }}>
          API vrstva pre tieto dáta je navrhnutá v dokumentácii, aktuálne je implementované lokálne ukladanie (localStorage) ako MVP UI prototyp.
        </Alert>
      )}
    </Box>
  );
}
