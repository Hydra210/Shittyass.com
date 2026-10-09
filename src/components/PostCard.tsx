import { useRef, useState } from 'react';
import { BadgeCheck, Bookmark, Eye, Heart, MessageCircle, MoreHorizontal, Repeat2, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '../types';
import { useSite } from '../state/SiteContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Avatar } from './Avatar';

function countLabel(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace('.0', '')}K`;
  return String(value);
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function PostCard({ post, thread = false }: { post: Post; thread?: boolean }) {
  const { requestSignIn, flash } = useSite();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const postUrl = `/post/${encodeURIComponent(post.id)}`;

  const sharePost = async () => {
    const url = `${window.location.origin}${postUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      flash('Post link copied.');
    } catch {
      flash(url);
    }
  };

  return <article className={`post-card${thread ? ' post-card--thread' : ''}`}>
    {post.pinned && <div className="post-pinned"><span className="pin-dot" /> Pinned post</div>}
    <div className="post-main-row">
      <Link to={`/u/${encodeURIComponent(post.author.handle)}`} className="post-avatar-link" aria-label={`View ${post.author.displayName}'s profile`}><Avatar user={post.author} /></Link>
      <div className="post-body">
        <header className="post-meta">
          <Link to={`/u/${encodeURIComponent(post.author.handle)}`} className="post-author">{post.author.displayName}{post.author.verified && <BadgeCheck size={15} className="verified-icon" aria-label="Verified account" />}</Link>
          <Link to={`/u/${encodeURIComponent(post.author.handle)}`} className="post-handle">@{post.author.handle}</Link>
          <span className="meta-dot" aria-hidden="true">·</span>
          <Link to={postUrl} className="post-time"><time dateTime={post.createdAt}>{dateLabel(post.createdAt)}</time></Link>
          <div className="post-menu-wrap" onKeyDown={(event) => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuTriggerRef.current?.focus(); } }}>
            <button ref={menuTriggerRef} className="icon-button post-more" aria-label="More post options" aria-expanded={menuOpen} aria-controls={`post-options-${post.id}`} onClick={() => setMenuOpen((open) => !open)}><MoreHorizontal size={19} /></button>
            <div id={`post-options-${post.id}`} className="post-menu" role="group" aria-label="Post options" hidden={!menuOpen} onBlur={(event) => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false); }}>
              <button type="button" onClick={() => { setMenuOpen(false); requestSignIn(`follow @${post.author.handle}`); }}>Follow @{post.author.handle}</button>
              <button type="button" onClick={() => { setMenuOpen(false); requestSignIn('bookmark this post'); }}>Save post</button>
              <button type="button" onClick={() => { setMenuOpen(false); requestSignIn('report this post'); }}>Report post</button>
            </div>
          </div>
        </header>
        <Link to={postUrl} className="post-text-link"><p className="post-text">{post.body}</p></Link>
        {post.media?.map((media) => <img key={media.url} className="post-media" src={media.url} alt={media.alt} loading="lazy" />)}
        {typeof post.viewCount === 'number' && <div className="post-stats"><span><Eye size={13} /> {countLabel(post.viewCount)} views</span></div>}
        <div className="post-actions" aria-label="Post actions">
          <button type="button" className="post-action" onClick={() => requestSignIn('reply to this post')} aria-label={`${t('feed.reply')}, ${countLabel(post.replyCount)} replies`}><MessageCircle size={17} /><span>{countLabel(post.replyCount)}</span></button>
          <button type="button" className="post-action" onClick={() => requestSignIn('repost this post')} aria-label={`${t('feed.repost')}, ${countLabel(post.repostCount)} reposts`}><Repeat2 size={17} /><span>{countLabel(post.repostCount)}</span></button>
          <button type="button" className="post-action" onClick={() => requestSignIn('like this post')} aria-label={`${t('feed.like')}, ${countLabel(post.likeCount)} likes`}><Heart size={17} /><span>{countLabel(post.likeCount)}</span></button>
          <button type="button" className="post-action post-action--bookmark" onClick={() => requestSignIn('bookmark this post')} aria-label={t('feed.bookmark')}><Bookmark size={17} /></button>
          <button type="button" className="post-action post-action--share" onClick={sharePost} aria-label={t('feed.share')}><Share2 size={17} /></button>
        </div>
      </div>
    </div>
  </article>;
}
