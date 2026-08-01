import { type KeyboardEvent, type MouseEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { HistoryOutlined as HistoryIcon } from '@mui/icons-material';
import type { Theme } from '@mui/material/styles';

export type HealthTileSection = 'PREVENTIVE' | 'CONDITION' | 'EXAM';
export type HealthTileTone = 'error' | 'warning' | 'success' | 'info' | 'neutral';

export interface HealthTileState {
  label: string;
  tone: HealthTileTone;
}

export interface HealthMetricTile {
  id: string;
  section: HealthTileSection;
  icon: ReactElement;
  /** Domain color for the icon chip and left accent bar. */
  accentColor: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  state?: HealthTileState;
  /** 0–100 elapsed-interval bar, colored by the state tone. Preventive only. */
  progress?: number;
  onOpen?: () => void;
  /** Optional top-right affordance — e.g. per-category record history. */
  onHistory?: () => void;
}

function toneColor(theme: Theme, tone: HealthTileTone): string {
  switch (tone) {
    case 'error':
      return theme.palette.error.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'success':
      return theme.palette.success.main;
    case 'info':
      return theme.palette.info.main;
    default:
      return theme.palette.text.secondary;
  }
}

interface Props {
  metric: HealthMetricTile;
}

export default function HealthTile({ metric }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('healthPassport');
  const { icon, accentColor, eyebrow, title, subtitle, state, progress, onOpen, onHistory } =
    metric;
  const stateColor = state ? toneColor(theme, state.tone) : accentColor;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onOpen) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  const handleHistory = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onHistory?.();
  };

  return (
    <Card
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: 2,
        pl: 2.25,
        minHeight: 150,
        height: '100%',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        cursor: onOpen ? 'pointer' : 'default',
        transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        '&:hover': onOpen
          ? { transform: 'translateY(-2px)', boxShadow: theme.shadows[3] }
          : undefined,
        '&:focus-visible': {
          outline: `2px solid ${accentColor}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: accentColor }}
      />

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(accentColor, 0.12),
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            '& svg': { fontSize: 21 },
          }}
        >
          {icon}
        </Box>
        {onHistory && (
          <Tooltip title={t('history.button')}>
            <IconButton
              size="small"
              onClick={handleHistory}
              aria-label={t('history.button')}
              sx={{ color: 'text.secondary', mt: -0.5, mr: -0.5 }}
            >
              <HistoryIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
          <Box
            sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: accentColor, flexShrink: 0 }}
          />
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.2, mt: 0.5 }} noWrap>
          {title}
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      {subtitle && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
          {subtitle}
        </Typography>
      )}

      {typeof progress === 'number' && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 5,
            borderRadius: 999,
            bgcolor: alpha(stateColor, theme.palette.mode === 'light' ? 0.16 : 0.24),
            '& .MuiLinearProgress-bar': { bgcolor: stateColor, borderRadius: 999 },
          }}
        />
      )}

      {state && (
        <Box
          component="span"
          sx={{
            alignSelf: 'flex-start',
            fontSize: '0.74rem',
            fontWeight: 700,
            px: 1.25,
            py: 0.375,
            borderRadius: 999,
            color: stateColor,
            bgcolor: alpha(stateColor, 0.16),
          }}
        >
          {state.label}
        </Box>
      )}
    </Card>
  );
}
