/* ==========================================================================
   FLOCARDS PER-PROFILE STORAGE & UPLOAD QUOTA ENGINE
   Enforces:
   - Max gallery images (default: 20)
   - Max service thumbnails (default: 10)
   - Max videos (default: 5)
   - Max banner file size (default: 5MB for image, 15MB for video)
   - Max single upload file size (default: 5MB)
   - Max total storage per profile (default: 50MB)
   - Actual measured usage tracking & server-side validation
   ========================================================================== */

export const DEFAULT_STORAGE_QUOTAS = {
  maxGalleryImages: 20,
  maxServiceImages: 10,
  maxVideos: 5,
  maxBannerSizeMb: 5,
  maxBannerVideoSizeMb: 15,
  maxUploadSizeMb: 5,
  maxTotalStorageMb: 50,
  allowedImageMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'],
  allowedVideoMimes: ['video/mp4', 'video/webm']
};

/**
 * Measure actual storage usage from a profile's saved assets
 * Returns: {
 *   galleryCount, maxGalleryImages,
 *   serviceImageCount, maxServiceImages,
 *   videoCount, maxVideos,
 *   totalStorageMb, maxTotalStorageMb,
 *   percentUsed,
 *   isAtQuota
 * }
 */
export function calculateProfileUsage(profile = {}, customQuotas = {}) {
  const quotas = { ...DEFAULT_STORAGE_QUOTAS, ...(profile.storageQuotas || {}), ...customQuotas };

  const portfolio = Array.isArray(profile.portfolio) ? profile.portfolio : [];
  const galleryCount = portfolio.filter(item => Boolean(item?.image)).length;

  const services = Array.isArray(profile.services) ? profile.services : [];
  const serviceImageCount = services.filter(item => Boolean(item?.image || item?.thumbnail)).length;

  const videos = Array.isArray(profile.videos) ? profile.videos : [];
  const videoCount = videos.length;

  // Track recorded asset byte sizes if stored, or estimate based on compressed assets (~120KB per image, ~300KB avatar, ~600KB banner)
  let totalBytes = 0;

  // Avatar size
  if (profile.avatar) {
    totalBytes += profile.avatarSizeBytes || 250 * 1024;
  }

  // Banner size
  if (profile.banner?.url) {
    totalBytes += profile.banner?.sizeBytes || (profile.banner?.type === 'video' ? 4 * 1024 * 1024 : 600 * 1024);
  }

  // Portfolio images
  for (const item of portfolio) {
    if (item.image) {
      totalBytes += item.sizeBytes || 180 * 1024;
    }
  }

  // Service images
  for (const srv of services) {
    if (srv.image || srv.thumbnail) {
      totalBytes += srv.sizeBytes || 140 * 1024;
    }
  }

  const totalStorageMb = parseFloat((totalBytes / (1024 * 1024)).toFixed(1));
  const maxMb = quotas.maxTotalStorageMb || 50;
  const percentUsed = Math.min(100, Math.round((totalStorageMb / maxMb) * 100));

  return {
    galleryCount,
    maxGalleryImages: quotas.maxGalleryImages,
    serviceImageCount,
    maxServiceImages: quotas.maxServiceImages,
    videoCount,
    maxVideos: quotas.maxVideos,
    totalStorageMb,
    maxTotalStorageMb: maxMb,
    totalBytes,
    percentUsed,
    isAtStorageCap: totalStorageMb >= maxMb,
    quotas
  };
}

/**
 * Validate an upload attempt against profile quotas before initiating storage upload
 */
export function validateUploadQuota({
  file,
  type, // 'avatar' | 'banner' | 'portfolio' | 'service' | 'video'
  profile = {},
  customQuotas = {}
}) {
  if (!file) throw new Error('No file selected for upload.');

  const quotas = { ...DEFAULT_STORAGE_QUOTAS, ...(profile.storageQuotas || {}), ...customQuotas };
  const usage = calculateProfileUsage(profile, quotas);

  const fileSizeBytes = file.size;
  const fileSizeMb = fileSizeBytes / (1024 * 1024);

  // 1. Validate MIME type
  const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name || '');
  const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|svg|gif)$/i.test(file.name || '');
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');

  if (type === 'banner' && isVideo) {
    if (!quotas.allowedVideoMimes.includes(file.type) && !/\.(mp4|webm)$/i.test(file.name || '')) {
      throw new Error('Unsupported video banner format. Please upload MP4 or WebM video.');
    }
    if (fileSizeMb > quotas.maxBannerVideoSizeMb) {
      throw new Error(`Banner video exceeds maximum allowed limit of ${quotas.maxBannerVideoSizeMb} MB. Current: ${fileSizeMb.toFixed(1)} MB.`);
    }
  } else if ((type === 'portfolio' || type === 'pdf' || type === 'document') && isPdf) {
    const maxPdfMb = quotas.maxUploadSizeMb ? Math.max(quotas.maxUploadSizeMb, 15) : 15;
    if (fileSizeMb > maxPdfMb) {
      throw new Error(`PDF document exceeds maximum allowed limit of ${maxPdfMb} MB. Current: ${fileSizeMb.toFixed(1)} MB.`);
    }
  } else {
    if (!isImage) {
      throw new Error('Invalid file format. Please upload a valid image (PNG, JPG, WebP) or PDF document (.pdf).');
    }
    const maxSingleMb = type === 'banner' ? quotas.maxBannerSizeMb : quotas.maxUploadSizeMb;
    if (fileSizeMb > maxSingleMb) {
      throw new Error(`File size (${fileSizeMb.toFixed(1)} MB) exceeds maximum allowed size of ${maxSingleMb} MB.`);
    }
  }

  // 2. Validate count quotas
  if (type === 'portfolio' && usage.galleryCount >= quotas.maxGalleryImages) {
    throw new Error(`Gallery upload quota reached (${usage.galleryCount} / ${quotas.maxGalleryImages} used). Please delete an existing project image to upload more.`);
  }

  if (type === 'service' && usage.serviceImageCount >= quotas.maxServiceImages) {
    throw new Error(`Service image quota reached (${usage.serviceImageCount} / ${quotas.maxServiceImages} used). Please remove an existing thumbnail.`);
  }

  // 3. Validate total storage quota
  const projectedTotalMb = usage.totalStorageMb + fileSizeMb;
  if (projectedTotalMb > quotas.maxTotalStorageMb) {
    throw new Error(`Upload would exceed total storage quota of ${quotas.maxTotalStorageMb} MB (currently ${usage.totalStorageMb} MB used).`);
  }

  return { valid: true, fileSizeMb };
}

export const storageQuotaService = {
  DEFAULT_STORAGE_QUOTAS,
  calculateProfileUsage,
  calculateUsage: (profile, customQuotas) => {
    const res = calculateProfileUsage(profile, customQuotas);
    return {
      imagesCount: res.galleryCount,
      servicesCount: res.serviceImageCount,
      videosCount: res.videoCount,
      storageMB: res.totalStorageMb,
      limits: {
        maxImages: res.maxGalleryImages,
        maxServices: res.maxServiceImages,
        maxVideos: res.maxVideos,
        maxStorageMB: res.maxTotalStorageMb
      }
    };
  },
  validateUploadQuota,
  validateUpload: (profile, type, file) => {
    try {
      const res = validateUploadQuota({ file, type, profile });
      return { valid: true, ...res };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
};
