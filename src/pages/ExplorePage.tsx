import { EmptyZone } from '../components/EmptyZone';
import { TopActions } from '../components/TopActions';

// Explore is the short-video style discovery feed (not called "Reels").
// Factions never appear here; they have their own directory and search.
export function ExplorePage() {
  return <div className="page explore-page">
    <header className="page-heading page-heading--row"><h1>Explore</h1><TopActions /></header>
    <EmptyZone />
  </div>;
}
