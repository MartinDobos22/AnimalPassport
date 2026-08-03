import { useState, type KeyboardEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as SafeIcon,
  Close as CloseIcon,
  ErrorOutline as UnsafeIcon,
  HelpOutline as QAIcon,
  InfoOutlined as InvalidIcon,
  Search as SearchIcon,
  WarningAmber as CautionIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import HelpHint from '../HelpHint';
import { useActivePet } from '../../hooks/useActivePet';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { askFoodSafety } from '../../services/api';
import type { FoodSafetyResult, FoodSafetyVerdict } from '../../types';

const VERDICT_ICON: Record<FoodSafetyVerdict, typeof SafeIcon> = {
  SAFE: SafeIcon,
  CAUTION: CautionIcon,
  UNSAFE: UnsafeIcon,
  INVALID: InvalidIcon,
};

const VERDICT_TONE: Record<FoodSafetyVerdict, 'success' | 'warning' | 'error' | 'info'> = {
  SAFE: 'success',
  CAUTION: 'warning',
  UNSAFE: 'error',
  INVALID: 'info',
};

const RECENT_KEY = 'granule-check-food-safety-recent';

export default function FoodSafetyCheck() {
  const theme = useTheme();
  const { t } = useTranslation('analyze');
  const { activePet } = useActivePet();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodSafetyResult | null>(null);
  const [recent, setRecent] = useLocalStorage<string[]>(RECENT_KEY, []);

  const handleAsk = async (raw?: string) => {
    const q = (raw ?? query).trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setQuery(q);
    try {
      const response = await askFoodSafety(q, activePet ?? undefined);
      setResult(response);
      if (response.verdict !== 'INVALID') {
        setRecent((prev) => {
          const next = [q, ...prev.filter((p) => p.toLowerCase() !== q.toLowerCase())];
          return next.slice(0, 5);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.noAnswer'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    setQuery('');
  };

  const renderResult = (r: FoodSafetyResult) => {
    const Icon = VERDICT_ICON[r.verdict];
    const toneKey = VERDICT_TONE[r.verdict];
    const toneColor = theme.palette[toneKey].main;
    return (
      <Box
        sx={{
          mt: 2,
          p: 1.75,
          borderRadius: 3,
          bgcolor: alpha(toneColor, theme.palette.mode === 'light' ? 0.08 : 0.16),
          border: `1px solid ${alpha(toneColor, 0.35)}`,
        }}
      >
        <Stack direction="row" alignItems="flex-start" gap={1.25}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: alpha(toneColor, 0.18),
              color: toneColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon />
          </Box>
          <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.5}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Chip
                size="small"
                label={t(`foodSafety.verdicts.${r.verdict}`)}
                sx={{
                  bgcolor: toneColor,
                  color: toneKey === 'warning' ? theme.palette.warning.contrastText : '#fff',
                  fontWeight: 700,
                  height: 22,
                  fontSize: '0.7rem',
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
              >
                {r.query}
              </Typography>
            </Stack>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {r.shortAnswer}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {r.explanation}
            </Typography>
            {r.warnings && r.warnings.length > 0 && (
              <Box sx={{ mt: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}
                >
                  {t('foodSafety.watchOut')}
                </Typography>
                <Stack spacing={0.25} component="ul" sx={{ pl: 2.25, m: 0 }}>
                  {r.warnings.map((w, i) => (
                    <Typography
                      key={i}
                      component="li"
                      variant="body2"
                      sx={{ color: 'text.secondary' }}
                    >
                      {w}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
            {r.alternatives && r.alternatives.length > 0 && (
              <Box sx={{ mt: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}
                >
                  {t('foodSafety.alternatives')}
                </Typography>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {r.alternatives.map((a, i) => (
                    <Chip
                      key={i}
                      label={a}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            {r.source === 'mock' && (
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', textTransform: 'none', letterSpacing: 0, mt: 0.5 }}
              >
                {t('foodSafety.offlineAnswer')}
              </Typography>
            )}
          </Stack>
          <IconButton size="small" onClick={handleClear} aria-label={t('foodSafety.clearAnswer')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    );
  };

  return (
    <Card sx={{ p: { xs: 2, md: 2.5 }, height: '100%' }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <QAIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('foodSafety.title')}
        </Typography>
        <HelpHint text={t('hints.foodSafety')} />
      </Stack>

      <Stack direction="row" gap={1} alignItems="stretch">
        <TextField
          fullWidth
          size="small"
          placeholder={t('foodSafety.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={() => handleAsk()}
          disabled={loading || !query.trim()}
          sx={{ minWidth: 100, flexShrink: 0 }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
        >
          {loading ? '' : t('foodSafety.ask')}
        </Button>
      </Stack>

      {recent.length > 0 && !result && !loading && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
            {t('foodSafety.recentQuestions')}
          </Typography>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {recent.map((r) => (
              <Chip
                key={r}
                label={r}
                size="small"
                clickable
                variant="outlined"
                onClick={() => handleAsk(r)}
              />
            ))}
          </Stack>
        </Box>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}

      {result && renderResult(result)}
    </Card>
  );
}
