import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Card, Stack, Typography, useTheme } from '@mui/material';
import { Insights as InsightsIcon } from '@mui/icons-material';
import FoodCardHeader from './FoodCardHeader';
import { computeFoodInsights } from '../../utils/foodInsights';
import type { SymptomField } from '../../utils/checkInTrends';
import type { CheckIn, DietEntry } from '../../types/petHealth';

interface Props {
  dietEntries: DietEntry[];
  checkIns: CheckIn[];
}

export default function FoodInsightsCard({ dietEntries, checkIns }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const insights = useMemo(
    () => computeFoodInsights(dietEntries, checkIns),
    [dietEntries, checkIns]
  );

  const areaLabel = (field?: SymptomField): string => {
    switch (field) {
      case 'appetite':
        return t('checkIn.groupAppetite');
      case 'energy':
        return t('checkIn.groupEnergy');
      case 'stool':
        return t('checkIn.groupStool');
      case 'skinCoat':
        return t('checkIn.groupSkinCoat');
      case 'behavior':
        return t('checkIn.groupBehavior');
      default:
        return '';
    }
  };

  return (
    <Card sx={{ p: theme.spacing(2.5), borderRadius: 2 }}>
      <FoodCardHeader
        icon={<InsightsIcon />}
        accent={theme.palette.info.main}
        title={t('food.insightsTitle')}
        hint={t('hints.foodInsights')}
      />

      {insights.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('food.insightsEmpty')}
        </Typography>
      ) : (
        <Stack spacing={theme.spacing(1)}>
          {insights.map((ins, i) => {
            const text =
              ins.kind === 'appeared'
                ? t('food.insightAppeared', { food: ins.foodName, area: areaLabel(ins.field) })
                : ins.kind === 'improved'
                  ? t('food.insightImproved', { food: ins.foodName, area: areaLabel(ins.field) })
                  : t('food.insightNoReaction', { food: ins.foodName });
            return (
              <Alert key={i} severity={ins.tone === 'positive' ? 'success' : 'info'}>
                {text}
              </Alert>
            );
          })}
          <Typography variant="caption" color="text.secondary" sx={{ mt: theme.spacing(0.5) }}>
            {t('food.insightsDisclaimer')}
          </Typography>
        </Stack>
      )}
    </Card>
  );
}
