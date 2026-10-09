import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import {
  UserCheck, UserX, X, Clock,
  RefreshCw, CheckCircle, Building, Mail
} from 'lucide-react';

interface PendingAnalystsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const PendingAnalystsModal: React.FC<PendingAnalystsModalProps> = ({
  isOpen,
  onClose,
  onUpdated
}) => {
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionFeedback] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.getPendingAnalysts();
      setPendingList(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPending();
      setActionFeedback(null);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleApprove = async (id: number, username: string) => {
    try {
      setProcessingId(id);
      await api.approveAnalyst(id);
      setActionFeedback(`Analyst '${username}' approved! Account status is now ACTIVE.`);
      await fetchPending();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number, username: string) => {
    try {
      setProcessingId(id);
      await api.rejectAnalyst(id);
      setActionFeedback(`Registration for '${username}' rejected.`);
      await fetchPending();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  // Use createPortal to mount directly to document.body with max z-index
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        // Close when clicking directly on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="max-w-2xl w-full max-h-[90vh] flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] font-mono overflow-hidden transition-all duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-[var(--bg-secondary)]/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-500 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-100 font-display uppercase tracking-wide">
                  Pending Analyst Registrations
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/40">
                  {pendingList.length} QUEUED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5 hidden sm:block">
                Review and approve analyst credentials for zero-trust security access.
              </p>
            </div>
          </div>

          {/* Primary Top Close Button */}
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm group"
            title="Close this window (or press Esc)"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
            <span className="hidden sm:inline">Close</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400">Esc</span>
          </button>
        </div>

        {/* Feedback message banner */}
        {actionMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between shadow-md">
            <span>{actionMsg}</span>
            <button 
              onClick={() => setActionFeedback(null)} 
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* List of Pending Analysts */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Fetching pending approval requests...
            </div>
          ) : pendingList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-slate-800/80 rounded-2xl bg-slate-900/40 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-90" />
              <p className="font-bold text-slate-200 text-sm">All Registration Queues Cleared</p>
              <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
                There are no security analyst accounts currently awaiting approval. All authorized users have active status.
              </p>
            </div>
          ) : (
            pendingList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100 text-sm">{item.full_name || item.username}</span>
                    <span className="text-[11px] text-cyan-400 font-mono">(@{item.username})</span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/15 text-amber-500 border border-amber-500/40">
                      PENDING
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.email}</span>
                    </span>
                    {item.organization && (
                      <span className="flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.organization}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={processingId === item.id}
                    onClick={() => handleApprove(item.id, item.username)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold transition-colors flex items-center space-x-1.5 cursor-pointer text-xs shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    disabled={processingId === item.id}
                    onClick={() => handleReject(item.id, item.username)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-50 text-rose-400 border border-rose-500/40 font-bold transition-colors flex items-center space-x-1.5 cursor-pointer text-xs"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer with Dedicated Close Section */}
        <div className="px-6 py-3.5 border-t border-slate-700/60 bg-[var(--bg-secondary)]/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Zero-Trust Enterprise Access Control</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={fetchPending}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 font-mono transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh Queue</span>
            </button>

            {/* Dedicated Closing Section Button */}
            <button
              onClick={onClose}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white font-mono font-bold transition-all cursor-pointer shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Window</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
