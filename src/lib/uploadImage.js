/* ==========================================================================
FLOCARD UNIFIED IMAGE & ASSET UPLOAD UTILITY
Uploads images and banner assets to Supabase Storage.
Supports:
- avatars bucket
- logos bucket
- portfolio bucket (portfolio work & services)
- banners bucket (banner images & short looping videos)
- uploads bucket (general assets)
Integrates per-profile upload quota enforcement and falls back to compressed base64
if Supabase Storage is offline or unavailable.
========================================================================== */

import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase.js';
import { compressImage } from './imageCompression.js';
import { validateUploadQuota } from './storageQuotaService.js';

/**
 * Bucket names in Supabase Storage.
 */
const BUCKETS = {
  avatar: 'avatars',
  logo: 'logos',
  'card-logos': 'logos',
  portfolio: 'portfolio',
  service: 'portfolio',
  banner: 'banners',
  video: 'uploads',
  general: 'uploads',
};

/**
 * Upload an asset file (image or short video) to Supabase Storage.
 *
 * @param {File} file               - The raw File object from an <input type="file">
 * @param {'avatar'|'logo'|'portfolio'|'service'|'banner'|'video'|'general'} type - Which bucket
 * @param {string} [ownerId]        - User / customer ID used to namespace the path
 * @param {object} [profile]        - Current profile for quota enforcement
 * @returns {Promise<string>}       - Permanent Public URL or base64 data-URL
 */
export async function uploadImage(file, type = 'general', ownerId = 'anon', profile = null) {
  if (!file) return '';

  // 1. Quota & file validation
  if (profile) {
    validateUploadQuota({ file, type, profile });
  }

  const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name || '');
  const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|svg|webp|gif|bmp|avif)$/i.test(file.name || '');

  if (!isImage && !isVideo) {
    throw new Error('Please select a valid image (PNG, JPG, WebP) or video (MP4, WebM) file.');
  }

  // 2. Client-side compression for images only (skip for video or SVG)
  let compressedDataUrl = '';
  if (isImage && !file.type?.includes('svg')) {
    const maxDims = {
      avatar: { maxWidth: 400, maxHeight: 400, quality: 0.85 },
      logo: { maxWidth: 600, maxHeight: 600, quality: 0.88, outputFormat: file.type === 'image/png' ? 'image/png' : 'image/jpeg' },
      portfolio: { maxWidth: 1200, maxHeight: 1200, quality: 0.84 },
      service: { maxWidth: 800, maxHeight: 800, quality: 0.85 },
      banner: { maxWidth: 1920, maxHeight: 1080, quality: 0.86 },
      general: { maxWidth: 1200, maxHeight: 1200, quality: 0.80 },
    };

    try {
      compressedDataUrl = await Promise.race([
        compressImage(file, maxDims[type] || maxDims.general),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Compression timed out')), 4000))
      ]);
    } catch (err) {
      console.warn('[Upload] Image compression skipped, uploading raw file:', err?.message || err);
    }
  }

  // 3. Dispatch to Supabase Storage
  // Uses authenticated client or service client, falling back gracefully
  const storageClient = supabaseAdmin || (isSupabaseConfigured ? supabase : null);
  const bucket = BUCKETS[type] || BUCKETS.general;
  const ext = (file.name || 'asset').split('.').pop().toLowerCase() || (isVideo ? 'mp4' : 'jpg');
  const cleanOwner = (ownerId || 'admin').replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${cleanOwner}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  if (storageClient) {
    try {
      let uploadBlob = file;
      if (compressedDataUrl && isImage) {
        try {
          uploadBlob = dataUrlToBlob(compressedDataUrl);
        } catch {
          uploadBlob = file;
        }
      }

      const contentType = isVideo
        ? (file.type || 'video/mp4')
        : (uploadBlob.type || file.type || 'image/jpeg');

      const uploadPromise = storageClient.storage
        .from(bucket)
        .upload(path, uploadBlob, {
          contentType,
          upsert: false,
          cacheControl: '3600',
        });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Storage upload timed out after 12s')), 12000)
      );

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (error) {
        console.warn(`[Upload] Supabase Storage returned error (bucket: ${bucket}):`, error.message);
      } else if (data?.path) {
        const urlClient = supabase || storageClient;
        const { data: urlData } = urlClient.storage.from(bucket).getPublicUrl(data.path);
        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('[Upload] Storage upload exception:', err?.message || err);
    }
  }

  // 4. Base64 fallback (guarantees local offline persistence for images)
  if (compressedDataUrl) {
    return compressedDataUrl;
  }

  // 5. Final fallback with FileReader
  return new Promise((resolve) => {
    const reader = new FileReader();
    const timer = setTimeout(() => {
      resolve('');
    }, 4000);

    reader.onload = () => {
      clearTimeout(timer);
      resolve(reader.result || '');
    };
    reader.onerror = () => {
      clearTimeout(timer);
      resolve('');
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Delete an asset from Supabase Storage by its public URL.
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

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
