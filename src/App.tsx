import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { SiteShell } from './components/SiteShell';
import { FeedPage } from './pages/FeedPage';
import { ExplorePage } from './pages/ExplorePage';
import { FactionBuilderPage, FactionChannelPage, FactionDirectoryPage, FactionPage } from './pages/FactionPages';
import { FactionSettingsPage, type SettingsSection } from './pages/FactionSettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { BookmarksPage, MessagesPage, NotificationsPage } from './pages/ActivityPages';
import { SettingsPage } from './pages/SettingsPage';
import { ConfirmEmailPage, ForgotPasswordPage, LoginPage, SignupPage } from './pages/AuthPages';
import { AboutPage, AccessibilityPage, CookiePreferencesPage, HelpPage, NotFoundPage, PrivacyPolicyPage, SafetyPage, TermsPage } from './pages/LegalPages';

const factionSectionTitles: Record<string, { title: string; section: SettingsSection }> = {
  channels: { title: 'Channels', section: 'channels' },
  roles: { title: 'Roles & permissions', section: 'roles' },
  members: { title: 'Members & nicknames', section: 'members' },
  bans: { title: 'Bans', section: 'bans' },
  invites: { title: 'Invites', section: 'invites' },
  moderation: { title: 'Moderation', section: 'moderation' },
  'audit-log': { title: 'Audit log', section: 'audit-log' },
  emojis: { title: 'Custom emojis', section: 'emojis' },
  bots: { title: 'Bots', section: 'bots' },
};

function PageTitle() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/': 'Timeline', '/explore': 'Explore', '/search': 'Search', '/factions': 'Factions', '/factions/create': 'Create a faction',
      '/notifications': 'Notifications', '/messages': 'Messages', '/bookmarks': 'Bookmarks', '/settings': 'Settings',
      '/login': 'Sign in', '/signup': 'Create account', '/forgot-password': 'Reset password', '/confirm-email': 'Confirm email',
      '/about': 'About ShittyAss.com', '/help': 'Help & support', '/privacy': 'Privacy notice', '/terms': 'Terms of service',
      '/accessibility': 'Accessibility', '/safety': 'Safety & community standards', '/cookies': 'Cookie and storage notice',
    };
    let routeTitle = titles[path];
    if (!routeTitle && path.startsWith('/factions/')) {
      const settingSuffix = path.match(/\/settings(?:\/([^/]+))?$/)?.[1];
      routeTitle = settingSuffix ? factionSectionTitles[settingSuffix]?.title ?? 'Faction settings'
        : path.endsWith('/settings') ? 'Faction settings'
          : path.includes('/channels/') ? 'Channel' : 'Faction';
    }
    routeTitle ??= path.startsWith('/u/') ? 'Profile' : path.startsWith('/post/') ? 'Post' : 'Not found';
    document.title = `${routeTitle} · ShittyAss.com`;
  }, [location.pathname]);
  return null;
}

export default function App() {
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <PageTitle />
    <Routes>
      <Route element={<SiteShell />}>
        <Route path="/" element={<FeedPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/search" element={<ExplorePage />} />
        <Route path="/factions" element={<FactionDirectoryPage />} />
        <Route path="/factions/create" element={<FactionBuilderPage />} />
        <Route path="/factions/:slug/settings/channels" element={<FactionSettingsPage section="channels" />} />
        <Route path="/factions/:slug/settings/roles" element={<FactionSettingsPage section="roles" />} />
        <Route path="/factions/:slug/settings/members" element={<FactionSettingsPage section="members" />} />
        <Route path="/factions/:slug/settings/bans" element={<FactionSettingsPage section="bans" />} />
        <Route path="/factions/:slug/settings/invites" element={<FactionSettingsPage section="invites" />} />
        <Route path="/factions/:slug/settings/moderation" element={<FactionSettingsPage section="moderation" />} />
        <Route path="/factions/:slug/settings/audit-log" element={<FactionSettingsPage section="audit-log" />} />
        <Route path="/factions/:slug/settings/emojis" element={<FactionSettingsPage section="emojis" />} />
        <Route path="/factions/:slug/settings/bots" element={<FactionSettingsPage section="bots" />} />
        <Route path="/factions/:slug/settings" element={<FactionSettingsPage section="general" />} />
        <Route path="/factions/:slug/channels/:channelId" element={<FactionChannelPage />} />
        <Route path="/factions/:slug" element={<FactionPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/u/:handle" element={<ProfilePage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/cookies" element={<CookiePreferencesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
    </Routes>
  </>;
}
