import { useState } from 'react';
import { Alert, AlertTitle, Box, Button, Chip, Stack, Typography, alpha } from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface Props {
  allergies: string[];
  intolerances: string[];
}

const VISIBLE_LIMIT = 5;

interface ChipGroupProps {
  label: string;
  items: string[];
  tone: 'error' | 'warning';
  collapsed: boolean;
  onExpand: () => void;
}

function ChipGroup({ label, items, tone, collapsed, onExpand }: ChipGroupProps) {
  const hiddenCount = collapsed ? Math.max(items.length - VISIBLE_LIMIT, 0) : 0;

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
        {label} ({items.length})
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5}>
        {items.map((item, index) => (
          <Chip
            key={item}
            label={item}
            size="small"
            sx={{
              height: 24,
              fontWeight: 600,
              fontSize: '0.75rem',
              color: `${tone}.main`,
              bgcolor: (theme) => alpha(theme.palette[tone].main, 0.12),
              border: (theme) => `1px solid ${alpha(theme.palette[tone].main, 0.4)}`,
              // Hidden entries stay mounted so a direct browser print keeps the full list.
              ...(index >= VISIBLE_LIMIT && hiddenCount > 0
                ? { display: 'none', '@media print': { display: 'inline-flex' } }
                : null),
            }}
          />
        ))}
        {hiddenCount > 0 && (
          <Chip
            label={`+${hiddenCount}`}
            size="small"
            variant="outlined"
            onClick={onExpand}
            sx={{
              height: 24,
              fontWeight: 700,
              fontSize: '0.75rem',
              color: 'text.secondary',
              '@media print': { display: 'none' },
            }}
          />
        )}
      </Stack>
    </Box>
  );
}

export default function SafetyAlertBanner({ allergies, intolerances }: Props) {
  const { t } = useTranslation('vetCard');
  const total = allergies.length + intolerances.length;
  const isCollapsible = allergies.length > VISIBLE_LIMIT || intolerances.length > VISIBLE_LIMIT;
  const [expanded, setExpanded] = useState(false);

  if (total === 0) return null;

  const collapsed = isCollapsible && !expanded;

  return (
    <Alert
      severity="error"
      variant="outlined"
      sx={{
        borderRadius: 3,
        alignItems: 'flex-start',
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 1 }}
      >
        <AlertTitle sx={{ fontWeight: 700, mb: 0 }}>{t('safetyAlert.title')}</AlertTitle>
        {isCollapsible && (
          <Button
            size="small"
            color="inherit"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
              flexShrink: 0,
              fontSize: '0.75rem',
              textTransform: 'none',
              '@media print': { display: 'none' },
            }}
          >
            {expanded ? t('safetyAlert.showLess') : t('safetyAlert.showAll', { total })}
          </Button>
        )}
      </Stack>

      <Stack gap={1}>
        {allergies.length > 0 && (
          <ChipGroup
            label={t('safetyAlert.allergies')}
            items={allergies}
            tone="error"
            collapsed={collapsed}
            onExpand={() => setExpanded(true)}
          />
        )}

        {intolerances.length > 0 && (
          <ChipGroup
            label={t('safetyAlert.intolerances')}
            items={intolerances}
            tone="warning"
            collapsed={collapsed}
            onExpand={() => setExpanded(true)}
          />
        )}
      </Stack>
    </Alert>
  );
}
