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
  const { analyze, result, loading, error } = useAnalyze();
  const [profiles] = useLocalStorage<PetProfile[]>('granule-check-pet-profiles', []);
  const [, setSavedAnalyses] = useLocalStorage<SavedAnalysis[]>('granule-check-history', []);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [snackOpen, setSnackOpen] = useState(false);
  const navigate = useNavigate();

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleAnalyze = () => {
    if (composition.trim()) {
      analyze(composition.trim(), selectedProfile);
    }
  };

  const handleSave = () => {
    if (!result) return;
    const entry: SavedAnalysis = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      composition: composition.trim(),
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
        Analyzuj zloženie granúl
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Skopíruj zloženie z obalu krmiva a zisti jeho kvalitu
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
        placeholder="Vlož zloženie z obalu krmiva... napr. kuracie mäso (30%), ryža, kukurica, kurací tuk, repný rezok, lososový olej, minerály, vitamíny..."
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
        sx={{ mb: 4, py: 1.5, fontSize: '1rem' }}
      >
        {loading ? 'Analyzujem zloženie...' : 'Analyzovať'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 1. Allergen & health warnings — ALWAYS first, impossible to miss */}
          {hasWarnings && (
            <AllergenWarningBanner
              allergenWarnings={result.allergenWarnings ?? []}
              healthWarnings={result.healthWarnings ?? []}
            />
          )}

          {/* 2. Personalized verdict card */}
          {result.personalizedNote && (
            <PersonalizedVerdictCard note={result.personalizedNote} />
          )}

          {/* 3. General score card */}
          <ScoreCard score={result.score} summary={result.summary} />

          {/* 4. Pros & cons */}
          <ProsConsCard pros={result.pros} cons={result.cons} />

          {/* 5. Recommendation */}
          <RecommendationChip recommendation={result.recommendation} />

          {/* 6. Save button */}
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
