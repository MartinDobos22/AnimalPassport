import { Box, Card, Chip, Stack, Typography } from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Cancel as ExpiredIcon,
  HelpOutline as UnknownIcon,
  VaccinesOutlined as VaccinesIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { ValidityStatus } from '../../types/petHealth';
import { statusColor } from '../healthPassport/utils.ts';

export interface PreventiveItem {
  name: string;
  dateGiven: string;
  validUntil?: string;
  batch?: string;
  status: ValidityStatus;
  statusLabel: string;
}

interface Props {
  items: PreventiveItem[];
}

function statusIconFor(status: ValidityStatus) {
  if (status === 'VALID') return <CheckIcon />;
  if (status === 'EXPIRING_SOON') return <WarningIcon />;
  if (status === 'UNKNOWN') return <UnknownIcon />;
  return <ExpiredIcon />;
}

export default function PreventiveCareCard({ items }: Props) {
  const { t, i18n } = useTranslation('vetCard');
  const lang = i18n.language === 'en' ? 'en-US' : 'sk-SK';

  const formatDateShort = (value?: string): string => {
    if (!value) return '–';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 1.75, md: 2 },
        height: '100%',
        border: 0,
        borderRadius: 0,
        bgcolor: 'background.default',
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <VaccinesIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('preventiveCare.title')}
        </Typography>
      </Stack>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('preventiveCare.empty')}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((item, i) => (
            <Box
              key={`${item.name}-${i}`}
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                py: 1,
                borderBottom: i < items.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('preventiveCare.applied', { date: formatDateShort(item.dateGiven) })}
                  {item.batch ? ` · ${t('preventiveCare.batch', { batch: item.batch })}` : ''}
                </Typography>
              </Box>
              <Chip
                icon={statusIconFor(item.status)}
                label={item.statusLabel}
                size="small"
                color={statusColor(item.status)}
                variant="outlined"
              />
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
}
