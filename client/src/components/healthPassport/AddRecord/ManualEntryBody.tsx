import { useTranslation } from 'react-i18next';
import { Alert, Box, Stack } from '@mui/material';

import { useManualEntry } from './ManualEntry';
import VisitBasics from './sections/VisitBasics';
import ClinicalNotes from './sections/ClinicalNotes';
import LinkedRecords from './sections/LinkedRecords';
import Expenses from './sections/Expenses';

export default function ManualEntryBody() {
  const { t } = useTranslation('healthPassport');
  const {
    state,
    dispatch,
    errors,
    errorCount,
    clinicalOpen,
    setClinicalOpen,
    linkedOpen,
    setLinkedOpen,
    expensesOpen,
    setExpensesOpen,
  } = useManualEntry();

  return (
    <Stack spacing={1.25}>
      {state.submitAttempted && errorCount > 0 && (
        <Alert severity="error">{t('addRecord.required', { count: errorCount })}</Alert>
      )}

      <VisitBasics
        values={state.basics}
        errors={errors}
        onChange={(field, value) => dispatch({ type: 'SET_BASICS_FIELD', field, value })}
      />

      <Box
        sx={{
          pl: { xs: 1.5, sm: 2 },
          ml: { xs: 0.5, sm: 1 },
          borderLeft: '2px solid',
          borderColor: 'divider',
        }}
      >
        <LinkedRecords
          values={state.linked}
          errors={errors}
          baseDate={state.basics.date}
          expanded={linkedOpen}
          onExpand={setLinkedOpen}
          dispatch={dispatch}
        />
      </Box>

      <ClinicalNotes
        values={state.clinical}
        expanded={clinicalOpen}
        onExpand={setClinicalOpen}
        onChange={(field, value) => dispatch({ type: 'SET_CLINICAL_FIELD', field, value })}
      />

      <Expenses
        values={state.expenses}
        errors={errors}
        expanded={expensesOpen}
        onExpand={setExpensesOpen}
        onChange={(field, value) => dispatch({ type: 'SET_EXPENSE_FIELD', field, value })}
      />
    </Stack>
  );
}
