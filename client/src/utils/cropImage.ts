export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedImage {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
}

function loadImage(src: string, crossOrigin?: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Pri obrázku z inej domény (napr. z knižnice cez public URL) treba
    // crossOrigin, inak canvas „staintne" a toDataURL vyhodí SecurityError.
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Obrázok sa nepodarilo načítať.'));
    img.src = src;
  });
}

// Oreže obrázok podľa pixelovej oblasti z react-easy-crop a zmenší na maxWidth.
// Výstup JPEG (menšie súbory pre foto obsah). Vráti dataUrl + rozmery.
export async function cropImage(
  src: string,
  area: CropArea,
  options: { maxWidth?: number; mimeType?: string; quality?: number; crossOrigin?: boolean } = {}
): Promise<CroppedImage> {
  const { maxWidth = 1600, mimeType = 'image/jpeg', quality = 0.85, crossOrigin } = options;
  const img = await loadImage(src, crossOrigin);

  const scale = area.width > maxWidth ? maxWidth / area.width : 1;
  const outWidth = Math.max(1, Math.round(area.width * scale));
  const outHeight = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas kontext nie je dostupný.');

  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outWidth, outHeight);

  return {
    dataUrl: canvas.toDataURL(mimeType, quality),
    mimeType,
    width: outWidth,
    height: outHeight,
  };
}
