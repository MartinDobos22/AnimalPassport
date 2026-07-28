import { useState, type ReactNode } from 'react';
import { Button } from '@mui/material';
import { CropOutlined as CropIcon } from '@mui/icons-material';
import MediaCropDialog from './MediaCropDialog';
import type { PickedImage } from './ImagePickerButton';
import type { MediaImage } from '../../../types/media';

interface Props {
  imageUrl: string;
  onCropped: (image: PickedImage) => void;
  initialMeta?: { alt?: string | null; caption?: string | null; author?: string | null };
  label?: string;
  /** Vlastný spúšťač namiesto default tlačidla. Dostane onClick handler. */
  renderTrigger?: (onClick: () => void) => ReactNode;
}

// Orezanie existujúceho obrázka (z URL). Otvorí crop dialóg nad daným obrázkom;
// výsledok nahrá ako nový obrázok do knižnice a vráti ho cez onCropped.
export default function ImageCropButton({
  imageUrl,
  onCropped,
  initialMeta,
  label = 'Orezať',
  renderTrigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleUploaded = (media: MediaImage) => {
    onCropped({ url: media.url, alt: media.alt, caption: media.caption, author: media.author });
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <Button
          variant="outlined"
          size="small"
          startIcon={<CropIcon />}
          onClick={() => setOpen(true)}
        >
          {label}
        </Button>
      )}
      <MediaCropDialog
        imageUrl={open ? imageUrl : null}
        open={open}
        onClose={() => setOpen(false)}
        onUploaded={handleUploaded}
        initialMeta={initialMeta}
      />
    </>
  );
}
