import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { ATTRIBUTE_TYPES, type Attribute, useCustomAttributeDefinitions } from './customAttributeDefinitions';

type ComponentType = '文本' | '单选' | '多选' | '数字';
const EMPTY: Attribute = { id: '', name: '', type: '文本', attributeType: '通用属性', description: '', options: [], productTypes: [], enabled: true, required: false };
const inputClass = 'h-10 w-full rounded-md border border-[#D9DDE3] bg-white px-3 text-sm outline-none focus:border-[#00B460]';
function AttributeSwitch({ value, label, onChange }: { value: boolean; label: string; onChange: () => void }) {
  return <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={onChange} className="inline-flex items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460]"><span className={`relative h-6 w-11 rounded-full ${value ? 'bg-[#00B460]' : 'bg-[#D0D5DD]'}`}><span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform ${value ? 'translate-x-[23px]' : 'translate-x-[3px]'} left-0`} /></span><span className="text-xs text-[#667085]">{label.includes('必填') ? value ? '必填' : '非必填' : value ? '已启用' : '已停用'}</span></button>;
}
export const WebCustomAttributeManager: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [records, setRecords] = useCustomAttributeDefinitions();
  const [keyword, setKeyword] = useState('');
  const [draft, setDraft] = useState<Attribute | null>(null);
  const [options, setOptions] = useState('');
  const [error, setError] = useState('');
  const [remove, setRemove] = useState<Attribute | null>(null);
  const [notice, setNotice] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!draft && !remove) return;
    previousFocus.current = document.activeElement as HTMLElement;
    panel.current?.querySelector<HTMLElement>('input,button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDraft(null); setRemove(null); }
      if (event.key !== 'Tab') return;
      const items = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previousFocus.current?.focus(); };
  }, [!!draft, !!remove]);
  const filtered = useMemo(() => records.filter(record => `${record.name} ${record.description}`.includes(keyword.trim())), [records, keyword]);
  const open = (record?: Attribute) => { setDraft(record ? { ...record, productTypes: [...record.productTypes] } : { ...EMPTY, productTypes: [] }); setOptions(record?.options.join('、') || ''); setError(''); };
  const save = () => {
    if (!draft) return;
    const name = draft.name.trim(), values = ['单选', '多选'].includes(draft.type) ? options.split(/[、,，]/).map(value => value.trim()).filter(Boolean) : [];
    if (!name || name.length > 6) { setError('请输入属性标题，最多 6 个字。'); return; }
    if (records.some(record => record.id !== draft.id && record.name === name)) { setError('属性标题已存在，请更换。'); return; }
    if (['单选', '多选'].includes(draft.type) && (!values.length || new Set(values).size !== values.length)) { setError('请填写不重复的可选值。'); return; }
    const record = { ...draft, id: draft.id || `custom-${Date.now()}`, name, options: values };
    setRecords(current => draft.id ? current.map(item => item.id === draft.id ? record : item) : [record, ...current]);
    setNotice('自定义属性已保存'); setDraft(null);
  };
  const displayRadio = (type: string) => <fieldset className="flex flex-wrap items-center gap-4"><legend className="mb-2 text-sm font-medium text-[#4E5969]">是否显示在{type}发布页面</legend>{[true, false].map(show => <label key={String(show)} className="flex items-center gap-2 text-sm"><input type="radio" name={type} checked={draft!.productTypes.includes(type) === show} onChange={() => setDraft({ ...draft!, productTypes: show ? [...draft!.productTypes.filter(item => item !== type), type] : draft!.productTypes.filter(item => item !== type) })} className="accent-[#00B460]" />{show ? '显示' : '不显示'}</label>)}</fieldset>;
  return <div className={embedded ? '' : 'flex min-w-0 flex-1 flex-col overflow-auto bg-[#F5F6FA] p-4'}><div className="rounded-lg bg-white">
    <div className="console-page-description px-5 py-4"><p className="text-[13px] leading-6 text-[#4E5969]">用于自定义补充商品信息，可设置是否在商品表单中显示及是否必填。选择打印类属性后，还可根据订单商品信息在小票上打印粗/细吸管、番茄酱、甜辣酱等配件信息。</p></div>
    <div className="flex items-center justify-between gap-4 border-b border-[#E6E8EB] px-5 py-4"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-[#86909C]" /><input aria-label="搜索自定义属性" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索属性标题或说明" className={inputClass + ' max-w-[300px] pl-9'} /></div><button type="button" onClick={() => open()} className="flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-[#00B460] px-4 text-sm font-medium text-white hover:bg-[#009F55]"><Plus size={16} />新增属性</button></div>
    {notice && <p role="status" className="px-5 pt-3 text-sm text-[#008F4C]">{notice}</p>}
<div className="overflow-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#F7F8FA] text-[#4E5969]"><tr>{['商品属性', '属性类型', '属性说明', '是否启用', '是否必填', '操作'].map(name => <th key={name} className="px-5 py-3 font-medium">{name}</th>)}</tr></thead><tbody>{filtered.map(record => <tr key={record.id} className="border-b border-[#EEF0F2] hover:bg-[#FAFCFB]"><td className="px-5 py-4 font-medium">{record.name}</td><td className="px-5 py-4 text-[#4E5969]"><span className="block">{record.attributeType || '通用属性'}</span><span className="mt-1 block text-xs text-[#667085]">组件：{record.type}</span></td><td className="max-w-[240px] break-words px-5 py-4 text-[#667085]">{record.description || '—'}</td><td className="px-5 py-4"><AttributeSwitch value={record.enabled} label={record.name + '启用状态'} onChange={() => setRecords(current => current.map(item => item.id === record.id ? { ...item, enabled: !item.enabled } : item))} /></td><td className="px-5 py-4"><AttributeSwitch value={record.required} label={record.name + '是否必填'} onChange={() => setRecords(current => current.map(item => item.id === record.id ? { ...item, required: !item.required } : item))} /></td><td className="whitespace-nowrap px-5 py-4"><button onClick={() => open(record)} className="mr-4 text-[#008F4C] hover:underline">编辑</button><button onClick={() => setRemove(record)} className="text-[#D92D20] hover:underline">删除</button></td></tr>)}{!filtered.length && <tr><td colSpan={6} className="p-12 text-center text-[#667085]">{records.length ? '未找到符合条件的属性' : '暂无自定义属性，可点击新增属性创建'}</td></tr>}</tbody></table></div>
  </div>
  {(draft || remove) && <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/35 p-6"><div ref={panel} role="dialog" aria-modal="true" aria-labelledby="custom-attribute-title" className="flex max-h-[85vh] w-full max-w-[640px] flex-col rounded-lg bg-white shadow-xl"><header className="flex items-center justify-between border-b border-[#E6E8EB] px-6 py-4"><h3 id="custom-attribute-title" className="text-lg font-semibold">{remove ? '删除属性' : draft?.id ? '编辑属性' : '新增属性'}</h3><button aria-label="关闭属性弹窗" onClick={() => { setDraft(null); setRemove(null); }} className="rounded p-2 text-[#667085] hover:bg-[#F7F8FA]"><X size={18} /></button></header>
    {draft ? <div className="space-y-5 overflow-auto px-6 py-5">
      <label className="block text-sm"><span className="mb-2 block font-medium">属性标题 <span className="text-[#D92D20]">*</span></span><div className="relative"><input aria-label="属性标题" maxLength={6} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} className={inputClass + ' pr-14'} /><span className="absolute right-3 top-3 text-xs text-[#86909C]">{draft.name.length}/6</span></div></label>
      <div className="grid grid-cols-2 gap-5"><label className="text-sm"><span className="mb-2 block font-medium">属性类型 <span className="text-[#D92D20]">*</span></span><select aria-label="属性类型" value={draft.attributeType || '通用属性'} onChange={event => setDraft({ ...draft, attributeType: event.target.value as Attribute['attributeType'] })} className={inputClass}>{ATTRIBUTE_TYPES.map(type => <option key={type}>{type}</option>)}</select></label><label className="text-sm"><span className="mb-2 block font-medium">组件类型 <span className="text-[#D92D20]">*</span></span><select aria-label="组件类型" value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value as ComponentType })} className={inputClass}>{['文本', '单选', '多选', '数字'].map(type => <option key={type}>{type}</option>)}</select></label></div>
      {['单选', '多选'].includes(draft.type) && <label className="block text-sm"><span className="mb-2 block font-medium">可选值 <span className="text-[#D92D20]">*</span></span><input aria-label="可选值" value={options} onChange={event => setOptions(event.target.value)} placeholder="使用顿号或逗号分隔，例如：不辣、微辣、中辣" className={inputClass} /></label>}
      <label className="block text-sm"><span className="mb-2 block font-medium">属性说明</span><textarea aria-label="属性说明" maxLength={30} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} className="h-20 w-full resize-none rounded-md border border-[#D9DDE3] px-3 py-2 outline-none focus:border-[#00B460]" /><span className="flex justify-between text-xs text-[#667085]"><span>显示在属性框下方的说明文字</span><span>{draft.description.length}/30</span></span></label>
      {displayRadio('标准商品')}{displayRadio('套餐商品')}
      <fieldset><legend className="mb-2 text-sm font-medium">是否必填</legend><div className="flex gap-5">{[false, true].map(required => <label key={String(required)} className="flex items-center gap-2 text-sm"><input type="radio" name="attribute-required" checked={draft.required === required} onChange={() => setDraft({ ...draft, required })} className="accent-[#00B460]" />{required ? '必填' : '非必填'}</label>)}</div><p className="mt-2 text-xs text-[#667085]">设为必填后，在显示该属性的商品表单中必须填写。</p></fieldset>
      {error && <p role="alert" className="text-sm text-[#D92D20]">{error}</p>}
    </div> : <p className="px-6 py-6 text-sm leading-6">确认删除“{remove?.name}”？删除后不再提供此属性配置；已保存的历史商品资料不作删除。本次操作仅影响演示数据。</p>}
    <footer className="flex justify-end gap-3 border-t border-[#E6E8EB] px-6 py-4"><button onClick={() => { setDraft(null); setRemove(null); }} className="h-9 rounded-md border border-[#D9DDE3] px-5 text-sm">取消</button><button onClick={draft ? save : () => { setRecords(current => current.filter(item => item.id !== remove?.id)); setRemove(null); setNotice('属性已删除'); }} className={`h-9 rounded-md px-5 text-sm font-medium text-white ${remove ? 'bg-[#D92D20]' : 'bg-[#00B460] hover:bg-[#009F55]'}`}>{remove ? '确认删除' : '确定'}</button></footer>
  </div></div>}</div>;
};
