import type { User } from '../types/auth.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const authService = {
  redirectToGoogle(): void {
    window.location.href = `${API_BASE}/auth/google`;
  },

  async getMe(): Promise<User | null> {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json() as Promise<User>;
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },
};
