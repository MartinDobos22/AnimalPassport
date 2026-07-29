import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Card, CardContent, Tab, Tabs } from '@mui/material';
import {
  HelpOutline as HelpOutlineIcon,
  Info as InfoIcon,
  InstallMobile as InstallMobileIcon,
  Lock as LockIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';
import FaqContent from '../components/FaqContent';
import AboutContent from '../components/AboutContent';
import InstallGuideContent from '../components/InstallGuideContent';
import PrivacyPolicyContent from '../components/PrivacyPolicyContent';
import ReviewForm from '../components/reviews/ReviewForm';

type TabKey = 'faq' | 'install' | 'about' | 'privacy' | 'review';

const TAB_KEYS: TabKey[] = ['faq', 'install', 'about', 'privacy', 'review'];

const isTabKey = (value: string | null): value is TabKey =>
  value !== null && (TAB_KEYS as string[]).includes(value);

export default function InfoPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = isTabKey(rawTab) ? rawTab : 'faq';

  const handleChange = useCallback(
    (_e: React.SyntheticEvent, value: TabKey) => {
      setSearchParams({ tab: value }, { replace: false });
    },
    [setSearchParams]
  );

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant="fullWidth"
        sx={{
          mb: 3,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Tab
          value="faq"
          icon={<HelpOutlineIcon />}
          iconPosition="start"
          label={t('nav.faq')}
          sx={{ minHeight: 56, fontWeight: 600 }}
        />
        <Tab
          value="install"
          icon={<InstallMobileIcon />}
          iconPosition="start"
          label={t('nav.install')}
          sx={{ minHeight: 56, fontWeight: 600 }}
        />
        <Tab
          value="about"
          icon={<InfoIcon />}
          iconPosition="start"
          label={t('nav.about')}
          sx={{ minHeight: 56, fontWeight: 600 }}
        />
        <Tab
          value="privacy"
          icon={<LockIcon />}
          iconPosition="start"
          label={t('nav.privacy')}
          sx={{ minHeight: 56, fontWeight: 600 }}
        />
        <Tab
          value="review"
          icon={<RateReviewIcon />}
          iconPosition="start"
          label={t('review.tabLabel')}
          sx={{ minHeight: 56, fontWeight: 600 }}
        />
      </Tabs>

      {activeTab === 'faq' && <FaqContent />}
      {activeTab === 'install' && <InstallGuideContent />}
      {activeTab === 'about' && <AboutContent />}
      {activeTab === 'privacy' && <PrivacyPolicyContent />}
      {activeTab === 'review' && (
        <Card>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <ReviewForm />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
