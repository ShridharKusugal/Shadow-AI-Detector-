import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, ShieldCheck, History, RefreshCw,
  CheckCircle2, AlertTriangle, Layers, ArrowUpRight, Shield
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { hasRole } = useAuth();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [rData, aData] = await Promise.all([
        api.getReportsSummary(),
        api.getAuditLogs(30)
      ]);
      setReport(rData);
      setAuditLogs(aData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCsv = async () => {
    try {
      await api.downloadAlertsCsv();
    } catch (err) {
      console.error(err);
      alert('Failed to download CSV. Check console for details.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              Audit &amp; Compliance Center
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Executive Reports &amp; Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Formal compliance assessments, sanitized data exports, and persistent administrative audit logs.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-center">
          <button
            onClick={fetchReports}
            className="btn btn-ghost"
            aria-label="Reload reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          {hasRole(['admin', 'analyst']) && (
            <button
              onClick={handleDownloadCsv}
              className="btn btn-primary"
              aria-label="Export Sanitized Alerts to CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export Alerts (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Executive Security Summary Card */}
      {report && (
        <div className="card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Executive Shadow AI Posture Assessment
                </h2>
                <p className="text-xs text-slate-500">
                  Enterprise security posture overview aggregated across network egress events
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
              Generated: {new Date(report.generated_at).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <span className="text-xs font-medium text-slate-500">Total Monitored Flows</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {report.total_monitored_events?.toLocaleString() ?? 0}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Ingested telemetry events</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80">
              <span className="text-xs font-medium text-rose-700">Unsanctioned AI Violations</span>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
                {report.shadow_ai_policy_violations?.toLocaleString() ?? 0}
              </div>
              <span className="text-[11px] text-rose-500 mt-0.5 block">Zero-trust policy violations</span>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200/80">
              <span className="text-xs font-medium text-cyan-800">Incident Resolution Rate</span>
              <div className="text-2xl font-bold font-mono text-cyan-900 mt-1">
                {report.incident_resolution_breakdown?.closed ?? 0} Resolved
              </div>
              <span className="text-[11px] text-cyan-600 mt-0.5 block">
                {report.incident_resolution_breakdown?.open ?? 0} open incidents pending triage
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2 font-mono">
              Recommended Enterprise Governance Measures
            </span>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {report.recommended_enterprise_actions?.map((act: string, idx: number) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-cyan-600 font-bold shrink-0">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Compliance Audit Log Table Card */}
      <div className="card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center">
              <History className="w-4 h-4 text-cyan-700" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Immutable Audit Trail</h2>
              <p className="text-xs text-slate-500">Persisted in database for SOC 2 and ISO 27001 regulatory compliance</p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
            {auditLogs.length} Recent Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th scope="col">Audit ID</th>
                <th scope="col">Operator</th>
                <th scope="col">Action</th>
                <th scope="col">Resource Type</th>
                <th scope="col">Payload Details</th>
                <th scope="col">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 whitespace-nowrap">
                        LOG-{log.id}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-900 whitespace-nowrap">{log.user}</td>
                    <td className="text-slate-800 font-medium whitespace-nowrap">{log.action}</td>
                    <td>
                      <span className="badge badge-neutral text-[10px]">
                        {log.resource_type}
                      </span>
                    </td>
                    <td className="text-slate-600 max-w-xs truncate font-mono text-xs" title={JSON.stringify(log.details)}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '-')}
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No administrative audit records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
