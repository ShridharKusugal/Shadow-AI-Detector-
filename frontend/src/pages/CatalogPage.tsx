import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cardVariants, modalOverlayVariants, modalContentVariants } from '../lib/animations';

/* ── Status badge ─────────────────────────────────────────── */
const ApprovalBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls =
    status === 'approved'        ? 'badge-approved'  :
    status === 'unapproved'      ? 'badge-unapproved':
    status === 'requires_review' ? 'badge-review'    :
    status === 'non_ai'          ? 'badge-neutral'   : 'badge-info';
  return <span className={`badge ${cls}`}>{status.replace(/_/g, ' ')}</span>;
};

/* ── Risk badge ───────────────────────────────────────────── */
const RiskBadge: React.FC<{ score: number; severity: string }> = ({ score, severity }) => {
  const cls =
    severity === 'critical' ? 'badge-unapproved' :
    severity === 'high'     ? 'badge-review'     :
    severity === 'medium'   ? 'badge-review'     : 'badge-approved';
  const color =
    severity === 'critical' ? '#C93636' :
    severity === 'high'     ? '#C2410C' :
    severity === 'medium'   ? '#B77900' : '#16845B';
  return (
    <span className={`badge ${cls}`} style={{ color }}>
      {score}/100 {severity}
    </span>
  );
};

export const CatalogPage: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProv, setNewProv] = useState({
    name: '', slug: '', category: 'Generative AI',
    description: '', risk_default: 'medium',
    domain_pattern: '', match_type: 'exact',
    approval_status: 'requires_review', risk_weight: 50
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { hasRole } = useAuth();

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory();
      setInventory(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      setSubmitting(true);
      await api.addProvider({
        name: newProv.name,
        slug: newProv.slug || newProv.name.toLowerCase().replace(/\s+/g, '-'),
        category: newProv.category,
        description: newProv.description,
        risk_default: newProv.risk_default,
        approval_status: newProv.approval_status,
        risk_weight: Number(newProv.risk_weight),
        domains: [{ pattern: newProv.domain_pattern, match_type: newProv.match_type, source: 'Analyst Submission' }]
      });
      setShowAddModal(false);
      fetchInventory();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to add provider.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = inventory.filter((item) => {
    const matchSearch =
      item.provider_name.toLowerCase().includes(search.toLowerCase()) ||
      item.endpoint.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.approval_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const STATUSES = ['unapproved', 'approved', 'requires_review', 'unknown', 'non_ai'];

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">

      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3 flex-wrap">
            AI Provider Catalog
            <span className="badge badge-info text-[10px]">{inventory.length} endpoints observed</span>
          </h1>
          <p className="page-subtitle">
            Dynamic inventory of observed endpoints, risk classifications, and policy status from backend telemetry.
          </p>
        </div>
        {hasRole(['admin']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-accent text-xs shrink-0"
            aria-label="Add a new catalog provider rule"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Catalog Rule
          </button>
        )}
      </div>

      {/* ── Status Filter Chips ──────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Filter by approval status">
        <span className="text-xs font-mono font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Status:</span>
        <button
          onClick={() => setStatusFilter('all')}
          className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
          aria-pressed={statusFilter === 'all'}
        >
          All ({inventory.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
            aria-pressed={statusFilter === s}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div className="relative max-w-lg">
        <Search
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search provider name or endpoint (e.g. openai, api.anthropic.com)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm font-mono"
          aria-label="Search providers"
        />
      </div>

      {/* ── Inventory Table ──────────────────────────────────── */}
      <motion.div
        variants={cardVariants}
        custom={0}
        initial="hidden"
        animate="visible"
        className="glass-panel p-5"
      >
        <div className="table-container" role="region" aria-label="AI provider inventory">
          <table aria-label="AI provider catalog">
            <thead>
              <tr>
                <th scope="col">Provider Name</th>
                <th scope="col">Endpoint (Domain)</th>
                <th scope="col">Approval Status</th>
                <th scope="col" className="text-right">Observed Events</th>
                <th scope="col" className="text-right">Est. Usage</th>
                <th scope="col">Risk Classification</th>
                <th scope="col">First Seen</th>
                <th scope="col">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="spinner w-7 h-7 mx-auto mb-3" role="status" aria-label="Loading inventory" />
                    <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Loading inventory…</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>No matching endpoints found.</span>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{item.provider_name}</td>
                    <td>
                      <span
                        className="font-mono text-xs"
                        style={{ color: 'var(--cyan-text-override)', wordBreak: 'break-all' }}
                        title={item.endpoint}
                      >
                        {item.endpoint}
                      </span>
                    </td>
                    <td><ApprovalBadge status={item.approval_status} /></td>
                    <td className="text-right font-bold font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                      {item.event_count.toLocaleString()}
                    </td>
                    <td className="text-right font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {(item.estimated_usage_bytes / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td>
                      <RiskBadge score={item.max_risk_score} severity={item.severity} />
                    </td>
                    <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {item.first_seen ? new Date(item.first_seen).toLocaleDateString() : '—'}
                    </td>
                    <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {item.last_seen ? new Date(item.last_seen).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Add Provider Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              key="overlay"
              variants={modalOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="modal-overlay"
              onClick={() => setShowAddModal(false)}
              aria-hidden="true"
            />
            <motion.div
              key="modal"
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="modal-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 space-y-4"
              role="dialog"
              aria-modal="true"
              aria-label="Add new AI provider rule"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add AI Provider Rule</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost p-1.5"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {submitError && (
                <div className="toast toast-danger text-xs" role="alert">
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-3.5 text-sm">
                <div>
                  <label htmlFor="prov-name" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Provider Name *
                  </label>
                  <input
                    id="prov-name"
                    type="text"
                    required
                    placeholder="e.g. Cohere"
                    value={newProv.name}
                    onChange={(e) => setNewProv({ ...newProv, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="prov-category" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Category *
                  </label>
                  <input
                    id="prov-category"
                    type="text"
                    required
                    value={newProv.category}
                    onChange={(e) => setNewProv({ ...newProv, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="prov-domain" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Domain Pattern *
                  </label>
                  <input
                    id="prov-domain"
                    type="text"
                    required
                    placeholder="e.g. api.cohere.ai"
                    value={newProv.domain_pattern}
                    onChange={(e) => setNewProv({ ...newProv, domain_pattern: e.target.value })}
                    className="w-full p-2.5 rounded-lg text-sm font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="prov-status" className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Initial Policy Status
                  </label>
                  <select
                    id="prov-status"
                    value={newProv.approval_status}
                    onChange={(e) => setNewProv({ ...newProv, approval_status: e.target.value })}
                    className="w-full p-2.5 rounded-lg text-sm"
                  >
                    <option value="requires_review">Requires Review</option>
                    <option value="unapproved">Unapproved (Shadow AI)</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary text-xs"
                    aria-label="Save new provider rule"
                  >
                    {submitting ? 'Saving…' : 'Save Provider'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
