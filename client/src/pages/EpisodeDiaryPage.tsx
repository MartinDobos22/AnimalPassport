import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  MenuBook as MenuBookIcon,
  EventBusy as EventBusyIcon,
  Pets as PetsIcon,
} from '@mui/icons-material';
import EmptyState from '../components/EmptyState';
import FeatureIntro from '../components/FeatureIntro';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import SearchableSelect from '../components/ui/SearchableSelect';
import { useConfirm } from '../hooks/useConfirm';
import EpisodeFiltersBar from '../components/episodes/EpisodeFiltersBar';
import EpisodeListItem from '../components/episodes/EpisodeListItem';
import EpisodeFormDialog from '../components/episodes/EpisodeFormDialog';
import SimilarEpisodesDialog from '../components/episodes/SimilarEpisodesDialog';
import { useHealthEpisodes } from '../hooks/useHealthEpisodes';
import { useEpisodeStorageSize } from '../hooks/useEpisodeStorageSize';
import { useActivePet } from '../hooks/useActivePet';
import { useHealthData } from '../hooks/useHealthData';
import { filterEpisodes, sortEpisodesNewestFirst } from '../utils/episodeFilters';
import type { EpisodeCategory, EpisodeOutcome, HealthEpisodeRecord } from '../types/healthEpisode';

export default function EpisodeDiaryPage() {
  const { t } = useTranslation('episodes');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();

  const {
    petProfiles: dogProfiles,
    activePetId: selectedDogId,
    selectPet: setSelectedDogId,
    loading: petsLoading,
  } = useActivePet();
  const { medications, visits: vetVisits } = useHealthData();

  const { episodes, byDog, add, update, remove } = useHealthEpisodes();
  const { confirm, dialog: confirmDialog } = useConfirm();
  const dogEpisodes = byDog(selectedDogId);
  const storage = useEpisodeStorageSize(episodes);

  const [categoryFilter, setCategoryFilter] = useState<EpisodeCategory | 'all'>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<EpisodeOutcome | 'all'>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HealthEpisodeRecord | undefined>(undefined);
  const [similarFor, setSimilarFor] = useState<HealthEpisodeRecord | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>(
    {
      open: false,
      msg: '',
      severity: 'success',
    }
  );

  const filtered = useMemo(
    () =>
      sortEpisodesNewestFirst(
        filterEpisodes(dogEpisodes, {
          category: categoryFilter,
          outcome: outcomeFilter,
          query,
        })
      ),
    [dogEpisodes, categoryFilter, outcomeFilter, query]
  );

  if (petsLoading) return null;
  if (dogProfiles.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {t('page.noPetsTitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t('page.noPetsDescription')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/profily')}>
          {t('page.createProfile')}
        </Button>
      </Box>
    );
  }

  const handleSave = async (
    payload: Omit<HealthEpisodeRecord, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    try {
      if (id) {
        await update(id, payload);
      } else {
        await add(payload);
      }
      setFormOpen(false);
      setEditing(undefined);
      setSnack({ open: true, msg: tCommon('saved'), severity: 'success' });
    } catch {
      setSnack({ open: true, msg: tCommon('saveFailed'), severity: 'error' });
    }
  };

  const handleEdit = (episode: HealthEpisodeRecord) => {
    setEditing(episode);
    setFormOpen(true);
  };

  const handleDelete = async (episode: HealthEpisodeRecord) => {
    const ok = await confirm({
      title: tCommon('actions.confirmDeleteRecordTitle'),
      message: t('delete.confirm', { title: episode.symptomTitle }),
      confirmLabel: tCommon('actions.delete'),
      danger: true,
    });
    if (!ok) return;
    remove(episode.id);
    if (expandedId === episode.id) setExpandedId(null);
  };

  const handleFindSimilar = (episode: HealthEpisodeRecord) => {
    setSimilarFor(episode);
  };

  const storageWarning = storage.isCritical
    ? t('page.storageWarning', { used: storage.megabytes.toFixed(1), limit: storage.limitMb })
    : undefined;

  return (
    <PageContainer>
      <FeatureIntro featureKey="diary" icon={<MenuBookIcon />} />
      <PageHeader
        icon={<MenuBookIcon />}
        title={t('page.title')}
        description={t('page.description')}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
            disabled={!selectedDogId}
          >
            {t('page.newEpisode')}
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <SearchableSelect
              label={t('page.dogSelect')}
              value={selectedDogId}
              options={dogProfiles.map((p) => ({ value: p.id, label: p.name }))}
              onChange={(next) => {
                setSelectedDogId(next);
                setExpandedId(null);
              }}
              sx={{ minWidth: 220 }}
            />
            <Box sx={{ flex: 1 }} />
            {storage.isApproachingLimit && (
              <Chip
                size="small"
                color={storage.isCritical ? 'error' : 'warning'}
                label={t('page.storageUsage', {
                  used: storage.megabytes.toFixed(1),
                  limit: storage.limitMb,
                })}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      <EpisodeFiltersBar
        category={categoryFilter}
        outcome={outcomeFilter}
        query={query}
        onCategoryChange={setCategoryFilter}
        onOutcomeChange={setOutcomeFilter}
        onQueryChange={setQuery}
      />

      {dogEpisodes.length === 0 ? (
        <Box sx={{ pt: 2 }}>
          <EmptyState
            icon={<EventBusyIcon />}
            title={t('empty.noEpisodesTitle')}
            description={t('empty.noEpisodesDescription')}
            primaryAction={{
              label: t('empty.addFirst'),
              icon: <AddIcon />,
              onClick: () => {
                setEditing(undefined);
                setFormOpen(true);
              },
            }}
          />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ pt: 2 }}>
          <EmptyState
            icon={<EventBusyIcon />}
            title={t('empty.noFilterResultsTitle')}
            description={t('empty.noFilterResultsDescription')}
            variant="inline"
          />
        </Box>
      ) : (
        <Box>
          {filtered.map((episode) => (
            <EpisodeListItem
              key={episode.id}
              episode={episode}
              expanded={expandedId === episode.id}
              onToggle={() => setExpandedId(expandedId === episode.id ? null : episode.id)}
              onEdit={() => handleEdit(episode)}
              onDelete={() => handleDelete(episode)}
              onFindSimilar={() => handleFindSimilar(episode)}
              medications={medications}
              vetVisits={vetVisits}
            />
          ))}
        </Box>
      )}

      <EpisodeFormDialog
        open={formOpen}
        initial={editing}
        petId={selectedDogId}
        medications={medications}
        vetVisits={vetVisits}
        storageWarning={storageWarning}
        onClose={() => {
          setFormOpen(false);
          setEditing(undefined);
        }}
        onSave={handleSave}
      />

      <SimilarEpisodesDialog
        open={Boolean(similarFor)}
        currentEpisode={similarFor}
        pastEpisodes={dogEpisodes}
        onClose={() => setSimilarFor(null)}
        onOpenEpisode={(id) => {
          setSimilarFor(null);
          setExpandedId(id);
          requestAnimationFrame(() => {
            const el = document.getElementById(`episode-${id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
      {confirmDialog}
    </PageContainer>
  );
}
