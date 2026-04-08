
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Check, AlertTriangle, Link2Off, RotateCcw, CheckSquare, RefreshCw, Layers, LayoutGrid, Menu, CheckCircle2, Circle, ChevronLeft, ChevronRight, Image, AlignJustify } from 'lucide-react';
import { useProducts } from '../../context';
import { FILTER_CHANNEL_OPTIONS, CHANNEL_TABS, CategoryButton, ChannelType } from './PosCommon';
import { CATEGORIES } from '../../types';
import { ClearanceSettingsModal } from './PosModals';

const MOCK_DISPLAY_PRODUCTS = [
  { id: 'p1', name: '招牌红烧肉盖饭', price: 38.00, spec: '标准', stock: 80, status: 'warning', tags: [{ text: '套餐', color: 'green' }], channels: { pos: 'normal', mini: 'normal', meituan: 'unmapped', taobao: 'normal' }, channelStocks: { pos: 80, mini: 50, meituan: 0, taobao: 20 } },
  { id: 'p2', name: '香煎三文鱼', price: 0.58, spec: '称重', stock: 1200, status: 'normal', tags: [{ text: '称重', color: 'blue' }], channels: { pos: 'normal', mini: 'normal', meituan: 'normal', taobao: 'sold_out' }, channelStocks: { pos: 1200, mini: 800, meituan: 1200, taobao: 0 } },
  { id: 'p3', name: '生椰拿铁', price: 18.00, spec: '多规格', stock: 15, status: 'sold_out', tags: [], channels: { pos: 'normal', mini: 'normal', meituan: 'sold_out', taobao: 'normal' }, channelStocks: { pos: 15, mini: 15, meituan: 0, taobao: 5 }, hasMultipleSpecs: true, specs: [{id: 's1', name: '大杯', stock: 10}, {id: 's2', name: '中杯', stock: 5}, {id: 's3', name: '小杯', stock: 0}] },
  { id: 'p4', name: '老火例汤', price: 12.00, spec: '按餐段', stock: 10, status: 'warning', tags: [], channels: { pos: 'normal', mini: 'normal', meituan: 'normal' }, channelStocks: { pos: 10, mini: 10, meituan: 10 } },
  { id: 'p5', name: '麻辣小龙虾', price: 128.00, spec: '大份/约500g', stock: 55, status: 'normal', tags: [], channels: { pos: 'normal', mini: 'normal', meituan: 'normal' }, channelStocks: { pos: 55, mini: 30, meituan: 30 } },
  { id: 'p6', name: '手打柠檬茶', price: 18.00, spec: '多规格', stock: 0, status: 'sold_out', tags: [], channels: { pos: 'sold_out', mini: 'sold_out', meituan: 'sold_out' }, channelStocks: { pos: 0, mini: 0, meituan: 0 }, hasMultipleSpecs: true, specs: [{id: 's4', name: '标准', stock: 0}] },
];

const MOCK_LEFT_LOGS = [
  // 场景1：部分渠道售罄（美团/小程序为0，但POS和淘宝还有）
  { id: 'l1', name: '生椰拿铁', price: 18.00, spec: '大杯', stock: 5, status: 'warning', tags: [], type: '当日沽清', time: '10:30', rank: 1, channels: { pos: 'normal', mini: 'sold_out', meituan: 'sold_out', taobao: 'normal' }, channelStocks: { pos: 3, mini: 0, meituan: 0, taobao: 2 }, hasMultipleSpecs: true, specs: [{id: 's1', name: '大杯', stock: 3}, {id: 's2', name: '中杯', stock: 0}, {id: 's3', name: '小杯', stock: 0}] },
  
  // 场景2：全渠道彻底售罄
  { id: 'l2', name: '多肉葡萄冻冻', price: 15.00, spec: '标准', stock: 0, status: 'sold_out', tags: [], type: '长期沽清', time: '11:15', rank: 2, channels: { pos: 'sold_out', mini: 'sold_out', meituan: 'sold_out', taobao: 'sold_out' }, channelStocks: { pos: 0, mini: 0, meituan: 0, taobao: 0 } },
  
  // 场景3：各渠道库存不同，但都没有售罄（低库存预警）
  { id: 'l3', name: '招牌红烧肉盖饭', price: 38.00, spec: '标准', stock: 25, status: 'warning', tags: [], type: '当日沽清', time: '09:00', rank: 3, channels: { pos: 'normal', mini: 'normal', meituan: 'normal', taobao: 'normal' }, channelStocks: { pos: 10, mini: 5, meituan: 8, taobao: 2 } },
  
  // 场景4：全渠道库存完全一致的低库存
  { id: 'l4', name: '老火例汤', price: 12.00, spec: '按餐段', stock: 8, status: 'warning', tags: [], type: '长期沽清', time: '14:20', rank: 4, channels: { pos: 'normal', mini: 'normal', meituan: 'normal' }, channelStocks: { pos: 8, mini: 8, meituan: 8 } },
  
  // 场景5：单渠道售罄（比如只关了外卖）
  { id: 'l5', name: '麻辣小龙虾', price: 128.00, spec: '大份/约500g', stock: 20, status: 'warning', tags: [], type: '当日沽清', time: '22:00', rank: 5, channels: { pos: 'normal', mini: 'normal', meituan: 'sold_out' }, channelStocks: { pos: 15, mini: 5, meituan: 0 } },
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
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState<any>(null);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const currentList = useMemo(() => {
      let list = MOCK_DISPLAY_PRODUCTS.filter(p => p.name.includes(searchQuery));
      
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
  }, [searchQuery, posStockoutMode]);

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
     
     // Calculate Stock & Status based on All Channels (Store Level)
     let displayStock: string | number = item.stock;
     
     if (!isStockShared) {
         const stocks = Object.values(item.channelStocks || {}) as number[];
         if (stocks.every(s => s <= 0)) isOverallSoldOut = true;
         else if (stocks.some(s => s <= 0) && stocks.some(s => s > 0)) isPartialSoldOut = true;
         
         // In independent mode, right cards just show a badge, not capsules
         displayStock = isPartialSoldOut ? '部分售罄' : '多渠道';
     } else {
        if (displayStock <= 0) isOverallSoldOut = true;
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
                           {isOverallSoldOut ? '' : (!isStockShared || item.hasMultipleSpecs ? '' : `剩余 ${displayStock}`)}
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
    <div className="flex h-full w-full bg-[#F5F6FA] overflow-hidden font-sans relative">
        <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Today's Stockout / Low Stock Warnings */}
            <div className="w-[340px] bg-white border-r border-gray-200 flex flex-col z-10 shrink-0">
                <div className="flex flex-col border-b border-gray-100 bg-white shrink-0">
                    <div className="h-14 flex items-center justify-between px-5">
                        <div className="flex items-center">
                            <span className="font-bold text-gray-800 text-[16px] mr-2">今日已沽清/低库存预警</span>
                            {MOCK_LEFT_LOGS.length > 0 && (<span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{MOCK_LEFT_LOGS.length}</span>)}
                        </div>
                    </div>
                </div>
                
                <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                    <div className="flex items-start">
                        <AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0 text-orange-500 fill-orange-100"/>
                        <span className="text-[12px] text-orange-700 leading-snug">剩余数量小于 {posStockoutWarningThreshold} 的商品将显示在此预警列表，点击可极速操作。</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {MOCK_LEFT_LOGS.filter(item => item.stock < posStockoutWarningThreshold).map((item) => {
                        let isOverallSoldOut = false;
                        let isPartialSoldOut = false;
                        let hasStock = true;
                        let channelStockEntries: {channel: string, stock: number}[] = [];

                        if (!isStockShared) {
                            const stocks = Object.entries(item.channelStocks || {}) as [string, number][];
                            const stockValues = stocks.map(s => s[1]);
                            if (stockValues.every(s => s <= 0)) {
                                isOverallSoldOut = true;
                                hasStock = false;
                            } else if (stockValues.some(s => s <= 0) && stockValues.some(s => s > 0)) {
                                isPartialSoldOut = true;
                            }
                            channelStockEntries = stocks.filter(s => s[1] > 0);
                        } else {
                            hasStock = item.stock > 0;
                            isOverallSoldOut = !hasStock;
                        }

                        return (
                            <div key={item.id} onClick={() => handleItemClick(item)} className="border-b border-gray-100 cursor-pointer group transition-all relative hover:bg-[#00C06B]/5">
                                <div className="px-5 py-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 mr-2">
                                            <div className="flex items-center mb-1.5 flex-wrap gap-1.5">
                                                <span className="text-gray-400 text-xs font-bold mr-1 w-4 shrink-0">{item.rank}</span>
                                                <div className="font-bold text-gray-800 text-[15px] truncate max-w-[120px]">{item.name}</div>
                                                {/* Display specific Spec Name if it's a multi-spec item (SKU level display) */}
                                                {item.hasMultipleSpecs && <span className="text-xs text-gray-500 truncate shrink-0">({item.spec})</span>}
                                                
                                                {/* Moved Clearance Type tag here, right next to the name/spec */}
                                                <span className={`text-[10px] border px-1.5 py-0.5 rounded font-medium shrink-0 ${item.type === '当日沽清' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            
                                            {/* Left Panel Inline Badges for Independent Mode - Now on its own line */}
                                            {!isStockShared && hasStock && (
                                                <div className="flex flex-wrap gap-1 pl-6 mb-1">
                                                    {channelStockEntries.slice(0, 3).map(([ch, st]) => {
                                                        const chName = FILTER_CHANNEL_OPTIONS.find(opt => opt.id === ch)?.shortLabel || ch;
                                                        return (
                                                            <span key={ch} className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#00C06B]/10 text-[10px] font-bold text-[#00C06B]">
                                                                {chName}: <span className="font-mono ml-0.5">{st}</span>
                                                            </span>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end justify-center shrink-0 w-[60px]">
                                            {hasStock ? (
                                                isStockShared ? (
                                                    <>
                                                        <span className="text-[#00C06B] text-xl font-bold font-mono leading-none">{item.stock}</span>
                                                        <span className="text-[10px] text-gray-400 mt-1">剩余</span>
                                                    </>
                                                ) : (
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
            </div>

            {/* Right Panel: Main Workspace */}
            <div className="flex-1 flex flex-col bg-[#F5F6FA] relative min-w-0">
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
                        
                        <div className="flex items-center space-x-4"></div>
                    </div>
                </div>

                <div className="bg-white border-b border-gray-200 px-5 flex items-center space-x-1 overflow-x-auto no-scrollbar">
                    <button onClick={() => setSelectedCategory('全部')} className={`px-5 py-3 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${selectedCategory === '全部' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>全部</button>
                    <button onClick={() => setSelectedCategory('加料')} className={`px-5 py-3 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${selectedCategory === '加料' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>加料</button>
                    {CATEGORIES.slice(1).map(c => (
                        <button key={c} onClick={() => setSelectedCategory(c)} className={`px-5 py-3 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${selectedCategory === c ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{c}</button>
                    ))}
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
                <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden animate-in zoom-in-95 font-sans">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">确认取消沽清？</h3>
                        <p className="text-gray-500 text-sm">
                            取消沽清后，
                            {isBatchMode ? (
                                <>选中的 <span className="font-bold text-[#333]">{selectedIds.size}</span> 个商品</>
                            ) : (
                                <>该商品 <span className="font-bold text-[#333]">{editingTarget?.name}</span></>
                            )}
                            将被<span className="text-orange-500 font-bold">恢复为无限库存状态</span>，并允许所有关联渠道正常售卖。
                        </p>
                    </div>
                    <div className="flex border-t border-gray-100">
                        <button onClick={() => { setCancelConfirmOpen(false); setEditingTarget(null); }} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 transition-colors">再想想</button>
                        <div className="w-px bg-gray-100"></div>
                        <button onClick={() => {
                            // Execute cancel clearance logic here
                            setCancelConfirmOpen(false);
                            setEditingTarget(null);
                            if (isBatchMode) {
                                setSelectedIds(new Set());
                                setIsBatchMode(false);
                            }
                        }} className="flex-1 py-4 font-bold text-[#00C06B] hover:bg-[#00C06B]/5 transition-colors">确认恢复</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
