import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Download,
  ListFilter,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useProducts } from '../../context';
import {
  THIRD_PARTY_CHANNELS,
  getEffectiveChannelGroups,
  getOmnichannelChannel,
  getOmnichannelConfig,
  isThirdPartyChannelId,
} from '../../omnichannel';
import type { OmnichannelChannelId, Product, ThirdPartyChannelId } from '../../types';
import { WebProductSelectorDialog } from './WebProductSelectorDialog';

type PlatformStatus = 'reviewing' | 'approved' | 'rejected';

const DEFAULT_FILTERS = {
  productId: '',
  skuId: '',
  frontendCategory: 'all',
  productType: 'all',
};

const getFrontendCategoryName = (product: Product) => {
  const formData = (product as Product & { formData?: Record<string, unknown> }).formData;
  const configuredValue = Array.isArray(formData?.p_front_cat)
    ? formData?.p_front_cat[0]
    : formData?.p_front_cat;
  if (typeof configuredValue === 'string' && configuredValue.trim()) {
    return configuredValue.split('/').map(item => item.trim()).filter(Boolean).pop() || configuredValue;
  }
  if (product.type === 'combo') return '套餐组合';
  if (product.category === '现制饮品') return Number(product.id) % 2 === 0 ? '咖啡类' : '奶茶类';
  if (product.category === '中式正餐') return product.name.includes('火锅') ? '火锅锅底' : '炒菜/烧菜类';
  if (product.category === '西式快餐') return '轻食简餐';
  if (product.category === '烘焙甜品') return '甜品烘焙';
  if (product.category === '零售商品') return '零售周边';
  return '未分类';
};

const getProductTypeName = (product: Product) => (
  product.type === 'combo' ? '套餐商品' : '标准商品'
);

const getSaleStatus = (product: Product) => {
  if (product.status === 'off_shelf') {
    return { label: '停售', className: 'border-gray-200 bg-gray-50 text-gray-500' };
  }
  if (product.status === 'draft') {
    return { label: '草稿', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  }
  return { label: '可售', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
};

const STATUS_META: Record<PlatformStatus, { label: string; className: string }> = {
  reviewing: { label: '审核中', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  approved: { label: '审核通过', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  rejected: { label: '审核失败', className: 'border-red-200 bg-red-50 text-red-700' },
};

const getStatusKey = (groupId: string, productId: string, channelId: ThirdPartyChannelId) => `${groupId}:${productId}:${channelId}`;
const getChannelProductKey = (groupId: string, productId: string) => `${groupId}:${productId}`;
const createChannelProductSnapshot = (product: Product): Product => {
  const source = product as Product & { formData?: Record<string, unknown> };
  const comboChannelDefaults = product.type === 'combo'
    ? {
        combo_price_type: 'markup',
        combo_pack_mode: 'whole',
        combo_display_price: String(product.price),
        combo_price_style: 'markup',
      }
    : {};
  return {
    ...product,
    formData: {
      ...comboChannelDefaults,
      ...(source.formData || {}),
    },
  } as Product;
};

export type ChannelProductEditRequest = {
  product: Product;
  catalogId: string;
  catalogName: string;
  channelIds: OmnichannelChannelId[];
  channelNames: string[];
  thirdPartyChannelIds: ThirdPartyChannelId[];
};

export type ChannelProductCreateRequest = Omit<ChannelProductEditRequest, 'product'> & {
  type: 'standard' | 'combo';
};

export type ChannelProductsSyncRequest = Omit<ChannelProductEditRequest, 'product'> & {
  products: Product[];
};

interface Props {
  onEditProduct?: (request: ChannelProductEditRequest) => void;
  onEditMasterProduct?: (request: ChannelProductEditRequest) => void;
  onSyncFromMaster?: (request: ChannelProductsSyncRequest) => void;
  onCreateProduct?: (request: ChannelProductCreateRequest) => void;
  onBatchEdit?: (catalogId: string) => void;
  productOverrides?: Record<string, any>;
  initialGroupId?: string;
}

export const WebChannelProductLibrary: React.FC<Props> = ({
  onEditProduct,
  onEditMasterProduct,
  onSyncFromMaster,
  onCreateProduct,
  onBatchEdit,
  productOverrides = {},
  initialGroupId,
}) => {
  const { products, activeBrandId, brandConfigs } = useProducts();
  const activeBrandConfig = brandConfigs[activeBrandId] || brandConfigs.b_1;
  const config = useMemo(() => getOmnichannelConfig(activeBrandConfig), [activeBrandConfig]);
  const availableGroups = useMemo(() => getEffectiveChannelGroups(config), [config]);
  const unifiedCatalog = config.collaborationMode === 'unified';
  const canCreateMasterFromCatalog = config.channelProductCreationMode === 'create_master_and_channel';
  const [activeGroupId, setActiveGroupId] = useState(
    availableGroups.some(group => group.id === initialGroupId)
      ? initialGroupId || ''
      : availableGroups[0]?.id || ''
  );
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string | null>(null);
  const [isCategoryPanelCollapsed, setIsCategoryPanelCollapsed] = useState(false);
  const [showProductScopeEditor, setShowProductScopeEditor] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const [groupProductIds, setGroupProductIds] = useState<Record<string, string[]>>(() => (
    Object.fromEntries(availableGroups.map((group, index) => [
      group.id,
      unifiedCatalog
        ? products.map(product => product.id)
        : Array.from(new Set([
            ...(index === 0
              ? products.slice(0, 4).map(product => product.id)
              : products.slice(1, 3).map(product => product.id)),
            ...products.filter(product => product.type === 'combo').slice(0, 1).map(product => product.id),
            ...products
              .filter(product => !!productOverrides[getChannelProductKey(group.id, product.id)])
              .map(product => product.id),
          ])),
    ]))
  ));
  const [channelProductSnapshots, setChannelProductSnapshots] = useState<Record<string, Product>>(() => (
    Object.fromEntries(availableGroups.flatMap(group => (
      products.map(product => [getChannelProductKey(group.id, product.id), createChannelProductSnapshot(product)])
    )))
  ));
  const [platformStatuses, setPlatformStatuses] = useState<Record<string, PlatformStatus>>({});
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showImportExportMenu, setShowImportExportMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [operationMessage, setOperationMessage] = useState('');
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [sortDraftProductIds, setSortDraftProductIds] = useState<string[]>([]);
  const [categoryProductOrders, setCategoryProductOrders] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (initialGroupId && availableGroups.some(group => group.id === initialGroupId)) {
      setActiveGroupId(initialGroupId);
    }
  }, [availableGroups, initialGroupId]);

  useEffect(() => {
    setSelectedProductIds([]);
  }, [activeGroupId]);

  useEffect(() => {
    if (!availableGroups.some(group => group.id === activeGroupId)) {
      setActiveGroupId(availableGroups[0]?.id || '');
    }
    setGroupProductIds(prev => {
      let changed = false;
      const next = { ...prev };
      availableGroups.forEach(group => {
        if (!next[group.id]) {
          next[group.id] = unifiedCatalog ? products.map(product => product.id) : [];
          changed = true;
        } else if (unifiedCatalog) {
          const productIds = products.map(product => product.id);
          if (next[group.id].length !== productIds.length || productIds.some(id => !next[group.id].includes(id))) {
            next[group.id] = productIds;
            changed = true;
          }
        } else {
          const combinedCreatedProductIds = products
            .filter(product => !!productOverrides[getChannelProductKey(group.id, product.id)])
            .map(product => product.id);
          const missingProductIds = combinedCreatedProductIds.filter(id => !next[group.id].includes(id));
          if (missingProductIds.length > 0) {
            next[group.id] = [...next[group.id], ...missingProductIds];
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
    setChannelProductSnapshots(prev => {
      const next = { ...prev };
      let changed = false;
      availableGroups.forEach(group => {
        products.forEach(product => {
          const key = getChannelProductKey(group.id, product.id);
          if (!next[key]) {
            next[key] = createChannelProductSnapshot(product);
            changed = true;
          }
        });
      });
      return changed ? next : prev;
    });
  }, [activeGroupId, availableGroups, productOverrides, products, unifiedCatalog]);

  const activeGroup = availableGroups.find(group => group.id === activeGroupId) || availableGroups[0];
  const activeProductIds = activeGroup ? (groupProductIds[activeGroup.id] || []) : [];
  const effectiveProducts = useMemo(() => products.map(product => {
    const productKey = activeGroup ? getChannelProductKey(activeGroup.id, product.id) : '';
    const snapshot = channelProductSnapshots[productKey] || createChannelProductSnapshot(product);
    const override = activeGroup ? productOverrides[productKey] : undefined;
    const formData = override?.formData || {};
    return {
      ...snapshot,
      ...override,
      name: formData.p_name || override?.name || snapshot.name,
      image: formData.p_img || override?.image || snapshot.image,
      price: Number(formData.s_price || override?.price || snapshot.price),
    } as Product;
  }), [activeGroup, channelProductSnapshots, productOverrides, products]);
  const frontendCategories = useMemo(
    () => Array.from(new Set(effectiveProducts.map(getFrontendCategoryName))).filter(Boolean),
    [effectiveProducts],
  );
  const quickCategories = useMemo(() => {
    const sourceProducts = effectiveProducts.filter(product => activeProductIds.includes(product.id));
    return frontendCategories.map(name => ({
      name,
      count: sourceProducts.filter(product => getFrontendCategoryName(product) === name).length,
    })).filter(item => item.count > 0);
  }, [activeProductIds, effectiveProducts, frontendCategories]);
  const categorySortKey = activeGroup && selectedQuickCategory
    ? `${activeGroup.id}:${selectedQuickCategory}`
    : '';
  const savedCategoryOrder = categorySortKey ? (categoryProductOrders[categorySortKey] || []) : [];
  const visibleProducts = effectiveProducts
    .filter(product => (
      activeProductIds.includes(product.id)
      && (!quickSearch.trim()
        || product.name.toLowerCase().includes(quickSearch.trim().toLowerCase())
        || product.id.includes(quickSearch.trim())
        || product.skuCode.includes(quickSearch.trim()))
      && (!appliedFilters.productId.trim() || product.id.includes(appliedFilters.productId.trim()))
      && (!appliedFilters.skuId.trim() || product.skuCode.includes(appliedFilters.skuId.trim()))
      && (appliedFilters.frontendCategory === 'all' || getFrontendCategoryName(product) === appliedFilters.frontendCategory)
      && (appliedFilters.productType === 'all'
        || (product.type === 'combo' ? 'combo' : 'standard') === appliedFilters.productType)
      && (!selectedQuickCategory || getFrontendCategoryName(product) === selectedQuickCategory)
    ))
    .sort((first, second) => {
      if (!selectedQuickCategory || savedCategoryOrder.length === 0) return 0;
      const firstIndex = savedCategoryOrder.indexOf(first.id);
      const secondIndex = savedCategoryOrder.indexOf(second.id);
      if (firstIndex === -1 && secondIndex === -1) return 0;
      if (firstIndex === -1) return 1;
      if (secondIndex === -1) return -1;
      return firstIndex - secondIndex;
    });
  const allVisibleSelected = visibleProducts.length > 0
    && visibleProducts.every(product => selectedProductIds.includes(product.id));

  const toggleVisibleSelection = () => {
    const visibleIds = visibleProducts.map(product => product.id);
    setSelectedProductIds(current => allVisibleSelected
      ? current.filter(id => !visibleIds.includes(id))
      : Array.from(new Set([...current, ...visibleIds])));
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(current => current.includes(productId)
      ? current.filter(id => id !== productId)
      : [...current, productId]);
  };
  const hasActiveFilters = Boolean(
    quickSearch.trim()
    || appliedFilters.productId.trim()
    || appliedFilters.skuId.trim()
    || appliedFilters.frontendCategory !== 'all'
    || appliedFilters.productType !== 'all'
    || selectedQuickCategory
  );
  const reviewChannel = THIRD_PARTY_CHANNELS.find(channel => (
    activeGroup?.channels.includes(channel.id) && channel.requiresBrandReview
  ));
  const thirdPartyChannelIds = activeGroup?.channels.filter(isThirdPartyChannelId) || [];

  const getDefaultPlatformStatus = (productId: string): PlatformStatus => {
    const productIndex = Math.max(products.findIndex(product => product.id === productId), 0);
    return (['approved', 'rejected', 'reviewing', 'approved'] as PlatformStatus[])[productIndex % 4];
  };

  const getPlatformStatus = (productId: string) => (
    reviewChannel
      ? platformStatuses[getStatusKey(activeGroup.id, productId, reviewChannel.id)] || getDefaultPlatformStatus(productId)
      : null
  );

  const submitPlatformProduct = (productId: string) => {
    if (!reviewChannel) return;
    setPlatformStatuses(prev => ({
      ...prev,
      [getStatusKey(activeGroup.id, productId, reviewChannel.id)]: 'reviewing',
    }));
  };

  const openProductScopeEditor = () => {
    setPendingProductIds(unifiedCatalog ? [] : activeProductIds);
    setShowProductScopeEditor(true);
  };

  const resetFilters = () => {
    setQuickSearch('');
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSelectedQuickCategory(null);
  };

  const openCategorySortDialog = () => {
    if (!activeGroup || !selectedQuickCategory) {
      setOperationMessage('请先从左侧选择一个前台分类，再管理该分类下的商品排序。');
      return;
    }
    const categoryProducts = effectiveProducts.filter(product => (
      activeProductIds.includes(product.id)
      && getFrontendCategoryName(product) === selectedQuickCategory
    ));
    const savedOrder = categoryProductOrders[`${activeGroup.id}:${selectedQuickCategory}`] || [];
    const orderedProductIds = [
      ...savedOrder.filter(productId => categoryProducts.some(product => product.id === productId)),
      ...categoryProducts.map(product => product.id).filter(productId => !savedOrder.includes(productId)),
    ];
    setSortDraftProductIds(orderedProductIds);
    setShowSortDialog(true);
  };

  const moveSortedProduct = (productId: string, offset: -1 | 1) => {
    setSortDraftProductIds(current => {
      const sourceIndex = current.indexOf(productId);
      const targetIndex = sourceIndex + offset;
      if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];
      return next;
    });
  };

  const saveCategorySort = () => {
    if (!activeGroup || !selectedQuickCategory) return;
    const key = `${activeGroup.id}:${selectedQuickCategory}`;
    setCategoryProductOrders(current => ({ ...current, [key]: sortDraftProductIds }));
    setShowSortDialog(false);
    setOperationMessage(`已保存“${activeGroup.name} / ${selectedQuickCategory}”下 ${sortDraftProductIds.length} 个商品的展示顺序。`);
  };

  const confirmProductScope = () => {
    if (!activeGroup) return;
    const nextProductIds = unifiedCatalog
      ? Array.from(new Set([...activeProductIds, ...pendingProductIds]))
      : pendingProductIds;
    const addedProductIds = nextProductIds.filter(productId => !activeProductIds.includes(productId));
    if (addedProductIds.length > 0) {
      setChannelProductSnapshots(prev => ({
        ...prev,
        ...Object.fromEntries(addedProductIds.flatMap(productId => {
          const product = products.find(item => item.id === productId);
          return product
            ? [[getChannelProductKey(activeGroup.id, productId), createChannelProductSnapshot(product)]]
            : [];
        })),
      }));
    }
    if (reviewChannel) {
      setPlatformStatuses(prev => ({
        ...prev,
        ...Object.fromEntries(addedProductIds.map(productId => [getStatusKey(activeGroup.id, productId, reviewChannel.id), 'reviewing' as PlatformStatus])),
      }));
    }
    setGroupProductIds(prev => ({ ...prev, [activeGroup.id]: nextProductIds }));
    setShowProductScopeEditor(false);
  };

  const removeProductFromGroup = (productId: string) => {
    if (!activeGroup) return;
    setSelectedProductIds(current => current.filter(id => id !== productId));
    setGroupProductIds(prev => ({
      ...prev,
      [activeGroup.id]: (prev[activeGroup.id] || []).filter(id => id !== productId),
    }));
  };

  const editChannelProduct = (product: Product) => {
    if (!activeGroup) return;
    onEditProduct?.({
      product,
      catalogId: activeGroup.id,
      catalogName: activeGroup.name,
      channelIds: activeGroup.channels,
      channelNames: activeGroup.channels.map(channelId => getOmnichannelChannel(channelId).name),
      thirdPartyChannelIds,
    });
  };

  const editMasterProduct = (product: Product) => {
    if (!activeGroup || !canCreateMasterFromCatalog) return;
    onEditMasterProduct?.({
      product,
      catalogId: activeGroup.id,
      catalogName: activeGroup.name,
      channelIds: activeGroup.channels,
      channelNames: activeGroup.channels.map(channelId => getOmnichannelChannel(channelId).name),
      thirdPartyChannelIds,
    });
  };

  const syncSelectedFromMaster = () => {
    if (!activeGroup) return;
    const selectedProducts = products.filter(product => selectedProductIds.includes(product.id));
    if (selectedProducts.length === 0) return;
    onSyncFromMaster?.({
      products: selectedProducts,
      catalogId: activeGroup.id,
      catalogName: activeGroup.name,
      channelIds: activeGroup.channels,
      channelNames: activeGroup.channels.map(channelId => getOmnichannelChannel(channelId).name),
      thirdPartyChannelIds,
    });
  };

  const createProductInActiveGroup = (type: 'standard' | 'combo') => {
    if (!activeGroup || !canCreateMasterFromCatalog) return;
    setShowCreateMenu(false);
    onCreateProduct?.({
      type,
      catalogId: activeGroup.id,
      catalogName: activeGroup.name,
      channelIds: activeGroup.channels,
      channelNames: activeGroup.channels.map(channelId => getOmnichannelChannel(channelId).name),
      thirdPartyChannelIds,
    });
  };

  const exportChannelProducts = () => {
    const header = ['商品ID', '商品主档SKUID', '渠道商品名称', '商品类型', '前台分类', '基础价格', '售卖状态'];
    const rows = visibleProducts.map(product => [
      product.id,
      product.skuCode,
      product.name,
      getProductTypeName(product),
      getFrontendCategoryName(product),
      product.price,
      getSaleStatus(product).label,
    ]);
    const csv = [header, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeGroup.name}-渠道商品.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setOperationMessage(`已导出 ${visibleProducts.length} 个渠道商品。`);
  };

  if (!activeGroup) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F5F6FA] p-8">
        <div className="w-[560px] border border-amber-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle size={32} className="mx-auto text-amber-500" />
          <div className="mt-4 text-lg font-black text-gray-900">渠道协作分组尚未完成</div>
          <div className="mt-2 text-sm leading-6 text-gray-500">请联系交付人员在 OP 品牌配置中，为自营渠道和企迈管理的三方渠道设置渠道商品库分组。</div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        {operationMessage && (
          <div className="flex shrink-0 items-center justify-between rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-2.5 text-[13px] text-[#245B8A]">
            <span>{operationMessage}</span>
            <button type="button" onClick={() => setOperationMessage('')} title="关闭"><X size={15} /></button>
          </div>
        )}
        <section className="console-panel relative z-20 shrink-0" style={{ overflow: 'visible' }}>
          <div className="flex min-h-[62px] items-center gap-4 border-b border-[#E8E8E8] px-4 py-2">
            <div role="tablist" aria-label="渠道商品库分组" className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {availableGroups.map(group => {
                const active = group.id === activeGroup.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setActiveGroupId(group.id);
                      setSelectedQuickCategory(null);
                      setSelectedProductIds([]);
                    }}
                    className={`min-w-[176px] rounded-md border px-3 py-2 text-left transition-colors ${
                      active
                        ? 'border-[#8BD7AE] bg-[#EEF9F3]'
                        : 'border-[#E8E8E8] bg-white hover:border-[#B9DDCA] hover:bg-[#FAFFFC]'
                    }`}
                  >
                    <span className={`block text-sm font-bold ${active ? 'text-[#008F53]' : 'text-gray-800'}`}>{group.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-gray-400">
                      {group.channels.map(channelId => getOmnichannelChannel(channelId).shortName).join('、')}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={openProductScopeEditor} className={canCreateMasterFromCatalog ? 'console-secondary-button' : 'console-primary-button'}>
                <Plus size={15} /> {canCreateMasterFromCatalog ? '选择已有主档' : '从商品主档添加'}
              </button>
              {unifiedCatalog && !canCreateMasterFromCatalog && <span className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">新建主档后自动加入</span>}
              {canCreateMasterFromCatalog && (
                <div className="relative">
                  <button type="button" onClick={() => setShowCreateMenu(value => !value)} className="console-primary-button" aria-haspopup="menu" aria-expanded={showCreateMenu}>
                    <Plus size={16} /> 新建商品 <ChevronDown size={14} />
                  </button>
                  {showCreateMenu && (
                    <div role="menu" className="absolute right-0 top-[42px] z-50 w-[240px] overflow-hidden rounded-md border border-[#E5E6EB] bg-white py-1 shadow-xl">
                      <button type="button" role="menuitem" onClick={() => createProductInActiveGroup('standard')} className="block w-full px-4 py-2.5 text-left hover:bg-[#F7F8FA]"><strong className="block text-[13px] text-[#1D2129]">新建标准商品</strong><span className="mt-0.5 block text-[11px] text-[#86909C]">选择标准商品类目后填写主档与渠道资料</span></button>
                      <button type="button" role="menuitem" onClick={() => createProductInActiveGroup('combo')} className="block w-full border-t border-[#F0F1F2] px-4 py-2.5 text-left hover:bg-[#F7F8FA]"><strong className="block text-[13px] text-[#1D2129]">新建套餐商品</strong><span className="mt-0.5 block text-[11px] text-[#86909C]">选择套餐商品类目后填写主档与渠道资料</span></button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-[#FAFBFC] px-4 py-3">
            <label className="flex h-9 w-[190px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 focus-within:border-[#00C06B]">
              <span className="mr-2 shrink-0 text-xs text-gray-500">商品ID:</span>
              <input
                value={draftFilters.productId}
                onChange={event => setDraftFilters(prev => ({ ...prev, productId: event.target.value }))}
                className="min-w-0 flex-1 text-sm outline-none"
                placeholder="请输入"
              />
            </label>
            <label className="flex h-9 w-[190px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 focus-within:border-[#00C06B]">
              <span className="mr-2 shrink-0 text-xs text-gray-500">SKUID:</span>
              <input
                value={draftFilters.skuId}
                onChange={event => setDraftFilters(prev => ({ ...prev, skuId: event.target.value }))}
                className="min-w-0 flex-1 text-sm outline-none"
                placeholder="请输入"
              />
            </label>
            <label className="flex h-9 w-[220px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 focus-within:border-[#00C06B]">
              <span className="mr-2 shrink-0 text-xs text-gray-500">前台分类:</span>
              <select
                value={draftFilters.frontendCategory}
                onChange={event => setDraftFilters(prev => ({ ...prev, frontendCategory: event.target.value }))}
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm outline-none"
              >
                <option value="all">全部</option>
                {frontendCategories.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="flex h-9 w-[200px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 focus-within:border-[#00C06B]">
              <span className="mr-2 shrink-0 text-xs text-gray-500">商品类型:</span>
              <select
                value={draftFilters.productType}
                onChange={event => setDraftFilters(prev => ({ ...prev, productType: event.target.value }))}
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm outline-none"
              >
                <option value="all">全部</option>
                <option value="standard">标准商品</option>
                <option value="combo">套餐商品</option>
              </select>
            </label>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={resetFilters} className="console-secondary-button">重置</button>
              <button type="button" onClick={() => setAppliedFilters(draftFilters)} className="console-primary-button">查询</button>
            </div>
          </div>
        </section>

        <section className="console-panel flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E8E8E8] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-[320px] items-center rounded-md border border-gray-200 bg-white px-3 focus-within:border-[#00C06B]">
                <Search size={15} className="mr-2 text-gray-400" />
                <input value={quickSearch} onChange={event => setQuickSearch(event.target.value)} className="w-full text-sm outline-none" placeholder="搜索商品名称、商品ID、SKUID" />
              </div>
              {selectedProductIds.length > 0 && <span className="text-xs font-medium text-[#667085]">已选 {selectedProductIds.length} 个商品</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selectedProductIds.length === 0}
                onClick={syncSelectedFromMaster}
                className="console-secondary-button border-[#8BD7AE] text-[#008F53] disabled:cursor-not-allowed disabled:border-[#E5E6EB] disabled:text-[#C9CDD4]"
                title={selectedProductIds.length === 0 ? '请先勾选需要更新的渠道商品' : `从主档更新已选 ${selectedProductIds.length} 个商品`}
              >
                <RefreshCw size={15} />从主档更新
              </button>
              <button type="button" onClick={openCategorySortDialog} className="console-secondary-button" title={selectedQuickCategory ? `管理“${selectedQuickCategory}”下的商品排序` : '请先从左侧选择前台分类'}>
                <ListFilter size={15} />排序管理
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowImportExportMenu(value => !value)}
                  className="console-secondary-button"
                  aria-haspopup="menu"
                  aria-expanded={showImportExportMenu}
                >
                  导入/导出 <ChevronDown size={14} />
                </button>
                {showImportExportMenu && (
                  <div role="menu" className="absolute right-0 top-[42px] z-40 w-[156px] overflow-hidden rounded-md border border-[#E5E6EB] bg-white py-1 shadow-xl">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowImportExportMenu(false);
                        setShowImportDialog(true);
                        setImportFileName('');
                      }}
                      className="flex w-full items-center px-4 py-2.5 text-left text-[13px] text-[#1D2129] hover:bg-[#F7F8FA]"
                    >
                      <Upload size={14} className="mr-2 text-[#667085]" />导入渠道商品
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowImportExportMenu(false);
                        exportChannelProducts();
                      }}
                      className="flex w-full items-center border-t border-[#F0F1F2] px-4 py-2.5 text-left text-[13px] text-[#1D2129] hover:bg-[#F7F8FA]"
                    >
                      <Download size={14} className="mr-2 text-[#667085]" />导出当前列表
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1">
            {!isCategoryPanelCollapsed && (
              <aside className="flex w-[220px] shrink-0 flex-col border-r border-[#E8E8E8] bg-white">
                <div className="flex h-11 items-center justify-between border-b border-[#E8E8E8] px-3">
                  <div className="text-[13px] font-bold text-[#333]">前台分类</div>
                  <button type="button" onClick={() => setIsCategoryPanelCollapsed(true)} title="收起分类">
                    <PanelLeftClose size={16} className="text-gray-400" />
                  </button>
                </div>
                <div className="no-scrollbar flex-1 overflow-y-auto p-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuickCategory(null)}
                    className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                      !selectedQuickCategory ? 'bg-[#EAF9F1] font-bold text-[#00A35B]' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>全部</span>
                    <span className="text-xs text-gray-400">{activeProductIds.length}</span>
                  </button>
                  {quickCategories.map(category => (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => setSelectedQuickCategory(category.name)}
                      className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                        selectedQuickCategory === category.name
                          ? 'bg-[#EAF9F1] font-bold text-[#00A35B]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{category.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{category.count}</span>
                    </button>
                  ))}
                </div>
              </aside>
            )}
            {isCategoryPanelCollapsed && (
              <button
                type="button"
                onClick={() => setIsCategoryPanelCollapsed(false)}
                title="展开分类"
                className="flex w-9 shrink-0 items-start justify-center border-r border-[#E8E8E8] bg-white pt-3 text-gray-400 hover:text-[#00A35B]"
              >
                <PanelLeftOpen size={17} />
              </button>
            )}
            <div className="min-w-0 flex-1 overflow-auto">
            <table className={`${reviewChannel ? 'min-w-[1370px]' : 'min-w-[1190px]'} w-full table-fixed text-left text-sm`}>
              <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs font-bold text-gray-500">
                <tr>
                  <th className="w-[50px] border-b border-[#E8E8E8] px-4 py-3 text-center">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} aria-label="选择当前列表全部商品" className="h-4 w-4 rounded border-gray-300 accent-[#00B460]" />
                  </th>
                  <th className="w-[250px] border-b border-[#E8E8E8] px-5 py-3">商品</th>
                  <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-3">商品类型</th>
                  <th className="w-[170px] border-b border-[#E8E8E8] px-4 py-3">前台分类</th>
                  <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-3">基础价格</th>
                  <th className="w-[110px] border-b border-[#E8E8E8] px-4 py-3">售卖状态</th>
                  {reviewChannel && <th className="w-[180px] border-b border-[#E8E8E8] px-4 py-3">抖音审核状态</th>}
                  <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-3">更新时间</th>
                  <th className="sticky right-0 z-20 w-[340px] border-b border-l border-[#E8E8E8] bg-[#F7F8FA] px-4 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">操作</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product, index) => (
                  <tr key={product.id} className="group hover:bg-[#FAFBFC]">
                    <td className="border-b border-[#F0F0F0] px-4 py-4 text-center">
                      <input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => toggleProductSelection(product.id)} aria-label={`选择${product.name}`} className="h-4 w-4 rounded border-gray-300 accent-[#00B460]" />
                    </td>
                    <td className="border-b border-[#F0F0F0] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt="" className="h-11 w-11 shrink-0 border border-gray-100 object-cover" />
                        <div className="min-w-0"><div className="truncate font-bold text-gray-900">{product.name}</div><div className="mt-1 text-xs text-gray-400">商品ID {product.id}</div></div>
                      </div>
                    </td>
                    <td className="border-b border-[#F0F0F0] px-4 py-4 text-gray-600">{getProductTypeName(product)}</td>
                    <td className="border-b border-[#F0F0F0] px-4 py-4 text-gray-600">{getFrontendCategoryName(product)}</td>
                    <td className="border-b border-[#F0F0F0] px-4 py-4 font-medium text-gray-700">¥{Number(product.price || 0).toFixed(2)}</td>
                    <td className="border-b border-[#F0F0F0] px-4 py-4">
                      <span className={`inline-flex border px-2 py-1 text-[11px] font-bold ${getSaleStatus(product).className}`}>
                        {getSaleStatus(product).label}
                      </span>
                    </td>
                    {reviewChannel && (() => {
                      const status = getPlatformStatus(product.id) as PlatformStatus;
                      const meta = STATUS_META[status];
                      return <td className="border-b border-[#F0F0F0] px-4 py-4"><span className={`inline-flex border px-2 py-1 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>{status === 'rejected' && <div className="mt-1.5 text-[10px] leading-4 text-red-500">商品图片包含平台不支持的营销文字</div>}</td>;
                    })()}
                    <td className="border-b border-[#F0F0F0] px-4 py-4 text-xs text-gray-500">2026-07-15 10:{20 + index}</td>
                    <td className="sticky right-0 z-[5] border-b border-l border-[#F0F0F0] bg-white px-4 py-4 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] group-hover:bg-[#FAFBFC]">
                      <div className="flex items-center gap-4 whitespace-nowrap text-xs font-bold">
                        <button type="button" onClick={() => editChannelProduct(product)} className="text-[#00A35B] hover:text-[#008F53]">维护渠道资料</button>
                        {canCreateMasterFromCatalog && <button type="button" onClick={() => editMasterProduct(product)} className="text-[#245B8A] hover:text-[#17476F]" title="进入独立的商品主档编辑页；正式产品还需校验商品主档编辑权限">编辑商品主档</button>}
                        {reviewChannel && getPlatformStatus(product.id) === 'rejected' && <button type="button" onClick={() => submitPlatformProduct(product.id)} className="flex items-center text-red-600"><RefreshCw size={12} className="mr-1" />重新提交审核</button>}
                        {!unifiedCatalog && <button type="button" onClick={() => removeProductFromGroup(product.id)} className="flex items-center text-gray-400 hover:text-red-500"><Trash2 size={12} className="mr-1" />移出</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleProducts.length === 0 && <tr><td colSpan={reviewChannel ? 9 : 8} className="console-empty-state"><strong>{hasActiveFilters ? '没有符合条件的渠道商品' : '当前渠道商品库暂无商品'}</strong><span>{hasActiveFilters ? '请调整筛选条件后重新查询。' : canCreateMasterFromCatalog ? '可选择已有主档，或直接新建商品并一次填写主档资料与当前渠道商品资料。' : unifiedCatalog ? '新建商品主档后，系统会自动生成对应渠道商品。' : '从商品主档选择需要由当前渠道团队维护的商品。'}</span>{!hasActiveFilters && <div className="mt-4 flex items-center gap-2"><button type="button" onClick={openProductScopeEditor} className={canCreateMasterFromCatalog ? 'console-secondary-button' : 'console-primary-button'}><Plus size={15} />{canCreateMasterFromCatalog ? '选择已有主档' : '从商品主档添加'}</button>{canCreateMasterFromCatalog && <button type="button" onClick={() => setShowCreateMenu(true)} className="console-primary-button"><Plus size={15} />新建商品</button>}</div>}</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      </div>

      <WebProductSelectorDialog
        open={showProductScopeEditor}
        title="选择已有商品主档"
        description={`选择已有商品主档生成“${activeGroup.name}”的渠道商品；不会重复创建主档，商品身份和规格结构继续继承主档。`}
        products={products.map(product => ({
          ...product,
          frontendCategory: getFrontendCategoryName(product),
          productCode: product.skuCode,
        }))}
        selectedIds={pendingProductIds}
        disabledIds={unifiedCatalog ? activeProductIds : []}
        disabledLabel="已在当前商品库"
        onSelectedIdsChange={setPendingProductIds}
        onCancel={() => setShowProductScopeEditor(false)}
        onConfirm={confirmProductScope}
        confirmLabel={unifiedCatalog ? '生成渠道商品' : '保存商品范围'}
      />

      {showImportDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35">
          <div className="w-[620px] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div>
                <div className="text-[18px] font-bold text-[#1D2129]">导入渠道商品</div>
                <div className="mt-1 text-[12px] text-[#86909C]">导入范围：{activeGroup.name}。通过商品主档 SKUID 识别商品，只新增或更新渠道商品资料。</div>
              </div>
              <button type="button" onClick={() => setShowImportDialog(false)} title="关闭"><X size={18} className="text-[#667085]" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-md border border-[#E5E6EB] bg-[#F7F8FA] px-4 py-3 text-[12px] leading-5 text-[#667085]">
                商品身份和 SKU 结构不可通过此入口修改；前台分类、渠道名称、价格、图片和渠道专属属性可更新当前商品库。空白单元格默认不覆盖原值。
              </div>
              <label className="flex h-[120px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#C9CDD4] bg-white hover:border-[#00B460]">
                <Upload size={24} className="text-[#00B460]" />
                <span className="mt-2 text-[13px] font-medium text-[#1D2129]">{importFileName || '选择 Excel 或 CSV 文件'}</span>
                <span className="mt-1 text-[12px] text-[#86909C]">支持新增到当前渠道商品库和更新已有渠道商品</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={event => setImportFileName(event.target.files?.[0]?.name || '')}
                />
              </label>
              <button type="button" className="inline-flex items-center text-[13px] font-medium text-[#00A35B]" onClick={exportChannelProducts}>
                <Download size={14} className="mr-1.5" />下载当前渠道商品导入模板
              </button>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
              <button type="button" onClick={() => setShowImportDialog(false)} className="console-secondary-button">取消</button>
              <button
                type="button"
                disabled={!importFileName}
                onClick={() => {
                  setShowImportDialog(false);
                  setOperationMessage(`“${importFileName}”已提交校验，校验通过后将更新${activeGroup.name}。`);
                }}
                className="console-primary-button disabled:cursor-not-allowed disabled:opacity-50"
              >
                上传并校验
              </button>
            </div>
          </div>
        </div>
      )}

      {showSortDialog && selectedQuickCategory && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35">
          <div className="flex max-h-[76vh] w-[680px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div>
                <div className="text-[18px] font-bold text-[#1D2129]">前台分类商品排序</div>
                <div className="mt-1 text-[12px] text-[#86909C]">{activeGroup.name} / {selectedQuickCategory} · 调整后仅影响当前商品库中该分类的展示顺序</div>
              </div>
              <button type="button" onClick={() => setShowSortDialog(false)} title="关闭"><X size={18} className="text-[#667085]" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="overflow-hidden rounded-md border border-[#E5E6EB]">
                {sortDraftProductIds.map((productId, index) => {
                  const product = effectiveProducts.find(item => item.id === productId);
                  if (!product) return null;
                  return (
                    <div key={product.id} className="flex items-center gap-3 border-b border-[#F0F1F2] px-4 py-3 last:border-b-0">
                      <span className="w-7 shrink-0 text-center text-[13px] font-bold text-[#86909C]">{index + 1}</span>
                      <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded border border-[#F0F1F2] object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-bold text-[#1D2129]">{product.name}</div>
                        <div className="mt-0.5 text-[11px] text-[#86909C]">商品ID {product.id}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moveSortedProduct(product.id, -1)} className="flex h-8 w-8 items-center justify-center rounded border border-[#E5E6EB] text-[#4E5969] hover:border-[#00B460] hover:text-[#00A35B] disabled:cursor-not-allowed disabled:opacity-35" title="上移"><ChevronUp size={16} /></button>
                        <button type="button" disabled={index === sortDraftProductIds.length - 1} onClick={() => moveSortedProduct(product.id, 1)} className="flex h-8 w-8 items-center justify-center rounded border border-[#E5E6EB] text-[#4E5969] hover:border-[#00B460] hover:text-[#00A35B] disabled:cursor-not-allowed disabled:opacity-35" title="下移"><ChevronDown size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
              <button type="button" onClick={() => setShowSortDialog(false)} className="console-secondary-button">取消</button>
              <button type="button" onClick={saveCategorySort} className="console-primary-button">保存排序</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
