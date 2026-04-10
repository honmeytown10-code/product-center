
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Check, ChevronLeft, ChevronRight, List, RefreshCw, Link2Off, CheckCircle2, Circle, Filter, LayoutGrid, Layers, Menu, Image, AlignJustify, CheckSquare, Square } from 'lucide-react';
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

export const PosShelfView: React.FC<{showImage: boolean}> = ({ showImage }) => {
  const { activeBrandId, brandConfigs } = useProducts();
  const currentBrandConfig = useMemo(() => brandConfigs[activeBrandId], [brandConfigs, activeBrandId]);
  const isShelvesUnited = currentBrandConfig?.features.shelves_unite ?? true;

  // Channel Grouping Logic
  const enableChannelGrouping = currentBrandConfig?.enableChannelGrouping ?? false;
  const channelGroups = currentBrandConfig?.channelGroups || [];

  const filterTabs = useMemo(() => {
      // Fix: Added icon to allTab for type consistency
      const allTab = { id: 'all', label: '全部', shortLabel: '全部', icon: <LayoutGrid size={14}/> };
      return FILTER_CHANNEL_OPTIONS;
  }, []);

  const [shelfItems, setShelfItems] = useState(INITIAL_SHELF_ITEMS);
  const [shelfCategory, setShelfCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [shelfBatchMode, setShelfBatchMode] = useState(false);
  const [shelfSelection, setShelfSelection] = useState<Set<string>>(new Set());
  
  // Left Panel Batch Mode
  const [isLeftBatchMode, setIsLeftBatchMode] = useState(false);
  const [leftSelectedIds, setLeftSelectedIds] = useState<Set<string>>(new Set());

  const [shelfActionDialog, setShelfActionDialog] = useState<{ open: boolean; item?: any; items?: any[]; action: 'on' | 'off'; targetChannel: ChannelType; isAllView: boolean; visibleChannels?: string[] }>({ open: false, action: 'on', targetChannel: 'all', isAllView: true });
  const [shelfManagementItem, setShelfManagementItem] = useState<any>(null);

  // The POS shelf view always operates on ALL channels now, eliminating the top channel filter.
  const getActiveChannels = () => {
      return ['pos', 'mini_dine', 'mini_take', 'mini_pickup', 'meituan', 'taobao'];
  };

  const displayShelfItems = useMemo(() => {
      return shelfItems.filter(i => i.name.includes(searchQuery));
  }, [shelfItems, searchQuery]);

  const offShelfList = useMemo(() => {
      return shelfItems.filter(i => {
          if (isShelvesUnited) {
              return i.status === 'off_shelf';
          } else {
              const channels = ['pos', 'mini_dine', 'mini_take', 'mini_pickup', 'meituan', 'taobao'] as const;
              // If ANY channel is off_shelf, it might need attention, or if ALL mapped are off_shelf.
              // Let's assume if any mapped channel is off_shelf, we show it in the off-shelf list for management
              return channels.some(ch => i.channels[ch as ChannelTabType] === 'off_shelf');
          }
      });
  }, [shelfItems, isShelvesUnited]);

  const initiateBatchToggle = (action: 'on' | 'off') => {
     const selectedItems = shelfItems.filter(i => shelfSelection.has(i.id));
     const visibleChannels = getActiveChannels();
     setShelfActionDialog({ 
         open: true, 
         items: selectedItems, 
         action: action, 
         targetChannel: 'all', 
         isAllView: true,
         visibleChannels: visibleChannels
     });
  };

  const handleShelfActionConfirm = (updates: Record<string, 'on_shelf' | 'off_shelf'>) => {
      const { items } = shelfActionDialog;
      
      setShelfItems(prev => prev.map(prevItem => {
          const isTarget = items?.some(i => i.id === prevItem.id);
          if (isTarget) {
              const newChannels = { ...prevItem.channels };
              let globalStatus = prevItem.status;
              
              Object.entries(updates).forEach(([ch, newStatus]) => {
                  if (newChannels[ch] !== 'unmapped') newChannels[ch] = newStatus;
              });
              
              if (isShelvesUnited) {
                  // In unified mode, the updates object will have the same status for all channels.
                  // Just take the first valid one.
                  const firstStatus = Object.values(updates)[0];
                  if (firstStatus) globalStatus = firstStatus;
              } else {
                  // Re-evaluate global status if needed, though for independent it's just the channel status
                  // In independent mode, we don't strictly use globalStatus for much, but keep it in sync if all are off
                  const allOff = Object.values(newChannels).filter(s => s !== 'unmapped').every(s => s === 'off_shelf');
                  globalStatus = allOff ? 'off_shelf' : 'on_shelf';
              }
              
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
        setShelfManagementItem(item);
     }
  };

  return (
    <div className="flex h-full w-full bg-[#F5F6FA] overflow-hidden font-sans relative">
      
      {/* Left Panel: Category & Off-Shelf List */}
      <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col z-10 shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col border-b border-gray-100 shrink-0 bg-white">
              <div className="h-14 flex items-center justify-between px-5">
                  <div className="flex items-center">
                      <span className="font-bold text-gray-800 text-[16px]">已下架商品</span>
                      <span className="ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{offShelfList.length}</span>
                  </div>
              </div>
          </div>

          <div className="h-10 bg-[#F7F8FA] flex items-center px-5 text-xs text-gray-500 font-bold border-b border-gray-100 shrink-0">
              {isLeftBatchMode && <span className="w-8"></span>}
              <span className="flex-1">商品名称</span>
              {!isLeftBatchMode && <span className="w-16 text-center">操作</span>}
          </div>
          <div className="flex-1 overflow-y-auto">
              {offShelfList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <span className="text-xs">暂无下架商品</span>
                  </div>
              ) : (
                  offShelfList.map((item) => {
                      const isPartiallyOff = !isShelvesUnited && Object.values(item.channels).some(s => s === 'on_shelf') && Object.values(item.channels).some(s => s === 'off_shelf');
                      
                      return (
                          <div 
                              key={item.id} 
                              onClick={() => {
                                  if (isLeftBatchMode) {
                                      const newSet = new Set(leftSelectedIds);
                                      if (newSet.has(item.id)) newSet.delete(item.id);
                                      else newSet.add(item.id);
                                      setLeftSelectedIds(newSet);
                                  } else {
                                      setShelfManagementItem(item);
                                  }
                              }}
                              className={`flex flex-col px-5 py-4 border-b border-gray-50 transition-colors group cursor-pointer ${isLeftBatchMode && leftSelectedIds.has(item.id) ? 'bg-[#00C06B]/5 border-l-4 border-l-[#00C06B]' : 'hover:bg-[#00C06B]/5 border-l-4 border-l-transparent'}`}
                          >
                              <div className="flex items-center justify-between mb-2">
                                  {isLeftBatchMode && (
                                      <div className="mr-3">
                                          {leftSelectedIds.has(item.id) ? <CheckCircle2 size={20} className="text-[#00C06B] fill-white"/> : <Circle size={20} className="text-gray-200 fill-transparent"/>}
                                      </div>
                                  )}
                                  <span className="font-bold text-gray-700 text-sm truncate pr-4 flex-1">{item.name}</span>
                                  {!isLeftBatchMode && (
                                      <button 
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setShelfManagementItem(item);
                                          }} 
                                          className="px-3 py-1.5 border border-[#00C06B] text-[#00C06B] hover:bg-[#00C06B] hover:text-white text-xs font-bold rounded-md transition-all shrink-0 bg-white"
                                      >
                                          上架
                                      </button>
                                  )}
                              </div>
                              {!isShelvesUnited && (
                                  <div className={isLeftBatchMode ? 'pl-8' : ''}>
                                      {isPartiallyOff ? (
                                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-500 border border-orange-100">部分下架</span>
                                      ) : (
                                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">已下架</span>
                                      )}
                                  </div>
                              )}
                          </div>
                      );
                  })
              )}
          </div>
          
          {/* Left Panel Batch Action Footer */}
          <div className="bg-white border-t border-gray-200 h-16 flex items-center justify-between px-4 z-20 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              {!isLeftBatchMode ? (
                  <button 
                      onClick={() => setIsLeftBatchMode(true)}
                      className="w-full py-2.5 rounded-lg bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 transition-all flex items-center justify-center text-sm"
                  >
                      <CheckSquare size={16} className="mr-2"/> 批量操作
                  </button>
              ) : (
                  <>
                      <button 
                          onClick={() => {
                              if (leftSelectedIds.size === offShelfList.length) {
                                  setLeftSelectedIds(new Set());
                              } else {
                                  setLeftSelectedIds(new Set(offShelfList.map(i => i.id)));
                              }
                          }}
                          className="flex items-center text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                      >
                          <div className="mr-2">
                              {leftSelectedIds.size > 0 ? (
                                  <CheckSquare size={18} className="text-[#00C06B]" />
                              ) : (
                                  <Square size={18} className="text-gray-300" />
                              )}
                          </div>
                          全选
                      </button>
                      <div className="flex items-center space-x-2">
                          <button 
                              disabled={leftSelectedIds.size === 0} 
                              onClick={() => {
                                  const selectedItems = shelfItems.filter(i => leftSelectedIds.has(i.id));
                                  const visibleChannels = getActiveChannels();
                                  setShelfActionDialog({ 
                                      open: true, 
                                      items: selectedItems, 
                                      action: 'on', 
                                      targetChannel: 'all', 
                                      isAllView: true,
                                      visibleChannels: visibleChannels
                                  });
                              }}
                              className="px-3 py-1.5 rounded bg-[#00C06B] text-white font-bold disabled:opacity-50 transition-all text-xs hover:bg-[#00A35B]"
                          >
                              上架
                          </button>
                          <button 
                              onClick={() => { setIsLeftBatchMode(false); setLeftSelectedIds(new Set()); }}
                              className="px-3 py-1.5 rounded text-gray-400 hover:bg-gray-100 font-bold transition-all text-xs"
                          >
                              退出
                          </button>
                      </div>
                  </>
              )}
          </div>
      </div>

      {/* Right Panel: Main Workspace */}
      <div className="flex-1 flex flex-col bg-[#F5F6FA] min-w-0">
           {/* Header & Search */}
           <div className="bg-white border-b border-gray-200 flex flex-col shrink-0 shadow-sm z-10">
               <div className="px-5 py-3 flex items-center justify-between">
                   <div className="relative group w-96 mr-4">
                       <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-[#00C06B] transition-colors" size={16} />
                       <input 
                           value={searchQuery} 
                           onChange={(e) => setSearchQuery(e.target.value)} 
                           className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm outline-none focus:border-[#00C06B] transition-all font-medium" 
                           placeholder="支持商品名称/拼音/助记码搜索"
                       />
                   </div>
               </div>
           </div>

           {/* Category Tabs */}
           <div className="bg-white border-b border-gray-200 px-5 flex items-center space-x-1 overflow-x-auto no-scrollbar">
               {MOCK_SHELF_CATEGORIES.map((cat, idx) => (
                   <button 
                       key={idx} 
                       onClick={() => setShelfCategory(cat)} 
                       className={`px-5 py-3 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${shelfCategory === cat ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                   >
                       {cat}
                   </button>
               ))}
           </div>

           {/* Product List/Grid Area */}
           <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
               <div className="grid gap-4 content-start grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                   {displayShelfItems.map(item => {
                       const isSelected = shelfSelection.has(item.id);
                       const isOff = isShelvesUnited ? item.status === 'off_shelf' : Object.values(item.channels).some(s => s === 'off_shelf');
                       
                       return (
                           <div 
                               key={item.id} 
                               onClick={() => handleShelfCardClick(item)} 
                               className={`bg-white rounded-lg border-2 relative cursor-pointer group hover:shadow-lg transition-all flex flex-col select-none ${showImage ? 'h-[120px]' : 'h-[80px]'} ${shelfBatchMode && isSelected ? 'border-[#00C06B] bg-[#00C06B]/5' : 'border-transparent shadow-sm hover:border-[#00C06B]/30'} ${!shelfBatchMode ? 'active:scale-95' : ''}`}
                           >
                               <div className="flex p-3 h-full">
                                   {showImage && <div className="w-16 h-16 bg-gray-100 rounded-md mr-3 shrink-0 flex items-center justify-center text-gray-400 text-xs">图</div>}
                                   <div className="flex-1 flex flex-col justify-between">
                                       <div className="font-bold text-gray-800 text-[15px] leading-snug line-clamp-2 text-left">{item.name}</div>
                                       <div className="mt-auto">
                                           {isOff && (
                                               <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-600">
                                                   {isShelvesUnited ? '已下架' : '部分下架'}
                                               </span>
                                           )}
                                       </div>
                                   </div>
                               </div>
                               
                               {shelfBatchMode && (
                                   <div className="absolute top-2 right-2 transition-transform active:scale-90">
                                       {isSelected ? (
                                           <CheckCircle2 size={22} className="text-[#00C06B] fill-white"/>
                                       ) : (
                                           <Circle size={22} className="text-gray-200 fill-transparent group-hover:text-[#00C06B]/50"/>
                                       )}
                                   </div>
                               )}
                           </div>
                       );
                   })}
               </div>
           </div>

           {/* Bottom Action Bar */}
           <div className="bg-white border-t border-gray-200 h-16 shrink-0 flex items-center justify-between px-6 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
               <div className="flex items-center space-x-6">
                   <button 
                       onClick={() => {
                           if (shelfBatchMode) { setShelfBatchMode(false); setShelfSelection(new Set()); }
                           else setShelfBatchMode(true);
                       }}
                       className={`flex items-center space-x-2 font-bold transition-all px-4 py-2 rounded-lg ${shelfBatchMode ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-50 text-[#00C06B] hover:bg-[#00C06B]/10'}`}
                   >
                       {shelfBatchMode ? <><ChevronLeft size={18}/><span>退出批量</span></> : <><List size={18}/><span>批量管理</span></>}
                   </button>
                   {shelfBatchMode && (
                       <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                           <div onClick={() => {
                               if (shelfSelection.size === displayShelfItems.length) setShelfSelection(new Set());
                               else setShelfSelection(new Set(displayShelfItems.map(i => i.id)));
                           }} className="flex items-center space-x-2 cursor-pointer hover:text-gray-900 font-medium">
                               {shelfSelection.size === displayShelfItems.length && displayShelfItems.length > 0 ? <CheckCircle2 size={18} className="text-[#00C06B]"/> : <Circle size={18} className="text-gray-400"/>}
                               <span>全选本页</span>
                           </div>
                           <div className="w-px h-4 bg-gray-300"></div>
                           <span className="font-bold text-gray-800">已选 <span className="text-[#00C06B] text-lg mx-1">{shelfSelection.size}</span> 项</span>
                       </div>
                   )}
               </div>

               {shelfBatchMode && (
                   <div className="flex items-center space-x-3">
                       <button 
                           onClick={() => initiateBatchToggle('on')}
                           disabled={shelfSelection.size === 0}
                           className="px-6 py-2.5 bg-white border border-gray-200 hover:border-[#00C06B] text-[#00C06B] font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center"
                       >
                           <Check size={18} className="mr-2"/>批量上架
                       </button>
                       <button 
                           onClick={() => initiateBatchToggle('off')}
                           disabled={shelfSelection.size === 0}
                           className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center"
                       >
                           <Link2Off size={18} className="mr-2"/>批量下架
                       </button>
                   </div>
               )}
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
      {shelfManagementItem && (
          <ShelfManagementModal 
              item={shelfManagementItem} 
              onClose={() => setShelfManagementItem(null)} 
              onConfirm={(updatedItem) => {
                  setShelfItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
                  setShelfManagementItem(null);
              }} 
              isShelvesUnited={isShelvesUnited}
              enableChannelGrouping={enableChannelGrouping}
              channelGroups={channelGroups}
          />
      )}
    </div>
  );
};
