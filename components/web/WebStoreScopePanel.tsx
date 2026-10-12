import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { StoreScopeOption } from './WebStoreScopeSelector';

/** Embedded publishing selector. Counts and organizations derive from the supplied data scope. */
export const WebStoreScopePanel: React.FC<{ stores: StoreScopeOption[]; value: string[]; onChange: (ids: string[]) => void }> = ({ stores, value, onChange }) => {
  const [keyword, setKeyword] = useState('');
  const [tag, setTag] = useState('');
  const [organization, setOrganization] = useState('');
  const [idFilterOpen, setIdFilterOpen] = useState(false);
  const [idText, setIdText] = useState('');
  const [expanded, setExpanded] = useState(true);
  const allRef = useRef<HTMLInputElement>(null);
  const organizations = useMemo(() => [...new Set(stores.map(store => store.organization).filter(Boolean))], [stores]);
  const tags = useMemo(() => [...new Set(stores.flatMap(store => store.tags))], [stores]);
  const ids = idText.trim().split(/[\s,，;；]+/).filter(Boolean);
  const search = keyword.trim().toLowerCase();
  const filtered = stores.filter(store => (!organization || store.organization === organization) && (!tag || store.tags.includes(tag))
    && (!search || [store.name, store.code, store.id, store.searchKeywords || ''].some(text => text.toLowerCase().includes(search)))
    && (!ids.length || ids.includes(store.id) || ids.includes(store.code)));
  const selected = stores.filter(store => value.includes(store.id));
  const checkedCount = filtered.filter(store => value.includes(store.id)).length;
  useEffect(() => { if (allRef.current) allRef.current.indeterminate = checkedCount > 0 && checkedCount < filtered.length; }, [checkedCount, filtered.length]);
  const toggleAll = () => onChange(checkedCount === filtered.length ? value.filter(id => !filtered.some(store => store.id === id)) : [...new Set([...value, ...filtered.map(store => store.id)])]);
  const clearFilters = () => { setKeyword(''); setTag(''); setOrganization(''); setIdText(''); };
  return <section aria-label="选择下发门店" className="min-w-0 rounded-lg border border-[#E5E6EB] bg-white">
    <div className="flex flex-wrap items-center gap-3 p-4">
      <label className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-2.5 text-[#86909C]" /><input aria-label="搜索门店名称、编码或ID" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="门店名称 / 编码 / ID" className="h-9 w-full rounded-md border border-[#E5E6EB] pl-9 pr-3 text-sm outline-none focus:border-[#008647]" /></label>
      <select aria-label="门店标签" value={tag} onChange={event => setTag(event.target.value)} className="h-9 w-36 rounded-md border border-[#E5E6EB] px-3 text-sm text-[#4E5969]"><option value="">全部门店标签</option>{tags.map(item => <option key={item}>{item}</option>)}</select>
      <button type="button" aria-expanded={idFilterOpen} aria-controls="publish-store-id-filter" onClick={() => setIdFilterOpen(!idFilterOpen)} className={`h-9 rounded-md border px-3 text-sm ${ids.length ? 'border-[#008647] text-[#008647]' : 'border-[#E5E6EB] text-[#4E5969]'}`}>门店编码 / ID 筛选{ids.length ? ` · ${ids.length}` : ''}</button>
    </div>
    {idFilterOpen && <div id="publish-store-id-filter" className="px-4 pb-4"><label className="block text-xs text-[#667085]">输入完整门店编码或 ID，多个值用逗号、空格或换行分隔。<textarea aria-label="批量筛选门店编码或ID" value={idText} onChange={event => setIdText(event.target.value)} rows={2} className="mt-2 block w-full resize-none rounded-md border border-[#E5E6EB] px-3 py-2 text-sm text-[#1D2129]" /></label></div>}
    <div className="grid h-[280px] min-w-0 grid-cols-[180px_minmax(0,1fr)] border-t border-[#E5E6EB]">
      <nav aria-label="门店机构" className="overflow-auto border-r border-[#E5E6EB] bg-[#FAFBFC] p-2">
        <div className="flex items-center"><button type="button" aria-label={expanded ? '收起门店机构' : '展开门店机构'} aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="p-1 text-[#86909C]"><ChevronDown size={14} className={expanded ? '' : '-rotate-90'} /></button><button type="button" aria-pressed={!organization} onClick={() => setOrganization('')} className={`min-w-0 flex-1 rounded px-2 py-2 text-left text-sm ${!organization ? 'bg-[#E4F7EF] font-medium text-[#008647]' : 'text-[#4E5969]'}`}>全部机构 <span className="text-xs">{stores.length}</span></button></div>
        {expanded && organizations.map(item => <button key={item} type="button" aria-pressed={organization === item} onClick={() => setOrganization(item)} className={`ml-5 block w-[calc(100%-20px)] rounded px-2 py-2 text-left text-sm ${organization === item ? 'bg-[#E4F7EF] font-medium text-[#008647]' : 'text-[#4E5969] hover:bg-gray-100'}`}><span className="break-words">{item}</span> <span className="text-xs text-[#86909C]">{stores.filter(store => store.organization === item).length}</span></button>)}
      </nav>
      <div className="min-w-0 overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 z-[1] bg-[#F7F8FA] text-xs text-[#667085]"><tr><th className="w-10 px-3 py-3"><input ref={allRef} type="checkbox" aria-label="全选筛选结果中的门店" disabled={!filtered.length} checked={filtered.length > 0 && checkedCount === filtered.length} onChange={toggleAll} className="h-4 w-4 accent-[#008647]" /></th><th className="px-3 py-3 font-medium">门店名称</th><th className="px-3 py-3 font-medium">门店 ID</th><th className="px-3 py-3 font-medium">门店编码</th></tr></thead><tbody>
        {filtered.map(store => <tr key={store.id} className="border-b border-[#F2F3F5] hover:bg-[#FAFCFB]"><td className="px-3 py-3"><input type="checkbox" aria-label={`选择${store.name}`} checked={value.includes(store.id)} onChange={() => onChange(value.includes(store.id) ? value.filter(id => id !== store.id) : [...value, store.id])} className="h-4 w-4 accent-[#008647]" /></td><td className="px-3 py-3 text-[#1D2129]"><label className="break-words">{store.name}</label></td><td className="px-3 py-3 text-[#86909C]">{store.id}</td><td className="px-3 py-3 text-[#667085]">{store.code || '—'}</td></tr>)}
        {!filtered.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-[#86909C]">{stores.length ? <>没有符合条件的门店。<button type="button" onClick={clearFilters} className="ml-2 text-[#008647]">清除筛选</button></> : '当前范围没有可选门店'}</td></tr>}
      </tbody></table></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E6EB] px-4 py-3 text-xs text-[#667085]"><span role="status">已选 <strong className="text-[#008647]">{selected.length}</strong> 家门店 · 当前筛选 {filtered.length} 家{selected.length > checkedCount ? ` · 筛选外已选 ${selected.length - checkedCount} 家` : ''}</span><button type="button" disabled={!selected.length} onClick={() => onChange([])} className="text-[#008647] disabled:text-[#C9CDD4]">清空选择</button></div>
  </section>;
};
