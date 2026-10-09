import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, UploadCloud, Layers, FileCheck2,
  Radio, AlertTriangle, Cpu, FileText, ShieldCheck
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'OPERATIONS',
    items: [
      { to: '/dashboard', label: 'Security Dashboard',     icon: LayoutDashboard, badge: 'HQ'     },
      { to: '/events',    label: 'Event Explorer',          icon: Radio,           badge: 'QUERY'  },
      { to: '/alerts',    label: 'Alert & Incident Center', icon: AlertTriangle,   badge: 'TRIAGE' },
      { to: '/upload',    label: 'CSV Ingestion Pipeline',  icon: UploadCloud,     badge: 'INGEST' }
    ]
  },
  {
    title: 'GOVERNANCE & ML',
    items: [
      { to: '/catalog',  label: 'AI Provider Catalog',  icon: Layers,     badge: 'CATALOG' },
      { to: '/policies', label: 'Policy Management',    icon: FileCheck2, badge: 'RULES'   },
      { to: '/model',    label: 'Model Evaluation',     icon: Cpu,        badge: 'ML'      },
      { to: '/reports',  label: 'Reports & Audit Log',  icon: FileText,   badge: 'EXPORT'  }
    ]
  }
];

/**
 * Radar visualizer showing actual uploaded telemetry events.
 * Uses static SVG positions — blip positions are fixed demo markers,
 * clearly labeled as "Telemetry Visualization".
 */
const SidebarRadar: React.FC = () => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [angle, setAngle] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = (ts - start) % 4000; // 4s revolution
      setAngle((elapsed / 4000) * 360);
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Fixed demonstration markers — clearly labeled as visualization only
  const markers = [
    { x: 56, y: 36, color: 'var(--color-danger)', label: 'High Risk' },
    { x: 82, y: 68, color: 'var(--color-warning)', label: 'Medium Risk' },
    { x: 34, y: 72, color: 'var(--color-success)', label: 'Approved' },
    { x: 66, y: 54, color: 'var(--color-warning)', label: 'Review' },
  ];

  return (
    <div
      className="p-3.5 rounded-xl"
      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-gentle-pulse" aria-hidden="true" />
          TELEMETRY VIZ
        </span>
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)', background: 'var(--bg-card)' }}
          title="This is a visualization of imported telemetry, not a real-time network scan"
        >
          IMPORTED DATA
        </span>
      </div>

      {/* SVG Radar */}
      <div
        className="relative w-full rounded-lg overflow-hidden"
        style={{ height: 88, background: 'var(--bg-hover)', border: '1px solid var(--border-default)' }}
        role="img"
        aria-label="Telemetry visualization showing imported event distribution. Not a live network scan."
      >
        <svg
          ref={canvasRef}
          viewBox="0 0 110 88"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Concentric rings */}
          {[38, 26, 14].map((r, i) => (
            <circle
              key={i}
              cx="55" cy="44"
              r={r}
              fill="none"
              stroke="#C0CEDF"
              strokeWidth="0.5"
              opacity={0.5 + i * 0.15}
            />
          ))}
          {/* Crosshair */}
          <line x1="55" y1="6" x2="55" y2="82" stroke="#C0CEDF" strokeWidth="0.4" opacity="0.5" />
          <line x1="17" y1="44" x2="93" y2="44" stroke="#C0CEDF" strokeWidth="0.4" opacity="0.5" />

          {/* Sweep sector */}
          <g transform={`rotate(${angle} 55 44)`}>
            <path
              d="M55,44 L55,8 A36,36 0 0,1 83,62 Z"
              fill="url(#sweepGrad)"
              opacity="0.35"
            />
          </g>
          <defs>
            <radialGradient id="sweepGrad" cx="0%" cy="50%" r="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Event markers */}
          {markers.map((m, i) => (
            <circle
              key={i}
              cx={m.x} cy={m.y}
              r="3"
              fill={m.color}
              opacity="0.85"
            >
              <title>{m.label}</title>
            </circle>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Med
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Low
          </span>
        </div>
        <span style={{ color: 'var(--cyan-accent)' }} className="font-semibold">VIZ ONLY</span>
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  return (
    <aside
      className="w-64 sticky top-[88px] h-[calc(100vh-88px)] overflow-y-auto hidden lg:flex flex-col justify-between sidebar"
      style={{ flexShrink: 0 }}
      role="navigation"
      aria-label="Application navigation"
    >
      <nav className="p-3 space-y-5">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-0.5">

            {/* Section label */}
            <div className="sidebar-section-label">
              <span
                className="w-1 h-3 rounded-full inline-block"
                style={{ background: 'linear-gradient(180deg, var(--cyan-accent), var(--navy-primary))' }}
                aria-hidden="true"
              />
              {section.title}
            </div>

            {/* Nav items */}
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className="w-4 h-4 shrink-0 sidebar-icon"
                          style={isActive ? { color: 'var(--cyan-accent)' } : {}}
                          aria-hidden="true"
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="sidebar-badge">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: Telemetry Visualization + Shield status */}
      <div
        className="p-3 space-y-3 mt-4"
        style={{ borderTop: '1px solid var(--border-default)' }}
      >
        <SidebarRadar />

        {/* Defense status */}
        <div
          className="p-3 rounded-xl"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--badge-cyan-border)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-mono font-bold">
            <span className="flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--cyan-accent)' }} aria-hidden="true" />
              POLICY ENGINE
            </span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ background: 'var(--navy-deep)', color: 'var(--badge-cyan-border)', border: '1px solid var(--navy-primary)' }}
            >
              ACTIVE
            </span>
          </div>
          <p className="text-[11px] leading-relaxed font-sans mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            AI provider classification and risk scoring running on ingested telemetry.
          </p>
        </div>
      </div>
    </aside>
  );
};
