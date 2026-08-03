import { useTranslation } from 'react-i18next';
import { Box, Button, Card, Stack, Typography, useTheme } from '@mui/material';
import { Restaurant as FoodIcon, Edit as EditIcon } from '@mui/icons-material';
import FoodSuitabilityChip from './FoodSuitabilityChip';
import FoodCardHeader from './FoodCardHeader';
import type { DietEntry } from '../../types/petHealth';

interface Props {
  current?: DietEntry;
  onSetFood: () => void;
}

export default function CurrentFoodCard({ current, onSetFood }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Card sx={{ p: theme.spacing(2.5), borderRadius: 2, height: '100%' }}>
      <FoodCardHeader
        icon={<FoodIcon />}
        accent={theme.palette.diet.main}
        title={t('food.current')}
        hint={t('hints.currentFood')}
        action={
          <Button
            size="small"
            startIcon={current ? <EditIcon /> : undefined}
            variant={current ? 'text' : 'contained'}
            onClick={onSetFood}
          >
            {current ? t('food.changeFood') : t('food.setFood')}
          </Button>
        }
      />

      {current ? (
        <Stack spacing={theme.spacing(1)}>
          <Typography variant="h6">{current.foodName}</Typography>
          <Box>
            <FoodSuitabilityChip status={current.suitabilityStatus} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('food.usedFrom')}: {current.startedAt}
          </Typography>
          {current.suitabilityReasons && current.suitabilityReasons.length > 0 && (
            <Stack component="ul" sx={{ m: 0, pl: theme.spacing(2.5) }} spacing={0.25}>
              {current.suitabilityReasons.map((r, i) => (
                <Typography key={i} component="li" variant="body2" color="text.secondary">
                  {r}
                </Typography>
              ))}
            </Stack>
          )}
          {current.reactionNotes && (
            <Typography variant="body2" color="text.secondary">
              {current.reactionNotes}
            </Typography>
          )}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('food.noCurrent')}
        </Typography>
      )}
    </Card>
  );
}
