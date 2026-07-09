/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Ghost, 
  MessageSquare, 
  MessageCircle, 
  RotateCw, 
  Send, 
  Camera, 
  Sliders, 
  Trash2, 
  Plus, 
  Link2,
  Share2
} from 'lucide-react';
import { ScreenId, Creator, Video } from '../types';
import { auth, db, deleteVideoFromDb } from '../lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  video?: Video;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  isOpen,
  onClose,
  videoTitle,
  video,
  onNavigate,
  onShowToast
}) => {
  const [creators, setCreators] = useState<any[]>([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, 'users'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: any[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        // Exclude current user from quick share list
        if (docSnap.id !== auth.currentUser?.uid) {
          loaded.push({
            id: docSnap.id,
            name: d.name || 'Nomis Creator',
            username: d.username || 'user',
            avatar: d.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80'
          });
        }
      });
      setCreators(loaded);
    }, (error) => {
      console.warn("ShareSheet user fetch failed:", error);
    });
    return unsubscribe;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    onShowToast('Video share link copied to clipboard!', 'success');
    onClose();
  };

  const handleQuickSend = (username: string) => {
    onShowToast(`Video successfully sent to @${username}!`, 'success');
    onClose();
  };

  const isOwner = auth.currentUser && video && video.creator && video.creator.id === auth.currentUser.uid;

  const handleAction = async (actionType: string) => {
    onClose();
    if (actionType === 'delete') {
      if (!video) return;
      const confirmDelete = window.confirm("Are you sure you want to delete this visual work from your profile?");
      if (!confirmDelete) return;
      try {
        await deleteVideoFromDb(video.id);
        onShowToast('Video deleted successfully!', 'success');
      } catch (err) {
        console.error("Failed to delete video:", err);
        onShowToast('Failed to delete video.', 'error');
      }
    } else {
      onShowToast(`Executing ${actionType}...`, 'info');
    }
  };

  // Filtering direct message recipients
  const filteredCreators = creators.filter(creator => {
    if (!searchQuery) return true;
    return (
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const socialShares = [
    { 
      name: 'WhatsApp', 
      bgColor: 'bg-[#25D366]', 
      icon: (
        <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.59 2.002 14.111 1 11.48 1c-5.437 0-9.863 4.374-9.868 9.802-.001 1.77.463 3.5 1.34 5.03l-.997 3.641 3.734-.978zM17.13 15.31c-.3-.15-1.771-.875-2.046-.975-.275-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-3.51-1.747-4.14-2.227-4.84-3.425-.15-.25-.015-.39.12-.525.12-.12.275-.32.415-.48.14-.16.19-.27.285-.45.095-.18.047-.34-.023-.49-.07-.15-.675-1.625-.925-2.225-.244-.589-.491-.51-.675-.52-.174-.01-.374-.012-.574-.012s-.525.075-.8.375c-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.112 4.522.714.31 1.272.496 1.707.635.717.227 1.37.195 1.885.118.574-.085 1.771-.725 2.021-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z"/>
        </svg>
      ), 
      action: () => { onShowToast('Opening WhatsApp share...', 'info'); onClose(); } 
    },
    { 
      name: 'X', 
      bgColor: 'bg-black border border-white/20', 
      icon: (
        <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ), 
      action: () => { onShowToast('Opening X (Twitter) share...', 'info'); onClose(); } 
    },
    { 
      name: 'Instagram', 
      bgColor: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', 
      icon: (
        <svg className="w-5 h-5 text-white fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      ), 
      action: () => { onShowToast('Opening Instagram share...', 'info'); onClose(); } 
    },
    { 
      name: 'Snapchat', 
      bgColor: 'bg-[#FFFC00]', 
      icon: (
        <svg className="w-5 h-5 text-black fill-current" viewBox="0 0 24 24">
          <path d="M12 2c-3.9 0-7 2.1-7 5.3 0 .7.1 1.4.4 2 .1.3-.1.6-.4.8-1 .7-2 1.9-2 3.4 0 1.5 1.1 2.5 2.3 2.9.4.1.6.4.5.8-.2.7-.4 1.7-.4 2.8 0 .8.6 1.4 1.4 1.4.3 0 .6-.1.8-.3 1-1 2.3-1.6 3.7-1.8.3 0 .5.2.5.5.1 1 .5 1.7 1.2 1.7s1.1-.7 1.2-1.7c0-.3.2-.5.5-.5 1.4.2 2.7.8 3.7 1.8.2.2.5.3.8.3.8 0 1.4-.6 1.4-1.4 0-1.1-.2-2.1-.4-2.8-.1-.4.1-.7.5-.8 1.2-.4 2.3-1.4 2.3-2.9 0-1.5-1-2.7-2-3.4-.3-.2-.5-.5-.4-.8.3-.6.4-1.3.4-2 0-3.2-3.1-5.3-7-5.3z" />
        </svg>
      ), 
      action: () => { onShowToast('Opening Snapchat...', 'info'); onClose(); } 
    },
    { 
      name: 'WA Business', 
      bgColor: 'bg-[#128C7E]', 
      icon: (
        <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
          <path d="M12 .01C5.397.01.06 5.348.06 11.954c0 2.1.547 4.142 1.587 5.946L.057 24l6.329-1.687c1.744.952 3.712 1.453 5.717 1.454 6.613 0 11.949-5.34 11.953-11.997a11.9 11.9 0 00-3.505-8.484A11.9 11.9 0 0012 .01zm0 21.8c-1.637-.002-3.225-.501-4.825-1.451l-.523-.312-3.734.978.997-3.641-.341-.543A9.79 9.79 0 012.23 11.8c.005-5.428 4.431-9.802 9.868-9.802 2.631 0 5.11 1.002 6.973 2.87 1.862 1.869 2.887 4.34 2.885 6.97-.004 5.429-4.428 9.799-9.864 9.799z" />
          <text x="12" y="15" fontSize="9" fontWeight="900" textAnchor="middle" fill="white" fontFamily="sans-serif">B</text>
        </svg>
      ), 
      action: () => { onShowToast('Opening WA Business...', 'info'); onClose(); } 
    },
    { 
      name: 'Messenger', 
      bgColor: 'bg-[#0084FF]', 
      icon: (
        <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.5 2 2 6.1 2 11.1c0 2.9 1.5 5.4 3.9 7l-.3 2.7c0 .2.2.4.4.3l3-1.6c1 .3 2 .4 3 .4 5.5 0 10-4.1 10-9.1S17.5 2 12 2zm1.2 11.6l-2.6-2.8-5 2.8 5.5-5.8 2.6 2.8 5-2.8-5.5 5.8z" />
        </svg>
      ), 
      action: () => { onShowToast('Opening Messenger...', 'info'); onClose(); } 
    },
    { 
      name: 'Facebook', 
      bgColor: 'bg-[#1877F2]', 
      icon: (
        <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ), 
      action: () => { onShowToast('Opening Facebook share...', 'info'); onClose(); } 
    }
  ];

  const actionControls = [
    { name: 'Photo', icon: <Camera className="w-5 h-5 text-white" />, action: () => handleAction('Photo') },
    { name: 'Share as GIF', icon: <span className="text-[10px] font-black tracking-widest text-white">GIF</span>, action: () => handleAction('Share as GIF') },
    { name: 'Ad settings', icon: <Sliders className="w-5 h-5 text-white" />, action: () => handleAction('Ad settings') },
    ...(isOwner ? [{ name: 'Delete', icon: <Trash2 className="w-5 h-5 text-red-500 animate-pulse" />, action: () => handleAction('delete'), isDanger: true }] : []),
    { name: 'Manage keywords', icon: <Search className="w-5 h-5 text-white" />, action: () => handleAction('Manage keywords') },
    { name: 'Add to Story', icon: <Plus className="w-5 h-5 text-white" />, action: () => handleAction('Add to Story') },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          />

          {/* TikTok-Style Bottom Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 210 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 border-t border-white/10 rounded-t-[2rem] flex flex-col backdrop-blur-3xl shadow-[0_-15px_45px_rgba(0,0,0,0.85)] max-h-[85vh] pb-8 overflow-hidden"
          >
            {/* Handle Drag Bar indicator */}
            <div className="flex justify-center py-3.5 cursor-pointer select-none" onClick={onClose}>
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header layout: Search button, Title, Close Button */}
            <div className="flex items-center justify-between px-6 pb-4">
              <button 
                onClick={() => setShowSearchInput(!showSearchInput)} 
                className={`p-1.5 rounded-full hover:bg-white/5 transition-all cursor-pointer ${showSearchInput ? 'text-[#FE2C55]' : 'text-white/70'}`}
              >
                <Search className="w-5 h-5" />
              </button>
              
              <h2 className="text-base font-extrabold text-white tracking-wide text-center">
                Send to
              </h2>

              <button 
                onClick={onClose} 
                className="p-1.5 rounded-full hover:bg-white/5 text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box (toggled) */}
            <AnimatePresence>
              {showSearchInput && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 mb-4 overflow-hidden"
                >
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search friends by name or username..."
                      className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-9 pr-12 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FE2C55]/50 transition-all"
                      autoFocus
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')} 
                        className="absolute right-3.5 text-xs text-white/45 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable Container containing TikTok Rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
              
              {/* Row 1: Send to Creators list */}
              <div className="px-2">
                {filteredCreators.length === 0 ? (
                  <div className="px-4 py-2 text-center text-xs text-white/30">
                    {searchQuery ? 'No creators found matching search' : 'No creators found'}
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none">
                    {filteredCreators.map((creator) => (
                      <motion.button
                        key={creator.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickSend(creator.username)}
                        className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group"
                      >
                        <div className="relative">
                          <img 
                            src={creator.avatar} 
                            className="w-13 h-13 rounded-full object-cover border-2 border-white/5 group-hover:border-white/20 transition-all" 
                            alt={creator.name} 
                          />
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-neutral-950 shadow-md" />
                        </div>
                        <span className="text-[10px] font-bold text-white/75 group-hover:text-white max-w-[65px] truncate text-center mt-1">
                          {creator.name.split(' ')[0]}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row Separator */}
              <div className="border-t border-white/5 mx-6" />

              {/* Row 2: Share to Apps list */}
              <div className="px-2">
                <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none">
                  {socialShares.map((app, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={app.action}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
                    >
                      <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg group-hover:brightness-110 transition-all ${app.bgColor}`}>
                        {app.icon}
                      </div>
                      <span className="text-[10px] font-bold text-white/55 group-hover:text-white/80 max-w-[70px] leading-tight text-center truncate">
                        {app.name}
                      </span>
                    </motion.button>
                  ))}
                  
                  {/* Plus share button to mimic full systems share */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyLink}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
                  >
                    <div className="w-13 h-13 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shadow-lg group-hover:bg-zinc-700 transition-all">
                      <Link2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-white/55 group-hover:text-white/80 max-w-[70px] leading-tight text-center truncate">
                      Copy link
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Row Separator */}
              <div className="border-t border-white/5 mx-6" />

              {/* Row 3: Action controls */}
              <div className="px-2">
                <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none">
                  {actionControls.map((act, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={act.action}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
                    >
                      <div className={`w-13 h-13 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center shadow-md group-hover:bg-zinc-700/80 transition-all`}>
                        {act.icon}
                      </div>
                      <span className={`text-[10px] font-bold leading-tight text-center max-w-[75px] ${act.isDanger ? 'text-red-400 group-hover:text-red-300' : 'text-white/55 group-hover:text-white/80'}`}>
                        {act.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
