import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export function SignInGate({ feature, description, children }: { feature: string; description?: string; children?: ReactNode }) {
  const location = useLocation();
  const { status, user } = useAuth();
  if (status === 'loading') return <div className="state-card" role="status"><div><strong>Checking your account…</strong></div></div>;
  if (!user) return <Navigate to="/login" replace state={{ requiredAction: feature, from: location.pathname }} />;
  if (children) return <>{children}</>;
  return <div className="state-card"><div><strong>You’re signed in, but this feature is not connected yet.</strong><p>{description ?? `${feature} will be available when the social service is connected.`}</p></div></div>;
}
