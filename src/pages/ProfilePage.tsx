import { useParams } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { SignInGate } from '../components/SignInGate';
import { Link } from 'react-router-dom';

export function ProfilePage() {
  const { handle = '' } = useParams();
  const isOwnProfile = handle.toLowerCase() === 'me' || handle.toLowerCase() === 'you';

  if (isOwnProfile) return <SignInGate feature="view your profile" description="Profile details and posts will appear when the profile and social services are connected." />;

  return <div className="page profile-page">
    <header className="page-heading"><h1>Profile</h1></header>
    <div className="state-card"><UserRound size={21} /><div><strong>Profile data is not available.</strong><p>Public profile information will appear when account and content services are connected.</p><Link to="/explore" className="text-button">Back to Explore</Link></div></div>
  </div>;
}
