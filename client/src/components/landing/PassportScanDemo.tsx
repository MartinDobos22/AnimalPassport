import { useState } from 'react';
import { Box, Button, Chip, Stack, Typography, alpha, keyframes, useTheme } from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  AutoAwesome as AiIcon,
  CheckCircle as CheckIcon,
  DocumentScanner as ScanIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { track } from '../../utils/analytics';
import { landingCardSx } from './landingCardSx';

interface ScanLine {
  raw: string;
}

interface ExtractedRecord {
  type: string;
  name: string;
  date: string;
  validUntil?: string;
}

type Phase = 'idle' | 'scanning' | 'done';

const scan = keyframes`
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function PassportScanDemo() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  const [phase, setPhase] = useState<Phase>('idle');

  const lines = t('passportScan.documentLines', { returnObjects: true }) as ScanLine[];
  const records = t('passportScan.records', { returnObjects: true }) as ExtractedRecord[];

  const startScan = () => {
    if (phase === 'scanning') return;
    track('demo_passport_scan');
    setPhase('scanning');
    window.setTimeout(() => setPhase('done'), 1100);
  };

  return (
    <Box sx={{ py: { xs: 8, md: 14 } }}>
      <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2.5, md: 4 } }}>
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
              <ScanIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em' }}
            >
              {t('passportScan.badge')}
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
            {t('passportScan.title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', maxWidth: 580, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            {t('passportScan.subtitle')}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 2.5, md: 4 },
            alignItems: 'stretch',
          }}
        >
          {/* Mock passport photo */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: 4,
              overflow: 'hidden',
              p: { xs: 2.5, md: 3 },
              bgcolor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.black, 0.28)
                  : alpha(theme.palette.warning.main, 0.07),
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: `0 20px 50px ${alpha(theme.palette.common.black, 0.12)}`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, letterSpacing: '0.14em', color: 'text.secondary' }}
              >
                {t('passportScan.documentTitle')}
              </Typography>
              <Chip
                label={t('passportScan.photoTag')}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.common.black, 0.08),
                  color: 'text.secondary',
                }}
              />
            </Stack>
            <Stack spacing={1.25}>
              {lines.map((line) => (
                <Typography
                  key={line.raw}
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    color: theme.palette.text.secondary,
                    borderBottom: `1px dashed ${alpha(theme.palette.text.primary, 0.18)}`,
                    pb: 0.75,
                  }}
                >
                  {line.raw}
                </Typography>
              ))}
            </Stack>

            {phase === 'scanning' && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: theme.palette.primary.main,
                  boxShadow: `0 0 18px 4px ${alpha(theme.palette.primary.main, 0.7)}`,
                  animation: `${scan} 1.1s ease-in-out`,
                }}
              />
            )}
          </Box>

          {/* Extracted result */}
          <Box
            sx={{
              borderRadius: 4,
              p: { xs: 2.5, md: 3 },
              ...landingCardSx(theme),
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <AiIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {t('passportScan.resultTitle')}
              </Typography>
            </Stack>

            {phase !== 'done' ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={2}
                sx={{ flex: 1, py: 3 }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 260 }}
                >
                  {phase === 'scanning' ? t('passportScan.scanning') : t('passportScan.idleHint')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AiIcon />}
                  onClick={startScan}
                  disabled={phase === 'scanning'}
                >
                  {phase === 'scanning' ? t('passportScan.scanningBtn') : t('passportScan.scanBtn')}
                </Button>
              </Stack>
            ) : (
              <Stack spacing={1.25} sx={{ animation: `${fadeIn} 350ms ease` }}>
                {records.map((record) => (
                  <Box
                    key={`${record.name}-${record.date}`}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(
                        theme.palette.success.main,
                        theme.palette.mode === 'light' ? 0.07 : 0.14
                      ),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" gap={1}>
                      <CheckIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.2 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', fontWeight: 600 }}
                        >
                          {record.type}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {record.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {record.date}
                          {record.validUntil ? ` · ${record.validUntil}` : ''}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
                <Button
                  variant="text"
                  size="small"
                  startIcon={<ReplayIcon />}
                  onClick={() => setPhase('idle')}
                  sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                >
                  {t('passportScan.again')}
                </Button>
              </Stack>
            )}
          </Box>
        </Box>

        <Stack alignItems="center" sx={{ mt: 3.5 }}>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowIcon />}
            onClick={() => {
              track('cta_register', { location: 'passport_scan_demo' });
              navigate('/register');
            }}
            sx={{ fontSize: '1rem', px: 4 }}
          >
            {t('passportScan.cta')}
          </Button>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1.25 }}>
            {t('passportScan.ctaNote')}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
