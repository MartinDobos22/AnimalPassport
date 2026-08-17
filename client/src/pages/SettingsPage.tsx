import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  MailOutline as MailOutlineIcon,
  CloudDownload as CloudDownloadIcon,
  Logout as LogoutIcon,
  DeleteForever as DeleteForeverIcon,
  VolunteerActivism as VolunteerActivismIcon,
} from '@mui/icons-material';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';
import { useAiConsent } from '../hooks/useAiConsent';
import { deleteAccount, exportUserData } from '../services/accountApi';

const DONATE_URL = import.meta.env.VITE_STRIPE_PAYMENT_LINK ?? '';

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function SettingsPage({ darkMode, onToggleTheme }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    granted: aiConsentGranted,
    grantedAt: aiConsentAt,
    revoke: revokeAiConsent,
  } = useAiConsent();

  const isDark = theme.palette.mode === 'dark';
  const itemSx = {
    position: 'relative' as const,
    borderRadius: 2,
    mb: 0.25,
    py: 1,
    pl: 2.5,
    pr: 1.5,
    color: 'text.secondary',
    '& .MuiListItemIcon-root': {
      minWidth: 36,
      color: 'text.secondary',
    },
    '&:hover': { backgroundColor: 'action.hover' },
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleExportData = async () => {
    try {
      const blob = await exportUserData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pawly-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.alert(t('auth.exportDataFailed'));
    }
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = () => {
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setDeleteError(t('auth.deleteAccountFailed'));
      setDeleteLoading(false);
      setDeleteOpen(false);
      window.alert(t('auth.deleteAccountFailed'));
    }
  };

  const sectionLabelSx = {
    display: 'block',
    px: 1,
    pb: 0.5,
    color: 'text.secondary',
    fontSize: '0.72rem',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  };

  const sectionCardSx = {
    p: 1,
    borderRadius: 3,
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: alpha(theme.palette.background.paper, isDark ? 0.6 : 1),
    mb: 3,
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', py: { xs: 1, md: 2 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        {t('settings.title')}
      </Typography>

      <Typography variant="caption" sx={sectionLabelSx}>
        {t('settings.appearance')}
      </Typography>
      <Box sx={sectionCardSx}>
        <List disablePadding>
          <ListItemButton
            onClick={onToggleTheme}
            sx={itemSx}
            aria-label={darkMode ? t('theme.toggleLight') : t('theme.toggleDark')}
          >
            <ListItemIcon>{darkMode ? <LightModeIcon /> : <DarkModeIcon />}</ListItemIcon>
            <ListItemText
              primary={darkMode ? t('theme.light') : t('theme.dark')}
              primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
            />
          </ListItemButton>
          <LanguageSwitcher sx={itemSx} />
        </List>
      </Box>

      <Typography variant="caption" sx={sectionLabelSx}>
        {t('settings.account')}
      </Typography>
      <Box sx={sectionCardSx}>
        <List disablePadding>
          <ListItemButton
            onClick={() => {
              if (aiConsentGranted) void revokeAiConsent();
            }}
            disabled={!aiConsentGranted}
            sx={itemSx}
            aria-label={t('aiConsent.settingsTitle')}
          >
            <ListItemIcon>
              <AiIcon />
            </ListItemIcon>
            <ListItemText
              primary={t('aiConsent.settingsTitle')}
              secondary={
                aiConsentGranted
                  ? t('aiConsent.settingsGranted', {
                      date: aiConsentAt ? new Date(aiConsentAt).toLocaleDateString() : '',
                    })
                  : t('aiConsent.settingsRevoked')
              }
              primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
              secondaryTypographyProps={{ fontSize: '0.78rem' }}
            />
            {aiConsentGranted && (
              <Typography variant="caption" color="primary" sx={{ flexShrink: 0 }}>
                {t('aiConsent.revoke')}
              </Typography>
            )}
          </ListItemButton>
          <ListItemButton onClick={handleExportData} sx={itemSx} aria-label={t('auth.exportData')}>
            <ListItemIcon>
              <CloudDownloadIcon />
            </ListItemIcon>
            <ListItemText
              primary={t('auth.exportData')}
              primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
            />
          </ListItemButton>
          <ListItemButton onClick={handleLogout} sx={itemSx} aria-label={t('auth.logout')}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary={t('auth.logout')}
              secondary={user?.email ?? undefined}
              primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
              secondaryTypographyProps={{ fontSize: '0.78rem', noWrap: true }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={handleDeleteAccount}
            sx={{
              ...itemSx,
              color: 'error.main',
              '& .MuiListItemIcon-root': { color: 'error.main' },
            }}
            aria-label={t('auth.deleteAccount')}
          >
            <ListItemIcon>
              <DeleteForeverIcon />
            </ListItemIcon>
            <ListItemText
              primary={t('auth.deleteAccount')}
              primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
            />
          </ListItemButton>
        </List>
      </Box>

      <Typography variant="caption" sx={sectionLabelSx}>
        {t('settings.support')}
      </Typography>
      <Box sx={sectionCardSx}>
        <List disablePadding>
          <ListItemButton
            component="a"
            href={`mailto:${t('supportEmail')}`}
            sx={itemSx}
            aria-label={t('nav.support')}
          >
            <ListItemIcon>
              <MailOutlineIcon />
            </ListItemIcon>
            <ListItemText
              primary={t('nav.support')}
              secondary={t('supportEmail')}
              primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
              secondaryTypographyProps={{ fontSize: '0.78rem', noWrap: true }}
            />
          </ListItemButton>
          {DONATE_URL && (
            <ListItemButton
              component="a"
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              sx={itemSx}
              aria-label={t('nav.donate')}
            >
              <ListItemIcon>
                <VolunteerActivismIcon />
              </ListItemIcon>
              <ListItemText
                primary={t('nav.donate')}
                primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
              />
            </ListItemButton>
          )}
        </List>
      </Box>

      <ConfirmDialog
        open={deleteOpen}
        title={t('auth.confirmDeleteTitle')}
        message={t('auth.confirmDeleteMessage')}
        confirmLabel={t('auth.deleteAccount')}
        danger
        loading={deleteLoading}
        requireText={user?.email ?? undefined}
        requireTextHelper={
          user?.email ? t('actions.typeToConfirm', { value: user.email }) : undefined
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
      {deleteError && null}
    </Box>
  );
}
