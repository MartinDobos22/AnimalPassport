import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  HistoryToggleOff as EmptyIcon,
} from '@mui/icons-material';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ScoreCard from '../components/ScoreCard';
import ProsConsCard from '../components/ProsConsCard';
import RecommendationChip from '../components/RecommendationChip';
import type { SavedAnalysis } from '../types';

export default function HistoryPage() {
  const [savedAnalyses, setSavedAnalyses] = useLocalStorage<SavedAnalysis[]>('granule-check-history', []);
  const [expanded, setExpanded] = useState<string | false>(false);
  const theme = useTheme();

  const handleDelete = (id: string) => {
    setSavedAnalyses((prev) => prev.filter((a) => a.id !== id));
    if (expanded === id) setExpanded(false);
  };

  const handleClearAll = () => {
    setSavedAnalyses([]);
    setExpanded(false);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (savedAnalyses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <EmptyIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Žiadna história
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Zatiaľ ste neuložili žiadne hodnotenia. Analyzujte granule a uložte výsledok.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          História hodnotení
        </Typography>
        <Button size="small" color="error" onClick={handleClearAll}>
          Vymazať všetko
        </Button>
      </Box>

      {savedAnalyses.map((item) => (
        <Accordion
          key={item.id}
          expanded={expanded === item.id}
          onChange={(_e, isExpanded) => setExpanded(isExpanded ? item.id : false)}
          sx={{
            mb: 1.5,
            borderRadius: '12px !important',
            '&:before': { display: 'none' },
            boxShadow: theme.shadows[1],
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, mr: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  color: '#fff',
                  backgroundColor:
                    item.result.score <= 30
                      ? '#D32F2F'
                      : item.result.score <= 60
                        ? '#F57C00'
                        : item.result.score <= 80
                          ? '#388E3C'
                          : '#1B5E20',
                }}
              >
                {item.result.score}
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {formatDate(item.date)}
                </Typography>
                <Typography variant="body2" noWrap>
                  {item.composition.slice(0, 80)}
                  {item.composition.length > 80 ? '...' : ''}
                </Typography>
              </Box>
              <IconButton
                component="span"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                sx={{ color: 'text.secondary' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
              {item.composition}
            </Typography>
            <ScoreCard score={item.result.score} summary={item.result.summary} />
            <ProsConsCard pros={item.result.pros} cons={item.result.cons} />
            <RecommendationChip recommendation={item.result.recommendation} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
