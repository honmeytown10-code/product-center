
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronDown, Search, Filter, Link2Off, Printer, Smartphone, Store, ShoppingBag, ChevronRight, CheckCircle2, Circle, List, Plus, X, Check, Delete, Clock, AlertTriangle, Coffee } from 'lucide-react';
import { Product, CATEGORIES } from '../../types';
import { ChannelType } from './types';
import { BatchActionType } from './MobileBatchComponents';
import { MobilePriceEditor } from './MobilePriceEditor';

interface Props {
  products: Product[];
  isBatchMode: boolean;
  selectedIds: Set<string>;
  batchActionType?: BatchActionType;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onBatchModeToggle: (enabled: boolean) => void;
  activeOrgType: 'brand' | 'store' | 'region';
  // Context Actions
  toggleShelfStatus: (id: string) => void;
  onUpdateProduct?: (id: string, updates: Partial<Product>) => void; // Added updater prop
  isStockShared: boolean;
  isShelvesUnited: boolean;
}

const ALL_CHANNELS_DEF: { id: ChannelType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: '全部渠道', icon: null, color: 'text-gray-800' }, // Icons simplified for import
  { id: 'mini', label: '小程序', icon: <Smartphone size={14}/>, color: 'text-green-600' },
  { id: 'meituan', label: '美团外卖', icon: <Store size={14}/>, color: 'text-yellow-600' },
  { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={14}/>, color: 'text-orange-600' },
  { id: 'pos', label: 'POS收银', icon: <Printer size={14}/>, color: 'text-blue-600' },
];

/**
 * 规格库存查看弹窗
 */
const SpecInventoryModal = ({ product, onClose }: { product: Product, onClose: () => void }) => {
    return (
        <div className="absolute inset-0 bg-black/60 z-[70] flex flex-col justify-end animate-in fade-in">
            <div onClick={onClose} className="flex-1"></div>
            <div className="bg-white rounded-t-[24px] overflow-hidden animate-in slide-in-from-bottom flex flex-col max-h-[70vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-black text-[#1F2129]">规格库存详情</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="bg-white p-1.5 rounded-full text-gray-500 shadow-sm"><X size={18}/></button>
                </div>
                <div className="p-5 space-y-3 overflow-y-auto no-scrollbar">
                    {product.specs?.map((spec, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white">
                            <span className="font-bold text-sm text-[#1F2129]">{spec.name}</span>
                            <div className="flex items-center">
                                <span className={`font-mono text-base font-bold ${spec.stock > 0 || spec.unlimited ? 'text-gray-700' : 'text-red-500'}`}>
                                    {spec.unlimited ? '9999' : spec.stock}
                                </span>
                            </div>
                        </div>
                    ))}
                    {(!product.specs || product.specs.length === 0) && (
                        <div className="py-10 text-center text-gray-400 text-xs">暂无规格数据</div>
                    )}
                </div>
                <div className="p-5 border-t border-gray-100">
                    <button onClick={onClose} className="w-full bg-[#1F2129] text-white py-3.5 rounded-xl font-bold shadow-lg">知道了</button>
                </div>
            </div>
        </div>
    );
};

export const MobileProductList: React.FC<Props> = ({ 
    products, isBatchMode, selectedIds, batchActionType, onToggleSelection, onSelectAll, 
    onBack, onNavigate, onBatchModeToggle, activeOrgType,
    toggleShelfStatus, onUpdateProduct, isStockShared, isShelvesUnited
}) => {
    const [activeChannel, setActiveChannel] = useState<ChannelType>('all');
    const [showChannelSheet, setShowChannelSheet] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('全部');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Local State for Modals
    const [editModal, setEditModal] = useState<{ show: boolean, type: 'stock' | 'price', item: any } | null>(null);
    const [shelfManageItem, setShelfManageItem] = useState<Product | null>(null); 
    const [stockManageItem, setStockManageItem] = useState<Product | null>(null); 
    const [specInventoryItem, setSpecInventoryItem] = useState<Product | null>(null);

    const displayProducts = useMemo(() => {
        return products.filter(p => {
            if (selectedCategory !== '全部' && p.category !== selectedCategory && 
                !CATEGORIES.find(c => c === selectedCategory && p.category.includes(c))) return false;
            if (searchQuery && !p.name.includes(searchQuery) && !p.skuCode.includes(searchQuery)) return false;
            return true;
        });
    }, [products, selectedCategory, searchQuery, activeChannel]);

    // --- Helpers ---
    const getProductChannelStatus = (productId: string, channel: ChannelType, globalStatus: string) => {
        if (channel === 'all') return globalStatus;
        const idChar = productId.charCodeAt(productId.length - 1);
        if (channel === 'meituan' && idChar % 5 === 0) return 'unmapped';
        if (channel === 'taobao' && idChar % 4 === 0) return 'unmapped';
        // Mock local override for demo
        if (!isShelvesUnited) {
            if (channel === 'meituan' && idChar % 3 === 0) return 'off_shelf';
            if (channel === 'mini' && idChar % 4 === 0) return 'off_shelf';
        }
        return globalStatus;
    };

    const getAggregatedShelfStatus = (productId: string, globalStatus: string): 'all_on' | 'all_off' | 'mixed' => {
        const channels: ChannelType[] = ['mini', 'meituan', 'taobao', 'pos'];
        const statuses = channels.map(c => getProductChannelStatus(productId, c, globalStatus));
        const validStatuses = statuses.filter(s => s !== 'unmapped');
        if (validStatuses.length === 0) return 'all_off'; 
        const hasOn = validStatuses.includes('on_shelf');
        const hasOff = validStatuses.includes('off_shelf');
        if (hasOn && hasOff) return 'mixed';
        if (hasOn) return 'all_on';
        return 'all_off';
    };

    const handleEditOpen = (type: 'stock' | 'price', item: any) => {
        setEditModal({ show: true, type, item });
    };

    const handlePriceConfirm = (updatedData: Partial<Product>) => {
        if (editModal?.item && onUpdateProduct) {
            onUpdateProduct(editModal.item.id, updatedData);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
            {/* Header */}
            <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20 relative">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black"><ChevronLeft size={24}/></button>
                <div className="flex items-center space-x-1"><span className="font-bold text-base">门店商品</span></div>
                {activeOrgType === 'store' ? (
                  <button onClick={() => onNavigate('product_sort')} className="p-2 -mr-2 text-[#00C06B] font-bold text-sm active:scale-95 transition-transform">排序</button>
                ) : (
                  <div className="w-8"></div>
                )}
            </div>

            {/* Filters */}
            <div className="px-4 py-3 flex items-center space-x-2 bg-white shrink-0">
                <div onClick={() => setShowChannelSheet(true)} className="flex items-center bg-gray-100 pl-3 pr-2 py-2 rounded-lg cursor-pointer active:bg-gray-200 transition-colors"><span className="text-xs font-bold text-gray-700 mr-1 whitespace-nowrap">{ALL_CHANNELS_DEF.find(c => c.id === activeChannel)?.label.slice(0,4)}</span><ChevronDown size={12} className="text-gray-500"/></div>
                <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden"><Search className="absolute left-3 top-2.5 text-gray-400" size={16}/><input className="w-full pl-9 pr-4 py-2 bg-transparent text-sm outline-none placeholder:text-gray-400" placeholder="搜索商品..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/></div>
                <button className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:text-black"><Filter size={18}/></button>
            </div>

            {/* List */}
            <div className="flex-1 flex overflow-hidden">
                <div className="w-22 bg-[#F8FAFB] overflow-y-auto no-scrollbar pb-20 border-r border-gray-100 shrink-0">
                    {CATEGORIES.map(cat => (<div key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2 py-4 text-[11px] text-center font-bold border-l-4 transition-all relative ${selectedCategory === cat ? 'bg-white text-[#00C06B] border-[#00C06B]' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}>{cat}</div>))}
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-3 pb-24 space-y-3 bg-gray-50">
                    {displayProducts.map(product => {
                        const isSelected = selectedIds.has(product.id);
                        let statusLabel = ''; let statusColor = ''; let isOffShelf = false; let showPartial = false; let hideBadge = false;
                        if (activeChannel === 'all') {
                            if (isShelvesUnited) { isOffShelf = product.status === 'off_shelf'; hideBadge = true; } else { const aggStatus = getAggregatedShelfStatus(product.id, product.status); if (aggStatus === 'mixed') { statusLabel = '部分上架'; statusColor = 'text-orange-600 border-orange-200 bg-orange-50'; showPartial = true; } else if (aggStatus === 'all_off') { isOffShelf = true; hideBadge = true; } else { hideBadge = true; } }
                        } else { const chStatus = getProductChannelStatus(product.id, activeChannel, product.status); isOffShelf = chStatus === 'off_shelf'; statusLabel = isOffShelf ? '已下架' : '已上架'; }
                        const isSoldOut = product.stockStatus === 'sold_out';
                        const isMultiSpec = product.isMultiSpec;

                        return (
                            <div key={product.id} onClick={() => isBatchMode && onToggleSelection(product.id)} className={`flex flex-col bg-white p-3 rounded-xl border transition-all relative overflow-hidden shadow-sm ${isBatchMode && isSelected ? 'border-[#00C06B] ring-1 ring-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100'}`}>
                                <div className="flex">
                                    <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 mr-3 relative overflow-hidden"><img src={product.image} className="w-full h-full object-cover" alt={product.name}/>{isOffShelf && !showPartial && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white text-[10px] font-bold border border-white px-1.5 py-0.5 rounded">已下架</span></div>)}</div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div><div className="flex justify-between items-start"><h4 className="text-sm font-bold text-gray-800 line-clamp-1 flex-1">{product.name}</h4>{(!hideBadge && activeChannel === 'all') && (<span className={`text-[9px] px-1.5 py-0.5 rounded border ml-2 whitespace-nowrap ${statusColor}`}>{statusLabel}</span>)}</div><div className="flex flex-wrap gap-1 mt-1"><span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[9px] font-bold">标准</span>{product.type === 'combo' && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold">套餐</span>}{isMultiSpec && <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded text-[9px] font-bold ml-1">多规格</span>}</div></div>
                                        {activeChannel === 'all' && (<div className="flex items-center gap-1.5 mt-2" onClick={(e) => { e.stopPropagation(); setShelfManageItem(product); }}>{ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(ch => { const status = getProductChannelStatus(product.id, ch.id, product.status); const isOn = status === 'on_shelf'; const isUnmapped = status === 'unmapped'; return (<div key={ch.id} className={`flex items-center justify-center w-6 h-6 rounded-full border transition-all ${isUnmapped ? 'bg-gray-50 border-gray-300 border-dashed text-gray-400' : isOn ? `${ch.id === 'pos' ? 'bg-blue-50 border-blue-100 text-blue-600' : ch.id === 'mini' ? 'bg-green-50 border-green-100 text-green-600' : ch.id === 'meituan' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' : 'bg-orange-50 border-orange-100 text-orange-600'}` : 'bg-gray-100 border-gray-200 text-gray-400 grayscale'}`}>{isUnmapped ? <Link2Off size={10}/> : <span className="scale-75">{ch.icon}</span>}</div>); })}</div>)}
                                        <div className="flex items-center justify-between mt-auto pt-1">
                                            <div className="font-mono text-base font-black text-[#1F2129]"><span className="text-xs mr-0.5">¥</span>{product.price}</div>
                                            
                                            {/* 根据渠道视图和规格类型显示库存 */}
                                            {activeChannel === 'all' ? (
                                                !isStockShared ? (
                                                    <button onClick={(e) => { e.stopPropagation(); setStockManageItem(product); }} className="flex items-center bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600 active:bg-gray-200">多渠道库存 <ChevronRight size={10} className="ml-0.5"/></button>
                                                ) : (
                                                    isMultiSpec ? (
                                                        <button onClick={(e) => { e.stopPropagation(); setSpecInventoryItem(product); }} className="flex items-center bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600 active:bg-gray-200">查看规格库存 <ChevronRight size={10} className="ml-0.5"/></button>
                                                    ) : (
                                                        <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-[10px] font-bold text-blue-600 border border-blue-100">库存 {product.stock === -1 ? '9999' : (product.stock ?? 100)}</div>
                                                    )
                                                )
                                            ) : (
                                                isMultiSpec ? (
                                                    <button onClick={(e) => { e.stopPropagation(); setSpecInventoryItem(product); }} className="flex items-center bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600 active:bg-gray-200">查看规格库存 <ChevronRight size={10} className="ml-0.5"/></button>
                                                ) : (
                                                    isSoldOut ? (
                                                        <div className="flex items-center bg-red-50 px-2 py-1 rounded text-[10px] font-bold text-red-500 border border-red-100">已售罄</div>
                                                    ) : (
                                                        <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-[10px] font-bold text-blue-600 border border-blue-100">库存 {product.stock === -1 ? '9999' : (product.stock ?? 100)}</div>
                                                    )
                                                )
                                            )}
                                        </div>
                                    </div>
                                    {isBatchMode && (<div className="absolute top-3 right-3 z-10">{isSelected ? <CheckCircle2 className="text-[#00C06B]" size={20} fill="white"/> : <Circle className="text-gray-300" size={20}/>}</div>)}
                                </div>
                                {!isBatchMode && activeOrgType === 'store' && (
                                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-50">
                                        {activeChannel === 'all' ? (<button onClick={(e) => { e.stopPropagation(); setShelfManageItem(product); }} className={`flex-1 py-1.5 rounded-lg text-xs font-bold active:bg-opacity-80 transition-colors ${isShelvesUnited ? (!isOffShelf ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600') : 'bg-gray-100 text-gray-600'}`}>{isShelvesUnited ? (!isOffShelf ? '下架' : '上架') : '上下架管理'}</button>) : (<button onClick={(e) => { e.stopPropagation(); toggleShelfStatus(product.id); }} className={`flex-1 py-1.5 rounded-lg text-xs font-bold active:bg-opacity-80 transition-colors ${!isOffShelf ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>{!isOffShelf ? '下架' : '上架'}</button>)}
                                        <button onClick={(e) => { e.stopPropagation(); handleEditOpen('price', product); }} className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded-lg text-xs font-bold active:bg-gray-200">改价</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleEditOpen('stock', product); }} className="flex-1 bg-[#00C06B] text-white py-1.5 rounded-lg text-xs font-bold active:bg-[#00A35B] shadow-sm shadow-green-100">沽清</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Bar or Batch Bar */}
            {activeOrgType === 'store' && (
                isBatchMode ? (
                    <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-8 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-xs font-bold text-gray-500">已选 {selectedIds.size} 项</div>
                            <button onClick={onSelectAll} className="text-xs font-bold text-[#00C06B]">全选</button>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => onBatchModeToggle(false)} 
                                className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl active:bg-gray-200"
                            >
                                取消
                            </button>
                            {batchActionType ? (
                                <button 
                                    disabled={selectedIds.size === 0}
                                    onClick={() => onNavigate('batch_next')}
                                    className={`flex-[2] py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center ${selectedIds.size === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1F2129] active:scale-95'}`}
                                >
                                    下一步 ({selectedIds.size}) <ChevronRight size={16} className="ml-1"/>
                                </button>
                            ) : (
                                <button 
                                    disabled={selectedIds.size === 0}
                                    onClick={() => onNavigate('batch_action')} // Trigger batch action menu
                                    className={`flex-[2] py-3.5 rounded-xl font-bold text-white shadow-lg transition-all ${selectedIds.size === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1F2129] active:scale-95'}`}
                                >
                                    批量操作 ({selectedIds.size})
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-30 pb-2">
                        <div className="flex flex-col items-center justify-center w-20 active:opacity-60 cursor-pointer" onClick={() => onNavigate('category_list')}><List size={22} className="text-gray-600 mb-1"/><span className="text-[10px] font-bold text-gray-600">分类管理</span></div>
                        <div className="relative -top-5" onClick={() => onNavigate('create')}><div className="w-14 h-14 bg-[#1F2129] rounded-full flex items-center justify-center shadow-xl shadow-gray-300 border-4 border-[#F5F6FA] active:scale-95 transition-transform cursor-pointer"><Plus size={24} className="text-white"/></div><span className="text-[10px] font-bold text-[#1F2129] absolute -bottom-4 w-full text-center">新建商品</span></div>
                        <div className="flex flex-col items-center justify-center w-20 active:opacity-60 cursor-pointer" onClick={() => onNavigate('batch_entry')}><div className="relative"><CheckCircle2 size={22} className="text-gray-600 mb-1"/></div><span className="text-[10px] font-bold text-gray-600">批量管理</span></div>
                    </div>
                )
            )}

            {showChannelSheet && (<div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in"><div onClick={() => setShowChannelSheet(false)} className="flex-1"></div><div className="bg-white rounded-t-[24px] p-4 animate-in slide-in-from-bottom duration-300"><div className="flex justify-between items-center mb-4 px-2"><span className="font-black text-lg text-[#1F2129]">切换渠道视角</span><button onClick={() => setShowChannelSheet(false)} className="bg-gray-100 p-1.5 rounded-full"><X size={16}/></button></div><div className="grid grid-cols-2 gap-3 mb-6">{ALL_CHANNELS_DEF.map(ch => (<div key={ch.id} onClick={() => { setActiveChannel(ch.id); setShowChannelSheet(false); }} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${activeChannel === ch.id ? 'border-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100 bg-white'}`}><div className={`mr-3 ${activeChannel === ch.id ? 'text-[#00C06B]' : 'text-gray-400'}`}>{ch.icon}</div><span className={`text-sm font-bold ${activeChannel === ch.id ? 'text-[#00C06B]' : 'text-gray-600'}`}>{ch.label}</span>{activeChannel === ch.id && <Check size={16} className="ml-auto text-[#00C06B]"/>}</div>))}</div></div></div>)}
            
            {editModal && (<div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end animate-in fade-in duration-200"><div onClick={() => setEditModal(null)} className="flex-1"></div>{editModal.type === 'price' ? (<MobilePriceEditor product={editModal.item} activeChannel={activeChannel} onClose={() => setEditModal(null)} onConfirm={handlePriceConfirm} />) : (<ClearanceModal item={editModal.item} onClose={() => setEditModal(null)} activeChannel={activeChannel} isStockShared={isStockShared}/>)}</div>)}
            {shelfManageItem && (<ShelfManagementModal item={shelfManageItem} onClose={() => setShelfManageItem(null)} isShelvesUnited={isShelvesUnited} getProductChannelStatus={getProductChannelStatus} />)}
            {stockManageItem && (<div className="absolute inset-0 bg-black/60 z-[60] flex flex-col justify-end animate-in fade-in"><div onClick={() => setStockManageItem(null)} className="flex-1"></div><div className="bg-white rounded-t-[24px] overflow-hidden animate-in slide-in-from-bottom flex flex-col max-h-[85vh]"><div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0"><div><h3 className="text-lg font-black text-[#1F2129]">多渠道库存管理</h3><p className="text-xs text-gray-400 mt-0.5">{stockManageItem.name}</p></div><button onClick={() => setStockManageItem(null)} className="bg-white p-1.5 rounded-full text-gray-500 shadow-sm"><X size={18}/></button></div><div className="p-5 space-y-4 overflow-y-auto no-scrollbar"><div className="bg-orange-50 text-orange-700 px-3 py-2.5 rounded-lg text-xs font-medium flex items-start leading-relaxed"><AlertTriangle size={14} className="mr-2 mt-0.5 shrink-0"/><div>当前为独立库存模式，餐饮商品通常为无限库存，如需限制售卖数量（沽清），请使用“沽清”功能。</div></div>{stockManageItem.isMultiSpec ? (
                <div className="space-y-6">
                    {ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(ch => (
                        <div key={ch.id} className="space-y-2">
                            <div className="flex items-center text-xs font-black text-gray-400"><div className="w-1 h-3 bg-blue-500 rounded-full mr-2"></div>{ch.label}</div>
                            <div className="bg-gray-50 rounded-xl p-1 divide-y divide-gray-100">
                                {stockManageItem.specs?.map((spec, sidx) => (
                                    <div key={sidx} className="flex items-center justify-between p-3">
                                        <span className="text-xs font-bold text-gray-600">{spec.name}</span>
                                        <span className="font-mono text-sm font-black text-gray-700">{spec.unlimited ? '9999' : spec.stock}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(ch => (<div key={ch.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white"><div className="flex items-center"><div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500">{ch.icon}</div><span className="font-bold text-sm text-[#1F2129]">{ch.label}</span></div><div className="flex items-center"><span className="font-mono text-base font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded">100</span></div></div>))
            )}</div><div className="p-5 border-t border-gray-100"><button onClick={() => setStockManageItem(null)} className="w-full bg-[#1F2129] text-white py-3.5 rounded-xl font-bold shadow-lg">知道了</button></div></div></div>)}

            {/* 多规格查看库存弹窗 */}
            {specInventoryItem && <SpecInventoryModal product={specInventoryItem} onClose={() => setSpecInventoryItem(null)} />}
        </div>
    );
};

// ... Inner Modals ...
const ShelfManagementModal = ({ item, onClose, isShelvesUnited, getProductChannelStatus }: { item: Product, onClose: () => void, isShelvesUnited: boolean, getProductChannelStatus: any }) => {
    const globalOn = item.status === 'on_shelf';
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
                        const currentStatus = getProductChannelStatus(item.id, ch.id, item.status);
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
                                {isUnmapped ? (<div className="px-2 py-1 rounded bg-gray-200 text-gray-400 text-[10px] font-bold">不可操作</div>) : (<div className={`w-11 h-6 rounded-full transition-colors relative ${isShelvesUnited ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${isOn ? 'bg-[#00C06B]' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isOn ? 'left-6' : 'left-1'}`}></div></div>)}
                            </div>
                        );
                    })}
                </div>
                <div className="p-5 border-t border-gray-100 bg-white">
                    {isShelvesUnited ? (
                        <button className={`w-full py-3.5 rounded-xl font-bold shadow-lg text-white transition-all active:scale-95 ${globalOn ? 'bg-[#1F2129]' : 'bg-[#00C06B]'}`}>{globalOn ? '确认统一下架' : '确认统一上架'}</button>
                    ) : (
                        <button onClick={onClose} className="w-full py-3.5 rounded-xl font-bold shadow-lg bg-[#1F2129] text-white transition-all active:scale-95">完成设置</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClearanceModal = ({ item, onClose, activeChannel, isStockShared }: { item: Product, onClose: () => void, activeChannel: ChannelType, isStockShared: boolean }) => {
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

    const toggleChannel = (id: string) => {
        if (selectedChannels.includes(id)) setSelectedChannels(prev => prev.filter(c => c !== id));
        else setSelectedChannels(prev => [...prev, id]);
    };

    return (
        <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end animate-in fade-in duration-200"><div onClick={() => onClose()} className="flex-1"></div><div className="bg-white rounded-t-[24px] overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]"><div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0"><div><h3 className="text-lg font-black text-[#1F2129]">加料沽清设置</h3><p className="text-xs text-gray-400 mt-0.5">{item.name}</p></div><button onClick={onClose} className="p-1.5 bg-white rounded-full text-gray-500 shadow-sm"><X size={18}/></button></div><div className="overflow-y-auto p-4 space-y-6 no-scrollbar"><div className="bg-gray-100 p-1 rounded-xl flex"><button onClick={() => setMethod('cycle')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${method === 'cycle' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>当日沽清</button><button onClick={() => setMethod('total')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${method === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>长期沽清</button></div><div className="space-y-3">{method === 'total' ? (<div onClick={() => setFocusedField('total')} className={`p-4 rounded-xl border-2 transition-all ${focusedField === 'total' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 bg-white'}`}><div className="text-[10px] text-gray-400 font-bold mb-1">可售总数</div><div className={`text-2xl font-black ${values.total ? 'text-gray-800' : 'text-gray-300'}`}>{values.total || '不限制'}</div></div>) : (<div className="grid grid-cols-2 gap-3"><div onClick={() => setFocusedField('dayLimit')} className={`p-3 rounded-xl border-2 transition-all ${focusedField === 'dayLimit' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 bg-white'}`}><div className="text-[10px] text-gray-400 font-bold mb-1">每日限售</div><div className={`text-xl font-black ${values.dayLimit ? 'text-gray-800' : 'text-gray-300'}`}>{values.dayLimit || '不限'}</div></div><div onClick={() => setFocusedField('dayRemain')} className={`p-3 rounded-xl border-2 transition-all ${focusedField === 'dayRemain' ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 bg-white'}`}><div className="text-[10px] text-gray-400 font-bold mb-1">今日剩余</div><div className={`text-xl font-black ${values.dayRemain ? 'text-gray-800' : 'text-gray-300'}`}>{values.dayRemain || '0'}</div></div></div>)}</div>{!isStockShared && (<div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center"><AlertTriangle size={12} className="text-orange-500 mr-2"/><span className="text-[10px] font-bold text-orange-600">当前处于独立库存模式，各渠道库存互不影响</span></div>)}<div><div className="flex justify-between items-center mb-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">生效渠道</label></div><div className="flex flex-wrap gap-2">{ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(ch => (<button key={ch.id} onClick={() => toggleChannel(ch.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center cursor-pointer active:scale-95 ${selectedChannels.includes(ch.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-400'}`}>{ch.label}</button>))}</div></div></div><div className="grid grid-cols-4 bg-gray-50 border-t border-gray-100 shrink-0 select-none">{[1, 2, 3, 'del', 4, 5, 6, '完成', 7, 8, 9, '.', 0].map((k) => { if (k === '完成') return <button key={k} onClick={onClose} className="row-span-2 bg-[#00C06B] text-white font-bold text-lg active:opacity-90">完成</button>; if (k === 'del') return <button key={k} onClick={() => handleNumpad('del')} className="h-14 border-r border-b border-gray-200 flex items-center justify-center active:bg-gray-200 bg-white"><Delete size={20}/></button>; return <button key={k} onClick={() => handleNumpad(k.toString())} className={`h-14 border-r border-b border-gray-200 text-xl font-bold text-gray-800 active:bg-gray-200 bg-white ${k === 0 ? 'col-span-2' : ''}`}>{k}</button>; })}</div></div></div>
    );
};
