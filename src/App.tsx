/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Search,
  Plus,
  Bell,
  User,
  Sliders,
  Sparkles,
  RefreshCw,
  X,
  Palette,
  CheckCircle,
  AlertOctagon,
  Eye,
  Type
} from 'lucide-react';
import { ScreenId, Video, Creator } from './types';
import { mockVideos } from './data/mockData';

// Screens imports
import { SplashView, OnboardingView, LoginView, RegisterView, ForgotPasswordView, EmailVerificationView } from './screens/SplashOnboardingAuth';
import { HomeFeedView } from './screens/HomeFeedView';
import { DiscoverView } from './screens/DiscoverView';
import { ProfileView } from './screens/ProfileView';
import { UploadView } from './screens/UploadView';
import { NotificationsView } from './screens/NotificationsView';
import { CreatorDashboardView } from './screens/CreatorDashboardView';
import { WalletView } from './screens/WalletView';
import { SettingsView } from './screens/SettingsView';
import { NotFoundView, MaintenanceView, OfflineView } from './screens/SystemViews';
import { GlassSnackbar, GlassButton } from './components/GlassDesignSystem';
import { UserOnboardingView } from './screens/UserOnboardingView';
import { LandingPageView } from './screens/LandingPageView';
import { PermissionsView } from './screens/PermissionsView';

import { AdminDashboardView } from './screens/AdminDashboardView';
import { auth, db, signInWithGoogle, purgeAllDummyAndSeededData, handleMentionsInPost } from './lib/firebase';
import { saveVideoBlob } from './lib/videoDb';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { Shield, Chrome, Award } from 'lucide-react';
import { generateVideoThumbnail, setCachedThumbnail } from './lib/thumbnailCache';
import appLogo from './assets/images/app_logo_1784015855312.jpg';

// Helper to preload profile images, actual video source buffers, and pre-cache high-fidelity thumbnails
const preloadAppAssets = (videoList: Video[]) => {
  if (!videoList || videoList.length === 0) return;
  
  videoList.forEach((video) => {
    // 1. Eagerly preload creator profile image (avatar) so it's fully cached in browser memory
    if (video.creator?.avatar) {
      const img = new Image();
      img.src = video.creator.avatar;
    }
    
    // 2. Preload actual video streams using link preloading
    if (video.url) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = video.url;
      if (!document.querySelector(`link[href="${video.url}"]`)) {
        document.head.appendChild(link);
      }
    }
    
    // 3. Pre-generate and cache base64 video thumbnail for instantaneous load
    if (video.url && video.id) {
      generateVideoThumbnail(video.url, video.id)
        .then((base64) => {
          if (base64) {
            setCachedThumbnail(video.id, base64);
            setCachedThumbnail(video.url, base64);
          }
        })
        .catch(() => {});
    }
  });
};

export default function App() {
  // Navigation & Screen States
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [navigationHistory, setNavigationHistory] = useState<ScreenId[]>(['home']);
  const [screenParams, setScreenParams] = useState<any>({});

  // Premium App Load Up & Splash blinking state
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Landing promotion page state
  const [showLanding, setShowLanding] = useState(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isPWA) return false;
    return localStorage.getItem('nomis_dismissed_landing') !== 'true';
  });

  // App Permissions Overlay state
  const [showPermissionsReq, setShowPermissionsReq] = useState(false);

  // Handle dynamic load up completion
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsAppLoading(false);
      // Once app has completed loading up, check if permissions need requesting
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      const dismissedLanding = localStorage.getItem('nomis_dismissed_landing') === 'true';
      if ((isPWA || dismissedLanding) && localStorage.getItem('nomis_permissions_granted') !== 'true') {
        setShowPermissionsReq(true);
      }
    }, 2200); // 2.2 seconds premium breathing/blinking logo animation

    return () => clearTimeout(loadTimer);
  }, []);

  // Theme states
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>('dark');

  // Resilience Mock states
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Video and Data overrides
  const [videos, setVideos] = useState<Video[]>(() => {
    const cached = localStorage.getItem('nomis_videos_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        console.warn("Videos cache parsing error:", err);
      }
    }
    return [];
  });

  // Track user background uploading progress
  const [uploadingVideos, setUploadingVideos] = useState<Array<{
    id: string;
    url: string;
    title: string;
    progress: number;
  }>>([]);

  // Authentication & Dynamic Login states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  
  // User-specific personalized states for likes, saves, and following
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [userSaves, setUserSaves] = useState<Record<string, boolean>>({});
  const [userFollowing, setUserFollowing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentUser) {
      setUserLikes({});
      setUserSaves({});
      setUserFollowing({});
      return;
    }

    const unsubscribeLikes = onSnapshot(collection(db, 'users', currentUser.uid, 'likes'), (snap) => {
      const likesMap: Record<string, boolean> = {};
      snap.forEach((docSnap) => {
        likesMap[docSnap.id] = docSnap.data().liked ?? false;
      });
      setUserLikes(likesMap);
    });

    const unsubscribeSaves = onSnapshot(collection(db, 'users', currentUser.uid, 'saves'), (snap) => {
      const savesMap: Record<string, boolean> = {};
      snap.forEach((docSnap) => {
        savesMap[docSnap.id] = docSnap.data().saved ?? false;
      });
      setUserSaves(savesMap);
    });

    const unsubscribeFollowing = onSnapshot(collection(db, 'users', currentUser.uid, 'following'), (snap) => {
      const followingMap: Record<string, boolean> = {};
      snap.forEach((docSnap) => {
        followingMap[docSnap.id] = docSnap.data().active ?? false;
      });
      setUserFollowing(followingMap);
    });

    return () => {
      unsubscribeLikes();
      unsubscribeSaves();
      unsubscribeFollowing();
    };
  }, [currentUser]);

  const personalizedVideos = useMemo(() => {
    return videos.map((video) => {
      const isLiked = currentUser ? !!userLikes[video.id] : false;
      const isSaved = currentUser ? !!userSaves[video.id] : false;
      const isFollowing = currentUser ? !!userFollowing[video.creator?.id] : false;

      return {
        ...video,
        isLiked,
        isSaved,
        creator: {
          ...video.creator,
          isFollowing
        }
      };
    });
  }, [videos, currentUser, userLikes, userSaves, userFollowing]);

  // Prevent double-tap-to-zoom and pinch-to-zoom on touch devices
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
    };
  }, []);

  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);

  // Floating designer sandbox drawer
  const [showSandbox, setShowSandbox] = useState(false);

  // Toast System
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    // Disabled toast popup for now as requested
    setShowToast(false);
  };

  // Safe navigation with history support
  const navigateTo = (screen: ScreenId, params: any = {}) => {
    setNavigationHistory((prev) => [...prev, screen]);
    setScreenParams(params);
    setCurrentScreen(screen);
  };

  const handleBack = () => {
    if (navigationHistory.length > 1) {
      const nextHistory = [...navigationHistory];
      nextHistory.pop(); // Remove current
      const prevScreen = nextHistory[nextHistory.length - 1];
      setNavigationHistory(nextHistory);
      setCurrentScreen(prevScreen);
    } else {
      navigateTo('home');
    }
  };

  // Check for admin entry path on mount
  useEffect(() => {
    if (window.location.pathname.includes('/nomisadmin') || window.location.hash.includes('nomisadmin')) {
      navigateTo('admin-entry');
    }
  }, []);

  // Sync Firebase authentication state and live Firestore videos
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    const unsubscribeVideos = onSnapshot(collection(db, 'videos'), (snapshot) => {
      if (!snapshot.empty) {
        const videoList: Video[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          videoList.push({
            id: docSnap.id,
            url: data.url || '',
            title: data.title || '',
            description: data.description || '',
            tags: data.tags || [],
            creator: data.creator || { name: 'Anonymous', avatar: '' },
            likes: data.likes || 0,
            commentsCount: data.commentsCount || 0,
            sharesCount: data.sharesCount || 0,
            savesCount: data.savesCount || 0,
            isLiked: data.isLiked || false,
            isSaved: data.isSaved || false,
            ...data
          } as Video);
        });
        setVideos(videoList);
        preloadAppAssets(videoList);
        localStorage.setItem('nomis_videos_cache', JSON.stringify(videoList));
      } else {
        setVideos([]);
        localStorage.removeItem('nomis_videos_cache');
      }
    }, (error) => {
      console.warn("Firestore videos snapshot error:", error);
      setVideos([]);
    });

    const handleVideoDeleted = (e: Event) => {
      const { videoId } = (e as CustomEvent).detail;
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      
      try {
        const cached = localStorage.getItem('nomis_videos_cache');
        if (cached) {
          const parsed = JSON.parse(cached) as any[];
          const updated = parsed.filter((v) => v.id !== videoId);
          localStorage.setItem('nomis_videos_cache', JSON.stringify(updated));
        }
      } catch (err) {
        console.error("Failed to update cache on delete:", err);
      }
    };

    window.addEventListener('videoDeleted', handleVideoDeleted as EventListener);

    return () => {
      unsubscribeAuth();
      unsubscribeVideos();
      window.removeEventListener('videoDeleted', handleVideoDeleted as EventListener);
    };
  }, []);

  // Global Onboarding Check Guardrail
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          const isOnboarded = (localStorage.getItem(`onboarded_${user.uid}`) === 'true') || (docSnap.exists() && !!docSnap.data()?.isOnboarded);
          if (!isOnboarded) {
            if (currentScreen !== 'user-onboarding') {
              navigateTo('user-onboarding');
            }
          } else {
            localStorage.setItem(`onboarded_${user.uid}`, 'true');
          }
        } catch (err) {
          console.warn("Offline or permission error checking onboarding:", err);
          const cachedOnboarded = localStorage.getItem(`onboarded_${user.uid}`) === 'true';
          if (!cachedOnboarded && currentScreen !== 'user-onboarding') {
            navigateTo('user-onboarding');
          }
        }
      }
    });
    return unsubscribe;
  }, [currentScreen]);

  // Secure action callback wrapper
  const handleRequireAuth = (callback: () => void) => {
    if (auth.currentUser) {
      callback();
    } else {
      setPendingAuthAction(() => callback);
      setShowAuthOverlay(true);
    }
  };

  const handleGoogleSignInSuccess = async () => {
    try {
      const user = await signInWithGoogle();
      triggerToast('Authenticated successfully with Google!', 'success');
      setShowAuthOverlay(false);
      
      if (user) {
        let isOnboarded = false;
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          isOnboarded = (localStorage.getItem(`onboarded_${user.uid}`) === 'true') || (docSnap.exists() && !!docSnap.data()?.isOnboarded);
        } catch (e) {
          console.warn("Offline check in google sign in:", e);
          isOnboarded = localStorage.getItem(`onboarded_${user.uid}`) === 'true';
        }

        if (!isOnboarded) {
          navigateTo('user-onboarding');
          return;
        } else {
          localStorage.setItem(`onboarded_${user.uid}`, 'true');
          navigateTo('profile'); // Land on profile after Google signin!
          return;
        }
      }

      if (pendingAuthAction) {
        pendingAuthAction();
        setPendingAuthAction(null);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Authentication failed. Please retry.', 'error');
    }
  };

  // Add uploaded videos in real-time
  const handleAddNewVideo = async (videoData: { title: string; description: string; tags: string[]; visibility: string; videoUrl: string; rawFile?: File | Blob; mediaType?: 'video' | 'image' | 'carousel'; images?: string[]; music?: string; texts?: any[]; stickers?: any[] }) => {
    // Generate an upload ID
    const uploadId = `upload-${Date.now()}`;
    
    // Add to local uploading list
    const newUpload = {
      id: uploadId,
      url: videoData.videoUrl, // Local object URL
      title: videoData.title,
      progress: 0
    };
    
    setUploadingVideos(prev => [...prev, newUpload]);
    
    // Instantly navigate to profile page to see the progress card
    navigateTo('profile');
    
    // Run the upload/simulation in the background
    const runBackgroundUpload = async () => {
      let finalVideoUrl = videoData.videoUrl;
      
      // Attempt actual upload if file exists
      if (videoData.rawFile) {
        try {
          const file = videoData.rawFile as File;
          const extension = file.name ? file.name.split('.').pop() || 'mp4' : 'mp4';
          
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload', true);
            xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
            xhr.setRequestHeader('x-file-extension', extension);
            
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                setUploadingVideos(prev => 
                  prev.map(u => u.id === uploadId ? { ...u, progress: percentComplete } : u)
                );
              }
            };
            
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const uploadData = JSON.parse(xhr.responseText);
                  if (uploadData && uploadData.url) {
                    finalVideoUrl = uploadData.url;
                  }
                  resolve();
                } catch (e) {
                  reject(new Error('Failed to parse response'));
                }
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            };
            
            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.send(file);
          });
        } catch (uploadErr) {
          console.warn("Express upload failed in background, falling back to simulated smooth progress:", uploadErr);
          // Fallback simulation
          for (let p = 10; p <= 100; p += 10) {
            await new Promise(r => setTimeout(r, 200));
            setUploadingVideos(prev => 
              prev.map(u => u.id === uploadId ? { ...u, progress: p } : u)
            );
          }
        }
      } else {
        // Preset/Demo upload: simulate progress
        for (let p = 10; p <= 100; p += 15) {
          await new Promise(r => setTimeout(r, 250));
          const actualProgress = p > 100 ? 100 : p;
          setUploadingVideos(prev => 
            prev.map(u => u.id === uploadId ? { ...u, progress: actualProgress } : u)
          );
        }
      }
      
      // Prepare Creator details
      let creatorInfo: Creator = {
        id: currentUser ? currentUser.uid : 'guest',
        name: currentUser ? (currentUser.displayName || 'Nomis Creator') : 'Nomis Guest',
        username: currentUser ? (currentUser.email ? currentUser.email.split('@')[0] : 'user') : 'guest',
        avatar: currentUser ? (currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80') : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
        bio: 'Freshly joined the Nomis visual revolution! ⚡',
        followersCount: '0',
        followingCount: '0',
        totalLikes: '0',
        isFollowing: false,
        isVerified: false
      };

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const d = docSnap.data();
            creatorInfo = {
              id: currentUser.uid,
              name: d.name || currentUser.displayName || 'Nomis Creator',
              username: d.username || (currentUser.email ? currentUser.email.split('@')[0] : 'user'),
              avatar: d.avatar || currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
              coverPhoto: d.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
              bio: d.bio || 'Freshly joined the Nomis visual revolution! ⚡',
              followersCount: d.followersCount || '0',
              followingCount: d.followingCount || '0',
              totalLikes: d.totalLikes || '0',
              isFollowing: false,
              isVerified: d.isVerified || false
            };
          }
        } catch (err) {
          console.warn("Could not retrieve creator details for uploaded video sync:", err);
        }
      }

      const videoId = `v-${Date.now()}`;
      const newVideo: Video = {
        id: videoId,
        url: finalVideoUrl,
        title: videoData.title,
        description: videoData.description,
        tags: videoData.tags,
        creator: creatorInfo,
        music: videoData.music || `${creatorInfo.name} - Refraction Solitude`,
        likes: 0,
        commentsCount: 0,
        sharesCount: 0,
        savesCount: 0,
        isLiked: false,
        isSaved: false,
        mediaType: videoData.mediaType || 'video',
        images: videoData.images || [],
        texts: videoData.texts || [],
        stickers: videoData.stickers || []
      };

      try {
        if (videoData.rawFile) {
          await saveVideoBlob(videoId, videoData.rawFile);
        }

        // Pre-generate thumbnail immediately during uploading stage so it shows up instantly
        try {
          const preGenThumb = await generateVideoThumbnail(finalVideoUrl, videoId);
          setCachedThumbnail(videoId, preGenThumb);
          setCachedThumbnail(finalVideoUrl, preGenThumb);
        } catch (thumbErr) {
          console.warn("Could not pre-generate thumbnail during uploading stage:", thumbErr);
        }

        await setDoc(doc(db, 'videos', videoId), {
          ...newVideo,
          createdAt: new Date().toISOString()
        });

        // Trigger mentions notification processing
        if (currentUser) {
          await handleMentionsInPost(videoData.title, videoId, finalVideoUrl, currentUser.uid);
        }

        triggerToast('Video published successfully and is now live!', 'success');
      } catch (err) {
        console.error("Error writing video document:", err);
        triggerToast('Video saved locally, but database sync failed.', 'info');
        setVideos((prev) => prev.some(v => v.id === newVideo.id) ? prev : [newVideo, ...prev]);
      } finally {
        // Clear from uploading state
        setUploadingVideos(prev => prev.filter(u => u.id !== uploadId));
      }
    };
    
    // Start background process
    runBackgroundUpload();
  };

  // Setup splash timer to redirect to Onboarding
  const handleSplashFinished = () => {
    navigateTo('onboarding');
  };

  // Check which tab matches active screen for navigation bar highlight
  const getActiveTab = () => {
    if (['home', 'discover', 'notifications', 'profile', 'creator-dashboard'].includes(currentScreen)) {
      if (currentScreen === 'creator-dashboard' || currentScreen === 'profile') return 'profile';
      return currentScreen;
    }
    return '';
  };

  const renderActiveScreen = () => {
    // Override screens if maintenance/offline modes are forced
    if (isMaintenanceMode) {
      return <MaintenanceView onNavigate={navigateTo} onRetry={() => setIsMaintenanceMode(false)} />;
    }
    if (isOfflineMode) {
      return <OfflineView onNavigate={navigateTo} onRetry={() => setIsOfflineMode(false)} />;
    }

    switch (currentScreen) {
      case 'splash':
        return <SplashView onFinished={handleSplashFinished} />;
      case 'onboarding':
        return <OnboardingView onNavigate={navigateTo} />;
      case 'login':
        return (
          <LoginView 
            onNavigate={navigateTo} 
            onLoginSuccess={() => navigateTo('creator-dashboard')} 
            onGoogleLoginSuccess={() => navigateTo('profile')}
            onShowToast={triggerToast} 
          />
        );
      case 'register':
        return <RegisterView onNavigate={navigateTo} onShowToast={triggerToast} />;
      case 'forgot-password':
        return <ForgotPasswordView onNavigate={navigateTo} onShowToast={triggerToast} />;
      case 'verification':
        return <EmailVerificationView onNavigate={navigateTo} onShowToast={triggerToast} />;
      case 'user-onboarding':
        return <UserOnboardingView onNavigate={navigateTo} onShowToast={triggerToast} />;
      case 'home':
        return (
          <HomeFeedView 
            onNavigate={navigateTo} 
            onShowToast={triggerToast} 
            onRequireAuth={handleRequireAuth}
            videosList={personalizedVideos}
            activeVideoId={screenParams?.activeVideoId}
            creatorIdFilter={screenParams?.creatorIdFilter}
          />
        );
      case 'discover':
        return <DiscoverView onNavigate={navigateTo} onShowToast={triggerToast} initialSearchQuery={screenParams?.search || ''} videosList={personalizedVideos} />;
      case 'upload':
        if (!currentUser) {
          setTimeout(() => {
            navigateTo('home');
            setShowAuthOverlay(true);
            triggerToast('Please sign in to upload or post content', 'error');
          }, 0);
          return null;
        }
        return <UploadView onNavigate={navigateTo} onShowToast={triggerToast} onAddMockVideo={handleAddNewVideo} />;
      case 'notifications':
        return <NotificationsView onNavigate={navigateTo} onShowToast={triggerToast} />;
      case 'profile':
        return <ProfileView onNavigate={navigateTo} onShowToast={triggerToast} videosList={personalizedVideos} uploadingVideos={uploadingVideos} />;
      case 'creator-profile':
        return <ProfileView onNavigate={navigateTo} onShowToast={triggerToast} creatorId={screenParams?.creatorId} videosList={personalizedVideos} uploadingVideos={uploadingVideos} />;
      case 'edit-profile':
        return <ProfileView onNavigate={navigateTo} onShowToast={triggerToast} isEditView={true} videosList={personalizedVideos} uploadingVideos={uploadingVideos} />;
      case 'creator-dashboard':
        return <CreatorDashboardView onNavigate={navigateTo} onShowToast={triggerToast} videosList={personalizedVideos} />;
      case 'wallet':
        return <WalletView onNavigate={navigateTo} onShowToast={triggerToast} />;
      case 'admin-entry':
        return <AdminDashboardView onNavigate={navigateTo} onShowToast={triggerToast} />;
      case 'settings':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => setIsMaintenanceMode(!isMaintenanceMode)}
            onToggleOffline={() => setIsOfflineMode(!isOfflineMode)}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
          />
        );
      case 'settings-privacy':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="privacy"
          />
        );
      case 'settings-security':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="security"
          />
        );
      case 'settings-appearance':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="appearance"
          />
        );
      case 'settings-about':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="about"
          />
        );
      case 'settings-help':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="help"
          />
        );
      case 'settings-report-user':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="report-user"
          />
        );
      case 'settings-report-video':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="report-video"
          />
        );
      case 'settings-guidelines':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="guidelines"
          />
        );
      case 'settings-terms':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="terms"
          />
        );
      case 'settings-policy':
        return (
          <SettingsView
            onNavigate={navigateTo}
            onShowToast={triggerToast}
            activeTheme={theme}
            onChangeTheme={setTheme}
            onToggleMaintenance={() => {}}
            onToggleOffline={() => {}}
            isMaintenanceMode={isMaintenanceMode}
            isOfflineMode={isOfflineMode}
            initialSubPage="policy"
          />
        );
      case 'settings-withdraw':
        return <WalletView onNavigate={navigateTo} onShowToast={triggerToast} />;
      case 'error-404':
        return <NotFoundView onNavigate={navigateTo} />;
      default:
        return <NotFoundView onNavigate={navigateTo} />;
    }
  };

  // Layout styling variables depending on active theme mode
  const getThemeWrapperClass = () => {
    if (theme === 'light') {
      return 'bg-neutral-100 text-neutral-900';
    }
    if (theme === 'high-contrast') {
      return 'bg-black text-white border-4 border-white';
    }
    return 'bg-[#050505] text-white';
  };

  // 1. Premium App Load Up Blinking Screen
  if (isAppLoading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#050505] flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center space-y-5">
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ 
              scale: [1, 1.15, 1], 
              opacity: [0.75, 1, 0.75],
              boxShadow: [
                "0 0 30px rgba(255, 59, 48, 0.4)",
                "0 0 60px rgba(255, 59, 48, 0.8)",
                "0 0 30px rgba(255, 59, 48, 0.4)"
              ]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] overflow-hidden flex items-center justify-center border border-white/20"
          >
            <img 
              src={appLogo} 
              alt="Nomis Logo" 
              className="w-full h-full object-cover select-none animate-pulse" 
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-2xl font-black uppercase tracking-[0.25em] text-white mt-4 select-none"
          >
            NOMIS
          </motion.h1>
          <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-sans font-bold select-none">The Motion Video Platform</p>
        </div>
      </div>
    );
  }

  // 2. High Fidelity Landing Page
  if (showLanding) {
    return (
      <LandingPageView 
        onEnterApp={() => {
          localStorage.setItem('nomis_dismissed_landing', 'true');
          setShowLanding(false);
          if (localStorage.getItem('nomis_permissions_granted') !== 'true') {
            setShowPermissionsReq(true);
          }
        }} 
      />
    );
  }

  // 3. Immersive Permissions Request Screen
  if (showPermissionsReq) {
    return (
      <div className="w-full min-h-[100dvh] flex items-center justify-center p-0 md:p-6 transition-colors duration-500 overflow-hidden relative bg-[#050505]">
        <div className="w-full max-w-md h-[100dvh] md:h-[840px] rounded-none md:rounded-[2.75rem] border border-neutral-800/10 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col bg-black">
          <PermissionsView onPermissionsGranted={() => setShowPermissionsReq(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-[100dvh] flex items-center justify-center p-0 md:p-6 transition-colors duration-500 overflow-hidden relative ${getThemeWrapperClass()}`}>
      
      {/* Background Atmosphere (Immersive UI glowing red & purple orbs) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#FF3B30] rounded-full mix-blend-screen filter blur-[140px] opacity-[0.16]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#5856D6] rounded-full mix-blend-screen filter blur-[140px] opacity-[0.16]" />
      </div>

      {/* Main Flagship Interactive Container Frame */}
      <div className="w-full max-w-md h-[100dvh] md:h-[840px] rounded-none md:rounded-[2.75rem] border border-neutral-800/10 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col bg-black">
        
        {/* Core application view routing wrapper */}
        <div className="flex-1 overflow-hidden relative">
          {renderActiveScreen()}

          {/* Dynamic Authentication Request Overlay Drawer */}
          <AnimatePresence>
            {showAuthOverlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-end p-5"
              >
                {/* Click outside to dismiss */}
                <div className="absolute inset-0" onClick={() => setShowAuthOverlay(false)} />

                <motion.div
                  initial={{ y: 200 }}
                  animate={{ y: 0 }}
                  exit={{ y: 200 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="bg-zinc-950/95 border border-white/10 rounded-3xl p-6 relative z-10 w-full space-y-5 text-left"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] flex items-center justify-center border border-white/10 shadow-[0_4px_15px_rgba(255,59,48,0.3)]">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider mt-2">Nomis Authentication</h3>
                      <p className="text-[10px] font-semibold text-white/40 uppercase">Action requires Google Sign-In</p>
                    </div>
                    <button 
                      onClick={() => setShowAuthOverlay(false)}
                      className="p-1.5 rounded-full hover:bg-white/5 transition-colors text-white/50 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed font-medium">
                    Authenticate to participate in Nomis conversations, save your favorites, and show support to premium motion creators.
                  </p>

                  <div className="pt-2">
                    <GlassButton
                      onClick={handleGoogleSignInSuccess}
                      variant="primary"
                      className="w-full font-bold flex items-center justify-center gap-2.5 py-3"
                      icon={<Chrome className="w-4 h-4 text-white shrink-0" />}
                    >
                      Connect Google Account
                    </GlassButton>
                  </div>

                  <p className="text-[9px] text-white/30 text-center uppercase tracking-wide font-mono">
                    Secured by Firebase standards
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reusable Frosted Glass Bottom Navigation tabs */}
        {getActiveTab() !== '' && (
          <div className="absolute bottom-0 left-0 right-0 h-16 z-40 bg-black/60 dark:bg-zinc-950/85 border-t border-white/10 backdrop-blur-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.4)] flex items-center justify-around select-none px-2">
            {[
              { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
              { id: 'upload', label: 'Post', icon: <Plus className="w-5 h-5" /> },
              { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }
            ].map((tab) => {
              const isActive = getActiveTab() === tab.id;
              const isUpload = tab.id === 'upload';

              if (isUpload) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      handleRequireAuth(() => {
                        navigateTo(tab.id as ScreenId);
                      });
                    }}
                    className="relative flex flex-col items-center justify-center py-1 px-4 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
                  >
                    <div className="bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] text-white p-2 rounded-xl shadow-[0_4px_15px_rgba(255,59,48,0.35)] border border-white/20 flex items-center justify-center">
                      <Plus className="w-4.5 h-4.5 stroke-[2.5px]" />
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'home') {
                      navigateTo('home', { activeVideoId: undefined, creatorIdFilter: undefined });
                    } else {
                      navigateTo(tab.id as ScreenId);
                    }
                  }}
                  className={`
                    relative flex flex-col items-center justify-center py-2 px-6 gap-1 rounded-xl transition-all duration-300 cursor-pointer h-full min-w-[72px]
                    ${isActive ? 'text-[#FF3B30] font-bold' : 'text-white/45 hover:text-white/70'}
                  `}
                >
                  {/* Glowing dynamic background for active tab item */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBottomHighlight"
                      className="absolute inset-x-1 inset-y-2 bg-white/5 border border-white/5 rounded-xl"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                  <span className="relative z-10">{tab.icon}</span>
                  <span className="text-[9px] font-bold tracking-wider uppercase relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Global Toast / Snackbar notification */}
        <GlassSnackbar
          message={toastMessage}
          isOpen={showToast}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      </div>
    </div>
  );
}
