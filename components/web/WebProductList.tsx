
import React, { useMemo, useState } from 'react';
import { Search, Plus, ChevronDown, MoreHorizontal, Filter, ListFilter, X, Trash2, HelpCircle, Package, ChevronLeft, ChevronRight, Box, Utensils, CupSoda, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useProducts } from '../../context';
import { TabItem } from './WebCommon';
import type { Product } from '../../types';

type ProductTab = 'all' | 'on_shelf' | 'off_shelf' | 'draft';
type QuickCategoryView = 'backend' | 'frontend';

const DEFAULT_FILTERS = {
  productId: '',
  skuId: '',
  backendCategory: 'all',
  frontendCategory: 'all',
  productType: 'all',
};

const getProductTypeLabel = (product: Product) => (product.type === 'combo' ? '套餐商品' : '标准商品');

const getProductStatusLabel = (product: Product) => {
  if (product.status === 'draft') return '草稿';
  return product.status === 'on_shelf' ? '可售' : '停售';
};

const getFrontendCategoryName = (product: Product) => {
  if (product.type === 'combo') return '套餐组合';
  if (product.category === '现制饮品') return Number(product.id) % 2 === 0 ? '咖啡类' : '奶茶类';
  if (product.category === '中式正餐') return product.name.includes('火锅') ? '火锅锅底' : '炒菜/烧菜类';
  if (product.category === '西式快餐') return '轻食简餐';
  if (product.category === '烘焙甜品') return '甜品烘焙';
  if (product.category === '零售商品') return '零售周边';
  return '未分类';
};

const getBatchActions = (tab: ProductTab) => {
  if (tab === 'all') return ['改价', '批量修改标准商品', '批量修改套餐商品', '加入到模板'];
  if (tab === 'on_shelf') return ['改价', '批量修改标准商品', '批量修改套餐商品', '加入到模板', '批量停售'];
  if (tab === 'off_shelf') return ['批量启售', '批量归档'];
  return [];
};

const buildCopyProduct = (product: Product): Product => {
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
  onViewDetail?: (product: any) => void;
  onEditProduct?: (product: any) => void;
}> = ({ onCreateClick, onImportClick, onViewDetail, onEditProduct }) => {
  const { products, categories, addProduct, toggleShelfStatus } = useProducts();
  const [activeTab, setActiveTab] = useState<ProductTab>('on_shelf');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showToolbarMoreDropdown, setShowToolbarMoreDropdown] = useState(false);
  const [isCategoryPanelCollapsed, setIsCategoryPanelCollapsed] = useState(false);
  const [quickCategoryView, setQuickCategoryView] = useState<QuickCategoryView>('backend');
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<{ view: QuickCategoryView; name: string | null }>({
    view: 'backend',
    name: null,
  });
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [rowMoreMenu, setRowMoreMenu] = useState<{ productId: string; top: number; left: number } | null>(null);

  const tabCounts = useMemo(
    () => ({
      all: products.length,
      on_shelf: products.filter(item => item.status === 'on_shelf').length,
      off_shelf: products.filter(item => item.status === 'off_shelf').length,
      draft: products.filter(item => item.status === 'draft').length,
    }),
    [products]
  );

  const backendQuickCategories = useMemo(() => {
    const names = Array.from(new Set([...categories.map(item => item.name), ...products.map(item => item.category).filter(Boolean)]));
    return names
      .map(name => ({
        name,
        count: products.filter(product => product.category === name).length,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
  }, [categories, products]);

  const frontendQuickCategories = useMemo(() => {
    const countMap = new Map<string, number>();
    products.forEach(product => {
      const name = getFrontendCategoryName(product);
      countMap.set(name, (countMap.get(name) || 0) + 1);
    });
    return Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
  }, [products]);

  const visibleQuickCategories = useMemo(
    () => (quickCategoryView === 'backend' ? backendQuickCategories : frontendQuickCategories),
    [backendQuickCategories, frontendQuickCategories, quickCategoryView]
  );

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (activeTab === 'on_shelf' && product.status !== 'on_shelf') return false;
      if (activeTab === 'off_shelf' && product.status !== 'off_shelf') return false;
      if (activeTab === 'draft' && product.status !== 'draft') return false;
      if (activeTab !== 'draft' && product.status === 'draft') return false;
      if (appliedFilters.productId && !product.id.includes(appliedFilters.productId)) return false;
      if (appliedFilters.skuId && !product.skuCode.includes(appliedFilters.skuId)) return false;
      if (appliedFilters.backendCategory !== 'all' && product.category !== appliedFilters.backendCategory) return false;
      if (appliedFilters.frontendCategory !== 'all' && getFrontendCategoryName(product) !== appliedFilters.frontendCategory) return false;
      if (appliedFilters.productType !== 'all' && (product.type === 'combo' ? 'combo' : 'standard') !== appliedFilters.productType) return false;
      if (selectedQuickCategory.name && selectedQuickCategory.view === 'backend' && product.category !== selectedQuickCategory.name) return false;
      if (selectedQuickCategory.name && selectedQuickCategory.view === 'frontend' && getFrontendCategoryName(product) !== selectedQuickCategory.name) return false;
      if (
        searchQuery &&
        !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.skuCode.includes(searchQuery) &&
        !product.id.includes(searchQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [products, activeTab, searchQuery, appliedFilters, selectedQuickCategory]);

  const batchActions = getBatchActions(activeTab);
  const selectionEnabled = activeTab !== 'draft';
  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every(item => selectedProductIds.includes(item.id));

  const selectedProducts = useMemo(
    () => products.filter(product => selectedProductIds.includes(product.id)),
    [products, selectedProductIds]
  );
  const hasComboSelection = selectedProducts.some(product => product.type === 'combo');

  const toolbarMoreActions = [
    { label: '批量同步门店', enabled: selectedProductIds.length > 0 },
    { label: '批量门店销售设置', enabled: selectedProductIds.length > 0 },
    { label: '批量打印设置', enabled: selectedProductIds.length > 0 && !hasComboSelection },
    { label: '批量导出商品路径', enabled: selectedProductIds.length > 0 },
  ];

  const handleTabChange = (tab: ProductTab) => {
    setActiveTab(tab);
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
    setSelectedQuickCategory({ view: quickCategoryView, name: null });
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
    toggleShelfStatus(product.id);
    setRowMoreMenu(null);
  };

  const getRowMoreActions = (product: Product) => {
    const actions = [
      { key: 'shelf', label: product.status === 'on_shelf' ? '停售' : '启售', onClick: () => handleToggleShelf(product) },
      { key: 'sync', label: '同步门店', onClick: () => setRowMoreMenu(null) },
      { key: 'store-sale', label: '门店销售设置', onClick: () => setRowMoreMenu(null) },
      { key: 'route', label: '商品路径', onClick: () => setRowMoreMenu(null) },
      { key: 'copy', label: '复制', onClick: () => handleCopyProduct(product) },
    ];

    if (product.type !== 'combo') {
      actions.splice(3, 0, { key: 'print', label: '打印设置', onClick: () => setRowMoreMenu(null) });
    }

    return actions;
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
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex h-[48px] shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-5">
        <div className="flex h-full space-x-8">
          <TabItem label="全部商品" count={tabCounts.all} active={activeTab === 'all'} onClick={() => handleTabChange('all')} />
          <TabItem label="可售商品" count={tabCounts.on_shelf} active={activeTab === 'on_shelf'} onClick={() => handleTabChange('on_shelf')} />
          <TabItem label="停售商品" count={tabCounts.off_shelf} active={activeTab === 'off_shelf'} onClick={() => handleTabChange('off_shelf')} />
          <TabItem label="草稿" count={tabCounts.draft} active={activeTab === 'draft'} onClick={() => handleTabChange('draft')} />
        </div>
        <button className="flex items-center text-[13px] text-[#666] hover:text-[#333]">
          <Trash2 size={14} className="mr-1.5" /> 回收站
        </button>
      </div>

      <div className="shrink-0 space-y-4 border-b border-[#E8E8E8] bg-[#F5F6FA] p-4">
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
          <div className="group flex h-[36px] w-[220px] items-center rounded-md border border-[#E8E8E8] bg-white px-3 transition-colors hover:border-[#00C06B]">
            <span className="mr-2 whitespace-nowrap text-xs text-gray-500">前台分类:</span>
            <select
              className="w-full flex-1 cursor-pointer bg-transparent text-sm text-[#333] outline-none"
              value={draftFilters.frontendCategory}
              onChange={e => setDraftFilters(prev => ({ ...prev, frontendCategory: e.target.value }))}
            >
              <option value="all">全部</option>
              {frontendQuickCategories.map(item => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            {draftFilters.frontendCategory !== 'all' ? (
              <X
                size={14}
                className="ml-1 cursor-pointer text-gray-400 hover:text-red-500"
                onClick={() => setDraftFilters(prev => ({ ...prev, frontendCategory: 'all' }))}
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

          <button className="flex h-[36px] items-center rounded-md border border-[#E8E8E8] bg-white px-4 text-[13px] text-[#666] transition-all hover:border-[#00C06B] hover:bg-gray-50 hover:text-[#00C06B]">
            <Plus size={14} className="mr-1" /> 添加筛选
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="flex items-center rounded-md border border-[#E8E8E8] bg-white px-4 py-1.5 text-[13px] text-[#333] shadow-sm transition-all hover:bg-gray-50">
              <Box size={14} className="mr-2 text-gray-400" /> 保存快捷筛选项
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleResetFilters} className="h-[36px] rounded-md border border-[#E8E8E8] bg-white px-5 text-[13px] text-[#333] transition-colors hover:bg-gray-50 hover:text-[#00C06B]">
              重置
            </button>
            <button onClick={handleApplyFilters} className="h-[36px] rounded-md bg-[#00C06B] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#00A35B] active:scale-95">
              查询
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white p-4">
        <div className="relative flex min-h-0 flex-1">
          {!isCategoryPanelCollapsed && (
            <aside className="flex min-h-0 w-[240px] shrink-0 flex-col rounded-lg border border-[#E8E8E8] bg-white">
              <div className="flex items-center justify-between border-b border-[#E8E8E8] px-3 py-3">
                <div className="flex items-center space-x-4 text-[13px] font-bold">
                  <button
                    onClick={() => {
                      setQuickCategoryView('backend');
                      setSelectedQuickCategory(prev => ({ view: 'backend', name: prev.view === 'backend' ? prev.name : null }));
                    }}
                    className={quickCategoryView === 'backend' ? 'text-[#00C06B]' : 'text-[#666] hover:text-[#00C06B]'}
                  >
                    后台分类({backendQuickCategories.length})
                  </button>
                  <button
                    onClick={() => {
                      setQuickCategoryView('frontend');
                      setSelectedQuickCategory(prev => ({ view: 'frontend', name: prev.view === 'frontend' ? prev.name : null }));
                    }}
                    className={quickCategoryView === 'frontend' ? 'text-[#00C06B]' : 'text-[#666] hover:text-[#00C06B]'}
                  >
                    前台分类({frontendQuickCategories.length})
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                <button
                  onClick={() => setSelectedQuickCategory({ view: quickCategoryView, name: null })}
                  className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] ${
                    selectedQuickCategory.view === quickCategoryView && !selectedQuickCategory.name
                      ? 'bg-[#EAF9F1] font-bold text-[#00C06B]'
                      : 'text-[#333] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <span>全部</span>
                  <span className="text-[12px] text-[#98A2B3]">{products.length}</span>
                </button>
                {visibleQuickCategories.map(item => (
                  <button
                    key={`${quickCategoryView}-${item.name}`}
                    onClick={() => setSelectedQuickCategory({ view: quickCategoryView, name: item.name })}
                    className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] ${
                      selectedQuickCategory.view === quickCategoryView && selectedQuickCategory.name === item.name
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
                <button className="flex h-[36px] items-center rounded-md border border-[#E8E8E8] px-3 text-[13px] text-[#666] transition-all hover:border-[#00C06B] hover:bg-gray-50 hover:text-[#00C06B]">
                  <ListFilter size={14} className="mr-1.5" /> 排序管理
                </button>

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
                    <div className="absolute left-0 top-[38px] z-20 w-36 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
                      <button onClick={onImportClick} className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#00C06B]">
                        批量导入商品
                      </button>
                      <button className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#00C06B]">
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
                          onClick={() => setShowToolbarMoreDropdown(false)}
                        >
                          {action.label}
                        </button>
                      ))}
                      {hasComboSelection && (
                        <div className="border-t border-[#F2F3F5] px-4 py-2 text-[12px] text-[#98A2B3]">已选套餐商品不支持打印设置</div>
                      )}
                    </div>
                  )}
                </div>

                <button onClick={() => onCreateClick('standard')} className="flex h-[36px] items-center rounded-md bg-[#00C06B] px-4 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#00A35B] active:scale-95">
                  <CupSoda size={16} className="mr-1.5" /> 新建商品
                </button>
                <button onClick={() => onCreateClick('combo')} className="flex h-[36px] items-center rounded-md border border-[#00C06B] bg-white px-4 text-[13px] font-bold text-[#00C06B] shadow-sm transition-all hover:bg-[#E6F8F0] active:scale-95">
                  <Utensils size={16} className="mr-1.5" /> 新建套餐商品
                </button>
              </div>
            </div>

            {selectedProductIds.length > 0 && batchActions.length > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-[#D8F0E3] bg-[#F4FCF7] px-4 py-3">
                <div className="text-[13px] text-[#333]">
                  已选择 <span className="font-bold text-[#00C06B]">{selectedProductIds.length}</span> 个商品
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {batchActions.map(action => {
                    const isDanger = action === '批量停售' || action === '批量归档';
                    return (
                      <button
                        key={action}
                        className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                          isDanger
                            ? 'border border-[#FFD6D6] bg-white text-[#FF4D4F] hover:bg-[#FFF5F5]'
                            : 'border border-[#D9EBDD] bg-white text-[#00A35B] hover:bg-[#F3FBF6]'
                        }`}
                      >
                        {action}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between text-[12px] text-[#98A2B3]">
              <div className="flex items-center gap-2">
                {selectedQuickCategory.name && (
                  <span className="rounded-full bg-[#F5F7FA] px-3 py-1 text-[#5B6475]">
                    {selectedQuickCategory.view === 'backend' ? '后台分类' : '前台分类'}：{selectedQuickCategory.name}
                  </span>
                )}
                {appliedFilters.backendCategory !== 'all' && (
                  <span className="rounded-full bg-[#F5F7FA] px-3 py-1 text-[#5B6475]">后台分类筛选：{appliedFilters.backendCategory}</span>
                )}
                {appliedFilters.frontendCategory !== 'all' && (
                  <span className="rounded-full bg-[#F5F7FA] px-3 py-1 text-[#5B6475]">前台分类筛选：{appliedFilters.frontendCategory}</span>
                )}
              </div>
            </div>

            <div className="relative flex-1 overflow-auto rounded-lg border border-[#E8E8E8] no-scrollbar">
              <table className="min-w-[1280px] w-max border-collapse text-left">
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
                    <th className="w-[120px] whitespace-nowrap px-4">后台分类</th>
                    <th className="w-[120px] whitespace-nowrap px-4">前台分类</th>
                    <th className="w-[100px] whitespace-nowrap px-4">基础价格</th>
                    <th className="w-[100px] whitespace-nowrap px-4">售卖状态</th>
                    <th className="w-[100px] whitespace-nowrap px-4">数据来源</th>
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
                              <div className="font-mono text-[11px] text-[#999]">{product.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#666]">{getProductTypeLabel(product)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#666]">{product.category || '未分类'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#666]">{getFrontendCategoryName(product)}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono font-medium">
                          {product.price} <span className="text-[10px] text-gray-400">元</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {product.status === 'on_shelf' ? (
                            <span className="text-[#333]">{getProductStatusLabel(product)}</span>
                          ) : (
                            <span className="text-[#999]">{getProductStatusLabel(product)}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center text-[#666]">
                            品牌 <HelpCircle size={12} className="ml-1 cursor-help text-[#00C06B]" />
                          </div>
                        </td>
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
                      <td colSpan={11} className="bg-gray-50/30 py-20 text-center text-[#999]">
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
                <button className="flex h-6 w-6 cursor-not-allowed items-center justify-center rounded border bg-gray-50 text-gray-400">
                  <ChevronLeft size={12} />
                </button>
                <button className="flex h-6 w-6 items-center justify-center rounded border border-[#00C06B] bg-white font-bold text-[#00C06B]">1</button>
                <button className="flex h-6 w-6 items-center justify-center rounded border bg-white transition-colors hover:border-[#00C06B] hover:bg-gray-50 hover:text-[#00C06B]">2</button>
                <button className="flex h-6 w-6 items-center justify-center rounded border bg-white transition-colors hover:border-[#00C06B] hover:bg-gray-50 hover:text-[#00C06B]">...</button>
                <button className="flex h-6 w-6 items-center justify-center rounded border bg-white transition-colors hover:border-[#00C06B] hover:bg-gray-50 hover:text-[#00C06B]">10</button>
                <button className="flex h-6 w-6 items-center justify-center rounded border bg-white transition-colors hover:border-[#00C06B] hover:bg-gray-50 hover:text-[#00C06B]">
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
      </div>
    </main>
  );
};
