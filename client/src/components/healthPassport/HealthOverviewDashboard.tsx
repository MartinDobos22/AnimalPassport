import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, ButtonBase, Card, Stack, Typography, alpha, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import HealthTile, { type HealthMetricTile, type HealthTileSection } from './HealthTile';

type FilterKey = 'ALL' | HealthTileSection;

interface Props {
  metrics: HealthMetricTile[];
  onAdd?: () => void;
}

export default function HealthOverviewDashboard({ metrics, onAdd }: Props) {
  const { t } = useTranslation('healthPassport');
  const theme = useTheme();
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      ALL: metrics.length,
      PREVENTIVE: 0,
      CONDITION: 0,
      EXAM: 0,
    };
    for (const m of metrics) base[m.section] += 1;
    return base;
  }, [metrics]);

  const summary = useMemo(() => {
    let overdue = 0;
    let soon = 0;
    for (const m of metrics) {
      if (m.state?.tone === 'error') overdue += 1;
      else if (m.state?.tone === 'warning' || m.state?.tone === 'info') soon += 1;
    }
    return { overdue, soon };
  }, [metrics]);

  const visible = useMemo(
    () => (filter === 'ALL' ? metrics : metrics.filter((m) => m.section === filter)),
    [metrics, filter]
  );

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: t('overviewCard.filterAll') },
    { key: 'PREVENTIVE', label: t('overviewCard.filterPreventive') },
    { key: 'CONDITION', label: t('overviewCard.filterCondition') },
    { key: 'EXAM', label: t('overviewCard.filterExam') },
  ];

  return (
    <Card
      sx={{
        p: { xs: 2, md: 3 },
        mb: 2.5,
        borderRadius: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
          {t('overviewCard.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
          {summary.overdue > 0
            ? t('overviewCard.summaryOverdue', { count: summary.overdue })
            : summary.soon > 0
              ? t('overviewCard.summarySoon', { count: summary.soon })
              : t('overviewCard.subtitle')}
        </Typography>
      </Box>

      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
        {filters.map(({ key, label }) => {
          const active = filter === key;
          return (
            <ButtonBase
              key={key}
              onClick={() => setFilter(key)}
              focusRipple
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 999,
                fontSize: '0.82rem',
                fontWeight: 600,
                gap: 0.75,
                border: '1px solid',
                borderColor: active
                  ? alpha(theme.palette.primary.main, 0.45)
                  : theme.palette.divider,
                bgcolor: active ? alpha(theme.palette.primary.main, 0.16) : 'background.paper',
                color: active ? theme.palette.primary.main : 'text.secondary',
                transition: 'color 120ms ease, border-color 120ms ease',
              }}
            >
              {label}
              <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>
                {counts[key]}
              </Box>
            </ButtonBase>
          );
        })}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))',
          gap: 2,
        }}
      >
        {visible.map((metric) => (
          <HealthTile key={metric.id} metric={metric} />
        ))}

        {onAdd && (
          <ButtonBase
            onClick={onAdd}
            focusRipple
            sx={{
              minHeight: 150,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: theme.palette.divider,
              color: 'text.secondary',
              flexDirection: 'column',
              gap: 1,
              transition: 'color 120ms ease, border-color 120ms ease, transform 120ms ease',
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              '&:hover': {
                color: 'primary.main',
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1.5px dashed currentColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AddIcon />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: 'text.primary' }}>
              {t('overviewCard.addTitle')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('overviewCard.addSubtitle')}
            </Typography>
          </ButtonBase>
        )}
      </Box>
    </Card>
  );
}
