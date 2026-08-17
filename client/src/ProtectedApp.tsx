import { Suspense } from 'react';
import { lazyWithRetry as lazy } from './utils/lazyWithRetry';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sk, enUS } from 'date-fns/locale';
import { PetProfilesProvider } from './contexts/PetProfilesContext';
import { AiConsentProvider } from './contexts/AiConsentContext';
import { ActivePetProvider } from './contexts/ActivePetContext';
import { HealthDataProvider } from './contexts/HealthDataContext';
import Layout from './components/Layout';
import AdminGuard from './components/admin/AdminGuard';

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const AdminArticlesPage = lazy(() => import('./pages/admin/AdminArticlesPage'));
const AdminArticleEditPage = lazy(() => import('./pages/admin/AdminArticleEditPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const CheckInPage = lazy(() => import('./pages/CheckInPage'));
const FoodPage = lazy(() => import('./pages/FoodPage'));
const AnalyzePage = lazy(() => import('./pages/AnalyzePage'));
const PetProfilePage = lazy(() => import('./pages/PetProfilePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SupportProjectPage = lazy(() => import('./pages/SupportProjectPage'));
const HealthPassportPage = lazy(() => import('./pages/HealthPassportPage'));
const VetCardPage = lazy(() => import('./pages/VetCardPage'));
const EpisodeDiaryPage = lazy(() => import('./pages/EpisodeDiaryPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const DonateThanksPage = lazy(() => import('./pages/DonateThanksPage'));

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
  language: string;
}

const fallback = (
  <Box
    sx={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CircularProgress />
  </Box>
);

export default function ProtectedApp({ darkMode, onToggleTheme, language }: Props) {
  const dateLocale = language === 'en' ? enUS : sk;
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
      <AiConsentProvider>
        <PetProfilesProvider>
          <ActivePetProvider>
            <HealthDataProvider>
              <Layout darkMode={darkMode} onToggleTheme={onToggleTheme}>
                <Suspense fallback={fallback}>
                  <Routes>
                    <Route path="/prehlad" element={<OverviewPage />} />
                    <Route path="/check-in" element={<CheckInPage />} />
                    <Route path="/krmivo" element={<FoodPage />} />
                    <Route path="/analyza" element={<AnalyzePage />} />
                    <Route path="/profily" element={<PetProfilePage />} />
                    <Route path="/historia" element={<HistoryPage />} />
                    <Route path="/zdravotny-pas" element={<HealthPassportPage />} />
                    <Route path="/zdravotny-pas/prehlad" element={<HealthPassportPage />} />
                    <Route path="/zdravotny-pas/zaznamy" element={<HealthPassportPage />} />
                    <Route path="/zdravotny-pas/novy-zaznam" element={<HealthPassportPage />} />
                    <Route path="/karta-pre-veterinara" element={<VetCardPage />} />
                    <Route path="/dennik" element={<EpisodeDiaryPage />} />
                    <Route path="/notifikacie" element={<NotificationsPage />} />
                    <Route path="/info" element={<InfoPage />} />
                    <Route path="/kontakt" element={<ContactPage />} />
                    <Route
                      path="/admin/clanky"
                      element={
                        <AdminGuard>
                          <AdminArticlesPage />
                        </AdminGuard>
                      }
                    />
                    <Route
                      path="/admin/clanky/novy"
                      element={
                        <AdminGuard>
                          <AdminArticleEditPage />
                        </AdminGuard>
                      }
                    />
                    <Route
                      path="/admin/clanky/:slug"
                      element={
                        <AdminGuard>
                          <AdminArticleEditPage />
                        </AdminGuard>
                      }
                    />
                    <Route
                      path="/admin/pouzivatelia"
                      element={
                        <AdminGuard>
                          <AdminUsersPage />
                        </AdminGuard>
                      }
                    />
                    <Route
                      path="/admin/recenzie"
                      element={
                        <AdminGuard>
                          <AdminReviewsPage />
                        </AdminGuard>
                      }
                    />
                    <Route path="/podpora" element={<SupportProjectPage />} />
                    <Route path="/dakujeme" element={<DonateThanksPage />} />
                    <Route
                      path="/nastavenia"
                      element={<SettingsPage darkMode={darkMode} onToggleTheme={onToggleTheme} />}
                    />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </Layout>
            </HealthDataProvider>
          </ActivePetProvider>
        </PetProfilesProvider>
      </AiConsentProvider>
    </LocalizationProvider>
  );
}
