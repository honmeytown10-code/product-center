import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

// Prototype Select / Popover equivalent; production uses the existing searchable
// selector. Keep the illustrative lookup and paired field patch unchanged.
const CANDIDATES = [
  { id: 'DEMO-TEA', category: '餐饮 / 饮品 / 茶饮', brand: '茶饮品牌' },
  { id: 'DEMO-COFFEE', category: '餐饮 / 饮品 / 咖啡', brand: '咖啡品牌' },
  { id: 'DEMO-MEAL', category: '餐饮 / 套餐 / 快餐', brand: '餐饮品牌' },
];
type LookupField = 'category' | 'brand';
type LookupCandidate = typeof CANDIDATES[number];

/** Illustrative lookup, never supplies a verified platform ID. */
export const WebJdCategoryBrandFields = ({ values, onChange }: {
  values: Record<string, string | boolean | string[]>;
  onChange: (patch: Record<string, string | boolean | string[]>) => void;
}) => {
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<LookupField | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const categoryTrigger = useRef<HTMLDivElement>(null), brandTrigger = useRef<HTMLDivElement>(null);
  const categoryInput = useRef<HTMLInputElement>(null), brandInput = useRef<HTMLInputElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const popupId = useId();
  const candidates = CANDIDATES.filter(item => item[opened || 'category'].toLowerCase().includes(query.trim().toLowerCase()));
  const trigger = opened === 'brand' ? brandTrigger : categoryTrigger;
  const open = (field: LookupField) => { setQuery(''); setActiveIndex(0); setPosition(null); setOpened(field); };
  const close = () => { setOpened(null); setQuery(''); };
  const select = (item: LookupCandidate) => {
    onChange({ category: item.id, categoryName: item.category, brandId: `${item.id}-BRAND`, brandName: item.brand, categoryVerified: false, brandVerified: false });
    close();
  };
  useLayoutEffect(() => {
    if (!opened || !trigger.current || !popup.current) return;
    const rect = trigger.current.getBoundingClientRect(), height = popup.current.getBoundingClientRect().height;
    const width = Math.min(rect.width, window.innerWidth - 32);
    const above = rect.bottom + height + 4 > window.innerHeight - 16 && rect.top - height - 4 >= 16;
    setPosition({ width, left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)), top: Math.max(16, Math.min(above ? rect.top - height - 4 : rect.bottom + 4, window.innerHeight - height - 16)) });
  }, [opened, candidates.length]);
  useEffect(() => {
    if (!opened) return;
    const outside = (event: PointerEvent) => {
      if (!popup.current?.contains(event.target as Node) && !categoryTrigger.current?.contains(event.target as Node) && !brandTrigger.current?.contains(event.target as Node)) setOpened(null);
    };
    const scroll = (event: Event) => { if (!popup.current?.contains(event.target as Node)) setOpened(null); };
    const resize = () => setOpened(null);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', resize);
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', resize); };
  }, [opened]);
  const fieldName = opened === 'brand' ? '品牌' : '类目';
  return <section aria-label="京东类目与品牌" className="space-y-3">
    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
      {(['category', 'brand'] as const).map(field => <div key={field}>
        <label htmlFor={field === 'category' ? 'jd-category' : 'jd-brand'} className="mb-2 block text-sm font-semibold text-[#4E5969]"><span className="text-[#B42318]">* </span>京东商品{field === 'category' ? '类目' : '品牌'}</label>
        <div ref={field === 'category' ? categoryTrigger : brandTrigger} className={`flex h-10 w-full items-center gap-2 rounded border bg-white px-3 text-sm text-[#4E5969] focus-within:border-[#00B460] focus-within:ring-1 focus-within:ring-[#00B460] ${opened === field ? 'border-[#00B460]' : 'border-[#DDE2E8]'}`}>
          <input ref={field === 'category' ? categoryInput : brandInput} id={field === 'category' ? 'jd-category' : 'jd-brand'} role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={opened === field} aria-controls={opened === field ? popupId : undefined} aria-activedescendant={opened === field && candidates[activeIndex] ? `${popupId}-${candidates[activeIndex].id}` : undefined} autoComplete="off" value={opened === field ? query : String(values[field === 'category' ? 'categoryName' : 'brandName'] || '')} placeholder={String(values[field === 'category' ? 'categoryName' : 'brandName'] || (field === 'category' ? '选择京东末级类目' : '选择京东商品品牌'))} title={String(values[field === 'category' ? 'categoryName' : 'brandName'] || '')} className="min-w-0 flex-1 truncate text-sm" style={{ border: 0, outline: 'none', boxShadow: 'none', padding: 0, borderRadius: 0, background: 'transparent' }} onFocus={() => { if (opened !== field) open(field); }} onClick={() => { if (opened !== field) open(field); }} onChange={event => { setOpened(field); setQuery(event.target.value); setActiveIndex(0); }} onBlur={event => { if (!popup.current?.contains(event.relatedTarget as Node) && !trigger.current?.contains(event.relatedTarget as Node)) close(); }} onKeyDown={event => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Escape' && opened === field) { event.preventDefault(); event.stopPropagation(); close(); }
            if (event.key === 'Tab') close();
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              if (opened !== field) { open(field); setActiveIndex(event.key === 'ArrowUp' ? CANDIDATES.length - 1 : 0); }
              else if (candidates.length) setActiveIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + candidates.length) % candidates.length);
            }
            if (event.key === 'Enter' && opened === field) { event.preventDefault(); if (candidates[activeIndex]) select(candidates[activeIndex]); }
          }} />
          <button type="button" tabIndex={-1} aria-label={`展开京东商品${field === 'category' ? '类目' : '品牌'}选项`} onMouseDown={event => event.preventDefault()} onClick={() => { if (opened === field) close(); else { (field === 'category' ? categoryInput : brandInput).current?.focus({ preventScroll: true }); open(field); } }} className="shrink-0 text-[#667085]"><ChevronDown size={14} className={opened === field ? 'rotate-180' : ''} /></button>
        </div>
      </div>)}
    </div>
    {values.category && <button type="button" onClick={() => onChange({ category: '', categoryName: '', brandId: '', brandName: '', categoryVerified: false, brandVerified: false })} className="text-sm text-[#667085]">清除选择</button>}
    {opened && createPortal(<div ref={popup} id={popupId} role="listbox" aria-label={`京东${fieldName}搜索结果`} style={{ ...(position || { top: 0, left: 0, width: 320 }), visibility: position ? 'visible' : 'hidden' }} className="fixed z-[420] max-h-60 overflow-y-auto rounded-md bg-white p-1 text-[#4E5969] shadow-[0_8px_24px_rgba(29,33,41,0.18)] ring-1 ring-[#E5E6EB]">
      {candidates.map((item, index) => {
        const selected = values.category === item.id;
        return <button id={`${popupId}-${item.id}`} key={item.id} type="button" role="option" tabIndex={-1} aria-selected={selected} onMouseDown={event => event.preventDefault()} onPointerMove={() => setActiveIndex(index)} onClick={() => select(item)} className={`flex min-h-10 w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm ${index === activeIndex ? 'bg-[#F2F3F5]' : ''} ${selected ? 'font-medium text-[#008F4C]' : ''}`}><span className="min-w-0 break-words">{item[opened]}</span>{selected && <Check size={16} className="shrink-0" />}</button>;
      })}{!candidates.length && <p role="status" className="px-3 py-6 text-center text-sm text-[#667085]">没有匹配结果，请调整搜索词。</p>}
    </div>, document.body)}
  </section>;
};
