import { Lead, Campaign, Activity, FollowUp, Notification, CurrentUser } from "../types";

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

function buildUrl(url: string) {
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function readError(res: Response) {
  const errBody = await res.json().catch(() => ({}));
  return errBody.error || `API error (${res.status}): ${res.statusText}`;
}

export interface AppState {
  leads: Lead[];
  campaigns: Campaign[];
  followups: FollowUp[];
  activities: Activity[];
  notifications: Notification[];
}

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(buildUrl(url), {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
      throw new Error(await readError(res));
    }
    return res.json();
  },

  async post<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(buildUrl(url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new Error(await readError(res));
    }
    return res.json();
  },

  async patch<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(buildUrl(url), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new Error(await readError(res));
    }
    return res.json();
  },

  async put<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(buildUrl(url), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new Error(await readError(res));
    }
    return res.json();
  }
};
