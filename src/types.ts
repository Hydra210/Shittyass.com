export type UserProfile = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt?: string;
  verified?: boolean;
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
