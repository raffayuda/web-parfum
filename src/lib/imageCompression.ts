export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Validates and compresses an image file in the browser before uploading.
 * Rejects files over 2 MB immediately and shrinks dimensions/quality to WebP/JPEG.
 */
export async function compressImageFile(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Format file harus berupa gambar (JPG, PNG, atau WEBP).');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Ukuran gambar terlalu besar. Maksimal ukuran kirim adalah 2 MB.');
  }

  if (typeof document === 'undefined') {
    return file;
  }

  const maxDim = options.maxDimension ?? 1280;
  const quality = options.quality ?? 0.78;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'upload';
          resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Safely opens an HTTP URL or base64 data URI image in a new browser tab.
 */
export function openImageInNewTab(src: string) {
  if (!src || typeof window === 'undefined') return;

  if (!src.startsWith('data:')) {
    window.open(src, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const [header, base64Data] = src.split(',');
    const mimeMatch = header.match(/data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch {
    window.open(src, '_blank', 'noopener,noreferrer');
  }
}
