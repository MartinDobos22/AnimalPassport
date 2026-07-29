import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, Card, Divider, Stack, Typography, useTheme } from '@mui/material';
import {
  Pets as PetsIcon,
  Restaurant as FoodIcon,
  Event as EventIcon,
  FactCheck as CheckInIcon,
} from '@mui/icons-material';
import type { PetProfile } from '../../types';
import type { CheckIn, DietEntry, PetCareStatus } from '../../types/petHealth';
import type { UpcomingItem } from '../../services/notificationsApi';
import IconTile from '../ui/IconTile';
import CareStatusChip from './CareStatusChip';

interface Props {
  pet: PetProfile;
  status?: PetCareStatus;
  currentFood?: DietEntry;
  nextReminder?: UpcomingItem;
  lastCheckIn?: CheckIn;
}

interface InfoRowProps {
  icon: ReactNode;
  accent: string;
  label: string;
  value: string;
}

function InfoRow({ icon, accent, label, value }: InfoRowProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <IconTile icon={icon} accent={accent} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function PetStatusCard({
  pet,
  status,
  currentFood,
  nextReminder,
  lastCheckIn,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const action = status?.recommendedAction;

  const formatDays = (days: number): string => {
    if (days < 0) return t('overview.overdue', { days: Math.abs(days) });
    if (days === 0) return t('overview.today');
    return t('overview.inDays', { days });
  };

  return (
    <Card
      sx={{
        p: theme.spacing(2.5),
        height: '100%',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5),
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        '&:hover': { transform: 'translateY(-1px)', boxShadow: theme.shadows[2] },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar
          src={pet.photoUrl ?? undefined}
          sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}
        >
          {pet.photoUrl ? null : <PetsIcon />}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {pet.name}
          </Typography>
          {pet.breed && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {pet.breed}
            </Typography>
          )}
        </Box>
        {status && (
          <CareStatusChip
            level={status.status}
            count={status.status === 'green' ? undefined : status.reasons.length}
          />
        )}
      </Stack>

      {status && status.reasons.length > 0 && (
        <Stack component="ul" sx={{ m: 0, pl: theme.spacing(2.5) }} spacing={0.25}>
          {status.reasons.map((reason, i) => (
            <Typography key={i} component="li" variant="body2" color="text.secondary">
              {reason}
            </Typography>
          ))}
        </Stack>
      )}

      <Divider />

      <Stack spacing={1.25}>
        <InfoRow
          icon={<FoodIcon />}
          accent={theme.palette.diet.main}
          label={t('overview.currentFood')}
          value={currentFood ? currentFood.foodName : t('overview.noCurrentFood')}
        />
        <InfoRow
          icon={<EventIcon />}
          accent={theme.palette.secondary.main}
          label={t('overview.nextReminder')}
          value={
            nextReminder
              ? `${nextReminder.typeLabel} — ${formatDays(nextReminder.daysUntil)}`
              : t('overview.noReminders')
          }
        />
        <InfoRow
          icon={<CheckInIcon />}
          accent={theme.palette.info.main}
          label={t('overview.lastCheckIn')}
          value={lastCheckIn ? lastCheckIn.date : t('overview.noCheckIn')}
        />
      </Stack>

      {action && (
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate(action.route)}
          sx={{ alignSelf: 'flex-start', mt: 'auto', pt: theme.spacing(0.5) }}
        >
          {action.label}
        </Button>
      )}
    </Card>
  );
}
