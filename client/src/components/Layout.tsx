import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Science as ScienceIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  MoreHoriz as MoreHorizIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Pets as PetsIcon,
  MenuBook as MenuBookIcon,
  NotificationsActive as NotificationsActiveIcon,
  FactCheck as FactCheckIcon,
  Restaurant as RestaurantIcon,
  Settings as SettingsIcon,
  MailOutline as MailOutlineIcon,
  VolunteerActivism as VolunteerActivismIcon,
  Article as ArticleIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';

const IS_STRIPE_ENABLED = Boolean(import.meta.env.VITE_STRIPE_PAYMENT_LINK);
import { useIsAdmin } from '../hooks/useIsAdmin';
import PetSwitcher from './PetSwitcher';
import PawlyLogo from './PawlyLogo';
import InstallAppBanner from './InstallAppBanner';
import HelpFab from './HelpFab';
import ReviewPrompt from './reviews/ReviewPrompt';

const DRAWER_WIDTH = 272;

type NavItem = { label: string; shortLabel?: string; icon: ReactNode; path: string };
type NavSection = { id: string; label: string; items: NavItem[] };

interface LayoutProps {
  children: ReactNode;
  darkMode: boolean;
  onToggleTheme: () => void;
}

const isItemActive = (itemPath: string, currentPath: string) => {
  if (itemPath === '/zdravotny-pas') return currentPath.startsWith('/zdravotny-pas');
  if (itemPath === '/info') return currentPath.startsWith('/info');
  return currentPath === itemPath;
};

export default function Layout({ children, darkMode, onToggleTheme }: LayoutProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useIsAdmin();

  const NAV_SECTIONS: NavSection[] = [
    {
      id: 'health',
      label: t('nav.sectionMain'),
      items: [
        {
          label: t('nav.overview'),
          shortLabel: t('nav.overviewShort'),
          icon: <DashboardIcon />,
          path: '/prehlad',
        },
        {
          label: t('nav.healthPassport'),
          shortLabel: t('nav.healthPassportShort'),
          icon: <HealthAndSafetyIcon />,
          path: '/zdravotny-pas',
        },
        {
          label: t('nav.vetCard'),
          shortLabel: t('nav.vetCardShort'),
          icon: <DescriptionIcon />,
          path: '/karta-pre-veterinara',
        },
        { label: t('nav.diary'), icon: <MenuBookIcon />, path: '/dennik' },
      ],
    },
    {
      id: 'tools',
      label: t('nav.sectionOther'),
      items: [
        { label: t('checkIn.nav'), icon: <FactCheckIcon />, path: '/check-in' },
        { label: t('nav.food'), icon: <RestaurantIcon />, path: '/krmivo' },
        { label: t('nav.analyze'), icon: <ScienceIcon />, path: '/analyza' },
        { label: t('nav.history'), icon: <HistoryIcon />, path: '/historia' },
      ],
    },
    {
      id: 'settings',
      label: t('nav.sectionSettings'),
      items: [
        { label: t('nav.profiles'), icon: <PetsIcon />, path: '/profily' },
        { label: t('nav.notifications'), icon: <NotificationsActiveIcon />, path: '/notifikacie' },
        { label: t('nav.info'), icon: <InfoIcon />, path: '/info' },
        { label: t('nav.contact'), icon: <MailOutlineIcon />, path: '/kontakt' },
        ...(IS_STRIPE_ENABLED
          ? [{ label: t('nav.donate'), icon: <VolunteerActivismIcon />, path: '/podpora' }]
          : []),
        ...(isAdmin
          ? [
              { label: t('nav.adminArticles'), icon: <ArticleIcon />, path: '/admin/clanky' },
              { label: t('nav.adminReviews'), icon: <RateReviewIcon />, path: '/admin/recenzie' },
            ]
          : []),
      ],
    },
  ];

  const FLAT_NAV: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
  const MOBILE_NAV: NavItem[] = FLAT_NAV.slice(0, 4);

  const currentMobileIndex = MOBILE_NAV.findIndex((item) =>
    isItemActive(item.path, location.pathname)
  );

  const handleNav = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  const accentBar = (active: boolean) => ({
    content: '""',
    position: 'absolute' as const,
    left: 6,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    bgcolor: active ? 'primary.main' : 'transparent',
    transition: 'background-color 120ms ease',
  });

  const isDark = theme.palette.mode === 'dark';
  const activeAlpha = isDark ? 0.18 : 0.08;
  const activeHoverAlpha = isDark ? 0.24 : 0.12;
  const activeTextColor = isDark ? 'primary.light' : 'text.primary';

  const navItemSx = (active: boolean) =>
    ({
      position: 'relative',
      borderRadius: 2,
      mb: 0.25,
      py: 0.9,
      pl: 2.5,
      pr: 1.5,
      color: active ? activeTextColor : 'text.secondary',
      '& .MuiListItemIcon-root': {
        minWidth: 44,
        color: active ? (isDark ? 'primary.light' : 'primary.main') : 'text.secondary',
      },
      '& .MuiListItemIcon-root svg': {
        fontSize: 30,
      },
      '&::before': accentBar(active),
      '&.Mui-selected': {
        backgroundColor: alpha(theme.palette.primary.main, activeAlpha),
        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, activeHoverAlpha) },
      },
      '&:hover': { backgroundColor: 'action.hover' },
    }) as const;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, pt: 2.5, pb: 1.25 }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={1.25}
          role="button"
          tabIndex={0}
          aria-label={t('nav.home')}
          onClick={() => handleNav('/')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNav('/prehlad');
            }
          }}
          sx={{
            pl: 0.5,
            pb: 1.5,
            cursor: 'pointer',
            borderRadius: 2,
            transition: 'opacity 120ms ease',
            '&:hover': { opacity: 0.85 },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          }}
        >
          <PawlyLogo size="md" glow />
        </Stack>
        <PetSwitcher />
      </Box>

      <Box
        sx={{
          px: 1.25,
          pt: 1,
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.palette.divider} transparent`,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.divider,
            borderRadius: 2,
          },
        }}
      >
        {NAV_SECTIONS.map((section) => (
          <Box key={section.id} sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                px: 2,
                pb: 0.5,
                color: 'text.secondary',
                fontSize: '0.68rem',
              }}
            >
              {section.label}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const active = isItemActive(item.path, location.pathname);
                return (
                  <ListItemButton
                    key={item.path}
                    selected={active}
                    onClick={() => handleNav(item.path)}
                    sx={navItemSx(active)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '1.05rem',
                        fontWeight: active ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Box sx={{ px: 1.25, pb: 1.5, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
        {(() => {
          const settingsActive = location.pathname === '/nastavenia';
          return (
            <ListItemButton
              selected={settingsActive}
              onClick={() => handleNav('/nastavenia')}
              sx={navItemSx(settingsActive)}
              aria-label={t('nav.settings')}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary={t('nav.settings')}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: settingsActive ? 600 : 500,
                }}
              />
            </ListItemButton>
          );
        })()}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        '@media print': {
          display: 'block',
          minHeight: 'auto',
        },
      }}
    >
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: 8,
          top: -40,
          zIndex: theme.zIndex.modal,
          px: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: 600,
          transition: 'top 120ms ease',
          '&:focus': { top: 8 },
        }}
      >
        {t('skipToContent')}
      </Box>
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            display: { print: 'none' },
            '@media print': {
              display: 'none !important',
            },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.default',
              displayPrint: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.default',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        {!isDesktop && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              backgroundColor: 'background.paper',
              color: 'text.primary',
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: { print: 'none' },
            }}
          >
            <Toolbar sx={{ gap: 1 }}>
              <IconButton
                edge="start"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label={t('openMenu')}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <PetSwitcher variant="compact" />
              </Box>
              <IconButton
                onClick={onToggleTheme}
                color="inherit"
                aria-label={darkMode ? t('theme.toggleLight') : t('theme.toggleDark')}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        <Box
          component="main"
          id="main-content"
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            pb: { xs: 10, md: 3 },
            width: '100%',
            '@media print': {
              p: 0,
              pb: 0,
              minWidth: '100%',
            },
          }}
        >
          <InstallAppBanner />
          {children}
        </Box>
        <HelpFab />
        <ReviewPrompt enabled />

        {!isDesktop && (
          <Paper
            elevation={8}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: theme.zIndex.appBar,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: { print: 'none' },
            }}
          >
            <BottomNavigation
              showLabels
              value={currentMobileIndex >= 0 ? currentMobileIndex : false}
              onChange={(_e, newValue: number) => {
                if (newValue === MOBILE_NAV.length) {
                  setMobileDrawerOpen(true);
                } else {
                  handleNav(MOBILE_NAV[newValue].path);
                }
              }}
              sx={{
                backgroundColor: 'background.paper',
                '& .Mui-selected': {
                  color: `${theme.palette.primary.main} !important`,
                },
                '& .MuiBottomNavigationAction-root': { minWidth: 0, px: 0.5 },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.68rem',
                  whiteSpace: 'nowrap',
                  '&.Mui-selected': { fontSize: '0.68rem' },
                },
                '& .MuiBottomNavigationAction-root svg': { fontSize: 24 },
              }}
            >
              {MOBILE_NAV.map((item) => (
                <BottomNavigationAction
                  key={item.path}
                  label={item.shortLabel ?? item.label}
                  icon={item.icon}
                />
              ))}
              <BottomNavigationAction label={t('nav.more')} icon={<MoreHorizIcon />} />
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
