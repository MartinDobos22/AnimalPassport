import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Link,
  Menu,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Print as PrintIcon, Tune as TuneIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import type { ExportSectionId, ExportSectionsState } from './ExportSectionsToolbar';

export type PdfLang = 'sk' | 'en';

export interface DateRange {
  from: string;
  to: string;
}

export const EMPTY_DATE_RANGE: DateRange = { from: '', to: '' };

const toIso = (d: Date) => d.toISOString().slice(0, 10);

const monthsAgoRange = (months: number): DateRange => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - months);
  return { from: toIso(from), to: toIso(to) };
};

const DATE_PRESETS: { key: string; compute: () => DateRange }[] = [
  { key: 'last6m', compute: () => monthsAgoRange(6) },
  { key: 'last12m', compute: () => monthsAgoRange(12) },
  {
    key: 'thisYear',
    compute: () => {
      const to = new Date();
      return { from: toIso(new Date(to.getFullYear(), 0, 1)), to: toIso(to) };
    },
  },
];

const ORDER: ExportSectionId[] = [
  'identity',
  'conditions',
  'medications',
  'prevention',
  'visits',
  'history',
];

interface Props {
  exportSections: ExportSectionsState;
  onChangeSections: (next: ExportSectionsState) => void;
  onExportPdf: () => void;
  onPrintPreview: () => void;
  pdfLang: PdfLang;
  onChangePdfLang: (next: PdfLang) => void;
  dateRange: DateRange;
  onChangeDateRange: (next: DateRange) => void;
}

export default function VetCardActionBar({
  exportSections,
  onChangeSections,
  onExportPdf,
  onPrintPreview,
  pdfLang,
  onChangePdfLang,
  dateRange,
  onChangeDateRange,
}: Props) {
  const { t } = useTranslation('vetCard');
  const { t: tHp } = useTranslation('healthPassport');
  const theme = useTheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  const enabledCount = Object.values(exportSections).filter(Boolean).length;
  const canExport = enabledCount > 0;
  const hasDateRange = Boolean(dateRange.from || dateRange.to);

  const handleOpen = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const handleClose = () => setAnchor(null);
  const toggle = (id: ExportSectionId) =>
    onChangeSections({ ...exportSections, [id]: !exportSections[id] });

  return (
    <Box
      sx={{
        position: 'sticky',
        top: { xs: 72, md: 12 },
        zIndex: 10,
        mb: 1.5,
        display: 'flex',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        '@media print': { display: 'none' },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{
          maxWidth: '100%',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          p: 0.5,
          pl: 1.5,
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 4,
          boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            letterSpacing: 0,
            fontSize: '0.78rem',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          {t('actionBar.sectionCount', { enabled: enabledCount, total: ORDER.length })}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={pdfLang}
          onChange={(_, next: PdfLang | null) => {
            if (next) onChangePdfLang(next);
          }}
          aria-label={tHp('vetPage.pdfLanguageAria')}
          sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1, fontSize: '0.72rem' } }}
        >
          <ToggleButton value="sk">SK</ToggleButton>
          <ToggleButton value="en">EN</ToggleButton>
        </ToggleButtonGroup>
        <Tooltip title={t('actionBar.selectSections')}>
          <IconButton
            onClick={handleOpen}
            aria-label={t('actionBar.sectionsAria')}
            size="small"
            sx={{ color: open || hasDateRange ? 'primary.main' : 'text.secondary' }}
          >
            <TuneIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('hints.print')}>
          <IconButton
            onClick={onPrintPreview}
            aria-label={t('actionBar.printPreview')}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <PrintIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('hints.export')}>
          <span>
            <Button
              variant="contained"
              size="small"
              startIcon={<PdfIcon />}
              onClick={onExportPdf}
              disabled={!canExport}
              sx={{
                minHeight: 32,
                py: 0.5,
                px: { xs: 1, sm: 1.5 },
                '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {t('actionBar.exportPdf')}
              </Box>
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.14)}`,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            {t('actionBar.sectionsAria')}
          </Typography>
          <Stack spacing={0.25}>
            {ORDER.map((id) => (
              <FormControlLabel
                key={id}
                control={
                  <Checkbox checked={exportSections[id]} onChange={() => toggle(id)} size="small" />
                }
                label={t(`actionBar.sections.${id}` as never)}
                sx={{
                  m: 0,
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.85rem',
                    fontWeight: exportSections[id] ? 600 : 400,
                  },
                }}
              />
            ))}
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('actionBar.dateRange.label')}
            </Typography>
            {hasDateRange && (
              <Link
                component="button"
                type="button"
                variant="caption"
                underline="hover"
                onClick={() => onChangeDateRange(EMPTY_DATE_RANGE)}
                sx={{ color: 'primary.main' }}
              >
                {t('actionBar.dateRange.clear')}
              </Link>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
            {DATE_PRESETS.map((p) => (
              <Chip
                key={p.key}
                label={t(`actionBar.dateRange.presets.${p.key}` as never)}
                size="small"
                variant="outlined"
                clickable
                onClick={() => onChangeDateRange(p.compute())}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField
              type="date"
              size="small"
              label={t('actionBar.dateRange.from')}
              value={dateRange.from}
              onChange={(e) => onChangeDateRange({ ...dateRange, from: e.target.value })}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { max: dateRange.to || undefined },
              }}
              sx={{ flex: 1, '& input': { fontSize: '0.8rem' } }}
            />
            <TextField
              type="date"
              size="small"
              label={t('actionBar.dateRange.to')}
              value={dateRange.to}
              onChange={(e) => onChangeDateRange({ ...dateRange, to: e.target.value })}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: dateRange.from || undefined },
              }}
              sx={{ flex: 1, '& input': { fontSize: '0.8rem' } }}
            />
          </Stack>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1.5,
              pt: 1,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
              color: 'text.disabled',
              textTransform: 'none',
              letterSpacing: 0,
              fontSize: '0.72rem',
            }}
          >
            {t('actionBar.note')}
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
}
