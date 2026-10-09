import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PostDetailPage() {
  return <div className="page post-detail-page">
    <header className="page-heading"><h1>Post</h1></header>
    <div className="state-card state-card--error"><MessageCircle size={20} /><div><strong>This post cannot be loaded.</strong><p>Public post data is not connected yet.</p><Link to="/explore" className="text-button">Explore public conversations</Link></div></div>
  </div>;
}
