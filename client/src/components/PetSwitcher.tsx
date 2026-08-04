import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  ButtonBase,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  KeyboardArrowDown as ChevronIcon,
  Pets as PetsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useActivePet } from '../hooks/useActivePet';
import type { PetProfile } from '../types';

interface Props {
  variant?: 'sidebar' | 'compact';
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

export default function PetSwitcher({ variant = 'sidebar' }: Props) {
  const { t } = useTranslation(['common', 'healthPassport']);
  const theme = useTheme();
  const navigate = useNavigate();
  const { activePet, selectPet, petProfiles: dogProfiles } = useActivePet();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const open = Boolean(anchor);
  const handleOpen = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const handleClose = () => setAnchor(null);

  const handleSelect = (id: string) => {
    selectPet(id);
    handleClose();
  };

  const handleManage = () => {
    handleClose();
    navigate('/profily');
  };

  const isCompact = variant === 'compact';
  const avatarSize = isCompact ? 36 : 44;

  const speciesLabel = (pet: PetProfile) => {
    if (pet.animalType === 'other' && pet.customSpecies?.trim()) {
      return pet.customSpecies.trim();
    }
    return t(`profiles.species.${pet.animalType}`, { ns: 'healthPassport' });
  };

  const empty = !activePet;
  const subtitle = activePet
    ? [
        activePet.breed || speciesLabel(activePet),
        activePet.weightKg ? `${activePet.weightKg} kg` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : t('petSwitcher.noProfile');

  return (
    <>
      <ButtonBase
        onClick={handleOpen}
        aria-label={t('petSwitcher.aria')}
        sx={{
          width: '100%',
          borderRadius: 2,
          px: isCompact ? 1 : 1.5,
          py: isCompact ? 0.75 : 1.25,
          gap: 1.25,
          justifyContent: 'flex-start',
          textAlign: 'left',
          bgcolor: 'transparent',
          transition: 'background-color 120ms ease',
          '&:hover': { bgcolor: 'action.hover' },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <Avatar
          src={activePet?.photoUrl || undefined}
          alt={activePet?.name ?? 'Pet'}
          sx={{
            width: avatarSize,
            height: avatarSize,
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            fontWeight: 700,
            fontSize: isCompact ? '0.85rem' : '0.95rem',
          }}
        >
          {activePet ? (
            initialsOf(activePet.name) || <PetsIcon fontSize="small" />
          ) : (
            <PetsIcon fontSize="small" />
          )}
        </Avatar>
        <Stack sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 700,
              lineHeight: 1.15,
              color: empty ? 'text.secondary' : 'text.primary',
            }}
          >
            {activePet?.name ?? t('petSwitcher.addPet')}
          </Typography>
          {!isCompact && (
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
            >
              {subtitle}
            </Typography>
          )}
        </Stack>
        <ChevronIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
      </ButtonBase>

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.12)}`,
          },
        }}
      >
        {dogProfiles.length === 0 && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t('petSwitcher.noProfiles')}
            </Typography>
          </Box>
        )}
        {dogProfiles.map((dog) => (
          <MenuItem
            key={dog.id}
            selected={dog.id === activePet?.id}
            onClick={() => handleSelect(dog.id)}
            sx={{ gap: 1.5, py: 1 }}
          >
            <Avatar
              src={dog.photoUrl || undefined}
              alt={dog.name}
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.light',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {initialsOf(dog.name) || <PetsIcon fontSize="small" />}
            </Avatar>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                {dog.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'none', letterSpacing: 0 }}
                noWrap
              >
                {dog.breed || speciesLabel(dog)}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleManage} sx={{ gap: 1.5, py: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: `1px dashed ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
            }}
          >
            <AddIcon fontSize="small" />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t('petSwitcher.manage')}
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
