import React, { useState } from 'react';
import { ChevronLeft, Check, Minus, Plus, Info } from 'lucide-react';

export interface RequiredGroupConfig {
  enabled: boolean;
  dineIn: {
    required: boolean;
    limit: number;
  };
  takeaway: {
    required: boolean;
    limit: number;
  };
}

interface Props {
  config: RequiredGroupConfig;
  onBack: () => void;
  onSave: (config: RequiredGroupConfig) => void;
}

export const MobileCategoryRequiredGroupEditor: React.FC<Props> = ({ config, onBack, onSave }) => {
  const [localConfig, setLocalConfig] = useState<RequiredGroupConfig>(JSON.parse(JSON.stringify(config)));

  const handleToggleMain = () => {
    setLocalConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleToggleSub = (type: 'dineIn' | 'takeaway') => {
    setLocalConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], required: !prev[type].required }
    }));
  };

  const handleUpdateLimit = (type: 'dineIn' | 'takeaway', val: number) => {
    setLocalConfig(prev => ({
      ...prev,
      [type]: { ...prev[type], limit: Math.max(0, val) }
    }));
  };

  return (
    <div className="absolute inset-0 z-[200] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[56px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 shadow-sm relative z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 active:text-black">
          <ChevronLeft size={24} />
        </button>
        <span className="flex-1 text-center font-black text-base mr-6 text-[#1F2129]">必选分组配置</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
        {/* Main Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-black text-gray-800">启用必选分组</span>
              <span className="text-[10px] text-gray-400 font-medium mt-1">开启后，顾客在点餐时必须选择该分类下的商品</span>
            </div>
            <div 
              onClick={handleToggleMain}
              className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${localConfig.enabled ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${localConfig.enabled ? 'left-6' : 'left-1'}`}></div>
            </div>
          </div>

          {localConfig.enabled && (
            <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-top-2">
              <div className="h-px bg-gray-50"></div>

              {/* Dine-in Config */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      onClick={() => handleToggleSub('dineIn')}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${localConfig.dineIn.required ? 'bg-[#00C06B] border-[#00C06B]' : 'bg-white border-gray-200'}`}
                    >
                      {localConfig.dineIn.required && <Check size={14} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`text-[15px] font-black ${localConfig.dineIn.required ? 'text-[#00C06B]' : 'text-gray-400'}`}>堂食必选</span>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-xl bg-[#F8F9FB] transition-opacity ${!localConfig.dineIn.required ? 'opacity-40 grayscale' : ''}`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-600">设置购买上限</span>
                    <span className="text-[10px] text-gray-400 mt-1">该分类下最多可选择的数量</span>
                  </div>
                  <Stepper 
                    value={localConfig.dineIn.limit} 
                    onChange={(v) => localConfig.dineIn.required && handleUpdateLimit('dineIn', v)} 
                  />
                </div>
              </div>

              {/* Takeaway Config */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      onClick={() => handleToggleSub('takeaway')}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${localConfig.takeaway.required ? 'bg-[#00C06B] border-[#00C06B]' : 'bg-white border-gray-200'}`}
                    >
                      {localConfig.takeaway.required && <Check size={14} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`text-[15px] font-black ${localConfig.takeaway.required ? 'text-[#00C06B]' : 'text-gray-400'}`}>外卖必选</span>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-xl bg-[#F8F9FB] transition-opacity ${!localConfig.takeaway.required ? 'opacity-40 grayscale' : ''}`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-600">设置购买上限</span>
                    <span className="text-[10px] text-gray-400 mt-1">该分类下最多可选择的数量</span>
                  </div>
                  <Stepper 
                    value={localConfig.takeaway.limit} 
                    onChange={(v) => localConfig.takeaway.required && handleUpdateLimit('takeaway', v)} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50/60 rounded-xl p-4 flex items-start">
          <Info size={16} className="text-blue-500 mt-0.5 mr-2 shrink-0" />
          <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
            必选分组功能开启后，若顾客在下单时该分类下商品数量未达到“必选”要求，系统将限制下单并引导顾客前往该分类进行选择。
          </p>
        </div>
      </div>

      {/* Footer Save Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-10 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <button 
          onClick={() => onSave(localConfig)}
          className="w-full h-[52px] bg-[#1F2129] text-white rounded-2xl text-[15px] font-black shadow-xl active:scale-[0.98] transition-all"
        >
          确认配置
        </button>
      </div>
    </div>
  );
};

const Stepper: React.FC<{ value: number, onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex items-center bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
    <button 
      onClick={() => onChange(value - 1)}
      className="w-10 h-10 flex items-center justify-center text-gray-400 active:bg-gray-50 active:text-[#333] transition-colors border-r border-gray-100"
    >
      <Minus size={16} />
    </button>
    <div className="w-14 h-10 flex items-center justify-center text-[16px] font-black text-[#1F2129]">
      {value}
    </div>
    <button 
      onClick={() => onChange(value + 1)}
      className="w-10 h-10 flex items-center justify-center text-gray-400 active:bg-gray-50 active:text-[#333] transition-colors border-l border-gray-100"
    >
      <Plus size={16} />
    </button>
  </div>
);