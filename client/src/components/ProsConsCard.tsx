import {
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import { CheckCircle as CheckIcon, Cancel as CancelIcon } from '@mui/icons-material';

interface ProsConsCardProps {
  pros: string[];
  cons: string[];
}

export default function ProsConsCard({ pros, cons }: ProsConsCardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}
    >
      {/* Výhody */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.success.main,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CheckIcon fontSize="small" />
            Výhody
          </Typography>
          <List dense disablePadding>
            {pros.map((pro, i) => (
              <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                </ListItemIcon>
                <ListItemText primary={pro} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Nevýhody */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.error.main,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CancelIcon fontSize="small" />
            Nevýhody
          </Typography>
          <List dense disablePadding>
            {cons.map((con, i) => (
              <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CancelIcon sx={{ fontSize: 18, color: theme.palette.error.main }} />
                </ListItemIcon>
                <ListItemText primary={con} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
