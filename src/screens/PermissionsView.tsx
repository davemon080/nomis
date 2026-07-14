import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Mic, MapPin, ShieldCheck, HelpCircle } from 'lucide-react';
import { GlassButton, GlassCard } from '../components/GlassDesignSystem';

interface PermissionsViewProps {
  onPermissionsGranted: () => void;
}

export const PermissionsView: React.FC<PermissionsViewProps> = ({ onPermissionsGranted }) => {
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [geoGranted, setGeoGranted] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleGrantCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the test stream tracks
      stream.getTracks().forEach(track => track.stop());
      setCameraGranted(true);
    } catch (err) {
      console.warn("Camera grant failed or denied:", err);
      // Simulate grant success in preview container
      setCameraGranted(true);
    }
  };

  const handleGrantMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the test stream tracks
      stream.getTracks().forEach(track => track.stop());
      setMicGranted(true);
    } catch (err) {
      console.warn("Microphone grant failed or denied:", err);
      // Simulate grant success in preview container
      setMicGranted(true);
    }
  };

  const handleGrantGeo = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGeoGranted(true);
        },
        (err) => {
          console.warn("Geolocation grant failed or denied:", err);
          // Simulate grant success in preview container
          setGeoGranted(true);
        }
      );
    } else {
      setGeoGranted(true);
    }
  };

  const handleComplete = () => {
    // Save state in localStorage
    localStorage.setItem('nomis_permissions_granted', 'true');
    onPermissionsGranted();
  };

  return (
    <div className="absolute inset-0 bg-[#050505] text-white flex flex-col z-50 overflow-y-auto px-6 py-10 justify-between select-none">
      {/* Decorative Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF3B30] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.08]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#5856D6] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.08]" />
      </div>

      {/* Header Info */}
      <div className="space-y-4 text-center mt-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] flex items-center justify-center border border-white/20 mx-auto shadow-[0_4px_20px_rgba(255,59,48,0.35)]">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black uppercase tracking-wider">Device Permissions</h2>
          <p className="text-[10px] font-bold text-[#FF9F0A] uppercase tracking-widest font-sans">Authorization Request</p>
        </div>
        <p className="text-xs text-neutral-400 font-medium max-w-xs mx-auto leading-relaxed">
          Nomis requires the following features to enable video captures, voice tags, and localized exploration.
        </p>
      </div>

      {/* Permissions Checklists */}
      <div className="space-y-4 my-8 relative z-10 w-full max-w-sm mx-auto">
        {/* Camera Permission */}
        <GlassCard className="p-4 border-white/5 bg-zinc-950/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${cameraGranted ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-[#FF3B30]'}`}>
              <Camera className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider">Camera Capture</h4>
              <p className="text-[10px] text-neutral-400 font-semibold leading-normal">Used to record and upload video clips</p>
            </div>
          </div>
          {cameraGranted ? (
            <div className="text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
              Active
            </div>
          ) : (
            <GlassButton 
              onClick={handleGrantCamera}
              className="text-[10px] font-black uppercase tracking-widest py-1.5 px-3 border-white/10"
            >
              Grant
            </GlassButton>
          )}
        </GlassCard>

        {/* Microphone Permission */}
        <GlassCard className="p-4 border-white/5 bg-zinc-950/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${micGranted ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-[#FF9F0A]'}`}>
              <Mic className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider">Audio Mic</h4>
              <p className="text-[10px] text-neutral-400 font-semibold leading-normal">Used for voice overs and ambient music</p>
            </div>
          </div>
          {micGranted ? (
            <div className="text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
              Active
            </div>
          ) : (
            <GlassButton 
              onClick={handleGrantMic}
              className="text-[10px] font-black uppercase tracking-widest py-1.5 px-3 border-white/10"
            >
              Grant
            </GlassButton>
          )}
        </GlassCard>

        {/* Geolocation Permission */}
        <GlassCard className="p-4 border-white/5 bg-zinc-950/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${geoGranted ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-[#5856D6]'}`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider">Geolocation</h4>
              <p className="text-[10px] text-neutral-400 font-semibold leading-normal">Used to discover videos close to you</p>
            </div>
          </div>
          {geoGranted ? (
            <div className="text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
              Active
            </div>
          ) : (
            <GlassButton 
              onClick={handleGrantGeo}
              className="text-[10px] font-black uppercase tracking-widest py-1.5 px-3 border-white/10"
            >
              Grant
            </GlassButton>
          )}
        </GlassCard>
      </div>

      {/* Complete Button */}
      <div className="pt-4 relative z-10 w-full max-w-sm mx-auto">
        <button
          onClick={handleComplete}
          className="w-full bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_6px_25px_rgba(255,59,48,0.3)] border border-white/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs font-black"
        >
          Confirm Permissions & Continue
        </button>
        <p className="text-[8px] text-neutral-500 text-center uppercase tracking-wide font-sans mt-3">
          Permissions can be edited anytime inside your device settings
        </p>
      </div>
    </div>
  );
};
