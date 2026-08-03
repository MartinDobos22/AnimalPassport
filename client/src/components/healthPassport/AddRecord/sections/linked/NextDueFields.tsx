import { useTranslation } from 'react-i18next';
import { Stack, TextField } from '@mui/material';

import DateField from '../../../../DateField';
import { computeIntervalDaysFromDates, plusDays } from '../../../utils';

interface NextDueFieldsProps {
  intervalLabel: string;
  intervalDays: number;
  /** Používateľom zadaný dátum ďalšej dávky; prázdny = odvodiť z intervalu. */
  validUntil: string;
  baseDate: string;
  onChangeInterval: (days: number) => void;
  onChangeValidUntil: (date: string) => void;
}

/**
 * Dvojica interval + dátum ďalšej dávky. Obe polia sú previazané: zmena
 * intervalu posunie dátum, zadanie dátumu prepočíta interval. Dátum má
 * prednosť pri ukladaní (`nextDueDate`), interval sa drží konzistentný,
 * aby priebehové ukazovatele v pase sedeli.
 */
export default function NextDueFields({
  intervalLabel,
  intervalDays,
  validUntil,
  baseDate,
  onChangeInterval,
  onChangeValidUntil,
}: NextDueFieldsProps) {
  const { t } = useTranslation('healthPassport');

  const effectiveNextDue =
    validUntil || (baseDate && intervalDays > 0 ? plusDays(baseDate, intervalDays) : '');

  const handleInterval = (days: number) => {
    onChangeInterval(days);
    if (validUntil) {
      onChangeValidUntil(baseDate && days > 0 ? plusDays(baseDate, days) : '');
    }
  };

  const handleNextDue = (date: string) => {
    onChangeValidUntil(date);
    if (date && baseDate) {
      onChangeInterval(computeIntervalDaysFromDates(baseDate, date, intervalDays));
    }
  };

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField
        size="small"
        type="number"
        label={intervalLabel}
        value={intervalDays}
        onChange={(e) => handleInterval(Number(e.target.value) || 0)}
        inputProps={{ min: 0, step: 1 }}
        fullWidth
      />
      <DateField
        label={t('nextDue.dateLabel')}
        value={effectiveNextDue}
        onChange={handleNextDue}
        helperText={t('nextDue.helper')}
        fullWidth
      />
    </Stack>
  );
}
