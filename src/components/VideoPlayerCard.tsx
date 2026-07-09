/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Bookmark, Music, Play, Pause, Volume2, VolumeX, Plus, Check } from 'lucide-react';
import { Video, ScreenId } from '../types';
import { GlassAvatar, GlassButton } from './GlassDesignSystem';
import { CommentsSheet } from './CommentsSheet';
import { ShareSheet } from './ShareSheet';
import { auth, db, toggleLikeVideoInDb, toggleFollowCreatorInDb, toggleSaveVideoInDb, incrementVideoViewsInDb, recordWatchTimeInDb } from '../lib/firebase';
import { logUserActivity } from '../lib/recommendationAlgorithm';
import { doc, getDoc } from 'firebase/firestore';
import { getVideoBlobUrl } from '../lib/videoDb';

interface VideoPlayerCardProps {
  video: Video;
  isActive: boolean;
  onNavigate: (screen: ScreenId, params?: any) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  onRequireAuth?: (callback: () => void) => void;
  onToggleComments?: (isOpen: boolean) => void;
}

export const VideoPlayerCard: React.FC<VideoPlayerCardProps> = ({
  video,
  isActive,
  onNavigate,
  onShowToast,
  onRequireAuth,
  onToggleComments
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(() => {
    const cached = localStorage.getItem('nomis_global_mute');
    return cached !== null ? JSON.parse(cached) : true;
  });
  const [likesCount, setLikesCount] = useState(video.likes);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Synchronize mute state across players when tab or storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const cached = localStorage.getItem('nomis_global_mute');
      if (cached !== null) {
        setIsMuted(JSON.parse(cached));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('nomis_mute_toggle', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('nomis_mute_toggle', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('nomis_global_mute', JSON.stringify(isMuted));
  }, [isMuted]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('nomis_global_mute', JSON.stringify(nextMuted));
    window.dispatchEvent(new Event('nomis_mute_toggle'));
  };

  const [resolvedVideoUrl, setResolvedVideoUrl] = useState(video.url);

  useEffect(() => {
    let active = true;
    let localUrl: string | null = null;

    const checkLocalFile = async () => {
      try {
        const url = await getVideoBlobUrl(video.id);
        if (url && active) {
          localUrl = url;
          setResolvedVideoUrl(url);
        } else {
          if (active) {
            setResolvedVideoUrl(video.url);
          }
        }
      } catch (err) {
        console.warn("Error getting local blob url:", err);
        if (active) {
          setResolvedVideoUrl(video.url);
        }
      }
    };

    checkLocalFile();

    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [video.id, video.url]);

  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [commentsCount, setCommentsCount] = useState(video.commentsCount);
  const [savesCount, setSavesCount] = useState(video.savesCount);
  const [isSaved, setIsSaved] = useState(video.isSaved);
  const [isFollowing, setIsFollowing] = useState(video.creator.isFollowing);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Dynamic creator details for retroactive verification and up-to-date profile photos
  const [creatorVerified, setCreatorVerified] = useState(video.creator.isVerified || false);
  const [creatorAvatar, setCreatorAvatar] = useState(video.creator.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80');
  const [creatorName, setCreatorName] = useState(video.creator.name || 'Nomis User');

  useEffect(() => {
    let active = true;
    const fetchCreatorDetails = async () => {
      try {
        const userDocRef = doc(db, 'users', video.creator.id);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && active) {
          const data = docSnap.data();
          if (data) {
            if (typeof data.isVerified === 'boolean') {
              setCreatorVerified(data.isVerified);
            }
            if (data.avatar) {
              setCreatorAvatar(data.avatar);
            }
            if (data.name) {
              setCreatorName(data.name);
            }
          }
        }
      } catch (err) {
        console.warn("Could not retrieve dynamic creator details:", err);
      }
    };
    fetchCreatorDetails();
    return () => {
      active = false;
    };
  }, [video.creator.id]);
  
  // Scrubber progress states
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  
  // Modals
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Sync comment sheet opening state to parent for scroll locking
  useEffect(() => {
    if (onToggleComments) {
      onToggleComments(showComments);
    }
  }, [showComments, onToggleComments]);
  
  // Animations
  const [showPlayStateFeedback, setShowPlayStateFeedback] = useState<'play' | 'pause' | null>(null);
  const [doubleTapHearts, setDoubleTapHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTapRef = useRef<number>(0);
  const [isVideoWaiting, setIsVideoWaiting] = useState(false);

  // Check dynamic user account likes/saves activities from Firestore on mount
  useEffect(() => {
    if (auth.currentUser) {
      const checkLikesAndSaves = async () => {
        try {
          const likeDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid, 'likes', video.id));
          if (likeDoc.exists()) {
            setIsLiked(likeDoc.data()?.liked ?? false);
          }
          const saveDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid, 'saves', video.id));
          if (saveDoc.exists()) {
            setIsSaved(saveDoc.data()?.saved ?? false);
          }
        } catch (err) {
          console.error("Error checking video interactives state:", err);
        }
      };
      checkLikesAndSaves();
    }
  }, [video.id]);

  // Synchronize internal stats state when parent/db prop changes dynamically
  useEffect(() => {
    setLikesCount(video.likes);
  }, [video.likes]);

  useEffect(() => {
    setCommentsCount(video.commentsCount);
  }, [video.commentsCount]);

  useEffect(() => {
    setSavesCount(video.savesCount);
  }, [video.savesCount]);

  useEffect(() => {
    setIsFollowing(video.creator.isFollowing);
  }, [video.creator.isFollowing]);

  // Record a view in Firestore when video is active (single view per session per video)
  useEffect(() => {
    if (isActive) {
      const sessionKey = `viewed_${video.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        incrementVideoViewsInDb(video.id);
      }
    }
  }, [isActive, video.id]);

  // Real watch time tracking (accumulates actual milliseconds played and logs to DB & recommendation algorithm)
  useEffect(() => {
    if (!isActive || !isPlaying) return;
    
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      // Only log if they actually watched for at least 0.5 seconds
      if (durationSeconds >= 0.5) {
        logUserActivity(video.id, 'watch', video.tags, video.creator.id, durationSeconds);
        recordWatchTimeInDb(video.id, video.creator.id, durationSeconds);
      }
    };
  }, [isActive, isPlaying, video.id, video.tags, video.creator.id]);

  // Reset isPlaying to true when video becomes active to ensure instant autoplay on enter
  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
    }
  }, [isActive]);

  // Play/Pause effect based on active state
  useEffect(() => {
    if (videoRef.current) {
      if (isActive && isPlaying) {
        videoRef.current.play().catch(() => {
          // Auto-play could fail if not interactive, that's fine
        });
      } else {
        videoRef.current.pause();
        // Do NOT reset video position when user pauses. Only reset when they scroll away.
        if (!isActive) {
          try {
            videoRef.current.currentTime = 0;
            setCurrentTime(0);
          } catch (e) {
            // Ignore if video load states aren't fully resolved yet
          }
        }
      }
    }
  }, [isActive, isPlaying]);

  // Handle click to play/pause
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double Tap detected
      handleDoubleTap(e);
    } else {
      // Single Tap - Toggle immediately for instant responsive feel
      togglePlayPause();
    }
    
    lastTapRef.current = now;
  };

  const togglePlayPause = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    setShowPlayStateFeedback(nextState ? 'play' : 'pause');
    setTimeout(() => setShowPlayStateFeedback(null), 600);
  };

  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add heart to animation list
    const newHeart = { id: Date.now(), x, y };
    setDoubleTapHearts((prev) => [...prev, newHeart]);
    
    const action = async () => {
      if (!isLiked) {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        
        // Log activity to recommendation engine
        logUserActivity(video.id, 'like', video.tags, video.creator.id);

        // Sync to DB
        if (auth.currentUser) {
          try {
            await toggleLikeVideoInDb(video.id, auth.currentUser.uid, false);
          } catch (err) {
            console.error(err);
          }
        }
      }
    };

    if (onRequireAuth) {
      onRequireAuth(action);
    } else {
      action();
    }
    
    // Clean up heart animation
    setTimeout(() => {
      setDoubleTapHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);
  };

  const handleLikeClick = () => {
    const action = async () => {
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);
      setLikesCount((prev) => (nextLiked ? prev + 1 : prev - 1));
      
      if (nextLiked) {
        logUserActivity(video.id, 'like', video.tags, video.creator.id);
      }

      // Sync to DB
      if (auth.currentUser) {
        try {
          await toggleLikeVideoInDb(video.id, auth.currentUser.uid, !nextLiked);
        } catch (err) {
          console.error(err);
        }
      }
    };

    if (onRequireAuth) {
      onRequireAuth(action);
    } else {
      action();
    }
  };

  const handleSaveClick = () => {
    const action = async () => {
      const nextSaved = !isSaved;
      setIsSaved(nextSaved);
      setSavesCount((prev) => (nextSaved ? prev + 1 : prev - 1));

      if (nextSaved) {
        logUserActivity(video.id, 'save', video.tags, video.creator.id);
      }

      // Sync to DB
      if (auth.currentUser) {
        try {
          await toggleSaveVideoInDb(video.id, auth.currentUser.uid, !nextSaved);
        } catch (err) {
          console.error("Error saving video:", err);
        }
      }
    };

    if (onRequireAuth) {
      onRequireAuth(action);
    } else {
      action();
    }
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const action = async () => {
      const nextFollow = !isFollowing;
      setIsFollowing(nextFollow);
      
      // Sync to DB
      if (auth.currentUser) {
        try {
          await toggleFollowCreatorInDb(auth.currentUser.uid, video.creator.id, !nextFollow);
        } catch (err) {
          console.error(err);
        }
      }
    };

    if (onRequireAuth) {
      onRequireAuth(action);
    } else {
      action();
    }
  };

  const isImagePost = video.mediaType === 'image';
  const isCarouselPost = video.mediaType === 'carousel';
  const carouselImages = video.images || (video.url ? [video.url] : []);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : carouselImages.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev < carouselImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* HTML5 video element */}
      <video
        ref={videoRef}
        src={resolvedVideoUrl}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isImagePost || isCarouselPost ? 'absolute inset-0 opacity-0 pointer-events-none' : 'block'
        }`}
        loop
        muted={isMuted}
        playsInline
        onClick={handleVideoClick as any}
        onWaiting={() => setIsVideoWaiting(true)}
        onPlaying={() => setIsVideoWaiting(false)}
        onCanPlay={() => setIsVideoWaiting(false)}
        onLoadStart={() => setIsVideoWaiting(true)}
        onTimeUpdate={() => {
          if (videoRef.current && !isScrubbing) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration || 0);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration || 0);
          }
        }}
        onError={(e) => {
          console.warn("Video failed to play, falling back to backup placeholder.");
          setIsVideoWaiting(false);
          if (videoRef.current && videoRef.current.src !== 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skating-on-the-street-40134-large.mp4') {
            videoRef.current.src = 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skating-on-the-street-40134-large.mp4';
            videoRef.current.play().catch(() => {});
          }
        }}
      />

      {/* Image Post Renderer */}
      {isImagePost && (
        <div 
          onClick={handleVideoClick as any}
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-950 cursor-pointer"
        >
          {/* Blurred background for cinematic feel */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-110"
            style={{ backgroundImage: `url(${resolvedVideoUrl})` }}
          />
          <img 
            src={resolvedVideoUrl} 
            className="max-h-full max-w-full object-contain relative z-10" 
            alt={video.title} 
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Carousel Post Renderer */}
      {isCarouselPost && carouselImages.length > 0 && (
        <div 
          onClick={handleVideoClick as any}
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-950 cursor-pointer select-none"
        >
          {/* Blurred background of current image */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-110 transition-all duration-500"
            style={{ backgroundImage: `url(${carouselImages[carouselIndex]})` }}
          />

          {/* Sliding Image View with horizontal native snap scroll */}
          <div className="relative w-full h-full z-10">
            <div 
              className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
              onScroll={(e) => {
                const target = e.currentTarget;
                const index = Math.round(target.scrollLeft / target.clientWidth);
                if (index !== carouselIndex && index >= 0 && index < carouselImages.length) {
                  setCarouselIndex(index);
                }
              }}
            >
              {carouselImages.map((img, i) => (
                <div key={i} className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center bg-black">
                  <img
                    src={img}
                    className="max-h-full max-w-full object-contain"
                    alt={`${video.title} - Slide ${i + 1}`}
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>

            {/* Indicator badge: "1/3" */}
            <div className="absolute top-18 right-4 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              {carouselIndex + 1} / {carouselImages.length}
            </div>

            {/* Dot Indicator list at bottom center of the visual asset */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md">
              {carouselImages.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300
                    ${i === carouselIndex ? 'w-4 bg-white shadow-lg' : 'w-1.5 bg-white/40'}
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overlaid Texts Saved on Video */}
      {video.texts && Array.isArray(video.texts) && video.texts.map((textItem: any) => (
        <div
          key={textItem.id}
          className="absolute z-20 px-3 py-1.5 rounded-xl font-bold text-center pointer-events-none select-none"
          style={{
            left: `${textItem.x}%`,
            top: `${textItem.y}%`,
            color: textItem.color || '#ffffff',
            fontSize: `${textItem.size || 16}px`,
            backgroundColor: textItem.bgStyle === 'solid' ? 'rgba(0, 0, 0, 0.7)' : textItem.bgStyle === 'frosted' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
            backdropFilter: textItem.bgStyle === 'frosted' ? 'blur(8px)' : 'none',
            border: textItem.bgStyle === 'frosted' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            textShadow: textItem.bgStyle === 'none' ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
          }}
        >
          {textItem.text}
        </div>
      ))}

      {/* Overlaid Stickers Saved on Video */}
      {video.stickers && Array.isArray(video.stickers) && video.stickers.map((stickerItem: any) => (
        <div
          key={stickerItem.id}
          className="absolute z-20 pointer-events-none select-none"
          style={{
            left: `${stickerItem.x}%`,
            top: `${stickerItem.y}%`,
            fontSize: `${48 * (stickerItem.scale || 1)}px`,
          }}
        >
          {stickerItem.emoji}
        </div>
      ))}

      {/* TikTok-like Loading Spinner */}
      {isVideoWaiting && !isImagePost && !isCarouselPost && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 border-4 border-white/20 border-t-white/80 rounded-full"
          />
        </div>
      )}

      {/* Double Tap Heart Indicators */}
      <AnimatePresence>
        {doubleTapHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: [1.2, 1], rotate: [-10, 10, 0] }}
            exit={{ opacity: 0, scale: 2, y: -60 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: heart.x - 32,
              top: heart.y - 32,
              pointerEvents: 'none',
              zIndex: 30
            }}
          >
            <Heart className="w-16 h-16 text-[#FF3B30] fill-[#FF3B30] drop-shadow-[0_4px_15px_rgba(255,59,48,0.5)]" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Play / Pause Overlay Flash Feedback */}
      <AnimatePresence>
        {showPlayStateFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.4 }}
            className="absolute z-20 p-5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md pointer-events-none"
          >
            {showPlayStateFeedback === 'play' ? (
              <Play className="w-8 h-8 text-white fill-white" />
            ) : (
              <Pause className="w-8 h-8 text-white fill-white" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons (Right-side column, glassmorphic floating layout) */}
      <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-3.5">
        {/* Creator Avatar */}
        <div className="relative mb-1">
          <div onClick={() => onNavigate('creator-profile', { creatorId: video.creator.id })}>
            <GlassAvatar src={creatorAvatar} name={creatorName} size="sm" ring isVerified={creatorVerified} />
          </div>
        </div>

        {/* Like action */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleLikeClick}
            className={`p-2.5 rounded-full backdrop-blur-xl border border-white/10 shadow-lg transition-all duration-300 cursor-pointer
              ${isLiked ? 'bg-red-500/25 text-[#FF3B30] border-[#FF3B30]/30' : 'bg-white/10 text-white'}
            `}
          >
            <Heart className="w-4.5 h-4.5" fill={isLiked ? 'currentColor' : 'none'} />
          </motion.button>
          <span className="text-[9px] font-bold text-white/90 tracking-wide drop-shadow-md">
            {likesCount}
          </span>
        </div>

        {/* Comments action */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowComments(true)}
            className="p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white shadow-lg cursor-pointer"
          >
            <MessageCircle className="w-4.5 h-4.5" />
          </motion.button>
          <span className="text-[9px] font-bold text-white/90 tracking-wide drop-shadow-md">{commentsCount}</span>
        </div>

        {/* Save/Bookmark action */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleSaveClick}
            className={`p-2.5 rounded-full backdrop-blur-xl border border-white/10 shadow-lg transition-all duration-300 cursor-pointer
              ${isSaved ? 'bg-yellow-500/25 text-yellow-500 border-yellow-500/30' : 'bg-white/10 text-white'}
            `}
          >
            <Bookmark className="w-4.5 h-4.5" fill={isSaved ? 'currentColor' : 'none'} />
          </motion.button>
          <span className="text-[9px] font-bold text-white/90 tracking-wide drop-shadow-md">{savesCount}</span>
        </div>

        {/* Share action */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              if (onRequireAuth) {
                onRequireAuth(() => setShowShare(true));
              } else {
                setShowShare(true);
              }
            }}
            className="p-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white shadow-lg cursor-pointer"
          >
            <Share2 className="w-4.5 h-4.5" />
          </motion.button>
          <span className="text-[9px] font-bold text-white/90 tracking-wide drop-shadow-md">{video.sharesCount}</span>
        </div>

        {/* Spinning Record Icon (Music placeholder) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="w-8 h-8 rounded-full border border-white/20 bg-gradient-to-tr from-black via-zinc-800 to-black flex items-center justify-center shadow-2xl mt-1 overflow-hidden"
        >
          <img src={creatorAvatar} className="w-5 h-5 rounded-full object-cover animate-pulse" alt="" />
        </motion.div>
      </div>

      {/* Visual Creator Metadata Overlay (Bottom overlay with frosted glass accent) */}
      <div className="absolute left-3 right-15 bottom-20 z-20 flex flex-col gap-2">
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsDetailsExpanded(!isDetailsExpanded);
          }}
          className="bg-transparent p-3.5 flex flex-col gap-1.5 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2">
            <span
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('creator-profile', { creatorId: video.creator.id });
              }}
              className="text-xs font-extrabold text-white hover:underline cursor-pointer flex items-center gap-1"
            >
              {creatorName}
              {creatorVerified && (
                <span className="bg-blue-500 text-white text-[7px] px-1 py-0.5 rounded-full">✓</span>
              )}
            </span>
            <span className="text-[10px] text-white/50">@{video.creator.username}</span>
            {(video.mediaType === 'image' || video.mediaType === 'carousel') && (
              <span className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-md text-[9px] text-white font-extrabold border border-white/10" title={video.mediaType === 'carousel' ? 'Carousel post' : 'Image post'}>
                {video.mediaType === 'carousel' ? (
                  <>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>CAROUSEL</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span>IMAGE</span>
                  </>
                )}
              </span>
            )}
            {auth.currentUser?.uid !== video.creator.id && (
              <button
                onClick={handleFollowClick}
                className={`ml-2 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold transition-all duration-300 border cursor-pointer flex items-center justify-center
                  ${isFollowing 
                    ? 'bg-transparent text-white/60 border-white/20' 
                    : 'bg-white text-black border-white hover:scale-105'
                  }
                `}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {!isDetailsExpanded ? (
            /* COLLAPSED STATE */
            <p className="text-xs text-white/95 font-medium leading-relaxed tracking-wide">
              {video.title.length > 55 ? video.title.substring(0, 55) + '...' : video.title}
              {video.tags && video.tags.map((tag) => (
                <span
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('discover', { search: tag });
                  }}
                  className="text-[#FF9F0A] hover:underline ml-1.5 cursor-pointer font-bold inline-block"
                >
                  #{tag}
                </span>
              ))}
            </p>
          ) : (
            /* EXPANDED STATE */
            <>
              <p className="text-xs text-white font-bold leading-relaxed tracking-wide">
                {video.title}
                {video.tags && video.tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('discover', { search: tag });
                    }}
                    className="text-[#FF9F0A] hover:underline ml-1.5 cursor-pointer font-bold inline-block"
                  >
                    #{tag}
                  </span>
                ))}
              </p>
              
              <p className="text-[11px] text-white/85 leading-relaxed font-medium bg-white/5 p-2 rounded-xl border border-white/5">
                {video.description}
              </p>
              
              <div className="text-[8px] font-bold text-white/35 uppercase tracking-wider text-right select-none">
                Tap details again to collapse
              </div>
            </>
          )}

          <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/60 bg-white/5 py-1 px-2 rounded-lg w-max max-w-full truncate mt-0.5">
            <Music className="w-3 h-3 text-white/70 flex-shrink-0 animate-bounce" />
            <span className="truncate">{video.music}</span>
          </div>
        </div>
      </div>



      {/* Overlay Bottom Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 to-transparent pointer-events-none z-10" />

      {/* Sliding Dialog Sheets */}
      <CommentsSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        commentsCount={commentsCount}
        onUpdateCommentsCount={(val) => setCommentsCount(val)}
        videoId={video.id}
        onRequireAuth={onRequireAuth}
      />

      <ShareSheet
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        videoTitle={video.title}
        video={video}
        onNavigate={onNavigate}
        onShowToast={onShowToast}
      />
    </div>
  );
};
