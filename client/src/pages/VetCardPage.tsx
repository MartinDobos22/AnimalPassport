import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { PetProfile } from '../types';
import type { DewormingRecord, EctoparasiteRecord, MedicationRecord, VaccinationRecord, VetVisitRecord } from '../types/dogHealth';

const today = () => new Date().toISOString().slice(0, 10);

export default function VetCardPage() {
  const [profiles] = useLocalStorage<PetProfile[]>('granule-check-pet-profiles', []);
  const [vaccinations] = useLocalStorage<VaccinationRecord[]>('dog-health-vaccinations', []);
  const [dewormings] = useLocalStorage<DewormingRecord[]>('dog-health-dewormings', []);
  const [ectos] = useLocalStorage<EctoparasiteRecord[]>('dog-health-ectos', []);
  const [visits] = useLocalStorage<VetVisitRecord[]>('dog-health-visits', []);
  const [medications] = useLocalStorage<MedicationRecord[]>('dog-health-medications', []);

  const dog = profiles.find((p) => p.animalType === 'dog');
  const dogId = dog?.id;

  const data = useMemo(() => {
    if (!dogId) return null;
    const dogVaccines = vaccinations.filter((x) => x.dogId === dogId);
    const dogDewormings = dewormings.filter((x) => x.dogId === dogId);
    const dogEctos = ectos.filter((x) => x.dogId === dogId);
    const dogVisits = visits.filter((x) => x.dogId === dogId);
    const activeMeds = medications.filter((x) => x.dogId === dogId && (x.longTerm || !x.endDate || x.endDate >= today()));

    const rabies = dogVaccines.filter((x) => x.type === 'RABIES').sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))[0];
    const combined = dogVaccines.filter((x) => x.type === 'COMBINED').sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))[0];
    const lastDeworming = [...dogDewormings].sort((a, b) => b.dateGiven.localeCompare(a.dateGiven))[0];
    const lastEcto = [...dogEctos].sort((a, b) => b.dateGiven.localeCompare(a.dateGiven))[0];
    const significantEvents = dogVisits
      .filter((x) => x.diagnosis || x.findings)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return { rabies, combined, lastDeworming, lastEcto, activeMeds, significantEvents };
  }, [dogId, vaccinations, dewormings, ectos, visits, medications]);

  if (!dog || !data) {
    return <Typography>Najprv vytvorte profil psa a zdravotné záznamy.</Typography>;
  }

  const age = dog.dateOfBirth ? Math.floor((Date.now() - new Date(dog.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : dog.ageYears;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Karta pre veta</Typography>
        <Stack direction="row" spacing={1}>
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
        </CardContent></Card>

        <Card><CardContent>
          <Typography variant="h6">Aktuálne lieky a doplnky</Typography>
          {data.activeMeds.length ? data.activeMeds.map((m) => <Typography key={m.id}>• {m.name} — {m.dose}, {m.frequency}</Typography>) : <Typography>Bez aktívnych liekov</Typography>}
        </CardContent></Card>

        <Card><CardContent>
          <Typography variant="h6">Očkovania / antiparazitiká</Typography>
          <Typography>Besnota: {data.rabies ? `${data.rabies.dateApplied} (platné do ${data.rabies.validUntil})` : '–'}</Typography>
          <Typography>Kombinovaná: {data.combined ? `${data.combined.dateApplied} (platné do ${data.combined.validUntil})` : '–'}</Typography>
          <Typography>Odčervenie: {data.lastDeworming ? `${data.lastDeworming.dateGiven} (ďalšie ${data.lastDeworming.nextDueDate})` : '–'}</Typography>
          <Typography>Kliešte/blchy: {data.lastEcto ? `${data.lastEcto.dateGiven} (ďalšie ${data.lastEcto.nextDueDate})` : '–'}</Typography>
        </CardContent></Card>

        <Card><CardContent>
          <Typography variant="h6">Nedávne významné udalosti</Typography>
          {data.significantEvents.length ? data.significantEvents.map((v) => (
            <Typography key={v.id}>• {v.date} {v.clinicName}: {v.diagnosis || v.findings}</Typography>
          )) : <Typography>Bez záznamov</Typography>}
        </CardContent></Card>
      </Stack>
    </Box>
  );
}
