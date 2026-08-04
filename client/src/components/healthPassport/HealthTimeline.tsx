import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  CalendarMonth as CalendarIcon,
  Clear as ClearIcon,
  ChevronRight as ChevronIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { useTranslation } from 'react-i18next';
import type { TimelineEvent } from '../../types/petHealth';
import {
  TIMELINE_FILTER_VALUES,
  TIMELINE_ICON_MAP,
  TIMELINE_TYPE_META,
  type TimelineTypeColor,
} from './constants.ts';
import SearchableMultiSelect from '../ui/SearchableMultiSelect';

const localeTag = (lang: string) => (lang === 'en' ? 'en-US' : 'sk-SK');

interface HealthTimelineProps {
  timeline: TimelineEvent[];
  onOpenDetail: (event: TimelineEvent) => void;
  onExportPdf: () => void;
}

type SelectableType = TimelineEvent['type'];

const PAGE_SIZE = 8;
const CARD_MIN_HEIGHT = 76;
const RAIL_INSET = CARD_MIN_HEIGHT / 2;

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dayDiffFromToday = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return Number.NaN;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / 86_400_000);
};

export default function HealthTimeline({
  timeline,
  onOpenDetail,
  onExportPdf,
}: HealthTimelineProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation('healthPassport');
  const [selected, setSelected] = useState<Set<SelectableType>>(new Set());
  const [search, setSearch] = useState('');
  const [viewAll, setViewAll] = useState(false);
  const [page, setPage] = useState(1);
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);
  const [dayFilter, setDayFilter] = useState<string | null>(null);

  const lang = localeTag(i18n.language);

  const colorFor = (c: TimelineTypeColor) => theme.palette[c].main;

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const typeFilterOptions = useMemo(
    () =>
      TIMELINE_FILTER_VALUES.filter((v) => v !== 'ALL').map((v) => ({
        value: v as SelectableType,
        label: t(`filter.${v}`),
      })),
    [t]
  );

  // type + search filtered (drives both the calendar day-markers and the list)
  const filteredBase = useMemo(() => {
    const q = search.trim().toLowerCase();
    return timeline
      .filter((x) => (selected.size === 0 ? true : selected.has(x.type)))
      .filter((x) => (q ? `${x.title} ${x.subtitle ?? ''}`.toLowerCase().includes(q) : true));
  }, [timeline, selected, search]);

  const eventDays = useMemo(
    () => new Set(filteredBase.map((e) => e.date.slice(0, 10))),
    [filteredBase]
  );

  const visible = useMemo(() => {
    const list = dayFilter
      ? filteredBase.filter((e) => e.date.slice(0, 10) === dayFilter)
      : filteredBase;
    return [...list].sort(
      (a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    );
  }, [filteredBase, dayFilter]);

  // reset to the first page whenever the result set changes
  useEffect(() => {
    setPage(1);
  }, [selected, search, dayFilter]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const shown = viewAll ? visible : visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const EventDay = (props: PickersDayProps<Date>) => {
    const { day, outsideCurrentMonth } = props;
    const has = !outsideCurrentMonth && eventDays.has(dayKey(day));
    return (
      <Box sx={{ position: 'relative', display: 'flex' }}>
        <PickersDay {...props} />
        {has && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          columnGap: 2,
          rowGap: 1.5,
        }}
      >
        <Box sx={{ flex: '1 1 auto', minWidth: 180 }}>
          <Typography variant="h3" sx={{ fontSize: '1.35rem', fontWeight: 700 }}>
            {t('timeline.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('timeline.chronologicalOverview')}
          </Typography>
        </Box>
        <Stack
          direction="row"
          gap={1}
          sx={{ flex: '1 1 320px', minWidth: 0, alignItems: 'center', justifyContent: 'flex-end' }}
        >
          <TextField
            placeholder={t('timeline.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label={t('timeline.clearSearch')}
                    onClick={() => setSearch('')}
                  >
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ flex: 1, minWidth: 0, maxWidth: 280 }}
          />
          <Tooltip title={t('timeline.openCalendar')}>
            <IconButton
              onClick={(e) => setCalendarAnchor(e.currentTarget)}
              aria-label={t('timeline.openCalendar')}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
                color: dayFilter ? 'primary.main' : undefined,
                borderColor: dayFilter ? 'primary.main' : theme.palette.divider,
              }}
            >
              <CalendarIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('timeline.exportPdf')}>
            <IconButton
              onClick={onExportPdf}
              aria-label={t('timeline.exportPdfAriaLabel')}
              sx={{ border: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}
            >
              <PdfIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Popover
        open={Boolean(calendarAnchor)}
        anchorEl={calendarAnchor}
        onClose={() => setCalendarAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <DateCalendar
          value={dayFilter ? new Date(dayFilter) : null}
          onChange={(value) => {
            if (value && !Number.isNaN(value.getTime())) {
              setDayFilter(dayKey(value));
              setCalendarAnchor(null);
            }
          }}
          slots={{ day: EventDay }}
        />
        <Box sx={{ px: 2, pb: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            startIcon={<ClearIcon sx={{ fontSize: 16 }} />}
            disabled={!dayFilter}
            onClick={() => {
              setDayFilter(null);
              setCalendarAnchor(null);
            }}
          >
            {t('timeline.calendarClear')}
          </Button>
        </Box>
      </Popover>

      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ mb: 3, flexWrap: 'wrap', rowGap: 1 }}
      >
        <SearchableMultiSelect
          label={t('timeline.filterByType')}
          placeholder={t('timeline.filterAllTypes')}
          values={Array.from(selected)}
          options={typeFilterOptions}
          onChange={(next) => setSelected(new Set(next))}
          sx={{ flex: '1 1 260px', minWidth: 220, maxWidth: 420 }}
        />
        {dayFilter && (
          <Chip
            label={t('timeline.filteredByDay', { date: formatDate(dayFilter) })}
            size="small"
            color="primary"
            variant="outlined"
            onDelete={() => setDayFilter(null)}
          />
        )}
      </Stack>

      {shown.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            color: 'text.secondary',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="body2">{t('timeline.noRecords')}</Typography>
        </Box>
      ) : (
        <Box sx={{ position: 'relative' }}>
          {/* continuous vertical rail through the centered dots */}
          {shown.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                left: { xs: 72, sm: 80 },
                transform: 'translateX(-50%)',
                top: RAIL_INSET,
                bottom: RAIL_INSET,
                width: 2,
                bgcolor: 'divider',
              }}
            />
          )}
          <Stack spacing={1.75}>
            {shown.map((event) => {
              const color = colorFor(TIMELINE_TYPE_META[event.type].color);
              const isToday = dayDiffFromToday(event.date) === 0;
              return (
                <Stack key={event.id} direction="row" alignItems="stretch">
                  {/* date / Today column */}
                  <Box
                    sx={{
                      width: { xs: 56, sm: 64 },
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {isToday ? (
                      <Chip
                        label={t('timeline.today')}
                        size="small"
                        sx={{
                          height: 22,
                          bgcolor: 'success.main',
                          color: 'success.contrastText',
                          fontWeight: 700,
                          fontSize: '0.68rem',
                        }}
                      />
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          textTransform: 'none',
                          letterSpacing: 0,
                          textAlign: 'right',
                        }}
                      >
                        {formatDate(event.date)}
                      </Typography>
                    )}
                  </Box>

                  {/* dot (vertically centered on the card) */}
                  <Box
                    sx={{
                      width: 32,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: isToday ? color : 'background.paper',
                        border: isToday ? 'none' : `3px solid ${color}`,
                        boxShadow: `0 0 0 3px ${theme.palette.background.paper}`,
                      }}
                    />
                  </Box>

                  {/* event card (fixed min-height so all rows match) */}
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenDetail(event)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenDetail(event);
                      }
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      minHeight: CARD_MIN_HEIGHT,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.75,
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      transition: 'border-color 120ms ease, box-shadow 120ms ease',
                      '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                      '&:hover': {
                        borderColor: alpha(color, 0.5),
                        boxShadow: theme.shadows[2],
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${color}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: alpha(color, 0.12),
                        color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {TIMELINE_ICON_MAP[event.type]}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="overline"
                        sx={{ color, display: 'block', lineHeight: 1.4 }}
                      >
                        {t(`timeline.${event.type}`)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: 'text.primary' }}
                        noWrap
                      >
                        {event.title}
                      </Typography>
                      {event.subtitle && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
                          noWrap
                        >
                          {event.subtitle}
                        </Typography>
                      )}
                    </Box>
                    <ChevronIcon sx={{ color: 'text.disabled', fontSize: 22 }} />
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      )}

      {visible.length > PAGE_SIZE && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          flexWrap="wrap"
          gap={1.5}
          sx={{ mt: 2.5 }}
        >
          {!viewAll && pageCount > 1 && (
            <Stack direction="row" alignItems="center" gap={1}>
              <IconButton
                size="small"
                aria-label={t('timeline.prevPage')}
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                sx={{ border: `1px solid ${theme.palette.divider}` }}
              >
                <ChevronLeftIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', minWidth: 56, textAlign: 'center' }}
              >
                {t('timeline.pageIndicator', { page: safePage, total: pageCount })}
              </Typography>
              <IconButton
                size="small"
                aria-label={t('timeline.nextPage')}
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                sx={{ border: `1px solid ${theme.palette.divider}` }}
              >
                <ChevronIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Stack>
          )}
          <Button
            variant="outlined"
            endIcon={
              <ExpandMoreIcon
                sx={{
                  transform: viewAll ? 'rotate(180deg)' : 'none',
                  transition: 'transform 120ms ease',
                }}
              />
            }
            onClick={() => setViewAll((v) => !v)}
          >
            {viewAll ? t('timeline.showLess') : t('timeline.viewAllEvents')}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
