import type { UserProfile } from '../types';

/** A profile photo, or the default: a gray person icon. */
export function Avatar({ user, size = 'md' }: { user: UserProfile; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  return user.avatarUrl
    ? <img className={`avatar avatar--${size}`} src={user.avatarUrl} alt={user.displayName} loading="lazy" />
    : <span className={`avatar avatar--${size} avatar--default`} role="img" aria-label={user.displayName}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="9.2" r="4.1" /><path d="M2.5 24c0-5.3 4.2-8.7 9.5-8.7s9.5 3.4 9.5 8.7z" /></svg>
    </span>;
}
