import { Box, Card, Chip, Skeleton, Stack, Typography } from '@mui/material';
import {
  Description as DescriptionIcon,
  FilterAltOutlined as FilterIcon,
} from '@mui/icons-material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivePet } from '../hooks/useActivePet';
import { useHealthData } from '../hooks/useHealthData';
import FeatureIntro from '../components/FeatureIntro';
import HelpHint from '../components/HelpHint';
import ClinicalHistory from '../components/vetCard/ClinicalHistory';
import {
  DEFAULT_EXPORT_SECTIONS,
  type ExportSectionsState,
} from '../components/vetCard/ExportSectionsToolbar';
import DocumentIdentityBlock from '../components/vetCard/DocumentIdentityBlock';
import HealthProfileChips from '../components/vetCard/HealthProfileChips';
import VetCardActionBar, {
  EMPTY_DATE_RANGE,
  type DateRange,
} from '../components/vetCard/VetCardActionBar';
import VetCardStatusOverview from '../components/vetCard/VetCardStatusOverview';
import ActiveMedicationsCard from '../components/vetCard/ActiveMedicationsCard';
import SafetyAlertBanner from '../components/vetCard/SafetyAlertBanner';
import WeightTrendCard from '../components/vetCard/WeightTrendCard';
import PreventiveCareCard, { type PreventiveItem } from '../components/vetCard/PreventiveCareCard';
import RecentVisitsCard from '../components/vetCard/RecentVisitsCard';
import { vetStatusFor } from '../components/vetCard/vetCardStatusUtils';
import type { VaccinationRecord, VaccineType } from '../types/petHealth';
import { dedupList, subtractList } from '../utils/healthProfileDedup';
import { ageInYears } from '../utils/petAge';
import { buildClinicalTimeline } from '../utils/vetCardTimeline';
import { computeWeightTrend, sparklinePath } from '../utils/weightTrend';
import { VACCINE_TYPE_ORDER } from '../utils/vaccineTypes';

type PdfLang = 'sk' | 'en';

const today = () => new Date().toISOString().slice(0, 10);

const isWithinRange = (date: string | undefined, from: string, to: string): boolean => {
  if (!date) return true;
  const day = date.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
};

const PRINT_STYLES = `
  @page { size: A4; margin: 14mm; }

  * { box-sizing: border-box; }

  :root {
    --ink: #1a1a1a;
    --ink-2: #4a4a4a;
    --ink-3: #7a7a7a;
    --rule: #d0d0d0;
    --rule-soft: #ececec;
    --bg-row: #fafafa;
    --accent: #15402a;
    --valid: #15803d;
    --warning: #b45309;
    --expired: #b91c1c;
  }

  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: var(--ink);
    background: #fff;
    margin: 0;
    padding: 0;
    font-size: 12px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  .doc {
    max-width: 720px;
    margin: 0 auto;
  }

  /* ── HEADER ─────────────────────────────── */
  .doc-head {
    border-bottom: 2px solid var(--ink);
    padding-bottom: 12px;
    margin-bottom: 20px;
  }

  .head-strip {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 14px;
  }

  .head-strip .label {
    color: var(--accent);
  }

  .brand-logo {
    display: block;
    height: 48px;
    width: auto;
    margin-bottom: 12px;
    background-color: transparent;
  }

  .brand-logo--footer {
    height: 28px;
    margin: 0 0 6px;
    background-color: transparent;
  }

  .doc-period {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent);
    border: 1px solid var(--rule);
    border-radius: 3px;
    padding: 2px 8px;
    margin-bottom: 10px;
  }

  .pet-name {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 4px;
    color: var(--ink);
    letter-spacing: -0.01em;
  }

  .pet-meta {
    font-size: 12px;
    color: var(--ink-2);
    margin-bottom: 8px;
  }

  .head-badges {
    font-size: 11px;
    color: var(--ink-2);
  }

  .head-badges .b-sep { color: var(--rule); margin: 0 6px; }
  .head-badges .b-allergies { color: var(--expired); font-weight: 600; }
  .head-badges .b-chronic { color: var(--accent); font-weight: 600; }
  .head-badges .b-meds { color: var(--warning); font-weight: 600; }

  /* ── BLOCK ─────────────────────────────── */
  .block {
    margin-bottom: 18px;
    page-break-inside: avoid;
  }

  .block-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--rule);
  }

  /* ── SAFETY ALERT ───────────────────────── */
  .alert-banner {
    border: 1.5px solid var(--expired);
    border-radius: 4px;
    background: #fef2f2;
    padding: 10px 12px;
    margin-bottom: 18px;
    page-break-inside: avoid;
  }

  .alert-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--expired);
    margin-bottom: 6px;
  }

  .alert-row {
    font-size: 12px;
    line-height: 1.8;
    margin-top: 2px;
  }

  .alert-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-2);
    margin-right: 6px;
  }

  .alert-chip {
    display: inline-block;
    border: 1px solid var(--expired);
    color: var(--expired);
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 3px;
    margin: 0 4px 4px 0;
    font-size: 11px;
  }

  .alert-chip--amber {
    border-color: var(--warning);
    color: var(--warning);
  }

  /* ── WEIGHT TREND ───────────────────────── */
  .weight-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .weight-figure { display: flex; flex-direction: column; }

  .weight-latest {
    font-size: 18px;
    font-weight: 700;
    color: var(--ink);
  }

  .weight-delta {
    font-size: 11px;
    font-weight: 600;
    margin-top: 2px;
  }

  .weight-spark { flex-shrink: 0; }

  .sub-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin: 8px 0 4px;
  }

  .sub-label.warn { color: var(--expired); }

  .tags {
    font-size: 12px;
    color: var(--ink);
    line-height: 1.7;
  }

  .tag {
    display: inline-block;
    border: 1px solid var(--rule);
    padding: 1px 8px;
    border-radius: 3px;
    margin: 0 4px 4px 0;
    font-size: 11px;
    color: var(--ink);
  }

  .tag.tag-red { border-color: var(--expired); color: var(--expired); }
  .tag.tag-amber { border-color: var(--warning); color: var(--warning); }
  .tag.tag-blue { border-color: var(--accent); color: var(--accent); }
  .tag.tag-slate { border-color: var(--rule); color: var(--ink-2); }

  .notes {
    font-size: 12px;
    color: var(--ink-2);
    line-height: 1.55;
  }

  /* ── DATA TABLE ─────────────────────────── */
  .data {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .data thead th {
    text-align: left;
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-3);
    border-bottom: 1px solid var(--rule);
    padding: 6px 8px;
  }

  .data tbody tr { page-break-inside: avoid; }

  .data tbody td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--rule-soft);
    color: var(--ink);
    vertical-align: top;
  }

  .data tbody tr:nth-child(even) td { background: var(--bg-row); }
  .data tbody tr:last-child td { border-bottom: none; }

  .data td.muted { color: var(--ink-3); }
  .data td.bold { font-weight: 600; }
  .data td.nowrap { white-space: nowrap; }

  .empty {
    font-size: 11px;
    color: var(--ink-3);
    font-style: italic;
    padding: 4px 0;
  }

  /* ── VISIT BLOCKS ────────────────────────── */
  .visit {
    border: 1px solid var(--rule);
    border-left: 3px solid var(--accent);
    padding: 10px 12px;
    margin-bottom: 10px;
    page-break-inside: avoid;
    background: #fff;
  }

  .visit-head {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin-bottom: 4px;
  }

  .visit-date { font-weight: 700; color: var(--ink); }
  .visit-clinic { font-weight: 500; }

  .visit-reason {
    font-size: 12px;
    color: var(--ink);
    font-weight: 600;
    margin-bottom: 8px;
  }

  .visit-section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin: 8px 0 2px;
  }

  .visit-md {
    font-size: 12px;
    color: var(--ink-2);
    line-height: 1.55;
  }

  /* ── MARKDOWN inside visits ───────────────── */
  .visit-md p.md-p {
    margin: 0 0 6px;
    font-size: 12px;
    color: var(--ink-2);
  }

  .visit-md .md-h {
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
    margin: 8px 0 4px;
  }

  .visit-md ul.md-ul, .visit-md ol.md-ol {
    margin: 4px 0;
    padding-left: 18px;
  }

  .visit-md ul.md-ul li, .visit-md ol.md-ol li {
    font-size: 12px;
    color: var(--ink-2);
    line-height: 1.5;
    margin-bottom: 2px;
  }

  .visit-md table.md-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 11px;
    border: 1px solid var(--rule);
  }

  .visit-md table.md-table th {
    background: var(--bg-row);
    color: var(--ink);
    font-weight: 600;
    padding: 5px 8px;
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--rule);
  }

  .visit-md table.md-table td {
    padding: 5px 8px;
    color: var(--ink-2);
    border-bottom: 1px solid var(--rule-soft);
  }

  .visit-md table.md-table tr:last-child td { border-bottom: none; }
  .visit-md strong { color: var(--ink); font-weight: 600; }

  .b-ai {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 6px;
    border-radius: 999px;
    background: #e0f2fe;
    color: #075985;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    vertical-align: middle;
  }

  .ai-disclaimer {
    margin-top: 8px;
    padding: 6px 10px;
    border-left: 2px solid #075985;
    background: #f0f9ff;
    color: var(--ink-2);
    font-size: 10px;
    line-height: 1.4;
    font-style: italic;
  }

  /* ── FOOTER ─────────────────────────────── */
  .doc-foot {
    margin-top: 24px;
    padding-top: 8px;
    border-top: 1px solid var(--rule);
    font-size: 10px;
    color: var(--ink-3);
    text-align: right;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
`;

export default function VetCardPage() {
  const { t, i18n } = useTranslation('healthPassport');
  const { t: tVetCardNs } = useTranslation('vetCard');
  const lang = i18n.language === 'en' ? 'en-US' : 'sk-SK';
  const fmtDateShort = useCallback(
    (value?: string) => {
      if (!value) return '–';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
    },
    [lang]
  );
  const {
    petProfiles: dogProfiles,
    activePetId: selectedDogId,
    selectPet: setSelectedDogId,
    loading: petsLoading,
  } = useActivePet();
  const {
    vaccinations,
    dewormings,
    ectos,
    treatments,
    visits,
    medications,
    dietEntries,
    weightLogs,
    loading: healthLoading,
  } = useHealthData();

  const [exportSections, setExportSections] =
    useState<ExportSectionsState>(DEFAULT_EXPORT_SECTIONS);
  const [pdfLang, setPdfLang] = useState<PdfLang>('sk');
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_DATE_RANGE);

  const dog = dogProfiles.find((p) => p.id === selectedDogId) ?? dogProfiles[0];
  const petId = dog?.id;

  const data = useMemo(() => {
    if (!petId) return null;

    const dogVaccines = vaccinations.filter((x) => x.petId === petId);
    const dogDeworm = dewormings.filter((x) => x.petId === petId);
    const dogEctos = ectos.filter((x) => x.petId === petId);
    const dogTreatments = treatments.filter((x) => x.petId === petId);
    const dogVisits = visits.filter((x) => x.petId === petId);
    const activeMeds = medications.filter(
      (x) => x.petId === petId && (x.longTerm || !x.endDate || x.endDate >= today())
    );
    const dogDiet = dietEntries.filter((x) => x.petId === petId);
    const weightTrend = computeWeightTrend(weightLogs.filter((x) => x.petId === petId));

    const latestVaccineByType = new Map<VaccineType, VaccinationRecord>();
    [...dogVaccines]
      .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))
      .forEach((v) => {
        if (!latestVaccineByType.has(v.type)) latestVaccineByType.set(v.type, v);
      });
    const vaccineList = VACCINE_TYPE_ORDER.filter((type) => latestVaccineByType.has(type)).map(
      (type) => ({ type, record: latestVaccineByType.get(type)! })
    );
    const rabies = latestVaccineByType.get('RABIES');
    const combined = latestVaccineByType.get('COMBINED');

    const lastDeworming = [...dogDeworm].sort((a, b) => b.dateGiven.localeCompare(a.dateGiven))[0];
    const lastEcto = [...dogEctos].sort((a, b) => b.dateGiven.localeCompare(a.dateGiven))[0];
    const activeTreatments = [...dogTreatments].sort((a, b) =>
      b.dateGiven.localeCompare(a.dateGiven)
    );
    const latestDiet = [...dogDiet].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

    const significantVisits = dogVisits
      .filter((x) => x.diagnosis || x.findings || x.recommendations || x.aiExtractedText)
      .sort((a, b) => b.date.localeCompare(a.date));

    const timeline = buildClinicalTimeline(
      {
        petId,
        vaccines: dogVaccines,
        dewormings: dogDeworm,
        ectos: dogEctos,
        treatments: dogTreatments,
        visits: dogVisits,
        activeMeds,
        diet: dogDiet,
      },
      (key, opts) => String(t(key as never, opts as never)),
      fmtDateShort
    );

    return {
      rabies,
      combined,
      vaccineList,
      lastDeworming,
      lastEcto,
      activeTreatments,
      latestDiet,
      activeMeds,
      significantVisits,
      timeline,
      weightTrend,
    };
  }, [
    petId,
    vaccinations,
    dewormings,
    ectos,
    treatments,
    visits,
    medications,
    dietEntries,
    weightLogs,
    t,
    fmtDateShort,
  ]);

  const handlePrint = () => {
    if (!dog || !data) return;

    const { from: rangeFrom, to: rangeTo } = dateRange;
    const inRange = (date: string | undefined) => isWithinRange(date, rangeFrom, rangeTo);

    // Lokalizácia exportu — nezávislá od UI jazyka
    const t = i18n.getFixedT(pdfLang, 'healthPassport');
    const lang = pdfLang === 'en' ? 'en-US' : 'sk-SK';
    const fmtDate = (value?: string) => {
      if (!value) return '–';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });
    };
    const fmtDateShort = (value?: string) => {
      if (!value) return '–';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const statusBadge = (
      validUntil: string | undefined,
      appliedAt: string | undefined,
      soonDays = 30
    ): { cls: string; label: string } => {
      if (!validUntil) return { cls: 'badge-unknown', label: t('vetPage.statusUnknown') };
      const target = new Date(validUntil);
      if (Number.isNaN(target.getTime()))
        return { cls: 'badge-unknown', label: t('vetPage.statusUnknown') };
      if (appliedAt) {
        const applied = new Date(appliedAt);
        if (!Number.isNaN(applied.getTime()) && target.getTime() < applied.getTime()) {
          return { cls: 'badge-expired', label: t('vetPage.statusInvalidDates') };
        }
      }
      const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diff < 0) return { cls: 'badge-expired', label: t('vetPage.statusExpired') };
      const formatted = fmtDateShort(validUntil);
      if (diff <= soonDays)
        return { cls: 'badge-warning', label: t('vetPage.statusWillExpire', { date: formatted }) };
      return { cls: 'badge-valid', label: t('vetPage.statusValidUntil', { date: formatted }) };
    };

    // ── Markdown → HTML for PDF ──────────────────────────────
    const mdToHtml = (raw: string): string => {
      if (!raw) return '';
      const normalized = raw.replace(/\\n/g, '\n');
      const lines = normalized.split('\n');

      const esc = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const inlineBold = (s: string) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      const isTableRow = (l: string) => l.trim().startsWith('|') && l.trim().endsWith('|');
      const isSepRow = (l: string) => isTableRow(l) && /^\|[\s|:-]+\|$/.test(l.trim());
      const parseCells = (l: string) =>
        l
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());

      const out: string[] = [];
      let i = 0;

      while (i < lines.length) {
        const raw2 = lines[i];
        const t = raw2.trim();

        if (!t) {
          out.push('');
          i++;
          continue;
        }

        // Heading
        const hm = t.match(/^(#{1,6})\s+(.+)$/);
        if (hm) {
          const lvl = Math.min(hm[1].length + 2, 6);
          out.push(`<h${lvl} class="md-h">${inlineBold(hm[2])}</h${lvl}>`);
          i++;
          continue;
        }

        // Markdown table
        if (isTableRow(t)) {
          const tableLines: string[] = [];
          while (i < lines.length && isTableRow(lines[i].trim())) {
            tableLines.push(lines[i]);
            i++;
          }
          const dataRows = tableLines.filter((l) => !isSepRow(l));
          if (dataRows.length >= 1) {
            const [hdr, ...body] = dataRows;
            const cells = parseCells(hdr);
            out.push('<table class="md-table"><thead><tr>');
            cells.forEach((c) => out.push(`<th>${inlineBold(c)}</th>`));
            out.push('</tr></thead><tbody>');
            body.forEach((row) => {
              out.push('<tr>');
              parseCells(row).forEach((c) => out.push(`<td>${inlineBold(c)}</td>`));
              out.push('</tr>');
            });
            out.push('</tbody></table>');
          }
          continue;
        }

        // Unordered list
        if (t.match(/^[-*•]\s+/)) {
          out.push('<ul class="md-ul">');
          while (i < lines.length) {
            const lt = lines[i].trim();
            const lm = lt.match(/^[-*•]\s+(.+)$/);
            if (lm) {
              out.push(`<li>${inlineBold(lm[1])}</li>`);
              i++;
            } else if (!lt) {
              i++;
              break;
            } else break;
          }
          out.push('</ul>');
          continue;
        }

        // Ordered list — extract ONLY the text after "1. "
        if (t.match(/^\d+[.)]\s+/)) {
          out.push('<ol class="md-ol">');
          while (i < lines.length) {
            const lt = lines[i].trim();
            const lm = lt.match(/^\d+[.)]\s+(.+)$/);
            if (lm) {
              out.push(`<li>${inlineBold(lm[1])}</li>`);
              i++;
            } else if (!lt) {
              i++;
              break;
            } else break;
          }
          out.push('</ol>');
          continue;
        }

        // Paragraph
        const para: string[] = [];
        while (i < lines.length) {
          const lt = lines[i].trim();
          if (!lt) break;
          if (
            lt.match(/^#{1,6}\s/) ||
            isTableRow(lt) ||
            lt.match(/^[-*•]\s/) ||
            lt.match(/^\d+[.)]\s/)
          )
            break;
          para.push(lines[i]);
          i++;
        }
        if (para.length) out.push(`<p class="md-p">${inlineBold(para.join(' '))}</p>`);
      }

      return out.join('\n');
    };

    const age = ageInYears(dog);

    const dew = statusBadge(data.lastDeworming?.nextDueDate, data.lastDeworming?.dateGiven, 7);
    const ecto = statusBadge(data.lastEcto?.nextDueDate, data.lastEcto?.dateGiven, 7);

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const tagHtml = (items: string[], cls: string) =>
      items.map((x) => `<span class="tag ${cls}">${esc(x)}</span>`).join('');
    const allergyList = dedupList(dog.allergies);
    const intoleranceList = subtractList(allergyList, dog.intolerances);
    const chronicList = dedupList(
      dog.chronicConditions?.map((c) => c.title) ?? dog.healthConditions
    );

    const dogVaccinesAll = vaccinations.filter((x) => x.petId === petId);
    const dogDewormAll = dewormings.filter((x) => x.petId === petId);
    const dogEctosAll = ectos.filter((x) => x.petId === petId);
    const dogTreatmentsAll = treatments.filter((x) => x.petId === petId);
    const dogVisitsAll = visits.filter((x) => x.petId === petId);
    const dogDietAll = dietEntries.filter((x) => x.petId === petId);

    const pdfTimeline = buildClinicalTimeline(
      {
        petId: dog.id,
        vaccines: dogVaccinesAll,
        dewormings: dogDewormAll,
        ectos: dogEctosAll,
        treatments: dogTreatmentsAll,
        visits: dogVisitsAll,
        activeMeds: data.activeMeds,
        diet: dogDietAll,
      },
      (key, opts) => String(t(key as never, opts as never)),
      fmtDateShort
    ).filter((item) => inRange(item.date));

    const rangedVisits = data.significantVisits.filter((v) => inRange(v.date));

    const statusColorVar = (cls: string) =>
      cls === 'badge-valid'
        ? 'var(--valid)'
        : cls === 'badge-warning'
          ? 'var(--warning)'
          : cls === 'badge-unknown'
            ? 'var(--ink-3)'
            : 'var(--expired)';

    const vaccineRow = (
      type: string,
      name: string,
      batch: string | undefined,
      applied: string | undefined,
      until: string | undefined,
      s: { cls: string; label: string }
    ) =>
      `<tr>
        <td class="muted nowrap">${type}</td>
        <td>
          <div class="bold">${name}</div>
          ${batch ? `<div class="muted" style="font-size:10px">${t('vetPage.batch', { batch })}</div>` : ''}
        </td>
        <td class="muted nowrap">${applied ? fmtDateShort(applied) : '–'}</td>
        <td class="muted nowrap">${until ? fmtDateShort(until) : '–'}</td>
        <td class="nowrap bold" style="color:${statusColorVar(s.cls)}">${s.label}</td>
      </tr>`;

    const vaccineRows = [
      ...data.vaccineList.map(({ type, record }) =>
        vaccineRow(
          t(`vaccineTypes.${type}` as never),
          record.name,
          record.batchNumber,
          record.dateApplied,
          record.validUntil,
          statusBadge(record.validUntil, record.dateApplied)
        )
      ),
      data.lastDeworming
        ? vaccineRow(
            t('vetPage.dewormingType'),
            data.lastDeworming.productName,
            undefined,
            data.lastDeworming.dateGiven,
            data.lastDeworming.nextDueDate,
            dew
          )
        : '',
      data.lastEcto
        ? vaccineRow(
            t('vetPage.antiparasiticType'),
            data.lastEcto.productName,
            undefined,
            data.lastEcto.dateGiven,
            data.lastEcto.nextDueDate,
            ecto
          )
        : '',
      ...data.activeTreatments.map((trt) =>
        vaccineRow(
          t(`treatmentCategories.${trt.category}` as never),
          trt.form ? `${trt.name} · ${t(`treatmentForms.${trt.form}` as never)}` : trt.name,
          undefined,
          trt.dateGiven,
          trt.nextDueDate,
          statusBadge(trt.nextDueDate, trt.dateGiven, 7)
        )
      ),
    ]
      .filter(Boolean)
      .join('');

    const medRows = data.activeMeds
      .map(
        (m) => `<tr>
          <td class="bold">${m.name}</td>
          <td class="muted nowrap">${m.dose || '–'}</td>
          <td class="muted nowrap">${m.frequency || '–'}</td>
          <td class="muted">${m.reason || '–'}</td>
        </tr>`
      )
      .join('');

    const aiBadgeHtml = `<span class="b-ai">${esc(t('vetPage.aiImportBadge'))}</span>`;
    const hasAiVisits = rangedVisits.some((v) => Boolean(v.aiExtractedText));
    const visitCards = rangedVisits
      .map(
        (v) => `
        <div class="visit">
          <div class="visit-head">
            <span class="visit-date">${fmtDate(v.date)}</span>
            <span class="visit-clinic">${v.clinicName ?? t('vetPage.noClinic')}${v.aiExamType ? ` · ${v.aiExamType}` : ''}${v.aiExtractedText ? ` ${aiBadgeHtml}` : ''}</span>
          </div>
          <div class="visit-reason">${v.reason ?? ''}</div>
          ${v.diagnosis ? `<div class="visit-section-label">${t('vetPage.visitDiagnosis')}</div><div class="visit-md">${mdToHtml(v.diagnosis)}</div>` : ''}
          ${v.findings ? `<div class="visit-section-label">${t('vetPage.visitFindings')}</div><div class="visit-md">${mdToHtml(v.findings)}</div>` : ''}
          ${v.recommendations ? `<div class="visit-section-label">${t('vetPage.visitRecommendations')}</div><div class="visit-md">${mdToHtml(v.recommendations)}</div>` : ''}
        </div>`
      )
      .join('');

    const timelineItems = pdfTimeline
      .map(
        (item) => `<tr>
          <td class="muted nowrap" style="width:90px">${fmtDateShort(item.date)}</td>
          <td class="bold nowrap" style="width:130px">${t(`timeline.${item.type}` as never)}</td>
          <td>
            ${item.title}${'isAi' in item && item.isAi ? ` ${aiBadgeHtml}` : ''}
            ${item.subtitle ? `<div class="muted" style="font-size:10px">${item.subtitle}</div>` : ''}
          </td>
        </tr>`
      )
      .join('');

    const sections = exportSections;
    const allergyCount = allergyList.length;
    const chronicCount = chronicList.length;
    const heroBadges = sections.identity
      ? [
          allergyCount
            ? `<span class="b-allergies">${t('vetPage.allergies', { count: allergyCount })}</span>`
            : '',
          chronicCount
            ? `<span class="b-chronic">${t('vetPage.chronic', { count: chronicCount })}</span>`
            : '',
          data.activeMeds.length
            ? `<span class="b-meds">${t('vetPage.activeMeds', { count: data.activeMeds.length })}</span>`
            : '',
        ]
          .filter(Boolean)
          .join('<span class="b-sep">·</span>')
      : '';

    const metaParts = [
      dog.breed,
      age != null ? t('vetPage.metaAge', { age }) : '',
      dog.weightKg != null ? t('vetPage.metaWeight', { weight: dog.weightKg }) : '',
      dog.sex && dog.sex !== 'UNKNOWN'
        ? dog.sex === 'MALE'
          ? t('vetPage.metaMale')
          : t('vetPage.metaFemale')
        : '',
      dog.microchipNumber ? t('vetPage.metaChip', { chip: dog.microchipNumber }) : '',
      dog.passportNumber ? t('vetPage.metaPassport', { passport: dog.passportNumber }) : '',
    ].filter(Boolean);

    const periodLabel =
      rangeFrom || rangeTo
        ? t('vetPage.periodRange', {
            from: rangeFrom ? fmtDate(rangeFrom) : t('vetPage.periodOpenStart'),
            to: rangeTo ? fmtDate(rangeTo) : t('vetPage.periodOpenEnd'),
          })
        : '';

    // Safety alert — allergies/intolerances are the most decision-critical facts for a vet,
    // so they lead the document regardless of which sections the user toggled.
    const alertBannerHtml =
      allergyList.length || intoleranceList.length
        ? `
  <section class="alert-banner">
    <div class="alert-title">${esc(t('vetPage.alertTitle'))}</div>
    ${
      allergyList.length
        ? `<div class="alert-row"><span class="alert-label">${esc(t('vetPage.labelAllergies'))}</span>${allergyList
            .map((a) => `<span class="alert-chip">${esc(a)}</span>`)
            .join('')}</div>`
        : ''
    }
    ${
      intoleranceList.length
        ? `<div class="alert-row"><span class="alert-label">${esc(t('vetPage.labelIntolerances'))}</span>${intoleranceList
            .map((a) => `<span class="alert-chip alert-chip--amber">${esc(a)}</span>`)
            .join('')}</div>`
        : ''
    }
  </section>`
        : '';

    // Allergies/intolerances are already in the alert banner above, so the health block only
    // renders when it has something else to say (or when there is no banner at all).
    const hasConditionsContent = Boolean(chronicList.length || dog.procedures?.length || dog.notes);
    const showConditionsSection =
      sections.conditions &&
      (hasConditionsContent || !(allergyList.length || intoleranceList.length));

    const wt = data.weightTrend;
    const weightTrendHtml = wt
      ? (() => {
          const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 });
          const path = sparklinePath(
            wt.points.map((p) => p.kg),
            120,
            32
          );
          const sign = wt.deltaKg > 0 ? '+' : '';
          const deltaTxt =
            wt.direction === 'flat'
              ? t('vetPage.weightStable')
              : `${sign}${nf.format(wt.deltaKg)} kg (${sign}${nf.format(wt.deltaPct)} %)`;
          const color =
            wt.direction === 'down'
              ? 'var(--expired)'
              : wt.direction === 'up'
                ? 'var(--warning)'
                : 'var(--valid)';
          return `
  <section class="block weight-block">
    <h2 class="block-title">${t('vetPage.sectionWeight')}</h2>
    <div class="weight-row">
      <div class="weight-figure">
        <span class="weight-latest">${nf.format(wt.latest)} kg</span>
        <span class="weight-delta" style="color:${color}">${deltaTxt}</span>
      </div>
      <svg class="weight-spark" viewBox="0 0 120 32" width="120" height="32">
        <path d="${path}" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  </section>`;
        })()
      : '';

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${t('vetPage.docTitle', { name: dog.name })}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
<div class="doc">

  <header class="doc-head">
    <img class="brand-logo" src="/branding/pawly-logo-light.png" alt="Pawly" />
    <div class="head-strip">
      <span class="label">${t('vetPage.docLabel')}</span>
      <span>${new Date().toLocaleDateString(lang)}</span>
    </div>
    ${periodLabel ? `<div class="doc-period">${periodLabel}</div>` : ''}
    <h1 class="pet-name">${dog.name}</h1>
    ${
      sections.identity
        ? `
    <div class="pet-meta">${metaParts.join(' · ') || '–'}</div>
    ${heroBadges ? `<div class="head-badges">${heroBadges}</div>` : ''}`
        : ''
    }
  </header>

  ${alertBannerHtml}

  ${weightTrendHtml}

  ${
    showConditionsSection
      ? `
  <section class="block">
    <h2 class="block-title">${t('vetPage.sectionHealth')}</h2>
    ${
      chronicList.length
        ? `
    <div class="sub-label">${t('vetPage.labelChronicDiagnoses')}</div>
    <div class="tags">${tagHtml(chronicList, 'tag-blue')}</div>`
        : ''
    }
    ${
      dog.procedures?.length
        ? `
    <div class="sub-label">${t('vetPage.labelProcedures')}</div>
    <div class="tags">${tagHtml(
      dog.procedures.map((p) => `${p.title}${p.date ? ` (${p.date})` : ''}`),
      'tag-slate'
    )}</div>`
        : ''
    }
    ${
      dog.notes
        ? `
    <div class="sub-label">${t('vetPage.labelOwnerNotes')}</div>
    <div class="notes">${dog.notes}</div>`
        : ''
    }
    ${!hasConditionsContent ? `<div class="empty">${t('vetPage.emptyHealth')}</div>` : ''}
  </section>`
      : ''
  }

  ${
    sections.medications
      ? `
  <section class="block">
    <h2 class="block-title">${t('vetPage.sectionMeds')}</h2>
    ${
      data.activeMeds.length
        ? `
    <table class="data">
      <thead>
        <tr>
          <th>${t('vetPage.thName')}</th>
          <th>${t('vetPage.thDosage')}</th>
          <th>${t('vetPage.thFrequency')}</th>
          <th>${t('vetPage.thReason')}</th>
        </tr>
      </thead>
      <tbody>${medRows}</tbody>
    </table>`
        : `<div class="empty">${t('vetPage.emptyMeds')}</div>`
    }
  </section>`
      : ''
  }

  ${
    sections.prevention
      ? `
  <section class="block">
    <h2 class="block-title">${t('vetPage.sectionPrevention')}</h2>
    ${
      vaccineRows
        ? `
    <table class="data">
      <thead>
        <tr>
          <th>${t('vetPage.thType')}</th>
          <th>${t('vetPage.thName')}</th>
          <th>${t('vetPage.thApplied')}</th>
          <th>${t('vetPage.thValidUntil')}</th>
          <th>${t('vetPage.thStatus')}</th>
        </tr>
      </thead>
      <tbody>${vaccineRows}</tbody>
    </table>`
        : `<div class="empty">${t('vetPage.emptyPrevention')}</div>`
    }
  </section>`
      : ''
  }

  ${
    sections.visits && rangedVisits.length
      ? `
  <section class="block">
    <h2 class="block-title">${t('vetPage.sectionVisits')}</h2>
    ${visitCards}
    ${hasAiVisits ? `<div class="ai-disclaimer">${esc(t('vetPage.aiImportDisclaimer'))}</div>` : ''}
  </section>`
      : ''
  }

  ${
    sections.history && pdfTimeline.length
      ? `
  <section class="block">
    <h2 class="block-title">${t('vetPage.sectionHistory', { count: pdfTimeline.length })}</h2>
    <table class="data">
      <thead>
        <tr>
          <th>${t('vetPage.thDate')}</th>
          <th>${t('vetPage.thType')}</th>
          <th>${t('vetPage.thDetail')}</th>
        </tr>
      </thead>
      <tbody>${timelineItems}</tbody>
    </table>
  </section>`
      : ''
  }

  <footer class="doc-foot">
    <img class="brand-logo brand-logo--footer" src="/branding/pawly-logo-light.png" alt="Pawly" />
    ${t('vetPage.footer', { petName: dog.name, date: new Date().toLocaleDateString(lang) })}
  </footer>

</div>
</body>
</html>`;

    // ── Hidden iframe print — no popup blocker, no blob download ──
    // The iframe is injected into the current page, fonts load inside it,
    // then we call print() on its contentWindow. After the dialog closes
    // the iframe is removed automatically.
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for fonts and layout to complete, then print
    const iframeWin = iframe.contentWindow!;
    iframeWin.addEventListener('load', () => {
      setTimeout(() => {
        iframeWin.focus();
        iframeWin.print();
        // Clean up the iframe after the print dialog is dismissed
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 2000);
      }, 700);
    });
  };

  if (petsLoading || healthLoading) {
    return (
      <Box sx={{ maxWidth: 760, mx: 'auto', py: 4 }}>
        <Skeleton variant="text" width={240} height={48} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={320} height={24} sx={{ mb: 3 }} />
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={180} />
          <Skeleton variant="rounded" height={220} />
        </Stack>
      </Box>
    );
  }

  if (!dog || !data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {t('vetPage.noProfile')}
        </Typography>
        <Typography color="text.secondary">{t('vetPage.noProfileDescription')}</Typography>
      </Box>
    );
  }

  const tVetCard = (key: string, opts?: Record<string, unknown>): string =>
    String(t(`vetPage.${key}` as never, opts as never));
  const rabiesStatus = vetStatusFor(data.rabies?.validUntil, 30, tVetCard, lang);
  const combinedStatus = vetStatusFor(data.combined?.validUntil, 30, tVetCard, lang);
  const dewormingStatus = vetStatusFor(data.lastDeworming?.nextDueDate, 7, tVetCard, lang);
  const ectoStatus = vetStatusFor(data.lastEcto?.nextDueDate, 7, tVetCard, lang);

  const preventiveItems: PreventiveItem[] = [];
  data.vaccineList.forEach(({ type, record }) => {
    const vaccineStatus = vetStatusFor(record.validUntil, 30, tVetCard, lang);
    const typeLabel = t(`vaccineTypes.${type}` as never);
    preventiveItems.push({
      name: record.name ? `${typeLabel} · ${record.name}` : typeLabel,
      dateGiven: record.dateApplied,
      validUntil: record.validUntil,
      batch: record.batchNumber,
      status: vaccineStatus.status,
      statusLabel: vaccineStatus.detail,
    });
  });
  if (data.lastDeworming)
    preventiveItems.push({
      name: t('vetPage.dewormingItem', { product: data.lastDeworming.productName }),
      dateGiven: data.lastDeworming.dateGiven,
      validUntil: data.lastDeworming.nextDueDate,
      status: dewormingStatus.status,
      statusLabel: dewormingStatus.detail,
    });
  if (data.lastEcto)
    preventiveItems.push({
      name: t('vetPage.antiparasiticItem', { product: data.lastEcto.productName }),
      dateGiven: data.lastEcto.dateGiven,
      validUntil: data.lastEcto.nextDueDate,
      status: ectoStatus.status,
      statusLabel: ectoStatus.detail,
    });
  data.activeTreatments.forEach((trt) => {
    const trtStatus = vetStatusFor(trt.nextDueDate, 7, tVetCard, lang);
    preventiveItems.push({
      name: `${t(`treatmentCategories.${trt.category}` as never)} · ${trt.name}`,
      dateGiven: trt.dateGiven,
      validUntil: trt.nextDueDate,
      status: trtStatus.status,
      statusLabel: trtStatus.detail,
    });
  });

  const hasDateFilter = Boolean(dateRange.from || dateRange.to);
  const screenTimeline = hasDateFilter
    ? data.timeline.filter((e) => isWithinRange(e.date, dateRange.from, dateRange.to))
    : data.timeline;
  const screenVisits = hasDateFilter
    ? data.significantVisits.filter((v) => isWithinRange(v.date, dateRange.from, dateRange.to))
    : data.significantVisits;
  const periodChipLabel = hasDateFilter
    ? t('vetPage.periodRange', {
        from: dateRange.from ? fmtDateShort(dateRange.from) : t('vetPage.periodOpenStart'),
        to: dateRange.to ? fmtDateShort(dateRange.to) : t('vetPage.periodOpenEnd'),
      })
    : '';

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'clip' }}>
      <FeatureIntro featureKey="vetCard" icon={<DescriptionIcon />} hideOnPrint />
      <Box
        sx={{ display: 'flex', justifyContent: 'flex-end', '@media print': { display: 'none' } }}
      >
        <HelpHint text={tVetCardNs('hints.card')} />
      </Box>
      <VetCardActionBar
        exportSections={exportSections}
        onChangeSections={setExportSections}
        onExportPdf={handlePrint}
        onPrintPreview={handlePrint}
        pdfLang={pdfLang}
        onChangePdfLang={setPdfLang}
        dateRange={dateRange}
        onChangeDateRange={setDateRange}
      />

      {hasDateFilter && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mb: 1,
            '@media print': { display: 'none' },
          }}
        >
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            icon={<FilterIcon />}
            label={periodChipLabel}
            onDelete={() => setDateRange(EMPTY_DATE_RANGE)}
          />
        </Box>
      )}

      <Stack spacing={1.5}>
        <SafetyAlertBanner
          allergies={dedupList(dog.allergies)}
          intolerances={subtractList(dedupList(dog.allergies), dog.intolerances)}
        />

        <DocumentIdentityBlock
          dog={dog}
          dogProfiles={dogProfiles}
          selectedDogId={selectedDogId}
          onSelectDog={setSelectedDogId}
        />

        <HealthProfileChips dog={dog} />

        <VetCardStatusOverview
          rabies={rabiesStatus}
          combined={combinedStatus}
          deworming={dewormingStatus}
          ecto={ectoStatus}
        />

        {data.weightTrend && <WeightTrendCard trend={data.weightTrend} />}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
            gap: 1.5,
            alignItems: 'stretch',
            // outer side rails for the 2-col row; inner cards are borderless
            overflow: 'hidden',
            borderColor: 'divider',
            borderStyle: 'solid',
            borderWidth: 0,
            borderLeftWidth: 1,
            borderRightWidth: 1,
          }}
        >
          <PreventiveCareCard items={preventiveItems} />
          <ActiveMedicationsCard medications={data.activeMeds} />
        </Box>

        <RecentVisitsCard visits={screenVisits} />

        <Card
          variant="outlined"
          sx={{
            p: { xs: 1.5, md: 2 },
            // closes the monolith: keep left/right/bottom borders, round the bottom corners
            bgcolor: 'background.default',
            borderTopWidth: 0,
            borderRadius: 4,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            overflow: 'hidden',
          }}
        >
          <ClinicalHistory timeline={screenTimeline} />
        </Card>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', display: 'block', py: 2 }}
        >
          {t('vetPage.footer', {
            petName: dog.name,
            date: new Date().toLocaleDateString(lang),
          })}
        </Typography>
      </Stack>
    </Box>
  );
}
