import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
  Activity, ShieldAlert, Cpu, AlertTriangle, Layers,
  RefreshCw, UploadCloud, Radio, Sparkles,
  Clock, BellRing, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { cardVariants, staggerContainer, chartVariants } from '../lib/animations';

/* ── Color constants ─────────────────────────────────────── */
const CHART_COLORS = {
  cyan:    '#06B6D4',
  navy:    '#15345B',
  violet:  '#6D28D9',
  success: '#16845B',
  warning: '#B77900',
  danger:  '#C93636',
  info:    '#2563EB',
};
const PIE_COLORS = [
  '#06B6D4', '#6D28D9', '#2563EB', '#16845B',
  '#B77900', '#C93636', '#0EA5E9', '#7C3AED'
];

/* ── Animated counter hook ────────────────────────────────── */
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    const start = performance.now();
    const step = (ts: number) => {
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    prevRef.current = target;
  }, [target, duration]);

  return value;
}

/* ── Metric card component ────────────────────────────────── */
interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  subtitle?: string;
  onClick?: () => void;
  linkLabel?: string;
  index: number;
}
const MetricCard: React.FC<MetricCardProps> = ({
  label, value, icon, accentColor, subtitle, onClick, linkLabel, index
}) => {
  const displayValue = useCountUp(value);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(15,35,91,0.10)' }}
      transition={{ type: 'tween' }}
      onClick={onClick}
      className={`hud-panel p-5 ${onClick ? 'cursor-pointer' : ''} group`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-[11px] font-mono font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </span>
        <div
          className="p-1.5 rounded-md transition-transform group-hover:scale-110"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
        >
          {icon}
        </div>
      </div>

      <div
        className="text-3xl font-extrabold tracking-tight"
        style={{ color: accentColor, fontVariantNumeric: 'tabular-nums' }}
      >
        {displayValue.toLocaleString()}
      </div>

      {subtitle && (
        <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}

      {linkLabel && (
        <div
          className="flex items-center justify-end mt-3 pt-3 text-xs font-semibold transition-transform group-hover:translate-x-0.5"
          style={{ color: accentColor, borderTop: '1px solid var(--border-default)' }}
        >
          {linkLabel} →
        </div>
      )}
    </motion.div>
  );
};

/* ── Custom Tooltip (light theme) ────────────────────────── */
const LightTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-lg text-xs"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        boxShadow: '0 4px 16px rgba(15,35,91,0.10)',
        color: 'var(--text-primary)'
      }}
    >
      {label && <div className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Empty state component ────────────────────────────────── */
const EmptyState: React.FC<{ onLoadDemo: () => void; loading: boolean }> = ({ onLoadDemo, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="p-10 rounded-xl glass-panel text-center space-y-5"
    style={{ border: '1px solid var(--border-default)' }}
  >
    <div className="empty-state-icon mx-auto">
      <Radio className="w-6 h-6" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
    </div>
    <div>
      <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No Telemetry Data Found</h3>
      <p className="text-sm mt-1.5 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Your MySQL database is empty. Load the reproducible 3,400-event synthetic benchmark dataset to explore the platform, or upload custom network logs.
      </p>
    </div>
    <div className="flex items-center justify-center gap-3 pt-2">
      <button
        onClick={onLoadDemo}
        disabled={loading}
        className="btn btn-primary"
        aria-label="Load synthetic demo dataset"
      >
        <Sparkles className="w-4 h-4" aria-hidden="true" />
        {loading ? 'Ingesting...' : 'Load Benchmark Dataset'}
      </button>
      <Link to="/upload" className="btn btn-ghost">
        <UploadCloud className="w-4 h-4" aria-hidden="true" />
        Upload CSV Logs
      </Link>
    </div>
  </motion.div>
);

/* ── Main Dashboard ───────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMetrics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.getDashboardMetrics();
      setData(res);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchMetrics(true), 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleLoadDemoData = async () => {
    try {
      setDemoLoading(true);
      setStatusMessage({ text: 'Ingesting synthetic benchmark dataset through detection engine…', type: 'info' });
      const res = await api.loadDemoData();
      setStatusMessage({
        text: `Successfully ingested ${res.result.valid_rows.toLocaleString()} events (${res.result.invalid_rows} flagged edge cases) into MySQL.`,
        type: 'success'
      });
      await fetchMetrics(true);
    } catch (err: any) {
      setStatusMessage({ text: `Ingestion error: ${err.message}`, type: 'error' });
    } finally {
      setDemoLoading(false);
    }
  };

  // Derived data
  const summary       = data?.summary || {};
  const riskDist      = data?.risk_distribution || {};
  const providerDist  = data?.provider_distribution || [];
  const rawTimeline   = data?.activity_timeline || [];
  const recentAlerts  = data?.recent_alerts || [];
  const modelStatus   = data?.model_status || {};
  const isEmpty       = !loading && (summary.total_events === 0 || !data);

  const riskBarData = [
    { name: 'Low',      count: riskDist.low      || 0, fill: CHART_COLORS.success },
    { name: 'Medium',   count: riskDist.medium    || 0, fill: CHART_COLORS.warning },
    { name: 'High',     count: riskDist.high      || 0, fill: '#C2410C' },
    { name: 'Critical', count: riskDist.critical  || 0, fill: CHART_COLORS.danger }
  ];

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="spinner w-10 h-10" role="status" aria-label="Loading dashboard metrics" />
        <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Loading dashboard metrics…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">

      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3 flex-wrap">
            Shadow AI Security Overview
            <span
              className="badge badge-info text-[10px]"
              style={{ verticalAlign: 'middle' }}
            >
              MySQL Backed
            </span>
          </h1>
          <p className="page-subtitle">
            Aggregated risk telemetry, AI provider observations, and incident metrics from ingested network logs.
          </p>
        </div>

        {/* Action toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn text-xs ${autoRefresh ? 'btn-accent' : 'btn-ghost'}`}
            title="Toggle auto-refresh every 10 seconds"
            aria-pressed={autoRefresh}
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {autoRefresh ? 'Auto: 10s' : 'Auto: Off'}
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => fetchMetrics()}
            disabled={loading}
            className="btn btn-ghost text-xs"
            aria-label="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--cyan-accent)' }} aria-hidden="true" />
            Refresh
          </button>

          {/* Load demo data */}
          <button
            onClick={handleLoadDemoData}
            disabled={demoLoading}
            className="btn btn-primary text-xs"
            aria-label="Load synthetic benchmark dataset"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            {demoLoading ? 'Ingesting…' : 'Load Benchmark'}
          </button>
        </div>
      </div>

      {/* ── Status Banner ─────────────────────────────────────── */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`toast toast-${statusMessage.type === 'error' ? 'danger' : statusMessage.type}`}
        >
          <Radio className="w-4 h-4 shrink-0 animate-gentle-pulse" aria-hidden="true" />
          <span className="flex-1">{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="ml-auto text-sm font-bold hover:opacity-60 transition-opacity"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {isEmpty && <EmptyState onLoadDemo={handleLoadDemoData} loading={demoLoading} />}

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      {!isEmpty && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <MetricCard
            index={0}
            label="Processed Events"
            value={summary.total_events || 0}
            icon={<Activity className="w-4 h-4" style={{ color: CHART_COLORS.cyan }} aria-hidden="true" />}
            accentColor={CHART_COLORS.navy}
            subtitle="Total outbound network requests analyzed"
            onClick={() => navigate('/events')}
            linkLabel="Explore events"
          />
          <MetricCard
            index={1}
            label="AI-Related Events"
            value={summary.known_ai_events || 0}
            icon={<Layers className="w-4 h-4" style={{ color: CHART_COLORS.violet }} aria-hidden="true" />}
            accentColor={CHART_COLORS.violet}
            subtitle="Matched to known AI provider endpoints"
            onClick={() => navigate('/catalog')}
            linkLabel="View catalog"
          />
          <MetricCard
            index={2}
            label="Unapproved Shadow AI"
            value={summary.unapproved_events || 0}
            icon={<ShieldAlert className="w-4 h-4" style={{ color: CHART_COLORS.danger }} aria-hidden="true" />}
            accentColor={CHART_COLORS.danger}
            subtitle="Connections to policy-forbidden AI tools"
            onClick={() => navigate('/events?approval_status=unapproved')}
            linkLabel="Inspect violations"
          />
          <MetricCard
            index={3}
            label="Open Alerts"
            value={summary.open_alerts || 0}
            icon={<AlertTriangle className="w-4 h-4" style={{ color: CHART_COLORS.warning }} aria-hidden="true" />}
            accentColor={CHART_COLORS.warning}
            subtitle={`${summary.critical_alerts || 0} critical — immediate triage required`}
            onClick={() => navigate('/alerts')}
            linkLabel="Triage alerts"
          />
        </motion.div>
      )}

      {/* ── Charts Row 1 ──────────────────────────────────────── */}
      {!isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Activity timeline — 2/3 width */}
          <motion.div
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 glass-panel p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Network Activity Timeline</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Aggregated event volume over time from ingested telemetry
                </p>
              </div>
              <span
                className="badge badge-info"
                style={{ fontSize: '10px' }}
              >
                From Database
              </span>
            </div>
            <div className="h-64">
              {rawTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rawTimeline} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="evtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={CHART_COLORS.cyan} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#C0CEDF"
                      fontSize={11}
                      tickLine={false}
                      tick={{ fill: '#8A9BB5' }}
                    />
                    <YAxis
                      stroke="#C0CEDF"
                      fontSize={11}
                      tickLine={false}
                      tick={{ fill: '#8A9BB5' }}
                    />
                    <Tooltip content={<LightTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="events"
                      name="Events"
                      stroke={CHART_COLORS.cyan}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#evtGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state h-full">
                  <p className="text-sm font-mono">No timeline data available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Provider distribution — 1/3 width */}
          <motion.div
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            className="glass-panel p-5"
          >
            <div className="mb-3">
              <h2 className="section-title">AI Provider Distribution</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Top observed AI destinations</p>
            </div>
            <div className="h-52 flex items-center justify-center">
              {providerDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={providerDist}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={2}
                      isAnimationActive
                    >
                      {providerDist.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<LightTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>No provider data</span>
              )}
            </div>
            {/* Legend */}
            <div className="space-y-1 mt-2">
              {providerDist.slice(0, 4).map((p: any, i: number) => (
                <div key={p.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  <span className="ml-auto font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {p.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Charts Row 2 ──────────────────────────────────────── */}
      {!isEmpty && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Risk severity bar chart */}
          <motion.div
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            className="glass-panel p-5"
          >
            <div className="mb-3">
              <h2 className="section-title">Risk Severity Breakdown</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Distribution of events by assessed risk level
              </p>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskBarData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#C0CEDF"
                    fontSize={11}
                    tickLine={false}
                    tick={{ fill: '#8A9BB5' }}
                  />
                  <YAxis
                    stroke="#C0CEDF"
                    fontSize={11}
                    tickLine={false}
                    tick={{ fill: '#8A9BB5' }}
                  />
                  <Tooltip content={<LightTooltip />} />
                  <Bar dataKey="count" name="Events" radius={[4, 4, 0, 0]}>
                    {riskBarData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* ML Engine status */}
          <motion.div
            variants={cardVariants}
            custom={2}
            initial="hidden"
            animate="visible"
            className="glass-panel p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="section-title">ML Inference Engine</h2>
                <Cpu className="w-4 h-4" style={{ color: 'var(--cyan-accent)' }} aria-hidden="true" />
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Random Forest scoring for review prioritization
              </p>
              <div className="space-y-2 text-xs">
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)' }}
                >
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Engine Status</span>
                  <span
                    className={`badge ${modelStatus.is_trained ? 'badge-approved' : 'badge-review'}`}
                  >
                    {modelStatus.is_trained ? 'Operational' : 'Not Trained'}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)' }}
                >
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Model Version</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {modelStatus.model_version || 'None'}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)' }}
                >
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Dataset Scope</span>
                  <span className="font-mono" style={{ color: 'var(--cyan-accent)' }}>
                    {modelStatus.dataset_type || 'Synthetic Benchmark'}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/model"
              className="btn btn-ghost text-xs mt-4 w-full justify-between"
              aria-label="View full ML evaluation metrics"
            >
              <span>View Evaluation Metrics</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </motion.div>

          {/* Recent alerts */}
          <motion.div
            variants={cardVariants}
            custom={3}
            initial="hidden"
            animate="visible"
            className="glass-panel p-5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="section-title flex items-center gap-2">
                <BellRing className="w-3.5 h-3.5" style={{ color: CHART_COLORS.danger }} aria-hidden="true" />
                Recent Incidents
              </h2>
              <Link
                to="/alerts"
                className="text-xs font-semibold hover:underline"
                style={{ color: 'var(--cyan-accent)' }}
                aria-label="View all alerts"
              >
                View all →
              </Link>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Latest high-risk security triggers requiring triage
            </p>

            <div className="space-y-2 flex-1 overflow-y-auto">
              {recentAlerts.length > 0 ? (
                recentAlerts.slice(0, 4).map((alt: any) => (
                  <Link
                    key={alt.id}
                    to="/alerts"
                    className="block p-3 rounded-lg hover:shadow-sm transition-all group text-xs"
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                    }}
                    aria-label={`Alert: ${alt.title}, severity: ${alt.severity}, risk score: ${alt.risk_score}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="font-semibold leading-tight"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {alt.title}
                      </span>
                      <span
                        className={`badge shrink-0 ${alt.severity === 'critical' ? 'badge-unapproved' : 'badge-review'}`}
                        style={{ fontSize: '10px' }}
                      >
                        {alt.severity}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between mt-1.5 font-mono"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span>Score: <strong style={{ color: 'var(--text-primary)' }}>{alt.risk_score}/100</strong></span>
                      <span>{alt.status}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-state py-6">
                  <p className="text-sm font-mono">No active alerts recorded</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
