import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyZone } from '../components/EmptyZone';
import { PersonRow } from '../components/PersonRow';
import { profileApi, ProfileApiError } from '../profile/api';
import type { UserProfile } from '../types';

export function FollowListPage({ kind }: { kind: 'followers' | 'following' }) {
  const { handle = '' } = useParams();
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let live = true;
    setState('loading'); setPeople([]);
    profileApi.people(handle, kind).then((page) => { if (live) { setPeople(page.people); setNext(page.nextOffset); setState('ready'); } })
      .catch((cause) => { if (live) setState(cause instanceof ProfileApiError && cause.status === 404 ? 'missing' : 'error'); });
    return () => { live = false; };
  }, [handle, kind]);

  const more = async () => {
    if (next === null) return;
    setLoadingMore(true);
    try { const page = await profileApi.people(handle, kind, next); setPeople((p) => [...p, ...page.people]); setNext(page.nextOffset); }
    catch { setState('error'); }
    finally { setLoadingMore(false); }
  };

  return <div className="page follow-page">
    <Link className="back-link" to={`/u/${handle}`}><ChevronLeft size={14} />@{handle}</Link>
    <header className="page-heading"><h1>{kind === 'followers' ? 'Followers' : 'Following'}</h1></header>
    {state === 'loading' && <p className="state-card" role="status">Loading…</p>}
    {state === 'missing' && <p className="state-card">This profile doesn't exist or isn't available.</p>}
    {state === 'error' && <p className="state-card field-error" role="alert">Something went wrong loading this list.</p>}
    {state === 'ready' && (people.length === 0 ? <EmptyZone /> : <ul className="people-list">{people.map((p) => <PersonRow key={p.id} person={p} />)}</ul>)}
    {state === 'ready' && next !== null && <div className="form-actions"><button className="button button--outline" onClick={() => void more()} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Show more'}</button></div>}
  </div>;
}
