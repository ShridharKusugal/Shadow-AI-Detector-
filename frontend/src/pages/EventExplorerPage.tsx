import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Search, ChevronLeft, ChevronRight,
  Eye, X, Cpu, Info, Download, Copy, Check
} from 'lucide-react';
import { api } from '../services/api';
import { pageVariants, drawerVariants, modalOverlayVariants, listItemVariants } from '../lib/animations';

/* ── Approval status badge helper ─────────────────────────── */
const ApprovalBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls =
    status === 'approved'        ? 'badge-approved'  :
    status === 'unapproved'      ? 'badge-unapproved':
    status === 'requires_review' ? 'badge-review'    :
    status === 'non_ai'          ? 'badge-neutral'   : 'badge-info';
  return <span className={`badge ${cls}`}>{status.replace(/_/g, ' ')}</span>;
};

/* ── Risk score badge ─────────────────────────────────────── */
const RiskBadge: React.FC<{ score: number }> = ({ score }) => {
  const cls =
    score >= 85 ? 'badge-unapproved' :
    score >= 60 ? 'badge-review'     :
    score >= 30 ? 'badge-review'     : 'badge-approved';
  const color =
    score >= 85 ? '#C93636' :
    score >= 60 ? '#C2410C' :
    score >= 30 ? '#B77900' : '#16845B';
  return (
    <span className={`badge ${cls}`} style={{ color }}>
      {score}/100
    </span>
  );
};

export const EventExplorerPage: React.FC = () => {
  const [events, setEvents]           = useState<any[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [approvalStatus, setApprovalStatus] = useState('all');
  const [severity, setSeverity]       = useState('all');
  const [sortBy, setSortBy]           = useState('timestamp');
  const [sortDir, setSortDir]         = useState('desc');
  const [page, setPage]               = useState(1);
  const [limit, setLimit]             = useState(20);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [detailData, setDetailData]   = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedUuid, setCopiedUuid]   = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents({
        search,
        approval_status: approvalStatus,
        severity,
        sort_by: sortBy,
        sort_dir: sortDir,
        limit,
        offset: (page - 1) * limit
      });
      setEvents(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [approvalStatus, severity, sortBy, sortDir, page, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleViewDetail = async (id: number) => {
    setSelectedEventId(id);
    try {
      setDetailLoading(true);
      const res = await api.getEventDetail(id);
      setDetailData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCopyUuid = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uuid);
    setCopiedUuid(uuid);
    setTimeout(() => setCopiedUuid(null), 2000);
  };

  const handleExportCSV = () => {
    if (!events.length) return;
    const headers = ['UUID', 'Timestamp', 'Device_ID', 'Domain', 'Provider', 'Status', 'Bytes_Out', 'Risk_Score'];
    const rows = events.map(e => [
      e.uuid, e.timestamp, e.device_id, e.normalized_domain,
      e.provider_name || 'N/A', e.approval_status, e.bytes_out, e.risk_score
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `shadow_ai_events_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  const applyPreset = (status: string, sev: string) => {
    setApprovalStatus(status);
    setSeverity(sev);
    setPage(1);
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const PRESETS = [
    { label: 'All Activity',          status: 'all',        sev: 'all',      active: approvalStatus === 'all' && severity === 'all' },
    { label: 'Shadow AI (Unapproved)',status: 'unapproved', sev: 'all',      active: approvalStatus === 'unapproved' },
    { label: 'Critical Only',         status: 'all',        sev: 'critical', active: severity === 'critical' },
    { label: 'Approved Services',     status: 'approved',   sev: 'all',      active: approvalStatus === 'approved' },
  ];

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">

      {/* ── Page Header ────────────────────────────────────── */}
      <div className="page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3 flex-wrap">
            Event Explorer
            <span className="badge badge-info text-[10px]">{total.toLocaleString()} events</span>
          </h1>
          <p className="page-subtitle">
            Search, filter, and inspect granular egress flows across all corporate devices and AI providers.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={events.length === 0}
          className="btn btn-ghost text-xs shrink-0"
          aria-label="Export current filtered events as CSV"
        >
          {exportSuccess ? (
            <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} aria-hidden="true" />
          ) : (
            <Download className="w-4 h-4" style={{ color: 'var(--cyan-accent)' }} aria-hidden="true" />
          )}
          {exportSuccess ? 'Exported!' : 'Export CSV'}
        </button>
      </div>

      {/* ── Quick Filter Chips ─────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Quick filter presets">
        <span className="text-xs font-mono font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Scope:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.status, p.sev)}
            className={`filter-chip ${p.active ? 'active' : ''}`}
            aria-pressed={p.active}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Search & Filters ───────────────────────────────── */}
      <form
        onSubmit={handleSearchSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        role="search"
        aria-label="Event search and filters"
      >
        <div className="lg:col-span-2 relative">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search domain, device ID, or UUID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm font-mono"
            aria-label="Search events"
          />
        </div>

        <select
          value={approvalStatus}
          onChange={(e) => { setApprovalStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm"
          aria-label="Filter by approval status"
        >
          <option value="all">All Approval States</option>
          <option value="unapproved">Unapproved (Shadow AI)</option>
          <option value="requires_review">Requires Review</option>
          <option value="approved">Approved</option>
          <option value="non_ai">Non-AI Infrastructure</option>
        </select>

        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-sm"
          aria-label="Filter by severity"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={`${sortBy}_${sortDir}`}
          onChange={(e) => {
            const [sb, sd] = e.target.value.split('_');
            setSortBy(sb); setSortDir(sd); setPage(1);
          }}
          className="px-3 py-2 rounded-lg text-sm"
          aria-label="Sort events"
        >
          <option value="timestamp_desc">Newest First</option>
          <option value="timestamp_asc">Oldest First</option>
          <option value="risk_score_desc">Highest Risk</option>
          <option value="bytes_out_desc">Highest Volume</option>
        </select>
      </form>

      {/* ── Events Table ───────────────────────────────────── */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center justify-between text-sm font-mono">
          <span style={{ color: 'var(--text-secondary)' }}>
            Found <strong style={{ color: 'var(--text-primary)' }}>{total.toLocaleString()}</strong> events
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
        </div>

        <div className="table-container" role="region" aria-label="Events table" aria-live="polite">
          <table aria-label="Network events">
            <thead>
              <tr>
                <th scope="col">Event UUID</th>
                <th scope="col">Timestamp</th>
                <th scope="col">Device</th>
                <th scope="col">Destination Domain</th>
                <th scope="col">AI Provider</th>
                <th scope="col">Approval Status</th>
                <th scope="col">Outbound Vol.</th>
                <th scope="col">Risk Score</th>
                <th scope="col" className="text-right">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="spinner w-7 h-7 mx-auto mb-3" role="status" aria-label="Loading events" />
                    <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                      Querying events…
                    </span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="empty-state py-0" style={{ color: 'var(--text-muted)' }}>
                      <p className="text-sm font-mono">No matching events found. Adjust filters or import logs.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const domainText = evt.destination_domain || evt.normalized_domain || 'Unknown';
                  return (
                    <tr
                      key={evt.id}
                      onClick={() => handleViewDetail(evt.id)}
                      className="cursor-pointer group"
                      role="row"
                      aria-label={`Event ${evt.uuid}`}
                    >
                      {/* UUID */}
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate max-w-[120px] font-mono text-xs"
                            style={{ color: 'var(--cyan-text-override)' }}
                            title={evt.uuid}
                          >
                            {evt.uuid}
                          </span>
                          <button
                            onClick={(e) => handleCopyUuid(evt.uuid, e)}
                            title="Copy UUID"
                            aria-label="Copy UUID to clipboard"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 transition-opacity"
                          >
                            {copiedUuid === evt.uuid ? (
                              <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                            ) : (
                              <Copy className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                            )}
                          </button>
                        </div>
                      </td>
                      {/* Timestamp */}
                      <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : '—'}
                      </td>
                      {/* Device */}
                      <td className="font-mono font-semibold text-xs whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                        {evt.device_id}
                      </td>
                      {/* Domain */}
                      <td>
                        <span
                          className="inline-block font-mono text-xs px-2 py-0.5 rounded max-w-[180px] truncate"
                          style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                          title={domainText}
                        >
                          {domainText}
                        </span>
                      </td>
                      {/* Provider */}
                      <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {evt.provider_name || '—'}
                      </td>
                      {/* Approval status */}
                      <td>
                        <ApprovalBadge status={evt.approval_status} />
                      </td>
                      {/* Outbound */}
                      <td className="text-xs font-mono font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                        {(evt.bytes_out / 1024).toFixed(1)} KB
                      </td>
                      {/* Risk */}
                      <td>
                        <RiskBadge score={evt.risk_score} />
                      </td>
                      {/* Inspect */}
                      <td className="text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewDetail(evt.id); }}
                          className="p-1.5 rounded-md border transition-all"
                          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#06B6D4';
                            (e.currentTarget as HTMLButtonElement).style.color = '#0284C7';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#DCE5F0';
                            (e.currentTarget as HTMLButtonElement).style.color = '#5B6B82';
                          }}
                          title="Inspect event details"
                          aria-label={`Inspect event ${evt.uuid}`}
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t gap-3" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-ghost text-xs"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Previous
          </button>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <label htmlFor="rows-per-page" className="text-xs font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
                Rows:
              </label>
              <select
                id="rows-per-page"
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 rounded text-xs font-mono"
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="page-select" className="text-xs font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
                Page:
              </label>
              <select
                id="page-select"
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="px-2 py-1 rounded text-xs font-mono"
                aria-label="Select page"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>{p} of {totalPages}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-ghost text-xs"
            aria-label="Next page"
          >
            Next
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Event Detail Drawer ────────────────────────────── */}
      <AnimatePresence>
        {selectedEventId && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              variants={modalOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(11,31,58,0.3)' }}
              onClick={() => setSelectedEventId(null)}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="drawer w-full max-w-xl p-7 space-y-5 z-50"
              role="dialog"
              aria-modal="true"
              aria-label="Event inspection detail"
            >
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--cyan-text-override)' }}>
                    Event Inspection
                  </span>
                  <h2 className="text-base font-bold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {detailData?.uuid || 'Loading…'}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedEventId(null)}
                  className="btn btn-ghost p-2"
                  aria-label="Close inspection panel"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {detailLoading ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <div className="spinner w-8 h-8" role="status" aria-label="Loading event details" />
                  <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Loading event details…</span>
                </div>
              ) : detailData && (
                <div className="space-y-4 text-sm">
                  {/* Network flow metadata */}
                  <div className="p-4 rounded-lg space-y-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
                    <h3 className="section-title text-[11px]">Network Flow Metadata</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      {[
                        ['Destination', detailData.destination_domain],
                        ['Device ID',   detailData.device_id],
                        ['Outbound',    `${detailData.bytes_out?.toLocaleString()} B`],
                        ['Inbound',     `${detailData.bytes_in?.toLocaleString()} B`],
                        ['Sessions',    detailData.connection_count],
                        ['Source Type', detailData.source_type],
                      ].map(([k, v]) => (
                        <div key={k as string}>
                          <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                          <div className="font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk assessment */}
                  {detailData.assessment && (
                    <div className="p-4 rounded-lg space-y-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
                      <div className="flex items-center justify-between">
                        <h3 className="section-title text-[11px]">Risk Assessment</h3>
                        <span className="badge badge-unapproved" style={{ fontSize: '10px' }}>
                          {detailData.assessment.risk_score}/100 — {detailData.assessment.severity?.toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                          Detection Reasons
                        </span>
                        <ul className="space-y-1.5 mt-1.5 text-xs" style={{ color: 'var(--text-primary)' }}>
                          {detailData.assessment.detection_reasons?.map((r: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-cyan-500 mt-0.5 shrink-0">•</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* ML signal */}
                      <div
                        className="flex items-center justify-between p-2.5 rounded-md text-xs"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                      >
                        <div className="flex items-center gap-1.5" style={{ color: 'var(--cyan-text-override)' }}>
                          <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="font-semibold">ML Review Signal</span>
                        </div>
                        <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                          {detailData.assessment.ml_review_predicted ? 'FLAGGED' : 'STANDARD'}{' '}
                          ({(detailData.assessment.ml_confidence * 100).toFixed(1)}%)
                        </span>
                      </div>

                      {/* Scope note */}
                      {detailData.assessment.missing_evidence?.length > 0 && (
                        <div
                          className="p-3 rounded-md text-xs space-y-1"
                          style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)' }}
                        >
                          <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-warning)' }}>
                            <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            Capability Boundary
                          </div>
                          {detailData.assessment.missing_evidence.map((m: string, idx: number) => (
                            <p key={idx} style={{ color: 'var(--text-primary)' }}>{m}</p>
                          ))}
                        </div>
                      )}

                      {/* Recommendations */}
                      {detailData.assessment.recommendations?.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                            Analyst Actions
                          </span>
                          <ul className="space-y-1.5 mt-1.5 text-xs" style={{ color: 'var(--color-success)' }}>
                            {detailData.assessment.recommendations.map((rec: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="mt-0.5 shrink-0">✓</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setSelectedEventId(null)}
                      className="btn btn-ghost text-xs"
                      aria-label="Close inspection panel"
                    >
                      Close Inspection
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
