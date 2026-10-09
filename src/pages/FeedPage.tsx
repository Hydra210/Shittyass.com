import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Composer } from '../components/Composer';
import { SignInGate } from '../components/SignInGate';
import { useLanguage } from '../i18n/LanguageContext';

export function FeedPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'for-you' | 'following'>('for-you');

  return <div className="page feed-page">
    <header className="page-heading"><h1>{t('feed.title')}</h1></header>
    <div className="feed-tabs" role="tablist" aria-label="Timeline feed">
      <button role="tab" id="feed-tab-for-you" aria-controls="feed-panel" aria-selected={tab === 'for-you'} className={tab === 'for-you' ? 'is-active' : ''} onClick={() => setTab('for-you')}>{t('feed.forYou')}</button>
      <button role="tab" id="feed-tab-following" aria-controls="feed-panel" aria-selected={tab === 'following'} className={tab === 'following' ? 'is-active' : ''} onClick={() => setTab('following')}>{t('feed.following')}</button>
    </div>
    <section id="feed-panel" role="tabpanel" aria-labelledby={tab === 'for-you' ? 'feed-tab-for-you' : 'feed-tab-following'}>
      {tab === 'following' ? <SignInGate feature="view your following timeline" /> : <>
        <Composer />
        <div className="state-card state-card--timeline"><MessageCircle size={21} /><div><strong>No posts are available yet.</strong><p>Public conversations will appear here when posting is connected.</p><Link to="/signup" className="text-button">Create an account</Link></div></div>
      </>}
    </section>
  </div>;
}
