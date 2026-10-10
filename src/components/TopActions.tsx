import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Top-of-page actions: search icon (goes to /search) and the square post button.
 *  The post button is a placeholder for now; clicking it does nothing yet. */
export function TopActions() {
  return <div className="top-actions">
    <Link to="/search" className="icon-button page-search-link" aria-label="Search ShittyAss.com" title="Search"><Search size={20} /></Link>
    <button type="button" className="post-square-button" aria-label="Create a post" title="Posting isn't available yet"><Plus size={22} /></button>
  </div>;
}
