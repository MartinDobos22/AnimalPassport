import { useTranslation } from 'react-i18next';
import { Button, Stack, Typography, useTheme } from '@mui/material';
import HelpHint from '../HelpHint';
import type { CheckInOverallStatus } from '../../types/petHealth';

interface Props {
  petName: string;
  onSelect: (status: CheckInOverallStatus) => void;
}

export default function QuickCheckInStep({ petName, onSelect }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Stack spacing={theme.spacing(2)}>
      <Stack direction="row" alignItems="center">
        <Typography variant="h6" sx={{ minWidth: 0 }}>
          {t('checkIn.question', { name: petName })}
        </Typography>
        <HelpHint text={t('hints.checkInQuestion')} />
      </Stack>
      <Button variant="contained" size="large" onClick={() => onSelect('ok')}>
        {t('checkIn.optionOk')}
      </Button>
      <Button variant="outlined" size="large" onClick={() => onSelect('changed')}>
        {t('checkIn.optionChanged')}
      </Button>
      <Button variant="outlined" size="large" onClick={() => onSelect('unsure')}>
        {t('checkIn.optionUnsure')}
      </Button>
    </Stack>
  );
}
