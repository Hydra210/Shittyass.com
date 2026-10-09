export type AccountUser = {
  id?: string | number;
  email?: string;
  display_name?: string;
  name?: string;
  username?: string;
  [key: string]: unknown;
};

export type LoginResult = {
  user?: AccountUser;
  requires_2fa?: boolean;
  challenge_token?: string;
  message?: string;
};

export class AuthApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'AuthApiError';
  }
}

function detailMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || !('detail' in payload)) return null;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string') return item.msg;
      return null;
    }).filter((message): message is string => Boolean(message));
    return messages.length ? messages.join(' ') : null;
  }
  return null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers, credentials: 'same-origin' });
  } catch {
    throw new AuthApiError('The authentication service could not be reached. Please try again.', 0);
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = detailMessage(payload) ?? `Authentication request failed (${response.status}).`;
    throw new AuthApiError(message, response.status);
  }

  return payload as T;
}

export const authApi = {
  register(input: { email: string; password: string; display_name: string }): Promise<unknown> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(input) });
  },

  login(input: { email: string; password: string }): Promise<LoginResult> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(input) });
  },

  verifyTwoFactor(input: { challenge_token: string; code: string }): Promise<{ user: AccountUser }> {
    return request('/auth/verify-2fa', { method: 'POST', body: JSON.stringify(input) });
  },

  logout(): Promise<{ ok: boolean }> {
    return request('/auth/logout', { method: 'POST' });
  },

  me(): Promise<AccountUser> {
    return request('/auth/me', { method: 'GET' });
  },
};
