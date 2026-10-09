import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';
import type { ThemeConfig } from '../context/ThemeContext';
import { Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/** Small swatch preview card for a single theme */
const ThemePreviewCard: React.FC<{
  t: ThemeConfig;
  isActive: boolean;
  onClick: () => void;
}> = ({ t, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1"
    style={{
      padding: '10px 12px',
      background: isActive ? 'var(--bg-hover)' : 'transparent',
      border: isActive ? '1.5px solid var(--navy-primary)' : '1.5px solid transparent',
      borderRadius: '10px',
    }}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Color swatches */}
        <div className="flex gap-1">
          <div
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: t.primaryColor, border: '1px solid rgba(0,0,0,0.1)' }}
            title="Primary"
          />
          <div
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: t.secondaryColor, border: '1px solid rgba(0,0,0,0.1)' }}
            title="Secondary"
          />
          <div
            className="w-3.5 h-3.5 rounded-full shadow-sm mt-0.5"
            style={{ backgroundColor: t.bgPreview, border: '1px solid rgba(0,0,0,0.08)' }}
            title="Background"
          />
        </div>
        {/* Name + tagline */}
        <div className="flex flex-col leading-tight">
          <span
            className="text-sm font-semibold"
            style={{ color: isActive ? 'var(--navy-primary)' : 'var(--text-primary)' }}
          >
            {t.name}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {t.tagline}
          </span>
        </div>
      </div>
      {isActive && (
        <Check
          size={16}
          style={{ color: t.primaryColor }}
        />
      )}
    </div>
  </button>
);

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative theme-selector-btn" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px',
          borderRadius: '8px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'border-color 200ms ease, color 200ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cyan-accent)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--cyan-accent)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
        }}
        title="Change Theme"
        aria-label="Change application theme"
      >
        <Palette size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              right: 0,
              marginTop: '8px',
              width: '300px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-elevated)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border-default)',
                background: 'var(--bg-subtle)',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Appearance
              </h4>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                Choose your interface theme
              </p>
            </div>

            {/* Theme list */}
            <div style={{ padding: '6px' }}>
              {THEMES.map((t) => (
                <ThemePreviewCard
                  key={t.id}
                  t={t}
                  isActive={theme === t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSelector;
