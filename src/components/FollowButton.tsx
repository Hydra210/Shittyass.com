import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { profileApi } from '../profile/api';
import type { UserProfile } from '../types';
import { useAuth } from '../state/AuthContext';

export function FollowButton({ person, onChange }: { person: UserProfile; onChange: (next: UserProfile) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = async () => {
    if (!user) { navigate('/login', { state: { requiredAction: 'follow people', from: location.pathname } }); return; }
    setBusy(true);
    setError('');
    try {
      onChange(person.isFollowing ? await profileApi.unfollow(person.handle) : await profileApi.follow(person.handle));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return <>
    <button type="button" className={`button button--follow${person.isFollowing ? ' button--following' : ''}`} onClick={toggle} disabled={busy} aria-pressed={Boolean(person.isFollowing)}>{person.isFollowing ? 'Following' : 'Follow'}</button>
    {error && <span className="field-error" role="alert">{error}</span>}
  </>;
}
