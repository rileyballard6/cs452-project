import type { User } from '../types/auth.types';
import type { WorkExperience, Skill, Project, PublicProfile } from '../types/portfolio.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const userService = {
  async updateMe(data: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async completeOnboarding(): Promise<User> {
    const res = await fetch(`${API_BASE}/users/me/complete-onboarding`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async uploadResume(file: File): Promise<{ user: User; parsed: unknown }> {
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

  // ─── Work Experience ────────────────────────────────────────────────────────
  async getWorkExperience(): Promise<WorkExperience[]> {
    const res = await fetch(`${API_BASE}/users/me/work-experience`, { credentials: 'include' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async createWorkExperience(data: Partial<WorkExperience>): Promise<WorkExperience> {
    const res = await fetch(`${API_BASE}/users/me/work-experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async updateWorkExperience(id: string, data: Partial<WorkExperience>): Promise<WorkExperience> {
    const res = await fetch(`${API_BASE}/users/me/work-experience/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async deleteWorkExperience(id: string): Promise<void> {
    await fetch(`${API_BASE}/users/me/work-experience/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  // ─── Skills ─────────────────────────────────────────────────────────────────
  async getSkills(): Promise<Skill[]> {
    const res = await fetch(`${API_BASE}/users/me/skills`, { credentials: 'include' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async createSkill(data: { name: string; category: string }): Promise<Skill> {
    const res = await fetch(`${API_BASE}/users/me/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async deleteSkill(id: string): Promise<void> {
    await fetch(`${API_BASE}/users/me/skills/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  // ─── Projects ────────────────────────────────────────────────────────────────
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/users/me/projects`, { credentials: 'include' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/users/me/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${API_BASE}/users/me/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    await fetch(`${API_BASE}/users/me/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  async deleteAccount(): Promise<void> {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(String(res.status));
  },

  async checkUsername(username: string): Promise<{ available: boolean }> {
    const res = await fetch(`${API_BASE}/users/me/check-username?username=${encodeURIComponent(username)}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },

  // ─── Public Profile ──────────────────────────────────────────────────────────
  async getPublicProfile(username: string): Promise<PublicProfile> {
    const res = await fetch(`${API_BASE}/users/u/${username}`);
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  },
};
