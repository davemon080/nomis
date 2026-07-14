/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, RefreshCw, Bell, Search, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { Video, ScreenId } from '../types';
import { VideoPlayerCard } from '../components/VideoPlayerCard';
import { auth } from '../lib/firebase';
import { personalizeFeed } from '../lib/recommendationAlgorithm';

interface HomeFeedViewProps {
  onNavigate: (screen: ScreenId, params?: any) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  onRequireAuth?: (callback: () => void) => void;
  videosList?: Video[];
  activeVideoId?: string;
  creatorIdFilter?: string;
}

export const HomeFeedView: React.FC<HomeFeedViewProps> = ({
  onNavigate,
  onShowToast,
  onRequireAuth,
  videosList,
  activeVideoId,
  creatorIdFilter
}) => {
  const [activeTab, setActiveTab] = useState<'For You' | 'Following'>('For You');
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize mute state across players when tab or storage changes
  const [isMuted, setIsMuted] = useState(() => {
    const cached = localStorage.getItem('nomis_global_mute');
    return cached !== null ? JSON.parse(cached) : false;
  });

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

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('nomis_global_mute', JSON.stringify(nextMuted));
    window.dispatchEvent(new Event('nomis_mute_toggle'));
  };

  // Synchronize with external live/seeded video collection
  const baseVideos = videosList || [];

  // Track activeTab to only reset indices and scroll to top when activeTab changes
  const lastTabRef = useRef<'For You' | 'Following'>(activeTab);

  // Filter and sort video list based on active tab, creator filter, and recommendation algorithm
  useEffect(() => {
    let active = true;

    const applyPersonalizationAndFiltering = async () => {
      let list: Video[] = [];
      if (creatorIdFilter) {
        list = baseVideos.filter((v) => v.creator?.id === creatorIdFilter);
      } else if (activeTab === 'For You') {
        const userId = auth.currentUser?.uid || 'guest';
        list = await personalizeFeed(baseVideos, userId);
      } else {
        list = baseVideos.filter((v) => v.creator.isFollowing);
      }

      if (!active) return;

      // Deduplicate list by id to guarantee unique keys
      const uniqueList: Video[] = Array.from(new Map<string, Video>(list.map((v) => [v.id, v])).values());
      setVideoList(uniqueList);

      if (lastTabRef.current !== activeTab) {
        lastTabRef.current = activeTab;
        setActiveIndex(0);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }
    };

    applyPersonalizationAndFiltering();
    return () => {
      active = false;
    };
  }, [activeTab, baseVideos, creatorIdFilter]);

  // Track the last scrolled video ID to prevent resetting the view on video lists reload (e.g. on liking/following)
  const lastScrolledVideoIdRef = useRef<string | null>(null);

  // Deep linking: Scroll to target video on mount or when activeVideoId changes
  useEffect(() => {
    if (activeVideoId && videoList.length > 0 && lastScrolledVideoIdRef.current !== activeVideoId) {
      const idx = videoList.findIndex((v) => v.id === activeVideoId);
      if (idx !== -1) {
        lastScrolledVideoIdRef.current = activeVideoId;
        setActiveIndex(idx);
        const timer = setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = idx * scrollContainerRef.current.clientHeight;
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [activeVideoId, videoList]);

  const handlePullToRefresh = () => {
    setIsRefreshing(true);
    onShowToast('Refracting a fresh feed of videos...', 'info');
    setTimeout(() => {
      setIsRefreshing(false);
      // Shuffle videoList slightly for refreshed feel
      setVideoList((prev) => [...prev].reverse());
      setActiveIndex(0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }, 1500);
  };

  // Wheel and Touch Scroll Position Handler (pure mathematical calculation for active video)
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, clientHeight } = scrollContainerRef.current;
    if (clientHeight === 0) return;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeIndex && index >= 0 && index < videoList.length) {
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative w-full h-full bg-black select-none">
      {/* Feed Sub-Header Tab Switcher (Floating Glass) */}
      <div className="absolute top-3 inset-x-0 z-30 flex justify-center items-center pointer-events-none">
        {creatorIdFilter ? (
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 py-1 px-3 font-bold text-[10px] tracking-wider uppercase pointer-events-auto shadow-lg">
            <button
              onClick={() => {
                if (auth.currentUser && creatorIdFilter === auth.currentUser.uid) {
                  onNavigate('profile');
                } else {
                  onNavigate('creator-profile', { creatorId: creatorIdFilter });
                }
              }}
              className="flex items-center gap-1.5 text-white/70 hover:text-white transition-all cursor-pointer mr-0.5 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Profile</span>
            </button>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-white/40 lowercase">@{videoList[0]?.creator?.username || 'creator'}'s content</span>
          </div>
        ) : (
          <div className="flex bg-black/40 backdrop-blur-xl rounded-full border border-white/10 p-0.5 font-bold text-[10px] tracking-wider uppercase pointer-events-auto">
            <button
              onClick={() => setActiveTab('For You')}
              className={`px-3 py-1 rounded-full transition-all duration-300 ${
                activeTab === 'For You' ? 'bg-white text-black font-extrabold' : 'text-white/60 hover:text-white'
              }`}
            >
              For You
            </button>
            <button
              onClick={() => {
                const action = () => {
                  setActiveTab('Following');
                };
                if (onRequireAuth) {
                  onRequireAuth(action);
                } else {
                  action();
                }
              }}
              className={`px-3 py-1 rounded-full transition-all duration-300 ${
                activeTab === 'Following' ? 'bg-white text-black font-extrabold' : 'text-white/60 hover:text-white'
              }`}
            >
              Following
            </button>
          </div>
        )}
      </div>

      {/* Floating Alerts Trigger (Top-Left Bell Icon) */}
      <div className="absolute top-3 left-3 z-30">
        <button
          onClick={() => onNavigate('notifications')}
          className="p-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white/70 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Bell className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Floating Search Trigger (Top-Right Search Icon) */}
      <div className="absolute top-3 right-3 z-30">
        <button
          onClick={() => onNavigate('discover')}
          className="p-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white/70 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Floating Refresh Trigger (Under Notification Bell) */}
      <div className="absolute top-13 left-3 z-30">
        <button
          onClick={handlePullToRefresh}
          className="p-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white/70 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
        </button>
      </div>



      {/* Feed Content Container */}
      <div className="w-full h-full overflow-hidden relative">
        {videoList.length > 0 ? (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-none transition-all duration-300 ${
              isCommentsOpen ? 'overflow-hidden touch-none' : ''
            }`}
          >
            {videoList.map((video, index) => (
              <div
                key={video.id}
                className="w-full h-full snap-start snap-always shrink-0 relative"
              >
                <VideoPlayerCard
                  video={video}
                  isActive={index === activeIndex && !isRefreshing}
                  onNavigate={onNavigate}
                  onShowToast={onShowToast}
                  onRequireAuth={onRequireAuth}
                  onToggleComments={setIsCommentsOpen}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <Compass className="w-12 h-12 text-white/30 mb-4 animate-pulse" />
            <p className="text-sm text-white/60 font-semibold tracking-wide uppercase">No following creators live</p>
            <p className="text-xs text-white/40 max-w-xs mt-1">Discover premium creators in the search tab to curate your feed.</p>
          </div>
        )}
      </div>

      {/* Pulled-To-Refresh Simulation Banner */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-18 inset-x-0 z-30 flex justify-center"
          >
            <div className="bg-white/15 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-2xl">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Refracting Nomis Feed...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
