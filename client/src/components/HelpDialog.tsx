import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { InstallSection, UsageSection } from './InstallGuideContent';
import PageGuide from './PageGuide';
import { getPageGuideKey } from '../content/pageGuides';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

type TabKey = 'page' | 'usage' | 'install' | 'tour';

export default function HelpDialog({ open, onClose, onStartTour }: HelpDialogProps) {
  const { t } = useTranslation();
  const { t: tGuides } = useTranslation('guides');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { pathname } = useLocation();
  const guideKey = getPageGuideKey(pathname);
  const [tab, setTab] = useState<TabKey>(guideKey ? 'page' : 'usage');

  // Otvorenie dialógu na inej stránke musí ukázať návod k nej, nie naposledy zvolenú záložku.
  useEffect(() => {
    if (open) setTab(guideKey ? 'page' : 'usage');
  }, [open, guideKey]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 3, minHeight: { sm: 480 } } } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('help.dialogTitle')}
        </Typography>
        <IconButton
          aria-label={t('help.close')}
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(1),
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_e, v: TabKey) => setTab(v)}
        variant={guideKey ? 'scrollable' : 'fullWidth'}
        scrollButtons={false}
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        {guideKey && <Tab value="page" label={tGuides('onThisPage')} />}
        <Tab value="usage" label={t('help.tabUsage')} />
        <Tab value="install" label={t('help.tabInstall')} />
        <Tab value="tour" label={t('help.tabTour')} />
      </Tabs>

      <DialogContent sx={{ pt: 2 }}>
        {tab === 'page' && guideKey && (
          <>
            <PageGuide guideKey={guideKey} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.5 }}>
              {tGuides('moreHelp')}
            </Typography>
          </>
        )}
        {tab === 'usage' && <UsageSection />}
        {tab === 'install' && <InstallSection />}
        {tab === 'tour' && (
          <Stack alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {t('help.restartTourTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('help.restartTourDescription')}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => {
                onClose();
                onStartTour();
              }}
              sx={{ fontWeight: 600 }}
            >
              {t('help.restartTourCta')}
            </Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
