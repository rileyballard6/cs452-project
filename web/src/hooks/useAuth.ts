import { useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import type { AuthState } from '../types/auth.types';

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    authService
      .getMe()
      .then((user) =>
        setState({ user, isAuthenticated: user !== null, isLoading: false })
      )
      .catch(() =>
        setState({ user: null, isAuthenticated: false, isLoading: false })
      );
  }, []);

  return state;
}
