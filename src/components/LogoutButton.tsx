import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSite } from '../state/SiteContext';
import { useAuth } from '../state/AuthContext';

export function LogoutButton({ className = 'button button--outline', children = 'Sign out', onLoggedOut }: { className?: string; children?: ReactNode; onLoggedOut?: () => void }) {
  const { logout } = useAuth();
  const { flash } = useSite();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      onLoggedOut?.();
      flash('You are signed out.');
      navigate('/login', { replace: true });
    } catch (cause) {
      flash(cause instanceof Error ? cause.message : 'Sign out could not be completed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <button type="button" className={className} onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : children}</button>;
}
