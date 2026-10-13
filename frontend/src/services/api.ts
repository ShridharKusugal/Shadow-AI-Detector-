/**
 * Unified API Client for Shadow AI Detector
 */

export const getApiBase = (): string => {
  const customUrl = localStorage.getItem('shadow_ai_api_url');
  if (customUrl && customUrl.trim()) {
    return `${customUrl.trim().replace(/\/+$/, '')}/api/v1`;
  }
  let envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    // Auto-correct any typo in Render domain name (e.g. removing incorrect -api suffix)
    if (envUrl.includes('shadow-ai-detector-api.onrender.com')) {
      envUrl = 'https://shadow-ai-detector.onrender.com';
    }
    return `${envUrl.trim().replace(/\/+$/, '')}/api/v1`;
  }

  // If on Vercel or cloud domain, direct to verified live Render service
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://shadow-ai-detector.onrender.com/api/v1';
  }

  return '/api/v1';
};

export const setCustomApiUrl = (url: string) => {
  if (url && url.trim()) {
    localStorage.setItem('shadow_ai_api_url', url.trim());
  } else {
    localStorage.removeItem('shadow_ai_api_url');
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('shadow_ai_token');
};

export const setAuthToken = (token: string, user: any) => {
  localStorage.setItem('shadow_ai_token', token);
  localStorage.setItem('shadow_ai_user', JSON.stringify(user));
};

export const clearAuthToken = () => {
  localStorage.removeItem('shadow_ai_token');
  localStorage.removeItem('shadow_ai_user');
};

export const getStoredUser = () => {
  const u = localStorage.getItem('shadow_ai_user');
  return u ? JSON.parse(u) : null;
};

const authHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const checkBackendHealth = async (): Promise<{ online: boolean; message?: string }> => {
  const base = getApiBase();
  const rootUrl = base.replace(/\/api\/v1\/?$/, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${rootUrl}/`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return { online: true };
    }
    return { online: false, message: `Status ${res.status}` };
  } catch {
    return { online: false, message: 'Server warming up' };
  }
};

export const api = {
  // Auth
  login: async (credentials: any, onStatusUpdate?: (status: string) => void) => {
    const base = getApiBase();
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const res = await fetch(`${base}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });

        if (!res.ok) {
          if ((res.status === 502 || res.status === 504 || res.status === 503) && attempt < maxRetries) {
            onStatusUpdate?.(`Backend is waking up (attempt ${attempt}/${maxRetries}). Retrying...`);
            await new Promise(r => setTimeout(r, 6000));
            continue;
          }

          let msg = 'Login failed';
          try {
            const body = await res.json();
            msg = body.detail || msg;
          } catch {
            msg = res.status === 504 || res.status === 502
              ? `Backend server at ${base} is temporarily unavailable. If on Render Free Tier, please allow ~45s for cold start.`
              : `Server returned error (${res.status})`;
          }
          throw new Error(msg);
        }

        return res.json();
      } catch (err: any) {
        const isNetworkErr = err.message && (
          err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError') ||
          err.message.includes('Unexpected end') ||
          err.message.includes('Load failed')
        );

        if (isNetworkErr && attempt < maxRetries) {
          onStatusUpdate?.(`Waking up cloud backend (attempt ${attempt}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, 6000));
          continue;
        }

        if (isNetworkErr) {
          throw new Error(`Unable to reach backend at ${base}. If on Render Free tier, it may still be finishing cold start. Please click Sign In again in 15 seconds.`);
        }
        throw err;
      }
    }
  },

  register: async (data: any, onStatusUpdate?: (status: string) => void) => {
    const base = getApiBase();
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const res = await fetch(`${base}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!res.ok) {
          if ((res.status === 502 || res.status === 504 || res.status === 503) && attempt < maxRetries) {
            onStatusUpdate?.(`Backend is waking up (attempt ${attempt}/${maxRetries}). Retrying...`);
            await new Promise(r => setTimeout(r, 6000));
            continue;
          }

          let msg = 'Registration failed';
          try {
            const body = await res.json();
            msg = body.detail || msg;
          } catch {
            msg = `Server error (${res.status})`;
          }
          throw new Error(msg);
        }

        return res.json();
      } catch (err: any) {
        const isNetworkErr = err.message && (
          err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError') ||
          err.message.includes('Unexpected end') ||
          err.message.includes('Load failed')
        );

        if (isNetworkErr && attempt < maxRetries) {
          onStatusUpdate?.(`Waking up cloud backend (attempt ${attempt}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, 6000));
          continue;
        }

        if (isNetworkErr) {
          throw new Error(`Unable to reach backend at ${base}. If on Render Free tier, please wait a moment and try again.`);
        }
        throw err;
      }
    }
  },

  getProfile: async () => {
    const res = await fetch(`${getApiBase()}/auth/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  logout: async () => {
    try {
      await fetch(`${getApiBase()}/auth/logout`, {
        method: 'POST',
        headers: authHeaders()
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      clearAuthToken();
    }
  },

  // Admin Analyst Approval Workflows
  getPendingAnalysts: async () => {
    const res = await fetch(`${getApiBase()}/auth/admin/pending-analysts`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch pending analyst accounts');
    return res.json();
  },

  approveAnalyst: async (userId: number) => {
    const res = await fetch(`${getApiBase()}/auth/admin/approve-analyst/${userId}`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to approve analyst');
    return res.json();
  },

  rejectAnalyst: async (userId: number) => {
    const res = await fetch(`${getApiBase()}/auth/admin/reject-analyst/${userId}`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to reject analyst');
    return res.json();
  },

  // Dashboard
  getDashboardMetrics: async () => {
    const res = await fetch(`${getApiBase()}/dashboard/metrics`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  loadDemoData: async () => {
    const res = await fetch(`${getApiBase()}/dashboard/load-demo-data`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to load demo data');
    return res.json();
  },

  // Ingestion
  uploadCsv: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${getApiBase()}/ingestion/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'CSV upload failed');
    return res.json();
  },

  getBatches: async () => {
    const res = await fetch(`${getApiBase()}/ingestion/batches`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch batches');
    return res.json();
  },

  getBatchReport: async (batchId: number) => {
    const res = await fetch(`${getApiBase()}/ingestion/batches/${batchId}/report`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch validation report');
    return res.json();
  },

  // Catalog
  getProviders: async () => {
    const res = await fetch(`${getApiBase()}/catalog/providers`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch AI providers');
    return res.json();
  },

  getInventory: async () => {
    const res = await fetch(`${getApiBase()}/catalog/inventory`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch catalog inventory');
    return res.json();
  },

  addProvider: async (data: any) => {
    const res = await fetch(`${getApiBase()}/catalog/providers`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to add provider');
    return res.json();
  },

  // Policies
  getPolicies: async () => {
    const res = await fetch(`${getApiBase()}/policy/rules`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch policy rules');
    return res.json();
  },

  updatePolicy: async (ruleId: number, data: { approval_status: string; risk_weight: number; notes?: string }) => {
    const res = await fetch(`${getApiBase()}/policy/rules/${ruleId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to update policy');
    return res.json();
  },

  // Events
  getEvents: async (params: Record<string, string | number>) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${getApiBase()}/events?${query}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  getEventDetail: async (eventId: number) => {
    const res = await fetch(`${getApiBase()}/events/${eventId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch event detail');
    return res.json();
  },

  // Alerts
  getAlerts: async (params: Record<string, string | number>) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${getApiBase()}/alerts?${query}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  getAlertDetail: async (alertId: number) => {
    const res = await fetch(`${getApiBase()}/alerts/${alertId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alert detail');
    return res.json();
  },

  investigateAlert: async (alertId: number, data: { action_taken: string; note: string; new_status?: string; assigned_username?: string }) => {
    const res = await fetch(`${getApiBase()}/alerts/${alertId}/investigate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to update investigation');
    return res.json();
  },

  // Machine Learning
  getMLStatus: async () => {
    const res = await fetch(`${getApiBase()}/ml/status`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch ML status');
    return res.json();
  },

  predictEvent: async (data: any) => {
    const res = await fetch(`${getApiBase()}/ml/predict`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Prediction failed');
    return res.json();
  },

  retrainModel: async () => {
    const res = await fetch(`${getApiBase()}/ml/train`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Retraining failed');
    return res.json();
  },

  // Reports & Audit
  getReportsSummary: async () => {
    const res = await fetch(`${getApiBase()}/reports/summary`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch security report');
    return res.json();
  },

  getAuditLogs: async (limit = 50) => {
    const res = await fetch(`${getApiBase()}/reports/audit-logs?limit=${limit}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  getExportAlertsCsvUrl: () => `${getApiBase()}/reports/export/alerts.csv`,
  downloadAlertsCsv: async () => {
    const res = await fetch(`${getApiBase()}/reports/export/alerts.csv`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow_ai_alerts_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
