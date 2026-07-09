/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ShieldAlert, Star, Compass, UserCheck, Volume2, AlertCircle, RefreshCw } from 'lucide-react';

// ==========================================
// 1. GLASS BUTTON
// ==========================================
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'glass',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/20 select-none active:scale-95';
  
  const variants = {
    primary: 'bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] text-white hover:opacity-90 shadow-[0_4px_15px_rgba(255,59,48,0.35)] border border-white/10',
    secondary: 'bg-black/30 dark:bg-white/10 text-white hover:bg-black/40 dark:hover:bg-white/15 border border-white/20 backdrop-blur-md',
    glass: 'bg-white/10 dark:bg-white/5 text-white hover:bg-white/20 dark:hover:bg-white/10 border border-white/15 dark:border-white/10 backdrop-blur-lg shadow-lg',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/20 text-red-300 hover:bg-red-500/35 border border-red-500/30 backdrop-blur-md'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
    lg: 'px-6 py-3.5 text-base gap-2.5 rounded-2xl',
    icon: 'p-2.5 rounded-full'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...(props as any)}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
};

// ==========================================
// 2. GLASS CARD
// ==========================================
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  id?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick,
  id
}) => {
  const Component = onClick ? motion.div : 'div';
  return (
    <Component
      id={id}
      {...(onClick ? {
        whileHover: hoverable ? { scale: 1.01, y: -2, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' } : {},
        whileTap: { scale: 0.99 },
        onClick
      } : {})}
      className={`
        bg-white/[0.06] dark:bg-black/[0.35]
        backdrop-blur-xl 
        border border-white/[0.12] dark:border-white/[0.06] 
        rounded-2xl 
        p-5 
        shadow-[0_8px_32px_rgba(0,0,0,0.15)] 
        transition-all duration-300 
        ${className}
      `}
    >
      {children}
    </Component>
  );
};

// ==========================================
// 3. GLASS TEXT FIELD / INPUT
// ==========================================
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  icon,
  rightElement,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-white/50 tracking-wider uppercase pl-1">{label}</label>}
      <div className="relative flex items-center rounded-xl bg-white/[0.04] dark:bg-black/[0.2] border border-white/[0.1] dark:border-white/[0.05] focus-within:border-white/30 transition-all duration-300 backdrop-blur-md">
        {icon && <div className="pl-3 text-white/40">{icon}</div>}
        <input
          className={`w-full py-3 px-3.5 bg-transparent text-base text-white placeholder-white/30 focus:outline-none ${icon ? 'pl-2' : ''} ${rightElement ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {rightElement && <div className="absolute right-3 text-white/40">{rightElement}</div>}
      </div>
    </div>
  );
};

// ==========================================
// 4. GLASS AVATAR
// ==========================================
interface GlassAvatarProps {
  src: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
  isVerified?: boolean;
  onClick?: () => void;
}

export const GlassAvatar: React.FC<GlassAvatarProps> = ({
  src,
  name,
  size = 'md',
  ring = false,
  isVerified = false,
  onClick
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state when source changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-28 h-28 text-2xl'
  };

  const ringStyle = ring ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-black/20' : '';

  // Get initials for styled fallback
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
    : 'U';

  const getAvatarBg = (str: string) => {
    const code = str.charCodeAt(0) || 0;
    const colors = [
      'from-orange-500 to-amber-600',
      'from-pink-500 to-rose-600',
      'from-purple-500 to-indigo-600',
      'from-blue-500 to-sky-600',
      'from-emerald-500 to-teal-600',
      'from-cyan-500 to-blue-600'
    ];
    return colors[code % colors.length];
  };

  const bgGradient = getAvatarBg(name || 'U');

  return (
    <div className="relative inline-block flex-shrink-0 cursor-pointer" onClick={onClick}>
      <div className={`relative rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center ${sizes[size]} ${ringStyle} transition-all duration-300 hover:scale-105`}>
        {src && !imgError ? (
          <img 
            src={src} 
            alt={name} 
            className="w-full h-full object-cover"
            loading="eager"
            referrerPolicy="no-referrer"
            onError={() => {
              setImgError(true);
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-tr ${bgGradient}`}>
            <span className="font-extrabold text-white tracking-wider drop-shadow-sm">{initials}</span>
          </div>
        )}
      </div>
      {isVerified && (
        <span className={`absolute bottom-0 right-0 bg-blue-500 text-white rounded-full flex items-center justify-center border-2 border-black z-20
          ${size === 'xs' ? 'w-2.5 h-2.5 p-0' : size === 'sm' ? 'w-3.5 h-3.5 p-0.5' : 'w-4.5 h-4.5 p-0.5'}
        `}>
          <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </span>
      )}
    </div>
  );
};

// ==========================================
// 5. GLASS CHIP
// ==========================================
interface GlassChipProps {
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const GlassChip: React.FC<GlassChipProps> = ({
  label,
  active = false,
  icon,
  onClick
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 select-none
        ${active
          ? 'bg-[#FF3B30] text-white border-[#FF3B30] shadow-[0_4px_12px_rgba(255,59,48,0.35)] font-semibold'
          : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
        }
      `}
    >
      {icon}
      {label}
    </motion.button>
  );
};

// ==========================================
// 6. GLASS BADGE
// ==========================================
interface GlassBadgeProps {
  content: React.ReactNode;
  variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info';
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  content,
  variant = 'primary',
  className = ''
}) => {
  const styles = {
    primary: 'bg-white/15 border-white/20 text-white',
    danger: 'bg-red-500/20 border-red-500/30 text-red-300',
    success: 'bg-green-500/20 border-green-500/30 text-green-300',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-300'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase border ${styles[variant]} ${className}`}>
      {content}
    </span>
  );
};

// ==========================================
// 7. GLASS SWITCH / TOGGLE
// ==========================================
interface GlassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const GlassSwitch: React.FC<GlassSwitchProps> = ({
  checked,
  onChange,
  label
}) => {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none py-1.5">
      {label && <span className="text-sm font-medium text-white/80">{label}</span>}
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-11 h-6 rounded-full border transition-colors duration-300 ${checked ? 'bg-gradient-to-tr from-[#FF3B30] to-[#FF9F0A] border-transparent' : 'bg-white/5 border-white/15'}`} />
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${checked ? 'translate-x-5 bg-black' : 'bg-white'}`} />
      </div>
    </label>
  );
};

// ==========================================
// 8. GLASS SLIDER
// ==========================================
interface GlassSliderProps {
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
}

export const GlassSlider: React.FC<GlassSliderProps> = ({
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  label
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-white/60 font-medium">
        {label && <span>{label}</span>}
        <span>{value} / {max}</span>
      </div>
      <div className="relative w-full flex items-center h-5 select-none">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:bg-white/15 focus:outline-none"
        />
      </div>
    </div>
  );
};

// ==========================================
// 9. GLASS TAB BAR
// ==========================================
interface GlassTabBarProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

export const GlassTabBar: React.FC<GlassTabBarProps> = ({
  tabs,
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex bg-white/[0.04] dark:bg-black/[0.25] p-1 rounded-xl border border-white/[0.08] dark:border-white/[0.05] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className="relative flex-1 py-2 text-xs font-semibold rounded-lg tracking-wide uppercase transition-all duration-300 text-center select-none"
          >
            {isActive && (
              <motion.div
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-white shadow-[0_2px_10px_rgba(255,255,255,0.1)] rounded-lg"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-black font-bold' : 'text-white/60 hover:text-white'}`}>
              {tab}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ==========================================
// 10. GLASS PROGRESS INDICATOR / LOADERS
// ==========================================
export const GlassProgressBar: React.FC<{ value: number; max?: number }> = ({ value, max = 100 }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden backdrop-blur-md">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-gradient-to-r from-[#FF3B30] to-[#FF9F0A] h-full shadow-[0_0_10px_rgba(255,59,48,0.6)]"
      />
    </div>
  );
};

export const GlassSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dimensions = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };

  return (
    <div className={`relative flex items-center justify-center`}>
      <div className={`rounded-full border-white/10 animate-spin border-t-white ${dimensions[size]}`} />
    </div>
  );
};

// ==========================================
// 11. GLASS SKELETON LOADER
// ==========================================
export const GlassSkeletonLoader: React.FC<{ className?: string }> = ({ className = 'w-full h-4 rounded' }) => {
  return (
    <div className={`relative overflow-hidden bg-white/[0.04] dark:bg-black/[0.25] border border-white/[0.05] ${className}`}>
      <motion.div
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent w-1/2"
      />
    </div>
  );
};

// ==========================================
// 12. GLASS LIST TILE
// ==========================================
interface GlassListTileProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const GlassListTile: React.FC<GlassListTileProps> = ({
  icon,
  title,
  subtitle,
  rightElement,
  onClick,
  className = ''
}) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`
        w-full flex items-center justify-between text-left p-3.5 rounded-xl border border-white/[0.05] dark:border-white/[0.02] bg-white/[0.03] dark:bg-black/[0.15] hover:bg-white/[0.07] dark:hover:bg-white/[0.04] transition-all duration-300 group ${onClick ? 'cursor-pointer select-none active:scale-[0.99]' : ''} ${className}
      `}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div className="flex-shrink-0 text-white/70 group-hover:text-white transition-colors duration-300">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white tracking-wide truncate">{title}</p>
          {subtitle && <p className="text-xs text-white/50 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {rightElement && <div className="flex-shrink-0 pl-2">{rightElement}</div>}
    </Component>
  );
};

// ==========================================
// 13. GLASS EMPTY STATE
// ==========================================
interface GlassEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const GlassEmptyState: React.FC<GlassEmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] backdrop-blur-md">
      <div className="p-4 rounded-full bg-white/[0.04] text-white/60 mb-4 animate-pulse">
        {icon || <Compass className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
      <p className="text-sm text-white/50 max-w-xs mt-2 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <GlassButton variant="primary" size="sm" onClick={onAction} className="mt-5">
          {actionLabel}
        </GlassButton>
      )}
    </div>
  );
};

// ==========================================
// 14. GLASS ERROR STATE
// ==========================================
interface GlassErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}

export const GlassErrorState: React.FC<GlassErrorStateProps> = ({
  title = 'Something Went Wrong',
  description = 'We encountered an error loading this visual feed. Please check your system link.',
  onRetry,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-red-500/10 bg-red-500/[0.03] backdrop-blur-md">
      <div className="p-3.5 rounded-full bg-red-500/10 text-red-400 mb-4 animate-bounce">
        {icon || <AlertCircle className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="text-xs text-white/50 max-w-xs mt-1.5">{description}</p>
      {onRetry && (
        <GlassButton variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="w-3.5 h-3.5" />} className="mt-5 text-xs">
          Retry Link
        </GlassButton>
      )}
    </div>
  );
};

// ==========================================
// 15. GLASS BOTTOM SHEET (DRAWER)
// ==========================================
interface GlassBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const GlassBottomSheet: React.FC<GlassBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[80vh]'
}) => {
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
            className="absolute inset-0 bg-black z-40"
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`absolute bottom-0 left-0 right-0 z-50 bg-black/60 dark:bg-black/85 border-t border-white/15 dark:border-white/5 rounded-t-[2.5rem] flex flex-col backdrop-blur-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.5)] ${maxHeight}`}
          >
            {/* Handle bar */}
            <div className="flex justify-center py-4 cursor-pointer select-none" onClick={onClose}>
              <div className="w-12 h-1 bg-white/20 hover:bg-white/40 transition-colors rounded-full" />
            </div>
            {/* Header */}
            <div className="px-6 pb-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-base font-bold text-white tracking-wide uppercase">{title}</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white text-xs font-semibold tracking-wider uppercase select-none">
                Close
              </button>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// 16. GLASS DIALOG / POPUP
// ==========================================
interface GlassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export const GlassDialog: React.FC<GlassDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  actions
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black"
          />
          {/* Content Box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative w-full max-w-md bg-white/10 dark:bg-black/45 backdrop-blur-2xl border border-white/15 dark:border-white/5 p-6 rounded-3xl shadow-2xl z-10 flex flex-col gap-4 text-center"
          >
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            {description && <p className="text-sm text-white/60 leading-relaxed">{description}</p>}
            {children && <div className="text-left mt-2">{children}</div>}
            <div className="flex items-center justify-center gap-3 mt-4">
              {actions || (
                <>
                  <GlassButton variant="ghost" onClick={onClose}>
                    Cancel
                  </GlassButton>
                  <GlassButton variant="primary" onClick={onClose}>
                    Confirm
                  </GlassButton>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// 17. GLASS TOOLTIP
// ==========================================
export const GlassTooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white tracking-wider uppercase whitespace-nowrap shadow-lg pointer-events-none"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// 18. GLASS SNACKBAR
// ==========================================
export const GlassSnackbar: React.FC<{
  message: string;
  isOpen: boolean;
  type?: 'info' | 'success' | 'error';
  onClose: () => void;
}> = ({ message, isOpen, type = 'info', onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const icons = {
    info: <Compass className="w-4.5 h-4.5 text-blue-400" />,
    success: <Check className="w-4.5 h-4.5 text-green-400" />,
    error: <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="absolute top-4 left-4 right-4 z-50 px-4 py-3 rounded-2xl bg-black/75 dark:bg-zinc-950/90 backdrop-blur-2xl border border-white/15 dark:border-white/10 shadow-2xl flex items-center gap-3"
        >
          {icons[type]}
          <p className="text-xs text-white/95 font-semibold tracking-wide flex-1 leading-normal">{message}</p>
          <button onClick={onClose} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-wider select-none pl-2">
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
