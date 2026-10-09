/**
 * Unified API Client for Shadow AI Detector
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/+$/, '')}/api/v1` : '/api/v1';


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

export const api = {
  // Auth
  login: async (credentials: any) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      if (!res.ok) {
        let msg = 'Login failed';
        try {
          const body = await res.json();
          msg = body.detail || msg;
        } catch {
          msg = res.status === 504 || res.status === 502
            ? 'Backend server is not running on port 8000. Please start the backend server.'
            : `Server returned error (${res.status})`;
        }
        throw new Error(msg);
      }
      return res.json();
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Unexpected end')) {
        throw new Error('Backend server is offline. Please run the backend command on port 8000.');
      }
      throw err;
    }
  },

  register: async (data: any) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
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
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Unexpected end')) {
        throw new Error('Backend server is offline. Please run the backend command on port 8000.');
      }
      throw err;
    }
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
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
    const res = await fetch(`${API_BASE}/auth/admin/pending-analysts`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch pending analyst accounts');
    return res.json();
  },

  approveAnalyst: async (userId: number) => {
    const res = await fetch(`${API_BASE}/auth/admin/approve-analyst/${userId}`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to approve analyst');
    return res.json();
  },

  rejectAnalyst: async (userId: number) => {
    const res = await fetch(`${API_BASE}/auth/admin/reject-analyst/${userId}`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to reject analyst');
    return res.json();
  },

  // Dashboard
  getDashboardMetrics: async () => {
    const res = await fetch(`${API_BASE}/dashboard/metrics`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  loadDemoData: async () => {
    const res = await fetch(`${API_BASE}/dashboard/load-demo-data`, {
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
    const res = await fetch(`${API_BASE}/ingestion/upload`, {
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
    const res = await fetch(`${API_BASE}/ingestion/batches`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch batches');
    return res.json();
  },

  getBatchReport: async (batchId: number) => {
    const res = await fetch(`${API_BASE}/ingestion/batches/${batchId}/report`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch validation report');
    return res.json();
  },

  // Catalog
  getProviders: async () => {
    const res = await fetch(`${API_BASE}/catalog/providers`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch AI providers');
    return res.json();
  },

  getInventory: async () => {
    const res = await fetch(`${API_BASE}/catalog/inventory`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch catalog inventory');
    return res.json();
  },

  addProvider: async (data: any) => {
    const res = await fetch(`${API_BASE}/catalog/providers`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to add provider');
    return res.json();
  },

  // Policies
  getPolicies: async () => {
    const res = await fetch(`${API_BASE}/policy/rules`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch policy rules');
    return res.json();
  },

  updatePolicy: async (ruleId: number, data: { approval_status: string; risk_weight: number; notes?: string }) => {
    const res = await fetch(`${API_BASE}/policy/rules/${ruleId}`, {
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
    const res = await fetch(`${API_BASE}/events?${query}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  getEventDetail: async (eventId: number) => {
    const res = await fetch(`${API_BASE}/events/${eventId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch event detail');
    return res.json();
  },

  // Alerts
  getAlerts: async (params: Record<string, string | number>) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/alerts?${query}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  getAlertDetail: async (alertId: number) => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alert detail');
    return res.json();
  },

  investigateAlert: async (alertId: number, data: { action_taken: string; note: string; new_status?: string; assigned_username?: string }) => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/investigate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Failed to update investigation');
    return res.json();
  },

  // Machine Learning
  getMLStatus: async () => {
    const res = await fetch(`${API_BASE}/ml/status`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch ML status');
    return res.json();
  },

  predictEvent: async (data: any) => {
    const res = await fetch(`${API_BASE}/ml/predict`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Prediction failed');
    return res.json();
  },

  retrainModel: async () => {
    const res = await fetch(`${API_BASE}/ml/train`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Retraining failed');
    return res.json();
  },

  // Reports & Audit
  getReportsSummary: async () => {
    const res = await fetch(`${API_BASE}/reports/summary`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch security report');
    return res.json();
  },

  getAuditLogs: async (limit = 50) => {
    const res = await fetch(`${API_BASE}/reports/audit-logs?limit=${limit}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  getExportAlertsCsvUrl: () => `${API_BASE}/reports/export/alerts.csv`,
  downloadAlertsCsv: async () => {
    const res = await fetch(`${API_BASE}/reports/export/alerts.csv`, {
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
