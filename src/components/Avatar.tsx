import type { CSSProperties } from 'react';
import type { UserProfile } from '../types';

export function Avatar({ user, size = 'md' }: { user: UserProfile; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const initials = user.displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return user.avatarUrl
    ? <img className={`avatar avatar--${size}`} src={user.avatarUrl} alt={user.displayName} loading="lazy" />
    : <span className={`avatar avatar--${size}`} role="img" aria-label={user.displayName} style={{ '--avatar-color': 'var(--clay)' } as CSSProperties}><span aria-hidden="true">{initials}</span></span>;
}
