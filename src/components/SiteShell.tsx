import { useState } from 'react';
import { Bell, Bookmark, CircleUserRound, Compass, Home, LogIn, Menu, MessageCircle, Plus, Search, Settings, UsersRound, X } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useSite } from '../state/SiteContext';
import { useAuth } from '../state/AuthContext';
import type { AccountUser } from '../auth/api';
import { Brand } from './Brand';
import { Dialog } from './Dialog';
import { Composer } from './Composer';
import { LogoutButton } from './LogoutButton';

const navItems = [
  { to: '/', key: 'nav.home', icon: Home, exact: true },
  { to: '/explore', key: 'nav.explore', icon: Compass },
  { to: '/factions', key: 'nav.factions', icon: UsersRound },
  { to: '/notifications', key: 'nav.notifications', icon: Bell },
  { to: '/messages', key: 'nav.messages', icon: MessageCircle },
  { to: '/bookmarks', key: 'nav.bookmarks', icon: Bookmark },
  { to: '/settings', key: 'nav.settings', icon: Settings },
];

function accountLabel(user: AccountUser) {
  return user.display_name || user.name || user.username || user.email || 'Signed in';
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { t } = useLanguage();
  return <>
    {navItems.map(({ to, key, icon: Icon, exact }) => {
      const active = exact ? location.pathname === to : location.pathname.startsWith(to);
      return <Link key={to} to={to} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={`nav-link${active ? ' nav-link--active' : ''}`}>
        <span className="nav-icon-wrap"><Icon size={19} strokeWidth={active ? 2.2 : 1.8} /></span>
        <span>{t(key)}</span>
      </Link>;
    })}
  </>;
}

function SearchEntry({ mobile = false }: { mobile?: boolean }) {
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const inputId = mobile ? 'mobile-search' : 'rail-search';
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
  };
  return <form className={`search-entry${mobile ? ' search-entry--mobile' : ''}`} onSubmit={submit} role="search">
    <Search size={17} aria-hidden="true" />
    <label className="sr-only" htmlFor={inputId}>{t('action.search')}</label>
    <input id={inputId} value={value} onChange={(event) => setValue(event.target.value)} placeholder={t('action.search')} />
    {value && <button type="button" aria-label="Clear search" className="search-clear" onClick={() => setValue('')}><X size={14} /></button>}
  </form>;
}

function RightRail() {
  return <aside className="right-rail" aria-label="Information and search">
    <SearchEntry />
    <section className="rail-card rail-information">
      <h2>Factions</h2>
      <p>Explore community spaces or set up a faction of your own.</p>
      <Link className="rail-faction-link" to="/factions">Explore factions <span aria-hidden="true">→</span></Link>
      <nav aria-label="Community information">
        <Link to="/about">About</Link>
        <Link to="/safety">Community standards</Link>
        <Link to="/help">Help &amp; support</Link>
      </nav>
    </section>
    <footer className="rail-footer">
      <nav aria-label="Legal information"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/accessibility">Accessibility</Link><Link to="/cookies">Storage notice</Link></nav>
      <small>© 2026 ShittyAss.com</small>
    </footer>
  </aside>;
}

function ToastRegion() {
  const { toast } = useSite();
  return <div className={`toast-region${toast ? ' toast-region--visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">{toast}</div>;
}

function MobileNavigation({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useLanguage();
  const { requestSignIn } = useSite();
  const { user, status } = useAuth();
  return <nav className="mobile-menu-content" aria-label="Site navigation">
    <div className="mobile-menu-links"><NavLinks onNavigate={onNavigate} /><Link className="nav-link" to="/u/me" onClick={onNavigate}><span className="nav-icon-wrap"><CircleUserRound size={19} /></span><span>My profile</span></Link></div>
    <button className="button button--primary mobile-menu-compose" onClick={() => { onNavigate(); requestSignIn('write a post'); }}><Plus size={17} />{t('action.post')}</button>
    <div className="mobile-menu-account">
      {user ? <><p>Signed in as {accountLabel(user)}</p><LogoutButton className="button button--outline" onLoggedOut={onNavigate} /></> : status === 'loading' ? <p role="status">Checking account…</p> : <><Link className="button button--outline" to="/login" onClick={onNavigate}><LogIn size={15} />{t('action.signin')}</Link><Link className="button button--primary" to="/signup" onClick={onNavigate}>{t('action.signup')}</Link></>}
    </div>
    <nav className="mobile-menu-legal" aria-label="Legal and help"><Link to="/about" onClick={onNavigate}>About</Link><Link to="/help" onClick={onNavigate}>Help</Link><Link to="/privacy" onClick={onNavigate}>Privacy</Link><Link to="/terms" onClick={onNavigate}>Terms</Link><Link to="/accessibility" onClick={onNavigate}>Accessibility</Link><Link to="/safety" onClick={onNavigate}>Safety</Link></nav>
  </nav>;
}

export function SiteShell() {
  const { t } = useLanguage();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { requestSignIn } = useSite();
  const { user, status } = useAuth();
  const location = useLocation();
  const onFactionRoute = location.pathname.startsWith('/factions');
  const onExploreRoute = location.pathname.startsWith('/explore') || location.pathname.startsWith('/search');
  return <div className="site-shell">
    <header className="mobile-header"><Brand compact /><div className="mobile-header-actions">
      <button className="icon-button mobile-search-toggle" aria-label={mobileSearchOpen ? 'Close search' : 'Open search'} aria-expanded={mobileSearchOpen} onClick={() => setMobileSearchOpen((open) => !open)}><Search size={19} /></button>
      <button className="icon-button mobile-menu-toggle" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button>
    </div></header>
    {mobileSearchOpen && <div className="mobile-search-drawer"><SearchEntry mobile /><button className="icon-button" aria-label="Close search" onClick={() => setMobileSearchOpen(false)}><X size={18} /></button></div>}
    <div className="app-layout">
      <aside className="left-rail" aria-label="Main navigation">
        <div className="left-rail-top"><Brand /></div>
        <nav className="primary-nav"><NavLinks /></nav>
        <Composer />
        <div className="left-rail-bottom">
          <Link to="/u/me" className="profile-link"><CircleUserRound size={18} /><span>My profile</span></Link>
          {user ? <section className="guest-account guest-account--signed-in" aria-label="Account access"><p>Signed in as {accountLabel(user)}</p><LogoutButton className="guest-signin" /></section> : status === 'loading' ? <section className="guest-account" aria-label="Account status"><p role="status">Checking account…</p></section> : <section className="guest-account" aria-label="Account access"><p>Join the conversation.</p><Link to="/signup" className="button button--primary button--wide">{t('action.signup')}</Link><Link to="/login" className="guest-signin">{t('action.signin')}</Link></section>}
        </div>
      </aside>
      <main id="main-content" className="main-column"><Outlet /></main>
      <RightRail />
    </div>
    <footer className="mobile-support-footer"><nav aria-label="Information and legal links"><Link to="/factions">Factions</Link><Link to="/about">About</Link><Link to="/help">Help</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/accessibility">Accessibility</Link><Link to="/safety">Safety</Link><Link to="/cookies">Storage notice</Link></nav><div><span>© 2026 ShittyAss.com</span>{user ? <><Link to="/u/me">My profile</Link><LogoutButton className="guest-signin" /></> : <><Link to="/login">Sign in</Link><Link to="/signup">Create account</Link></>}<Link to="/settings">Settings</Link></div></footer>
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      <Link to="/" aria-label="Timeline" aria-current={location.pathname === '/' ? 'page' : undefined} className={`mobile-bottom-link${location.pathname === '/' ? ' is-active' : ''}`}><Home size={19} /><span className="sr-only">Timeline</span></Link>
      <Link to="/explore" aria-label="Explore" aria-current={onExploreRoute ? 'page' : undefined} className={`mobile-bottom-link${onExploreRoute ? ' is-active' : ''}`}><Compass size={19} /><span className="sr-only">Explore</span></Link>
      <Link to="/factions" aria-label="Factions" aria-current={onFactionRoute ? 'page' : undefined} className={`mobile-bottom-link${onFactionRoute ? ' is-active' : ''}`}><UsersRound size={19} /><span className="sr-only">Factions</span></Link>
      <button className="mobile-compose-button" onClick={() => requestSignIn('write a post')} aria-label={t('action.post')}><Plus size={21} /></button>
      <Link to="/notifications" aria-label="Notifications" aria-current={location.pathname === '/notifications' ? 'page' : undefined} className={`mobile-bottom-link${location.pathname === '/notifications' ? ' is-active' : ''}`}><Bell size={19} /><span className="sr-only">Notifications</span></Link>
      <Link to="/u/me" aria-label="My profile" aria-current={location.pathname === '/u/me' ? 'page' : undefined} className={`mobile-bottom-link${location.pathname === '/u/me' ? ' is-active' : ''}`}><CircleUserRound size={19} /><span className="sr-only">My profile</span></Link>
    </nav>
    {mobileMenuOpen && <Dialog title="Navigation" onClose={() => setMobileMenuOpen(false)} size="sm"><MobileNavigation onNavigate={() => setMobileMenuOpen(false)} /></Dialog>}
    <ToastRegion />
  </div>;
}
