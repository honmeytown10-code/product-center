import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Product } from '../../types';

export type ProductLifecycleAction = 'disable' | 'archive';

// Production mapping: shared Dialog + Input; revalidate lifecycle scope on submission.
export const WebProductLifecycleConfirm: React.FC<{
  action: ProductLifecycleAction;
  products: Product[];
  storeCount: number;
  unifiedManagement: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}> = ({ action, products, storeCount, unifiedManagement, onCancel, onConfirm }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const verb = action === 'disable' ? '停用' : '归档';
  const phrase = `我确认${verb}`;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (confirmation !== phrase || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try { await onConfirm(); }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : `${verb}未完成，请重试。`);
      submittingRef.current = false;
      setSubmitting(false);
    }
  };
  return <dialog ref={dialog} aria-labelledby="product-lifecycle-title" aria-describedby="product-lifecycle-impact"
    onCancel={event => { event.preventDefault(); if (!submittingRef.current) onCancel(); }}
    className="m-auto max-h-[calc(100dvh-48px)] w-[640px] max-w-[calc(100vw-48px)] overflow-auto rounded-lg bg-white p-0 text-[#1D2129] shadow-[0_16px_48px_rgba(0,0,0,.2)] backdrop:bg-black/40">
    <form onSubmit={submit}>
      <header className="flex items-center justify-between border-b border-[#E5E6EB] px-6 py-5">
        <h2 id="product-lifecycle-title" className="text-base font-semibold">确定{products.length > 1 ? '批量' : ''}{verb}商品吗？</h2>
        <button type="button" aria-label="关闭确认弹窗" disabled={submitting} onClick={onCancel} autoFocus className="rounded p-1 text-[#667085] hover:bg-[#F2F3F5] focus-visible:outline-2 focus-visible:outline-[#00A35B] disabled:opacity-40"><X size={18} /></button>
      </header>
      <div className="space-y-5 px-6 py-5 text-sm">
        <div className="flex items-start gap-3"><span className="shrink-0 text-[#4E5969]">{verb}商品</span><div className="max-h-24 overflow-auto break-all font-medium no-scrollbar">{products.map(product => product.name).join('、')}{products.length > 1 && <span className="ml-2 font-normal text-[#667085]">共 {products.length} 个</span>}</div></div>
        <div id="product-lifecycle-impact" className="flex gap-3 rounded-md bg-[#F7F8FA] p-4 leading-6">
          <AlertTriangle size={18} className="mt-1 shrink-0 text-[#D92D20]" />
          <div>{action === 'disable'
            ? unifiedManagement ? <>停用后，将下架该商品在所有门店、所有渠道的门店商品（当前关联 {storeCount} 家门店），商品库资料和模板商品保留。再次启用不会自动上架门店商品。</> : <>停用后，该商品主档将不可用，商品资料保留。</>
            : unifiedManagement ? <>归档后，将从商品库、所有门店、所有商品下发模板中删除该商品。归档商品不能继续售卖或下发，请谨慎操作。</> : <>归档后，将从商品主档库删除该商品，请谨慎操作。</>}</div>
        </div>
        <div><label htmlFor="product-lifecycle-confirmation" className="mb-2 block text-[#4E5969]">确认{verb}，请输入“{phrase}”</label>
          <input id="product-lifecycle-confirmation" value={confirmation} disabled={submitting} onChange={event => setConfirmation(event.target.value)} autoComplete="off" className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 outline-none focus:border-[#00A35B]" />
        </div>
        {error && <p role="alert" className="text-[#D92D20]">{error}</p>}
      </div>
      <footer className="flex justify-end gap-3 border-t border-[#E5E6EB] px-6 py-4">
        <button type="button" disabled={submitting} onClick={onCancel} className="h-9 rounded-md border border-[#D9DDE3] px-4 text-sm text-[#4E5969] hover:bg-[#F7F8FA] disabled:opacity-40">取消</button>
        <button type="submit" disabled={confirmation !== phrase || submitting} className="h-9 rounded-md bg-[#D92D20] px-4 text-sm font-medium text-white hover:bg-[#B42318] disabled:cursor-not-allowed disabled:bg-[#F2F3F5] disabled:text-[#86909C]">{submitting ? `${verb}中…` : `确认${verb}`}</button>
      </footer>
    </form>
  </dialog>;
};
