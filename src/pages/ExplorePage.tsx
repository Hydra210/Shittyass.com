import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const searched = Boolean(initialQuery.trim());

  useEffect(() => { setQuery(initialQuery); }, [initialQuery]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) setSearchParams({ q: value });
    else setSearchParams({});
  };

  return <div className="page explore-page">
    <header className="page-heading"><h1>{searched ? 'Search' : 'Explore'}</h1></header>
    <form className="explore-search" onSubmit={submitSearch} role="search"><Search size={18} aria-hidden="true" /><label className="sr-only" htmlFor="explore-query">Search public posts and profiles</label><input id="explore-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search public posts and profiles" /><button className="button button--primary button--small" type="submit">Search</button></form>
    <div className="state-card state-card--empty-search"><Search size={21} /><div><strong>{searched ? 'No public results are available yet.' : 'Public conversations will appear here.'}</strong><p>Search and discovery will show real posts and profiles once the content service is connected.</p>{searched ? <button className="text-button" onClick={() => { setQuery(''); setSearchParams({}); }}>Clear search <ArrowRight size={14} /></button> : <Link to="/signup" className="text-button">Create an account <ArrowRight size={14} /></Link>}</div></div>
  </div>;
}
