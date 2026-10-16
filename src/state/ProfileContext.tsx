import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { profileApi } from '../profile/api';
import type { UserProfile } from '../types';
import { useAuth } from './AuthContext';

// Every signed-in account has a profile (the server creates it the first time it's needed).
export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error';

type ProfileContextValue = {
  profile: UserProfile | null;
  status: ProfileStatus;
  setProfile: (profile: UserProfile) => void;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, status: authStatus } = useAuth();
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>('idle');

  const load = useCallback(async () => {
    setStatus((current) => (current === 'ready' ? current : 'loading'));
    try {
      setProfileState((await profileApi.me()).profile);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated' && user) void load();
    else if (authStatus === 'anonymous') { setProfileState(null); setStatus('idle'); }
  }, [authStatus, user, load]);

  const setProfile = useCallback((next: UserProfile) => { setProfileState(next); setStatus('ready'); }, []);
  const value = useMemo(() => ({ profile, status, setProfile, refreshProfile: load }), [profile, status, setProfile, load]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile must be used inside ProfileProvider');
  return value;
}
