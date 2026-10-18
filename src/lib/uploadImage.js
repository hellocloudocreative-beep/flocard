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
  avatar:    'avatars',
  logo:      'logos',
  portfolio: 'portfolio',
  general:   'uploads',
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

  // Compress first (reduces size from MBs to ~50-150 KB)
  const maxDims = {
    avatar:    { maxWidth: 400,  maxHeight: 400,  quality: 0.85 },
    logo:      { maxWidth: 600,  maxHeight: 600,  quality: 0.88, outputFormat: file.type === 'image/png' ? 'image/png' : 'image/jpeg' },
    portfolio: { maxWidth: 900,  maxHeight: 900,  quality: 0.82 },
    general:   { maxWidth: 1200, maxHeight: 1200, quality: 0.80 },
  };

  let compressedDataUrl = '';
  try {
    compressedDataUrl = await compressImage(file, maxDims[type] || maxDims.general);
  } catch (err) {
    console.warn('[uploadImage] Compression failed, using raw file:', err);
  }

  // Try Supabase Storage (admin client bypasses RLS, anon client as fallback)
  const storageClient = supabaseAdmin || (isSupabaseConfigured ? supabase : null);
  if (storageClient) {
    try {
      const bucket = BUCKETS[type] || BUCKETS.general;
      const ext    = file.name.split('.').pop().toLowerCase() || 'jpg';
      const path   = `${ownerId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Convert compressed data-URL back to Blob for uploading
      const uploadBlob = compressedDataUrl
        ? dataUrlToBlob(compressedDataUrl)
        : file;

      const { data, error } = await storageClient.storage
        .from(bucket)
        .upload(path, uploadBlob, {
          contentType: uploadBlob.type || file.type || 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        });

      if (error) {
        console.warn(`[uploadImage] Supabase upload error (bucket: ${bucket}):`, error.message);
        // Fall through to base64 fallback
      } else {
        // Use anon client to get public URL (works regardless of which client uploaded)
        const urlClient = supabase || storageClient;
        const { data: urlData } = urlClient.storage.from(bucket).getPublicUrl(data.path);
        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('[uploadImage] Supabase Storage exception:', err);
    }
  }

  // Base64 fallback (works offline / before buckets are created)
  if (compressedDataUrl) return compressedDataUrl;

  // Last resort: raw FileReader
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
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
