import React, { useState, useEffect } from 'react';
import { Shield, Clock, Database, Activity } from 'lucide-react';

/**
 * HudStatusBar — Top telemetry strip.
 * Shows only honest, real information: live UTC clock and static system labels.
 * Fabricated packet rates, DEFCON levels, and "AI intercepts" have been removed.
 */
export const HudStatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace(' GMT', ' UTC'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="w-full px-4 py-1 text-[11px] font-mono select-none hud-status-bar"
      role="banner"
      aria-label="System status bar"
    >
      <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4 flex-wrap">

        {/* Left — Platform identity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 hud-active" aria-hidden="true" />
            <span className="font-bold tracking-wider" style={{ color: 'var(--badge-cyan-border)' }}>
              SHADOW AI DETECTOR
            </span>
            <span className="hud-muted ml-1 hidden sm:inline">v2.0</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-gentle-pulse" aria-hidden="true" />
            <span className="hud-muted">System:</span>
            <span className="hud-active font-semibold">OPERATIONAL</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5">
            <Database className="w-3 h-3 hud-muted" aria-hidden="true" />
            <span className="hud-muted">Persistence:</span>
            <span style={{ color: 'var(--cyan-text-override)' }} className="font-semibold">MySQL 8.0</span>
          </div>
        </div>

        {/* Right — Clock */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 hud-muted" aria-hidden="true" />
          <span className="hud-time font-semibold tracking-wider" aria-live="polite" aria-atomic="true">
            {currentTime || 'Synchronizing...'}
          </span>
        </div>

      </div>
    </div>
  );
};
