import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
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
  products: Product[];
  platformProductIds: string[];
  onBack: () => void;
  onEditProduct?: (product: Product) => void;
  onOpenSyncRecords?: () => void;
  onSyncProducts?: (platform: OnlineOrderingPlatform, productIds: string[]) => void;
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

const getPlatformCategory = (product: Product, platform: OnlineOrderingPlatform) => {
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
  products,
  platformProductIds,
  onBack,
  onEditProduct,
  onOpenSyncRecords,
  onSyncProducts,
}) => {
  const [activeView, setActiveView] = useState<OnlineOrderingPlatformView>(initialView);
  const [productStates, setProductStates] = useState<Record<string, PlatformProductState>>(() => Object.fromEntries(products.map(item => [item.id, buildProductState(item.id, platform)])));
  const [keyword, setKeyword] = useState('');
  const [syncFilter, setSyncFilter] = useState<'all' | SyncStatus>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | ReviewStatus>('all');
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productPickerIds, setProductPickerIds] = useState<string[]>([]);
  const [showProductSyncConfirm, setShowProductSyncConfirm] = useState(false);
  const [auditProduct, setAuditProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState('');
  const [addons, setAddons] = useState<AddonRecord[]>(INITIAL_ADDONS);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [showAddonPicker, setShowAddonPicker] = useState(false);
  const [addonPickerIds, setAddonPickerIds] = useState<string[]>([]);
  const [editingAddon, setEditingAddon] = useState<AddonRecord | null>(null);

  const managedProducts = useMemo(() => products.filter(product => (
    platformProductIds.includes(product.id) && (platform !== 'meituan' || product.type !== 'combo')
  )), [platform, platformProductIds, products]);
  const filteredProducts = managedProducts.filter(product => {
    const state = productStates[product.id];
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
      setNotice('请至少选择一个可同步的渠道商品');
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
    onSyncProducts?.(platform, productPickerIds);
    const count = productPickerIds.length;
    setProductPickerIds([]);
    setShowProductSyncConfirm(false);
    setNotice(`已创建 ${count} 个${platformName(platform)}品牌商品同步任务，可在同步记录查看进度`);
  };

  const openSyncConfirm = () => {
    if (selectedSyncIds.length === 0) {
      setNotice('请先选择需要同步的加料');
      return;
    }
    setShowSyncConfirm(true);
  };

  const confirmSync = () => {
    setAddons(current => current.map(item => selectedAddonIds.includes(item.id) ? { ...item, syncStatus: 'syncing', updatedAt: '2026-09-10 21:48' } : item));
    setSelectedAddonIds([]);
    setShowSyncConfirm(false);
    setNotice(`已创建${platformName(platform)}加料品同步任务，可在发布中心查看进度`);
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
    setNotice(`已引用 ${additions.length} 个主档加料，请补充抖音商品分类后同步`);
  };

  const platformProductTitle = `${platformName(platform)}商品`;
  const filteredAddons = addons.filter(item => (!keyword.trim() || item.name.includes(keyword.trim())) && (syncFilter === 'all' || item.syncStatus === syncFilter));

  return (
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      {notice && <div className="absolute left-1/2 top-3 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-md bg-[#1D2129] px-4 py-2.5 text-sm text-white shadow-xl"><span>{notice}</span><button type="button" onClick={() => setNotice('')}><X size={14} /></button></div>}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E6EB] bg-white px-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="rounded-md p-2 text-[#4E5969] hover:bg-[#F2F3F5]" title="返回渠道商品库"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold text-[#1D2129]"><span>渠道商品</span><ChevronRight size={14} className="text-[#98A2B3]" /><span>{activeView === 'addons' ? '抖音在线点加料' : platformProductTitle}</span></div>
            <div className="mt-0.5 text-[11px] text-[#86909C]">{catalogName} · 品牌级平台数据</div>
          </div>
        </div>
        <button type="button" onClick={onOpenSyncRecords} className="console-text-button"><History size={15} />同步记录</button>
      </div>

      {platform === 'douyin' && (
        <div className="flex h-11 shrink-0 items-end gap-7 border-b border-[#E5E6EB] bg-white px-6">
          {([{ id: 'products', label: '平台商品' }, { id: 'addons', label: '平台加料' }] as const).map(tab => <button key={tab.id} type="button" onClick={() => { setActiveView(tab.id); setKeyword(''); setSyncFilter('all'); setSelectedAddonIds([]); }} className={`h-full border-b-2 px-1 text-sm font-bold ${activeView === tab.id ? 'border-[#00B460] text-[#008F4C]' : 'border-transparent text-[#667085]'}`}>{tab.label}</button>)}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <section className="console-panel shrink-0 rounded-b-none border-b-0">
          <div className="flex min-h-11 items-center justify-between gap-4 border-b border-[#E8E8E8] px-4 py-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-[13px] font-bold text-[#1D2129]">{activeView === 'addons' ? '品牌加料' : '平台商品'}</span>
              <span className="truncate text-[11px] text-[#86909C]">{activeView === 'addons' ? '引用主档加料，平台仅维护类目与价格' : `由“${catalogName}”同步生成`}</span>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-xs text-[#667085]">
              <span>共 <b className="text-[#1D2129]">{activeView === 'addons' ? addons.length : managedProducts.length}</b> 个</span>
              <span className="text-[#008F4C]">同步成功 {activeView === 'addons' ? addons.filter(item => item.syncStatus === 'synced').length : managedProducts.filter(item => productStates[item.id].syncStatus === 'synced').length}</span>
              {platform === 'douyin' && activeView === 'products' && <span className="text-[#245B8A]">审核中 {managedProducts.filter(item => productStates[item.id].reviewStatus === 'reviewing').length}</span>}
              <span className="text-[#D9363E]">失败 {activeView === 'addons' ? addons.filter(item => item.syncStatus === 'failed').length : managedProducts.filter(item => productStates[item.id].syncStatus === 'failed').length}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-3">
            <label className="flex h-9 w-[300px] items-center rounded-md border border-[#E5E6EB] bg-white px-3 focus-within:border-[#00B460]"><Search size={15} className="mr-2 text-[#98A2B3]" /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder={activeView === 'addons' ? '搜索加料名称' : '搜索商品名称、商品ID、SKUID'} className="min-w-0 flex-1 text-sm outline-none" /></label>
            <label className="flex h-9 items-center gap-2 rounded-md border border-[#E5E6EB] bg-white px-3 text-xs text-[#667085]">同步状态<select value={syncFilter} onChange={event => setSyncFilter(event.target.value as 'all' | SyncStatus)} className="bg-transparent text-sm text-[#1D2129] outline-none"><option value="all">全部状态</option><option value="not_synced">待同步</option><option value="syncing">同步中</option><option value="synced">同步成功</option><option value="failed">同步失败</option></select></label>
            {platform === 'douyin' && activeView === 'products' && <label className="flex h-9 items-center gap-2 rounded-md border border-[#E5E6EB] bg-white px-3 text-xs text-[#667085]">审核状态<select value={reviewFilter} onChange={event => setReviewFilter(event.target.value as 'all' | ReviewStatus)} className="bg-transparent text-sm text-[#1D2129] outline-none"><option value="all">全部状态</option><option value="not_submitted">未提交</option><option value="reviewing">审核中</option><option value="approved">审核通过</option><option value="rejected">审核失败</option></select></label>}
            <button type="button" onClick={() => { setKeyword(''); setSyncFilter('all'); setReviewFilter('all'); }} className="console-secondary-button">重置</button>
            {activeView === 'addons' ? <div className="ml-auto flex items-center gap-2"><button type="button" onClick={() => setShowAddonPicker(true)} className="console-secondary-button"><Plus size={15} />从主档加料添加</button><button type="button" onClick={openSyncConfirm} className="console-primary-button"><Send size={15} />同步至{platformName(platform)}{selectedSyncIds.length > 0 ? `（${selectedSyncIds.length}）` : ''}</button></div> : <div className="ml-auto"><button type="button" onClick={openProductPicker} className="console-primary-button"><Send size={15} />从渠道商品库同步</button></div>}
          </div>
        </section>

        <section className="console-panel min-h-0 flex-1 overflow-auto rounded-t-none">
          {activeView === 'products' ? (
            <table className={`w-full table-fixed text-left text-sm ${platform === 'douyin' ? 'min-w-[1080px]' : 'min-w-[920px]'}`}>
              <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs font-bold text-[#4E5969]">
                <tr>
                  <th className="w-[220px] border-b px-4 py-3">渠道商品</th>
                  <th className="w-[145px] border-b px-4 py-3">平台商品ID</th>
                  <th className="w-[190px] border-b px-4 py-3">平台商品类目</th>
                  <th className="w-[120px] border-b px-4 py-3">同步状态</th>
                  {platform === 'douyin' && <th className="w-[110px] border-b px-4 py-3">审核状态</th>}
                  <th className="w-[150px] border-b px-4 py-3">最近同步</th>
                  <th className="sticky right-0 w-[190px] border-b border-l bg-[#F7F8FA] px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const state = productStates[product.id];
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
                      <td className="border-b px-4 py-3"><span className={`inline-flex items-center gap-2 font-medium ${syncMeta.className}`}><i className={`h-2 w-2 rounded-full ${syncMeta.dot}`} />{syncMeta.label}</span>{state.syncStatus === 'failed' && <div className="mt-1 text-[11px] text-[#D9363E]">平台字段校验失败</div>}</td>
                      {platform === 'douyin' && <td className="border-b px-4 py-3"><span className={`inline-flex items-center gap-2 text-xs font-medium ${reviewMeta.className}`}><i className={`h-2 w-2 rounded-full ${reviewDot}`} />{reviewMeta.label}</span></td>}
                      <td className="border-b px-4 py-3 text-xs tabular-nums text-[#667085]">{state.updatedAt}</td>
                      <td className="sticky right-0 border-b border-l bg-white px-4 py-3 group-hover:bg-[#FAFBFC]"><div className="flex items-center gap-4 whitespace-nowrap text-xs font-bold"><button type="button" onClick={() => onEditProduct?.(product)} className="text-[#008F4C]">查看渠道资料</button>{platform === 'douyin' && state.reviewStatus !== 'not_submitted' && <button type="button" onClick={() => setAuditProduct(product)} className="text-[#245B8A]">审核记录</button>}</div></td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && <tr><td colSpan={platform === 'douyin' ? 7 : 6} className="px-6 py-20 text-center text-sm text-[#98A2B3]">暂无符合条件的平台商品</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[1060px] table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs font-bold text-[#4E5969]">
                <tr><th className="w-12 border-b px-4 py-3"><input type="checkbox" checked={filteredAddons.length > 0 && filteredAddons.every(item => selectedAddonIds.includes(item.id))} onChange={event => setSelectedAddonIds(event.target.checked ? filteredAddons.map(item => item.id) : [])} aria-label="选择全部加料" /></th><th className="w-[200px] border-b px-4 py-3">加料名称</th><th className="w-[120px] border-b px-4 py-3">企迈加料类型</th><th className="w-[190px] border-b px-4 py-3">抖音商品分类</th><th className="w-[100px] border-b px-4 py-3">销售价</th><th className="w-[120px] border-b px-4 py-3">同步状态</th><th className="w-[140px] border-b px-4 py-3">最近同步</th><th className="sticky right-0 w-[170px] border-b border-l bg-[#F7F8FA] px-4 py-3">操作</th></tr>
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
                      <td className="border-b px-4 py-3 tabular-nums">¥{item.price.toFixed(2)}</td>
                      <td className="border-b px-4 py-3"><span className={`inline-flex items-center gap-2 font-medium ${meta.className}`}><i className={`h-2 w-2 rounded-full ${meta.dot}`} />{meta.label}</span></td>
                      <td className="border-b px-4 py-3 text-xs tabular-nums text-[#667085]">{item.updatedAt}</td>
                      <td className="sticky right-0 border-b border-l bg-white px-4 py-3 group-hover:bg-[#FAFBFC]"><div className="flex gap-4 whitespace-nowrap text-xs font-bold"><button type="button" onClick={() => setEditingAddon(item)} className="text-[#008F4C]">维护资料</button><button type="button" onClick={() => { setSelectedAddonIds([item.id]); setShowSyncConfirm(true); }} disabled={item.syncStatus === 'syncing'} className="text-[#008F4C] disabled:text-[#C9CDD4]">{item.syncStatus === 'failed' ? '重新同步' : item.syncStatus === 'synced' ? '同步更新' : '同步'}</button></div></td>
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
        description={`仅展示所属“${catalogName}”的渠道商品；已生成的平台商品也可再次选择并同步更新。${platform === 'meituan' ? ' 美团在线点一期仅支持标准商品。' : ''}`}
        products={products}
        selectedIds={productPickerIds}
        onSelectedIdsChange={setProductPickerIds}
        disabledIds={platform === 'meituan' ? products.filter(product => product.type === 'combo').map(product => product.id) : []}
        disabledLabel={platform === 'meituan' ? '一期暂不支持' : undefined}
        confirmLabel="下一步"
        onCancel={() => { setShowProductPicker(false); setProductPickerIds([]); }}
        onConfirm={confirmProductPicker}
      />

      {showProductSyncConfirm && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="w-[680px] overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold text-[#1D2129]">同步{platformName(platform)}品牌商品</div><div className="mt-1 text-xs text-[#86909C]">从所属渠道商品库发起品牌级同步，不选择门店，也不会创建门店商品。</div></div><button type="button" onClick={() => setShowProductSyncConfirm(false)}><X size={18} /></button></div><div className="space-y-4 p-6"><div className="grid grid-cols-3 gap-3 rounded-md border bg-[#F7F8FA] p-4 text-sm"><div><div className="text-xs text-[#86909C]">商品来源</div><div className="mt-1 font-bold">{catalogName}</div></div><div><div className="text-xs text-[#86909C]">同步对象</div><div className="mt-1 font-bold">{productPickerIds.length} 个商品</div></div><div><div className="text-xs text-[#86909C]">目标平台</div><div className="mt-1 font-bold">{platformName(platform)}</div></div></div><div className="rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-xs leading-5 text-[#245B8A]">{platform === 'douyin' ? '新建或更新抖音标品后提交平台审核；更新审核期间继续使用当前生效版本。' : '美团品牌商品无需审核；一期仅同步标准商品，套餐商品不生成美团平台商品。'}</div></div><div className="flex items-center justify-between border-t bg-[#F7F8FA] px-6 py-4"><button type="button" onClick={onOpenSyncRecords} className="text-sm font-medium text-[#008F4C]">查看历史同步记录</button><div className="flex gap-2"><button type="button" onClick={() => { setShowProductSyncConfirm(false); setShowProductPicker(true); }} className="console-secondary-button">返回选择</button><button type="button" onClick={confirmProductSync} className="console-primary-button"><Send size={15} />确认同步</button></div></div></div></div>}

      {showSyncConfirm && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="w-[680px] overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold text-[#1D2129]">同步{platformName(platform)}加料品</div><div className="mt-1 text-xs text-[#86909C]">品牌级独立同步，不选择门店，也不会创建门店商品。</div></div><button type="button" onClick={() => setShowSyncConfirm(false)}><X size={18} /></button></div><div className="space-y-4 p-6"><div className="grid grid-cols-3 gap-3 rounded-md border bg-[#F7F8FA] p-4 text-sm"><div><div className="text-xs text-[#86909C]">资料来源</div><div className="mt-1 font-bold">商品主档加料</div></div><div><div className="text-xs text-[#86909C]">同步对象</div><div className="mt-1 font-bold">{selectedSyncIds.length} 个</div></div><div><div className="text-xs text-[#86909C]">目标平台</div><div className="mt-1 font-bold">{platformName(platform)}</div></div></div><div className="rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-xs leading-5 text-[#245B8A]">加料同步成功后，可在下发门店点单品时携带商品与加料的关联关系。</div></div><div className="flex items-center justify-between border-t bg-[#F7F8FA] px-6 py-4"><button type="button" onClick={onOpenSyncRecords} className="text-sm font-medium text-[#008F4C]">查看历史同步记录</button><div className="flex gap-2"><button type="button" onClick={() => setShowSyncConfirm(false)} className="console-secondary-button">取消</button><button type="button" onClick={confirmSync} className="console-primary-button"><Send size={15} />确认同步</button></div></div></div></div>}

      {editingAddon && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="w-[650px] overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold">维护抖音加料资料</div><div className="mt-1 text-xs text-[#86909C]">名称和企迈加料类型来自主档，不可修改。</div></div><button type="button" onClick={() => setEditingAddon(null)}><X size={18} /></button></div><div className="grid grid-cols-2 gap-4 p-6"><label className="text-sm"><span className="mb-2 block font-medium">加料名称</span><input readOnly value={editingAddon.name} className="h-10 w-full rounded-md border bg-[#F5F6F7] px-3 text-[#667085]" /></label><label className="text-sm"><span className="mb-2 block font-medium">企迈加料类型</span><input readOnly value={editingAddon.addonType} className="h-10 w-full rounded-md border bg-[#F5F6F7] px-3 text-[#667085]" /></label><label className="text-sm"><span className="mb-2 block font-medium">抖音商品分类 <b className="text-red-500">*</b></span><select value={editingAddon.category} onChange={event => setEditingAddon({ ...editingAddon, category: event.target.value })} className="h-10 w-full rounded-md border px-3"><option value="">请选择</option><option>饮品 / 奶茶</option><option>饮品 / 果茶</option><option>饮品 / 其他饮品</option><option>餐饮 / 小吃配料</option></select></label><label className="text-sm"><span className="mb-2 block font-medium">抖音销售价（元） <b className="text-red-500">*</b></span><input type="number" min="0" step="0.01" value={editingAddon.price} onChange={event => setEditingAddon({ ...editingAddon, price: Number(event.target.value) })} className="h-10 w-full rounded-md border px-3" /></label></div><div className="flex justify-end gap-2 border-t bg-[#F7F8FA] px-6 py-4"><button type="button" onClick={() => setEditingAddon(null)} className="console-secondary-button">取消</button><button type="button" onClick={() => { setAddons(current => current.map(item => item.id === editingAddon.id ? { ...editingAddon, syncStatus: item.syncStatus === 'synced' ? 'not_synced' : item.syncStatus } : item)); setEditingAddon(null); setNotice('抖音加料资料已保存，平台同步状态已更新'); }} className="console-primary-button">保存</button></div></div></div>}

      {auditProduct && <div className="absolute inset-0 z-[60] flex bg-black/30"><button type="button" className="absolute inset-0" onClick={() => setAuditProduct(null)} /><aside className="relative ml-auto flex h-full w-[680px] flex-col bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold">抖音平台审核记录</div><div className="mt-1 text-xs text-[#86909C]">{auditProduct.name} · 渠道商品ID {auditProduct.id}</div></div><button type="button" onClick={() => setAuditProduct(null)}><X size={18} /></button></div><div className="flex-1 space-y-4 overflow-auto p-6"><div className="rounded-lg border p-4"><div className="flex justify-between"><div><div className="font-bold">V2 · 资料更新</div><div className="mt-1 text-xs text-[#86909C]">2026-09-10 15:40 · 企迈静静</div></div><span className="h-fit border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">审核中</span></div><div className="mt-3 text-xs text-[#667085]">变更字段：商品名称、商品主图、规格信息</div></div><div className="rounded-lg border p-4"><div className="flex justify-between"><div><div className="font-bold">V1 · 首次提交</div><div className="mt-1 text-xs text-[#86909C]">2026-09-08 10:24 · 张晓明</div></div><span className="h-fit border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">审核通过</span></div><div className="mt-3 text-xs text-[#667085]">当前生效版本</div></div></div><div className="flex items-center justify-between border-t bg-[#F7F8FA] px-6 py-4"><span className="text-xs text-[#86909C]">审核事实以平台服务回传为准</span><button type="button" onClick={() => setAuditProduct(null)} className="console-primary-button">关闭</button></div></aside></div>}
    </main>
  );
};

const SelectionDialog = ({ title, description, rows, selectedIds, disabledIds, onChange, onCancel, onConfirm }: { title: string; description: string; rows: Array<{ id: string; title: string; description: string }>; selectedIds: string[]; disabledIds: string[]; onChange: (ids: string[]) => void; onCancel: () => void; onConfirm: () => void; }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="flex max-h-[78vh] w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><div className="text-lg font-bold text-[#1D2129]">{title}</div><div className="mt-1 text-xs text-[#86909C]">{description}</div></div><button type="button" onClick={onCancel}><X size={18} /></button></div><div className="border-b bg-[#FAFBFC] p-4"><label className="flex h-9 w-[320px] items-center rounded-md border bg-white px-3"><Search size={15} className="mr-2 text-[#98A2B3]" /><input placeholder="搜索名称或编码" className="flex-1 text-sm outline-none" /></label></div><div className="min-h-0 flex-1 overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-[#F7F8FA] text-xs text-[#4E5969]"><tr><th className="w-12 border-b px-4 py-3" /><th className="border-b px-4 py-3">名称</th><th className="w-[180px] border-b px-4 py-3">状态</th></tr></thead><tbody>{rows.map(row => { const disabled = disabledIds.includes(row.id); const checked = selectedIds.includes(row.id); return <tr key={row.id}><td className="border-b px-4 py-4"><input type="checkbox" disabled={disabled} checked={checked || disabled} onChange={event => onChange(event.target.checked ? [...selectedIds, row.id] : selectedIds.filter(id => id !== row.id))} /></td><td className="border-b px-4 py-4"><div className="font-bold text-[#1D2129]">{row.title}</div><div className="mt-1 text-xs text-[#98A2B3]">{row.description}</div></td><td className="border-b px-4 py-4 text-xs text-[#667085]">{disabled ? '已添加' : '可添加'}</td></tr>; })}</tbody></table></div><div className="flex items-center justify-between border-t bg-[#F7F8FA] px-6 py-4"><span className="text-sm text-[#667085]">已选择 {selectedIds.length} 个</span><div className="flex gap-2"><button type="button" onClick={onCancel} className="console-secondary-button">取消</button><button type="button" onClick={onConfirm} disabled={selectedIds.length === 0} className="console-primary-button disabled:opacity-45">确认添加</button></div></div></div></div>
);
