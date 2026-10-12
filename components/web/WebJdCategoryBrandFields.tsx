import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2, ChevronDown } from 'lucide-react';

/** Illustrative lookup, never supplies a verified platform ID. */
export const WebJdCategoryBrandFields = ({ values, onChange }: {
  values: Record<string, string | boolean | string[]>;
  onChange: (patch: Record<string, string | boolean | string[]>) => void;
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const candidates = [
    { id: 'DEMO-TEA', category: '餐饮 / 饮品 / 茶饮', brand: '茶饮品牌' },
    { id: 'DEMO-COFFEE', category: '餐饮 / 饮品 / 咖啡', brand: '咖啡品牌' },
    { id: 'DEMO-MEAL', category: '餐饮 / 套餐 / 快餐', brand: '餐饮品牌' },
  ].filter(item => `${item.category}${item.brand}`.includes(query.trim()));
  return <section aria-label="京东类目与品牌" className="space-y-3">
    <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
      <div><label htmlFor="jd-category" className="mb-2 block text-sm font-semibold text-[#4E5969]"><span className="text-[#B42318]">* </span>京东商品类目</label><button id="jd-category" type="button" aria-expanded={opened} aria-controls="jd-category-brand-options" onClick={() => setOpened(!opened)} className="flex h-10 w-full items-center justify-between gap-2 rounded border border-[#DDE2E8] px-3 text-left text-sm text-[#4E5969] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460]"><span>{String(values.categoryName || '选择京东末级类目')}</span><ChevronDown size={14} className="shrink-0" /></button></div>
      <div><label htmlFor="jd-brand" className="mb-2 block text-sm font-semibold text-[#4E5969]"><span className="text-[#B42318]">* </span>京东商品品牌</label><button id="jd-brand" type="button" aria-expanded={opened} aria-controls="jd-category-brand-options" onClick={() => setOpened(!opened)} className="flex h-10 w-full items-center justify-between gap-2 rounded border border-[#DDE2E8] px-3 text-left text-sm text-[#4E5969] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460]"><span>{String(values.brandName || '选择京东商品品牌')}</span><ChevronDown size={14} className="shrink-0" /></button></div>
    </div>
    <div className="flex flex-wrap items-center gap-4"><button disabled={loading} type="button" className="inline-flex items-center gap-1.5 text-sm text-[#008F4C] disabled:text-[#667085]" onClick={() => { setLoading(true); timer.current = setTimeout(() => { setLoading(false); setOpened(true); }, 250); }}>{loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}按商品名称推荐</button>{values.category && <button type="button" onClick={() => onChange({ category: '', categoryName: '', brandId: '', brandName: '', categoryVerified: false, brandVerified: false })} className="text-sm text-[#667085]">清除选择</button>}</div>
    {opened && <div id="jd-category-brand-options" className="border border-[#DDE2E8] rounded p-3"><label className="flex h-9 items-center gap-2 rounded border border-[#DDE2E8] px-3"><Search size={15} className="text-[#667085]" /><input aria-label="搜索京东类目或品牌" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索类目或品牌" className="min-w-0 flex-1 text-sm outline-none" /></label><div className="mt-2">{candidates.map(item => <button key={item.id} type="button" onClick={() => { onChange({ category: item.id, categoryName: item.category, brandId: `${item.id}-BRAND`, brandName: item.brand, categoryVerified: false, brandVerified: false }); setOpened(false); }} className="flex w-full flex-wrap justify-between gap-2 rounded px-2 py-3 text-left text-sm text-[#4E5969] hover:bg-[#F2F3F5]"><span>{item.category}</span><span className="text-[#667085]">{item.brand}</span></button>)}{!candidates.length && <p className="py-4 text-center text-sm text-[#667085]">没有匹配结果，请调整搜索词。</p>}</div></div>}
  </section>;
};
