import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Science as ScienceIcon,
  History as HistoryIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Pets as PetsIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Analýza', icon: <ScienceIcon />, path: '/' },
  { label: 'Profily', icon: <PetsIcon />, path: '/profily' },
  { label: 'História', icon: <HistoryIcon />, path: '/historia' },
  { label: 'Zdravotný pas', icon: <HealthAndSafetyIcon />, path: '/zdravotny-pas' },
  { label: 'Karta veterinára', icon: <DescriptionIcon />, path: '/karta-pre-veterinara' },
  { label: 'O aplikácii', icon: <InfoIcon />, path: '/o-aplikacii' },
];

interface LayoutProps {
  children: ReactNode;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function Layout({ children, darkMode, onToggleTheme }: LayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentNavIndex = NAV_ITEMS.findIndex((item) => item.path === '/zdravotny-pas'
    ? location.pathname.startsWith('/zdravotny-pas')
    : item.path === location.pathname);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          gap: 1.5,
          px: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <PetsIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
          GranuleCheck
        </Typography>
      </Toolbar>
      <List sx={{ px: 1, pt: 1, flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.path}
            selected={item.path === '/zdravotny-pas' ? location.pathname.startsWith('/zdravotny-pas') : location.pathname === item.path}
            onClick={() => handleNav(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main + '14',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '20',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: (item.path === '/zdravotny-pas' ? location.pathname.startsWith('/zdravotny-pas') : location.pathname === item.path) ? 'primary.main' : undefined }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: (item.path === '/zdravotny-pas' ? location.pathname.startsWith('/zdravotny-pas') : location.pathname === item.path) ? 600 : 400,
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop permanent drawer */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            display: { print: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
              displayPrint: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile temporary drawer */}
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
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: { print: 'none' },
          }}
        >
          <Toolbar>
            {!isDesktop && (
              <IconButton edge="start" onClick={() => setMobileDrawerOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            {!isDesktop && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PetsIcon color="primary" sx={{ fontSize: 24 }} />
                <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
                  GranuleCheck
                </Typography>
              </Box>
            )}
            <Box sx={{ flex: 1 }} />
            <IconButton onClick={onToggleTheme} color="inherit">
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            pb: { xs: 10, md: 3 },
            maxWidth: 900,
            mx: 'auto',
            width: '100%',
            '@media print': {
              maxWidth: '100%',
              p: 0,
              pb: 0,
            },
          }}
        >
          {children}
        </Box>

        {/* Mobile bottom navigation */}
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
              value={currentNavIndex >= 0 ? currentNavIndex : 0}
              onChange={(_e, newValue: number) => handleNav(NAV_ITEMS[newValue].path)}
              sx={{
                backgroundColor: theme.palette.background.paper,
                '& .Mui-selected': {
                  color: `${theme.palette.primary.main} !important`,
                },
              }}
            >
              {NAV_ITEMS.map((item) => (
                <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} />
              ))}
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
