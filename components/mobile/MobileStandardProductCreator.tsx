
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, Plus, ChevronRight, Check, 
  ImageIcon, Smartphone, Printer, Store, ShoppingBag,
  Info, Camera, Video, List, Sliders, Tag, Settings, Minus, X, Trash2, Edit2, Clock
} from 'lucide-react';
import { Category } from '../../types';
import { MobileCategorySelector } from './MobileCategorySelector';
import { MobileProductAttributeSorter } from './MobileProductAttributeSorter';
import { MobileProductChannelSelector } from './MobileProductChannelSelector';

interface Props {
  onBack: () => void;
  categories: Category[];
  categoryName?: string;
}

type TabType = 'basic' | 'attr' | 'sales' | 'display';

interface TimeRule {
  id: string;
  days: number[]; // 1-7
  times: string[];
}

interface TimeSalesConfig {
  startDate: string;
  endDate: string;
  rules: TimeRule[];
}

export const MobileStandardProductCreator: React.FC<Props> = ({ onBack, categoryName }) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [showTimeSalesEditor, setShowTimeSalesEditor] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showAttributeSorter, setShowAttributeSorter] = useState(false);
  const [showChannelSelector, setShowChannelSelector] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const sectionRefs = {
    basic: useRef<HTMLDivElement>(null),
    attr: useRef<HTMLDivElement>(null),
    sales: useRef<HTMLDivElement>(null),
    display: useRef<HTMLDivElement>(null),
  };

  const [formData, setFormData] = useState({
    name: '',
    category: categoryName || '通用菜品',
    channels: ['mini', 'pos', 'mini_dine', 'mini_take'],
    specType: 'single', // 'single' | 'multi'
    basePrice: '',
    stock: '',
    salesMode: 'normal', // 'normal' | 'combo_only'
    takeawayMode: 'normal', // 'normal' | 'hide' | 'only'
    settings: ['member_discount'],
    // Purchase Limit State
    startQtyEnabled: false,
    startQty: 1,
    limitQtyEnabled: false,
    limitQty: 1,
    limitType: 'per_order', // 'per_order' | 'per_person_day'
    // Time Sales State
    timeSales: null as TimeSalesConfig | null,
  });

  const tabs: { id: TabType; label: string }[] = [
    { id: 'basic', label: '基础信息' },
    { id: 'attr', label: '商品属性' },
    { id: 'sales', label: '销售属性' },
    { id: 'display', label: '展示信息' },
  ];

  // 滑动自动切换 Tab 逻辑 (Scroll-spy)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
        const scrollPos = container.scrollTop + 100;
        let current: TabType = 'basic';
        
        if (sectionRefs.display.current && scrollPos >= sectionRefs.display.current.offsetTop) current = 'display';
        else if (sectionRefs.sales.current && scrollPos >= sectionRefs.sales.current.offsetTop) current = 'sales';
        else if (sectionRefs.attr.current && scrollPos >= sectionRefs.attr.current.offsetTop) current = 'attr';
        else current = 'basic';

        setActiveTab(current);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (tabId: TabType) => {
    const target = sectionRefs[tabId].current;
    if (target && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: target.offsetTop - 60, behavior: 'smooth' });
    }
  };

  const handleTimeSalesSave = (config: TimeSalesConfig) => {
    setFormData({ ...formData, timeSales: config });
    setShowTimeSalesEditor(false);
  };

  const handleCategorySelect = (cat: { id: string, name: string }) => {
    setFormData({ ...formData, category: cat.name });
    setShowCategorySelector(false);
  };

  const handleChannelsSave = (nextChannels: string[]) => {
    setFormData({ ...formData, channels: nextChannels });
    setShowChannelSelector(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] h-full relative overflow-hidden font-sans select-none animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 z-30">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24} /></button>
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">创建标准商品</span>
      </div>

      {/* 顶部 Tab 导航 */}
      <div className="bg-white px-2 border-b border-gray-100 shrink-0 z-20 flex overflow-x-auto no-scrollbar shadow-sm">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            onClick={() => scrollTo(tab.id)}
            className={`relative px-4 py-3 text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'text-[#00C06B]' : 'text-gray-500'}`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#00C06B] rounded-full animate-in fade-in slide-in-from-bottom-1"></div>}
          </div>
        ))}
      </div>

      {/* 主表单区域 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-40 scroll-smooth">
        
        {/* 1. 基本信息 */}
        <div ref={sectionRefs.basic} className="bg-white p-5 rounded-2xl shadow-sm space-y-5">
            <h3 className="font-black text-base text-gray-800">基本信息</h3>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700">商品名称 <span className="text-red-500">*</span></label>
                <input 
                    className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4" 
                    placeholder="请输入商品名称" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>
            {/* 点击分类触发二级选择 */}
            <div 
                className="flex justify-between items-center py-2 border-b border-gray-50 cursor-pointer active:bg-gray-50 transition-colors"
                onClick={() => setShowCategorySelector(true)}
            >
                <label className="text-sm font-bold text-gray-700">商品分类 <span className="text-red-500">*</span></label>
                <div className="flex items-center text-sm text-[#333] font-bold">
                    <span>{formData.category}</span>
                    <ChevronRight size={16} className="ml-1 text-gray-400"/>
                </div>
            </div>
            <div className="py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700 block mb-2">商品主图 <span className="text-red-500">*</span></label>
                <div className="w-16 h-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 mb-3 active:bg-gray-100 transition-colors">
                    <Plus size={20} />
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                    建议尺寸：1:1，单张大小不超过300K最多可上传10张;可以拖拽调整图片顺序。
                </p>
            </div>
            
            {/* 销售渠道入口优化 */}
            <div 
                className="flex justify-between items-center py-2 border-b border-gray-50 cursor-pointer active:bg-gray-50 transition-colors"
                onClick={() => setShowChannelSelector(true)}
            >
                <label className="text-sm font-bold text-gray-700">销售渠道 <span className="text-red-500">*</span></label>
                <div className="flex items-center text-sm text-[#333] font-bold">
                    <span>已选 {formData.channels.filter(c => ['mini', 'pos', 'meituan', 'taobao'].includes(c)).length} 个渠道</span>
                    <ChevronRight size={16} className="ml-1 text-gray-400"/>
                </div>
            </div>

            <div className="flex justify-between items-center py-2">
                <label className="text-sm font-bold text-gray-700">商品备注</label>
                <input className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4" placeholder="请输入商品备注" />
            </div>
        </div>

        {/* 2. 商品属性 */}
        <div ref={sectionRefs.attr} className="bg-white p-5 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-black text-base text-gray-800">商品属性</h3>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700">规格 <span className="text-red-500">*</span></label>
                <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setFormData({...formData, specType: 'single'})}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.specType === 'single' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                            {formData.specType === 'single' && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full animate-in zoom-in-50"></div>}
                        </div>
                        <span className="text-xs font-bold text-gray-600">统一规格</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setFormData({...formData, specType: 'multi'})}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.specType === 'multi' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                            {formData.specType === 'multi' && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full animate-in zoom-in-50"></div>}
                        </div>
                        <span className="text-xs font-bold text-gray-600">多规格</span>
                    </label>
                </div>
            </div>
            
            {formData.specType === 'single' ? (
                <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 animate-in fade-in">
                        <label className="text-sm font-bold text-gray-700">基础售价 <span className="text-red-500">*</span></label>
                        <div className="flex items-center space-x-2 w-full max-w-[50%] justify-end">
                            <input 
                                className="text-right text-sm font-bold outline-none placeholder-gray-300 flex-1 w-full" 
                                placeholder="请输入" 
                                value={formData.basePrice} 
                                onChange={e => setFormData({...formData, basePrice: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 animate-in fade-in">
                        <label className="text-sm font-bold text-gray-700">库存</label>
                        <input 
                            className="text-right text-sm font-bold outline-none placeholder-gray-300 flex-1 ml-4" 
                            placeholder="无限" 
                            type="number"
                            value={formData.stock} 
                            onChange={e => setFormData({...formData, stock: e.target.value})} 
                        />
                    </div>
                </>
            ) : (
                <div className="flex justify-between items-center py-2 border-b border-gray-50 animate-in fade-in">
                    <label className="text-sm font-bold text-gray-700">规格设置 <span className="text-red-500">*</span></label>
                    <div className="flex items-center text-sm text-gray-400 font-bold">
                        <span>去选择</span>
                        <ChevronRight size={16} className="ml-1"/>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700">商品做法</label>
                <div className="flex items-center text-sm text-gray-400 font-bold">
                    <span>设置做法</span>
                    <ChevronRight size={16} className="ml-1"/>
                </div>
            </div>
            <div className="flex justify-between items-center py-2">
                <label className="text-sm font-bold text-gray-700">商品加料</label>
                <div className="flex items-center text-sm text-gray-400 font-bold">
                    <span>设置做法</span>
                    <ChevronRight size={16} className="ml-1"/>
                </div>
            </div>
        </div>

        {/* 3. 销售属性 */}
        <div ref={sectionRefs.sales} className="bg-white p-5 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-black text-base text-gray-800">销售属性</h3>
            <div className="space-y-6">
                {/* 起购数量 */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-700">起购数量</label>
                        <SwitchRow active={formData.startQtyEnabled} onClick={() => setFormData({...formData, startQtyEnabled: !formData.startQtyEnabled})} />
                    </div>
                    {formData.startQtyEnabled && (
                        <div className="animate-in slide-in-from-top-2 duration-200 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[13px] font-medium text-gray-600">起购数量 <span className="text-red-500">*</span></label>
                                <Stepper value={formData.startQty} onChange={v => setFormData({...formData, startQty: v})} />
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight">一次购买该商品最少的数量，不可超过限购数量</p>
                        </div>
                    )}
                </div>

                <div className="h-px bg-gray-50"></div>

                {/* 限购数量 */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-700">限购数量</label>
                        <SwitchRow active={formData.limitQtyEnabled} onClick={() => setFormData({...formData, limitQtyEnabled: !formData.limitQtyEnabled})} />
                    </div>
                    {formData.limitQtyEnabled && (
                        <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[13px] font-medium text-gray-600">限购类型</label>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setFormData({...formData, limitType: 'per_order'})}
                                        className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${formData.limitType === 'per_order' ? 'bg-[#E6F8F0] text-[#00C06B] border border-[#00C06B]/20 shadow-sm' : 'text-gray-500'}`}
                                    >每笔订单</button>
                                    <button 
                                        onClick={() => setFormData({...formData, limitType: 'per_person_day'})}
                                        className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${formData.limitType === 'per_person_day' ? 'bg-[#E6F8F0] text-[#00C06B] border border-[#00C06B]/20 shadow-sm' : 'text-gray-500'}`}
                                    >每人每天</button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <label className="text-[13px] font-medium text-gray-600">限购数量 <span className="text-red-500">*</span></label>
                                <Stepper value={formData.limitQty} onChange={v => setFormData({...formData, limitQty: v})} />
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight">限制单个用户可购买该商品的数量，商品参加营销活动时，则以活动限购数量为准</p>
                        </div>
                    )}
                </div>

                <div className="h-px bg-gray-50"></div>

                {/* 分时段销售 */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-1 cursor-pointer" onClick={() => setShowTimeSalesEditor(true)}>
                        <label className="text-sm font-bold text-gray-700">分时段销售</label>
                        <div className="flex items-center text-sm text-gray-400 font-bold overflow-hidden">
                            <span className="truncate max-w-[140px]">{formData.timeSales ? `${formData.timeSales.startDate}-${formData.timeSales.endDate}` : '去设置'}</span>
                            <ChevronRight size={16} className="ml-1 flex-shrink-0"/>
                        </div>
                    </div>
                    {formData.timeSales && formData.timeSales.rules.map((rule, idx) => (
                        <div key={rule.id} className="bg-gray-50 rounded-xl p-4 flex justify-between items-center animate-in fade-in">
                            <div className="space-y-1">
                                <div className="text-[13px] font-bold text-gray-700">
                                    {rule.days.map(d => ['周一','周二','周三','周四','周五','周六','周日'][d-1]).join('、')}
                                </div>
                                <div className="flex flex-wrap gap-x-3 text-[11px] text-gray-500">
                                    {rule.times.map((t, tIdx) => <span key={tIdx}>{t}</span>)}
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setShowTimeSalesEditor(true); }} className="p-2 text-gray-300 hover:text-blue-500"><Edit2 size={16}/></button>
                        </div>
                    ))}
                </div>

                <div className="h-px bg-gray-50"></div>

                <div className="flex justify-between items-start pt-2">
                    <label className="text-sm font-bold text-gray-700 shrink-0 mt-1">售卖方式</label>
                    <div className="flex flex-col items-end space-y-3 flex-1">
                        <div className="flex space-x-6">
                            <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setFormData({...formData, salesMode: 'normal'})}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.salesMode === 'normal' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                    {formData.salesMode === 'normal' && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full animate-in zoom-in-50"></div>}
                                </div>
                                <span className="text-xs font-bold text-gray-600">正常售卖</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setFormData({...formData, salesMode: 'combo_only'})}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.salesMode === 'combo_only' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                    {formData.salesMode === 'combo_only' && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full animate-in zoom-in-50"></div>}
                                </div>
                                <span className="text-xs font-bold text-gray-600">仅在套餐售卖</span>
                            </label>
                        </div>
                        <p className="text-[10px] text-gray-400 text-right leading-tight">设置“仅在套餐中售卖”，则顾客在门店中看不见此商品</p>
                    </div>
                </div>

                <div className="h-px bg-gray-50"></div>

                {/* 外带设置 */}
                <div className="flex justify-between items-start pt-2">
                    <label className="text-sm font-bold text-gray-700 shrink-0 mt-1">外带设置</label>
                    <div className="flex flex-col items-end space-y-3 flex-1">
                        <div className="flex flex-wrap justify-end gap-x-4 gap-y-3">
                            <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setFormData({...formData, takeawayMode: 'normal'})}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.takeawayMode === 'normal' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                    {formData.takeawayMode === 'normal' && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full animate-in zoom-in-50"></div>}
                                </div>
                                <span className="text-xs font-bold text-gray-600">正常售卖</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setFormData({...formData, takeawayMode: 'hide'})}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.takeawayMode === 'hide' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                    {formData.takeawayMode === 'hide' && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full animate-in zoom-in-50"></div>}
                                </div>
                                <span className="text-xs font-bold text-gray-600">外带时隐藏</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setFormData({...formData, takeawayMode: 'only'})}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.takeawayMode === 'only' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                    {formData.takeawayMode === 'only' && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full animate-in zoom-in-50"></div>}
                                </div>
                                <span className="text-xs font-bold text-gray-600">仅外带显示</span>
                            </label>
                        </div>
                        <p className="text-[10px] text-gray-400 text-right leading-tight">配置商品在不同自提/外卖场景下的可见性规则</p>
                    </div>
                </div>

                <div className="space-y-4 py-2 border-t border-gray-50 mt-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">售卖设置</div>
                    <div className="space-y-5">
                        <div className="flex flex-col space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <div className="w-4 h-4 rounded border-2 border-[#00C06B] bg-[#00C06B] flex items-center justify-center">
                                    <Check size={12} className="text-white" strokeWidth={4}/>
                                </div>
                                <span className="text-sm font-bold text-gray-700">单点不送</span>
                            </label>
                            <p className="text-[10px] text-gray-400 leading-relaxed pl-6">开启后,外卖单点该商品无法下单,需配合其他商品才可下单,常常用于饮料等低价小件商品</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <div className="w-4 h-4 rounded border-2 border-[#00C06B] bg-[#00C06B] flex items-center justify-center">
                                    <Check size={12} className="text-white" strokeWidth={4}/>
                                </div>
                                <span className="text-sm font-bold text-gray-700">参与会员折扣</span>
                            </label>
                            <p className="text-[10px] text-gray-400 leading-relaxed pl-6">开启后,指该商品在下单时,是否享受会员卡折扣优惠。会员卡开启,该功能才会生效,若无会员卡,则不生效。</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 4. 展示信息 */}
        <div ref={sectionRefs.display} className="bg-white p-5 rounded-2xl shadow-sm space-y-8">
            <h3 className="font-black text-base text-gray-800">展示信息</h3>
            
            {/* 列表页展示 */}
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-800">列表页展示</span>
                    <span className="text-[10px] text-gray-400">配置同步至商品列表页</span>
                </div>
                <div className="py-2">
                    <label className="text-sm font-bold text-gray-700 block mb-3">商品封面</label>
                    <div className="w-24 h-14 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 mb-3 active:bg-gray-100 transition-colors">
                        <Plus size={20} />
                    </div>
                    <div className="text-[10px] text-gray-400 space-y-2 leading-relaxed">
                        <p>1、装修模版2、3中使用：建议尺寸：265*132.5PX，单张大小不超过300K <span className="text-[#00C06B] font-bold">查看示例</span></p>
                        <p>2、装修模版4中使用：建议尺寸：1:1，单张大小不超过300K <span className="text-[#00C06B] font-bold">查看示例</span></p>
                    </div>
                </div>
                <div className="flex justify-between items-center py-2">
                    <label className="text-sm font-bold text-gray-700">商品列表简述</label>
                    <input className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4" placeholder="请输入商品列表简述" />
                </div>
            </div>

            {/* 详情页展示 */}
            <div className="space-y-6 pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-800">详情页展示</span>
                    <span className="text-[10px] text-gray-400">配置展示在商品详情页</span>
                </div>
                <div 
                  className="flex justify-between items-center py-2 border-b border-gray-50 cursor-pointer active:bg-gray-50"
                  onClick={() => setShowAttributeSorter(true)}
                >
                    <label className="text-sm font-bold text-gray-700">商品属性排序</label>
                    <div className="flex items-center text-sm text-gray-400 font-bold">
                        <span>去设置</span>
                        <ChevronRight size={16} className="ml-1"/>
                    </div>
                </div>
                <div className="py-2 border-b border-gray-50 pb-6">
                    <label className="text-sm font-bold text-gray-700 block mb-3">商品详情图</label>
                    <div className="w-16 h-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 mb-4 active:bg-gray-100 transition-colors">
                        <Plus size={20} />
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                        建议尺寸：800*450PX，单张大小不超过1M。
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* 底部按钮 (固定悬浮) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 flex gap-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button className="flex-1 h-12 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 text-sm active:bg-gray-50 active:scale-95 transition-all">保存</button>
        <button className="flex-[1.5] h-12 bg-[#00C06B] text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 active:bg-[#00A35B] active:scale-[0.98] transition-all">保存并继续添加</button>
      </div>

      {/* 分时段销售编辑器 */}
      {showTimeSalesEditor && (
        <TimeSalesEditor 
          data={formData.timeSales} 
          onBack={() => setShowTimeSalesEditor(false)} 
          onSave={handleTimeSalesSave} 
        />
      )}

      {/* NEW: Category Selector */}
      <MobileCategorySelector 
        isOpen={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={handleCategorySelect}
        initialCategoryName={formData.category}
      />

      {/* NEW: Attribute Sorter */}
      {showAttributeSorter && (
        <MobileProductAttributeSorter 
          onBack={() => setShowAttributeSorter(false)}
          onSave={() => setShowAttributeSorter(false)}
        />
      )}

      {/* NEW: Channel Selector */}
      {showChannelSelector && (
        <MobileProductChannelSelector 
          selectedChannels={formData.channels}
          onBack={() => setShowChannelSelector(false)}
          onSave={handleChannelsSave}
        />
      )}
    </div>
  );
};

// --- 子组件: 分时段销售编辑器 ---
const TimeSalesEditor = ({ data, onBack, onSave }: { data: TimeSalesConfig | null, onBack: () => void, onSave: (config: TimeSalesConfig) => void }) => {
    const [config, setConfig] = useState<TimeSalesConfig>(data || {
        startDate: '2025年9月23日',
        endDate: '2025年10月23日',
        rules: [
            { id: '1', days: [1, 2, 3, 4, 5], times: ['00:00-23:59'] },
            { id: '2', days: [6, 7], times: ['00:00-23:59'] }
        ]
    });

    const toggleDay = (ruleId: string, day: number) => {
        setConfig(prev => ({
            ...prev,
            rules: prev.rules.map(r => {
                if (r.id !== ruleId) return r;
                return {
                    ...r,
                    days: r.days.includes(day) ? r.days.filter(d => d !== day) : [...r.days, day]
                };
            })
        }));
    };

    const addTimeRange = (ruleId: string) => {
        setConfig(prev => ({
            ...prev,
            rules: prev.rules.map(r => {
                if (r.id !== ruleId) return r;
                if (r.times.length >= 3) return r;
                return { ...r, times: [...r.times, '00:00-23:59'] };
            })
        }));
    };

    const removeTimeRange = (ruleId: string, idx: number) => {
        setConfig(prev => ({
            ...prev,
            rules: prev.rules.map(r => {
                if (r.id !== ruleId) return r;
                return { ...r, times: r.times.filter((_, i) => i !== idx) };
            })
        }));
    };

    const addRule = () => {
        if (config.rules.length >= 3) return;
        setConfig(prev => ({
            ...prev,
            rules: [...prev.rules, { id: Date.now().toString(), days: [], times: ['00:00-23:59'] }]
        }));
    };

    const removeRule = (ruleId: string) => {
        setConfig(prev => ({
            ...prev,
            rules: prev.rules.filter(r => r.id !== ruleId)
        }));
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-bottom duration-300">
            <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24}/></button>
                <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">分时段售卖</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32">
                <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                    <div>
                        <h4 className="text-base font-black text-gray-800">销售日期</h4>
                        <p className="text-[10px] text-gray-400 mt-1">日期可为空，为空表示不限制商品售卖日期</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-100">{config.startDate}</div>
                        <span className="text-gray-300">-</span>
                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-100">{config.endDate}</div>
                    </div>
                </div>

                {config.rules.map((rule, ruleIdx) => (
                    <div key={rule.id} className="bg-white rounded-2xl p-5 shadow-sm space-y-6 relative">
                        <div className="flex justify-between items-center">
                            <h4 className="text-base font-black text-gray-800">每周销售时间</h4>
                            {config.rules.length > 1 && (
                                <button onClick={() => removeRule(rule.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {[1,2,3,4,5,6,7].map(d => {
                                const isActive = rule.days.includes(d);
                                return (
                                    <button 
                                        key={d}
                                        onClick={() => toggleDay(rule.id, d)}
                                        className={`py-2.5 rounded-lg text-xs font-bold transition-all border relative ${isActive ? 'bg-[#E6F8F0] text-[#00C06B] border-[#00C06B]' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                                    >
                                        {['周一','周二','周三','周四','周五','周六','周日'][d-1]}
                                        {isActive && <div className="absolute top-0 right-0 w-2 h-2 bg-[#00C06B] rounded-bl-sm"><Check size={8} className="text-white"/></div>}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-3">
                            {rule.times.map((time, tIdx) => (
                                <div key={tIdx} className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                    <span className="flex-1 text-sm font-bold text-gray-700">{time}</span>
                                    {rule.times.length > 1 && (
                                        <button onClick={() => removeTimeRange(rule.id, tIdx)} className="p-1 text-gray-400"><Trash2 size={16}/></button>
                                    )}
                                </div>
                            ))}
                            {rule.times.length < 3 && (
                                <button 
                                    onClick={() => addTimeRange(rule.id)}
                                    className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[#00C06B] text-xs font-black flex items-center justify-center active:bg-green-50 transition-colors"
                                >
                                    <Plus size={14} className="mr-1"/> 添加时间段 ({rule.times.length}/3)
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {config.rules.length < 3 && (
                    <button 
                        onClick={addRule}
                        className="w-full py-4 flex items-center justify-center space-x-1 text-[#00C06B] text-sm font-black"
                    >
                        <Plus size={18}/>
                        <span>添加销售时间 ({config.rules.length}/3)</span>
                    </button>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-white border-t border-gray-100 shadow-lg">
                <button onClick={() => onSave(config)} className="w-full h-12 bg-[#00C06B] text-white rounded-xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all">保存</button>
            </div>
        </div>
    );
};

const SwitchRow = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <div 
        onClick={onClick}
        className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${active ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
    >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'left-6' : 'left-1'}`}></div>
    </div>
);

const Stepper = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
        <button 
            onClick={() => onChange(Math.max(0, value - 1))}
            className="px-3 py-1.5 bg-white border-r border-gray-100 active:bg-gray-50 text-gray-400"
        ><Minus size={16}/></button>
        <div className="w-16 h-8 flex items-center justify-center font-bold text-sm text-[#1F2129]">{value}</div>
        <button 
            onClick={() => onChange(value + 1)}
            className="px-3 py-1.5 bg-white border-l border-gray-100 active:bg-gray-50 text-gray-400"
        ><Plus size={16}/></button>
    </div>
);
