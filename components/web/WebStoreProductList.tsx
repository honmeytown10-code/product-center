import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, ChevronDown, MoreHorizontal, FileUp,
  Printer, Smartphone, Store, ShoppingBag, ChevronLeft,
  ChevronRight, CheckCircle2, X, Link, Layers, Eye, GripVertical,
  ArrowUpDown, PackageOpen, Bike, UtensilsCrossed, Download,
  FileSpreadsheet, Loader2, Settings
} from 'lucide-react';
import { useProducts } from '../../context';
import { ShelfChannelId, WebShelfConfirmModal, getShelfChannelLabel } from './WebShelfConfirmModal';
import { StockoutSpec, WebStockoutModal } from './WebStockoutModal';

type StoreProductPageMode = 'manage' | 'coverage';
type StoreProductManagePreset = {
  keyword?: string;
  channelId?: string;
};

export type StoreProductRecord = {
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
  isMultiSpec?: boolean;
  specs?: StockoutSpec[];
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
  storeDetails: Array<{
    storeId: string;
    storeName: string;
    status: 'on_shelf' | 'off_shelf';
    stockStatus: 'normal' | 'low' | 'empty';
  }>;
  lastSync: string;
};

type CoverageStoreDetail = {
  baseProductId: string;
  channelId: string;
  title: string;
  type: 'all' | 'on_shelf' | 'off_shelf' | 'sold_out';
  stores: Array<{
    storeId: string;
    storeName: string;
    status: 'on_shelf' | 'off_shelf';
    stockStatus: 'normal' | 'low' | 'empty';
  }>;
};

type CoverageStatusFilter = 'all' | 'has_on_shelf_store' | 'has_off_shelf_store' | 'has_sold_out_store';

type StoreBusinessStatus = 'operating' | 'closed';

type StoreOption = {
  id: string;
  name: string;
  businessStatus?: StoreBusinessStatus;
};

const STORE_OPTIONS: StoreOption[] = [
  { id: 'all', name: '全部门店' },
  { id: 's1', name: '南山万象店', businessStatus: 'operating' },
  { id: 's2', name: '福田卓悦店', businessStatus: 'operating' },
  { id: 's3', name: '宝安壹方城店', businessStatus: 'closed' },
  { id: 's4', name: '龙华红山店', businessStatus: 'closed' },
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
    channels: ['pos', 'mini_dine', 'mini_take', 'meituan', 'meituan_dine'],
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=100',
    tags: ['新品'],
    status: 'on_shelf',
    stockStatus: 'normal',
    stockCount: 128,
    isMultiSpec: false,
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
    isMultiSpec: true,
    specs: [
      { id: 's2-1', name: '标准杯', currentStock: 9999, remainStock: '0', nextDayStock: '9999', nextDayUnlimited: false },
      { id: 's2-2', name: '大杯', currentStock: 9999, remainStock: '0', nextDayStock: '9999', nextDayUnlimited: false },
      { id: 's2-3', name: '超大杯', currentStock: 9999, remainStock: '0', nextDayStock: '9999', nextDayUnlimited: false },
    ],
    lastSync: '25分钟前',
    sortIndex: 1,
  },
  {
    id: '974340414367182854-s3',
    baseProductId: '974340414367182854',
    name: '招牌珍珠奶茶',
    type: 'Standard',
    category: '奶茶系列',
    storeName: '宝安壹方城店',
    storeId: 's3',
    channels: ['mini_dine', 'meituan'],
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=100',
    tags: ['新品'],
    status: 'off_shelf',
    stockStatus: 'empty',
    stockCount: 0,
    isMultiSpec: false,
    lastSync: '12分钟前',
    sortIndex: 2,
  },
  {
    id: '974340414367182854-s4',
    baseProductId: '974340414367182854',
    name: '招牌珍珠奶茶',
    type: 'Standard',
    category: '奶茶系列',
    storeName: '龙华红山店',
    storeId: 's4',
    channels: ['mini_dine', 'mini_take'],
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=100',
    tags: ['新品'],
    status: 'on_shelf',
    stockStatus: 'empty',
    stockCount: 0,
    isMultiSpec: false,
    lastSync: '8分钟前',
    sortIndex: 3,
  },
  {
    id: '924336445413220352-s2',
    baseProductId: '924336445413220352',
    name: '海盐芝士拿铁',
    type: 'Standard',
    category: '咖啡系列',
    storeName: '福田卓悦店',
    storeId: 's2',
    channels: ['pos', 'mini_dine', 'mini_take', 'meituan', 'taobao', 'douyin_dine'],
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=100',
    tags: ['热销'],
    status: 'on_shelf',
    stockStatus: 'normal',
    stockCount: 76,
    isMultiSpec: false,
    lastSync: '5分钟前',
    sortIndex: 1,
  },
  {
    id: '924336445413220352-s1',
    baseProductId: '924336445413220352',
    name: '海盐芝士拿铁',
    type: 'Standard',
    category: '咖啡系列',
    storeName: '南山万象店',
    storeId: 's1',
    channels: ['mini_dine', 'pos'],
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=100',
    tags: ['热销'],
    status: 'off_shelf',
    stockStatus: 'normal',
    stockCount: 56,
    isMultiSpec: false,
    lastSync: '16分钟前',
    sortIndex: 2,
  },
  {
    id: '924336445413220352-s3',
    baseProductId: '924336445413220352',
    name: '海盐芝士拿铁',
    type: 'Standard',
    category: '咖啡系列',
    storeName: '宝安壹方城店',
    storeId: 's3',
    channels: ['mini_dine', 'taobao'],
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=100',
    tags: ['热销'],
    status: 'on_shelf',
    stockStatus: 'empty',
    stockCount: 0,
    isMultiSpec: false,
    lastSync: '6分钟前',
    sortIndex: 3,
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
    isMultiSpec: false,
    lastSync: '2小时前',
    sortIndex: 1,
  },
  {
    id: '934501236899667968-s1',
    baseProductId: '934501236899667968',
    name: '多肉葡萄',
    type: 'Standard',
    category: '果茶系列',
    storeName: '南山万象店',
    storeId: 's1',
    channels: ['mini_dine', 'eleme'],
    image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd71?auto=format&fit=crop&q=80&w=100',
    tags: [],
    status: 'on_shelf',
    stockStatus: 'normal',
    stockCount: 38,
    isMultiSpec: false,
    lastSync: '22分钟前',
    sortIndex: 2,
  },
  {
    id: '934501236899667968-s2',
    baseProductId: '934501236899667968',
    name: '多肉葡萄',
    type: 'Standard',
    category: '果茶系列',
    storeName: '福田卓悦店',
    storeId: 's2',
    channels: ['mini_dine', 'mini_take'],
    image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd71?auto=format&fit=crop&q=80&w=100',
    tags: [],
    status: 'off_shelf',
    stockStatus: 'empty',
    stockCount: 0,
    isMultiSpec: false,
    lastSync: '18分钟前',
    sortIndex: 3,
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
    isMultiSpec: true,
    specs: [
      { id: 's4-1', name: '规格1', currentStock: 9999, remainStock: '0', nextDayStock: '9999', nextDayUnlimited: false },
      { id: 's4-2', name: '规格2', currentStock: 9999, remainStock: '0', nextDayStock: '9999', nextDayUnlimited: false },
      { id: 's4-3', name: '规格3', currentStock: 9999, remainStock: '0', nextDayStock: '9999', nextDayUnlimited: false },
    ],
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
    isMultiSpec: false,
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

const CHANNEL_DEFS: Record<string, {
  label: string;
  shortLabel: string;
  activeClass: string;
  icon: React.ReactNode;
}> = {
  mini_dine: {
    label: '小程序-堂食',
    shortLabel: '堂',
    activeClass: 'bg-[#FDEBD8] text-[#F59E0B]',
    icon: <Store size={16} strokeWidth={2.4} />,
  },
  mini_take: {
    label: '小程序-外卖',
    shortLabel: '外',
    activeClass: 'bg-[#DDF5D8] text-[#84CC16]',
    icon: <Bike size={16} strokeWidth={2.4} />,
  },
  pos: {
    label: 'POS',
    shortLabel: 'POS',
    activeClass: 'bg-[#DDEEFF] text-[#3B82F6]',
    icon: <span className="text-[10px] font-black leading-none">POS</span>,
  },
  meituan: {
    label: '美团-外卖',
    shortLabel: '美',
    activeClass: 'bg-[#FCE9B9] text-[#EAB308]',
    icon: <UtensilsCrossed size={16} strokeWidth={2.4} />,
  },
  meituan_tuangou: {
    label: '美团-团购',
    shortLabel: '团',
    activeClass: 'bg-[#E0E7FF] text-[#4F46E5]',
    icon: <span className="text-[10px] font-black leading-none">团</span>,
  },
  meituan_dine: {
    label: '美团在线点',
    shortLabel: '点',
    activeClass: 'bg-[#FFF1CC] text-[#B77900]',
    icon: <span className="text-[10px] font-black leading-none">点</span>,
  },
  douyin_dine: {
    label: '抖音在线点',
    shortLabel: '抖',
    activeClass: 'bg-[#E9E7FF] text-[#5B4BC4]',
    icon: <span className="text-[10px] font-black leading-none">抖</span>,
  },
  taobao: {
    label: '淘宝闪购',
    shortLabel: '淘',
    activeClass: 'bg-[#FF7A18] text-white',
    icon: <ShoppingBag size={16} strokeWidth={2.4} />,
  },
  eleme: {
    label: '饿了么',
    shortLabel: '饿',
    activeClass: 'bg-[#E0F2FE] text-[#0284C7]',
    icon: <span className="text-[10px] font-black leading-none">饿</span>,
  },
};

const DEFAULT_CHANNELS = [
  { id: 'mini_dine', label: '小程序-堂食' },
  { id: 'mini_take', label: '小程序-外卖' },
  { id: 'meituan', label: '美团-外卖' },
  { id: 'meituan_tuangou', label: '美团-团购' },
  { id: 'taobao', label: '淘宝闪购' },
  { id: 'meituan_dine', label: '美团在线点' },
  { id: 'douyin_dine', label: '抖音在线点' },
  { id: 'pos', label: 'POS' },
];

const COVERAGE_CHANNEL_OPTIONS = Array.from(
  new Set([...DEFAULT_CHANNELS.map(channel => channel.id), ...Object.keys(CHANNEL_DEFS)])
).map(channelId => ({
  id: channelId,
  label: CHANNEL_DEFS[channelId]?.label || channelId,
}));

const DEFAULT_COVERAGE_CHANNEL_ID = COVERAGE_CHANNEL_OPTIONS[0]?.id || 'mini_dine';

export const WebStoreProductList: React.FC<{
  mode?: StoreProductPageMode;
  managePreset?: StoreProductManagePreset | null;
  onOpenManageProduct?: (preset: StoreProductManagePreset) => void;
  onEditProduct?: (product: StoreProductRecord, channelId: string) => void;
}> = ({ mode = 'manage', managePreset = null, onOpenManageProduct, onEditProduct }) => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = brandConfigs[activeBrandId];
  const enableGrouping = config?.enableChannelGrouping ?? false;
  const groups = config?.channelGroups || [];
  const isShelvesUnited = config?.features.shelves_unite ?? false;
  const isStockShared = config?.features.stock_shared ?? false;
  const [storeProducts, setStoreProducts] = useState<StoreProductRecord[]>(MOCK_STORE_PRODUCTS);

  const [activeTabId, setActiveTabId] = useState('all');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [activeStoreId, setActiveStoreId] = useState('all');
  const [manageKeyword, setManageKeyword] = useState(managePreset?.keyword || '');
  const [coverageKeyword, setCoverageKeyword] = useState('');
  const [coverageCategoryId, setCoverageCategoryId] = useState('all');
  const [coverageType, setCoverageType] = useState<'all' | 'Standard' | 'Combo'>('all');
  const [coverageChannelId, setCoverageChannelId] = useState(DEFAULT_COVERAGE_CHANNEL_ID);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success'; subMessage?: string } | null>(null);
  const [shelfDialog, setShelfDialog] = useState<StoreProductRecord | null>(null);
  const [stockDialog, setStockDialog] = useState<StoreProductRecord | null>(null);
  const [categories, setCategories] = useState(MOCK_CATEGORIES.filter(c => c.id !== 'all'));
  const [isSorting, setIsSorting] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [coverageStoreDetail, setCoverageStoreDetail] = useState<CoverageStoreDetail | null>(null);
  const [coverageStatusFilter, setCoverageStatusFilter] = useState<CoverageStatusFilter>('all');
  const [showExportModal, setShowExportModal] = useState(false);

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
      setActiveTabId(managePreset?.channelId || 'all');
    }
  }, [managePreset, mode]);

  const tabs = useMemo(() => [{ id: 'all', label: '全部渠道' }, ...DEFAULT_CHANNELS], []);

  const filteredProducts = useMemo(() => {
    let filtered = storeProducts;
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
  }, [storeProducts, activeStoreId, activeTabId, activeCategoryId, manageKeyword]);

  const coverageSourceRows = useMemo(() => {
    const normalizedKeyword = coverageKeyword.trim().toLowerCase();
    return storeProducts.filter(product => {
      if (coverageType !== 'all' && product.type !== coverageType) {
        return false;
      }
      if (coverageCategoryId !== 'all') {
        const categoryName = MOCK_CATEGORIES.find(c => c.id === coverageCategoryId)?.name;
        if (!product.category.includes(categoryName || '')) {
          return false;
        }
      }
      if (!product.channels.includes(coverageChannelId)) {
        return false;
      }
      if (normalizedKeyword) {
        const matchedText = `${product.name} ${product.baseProductId} ${product.category}`.toLowerCase();
        if (!matchedText.includes(normalizedKeyword)) {
          return false;
        }
      }
      return true;
    });
  }, [storeProducts, coverageKeyword, coverageCategoryId, coverageType, coverageChannelId]);

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
          storeDetails: items.map(item => ({
            storeId: item.storeId,
            storeName: item.storeName,
            status: item.status,
            stockStatus: item.stockStatus,
          })),
          lastSync: items[0].lastSync,
        };
      })
      .sort((a, b) => {
        if (b.storeCount !== a.storeCount) return b.storeCount - a.storeCount;
        return a.name.localeCompare(b.name, 'zh-CN');
      });
  }, [coverageSourceRows]);

  const filteredCoverageRows = useMemo(() => {
    return coverageRows.filter(item => {
      if (coverageStatusFilter === 'has_on_shelf_store') return item.onShelfStoreCount > 0;
      if (coverageStatusFilter === 'has_off_shelf_store') return item.offShelfStoreCount > 0;
      if (coverageStatusFilter === 'has_sold_out_store') return item.soldOutStoreCount > 0;
      return true;
    });
  }, [coverageRows, coverageStatusFilter]);

  const coverageStats = useMemo(() => {
    return {
      onShelfProducts: coverageRows.filter(item => item.onShelfStoreCount > 0).length,
      offShelfProducts: coverageRows.filter(item => item.offShelfStoreCount > 0).length,
      soldOutProducts: coverageRows.filter(item => item.soldOutStoreCount > 0).length,
    };
  }, [coverageRows]);

  const coverageFilterLabelMap: Record<CoverageStatusFilter, string> = {
    all: '全部商品',
    has_on_shelf_store: '上架商品',
    has_off_shelf_store: '下架商品',
    has_sold_out_store: '售罄商品',
  };

  const showCategoryPanel = mode === 'manage' && activeStoreId !== 'all';

  const handleAction = (product: StoreProductRecord, action: 'shelf' | 'stock' | 'edit') => {
    if (action === 'edit') {
      onEditProduct?.(product, activeTabId);
      if (onEditProduct) return;
      setNotification({ type: 'info', message: `打开 ${product.storeName} 的商品编辑页` });
      return;
    }

    if (action === 'shelf') {
      setShelfDialog(product);
      return;
    }

    if (action === 'stock') {
      setStockDialog(product);
      return;
    }
  };

  const openCoverageStoreDetail = (
    item: StoreProductCoverageSummary,
    type: 'all' | 'on_shelf' | 'off_shelf' | 'sold_out'
  ) => {
    const scopedStores = item.storeDetails.filter(store => {
      if (type === 'on_shelf') return store.status === 'on_shelf';
      if (type === 'off_shelf') return store.status !== 'on_shelf';
      if (type === 'sold_out') return store.stockStatus === 'empty';
      return true;
    });

    const titleMap = {
      all: '覆盖门店',
      on_shelf: '上架门店',
      off_shelf: '下架门店',
      sold_out: '售罄门店',
    } as const;

    const currentChannelLabel = CHANNEL_DEFS[coverageChannelId]?.label || coverageChannelId;

    setCoverageStoreDetail({
      baseProductId: item.baseProductId,
      channelId: coverageChannelId,
      title: `${item.name} - ${currentChannelLabel} - ${titleMap[type]}`,
      type,
      stores: scopedStores,
    });
  };

  const handleCoverageStoreQuickAction = (
    detail: CoverageStoreDetail,
    targetStore: CoverageStoreDetail['stores'][number]
  ) => {
    const action =
      detail.type === 'sold_out'
        ? 'restore_stock'
        : detail.type === 'off_shelf'
          ? 'on_shelf'
          : detail.type === 'on_shelf'
            ? 'off_shelf'
            : targetStore.stockStatus === 'empty'
              ? 'restore_stock'
              : targetStore.status === 'off_shelf'
                ? 'on_shelf'
                : 'off_shelf';

    setStoreProducts(prev => prev.map(product => {
      if (
        product.baseProductId !== detail.baseProductId ||
        product.storeId !== targetStore.storeId ||
        !product.channels.includes(detail.channelId)
      ) {
        return product;
      }

      if (action === 'restore_stock') {
        return {
          ...product,
          status: 'on_shelf',
          stockStatus: 'normal',
          stockCount: product.stockCount > 0 ? product.stockCount : 99,
          lastSync: '刚刚',
        };
      }

      if (action === 'on_shelf') {
        return {
          ...product,
          status: 'on_shelf',
          stockStatus: product.stockStatus === 'empty' ? 'normal' : product.stockStatus,
          stockCount: product.stockCount > 0 ? product.stockCount : 99,
          lastSync: '刚刚',
        };
      }

      return {
        ...product,
        status: 'off_shelf',
        lastSync: '刚刚',
      };
    }));

    const channelLabel = CHANNEL_DEFS[detail.channelId]?.label || detail.channelId;
    const message =
      action === 'restore_stock'
        ? `${targetStore.storeName} 已恢复库存`
        : action === 'on_shelf'
          ? `${targetStore.storeName} 已上架`
          : `${targetStore.storeName} 已下架`;

    setNotification({
      type: 'success',
      message,
      subMessage: `已更新 ${channelLabel} 渠道下的门店商品状态`,
    });

    setCoverageStoreDetail(null);
  };

  const handleShelfConfirm = (payload: { action: 'on_shelf' | 'off_shelf'; channels: ShelfChannelId[] }) => {
    if (!shelfDialog) return;

    const actionLabel = payload.action === 'on_shelf' ? '上架' : '下架';
    const selectedNames = payload.channels.map(channelId => getShelfChannelLabel(channelId)).join('、');

    if (activeTabId === 'all') {
      setNotification({
        type: 'success',
        message: isShelvesUnited ? `已统一${actionLabel}全部渠道商品` : `已${actionLabel}所选渠道商品`,
        subMessage: isShelvesUnited
          ? '状态会同步到美饿平台'
          : `已操作渠道：${selectedNames || '未选择渠道'}`,
      });
    } else {
      setNotification({
        type: isShelvesUnited ? 'info' : 'success',
        message: isShelvesUnited
          ? `已统一${actionLabel}全部渠道商品`
          : `${getShelfChannelLabel(activeTabId)} ${actionLabel}成功`,
        subMessage: isShelvesUnited ? '状态会同步到美饿平台' : undefined,
      });
    }

    setShelfDialog(null);
  };

  const handleStockConfirm = (payload: {
    type: 'day' | 'long';
    channels: ShelfChannelId[];
    remainStock: string;
    nextDayUnlimited: boolean;
    nextDayStock: string;
    specs: StockoutSpec[];
  }) => {
    if (!stockDialog) return;
    const channelNames = payload.channels.map(channelId => getShelfChannelLabel(channelId)).join('、');
    setNotification({
      type: isStockShared ? 'info' : 'success',
      message: `${stockDialog.name} 沽清设置已保存`,
      subMessage: isStockShared
        ? `已同步更新所有选中渠道库存：${channelNames}`
        : `已应用至渠道：${channelNames}`,
    });
    setStockDialog(null);
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
    <div className="pc-page flex min-w-0 flex-1 overflow-hidden bg-[#F0F2F5] p-3 font-sans">
      {renderNotification()}
      <div className="pc-surface flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <div className="p-5 border-b border-[#E8E8E8] bg-white space-y-4 shrink-0 z-20">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterInput label="商品ID" placeholder="请输入" />
            <FilterInput label="SKUID" placeholder="请输入" />
            <FilterStoreSelect label="机构门店" options={STORE_OPTIONS} value={activeStoreId} onChange={setActiveStoreId} />
            <FilterSelect label="商品类型" placeholder="请选择" />
            <FilterSelect label="售卖状态" placeholder="全部" canClear />
            <FilterSelect label="库存状态" placeholder="请选择" canClear />
            <button onClick={() => setNotification({ type: 'info', message: '当前页面已展示全部可用筛选条件' })} className="h-[34px] px-3 border border-dashed border-[#AAA] text-[#666] rounded hover:border-[#00C06B] hover:text-[#00C06B] transition-colors text-xs flex items-center bg-white">
              <Plus size={14} className="mr-1" /> 添加筛选
            </button>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center flex-wrap gap-3">
              <button onClick={() => setNotification({ type: 'success', message: '门店商品快捷筛选已保存' })} className="flex items-center text-xs text-[#666] border border-[#E8E8E8] px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
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
              <button onClick={() => { setActiveStoreId('all'); setManageKeyword(''); setActiveTabId('all'); setActiveCategoryId('all'); }} className="px-6 py-1.5 border border-[#E8E8E8] text-[#333] rounded text-xs hover:bg-gray-50 transition-colors">重置</button>
              <button onClick={() => setNotification({ type: 'success', message: `已查询到 ${filteredProducts.length} 个门店商品` })} className="px-6 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">查询</button>
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
            <button onClick={() => setIsSorting(true)} className="flex items-center px-3 py-1.5 border border-[#E8E8E8] rounded text-xs text-[#333] hover:bg-gray-50 font-medium">
              <ArrowUpDown size={14} className="mr-1.5 text-[#666]" /> 排序管理
            </button>
            <button onClick={() => setShowExportModal(true)} className="flex items-center px-4 py-1.5 border border-[#E8E8E8] rounded text-xs text-[#333] hover:border-[#00C06B] hover:text-[#00C06B] hover:bg-[#00C06B]/5 font-medium transition-colors">
              <Download size={14} className="mr-1.5" /> 导出
            </button>
            <button onClick={() => setNotification({ type: 'success', message: '门店商品日志已导出' })} className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">
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
              <table className="w-full text-left border-collapse min-w-[1240px]">
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
                    <th className="sticky right-0 w-[220px] min-w-[220px] whitespace-nowrap border-b border-[#E8E8E8] bg-[#F7F8FA] px-4 py-3 text-center shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">操作</th>
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
                            {product.channels.map(ch => renderCoverageChannelIcon(ch))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {renderCoverageChannelIcon(activeTabId)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold ${product.stockStatus === 'normal' ? 'bg-[#F0FDF4] text-[#15803D]' : product.stockStatus === 'low' ? 'bg-[#FFF7ED] text-[#C2410C]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                          {product.stockStatus === 'normal' ? `库存 ${product.stockCount}` : product.stockStatus === 'low' ? `库存紧张 ${product.stockCount}` : '已售罄'}
                        </div>
                      </td>
                      <td className="sticky right-0 w-[220px] min-w-[220px] whitespace-nowrap bg-white px-4 py-4 text-center shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)] group-hover:bg-[#F9FFFC]">
                        <div className="flex flex-nowrap items-center justify-center gap-3 whitespace-nowrap text-sm">
                          <button onClick={() => handleAction(product, 'shelf')} className="shrink-0 whitespace-nowrap text-[#00C06B] font-medium hover:text-[#008f53] hover:underline">
                            {activeTabId === 'all' ? '上下架' : product.status === 'on_shelf' ? '下架' : '上架'}
                          </button>
                          <button onClick={() => handleAction(product, 'edit')} className="shrink-0 whitespace-nowrap text-[#00C06B] font-medium hover:text-[#008f53] hover:underline">编辑</button>
                          <button onClick={() => handleAction(product, 'stock')} className="shrink-0 whitespace-nowrap text-[#00C06B] font-medium hover:text-[#008f53] hover:underline">沽清</button>
                          <div className="h-3 w-px shrink-0 bg-gray-300" />
                          <button aria-label="更多操作" title="更多操作" onClick={() => setNotification({ type: 'info', message: `${product.name}：可在编辑页维护分类、价格、售卖时间与渠道差异字段` })} className="shrink-0 text-[#999] hover:text-[#333]"><MoreHorizontal size={16} /></button>
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
                <button disabled className="w-6 h-6 flex items-center justify-center border rounded disabled:opacity-40"><ChevronLeft size={12} /></button>
                <button type="button" disabled aria-current="page" className="w-6 h-6 flex items-center justify-center bg-[#00C06B] text-white rounded font-bold">1</button>
                <button disabled className="w-6 h-6 flex items-center justify-center border rounded opacity-40">2</button>
                <button disabled className="w-6 h-6 flex items-center justify-center border rounded opacity-40">3</button>
                <button disabled className="w-6 h-6 flex items-center justify-center border rounded opacity-40">...</button>
                <button disabled className="w-6 h-6 flex items-center justify-center border rounded opacity-40"><ChevronRight size={12} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {shelfDialog && (
        <WebShelfConfirmModal
          entityLabel="商品"
          itemName={shelfDialog.name}
          availableChannels={shelfDialog.channels.filter((channel): channel is ShelfChannelId => Boolean(getShelfChannelLabel(channel))) as ShelfChannelId[]}
          channelStatuses={Object.fromEntries(
            shelfDialog.channels.map(channel => [channel, shelfDialog.status])
          ) as Partial<Record<ShelfChannelId, 'on_shelf' | 'off_shelf'>>}
          activeTabId={activeTabId}
          isShelvesUnited={isShelvesUnited}
          onClose={() => setShelfDialog(null)}
          onConfirm={handleShelfConfirm}
        />
      )}
      {stockDialog && (
        <WebStockoutModal
          itemName={stockDialog.name}
          entityLabel="商品"
          channels={stockDialog.channels.filter((channel): channel is ShelfChannelId => Boolean(getShelfChannelLabel(channel))) as ShelfChannelId[]}
          isStockShared={isStockShared}
          isMultiSpec={Boolean(stockDialog.isMultiSpec)}
          specs={stockDialog.specs}
          defaultRemainStock="0"
          defaultNextDayUnlimited={!isStockShared}
          onClose={() => setStockDialog(null)}
          onConfirm={handleStockConfirm}
        />
      )}
      {showExportModal && (
        <StoreProductExportModal
          activeChannelId={activeTabId}
          products={filteredProducts}
          stores={STORE_OPTIONS}
          channels={COVERAGE_CHANNEL_OPTIONS}
          onClose={() => setShowExportModal(false)}
          onViewDownloads={() => {
            setShowExportModal(false);
            setNotification({
              type: 'success',
              message: '下载任务已创建',
              subMessage: '文件正在生成，可前往右上角「下载」查看进度。',
            });
          }}
        />
      )}
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
              label="渠道"
              value={coverageChannelId}
              onChange={setCoverageChannelId}
              options={COVERAGE_CHANNEL_OPTIONS.map(channel => ({
                value: channel.id,
                label: channel.label,
              }))}
              widthClass="w-[220px]"
            />
            <button
              onClick={() => {
                setCoverageKeyword('');
                setCoverageCategoryId('all');
                setCoverageType('all');
                setCoverageChannelId(DEFAULT_COVERAGE_CHANNEL_ID);
                setCoverageStatusFilter('all');
              }}
              className="h-[34px] px-6 border border-[#E8E8E8] text-[#333] rounded text-xs hover:bg-gray-50 transition-colors"
            >
              重置
            </button>
            <button onClick={() => setNotification({ type: 'success', message: '门店覆盖数据已按当前条件刷新' })} className="h-[34px] px-6 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] transition-colors">查询</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CoverageStatCard
              title="上架商品"
              value={`${coverageStats.onShelfProducts}`}
              desc="商品在当前渠道存在上架门店"
              accent="green"
              tooltip="商品在当前所选渠道至少存在一个上架门店时，记为上架商品。"
              active={coverageStatusFilter === 'has_on_shelf_store'}
              onClick={() => setCoverageStatusFilter(prev => prev === 'has_on_shelf_store' ? 'all' : 'has_on_shelf_store')}
            />
            <CoverageStatCard
              title="下架商品"
              value={`${coverageStats.offShelfProducts}`}
              desc="商品在当前渠道存在下架门店"
              accent="orange"
              tooltip="商品在当前所选渠道至少存在一个下架门店时，记为下架商品。"
              active={coverageStatusFilter === 'has_off_shelf_store'}
              onClick={() => setCoverageStatusFilter(prev => prev === 'has_off_shelf_store' ? 'all' : 'has_off_shelf_store')}
            />
            <CoverageStatCard
              title="售罄商品"
              value={`${coverageStats.soldOutProducts}`}
              desc="商品在当前渠道存在售罄门店"
              accent="red"
              tooltip="商品在当前所选渠道至少存在一个售罄门店时，记为售罄商品。"
              active={coverageStatusFilter === 'has_sold_out_store'}
              onClick={() => setCoverageStatusFilter(prev => prev === 'has_sold_out_store' ? 'all' : 'has_sold_out_store')}
            />
          </div>
          {coverageStatusFilter !== 'all' && (
            <div className="flex items-center">
              <button
                onClick={() => setCoverageStatusFilter('all')}
                className="inline-flex items-center gap-2 rounded-full bg-[#F3FCF7] px-3 py-1.5 text-xs font-bold text-[#00A35B]"
              >
                当前筛选：{coverageFilterLabelMap[coverageStatusFilter]}
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1080px]">
            <thead className="sticky top-0 bg-[#F7F8FA] z-10 text-xs font-bold text-[#333]">
              <tr>
                <th className="py-3 px-5 border-b border-[#E8E8E8]">商品名称</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-24">商品类型</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]">前台分类</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]"><LabelWithTip label="覆盖门店" tip="商品在当前所选渠道覆盖的门店数。" /></th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]"><LabelWithTip label="上架门店" tip="商品在当前所选渠道状态为上架的门店数。" /></th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]"><LabelWithTip label="下架门店" tip="商品在当前所选渠道状态为下架的门店数。" /></th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]"><LabelWithTip label="售罄门店" tip="商品在当前所选渠道状态为售罄的门店数。" /></th>
                <th className="sticky right-0 w-32 min-w-[128px] whitespace-nowrap border-b border-[#E8E8E8] bg-[#F7F8FA] px-4 py-3 text-center shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {filteredCoverageRows.map(item => (
                <tr key={item.baseProductId} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC] transition-colors group">
                  <td className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover border border-[#EEE]" />
                      <div className="min-w-0">
                        <div className="font-bold text-[#333] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#999] font-mono mt-1">{item.baseProductId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#666]">{item.type === 'Standard' ? '标准商品' : '套餐商品'}</td>
                  <td className="py-4 px-4 text-[#666]">{item.category}</td>
                  <td className="py-4 px-4">
                    <button onClick={() => openCoverageStoreDetail(item, 'all')} className="font-bold text-[#00C06B] hover:underline">{item.storeCount} 家门店</button>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => item.onShelfStoreCount > 0 && openCoverageStoreDetail(item, 'on_shelf')}
                      disabled={item.onShelfStoreCount === 0}
                      className="inline-flex rounded-full px-2 py-1 text-[11px] font-bold bg-[#F0FDF4] text-[#15803D] disabled:cursor-default disabled:opacity-70"
                    >
                      {item.onShelfStoreCount} 家
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => item.offShelfStoreCount > 0 && openCoverageStoreDetail(item, 'off_shelf')}
                      disabled={item.offShelfStoreCount === 0}
                      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold disabled:cursor-default disabled:opacity-70 ${item.offShelfStoreCount === 0 ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FFF7ED] text-[#C2410C]'}`}
                    >
                      {item.offShelfStoreCount} 家
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => item.soldOutStoreCount > 0 && openCoverageStoreDetail(item, 'sold_out')}
                      disabled={item.soldOutStoreCount === 0}
                      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold disabled:cursor-default disabled:opacity-70 ${item.soldOutStoreCount === 0 ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}
                    >
                      {item.soldOutStoreCount} 家
                    </button>
                  </td>
                  <td className="sticky right-0 w-32 min-w-[128px] whitespace-nowrap bg-white px-4 py-4 group-hover:bg-[#F9FFFC] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">
                    <div className="flex flex-nowrap items-center justify-center whitespace-nowrap text-sm">
                      <button onClick={() => onOpenManageProduct?.({ keyword: item.baseProductId, channelId: coverageChannelId })} className="shrink-0 whitespace-nowrap text-[#00C06B] font-medium hover:underline">管理商品</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCoverageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#999]">暂无当前渠道商品数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="h-12 border-t border-[#E8E8E8] flex items-center justify-between px-5 text-xs text-[#666] bg-white shrink-0">
          <div className="flex items-center gap-2 text-[#666]">
            <PackageOpen size={13} />
            <span>支持按商品名称、前台分类查看当前渠道下商品覆盖门店及其上下架、售罄状态。</span>
          </div>
          <div className="flex items-center space-x-1">
            <button type="button" disabled aria-label="上一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40"><ChevronLeft size={12} /></button>
            <button type="button" disabled aria-current="page" className="w-6 h-6 flex items-center justify-center bg-[#00C06B] text-white rounded font-bold">1</button>
            <button type="button" disabled aria-label="下一页" title="当前演示数据仅一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40"><ChevronRight size={12} /></button>
          </div>
        </div>
      </div>
      {coverageStoreDetail && (
        <CoverageStoreDetailModal
          detail={coverageStoreDetail}
          onQuickAction={handleCoverageStoreQuickAction}
          onClose={() => setCoverageStoreDetail(null)}
        />
      )}
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
  active = false,
  onClick,
}: {
  title: string;
  value: string;
  desc: string;
  accent: 'green' | 'blue' | 'orange' | 'red';
  tooltip?: string;
  active?: boolean;
  onClick?: () => void;
}) => {
  const accentClass = {
    green: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]',
    blue: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]',
    orange: 'border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]',
    red: 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]',
  }[accent];

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition-all ${accentClass} ${active ? 'ring-2 ring-current/25 shadow-sm' : 'hover:shadow-sm'}`}
    >
      <div className="text-xs font-bold opacity-80">
        {tooltip ? <LabelWithTip label={title} tip={tooltip} /> : title}
      </div>
      <div className="mt-3 text-2xl font-black">{value}</div>
      <div className="mt-2 text-xs opacity-80">{desc}</div>
    </button>
  );
};

type ExportTaskStatus = 'configuring' | 'creating' | 'created';

const EXPORT_REQUIRED_FIELDS = ['门店名称', '门店状态', '所属渠道', '商品名称'];
const EXPORT_OPTIONAL_FIELDS = [
  { id: 'category', label: '分类名称' },
  { id: 'productType', label: '商品类型' },
  { id: 'specName', label: '规格名称' },
  { id: 'baseProductId', label: '商品库商品 ID' },
  { id: 'skuId', label: '商品库 SkuID' },
  { id: 'storeProductId', label: '门店商品 ID' },
  { id: 'storeSkuId', label: '门店商品 SkuID' },
  { id: 'storeId', label: '门店 ID' },
  { id: 'saleStatus', label: '商品状态' },
  { id: 'stockStatus', label: '沽清状态' },
  { id: 'stockCount', label: '库存信息' },
  { id: 'price', label: '基础价格' },
  { id: 'packageFee', label: '包装费' },
  { id: 'unit', label: '单位' },
  { id: 'barcode', label: '商品条码' },
  { id: 'remark', label: '备注' },
];

const EXPORT_FIELD_GROUPS = [
  {
    label: '基础信息',
    fields: ['category', 'specName', 'productType', 'price', 'packageFee', 'unit', 'stockCount', 'remark'],
  },
  {
    label: '识别码',
    fields: ['baseProductId', 'skuId', 'storeProductId', 'storeSkuId', 'storeId', 'barcode'],
  },
  {
    label: '状态',
    fields: ['saleStatus', 'stockStatus'],
  },
];

const DEFAULT_EXPORT_FIELDS = new Set([
  'category',
  'productType',
  'specName',
  'baseProductId',
  'storeProductId',
  'storeId',
  'saleStatus',
  'stockStatus',
  'stockCount',
]);

const StoreProductExportModal = ({
  activeChannelId,
  products,
  stores,
  channels,
  onClose,
  onViewDownloads,
}: {
  activeChannelId: string;
  products: StoreProductRecord[];
  stores: StoreOption[];
  channels: Array<{ id: string; label: string }>;
  onClose: () => void;
  onViewDownloads: () => void;
}) => {
  const isAllChannelEntry = activeChannelId === 'all';
  const availableChannelIds = useMemo(
    () => channels.map(channel => channel.id).filter(channelId => products.some(product => product.channels.includes(channelId))),
    [channels, products]
  );
  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    isAllChannelEntry ? [] : [activeChannelId]
  );
  const [exportMode, setExportMode] = useState<'default' | 'custom'>('default');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => new Set(DEFAULT_EXPORT_FIELDS));
  const [taskStatus, setTaskStatus] = useState<ExportTaskStatus>('configuring');
  const [showDetailPreview, setShowDetailPreview] = useState(false);

  useEffect(() => {
    if (taskStatus !== 'creating') return undefined;
    const timer = setTimeout(() => setTaskStatus('created'), 900);
    return () => clearTimeout(timer);
  }, [taskStatus]);

  const storeStatusMap = useMemo(
    () => Object.fromEntries(stores.filter(store => store.id !== 'all').map(store => [store.id, store.businessStatus || 'operating'])),
    [stores]
  );

  const exportSummary = useMemo(() => {
    const selectedChannelSet = new Set(selectedChannels);
    const storeIds = new Set<string>();
    let rowCount = 0;

    products.forEach(product => {
      const matchedChannelCount = product.channels.filter(channelId => selectedChannelSet.has(channelId)).length;
      if (matchedChannelCount > 0) {
        storeIds.add(product.storeId);
        rowCount += matchedChannelCount;
      }
    });

    return {
      channelCount: selectedChannels.length,
      storeCount: storeIds.size,
      rowCount,
    };
  }, [products, selectedChannels]);

  const previewRows = useMemo(() => {
    const selectedChannelSet = new Set(selectedChannels);
    return products
      .flatMap(product => product.channels
        .filter(channelId => selectedChannelSet.has(channelId))
        .map(channelId => ({
          id: `${product.id}-${channelId}`,
          storeName: product.storeName,
          storeStatus: storeStatusMap[product.storeId] === 'closed' ? '已停业' : '营业中',
          channel: channels.find(item => item.id === channelId)?.label || channelId,
          productName: product.name,
          productId: product.baseProductId,
          category: product.category,
          saleStatus: product.status === 'on_shelf' ? '已上架' : '已下架',
          stockStatus: product.stockStatus === 'empty' ? '已沽清' : product.stockStatus === 'low' ? '库存不足' : '正常',
        })))
      .slice(0, 8);
  }, [channels, products, selectedChannels, storeStatusMap]);

  const toggleChannel = (channelId: string) => {
    if (!isAllChannelEntry) return;
    setSelectedChannels(current => current.includes(channelId)
      ? current.filter(id => id !== channelId)
      : [...current, channelId]);
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields(current => {
      const next = new Set(current);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  };

  const canCreateTask = selectedChannels.length > 0 && exportSummary.rowCount > 0;
  const activeStep = taskStatus === 'configuring' ? 1 : taskStatus === 'creating' ? 2 : 3;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-6 py-5">
      <div className="flex max-h-[92vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-center justify-between border-b border-[#E8E8E8] px-7 py-5">
          <div className="text-[18px] font-bold text-[#1F2129]">导出</div>
          <button onClick={onClose} disabled={taskStatus === 'creating'} className="text-[#9AA3B2] hover:text-[#5B6475] disabled:cursor-not-allowed disabled:opacity-40">
            <X size={21} />
          </button>
        </div>

        <div className="border-b border-[#EEF1F5] px-10 py-5">
          <div className="grid grid-cols-3">
            {[
              { step: 1, label: '选择导出信息' },
              { step: 2, label: '创建下载任务' },
              { step: 3, label: '任务创建完成' },
            ].map((item, index) => (
              <div key={item.step} className="relative flex flex-col items-center">
                {index > 0 && <div className={`absolute right-1/2 top-[15px] h-px w-full ${activeStep >= item.step ? 'bg-[#00C06B]' : 'bg-[#DDE1E7]'}`} />}
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${activeStep >= item.step ? 'border-[#00C06B] bg-[#00C06B] text-white' : 'border-[#D4D9E1] bg-white text-[#A5ADBA]'}`}>
                  {activeStep > item.step ? <CheckCircle2 size={17} /> : item.step}
                </div>
                <div className={`mt-2 text-xs font-medium ${activeStep >= item.step ? 'text-[#00A35B]' : 'text-[#A5ADBA]'}`}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {taskStatus === 'configuring' && (
          <div className="flex-1 overflow-y-auto px-7 py-5">
            <section>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex overflow-hidden rounded border border-[#DDE2E9]">
                    <button onClick={() => setExportMode('default')} className={`px-5 py-2 text-sm ${exportMode === 'default' ? 'bg-[#F7F8FA] text-[#303642]' : 'bg-white text-[#6B7280]'}`}>默认导出</button>
                    <button onClick={() => setExportMode('default')} className="border-l border-[#DDE2E9] px-2.5 text-[#7B8494] hover:bg-[#F7F8FA]" aria-label="默认导出设置" title="默认导出设置"><Settings size={15} /></button>
                  </div>
                  <button onClick={() => setExportMode('custom')} className={`rounded border px-5 py-2 text-sm ${exportMode === 'custom' ? 'border-[#00C06B] text-[#00A35B]' : 'border-[#DDE2E9] text-[#6B7280] hover:border-[#00C06B] hover:text-[#00A35B]'}`}>自定义导出</button>
                </div>
                <button onClick={() => setShowDetailPreview(true)} className="inline-flex items-center gap-1.5 text-xs text-[#00A35B] hover:underline">
                  <Eye size={14} /> 查看导出明细示例
                </button>
              </div>

              <div className="mt-6 space-y-5">
                {isAllChannelEntry && (
                  <div className="flex items-start gap-6">
                    <div className="w-24 shrink-0 pt-0.5 text-sm text-[#5B6475]"><span className="mr-1 text-red-500">*</span>导出渠道：</div>
                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-4 gap-x-8 gap-y-4">
                        {channels.map(channel => {
                          const selected = selectedChannels.includes(channel.id);
                          const hasData = availableChannelIds.includes(channel.id);
                          return (
                            <label key={channel.id} className={`flex items-center gap-2 text-sm ${hasData ? 'cursor-pointer text-[#303642]' : 'cursor-not-allowed text-[#B5BCC8]'}`} title={hasData ? undefined : '当前查询条件下暂无该渠道商品'}>
                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={!hasData}
                                onChange={() => toggleChannel(channel.id)}
                                className="h-4 w-4 accent-[#00C06B]"
                              />
                              {channel.label}
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <button onClick={() => setSelectedChannels(availableChannelIds)} className="text-[#00A35B] hover:underline">全选可用渠道</button>
                        {selectedChannels.length > 0 && <button onClick={() => setSelectedChannels([])} className="text-[#6B7280] hover:text-[#1F2129]">清空</button>}
                        {selectedChannels.length === 0 && <span className="text-red-500">请至少选择一个导出渠道</span>}
                      </div>
                    </div>
                  </div>
                )}
                {EXPORT_FIELD_GROUPS.map((group, groupIndex) => (
                  <div key={group.label} className="flex items-start gap-6">
                    <div className="w-24 shrink-0 pt-0.5 text-sm text-[#5B6475]">{group.label}：</div>
                    <div className="grid min-w-0 flex-1 grid-cols-4 gap-x-8 gap-y-4">
                      {groupIndex === 0 && EXPORT_REQUIRED_FIELDS.map(field => (
                        <label key={field} className="flex items-center gap-2 text-sm text-[#A5ADBA]">
                          <input type="checkbox" checked disabled readOnly className="h-4 w-4 accent-[#00C06B]" />
                          {field}
                        </label>
                      ))}
                      {group.fields.map(fieldId => {
                        const field = EXPORT_OPTIONAL_FIELDS.find(item => item.id === fieldId);
                        if (!field) return null;
                        const checked = exportMode === 'default' ? DEFAULT_EXPORT_FIELDS.has(field.id) : selectedFields.has(field.id);
                        return (
                          <label key={field.id} className={`flex items-center gap-2 text-sm ${exportMode === 'default' ? 'cursor-default text-[#A5ADBA]' : 'cursor-pointer text-[#303642]'}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={exportMode === 'default'}
                              onChange={() => toggleField(field.id)}
                              className="h-4 w-4 accent-[#00C06B]"
                            />
                            {field.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {taskStatus === 'creating' && (
          <div className="flex min-h-[390px] flex-1 flex-col items-center justify-center px-8 py-12 text-center">
            <Loader2 size={40} className="animate-spin text-[#00C06B]" />
            <div className="mt-5 text-lg font-bold text-[#1F2129]">正在创建下载任务</div>
            <div className="mt-2 text-sm text-[#8B95A7]">正在提交 {exportSummary.channelCount} 个渠道的导出请求，请稍候...</div>
          </div>
        )}

        {taskStatus === 'created' && (
          <div className="flex min-h-[390px] flex-1 flex-col items-center justify-center px-8 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF9F1] text-[#00A35B]"><CheckCircle2 size={30} /></div>
            <div className="mt-5 text-xl font-bold text-[#1F2129]">下载任务已创建</div>
            <div className="mt-2 max-w-[520px] text-sm leading-6 text-[#7B8494]">系统正在异步生成 Excel 文件。完成后可前往右上角“下载”查看并下载，不需要停留在当前页面等待。</div>
            <div className="mt-6 flex items-center gap-7 rounded-[8px] bg-[#F7F8FA] px-8 py-4 text-sm text-[#5B6475]">
              <span><strong className="mr-1 text-[#1F2129]">{exportSummary.channelCount}</strong>个渠道</span>
              <span className="h-4 w-px bg-[#DDE2E9]" />
              <span><strong className="mr-1 text-[#1F2129]">{exportSummary.storeCount}</strong>家门店</span>
              <span className="h-4 w-px bg-[#DDE2E9]" />
              <span><strong className="mr-1 text-[#1F2129]">{exportSummary.rowCount}</strong>条明细</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#E8E8E8] bg-white px-7 py-4">
          {taskStatus === 'configuring' ? (
            <div className="flex items-center gap-2 text-xs text-[#7B8494]">
              <FileSpreadsheet size={15} className="text-[#00A35B]" />
              默认导出当前查询条件下全部门店商品，文件包含“门店状态”和“所属渠道”字段
            </div>
          ) : <div />}
          <div className="flex items-center gap-3">
            {taskStatus !== 'creating' && (
              <button onClick={onClose} className="rounded-[8px] border border-[#DDE2E9] px-5 py-2.5 text-sm text-[#5B6475] hover:bg-[#F7F8FA]">关闭</button>
            )}
            {taskStatus === 'configuring' && (
              <button onClick={() => setTaskStatus('creating')} disabled={!canCreateTask} className="rounded-[8px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:bg-[#C9CED6]">创建下载任务</button>
            )}
            {taskStatus === 'created' && (
              <button onClick={onViewDownloads} className="rounded-[8px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">查看下载任务</button>
            )}
          </div>
        </div>
        {showDetailPreview && (
          <ExportDetailPreviewModal rows={previewRows} onClose={() => setShowDetailPreview(false)} />
        )}
      </div>
    </div>
  );
};

type ExportPreviewRow = {
  id: string;
  storeName: string;
  storeStatus: string;
  channel: string;
  productName: string;
  productId: string;
  category: string;
  saleStatus: string;
  stockStatus: string;
};

const ExportDetailPreviewModal = ({ rows, onClose }: { rows: ExportPreviewRow[]; onClose: () => void }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 px-8 py-8">
    <div className="flex max-h-[82vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
      <div className="flex items-start justify-between border-b border-[#E8E8E8] px-6 py-5">
        <div>
          <div className="text-[18px] font-bold text-[#1F2129]">门店商品导出明细示例</div>
          <div className="mt-1 text-xs text-[#8B95A7]">供开发确认导出文件字段及数据粒度，不生成实际下载文件。</div>
        </div>
        <button onClick={onClose} className="text-[#9AA3B2] hover:text-[#5B6475]" aria-label="关闭明细示例">
          <X size={20} />
        </button>
      </div>

      <div className="flex items-center gap-6 border-b border-[#EEF1F5] bg-[#F7F8FA] px-6 py-3 text-xs text-[#5B6475]">
        <span className="inline-flex items-center gap-2"><FileSpreadsheet size={15} className="text-[#00A35B]" />工作表：门店商品明细</span>
        <span>一条商品在多个渠道售卖时，按渠道拆分为多行</span>
        <span className="font-medium text-[#00A35B]">新增字段：门店状态、所属渠道</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[1020px] table-fixed border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-[#F4F6F8] text-[#4E5969]">
            <tr>
              <th className="w-[150px] border-b border-r border-[#E5E8ED] px-4 py-3 font-bold">门店名称</th>
              <th className="w-[100px] border-b border-r border-[#BDEBD2] bg-[#EAF9F1] px-4 py-3 font-bold text-[#008F50]">门店状态 <span className="ml-1 text-[10px]">新增</span></th>
              <th className="w-[130px] border-b border-r border-[#BDEBD2] bg-[#EAF9F1] px-4 py-3 font-bold text-[#008F50]">所属渠道 <span className="ml-1 text-[10px]">新增</span></th>
              <th className="w-[180px] border-b border-r border-[#E5E8ED] px-4 py-3 font-bold">商品名称</th>
              <th className="w-[170px] border-b border-r border-[#E5E8ED] px-4 py-3 font-bold">商品库商品 ID</th>
              <th className="w-[130px] border-b border-r border-[#E5E8ED] px-4 py-3 font-bold">分类名称</th>
              <th className="w-[90px] border-b border-r border-[#E5E8ED] px-4 py-3 font-bold">商品状态</th>
              <th className="w-[90px] border-b border-[#E5E8ED] px-4 py-3 font-bold">沽清状态</th>
            </tr>
          </thead>
          <tbody className="text-[#303642]">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-[#FAFBFC]">
                <td className="border-b border-r border-[#EEF1F5] px-4 py-3">{row.storeName}</td>
                <td className="border-b border-r border-[#DDF3E7] bg-[#F7FCF9] px-4 py-3">
                  <span className={`font-medium ${row.storeStatus === '营业中' ? 'text-[#008F50]' : 'text-[#D46B08]'}`}>{row.storeStatus}</span>
                </td>
                <td className="border-b border-r border-[#DDF3E7] bg-[#F7FCF9] px-4 py-3">{row.channel}</td>
                <td className="truncate border-b border-r border-[#EEF1F5] px-4 py-3 font-medium" title={row.productName}>{row.productName}</td>
                <td className="border-b border-r border-[#EEF1F5] px-4 py-3 text-[#667085]">{row.productId}</td>
                <td className="truncate border-b border-r border-[#EEF1F5] px-4 py-3" title={row.category}>{row.category}</td>
                <td className="border-b border-r border-[#EEF1F5] px-4 py-3">{row.saleStatus}</td>
                <td className="border-b border-[#EEF1F5] px-4 py-3">{row.stockStatus}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-14 text-center text-[#98A0B3]">当前所选渠道暂无可预览的商品明细</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#E8E8E8] px-6 py-4">
        <div className="text-xs text-[#8B95A7]">示例仅展示前 {Math.min(rows.length, 8)} 条数据，实际导出包含当前条件下全部门店商品。</div>
        <button onClick={onClose} className="rounded-[8px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">我知道了</button>
      </div>
    </div>
  </div>
);

const CoverageStoreDetailModal = ({
  detail,
  onQuickAction,
  onClose,
}: {
  detail: CoverageStoreDetail;
  onQuickAction: (detail: CoverageStoreDetail, store: CoverageStoreDetail['stores'][number]) => void;
  onClose: () => void;
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState('all');

  useEffect(() => {
    setSelectedStoreId('all');
  }, [detail]);

  const filteredStores = useMemo(() => {
    if (selectedStoreId === 'all') return detail.stores;
    return detail.stores.filter(store => store.storeId === selectedStoreId);
  }, [detail.stores, selectedStoreId]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[760px] rounded-[16px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-6 py-4">
            <div className="text-[18px] font-semibold text-[#1F2129]">{detail.title}</div>
          <button onClick={onClose} className="text-[#9AA3B2] hover:text-[#5B6475]">
            <X size={20} />
          </button>
        </div>
        <div className="border-b border-[#EEF1F5] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white transition-colors w-[220px]">
              <span className="text-xs text-[#666] mr-2 whitespace-nowrap">门店:</span>
              <select
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(e.target.value)}
                className="flex-1 text-xs bg-transparent outline-none text-[#333]"
              >
                <option value="all">全部门店</option>
                {detail.stores.map(store => (
                  <option key={store.storeId} value={store.storeId}>{store.storeName}</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-[#98A0B3]">
              共 {filteredStores.length} 家门店
            </div>
          </div>
        </div>
        <div className="max-h-[460px] overflow-y-auto no-scrollbar px-6 py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_140px_140px_120px] border-b border-[#EEF1F5] pb-3 text-xs font-bold text-[#5B6475]">
            <div>门店名称</div>
            <div>状态</div>
            <div>门店 ID</div>
            <div className="text-right">操作</div>
          </div>
          <div className="divide-y divide-[#F1F3F7]">
            {filteredStores.map(store => (
              <div key={store.storeId} className="grid grid-cols-[minmax(0,1fr)_140px_140px_120px] items-center gap-3 py-4 text-sm text-[#1F2129]">
                <div className="font-medium truncate">{store.storeName}</div>
                <div>
                  {(() => {
                    const statusMeta =
                      detail.type === 'sold_out'
                        ? { label: '已售罄', className: 'bg-[#FEF2F2] text-[#DC2626]' }
                        : store.status === 'off_shelf'
                        ? { label: '已下架', className: 'bg-[#FFF7ED] text-[#C2410C]' }
                        : store.stockStatus === 'empty'
                          ? { label: '已售罄', className: 'bg-[#FEF2F2] text-[#DC2626]' }
                          : store.status === 'on_shelf'
                            ? { label: '已上架', className: 'bg-[#F0FDF4] text-[#15803D]' }
                            : { label: '已下架', className: 'bg-[#FFF7ED] text-[#C2410C]' };

                    return (
                      <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-[#5B6475]">{store.storeId.toUpperCase()}</div>
                <div className="text-right">
                  <button
                    onClick={() => onQuickAction(detail, store)}
                    className="inline-flex min-w-[72px] items-center justify-center rounded-lg border border-[#00C06B]/25 bg-[#F3FCF7] px-3 py-1.5 text-xs font-bold text-[#00A35B] hover:bg-[#E8F9F0]"
                  >
                    {detail.type === 'sold_out'
                      ? '恢复库存'
                      : detail.type === 'off_shelf'
                        ? '上架'
                        : detail.type === 'on_shelf'
                          ? '下架'
                          : store.stockStatus === 'empty'
                            ? '恢复库存'
                            : store.status === 'off_shelf'
                              ? '上架'
                              : '下架'}
                  </button>
                </div>
              </div>
            ))}
            {filteredStores.length === 0 && (
              <div className="py-12 text-center text-sm text-[#98A0B3]">暂无门店数据</div>
            )}
          </div>
        </div>
        <div className="flex justify-end border-t border-[#EEF1F5] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};

const renderCoverageChannelIcon = (channelId: string) => {
  const def = CHANNEL_DEFS[channelId];
  if (!def) return null;
  const icon = channelId === 'taobao'
    ? <span className="text-[10px] font-black leading-none">{def.shortLabel}</span>
    : def.icon;

  return (
    <div
      key={channelId}
      title={def.label}
      className={`flex h-7 w-7 items-center justify-center rounded-lg ${def.activeClass}`}
    >
      {icon}
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
