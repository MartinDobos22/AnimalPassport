import { useState, type KeyboardEvent } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  CheckCircle as SafeIcon,
  ErrorOutline as UnsafeIcon,
  HelpOutline as QAIcon,
  Search as SearchIcon,
  WarningAmber as CautionIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { track } from '../../utils/analytics';
import { landingCardSx } from './landingCardSx';

type Verdict = 'SAFE' | 'CAUTION' | 'UNSAFE';

interface MockResponse {
  verdict: Verdict;
  short: string;
  explanation: string;
  alternatives?: string[];
  warnings?: string[];
}

const VERDICT_ICONS: Record<
  Verdict,
  { icon: typeof SafeIcon; toneKey: 'success' | 'warning' | 'error' }
> = {
  SAFE: { icon: SafeIcon, toneKey: 'success' },
  CAUTION: { icon: CautionIcon, toneKey: 'warning' },
  UNSAFE: { icon: UnsafeIcon, toneKey: 'error' },
};

export default function InteractiveAiDemo() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('landing');
  const { t: tAnalyze } = useTranslation('analyze');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ query: string; data: MockResponse } | null>(null);

  const responses = t('demo.responses', { returnObjects: true }) as Record<string, MockResponse>;
  const quickFills = t('demo.quickFills', { returnObjects: true }) as string[];
  const fallback = t('demo.fallback', { returnObjects: true }) as MockResponse;

  const handleAsk = (raw?: string) => {
    const q = (raw ?? query).trim();
    if (!q || loading) return;
    setQuery(q);
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const key = q.toLowerCase();
      // Match longer, more specific keys first ("pineapple" before "apple").
      const matched = Object.keys(responses)
        .sort((a, b) => b.length - a.length)
        .find((k) => key.includes(k));
      const data = matched ? responses[matched] : fallback;
      track('food_query', { query: key.slice(0, 40), hit: matched ? 'yes' : 'no' });
      setResult({ query: q, data });
      setLoading(false);
    }, 380);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const renderResult = (entry: { query: string; data: MockResponse }) => {
    const meta = VERDICT_ICONS[entry.data.verdict];
    const verdictLabel = tAnalyze(`foodSafety.verdicts.${entry.data.verdict}` as never);
    const Icon = meta.icon;
    const tone = theme.palette[meta.toneKey].main;
    return (
      <Box
        sx={{
          mt: 3,
          p: { xs: 2, md: 2.5 },
          borderRadius: 2,
          bgcolor: alpha(tone, theme.palette.mode === 'light' ? 0.08 : 0.16),
          border: `1px solid ${alpha(tone, 0.35)}`,
          animation: 'demo-fade-in 350ms ease',
          '@keyframes demo-fade-in': {
            from: { opacity: 0, transform: 'translateY(12px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Stack direction="row" alignItems="flex-start" gap={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: alpha(tone, 0.2),
              color: tone,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon />
          </Box>
          <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.75}>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <Chip
                size="small"
                label={verdictLabel}
                sx={{
                  bgcolor: tone,
                  color: meta.toneKey === 'warning' ? theme.palette.warning.contrastText : '#fff',
                  fontWeight: 700,
                  height: 24,
                  fontSize: '0.7rem',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  letterSpacing: 0,
                  fontStyle: 'italic',
                }}
              >
                {t('demo.resultLabels.question')} {entry.query}
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {entry.data.short}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {entry.data.explanation}
            </Typography>
            {entry.data.warnings && (
              <Box sx={{ mt: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}
                >
                  {t('demo.resultLabels.warnings')}
                </Typography>
                <Stack component="ul" sx={{ pl: 2.25, m: 0 }} spacing={0.25}>
                  {entry.data.warnings.map((w, i) => (
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
            {entry.data.alternatives && (
              <Box sx={{ mt: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}
                >
                  {t('demo.resultLabels.alternatives')}
                </Typography>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {entry.data.alternatives.map((a, i) => (
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
          </Stack>
        </Stack>
      </Box>
    );
  };

  return (
    <Box sx={{ py: { xs: 8, md: 14 } }}>
      <Box sx={{ maxWidth: 880, mx: 'auto', px: { xs: 2.5, md: 4 } }}>
        <Stack alignItems="center" spacing={2} sx={{ mb: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QAIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}
            >
              {t('demo.badge')}
            </Typography>
          </Stack>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            {t('demo.title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: 540,
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            {t('demo.subtitle')}
          </Typography>
        </Stack>

        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 4,
            ...landingCardSx(theme),
          }}
        >
          <Stack direction="row" gap={1} alignItems="stretch">
            <TextField
              fullWidth
              size="medium"
              placeholder={t('demo.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              InputProps={{
                sx: { borderRadius: 2, bgcolor: 'background.paper' },
                startAdornment: (
                  <SearchIcon sx={{ fontSize: 22, color: 'text.secondary', mr: 1 }} />
                ),
              }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={() => handleAsk()}
              disabled={loading || !query.trim()}
              sx={{ minWidth: 130, flexShrink: 0, fontSize: '1rem' }}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? t('demo.askingBtn') : t('demo.askBtn')}
            </Button>
          </Stack>

          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.disabled',
                alignSelf: 'center',
                textTransform: 'none',
                letterSpacing: 0,
                mr: 0.5,
              }}
            >
              {t('demo.tryLabel')}
            </Typography>
            {quickFills.map((q) => (
              <Chip
                key={q}
                label={q}
                size="small"
                clickable
                variant="outlined"
                onClick={() => handleAsk(q)}
                sx={{ fontWeight: 500 }}
              />
            ))}
          </Stack>

          {result && renderResult(result)}
        </Box>

        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Button
            variant="text"
            endIcon={<ArrowIcon />}
            onClick={() => {
              track('cta_analyze', { location: 'food_demo' });
              navigate('/analyza');
            }}
            sx={{ color: 'primary.main' }}
          >
            {t('demo.continueBtn')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
