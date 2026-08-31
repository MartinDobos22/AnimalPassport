import { alpha, type Theme } from '@mui/material/styles';

// Zdieľaný povrch pre demo karty na landingu. V light je to biely papier s jemným
// tieňom; v dark je papier subtílne nadvihnutý cez white overlay (ako MUI elevation),
// aby karta nesplývala s tmavým pozadím, plus výraznejší okraj a hlbší tieň.
export function landingCardSx(theme: Theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    bgcolor: 'background.paper',
    backgroundImage: isDark
      ? `linear-gradient(${alpha(theme.palette.common.white, 0.05)}, ${alpha(theme.palette.common.white, 0.05)})`
      : 'none',
    border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.09) : theme.palette.divider}`,
    boxShadow: isDark
      ? `0 16px 40px ${alpha(theme.palette.common.black, 0.45)}`
      : `0 20px 50px ${alpha(theme.palette.primary.main, 0.08)}`,
  };
}
