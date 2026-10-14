import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Bold, Check, Eye, ImagePlus, Italic, Link, List, ListOrdered, Minus, Plus, Redo2, Strikethrough, Underline, Undo2, X } from 'lucide-react';
import { WebProductSelectorDialog, SelectableProduct } from './WebProductSelectorDialog';

export type AddonFormData = {
  name: string;
  alias: string;
  typeName: string;
  code: string;
  description: string;
  image: string;
  price: number;
  costPrice: number;
  stockType: 'unlimited' | 'custom';
  initialStock: number;
  stockRefill: 'none' | 'maximum' | 'unlimited';
  limitEnabled: boolean;
  limitQuantity: number;
  print: boolean;
  independentSale: boolean;
  category: string;
  packageSurcharge: number;
  unpackedScope: 'linked' | 'all';
  excludedProductIds: string[];
  detail: string;
};

export const DEFAULT_ADDON_FORM: AddonFormData = {
  name: '', alias: '', typeName: '', code: '', description: '', image: '', price: 0, costPrice: 0,
  stockType: 'unlimited', initialStock: 9999, stockRefill: 'none', limitEnabled: false, limitQuantity: 0,
  print: true, independentSale: false, category: '', packageSurcharge: 0, unpackedScope: 'linked',
  excludedProductIds: [], detail: '',
};

// Local prototype data. Production selectors use the current brand's product and addon relations.
export const ADDON_TARGET_PRODUCTS: Array<SelectableProduct & { hasAddon: boolean }> = [
  { id: '12936559260710001', name: '招牌珍珠奶茶', category: '奶茶系列', price: 15, hasAddon: true, image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=120&h=120&fit=crop' },
  { id: '12936559260710002', name: '生椰拿铁', category: '咖啡系列', price: 18, hasAddon: true, image: 'https://images.unsplash.com/photo-1511081692775-05d0f180a065?w=120&h=120&fit=crop' },
  { id: '12936559260710003', name: '经典柠檬茶', category: '果茶系列', price: 12, hasAddon: false, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765edfd7?w=120&h=120&fit=crop' },
  { id: '12936559260710004', name: '鲜果茶', category: '果茶系列', price: 16, hasAddon: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765edfd7?w=120&h=120&fit=crop' },
  { id: '12936559260710005', name: '品牌随行杯', category: '零售周边', price: 39, hasAddon: false, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=120&h=120&fit=crop' },
  { id: '12936559260710006', name: '品牌帆布袋', category: '零售周边', price: 29, hasAddon: false, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=120&h=120&fit=crop' },
];

export const DEMO_ADDON_FORM: AddonFormData = {
  ...DEFAULT_ADDON_FORM, name: '珍珠', typeName: '饮品加料', price: 2,
  independentSale: true, category: '独立售卖加料', unpackedScope: 'all',
  excludedProductIds: ['12936559260710005', '12936559260710006'],
};

const inputClass = 'h-10 rounded border border-[#D9DDE7] bg-white px-3 text-sm text-[#1D2129] outline-none focus:border-[#00B460]';
const helperClass = 'mt-2 text-xs leading-5 text-[#86909C]';

const FormRow: React.FC<{ label: string; id?: string; required?: boolean; children: React.ReactNode }> = ({ label, id, required, children }) => (
  <div className="grid grid-cols-[148px_minmax(0,1fr)] items-start gap-x-6 gap-y-2 max-sm:grid-cols-1">
    <label htmlFor={id} className="pt-2.5 text-right text-sm text-[#4E5969] max-sm:text-left">{required && <span className="mr-1 text-[#D9363E]">*</span>}{label}：</label>
    <div className="min-w-0">{children}</div>
  </div>
);

const Toggle: React.FC<{ label: string; value: boolean; onChange: () => void }> = ({ label, value, onChange }) => (
  <button type="button" role="switch" aria-label={label} aria-checked={value} onClick={onChange} className={`relative my-1 h-7 w-12 rounded-full transition-colors ${value ? 'bg-[#00B460]' : 'bg-[#D9D9D9]'}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} /></button>
);

const NumberStepper: React.FC<{ id: string; label: string; value: number; onChange: (value: number) => void; integer?: boolean; unit?: string }> = ({ id, label, value, onChange, integer, unit }) => (
  <div className="flex items-center gap-2">
    <div className="flex h-10 overflow-hidden rounded border border-[#D9DDE7]">
      <button type="button" title={`减少${label}`} aria-label={`减少${label}`} onClick={() => onChange(Math.max(0, Number((value - 1).toFixed(2))))} className="w-10 bg-[#F7F8FA] text-[#86909C]"><Minus size={16} className="mx-auto" /></button>
      <input id={id} aria-label={label} type="number" min="0" step={integer ? 1 : '0.01'} value={Number.isFinite(value) ? value : ''} onChange={event => onChange(event.target.value === '' ? NaN : Number(event.target.value))} className="w-24 border-x border-[#D9DDE7] text-center text-sm outline-none" />
      <button type="button" title={`增加${label}`} aria-label={`增加${label}`} onClick={() => onChange(Number(((Number.isFinite(value) ? value : 0) + 1).toFixed(2)))} className="w-10 bg-[#F7F8FA] text-[#86909C]"><Plus size={16} className="mx-auto" /></button>
    </div>
    {unit && <span className="text-sm text-[#4E5969]">{unit}</span>}
  </div>
);

// Prototype equivalents of the production image uploader and rich-text editor; no production writes.
const DetailEditor: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const selection = useRef<Range | null>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value; }, [value]);
  const command = (name: string, argument?: string) => { ref.current?.focus(); document.execCommand(name, false, argument); if (ref.current) onChange(ref.current.innerHTML); };
  const tools = [
    { name: '加粗', command: 'bold', icon: Bold }, { name: '下划线', command: 'underline', icon: Underline },
    { name: '斜体', command: 'italic', icon: Italic }, { name: '删除线', command: 'strikeThrough', icon: Strikethrough },
    { name: '无序列表', command: 'insertUnorderedList', icon: List }, { name: '有序列表', command: 'insertOrderedList', icon: ListOrdered },
    { name: '撤销', command: 'undo', icon: Undo2 }, { name: '重做', command: 'redo', icon: Redo2 },
  ];
  return <div className="overflow-hidden rounded border border-[#D9DDE7]">
    <div className="flex flex-wrap items-center gap-1 border-b border-[#E5E6EB] bg-[#FAFAFA] p-2">
      <select aria-label="正文样式" defaultValue="p" onChange={event => command('formatBlock', event.target.value)} className="h-8 border-r bg-transparent pr-3 text-sm"><option value="p">正文</option><option value="h2">标题</option><option value="blockquote">引用</option></select>
      {tools.map(tool => <button key={tool.name} type="button" title={tool.name} aria-label={tool.name} onMouseDown={event => event.preventDefault()} onClick={() => command(tool.command)} className="flex h-8 w-8 items-center justify-center rounded text-[#667085] hover:bg-gray-200"><tool.icon size={16} /></button>)}
      <button type="button" aria-label="插入链接" title="插入链接" onMouseDown={event => event.preventDefault()} onClick={() => { const current = window.getSelection(); selection.current = current?.rangeCount ? current.getRangeAt(0).cloneRange() : null; setLinkOpen(true); }} className="flex h-8 w-8 items-center justify-center text-[#667085]"><Link size={16} /></button>
      <button type="button" aria-label="插入详情图片" title="插入图片" onMouseDown={event => event.preventDefault()} onClick={() => fileRef.current?.click()} className="flex h-8 w-8 items-center justify-center text-[#667085]"><ImagePlus size={16} /></button>
    </div>
    {linkOpen && <div className="flex flex-wrap items-center gap-2 border-b p-2"><input aria-label="链接地址" placeholder="https://" value={linkUrl} onChange={event => { setLinkUrl(event.target.value); setLinkError(''); }} className={`${inputClass} min-w-0 flex-1`} /><button type="button" className="text-sm text-[#009B54]" onClick={() => { try { const url = new URL(linkUrl); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); ref.current?.focus(); const current = window.getSelection(); if (selection.current && current) { current.removeAllRanges(); current.addRange(selection.current); } command('createLink', url.href); setLinkOpen(false); setLinkUrl(''); } catch { setLinkError('请输入有效的 http 或 https 链接'); } }}>确定</button><button type="button" aria-label="取消插入链接" onClick={() => setLinkOpen(false)}><X size={16} /></button>{linkError && <p role="alert" className="w-full text-xs text-red-600">{linkError}</p>}</div>}
    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file && file.size <= 1024 * 1024) { const reader = new FileReader(); reader.onload = () => command('insertImage', String(reader.result)); reader.readAsDataURL(file); } event.target.value = ''; }} />
    <div ref={ref} role="textbox" aria-label="独立售卖商品详情" aria-multiline="true" contentEditable suppressContentEditableWarning onInput={event => onChange(event.currentTarget.innerHTML)} onPaste={event => { event.preventDefault(); command('insertText', event.clipboardData.getData('text/plain')); }} className="min-h-[180px] p-3 text-sm leading-6 outline-none [&_img]:max-w-full [&_ol]:list-inside [&_ol]:list-decimal [&_ul]:list-inside [&_ul]:list-disc" />
  </div>;
};

export const WebAddonForm: React.FC<{
  mode: 'create' | 'edit'; initialValue: AddonFormData; typeOptions: string[];
  onClose: () => void; onSave: (value: AddonFormData, continueCreating: boolean) => void;
}> = ({ mode, initialValue, typeOptions, onClose, onSave }) => {
  const [draft, setDraft] = useState<AddonFormData>(() => ({ ...initialValue, excludedProductIds: [...initialValue.excludedProductIds] }));
  const [baseline, setBaseline] = useState(initialValue);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showExample, setShowExample] = useState(false);
  const [showDescriptionExample, setShowDescriptionExample] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const update = <K extends keyof AddonFormData>(key: K, value: AddonFormData[K]) => { setError(''); setNotice(''); setDraft(current => ({ ...current, [key]: value })); };
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const close = () => dirty ? setConfirmLeave(true) : onClose();
  const excludedProducts = ADDON_TARGET_PRODUCTS.filter(product => draft.excludedProductIds.includes(product.id));
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key !== 'Escape' || selectorOpen || submitting) return; if (showExample) setShowExample(false); else if (showDescriptionExample) setShowDescriptionExample(false); else if (confirmLeave) setConfirmLeave(false); }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }, [selectorOpen, submitting, showExample, showDescriptionExample, confirmLeave]);
  const save = async (continueCreating = false) => {
    if (submitting) return;
    if (!draft.name.trim()) { setError('请输入加料商品名称'); document.getElementById('addon-name')?.focus(); return; }
    if (!Number.isFinite(draft.price) || draft.price < 0 || !Number.isFinite(draft.costPrice) || draft.costPrice < 0) { setError('价格必须为大于或等于 0 的金额'); return; }
    if (draft.stockType === 'custom' && (!Number.isInteger(draft.initialStock) || draft.initialStock < 0)) { setError('初始库存必须为大于或等于 0 的整数'); return; }
    if (draft.limitEnabled && (!Number.isInteger(draft.limitQuantity) || draft.limitQuantity < 0)) { setError('限购份数必须为大于或等于 0 的整数'); return; }
    if (draft.independentSale && !draft.category) { setError('请选择独立售卖分类'); document.getElementById('addon-category')?.focus(); return; }
    if (draft.independentSale && (!Number.isFinite(draft.packageSurcharge) || draft.packageSurcharge < 0)) { setError('分装加价必须为大于或等于 0 的金额'); return; }
    setSubmitting(true);
    const next = { ...draft, name: draft.name.trim(), alias: draft.alias.trim(), excludedProductIds: [...draft.excludedProductIds] };
    try {
      await Promise.resolve(onSave(next, continueCreating));
      if (continueCreating) { const reset = { ...DEFAULT_ADDON_FORM, excludedProductIds: [] }; setDraft(reset); setBaseline(reset); setNotice(`「${next.name}」已保存，可继续创建加料商品`); formRef.current?.scrollIntoView({ block: 'start' }); }
    } catch { setError('保存失败，请重试。已保留当前输入。'); }
    finally { setSubmitting(false); }
  };
  const upload = (file?: File) => { if (!file) return; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) { setError('请选择不超过 1M 的 JPG、PNG 或 WebP 图片'); return; } const reader = new FileReader(); reader.onload = () => update('image', String(reader.result)); reader.readAsDataURL(file); };
  const countedInput = (id: string, field: 'name' | 'alias', limit: number, placeholder?: string) => <div className="relative w-[360px] max-w-full"><input id={id} maxLength={limit} value={draft[field]} onChange={event => update(field, event.target.value)} placeholder={placeholder} className={`${inputClass} w-full pr-16`} /><span className="pointer-events-none absolute right-3 top-2.5 text-xs text-[#86909C]">{draft[field].length}/{limit}</span></div>;
  return <div className="relative flex h-full min-h-0 min-w-0 w-full flex-1 flex-col bg-[#F5F6F8] text-[#1D2129]">
    <header className="flex shrink-0 items-center gap-3 border-b border-[#E5E6EB] bg-white px-6 py-4"><button type="button" aria-label="返回加料列表" title="返回" onClick={close} disabled={submitting} className="p-2 text-[#667085]"><ArrowLeft size={20} /></button><h1 className="text-lg font-bold">{mode === 'create' ? '创建加料商品' : '编辑加料商品'}</h1>{mode === 'edit' && <span className="text-sm text-[#86909C]">{initialValue.name}</span>}</header>
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <form ref={formRef} onSubmit={event => { event.preventDefault(); void save(); }} className="min-h-full rounded-lg border border-[#E5E6EB] bg-white px-6 pb-10 pt-6">
        <fieldset disabled={submitting} className="min-w-0">
          <section aria-label="加料基础信息" className="max-w-[1060px] space-y-5"><h2 className="mb-6 text-base font-bold">基础信息</h2>
            <FormRow label="加料商品名称" id="addon-name" required>{countedInput('addon-name', 'name', 30)}</FormRow>
            <FormRow label="商品别名" id="addon-alias">{countedInput('addon-alias', 'alias', 70, '请输入商品别名')}</FormRow>
            <FormRow label="加料商品类型" id="addon-type"><select id="addon-type" value={draft.typeName} onChange={event => update('typeName', event.target.value)} className={`${inputClass} w-[360px] max-w-full`}><option value="">请选择</option>{Array.from(new Set([...typeOptions, ...(draft.typeName ? [draft.typeName] : [])])).map(type => <option key={type}>{type}</option>)}</select></FormRow>
            <FormRow label="加料商品编码" id="addon-code"><input id="addon-code" value={draft.code} onChange={event => update('code', event.target.value)} className={`${inputClass} w-[360px] max-w-full`} /></FormRow>
            <FormRow label="加料描述" id="addon-description"><div className="flex flex-wrap items-center gap-3"><input id="addon-description" placeholder="请输入加料描述" value={draft.description} onChange={event => update('description', event.target.value)} className={`${inputClass} w-[360px] max-w-full`} /><button type="button" onClick={() => setShowDescriptionExample(true)} className="text-sm text-[#009B54]">查看示例</button></div></FormRow>
            <FormRow label="加料商品图片"><div className="relative w-28"><button type="button" aria-label="上传加料商品图片" onClick={() => fileRef.current?.click()} className="flex aspect-square w-28 items-center justify-center overflow-hidden rounded bg-[#F7F8FA] text-[#667085]">{draft.image ? <img src={draft.image} alt="加料商品图片" className="h-full w-full object-cover" /> : <Plus size={26} />}</button>{draft.image && <button type="button" aria-label="移除加料图片" title="移除图片" onClick={() => update('image', '')} className="absolute -right-2 -top-2 rounded-full border bg-white p-1"><X size={12} /></button>}</div><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => { upload(event.target.files?.[0]); event.target.value = ''; }} /><p className={helperClass}>建议尺寸：1:1，单张大小不超过1M</p></FormRow>
          </section>
          <section aria-label="加料售卖配置" className="mt-8 max-w-[1060px] space-y-5 border-t border-[#F0F0F0] pt-6"><h2 className="mb-6 text-base font-bold">售卖配置</h2>
            <FormRow label="初始价格" id="addon-price" required><NumberStepper id="addon-price" label="初始价格" value={draft.price} onChange={value => update('price', value)} unit="元" /></FormRow>
            <FormRow label="成本价" id="addon-cost"><NumberStepper id="addon-cost" label="成本价" value={draft.costPrice} onChange={value => update('costPrice', value)} unit="元" /></FormRow>
            <FormRow label="库存设置" required><div className="flex flex-wrap gap-6 py-2 text-sm">{[['unlimited', '无限库存'], ['custom', '自定义库存']].map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="radio" name="addon-stock-type" checked={draft.stockType === value} onChange={() => update('stockType', value as AddonFormData['stockType'])} className="accent-[#00B460]" />{label}</label>)}</div>{draft.stockType === 'custom' && <div className="mt-3 space-y-3"><div className="flex flex-wrap items-center gap-3 text-sm"><span>初始库存：</span><NumberStepper id="addon-stock" label="初始库存" value={draft.initialStock} onChange={value => update('initialStock', value)} integer /></div><div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">{[['none', '不自动补足库存'], ['maximum', '自动补足库存为最大值'], ['unlimited', '自动补足库存为无限库存']].map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="radio" name="addon-stock-refill" checked={draft.stockRefill === value} onChange={() => update('stockRefill', value as AddonFormData['stockRefill'])} className="accent-[#00B460]" />{label}</label>)}</div></div>}</FormRow>
            <FormRow label="限购"><div className="flex flex-wrap items-center gap-4"><Toggle label="限购" value={draft.limitEnabled} onChange={() => update('limitEnabled', !draft.limitEnabled)} />{draft.limitEnabled && <NumberStepper id="addon-limit" label="限购份数" value={draft.limitQuantity} onChange={value => update('limitQuantity', value)} unit="份" integer />}</div></FormRow>
            <FormRow label="是否打印"><div className="flex gap-6 py-2 text-sm">{[true, false].map(value => <label key={String(value)} className="flex items-center gap-2"><input type="radio" name="addon-print" checked={draft.print === value} onChange={() => update('print', value)} className="accent-[#00B460]" />{value ? '打印' : '不打印'}</label>)}</div></FormRow>
          </section>
          <section aria-label="独立售卖设置" className="mt-8 max-w-[1060px] space-y-5 border-t border-[#F0F0F0] pt-6"><h2 className="mb-6 text-base font-bold">独立售卖</h2>
            <FormRow label="独立售卖"><Toggle label="独立售卖" value={draft.independentSale} onChange={() => update('independentSale', !draft.independentSale)} /><p className={helperClass}>开启独立售卖后，顾客可选择单独打包加料或加入到购物车中的商品。<button type="button" disabled={!draft.independentSale} onClick={() => setShowExample(true)} className="ml-2 inline-flex items-center gap-1 text-[#009B54] disabled:text-[#B8BEC9]"><Eye size={14} />查看示例</button></p></FormRow>
            {draft.independentSale && <>
              <FormRow label="独立售卖分类" id="addon-category" required><select id="addon-category" value={draft.category} onChange={event => update('category', event.target.value)} className={`${inputClass} w-[360px] max-w-full`}><option value="">请选择</option><option>独立售卖加料</option><option>小料专区</option><option>饮品配料</option></select><p className={helperClass}>选择商品分类，作为小程序端显示的单独售卖的加料分类。</p></FormRow>
              <FormRow label="分装加价" id="addon-package-fee"><NumberStepper id="addon-package-fee" label="分装加价" value={draft.packageSurcharge} onChange={value => update('packageSurcharge', value)} unit="元" /></FormRow>
              <FormRow label="不分装限制" id="addon-unpacked-scope" required>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2" role="group" aria-label="不分装商品范围">
                  <span className="text-sm text-[#4E5969]">可加入</span>
                  <select id="addon-unpacked-scope" value={draft.unpackedScope} onChange={event => update('unpackedScope', event.target.value as AddonFormData['unpackedScope'])} className={`${inputClass} w-[240px] max-w-full`}><option value="linked">有该加料的商品</option><option value="all">所有商品</option></select>
                  <button type="button" onClick={() => { setSelectedIds([...draft.excludedProductIds]); setSelectorOpen(true); }} className="inline-flex h-10 shrink-0 items-center gap-2 rounded border border-[#00B460] px-4 text-sm text-[#009B54]"><Plus size={16} />排除指定商品{excludedProducts.length > 0 ? `（${excludedProducts.length}）` : ''}</button>
                  {excludedProducts.length > 0 && <button type="button" onClick={() => update('excludedProductIds', [])} className="text-sm text-[#86909C] hover:text-[#4E5969]">清空排除</button>}
                </div>
                {excludedProducts.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs text-[#86909C]">但不包含：</span>{excludedProducts.map(product => <span key={product.id} className="inline-flex max-w-full items-center gap-2 rounded border border-[#E5E6EB] bg-[#F7F8FA] px-3 py-2 text-sm"><span className="truncate" title={`${product.name} · ${product.id}`}>{product.name}</span><button type="button" title="移除" aria-label={`移除排除商品${product.name}`} onClick={() => update('excludedProductIds', draft.excludedProductIds.filter(id => id !== product.id))} className="shrink-0 text-[#86909C]"><X size={14} /></button></span>)}</div>}
                <p className={helperClass}>顾客选择不分装时，只能将加料加入上述范围的商品；排除商品的全部规格均不可加入，不影响单独分装购买。</p>
              </FormRow>
              <FormRow label="独立售卖商品详情"><DetailEditor value={draft.detail} onChange={value => update('detail', value)} /></FormRow>
            </>}
          </section>
        </fieldset>
      </form>
    </div>
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#E5E6EB] bg-white px-6 py-4"><div className="min-w-0 text-sm">{error && <p role="alert" className="text-[#D9363E]">{error}</p>}{notice && <p role="status" className="text-[#009B54]">{notice}</p>}</div><div className="flex shrink-0 gap-3"><button type="button" disabled={submitting} onClick={close} className={`${inputClass} px-5`}>返回</button><button type="button" disabled={submitting} onClick={() => void save()} className="inline-flex h-10 items-center gap-2 rounded bg-[#00B460] px-5 text-sm font-medium text-white disabled:opacity-60"><Check size={16} />{submitting ? '保存中...' : '保存'}</button>{mode === 'create' && <button type="button" disabled={submitting} onClick={() => void save(true)} className="h-10 rounded bg-[#00B460] px-4 text-sm font-medium text-white disabled:opacity-60">保存并继续创建</button>}</div></footer>
    {createPortal(<>
      <WebProductSelectorDialog open={selectorOpen} title="选择排除商品" description="仅影响当前加料的不分装范围，所选商品的全部规格都将排除。" products={ADDON_TARGET_PRODUCTS} showSkuFields={false} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} onCancel={() => setSelectorOpen(false)} onConfirm={() => { update('excludedProductIds', [...selectedIds]); setSelectorOpen(false); }} />
      {showExample && <AddonOrderExample value={draft} onClose={() => setShowExample(false)} />}
      {showDescriptionExample && <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="加料描述示例"><div className="w-[360px] max-w-full rounded-lg bg-white p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold">加料描述示例</h2><button type="button" aria-label="关闭描述示例" onClick={() => setShowDescriptionExample(false)}><X size={18} /></button></div><div className="border-t py-4"><p className="font-medium">{draft.name || '珍珠'} <span className="float-right">¥{draft.price.toFixed(2)}</span></p><p className="mt-2 text-sm text-[#86909C]">{draft.description || 'Q弹软糯，丰富饮品口感'}</p></div></div></div>}
      {confirmLeave && <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="放弃修改"><div className="w-[420px] max-w-full rounded-lg bg-white p-6"><h2 className="font-bold">放弃本次修改？</h2><p className="my-4 text-sm text-[#667085]">当前修改尚未保存，返回后将丢失。</p><div className="flex justify-end gap-3"><button type="button" onClick={() => setConfirmLeave(false)} className={inputClass}>继续编辑</button><button type="button" onClick={onClose} className="h-10 rounded bg-[#D9363E] px-4 text-sm text-white">放弃修改</button></div></div></div>}
    </>, document.body)}
  </div>;
};

const AddonOrderExample: React.FC<{ value: AddonFormData; onClose: () => void }> = ({ value, onClose }) => {
  const [cartScope, setCartScope] = useState<'mixed' | 'retail' | 'linked'>('mixed');
  const [packMode, setPackMode] = useState<'separate' | 'unpacked'>('unpacked');
  const [targetId, setTargetId] = useState('');
  const [message, setMessage] = useState('');
  const cartProducts = useMemo(() => ADDON_TARGET_PRODUCTS.filter(product => cartScope === 'retail' ? product.category === '零售周边' : cartScope === 'linked' ? product.hasAddon : product.name !== '鲜果茶'), [cartScope]);
  const eligible = cartProducts.filter(product => (value.unpackedScope === 'all' || product.hasAddon) && !value.excludedProductIds.includes(product.id));
  useEffect(() => { setTargetId(''); setMessage(''); }, [cartScope, packMode]);
  return <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="独立售卖下单示例"><div className="flex max-h-[90vh] w-[560px] max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl">
    <header className="flex items-center justify-between border-b px-5 py-4"><h2 className="text-base font-bold">独立售卖下单示例</h2><button type="button" aria-label="关闭下单示例" onClick={onClose}><X size={20} /></button></header>
    <div className="overflow-y-auto p-5 text-sm"><div className="mb-5 flex items-center justify-between"><span className="font-medium">{value.name || '珍珠'}</span><span>¥{value.price.toFixed(2)}</span></div><label className="mb-3 flex items-center gap-3 text-[#667085]">购物车<select aria-label="示例购物车" value={cartScope} onChange={event => setCartScope(event.target.value as typeof cartScope)} className={`${inputClass} min-w-0 flex-1`}><option value="mixed">饮品 + 零售周边</option><option value="retail">仅零售周边</option><option value="linked">仅有关联加料的饮品</option></select></label><div className="mb-5 flex flex-wrap gap-2 text-xs text-[#86909C]">{cartProducts.map(product => <span key={product.id} className="rounded border px-2 py-1">{product.name}</span>)}</div>
      <h3 className="mb-3 font-medium">包装方式</h3><div className="flex gap-5"><label className="flex items-center gap-2"><input type="radio" name="addon-pack-mode" checked={packMode === 'separate'} onChange={() => setPackMode('separate')} className="accent-[#00B460]" />单独分装{value.packageSurcharge > 0 ? `（+¥${value.packageSurcharge.toFixed(2)}）` : ''}</label><label className={`flex items-center gap-2 ${!eligible.length ? 'text-[#B8BEC9]' : ''}`}><input type="radio" name="addon-pack-mode" disabled={!eligible.length} checked={packMode === 'unpacked'} onChange={() => setPackMode('unpacked')} className="accent-[#00B460]" />不分装</label></div>
      {!eligible.length && <p role="status" className="mt-3 text-[#C76600]">购物车中暂无可加入此加料的商品，请选择单独分装。</p>}
      {packMode === 'unpacked' && eligible.length > 0 && <><h3 className="mb-2 mt-5 font-medium">选择加入的商品</h3><div className="divide-y">{eligible.map(product => <label key={product.id} className="flex cursor-pointer items-center gap-3 py-3"><input type="radio" name="addon-target-product" checked={targetId === product.id} onChange={() => { setTargetId(product.id); setMessage(''); }} className="accent-[#00B460]" /><img src={product.image} alt="" className="h-10 w-10 rounded object-cover" /><span className="min-w-0 flex-1"><span className="block truncate">{product.name}</span><span className="text-xs text-[#86909C]">{product.category} · 1 件</span></span><span>¥{product.price?.toFixed(2)}</span></label>)}</div></>}
      {message && <p role="status" className="mt-4 bg-[#F2FBF6] p-3 text-[#009B54]">{message}</p>}
    </div><footer className="flex justify-between border-t px-5 py-4"><button type="button" onClick={onClose} className={inputClass}>返回设置</button><button type="button" disabled={packMode === 'unpacked' && !eligible.some(product => product.id === targetId)} onClick={() => setMessage(packMode === 'separate' ? `已选择单独分装${value.packageSurcharge > 0 ? `，加价 ¥${value.packageSurcharge.toFixed(2)}` : ''}` : `已将${value.name || '珍珠'}加入${eligible.find(product => product.id === targetId)?.name}`)} className="h-10 rounded bg-[#00B460] px-5 font-medium text-white disabled:bg-[#C9CDD4]">确定</button></footer>
  </div></div>;
};
