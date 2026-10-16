import { useEffect, useRef, useState } from 'react';
import { profileApi } from './api';

export type UsernameState = { state: 'idle' | 'checking' | 'ok' | 'bad'; message: string };
const LOOKS_RIGHT = /^[A-Za-z0-9][A-Za-z0-9_]{1,18}[A-Za-z0-9]$/;

/** Checks a username as you type (after a short pause). `ownHandle` counts as available. */
export function useUsernameCheck(value: string, ownHandle?: string): UsernameState {
  const [result, setResult] = useState<UsernameState>({ state: 'idle', message: '' });
  const latest = useRef(0);

  useEffect(() => {
    const name = value.trim().replace(/^@/, '');
    const ticket = ++latest.current;
    if (!name || name === ownHandle) { setResult({ state: 'idle', message: '' }); return; }
    if (!LOOKS_RIGHT.test(name) || name.includes('__')) {
      setResult({ state: 'bad', message: 'Use 3 to 20 letters, numbers or underscores. Start and end with a letter or number.' });
      return;
    }
    setResult({ state: 'checking', message: 'Checking…' });
    const timer = window.setTimeout(() => {
      profileApi.usernameAvailable(name).then((r) => {
        if (ticket === latest.current) setResult(r.available ? { state: 'ok', message: `@${name} is available` } : { state: 'bad', message: r.reason ?? 'That username is taken.' });
      }).catch(() => {
        if (ticket === latest.current) setResult({ state: 'idle', message: '' });
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [value, ownHandle]);

  return result;
}
