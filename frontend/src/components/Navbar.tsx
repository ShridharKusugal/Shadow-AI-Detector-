import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PendingAnalystsModal } from './PendingAnalystsModal';
import { ThemeSelector } from './ThemeSelector';
import { ShieldAlert, LogOut, User as UserIcon, UserCheck, Award, Presentation } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showApprovals, setShowApprovals] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'admin':   return 'badge-review';
      case 'analyst': return 'badge-info';
      default:        return 'badge-neutral';
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full navbar px-5 py-0"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between gap-4 py-3">

        {/* ── Brand ── */}
        <Link to="/" className="flex items-center gap-3 group select-none" aria-label="Shadow AI Detector — Home">
          <div
            className="relative p-2 rounded-lg border-2 transition-all shadow-sm group-hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, var(--navy-deep) 0%, var(--navy-primary) 100%)', borderColor: 'var(--cyan-accent)' }}
          >
            <ShieldAlert className="w-5 h-5" style={{ color: 'var(--badge-cyan-border)' }} aria-hidden="true" />
            {/* Live indicator dot */}
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white shadow-sm"
              style={{ boxShadow: '0 0 0 2px var(--bg-card)' }}
              aria-label="System online"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Shadow<span style={{ color: 'var(--cyan-accent)' }}>AI</span>
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-mono font-bold tracking-widest"
                style={{ background: 'var(--navy-deep)', color: 'var(--badge-cyan-border)', border: '1px solid var(--navy-primary)' }}
              >
                DETECTOR
              </span>
            </div>
            <p className="text-[11px] hidden md:block" style={{ color: 'var(--text-secondary)' }}>
              AI Governance & Shadow Telemetry Detection Platform
            </p>
          </div>
        </Link>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2">

          {user ? (
            <div className="flex items-center gap-2">

              {/* Admin approvals button */}
              {user.role === 'admin' && (
                <button
                  onClick={() => setShowApprovals(true)}
                  className="btn btn-ghost text-xs gap-1.5"
                  aria-label="Review pending analyst approvals"
                >
                  <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--cyan-accent)' }} aria-hidden="true" />
                  <span className="hidden sm:inline">Approve Analysts</span>
                </button>
              )}

              {/* Presentation Deck Link */}
              <a
                href="/presentation.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost text-xs gap-1.5 font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all shadow-sm"
                title="Open Interactive Pitch & Architecture Presentation Deck"
                aria-label="Open Interactive Pitch Presentation Deck"
              >
                <Presentation className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span className="hidden sm:inline">Presentation PPT</span>
              </a>

              {/* Theme Selector */}
              <ThemeSelector />

              {/* User chip */}
              <div
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border"
                style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)' }}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--navy-deep), var(--navy-primary))', border: '1.5px solid var(--cyan-accent)' }}
                >
                  <UserIcon className="w-3.5 h-3.5" style={{ color: 'var(--badge-cyan-border)' }} aria-hidden="true" />
                </div>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{user.username}</span>
                  <span className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {user.organization || 'Security Ops'}
                  </span>
                </div>
                <span className={`badge ${getRoleBadgeClass(user.role)} ml-1`}>
                  {user.role}
                </span>
              </div>

              {/* Award badge */}
              <div
                className="hidden md:flex items-center px-2 py-1.5 rounded-lg border"
                style={{ background: 'var(--badge-cyan-bg)', borderColor: 'var(--badge-cyan-border)' }}
                title="Verified platform analyst"
              >
                <Award className="w-4 h-4" style={{ color: 'var(--cyan-accent)' }} aria-hidden="true" />
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="btn btn-ghost p-2"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-danger)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-danger-bg)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)';
                }}
                style={{ color: 'var(--text-secondary)' }}
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <a
                href="/presentation.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost text-xs gap-1.5 font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all shadow-sm"
                title="Open Interactive Pitch & Architecture Presentation Deck"
              >
                <Presentation className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>Presentation PPT</span>
              </a>
              <Link
                to="/login"
                className="btn btn-primary text-xs font-mono tracking-wide"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Admin modal */}
      {user?.role === 'admin' && (
        <PendingAnalystsModal
          isOpen={showApprovals}
          onClose={() => setShowApprovals(false)}
        />
      )}
    </header>
  );
};
