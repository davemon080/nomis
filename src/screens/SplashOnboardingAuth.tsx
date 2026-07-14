/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Compass, Sparkles, LogIn, UserPlus, ArrowRight, ArrowLeft, Mail, Lock, User, KeyRound, Chrome } from 'lucide-react';
import { ScreenId } from '../types';
import { GlassButton, GlassCard, GlassInput } from '../components/GlassDesignSystem';
import { loginWithEmail, registerWithEmail, resetPassword, signInWithGoogle } from '../lib/firebase';
import appLogo from '../assets/images/app_logo_1784015855312.jpg';

// ==========================================
// SPLASH VIEW
// ==========================================
export const SplashView: React.FC<{
  onFinished: () => void;
}> = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          clearInterval(timer);
          setTimeout(onFinished, 500);
          return 100;
        }
        return old + 2.5;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [onFinished]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-black via-zinc-950 to-neutral-900 flex flex-col items-center justify-between p-8 text-center select-none">
      <div />
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.05, 1], opacity: 1 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] border border-white/25 overflow-hidden flex items-center justify-center backdrop-blur-xl shadow-[0_10px_30px_rgba(255,59,48,0.4)] relative"
        >
          <img 
            src={appLogo} 
            alt="Nomis Logo" 
            className="w-full h-full object-cover select-none" 
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight text-white font-display"
          >
            N O M I S
          </motion.h1>
          <p className="text-xs text-white/50 font-semibold tracking-wider uppercase font-mono">Visual Refraction Platform</p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {/* Sleek loading bar */}
        <div className="w-full bg-white/5 border border-white/5 rounded-full h-1 overflow-hidden backdrop-blur-md">
          <div className="bg-gradient-to-r from-[#FF3B30] to-[#FF9F0A] h-full shadow-[0_0_10px_rgba(255,59,48,0.6)]" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center text-[9px] font-bold text-white/40 tracking-widest uppercase font-mono">
          <span>Loading Assets</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ONBOARDING VIEW
// ==========================================
export const OnboardingView: React.FC<{
  onNavigate: (screen: ScreenId) => void;
}> = ({ onNavigate }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: 'REFRACTED VISUALS',
      desc: 'Immerse yourself in high-fidelity, short-form streaming wrapped in a pure glassmorphic canvas.',
      icon: <Compass className="w-8 h-8 text-white" />
    },
    {
      title: 'CREATIVE MONETIZATION',
      desc: 'Unlock your true creator potential with instantaneous ad-revenue splits and micro-tipping pools.',
      icon: <Sparkles className="w-8 h-8 text-white" />
    },
    {
      title: 'TACTILE MOTION FEED',
      desc: 'Savor organic physics transitions, intuitive double-tap interactions, and frictionless layouts.',
      icon: <ShieldCheck className="w-8 h-8 text-white" />
    }
  ];

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide((prev) => prev + 1);
    } else {
      onNavigate('login');
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black flex flex-col justify-between p-8 select-none">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-white/40 tracking-widest uppercase">NOMIS // EST 2026</span>
        <button
          onClick={() => onNavigate('login')}
          className="text-xs font-bold text-white hover:text-white/80 tracking-wide uppercase transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center gap-6"
          >
            <div className="p-5 rounded-3xl bg-gradient-to-tr from-[#FF3B30]/20 to-[#FF9F0A]/20 border border-[#FF3B30]/30 backdrop-blur-lg shadow-[0_8px_20px_rgba(255,59,48,0.15)] mb-2 animate-pulse">
              {slides[activeSlide].icon}
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-white tracking-widest uppercase font-display">{slides[activeSlide].title}</h2>
              <p className="text-xs text-white/60 leading-relaxed max-w-xs">{slides[activeSlide].desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel indicators */}
        <div className="flex gap-2 mt-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${index === activeSlide ? 'w-6 bg-[#FF3B30] shadow-[0_0_8px_rgba(255,59,48,0.7)]' : 'w-2 bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <GlassButton variant="primary" size="lg" className="w-full" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
          {activeSlide === slides.length - 1 ? 'Get Started' : 'Next'}
        </GlassButton>
        <div className="text-center">
          <span className="text-[10px] text-white/40 font-semibold tracking-wide uppercase">
            By continuing, you agree to our{' '}
            <span onClick={() => onNavigate('settings-terms')} className="text-white/60 underline cursor-pointer">
              Terms
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// LOGIN VIEW
// ==========================================
export const LoginView: React.FC<{
  onNavigate: (screen: ScreenId) => void;
  onLoginSuccess: () => void;
  onGoogleLoginSuccess?: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ onNavigate, onLoginSuccess, onGoogleLoginSuccess, onShowToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onShowToast('Authenticated successfully!', 'success');
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Authentication failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onShowToast('Authenticated successfully with Google!', 'success');
      if (onGoogleLoginSuccess) {
        onGoogleLoginSuccess();
      } else {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Google Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar select-none">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('onboarding')} className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-white/50 tracking-wider uppercase">Authentication Hub</span>
      </div>

      {/* Main Form container */}
      <div className="my-auto max-w-md w-full mx-auto space-y-6 py-6">
        <div className="text-center space-y-2 mb-4">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Welcome back to Nomis</h2>
          <p className="text-xs text-white/55">Refracting visual creativity with flawless motion.</p>
        </div>

        <GlassCard className="p-6 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <GlassInput
              label="Creator Email"
              type="email"
              placeholder="elena@nomis.design"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              disabled={loading}
            />
            <GlassInput
              label="Private Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-[10px] font-bold text-white/50 hover:text-white uppercase select-none cursor-pointer"
                  disabled={loading}
                >
                  Forgot?
                </button>
              }
              required
              disabled={loading}
            />
            <GlassButton type="submit" variant="primary" size="lg" className="w-full mt-2" icon={<LogIn className="w-4 h-4" />} disabled={loading}>
              {loading ? 'Authenticating...' : 'Secure Login'}
            </GlassButton>
          </form>

          {/* Social login divider */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute inset-x-0 h-[1px] bg-white/10" />
            <span className="relative z-10 px-3 bg-neutral-950/80 text-[9px] font-bold text-white/40 tracking-wider uppercase">
              Or connect credentials
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <GlassButton variant="secondary" size="sm" onClick={handleGoogleLogin} className="text-xs select-none" disabled={loading} icon={<Chrome className="w-3.5 h-3.5 shrink-0" />}>
              Google Account
            </GlassButton>
            <GlassButton variant="secondary" size="sm" onClick={() => onShowToast('Apple Keychain is only supported on native iOS devices.', 'info')} className="text-xs select-none" disabled={loading}>
              Apple Keychain
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* Footer redirection */}
      <div className="text-center pt-4">
        <p className="text-xs text-white/50 font-medium">
          New to our platform?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-white font-bold hover:underline tracking-wide cursor-pointer"
          >
            Create Creator Account
          </button>
        </p>
      </div>
    </div>
  );
};

// ==========================================
// REGISTER VIEW
// ==========================================
export const RegisterView: React.FC<{
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ onNavigate, onShowToast }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    setLoading(true);
    try {
      await registerWithEmail(email, password, username);
      onShowToast('Nomis Creator Account registered successfully!', 'success');
      onNavigate('home');
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar select-none">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('login')} className="text-white/50 hover:text-white transition-colors" disabled={loading}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-white/50 tracking-wider uppercase">Creation Portal</span>
      </div>

      {/* Main form */}
      <div className="my-auto max-w-md w-full mx-auto space-y-6 py-6">
        <div className="text-center space-y-2 mb-4">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Join the Vision</h2>
          <p className="text-xs text-white/55">Experience short-form streaming crafted for absolute luxury.</p>
        </div>

        <GlassCard className="p-6 space-y-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <GlassInput
              label="Unique Username"
              type="text"
              placeholder="elena_design"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
              disabled={loading}
            />
            <GlassInput
              label="Email Address"
              type="email"
              placeholder="elena@nomis.design"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              disabled={loading}
            />
            <GlassInput
              label="Secure Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              disabled={loading}
            />
            <GlassButton type="submit" variant="primary" size="lg" className="w-full mt-2" icon={<UserPlus className="w-4 h-4" />} disabled={loading}>
              {loading ? 'Creating Account...' : 'Generate Account'}
            </GlassButton>
          </form>
        </GlassCard>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-xs text-white/50 font-medium">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-white font-bold hover:underline tracking-wide cursor-pointer"
          >
            Sign In Instead
          </button>
        </p>
      </div>
    </div>
  );
};

// ==========================================
// FORGOT PASSWORD VIEW
// ==========================================
export const ForgotPasswordView: React.FC<{
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ onNavigate, onShowToast }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await resetPassword(email);
      onShowToast('Password reset link sent to your email!', 'success');
      onNavigate('login');
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Password reset failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black p-8 flex flex-col justify-between select-none">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('login')} className="text-white/50 hover:text-white transition-colors" disabled={loading}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-white/50 tracking-wider uppercase">Credentials Recovery</span>
      </div>

      <div className="my-auto max-w-sm w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Reset Connection</h2>
          <p className="text-xs text-white/50 max-w-xs mx-auto">
            Provide your registered email. We will broadcast a secure reset link.
          </p>
        </div>

        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label="Registered Email"
              type="email"
              placeholder="elena@nomis.design"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              disabled={loading}
            />
            <GlassButton type="submit" variant="primary" size="md" className="w-full mt-2" icon={<KeyRound className="w-4 h-4" />} disabled={loading}>
              {loading ? 'Broadcasting...' : 'Broadcast Reset Link'}
            </GlassButton>
          </form>
        </GlassCard>
      </div>

      <div />
    </div>
  );
};

// ==========================================
// EMAIL VERIFICATION VIEW
// ==========================================
export const EmailVerificationView: React.FC<{
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string) => void;
}> = ({ onNavigate, onShowToast }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);

  const handleInputChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const nextCode = [...code];
    nextCode[index] = val.substring(val.length - 1);
    setCode(nextCode);

    // Focus next input automatically
    if (val && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('Nomis Creator Account verified successfully!');
    onNavigate('home');
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black p-8 flex flex-col justify-between select-none">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate('register')} className="text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-white/50 tracking-wider uppercase">Device Authentication</span>
      </div>

      <div className="my-auto max-w-sm w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Validate Identity</h2>
          <p className="text-xs text-white/50">
            A 6-digit cryptographic visual key was dispatched to your inbox. Insert code below:
          </p>
        </div>

        <GlassCard className="p-6">
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="flex gap-2 justify-between">
              {code.map((digit, i) => (
                <input
                  key={i}
                  id={`digit-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  className="w-10 h-12 text-center text-lg font-bold bg-white/[0.04] border border-white/10 focus:border-white rounded-xl text-white focus:outline-none transition-all"
                />
              ))}
            </div>

            <GlassButton type="submit" variant="primary" size="md" className="w-full mt-2">
              Validate and Enter
            </GlassButton>
          </form>
        </GlassCard>
      </div>

      <div className="text-center">
        <button
          onClick={() => onShowToast('A fresh verification token has been transmitted.')}
          className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-wider transition-colors"
        >
          Resend Secret Token
        </button>
      </div>
    </div>
  );
};
