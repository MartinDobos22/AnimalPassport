import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import type { PetProfile } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type {
  DewormingRecord,
  DietEntry,
  EctoparasiteRecord,
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

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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
    dewormInterval: 90,
    addEcto: false,
    ectoProduct: '',
    ectoForm: 'TABLET' as 'TABLET' | 'SPOT_ON' | 'COLLAR',
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

  const saveWizard = () => {
    if (!selectedDogId || !wizard.clinicName.trim() || !wizard.reason.trim()) return;
    const visitId = uid();
    const attachmentUrl = attachmentPreviewUrl || wizard.attachmentUrl;
    const attachment = wizard.attachmentLabel || attachmentUrl || attachmentFile
      ? [{
          id: uid(),
          label: wizard.attachmentLabel || attachmentFile?.name || 'Doklad',
          imageUrl: attachmentUrl || undefined,
          fileName: attachmentFile?.name || undefined,
          createdAt: new Date().toISOString(),
        }]
      : undefined;

    const createdMedicationIds: string[] = [];

    setVisits((prev) => [...prev, {
      id: visitId,
      dogId: selectedDogId,
      date: wizard.date,
      clinicName: wizard.clinicName,
      reason: wizard.reason,
      findings: wizard.findings,
      diagnosis: wizard.diagnosis,
      recommendations: wizard.recommendations,
      nextCheckDate: wizard.nextCheckDate || undefined,
      medicationIds: createdMedicationIds,
      attachments: attachment,
    }]);

    if (wizard.addVaccination && wizard.vaccineName.trim()) {
      setVaccinations((prev) => [...prev, {
        id: uid(),
        dogId: selectedDogId,
        type: wizard.vaccineType,
        name: wizard.vaccineName,
        dateApplied: wizard.date,
        validUntil: wizard.vaccineValidUntil,
        attachments: attachment,
      }]);
    }
    if (wizard.addDeworming && wizard.dewormProduct.trim()) {
      setDewormings((prev) => [...prev, {
        id: uid(),
        dogId: selectedDogId,
        productName: wizard.dewormProduct,
        dateGiven: wizard.date,
        intervalDays: wizard.dewormInterval,
        nextDueDate: plusDays(wizard.date, wizard.dewormInterval),
        attachments: attachment,
      }]);
    }
    if (wizard.addEcto && wizard.ectoProduct.trim()) {
      setEctos((prev) => [...prev, {
        id: uid(),
        dogId: selectedDogId,
        productName: wizard.ectoProduct,
        form: wizard.ectoForm,
        dateGiven: wizard.date,
        intervalDays: wizard.ectoInterval,
        nextDueDate: plusDays(wizard.date, wizard.ectoInterval),
        attachments: attachment,
      }]);
    }
    if (wizard.addMedication && wizard.medName.trim()) {
      const medId = uid();
      createdMedicationIds.push(medId);
      setMedications((prev) => [...prev, {
        id: medId,
        dogId: selectedDogId,
        name: wizard.medName,
        reason: wizard.medReason,
        dose: wizard.medDose,
        frequency: wizard.medFrequency,
        startDate: wizard.date,
        endDate: wizard.medEndDate || undefined,
        fromVetVisitId: visitId,
      }]);
      setDoseLogs((prev) => [...prev, { id: uid(), dogId: selectedDogId, medicationId: medId, date: wizard.date, taken: false }]);
    }
    if (wizard.addDiet && wizard.foodName.trim()) {
      setDietEntries((prev) => [...prev, {
        id: uid(),
        dogId: selectedDogId,
        foodName: wizard.foodName,
        startedAt: wizard.date,
        reactionNotes: wizard.reactionNotes,
        suitabilityStatus: wizard.suitabilityStatus,
        suitabilityReasons: wizard.suitabilityStatus === 'SUITABLE' ? ['Bez konfliktu s alergiami a diagnózami'] : ['Skontrolovať zloženie voči alergénom'],
      }]);
    }

    if (wizard.totalExpense) {
      setExpenses((prev) => [...prev, {
        id: uid(),
        dogId: selectedDogId,
        date: wizard.date,
        amount: Number(wizard.totalExpense),
        currency: 'EUR',
        category: 'VET_VISIT',
        relatedVetVisitId: visitId,
      }]);
    }
    if (wizard.extraMedicationExpense) {
      setExpenses((prev) => [...prev, {
        id: uid(),
        dogId: selectedDogId,
        date: wizard.date,
        amount: Number(wizard.extraMedicationExpense),
        currency: 'EUR',
        category: 'MEDICATION',
        relatedVetVisitId: visitId,
      }]);
    }
    if (wizard.extraFoodExpense) {
      setExpenses((prev) => [...prev, {
        id: uid(),
        dogId: selectedDogId,
        date: wizard.date,
        amount: Number(wizard.extraFoodExpense),
        currency: 'EUR',
        category: 'FOOD',
        relatedVetVisitId: visitId,
        relatedDietEntryId: dogDiet[0]?.id,
      }]);
    }

    setWizardOpen(false);
    setWizardStep(0);
    setWizard({
      date: today(), clinicName: '', reason: '', findings: '', diagnosis: '', recommendations: '', nextCheckDate: '',
      addVaccination: false, vaccineName: '', vaccineType: 'RABIES', vaccineValidUntil: plusDays(today(), 365),
      addDeworming: false, dewormProduct: '', dewormInterval: 90,
      addEcto: false, ectoProduct: '', ectoForm: 'TABLET', ectoInterval: 30,
      addMedication: false, medName: '', medReason: '', medDose: '', medFrequency: '2x denne', medEndDate: '',
      addDiet: false, foodName: '', reactionNotes: '', suitabilityStatus: 'SUITABLE',
      attachmentLabel: '', attachmentUrl: '', totalExpense: '', extraMedicationExpense: '', extraFoodExpense: '',
    });
    setAttachmentFile(null);
    setAttachmentPreviewUrl('');
    setAttachmentError('');
  };

  const [timelineFilter, setTimelineFilter] = useState<'ALL' | TimelineEvent['type']>('ALL');
  const visibleTimeline = timelineFilter === 'ALL' ? timeline : timeline.filter((x) => x.type === timelineFilter);

  if (!dogProfiles.length) {
    return <Alert severity="info">Najprv si vytvorte profil psa v sekcii Profily.</Alert>;
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Dashboard psa</Typography>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Pes</InputLabel>
            <Select value={selectedDogId} label="Pes" onChange={(e) => setSelectedDogId(e.target.value)}>
              {dogProfiles.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => setWizardOpen(true)}>Pridať návštevu</Button>
          <Button variant="outlined" href="/karta-pre-veterinara">Karta pre veterinára</Button>
        </Stack>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Príloha do zdravotného pasu</Typography>
          <Stack spacing={1.5}>
            <TextField
              label="Popis prílohy (napr. pas strana 4)"
              value={wizard.attachmentLabel}
              onChange={(e) => setWizard({ ...wizard, attachmentLabel: e.target.value })}
            />
            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
              Vybrať PDF alebo fotku
              <input
                type="file"
                hidden
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => handleAttachmentFileChange(e.target.files?.[0] ?? null)}
              />
            </Button>
            {attachmentFile && <Chip label={`${attachmentFile.name} (${Math.round(attachmentFile.size / 1024)} kB)`} />}
            {attachmentError && <Alert severity="warning">{attachmentError}</Alert>}
            <TextField
              label="URL fotky stránky / bločku (voliteľné)"
              value={wizard.attachmentUrl}
              onChange={(e) => setWizard({ ...wizard, attachmentUrl: e.target.value })}
              helperText="Ak vyberiete súbor, použije sa nahratý súbor pri ukladaní návštevy."
            />
          </Stack>
        </CardContent>
      </Card>

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

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Timeline</Typography>
          <Tabs value={timelineFilter} onChange={(_e, val) => setTimelineFilter(val)} variant="scrollable" scrollButtons="auto" sx={{ mb: 1 }}>
            {['ALL', 'VACCINATION', 'DEWORMING', 'ECTOPARASITE', 'VET_VISIT', 'MEDICATION', 'DIET', 'EXPENSE'].map((x) => <Tab key={x} value={x} label={x} />)}
          </Tabs>
          <Stack spacing={1}>
            {visibleTimeline.slice(0, 20).map((event) => (
              <Box key={event.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.2 }}>
                <Typography variant="subtitle2">{event.title}</Typography>
                <Typography variant="caption" color="text.secondary">{event.date} · {event.type}</Typography>
                {event.subtitle && <Typography variant="body2">{event.subtitle}</Typography>}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Po návšteve veterinára ({wizardStep + 1}/3)</DialogTitle>
        <DialogContent>
          {wizardStep === 0 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Dátum" type="date" InputLabelProps={{ shrink: true }} value={wizard.date} onChange={(e) => setWizard({ ...wizard, date: e.target.value })} />
              <TextField label="Klinika" value={wizard.clinicName} onChange={(e) => setWizard({ ...wizard, clinicName: e.target.value })} />
              <TextField label="Dôvod" value={wizard.reason} onChange={(e) => setWizard({ ...wizard, reason: e.target.value })} />
              <TextField label="Nález / diagnóza" value={wizard.diagnosis} onChange={(e) => setWizard({ ...wizard, diagnosis: e.target.value })} />
              <TextField label="Odporúčania" value={wizard.recommendations} onChange={(e) => setWizard({ ...wizard, recommendations: e.target.value })} />
              <TextField label="Ďalšia kontrola" type="date" InputLabelProps={{ shrink: true }} value={wizard.nextCheckDate} onChange={(e) => setWizard({ ...wizard, nextCheckDate: e.target.value })} />
            </Stack>
          )}
          {wizardStep === 1 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Button variant={wizard.addVaccination ? 'contained' : 'outlined'} onClick={() => setWizard({ ...wizard, addVaccination: !wizard.addVaccination })}>Očkovanie</Button>
              {wizard.addVaccination && <Stack spacing={1}><TextField label="Názov vakcíny" value={wizard.vaccineName} onChange={(e) => setWizard({ ...wizard, vaccineName: e.target.value })} /><FormControl><InputLabel>Typ</InputLabel><Select value={wizard.vaccineType} label="Typ" onChange={(e) => setWizard({ ...wizard, vaccineType: e.target.value as any })}><MenuItem value="RABIES">RABIES</MenuItem><MenuItem value="COMBINED">COMBINED</MenuItem><MenuItem value="OTHER">OTHER</MenuItem></Select></FormControl><TextField label="Platné do" type="date" InputLabelProps={{ shrink: true }} value={wizard.vaccineValidUntil} onChange={(e) => setWizard({ ...wizard, vaccineValidUntil: e.target.value })} /></Stack>}

              <Button variant={wizard.addDeworming ? 'contained' : 'outlined'} onClick={() => setWizard({ ...wizard, addDeworming: !wizard.addDeworming })}>Odčervenie</Button>
              {wizard.addDeworming && <Stack spacing={1}><TextField label="Produkt" value={wizard.dewormProduct} onChange={(e) => setWizard({ ...wizard, dewormProduct: e.target.value })} /><TextField label="Interval dní" type="number" value={wizard.dewormInterval} onChange={(e) => setWizard({ ...wizard, dewormInterval: Number(e.target.value) })} /></Stack>}

              <Button variant={wizard.addEcto ? 'contained' : 'outlined'} onClick={() => setWizard({ ...wizard, addEcto: !wizard.addEcto })}>Antiparazitikum</Button>
              {wizard.addEcto && <Stack spacing={1}><TextField label="Produkt" value={wizard.ectoProduct} onChange={(e) => setWizard({ ...wizard, ectoProduct: e.target.value })} /><FormControl><InputLabel>Forma</InputLabel><Select value={wizard.ectoForm} label="Forma" onChange={(e) => setWizard({ ...wizard, ectoForm: e.target.value as any })}><MenuItem value="TABLET">tablet</MenuItem><MenuItem value="SPOT_ON">spotOn</MenuItem><MenuItem value="COLLAR">collar</MenuItem></Select></FormControl><TextField label="Interval dní" type="number" value={wizard.ectoInterval} onChange={(e) => setWizard({ ...wizard, ectoInterval: Number(e.target.value) })} /></Stack>}

              <Button variant={wizard.addMedication ? 'contained' : 'outlined'} onClick={() => setWizard({ ...wizard, addMedication: !wizard.addMedication })}>Liek</Button>
              {wizard.addMedication && <Stack spacing={1}><TextField label="Názov" value={wizard.medName} onChange={(e) => setWizard({ ...wizard, medName: e.target.value })} /><TextField label="Dôvod" value={wizard.medReason} onChange={(e) => setWizard({ ...wizard, medReason: e.target.value })} /><TextField label="Dávkovanie" value={wizard.medDose} onChange={(e) => setWizard({ ...wizard, medDose: e.target.value })} /><TextField label="Frekvencia" value={wizard.medFrequency} onChange={(e) => setWizard({ ...wizard, medFrequency: e.target.value })} /><TextField label="Koniec liečby" type="date" InputLabelProps={{ shrink: true }} value={wizard.medEndDate} onChange={(e) => setWizard({ ...wizard, medEndDate: e.target.value })} /></Stack>}

              <Button variant={wizard.addDiet ? 'contained' : 'outlined'} onClick={() => setWizard({ ...wizard, addDiet: !wizard.addDiet })}>Zmena diéty</Button>
              {wizard.addDiet && <Stack spacing={1}><TextField label="Granule / krmivo" value={wizard.foodName} onChange={(e) => setWizard({ ...wizard, foodName: e.target.value })} /><FormControl><InputLabel>Hodnotenie</InputLabel><Select value={wizard.suitabilityStatus} label="Hodnotenie" onChange={(e) => setWizard({ ...wizard, suitabilityStatus: e.target.value as any })}><MenuItem value="SUITABLE">SUITABLE</MenuItem><MenuItem value="RISKY">RISKY</MenuItem><MenuItem value="UNSUITABLE">UNSUITABLE</MenuItem></Select></FormControl><TextField label="Reakcia" value={wizard.reactionNotes} onChange={(e) => setWizard({ ...wizard, reactionNotes: e.target.value })} /></Stack>}
            </Stack>
          )}
          {wizardStep === 2 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Popis prílohy (napr. pas strana 4)" value={wizard.attachmentLabel} onChange={(e) => setWizard({ ...wizard, attachmentLabel: e.target.value })} />
              <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                Vybrať PDF alebo fotku
                <input
                  type="file"
                  hidden
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) {
                      setAttachmentFile(null);
                      setAttachmentPreviewUrl('');
                      setAttachmentError('');
                      return;
                    }
                    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
                      setAttachmentFile(null);
                      setAttachmentPreviewUrl('');
                      setAttachmentError('Nepodporovaný typ súboru.');
                      return;
                    }
                    if (file.size > MAX_FILE_SIZE_BYTES) {
                      setAttachmentFile(null);
                      setAttachmentPreviewUrl('');
                      setAttachmentError('Súbor je príliš veľký (max 5 MB).');
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                      const raw = typeof reader.result === 'string' ? reader.result : '';
                      setAttachmentPreviewUrl(raw);
                      setAttachmentFile(file);
                      setAttachmentError('');
                    };
                    reader.onerror = () => {
                      setAttachmentPreviewUrl('');
                      setAttachmentFile(null);
                      setAttachmentError('Nepodarilo sa načítať súbor.');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </Button>
              {attachmentFile && <Chip label={`${attachmentFile.name} (${Math.round(attachmentFile.size / 1024)} kB)`} />}
              {attachmentError && <Alert severity="warning">{attachmentError}</Alert>}
              <TextField label="URL fotky stránky / bločku (voliteľné)" value={wizard.attachmentUrl} onChange={(e) => setWizard({ ...wizard, attachmentUrl: e.target.value })} helperText="Ak vyberiete súbor, použije sa nahratý súbor." />
              <TextField label="Výdavok návštevy" type="number" value={wizard.totalExpense} onChange={(e) => setWizard({ ...wizard, totalExpense: e.target.value })} />
              <TextField label="Výdavok lieky" type="number" value={wizard.extraMedicationExpense} onChange={(e) => setWizard({ ...wizard, extraMedicationExpense: e.target.value })} />
              <TextField label="Výdavok krmivo" type="number" value={wizard.extraFoodExpense} onChange={(e) => setWizard({ ...wizard, extraFoodExpense: e.target.value })} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWizardOpen(false)}>Zrušiť</Button>
          {wizardStep > 0 && <Button onClick={() => setWizardStep((s) => s - 1)}>Späť</Button>}
          {wizardStep < 2 ? <Button variant="contained" onClick={() => setWizardStep((s) => s + 1)}>Pokračovať</Button> : <Button variant="contained" onClick={saveWizard}>Uložiť všetko</Button>}
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
