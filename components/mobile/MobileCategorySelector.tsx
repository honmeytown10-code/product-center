import React, { useState, useMemo, useEffect } from 'react';
/* Added ArrowUp to imports */
import { X, Search, Check, Plus, SearchCheck, ArrowUp } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: CategoryItem) => void;
  initialCategoryName?: string;
}

const MOCK_CATEGORIES: CategoryItem[] = [
  { id: '1', name: '分类A' },
  { id: '2', name: '分类B' },
  { id: '3', name: '分类B' },
  { id: '4', name: '分类B' },
  { id: '5', name: '分类B' },
  { id: '6', name: '分类B' },
  { id: '7', name: '分类B' },
];

/**
 * Key component for the mock keyboard simulation seen in the design.
 */
const KeyboardKey: React.FC<{ char: string; onClick?: () => void; className?: string }> = ({ char, onClick, className }) => (
    <div 
        onClick={onClick}
        className={`flex-1 h-10 bg-white rounded-md shadow-sm flex items-center justify-center font-bold text-[17px] text-[#333] active:bg-gray-200 transition-colors cursor-pointer ${className}`}
    >
        {char}
    </div>
);

export const MobileCategorySelector: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialCategoryName 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedName, setSelectedName] = useState<string>(initialCategoryName || '分类A');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Sync selected name if prop changes
  useEffect(() => {
    if (initialCategoryName) setSelectedName(initialCategoryName);
  }, [initialCategoryName]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return MOCK_CATEGORIES;
    return MOCK_CATEGORIES.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[200] flex flex-col justify-end bg-black/40 animate-in fade-in duration-200">
      {/* Backdrop Area */}
      <div className="flex-1" onClick={onClose}></div>

      {/* Bottom Sheet Content */}
      <div className="bg-white rounded-t-[16px] flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300 relative overflow-hidden">
        
        {/* Header */}
        <div className="h-[56px] border-b border-gray-100 flex items-center justify-between px-4 shrink-0 bg-white">
          <div className="w-6"></div>
          <span className="font-bold text-[17px] text-[#333]">选择商品分类</span>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 shrink-0 bg-white">
          <div className="relative flex items-center h-[40px] bg-[#F5F5F5] rounded-[8px] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00C06B]/20 transition-all">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400 font-medium" 
              placeholder="搜索分类名称"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsKeyboardVisible(true)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400">
                <X size={16} className="text-gray-300 fill-current" />
              </button>
            )}
          </div>
        </div>

        {/* Category List or Empty State */}
        <div 
          className="flex-1 overflow-y-auto no-scrollbar bg-white"
          onScroll={() => {
              if (isKeyboardVisible) setIsKeyboardVisible(false);
          }}
        >
          {filteredCategories.length > 0 ? (
            <div className="pb-10">
              {filteredCategories.map((cat, idx) => {
                const isSelected = selectedName === cat.name;
                return (
                    <div 
                        key={`${cat.id}-${idx}`}
                        onClick={() => setSelectedName(cat.name)}
                        className={`
                            h-[56px] flex items-center justify-between px-5 cursor-pointer active:bg-gray-50 transition-colors
                            ${isSelected ? 'text-[#00C06B]' : 'text-[#333]'}
                        `}
                    >
                        <span className="text-[16px] font-medium">{cat.name}</span>
                        {isSelected && <Check size={20} strokeWidth={3} />}
                    </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95">
              <div className="relative w-40 h-40 mb-2 flex items-center justify-center">
                 {/* Visual simulation of the "Search No Result" illustration from Fig 2 */}
                 <div className="relative">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100/50">
                        <SearchCheck size={64} className="text-gray-200" strokeWidth={1}/>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 flex items-center">
                        <span className="text-[10px] font-bold text-gray-300">没有搜到分类</span>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions - Fixed */}
        <div className="px-4 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button className="flex-1 h-[44px] rounded-[8px] border border-gray-300 text-[16px] font-bold text-[#333] active:bg-gray-50 transition-colors">
            新增分类
          </button>
          <button 
            onClick={() => {
              const cat = MOCK_CATEGORIES.find(c => c.name === selectedName) || { id: '0', name: selectedName };
              onSelect(cat);
            }}
            className="flex-1 h-[44px] rounded-[8px] bg-[#00C06B] text-white text-[16px] font-bold shadow-lg shadow-green-100 active:bg-[#00A35B] active:scale-[0.98] transition-all"
          >
            确认
          </button>
        </div>

        {/* Keyboard Simulation (Fig 2 - iOS Style Mock) */}
        {isKeyboardVisible && (
          <div className="shrink-0 bg-[#D1D3D9] animate-in slide-in-from-bottom duration-300 h-[220px] flex flex-col p-1.5 space-y-1.5 select-none relative z-10 shadow-inner">
             <div className="flex justify-between gap-1">
                {['Q','W','E','R','T','Y','U','I','O','P'].map(k => <KeyboardKey key={k} char={k}/>)}
             </div>
             <div className="flex justify-center gap-1 px-4">
                {['A','S','D','F','G','H','J','K','L'].map(k => <KeyboardKey key={k} char={k}/>)}
             </div>
             <div className="flex justify-between gap-1">
                <div className="w-[42px] h-10 bg-[#ACB1BB] rounded-md shadow-sm flex items-center justify-center text-gray-700">
                    <ArrowUp size={18} strokeWidth={3}/>
                </div>
                {['Z','X','C','V','B','N','M'].map(k => <KeyboardKey key={k} char={k}/>)}
                <div className="w-[42px] h-10 bg-[#ACB1BB] rounded-md shadow-sm flex items-center justify-center text-gray-700">
                    <X size={18} strokeWidth={3}/>
                </div>
             </div>
             <div className="flex justify-between gap-1 pt-1">
                <div className="w-16 h-10 bg-[#ACB1BB] rounded-md shadow-sm flex items-center justify-center font-bold text-xs">123</div>
                <div className="flex-1 h-10 bg-white rounded-md shadow-sm flex items-center justify-center text-gray-400 text-sm font-medium">space</div>
                <div onClick={() => setIsKeyboardVisible(false)} className="w-16 h-10 bg-[#3B72FF] rounded-md shadow-sm flex items-center justify-center font-bold text-white text-sm">Go</div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
