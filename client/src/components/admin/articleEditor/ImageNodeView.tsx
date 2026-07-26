import {
  Box,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

const WIDTH_PRESETS: { label: string; value: number }[] = [
  { label: 'S', value: 25 },
  { label: 'M', value: 50 },
  { label: 'L', value: 75 },
  { label: 'Plná', value: 100 },
];

export default function ImageNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const theme = useTheme();
  const src = (node.attrs.src as string) ?? '';
  const alt = (node.attrs.alt as string) ?? '';
  const caption = (node.attrs.caption as string) ?? '';
  const width = typeof node.attrs.width === 'number' ? (node.attrs.width as number) : null;
  // 100 % = plná šírka → ukladáme ako null (default), aby web nebol viazaný na hodnotu.
  const setWidth = (value: number | null) =>
    updateAttributes({ width: value === null || value >= 100 ? null : value });

  return (
    <NodeViewWrapper>
      <Box contentEditable={false} sx={{ my: theme.spacing(2) }}>
        <Box sx={{ position: 'relative', width: width ? `${width}%` : '100%', maxWidth: '100%' }}>
          {src && (
            <Box
              component="img"
              src={src}
              alt={alt}
              sx={{
                display: 'block',
                width: '100%',
                height: 'auto',
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            />
          )}
          <Tooltip title="Zmazať obrázok">
            <IconButton
              size="small"
              aria-label="Zmazať obrázok"
              onClick={deleteNode}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={width ?? 100}
          onChange={(_, val) => setWidth(val)}
          sx={{ mt: theme.spacing(0.75) }}
        >
          {WIDTH_PRESETS.map((preset) => (
            <ToggleButton key={preset.label} value={preset.value}>
              {preset.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TextField
          value={alt}
          onChange={(e) => updateAttributes({ alt: e.target.value })}
          placeholder="Alt text (popis obrázka pre prístupnosť a SEO)"
          size="small"
          variant="standard"
          fullWidth
          sx={{ mt: theme.spacing(0.5) }}
        />
        <TextField
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Popisok pod obrázkom (zobrazí sa čitateľom)"
          size="small"
          variant="standard"
          fullWidth
          sx={{ mt: theme.spacing(0.5) }}
        />
      </Box>
    </NodeViewWrapper>
  );
}
