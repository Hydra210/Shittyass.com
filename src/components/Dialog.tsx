import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({ title, onClose, children, size = 'md' }: { title: string; onClose: () => void; children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const backdrop = backdropRef.current;
    const dialog = dialogRef.current;
    if (!backdrop || !dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const inertSnapshot: Array<[HTMLElement, boolean]> = [];
    let branch: HTMLElement | null = backdrop;
    while (branch?.parentElement) {
      const parentElement: HTMLElement = branch.parentElement;
      for (const sibling of Array.from(parentElement.children)) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          inertSnapshot.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
      if (parentElement.classList.contains('site-shell')) break;
      branch = parentElement;
    }

    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        closeRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    closeRef.current?.focus();
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      for (const [element, wasInert] of inertSnapshot) element.inert = wasInert;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  return (
    <div ref={backdropRef} className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCloseRef.current(); }}>
      <section ref={dialogRef} className={`dialog dialog--${size}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1}>
        <div className="dialog-header">
          <h2 id="dialog-title">{title}</h2>
          <button className="icon-button dialog-close" onClick={() => onCloseRef.current()} ref={closeRef} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="dialog-content">{children}</div>
      </section>
    </div>
  );
}
