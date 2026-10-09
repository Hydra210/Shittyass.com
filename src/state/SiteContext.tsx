import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { UiPreferences } from '../types';
import { useAuth } from './AuthContext';

export type { UiPreferences } from '../types';

type SiteContextValue = {
  preferences: UiPreferences;
  updatePreferences: (updates: Partial<UiPreferences>) => void;
  toast: string;
  flash: (message: string) => void;
  requestSignIn: (action: string) => void;
};

const DEFAULT_PREFERENCES: UiPreferences = { largeText: false, reduceMotion: false, compactView: false };
const SiteContext = createContext<SiteContextValue | null>(null);

function readPreferences(): UiPreferences {
  try {
    const stored = window.localStorage.getItem('shittyass-preferences');
    if (!stored) return DEFAULT_PREFERENCES;
    const values = JSON.parse(stored) as Partial<UiPreferences>;
    return {
      largeText: typeof values.largeText === 'boolean' ? values.largeText : false,
      reduceMotion: typeof values.reduceMotion === 'boolean' ? values.reduceMotion : false,
      compactView: typeof values.compactView === 'boolean' ? values.compactView : false,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UiPreferences>(readPreferences);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);
  const navigate = useNavigate();
  const location = useLocation();
  const { status, user } = useAuth();

  useEffect(() => {
    document.documentElement.dataset.largeText = String(preferences.largeText);
    document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion);
    document.documentElement.dataset.compactView = String(preferences.compactView);
    try {
      window.localStorage.setItem('shittyass-preferences', JSON.stringify(preferences));
    } catch { /* Local display preferences are optional. */ }
  }, [preferences]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3000);
  }, []);
  const updatePreferences = useCallback((updates: Partial<UiPreferences>) => {
    setPreferences((current) => ({ ...current, ...updates }));
  }, []);
  const requestSignIn = useCallback((action: string) => {
    if (status === 'loading') {
      flash('Checking your account. Try again in a moment.');
      return;
    }
    if (user) {
      flash(`${action} is not available until the social service is connected.`);
      return;
    }
    navigate('/login', { state: { requiredAction: action, from: location.pathname } });
  }, [flash, navigate, location.pathname, status, user]);

  const value = useMemo<SiteContextValue>(() => ({ preferences, updatePreferences, toast, flash, requestSignIn }), [preferences, updatePreferences, toast, flash, requestSignIn]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const value = useContext(SiteContext);
  if (!value) throw new Error('useSite must be used inside SiteProvider');
  return value;
}
