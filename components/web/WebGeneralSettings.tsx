import React, { useState } from 'react';
import { useProducts } from '../../context';
import { Switch } from '../ops/OpsCommon';
import { OpsChannelGroupingConfig } from '../ops/OpsChannelGroupingConfig'; // Reuse the existing config component

export const WebGeneralSettings: React.FC = () => {
    const { activeBrandId, brandConfigs, updateBrandConfig } = useProducts();
    const currentBrandConfig = brandConfigs[activeBrandId];

    // Form states matching the screenshot (mock data)
    const [purchaseLimitCustomText, setPurchaseLimitCustomText] = useState(true);
    const [electronicProduct, setElectronicProduct] = useState(true);
    const [pointsExchange, setPointsExchange] = useState(true);
    const [advanceKitchen, setAdvanceKitchen] = useState(true);
    const [dinerLimit, setDinerLimit] = useState(true);
    const [comboSplit, setComboSplit] = useState(true);

    const [packageFeeSetting, setPackageFeeSetting] = useState<'product' | 'spec'>('product');
    const [hideMiniProgramProducts, setHideMiniProgramProducts] = useState(false);
    const [sameProductSort, setSameProductSort] = useState(true);
    const [categorySortSync, setCategorySortSync] = useState(true);
    const [templateStoreDuplication, setTemplateStoreDuplication] = useState(true);

    if (!currentBrandConfig) return null;

    return (
        <div className="flex flex-col h-full w-full bg-[#F5F6FA] overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-white border-b border-[#E8E8E8] shrink-0">
                <h2 className="text-xl font-bold text-[#333]">商品属性设置</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12">
                
                {/* 商品属性设置 */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h3 className="text-base font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100">商品属性设置</h3>
                    <div className="space-y-6 max-w-4xl">
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">起购限购自定义文案：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <Switch checked={purchaseLimitCustomText} onChange={setPurchaseLimitCustomText} />
                                <span className="text-gray-500 text-sm pt-0.5">开启后小程序端商品列表起购限购展示文案可自定义，关闭后小程序端将使用默认文案，默认为：“限购x件”、“x件起购”</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">电子商品：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <Switch checked={electronicProduct} onChange={setElectronicProduct} />
                                <span className="text-gray-500 text-sm pt-0.5">该类商品仅用于抖音小程序，开启后，商品库标准商品页面创建商品时，可以选择创建电子商品</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">积分兑换：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <Switch checked={pointsExchange} onChange={setPointsExchange} />
                                <span className="text-gray-500 text-sm pt-0.5">开启后在商品库支持配置积分商品及积分规则</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">提前厨打：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <Switch checked={advanceKitchen} onChange={setAdvanceKitchen} />
                                <span className="text-gray-500 text-sm pt-0.5">开启后，商品支持设置“是否提前厨打”，用于预制商品提前下单制作</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">用餐人数限制：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <Switch checked={dinerLimit} onChange={setDinerLimit} />
                                <span className="text-gray-500 text-sm pt-0.5">开启后，商品支持设置“用餐人数限制”，如同一个锅底内有2-3人的价格、4-6人的价格、7人以上的价格</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">套餐支持双拼：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <Switch checked={comboSplit} onChange={setComboSplit} />
                                <span className="text-gray-500 text-sm pt-0.5">开启后，套餐商品支持设置“双拼商品”，用于正餐场景，尤其火锅行业，拼盘菜品场景</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 功能设置 */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h3 className="text-base font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100">功能设置</h3>
                    <div className="space-y-6 max-w-4xl">
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">包装费设置：</div>
                            <div className="flex-1 flex items-center space-x-6">
                                <label className="flex items-center space-x-2 cursor-pointer" onClick={(e) => { e.preventDefault(); setPackageFeeSetting('product'); }}>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${packageFeeSetting === 'product' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                        {packageFeeSetting === 'product' && <div className="w-2 h-2 rounded-full bg-[#00C06B]"/>}
                                    </div>
                                    <span className={`text-sm ${packageFeeSetting === 'product' ? 'text-[#00C06B] font-bold' : 'text-gray-600'}`}>商品级别</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer" onClick={(e) => { e.preventDefault(); setPackageFeeSetting('spec'); }}>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${packageFeeSetting === 'spec' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                        {packageFeeSetting === 'spec' && <div className="w-2 h-2 rounded-full bg-[#00C06B]"/>}
                                    </div>
                                    <span className={`text-sm ${packageFeeSetting === 'spec' ? 'text-[#00C06B] font-bold' : 'text-gray-600'}`}>规格级别</span>
                                </label>
                                <span className="text-gray-400 text-sm ml-4">选择商品级别设置包装费则是多个规格设置一个包装费，规格级别设置，多个规格多个包装费</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">小程序推荐屏蔽商品：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <span className="text-gray-500 text-sm pt-1">屏蔽如米饭、包装袋之类的高销量但实际无推荐意义的商品参与“猜你喜欢”、“热销商品”功能 <a href="#" className="text-[#00C06B] hover:underline ml-1">去设置屏蔽商品</a></span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">同一商品不同分类下排序一致：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <Switch checked={sameProductSort} onChange={setSameProductSort} />
                                <span className="text-gray-500 text-sm pt-0.5">开启后，分类下商品排序将不可拖动排序，同一商品在不同分类下排序值需保持一致</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">分类排序设置：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <Switch checked={categorySortSync} onChange={setCategorySortSync} />
                                <span className="text-gray-500 text-sm pt-0.5">开启后，分类管理中分类排序更新时，可选择是否下发并覆盖全部模板、门店的分类排序</span>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-[180px] text-right pr-6 text-gray-600 font-medium pt-1">模板适用门店设置：</div>
                            <div className="flex-1 flex items-start space-x-3">
                                <Switch checked={templateStoreDuplication} onChange={setTemplateStoreDuplication} />
                                <span className="text-gray-500 text-sm pt-0.5">开启后，模板的适用门店允许重复，即允许多个模板下发至一家门店的同一渠道。模板不复杂的商家不建议开启</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 门店业务设置 (Moved from Ops) */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h3 className="text-base font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100">门店业务设置</h3>
                    <div className="space-y-10 max-w-4xl">
                        {/* POS Stockout Mode Setting */}
                        <div className="space-y-4">
                            <div>
                                <h5 className="text-[15px] font-bold text-gray-900">企迈数店 POS 商品沽清模式</h5>
                                <p className="text-xs text-gray-400 mt-1">用于控制POS上商品沽清页面，商品按SPU或SKU模式展示、操作</p>
                            </div>
                            <div className="flex items-center space-x-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                <label className="flex items-center cursor-pointer group" onClick={(e) => { 
                                    e.preventDefault(); 
                                    updateBrandConfig(activeBrandId, {...currentBrandConfig, posStockoutMode: 'spu'}); 
                                }}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-2 transition-all ${currentBrandConfig.posStockoutMode === 'spu' ? 'border-[#00C06B]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                        {currentBrandConfig.posStockoutMode === 'spu' && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full"></div>}
                                    </div>
                                    <span className={`text-[14px] font-bold ${currentBrandConfig.posStockoutMode === 'spu' ? 'text-gray-900' : 'text-gray-500'}`}>SPU 模式</span>
                                </label>
                                <label className="flex items-center cursor-pointer group" onClick={(e) => { 
                                    e.preventDefault(); 
                                    updateBrandConfig(activeBrandId, {...currentBrandConfig, posStockoutMode: 'sku'}); 
                                }}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-2 transition-all ${currentBrandConfig.posStockoutMode === 'sku' ? 'border-[#00C06B]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                        {currentBrandConfig.posStockoutMode === 'sku' && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full"></div>}
                                    </div>
                                    <span className={`text-[14px] font-bold ${currentBrandConfig.posStockoutMode === 'sku' ? 'text-gray-900' : 'text-gray-500'}`}>SKU 模式</span>
                                </label>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-6"></div>

                        {/* POS Stockout Warning Threshold Setting */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1 pr-10">
                                <h5 className="text-[15px] font-bold text-gray-900">企迈数店 POS 已沽清列表设置</h5>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">用于控制POS上商品沽清页面，左侧已沽清列表数据展示规则，商品剩余份数小于设置的值，会在左侧已沽清列表展示，否则不展示</p>
                            </div>
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 shrink-0">
                                <span className="text-sm font-bold text-gray-600 mr-3">商品剩余份数小于</span>
                                <input 
                                    type="number" 
                                    className="w-16 bg-white border border-gray-200 rounded text-center text-sm font-bold py-1 outline-none focus:border-[#00C06B] focus:ring-1 focus:ring-[#00C06B]"
                                    value={currentBrandConfig.posStockoutWarningThreshold ?? 30}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 0) {
                                            updateBrandConfig(activeBrandId, {...currentBrandConfig, posStockoutWarningThreshold: val});
                                        }
                                    }}
                                />
                                <span className="text-sm font-bold text-gray-600 ml-3">时，商品展示在已沽清列表</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 渠道库存分组设置 (Moved from Ops) */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <h3 className="text-base font-bold text-gray-800 p-8 pb-4 border-b border-gray-100">渠道库存分组设置</h3>
                    <div className="bg-gray-50">
                        {/* We reuse the OpsChannelGroupingConfig component but pass it the actual config and an updater */}
                        <OpsChannelGroupingConfig 
                            config={currentBrandConfig}
                            onChange={(newConfig) => {
                                updateBrandConfig(activeBrandId, newConfig);
                            }}
                        />
                    </div>
                </section>

            </div>
        </div>
    );
};
