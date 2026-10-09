import { PenLine } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useSite } from '../state/SiteContext';

export function Composer() {
  const { t } = useLanguage();
  const { requestSignIn } = useSite();
  return <section className="composer-card" aria-label="Create a post">
    <div className="composer-card-copy"><span className="composer-card-icon"><PenLine size={17} /></span><span><strong>Start a conversation.</strong><small>Posts are public. Sign in to write one.</small></span></div>
    <button className="button button--primary composer-cta" onClick={() => requestSignIn('write a post')}><PenLine size={16} />{t('action.post')}</button>
  </section>;
}
