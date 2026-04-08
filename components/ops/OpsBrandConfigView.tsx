
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, Sliders, Save, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { useProducts } from '../../context';
import { MOCK_BRANDS, AVAILABLE_DYNAMIC_FIELDS, BrandConfig } from '../../types';
import { PolicyEditor } from './OpsPolicyView';
import { OpsChannelGroupingConfig } from './OpsChannelGroupingConfig';

const BRAND_FEATURE_LIST = [
    { key: 'stock_shared', label: '全渠道库存共享 (Goods.Stock.Shared)', required: true },
    { key: 'auto_mapping', label: '美团商品自动更新关联 (Auto.Meituan.Mapping)' },
    { key: 'markup_type', label: '做法加价支持固定比例 (Goods.Practice.Markup.Type)' },
    { key: 'batch_check', label: '模板批量同步功能门店校验 (Goods.Batch.StoreCheck)' },
    { key: 'shelves_unite', label: '全渠道统一上下架 (Goods.Shelves.Unite)', required: true }, // Updated Label
    { key: 'class_sort', label: '分类下商品排序支持不一致 (Goods.Class.Sort)' },
    { key: 'app_get_data', label: 'App是否直接获取美团商品数据 (Switch.App.GetMEGoodsData)' },
    { key: 'new_edit_page', label: '新版商品编辑页 (Goods.New.EditPage)' },
    { key: 'store_export', label: '门店商品导出功能 (Store.Goods.Export)' },
    { key: 'upgrade_3_0', label: '商品中心升级版本3.0 (Goods.NewVersion.Upgrade)' },
 ];

export const OpsBrandConfigView: React.FC = () => {
  const { policies, brandConfigs, updateBrandConfig, activeBrandId } = useProducts();
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);
  const [showPolicyCustomizer, setShowPolicyCustomizer] = useState(false);
  
  // Local state for buffering changes before save
  const [tempConfig, setTempConfig] = useState<BrandConfig | null>(null);

  const handleOpenBrandConfig = (brandId: string) => {
     setCurrentBrandId(brandId);
     const originalConfig = brandConfigs[brandId] || brandConfigs['b_1'];
     // Deep copy to prevent reference mutation
     setTempConfig(JSON.parse(JSON.stringify(originalConfig)));
     setView('edit');
  };

  const handleBrandPolicyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     if (!tempConfig) return;
     setTempConfig({ ...tempConfig, policyId: e.target.value });
  };

  const handleToggleFeature = (key: string) => {
     if (!tempConfig) return;
     setTempConfig({
        ...tempConfig,
        features: { ...tempConfig.features, [key as keyof typeof tempConfig.features]: !tempConfig.features[key as keyof typeof tempConfig.features] }
     });
  };

  const handleSaveConfig = () => {
      if (currentBrandId && tempConfig) {
          updateBrandConfig(currentBrandId, tempConfig);
          setView('list');
      }
  };

  const handleInitCustomPolicy = () => {
      if (!currentBrandId || !tempConfig) return;
      if (!tempConfig.customPolicy) {
          const currentPolicy = policies.find(p => p.id === tempConfig.policyId) || policies[0];
          const newCustomPolicy = JSON.parse(JSON.stringify(currentPolicy));
          newCustomPolicy.id = `custom_${currentBrandId}`;
          newCustomPolicy.name = `${currentPolicy.name} (自定义)`;
          setTempConfig({ ...tempConfig, customPolicy: newCustomPolicy });
      }
      setShowPolicyCustomizer(true);
  };

  if (view === 'edit' && tempConfig) {
      return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
            <header className="h-20 px-10 border-b flex justify-between items-center bg-white z-20 shrink-0 shadow-sm">
                <div className="flex items-center space-x-6">
                    <button onClick={() => setView('list')} className="p-3 hover:bg-gray-50 rounded-2xl transition-all border border-gray-100 group">
                        <ChevronRight size={20} className="text-gray-500 rotate-180 group-hover:text-black"/>
                    </button>
                    <div>
                        <h3 className="font-black text-xl text-[#1F2129]">{MOCK_BRANDS.find(b => b.id === currentBrandId)?.name}</h3>
                        <p className="text-xs text-gray-400 font-bold mt-0.5 uppercase tracking-widest">Brand Configuration</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => setView('list')} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all text-sm">取消</button>
                    <button onClick={handleSaveConfig} className="px-8 py-3 bg-[#1F2129] text-white font-black rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95 flex items-center text-sm">
                        <Save size={16} className="mr-2"/> 保存配置
                    </button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto bg-[#F8FAFB] p-12 no-scrollbar">
                <div className="max-w-4xl mx-auto space-y-12 pb-40">
                    <section>
                    <div className="flex items-center mb-6"><div className="w-1.5 h-6 bg-[#1F2129] mr-4 rounded-full"></div><h4 className="text-2xl font-black text-gray-900">商品中心</h4></div>
                    <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm space-y-10">
                        <div className="flex items-center space-x-6">
                            <div className="flex-1 flex flex-col space-y-4">
                                <label className="text-[13px] font-black text-[#00C06B] uppercase tracking-widest pl-1">商品管理策略 (Product Policy)</label>
                                <div className="relative">
                                    <select className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-800 outline-none appearance-none focus:border-[#00C06B] transition-colors cursor-pointer" value={tempConfig.policyId} onChange={handleBrandPolicyChange}>
                                        {policies.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.status === 'active' ? '启用' : '禁用'})</option>))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-5 text-gray-400 pointer-events-none" size={16}/>
                                </div>
                            </div>
                            <div className="pt-8">
                                <button onClick={handleInitCustomPolicy} className="h-[56px] px-6 border-2 border-dashed border-[#00C06B] text-[#00C06B] rounded-2xl font-bold flex items-center hover:bg-green-50 transition-all active:scale-95">
                                    <Sliders size={18} className="mr-2"/>自定义策略配置
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 pl-1 -mt-4">选择基础策略模板后，点击“自定义”可针对该品牌微调管控规则。</p>
                        <div className="h-px bg-gray-100 my-2"></div>
                        <div className="space-y-1">
                            {BRAND_FEATURE_LIST.map((item, index) => {
                                const isActive = tempConfig.features[item.key as keyof typeof tempConfig.features];
                                return (
                                <div key={item.key} className="group flex items-center justify-between py-5 px-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleToggleFeature(item.key)}>
                                    <div className="flex items-center space-x-4 flex-1"><div className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isActive ? 'bg-[#00C06B]' : 'bg-gray-200 group-hover:bg-gray-300'}`}><Check size={14} className="text-white" strokeWidth={4}/></div><span className={`text-[14px] font-bold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span></div>
                                    <div className="flex items-center space-x-12 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center space-x-2"><div className={`w-4 h-4 rounded border ${isActive ? 'border-gray-400' : 'border-gray-200'}`}></div><span className="text-xs text-gray-500 font-medium">品牌可看</span></div>
                                        <div className="flex items-center space-x-2"><div className={`w-4 h-4 rounded border ${isActive ? 'border-gray-400' : 'border-gray-200'}`}></div><span className="text-xs text-gray-500 font-medium">品牌可维护</span></div>
                                        <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200"><div className="flex items-center space-x-2"><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-[#00C06B]' : 'border-gray-300'}`}>{isActive && <div className="w-2 h-2 rounded-full bg-[#00C06B]"/>}</div><span className={`text-xs font-bold ${isActive ? 'text-[#00C06B]' : 'text-gray-400'}`}>开启</span></div><div className="flex items-center space-x-2"><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!isActive ? 'border-gray-500' : 'border-gray-300'}`}>{!isActive && <div className="w-2 h-2 rounded-full bg-gray-500"/>}</div><span className={`text-xs font-bold ${!isActive ? 'text-gray-600' : 'text-gray-400'}`}>关闭</span></div></div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* We removed the Channel Grouping config from here, it is now in WebAdmin -> General Settings */}

                    {/* We removed the POS Store Ops Config Section (SPU/SKU mode & Threshold) from here, it is now in WebAdmin -> General Settings */}

                    </section>
                </div>
            </div>
            {/* Customizer Modal */}
            {showPolicyCustomizer && tempConfig.customPolicy && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#1F2129]/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl w-[90%] h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <div className="flex items-center space-x-4"><div className="p-3 bg-purple-50 text-purple-500 rounded-2xl"><Sliders size={22}/></div><div><h3 className="text-xl font-black text-[#1F2129]">自定义品牌策略配置</h3><p className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{MOCK_BRANDS.find(b => b.id === currentBrandId)?.name} / Custom Policy Overrides</p></div></div>
                            <div className="flex items-center space-x-3">
                                <button onClick={() => setShowPolicyCustomizer(false)} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all">关闭</button>
                                <button onClick={() => setShowPolicyCustomizer(false)} className="px-6 py-2.5 bg-[#1F2129] text-white rounded-xl text-xs font-black shadow-lg hover:bg-black transition-all active:scale-95 flex items-center"><Save size={16} className="mr-2"/> 暂存配置</button>
                            </div>
                        </div>
                        <div className="flex-1 bg-[#F8FAFB] overflow-hidden">
                            <PolicyEditor 
                                policy={tempConfig.customPolicy} 
                                onChange={(newPolicy) => setTempConfig(prev => prev ? ({ ...prev, customPolicy: newPolicy }) : null)} 
                                allFields={AVAILABLE_DYNAMIC_FIELDS} 
                                readOnlyName={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="p-12 h-full flex flex-col overflow-y-auto no-scrollbar animate-in fade-in duration-300">
        <header className="mb-12"><h2 className="text-3xl font-black text-[#1F2129]">品牌配置管理</h2><p className="text-[15px] text-gray-400 mt-2 font-medium">为不同品牌实例分配管理策略，并定义全渠道库存与上下架规则。</p></header>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-40">
            {MOCK_BRANDS.map(brand => (
                <div key={brand.id} onClick={() => handleOpenBrandConfig(brand.id)} className={`bg-white rounded-[32px] p-8 border transition-all cursor-pointer group relative overflow-hidden ${activeBrandId === brand.id ? 'border-orange-500 ring-4 ring-orange-500/10 shadow-2xl' : 'border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1'}`}>
                {activeBrandId === brand.id && <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl">当前操作品牌</div>}
                <div className="flex items-center justify-between mb-8"><div className="w-16 h-16 rounded-[24px] bg-orange-50 text-4xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">{brand.icon}</div><div className="px-4 py-1.5 rounded-full bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wide">{brand.type}</div></div>
                <h3 className="text-xl font-black text-gray-800 mb-2">{brand.name}</h3>
                <p className="text-sm text-gray-400">ID: {brand.id}</p>
                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center text-orange-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">进入配置 <ChevronRight size={16} className="ml-1"/></div>
                </div>
            ))}
        </div>
    </div>
  );
};
