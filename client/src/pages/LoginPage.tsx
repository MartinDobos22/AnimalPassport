import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/auth/AuthLayout';
import GoogleIcon from '../components/auth/GoogleIcon';
import PasswordField from '../components/auth/PasswordField';
import { isInAppBrowser } from '../utils/isInAppBrowser';
import { consumeInactivityLogout } from '../utils/inactivityNotice';

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
}

interface LocationState {
  from?: string;
}

export default function LoginPage({ darkMode, onToggleTheme }: Props) {
  const { user, login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');
  const redirectTo = (location.state as LocationState | null)?.from ?? '/prehlad';

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inAppBrowser = isInAppBrowser();

  useEffect(() => {
    if (consumeInactivityLogout()) setInfo(t('inactivity.loggedOut'));
  }, [t]);

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.loginFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setInfo(null);
    if (inAppBrowser) {
      setInfo(t('login.inAppBrowserInfo'));
    }
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.loginFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError(t('login.enterEmailForReset'));
      return;
    }
    try {
      await resetPassword(email);
      setInfo(t('login.passwordResetSent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.passwordResetFailed'));
    }
  };

  const handleOpenInBrowser = () => {
    const url = window.location.href;
    const encodedUrl = encodeURIComponent(url);
    if (/Android/i.test(navigator.userAgent)) {
      window.location.href = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodedUrl};end`;
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AuthLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      darkMode={darkMode}
      onToggleTheme={onToggleTheme}
    >
      <Box component="form" onSubmit={handleEmailLogin}>
        <Stack gap={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="success">{info}</Alert>}

          <TextField
            label={t('login.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            fullWidth
          />
          <PasswordField
            label={t('login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            fullWidth
          />

          <Box sx={{ textAlign: 'right' }}>
            <Link component="button" type="button" variant="body2" onClick={handleResetPassword}>
              {t('login.forgotPassword')}
            </Link>
          </Box>

          <Button type="submit" variant="contained" size="large" disabled={submitting} fullWidth>
            {t('login.submit')}
          </Button>

          <Divider sx={{ my: 0.5 }}>{t('login.or')}</Divider>

          {inAppBrowser && (
            <Stack gap={1}>
              <Alert severity="warning">{t('login.inAppBrowserWarning')}</Alert>
              <Button variant="text" size="small" onClick={handleOpenInBrowser}>
                {t('login.openInBrowser')}
              </Button>
            </Stack>
          )}

          <Button
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={submitting || inAppBrowser}
            fullWidth
          >
            {t('login.googleLogin')}
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('login.noAccount')}{' '}
            <Link component={RouterLink} to="/register">
              {t('login.register')}
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
