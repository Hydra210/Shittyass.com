import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../auth/api';
import { Brand } from '../components/Brand';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../state/AuthContext';

type AuthLink = { to: string; label: string };
type AuthLocationState = { from?: unknown; requiredAction?: unknown; email?: unknown };

function AuthFrame({ title, children, topLink }: { title: string; children: ReactNode; topLink?: AuthLink }) {
  return <div className="auth-layout">
    <header className="auth-topbar"><Brand />{topLink && <Link className="auth-top-link" to={topLink.to}>{topLink.label}</Link>}</header>
    <main id="main-content" className="auth-main">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-heading"><h1 id="auth-title">{title}</h1></div>
        {children}
      </section>
    </main>
  </div>;
}

function PasswordField({ id = 'password', label, name = id, autoComplete = 'current-password', minLength = 8 }: { id?: string; name?: string; label: string; autoComplete?: string; minLength?: number }) {
  const [visible, setVisible] = useState(false);
  return <label className="field-label" htmlFor={id}>{label}<span className="password-wrap"><input id={id} name={name} type={visible ? 'text' : 'password'} autoComplete={autoComplete} required minLength={minLength} /><button type="button" className="password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((open) => !open)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>;
}

function inAppReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  const pathname = value.split(/[?#]/, 1)[0];
  if (pathname === '/login' || pathname === '/signup' || pathname === '/confirm-email' || pathname === '/forgot-password') return '/';
  return value;
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'The request could not be completed. Please try again.';
}

export function LoginPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const state = location.state as AuthLocationState | null;
  const returnTo = inAppReturnPath(state?.from);
  const requiredAction = typeof state?.requiredAction === 'string' ? state.requiredAction : '';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    const fields = new FormData(event.currentTarget);
    try {
      if (challengeToken) {
        const result = await authApi.verifyTwoFactor({ challenge_token: challengeToken, code: code.trim() });
        if (!result.user) throw new Error('The account service did not return a user after verification.');
        const currentUser = await refreshUser();
        if (!currentUser) throw new Error('The account service did not establish a signed-in session.');
        setChallengeToken(null);
        navigate(returnTo, { replace: true });
        return;
      }

      const result = await authApi.login({
        email: email.trim(),
        password: String(fields.get('password') ?? ''),
      });
      if (result.requires_2fa) {
        if (!result.challenge_token) throw new Error('The account service did not return a 2FA challenge.');
        setChallengeToken(result.challenge_token);
        setNotice(result.message || 'Enter the verification code from your authenticator app.');
        return;
      }
      if (!result.user) throw new Error('The account service did not return a user.');
      const currentUser = await refreshUser();
      if (!currentUser) throw new Error('The account service did not establish a signed-in session.');
      navigate(returnTo, { replace: true });
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  }

  return <AuthFrame title={challengeToken ? 'Two-factor verification' : t('auth.signinTitle')} topLink={{ to: '/signup', label: t('auth.create') }}>
    <form className="form-stack" autoComplete="on" onSubmit={submit}>
      {requiredAction && !challengeToken && <p className="form-status">Sign in to {requiredAction}.</p>}
      {challengeToken ? <>
        <p className="settings-intro">{notice || 'Enter the verification code for your account.'}</p>
        <label className="field-label" htmlFor="two-factor-code">Authentication code<span className="input-with-icon"><ShieldCheck size={16} /><input id="two-factor-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required autoFocus /></span></label>
        <button type="button" className="text-button" onClick={() => { setChallengeToken(null); setCode(''); setNotice(''); setError(''); }}>Use a different sign-in</button>
      </> : <>
        <label className="field-label" htmlFor="login-email">{t('auth.email')}<span className="input-with-icon"><Mail size={16} /><input id="login-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></span></label>
        <PasswordField id="login-password" name="password" label={t('auth.password')} />
        <div className="auth-row"><span /><Link to="/forgot-password">{t('auth.forgot')}</Link></div>
      </>}
      {notice && !challengeToken && <p className="form-status" role="status">{notice}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="button button--primary button--wide" type="submit" disabled={busy}>{busy ? 'Please wait…' : challengeToken ? 'Verify code' : t('action.signin')} <ArrowRight size={16} /></button>
    </form>
  </AuthFrame>;
}

export function SignupPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get('signup-password') ?? '');
    const confirm = String(fields.get('signup-confirm') ?? '');
    if (name.trim().length < 2) { setError('Enter a name with at least two characters.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return; }
    if (password.length < 8) { setError('Use at least 8 characters for your password.'); return; }
    if (password !== confirm) { setError('The passwords do not match.'); return; }
    if (!agree) { setError('Please acknowledge the Terms and Privacy notice.'); return; }

    setBusy(true);
    setError('');
    try {
      await authApi.register({ email: email.trim(), password, display_name: name.trim() });
      navigate('/confirm-email', { state: { email: email.trim() } });
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  }

  return <AuthFrame title={t('auth.create')} topLink={{ to: '/login', label: t('action.signin') }}>
    <form className="form-stack" autoComplete="on" onSubmit={submit} noValidate>
      <label className="field-label" htmlFor="signup-name">{t('auth.name')}<input id="signup-name" name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required minLength={2} maxLength={40} /></label>
      <label className="field-label" htmlFor="signup-email">{t('auth.email')}<span className="input-with-icon"><Mail size={16} /><input id="signup-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></span></label>
      <label className="field-label" htmlFor="signup-password">{t('auth.password')}<span className="password-wrap"><input id="signup-password" name="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span><span className="field-help">Use at least 8 characters.</span></label>
      <PasswordField id="signup-confirm" name="signup-confirm" label="Confirm password" autoComplete="new-password" />
      <label className="check-field check-field--terms"><input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} /><span>I’ve read the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy notice</Link>.</span></label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="button button--primary button--wide" type="submit" disabled={busy}>{busy ? 'Creating account…' : t('auth.signup')} <ArrowRight size={16} /></button>
    </form>
  </AuthFrame>;
}

export function ForgotPasswordPage() {
  return <AuthFrame title="Reset password" topLink={{ to: '/login', label: 'Sign in' }}>
    <div className="confirmation-panel"><span className="confirmation-icon"><Mail size={24} /></span><p>Password recovery is not included in the available Accounts API routes, so this page cannot send a reset request or email.</p><Link to="/login" className="button button--primary button--wide">Back to sign in <ArrowRight size={15} /></Link></div>
  </AuthFrame>;
}

export function ConfirmEmailPage() {
  const location = useLocation();
  const state = location.state as AuthLocationState | null;
  const email = typeof state?.email === 'string' ? state.email : '';
  return <AuthFrame title="Confirm email" topLink={{ to: '/login', label: 'Sign in' }}>
    <div className="confirmation-panel"><span className="confirmation-icon"><Mail size={24} /></span>{email ? <p>Check <strong>{email}</strong> for the verification message, then verify your email before signing in.</p> : <p>To receive a verification message, submit the create-account form first. This page does not verify an account by itself.</p>}<Link to={email ? '/login' : '/signup'} className="button button--primary button--wide">{email ? 'Continue to sign in' : 'Create account'} <ArrowRight size={15} /></Link></div>
  </AuthFrame>;
}
