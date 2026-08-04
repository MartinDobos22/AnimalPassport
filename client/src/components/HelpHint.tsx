import { useCallback, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ClickAwayListener, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material';

interface HelpHintProps {
  text: string;
  size?: number;
  /** Farba ikony — na farebných podkladoch nastav napr. 'inherit'. */
  color?: string;
}

export default function HelpHint({ text, size = 16, color = 'text.secondary' }: HelpHintProps) {
  const { t } = useTranslation();
  const hasHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setOpen((prev) => !prev);
  }, []);

  const handleAway = useCallback(() => {
    if (open) setOpen(false);
  }, [open]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') setOpen(false);
  }, []);

  return (
    <ClickAwayListener onClickAway={handleAway}>
      <Tooltip
        title={
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            {text}
          </Typography>
        }
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        disableHoverListener={!hasHover}
        disableTouchListener
        disableFocusListener={false}
        enterDelay={200}
        leaveDelay={100}
        placement="bottom-start"
        arrow
        slotProps={{
          tooltip: {
            sx: {
              maxWidth: 280,
              p: 1.25,
              borderRadius: 2,
              bgcolor: 'background.paper',
              color: 'text.primary',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: 3,
            },
          },
          arrow: {
            sx: {
              color: 'background.paper',
              '&::before': {
                border: (theme) => `1px solid ${theme.palette.divider}`,
              },
            },
          },
        }}
      >
        <IconButton
          size="small"
          aria-label={t('help.label')}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          sx={{
            p: 0.25,
            color,
            verticalAlign: 'middle',
            '@media print': { display: 'none' },
          }}
        >
          <HelpOutlineIcon sx={{ fontSize: size }} />
        </IconButton>
      </Tooltip>
    </ClickAwayListener>
  );
}
