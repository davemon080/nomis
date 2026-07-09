/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Heart, MessageSquare, ShieldAlert, X } from 'lucide-react';
import { Comment } from '../types';
import { mockComments } from '../data/mockData';
import { GlassBottomSheet, GlassAvatar, GlassButton } from './GlassDesignSystem';
import { auth, db, addCommentToDb, toggleLikeCommentInDb, addCommentReplyToDb } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';

// Nested comment replies rendering component
const CommentRepliesList: React.FC<{ videoId: string; commentId: string }> = ({ videoId, commentId }) => {
  const [replies, setReplies] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [repliesCount, setRepliesCount] = useState<number | null>(null);

  // Unconditional live-updating count of replies on mount
  useEffect(() => {
    if (!videoId || !commentId) return;
    const repliesRef = collection(db, 'videos', videoId, 'comments', commentId, 'replies');
    const unsubscribe = onSnapshot(repliesRef, (snapshot) => {
      setRepliesCount(snapshot.size);
    });
    return unsubscribe;
  }, [videoId, commentId]);

  // Lazy subscription to actual replies documents on expand
  useEffect(() => {
    if (!expanded || !videoId || !commentId) return;

    const repliesRef = collection(db, 'videos', videoId, 'comments', commentId, 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: any[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReplies(loaded);
    });

    return unsubscribe;
  }, [expanded, videoId, commentId]);

  if (!expanded) {
    const displayCount = repliesCount !== null ? repliesCount : 0;
    if (displayCount === 0) return null;
    return (
      <button 
        onClick={() => setExpanded(true)}
        className="text-[10px] text-white/40 hover:text-white font-bold flex items-center gap-1 mt-1.5 transition-all text-left"
      >
        <span>── View replies ({displayCount})</span>
      </button>
    );
  }

  return (
    <div className="pl-5 mt-2 space-y-2.5 border-l border-white/10">
      {replies.map((reply) => (
        <div key={reply.id} className="flex items-start gap-2.5 text-left">
          <GlassAvatar src={reply.user?.avatar} name={reply.user?.name} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-bold text-white/90">{reply.user?.name}</span>
              <span className="text-[9px] text-white/40">@{reply.user?.username}</span>
            </div>
            <p className="text-[10px] text-white/80 mt-0.5 leading-relaxed">{reply.text}</p>
          </div>
        </div>
      ))}
      <button 
        onClick={() => setExpanded(false)}
        className="text-[9px] text-white/40 hover:text-white font-bold text-left block pt-1"
      >
        Hide replies
      </button>
    </div>
  );
};

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  commentsCount: number;
  onUpdateCommentsCount: (newCount: number) => void;
  videoId?: string;
  onRequireAuth?: (callback: () => void) => void;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  isOpen,
  onClose,
  commentsCount,
  onUpdateCommentsCount,
  videoId = 'v1',
  onRequireAuth
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  // Current user's high fidelity profile image / name state
  const [currentUserProfile, setCurrentUserProfile] = useState<{ name: string; avatar: string } | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user && isOpen) {
      // 1. Try local storage cache
      const cached = localStorage.getItem(`profile_${user.uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.avatar) {
            setCurrentUserProfile({ name: parsed.name || user.displayName || 'Nomis Member', avatar: parsed.avatar });
            return;
          }
        } catch (e) {
          console.warn(e);
        }
      }
      
      // 2. Fetch from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentUserProfile({
            name: data.name || user.displayName || 'Nomis Member',
            avatar: data.avatar || user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80'
          });
        } else {
          setCurrentUserProfile({
            name: user.displayName || 'Nomis Member',
            avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80'
          });
        }
      }).catch(() => {
        setCurrentUserProfile({
          name: user.displayName || 'Nomis Member',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80'
        });
      });
    } else {
      setCurrentUserProfile(null);
    }
  }, [isOpen]);

  // Replies states
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyToUsername, setReplyToUsername] = useState<string | null>(null);

  // Load comments live from Firestore if open
  useEffect(() => {
    if (!isOpen || !videoId) return;

    setLoading(true);
    const commentsCol = collection(db, 'videos', videoId, 'comments');
    const q = query(commentsCol, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const loadedComments: Comment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedComments.push({
            id: docSnap.id,
            user: data.user || { name: 'Nomis Creator', username: 'user', avatar: '' },
            text: data.text || '',
            timestamp: data.timestamp || 'Just now',
            likes: data.likes || 0,
            isLiked: data.isLiked || false
          });
        });
        setComments(loadedComments);
      } else {
        setComments([]);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Firestore comments listener error (using empty comments):", error);
      setComments([]);
      setLoading(false);
    });

    return unsubscribe;
  }, [isOpen, videoId]);

  const handleLikeComment = (commentId: string, currentlyLiked: boolean) => {
    const action = async () => {
      // Optimistic local state update
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            const isLiked = !c.isLiked;
            return {
              ...c,
              isLiked,
              likes: isLiked ? c.likes + 1 : c.likes - 1
            };
          }
          return c;
        })
      );

      if (auth.currentUser) {
        await toggleLikeCommentInDb(videoId, commentId, auth.currentUser.uid, currentlyLiked);
      }
    };

    if (onRequireAuth) {
      onRequireAuth(action);
    } else {
      action();
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const action = async () => {
      const user = auth.currentUser;
      const userName = currentUserProfile?.name || user?.displayName || 'Nomis Member';
      const userAvatar = currentUserProfile?.avatar || user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80';

      try {
        if (replyToCommentId) {
          // Replying to a comment
          await addCommentReplyToDb(videoId, replyToCommentId, user?.uid || 'anon', userName, userAvatar, newCommentText);
          setReplyToCommentId(null);
          setReplyToUsername(null);
          setNewCommentText('');
          onUpdateCommentsCount(commentsCount + 1);
        } else {
          // Top-level comment
          const addedComment = await addCommentToDb(videoId, user?.uid || 'anon', userName, userAvatar, newCommentText);
          setComments(prev => prev.some(c => c.id === addedComment.id) ? prev : [addedComment, ...prev]);
          setNewCommentText('');
          onUpdateCommentsCount(commentsCount + 1);
        }
      } catch (err) {
        console.error("Error writing comment to database:", err);
      }
    };

    if (onRequireAuth) {
      onRequireAuth(action);
    } else {
      await action();
    }
  };


  return (
    <GlassBottomSheet isOpen={isOpen} onClose={onClose} title={`Comments (${commentsCount})`}>
      <div className="flex flex-col h-full min-h-[400px] pb-6">
        {/* Comments list */}
        <div className="flex-1 space-y-4 mb-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
          {loading ? (
            <div className="space-y-4 pr-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3.5 p-1 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-2 text-left">
                    <div className="flex items-baseline gap-2">
                      <div className="h-3 w-20 bg-white/10 rounded" />
                      <div className="h-2.5 w-16 bg-white/5 rounded" />
                    </div>
                    <div className="h-3 w-5/6 bg-white/10 rounded" />
                    <div className="h-3 w-1/2 bg-white/10 rounded" />
                    <div className="h-2.5 w-12 bg-white/5 rounded mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5">
                  <MessageSquare className="w-8 h-8 text-white/15" />
                  <div>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-wider">No comments yet</p>
                    <p className="text-[10px] text-white/35 max-w-xs mt-1">Be the first to share your thoughts on this visual creation!</p>
                  </div>
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col p-1 text-left"
                  >
                    <div className="flex items-start gap-3.5">
                      <GlassAvatar src={comment.user.avatar} name={comment.user.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-white tracking-wide">{comment.user.name}</span>
                          <span className="text-[10px] text-white/40">@{comment.user.username}</span>
                        </div>
                        <p className="text-xs text-white/85 leading-relaxed mt-1">{comment.text}</p>
                        <div className="flex items-center gap-4 mt-2.5">
                          <span className="text-[10px] text-white/30">{comment.timestamp}</span>
                          <button
                            onClick={() => {
                              setReplyToCommentId(comment.id);
                              setReplyToUsername(comment.user.username);
                            }}
                            className="text-[10px] text-white/40 hover:text-white font-semibold uppercase tracking-wider"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Comment nested replies */}
                        <CommentRepliesList videoId={videoId} commentId={comment.id} />
                      </div>

                      {/* Like button */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <motion.button
                          whileTap={{ scale: 1.3 }}
                          onClick={() => handleLikeComment(comment.id, comment.isLiked || false)}
                          className={`p-1.5 rounded-full hover:bg-white/5 transition-colors ${comment.isLiked ? 'text-red-500' : 'text-white/40'}`}
                        >
                          <Heart className="w-3.5 h-3.5" fill={comment.isLiked ? 'currentColor' : 'none'} />
                        </motion.button>
                        <span className="text-[9px] font-semibold text-white/40">{comment.likes}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Reply input bar (Glassmorphic) */}
        <form onSubmit={handleSendComment} className="relative mt-auto">
          {replyToCommentId && (
            <div className="flex items-center justify-between bg-white/[0.05] border border-white/10 px-3 py-1.5 rounded-xl mb-2 text-[10px] text-white/70">
              <span>Replying to <strong className="text-white">@{replyToUsername}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setReplyToCommentId(null);
                  setReplyToUsername(null);
                }}
                className="text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {!auth.currentUser && (
            <div className="absolute -top-10 inset-x-0 flex items-center justify-center gap-1.5 text-[10px] font-bold text-yellow-400 uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 py-1.5 rounded-xl px-3 backdrop-blur-md">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Authentication required to participate</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-2xl bg-white/[0.04] dark:bg-black/[0.2] border border-white/[0.12] focus-within:border-white/35 transition-all duration-300 backdrop-blur-md p-1.5 pl-3">
            {auth.currentUser && (
              <GlassAvatar 
                src={currentUserProfile?.avatar || auth.currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80'} 
                name={currentUserProfile?.name || auth.currentUser?.displayName || 'Nomis Creator'} 
                size="xs" 
                className="shrink-0 ring-1 ring-white/10"
              />
            )}
            <input
              type="text"
              placeholder={auth.currentUser ? (replyToCommentId ? `Write a reply to @${replyToUsername}...` : "Add your comment to Nomis...") : "Sign in to join discussion..."}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 bg-transparent border-none text-base text-white placeholder-white/30 focus:outline-none py-2 pr-2"
            />
            <GlassButton
              type="submit"
              variant="primary"
              size="icon"
              disabled={!newCommentText.trim()}
              className="h-8 w-8 rounded-xl flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </GlassButton>
          </div>
        </form>
      </div>
    </GlassBottomSheet>
  );
};
