// Memory cache for rapid access during a single session
const memoryCache: Record<string, string> = {};

// Cache prefix for localStorage
const LOCAL_STORAGE_PREFIX = 'nomis_thumb_';

/**
 * Attempts to retrieve a thumbnail from cache (memory or localStorage)
 */
export function getCachedThumbnail(videoId: string): string | null {
  if (memoryCache[videoId]) {
    return memoryCache[videoId];
  }
  try {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${videoId}`);
    if (cached) {
      memoryCache[videoId] = cached;
      return cached;
    }
  } catch (e) {
    console.warn("Error reading from localStorage cache:", e);
  }
  return null;
}

/**
 * Saves a thumbnail to cache
 */
export function setCachedThumbnail(videoId: string, base64Data: string) {
  memoryCache[videoId] = base64Data;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${videoId}`, base64Data);
  } catch (e) {
    console.warn("Storage full, clearing old thumbnails...");
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      // Retry
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${videoId}`, base64Data);
    } catch (retryErr) {
      console.error("Failed to write to localStorage even after clearing:", retryErr);
    }
  }
}

/**
 * Generates a thumbnail from a video URL using canvas
 */
export function generateVideoThumbnail(videoUrl: string, videoId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check cache first
    const cached = getCachedThumbnail(videoId);
    if (cached) {
      resolve(cached);
      return;
    }

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    // Set style to hidden so it doesn't render in the DOM
    video.style.display = 'none';
    video.style.position = 'absolute';
    video.style.width = '0';
    video.style.height = '0';
    video.style.opacity = '0';

    document.body.appendChild(video);

    const cleanup = () => {
      try {
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      } catch (e) {
        // Ignore
      }
    };

    // Timeout safety (faster timeout so user doesn't wait forever if CORS fails)
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Thumbnail generation timed out'));
    }, 4000);

    video.onloadeddata = () => {
      // Seek to 0.5s to get a good frame
      video.currentTime = 0.5;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        // Compact thumbnail dimension to keep cache memory size very low
        canvas.width = 180;
        canvas.height = 180;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const videoWidth = video.videoWidth || 360;
          const videoHeight = video.videoHeight || 360;
          const size = Math.min(videoWidth, videoHeight);
          const sx = (videoWidth - size) / 2;
          const sy = (videoHeight - size) / 2;

          ctx.drawImage(
            video,
            sx,
            sy,
            size,
            size, // Source dimensions (centered square crop)
            0,
            0,
            180,
            180 // Destination dimensions
          );

          // Use low-quality JPEG compression (e.g., 0.4) for extremely lightweight thumbnails
          const base64 = canvas.toDataURL('image/jpeg', 0.4);
          setCachedThumbnail(videoId, base64);
          clearTimeout(timeoutId);
          cleanup();
          resolve(base64);
        } else {
          clearTimeout(timeoutId);
          cleanup();
          reject(new Error('Canvas context failed'));
        }
      } catch (err) {
        clearTimeout(timeoutId);
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      cleanup();
      reject(new Error('Video load failed'));
    };
  });
}
