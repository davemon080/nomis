/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Nomis - Discover & Search View (Direct Firestore Sync + Dynamic Local Caching)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Compass, TrendingUp, Grid, Play, Flame, ArrowLeft, ArrowRight, UserCheck, Star, Users } from 'lucide-react';
import { Video, Creator, ScreenId } from '../types';
import { GlassCard, GlassInput, GlassChip, GlassAvatar } from '../components/GlassDesignSystem';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface DiscoverViewProps {
  onNavigate: (screen: ScreenId, params?: any) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  initialSearchQuery?: string;
  videosList?: Video[];
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onNavigate,
  onShowToast,
  initialSearchQuery = '',
  videosList
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSearching, setIsSearching] = useState(initialSearchQuery !== '');
  const [searchTab, setSearchTab] = useState<'videos' | 'creators'>('videos');
  
  // Real-time fetched states + Cache loading
  const [creators, setCreators] = useState<Creator[]>(() => {
    const cached = localStorage.getItem('discover_creators_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        console.warn("Creators cache parsing error:", err);
      }
    }
    return [];
  });

  const [isLoadingCreators, setIsLoadingCreators] = useState(creators.length === 0);

  const categories = ['All', 'Motion Design', 'Cyberpunk', 'Aesthetics', 'Skating', 'Tokyo'];

  const trendingTags = [
    { tag: 'NomisMotion', count: '1.2M views', label: 'Festival' },
    { tag: 'Glassmorphism', count: '840K views', label: 'UI Design' },
    { tag: 'CyberpunkVibes', count: '620K views', label: 'Trending' },
    { tag: 'AcousticCovers', count: '310K views', label: 'Music' }
  ];

  // Live Sync users from Firestore
  useEffect(() => {
    setIsLoadingCreators(true);
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const dbUsers: Creator[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        dbUsers.push({
          id: docSnap.id,
          name: d.name || d.displayName || 'Nomis User',
          username: d.username || 'user_' + docSnap.id.substring(0, 5),
          avatar: d.avatar || d.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
          coverPhoto: d.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
          bio: d.bio || 'Joined the Nomis visual revolution! ⚡',
          followersCount: d.followersCount || '0',
          followingCount: d.followingCount || '0',
          totalLikes: d.totalLikes || '0',
          isFollowing: d.isFollowing || false,
          isVerified: d.isVerified || false
        });
      });

      setCreators(dbUsers);
      localStorage.setItem('discover_creators_cache', JSON.stringify(dbUsers));
      setIsLoadingCreators(false);
    }, (error) => {
      console.warn("Firestore users snapshot failed, using cached list:", error);
      setIsLoadingCreators(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      onShowToast(`Refracting visual matches for "${searchQuery}"`, 'success');
    } else {
      setIsSearching(false);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setIsSearching(true);
    setSearchTab('videos');
    onShowToast(`Refracting results for #${tag}`, 'info');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  // Base list of videos prioritize live prop sync
  const baseVideos = videosList || [];

  // Filter videos based on category chip or search query
  const filteredVideosRaw = baseVideos.filter((video) => {
    if (isSearching && searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        video.title.toLowerCase().includes(q) ||
        video.description.toLowerCase().includes(q) ||
        video.tags.some((t) => t.toLowerCase().includes(q)) ||
        video.creator.username.toLowerCase().includes(q) ||
        video.creator.name.toLowerCase().includes(q)
      );
    }
    
    if (activeCategory !== 'All') {
      const catLower = activeCategory.toLowerCase();
      if (catLower === 'motion design') {
        return video.tags.includes('dance') || video.tags.includes('minimalism') || video.tags.includes('glassmorphism');
      }
      if (catLower === 'cyberpunk') {
        return video.tags.includes('cyberpunk') || video.tags.includes('neon');
      }
      if (catLower === 'aesthetics') {
        return video.tags.includes('aesthetic') || video.tags.includes('reflections') || video.tags.includes('goldenhour');
      }
      if (catLower === 'skating') {
        return video.tags.includes('skate');
      }
      if (catLower === 'tokyo') {
        return video.tags.includes('tokyo');
      }
    }
    
    return true;
  });

  const filteredVideos: Video[] = Array.from(new Map<string, Video>(filteredVideosRaw.map(v => [v.id, v])).values());

  // Filter creators (users) based on search query
  const filteredCreators = creators.filter((creator) => {
    if (isSearching && searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        creator.name.toLowerCase().includes(q) ||
        creator.username.toLowerCase().includes(q) ||
        creator.bio.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Skeleton Loader elements
  const VideoSkeleton = () => (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/[0.05] bg-white/[0.01] animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute inset-x-3 bottom-3 space-y-2">
        <div className="h-3 w-3/4 bg-white/10 rounded" />
        <div className="h-2 w-1/3 bg-white/5 rounded" />
      </div>
    </div>
  );

  const CreatorSkeleton = () => (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.04] bg-white/[0.01] animate-pulse">
      <div className="w-10 h-10 rounded-full bg-white/10" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-1/3 bg-white/10 rounded" />
        <div className="h-2 w-1/2 bg-white/5 rounded" />
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar select-none pb-24">
      {/* Search Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-white animate-pulse" />
            <h1 className="text-xl font-black text-white tracking-widest uppercase">DISCOVER</h1>
          </div>
          {isSearching && (
            <button
              onClick={handleClearSearch}
              className="text-xs font-semibold text-white/50 hover:text-white uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Dynamic Glass Search Input */}
        <form onSubmit={handleSearchSubmit}>
          <GlassInput
            placeholder="Search creators, hashtags, or neon vibes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) setIsSearching(false);
            }}
            icon={<Search className="w-5 h-5 text-white/40" />}
            rightElement={
              searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-wider select-none cursor-pointer"
                >
                  Clear
                </button>
              )
            }
          />
        </form>
      </div>

      {/* Category Horizontal Filter Chips */}
      {!isSearching && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none flex-shrink-0">
          {categories.map((cat) => (
            <GlassChip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => {
                setActiveCategory(cat);
                onShowToast(`Filtering explore feed: ${cat}`, 'info');
              }}
            />
          ))}
        </div>
      )}

      {/* Discover Landing / Trending sections */}
      <AnimatePresence mode="wait">
        {!isSearching ? (
          <motion.div
            key="discover-landing"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            {/* Carousel Banner (Promotional Glassmorphic Card) */}
            <GlassCard className="relative overflow-hidden p-6 border-white/20 dark:border-white/10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent flex flex-col justify-between h-40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-1.5 bg-white/15 border border-white/25 backdrop-blur-md px-2.5 py-1 rounded-full w-max">
                <Flame className="w-3 h-3 text-yellow-400 animate-bounce" />
                <span className="text-[9px] font-bold text-white uppercase tracking-wider">CREATOR FESTIVAL</span>
              </div>
              <div className="space-y-1.5 text-left">
                <h2 className="text-base font-extrabold text-white tracking-wide uppercase leading-tight">#NomisMotion Challenge</h2>
                <p className="text-[10px] text-white/60 leading-relaxed max-w-[200px]">
                  Submit your finest optical and dynamic transitions for a chance to win exclusive funding pools.
                </p>
              </div>
              <div className="absolute bottom-5 right-5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTagClick('NomisMotion')}
                  className="flex items-center gap-1.5 bg-white text-black text-[10px] font-bold px-3.5 py-2 rounded-xl shadow-lg cursor-pointer"
                >
                  Join Challenge <ArrowRight className="w-3 h-3" />
                </motion.button>
              </div>
            </GlassCard>

            {/* Trending Hashtags */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white" />
                <h2 className="text-xs font-bold text-white tracking-widest uppercase">Trending Hashtags</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {trendingTags.map((tagItem) => (
                  <GlassCard
                    key={tagItem.tag}
                    onClick={() => handleTagClick(tagItem.tag)}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border-white/5 flex flex-col justify-between h-20 text-left cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white tracking-wide truncate">#{tagItem.tag}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">{tagItem.count}</span>
                      <span className="text-[8px] font-semibold text-white/50 bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5 uppercase tracking-wide">
                        {tagItem.label}
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Explore Video Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-white" />
                  <h2 className="text-xs font-bold text-white tracking-widest uppercase">Explore Visuals</h2>
                </div>
                <span className="text-[10px] font-semibold text-white/40">{filteredVideos.length} Available</span>
              </div>

              {/* Grid of video thumbnails with dynamic skeleton loaders */}
              {isLoadingCreators && filteredVideos.length === 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((n) => <VideoSkeleton key={n} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredVideos.map((video) => (
                    <motion.div
                      key={video.id}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate('home', { activeVideoId: video.id })}
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/[0.08] dark:border-white/[0.04] bg-neutral-900 group cursor-pointer shadow-md"
                    >
                      {/* Video Poster with dynamic high-fidelity thumbnail cache */}
                      <VideoThumbnail
                        videoUrl={video.url}
                        videoId={video.id}
                        fallbackUrl={video.creator.coverPhoto}
                        mediaType={video.mediaType}
                        images={video.images}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Video stats badge floating */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/45 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/10 text-[9px] font-bold text-white">
                        <Play className="w-2.5 h-2.5 fill-white" />
                        <span>{video.likes}</span>
                      </div>
                      {/* Bottom frosted gradient metadata */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end text-left">
                        <p className="text-[10px] font-bold text-white truncate">{video.title}</p>
                        <p className="text-[9px] text-white/50 mt-0.5 truncate">@{video.creator.username}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Search Results active screen */
          <motion.div
            key="search-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Search Dual-tab bar switcher */}
            <div className="flex border-b border-white/5 p-1 bg-white/[0.02] rounded-xl">
              <button
                onClick={() => setSearchTab('videos')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5
                  ${searchTab === 'videos' ? 'bg-white text-black font-extrabold' : 'text-white/45 hover:text-white/70'}
                `}
              >
                <Grid className="w-3.5 h-3.5" />
                Visuals ({filteredVideos.length})
              </button>
              <button
                onClick={() => setSearchTab('creators')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5
                  ${searchTab === 'creators' ? 'bg-white text-black font-extrabold' : 'text-white/45 hover:text-white/70'}
                `}
              >
                <Users className="w-3.5 h-3.5" />
                Creators ({filteredCreators.length})
              </button>
            </div>

            {searchTab === 'videos' ? (
              /* Visual Matches Grid */
              filteredVideos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredVideos.map((video) => (
                    <motion.div
                      key={video.id}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate('home', { activeVideoId: video.id })}
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/[0.08] bg-neutral-900 group cursor-pointer shadow-lg"
                    >
                      <VideoThumbnail
                        videoUrl={video.url}
                        videoId={video.id}
                        fallbackUrl={video.creator.coverPhoto}
                        mediaType={video.mediaType}
                        images={video.images}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/45 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/10 text-[9px] font-bold text-white">
                        <Play className="w-2.5 h-2.5 fill-white" />
                        <span>{video.likes}</span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 text-left">
                        <p className="text-[10px] font-bold text-white truncate">{video.title}</p>
                        <p className="text-[9px] text-white/40 truncate">@{video.creator.username}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <Search className="w-10 h-10 text-white/25 mb-3" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Visual Refractions</h3>
                  <p className="text-xs text-white/40 max-w-xs mt-1 leading-relaxed">
                    We could not map any matching videos. Check spelling or test another hashtag overlay.
                  </p>
                </div>
              )
            ) : (
              /* Creators matches search results */
              filteredCreators.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {filteredCreators.map((creator) => (
                    <motion.div
                      key={creator.id}
                      whileHover={{ x: 2, bg: 'rgba(255,255,255,0.04)' }}
                      onClick={() => onNavigate('creator-profile', { creatorId: creator.id })}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] cursor-pointer text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <GlassAvatar
                          src={creator.avatar}
                          name={creator.name}
                          size="sm"
                          isVerified={creator.isVerified}
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-extrabold text-white">{creator.name}</span>
                          </div>
                          <p className="text-[10px] text-white/45">@{creator.username}</p>
                          <p className="text-[9px] text-white/60 line-clamp-1 max-w-[180px]">{creator.bio}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-center items-end gap-1">
                        <span className="text-[10px] font-black text-white/90">{creator.followersCount}</span>
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Followers</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <Users className="w-10 h-10 text-white/25 mb-3" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Creators Located</h3>
                  <p className="text-xs text-white/40 max-w-xs mt-1 leading-relaxed">
                    We could not find any registered creators matching "{searchQuery}".
                  </p>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
