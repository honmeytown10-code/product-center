
import React from 'react';
import { Printer, Coffee, ShoppingBag, Store, LayoutGrid, Link2Off, Lock } from 'lucide-react';

// --- Constants ---

export type ChannelTabType = 'pos' | 'mini_dine' | 'mini_pickup' | 'mini_take' | 'meituan' | 'taobao';
export type ChannelType = 'all' | ChannelTabType;

export const CHANNEL_TABS: { id: ChannelTabType; label: string; icon: React.ReactNode }[] = [
   { id: 'pos', label: 'POS', icon: <Printer size={14} className="mr-1"/> },
   { id: 'mini_dine', label: '小程序堂食', icon: <Coffee size={14} className="mr-1"/> },
   { id: 'mini_pickup', label: '小程序自提', icon: <ShoppingBag size={14} className="mr-1"/> },
   { id: 'mini_take', label: '小程序外卖', icon: <ShoppingBag size={14} className="mr-1"/> },
   { id: 'meituan', label: '美团外卖', icon: <Store size={14} className="mr-1"/> },
   { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={14} className="mr-1"/> }
];

export const FILTER_CHANNEL_OPTIONS: { id: ChannelType; label: string; shortLabel: string; icon?: React.ReactNode }[] = [
   { id: 'all', label: '全部渠道', shortLabel: '全部', icon: <LayoutGrid size={14}/> },
   { id: 'pos', label: 'POS收银', shortLabel: 'POS', icon: <Printer size={14}/> },
   { id: 'mini_dine', label: '小程序堂食', shortLabel: '堂食', icon: <Coffee size={14}/> },
   { id: 'mini_pickup', label: '小程序自提', shortLabel: '自提', icon: <ShoppingBag size={14}/> },
   { id: 'mini_take', label: '小程序外卖', shortLabel: '外卖', icon: <ShoppingBag size={14}/> },
   { id: 'meituan', label: '美团外卖', shortLabel: '美团', icon: <Store size={14}/> },
   { id: 'taobao', label: '淘宝闪购', shortLabel: '淘宝闪购', icon: <ShoppingBag size={14}/> }
];

export const SHELF_VIEW_TABS: { id: ChannelType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: '全部渠道', icon: <LayoutGrid size={14} className="mr-1"/> },
    ...CHANNEL_TABS
];

// --- UI Components ---

export const NumpadInput: React.FC<{ 
   label: string; 
   value: string; 
   active: boolean; 
   onFocus: () => void;
   placeholder?: string;
   large?: boolean;
}> = ({ label, value, active, onFocus, placeholder, large }) => (
   <div 
      onClick={onFocus}
      className={`
         relative rounded-2xl border-2 transition-all cursor-pointer bg-white group hover:border-[#00C06B]/50
         ${active ? 'border-[#00C06B] ring-4 ring-[#00C06B]/10 z-10' : 'border-gray-200'}
         ${large ? 'p-6' : 'p-4'}
      `}
   >
      <div className={`text-xs font-bold uppercase mb-1 transition-colors ${active ? 'text-[#00C06B]' : 'text-gray-400'}`}>{label}</div>
      <div className={`font-mono font-black text-gray-800 ${large ? 'text-4xl' : 'text-2xl'} ${!value ? 'text-gray-300' : ''}`}>
         {value || placeholder || '0'}
      </div>
      {active && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#00C06B] animate-pulse rounded-full"></div>}
   </div>
);

export const ChannelTag: React.FC<{ 
   label: string; 
   active: boolean; 
   locked?: boolean;
   warning?: boolean;
   onClick: () => void;
}> = ({ label, active, locked, warning, onClick }) => (
   <button
      onClick={onClick}
      className={`
         px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center
         ${active 
            ? 'bg-blue-50 border-blue-200 text-blue-700' 
            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
         }
         ${warning ? 'opacity-60 cursor-not-allowed' : ''}
         ${locked ? 'cursor-default' : 'cursor-pointer'}
      `}
   >
      {label}
      {warning && <Link2Off size={10} className="ml-1 text-red-500"/>}
      {locked && <Lock size={10} className="ml-1 text-orange-400"/>}
   </button>
);

export const NavIcon: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex flex-col items-center cursor-pointer transition-all group ${active ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}>
     <div className={`p-3 rounded-2xl mb-1 ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>
       {icon}
     </div>
     <span className={`text-[11px] font-bold tracking-wide ${active ? 'text-white' : 'text-gray-500'}`}>{label}</span>
  </div>
);

export const Tab: React.FC<{ label: string; active?: boolean; onClick: () => void }> = ({ label, active, onClick }) => {
   return (
      <button 
         onClick={onClick}
         className={`
            px-5 py-2 text-sm font-bold rounded transition-all
            ${active ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800'}
         `}
      >
         {label}
      </button>
   )
};

export const CategoryButton: React.FC<{ label: string; active?: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
   <button
      onClick={onClick}
      className={`px-8 py-2.5 rounded-[6px] text-sm font-bold transition-all whitespace-nowrap
         ${active ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}
      `}
   >
      {label}
   </button>
);
