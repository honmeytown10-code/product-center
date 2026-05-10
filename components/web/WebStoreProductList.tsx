import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, ChevronDown, MoreHorizontal, FileUp,
  Printer, Smartphone, Store, ShoppingBag, Coffee, ChevronLeft,
  ChevronRight, CheckCircle2, X, Link, Layers, Eye, GripVertical,
  ArrowUpDown, Upload, PackageOpen
} from 'lucide-react';
import { useProducts } from '../../context';

type StoreProductPageMode = 'manage' | 'coverage';
type StoreProductManagePreset = {
  keyword?: string;
};

type StoreProductRecord = {
  id: string;
  baseProductId: string;
  name: string;
  type: 'Standard' | 'Combo';
  category: string;
  storeName: string;
  storeId: string;
  channels: string[];
  image: string;
  tags: string[];
  status: 'on_shelf' | 'off_shelf';
  stockStatus: 'normal' | 'low' | 'empty';
  stockCount: number;
  lastSync: string;
  sortIndex: number;
};

type StoreProductCoverageSummary = {
  baseProductId: string;
  name: string;
  type: 'Standard' | 'Combo';
  category: string;
  image: string;
  tags: string[];
  storeCount: number;
  onShelfStoreCount: number;
  offShelfStoreCount: number;
  soldOutStoreCount: number;
  channelIds: string[];
  lastSync: string;
};

const STORE_OPTIONS = [
  { id: 'all', name: '全部门店' },
  { id: 's1', name: '南山万象店' },
  { id: 's2', name: '福田卓悦店' },
  { id: 's3', name: '宝安壹方城店' },
  { id: 's4', name: '龙华红山店' },
];

const MOCK_STORE_PRODUCTS: StoreProductRecord[] = [
  {
    id: '974340414367182854-s1',
    baseProductId: '974340414367182854',
    name: '招牌珍珠奶茶',
    type: 'Standard',
    category: '奶茶系列',
    storeName: '南山万象店',
    storeId: 's1',
    channels: ['pos', 'mini_dine', 'mini_take', 'meituan'],
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=100',
    tags: ['新品'],
    status: 'on_shelf',
    stockStatus: 'normal',
    stockCount: 128,
    lastSync: '10分钟前',
    sortIndex: 0,
  },
  {
    id: '974340414367182854-s2',
    baseProductId: '974340414367182854',
    name: '招牌珍珠奶茶',
    type: 'Standard',
    category: '奶茶系列',
    storeName: '福田卓悦店',
    storeId: 's2',
    channels: ['mini_dine', 'mini_take', 'eleme'],
    image: 'https://images.unsplash.com/photo-1589301760576-47f4056966d5?auto=format&fit=crop&q=80&w=100',
    tags: ['热销'],
    status: 'on_shelf',
    stockStatus: 'low',
    stockCount: 18,
    lastSync: '25分钟前',
    sortIndex: 1,
  },
  {
    id: '924336445413220352-s2',
    baseProductId: '924336445413220352',
    name: '海盐芝士拿铁',
    type: 'Standard',
    category: '咖啡系列',
    storeName: '福田卓悦店',
    storeId: 's2',
    channels: ['pos', 'mini_dine', 'mini_take', 'meituan', 'taobao'],
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=100',
    tags: ['热销'],
    status: 'on_shelf',
    stockStatus: 'normal',
    stockCount: 76,
    lastSync: '5分钟前',
    sortIndex: 1,
  },
  {
    id: '934501236899667968-s3',
    baseProductId: '934501236899667968',
    name: '多肉葡萄',
    type: 'Standard',
    category: '果茶系列',
    storeName: '宝安壹方城店',
    storeId: 's3',
    channels: ['pos', 'meituan', 'eleme'],
    image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd71?auto=format&fit=crop&q=80&w=100',
    tags: [],
    status: 'off_shelf',
    stockStatus: 'empty',
    stockCount: 0,
    lastSync: '2小时前',
    sortIndex: 1,
  },
  {
    id: '956890134637523945-s4',
    baseProductId: '956890134637523945',
    name: '经典牛肉汉堡',
    type: 'Combo',
    category: '轻食系列',
    storeName: '龙华红山店',
    storeId: 's4',
    channels: ['pos', 'taobao'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=100',
    tags: ['特价'],
    status: 'on_shelf',
    stockStatus: 'normal',
    stockCount: 32,
    lastSync: '昨天 21:12',
    sortIndex: 2,
  },
  {
    id: '956890134637523945-s1',
    baseProductId: '956890134637523945',
    name: '经典牛肉汉堡',
    type: 'Combo',
    category: '轻食系列',
    storeName: '南山万象店',
    storeId: 's1',
    channels: ['pos', 'mini_take', 'meituan_tuangou'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=100',
    tags: [],
    status: 'on_shelf',
    stockStatus: 'normal',
    stockCount: 45,
    lastSync: '昨天 18:06',
    sortIndex: 3,
  },
];

const MOCK_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: '1', name: '奶茶系列' },
  { id: '2', name: '咖啡系列' },
  { id: '3', name: '果茶系列' },
  { id: '4', name: '轻食系列' },
];

const CHANNEL_DEFS: Record<string, { label: string; color: string }> = {
  pos: { label: 'POS', color: 'bg-blue-100 text-blue-700' },
  mini_dine: { label: '小程序-堂食', color: 'bg-[#00C06B]/10 text-[#00C06B]' },
  mini_take: { label: '小程序-外卖', color: 'bg-[#00C06B]/10 text-[#00C06B]' },
  meituan: { label: '美团-外卖', color: 'bg-yellow-100 text-yellow-700' },
  meituan_tuangou: { label: '美团-团购', color: 'bg-yellow-100 text-yellow-700' },
  taobao: { label: '淘宝闪购', color: 'bg-orange-100 text-orange-700' },
  eleme: { label: '饿了么', color: 'bg-blue-100 text-blue-600' },
};

const DEFAULT_CHANNELS = [
  { id: 'mini_dine', label: '小程序-堂食' },
  { id: 'mini_take', label: '小程序-外卖' },
  { id: 'meituan', label: '美团-外卖' },
  { id: 'meituan_tuangou', label: '美团-团购' },
  { id: 'taobao', label: '淘宝闪购' },
  { id: 'pos', label: 'POS' },
];

export const WebStoreProductList: React.FC<{
  mode?: StoreProductPageMode;
  managePreset?: StoreProductManagePreset | null;
  onOpenManageProduct?: (preset: StoreProductManagePreset) => void;
}> = ({ mode = 'manage', managePreset = null, onOpenManageProduct }) => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = brandConfigs[activeBrandId];
  const enableGrouping = config?.enableChannelGrouping ?? false;
  const groups = config?.channelGroups || [];

  const [activeTabId, setActiveTabId] = useState('all');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [activeStoreId, setActiveStoreId] = useState('all');
  const [manageKeyword, setManageKeyword] = useState(managePreset?.keyword || '');
  const [coverageKeyword, setCoverageKeyword] = useState('');
  const [coverageCategoryId, setCoverageCategoryId] = useState('all');
  const [coverageType, setCoverageType] = useState<'all' | 'Standard' | 'Combo'>('all');
  const [coverageStoreId, setCoverageStoreId] = useState('all');
  const [coverageChannelId, setCoverageChannelId] = useState('all');
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success'; subMessage?: string } | null>(null);
  const [categories, setCategories] = useState(MOCK_CATEGORIES.filter(c => c.id !== 'all'));
  const [isSorting, setIsSorting] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    setIsSorting(false);
  }, [activeTabId]);

  useEffect(() => {
    if (activeStoreId === 'all') {
      setActiveCategoryId('all');
      setIsSorting(false);
    }
  }, [activeStoreId]);

  useEffect(() => {
    if (mode === 'manage') {
      setManageKeyword(managePreset?.keyword || '');
      setActiveStoreId('all');
      setActiveCategoryId('all');
      setActiveTabId('all');
    }
  }, [managePreset, mode]);

  const tabs = useMemo(() => [{ id: 'all', label: '全部渠道' }, ...DEFAULT_CHANNELS], []);

  const filteredProducts = useMemo(() => {
    let filtered = MOCK_STORE_PRODUCTS;
    if (activeStoreId !== 'all') {
      filtered = filtered.filter(p => p.storeId === activeStoreId);
    }
    if (activeTabId !== 'all') {
      filtered = filtered.filter(p => p.channels.includes(activeTabId));
    }
    if (activeCategoryId !== 'all') {
      const categoryName = MOCK_CATEGORIES.find(c => c.id === activeCategoryId)?.name;
      filtered = filtered.filter(p => p.category.includes(categoryName || ''));
    }
    const normalizedKeyword = manageKeyword.trim().toLowerCase();
    if (normalizedKeyword) {
      filtered = filtered.filter(p => `${p.name} ${p.baseProductId} ${p.category}`.toLowerCase().includes(normalizedKeyword));
    }
    return filtered;
  }, [activeStoreId, activeTabId, activeCategoryId, manageKeyword]);

  const coverageSourceRows = useMemo(() => {
    const normalizedKeyword = coverageKeyword.trim().toLowerCase();
    return MOCK_STORE_PRODUCTS.filter(product => {
      if (coverageStoreId !== 'all' && product.storeId !== coverageStoreId) {
        return false;
      }
      if (coverageChannelId !== 'all' && !product.channels.includes(coverageChannelId)) {
        return false;
      }
      if (coverageType !== 'all' && product.type !== coverageType) {
        return false;
      }
      if (coverageCategoryId !== 'all') {
        const categoryName = MOCK_CATEGORIES.find(c => c.id === coverageCategoryId)?.name;
        if (!product.category.includes(categoryName || '')) {
          return false;
        }
      }
      if (normalizedKeyword) {
        const matchedText = `${product.name} ${product.baseProductId} ${product.category}`.toLowerCase();
        if (!matchedText.includes(normalizedKeyword)) {
          return false;
        }
      }
      return true;
    });
  }, [coverageKeyword, coverageCategoryId, coverageType, coverageStoreId, coverageChannelId]);

  const coverageRows = useMemo<StoreProductCoverageSummary[]>(() => {
    const grouped = coverageSourceRows.reduce<Record<string, StoreProductRecord[]>>((acc, item) => {
      if (!acc[item.baseProductId]) {
        acc[item.baseProductId] = [];
      }
      acc[item.baseProductId].push(item);
      return acc;
    }, {});

    return Object.values(grouped)
      .map(items => {
        const first = items[0];
        const channelIds = Array.from(new Set(items.flatMap(item => item.channels)));
        return {
          baseProductId: first.baseProductId,
          name: first.name,
          type: first.type,
          category: first.category,
          image: first.image,
          tags: Array.from(new Set(items.flatMap(item => item.tags))),
          storeCount: items.length,
          onShelfStoreCount: items.filter(item => item.status === 'on_shelf').length,
          offShelfStoreCount: items.filter(item => item.status !== 'on_shelf').length,
          soldOutStoreCount: items.filter(item => item.stockStatus === 'empty').length,
          channelIds,
          lastSync: items[0].lastSync,
        };
      })
      .sort((a, b) => {
        if (b.storeCount !== a.storeCount) return b.storeCount - a.storeCount;
        return a.name.localeCompare(b.name, 'zh-CN');
      });
  }, [coverageSourceRows]);

  const coverageStats = useMemo(() => {
    const coveredStores = new Set(coverageSourceRows.map(item => item.storeId));
    const allChannels = new Set(coverageSourceRows.flatMap(item => item.channels));
    return {
      totalStores: coveredStores.size,
      totalChannels: allChannels.size,
      onShelfProducts: coverageRows.filter(item => item.onShelfStoreCount > 0).length,
      offShelfProducts: coverageRows.filter(item => item.offShelfStoreCount > 0).length,
      soldOutProducts: coverageRows.filter(item => item.soldOutStoreCount > 0).length,
    };
  }, [coverageRows, coverageSourceRows]);

  const showCategoryPanel = mode === 'manage' && activeStoreId !== 'all';

  const handleAction = (product: StoreProductRecord, action: 'shelf' | 'stock' | 'edit') => {
    if (action === 'edit') {
      setNotification({ type: 'info', message: `打开 ${product.storeName} 的商品编辑页` });
      return;
    }

    if (activeTabId === 'all') {
      setNotification({
        type: 'success',
        message: `${action === 'shelf' ? '上下架' : '沽清'}操作成功`,
        subMessage: '已应用至当前筛选范围内的门店商品',
      });
      return;
    }

    let affectedChannels = [activeTabId];
    let groupName = null;
    if (enableGrouping) {
      const group = groups.find(g => g.channels.includes(activeTabId));
      if (group) {
        affectedChannels = group.channels;
        groupName = group.name;
      }
    }

    const actionName = action === 'shelf' ? '上下架' : '沽清';
    if (groupName && affectedChannels.length > 1) {
      const channelNames = affectedChannels.map(c => CHANNEL_DEFS[c]?.label || c).join('、');
      setNotification({
        type: 'info',
        message: `已触发“${groupName}”分组联动${actionName}`,
        subMessage: `同步生效渠道：${channelNames}`,
      });
    } else {
      setNotification({
        type: 'success',
        message: `${CHANNEL_DEFS[activeTabId]?.label || activeTabId} ${actionName}成功`,
      });
    }
  };

  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const newCategories = [...categories];
    const draggedItem = newCategories[draggedIdx];
    newCategories.splice(draggedIdx, 1);
    newCategories.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setCategories(newCategories);
  };

  const handleDragEnd = () => setDraggedIdx(null);

  const saveCategorySort = () => {
    setIsSorting(false);
    setNotification({
      type: 'success',
      message: activeTabId === 'all' ? '分类排序已保存' : `${CHANNEL_DEFS[activeTabId]?.label || '当前渠道'} 分类排序保存成功`,
      subMessage: activeTabId === 'all' ? '已同步至当前管理范围内的门店' : undefined,
    });
  };

  const renderNotification = () => (
    <>
      {notification && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
          <div className="bg-[#1F2129] text-white px-6 py-4 rounded-xl shadow-2xl flex items-start max-w-md border border-gray-700">
            <div className={`mt-0.5 mr-3 ${notification.type === 'info' ? 'text-blue-400' : 'text-[#00C06B]'}`}>
              {notification.type === 'info' ? <Link size={18} /> : <CheckCircle2 size={18} />}
            </div>
            <div>
              <div className="font-bold text-sm mb-1">{notification.message}</div>
              {notification.subMessage && <div className="text-xs text-gray-400 leading-relaxed">{notification.subMessage}</div>}
            </div>
            <button onClick={() => setNotification(null)} className="ml-4 text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  const renderManagePage = () => (
    <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4">
      {renderNotification()}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
        <div className="p-5 border-b border-[#E8E8E8] bg-white space-y-4 shrink-0 z-20">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterInput label="商品ID" placeholder="请输入" />
            <FilterInput label="SKUID" placeholder="请输入" />
            <FilterStoreSelect label="机构门店" options={STORE_OPTIONS} value={activeStoreId} onChange={setActiveStoreId} />
            <FilterSelect label="商品类型" placeholder="请选择" />
            <FilterSelect label="售卖状态" placeholder="全部" canClear />
            <FilterSelect label="库存状态" placeholder="请选择" canClear />
            <button className="h-[34px] px-3 border border-dashed border-[#AAA] text-[#666] rounded hover:border-[#00C06B] hover:text-[#00C06B] transition-colors text-xs flex items-center bg-white">
              <Plus size={14} className="mr-1" /> 添加筛选
            </button>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center flex-wrap gap-3">
              <button className="flex items-center text-xs text-[#666] border border-[#E8E8E8] px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
                <FileUp size={14} className="mr-1.5" /> 保存快捷筛选选项
              </button>
              {enableGrouping && (
                <div className="flex items-center px-3 py-1.5 bg-orange-50 text-orange-600 rounded text-xs font-bold border border-orange-100">
                  <Layers size={12} className="mr-1.5" />
                  已开启渠道分组联动
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button className="px-6 py-1.5 border border-[#E8E8E8] text-[#333] rounded text-xs hover:bg-gray-50 transition-colors">重置</button>
              <button className="px-6 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">查询</button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 flex justify-between items-center border-b border-[#E8E8E8] bg-white shrink-0 z-10 gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#999]" />
              <input value={manageKeyword} onChange={e => setManageKeyword(e.target.value)} className="pl-9 pr-4 py-1.5 border border-[#E8E8E8] rounded w-56 text-sm focus:border-[#00C06B] focus:outline-none transition-colors" placeholder="搜索商品名称/ID" />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto max-w-[550px] no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`relative px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap rounded-lg ${activeTabId === tab.id ? 'text-[#00C06B] bg-[#00C06B]/5' : 'text-[#666] hover:text-[#333] hover:bg-gray-50'}`}
                >
                  {tab.label}
                  {activeTabId === tab.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#00C06B] rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button className="flex items-center px-3 py-1.5 border border-[#E8E8E8] rounded text-xs text-[#333] hover:bg-gray-50 font-medium">
              <ArrowUpDown size={14} className="mr-1.5 text-[#666]" /> 排序管理
            </button>
            <button className="flex items-center px-3 py-1.5 border border-[#E8E8E8] rounded text-xs text-[#333] hover:bg-gray-50 font-medium">
              <Upload size={14} className="mr-1.5 text-[#666]" /> 导入
            </button>
            <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">
              日志导出
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden bg-white">
          {showCategoryPanel && (
            <div className="w-56 bg-white border-r border-[#E8E8E8] flex flex-col z-10 flex-shrink-0">
              <div className="p-4 border-b border-[#E8E8E8] flex justify-between items-center">
                <span className="font-bold text-[#333]">前台分类</span>
                {!isSorting && (
                  <button onClick={() => setIsSorting(true)} className="text-xs flex items-center text-[#00C06B] hover:text-[#00A35B] transition-colors px-2 py-1 rounded border border-[#00C06B]">
                    <ArrowUpDown size={12} className="mr-1" /> 排序
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
                {isSorting && activeTabId === 'all' && (
                  <div className="mx-2 mb-2 px-3 py-2 bg-blue-50 text-blue-600 rounded text-[11px] leading-relaxed border border-blue-100 flex items-start">
                    <Link size={12} className="mr-1.5 mt-0.5 flex-shrink-0" />
                    <span>全局排序模式：保存后将同步至当前筛选的门店和渠道。</span>
                  </div>
                )}

                {!isSorting && (
                  <div
                    className={`px-4 py-2.5 mx-2 rounded flex justify-between items-center cursor-pointer mb-1 ${activeCategoryId === 'all' ? 'bg-[#00C06B]/10 text-[#00C06B] font-bold' : 'text-[#666] hover:bg-gray-50'}`}
                    onClick={() => setActiveCategoryId('all')}
                  >
                    <div className="flex items-center">
                      <span className="w-1 h-1 rounded-full bg-[#00C06B] mr-2 opacity-0" />
                      <span className="text-sm">全部</span>
                    </div>
                  </div>
                )}

                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    draggable={isSorting}
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !isSorting && setActiveCategoryId(cat.id)}
                    className={`px-4 py-2.5 mx-2 rounded flex justify-between items-center mb-1 transition-all duration-200 ${isSorting ? 'cursor-move bg-white border border-dashed border-[#CCC] hover:border-[#00C06B] shadow-sm' : 'cursor-pointer border border-transparent'} ${!isSorting && activeCategoryId === cat.id ? 'bg-[#00C06B]/10 text-[#00C06B] font-bold' : (!isSorting ? 'text-[#666] hover:bg-gray-50' : 'text-[#333]')} ${draggedIdx === idx ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}`}
                  >
                    <div className="flex items-center overflow-hidden">
                      {isSorting && <GripVertical size={14} className="text-[#999] mr-2 flex-shrink-0" />}
                      <span className="text-sm truncate max-w-[120px]" title={cat.name}>{cat.name}</span>
                    </div>
                    {!isSorting && <Eye size={14} className="text-[#999] hover:text-[#333] flex-shrink-0" />}
                  </div>
                ))}
              </div>

              {isSorting && (
                <div className="p-3 border-t border-[#E8E8E8] flex justify-between space-x-2 bg-[#F7F8FA]">
                  <button onClick={() => setIsSorting(false)} className="flex-1 py-1.5 border border-[#E8E8E8] text-[#666] text-xs rounded hover:bg-white transition-colors bg-white">取消</button>
                  <button onClick={saveCategorySort} className="flex-1 py-1.5 bg-[#00C06B] text-white text-xs rounded font-bold hover:bg-[#00A35B] transition-colors">保存</button>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
            <div className="flex-1 overflow-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1180px]">
                <thead className="sticky top-0 bg-[#F7F8FA] z-10 text-xs font-bold text-[#333]">
                  <tr>
                    <th className="w-12 py-3 pl-5 border-b border-[#E8E8E8]"><input type="checkbox" className="rounded border-gray-300" /></th>
                    <th className="py-3 px-4 border-b border-[#E8E8E8] w-16">排序</th>
                    <th className="py-3 px-4 border-b border-[#E8E8E8]">商品名称</th>
                    <th className="py-3 px-4 border-b border-[#E8E8E8] w-24">商品类型</th>
                    <th className="py-3 px-4 border-b border-[#E8E8E8]">前台分类</th>
                    <th className="py-3 px-4 border-b border-[#E8E8E8] w-32">门店名称</th>
                    <th className="py-3 px-4 border-b border-[#E8E8E8] w-[220px]">{activeTabId === 'all' ? '投放渠道' : '渠道'}</th>
                    <th className="py-3 px-4 border-b border-[#E8E8E8] w-24">库存状态</th>
                    <th className="sticky right-0 py-3 px-4 border-b border-[#E8E8E8] w-48 text-center bg-[#F7F8FA] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#333]">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC] transition-colors group">
                      <td className="py-4 pl-5"><input type="checkbox" className="rounded border-gray-300" /></td>
                      <td className="py-4 px-4 text-[#666]">{product.sortIndex}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-start">
                          <div className="relative mr-3">
                            <img src={product.image} className="w-10 h-10 rounded object-cover border border-[#EEE]" alt={product.name} />
                          </div>
                          <div>
                            <div className="flex items-center mb-1">
                              <span className="font-bold text-[#333] mr-2">{product.name}</span>
                            </div>
                            <div className="flex gap-1 mb-1">
                              {product.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-1 rounded border border-[#E8E8E8] text-[#999]">{tag}</span>
                              ))}
                            </div>
                            <div className="text-[11px] text-[#999] font-mono">{product.baseProductId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#666]">{product.type === 'Standard' ? '标准商品' : '套餐商品'}</td>
                      <td className="py-4 px-4 text-[#666] max-w-[180px] truncate" title={product.category}>{product.category}</td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#333]">{product.storeName}</div>
                        <div className="text-[11px] text-[#999]">{product.storeId.toUpperCase()}</div>
                      </td>
                      <td className="py-4 px-4">
                        {activeTabId === 'all' ? (
                          <div className="flex flex-wrap gap-1.5">
                            {product.channels.map(ch => {
                              const def = CHANNEL_DEFS[ch];
                              return def ? (
                                <div key={ch} className={`px-1.5 py-0.5 rounded-[4px] flex items-center text-[10px] font-bold ${def.color}`}>
                                  {def.label}
                                </div>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <div className="text-[#333]">{CHANNEL_DEFS[activeTabId]?.label || activeTabId}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold ${product.stockStatus === 'normal' ? 'bg-[#F0FDF4] text-[#15803D]' : product.stockStatus === 'low' ? 'bg-[#FFF7ED] text-[#C2410C]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                          {product.stockStatus === 'normal' ? `库存 ${product.stockCount}` : product.stockStatus === 'low' ? `库存紧张 ${product.stockCount}` : '已售罄'}
                        </div>
                      </td>
                      <td className="sticky right-0 py-4 px-4 text-center bg-white group-hover:bg-[#F9FFFC] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">
                        <div className="flex items-center justify-center space-x-3 text-sm">
                          <button onClick={() => handleAction(product, 'shelf')} className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline">
                            {product.status === 'on_shelf' ? '下架' : '上架'}
                          </button>
                          <button onClick={() => handleAction(product, 'edit')} className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline">编辑</button>
                          <button onClick={() => handleAction(product, 'stock')} className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline">沽清</button>
                          <div className="h-3 w-px bg-gray-300" />
                          <button className="text-[#999] hover:text-[#333]"><MoreHorizontal size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-[#999]">暂无商品数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="h-12 border-t border-[#E8E8E8] flex items-center justify-end px-5 text-xs text-[#666] bg-white shrink-0">
              <span className="mr-4">共 {filteredProducts.length} 条</span>
              <div className="flex items-center mr-4">
                <span className="mr-2">20条/页</span>
                <ChevronDown size={14} />
              </div>
              <div className="flex items-center space-x-1">
                <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B] disabled:opacity-50"><ChevronLeft size={12} /></button>
                <button className="w-6 h-6 flex items-center justify-center bg-[#00C06B] text-white rounded font-bold">1</button>
                <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">2</button>
                <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">3</button>
                <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">...</button>
                <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]"><ChevronRight size={12} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCoveragePage = () => (
    <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4">
      {renderNotification()}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
        <div className="px-5 py-4 border-b border-[#E8E8E8] bg-white space-y-4 shrink-0">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterInputControlled label="商品名称" placeholder="请输入商品名称/ID/系列" value={coverageKeyword} onChange={setCoverageKeyword} widthClass="w-[240px]" />
            <FilterNativeSelect
              label="前台分类"
              value={coverageCategoryId}
              onChange={setCoverageCategoryId}
              options={MOCK_CATEGORIES.map(category => ({ value: category.id, label: category.name }))}
              widthClass="w-[200px]"
            />
            <FilterNativeSelect
              label="商品类型"
              value={coverageType}
              onChange={(value) => setCoverageType(value as 'all' | 'Standard' | 'Combo')}
              options={[
                { value: 'all', label: '全部' },
                { value: 'Standard', label: '标准商品' },
                { value: 'Combo', label: '套餐商品' },
              ]}
              widthClass="w-[200px]"
            />
            <FilterNativeSelect
              label="售卖渠道"
              value={coverageChannelId}
              onChange={setCoverageChannelId}
              options={[{ value: 'all', label: '全部渠道' }, ...DEFAULT_CHANNELS.map(channel => ({ value: channel.id, label: channel.label }))]}
              widthClass="w-[220px]"
            />
            <FilterStoreSelect label="查看门店" options={STORE_OPTIONS} value={coverageStoreId} onChange={setCoverageStoreId} />
            <button className="h-[34px] px-6 border border-[#E8E8E8] text-[#333] rounded text-xs hover:bg-gray-50 transition-colors">重置</button>
            <button className="h-[34px] px-6 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] transition-colors">查询</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <CoverageStatCard title="涉及门店" value={`${coverageStats.totalStores}`} desc="当前筛选结果覆盖的门店数" accent="blue" />
            <CoverageStatCard title="已上架商品" value={`${coverageStats.onShelfProducts}`} desc="至少有一个门店在售的商品" accent="green" tooltip="商品在至少一个门店存在可售渠道时，记为已上架商品。" />
            <CoverageStatCard title="有下架商品" value={`${coverageStats.offShelfProducts}`} desc="仍存在下架门店的商品" accent="orange" tooltip="商品在某门店所有渠道均下架时，该门店记为下架门店；存在这类门店的商品记为有下架商品。" />
            <CoverageStatCard title="有售罄商品" value={`${coverageStats.soldOutProducts}`} desc="存在售罄门店的商品" accent="red" tooltip="商品在某门店所有渠道均售罄时，该门店记为售罄门店；存在这类门店的商品记为有售罄商品。" />
          </div>
        </div>

        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1140px]">
            <thead className="sticky top-0 bg-[#F7F8FA] z-10 text-xs font-bold text-[#333]">
              <tr>
                <th className="py-3 px-5 border-b border-[#E8E8E8]">商品名称</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-24">商品类型</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]">前台分类</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]">覆盖门店</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]"><LabelWithTip label="上架门店" tip="商品在门店至少有一个渠道上架时，记为上架门店。" /></th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]"><LabelWithTip label="下架门店" tip="商品在门店所有渠道均下架时，记为下架门店。" /></th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]"><LabelWithTip label="售罄门店" tip="商品在门店所有渠道均售罄时，记为售罄门店。" /></th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-[240px]">覆盖渠道</th>
                <th className="sticky right-0 py-3 px-4 border-b border-[#E8E8E8] w-32 text-center bg-[#F7F8FA] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {coverageRows.map(item => (
                <tr key={item.baseProductId} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC] transition-colors group">
                  <td className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover border border-[#EEE]" />
                      <div className="min-w-0">
                        <div className="font-bold text-[#333] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#999] font-mono mt-1">{item.baseProductId}</div>
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {item.tags.map(tag => (
                              <span key={tag} className="text-[10px] px-1 rounded border border-[#E8E8E8] text-[#999]">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#666]">{item.type === 'Standard' ? '标准商品' : '套餐商品'}</td>
                  <td className="py-4 px-4 text-[#666]">{item.category}</td>
                  <td className="py-4 px-4">
                    <button onClick={() => onOpenManageProduct?.({ keyword: item.baseProductId })} className="font-bold text-[#00C06B] hover:underline">{item.storeCount} 家门店</button>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex rounded-full px-2 py-1 text-[11px] font-bold bg-[#F0FDF4] text-[#15803D]">
                      {item.onShelfStoreCount} 家
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${item.offShelfStoreCount === 0 ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FFF7ED] text-[#C2410C]'}`}>
                      {item.offShelfStoreCount} 家
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${item.soldOutStoreCount === 0 ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                      {item.soldOutStoreCount} 家
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {item.channelIds.map(ch => {
                        const def = CHANNEL_DEFS[ch];
                        return def ? (
                          <span key={ch} className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold ${def.color}`}>
                            {def.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="sticky right-0 py-4 px-4 bg-white group-hover:bg-[#F9FFFC] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">
                    <div className="flex items-center justify-center text-sm">
                      <button onClick={() => onOpenManageProduct?.({ keyword: item.baseProductId })} className="text-[#00C06B] font-medium hover:underline">查看明细</button>
                    </div>
                  </td>
                </tr>
              ))}
              {coverageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#999]">暂无售卖门店数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="h-12 border-t border-[#E8E8E8] flex items-center justify-between px-5 text-xs text-[#666] bg-white shrink-0">
          <div className="flex items-center gap-2 text-[#666]">
            <PackageOpen size={13} />
            <span>支持按商品名称、前台分类、门店、渠道查看品牌下商品在哪些门店售卖及对应状态。</span>
          </div>
          <div className="flex items-center space-x-1">
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B] disabled:opacity-50"><ChevronLeft size={12} /></button>
            <button className="w-6 h-6 flex items-center justify-center bg-[#00C06B] text-white rounded font-bold">1</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]"><ChevronRight size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  );

  return mode === 'coverage' ? renderCoveragePage() : renderManagePage();
};

const FilterInput = ({ label, placeholder }: { label: string; placeholder: string }) => (
  <div className="flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white hover:border-[#00C06B] transition-colors w-[200px]">
    <span className="text-xs text-[#666] mr-2 whitespace-nowrap">{label}:</span>
    <input className="flex-1 text-xs outline-none min-w-0" placeholder={placeholder} />
  </div>
);

const FilterSelect = ({ label, placeholder, canClear }: { label: string; placeholder: string; canClear?: boolean }) => (
  <div className="flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white hover:border-[#00C06B] transition-colors cursor-pointer w-[200px] group">
    <span className="text-xs text-[#666] mr-2 whitespace-nowrap">{label}:</span>
    <span className={`flex-1 text-xs truncate ${placeholder === '全部商品' ? 'text-[#333]' : 'text-[#999] group-hover:text-[#666]'}`}>{placeholder}</span>
    {canClear && placeholder !== '请选择' ? <X size={12} className="text-[#999] hover:text-red-500" /> : <ChevronDown size={12} className="text-[#999] group-hover:text-[#00C06B]" />}
  </div>
);

const FilterStoreSelect = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white transition-colors w-[220px]">
    <span className="text-xs text-[#666] mr-2 whitespace-nowrap">{label}:</span>
    <select value={value} onChange={e => onChange(e.target.value)} className="flex-1 text-xs bg-transparent outline-none text-[#333]">
      {options.map(option => (
        <option key={option.id} value={option.id}>{option.name}</option>
      ))}
    </select>
  </div>
);

const FilterInputControlled = ({
  label,
  placeholder,
  value,
  onChange,
  widthClass,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  widthClass?: string;
}) => (
  <div className={`flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white transition-colors ${widthClass || 'w-[240px]'}`}>
    <span className="text-xs text-[#666] mr-2 whitespace-nowrap">{label}:</span>
    <input value={value} onChange={e => onChange(e.target.value)} className="flex-1 text-xs bg-transparent outline-none text-[#333] min-w-0" placeholder={placeholder} />
  </div>
);

const FilterNativeSelect = ({
  label,
  value,
  onChange,
  options,
  widthClass,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  widthClass?: string;
}) => (
  <div className={`flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white transition-colors ${widthClass || 'w-[220px]'}`}>
    <span className="text-xs text-[#666] mr-2 whitespace-nowrap">{label}:</span>
    <select value={value} onChange={e => onChange(e.target.value)} className="flex-1 text-xs bg-transparent outline-none text-[#333]">
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

const CoverageStatCard = ({
  title,
  value,
  desc,
  accent,
  tooltip,
}: {
  title: string;
  value: string;
  desc: string;
  accent: 'green' | 'blue' | 'orange' | 'red';
  tooltip?: string;
}) => {
  const accentClass = {
    green: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]',
    blue: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]',
    orange: 'border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]',
    red: 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]',
  }[accent];

  return (
    <div className={`rounded-2xl border px-4 py-4 ${accentClass}`}>
      <div className="text-xs font-bold opacity-80">
        {tooltip ? <LabelWithTip label={title} tip={tooltip} /> : title}
      </div>
      <div className="mt-3 text-2xl font-black">{value}</div>
      <div className="mt-2 text-xs opacity-80">{desc}</div>
    </div>
  );
};

const LabelWithTip = ({ label, tip }: { label: string; tip: string }) => (
  <span className="inline-flex items-center gap-1">
    <span>{label}</span>
    <span className="group relative inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-current/30 text-[10px] leading-none opacity-70">
      ?
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-lg bg-[#1F2129] px-3 py-2 text-left text-[11px] font-medium leading-5 text-white shadow-xl group-hover:block">
        {tip}
      </span>
    </span>
  </span>
);

const MiniStatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-[#E8E8E8] bg-white px-4 py-3">
    <div className="text-xs text-[#666]">{label}</div>
    <div className="mt-2 text-xl font-bold text-[#333]">{value}</div>
  </div>
);
