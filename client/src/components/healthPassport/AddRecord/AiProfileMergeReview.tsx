import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

import { usePetProfiles } from '../../../hooks/usePetProfiles';
import {
  IDENTIFIER_LABELS,
  type IdentifierKey,
  type MergeAcceptance,
  type PetProfilePatch,
  mergePetProfile,
} from '../../../utils/petProfileMerge';

interface Props {
  petId: string;
  patch: PetProfilePatch;
  onDone: (changedFields: string[]) => void;
  onSkip: () => void;
}

const SEX_KEYS = {
  MALE: 'aiProfileMerge.sexMale',
  FEMALE: 'aiProfileMerge.sexFemale',
  UNKNOWN: 'aiProfileMerge.sexUnknown',
} as const;

function describeValue(_key: IdentifierKey, value: string | undefined): string {
  if (!value) return '';
  return value;
}

export default function AiProfileMergeReview({ petId, patch, onDone, onSkip }: Props) {
  const { t } = useTranslation('healthPassport');
  const { profiles, updateProfile } = usePetProfiles();
  const profile = useMemo(() => profiles.find((p) => p.id === petId) ?? null, [profiles, petId]);

  const identifierEntries = useMemo(() => {
    if (!patch.identifiers) return [];
    return (Object.keys(IDENTIFIER_LABELS) as IdentifierKey[])
      .map((key) => {
        const incoming = patch.identifiers?.[key];
        if (!incoming || (typeof incoming === 'string' && incoming.trim() === '')) return null;
        const existing = profile ? profile[key] : undefined;
        const existingStr = typeof existing === 'string' ? existing : '';
        return {
          key,
          incoming: incoming as string,
          existingStr,
          isEmptyExisting: existingStr.trim() === '',
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [patch.identifiers, profile]);

  const allergyEntries = useMemo(() => {
    if (!patch.allergies) return [];
    const existing = new Set((profile?.allergies ?? []).map((a) => a.trim().toLowerCase()));
    return patch.allergies
      .map((a) => a.trim())
      .filter((a) => a !== '')
      .filter((a) => !existing.has(a.toLowerCase()));
  }, [patch.allergies, profile]);

  const allergiesAlreadyInProfile = useMemo(() => {
    if (!patch.allergies) return 0;
    const existing = new Set((profile?.allergies ?? []).map((a) => a.trim().toLowerCase()));
    const incoming = new Set(
      patch.allergies.map((a) => a.trim().toLowerCase()).filter((a) => a !== '')
    );
    let count = 0;
    incoming.forEach((key) => {
      if (existing.has(key)) count += 1;
    });
    return count;
  }, [patch.allergies, profile]);

  const chronicEntries = useMemo(() => {
    if (!patch.chronicConditions) return [];
    const existing = new Set(
      (profile?.chronicConditions ?? []).map((c) => c.title.trim().toLowerCase())
    );
    return patch.chronicConditions
      .map((c) => c.trim())
      .filter((c) => c !== '')
      .filter((c) => !existing.has(c.toLowerCase()));
  }, [patch.chronicConditions, profile]);

  const initialIdentifierAcceptance = useMemo(() => {
    const acc: Partial<Record<IdentifierKey, boolean>> = {};
    identifierEntries.forEach((entry) => {
      acc[entry.key] = entry.isEmptyExisting;
    });
    return acc;
  }, [identifierEntries]);

  const [identifierAccept, setIdentifierAccept] = useState<Partial<Record<IdentifierKey, boolean>>>(
    initialIdentifierAcceptance
  );
  const [allergyAccept, setAllergyAccept] = useState<string[]>(allergyEntries);
  const [chronicAccept, setChronicAccept] = useState<string[]>(chronicEntries);

  if (!profile) {
    return <Alert severity="info">{t('aiProfileMerge.noPet')}</Alert>;
  }

  const hasAnything =
    identifierEntries.length > 0 ||
    allergyEntries.length > 0 ||
    chronicEntries.length > 0 ||
    allergiesAlreadyInProfile > 0;

  if (!hasAnything) return null;

  const toggleIdentifier = (key: IdentifierKey) =>
    setIdentifierAccept((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleChronic = (value: string) =>
    setChronicAccept((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const canApply =
    Object.values(identifierAccept).some(Boolean) ||
    allergyAccept.length > 0 ||
    chronicAccept.length > 0;

  const handleApply = async () => {
    const acceptance: MergeAcceptance = {
      identifiers: identifierAccept,
      allergies: allergyAccept,
      chronicConditions: chronicAccept,
    };
    const { merged, changedFields } = mergePetProfile(profile, patch, acceptance);
    await updateProfile(merged.id, merged);
    onDone(changedFields);
  };

  return (
    <Card variant="outlined" sx={{ p: 2, mb: 1.5 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PersonIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t('aiProfileMerge.addToProfile', { name: profile.name })}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {t('aiProfileMerge.description')}
        </Typography>

        {allergiesAlreadyInProfile > 0 && (
          <Alert severity="info" sx={{ py: 0.5 }}>
            {t('aiProfileMerge.allergiesAlreadyInProfile', { count: allergiesAlreadyInProfile })}
          </Alert>
        )}

        {identifierEntries.length > 0 && (
          <Box>
            <Typography variant="overline" color="text.secondary">
              {t('aiProfileMerge.identifiers')}
            </Typography>
            <Stack>
              {identifierEntries.map((entry) => {
                const label = IDENTIFIER_LABELS[entry.key];
                const resolveSex = (v: string) =>
                  entry.key === 'sex' && v in SEX_KEYS
                    ? t(SEX_KEYS[v as keyof typeof SEX_KEYS])
                    : v;
                const incomingLabel = resolveSex(describeValue(entry.key, entry.incoming));
                const existingLabel = entry.isEmptyExisting
                  ? t('aiProfileMerge.empty')
                  : resolveSex(describeValue(entry.key, entry.existingStr));
                return (
                  <FormControlLabel
                    key={entry.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={Boolean(identifierAccept[entry.key])}
                        onChange={() => toggleIdentifier(entry.key)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          <strong>{label}:</strong> {incomingLabel}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            textTransform: 'none',
                            letterSpacing: 0,
                            fontSize: '0.75rem',
                            fontWeight: 400,
                          }}
                        >
                          {t('aiProfileMerge.currentValue', { value: existingLabel })}
                          {!entry.isEmptyExisting && ` ${t('aiProfileMerge.preserved')}`}
                        </Typography>
                      </Box>
                    }
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        {(allergyEntries.length > 0 || allergyAccept.length > 0) && (
          <Box>
            <Typography variant="overline" color="text.secondary">
              {t('aiProfileMerge.allergies')}
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={[] as string[]}
              value={allergyAccept}
              onChange={(_e, newValue) =>
                setAllergyAccept(
                  newValue
                    .map((v) => v.trim())
                    .filter((v, i, arr) => v !== '' && arr.indexOf(v) === i)
                )
              }
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={`${option}-${index}`}
                    size="small"
                    variant="outlined"
                    label={option}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder={t('aiProfileMerge.allergiesEditPlaceholder')}
                  helperText={t('aiProfileMerge.allergiesEditHint')}
                />
              )}
            />
          </Box>
        )}

        {chronicEntries.length > 0 && (
          <Box>
            <Typography variant="overline" color="text.secondary">
              {t('aiProfileMerge.chronic')}
            </Typography>
            <Stack>
              {chronicEntries.map((c) => (
                <FormControlLabel
                  key={c}
                  control={
                    <Checkbox
                      size="small"
                      checked={chronicAccept.includes(c)}
                      onChange={() => toggleChronic(c)}
                    />
                  }
                  label={<Typography variant="body2">{c}</Typography>}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button onClick={onSkip} size="small">
            {t('aiProfileMerge.skip')}
          </Button>
          <Button variant="contained" onClick={handleApply} size="small" disabled={!canApply}>
            {t('aiProfileMerge.apply')}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
