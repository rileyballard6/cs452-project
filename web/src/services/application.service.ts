import type { Application, AiAnalysis } from '../types/application.types';

export interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const applicationService = {
  async getAll(): Promise<Application[]> {
    const res = await fetch(`${API_BASE}/applications`, { credentials: 'include' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async getOne(id: string): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async create(data: Partial<Application>): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async update(id: string, data: Partial<Application>): Promise<Application> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async remove(id: string): Promise<void> {
    await fetch(`${API_BASE}/applications/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  async getAnalysis(id: string): Promise<AiAnalysis[]> {
    const res = await fetch(`${API_BASE}/applications/${id}/analysis`, { credentials: 'include' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async getStatusHistory(id: string): Promise<StatusHistoryEntry[]> {
    const res = await fetch(`${API_BASE}/applications/${id}/status-history`, { credentials: 'include' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async analyze(id: string): Promise<AiAnalysis> {
    const res = await fetch(`${API_BASE}/applications/${id}/analyze`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? String(res.status));
    }
    return res.json();
  },
};
