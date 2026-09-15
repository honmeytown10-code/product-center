import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Link2,
  RefreshCw,
  Search,
  ShieldOff,
  Sparkles,
  Store,
  Unlink,
  X,
} from 'lucide-react';
import type { Product, ThirdPartyChannelId } from '../../types';

type BatchProduct = {
  id: string;
  platformRowId: string;
  name: string;
  specName: string;
};

type StoreRelation = {
  id: string;
  batchProductId: string;
  storeName: string;
  storeCode: string;
  platformProductId: string;
  platformSkuId: string;
  platformSkuCode: string;
  status: 'mapped' | 'unmapped';
  qimaiProductId?: string;
  qimaiSpec?: string;
  qimaiSpecIndex?: number;
  updatedAt?: string;
};

type BindingTarget = {
  batchProductId: string;
  relationIds: string[];
  title: string;
};

type Props = {
  products: Product[];
  channelId: ThirdPartyChannelId;
  exemptRowIds: string[];
  exemptCount: number;
  onChannelChange: (channelId: ThirdPartyChannelId) => void;
  onOpenExemption: () => void;
  onMessage: (message: string) => void;
};

const channelTabs: Array<{ id: ThirdPartyChannelId; label: string }> = [
  { id: 'meituan', label: '美团' },
  { id: 'meituan_pinhaofan', label: '美团拼好饭' },
  { id: 'taobao', label: '淘宝闪购' },
  { id: 'douyin', label: '抖音外卖' },
];

const batchProducts: BatchProduct[] = [
  { id: 'bp1', platformRowId: 'm1', name: '招牌珍珠奶茶', specName: '大杯' },
  { id: 'bp2', platformRowId: 'm2', name: '手打柠檬茶（冰）', specName: '标准' },
  { id: 'bp3', platformRowId: 'm3', name: '黑糖波波鲜奶', specName: '中杯' },
  { id: 'bp4', platformRowId: 'm4', name: '多肉葡萄', specName: '大杯' },
  { id: 'bp5', platformRowId: 'm5', name: '经典牛肉汉堡', specName: '标准' },
  { id: 'bp6', platformRowId: 'm8', name: '经典珍珠奶绿', specName: '中杯' },
  { id: 'bp7', platformRowId: 'm9', name: '手打柠檬茶', specName: '大杯' },
  { id: 'bp9', platformRowId: 'm11', name: '黑糖波波鲜奶', specName: '大杯' },
  { id: 'bp10', platformRowId: 'm12', name: '多肉葡萄', specName: '中杯' },
  { id: 'bp11', platformRowId: 'm13', name: '经典牛肉汉堡', specName: '双层' },
  { id: 'bp12', platformRowId: 'm14', name: '双人分享套餐', specName: '2 人份' },
  { id: 'bp14', platformRowId: 'm16', name: '午市工作餐', specName: '单人份' },
  { id: 'bp15', platformRowId: 'm17', name: '季节限定草莓奶昔', specName: '中杯' },
  { id: 'bp16', platformRowId: 'm18', name: '老娘舅随心套餐', specName: '1 人份' },
];

const stores = [
  ['南山万象店', '100101'], ['福田卓悦店', '100102'], ['宝安壹方城店', '100103'],
  ['龙华壹方天地店', '100104'], ['罗湖万象城店', '100105'], ['海岸城店', '100106'],
  ['前海卓悦店', '100107'], ['坂田万科店', '100108'], ['布吉万象汇店', '100109'],
  ['科技园店', '100110'], ['车公庙店', '100111'], ['蛇口海上世界店', '100112'],
  ['西丽宝能城店', '100113'], ['龙岗万科店', '100114'], ['光明蓝鲸店', '100115'],
  ['坪山益田店', '100116'], ['盐田壹海城店', '100117'], ['大鹏中心店', '100118'],
] as const;

const relationPlans: Record<string, { total: number; bound: number; productIds: string[] }> = {
  bp1: { total: 18, bound: 12, productIds: ['1', '2', '3'] },
  bp2: { total: 18, bound: 7, productIds: ['2', '4'] },
  bp3: { total: 18, bound: 15, productIds: ['3', '1', '4'] },
  bp4: { total: 18, bound: 18, productIds: ['4', '9'] },
  bp5: { total: 18, bound: 0, productIds: [] },
  bp6: { total: 18, bound: 18, productIds: ['1'] },
  bp7: { total: 18, bound: 9, productIds: ['2'] },
  bp8: { total: 6, bound: 4, productIds: ['2', '4'] },
  bp9: { total: 18, bound: 0, productIds: [] },
  bp10: { total: 18, bound: 9, productIds: ['4'] },
  bp11: { total: 18, bound: 18, productIds: ['6'] },
  bp12: { total: 18, bound: 13, productIds: ['13', '7'] },
  bp13: { total: 18, bound: 0, productIds: [] },
  bp14: { total: 8, bound: 8, productIds: ['13'] },
  bp15: { total: 3, bound: 1, productIds: ['7'] },
  bp16: { total: 18, bound: 18, productIds: ['13', '6', '5'] },
};

const initialRelations: StoreRelation[] = batchProducts.flatMap(product => {
  const plan = relationPlans[product.id];
  return stores.slice(0, plan.total).map(([storeName, storeCode], index) => {
    const mapped = index < plan.bound;
    return {
      id: `${product.id}-${storeCode}`,
      batchProductId: product.id,
      storeName,
      storeCode,
      // 聚合行无统一平台身份；同名同规格在每家门店可拥有不同 SPU/SKU。
      platformProductId: `308247${String(39920 + Number(product.id.replace(/\D/g, '')) + index).padStart(5, '0')}`,
      platformSkuId: `345812${String(32430 + Number(product.id.replace(/\D/g, '')) * 18 + index).padStart(5, '0')}`,
      platformSkuCode: `MT-${String(77820 + Number(product.id.replace(/\D/g, '')) * 18 + index)}`,
      status: mapped ? 'mapped' : 'unmapped',
      qimaiProductId: mapped ? plan.productIds[index % plan.productIds.length] : undefined,
      qimaiSpec: mapped ? (index % 2 ? '中杯 / 常温' : '大杯 / 冰') : undefined,
      qimaiSpecIndex: mapped ? index % 2 : undefined,
      updatedAt: mapped ? `2026-09-${String(10 - (index % 3)).padStart(2, '0')} ${String(9 + index).padStart(2, '0')}:24` : undefined,
    } as StoreRelation;
  });
});

const Checkbox: React.FC<{ checked: boolean; onClick: () => void; label: string }> = ({ checked, onClick, label }) => (
  <button type="button" onClick={onClick} aria-label={label} className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-[#00B460] bg-[#00B460] text-white' : 'border-[#C9CDD4] bg-white'}`}>
    {checked && <Check size={12} strokeWidth={3} />}
  </button>
);

export const WebBatchProductMapping: React.FC<Props> = ({
  products,
  channelId,
  exemptRowIds,
  exemptCount,
  onChannelChange,
  onOpenExemption,
  onMessage,
}) => {
  const [relations, setRelations] = useState<StoreRelation[]>(initialRelations);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [qimaiKeyword, setQimaiKeyword] = useState('');
  const [bindingStatus, setBindingStatus] = useState<'all' | 'partial' | 'mapped' | 'unmapped'>('all');
  const [detailProductId, setDetailProductId] = useState<string | null>(() => {
    const requested = new URLSearchParams(window.location.search).get('batchDetail');
    return batchProducts.some(item => item.id === requested) ? requested : null;
  });
  const [detailStoreKeyword, setDetailStoreKeyword] = useState('');
  const [detailPlatformKeyword, setDetailPlatformKeyword] = useState('');
  const [detailQimaiKeyword, setDetailQimaiKeyword] = useState('');
  const [detailStatus, setDetailStatus] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [selectedRelationIds, setSelectedRelationIds] = useState<string[]>([]);
  const [bindingTarget, setBindingTarget] = useState<BindingTarget | null>(() => {
    const requested = new URLSearchParams(window.location.search).get('batchBind');
    const relation = initialRelations.find(item => item.id === requested);
    if (!relation) return null;
    return { batchProductId: relation.batchProductId, relationIds: [relation.id], title: `绑定 ${relation.storeName}` };
  });
  const [candidateKeyword, setCandidateKeyword] = useState('');
  const [candidateProductId, setCandidateProductId] = useState('');
  const [candidateSpec, setCandidateSpec] = useState('');
  const [showScope, setShowScope] = useState(false);
  const [scopeTab, setScopeTab] = useState<'store' | 'org' | 'tag'>('tag');
  const [tagMode, setTagMode] = useState<'any' | 'all'>('any');
  const [selectedTags, setSelectedTags] = useState(['华南区域', '直营门店']);

  const productById = (id?: string) => products.find(item => item.id === id);
  const statsFor = (batchProductId: string) => {
    const scoped = relations.filter(item => item.batchProductId === batchProductId);
    const mapped = scoped.filter(item => item.status === 'mapped');
    return {
      total: scoped.length,
      mapped: mapped.length,
      unmapped: scoped.length - mapped.length,
      distinctQimai: new Set(mapped.map(item => item.qimaiProductId)).size,
    };
  };

  const filteredProducts = useMemo(() => batchProducts.filter(item => {
    if (exemptRowIds.includes(item.platformRowId)) return false;
    const stats = statsFor(item.id);
    const itemRelations = relations.filter(relation => relation.batchProductId === item.id);
    const qimaiMatched = !qimaiKeyword || itemRelations.some(relation => {
      const product = productById(relation.qimaiProductId);
      return `${product?.name || ''}${product?.skuCode || ''}`.toLowerCase().includes(qimaiKeyword.trim().toLowerCase());
    });
    const statusMatched = bindingStatus === 'all'
      || (bindingStatus === 'mapped' && stats.unmapped === 0)
      || (bindingStatus === 'unmapped' && stats.mapped === 0)
      || (bindingStatus === 'partial' && stats.mapped > 0 && stats.unmapped > 0);
    return (!keyword || `${item.name}${item.specName}`.toLowerCase().includes(keyword.trim().toLowerCase()))
      && statusMatched
      && qimaiMatched;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [bindingStatus, exemptRowIds, keyword, qimaiKeyword, relations, products]);

  const activeProduct = batchProducts.find(item => item.id === detailProductId);
  const scenarioCounts = useMemo(() => filteredProducts.reduce((counts, item) => {
    const stats = statsFor(item.id);
    if (stats.mapped === 0) counts.unmapped += 1;
    else if (stats.unmapped === 0) counts.mapped += 1;
    else counts.partial += 1;
    return counts;
  }, { mapped: 0, partial: 0, unmapped: 0 }), [filteredProducts, relations]);
  const detailRelations = useMemo(() => relations.filter(item => {
    if (!detailProductId || item.batchProductId !== detailProductId) return false;
    const qimai = productById(item.qimaiProductId);
    return (detailStatus === 'all' || item.status === detailStatus)
      && (!detailStoreKeyword || `${item.storeName}${item.storeCode}`.toLowerCase().includes(detailStoreKeyword.trim().toLowerCase()))
      && (!detailPlatformKeyword || `${item.platformProductId}${item.platformSkuId}${item.platformSkuCode}`.toLowerCase().includes(detailPlatformKeyword.trim().toLowerCase()))
      && (!detailQimaiKeyword || `${qimai?.name || ''}${qimai?.specs?.[item.qimaiSpecIndex || 0]?.name || item.qimaiSpec || ''}${qimai?.skuCode || ''}`.toLowerCase().includes(detailQimaiKeyword.trim().toLowerCase()));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [detailPlatformKeyword, detailProductId, detailQimaiKeyword, detailStatus, detailStoreKeyword, relations, products]);

  const candidateProducts = useMemo(() => products.filter(item =>
    !candidateKeyword || `${item.name}${item.id}${item.skuCode}${item.category}`.toLowerCase().includes(candidateKeyword.trim().toLowerCase()),
  ).slice(0, 10), [candidateKeyword, products]);

  const openDetails = (batchProductId: string) => {
    setDetailProductId(batchProductId);
    setSelectedRelationIds([]);
    setDetailStoreKeyword('');
    setDetailPlatformKeyword('');
    setDetailQimaiKeyword('');
    setDetailStatus('all');
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('batchDetail', batchProductId);
    nextUrl.searchParams.delete('batchBind');
    window.history.pushState({}, '', nextUrl);
  };

  const closeDetails = () => {
    setDetailProductId(null);
    setSelectedRelationIds([]);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete('batchDetail');
    nextUrl.searchParams.delete('batchBind');
    window.history.pushState({}, '', nextUrl);
  };

  const startBinding = (batchProductId: string, relationIds: string[], title: string) => {
    if (!relationIds.length) return;
    const current = relations.find(item => relationIds.includes(item.id) && item.qimaiProductId);
    const currentProduct = productById(current?.qimaiProductId);
    setBindingTarget({ batchProductId, relationIds, title });
    setCandidateKeyword('');
    setCandidateProductId(current?.qimaiProductId || '');
    setCandidateSpec(current?.qimaiSpec || currentProduct?.specs?.[0]?.name || '默认规格');
  };

  const saveBinding = () => {
    if (!bindingTarget || !candidateProductId) return;
    const candidate = productById(candidateProductId);
    if (!candidate) return;
    setRelations(current => current.map(relation => bindingTarget.relationIds.includes(relation.id) ? {
      ...relation,
      status: 'mapped',
      qimaiProductId: candidateProductId,
      qimaiSpec: candidateSpec || candidate.specs?.[0]?.name || '默认规格',
      qimaiSpecIndex: Math.max(0, candidate.specs?.findIndex(spec => spec.name === candidateSpec) ?? 0),
      updatedAt: '刚刚',
    } : relation));
    onMessage(`已将 ${bindingTarget.relationIds.length} 家门店的该平台规格绑定至“${candidate.name} / ${candidateSpec || '默认规格'}”。`);
    setBindingTarget(null);
    setSelectedRelationIds([]);
  };

  const unbindRelations = (relationIds: string[]) => {
    if (!relationIds.length || !window.confirm(`确定解除 ${relationIds.length} 家门店的绑定关系吗？`)) return;
    setRelations(current => current.map(relation => relationIds.includes(relation.id) ? {
      ...relation,
      status: 'unmapped',
      qimaiProductId: undefined,
      qimaiSpec: undefined,
      qimaiSpecIndex: undefined,
      updatedAt: undefined,
    } : relation));
    onMessage(`已解除 ${relationIds.length} 家门店的绑定关系。`);
    setSelectedRelationIds([]);
  };

  const batchUnbind = () => {
    const relationIds = relations.filter(relation => selectedProductIds.includes(relation.batchProductId) && relation.status === 'mapped').map(relation => relation.id);
    unbindRelations(relationIds);
    setSelectedProductIds([]);
  };

  return (
    <div className="space-y-3">
      {!activeProduct && <>
      <section className="relative rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex h-12 items-center gap-4 border-b border-[#E5E6EB] px-4">
          <div className="shrink-0 text-[15px] font-bold text-[#1D2129]">商品批量映射</div>
          <div className="flex h-full min-w-0 items-end gap-5 overflow-x-auto">
            {channelTabs.map(channel => <button key={channel.id} type="button" onClick={() => onChannelChange(channel.id)} className={`h-full shrink-0 whitespace-nowrap border-b-2 px-0.5 text-[12px] ${channelId === channel.id ? 'border-[#00B460] font-bold text-[#00A35B]' : 'border-transparent text-[#4E5969]'}`}>{channel.label}</button>)}
          </div>
          <button type="button" onClick={onOpenExemption} className="ml-auto inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md border border-[#F0C98B] bg-[#FFF9F0] px-3 text-[12px] font-medium text-[#A8620A]"><ShieldOff size={13} className="mr-1.5" />免绑定商品 {exemptCount}</button>
        </div>

        <div className="flex h-[52px] items-center gap-2 px-4">
          <button type="button" onClick={() => setShowScope(true)} className="inline-flex h-8 w-[180px] shrink-0 items-center justify-between rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] text-[#4E5969]"><span className="truncate">华南区域、直营门店 · 18 家</span><ChevronDown size={13} className="ml-2 shrink-0" /></button>
          <label className="flex h-8 min-w-[180px] flex-[1.2] items-center rounded-md border border-[#C9CDD4] bg-white px-3"><Search size={14} className="mr-2 shrink-0 text-[#86909C]" /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="平台商品名称 / 规格" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" /></label>
          <label className="flex h-8 min-w-[150px] flex-1 items-center rounded-md border border-[#C9CDD4] bg-white px-3"><Search size={14} className="mr-2 shrink-0 text-[#86909C]" /><input value={qimaiKeyword} onChange={event => setQimaiKeyword(event.target.value)} placeholder="已绑定企迈商品 / SKU" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" /></label>
          <select value={bindingStatus} onChange={event => setBindingStatus(event.target.value as typeof bindingStatus)} className="h-8 w-[140px] shrink-0 rounded-md border border-[#C9CDD4] bg-white px-2 text-[12px] text-[#4E5969]"><option value="all">全部绑定情况</option><option value="partial">部分门店已绑定</option><option value="mapped">全部门店已绑定</option><option value="unmapped">全部门店未绑定</option></select>
          <button type="button" onClick={() => onMessage(`已按当前条件查询，共 ${filteredProducts.length} 个平台商品规格。`)} className="h-8 shrink-0 whitespace-nowrap rounded-md bg-[#00B460] px-3 text-[12px] font-bold text-white">查询</button>
          <button type="button" onClick={() => { setKeyword(''); setQimaiKeyword(''); setBindingStatus('all'); }} className="h-8 shrink-0 whitespace-nowrap rounded-md px-2 text-[12px] text-[#4E5969]">重置</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex min-h-12 items-center gap-3 border-b border-[#E5E6EB] px-4 py-2">
          <span className="shrink-0 text-[13px] text-[#4E5969]">共 {filteredProducts.length} 个平台商品规格{selectedProductIds.length > 0 && <>，已选 <strong className="text-[#00A35B]">{selectedProductIds.length}</strong> 个</>}</span>
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-[11px]">
            <span className="whitespace-nowrap rounded bg-[#E8FFF3] px-2 py-1 text-[#008A4B]">全部已绑定 {scenarioCounts.mapped}</span>
            <span className="whitespace-nowrap rounded bg-[#FFF7E8] px-2 py-1 text-[#B36B00]">部分已绑定 {scenarioCounts.partial}</span>
            <span className="whitespace-nowrap rounded bg-[#F2F3F5] px-2 py-1 text-[#667085]">全部未绑定 {scenarioCounts.unmapped}</span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => onMessage('自动关联任务已创建；免绑定商品在创建任务前已排除。')} className="inline-flex h-8 items-center whitespace-nowrap rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] font-medium text-[#4E5969]"><Sparkles size={13} className="mr-1.5" />自动关联</button>
            <button type="button" onClick={() => onMessage('更新平台商品任务已创建，可前往商品管理任务查看进度。')} className="inline-flex h-8 items-center whitespace-nowrap rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] font-medium text-[#4E5969]"><RefreshCw size={13} className="mr-1.5" />更新平台商品</button>
            <button type="button" disabled={!selectedProductIds.length} onClick={batchUnbind} className="inline-flex h-8 items-center whitespace-nowrap rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] text-[#4E5969] disabled:text-[#BFC5D0]"><Unlink size={13} className="mr-1.5" />批量解绑</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[36px_minmax(200px,1.2fr)_145px_205px_minmax(170px,1fr)_170px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]">
              <div /><div>平台商品</div><div>平台规格</div><div>门店绑定覆盖</div><div>企迈商品分布</div><div>操作</div>
            </div>
            {filteredProducts.map(item => {
              const stats = statsFor(item.id);
              const itemRelations = relations.filter(relation => relation.batchProductId === item.id);
              const mappedNames = Array.from(new Set(itemRelations.filter(relation => relation.status === 'mapped').map(relation => productById(relation.qimaiProductId)?.name).filter(Boolean))) as string[];
              const selected = selectedProductIds.includes(item.id);
              return <div key={item.id} className="grid min-h-[74px] grid-cols-[36px_minmax(200px,1.2fr)_145px_205px_minmax(170px,1fr)_170px] items-center border-t border-[#F0F1F2] px-4 py-3 text-[13px]">
                <Checkbox checked={selected} label={`选择${item.name}`} onClick={() => setSelectedProductIds(selected ? selectedProductIds.filter(id => id !== item.id) : [...selectedProductIds, item.id])} />
                <div className="min-w-0 pr-4"><div className="truncate font-bold text-[#1D2129]">{item.name}</div><div className="mt-1 text-[11px] text-[#86909C]">按名称＋规格聚合 · {stats.total} 家门店</div></div>
                <div className="min-w-0 pr-3 font-medium text-[#1D2129]">{item.specName}</div>
                <button type="button" onClick={() => openDetails(item.id)} className="group w-[190px] rounded-md border border-[#E5E6EB] bg-[#FAFBFC] px-3 py-2 text-left hover:border-[#8EDCB2] hover:bg-[#F5FFF9]">
                  <div className="flex items-center justify-between"><span className="text-[12px] text-[#667085]">共 {stats.total} 家</span><ChevronRight size={14} className="text-[#98A2B3] group-hover:text-[#00A35B]" /></div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[#FFE8C7]"><span className="bg-[#22B573]" style={{ width: `${(stats.mapped / stats.total) * 100}%` }} /></div>
                  <div className="mt-2 flex gap-4 text-[12px]"><span className="font-semibold text-[#008A4B]">已绑定 {stats.mapped}</span><span className="font-semibold text-[#D46B08]">未绑定 {stats.unmapped}</span></div>
                </button>
                <div className="min-w-0 pr-4">{stats.mapped ? <><div className="font-medium text-[#1D2129]">绑定至 {stats.distinctQimai} 种企迈商品</div><div className="mt-1 truncate text-[11px] text-[#86909C]" title={mappedNames.join('、')}>{mappedNames.slice(0, 2).join('、')}{mappedNames.length > 2 ? ` 等 ${mappedNames.length} 种` : ''}</div></> : <span className="text-[#B36B00]">当前范围均未绑定</span>}</div>
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <button type="button" onClick={() => openDetails(item.id)} className="font-medium text-[#00A35B]">绑定详情</button>
                  <button type="button" disabled={!stats.unmapped} onClick={() => startBinding(item.id, itemRelations.filter(relation => relation.status === 'unmapped').map(relation => relation.id), `绑定 ${stats.unmapped} 家未绑定门店`)} className="font-medium text-[#00A35B] disabled:text-[#BFC5D0]">绑定</button>
                  <button type="button" disabled={!stats.mapped} onClick={() => unbindRelations(itemRelations.filter(relation => relation.status === 'mapped').map(relation => relation.id))} className="text-[#4E5969] disabled:text-[#BFC5D0]">解绑</button>
                </div>
              </div>;
            })}
          </div>
        </div>
      </section>
      </>}

      {activeProduct && detailProductId && (
        <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
          <div className="flex min-h-[720px] flex-col">
            <div className="flex shrink-0 items-start gap-4 border-b border-[#E5E6EB] px-6 py-4">
              <button type="button" onClick={closeDetails} className="inline-flex h-9 shrink-0 items-center rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]"><ChevronLeft size={16} className="mr-1" />返回列表</button>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8FFF3] text-[#00A35B]"><Link2 size={19} /></div>
              <div className="min-w-0"><h3 className="text-[17px] font-bold text-[#1D2129]">{activeProduct.name} · {activeProduct.specName}</h3><p className="mt-1 text-[12px] text-[#86909C]">按平台商品名称和规格聚合；各门店的平台标识在下方明细中核对。</p></div>
              <div className="ml-auto rounded-md bg-[#F2F8FF] px-3 py-2 text-[12px] text-[#245B8A]">门店级绑定关系可独立维护</div>
            </div>
            <div className="grid shrink-0 grid-cols-4 gap-3 border-b border-[#E5E6EB] bg-[#FAFBFC] px-6 py-4">
              {(() => { const stats = statsFor(detailProductId); return <><div className="rounded-md border border-[#E5E6EB] bg-white px-4 py-3"><div className="text-[12px] text-[#86909C]">范围内门店</div><div className="mt-1 text-[20px] font-bold text-[#1D2129]">{stats.total}</div></div><div className="rounded-md border border-[#BFEBD3] bg-[#F5FFF9] px-4 py-3"><div className="text-[12px] text-[#4E8B68]">已绑定门店</div><div className="mt-1 text-[20px] font-bold text-[#008A4B]">{stats.mapped}</div></div><div className="rounded-md border border-[#F3D29C] bg-[#FFF9F0] px-4 py-3"><div className="text-[12px] text-[#A66B1F]">未绑定门店</div><div className="mt-1 text-[20px] font-bold text-[#D46B08]">{stats.unmapped}</div></div><div className="rounded-md border border-[#D9DDE2] bg-white px-4 py-3"><div className="text-[12px] text-[#86909C]">已绑定企迈商品</div><div className="mt-1 text-[20px] font-bold text-[#1D2129]">{stats.distinctQimai} 种</div></div></>; })()}
            </div>
            <div className="flex shrink-0 flex-wrap items-end gap-2 border-b border-[#E5E6EB] px-6 py-3">
              <label className="flex h-9 min-w-[190px] flex-1 items-center rounded-md border border-[#C9CDD4] px-3"><Search size={15} className="mr-2 shrink-0 text-[#86909C]" /><input value={detailStoreKeyword} onChange={event => setDetailStoreKeyword(event.target.value)} placeholder="门店名称 / 编号" className="min-w-0 flex-1 text-[13px] outline-none" /></label>
              <label className="flex h-9 min-w-[240px] flex-[1.3] items-center rounded-md border border-[#C9CDD4] px-3"><Search size={15} className="mr-2 shrink-0 text-[#86909C]" /><input value={detailPlatformKeyword} onChange={event => setDetailPlatformKeyword(event.target.value)} placeholder="平台 SPU ID / SKU ID / SKU码" className="min-w-0 flex-1 text-[13px] outline-none" /></label>
              <label className="flex h-9 min-w-[200px] flex-1 items-center rounded-md border border-[#C9CDD4] px-3"><Search size={15} className="mr-2 shrink-0 text-[#86909C]" /><input value={detailQimaiKeyword} onChange={event => setDetailQimaiKeyword(event.target.value)} placeholder="企迈商品名称 / 规格 / SKU" className="min-w-0 flex-1 text-[13px] outline-none" /></label>
              <select value={detailStatus} onChange={event => setDetailStatus(event.target.value as typeof detailStatus)} className="h-9 w-[160px] rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]"><option value="all">全部绑定状态</option><option value="mapped">已绑定</option><option value="unmapped">未绑定</option></select>
              <button type="button" onClick={() => { setDetailStoreKeyword(''); setDetailPlatformKeyword(''); setDetailQimaiKeyword(''); setDetailStatus('all'); }} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]">重置</button>
            </div>
            <div className="flex shrink-0 items-center gap-2 border-b border-[#E5E6EB] px-6 py-2.5"><span className="mr-auto text-[12px] text-[#667085]">已选 {selectedRelationIds.length} 家门店</span><button type="button" disabled={!selectedRelationIds.length} onClick={() => startBinding(detailProductId, selectedRelationIds, `批量换绑 ${selectedRelationIds.length} 家门店`)} className="h-8 whitespace-nowrap rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] font-medium text-[#00A35B] disabled:text-[#BFC5D0]">批量绑定 / 换绑</button><button type="button" disabled={!selectedRelationIds.some(id => relations.find(item => item.id === id)?.status === 'mapped')} onClick={() => unbindRelations(selectedRelationIds.filter(id => relations.find(item => item.id === id)?.status === 'mapped'))} className="h-8 whitespace-nowrap rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] text-[#4E5969] disabled:text-[#BFC5D0]">批量解绑</button></div>
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="min-w-[1180px]">
                <div className="grid grid-cols-[44px_170px_260px_100px_minmax(230px,1fr)_150px_120px] bg-[#F7F8FA] px-6 py-3 text-[12px] font-medium text-[#4E5969]"><div /><div>企迈外卖门店</div><div>该门店平台商品标识</div><div>绑定状态</div><div>绑定企迈商品 / 规格</div><div>绑定更新时间</div><div>操作</div></div>
                {detailRelations.map(relation => { const qimai = productById(relation.qimaiProductId); const selected = selectedRelationIds.includes(relation.id); return <div key={relation.id} className="grid min-h-[88px] grid-cols-[44px_170px_260px_100px_minmax(230px,1fr)_150px_120px] items-center border-t border-[#F0F1F2] px-6 py-3 text-[13px]">
                  <Checkbox checked={selected} label={`选择${relation.storeName}`} onClick={() => setSelectedRelationIds(selected ? selectedRelationIds.filter(id => id !== relation.id) : [...selectedRelationIds, relation.id])} />
                  <div className="min-w-0 pr-3"><div className="truncate font-medium text-[#1D2129]">{relation.storeName}</div><div className="mt-1 text-[11px] text-[#86909C]">门店编号 {relation.storeCode}</div></div>
                  <div className="min-w-0 pr-3"><div className="truncate text-[#1D2129]">{activeProduct.name} · {activeProduct.specName}</div><div className="mt-1 truncate font-mono text-[11px] text-[#667085]">SPU ID {relation.platformProductId} · SKU ID {relation.platformSkuId}</div><div className="mt-0.5 truncate font-mono text-[11px] text-[#667085]">SKU码 {relation.platformSkuCode}</div></div>
                  <div><span className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[12px] font-medium ${relation.status === 'mapped' ? 'bg-[#E8FFF3] text-[#008A4B]' : 'bg-[#FFF7E8] text-[#D46B08]'}`}>{relation.status === 'mapped' ? '已绑定' : '未绑定'}</span></div>
                  <div className="min-w-0 pr-3">{qimai ? <><div className="truncate font-bold text-[#1D2129]">{qimai.name}</div><div className="mt-1 truncate text-[11px] text-[#86909C]">{qimai.specs?.[relation.qimaiSpecIndex || 0]?.name || relation.qimaiSpec || '默认规格'} · 企迈 SKU {qimai.skuCode}{qimai.specs && qimai.specs.length > 1 ? `-${(relation.qimaiSpecIndex || 0) + 1}` : ''}</div></> : <span className="text-[#98A2B3]">--</span>}</div>
                  <div className="text-[12px] text-[#667085]">{relation.updatedAt || '--'}</div>
                  <div className="flex items-center gap-3 whitespace-nowrap">{relation.status === 'mapped' ? <><button type="button" onClick={() => startBinding(detailProductId, [relation.id], `换绑 ${relation.storeName}`)} className="font-medium text-[#00A35B]">换绑</button><button type="button" onClick={() => unbindRelations([relation.id])} className="text-[#4E5969]">解绑</button></> : <button type="button" onClick={() => startBinding(detailProductId, [relation.id], `绑定 ${relation.storeName}`)} className="font-medium text-[#00A35B]">绑定</button>}</div>
                </div>; })}
                {detailRelations.length === 0 && <div className="px-6 py-16 text-center text-[13px] text-[#86909C]">没有符合当前搜索条件的门店关系，请调整条件或重置筛选。</div>}
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-[#E5E6EB] bg-[#FAFBFC] px-6 py-3"><span className="text-[12px] text-[#86909C]">共 {detailRelations.length} 家门店</span><button type="button" onClick={closeDetails} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]">返回列表</button></div>
          </div>
        </section>
      )}

      {bindingTarget && (() => {
        const targetProduct = batchProducts.find(item => item.id === bindingTarget.batchProductId);
        const selectedCandidate = productById(candidateProductId);
        const specs = selectedCandidate?.specs?.map(spec => spec.name) || ['默认规格'];
        return <div className="fixed inset-0 z-[340] flex items-center justify-center bg-[#1D2129]/55" role="dialog" aria-modal="true" aria-label="选择企迈商品">
          <div className="flex max-h-[780px] w-[min(920px,calc(100vw-64px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start gap-3 border-b border-[#E5E6EB] px-6 py-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8FFF3] text-[#00A35B]"><Link2 size={17} /></div><div className="min-w-0"><h3 className="text-[17px] font-bold text-[#1D2129]">选择企迈商品</h3><p className="mt-1 text-[12px] text-[#86909C]">{bindingTarget.title} · {targetProduct?.name} / {targetProduct?.specName}</p></div><button type="button" onClick={() => setBindingTarget(null)} className="ml-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#F2F3F5]" title="关闭"><X size={18} /></button></div>
            <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_160px_160px] gap-2 border-b border-[#E5E6EB] bg-[#F7F8FA] p-4"><label className="flex h-9 items-center rounded-md border border-[#C9CDD4] bg-white px-3"><Search size={15} className="mr-2 text-[#86909C]" /><input value={candidateKeyword} onChange={event => setCandidateKeyword(event.target.value)} placeholder="商品名称 / 商品 ID / 商品标识 / SKU" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" /></label><select className="h-9 rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]"><option>全部商品类型</option><option>标准商品</option><option>套餐商品</option></select><select className="h-9 rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]"><option>全部前台分类</option><option>现制饮品</option><option>西式快餐</option></select></div>
            <div className="min-h-0 flex-1 overflow-auto p-4"><div className="overflow-hidden rounded-md border border-[#E5E6EB]"><div className="grid grid-cols-[minmax(220px,1.2fr)_180px_110px_150px_100px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]"><div>商品名称 / ID</div><div>商品规格</div><div>商品类型</div><div>分类 / 商品标识</div><div>操作</div></div>{candidateProducts.map(product => { const selected = candidateProductId === product.id; return <div key={product.id} className={`grid min-h-[70px] grid-cols-[minmax(220px,1.2fr)_180px_110px_150px_100px] items-center border-t px-4 py-3 text-[13px] ${selected ? 'border-[#9EE7BF] bg-[#F2FFF8]' : 'border-[#F0F1F2]'}`}><div className="flex min-w-0 items-center gap-2"><img src={product.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover" /><div className="min-w-0"><div className="truncate font-bold text-[#1D2129]">{product.name}</div><div className="mt-1 text-[11px] text-[#86909C]">商品 ID {product.id}</div></div></div><div className="truncate pr-3 text-[#4E5969]">{product.specs?.map(spec => spec.name).slice(0, 2).join('、') || '默认规格'}<div className="mt-1 text-[11px] text-[#86909C]">SKU {product.skuCode}</div></div><div>{product.type === 'combo' ? '套餐商品' : '标准商品'}</div><div className="min-w-0"><div className="truncate">{product.category}</div><div className="mt-1 truncate text-[11px] text-[#86909C]">{product.type === 'combo' ? 'COMBO' : 'STD'}-{product.skuCode}</div></div><div><button type="button" onClick={() => { setCandidateProductId(product.id); setCandidateSpec(product.specs?.[0]?.name || '默认规格'); }} className={`h-8 whitespace-nowrap rounded-md px-3 text-[12px] font-medium ${selected ? 'bg-[#00B460] text-white' : 'border border-[#9EDDBB] bg-white text-[#00A35B]'}`}>{selected ? '已选择' : '选择'}</button></div></div>; })}</div></div>
            {selectedCandidate && <div className="shrink-0 border-t border-[#E5E6EB] bg-[#FAFBFC] px-6 py-3"><div className="flex items-center gap-3"><span className="shrink-0 text-[12px] font-medium text-[#4E5969]">绑定规格</span><div className="flex min-w-0 flex-wrap gap-2">{specs.map(spec => <button key={spec} type="button" onClick={() => setCandidateSpec(spec)} className={`h-8 rounded-md border px-3 text-[12px] ${candidateSpec === spec ? 'border-[#00B460] bg-[#E8FFF3] font-medium text-[#008A4B]' : 'border-[#C9CDD4] bg-white text-[#4E5969]'}`}>{spec}</button>)}</div></div></div>}
            <div className="flex shrink-0 items-center justify-between border-t border-[#E5E6EB] px-6 py-4"><div className="text-[12px] text-[#667085]">{selectedCandidate ? `已选：${selectedCandidate.name} / ${candidateSpec || '默认规格'}` : '请选择企迈商品及规格'}</div><div className="flex gap-2"><button type="button" onClick={() => setBindingTarget(null)} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]">取消</button><button type="button" disabled={!selectedCandidate || !candidateSpec} onClick={saveBinding} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white disabled:bg-[#C9CDD4]">确认绑定</button></div></div>
          </div>
        </div>;
      })()}

      {showScope && <div className="fixed inset-0 z-[350] flex items-center justify-center bg-[#1D2129]/55" role="dialog" aria-modal="true" aria-label="选择门店范围"><div className="flex h-[600px] w-[min(760px,calc(100vw-64px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start border-b border-[#E5E6EB] px-6 py-4"><div><h3 className="text-[17px] font-bold text-[#1D2129]">选择门店范围</h3><p className="mt-1 text-[12px] text-[#86909C]">列表绑定数量与执行操作均以此范围为准。</p></div><button type="button" onClick={() => setShowScope(false)} className="ml-auto" title="关闭"><X size={18} /></button></div><div className="flex min-h-0 flex-1"><div className="w-[150px] shrink-0 border-r border-[#E5E6EB] bg-[#F7F8FA] p-3">{([['store','门店'],['org','机构'],['tag','标签']] as const).map(([id,label]) => <button key={id} type="button" onClick={() => setScopeTab(id)} className={`mb-1 h-10 w-full rounded-md px-3 text-left text-[13px] ${scopeTab === id ? 'bg-[#E8FFF3] font-bold text-[#008A4B]' : 'text-[#4E5969]'}`}>{label}</button>)}</div><div className="min-w-0 flex-1 p-5">{scopeTab === 'tag' ? <><div className="flex items-start justify-between gap-3"><div><div className="text-[14px] font-bold text-[#1D2129]">门店标签</div><div className="mt-1 text-[12px] text-[#86909C]">组合多个标签确定查询与执行范围。</div></div><div className="flex rounded-md bg-[#F2F3F5] p-1 text-[12px]"><button type="button" onClick={() => setTagMode('any')} className={`rounded px-3 py-1.5 ${tagMode === 'any' ? 'bg-white font-bold text-[#00A35B] shadow-sm' : 'text-[#667085]'}`}>满足任一</button><button type="button" onClick={() => setTagMode('all')} className={`rounded px-3 py-1.5 ${tagMode === 'all' ? 'bg-white font-bold text-[#00A35B] shadow-sm' : 'text-[#667085]'}`}>同时满足全部</button></div></div><label className="mt-4 flex h-9 items-center rounded-md border border-[#C9CDD4] px-3"><Search size={15} className="mr-2 text-[#86909C]" /><input placeholder="搜索标签名称" className="min-w-0 flex-1 text-[13px] outline-none" /></label><div className="mt-3 grid grid-cols-2 gap-2">{['华南区域','直营门店','加盟门店','核心商圈','24 小时营业','新开门店'].map(tag => { const checked=selectedTags.includes(tag); return <div key={tag} className={`flex h-11 items-center rounded-md border px-3 text-[13px] ${checked ? 'border-[#00B460] bg-[#F2FFF8] text-[#008A4B]' : 'border-[#E5E6EB] text-[#4E5969]'}`}><Checkbox checked={checked} label={`选择${tag}`} onClick={() => setSelectedTags(checked ? selectedTags.filter(item => item !== tag) : [...selectedTags,tag])} /><span className="ml-2">{tag}</span></div>; })}</div><div className="mt-5 rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-[12px] text-[#245B8A]">当前条件：{selectedTags.join(tagMode === 'any' ? ' 或 ' : ' 且 ')}；预计命中 18 家门店。</div></> : <div className="flex h-full flex-col items-center justify-center text-center text-[13px] text-[#86909C]"><Store size={30} className="mb-3 text-[#C9CDD4]" /><div className="font-bold text-[#4E5969]">按{scopeTab === 'store' ? '门店' : '机构'}选择</div><div className="mt-2">沿用生产环境的门店与机构选择器。</div></div>}</div></div><div className="flex items-center justify-between border-t border-[#E5E6EB] bg-[#FAFBFC] px-6 py-4"><span className="text-[12px] text-[#667085]">已选 {selectedTags.length} 个标签 · 命中 18 家门店</span><div className="flex gap-2"><button type="button" onClick={() => setShowScope(false)} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px]">取消</button><button type="button" disabled={!selectedTags.length} onClick={() => { setShowScope(false); onMessage('门店范围已更新，列表绑定数量已按新范围重新统计。'); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white disabled:bg-[#C9CDD4]">确认选择</button></div></div></div></div>}
    </div>
  );
};
