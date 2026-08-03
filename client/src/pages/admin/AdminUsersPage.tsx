import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { People as PeopleIcon, Article as ArticleIcon } from '@mui/icons-material';
import PageContainer from '../../components/ui/PageContainer';
import PageHeader from '../../components/ui/PageHeader';
import { listUsers, setUserAdmin, type AdminUser } from '../../services/adminApi';

export default function AdminUsersPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (user: AdminUser, next: boolean) => {
    setSavingId(user.id);
    setError(null);
    try {
      const updated = await setUserAdmin(user.id, next);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setNotice(next ? 'Admin práva pridelené.' : 'Admin práva odobraté.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        icon={<PeopleIcon />}
        title="Používatelia"
        action={
          <Button
            variant="outlined"
            startIcon={<ArticleIcon />}
            onClick={() => navigate('/admin/clanky')}
          >
            Správa článkov
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: theme.spacing(2) }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: theme.spacing(2) }}>
        Admin má prístup k správe článkov a publikuje priamo bez schvaľovacieho kroku.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>E-mail</TableCell>
                <TableCell>Registrácia</TableCell>
                <TableCell align="right">Admin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email ?? '—'}</TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('sk-SK') : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={user.isAdmin}
                      disabled={savingId === user.id}
                      onChange={(e) => void toggle(user, e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        message={notice ?? ''}
      />
    </PageContainer>
  );
}
