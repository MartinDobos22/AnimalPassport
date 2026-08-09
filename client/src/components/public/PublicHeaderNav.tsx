import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';

import { PORADNA_PATH } from '../../utils/articleHref';

export default function PublicHeaderNav() {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  return (
    <Button color="inherit" onClick={() => navigate(PORADNA_PATH)} sx={{ whiteSpace: 'nowrap' }}>
      {t('hero.navAdvice')}
    </Button>
  );
}
