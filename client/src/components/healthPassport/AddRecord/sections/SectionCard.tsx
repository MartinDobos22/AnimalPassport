import { useState, type ReactNode } from 'react';
import { Box, Card, Collapse, IconButton, Stack, Typography, alpha, useTheme } from '@mui/material';
import { ExpandMore as ExpandIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  required?: boolean;
  children: ReactNode;
}

export default function SectionCard({
  title,
  description,
  icon,
  collapsible = false,
  defaultExpanded = true,
  expanded: controlled,
  onExpandChange,
  required,
  children,
}: Props) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [uncontrolled, setUncontrolled] = useState(defaultExpanded);
  const expanded = controlled ?? uncontrolled;

  const toggle = () => {
    const next = !expanded;
    if (onExpandChange) onExpandChange(next);
    else setUncontrolled(next);
  };

  const headerContent = (
    <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
      {icon && (
        <Box
          sx={{
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            '& svg': { fontSize: 18 },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
        }}
      >
        {title}
      </Typography>
      {required && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            textTransform: 'none',
            letterSpacing: 0,
            fontSize: '0.7rem',
            ml: 0.5,
          }}
        >
          ({t('labels.required')})
        </Typography>
      )}
    </Stack>
  );

  return (
    <Card
      sx={{
        p: 0,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.4 : 1),
        borderColor: theme.palette.divider,
      }}
    >
      {collapsible ? (
        <Box
          component="button"
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.25,
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: 'inherit',
            font: 'inherit',
            textAlign: 'left',
            '&:hover': { bgcolor: 'action.hover' },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2,
            },
          }}
        >
          {headerContent}
          <IconButton
            component="span"
            size="small"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 160ms ease',
              pointerEvents: 'none',
            }}
            tabIndex={-1}
          >
            <ExpandIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>{headerContent}</Box>
      )}
      {description && (
        <Typography
          variant="body2"
          sx={{ px: 2, pt: collapsible ? 0 : 0.5, pb: 0.5, color: 'text.secondary' }}
        >
          {description}
        </Typography>
      )}
      <Collapse in={expanded} unmountOnExit={false}>
        <Box sx={{ px: 2, pb: 2, pt: collapsible ? 0.5 : 1 }}>{children}</Box>
      </Collapse>
    </Card>
  );
}
