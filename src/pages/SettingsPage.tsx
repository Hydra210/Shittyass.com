import { useState, type ComponentType } from 'react';
import { Bell, ChevronRight, Languages, LockKeyhole, Settings, Type, UserRound, Waves } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignInGate } from '../components/SignInGate';
import { useLanguage } from '../i18n/LanguageContext';
import { useSite } from '../state/SiteContext';
import { useAuth } from '../state/AuthContext';
import { LogoutButton } from '../components/LogoutButton';

type SettingIcon = ComponentType<LucideProps>;
function ToggleRow({ title, description, checked, onChange, icon: Icon }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void; icon: SettingIcon }) {
  return <label className="setting-row"><span className="setting-icon"><Icon size={17} /></span><span className="setting-copy"><strong>{title}</strong><small>{description}</small></span><input className="switch-input" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} role="switch" aria-label={title} /></label>;
}

export function SettingsPage() {
  const [section, setSection] = useState<'experience' | 'account' | 'privacy' | 'notifications'>('experience');
  const { language, setLanguage, t } = useLanguage();
  const { preferences, updatePreferences } = useSite();
  const { user } = useAuth();
  const sections = [
    { id: 'experience' as const, label: 'Experience', icon: Settings },
    { id: 'account' as const, label: 'Account', icon: UserRound },
    { id: 'privacy' as const, label: 'Privacy', icon: LockKeyhole },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];
  return <div className="page settings-page"><header className="page-heading"><h1>{t('nav.settings')}</h1></header>
    <div className="settings-layout"><nav className="settings-nav" aria-label="Settings sections">{sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={section === id ? 'is-active' : ''} onClick={() => setSection(id)} aria-current={section === id ? 'page' : undefined}><Icon size={16} />{label}<ChevronRight size={15} /></button>)}</nav>
      <section className="settings-content" aria-live="polite">
        {section === 'experience' && <><div className="section-heading"><div><span className="eyebrow">Interface preferences</span><h2><Settings size={18} /> Experience</h2></div></div><label className="setting-row"><span className="setting-icon"><Languages size={17} /></span><span className="setting-copy"><strong>Display language</strong><small>Choose the language for shared navigation and interface controls.</small></span><select className="setting-select" value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} aria-label="Display language"><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option></select></label><ToggleRow icon={Type} title="Larger text" description="Increase reading size across the interface." checked={preferences.largeText} onChange={(checked) => updatePreferences({ largeText: checked })} /><ToggleRow icon={Waves} title="Reduce motion" description="Minimize transitions and decorative movement." checked={preferences.reduceMotion} onChange={(checked) => updatePreferences({ reduceMotion: checked })} /><ToggleRow icon={Settings} title="Compact layout" description="Use tighter spacing across content panels." checked={preferences.compactView} onChange={(checked) => updatePreferences({ compactView: checked })} /><div className="settings-inline-note"><LockKeyhole size={16} /><span>Language and display preferences are stored in this browser only.</span></div></>}
        {section === 'account' && <><div className="section-heading"><div><span className="eyebrow">Account access</span><h2><UserRound size={18} /> Account</h2></div></div><SignInGate feature="manage your account" description="Profile editing is not included in the connected account endpoints yet.">{user && <div className="settings-inline-note"><span><strong>{user.display_name || user.name || user.username || user.email || 'Signed in'}</strong>{user.email && <><br />{user.email}</>}<br />Authentication is active. Profile editing is not connected yet.</span><LogoutButton className="button button--outline" /></div>}</SignInGate>{!user && <div className="settings-link-list"><Link to="/login"><span><strong>Sign in</strong><small>Use your email address and password.</small></span><ChevronRight size={16} /></Link><Link to="/signup"><span><strong>Create an account</strong><small>Set up your account credentials.</small></span><ChevronRight size={16} /></Link></div>}</>}
        {section === 'privacy' && <><div className="section-heading"><div><span className="eyebrow">Policies and controls</span><h2><LockKeyhole size={18} /> Privacy &amp; safety</h2></div></div><p className="settings-intro">Review the current privacy, service terms and safety information.</p><div className="settings-link-list"><Link to="/privacy"><span><strong>Privacy notice</strong><small>Current data and storage practices.</small></span><ChevronRight size={16} /></Link><Link to="/cookies"><span><strong>Cookie and storage notice</strong><small>Local preferences and browser storage.</small></span><ChevronRight size={16} /></Link><Link to="/terms"><span><strong>Terms of service</strong><small>Service rules and launch requirements.</small></span><ChevronRight size={16} /></Link><Link to="/safety"><span><strong>Community standards</strong><small>Safety, respectful discussion and reporting.</small></span><ChevronRight size={16} /></Link></div></>}
        {section === 'notifications' && <><div className="section-heading"><div><span className="eyebrow">Account activity</span><h2><Bell size={18} /> Notifications</h2></div></div><SignInGate feature="manage notification settings" description="Sign in to manage account notifications when that service is available." /></>}
      </section></div>
  </div>;
}
