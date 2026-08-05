import { Box, Card, Stack, Typography } from '@mui/material';
import {
  Coronavirus as RabiesIcon,
  Medication as MedicationIcon,
  MonitorHeart as ChronicIcon,
  MonitorWeight as WeightIcon,
  MedicalInformationOutlined as TriageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { ValidityStatus } from '../../types/petHealth';
import HelpHint from '../HelpHint';
import VetCardStatusCell, { VALIDITY_TONE } from './VetCardStatusCell';

const MAX_LISTED = 2;

const STATUS_LABEL_KEY: Record<ValidityStatus, string> = {
  VALID: 'statusOverview.statusValid',
  EXPIRING_SOON: 'statusOverview.statusExpiringSoon',
  EXPIRED: 'statusOverview.statusExpired',
  UNKNOWN: 'statusOverview.statusUnknown',
};

interface Props {
  rabies: { status: ValidityStatus; detail?: string; dateApplied?: string };
  activeMedications: string[];
  chronicConditions: string[];
  weightKg?: number;
  lastVisitDate?: string;
}

export default function VetCardStatusOverview({
  rabies,
  activeMedications,
  chronicConditions,
  weightKg,
  lastVisitDate,
}: Props) {
  const { t, i18n } = useTranslation('vetCard');
  const lang = i18n.language === 'en' ? 'en-US' : 'sk-SK';

  const formatDate = (value?: string): string | undefined => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const summarize = (items: string[]): string =>
    items.length <= MAX_LISTED
      ? items.join(', ')
      : `${items.slice(0, MAX_LISTED).join(', ')} ${t('statusOverview.andMore', {
          count: items.length - MAX_LISTED,
        })}`;

  const rabiesApplied = formatDate(rabies.dateApplied);
  const rabiesDetail = [
    rabies.detail,
    rabiesApplied ? t('statusOverview.appliedShort', { date: rabiesApplied }) : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const lastVisit = formatDate(lastVisitDate);
  const weightValue =
    weightKg != null
      ? t('statusOverview.weightValue', {
          weight: new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(weightKg),
        })
      : t('statusOverview.weightUnknown');

  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 1.75, md: 2 },
        bgcolor: 'background.default',
        borderRadius: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <TriageIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('statusOverview.title')}
        </Typography>
        <HelpHint text={t('hints.vetTriage')} size={14} />
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 1,
        }}
      >
        <VetCardStatusCell
          icon={<RabiesIcon />}
          label={t('statusOverview.rabies')}
          tone={VALIDITY_TONE[rabies.status]}
          value={t(STATUS_LABEL_KEY[rabies.status] as never)}
          detail={rabiesDetail || undefined}
        />
        <VetCardStatusCell
          icon={<MedicationIcon />}
          label={t('statusOverview.activeMeds')}
          tone={activeMedications.length > 0 ? 'info' : 'neutral'}
          value={
            activeMedications.length > 0
              ? t('statusOverview.activeMedsCount', { count: activeMedications.length })
              : t('statusOverview.activeMedsNone')
          }
          detail={activeMedications.length > 0 ? summarize(activeMedications) : undefined}
        />
        <VetCardStatusCell
          icon={<ChronicIcon />}
          label={t('statusOverview.chronic')}
          tone={chronicConditions.length > 0 ? 'warning' : 'neutral'}
          value={
            chronicConditions.length > 0
              ? t('statusOverview.chronicCount', { count: chronicConditions.length })
              : t('statusOverview.chronicNone')
          }
          detail={chronicConditions.length > 0 ? summarize(chronicConditions) : undefined}
        />
        <VetCardStatusCell
          icon={<WeightIcon />}
          label={t('statusOverview.weight')}
          tone="neutral"
          value={weightValue}
          detail={lastVisit ? t('statusOverview.lastVisit', { date: lastVisit }) : undefined}
        />
      </Box>
    </Card>
  );
}
