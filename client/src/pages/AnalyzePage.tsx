import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { Science as ScienceIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAnalyze } from '../hooks/useAnalyze';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ScoreCard from '../components/ScoreCard';
import ProsConsCard from '../components/ProsConsCard';
import RecommendationChip from '../components/RecommendationChip';
import AllergenWarningBanner from '../components/AllergenWarningBanner';
import PersonalizedVerdictCard from '../components/PersonalizedVerdictCard';
import type { SavedAnalysis, PetProfile } from '../types';

export default function AnalyzePage() {
  const [composition, setComposition] = useState('');
  const [sourceLabel, setSourceLabel] = useState('Ručne vložené zloženie');
  const { analyze, result, loadingText, error } = useAnalyze();
  const [profiles] = useLocalStorage<PetProfile[]>('granule-check-pet-profiles', []);
  const [, setSavedAnalyses] = useLocalStorage<SavedAnalysis[]>('granule-check-history', []);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [snackOpen, setSnackOpen] = useState(false);
  const navigate = useNavigate();

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const displayResult = result ?? null;

  const handleAnalyze = () => {
    if (composition.trim()) {
      setSourceLabel('Ručne vložené zloženie');
      analyze(composition.trim(), selectedProfile);
    }
  };

  const handleSave = () => {
    if (!displayResult) return;
    const entry: SavedAnalysis = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      composition: composition.trim() || sourceLabel,
      sourceLabel,
      result: displayResult,
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
    displayResult &&
    ((displayResult.allergenWarnings && displayResult.allergenWarnings.length > 0) ||
      (displayResult.healthWarnings && displayResult.healthWarnings.length > 0));

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Analyzuj krmivo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Vlož zloženie krmiva ako text. AI vyhodnotí kvalitu, riziká alergénov a odporúčanie pre psa.
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
        placeholder="Vlož zloženie krmiva..."
        value={composition}
        onChange={(e) => setComposition(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loadingText}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={loadingText ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}
        onClick={handleAnalyze}
        disabled={loadingText || !composition.trim()}
        sx={{ mb: 3, py: 1.5, fontSize: '1rem' }}
      >
        {loadingText ? 'Analyzujem text...' : 'Analyzovať text'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {displayResult && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Zdroj analýzy: {sourceLabel}
          </Alert>

          {hasWarnings && (
            <AllergenWarningBanner
              allergenWarnings={displayResult.allergenWarnings ?? []}
              healthWarnings={displayResult.healthWarnings ?? []}
            />
          )}

          {displayResult.personalizedNote && (
            <PersonalizedVerdictCard note={displayResult.personalizedNote} />
          )}

          <ScoreCard score={displayResult.score} summary={displayResult.summary} />
          <ProsConsCard pros={displayResult.pros} cons={displayResult.cons} />
          <RecommendationChip recommendation={displayResult.recommendation} />

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
