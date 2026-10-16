import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { ImageCropDialog } from './ImageCropDialog';
import type { ImageKind } from '../profile/api';

const SETTINGS = {
  avatar: { title: 'Profile photo', aspect: 1, outWidth: 512, round: true },
  banner: { title: 'Banner', aspect: 3, outWidth: 1500, round: false },
} as const;

/** A button that opens the file chooser, then the crop dialog, then hands back the cropped image. */
export function ImagePicker({ kind, label, disabled, onPicked, className = 'button button--outline button--small' }: {
  kind: ImageKind; label: string; disabled?: boolean; onPicked: (blob: Blob) => void; className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const cfg = SETTINGS[kind];

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    setError('');
    if (picked.type && !picked.type.startsWith('image/')) { setError('That file is not an image.'); return; }
    if (picked.size > 25 * 1024 * 1024) { setError('That photo is too large. Choose one under 25 MB.'); return; }
    setFile(picked);
  };

  const Icon = kind === 'avatar' ? Camera : ImagePlus;
  return <>
    <button type="button" className={className} disabled={disabled} onClick={() => input.current?.click()}><Icon size={14} />{label}</button>
    <input ref={input} type="file" accept="image/*" hidden onChange={choose} />
    {error && <span className="field-error" role="alert">{error}</span>}
    {file && <ImageCropDialog
      file={file}
      title={cfg.title}
      aspect={cfg.aspect}
      outWidth={cfg.outWidth}
      round={cfg.round}
      onCancel={() => setFile(null)}
      onDone={(blob) => { setFile(null); onPicked(blob); }}
    />}
  </>;
}
