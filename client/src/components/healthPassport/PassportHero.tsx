import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  CircularProgress,
  FormControl,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ChevronRight as ChevronIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  PhotoCamera as PhotoCameraIcon,
  PhotoLibrary as PhotoLibraryIcon,
} from '@mui/icons-material';
import type { PetProfile } from '../../types';
import { petPhotoStock, petPhotoSvg } from '../../utils/petPhotoDefaults';
import HealthScoreRing from './HealthScoreRing';

export interface HeroInfoCard {
  key: string;
  icon: ReactElement;
  label: string;
  value: string;
  /** Resolved theme color for the tinted icon tile. */
  accent: string;
  onClick?: () => void;
}

interface Props {
  dog: PetProfile;
  dogProfiles: PetProfile[];
  selectedDogId: string;
  onSelectDog: (id: string) => void;
  score: number | null;
  infoCards: HeroInfoCard[];
  onEditProfile: () => void;
  onPhotoSelected?: (file: File) => void;
  onPhotoRemove?: () => void;
  photoUploading?: boolean;
}

// Fixed brand scrim over the hero photo. It must stay constant in BOTH light and dark
// mode so the white hero text stays legible, so it is intentionally not theme-derived
// (the photo behind it is the same in either mode).
const HERO_SCRIM = '#0F4C5C';

export default function PassportHero({
  dog,
  dogProfiles,
  selectedDogId,
  onSelectDog,
  score,
  infoCards,
  onEditProfile,
  onPhotoSelected,
  onPhotoRemove,
  photoUploading = false,
}: Props) {
  const { t } = useTranslation('healthPassport');
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoMenuAnchor, setPhotoMenuAnchor] = useState<HTMLElement | null>(null);
  const hasCustomPhoto = Boolean(dog.photoUrl);

  // Photo source: user's own photo → species stock photo → local SVG (offline fallback).
  const fallbackSvg = petPhotoSvg(dog.animalType);
  const [imgSrc, setImgSrc] = useState(dog.photoUrl || petPhotoStock(dog.animalType));
  useEffect(() => {
    setImgSrc(dog.photoUrl || petPhotoStock(dog.animalType));
  }, [dog.photoUrl, dog.animalType]);
  const handleImgError = () => {
    if (imgSrc !== fallbackSvg) setImgSrc(fallbackSvg);
  };
  const isUserPhoto = imgSrc === dog.photoUrl;

  const computeAgeLabel = (p: PetProfile): string | null => {
    if (p.dateOfBirth) {
      const dob = new Date(p.dateOfBirth);
      if (!Number.isNaN(dob.getTime())) {
        const now = new Date();
        let years = now.getFullYear() - dob.getFullYear();
        let months = now.getMonth() - dob.getMonth();
        if (now.getDate() < dob.getDate()) months -= 1;
        if (months < 0) {
          years -= 1;
          months += 12;
        }
        if (years <= 0 && months <= 0) return t('hero.ageUnderMonth');
        if (years <= 0) return t('hero.ageMonths', { count: months });
        if (months === 0) return t('hero.ageYears', { count: years });
        return t('hero.ageYearsMonths', { years, months });
      }
    }
    if (typeof p.ageYears === 'number' && p.ageYears > 0) {
      return t('hero.ageYears', { count: p.ageYears });
    }
    return null;
  };

  const ageLabel = computeAgeLabel(dog);
  const sex =
    dog.sex === 'MALE' ? t('hero.sexMale') : dog.sex === 'FEMALE' ? t('hero.sexFemale') : null;
  const subParts = [dog.breed, ageLabel, sex].filter(Boolean) as string[];

  return (
    <Box
      sx={{
        mb: 2.5,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        // Bottom corners stay square so the wavy SVG edge melts flat into the
        // page canvas — rounded bottom corners would clip the wave and expose
        // a sliver of the teal scrim in each corner.
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        bgcolor: HERO_SCRIM,
      }}
    >
      {isUserPhoto ? (
        // A user photo can be any orientation, and the hero shape swings from tall
        // (mobile) to wide (desktop). Showing it with object-fit: cover would zoom
        // in hard on the mismatched axis, so instead the whole photo is shown with
        // object-fit: contain over a blurred, scaled copy that fills the frame.
        <>
          <Box
            component="img"
            src={imgSrc}
            onError={handleImgError}
            alt=""
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.2)',
              filter: 'blur(28px)',
            }}
          />
          <Box
            component="img"
            src={imgSrc}
            onError={handleImgError}
            alt={dog.name}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
            }}
          />
        </>
      ) : (
        <Box
          component="img"
          src={imgSrc}
          onError={handleImgError}
          alt={dog.name}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '60% 35%',
          }}
        />
      )}

      {/* Legibility scrims */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(118deg, ${alpha(HERO_SCRIM, 0.62)} 0%, ${alpha(HERO_SCRIM, 0.3)} 34%, ${alpha(HERO_SCRIM, 0.04)} 56%, ${alpha(HERO_SCRIM, 0)} 72%)`,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(0deg, ${alpha(HERO_SCRIM, 0.28)} 0%, ${alpha(HERO_SCRIM, 0)} 30%)`,
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', p: { xs: 2.5, md: 3.5 }, pb: { xs: 6, md: 8 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems="stretch"
          gap={3}
          sx={{ minHeight: { md: 400 } }}
        >
          {/* Left column */}
          <Stack justifyContent="space-between" spacing={4} sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ color: 'common.white' }}>
              <Stack
                direction="row"
                alignItems="center"
                gap={1}
                sx={{ fontWeight: 500, opacity: 0.92, textShadow: '0 1px 8px rgba(0,0,0,0.25)' }}
              >
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 500 }}>
                  {t('hero.greeting')}
                </Typography>
                <FavoriteIcon sx={{ fontSize: 18 }} />
              </Stack>

              <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: { xs: '2.75rem', md: '3.5rem' },
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    textShadow: '0 2px 14px rgba(0,0,0,0.30)',
                  }}
                >
                  {dog.name}
                </Typography>
                <IconButton
                  onClick={onEditProfile}
                  aria-label={t('hero.editProfileAria')}
                  sx={{
                    color: alpha(theme.palette.common.white, 0.85),
                    '&:hover': { color: 'common.white' },
                  }}
                >
                  <EditIcon />
                </IconButton>
                {onPhotoSelected && (
                  <>
                    <IconButton
                      onClick={(e) => setPhotoMenuAnchor(e.currentTarget)}
                      disabled={photoUploading}
                      aria-label={t('hero.photoMenuAria')}
                      sx={{
                        color: alpha(theme.palette.common.white, 0.85),
                        '&:hover': { color: 'common.white' },
                      }}
                    >
                      {photoUploading ? (
                        <CircularProgress size={20} sx={{ color: 'common.white' }} />
                      ) : (
                        <PhotoCameraIcon />
                      )}
                    </IconButton>
                    <Menu
                      anchorEl={photoMenuAnchor}
                      open={Boolean(photoMenuAnchor)}
                      onClose={() => setPhotoMenuAnchor(null)}
                    >
                      <MenuItem
                        onClick={() => {
                          setPhotoMenuAnchor(null);
                          fileInputRef.current?.click();
                        }}
                      >
                        <ListItemIcon>
                          <PhotoLibraryIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>{t('hero.photoMenuUpload')}</ListItemText>
                      </MenuItem>
                      {hasCustomPhoto && onPhotoRemove && (
                        <MenuItem
                          onClick={() => {
                            setPhotoMenuAnchor(null);
                            onPhotoRemove();
                          }}
                        >
                          <ListItemIcon>
                            <DeleteIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>{t('hero.photoMenuRemove')}</ListItemText>
                        </MenuItem>
                      )}
                    </Menu>
                    <Box
                      component="input"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      sx={{ display: 'none' }}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) onPhotoSelected(file);
                        e.target.value = '';
                      }}
                    />
                  </>
                )}
                {dogProfiles.length > 1 && (
                  <FormControl size="small">
                    <Select
                      value={selectedDogId}
                      onChange={(e) => onSelectDog(e.target.value)}
                      variant="standard"
                      disableUnderline
                      renderValue={() => t('hero.switchPet')}
                      sx={{
                        fontSize: '0.85rem',
                        color: alpha(theme.palette.common.white, 0.85),
                        '& .MuiSelect-select': { py: 0.5, pr: 3 },
                        '& .MuiSelect-icon': { color: alpha(theme.palette.common.white, 0.85) },
                      }}
                    >
                      {dogProfiles.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Stack>

              {subParts.length > 0 && (
                <Typography
                  sx={{
                    mt: 1.5,
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: alpha(theme.palette.common.white, 0.92),
                    textShadow: '0 1px 8px rgba(0,0,0,0.30)',
                  }}
                >
                  {subParts.join('  •  ')}
                </Typography>
              )}
            </Box>

            <Box sx={{ alignSelf: { xs: 'center', md: 'flex-start' } }}>
              <HealthScoreRing
                score={score}
                size={188}
                variant="hero"
                label={t('score.healthScore')}
              />
            </Box>
          </Stack>

          {/* Right column — info cards */}
          <Stack spacing={1.5} sx={{ width: { xs: '100%', md: 296 }, flexShrink: 0 }}>
            {infoCards.map((card) => (
              <Stack
                key={card.key}
                direction="row"
                alignItems="center"
                gap={1.5}
                onClick={card.onClick}
                role={card.onClick ? 'button' : undefined}
                tabIndex={card.onClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (card.onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    card.onClick();
                  }
                }}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  px: 1.75,
                  py: 1.5,
                  boxShadow: theme.shadows[6],
                  cursor: card.onClick ? 'pointer' : 'default',
                  transition: 'transform 120ms ease, box-shadow 120ms ease',
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  '&:hover': card.onClick
                    ? { transform: 'translateY(-1px)', boxShadow: theme.shadows[8] }
                    : undefined,
                }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    bgcolor: alpha(card.accent, 0.12),
                    color: card.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    '& svg': { fontSize: 22 },
                  }}
                >
                  {card.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', textTransform: 'none', letterSpacing: 0 }}
                    noWrap
                  >
                    {card.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 700 }} noWrap>
                    {card.value}
                  </Typography>
                </Box>
                {card.onClick && <ChevronIcon sx={{ color: 'text.disabled', fontSize: 22 }} />}
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* Wavy bottom edge melting into the page canvas */}
      <Box
        component="svg"
        viewBox="0 0 1024 70"
        preserveAspectRatio="none"
        sx={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          width: '100%',
          height: 62,
          display: 'block',
        }}
      >
        <path
          d="M0,34 C85,11 171,11 256,34 C341,57 427,57 512,34 C597,11 683,11 768,34 C853,57 939,57 1024,34 L1024,70 L0,70 Z"
          fill={theme.palette.background.default}
        />
      </Box>
    </Box>
  );
}
