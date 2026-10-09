import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, AuthApiError, type AccountUser } from '../auth/api';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'unavailable';

type AuthContextValue = {
  user: AccountUser | null;
  status: AuthStatus;
  error: string | null;
  refreshUser: () => Promise<AccountUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      setStatus('authenticated');
      setError(null);
      return currentUser;
    } catch (cause) {
      if (cause instanceof AuthApiError && cause.status === 401) {
        setUser(null);
        setStatus('anonymous');
        setError(null);
        return null;
      }
      const message = cause instanceof Error ? cause.message : 'The authentication service is unavailable.';
      setUser(null);
      setStatus('unavailable');
      setError(message);
      throw cause;
    }
  }, []);

  useEffect(() => {
    void refreshUser().catch(() => undefined);
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus('anonymous');
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, status, error, refreshUser, logout }), [user, status, error, refreshUser, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
