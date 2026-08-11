import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, IconButton, Toolbar } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { PetProfilesProvider } from '../contexts/PetProfilesContext';
import { ActivePetProvider } from '../contexts/ActivePetContext';
import { HealthDataProvider } from '../contexts/HealthDataContext';
import Layout from '../components/Layout';
import PawlyLogo from '../components/PawlyLogo';
import TermsPage from './TermsPage';
import Seo from '../components/Seo';

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const seo = {
  title: 'Podmienky používania — Pawly',
  description:
    'Pravidlá používania aplikácie Pawly, limity AI funkcií a podmienky obmedzenia či zrušenia účtu.',
  path: '/podmienky',
};

export default function TermsRoute({ darkMode, onToggleTheme }: Props) {
  const { user, loading } = useAuth();
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  if (loading) return null;

  const seoEl = <Seo {...seo} />;

  if (user) {
    return (
      <>
        {seoEl}
        <PetProfilesProvider>
          <ActivePetProvider>
            <HealthDataProvider>
              <Layout darkMode={darkMode} onToggleTheme={onToggleTheme}>
                <TermsPage />
              </Layout>
            </HealthDataProvider>
          </ActivePetProvider>
        </PetProfilesProvider>
      </>
    );
  }

  return (
    <>
      {seoEl}
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
        <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 1.5 }}>
          <IconButton
            onClick={() => navigate(-1)}
            aria-label={t('resetPassword.backToLogin')}
            edge="start"
          >
            <ArrowBackIcon />
          </IconButton>
          <PawlyLogo size="sm" />
        </Toolbar>
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
          <TermsPage />
        </Container>
      </Box>
    </>
  );
}
