export type UserProfile = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string;
  location?: string;
  website?: string;
  pronouns?: string;
  createdAt?: string;
  verified?: boolean;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  isSelf?: boolean;
  isFollowing?: boolean;
  status?: 'active' | 'suspended' | 'banned';
  usernameChangeAvailableAt?: string | null;
};

export type Post = {
  id: string;
  author: UserProfile;
  body: string;
  createdAt: string;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  viewCount?: number;
  pinned?: boolean;
  media?: Array<{ url: string; alt: string }>;
};

export type UiPreferences = {
  largeText: boolean;
  reduceMotion: boolean;
  compactView: boolean;
};

export type StoryItem = {
  id: string;
  user: UserProfile;
  seen?: boolean;
};

export type DirectMessagePreview = {
  id: string;
  with: UserProfile;
  lastMessage: string;
  sentAt: string;
  unread?: boolean;
};
