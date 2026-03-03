import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ArrowUp, ArrowDown, GripVertical, Info, 
  Package, Search, LayoutGrid, CheckCircle2, ChevronDown, Check, Smartphone, Store, ShoppingBag, Printer
} from 'lucide-react';
import { Product, CATEGORIES } from '../../types';
import { ChannelType } from './types';

interface Props {
  products: Product[];
  onBack: () => void;
  onSave: (sortedProducts: Product[]) => void;
  onNavigate: (target: string) => void;
}

const ALL_CHANNELS_DEF: { id: ChannelType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: '全部渠道', icon: <LayoutGrid size={14}/>, color: 'text-gray-800' },
  { id: 'mini', label: '小程序', icon: <Smartphone size={14}/>, color: 'text-green-600' },
  { id: 'meituan', label: '美团外卖', icon: <Store size={14}/>, color: 'text-yellow-600' },
  { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={14}/>, color: 'text-orange-600' },
  { id: 'pos', label: 'POS收银', icon: <Printer size={14}/>, color: 'text-blue-600' },
];

export const MobileProductSorter: React.FC<Props> = ({ products, onBack, onSave, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[1] || '全部');
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [activeChannel, setActiveChannel] = useState<ChannelType>('all');
  const [showChannelSheet, setShowChannelSheet] = useState(false);
  
  const displayProducts = useMemo(() => {
    return localProducts.filter(p => {
      if (selectedCategory === '全部') return true;
      return p.category === selectedCategory || p.category.includes(selectedCategory);
    });
  }, [localProducts, selectedCategory]);

  const moveProduct = (idxInFiltered: number, direction: 'up' | 'down') => {
    const targetItem = displayProducts[idxInFiltered];
    const otherItemIdx = direction === 'up' ? idxInFiltered - 1 : idxInFiltered + 1;
    const otherItem = displayProducts[otherItemIdx];

    if (!otherItem) return;

    const newLocal = [...localProducts];
    const realIdxTarget = newLocal.findIndex(p => p.id === targetItem.id);
    const realIdxOther = newLocal.findIndex(p => p.id === otherItem.id);

    if (realIdxTarget !== -1 && realIdxOther !== -1) {
      [newLocal[realIdxTarget], newLocal[realIdxOther]] = [newLocal[realIdxOther], newLocal[realIdxTarget]];
      setLocalProducts(newLocal);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full font-sans select-none animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-base text-[#1F2129]">商品排序</span>
        <div className="w-8"></div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 py-3 flex items-center space-x-2 bg-white shrink-0 shadow-sm z-10 border-b border-gray-50">
        <div onClick={() => setShowChannelSheet(true)} className="flex items-center bg-gray-100 pl-3 pr-2 py-2 rounded-lg cursor-pointer active:bg-gray-200 transition-colors">
          <span className="text-xs font-bold text-gray-700 mr-1 whitespace-nowrap">{ALL_CHANNELS_DEF.find(c => c.id === activeChannel)?.label}</span>
          <ChevronDown size={12} className="text-gray-400"/>
        </div>
        <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
          <input className="w-full pl-9 pr-4 py-2 bg-transparent text-sm outline-none placeholder:text-gray-400 font-bold" placeholder="搜索商品..."/>
        </div>
      </div>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <div className="w-22 bg-[#F8FAFB] overflow-y-auto no-scrollbar pb-20 border-r border-gray-100 shrink-0">
          {CATEGORIES.map(cat => (
            <div 
              key={cat} 
              onClick={() => setSelectedCategory(cat)} 
              className={`px-2 py-4 text-[11px] text-center font-bold border-l-4 transition-all relative ${selectedCategory === cat ? 'bg-white text-[#00C06B] border-[#00C06B]' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
            >
              {cat}
            </div>
          ))}
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24 bg-gray-50">
          <div className="px-1 py-1 mb-2">
            <div className="bg-blue-50/50 rounded-xl p-3 flex items-start border border-blue-100/50">
              <Info size={12} className="text-blue-500 mr-2 mt-0.5 shrink-0" />
              <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                通过上下箭头调整该分类下商品展示顺序。
              </p>
            </div>
          </div>

          {displayProducts.length > 0 ? (
            displayProducts.map((p, idx) => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm active:shadow-md transition-all group">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 mr-3 flex-shrink-0 overflow-hidden border border-gray-100">
                    <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-800 truncate">{p.name}</h4>
                    <div className="flex items-center mt-1">
                      <span className="text-[13px] font-mono font-black text-blue-600">¥{p.price}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  <button 
                    onClick={() => moveProduct(idx, 'up')} 
                    disabled={idx === 0}
                    className={`p-1.5 rounded-lg transition-colors ${idx === 0 ? 'text-gray-100 cursor-not-allowed' : 'text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-black active:scale-90'}`}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    onClick={() => moveProduct(idx, 'down')} 
                    disabled={idx === displayProducts.length - 1}
                    className={`p-1.5 rounded-lg transition-colors ${idx === displayProducts.length - 1 ? 'text-gray-100 cursor-not-allowed' : 'text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-black active:scale-90'}`}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <div className="p-1.5 text-gray-200">
                    <GripVertical size={16} strokeWidth={2} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center">
              <Package size={48} className="opacity-10 mb-4" />
              <span className="text-xs font-bold">该分类下暂无商品</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-10 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex gap-3">
        <button 
          onClick={() => onNavigate('category_sort')}
          className="px-6 h-[52px] bg-white border border-gray-200 text-[#1F2129] rounded-2xl text-[14px] font-bold active:bg-gray-50 transition-all flex items-center justify-center whitespace-nowrap"
        >
          分类排序
        </button>
        <button 
          onClick={() => { onSave(localProducts); onBack(); }}
          className="flex-1 h-[52px] bg-[#1F2129] text-white rounded-2xl text-[15px] font-black shadow-lg active:scale-[0.98] transition-all flex items-center justify-center"
        >
          保存排序
        </button>
      </div>

      {/* Channel Sheet */}
      {showChannelSheet && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in">
          <div onClick={() => setShowChannelSheet(false)} className="flex-1"></div>
          <div className="bg-white rounded-t-[24px] p-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4 px-2 pt-2">
              <span className="font-black text-lg text-[#1F2129]">切换排序渠道</span>
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

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
