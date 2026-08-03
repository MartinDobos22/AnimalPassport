import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  History as HistoryIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Theme } from '@mui/material/styles';
import { useAnalyze } from '../hooks/useAnalyze';
import { useActivePet } from '../hooks/useActivePet';
import { useHealthData } from '../hooks/useHealthData';
import SetCurrentFoodDialog from '../components/food/SetCurrentFoodDialog';
import AnalyzeHero from '../components/analyze/AnalyzeHero';
import FeatureIntro from '../components/FeatureIntro';
import PageContainer from '../components/ui/PageContainer';
import HelpHint from '../components/HelpHint';
import FoodSafetyCheck from '../components/analyze/FoodSafetyCheck';
import ScoreCard from '../components/ScoreCard';
import ProsConsCard from '../components/ProsConsCard';
import RecommendationChip from '../components/RecommendationChip';
import AllergenWarningBanner from '../components/AllergenWarningBanner';
import PersonalizedVerdictCard from '../components/PersonalizedVerdictCard';
import AiDisclaimer from '../components/AiDisclaimer';
import { MAX_FILE_SIZE_BYTES, SUPPORTED_FILE_TYPES } from '../components/healthPassport/constants';
import { formatDateShort } from '../utils/relativeDate';
import type { AnalysisResult } from '../types';
import type { DietEntry } from '../types/petHealth';

function deriveSuitability(result: AnalysisResult): NonNullable<DietEntry['suitabilityStatus']> {
  const critical =
    (result.allergenWarnings ?? []).some((w) => w.severity === 'critical') ||
    (result.healthWarnings ?? []).some((w) => w.severity === 'critical');
  if (critical) return 'UNSUITABLE';
  const anyWarning =
    (result.allergenWarnings ?? []).length > 0 || (result.healthWarnings ?? []).length > 0;
  if (anyWarning) return 'RISKY';
  return 'SUITABLE';
}

const readFileAsBase64 = (file: File) =>
  new Promise<{ base64: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      const base64 = raw.split(',')[1] ?? '';
      if (!base64) {
        reject(new Error('FILE_LOAD_FAILED'));
        return;
      }
      resolve({ base64 });
    };
    reader.onerror = () => reject(new Error('FILE_LOAD_FAILED'));
    reader.readAsDataURL(file);
  });

const scoreColor = (theme: Theme, score: number) => {
  if (score >= 70) return theme.palette.success.main;
  if (score >= 40) return theme.palette.warning.main;
  return theme.palette.error.main;
};

export default function AnalyzePage() {
  const theme = useTheme();
  const { t } = useTranslation('analyze');
  const [composition, setComposition] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const {
    analyze,
    extractTextOnly,
    cancel,
    result,
    loadingText,
    extractingText,
    error,
    extractError,
    slow,
  } = useAnalyze();
  const { t: tCommon } = useTranslation();
  const { activePet } = useActivePet();
  const { savedAnalyses, addSavedAnalysis } = useHealthData();
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [scanInfo, setScanInfo] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const displayResult = result ?? null;

  const handleAnalyze = () => {
    if (composition.trim()) {
      setSourceLabel(t('form.sourceManual'));
      analyze(composition.trim(), activePet ?? undefined);
    }
  };

  const handlePickFile = () => {
    setScanError(null);
    setScanInfo(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      setScanError(t('errors.unsupportedFileType'));
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setScanError(t('errors.fileTooLarge'));
      return;
    }

    try {
      const { base64 } = await readFileAsBase64(file);
      const extracted = await extractTextOnly({
        fileName: file.name,
        mimeType: file.type,
        base64Data: base64,
      });
      if (extracted) {
        setComposition(extracted);
        setSourceLabel(t('form.sourcePhoto', { fileName: file.name }));
        setScanInfo(t('form.textPrefilled'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setScanError(msg === 'FILE_LOAD_FAILED' || !msg ? t('errors.fileLoadFailed') : msg);
    }
  };

  const handleSave = async () => {
    if (!displayResult) return;
    await addSavedAnalysis({
      date: new Date().toISOString(),
      composition: composition.trim() || sourceLabel,
      sourceLabel,
      result: displayResult,
      petProfileId: activePet?.id,
      petProfileName: activePet?.name,
    });
    setSnackMessage(t('snack.saved'));
    setSnackOpen(true);
  };

  const suitabilityReasons = displayResult
    ? deriveSuitability(displayResult) === 'SUITABLE'
      ? [t('suitabilityReasonNoAllergens')]
      : (displayResult.recommendation?.notRecommendedFor ?? [])
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  };

  const hasWarnings =
    displayResult &&
    ((displayResult.allergenWarnings && displayResult.allergenWarnings.length > 0) ||
      (displayResult.healthWarnings && displayResult.healthWarnings.length > 0));

  const busy = loadingText || extractingText;
  const recentAnalyses = savedAnalyses.slice(0, 3);

  return (
    <PageContainer>
      <FeatureIntro featureKey="analyze" icon={<ScienceIcon />} />
      <AnalyzeHero />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
            <ScienceIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('form.analyzeComposition')}
            </Typography>
            <HelpHint text={t('hints.textInput')} />
          </Stack>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <Stack direction="row" gap={1} sx={{ mb: 1.5 }} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={
                extractingText ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <PhotoCameraIcon />
                )
              }
              onClick={handlePickFile}
              disabled={busy}
            >
              {extractingText ? t('form.scanning') : t('form.scanLabel')}
            </Button>
            <HelpHint text={t('hints.fileUpload')} />
          </Stack>

          {scanInfo && (
            <Alert severity="success" onClose={() => setScanInfo(null)} sx={{ mb: 2 }}>
              {scanInfo}
            </Alert>
          )}
          {(scanError || extractError) && (
            <Alert severity="error" onClose={() => setScanError(null)} sx={{ mb: 2 }}>
              {scanError ?? extractError}
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            minRows={5}
            maxRows={12}
            placeholder={t('form.placeholder')}
            value={composition}
            onChange={(e) => setComposition(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            sx={{ mb: 1.5 }}
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={
              loadingText ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />
            }
            onClick={handleAnalyze}
            disabled={busy || !composition.trim()}
            sx={{ py: 1.25, fontSize: '0.95rem' }}
          >
            {loadingText ? t('form.analyzing') : t('form.analyze')}
          </Button>
          {busy && slow && (
            <Alert
              severity="info"
              sx={{ mt: 1.5, borderRadius: 2 }}
              action={
                <Button color="inherit" size="small" onClick={cancel}>
                  {tCommon('aiProgress.cancel')}
                </Button>
              }
            >
              {tCommon('aiProgress.slow')}
            </Alert>
          )}
          {!activePet && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1.5,
                color: 'text.secondary',
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              {t('form.addProfileHint')}{' '}
              <Box
                component="span"
                onClick={() => navigate('/profily')}
                sx={{ cursor: 'pointer', textDecoration: 'underline', color: 'primary.main' }}
              >
                {t('form.addProfileHintProfiles')}
              </Box>{' '}
              {t('form.addProfileHintSuffix')}
            </Typography>
          )}
        </Card>

        <FoodSafetyCheck />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {displayResult && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
          <AiDisclaimer sx={{ borderRadius: 3 }} />
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

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignSelf: 'center' }}>
            <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSave} sx={{ px: 4 }}>
              {t('form.saveRating')}
            </Button>
            {activePet && (
              <Button
                variant="contained"
                startIcon={<RestaurantIcon />}
                onClick={() => setFoodDialogOpen(true)}
                sx={{ px: 4 }}
              >
                {tCommon('food.setAsCurrent')}
              </Button>
            )}
          </Stack>
        </Box>
      )}

      <Card sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
          <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
            {t('recentAnalyses.title')}
          </Typography>
          {savedAnalyses.length > 0 && (
            <Button
              size="small"
              onClick={() => navigate('/historia')}
              sx={{ minHeight: 28, py: 0.25 }}
            >
              {t('history.runAnalysis')}
            </Button>
          )}
        </Stack>

        {recentAnalyses.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 2.5, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('recentAnalyses.noAnalyses')}
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1}>
            {recentAnalyses.map((entry) => (
              <Stack
                key={entry.id}
                direction="row"
                alignItems="center"
                gap={1.5}
                onClick={() => navigate('/historia')}
                sx={{
                  cursor: 'pointer',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: alpha(scoreColor(theme, entry.result.score), 0.16),
                    color: scoreColor(theme, entry.result.score),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  {entry.result.score}
                </Box>
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {entry.sourceLabel || t('defaultLabel')}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
                  >
                    {formatDateShort(entry.date)}
                    {entry.petProfileName ? ` · ${entry.petProfileName}` : ''}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>

      {activePet && displayResult && (
        <SetCurrentFoodDialog
          open={foodDialogOpen}
          onClose={() => setFoodDialogOpen(false)}
          petId={activePet.id}
          defaultName={sourceLabel || t('foodFromAnalysis')}
          defaultType="main"
          suitabilityStatus={deriveSuitability(displayResult)}
          suitabilityReasons={suitabilityReasons}
          onSaved={() => {
            setSnackMessage(t('snack.savedWithPet', { petName: activePet.name }));
            setSnackOpen(true);
          }}
        />
      )}

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={snackMessage}
      />
    </PageContainer>
  );
}
