import { useState, type ReactNode } from 'react';
import { Accessibility, ArrowRight, ExternalLink, HeartHandshake, LockKeyhole, MessageCircle, Shield, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSite } from '../state/SiteContext';

function DraftBanner() {
  return <div className="legal-draft-banner"><span className="draft-banner-icon"><ShieldAlert size={16} /></span><span><strong>Launch draft — not legal advice.</strong> Have qualified counsel review and adapt this copy for the operator, actual service, jurisdictions and data flows before accepting real users or information.</span></div>;
}

function LegalFrame({ title, children, draft = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; draft?: boolean; icon?: LucideIcon }) {
  return <div className="page legal-page"><header className="page-heading legal-heading"><h1>{title}</h1></header>{children}{draft && <DraftBanner />}<nav className="legal-bottom-nav" aria-label="Legal and help links"><Link to="/help">Help</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/accessibility">Accessibility</Link><Link to="/safety">Safety</Link></nav></div>;
}

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="legal-section"><h2>{title}</h2><div>{children}</div></section>;
}

export function AboutPage() {
  return <LegalFrame eyebrow="The idea behind the name" title="About ShittyAss.com" intro="A calmer corner of the internet for saying what you actually think." icon={Sparkles}>
    <div className="about-manifesto"><span className="manifesto-symbol">✳</span><p>The name gets your attention. The point is what happens next: good-faith conversation, open topics, and room to finish the thought.</p><span className="manifesto-signoff">A serious place with a name that doesn’t take itself too seriously.</span></div>
    <div className="legal-section-grid"><LegalSection title="A place for open conversation"><p>ShittyAss.com is being built as a public conversation space: readable posts, useful discovery, community factions, thoughtful standards and controls that are straightforward to use.</p></LegalSection><LegalSection title="Current availability"><p>Email/password accounts, email verification and 2FA are connected through a separate account service. Posting, search data, faction/channel management, permissions, bot integrations, messaging and moderation are not connected. Content areas remain empty until those systems are available.</p></LegalSection></div>
    <div className="about-cta"><div><span className="eyebrow">Start with the basics</span><h2>Read the community standards.</h2></div><Link to="/safety" className="button button--primary">Safety &amp; standards <ArrowRight size={15} /></Link></div>
  </LegalFrame>;
}

export function HelpPage() {
  const [query, setQuery] = useState('');
  const faqs = [
    { q: 'Can I create an account?', a: 'Yes. The sign-up form sends your email address, password and display name to this site’s FastAPI account proxy, which communicates with the EXE Accounts API. Verify your email before signing in.' },
    { q: 'Can I publish, like or reply to posts?', a: 'Those actions require an account. If you try one, the site routes you directly to the main sign-in screen. A publishing service is not connected, so posts and interactions cannot yet be saved or shared.' },
    { q: 'Can I send or receive messages?', a: 'Direct messaging is an account feature and is not connected yet. The Messages page requires sign-in; no messages are stored or delivered.' },
    { q: 'Where can I change language and accessibility settings?', a: 'Open Settings to choose English, Spanish or French and to adjust text size, motion and layout preferences.' },
    { q: 'How do I report content?', a: 'Read the Safety page for the community standards. Reporting requires sign-in and a working moderation service, which are not connected yet.' },
    { q: 'What information does this site store?', a: 'Language and display preferences may be stored in your browser’s local storage. Account credentials are sent only to this site’s authentication endpoint and then forwarded server-to-server to the account provider. Session tokens are set as HttpOnly cookies, not saved by frontend JavaScript. Read the Privacy and storage notices for details.' },
    { q: 'Can I reset my password?', a: 'Password recovery is not included in the account API routes currently connected, so the site cannot send a reset email yet.' },
    { q: 'Can anyone create a faction?', a: 'Any account can create a faction. The creation form asks only for a name, an optional description and whether the faction is public or private. Account and faction services are not connected yet, so the form does not create or save a faction.' },
    { q: 'How will faction bots work?', a: 'Bot support is coming soon. Future bots will be code-based, including Python, and added to factions by invitation. Bot setup, bot invitations and developer tools are not available yet.' },
  ];
  const visible = faqs.filter((faq) => `${faq.q} ${faq.a}`.toLowerCase().includes(query.toLowerCase()));
  return <LegalFrame eyebrow="Answers without a maze" title="Help & support" intro="Practical answers about accounts, conversations, settings and safety." icon={MessageCircle}>
    <form className="help-search" onSubmit={(event) => event.preventDefault()}><label htmlFor="help-search">Find an answer</label><input id="help-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help topics" /></form>
    <div className="faq-list">{visible.map((faq) => <details key={faq.q} className="faq-item"><summary>{faq.q}<span aria-hidden="true">+</span></summary><p>{faq.a}</p></details>)}</div>
    {!visible.length && <div className="state-card"><MessageCircle size={19} /><div><strong>No matching help topic.</strong><p>Try a different phrase, or browse the Safety and Privacy pages.</p></div></div>}
    <div className="legal-contact-card"><ShieldCheck size={18} /><span>Use the account forms only on the actual ShittyAss.com site. Never send your password or 2FA code to anyone in a message.</span></div>
  </LegalFrame>;
}

export function PrivacyPolicyPage() {
  return <LegalFrame eyebrow="Your information deserves clarity" title="Privacy notice" intro="Last updated: October 8, 2026 · unreviewed launch draft." draft icon={LockKeyhole}>
    <div className="legal-summary"><strong>Current scope</strong><p>Email/password registration and sign-in, email verification, optional two-factor verification and account-session refresh are handled by the FastAPI account proxy and the external EXE Accounts API. Posting, factions, channels, roles, permissions, bans, invitations, moderation, audit logs, custom emojis, bots, messaging, analytics and server-side social-content storage are not connected. Bot support is marked Coming soon. This is an unreviewed launch draft; confirm the real provider and deployed data flows before launch.</p></div>
    <LegalSection title="1. Status of this notice"><p>This document is a launch draft, not legal advice or a description of a completed production service. The operator, hosting, vendors, jurisdictions and actual data flows must be confirmed and reviewed before launch.</p></LegalSection>
    <LegalSection title="2. Information and preferences"><p>Registration sends the email address, password and display name entered in the form to this site's same-origin <code>/auth/register</code> endpoint. The FastAPI proxy forwards the registration request to the EXE Accounts API. Login sends the email address and password to <code>/auth/login</code>; if enabled, 2FA sends the challenge token and code to <code>/auth/verify-2fa</code>. The account service requires email verification before login works and may return account-hold or termination errors. Do not send credentials anywhere except the official account forms.</p><p>The selected interface language and display preferences (text size, motion and layout) may be saved in this browser’s local storage. Access and refresh tokens are set by the server in HttpOnly cookies and are not read or stored by frontend JavaScript. Clearing this site’s browser storage removes local preferences; signing out asks the server to clear the authentication cookies. Social content and account profile editing are not stored by this front end.</p></LegalSection>
    <LegalSection title="3. Cookies, logs and third parties"><p>The authentication service sets HttpOnly access and refresh cookies for the site session; production uses Secure cookies. These are required for sign-in and session refresh, not advertising. The FastAPI server communicates with the EXE Accounts API; the browser does not call that service directly. The browser, hosting, network and account providers may process technical request information. Exact provider locations, email delivery, logs, retention and vendor arrangements have not been confirmed and must be reviewed before launch. The interface does not embed third-party analytics or remotely hosted fonts.</p></LegalSection>
    <LegalSection title="4. Retention, rights and contact"><p>The account provider handles account credentials and account verification; its retention, deletion, data-request and contact processes must be confirmed with the operator before launch. This site's social/content retention system is not connected. A real privacy contact, data request process, retention schedule, deletion procedure and applicable rights must be established before the service opens to users.</p></LegalSection>
    <LegalSection title="5. Children and safety"><p>This draft does not set a production age threshold or describe age assurance. The operator must establish age, consent, safety and escalation requirements for the relevant jurisdictions before accounts open.</p></LegalSection>
    <LegalSection title="6. Changes"><p>A production notice must identify its effective date, explain material changes and provide an appropriate contact or request channel. This draft does not announce a live change in data processing.</p></LegalSection>
    <div className="legal-contact-card"><ShieldCheck size={18} /><span>Before accepting real user information, replace this draft with a reviewed policy that matches the deployed product.</span></div>
  </LegalFrame>;
}

export function TermsPage() {
  return <LegalFrame eyebrow="Plain language first" title="Terms of service" intro="Last updated: October 8, 2026 · unreviewed launch draft." draft icon={Shield}>
    <div className="legal-summary"><strong>Important</strong><p>This is draft website copy, not an executed contract or legal advice. It does not currently govern a live community. Have qualified counsel adapt it to the actual service, operator, users and jurisdictions before launch.</p></div>
    <LegalSection title="1. About the service"><p>ShittyAss.com is being prepared as an open-topic social conversation service. Email/password account registration and sign-in are connected through an external account service, including email verification and optional 2FA. Posting, messaging, faction management and moderation systems are not connected. This draft still requires operator and jurisdiction details and legal review before it can govern a live service.</p></LegalSection>
    <LegalSection title="2. Eligibility and accounts — draft"><p>A production service needs a clear age and eligibility rule appropriate to each jurisdiction. If accounts are enabled, users must provide accurate information, keep credentials secure and use another person’s identity only with permission. The operator must settle the age rule and account enforcement process before sign-up opens.</p></LegalSection>
    <LegalSection title="3. Community conduct — draft"><p>A live policy should prohibit targeted harassment, threats, doxxing, non-consensual intimate imagery, impersonation, spam, unlawful content and attempts to evade safety controls. Reporting and appeal processes must be operational and fairly applied before these rules are presented as enforceable.</p></LegalSection>
    <LegalSection title="4. User content and rights — draft"><p>A production version needs explicit rules for content ownership, the limited license needed to operate and display posts, media consent, faction and channel access, moderation responsibility, bot permissions, removal requests and account deletion. No content license is granted or accepted by visiting this site.</p></LegalSection>
    <LegalSection title="5. Moderation, availability and termination — draft"><p>No moderation team or enforcement system is connected. Before launch, the operator must define reporting, urgent escalation, moderation decisions, appeals, service changes, account suspension and termination, and any notice process.</p></LegalSection>
    <LegalSection title="6. Factions and integrations — draft"><p>A production service must explain that faction creators administer their communities, define channel visibility and role permissions, and manage members, nicknames, bans, invitations, moderation and audit records. Bot controls are coming soon and no bot can be installed now. If future code-based bots join by invitation, the operator must define bot review, user disclosure, permission scope and revocation, abuse handling, audit records and the limits of creator responsibility before those controls become operational.</p></LegalSection>
    <LegalSection title="7. Disclaimers, liability and governing law — draft"><p>Any warranties, liability limits, dispute process and governing-law terms need jurisdiction-specific legal review. This draft does not invent the operator’s legal identity, governing law or enforceable limitations.</p></LegalSection>
    <div className="legal-contact-card"><ShieldAlert size={18} /><span>Obtain legal review, name the operator and implement the described procedures before real sign-up or publishing.</span></div>
  </LegalFrame>;
}

export function AccessibilityPage() {
  return <LegalFrame eyebrow="Good design leaves the door open" title="Accessibility" intro="The goal is a calm interface that more people can use, on more kinds of days." icon={Accessibility}>
    <div className="accessibility-callout"><Accessibility size={21} /><div><strong>Accessibility is part of the product, not a settings page.</strong><p>The interface is designed for keyboard use, clear focus, labelled controls, readable contrast, reduced-motion support, responsive reflow and semantic structure. It has not received a formal accessibility audit.</p></div></div>
    <LegalSection title="Using the interface"><p>Use Tab and Shift+Tab to move through controls, Enter or Space to activate them, and Escape to close dialogs. Form fields have labels and validation feedback. Status changes use live regions. The layout adapts to narrow screens and honors the operating-system reduced-motion preference.</p></LegalSection>
    <LegalSection title="Display options"><p>Open Settings to choose a larger text size, reduce movement, adjust layout density and choose a display language. These preferences are saved in this browser only.</p><Link to="/settings" className="button button--outline"><SettingsLinkIcon /> Open Settings <ArrowRight size={14} /></Link></LegalSection>
    <LegalSection title="Conformance and feedback"><p>This page is not a conformance claim. Before launch, test representative assistive technology, keyboard and touch flows against a chosen standard and publish an accessibility contact channel, known limitations and a response process.</p></LegalSection>
  </LegalFrame>;
}

function SettingsLinkIcon() {
  return <span className="accessibility-aa" aria-hidden="true">Aa</span>;
}

export function SafetyPage() {
  const { requestSignIn } = useSite();
  return <LegalFrame eyebrow="A good corner needs good boundaries" title="Safety & community standards" intro="Respect is the baseline. Real reporting and moderation must be in place before the community opens." icon={HeartHandshake}>
    <div className="safety-principles"><article><span>01</span><h2>Make space</h2><p>Disagree with ideas. Do not target people or share someone’s private information.</p></article><article><span>02</span><h2>Keep people safe</h2><p>Threats, stalking, non-consensual imagery and illegal content have no place here.</p></article><article><span>03</span><h2>Report with care</h2><p>A live service must protect report privacy, explain next steps and offer a fair appeal.</p></article></div>
    <div className="report-card"><div className="section-heading"><div><span className="eyebrow">Reporting</span><h2><ShieldAlert size={18} /> Report a concern</h2></div></div><p className="settings-intro">Content reporting and moderation are not connected yet. Sign-in is required for a report.</p><button className="button button--primary" onClick={() => requestSignIn('report content')}>Sign in to report <ArrowRight size={15} /></button></div>
    <div className="legal-contact-card"><ShieldCheck size={18} /><span>If someone is in immediate danger, contact local emergency services. This website is not an emergency response service.</span></div>
  </LegalFrame>;
}

export function CookiePreferencesPage() {
  return <LegalFrame eyebrow="Storage, clearly explained" title="Cookie and storage notice" intro="How browser preferences work on this website." icon={LockKeyhole}>
    <div className="legal-summary"><strong>Authentication cookies are used for sign-in</strong><p>The FastAPI account proxy sets HttpOnly access and refresh cookies required to maintain and refresh a signed-in session. These are separate from local display preferences and are not available to frontend JavaScript.</p></div>
    <LegalSection title="Local display preferences"><p>The selected language and display options are stored in this browser’s local storage so they remain selected when you return. They are not an account profile, are not shared with a server by this front end and can be removed by clearing this site’s browser storage.</p></LegalSection>
    <LegalSection title="Hosting and browser technology"><p>The account proxy communicates with the EXE Accounts API server-to-server. The browser communicates only with this site's relative authentication endpoints. Hosting/network providers may process request information; production hosting, provider retention, storage purposes and consent requirements must be assessed before launch.</p></LegalSection>
    <LegalSection title="Manage your preferences"><p>Change display language, text size, motion and layout choices in Settings, or clear this website’s local storage through your browser settings.</p><Link to="/settings" className="button button--outline"><SettingsLinkIcon /> Open Settings <ArrowRight size={14} /></Link></LegalSection>
    <p className="legal-inline-note">This notice must be updated to reflect the actual production vendors, storage and applicable consent requirements.</p>
  </LegalFrame>;
}

export function NotFoundPage() {
  return <LegalFrame eyebrow="Page not found" title="Nothing here." intro="That address does not match a page on ShittyAss.com."><div className="not-found-card"><span className="not-found-number">404</span><p>Check the address or return to the home page.</p><Link to="/" className="button button--primary">Go to Home <ArrowRight size={15} /></Link><Link to="/help" className="not-found-help">Visit Help <ExternalLink size={13} /></Link></div></LegalFrame>;
}
