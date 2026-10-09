import { Link } from 'react-router-dom';

const wordmark = <img className="brand-logo" src="/shittyass-wordmark.png" alt="ShittyAss.com" />;

export function Brand({ compact = false, linked = true }: { compact?: boolean; linked?: boolean }) {
  const className = `brand-lockup${compact ? ' brand-lockup--compact' : ''}`;
  return linked
    ? <Link to="/" className={className} aria-label="ShittyAss.com home">{wordmark}</Link>
    : <span className={className}>{wordmark}</span>;
}
