import { useEffect, useState } from 'react';
import { CalendarDays, Link2, MapPin, UserRound } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { EmptyZone } from '../components/EmptyZone';
import { FollowButton } from '../components/FollowButton';
import { SignInGate } from '../components/SignInGate';
import { profileApi, websiteLabel, ProfileApiError } from '../profile/api';
import { useAuth } from '../state/AuthContext';
import { useProfile } from '../state/ProfileContext';
import type { UserProfile } from '../types';

const number = (n = 0) => new Intl.NumberFormat('en', { notation: n >= 10000 ? 'compact' : 'standard' }).format(n);

function MyProfileRedirect() {
  const { status: authStatus } = useAuth();
  const { profile, status } = useProfile();
  if (authStatus === 'loading') return <div className="page"><p className="state-card" role="status">Loading…</p></div>;
  if (authStatus !== 'authenticated') return <SignInGate feature="view your profile" />;
  if (status === 'idle' || status === 'loading') return <div className="page"><p className="state-card" role="status">Loading…</p></div>;
  if (!profile) return <div className="page"><p className="state-card field-error" role="alert">We couldn't load your profile. Try again in a moment.</p></div>;
  return <Navigate to={`/u/${profile.handle}`} replace />;
}

export function ProfilePage() {
  const { handle = '' } = useParams();
  if (['me', 'you'].includes(handle.toLowerCase())) return <MyProfileRedirect />;
  return <PublicProfile key={handle.toLowerCase()} handle={handle} />;
}

function PublicProfile({ handle }: { handle: string }) {
  const { user } = useAuth();
  const [person, setPerson] = useState<UserProfile | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [tab, setTab] = useState<'posts' | 'replies' | 'media'>('posts');

  useEffect(() => {
    let live = true;
    profileApi.get(handle).then((p) => { if (live) { setPerson(p); setState('ready'); } }).catch((cause) => {
      if (live) setState(cause instanceof ProfileApiError && cause.status === 404 ? 'missing' : 'error');
    });
    return () => { live = false; };
  }, [handle, user]);

  if (state === 'loading') return <div className="page profile-page"><p className="state-card" role="status">Loading profile…</p></div>;
  if (state === 'missing' || !person) return <div className="page profile-page">
    <header className="page-heading"><h1>Profile</h1></header>
    <div className="state-card"><UserRound size={21} /><div><strong>This profile doesn't exist or isn't available.</strong><p>Check the spelling of the username, or head back to Explore.</p><Link to="/explore" className="text-button">Back to Explore</Link></div></div>
  </div>;
  if (state === 'error') return <div className="page profile-page"><p className="state-card field-error" role="alert">We couldn't load this profile. Try again in a moment.</p></div>;

  const joined = person.createdAt ? new Date(person.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : '';
  return <div className="page profile-page">
    {person.isSelf && person.status && person.status !== 'active' && <p className="state-card field-error" role="status">Your profile is currently {person.status}. It's hidden from other people and can't be edited.</p>}
    <section className="profile-hero" aria-label={`${person.displayName}'s profile`}>
      <div className={`profile-cover${person.bannerUrl ? ' has-image' : ''}`}>{person.bannerUrl && <img src={person.bannerUrl} alt="" />}</div>
      <div className="profile-avatar-action">
        <Avatar user={person} size="xl" />
        <div className="profile-actions">
          {person.isSelf
            ? <Link to="/settings/profile" className="button button--outline button--small">Edit profile</Link>
            : <FollowButton person={person} onChange={(next) => setPerson(next)} />}
        </div>
      </div>
      <div className="profile-info">
        <div className="profile-name-line"><h2>{person.displayName}</h2></div>
        <div className="profile-handle">@{person.handle}{person.pronouns && <> · {person.pronouns}</>}</div>
        {person.bio && <p className="profile-bio">{person.bio}</p>}
        <div className="profile-details">
          {person.location && <span><MapPin size={12} />{person.location}</span>}
          {person.website && <a href={person.website} target="_blank" rel="nofollow noopener noreferrer ugc"><Link2 size={12} />{websiteLabel(person.website)}</a>}
          {joined && <span><CalendarDays size={12} />Joined {joined}</span>}
        </div>
        <div className="profile-numbers">
          <Link to={`/u/${person.handle}/following`}><strong>{number(person.followingCount)}</strong> Following</Link>
          <Link to={`/u/${person.handle}/followers`}><strong>{number(person.followerCount)}</strong> {person.followerCount === 1 ? 'Follower' : 'Followers'}</Link>
          <span><strong>{number(person.postCount)}</strong> Posts</span>
        </div>
      </div>
      <div className="profile-tabs" role="tablist" aria-label="Profile content">
        {(['posts', 'replies', 'media'] as const).map((key) => <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{key[0].toUpperCase() + key.slice(1)}</button>)}
      </div>
    </section>
    <EmptyZone />
  </div>;
}
