import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Favorite as FavoriteIcon } from '@mui/icons-material';

export interface ScoreBreakdownItem {
  label: string;
  shortLabel?: string;
  status: 'good' | 'soon' | 'bad' | 'unknown';
  detail?: string;
}

interface Props {
  score: number | null;
  size?: number;
  label?: string;
  breakdown?: ScoreBreakdownItem[];
  incomplete?: boolean;
  /** 'hero' renders white text on a green→teal gradient stroke for use over the photo hero. */
  variant?: 'default' | 'hero';
}

const statusDot: Record<ScoreBreakdownItem['status'], string> = {
  good: '#2F7D5B',
  soon: '#B8860B',
  bad: '#B4452C',
  unknown: '#9AA0A2',
};

export default function HealthScoreRing({
  score,
  size = 96,
  label,
  breakdown,
  incomplete = false,
  variant = 'default',
}: Props) {
  const { t } = useTranslation('healthPassport');
  const theme = useTheme();
  const gradientId = `scoreGrad-${useId().replace(/:/g, '')}`;
  const stroke = Math.max(8, Math.round(size * 0.1));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const resolvedLabel = label ?? t('score.overallStatus');

  const labelForScore = (value: number) => {
    if (value >= 85) return t('score.excellent');
    if (value >= 70) return t('score.good');
    if (value >= 50) return t('score.average');
    return t('score.needsAttention');
  };

  const hasScore = score !== null && !Number.isNaN(score);
  const value = hasScore ? Math.max(0, Math.min(100, score!)) : 0;

  if (variant === 'hero') {
    const center = size / 2;
    const dash = (value / 100) * circumference;
    return (
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          role="img"
          aria-label={t('score.aria', { value: hasScore ? Math.round(value) : '—' })}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7FC9A8" />
              <stop offset="100%" stopColor="#0F4C5C" />
            </linearGradient>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.30)"
            strokeWidth={stroke}
          />
          {hasScore && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(-90 ${center} ${center})`}
              style={{ transition: 'stroke-dasharray 400ms ease' }}
            />
          )}
        </svg>
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={0}
          sx={{ position: 'absolute', inset: 0, color: 'common.white' }}
        >
          <FavoriteIcon
            sx={{
              fontSize: size * 0.12,
              mb: 0.25,
              filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.3))',
            }}
          />
          <Typography
            sx={{
              fontSize: size * 0.28,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.28)',
            }}
          >
            {hasScore ? Math.round(value) : '—'}
          </Typography>
          {hasScore && (
            <Typography
              sx={{
                fontSize: size * 0.08,
                fontWeight: 700,
                mt: 0.4,
                textShadow: '0 1px 6px rgba(0,0,0,0.28)',
              }}
            >
              {labelForScore(value)}
            </Typography>
          )}
          <Typography
            sx={{
              fontSize: size * 0.065,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.85)',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            {resolvedLabel}
          </Typography>
        </Stack>
      </Box>
    );
  }

  const color = !hasScore
    ? theme.palette.divider
    : value >= 70
      ? theme.palette.success.main
      : value >= 50
        ? theme.palette.warning.main
        : theme.palette.error.main;

  const trackColor =
    theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.main, 0.1)
      : alpha(theme.palette.common.white, 0.1);

  const glowFilter =
    theme.palette.mode === 'dark' && hasScore ? `drop-shadow(0 0 6px ${color}55)` : undefined;

  const center = size / 2;
  const dash = (value / 100) * circumference;

  const ring = (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={t('score.aria', { value: hasScore ? Math.round(value) : '—' })}
        style={{ filter: glowFilter }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        {hasScore && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: 'stroke-dasharray 400ms ease' }}
          />
        )}
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: size * 0.33,
            fontWeight: 700,
            lineHeight: 1,
            color: hasScore ? 'text.primary' : 'text.secondary',
            letterSpacing: '-0.02em',
          }}
        >
          {hasScore ? Math.round(value) : '—'}
        </Typography>
      </Box>
    </Box>
  );

  const tooltipContent =
    breakdown && breakdown.length > 0 ? (
      <Stack spacing={0.5} sx={{ py: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.85, fontSize: '0.7rem' }}>
          {t('score.basedOn')}
        </Typography>
        {breakdown.map((b) => (
          <Stack key={b.label} direction="row" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: statusDot[b.status],
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: 'inherit',
                textTransform: 'none',
                letterSpacing: 0,
                fontSize: '0.75rem',
              }}
            >
              {b.label}
              {b.detail ? ` — ${b.detail}` : ''}
            </Typography>
          </Stack>
        ))}
      </Stack>
    ) : null;

  return (
    <Stack alignItems="center" spacing={0.75}>
      {tooltipContent ? (
        <Tooltip title={tooltipContent} placement="left" arrow>
          {ring}
        </Tooltip>
      ) : (
        ring
      )}
      {breakdown && breakdown.length > 0 && (
        <Stack
          direction="row"
          gap={1.25}
          sx={{ mt: 0.75, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 220 }}
        >
          {breakdown.map((b, idx) => (
            <Tooltip key={idx} title={`${b.label}${b.detail ? ` — ${b.detail}` : ''}`}>
              <Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'default' }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: statusDot[b.status],
                    opacity: b.status === 'unknown' ? 0.45 : 1,
                    boxShadow:
                      theme.palette.mode === 'dark' && b.status !== 'unknown'
                        ? `0 0 5px ${statusDot[b.status]}77`
                        : undefined,
                    border:
                      b.status === 'unknown' ? `1px dashed ${theme.palette.divider}` : undefined,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'none',
                    letterSpacing: 0,
                    lineHeight: 1,
                  }}
                >
                  {b.shortLabel ?? b.label}
                </Typography>
              </Stack>
            </Tooltip>
          ))}
        </Stack>
      )}
      <Stack alignItems="center" spacing={0}>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            letterSpacing: 0,
            fontSize: '0.78rem',
            lineHeight: 1.25,
          }}
        >
          {resolvedLabel}
        </Typography>
        {hasScore && (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color, fontSize: '0.85rem', lineHeight: 1.3 }}
          >
            {labelForScore(value)}
          </Typography>
        )}
        {incomplete && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              textTransform: 'none',
              letterSpacing: 0,
              fontSize: '0.68rem',
              fontStyle: 'italic',
              mt: 0.25,
            }}
          >
            {t('score.incompleteData')}
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
