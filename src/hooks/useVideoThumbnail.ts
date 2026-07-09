import { useState, useEffect } from 'react';
import { getCachedThumbnail, generateVideoThumbnail } from '../lib/thumbnailCache';

export function useVideoThumbnail(videoUrl: string, videoId: string, mediaType?: string, images?: string[]) {
  const isImageOrCarousel = mediaType === 'image' || mediaType === 'carousel' || (images && images.length > 0);

  const [thumbnail, setThumbnail] = useState<string | null>(() => {
    if (isImageOrCarousel && images && images.length > 0) {
      return images[0];
    }
    if (isImageOrCarousel && videoUrl) {
      return videoUrl;
    }
    return getCachedThumbnail(videoId) || getCachedThumbnail(videoUrl);
  });

  const [loading, setLoading] = useState(() => {
    if (isImageOrCarousel) return false;
    return !thumbnail;
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isImageOrCarousel) {
      setThumbnail(images && images.length > 0 ? images[0] : videoUrl);
      setLoading(false);
      return;
    }

    // If we already have a value, don't trigger regeneration
    const cached = getCachedThumbnail(videoId) || getCachedThumbnail(videoUrl);
    if (cached) {
      setThumbnail(cached);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    generateVideoThumbnail(videoUrl, videoId)
      .then((base64) => {
        if (active) {
          setThumbnail(base64);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [videoUrl, videoId, mediaType, images, isImageOrCarousel]);

  return { thumbnail, loading, error };
}
