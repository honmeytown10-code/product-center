import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Store, X } from 'lucide-react';
import { INITIAL_METHOD_ROWS, MethodRow } from '../pos/PosMethodView';
import { PRODUCT_SALES_SCOPE_STORES } from './WebProductSalesScope';
import { WebStoreScopeSelector } from './WebStoreScopeSelector';

// Preserve the incumbent store-method data and enable/disable semantics, with a Web presentation.
const secondary = 'h-9 rounded border border-[#D9DDE3] bg-white px-4 text-sm text-[#4E5969] hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:text-[#86909C]';
const primary = 'h-9 rounded bg-[#00B460] px-4 text-sm font-medium text-white hover:bg-[#009F55] disabled:cursor-not-allowed disabled:bg-[#C9CDD4]';

export const WebStoreMethodList: React.FC = () => {
  const [rows, setRows] = useState(INITIAL_METHOD_ROWS);
  const [storeId, setStoreId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('全部');
  const [status, setStatus] = useState('all');
  const [selection, setSelection] = useState<string[]>([]);
  const [action, setAction] = useState<{ rows: MethodRow[]; enabled: boolean } | null>(null);
  const [result, setResult] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const store = PRODUCT_SALES_SCOPE_STORES.find(item => item.id === storeId);
  const storeRows = rows.filter(row => row.storeId === storeId);
  const groups = [...new Set(storeRows.map(row => row.methodName))];
  const visible = useMemo(() => rows.filter(row => row.storeId === storeId
    && (group === '全部' || row.methodName === group)
    && (status === 'all' || (status === 'enabled' ? row.enabled : !row.enabled))
    && [row.methodName, row.methodValue, row.methodCode, row.remark].join(' ').toLowerCase().includes(query.trim().toLowerCase())), [rows, storeId, group, status, query]);
  useEffect(() => { setSelection([]); }, [storeId, group, status, query]);
  useEffect(() => {
    if (!action) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAction(null);
      if (event.key !== 'Tab') return;
      const buttons = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button') || [])];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [action]);
  const confirm = () => {
    if (!action) return;
    const ids = new Set(action.rows.map(row => row.id));
    setRows(current => current.map(row => ids.has(row.id) ? { ...row, enabled: action.enabled } : row));
    setResult(`已${action.enabled ? '启用' : '禁用'} ${ids.size} 项做法`);
    setSelection([]); setAction(null);
  };
  const toggle = (id: string) => setSelection(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  return <div className="flex h-full min-h-0 flex-col bg-[#F5F6FA] text-[#1D2129]">
    <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E6EB] bg-white px-5 py-4">
      <div className="flex items-center gap-2 text-sm"><span>机构门店</span><WebStoreScopeSelector stores={PRODUCT_SALES_SCOPE_STORES} value={storeId ? [storeId] : []} onChange={ids => { setStoreId(ids[0] || ''); setGroup('全部'); setStatus('all'); setKeyword(''); setQuery(''); setResult(''); setAction(null); }} selectionMode="single" widthClassName="w-[220px]" /></div>
      <label className="relative"><Search size={15} className="absolute left-3 top-2.5 text-[#667085]" /><input aria-label="搜索门店做法" value={keyword} placeholder="搜索做法名称、选项或编码" onChange={event => setKeyword(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') setQuery(keyword); }} className="h-9 w-[260px] rounded border border-[#D9DDE3] pl-9 pr-3 text-sm" /></label>
      <select aria-label="做法分组" value={group} onChange={event => setGroup(event.target.value)} className="h-9 rounded border border-[#D9DDE3] bg-white px-3 text-sm"><option value="全部">全部做法</option>{groups.map(name => <option key={name}>{name}</option>)}</select>
      <select aria-label="做法状态" value={status} onChange={event => setStatus(event.target.value)} className="h-9 rounded border border-[#D9DDE3] bg-white px-3 text-sm"><option value="all">全部状态</option><option value="enabled">已启用</option><option value="disabled">已禁用</option></select>
      <button type="button" disabled={!store} className={primary} onClick={() => setQuery(keyword)}>查询</button><button type="button" className={secondary} onClick={() => { setKeyword(''); setQuery(''); setGroup('全部'); setStatus('all'); }}>重置</button>
    </div>
    <div className="flex min-h-0 flex-1 flex-col p-4">
      {result && <div role="status" className="mb-3 flex items-center justify-between rounded bg-[#EAF8F2] px-4 py-3 text-sm text-[#008F4C]">{result}<button aria-label="关闭操作结果" onClick={() => setResult('')}><X size={16} /></button></div>}
      {!store ? <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-white p-8 text-center"><Store size={28} className="mb-4 text-[#667085]" /><h2 className="text-base font-semibold">选择要管理的门店</h2><p className="mt-3 text-sm text-[#667085]">请在上方选择门店，查看和管理该门店的做法。</p></div> : <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-[#E5E6EB] px-4"><span className="text-sm font-medium">{store?.name} · {selection.length ? `已选 ${selection.length} 项` : `共 ${visible.length} 项做法`}</span><div className="flex gap-2"><button disabled={!selection.length} className={secondary} onClick={() => setAction({ rows: visible.filter(row => selection.includes(row.id)), enabled: true })}>批量启用</button><button disabled={!selection.length} className={`${secondary} text-[#CB2634]`} onClick={() => setAction({ rows: visible.filter(row => selection.includes(row.id)), enabled: false })}>批量禁用</button></div></header>
        <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="sticky top-0 bg-[#F7F8FA] text-[#4E5969]"><tr><th className="w-12 px-4 py-3"><input type="checkbox" aria-label="全选当前结果" className="accent-[#00B460]" checked={!!visible.length && visible.every(row => selection.includes(row.id))} onChange={() => setSelection(visible.every(row => selection.includes(row.id)) ? [] : visible.map(row => row.id))} /></th>{['做法名称', '做法选项', '做法编码', '备注', '操作提示', '是否多选', '选项类型', '状态', '操作'].map(label => <th key={label} className="whitespace-nowrap px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{visible.map(row => <tr key={row.id} className="border-b border-[#F0F1F2] hover:bg-[#FAFBFC]"><td className="px-4 py-3"><input type="checkbox" aria-label={`选择${row.methodName} ${row.methodValue}`} className="accent-[#00B460]" checked={selection.includes(row.id)} onChange={() => toggle(row.id)} /></td><td className="px-3 py-3">{row.methodName}</td><td className="px-3 py-3 font-medium">{row.methodValue}</td><td className="px-3 py-3">{row.methodCode || '—'}</td><td className="max-w-[180px] break-words px-3 py-3">{row.remark || '—'}</td><td className="px-3 py-3">{row.prompt || '—'}</td><td className="px-3 py-3">{row.multiValue ? '是' : '否'}</td><td className="px-3 py-3">{row.optionType}</td><td className={`whitespace-nowrap px-3 py-3 ${row.enabled ? 'text-[#008F4C]' : 'text-[#667085]'}`}>{row.enabled ? '已启用' : '已禁用'}</td><td className="px-3 py-3"><button className={row.enabled ? 'text-[#CB2634] hover:underline' : 'text-[#008F4C] hover:underline'} onClick={() => setAction({ rows: [row], enabled: !row.enabled })}>{row.enabled ? '禁用' : '启用'}</button></td></tr>)}{!visible.length && <tr><td colSpan={10} className="p-12 text-center text-[#667085]">{storeRows.length ? '未找到符合条件的做法，请调整筛选条件。' : '该门店暂无做法数据。'}</td></tr>}</tbody></table></div>
      </div>}
    </div>
    {action && createPortal(<div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/35 p-6" onClick={event => { if (event.target === event.currentTarget) setAction(null); }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="store-method-confirm" className="w-[480px] rounded-lg bg-white shadow-xl"><header className="flex items-center justify-between border-b border-[#E5E6EB] px-5 py-4"><h2 id="store-method-confirm" className="text-base font-semibold">确认{action.enabled ? '启用' : '禁用'}做法？</h2><button aria-label="关闭做法确认" onClick={() => setAction(null)} className="p-1 text-[#667085]"><X size={18} /></button></header><div className="space-y-4 p-5 text-sm"><p>{store?.name} · 全部渠道 · {action.rows.length} 项做法</p><ul className="max-h-40 list-inside list-disc overflow-auto text-[#4E5969]">{action.rows.map(row => <li key={row.id}>{row.methodName}：{row.methodValue}</li>)}</ul><p className="leading-6 text-[#667085]">{action.enabled ? '启用后，关联商品点单时可以选择这些做法。' : '禁用后，关联商品点单时不能选择这些做法。需要恢复时可重新启用。'}</p></div><footer className="flex justify-end gap-3 border-t border-[#E5E6EB] px-5 py-4"><button className={secondary} onClick={() => setAction(null)}>取消</button><button className={action.enabled ? primary : 'h-9 rounded bg-[#CB2634] px-4 text-sm font-medium text-white hover:bg-[#B0202C]'} onClick={confirm}>确认{action.enabled ? '启用' : '禁用'}</button></footer></div></div>, document.body)}
  </div>;
};
