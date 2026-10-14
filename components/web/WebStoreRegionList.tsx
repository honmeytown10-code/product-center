import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Lock, Plus, Search } from 'lucide-react';
import { WebStoreScopeSelector } from './WebStoreScopeSelector';
import { WebStoreMenuSortDialog } from './WebStoreMenuSortDialog';
import { WebStoreMenuDisplayGuide } from './WebStoreMenuDisplayGuide';
import { WebStoreMenuFormDialog } from './WebStoreMenuFormDialog';
import { WebStoreMenuDeleteDialog } from './WebStoreMenuDeleteDialog';
import { MENU_STORES, menuStoreName, type StoreMenuRecord } from './storeMenus';

type Props = {
  menus: StoreMenuRecord[];
  onMenusChange: (menus: StoreMenuRecord[]) => void;
  storeId: string;
  onStoreChange: (id: string) => void;
  onEditMenu: (menu: StoreMenuRecord) => void;
  message?: string;
  onMessageRead?: () => void;
  // API/permission adapter states; local prototype defaults to full access.
  state?: 'success' | 'loading' | 'error' | 'no-permission' | 'partial-permission';
  onRetry?: () => void;
};
const buttonClass = 'h-9 rounded-md border border-[#DDE2E8] bg-white px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-40';
const primaryClass = 'inline-flex h-9 items-center justify-center rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40';

// Retain the historical component/route identifier for existing prototype links.
// Production: QmList/QmSearch/QmListTable + business store selector + el-dialog/el-form.
export const WebStoreRegionList: React.FC<Props> = ({ menus, onMenusChange, storeId, onStoreChange, onEditMenu, message, onMessageRead, state = 'success', onRetry }) => {
  const [keyword, setKeyword] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [editing, setEditing] = useState<StoreMenuRecord | 'create' | null>(null);
  const [deleting, setDeleting] = useState<StoreMenuRecord | null>(null);
  const [toast, setToast] = useState('');
  useEffect(() => { if (message) { setToast(message); onMessageRead?.(); } }, [message, onMessageRead]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2600); return () => window.clearTimeout(timer); }, [toast]);
  const storeMenus = useMemo(() => menus.filter(item => item.storeId === storeId).sort((a, b) => a.sort - b.sort), [menus, storeId]);
  const filtered = storeMenus.filter(item => !keyword.trim() || item.name.toLowerCase().includes(keyword.trim().toLowerCase()));
  const canManage = !!storeId && !['loading', 'error', 'no-permission'].includes(state);
  return <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#F5F6FA] p-3">
    {toast && <div role="status" className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-md bg-[#1D2129] px-4 py-2 text-[13px] text-white">{toast}</div>}
    <div className="console-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#E9EDF2] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#667085]">门店</span>
          <WebStoreScopeSelector stores={MENU_STORES} value={storeId ? [storeId] : []} disabled={['loading', 'error', 'no-permission'].includes(state)} selectionMode="single" onChange={ids => { onStoreChange(ids[0] || ''); setKeyword(''); }} widthClassName="w-[200px]" />
          <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /><input aria-label="搜索菜单名称" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="菜单名称" className="h-9 w-48 rounded-md border border-[#DDE2E8] pl-9 pr-3 text-[13px] disabled:bg-[#F7F8FA]" /></label>
          <button onClick={() => setKeyword('')} className={buttonClass}>重置</button>
        </div>
        <div className="flex gap-2"><button disabled={!canManage || storeMenus.length < 2} title="调整当前门店的小程序横向菜单顺序" onClick={() => setSortOpen(true)} className={`${buttonClass} inline-flex items-center`}><ArrowUpDown size={14} className="mr-1.5" />排序管理</button><button disabled={!canManage} onClick={() => setEditing('create')} className={primaryClass}><Plus size={15} className="mr-1.5" />新建菜单</button></div>
      </div>
      <WebStoreMenuDisplayGuide />
      <div className="shrink-0 border-y border-[#E9EDF2] px-4 py-2.5 text-[13px] text-[#667085]">{storeId ? <>{menuStoreName(storeId)} · 共 <strong className="text-[#1D2129]">{filtered.length}</strong> 个菜单</> : '请选择门店后管理菜单'}</div>
      {state === 'partial-permission' && <div role="status" className="border-b border-[#E9EDF2] bg-[#FFFAEB] px-4 py-2 text-[13px] text-[#B54708]">仅展示有权限的门店菜单，其他门店不可查看或操作</div>}
      {state === 'loading' || state === 'error' || state === 'no-permission' ? <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 text-[13px] text-[#667085]">{state === 'no-permission' && <Lock size={24} />}<span>{state === 'loading' ? '正在加载门店菜单…' : state === 'error' ? '菜单加载失败，请重试' : '暂无门店菜单查看权限，请联系管理员'}</span>{state === 'error' && <button onClick={onRetry} className={buttonClass}>重新加载</button>}</div> : <>
        <div className="min-h-0 flex-1 overflow-auto no-scrollbar"><table className="w-full min-w-[780px] table-fixed border-collapse text-left text-[13px]"><thead className="sticky top-0 z-10 bg-[#F7F8FA] text-[#4E5969]"><tr className="border-b border-[#E5E7EB]"><th className="px-4 py-3 font-medium">菜单名称</th><th className="w-[200px] px-3 py-3 font-medium">所属门店</th><th className="w-[140px] px-3 py-3 font-medium">关联商品</th><th className="w-[240px] px-3 py-3 font-medium">操作</th></tr></thead><tbody>{filtered.map(menu => <tr key={menu.id} className="border-b border-[#EEF0F3] hover:bg-[#FAFCFB]"><td className="px-4 py-3 font-medium"><div className="flex min-w-0 items-center gap-2">{menu.icon && <img src={menu.icon} alt={`${menu.name}菜单图标`} width={28} height={28} className="h-7 w-7 shrink-0 rounded object-contain" />}<span className="truncate" title={menu.name}>{menu.name}</span></div></td><td className="px-3 py-3"><div className="truncate" title={menuStoreName(menu.storeId)}>{menuStoreName(menu.storeId)}</div></td><td className="px-3 py-3">{menu.productIds.length} 个</td><td className="px-3 py-3"><div className="flex gap-4"><button onClick={() => onEditMenu(menu)} className="text-[#008F4C] disabled:opacity-40">管理商品</button><button onClick={() => setEditing(menu)} className="text-[#008F4C]">编辑</button><button onClick={() => setDeleting(menu)} className="text-[#D92D20]">删除</button></div></td></tr>)}</tbody></table>
          {filtered.length === 0 && <div className="flex h-56 flex-col items-center justify-center gap-2 text-[13px] text-[#98A2B3]"><Search size={28} className="mb-1" /><span>{!storeId ? '请选择要管理的门店' : keyword.trim() ? '没有符合当前条件的菜单' : '当前门店尚未创建菜单'}</span>{storeId && <button onClick={() => keyword.trim() ? setKeyword('') : setEditing('create')} className="text-[#008F4C]">{keyword.trim() ? '清空搜索' : '新建菜单'}</button>}</div>}
        </div>
      </>}
    </div>
    {sortOpen && <WebStoreMenuSortDialog menus={storeMenus} storeId={storeId} onCancel={() => setSortOpen(false)} onSave={orderedIds => {
      const positions = new Map(orderedIds.map((id, index) => [id, index + 1]));
      onMenusChange(menus.map(menu => positions.has(menu.id) ? { ...menu, sort: positions.get(menu.id)! } : menu));
      setSortOpen(false);
      setToast('菜单排序已保存');
    }} />}
    {editing && <WebStoreMenuFormDialog storeId={storeId} menu={editing === 'create' ? undefined : editing} menus={menus} onCancel={() => setEditing(null)} onSave={value => {
      if (!canManage) return;
      onMenusChange(editing === 'create'
        ? [...menus, { id: `menu-${crypto.randomUUID()}`, storeId, ...value, sort: Math.max(0, ...storeMenus.map(menu => menu.sort)) + 1, productIds: [] }]
        : menus.map(menu => menu.id === editing.id ? { ...menu, ...value } : menu));
      setToast(editing === 'create' ? '菜单已创建，可继续管理商品' : '菜单已保存');
      setEditing(null);
      setKeyword('');
    }} />}
    {deleting && <WebStoreMenuDeleteDialog menu={deleting} onCancel={() => setDeleting(null)} onConfirm={() => {
      if (!canManage) return;
      const remaining = menus.filter(menu => menu.id !== deleting.id);
      const positions = new Map(remaining.filter(menu => menu.storeId === deleting.storeId).sort((a, b) => a.sort - b.sort).map((menu, index) => [menu.id, index + 1]));
      onMenusChange(remaining.map(menu => positions.has(menu.id) ? { ...menu, sort: positions.get(menu.id)! } : menu));
      setToast('菜单已删除');
      setDeleting(null);
    }} />}
  </div>;
};
