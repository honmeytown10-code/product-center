import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Minus, ChevronDown, MoreHorizontal, FileUp, X, AlertTriangle,
  ChevronLeft, ChevronRight, Store, Bike, UtensilsCrossed, ShoppingBag, CircleHelp
} from 'lucide-react';
import { useProducts } from '../../context';
import { ShelfChannelId, WebShelfConfirmModal, getShelfChannelLabel } from './WebShelfConfirmModal';
import { StockoutSpec, WebStockoutModal } from './WebStockoutModal';

type ChannelId = 'mini_dine' | 'mini_take' | 'meituan' | 'taobao' | 'pos';
type ShelfStatus = 'on_shelf' | 'off_shelf';

type StoreAddonRecord = {
  id: string;
  name: string;
  price: number;
  stockMode: 'unlimited' | 'custom';
  stockCount: number;
  storeName: string;
  storeId: string;
  channelStatuses: Partial<Record<ChannelId, ShelfStatus>>;
  independentSale: boolean;
  relatedProductCount: number;
  isMultiSpec?: boolean;
  specs?: StockoutSpec[];
};

type AddonEditDraft = {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stockMode: 'unlimited' | 'custom';
  stockCount: number;
  replenishMode: 'none' | 'max' | 'unlimited';
};

type AddonDeleteDialogState =
  | { mode: 'single'; addon: StoreAddonRecord }
  | { mode: 'batch'; count: number };

type AddonBatchShelfDialogState = {
  action: 'on_shelf' | 'off_shelf';
  count: number;
};

type AddonBatchPriceDialogState = {
  count: number;
  priceType: 'increase' | 'decrease' | 'set';
  valueType: 'amount' | 'percent';
  amount: string;
};

const STORE_OPTIONS = [
  { id: 'all', name: '全部门店' },
  { id: 's1', name: '南山万象店' },
  { id: 's2', name: '福田卓悦店' },
  { id: 's3', name: '宝安壹方城店' },
  { id: 's4', name: '龙华红山店' },
];

const CHANNEL_DEFS: Record<ChannelId, {
  label: string;
  shortLabel: string;
  activeClass: string;
  inactiveClass: string;
  icon: React.ReactNode;
}> = {
  mini_dine: {
    label: '小程序-堂食',
    shortLabel: '堂',
    activeClass: 'bg-[#FDEBD8] text-[#F59E0B]',
    inactiveClass: 'bg-[#F3F4F6] text-[#BDBDBD]',
    icon: <Store size={16} strokeWidth={2.4} />,
  },
  mini_take: {
    label: '小程序-外卖',
    shortLabel: '外',
    activeClass: 'bg-[#DDF5D8] text-[#84CC16]',
    inactiveClass: 'bg-[#F3F4F6] text-[#BDBDBD]',
    icon: <Bike size={16} strokeWidth={2.4} />,
  },
  pos: {
    label: 'POS',
    shortLabel: 'POS',
    activeClass: 'bg-[#DDEEFF] text-[#3B82F6]',
    inactiveClass: 'bg-[#F3F4F6] text-[#BDBDBD]',
    icon: <span className="text-[10px] font-black leading-none">POS</span>,
  },
  meituan: {
    label: '美团-外卖',
    shortLabel: '美',
    activeClass: 'bg-[#FCE9B9] text-[#EAB308]',
    inactiveClass: 'bg-[#F3F4F6] text-[#BDBDBD]',
    icon: <UtensilsCrossed size={16} strokeWidth={2.4} />,
  },
  taobao: {
    label: '淘宝闪购',
    shortLabel: '淘',
    activeClass: 'bg-[#FF7A18] text-white',
    inactiveClass: 'bg-[#F3F4F6] text-[#BDBDBD]',
    icon: <ShoppingBag size={16} strokeWidth={2.4} />,
  },
};

const DEFAULT_CHANNELS = [
  { id: 'mini_dine', label: '小程序-堂食' },
  { id: 'mini_take', label: '小程序-外卖' },
  { id: 'meituan', label: '美团-外卖' },
  { id: 'taobao', label: '淘宝闪购' },
  { id: 'pos', label: 'POS' },
] as const;

const MOCK_STORE_ADDONS: StoreAddonRecord[] = [
  {
    id: '91347249784494',
    name: '燕麦奶',
    price: 11,
    stockMode: 'custom',
    stockCount: 56,
    storeName: '南山万象店',
    storeId: 's1',
    channelStatuses: { mini_dine: 'on_shelf', mini_take: 'on_shelf', meituan: 'off_shelf', taobao: 'off_shelf', pos: 'on_shelf' },
    independentSale: true,
    relatedProductCount: 4,
    isMultiSpec: false,
  },
  {
    id: '100801904739103',
    name: '椰肉',
    price: 0,
    stockMode: 'custom',
    stockCount: 12,
    storeName: '福田卓悦店',
    storeId: 's2',
    channelStatuses: { mini_dine: 'off_shelf', mini_take: 'off_shelf', meituan: 'off_shelf', taobao: 'off_shelf', pos: 'on_shelf' },
    independentSale: false,
    relatedProductCount: 1,
    isMultiSpec: false,
  },
  {
    id: '926584425647788',
    name: '椰肉碎',
    price: 0.01,
    stockMode: 'unlimited',
    stockCount: 0,
    storeName: '宝安壹方城店',
    storeId: 's3',
    channelStatuses: { mini_dine: 'off_shelf', mini_take: 'off_shelf', meituan: 'on_shelf', taobao: 'on_shelf', pos: 'off_shelf' },
    independentSale: false,
    relatedProductCount: 0,
    isMultiSpec: true,
    specs: [
      { id: 'a3-1', name: '规格1', currentStock: 9999, remainStock: '0', nextDayStock: '9999', nextDayUnlimited: false },
      { id: 'a3-2', name: '规格2', currentStock: 9999, remainStock: '0', nextDayStock: '9999', nextDayUnlimited: false },
      { id: 'a3-3', name: '规格3', currentStock: 9999, remainStock: '0', nextDayStock: '9999', nextDayUnlimited: false },
    ],
  },
  {
    id: '105263118140852',
    name: '爆爆珠',
    price: 3,
    stockMode: 'custom',
    stockCount: 18,
    storeName: '龙华红山店',
    storeId: 's4',
    channelStatuses: { mini_dine: 'off_shelf', mini_take: 'on_shelf', meituan: 'off_shelf', taobao: 'on_shelf', pos: 'on_shelf' },
    independentSale: true,
    relatedProductCount: 1,
    isMultiSpec: false,
  },
  {
    id: '918497724793303',
    name: '核桃',
    price: 5,
    stockMode: 'custom',
    stockCount: 0,
    storeName: '南山万象店',
    storeId: 's1',
    channelStatuses: { mini_dine: 'on_shelf', mini_take: 'off_shelf', meituan: 'off_shelf', taobao: 'off_shelf', pos: 'off_shelf' },
    independentSale: true,
    relatedProductCount: 2,
    isMultiSpec: false,
  },
];

const FilterInput = ({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) => (
  <div className="flex items-center">
    <span className="text-xs text-[#666] mr-2 shrink-0">{label}</span>
    <input value={value} onChange={event => onChange(event.target.value)} className="w-[170px] h-[34px] px-3 border border-[#E8E8E8] rounded text-sm focus:border-[#00C06B] focus:outline-none transition-colors" placeholder={placeholder} />
  </div>
);

const FilterNativeSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
}) => (
  <div className="flex items-center">
    <span className="text-xs text-[#666] mr-2 shrink-0">{label}</span>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-[170px] h-[34px] pl-3 pr-8 border border-[#E8E8E8] rounded text-sm bg-white focus:border-[#00C06B] focus:outline-none transition-colors"
      >
        {options.map(option => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
    </div>
  </div>
);

const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) => (
  <div className="flex items-center">
    <span className="text-xs text-[#666] mr-2 shrink-0">{label}</span>
    <div className="relative">
      <select value={value} onChange={event => onChange(event.target.value)} className="h-[34px] w-[150px] appearance-none rounded border border-[#E8E8E8] bg-white px-3 pr-8 text-sm text-[#333] outline-none hover:border-[#00C06B]">
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999]" />
    </div>
  </div>
);

export const WebStoreAddonList: React.FC = () => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = brandConfigs[activeBrandId];
  const isShelvesUnited = config?.features.shelves_unite ?? false;
  const isStockShared = config?.features.stock_shared ?? false;
  const [addons, setAddons] = useState<StoreAddonRecord[]>(MOCK_STORE_ADDONS);
  const [activeTabId, setActiveTabId] = useState('all');
  const [activeStoreId, setActiveStoreId] = useState('all');
  const [nameKeyword, setNameKeyword] = useState('');
  const [idKeyword, setIdKeyword] = useState('');
  const [saleStatus, setSaleStatus] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [notice, setNotice] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());
  const [stockDialog, setStockDialog] = useState<StoreAddonRecord | null>(null);
  const [shelfDialog, setShelfDialog] = useState<StoreAddonRecord | null>(null);
  const [batchShelfDialog, setBatchShelfDialog] = useState<AddonBatchShelfDialogState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<AddonDeleteDialogState | null>(null);
  const [editDialog, setEditDialog] = useState<AddonEditDraft | null>(null);
  const [batchPriceDialog, setBatchPriceDialog] = useState<AddonBatchPriceDialogState | null>(null);
  const [openMenu, setOpenMenu] = useState<{
    id: string;
    addon: StoreAddonRecord;
    top: number;
    left: number;
  } | null>(null);

  const tabs = useMemo(() => [{ id: 'all', label: '全部渠道' }, ...DEFAULT_CHANNELS], []);

  useEffect(() => {
    setOpenMenu(null);
  }, [activeTabId]);

  useEffect(() => {
    setSelectedRowKeys(new Set());
  }, [activeTabId, activeStoreId]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-addon-menu]') || target?.closest('[data-addon-menu-trigger]')) {
        return;
      }
      setOpenMenu(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const filteredAddons = useMemo(() => {
    let filtered = addons;

    if (activeStoreId !== 'all') {
      filtered = filtered.filter(item => item.storeId === activeStoreId);
    }

    if (activeTabId !== 'all') {
      filtered = filtered.filter(item => activeTabId in item.channelStatuses);
    }

    if (nameKeyword.trim()) {
      filtered = filtered.filter(item => item.name.toLowerCase().includes(nameKeyword.trim().toLowerCase()));
    }
    if (idKeyword.trim()) {
      filtered = filtered.filter(item => item.id.includes(idKeyword.trim()));
    }
    if (saleStatus !== 'all') {
      filtered = filtered.filter(item => {
        const statuses = activeTabId === 'all' ? Object.values(item.channelStatuses) : [item.channelStatuses[activeTabId as ChannelId]];
        return saleStatus === 'on_shelf' ? statuses.includes('on_shelf') : statuses.every(status => status !== 'on_shelf');
      });
    }
    if (stockStatus !== 'all') {
      filtered = filtered.filter(item => stockStatus === 'available' ? item.stockMode === 'unlimited' || item.stockCount > 0 : item.stockMode === 'custom' && item.stockCount <= 0);
    }

    return filtered;
  }, [activeStoreId, activeTabId, addons, idKeyword, nameKeyword, saleStatus, stockStatus]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const handleAction = (
    addon: StoreAddonRecord,
    action: 'shelf' | 'batch_shelf' | 'edit' | 'stock' | 'change_price' | 'print' | 'delete' | 'log'
  ) => {
    if (action === 'shelf' || action === 'batch_shelf') {
      setShelfDialog(addon);
      return;
    }
    if (action === 'stock') {
      setStockDialog(addon);
      return;
    }
    if (action === 'delete') {
      setDeleteDialog({ mode: 'single', addon });
      setOpenMenu(null);
      return;
    }
    if (action === 'edit') {
      setEditDialog({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        costPrice: Number((addon.price * 0.45).toFixed(2)),
        stockMode: addon.stockMode,
        stockCount: addon.stockCount,
        replenishMode: 'none',
      });
      return;
    }
    const channelLabel = activeTabId === 'all' ? '全部渠道' : (CHANNEL_DEFS[activeTabId as ChannelId]?.label || activeTabId);
    const labels = {
      shelf: addon.channelStatuses[activeTabId as ChannelId] === 'on_shelf' ? '下架' : '上架',
      batch_shelf: '上下架',
      stock: '沽清',
      change_price: '改价',
      print: '打印设置',
      delete: '删除加料',
      log: '操作日志',
    };
    setOpenMenu(null);
    window.alert(`${labels[action]}：${addon.name} (${channelLabel})`);
  };

  const handleShelfConfirm = (payload: { action: 'on_shelf' | 'off_shelf'; channels: ShelfChannelId[] }) => {
    if (!shelfDialog) return;
    const actionLabel = payload.action === 'on_shelf' ? '上架' : '下架';
    const selectedNames = payload.channels.map(channelId => getShelfChannelLabel(channelId)).join('、');

    if (activeTabId === 'all') {
      window.alert(
        isShelvesUnited
          ? `已统一${actionLabel}加料全部渠道，状态会同步到美饿平台`
          : `已${actionLabel}加料所选渠道：${selectedNames || '未选择渠道'}`
      );
    } else {
      window.alert(
        isShelvesUnited
          ? `已统一${actionLabel}加料全部渠道，状态会同步到美饿平台`
          : `${getShelfChannelLabel(activeTabId)} ${actionLabel}成功`
      );
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
    window.alert(
      isStockShared
        ? `${stockDialog.name} 沽清设置已保存，并同步更新渠道库存：${channelNames}`
        : `${stockDialog.name} 沽清设置已保存，已应用至渠道：${channelNames}`
    );
    setStockDialog(null);
  };

  const getRowKey = (addon: StoreAddonRecord) => `${addon.id}-${addon.storeId}`;

  const visibleRowKeys = filteredAddons.map(getRowKey);
  const selectedAddons = filteredAddons.filter(item => selectedRowKeys.has(getRowKey(item)));
  const selectedCount = visibleRowKeys.filter(key => selectedRowKeys.has(key)).length;
  const allVisibleSelected = visibleRowKeys.length > 0 && selectedCount === visibleRowKeys.length;

  const toggleRowSelection = (rowKey: string) => {
    setSelectedRowKeys(prev => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedRowKeys(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleRowKeys.forEach(key => next.delete(key));
      } else {
        visibleRowKeys.forEach(key => next.add(key));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedRowKeys(new Set());

  const handleBatchAction = (action: 'on_shelf' | 'off_shelf' | 'delete' | 'change_price') => {
    if (!selectedCount) return;
    if (action === 'on_shelf' || action === 'off_shelf') {
      setBatchShelfDialog({ action, count: selectedCount });
      return;
    }
    if (action === 'delete') {
      setDeleteDialog({ mode: 'batch', count: selectedCount });
      return;
    }
    if (action === 'change_price') {
      setBatchPriceDialog({
        count: selectedCount,
        priceType: 'increase',
        valueType: 'amount',
        amount: '',
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteDialog) return;
    if (deleteDialog.mode === 'single') {
      setAddons(prev => prev.filter(item => !(item.id === deleteDialog.addon.id && item.storeId === deleteDialog.addon.storeId)));
    } else {
      setAddons(prev => prev.filter(item => !selectedRowKeys.has(getRowKey(item))));
      setSelectedRowKeys(new Set());
    }
    setDeleteDialog(null);
  };

  const handleBatchShelfConfirm = (channels: ShelfChannelId[]) => {
    if (!batchShelfDialog) return;
    setAddons(prev => prev.map(item => {
      if (!selectedRowKeys.has(getRowKey(item))) return item;
      const nextStatuses = { ...item.channelStatuses };
      channels.forEach(channelId => {
        nextStatuses[channelId as ChannelId] = batchShelfDialog.action;
      });
      return { ...item, channelStatuses: nextStatuses };
    }));
    setBatchShelfDialog(null);
    setSelectedRowKeys(new Set());
  };

  const handleBatchPriceConfirm = () => {
    if (!batchPriceDialog) return;
    const amountValue = Number(batchPriceDialog.amount || 0);
    setAddons(prev => prev.map(item => {
      if (!selectedRowKeys.has(getRowKey(item))) return item;
      let nextPrice = item.price;
      if (batchPriceDialog.priceType === 'set') {
        nextPrice = amountValue;
      } else if (batchPriceDialog.valueType === 'percent') {
        const delta = item.price * (amountValue / 100);
        nextPrice = batchPriceDialog.priceType === 'increase' ? item.price + delta : item.price - delta;
      } else {
        nextPrice = batchPriceDialog.priceType === 'increase' ? item.price + amountValue : item.price - amountValue;
      }
      return { ...item, price: Number(Math.max(0, nextPrice).toFixed(2)) };
    }));
    setBatchPriceDialog(null);
    setSelectedRowKeys(new Set());
  };

  const handleEditNumberChange = (field: 'price' | 'costPrice' | 'stockCount', delta: number) => {
    if (!editDialog) return;
    const currentValue = editDialog[field];
    const nextValue = Math.max(0, Number((currentValue + delta).toFixed(2)));
    setEditDialog({
      ...editDialog,
      [field]: field === 'stockCount' ? Math.round(nextValue) : nextValue,
    });
  };

  const handleEditSave = () => {
    if (!editDialog) return;
    setAddons(prev => prev.map(item => (
      item.id === editDialog.id
        ? {
            ...item,
            price: editDialog.price,
            stockMode: editDialog.stockMode,
            stockCount: editDialog.stockMode === 'unlimited' ? 0 : editDialog.stockCount,
          }
        : item
    )));
    setEditDialog(null);
  };

  const renderChannelIcon = (channelId: ChannelId, status: ShelfStatus) => {
    const def = CHANNEL_DEFS[channelId];
    const isActive = status === 'on_shelf';
    const icon = channelId === 'taobao'
      ? <span className="text-[10px] font-black leading-none">{def.shortLabel}</span>
      : def.icon;

    return (
      <div
        key={channelId}
        title={`${def.label} - ${isActive ? '上架' : '下架'}`}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
          isActive ? def.activeClass : def.inactiveClass
        }`}
      >
        {icon}
      </div>
    );
  };

  const renderActionMenu = (addon: StoreAddonRecord) => {
    const rowKey = `${addon.id}-${addon.storeId}`;
    const isOpen = openMenu?.id === rowKey;
    const menuItems = activeTabId === 'all'
      ? [
          { key: 'change_price', label: '改价' },
          { key: 'print', label: '打印设置' },
          { key: 'delete', label: '删除加料', danger: true },
        ]
      : [
          { key: 'change_price', label: '改价' },
          { key: 'log', label: '操作日志' },
          { key: 'print', label: '打印设置' },
          { key: 'delete', label: '删除加料', danger: true },
        ];

    return (
      <div className="relative">
        <button
          data-addon-menu-trigger
          onClick={event => {
            if (isOpen) {
              setOpenMenu(null);
              return;
            }
            const rect = event.currentTarget.getBoundingClientRect();
            setOpenMenu({
              id: rowKey,
              addon,
              top: rect.bottom + 8,
              left: rect.right - 136,
            });
          }}
          className="text-[#999] transition-colors hover:text-[#333]"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4">
      {notice && <div className="fixed right-6 top-[76px] z-[120] rounded-md bg-[#1D2129] px-4 py-2.5 text-[13px] text-white shadow-lg">{notice}</div>}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
        <div className="p-5 border-b border-[#E8E8E8] bg-white space-y-4 shrink-0 z-20">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterInput label="加料名称" placeholder="请输入" value={nameKeyword} onChange={setNameKeyword} />
            <FilterInput label="加料ID" placeholder="请输入" value={idKeyword} onChange={setIdKeyword} />
            <FilterNativeSelect label="机构门店" options={STORE_OPTIONS} value={activeStoreId} onChange={setActiveStoreId} />
            <FilterSelect label="售卖状态" value={saleStatus} onChange={setSaleStatus} options={[{ value: 'all', label: '全部' }, { value: 'on_shelf', label: '有渠道在售' }, { value: 'off_shelf', label: '全部停售' }]} />
            <FilterSelect label="库存状态" value={stockStatus} onChange={setStockStatus} options={[{ value: 'all', label: '全部' }, { value: 'available', label: '有库存' }, { value: 'out', label: '已沽清' }]} />
          </div>

          <div className="flex justify-between items-center gap-4">
            <button type="button" onClick={() => showNotice('门店加料快捷筛选已保存')} className="flex items-center text-xs text-[#666] border border-[#E8E8E8] px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
              <FileUp size={14} className="mr-1.5" /> 保存快捷筛选选项
            </button>
            <div className="flex space-x-3">
              <button type="button" onClick={() => { setNameKeyword(''); setIdKeyword(''); setActiveStoreId('all'); setSaleStatus('all'); setStockStatus('all'); }} className="px-6 py-1.5 border border-[#E8E8E8] text-[#333] rounded text-xs hover:bg-gray-50 transition-colors">重置</button>
              <button type="button" onClick={() => showNotice(`已查询到 ${filteredAddons.length} 条门店加料`)} className="px-6 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">查询</button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 flex justify-between items-center border-b border-[#E8E8E8] bg-white shrink-0 z-10 gap-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
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
        </div>

        {selectedCount > 0 && (
          <div className="mx-5 mt-4 rounded-lg border border-[#BEE8CC] bg-[#F3FCF7] px-4 py-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <div className="font-medium text-[#5E7A67]">已选 {selectedCount} 条数据</div>
              <div className="flex items-center gap-4 text-[#00A862]">
                {activeTabId === 'all' ? (
                  <>
                    <button onClick={() => handleBatchAction('on_shelf')} className="font-medium hover:underline">上架</button>
                    <button onClick={() => handleBatchAction('off_shelf')} className="font-medium hover:underline">下架</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleBatchAction('delete')} className="font-medium hover:underline">删除加料</button>
                    <button onClick={() => handleBatchAction('change_price')} className="font-medium hover:underline">改价</button>
                  </>
                )}
                <button onClick={clearSelection} className="font-medium hover:underline">取消选择</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1020px]">
            <thead className="sticky top-0 bg-[#F7F8FA] z-10 text-xs font-bold text-[#333]">
              <tr>
                <th className="w-12 py-3 pl-5 border-b border-[#E8E8E8]">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="py-3 px-4 border-b border-[#E8E8E8]">加料名称</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-24">价格</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-28">库存</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-36">门店名称</th>
                <th className={`py-3 px-4 border-b border-[#E8E8E8] ${activeTabId === 'all' ? 'w-[220px]' : 'w-[72px]'}`}>
                  {activeTabId === 'all' ? '渠道' : ''}
                </th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-28">是否独立售卖</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-28">关联商品数</th>
                <th className="sticky right-0 py-3 px-4 border-b border-[#E8E8E8] w-[220px] text-center bg-[#F7F8FA] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {filteredAddons.map(addon => {
                const rowKey = getRowKey(addon);
                return (
                <tr key={`${addon.id}-${addon.storeId}`} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC] transition-colors group">
                  <td className="py-4 pl-5">
                    <input
                      type="checkbox"
                      checked={selectedRowKeys.has(rowKey)}
                      onChange={() => toggleRowSelection(rowKey)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-[#333]">{addon.name}</div>
                    <div className="mt-1 text-[11px] text-[#999] font-mono">ID: {addon.id}</div>
                  </td>
                  <td className="py-4 px-4 text-[#333] font-medium">{addon.price}</td>
                  <td className="py-4 px-4">
                    <div className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold ${addon.stockMode === 'unlimited' ? 'bg-[#F3F4F6] text-[#4B5563]' : addon.stockCount > 0 ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                      {addon.stockMode === 'unlimited' ? '无限库存' : addon.stockCount > 0 ? `库存 ${addon.stockCount}` : '已售罄'}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-[#333]">{addon.storeName}</div>
                    <div className="text-[11px] text-[#999]">{addon.storeId.toUpperCase()}</div>
                  </td>
                  <td className="py-4 px-4">
                    {activeTabId === 'all' && (
                      <div className="flex flex-wrap gap-2">
                        {DEFAULT_CHANNELS.map(channel => channel.id).map(channelId =>
                          renderChannelIcon(channelId, addon.channelStatuses[channelId] || 'off_shelf')
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-[#666]">{addon.independentSale ? '是' : '否'}</td>
                  <td className="py-4 px-4">
                    <span className={`font-bold ${addon.relatedProductCount > 0 ? 'text-[#00C06B]' : 'text-[#999]'}`}>
                      {addon.relatedProductCount}
                    </span>
                  </td>
                  <td className="sticky right-0 py-4 px-4 text-center bg-white group-hover:bg-[#F9FFFC] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">
                    <div className="flex items-center justify-center space-x-3 text-sm">
                      <button
                        onClick={() => handleAction(addon, activeTabId === 'all' ? 'batch_shelf' : 'shelf')}
                        className="font-medium text-[#00C06B] hover:text-[#008f53] hover:underline"
                      >
                        {activeTabId === 'all'
                          ? '上下架'
                          : addon.channelStatuses[activeTabId as ChannelId] === 'on_shelf'
                            ? '下架'
                            : '上架'}
                      </button>
                      {activeTabId !== 'all' && (
                        <button onClick={() => handleAction(addon, 'edit')} className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline">
                          编辑
                        </button>
                      )}
                      <button onClick={() => handleAction(addon, 'stock')} className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline">沽清</button>
                      <div className="h-3 w-px bg-gray-300" />
                      {renderActionMenu(addon)}
                    </div>
                  </td>
                </tr>
              )})}
              {filteredAddons.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#999]">暂无加料数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="h-12 border-t border-[#E8E8E8] flex items-center justify-end px-5 text-xs text-[#666] bg-white shrink-0">
          <span className="mr-4">共 {filteredAddons.length} 条</span>
          <div className="flex items-center mr-4">
            <span className="mr-2">20条/页</span>
            <ChevronDown size={14} />
          </div>
          <div className="flex items-center space-x-1">
            <button type="button" disabled aria-label="上一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40"><ChevronLeft size={12} /></button>
            <button type="button" disabled aria-current="page" className="w-6 h-6 flex items-center justify-center bg-[#00C06B] text-white rounded font-bold">1</button>
            <button type="button" disabled title="当前演示数据仅一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40">2</button>
            <button type="button" disabled title="当前演示数据仅一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40">3</button>
            <button type="button" disabled title="当前演示数据仅一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40">...</button>
            <button type="button" disabled aria-label="下一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40"><ChevronRight size={12} /></button>
          </div>
        </div>
      </div>
      {openMenu && (
        <div
          data-addon-menu
          className="fixed z-[90] min-w-[136px] rounded-xl border border-[#E8E8E8] bg-white py-2 text-left shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          style={{ top: openMenu.top, left: Math.max(16, openMenu.left) }}
        >
          {(activeTabId === 'all'
            ? [
                { key: 'change_price', label: '改价' },
                { key: 'print', label: '打印设置' },
                { key: 'delete', label: '删除加料', danger: true },
              ]
            : [
                { key: 'change_price', label: '改价' },
                { key: 'log', label: '操作日志' },
                { key: 'print', label: '打印设置' },
                { key: 'delete', label: '删除加料', danger: true },
              ]).map(item => (
            <button
              key={item.key}
              onClick={() => handleAction(openMenu.addon, item.key as 'change_price' | 'print' | 'delete' | 'log')}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#F7F8FA] ${
                item.danger ? 'text-[#EF4444]' : 'text-[#00C06B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {shelfDialog && (
        <WebShelfConfirmModal
          entityLabel="加料"
          itemName={shelfDialog.name}
          availableChannels={DEFAULT_CHANNELS.map(channel => channel.id) as ShelfChannelId[]}
          channelStatuses={shelfDialog.channelStatuses}
          activeTabId={activeTabId}
          isShelvesUnited={isShelvesUnited}
          onClose={() => setShelfDialog(null)}
          onConfirm={handleShelfConfirm}
        />
      )}
      {batchShelfDialog && (
        <AddonBatchShelfModal
          action={batchShelfDialog.action}
          count={batchShelfDialog.count}
          availableChannels={DEFAULT_CHANNELS.map(channel => channel.id) as ShelfChannelId[]}
          isShelvesUnited={isShelvesUnited}
          onClose={() => setBatchShelfDialog(null)}
          onConfirm={handleBatchShelfConfirm}
        />
      )}
      {stockDialog && (
        <WebStockoutModal
          itemName={stockDialog.name}
          entityLabel="加料"
          channels={DEFAULT_CHANNELS.map(channel => channel.id) as ShelfChannelId[]}
          isStockShared={isStockShared}
          isMultiSpec={Boolean(stockDialog.isMultiSpec)}
          specs={stockDialog.specs}
          defaultRemainStock="0"
          defaultNextDayUnlimited={!isStockShared}
          onClose={() => setStockDialog(null)}
          onConfirm={handleStockConfirm}
        />
      )}
      {deleteDialog && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45">
          <div className="w-[630px] rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex justify-end px-5 pt-5">
              <button onClick={() => setDeleteDialog(null)} className="text-[#999] hover:text-[#333]">
                <X size={22} />
              </button>
            </div>
            <div className="px-10 pb-8 pt-2">
              <div className="flex items-center">
                <div className="mr-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF2DA] text-[#D89B25]">
                  <AlertTriangle size={22} />
                </div>
                <div className="text-[17px] leading-8 text-[#666]">
                  {deleteDialog.mode === 'single'
                    ? (activeTabId === 'all'
                        ? '加料将从所有在售渠道中删除，删除后不可恢复请谨慎操作！确认删除该加料嘛？'
                        : '确认删除该加料吗？删除后不可恢复请谨慎操作！')
                    : (activeTabId === 'all'
                        ? `加料将从所有在售渠道中删除，删除后不可恢复请谨慎操作！确认删除已选${deleteDialog.count}个加料嘛？`
                        : `确认删除已选${deleteDialog.count}个加料吗？删除后不可恢复请谨慎操作！`)}
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setDeleteDialog(null)} className="rounded-lg border border-[#D9D9D9] px-8 py-3 text-[15px] text-[#666] hover:bg-gray-50">
                  取消
                </button>
                <button onClick={handleDeleteConfirm} className="rounded-lg bg-[#22C55E] px-8 py-3 text-[15px] font-bold text-white hover:bg-[#16A34A]">
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {batchPriceDialog && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45">
          <div className="w-[980px] rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between px-7 py-6">
              <div className="text-[24px] font-medium text-[#333]">批量改价</div>
              <button onClick={() => setBatchPriceDialog(null)} className="text-[#999] hover:text-[#333]">
                <X size={24} />
              </button>
            </div>
            <div className="px-7 pb-8">
              <div className="rounded bg-[#F7F8FA] px-5 py-4 text-[16px] leading-9 text-[#666]">
                <div><span className="mr-2 text-[#FF2D20]">•</span>1、本次修改只针对价格范围内的生效，例如：原价1元，减价10元，则不生效</div>
                <div><span className="mr-2 text-[#FF2D20]">•</span>2、多规格商品修改针对每个规格都生效</div>
              </div>
              <div className="mt-8 space-y-8">
                <BatchEditRow label="改价商品">
                  <div className="text-[18px] text-[#666]">已选<span className="mx-1 font-bold text-[#00C06B]">{batchPriceDialog.count}</span>个商品</div>
                </BatchEditRow>
                <BatchEditRow label="改价类型">
                  <div className="flex gap-4">
                    <select
                      value={batchPriceDialog.priceType}
                      onChange={e => setBatchPriceDialog({ ...batchPriceDialog, priceType: e.target.value as AddonBatchPriceDialogState['priceType'] })}
                      className="h-[46px] w-[340px] rounded-lg border border-[#D9D9D9] px-4 text-[16px] text-[#666] outline-none"
                    >
                      <option value="increase">加价</option>
                      <option value="decrease">减价</option>
                      <option value="set">定价</option>
                    </select>
                    <select
                      value={batchPriceDialog.valueType}
                      onChange={e => setBatchPriceDialog({ ...batchPriceDialog, valueType: e.target.value as AddonBatchPriceDialogState['valueType'] })}
                      className="h-[46px] w-[340px] rounded-lg border border-[#D9D9D9] px-4 text-[16px] text-[#666] outline-none"
                    >
                      <option value="amount">按金额</option>
                      <option value="percent">按百分比</option>
                    </select>
                  </div>
                </BatchEditRow>
                <BatchEditRow label="改价幅度">
                  <div className="flex items-center">
                    <NumberStepper
                      value={batchPriceDialog.amount || '请输入'}
                      onMinus={() => setBatchPriceDialog(prev => prev ? ({ ...prev, amount: `${Math.max(0, Number(prev.amount || 0) - 1)}` }) : prev)}
                      onPlus={() => setBatchPriceDialog(prev => prev ? ({ ...prev, amount: `${Number(prev.amount || 0) + 1}` }) : prev)}
                    />
                    <input
                      value={batchPriceDialog.amount}
                      onChange={e => setBatchPriceDialog({ ...batchPriceDialog, amount: e.target.value.replace(/[^\d.]/g, '') })}
                      placeholder={batchPriceDialog.valueType === 'amount' ? '请输入改价金额' : '请输入百分比'}
                      className="ml-4 h-[46px] w-[220px] rounded-lg border border-[#D9D9D9] px-4 text-[16px] text-[#666] outline-none"
                    />
                  </div>
                </BatchEditRow>
              </div>
              <div className="mt-12 flex justify-end gap-4">
                <button onClick={() => setBatchPriceDialog(null)} className="h-[50px] rounded-md border border-[#D9D9D9] px-10 text-[18px] text-[#666] hover:bg-[#FAFAFA]">
                  取消
                </button>
                <button onClick={handleBatchPriceConfirm} className="h-[50px] rounded-md bg-[#11B45C] px-10 text-[18px] font-medium text-white hover:bg-[#0D9D50]">
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editDialog && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45">
          <div className="w-[640px] rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-[#EFEFEF] px-7 py-5">
              <div className="text-[18px] font-bold text-[#333]">加料编辑</div>
              <button onClick={() => setEditDialog(null)} className="text-[#999] hover:text-[#333]">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6 px-7 py-7">
              <EditRow label="加料名称">
                <input
                  value={editDialog.name}
                  disabled
                  className="h-[44px] w-[312px] rounded-lg border border-[#E5E7EB] bg-[#F5F6FA] px-4 text-[15px] text-[#999] outline-none"
                />
              </EditRow>
              <EditRow label="价格">
                <NumberStepper value={editDialog.price.toFixed(2)} onMinus={() => handleEditNumberChange('price', -1)} onPlus={() => handleEditNumberChange('price', 1)} />
              </EditRow>
              <EditRow label="成本价">
                <NumberStepper value={editDialog.costPrice.toFixed(2)} onMinus={() => handleEditNumberChange('costPrice', -1)} onPlus={() => handleEditNumberChange('costPrice', 1)} />
              </EditRow>
              <EditRow label="库存设置" required>
                <div className="flex items-center gap-8 text-[16px] text-[#666]">
                  <label className="flex cursor-pointer items-center">
                    <input
                      type="radio"
                      checked={editDialog.stockMode === 'unlimited'}
                      onChange={() => setEditDialog({ ...editDialog, stockMode: 'unlimited' })}
                      className="mr-3 h-5 w-5 accent-[#00C06B]"
                    />
                    无限库存
                  </label>
                  <label className="flex cursor-pointer items-center text-[#00C06B]">
                    <input
                      type="radio"
                      checked={editDialog.stockMode === 'custom'}
                      onChange={() => setEditDialog({ ...editDialog, stockMode: 'custom' })}
                      className="mr-3 h-5 w-5 accent-[#00C06B]"
                    />
                    自定义库存
                  </label>
                </div>
              </EditRow>
              {editDialog.stockMode === 'custom' && (
                <>
                  <EditRow label="库存">
                    <NumberStepper value={`${editDialog.stockCount}`} onMinus={() => handleEditNumberChange('stockCount', -1)} onPlus={() => handleEditNumberChange('stockCount', 1)} />
                  </EditRow>
                  <EditRow label="">
                    <div className="space-y-3 text-[16px]">
                      <label className="flex cursor-pointer items-center text-[#00C06B]">
                        <input
                          type="radio"
                          checked={editDialog.replenishMode === 'none'}
                          onChange={() => setEditDialog({ ...editDialog, replenishMode: 'none' })}
                          className="mr-3 h-5 w-5 accent-[#00C06B]"
                        />
                        不自动补足库存
                      </label>
                      <label className="flex cursor-pointer items-center text-[#666]">
                        <input
                          type="radio"
                          checked={editDialog.replenishMode === 'max'}
                          onChange={() => setEditDialog({ ...editDialog, replenishMode: 'max' })}
                          className="mr-3 h-5 w-5 accent-[#00C06B]"
                        />
                        自动补足库存为最大值
                      </label>
                      <label className="flex cursor-pointer items-center text-[#666]">
                        <input
                          type="radio"
                          checked={editDialog.replenishMode === 'unlimited'}
                          onChange={() => setEditDialog({ ...editDialog, replenishMode: 'unlimited' })}
                          className="mr-3 h-5 w-5 accent-[#00C06B]"
                        />
                        自动补足库存为无限库存
                      </label>
                    </div>
                    <CircleHelp size={18} className="ml-4 mt-1 text-[#999]" />
                  </EditRow>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-[#EFEFEF] px-7 py-5">
              <button onClick={() => setEditDialog(null)} className="rounded-lg border border-[#D9D9D9] px-8 py-3 text-[15px] text-[#666] hover:bg-gray-50">
                取消
              </button>
              <button onClick={handleEditSave} className="rounded-lg bg-[#22C55E] px-8 py-3 text-[15px] font-bold text-white hover:bg-[#16A34A]">
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditRow = ({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex items-start">
    <div className="w-[118px] pt-2 text-right text-[16px] text-[#666]">
      {required && <span className="mr-1 text-[#FF4D4F]">*</span>}
      {label}
      {label ? '：' : ''}
    </div>
    <div className="ml-5 flex flex-1 items-start">{children}</div>
  </div>
);

const NumberStepper = ({
  value,
  onMinus,
  onPlus,
}: {
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) => (
  <div className="flex h-[48px] overflow-hidden rounded-lg border border-[#D9D9D9]">
    <button type="button" onClick={onMinus} className="flex w-[48px] items-center justify-center bg-[#F8F8F8] text-[#999] hover:bg-[#F1F5F9]">
      <Minus size={18} />
    </button>
    <div className="flex w-[96px] items-center justify-center border-x border-[#D9D9D9] text-[18px] text-[#666]">
      {value}
    </div>
    <button type="button" onClick={onPlus} className="flex w-[48px] items-center justify-center bg-[#F8F8F8] text-[#666] hover:bg-[#F1F5F9]">
      <Plus size={18} />
    </button>
  </div>
);

const BatchEditRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center">
    <div className="w-[140px] shrink-0 text-[18px] text-[#666]">{label}：</div>
    <div className="flex-1">{children}</div>
  </div>
);

const AddonBatchShelfModal = ({
  action,
  count,
  availableChannels,
  isShelvesUnited,
  onClose,
  onConfirm,
}: {
  action: 'on_shelf' | 'off_shelf';
  count: number;
  availableChannels: ShelfChannelId[];
  isShelvesUnited: boolean;
  onClose: () => void;
  onConfirm: (channels: ShelfChannelId[]) => void;
}) => {
  const [selectedChannels, setSelectedChannels] = useState<ShelfChannelId[]>(availableChannels);
  const allChecked = selectedChannels.length === availableChannels.length;

  const toggleChannel = (channelId: ShelfChannelId) => {
    setSelectedChannels(prev =>
      prev.includes(channelId) ? prev.filter(item => item !== channelId) : [...prev, channelId]
    );
  };

  const toggleAll = () => {
    setSelectedChannels(allChecked ? [] : availableChannels);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-[1020px] max-w-[calc(100vw-48px)] rounded-[18px] bg-white shadow-2xl">
        <div className="flex items-center justify-between px-8 pt-8">
          <h3 className="text-[22px] font-bold text-[#333]">确认{action === 'on_shelf' ? '上架' : '下架'}加料吗?</h3>
          <button onClick={onClose} className="text-[#999] transition-colors hover:text-[#333]">
            <X size={22} />
          </button>
        </div>
        <div className="px-8 pb-8 pt-6">
          <div className="text-[18px] text-[#333]">
            {action === 'on_shelf' ? '上架' : '下架'}加料: <span className="font-bold">已选择 <span className="text-[#00C06B]">{count}</span> 个加料</span>
          </div>

          {!isShelvesUnited && (
            <div className="mt-5 rounded-xl bg-[#F7F8FA] px-8 py-6">
              <div className="mb-6 text-[18px] font-bold text-[#333]">选择渠道</div>
              <label className="mb-8 flex cursor-pointer items-center text-[15px] text-[#00A862]">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="mr-3 h-5 w-5 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]"
                />
                全选
              </label>
              <div className="flex flex-wrap">
                {availableChannels.map(channelId => (
                  <label key={channelId} className="mr-10 mb-5 flex cursor-pointer items-center text-[15px] text-[#00A862]">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(channelId)}
                      onChange={() => toggleChannel(channelId)}
                      className="mr-3 h-5 w-5 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]"
                    />
                    {getShelfChannelLabel(channelId)}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-[18px] leading-[32px] text-[#666]">
            {isShelvesUnited ? (
              <>
                大批量门店加料批量{action === 'on_shelf' ? '上架' : '下架'}商品，
                <span className="text-[#00C06B]">点击跳转操作</span>
              </>
            ) : null}
          </div>

          <div className="mt-11 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="h-[50px] rounded-md border border-[#D9D9D9] px-10 text-[18px] text-[#666] transition-colors hover:bg-[#FAFAFA]"
            >
              取消
            </button>
            <button
              onClick={() => onConfirm(isShelvesUnited ? availableChannels : selectedChannels)}
              disabled={!isShelvesUnited && selectedChannels.length === 0}
              className="h-[50px] rounded-md bg-[#11B45C] px-10 text-[18px] font-medium text-white transition-colors hover:bg-[#0D9D50] disabled:cursor-not-allowed disabled:bg-[#A7DDBE]"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
