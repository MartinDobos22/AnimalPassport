import { useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { lightTheme, darkTheme } from './theme';
import { useLocalStorage } from './hooks/useLocalStorage';
import Layout from './components/Layout';
import AnalyzePage from './pages/AnalyzePage';
import PetProfilePage from './pages/PetProfilePage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  const [darkMode, setDarkMode] = useLocalStorage('granule-check-dark-mode', false);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout darkMode={darkMode} onToggleTheme={() => setDarkMode((prev) => !prev)}>
          <Routes>
            <Route path="/" element={<AnalyzePage />} />
            <Route path="/profily" element={<PetProfilePage />} />
            <Route path="/historia" element={<HistoryPage />} />
            <Route path="/o-aplikacii" element={<AboutPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
