import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../types';
import { Avatar } from './Avatar';
import { FollowButton } from './FollowButton';

export function PersonRow({ person: initial }: { person: UserProfile }) {
  const [person, setPerson] = useState(initial);
  return <li className="person-row">
    <Link to={`/u/${person.handle}`} className="person-main">
      <Avatar user={person} size="md" />
      <span className="person-copy"><strong>{person.displayName}</strong><small>@{person.handle}</small>{person.bio && <em>{person.bio}</em>}</span>
    </Link>
    {!person.isSelf && <FollowButton person={person} onChange={(next) => setPerson({ ...person, isFollowing: next.isFollowing })} />}
  </li>;
}
