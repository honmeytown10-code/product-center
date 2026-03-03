import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, Check, X } from 'lucide-react';

interface Props {
  config: any;
  onBack: () => void;
  onSave: (config: any) => void;
}

export const MobileCategoryTimeEditor: React.FC<Props> = ({ config, onBack, onSave }) => {
  const [localConfig, setLocalConfig] = useState(JSON.parse(JSON.stringify(config)));

  const toggleDay = (day: number) => {
    setLocalConfig((prev: any) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d: number) => d !== day) : [...prev.days, day]
    }));
  };

  const addRange = () => {
    if (localConfig.timeRanges.length >= 3) return;
    setLocalConfig((prev: any) => ({
      ...prev,
      timeRanges: [...prev.timeRanges, { start: '00:00:00', end: '23:59:59' }]
    }));
  };

  const removeRange = (idx: number) => {
    setLocalConfig((prev: any) => ({
      ...prev,
      timeRanges: prev.timeRanges.filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateRange = (idx: number, key: string, val: string) => {
    setLocalConfig((prev: any) => {
      const next = [...prev.timeRanges];
      next[idx] = { ...next[idx], [key]: val };
      return { ...prev, timeRanges: next };
    });
  };

  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
      <div className="h-[56px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24}/></button>
        <span className="flex-1 text-center font-black text-base mr-6 text-[#1F2129]">自定义上架时间</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-6">
          <div className="flex flex-col space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">销售日期</label>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="date" 
                value={localConfig.startDate} 
                onChange={e => setLocalConfig({...localConfig, startDate: e.target.value})}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm font-bold outline-none"
              />
              <input 
                type="date" 
                value={localConfig.endDate} 
                onChange={e => setLocalConfig({...localConfig, endDate: e.target.value})}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm font-bold outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium">为空表示不限制商品销售日期</p>
          </div>

          <div className="h-px bg-gray-50"></div>

          <div className="flex flex-col space-y-4">
             <label className="text-xs font-black text-gray-400 uppercase tracking-widest">每周销售日</label>
             <div className="flex flex-wrap gap-2">
                {[
                  { id: 1, label: '周一' },
                  { id: 2, label: '周二' },
                  { id: 3, label: '周三' },
                  { id: 4, label: '周四' },
                  { id: 5, label: '周五' },
                  { id: 6, label: '周六' },
                  { id: 7, label: '周日' },
                ].map(d => (
                  <div 
                    key={d.id} 
                    onClick={() => toggleDay(d.id)}
                    className={`flex items-center px-3 py-2 rounded-lg border transition-all cursor-pointer ${localConfig.days.includes(d.id) ? 'bg-[#E6F8F0] border-[#00C06B] text-[#00C06B]' : 'bg-white border-gray-200 text-gray-400'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border mr-2 flex items-center justify-center ${localConfig.days.includes(d.id) ? 'bg-[#00C06B] border-[#00C06B]' : 'bg-white border-gray-200'}`}>
                      {localConfig.days.includes(d.id) && <Check size={10} className="text-white" strokeWidth={4}/>}
                    </div>
                    <span className="text-xs font-bold">{d.label}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="h-px bg-gray-50"></div>

          <div className="flex flex-col space-y-4">
             <label className="text-xs font-black text-gray-400 uppercase tracking-widest">每日销售时间段</label>
             <div className="space-y-3">
                {localConfig.timeRanges.map((range: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
                    <input 
                      type="time" step="1" 
                      value={range.start} 
                      onChange={e => updateRange(idx, 'start', e.target.value)}
                      className="flex-1 bg-transparent text-sm font-bold text-gray-700 outline-none"
                    />
                    <span className="text-gray-300">至</span>
                    <input 
                      type="time" step="1" 
                      value={range.end} 
                      onChange={e => updateRange(idx, 'end', e.target.value)}
                      className="flex-1 bg-transparent text-sm font-bold text-gray-700 outline-none"
                    />
                    {localConfig.timeRanges.length > 1 && (
                      <button onClick={() => removeRange(idx)} className="text-red-500 font-bold text-xs pl-2">删除</button>
                    )}
                  </div>
                ))}
                {localConfig.timeRanges.length < 3 && (
                   <button 
                    onClick={addRange}
                    className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[#00C06B] text-xs font-black flex items-center justify-center active:bg-green-50 transition-colors"
                   >
                     <Plus size={14} className="mr-1"/> 添加销售时间段 (最多添加3个)
                   </button>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-10 bg-white border-t border-gray-100 shadow-lg">
        <button 
          onClick={() => onSave(localConfig)}
          className="w-full h-[52px] bg-[#00C06B] text-white rounded-2xl text-[15px] font-black shadow-lg shadow-green-100 active:scale-95 transition-all"
        >
          保存
        </button>
      </div>
    </div>
  );
};