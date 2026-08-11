import { Box } from '@mui/material';
import TermsContent from '../components/TermsContent';

export default function TermsPage() {
  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <TermsContent />
    </Box>
  );
}
