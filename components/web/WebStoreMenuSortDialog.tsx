import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react';
import { menuStoreName, type StoreMenuRecord } from './storeMenus';

// Follows the existing channel-library sorting dialog: drag or move, then save/cancel.
export const WebStoreMenuSortDialog: React.FC<{
  menus: StoreMenuRecord[];
  storeId: string;
  onCancel: () => void;
  onSave: (orderedIds: string[]) => void;
}> = ({ menus, storeId, onCancel, onSave }) => {
  const [draft, setDraft] = useState(menus);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dirty = draft.some((menu, index) => menu.id !== menus[index]?.id);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus();
  }, []);
  const move = (id: string, targetId: string) => {
    if (id === targetId) return;
    setDraft(current => {
      const from = current.findIndex(menu => menu.id === id);
      const to = current.findIndex(menu => menu.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moving] = next.splice(from, 1);
      next.splice(to, 0, moving);
      return next;
    });
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.stopPropagation(); onCancel(); }
    if (event.key !== 'Tab') return;
    const buttons = Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled)') || []) as HTMLButtonElement[];
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
  };
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 p-6">
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="store-menu-sort-title" onKeyDown={onKeyDown} className="flex max-h-[calc(100vh-48px)] w-[600px] max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl outline-none">
      <div className="flex shrink-0 items-start justify-between border-b border-[#E9EDF2] px-5 py-4">
        <div><h3 id="store-menu-sort-title" className="text-[16px] font-semibold">菜单排序管理</h3><p className="mt-1 text-[12px] text-[#667085]">{menuStoreName(storeId)} · 拖动菜单或使用上下按钮调整展示顺序</p></div>
        <button type="button" aria-label="关闭菜单排序" onClick={onCancel} className="rounded p-1 text-[#667085] hover:bg-[#F2F4F7]"><X size={18} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto no-scrollbar p-5">
        <div role="list" aria-label="当前门店菜单顺序" className="overflow-hidden rounded-md border border-[#E9EDF2]">
          {draft.map((menu, index) => <div key={menu.id} role="listitem" data-menu-id={menu.id} draggable
            onDragStart={event => { setDraggingId(menu.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', menu.id); }}
            onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
            onDrop={event => { event.preventDefault(); const id = draggingId || event.dataTransfer.getData('text/plain'); if (id) move(id, menu.id); setDraggingId(null); }}
            onDragEnd={() => setDraggingId(null)}
            className={`flex items-center gap-3 border-b border-[#EEF0F3] px-4 py-3 last:border-b-0 ${draggingId === menu.id ? 'bg-[#EDF9F3]' : 'bg-white hover:bg-[#FAFCFB]'}`}>
            <GripVertical size={16} className="shrink-0 cursor-grab text-[#98A2B3] active:cursor-grabbing" />
            <span className="w-5 shrink-0 text-center text-[13px] text-[#86909C]">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium" title={menu.name}>{menu.name}</span>
            <div className="flex shrink-0 gap-2">
              <button type="button" aria-label={`上移${menu.name}`} disabled={index === 0} onClick={() => move(menu.id, draft[index - 1].id)} className="flex h-8 w-8 items-center justify-center rounded border border-[#DDE2E8] text-[#667085] hover:text-[#008F4C] disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp size={14} /></button>
              <button type="button" aria-label={`下移${menu.name}`} disabled={index === draft.length - 1} onClick={() => move(menu.id, draft[index + 1].id)} className="flex h-8 w-8 items-center justify-center rounded border border-[#DDE2E8] text-[#667085] hover:text-[#008F4C] disabled:cursor-not-allowed disabled:opacity-30"><ArrowDown size={14} /></button>
            </div>
          </div>)}
        </div>
        <p className="mt-3 text-[12px] text-[#667085]">保存后，当前门店的小程序横向菜单将按此顺序展示。</p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#E9EDF2] px-5 py-3">
        <button type="button" onClick={onCancel} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">取消排序</button>
        <button type="button" disabled={!dirty} onClick={() => onSave(draft.map(menu => menu.id))} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">保存排序</button>
      </div>
    </div>
  </div>;
};
