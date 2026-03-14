import { Box, Card, CardContent, Link, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import {
  Pets as PetsIcon,
  Science as ScienceIcon,
  Speed as SpeedIcon,
  CloudOff as OfflineIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';

export default function AboutPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        O aplikácii
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        GranuleCheck vám pomáha vybrať tie najlepšie granule pre vášho psíka
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <PetsIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              GranuleCheck
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            GranuleCheck je inteligentný nástroj na analýzu zloženia psích granúl. Stačí skopírovať zloženie z obalu
            krmiva a aplikácia vyhodnotí kvalitu ingrediencií, identifikuje výhody a nevýhody, a poradí, pre aké
            psy je krmivo vhodné.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Funkcie
          </Typography>
          <List disablePadding>
            <ListItem disableGutters>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ScienceIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Analýza zloženia"
                secondary="Hodnotenie kvality ingrediencií na škále 0–100"
              />
            </ListItem>
            <ListItem disableGutters>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SpeedIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Rýchle výsledky"
                secondary="Analýza prebehne v priebehu niekoľkých sekúnd"
              />
            </ListItem>
            <ListItem disableGutters>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <OfflineIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Funguje aj offline"
                secondary="PWA aplikácia so základnou offline podporou"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Technológie
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Frontend:</strong> React 18, TypeScript, Material UI 5, Vite
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Backend:</strong> Node.js, Express, TypeScript
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>PWA:</strong> Service Worker, Web App Manifest
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GitHubIcon sx={{ fontSize: 18 }} />
            <Link href="#" color="primary" underline="hover" sx={{ fontWeight: 500 }}>
              Zdrojový kód na GitHube
            </Link>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
        Verzia 1.0.0 MVP &bull; 2026
      </Typography>
    </Box>
  );
}
