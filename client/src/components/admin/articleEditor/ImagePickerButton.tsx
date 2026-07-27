import { useRef, useState, type ReactNode } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  AddPhotoAlternateOutlined as UploadNewIcon,
  CollectionsOutlined as LibraryIcon,
  Image as ImageIcon,
  LinkOutlined as UrlIcon,
} from '@mui/icons-material';
import MediaLibraryDialog from './MediaLibraryDialog';
import MediaCropDialog from './MediaCropDialog';
import type { MediaImage } from '../../../types/media';

// Ľahký tvar vybraného obrázka — pokrýva knižnicu/upload (MediaImage) aj
// obrázok z internetu (len URL, bez záznamu v knižnici).
export interface PickedImage {
  url: string;
  alt?: string | null;
  caption?: string | null;
  author?: string | null;
}

function fromMedia(media: MediaImage): PickedImage {
  return { url: media.url, alt: media.alt, caption: media.caption, author: media.author };
}

interface Props {
  onPicked: (image: PickedImage) => void;
  label?: string;
  /** Vlastný spúšťač namiesto default tlačidla. Dostane onClick handler. */
  renderTrigger?: (onClick: (e: React.MouseEvent<HTMLElement>) => void) => ReactNode;
}

// Jednotný vstup pre obrázok: klik → menu s možnosťou vybrať z knižnice (galéria),
// nahrať nový (s orezaním) alebo vložiť z internetu (URL).
export default function ImagePickerButton({
  onPicked,
  label = 'Pridať obrázok',
  renderTrigger,
}: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const closeMenu = () => setAnchor(null);

  const confirmUrl = () => {
    const trimmed = url.trim();
    if (trimmed) onPicked({ url: trimmed });
    setUrl('');
    setUrlOpen(false);
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger(openMenu)
      ) : (
        <Button variant="outlined" size="small" startIcon={<ImageIcon />} onClick={openMenu}>
          {label}
        </Button>
      )}
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            closeMenu();
            setLibraryOpen(true);
          }}
        >
          <ListItemIcon>
            <LibraryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Vybrať z knižnice</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            fileInputRef.current?.click();
          }}
        >
          <ListItemIcon>
            <UploadNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Nahrať nový</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            setUrlOpen(true);
          }}
        >
          <ListItemIcon>
            <UrlIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Vložiť z internetu (URL)</ListItemText>
        </MenuItem>
      </Menu>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setCropFile(f);
          e.target.value = '';
        }}
      />
      <MediaLibraryDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(media) => onPicked(fromMedia(media))}
      />
      <MediaCropDialog
        file={cropFile}
        open={cropFile !== null}
        onClose={() => setCropFile(null)}
        onUploaded={(media) => onPicked(fromMedia(media))}
      />

      <Dialog open={urlOpen} onClose={() => setUrlOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Obrázok z internetu</DialogTitle>
        <DialogContent>
          <TextField
            label="URL obrázka"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…/obrazok.jpg"
            helperText="Priama adresa obrázka (musí byť verejne dostupná)."
            fullWidth
            autoFocus
            margin="dense"
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmUrl();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUrlOpen(false)}>Zrušiť</Button>
          <Button variant="contained" onClick={confirmUrl} disabled={!url.trim()}>
            Vložiť
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
