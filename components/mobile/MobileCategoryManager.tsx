import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ArrowUp, ArrowDown, GripVertical, List, ChevronDown, Check, Plus, ImageIcon, Trash2, Clock, Shield } from 'lucide-react';
import { LocalCategory, ChannelType } from './types';
import { LayoutGrid, Smartphone, Store, ShoppingBag, Printer } from 'lucide-react';
import { MobileCategoryEditor } from './MobileCategoryEditor';

const INITIAL_LOCAL_CATEGORIES: LocalCategory[] = [
  { id: 'c1', name: '现制饮品', source: 'brand', channels: ['all', 'mini', 'pos', 'meituan'], count: 12 },
  { id: 'c2', name: '中式正餐', source: 'brand', channels: ['all', 'mini', 'pos'], count: 8 },
  { id: 'c3', name: '西式快餐', source: 'brand', channels: ['all', 'mini', 'pos', 'meituan', 'taobao'], count: 15 },
  { id: 'c4', name: '烘焙甜品', source: 'brand', channels: ['all', 'mini'], count: 6 },
  { id: 'c_store_1', name: '店长推荐', source: 'store', channels: ['all', 'mini', 'pos'], count: 4 },
  { id: 'c_store_2', name: '当季促销', source: 'store', channels: ['all', 'mini', 'meituan'], count: 3 },
];

const ALL_CHANNELS_DEF: { id: ChannelType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: '全部渠道', icon: <LayoutGrid size={14}/>, color: 'text-gray-800' },
  { id: 'mini', label: '小程序', icon: <Smartphone size={14}/>, color: 'text-green-600' },
  { id: 'meituan', label: '美团外卖', icon: <Store size={14}/>, color: 'text-yellow-600' },
  { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={14}/>, color: 'text-orange-600' },
  { id: 'pos', label: 'POS收银', icon: <Printer size={14}/>, color: 'text-blue-600' },
];

interface Props {
  onBack: () => void;
}

export const MobileCategoryManager: React.FC<Props> = ({ onBack }) => {
  const [view, setView] = useState<'list' | 'sort' | 'editor'>('list');
  const [localCategories, setLocalCategories] = useState<LocalCategory[]>(INITIAL_LOCAL_CATEGORIES);
  const [activeCatChannel, setActiveCatChannel] = useState<ChannelType>('all');
  const [showCatChannelSheet, setShowCatChannelSheet] = useState(false);
  
  // Updated editor state
  const [editingCat, setEditingCat] = useState<{ type: 'create' | 'edit', item?: LocalCategory } | null>(null);
  
  const [catSortOrders, setCatSortOrders] = useState<Record<ChannelType, string[]>>(() => {
    const ids = INITIAL_LOCAL_CATEGORIES.map(c => c.id);
    return { all: [...ids], mini: [...ids], meituan: [...ids], taobao: [...ids], pos: [...ids] };
  });

  const getSortedCategories = (channel: ChannelType) => {
    const currentOrder = catSortOrders[channel];
    const sorted = [...localCategories].sort((a, b) => {
      const indexA = currentOrder.indexOf(a.id);
      const indexB = currentOrder.indexOf(b.id);
      return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB);
    });
    return sorted;
  };

  const handleCatMove = (id: string, direction: 'up' | 'down') => {
    const currentOrder = [...catSortOrders[activeCatChannel]];
    const index = currentOrder.indexOf(id);
    if (index === -1) return;
    if (direction === 'up' && index > 0) [currentOrder[index], currentOrder[index - 1]] = [currentOrder[index - 1], currentOrder[index]];
    else if (direction === 'down' && index < currentOrder.length - 1) [currentOrder[index], currentOrder[index + 1]] = [currentOrder[index + 1], currentOrder[index]];
    setCatSortOrders(prev => ({ ...prev, [activeCatChannel]: currentOrder }));
  };

  const handleSaveCategory = (data: Partial<LocalCategory>) => {
    if (editingCat?.type === 'create') {
      const newCat: LocalCategory = {
        id: `c_store_${Date.now()}`,
        name: data.name || '未命名分类',
        source: 'store',
        channels: data.channels || ['all'],
        count: 0,
        ...data
      } as LocalCategory;
      setLocalCategories(prev => [...prev, newCat]);
      setCatSortOrders(prev => {
        const next = { ...prev };
        (Object.keys(next) as ChannelType[]).forEach(ch => { next[ch] = [...next[ch], newCat.id]; });
        return next;
      });
    } else if (editingCat?.type === 'edit' && editingCat.item) {
       setLocalCategories(prev => prev.map(c => c.id === editingCat.item!.id ? { ...c, ...data } : c));
    }
    setView('list');
    setEditingCat(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('确认删除此分类吗？')) {
      setLocalCategories(prev => prev.filter(c => c.id !== id));
      setView('list');
      setEditingCat(null);
    }
  };

  if (view === 'sort') {
    const sortedCategories = getSortedCategories(activeCatChannel);
    return (
      <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
          <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10">
              <button onClick={() => setView('list')} className="p-2 -ml-2 text-gray-600 hover:text-black transition-transform active:scale-95"><ChevronLeft size={24}/></button>
              <span className="font-bold text-base">分类排序</span>
              <div className="w-8"></div>
          </div>
          <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2 text-sm text-gray-500 font-bold"><List size={16}/><span>当前排序视角:</span></div>
              <button onClick={() => setShowCatChannelSheet(true)} className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"><span className="text-xs font-black text-gray-700">{ALL_CHANNELS_DEF.find(c => c.id === activeCatChannel)?.label}</span><ChevronDown size={12} className="text-gray-500"/></button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2 pb-24 bg-gray-50">
              {sortedCategories.length === 0 ? (<div className="flex flex-col items-center justify-center h-60 text-gray-400 opacity-40"><span className="text-xs font-bold font-mono uppercase tracking-widest">No categories available</span></div>) : (sortedCategories.map((cat, index) => { const isBrand = cat.source === 'brand'; return (<div key={cat.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm active:shadow-md transition-all"><div className="flex items-center flex-1"><div className="mr-4 flex flex-col space-y-1"><button onClick={() => handleCatMove(cat.id, 'up')} disabled={index === 0} className="p-1.5 bg-gray-50 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors"><ArrowUp size={14} className="text-gray-600"/></button><button onClick={() => handleCatMove(cat.id, 'down')} disabled={index === sortedCategories.length - 1} className="p-1.5 bg-gray-50 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors"><ArrowDown size={14} className="text-gray-600"/></button></div><div className="flex flex-col"><div className="flex items-center mb-1"><span className="font-black text-[15px] text-[#1F2129] mr-2">{cat.name}</span><span className={`text-[9px] px-1.5 py-0.5 rounded font-black border uppercase tracking-wider ${isBrand ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{isBrand ? '总部' : '自建'}</span></div></div></div><div className="text-gray-300 p-2"><GripVertical size={20}/></div></div>); }))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <button onClick={() => { alert('排序已保存'); setView('list'); }} className="w-full bg-[#1F2129] text-white py-3.5 rounded-2xl text-[15px] font-black shadow-lg shadow-gray-200 active:scale-[0.98] transition-all">保存排序</button>
          </div>
          {showCatChannelSheet && (<div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in"><div onClick={() => setShowCatChannelSheet(false)} className="flex-1"></div><div className="bg-white rounded-t-[24px] p-4 pb-10 animate-in slide-in-from-bottom duration-300"><div className="flex justify-between items-center mb-4 px-2 pt-2"><span className="font-black text-lg text-[#1F2129]">切换排序渠道</span><button onClick={() => setShowCatChannelSheet(false)} className="bg-gray-100 p-1.5 rounded-full"><X size={16}/></button></div><div className="grid grid-cols-2 gap-3 mb-6">{ALL_CHANNELS_DEF.map(ch => (<div key={ch.id} onClick={() => { setActiveCatChannel(ch.id); setShowCatChannelSheet(false); }} className={`flex items-center p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${activeCatChannel === ch.id ? 'border-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}><div className={`mr-3 ${activeCatChannel === ch.id ? 'text-[#00C06B]' : 'text-gray-400'}`}>{ch.icon}</div><span className={`text-sm font-black ${activeCatChannel === ch.id ? 'text-[#00C06B]' : 'text-gray-600'}`}>{ch.label}</span>{activeCatChannel === ch.id && <Check size={16} className="ml-auto text-[#00C06B]" strokeWidth={4}/>}</div>))}</div></div></div>)}
      </div>
    );
  }

  if (view === 'editor' && editingCat) {
    return (
      <MobileCategoryEditor 
        item={editingCat.item}
        onBack={() => { setView('list'); setEditingCat(null); }}
        onSave={handleSaveCategory}
        onDelete={() => editingCat.item && handleDeleteCategory(editingCat.item.id)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full font-sans animate-in slide-in-from-right duration-300">
        <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10 shadow-sm">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black transition-transform active:scale-95"><ChevronLeft size={24}/></button>
            <span className="font-black text-base text-[#1F2129]">商品分类</span>
            <button onClick={() => setView('sort')} className="p-2 -mr-2 text-gray-500 font-black text-sm uppercase tracking-widest">排序</button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-32">
             {localCategories.map(cat => (
                 <div 
                  key={cat.id} 
                  className="bg-white p-5 rounded-2xl border border-gray-50 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all hover:border-[#00C06B]/20" 
                  onClick={() => { setEditingCat({ type: 'edit', item: cat }); setView('editor'); }}
                >
                     <div className="flex items-center">
                         <div className="mr-3">
                             <div className="font-black text-[15px] text-[#1F2129] flex items-center">
                                {cat.name}
                                <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-black border uppercase tracking-wider ${cat.source === 'brand' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{cat.source === 'brand' ? '总部' : '自建'}</span>
                             </div>
                         </div>
                     </div>
                     <ChevronRight size={18} className="text-gray-200"/>
                 </div>
             ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-10 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
             <button onClick={() => { setEditingCat({ type: 'create' }); setView('editor'); }} className="w-full bg-[#00C06B] text-white py-3.5 rounded-2xl text-[15px] font-black shadow-lg shadow-green-100 active:scale-[0.98] transition-all">新建分类</button>
        </div>
    </div>
  );
};