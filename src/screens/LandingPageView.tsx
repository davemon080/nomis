import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  Sparkles, 
  Tv, 
  Compass, 
  ShieldCheck, 
  X, 
  ChevronRight, 
  Laptop,
  CheckCircle2,
  ArrowDown
} from 'lucide-react';
import { GlassButton, GlassCard } from '../components/GlassDesignSystem';

interface LandingPageViewProps {
  onEnterApp: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onEnterApp }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // Detect OS
    const ua = navigator.userAgent.toLowerCase();
    const isIosDevice = /ipad|iphone|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(ua);
    
    setIsIOS(isIosDevice);
    if (isIosDevice) {
      setActivePlatform('ios');
    } else if (isAndroidDevice) {
      setActivePlatform('android');
    }

    // Capture PWA installation prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native PWA install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
    } else if (isIOS) {
      // Show iOS PWA installation instructions
      setShowInstallInstructions(true);
    } else {
      // General PWA install instructions
      setShowInstallInstructions(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col relative overflow-x-hidden select-none font-sans">
      {/* Visual background atmospheric orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-25%] w-[80%] h-[80%] bg-[#FF3B30] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.12] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-15%] right-[-25%] w-[80%] h-[80%] bg-[#5856D6] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.12] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Main Content Scroll Container */}
      <div className="flex-1 flex flex-col z-10 w-full max-w-4xl mx-auto px-6 py-12 md:py-20 justify-between">
        
        {/* Header */}
        <header className="flex justify-between items-center w-full mb-12">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] overflow-hidden flex items-center justify-center shadow-[0_4px_15px_rgba(255,59,48,0.4)] border border-white/20">
              <img 
                src="/src/assets/images/app_logo_1784015855312.jpg" 
                alt="Nomis Logo" 
                className="w-full h-full object-cover select-none" 
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-xl font-black uppercase tracking-widest bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">NOMIS</span>
          </div>
          <GlassButton 
            onClick={onEnterApp}
            variant="secondary"
            className="text-xs font-bold tracking-wider uppercase px-4 py-2 border-white/10"
          >
            Launch Web App
          </GlassButton>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col justify-center my-auto space-y-10">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9F0A]" />
              <span className="text-[10px] uppercase font-black tracking-widest text-neutral-300">Next-Gen Video Experience</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] uppercase">
              The Motion <br />
              <span className="bg-gradient-to-r from-[#FF3B30] via-[#FF9F0A] to-[#FF3B30] bg-clip-text text-transparent bg-size-200 animate-gradient">
                Video Platform
              </span>
            </h1>
            
            <p className="text-sm md:text-base text-neutral-400 font-medium leading-relaxed max-w-lg">
              Explore ultra-smooth high-definition short-form videos and image feeds. Optimized dynamically for instant caching, zero crashes, and custom gesture navigation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-md">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] text-white font-bold py-4 px-6 rounded-2xl shadow-[0_8px_30px_rgba(255,59,48,0.4)] border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              <span className="uppercase tracking-wider text-xs font-black">Install Nomis App</span>
            </button>
            
            <button
              onClick={onEnterApp}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="uppercase tracking-wider text-xs font-black">Open in Browser</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* PWA Key Features Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
            <GlassCard className="p-5 space-y-3 border-white/5 bg-zinc-950/40">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF3B30]">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider">Android & iOS Ready</h3>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                Add Nomis instantly to your device home screen with true full-screen offline-resilient access.
              </p>
            </GlassCard>

            <GlassCard className="p-5 space-y-3 border-white/5 bg-zinc-950/40">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF9F0A]">
                <Tv className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider">Immersive Feed</h3>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                Zero buffers, dynamic background orbs, high fidelity image overlays, and ultra-high frame rates.
              </p>
            </GlassCard>

            <GlassCard className="p-5 space-y-3 border-white/5 bg-zinc-950/40">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#5856D6]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider">Secure Database</h3>
              <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                Durable Firestore database sync prevents data crashes even on unexpected page refreshes.
              </p>
            </GlassCard>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-neutral-500 font-semibold uppercase tracking-wider gap-4">
          <p>© {new Date().getFullYear()} Nomis Video Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-white transition-colors cursor-pointer" onClick={onEnterApp}>Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={onEnterApp}>Terms of Service</span>
          </div>
        </footer>
      </div>

      {/* Elegant Installation Overlay Modal */}
      <AnimatePresence>
        {showInstallInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6 relative"
            >
              <button 
                onClick={() => setShowInstallInstructions(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] flex items-center justify-center border border-white/15">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider">Install Nomis App</h3>
                <p className="text-xs text-neutral-400">Add Nomis to your home screen for full app benefits, background persistence, and instant launches.</p>
              </div>

              {/* Instructions per Platform */}
              <div className="space-y-4">
                {activePlatform === 'ios' ? (
                  <div className="space-y-3.5 bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-[#5856D6]/20 border border-[#5856D6]/30 flex items-center justify-center text-xs font-bold text-[#5856D6]">1</div>
                      <p className="text-xs text-neutral-300 font-medium">Open this website in <b>Safari Browser</b> on your iOS device.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-[#5856D6]/20 border border-[#5856D6]/30 flex items-center justify-center text-xs font-bold text-[#5856D6]">2</div>
                      <p className="text-xs text-neutral-300 font-medium">Tap the <b>Share button</b> (box with an upward arrow) in the Safari toolbar.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-[#5856D6]/20 border border-[#5856D6]/30 flex items-center justify-center text-xs font-bold text-[#5856D6]">3</div>
                      <p className="text-xs text-neutral-300 font-medium">Scroll down and tap <b>"Add to Home Screen"</b>.</p>
                    </div>
                  </div>
                ) : activePlatform === 'android' ? (
                  <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-[#FF9F0A]/20 border border-[#FF9F0A]/30 flex items-center justify-center text-xs font-bold text-[#FF9F0A]">1</div>
                      <p className="text-xs text-neutral-300 font-medium">Tap the <b>"Install Nomis App"</b> button above or select the menu button in Chrome.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-[#FF9F0A]/20 border border-[#FF9F0A]/30 flex items-center justify-center text-xs font-bold text-[#FF9F0A]">2</div>
                      <p className="text-xs text-neutral-300 font-medium">Confirm by tapping <b>"Add"</b> or <b>"Install"</b> when the prompt appears.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <p className="text-xs text-neutral-300 font-medium">Open browser menu options (three dots/lines).</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <p className="text-xs text-neutral-300 font-medium">Click <b>"Save Page"</b>, <b>"Install app"</b> or <b>"Add to Applications"</b>.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <GlassButton 
                  onClick={() => setShowInstallInstructions(false)}
                  className="flex-1 py-3 text-xs uppercase font-black tracking-wider text-neutral-400 border-white/5"
                >
                  Dismiss
                </GlassButton>
                <button 
                  onClick={() => {
                    setShowInstallInstructions(false);
                    onEnterApp();
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl text-xs uppercase font-black tracking-wider cursor-pointer"
                >
                  Launch Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
