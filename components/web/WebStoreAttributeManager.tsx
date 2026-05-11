import React, { useEffect, useState } from 'react';
import { Blend, ChefHat } from 'lucide-react';
import { WebStoreAddonList } from './WebStoreAddonList';
import { PosMethodView } from '../pos/PosMethodView';

type StoreAttributeTab = 'addon' | 'method';

export const WebStoreAttributeManager: React.FC<{
  initialTab?: StoreAttributeTab;
}> = ({ initialTab = 'addon' }) => {
  const [activeTab, setActiveTab] = useState<StoreAttributeTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs: Array<{ id: StoreAttributeTab; label: string; desc: string; icon: React.ReactNode }> = [
    { id: 'addon', label: '加料', desc: '管理门店加料价格、库存与投放状态', icon: <Blend size={16} /> },
    { id: 'method', label: '做法', desc: '管理门店做法启用状态与关联商品', icon: <ChefHat size={16} /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F6FA]">
      <div className="shrink-0 bg-white px-6 pt-5">
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-[220px] rounded-xl border px-5 py-3 text-left transition-all ${
                activeTab === tab.id
                  ? 'border-[#B7E8CB] bg-[#F3FCF7] text-[#00C06B]'
                  : 'border-transparent bg-white text-[#666] hover:border-[#E8E8E8] hover:bg-[#FAFAFA] hover:text-[#333]'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  activeTab === tab.id ? 'bg-[#E6F8F0] text-[#00C06B]' : 'bg-[#F3F4F6] text-[#8C8C8C]'
                }`}>
                  {tab.icon}
                </div>
                <div className="text-sm font-bold">{tab.label}</div>
              </div>
              <div className={`mt-1 text-xs leading-5 ${activeTab === tab.id ? 'text-[#52B87A]' : 'text-[#999]'}`}>
                {tab.desc}
              </div>
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'addon' ? <WebStoreAddonList /> : <PosMethodView />}
      </div>
    </div>
  );
};
