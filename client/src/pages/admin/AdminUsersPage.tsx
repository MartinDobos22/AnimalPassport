import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  Article as ArticleIcon,
  Block as BlockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import PageContainer from '../../components/ui/PageContainer';
import PageHeader from '../../components/ui/PageHeader';
import { listUsers, setUserAdmin, setUserBlocked, type AdminUser } from '../../services/adminApi';

// Google účty overenie e-mailom neprechádzajú — adresu ručí Google, takže
// „neoverený“ by pri nich bolo zavádzajúce.
function renderVerification(user: AdminUser) {
  if (user.authProvider === 'google.com') {
    return <Chip size="small" variant="outlined" label="Google" />;
  }
  if (!user.emailVerified) {
    return <Chip size="small" color="warning" label="Neoverený" />;
  }
  const when = user.emailVerifiedAt
    ? new Date(user.emailVerifiedAt).toLocaleDateString('sk-SK')
    : '';
  return (
    <Tooltip title={when && `Overené ${when}`}>
      <Chip size="small" color="success" variant="outlined" label="E-mail overený" />
    </Tooltip>
  );
}

export default function AdminUsersPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const applyUpdate = (updated: AdminUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const toggle = async (user: AdminUser, next: boolean) => {
    setSavingId(user.id);
    setError(null);
    try {
      applyUpdate(await setUserAdmin(user.id, next));
      setNotice(next ? 'Admin práva pridelené.' : 'Admin práva odobraté.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const confirmBlock = async () => {
    if (!blockTarget) return;
    setSavingId(blockTarget.id);
    setError(null);
    try {
      applyUpdate(await setUserBlocked(blockTarget.id, true, blockReason));
      setNotice('Účet bol zablokovaný.');
      setBlockTarget(null);
      setBlockReason('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const unblock = async (user: AdminUser) => {
    setSavingId(user.id);
    setError(null);
    try {
      applyUpdate(await setUserBlocked(user.id, false));
      setNotice('Účet bol odblokovaný.');
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
        Admin má prístup k správe článkov a publikuje priamo bez schvaľovacieho kroku. Zablokovaný
        účet stratí prístup k API do minúty a pri ďalšom volaní dostane chybu s dôvodom.
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
                <TableCell>Overenie</TableCell>
                <TableCell>Stav</TableCell>
                <TableCell align="right">Admin</TableCell>
                <TableCell align="right">Akcia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email ?? '—'}</TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('sk-SK') : '—'}
                  </TableCell>
                  <TableCell>{renderVerification(user)}</TableCell>
                  <TableCell>
                    {user.blockedAt ? (
                      <Tooltip title={user.blockedReason ?? ''}>
                        <Chip size="small" color="error" label="Zablokovaný" />
                      </Tooltip>
                    ) : (
                      <Chip size="small" variant="outlined" label="Aktívny" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={user.isAdmin}
                      disabled={savingId === user.id}
                      onChange={(e) => void toggle(user, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {user.blockedAt ? (
                      <Button
                        size="small"
                        startIcon={<LockOpenIcon />}
                        disabled={savingId === user.id}
                        onClick={() => void unblock(user)}
                      >
                        Odblokovať
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<BlockIcon />}
                        disabled={savingId === user.id}
                        onClick={() => {
                          setBlockReason('');
                          setBlockTarget(user);
                        }}
                      >
                        Zablokovať
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog open={Boolean(blockTarget)} onClose={() => setBlockTarget(null)} fullWidth>
        <DialogTitle>Zablokovať účet</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: theme.spacing(2) }}>
            {blockTarget?.email ?? 'Účet'} stratí prístup k aplikácii. Dôvod sa uloží k účtu a slúži
            ako podklad pre oznámenie používateľovi podľa Podmienok používania.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Dôvod zablokovania"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockTarget(null)}>Zrušiť</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!blockReason.trim() || savingId === blockTarget?.id}
            onClick={() => void confirmBlock()}
          >
            Zablokovať
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        message={notice ?? ''}
      />
    </PageContainer>
  );
}
