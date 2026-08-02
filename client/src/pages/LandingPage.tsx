import { useState } from 'react';
import {
  alpha,
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  useTheme,
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ArrowForward as ArrowIcon,
  Menu as MenuIcon,
  Language as LanguageIcon,
  MenuBook as MenuBookIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import LanguageSwitcher from '../components/LanguageSwitcher';
import PublicHeaderNav from '../components/public/PublicHeaderNav';
import PawTrail from '../components/landing/PawTrail';
import LandingHero from '../components/landing/LandingHero';
import HowItWorks from '../components/landing/HowItWorks';
import ProductAnalysisDemo from '../components/landing/ProductAnalysisDemo';
import InteractiveAiDemo from '../components/landing/InteractiveAiDemo';
import PassportScanDemo from '../components/landing/PassportScanDemo';
import VetCardDemo from '../components/landing/VetCardDemo';
import StatsBand from '../components/landing/StatsBand';
import FeatureGrid from '../components/landing/FeatureGrid';
import ComparisonSection from '../components/landing/ComparisonSection';
import HealthRemindersDemo from '../components/landing/HealthRemindersDemo';
import PetSpeciesShowcase from '../components/landing/PetSpeciesShowcase';
import RevealOnScroll from '../components/landing/RevealOnScroll';
import AppPreview from '../components/landing/AppPreview';
import Testimonials from '../components/landing/Testimonials';
import FinalCta from '../components/landing/FinalCta';
import LandingFooter from '../components/landing/LandingFooter';
import PawlyLogo from '../components/PawlyLogo';
import Seo from '../components/Seo';
import { track } from '../utils/analytics';

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const seo = {
  title: 'Pawly — Zdravotný pas pre tvojho miláčika',
  description:
    'Pawly – digitálny zdravotný pas pre tvojho miláčika. AI analýza krmiva, vakcinačný preukaz, denník epizód a karta pre veterinára. Zadarmo.',
  path: '/',
};

export default function LandingPage({ darkMode, onToggleTheme }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation('common');
  const { t: tLanding } = useTranslation('landing');

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const closeMenu = () => setMenuAnchor(null);
  const nextLanguage = i18n.language === 'sk' ? 'en' : 'sk';
  const nextLanguageLabel = i18n.language === 'sk' ? t('language.en') : t('language.sk');

  return (
    <>
      <Seo {...seo} />
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          bgcolor: 'background.default',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `
            radial-gradient(900px circle at 85% 5%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.18)}, transparent 55%),
            radial-gradient(700px circle at 8% 28%, ${alpha(theme.palette.secondary.main, theme.palette.mode === 'light' ? 0.08 : 0.14)}, transparent 50%),
            radial-gradient(800px circle at 95% 55%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.07 : 0.12)}, transparent 50%),
            radial-gradient(600px circle at 5% 75%, ${alpha(theme.palette.secondary.main, theme.palette.mode === 'light' ? 0.06 : 0.1)}, transparent 50%),
            radial-gradient(700px circle at 80% 92%, ${alpha(theme.palette.primary.light, theme.palette.mode === 'light' ? 0.05 : 0.1)}, transparent 50%)
          `,
            pointerEvents: 'none',
            zIndex: 0,
          },
          '& > *:not([data-paw-trail])': { position: 'relative', zIndex: 1 },
        }}
      >
        <PawTrail />
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: alpha(theme.palette.background.default, 0.7),
            backdropFilter: 'saturate(180%) blur(14px)',
            WebkitBackdropFilter: 'saturate(180%) blur(14px)',
            color: 'text.primary',
            borderBottom: 'none',
          }}
        >
          <Toolbar
            sx={{
              maxWidth: 1200,
              width: '100%',
              mx: 'auto',
              px: { xs: 2, md: 4 },
              gap: 1,
            }}
          >
            <Stack direction="row" alignItems="center" gap={1.25} sx={{ flex: 1, minWidth: 0 }}>
              <PawlyLogo size="md" glow onClick={() => navigate('/')} />
              <Box sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
                <PublicHeaderNav />
              </Box>
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ display: { xs: 'none', md: 'flex' }, flexShrink: 0 }}
            >
              <LanguageSwitcher variant="compact" />
              <IconButton
                onClick={onToggleTheme}
                color="inherit"
                aria-label={darkMode ? t('theme.toggleLight') : t('theme.toggleDark')}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              {!loading &&
                (user ? (
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={<ArrowIcon />}
                    onClick={() => navigate('/prehlad')}
                    sx={{ minHeight: 40, whiteSpace: 'nowrap' }}
                  >
                    {tLanding('hero.navEnter')}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        track('cta_login', { location: 'header' });
                        navigate('/login');
                      }}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {tLanding('hero.navLogin')}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        track('cta_register', { location: 'header' });
                        navigate('/register');
                      }}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {tLanding('hero.navRegister')}
                    </Button>
                  </>
                ))}
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              gap={0.5}
              sx={{ display: { xs: 'flex', md: 'none' }, flexShrink: 0 }}
            >
              {!loading && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    if (!user) track('cta_register', { location: 'header' });
                    navigate(user ? '/prehlad' : '/register');
                  }}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {user ? tLanding('hero.navEnter') : tLanding('hero.navRegister')}
                </Button>
              )}
              <IconButton
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                color="inherit"
                aria-label={t('openMenu')}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <MenuIcon />
              </IconButton>
            </Stack>

            <Menu
              anchorEl={menuAnchor}
              open={menuOpen}
              onClose={closeMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { minWidth: 200, mt: 0.5 } } }}
            >
              <MenuItem
                onClick={() => {
                  closeMenu();
                  navigate('/poradna');
                }}
              >
                <ListItemIcon>
                  <MenuBookIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{tLanding('hero.navAdvice')}</ListItemText>
              </MenuItem>
              {!user && (
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    track('cta_login', { location: 'header' });
                    navigate('/login');
                  }}
                >
                  <ListItemIcon>
                    <LoginIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{tLanding('hero.navLogin')}</ListItemText>
                </MenuItem>
              )}
              <Divider />
              <MenuItem
                onClick={() => {
                  closeMenu();
                  void i18n.changeLanguage(nextLanguage);
                }}
              >
                <ListItemIcon>
                  <LanguageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{nextLanguageLabel}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeMenu();
                  onToggleTheme();
                }}
              >
                <ListItemIcon>
                  {darkMode ? (
                    <LightModeIcon fontSize="small" />
                  ) : (
                    <DarkModeIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {darkMode ? t('theme.toggleLight') : t('theme.toggleDark')}
                </ListItemText>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <LandingHero />
        <RevealOnScroll>
          <HowItWorks />
        </RevealOnScroll>
        <RevealOnScroll>
          <ProductAnalysisDemo />
        </RevealOnScroll>
        <RevealOnScroll>
          <InteractiveAiDemo />
        </RevealOnScroll>
        <RevealOnScroll>
          <PassportScanDemo />
        </RevealOnScroll>
        <RevealOnScroll>
          <StatsBand />
        </RevealOnScroll>
        <RevealOnScroll>
          <FeatureGrid />
        </RevealOnScroll>
        <RevealOnScroll>
          <ComparisonSection />
        </RevealOnScroll>
        <RevealOnScroll>
          <HealthRemindersDemo />
        </RevealOnScroll>
        <RevealOnScroll>
          <VetCardDemo />
        </RevealOnScroll>
        <RevealOnScroll>
          <AppPreview />
        </RevealOnScroll>
        <RevealOnScroll>
          <PetSpeciesShowcase />
        </RevealOnScroll>
        <RevealOnScroll>
          <Testimonials />
        </RevealOnScroll>
        <RevealOnScroll>
          <FinalCta />
        </RevealOnScroll>
        <LandingFooter />
      </Box>
    </>
  );
}
