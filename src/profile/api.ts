import type { UserProfile } from '../types';

export class ProfileApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ProfileApiError';
  }
}

export const LIMITS = { bio: 200, name: 40, location: 40, website: 100, pronouns: 24 } as const;
export type ImageKind = 'avatar' | 'banner';
export type MeProfile = { profile: UserProfile };
export type PeoplePage = { people: UserProfile[]; total: number; nextOffset: number | null };

function messageFrom(payload: unknown, fallback: string): string {
  const detail = payload && typeof payload === 'object' ? (payload as { detail?: unknown }).detail : undefined;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => (d && typeof d === 'object' && typeof (d as { msg?: unknown }).msg === 'string' ? (d as { msg: string }).msg : null)).filter(Boolean);
    if (msgs.length) return msgs.join(' ');
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}, jsonBody?: unknown): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  let body = init.body;
  if (jsonBody !== undefined) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(jsonBody); }
  let response: Response;
  try {
    response = await fetch(path, { ...init, body, headers, credentials: 'same-origin' });
  } catch {
    throw new ProfileApiError('Could not reach the server. Check your connection and try again.', 0);
  }
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) {
    const fallback = response.status === 413 ? 'That image is too large.' : response.status === 429 ? 'Too many attempts. Please wait a moment.' : `Something went wrong (${response.status}).`;
    throw new ProfileApiError(messageFrom(payload, fallback), response.status);
  }
  return payload as T;
}

const enc = encodeURIComponent;
const unwrap = (r: { profile: UserProfile }) => r.profile;

export const profileApi = {
  me: () => request<MeProfile>('/api/me/profile'),
  update: (input: Partial<{ display_name: string; bio: string; location: string; website: string; pronouns: string }>) => request<{ profile: UserProfile }>('/api/me/profile', { method: 'PATCH' }, input).then(unwrap),
  changeUsername: (username: string) => request<{ profile: UserProfile }>('/api/me/username', { method: 'POST' }, { username }).then(unwrap),
  usernameAvailable: (username: string) => request<{ available: boolean; reason: string | null }>(`/api/username-available?u=${enc(username)}`),
  uploadImage: (kind: ImageKind, blob: Blob) => request<{ profile: UserProfile }>(`/api/me/${kind}`, { method: 'POST', headers: { 'Content-Type': blob.type || 'image/jpeg' }, body: blob }).then(unwrap),
  removeImage: (kind: ImageKind) => request<{ profile: UserProfile }>(`/api/me/${kind}`, { method: 'DELETE' }).then(unwrap),
  get: (handle: string) => request<{ profile: UserProfile }>(`/api/profiles/${enc(handle)}`).then(unwrap),
  follow: (handle: string) => request<{ profile: UserProfile }>(`/api/profiles/${enc(handle)}/follow`, { method: 'POST' }).then(unwrap),
  unfollow: (handle: string) => request<{ profile: UserProfile }>(`/api/profiles/${enc(handle)}/follow`, { method: 'DELETE' }).then(unwrap),
  people: (handle: string, kind: 'followers' | 'following', offset = 0) => request<PeoplePage>(`/api/profiles/${enc(handle)}/${kind}?offset=${offset}`),
  search: (q: string) => request<{ people: UserProfile[] }>(`/api/profiles/search?q=${enc(q)}`),
};

export function websiteLabel(url: string): string {
  try { const u = new URL(url); return (u.hostname + (u.pathname === '/' ? '' : u.pathname)).replace(/^www\./, ''); } catch { return url; }
}
