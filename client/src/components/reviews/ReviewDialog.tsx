import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { Close as CloseIcon, RateReview as RateReviewIcon } from '@mui/icons-material';
import ReviewForm from './ReviewForm';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReviewDialog({ open, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <RateReviewIcon color="primary" />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {t('review.formTitle')}
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          aria-label={t('help.close')}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <ReviewForm onSubmitted={() => {}} />
      </DialogContent>
    </Dialog>
  );
}
