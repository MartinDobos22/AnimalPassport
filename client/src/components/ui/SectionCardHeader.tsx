import type { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';
import IconTile from './IconTile';
import HelpHint from '../HelpHint';

interface Props {
  icon: ReactNode;
  /** Akcentová farba (theme token). Default: primary.main. */
  accent?: string;
  title: string;
  /** Voliteľné vysvetlenie k sekcii — zobrazí sa ako „?“ vedľa nadpisu. */
  hint?: string;
  /** Voliteľná akcia vpravo (tlačidlo, link…). */
  action?: ReactNode;
}

/**
 * Jednotná hlavička karty/sekcie: ikonová dlaždica + nadpis + voliteľná akcia.
 * Používaj v kartách namiesto ručného `Stack + Icon + Typography`.
 */
export default function SectionCardHeader({ icon, accent, title, hint, action }: Props) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
      <IconTile icon={icon} accent={accent} />
      <Stack direction="row" alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" sx={{ minWidth: 0 }}>
          {title}
        </Typography>
        {hint && <HelpHint text={hint} />}
      </Stack>
      {action}
    </Stack>
  );
}
