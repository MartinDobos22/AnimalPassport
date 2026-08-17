import { useState } from 'react';
import { Link, Stack, Typography } from '@mui/material';
import { AutoAwesome as AiIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import AiConsentDialog from './AiConsentDialog';

/**
 * Jednoriadková náhrada za bloky výstražných alertov v AI tokoch. Detail
 * (presnosť, súkromie, odvolanie súhlasu) je za odkazom, nie na obrazovke —
 * používateľ ho vidí, keď ho chce vidieť.
 */
export default function AiProcessingNote() {
  const { t } = useTranslation('common');
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
        <AiIcon fontSize="small" color="action" />
        <Typography variant="caption" color="text.secondary">
          {t('aiConsent.inlineNote')}
        </Typography>
        <Link
          component="button"
          type="button"
          variant="caption"
          underline="hover"
          onClick={() => setInfoOpen(true)}
        >
          {t('aiConsent.inlineLink')}
        </Link>
      </Stack>
      <AiConsentDialog open={infoOpen} mode="info" onClose={() => setInfoOpen(false)} />
    </>
  );
}
