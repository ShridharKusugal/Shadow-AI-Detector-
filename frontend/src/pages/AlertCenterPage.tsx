import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, X,
  Send, RefreshCw, Eye, MessageSquare, History, Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { drawerVariants, modalOverlayVariants, cardVariants, staggerContainer } from '../lib/animations';

/* ── Status badge ─────────────────────────────────────────── */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    open:                 'badge-review',
    in_review:            'badge-info',
    confirmed_violation:  'badge-unapproved',
    false_positive:       'badge-neutral',
    closed:               'badge-approved',
  };
  return (
    <span className={`badge ${map[status] ?? 'badge-neutral'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

/* ── Severity badge ───────────────────────────────────────── */
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const cls =
    severity === 'critical' ? 'badge-unapproved' :
    severity === 'high'     ? 'badge-review'     : 'badge-review';
  const color =
    severity === 'critical' ? '#C93636' :
    severity === 'high'     ? '#C2410C' : '#B77900';
  return (
    <span className={`badge ${cls}`} style={{ color }}>
      {severity}
    </span>
  );
};

export const AlertCenterPage: React.FC = () => {
  const [alerts, setAlerts]             = useState<any[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [detailData, setDetailData]     = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote]                 = useState('');
  const [newStatus, setNewStatus]       = useState<string>('in_review');
  const [assignedUser, setAssignedUser] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const { user, hasRole } = useAuth();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts({ status: statusFilter, limit: 50 });
      setAlerts(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [statusFilter]);

  const handleOpenAlert = async (id: number) => {
    setSelectedAlertId(id);
    setActionFeedback(null);
    try {
      setDetailLoading(true);
      const res = await api.getAlertDetail(id);
      setDetailData(res);
      setNewStatus(res.status);
      setAssignedUser(res.assigned_user || (user?.username || ''));
    } catch (err: any) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmitInvestigation = async (
    e?: React.FormEvent,
    customNote?: string,
    customStatus?: string
  ) => {
    if (e) e.preventDefault();
    const finalNote   = customNote   || note;
    const finalStatus = customStatus || newStatus;
    if (!selectedAlertId || !finalNote.trim()) return;
    try {
      setSubmittingNote(true);
      const updated = await api.investigateAlert(selectedAlertId, {
        action_taken: 'investigation_note_added',
        note: finalNote,
        new_status: finalStatus,
        assigned_username: assignedUser || user?.username || 'analyst'
      });
      setDetailData(updated);
      setNote('');
      setActionFeedback({
        text: `Status updated to "${finalStatus.replace(/_/g, ' ')}" and recorded in audit log.`,
        ok: true
      });
      await fetchAlerts();
    } catch (err: any) {
      setActionFeedback({ text: err.message || 'Update failed.', ok: false });
    } finally {
      setSubmittingNote(false);
    }
  };

  const SCOPES = [
    { id: 'all',                label: 'All Incidents' },
    { id: 'open',               label: 'Open' },
    { id: 'in_review',          label: 'In Review' },
    { id: 'confirmed_violation',label: 'Confirmed Violation' },
    { id: 'closed',             label: 'Closed' },
  ];

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3 flex-wrap">
            Alert & Incident Center
            <span className="badge badge-review text-[10px]">{total} incidents</span>
          </h1>
          <p className="page-subtitle">
            Triage, investigate, and resolve high-risk Shadow AI egress violations with persisted audit history.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="btn btn-ghost text-xs shrink-0"
          aria-label="Reload alerts"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--cyan-accent)' }} aria-hidden="true" />
          Reload
        </button>
      </div>

      {/* ── Status Filter Chips ──────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Filter by status">
        <span className="text-xs font-mono font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Status:</span>
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`filter-chip ${statusFilter === s.id ? 'active' : ''}`}
            aria-pressed={statusFilter === s.id}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Alerts Table ─────────────────────────────────────── */}
      <div className="glass-panel p-5">
        <div className="table-container" role="region" aria-label="Alerts table" aria-live="polite">
          <table aria-label="Security alerts">
            <thead>
              <tr>
                <th scope="col">Alert UUID</th>
                <th scope="col">Severity</th>
                <th scope="col">Title</th>
                <th scope="col">Destination</th>
                <th scope="col">Device</th>
                <th scope="col">Score</th>
                <th scope="col">Status</th>
                <th scope="col">Analyst</th>
                <th scope="col" className="text-right">Triage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="spinner w-7 h-7 mx-auto mb-3" role="status" aria-label="Loading alerts" />
                    <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Loading alerts…</span>
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="empty-state py-0" style={{ color: 'var(--text-muted)' }}>
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-success)' }} aria-hidden="true" />
                      <p className="text-sm font-mono">No active alerts matching this filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                alerts.map((a) => {
                  const destDomain  = a.destination_domain || a.event?.destination_domain || a.event?.normalized_domain || 'AI Endpoint';
                  const alertTitle  = a.title || 'Unsanctioned AI Egress Triggered';
                  const deviceId    = a.device_id || a.event?.device_id || '—';

                  return (
                    <tr
                      key={a.id}
                      onClick={() => handleOpenAlert(a.id)}
                      className="cursor-pointer group"
                      aria-label={`Alert ${a.uuid}, ${alertTitle}`}
                    >
                      <td>
                        <span className="font-mono text-xs truncate max-w-[120px] block" style={{ color: 'var(--cyan-text-override)' }} title={a.uuid}>
                          {a.uuid}
                        </span>
                      </td>
                      <td><SeverityBadge severity={a.severity} /></td>
                      <td className="max-w-[200px]">
                        <span className="font-semibold truncate block text-xs" style={{ color: 'var(--text-primary)' }} title={alertTitle}>
                          {alertTitle}
                        </span>
                      </td>
                      <td>
                        <span
                          className="inline-block font-mono text-xs px-2 py-0.5 rounded max-w-[150px] truncate"
                          style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                          title={destDomain}
                        >
                          {destDomain}
                        </span>
                      </td>
                      <td className="text-xs whitespace-nowrap font-mono" style={{ color: 'var(--text-primary)' }}>{deviceId}</td>
                      <td>
                        <span className="font-bold font-mono text-xs" style={{ color: 'var(--color-danger)' }}>
                          {a.risk_score}/100
                        </span>
                      </td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {a.assigned_user || 'Unassigned'}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenAlert(a.id); }}
                          className="btn btn-ghost text-xs px-3 py-1"
                          aria-label={`Triage alert ${a.uuid}`}
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          Triage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Investigation Drawer ─────────────────────────────── */}
      <AnimatePresence>
        {selectedAlertId && (
          <>
            <motion.div
              key="overlay"
              variants={modalOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(11,31,58,0.3)' }}
              onClick={() => setSelectedAlertId(null)}
              aria-hidden="true"
            />
            <motion.div
              key="drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer w-full max-w-xl p-7 space-y-5 z-50"
              role="dialog"
              aria-modal="true"
              aria-label="Incident case file"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--cyan-text-override)' }}>
                    Incident Case File
                  </span>
                  <h2 className="text-base font-bold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {detailData?.uuid || 'Loading…'}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedAlertId(null)}
                  className="btn btn-ghost p-2"
                  aria-label="Close incident panel"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {detailLoading ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <div className="spinner w-8 h-8" role="status" aria-label="Loading incident details" />
                  <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Loading incident details…</span>
                </div>
              ) : detailData && (
                <div className="space-y-4 text-sm">
                  {/* Summary */}
                  <div className="p-4 rounded-lg space-y-2" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{detailData.title}</span>
                      <span className="badge badge-unapproved shrink-0" style={{ fontSize: '10px' }}>
                        Risk {detailData.risk_score}/100
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{detailData.summary}</p>
                  </div>

                  {/* Feedback */}
                  <AnimatePresence>
                    {actionFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`toast ${actionFeedback.ok ? 'toast-success' : 'toast-danger'}`}
                        role="status"
                        aria-live="polite"
                      >
                        <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{actionFeedback.text}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 1-Click actions */}
                  {hasRole(['admin', 'analyst']) && (
                    <div className="p-4 rounded-lg space-y-2" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
                      <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                        Fast Actions
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={submittingNote}
                          onClick={() => handleSubmitInvestigation(
                            undefined,
                            'Analyst confirmed unapproved Shadow AI egress policy violation.',
                            'confirmed_violation'
                          )}
                          className="btn btn-danger text-xs py-2"
                          aria-label="Confirm as policy violation"
                        >
                          Confirm Violation
                        </button>
                        <button
                          type="button"
                          disabled={submittingNote}
                          onClick={() => handleSubmitInvestigation(
                            undefined,
                            'Investigated and cleared: approved business telemetry false positive.',
                            'false_positive'
                          )}
                          className="btn text-xs py-2"
                          style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid var(--color-warning-border)' }}
                          aria-label="Mark as false positive"
                        >
                          False Positive
                        </button>
                        <button
                          type="button"
                          disabled={submittingNote}
                          onClick={() => handleSubmitInvestigation(
                            undefined,
                            'Remediated policy violation and notified device owner. Incident closed.',
                            'closed'
                          )}
                          className="btn text-xs py-2"
                          style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)' }}
                          aria-label="Resolve and close incident"
                        >
                          Resolve & Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Investigation history */}
                  <div className="p-4 rounded-lg space-y-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-2">
                      <History className="w-3.5 h-3.5" style={{ color: 'var(--cyan-text-override)' }} aria-hidden="true" />
                      <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                        Audit Trail ({detailData.investigations?.length || 0})
                      </span>
                    </div>

                    {detailData.investigations?.length > 0 ? (
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {detailData.investigations.map((inv: any) => (
                          <div
                            key={inv.id}
                            className="p-3 rounded-md space-y-1 text-xs"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                          >
                            <div className="flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                              <span className="font-bold" style={{ color: 'var(--cyan-text-override)' }}>{inv.user}</span>
                              <span>{inv.created_at ? new Date(inv.created_at).toLocaleString() : '—'}</span>
                            </div>
                            <p style={{ color: 'var(--text-primary)' }}>{inv.note}</p>
                            {inv.new_status && (
                              <span className="block" style={{ color: 'var(--text-muted)' }}>
                                Status → <strong style={{ color: 'var(--text-primary)' }}>{inv.new_status.replace(/_/g, ' ')}</strong>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No investigation notes yet.</p>
                    )}
                  </div>

                  {/* Note form */}
                  {hasRole(['admin', 'analyst']) && (
                    <form
                      onSubmit={(e) => handleSubmitInvestigation(e)}
                      className="p-4 rounded-lg space-y-3"
                      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--badge-cyan-border)' }}
                      aria-label="Add investigation note"
                    >
                      <div className="flex items-center gap-2" style={{ color: 'var(--cyan-text-override)' }}>
                        <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="font-semibold text-xs uppercase tracking-wide">Record Finding</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="alert-status" className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Update Status
                          </label>
                          <select
                            id="alert-status"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full p-2 rounded-md text-xs"
                          >
                            <option value="open">Open</option>
                            <option value="in_review">In Review</option>
                            <option value="confirmed_violation">Confirmed Violation</option>
                            <option value="false_positive">False Positive</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="alert-assign" className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Assign Analyst
                          </label>
                          <input
                            id="alert-assign"
                            type="text"
                            value={assignedUser}
                            onChange={(e) => setAssignedUser(e.target.value)}
                            placeholder="e.g. sec-analyst-1"
                            className="w-full p-2 rounded-md text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="alert-note" className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Triage Notes
                        </label>
                        <textarea
                          id="alert-note"
                          rows={3}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Enter investigation observations, containment actions taken…"
                          className="w-full p-2 rounded-md text-xs"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAlertId(null)}
                          className="btn btn-ghost text-xs"
                          aria-label="Cancel and close"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingNote}
                          className="btn btn-primary text-xs"
                          aria-label="Submit investigation note"
                        >
                          <Send className="w-3.5 h-3.5" aria-hidden="true" />
                          {submittingNote ? 'Saving…' : 'Submit Note'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
