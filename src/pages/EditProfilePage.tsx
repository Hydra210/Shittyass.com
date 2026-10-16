import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { ImagePicker } from '../components/ImagePicker';
import { SignInGate } from '../components/SignInGate';
import { LIMITS, profileApi, type ImageKind } from '../profile/api';
import { useUsernameCheck } from '../profile/useUsernameCheck';
import { useProfile } from '../state/ProfileContext';
import type { UserProfile } from '../types';

function EditForm({ profile }: { profile: UserProfile }) {
  const { setProfile } = useProfile();
  const [name, setName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [website, setWebsite] = useState(profile.website ?? '');
  const [pronouns, setPronouns] = useState(profile.pronouns ?? '');
  const [handle, setHandle] = useState(profile.handle);
  const [imageBusy, setImageBusy] = useState<ImageKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null);
  const check = useUsernameCheck(handle, profile.handle);

  useEffect(() => { setHandle(profile.handle); }, [profile.handle]);

  const say = (kind: 'ok' | 'bad', text: string) => setMessage({ kind, text });
  const dirty = name !== profile.displayName || bio !== (profile.bio ?? '') || location !== (profile.location ?? '') || website !== (profile.website ?? '') || pronouns !== (profile.pronouns ?? '');
  const cooldown = profile.usernameChangeAvailableAt ? new Date(profile.usernameChangeAvailableAt) : null;
  const cleanHandle = handle.trim().replace(/^@/, '');
  const handleChanged = cleanHandle !== profile.handle;

  const upload = async (kind: ImageKind, blob: Blob) => {
    setImageBusy(kind); setMessage(null);
    try { setProfile(await profileApi.uploadImage(kind, blob)); say('ok', kind === 'avatar' ? 'Profile photo updated.' : 'Banner updated.'); }
    catch (cause) { say('bad', cause instanceof Error ? cause.message : 'Upload failed.'); }
    finally { setImageBusy(null); }
  };
  const remove = async (kind: ImageKind) => {
    setImageBusy(kind); setMessage(null);
    try { setProfile(await profileApi.removeImage(kind)); say('ok', kind === 'avatar' ? 'Profile photo removed.' : 'Banner removed.'); }
    catch (cause) { say('bad', cause instanceof Error ? cause.message : 'Could not remove it.'); }
    finally { setImageBusy(null); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setMessage(null);
    try {
      const next = await profileApi.update({ display_name: name, bio, location, website, pronouns });
      setProfile(next);
      setName(next.displayName); setBio(next.bio ?? ''); setLocation(next.location ?? ''); setWebsite(next.website ?? ''); setPronouns(next.pronouns ?? '');
      say('ok', 'Profile saved.');
    } catch (cause) { say('bad', cause instanceof Error ? cause.message : 'Could not save.'); }
    finally { setSaving(false); }
  };
  const rename = async () => {
    setRenaming(true); setMessage(null);
    try { setProfile(await profileApi.changeUsername(cleanHandle)); say('ok', `Your username is now @${cleanHandle}.`); }
    catch (cause) { say('bad', cause instanceof Error ? cause.message : 'Could not change your username.'); }
    finally { setRenaming(false); }
  };

  return <>
    <section className="profile-hero edit-hero" aria-label="Photos">
      <div className={`profile-cover${profile.bannerUrl ? ' has-image' : ''}`}>
        {profile.bannerUrl && <img src={profile.bannerUrl} alt="Your banner" />}
        <div className="image-controls">
          <ImagePicker kind="banner" label={profile.bannerUrl ? 'Change banner' : 'Add banner'} disabled={imageBusy !== null} onPicked={(b) => void upload('banner', b)} />
          {profile.bannerUrl && <button type="button" className="button button--outline button--small" disabled={imageBusy !== null} onClick={() => void remove('banner')}><Trash2 size={13} />Remove</button>}
        </div>
      </div>
      <div className="profile-avatar-action">
        <Avatar user={profile} size="xl" />
        <div className="profile-actions">
          <ImagePicker kind="avatar" label={profile.avatarUrl ? 'Change photo' : 'Add photo'} disabled={imageBusy !== null} onPicked={(b) => void upload('avatar', b)} />
          {profile.avatarUrl && <button type="button" className="button button--outline button--small" disabled={imageBusy !== null} onClick={() => void remove('avatar')}><Trash2 size={13} />Remove</button>}
        </div>
      </div>
      <p className="form-note edit-hero-note">{imageBusy ? 'Uploading…' : 'Photos are cropped and saved without location data.'}</p>
    </section>

    {message && <p className={message.kind === 'ok' ? 'form-success' : 'field-error'} role={message.kind === 'ok' ? 'status' : 'alert'}>{message.text}</p>}

    <form className="form-card form-stack" onSubmit={save}>
      <h2>Profile info</h2>
      <label className="field-label" htmlFor="edit-name">Display name
        <input id="edit-name" value={name} maxLength={LIMITS.name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field-label" htmlFor="edit-bio">Bio
        <textarea id="edit-bio" rows={4} value={bio} maxLength={LIMITS.bio} onChange={(e) => setBio(e.target.value)} />
        <span className="counter">{bio.length}/{LIMITS.bio}</span>
      </label>
      <div className="form-two">
        <label className="field-label" htmlFor="edit-location">Location
          <input id="edit-location" value={location} maxLength={LIMITS.location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <label className="field-label" htmlFor="edit-pronouns">Pronouns
          <input id="edit-pronouns" value={pronouns} maxLength={LIMITS.pronouns} onChange={(e) => setPronouns(e.target.value)} />
        </label>
      </div>
      <label className="field-label" htmlFor="edit-website">Website
        <input id="edit-website" value={website} maxLength={LIMITS.website} inputMode="url" autoCapitalize="none" placeholder="example.com" onChange={(e) => setWebsite(e.target.value)} />
      </label>
      <div className="form-actions"><button className="button button--primary" type="submit" disabled={!dirty || saving || !name.trim()}>{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form>

    <section className="form-card form-stack" aria-labelledby="username-heading">
      <h2 id="username-heading">Username</h2>
      <label className="field-label" htmlFor="edit-username">Your @name
        <span className="input-prefix"><span aria-hidden="true">@</span><input id="edit-username" value={handle} maxLength={21} autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby="edit-username-status" onChange={(e) => setHandle(e.target.value)} disabled={Boolean(cooldown)} /></span>
      </label>
      <p id="edit-username-status" className={`username-status ${check.state}`} role="status" aria-live="polite">{cooldown ? `You can change your username again on ${cooldown.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}.` : check.message || 'Changing it also changes your profile link. Your old name is held for you for 14 days.'}</p>
      {!cooldown && <div className="form-actions"><button type="button" className="button button--outline" onClick={() => void rename()} disabled={renaming || !handleChanged || check.state === 'bad' || check.state === 'checking'}>{renaming ? 'Changing…' : 'Change username'}</button></div>}
    </section>
    <p className="form-note"><Link className="text-button" to={`/u/${profile.handle}`}>View your profile</Link></p>
  </>;
}

export function EditProfilePage() {
  const { profile, status } = useProfile();
  return <div className="page edit-profile-page">
    <header className="page-heading"><h1>Edit profile</h1></header>
    <SignInGate feature="edit your profile">
      {profile ? <EditForm profile={profile} />
        : <p className="state-card" role="status">{status === 'error' ? "We couldn't load your profile." : 'Loading…'}</p>}
    </SignInGate>
  </div>;
}
