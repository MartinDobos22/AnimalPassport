import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { Science as ScienceIcon, Save as SaveIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAnalyze } from '../hooks/useAnalyze';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ScoreCard from '../components/ScoreCard';
import ProsConsCard from '../components/ProsConsCard';
import RecommendationChip from '../components/RecommendationChip';
import AllergenWarningBanner from '../components/AllergenWarningBanner';
import PersonalizedVerdictCard from '../components/PersonalizedVerdictCard';
import type { SavedAnalysis, PetProfile } from '../types';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function AnalyzePage() {
  const [composition, setComposition] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceLabel, setSourceLabel] = useState('Ručne vložené zloženie');
  const { analyze, analyzeFile, result, loading, error } = useAnalyze();
  const [profiles] = useLocalStorage<PetProfile[]>('granule-check-pet-profiles', []);
  const [, setSavedAnalyses] = useLocalStorage<SavedAnalysis[]>('granule-check-history', []);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [snackOpen, setSnackOpen] = useState(false);
  const navigate = useNavigate();

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleAnalyze = () => {
    if (composition.trim()) {
      setSourceLabel('Ručne vložené zloženie');
      analyze(composition.trim(), selectedProfile);
    }
  };

  const handleFileAnalyze = async () => {
    if (!selectedFile) return;

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = typeof reader.result === 'string' ? reader.result : '';
        const split = raw.split(',');
        resolve(split.length > 1 ? split[1] : raw);
      };
      reader.onerror = () => reject(new Error('Nepodarilo sa načítať súbor.'));
      reader.readAsDataURL(selectedFile);
    });

    setSourceLabel(`Súbor: ${selectedFile.name}`);
    await analyzeFile(
      {
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        base64Data,
      },
      selectedProfile
    );
  };

  const handleSave = () => {
    if (!result) return;
    const entry: SavedAnalysis = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      composition: composition.trim() || sourceLabel,
      sourceLabel,
      result,
      petProfileId: selectedProfile?.id,
      petProfileName: selectedProfile?.name,
    };
    setSavedAnalyses((prev) => [entry, ...prev]);
    setSnackOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  };

  const hasWarnings =
    result &&
    ((result.allergenWarnings && result.allergenWarnings.length > 0) ||
      (result.healthWarnings && result.healthWarnings.length > 0));

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Analyzuj zdravotné podklady
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Vlož text, alebo nahraj fotku/PDF (bloček, krvné testy, alergológia) a nechaj AI vyhodnotiť výsledky
      </Typography>

      {profiles.length > 0 ? (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Analyzovať pre</InputLabel>
          <Select
            value={selectedProfileId}
            label="Analyzovať pre"
            onChange={(e) => setSelectedProfileId(e.target.value)}
          >
            <MenuItem value="">Bez profilu</MenuItem>
            {profiles.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/profily')}
            sx={{ cursor: 'pointer' }}
          >
            Pridaj profil zvieraťa pre personalizovanú analýzu →
          </Link>
        </Typography>
      )}

      <TextField
        fullWidth
        multiline
        minRows={4}
        maxRows={10}
        placeholder="Vlož text zo zdravotnej dokumentácie alebo zloženie..."
        value={composition}
        onChange={(e) => setComposition(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}
        onClick={handleAnalyze}
        disabled={loading || !composition.trim()}
        sx={{ mb: 3, py: 1.5, fontSize: '1rem' }}
      >
        {loading ? 'Analyzujem text...' : 'Analyzovať text'}
      </Button>

      <Divider sx={{ mb: 2 }}>alebo</Divider>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={loading}>
          Vybrať PDF alebo fotku
          <input
            type="file"
            hidden
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (!file) {
                setSelectedFile(null);
                return;
              }
              if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
                setSelectedFile(null);
                return;
              }
              if (file.size > MAX_FILE_SIZE_BYTES) {
                setSelectedFile(null);
                return;
              }
              setSelectedFile(file);
            }}
          />
        </Button>

        {selectedFile && <Chip label={`${selectedFile.name} (${Math.round(selectedFile.size / 1024)} kB)`} />}

        <Button
          variant="contained"
          fullWidth
          onClick={handleFileAnalyze}
          disabled={!selectedFile || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}
        >
          {loading ? 'Analyzujem súbor...' : 'Analyzovať nahraný súbor'}
        </Button>

        <Typography variant="caption" color="text.secondary">
          Podporované typy: PDF, JPG, PNG, WEBP (max 5 MB)
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Zdroj analýzy: {sourceLabel}
          </Alert>

          {hasWarnings && (
            <AllergenWarningBanner
              allergenWarnings={result.allergenWarnings ?? []}
              healthWarnings={result.healthWarnings ?? []}
            />
          )}

          {result.personalizedNote && (
            <PersonalizedVerdictCard note={result.personalizedNote} />
          )}

          <ScoreCard score={result.score} summary={result.summary} />
          <ProsConsCard pros={result.pros} cons={result.cons} />
          <RecommendationChip recommendation={result.recommendation} />

          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ alignSelf: 'center', px: 4 }}
          >
            Uložiť hodnotenie
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message="Hodnotenie bolo uložené"
      />
    </Box>
  );
}
