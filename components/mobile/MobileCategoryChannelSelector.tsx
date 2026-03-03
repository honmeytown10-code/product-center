import React, { useState } from 'react';
import { ChevronLeft, Check, Smartphone, Store, ShoppingBag, Printer, LayoutGrid } from 'lucide-react';

interface Props {
  title: string;
  selected: string[];
  onBack: () => void;
  onSave: (next: string[]) => void;
  type: 'display' | 'sales';
}

const DISPLAY_OPTIONS = [
  { id: 'mini_wechat', label: '微信小程序' },
  { id: 'mini_alipay', label: '支付宝小程序' },
  { id: 'mini_douyin', label: '抖音小程序' },
  { id: 'app_pos', label: '企迈数店app&pos' },
  { id: 'h5', label: '企迈H5' },
];

const SALES_OPTIONS = [
  { id: 'pos', label: 'POS', icon: <Printer size={16}/> },
  { id: 'mini', label: '小程序', icon: <Smartphone size={16}/>, sub: [
    { id: 'mini_dine', label: '堂食' },
    { id: 'mini_take', label: '外卖' },
    { id: 'mini_mall', label: '商城' },
  ]},
  { id: 'meituan', label: '美团外卖', icon: <Store size={16}/> },
  { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={16}/> },
];

export const MobileCategoryChannelSelector: React.FC<Props> = ({ title, selected, onBack, onSave, type }) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selected);

  const toggle = (id: string) => {
    setLocalSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleMiniToggle = () => {
    const isMainSelected = localSelected.includes('mini');
    const miniSubs = ['mini_dine', 'mini_take', 'mini_mall'];
    if (isMainSelected) {
      setLocalSelected(prev => prev.filter(x => x !== 'mini' && !miniSubs.includes(x)));
    } else {
      setLocalSelected(prev => [...prev, 'mini', ...miniSubs]);
    }
  };

  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
      <div className="h-[56px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24}/></button>
        <span className="flex-1 text-center font-black text-base mr-6 text-[#1F2129]">{title}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        <div className="bg-white rounded-2xl p-2 shadow-sm">
           {type === 'display' ? (
              <div className="divide-y divide-gray-50">
                {DISPLAY_OPTIONS.map(opt => {
                  const active = localSelected.includes(opt.id);
                  return (
                    <div key={opt.id} onClick={() => toggle(opt.id)} className="flex items-center justify-between p-4 cursor-pointer active:bg-gray-50">
                       <span className="text-sm font-bold text-gray-700">{opt.label}</span>
                       <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${active ? 'bg-[#00C06B] border-[#00C06B]' : 'bg-white border-gray-300'}`}>
                          {active && <Check size={14} className="text-white" strokeWidth={4}/>}
                       </div>
                    </div>
                  )
                })}
              </div>
           ) : (
             <div className="divide-y divide-gray-50">
                {SALES_OPTIONS.map(opt => {
                  const active = localSelected.includes(opt.id);
                  const isMini = opt.id === 'mini';
                  return (
                    <div key={opt.id} className="flex flex-col">
                      <div 
                        onClick={() => isMini ? handleMiniToggle() : toggle(opt.id)}
                        className="flex items-center justify-between p-4 cursor-pointer active:bg-gray-50"
                      >
                         <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${active ? 'bg-[#E6F8F0] text-[#00C06B]' : 'bg-gray-50 text-gray-400'}`}>{opt.icon}</div>
                            <span className="text-sm font-bold text-gray-700">{opt.label}</span>
                         </div>
                         <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${active ? 'bg-[#00C06B] border-[#00C06B]' : 'bg-white border-gray-300'}`}>
                            {active && <Check size={14} className="text-white" strokeWidth={4}/>}
                         </div>
                      </div>
                      
                      {isMini && active && (
                        <div className="bg-[#F8F9FB] px-4 pb-4 space-y-4 pt-2 border-t border-gray-100/50 animate-in fade-in slide-in-from-top-1">
                           <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">售卖类型</div>
                           <div className="flex flex-wrap gap-2">
                             {opt.sub?.map(s => {
                               const subActive = localSelected.includes(s.id);
                               return (
                                 <div 
                                    key={s.id} 
                                    onClick={() => toggle(s.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${subActive ? 'bg-white border-[#00C06B] text-[#00C06B] shadow-sm' : 'bg-transparent border-gray-200 text-gray-400'}`}
                                 >
                                    {s.label}
                                 </div>
                               )
                             })}
                           </div>
                        </div>
                      )}
                    </div>
                  )
                })}
             </div>
           )}
        </div>
      </div>

      <div className="p-4 pb-10 bg-white border-t border-gray-100 shadow-lg">
        <button 
          onClick={() => onSave(localSelected)}
          className="w-full h-[52px] bg-[#1F2129] text-white rounded-2xl text-[15px] font-black shadow-lg active:scale-95 transition-all"
        >
          确定 ({localSelected.length})
        </button>
      </div>
    </div>
  );
};