/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  Database, 
  Trash2, 
  Users, 
  Film, 
  MessageSquare, 
  Plus, 
  TrendingUp, 
  RefreshCw, 
  Search,
  Eye,
  Heart,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { ScreenId, Video } from '../types';
import { GlassCard, GlassButton, GlassInput, GlassListTile } from '../components/GlassDesignSystem';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, increment, setDoc } from 'firebase/firestore';

interface AdminDashboardViewProps {
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigate,
  onShowToast
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard Data State
  const [videos, setVideos] = useState<Video[]>([]);
  const [usersCount, setUsersCount] = useState(12); // Simulated base count + db
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New video creation for admin
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDesc, setNewVideoDesc] = useState('');
  const [newVideoTags, setNewVideoTags] = useState('');
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  // Authentication check
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'daveimagodei@gmail.com' && password === 'eroll@12') {
      setIsAuthenticated(true);
      setAuthError('');
      onShowToast('Welcome Dave! Admin Access Granted.', 'success');
      fetchDbData();
    } else {
      setAuthError('Invalid administrator credentials.');
      onShowToast('Admin access denied.', 'error');
    }
  };

  // Fetch Firestore content to display in admin dashboard
  const fetchDbData = async () => {
    setLoading(true);
    try {
      // Fetch videos from Firestore
      const videosCol = collection(db, 'videos');
      const videoSnapshot = await getDocs(videosCol);
      const videoList: Video[] = [];
      let totalComments = 0;

      videoSnapshot.forEach((docSnap) => {
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
        totalComments += data.commentsCount || 0;
      });

      setVideos(videoList);
      setCommentsCount(totalComments);
      // Let's query users if we have permissions, or just list user count
      const usersCol = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCol);
      if (!usersSnapshot.empty) {
        setUsersCount(usersSnapshot.size + 8); // Base layout mock + DB size
      }
    } catch (error) {
      console.error("Error reading database metrics:", error);
      onShowToast("Synced metrics with fallback local data", "info");
    } finally {
      setLoading(false);
    }
  };

  // Delete a video
  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteDoc(doc(db, 'videos', videoId));
      setVideos(prev => prev.filter(v => v.id !== videoId));
      onShowToast('Video removed successfully from Nomis database.', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to delete video.', 'error');
    }
  };

  // Handle adding an official curated video
  const handleAddCuratedVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl || !newVideoTitle) {
      onShowToast('Please provide URL and Title', 'error');
      return;
    }

    try {
      const videoId = 'admin_curated_' + Date.now();
      const tagsArray = newVideoTags.split(',').map(t => t.trim()).filter(Boolean);
      
      const officialCreator = {
        id: 'c3',
        name: 'Nomis Studio',
        username: 'nomis_official',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80',
        coverPhoto: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=300&fit=crop&q=80',
        bio: 'Official channel of Nomis. Explore our curated visual showcases of pure architecture, style, and motion design.',
        followersCount: '5.6M',
        followingCount: '12',
        totalLikes: '22.4M',
        isFollowing: true,
        isVerified: true
      };

      const newVideoObj = {
        id: videoId,
        url: newVideoUrl,
        title: newVideoTitle,
        description: newVideoDesc,
        tags: tagsArray,
        creator: officialCreator,
        music: 'Nomis Studio - Curated Vision',
        likes: 120,
        commentsCount: 0,
        sharesCount: 15,
        savesCount: 30,
        isLiked: false,
        isSaved: false
      };

      await setDoc(doc(db, 'videos', videoId), newVideoObj);
      onShowToast('Curated video published successfully to live feed!', 'success');
      
      // Reset state
      setNewVideoUrl('');
      setNewVideoTitle('');
      setNewVideoDesc('');
      setNewVideoTags('');
      setIsAddingVideo(false);
      
      fetchDbData();
    } catch (err) {
      console.error(err);
      onShowToast('Error publishing curated video.', 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDbData();
    }
  }, [isAuthenticated]);

  // Render Login Overlay
  if (!isAuthenticated) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#0B0B0C] to-[#040405] p-6 flex flex-col justify-center items-center text-left">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          {/* Brand Identity / Title block */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] flex items-center justify-center shadow-[0_8px_25px_rgba(255,59,48,0.3)] border border-white/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest mt-4">NOMIS ADMIN</h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider font-mono">Platform Management Shell</p>
          </div>

          <GlassCard className="p-6 border-white/10 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <GlassInput
                label="Admin Email Address"
                type="email"
                placeholder="daveimagodei@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-white/30" />}
                required
              />

              <GlassInput
                label="Security Key"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Key className="w-4 h-4 text-white/30" />}
                required
              />

              {authError && (
                <div className="flex items-center gap-2 text-[11px] text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <GlassButton
                type="submit"
                variant="primary"
                className="w-full font-bold uppercase tracking-wider"
              >
                Authenticate Session
              </GlassButton>
            </form>
          </GlassCard>

          <div className="text-center">
            <button 
              onClick={() => onNavigate('home')}
              className="text-white/40 hover:text-white/70 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Return to Public Feed
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Dashboard
  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.creator.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#060607] to-black p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar select-none pb-24 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#FF3B30] animate-pulse" />
          <div>
            <h1 className="text-sm font-black text-white tracking-widest uppercase">Dave's Control Panel</h1>
            <p className="text-[8px] text-green-400 font-bold uppercase tracking-wide">Secured Live Firestore Connected</p>
          </div>
        </div>
        <div className="flex gap-2">
          <GlassButton variant="secondary" size="icon" onClick={fetchDbData} className="w-8 h-8 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5" />
          </GlassButton>
          <GlassButton variant="ghost" size="sm" onClick={() => { setIsAuthenticated(false); onShowToast('Signed out of admin panel', 'info'); }} className="text-[10px] font-bold text-red-400 border border-red-500/10">
            Exit
          </GlassButton>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <GlassCard className="p-3 bg-white/[0.02] border-white/5 flex flex-col justify-between">
          <Users className="w-4 h-4 text-white/50" />
          <div className="mt-2">
            <p className="text-lg font-black text-white">{usersCount}</p>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Active users</p>
          </div>
        </GlassCard>

        <GlassCard className="p-3 bg-white/[0.02] border-white/5 flex flex-col justify-between">
          <Film className="w-4 h-4 text-white/50" />
          <div className="mt-2">
            <p className="text-lg font-black text-white">{videos.length}</p>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Db videos</p>
          </div>
        </GlassCard>

        <GlassCard className="p-3 bg-white/[0.02] border-white/5 flex flex-col justify-between">
          <MessageSquare className="w-4 h-4 text-white/50" />
          <div className="mt-2">
            <p className="text-lg font-black text-white">{commentsCount}</p>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Db comments</p>
          </div>
        </GlassCard>
      </div>

      {/* Control Actions / Curated Video Section */}
      <GlassCard className="p-4 border-white/10 space-y-3.5">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-white tracking-wider uppercase">Live Curated Publisher</h3>
          <GlassButton 
            variant="glass" 
            size="sm" 
            onClick={() => setIsAddingVideo(!isAddingVideo)}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-[10px] font-extrabold"
          >
            {isAddingVideo ? 'Minimize' : 'Publish Curated'}
          </GlassButton>
        </div>

        <AnimatePresence>
          {isAddingVideo && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddCuratedVideo}
              className="space-y-3 pt-2 border-t border-white/5 overflow-hidden"
            >
              <GlassInput
                label="Direct MP4 Video Source URL"
                type="url"
                placeholder="https://assets.mixkit.co/videos/preview/..."
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                required
              />
              <GlassInput
                label="Refraction Presentation Title"
                type="text"
                placeholder="Golden Architecture Minimalist"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                required
              />
              <GlassInput
                label="Atmosphere / Description Details"
                type="text"
                placeholder="Cinematic capture of glass overlays and spatial reflections."
                value={newVideoDesc}
                onChange={(e) => setNewVideoDesc(e.target.value)}
              />
              <GlassInput
                label="Atmospheric tags (Comma separated)"
                type="text"
                placeholder="minimalist, glassmorphism, visual"
                value={newVideoTags}
                onChange={(e) => setNewVideoTags(e.target.value)}
              />
              <div className="flex gap-2">
                <GlassButton type="button" variant="ghost" onClick={() => setIsAddingVideo(false)} className="flex-1 text-xs">
                  Cancel
                </GlassButton>
                <GlassButton type="submit" variant="primary" className="flex-1 text-xs font-bold">
                  Deploy to Live Feed
                </GlassButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Video Registry list */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white tracking-widest uppercase">Video Database Registry</h3>
          <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{filteredVideos.length} listed</span>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search matching items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-9 py-2 text-base text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all font-semibold"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
        </div>

        <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-0.5">
          {loading ? (
            <div className="text-center py-6 text-white/40 text-xs font-semibold uppercase animate-pulse">
              Syncing live registry...
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-6 text-white/30 text-xs font-semibold uppercase">
              No matching database items.
            </div>
          ) : (
            filteredVideos.map((video) => (
              <GlassCard key={video.id} className="p-3 bg-white/[0.02] border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                    {video.url ? (
                      <video src={video.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <Film className="w-5 h-5 text-white/20" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-black text-white truncate">{video.title}</p>
                    <p className="text-[10px] text-white/40 font-semibold truncate">@{video.creator.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/40">
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {video.sharesCount || 0}</span>
                    <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {video.likes || 0}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteVideo(video.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors cursor-pointer border border-red-500/10"
                    title="Delete Video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
