import { useTranslation } from 'react-i18next';
import { Box, Collapse, Stack, Switch, Typography } from '@mui/material';
import {
  Biotech as DewormIcon,
  Healing as HealingIcon,
  Link as LinkIcon,
  Medication as MedIcon,
  PestControl as EctoIcon,
  Restaurant as DietIcon,
  Vaccines as VaccinesIcon,
} from '@mui/icons-material';

import type { Dispatch } from 'react';

import type {
  DewormingFieldsValues,
  DietFieldsValues,
  EctoFieldsValues,
  ErrorMap,
  LinkedKind,
  LinkedRecordsValues,
  MedicationFieldsValues,
  TreatmentFieldsValues,
  VaccinationFieldsValues,
} from '../formTypes';
import type { ManualFormAction } from '../useAddRecordForm';
import VaccinationFields from './linked/VaccinationFields';
import DewormingFields from './linked/DewormingFields';
import EctoFields from './linked/EctoFields';
import TreatmentFields from './linked/TreatmentFields';
import MedicationFields from './linked/MedicationFields';
import DietFields from './linked/DietFields';
import SectionCard from './SectionCard';

interface LinkedRecordsProps {
  values: LinkedRecordsValues;
  errors: ErrorMap;
  baseDate: string;
  expanded: boolean;
  onExpand: (next: boolean) => void;
  dispatch: Dispatch<ManualFormAction>;
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  hint: string;
  on: boolean;
  onToggle: (next: boolean) => void;
  children?: React.ReactNode;
}

function Row({ icon, label, hint, on, onToggle, children }: RowProps) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
      <Stack direction="row" alignItems="flex-start" gap={1.5}>
        <Box sx={{ color: 'text.secondary', display: 'flex', mt: 0.25 }}>{icon}</Box>
        <Stack sx={{ flex: 1, minWidth: 0 }} spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
          >
            {hint}
          </Typography>
        </Stack>
        <Switch checked={on} onChange={(e) => onToggle(e.target.checked)} />
      </Stack>
      <Collapse in={on} timeout="auto" unmountOnExit>
        <Box sx={{ pt: 1.5 }}>{children}</Box>
      </Collapse>
    </Box>
  );
}

export default function LinkedRecords({
  values,
  errors,
  baseDate,
  expanded,
  onExpand,
  dispatch,
}: LinkedRecordsProps) {
  const { t } = useTranslation('healthPassport');

  const setVaccinationField = <K extends keyof VaccinationFieldsValues>(
    field: K,
    value: VaccinationFieldsValues[K]
  ) => dispatch({ type: 'SET_VACCINATION_FIELD', field, value });

  const setDewormingField = <K extends keyof DewormingFieldsValues>(
    field: K,
    value: DewormingFieldsValues[K]
  ) => dispatch({ type: 'SET_DEWORMING_FIELD', field, value });

  const setEctoField = <K extends keyof EctoFieldsValues>(field: K, value: EctoFieldsValues[K]) =>
    dispatch({ type: 'SET_ECTO_FIELD', field, value });

  const setTreatmentField = <K extends keyof TreatmentFieldsValues>(
    field: K,
    value: TreatmentFieldsValues[K]
  ) => dispatch({ type: 'SET_TREATMENT_FIELD', field, value });

  const setMedicationField = <K extends keyof MedicationFieldsValues>(
    field: K,
    value: MedicationFieldsValues[K]
  ) => dispatch({ type: 'SET_MEDICATION_FIELD', field, value });

  const setDietField = <K extends keyof DietFieldsValues>(field: K, value: DietFieldsValues[K]) =>
    dispatch({ type: 'SET_DIET_FIELD', field, value });

  const toggle = (kind: LinkedKind, on: boolean) => dispatch({ type: 'TOGGLE_LINKED', kind, on });

  return (
    <SectionCard
      title={t('linkedRecords.title')}
      description={t('linkedRecords.description')}
      icon={<LinkIcon />}
      collapsible
      expanded={expanded}
      onExpandChange={onExpand}
    >
      <Stack spacing={1.25}>
        <Row
          icon={<VaccinesIcon fontSize="small" />}
          label={t('linkedRecords.vaccination.label')}
          hint={t('linkedRecords.vaccination.hint')}
          on={Boolean(values.vaccination)}
          onToggle={(next) => toggle('vaccination', next)}
        >
          {values.vaccination && (
            <VaccinationFields
              values={values.vaccination}
              errorName={errors['linked.vaccination.name']}
              errorValidUntil={errors['linked.vaccination.validUntil']}
              onChange={setVaccinationField}
            />
          )}
        </Row>

        <Row
          icon={<DewormIcon fontSize="small" />}
          label={t('linkedRecords.deworming.label')}
          hint={t('linkedRecords.deworming.hint')}
          on={Boolean(values.deworming)}
          onToggle={(next) => toggle('deworming', next)}
        >
          {values.deworming && (
            <DewormingFields
              values={values.deworming}
              baseDate={baseDate}
              errorProduct={errors['linked.deworming.product']}
              onChange={setDewormingField}
            />
          )}
        </Row>

        <Row
          icon={<EctoIcon fontSize="small" />}
          label={t('linkedRecords.ecto.label')}
          hint={t('linkedRecords.ecto.hint')}
          on={Boolean(values.ecto)}
          onToggle={(next) => toggle('ecto', next)}
        >
          {values.ecto && (
            <EctoFields
              values={values.ecto}
              baseDate={baseDate}
              errorProduct={errors['linked.ecto.product']}
              onChange={setEctoField}
            />
          )}
        </Row>

        <Row
          icon={<HealingIcon fontSize="small" />}
          label={t('linkedRecords.treatment.label')}
          hint={t('linkedRecords.treatment.hint')}
          on={Boolean(values.treatment)}
          onToggle={(next) => toggle('treatment', next)}
        >
          {values.treatment && (
            <TreatmentFields
              values={values.treatment}
              baseDate={baseDate}
              errorName={errors['linked.treatment.name']}
              onChange={setTreatmentField}
            />
          )}
        </Row>

        <Row
          icon={<MedIcon fontSize="small" />}
          label={t('linkedRecords.medication.label')}
          hint={t('linkedRecords.medication.hint')}
          on={Boolean(values.medication)}
          onToggle={(next) => toggle('medication', next)}
        >
          {values.medication && (
            <MedicationFields
              values={values.medication}
              errorName={errors['linked.medication.name']}
              onChange={setMedicationField}
            />
          )}
        </Row>

        <Row
          icon={<DietIcon fontSize="small" />}
          label={t('linkedRecords.diet.label')}
          hint={t('linkedRecords.diet.hint')}
          on={Boolean(values.diet)}
          onToggle={(next) => toggle('diet', next)}
        >
          {values.diet && (
            <DietFields
              values={values.diet}
              errorFoodName={errors['linked.diet.foodName']}
              onChange={setDietField}
            />
          )}
        </Row>
      </Stack>
    </SectionCard>
  );
}
