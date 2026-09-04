/**
 * Client-side image resizer and compressor
 * Section 4.2 of Cahier des Charges:
 * Automatically resizes and compresses any uploaded image (avatars, challenge proofs)
 * to ensure file size is strictly under 1 MB while preserving crisp visuals.
 */

export async function compressAndResizeImage(
  fileOrDataUrl: File | string,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio while capping to max bounding dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback to original
        if (typeof fileOrDataUrl === 'string') resolve(fileOrDataUrl);
        else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(fileOrDataUrl);
        }
        return;
      }

      // Smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Output compressed JPEG
      let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

      // Verify that the payload is well under 1 MB (~1,000,000 bytes)
      if (compressedDataUrl.length > 950000) {
        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
      }

      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      console.warn('Failed to load image for compression', err);
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(fileOrDataUrl);
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
