/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Compass, ShieldAlert, WifiOff, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ScreenId } from '../types';
import { GlassButton, GlassCard } from '../components/GlassDesignSystem';

interface SystemViewProps {
  onNavigate: (screen: ScreenId) => void;
  onRetry?: () => void;
}

// ==========================================
// 404 PAGE NOT FOUND
// ==========================================
export const NotFoundView: React.FC<SystemViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black flex flex-col items-center justify-center p-8 text-center select-none">
      <motion.div
        initial={{ rotate: -15, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="mb-6 p-5 rounded-3xl bg-white/5 border border-white/10 text-white shadow-xl animate-bounce"
      >
        <Compass className="w-12 h-12 text-white/50" />
      </motion.div>

      <div className="space-y-2 mb-6 max-w-sm">
        <h1 className="text-5xl font-black text-white tracking-widest leading-none">404</h1>
        <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">Refraction Coordinates Lost</h2>
        <p className="text-xs text-white/40 leading-relaxed">
          The requested visual nodes do not exist in the Nomis network. It may have been un-published or moved.
        </p>
      </div>

      <GlassButton variant="primary" size="md" onClick={() => onNavigate('home')} icon={<ArrowLeft className="w-4 h-4" />}>
        Return to Feed
      </GlassButton>
    </div>
  );
};

// ==========================================
// MAINTENANCE MODE
// ==========================================
export const MaintenanceView: React.FC<SystemViewProps> = ({ onNavigate, onRetry }) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-neutral-950 to-neutral-900 flex flex-col items-center justify-center p-8 text-center select-none">
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="mb-6 p-5 rounded-3xl bg-white/5 border border-white/10 text-white shadow-xl"
      >
        <ShieldAlert className="w-12 h-12 text-amber-400" />
      </motion.div>

      <div className="space-y-2 mb-6 max-w-xs">
        <h2 className="text-xl font-black text-white tracking-widest uppercase">System Maintenance</h2>
        <p className="text-xs text-white/40 leading-relaxed">
          Nomis nodes are undergoing secure software upgrades to enhance glass refraction and micro-settlement ledgers.
        </p>
      </div>

      <div className="flex gap-3">
        {onRetry && (
          <GlassButton variant="primary" size="sm" onClick={onRetry} className="text-xs">
            Check Connection
          </GlassButton>
        )}
        <GlassButton variant="secondary" size="sm" onClick={() => onNavigate('settings')} className="text-xs">
          Open Admin Panel
        </GlassButton>
      </div>
    </div>
  );
};

// ==========================================
// OFFLINE MODE
// ==========================================
export const OfflineView: React.FC<SystemViewProps> = ({ onNavigate, onRetry }) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="mb-6 p-5 rounded-3xl bg-white/5 border border-white/10 text-white/40 shadow-xl">
        <WifiOff className="w-12 h-12 text-white/30 animate-pulse" />
      </div>

      <div className="space-y-2 mb-6 max-w-xs">
        <h2 className="text-xl font-black text-white tracking-widest uppercase">Connection Lost</h2>
        <p className="text-xs text-white/40 leading-relaxed">
          Offline Mode active. Nomis cannot map vertical visual feeds without live cryptographic network connections.
        </p>
      </div>

      <div className="flex gap-3">
        {onRetry && (
          <GlassButton variant="primary" size="sm" onClick={onRetry} className="text-xs">
            Reconnect Node
          </GlassButton>
        )}
        <GlassButton variant="secondary" size="sm" onClick={() => onNavigate('settings')} className="text-xs">
          Open Admin Panel
        </GlassButton>
      </div>
    </div>
  );
};
