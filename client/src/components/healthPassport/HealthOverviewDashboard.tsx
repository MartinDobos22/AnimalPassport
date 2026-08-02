import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, ButtonBase, Card, Chip, Stack, Typography, alpha, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useLocalStorage } from '../../hooks/useLocalStorage';
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
  const [hiddenIds, setHiddenIds] = useLocalStorage<string[]>(
    'granule-check-hidden-overview-tiles',
    []
  );
  const hide = (id: string) => setHiddenIds((prev) => [...new Set([...prev, id])]);
  const restore = (id: string) => setHiddenIds((prev) => prev.filter((x) => x !== id));

  const shown = useMemo(() => metrics.filter((m) => !hiddenIds.includes(m.id)), [metrics, hiddenIds]);
  const hiddenMetrics = useMemo(
    () => metrics.filter((m) => hiddenIds.includes(m.id)),
    [metrics, hiddenIds]
  );

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      ALL: shown.length,
      PREVENTIVE: 0,
      CONDITION: 0,
      EXAM: 0,
    };
    for (const m of shown) base[m.section] += 1;
    return base;
  }, [shown]);

  const summary = useMemo(() => {
    let overdue = 0;
    let soon = 0;
    for (const m of shown) {
      if (m.state?.tone === 'error') overdue += 1;
      else if (m.state?.tone === 'warning' || m.state?.tone === 'info') soon += 1;
    }
    return { overdue, soon };
  }, [shown]);

  const visible = useMemo(
    () => (filter === 'ALL' ? shown : shown.filter((m) => m.section === filter)),
    [shown, filter]
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
          <HealthTile key={metric.id} metric={{ ...metric, onHide: () => hide(metric.id) }} />
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

      {hiddenMetrics.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {t('overviewCard.hidden')} · {hiddenMetrics.length}
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {hiddenMetrics.map((m) => (
              <Chip
                key={m.id}
                label={m.title}
                onClick={() => restore(m.id)}
                onDelete={() => restore(m.id)}
                deleteIcon={<AddIcon />}
                size="small"
                variant="outlined"
                title={t('overviewCard.restore')}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Card>
  );
}
