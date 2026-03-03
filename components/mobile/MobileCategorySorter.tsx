import React, { useState } from 'react';
import { 
  ChevronLeft, ArrowUp, ArrowDown, GripVertical, 
  ChevronDown, Check, LayoutGrid, Smartphone, Store, ShoppingBag, Printer, List
} from 'lucide-react';
import { INITIAL_CATEGORIES } from '../../types';
import { ChannelType } from './types';

interface Props {
  onBack: () => void;
  onSave: () => void;
}

const ALL_CHANNELS_DEF: { id: ChannelType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: '全部渠道', icon: <LayoutGrid size={14}/>, color: 'text-gray-800' },
  { id: 'mini', label: '小程序', icon: <Smartphone size={14}/>, color: 'text-green-600' },
  { id: 'meituan', label: '美团外卖', icon: <Store size={14}/>, color: 'text-yellow-600' },
  { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={14}/>, color: 'text-orange-600' },
  { id: 'pos', label: 'POS收银', icon: <Printer size={14}/>, color: 'text-blue-600' },
];

export const MobileCategorySorter: React.FC<Props> = ({ onBack, onSave }) => {
  const [localCategories, setLocalCategories] = useState(INITIAL_CATEGORIES);
  const [activeChannel, setActiveChannel] = useState<ChannelType>('all');
  const [showChannelSheet, setShowChannelSheet] = useState(false);

  const moveCategory = (idx: number, direction: 'up' | 'down') => {
    const otherIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (otherIdx < 0 || otherIdx >= localCategories.length) return;

    const next = [...localCategories];
    [next[idx], next[otherIdx]] = [next[otherIdx], next[idx]];
    setLocalCategories(next);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full font-sans select-none animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-base text-[#1F2129]">分类排序</span>
        <div className="w-8"></div>
      </div>

      {/* Sorting Context */}
      <div className="px-5 py-4 bg-white border-b border-gray-50 flex items-center justify-between shrink-0">
        <div className="flex items-center text-sm font-bold text-gray-500">
          <List size={16} className="mr-2"/>
          当前排序视角：
        </div>
        <div onClick={() => setShowChannelSheet(true)} className="flex items-center bg-gray-100 px-3 py-1.5 rounded-lg cursor-pointer active:bg-gray-200 transition-colors">
          <span className="text-xs font-bold text-gray-700 mr-1 whitespace-nowrap">{ALL_CHANNELS_DEF.find(c => c.id === activeChannel)?.label}</span>
          <ChevronDown size={12} className="text-gray-400"/>
        </div>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-24">
        {localCategories.map((cat, idx) => {
          // Mocking different sources like the screenshot
          const isHQ = idx < 4; 
          return (
            <div key={cat.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm relative group">
              <div className="flex items-center flex-1">
                <div className="flex flex-col mr-4 space-y-2">
                   <button 
                    onClick={() => moveCategory(idx, 'up')} 
                    disabled={idx === 0}
                    className={`p-1 rounded bg-gray-50 transition-colors ${idx === 0 ? 'text-gray-100' : 'text-gray-400 active:bg-gray-200 active:text-black'}`}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    onClick={() => moveCategory(idx, 'down')} 
                    disabled={idx === localCategories.length - 1}
                    className={`p-1 rounded bg-gray-50 transition-colors ${idx === localCategories.length - 1 ? 'text-gray-100' : 'text-gray-400 active:bg-gray-200 active:text-black'}`}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-[15px] text-[#1F2129] mr-2">{cat.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black border uppercase tracking-wider ${isHQ ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                    {isHQ ? '总部' : '自建'}
                  </span>
                </div>
              </div>
              <div className="text-gray-300">
                <GripVertical size={20} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-10 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => { onSave(); onBack(); }}
          className="w-full h-[52px] bg-[#1F2129] text-white rounded-2xl text-[15px] font-black shadow-lg active:scale-[0.98] transition-all flex items-center justify-center"
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
              <span className="font-black text-lg text-[#1F2129]">切换排序视角</span>
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
