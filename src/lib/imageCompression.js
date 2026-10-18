/* ==========================================================================
   FLOCARD CLIENT-SIDE IMAGE COMPRESSION UTILITY
   Downscales and compresses uploaded images (avatar, logo, portfolio)
   using HTML5 Canvas to prevent localStorage quota exhaustion.
   Ensures fast load times and reliable persistence across devices.
   ========================================================================== */

/**
 * Compresses an image file (File, Blob, or base64 string) into an optimized data URL.
 * @param {File|Blob|string} source - Image source
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum allowed width (default 600)
 * @param {number} options.maxHeight - Maximum allowed height (default 600)
 * @param {number} options.quality - JPEG compression quality 0-1 (default 0.82)
 * @param {string} options.outputFormat - 'image/jpeg' | 'image/webp' | 'image/png' (default 'image/jpeg')
 * @returns {Promise<string>} Base64 data URL
 */
export async function compressImage(source, options = {}) {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.82,
    outputFormat = 'image/jpeg'
  } = options;

  if (!source) return '';

  return new Promise((resolve, reject) => {
    // If source is already a small string URL or path
    if (typeof source === 'string' && (source.startsWith('/assets/') || source.startsWith('http://') || source.startsWith('https://'))) {
      return resolve(source);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          return resolve(typeof source === 'string' ? source : '');
        }

        // Calculate aspect-ratio scaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(typeof source === 'string' ? source : '');
        }

        // Smooth bicubic resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill background with white if converting PNG with transparency to JPEG
        if (outputFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(outputFormat, quality);
        resolve(dataUrl);
      } catch (err) {
        console.warn('[FLOCARD Image Compression] Canvas compression failed, falling back to raw data:', err);
        resolve(typeof source === 'string' ? source : '');
      }
    };

    img.onerror = (err) => {
      console.warn('[FLOCARD Image Compression] Image load error:', err);
      // Fallback
      if (typeof source === 'string') resolve(source);
      else reject(err);
    };

    if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      resolve('');
    }
  });
}
