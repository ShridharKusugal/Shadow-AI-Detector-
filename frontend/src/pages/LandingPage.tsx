import React from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  Lock,
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  FileCode2,
  Terminal,
  Shield,
  Zap,
  Layers
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 cyber-grid relative overflow-hidden flex flex-col justify-between">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Simple Brand Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#15345B] text-white flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-slate-900 leading-none">
              SHADOW AI DETECTOR
            </div>
            <div className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-wider mt-0.5">
              Enterprise Defense Platform
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/login"
            className="btn btn-ghost text-xs"
          >
            Sign In
          </Link>
          <Link
            to="/dashboard"
            className="btn btn-primary text-xs"
          >
            Launch Console
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-14 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-mono font-semibold mb-6 shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>CYBERSECURITY DEFENSE PLATFORM • 2026 NATIONAL AI HACKATHON</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6"
          >
            AI-Powered Discovery &amp; Risk Monitoring for{' '}
            <span className="text-[#15345B] underline decoration-cyan-400 decoration-4 underline-offset-4">
              Shadow AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Detect, categorize, and govern unsanctioned generative AI services across enterprise networks.
            Combining transparent rules engines, versioned provider catalogs, explainable scoring, and machine learning telemetry models.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3.5"
          >
            <Link
              to="/dashboard"
              className="btn btn-primary px-6 py-3 text-sm shadow-md"
            >
              <span>Launch Security Console</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              to="/login"
              className="btn btn-ghost px-6 py-3 text-sm"
            >
              <span>Sign In / Demo Roles</span>
            </Link>
          </motion.div>
        </section>

        {/* Ethical Capability Disclosure Banner */}
        <section className="max-w-5xl mx-auto px-6 mb-12 relative z-10 w-full">
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-900 mb-1">
                  Security Engineering Capability Boundary &amp; Ethical Disclosure
                </h2>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  Standard HTTPS/TLS network metadata does <strong>NOT</strong> decrypt plain-text prompts, model inputs, or private conversation logs.
                  Shadow AI Detector monitors egress hostnames, session frequencies, and byte volume anomalies.
                  It flags organizational governance violations without intercepting private employee communications or fabricating sensitive-data leaks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="max-w-6xl mx-auto px-6 pb-16 relative z-10 w-full">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Enterprise Shadow AI Defense Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              End-to-end detection pipeline from network egress telemetry to persistent audit logging
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="card p-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Curated Provider Matching</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Versioned catalog indexing exact hostnames and subdomains across frontier LLMs, coding assistants, aggregators, and unvetted AI apps.
              </p>
            </div>

            <div className="card p-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Machine Learning Benchmark</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trained Random Forest baseline evaluating connection velocity, egress anomalies, and domain entropy with genuine precision &amp; recall metrics.
              </p>
            </div>

            <div className="card p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Transparent Risk Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every assessment outputs itemized scoring contributors, policy standings, missing evidence limits, and concrete analyst action recommendations.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
