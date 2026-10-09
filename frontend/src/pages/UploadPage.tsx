import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, FileCheck, AlertCircle, CheckCircle2,
  Download, RefreshCw, AlertTriangle, FileText
} from 'lucide-react';
import { api } from '../services/api';
import { cardVariants } from '../lib/animations';

const REQUIRED_COLS = ['event_id', 'timestamp', 'device_id', 'destination_domain'];

/* ── Drop zone states ─────────────────────────────────────── */
type DropZoneState = 'idle' | 'hover' | 'drag' | 'selected';

export const UploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows]   = useState<any[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [uploading, setUploading]       = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [batches, setBatches]           = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [dzState, setDzState]           = useState<DropZoneState>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const res = await api.getBatches();
      setBatches(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const handleFileChange = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Only CSV files (.csv) are accepted.');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setUploadResult(null);
    setDzState('selected');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        setPreviewHeaders(headers);
        const rows = lines.slice(1, 6).map((line) => {
          const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => { rowObj[h] = cells[idx] || ''; });
          return rowObj;
        });
        setPreviewRows(rows);
      }
    };
    reader.readAsText(file.slice(0, 50000));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDzState('drag');
  };
  const handleDragLeave = () => setDzState(selectedFile ? 'selected' : 'idle');
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDzState('idle');
    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setErrorMsg(null);
      const res = await api.uploadCsv(selectedFile);
      setUploadResult(res);
      await fetchBatches();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadReportJson = (report: any, filename: string) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation_report_${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const missingColumns = REQUIRED_COLS.filter((c) => !previewHeaders.includes(c));

  /* Drop zone styles */
  const dzBorderColor =
    dzState === 'drag'     ? '#06B6D4' :
    dzState === 'hover'    ? '#0EA5E9' :
    dzState === 'selected' ? '#16845B' : '#DCE5F0';
  const dzBg =
    dzState === 'drag'     ? '#F0FBFF' :
    dzState === 'hover'    ? '#F4FBFF' :
    dzState === 'selected' ? '#F0FDF4' : '#FFFFFF';

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">

      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">CSV Telemetry Ingestion</h1>
        <p className="page-subtitle">
          Upload network proxy logs, firewall flows, and DNS telemetry with automated validation and risk scoring.
        </p>
      </div>

      {/* ── Error Banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="toast toast-danger"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-sm font-bold hover:opacity-60 transition-opacity"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload Zone + Result panel ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Upload zone — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={() => setDzState('drag')}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload CSV file. Click or drag and drop."
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            className="p-10 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-4 transition-all"
            style={{
              border: `2px dashed ${dzBorderColor}`,
              background: dzBg,
              transition: 'border-color 0.18s ease, background-color 0.18s ease'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              aria-label="CSV file input"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />

            <motion.div
              animate={{ scale: dzState === 'drag' ? 1.1 : 1 }}
              transition={{ duration: 0.18 }}
              className="p-4 rounded-xl"
              style={{
                background: dzState === 'selected' ? '#DCFCE7' : '#F0FBFF',
                border: `1px solid ${dzState === 'selected' ? '#86EFAC' : '#BAE6FD'}`
              }}
            >
              {dzState === 'selected' ? (
                <FileCheck className="w-8 h-8" style={{ color: 'var(--color-success)' }} aria-hidden="true" />
              ) : (
                <UploadCloud className="w-8 h-8" style={{ color: 'var(--cyan-accent)' }} aria-hidden="true" />
              )}
            </motion.div>

            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedFile ? selectedFile.name : 'Click to browse or drag & drop your CSV'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB — ready to validate`
                  : 'Maximum 50 MB • Comma-delimited (.csv) format'}
              </p>
            </div>
          </div>

          {/* Schema validation & preview */}
          <AnimatePresence>
            {previewHeaders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl glass-panel space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="section-title text-[11px]">Schema Preflight</span>
                  <span className={`badge ${missingColumns.length === 0 ? 'badge-approved' : 'badge-unapproved'}`}>
                    {missingColumns.length === 0 ? 'Schema Valid' : `Missing ${missingColumns.length} Columns`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REQUIRED_COLS.map((col) => {
                    const exists = previewHeaders.includes(col);
                    return (
                      <div
                        key={col}
                        className="p-2 rounded-md flex items-center gap-1.5 text-xs font-mono"
                        style={{
                          background: exists ? '#DCFCE7' : '#FEE2E2',
                          border: `1px solid ${exists ? '#86EFAC' : '#FCA5A5'}`,
                          color: exists ? '#16845B' : '#C93636'
                        }}
                      >
                        {exists
                          ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          : <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        }
                        <span className="truncate">{col}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Preview table */}
                <div>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Preview — first {previewRows.length} rows:
                  </p>
                  <div className="table-container">
                    <table aria-label="CSV preview">
                      <thead>
                        <tr>
                          {previewHeaders.slice(0, 5).map((h) => (
                            <th key={h} scope="col">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((r, i) => (
                          <tr key={i}>
                            {previewHeaders.slice(0, 5).map((h) => (
                              <td key={h} className="max-w-[120px] truncate" title={r[h]}>{r[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleUpload}
                    disabled={uploading || missingColumns.length > 0}
                    className="btn btn-accent text-xs"
                    aria-label={uploading ? 'Processing upload' : 'Start ingestion'}
                  >
                    {uploading ? (
                      <>
                        <div className="spinner w-4 h-4" aria-hidden="true" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" aria-hidden="true" />
                        Start Ingestion
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel — result + guarantees */}
        <div className="space-y-4">

          {/* Ingestion result */}
          <AnimatePresence>
            {uploadResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl glass-panel space-y-3"
                style={{ border: '1px solid var(--color-success-border)' }}
              >
                <div className="flex items-center gap-2" style={{ color: 'var(--color-success)' }}>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span className="font-bold text-sm">Ingestion Completed</span>
                </div>

                <dl className="space-y-2 text-xs font-mono">
                  {[
                    ['Total Rows',     uploadResult.total_rows,     '#172B4D'],
                    ['Valid Ingested', uploadResult.valid_rows,     '#16845B'],
                    ['Invalid Rows',   uploadResult.invalid_rows,   '#C93636'],
                    ['Duplicates',     uploadResult.duplicate_rows, '#B77900'],
                  ].map(([label, val, color]) => (
                    <div
                      key={label as string}
                      className="flex justify-between py-1.5 px-0"
                      style={{ borderBottom: '1px solid var(--border-default)' }}
                    >
                      <dt style={{ color: 'var(--text-secondary)' }}>{label}</dt>
                      <dd className="font-bold" style={{ color: color as string }}>{val as number}</dd>
                    </div>
                  ))}
                </dl>

                {uploadResult.validation_report && (
                  <button
                    onClick={() => downloadReportJson(uploadResult.validation_report, uploadResult.batch_uuid)}
                    className="btn btn-ghost text-xs w-full"
                    aria-label="Download JSON validation report"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Download Validation Report
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Safety guarantees */}
          <div
            className="p-4 rounded-xl glass-panel space-y-3"
          >
            <h3 className="section-title text-[11px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" style={{ color: 'var(--cyan-accent)' }} aria-hidden="true" />
              Ingestion Safety Guarantees
            </h3>
            <ul className="space-y-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                <span><strong style={{ color: 'var(--text-primary)' }}>Zero Silent Discards</strong> — every invalid row is logged with line number and reason.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                <span><strong style={{ color: 'var(--text-primary)' }}>Duplicate Detection</strong> — identical hashes and event IDs are quarantined.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                <span><strong style={{ color: 'var(--text-primary)' }}>Formula Sanitization</strong> — exports neutralize injection attempts (=, +, -, @).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Ingestion History ─────────────────────────────────── */}
      <motion.div
        variants={cardVariants}
        custom={0}
        initial="hidden"
        animate="visible"
        className="glass-panel p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="section-title">Recent Ingestion Batches</h2>
          <button
            onClick={fetchBatches}
            disabled={loadingBatches}
            className="btn btn-ghost text-xs"
            aria-label="Reload ingestion batches"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingBatches ? 'animate-spin' : ''}`} aria-hidden="true" />
            Reload
          </button>
        </div>

        <div className="table-container" role="region" aria-label="Ingestion batch history">
          <table aria-label="Ingestion batches">
            <thead>
              <tr>
                <th scope="col">Batch UUID</th>
                <th scope="col">File Name</th>
                <th scope="col">Source</th>
                <th scope="col" className="text-right">Total Rows</th>
                <th scope="col" className="text-right">Valid</th>
                <th scope="col" className="text-right">Flagged</th>
                <th scope="col">Status</th>
                <th scope="col">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {loadingBatches ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="spinner w-6 h-6 mx-auto" role="status" aria-label="Loading batches" />
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>No ingestion batches yet.</span>
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id}>
                    <td className="font-mono text-xs" style={{ color: 'var(--cyan-text-override)' }}>{b.uuid}</td>
                    <td className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{b.file_name}</td>
                    <td className="uppercase text-[10px]" style={{ color: 'var(--text-muted)' }}>{b.source_type}</td>
                    <td className="text-right font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{b.row_count}</td>
                    <td className="text-right font-bold text-xs" style={{ color: 'var(--color-success)' }}>{b.valid_count}</td>
                    <td className="text-right font-bold text-xs" style={{ color: 'var(--color-danger)' }}>{b.invalid_count}</td>
                    <td>
                      <span className="badge badge-approved" style={{ fontSize: '10px' }}>{b.status}</span>
                    </td>
                    <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {b.created_at ? new Date(b.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
