import { Lead, Campaign, Activity, FollowUp, Notification, CurrentUser, PipelineStage } from "../types";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "";
const SESSION_TOKEN_KEY = "mip_session_token";

function headers(): HeadersInit {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    if (res.status === 401) localStorage.removeItem(SESSION_TOKEN_KEY);
    throw new Error(errBody.error || `API error (${res.status}): ${res.statusText}`);
  }
  return res.status === 204 ? undefined as T : res.json();
}

export interface AppState {
  leads: Lead[];
  campaigns: Campaign[];
  followups: FollowUp[];
  activities: Activity[];
  notifications: Notification[];
  pipelineStages?: PipelineStage[];
}

export const apiClient = {
  setSessionToken(token: string): void {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  },

  clearSessionToken(): void {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  },

  async get<T>(url: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      headers: headers()
    });
    return parseResponse<T>(res);
  },

  async post<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body)
    });
    return parseResponse<T>(res);
  },

  async patch<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body)
    });
    return parseResponse<T>(res);
  },

  async put<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(body)
    });
    return parseResponse<T>(res);
  },

  async delete<T>(url: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: "DELETE",
      headers: headers()
    });
    return parseResponse<T>(res);
  }
};
