import React, { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Lock, User, Mail, AlertCircle, ArrowRight,
  Eye, EyeOff, Building, CheckCircle2, KeyRound, Clock,
  FileCheck2, ShieldCheck, Check
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'pending_success'>('login');
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Registration form state
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [organization, setOrganization] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);

  // Common state
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredUserSummary, setRegisteredUserSummary] = useState<{ username: string; email: string } | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Accessibility IDs
  const loginErrorId = useId();
  const regErrorId = useId();

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
      case 2:
        return { score: 25, label: 'Weak', barColor: 'bg-rose-500', textColor: 'text-rose-600' };
      case 3:
        return { score: 50, label: 'Fair', barColor: 'bg-amber-500', textColor: 'text-amber-600' };
      case 4:
        return { score: 75, label: 'Good', barColor: 'bg-cyan-500', textColor: 'text-cyan-700' };
      case 5:
        return { score: 100, label: 'Strong', barColor: 'bg-emerald-500', textColor: 'text-emerald-700' };
      default:
        return { score: 0, label: '', barColor: '', textColor: '' };
    }
  };

  const strength = getPasswordStrength(regPassword);
  const passwordsMatch = regPassword && confirmPassword && regPassword === confirmPassword;
  const passwordMismatch = confirmPassword && regPassword !== confirmPassword;

  // Quick fill demo user credentials
  const fillDemoAccount = (role: 'admin' | 'analyst' | 'auditor') => {
    setError(null);
    setMode('login');
    if (role === 'admin') {
      setLoginIdentifier('admin');
      setLoginPassword('AdminSecure2026!');
    } else if (role === 'analyst') {
      setLoginIdentifier('analyst');
      setLoginPassword('AnalystSecure2026!');
    } else if (role === 'auditor') {
      setLoginIdentifier('viewer');
      setLoginPassword('ViewerSecure2026!');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ username: loginIdentifier.trim(), password: loginPassword });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== confirmPassword) {
      setError('Confirmation password does not match.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters in length.');
      return;
    }

    if (!acceptPolicy) {
      setError('You must accept the enterprise cybersecurity acceptable-use policy.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        full_name: fullName.trim(),
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
        confirm_password: confirmPassword,
        organization: organization.trim() || undefined,
        invitation_code: invitationCode.trim() || undefined,
        accept_policy: acceptPolicy
      });

      setRegisteredUserSummary({
        username: res.username,
        email: res.email
      });
      setMode('pending_success');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check submitted data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 bg-[#F4F7FB] text-slate-800 cyber-grid">
      {/* Background Soft Ambient Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg z-10">
        <div className="card p-8 sm:p-9 shadow-xl relative">
          
          {/* Top Brand Accent Line */}
          <div className="absolute top-0 left-8 right-8 h-[3px] bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent rounded-t-lg opacity-70" />

          {/* Shield Emblem */}
          <div className="flex flex-col items-center text-center mb-6">
            <motion.div
              animate={{
                scale: [1, 1.03, 1]
              }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl bg-[#15345B] text-white flex items-center justify-center shadow-md mb-3"
            >
              <Shield className="w-7 h-7 text-cyan-400" />
            </motion.div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'login' && 'Security Console Authentication'}
              {mode === 'register' && 'Security Analyst Registration'}
              {mode === 'pending_success' && 'Registration Request Submitted'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {mode === 'login' && 'Access protected Shadow AI detection and policy logs.'}
              {mode === 'register' && 'Apply for analyst credentials to access enterprise telemetry.'}
              {mode === 'pending_success' && 'Zero-trust onboarding pending administrator verification.'}
            </p>
          </div>

          {/* Quick Fill Demo Role Buttons */}
          {mode === 'login' && (
            <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2 text-center">
                1-Click Demo Profiles:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('admin')}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-xs font-semibold text-slate-800 transition-all text-center shadow-2xs"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('analyst')}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-xs font-semibold text-slate-800 transition-all text-center shadow-2xs"
                >
                  Analyst
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('auditor')}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-xs font-semibold text-slate-800 transition-all text-center shadow-2xs"
                >
                  Auditor
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              id={mode === 'login' ? loginErrorId : regErrorId}
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="login-identifier" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-mono">
                    Username or Official Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="login-identifier"
                      type="text"
                      required
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. analyst or name@company.corp"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-cyan-500 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-mono">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-cyan-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Remember workstation session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full py-2.5 text-sm font-semibold shadow-md mt-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); }}
                    className="text-xs font-medium text-cyan-700 hover:text-cyan-900 transition-colors hover:underline"
                  >
                    Need an analyst account? Register here →
                  </button>
                </div>
              </motion.form>
            )}

            {mode === 'register' && (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-3.5 text-xs font-mono"
              >
                <div>
                  <label htmlFor="reg-fullname" className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">
                    Full Name <span className="text-cyan-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-email" className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      Official Email <span className="text-cyan-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="analyst@defense.corp"
                        className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-username" className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      Username <span className="text-cyan-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                      <input
                        id="reg-username"
                        type="text"
                        required
                        autoComplete="username"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="alex_analyst"
                        className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-password" className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      Password <span className="text-cyan-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full pl-10 pr-8 py-2 rounded-lg border border-slate-300 text-xs font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                        aria-label="Toggle password visibility"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-confirm" className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      Confirm Password <span className="text-cyan-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                      <input
                        id="reg-confirm"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full pl-10 pr-8 py-2 rounded-lg border text-xs font-sans ${
                          passwordMismatch
                            ? 'border-rose-400'
                            : passwordsMatch
                            ? 'border-emerald-500'
                            : 'border-slate-300'
                        }`}
                      />
                      {passwordsMatch && (
                        <Check className="w-4 h-4 text-emerald-600 absolute right-2.5 top-2.5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {regPassword.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Password Strength:</span>
                      <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.barColor}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-org" className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      Organization
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                      <input
                        id="reg-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. Cyber Operations"
                        className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-code" className="block text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      Invite Code <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                      <input
                        id="reg-code"
                        type="text"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value)}
                        placeholder="e.g. SEC-INV-2026"
                        className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-slate-300 text-xs font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={acceptPolicy}
                      onChange={(e) => setAcceptPolicy(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-cyan-600 mt-0.5 focus:ring-cyan-500"
                    />
                    <span className="leading-relaxed font-sans">
                      I agree to the cybersecurity policy, ethical boundary monitoring guidelines, and acceptable-use terms.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !acceptPolicy}
                  className="btn btn-primary w-full py-2.5 text-xs font-semibold shadow-md mt-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Registration Request</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="text-xs font-medium text-cyan-700 hover:text-cyan-900 transition-colors hover:underline"
                  >
                    ← Already have an account? Sign In
                  </button>
                </div>
              </motion.form>
            )}

            {mode === 'pending_success' && (
              <motion.div
                key="pending-success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-center py-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                  <Clock className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Analyst Access Pending Administrator Approval
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Registration submitted. Your account is queued for zero-trust administrator authorization.
                  </p>
                </div>

                {registeredUserSummary && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1 text-slate-600 font-mono">
                    <div>Username: <span className="text-cyan-800 font-bold">{registeredUserSummary.username}</span></div>
                    <div>Email: <span className="text-slate-800 font-bold">{registeredUserSummary.email}</span></div>
                    <div>Assigned Role: <span className="text-purple-700 font-bold">Security Analyst</span></div>
                    <div>Status: <span className="text-amber-700 font-bold uppercase">Pending Review</span></div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 leading-relaxed text-left flex items-start space-x-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <span>
                    Zero-trust governance requires administrative verification before accessing live telemetry streams.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setLoginIdentifier(registeredUserSummary?.username || '');
                    setLoginPassword('');
                  }}
                  className="btn btn-ghost w-full py-2 text-xs"
                >
                  Return to Sign In Screen
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 font-mono space-y-0.5">
          <p>SHADOW AI DETECTOR ENTERPRISE DEFENSE v1.0</p>
          <p className="text-[11px] text-slate-400">Zero-Trust Telemetry Inspection &amp; Risk Mitigation</p>
        </div>
      </div>
    </div>
  );
};
