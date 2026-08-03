import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useSetCurrentFood } from '../../hooks/useSetCurrentFood';
import { useHealthData } from '../../hooks/useHealthData';
import { today } from '../healthPassport/utils';
import SearchableSelect from '../ui/SearchableSelect';
import type { DietEntry, FoodType } from '../../types/petHealth';

interface Props {
  open: boolean;
  onClose: () => void;
  petId: string;
  defaultName?: string;
  defaultType?: FoodType;
  suitabilityStatus?: DietEntry['suitabilityStatus'];
  suitabilityReasons?: string[];
  onSaved?: () => void;
}

const SINGULAR_TYPES: FoodType[] = ['main', 'wet'];
const TYPE_OPTIONS: FoodType[] = ['main', 'wet', 'treats', 'supplement'];

export default function SetCurrentFoodDialog({
  open,
  onClose,
  petId,
  defaultName,
  defaultType = 'main',
  suitabilityStatus,
  suitabilityReasons,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const setCurrentFood = useSetCurrentFood();
  const { dietEntries } = useHealthData();

  const [foodName, setFoodName] = useState(defaultName ?? '');
  const [foodType, setFoodType] = useState<FoodType>(defaultType);
  const [startedAt, setStartedAt] = useState(today());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFoodName(defaultName ?? '');
      setFoodType(defaultType);
      setStartedAt(today());
      setNote('');
      setError(null);
    }
  }, [open, defaultName, defaultType]);

  const typeLabel = (ty: FoodType): string =>
    ty === 'wet'
      ? t('food.typeWet')
      : ty === 'treats'
        ? t('food.typeTreats')
        : ty === 'supplement'
          ? t('food.typeSupplement')
          : t('food.typeMain');

  const replacedName = useMemo(() => {
    if (!SINGULAR_TYPES.includes(foodType)) return null;
    const open = dietEntries.find(
      (d) => d.petId === petId && (d.foodType ?? 'main') === foodType && !d.endedAt
    );
    return open?.foodName ?? null;
  }, [dietEntries, petId, foodType]);

  const handleSave = async () => {
    if (!foodName.trim() || !petId) return;
    setSaving(true);
    setError(null);
    try {
      await setCurrentFood({
        petId,
        foodName: foodName.trim(),
        foodType,
        startedAt,
        note: note.trim() || undefined,
        suitabilityStatus,
        suitabilityReasons,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('food.save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('food.dialogTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <SearchableSelect
            label={t('food.type')}
            value={foodType}
            options={TYPE_OPTIONS.map((ty) => ({ value: ty, label: typeLabel(ty) }))}
            onChange={(next) => setFoodType(next as FoodType)}
            size="medium"
            fullWidth
          />
          {replacedName && (
            <Alert severity="warning">{t('food.overwriteWarning', { name: replacedName })}</Alert>
          )}
          <TextField
            label={t('food.foodName')}
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            autoFocus
            fullWidth
            required
          />
          <TextField
            label={t('food.startedAt')}
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label={t('food.note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('food.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !foodName.trim()}>
          {saving ? t('food.saving') : t('food.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
