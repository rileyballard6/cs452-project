import type { User } from '../types/auth.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const userService = {
  async uploadResume(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await fetch(`${API_BASE}/users/me/resume`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async updateMe(data: { displayName?: string; resumeText?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },
};
