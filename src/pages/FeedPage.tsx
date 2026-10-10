import { useState } from 'react';
import { EmptyZone } from '../components/EmptyZone';
import { TopActions } from '../components/TopActions';
import { SignInGate } from '../components/SignInGate';
import { useLanguage } from '../i18n/LanguageContext';

export function FeedPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<'for-you' | 'following'>('for-you');

  return <div className="page feed-page">
    <header className="page-heading page-heading--row"><h1>{t('feed.title')}</h1><TopActions /></header>
    <div className="feed-tabs" role="tablist" aria-label="Timeline feed">
      <button role="tab" id="feed-tab-for-you" aria-controls="feed-panel" aria-selected={tab === 'for-you'} className={tab === 'for-you' ? 'is-active' : ''} onClick={() => setTab('for-you')}>{t('feed.forYou')}</button>
      <button role="tab" id="feed-tab-following" aria-controls="feed-panel" aria-selected={tab === 'following'} className={tab === 'following' ? 'is-active' : ''} onClick={() => setTab('following')}>{t('feed.following')}</button>
    </div>
    <section id="feed-panel" role="tabpanel" aria-labelledby={tab === 'for-you' ? 'feed-tab-for-you' : 'feed-tab-following'}>
      {tab === 'following' ? <SignInGate feature="view your following timeline" /> : <>
        <EmptyZone />
      </>}
    </section>
  </div>;
}
