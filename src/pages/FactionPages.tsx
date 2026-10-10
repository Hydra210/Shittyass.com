import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Hash, Plus, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyZone } from '../components/EmptyZone';
import { useSite } from '../state/SiteContext';
import { useAuth } from '../state/AuthContext';

function Page({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return <div className={`page faction-page ${className}`}>
    <header className="page-heading"><h1>{title}</h1></header>
    {children}
  </div>;
}

export function FactionDirectoryPage() {
  const [query, setQuery] = useState('');
  return <Page title="Factions" className="faction-directory-page">
    <div className="faction-directory-tools">
      <label className="faction-search" htmlFor="faction-search"><UsersRound size={18} /><span className="sr-only">Search factions</span><input id="faction-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search factions" /></label>
      <Link to="/factions/create" className="button button--primary"><Plus size={16} />Create a faction</Link>
    </div>
    <EmptyZone />
  </Page>;
}

export function FactionBuilderPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discoverability, setDiscoverability] = useState<'public' | 'private'>('public');
  const [error, setError] = useState('');
  const { requestSignIn } = useSite();
  const { user } = useAuth();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Enter a faction name.');
      return;
    }
    setError('');
    requestSignIn('create a faction');
  };

  return <Page title="Create a faction" className="faction-builder-page">
    <form className="faction-create-form" onSubmit={submit}>
      <section className="faction-builder-section" aria-label="Faction details">
        <label className="field-label" htmlFor="faction-name">Name<input id="faction-name" name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={64} autoComplete="off" required /></label>
        <label className="field-label" htmlFor="faction-description">Description <span className="field-optional">Optional</span><textarea id="faction-description" name="description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} /></label>
        <fieldset className="faction-discoverability">
          <legend>Discoverability</legend>
          <div className="faction-choice-list">
            <label className={`faction-choice-card${discoverability === 'public' ? ' is-selected' : ''}`}>
              <input type="radio" name="discoverability" value="public" checked={discoverability === 'public'} onChange={() => setDiscoverability('public')} />
              <span><strong>Public</strong><small>People can find this faction in the Factions directory.</small></span>
            </label>
            <label className={`faction-choice-card${discoverability === 'private' ? ' is-selected' : ''}`}>
              <input type="radio" name="discoverability" value="private" checked={discoverability === 'private'} onChange={() => setDiscoverability('private')} />
              <span><strong>Private</strong><small>Hidden from discovery; access is by invitation.</small></span>
            </label>
          </div>
        </fieldset>
      </section>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="faction-create-actions">
        <p>{user ? 'Faction creation is not connected yet; this form will not save a faction.' : 'Any account can create a faction. Sign in to continue.'}</p>
        <button type="submit" className="button button--primary">Create faction <ArrowRight size={15} /></button>
      </div>
    </form>
  </Page>;
}

export function FactionPage() {
  const { slug = '' } = useParams();
  const settings = `/factions/${encodeURIComponent(slug)}/settings`;
  return <Page title="Faction" className="faction-detail-page">
    <div className="state-card faction-empty">
      <UsersRound size={21} />
      <div>
        <strong>Faction details are unavailable.</strong>
        <p>Faction content will appear here when the community service is connected.</p>
        <div className="faction-empty-actions"><Link to={settings} className="text-button">Faction settings <ArrowRight size={14} /></Link><Link to="/factions" className="text-button">Browse factions <ArrowRight size={14} /></Link></div>
      </div>
    </div>
  </Page>;
}

export function FactionChannelPage() {
  const { slug = '' } = useParams();
  const settings = `/factions/${encodeURIComponent(slug)}/settings/channels`;
  return <Page title="Channel" className="faction-channel-page">
    <div className="state-card faction-empty">
      <Hash size={21} />
      <div>
        <strong>Channel content is unavailable.</strong>
        <p>Channel posts will appear here when faction services are connected.</p>
        <div className="faction-empty-actions"><Link to={settings} className="text-button">Channel settings <ArrowRight size={14} /></Link><Link to="/factions" className="text-button">Browse factions <ArrowRight size={14} /></Link></div>
      </div>
    </div>
  </Page>;
}
