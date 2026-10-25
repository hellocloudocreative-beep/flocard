/* ==========================================================================
FLOCARD UNIFIED IMAGE UPLOAD UTILITY
Uploads images to Supabase Storage (avatars / logos / portfolio buckets).
Falls back to compressed base64 if Supabase Storage is unavailable.
========================================================================== */

import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';
import { compressImage } from './imageCompression';

/**
 * Bucket names in Supabase Storage.
 * Create these in: Supabase Dashboard → Storage → New Bucket (make Public)
 */
const BUCKETS = {
  avatar: 'avatars',
  logo: 'logos',
  'card-logos': 'logos',
  portfolio: 'portfolio',
  general: 'uploads',
};

/**
 * Upload an image file to Supabase Storage.
 * Returns the public URL on success, or a compressed base64 data-URL as fallback.
 *
 * @param {File} file               - The raw File object from an <input type="file">
 * @param {'avatar'|'logo'|'portfolio'|'general'} type - Which bucket to upload to
 * @param {string} [ownerId]        - User / customer ID used to namespace the path
 * @returns {Promise<string>}       - Public URL or base64 data-URL
 */
export async function uploadImage(file, type = 'general', ownerId = 'anon') {
  if (!file) return '';

  console.groupCollapsed(`[FLOCARD Upload] Starting upload (${type}) for owner: ${ownerId}`);
  console.log('[Upload: Step 1] File selected & validating:', {
    name: file.name,
    sizeBytes: file.size,
    type: file.type
  });

  // Validate image
  const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif|bmp|avif)$/i.test(file.name || '');
  if (!isImage) {
    console.warn('[Upload: Validation Error] Not a recognized image format.');
    console.groupEnd();
    throw new Error('Please select a valid image file (PNG, JPG, SVG, WebP).');
  }

  // Compress first (reduces size from MBs to ~50-150 KB)
  const maxDims = {
    avatar: { maxWidth: 400, maxHeight: 400, quality: 0.85 },
    logo: { maxWidth: 600, maxHeight: 600, quality: 0.88, outputFormat: file.type === 'image/png' ? 'image/png' : 'image/jpeg' },
    portfolio: { maxWidth: 900, maxHeight: 900, quality: 0.82 },
    general: { maxWidth: 1200, maxHeight: 1200, quality: 0.80 },
  };

  let compressedDataUrl = '';
  try {
    console.log('[Upload: Step 2] Optimizing client-side compression...');
    compressedDataUrl = await Promise.race([
      compressImage(file, maxDims[type] || maxDims.general),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Compression timed out')), 4000))
    ]);
  } catch (err) {
    console.warn('[Upload: Step 2] Compression skipped or timed out, proceeding with raw file:', err?.message || err);
  }

  // Try Supabase Storage (admin client bypasses RLS, anon client as fallback)
  const storageClient = supabaseAdmin || (isSupabaseConfigured ? supabase : null);
  const bucket = BUCKETS[type] || BUCKETS.general;
  const ext = (file.name || 'image').split('.').pop().toLowerCase() || 'jpg';
  const cleanOwner = (ownerId || 'admin').replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${cleanOwner}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  if (storageClient) {
    try {
      console.log('[Upload: Step 3] Dispatching to Supabase Storage bucket:', {
        bucket,
        path,
        client: supabaseAdmin ? 'Service Role Admin' : 'Anon'
      });

      // Convert compressed data-URL back to Blob for uploading, or use raw file
      let uploadBlob = file;
      if (compressedDataUrl) {
        try {
          uploadBlob = dataUrlToBlob(compressedDataUrl);
        } catch (e) {
          uploadBlob = file;
        }
      }

      // Add 10-second timeout to prevent upload hanging indefinitely on slow/dropped networks
      const uploadPromise = storageClient.storage
        .from(bucket)
        .upload(path, uploadBlob, {
          contentType: uploadBlob.type || file.type || 'image/jpeg',
          upsert: false,
          cacheControl: '3600',
        });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Storage upload timed out after 10s')), 10000)
      );

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (error) {
        console.warn(`[Upload: Step 4] Supabase Storage upload returned error (bucket: ${bucket}):`, {
          message: error.message,
          statusCode: error.statusCode,
          details: error
        });
      } else if (data?.path) {
        const urlClient = supabase || storageClient;
        const { data: urlData } = urlClient.storage.from(bucket).getPublicUrl(data.path);
        if (urlData?.publicUrl) {
          console.log('[Upload: Step 5] Public Storage URL successfully resolved:', urlData.publicUrl);
          console.groupEnd();
          return urlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('[Upload: Step 4] Supabase Storage upload exception:', err?.message || err);
    }
  } else {
    console.log('[Upload: Step 3] Supabase not configured or offline, using local persistent data URL.');
  }

  // Base64 fallback (instant & permanent offline persistence)
  if (compressedDataUrl) {
    console.log('[Upload: Step 5] Completed with compressed data URL fallback.');
    console.groupEnd();
    return compressedDataUrl;
  }

  // Last resort: raw FileReader with 4-second timeout
  return new Promise((resolve) => {
    const reader = new FileReader();
    const timer = setTimeout(() => {
      console.warn('[Upload: Step 5] FileReader timed out, returning empty.');
      console.groupEnd();
      resolve('');
    }, 4000);

    reader.onload = () => {
      clearTimeout(timer);
      console.log('[Upload: Step 5] Completed with raw FileReader fallback.');
      console.groupEnd();
      resolve(reader.result || '');
    };
    reader.onerror = () => {
      clearTimeout(timer);
      console.error('[Upload: Step 5] FileReader error.');
      console.groupEnd();
      resolve('');
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Delete an image from Supabase Storage by its public URL.
 * Safe to call even if the URL is a base64 string (no-op).
 */
export async function deleteStorageImage(publicUrl) {
  if (!publicUrl || publicUrl.startsWith('data:') || !isSupabaseConfigured || !supabase) return;
  try {
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (!match) return;
    const [, bucket, path] = match;
    await supabase.storage.from(bucket).remove([path]);
  } catch (err) {
    console.warn('[deleteStorageImage] Failed to delete:', err);
  }
}

// Internal helpers

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
