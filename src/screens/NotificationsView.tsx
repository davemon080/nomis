/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Heart, MessageSquare, UserPlus, ShieldAlert, Sparkles, AlertCircle, CircleCheck, Wallet, AtSign } from 'lucide-react';
import { ScreenId, NotificationItem } from '../types';
import { mockNotifications } from '../data/mockData';
import { GlassListTile, GlassButton, GlassChip, GlassAvatar } from '../components/GlassDesignSystem';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { auth, db, toggleFollowCreatorInDb } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface NotificationsViewProps {
  onNavigate: (screen: ScreenId, params?: any) => void;
  onShowToast: (message: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onNavigate,
  onShowToast
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mentions' | 'monetization'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setNotifications(mockNotifications);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          type: data.type || 'system',
          recipientId: data.recipientId,
          sender: data.sender,
          message: data.message || '',
          isRead: data.isRead ?? false,
          timestamp: data.createdAt ? new Date(data.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now',
          actionText: data.actionText,
          videoId: data.videoId,
          videoThumbnail: data.videoThumbnail
        });
      });

      if (items.length === 0) {
        setNotifications(mockNotifications);
      } else {
        setNotifications(items);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Could not load real-time notifications, using mock notifications:", error);
      setNotifications(mockNotifications);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleMarkAllRead = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onShowToast('All notifications marked as read.');
      return;
    }

    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      for (const item of unreadNotifications) {
        if (item.id && !item.id.startsWith('n')) {
          await updateDoc(doc(db, 'notifications', item.id), { isRead: true });
        }
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onShowToast('All notifications marked as read.');
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const handleActionClick = async (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      onShowToast('Please log in to follow creators.');
      return;
    }

    if (item.actionText === 'Follow Back' && item.sender?.id) {
      try {
        await toggleFollowCreatorInDb(currentUser.uid, item.sender.id, false);
        onShowToast(`Followed @${item.sender.username} back!`);
        
        if (item.id && !item.id.startsWith('n')) {
          await updateDoc(doc(db, 'notifications', item.id), { actionText: 'Following' });
        } else {
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, actionText: 'Following' } : n))
          );
        }
      } catch (err) {
        console.error("Error following back creator:", err);
      }
    } else if (item.actionText === 'Open Wallet') {
      onNavigate('wallet');
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.id && !item.id.startsWith('n')) {
      try {
        await updateDoc(doc(db, 'notifications', item.id), { isRead: true });
      } catch (err) {
        console.warn("Could not mark notification as read in database:", err);
      }
    } else {
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    }
    
    if (item.type === 'like' || item.type === 'comment' || item.type === 'mention') {
      if (item.videoId) {
        onNavigate('home', { activeVideoId: item.videoId });
        onShowToast('Opening post details.');
      } else {
        onNavigate('home');
        onShowToast('Navigating to feed.');
      }
    } else if (item.type === 'follow' && item.sender?.id) {
      onNavigate('creator-profile', { creatorId: item.sender.id });
    } else if (item.type === 'monetization') {
      onNavigate('wallet');
    } else {
      onShowToast('System notification checked.');
    }
  };

  const handleFilterChange = (filter: 'all' | 'mentions' | 'monetization') => {
    setActiveFilter(filter);
    onShowToast(`Filtering notifications: ${filter}`);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'mentions') return n.type === 'mention' || n.type === 'comment';
    if (activeFilter === 'monetization') return n.type === 'monetization';
    return true;
  });

  const getNotificationIcon = (type: NotificationItem['type']) => {
    const iconBase = 'w-5 h-5';
    switch (type) {
      case 'like':
        return <Heart className={`${iconBase} text-red-500 fill-red-500`} />;
      case 'comment':
        return <MessageSquare className={`${iconBase} text-purple-400`} />;
      case 'mention':
        return <AtSign className={`${iconBase} text-pink-400`} />;
      case 'follow':
        return <UserPlus className={`${iconBase} text-blue-400`} />;
      case 'monetization':
        return <Wallet className={`${iconBase} text-emerald-400`} />;
      case 'system':
        return <ShieldAlert className={`${iconBase} text-amber-500`} />;
      case 'announcement':
        return <Sparkles className={`${iconBase} text-yellow-400 animate-pulse`} />;
      default:
        return <Bell className={`${iconBase} text-white/50`} />;
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar select-none pb-24 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-white" />
          <h1 className="text-xl font-black text-white tracking-widest uppercase">ALERT CENTER</h1>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-wider select-none cursor-pointer"
        >
          Mark all as read
        </button>
      </div>

      {/* Filter Horizontal Tabs */}
      <div className="flex gap-2 flex-shrink-0">
        <GlassChip label="All Alerts" active={activeFilter === 'all'} onClick={() => handleFilterChange('all')} />
        <GlassChip label="Mentions" active={activeFilter === 'mentions'} onClick={() => handleFilterChange('mentions')} />
        <GlassChip label="Monetization" active={activeFilter === 'monetization'} onClick={() => handleFilterChange('monetization')} />
      </div>

      {/* Interactive alerts list */}
      <div className="space-y-3 flex-1">
        <AnimatePresence initial={false}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleNotificationClick(item)}
                className={`
                  relative rounded-2xl p-4 border border-white/[0.06] backdrop-blur-md flex items-start gap-4 transition-all duration-300 group cursor-pointer
                  ${item.isRead
                    ? 'bg-white/[0.01] hover:bg-white/[0.04]'
                    : 'bg-white/[0.05] border-white/15 shadow-[0_4px_20px_rgba(255,255,255,0.05)] hover:bg-white/[0.08]'
                  }
                `}
              >
                {/* Unread pulsing indicator dot */}
                {!item.isRead && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-ping" />
                )}

                {/* Left Element: Sender avatar or Category vector icon */}
                <div className="flex-shrink-0">
                  {item.sender ? (
                    <GlassAvatar src={item.sender.avatar} name={item.sender.name} size="sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      {getNotificationIcon(item.type)}
                    </div>
                  )}
                </div>

                {/* Center text context */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.sender ? (
                      <span className="text-xs font-bold text-white tracking-wide">
                        {item.sender.name}
                        <span className="text-[10px] text-white/50 font-medium pl-1.5">@{item.sender.username}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-extrabold text-white uppercase tracking-wider">Nomis Platform</span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed mt-1">{item.message}</p>
                  <span className="text-[9px] font-semibold text-white/30 block mt-2 tracking-wide uppercase">
                    {item.timestamp}
                  </span>
                </div>

                {/* Right Element: Follow back action button or video mini-thumbnail */}
                {item.actionText && (
                  <div className="flex-shrink-0 pl-2">
                    <GlassButton
                      variant={item.actionText === 'Following' ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={(e) => handleActionClick(e, item)}
                      className="text-[10px] py-1.5 px-3 rounded-lg font-bold"
                    >
                      {item.actionText}
                    </GlassButton>
                  </div>
                )}

                {item.videoThumbnail && (
                  <div className="flex-shrink-0 pl-2 rounded-lg overflow-hidden border border-white/10 w-9 h-12">
                    <VideoThumbnail
                      videoId={item.videoId}
                      videoUrl={item.videoThumbnail}
                      fallbackUrl={item.videoThumbnail}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] mt-4">
              <CircleCheck className="w-10 h-10 text-white/20 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Zero Alerts</h3>
              <p className="text-xs text-white/40 max-w-xs mt-1">
                You have no new notifications. All activities are up to date!
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
