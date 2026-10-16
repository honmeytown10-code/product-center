
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, ChevronDown, MoreHorizontal, Filter, ListFilter, X, Trash2, HelpCircle, Package, ChevronLeft, ChevronRight, Box, Utensils, CupSoda, PanelLeftClose, PanelLeftOpen, Upload, ImageIcon, CheckCircle2, AlertTriangle, FileText, RefreshCw, Library, CircleCheck, CirclePause, FilePenLine } from 'lucide-react';
import { useProducts } from '../../context';
import type { Product } from '../../types';
import { blindBagChannels, buildBlindBagProduct, isBlindBagProduct } from '../../blindBag';
import { WebOnlineOrderingEntry } from './WebOnlineOrderingEntry';
import type { OnlineOrderingPlatform, OnlineOrderingPlatformView } from './WebOnlineOrderingPlatformHub';
import { getOmnichannelChannel } from '../../omnichannel';
import { getProductStoreRecords, fromStoreChannel, type ProductSalesScope } from './WebProductSalesScope';
import type { StoreProductRecord } from './WebStoreProductList';
import { WebProductLifecycleConfirm, type ProductLifecycleAction } from './WebProductLifecycleConfirm';
import { WebProductLibraryBatchDialog } from './WebProductLibraryBatchDialog';
const readProductScope = (product: Product): ProductSalesScope | undefined => {
  const data = (product as Product & { formData?: { salesScope?: ProductSalesScope; applicableChannelIds?: ProductSalesScope['channelIds'] } }).formData;
  return data?.salesScope || (data?.applicableChannelIds ? { channelIds: data.applicableChannelIds, storeIds: [] } : undefined);
};

type ProductTab = 'all' | 'on_shelf' | 'off_shelf' | 'draft';
type QuickCategoryView = 'backend' | 'frontend';
type BatchImageNamingRule = 'productId' | 'skuCode' | 'productMark' | 'productName';
type BatchImageType = 'main' | 'detail' | 'cover';
type BatchImageMode = 'append' | 'replace';
type BatchImageStep = 1 | 2;
type MatchStatus = 'matched' | 'duplicate' | 'unmatched';

const DEFAULT_FILTERS = {
  productId: '',
  skuId: '',
  frontendCategory: 'all',
  backendCategory: 'all',
  productType: 'all',
};

const getProductTypeLabel = (product: Product) => isBlindBagProduct(product) ? '标准商品 · 盲袋' : (product.type === 'combo' ? '套餐商品' : '标准商品');

const getProductStatusLabel = (product: Product) => {
  if (product.status === 'draft') return '草稿';
  return product.status === 'on_shelf' ? '已启用' : '已停用';
};

const getFrontendCategoryName = (product: Product) => {
  if (isBlindBagProduct(product)) return product.formData?.p_front_cat?.[0] || product.category || '未分类';
  if (product.type === 'combo') return '套餐组合';
  if (product.category === '现制饮品') return Number(product.id) % 2 === 0 ? '咖啡类' : '奶茶类';
  if (product.category === '中式正餐') return product.name.includes('火锅') ? '火锅锅底' : '炒菜/烧菜类';
  if (product.category === '西式快餐') return '轻食简餐';
  if (product.category === '烘焙甜品') return '甜品烘焙';
  if (product.category === '零售商品') return '零售周边';
  return '未分类';
};

const getBatchActions = (tab: ProductTab, unifiedManagement: boolean) => {
  if (tab === 'off_shelf') return ['批量启用', '批量归档'];
  const editActions = ['改价', '批量修改标准商品', '批量修改套餐商品', '加入到模板'];
  return tab === 'on_shelf' ? [...editActions, '批量停用'] : editActions;
};

const BATCH_IMAGE_TYPES: Array<{ id: BatchImageType; label: string; suffix: string }> = [
  { id: 'main', label: '商品主图', suffix: 'LB' },
  { id: 'detail', label: '商品详情图', suffix: 'XQ' },
  { id: 'cover', label: '商品封面图', suffix: 'FM' },
];

const BATCH_IMAGE_NAMING_RULES: Array<{ id: BatchImageNamingRule; label: string; tip: string }> = [
  { id: 'productId', label: '商品ID', tip: '最稳定，适合导出商品后维护图片名称' },
  { id: 'skuCode', label: '商品条码', tip: '适合门店或供应链已有条码命名' },
  { id: 'productMark', label: '商品标识', tip: '适合内部编码体系' },
  { id: 'productName', label: '商品名称', tip: '可减少改名成本，同名商品需人工确认' },
];

const normalizeMatchText = (value: string) => value.replace(/\.[^.]+$/, '').replace(/-(LB|XQ|FM)-?\d*$/i, '').trim().toLowerCase();

const getImageTypeFromFileName = (fileName: string): BatchImageType => {
  if (/-XQ/i.test(fileName)) return 'detail';
  if (/-FM/i.test(fileName)) return 'cover';
  return 'main';
};

const buildCopyProduct = (product: Product): Product => {
  if (isBlindBagProduct(product)) return buildBlindBagProduct({
    id: `blind-bag-${crypto.randomUUID()}`, skuCode: `BB-${crypto.randomUUID()}`,
    createdTime: new Date().toLocaleString('sv-SE', { hour12: false }), status: 'draft',
    formData: { ...product.formData, p_name: `${product.name}-复制` },
    channelIds: blindBagChannels(product), unlimited: product.stock === -1,
  });
  const suffix = Date.now().toString().slice(-6);
  return {
    ...product,
    id: `${product.id}-copy-${suffix}`,
    name: `${product.name}-复制`,
    skuCode: `${product.skuCode}-COPY`,
    status: 'draft',
    createdTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
};

export const WebProductList: React.FC<{
  onCreateClick: (type: 'standard' | 'combo') => void;
  onImportClick: () => void;
  onImportRecordsClick?: () => void;
  onViewDetail?: (product: any) => void;
  onEditProduct?: (product: any) => void;
  onSyncToChannelProducts?: (products: Product[]) => void;
  unifiedManagement?: boolean;
  directUse?: boolean;
  storeRecords?: StoreProductRecord[];
  onLifecycleAction?: (action: ProductLifecycleAction, products: Product[]) => void | Promise<void>;
  onBatchEdit?: (type: 'standard' | 'combo', products: Product[], returnTab: ProductTab) => void;
  templateProductIds?: Record<string, string[]>;
  onAddToTemplates?: (templateIds: string[], productIds: string[]) => void | Promise<void>;
  initialTab?: ProductTab;
  onlineChannels?: { douyin: boolean; meituan: boolean };
  onOpenOnlineProducts?: (platform: OnlineOrderingPlatform, view: OnlineOrderingPlatformView) => void;
}> = ({ onCreateClick, onImportClick, onImportRecordsClick, onViewDetail, onEditProduct, onSyncToChannelProducts, unifiedManagement = false, directUse = false, storeRecords = [], onLifecycleAction, onBatchEdit, templateProductIds, onAddToTemplates, initialTab = 'on_shelf', onlineChannels, onOpenOnlineProducts }) => {
  const { products, categories, addProduct, updateProduct, deleteProduct, toggleShelfStatus } = useProducts();
  const [activeTab, setActiveTab] = useState<ProductTab>(initialTab);
  const [batchDialog, setBatchDialog] = useState<'price' | 'template' | 'enable' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showToolbarMoreDropdown, setShowToolbarMoreDropdown] = useState(false);
  const [isCategoryPanelCollapsed, setIsCategoryPanelCollapsed] = useState(false);
  const [quickCategoryView, setQuickCategoryView] = useState<QuickCategoryView>('backend');
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [rowMoreMenu, setRowMoreMenu] = useState<{ productId: string; top: number; left: number } | null>(null);
  const [showBatchImageModal, setShowBatchImageModal] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [scopeProduct, setScopeProduct] = useState<Product | null>(null);
  const [lifecycleConfirmation, setLifecycleConfirmation] = useState<{ action: ProductLifecycleAction; products: Product[] } | null>(null);
  const requestLifecycleAction = (action: ProductLifecycleAction, targets: Product[]) => {
    setRowMoreMenu(null);
    setLifecycleConfirmation({ action, products: targets });
  };
  const showNotice = (message: string) => { setActionNotice(message); window.setTimeout(() => setActionNotice(''), 2400); };

  const tabCounts = useMemo(
    () => ({
      all: products.length,
      on_shelf: products.filter(item => item.status === 'on_shelf').length,
      off_shelf: products.filter(item => item.status === 'off_shelf').length,
      draft: products.filter(item => item.status === 'draft').length,
    }),
    [products]
  );

  const categorySourceProducts = useMemo(() => products.filter(product => {
    if (activeTab === 'on_shelf' && product.status !== 'on_shelf') return false;
    if (activeTab === 'off_shelf' && product.status !== 'off_shelf') return false;
    if (activeTab === 'draft' && product.status !== 'draft') return false;
    // Production's all view includes drafts; switching state resets selection.
    if (appliedFilters.productId && !product.id.includes(appliedFilters.productId)) return false;
    if (appliedFilters.skuId && !product.skuCode.includes(appliedFilters.skuId)) return false;
    if (appliedFilters.backendCategory !== 'all' && product.category !== appliedFilters.backendCategory) return false;
    if (appliedFilters.frontendCategory !== 'all' && getFrontendCategoryName(product) !== appliedFilters.frontendCategory) return false;
    if (appliedFilters.productType !== 'all' && (product.type === 'combo' ? 'combo' : 'standard') !== appliedFilters.productType) return false;
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && !product.skuCode.includes(searchQuery) && !product.id.includes(searchQuery)) return false;
    return true;
  }), [activeTab, appliedFilters, products, searchQuery]);

  const backendQuickCategories = useMemo(() => {
    const names = Array.from(new Set([...categories.map(item => item.name), ...categorySourceProducts.map(item => item.category).filter(Boolean)]));
    return names
      .map(name => ({
        name,
        count: categorySourceProducts.filter(product => product.category === name).length,
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
  }, [categories, categorySourceProducts]);

  const frontendQuickCategories = useMemo(() => Array.from(new Set(categorySourceProducts.map(getFrontendCategoryName)))
    .map(name => ({ name, count: categorySourceProducts.filter(product => getFrontendCategoryName(product) === name).length }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN')), [categorySourceProducts]);

  const quickCategories = quickCategoryView === 'backend' ? backendQuickCategories : frontendQuickCategories;
  const allFrontendCategories = useMemo(() => Array.from(new Set(products.map(getFrontendCategoryName))).sort((a, b) => a.localeCompare(b, 'zh-CN')), [products]);

  const filteredProducts = useMemo(() => {
    if (!selectedQuickCategory) return categorySourceProducts;
    return categorySourceProducts.filter(product => quickCategoryView === 'backend'
      ? product.category === selectedQuickCategory
      : getFrontendCategoryName(product) === selectedQuickCategory);
  }, [categorySourceProducts, quickCategoryView, selectedQuickCategory]);

  const batchActions = getBatchActions(activeTab, unifiedManagement);
  const selectionEnabled = true;
  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every(item => selectedProductIds.includes(item.id));

  const selectedProducts = useMemo(
    () => products.filter(product => selectedProductIds.includes(product.id)),
    [products, selectedProductIds]
  );
  useEffect(() => {
    const visibleIds = new Set(filteredProducts.map(product => product.id));
    setSelectedProductIds(current => current.filter(id => visibleIds.has(id)));
  }, [filteredProducts]);
  const toolbarMoreActions = [
    ...(!unifiedManagement ? [{ label: '同步至渠道商品', enabled: selectedProductIds.length > 0 }] : []),
    { label: '批量增/换图片', enabled: products.length > 0 },
  ];

  const handleTabChange = (tab: ProductTab) => {
    setActiveTab(tab);
    setSelectedQuickCategory(null);
    setSelectedProductIds([]);
    setRowMoreMenu(null);
    setShowToolbarMoreDropdown(false);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const handleResetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSelectedQuickCategory(null);
    setSearchQuery('');
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (!selectionEnabled) return;
    setSelectedProductIds(checked ? filteredProducts.map(item => item.id) : []);
  };

  const handleToggleProduct = (productId: string, checked: boolean) => {
    if (!selectionEnabled) return;
    setSelectedProductIds(prev => {
      if (checked) {
        return prev.includes(productId) ? prev : [...prev, productId];
      }
      return prev.filter(id => id !== productId);
    });
  };

  const handleCopyProduct = (product: Product) => {
    addProduct(buildCopyProduct(product));
    setRowMoreMenu(null);
  };

  const handleToggleShelf = (product: Product) => {
    if (product.status === 'draft') return;
    if (product.status === 'on_shelf') { requestLifecycleAction('disable', [product]); return; }
    toggleShelfStatus(product.id);
    setRowMoreMenu(null);
  };

  const getRowMoreActions = (product: Product) => {
    return [
      { key: 'enable', label: product.status === 'on_shelf' ? (unifiedManagement ? '停用商品' : '停用主档') : (unifiedManagement ? '启用商品' : '启用主档'), onClick: () => handleToggleShelf(product) },
      ...(!unifiedManagement && !directUse ? [{ key: 'channel-products', label: '查看渠道商品', onClick: () => setRowMoreMenu(null) }] : []),
      { key: 'copy', label: '复制', onClick: () => handleCopyProduct(product) },
      { key: 'archive', label: '归档', onClick: () => requestLifecycleAction('archive', [product]) },
    ];
  };

  const handleOpenRowMoreMenu = (event: React.MouseEvent<HTMLButtonElement>, productId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 144;
    const horizontalPadding = 12;
    const left = Math.min(Math.max(rect.right - menuWidth, horizontalPadding), window.innerWidth - menuWidth - horizontalPadding);

    setRowMoreMenu(prev =>
      prev?.productId === productId
        ? null
        : {
            productId,
            top: rect.bottom + 8,
            left,
          }
    );
  };

  return (
    <main className="console-product-library relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      {actionNotice && <div className="absolute left-1/2 top-3 z-[80] -translate-x-1/2 rounded-md bg-[#1D2129] px-4 py-2 text-[13px] text-white shadow-lg">{actionNotice}</div>}
      <div className="console-status-toolbar flex min-h-[64px] shrink-0 items-center justify-between gap-5 border-b border-[#E8E8E8] bg-white px-5 py-2">
        <div className="console-status-tabs grid min-w-[640px] max-w-[820px] flex-1 grid-cols-4 gap-2" role="tablist" aria-label={unifiedManagement ? '商品状态概览' : '主档状态概览'}>
          {[
            { id: 'all' as const, label: unifiedManagement ? '全部商品' : '全部主档', count: tabCounts.all, icon: Library },
            { id: 'on_shelf' as const, label: '已启用', count: tabCounts.on_shelf, icon: CircleCheck },
            { id: 'off_shelf' as const, label: '已停用', count: tabCounts.off_shelf, icon: CirclePause },
            { id: 'draft' as const, label: '草稿', count: tabCounts.draft, icon: FilePenLine },
          ].map(item => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleTabChange(item.id)}
                className={`flex min-w-0 items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'border-[#B7E8CB] bg-[#F1FBF6]'
                    : 'border-transparent bg-white hover:bg-[#F7F8FA]'
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  active ? 'bg-[#DFF6EA] text-[#008F4C]' : 'bg-[#F2F4F7] text-[#86909C]'
                }`}>
                  <Icon size={16} />
                </span>
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className={`truncate text-[13px] font-medium ${active ? 'text-[#008F4C]' : 'text-[#667085]'}`}>{item.label}</span>
                  <span className={`text-[18px] font-semibold leading-none ${active ? 'text-[#008F4C]' : 'text-[#1D2129]'}`}>{item.count}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-4">
        {unifiedManagement && onlineChannels && onOpenOnlineProducts && <WebOnlineOrderingEntry label="在线点商品审核状态" {...onlineChannels} onOpen={onOpenOnlineProducts} />}
        <button onClick={() => showNotice('回收站暂无已归档商品')} className="flex items-center text-[13px] text-[#666] hover:text-[#333]">
          <Trash2 size={14} className="mr-1.5" /> 回收站
        </button>
        </div>
      </div>

      <div className="console-library-filters shrink-0 space-y-3 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-[36px] w-[200px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 transition-colors hover:border-[#00C06B]">
            <span className="mr-2 whitespace-nowrap text-xs text-gray-500">商品ID:</span>
            <input
              className="w-full flex-1 text-sm outline-none"
              placeholder="请输入"
              value={draftFilters.productId}
              onChange={e => setDraftFilters(prev => ({ ...prev, productId: e.target.value }))}
            />
          </div>
          <div className="flex h-[36px] w-[200px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 transition-colors hover:border-[#00C06B]">
            <span className="mr-2 whitespace-nowrap text-xs text-gray-500">SKUID:</span>
            <input
              className="w-full flex-1 text-sm outline-none"
              placeholder="请输入"
              value={draftFilters.skuId}
              onChange={e => setDraftFilters(prev => ({ ...prev, skuId: e.target.value }))}
            />
          </div>
          <div className="group flex h-[36px] w-[220px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 transition-colors hover:border-[#00C06B]">
            <span className="mr-2 whitespace-nowrap text-xs text-gray-500">前台分类:</span>
            <select className="w-full flex-1 cursor-pointer bg-transparent text-sm text-[#333] outline-none" value={draftFilters.frontendCategory} onChange={e => setDraftFilters(prev => ({ ...prev, frontendCategory: e.target.value }))}>
              <option value="all">全部</option>
              {allFrontendCategories.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            {draftFilters.frontendCategory !== 'all' ? <X size={14} className="ml-1 cursor-pointer text-gray-400 hover:text-red-500" onClick={() => setDraftFilters(prev => ({ ...prev, frontendCategory: 'all' }))} /> : <ChevronDown size={14} className="text-gray-400 group-hover:text-[#00C06B]" />}
          </div>
          <div className="group flex h-[36px] w-[220px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 transition-colors hover:border-[#00C06B]">
            <span className="mr-2 whitespace-nowrap text-xs text-gray-500">后台分类:</span>
            <select
              className="w-full flex-1 cursor-pointer bg-transparent text-sm text-[#333] outline-none"
              value={draftFilters.backendCategory}
              onChange={e => setDraftFilters(prev => ({ ...prev, backendCategory: e.target.value }))}
            >
              <option value="all">全部</option>
              {backendQuickCategories.map(item => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            {draftFilters.backendCategory !== 'all' ? (
              <X
                size={14}
                className="ml-1 cursor-pointer text-gray-400 hover:text-red-500"
                onClick={() => setDraftFilters(prev => ({ ...prev, backendCategory: 'all' }))}
              />
            ) : (
              <ChevronDown size={14} className="text-gray-400 group-hover:text-[#00C06B]" />
            )}
          </div>
          <div className="flex h-[36px] w-[240px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 transition-colors hover:border-[#00C06B]">
            <span className="mr-2 whitespace-nowrap text-xs text-gray-500">商品类型:</span>
            <select
              className="w-full flex-1 cursor-pointer bg-transparent text-sm outline-none"
              value={draftFilters.productType}
              onChange={e => setDraftFilters(prev => ({ ...prev, productType: e.target.value }))}
            >
              <option value="all">全部</option>
              <option value="standard">标准商品</option>
              <option value="combo">套餐商品</option>
            </select>
            {draftFilters.productType !== 'all' && (
              <X size={14} className="ml-1 cursor-pointer text-gray-400 hover:text-red-500" onClick={() => setDraftFilters(prev => ({ ...prev, productType: 'all' }))} />
            )}
          </div>

          <button onClick={() => showNotice('当前页面已展示全部可用筛选条件')} className="flex h-[36px] items-center rounded-md border border-[#E8E8E8] bg-white px-4 text-[13px] text-[#666] transition-all hover:border-[#00C06B] hover:bg-gray-50 hover:text-[#00C06B]">
            <Plus size={14} className="mr-1" /> 添加筛选
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => showNotice('快捷筛选已保存')} className="flex items-center rounded-md border border-[#E8E8E8] bg-white px-4 py-1.5 text-[13px] text-[#333] transition-all hover:bg-gray-50">
              <Box size={14} className="mr-2 text-gray-400" /> 保存快捷筛选项
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleResetFilters} className="h-[36px] rounded-md border border-[#E8E8E8] bg-white px-5 text-[13px] text-[#333] transition-colors hover:bg-gray-50 hover:text-[#00C06B]">
              重置
            </button>
            <button onClick={handleApplyFilters} className="h-[36px] rounded-md bg-[#00C06B] px-6 text-[13px] font-bold text-white transition-all hover:bg-[#00A35B] active:scale-95">
              查询
            </button>
          </div>
        </div>
      </div>

      <div className="console-library-results flex min-h-0 flex-1 flex-col overflow-hidden bg-white px-4 pb-4 pt-2">
        <div className="relative flex min-h-0 flex-1">
          {!isCategoryPanelCollapsed && (
            <aside className="flex min-h-0 w-[240px] shrink-0 flex-col rounded-lg border border-[#E8E8E8] bg-white">
              <div className="flex h-11 items-center justify-between border-b border-[#E8E8E8] px-3">
                <div className="flex items-center gap-4 text-[13px]">
                  <button type="button" aria-pressed={quickCategoryView === 'frontend'} onClick={() => { setQuickCategoryView('frontend'); setSelectedQuickCategory(null); }} className={quickCategoryView === 'frontend' ? 'font-bold text-[#00A35B]' : 'text-[#667085] hover:text-[#333]'}>前台分类</button>
                  <button type="button" aria-pressed={quickCategoryView === 'backend'} onClick={() => { setQuickCategoryView('backend'); setSelectedQuickCategory(null); }} className={quickCategoryView === 'backend' ? 'font-bold text-[#00A35B]' : 'text-[#667085] hover:text-[#333]'}>后台分类</button>
                </div>
              </div>
              <div className="no-scrollbar flex-1 overflow-y-auto p-2">
                <button
                  onClick={() => setSelectedQuickCategory(null)}
                  className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] ${
                    !selectedQuickCategory
                      ? 'bg-[#EAF9F1] font-bold text-[#00C06B]'
                      : 'text-[#333] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <span>全部</span>
                  <span className="text-[12px] text-[#98A2B3]">{categorySourceProducts.length}</span>
                </button>
                {quickCategories.map(item => (
                  <button
                    key={item.name}
                    onClick={() => setSelectedQuickCategory(item.name)}
                    className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] ${
                      selectedQuickCategory === item.name
                        ? 'bg-[#EAF9F1] font-bold text-[#00C06B]'
                        : 'text-[#333] hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="ml-2 shrink-0 text-[12px] text-[#98A2B3]">{item.count}</span>
                  </button>
                ))}
              </div>
            </aside>
          )}

          <button
            onClick={() => setIsCategoryPanelCollapsed(prev => !prev)}
            className="absolute top-1/2 z-20 flex h-14 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#98A2B3] shadow-sm transition-all hover:border-[#00C06B] hover:text-[#00C06B]"
            style={{ left: isCategoryPanelCollapsed ? 0 : 230 }}
            title={isCategoryPanelCollapsed ? '展开分类' : '收起分类'}
          >
            {isCategoryPanelCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="group relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400 transition-colors group-hover:text-[#00C06B]" />
                  <input
                    className="h-[36px] w-[240px] rounded-md border border-[#E8E8E8] bg-white pl-9 pr-4 text-[13px] transition-colors focus:border-[#00C06B] focus:outline-none"
                    placeholder="搜索商品名称、商品ID、SKUID"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    className="flex h-[36px] items-center rounded-md border border-[#E8E8E8] px-3 text-[13px] text-[#666] transition-all hover:border-[#00C06B] hover:bg-gray-50 hover:text-[#00C06B]"
                    onClick={() => {
                      setShowImportDropdown(prev => !prev);
                      setShowToolbarMoreDropdown(false);
                      setRowMoreMenu(null);
                    }}
                  >
                    导入/导出 <ChevronDown size={14} className="ml-1" />
                  </button>
                  {showImportDropdown && (
                    <div className="absolute left-0 top-[38px] z-20 w-40 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-xl">
                      <button
                        onClick={() => {
                          onImportClick();
                          setShowImportDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#00C06B]"
                      >
                        批量导入商品
                      </button>
                      <button
                        onClick={() => {
                          onImportRecordsClick?.();
                          setShowImportDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#00C06B]"
                      >
                        授权导入记录
                      </button>
                      <div className="my-1 h-px bg-gray-100" />
                      <button onClick={() => { showNotice(`已导出 ${selectedProductIds.length || filteredProducts.length} 个商品`); setShowImportDropdown(false); }} className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#00C06B]">
                        导出选中商品
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    className="flex h-[36px] items-center rounded-md border border-[#E8E8E8] px-3 text-[13px] text-[#666] transition-all hover:border-[#00C06B] hover:bg-gray-50 hover:text-[#00C06B]"
                    onClick={() => {
                      setShowToolbarMoreDropdown(prev => !prev);
                      setShowImportDropdown(false);
                      setRowMoreMenu(null);
                    }}
                  >
                    更多操作 <ChevronDown size={14} className="ml-1" />
                  </button>
                  {showToolbarMoreDropdown && (
                    <div className="absolute right-0 top-[38px] z-20 w-44 overflow-hidden rounded-lg border border-[#E8E8E8] bg-white py-1 shadow-xl">
                      {toolbarMoreActions.map(action => (
                        <button
                          key={action.label}
                          disabled={!action.enabled}
                          className={`w-full px-4 py-2.5 text-left text-[13px] ${
                            action.enabled ? 'text-[#333] hover:bg-[#F7F8FA] hover:text-[#00C06B]' : 'cursor-not-allowed text-[#C0C4CC]'
                          }`}
                          onClick={() => {
                            if (action.label === '同步至渠道商品') {
                              onSyncToChannelProducts?.(selectedProducts);
                            } else if (action.label === '批量增/换图片') {
                              setShowBatchImageModal(true);
                            } else {
                              showNotice(`${action.label}已进入批量处理流程`);
                            }
                            setShowToolbarMoreDropdown(false);
                          }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => onCreateClick('standard')} className="flex h-[36px] items-center rounded-md bg-[#00C06B] px-4 text-[13px] font-bold text-white transition-all hover:bg-[#00A35B] active:scale-95">
                  <CupSoda size={16} className="mr-1.5" /> {unifiedManagement ? '新建单品' : '新建单品主档'}
                </button>
                <button onClick={() => onCreateClick('combo')} className="flex h-[36px] items-center rounded-md border border-[#00C06B] bg-white px-4 text-[13px] font-bold text-[#00C06B] transition-all hover:bg-[#E6F8F0] active:scale-95">
                  <Utensils size={16} className="mr-1.5" /> {unifiedManagement ? '新建套餐商品' : '新建套餐主档'}
                </button>
              </div>
            </div>

            {selectedProductIds.length > 0 && batchActions.length > 0 && (
              <div role="region" aria-label="商品批量操作" className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-md border border-[#9AD7B8] bg-[#EAF8F1] px-4 py-3">
                <div className="text-[13px] text-[#333]">
                  已选择 <span className="font-bold text-[#00C06B]">{selectedProductIds.length}</span> 个商品
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {batchActions.map(action => {
                    const isDanger = action === '批量停用' || action === '批量归档';
                    return (
                      <button
                        key={action}
                        onClick={() => {
                          if (isDanger) { requestLifecycleAction(action === '批量停用' ? 'disable' : 'archive', selectedProducts); return; }
                          if (action === '批量启用') { setBatchDialog('enable'); return; }
                          if (action === '改价') { setBatchDialog('price'); return; }
                          if (action === '加入到模板') { setBatchDialog('template'); return; }
                          const type = action === '批量修改套餐商品' ? 'combo' : 'standard';
                          const targets = selectedProducts.filter(product => (product.type === 'combo' ? 'combo' : 'standard') === type);
                          if (!targets.length) { showNotice(`所选商品中没有${type === 'combo' ? '套餐商品' : '标准商品'}，请调整选择。`); return; }
                          onBatchEdit?.(type, targets, activeTab);
                        }}
                        className={`rounded px-2 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008647] ${
                          isDanger
                            ? 'text-[#CB2634] hover:bg-[#FFF5F5]'
                            : 'text-[#008647] hover:bg-white/70'
                        }`}
                      >
                        {action}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => setSelectedProductIds([])} className="ml-1 border-l border-[#9AD7B8] pl-3 text-[13px] font-medium text-[#008647] hover:underline">取消选择</button>
                </div>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between text-[12px] text-[#98A2B3]">
              <div className="flex items-center gap-2">
                {selectedQuickCategory && (
                  <span className="rounded-full bg-[#F5F7FA] px-3 py-1 text-[#5B6475]">
                    {quickCategoryView === 'backend' ? '后台分类' : '前台分类'}：{selectedQuickCategory}
                  </span>
                )}
                {appliedFilters.frontendCategory !== 'all' && (
                  <span className="rounded-full bg-[#F5F7FA] px-3 py-1 text-[#5B6475]">前台分类筛选：{appliedFilters.frontendCategory}</span>
                )}
                {appliedFilters.backendCategory !== 'all' && (
                  <span className="rounded-full bg-[#F5F7FA] px-3 py-1 text-[#5B6475]">商品类目筛选：{appliedFilters.backendCategory}</span>
                )}
              </div>
            </div>

            <div className="relative flex-1 overflow-auto rounded-lg border border-[#E8E8E8] no-scrollbar">
              <table className="min-w-[1080px] w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                  <tr className="h-[48px] border-b border-[#E8E8E8] text-[12px] font-bold text-[#666]">
                    <th className="w-[50px] pl-4">
                      {selectionEnabled ? (
                        <input type="checkbox" checked={allVisibleSelected} onChange={e => handleToggleSelectAll(e.target.checked)} className="rounded-sm border-gray-300" />
                      ) : (
                        <span className="block h-4 w-4" />
                      )}
                    </th>
                    <th className="min-w-[280px] whitespace-nowrap px-4">商品名称</th>
                    <th className="w-[110px] whitespace-nowrap px-4">
                      商品类型 <Filter size={12} className="ml-1 inline text-[#00C06B]" />
                    </th>
                    <th className="w-[140px] whitespace-nowrap px-4">商品类目</th>
                    <th className="w-[120px] whitespace-nowrap px-4">售价</th>
                    <th className="w-[100px] whitespace-nowrap px-4">{unifiedManagement ? '商品状态' : '主档状态'}</th>
                    {unifiedManagement ? <th className="w-[200px] whitespace-nowrap px-4">销售渠道</th> : <th className="w-[100px] whitespace-nowrap px-4">数据来源</th>}
                    <th className="w-[160px] whitespace-nowrap px-4">创建时间</th>
                    <th className="w-[100px] whitespace-nowrap px-4">备注</th>
                    <th className="sticky right-0 z-20 w-[140px] whitespace-nowrap bg-[#F7F8FA] px-4 text-center shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-[#333]">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <tr key={product.id} className="group border-b border-[#F5F5F5] transition-colors hover:bg-[#F9FFFC]">
                        <td className="py-3 pl-4">
                          {selectionEnabled ? (
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={e => handleToggleProduct(product.id, e.target.checked)}
                              className="rounded-sm border-gray-300"
                            />
                          ) : (
                            <span className="block h-4 w-4" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center">
                            <img src={product.image} className="mr-3 h-10 w-10 rounded-md border border-[#EEE] object-cover transition-colors group-hover:border-[#00C06B]" />
                            <div className="min-w-0">
                              <div className="mb-0.5 cursor-pointer truncate font-bold transition-colors group-hover:text-[#00C06B]">{product.name}</div>
                              <div className="text-[11px] text-[#999]">商品ID：{product.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#666]">{getProductTypeLabel(product)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#666]">{(isBlindBagProduct(product) ? product.formData?.p_cat : product.category) || '未分类'}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-[#333]">¥{product.price.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={product.status === 'on_shelf' ? 'text-[#00A35B]' : 'text-[#999]'}>{getProductStatusLabel(product)}</span>
                        </td>
                        {unifiedManagement ? <td className="px-4 py-3"><span className="block min-w-[150px] max-w-[220px] whitespace-normal break-words leading-5 text-[#4E5969]">{readProductScope(product)?.channelIds?.map(id => getOmnichannelChannel(id).name).join('、') || '未设置'}</span></td> : <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center text-[#666]">
                            品牌主档
                          </div>
                        </td>}
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-[#666]">{product.createdTime}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#999]">-</td>
                        <td className="sticky right-0 z-10 whitespace-nowrap bg-white px-4 py-3 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)] group-hover:bg-[#F9FFFC]">
                          <div className="flex items-center justify-center space-x-3 whitespace-nowrap text-[#00C06B]">
                            <button className="font-medium hover:text-[#00A35B] hover:underline" onClick={() => onEditProduct?.(product)}>
                              编辑
                            </button>
                            <button className="font-medium hover:text-[#00A35B] hover:underline" onClick={() => onViewDetail?.(product)}>
                              详情
                            </button>
                            <div className="relative">
                              <button
                                className="flex items-center text-[#999] hover:text-[#00C06B]"
                                  onClick={event => {
                                    handleOpenRowMoreMenu(event, product.id);
                                    setShowImportDropdown(false);
                                    setShowToolbarMoreDropdown(false);
                                  }}
                              >
                                <MoreHorizontal size={16} className="cursor-pointer" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="bg-gray-50/30 py-20 text-center text-[#999]">
                        <div className="flex flex-col items-center">
                          <Package size={40} className="mb-4 text-[#EEE]" />
                          <span>暂无相关商品数据</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex h-[48px] shrink-0 items-center justify-end border-t border-[#E8E8E8] bg-white px-4 text-[12px] text-[#666]">
              <span>共 {filteredProducts.length} 条</span>
              <div className="ml-4 flex items-center space-x-2">
                <button type="button" disabled aria-label="上一页" className="flex h-6 w-6 cursor-not-allowed items-center justify-center rounded border bg-gray-50 text-gray-400">
                  <ChevronLeft size={12} />
                </button>
                <button type="button" disabled aria-current="page" className="flex h-6 w-6 items-center justify-center rounded border border-[#00C06B] bg-white font-bold text-[#00C06B]">1</button>
                <button type="button" disabled title="当前演示数据仅一页" className="flex h-6 w-6 cursor-not-allowed items-center justify-center rounded border bg-white text-gray-300">2</button>
                <button type="button" disabled title="当前演示数据仅一页" className="flex h-6 w-6 cursor-not-allowed items-center justify-center rounded border bg-white text-gray-300">...</button>
                <button type="button" disabled title="当前演示数据仅一页" className="flex h-6 w-6 cursor-not-allowed items-center justify-center rounded border bg-white text-gray-300">10</button>
                <button type="button" disabled aria-label="下一页" className="flex h-6 w-6 cursor-not-allowed items-center justify-center rounded border bg-white text-gray-300">
                  <ChevronRight size={12} />
                </button>
              </div>
              <select className="ml-4 cursor-pointer rounded border bg-white px-1 py-0.5 outline-none transition-colors hover:border-[#00C06B]">
                <option>20条/页</option>
                <option>50条/页</option>
              </select>
            </div>
          </div>
        </div>
        {rowMoreMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setRowMoreMenu(null)}
          >
            <div
              className="absolute w-36 overflow-hidden rounded-lg border border-[#E8E8E8] bg-white py-1 text-left shadow-xl"
              style={{ top: rowMoreMenu.top, left: rowMoreMenu.left }}
              onClick={event => event.stopPropagation()}
            >
              {getRowMoreActions(products.find(item => item.id === rowMoreMenu.productId)!).map(action => (
                <button
                  key={action.key}
                  className="w-full px-4 py-2.5 text-left text-[13px] text-[#333] hover:bg-[#F7F8FA] hover:text-[#00C06B]"
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {lifecycleConfirmation && <WebProductLifecycleConfirm
          action={lifecycleConfirmation.action}
          products={lifecycleConfirmation.products}
          unifiedManagement={unifiedManagement}
          storeCount={new Set(storeRecords.filter(record => lifecycleConfirmation.products.some(product => product.id === record.baseProductId)).map(record => record.storeId)).size}
          onCancel={() => setLifecycleConfirmation(null)}
          onConfirm={async () => {
            const { action, products: targets } = lifecycleConfirmation;
            if (onLifecycleAction) await onLifecycleAction(action, targets);
            else targets.forEach(product => action === 'disable' ? updateProduct(product.id, { status: 'off_shelf' }) : deleteProduct(product.id));
            setLifecycleConfirmation(null);
            setSelectedProductIds([]);
            showNotice(action === 'disable' ? `已停用 ${targets.length} 个商品${unifiedManagement ? '，所有关联门店商品已下架' : ''}` : `已归档 ${targets.length} 个商品${unifiedManagement ? '，已从商品库、门店和模板移除' : ''}`);
          }}
        />}
        {batchDialog && <WebProductLibraryBatchDialog action={batchDialog} products={selectedProducts} templateProductIds={templateProductIds} onAddToTemplates={onAddToTemplates} onCancel={() => setBatchDialog(null)} onComplete={message => { setBatchDialog(null); setSelectedProductIds([]); showNotice(message); }} />}
        {showBatchImageModal && (
          <BatchImageImportModal
            products={products}
            onClose={() => setShowBatchImageModal(false)}
            onApply={(updates) => {
              updates.forEach(item => updateProduct(item.productId, { image: item.imageUrl }));
            }}
          />
        )}
        {scopeProduct && <ProductScopeDrawer product={scopeProduct} records={getProductStoreRecords(storeRecords, scopeProduct.id)} onClose={() => setScopeProduct(null)} onEdit={() => { setScopeProduct(null); onEditProduct?.(scopeProduct); }} />}
      </div>
    </main>
  );
};

// Production: shared Drawer, QmListTable and authorized store-name lookup.
const ProductScopeDrawer: React.FC<{ product: Product; records: StoreProductRecord[]; onClose: () => void; onEdit: () => void }> = ({ product, records, onClose, onEdit }) => {
  const scope = readProductScope(product);
  const [keyword, setKeyword] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const controls = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); previousFocus?.focus(); };
  }, [onClose]);
  const rows = records.flatMap(record => record.channels.map(channel => ({ ...record, channel }))).filter(record => `${record.storeName} ${record.storeId} ${getOmnichannelChannel(fromStoreChannel(record.channel)).name}`.includes(keyword.trim()));
  return createPortal(<div className="fixed inset-0 z-[150] flex justify-end bg-black/30" onClick={onClose}>
    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="product-scope-title" className="flex h-full w-full max-w-[600px] flex-col bg-white shadow-2xl focus:outline-none" onClick={event => event.stopPropagation()}>
      <header className="flex items-start justify-between border-b border-[#E5E6EB] p-5"><div><h2 id="product-scope-title" className="text-[18px] font-semibold text-[#1D2129]">门店商品</h2><p className="mt-1 max-w-[480px] break-words text-[14px] text-[#4E5969]">{product.name}</p></div><button type="button" aria-label="关闭门店商品" className="rounded p-2 text-[#667085] hover:bg-[#F2F3F5]" onClick={onClose}><X size={18} /></button></header>
      <div className="flex-1 overflow-auto p-5">
        <h3 className="mb-3 text-sm font-semibold">商品库销售渠道</h3><div className="mb-6 flex flex-wrap gap-2">{scope?.channelIds?.length ? scope.channelIds.map(id => <span key={id} className="rounded bg-[#F2F3F5] px-3 py-1 text-[13px] text-[#4E5969]">{getOmnichannelChannel(id).name}</span>) : <span className="text-sm text-[#667085]">尚未设置</span>}</div>
        <h3 className="mb-2 text-sm font-semibold">已有门店商品 · {new Set(records.map(record => record.storeId)).size} 家门店</h3><p className="mb-4 text-[13px] leading-6 text-[#667085]">按当前门店商品展示，包含已下架商品。手动下发、删除和下架的结果会在此更新。</p>
        {records.length ? <><input aria-label="搜索门店商品" placeholder="搜索门店名称、编码或渠道" value={keyword} onChange={event => setKeyword(event.target.value)} className="mb-3 h-9 w-full rounded border border-[#D9DDE3] px-3 text-sm focus:border-[#00B460] focus:outline-none" /><table className="w-full text-left text-sm"><thead className="bg-[#F7F8FA] text-[#667085]"><tr><th className="p-3 font-medium">门店</th><th className="p-3 font-medium">渠道</th><th className="p-3 font-medium">状态</th></tr></thead><tbody>{rows.map(row => <tr key={row.id + row.channel} className="border-b border-[#F0F1F2]"><td className="p-3">{row.storeName}<small className="block text-[#667085]">{row.storeId}</small></td><td className="p-3">{getOmnichannelChannel(fromStoreChannel(row.channel)).name}</td><td className="p-3"><span className={row.status === 'on_shelf' ? 'text-[#008F4C]' : 'text-[#667085]'}>{row.status === 'on_shelf' ? '已上架' : '已下架'}</span><small className="block text-[#667085]">库存 {row.stockCount ?? '—'}</small></td></tr>)}{!rows.length && <tr><td colSpan={3} className="p-8 text-center text-[#667085]">未找到符合条件的门店商品</td></tr>}</tbody></table></> : <div className="py-12 text-center"><Package size={28} className="mx-auto mb-4 text-[#667085]" /><h3 className="text-sm font-semibold">暂无门店商品</h3><p className="mt-2 text-[13px] text-[#667085]">下发任务完成后，此处展示生成的门店商品。</p></div>}
        <p className="mt-5 text-xs leading-5 text-[#667085]">门店在每次下发时选择；任务执行进度请查看同步任务。</p>
      </div><footer className="flex justify-end gap-3 border-t border-[#E5E6EB] p-4"><button type="button" className="h-9 rounded border border-[#D9DDE3] px-4 text-sm text-[#4E5969] hover:bg-[#F7F8FA]" onClick={onClose}>关闭</button><button type="button" className="h-9 rounded bg-[#00B460] px-4 text-sm font-medium text-white hover:bg-[#009F55]" onClick={onEdit}>编辑商品</button></footer>
    </div></div>, document.body);
};

type SelectedBatchImage = {
  id: string;
  fileName: string;
  imageUrl: string;
  source: 'upload' | 'material';
};

type MatchRow = {
  image: SelectedBatchImage;
  imageType: BatchImageType;
  imageTypeLabel: string;
  status: MatchStatus;
  product?: Product;
  candidates?: Product[];
  reason?: string;
};

const buildDemoBatchImages = (products: Product[]): SelectedBatchImage[] => {
  const first = products[0];
  const second = products[1];
  const third = products[2] || products[0];

  return [
    {
      id: 'batch-image-1',
      fileName: `${first?.id || '1001'}-LB-01.png`,
      imageUrl: first?.image || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=200&h=200&fit=crop',
      source: 'upload',
    },
    {
      id: 'batch-image-2',
      fileName: `${second?.name || '手打柠檬茶'}-XQ-01.png`,
      imageUrl: second?.image || 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&h=200&fit=crop',
      source: 'upload',
    },
    {
      id: 'batch-image-3',
      fileName: `${third?.skuCode || '1003'}-FM-01.png`,
      imageUrl: third?.image || 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop',
      source: 'material',
    },
    {
      id: 'batch-image-4',
      fileName: '夏季限定新品-LB-01.png',
      imageUrl: 'https://images.unsplash.com/photo-1626803775151-61d756612fcd?w=200&h=200&fit=crop',
      source: 'upload',
    },
  ];
};

const getProductMatchValue = (product: Product, rule: BatchImageNamingRule) => {
  if (rule === 'productId') return product.id;
  if (rule === 'skuCode') return product.skuCode;
  if (rule === 'productMark') return `${product.id}-${product.skuCode}`;
  return product.name;
};

const buildMatchRows = (products: Product[], images: SelectedBatchImage[], namingRule: BatchImageNamingRule): MatchRow[] => {
  const valueMap = new Map<string, Product[]>();
  products.forEach(product => {
    const key = normalizeMatchText(getProductMatchValue(product, namingRule));
    valueMap.set(key, [...(valueMap.get(key) || []), product]);
  });

  return images.map(image => {
    const imageType = getImageTypeFromFileName(image.fileName);
    const imageTypeLabel = BATCH_IMAGE_TYPES.find(item => item.id === imageType)?.label || '商品主图';
    const key = normalizeMatchText(image.fileName);
    const candidates = valueMap.get(key) || [];

    if (candidates.length === 1) {
      return { image, imageType, imageTypeLabel, status: 'matched', product: candidates[0] };
    }

    if (candidates.length > 1) {
      return {
        image,
        imageType,
        imageTypeLabel,
        status: 'duplicate',
        candidates,
        reason: '命中多个同名商品，请人工确认后再导入',
      };
    }

    return {
      image,
      imageType,
      imageTypeLabel,
      status: 'unmatched',
      reason: namingRule === 'productName' ? '未找到同名商品，建议检查图片名称或改用商品ID' : '未匹配到商品',
    };
  });
};

const BatchImageImportModal: React.FC<{
  products: Product[];
  onClose: () => void;
  onApply: (updates: Array<{ productId: string; imageUrl: string }>) => void;
}> = ({ products, onClose, onApply }) => {
  const [step, setStep] = useState<BatchImageStep>(1);
  const [namingRule, setNamingRule] = useState<BatchImageNamingRule>('productId');
  const [mode, setMode] = useState<BatchImageMode>('replace');
  const [imageTypes, setImageTypes] = useState<BatchImageType[]>(['main', 'detail', 'cover']);
  const [images, setImages] = useState<SelectedBatchImage[]>([]);
  const [imported, setImported] = useState(false);

  const previewImages = useMemo(() => images.filter(image => imageTypes.includes(getImageTypeFromFileName(image.fileName))), [images, imageTypes]);
  const matchRows = useMemo(() => buildMatchRows(products, previewImages, namingRule), [products, previewImages, namingRule]);
  const matchedRows = matchRows.filter(row => row.status === 'matched');
  const duplicateRows = matchRows.filter(row => row.status === 'duplicate');
  const unmatchedRows = matchRows.filter(row => row.status === 'unmatched');

  const handleMockUpload = () => {
    setImages(buildDemoBatchImages(products));
    setImported(false);
  };

  const handleToggleImageType = (type: BatchImageType) => {
    setImageTypes(prev => (prev.includes(type) ? prev.filter(item => item !== type) : [...prev, type]));
  };

  const handleApply = () => {
    onApply(matchedRows.map(row => ({ productId: row.product!.id, imageUrl: row.image.imageUrl })));
    setImported(true);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#111827]/55">
      <div className="flex h-[82vh] w-[1040px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#E8E8E8] px-6">
          <div>
            <div className="text-lg font-bold text-[#333]">批量增/换图片</div>
            <div className="mt-1 text-xs text-[#98A2B3]">支持商品主图、商品详情图、商品封面图，导入前先完成匹配校验</div>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-[#98A2B3] hover:bg-[#F5F6FA] hover:text-[#333]">
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[70px] shrink-0 items-center border-b border-[#F0F1F3] px-6">
          <BatchImageStepItem index={1} label="上传图片" active={step === 1} done={step > 1} />
          <div className="mx-4 h-px flex-1 bg-[#E5E7EB]" />
          <BatchImageStepItem index={2} label="匹配预览与导入" active={step === 2} done={imported} />
        </div>

        {step === 1 ? (
          <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px]">
            <div className="min-h-0 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleMockUpload}
                  className="flex min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-[#00C06B] bg-[#F7FFFA] text-[#00A35B] transition-colors hover:bg-[#EFFBF4]"
                >
                  <Upload size={24} />
                  <div className="mt-3 text-sm font-bold">本地批量上传图片</div>
                  <div className="mt-2 text-xs text-[#8A96A8]">支持文件夹多选；上传到素材库后自动选中本次图片</div>
                </button>
                <button
                  onClick={handleMockUpload}
                  className="flex min-h-[150px] flex-col items-center justify-center rounded-lg border border-[#E8E8E8] bg-white text-[#4B5563] transition-colors hover:border-[#00C06B] hover:text-[#00A35B]"
                >
                  <ImageIcon size={24} />
                  <div className="mt-3 text-sm font-bold">从素材库选择图片</div>
                  <div className="mt-2 text-xs text-[#8A96A8]">素材库已支持批量上传后自动选中</div>
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] p-4">
                <div className="mb-3 text-sm font-bold text-[#333]">导入设置</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 text-xs font-bold text-[#667085]">图片处理方式</div>
                    <div className="flex gap-2">
                      {[
                        { id: 'replace' as const, label: '替换已有图片' },
                        { id: 'append' as const, label: '增加到已有图片后' },
                      ].map(option => (
                        <button
                          key={option.id}
                          onClick={() => setMode(option.id)}
                          className={`rounded-md border px-3 py-2 text-xs font-bold ${
                            mode === option.id ? 'border-[#00C06B] bg-[#EAF9F1] text-[#00A35B]' : 'border-[#E8E8E8] bg-white text-[#667085]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-bold text-[#667085]">本次处理图片类型</div>
                    <div className="flex flex-wrap gap-2">
                      {BATCH_IMAGE_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => handleToggleImageType(type.id)}
                          className={`rounded-md border px-3 py-2 text-xs font-bold ${
                            imageTypes.includes(type.id) ? 'border-[#00C06B] bg-[#EAF9F1] text-[#00A35B]' : 'border-[#E8E8E8] bg-white text-[#667085]'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-[#E8E8E8] p-4">
                <div className="mb-3 text-sm font-bold text-[#333]">图片命名规则</div>
                <div className="grid grid-cols-2 gap-3">
                  {BATCH_IMAGE_NAMING_RULES.map(rule => (
                    <button
                      key={rule.id}
                      onClick={() => {
                        setNamingRule(rule.id);
                        setImported(false);
                      }}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        namingRule === rule.id ? 'border-[#00C06B] bg-[#F4FCF7]' : 'border-[#E8E8E8] bg-white hover:border-[#00C06B]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-3.5 w-3.5 rounded-full border ${namingRule === rule.id ? 'border-[#00C06B] bg-[#00C06B]' : 'border-[#D0D5DD]'}`} />
                        <span className="text-sm font-bold text-[#333]">{rule.label}</span>
                      </div>
                      <div className="mt-2 text-xs leading-5 text-[#8A96A8]">{rule.tip}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-md bg-[#FFF8E8] px-3 py-2 text-xs leading-5 text-[#8A6400]">
                  商品名称匹配仅自动导入唯一命中的商品；名称重复或未匹配的图片会进入待处理，不会直接覆盖。
                </div>
              </div>
            </div>

            <BatchImageSelectedPanel images={images} onRemove={id => setImages(prev => prev.filter(item => item.id !== id))} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col p-6">
            <div className="grid grid-cols-4 gap-3">
              <BatchImageStatCard label="已选图片" value={String(images.length)} tone="neutral" />
              <BatchImageStatCard label="成功匹配" value={String(matchedRows.length)} tone="success" />
              <BatchImageStatCard label="名称重复" value={String(duplicateRows.length)} tone="warning" />
              <BatchImageStatCard label="未匹配" value={String(unmatchedRows.length)} tone="danger" />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] px-4 py-3">
              <div className="text-sm text-[#4B5563]">
                当前规则：<span className="font-bold text-[#333]">{BATCH_IMAGE_NAMING_RULES.find(rule => rule.id === namingRule)?.label}</span>
                <span className="mx-2 text-[#D0D5DD]">|</span>
                处理方式：<span className="font-bold text-[#333]">{mode === 'replace' ? '替换已有图片' : '增加到已有图片后'}</span>
              </div>
              <button onClick={() => setStep(1)} className="text-sm font-bold text-[#00A35B] hover:underline">返回调整</button>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-lg border border-[#E8E8E8]">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-[#F7F8FA] text-xs font-bold text-[#667085]">
                  <tr>
                    <th className="border-b border-[#E8E8E8] px-4 py-3">图片文件</th>
                    <th className="border-b border-[#E8E8E8] px-4 py-3">图片类型</th>
                    <th className="border-b border-[#E8E8E8] px-4 py-3">匹配商品</th>
                    <th className="border-b border-[#E8E8E8] px-4 py-3">状态</th>
                    <th className="border-b border-[#E8E8E8] px-4 py-3">处理说明</th>
                  </tr>
                </thead>
                <tbody>
                  {matchRows.map(row => (
                    <tr key={row.image.id} className="border-b border-[#F3F4F6]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={row.image.imageUrl} className="h-10 w-10 rounded-md border border-[#E8E8E8] object-cover" />
                          <div>
                            <div className="font-bold text-[#333]">{row.image.fileName}</div>
                            <div className="text-xs text-[#98A2B3]">{row.image.source === 'upload' ? '本次上传' : '素材库选择'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#4B5563]">{row.imageTypeLabel}</td>
                      <td className="px-4 py-3">
                        {row.product ? (
                          <div>
                            <div className="font-bold text-[#333]">{row.product.name}</div>
                            <div className="text-xs text-[#98A2B3]">ID：{row.product.id} / 条码：{row.product.skuCode}</div>
                          </div>
                        ) : (
                          <span className="text-[#98A2B3]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <BatchImageStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-[#667085]">{row.reason || (mode === 'replace' ? '确认后将覆盖对应类型图片' : '确认后将追加到对应类型图片')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {imported && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#CDEFD9] bg-[#F4FCF7] px-4 py-3 text-sm font-bold text-[#00A35B]">
                <CheckCircle2 size={18} />
                已模拟导入 {matchedRows.length} 张图片；名称重复和未匹配图片未导入，可调整命名规则后重新预览。
              </div>
            )}
          </div>
        )}

        <div className="flex h-[64px] shrink-0 items-center justify-between border-t border-[#E8E8E8] px-6">
          <div className="text-xs text-[#98A2B3]">
            {step === 1 ? '建议优先使用商品ID；商品名称适合快速处理，但需关注同名商品。' : '仅成功匹配的数据会进入导入修改。'}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-lg border border-[#E8E8E8] px-5 py-2 text-sm font-bold text-[#667085] hover:bg-[#F7F8FA]">取消</button>
            {step === 1 ? (
              <button
                disabled={images.length === 0 || imageTypes.length === 0}
                onClick={() => setStep(2)}
                className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:bg-[#B7E8CC]"
              >
                生成匹配预览
              </button>
            ) : (
              <button
                disabled={matchedRows.length === 0 || imported}
                onClick={handleApply}
                className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:bg-[#B7E8CC]"
              >
                {imported ? '已导入' : `确认导入 ${matchedRows.length} 张`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BatchImageStepItem: React.FC<{ index: number; label: string; active: boolean; done: boolean }> = ({ index, label, active, done }) => (
  <div className={`flex items-center gap-2 ${active || done ? 'text-[#00A35B]' : 'text-[#667085]'}`}>
    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${done ? 'border-[#00C06B] bg-[#00C06B] text-white' : active ? 'border-[#00C06B] bg-[#F4FCF7]' : 'border-[#D0D5DD] bg-white'}`}>
      {done ? <CheckCircle2 size={18} /> : index}
    </span>
    <span className="text-sm font-bold">{label}</span>
  </div>
);

const BatchImageSelectedPanel: React.FC<{ images: SelectedBatchImage[]; onRemove: (id: string) => void }> = ({ images, onRemove }) => (
  <aside className="flex min-h-0 flex-col border-l border-[#E8E8E8] bg-[#FCFCFD]">
    <div className="border-b border-[#E8E8E8] px-4 py-4">
      <div className="text-sm font-bold text-[#333]">已选图片</div>
      <div className="mt-1 text-xs text-[#98A2B3]">上传到素材库后自动选中本次图片</div>
    </div>
    <div className="flex-1 overflow-y-auto p-4">
      {images.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center text-[#98A2B3]">
          <FileText size={36} className="mb-3 text-[#D0D5DD]" />
          <div className="text-sm font-bold">还未选择图片</div>
          <div className="mt-2 text-xs leading-5">点击左侧上传或从素材库选择后，本次图片会自动进入这里</div>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map(image => (
            <div key={image.id} className="flex items-center gap-3 rounded-lg border border-[#E8E8E8] bg-white p-2">
              <img src={image.imageUrl} className="h-12 w-12 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-[#333]">{image.fileName}</div>
                <div className="mt-1 text-[11px] text-[#98A2B3]">{image.source === 'upload' ? '本次上传自动选中' : '素材库选择'}</div>
              </div>
              <button onClick={() => onRemove(image.id)} className="rounded-md p-1 text-[#98A2B3] hover:bg-[#F5F6FA] hover:text-[#333]">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    {images.length > 0 && (
      <div className="border-t border-[#E8E8E8] px-4 py-3 text-xs text-[#667085]">
        已选 <span className="font-bold text-[#00A35B]">{images.length}</span> 张图片
      </div>
    )}
  </aside>
);

const BatchImageStatCard: React.FC<{ label: string; value: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }> = ({ label, value, tone }) => {
  const className = {
    neutral: 'border-[#E8E8E8] bg-white text-[#333]',
    success: 'border-[#CDEFD9] bg-[#F4FCF7] text-[#00A35B]',
    warning: 'border-[#FFE4B3] bg-[#FFF8E8] text-[#B7791F]',
    danger: 'border-[#FFD6D6] bg-[#FFF5F5] text-[#D92D20]',
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <div className="text-xs font-bold opacity-75">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
};

const BatchImageStatusBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
  if (status === 'matched') {
    return <span className="inline-flex items-center rounded-full bg-[#EAF9F1] px-2.5 py-1 text-xs font-bold text-[#00A35B]"><CheckCircle2 size={13} className="mr-1" />已匹配</span>;
  }
  if (status === 'duplicate') {
    return <span className="inline-flex items-center rounded-full bg-[#FFF8E8] px-2.5 py-1 text-xs font-bold text-[#B7791F]"><AlertTriangle size={13} className="mr-1" />待确认</span>;
  }
  return <span className="inline-flex items-center rounded-full bg-[#FFF5F5] px-2.5 py-1 text-xs font-bold text-[#D92D20]"><RefreshCw size={13} className="mr-1" />未匹配</span>;
};
