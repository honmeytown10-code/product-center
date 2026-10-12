import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Full-page product pickers escape the isolated content panel. Selection and
// confirmation remain owned by the original form; this layer only protects it.
export const WebProductPickerLayer: React.FC<{ title: string; onClose: () => void; preserveCreatableContext?: boolean; children: React.ReactNode }> = ({ title, onClose, preserveCreatableContext, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const app = document.getElementById('root');
    const wasInert = app?.inert;
    if (app) app.inert = true;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current(); return; }
      if (event.key !== 'Tab') return;
      const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []).filter(item => item.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown, true);
    return () => {
      document.removeEventListener('keydown', keydown, true);
      document.body.style.overflow = overflow;
      if (app) app.inert = wasInert || false;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(<div ref={ref} role="dialog" aria-modal="true" aria-label={title} data-creatable-select-root={preserveCreatableContext ? 'true' : undefined} tabIndex={-1} className="console-product-picker-layer fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-6 outline-none">{children}</div>, document.body);
};
