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
import { MobileBadgeItem, MobileLabelGroup, VisualStyleType } from './productMeta';

interface Props {
  onBack: () => void;
  categories: Category[];
  productType?: 'standard' | 'combo';
  mode?: 'create' | 'edit';
  title?: string;
  hideSecondaryAction?: boolean;
  primaryActionText?: string;
  secondaryActionText?: string;
  lockSpecEdit?: boolean;
  lockStockEdit?: boolean;
  showEffectiveChannels?: boolean;
  channelSelectorHelperText?: string;
  categoryName?: string;
  saveMode?: 'default' | 'ai_confirm';
  onSaveDraft?: (data: { name: string; basePrice: string; category: string }) => void;
  onPrimaryAction?: (data: {
    name: string;
    category: string;
    basePrice: string;
    channels: string[];
    detailContent: string;
    selectedLabelIds: string[];
    selectedBadgeId: string;
    badgeStartDate: string;
    badgeEndDate: string;
    listDesc: string;
    specItems: { name: string; price: string }[];
  }) => void;
  labelGroups: MobileLabelGroup[];
  badges: MobileBadgeItem[];
  onLabelGroupsChange: (groups: MobileLabelGroup[]) => void;
  onBadgesChange: (badges: MobileBadgeItem[]) => void;
  initialData?: {
    name?: string;
    basePrice?: string;
    stock?: string;
    category?: string;
    sourceMode?: 'scan' | 'voice';
    sourceLabel?: string;
    sourceHint?: string;
    channels?: string[];
    specType?: 'single' | 'multi';
    listDesc?: string;
    detailContent?: string;
    selectedLabelIds?: string[];
    selectedBadgeId?: string;
    badgeStartDate?: string;
    badgeEndDate?: string;
    specItems?: { name: string; price: string }[];
  };
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

export const MobileStandardProductCreator: React.FC<Props> = ({
  onBack,
  categoryName,
  initialData,
  saveMode = 'default',
  onSaveDraft,
  onPrimaryAction,
  labelGroups,
  badges,
  onLabelGroupsChange,
  onBadgesChange,
  productType = 'standard',
  mode = 'create',
  title,
  hideSecondaryAction = false,
  primaryActionText,
  secondaryActionText,
  lockSpecEdit = false,
  lockStockEdit = false,
  showEffectiveChannels = false,
  channelSelectorHelperText,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [showTimeSalesEditor, setShowTimeSalesEditor] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showAttributeSorter, setShowAttributeSorter] = useState(false);
  const [showChannelSelector, setShowChannelSelector] = useState(false);
  const [showLabelSheet, setShowLabelSheet] = useState(false);
  const [showBadgeSheet, setShowBadgeSheet] = useState(false);
  const [quickCreator, setQuickCreator] = useState<null | {
    mode: 'group' | 'label' | 'badge';
    name: string;
    groupId?: string;
    styleType: VisualStyleType;
    backgroundColor: string;
    textColor: string;
    imageName?: string;
    startDate: string;
    endDate: string;
  }>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const sectionRefs = {
    basic: useRef<HTMLDivElement>(null),
    attr: useRef<HTMLDivElement>(null),
    sales: useRef<HTMLDivElement>(null),
    display: useRef<HTMLDivElement>(null),
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || categoryName || '通用菜品',
    channels: initialData?.channels || ['mini', 'pos', 'mini_dine', 'mini_take'],
    specType: initialData?.specType || 'single', // 'single' | 'multi'
    basePrice: initialData?.basePrice || '',
    stock: initialData?.stock || '',
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
    detailContent: initialData?.detailContent || '',
    listDesc: initialData?.listDesc || '',
    selectedLabelIds: initialData?.selectedLabelIds || [] as string[],
    selectedBadgeId: initialData?.selectedBadgeId || '',
    badgeStartDate: initialData?.badgeStartDate || '',
    badgeEndDate: initialData?.badgeEndDate || '',
    specItems: initialData?.specItems || [] as { name: string; price: string }[],
  });

  const flatLabels = labelGroups.flatMap(group => group.items.map(item => ({ ...item, groupId: group.id, groupName: group.name })));
  const selectedLabels = flatLabels.filter(item => formData.selectedLabelIds.includes(item.id));
  const selectedBadge = badges.find(item => item.id === formData.selectedBadgeId) || null;

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
    <div className="flex-1 min-h-0 flex flex-col bg-[#F5F6FA] h-full relative overflow-hidden font-sans select-none animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 z-30">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24} /></button>
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">{title || (saveMode === 'ai_confirm' ? '编辑商品' : mode === 'edit' ? '编辑商品' : '创建标准商品')}</span>
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
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-40 scroll-smooth">
        
        {/* 1. 基本信息 */}
        <div ref={sectionRefs.basic} className="bg-white p-5 rounded-2xl shadow-sm space-y-5">
            <h3 className="font-black text-base text-gray-800">基本信息</h3>
            {initialData?.sourceMode && (
                <div className={`rounded-2xl border px-4 py-3 ${initialData.sourceMode === 'voice' ? 'border-purple-100 bg-purple-50/70' : 'border-blue-100 bg-blue-50/70'}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className={`text-sm font-black ${initialData.sourceMode === 'voice' ? 'text-purple-700' : 'text-blue-700'}`}>
                                已通过{initialData.sourceLabel || (initialData.sourceMode === 'voice' ? '语音录入' : '拍照识别')}预填基础信息
                            </div>
                            <div className="mt-1 text-[11px] leading-5 text-gray-500">
                                {initialData.sourceHint || '系统已为您预填商品名称和基础售价，规格、做法、加料等复杂信息请继续补充。'}
                            </div>
                        </div>
                        <div className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-bold ${initialData.sourceMode === 'voice' ? 'bg-white text-purple-600' : 'bg-white text-blue-600'}`}>
                            AI 预填
                        </div>
                    </div>
                </div>
            )}
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
                {lockSpecEdit ? null : (
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
                )}
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
                    {!lockStockEdit && (
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
                    )}
                </>
            ) : (
                <div className="space-y-3 border-b border-gray-50 pb-4 animate-in fade-in">
                    <div className="flex justify-between items-center py-2">
                        <label className="text-sm font-bold text-gray-700">规格设置 <span className="text-red-500">*</span></label>
                        {lockSpecEdit ? null : (
                          <div className="flex items-center text-sm text-gray-400 font-bold">
                              <span>去选择</span>
                              <ChevronRight size={16} className="ml-1"/>
                          </div>
                        )}
                    </div>
                    {lockSpecEdit && formData.specItems.length > 0 ? (
                      <div className="space-y-2">
                        {formData.specItems.map((item, index) => (
                          <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-[#F7F9FC] px-3 py-3">
                            <div className="min-w-0 pr-3">
                              <div className="truncate text-[13px] font-bold text-[#1F2129]">{item.name}</div>
                            </div>
                            <div className="flex items-center rounded-xl bg-white px-3 py-2 shadow-sm">
                              <span className="mr-1 text-sm font-black text-[#1F2129]">¥</span>
                              <input
                                value={item.price}
                                onChange={e => setFormData(prev => ({
                                  ...prev,
                                  specItems: prev.specItems.map((spec, specIndex) => specIndex === index ? { ...spec, price: e.target.value } : spec),
                                }))}
                                className="w-16 bg-transparent text-right text-sm font-black text-[#1F2129] outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
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
                    <span className="text-sm font-black text-gray-800">列表展示</span>
                </div>
                <div className="py-2">
                    <label className="text-sm font-bold text-gray-700 block mb-3">商品封面</label>
                    <div className="w-24 h-14 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 mb-3 active:bg-gray-100 transition-colors">
                        <Plus size={20} />
                    </div>
                    <div className="text-[10px] text-gray-400">建议上传清晰封面图。</div>
                </div>
                <div className="flex justify-between items-center py-2">
                    <label className="text-sm font-bold text-gray-700">商品列表简述</label>
                    <input
                      className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4"
                      placeholder="请输入商品列表简述"
                      value={formData.listDesc}
                      onChange={e => setFormData({ ...formData, listDesc: e.target.value })}
                    />
                </div>
                <div
                  className="flex justify-between items-center py-2 border-t border-gray-50 cursor-pointer active:bg-gray-50"
                  onClick={() => setShowLabelSheet(true)}
                >
                  <label className="text-sm font-bold text-gray-700">描述标签</label>
                  <div className="flex items-center text-sm text-gray-400 font-bold">
                    <span>{selectedLabels.length ? `已选 ${selectedLabels.length}/3` : '去设置'}</span>
                    <ChevronRight size={16} className="ml-1"/>
                  </div>
                </div>
                {selectedLabels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedLabels.map(item => (
                      item.styleType === 'image' ? (
                        <div key={item.id} className="inline-flex items-center rounded-2xl border border-[#EEF1F5] bg-white px-2 py-2">
                          <ImagePreviewChip name={item.imageName || item.name} compact />
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, selectedLabelIds: prev.selectedLabelIds.filter(id => id !== item.id) }))}
                            className="ml-1 rounded-full p-1 text-[#98A1B3]"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span key={item.id} className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: item.backgroundColor, color: item.textColor }}>
                          {item.name}
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, selectedLabelIds: prev.selectedLabelIds.filter(id => id !== item.id) }))}
                            className="ml-1.5 rounded-full"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )
                    ))}
                  </div>
                )}
                <div
                  className="flex justify-between items-center py-2 border-t border-gray-50 cursor-pointer active:bg-gray-50"
                  onClick={() => setShowBadgeSheet(true)}
                >
                  <label className="text-sm font-bold text-gray-700">商品角标</label>
                  <div className="flex items-center text-sm text-gray-400 font-bold">
                    <span>{selectedBadge ? selectedBadge.name : '去设置'}</span>
                    <ChevronRight size={16} className="ml-1"/>
                  </div>
                </div>
                {selectedBadge && (
                  <div className="rounded-xl bg-[#F7F9FC] p-3">
                    <div className="flex items-center justify-between">
                      {selectedBadge.badgeType === 'image' ? (
                        <ImagePreviewChip name={selectedBadge.imageName || selectedBadge.name} />
                      ) : (
                        <span className="inline-flex rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: selectedBadge.backgroundColor }}>
                          {selectedBadge.name}
                        </span>
                      )}
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, selectedBadgeId: '', badgeStartDate: '', badgeEndDate: '' }))}
                        className="rounded-full bg-white p-1.5 text-[#98A1B3]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <input type="datetime-local" step={1} value={normalizeDateTimeValue(formData.badgeStartDate)} onChange={e => setFormData({ ...formData, badgeStartDate: e.target.value })} className="h-10 rounded-xl bg-white border border-gray-200 px-3 text-xs font-bold outline-none" />
                      <input type="datetime-local" step={1} value={normalizeDateTimeValue(formData.badgeEndDate)} onChange={e => setFormData({ ...formData, badgeEndDate: e.target.value })} className="h-10 rounded-xl bg-white border border-gray-200 px-3 text-xs font-bold outline-none" />
                    </div>
                    <div className="mt-2 text-[11px] text-[#99A1B1] break-all">
                      {formatDateTimeDisplay(formData.badgeStartDate)} 至 {formatDateTimeDisplay(formData.badgeEndDate)}
                    </div>
                  </div>
                )}
            </div>

            {/* 详情页展示 */}
            <div className="space-y-6 pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-800">详情展示</span>
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
                <div className="py-2">
                    <label className="text-sm font-bold text-gray-700 block mb-3">商品详情描述</label>
                    <textarea
                      value={formData.detailContent}
                      onChange={e => setFormData({ ...formData, detailContent: e.target.value })}
                      placeholder="请输入商品详情"
                      className="min-h-[120px] w-full rounded-2xl border border-gray-200 bg-[#FAFBFC] px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-[#00C06B]"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* 底部按钮 (固定悬浮) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 flex gap-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {saveMode === 'ai_confirm' ? (
          <button
            onClick={() => onSaveDraft?.({ name: formData.name, basePrice: formData.basePrice, category: formData.category })}
            className="w-full h-12 bg-[#00C06B] text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 active:bg-[#00A35B] active:scale-[0.98] transition-all"
          >
            保存
          </button>
        ) : (
          <>
            <button
              onClick={() => onPrimaryAction?.({
                name: formData.name,
                category: formData.category,
                basePrice: formData.basePrice,
                channels: formData.channels,
                detailContent: formData.detailContent,
                selectedLabelIds: formData.selectedLabelIds,
                selectedBadgeId: formData.selectedBadgeId,
                badgeStartDate: formData.badgeStartDate,
                badgeEndDate: formData.badgeEndDate,
                listDesc: formData.listDesc,
                specItems: formData.specItems,
              })}
              className={`${hideSecondaryAction ? 'w-full bg-[#00C06B] text-white shadow-lg shadow-green-100 active:bg-[#00A35B] active:scale-[0.98]' : 'flex-1 bg-white border border-gray-200 text-gray-700 active:bg-gray-50 active:scale-95'} h-12 rounded-xl font-bold text-sm transition-all`}
            >
              {primaryActionText || (mode === 'edit' ? '保存修改' : '保存')}
            </button>
            {!hideSecondaryAction && (
              <button className="flex-[1.5] h-12 bg-[#00C06B] text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 active:bg-[#00A35B] active:scale-[0.98] transition-all">
                {secondaryActionText || '保存并继续添加'}
              </button>
            )}
          </>
        )}
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
        productType={productType}
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
          helperText={channelSelectorHelperText}
          onBack={() => setShowChannelSelector(false)}
          onSave={handleChannelsSave}
        />
      )}

      {showLabelSheet && (
        <LabelSelectorSheet
          groups={labelGroups}
          selectedIds={formData.selectedLabelIds}
          onClose={() => setShowLabelSheet(false)}
          onChange={ids => setFormData({ ...formData, selectedLabelIds: ids })}
          onCreateGroup={() => setQuickCreator({ mode: 'group', name: '', styleType: 'text', backgroundColor: '#EAF8EF', textColor: '#00A35B', imageName: '', startDate: '2026-06-08', endDate: '2026-06-30' })}
          onCreateLabel={groupId => setQuickCreator({ mode: 'label', groupId, name: '', styleType: 'text', backgroundColor: '#EAF8EF', textColor: '#00A35B', imageName: '', startDate: '2026-06-08', endDate: '2026-06-30' })}
        />
      )}

      {showBadgeSheet && (
        <BadgeSelectorSheet
          badges={badges}
          selectedId={formData.selectedBadgeId}
          onClose={() => setShowBadgeSheet(false)}
          onSelect={badge => setFormData({
            ...formData,
            selectedBadgeId: badge.id,
            badgeStartDate: normalizeDateTimeValue(badge.startDate),
            badgeEndDate: normalizeDateTimeValue(badge.endDate),
          })}
          onClear={() => setFormData({ ...formData, selectedBadgeId: '', badgeStartDate: '', badgeEndDate: '' })}
          onCreate={() => setQuickCreator({ mode: 'badge', name: '', styleType: 'text', backgroundColor: '#00C06B', textColor: '#FFFFFF', imageName: '', startDate: '2026-06-08', endDate: '2026-06-30' })}
        />
      )}

      {quickCreator && (
        <QuickCreateMetaModal
          state={quickCreator}
          groups={labelGroups}
          onClose={() => setQuickCreator(null)}
          onChange={setQuickCreator}
          onSave={() => {
            const nextName = quickCreator.name.trim();
            if (!nextName) return;
            if (quickCreator.mode === 'group') {
              const nextGroup = { id: `store_group_${Date.now()}`, name: nextName, source: 'store' as const, items: [] };
              onLabelGroupsChange([...labelGroups, nextGroup]);
              setQuickCreator(null);
              setShowLabelSheet(true);
              return;
            }
            if (quickCreator.mode === 'label' && quickCreator.groupId) {
              const nextLabel = {
                id: `store_label_${Date.now()}`,
                name: nextName,
                styleType: quickCreator.styleType,
                backgroundColor: quickCreator.backgroundColor,
                textColor: quickCreator.textColor,
                imageName: quickCreator.imageName,
                source: 'store' as const,
              };
              onLabelGroupsChange(labelGroups.map(group => (
                group.id === quickCreator.groupId ? { ...group, items: [...group.items, nextLabel] } : group
              )));
              setFormData(prev => ({ ...prev, selectedLabelIds: [...prev.selectedLabelIds, nextLabel.id] }));
              setQuickCreator(null);
              setShowLabelSheet(true);
              return;
            }
            if (quickCreator.mode === 'badge') {
              const nextBadge = {
                id: `store_badge_${Date.now()}`,
                name: nextName,
                badgeType: quickCreator.styleType,
                backgroundColor: quickCreator.backgroundColor,
                imageName: quickCreator.imageName,
                startDate: quickCreator.startDate,
                endDate: quickCreator.endDate,
                source: 'store' as const,
              };
              onBadgesChange([nextBadge, ...badges]);
              setFormData(prev => ({
                ...prev,
                selectedBadgeId: nextBadge.id,
                badgeStartDate: normalizeDateTimeValue(nextBadge.startDate),
                badgeEndDate: normalizeDateTimeValue(nextBadge.endDate),
              }));
              setQuickCreator(null);
              setShowBadgeSheet(true);
            }
          }}
        />
      )}
    </div>
  );
};

const LabelSelectorSheet = ({
  groups,
  selectedIds,
  onClose,
  onChange,
  onCreateGroup,
  onCreateLabel,
}: {
  groups: MobileLabelGroup[];
  selectedIds: string[];
  onClose: () => void;
  onChange: (ids: string[]) => void;
  onCreateGroup: () => void;
  onCreateLabel: (groupId: string) => void;
}) => {
  const [keyword, setKeyword] = useState('');
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(item => item !== id));
      return;
    }
    if (selectedIds.length >= 3) return;
    onChange([...selectedIds, id]);
  };
  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleGroups = groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => !normalizedKeyword || item.name.toLowerCase().includes(normalizedKeyword)),
    }))
    .filter(group => !normalizedKeyword || group.name.toLowerCase().includes(normalizedKeyword) || group.items.length > 0);

  return (
    <div className="absolute inset-0 z-[120] flex flex-col justify-end bg-black/50 animate-in fade-in">
      <div className="flex-1" onClick={onClose}></div>
      <div className="max-h-[80vh] rounded-t-[24px] bg-white p-4 pb-8 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between px-1">
          <div className="text-lg font-black text-[#1F2129]">选择描述标签</div>
          <button onClick={onClose} className="rounded-full bg-[#F5F5F5] p-1.5 text-[#98A0B3]"><X size={16} /></button>
        </div>
        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A0B3]" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索标签名称" className="h-10 w-full rounded-xl bg-[#F5F6FA] pl-9 pr-3 text-sm font-medium outline-none" />
          <div className="mt-2 text-[11px] text-[#99A1B1]">最多选择 3 个</div>
        </div>
        <div className="mt-4 max-h-[52vh] overflow-y-auto no-scrollbar space-y-3">
          {visibleGroups.map(group => (
            <div key={group.id} className="rounded-2xl bg-[#F7F9FC] p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-[#1F2129]">{group.name}</span>
                <button onClick={() => onCreateLabel(group.id)} className={`text-[11px] font-bold ${group.source === 'brand' ? 'text-[#C0C4CF]' : 'text-[#00A35B]'}`} disabled={group.source === 'brand'}>
                  新增标签
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map(item => {
                  const active = selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      className={`rounded-2xl border ${item.styleType === 'image' ? 'px-2 py-2' : 'px-3 py-1.5'} text-[12px] font-bold ${active ? 'border-[#00C06B] bg-[#F3FCF7]' : 'border-transparent bg-white'} ${!active && selectedIds.length >= 3 ? 'opacity-40' : ''}`}
                    >
                      {item.styleType === 'image'
                        ? <ImagePreviewChip name={item.imageName || item.name} compact />
                        : <span style={{ color: item.textColor }}>{item.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={onCreateGroup} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-[#333]">新增标签分组</button>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-[#00C06B] text-sm font-bold text-white">完成</button>
        </div>
      </div>
    </div>
  );
};

const BadgeSelectorSheet = ({
  badges,
  selectedId,
  onClose,
  onSelect,
  onClear,
  onCreate,
}: {
  badges: MobileBadgeItem[];
  selectedId: string;
  onClose: () => void;
  onSelect: (badge: MobileBadgeItem) => void;
  onClear: () => void;
  onCreate: () => void;
}) => {
  const [keyword, setKeyword] = useState('');
  const filteredBadges = badges.filter(item => !keyword.trim() || item.name.toLowerCase().includes(keyword.trim().toLowerCase()));
  return (
    <div className="absolute inset-0 z-[120] flex flex-col justify-end bg-black/50 animate-in fade-in">
      <div className="flex-1" onClick={onClose}></div>
      <div className="max-h-[80vh] rounded-t-[24px] bg-white p-4 pb-8 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between px-1">
          <div className="text-lg font-black text-[#1F2129]">选择商品角标</div>
          <button onClick={onClose} className="rounded-full bg-[#F5F5F5] p-1.5 text-[#98A0B3]"><X size={16} /></button>
        </div>
        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A0B3]" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索角标名称" className="h-10 w-full rounded-xl bg-[#F5F6FA] pl-9 pr-3 text-sm font-medium outline-none" />
        </div>
        <div className="mt-4 max-h-[52vh] overflow-y-auto no-scrollbar space-y-3">
        {filteredBadges.map(item => {
          const active = selectedId === item.id;
          return (
            <button key={item.id} onClick={() => onSelect(item)} className={`w-full rounded-2xl border px-4 py-4 text-left ${active ? 'border-[#00C06B] bg-[#F3FCF7]' : 'border-[#EEF1F5] bg-white'}`}>
              <div className="flex items-center justify-between">
                {item.badgeType === 'image'
                  ? <ImagePreviewChip name={item.imageName || item.name} />
                  : <span className="inline-flex rounded-full px-3 py-1 text-[12px] font-bold text-white" style={{ backgroundColor: item.backgroundColor }}>{item.name}</span>}
                {active ? <Check size={18} className="text-[#00C06B]" /> : null}
              </div>
              <div className="mt-2 text-[11px] leading-5 text-[#99A1B1] break-all">{formatDateTimeDisplay(item.startDate)} 至 {formatDateTimeDisplay(item.endDate)}</div>
            </button>
          );
        })}
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={onCreate} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-[#333]">新增角标</button>
          <button onClick={onClear} className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-bold text-[#666]">清空</button>
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-[#00C06B] text-sm font-bold text-white">完成</button>
        </div>
      </div>
    </div>
  );
};

const QuickCreateMetaModal = ({
  state,
  groups,
  onClose,
  onSave,
  onChange,
}: {
  state: NonNullable<Parameters<typeof MobileStandardProductCreator>[0]['labelGroups']> extends never ? never : {
    mode: 'group' | 'label' | 'badge';
    name: string;
    groupId?: string;
    styleType: VisualStyleType;
    backgroundColor: string;
    textColor: string;
    imageName?: string;
    startDate: string;
    endDate: string;
  };
  groups: MobileLabelGroup[];
  onClose: () => void;
  onSave: () => void;
  onChange: React.Dispatch<React.SetStateAction<any>>;
}) => (
  <div className="absolute inset-0 z-[140] flex items-center justify-center bg-black/45 px-5">
    <div className="w-full rounded-[24px] bg-white p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="text-[18px] font-black text-[#1F2129]">
          {state.mode === 'group' ? '新增标签分组' : state.mode === 'label' ? '新增标签' : '新增角标'}
        </div>
        <button onClick={onClose} className="rounded-full bg-[#F5F5F5] p-1.5 text-[#98A0B3]"><X size={16} /></button>
      </div>
      {state.mode === 'label' ? (
        <div className="mt-1 text-[11px] text-[#99A1B1]">所属分组：{groups.find(group => group.id === state.groupId)?.name || '-'}</div>
      ) : null}
      <div className="mt-5 space-y-4">
        <input value={state.name} onChange={e => onChange((prev: any) => prev ? { ...prev, name: e.target.value.slice(0, 10) } : prev)} placeholder={state.mode === 'group' ? '请输入标签分组名称' : state.mode === 'label' ? '请输入标签名称' : '请输入角标名称'} className="h-[44px] w-full rounded-xl bg-[#F5F6FA] px-4 text-sm font-bold outline-none" />
        {state.mode !== 'group' && (
          <>
            <div className="flex gap-2">
              {(['text', 'image'] as VisualStyleType[]).map(type => (
                <button key={type} onClick={() => onChange((prev: any) => prev ? { ...prev, styleType: type } : prev)} className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${state.styleType === type ? 'border-[#00C06B] bg-[#F3FCF7] text-[#00A35B]' : 'border-gray-200 text-gray-500'}`}>
                  {type === 'text' ? '文字' : '图片'}
                </button>
              ))}
            </div>
            {state.styleType === 'text' ? (
              <>
                <ColorPaletteField
                  label="背景颜色"
                  value={state.backgroundColor}
                  onChange={value => onChange((prev: any) => prev ? { ...prev, backgroundColor: value } : prev)}
                  palette={['#00C06B', '#FF8A00', '#7A5AF8', '#2F6FED', '#111827', '#E84C84']}
                />
                {state.mode === 'label' ? (
                  <ColorPaletteField
                    label="文字颜色"
                    value={state.textColor}
                    onChange={value => onChange((prev: any) => prev ? { ...prev, textColor: value } : prev)}
                    palette={['#FFFFFF', '#111827', '#00A35B', '#B54708', '#7A5AF8', '#2F6FED']}
                  />
                ) : null}
              </>
            ) : (
              <ImageUploadField
                value={state.imageName}
                title={state.mode === 'label' ? '标签图片' : '角标图片'}
                onSelect={value => onChange((prev: any) => prev ? { ...prev, imageName: value } : prev)}
              />
            )}
            {state.mode === 'badge' ? (
              <div className="grid grid-cols-[1fr_24px_1fr] gap-2">
                <input type="datetime-local" step={1} value={normalizeDateTimeValue(state.startDate)} onChange={e => onChange((prev: any) => prev ? { ...prev, startDate: e.target.value } : prev)} className="h-[42px] rounded-xl bg-[#F5F6FA] px-3 text-sm font-bold outline-none" />
                <div className="flex items-center justify-center text-sm text-[#A0A6B7]">至</div>
                <input type="datetime-local" step={1} value={normalizeDateTimeValue(state.endDate)} onChange={e => onChange((prev: any) => prev ? { ...prev, endDate: e.target.value } : prev)} className="h-[42px] rounded-xl bg-[#F5F6FA] px-3 text-sm font-bold outline-none" />
              </div>
            ) : null}
            <div className="rounded-2xl bg-[#F7F9FC] p-3">
              <div className="text-[11px] font-bold text-[#99A1B1]">预览</div>
              <div className="mt-2">
                {state.styleType === 'image'
                  ? <ImagePreviewChip name={state.imageName || state.name || '图片样式'} />
                  : state.mode === 'badge'
                    ? <span className="inline-flex rounded-full px-3 py-1 text-[12px] font-bold text-white" style={{ backgroundColor: state.backgroundColor }}>{state.name || '角标'}</span>
                    : <span className="inline-flex rounded-full px-3 py-1 text-[12px] font-bold" style={{ backgroundColor: state.backgroundColor, color: state.textColor }}>{state.name || '标签'}</span>}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-[#666]">取消</button>
        <button onClick={onSave} className="flex-1 h-11 rounded-xl bg-[#00C06B] text-sm font-bold text-white">确定</button>
      </div>
    </div>
  </div>
);

const ImagePreviewChip = ({ name, compact = false }: { name: string; compact?: boolean }) => (
  <div className={`inline-flex items-center rounded-xl border border-[#DCE3EC] bg-white ${compact ? 'px-2 py-1.5' : 'px-2.5 py-2'}`}>
    <div className={`flex items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B] ${compact ? 'h-7 w-7' : 'h-9 w-9'}`}>
      <ImageIcon size={compact ? 14 : 16} />
    </div>
    <div className="ml-2">
      <div className={`font-bold text-[#1F2129] ${compact ? 'text-[11px]' : 'text-[12px]'}`}>{name}</div>
      {!compact ? <div className="text-[10px] text-[#99A1B1]">图片样式</div> : null}
    </div>
  </div>
);

const normalizeDateTimeValue = (value: string) => {
  if (!value) return '';
  if (value.includes('T')) {
    const parts = value.split('T');
    const time = parts[1] || '00:00:00';
    return `${parts[0]}T${time.length === 5 ? `${time}:00` : time}`;
  }
  return `${value}T00:00:00`;
};

const formatDateTimeDisplay = (value: string) => {
  const normalized = normalizeDateTimeValue(value);
  if (!normalized) return '--';
  return normalized.replace('T', ' ');
};

const ColorPaletteField = ({
  label,
  value,
  onChange,
  palette,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  palette: string[];
}) => (
  <div className="space-y-2">
    <div className="text-[12px] font-bold text-[#667085]">{label}</div>
    <div className="flex flex-wrap gap-2">
      {palette.map(color => {
        const active = value.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`relative h-10 w-10 rounded-2xl border-2 ${active ? 'border-[#111827]' : 'border-white'}`}
            style={{ backgroundColor: color }}
          >
            {active ? <Check size={14} className="absolute inset-0 m-auto text-white" strokeWidth={3} /> : null}
          </button>
        );
      })}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 min-w-0 flex-1 rounded-xl bg-[#F5F6FA] px-3 text-[12px] font-bold outline-none"
      />
    </div>
  </div>
);

const ImageUploadField = ({
  value,
  title,
  onSelect,
}: {
  value?: string;
  title: string;
  onSelect: (value: string) => void;
}) => (
  <div className="space-y-2">
    <div className="text-[12px] font-bold text-[#667085]">{title}</div>
    <div className="rounded-2xl border border-dashed border-[#D5DAE1] bg-[#FAFBFC] p-3">
      <div className="flex items-center justify-between">
        {value ? <ImagePreviewChip name={value} /> : <div className="text-[12px] text-[#99A1B1]">上传后可直接预览图片样式</div>}
        <div className="flex gap-2">
          <button onClick={() => onSelect('拍照上传图')} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#333] shadow-sm">拍照</button>
          <button onClick={() => onSelect('相册图片')} className="rounded-full bg-[#1F2129] px-3 py-1.5 text-[11px] font-bold text-white">相册</button>
        </div>
      </div>
    </div>
  </div>
);

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
