import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Card, Snackbar, Stack, Typography, useTheme } from '@mui/material';
import {
  Add as AddIcon,
  Badge as BadgeIcon,
  HealthAndSafety as VaccinationIcon,
  MonitorWeight as WeightIcon,
  Pets as PetsIcon,
  PestControl as DewormingIcon,
  RamenDining as DietIcon,
  Vaccines as VaccinesIcon,
  Biotech as BiotechIcon,
  Healing as HealingIcon,
  MedicalServices as ExamIcon,
  MonitorHeart as ConditionIcon,
} from '@mui/icons-material';

import type {
  DietEntry,
  EctoparasiteRecord,
  ExpenseCategory,
  TimelineEvent,
  TreatmentRecord,
  ValidityStatus,
  VaccinationRecord,
  VaccineType,
  VetVisitRecord,
} from '../types/petHealth';

import { useActivePet } from '../hooks/useActivePet';
import { useHealthData } from '../hooks/useHealthData';
import { usePetProfiles } from '../hooks/usePetProfiles';
import { usePetPhotoUpload, validatePetPhotoFile } from '../hooks/usePetPhotoUpload';
import { useConfirm } from '../hooks/useConfirm';
import { relativeDate, formatDateShort } from '../utils/relativeDate';
import type { VisitBundle } from '../utils/vetVisitHelper';

// Sub-components
import FeatureIntro from '../components/FeatureIntro';
import PageContainer from '../components/ui/PageContainer';
import PassportHero, { type HeroInfoCard } from '../components/healthPassport/PassportHero';
import PetPhotoAdjustDialog from '../components/PetPhotoAdjustDialog';
import HealthOverviewDashboard from '../components/healthPassport/HealthOverviewDashboard';
import type { HealthMetricTile } from '../components/healthPassport/HealthTile';
import { VACCINE_TYPE_ORDER } from '../utils/vaccineTypes';
import PawlyInsightCard from '../components/healthPassport/PawlyInsightCard';
import UpcomingRemindersCard, {
  type UpcomingReminderItem,
} from '../components/healthPassport/UpcomingRemindersCard';
import ExpenseSummaryCard from '../components/healthPassport/ExpenseSummaryCard';
import HealthTimeline from '../components/healthPassport/HealthTimeline';
import AddRecord from '../components/healthPassport/AddRecord';
import QuickVisitButton from '../components/healthPassport/QuickVisitButton';
import VisitDetailDialog from '../components/healthPassport/VisitDetailDialog';
import WeightTrendCard from '../components/healthPassport/WeightTrendCard';
import TimelineRecordDetailDialog from '../components/healthPassport/TimelineRecordDetailDialog';
import type { RecordDetailState } from '../components/healthPassport/TimelineRecordDetailDialog';
import CategoryHistoryDialog, {
  type CategoryHistoryEntry,
} from '../components/healthPassport/CategoryHistoryDialog';

// Utilities and types
import {
  statusByDate,
  computeHealthScore,
  computeIntervalDaysFromDates,
  escapeHtml,
} from '../components/healthPassport/utils';

// Koľko dní dopredu považujeme expiráciu vakcíny za blížiacu sa pripomienku.
// Dosť času objednať sa na preočkovanie; expirácie ďalej v budúcnosti sú na
// dlaždici Očkovanie a na timeline, nie medzi pripomienkami.
const VACCINE_REMINDER_HORIZON_DAYS = 60;

// Prehľad je súhrn, nie log — najnovšie vyšetrenia ako dlaždice, zvyšok v histórii/timeline.
const EXAM_TILE_LIMIT = 6;

export default function HealthPassportPage() {
  const { t, i18n } = useTranslation('healthPassport');
  const { t: tCommon } = useTranslation('common');
  const lang = i18n.language === 'en' ? 'en-US' : 'sk-SK';
  const theme = useTheme();
  const navigate = useNavigate();
  // ── Dog selection (shared via useActivePet) ────────────────────────────────
  const {
    petProfiles: dogProfiles,
    activePetId: selectedDogId,
    selectPet: setSelectedDogId,
    loading: petsLoading,
  } = useActivePet();

  // ── Health records (Supabase cez useHealthData) ─────────────────────────────
  const {
    vaccinations,
    dewormings,
    ectos,
    treatments,
    visits,
    medications,
    dietEntries,
    expenses,
    episodes,
    weightLogs,
    addVisitBundle,
    addTreatment,
    addVisit,
    updateVisit,
    removeVisit,
    updateVaccination,
    updateDeworming,
    updateEcto,
    updateTreatment,
    updateMedication,
    updateDietEntry,
    updateExpense,
    removeVaccination,
    removeDeworming,
    removeEcto,
    removeTreatment,
    removeDietEntry,
    removeExpense,
    removeMedication,
  } = useHealthData();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const { updateProfile } = usePetProfiles();
  const { uploadCropped: uploadPhotoCropped, uploading: photoUploading } = usePetPhotoUpload();

  // ── Filtered by dog ────────────────────────────────────────────────────────
  const dogVaccinations = vaccinations.filter((v) => v.petId === selectedDogId);
  const dogDewormings = dewormings.filter((v) => v.petId === selectedDogId);
  const dogEctos = ectos.filter((v) => v.petId === selectedDogId);
  const dogTreatments = treatments.filter((v) => v.petId === selectedDogId);
  const dogVisits = visits.filter((v) => v.petId === selectedDogId);
  const dogMeds = medications.filter((v) => v.petId === selectedDogId);
  const dogDiet = dietEntries.filter((v) => v.petId === selectedDogId);
  const dogExpenses = expenses.filter((v) => v.petId === selectedDogId);

  const latestDietId = [...dogDiet].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]?.id;

  const currentDiet = [...dogDiet].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

  // ── Latest records per domain (for metric cards) ───────────────────────────
  // Sort by date administered (dateApplied / dateGiven), nie validUntil — historický
  // import s pomýleným validUntil by inak prebil reálne novší záznam.
  const latestVaccineByType = useMemo(() => {
    const map = new Map<VaccineType, VaccinationRecord>();
    [...dogVaccinations]
      .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))
      .forEach((v) => {
        if (!map.has(v.type)) map.set(v.type, v);
      });
    return map;
  }, [dogVaccinations]);

  // „Najurgentnejšia" vakcína = najskôr expirujúca (bez validUntil ide na koniec).
  // Dlaždica Očkovanie tak ukazuje konkrétnu vakcínu, ktorá potrebuje pozornosť,
  // nie náhodne poslednú zadanú — pes má vakcín viac, každú s vlastnou platnosťou.
  const urgentVaccination = useMemo(() => {
    const records = [...latestVaccineByType.values()];
    return records.sort((a, b) => {
      if (!a.validUntil) return 1;
      if (!b.validUntil) return -1;
      return a.validUntil.localeCompare(b.validUntil);
    })[0];
  }, [latestVaccineByType]);
  const latestDeworming = useMemo(
    () => [...dogDewormings].sort((a, b) => b.dateGiven.localeCompare(a.dateGiven))[0],
    [dogDewormings]
  );
  const latestEcto = useMemo(
    () => [...dogEctos].sort((a, b) => b.dateGiven.localeCompare(a.dateGiven))[0],
    [dogEctos]
  );

  // ── Status semaphores ──────────────────────────────────────────────────────
  const vaccinationStatus = urgentVaccination
    ? statusByDate(urgentVaccination.validUntil, 30)
    : 'UNKNOWN';

  const dewormingStatus = latestDeworming
    ? statusByDate(latestDeworming.nextDueDate, 7)
    : 'UNKNOWN';
  const ectoStatus = latestEcto ? statusByDate(latestEcto.nextDueDate, 7) : 'UNKNOWN';

  // ── Timeline ───────────────────────────────────────────────────────────────
  const timeline: TimelineEvent[] = useMemo(() => {
    const items: TimelineEvent[] = [];
    dogVaccinations.forEach((v) =>
      items.push({
        id: `vac-${v.id}`,
        petId: v.petId,
        type: 'VACCINATION',
        title: t('timeline.titleVaccination', { name: v.name }),
        subtitle: v.validUntil
          ? t('timeline.subtitleValidUntil', { date: v.validUntil })
          : undefined,
        date: v.dateApplied,
      })
    );
    dogDewormings.forEach((v) =>
      items.push({
        id: `dew-${v.id}`,
        petId: v.petId,
        type: 'DEWORMING',
        title: t('timeline.titleDeworming', { product: v.productName }),
        subtitle: v.nextDueDate
          ? t('timeline.subtitleNextDue', { date: v.nextDueDate })
          : undefined,
        date: v.dateGiven,
      })
    );
    dogEctos.forEach((v) =>
      items.push({
        id: `ect-${v.id}`,
        petId: v.petId,
        type: 'ECTOPARASITE',
        title: t('timeline.titleEcto', { product: v.productName }),
        subtitle: v.nextDueDate
          ? t('timeline.subtitleNextDue', { date: v.nextDueDate })
          : undefined,
        date: v.dateGiven,
      })
    );
    dogTreatments.forEach((v) =>
      items.push({
        id: `trt-${v.id}`,
        petId: v.petId,
        type: 'TREATMENT',
        title: t('timeline.titleTreatment', { name: v.name }),
        subtitle: v.nextDueDate
          ? t('timeline.subtitleNextDue', { date: v.nextDueDate })
          : undefined,
        date: v.dateGiven,
        createdAt: v.createdAt,
      })
    );
    dogVisits.forEach((v) =>
      items.push({
        id: `visit-${v.id}`,
        petId: v.petId,
        type: 'VET_VISIT',
        title: t('timeline.titleVisit', { clinic: v.clinicName }),
        subtitle: v.reason,
        date: v.date,
      })
    );
    dogMeds.forEach((v) =>
      items.push({
        id: `med-${v.id}`,
        petId: v.petId,
        type: 'MEDICATION',
        title: t('timeline.titleMedication', { name: v.name }),
        subtitle: `${v.dose}, ${v.frequency}`,
        date: v.startDate,
      })
    );
    dogDiet.forEach((v) =>
      items.push({
        id: `diet-${v.id}`,
        petId: v.petId,
        type: 'DIET',
        title: t('timeline.titleDiet', { food: v.foodName }),
        subtitle: v.suitabilityStatus,
        date: v.startedAt,
      })
    );
    dogExpenses.forEach((v) =>
      items.push({
        id: `exp-${v.id}`,
        petId: v.petId,
        type: 'EXPENSE',
        title: t('timeline.titleExpense', { amount: v.amount.toFixed(2) }),
        subtitle: v.category,
        date: v.date,
      })
    );
    return items.sort(
      (a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    );
  }, [
    dogVaccinations,
    dogDewormings,
    dogEctos,
    dogTreatments,
    dogVisits,
    dogMeds,
    dogDiet,
    dogExpenses,
    t,
  ]);

  // ── Wizard / dialog state ──────────────────────────────────────────────────
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<RecordDetailState | null>(null);
  const [historyCategory, setHistoryCategory] = useState<
    'VACCINATION' | 'DEWORMING' | 'ECTOPARASITE' | 'TREATMENT' | null
  >(null);

  const vaccinationHistory = useMemo<CategoryHistoryEntry[]>(
    () =>
      dogVaccinations.map((v) => ({
        id: v.id,
        date: v.dateApplied,
        product: v.name,
        meta: v.validUntil ? `${t('detail.validUntil')}: ${v.validUntil}` : undefined,
        note: v.note,
      })),
    [dogVaccinations, t]
  );
  const dewormingHistory = useMemo<CategoryHistoryEntry[]>(
    () =>
      dogDewormings.map((d) => ({
        id: d.id,
        date: d.dateGiven,
        product: d.productName,
        meta: d.nextDueDate ? `${t('detail.nextDue')}: ${d.nextDueDate}` : undefined,
        note: d.note,
      })),
    [dogDewormings, t]
  );
  const ectoHistory = useMemo<CategoryHistoryEntry[]>(
    () =>
      dogEctos.map((e) => ({
        id: e.id,
        date: e.dateGiven,
        product: e.productName,
        meta: e.nextDueDate ? `${t('detail.nextDue')}: ${e.nextDueDate}` : undefined,
        note: e.note,
      })),
    [dogEctos, t]
  );
  const treatmentHistory = useMemo<CategoryHistoryEntry[]>(
    () =>
      dogTreatments.map((trt) => ({
        id: trt.id,
        date: trt.dateGiven,
        product: `${t(`treatmentCategories.${trt.category}`)} · ${trt.name}`,
        meta: trt.nextDueDate ? `${t('detail.nextDue')}: ${trt.nextDueDate}` : undefined,
        note: trt.note,
      })),
    [dogTreatments, t]
  );
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>(
    {
      open: false,
      msg: '',
      severity: 'success',
    }
  );

  const dispatchBundle = useCallback(
    (bundle: VisitBundle) => {
      void addVisitBundle(bundle);
    },
    [addVisitBundle]
  );

  const handleQuickVisitCreate = useCallback(
    (visit: VetVisitRecord) => addVisit(visit),
    [addVisit]
  );
  const handleQuickVisitUndo = useCallback((id: string) => removeVisit(id), [removeVisit]);

  const handleHeroPhoto = useCallback(
    (file: File) => {
      if (validatePetPhotoFile(file)) {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
        return;
      }
      setPendingPhotoFile(file);
    },
    [tCommon]
  );

  const handleHeroPhotoConfirm = useCallback(
    async (dataUrl: string, mimeType: string) => {
      const url = await uploadPhotoCropped(dataUrl, mimeType);
      if (!url) {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
        return;
      }
      try {
        await updateProfile(selectedDogId, { photoUrl: url });
        setPendingPhotoFile(null);
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [uploadPhotoCropped, updateProfile, selectedDogId, tCommon]
  );

  const handleHeroPhotoRemove = useCallback(async () => {
    try {
      await updateProfile(selectedDogId, { photoUrl: null });
      setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
    } catch {
      setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
    }
  }, [updateProfile, selectedDogId, tCommon]);

  // ── Timeline open detail ────────────────────────────────────────────────────
  const handleOpenDetail = useCallback((event: TimelineEvent) => {
    if (event.type === 'VET_VISIT') {
      setSelectedVisitId(event.id.replace('visit-', ''));
    } else {
      const recordId = event.id.replace(/^[^-]+-/, '');
      setSelectedRecord({ id: recordId, type: event.type as RecordDetailState['type'] });
    }
  }, []);

  // ── Visit save/delete ───────────────────────────────────────────────────────
  const handleSaveVisit = useCallback(
    async (draft: Parameters<React.ComponentProps<typeof VisitDetailDialog>['onSave']>[0]) => {
      if (!selectedVisitId) return;
      try {
        await updateVisit(selectedVisitId, {
          date: draft.date,
          clinicName: draft.clinicName,
          vetName: draft.vetName.trim() || undefined,
          reason: draft.reason,
          findings: draft.findings.trim() || undefined,
          diagnosis: draft.diagnosis.trim() || undefined,
          recommendations: draft.recommendations.trim() || undefined,
          nextCheckDate: draft.nextCheckDate || undefined,
          examResult: draft.examResult || undefined,
        });
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [selectedVisitId, updateVisit, tCommon]
  );

  const handleDeleteVisit = useCallback(async () => {
    if (!selectedVisitId) return;
    const ok = await confirm({
      title: tCommon('actions.confirmDeleteRecordTitle'),
      message: tCommon('actions.confirmDeleteRecordMessage'),
      confirmLabel: tCommon('actions.delete'),
      danger: true,
    });
    if (!ok) return;
    void removeVisit(selectedVisitId);
    setSelectedVisitId(null);
  }, [selectedVisitId, removeVisit, confirm, tCommon]);

  // ── Record save handlers ────────────────────────────────────────────────────
  const handleSaveVaccination = useCallback(
    async (
      id: string,
      draft: {
        name: string;
        type: VaccinationRecord['type'];
        dateApplied: string;
        validUntil: string;
        batchNumber: string;
        note: string;
      }
    ) => {
      try {
        await updateVaccination(id, {
          ...draft,
          batchNumber: draft.batchNumber || undefined,
          note: draft.note || undefined,
        });
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [updateVaccination, tCommon]
  );

  const handleSaveDeworming = useCallback(
    async (
      id: string,
      draft: { productName: string; dateGiven: string; nextDueDate: string; note: string }
    ) => {
      try {
        await updateDeworming(id, {
          ...draft,
          note: draft.note || undefined,
          intervalDays: computeIntervalDaysFromDates(draft.dateGiven, draft.nextDueDate, 90),
        });
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [updateDeworming, tCommon]
  );

  const handleSaveEcto = useCallback(
    async (
      id: string,
      draft: {
        productName: string;
        form: EctoparasiteRecord['form'];
        dateGiven: string;
        nextDueDate: string;
        note: string;
      }
    ) => {
      try {
        await updateEcto(id, {
          ...draft,
          note: draft.note || undefined,
          intervalDays: computeIntervalDaysFromDates(draft.dateGiven, draft.nextDueDate, 30),
        });
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [updateEcto, tCommon]
  );

  const handleSaveTreatment = useCallback(
    async (
      id: string,
      draft: {
        category: TreatmentRecord['category'];
        name: string;
        form: NonNullable<TreatmentRecord['form']>;
        dateGiven: string;
        nextDueDate: string;
        note: string;
      }
    ) => {
      try {
        await updateTreatment(id, {
          ...draft,
          note: draft.note || undefined,
          intervalDays: draft.nextDueDate
            ? computeIntervalDaysFromDates(draft.dateGiven, draft.nextDueDate, 28)
            : undefined,
        });
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [updateTreatment, tCommon]
  );

  const handleAddTreatment = useCallback(
    async (payload: Partial<TreatmentRecord>) => {
      try {
        await addTreatment(payload);
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [addTreatment, tCommon]
  );

  const handleSaveMedication = useCallback(
    async (
      id: string,
      draft: {
        name: string;
        reason: string;
        dose: string;
        frequency: string;
        startDate: string;
        endDate: string;
      }
    ) => {
      try {
        await updateMedication(id, { ...draft, endDate: draft.endDate || undefined });
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [updateMedication, tCommon]
  );

  const handleSaveDiet = useCallback(
    async (
      id: string,
      draft: {
        foodName: string;
        startedAt: string;
        endedAt: string;
        reactionNotes: string;
        suitabilityStatus: DietEntry['suitabilityStatus'];
      }
    ) => {
      try {
        await updateDietEntry(id, {
          ...draft,
          endedAt: draft.endedAt || undefined,
          reactionNotes: draft.reactionNotes || undefined,
        });
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [updateDietEntry, tCommon]
  );

  const handleSaveExpense = useCallback(
    async (
      id: string,
      draft: {
        date: string;
        amount: string;
        currency: string;
        category: ExpenseCategory;
        note: string;
      }
    ) => {
      try {
        await updateExpense(id, {
          ...draft,
          amount: Number(draft.amount || 0),
          note: draft.note || undefined,
        });
        setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
      } catch {
        setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
      }
    },
    [updateExpense, tCommon]
  );

  const handleDeleteRecord = useCallback(async () => {
    if (!selectedRecord) return;
    const ok = await confirm({
      title: tCommon('actions.confirmDeleteRecordTitle'),
      message: tCommon('actions.confirmDeleteRecordMessage'),
      confirmLabel: tCommon('actions.delete'),
      danger: true,
    });
    if (!ok) return;
    if (selectedRecord.type === 'VACCINATION') void removeVaccination(selectedRecord.id);
    else if (selectedRecord.type === 'DEWORMING') void removeDeworming(selectedRecord.id);
    else if (selectedRecord.type === 'ECTOPARASITE') void removeEcto(selectedRecord.id);
    else if (selectedRecord.type === 'TREATMENT') void removeTreatment(selectedRecord.id);
    else if (selectedRecord.type === 'MEDICATION') void removeMedication(selectedRecord.id);
    else if (selectedRecord.type === 'DIET') void removeDietEntry(selectedRecord.id);
    else if (selectedRecord.type === 'EXPENSE') void removeExpense(selectedRecord.id);
    setSelectedRecord(null);
  }, [
    selectedRecord,
    removeVaccination,
    removeDeworming,
    removeEcto,
    removeTreatment,
    removeMedication,
    removeDietEntry,
    removeExpense,
    confirm,
    tCommon,
  ]);

  // ── PDF export ──────────────────────────────────────────────────────────────
  const handleExportPdf = useCallback(() => {
    const dog = dogProfiles.find((d) => d.id === selectedDogId);
    if (!dog) return;
    const rows = timeline
      .map((event) => {
        return `<tr><td>${escapeHtml(event.date)}</td><td>${escapeHtml(t(`timeline.${event.type}` as never))}</td><td>${escapeHtml(event.title)}${event.subtitle ? `<br><small>${escapeHtml(event.subtitle)}</small>` : ''}</td></tr>`;
      })
      .join('');
    const html = `<!doctype html><html lang="${lang.split('-')[0]}"><head><meta charset="utf-8"><title>${escapeHtml(t('page.exportTitle', { name: dog.name }))}</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{font-size:22px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left;vertical-align:top}th{background:#f1f5f9;font-weight:700}small{color:#64748b}@media print{body{padding:0}}</style></head><body><h1>${escapeHtml(t('page.exportTitle', { name: dog.name }))}</h1><table><thead><tr><th>${escapeHtml(t('page.exportColDate'))}</th><th>${escapeHtml(t('page.exportColType'))}</th><th>${escapeHtml(t('page.exportColDetail'))}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    const win = iframe.contentWindow!;
    win.addEventListener('load', () => {
      setTimeout(() => {
        win.focus();
        win.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 2000);
      }, 500);
    });
  }, [timeline, dogProfiles, selectedDogId, t, lang]);

  // ── Early return if no dogs ─────────────────────────────────────────────────
  if (petsLoading) return null;
  if (!dogProfiles.length) {
    return (
      <Card
        sx={{
          p: 4,
          textAlign: 'center',
          borderStyle: 'dashed',
          maxWidth: 520,
          mx: 'auto',
          mt: 4,
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PetsIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h3" sx={{ fontSize: '1.25rem' }}>
            {t('page.welcomeTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
            {t('page.welcomeDescription')}
          </Typography>
          <Button variant="contained" href="/profily" size="large">
            {t('page.createProfile')}
          </Button>
        </Stack>
      </Card>
    );
  }

  const selectedDog = dogProfiles.find((d) => d.id === selectedDogId);
  const selectedVisit = selectedVisitId
    ? (dogVisits.find((v) => v.id === selectedVisitId) ?? null)
    : null;
  const dietStatus: ValidityStatus = currentDiet ? 'VALID' : 'UNKNOWN';

  // ── Derived dashboard data ──────────────────────────────────────────────────
  const activeEpisodeCount = episodes.filter(
    (e) => e.petId === selectedDogId && (e.outcome === 'ongoing' || e.outcome === 'recurring')
  ).length;

  const healthScore = computeHealthScore(
    [vaccinationStatus, dewormingStatus, ectoStatus, dietStatus],
    activeEpisodeCount
  );

  const dogWeightLogs = [...weightLogs]
    .filter((w) => w.petId === selectedDogId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestWeight = dogWeightLogs[dogWeightLogs.length - 1]?.kg ?? selectedDog?.weightKg;

  const valueOrNotSet = (date?: string) => {
    const rel = date ? relativeDate(date) : null;
    return rel ? rel.text : t('hero.infoNotSet');
  };

  const heroInfoCards: HeroInfoCard[] = [
    {
      key: 'vaccination',
      icon: <VaccinationIcon />,
      label: t('overview.vaccination'),
      value: valueOrNotSet(urgentVaccination?.validUntil),
      accent: theme.palette.success.main,
      onClick: urgentVaccination
        ? () => setSelectedRecord({ id: urgentVaccination.id, type: 'VACCINATION' })
        : () => setWizardOpen(true),
    },
    {
      key: 'deworming',
      icon: <DewormingIcon />,
      label: t('overview.deworming'),
      value: valueOrNotSet(latestDeworming?.nextDueDate),
      accent: theme.palette.secondary.main,
      onClick: latestDeworming
        ? () => setSelectedRecord({ id: latestDeworming.id, type: 'DEWORMING' })
        : () => setWizardOpen(true),
    },
    {
      key: 'weight',
      icon: <WeightIcon />,
      label: t('hero.infoWeight'),
      value: latestWeight != null ? `${latestWeight} kg` : t('hero.infoNotSet'),
      accent: theme.palette.info.main,
    },
    {
      key: 'diet',
      icon: <DietIcon />,
      label: t('overview.diet'),
      value: currentDiet?.foodName ?? t('hero.infoNotSet'),
      accent: theme.palette.diet.main,
      onClick: currentDiet
        ? () => setSelectedRecord({ id: currentDiet.id, type: 'DIET' })
        : () => setWizardOpen(true),
    },
  ];

  // Najbližšia budúca kontrola z „Ďalšia kontrola" — používa insight aj karta termínov.
  const examVisit = (() => {
    const withCheck = dogVisits.filter((v) => v.nextCheckDate);
    if (withCheck.length === 0) return undefined;
    const sorted = [...withCheck].sort((a, b) =>
      (a.nextCheckDate ?? '').localeCompare(b.nextCheckDate ?? '')
    );
    return (
      sorted.find((v) => (relativeDate(v.nextCheckDate as string)?.diffDays ?? -1) >= 0) ??
      sorted[sorted.length - 1]
    );
  })();

  // ── Pawly Insight (heuristic, no AI call) ────────────────────────────────────
  const upcomingEvents: { label: string; days: number }[] = [
    { label: t('overview.vaccination'), date: urgentVaccination?.validUntil },
    { label: t('overview.deworming'), date: latestDeworming?.nextDueDate },
    { label: t('overview.ecto'), date: latestEcto?.nextDueDate },
    ...dogTreatments.map((trt) => ({ label: t('overview.treatment'), date: trt.nextDueDate })),
    { label: t('overview.examCheck'), date: examVisit?.nextCheckDate },
  ]
    .map((e) => {
      const rel = e.date ? relativeDate(e.date) : null;
      return rel && rel.diffDays >= 0 ? { label: e.label, days: rel.diffDays } : null;
    })
    .filter((e): e is { label: string; days: number } => e !== null)
    .sort((a, b) => a.days - b.days);

  const overdueItem = [
    { label: t('overview.vaccination'), status: vaccinationStatus },
    { label: t('overview.deworming'), status: dewormingStatus },
    { label: t('overview.ecto'), status: ectoStatus },
    ...dogTreatments.map((trt) => ({
      label: t('overview.treatment'),
      status: statusByDate(trt.nextDueDate, 7),
    })),
  ].find((e) => e.status === 'EXPIRED');

  const allPreventiveValid =
    vaccinationStatus === 'VALID' && dewormingStatus === 'VALID' && ectoStatus === 'VALID';

  const insightBullets: string[] = [];
  if (overdueItem) insightBullets.push(t('insight.bulletOverdue', { item: overdueItem.label }));
  if (activeEpisodeCount > 0) {
    insightBullets.push(t('insight.bulletOpenEpisodes', { count: activeEpisodeCount }));
  }
  if (upcomingEvents[0]) {
    insightBullets.push(
      t('insight.bulletNextEvent', {
        event: upcomingEvents[0].label,
        count: upcomingEvents[0].days,
      })
    );
  } else if (!overdueItem) {
    insightBullets.push(t('insight.bulletNoUpcoming'));
  }
  if (dogWeightLogs.length >= 2) {
    const delta = dogWeightLogs[dogWeightLogs.length - 1].kg - dogWeightLogs[0].kg;
    insightBullets.push(
      Math.abs(delta) < 1
        ? t('insight.bulletWeightStable')
        : t('insight.bulletWeightChanged', { delta: delta.toFixed(1) })
    );
  } else {
    insightBullets.push(t('insight.bulletWeightNoData'));
  }
  if (allPreventiveValid) insightBullets.push(t('insight.bulletPreventiveUpToDate'));

  const insightPositive =
    !overdueItem && activeEpisodeCount === 0 && (healthScore == null || healthScore >= 70);
  const insightHeadline = insightPositive
    ? t('insight.headlineGreat', { name: selectedDog?.name ?? '' })
    : t('insight.headlineAttention', { name: selectedDog?.name ?? '' });
  const insightFooter = insightPositive ? t('insight.footer') : t('insight.footerAttention');

  // ── Najbližšie termíny a kontroly (vrátane vyšetrení z „Ďalšia kontrola") ────
  // Každá vakcína (posledná per choroba) sa pripomína samostatne, aby skoršia
  // expirácia neprekryla druhú. Ďaleké expirácie sú na dlaždici + timeline, nie tu.
  const vaccineReminders: UpcomingReminderItem[] = [...latestVaccineByType.values()].flatMap(
    (v) => {
      if (!v.validUntil) return [];
      const rel = relativeDate(v.validUntil);
      if (!rel || rel.diffDays > VACCINE_REMINDER_HORIZON_DAYS) return [];
      return [
        {
          key: `vaccination-${v.id}`,
          icon: <VaccinesIcon />,
          label: t('overview.vaccination'),
          detail: t(`vaccineTypes.${v.type}`),
          date: v.validUntil,
          accentColor: theme.palette.success.main,
          onClick: () => setSelectedRecord({ id: v.id, type: 'VACCINATION' }),
        },
      ];
    }
  );

  // Všetky budúce kontroly, nie len najbližšia — pes môže mať viac naplánovaných.
  const checkupReminders: UpcomingReminderItem[] = dogVisits.flatMap((v) => {
    if (!v.nextCheckDate) return [];
    const rel = relativeDate(v.nextCheckDate);
    if (!rel || rel.diffDays < 0) return [];
    return [
      {
        key: `exam-${v.id}`,
        icon: <ExamIcon />,
        label: t('overview.examCheck'),
        detail: v.reason || v.clinicName,
        date: v.nextCheckDate,
        accentColor: theme.palette.primary.main,
        onClick: () => setSelectedVisitId(v.id),
      },
    ];
  });

  const upcomingReminders: UpcomingReminderItem[] = [
    ...vaccineReminders,
    latestDeworming?.nextDueDate
      ? {
          key: 'deworming',
          icon: <BiotechIcon />,
          label: t('overview.deworming'),
          detail: latestDeworming.productName,
          date: latestDeworming.nextDueDate,
          accentColor: theme.palette.secondary.main,
          onClick: () => setSelectedRecord({ id: latestDeworming.id, type: 'DEWORMING' }),
        }
      : null,
    latestEcto?.nextDueDate
      ? {
          key: 'ecto',
          icon: <DewormingIcon />,
          label: t('overview.ecto'),
          detail: latestEcto.productName,
          date: latestEcto.nextDueDate,
          accentColor: theme.palette.info.main,
          onClick: () => setSelectedRecord({ id: latestEcto.id, type: 'ECTOPARASITE' }),
        }
      : null,
    ...dogTreatments
      .filter((trt) => trt.nextDueDate)
      .map((trt) => ({
        key: `treatment-${trt.id}`,
        icon: <HealingIcon />,
        label: t('overview.treatment'),
        detail: `${t(`treatmentCategories.${trt.category}`)} · ${trt.name}`,
        date: trt.nextDueDate,
        accentColor: theme.palette.warning.main,
        onClick: () => setSelectedRecord({ id: trt.id, type: 'TREATMENT' as const }),
      })),
    ...checkupReminders,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  // ── Dlaždice prehľadu zdravia (preventíva + choroby + vyšetrenia) ────────────
  // Každý záznam = jedna dlaždica; pole rastie s dátami, mriežka je auto-fill.
  const overviewMetrics: HealthMetricTile[] = useMemo(() => {
    const items: HealthMetricTile[] = [];

    const dueMeta = (
      dueDate: string | undefined,
      soonDays: number,
      intervalDays?: number
    ): { state?: HealthMetricTile['state']; progress?: number } => {
      if (!dueDate) return {};
      const status = statusByDate(dueDate, soonDays);
      const rel = relativeDate(dueDate);
      let state: HealthMetricTile['state'];
      if (status === 'EXPIRED') {
        state = {
          label: t('status.overdueHeadline', { count: Math.abs(rel?.diffDays ?? 0) }),
          tone: 'error',
        };
      } else if (status === 'EXPIRING_SOON') {
        state = { label: rel?.text ?? '', tone: 'warning' };
      } else {
        state = { label: rel?.text ?? t('status.valid'), tone: 'success' };
      }
      let progress: number | undefined;
      if (intervalDays && intervalDays > 0 && rel) {
        const used = intervalDays - rel.diffDays;
        progress = Math.max(0, Math.min(100, (used / intervalDays) * 100));
      }
      return { state, progress };
    };

    // Preventíva — očkovanie po type (proti čomu)
    for (const type of VACCINE_TYPE_ORDER) {
      const r = latestVaccineByType.get(type);
      if (!r) continue;
      items.push({
        id: `vax-${r.id}`,
        section: 'PREVENTIVE',
        icon: <VaccinesIcon />,
        accentColor: theme.palette.success.main,
        eyebrow: t('overview.vaccination'),
        title: t(`vaccineTypes.${type}`),
        subtitle: r.validUntil
          ? t('overviewCard.dueDate', { date: formatDateShort(r.validUntil) })
          : t('detail.last', { date: formatDateShort(r.dateApplied) }),
        ...dueMeta(
          r.validUntil,
          30,
          computeIntervalDaysFromDates(r.dateApplied, r.validUntil, 365)
        ),
        onOpen: () => setSelectedRecord({ id: r.id, type: 'VACCINATION' }),
        onHistory: () => setHistoryCategory('VACCINATION'),
      });
    }

    // Preventíva — odčervenie
    if (latestDeworming) {
      const interval =
        latestDeworming.intervalDays ??
        computeIntervalDaysFromDates(latestDeworming.dateGiven, latestDeworming.nextDueDate, 90);
      items.push({
        id: `dew-${latestDeworming.id}`,
        section: 'PREVENTIVE',
        icon: <BiotechIcon />,
        accentColor: theme.palette.secondary.main,
        eyebrow: t('overview.deworming'),
        title: latestDeworming.productName,
        subtitle: latestDeworming.nextDueDate
          ? t('overviewCard.dueDate', { date: formatDateShort(latestDeworming.nextDueDate) })
          : t('detail.last', { date: formatDateShort(latestDeworming.dateGiven) }),
        ...dueMeta(latestDeworming.nextDueDate, 7, interval),
        onOpen: () => setSelectedRecord({ id: latestDeworming.id, type: 'DEWORMING' }),
        onHistory: () => setHistoryCategory('DEWORMING'),
      });
    }

    // Preventíva — kliešte/blchy
    if (latestEcto) {
      const interval =
        latestEcto.intervalDays ??
        computeIntervalDaysFromDates(latestEcto.dateGiven, latestEcto.nextDueDate, 30);
      items.push({
        id: `ecto-${latestEcto.id}`,
        section: 'PREVENTIVE',
        icon: <DewormingIcon />,
        accentColor: theme.palette.info.main,
        eyebrow: t('overview.ecto'),
        title: latestEcto.productName,
        subtitle: latestEcto.nextDueDate
          ? t('overviewCard.dueDate', { date: formatDateShort(latestEcto.nextDueDate) })
          : t('detail.last', { date: formatDateShort(latestEcto.dateGiven) }),
        ...dueMeta(latestEcto.nextDueDate, 7, interval),
        onOpen: () => setSelectedRecord({ id: latestEcto.id, type: 'ECTOPARASITE' }),
        onHistory: () => setHistoryCategory('ECTOPARASITE'),
      });
    }

    // Choroby — prebiehajúca liečba (per záznam)
    for (const trt of dogTreatments) {
      items.push({
        id: `trt-${trt.id}`,
        section: 'CONDITION',
        icon: <HealingIcon />,
        accentColor: theme.palette.warning.main,
        eyebrow: `${t('overview.treatment')} · ${t(`treatmentCategories.${trt.category}`)}`,
        title: trt.name,
        subtitle: trt.nextDueDate
          ? t('overviewCard.dueDate', { date: formatDateShort(trt.nextDueDate) })
          : t('detail.last', { date: formatDateShort(trt.dateGiven) }),
        ...dueMeta(trt.nextDueDate, 7, trt.intervalDays),
        onOpen: () => setSelectedRecord({ id: trt.id, type: 'TREATMENT' }),
        onHistory: () => setHistoryCategory('TREATMENT'),
      });
    }

    // Choroby — chronické stavy z profilu
    const conditionTone = { STABLE: 'success', MONITORED: 'neutral', ACTIVE: 'error' } as const;
    for (const cond of selectedDog?.chronicConditions ?? []) {
      const status = cond.status ?? 'MONITORED';
      items.push({
        id: `cond-${cond.id}`,
        section: 'CONDITION',
        icon: <ConditionIcon />,
        accentColor: theme.palette.diet.main,
        eyebrow: t('overviewCard.sectionCondition'),
        title: cond.title,
        subtitle: cond.description || undefined,
        state: { label: t(`conditionStatuses.${status}`), tone: conditionTone[status] },
        onOpen: () => navigate('/profily'),
      });
    }

    // Vyšetrenia — zoskupené podľa typu (najnovšie per typ), netypované samostatne
    const examState = (v: VetVisitRecord): NonNullable<HealthMetricTile['state']> => {
      if (v.examResult === 'NORMAL') return { label: t('examResults.NORMAL'), tone: 'success' };
      if (v.examResult === 'ABNORMAL') return { label: t('examResults.ABNORMAL'), tone: 'warning' };
      if (v.examResult === 'INCONCLUSIVE')
        return { label: t('examResults.INCONCLUSIVE'), tone: 'neutral' };
      const rel = v.nextCheckDate ? relativeDate(v.nextCheckDate) : null;
      if (rel !== null && rel.diffDays >= 0) return { label: rel.text, tone: 'info' };
      return { label: t('overviewCard.stateDone'), tone: 'neutral' };
    };

    const byType = new Map<string, VetVisitRecord[]>();
    const untyped: VetVisitRecord[] = [];
    for (const v of dogVisits) {
      const type = (v.aiExamType ?? '').trim();
      if (type) byType.set(type, [...(byType.get(type) ?? []), v]);
      else untyped.push(v);
    }
    const examEntries = [
      ...[...byType.entries()].map(([type, arr]) => {
        const latest = [...arr].sort((a, b) => b.date.localeCompare(a.date))[0];
        return { v: latest, title: type, count: arr.length };
      }),
      ...untyped.map((v) => ({ v, title: v.reason || t('overview.examCheck'), count: 1 })),
    ]
      .sort((a, b) => b.v.date.localeCompare(a.v.date))
      .slice(0, EXAM_TILE_LIMIT);

    for (const { v, title, count } of examEntries) {
      const meta =
        count > 1
          ? t('overviewCard.examCount', { count })
          : v.clinicName || formatDateShort(v.date);
      items.push({
        id: `visit-${v.id}`,
        section: 'EXAM',
        icon: <ExamIcon />,
        accentColor: theme.palette.primary.main,
        eyebrow: t('overviewCard.sectionExam'),
        title,
        subtitle: `${formatDateShort(v.date)} · ${meta}`,
        state: examState(v),
        onOpen: () => setSelectedVisitId(v.id),
      });
    }

    return items;
  }, [
    latestVaccineByType,
    latestDeworming,
    latestEcto,
    dogTreatments,
    selectedDog,
    dogVisits,
    theme,
    navigate,
    t,
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <FeatureIntro featureKey="passport" icon={<PetsIcon />} />
      {selectedDog && (
        <PassportHero
          dog={selectedDog}
          dogProfiles={dogProfiles}
          selectedDogId={selectedDogId}
          onSelectDog={setSelectedDogId}
          score={healthScore}
          infoCards={heroInfoCards}
          onEditProfile={() => navigate('/profily')}
          onPhotoSelected={handleHeroPhoto}
          onPhotoRemove={handleHeroPhotoRemove}
          photoUploading={photoUploading}
        />
      )}
      <PetPhotoAdjustDialog
        file={pendingPhotoFile}
        open={pendingPhotoFile !== null}
        uploading={photoUploading}
        onCancel={() => setPendingPhotoFile(null)}
        onConfirm={handleHeroPhotoConfirm}
      />

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2.5 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setWizardOpen(true)}
          sx={{ boxShadow: theme.shadows[4] }}
        >
          {t('hero.addRecord')}
        </Button>
        <QuickVisitButton
          petId={selectedDogId}
          disabled={!selectedDogId}
          onCreate={handleQuickVisitCreate}
          onUndo={handleQuickVisitUndo}
        />
        <Button
          variant="outlined"
          startIcon={<BadgeIcon />}
          onClick={() => navigate('/karta-pre-veterinara')}
        >
          {t('hero.vetCard')}
        </Button>
      </Stack>

      {/* ── Status overview ────────────────────────────────────────────────── */}
      <HealthOverviewDashboard metrics={overviewMetrics} onAdd={() => setWizardOpen(true)} />

      {/* ── Najbližšie termíny a kontroly (vrátane vyšetrení) ───────────────── */}
      <UpcomingRemindersCard items={upcomingReminders} />

      {/* ── Pawly Insight ──────────────────────────────────────────────────── */}
      <PawlyInsightCard
        headline={insightHeadline}
        bullets={insightBullets.slice(0, 3)}
        footer={insightFooter}
      />

      {/* ── Health Journey ─────────────────────────────────────────────────── */}
      <Card
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2.5,
          borderRadius: 0,
          borderTopWidth: 0,
          borderBottomWidth: 0,
          bgcolor: 'background.default',
        }}
      >
        <HealthTimeline
          timeline={timeline}
          onOpenDetail={handleOpenDetail}
          onExportPdf={handleExportPdf}
        />
      </Card>

      {/* ── Weight trend + expenses ────────────────────────────────────────── */}
      {/* Wrapper draws one continuous bottom line + rounded bottom corners across the
          whole row (incl. the gap), closing the monolith. The inner cards are borderless. */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          alignItems: 'stretch',
          // clip the inner cards to the rounded bottom corners so they merge with the frame
          overflow: 'hidden',
          borderColor: 'divider',
          borderStyle: 'solid',
          borderWidth: 0,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderRadius: 4,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
      >
        <WeightTrendCard petId={selectedDogId} fallbackWeightKg={selectedDog?.weightKg} />
        <ExpenseSummaryCard expenses={dogExpenses} />
      </Box>

      {/* ── Add record dialog ────────────────────────────────────────────── */}
      <AddRecord
        open={wizardOpen}
        petId={selectedDogId}
        currentDietEntryId={latestDietId}
        onClose={() => setWizardOpen(false)}
        onSave={dispatchBundle}
        onSaveTreatment={handleAddTreatment}
      />

      {/* ── Visit detail dialog ──────────────────────────────────────────── */}
      <VisitDetailDialog
        visit={selectedVisit}
        open={Boolean(selectedVisitId && selectedVisit)}
        onClose={() => setSelectedVisitId(null)}
        onSave={handleSaveVisit}
        onDelete={handleDeleteVisit}
      />

      {/* ── Record detail dialog ─────────────────────────────────────────── */}
      <TimelineRecordDetailDialog
        state={selectedRecord}
        open={Boolean(selectedRecord)}
        vaccination={
          selectedRecord?.type === 'VACCINATION'
            ? (dogVaccinations.find((x) => x.id === selectedRecord.id) ?? null)
            : null
        }
        deworming={
          selectedRecord?.type === 'DEWORMING'
            ? (dogDewormings.find((x) => x.id === selectedRecord.id) ?? null)
            : null
        }
        ectoparasite={
          selectedRecord?.type === 'ECTOPARASITE'
            ? (dogEctos.find((x) => x.id === selectedRecord.id) ?? null)
            : null
        }
        treatment={
          selectedRecord?.type === 'TREATMENT'
            ? (dogTreatments.find((x) => x.id === selectedRecord.id) ?? null)
            : null
        }
        medication={
          selectedRecord?.type === 'MEDICATION'
            ? (dogMeds.find((x) => x.id === selectedRecord.id) ?? null)
            : null
        }
        diet={
          selectedRecord?.type === 'DIET'
            ? (dogDiet.find((x) => x.id === selectedRecord.id) ?? null)
            : null
        }
        expense={
          selectedRecord?.type === 'EXPENSE'
            ? (dogExpenses.find((x) => x.id === selectedRecord.id) ?? null)
            : null
        }
        onClose={() => setSelectedRecord(null)}
        onSaveVaccination={handleSaveVaccination}
        onSaveDeworming={handleSaveDeworming}
        onSaveEcto={handleSaveEcto}
        onSaveTreatment={handleSaveTreatment}
        onSaveMedication={handleSaveMedication}
        onSaveDiet={handleSaveDiet}
        onSaveExpense={handleSaveExpense}
        onDelete={handleDeleteRecord}
      />

      <CategoryHistoryDialog
        open={historyCategory !== null}
        onClose={() => setHistoryCategory(null)}
        title={
          historyCategory === 'VACCINATION'
            ? t('history.vaccinationTitle')
            : historyCategory === 'DEWORMING'
              ? t('history.dewormingTitle')
              : historyCategory === 'TREATMENT'
                ? t('history.treatmentTitle')
                : t('history.ectoTitle')
        }
        accentColor={
          historyCategory === 'VACCINATION'
            ? theme.palette.success.main
            : historyCategory === 'DEWORMING'
              ? theme.palette.secondary.main
              : historyCategory === 'TREATMENT'
                ? theme.palette.warning.main
                : theme.palette.info.main
        }
        icon={
          historyCategory === 'VACCINATION' ? (
            <VaccinesIcon />
          ) : historyCategory === 'DEWORMING' ? (
            <BiotechIcon />
          ) : historyCategory === 'TREATMENT' ? (
            <HealingIcon />
          ) : (
            <DewormingIcon />
          )
        }
        entries={
          historyCategory === 'VACCINATION'
            ? vaccinationHistory
            : historyCategory === 'DEWORMING'
              ? dewormingHistory
              : historyCategory === 'TREATMENT'
                ? treatmentHistory
                : ectoHistory
        }
        onOpenEntry={(id) =>
          historyCategory &&
          setSelectedRecord({
            id,
            type: historyCategory,
          })
        }
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
      {confirmDialog}
    </PageContainer>
  );
}
