export interface User {
  id: string;
  googleId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  resumeText: string | null;
  createdAt: string;
  lastLogin: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
