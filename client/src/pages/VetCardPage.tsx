import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { PetProfile } from '../types';
import AiFormattedText from '../components/AiFormattedText';
import type {
  DewormingRecord,
  DietEntry,
  EctoparasiteRecord,
  ExpenseRecord,
  MedicationRecord,
  TimelineEvent,
  VaccinationRecord,
  VetVisitRecord,
} from '../types/dogHealth';

const today = () => new Date().toISOString().slice(0, 10);
const formatDate = (value?: string) => {
  if (!value) return '–';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('sk-SK');
};

export default function VetCardPage() {
  const [profiles] = useLocalStorage<PetProfile[]>('granule-check-pet-profiles', []);
  const [vaccinations] = useLocalStorage<VaccinationRecord[]>('dog-health-vaccinations', []);
  const [dewormings] = useLocalStorage<DewormingRecord[]>('dog-health-dewormings', []);
  const [ectos] = useLocalStorage<EctoparasiteRecord[]>('dog-health-ectos', []);
  const [visits] = useLocalStorage<VetVisitRecord[]>('dog-health-visits', []);
  const [medications] = useLocalStorage<MedicationRecord[]>('dog-health-medications', []);
  const [dietEntries] = useLocalStorage<DietEntry[]>('dog-health-diet-entries', []);
  const [expenses] = useLocalStorage<ExpenseRecord[]>('dog-health-expenses', []);

  const dog = profiles.find((p) => p.animalType === 'dog');
  const dogId = dog?.id;

  const data = useMemo(() => {
    if (!dogId) return null;
    const dogVaccines = vaccinations.filter((x) => x.dogId === dogId);
    const dogDewormings = dewormings.filter((x) => x.dogId === dogId);
    const dogEctos = ectos.filter((x) => x.dogId === dogId);
    const dogVisits = visits.filter((x) => x.dogId === dogId);
    const activeMeds = medications.filter((x) => x.dogId === dogId && (x.longTerm || !x.endDate || x.endDate >= today()));
    const dogDiet = dietEntries.filter((x) => x.dogId === dogId);
    const dogExpenses = expenses.filter((x) => x.dogId === dogId);

    const rabies = dogVaccines.filter((x) => x.type === 'RABIES').sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))[0];
    const combined = dogVaccines.filter((x) => x.type === 'COMBINED').sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))[0];
    const lastDeworming = [...dogDewormings].sort((a, b) => b.dateGiven.localeCompare(a.dateGiven))[0];
    const lastEcto = [...dogEctos].sort((a, b) => b.dateGiven.localeCompare(a.dateGiven))[0];
    const latestDiet = [...dogDiet].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
    const monthlyExpense = dogExpenses
      .filter((x) => x.date.slice(0, 7) === today().slice(0, 7))
      .reduce((acc, item) => acc + item.amount, 0);
    const yearlyExpense = dogExpenses
      .filter((x) => x.date.slice(0, 4) === today().slice(0, 4))
      .reduce((acc, item) => acc + item.amount, 0);
    const significantEvents = dogVisits
      .filter((x) => x.diagnosis || x.findings || x.recommendations || x.aiExtractedText)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    const timeline: TimelineEvent[] = [
      ...dogVaccines.map((x) => ({ id: `vac-${x.id}`, dogId, type: 'VACCINATION' as const, title: `Očkovanie ${x.name}`, subtitle: `Platné do ${x.validUntil}`, date: x.dateApplied })),
      ...dogDewormings.map((x) => ({ id: `dew-${x.id}`, dogId, type: 'DEWORMING' as const, title: `Odčervenie ${x.productName}`, subtitle: `Ďalší termín ${x.nextDueDate}`, date: x.dateGiven })),
      ...dogEctos.map((x) => ({ id: `ecto-${x.id}`, dogId, type: 'ECTOPARASITE' as const, title: `Antiparazitikum ${x.productName}`, subtitle: `Ďalší termín ${x.nextDueDate}`, date: x.dateGiven })),
      ...dogVisits.map((x) => ({ id: `visit-${x.id}`, dogId, type: 'VET_VISIT' as const, title: `Návšteva ${x.clinicName}`, subtitle: x.reason, date: x.date })),
      ...activeMeds.map((x) => ({ id: `med-${x.id}`, dogId, type: 'MEDICATION' as const, title: `Liek ${x.name}`, subtitle: `${x.dose}, ${x.frequency}`, date: x.startDate })),
      ...dogDiet.map((x) => ({ id: `diet-${x.id}`, dogId, type: 'DIET' as const, title: `Diéta ${x.foodName}`, subtitle: x.suitabilityStatus, date: x.startedAt })),
      ...dogExpenses.map((x) => ({ id: `exp-${x.id}`, dogId, type: 'EXPENSE' as const, title: `Výdavok ${x.amount.toFixed(2)} ${x.currency}`, subtitle: x.category, date: x.date })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    const recentTimeline = timeline.slice(0, 10);

    return { rabies, combined, lastDeworming, lastEcto, latestDiet, monthlyExpense, yearlyExpense, activeMeds, significantEvents, recentTimeline };
  }, [dogId, vaccinations, dewormings, ectos, visits, medications, dietEntries, expenses]);

  if (!dog || !data) {
    return <Typography>Najprv vytvorte profil psa a zdravotné záznamy.</Typography>;
  }

  const age = dog.dateOfBirth ? Math.floor((Date.now() - new Date(dog.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : dog.ageYears;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Karta pre veterinára</Typography>
        <Stack direction="row" spacing={1} sx={{ display: { print: 'none' } }}>
          <Button variant="outlined" onClick={() => window.print()}>Export PDF (print)</Button>
          <Button variant="outlined">Zdieľací link (MVP)</Button>
        </Stack>
      </Stack>

      <Stack spacing={2}>
        <Card><CardContent>
          <Typography variant="h6">Identita psa</Typography>
          <Typography>Meno: {dog.name}</Typography>
          <Typography>Plemeno: {dog.breed || '–'} · Vek: {age ?? '–'} · Pohlavie: {dog.sex || 'UNKNOWN'}</Typography>
          <Typography>Hmotnosť: {dog.weightKg ?? '–'} kg · Čip: {dog.microchipNumber || '–'} · Pas: {dog.passportNumber || '–'}</Typography>
        </CardContent></Card>

        <Card><CardContent>
          <Typography variant="h6">Dlhodobé diagnózy a alergie</Typography>
          <Typography>Diagnózy: {(dog.chronicConditions ?? []).map((x) => x.title).join(', ') || dog.healthConditions.join(', ') || '–'}</Typography>
          <Typography>Alergie / reakcie: {dog.allergies.join(', ') || '–'}</Typography>
          <Typography>Intolerancie: {dog.intolerances.join(', ') || '–'}</Typography>
          <Typography>Poznámky od majiteľa: {dog.notes || '–'}</Typography>
        </CardContent></Card>

        <Card><CardContent>
          <Typography variant="h6">Aktuálne lieky a doplnky</Typography>
          {data.activeMeds.length ? data.activeMeds.map((m) => <Typography key={m.id}>• {m.name} — {m.dose}, {m.frequency}</Typography>) : <Typography>Bez aktívnych liekov</Typography>}
        </CardContent></Card>

        <Card><CardContent>
          <Typography variant="h6">Očkovania / antiparazitiká</Typography>
          <Typography>Besnota: {data.rabies ? `${formatDate(data.rabies.dateApplied)} (platné do ${formatDate(data.rabies.validUntil)})` : '–'}</Typography>
          <Typography>Kombinovaná: {data.combined ? `${formatDate(data.combined.dateApplied)} (platné do ${formatDate(data.combined.validUntil)})` : '–'}</Typography>
          <Typography>Odčervenie: {data.lastDeworming ? `${formatDate(data.lastDeworming.dateGiven)} (ďalšie ${formatDate(data.lastDeworming.nextDueDate)})` : '–'}</Typography>
          <Typography>Kliešte/blchy: {data.lastEcto ? `${formatDate(data.lastEcto.dateGiven)} (ďalšie ${formatDate(data.lastEcto.nextDueDate)})` : '–'}</Typography>
        </CardContent></Card>

        <Card><CardContent>
          <Typography variant="h6">Nedávne významné udalosti</Typography>
          {data.significantEvents.length ? (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {data.significantEvents.map((v) => (
                <Card key={v.id} variant="outlined">
                  <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                      <Chip size="small" color="primary" label={formatDate(v.date)} />
                      <Chip size="small" variant="outlined" label={v.clinicName || 'Bez kliniky'} />
                      {v.aiExamType ? <Chip size="small" color="secondary" variant="outlined" label={v.aiExamType} /> : null}
                    </Stack>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Dôvod návštevy
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {v.reason || 'Bez uvedenia dôvodu'}
                    </Typography>
                    {v.diagnosis ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Diagnóza
                        </Typography>
                        <AiFormattedText text={v.diagnosis} />
                      </>
                    ) : null}
                    {v.findings ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                          Nález
                        </Typography>
                        <AiFormattedText text={v.findings} />
                      </>
                    ) : null}
                    {v.recommendations ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                          Odporúčania
                        </Typography>
                        <AiFormattedText text={v.recommendations} />
                      </>
                    ) : null}
                    {v.aiExtractedText ? (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
                          AI extrahovaný text
                        </Typography>
                        <AiFormattedText text={v.aiExtractedText} />
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : <Typography>Bez záznamov</Typography>}
        </CardContent></Card>

        <Card><CardContent>
          <Typography variant="h6">Rozšírený prehľad z timeline</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
            <Chip size="small" color="info" label={`Mesačné výdavky: ${data.monthlyExpense.toFixed(2)} EUR`} />
            <Chip size="small" color="info" label={`Ročné výdavky: ${data.yearlyExpense.toFixed(2)} EUR`} />
            <Chip size="small" color="success" label={`Aktuálna diéta: ${data.latestDiet?.foodName ?? '–'}`} />
          </Stack>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Stav diéty: {data.latestDiet?.suitabilityStatus ?? 'Bez hodnotenia'} {data.latestDiet?.reactionNotes ? `· Reakcia: ${data.latestDiet.reactionNotes}` : ''}
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 1 }}>Posledných 10 udalostí:</Typography>
          {data.recentTimeline.length ? (
            <Stack spacing={1}>
              {data.recentTimeline.map((item) => (
                <Box key={item.id} sx={{ borderLeft: '3px solid', borderColor: 'divider', pl: 1.25 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(item.date)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                  {item.subtitle ? (
                    <Typography variant="body2" color="text.secondary">
                      {item.subtitle}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Stack>
          ) : <Typography>Bez záznamov.</Typography>}
        </CardContent></Card>
      </Stack>
    </Box>
  );
}
