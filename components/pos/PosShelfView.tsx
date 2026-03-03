
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Check, ChevronLeft, ChevronRight, List, RefreshCw, Link2Off, CheckCircle2, Circle, Filter, LayoutGrid, Layers } from 'lucide-react';
import { useProducts } from '../../context';
import { FILTER_CHANNEL_OPTIONS, CHANNEL_TABS, ChannelType, ChannelTabType } from './PosCommon';
import { ShelfActionDialog, ShelfManagementModal } from './PosModals';

const MOCK_SHELF_CATEGORIES = ["全部", "加料", "后台分类展示合集", "大雪花分类--小程序", "仅小程序分类", "测试分类A", "测试分类B"];
const RAW_SHELF_ITEMS = [
    { id: 'g1', name: '1121beta多规格商品-1', status: 'on_shelf' },
    { id: 'g2', name: '测试归档标品', status: 'on_shelf' },
    { id: 'g3', name: '新建电商商城1', status: 'on_shelf' },
    { id: 'g4', name: '大雪花', status: 'on_shelf' },
    { id: 'g5', name: '测试归档', status: 'off_shelf' },
    { id: 'g6', name: '1', status: 'on_shelf' },
    { id: 'g7', name: '1027标品-02', status: 'on_shelf' },
    { id: 'g8', name: '1110商品', status: 'on_shelf' },
    { id: 'g9', name: '新建电商商城商品2', status: 'on_shelf' },
    { id: 'g10', name: '0827beta单规格套餐-4', status: 'on_shelf' },
    // Added more off-shelf items for list population
    { id: 'g11', name: '已下架-红烧排骨', status: 'off_shelf' },
    { id: 'g12', name: '已下架-清蒸鲈鱼', status: 'off_shelf' },
    { id: 'g13', name: '已下架-麻婆豆腐', status: 'off_shelf' },
    { id: 'g14', name: '已下架-宫保鸡丁', status: 'off_shelf' },
    { id: 'g15', name: '已下架-回锅肉', status: 'off_shelf' },
    { id: 'g16', name: '已下架-番茄炒蛋', status: 'off_shelf' },
];

// Enrich mock data to have channel specific statuses for testing
const INITIAL_SHELF_ITEMS = RAW_SHELF_ITEMS.map(item => ({
    ...item,
    channels: {
        pos: item.status,
        mini_dine: item.status,
        mini_take: item.status,
        mini_pickup: item.status, // Included new channel
        meituan: Math.random() > 0.8 ? 'unmapped' : item.status, // Random unmapped for realism
        taobao: Math.random() > 0.8 ? 'unmapped' : item.status
    }
}));

export const PosShelfView: React.FC = () => {
  const { activeBrandId, brandConfigs } = useProducts();
  const currentBrandConfig = useMemo(() => brandConfigs[activeBrandId], [brandConfigs, activeBrandId]);
  const isShelvesUnited = currentBrandConfig?.features.shelves_unite ?? true;

  // Channel Grouping Logic
  const enableChannelGrouping = currentBrandConfig?.enableChannelGrouping ?? false;
  const channelGroups = currentBrandConfig?.channelGroups || [];

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

  const [shelfItems, setShelfItems] = useState(INITIAL_SHELF_ITEMS);
  const [shelfCategory, setShelfCategory] = useState('全部');
  const [activeShelfChannelId, setActiveShelfChannelId] = useState<string>('all');
  const [isShelfChannelFilterOpen, setIsShelfChannelFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shelfBatchMode, setShelfBatchMode] = useState(false);
  const [shelfSelection, setShelfSelection] = useState<Set<string>>(new Set());
  const [shelfActionDialog, setShelfActionDialog] = useState<{ open: boolean; item?: any; items?: any[]; action: 'on' | 'off'; targetChannel: ChannelType; isAllView: boolean; visibleChannels?: string[] }>({ open: false, action: 'on', targetChannel: 'pos', isAllView: false });
  const [shelfManagementItem, setShelfManagementItem] = useState<any>(null);

  const activeChannelObj = filterTabs.find(t => t.id === activeShelfChannelId) || filterTabs[0];

  const getActiveChannels = () => {
      if (activeShelfChannelId === 'all') return ['pos', 'mini_dine', 'mini_take', 'meituan', 'taobao'];
      if (enableChannelGrouping) {
          const group = channelGroups.find(g => g.id === activeShelfChannelId);
          return group ? group.channels : [];
      }
      return [activeShelfChannelId];
  };

  const displayShelfItems = useMemo(() => {
      let items = shelfItems.filter(i => i.name.includes(searchQuery));
      if (activeShelfChannelId !== 'all') {
          // If grouped or single channel, check if at least one visible channel is mapped
          const visibleChannels = getActiveChannels();
          items = items.filter(i => {
              // Check if any visible channel is mapped
              return visibleChannels.some(chKey => {
                  const dataKey = chKey === 'mini_dine' || chKey === 'mini_take' || chKey === 'mini_pickup' ? 'mini' : chKey;
                  return i.channels[dataKey as ChannelTabType] !== 'unmapped';
              });
          });
      }
      return items;
  }, [shelfItems, searchQuery, activeShelfChannelId, enableChannelGrouping, channelGroups]);

  const offShelfList = useMemo(() => {
      return shelfItems.filter(i => {
          const visibleChannels = getActiveChannels();
          // Logic: Show if considered "off shelf" in the current view context
          if (isShelvesUnited) {
              // Global status
              return i.status === 'off_shelf';
          } else {
              // Independent status: Check if ALL relevant channels in the current view are off?
              // Or ANY? Usually list shows items that need action.
              // If view is 'all', check if any channel is off?
              // If view is Group/Single, check channels in that scope.
              const relevantStatuses = visibleChannels
                  .map(chKey => {
                      const dataKey = chKey === 'mini_dine' || chKey === 'mini_take' || chKey === 'mini_pickup' ? 'mini' : chKey;
                      return i.channels[dataKey as ChannelTabType];
                  })
                  .filter(s => s !== 'unmapped');
              
              if (relevantStatuses.length === 0) return false; // Not relevant
              
              // If any relevant channel is off_shelf, show in list? Or must all be off?
              // Common requirement: Show in list if "Sold Out" or "Off Shelf". 
              // Assuming "Off Shelf List" means completely unavailable in current context.
              return relevantStatuses.every(s => s === 'off_shelf');
          }
      });
  }, [shelfItems, isShelvesUnited, activeShelfChannelId, enableChannelGrouping, channelGroups]);

  const initiateSingleToggle = (item: any) => {
     // If grouped, what is target? Default to 'pos' or first available?
     // If unified, target doesn't matter much.
     // If independent and group view, maybe open dialog to select within group?
     const targetCh = activeShelfChannelId === 'all' || enableChannelGrouping ? 'pos' : activeShelfChannelId;
     let currentStatus = isShelvesUnited ? item.status : item.channels[targetCh as ChannelTabType];
     // Fallback for group view in independent mode: check if any is on?
     if (!isShelvesUnited && enableChannelGrouping && activeShelfChannelId !== 'all') {
         // Check aggregate status of group
         const channels = getActiveChannels();
         const hasOn = channels.some(ch => item.channels[ch === 'mini_dine' || ch === 'mini_take' || ch === 'mini_pickup' ? 'mini' : ch] === 'on_shelf');
         currentStatus = hasOn ? 'on_shelf' : 'off_shelf';
     }

     const nextAction = currentStatus === 'on_shelf' ? 'off' : 'on';
     const visibleChannels = getActiveChannels();
     setShelfActionDialog({ 
         open: true, 
         item: item, 
         action: nextAction, 
         targetChannel: targetCh as ChannelType, 
         isAllView: activeShelfChannelId === 'all',
         visibleChannels: visibleChannels
     });
  };

  const initiateBatchToggle = (action: 'on' | 'off') => {
     const selectedItems = shelfItems.filter(i => shelfSelection.has(i.id));
     const targetCh = activeShelfChannelId === 'all' || enableChannelGrouping ? 'pos' : activeShelfChannelId;
     const visibleChannels = getActiveChannels();
     setShelfActionDialog({ 
         open: true, 
         items: selectedItems, 
         action: action, 
         targetChannel: targetCh as ChannelType, 
         isAllView: activeShelfChannelId === 'all',
         visibleChannels: visibleChannels
     });
  };

  const handleShelfActionConfirm = (selectedSyncChannels: ChannelTabType[]) => {
      const { item, items, action, targetChannel } = shelfActionDialog;
      const newStatus = action === 'on' ? 'on_shelf' : 'off_shelf';
      // If unified, update global. If independent, update selected channels.
      const channelsToUpdate = isShelvesUnited ? ['pos', 'mini_dine', 'mini_take', 'meituan', 'taobao'] : selectedSyncChannels;
      
      setShelfItems(prev => prev.map(prevItem => {
          const isTarget = item ? prevItem.id === item.id : (items?.some(i => i.id === prevItem.id));
          if (isTarget) {
              const newChannels = { ...prevItem.channels };
              let globalStatus = prevItem.status;
              channelsToUpdate.forEach((ch: string) => { if (newChannels[ch] !== 'unmapped') newChannels[ch] = newStatus; });
              if (isShelvesUnited) globalStatus = newStatus;
              return { ...prevItem, status: globalStatus, channels: newChannels };
          }
          return prevItem;
      }));
      setShelfActionDialog(prev => ({ ...prev, open: false }));
      if (items) { setShelfSelection(new Set()); setShelfBatchMode(false); }
  };

  const handleShelfCardClick = (item: any) => {
     if (shelfBatchMode) {
        const next = new Set(shelfSelection);
        if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
        setShelfSelection(next);
     } else {
        if (!isShelvesUnited && activeShelfChannelId === 'all') setShelfManagementItem(item);
        else initiateSingleToggle(item);
     }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden font-sans relative bg-[#F5F6FA]">
        
        {/* Top Channel Group Filter (Highest Level) */}
        {enableChannelGrouping && !isShelvesUnited && (
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 shrink-0 z-20 shadow-sm space-x-4">
                <div className="flex space-x-2 overflow-x-auto no-scrollbar py-2">
                    {filterTabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveShelfChannelId(tab.id)}
                            className={`
                                px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border
                                ${activeShelfChannelId === tab.id 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                }
                            `}
                        >
                            {tab.shortLabel}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="flex-1 flex overflow-hidden">
            <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col z-10 shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col border-b border-gray-100 shrink-0 bg-white">
                    <div className="h-14 flex items-center justify-between px-5">
                        <div className="flex items-center"><span className="font-bold text-gray-800 text-[16px]">下架商品</span><span className="ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{offShelfList.length}</span></div>
                        
                        {/* Simple Dropdown only for non-grouping mode */}
                        {!enableChannelGrouping && !isShelvesUnited && (
                            <div className="relative group">
                                <button onClick={() => setIsShelfChannelFilterOpen(!isShelfChannelFilterOpen)} className="flex items-center space-x-1.5 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 px-2.5 py-1 rounded-md transition-colors">
                                    <span className="text-gray-500">{activeChannelObj.icon || <span className="text-[10px]">ALL</span>}</span>
                                    <span className="text-xs font-bold text-gray-700">{activeChannelObj.shortLabel}</span>
                                    <ChevronDown size={12} className="text-gray-400"/>
                                </button>
                                {isShelfChannelFilterOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                                        {filterTabs.map(opt => (
                                            <div key={opt.id} onClick={() => { setActiveShelfChannelId(opt.id); setIsShelfChannelFilterOpen(false); }} className={`flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${activeShelfChannelId === opt.id ? 'bg-blue-50/50' : ''}`}>
                                                <div className={`mr-2.5 ${activeShelfChannelId === opt.id ? 'text-blue-500' : 'text-gray-400'}`}>{opt.icon}</div>
                                                <span className={`text-xs font-bold flex-1 ${activeShelfChannelId === opt.id ? 'text-blue-600' : 'text-gray-600'}`}>{opt.label}</span>
                                                {activeShelfChannelId === opt.id && <Check size={12} className="text-blue-500"/>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-10 bg-[#F7F8FA] flex items-center px-5 text-xs text-gray-500 font-bold border-b border-gray-100 shrink-0"><span className="flex-1">商品名称</span><span className="w-16 text-center">操作</span></div>
                <div className="flex-1 overflow-y-auto">{offShelfList.length === 0 ? (<div className="flex flex-col items-center justify-center h-40 text-gray-400"><span className="text-xs">暂无下架商品</span></div>) : (offShelfList.map((item) => (<div key={item.id} className="flex flex-col px-5 py-4 border-b border-gray-50 hover:bg-blue-50/50 transition-colors group"><div className="flex items-center justify-between mb-2"><span className="font-bold text-gray-700 text-sm truncate pr-4 flex-1">{item.name}</span><button onClick={() => { if (!isShelvesUnited && activeShelfChannelId === 'all') { setShelfManagementItem(item); } else { initiateSingleToggle(item); } }} className={`px-3 py-1.5 border text-xs font-bold rounded-md transition-all shrink-0 bg-white ${!isShelvesUnited && activeShelfChannelId === 'all' ? 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50' : 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'}`}>{!isShelvesUnited && activeShelfChannelId === 'all' ? '管理' : '上架'}</button></div></div>)))}</div>
                <div className="h-12 border-t border-gray-100 flex items-center justify-end px-4 text-xs text-gray-500 shrink-0 bg-white"><span className="mr-3">{`共 ${offShelfList.length} 条`}</span><span className="mr-2">1/1页</span><div className="flex space-x-1"><button className="w-6 h-6 border rounded flex items-center justify-center bg-gray-50 text-gray-300 cursor-not-allowed"><ChevronLeft size={12}/></button><button className="w-6 h-6 border rounded flex items-center justify-center bg-gray-50 text-gray-300 cursor-not-allowed"><ChevronRight size={12}/></button></div></div>
            </div>
            <div className="flex-1 flex flex-col bg-[#F5F6FA] min-w-0">
                 <div className="bg-white border-b border-gray-200 flex flex-col shrink-0 shadow-sm z-10">
                     <div className="px-5 py-3 flex items-center justify-between"><div className="relative group w-96 mr-4"><Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-blue-500 transition-all font-medium" placeholder="支持商品名称/拼音/助记码搜索"/></div><div className="flex-1 flex items-center space-x-1 overflow-x-auto no-scrollbar">{MOCK_SHELF_CATEGORIES.map((cat, idx) => (<button key={idx} onClick={() => setShelfCategory(cat)} className={`px-5 py-2 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${shelfCategory === cat ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{cat}</button>))}<button className="ml-auto p-2 text-gray-400 hover:text-gray-600"><ChevronDown size={16}/></button></div></div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
                     <div className={`grid gap-4 content-start ${activeShelfChannelId === 'all' ? 'grid-cols-3 xl:grid-cols-4' : 'grid-cols-4 xl:grid-cols-5'}`}>
                         {displayShelfItems.map(item => {
                             const isSelected = shelfSelection.has(item.id);
                             let isOff = false;
                             let isUnmapped = false;
                             
                             if (activeShelfChannelId === 'all') {
                                 if (isShelvesUnited) isOff = item.status === 'off_shelf';
                                 else { const channels = ['pos', 'mini_dine', 'mini_take', 'meituan', 'taobao'] as const; isOff = channels.every(ch => item.channels[ch] === 'off_shelf' || item.channels[ch] === 'unmapped'); }
                             } else {
                                 // Check based on active channels in group or single
                                 const channels = getActiveChannels();
                                 const statuses = channels.map(chKey => {
                                     const dataKey = chKey === 'mini_dine' || chKey === 'mini_take' || chKey === 'mini_pickup' ? 'mini' : chKey;
                                     return item.channels[dataKey as ChannelTabType];
                                 });
                                 
                                 if (statuses.every(s => s === 'unmapped')) isUnmapped = true;
                                 if (isShelvesUnited) {
                                     isOff = item.status === 'off_shelf';
                                 } else {
                                     const mappedStatuses = statuses.filter(s => s !== 'unmapped');
                                     if (mappedStatuses.length > 0 && mappedStatuses.every(s => s === 'off_shelf')) isOff = true;
                                 }
                             }

                             return (
                                 <div key={item.id} onClick={() => !isUnmapped && handleShelfCardClick(item)} className={`bg-white rounded-lg border-2 relative cursor-pointer group hover:shadow-lg transition-all flex flex-col p-4 select-none h-[100px] ${shelfBatchMode && isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-transparent shadow-sm hover:border-blue-200'} ${!shelfBatchMode && !isUnmapped ? 'active:scale-95' : ''} ${isUnmapped ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}>
                                     <div className="font-bold text-gray-800 text-[15px] leading-snug line-clamp-2 text-left">{item.name}</div>
                                     
                                     {shelfBatchMode && !isUnmapped && (<div className="absolute top-3 right-3 transition-transform active:scale-90">{isSelected ? (<CheckCircle2 size={22} className="text-blue-600 fill-white"/>) : (<Circle size={22} className="text-gray-200 fill-transparent group-hover:text-blue-300"/>)}</div>)}
                                     {isOff && (<div className="absolute inset-0 bg-gray-50/60 rounded-lg pointer-events-none flex items-center justify-center"><div className="w-20 h-20 border-[3px] border-gray-300 rounded-full flex items-center justify-center opacity-60 transform -rotate-[20deg] mix-blend-multiply"><span className="text-gray-400 font-black text-xl tracking-widest">下架</span></div></div>)}
                                     {isUnmapped && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="bg-white/80 px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-500 font-bold shadow-sm">未关联渠道</div></div>)}
                                 </div>
                             )
                         })}
                     </div>
                 </div>
                 <div className="bg-white border-t border-gray-200 px-6 h-16 flex items-center justify-between shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-20">
                     <div className="flex space-x-3">{shelfBatchMode ? (<><button onClick={() => shelfSelection.size > 0 && initiateBatchToggle('on')} disabled={shelfSelection.size === 0} className={`px-6 py-2 text-white text-sm font-bold rounded shadow-lg transition-all flex items-center ${shelfSelection.size > 0 ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}><span className="mr-1">批量上架</span>{shelfSelection.size > 0 && <span className="bg-white/20 px-1.5 rounded text-xs">{shelfSelection.size}</span>}</button><button onClick={() => shelfSelection.size > 0 && initiateBatchToggle('off')} disabled={shelfSelection.size === 0} className={`px-6 py-2 border text-sm font-bold rounded transition-all ${shelfSelection.size > 0 ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-500 hover:border-red-200' : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'}`}>批量下架</button><div className="w-px h-8 bg-gray-200 mx-2"></div><button onClick={() => { setShelfBatchMode(false); setShelfSelection(new Set()); }} className="px-4 py-2 text-gray-500 text-sm font-bold hover:text-gray-700 transition-colors">取消</button></>) : (<><button onClick={() => setShelfBatchMode(true)} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center"><List size={16} className="mr-2"/> 批量管理</button><div className="w-px h-8 bg-gray-200 mx-2"></div><button className="px-4 py-2 text-gray-500 text-sm font-bold hover:text-blue-600 transition-colors flex items-center"><RefreshCw size={16} className="mr-2"/> 刷新</button></>)}</div>
                     <div className="flex items-center text-xs text-gray-500 font-medium"><span className="mr-4">共 {displayShelfItems.length} 条</span><span className="mr-4">1/11页</span><div className="flex space-x-1"><button className="w-8 h-8 border rounded flex items-center justify-center bg-gray-50 text-gray-400 cursor-not-allowed"><ChevronLeft size={14}/></button><button className="w-8 h-8 border rounded flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors"><ChevronRight size={14}/></button></div></div>
                 </div>
            </div>
        </div>
        <ShelfActionDialog 
            open={shelfActionDialog.open} 
            data={shelfActionDialog} 
            onClose={() => setShelfActionDialog(prev => ({ ...prev, open: false }))} 
            onConfirm={handleShelfActionConfirm} 
            isShelvesUnited={isShelvesUnited} 
            enableChannelGrouping={enableChannelGrouping}
            channelGroups={channelGroups}
        />
        {shelfManagementItem && (<ShelfManagementModal item={shelfManagementItem} onClose={() => setShelfManagementItem(null)} onConfirm={(newItem) => { setShelfItems(prev => prev.map(p => p.id === newItem.id ? newItem : p)); setShelfManagementItem(null); }}/>)}
    </div>
  );
};
