import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Ban, Bot, Hash, Plus, Settings, Shield, SmilePlus, ScrollText, Ticket, Trash2, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useSite } from '../state/SiteContext';
import { SignInGate } from '../components/SignInGate';

export type SettingsSection = 'general' | 'channels' | 'roles' | 'members' | 'bans' | 'invites' | 'moderation' | 'audit-log' | 'emojis' | 'bots';
type DraftChannel = { id: number; name: string; kind: string; category: string; access: string };
type DraftCategory = { id: number; name: string };
type DraftRole = { id: number; name: string; permissions: string[] };

const sectionTitles: Record<SettingsSection, string> = {
  general: 'Faction settings',
  channels: 'Channels',
  roles: 'Roles & permissions',
  members: 'Members & nicknames',
  bans: 'Bans',
  invites: 'Invites',
  moderation: 'Moderation',
  'audit-log': 'Audit log',
  emojis: 'Custom emojis',
  bots: 'Bots',
};

const settingsNav: { section: SettingsSection; label: string; Icon: LucideIcon }[] = [
  { section: 'general', label: 'Overview', Icon: Settings },
  { section: 'channels', label: 'Channels', Icon: Hash },
  { section: 'roles', label: 'Roles & permissions', Icon: Shield },
  { section: 'members', label: 'Members & nicknames', Icon: UsersRound },
  { section: 'bans', label: 'Bans', Icon: Ban },
  { section: 'invites', label: 'Invites', Icon: Ticket },
  { section: 'moderation', label: 'Moderation', Icon: Shield },
  { section: 'audit-log', label: 'Audit log', Icon: ScrollText },
  { section: 'emojis', label: 'Custom emojis', Icon: SmilePlus },
  { section: 'bots', label: 'Bots', Icon: Bot },
];

const permissions = [
  ['view-channels', 'View channels'],
  ['send-messages', 'Send messages and replies'],
  ['attach-media', 'Attach media'],
  ['manage-messages', 'Manage messages'],
  ['manage-channels', 'Create and manage channels'],
  ['manage-members', 'Manage members'],
  ['change-nicknames', 'Change member nicknames'],
  ['kick-members', 'Remove members'],
  ['ban-members', 'Ban members'],
  ['manage-roles', 'Create and manage roles'],
  ['manage-invites', 'Create and revoke invitations'],
  ['view-audit-log', 'View the audit log'],
  ['moderate-content', 'Manage moderation'],
  ['manage-emojis', 'Manage custom emojis'],
  ['manage-settings', 'Manage faction settings'],
] as const;

function saveToAccount(event: FormEvent<HTMLFormElement>, requestSignIn: (action: string) => void, action: string) {
  event.preventDefault();
  requestSignIn(action);
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="faction-admin-empty">{children}</div>;
}

function GeneralSettings() {
  const [discoverability, setDiscoverability] = useState<'public' | 'private'>('public');
  const { requestSignIn } = useSite();
  return <form className="faction-settings-form" onSubmit={(event) => saveToAccount(event, requestSignIn, 'save faction settings')}>
    <section className="faction-admin-section">
      <label className="field-label" htmlFor="settings-faction-name">Name<input id="settings-faction-name" maxLength={64} autoComplete="off" /></label>
      <label className="field-label" htmlFor="settings-faction-description">Description <span className="field-optional">Optional</span><textarea id="settings-faction-description" maxLength={500} rows={4} /></label>
      <fieldset className="faction-discoverability">
        <legend>Discoverability</legend>
        <div className="faction-choice-list">
          <label className={`faction-choice-card${discoverability === 'public' ? ' is-selected' : ''}`}><input type="radio" name="faction-visibility" value="public" checked={discoverability === 'public'} onChange={() => setDiscoverability('public')} /><span><strong>Public</strong><small>People can find this faction in the Factions directory.</small></span></label>
          <label className={`faction-choice-card${discoverability === 'private' ? ' is-selected' : ''}`}><input type="radio" name="faction-visibility" value="private" checked={discoverability === 'private'} onChange={() => setDiscoverability('private')} /><span><strong>Private</strong><small>Hidden from discovery; access is by invitation.</small></span></label>
        </div>
      </fieldset>
    </section>
    <button className="button button--primary" type="submit">Save changes</button>
  </form>;
}

function ChannelSettings() {
  const [categories, setCategories] = useState<DraftCategory[]>([]);
  const [channels, setChannels] = useState<DraftChannel[]>([]);
  const { requestSignIn } = useSite();
  const updateChannel = (id: number, patch: Partial<DraftChannel>) => setChannels((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  return <form className="faction-settings-form" onSubmit={(event) => saveToAccount(event, requestSignIn, 'save channel settings')}>
    <section className="faction-admin-section">
      <div className="faction-admin-heading"><div><h2>Categories</h2></div><button type="button" className="button button--outline button--small" onClick={() => setCategories((items) => [...items, { id: Date.now(), name: '' }])}><Plus size={14} />Add category</button></div>
      {!categories.length && <EmptyState>No categories configured.</EmptyState>}
      {categories.map((category) => <div className="faction-admin-row" key={category.id}><label className="field-label" htmlFor={`category-${category.id}`}>Category name<input id={`category-${category.id}`} value={category.name} onChange={(event) => setCategories((items) => items.map((item) => item.id === category.id ? { ...item, name: event.target.value } : item))} maxLength={64} /></label><button type="button" className="icon-button faction-delete-button" aria-label="Remove category" onClick={() => setCategories((items) => items.filter((item) => item.id !== category.id))}><Trash2 size={16} /></button></div>)}
    </section>
    <section className="faction-admin-section">
      <div className="faction-admin-heading"><div><h2>Channels</h2></div><button type="button" className="button button--outline button--small" onClick={() => setChannels((items) => [...items, { id: Date.now(), name: '', kind: 'text', category: '', access: 'everyone' }])}><Plus size={14} />Add channel</button></div>
      {!channels.length && <EmptyState>No channels configured.</EmptyState>}
      {channels.map((channel, index) => <fieldset className="faction-config-card" key={channel.id}><legend>Channel {index + 1}</legend><div className="faction-config-row"><label className="field-label" htmlFor={`channel-name-${channel.id}`}>Name<input id={`channel-name-${channel.id}`} value={channel.name} onChange={(event) => updateChannel(channel.id, { name: event.target.value })} maxLength={64} /></label><label className="field-label" htmlFor={`channel-type-${channel.id}`}>Type<select id={`channel-type-${channel.id}`} value={channel.kind} onChange={(event) => updateChannel(channel.id, { kind: event.target.value })}><option value="text">Text</option><option value="forum">Forum</option><option value="voice">Voice</option><option value="announcements">Announcements</option></select></label></div><div className="faction-config-row"><label className="field-label" htmlFor={`channel-category-${channel.id}`}>Category<select id={`channel-category-${channel.id}`} value={channel.category} onChange={(event) => updateChannel(channel.id, { category: event.target.value })}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={String(category.id)}>{category.name || 'Unnamed category'}</option>)}</select></label><label className="field-label" htmlFor={`channel-access-${channel.id}`}>Access<select id={`channel-access-${channel.id}`} value={channel.access} onChange={(event) => updateChannel(channel.id, { access: event.target.value })}><option value="everyone">All members</option><option value="selected">Selected roles</option></select></label></div><button type="button" className="text-button faction-remove" onClick={() => setChannels((items) => items.filter((item) => item.id !== channel.id))}><Trash2 size={14} />Remove channel</button></fieldset>)}
    </section>
    <button className="button button--primary" type="submit">Save changes</button>
  </form>;
}

function RoleSettings() {
  const [roles, setRoles] = useState<DraftRole[]>([]);
  const { requestSignIn } = useSite();
  const updateRole = (id: number, patch: Partial<DraftRole>) => setRoles((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  return <form className="faction-settings-form" onSubmit={(event) => saveToAccount(event, requestSignIn, 'save roles and permissions')}>
    <section className="faction-admin-section"><div className="faction-admin-heading"><div><h2>Roles</h2></div><button type="button" className="button button--outline button--small" onClick={() => setRoles((items) => [...items, { id: Date.now(), name: '', permissions: [] }])}><Plus size={14} />Add role</button></div>
      {!roles.length && <EmptyState>No custom roles configured.</EmptyState>}
      {roles.map((role, index) => <fieldset className="faction-config-card" key={role.id}><legend>Role {index + 1}</legend><label className="field-label" htmlFor={`role-name-${role.id}`}>Role name<input id={`role-name-${role.id}`} value={role.name} onChange={(event) => updateRole(role.id, { name: event.target.value })} maxLength={48} /></label><div className="permission-list">{permissions.map(([key, label]) => <label className="permission-option" key={key}><input type="checkbox" checked={role.permissions.includes(key)} onChange={(event) => updateRole(role.id, { permissions: event.target.checked ? [...role.permissions, key] : role.permissions.filter((value) => value !== key) })} /><span>{label}</span></label>)}</div><button type="button" className="text-button faction-remove" onClick={() => setRoles((items) => items.filter((item) => item.id !== role.id))}><Trash2 size={14} />Remove role</button></fieldset>)}
    </section>
    <button className="button button--primary" type="submit">Save roles</button>
  </form>;
}

function MemberSettings() {
  const { requestSignIn } = useSite();
  return <div className="faction-settings-form">
    <section className="faction-admin-section"><h2>Members</h2><EmptyState>Faction members will appear here when the member service is connected.</EmptyState></section>
    <form className="faction-admin-section" onSubmit={(event) => saveToAccount(event, requestSignIn, 'change a member nickname')}><h2>Change a nickname</h2><label className="field-label" htmlFor="nickname-member">Member username<input id="nickname-member" autoComplete="off" required /></label><label className="field-label" htmlFor="nickname-value">Faction nickname<input id="nickname-value" maxLength={64} /></label><button className="button button--outline" type="submit">Save nickname</button></form>
  </div>;
}

function BanSettings() {
  const { requestSignIn } = useSite();
  return <div className="faction-settings-form">
    <section className="faction-admin-section"><h2>Ban list</h2><EmptyState>No ban records are available until faction moderation is connected.</EmptyState></section>
    <form className="faction-admin-section" onSubmit={(event) => saveToAccount(event, requestSignIn, 'ban a faction member')}><h2>Ban a member</h2><label className="field-label" htmlFor="ban-member">Member username<input id="ban-member" autoComplete="off" required /></label><label className="field-label" htmlFor="ban-reason">Reason<textarea id="ban-reason" rows={3} maxLength={500} /></label><label className="field-label" htmlFor="ban-duration">Duration<select id="ban-duration" defaultValue="permanent"><option value="permanent">Permanent</option><option value="one-day">One day</option><option value="seven-days">Seven days</option><option value="thirty-days">Thirty days</option></select></label><button className="button button--primary" type="submit">Ban member</button></form>
  </div>;
}

function InviteSettings() {
  const { requestSignIn } = useSite();
  return <form className="faction-settings-form" onSubmit={(event) => saveToAccount(event, requestSignIn, 'create a faction invitation')}>
    <section className="faction-admin-section"><h2>Invitation settings</h2><label className="field-label" htmlFor="invite-expiry">Invitation expires<select id="invite-expiry" defaultValue=""><option value="" disabled>Select an expiration</option><option value="one-hour">After one hour</option><option value="one-day">After one day</option><option value="one-week">After one week</option><option value="never">Never</option></select></label><label className="field-label" htmlFor="invite-uses">Maximum uses<select id="invite-uses" defaultValue=""><option value="" disabled>Select a limit</option><option value="one">One use</option><option value="five">Five uses</option><option value="ten">Ten uses</option><option value="unlimited">Unlimited</option></select></label><button className="button button--primary" type="submit">Create invitation</button></section>
    <section className="faction-admin-section"><h2>Active invitations</h2><EmptyState>No invitation links are available.</EmptyState></section>
  </form>;
}

function ModerationSettings() {
  const { requestSignIn } = useSite();
  return <form className="faction-settings-form" onSubmit={(event) => saveToAccount(event, requestSignIn, 'save moderation settings')}>
    <section className="faction-admin-section"><h2>Moderation controls</h2><label className="permission-option"><input type="checkbox" /><span>Require moderator review for reported content</span></label><label className="permission-option"><input type="checkbox" /><span>Limit repeated posts and replies</span></label><label className="permission-option"><input type="checkbox" /><span>Restrict new-member posting until approved</span></label><label className="field-label" htmlFor="moderation-filter">Blocked terms<textarea id="moderation-filter" rows={4} aria-describedby="blocked-terms-help" /></label><p className="faction-field-help" id="blocked-terms-help">Separate entries with a new line.</p><button className="button button--primary" type="submit">Save moderation settings</button></section>
  </form>;
}

function AuditLogSettings() {
  return <div className="faction-settings-form">
    <section className="faction-admin-section"><h2>Filter audit events</h2><div className="faction-config-row"><label className="field-label" htmlFor="audit-event-filter">Event type<select id="audit-event-filter" defaultValue="all"><option value="all">All event types</option><option value="member">Member changes</option><option value="channel">Channel changes</option><option value="role">Role and permission changes</option><option value="moderation">Moderation actions</option><option value="invite">Invitation changes</option></select></label><label className="field-label" htmlFor="audit-date-filter">Time period<select id="audit-date-filter" defaultValue="all"><option value="all">Any time</option><option value="day">Past day</option><option value="week">Past week</option><option value="month">Past month</option></select></label></div><EmptyState>Audit history will appear here when faction logging is connected.</EmptyState></section>
  </div>;
}

function EmojiSettings() {
  const { requestSignIn } = useSite();
  return <div className="faction-settings-form"><section className="faction-admin-section"><h2>Custom emojis</h2><EmptyState>No custom emojis are available.</EmptyState><form className="faction-emoji-form" onSubmit={(event) => saveToAccount(event, requestSignIn, 'add a custom emoji')}><label className="field-label" htmlFor="emoji-file">Add an emoji image<input id="emoji-file" type="file" accept="image/png,image/webp,image/gif" /></label><label className="field-label" htmlFor="emoji-name">Emoji name<input id="emoji-name" autoComplete="off" maxLength={32} /></label><button className="button button--outline" type="submit">Add custom emoji</button></form></section></div>;
}

function BotComingSoon() {
  return <div className="faction-coming-soon"><span className="faction-coming-soon-icon"><Bot size={24} /></span><span className="faction-coming-soon-badge">Coming soon</span><p>Faction bots are not available yet. Future bots will be code-based, including Python, and will join a faction by invitation. Bot setup and developer tools are not available yet.</p></div>;
}

export function FactionSettingsPage({ section }: { section: SettingsSection }) {
  const { slug = '' } = useParams();
  const base = `/factions/${encodeURIComponent(slug)}/settings`;
  const currentTitle = sectionTitles[section];
  const activeHref = section === 'general' ? base : `${base}/${section}`;
  const contents: Record<SettingsSection, ReactNode> = {
    general: <GeneralSettings />,
    channels: <ChannelSettings />,
    roles: <RoleSettings />,
    members: <MemberSettings />,
    bans: <BanSettings />,
    invites: <InviteSettings />,
    moderation: <ModerationSettings />,
    'audit-log': <AuditLogSettings />,
    emojis: <EmojiSettings />,
    bots: <BotComingSoon />,
  };
  return <SignInGate feature={`manage ${currentTitle.toLowerCase()}`} description="Faction settings require a faction service, which is not connected yet; changes are not saved."><div className="page faction-page faction-settings-page">
    <header className="page-heading"><h1>{currentTitle}</h1></header>
    <div className="faction-settings-layout">
      <aside className="faction-settings-sidebar">
        <Link className="faction-settings-back" to={`/factions/${encodeURIComponent(slug)}`}><ArrowLeft size={15} />Faction</Link>
        <nav className="faction-settings-nav" aria-label="Faction settings">
          {settingsNav.map(({ section: item, label, Icon }) => {
            const href = item === 'general' ? base : `${base}/${item}`;
            return <Link key={item} to={href} aria-current={href === activeHref ? 'page' : undefined}><Icon size={16} /><span>{label}</span></Link>;
          })}
        </nav>
      </aside>
      <section className="faction-settings-content" aria-label={currentTitle}>{contents[section]}</section>
    </div>
  </div></SignInGate>;
}
