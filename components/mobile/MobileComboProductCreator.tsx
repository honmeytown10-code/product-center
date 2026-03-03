
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, Plus, X, ImageIcon, ChevronRight, Check, 
  Trash2, Box, Info, Settings, GripVertical, Coffee, List,
  Smartphone, Printer, Store, ShoppingBag, ArrowUp, ArrowDown,
  Circle, CheckCircle2, Video, Minus, Edit2, Search
} from 'lucide-react';
import { Category, Product, INITIAL_PRODUCTS, CATEGORIES, INITIAL_CATEGORIES } from '../../types';
import { MobileCategorySelector } from './MobileCategorySelector';
import { MobileProductChannelSelector } from './MobileProductChannelSelector';

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

interface Props {
  onBack: () => void;
  categories: Category[];
  categoryName?: string;
}

type TabType = 'basic' | 'content' | 'sales' | 'display';

export const MobileComboProductCreator: React.FC<Props> = ({ onBack, categoryName }) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [showGroupEditor, setShowGroupEditor] = useState(false);
  const [showTimeSalesEditor, setShowTimeSalesEditor] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showChannelSelector, setShowChannelSelector] = useState(false);
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  
  // New state for fixed item selector
  const [showFixedItemSelector, setShowFixedItemSelector] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = {
    basic: useRef<HTMLDivElement>(null),
    content: useRef<HTMLDivElement>(null),
    sales: useRef<HTMLDivElement>(null),
    display: useRef<HTMLDivElement>(null),
  };

  const [formData, setFormData] = useState({
    name: '',
    category: categoryName || '通用套餐',
    images: [] as string[],
    channels: ['mini', 'pos', 'mini_dine', 'mini_take'],
    remark: '',
    specType: 'single', // 'single' | 'multi'
    basePrice: '',
    stock: '',
    pricingType: 'markup', // 'markup' (销售加价) | 'combined' (合并计价)
    fixedItems: [] as any[],
    optionalGroups: [] as any[],
    salesSettings: ['member_discount', 'no_single_delivery'],
    salesMode: 'normal',
    takeawayMode: 'normal',
    // Purchase Limit State
    startQtyEnabled: false,
    startQty: 1,
    limitQtyEnabled: false,
    limitQty: 1,
    limitType: 'per_order',
    // Time Sales State
    timeSales: null as TimeSalesConfig | null,
  });

  const tabs: { id: TabType; label: string }[] = [
    { id: 'basic', label: '基础信息' },
    { id: 'content', label: '套餐内容' },
    { id: 'sales', label: '销售属性' },
    { id: 'display', label: '展示信息' },
  ];

  // Scroll-spy logic
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
        const scrollPos = container.scrollTop + 100;
        let current: TabType = 'basic';
        if (sectionRefs.display.current && scrollPos >= sectionRefs.display.current.offsetTop) current = 'display';
        else if (sectionRefs.sales.current && scrollPos >= sectionRefs.sales.current.offsetTop) current = 'sales';
        else if (sectionRefs.content.current && scrollPos >= sectionRefs.content.current.offsetTop) current = 'content';
        setActiveTab(current);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: TabType) => {
    const target = sectionRefs[id].current;
    if (target && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: target.offsetTop - 60, behavior: 'smooth' });
    }
  };

  const handleSaveGroup = (groupData: any) => {
    const newGroups = [...formData.optionalGroups];
    if (editingGroupIndex !== null) newGroups[editingGroupIndex] = groupData;
    else newGroups.push(groupData);
    setFormData({ ...formData, optionalGroups: newGroups });
    setShowGroupEditor(false);
    setEditingGroupIndex(null);
  };

  const handleDeleteGroup = (index: number) => {
      if (confirm('确认删除此可选分组吗？')) {
          const newGroups = [...formData.optionalGroups];
          newGroups.splice(index, 1);
          setFormData({ ...formData, optionalGroups: newGroups });
      }
  };

  const handleFixedItemsSelect = (selectedProducts: Product[]) => {
      const newItems = selectedProducts.map(p => ({
          id: p.id, // In real app, generate unique item ID
          productId: p.id,
          name: p.name,
          spec: '标准', // Default spec
          quantity: 1,
          image: p.image
      }));
      // Append new items, filtering out existing ones to avoid duplicates if needed
      // Or allow duplicates? Usually unique per combo item line.
      const existingIds = new Set(formData.fixedItems.map(i => i.productId));
      const filteredNew = newItems.filter(i => !existingIds.has(i.productId));
      
      setFormData({ 
          ...formData, 
          fixedItems: [...formData.fixedItems, ...filteredNew] 
      });
      setShowFixedItemSelector(false);
  };

  const removeFixedItem = (index: number) => {
      const newItems = [...formData.fixedItems];
      newItems.splice(index, 1);
      setFormData({ ...formData, fixedItems: newItems });
  };

  const updateFixedItemQty = (index: number, delta: number) => {
      const newItems = [...formData.fixedItems];
      const newQty = Math.max(1, newItems[index].quantity + delta);
      newItems[index].quantity = newQty;
      setFormData({ ...formData, fixedItems: newItems });
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
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">创建套餐商品</span>
      </div>

      {/* Tabs */}
      <div className="bg-white px-2 border-b border-gray-100 shrink-0 z-20 flex overflow-x-auto no-scrollbar shadow-sm">
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => scrollTo(tab.id)} className={`relative px-4 py-3 text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.id ? 'text-[#00C06B]' : 'text-gray-500'}`}>
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#00C06B] rounded-full animate-in fade-in slide-in-from-bottom-1"></div>}
          </div>
        ))}
      </div>

      {/* Main Form */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-40 scroll-smooth">
        
        {/* 1. 基础信息 */}
        <div ref={sectionRefs.basic} className="bg-white p-5 rounded-2xl shadow-sm space-y-5">
            <h3 className="font-black text-base text-gray-800">基础信息</h3>
            <FormRow label="套餐名称" required placeholder="请输入套餐名称" value={formData.name} onChange={v => setFormData({...formData, name: v})}/>
            
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

            {/* 基础价格 moved to Basic Info */}
            <div className="flex justify-between items-center py-2 border-b border-gray-50 animate-in fade-in">
                <label className="text-sm font-bold text-gray-700">基础价格 <span className="text-red-500">*</span></label>
                <div className="flex items-center space-x-2 w-full max-w-[50%] justify-end">
                    <input className="text-right text-sm font-bold outline-none placeholder-gray-300 flex-1 w-full" placeholder="请输入" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} />
                </div>
            </div>

            <div className="py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700 block mb-2">商品主图 <span className="text-red-500">*</span></label>
                <div className="w-16 h-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 mb-3 active:bg-gray-100 transition-colors"><Plus size={20} /></div>
                <p className="text-[10px] text-gray-400 leading-relaxed">建议尺寸：1:1，单张大小不超过300K最多可上传10张;可以拖拽调整图片顺序。</p>
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

            {/* 库存 moved to Basic Info */}
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

            <FormRow label="备注" placeholder="请输入商品备注" value={formData.remark} onChange={v => setFormData({...formData, remark: v})}/>
        </div>

        {/* 2. 套餐商品内容 */}
        <div ref={sectionRefs.content} className="bg-white p-5 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-black text-base text-gray-800">套餐商品信息</h3>
            <div className="space-y-4">
                <label className="text-sm font-bold text-gray-700 block">套餐计价类型 <span className="text-red-500">*</span></label>
                <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50" onClick={() => setFormData({...formData, pricingType: 'markup'})}>
                        <div className="flex items-center space-x-2 mb-1">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.pricingType === 'markup' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                {formData.pricingType === 'markup' && <div className="w-2 h-2 bg-[#00C06B] rounded-full"></div>}
                            </div>
                            <span className="text-sm font-bold text-gray-700">销售加价</span>
                        </div>
                        <p className="text-[10px] text-gray-400 pl-6 leading-relaxed">套餐基础价格为基本费用,总价根据随心配商品加价波动</p>
                    </div>
                    <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50" onClick={() => setFormData({...formData, pricingType: 'combined'})}>
                        <div className="flex items-center space-x-2 mb-1">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.pricingType === 'combined' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                {formData.pricingType === 'combined' && <div className="w-2 h-2 bg-[#00C06B] rounded-full"></div>}
                            </div>
                            <span className="text-sm font-bold text-gray-700">合并计价</span>
                        </div>
                        <p className="text-[10px] text-gray-400 pl-6 leading-relaxed">套餐内所有商品独立收费,总价根据用户选择商品合并计价</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <label className="text-sm font-bold text-gray-700 block">套餐商品配置 <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                    {/* Fixed Items Section */}
                    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <div className="flex items-center">
                                <Box size={18} className="text-[#00C06B] mr-2"/>
                                <span className="text-sm font-bold text-gray-700">固定搭配</span>
                            </div>
                            <button 
                                onClick={() => setShowFixedItemSelector(true)} 
                                className="flex items-center text-xs text-[#00C06B] font-bold bg-white px-2 py-1 rounded-lg shadow-sm active:scale-95 transition-transform"
                            >
                                <Plus size={12} className="mr-1"/>添加
                            </button>
                        </div>
                        <div className="p-2 space-y-2">
                            {formData.fixedItems.length === 0 ? (
                                <div className="py-4 text-center text-gray-400 text-xs">暂无固定搭配商品</div>
                            ) : (
                                formData.fixedItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-50 shadow-sm animate-in zoom-in-95">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 mr-3 flex-shrink-0 overflow-hidden">
                                                <img src={item.image} className="w-full h-full object-cover" alt=""/>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-800">{item.name}</div>
                                                <div className="text-[10px] text-gray-400">{item.spec}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Stepper value={item.quantity} onChange={v => updateFixedItemQty(idx, v - item.quantity)} />
                                            <button onClick={() => removeFixedItem(idx)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Optional Groups Section */}
                    <div className="space-y-2">
                        {formData.optionalGroups.map((group, idx) => (
                             <div 
                                key={idx} 
                                className="bg-gray-50 rounded-xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in"
                             >
                                <div 
                                    className="flex justify-between items-center p-4 cursor-pointer active:bg-gray-100"
                                    onClick={() => { setEditingGroupIndex(idx); setShowGroupEditor(true); }}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-700">{group.name}</span>
                                        <span className="text-[10px] text-gray-400">{group.isRequired ? '必选' : '可选'} | {group.minSelect} 选 {group.maxSelect} | {group.items.length}个商品</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(idx); }}
                                            className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                        <ChevronRight size={16} className="text-gray-300"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={() => { setEditingGroupIndex(null); setShowGroupEditor(true); }}
                            className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[#00C06B] text-xs font-black flex items-center justify-center active:bg-green-50 transition-colors"
                        >
                            <Plus size={14} className="mr-1"/> 添加可选分组
                        </button>
                    </div>
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

                <div className="space-y-4 py-2 border-t border-gray-50 mt-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-700">外带设置</label>
                        <div className="flex flex-wrap gap-4">
                            <RadioOption label="正常售卖" active={true} />
                            <RadioOption label="外带时隐藏" active={false} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 4. 展示信息 */}
        <div ref={sectionRefs.display} className="bg-white p-5 rounded-2xl shadow-sm space-y-8">
            <h3 className="font-black text-base text-gray-800">展示信息</h3>
            <div className="space-y-5">
                <SectionSubHeader title="列表页展示" subtitle="配置同步至商品列表页" />
                <div className="py-2">
                    <label className="text-sm font-bold text-gray-700 block mb-3">商品封面</label>
                    <div className="w-24 h-14 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 mb-3 active:bg-gray-100 transition-colors"><Plus size={20} /></div>
                    <div className="text-[10px] text-gray-400 space-y-1.5 leading-relaxed">
                        <p>1、装修模版2、3中使用：建议尺寸：265*132.5PX，单张大小不超过300K <span className="text-[#00C06B] font-bold">查看示例</span></p>
                        <p>2、装修模版4中使用：建议尺寸：1:1，单张大小不超过300K <span className="text-[#00C06B] font-bold">查看示例</span></p>
                    </div>
                </div>
                <FormRow label="商品列表简述" placeholder="请输入商品列表简述" />
            </div>

            <div className="space-y-6 pt-6 border-t border-gray-50">
                <SectionSubHeader title="详情页展示" subtitle="配置展示在商品详情页" />
                <div className="py-2 border-b border-gray-50 pb-6">
                    <label className="text-sm font-bold text-gray-700 block mb-3">商品详情图</label>
                    <div className="w-16 h-16 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 mb-4 active:bg-gray-100 transition-colors"><Plus size={20} /></div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">建议尺寸：800*450PX，单张大小不超过1M，详情图展示在小程序商品选择详情页，最多可上传10张。</p>
                </div>
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 flex gap-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button className="flex-1 h-12 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 text-sm active:bg-gray-50 active:scale-95 transition-all">保存</button>
        <button className="flex-[1.5] h-12 bg-[#00C06B] text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 active:bg-[#00A35B] active:scale-[0.98] transition-all">保存并继续添加</button>
      </div>

      {/* 可选分组编辑器 */}
      {showGroupEditor && (
        <ComboGroupEditor 
          item={editingGroupIndex !== null ? formData.optionalGroups[editingGroupIndex] : null}
          onBack={() => setShowGroupEditor(false)}
          onSave={handleSaveGroup}
        />
      )}

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

      {/* NEW: Channel Selector */}
      {showChannelSelector && (
        <MobileProductChannelSelector 
          selectedChannels={formData.channels}
          onBack={() => setShowChannelSelector(false)}
          onSave={handleChannelsSave}
        />
      )}

      {/* NEW: Fixed Item Product Selector */}
      <ProductSelectorModal
        isOpen={showFixedItemSelector}
        onClose={() => setShowFixedItemSelector(false)}
        onSelect={handleFixedItemsSelect}
      />
    </div>
  );
};

// ... Internal Form Helper Components ...

const ComboGroupEditor = ({ item, onBack, onSave }: { item: any, onBack: () => void, onSave: (data: any) => void }) => {
    const [groupData, setGroupData] = useState(item || {
        name: '',
        code: '',
        isRelative: false,
        remark: '',
        rule: 'pick_n', 
        minSelect: 1,
        maxSelect: 1,
        items: [] as any[]
    });
    
    const [showProductSelector, setShowProductSelector] = useState(false);

    const handleAddItems = (products: Product[]) => {
        const newItems = products.map(p => ({
            id: `ci_new_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            productId: p.id,
            name: p.name,
            spec: '标准', // Mock default spec
            code: p.skuCode,
            quantity: 1,
            isDefault: false,
            markup: '0',
            channels: ['pos', 'mini'] // Mock default channels
        }));
        
        setGroupData({ ...groupData, items: [...groupData.items, ...newItems] });
        setShowProductSelector(false);
    };

    const toggleDefault = (id: string) => {
        const newItems = groupData.items.map((i: any) => ({ ...i, isDefault: i.id === id ? !i.isDefault : (groupData.maxSelect === 1 ? false : i.isDefault) }));
        setGroupData({ ...groupData, items: newItems });
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-bottom duration-300">
            <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 shadow-sm">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24}/></button>
                <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">{item ? '编辑可选分组' : '新建可选分组'}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
                <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
                    <FormRow label="分组名称" required placeholder="例如：主食区" value={groupData.name} onChange={v => setGroupData({...groupData, name: v})}/>
                    <FormRow label="分组编码" placeholder="选填" value={groupData.code} onChange={v => setGroupData({...groupData, code: v})}/>
                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <div>
                            <div className="text-sm font-bold text-gray-700">相对价</div>
                            <p className="text-[10px] text-gray-400 mt-1">开启后，用户点单时该随心配会以默认子商品的加价为基础，其他子商品的加价将按基础价计算</p>
                        </div>
                        <SwitchRow active={groupData.isRelative} onClick={() => setGroupData({...groupData, isRelative: !groupData.isRelative})} />
                    </div>
                    <FormRow label="备注" placeholder="请输入分组备注" value={groupData.remark} onChange={v => setGroupData({...groupData, remark: v})}/>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h4 className="text-sm font-black text-gray-800 flex items-center"><span className="text-red-500 mr-1">*</span> 商品信息</h4>
                        <button onClick={() => setShowProductSelector(true)} className="text-[#00C06B] text-[13px] font-bold flex items-center bg-green-50 px-3 py-1.5 rounded-full"><Plus size={14} className="mr-1"/> 添加商品</button>
                    </div>
                    {groupData.items.length === 0 ? (
                        <div className="py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
                            <Box size={32} className="opacity-10 mb-2"/>
                            <span className="text-xs font-bold">暂无子商品数据</span>
                        </div>
                    ) : (
                        groupData.items.map((it: any, idx: number) => (
                            <div key={it.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 relative animate-in zoom-in-95">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 mr-3 border border-gray-100"><Coffee size={20}/></div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">{it.name}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">规格：{it.spec} | 渠道：{it.channels.length}个</div>
                                        </div>
                                    </div>
                                    <Trash2 size={16} className="text-gray-300" onClick={() => setGroupData({...groupData, items: groupData.items.filter((_:any, i:number) => i !== idx)})}/>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                                    <div>
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">数量</label>
                                        <Stepper value={it.quantity} onChange={v => {
                                            const next = [...groupData.items];
                                            next[idx] = {...next[idx], quantity: v};
                                            setGroupData({...groupData, items: next});
                                        }} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 font-bold block mb-1">加价 (元)</label>
                                        <input className="w-full bg-gray-50 rounded-lg border border-gray-100 px-3 py-1.5 text-xs font-bold outline-none focus:border-[#00C06B]" value={it.markup} onChange={(e) => {
                                            const next = [...groupData.items];
                                            next[idx] = {...next[idx], markup: e.target.value};
                                            setGroupData({...groupData, items: next});
                                        }}/>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end mt-3">
                                    <div onClick={() => toggleDefault(it.id)} className="flex items-center space-x-2 cursor-pointer">
                                        <span className="text-[11px] font-bold text-gray-500">是否默认</span>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${it.isDefault ? 'bg-[#00C06B]' : 'bg-white border-gray-200'}`}>
                                            {it.isDefault && <Check size={14} className="text-white" strokeWidth={4}/>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm space-y-6">
                    <h4 className="text-sm font-black text-gray-800 flex items-center"><span className="text-red-500 mr-1">*</span> 分组设置</h4>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setGroupData({...groupData, rule: 'pick_n'})}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${groupData.rule === 'pick_n' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                    {groupData.rule === 'pick_n' && <div className="w-3 h-3 bg-[#00C06B] rounded-full"></div>}
                                </div>
                                <span className={`text-[13px] font-bold ${groupData.rule === 'pick_n' ? 'text-gray-800' : 'text-gray-400'}`}>随心配几选几</span>
                            </label>
                            <span className="text-[11px] text-[#00C06B] font-bold">查看示例</span>
                        </div>
                        {groupData.rule === 'pick_n' && (
                            <div className="pl-7 pb-4">
                                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="text-xs text-gray-500 font-bold">分组内商品必须选择</span>
                                    <input className="w-12 h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-black outline-none" value={groupData.minSelect} onChange={e => setGroupData({...groupData, minSelect: Number(e.target.value)})}/>
                                    <span className="text-xs text-gray-500 font-bold">件商品</span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setGroupData({...groupData, rule: 'optional'})}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${groupData.rule === 'optional' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                    {groupData.rule === 'optional' && <div className="w-3 h-3 bg-[#00C06B] rounded-full"></div>}
                                </div>
                                <span className={`text-[13px] font-bold ${groupData.rule === 'optional' ? 'text-gray-800' : 'text-gray-400'}`}>随心配为可选</span>
                            </label>
                            <span className="text-[11px] text-[#00C06B] font-bold">查看示例</span>
                        </div>
                        {groupData.rule === 'optional' && (
                            <div className="pl-7 space-y-3">
                                <p className="text-[10px] text-gray-400">单个商品可多选，限制分组内商品</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 flex items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                        <span className="text-[10px] text-gray-400 mr-2">最少</span>
                                        <input className="w-full text-center bg-transparent text-sm font-black outline-none" value={groupData.minSelect} onChange={e => setGroupData({...groupData, minSelect: Number(e.target.value)})}/>
                                    </div>
                                    <span className="text-gray-300">-</span>
                                    <div className="flex-1 flex items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                        <span className="text-[10px] text-gray-400 mr-2">最多</span>
                                        <input className="w-full text-center bg-transparent text-sm font-black outline-none" value={groupData.maxSelect} onChange={e => setGroupData({...groupData, maxSelect: Number(e.target.value)})}/>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-white border-t border-gray-100 shadow-lg">
                <button onClick={() => onSave(groupData)} className="w-full h-12 bg-[#1F2129] text-white rounded-xl font-bold shadow-xl shadow-gray-200 active:scale-95 transition-all">保存分组</button>
            </div>

            <ProductSelectorModal
                isOpen={showProductSelector}
                onClose={() => setShowProductSelector(false)}
                onSelect={handleAddItems}
            />
        </div>
    );
};

// --- Product Selector Modal ---
const ProductSelectorModal = ({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (products: Product[]) => void }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]); // Default to first category '全部'

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleConfirm = () => {
        const selectedProducts = INITIAL_PRODUCTS.filter(p => selectedIds.has(p.id));
        onSelect(selectedProducts);
    };

    // Filter Logic
    const displayedProducts = useMemo(() => {
        return INITIAL_PRODUCTS.filter(p => {
            // Search Filter
            if (searchTerm && !p.name.includes(searchTerm)) return false;
            
            // Category Filter
            if (activeCategory === '全部') return true;
            
            // Resolve Category Name to ID
            const catObj = INITIAL_CATEGORIES.find(c => c.name === activeCategory);
            if (!catObj) return false;
            
            // Check direct match or children
            if (p.category === catObj.id) return true;
            if (catObj.children?.some(child => child.id === p.category)) return true;
            
            return false;
        });
    }, [searchTerm, activeCategory]);

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[150] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
            <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 shadow-sm relative z-10">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24}/></button>
                <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">选择商品</span>
            </div>
            
            <div className="p-3 bg-white shrink-0 border-b border-gray-50">
                <div className="bg-gray-100 rounded-xl flex items-center px-3 py-2">
                    <Search size={16} className="text-gray-400 mr-2"/>
                    <input 
                        className="bg-transparent text-sm outline-none flex-1 font-bold" 
                        placeholder="搜索商品名称"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Categories */}
                <div className="w-24 bg-[#F8FAFB] overflow-y-auto no-scrollbar pb-20 border-r border-gray-100 shrink-0">
                    {CATEGORIES.map(cat => (
                        <div 
                            key={cat} 
                            onClick={() => setActiveCategory(cat)}
                            className={`px-2 py-4 text-[11px] text-center font-bold border-l-4 transition-all relative cursor-pointer ${activeCategory === cat ? 'bg-white text-[#00C06B] border-[#00C06B]' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
                        >
                            {cat}
                        </div>
                    ))}
                </div>

                {/* Right Content: Product List */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 bg-white">
                    {displayedProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <span className="text-xs">该分类下暂无商品</span>
                        </div>
                    ) : (
                        displayedProducts.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => toggleSelection(p.id)}
                                className={`bg-white p-3 rounded-xl flex items-center space-x-3 border transition-all cursor-pointer ${selectedIds.has(p.id) ? 'border-[#00C06B] bg-green-50/20' : 'border-gray-100'}`}
                            >
                                <div className="relative w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                    <img src={p.image} className="w-full h-full object-cover" alt=""/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-gray-800">{p.name}</div>
                                    <div className="text-xs text-gray-400">¥{p.price}</div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(p.id) ? 'bg-[#00C06B] border-[#00C06B]' : 'border-gray-300 bg-white'}`}>
                                    {selectedIds.has(p.id) && <Check size={12} className="text-white"/>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="p-4 pb-8 bg-white border-t border-gray-100 shadow-lg shrink-0">
                <button onClick={handleConfirm} disabled={selectedIds.size === 0} className={`w-full h-12 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center transition-all ${selectedIds.size > 0 ? 'bg-[#00C06B] text-white active:scale-[0.98]' : 'bg-gray-200 text-gray-400'}`}>
                    确认选择 ({selectedIds.size})
                </button>
            </div>
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

const FormRow = ({ label, required, placeholder, value, onChange }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50">
        <label className="text-sm font-bold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
        <input 
            className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4" 
            placeholder={placeholder} 
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

const RadioOption = ({ label, active, onClick }: any) => (
    <label className="flex items-center space-x-2 cursor-pointer" onClick={onClick}>
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-[#00C06B]' : 'border-gray-300'}`}>
            {active && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full animate-in zoom-in-50"></div>}
        </div>
        <span className="text-xs font-bold text-gray-600">{label}</span>
    </label>
);

const CheckboxSetting = ({ label, desc, checked }: any) => (
    <div className="flex flex-col space-y-2">
        <label className="flex items-center space-x-2 cursor-pointer">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked ? 'bg-[#00C06B] border-[#00C06B]' : 'border-gray-300'}`}>
                {checked && <Check size={12} className="text-white" strokeWidth={4}/>}
            </div>
            <span className="text-sm font-bold text-gray-700">{label}</span>
        </label>
        <p className="text-[10px] text-gray-400 leading-relaxed pl-6">{desc}</p>
    </div>
);

const SectionSubHeader = ({ title, subtitle }: any) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-black text-gray-800">{title}</span>
        <span className="text-[10px] text-gray-400">{subtitle}</span>
    </div>
);

// --- 子组件: 开关 ---
const SwitchRow = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <div 
        onClick={onClick}
        className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${active ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
    >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'left-6' : 'left-1'}`}></div>
    </div>
);

// --- 子组件: 步进器 ---
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
