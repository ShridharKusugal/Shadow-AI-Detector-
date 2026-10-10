import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, BarChart2, CheckCircle2, AlertTriangle, RefreshCw,
  Sparkles, Layers, Sliders, ArrowRight, Zap, ShieldAlert,
  Gauge, Activity, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ModelEvaluationPage: React.FC = () => {
  const [mlData, setMlData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);

  // Playground state
  const [testDomain, setTestDomain] = useState('chatgpt.com');
  const [testBytesOut, setTestBytesOut] = useState(250000);
  const [testConns, setTestConns] = useState(12);
  const [predictResult, setPredictResult] = useState<any | null>(null);
  const [predicting, setPredicting] = useState(false);

  const { hasRole } = useAuth();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getMLStatus();
      setMlData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setRetrainMsg('Fitting Random Forest & Logistic Regression on synthetic dataset...');
      const res = await api.retrainModel();
      setRetrainMsg('Model training pipeline completed and artifacts updated in database!');
      await fetchStatus();
    } catch (err: any) {
      setRetrainMsg(`Training failed: ${err.message}`);
    } finally {
      setRetraining(false);
    }
  };

  const handlePredictTest = async (e?: React.FormEvent, customDomain?: string, customBytes?: number, customConns?: number) => {
    if (e) e.preventDefault();
    const domain = customDomain || testDomain;
    const bytesOut = customBytes !== undefined ? customBytes : testBytesOut;
    const conns = customConns !== undefined ? customConns : testConns;

    try {
      setPredicting(true);
      const res = await api.predictEvent({
        destination_domain: domain,
        bytes_out: Number(bytesOut),
        bytes_in: Number(bytesOut * 3),
        connection_count: Number(conns)
      });
      setPredictResult(res);
    } catch (err: any) {
      alert(err.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const runPresetScenario = (domain: string, bytes: number, conns: number) => {
    setTestDomain(domain);
    setTestBytesOut(bytes);
    setTestConns(conns);
    handlePredictTest(undefined, domain, bytes, conns);
  };

  if (loading && !mlData) {
    return (
      <div className="py-24 text-center text-sm font-mono text-slate-500">
        <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading ML evaluation benchmarks...
      </div>
    );
  }

  if (mlData?.status === 'uninitialized') {
    return (
      <div className="p-10 max-w-xl mx-auto text-center space-y-5 card mt-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <Cpu className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Model Not Yet Trained</h2>
        <p className="text-sm text-slate-500">
          No trained scikit-learn model artifacts were found. Initialize the baseline model pipeline to activate ML risk scoring.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="btn btn-primary"
          >
            {retraining ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Fitting Baseline Model...
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                Initialize Baseline Model (seed=42)
              </>
            )}
          </button>
        </div>
        {retrainMsg && (
          <p className="text-xs font-mono text-cyan-500 mt-2">{retrainMsg}</p>
        )}
      </div>
    );
  }

  const metrics = mlData?.metrics || {};
  const cm = mlData?.confusion_matrix || {};
  const imp = mlData?.feature_importance || {};

  const featureBarData = Object.entries(imp).map(([key, val]) => ({
    name: key,
    importance: Math.round(Number(val) * 100)
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              AI / ML Inference Engine
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Random Forest v1.0
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Machine Learning Model Evaluation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Empirical benchmark metrics for the scikit-learn Random Forest classifier and Logistic Regression baseline.
          </p>
        </div>

        {hasRole(['admin']) && (
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="btn btn-ghost self-start md:self-center"
            aria-label="Retrain model"
          >
            <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? 'Retraining...' : 'Retrain Baseline Model'}</span>
          </button>
        )}
      </div>

      {/* Retrain Alert Notification */}
      <AnimatePresence>
        {retrainMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-sm flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-cyan-600 shrink-0" />
              <span className="font-medium font-mono text-xs">{retrainMsg}</span>
            </div>
            <button
              onClick={() => setRetrainMsg(null)}
              className="text-cyan-700 hover:text-cyan-900 text-xs font-semibold"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclosure Banner */}
      <div className="p-4.5 rounded-xl bg-purple-50/60 border border-purple-200 text-sm flex items-start space-x-3.5">
        <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-purple-900 text-xs uppercase tracking-wider font-mono">
            Synthetic Benchmark Ground-Truth Disclosure
          </span>
          <p className="text-xs text-purple-800/90 leading-relaxed">
            Metrics below were evaluated on an isolated 25% test split (n={mlData?.test_samples || 850}) from the benchmark telemetry dataset.
            The model assists analysts in prioritizing high-risk investigation queues with zero blackbox hallucination.
          </p>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="card p-4.5 text-center">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">Accuracy</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-700 mt-1.5">
            {metrics.accuracy ? (metrics.accuracy * 100).toFixed(1) : 0}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Test split</span>
        </div>

        <div className="card p-4.5 text-center">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">Precision</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 mt-1.5">
            {metrics.precision ? (metrics.precision * 100).toFixed(1) : 0}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Low false alert rate</span>
        </div>

        <div className="card p-4.5 text-center">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">Recall</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-700 mt-1.5">
            {metrics.recall ? (metrics.recall * 100).toFixed(1) : 0}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Shadow AI caught</span>
        </div>

        <div className="card p-4.5 text-center">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">F1-Score</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-700 mt-1.5">
            {metrics.f1_score ? (metrics.f1_score * 100).toFixed(1) : 0}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Harmonic balance</span>
        </div>

        <div className="card p-4.5 text-center">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-bold tracking-wider">False Pos. Rate</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-700 mt-1.5">
            {metrics.false_positive_rate ? (metrics.false_positive_rate * 100).toFixed(2) : 0}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Target &lt; 3.0%</span>
        </div>
      </div>

      {/* Confusion Matrix & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Card */}
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Confusion Matrix (Test Split n={mlData?.test_samples || 850})</h2>
            <p className="text-xs text-slate-500 mt-0.5">Empirical classification counts evaluated against ground-truth labels</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-center font-mono">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-[11px] uppercase font-bold text-emerald-800 block">True Negatives (TN)</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{cm.true_negative ?? 0}</div>
              <p className="text-[11px] text-slate-600 font-sans">Benign correctly marked benign</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[11px] uppercase font-bold text-amber-800 block">False Positives (FP)</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">{cm.false_positive ?? 0}</div>
              <p className="text-[11px] text-slate-600 font-sans">Benign flagged for analyst triage</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
              <span className="text-[11px] uppercase font-bold text-rose-800 block">False Negatives (FN)</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">{cm.false_negative ?? 0}</div>
              <p className="text-[11px] text-slate-600 font-sans">Missed shadow AI egress</p>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200 space-y-1">
              <span className="text-[11px] uppercase font-bold text-cyan-800 block">True Positives (TP)</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-700">{cm.true_positive ?? 0}</div>
              <p className="text-[11px] text-slate-600 font-sans">Shadow AI flagged for review</p>
            </div>
          </div>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Feature Importance Weights</h2>
            <p className="text-xs text-slate-500 mt-0.5">Gini-impurity contribution of each telemetry feature</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureBarData} layout="vertical" margin={{ top: 5, right: 25, left: 80, bottom: 5 }}>
                <XAxis type="number" stroke="#64748B" fontSize={11} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: 'var(--border-default)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(15, 35, 91, 0.08)'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Importance']}
                />
                <Bar dataKey="importance" fill="#06B6D4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Model Prediction Sandbox */}
      <div className="card p-6 md:p-8 space-y-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-cyan-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Interactive Model Inference Test Sandbox
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit custom telemetry attributes or trigger 1-click incident scenarios to test real-time classification
              </p>
            </div>
          </div>
        </div>

        {/* 1-Click Interactive Test Scenarios */}
        <div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
            1-Click Interactive Test Scenarios
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => runPresetScenario('chatgpt.com', 450000, 24)}
              className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-cyan-50/50 border border-slate-200 hover:border-cyan-300 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold font-mono text-cyan-800 flex items-center justify-between">
                <span>ChatGPT Heavy Egress</span>
                <Zap className="w-3.5 h-3.5 text-cyan-600 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">chatgpt.com • 450 KB • 24 conn</div>
            </button>

            <button
              type="button"
              onClick={() => runPresetScenario('api.anthropic.com', 8900000, 48)}
              className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-rose-50/50 border border-slate-200 hover:border-rose-300 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold font-mono text-rose-800 flex items-center justify-between">
                <span>Anthropic Claude Spike</span>
                <Zap className="w-3.5 h-3.5 text-rose-600 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">api.anthropic.com • 8.9 MB • 48 conn</div>
            </button>

            <button
              type="button"
              onClick={() => runPresetScenario('github.com', 45000, 4)}
              className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold font-mono text-emerald-800 flex items-center justify-between">
                <span>Benign Web Traffic</span>
                <Zap className="w-3.5 h-3.5 text-emerald-600 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">github.com • 45 KB • 4 conn</div>
            </button>

            <button
              type="button"
              onClick={() => runPresetScenario('api.deepseek.com', 1250000, 18)}
              className="p-3.5 rounded-xl bg-slate-50/80 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 text-left transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold font-mono text-amber-800 flex items-center justify-between">
                <span>DeepSeek Cloud API</span>
                <Zap className="w-3.5 h-3.5 text-amber-600 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">api.deepseek.com • 1.25 MB • 18 conn</div>
            </button>
          </div>
        </div>

        {/* Custom Input Form */}
        <form onSubmit={(e) => handlePredictTest(e)} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label htmlFor="test-domain" className="text-slate-700 font-bold block mb-1.5">Destination Domain</label>
            <input
              id="test-domain"
              type="text"
              required
              value={testDomain}
              onChange={(e) => setTestDomain(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono"
            />
          </div>

          <div>
            <label htmlFor="test-bytes" className="text-slate-700 font-bold block mb-1.5">Outbound Bytes</label>
            <input
              id="test-bytes"
              type="number"
              required
              value={testBytesOut}
              onChange={(e) => setTestBytesOut(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono"
            />
          </div>

          <div>
            <label htmlFor="test-conns" className="text-slate-700 font-bold block mb-1.5">Connection Count</label>
            <input
              id="test-conns"
              type="number"
              required
              value={testConns}
              onChange={(e) => setTestConns(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={predicting}
              className="btn btn-primary w-full py-2.5"
            >
              {predicting ? 'Evaluating Features...' : 'Run Real-Time Inference'}
            </button>
          </div>
        </form>

        {/* Prediction Outcome Card */}
        {predictResult && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs font-mono animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] uppercase text-slate-500 font-bold">Prediction Result</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  Target Domain: <span className="text-cyan-700 font-mono">{testDomain}</span>
                </div>
              </div>
              <span className={`badge ${
                predictResult.review_predicted ? 'badge-unapproved' : 'badge-approved'
              } text-xs py-1 px-3`}>
                {predictResult.classification}
              </span>
            </div>

            {/* Probability Meter */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-1.5">
                <span>Model Risk Score Confidence:</span>
                <span className="font-mono text-cyan-800 font-bold">
                  {(predictResult.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    predictResult.confidence >= 0.75
                      ? 'bg-rose-500'
                      : predictResult.confidence >= 0.4
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, predictResult.confidence * 100))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 pt-1">
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 block mb-0.5 text-[11px]">Identified AI Provider:</span>
                <span className="text-slate-900 font-bold">{predictResult.matched_provider || 'Unclassified Web Traffic'}</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 block mb-0.5 text-[11px]">Policy Standing:</span>
                <span className="text-slate-900 font-bold uppercase">{predictResult.approval_status}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
