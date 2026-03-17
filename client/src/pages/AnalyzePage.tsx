import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Snackbar,
  Stack,
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

const SUPPORTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export default function AnalyzePage() {
  const [composition, setComposition] = useState('');
  const [sourceLabel, setSourceLabel] = useState('Ručne vložené zloženie');
  const { analyze, analyzeFile, result, fileResult, loadingText, loadingFile, error } = useAnalyze();
  const [profiles] = useLocalStorage<PetProfile[]>('granule-check-pet-profiles', []);
  const [, setSavedAnalyses] = useLocalStorage<SavedAnalysis[]>('granule-check-history', []);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [snackOpen, setSnackOpen] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const navigate = useNavigate();

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const displayResult = result ?? fileResult?.feedAnalysis ?? null;

  const handleAnalyze = () => {
    if (composition.trim()) {
      setSourceLabel('Ručne vložené zloženie');
      analyze(composition.trim(), selectedProfile);
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setAttachmentName('');
      setAttachmentError('');
      return;
    }

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      setAttachmentName('');
      setAttachmentError('Podporované sú PDF, JPG, PNG a WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAttachmentName('');
      setAttachmentError('Súbor je príliš veľký (max 5 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      const base64Data = raw.split(',')[1] ?? '';
      if (!base64Data) {
        setAttachmentError('Nepodarilo sa načítať súbor.');
        return;
      }

      setAttachmentName(file.name);
      setAttachmentError('');
      setSourceLabel(`OCR súbor: ${file.name}`);
      await analyzeFile({ fileName: file.name, mimeType: file.type, base64Data });
    };
    reader.onerror = () => setAttachmentError('Nepodarilo sa načítať súbor.');
    reader.readAsDataURL(file);
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
        Analyzuj zdravotné podklady
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Vlož text, alebo nahraj PDF/fotku. AI extrahuje text, vyhodnotí kontext dokumentu a pri zložení krmiva vytvorí aj hodnotenie.
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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>Nahrať PDF/fotku
          <input
            hidden
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
        </Button>
        {attachmentName && <Chip label={attachmentName} />}
      </Stack>

      {attachmentError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>
          {attachmentError}
        </Alert>
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
        disabled={loadingText || loadingFile}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={loadingText ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}
        onClick={handleAnalyze}
        disabled={loadingText || loadingFile || !composition.trim()}
        sx={{ mb: 3, py: 1.5, fontSize: '1rem' }}
      >
        {loadingText ? 'Analyzujem text...' : 'Analyzovať text'}
      </Button>

      {loadingFile && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          Extrahujem text a vyhodnocujem kontext dokumentu...
        </Alert>
      )}

      {fileResult && (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Alert severity="success" sx={{ borderRadius: 3 }}>
            Text bol extrahovaný zo zdroja: {fileResult.source}
          </Alert>
          {fileResult.contextAnalysis && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              Typ dokumentu: <strong>{fileResult.contextAnalysis.documentType}</strong> ({fileResult.contextAnalysis.confidence})
              <br />
              {fileResult.contextAnalysis.summary}
            </Alert>
          )}
          <Button variant="text" onClick={() => setComposition(fileResult.extractedText)}>
            Vložiť extrahovaný text do poľa
          </Button>
        </Box>
      )}

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
