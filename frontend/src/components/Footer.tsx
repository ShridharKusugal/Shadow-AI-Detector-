import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, BookOpen, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer 
      className="w-full mt-auto text-sm border-t relative z-10"
      style={{ 
        background: 'var(--navy-deep)', 
        color: 'var(--text-on-dark)',
        borderColor: 'var(--navy-primary)' 
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: PLATFORM */}
          <div>
            <h3 className="font-bold mb-4 tracking-wider text-xs" style={{ color: 'var(--text-muted)' }}>PLATFORM</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="hover:text-cyan-light transition-colors">Security Dashboard</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyan-light transition-colors">Threat Radar</Link></li>
              <li><Link to="/alerts" className="hover:text-cyan-light transition-colors">Alert Center</Link></li>
              <li><Link to="/model" className="hover:text-cyan-light transition-colors">Model Evaluation</Link></li>
            </ul>
          </div>

          {/* Column 2: DATA & COMPLIANCE */}
          <div>
            <h3 className="font-bold mb-4 tracking-wider text-xs" style={{ color: 'var(--text-muted)' }}>DATA & COMPLIANCE</h3>
            <ul className="space-y-2">
              <li><Link to="/events" className="hover:text-cyan-light transition-colors">Event Explorer</Link></li>
              <li><Link to="/upload" className="hover:text-cyan-light transition-colors">Telemetry Ingestion</Link></li>
              <li><Link to="/policies" className="hover:text-cyan-light transition-colors">Governance Policies</Link></li>
              <li><Link to="/catalog" className="hover:text-cyan-light transition-colors">AI Provider Catalog</Link></li>
            </ul>
          </div>

          {/* Column 3: RESOURCES */}
          <div>
            <h3 className="font-bold mb-4 tracking-wider text-xs" style={{ color: 'var(--text-muted)' }}>RESOURCES</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-cyan-light transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-cyan-light transition-colors">API Reference</a></li>
              <li><Link to="/reports" className="hover:text-cyan-light transition-colors">Audit Logs & Reports</Link></li>
              <li><a href="#" className="hover:text-cyan-light transition-colors">Security Whitepapers</a></li>
            </ul>
          </div>

          {/* Column 4: CONTACT & SOCIALS */}
          <div>
            <h3 className="font-bold mb-4 tracking-wider text-xs" style={{ color: 'var(--text-muted)' }}>CONNECT</h3>
            <div className="text-xs space-y-1 mb-4 opacity-80 leading-relaxed">
              <p>Shadow AI Cybersecurity</p>
              <p>Enterprise Defense Team</p>
              <p>support@shadowaidetector.local</p>
            </div>

            <div className="flex space-x-4">
              <a href="#" className="hover:text-cyan-light transition-colors" title="X (Twitter)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-cyan-light transition-colors" title="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div 
        className="px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs"
        style={{ 
          background: 'rgba(0, 0, 0, 0.25)',
          borderTop: '1px solid var(--navy-primary)' 
        }}
      >
        <div className="flex items-center flex-wrap gap-6 mb-4 md:mb-0">
          <a href="#" className="flex items-center space-x-2 hover:text-cyan-light transition-colors font-semibold">
            <Shield size={14} style={{ color: 'var(--color-warning)' }} />
            <span>Request Demo</span>
          </a>
          <a href="#" className="flex items-center space-x-2 hover:text-cyan-light transition-colors font-semibold">
            <BookOpen size={14} style={{ color: 'var(--color-warning)' }} />
            <span>Developer API</span>
          </a>
          <a href="#" className="flex items-center space-x-2 hover:text-cyan-light transition-colors font-semibold">
            <HelpCircle size={14} style={{ color: 'var(--color-warning)' }} />
            <span>Support Center</span>
          </a>
        </div>

        <div className="text-center md:text-right">
          <p className="opacity-80">© 2024-2026 Shadow AI Detector</p>
          <p className="font-bold mt-1 text-sm">Developed BY Shridhar..!</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
