import { useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { EmptyZone } from '../components/EmptyZone';
import { PersonRow } from '../components/PersonRow';
import { profileApi } from '../profile/api';
import type { UserProfile } from '../types';

// Searches people (and, later, posts) on ShittyAss.com. Factions are never included here;
// the Factions page has its own dedicated search.
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(urlQuery);
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => { setQuery(urlQuery); }, [urlQuery]);

  useEffect(() => {
    let live = true;
    if (urlQuery.trim().length < 2) { setPeople([]); setState('idle'); return; }
    setState('loading');
    profileApi.search(urlQuery.trim()).then((r) => { if (live) { setPeople(r.people); setState('done'); } }).catch(() => { if (live) setState('error'); });
    return () => { live = false; };
  }, [urlQuery]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    setSearchParams(value ? { q: value } : {});
  };

  return <div className="page search-page">
    <header className="page-heading"><h1>Search</h1></header>
    <form className="explore-search" onSubmit={submit} role="search">
      <Search size={18} aria-hidden="true" />
      <label className="sr-only" htmlFor="site-search">Search ShittyAss.com</label>
      <input id="site-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ShittyAss.com" autoFocus autoComplete="off" />
      <button className="button button--primary button--small" type="submit">Search</button>
    </form>
    {state === 'loading' && <p className="state-card" role="status">Searching…</p>}
    {state === 'error' && <p className="state-card field-error" role="alert">Search isn't working right now. Try again in a moment.</p>}
    {state === 'done' && people.length > 0 && <><h2 className="search-heading">People</h2><ul className="people-list">{people.map((p) => <PersonRow key={p.id} person={p} />)}</ul></>}
    {(state === 'idle' || (state === 'done' && people.length === 0)) && <EmptyZone />}
  </div>;
}
