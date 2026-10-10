import { useState } from 'react';
import { Bell, Bookmark, CircleUserRound, Compass, Home, LogIn, Menu, MessageCircle, Search, Settings, UsersRound } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useSite } from '../state/SiteContext';
import { useAuth } from '../state/AuthContext';
import { useRailContent } from '../state/useRailContent';
import type { DirectMessagePreview, StoryItem } from '../types';
import type { AccountUser } from '../auth/api';
import { Brand } from './Brand';
import { Avatar } from './Avatar';
import { Dialog } from './Dialog';
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

function RightRail({ stories, dms }: { stories: StoryItem[]; dms: DirectMessagePreview[] }) {
  return <aside className="right-rail" aria-label="Stories and messages">
    {stories.length > 0 && <section className="rail-card rail-stories" aria-label="Stories">
      <div className="rail-heading"><h2>Stories</h2></div>
      <ul className="story-row">
        {stories.map((story) => <li key={story.id}>
          <Link to={`/u/${story.user.handle}`} className={`story-item${story.seen ? ' is-seen' : ''}`}><Avatar user={story.user} size="lg" /><span>{story.user.displayName}</span></Link>
        </li>)}
      </ul>
    </section>}
    {dms.length > 0 && <section className="rail-card rail-messages" aria-label="Messages">
      <div className="rail-heading"><h2>Messages</h2><Link to="/messages" className="rail-more">All</Link></div>
      <ul className="dm-list">
        {dms.map((dm) => <li key={dm.id}>
          <Link to="/messages" className="dm-item"><Avatar user={dm.with} size="sm" /><span className="dm-copy"><strong>{dm.with.displayName}</strong><small>{dm.lastMessage}</small></span>{dm.unread && <span className="dm-unread" aria-label="Unread" />}</Link>
        </li>)}
      </ul>
    </section>}
  </aside>;
}

function ToastRegion() {
  const { toast } = useSite();
  return <div className={`toast-region${toast ? ' toast-region--visible' : ''}`} role="status" aria-live="polite" aria-atomic="true">{toast}</div>;
}

function MobileNavigation({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useLanguage();
  const { user, status } = useAuth();
  return <nav className="mobile-menu-content" aria-label="Site navigation">
    <div className="mobile-menu-links"><NavLinks onNavigate={onNavigate} /><Link className="nav-link" to="/u/me" onClick={onNavigate}><span className="nav-icon-wrap"><CircleUserRound size={19} /></span><span>My profile</span></Link></div>
    <div className="mobile-menu-account">
      {user ? <><p>Signed in as {accountLabel(user)}</p><LogoutButton className="button button--outline" onLoggedOut={onNavigate} /></> : status === 'loading' ? <p role="status">Checking account…</p> : <><Link className="button button--outline" to="/login" onClick={onNavigate}><LogIn size={15} />{t('action.signin')}</Link><Link className="button button--primary" to="/signup" onClick={onNavigate}>{t('action.signup')}</Link></>}
    </div>
    <nav className="mobile-menu-legal" aria-label="Legal and help"><Link to="/about" onClick={onNavigate}>About</Link><Link to="/help" onClick={onNavigate}>Help</Link><Link to="/privacy" onClick={onNavigate}>Privacy</Link><Link to="/terms" onClick={onNavigate}>Terms</Link><Link to="/accessibility" onClick={onNavigate}>Accessibility</Link><Link to="/safety" onClick={onNavigate}>Safety</Link></nav>
  </nav>;
}

export function SiteShell() {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, status } = useAuth();
  const { stories, dms } = useRailContent();
  const hasRail = stories.length > 0 || dms.length > 0;
  const location = useLocation();
  const onFactionRoute = location.pathname.startsWith('/factions');
  const onExploreRoute = location.pathname.startsWith('/explore');
  return <div className="site-shell">
    <header className="mobile-header"><Brand compact /><div className="mobile-header-actions">
      <Link to="/search" className="icon-button mobile-search-toggle" aria-label="Search ShittyAss.com"><Search size={19} /></Link>
      <button className="icon-button mobile-menu-toggle" aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button>
    </div></header>
    <div className={`app-layout${hasRail ? '' : ' app-layout--no-rail'}`}>
      <aside className="left-rail" aria-label="Main navigation">
        <div className="left-rail-top"><Brand /></div>
        <nav className="primary-nav"><NavLinks /></nav>
        <div className="left-rail-bottom">
          <Link to="/u/me" className="profile-link"><CircleUserRound size={18} /><span>My profile</span></Link>
          {user ? <section className="guest-account guest-account--signed-in" aria-label="Account access"><p>Signed in as {accountLabel(user)}</p><LogoutButton className="guest-signin" /></section> : status === 'loading' ? <section className="guest-account" aria-label="Account status"><p role="status">Checking account…</p></section> : <section className="guest-account" aria-label="Account access"><Link to="/signup" className="button button--primary button--wide">{t('action.signup')}</Link><Link to="/login" className="guest-signin">{t('action.signin')}</Link></section>}
          <nav className="left-rail-legal" aria-label="Information and legal links"><Link to="/about">About</Link><Link to="/help">Help</Link><Link to="/safety">Safety</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/accessibility">Accessibility</Link><Link to="/cookies">Storage notice</Link><small>© 2026 ShittyAss.com</small></nav>
        </div>
      </aside>
      <main id="main-content" className="main-column"><Outlet /></main>
      {hasRail && <RightRail stories={stories} dms={dms} />}
    </div>
    <footer className="mobile-support-footer"><nav aria-label="Information and legal links"><Link to="/factions">Factions</Link><Link to="/about">About</Link><Link to="/help">Help</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/accessibility">Accessibility</Link><Link to="/safety">Safety</Link><Link to="/cookies">Storage notice</Link></nav><div><span>© 2026 ShittyAss.com</span>{user ? <><Link to="/u/me">My profile</Link><LogoutButton className="guest-signin" /></> : <><Link to="/login">Sign in</Link><Link to="/signup">Create account</Link></>}<Link to="/settings">Settings</Link></div></footer>
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      <Link to="/" aria-label="Timeline" aria-current={location.pathname === '/' ? 'page' : undefined} className={`mobile-bottom-link${location.pathname === '/' ? ' is-active' : ''}`}><Home size={19} /><span className="sr-only">Timeline</span></Link>
      <Link to="/explore" aria-label="Explore" aria-current={onExploreRoute ? 'page' : undefined} className={`mobile-bottom-link${onExploreRoute ? ' is-active' : ''}`}><Compass size={19} /><span className="sr-only">Explore</span></Link>
      <Link to="/factions" aria-label="Factions" aria-current={onFactionRoute ? 'page' : undefined} className={`mobile-bottom-link${onFactionRoute ? ' is-active' : ''}`}><UsersRound size={19} /><span className="sr-only">Factions</span></Link>
      <Link to="/notifications" aria-label="Notifications" aria-current={location.pathname === '/notifications' ? 'page' : undefined} className={`mobile-bottom-link${location.pathname === '/notifications' ? ' is-active' : ''}`}><Bell size={19} /><span className="sr-only">Notifications</span></Link>
      <Link to="/u/me" aria-label="My profile" aria-current={location.pathname === '/u/me' ? 'page' : undefined} className={`mobile-bottom-link${location.pathname === '/u/me' ? ' is-active' : ''}`}><CircleUserRound size={19} /><span className="sr-only">My profile</span></Link>
    </nav>
    {mobileMenuOpen && <Dialog title="Navigation" onClose={() => setMobileMenuOpen(false)} size="sm"><MobileNavigation onNavigate={() => setMobileMenuOpen(false)} /></Dialog>}
    <ToastRegion />
  </div>;
}
