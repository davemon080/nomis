/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Sparkles, User, FileText, ArrowRight, ArrowLeft, Check, AlertCircle, Loader } from 'lucide-react';
import { ScreenId } from '../types';
import { GlassCard, GlassButton, GlassInput, GlassAvatar } from '../components/GlassDesignSystem';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

interface UserOnboardingViewProps {
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const PRESET_AVATARS = [
  { id: 'avatar-1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80', label: 'Sunset' },
  { id: 'avatar-2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80', label: 'Cyber' },
  { id: 'avatar-3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80', label: 'Glass' },
  { id: 'avatar-4', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&q=80', label: 'Neon' }
];

export const UserOnboardingView: React.FC<UserOnboardingViewProps> = ({ onNavigate, onShowToast }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [loading, setLoading] = useState(false);

  // Get current auth user
  const user = auth.currentUser;

  // Slide 1: Profile Image and Display Name
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [customFileLoading, setCustomFileLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  // Slide 2: Bio
  const [bio, setBio] = useState('');

  // Slide 3: Username
  const [username, setUsername] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Set default email-based username guess and name guess on mount
  useEffect(() => {
    if (user) {
      if (user.email && !username) {
        const emailUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsername(emailUsername);
      }
      if (user.displayName && !displayName) {
        setDisplayName(user.displayName);
      }
    }
  }, [user]);

  // Handle local image file upload and conversion to Base64 with simulated progress bar
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onShowToast('File size must be under 2MB.', 'error');
      return;
    }

    setCustomFileLoading(true);
    setUploadProgress(0);

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += Math.floor(Math.random() * 20) + 15;
      if (currentProg >= 100) {
        currentProg = 100;
        clearInterval(interval);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarUrl(reader.result as string);
          setCustomFileLoading(false);
          setUploadProgress(0);
          onShowToast('Avatar uploaded successfully!', 'success');
        };
        reader.onerror = () => {
          setCustomFileLoading(false);
          setUploadProgress(0);
          onShowToast('Failed to process image file.', 'error');
        };
        reader.readAsDataURL(file);
      } else {
        setUploadProgress(currentProg);
      }
    }, 80);
  };

  // Check unique username availability in Firestore
  const checkUsernameUniqueness = async (val: string): Promise<boolean> => {
    if (!val) return false;
    const cleanVal = val.trim().toLowerCase();
    if (cleanVal.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return false;
    }
    if (!/^[a-z0-9_]+$/.test(cleanVal)) {
      setUsernameError('Use only lowercase letters, numbers, and underscores.');
      return false;
    }

    setUsernameChecking(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', cleanVal));
      const snapshot = await getDocs(q);
      
      // Filter out own existing doc in case they are re-submitting
      const isTaken = snapshot.docs.some(doc => doc.id !== user?.uid);
      if (isTaken) {
        setUsernameError('Username is already taken by another creator.');
        return false;
      } else {
        setUsernameError('');
        return true;
      }
    } catch (err) {
      console.warn("Uniqueness check offline - allowed fallback:", err);
      setUsernameError('');
      return true;
    } finally {
      setUsernameChecking(false);
    }
  };

  // Auto-check username as user types (debounced or on change)
  useEffect(() => {
    if (currentSlide === 3 && username) {
      const delay = setTimeout(() => {
        checkUsernameUniqueness(username);
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [username, currentSlide]);

  const handleNext = async (isSkipping: boolean = false) => {
    if (currentSlide < 3) {
      if (currentSlide === 1 && !displayName.trim()) {
        onShowToast('Please provide your Display Name to continue.', 'error');
        return;
      }
      setCurrentSlide(prev => prev + 1);
    } else {
      let finalUsername = username.trim().toLowerCase();
      // Validate Slide 3 if they didn't skip
      if (!isSkipping) {
        if (!finalUsername) {
          setUsernameError('Please select a unique username.');
          return;
        }
        const isUnique = await checkUsernameUniqueness(finalUsername);
        if (!isUnique) return;
      } else {
        // If skipping, auto-assign a clean username
        finalUsername = (user?.email ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : 'user') + '_' + Math.floor(Math.random() * 1000);
      }

      // Submit all info to Firestore
      if (!user) {
        onShowToast('User session expired. Please sign in again.', 'error');
        onNavigate('profile');
        return;
      }

      setLoading(true);
      const profileData = {
        uid: user.uid,
        name: displayName.trim() || user.displayName || 'Nomis Creator',
        username: finalUsername,
        avatar: avatarUrl,
        coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=300&fit=crop&q=80',
        bio: bio.trim() || 'Exploring the Nomis visual revolution! ⚡',
        followersCount: '0',
        followingCount: '0',
        totalLikes: '0',
        isFollowing: false,
        isVerified: false,
        isMonetized: false, // Newly signed up accounts start un-monetized
        isOnboarded: true,
        email: user.email,
        createdAt: new Date().toISOString()
      };

      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, profileData, { merge: true });

        localStorage.setItem(`onboarded_${user.uid}`, 'true');
        localStorage.setItem(`profile_${user.uid}`, JSON.stringify({
          id: user.uid,
          name: profileData.name,
          username: profileData.username,
          avatar: profileData.avatar,
          coverPhoto: profileData.coverPhoto,
          bio: profileData.bio,
          followersCount: '0',
          followingCount: '0',
          totalLikes: '0',
          isFollowing: false,
          isVerified: false,
          isMonetized: false
        }));

        onShowToast('Welcome to the Nomis revolution!', 'success');
        onNavigate('profile'); // Let non-monetized land on their profile screen instead of dashboard!
      } catch (err) {
        console.warn('Offline saving onboarding data to localStorage fallback:', err);
        localStorage.setItem(`onboarded_${user.uid}`, 'true');
        localStorage.setItem(`profile_${user.uid}`, JSON.stringify({
          id: user.uid,
          name: profileData.name,
          username: profileData.username,
          avatar: profileData.avatar,
          coverPhoto: profileData.coverPhoto,
          bio: profileData.bio,
          followersCount: '0',
          followingCount: '0',
          totalLikes: '0',
          isFollowing: false,
          isVerified: false,
          isMonetized: false
        }));
        
        onShowToast('Welcome to the Nomis revolution! (Saved Offline)', 'success');
        onNavigate('profile'); // Land on profile
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentSlide > 1) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-neutral-950 via-zinc-900 to-black p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar select-none">
      {/* Top Banner Indicator */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF3B30] animate-pulse" />
          <span className="text-[10px] font-extrabold text-white/50 tracking-widest uppercase">Creator Initialization</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === currentSlide
                  ? 'w-6 bg-gradient-to-r from-[#FF3B30] to-[#FF9F0A]'
                  : step < currentSlide
                  ? 'w-1.5 bg-green-500'
                  : 'w-1.5 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Slides Content */}
      <div className="my-auto max-w-sm w-full mx-auto py-6">
        <AnimatePresence mode="wait">
          {currentSlide === 1 && (
            <motion.div
              key="slide-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">CHOOSE YOUR AVATAR</h2>
                <p className="text-xs text-white/55">Refract your identity with a clean design asset.</p>
              </div>

              {/* Profile Image Preview */}
              <div className="relative mx-auto w-32 h-32 group z-10 flex items-center justify-center">
                {/* SVG Rainbow circular progress bar */}
                <svg className="absolute w-32 h-32 transform -rotate-90 z-0">
                  <defs>
                    <linearGradient id="rainbowAvatarGradOnboarding" x1="0%" y1="0%" x2="100%" y2="100%">
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
                    className="stroke-[url(#rainbowAvatarGradOnboarding)] transition-all duration-300 ease-out"
                    strokeWidth="3.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 58}
                    strokeDashoffset={2 * Math.PI * 58 - ((customFileLoading ? uploadProgress || 5 : 0) / 100) * 2 * Math.PI * 58}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Inner Avatar wrapper */}
                <div className={`relative z-10 rounded-full overflow-hidden p-0.5 bg-black/40 ${customFileLoading ? 'animate-pulse' : ''}`}>
                  <GlassAvatar
                    src={avatarUrl}
                    name={displayName || 'Nomis'}
                    size="xl"
                  />
                </div>
                
                {/* File Uploader Input Overlay */}
                <label className="absolute inset-2 rounded-full bg-black/60 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/10">
                  <Camera className="w-5 h-5 text-white animate-pulse mb-1" />
                  <span className="text-[8px] font-bold text-white uppercase tracking-wider">Upload File</span>
                  {customFileLoading && (
                    <span className="text-[9px] font-black text-white mt-1">{uploadProgress}%</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {customFileLoading && (
                <div className="text-[10px] text-white/40 flex items-center justify-center gap-1.5">
                  <Loader className="w-3 h-3 animate-spin" /> Processing file...
                </div>
              )}

              {/* Required Display Name input field */}
              <div className="max-w-xs mx-auto text-left space-y-1.5">
                <GlassInput
                  label="Your Display Name (Required)"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Elena Rostova"
                  icon={<User className="w-4 h-4 text-white/40" />}
                  required
                />
              </div>

              {/* Preset selectors */}
              <div className="space-y-2">
                <p className="text-[9px] font-extrabold text-white/30 uppercase tracking-widest">Or select pre-loaded refraction:</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => setAvatarUrl(avatar.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all flex flex-col items-center justify-center bg-white/[0.01] ${
                        avatarUrl === avatar.url ? 'border-[#FF9F0A] scale-105 shadow-md' : 'border-white/5 opacity-65 hover:opacity-100'
                      }`}
                    >
                      <div className="flex-1 flex items-center justify-center p-1">
                        <GlassAvatar src={avatar.url} name={avatar.label} size="sm" />
                      </div>
                      <div className="w-full bg-black/50 py-0.5 text-[8px] text-white/80 font-bold truncate">
                        {avatar.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentSlide === 2 && (
            <motion.div
              key="slide-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">SHARE YOUR BIO</h2>
                <p className="text-xs text-white/55">How would you describe your visual refraction work?</p>
              </div>

              <GlassCard className="p-4 border-white/5 bg-white/[0.01]">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Digital artist & minimalist designer. Refracting daily loops... ⚡"
                  rows={4}
                  maxLength={160}
                  className="w-full bg-transparent border-0 outline-none text-base text-white placeholder-white/30 resize-none font-medium leading-relaxed"
                />
                <div className="text-right text-[9px] font-semibold text-white/30 mt-1">
                  {bio.length}/160 characters
                </div>
              </GlassCard>
            </motion.div>
          )}

          {currentSlide === 3 && (
            <motion.div
              key="slide-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-black text-white uppercase tracking-wider font-display">CLAIM USERNAME</h2>
                <p className="text-xs text-white/55">Secure your unique, clean handles on Nomis.</p>
              </div>

              <GlassCard className="p-5 space-y-4 border-white/10">
                <div className="relative">
                  <GlassInput
                    label="Creator Username (Required)"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                      setUsernameError('');
                    }}
                    placeholder="elena_design"
                    icon={<User className="w-4 h-4 text-white/40" />}
                    required
                  />
                  {usernameChecking && (
                    <div className="absolute right-3.5 bottom-2.5">
                      <Loader className="w-4 h-4 text-white/50 animate-spin" />
                    </div>
                  )}
                </div>

                {usernameError ? (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{usernameError}</span>
                  </div>
                ) : username && !usernameChecking ? (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl">
                    <Check className="w-3.5 h-3.5" />
                    <span>Username available!</span>
                  </div>
                ) : null}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex gap-4 pt-4 border-t border-white/5">
        {currentSlide > 1 ? (
          <GlassButton
            onClick={handlePrev}
            variant="ghost"
            className="flex-1 font-bold text-xs py-3 rounded-xl uppercase tracking-wider"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </GlassButton>
        ) : (
          <div className="flex-1" />
        )}

        {currentSlide === 1 && (
          <GlassButton
            onClick={() => handleNext(false)}
            variant="primary"
            disabled={!displayName.trim()}
            className="flex-1 font-bold text-xs py-3 rounded-xl uppercase tracking-wider disabled:opacity-40"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Next
          </GlassButton>
        )}

        {currentSlide === 2 && (
          <GlassButton
            onClick={() => handleNext(false)}
            variant={bio.trim() ? "primary" : "secondary"}
            className="flex-1 font-bold text-xs py-3 rounded-xl uppercase tracking-wider"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {bio.trim() ? "Next" : "Skip"}
          </GlassButton>
        )}

        {currentSlide === 3 && (
          <div className="flex-1 flex gap-2">
            <GlassButton
              onClick={() => handleNext(true)}
              variant="ghost"
              disabled={loading}
              className="flex-1 font-bold text-xs py-3 rounded-xl uppercase tracking-wider border border-white/10"
            >
              Skip
            </GlassButton>
            <GlassButton
              onClick={() => handleNext(false)}
              variant="primary"
              disabled={loading || !!usernameError || !username || usernameChecking}
              className="flex-1 font-bold text-xs py-3 rounded-xl uppercase tracking-wider disabled:opacity-40"
              icon={loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            >
              Finish
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
};
