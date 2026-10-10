import { useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { EmptyZone } from '../components/EmptyZone';

// Searches content on ShittyAss.com. Factions are never included here;
// the Factions page has its own dedicated search.
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => { setQuery(urlQuery); }, [urlQuery]);

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
    <EmptyZone />
  </div>;
}
