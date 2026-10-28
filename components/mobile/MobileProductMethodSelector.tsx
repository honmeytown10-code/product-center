import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Plus, Search, X } from 'lucide-react';
import type { LocalMethod } from './types';
import { mergeMethodSelection, ProductMethodConfig, visibleMethodConfig } from './productMethodState';
import { MobileGroupAddButton } from './MobileGroupAddButton';

export function MobileProductMethodSelector({ config, library, onBack, onConfirm }: {
  config: ProductMethodConfig[];
  library: LocalMethod[];
  onBack: () => void;
  onConfirm: (config: ProductMethodConfig[], library: LocalMethod[]) => void;
}) {
  const [definitions, setDefinitions] = useState(() => structuredClone(library));
  const [selected, setSelected] = useState<Record<string, string[]>>(() => Object.fromEntries(visibleMethodConfig(config, library).map(group => [group.groupId, [...group.valueIds]])));
  const [activeId, setActiveId] = useState(library[0]?.id || '');
  const [query, setQuery] = useState('');
  const [creation, setCreation] = useState<'group' | 'value' | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (creation) dialog.current?.showModal(); else dialog.current?.close(); }, [creation]);
  const available = (group: LocalMethod) => group.values.filter(value => value.status !== 'inactive');
  const matches = (group: LocalMethod) => available(group).filter(value => value.name.includes(query.trim()) || group.name.includes(query.trim()));
  const visibleGroups = definitions.filter(group => !query.trim() || matches(group).length);
  const displayedGroup = visibleGroups.find(group => group.id === activeId) ?? visibleGroups[0];
  const values = displayedGroup ? matches(displayedGroup) : [];
  const allValues = definitions.flatMap(group => available(group).map(value => ({ groupId: group.id, id: value.id })));
  const count = allValues.filter(value => selected[value.groupId]?.includes(value.id)).length;
  const toggle = (groupId: string, id: string) => setSelected(previous => ({ ...previous, [groupId]: previous[groupId]?.includes(id) ? previous[groupId].filter(value => value !== id) : [...(previous[groupId] ?? []), id] }));
  const confirm = () => onConfirm(mergeMethodSelection(config, definitions, selected), definitions);
  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('请输入名称'); return; }
    if (creation === 'group') {
      if (definitions.some(group => group.name === trimmed)) { setError('已存在同名做法分组'); return; }
      const id = crypto.randomUUID();
      setDefinitions(previous => [...previous, { id, name: trimmed, source: 'store', values: [] }]);
      setActiveId(id);
    } else if (displayedGroup?.source === 'store') {
      if (displayedGroup.values.some(value => value.name === trimmed)) { setError('本组已存在同名做法值'); return; }
      const id = crypto.randomUUID();
      setDefinitions(previous => previous.map(group => group.id !== displayedGroup.id ? group : { ...group, values: [...group.values, { id, name: trimmed, status: 'active', linkedProductIds: [] }] }));
      setSelected(previous => ({ ...previous, [displayedGroup.id]: [...(previous[displayedGroup.id] ?? []), id] }));
    }
    setQuery(''); setCreation(null); setName(''); setError('');
  };

  return <section aria-label="选择商品做法" className="absolute inset-0 z-10 flex flex-col bg-white text-gray-800">
    <header className="flex h-[50px] shrink-0 items-center border-b border-gray-100 px-4"><button aria-label="返回做法配置" onClick={onBack} className="-ml-2 flex h-11 w-11 items-center justify-center"><ChevronLeft size={24} /></button><h2 className="mr-9 flex-1 text-center text-base font-bold">选择做法</h2></header>
    <label className="mx-4 my-3 flex h-10 shrink-0 items-center gap-2 rounded-lg bg-gray-100 px-3"><Search size={16} className="shrink-0 text-gray-500" /><input aria-label="搜索做法" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索做法" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500" />{query && <button aria-label="清空搜索" onClick={() => setQuery('')} className="p-1"><X size={16} /></button>}</label>
    <div className="flex min-h-0 flex-1">
      <nav aria-label="做法分组" className="no-scrollbar w-[92px] shrink-0 overflow-y-auto bg-[#F5F6FA] pb-4">
        {visibleGroups.map(group => <button key={group.id} aria-pressed={displayedGroup?.id === group.id} onClick={() => setActiveId(group.id)} className={`min-h-12 w-full break-words px-3 py-3 text-left text-xs ${displayedGroup?.id === group.id ? 'bg-white font-bold text-green-700' : 'text-gray-600'}`}>{group.name}</button>)}
        <button onClick={() => { setCreation('group'); setName(''); setError(''); }} className="flex min-h-11 w-full items-center gap-1 px-2 text-xs font-medium text-green-700"><Plus size={14} />新增分组</button>
      </nav>
      <div className="no-scrollbar min-w-0 flex-1 overflow-y-auto px-3 pb-4">
        {displayedGroup ? <>
          <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-100"><h3 className="min-w-0 break-words text-xs font-bold">{displayedGroup.name}（{values.length}）</h3><label className="flex min-h-11 shrink-0 items-center gap-1 text-xs text-gray-600">全选<input aria-label={`全选${displayedGroup.name}`} type="checkbox" checked={values.length > 0 && values.every(value => selected[displayedGroup.id]?.includes(value.id))} disabled={!values.length} onChange={event => { const checked = event.target.checked; setSelected(previous => ({ ...previous, [displayedGroup.id]: checked ? [...new Set([...(previous[displayedGroup.id] ?? []), ...values.map(value => value.id)])] : (previous[displayedGroup.id] ?? []).filter(id => !values.some(value => value.id === id)) })); }} className="h-4 w-4 accent-[#00C06B]" /></label></div>
          {values.map(value => <label key={value.id} className="flex min-h-12 items-center justify-between gap-2 border-b border-gray-100 py-2 text-sm"><span className="min-w-0 break-words">{value.name}</span><input aria-label={`选择${displayedGroup.name} ${value.name}`} type="checkbox" checked={selected[displayedGroup.id]?.includes(value.id) ?? false} onChange={() => toggle(displayedGroup.id, value.id)} className="h-4 w-4 shrink-0 accent-[#00C06B]" /></label>)}
          {!values.length && <p className="py-8 text-center text-xs text-gray-600">{query ? '未找到匹配的做法' : '暂无可添加的做法值'}</p>}
          <MobileGroupAddButton compact blocked={displayedGroup.source === 'brand'} label="新增做法值" blockedLabel="总部做法不可新增" itemName="做法值" onAdd={() => { setCreation('value'); setName(''); setError(''); }} />
        </> : <div className="py-10 text-center text-xs leading-6 text-gray-600">{query ? '未找到匹配的做法' : '暂无做法分组'}</div>}
      </div>
    </div>
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 px-4 pb-7 pt-3"><label className="flex items-center gap-2 text-xs"><input aria-label="全选所有可售做法" type="checkbox" checked={allValues.length > 0 && count === allValues.length} disabled={!allValues.length} onChange={event => setSelected(event.target.checked ? Object.fromEntries(definitions.map(group => [group.id, available(group).map(value => value.id)])) : {})} className="h-4 w-4 accent-[#00C06B]" />全选<span className="text-gray-600">已选 {count} 个</span></label><button onClick={confirm} className="h-11 min-w-24 rounded-lg bg-[#00C06B] px-5 text-sm font-bold text-gray-950">确认</button></footer>
    {creation && <dialog ref={dialog} aria-label={creation === 'group' ? '新增做法分组' : '新增做法值'} onCancel={() => { setCreation(null); setError(''); }} className="m-auto w-[min(320px,calc(100%-48px))] rounded-2xl p-5 backdrop:bg-black/40"><form onSubmit={event => { event.preventDefault(); create(); }}><h3 className="text-base font-bold">{creation === 'group' ? '新增做法分组' : '新增做法值'}</h3><label className="mt-4 block text-sm">名称<input autoFocus aria-label="做法名称" value={name} onChange={event => { setName(event.target.value); setError(''); }} className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 outline-green-700" /></label>{error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}<div className="mt-5 flex gap-3"><button type="button" onClick={() => { setCreation(null); setError(''); }} className="h-11 flex-1 rounded-lg border border-gray-300 text-sm">取消</button><button className="h-11 flex-1 rounded-lg bg-[#00C06B] text-sm font-bold">确认</button></div></form></dialog>}
  </section>;
}
