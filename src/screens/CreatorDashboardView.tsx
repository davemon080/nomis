/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Eye, Heart, DollarSign, ArrowUpRight, TrendingUp, Sparkles, Award, Film, Users, User, ArrowLeft } from 'lucide-react';
import { ScreenId, Video } from '../types';
import { GlassCard, GlassButton, GlassListTile } from '../components/GlassDesignSystem';
import { mockCreatorAnalytics } from '../data/mockData';
import { auth, getCreatorWatchTime } from '../lib/firebase';
import { VideoThumbnail } from '../components/VideoThumbnail';

interface CreatorDashboardViewProps {
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string) => void;
  videosList?: Video[];
}

export const CreatorDashboardView: React.FC<CreatorDashboardViewProps> = ({
  onNavigate,
  onShowToast,
  videosList
}) => {
  const [activeMetric, setActiveMetric] = useState<'views' | 'likes' | 'watchTime'>('views');
  const [delayedSeconds, setDelayedSeconds] = useState<number>(0);
  const [liveSeconds, setLiveSeconds] = useState<number>(0);
  const [isLoadingWatchTime, setIsLoadingWatchTime] = useState(true);

  // Calculate live views and likes for the current logged in creator
  const userVideosRaw = (videosList || []).filter(v => v.creator?.id === auth.currentUser?.uid);
  const userVideos: Video[] = Array.from(new Map<string, Video>(userVideosRaw.map(v => [v.id, v])).values());
  const liveViewsCount = userVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const liveLikesCount = userVideos.reduce((acc, v) => acc + (v.likes || 0), 0);

  // Fetch real watch time with and without 24-hour delay
  useEffect(() => {
    let active = true;
    const fetchWatchTimes = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        setIsLoadingWatchTime(true);
        const [delayed, live] = await Promise.all([
          getCreatorWatchTime(uid, true),
          getCreatorWatchTime(uid, false)
        ]);
        if (active) {
          setDelayedSeconds(delayed);
          setLiveSeconds(live);
        }
      } catch (err) {
        console.error("Error loading dashboard watch times:", err);
      } finally {
        if (active) {
          setIsLoadingWatchTime(false);
        }
      }
    };

    fetchWatchTimes();
    return () => { active = false; };
  }, [videosList]);

  // Combine simulated historic base with real database watch events
  const baseSimulatedHrs = (liveViewsCount * 12.5) / 60;
  const officialDelayedWatchHrs = baseSimulatedHrs + (delayedSeconds / 3600);
  const actualLiveWatchHrs = baseSimulatedHrs + (liveSeconds / 3600);

  const metricData = mockCreatorAnalytics[activeMetric];

  // Draw custom SVG path coordinates for the graph
  // Map values beautifully within view bounds (e.g., width 300, height 120)
  const maxVal = Math.max(...metricData.chartData.map((d) => d.value));
  const minVal = Math.min(...metricData.chartData.map((d) => d.value));
  const range = maxVal - minVal || 1;

  const points = metricData.chartData
    .map((d, i) => {
      const x = (i / (metricData.chartData.length - 1)) * 300 + 10;
      const y = 110 - ((d.value - minVal) / range) * 80;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${metricData.chartData
    .map((d, i) => {
      const x = (i / (metricData.chartData.length - 1)) * 300 + 10;
      const y = 110 - ((d.value - minVal) / range) * 80;
      return `${x},${y}`;
    })
    .join(' ')} 310,120 10,120`;

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black flex flex-col select-none text-left overflow-hidden">
      {/* Top Fixed Area (Header + Horizontal Scrollable Stats Cards) */}
      <div className="flex-shrink-0 p-6 pb-4 flex flex-col gap-5 border-b border-white/5 bg-black/20 backdrop-blur-md z-30">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('profile')}
              className="p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer mr-1 text-white/70 hover:text-white flex items-center justify-center"
              title="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Award className="w-5 h-5 text-white animate-pulse" />
            <h1 className="text-xl font-black text-white tracking-widest uppercase">CREATOR CENTER</h1>
          </div>
          <div className="flex gap-1.5">
            <GlassButton variant="glass" size="sm" onClick={() => onNavigate('profile')} icon={<User className="w-3.5 h-3.5" />}>
              Profile
            </GlassButton>
            <GlassButton variant="glass" size="sm" onClick={() => onNavigate('wallet')} icon={<DollarSign className="w-3.5 h-3.5" />}>
              Wallet
            </GlassButton>
          </div>
        </div>

        {/* Overview stats cards (Horizontal scroll layout with Views, Likes, Watch Time) */}
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory -mx-6 px-6 scrollbar-none">
        {/* Views statistic */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => {
            setActiveMetric('views');
            onShowToast('Focused Views growth timeline.');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center flex flex-col justify-between h-24 min-w-[135px] flex-1 snap-start
            ${activeMetric === 'views'
              ? 'bg-white/[0.08] border-white/20 shadow-lg'
              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
            }
          `}
        >
          <div className="flex justify-between items-center text-white/50">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[8px] font-bold text-green-400">{mockCreatorAnalytics.views.growth}</span>
          </div>
          <div className="mt-2 text-left">
            <p className="text-base font-black text-white">{liveViewsCount.toLocaleString()}</p>
            <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wide mt-0.5">Views</p>
          </div>
        </motion.div>

        {/* Likes statistic */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => {
            setActiveMetric('likes');
            onShowToast('Focused Likes engagement timeline.');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center flex flex-col justify-between h-24 min-w-[135px] flex-1 snap-start
            ${activeMetric === 'likes'
              ? 'bg-white/[0.08] border-white/20 shadow-lg'
              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
            }
          `}
        >
          <div className="flex justify-between items-center text-white/50">
            <Heart className="w-3.5 h-3.5" />
            <span className="text-[8px] font-bold text-green-400">{mockCreatorAnalytics.likes.growth}</span>
          </div>
          <div className="mt-2 text-left">
            <p className="text-base font-black text-white">{liveLikesCount.toLocaleString()}</p>
            <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wide mt-0.5">Likes</p>
          </div>
        </motion.div>

        {/* Watch Time statistic */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => {
            setActiveMetric('watchTime');
            onShowToast('Focused Watch Time growth timeline (24h delayed update).');
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-center flex flex-col justify-between h-24 min-w-[145px] flex-1 snap-start relative overflow-hidden group
            ${activeMetric === 'watchTime'
              ? 'bg-white/[0.08] border-white/20 shadow-lg'
              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
            }
          `}
        >
          <div className="flex justify-between items-center text-white/50">
            <Star className="w-3.5 h-3.5" />
            <span className="text-[7px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/20 tracking-wider uppercase font-mono scale-90 -mr-1">24h Delay</span>
          </div>
          <div className="mt-2 text-left">
            <p className="text-base font-black text-white">{officialDelayedWatchHrs.toFixed(2)} hrs</p>
            <div className="flex justify-between items-center mt-0.5">
              <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wide">Watch Time</p>
              <span className="text-[8px] text-white/30 group-hover:text-white/65 font-mono transition-colors" title="Real-time watch duration including last 24h">Live: {actualLiveWatchHrs.toFixed(2)}h</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>

    {/* Scrollable Main Content Section (Chart, In-depth insights) */}
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-5 space-y-6 pb-28">
      {/* Analytics Chart (Glassmorphic Glow Custom SVG Line Chart) */}
      <GlassCard className="p-5 border-white/10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-white animate-pulse" />
            <h3 className="text-xs font-bold text-white tracking-widest uppercase">
              {activeMetric === 'watchTime' ? 'Watch Time' : activeMetric} Timeline
            </h3>
          </div>
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
            Weekly Performance
          </span>
        </div>

        {/* Glow Line Graph */}
        <div className="relative h-32 w-full flex items-center justify-center mt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 320 120" preserveAspectRatio="none">
            {/* Ambient Area Fill under line */}
            <motion.polygon
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              points={areaPoints}
              className="fill-white"
            />
            {/* Main high-contrast stroke path */}
            <motion.polyline
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              points={points}
              className="stroke-white"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Vertical grid lines */}
            {metricData.chartData.map((_, i) => (
              <line
                key={i}
                x1={(i / (metricData.chartData.length - 1)) * 300 + 10}
                y1="10"
                x2={(i / (metricData.chartData.length - 1)) * 300 + 10}
                y2="110"
                className="stroke-white/5"
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>

        {/* Chart X labels */}
        <div className="flex justify-between px-2 text-[9px] font-bold text-white/40 uppercase tracking-wider">
          {metricData.chartData.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </GlassCard>

      {/* Videos List Insights */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-white" />
          <h2 className="text-xs font-bold text-white tracking-widest uppercase">Video In-Depth Insights</h2>
        </div>
        <div className="space-y-2.5">
          {userVideos.length === 0 ? (
            <div className="p-6 text-center bg-white/[0.02] border border-white/5 rounded-2xl text-white/40">
              <Film className="w-6 h-6 mx-auto mb-2 text-white/20 animate-pulse" />
              <p className="text-[11px] font-bold tracking-wider uppercase">No Visual Uploads</p>
              <p className="text-[10px] text-white/30 mt-1 max-w-xs mx-auto">
                Share your first loop to unlock real-time analytic dimensions.
              </p>
            </div>
          ) : (
            userVideos.map((video) => (
              <GlassListTile
                key={video.id}
                onClick={() => onNavigate('home', { activeVideoId: video.id })}
                icon={
                  <div className="w-12 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 shadow-md">
                    <VideoThumbnail 
                      videoUrl={video.url} 
                      videoId={video.id} 
                      fallbackUrl={video.creator?.coverPhoto || video.creator?.avatar}
                      className="w-full h-full object-cover"
                    />
                  </div>
                }
                title={video.title}
                subtitle={`${video.likes} likes • ${video.commentsCount} comments`}
                rightElement={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowToast(`Inspecting deep statistics for ${video.title}`);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  </div>
);
};
