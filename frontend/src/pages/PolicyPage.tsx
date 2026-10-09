import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3, CheckCircle2, RefreshCw, ShieldCheck, AlertTriangle,
  Sliders, Info, X, SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { modalVariants } from '../lib/animations';

export const PolicyPage: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [formStatus, setFormStatus] = useState<string>('requires_review');
  const [formWeight, setFormWeight] = useState<number>(50);
  const [formNotes, setFormNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { hasRole } = useAuth();

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.getPolicies();
      setPolicies(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const openEditModal = (p: any) => {
    setEditingPolicy(p);
    setFormStatus(p.approval_status);
    setFormWeight(p.risk_weight);
    setFormNotes(p.notes || '');
    setSuccessMsg(null);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    try {
      setSaving(true);
      await api.updatePolicy(editingPolicy.id, {
        approval_status: formStatus,
        risk_weight: Number(formWeight),
        notes: formNotes
      });
      setSuccessMsg(`Policy for ${editingPolicy.provider_name} successfully updated to v${editingPolicy.version + 1}`);
      setEditingPolicy(null);
      await fetchPolicies();
    } catch (err: any) {
      alert(err.message || 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-approved">Approved</span>;
      case 'unapproved':
        return <span className="badge badge-unapproved">Unapproved</span>;
      default:
        return <span className="badge badge-review">Requires Review</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              Access Control &amp; Compliance
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Governance &amp; Policy Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure enterprise approval states, baseline risk scoring weights, and versioned compliance rules.
          </p>
        </div>

        <button
          onClick={fetchPolicies}
          className="btn btn-ghost self-start md:self-center"
          aria-label="Reload policy rules"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Rules</span>
        </button>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Policies Table Card */}
      <div className="card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Enterprise AI Provider Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">Rules actively enforce detection thresholds across incoming network telemetry</p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
            {policies.length} Policies Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th scope="col">Target Provider</th>
                <th scope="col">Policy Rule</th>
                <th scope="col">Approval Status</th>
                <th scope="col">Risk Weight</th>
                <th scope="col">Policy Version</th>
                <th scope="col">Last Modified</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No enterprise policy rules configured yet.
                  </td>
                </tr>
              )}
              {policies.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold text-slate-900">{p.provider_name}</td>
                  <td className="text-slate-600">{p.rule_name}</td>
                  <td>{getStatusBadge(p.approval_status)}</td>
                  <td>
                    <div className="flex items-center space-x-2.5">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            p.risk_weight > 60
                              ? 'bg-rose-500'
                              : p.risk_weight > 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, p.risk_weight))}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {p.risk_weight}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      v{p.version}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500 whitespace-nowrap">
                    {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Initial'}
                  </td>
                  <td className="text-right">
                    {hasRole(['admin']) ? (
                      <button
                        onClick={() => openEditModal(p)}
                        className="btn btn-ghost text-xs py-1 px-2.5"
                        aria-label={`Edit policy rule for ${p.provider_name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Edit Rule</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Read-Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Policy Modal */}
      <AnimatePresence>
        {editingPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPolicy(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10"
              role="dialog"
              aria-modal="true"
              aria-labelledby="policy-dialog-title"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center">
                    <Sliders className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 id="policy-dialog-title" className="text-base font-bold text-slate-900">
                      Modify Governance Policy
                    </h3>
                    <p className="text-xs text-slate-500">
                      Target: <span className="font-semibold text-slate-700">{editingPolicy.provider_name}</span> (Current v{editingPolicy.version})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingPolicy(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSavePolicy} className="p-6 space-y-5">
                <div>
                  <label htmlFor="form-status" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Approval Status
                  </label>
                  <select
                    id="form-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="unapproved">Unapproved (Shadow AI Violation)</option>
                    <option value="requires_review">Requires Security Review</option>
                    <option value="approved">Approved Enterprise Service</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Unapproved services immediately trigger alert generation when detected in network telemetry.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="form-weight" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Risk Weight Bias (0–100)
                    </label>
                    <span className="font-mono text-sm font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {formWeight} / 100
                    </span>
                  </div>
                  <input
                    id="form-weight"
                    type="range"
                    min="0"
                    max="100"
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                    <span>0 (Low Risk)</span>
                    <span>50 (Moderate)</span>
                    <span>100 (Critical)</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="form-notes" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Compliance Justification / Audit Notes
                  </label>
                  <textarea
                    id="form-notes"
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Provide justification or enterprise compliance reference..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPolicy(null)}
                    className="btn btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary text-sm"
                  >
                    {saving ? 'Publishing...' : `Publish as v${editingPolicy.version + 1}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
