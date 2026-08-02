import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  MonitorWeight as ScaleIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  TrendingFlat as FlatIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useHealthData } from '../../hooks/useHealthData';
import { formatDateShort } from '../../utils/relativeDate';
import DateField from '../DateField';

interface Props {
  petId: string;
  fallbackWeightKg?: number;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthKey = (iso: string) => iso.slice(0, 7);
const prevMonthKey = (key: string) => {
  const d = new Date(`${key}-01`);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

export default function WeightTrendCard({ petId, fallbackWeightKg }: Props) {
  const { t, i18n } = useTranslation('healthPassport');
  const theme = useTheme();
  const { weightLogs: logs, addWeightLog } = useHealthData();
  const [open, setOpen] = useState(false);
  const [draftKg, setDraftKg] = useState<string>(fallbackWeightKg ? String(fallbackWeightKg) : '');
  const [draftDate, setDraftDate] = useState<string>(todayIso());
  const lang = i18n.language === 'en' ? 'en-US' : 'sk-SK';

  const series = useMemo(
    () => logs.filter((l) => l.petId === petId).sort((a, b) => a.date.localeCompare(b.date)),
    [logs, petId]
  );

  const last = series[series.length - 1];
  const first = series[0];

  const trend = useMemo(() => {
    if (series.length < 2) return null;
    const lastMonth = prevMonthKey(monthKey(last.date));
    const ref = [...series].reverse().find((s) => monthKey(s.date) <= lastMonth) ?? first;
    const diff = last.kg - ref.kg;
    if (Math.abs(diff) < 0.05) return { kg: 0, dir: 'flat' as const };
    return { kg: diff, dir: (diff > 0 ? 'up' : 'down') as 'up' | 'down' };
  }, [series, first, last]);

  const minY = useMemo(
    () => (series.length === 0 ? 0 : Math.floor(Math.min(...series.map((s) => s.kg)) * 0.95)),
    [series]
  );
  const maxY = useMemo(
    () => (series.length === 0 ? 1 : Math.ceil(Math.max(...series.map((s) => s.kg)) * 1.05)),
    [series]
  );

  const handleSave = async () => {
    const kg = parseFloat(draftKg.replace(',', '.'));
    if (!Number.isFinite(kg) || kg <= 0) return;
    await addWeightLog({ petId, date: draftDate || todayIso(), kg });
    setOpen(false);
    setDraftKg('');
    setDraftDate(todayIso());
  };

  const trendChip = trend && (
    <Chip
      size="small"
      icon={
        trend.dir === 'up' ? (
          <UpIcon sx={{ fontSize: 14 }} />
        ) : trend.dir === 'down' ? (
          <DownIcon sx={{ fontSize: 14 }} />
        ) : (
          <FlatIcon sx={{ fontSize: 14 }} />
        )
      }
      label={
        trend.dir === 'flat'
          ? t('weightCard.stable')
          : `${trend.kg > 0 ? '+' : ''}${trend.kg.toFixed(1)} kg`
      }
      sx={{
        height: 24,
        fontWeight: 700,
        bgcolor: alpha(theme.palette.success.main, 0.12),
        color: theme.palette.success.main,
        '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
      }}
    />
  );

  return (
    <>
      <Card
        sx={{
          p: { xs: 2, md: 3 },
          height: '100%',
          // Borderless — the page wrapper draws the monolith's side + bottom frame.
          border: 0,
          borderRadius: 0,
          bgcolor: 'background.default',
        }}
      >
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
          <ScaleIcon sx={{ fontSize: 21, color: 'primary.main' }} />
          <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700, flex: 1 }}>
            {t('weightCard.title')}
          </Typography>
        </Stack>

        {series.length === 0 && fallbackWeightKg ? (
          <Stack spacing={1.25} sx={{ py: 1 }}>
            <Stack direction="row" alignItems="baseline" gap={1.25}>
              <Typography sx={{ fontSize: '2.125rem', fontWeight: 800, lineHeight: 1 }}>
                {fallbackWeightKg} kg
              </Typography>
              <Chip
                size="small"
                label={t('weightCard.fromProfile')}
                sx={{
                  height: 22,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('weightCard.startTrendHint')}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t('weightCard.addLog')}
            </Button>
          </Stack>
        ) : series.length === 0 ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ScaleIcon />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 240 }}>
              {t('weightCard.emptyDescription')}
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              {t('weightCard.addLog')}
            </Button>
          </Stack>
        ) : (
          <>
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 0.5 }}>
              <Typography
                sx={{
                  fontSize: '2.125rem',
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {last.kg.toFixed(1)}{' '}
                <Box
                  component="span"
                  sx={{ fontSize: '1.05rem', fontWeight: 600, color: 'text.secondary' }}
                >
                  kg
                </Box>
              </Typography>
              {trendChip}
              {trend && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
                >
                  {t('weightCard.vsLastMonth')}
                </Typography>
              )}
            </Stack>

            {series.length >= 2 ? (
              <Box sx={{ height: 150, mt: 1.5, mb: 2, mx: -1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0.18}
                        />
                        <stop
                          offset="100%"
                          stopColor={theme.palette.primary.main}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                      tickFormatter={(v) =>
                        new Date(String(v)).toLocaleDateString(lang, {
                          day: 'numeric',
                          month: 'short',
                        })
                      }
                      minTickGap={28}
                    />
                    <YAxis
                      domain={[minY, maxY]}
                      width={28}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    />
                    <RTooltip
                      cursor={{ stroke: theme.palette.divider }}
                      contentStyle={{
                        borderRadius: 8,
                        border: `1px solid ${theme.palette.divider}`,
                        fontSize: 12,
                        background: theme.palette.background.paper,
                      }}
                      formatter={(v) => [
                        `${Number(v).toFixed(1)} kg`,
                        t('weightCard.tooltipLabel'),
                      ]}
                      labelFormatter={(v) => formatDateShort(String(v))}
                    />
                    <Area
                      type="monotone"
                      dataKey="kg"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2.4}
                      fill="url(#weightArea)"
                      dot={{ fill: theme.palette.primary.main, r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, stroke: theme.palette.background.paper, strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', display: 'block', mt: 0.5, mb: 2 }}
              >
                {t('weightCard.lastEntry', { date: formatDateShort(last.date) })}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              {t('weightCard.addLog')}
            </Button>
          </>
        )}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          {t('weightCard.dialogTitle')}
          <IconButton
            aria-label={t('weightCard.closeAria')}
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <DateField
              label={t('weightCard.dateLabel')}
              value={draftDate}
              onChange={setDraftDate}
              fullWidth
            />
            <TextField
              label={t('weightCard.weightLabel')}
              type="number"
              value={draftKg}
              onChange={(e) => setDraftKg(e.target.value)}
              inputProps={{ step: '0.1', min: '0' }}
              fullWidth
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>{t('weightCard.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={!draftKg.trim()}>
            {t('weightCard.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
