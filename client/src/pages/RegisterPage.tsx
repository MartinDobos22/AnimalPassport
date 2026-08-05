import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { isGoogleUser } from '../utils/isGoogleUser';
import { isInAppBrowser } from '../utils/isInAppBrowser';
import { validatePassword } from '../utils/passwordPolicy';
import AuthLayout from '../components/auth/AuthLayout';
import GoogleIcon from '../components/auth/GoogleIcon';
import PasswordField from '../components/auth/PasswordField';

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function RegisterPage({ darkMode, onToggleTheme }: Props) {
  const { user, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const inAppBrowser = isInAppBrowser();

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const showPasswordError = passwordTouched && password.length > 0 && !passwordValidation.ok;

  useEffect(() => {
    if (!user) return;
    if (!user.emailVerified && !isGoogleUser(user)) {
      navigate('/overenie-emailu', { replace: true });
    } else {
      navigate('/prehlad', { replace: true });
    }
  }, [user, navigate]);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!passwordValidation.ok) {
      setPasswordTouched(true);
      setError(t('register.passwordPolicyFailed'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }
    if (!consentAccepted) {
      setError(t('register.consentRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password);
      navigate('/overenie-emailu', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.registrationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    if (!consentAccepted) {
      setError(t('register.consentRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/prehlad', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.registrationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      darkMode={darkMode}
      onToggleTheme={onToggleTheme}
    >
      <Box component="form" onSubmit={handleRegister}>
        <Stack gap={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label={t('register.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            fullWidth
          />
          <PasswordField
            label={t('register.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            autoComplete="new-password"
            required
            fullWidth
            error={showPasswordError}
            helperText={t('register.passwordHint')}
          />
          <Box sx={{ mt: -1 }}>
            <Typography
              variant="caption"
              sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}
            >
              {t('register.passwordRequirements')}
            </Typography>
            <Stack gap={0.25}>
              {passwordValidation.rules.map((rule) => (
                <Stack key={rule.key} direction="row" alignItems="center" gap={0.75}>
                  {rule.ok ? (
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{ color: rule.ok ? 'success.main' : 'text.secondary' }}
                  >
                    {t(`register.rule.${rule.key}`)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
          <PasswordField
            label={t('register.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            fullWidth
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                {t('register.consentLabel')}{' '}
                <Link component={RouterLink} to="/ochrana-sukromia" target="_blank">
                  {t('register.consentLink')}
                </Link>{' '}
                {t('register.consentAnd')}{' '}
                <Link component={RouterLink} to="/podmienky" target="_blank">
                  {t('register.consentTermsLink')}
                </Link>
                .
              </Typography>
            }
            sx={{ alignItems: 'flex-start', mx: 0 }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting || !consentAccepted}
            fullWidth
          >
            {t('register.submit')}
          </Button>

          <Divider sx={{ my: 0.5 }}>{t('register.or')}</Divider>

          {inAppBrowser && <Alert severity="info">{t('register.inAppBrowserWarning')}</Alert>}

          <Button
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleRegister}
            disabled={submitting || inAppBrowser || !consentAccepted}
            fullWidth
          >
            {t('register.googleRegister')}
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('register.hasAccount')}{' '}
            <Link component={RouterLink} to="/login">
              {t('register.login')}
            </Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayout>
  );
}
