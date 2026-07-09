/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  ArrowLeft,
  ChevronRight,
  Lock,
  Shield,
  Eye,
  HelpCircle,
  FileText,
  UserX,
  VideoOff,
  Sun,
  Moon,
  Info,
  Sliders,
  DollarSign,
  Briefcase,
  AlertOctagon,
  Check,
  Send,
  CheckCircle,
  Megaphone,
  Sparkles,
  CreditCard,
  Tv,
  Upload,
  Heart
} from 'lucide-react';
import { ScreenId } from '../types';
import { GlassCard, GlassButton, GlassListTile, GlassSwitch, GlassInput } from '../components/GlassDesignSystem';
import { doc, updateDoc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface SettingsViewProps {
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string) => void;
  activeTheme: 'light' | 'dark' | 'high-contrast';
  onChangeTheme: (theme: 'light' | 'dark' | 'high-contrast') => void;
  onToggleMaintenance: () => void;
  onToggleOffline: () => void;
  isMaintenanceMode: boolean;
  isOfflineMode: boolean;
  initialSubPage?: string;
}

type SubPageId =
  | 'menu'
  | 'privacy'
  | 'security'
  | 'appearance'
  | 'about'
  | 'help'
  | 'report-user'
  | 'report-video'
  | 'guidelines'
  | 'terms'
  | 'policy'
  | 'admin'
  | 'advertiser'
  | 'get-verified'
  | 'run-ads';

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigate,
  onShowToast,
  activeTheme,
  onChangeTheme,
  onToggleMaintenance,
  onToggleOffline,
  isMaintenanceMode,
  isOfflineMode,
  initialSubPage = 'menu'
}) => {
  const [activeSubPage, setActiveSubPage] = useState<SubPageId>(initialSubPage as any);

  // Privacy toggles
  const [isPrivate, setIsPrivate] = useState(false);
  const [suggestFriends, setSuggestFriends] = useState(true);
  const [allowRefraction, setAllowRefraction] = useState(true);

  // Security toggles
  const [mfa, setMfa] = useState(false);
  const [keychain, setKeychain] = useState(true);

  // Form states
  const [reportTarget, setReportTarget] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Verification application states
  const [isVerified, setIsVerified] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [fullName, setFullName] = useState('');
  const [documentType, setDocumentType] = useState('Passport');
  const [creatorCategory, setCreatorCategory] = useState('Motion Designer');
  const [socialHandle, setSocialHandle] = useState('');
  const [uploadedDocName, setUploadedDocName] = useState('');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Advertising states
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Campaign Form
  const [campaignTitle, setCampaignTitle] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [customVideoTitle, setCustomVideoTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('#motion, #visuals');
  const [dailyBudget, setDailyBudget] = useState(10);
  const [durationDays, setDurationDays] = useState(5);
  const [isLaunchingCampaign, setIsLaunchingCampaign] = useState(false);

  // Settle Checkout fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Fetch Verification Status & Campaigns on subpage swap
  useEffect(() => {
    const fetchVerificationAndCampaigns = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch verification status
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setIsVerified(!!data.isVerified);
          setVerificationPending(!!data.isPendingVerification);
        }

        // Fetch User's videos for ads selection
        if (activeSubPage === 'run-ads') {
          setLoadingVideos(true);
          const qVideos = query(collection(db, 'videos'), where('creator.id', '==', auth.currentUser.uid));
          const querySnapshot = await getDocs(qVideos);
          const list: any[] = [];
          querySnapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setUserVideos(list);
          if (list.length > 0) {
            setSelectedVideoId(list[0].id);
          }
          setLoadingVideos(false);
        }

        // Fetch user campaigns
        if (activeSubPage === 'advertiser' || activeSubPage === 'run-ads') {
          setLoadingCampaigns(true);
          const qAds = query(collection(db, 'ads'), where('userId', '==', auth.currentUser.uid));
          const adSnap = await getDocs(qAds);
          const adList: any[] = [];
          adSnap.forEach((docSnap) => {
            adList.push({ id: docSnap.id, ...docSnap.data() });
          });
          setActiveCampaigns(adList);
          setLoadingCampaigns(false);
        }
      } catch (err) {
        console.error("Error retrieving coordinates for setting portal:", err);
      }
    };

    fetchVerificationAndCampaigns();
  }, [activeSubPage]);

  const handleSubPageChange = (page: SubPageId) => {
    setActiveSubPage(page);
    onShowToast(`Opening settings sub-system: ${page.toUpperCase()}`);
  };

  const handleReportSubmit = (e: React.FormEvent, type: 'user' | 'video') => {
    e.preventDefault();
    if (!reportTarget.trim() || !reportReason.trim()) {
      onShowToast('Please supply all required ticketing coordinates.');
      return;
    }
    setIsSubmittingReport(true);
    setTimeout(() => {
      setIsSubmittingReport(false);
      onShowToast(`Nomis ${type === 'user' ? 'Creator' : 'Video'} report filed successfully! ID: #${Math.floor(Math.random() * 900000 + 100000)}`);
      setReportTarget('');
      setReportReason('');
      setActiveSubPage('menu');
    }, 1500);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar select-none pb-24 text-left">
      <AnimatePresence mode="wait">
        {/* Main Settings Menu */}
        {activeSubPage === 'menu' && (
          <motion.div
            key="settings-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <button onClick={() => onNavigate('profile')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Settings className="w-5 h-5 text-white animate-spin" />
              <h1 className="text-xl font-black text-white tracking-widest uppercase">SETTINGS HUB</h1>
            </div>

            {/* Hub Portals */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Creator Portals</span>
              <GlassListTile icon={<Sliders className="w-4.5 h-4.5" />} title="Creator Dashboard" subtitle="Track ad revenue metrics" onClick={() => onNavigate('creator-dashboard')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
              <GlassListTile icon={<DollarSign className="w-4.5 h-4.5" />} title="Creator Balance Wallet" subtitle="Settle dividend assets" onClick={() => onNavigate('wallet')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
              <GlassListTile icon={<CheckCircle className="w-4.5 h-4.5 text-blue-400" />} title="Get Verified Badge" subtitle="Apply for official blue verification tick" onClick={() => handleSubPageChange('get-verified')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
              <GlassListTile icon={<Megaphone className="w-4.5 h-4.5 text-green-400" />} title="Promote with Ads" subtitle="Pay to run ad campaigns on the feed" onClick={() => handleSubPageChange('run-ads')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Core Coordinates</span>
              <GlassListTile icon={<Lock className="w-4.5 h-4.5" />} title="Privacy Controls" subtitle="Refraction locks & private settings" onClick={() => handleSubPageChange('privacy')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
              <GlassListTile icon={<Shield className="w-4.5 h-4.5" />} title="Security Vault" subtitle="Session states & authentication" onClick={() => handleSubPageChange('security')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
              <GlassListTile icon={<Sun className="w-4.5 h-4.5" />} title="Appearance Visuals" subtitle="Dark, Light, High Contrast modes" onClick={() => handleSubPageChange('appearance')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Compliance & Support</span>
              <GlassListTile icon={<HelpCircle className="w-4.5 h-4.5" />} title="Help Center" subtitle="Community support & tutorials" onClick={() => handleSubPageChange('help')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
              <GlassListTile icon={<Info className="w-4.5 h-4.5" />} title="About Platform" subtitle="Nomis engineering specifications" onClick={() => handleSubPageChange('about')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
              <GlassListTile icon={<UserX className="w-4.5 h-4.5" />} title="Report Creator Account" subtitle="Flag offensive user metadata" onClick={() => handleSubPageChange('report-user')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
              <GlassListTile icon={<VideoOff className="w-4.5 h-4.5" />} title="Report Video Media" subtitle="Flag inappropriate content clips" onClick={() => handleSubPageChange('report-video')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">System Administration</span>
              <GlassListTile icon={<Sliders className="w-4.5 h-4.5" />} title="Admin Operations Panel" subtitle="Configure system mock environments" onClick={() => handleSubPageChange('admin')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
              <GlassListTile icon={<Briefcase className="w-4.5 h-4.5" />} title="Advertiser Portal" subtitle="Examine active campaign metrics" onClick={() => handleSubPageChange('advertiser')} rightElement={<ChevronRight className="w-4 h-4 text-white/30" />} />
            </div>
          </motion.div>
        )}

        {/* PRIVACY PAGE */}
        {activeSubPage === 'privacy' && (
          <motion.div
            key="privacy-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">Privacy Controls</h1>
            </div>

            <GlassCard className="p-5 space-y-4">
              <GlassSwitch checked={isPrivate} onChange={setIsPrivate} label="Private Account Link" />
              <p className="text-[10px] text-white/40 leading-relaxed -mt-2 pl-1">
                Only authenticated, followed accounts will gain routing permission into your visual grids.
              </p>

              <div className="border-b border-white/5 my-2" />

              <GlassSwitch checked={suggestFriends} onChange={setSuggestFriends} label="Suggest to Global Creators" />
              <p className="text-[10px] text-white/40 leading-relaxed -mt-2 pl-1">
                Authorizes Nomis algorithms to present your creator avatar in global discover rails.
              </p>

              <div className="border-b border-white/5 my-2" />

              <GlassSwitch checked={allowRefraction} onChange={setAllowRefraction} label="Refraction Key Sharing" />
              <p className="text-[10px] text-white/40 leading-relaxed -mt-2 pl-1">
                Allows other creators to utilize your media audio files inside customized visual refractions.
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* SECURITY PAGE */}
        {activeSubPage === 'security' && (
          <motion.div
            key="security-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">Security Vault</h1>
            </div>

            <GlassCard className="p-5 space-y-4">
              <GlassSwitch checked={mfa} onChange={setMfa} label="Two-Factor Authentication" />
              <p className="text-[10px] text-white/40 leading-relaxed -mt-2 pl-1">
                Requires entering a cryptographic 6-digit email passcode upon authorization logs.
              </p>

              <div className="border-b border-white/5 my-2" />

              <GlassSwitch checked={keychain} onChange={setKeychain} label="Auto-Keychain Locking" />
              <p className="text-[10px] text-white/40 leading-relaxed -mt-2 pl-1">
                Safely encrypt and bundle session hashes directly into local browser caches.
              </p>
            </GlassCard>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Active Sessions</span>
              <GlassListTile icon={<Shield className="w-4.5 h-4.5" />} title="Safari Browser • Tokyo, Japan" subtitle="Logged in 2 hours ago • Active now" />
              <GlassListTile icon={<Shield className="w-4.5 h-4.5" />} title="iPhone 15 Pro • London, UK" subtitle="Logged in July 04, 2026" />
            </div>
          </motion.div>
        )}

        {/* APPEARANCE PAGE */}
        {activeSubPage === 'appearance' && (
          <motion.div
            key="appearance-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">Appearance Visuals</h1>
            </div>

            <GlassCard className="p-5 space-y-4">
              <p className="text-xs text-white/50 text-center leading-relaxed mb-1">
                Select your preferred visual atmosphere. All systems adapt to standard frosted glass overlays.
              </p>

              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'dark', name: 'Ambient Dark Space', icon: <Moon className="w-4.5 h-4.5" /> },
                  { id: 'light', name: 'Refracted Light Space', icon: <Sun className="w-4.5 h-4.5" /> },
                  { id: 'high-contrast', name: 'Sark Contrast Mode', icon: <AlertOctagon className="w-4.5 h-4.5" /> }
                ].map((theme) => {
                  const isActive = activeTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        onChangeTheme(theme.id as any);
                        onShowToast(`System visual state swapped: ${theme.name}`);
                      }}
                      className={`w-full p-4 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all duration-300
                        ${isActive
                          ? 'bg-white text-black border-white shadow-[0_4px_15px_rgba(255,255,255,0.15)] font-bold'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={isActive ? 'text-black' : 'text-white/60'}>{theme.icon}</div>
                        <span className="text-xs tracking-wide">{theme.name}</span>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-black" />}
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ABOUT PAGE */}
        {activeSubPage === 'about' && (
          <motion.div
            key="about-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4 text-left"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">About Platform</h1>
            </div>

            <GlassCard className="p-5 space-y-4">
              <div className="text-center space-y-1 mb-2">
                <h3 className="text-lg font-black text-white">NOMIS DESIGN</h3>
                <p className="text-[10px] text-white/40 tracking-widest uppercase">Version 1.0.0 (Production Build)</p>
              </div>

              <div className="space-y-3 text-xs text-white/70 leading-relaxed">
                <p>
                  Nomis is a premium visual micro-networking platform dedicated to short-form motion design.
                </p>
                <p>
                  Built by design systems engineers, Nomis implements physics-based spring models, real-time lighting refractions, and frosted glass layering structures.
                </p>
                <p className="text-[10px] text-white/40 border-t border-white/5 pt-3 text-center">
                  © 2026 Nomis Inc. All rights reserved.
                </p>
              </div>
            </GlassCard>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Legal Agreements</span>
              <GlassListTile icon={<FileText className="w-4.5 h-4.5" />} title="Terms of Service" onClick={() => handleSubPageChange('terms')} />
              <GlassListTile icon={<FileText className="w-4.5 h-4.5" />} title="Privacy Guidelines" onClick={() => handleSubPageChange('policy')} />
              <GlassListTile icon={<FileText className="w-4.5 h-4.5" />} title="Community Safety Rules" onClick={() => handleSubPageChange('guidelines')} />
            </div>
          </motion.div>
        )}

        {/* HELP PAGE */}
        {activeSubPage === 'help' && (
          <motion.div
            key="help-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">Help Center</h1>
            </div>

            <GlassCard className="p-5 space-y-4 text-xs text-white/70 leading-relaxed">
              <h3 className="text-sm font-bold text-white tracking-wide">Frequently Asked Questions</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-bold text-white">How does Creator Ad Revenue Split work?</p>
                  <p className="text-white/50 mt-1">We split premium ad revenue 60/40 in favor of creators, settled into wallets every 24 hours.</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <p className="font-bold text-white">What is a Glass Refraction Video?</p>
                  <p className="text-white/50 mt-1">It refers to vertical content clips formatted inside our translucent, high-depth presentation layout.</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* REPORT USER */}
        {activeSubPage === 'report-user' && (
          <motion.div
            key="report-user"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">Report Creator</h1>
            </div>

            <GlassCard className="p-5">
              <form onSubmit={(e) => handleReportSubmit(e, 'user')} className="space-y-4">
                <GlassInput
                  label="Offending Username"
                  type="text"
                  placeholder="@marcus_vibe"
                  value={reportTarget}
                  onChange={(e) => setReportTarget(e.target.value)}
                  icon={<UserX className="w-4 h-4 text-white/30" />}
                  required
                />
                <GlassInput
                  label="Detailed Reason"
                  type="text"
                  placeholder="Copyright infringement or malicious tags..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                />
                <GlassButton
                  type="submit"
                  variant="primary"
                  className="w-full text-xs font-bold"
                  disabled={isSubmittingReport}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  {isSubmittingReport ? 'Filing Security Ticket...' : 'File Secure Report'}
                </GlassButton>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* REPORT VIDEO */}
        {activeSubPage === 'report-video' && (
          <motion.div
            key="report-video"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">Report Video Media</h1>
            </div>

            <GlassCard className="p-5">
              <form onSubmit={(e) => handleReportSubmit(e, 'video')} className="space-y-4">
                <GlassInput
                  label="Video Title or ID"
                  type="text"
                  placeholder="Neon Vibe Session (#v1)"
                  value={reportTarget}
                  onChange={(e) => setReportTarget(e.target.value)}
                  icon={<VideoOff className="w-4 h-4 text-white/30" />}
                  required
                />
                <GlassInput
                  label="Detailed Reason"
                  type="text"
                  placeholder="Inappropriate content clip or harmful stunts..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                />
                <GlassButton
                  type="submit"
                  variant="primary"
                  className="w-full text-xs font-bold"
                  disabled={isSubmittingReport}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  {isSubmittingReport ? 'Filing Security Ticket...' : 'File Secure Report'}
                </GlassButton>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* LEGAL PAGES (TERMS, POLICY, GUIDELINES) */}
        {['terms', 'policy', 'guidelines'].includes(activeSubPage) && (
          <motion.div
            key="legal-pages"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => handleSubPageChange('about')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">
                {activeSubPage === 'terms' ? 'Terms of Service' : activeSubPage === 'policy' ? 'Privacy Policy' : 'Community Guidelines'}
              </h1>
            </div>

            <GlassCard className="p-5 text-xs text-white/70 leading-relaxed space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              <p className="font-bold text-white uppercase tracking-wide">
                Nomis Legal Protocol Code v1.2
              </p>
              <p>
                By connecting to Nomis nodes, you explicitly authorize session caching, media refraction key sharing, and automated ad-revenue ledger settles.
              </p>
              <p>
                Creators are strictly forbidden from uploading pre-rendered, copyrighted media assets that bypass our physical design parameters. We audit content continuously to ensure eye-safe visual conditions.
              </p>
              <p>
                All data transfers remain end-to-end encrypted under standard platform parameters. No private credentials will ever be sold.
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* ADMIN CONTROL PANEL */}
        {activeSubPage === 'admin' && (
          <motion.div
            key="admin-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">Admin Control Panel</h1>
            </div>

            <GlassCard className="p-5 space-y-4">
              <p className="text-xs text-white/50 leading-relaxed mb-2">
                This diagnostic dashboard permits product designers to test the app's structural resilience configurations.
              </p>

              <div className="space-y-3">
                <GlassSwitch
                  checked={isMaintenanceMode}
                  onChange={onToggleMaintenance}
                  label="Force Maintenance Mode"
                />
                <p className="text-[9px] text-white/40 -mt-2 leading-relaxed">
                  Renders the premium system maintenance screen placeholder immediately.
                </p>

                <div className="border-b border-white/5 my-2" />

                <GlassSwitch
                  checked={isOfflineMode}
                  onChange={onToggleOffline}
                  label="Force Offline Mode"
                />
                <p className="text-[9px] text-white/40 -mt-2 leading-relaxed">
                  Renders the tactile connection loss screen placeholder immediately.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ADVERTISER PORTAL */}
        {activeSubPage === 'advertiser' && (
          <motion.div
            key="advertiser-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest">Advertiser Campaigns</h1>
            </div>

            <GlassCard className="p-5 space-y-3 text-xs text-white/70 leading-relaxed">
              <h3 className="font-bold text-white">Active Campaigns Dashboard</h3>
              <p>Manage and analyze video promotions directly embedded within Nomis frosted feeds.</p>
              {loadingCampaigns ? (
                <div className="text-center py-4 text-white/40">Syncing active ad coordinates...</div>
              ) : activeCampaigns.length === 0 ? (
                <div className="p-4 border border-dashed border-white/5 rounded-xl text-center text-white/40">
                  No active campaigns. Head to Creator Portals to create a new ad promotion.
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {activeCampaigns.map((ad, idx) => (
                    <div key={ad.id || idx} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">{ad.campaignName || 'Unnamed Ad Campaign'}</p>
                        <p className="text-[10px] text-white/40">Daily Budget: ${ad.dailyBudget || 10} • Duration: {ad.durationDays || 5} Days</p>
                        <p className="text-[9px] text-blue-400 mt-0.5">Target: {ad.targetTags || '#motion'}</p>
                      </div>
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-md font-semibold border border-green-500/20">
                        {ad.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* GET VERIFIED PAGE */}
        {activeSubPage === 'get-verified' && (
          <motion.div
            key="get-verified-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" /> Apply For Verification
              </h1>
            </div>

            {isVerified ? (
              <GlassCard className="p-6 text-center space-y-5 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-blue-500/30 blur-md animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-blue-500/10 border border-blue-400/40 flex items-center justify-center">
                      <CheckCircle className="w-9 h-9 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white tracking-wide uppercase">ACCOUNT VERIFIED</h3>
                  <p className="text-xs text-white/70 leading-relaxed max-w-sm mx-auto">
                    Your visual credentials and identity have been successfully secured on our network ledger. Your official blue checkmark is active globally!
                  </p>
                </div>

                <div className="border-t border-white/5 pt-4 text-left space-y-2 max-w-xs mx-auto text-[10px] text-white/50">
                  <div className="flex justify-between">
                    <span>Identity Status</span>
                    <span className="text-green-400 font-bold">Approved ✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creator Tier</span>
                    <span className="text-blue-400 font-bold">Elite Visualist</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ledger Address</span>
                    <span className="font-mono text-white/30">0xNOMIS...{auth.currentUser?.uid?.substring(0, 6)}</span>
                  </div>
                </div>
              </GlassCard>
            ) : verificationPending ? (
              <GlassCard className="p-6 text-center space-y-4 border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center animate-pulse">
                    <Shield className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white tracking-wide">APPLICATION UNDER REVIEW</h3>
                  <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto">
                    Our compliance directors are verifying your coordinates. Your blue checkmark usually settles in less than 24 hours.
                  </p>
                </div>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                <GlassCard className="p-4 space-y-3 text-xs text-white/70 leading-relaxed">
                  <h3 className="font-bold text-white text-sm">Verification Requirements</h3>
                  <p>Verified creators gain premium visibility, distinct badge styling, and increased ad revenue split priority.</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span>Node Status: Active</span>
                    </div>
                    <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span>Profile: Completed</span>
                    </div>
                    <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span>Unique ID: Checked</span>
                    </div>
                    <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                      <span>Visual Proof: Required</span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!fullName.trim() || !socialHandle.trim()) {
                        onShowToast('Please fill in your legal name and primary handle.');
                        return;
                      }
                      if (!uploadedDocName) {
                        onShowToast('Please drop or select a visual verification credential.');
                        return;
                      }

                      setIsSubmittingVerification(true);
                      onShowToast('Uploading documents to Nomis security vaults...');

                      setTimeout(async () => {
                        try {
                          if (auth.currentUser) {
                            const userRef = doc(db, 'users', auth.currentUser.uid);
                            // Set verified immediately for exceptional interactive experience!
                            await updateDoc(userRef, {
                              isVerified: true,
                              isPendingVerification: false,
                              legalName: fullName,
                              verificationCategory: creatorCategory
                            });
                            setIsVerified(true);
                            onShowToast('Instant Verification Approved! Your blue checkmark is active.');
                          }
                        } catch (err) {
                          console.error(err);
                          onShowToast('Error settling verification ledger. Please try again.');
                        } finally {
                          setIsSubmittingVerification(false);
                        }
                      }, 2500);
                    }}
                    className="space-y-4"
                  >
                    <GlassInput
                      label="Full Legal Name"
                      type="text"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />

                    <div>
                      <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 pl-1">
                        Creator Category
                      </label>
                      <select
                        value={creatorCategory}
                        onChange={(e) => setCreatorCategory(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-white/30"
                      >
                        <option value="Motion Designer">Motion Designer</option>
                        <option value="3D Visual Artist">3D Visual Artist</option>
                        <option value="Visual Architect">Visual Architect</option>
                        <option value="Sound Designer">Sound Designer</option>
                        <option value="Interactive Prototyper">Interactive Prototyper</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 pl-1">
                        Identity Verification Document
                      </label>
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-white/30 mb-2.5"
                      >
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="National ID Card">National ID Card</option>
                      </select>

                      {/* File Upload Area */}
                      <div
                        onClick={() => setUploadedDocName(`credentials_${documentType.toLowerCase().replace(/\s+/g, '_')}.png`)}
                        className="w-full p-6 border border-dashed border-white/15 hover:border-white/30 rounded-xl text-center cursor-pointer bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-300 flex flex-col items-center justify-center gap-2"
                      >
                        <Upload className="w-5 h-5 text-white/40" />
                        {uploadedDocName ? (
                          <div className="space-y-1">
                            <p className="text-xs text-green-400 font-bold flex items-center gap-1 justify-center">
                              <Check className="w-3.5 h-3.5" /> Credentials Attached
                            </p>
                            <p className="text-[10px] text-white/50">{uploadedDocName}</p>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-xs text-white/70">Click to attach scanned photo or PDF</p>
                            <p className="text-[9px] text-white/40">Accepts PNG, JPG, or PDF up to 10MB</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <GlassInput
                      label="Primary Social Handle coordinates"
                      type="text"
                      placeholder="instagram.com/jane_motion"
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                      required
                    />

                    <GlassButton
                      type="submit"
                      variant="primary"
                      className="w-full text-xs font-black uppercase tracking-wider h-11"
                      disabled={isSubmittingVerification}
                    >
                      {isSubmittingVerification ? 'Cryptographic scan in progress...' : 'Settle Verification Ledger'}
                    </GlassButton>
                  </form>
                </GlassCard>
              </div>
            )}
          </motion.div>
        )}

        {/* RUN ADS PAGE */}
        {activeSubPage === 'run-ads' && (
          <motion.div
            key="run-ads-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setActiveSubPage('menu')} className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-green-400" /> Promote Ads Campaign
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Left Column: Form & Selection */}
              <div className="space-y-4">
                <GlassCard className="p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm">1. Campaign Specs</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!campaignTitle.trim()) {
                        onShowToast('Please provide a campaign title.');
                        return;
                      }
                      if (!selectedVideoId && (!customVideoUrl.trim() || !customVideoTitle.trim())) {
                        onShowToast('Please select one of your videos or provide custom ad coordinates.');
                        return;
                      }
                      if (!cardNumber.trim() || !expiryDate.trim() || !cvv.trim() || !cardholderName.trim()) {
                        onShowToast('Please complete credit card coordinates.');
                        return;
                      }

                      setIsLaunchingCampaign(true);
                      onShowToast('Authorizing payment coordinates with bank gateway...');

                      setTimeout(async () => {
                        try {
                          const promoTitle = selectedVideoId 
                            ? (userVideos.find(v => v.id === selectedVideoId)?.title || 'My Video Promo') 
                            : customVideoTitle;
                          const promoUrl = selectedVideoId 
                            ? (userVideos.find(v => v.id === selectedVideoId)?.url || '') 
                            : customVideoUrl;

                          if (auth.currentUser) {
                            await addDoc(collection(db, 'ads'), {
                              userId: auth.currentUser.uid,
                              campaignName: campaignTitle,
                              videoId: selectedVideoId || 'custom_promo',
                              videoTitle: promoTitle,
                              videoUrl: promoUrl,
                              dailyBudget: Number(dailyBudget),
                              durationDays: Number(durationDays),
                              targetTags: targetAudience,
                              totalPaid: Number(dailyBudget) * Number(durationDays),
                              createdAt: new Date().toISOString(),
                              status: 'Active'
                            });

                            onShowToast('Payment Succeeded! Campaign ledger successfully deployed.');
                            // Reset state
                            setCampaignTitle('');
                            setCustomVideoTitle('');
                            setCustomVideoUrl('');
                            setCardNumber('');
                            setExpiryDate('');
                            setCvv('');
                            setCardholderName('');
                            setActiveSubPage('advertiser');
                          }
                        } catch (err) {
                          console.error(err);
                          onShowToast('Ledger deploy error. Please check card coordinates.');
                        } finally {
                          setIsLaunchingCampaign(false);
                        }
                      }, 3000);
                    }}
                    className="space-y-4"
                  >
                    <GlassInput
                      label="Campaign Title"
                      type="text"
                      placeholder="Summer Drop 2026 Promo"
                      value={campaignTitle}
                      onChange={(e) => setCampaignTitle(e.target.value)}
                      required
                    />

                    <div>
                      <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 pl-1">
                        Select Video to Promote
                      </label>
                      {loadingVideos ? (
                        <div className="text-xs text-white/40 py-2">Syncing creator video coordinates...</div>
                      ) : userVideos.length > 0 ? (
                        <div className="space-y-2">
                          <select
                            value={selectedVideoId}
                            onChange={(e) => setSelectedVideoId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-white/30"
                          >
                            {userVideos.map((video) => (
                              <option key={video.id} value={video.id}>
                                {video.title}
                              </option>
                            ))}
                            <option value="">-- Use Custom Promotion URL --</option>
                          </select>
                        </div>
                      ) : (
                        <p className="text-[10px] text-white/40 mb-1 leading-relaxed pl-1">
                          No uploaded videos found on your profile. Please paste custom promo coordinates below.
                        </p>
                      )}
                    </div>

                    {!selectedVideoId && (
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                        <GlassInput
                          label="Custom Video URL"
                          type="text"
                          placeholder="https://assets.mixkit.co/videos/preview/mixkit-..."
                          value={customVideoUrl}
                          onChange={(e) => setCustomVideoUrl(e.target.value)}
                          required={!selectedVideoId}
                        />
                        <GlassInput
                          label="Custom Video Title"
                          type="text"
                          placeholder="My Creative Motion Promo"
                          value={customVideoTitle}
                          onChange={(e) => setCustomVideoTitle(e.target.value)}
                          required={!selectedVideoId}
                        />
                      </div>
                    )}

                    <GlassInput
                      label="Target Audience Niche Tags"
                      type="text"
                      placeholder="#motion, #3d, #cyberpunk"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      required
                    />

                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1">
                        <span className="text-white/50">Daily Budget</span>
                        <span className="text-green-400">${dailyBudget}/Day</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="500"
                        step="5"
                        value={dailyBudget}
                        onChange={(e) => setDailyBudget(Number(e.target.value))}
                        className="w-full accent-green-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[9px] text-white/30 mt-1 pl-1">
                        <span>Min $5</span>
                        <span>Estimated Daily Reach: ~{(dailyBudget * 145).toLocaleString()} impressions</span>
                        <span>Max $500</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1">
                        <span className="text-white/50">Campaign Duration</span>
                        <span className="text-white">{durationDays} Days</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="w-full accent-white cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[9px] text-white/30 mt-1 pl-1">
                        <span>1 Day</span>
                        <span>Total Paid Amount: ${(dailyBudget * durationDays).toFixed(2)}</span>
                        <span>30 Days</span>
                      </div>
                    </div>

                    {/* Settle Checkout card */}
                    <div className="border-t border-white/5 pt-4 space-y-4">
                      <h4 className="font-bold text-white text-[10px] uppercase tracking-widest pl-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-white/50" /> Card Settle Coordinates
                      </h4>

                      {/* Interactive Glassmorphic Credit Card Preview */}
                      <div className="relative w-full h-36 rounded-2xl p-4 flex flex-col justify-between overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl shadow-lg">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-blue-500/20 rounded-full blur-xl pointer-events-none" />
                        <div className="flex justify-between items-center z-10">
                          <span className="text-[9px] font-extrabold text-white/40 tracking-wider uppercase">Nomis Pay Settle</span>
                          <Tv className="w-4 h-4 text-white/60" />
                        </div>
                        <p className="text-sm font-mono tracking-widest text-white/95 my-1 z-10">
                          {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                        </p>
                        <div className="flex justify-between items-end z-10">
                          <div>
                            <span className="text-[7px] text-white/30 block uppercase tracking-widest">Cardholder</span>
                            <span className="text-[10px] text-white/80 font-bold uppercase truncate max-w-[120px] block">
                              {cardholderName || 'Creative Director'}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <div>
                              <span className="text-[7px] text-white/30 block uppercase tracking-widest">Expires</span>
                              <span className="text-[10px] text-white/80 font-mono block">{expiryDate || 'MM/YY'}</span>
                            </div>
                            <div>
                              <span className="text-[7px] text-white/30 block uppercase tracking-widest">CVV</span>
                              <span className="text-[10px] text-white/80 font-mono block">{cvv || '•••'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <GlassInput
                          label="Card Number"
                          type="text"
                          maxLength={16}
                          placeholder="4111222233334444"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                          required
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <GlassInput
                            label="Expiry Date"
                            type="text"
                            maxLength={5}
                            placeholder="12/28"
                            value={expiryDate}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val.length === 2 && !val.includes('/')) {
                                val += '/';
                              }
                              setExpiryDate(val);
                            }}
                            required
                          />
                          <GlassInput
                            label="CVV"
                            type="password"
                            maxLength={3}
                            placeholder="888"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                            required
                          />
                        </div>
                        <GlassInput
                          label="Cardholder Name"
                          type="text"
                          placeholder="JANE DOE"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <GlassButton
                      type="submit"
                      variant="primary"
                      className="w-full text-xs font-black uppercase tracking-wider h-11 border-green-500/20 text-green-400 bg-green-500/5 hover:bg-green-500/10"
                      disabled={isLaunchingCampaign}
                    >
                      {isLaunchingCampaign ? 'Settle transaction & deploying...' : `Settle $${(dailyBudget * durationDays).toFixed(2)} & Launch`}
                    </GlassButton>
                  </form>
                </GlassCard>
              </div>

              {/* Right Column: Campaign Insight / Reach Statistics Mock */}
              <div className="space-y-4">
                <GlassCard className="p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm">2. Live Promotion Metrics</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Estimate of campaign delivery and target node performance. We embed video promotions organically as native glasscards into standard client feeds.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Estimated Impressions</p>
                      <p className="text-xl font-black text-white mt-1">
                        {((dailyBudget * 145) * durationDays).toLocaleString()}+
                      </p>
                      <p className="text-[9px] text-white/30 mt-0.5">Total guaranteed node appearances</p>
                    </div>

                    <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Targeted Audiences</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {targetAudience.split(',').map((tag, idx) => (
                          <span key={idx} className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-white/80">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Campaign Status Ledger</p>
                      <p className="text-xs font-semibold text-green-400 flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Ready for Ledger Deploy
                      </p>
                    </div>
                  </div>
                </GlassCard>

                {activeCampaigns.length > 0 && (
                  <GlassCard className="p-5 space-y-3">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1">
                      <Briefcase className="w-4 h-4 text-white/50" /> Live Campaigns ({activeCampaigns.length})
                    </h3>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                      {activeCampaigns.map((ad, index) => (
                        <div key={ad.id || index} className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-white truncate max-w-[140px]">{ad.campaignName}</p>
                            <p className="text-[9px] text-white/40">Paid: ${(ad.dailyBudget * ad.durationDays).toFixed(2)}</p>
                          </div>
                          <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-md">
                            {ad.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
