import React, { useEffect, useMemo, useState } from 'react';
import {
  History,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react';
import type { Product } from '../../types';
import { WebProductSelectorDialog } from './WebProductSelectorDialog';

export type OnlineOrderingPlatform = 'douyin' | 'meituan';
export type OnlineOrderingPlatformView = 'products' | 'addons';

interface Props {
  platform: OnlineOrderingPlatform;
  initialView?: OnlineOrderingPlatformView;
  catalogName: string;
  unifiedManagementView?: boolean;
  navigation?: React.ReactNode;
  automaticSync?: boolean;
  stateKey?: string;
  automaticSubmissions?: Record<string, string>;
  products: Product[];
  syncProducts?: Product[];
  platformProductIds: string[];
  onBack: () => void;
  onEditProduct?: (product: Product) => void;
  onOpenSyncRecords?: () => void;
  onPublishToStores?: () => void;
  onSyncProducts?: (platform: OnlineOrderingPlatform, productIds: string[]) => void;
  onSyncAddons?: (items: { id: string; name: string }[]) => void;
}

type SyncStatus = 'not_synced' | 'syncing' | 'synced' | 'failed';
type ReviewStatus = 'not_submitted' | 'reviewing' | 'approved' | 'rejected';

type PlatformProductState = {
  syncStatus: SyncStatus;
  reviewStatus: ReviewStatus;
  platformId?: string;
  updatedAt: string;
};

type AddonRecord = {
  id: string;
  name: string;
  addonType: string;
  category: string;
  price: number;
  platformId?: string;
  syncStatus: SyncStatus;
  updatedAt: string;
};

const INITIAL_ADDONS: AddonRecord[] = [
  { id: 'addon-1', name: '椰果', addonType: '小料', category: '饮品 / 其他饮品', price: 1, platformId: 'DYADD1866969794974746', syncStatus: 'synced', updatedAt: '2026-08-19 14:09' },
  { id: 'addon-2', name: '珍珠', addonType: '小料', category: '饮品 / 奶茶', price: 1, syncStatus: 'syncing', updatedAt: '2026-08-19 15:26' },
  { id: 'addon-3', name: '西柚粒', addonType: '水果加料', category: '饮品 / 果茶', price: 2, syncStatus: 'failed', updatedAt: '2026-08-18 18:42' },
];

const MASTER_ADDONS = [
  { id: 'addon-1', name: '椰果', addonType: '小料', price: 1 },
  { id: 'addon-2', name: '珍珠', addonType: '小料', price: 1 },
  { id: 'addon-3', name: '西柚粒', addonType: '水果加料', price: 2 },
  { id: 'addon-4', name: '爆爆珠', addonType: '小料', price: 2 },
  { id: 'addon-5', name: '燕麦奶', addonType: '奶基底', price: 3 },
];

const SYNC_META: Record<SyncStatus, { label: string; className: string; dot: string }> = {
  not_synced: { label: '待同步', className: 'text-[#C76600]', dot: 'bg-[#F79009]' },
  syncing: { label: '同步中', className: 'text-[#245B8A]', dot: 'bg-[#2E90FA]' },
  synced: { label: '同步成功', className: 'text-[#008F4C]', dot: 'bg-[#00B96B]' },
  failed: { label: '同步失败', className: 'text-[#D9363E]', dot: 'bg-[#F04438]' },
};

const REVIEW_META: Record<ReviewStatus, { label: string; className: string }> = {
  not_submitted: { label: '未提交', className: 'text-[#667085]' },
  reviewing: { label: '审核中', className: 'text-[#245B8A]' },
  approved: { label: '审核通过', className: 'text-[#008F4C]' },
  rejected: { label: '审核失败', className: 'text-[#D9363E]' },
};

const platformName = (platform: OnlineOrderingPlatform) => platform === 'douyin' ? '抖音在线点' : '美团在线点';
const sourceSignature = (product: Product) => JSON.stringify({ name: product.name, price: product.price, image: product.image, category: product.category, type: product.type, formData: product.formData });

const getPlatformCategory = (product: Product, platform: OnlineOrderingPlatform) => {
  const saved = (product as Product & { formData?: { channelSpecificValues?: Record<string, Record<string, unknown>> } }).formData?.channelSpecificValues;
  const category = saved?.[platform === 'douyin' ? 'douyin' : 'meituan_dine']?.[platform === 'douyin' ? 'douyinCategory' : 'category'];
  if (typeof category === 'string' && category) return category;
  if (product.type === 'combo') return platform === 'douyin' ? '餐饮 / 套餐组合' : '餐饮 / 套餐';
  if (product.category === '现制饮品') return platform === 'douyin' ? '餐饮 / 饮品 / 茶饮咖啡' : '饮品 / 茶饮咖啡';
  return `${platform === 'douyin' ? '餐饮 / ' : ''}${product.category || '其他餐饮'}`;
};

const buildProductState = (productId: string, platform: OnlineOrderingPlatform): PlatformProductState => {
  const index = Number(productId) || 0;
  if (platform === 'meituan') {
    const syncStatus: SyncStatus = index % 3 === 0 ? 'failed' : index % 2 === 0 ? 'synced' : 'not_synced';
    return {
      syncStatus,
      reviewStatus: 'not_submitted',
      platformId: syncStatus === 'synced' ? `MT${String(productId).padStart(10, '0')}` : undefined,
      updatedAt: syncStatus === 'not_synced' ? '--' : '2026-09-10 16:20',
    };
  }
  const cases: Array<[SyncStatus, ReviewStatus]> = [
    ['not_synced', 'not_submitted'],
    ['synced', 'approved'],
    ['synced', 'reviewing'],
    ['failed', 'rejected'],
  ];
  const [syncStatus, reviewStatus] = cases[index % cases.length];
  return {
    syncStatus,
    reviewStatus,
    platformId: reviewStatus === 'approved' || reviewStatus === 'reviewing' ? `DY${String(productId).padStart(10, '0')}` : undefined,
    updatedAt: syncStatus === 'not_synced' ? '--' : '2026-09-10 15:40',
  };
};

export const WebOnlineOrderingPlatformHub: React.FC<Props> = ({
  platform,
  initialView = 'products',
  catalogName,
  unifiedManagementView = false,
  navigation,
  automaticSync = false,
  stateKey,
  automaticSubmissions,
  products,
  syncProducts = products,
  platformProductIds,
  onBack,
  onEditProduct,
  onOpenSyncRecords,
  onPublishToStores,
  onSyncProducts,
  onSyncAddons,
}) => {
  const [activeView, setActiveView] = useState<OnlineOrderingPlatformView>(initialView);
  useEffect(() => { setActiveView(initialView); setKeyword(''); setSyncFilter('all'); setReviewFilter('all'); setSelectedAddonIds([]); }, [initialView]);
  const cache = useMemo(() => { try { return stateKey ? JSON.parse(sessionStorage.getItem(`online-entry:${stateKey}`) || 'null') : null; } catch { return null; } }, [stateKey]);
  const [productStates, setProductStates] = useState<Record<string, PlatformProductState>>(() => cache?.states || Object.fromEntries(products.map(item => [item.id, buildProductState(item.id, platform)])));
  const [keyword, setKeyword] = useState('');
  const [syncFilter, setSyncFilter] = useState<'all' | SyncStatus>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | ReviewStatus>('all');
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productPickerIds, setProductPickerIds] = useState<string[]>([]);
  const [showProductSyncConfirm, setShowProductSyncConfirm] = useState(false);
  const [auditProduct, setAuditProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState('');
  const [submittedProduct, setSubmittedProduct] = useState<Product | null>(null);
  useEffect(() => {
    if (!submittedProduct) return;
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[role="dialog"][aria-label="已提交资料"] button')?.focus());
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); setSubmittedProduct(null); } };
    window.addEventListener('keydown', escape);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', escape); if (previous?.isConnected) previous.focus(); };
  }, [submittedProduct]);
  const [submittedSnapshots, setSubmittedSnapshots] = useState<Record<string, Product>>(() => cache?.snapshots || Object.fromEntries(products.filter(item => buildProductState(item.id, platform).syncStatus !== 'not_synced' && !automaticSubmissions?.[item.id]).map(item => [item.id, structuredClone(item)])));
  useEffect(() => { setProductStates(current => ({ ...Object.fromEntries(products.map(item => [item.id, buildProductState(item.id, platform)])), ...current })); }, [products, platform]);
  const [addons, setAddons] = useState<AddonRecord[]>(() => cache?.addons || INITIAL_ADDONS);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [showAddonPicker, setShowAddonPicker] = useState(false);
  const [addonPickerIds, setAddonPickerIds] = useState<string[]>([]);
  const [editingAddon, setEditingAddon] = useState<AddonRecord | null>(null);
  useEffect(() => {
    if (!automaticSync || !automaticSubmissions) return;
    setProductStates(current => ({ ...current, ...Object.fromEntries(Object.entries(automaticSubmissions).map(([id, time]) => [id, {
      ...(current[id] || buildProductState(id, platform)), syncStatus: 'not_synced' as const,
      reviewStatus: current[id]?.platformId ? current[id].reviewStatus : 'not_submitted' as const,
      updatedAt: time,
    }])) }));
  }, [automaticSync, automaticSubmissions, platform]);
  useEffect(() => { if (stateKey) { try { sessionStorage.setItem(`online-entry:${stateKey}`, JSON.stringify({ ...cache, states: productStates, snapshots: submittedSnapshots, addons, submittedProductIds: platformProductIds })); } catch { /* Preview remains usable when storage is unavailable. */ } } }, [stateKey, productStates, submittedSnapshots, addons, platformProductIds]);

  const managedProducts = useMemo(() => products.filter(product => (
    platformProductIds.includes(product.id) && (platform !== 'meituan' || product.type !== 'combo')
  )), [platform, platformProductIds, products]);
  const filteredProducts = managedProducts.filter(product => {
    const state = productStates[product.id] || buildProductState(product.id, platform);
    return (!keyword.trim() || product.name.includes(keyword.trim()) || product.id.includes(keyword.trim()) || product.skuCode.includes(keyword.trim()))
      && (syncFilter === 'all' || state.syncStatus === syncFilter)
      && (platform !== 'douyin' || reviewFilter === 'all' || state.reviewStatus === reviewFilter);
  });
  const selectedSyncIds = selectedAddonIds;

  const openProductPicker = () => {
    setProductPickerIds([]);
    setShowProductPicker(true);
  };

  const confirmProductPicker = () => {
    if (productPickerIds.length === 0) {
      setNotice(unifiedManagementView ? '请至少选择一个可同步的商品' : '请至少选择一个可同步的渠道商品');
      return;
    }
    setShowProductPicker(false);
    setShowProductSyncConfirm(true);
  };

  const confirmProductSync = () => {
    const submittedAt = '2026-09-11 14:30';
    setProductStates(current => ({
      ...current,
      ...Object.fromEntries(productPickerIds.map(productId => [productId, {
        ...(current[productId] || buildProductState(productId, platform)),
        syncStatus: 'syncing' as SyncStatus,
        reviewStatus: platform === 'douyin' ? 'reviewing' as ReviewStatus : 'not_submitted' as ReviewStatus,
        updatedAt: submittedAt,
      }])),
    }));
    setSubmittedSnapshots(current => ({ ...current, ...Object.fromEntries(products.filter(item => productPickerIds.includes(item.id)).map(item => [item.id, structuredClone(item)])) }));
    onSyncProducts?.(platform, productPickerIds);
    const count = productPickerIds.length;
    setProductPickerIds([]);
    setShowProductSyncConfirm(false);
    setNotice(`已创建 ${count} 个${platformName(platform)}品牌商品同步任务，可在任务记录查看进度`);
  };

  const openSyncConfirm = () => {
    if (selectedSyncIds.length === 0) {
      setNotice('请先选择需要同步的加料');
      return;
    }
    if (addons.some(item => selectedSyncIds.includes(item.id) && (!item.category || !Number.isFinite(item.price) || item.price < 0))) { setNotice('请先补充所选加料的商品分类和有效售价'); return; }
    setShowSyncConfirm(true);
  };

  const confirmSync = () => {
    onSyncAddons?.(addons.filter(item => selectedAddonIds.includes(item.id)));
    setAddons(current => current.map(item => selectedAddonIds.includes(item.id) ? { ...item, syncStatus: 'syncing', updatedAt: '2026-09-10 21:48' } : item));
    setSelectedAddonIds([]);
    setShowSyncConfirm(false);
    setNotice(`已创建${platformName(platform)}加料品同步任务，可在任务记录查看进度`);
  };

  const confirmAddonPicker = () => {
    const additions = MASTER_ADDONS.filter(option => addonPickerIds.includes(option.id) && !addons.some(item => item.id === option.id));
    setAddons(current => [...current, ...additions.map(option => ({
      ...option,
      category: '',
      syncStatus: 'not_synced' as SyncStatus,
      updatedAt: '--',
    }))]);
    setShowAddonPicker(false);
    setAddonPickerIds([]);
    setNotice(`已引用 ${additions.length} 个主档加料，请补充抖音商品分类`);
  };

  const platformProductTitle = `${platformName(platform)}商品`;
  const filteredAddons = addons.filter(item => (!keyword.trim() || item.name.includes(keyword.trim())) && (syncFilter === 'all' || item.syncStatus === syncFilter));

  return (
    <main className="online-platform-workspace relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      {notice && <div className="absolute left-1/2 top-3 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-md bg-[#1D2129] px-4 py-2.5 text-sm text-white shadow-xl"><span>{notice}</span><button type="button" onClick={() => setNotice('')}><X size={14} /></button></div>}
      <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 bg-white px-5 py-3">
        <div>
          <h1 className="text-base font-semibold text-[#1D2129]">在线点商品</h1>
          <p className="mt-1 text-xs text-[#667085]">{unifiedManagementView ? '共用商品库资料' : `资料来源：${catalogName}`}，保存资料不会自动提交平台。请在此同步商品、加料并查看处理结果，再下发至门店。</p>
        </div>
      </div>

      {navigation || (platform === 'douyin' && (
        <div className="console-segmented-tabs flex h-11 shrink-0 items-end gap-7 bg-white px-6" role="tablist" aria-label="在线点商品类型">
          {([{ id: 'products', label: '平台商品' }, { id: 'addons', label: '平台加料' }] as const).map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeView === tab.id} onClick={() => { setActiveView(tab.id); setKeyword(''); setSyncFilter('all'); setSelectedAddonIds([]); }} className={`h-full border-b-2 px-1 text-sm font-bold ${activeView === tab.id ? 'border-[#00B460] text-[#008F4C]' : 'border-transparent text-[#667085]'}`}>{tab.label}</button>)}
        </div>
      ))}

      <div className="flex min-h-0 flex-1 flex-col">
        <section className="console-panel shrink-0 rounded-b-none border-b-0">
          <div className="flex flex-wrap items-center gap-3 bg-white px-5 pb-4 pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex h-9 w-[300px] items-center rounded-md border border-[#E5E6EB] bg-white px-3 focus-within:border-[#00B460]"><Search size={15} className="mr-2 text-[#98A2B3]" /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder={activeView === 'addons' ? '搜索加料名称' : '搜索商品名称、商品ID、SKUID'} className="min-w-0 flex-1 text-sm outline-none" /></label>
              <label className="flex h-9 items-center gap-2 rounded-md border border-[#E5E6EB] bg-white px-3 text-xs text-[#667085]">同步状态<select value={syncFilter} onChange={event => setSyncFilter(event.target.value as 'all' | SyncStatus)} className="bg-transparent text-sm text-[#1D2129] outline-none"><option value="all">全部状态</option><option value="not_synced">待同步</option><option value="syncing">同步中</option><option value="synced">同步成功</option><option value="failed">同步失败</option></select></label>
              {platform === 'douyin' && activeView === 'products' && <label className="flex h-9 items-center gap-2 rounded-md border border-[#E5E6EB] bg-white px-3 text-xs text-[#667085]">审核状态<select value={reviewFilter} onChange={event => setReviewFilter(event.target.value as 'all' | ReviewStatus)} className="bg-transparent text-sm text-[#1D2129] outline-none"><option value="all">全部状态</option><option value="not_submitted">未提交</option><option value="reviewing">审核中</option><option value="approved">审核通过</option><option value="rejected">审核失败</option></select></label>}
              <button type="button" onClick={() => { setKeyword(''); setSyncFilter('all'); setReviewFilter('all'); }} className="console-secondary-button">重置</button>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2" role="group" aria-label="在线点列表操作">
              {activeView === 'addons' ? (
                <>
                  <button type="button" onClick={() => setShowAddonPicker(true)} className="console-secondary-button"><Plus size={15} />{unifiedManagementView ? '从商品加料添加' : '从主档加料添加'}</button>
                  {!automaticSync && <button type="button" onClick={openSyncConfirm} className="console-primary-button"><Send size={15} />同步至平台{selectedSyncIds.length > 0 ? `（${selectedSyncIds.length}）` : ''}</button>}
                </>
              ) : (
                <>
                  {onPublishToStores && <button type="button" onClick={onPublishToStores} className="console-primary-button"><Send size={15} />下发至门店</button>}
                  {!automaticSync && <button type="button" onClick={openProductPicker} className="console-primary-button"><Send size={15} />同步至平台</button>}
                </>
              )}
              <button type="button" onClick={onOpenSyncRecords} className="console-text-button"><History size={15} />任务记录</button>
            </div>
          </div>
        </section>

        <section className="console-panel min-h-0 flex-1 overflow-auto rounded-t-none">
          {activeView === 'products' ? (
            <table className={`w-full table-fixed text-left text-sm ${platform === 'douyin' ? 'min-w-[1080px]' : 'min-w-[920px]'}`}>
              <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs font-bold text-[#4E5969]">
                <tr>
                  <th className="w-[220px] border-b px-4 py-3">{unifiedManagementView ? '商品' : '渠道商品'}</th>
                  <th className="w-[145px] border-b px-4 py-3">平台商品ID</th>
                  <th className="w-[190px] border-b px-4 py-3">平台商品类目</th>
                  <th className="w-[120px] border-b px-4 py-3">同步状态</th>
                  {platform === 'douyin' && <th className="w-[110px] border-b px-4 py-3">审核状态</th>}
                  <th className="w-[150px] border-b px-4 py-3">最近同步</th>
                  <th className="sticky right-0 w-[264px] border-b border-l bg-[#F7F8FA] px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const state = productStates[product.id] || buildProductState(product.id, platform);
                  const syncMeta = SYNC_META[state.syncStatus];
                  const reviewMeta = REVIEW_META[state.reviewStatus];
                  const reviewDot = state.reviewStatus === 'approved' ? 'bg-[#00B96B]' : state.reviewStatus === 'reviewing' ? 'bg-[#2E90FA]' : state.reviewStatus === 'rejected' ? 'bg-[#F04438]' : 'bg-[#C9CDD4]';
                  return (
                    <tr key={product.id} className="group hover:bg-[#FAFBFC]">
                      <td className="border-b px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt="" className="h-10 w-10 shrink-0 border border-[#F0F1F2] object-cover" />
                          <div className="min-w-0"><div className="truncate font-bold text-[#1D2129]">{product.name}</div><div className="mt-0.5 text-xs text-[#98A2B3]">商品ID {product.id}</div></div>
                        </div>
                      </td>
                      <td className="border-b px-4 py-3 text-[#4E5969]">{state.platformId || '--'}</td>
                      <td className="border-b px-4 py-3 text-[#4E5969]">{getPlatformCategory(product, platform)}</td>
                      <td className="border-b px-4 py-3"><span className={`inline-flex items-center gap-2 font-medium ${syncMeta.className}`}><i className={`h-2 w-2 rounded-full ${syncMeta.dot}`} />{syncMeta.label}</span>{state.syncStatus === 'failed' && <div className="mt-1 text-[11px] text-[#D9363E]">{state.reviewStatus === 'rejected' ? '请修改资料后重新提交' : '请检查资料或重试'}</div>}{submittedSnapshots[product.id] && sourceSignature(product) !== sourceSignature(submittedSnapshots[product.id]) && <div className="mt-1 text-xs leading-5 text-[#B54708]">商品库资料已更新，尚未同步本次修改</div>}</td>
                      {platform === 'douyin' && <td className="border-b px-4 py-3"><span className={`inline-flex items-center gap-2 text-xs font-medium ${reviewMeta.className}`}><i className={`h-2 w-2 rounded-full ${reviewDot}`} />{reviewMeta.label}</span></td>}
                      <td className="border-b px-4 py-3 text-xs tabular-nums text-[#667085]">{state.updatedAt}</td>
                      <td className="sticky right-0 border-b border-l bg-white px-4 py-3 group-hover:bg-[#FAFBFC]"><div className="flex items-center gap-4 whitespace-nowrap text-xs font-bold"><button type="button" onClick={() => onEditProduct?.(product)} className="text-[#008F4C]">修改资料</button>{submittedSnapshots[product.id] && <button type="button" onClick={() => setSubmittedProduct(submittedSnapshots[product.id])} className="text-[#245B8A]">已提交资料</button>}{state.syncStatus === 'failed' && state.reviewStatus !== 'rejected' && <button type="button" onClick={() => { setProductPickerIds([product.id]); setShowProductSyncConfirm(true); }} className="text-[#008F4C]">重试</button>}{platform === 'douyin' && state.reviewStatus !== 'not_submitted' && <button type="button" onClick={() => setAuditProduct(product)} className="text-[#245B8A]">审核记录</button>}</div></td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && <tr><td colSpan={platform === 'douyin' ? 7 : 6} className="px-6 py-20 text-center text-sm text-[#98A2B3]">暂无符合条件的平台商品</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[1060px] table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs font-bold text-[#4E5969]">
                <tr><th className="w-12 border-b px-4 py-3"><input type="checkbox" checked={filteredAddons.length > 0 && filteredAddons.every(item => selectedAddonIds.includes(item.id))} onChange={event => setSelectedAddonIds(event.target.checked ? filteredAddons.map(item => item.id) : [])} aria-label="选择全部加料" /></th><th className="w-[200px] border-b px-4 py-3">加料名称</th><th className="w-[120px] border-b px-4 py-3">企迈加料类型</th><th className="w-[190px] border-b px-4 py-3">抖音商品分类</th><th className="w-[100px] border-b px-4 py-3">售价</th><th className="w-[120px] border-b px-4 py-3">同步状态</th><th className="w-[140px] border-b px-4 py-3">最近同步</th><th className="sticky right-0 w-[170px] border-b border-l bg-[#F7F8FA] px-4 py-3">操作</th></tr>
              </thead>
              <tbody>
                {filteredAddons.map(item => {
                  const meta = SYNC_META[item.syncStatus];
                  return (
                    <tr key={item.id} className="group hover:bg-[#FAFBFC]">
                      <td className="border-b px-4 py-3"><input type="checkbox" checked={selectedAddonIds.includes(item.id)} onChange={event => setSelectedAddonIds(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} aria-label={`选择${item.name}`} /></td>
                      <td className="border-b px-4 py-3"><div className="font-bold text-[#1D2129]">{item.name}</div><div className="mt-0.5 truncate text-xs text-[#98A2B3]">{item.platformId ? `抖音加料ID ${item.platformId}` : '尚未生成抖音加料ID'}</div></td>
                      <td className="border-b px-4 py-3 text-[#4E5969]">{item.addonType}</td>
                      <td className="border-b px-4 py-3 text-[#4E5969]">{item.category || <span className="text-[#D9363E]">待补充</span>}</td>
                      <td className="border-b px-4 py-3 tabular-nums">{Number.isFinite(Number(item.price)) ? `¥${Number(item.price).toFixed(2)}` : '--'}</td>
                      <td className="border-b px-4 py-3"><span className={`inline-flex items-center gap-2 font-medium ${meta.className}`}><i className={`h-2 w-2 rounded-full ${meta.dot}`} />{meta.label}</span></td>
                      <td className="border-b px-4 py-3 text-xs tabular-nums text-[#667085]">{item.updatedAt}</td>
                      <td className="sticky right-0 border-b border-l bg-white px-4 py-3 group-hover:bg-[#FAFBFC]"><div className="flex gap-4 whitespace-nowrap text-xs font-bold"><button type="button" onClick={() => setEditingAddon(item)} className="text-[#008F4C]">维护资料</button>{(!automaticSync || item.syncStatus === 'failed') && <button type="button" onClick={() => { if (!item.category || !Number.isFinite(item.price) || item.price < 0) { setNotice('请先补充商品分类和有效售价'); return; } setSelectedAddonIds([item.id]); setShowSyncConfirm(true); }} disabled={item.syncStatus === 'syncing'} className="text-[#008F4C] disabled:text-[#C9CDD4]">{item.syncStatus === 'failed' ? '重试' : item.syncStatus === 'synced' ? '同步更新' : '同步'}</button>}</div></td>
                    </tr>
                  );
                })}
                {filteredAddons.length === 0 && <tr><td colSpan={8} className="px-6 py-20 text-center text-sm text-[#98A2B3]">暂无符合条件的平台加料</td></tr>}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {showAddonPicker && <SelectionDialog title="从主档加料添加" description="抖音加料只引用主档定义；名称和企迈加料类型不可在平台页面修改。" rows={MASTER_ADDONS.map(item => ({ id: item.id, title: item.name, description: `${item.addonType} · 默认 ¥${item.price.toFixed(2)}` }))} selectedIds={addonPickerIds} disabledIds={addons.map(item => item.id)} onChange={setAddonPickerIds} onCancel={() => setShowAddonPicker(false)} onConfirm={confirmAddonPicker} />}

      <WebProductSelectorDialog
        open={showProductPicker}
        title={`选择同步至${platformName(platform)}的商品`}
        description={`${unifiedManagementView ? '选择已保存的商品' : `仅展示所属“${catalogName}”的渠道商品`}；已同步的商品可再次选择更新。${platform === 'meituan' ? ' 美团在线点仅支持标准商品。' : ''}`}
        products={syncProducts}
        selectedIds={productPickerIds}
        onSelectedIdsChange={setProductPickerIds}
        disabledIds={syncProducts.filter(product => platform === 'meituan' ? product.type === 'combo' : productStates[product.id]?.reviewStatus === 'reviewing').map(product => product.id)}
        disabledLabel={platform === 'meituan' ? '暂不支持套餐商品' : '审核中，请等待结果'}
        confirmLabel="下一步"
        onCancel={() => { setShowProductPicker(false); setProductPickerIds([]); }}
        onConfirm={confirmProductPicker}
      />

      {showProductSyncConfirm && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="w-[680px] overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold text-[#1D2129]">同步{platformName(platform)}品牌商品</div><div className="mt-1 text-xs text-[#86909C]">{unifiedManagementView ? '本次仅同步品牌商品，不会创建门店商品。' : '从所属渠道商品库发起品牌级同步，不选择门店，也不会创建门店商品。'}</div></div><button type="button" onClick={() => setShowProductSyncConfirm(false)}><X size={18} /></button></div><div className="space-y-4 p-6"><div className="grid grid-cols-3 gap-3 rounded-md border bg-[#F7F8FA] p-4 text-sm"><div><div className="text-xs text-[#86909C]">商品来源</div><div className="mt-1 font-bold">{unifiedManagementView ? '商品库' : catalogName}</div></div><div><div className="text-xs text-[#86909C]">同步对象</div><div className="mt-1 font-bold">{productPickerIds.length} 个商品</div></div><div><div className="text-xs text-[#86909C]">目标平台</div><div className="mt-1 font-bold">{platformName(platform)}</div></div></div><div className="rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-xs leading-5 text-[#245B8A]">{platform === 'douyin' ? '新建或更新抖音标品后提交平台审核；更新审核期间继续使用当前生效版本。' : '美团品牌商品无需审核；仅同步标准商品。'}</div></div><div className="flex items-center justify-between border-t bg-[#F7F8FA] px-6 py-4"><button type="button" onClick={onOpenSyncRecords} className="text-sm font-medium text-[#008F4C]">查看历史同步任务</button><div className="flex gap-2"><button type="button" onClick={() => { setShowProductSyncConfirm(false); setShowProductPicker(true); }} className="console-secondary-button">返回选择</button><button type="button" onClick={confirmProductSync} className="console-primary-button"><Send size={15} />确认同步</button></div></div></div></div>}

      {showSyncConfirm && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="w-[680px] overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold text-[#1D2129]">同步{platformName(platform)}加料品</div><div className="mt-1 text-xs text-[#86909C]">品牌级独立同步，不选择门店，也不会创建门店商品。</div></div><button type="button" onClick={() => setShowSyncConfirm(false)}><X size={18} /></button></div><div className="space-y-4 p-6"><div className="grid grid-cols-3 gap-3 rounded-md border bg-[#F7F8FA] p-4 text-sm"><div><div className="text-xs text-[#86909C]">资料来源</div><div className="mt-1 font-bold">商品主档加料</div></div><div><div className="text-xs text-[#86909C]">同步对象</div><div className="mt-1 font-bold">{selectedSyncIds.length} 个</div></div><div><div className="text-xs text-[#86909C]">目标平台</div><div className="mt-1 font-bold">{platformName(platform)}</div></div></div><div className="rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-xs leading-5 text-[#245B8A]">加料同步成功后，可在下发门店点单品时携带商品与加料的关联关系。</div></div><div className="flex items-center justify-between border-t bg-[#F7F8FA] px-6 py-4"><button type="button" onClick={onOpenSyncRecords} className="text-sm font-medium text-[#008F4C]">查看历史同步任务</button><div className="flex gap-2"><button type="button" onClick={() => setShowSyncConfirm(false)} className="console-secondary-button">取消</button><button type="button" onClick={confirmSync} className="console-primary-button"><Send size={15} />确认同步</button></div></div></div></div>}

      {editingAddon && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="w-[650px] overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold">维护抖音加料资料</div><div className="mt-1 text-xs text-[#86909C]">名称和企迈加料类型来自主档，不可修改。</div></div><button type="button" onClick={() => setEditingAddon(null)}><X size={18} /></button></div><div className="grid grid-cols-2 gap-4 p-6"><label className="text-sm"><span className="mb-2 block font-medium">加料名称</span><input readOnly value={editingAddon.name} className="h-10 w-full rounded-md border bg-[#F5F6F7] px-3 text-[#667085]" /></label><label className="text-sm"><span className="mb-2 block font-medium">企迈加料类型</span><input readOnly value={editingAddon.addonType} className="h-10 w-full rounded-md border bg-[#F5F6F7] px-3 text-[#667085]" /></label><label className="text-sm"><span className="mb-2 block font-medium">抖音商品分类 <b className="text-red-500">*</b></span><select value={editingAddon.category} onChange={event => setEditingAddon({ ...editingAddon, category: event.target.value })} className="h-10 w-full rounded-md border px-3"><option value="">请选择</option><option>饮品 / 奶茶</option><option>饮品 / 果茶</option><option>饮品 / 其他饮品</option><option>餐饮 / 小吃配料</option></select></label><label className="text-sm"><span className="mb-2 block font-medium">抖音售价（元） <b className="text-red-500">*</b></span><input type="number" min="0" step="0.01" value={editingAddon.price} onChange={event => setEditingAddon({ ...editingAddon, price: Number(event.target.value) })} className="h-10 w-full rounded-md border px-3" /></label></div><div className="flex justify-end gap-2 border-t bg-[#F7F8FA] px-6 py-4"><button type="button" onClick={() => setEditingAddon(null)} className="console-secondary-button">取消</button><button type="button" disabled={!editingAddon.category || !Number.isFinite(editingAddon.price) || editingAddon.price < 0} onClick={() => { setAddons(current => current.map(item => item.id === editingAddon.id ? { ...editingAddon, syncStatus: automaticSync ? 'syncing' : 'not_synced' } : item)); setEditingAddon(null); setNotice(automaticSync ? '加料资料已保存，已创建自动同步任务' : '加料资料已保存，请同步至平台'); }} className="console-primary-button">保存</button></div></div></div>}

      {submittedProduct && <div className="absolute inset-0 z-[60] flex bg-black/30"><button type="button" aria-label="关闭已提交资料" className="absolute inset-0" onClick={() => setSubmittedProduct(null)} /><aside role="dialog" aria-modal="true" aria-label="已提交资料" className="relative ml-auto flex h-full w-[560px] max-w-full flex-col bg-white shadow-xl"><div className="flex items-center justify-between border-b px-6 py-4"><h2 className="font-semibold">已提交资料</h2><button type="button" aria-label="关闭" onClick={() => setSubmittedProduct(null)}><X size={18} /></button></div><div className="space-y-5 overflow-auto p-6"><p className="text-xs text-[#667085]">展示最近一次提交的商品资料；修改请返回商品库。</p><img src={submittedProduct.image} alt={submittedProduct.name} className="h-24 w-24 rounded border object-cover" /><dl className="grid grid-cols-[104px_1fr] gap-x-4 gap-y-4 text-sm"><dt className="text-[#667085]">商品名称</dt><dd>{submittedProduct.name}</dd><dt className="text-[#667085]">商品ID</dt><dd>{submittedProduct.id}</dd><dt className="text-[#667085]">平台商品ID</dt><dd>{productStates[submittedProduct.id]?.platformId || '--'}</dd><dt className="text-[#667085]">平台类目</dt><dd>{getPlatformCategory(submittedProduct, platform)}</dd><dt className="text-[#667085]">售价</dt><dd>¥{Number(submittedProduct.price).toFixed(2)}</dd><dt className="text-[#667085]">最近提交</dt><dd>{productStates[submittedProduct.id]?.updatedAt}</dd></dl></div><div className="mt-auto flex justify-end border-t p-4"><button type="button" onClick={() => setSubmittedProduct(null)} className="console-secondary-button">关闭</button></div></aside></div>}
      {auditProduct && <div className="absolute inset-0 z-[60] flex bg-black/30"><button type="button" className="absolute inset-0" onClick={() => setAuditProduct(null)} /><aside className="relative ml-auto flex h-full w-[680px] flex-col bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold">抖音平台审核记录</div><div className="mt-1 text-xs text-[#86909C]">{auditProduct.name} · 渠道商品ID {auditProduct.id}</div></div><button type="button" onClick={() => setAuditProduct(null)}><X size={18} /></button></div><div className="flex-1 space-y-4 overflow-auto p-6"><div className="rounded-lg border p-4"><div className="flex justify-between"><div><div className="font-bold">V2 · 资料更新</div><div className="mt-1 text-xs text-[#86909C]">{productStates[auditProduct.id]?.updatedAt} · 企迈静静</div></div><span className={`h-fit rounded border px-2 py-1 text-xs font-bold ${REVIEW_META[productStates[auditProduct.id]?.reviewStatus || 'not_submitted'].className}`}>{REVIEW_META[productStates[auditProduct.id]?.reviewStatus || 'not_submitted'].label}</span></div><div className="mt-3 text-xs text-[#667085]">{productStates[auditProduct.id]?.reviewStatus === 'rejected' ? '资料未通过审核，请返回原商品库检查并修改。' : '变更字段：商品名称、商品主图、规格信息'}</div></div><div className="rounded-lg border p-4"><div className="flex justify-between"><div><div className="font-bold">V1 · 首次提交</div><div className="mt-1 text-xs text-[#86909C]">2026-09-08 10:24 · 张晓明</div></div><span className="h-fit border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">审核通过</span></div><div className="mt-3 text-xs text-[#667085]">当前生效版本</div></div></div><div className="flex items-center justify-between border-t bg-[#F7F8FA] px-6 py-4"><span className="text-xs text-[#86909C]">审核事实以平台服务回传为准</span><button type="button" onClick={() => setAuditProduct(null)} className="console-primary-button">关闭</button></div></aside></div>}
    </main>
  );
};

const SelectionDialog = ({ title, description, rows, selectedIds, disabledIds, onChange, onCancel, onConfirm }: { title: string; description: string; rows: Array<{ id: string; title: string; description: string }>; selectedIds: string[]; disabledIds: string[]; onChange: (ids: string[]) => void; onCancel: () => void; onConfirm: () => void; }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="flex max-h-[78vh] w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold text-[#1D2129]">{title}</div><div className="mt-1 text-xs text-[#86909C]">{description}</div></div><button type="button" onClick={onCancel}><X size={18} /></button></div><div className="border-b bg-[#FAFBFC] p-4"><label className="flex h-9 w-[320px] items-center rounded-md border bg-white px-3"><Search size={15} className="mr-2 text-[#98A2B3]" /><input placeholder="搜索名称或编码" className="flex-1 text-sm outline-none" /></label></div><div className="min-h-0 flex-1 overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-[#F7F8FA] text-xs text-[#4E5969]"><tr><th className="w-12 border-b px-4 py-3" /><th className="border-b px-4 py-3">名称</th><th className="w-[180px] border-b px-4 py-3">状态</th></tr></thead><tbody>{rows.map(row => { const disabled = disabledIds.includes(row.id); const checked = selectedIds.includes(row.id); return <tr key={row.id}><td className="border-b px-4 py-4"><input type="checkbox" disabled={disabled} checked={checked || disabled} onChange={event => onChange(event.target.checked ? [...selectedIds, row.id] : selectedIds.filter(id => id !== row.id))} /></td><td className="border-b px-4 py-4"><div className="font-bold text-[#1D2129]">{row.title}</div><div className="mt-1 text-xs text-[#98A2B3]">{row.description}</div></td><td className="border-b px-4 py-4 text-xs text-[#667085]">{disabled ? '已添加' : '可添加'}</td></tr>; })}</tbody></table></div><div className="flex items-center justify-between border-t bg-[#F7F8FA] px-6 py-4"><span className="text-sm text-[#667085]">已选择 {selectedIds.length} 个</span><div className="flex gap-2"><button type="button" onClick={onCancel} className="console-secondary-button">取消</button><button type="button" onClick={onConfirm} disabled={selectedIds.length === 0} className="console-primary-button disabled:opacity-45">确认添加</button></div></div></div></div>
);
