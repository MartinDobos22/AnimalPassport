import { Box, Stack, Typography, alpha, useTheme } from '@mui/material';
import {
  CheckCircle as CheckIcon,
  WarningAmber as WarningIcon,
  ErrorOutline as ExpiredIcon,
  HelpOutline as UnknownIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import type { ReactElement } from 'react';
import type { ValidityStatus } from '../../types/petHealth';

export type CellTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface Props {
  icon: ReactElement;
  label: string;
  tone: CellTone;
  value: string;
  detail?: string;
}

const TONE_ICON: Record<CellTone, typeof CheckIcon> = {
  success: CheckIcon,
  warning: WarningIcon,
  error: ExpiredIcon,
  info: InfoIcon,
  neutral: UnknownIcon,
};

export const VALIDITY_TONE: Record<ValidityStatus, CellTone> = {
  VALID: 'success',
  EXPIRING_SOON: 'warning',
  EXPIRED: 'error',
  UNKNOWN: 'neutral',
};

export default function VetCardStatusCell({ icon, label, tone, value, detail }: Props) {
  const theme = useTheme();
  const ToneIcon = TONE_ICON[tone];

  const toneColor =
    tone === 'success'
      ? theme.palette.success.main
      : tone === 'warning'
        ? theme.palette.warning.main
        : tone === 'error'
          ? theme.palette.error.main
          : tone === 'info'
            ? theme.palette.info.main
            : theme.palette.text.disabled;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${alpha(toneColor, 0.3)}`,
        bgcolor: alpha(toneColor, theme.palette.mode === 'light' ? 0.05 : 0.12),
        minWidth: 0,
      }}
    >
      <Stack direction="row" alignItems="flex-start" gap={1}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: alpha(toneColor, 0.18),
            color: toneColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            '& svg': { fontSize: 18 },
          }}
        >
          {icon}
        </Box>
        <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.25}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1.2 }}
            noWrap
          >
            {label}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <ToneIcon sx={{ fontSize: 14, color: toneColor, flexShrink: 0 }} />
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: toneColor, fontSize: '0.82rem', lineHeight: 1.25 }}
              noWrap
            >
              {value}
            </Typography>
          </Stack>
          {detail && detail !== value && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                letterSpacing: 0,
                fontSize: '0.72rem',
                lineHeight: 1.3,
              }}
            >
              {detail}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
