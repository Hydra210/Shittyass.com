import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Dialog } from './Dialog';

type Props = {
  file: File;
  title: string;
  aspect: number;          // width / height of the saved picture
  outWidth: number;        // saved picture width in pixels
  round?: boolean;         // show a circular guide (avatars)
  onCancel: () => void;
  onDone: (blob: Blob) => void;
};

/** Drag to move, slider / mouse wheel / pinch-free buttons to zoom. Saves exactly what is inside the frame. */
export function ImageCropDialog({ file, title, aspect, outWidth, round = false, onCancel, onDone }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrame({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base = natural && frame.w ? Math.max(frame.w / natural.w, frame.h / natural.h) : 1;
  const scale = base * zoom;
  const dispW = natural ? natural.w * scale : 0;
  const dispH = natural ? natural.h * scale : 0;
  const clamp = (o: { x: number; y: number }, s = scale) => {
    if (!natural) return o;
    const maxX = Math.max(0, (natural.w * s - frame.w) / 2);
    const maxY = Math.max(0, (natural.h * s - frame.h) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) };
  };

  const changeZoom = (next: number) => {
    const z = Math.min(4, Math.max(1, next));
    setZoom(z);
    setOffset((o) => clamp(o, base * z));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d) setOffset(clamp({ x: d.ox + e.clientX - d.px, y: d.oy + e.clientY - d.py }));
  };
  const endDrag = () => { drag.current = null; };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 14;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) { e.preventDefault(); setOffset((o) => clamp({ x: o.x + moves[e.key][0], y: o.y + moves[e.key][1] })); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); changeZoom(zoom + 0.15); }
    else if (e.key === '-') { e.preventDefault(); changeZoom(zoom - 0.15); }
  };

  const save = async () => {
    const img = imgRef.current;
    if (!natural || !img) return;
    setBusy(true);
    try {
      const outHeight = Math.round(outWidth / aspect);
      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.fillStyle = '#1a1a1a';                    // only visible where a PNG/GIF is transparent
      ctx.fillRect(0, 0, outWidth, outHeight);
      ctx.imageSmoothingQuality = 'high';
      const sx = natural.w / 2 - (frame.w / 2 + offset.x) / scale;
      const sy = natural.h / 2 - (frame.h / 2 + offset.y) / scale;
      ctx.drawImage(img, sx, sy, frame.w / scale, frame.h / scale, 0, 0, outWidth, outHeight);
      const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
      let blob = await toBlob('image/webp');
      if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg');   // older Safari has no WebP encoder
      if (!blob) throw new Error('blob');
      onDone(blob);
    } catch {
      setError('Something went wrong preparing that photo. Try a different one.');
      setBusy(false);
    }
  };

  return <Dialog title={title} onClose={onCancel} size="md">
    <div className="crop-body">
      <div
        ref={frameRef}
        className={`crop-frame${round ? ' crop-frame--round' : ''}`}
        style={{ aspectRatio: String(aspect) }}
        tabIndex={0}
        role="group"
        aria-label="Photo position. Drag, or use the arrow keys, to move. Plus and minus to zoom."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={(e) => changeZoom(zoom - e.deltaY * 0.0015)}
        onKeyDown={onKeyDown}
      >
        {url && <img
          ref={imgRef}
          src={url}
          alt=""
          draggable={false}
          onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          onError={() => setError("This browser can't open that photo. Try a JPEG or PNG.")}
          style={{ width: dispW || undefined, height: dispH || undefined, transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`, visibility: natural ? 'visible' : 'hidden' }}
        />}
      </div>
      <label className="crop-zoom">Zoom
        <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} aria-label="Zoom" />
      </label>
      <p className="form-note">Drag the photo to position it. {round ? 'The circle is what people will see.' : 'The whole frame is saved.'}</p>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button button--outline" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="button button--primary" onClick={save} disabled={busy || !natural}>{busy ? 'Preparing…' : 'Use photo'}</button>
      </div>
    </div>
  </Dialog>;
}
