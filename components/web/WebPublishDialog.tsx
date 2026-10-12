import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Short publishing tasks stay above the wizard and retain its current selections.
export const WebPublishDialog: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }> = ({ title, onClose, children, footer }) => {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key !== 'Tab') return;
      const items = Array.from((ref.current?.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []) as ArrayLike<HTMLElement>).filter(item => item.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown, true);
    return () => { document.removeEventListener('keydown', keydown, true); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, [onClose]);
  return createPortal(<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-6">
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="flex max-h-[85vh] w-full max-w-[720px] flex-col rounded-xl bg-white shadow-xl outline-none">
      <header className="flex items-center justify-between border-b border-[#F2F3F5] px-6 py-5"><h2 id={titleId} className="text-lg font-semibold text-[#1D2129]">{title}</h2><button type="button" aria-label="关闭弹窗" onClick={onClose} className="rounded p-1 text-[#86909C] hover:bg-gray-100"><X size={20} /></button></header>
      <div className="min-h-0 overflow-auto px-6 py-5">{children}</div>
      <footer className="flex justify-end gap-3 border-t border-[#F2F3F5] px-6 py-4">{footer}</footer>
    </div>
  </div>, document.body);
};
