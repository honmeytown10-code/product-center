
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Check, AlertTriangle, Link2Off, RotateCcw, CheckSquare, RefreshCw, Layers, LayoutGrid, Menu, CheckCircle2, Circle, ChevronLeft, ChevronRight, Image, AlignJustify, Square } from 'lucide-react';
import { useProducts } from '../../context';
import { FILTER_CHANNEL_OPTIONS, CHANNEL_TABS, CategoryButton, ChannelType } from './PosCommon';
import { CATEGORIES } from '../../types';
import { ClearanceSettingsModal } from './PosModals';

const MOCK_DISPLAY_PRODUCTS = [
  { id: 'p1', name: '招牌红烧肉盖饭', price: 38.00, spec: '套餐', stock: 80, status: 'normal', tags: [{ text: '套餐', color: 'green' }], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'normal', mini_pickup: 'normal', meituan: 'normal', taobao: 'normal' }, channelStocks: { pos: 80, mini_dine: 80, mini_take: 80, mini_pickup: 80, meituan: 80, taobao: 80 } },
  { id: 'p2', name: '香煎三文鱼', price: 0.58, spec: '称重', stock: 1200, status: 'normal', tags: [{ text: '称重', color: 'blue' }], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'sold_out', mini_pickup: 'sold_out', meituan: 'sold_out', taobao: 'sold_out' }, channelStocks: { pos: 1200, mini_dine: 1200, mini_take: 0, mini_pickup: 0, meituan: 0, taobao: 0 }, channelTypes: { mini_take: '当日', mini_pickup: '当日', meituan: '当日', taobao: '当日' } },
  { id: 'p3', name: '生椰拿铁', price: 18.00, spec: '多规格', stock: 15, status: 'sold_out', tags: [], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'sold_out', mini_pickup: 'normal', meituan: 'sold_out', taobao: 'normal' }, channelStocks: { pos: 15, mini_dine: 15, mini_take: 0, mini_pickup: 15, meituan: 0, taobao: 5 }, hasMultipleSpecs: true, specs: [{id: 's1', name: '大杯', stock: 10}, {id: 's2', name: '中杯', stock: 5}, {id: 's3', name: '小杯', stock: 0}], channelTypes: { mini_take: '当日', meituan: '长期' } },
  { id: 'p4', name: '老火例汤', price: 12.00, spec: '按餐段', stock: 10, status: 'warning', tags: [], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'normal', mini_pickup: 'normal', meituan: 'normal', taobao: 'normal' }, channelStocks: { pos: 10, mini_dine: 10, mini_take: 10, mini_pickup: 10, meituan: 10, taobao: 10 } },
  { id: 'p5', name: '麻辣小龙虾', price: 128.00, spec: '大份/约500g', stock: 55, status: 'normal', tags: [], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'normal', mini_pickup: 'normal', meituan: 'sold_out', taobao: 'normal' }, channelStocks: { pos: 55, mini_dine: 55, mini_take: 30, mini_pickup: 30, meituan: 0, taobao: 30 }, channelTypes: { meituan: '当日' } },
  { id: 'p6', name: '手打柠檬茶', price: 18.00, spec: '多规格', stock: 0, status: 'sold_out', tags: [], channels: { pos: 'sold_out', mini_dine: 'sold_out', mini_take: 'sold_out', mini_pickup: 'sold_out', meituan: 'sold_out', taobao: 'sold_out' }, channelStocks: { pos: 0, mini_dine: 0, mini_take: 0, mini_pickup: 0, meituan: 0, taobao: 0 }, hasMultipleSpecs: true, specs: [{id: 's4', name: '标准', stock: 0}], channelTypes: { pos: '长期', mini_dine: '长期', mini_take: '长期', mini_pickup: '长期', meituan: '长期', taobao: '长期' } },
];

const MOCK_LEFT_LOGS = [
  // 场景1：部分渠道售罄（混合模式：美团长期沽清，小程序当日沽清）
  { id: 'l1', name: '生椰拿铁', price: 18.00, spec: '大杯', stock: 5, status: 'warning', tags: [], type: 'mixed', time: '10:30', rank: 1, channels: { pos: 'normal', mini_take: 'sold_out', meituan: 'sold_out', taobao: 'normal' }, channelStocks: { pos: 3, mini_take: 0, meituan: 0, taobao: 2 }, channelTypes: { mini_take: '当日', meituan: '长期' }, hasMultipleSpecs: true, specs: [{id: 's1', name: '大杯', stock: 3}, {id: 's2', name: '中杯', stock: 0}, {id: 's3', name: '小杯', stock: 0}] },
  
  // 场景2：全渠道彻底售罄
  { id: 'l2', name: '多肉葡萄冻冻', price: 15.00, spec: '标准', stock: 0, status: 'sold_out', tags: [], type: '长期沽清', time: '11:15', rank: 2, channels: { pos: 'sold_out', mini_take: 'sold_out', meituan: 'sold_out', taobao: 'sold_out' }, channelStocks: { pos: 0, mini_take: 0, meituan: 0, taobao: 0 }, channelTypes: { pos: '长期', mini_take: '长期', meituan: '长期', taobao: '长期' } },
  
  // 场景3：各渠道库存不同，但都没有售罄（低库存预警）
  { id: 'l3', name: '招牌红烧肉盖饭', price: 38.00, spec: '标准', stock: 25, status: 'warning', tags: [], type: '当日沽清', time: '09:00', rank: 3, channels: { pos: 'normal', mini_take: 'normal', meituan: 'normal', taobao: 'normal' }, channelStocks: { pos: 10, mini_take: 5, meituan: 8, taobao: 2 }, channelTypes: { pos: '当日', mini_take: '当日', meituan: '当日', taobao: '当日' } },
  
  // 场景4：全渠道库存完全一致的低库存
  { id: 'l4', name: '老火例汤', price: 12.00, spec: '按餐段', stock: 8, status: 'warning', tags: [], type: '长期沽清', time: '14:20', rank: 4, channels: { pos: 'normal', mini_take: 'normal', meituan: 'normal' }, channelStocks: { pos: 8, mini_take: 8, meituan: 8 }, channelTypes: { pos: '长期', mini_take: '长期', meituan: '长期' } },
  
  // 场景5：单渠道特殊沽清（仅美团沽清）
  { id: 'l5', name: '麻辣小龙虾', price: 128.00, spec: '大份/约500g', stock: 15, status: 'warning', tags: [], type: 'mixed', time: '15:00', rank: 5, channels: { pos: 'normal', mini_take: 'normal', meituan: 'sold_out' }, channelStocks: { pos: 15, mini_take: 5, meituan: 0 }, channelTypes: { meituan: '当日' } },
  
  // 场景6：分组隔离示例（仅外卖渠道沽清）
  { id: 'l6', name: '香煎三文鱼', price: 0.58, spec: '称重', stock: 1200, status: 'warning', tags: [], type: 'mixed', time: '16:00', rank: 6, channels: { pos: 'normal', mini_take: 'sold_out', meituan: 'sold_out' }, channelStocks: { pos: 1200, mini_take: 0, meituan: 0 }, channelTypes: { mini_take: '当日', meituan: '当日' } },
];

export const PosStockoutView: React.FC<{showImage: boolean}> = ({ showImage }) => {
  const { activeBrandId, brandConfigs } = useProducts();
  const currentBrandConfig = useMemo(() => brandConfigs[activeBrandId], [brandConfigs, activeBrandId]);
  const isStockShared = currentBrandConfig?.features.stock_shared ?? true;
  const enableChannelGrouping = currentBrandConfig?.enableChannelGrouping ?? false;
  const channelGroups = currentBrandConfig?.channelGroups || [];
  const posStockoutMode = currentBrandConfig?.posStockoutMode || 'spu';
  const posStockoutWarningThreshold = currentBrandConfig?.posStockoutWarningThreshold ?? 30;

  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Left Panel Batch Mode
  const [isLeftBatchMode, setIsLeftBatchMode] = useState(false);
  const [leftSelectedIds, setLeftSelectedIds] = useState<Set<string>>(new Set());

  // Channel View State (only used when isStockShared is false)
  // CRITICAL FIX: The initial state MUST be a valid single channel ID, never an empty string or invalid group ID.
  const [activeChannelTab, setActiveChannelTab] = useState<string>('pos'); 

  // The dropdown options are ALWAYS the atomic channels, regardless of grouping.
  const channelTabs = useMemo(() => {
      if (isStockShared) return []; // No tabs needed
      return FILTER_CHANNEL_OPTIONS.filter(opt => opt.id !== 'all');
  }, [isStockShared]);

  // Clean up any stray group IDs if the config changes
  React.useEffect(() => {
      if (!isStockShared && channelTabs.length > 0) {
          if (!channelTabs.some(t => t.id === activeChannelTab)) {
              setActiveChannelTab('pos');
          }
      }
  }, [isStockShared, channelTabs, activeChannelTab]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelSelectedChannels, setCancelSelectedChannels] = useState<string[]>([]);

  // Initialize selected channels for cancellation
  React.useEffect(() => {
      if (cancelConfirmOpen) {
          if (isStockShared) {
              setCancelSelectedChannels([]);
          } else {
              const validChannels = CHANNEL_TABS.map(t => t.id);
              if (editingTarget && !isBatchMode && !isLeftBatchMode) {
                  // Single product
                  setCancelSelectedChannels(validChannels.filter(chId => {
                      const dataKey = chId === 'mini_dine' || chId === 'mini_take' || chId === 'mini_pickup' ? 'mini' : chId;
                      return editingTarget.channels[dataKey as any] !== 'unmapped';
                  }));
              } else {
                  // Batch mode
                  setCancelSelectedChannels(validChannels);
              }
          }
      }
  }, [cancelConfirmOpen, editingTarget, isBatchMode, isLeftBatchMode, isStockShared]);

  const toggleCancelChannel = (c: string) => {
      setCancelSelectedChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const displayList = useMemo(() => {
      const threshold = posStockoutWarningThreshold ?? 30;
      
      if (isStockShared) {
          return MOCK_LEFT_LOGS.filter(log => log.status === 'sold_out' || log.stock < threshold);
      }
      
      // Use the raw state. The useEffect guarantees it will eventually be valid.
      // But we need a fallback for the very first render cycle if activeChannelTab is somehow 'self_operated'
      const currentTab = channelTabs.some(t => t.id === activeChannelTab) ? activeChannelTab : 'pos';
      
      return MOCK_LEFT_LOGS.filter(log => {
          // Add extra safety for channels objects
          if (!log.channels || !log.channelStocks) return false;
          
          const channelStatus = log.channels[currentTab];
          const channelStock = log.channelStocks[currentTab];
          
          // Show if completely sold out in this channel
          if (channelStatus === 'sold_out') return true;
          // Show if stock is low (< threshold) in this channel
          if (channelStock !== undefined && channelStock !== null && channelStock < threshold) return true;
          
          return false;
      });
  }, [isStockShared, activeChannelTab, channelTabs, posStockoutWarningThreshold]);

  const currentList = useMemo(() => {
      let list = MOCK_DISPLAY_PRODUCTS.filter(p => p.name.includes(searchQuery));
      
      if (selectedCategory !== '全部') {
          list = list.filter(p => {
              if (selectedCategory === '加料') return p.tags && p.tags.some((t: any) => t.text === '加料');
              return true;
          });
      }
      
      // If SKU mode is enabled, flatten multi-spec products into individual SKU cards
      if (posStockoutMode === 'sku') {
          const flatList: any[] = [];
          list.forEach(p => {
              if (p.hasMultipleSpecs && p.specs) {
                  p.specs.forEach((sku: any) => {
                      flatList.push({
                          ...p,
                          id: `${p.id}_${sku.id}`, // unique composite ID
                          spec: sku.name, // override SPU '多规格' text with specific SKU name
                          stock: sku.stock,
                          hasMultipleSpecs: false, // treat as single spec for rendering
                          isFlattenedSku: true, // flag to know it's a flattened SKU
                          // For simplicity in mock, assume channel stocks are proportional or inherit SPU's overall logic
                          // In real world, SKU would have its own channelStocks object
                      });
                  });
              } else {
                  flatList.push(p);
              }
          });
          return flatList;
      }
      
      return list;
  }, [searchQuery, posStockoutMode, selectedCategory]);

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
     let isOverallSoldOut = false;
     let isPartialSoldOut = false;
     
     // Calculate Stock & Status based on active view mode
     let displayStock: string | number = item.stock;
     
     if (!isStockShared) {
         // Single channel view ONLY
         const currentTab = channelTabs.some(t => t.id === activeChannelTab) ? activeChannelTab : 'pos';
         displayStock = item.channelStocks?.[currentTab] ?? 0;
         
         // If displayStock is a number and is 0, it is overall sold out FOR THIS CHANNEL/GROUP
         if (typeof displayStock === 'number' && displayStock <= 0) {
             isOverallSoldOut = true;
         }
     } else {
        // Shared stock mode
        if (displayStock <= 0) isOverallSoldOut = true;
     }

     // 多规格商品（SPU模式）的部分售罄逻辑
     if (item.hasMultipleSpecs && item.specs && !item.isFlattenedSku) {
         const allSpecsSoldOut = item.specs.every((sku: any) => sku.stock <= 0);
         const someSpecsSoldOut = item.specs.some((sku: any) => sku.stock <= 0);
         
         if (allSpecsSoldOut) {
             isOverallSoldOut = true;
         } else if (someSpecsSoldOut) {
             isPartialSoldOut = true;
         }
     }

     // Grid View
     return (
        <div key={item.id} onClick={() => handleItemClick(item)} className={`relative bg-white rounded-xl shadow-sm cursor-pointer transition-all border flex flex-col ${showImage ? 'p-3' : 'p-4'} ${showImage ? 'h-[100px]' : 'h-[140px]'} group hover:shadow-md overflow-hidden ${isBatchMode && isSelected ? 'border-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100 hover:border-[#00C06B]/30'}`}>
           {isOverallSoldOut && !isBatchMode && <div className="absolute inset-0 bg-white/60 z-10 pointer-events-none transition-opacity"></div>}
           
           <div className="flex h-full relative z-0">
               {showImage && (
                   <div className="w-16 h-16 bg-gray-100 rounded-lg mr-3 flex items-center justify-center text-gray-400 text-xs shrink-0 relative mt-1">
                       <Image size={20} className="text-gray-300" />
                       {/* Floating tags over image for Image Mode */}
                       {item.tags && item.tags.length > 0 && (
                           <div className="absolute -top-1.5 -left-1.5 flex flex-col gap-0.5">
                               {item.tags.map((tag: any, idx: number) => <span key={idx} className={`text-[9px] px-1 py-0.5 rounded text-white font-bold shadow-sm ${tag.color === 'green' ? 'bg-[#00C06B]' : tag.color === 'blue' ? 'bg-blue-600' : 'bg-orange-500'}`}>{tag.text}</span>)}
                           </div>
                       )}
                   </div>
               )}
               
               <div className="flex flex-col flex-1 min-w-0">
                   <div className="flex items-start justify-between mb-1">
                      <div className="flex flex-col w-full relative">
                          {/* Tags above name for No-Image Mode */}
                          {!showImage && item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1.5 mt-0.5">
                                  {item.tags.map((tag: any, idx: number) => <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold ${tag.color === 'green' ? 'bg-[#00C06B]' : tag.color === 'blue' ? 'bg-blue-600' : 'bg-orange-500'}`}>{tag.text}</span>)}
                              </div>
                          )}
                          <h3 className={`font-bold text-gray-900 ${showImage ? 'text-[15px] mt-1' : 'text-[16px]'} leading-snug line-clamp-2 w-full ${isPartialSoldOut ? 'pr-12' : ''}`}>
                              {item.name}
                              {item.hasMultipleSpecs ? <span className="text-[12px] font-normal text-blue-500 ml-1 bg-blue-50 px-1 rounded inline-block align-text-bottom">多规格</span> : (!['标准', '称重', '按餐段'].includes(item.spec) && <span className="text-[13px] font-normal text-gray-500 ml-1">({item.spec})</span>)}
                          </h3>
                      </div>
                   </div>
                   
                   <div className={`mt-auto flex items-end justify-between ${showImage ? 'pt-1' : 'pt-2 border-t border-gray-50 border-dashed'}`}>
                       <span className="text-[14px] font-bold text-orange-500">
                           {isOverallSoldOut || item.hasMultipleSpecs ? '' : (!isStockShared && activeChannelTab === 'all' ? '' : `剩余 ${displayStock}`)}
                       </span>
                       <div className={`font-bold font-mono text-xl leading-none ${isOverallSoldOut ? 'text-gray-300' : 'text-gray-800'}`}>
                           <span className="text-xs mr-0.5">¥</span>{item.price?.toFixed(2)}
                       </div>
                   </div>
               </div>
           </div>
           
           {isOverallSoldOut && <div className="absolute right-4 bottom-8 transform rotate-[-12deg] pointer-events-none z-20"><div className="border-[3px] border-red-500 text-red-500 rounded-lg px-3 py-1 text-lg font-black bg-white/90 shadow-sm backdrop-blur-[1px]">已售罄</div></div>}
           
           {/* Adjusted Partial Sold Out Badge Position */}
           {isPartialSoldOut && !isBatchMode && (
               <div className={`absolute z-20 right-0 top-0`}>
                   <div className="bg-orange-50 text-orange-500 font-bold shadow-sm rounded-bl-lg rounded-tr-xl px-2 py-1 text-[10px]">
                       部分售罄
                   </div>
               </div>
           )}
           
           {isBatchMode && (
               <div className="absolute top-2 right-2 z-30">
                   {isSelected ? <CheckCircle2 size={22} className="text-[#00C06B] fill-white"/> : <Circle size={22} className="text-gray-200 fill-transparent group-hover:text-[#00C06B]/50"/>}
               </div>
           )}
        </div>
     );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F5F6FA] overflow-hidden font-sans relative">
        {/* Global Header (Highest Hierarchy) */}
        <div className="bg-white border-b border-gray-200 h-14 flex items-center px-6 shrink-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-x-8">
            {/* Left Section: Channel Selector */}
            <div className="flex items-center h-full shrink-0">
                {!isStockShared && channelTabs.length > 0 ? (
                    <>
                        <div className="flex items-center text-sm font-bold text-gray-800 mr-4">
                            <Layers size={16} className="text-[#00C06B] mr-2" />
                            当前操作渠道/分组：
                        </div>
                        {/* 无论是否开启渠道分组，顶部始终只展示原子的单渠道下拉框 */}
                        <div className="relative group flex items-center bg-gray-50 rounded-lg px-3 py-1 border border-gray-200 cursor-pointer hover:border-[#00C06B]/30 transition-all min-w-[120px]">
                            <select 
                                value={channelTabs.some(t => t.id === activeChannelTab) ? activeChannelTab : 'pos'}
                                onChange={(e) => setActiveChannelTab(e.target.value)}
                                className="bg-transparent text-[13px] font-bold text-gray-700 outline-none cursor-pointer appearance-none pr-6 w-full"
                            >
                                {channelTabs.map(tab => (
                                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="text-gray-400 absolute right-2 pointer-events-none"/>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center text-sm font-bold text-gray-800">
                        <Layers size={16} className="text-[#00C06B] mr-2" />
                        全渠道统一管理模式
                    </div>
                )}
            </div>

            {/* Right Section: Global Search */}
            <div className="flex-1 flex items-center h-full max-w-[400px]">
                <div className="relative group w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00C06B] transition-colors" size={16} />
                    <input 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full pl-10 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-[#00C06B] focus:bg-white transition-all font-medium" 
                        placeholder="支持商品名称/拼音/助记码搜索"
                    />
                </div>
            </div>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Today's Stockout / Low Stock Warnings */}
            <div className="w-[340px] bg-white border-r border-gray-200 flex flex-col z-10 shrink-0 relative">
                <div className="flex flex-col border-b border-gray-100 bg-white shrink-0">
                    <div className="h-14 flex items-center justify-between px-5">
                        <div className="flex items-center">
                            <span className="font-bold text-gray-800 text-[16px] mr-2">今日已沽清/低库存预警</span>
                            {displayList.length > 0 && (<span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{displayList.length}</span>)}
                        </div>
                        {displayList.length > 0 && (
                            <span className="text-xs font-medium text-gray-400">滑动查看更多</span>
                        )}
                    </div>
                </div>
                
                <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                    <div className="flex items-start">
                        <AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0 text-orange-500 fill-orange-100"/>
                        <span className="text-[12px] text-orange-700 leading-snug">剩余数量小于 {posStockoutWarningThreshold} 的商品将显示在此预警列表，点击可极速操作。</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {displayList.map((item) => {
                        let isOverallSoldOut = false;
                        let isPartialSoldOut = false;
                        let hasStock = true;
                        let channelStockEntries: {channel: string, stock: number}[] = [];
                        
                        let displayStock: number = item.stock;
                        let displayType: string = item.type;

                        if (!isStockShared) {
                            const currentTab = channelTabs.some(t => t.id === activeChannelTab) ? activeChannelTab : 'pos';
                            displayStock = item.channelStocks?.[currentTab] ?? 0;
                            displayType = item.channelTypes?.[currentTab] || '当日沽清';
                            
                            hasStock = displayStock > 0;
                            isOverallSoldOut = !hasStock;
                        } else {
                            hasStock = item.stock > 0;
                            isOverallSoldOut = !hasStock;
                        }

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
                                        handleItemClick(item);
                                    }
                                }} 
                                className={`border-b border-gray-100 cursor-pointer group transition-all relative ${isLeftBatchMode && leftSelectedIds.has(item.id) ? 'bg-[#00C06B]/5 border-l-4 border-l-[#00C06B]' : 'hover:bg-[#00C06B]/5 border-l-4 border-l-transparent'}`}
                            >
                                <div className="px-5 py-4 flex items-center">
                                    {isLeftBatchMode && (
                                        <div className="mr-3">
                                            {leftSelectedIds.has(item.id) ? <CheckCircle2 size={20} className="text-[#00C06B] fill-white"/> : <Circle size={20} className="text-gray-200 fill-transparent"/>}
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between flex-1 min-w-0">
                            <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                                <div className="flex items-center mb-1 w-full relative">
                                    <span className="font-bold text-[14px] text-gray-900 truncate flex-1">{item.name}</span>
                                    {(isStockShared || activeChannelTab !== 'all') && (
                                        (!isStockShared && displayType === 'mixed') ? (
                                            <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded leading-none whitespace-nowrap ml-2 absolute right-0 -top-1 shadow-sm">多态沽清</span>
                                        ) : (displayType === '长期沽清' || displayType === '长期') ? (
                                            <span className="shrink-0 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded leading-none whitespace-nowrap ml-2 absolute right-0 -top-1 shadow-sm">长期沽清</span>
                                        ) : (
                                            <span className="shrink-0 text-[10px] font-bold text-[#00C06B] bg-[#00C06B]/10 border border-[#00C06B]/20 px-1.5 py-0.5 rounded leading-none whitespace-nowrap ml-2 absolute right-0 -top-1 shadow-sm">当日沽清</span>
                                        )
                                    )}
                                </div>
                                <div className="text-[11px] text-gray-400 font-medium mb-1.5 truncate">
                                    {item.spec}
                                </div>
                                {(!isStockShared && activeChannelTab === 'all') && (
                                    <div className="flex flex-wrap gap-1 mt-auto w-full">
                                        {Object.entries(item.channelStocks).map(([channel, channelStock]) => {
                                            const tab = FILTER_CHANNEL_OPTIONS.find(t => t.id === channel);
                                            const isZero = channelStock === 0;
                                            // Dynamic color based on stock and specific clearance type
                                            const clearanceType = item.channelTypes?.[channel];
                                            let bgClass = "bg-blue-50 text-blue-600 border border-blue-100"; // Default stock normal/low stock
                                            let displayContent = `${tab?.shortLabel || channel}: ${channelStock}`;
                                            
                                            if (isZero) {
                                                if (clearanceType === '长期') {
                                                    bgClass = "bg-orange-50 text-orange-600 border border-orange-100";
                                                    displayContent = `${tab?.shortLabel || channel}: 0 (长期)`;
                                                } else if (clearanceType === '当日') {
                                                    bgClass = "bg-blue-50 text-blue-600 border border-blue-100";
                                                    displayContent = `${tab?.shortLabel || channel}: 0 (当日)`;
                                                } else {
                                                    bgClass = "bg-red-50 text-red-500 border border-red-100"; // Fallback sold out
                                                    displayContent = `${tab?.shortLabel || channel}: 0`;
                                                }
                                            }

                                            return (
                                                <span key={channel} className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shrink-0 ${bgClass}`}>
                                                    {displayContent}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                                        <div className="flex flex-col items-end justify-center shrink-0 w-[60px]">
                                            {hasStock ? (
                                                isStockShared ? (
                                                    <>
                                                        <span className="text-[#00C06B] text-xl font-bold font-mono leading-none">{displayStock}</span>
                                                        <span className="text-[10px] text-gray-400 mt-1">剩余</span>
                                                    </>
                                                ) : (
                                                    activeChannelTab === 'all' ? (
                                                        <div className="flex flex-col items-end justify-center h-full">
                                                            <span className={`text-[12px] font-bold ${isPartialSoldOut ? 'text-orange-500' : 'text-blue-500'}`}>
                                                                {isPartialSoldOut ? '部分售罄' : '低库存'}
                                                            </span>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setEditingTarget(item); setCancelConfirmOpen(true); }} 
                                                                className="mt-1 text-gray-300 hover:text-[#00C06B] p-1 rounded-full hover:bg-[#00C06B]/10 transition-colors"
                                                                title="取消沽清 (恢复库存)"
                                                            >
                                                                <RotateCcw size={14}/>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-[#00C06B] text-xl font-bold font-mono leading-none">{displayStock}</span>
                                                            <span className="text-[10px] text-gray-400 mt-1">剩余</span>
                                                        </>
                                                    )
                                                )
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-red-500 text-sm font-bold">已售罄</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingTarget(item); setCancelConfirmOpen(true); }} 
                                                        className="mt-1 text-gray-300 hover:text-[#00C06B] p-1 rounded-full hover:bg-[#00C06B]/10 transition-colors"
                                                        title="取消沽清 (恢复库存)"
                                                    >
                                                        <RotateCcw size={14}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                                    const allIds = displayList.map(i => i.id);
                                    if (leftSelectedIds.size === allIds.length) {
                                        setLeftSelectedIds(new Set());
                                    } else {
                                        setLeftSelectedIds(new Set(allIds));
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
                                        setSelectedIds(leftSelectedIds);
                                        setIsBatchMode(true);
                                        setModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded bg-[#00C06B] text-white font-bold disabled:opacity-50 transition-all text-xs hover:bg-[#00A35B]"
                                >
                                    沽清
                                </button>
                                <button 
                                    disabled={leftSelectedIds.size === 0} 
                                    onClick={() => setCancelConfirmOpen(true)}
                                    className="px-3 py-1.5 rounded bg-white border border-gray-200 text-red-500 font-bold disabled:opacity-50 transition-all text-xs hover:border-red-500"
                                >
                                    取消
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
            <div className="flex-1 flex flex-col bg-[#F5F6FA] relative min-w-0">
                <div className="bg-white border-b border-gray-200 px-5 flex items-center justify-between overflow-x-auto no-scrollbar shrink-0 z-10">
                    <div className="flex items-center space-x-1 flex-1">
                        <button onClick={() => setSelectedCategory('全部')} className={`px-5 py-3 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${selectedCategory === '全部' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>全部</button>
                        <button onClick={() => setSelectedCategory('加料')} className={`px-5 py-3 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${selectedCategory === '加料' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>加料</button>
                        {CATEGORIES.slice(1).map(c => (
                            <button key={c} onClick={() => setSelectedCategory(c)} className={`px-5 py-3 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${selectedCategory === c ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{c}</button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 pb-24 no-scrollbar">
                    <div className={`grid gap-4 content-start ${showImage ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                        {currentList.map(item => renderProductClearanceCard(item, selectedIds.has(item.id)))}
                    </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-between px-6 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center space-x-4">
                        {!isBatchMode ? (
                            <button onClick={() => setIsBatchMode(true)} className="px-6 py-2.5 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 text-sm transition-all flex items-center">
                                <CheckSquare size={16} className="mr-2"/> 批量管理
                            </button>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <button onClick={() => { setModalOpen(true); }} disabled={selectedIds.size === 0} className="px-6 py-2.5 rounded-lg bg-white border border-gray-200 hover:border-red-500 text-red-600 font-bold shadow-sm disabled:opacity-50 transition-all flex items-center">
                                    批量沽清
                                </button>
                                <button onClick={() => { setCancelConfirmOpen(true); }} disabled={selectedIds.size === 0} className="px-6 py-2.5 rounded-lg bg-white border border-gray-200 hover:border-[#00C06B] text-[#00C06B] font-bold shadow-sm disabled:opacity-50 transition-all flex items-center">
                                    取消沽清 (恢复库存)
                                </button>
                                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                                <button onClick={() => { setIsBatchMode(false); setSelectedIds(new Set()); }} className="px-4 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100 text-sm">
                                    退出批量
                                </button>
                                <span className="text-sm font-bold text-gray-800 ml-4">已选 <span className="text-blue-600 mx-1">{selectedIds.size}</span> 项</span>
                            </div>
                        )}
                        <button className="px-4 py-2 rounded-lg text-gray-500 font-bold hover:text-[#00C06B] text-sm flex items-center transition-colors">
                            <RefreshCw size={16} className="mr-2"/> 刷新
                        </button>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-500 font-medium">
                        <span>共 {currentList.length} 条</span>
                        <div className="flex space-x-1">
                            <button className="w-8 h-8 border rounded flex items-center justify-center bg-gray-50 text-gray-400 cursor-not-allowed"><ChevronLeft size={14}/></button>
                            <button className="w-8 h-8 border rounded flex items-center justify-center hover:border-[#00C06B] hover:text-[#00C06B] transition-colors"><ChevronRight size={14}/></button>
                        </div>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <ClearanceSettingsModal 
                   product={editingTarget} 
                   batchIds={isBatchMode ? Array.from(selectedIds) : undefined}
                   isBatch={isBatchMode}
                   onClose={() => { setModalOpen(false); setEditingTarget(null); }}
                   onConfirm={() => {
                       setModalOpen(false);
                       setEditingTarget(null);
                       if (isBatchMode) {
                           setSelectedIds(new Set());
                           setIsBatchMode(false);
                       }
                   }}
                   activeChannel="all"
                />
            )}
        </div>

        {/* Cancel Clearance Confirm Dialog */}
        {cancelConfirmOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden animate-in zoom-in-95 font-sans">
                    <div className="p-6">
                        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">确认取消沽清？</h3>
                        <p className="text-gray-500 text-sm text-center mb-6">
                            取消沽清后，
                            {isLeftBatchMode ? (
                                <>选中的 <span className="font-bold text-[#333]">{leftSelectedIds.size}</span> 个预警商品</>
                            ) : isBatchMode ? (
                                <>选中的 <span className="font-bold text-[#333]">{selectedIds.size}</span> 个商品</>
                            ) : (
                                <>该商品 <span className="font-bold text-[#333]">{editingTarget?.name}</span></>
                            )}
                            将被<span className="text-orange-500 font-bold">恢复为无限库存状态</span>，并允许在<span className="font-bold text-[#333] mx-1">{isStockShared ? '所有关联渠道' : '下方选中渠道'}</span>正常售卖。
                        </p>

                        {!isStockShared && (
                            <div className="bg-[#F7F8FA] rounded-xl p-5 border border-[#E8E8E8]">
                                <div className="text-xs font-bold text-gray-700 mb-3">选择生效渠道</div>
                                {enableChannelGrouping ? (
                                    <div className="space-y-3">
                                        {channelGroups.map(group => {
                                            const groupChannels = group.channels.filter(c => CHANNEL_TABS.some(t => t.id === c));
                                            if (groupChannels.length === 0) return null;
                                            
                                            const isGroupActive = groupChannels.every(id => cancelSelectedChannels.includes(id));
                                            return (
                                                <div 
                                                    key={group.id}
                                                    onClick={() => {
                                                        if (isGroupActive) setCancelSelectedChannels(prev => prev.filter(id => !groupChannels.includes(id)));
                                                        else setCancelSelectedChannels(prev => Array.from(new Set([...prev, ...groupChannels])));
                                                    }}
                                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isGroupActive ? 'bg-[#00C06B]/10 border-[#00C06B] shadow-sm text-[#00C06B]' : 'bg-white border-gray-200 text-gray-600 hover:border-[#00C06B]/50'}`}
                                                >
                                                    <span className="font-bold text-sm">{group.name}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {groupChannels.map(cId => (
                                                            <span key={cId} className={`text-[10px] px-1.5 py-0.5 rounded border ${isGroupActive ? 'bg-white border-[#00C06B]/30 text-[#00C06B]' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                                {CHANNEL_TABS.find(t => t.id === cId)?.label || cId}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {CHANNEL_TABS.map(tab => {
                                            const isActive = cancelSelectedChannels.includes(tab.id);
                                            return (
                                                <div 
                                                    key={tab.id}
                                                    onClick={() => toggleCancelChannel(tab.id)}
                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${isActive ? 'bg-[#00C06B]/10 border-[#00C06B] shadow-sm text-[#00C06B]' : 'bg-white border-gray-200 text-gray-600 hover:border-[#00C06B]/50'}`}
                                                >
                                                    <span className="text-sm font-bold">{tab.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex border-t border-gray-100">
                        <button onClick={() => { setCancelConfirmOpen(false); setEditingTarget(null); }} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 transition-colors">再想想</button>
                        <div className="w-px bg-gray-100"></div>
                        <button 
                            onClick={() => {
                                // Execute cancel clearance logic here
                                setCancelConfirmOpen(false);
                                setEditingTarget(null);
                                if (isLeftBatchMode) {
                                    setLeftSelectedIds(new Set());
                                    setIsLeftBatchMode(false);
                                }
                                if (isBatchMode) {
                                    setSelectedIds(new Set());
                                    setIsBatchMode(false);
                                }
                            }} 
                            disabled={!isStockShared && cancelSelectedChannels.length === 0}
                            className={`flex-1 py-4 font-bold transition-colors ${(!isStockShared && cancelSelectedChannels.length === 0) ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-[#00C06B] hover:bg-[#00C06B]/5'}`}
                        >
                            确认恢复
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
