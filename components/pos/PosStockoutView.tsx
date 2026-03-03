
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Check, AlertTriangle, Link2Off, RotateCcw, CheckSquare, RefreshCw, Layers, LayoutGrid } from 'lucide-react';
import { useProducts } from '../../context';
import { FILTER_CHANNEL_OPTIONS, CHANNEL_TABS, CategoryButton, ChannelType } from './PosCommon';
import { CATEGORIES } from '../../types';
import { ClearanceSettingsModal } from './PosModals';

const MOCK_DISPLAY_PRODUCTS = [
  { id: 'p1', name: '招牌红烧肉盖饭', price: 38.00, spec: '标准', stock: 80, status: 'warning', tags: [{ text: '套餐', color: 'green' }], channels: { pos: 'normal', mini: 'normal', meituan: 'unmapped', taobao: 'normal' }, channelStocks: { pos: 80, mini: 50, meituan: 0, taobao: 20 } },
  { id: 'p2', name: '香煎三文鱼', price: 0.58, spec: '称重', stock: 1200, status: 'normal', tags: [{ text: '称重', color: 'blue' }], channels: { pos: 'normal', mini: 'normal', meituan: 'normal', taobao: 'sold_out' }, channelStocks: { pos: 1200, mini: 800, meituan: 1200, taobao: 0 } },
  { id: 'p3', name: '经典牛肉面', price: 28.00, spec: '标准', stock: 0, status: 'sold_out', tags: [], channels: { pos: 'normal', mini: 'normal', meituan: 'sold_out', taobao: 'normal' }, channelStocks: { pos: 15, mini: 15, meituan: 0, taobao: 5 } },
  { id: 'p4', name: '老火例汤', price: 12.00, spec: '按餐段', stock: 10, status: 'warning', tags: [], channels: { pos: 'normal', mini: 'normal', meituan: 'normal' }, channelStocks: { pos: 10, mini: 10, meituan: 10 } },
  { id: 'p5', name: '麻辣小龙虾', price: 128.00, spec: '大份/约500g', stock: 55, status: 'normal', tags: [{ text: '夜宵', color: 'orange' }], channels: { pos: 'normal', mini: 'normal', meituan: 'normal' }, channelStocks: { pos: 55, mini: 30, meituan: 30 } },
  { id: 'p6', name: '手打柠檬茶', price: 18.00, spec: '大杯', stock: 0, status: 'sold_out', tags: [], channels: { pos: 'sold_out', mini: 'sold_out', meituan: 'sold_out' }, channelStocks: { pos: 0, mini: 0, meituan: 0 } },
];

const MOCK_LEFT_LOGS = [
  { id: 'l1', name: '槐店生椰拿铁', type: '营业日沽清', time: '10:30', stock: 3, rank: 1, stocks: { pos: 3, mini: 0, meituan: 0, taobao: 2 } },
  { id: 'l2', name: '多肉葡萄冻冻', type: '餐段沽清', time: '11:15', stock: 0, rank: 2, stocks: { pos: 0, mini: 0, meituan: 0, taobao: 0 } },
];

export const PosStockoutView: React.FC = () => {
  const { activeBrandId, brandConfigs } = useProducts();
  const currentBrandConfig = useMemo(() => brandConfigs[activeBrandId], [brandConfigs, activeBrandId]);
  const isStockShared = currentBrandConfig?.features.stock_shared ?? true;
  
  // Channel Grouping Logic
  const enableChannelGrouping = currentBrandConfig?.enableChannelGrouping ?? false;
  const channelGroups = currentBrandConfig?.channelGroups || [];

  // Tabs Construction
  const filterTabs = useMemo(() => {
      // Fix: Added icon to allTab for type consistency
      const allTab = { id: 'all', label: '全部', shortLabel: '全部', icon: <LayoutGrid size={14}/> };
      if (enableChannelGrouping) {
          return [
              allTab,
              // Fix: Added icon to group tabs for type consistency
              ...channelGroups.map(g => ({ id: g.id, label: g.name, shortLabel: g.name, channels: g.channels, icon: <Layers size={14}/> }))
          ];
      }
      return FILTER_CHANNEL_OPTIONS;
  }, [enableChannelGrouping, channelGroups]);

  const [activeChannelId, setActiveChannelId] = useState<string>('all');
  const [isChannelFilterOpen, setIsChannelFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);

  const currentList = useMemo(() => MOCK_DISPLAY_PRODUCTS.filter(p => p.name.includes(searchQuery)), [searchQuery]);

  const activeChannelObj = filterTabs.find(t => t.id === activeChannelId) || filterTabs[0];

  const handleItemClick = (item: any) => {
    if (isBatchMode) {
      const newSet = new Set(selectedIds);
      if (newSet.has(item.id)) newSet.delete(item.id);
      else newSet.add(item.id);
      setSelectedIds(newSet);
    } else {
        setEditingTarget(item);
        setModalOpen(true);
    }
  };

  const renderProductClearanceCard = (item: any, isSelected: boolean) => {
     let displayStock = item.stock;
     let isOverallSoldOut = false;
     let isPartialSoldOut = false;
     let isUnmappedInCurrentView = false;
     
     // Determine affected channels based on current view
     let targetChannels: string[] = [];
     if (activeChannelId === 'all') {
         targetChannels = ['pos', 'mini', 'meituan', 'taobao']; // Simplified
     } else if (enableChannelGrouping) {
         // It's a group
         const group = channelGroups.find(g => g.id === activeChannelId);
         targetChannels = group ? group.channels : [];
     } else {
         // Single channel
         const mapKey = activeChannelId === 'mini_dine' || activeChannelId === 'mini_take' ? 'mini' : activeChannelId;
         targetChannels = [mapKey];
     }

     // Calculate Stock & Status
     if (!isStockShared) {
         if (activeChannelId === 'all') {
             const stocks = Object.values(item.channelStocks || {}) as number[];
             if (stocks.every(s => s <= 0)) isOverallSoldOut = true;
             else if (stocks.some(s => s <= 0) && stocks.some(s => s > 0)) isPartialSoldOut = true;
         } else {
             // For group or single channel in independent stock mode
             // We sum up stock of visible channels? Or show max?
             // Simple logic: Sum of mapped channels in this view
             let totalGroupStock = 0;
             let hasMapped = false;
             let allSoldOut = true;

             targetChannels.forEach(ch => {
                 // Map channel keys if necessary (mock data keys vs config keys)
                 const dataKey = ch === 'mini_dine' || ch === 'mini_take' ? 'mini' : ch;
                 if (item.channels[dataKey] !== 'unmapped') {
                     hasMapped = true;
                     const st = item.channelStocks?.[dataKey] || 0;
                     totalGroupStock += st;
                     if (st > 0) allSoldOut = false;
                 }
             });

             if (!hasMapped) isUnmappedInCurrentView = true;
             else {
                 displayStock = totalGroupStock;
                 if (allSoldOut) isOverallSoldOut = true;
             }
         }
     } else {
        // Shared Stock
        if (displayStock <= 0) isOverallSoldOut = true;
        // Check if unmapped in this specific view
        if (activeChannelId !== 'all') {
             let hasMapped = false;
             targetChannels.forEach(ch => {
                 const dataKey = ch === 'mini_dine' || ch === 'mini_take' ? 'mini' : ch;
                 if (item.channels[dataKey] !== 'unmapped') hasMapped = true;
             });
             if (!hasMapped) isUnmappedInCurrentView = true;
        }
     }

     return (
        <div key={item.id} onClick={() => !isUnmappedInCurrentView && handleItemClick(item)} className={`relative bg-white rounded-xl shadow-sm cursor-pointer transition-all border flex flex-col p-4 h-[135px] group hover:shadow-md overflow-hidden ${isBatchMode && isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'} ${isUnmappedInCurrentView ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}>
           {isOverallSoldOut && !isBatchMode && <div className="absolute inset-0 bg-white/60 z-10 pointer-events-none transition-opacity"></div>}
           <div className="mb-2 relative z-0">
              <div className="flex items-start justify-between">
                 <h3 className="font-bold text-gray-900 text-[16px] leading-snug line-clamp-2 flex-1 mr-2">{item.name}{!['标准', '称重', '按餐段'].includes(item.spec) && <span className="text-[13px] font-normal text-gray-500 ml-1">({item.spec})</span>}</h3>
                 <div className="flex flex-col shrink-0 items-end gap-1">{item.tags.map((tag: any, idx: number) => <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold ${tag.color === 'green' ? 'bg-[#00C06B]' : tag.color === 'blue' ? 'bg-blue-600' : 'bg-orange-500'}`}>{tag.text}</span>)}</div>
              </div>
           </div>
           
           <div className="mb-auto"></div>

           {isUnmappedInCurrentView ? (<div className="flex items-center justify-center mt-4"><span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">当前渠道未关联</span></div>) : (<div className="flex items-end justify-between mt-2 pt-2 border-t border-gray-50 border-dashed relative z-0">{!isStockShared && activeChannelId === 'all' ? <span></span> : <span className={`text-[14px] font-bold ${isOverallSoldOut ? 'text-transparent' : item.status === 'warning' ? 'text-orange-500' : 'text-orange-500'}`}>{isOverallSoldOut ? '' : `剩余 ${displayStock}`}</span>}<div className={`font-bold font-mono text-xl leading-none ${isOverallSoldOut ? 'text-gray-300' : 'text-blue-600'}`}><span className="text-xs mr-0.5">¥</span>{item.price.toFixed(2)}</div></div>)}
           {isOverallSoldOut && !isUnmappedInCurrentView && <div className="absolute right-4 bottom-8 transform rotate-[-12deg] pointer-events-none z-20"><div className="border-[3px] border-red-500 text-red-500 rounded-lg px-3 py-1 text-lg font-black bg-white/90 shadow-sm backdrop-blur-[1px]">{activeChannelId !== 'all' ? '售罄' : '全渠道售罄'}</div></div>}
           {isPartialSoldOut && !isBatchMode && <div className="absolute right-0 bottom-12 z-20"><div className="bg-orange-50 text-orange-500 rounded-l-lg px-2 py-0.5 text-[10px] font-bold shadow-sm">部分沽清</div></div>}
           {isBatchMode && <div className="absolute top-2 right-2 z-30"><div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}>{isSelected && <CheckSquare size={12} className="text-white"/>}</div></div>}
        </div>
     );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden font-sans relative bg-[#F5F6FA]">
        
        {/* Top Channel Group Filter (Highest Level) */}
        {enableChannelGrouping && !isStockShared && (
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 z-20 shadow-sm">
                <div className="flex space-x-8 h-full">
                    {filterTabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveChannelId(tab.id)}
                            className={`
                                relative h-full flex items-center text-[15px] font-bold transition-all px-1
                                ${activeChannelId === tab.id 
                                    ? 'text-[#1F2129]' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }
                            `}
                        >
                            {tab.shortLabel}
                            {activeChannelId === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1F2129] rounded-t-full"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="flex-1 flex overflow-hidden">
            <div className="w-[340px] bg-white border-r border-gray-200 flex flex-col z-10 shrink-0">
                <div className="flex flex-col border-b border-gray-100 bg-white shrink-0">
                    <div className="h-14 flex items-center justify-between px-5">
                        <div className="flex items-center"><span className="font-bold text-gray-800 text-[16px] mr-2">沽清列表</span>{MOCK_LEFT_LOGS.length > 0 && (<span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{MOCK_LEFT_LOGS.length}</span>)}</div>
                        
                        {/* Simple Dropdown for non-grouping mode only */}
                        {!enableChannelGrouping && !isStockShared && (
                            <div className="relative group">
                                <button onClick={() => setIsChannelFilterOpen(!isChannelFilterOpen)} className="flex items-center space-x-1.5 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 px-2.5 py-1 rounded-md transition-colors">
                                    <span className="text-gray-500">{activeChannelObj.icon || <span className="text-[10px]">ALL</span>}</span>
                                    <span className="text-xs font-bold text-gray-700">{activeChannelObj.shortLabel}</span>
                                    <ChevronDown size={12} className="text-gray-400"/>
                                </button>
                                {isChannelFilterOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                                        {filterTabs.map(opt => (
                                            <div key={opt.id} onClick={() => { setActiveChannelId(opt.id); setIsChannelFilterOpen(false); }} className={`flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${activeChannelId === opt.id ? 'bg-blue-50/50' : ''}`}>
                                                <div className={`mr-2.5 ${activeChannelId === opt.id ? 'text-blue-500' : 'text-gray-400'}`}>{opt.icon}</div>
                                                <span className={`text-xs font-bold flex-1 ${activeChannelId === opt.id ? 'text-blue-600' : 'text-gray-600'}`}>{opt.label}</span>
                                                {activeChannelId === opt.id && <Check size={12} className="text-blue-500"/>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="px-4 py-3 bg-orange-50 border-b border-orange-100"><div className="flex items-start"><AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0 text-orange-500 fill-orange-100"/><span className="text-[12px] text-orange-700 leading-snug">剩余数量小于30的商品将显示在沽清列表。</span></div></div>
                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {MOCK_LEFT_LOGS.map((item) => {
                        const hasStock = item.stock > 0;
                        return (
                            <div key={item.id} onClick={() => handleItemClick(item)} className="border-b border-gray-100 cursor-pointer group transition-all relative hover:bg-blue-50">
                                <div className="px-5 py-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center mb-1.5">
                                                <span className="text-gray-400 text-xs font-bold mr-2 w-4">{item.rank}</span>
                                                <div className="font-bold text-gray-800 text-[15px] truncate">{item.name}</div>
                                            </div>
                                            <div className="flex items-center space-x-2 pl-6">
                                                <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium ${item.type.includes('手动') ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{item.type}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-center shrink-0 w-[100px]">
                                            {hasStock ? (
                                                <>
                                                    <span className="text-blue-600 text-xl font-bold font-mono leading-none">{item.stock}</span>
                                                    <span className="text-[10px] text-gray-400 mt-1">剩余</span>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-red-500 text-sm font-bold">已售罄</span>
                                                    <RotateCcw size={12} className="text-gray-300 mt-1"/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-[#F5F6FA] relative min-w-0">
                <div className="bg-white border-b border-gray-200 flex flex-col shrink-0 shadow-sm z-10">
                    <div className="h-16 flex items-center px-8 justify-between">
                        <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
                            <CategoryButton label="全部" active={selectedCategory === '全部'} onClick={() => setSelectedCategory('全部')}/>
                            <CategoryButton label="加料" active={selectedCategory === '加料'} onClick={() => setSelectedCategory('加料')}/>
                            {CATEGORIES.slice(1).map(c => <CategoryButton key={c} label={c} active={selectedCategory === c} onClick={() => setSelectedCategory(c)}/>)}
                        </div>
                        <div className="flex items-center ml-6"><div className="relative w-64"><Search className="absolute left-4 top-3 text-gray-400" size={18} /><input className="w-full pl-12 pr-4 py-2.5 bg-[#333]/5 border border-transparent rounded-[6px] text-sm outline-none focus:bg-white focus:border-blue-500 transition-all font-medium" placeholder="搜索商品..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/></div></div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 pb-24 no-scrollbar">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start">
                        {currentList.map(item => { const isSelected = selectedIds.has(item.id); return renderProductClearanceCard(item, isSelected); })}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20 flex items-center justify-between px-8 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center space-x-4">
                        {!isBatchMode ? (<button onClick={() => setIsBatchMode(true)} className="px-8 py-3 rounded-[6px] bg-blue-600 text-white font-bold hover:bg-blue-700 text-sm transition-all shadow-sm active:scale-95">批量沽清</button>) : (<div className="flex space-x-4"><button onClick={() => { setIsBatchMode(false); setSelectedIds(new Set()); }} className="px-8 py-3 rounded-[6px] bg-blue-600 text-white font-bold shadow text-sm">确认操作</button><button onClick={() => { setIsBatchMode(false); setSelectedIds(new Set()); }} className="px-8 py-3 rounded-[6px] border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 text-sm">取消</button></div>)}
                        <button className="px-6 py-3 rounded-[6px] border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 text-sm flex items-center"><RefreshCw size={16} className="mr-2"/> 刷新</button>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-500 font-medium"><span>共 {currentList.length} 条</span><span className="text-gray-300">|</span><span className="text-gray-500">1/1 页</span></div>
                </div>
            </div>

            {modalOpen && editingTarget && <ClearanceSettingsModal product={editingTarget} activeChannel={activeChannelId as ChannelType} onClose={() => setModalOpen(false)} onConfirm={() => setModalOpen(false)} />}
        </div>
    </div>
  );
};
