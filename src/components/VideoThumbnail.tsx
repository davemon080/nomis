import React, { useState, useEffect } from 'react';
import { useVideoThumbnail } from '../hooks/useVideoThumbnail';
import { getVideoBlobUrl } from '../lib/videoDb';
import { Film } from 'lucide-react';

interface VideoThumbnailProps {
  videoUrl?: string;
  videoId?: string;
  fallbackUrl?: string;
  className?: string;
  mediaType?: string;
  images?: string[];
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUrl,
  videoId,
  fallbackUrl,
  className = 'w-full h-full object-cover',
  mediaType,
  images
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const { thumbnail, loading: thumbnailLoading } = useVideoThumbnail(videoUrl || '', videoId || '', mediaType, images);
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  // Check local file cache in IndexedDB
  useEffect(() => {
    if (!videoId) return;
    let active = true;
    let localUrl: string | null = null;

    const checkLocalFile = async () => {
      try {
        const url = await getVideoBlobUrl(videoId);
        if (url && active) {
          localUrl = url;
          setResolvedUrl(url);
        }
      } catch (err) {
        console.warn("Error reading video blob url from indexedDb in VideoThumbnail:", err);
      }
    };

    checkLocalFile();

    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [videoId]);

  // Reset loading state on change
  useEffect(() => {
    setImgLoading(true);
    setImgError(false);
  }, [thumbnail, fallbackUrl]);

  const displaySrc = thumbnail || fallbackUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80';

  const isLoading = (videoId && thumbnailLoading) || imgLoading;

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-950 flex items-center justify-center">
      {/* High-fidelity Skeleton Loader */}
      {isLoading && !imgError && (
        <div className="absolute inset-0 bg-neutral-900/60 animate-pulse z-10 flex flex-col items-center justify-center gap-1.5">
          <Film className="w-4 h-4 text-white/20 animate-pulse" />
          <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Rendering</span>
        </div>
      )}

      {/* Actual Image Thumbnail */}
      <img
        src={displaySrc}
        alt="Thumbnail"
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        referrerPolicy="no-referrer"
        onLoad={() => setImgLoading(false)}
        onError={() => {
          setImgError(true);
          setImgLoading(false);
        }}
      />

      {/* Fallback if load fails */}
      {imgError && (
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900 to-black flex items-center justify-center text-white/20">
          <Film className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
