/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Grid, 
  Heart, 
  Bookmark, 
  Edit3, 
  Settings, 
  LogOut, 
  ArrowLeft, 
  Check, 
  Camera, 
  Link2, 
  Key,
  Shield,
  Chrome,
  Sparkles,
  Award,
  Play,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Creator, Video, ScreenId } from '../types';
import { mockCreators, mockVideos } from '../data/mockData';
import { GlassCard, GlassAvatar, GlassButton, GlassInput, GlassTabBar } from '../components/GlassDesignSystem';
import { auth, db, signInWithGoogle, logOut, deleteVideoFromDb, toggleFollowCreatorInDb } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { getVideoBlobUrl } from '../lib/videoDb';
import { useVideoThumbnail } from '../hooks/useVideoThumbnail';

interface ProfileViewProps {
  onNavigate: (screen: ScreenId, params?: any) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  creatorId?: string; // If provided, viewing another creator. If not, viewing self.
  isEditView?: boolean;
  videosList?: Video[];
  uploadingVideos?: Array<{
    id: string;
    url: string;
    title: string;
    progress: number;
  }>;
}

interface UploadingVideoCardProps {
  upload: {
    id: string;
    url: string;
    title: string;
    progress: number;
  };
}

const UploadingVideoCard: React.FC<UploadingVideoCardProps> = ({ upload }) => {
  return (
    <div className="relative aspect-square rounded-none overflow-hidden border-2 border-dashed border-[#FF9F0A]/30 bg-[linear-gradient(rgba(255,159,10,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,159,10,0.03)_1px,transparent_1px)] bg-[size:12px_12px] bg-neutral-950 flex flex-col items-center justify-center p-3 animate-pulse">
      {/* Visual background placeholder video at extremely low opacity */}
      <video
        src={upload.url}
        muted
        loop
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
      />
      
      {/* Uploading Progress Overlay */}
      <div className="flex flex-col items-center justify-center text-center z-10 w-full px-2">
        <div className="relative mb-2">
          {/* Pulsing glow under spinner */}
          <div className="absolute inset-0 bg-[#FF9F0A]/10 blur-md rounded-full" />
          <RefreshCw className="w-5 h-5 text-[#FF9F0A] animate-spin relative z-10" />
        </div>
        
        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Processing Pipe</span>
        <span className="text-sm font-black text-[#FF9F0A] tracking-wider drop-shadow-[0_0_8px_rgba(255,159,10,0.5)] mt-0.5">{Math.round(upload.progress)}%</span>
        
        {/* Progress Bar Container */}
        <div className="w-4/5 h-1 bg-white/5 rounded-full mt-2.5 overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-[#FF9F0A] to-[#FFB020] transition-all duration-300" 
            style={{ width: `${upload.progress}%` }}
          />
        </div>
        <span className="text-[7px] font-mono text-white/30 uppercase mt-1.5 tracking-wider">syncing to firestore</span>
      </div>
      
      {/* Footer Title formatted like a telemetry line */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 truncate pointer-events-none text-center">
        <p className="text-[7px] font-mono text-white/40 truncate">SYS_UP: {upload.title}</p>
      </div>
    </div>
  );
};

interface VideoGridCardProps {
  video: Video;
  isOwnProfile: boolean;
  onNavigate: (screen: ScreenId, params?: any) => void;
  onDeleteVideo: (videoId: string, e: React.MouseEvent) => void;
}

const VideoGridCard: React.FC<VideoGridCardProps> = ({ video, isOwnProfile, onNavigate, onDeleteVideo }) => {
  const [resolvedUrl, setResolvedUrl] = useState(video.url);
  const [isHovered, setIsHovered] = useState(false);
  const { thumbnail, loading: thumbnailLoading } = useVideoThumbnail(video.url, video.id, video.mediaType, video.images);

  useEffect(() => {
    let active = true;
    let localUrl: string | null = null;

    const checkLocalFile = async () => {
      try {
        const url = await getVideoBlobUrl(video.id);
        if (url && active) {
          localUrl = url;
          setResolvedUrl(url);
        } else {
          if (active) {
            setResolvedUrl(video.url);
          }
        }
      } catch (err) {
        if (active) {
          setResolvedUrl(video.url);
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

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onNavigate('home', { activeVideoId: video.id, creatorIdFilter: video.creator.id })}
      className="relative aspect-[3/4] rounded-none overflow-hidden border border-white/5 bg-neutral-950 group cursor-pointer"
    >
      {/* High-fidelity video element playing on hover */}
      {isHovered && (
        <video
          src={resolvedUrl}
          muted
          loop
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ filter: 'brightness(0.95)' }}
          onError={(e) => {
            const target = e.currentTarget as HTMLVideoElement;
            if (target && target.src !== 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skating-on-the-street-40134-large.mp4') {
              target.src = 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-skating-on-the-street-40134-large.mp4';
            }
          }}
        />
      )}

      {/* Static visual thumbnail to avoid parallel video downloads and improve load times */}
      <AnimatePresence>
        {(!isHovered || thumbnailLoading) && (
          <motion.img
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            src={thumbnail || video.creator?.avatar || video.creator?.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80'}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-500 group-hover:scale-105"
            style={{ filter: 'brightness(0.8)' }}
          />
        )}
      </AnimatePresence>

      {/* Views count badge (always visible, glassmorphic layout) */}
      <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center gap-1 text-white text-[9px] font-bold">
        <Eye className="w-2.5 h-2.5 text-white/80" />
        <span>{(video.views || 0).toLocaleString()}</span>
      </div>

      {/* Stats Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2.2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between">
        <p className="text-[10px] font-black text-white/90 truncate max-w-[65%]">{video.title}</p>
        <div className="flex items-center gap-0.5 text-red-400 font-extrabold text-[9px]">
          <Heart className="w-3 h-3 fill-red-400" />
          <span>{video.likes}</span>
        </div>
      </div>
    </motion.div>
  );
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  onNavigate,
  onShowToast,
  creatorId,
  isEditView = false,
  videosList,
  uploadingVideos
}) => {
  // Determine if viewing own profile
  const isOwnProfile = !creatorId;

  // Firebase auth user state
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(() => auth.currentUser);

  const guestCreator: Creator = {
    id: 'guest',
    name: '',
    username: '',
    avatar: '',
    coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
    bio: '',
    followersCount: '0',
    followingCount: '0',
    totalLikes: '0',
    isFollowing: false,
    isVerified: false
  };

  const defaultCreator: Creator = {
    id: fbUser?.uid || creatorId || 'guest',
    name: fbUser?.displayName || 'Nomis Creator',
    username: fbUser?.email ? fbUser.email.split('@')[0] : 'user',
    avatar: fbUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
    coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
    bio: 'Freshly joined the Nomis visual revolution! ⚡',
    followersCount: '0',
    followingCount: '0',
    totalLikes: '0',
    isFollowing: false,
    isVerified: false
  };

  // Creator state - Loaded synchronously from localStorage or current user session for instant render
  const [creator, setCreator] = useState<Creator | null>(() => {
    if (isOwnProfile) {
      const currentAuthUser = auth.currentUser;
      if (currentAuthUser) {
        const cached = localStorage.getItem(`profile_${currentAuthUser.uid}`);
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            // Ignore
          }
        }
        return {
          id: currentAuthUser.uid,
          name: currentAuthUser.displayName || 'Nomis Creator',
          username: currentAuthUser.email ? currentAuthUser.email.split('@')[0] : 'user',
          avatar: currentAuthUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
          coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
          bio: 'Freshly joined the Nomis visual revolution! ⚡',
          followersCount: '0',
          followingCount: '0',
          totalLikes: '0',
          isFollowing: false,
          isVerified: false
        };
      }
      return guestCreator;
    } else if (creatorId) {
      const found = mockCreators.find((c) => c.id === creatorId);
      return found || null;
    }
    return null;
  });

  const [profileLoading, setProfileLoading] = useState(() => {
    if (isOwnProfile) {
      const currentAuthUser = auth.currentUser;
      if (currentAuthUser) {
        // If we have cache, don't show loading screen! Render immediately!
        return !localStorage.getItem(`profile_${currentAuthUser.uid}`);
      }
      return false;
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<'Videos' | 'Liked' | 'Saved'>('Videos');
  const [isEditing, setIsEditing] = useState(isEditView);
  
  // Likes and saves tracking
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>([]);
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([]);
  
  // Edit Profile fields
  const [editName, setEditName] = useState(() => creator?.name || '');
  const [editBio, setEditBio] = useState(() => creator?.bio || '');
  const [editAvatar, setEditAvatar] = useState(() => creator?.avatar || '');
  const [editWebsite, setEditWebsite] = useState('https://nomis.design/elena');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayCreator = creator || defaultCreator;

  const [liveFollowersCount, setLiveFollowersCount] = useState<number>(0);
  const [liveFollowingCount, setLiveFollowingCount] = useState<number>(0);
  const [liveIsFollowing, setLiveIsFollowing] = useState<boolean>(false);

  // Hook to monitor dynamic followers/following and follow status
  useEffect(() => {
    if (!displayCreator.id || displayCreator.id === 'guest') return;

    // Listen to followers count
    const followersRef = collection(db, 'users', displayCreator.id, 'followers');
    const unsubscribeFollowers = onSnapshot(followersRef, (snapshot) => {
      let count = 0;
      snapshot.forEach((docSnap) => {
        if (docSnap.data().active !== false) {
          count++;
        }
      });
      setLiveFollowersCount(count);
    }, (err) => {
      console.warn("Error listening to followers:", err);
    });

    // Listen to following count
    const followingRef = collection(db, 'users', displayCreator.id, 'following');
    const unsubscribeFollowing = onSnapshot(followingRef, (snapshot) => {
      let count = 0;
      snapshot.forEach((docSnap) => {
        if (docSnap.data().active !== false) {
          count++;
        }
      });
      setLiveFollowingCount(count);
    }, (err) => {
      console.warn("Error listening to following:", err);
    });

    // Listen to whether current user is following displayCreator
    let unsubscribeIsFollowing = () => {};
    if (fbUser && fbUser.uid !== displayCreator.id) {
      const followDocRef = doc(db, 'users', fbUser.uid, 'following', displayCreator.id);
      unsubscribeIsFollowing = onSnapshot(followDocRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().active !== false) {
          setLiveIsFollowing(true);
        } else {
          setLiveIsFollowing(false);
        }
      }, (err) => {
        console.warn("Error listening to follow relationship:", err);
      });
    } else {
      setLiveIsFollowing(false);
    }

    return () => {
      unsubscribeFollowers();
      unsubscribeFollowing();
      unsubscribeIsFollowing();
    };
  }, [displayCreator.id, fbUser?.uid]);

  // Track Auth State changes & background sync with database (no block screen)
  useEffect(() => {
    let unsubscribeUserSnapshot: (() => void) | null = null;
    let unsubscribeCreatorSnapshot: (() => void) | null = null;

    const hasCreatorChanged = (a: Creator | null, b: Creator | null) => {
      if (!a || !b) return true;
      return (
        a.id !== b.id ||
        a.name !== b.name ||
        a.username !== b.username ||
        a.avatar !== b.avatar ||
        a.coverPhoto !== b.coverPhoto ||
        a.bio !== b.bio ||
        a.followersCount !== b.followersCount ||
        a.followingCount !== b.followingCount ||
        a.totalLikes !== b.totalLikes ||
        a.isFollowing !== b.isFollowing ||
        a.isVerified !== b.isVerified ||
        a.isMonetized !== b.isMonetized
      );
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);

      // Clean up previous listeners
      if (unsubscribeUserSnapshot) {
        unsubscribeUserSnapshot();
        unsubscribeUserSnapshot = null;
      }
      if (unsubscribeCreatorSnapshot) {
        unsubscribeCreatorSnapshot();
        unsubscribeCreatorSnapshot = null;
      }

      if (user && isOwnProfile) {
        const hasCache = !!localStorage.getItem(`profile_${user.uid}`);
        if (!hasCache) {
          setProfileLoading(true);
        }

        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeUserSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const loadedCreator: Creator = {
              id: user.uid,
              name: data.name || user.displayName || 'Nomis Creator',
              username: data.username || 'user',
              avatar: data.avatar || user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
              coverPhoto: data.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
              bio: data.bio || 'Freshly joined the Nomis visual revolution! ⚡',
              followersCount: data.followersCount || '0',
              followingCount: data.followingCount || '0',
              totalLikes: data.totalLikes || '0',
              isFollowing: false,
              isVerified: data.isVerified || false,
              isMonetized: data.isMonetized || false
            };
            setCreator((prev) => {
              if (prev && !hasCreatorChanged(prev, loadedCreator)) return prev;
              return loadedCreator;
            });
            setEditName(loadedCreator.name);
            setEditBio(loadedCreator.bio);
            setEditAvatar(loadedCreator.avatar);
            localStorage.setItem(`profile_${user.uid}`, JSON.stringify(loadedCreator));
          } else {
            // Check offline cache if document is missing or not synced yet
            const cachedCreatorStr = localStorage.getItem(`profile_${user.uid}`);
            if (cachedCreatorStr) {
              try {
                const loadedCreator = JSON.parse(cachedCreatorStr);
                setCreator((prev) => {
                  if (prev && !hasCreatorChanged(prev, loadedCreator)) return prev;
                  return loadedCreator;
                });
                setEditName(loadedCreator.name);
                setEditBio(loadedCreator.bio);
                setEditAvatar(loadedCreator.avatar);
              } catch (e) {
                // Ignore
              }
            } else {
              // Setup robust offline profile from fb auth details
              const fallbackCreator: Creator = {
                id: user.uid,
                name: user.displayName || 'Nomis Creator',
                username: user.email ? user.email.split('@')[0] : 'user',
                avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
                coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
                bio: 'Exploring the Nomis visual revolution offline! ⚡',
                followersCount: '0',
                followingCount: '0',
                totalLikes: '0',
                isFollowing: false,
                isVerified: false,
                isMonetized: false
              };
              setCreator((prev) => {
                if (prev && !hasCreatorChanged(prev, fallbackCreator)) return prev;
                return fallbackCreator;
              });
              setEditName(fallbackCreator.name);
              setEditBio(fallbackCreator.bio);
              setEditAvatar(fallbackCreator.avatar);
            }
          }
          setProfileLoading(false);
        }, (err) => {
          console.warn("Firestore profile sync error, falling back to local:", err);
          setProfileLoading(false);
        });

      } else if (!isOwnProfile && creatorId) {
        // Viewing someone else's profile
        setProfileLoading(true);
        const creatorDocRef = doc(db, 'users', creatorId);
        unsubscribeCreatorSnapshot = onSnapshot(creatorDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const loadedCreator: Creator = {
              id: creatorId,
              name: data.name || 'Nomis Creator',
              username: data.username || 'user',
              avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
              coverPhoto: data.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
              bio: data.bio || 'Freshly joined the Nomis visual revolution! ⚡',
              followersCount: data.followersCount || '0',
              followingCount: data.followingCount || '0',
              totalLikes: data.totalLikes || '0',
              isFollowing: data.isFollowing || false,
              isVerified: data.isVerified || false,
              isMonetized: data.isMonetized || false
            };
            setCreator((prev) => {
              if (prev && !hasCreatorChanged(prev, loadedCreator)) return prev;
              return loadedCreator;
            });
            setEditName(loadedCreator.name);
            setEditBio(loadedCreator.bio);
            setEditAvatar(loadedCreator.avatar);
          } else {
            const found = mockCreators.find((c) => c.id === creatorId) || mockCreators[0];
            setCreator((prev) => {
              if (prev && !hasCreatorChanged(prev, found)) return prev;
              return found;
            });
            setEditName(found.name);
            setEditBio(found.bio);
            setEditAvatar(found.avatar);
          }
          setProfileLoading(false);
        }, (err) => {
          console.warn("Firestore creator profile snapshot error:", err);
          const found = mockCreators.find((c) => c.id === creatorId) || mockCreators[0];
          setCreator((prev) => {
            if (prev && !hasCreatorChanged(prev, found)) return prev;
            return found;
          });
          setProfileLoading(false);
        });
      } else {
        if (isOwnProfile) {
          setCreator(guestCreator);
        } else {
          setCreator(null);
        }
        setProfileLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserSnapshot) unsubscribeUserSnapshot();
      if (unsubscribeCreatorSnapshot) unsubscribeCreatorSnapshot();
    };
  }, [creatorId, isOwnProfile]);

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        onShowToast('Signed in successfully with Google!', 'success');
        let isOnboarded = false;
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          isOnboarded = docSnap.exists() && !!docSnap.data()?.isOnboarded;
        } catch (e) {
          console.warn("Offline sign in check:", e);
          isOnboarded = localStorage.getItem(`onboarded_${user.uid}`) === 'true';
        }

        if (!isOnboarded) {
          onNavigate('user-onboarding');
        } else {
          localStorage.setItem(`onboarded_${user.uid}`, 'true');
          onNavigate('profile'); // Land on profile after login!
        }
      }
    } catch (err) {
      console.error(err);
      onShowToast('Authentication failed. Please retry.', 'error');
    }
  };

  // Fetch dynamic user likes and saves from Firestore in real-time when user signs in
  useEffect(() => {
    if (!fbUser || !isOwnProfile) {
      setLikedVideoIds([]);
      setSavedVideoIds([]);
      return;
    }

    // Real-time Likes listener
    const likesColRef = collection(db, 'users', fbUser.uid, 'likes');
    const unsubscribeLikes = onSnapshot(likesColRef, (snapshot) => {
      const likedIds: string[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.data()?.liked !== false) {
          likedIds.push(docSnap.id);
        }
      });
      // Skip updates if lists of likes are identical to prevent rendering sweeps
      setLikedVideoIds((prev) => {
        if (prev.length === likedIds.length && prev.every((id, idx) => id === likedIds[idx])) {
          return prev;
        }
        return likedIds;
      });
    }, (error) => {
      console.warn("Real-time likes listen failed:", error);
    });

    // Real-time Saves listener
    const savesColRef = collection(db, 'users', fbUser.uid, 'saves');
    const unsubscribeSaves = onSnapshot(savesColRef, (snapshot) => {
      const savedIds: string[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.data()?.saved !== false) {
          savedIds.push(docSnap.id);
        }
      });
      // Skip updates if lists of saves are identical to prevent rendering sweeps
      setSavedVideoIds((prev) => {
        if (prev.length === savedIds.length && prev.every((id, idx) => id === savedIds[idx])) {
          return prev;
        }
        return savedIds;
      });
    }, (error) => {
      console.warn("Real-time saves listen failed:", error);
    });

    return () => {
      unsubscribeLikes();
      unsubscribeSaves();
    };
  }, [fbUser, isOwnProfile]);

  // Handle Log Out
  const handleSignOut = async () => {
    try {
      await logOut();
      onShowToast('Logged out of Nomis safely.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Base videos list from prop or fallback mock data
  const baseVideos = videosList && videosList.length > 0 ? videosList : mockVideos;

  // Helper to sort videos with newest first (based on createdAt timestamp or fallback ID order)
  const sortVideosNewestFirst = (vList: Video[]) => {
    return [...vList].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA; // Newest first
      }
      return b.id.localeCompare(a.id);
    });
  };

  // Filter and sort videos for the creator dynamically (Newest videos appear from top, old videos go down)
  const uploadedVideos = sortVideosNewestFirst(
    baseVideos.filter((v) => {
      return v.creator.id === displayCreator.id;
    })
  );

  // Dynamically compute the total likes across all creator's visual uploads
  const computedTotalLikes = uploadedVideos.reduce((sum, v) => sum + (v.likes || 0), 0);

  const likedVideos = sortVideosNewestFirst(
    baseVideos.filter((v) => {
      if (isOwnProfile && fbUser) {
        return likedVideoIds.includes(v.id);
      }
      return v.isLiked;
    })
  );

  const savedVideos = sortVideosNewestFirst(
    baseVideos.filter((v) => {
      if (isOwnProfile && fbUser) {
        return savedVideoIds.includes(v.id);
      }
      return v.isSaved;
    })
  );

  const handleFollowToggle = async () => {
    if (!fbUser) {
      onShowToast('Please authenticate to follow creators.', 'info');
      return;
    }
    const nextFollow = !liveIsFollowing;
    try {
      await toggleFollowCreatorInDb(fbUser.uid, displayCreator.id, !nextFollow);
      onShowToast(nextFollow ? `Following @${displayCreator.username}` : `Unfollowed @${displayCreator.username}`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to update follow status.', 'error');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('Avatar file size must be under 5MB.', 'error');
      return;
    }

    setUploadingAvatar(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('X-File-Extension', file.name.split('.').pop() || 'png');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.url) {
            setEditAvatar(result.url);
            onShowToast('Avatar uploaded successfully! Submit form to save changes.', 'success');
          } else {
            onShowToast('Failed to upload profile image.', 'error');
          }
        } catch (e) {
          onShowToast('Failed to parse upload response.', 'error');
        }
      } else {
        onShowToast('Failed to upload profile image.', 'error');
      }
      setUploadingAvatar(false);
      setUploadProgress(0);
    };

    xhr.onerror = () => {
      onShowToast('Failed to upload profile image due to connection error.', 'error');
      setUploadingAvatar(false);
      setUploadProgress(0);
    };

    xhr.send(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator || !fbUser) return;

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const newAvatarUrl = editAvatar || creator.avatar;
      const updatedCreator = {
        ...creator,
        name: editName,
        bio: editBio,
        avatar: newAvatarUrl
      };

      await setDoc(userDocRef, {
        name: editName,
        bio: editBio,
        avatar: newAvatarUrl
      }, { merge: true });

      // Update all videos posted by this user in Firestore to use the new avatar/name
      try {
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, where('creator.id', '==', fbUser.uid));
        const videosSnap = await getDocs(q);
        
        const updatePromises = videosSnap.docs.map((docSnap) => {
          const videoData = docSnap.data();
          const updatedCreatorInfo = {
            ...videoData.creator,
            name: editName,
            avatar: newAvatarUrl
          };
          return updateDoc(doc(db, 'videos', docSnap.id), {
            creator: updatedCreatorInfo
          });
        });
        
        await Promise.all(updatePromises);
      } catch (videoUpdateErr) {
        console.warn("Failed to update videos with new profile info:", videoUpdateErr);
      }

      setCreator(updatedCreator);
      setIsEditing(false);
      localStorage.setItem(`profile_${fbUser.uid}`, JSON.stringify(updatedCreator));
      onShowToast('Nomis Creator Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to save profile details.', 'error');
    }
  };

  const handleDeleteVideo = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to play the video
    const confirmDelete = window.confirm("Are you sure you want to delete this visual work from your Nomis profile?");
    if (!confirmDelete) return;

    try {
      await deleteVideoFromDb(videoId);
      onShowToast('Video deleted successfully!', 'success');
    } catch (err) {
      console.error("Failed to delete video:", err);
      onShowToast('Failed to delete video from database.', 'error');
    }
  };

  const renderVideosGrid = (videos: Video[], emptyMsg: string, showUploading: boolean = false) => {
    if (profileLoading) {
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square bg-neutral-900/50 rounded-none border border-white/5 animate-pulse"
            />
          ))}
        </div>
      );
    }

    const uploadsCount = showUploading && uploadingVideos ? uploadingVideos.length : 0;

    if (videos.length === 0 && uploadsCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-white/40">
          <Grid className="w-8 h-8 mb-2 animate-pulse" />
          <p className="text-xs font-semibold tracking-wider uppercase">No Videos Available</p>
          <p className="text-[10px] text-white/30 max-w-xs mt-1">{emptyMsg}</p>
        </div>
      );
    }

    // Deduplicate videos and filter out those currently shown as active uploading cards to avoid duplicate keys
    const uploadingIds = new Set((showUploading && uploadingVideos) ? uploadingVideos.map(u => u.id) : []);
    const uniqueVideos: Video[] = Array.from(new Map<string, Video>(videos.map(v => [v.id, v])).values())
      .filter(v => !uploadingIds.has(v.id));

    return (
      <div className="grid grid-cols-3 gap-1.5">
        {showUploading && uploadingVideos && uploadingVideos.map((upload) => (
          <UploadingVideoCard key={`upload-${upload.id}`} upload={upload} />
        ))}
        {uniqueVideos.map((video) => (
          <VideoGridCard
            key={video.id}
            video={video}
            isOwnProfile={isOwnProfile && activeTab === 'Videos'}
            onNavigate={onNavigate}
            onDeleteVideo={handleDeleteVideo}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black overflow-y-auto custom-scrollbar select-none pb-24">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          /* Profile presentation mode */
          <motion.div
            key="profile-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            {/* Cover photo section */}
            <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
              <img src={displayCreator.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
              {/* Back button or top bar actions */}
              <div className="absolute top-4 left-4 z-10">
                {!isOwnProfile && (
                  <GlassButton
                    variant="glass"
                    size="icon"
                    onClick={() => onNavigate('home')}
                    className="w-9 h-9 rounded-full"
                  >
                    <ArrowLeft className="w-4 h-4 text-white" />
                  </GlassButton>
                )}
              </div>

              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {isOwnProfile && fbUser && (
                  <>
                    <GlassButton
                      variant="glass"
                      size="icon"
                      onClick={() => onNavigate('settings')}
                      className="w-9 h-9 rounded-full border border-white/10"
                    >
                      <Settings className="w-4 h-4 text-white" />
                    </GlassButton>
                    <GlassButton
                      variant="glass"
                      size="icon"
                      onClick={handleSignOut}
                      className="w-9 h-9 rounded-full border border-white/10 text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                    </GlassButton>
                  </>
                )}
              </div>

              {/* Bottom Gradient Overlay on cover */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
            </div>

            {/* Profile Info Card (Layered depth glass style) */}
            <div className="px-5 -mt-10 relative z-10">
              {fbUser || !isOwnProfile ? (
                <>
                  <div className="flex items-end justify-between mb-4">
                    <GlassAvatar src={displayCreator.avatar} name={displayCreator.name} size="lg" ring isVerified={displayCreator.isVerified} />
                    
                    {/* Action button (Follow vs Edit Profile) */}
                    <div className="pb-1">
                      {isOwnProfile ? (
                        <div className="flex gap-1.5">
                          {displayCreator.isMonetized && (
                            <GlassButton
                              variant="glass"
                              size="sm"
                              onClick={() => onNavigate('creator-dashboard')}
                              icon={<Award className="w-3.5 h-3.5 text-[#FF9F0A]" />}
                              className="text-xs font-semibold rounded-xl border border-white/5 bg-white/[0.02]"
                            >
                              Dashboard
                            </GlassButton>
                          )}
                          <GlassButton
                            variant="glass"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            icon={<Edit3 className="w-3.5 h-3.5" />}
                            className="text-xs font-semibold rounded-xl border border-white/5 bg-white/[0.02]"
                          >
                            Edit
                          </GlassButton>
                        </div>
                      ) : (
                        <GlassButton
                          variant={liveIsFollowing ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={handleFollowToggle}
                          icon={liveIsFollowing ? <Check className="w-3.5 h-3.5" /> : undefined}
                          className="text-xs font-semibold rounded-xl"
                        >
                          {liveIsFollowing ? 'Following' : 'Follow'}
                        </GlassButton>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-left">
                    {profileLoading ? (
                      <div className="space-y-2 py-1">
                        <div className="w-36 h-5 bg-white/10 rounded animate-pulse" />
                        <div className="w-20 h-3 bg-white/5 rounded animate-pulse" />
                        <div className="space-y-1.5 mt-3">
                          <div className="w-full h-3 bg-white/5 rounded animate-pulse" />
                          <div className="w-2/3 h-3 bg-white/5 rounded animate-pulse" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-black text-white tracking-tight">{displayCreator.name}</h2>
                        <p className="text-xs text-white/50 font-medium">@{displayCreator.username}</p>
                        <p className="text-xs text-white/80 leading-relaxed max-w-sm mt-2">{displayCreator.bio}</p>
                      </>
                    )}
                    
                    {isOwnProfile && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 mt-2">
                        <Link2 className="w-3.5 h-3.5" />
                        <a href={editWebsite} target="_blank" rel="noreferrer" className="hover:underline hover:text-white">
                          {editWebsite}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Statistics Row (Frosted glass bento element) */}
                  <GlassCard className="p-3.5 grid grid-cols-3 gap-2 text-center my-5 bg-white/[0.03] border-white/5 rounded-2xl shadow-md">
                    <div>
                      {profileLoading ? (
                        <div className="w-8 h-4 bg-white/10 rounded mx-auto animate-pulse my-0.5" />
                      ) : (
                        <p className="text-sm font-black text-white">{liveFollowersCount}</p>
                      )}
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mt-0.5">Followers</p>
                    </div>
                    <div className="border-x border-white/5">
                      {profileLoading ? (
                        <div className="w-8 h-4 bg-white/10 rounded mx-auto animate-pulse my-0.5" />
                      ) : (
                        <p className="text-sm font-black text-white">{liveFollowingCount}</p>
                      )}
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mt-0.5">Following</p>
                    </div>
                    <div>
                      {profileLoading ? (
                        <div className="w-8 h-4 bg-white/10 rounded mx-auto animate-pulse my-0.5" />
                      ) : (
                        <p className="text-sm font-black text-white">{computedTotalLikes}</p>
                      )}
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mt-0.5">Total Likes</p>
                    </div>
                  </GlassCard>

                  {/* Grid Content Navigation Tabs */}
                  <div className="mb-4">
                    <GlassTabBar
                      tabs={['Videos', 'Liked', 'Saved']}
                      activeTab={activeTab}
                      onChange={(tab) => setActiveTab(tab as any)}
                    />
                  </div>

                  {/* Grid content container */}
                  <div className="mt-2 min-h-[150px]">
                    {activeTab === 'Videos' && renderVideosGrid(uploadedVideos, 'No videos have been uploaded yet.', isOwnProfile)}
                    {activeTab === 'Liked' && renderVideosGrid(likedVideos, 'Your liked creations will register here.')}
                    {activeTab === 'Saved' && renderVideosGrid(savedVideos, 'Bookmarked videos remain secured here.')}
                  </div>
                </>
              ) : (
                /* Guest viewing own profile: No profile image, no name, and sign in button where videos are supposed to appear */
                <div className="pt-16 pb-8 space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col items-center justify-center p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl text-center space-y-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shrink-0">
                        <Sparkles className="w-6 h-6 text-[#FF9F0A] animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Unlock Your Profile</h3>
                        <p className="text-[11px] text-white/55 max-w-xs leading-relaxed">
                          Sign in with Google to customize your creator identity, publish premium visual loops, and keep track of your collections.
                        </p>
                      </div>
                      <GlassButton
                        onClick={handleGoogleSignIn}
                        variant="primary"
                        className="w-full max-w-xs font-bold flex items-center justify-center gap-2.5 py-2.5 shadow-lg"
                        icon={<Chrome className="w-4 h-4 text-white shrink-0" />}
                      >
                        Sign in with Google
                      </GlassButton>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Edit Profile active screen */
          <motion.div
            key="profile-edit"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setIsEditing(false)} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white tracking-widest uppercase">Edit Creator Profile</h1>
            </div>

            {/* Real Avatar uploader */}
            <div className="flex flex-col items-center gap-4 mb-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <div 
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                className="relative group cursor-pointer flex items-center justify-center w-32 h-32"
              >
                {/* SVG Rainbow circular progress bar */}
                <svg className="absolute w-32 h-32 transform -rotate-90 z-0">
                  <defs>
                    <linearGradient id="rainbowAvatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF3B30" />
                      <stop offset="25%" stopColor="#FF9F0A" />
                      <stop offset="50%" stopColor="#34C759" />
                      <stop offset="75%" stopColor="#007AFF" />
                      <stop offset="100%" stopColor="#AF52DE" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    className="stroke-white/5"
                    strokeWidth="3.5"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    className="stroke-[url(#rainbowAvatarGrad)] transition-all duration-300 ease-out"
                    strokeWidth="3.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 58}
                    strokeDashoffset={2 * Math.PI * 58 - ((uploadingAvatar ? uploadProgress || 5 : 0) / 100) * 2 * Math.PI * 58}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Inner Avatar wrapper with a pulse effect during upload */}
                <div className={`relative z-10 rounded-full overflow-hidden p-0.5 bg-black/40 ${uploadingAvatar ? 'animate-pulse' : ''}`}>
                  <GlassAvatar 
                    src={editAvatar || (creator?.avatar || '')} 
                    name={creator?.name || ''} 
                    size="xl" 
                    ring={!uploadingAvatar} 
                  />
                </div>
                
                <div className="absolute inset-2 bg-black/55 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Camera className="w-5 h-5 text-white animate-pulse" />
                  {uploadingAvatar && (
                    <span className="text-[9px] font-black text-white mt-1">{uploadProgress}%</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                {uploadingAvatar ? 'Uploading image...' : 'Replace Creator Asset'}
              </span>
            </div>

            <GlassCard className="p-5 space-y-4">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <GlassInput
                  label="Display Name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  icon={<Edit3 className="w-4 h-4 text-white/30" />}
                  required
                />
                <GlassInput
                  label="Biography Description"
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  icon={<Key className="w-4 h-4 text-white/30" />}
                  required
                />
                <GlassInput
                  label="Personal Web Portfolio"
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  icon={<Link2 className="w-4 h-4 text-white/30" />}
                />

                <div className="flex items-center gap-3 pt-2">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 text-xs font-semibold"
                  >
                    Dismiss Changes
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="primary"
                    className="flex-1 text-xs font-semibold"
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Commit Saved
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
