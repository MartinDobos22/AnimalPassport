import { useState } from 'react';
import {
  Autocomplete,
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Pets as PetsIcon,
} from '@mui/icons-material';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { PetProfile, AnimalType, AnimalSize, AnimalLifeStage, ActivityLevel } from '../types';

const ALLERGY_SUGGESTIONS = [
  'Kura/kuriatko', 'Hovädzie', 'Jahňacie', 'Ryby', 'Vajcia',
  'Pšenica', 'Kukurica', 'Sója', 'Mliečne produkty', 'Lepok',
];

const INTOLERANCE_SUGGESTIONS = [
  'Lepok', 'Laktóza', 'Kukurica', 'Sója', 'Obilniny',
];

const HEALTH_SUGGESTIONS = [
  'Diabetes', 'Problémy s obličkami', 'Obezita', 'Problémy s kĺbmi',
  'Citlivé trávenie', 'Srdcové problémy', 'Problémy s kožou', 'Pankreatitída',
];

const EMPTY_PROFILE: Omit<PetProfile, 'id'> = {
  name: '',
  animalType: 'dog',
  breed: '',
  ageYears: undefined,
  ageMonths: undefined,
  weightKg: undefined,
  size: undefined,
  lifeStage: undefined,
  activityLevel: undefined,
  allergies: [],
  intolerances: [],
  healthConditions: [],
  notes: '',
};

export default function PetProfilePage() {
  const [profiles, setProfiles] = useLocalStorage<PetProfile[]>('granule-check-pet-profiles', []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<PetProfile, 'id'>>(EMPTY_PROFILE);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_PROFILE });
    setDialogOpen(true);
  };

  const openEdit = (profile: PetProfile) => {
    setEditingId(profile.id);
    setForm({
      name: profile.name,
      animalType: profile.animalType,
      breed: profile.breed ?? '',
      ageYears: profile.ageYears,
      ageMonths: profile.ageMonths,
      weightKg: profile.weightKg,
      size: profile.size,
      lifeStage: profile.lifeStage,
      activityLevel: profile.activityLevel,
      allergies: [...profile.allergies],
      intolerances: [...profile.intolerances],
      healthConditions: [...profile.healthConditions],
      notes: profile.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === editingId ? { ...form, id: editingId } : p))
      );
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      setProfiles((prev) => [...prev, { ...form, id }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const animalLabel = (type: AnimalType) =>
    type === 'dog' ? 'Pes' : type === 'cat' ? 'Mačka' : 'Iné';

  const formatAge = (profile: PetProfile) => {
    const parts: string[] = [];
    if (profile.ageYears) parts.push(`${profile.ageYears} r.`);
    if (profile.ageMonths) parts.push(`${profile.ageMonths} mes.`);
    return parts.join(' ') || undefined;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Profily zvieratiek
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Pridaj profil zvieraťa pre personalizovanú analýzu krmiva
      </Typography>

      <Button variant="contained" startIcon={<AddIcon />} onClick={openNew} sx={{ mb: 3 }}>
        Pridať profil
      </Button>

      {profiles.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          Zatiaľ nemáte žiadne profily. Pridajte prvý profil zvieratka.
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {profiles.map((profile) => (
          <Card key={profile.id} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
              <PetsIcon color="primary" sx={{ fontSize: 40 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {profile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[
                    animalLabel(profile.animalType),
                    profile.breed,
                    formatAge(profile),
                    profile.weightKg ? `${profile.weightKg} kg` : undefined,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
                {(profile.allergies.length > 0 || profile.intolerances.length > 0) && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {profile.allergies.map((a) => (
                      <Chip key={a} label={a} size="small" color="error" variant="outlined" />
                    ))}
                    {profile.intolerances.map((i) => (
                      <Chip key={i} label={i} size="small" color="warning" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Box>
              <IconButton onClick={() => openEdit(profile)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleDelete(profile.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Upraviť profil' : 'Nový profil'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Meno"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />

          <FormControl fullWidth required>
            <InputLabel>Typ zvieraťa</InputLabel>
            <Select
              value={form.animalType}
              label="Typ zvieraťa"
              onChange={(e) => setForm({ ...form, animalType: e.target.value as AnimalType })}
            >
              <MenuItem value="dog">Pes</MenuItem>
              <MenuItem value="cat">Mačka</MenuItem>
              <MenuItem value="other">Iné</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Plemeno"
            value={form.breed ?? ''}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Vek – roky"
              type="number"
              inputProps={{ min: 0, max: 30 }}
              value={form.ageYears ?? ''}
              onChange={(e) => setForm({ ...form, ageYears: e.target.value ? Number(e.target.value) : undefined })}
              fullWidth
            />
            <TextField
              label="Vek – mesiace"
              type="number"
              inputProps={{ min: 0, max: 11 }}
              value={form.ageMonths ?? ''}
              onChange={(e) => setForm({ ...form, ageMonths: e.target.value ? Number(e.target.value) : undefined })}
              fullWidth
            />
          </Box>

          <TextField
            label="Váha (kg)"
            type="number"
            inputProps={{ min: 0, step: 0.1 }}
            value={form.weightKg ?? ''}
            onChange={(e) => setForm({ ...form, weightKg: e.target.value ? Number(e.target.value) : undefined })}
            fullWidth
          />

          {form.animalType === 'dog' && (
            <FormControl fullWidth>
              <InputLabel>Veľkosť</InputLabel>
              <Select
                value={form.size ?? ''}
                label="Veľkosť"
                onChange={(e) => setForm({ ...form, size: (e.target.value || undefined) as AnimalSize | undefined })}
              >
                <MenuItem value="">–</MenuItem>
                <MenuItem value="mini">Mini (&lt;5 kg)</MenuItem>
                <MenuItem value="small">Malý (5–10 kg)</MenuItem>
                <MenuItem value="medium">Stredný (10–25 kg)</MenuItem>
                <MenuItem value="large">Veľký (25–45 kg)</MenuItem>
                <MenuItem value="giant">Obrovský (&gt;45 kg)</MenuItem>
              </Select>
            </FormControl>
          )}

          <FormControl fullWidth>
            <InputLabel>Životné štádium</InputLabel>
            <Select
              value={form.lifeStage ?? ''}
              label="Životné štádium"
              onChange={(e) => setForm({ ...form, lifeStage: (e.target.value || undefined) as AnimalLifeStage | undefined })}
            >
              <MenuItem value="">–</MenuItem>
              <MenuItem value="puppy">{form.animalType === 'cat' ? 'Mačiatko' : 'Šteňa'}</MenuItem>
              <MenuItem value="junior">Junior</MenuItem>
              <MenuItem value="adult">Dospelý</MenuItem>
              <MenuItem value="senior">Senior</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Úroveň aktivity</InputLabel>
            <Select
              value={form.activityLevel ?? ''}
              label="Úroveň aktivity"
              onChange={(e) => setForm({ ...form, activityLevel: (e.target.value || undefined) as ActivityLevel | undefined })}
            >
              <MenuItem value="">–</MenuItem>
              <MenuItem value="low">Nízka</MenuItem>
              <MenuItem value="moderate">Stredná</MenuItem>
              <MenuItem value="high">Vysoká</MenuItem>
              <MenuItem value="working">Pracovný pes</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            freeSolo
            options={ALLERGY_SUGGESTIONS}
            value={form.allergies}
            onChange={(_e, newVal) => setForm({ ...form, allergies: newVal })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} color="error" variant="outlined" size="small" {...getTagProps({ index })} key={option} />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Alergie" placeholder="Pridať alergiu..." />}
          />

          <Autocomplete
            multiple
            freeSolo
            options={INTOLERANCE_SUGGESTIONS}
            value={form.intolerances}
            onChange={(_e, newVal) => setForm({ ...form, intolerances: newVal })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} color="warning" variant="outlined" size="small" {...getTagProps({ index })} key={option} />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Intolerancie" placeholder="Pridať intoleranciu..." />}
          />

          <Autocomplete
            multiple
            freeSolo
            options={HEALTH_SUGGESTIONS}
            value={form.healthConditions}
            onChange={(_e, newVal) => setForm({ ...form, healthConditions: newVal })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} color="info" variant="outlined" size="small" {...getTagProps({ index })} key={option} />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Zdravotné stavy" placeholder="Pridať zdravotný stav..." />}
          />

          <TextField
            label="Poznámky"
            multiline
            minRows={2}
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Zrušiť</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
            {editingId ? 'Uložiť' : 'Pridať'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
