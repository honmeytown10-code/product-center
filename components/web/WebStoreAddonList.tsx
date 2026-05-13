import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, ChevronDown, MoreHorizontal, FileUp,
  ArrowUpDown, ChevronLeft, ChevronRight, Store, Bike, UtensilsCrossed, ShoppingBag
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

const FilterInput = ({ label, placeholder }: { label: string; placeholder: string }) => (
  <div className="flex items-center">
    <span className="text-xs text-[#666] mr-2 shrink-0">{label}</span>
    <input className="w-[170px] h-[34px] px-3 border border-[#E8E8E8] rounded text-sm focus:border-[#00C06B] focus:outline-none transition-colors" placeholder={placeholder} />
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

const FilterSelect = ({ label, placeholder }: { label: string; placeholder: string }) => (
  <div className="flex items-center">
    <span className="text-xs text-[#666] mr-2 shrink-0">{label}</span>
    <div className="relative">
      <button className="flex items-center justify-between w-[150px] h-[34px] px-3 border border-[#E8E8E8] rounded text-sm text-[#333] bg-white hover:border-[#00C06B] transition-colors">
        <span className="truncate">{placeholder}</span>
        <ChevronDown size={14} className="text-[#999] ml-2 shrink-0" />
      </button>
    </div>
  </div>
);

export const WebStoreAddonList: React.FC = () => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = brandConfigs[activeBrandId];
  const isShelvesUnited = config?.features.shelves_unite ?? false;
  const isStockShared = config?.features.stock_shared ?? false;
  const [activeTabId, setActiveTabId] = useState('all');
  const [activeStoreId, setActiveStoreId] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [stockDialog, setStockDialog] = useState<StoreAddonRecord | null>(null);
  const [shelfDialog, setShelfDialog] = useState<StoreAddonRecord | null>(null);
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
    let filtered = MOCK_STORE_ADDONS;

    if (activeStoreId !== 'all') {
      filtered = filtered.filter(item => item.storeId === activeStoreId);
    }

    if (activeTabId !== 'all') {
      filtered = filtered.filter(item => activeTabId in item.channelStatuses);
    }

    const trimKeyword = keyword.trim().toLowerCase();
    if (trimKeyword) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(trimKeyword) || item.id.includes(trimKeyword)
      );
    }

    return filtered;
  }, [activeStoreId, activeTabId, keyword]);

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
    const channelLabel = activeTabId === 'all' ? '全部渠道' : (CHANNEL_DEFS[activeTabId as ChannelId]?.label || activeTabId);
    const labels = {
      shelf: addon.channelStatuses[activeTabId as ChannelId] === 'on_shelf' ? '下架' : '上架',
      batch_shelf: '上下架',
      edit: '编辑',
      stock: '沽清',
      change_price: '改价',
      print: '打印设置',
      delete: '删除商品',
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
          { key: 'delete', label: '删除商品', danger: true },
        ]
      : [
          { key: 'change_price', label: '改价' },
          { key: 'log', label: '操作日志' },
          { key: 'print', label: '打印设置' },
          { key: 'delete', label: '删除商品', danger: true },
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
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
        <div className="p-5 border-b border-[#E8E8E8] bg-white space-y-4 shrink-0 z-20">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterInput label="加料名称" placeholder="请输入" />
            <FilterInput label="加料ID" placeholder="请输入" />
            <FilterNativeSelect label="机构门店" options={STORE_OPTIONS} value={activeStoreId} onChange={setActiveStoreId} />
            <FilterSelect label="售卖状态" placeholder="全部" />
            <FilterSelect label="库存状态" placeholder="请选择" />
            <FilterSelect label="是否独立售卖" placeholder="全部" />
            <button className="h-[34px] px-3 border border-dashed border-[#AAA] text-[#666] rounded hover:border-[#00C06B] hover:text-[#00C06B] transition-colors text-xs flex items-center bg-white">
              <Plus size={14} className="mr-1" /> 添加筛选
            </button>
          </div>

          <div className="flex justify-between items-center gap-4">
            <button className="flex items-center text-xs text-[#666] border border-[#E8E8E8] px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
              <FileUp size={14} className="mr-1.5" /> 保存快捷筛选选项
            </button>
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
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-[#E8E8E8] rounded w-56 text-sm focus:border-[#00C06B] focus:outline-none transition-colors"
                placeholder="搜索加料名称/ID"
              />
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
          </div>
        </div>

        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1020px]">
            <thead className="sticky top-0 bg-[#F7F8FA] z-10 text-xs font-bold text-[#333]">
              <tr>
                <th className="w-12 py-3 pl-5 border-b border-[#E8E8E8]"><input type="checkbox" className="rounded border-gray-300" /></th>
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
              {filteredAddons.map(addon => (
                <tr key={`${addon.id}-${addon.storeId}`} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC] transition-colors group">
                  <td className="py-4 pl-5"><input type="checkbox" className="rounded border-gray-300" /></td>
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
              ))}
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
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B] disabled:opacity-50"><ChevronLeft size={12} /></button>
            <button className="w-6 h-6 flex items-center justify-center bg-[#00C06B] text-white rounded font-bold">1</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">2</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">3</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">...</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]"><ChevronRight size={12} /></button>
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
                { key: 'delete', label: '删除商品', danger: true },
              ]
            : [
                { key: 'change_price', label: '改价' },
                { key: 'log', label: '操作日志' },
                { key: 'print', label: '打印设置' },
                { key: 'delete', label: '删除商品', danger: true },
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
    </div>
  );
};
