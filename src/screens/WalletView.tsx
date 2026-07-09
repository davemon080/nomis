/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, ArrowUpRight, ArrowDownLeft, Wallet, ShieldCheck, HelpCircle, ArrowLeft, Check, RefreshCw } from 'lucide-react';
import { ScreenId, Transaction } from '../types';
import { GlassCard, GlassButton, GlassInput, GlassDialog } from '../components/GlassDesignSystem';
import { mockTransactions } from '../data/mockData';

interface WalletViewProps {
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (message: string) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  onNavigate,
  onShowToast
}) => {
  const [balance, setBalance] = useState(0.00);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Withdrawal Form Modal States
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState('PayPal');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleOpenWithdraw = () => {
    setShowWithdrawDialog(true);
    setWithdrawAmount('');
    setIsProcessing(false);
    setIsCompleted(false);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      onShowToast('Please specify a positive withdrawal sum.');
      return;
    }
    if (amount > balance) {
      onShowToast('Insufficient creator balances.');
      return;
    }

    // Trigger loading sequence
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsCompleted(true);
      setBalance((old) => old - amount);
      
      // Inject transaction
      const newTx: Transaction = {
        id: `t-${Date.now()}`,
        type: 'withdraw',
        amount: -amount,
        status: 'pending',
        date: 'July 05, 2026',
        method: `${withdrawMethod} Withdrawal`
      };
      setTransactions((prev) => [newTx, ...prev]);
      
      onShowToast(`Withdrawal transfer of $${amount} successfully broadcasted!`);
    }, 1800);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-950 to-black p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar select-none pb-24 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate('creator-dashboard')} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Wallet className="w-5 h-5 text-white" />
          <h1 className="text-xl font-black text-white tracking-widest uppercase">CREATOR WALLET</h1>
        </div>
        <button
          onClick={() => onShowToast('Nomis Wallet uses end-to-end cryptographic key splits.')}
          className="text-white/40 hover:text-white"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Glass Balance Board */}
      <GlassCard className="relative overflow-hidden p-6 border-white/20 dark:border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent flex flex-col justify-between h-44 shadow-2xl">
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold tracking-widest uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          <span>Nomis Vault Secured</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tight leading-none">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
            Net Creator Dividend
          </p>
        </div>

        <div>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleOpenWithdraw}
            icon={<ArrowUpRight className="w-3.5 h-3.5" />}
            className="w-full text-xs font-bold py-3 rounded-xl"
          >
            Initiate Secure Withdrawal
          </GlassButton>
        </div>
      </GlassCard>

      {/* Transaction History list */}
      <div className="space-y-3 flex-1">
        <div className="flex justify-between items-center pl-1">
          <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
            Transaction Registry
          </h3>
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
            All Settlements
          </span>
        </div>

        <div className="space-y-2.5">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3.5 rounded-2xl border border-white/[0.05] bg-white/[0.02] flex items-center justify-between transition-colors hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Visual arrow indicator based on tx type */}
                <div className={`p-2 rounded-full border flex items-center justify-center
                  ${tx.amount > 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }
                `}>
                  {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate">{tx.method || 'Nomis Platform'}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{tx.date}</p>
                </div>
              </div>

              {/* Amount and Status block */}
              <div className="text-right flex-shrink-0 pl-2">
                <p className={`text-xs font-black
                  ${tx.amount > 0 ? 'text-emerald-400' : 'text-white/90'}
                `}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className={`text-[9px] font-bold uppercase tracking-wider block mt-0.5
                  ${tx.status === 'completed' ? 'text-green-400/80' : tx.status === 'pending' ? 'text-yellow-400/80 animate-pulse' : 'text-red-400/80'}
                `}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal Interactive Popup Modal */}
      <GlassDialog
        isOpen={showWithdrawDialog}
        onClose={() => !isProcessing && setShowWithdrawDialog(false)}
        title="Creator Withdrawal Protocol"
      >
        <AnimatePresence mode="wait">
          {!isProcessing && !isCompleted ? (
            /* Entry Form state */
            <motion.form
              key="withdraw-form"
              onSubmit={handleWithdrawSubmit}
              className="space-y-4 text-left"
            >
              <p className="text-xs text-white/50 leading-relaxed mb-1 text-center">
                Refract your accumulated creator balance instantly into third-party payment rails.
              </p>

              {/* Method toggler */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Settlement Method</span>
                <div className="grid grid-cols-2 gap-2 bg-black/40 border border-white/10 p-1.5 rounded-xl">
                  {['PayPal', 'Bank Wire'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawMethod(m)}
                      className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors
                        ${withdrawMethod === m ? 'bg-white text-black' : 'text-white/60 hover:text-white'}
                      `}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <GlassInput
                label="Withdrawal Sum ($)"
                type="number"
                placeholder="Maximum 3140.50"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                icon={<DollarSign className="w-4 h-4 text-white/30" />}
                required
              />

              <div className="flex gap-2.5 pt-2">
                <GlassButton
                  type="button"
                  variant="ghost"
                  onClick={() => setShowWithdrawDialog(false)}
                  className="flex-1 text-xs"
                >
                  Dismiss
                </GlassButton>
                <GlassButton
                  type="submit"
                  variant="primary"
                  className="flex-1 text-xs"
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                >
                  Authorize
                </GlassButton>
              </div>
            </motion.form>
          ) : isProcessing ? (
            /* Processing loading state */
            <motion.div
              key="withdraw-loading"
              className="flex flex-col items-center justify-center p-6 text-center gap-4 min-h-[220px]"
            >
              <RefreshCw className="w-10 h-10 text-white animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-black text-white uppercase tracking-wider">Processing Security Keys</p>
                <p className="text-xs text-white/40">Broadcasting transaction to Nomis Settlement Pool...</p>
              </div>
            </motion.div>
          ) : (
            /* Success state */
            <motion.div
              key="withdraw-completed"
              className="flex flex-col items-center justify-center p-6 text-center gap-4 min-h-[220px]"
            >
              <div className="w-14 h-14 rounded-full bg-green-500/25 border-2 border-green-500 text-green-400 flex items-center justify-center shadow-lg">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-black text-white uppercase tracking-wider">Transfer Broadcasted!</p>
                <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto">
                  Your $ {Number(withdrawAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} withdrawal has been accepted into settlement queue.
                </p>
              </div>
              <GlassButton
                variant="primary"
                onClick={() => setShowWithdrawDialog(false)}
                className="w-full text-xs font-bold mt-2"
              >
                Return to Wallet
              </GlassButton>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassDialog>
    </div>
  );
};
