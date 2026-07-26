import {
  Box,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { detectEmbedProvider, toEmbedSrc } from '../../../utils/embedUrl';
import type { EmbedProvider } from '../../../content/poradna/types';

const PROVIDER_LABELS: Record<EmbedProvider, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  instagram: 'Instagram',
};

export default function EmbedNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const theme = useTheme();
  const provider = (node.attrs.provider as EmbedProvider) ?? 'facebook';
  const url = (node.attrs.url as string) ?? '';
  const caption = (node.attrs.caption as string) ?? '';
  const src = toEmbedSrc(provider, url);

  const onUrlChange = (value: string) => {
    const detected = detectEmbedProvider(value);
    updateAttributes({ url: value, ...(detected ? { provider: detected } : {}) });
  };

  return (
    <NodeViewWrapper>
      <Box
        contentEditable={false}
        sx={{
          my: theme.spacing(2),
          p: theme.spacing(2),
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: `${theme.shape.borderRadius}px`,
          bgcolor: theme.palette.action.hover,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: theme.spacing(1) }}
        >
          <Typography variant="caption" color="text.secondary">
            Embed ({PROVIDER_LABELS[provider]})
          </Typography>
          <Tooltip title="Zmazať embed">
            <IconButton size="small" aria-label="Zmazať embed" onClick={deleteNode}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: theme.spacing(1) }}>
          <TextField
            label="URL príspevku"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://www.facebook.com/... / https://youtu.be/..."
            size="small"
            fullWidth
          />
          <TextField
            select
            label="Sieť"
            value={provider}
            onChange={(e) => updateAttributes({ provider: e.target.value as EmbedProvider })}
            size="small"
            sx={{ minWidth: theme.spacing(16) }}
          >
            {(Object.keys(PROVIDER_LABELS) as EmbedProvider[]).map((p) => (
              <MenuItem key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {src ? (
          <Box
            component="iframe"
            src={src}
            title={`Embed ${PROVIDER_LABELS[provider]}`}
            loading="lazy"
            sx={{
              width: '100%',
              minHeight: theme.spacing(45),
              border: 0,
              borderRadius: `${theme.shape.borderRadius}px`,
              bgcolor: theme.palette.background.paper,
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Vlož platnú URL príspevku (Facebook, YouTube alebo Instagram).
          </Typography>
        )}
        <TextField
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Popisok pod embedom (nepovinné)"
          size="small"
          variant="standard"
          fullWidth
          sx={{ mt: theme.spacing(1) }}
        />
      </Box>
    </NodeViewWrapper>
  );
}
