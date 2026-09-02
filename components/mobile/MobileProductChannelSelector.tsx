import React, { useState } from 'react';
import { ChevronLeft, Check, Smartphone, Store, ShoppingBag, Printer, LayoutGrid, CheckCircle2, UtensilsCrossed } from 'lucide-react';

interface Props {
  selectedChannels: string[];
  onBack: () => void;
  onSave: (next: string[]) => void;
  helperText?: string;
  onBeforeChannelToggle?: (channelId: string, nextEnabled: boolean, nextChannels: string[], prevChannels: string[]) => string[];
}

const CHANNEL_OPTIONS = [
  { id: 'mini', label: '小程序', icon: <Smartphone size={18}/>, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'pos', label: 'POS收银', icon: <Printer size={18}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'meituan', label: '美团外卖', icon: <Store size={18}/>, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={18}/>, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'meituan_dine', label: '美团在线点', icon: <UtensilsCrossed size={18}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'douyin_dine', label: '抖音在线点', icon: <UtensilsCrossed size={18}/>, color: 'text-cyan-600', bg: 'bg-cyan-50' },
];

export const MobileProductChannelSelector: React.FC<Props> = ({ selectedChannels, onBack, onSave, helperText, onBeforeChannelToggle }) => {
  const [localChannels, setLocalChannels] = useState<string[]>(selectedChannels);
  const [blockedInfo, setBlockedInfo] = useState<{ channelLabel: string; comboNames: string[] } | null>(null);

  const toggleChannel = (id: string) => {
    const prev = localChannels;
    let next = [...prev];
    const nextEnabled = !next.includes(id);
    if (!nextEnabled) {
      next = next.filter(c => c !== id);
      if (id === 'mini') {
        next = next.filter(c => c !== 'mini_dine' && c !== 'mini_take');
      }
    } else {
      next.push(id);
      if (id === 'mini') {
        if (!next.includes('mini_dine')) next.push('mini_dine');
        if (!next.includes('mini_take')) next.push('mini_take');
      }
    }
    const blockedCombos = onBeforeChannelToggle?.(id, nextEnabled, next, prev) || [];
    if (!nextEnabled && blockedCombos.length > 0) {
      const channelLabel = CHANNEL_OPTIONS.find(option => option.id === id)?.label || '当前渠道';
      setBlockedInfo({ channelLabel, comboNames: blockedCombos });
      return;
    }
    setLocalChannels(next);
  };

  const toggleSub = (id: string) => {
    setLocalChannels(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      return [...prev, id];
    });
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[56px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 shadow-sm relative z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 active:text-black">
          <ChevronLeft size={24} />
        </button>
        <span className="flex-1 text-center font-black text-base mr-6 text-[#1F2129]">选择销售渠道</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
        {helperText ? (
          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
            <p className="text-[12px] leading-5 font-medium text-orange-700">{helperText}</p>
          </div>
        ) : null}
        {CHANNEL_OPTIONS.map(opt => {
          const isEnabled = localChannels.includes(opt.id);
          const isMini = opt.id === 'mini';

          return (
            <div key={opt.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div 
                className="flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors"
                onClick={() => toggleChannel(opt.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${isEnabled ? `${opt.bg} ${opt.color}` : 'bg-gray-100 text-gray-400'}`}>
                    {opt.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-800">{opt.label}</span>
                    <span className={`text-[10px] font-bold ${isEnabled ? 'text-[#00C06B]' : 'text-gray-400'}`}>
                      {isEnabled ? '已开启' : '未开启'}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-7 rounded-full relative transition-all duration-300 ${isEnabled ? 'bg-[#00C06B]' : 'bg-gray-200'}`}>
                   <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${isEnabled ? 'left-6' : 'left-1'}`}></div>
                </div>
              </div>

              {isMini && isEnabled && (
                <div className="px-4 py-5 bg-[#F8F9FB] border-t border-gray-50 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                    <div className="w-1 h-3 bg-green-500 rounded-full mr-2"></div>
                    售卖类型 <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="flex gap-4">
                    {[
                      { id: 'mini_dine', label: '堂食' },
                      { id: 'mini_take', label: '外卖' }
                    ].map(sub => (
                      <button 
                        key={sub.id}
                        onClick={() => toggleSub(sub.id)}
                        className={`flex-1 py-3 rounded-2xl text-xs font-black border-2 transition-all flex items-center justify-center space-x-2 ${localChannels.includes(sub.id) ? 'bg-white border-[#00C06B] text-[#00C06B] shadow-sm' : 'bg-transparent border-gray-200 text-gray-400'}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${localChannels.includes(sub.id) ? 'bg-[#00C06B] border-[#00C06B]' : 'bg-white border-gray-300'}`}>
                          {localChannels.includes(sub.id) && <Check size={12} className="text-white" strokeWidth={4}/>}
                        </div>
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="bg-blue-50/60 rounded-2xl p-4 flex items-start mt-4">
          <div className="text-blue-500 mr-2 mt-0.5">
             <LayoutGrid size={16} />
          </div>
          <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
            开启渠道后，该商品将在所选渠道售卖。企迈管理的美团在线点、抖音在线点操作会同时调用平台；平台失败时保留本地结果并生成可重试记录。
          </p>
        </div>
      </div>

      <div className="p-4 pb-10 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] shrink-0">
        <button 
          onClick={() => onSave(localChannels)}
          className="w-full h-[52px] bg-[#1F2129] text-white rounded-2xl text-[15px] font-black shadow-xl active:scale-[0.98] transition-all"
        >
          确定配置
        </button>
      </div>

      {blockedInfo ? (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/45 px-5">
          <div className="w-full rounded-[24px] bg-white p-5 shadow-2xl">
            <div className="text-[18px] font-black text-[#1F2129]">暂不支持关闭 {blockedInfo.channelLabel}</div>
            <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-[12px] leading-5 text-orange-700">
              当前商品已被以下套餐商品关联，请先解除套餐关联后再关闭该渠道售卖。
            </div>
            <div className="mt-4 rounded-2xl bg-[#F7F9FC] p-4">
              <div className="text-[12px] font-bold text-[#667085]">关联套餐商品</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {blockedInfo.comboNames.map(name => (
                  <span key={name} className="inline-flex rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#1F2129]">
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <button onClick={() => setBlockedInfo(null)} className="h-11 w-full rounded-xl bg-[#1F2129] text-sm font-bold text-white">我知道了</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
