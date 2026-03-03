
import React, { useState } from 'react';
import { 
  ChevronLeft, Search, Plus, X, ChevronDown, CheckCircle2, Circle, 
  Trash2, Smartphone, Store, ShoppingBag, 
  ArrowUp, ArrowDown, Ban, RefreshCw, LayoutGrid, Check, Settings, CheckSquare,
  Printer, AlertTriangle, Delete, Link2Off, ChevronRight
} from 'lucide-react';
import { ChannelType } from './types';
import { MobileProductChannelSelector } from './MobileProductChannelSelector';

// --- Types ---
interface LocalAddon {
  id: string;
  name: string;
  category: string;
  price: string;
  cost?: string;
  code?: string;
  image?: string;
  stockType: 'unlimited' | 'custom';
  stock: number;
  status: 'on_shelf' | 'off_shelf'; // Global status
  stockStatus: 'available' | 'sold_out';
  channels: Record<ChannelType, 'on_shelf' | 'off_shelf' | 'unmapped'>;
  channelStocks?: Record<ChannelType, number>;
  isIndependent?: boolean;
}

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  isStockShared: boolean;
  isShelvesUnited: boolean;
}

// --- Mock Data ---
const MOCK_ADDONS: LocalAddon[] = [
  { 
    id: 'a1', name: '珍珠', category: '小料', price: '2.00', stockType: 'unlimited', stock: 9999, status: 'on_shelf', stockStatus: 'available',
    channels: { all: 'on_shelf', mini: 'on_shelf', pos: 'on_shelf', meituan: 'on_shelf', taobao: 'on_shelf', jingdong: 'on_shelf' } as any,
    isIndependent: false
  },
  { 
    id: 'a2', name: '椰果', category: '小料', price: '2.00', stockType: 'unlimited', stock: 9999, status: 'on_shelf', stockStatus: 'available',
    channels: { all: 'on_shelf', mini: 'on_shelf', pos: 'on_shelf', meituan: 'off_shelf', taobao: 'on_shelf', jingdong: 'on_shelf' } as any
  },
  { 
    id: 'a3', name: '奥利奥碎', category: '小料', price: '3.00', stockType: 'custom', stock: 50, status: 'on_shelf', stockStatus: 'available',
    channels: { all: 'on_shelf', mini: 'on_shelf', pos: 'on_shelf', meituan: 'on_shelf', taobao: 'off_shelf', jingdong: 'unmapped' } as any,
    channelStocks: { all: 50, mini: 20, pos: 30, meituan: 0, taobao: 0 } as any
  },
  { 
    id: 'a4', name: '芝士奶盖', category: '奶盖', price: '5.00', stockType: 'custom', stock: 0, status: 'on_shelf', stockStatus: 'sold_out',
    channels: { all: 'on_shelf', mini: 'on_shelf', pos: 'on_shelf', meituan: 'on_shelf', taobao: 'on_shelf', jingdong: 'on_shelf' } as any,
    channelStocks: { all: 0, mini: 0, pos: 0, meituan: 0, taobao: 0 } as any
  },
  { 
    id: 'a5', name: '换燕麦奶', category: '基底', price: '4.00', stockType: 'unlimited', stock: 9999, status: 'off_shelf', stockStatus: 'available',
    channels: { all: 'off_shelf', mini: 'off_shelf', pos: 'off_shelf', meituan: 'off_shelf', taobao: 'off_shelf', jingdong: 'off_shelf' } as any
  },
];

const MOCK_CATEGORIES = ['全部', '默认类型', '小料', '奶盖', '基底'];

const ALL_CHANNELS_DEF: { id: ChannelType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: '全部渠道', icon: <LayoutGrid size={14}/>, color: 'text-gray-800' },
  { id: 'mini', label: '小程序', icon: <Smartphone size={14}/>, color: 'text-green-600' },
  { id: 'meituan', label: '美团外卖', icon: <Store size={14}/>, color: 'text-yellow-600' },
  { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={14}/>, color: 'text-orange-600' },
  { id: 'pos', label: 'POS收银', icon: <Printer size={14}/>, color: 'text-blue-600' },
];

export const MobileAddonManager: React.FC<Props> = ({ onBack, onNavigate, isStockShared, isShelvesUnited }) => {
  const [view, setView] = useState<'list' | 'form' | 'sort'>('list');
  const [editingAddon, setEditingAddon] = useState<LocalAddon | null>(null);
  const [addons, setAddons] = useState<LocalAddon[]>(MOCK_ADDONS);
  const [activeChannel, setActiveChannel] = useState<ChannelType>('all');
  const [showChannelSheet, setShowChannelSheet] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('全部');

  // Modal States
  const [shelfManageItem, setShelfManageItem] = useState<LocalAddon | null>(null);
  const [clearanceItem, setClearanceItem] = useState<LocalAddon | null>(null);

  // --- Actions ---
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === addons.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(addons.map(a => a.id)));
  };

  const handleBatchAction = (action: 'on' | 'off' | 'sold_out' | 'restore') => {
    setAddons(prev => prev.map(item => {
        if (!selectedIds.has(item.id)) return item;
        const updates: Partial<LocalAddon> = {};
        if (action === 'on' || action === 'off') {
            const targetStatus = action === 'on' ? 'on_shelf' : 'off_shelf';
            if (isShelvesUnited || activeChannel === 'all') {
                updates.status = targetStatus;
                const newChannels = { ...item.channels };
                (Object.keys(newChannels) as ChannelType[]).forEach(k => { if(newChannels[k] !== 'unmapped') newChannels[k] = targetStatus; });
                updates.channels = newChannels;
            } else {
                if (item.channels[activeChannel] !== 'unmapped') {
                    updates.channels = { ...item.channels, [activeChannel]: targetStatus };
                }
            }
        }
        if (action === 'sold_out') { updates.stockStatus = 'sold_out'; updates.stock = 0; }
        if (action === 'restore') { updates.stockStatus = 'available'; updates.stock = 9999; }
        return { ...item, ...updates };
    }));
    setIsBatchMode(false);
    setSelectedIds(new Set());
  };

  const toggleShelfStatus = (id: string) => {
      setAddons(prev => prev.map(a => {
          if (a.id !== id) return a;
          const current = activeChannel === 'all' ? a.status : a.channels[activeChannel];
          const next = current === 'on_shelf' ? 'off_shelf' : 'on_shelf';
          
          if (activeChannel === 'all') {
              return { ...a, status: next }; 
          } else {
              return { ...a, channels: { ...a.channels, [activeChannel]: next } };
          }
      }));
  };

  const handleToggleChannelStatus = (channel: ChannelType) => {
      if (!shelfManageItem) return;
      setAddons(prev => prev.map(a => {
          if (a.id !== shelfManageItem.id) return a;
          const current = a.channels[channel];
          if (current === 'unmapped') return a;
          const next = current === 'on_shelf' ? 'off_shelf' : 'on_shelf';
          return { ...a, channels: { ...a.channels, [channel]: next } };
      }));
  };

  const handleSave = (addon: LocalAddon) => {
      if (editingAddon) {
          setAddons(prev => prev.map(a => a.id === addon.id ? addon : a));
      } else {
          setAddons(prev => [addon, ...prev]);
      }
      setEditingAddon(null);
      setView('list');
  };

  const handleSort = (items: LocalAddon[]) => {
      setAddons(items);
      setView('list');
  };

  const displayAddons = addons.filter(a => selectedCategory === '全部' || a.category === selectedCategory);

  // --- Renderers ---

  if (view === 'form') {
      return <AddonForm initialItem={editingAddon} onBack={() => { setView('list'); setEditingAddon(null); }} onSave={handleSave} />;
  }

  if (view === 'sort') {
      return <AddonSorter items={addons} onBack={() => setView('list')} onSave={handleSort} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full font-sans select-none">
        {/* Header */}
        <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black"><ChevronLeft size={24}/></button>
            <span className="font-bold text-base">加料管理</span>
            <button onClick={() => setView('sort')} className="p-2 -mr-2 text-gray-600 font-bold text-sm">排序</button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-3 flex items-center space-x-2 bg-white shrink-0 shadow-sm z-10">
            <div onClick={() => setShowChannelSheet(true)} className="flex items-center bg-gray-100 pl-3 pr-2 py-2 rounded-lg cursor-pointer active:bg-gray-200 transition-colors">
                <span className="text-xs font-bold text-gray-700 mr-1 whitespace-nowrap">{ALL_CHANNELS_DEF.find(c => c.id === activeChannel)?.label}</span>
                <ChevronDown size={12} className="text-gray-400"/>
            </div>
            <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                <input className="w-full pl-9 pr-4 py-2 bg-transparent text-sm outline-none placeholder:text-gray-400 font-bold" placeholder="搜索加料..."/>
            </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
            {/* Category Sidebar */}
            <div className="w-22 bg-[#F8FAFB] overflow-y-auto no-scrollbar pb-20 border-r border-gray-100 shrink-0 flex flex-col">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {MOCK_CATEGORIES.map(cat => (
                        <div key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2 py-4 text-[11px] text-center font-bold border-l-4 transition-all relative ${selectedCategory === cat ? 'bg-white text-[#00C06B] border-[#00C06B]' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}>
                            {cat}
                        </div>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24 bg-gray-50">
                {displayAddons.map(addon => {
                    const isSelected = selectedIds.has(addon.id);
                    let isOnShelf = false;
                    
                    if (activeChannel === 'all') {
                        isOnShelf = addon.status === 'on_shelf';
                    } else {
                        isOnShelf = addon.channels[activeChannel] === 'on_shelf';
                    }
                    
                    const isSoldOut = addon.stockStatus === 'sold_out';

                    return (
                        <div 
                            key={addon.id} 
                            onClick={() => {
                                if (isBatchMode) {
                                    toggleSelection(addon.id);
                                } else {
                                    setEditingAddon(addon);
                                    setView('form');
                                }
                            }}
                            className={`bg-white p-4 rounded-xl border transition-all relative overflow-hidden shadow-sm ${isBatchMode && isSelected ? 'border-[#00C06B] ring-1 ring-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100'} active:bg-gray-50 cursor-pointer`}
                        >
                            <div className="flex">
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-base font-black text-gray-800 line-clamp-1 flex-1">{addon.name}</h4>
                                            
                                            {/* Status logic modified: If not united and view is all, show icon indicators */}
                                            {activeChannel === 'all' ? (
                                              <div className="flex items-center gap-1 mt-1">
                                                {ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(ch => {
                                                  const status = addon.channels[ch.id];
                                                  const isOn = status === 'on_shelf';
                                                  const isUnmapped = status === 'unmapped';
                                                  return (
                                                    <div 
                                                      key={ch.id} 
                                                      className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all ${
                                                        isUnmapped ? 'bg-gray-50 border-gray-200 border-dashed text-gray-300' : 
                                                        isOn ? `${ch.id === 'pos' ? 'bg-blue-50 border-blue-100 text-blue-500' : ch.id === 'mini' ? 'bg-green-50 border-green-100 text-green-500' : ch.id === 'meituan' ? 'bg-yellow-50 border-yellow-100 text-yellow-500' : 'bg-orange-50 border-orange-100 text-orange-500'}` : 
                                                        'bg-gray-50 border-gray-200 text-gray-300 grayscale'
                                                      }`}
                                                    >
                                                      {isUnmapped ? <Link2Off size={8}/> : <span className="scale-[0.6]">{ch.icon}</span>}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <span className={`text-[9px] px-1.5 py-0.5 rounded border ml-2 whitespace-nowrap font-bold ${!isOnShelf ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                  {isOnShelf ? '已上架' : '已下架'}
                                              </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-1">
                                        <div className="font-mono text-lg font-black text-[#1F2129]"><span className="text-xs mr-0.5">¥</span>{addon.price}</div>
                                        {activeChannel === 'all' && !isStockShared ? (
                                            <div className="flex items-center bg-gray-50 px-2 py-1 rounded text-[10px] font-bold text-gray-400 border border-gray-100">多渠道库存</div>
                                        ) : (
                                            isSoldOut ? (
                                                <div className="flex items-center bg-red-50 px-2 py-1 rounded text-[10px] font-bold text-red-500 border border-red-100">已售罄</div>
                                            ) : (
                                                <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-[10px] font-bold text-blue-600 border border-blue-100">库存 {addon.stockType === 'unlimited' ? '99+' : addon.stock}</div>
                                            )
                                        )}
                                    </div>
                                </div>
                                {isBatchMode && (<div className="ml-3 shrink-0 flex items-center justify-center">{isSelected ? <CheckCircle2 className="text-[#00C06B]" size={20} fill="currentColor" color="white"/> : <Circle className="text-gray-300" size={20}/>}</div>)}
                            </div>

                            {/* Quick Actions (Non-Batch) */}
                            {!isBatchMode && (
                                <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-50">
                                    {activeChannel === 'all' ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setShelfManageItem(addon); }} 
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold active:bg-opacity-80 transition-colors ${isShelvesUnited ? (addon.status === 'on_shelf' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600') : 'bg-gray-100 text-gray-600'}`}
                                        >
                                            {isShelvesUnited ? (addon.status === 'on_shelf' ? '下架' : '上架') : '上下架管理'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleShelfStatus(addon.id); }} 
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold active:bg-opacity-80 transition-colors ${isOnShelf ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}
                                        >
                                            {isOnShelf ? '下架' : '上架'}
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); setClearanceItem(addon); }} className="flex-1 bg-[#00C06B] text-white py-2 rounded-lg text-xs font-bold active:bg-[#00A35B] shadow-sm shadow-green-100">
                                        沽清
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        
        {/* Modals */}
        {shelfManageItem && <ShelfManagementModal item={shelfManageItem} onClose={() => setShelfManageItem(null)} isShelvesUnited={isShelvesUnited} onToggleChannel={handleToggleChannelStatus} />}
        {clearanceItem && <ClearanceModal item={clearanceItem} onClose={() => setClearanceItem(null)} activeChannel={activeChannel} isStockShared={isStockShared} />}
        
        {/* Bottom Bar */}
        {isBatchMode ? (
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-30 shadow-lg animate-in slide-in-from-bottom">
                <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-xs font-bold text-gray-500">已选 {selectedIds.size} 项</span>
                    <button onClick={selectAll} className="text-xs font-bold text-[#00C06B]">全选</button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <BatchBtn icon={<ArrowUp size={16}/>} label="上架" onClick={() => handleBatchAction('on')} />
                    <BatchBtn icon={<ArrowDown size={16}/>} label="下架" onClick={() => handleBatchAction('off')} />
                    <BatchBtn icon={<Ban size={16}/>} label="沽清" onClick={() => handleBatchAction('sold_out')} danger />
                    <BatchBtn icon={<RefreshCw size={16}/>} label="取消沽清" onClick={() => handleBatchAction('restore')} />
                </div>
                <button onClick={() => setIsBatchMode(false)} className="w-full mt-3 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">取消批量</button>
            </div>
        ) : (
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button onClick={() => onNavigate('addon_type_list')} className="flex flex-col items-center justify-center px-2 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 active:bg-gray-50 min-w-[72px]">
                    <Settings size={20} className="mb-1"/>
                    <span className="text-[10px] font-bold">加料类型</span>
                </button>
                <button onClick={() => setIsBatchMode(true)} className="flex flex-col items-center justify-center px-2 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 active:bg-gray-50 min-w-[72px]">
                    <CheckSquare size={20} className="mb-1"/>
                    <span className="text-[10px] font-bold">批量管理</span>
                </button>
                <button onClick={() => { setEditingAddon(null); setView('form'); }} className="flex-1 py-2 bg-[#1F2129] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center">
                    <Plus size={24} className="mb-0.5"/>
                    <span className="text-[10px]">新建加料</span>
                </button>
            </div>
        )}

        {/* Channel Sheet */}
        {showChannelSheet && (
            <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in">
                <div onClick={() => setShowChannelSheet(false)} className="flex-1"></div>
                <div className="bg-white rounded-t-[24px] p-4 animate-in slide-in-from-bottom duration-300">
                    <div className="flex justify-between items-center mb-4 px-2 pt-2">
                        <span className="font-black text-lg text-[#1F2129]">切换渠道视角</span>
                        <button onClick={() => setShowChannelSheet(false)} className="bg-gray-100 p-1.5 rounded-full"><X size={16}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {ALL_CHANNELS_DEF.map(ch => (
                            <div key={ch.id} onClick={() => { setActiveChannel(ch.id); setShowChannelSheet(false); }} className={`flex items-center p-3.5 rounded-xl border-2 cursor-pointer transition-all ${activeChannel === ch.id ? 'border-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100 bg-white'}`}>
                                <div className={`mr-3 ${activeChannel === ch.id ? 'text-[#00C06B]' : 'text-gray-400'}`}>{ch.icon}</div>
                                <span className="text-sm font-bold">{ch.label}</span>
                                {activeChannel === ch.id && <Check size={16} className="ml-auto text-[#00C06B]"/>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const BatchBtn = ({ icon, label, onClick, danger }: { icon: React.ReactNode, label: string, onClick: () => void, danger?: boolean }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all active:scale-95 ${danger ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-200 text-gray-700'}`}>
        <div className="mb-1">{icon}</div>
        <span className="text-[11px] font-bold">{label}</span>
    </button>
);

// --- Modals ---

const ShelfManagementModal = ({ item, onClose, isShelvesUnited, onToggleChannel }: { 
    item: LocalAddon, 
    onClose: () => void, 
    isShelvesUnited: boolean,
    onToggleChannel: (channel: ChannelType) => void 
}) => {
    const globalOn = item.status === 'on_shelf';
    const getChannelStatus = (ch: ChannelType) => ch === 'all' ? item.status : item.channels[ch];

    return (
        <div className="absolute inset-0 bg-black/60 z-[60] flex flex-col justify-end animate-in fade-in">
            <div onClick={onClose} className="flex-1"></div>
            <div className="bg-white rounded-t-[24px] overflow-hidden animate-in slide-in-from-bottom flex flex-col max-h-[85vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-black text-[#1F2129]">{isShelvesUnited ? (globalOn ? '下架商品' : '上架商品') : '多渠道上下架管理'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{item.name}</p>
                    </div>
                    <button onClick={onClose} className="bg-gray-50 p-1.5 rounded-full text-gray-500 shadow-sm"><X size={18}/></button>
                </div>
                {!isShelvesUnited && (
                    <div className="px-5 pt-4 pb-2">
                        <div className="bg-gray-100 p-1 rounded-xl flex">
                            <button className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all text-gray-600 hover:bg-white hover:shadow-sm">一键全上架</button>
                            <div className="w-1"></div>
                            <button className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all text-gray-600 hover:bg-white hover:shadow-sm">一键全下架</button>
                        </div>
                    </div>
                )}
                <div className="p-5 space-y-3 overflow-y-auto no-scrollbar">
                    {ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(ch => {
                        const currentStatus = getChannelStatus(ch.id);
                        const isUnmapped = currentStatus === 'unmapped';
                        const isOn = currentStatus === 'on_shelf';
                        return (
                            <div key={ch.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isUnmapped ? 'bg-gray-50 border-gray-200' : 'border-gray-100 bg-white'}`}>
                                <div className="flex items-center">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 ${isUnmapped ? 'bg-gray-200 text-gray-400' : `${ch.color.split(' ')[0]} bg-gray-50`}`}>{ch.icon}</div>
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-sm ${isUnmapped ? 'text-gray-400' : 'text-[#1F2129]'}`}>{ch.label}</span>
                                        {isUnmapped && <span className="text-[10px] text-red-400 font-medium bg-red-50 px-1.5 py-0.5 rounded w-fit mt-0.5">未建立映射关联</span>}
                                    </div>
                                </div>
                                {isUnmapped ? (<div className="px-2 py-1 rounded bg-gray-200 text-gray-400 text-[10px] font-bold">不可操作</div>) : (
                                    <div 
                                        onClick={() => !isShelvesUnited && onToggleChannel(ch.id)} 
                                        className={`w-11 h-6 rounded-full transition-colors relative ${isShelvesUnited ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${isOn ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isOn ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="p-5 border-t border-gray-100 bg-white">
                    {isShelvesUnited ? (
                        <button className={`w-full py-4 rounded-xl font-bold shadow-lg text-white transition-all active:scale-95 ${globalOn ? 'bg-[#1F2129]' : 'bg-[#00C06B]'}`}>{globalOn ? '确认统一下架' : '确认统一上架'}</button>
                    ) : (
                        <button onClick={onClose} className="w-full py-4 rounded-xl font-bold shadow-lg bg-[#1F2129] text-white transition-all active:scale-95">完成设置</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClearanceModal = ({ item, onClose, activeChannel, isStockShared }: { item: LocalAddon, onClose: () => void, activeChannel: ChannelType, isStockShared: boolean }) => {
    const [method, setMethod] = useState<'cycle' | 'total'>('cycle');
    const [values, setValues] = useState({ total: '', dayLimit: '', dayRemain: '' });
    const [focusedField, setFocusedField] = useState<keyof typeof values>('dayLimit');
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

    React.useEffect(() => {
        const allChannels = ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(c => c.id);
        if (activeChannel === 'all') setSelectedChannels(allChannels);
        else setSelectedChannels([activeChannel]);
        setFocusedField('dayLimit');
    }, [activeChannel]);

    React.useEffect(() => {
        if (method === 'total') setFocusedField('total');
        else setFocusedField('dayLimit');
    }, [method]);

    const handleNumpad = (val: string) => {
        setValues(prev => {
            const current = prev[focusedField];
            if (val === 'del') return { ...prev, [focusedField]: current.slice(0, -1) };
            if (val === '.') return current.includes('.') ? prev : { ...prev, [focusedField]: current + '.' };
            return { ...prev, [focusedField]: current + val };
        });
    };

    const toggleChannelSelection = (id: string) => {
        if (selectedChannels.includes(id)) setSelectedChannels(prev => prev.filter(c => c !== id));
        else setSelectedChannels(prev => [...prev, id]);
    };

    return (
        <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div onClick={onClose} className="flex-1"></div>
          <div className="bg-white rounded-t-[24px] overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <div><h3 className="text-lg font-black text-[#1F2129]">加料沽清设置</h3><p className="text-xs text-gray-400 mt-0.5">{item.name}</p></div>
                <button onClick={onClose} className="p-1.5 bg-white rounded-full text-gray-500 shadow-sm"><X size={18}/></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-6 no-scrollbar">
                <div className="bg-gray-100 p-1 rounded-xl flex">
                    <button onClick={() => setMethod('cycle')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${method === 'cycle' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>当日沽清</button>
                    <button onClick={() => setMethod('total')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${method === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>长期沽清</button>
                </div>
                
                <div className="space-y-3">
                    {method === 'total' ? (
                        <div onClick={() => setFocusedField('total')} className={`p-4 rounded-xl border-2 transition-all ${focusedField === 'total' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 bg-white'}`}><div className="text-[10px] text-gray-400 font-bold mb-1">可售总数</div><div className={`text-2xl font-black ${values.total ? 'text-gray-800' : 'text-gray-300'}`}>{values.total || '不限制'}</div></div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div onClick={() => setFocusedField('dayLimit')} className={`p-3 rounded-xl border-2 transition-all ${focusedField === 'dayLimit' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 bg-white'}`}><div className="text-[10px] text-gray-400 font-bold mb-1">每日限售</div><div className={`text-xl font-black ${values.dayLimit ? 'text-gray-800' : 'text-gray-300'}`}>{values.dayLimit || '不限'}</div></div>
                            <div onClick={() => setFocusedField('dayRemain')} className={`p-3 rounded-xl border-2 transition-all ${focusedField === 'dayRemain' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 bg-white'}`}><div className="text-[10px] text-gray-400 font-bold mb-1">今日剩余</div><div className={`text-xl font-black ${values.dayRemain ? 'text-gray-800' : 'text-gray-300'}`}>{values.dayRemain || '0'}</div></div></div>
                    )}
                </div>
                
                {!isStockShared && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center">
                        <AlertTriangle size={12} className="text-orange-500 mr-2"/>
                        <span className="text-[10px] font-bold text-orange-600">当前处于独立库存模式，各渠道库存互不影响</span>
                    </div>
                )}

                <div>
                    <div className="flex justify-between items-center mb-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">生效渠道</label></div>
                    <div className="flex flex-wrap gap-2">{ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(ch => (<button key={ch.id} onClick={() => toggleChannelSelection(ch.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center cursor-pointer active:scale-95 ${selectedChannels.includes(ch.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-400'}`}>{ch.label}</button>))}</div>
                </div>
            </div>
            <div className="grid grid-cols-4 bg-gray-50 border-t border-gray-100 shrink-0 select-none">
                {[1, 2, 3, 'del', 4, 5, 6, '完成', 7, 8, 9, '.', 0].map((k) => {
                    if (k === '完成') return <button key={k} onClick={onClose} className="row-span-2 bg-[#00C06B] text-white font-bold text-lg active:opacity-90">完成</button>;
                    if (k === 'del') return <button key={k} onClick={() => handleNumpad('del')} className="h-14 border-r border-b border-gray-200 flex items-center justify-center active:bg-gray-200 bg-white"><Delete size={20}/></button>;
                    return <button key={k} onClick={() => handleNumpad(k.toString())} className={`h-14 border-r border-b border-gray-200 text-xl font-bold text-gray-800 active:bg-gray-200 bg-white ${k === 0 ? 'col-span-2' : ''}`}>{k}</button>;
                })}
            </div>
          </div>
        </div>
    );
};

// --- Addon Form ---
const AddonForm = ({ initialItem, onBack, onSave }: { initialItem?: LocalAddon | null, onBack: () => void, onSave: (addon: LocalAddon) => void }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showChannelSelector, setShowChannelSelector] = useState(false);
    const [form, setForm] = useState<Partial<LocalAddon> & { selectedChannels: string[] }>(() => {
        const base = initialItem || {
            name: '', category: '小料', price: '', stockType: 'unlimited', stock: 9999,
            channels: { all: 'on_shelf', mini: 'on_shelf', pos: 'on_shelf', meituan: 'on_shelf', taobao: 'on_shelf' } as any
        };
        const selectedChannels = initialItem 
          ? Object.keys(initialItem.channels).filter(k => initialItem.channels[k as ChannelType] !== 'unmapped' && k !== 'all')
          : ['mini', 'pos'];
        return { ...base, selectedChannels };
    });

    const updateForm = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSaveAction = () => {
        if (!form.name || !form.price) return;
        
        // Convert string array channels back to the Record format expected by LocalAddon
        const channelsRecord: Record<ChannelType, any> = {
            all: 'on_shelf',
            mini: form.selectedChannels.includes('mini') ? 'on_shelf' : 'unmapped',
            pos: form.selectedChannels.includes('pos') ? 'on_shelf' : 'unmapped',
            meituan: form.selectedChannels.includes('meituan') ? 'on_shelf' : 'unmapped',
            taobao: form.selectedChannels.includes('taobao') ? 'on_shelf' : 'unmapped',
        } as any;

        const addonToSave = {
            id: form.id || `new_${Date.now()}`,
            name: form.name,
            category: form.category || '未分类',
            price: form.price,
            stockType: form.stockType,
            stock: form.stock || 0,
            status: form.status || 'on_shelf',
            stockStatus: form.stockStatus || 'available',
            channels: channelsRecord,
            ...form
        } as LocalAddon;
        onSave(addonToSave);
    };

    return (
        <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full font-sans select-none">
            <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black"><ChevronLeft size={24}/></button>
                <span className="font-bold text-base">{initialItem ? '编辑加料' : '新建加料'}</span>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                {/* Base Info */}
                <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">基本信息</h3>
                    <div className="space-y-4">
                        <Input label="加料名称" required value={form.name} onChange={(v: string) => updateForm('name', v)} placeholder="例如：珍珠"/>
                        <Selector label="所属类型" value={form.category} onChange={(v: string) => updateForm('category', v)} options={MOCK_CATEGORIES.slice(1)} />
                    </div>
                </div>

                {/* Sales Info */}
                <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">销售信息</h3>
                    <div className="space-y-5">
                        <Input label="初始价格 (元)" required type="number" value={form.price} onChange={(v: string) => updateForm('price', v)} placeholder="0.00" />
                        
                        {/* Sales Channel Selector Row */}
                        <div 
                            className="flex justify-between items-center py-2 border-b border-gray-50 cursor-pointer active:bg-gray-50 transition-colors"
                            onClick={() => setShowChannelSelector(true)}
                        >
                            <label className="text-xs font-bold text-gray-500">销售渠道 <span className="text-red-500">*</span></label>
                            <div className="flex items-center text-sm text-[#333] font-bold">
                                <span>已选 {form.selectedChannels.length} 个渠道</span>
                                <ChevronRight size={16} className="ml-1 text-gray-400"/>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label className="text-xs font-bold text-gray-600">库存类型 <span className="text-red-500">*</span></label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => updateForm('stockType', 'unlimited')} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${form.stockType === 'unlimited' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>无限库存</button>
                                <button onClick={() => updateForm('stockType', 'custom')} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${form.stockType === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>自定义库存</button>
                            </div>
                        </div>

                        {form.stockType === 'custom' && (
                            <Input label="初始库存" required type="number" value={form.stock?.toString()} onChange={(v: string) => updateForm('stock', Number(v))} placeholder="0" />
                        )}
                        
                        {/* Collapsible Advanced */}
                        <div onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-center pt-2 text-xs font-bold text-[#00C06B] cursor-pointer">
                            {showAdvanced ? '收起更多设置' : '展开更多设置 (成本/编码/打印等)'} <ChevronDown size={14} className={`ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}/>
                        </div>

                        {showAdvanced && (
                            <div className="space-y-5 pt-4 border-t border-dashed border-gray-100 animate-in slide-in-from-top-2">
                                <Input label="加料编码" value={form.code} onChange={(v: string) => updateForm('code', v)} placeholder="选填"/>
                                <Input label="成本价格" type="number" value={form.cost} onChange={(v: string) => updateForm('cost', v)} placeholder="0.00"/>
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm font-bold text-gray-700">独立售卖</span>
                                    <SwitchRow active={form.isIndependent || false} onClick={() => updateForm('isIndependent', !form.isIndependent)} />
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-sm font-bold text-gray-700">是否打印</span>
                                    <SwitchRow active={true} onClick={() => {}} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white shrink-0 pb-8">
                <button 
                    onClick={handleSaveAction} 
                    disabled={!form.name || !form.price || form.selectedChannels.length === 0}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${!form.name || !form.price || form.selectedChannels.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1F2129]'}`}
                >
                    {initialItem ? '保存修改' : '保存'}
                </button>
            </div>

            {/* Channel Selector Overlay */}
            {showChannelSelector && (
              <MobileProductChannelSelector 
                selectedChannels={form.selectedChannels}
                onBack={() => setShowChannelSelector(false)}
                onSave={(next) => {
                  updateForm('selectedChannels', next);
                  setShowChannelSelector(false);
                }}
              />
            )}
        </div>
    );
};

const Input = ({ label, required, value, onChange, placeholder, type = 'text', disabled }: any) => (
    <div className="flex flex-col space-y-2">
        <label className="text-xs font-bold text-gray-500">{label} {required && <span className="text-red-500">*</span>}</label>
        <input 
            type={type} 
            value={value || ''} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#00C06B] transition-colors"
        />
    </div>
);

const Selector = ({ label, value, onChange, options }: any) => (
    <div className="flex flex-col space-y-2">
        <label className="text-xs font-bold text-gray-500">{label}</label>
        <div className="flex flex-wrap gap-2">
            {options.map((opt: string) => (
                <button 
                    key={opt} 
                    onClick={() => onChange(opt)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${value === opt ? 'bg-[#E6F8F0] border-[#00C06B] text-[#00C06B]' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                >
                    {opt}
                </button>
            ))}
        </div>
    </div>
);

const SwitchRow = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <div 
        onClick={onClick}
        className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${active ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
    >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'left-6' : 'left-1'}`}></div>
    </div>
);

const AddonSorter = ({ items, onBack, onSave }: { items: LocalAddon[], onBack: () => void, onSave: (items: LocalAddon[]) => void }) => {
    const [list, setList] = useState(items);
    
    const move = (idx: number, dir: 'up' | 'down') => {
        const next = [...list];
        if (dir === 'up' && idx > 0) [next[idx], next[idx-1]] = [next[idx-1], next[idx]];
        else if (dir === 'down' && idx < next.length - 1) [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
        setList(next);
    };

    return (
        <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
            <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black"><ChevronLeft size={24}/></button>
                <span className="font-bold text-base">加料排序</span>
                <div className="w-8"></div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                {list.map((item, idx) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center">
                            <span className="w-6 text-xs font-bold text-gray-400 mr-2">{idx + 1}</span>
                            <span className="font-bold text-sm text-[#1F2129]">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => move(idx, 'up')} disabled={idx === 0} className="p-2 bg-gray-50 rounded text-gray-600 disabled:opacity-30"><ArrowUp size={14}/></button>
                            <button onClick={() => move(idx, 'down')} disabled={idx === list.length - 1} className="p-2 bg-gray-50 rounded text-gray-600 disabled:opacity-30"><ArrowDown size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white shrink-0 pb-8">
                <button onClick={() => onSave(list)} className="w-full py-4 bg-[#00C06B] text-white rounded-xl font-bold shadow-lg">保存排序</button>
            </div>
        </div>
    );
};
