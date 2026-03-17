import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, Plus, ChevronRight, Check, 
  ImageIcon, Smartphone, Printer, Store, ShoppingBag,
  Info, Camera, Video, List, Sliders, Tag, Settings, Minus, X, Trash2, Edit2, Clock
} from 'lucide-react';
import { Category, Product } from '../../types';

interface Props {
  product: Product;
  onBack: () => void;
  categories: Category[];
}

type TabType = 'basic' | 'attr' | 'sales' | 'display';

export const MobileProductEditor: React.FC<Props> = ({ product, onBack, categories }) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const sectionRefs = {
    basic: useRef<HTMLDivElement>(null),
    attr: useRef<HTMLDivElement>(null),
    sales: useRef<HTMLDivElement>(null),
    display: useRef<HTMLDivElement>(null),
  };

  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    price: product.price.toString(),
    stock: product.stock === -1 ? '' : product.stock?.toString() || '0',
    type: product.type || 'standard',
    status: product.status,
  });

  const tabs: { id: TabType; label: string }[] = [
    { id: 'basic', label: '基础信息' },
    { id: 'attr', label: '商品属性' },
    { id: 'sales', label: '销售属性' },
    { id: 'display', label: '展示信息' },
  ];

  // 滑动自动切换 Tab 逻辑
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

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] h-full relative overflow-hidden font-sans select-none animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 z-30">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24} /></button>
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">编辑商品</span>
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
            
            <div className="py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700 block mb-2">商品主图 <span className="text-red-500">*</span></label>
                <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden relative mb-3">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">修改</div>
                </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700">商品名称 <span className="text-red-500">*</span></label>
                <input 
                    className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4 text-gray-800" 
                    placeholder="请输入商品名称" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-50 cursor-pointer active:bg-gray-50 transition-colors">
                <label className="text-sm font-bold text-gray-700">商品分类 <span className="text-red-500">*</span></label>
                <div className="flex items-center text-sm text-[#333] font-bold">
                    <span>{formData.category}</span>
                    <ChevronRight size={16} className="ml-1 text-gray-400"/>
                </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700">商品类型</label>
                <div className="text-sm font-medium text-gray-500">
                    {formData.type === 'combo' ? '套餐商品' : '标准商品'}
                </div>
            </div>
        </div>

        {/* 2. 商品属性 */}
        <div ref={sectionRefs.attr} className="bg-white p-5 rounded-2xl shadow-sm space-y-5">
            <h3 className="font-black text-base text-gray-800">商品属性</h3>
            <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
                多规格、做法、加料等属性设置
            </div>
        </div>

        {/* 3. 销售属性 */}
        <div ref={sectionRefs.sales} className="bg-white p-5 rounded-2xl shadow-sm space-y-5">
            <h3 className="font-black text-base text-gray-800">销售属性</h3>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700">售卖价格 <span className="text-red-500">*</span></label>
                <div className="flex items-center">
                    <span className="text-sm font-bold mr-1">¥</span>
                    <input 
                        type="number"
                        className="text-right text-base font-black outline-none placeholder-gray-300 w-20 text-[#1F2129]" 
                        placeholder="0.00" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <label className="text-sm font-bold text-gray-700">商品库存</label>
                <input 
                    type="number"
                    className="text-right text-sm font-medium outline-none placeholder-gray-300 w-20" 
                    placeholder="无限" 
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                />
            </div>
        </div>

        {/* 4. 展示信息 */}
        <div ref={sectionRefs.display} className="bg-white p-5 rounded-2xl shadow-sm space-y-5">
            <h3 className="font-black text-base text-gray-800">展示信息</h3>
            <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
                图文详情、视频、商品标签等展示设置
            </div>
        </div>

      </div>

      {/* 底部按钮 */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30">
        <button onClick={onBack} className="w-full h-12 bg-[#00C06B] text-white rounded-xl font-bold text-base shadow-lg shadow-green-100 active:scale-95 transition-transform">
          保存修改
        </button>
      </div>
    </div>
  );
};
