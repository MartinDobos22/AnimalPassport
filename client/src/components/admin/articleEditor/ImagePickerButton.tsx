import { useRef, useState, type ReactNode } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  AddPhotoAlternateOutlined as UploadNewIcon,
  CollectionsOutlined as LibraryIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import MediaLibraryDialog from './MediaLibraryDialog';
import MediaCropDialog from './MediaCropDialog';
import type { MediaImage } from '../../../types/media';

interface Props {
  onPicked: (media: MediaImage) => void;
  label?: string;
  /** Vlastný spúšťač namiesto default tlačidla. Dostane onClick handler. */
  renderTrigger?: (onClick: (e: React.MouseEvent<HTMLElement>) => void) => ReactNode;
}

// Jednotný vstup „Vybrať / Nahrať": klik → menu s možnosťou vybrať z knižnice
// (galéria) alebo nahrať nový obrázok (s orezaním). Po výbere/uploade vráti MediaImage.
export default function ImagePickerButton({ onPicked, label = 'Pridať obrázok', renderTrigger }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const closeMenu = () => setAnchor(null);

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
        onSelect={onPicked}
      />
      <MediaCropDialog
        file={cropFile}
        open={cropFile !== null}
        onClose={() => setCropFile(null)}
        onUploaded={onPicked}
      />
    </>
  );
}
