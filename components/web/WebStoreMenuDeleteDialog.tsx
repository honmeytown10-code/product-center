import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { menuStoreName, type StoreMenuRecord } from './storeMenus';

export const WebStoreMenuDeleteDialog: React.FC<{ menu: StoreMenuRecord; onCancel: () => void; onConfirm: () => void }> = ({ menu, onCancel, onConfirm }) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 p-6" onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); onCancel(); }
    if (event.key === 'Tab') { event.preventDefault(); (document.activeElement === cancelRef.current ? confirmRef : cancelRef).current?.focus(); }
  }}>
    <div role="dialog" aria-modal="true" aria-labelledby="store-menu-delete-title" aria-describedby="store-menu-delete-description" className="w-[480px] max-w-full rounded-lg bg-white p-5 shadow-2xl">
      <div className="flex items-start gap-3"><AlertTriangle size={22} className="mt-0.5 shrink-0 text-[#F79009]" /><div className="min-w-0"><h3 id="store-menu-delete-title" className="text-[16px] font-semibold">删除菜单</h3><div id="store-menu-delete-description" className="mt-3 space-y-2 text-[13px] leading-6 text-[#667085]"><p className="break-words">确认删除“{menuStoreName(menu.storeId)}”的“{menu.name}”菜单吗？</p><p>确认后立即移除该菜单及其 {menu.productIds.length} 个商品关联，不会下架或删除门店商品，也不影响其他菜单和门店。</p><p>删除后无法撤销，如需恢复，请重新创建菜单并添加商品。</p></div></div></div>
      <div className="mt-5 flex justify-end gap-2"><button ref={cancelRef} type="button" onClick={onCancel} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">取消</button><button ref={confirmRef} type="button" onClick={onConfirm} className="h-9 rounded-md bg-[#D92D20] px-4 text-[13px] font-medium text-white">确认删除</button></div>
    </div>
  </div>;
};
