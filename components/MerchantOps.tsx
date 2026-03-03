
import React, { useState } from 'react';
import { Database, ShieldCheck, ListTree, ToggleRight, Store } from 'lucide-react';
import { NavItem } from './ops/OpsCommon';
import { OpsMetadataView } from './ops/OpsMetadataView';
import { OpsCategoryConfigView } from './ops/OpsCategoryConfigView';
import { OpsPolicyView } from './ops/OpsPolicyView';
import { OpsBrandConfigView } from './ops/OpsBrandConfigView';

export const MerchantOps: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'metadata' | 'categories' | 'policy' | 'brand_config'>('metadata');

  return (
    <div className="flex h-full font-sans bg-[#F5F6F8] overflow-hidden">
      {/* 侧边栏 */}
      <div className="w-[220px] bg-[#1E222D] flex flex-col shadow-2xl shrink-0">
        <div className="h-16 px-6 flex items-center bg-[#151921]">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg">
            <ShieldCheck size={20} />
          </div>
          <span className="font-bold text-white text-[15px] tracking-wide">Qimai Ops</span>
        </div>
        <div className="flex-1 py-6 px-3 space-y-1">
          <NavItem active={activeModule === 'metadata'} icon={<Database size={18}/>} label="元数据管理" onClick={() => setActiveModule('metadata')} />
          <NavItem active={activeModule === 'categories'} icon={<ListTree size={18}/>} label="类目配置管理" onClick={() => setActiveModule('categories')} />
          <NavItem active={activeModule === 'policy'} icon={<ToggleRight size={18}/>} label="商品管理策略" onClick={() => setActiveModule('policy')} />
          <div className="h-px bg-white/10 mx-4 my-2"></div>
          <NavItem active={activeModule === 'brand_config'} icon={<Store size={18}/>} label="品牌配置管理" onClick={() => setActiveModule('brand_config')} />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeModule === 'metadata' && <OpsMetadataView />}
        {activeModule === 'categories' && <OpsCategoryConfigView />}
        {activeModule === 'policy' && <OpsPolicyView />}
        {activeModule === 'brand_config' && <OpsBrandConfigView />}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .q-input { width: 100%; border: 1.5px solid #F0F0F0; border-radius: 16px; padding: 14px 20px; font-size: 14px; font-weight: 700; outline: none; transition: all 0.2s; background: white; }
        .q-input:focus { border-color: #F97316; box-shadow: 0 0 0 5px rgba(249, 115, 22, 0.08); background: #FFFBF9; }
        .q-select { width: 100%; border: 1.5px solid #F0F0F0; border-radius: 16px; padding: 14px 20px; font-size: 14px; font-weight: 700; outline: none; transition: all 0.2s; background: white; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1.25rem center; }
      `}</style>
    </div>
  );
};
