import React, { useState } from 'react';
import { 
    Search, ChevronRight, CheckCircle2, ChevronDown, Plus, X, 
    Printer, Coffee, Smartphone, Store, ShoppingBag, Filter, 
    AlertCircle, FileEdit, Clock, Layers
} from 'lucide-react';

const MOCK_PRODUCTS = [
    { id: '1', name: '拿铁咖啡', category: '咖啡系列', price: 18, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=100' },
    { id: '2', name: '焦糖玛奇朵', category: '咖啡系列', price: 22, image: 'https://images.unsplash.com/photo-1589301760576-47f4056966d5?auto=format&fit=crop&q=80&w=100' },
    { id: '3', name: '经典珍珠奶茶', category: '奶茶系列', price: 15, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=100' },
    { id: '4', name: '草莓芝士冰沙', category: '果茶系列', price: 28, image: 'https://images.unsplash.com/photo-1589301760576-47f4056966d5?auto=format&fit=crop&q=80&w=100' },
];

const MOCK_STORES = [
    { id: 's1', name: '北京人广店' },
    { id: 's2', name: '上海新天地店' },
    { id: 's3', name: '深圳南山店' },
    { id: 's4', name: '广州天河店' },
];

export const WebProductSync: React.FC = () => {
    const [step, setStep] = useState(1);
    
    // Step 1: Product Selection
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    
    // Step 2: Store Selection & Override Settings
    const [selectedStores, setSelectedStores] = useState<string[]>([]);
    const [enableOverride, setEnableOverride] = useState(false);
    
    // Override Grid State
    const [activeCategory, setActiveCategory] = useState<string>('全部');
    const [overrides, setOverrides] = useState<Record<string, any>>({});
    const [activePopover, setActivePopover] = useState<{ id: string, field: string } | null>(null);

    // Derived Data
    const selectedProductData = MOCK_PRODUCTS.filter(p => selectedProducts.includes(p.id));
    const categories = ['全部', ...Array.from(new Set(selectedProductData.map(p => p.category)))];
    
    const displayProducts = activeCategory === '全部' 
        ? selectedProductData 
        : selectedProductData.filter(p => p.category === activeCategory);

    // Handlers
    const toggleProduct = (id: string) => {
        setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleEditProduct = (e: React.MouseEvent, productId: string) => {
        e.stopPropagation();
        if (!selectedProducts.includes(productId)) {
            setSelectedProducts(prev => [...prev, productId]);
        }
        setEnableOverride(true);
        setStep(2); // Jump directly to step 2 and open the editor
    };

    const toggleStore = (id: string) => {
        setSelectedStores(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const handleOverrideChange = (productId: string, field: string, value: any) => {
        setOverrides(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || {}),
                [field]: value
            }
        }));
    };

    const getOverrideValue = (productId: string, field: string, defaultValue: any) => {
        return overrides[productId]?.[field] ?? defaultValue;
    };

    const isOverridden = (productId: string, field: string) => {
        return overrides[productId]?.[field] !== undefined;
    };

    // UI Renderers
    const renderStep1 = () => (
        <div className="flex-1 flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex space-x-4">
                    <button className="px-4 py-2 text-[#00C06B] font-bold border-b-2 border-[#00C06B]">选择商品库商品</button>
                    <button className="px-4 py-2 text-gray-500 hover:text-gray-800">选择模板商品</button>
                </div>
            </div>
            <div className="p-4 flex space-x-2 border-b border-gray-100">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>
                    <input className="pl-9 pr-4 py-1.5 border border-gray-200 rounded w-64 text-sm focus:border-[#00C06B] focus:outline-none" placeholder="搜索商品名称/条码"/>
                </div>
                <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-bold hover:bg-[#00A35B]">查询</button>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-4 w-12"><input type="checkbox" onChange={(e) => setSelectedProducts(e.target.checked ? MOCK_PRODUCTS.map(p => p.id) : [])} checked={selectedProducts.length === MOCK_PRODUCTS.length && MOCK_PRODUCTS.length > 0} /></th>
                            <th className="py-3 px-4">商品名称</th>
                            <th className="py-3 px-4">前台分类</th>
                            <th className="py-3 px-4">标准售价</th>
                            <th className="py-3 px-4 w-48 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {MOCK_PRODUCTS.map(p => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => toggleProduct(p.id)}>
                                <td className="py-3 px-4"><input type="checkbox" checked={selectedProducts.includes(p.id)} readOnly /></td>
                                <td className="py-3 px-4 flex items-center">
                                    <img src={p.image} className="w-10 h-10 rounded object-cover mr-3 border border-gray-100"/>
                                    <span className="font-medium text-gray-800">{p.name}</span>
                                </td>
                                <td className="py-3 px-4 text-gray-600">{p.category}</td>
                                <td className="py-3 px-4 font-medium">￥{p.price.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right">
                                    <button 
                                        onClick={(e) => handleEditProduct(e, p.id)}
                                        className="text-[#00C06B] font-bold hover:underline"
                                    >
                                        编辑差异化属性
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
                <div className="text-sm text-gray-500">已选 <span className="text-[#00C06B] font-bold mx-1">{selectedProducts.length}</span> 个商品</div>
                <button 
                    disabled={selectedProducts.length === 0}
                    onClick={() => setStep(2)}
                    className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00A35B] transition-colors"
                >
                    下一步
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="flex-1 flex flex-col h-full bg-[#F5F6FA] overflow-hidden">
            {/* Store Selection Area */}
            <div className="bg-white p-6 border-b border-gray-100 shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center"><Store size={18} className="mr-2 text-[#00C06B]"/> 选择目标门店</h3>
                    <label className="flex items-center cursor-pointer bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100" onClick={() => setEnableOverride(!enableOverride)}>
                        <span className="mr-2 text-sm font-bold text-orange-600">配置门店差异化属性</span>
                        <div className={`relative inline-block w-8 h-4 transition-colors duration-200 ease-in-out rounded-full ${enableOverride ? 'bg-orange-500' : 'bg-gray-300'}`}>
                            <span className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out ${enableOverride ? 'transform translate-x-4' : ''}`}></span>
                        </div>
                    </label>
                </div>
                <div className="flex flex-wrap gap-3">
                    {MOCK_STORES.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => toggleStore(s.id)}
                            className={`px-4 py-2 rounded border cursor-pointer transition-all ${selectedStores.includes(s.id) ? 'bg-[#00C06B]/10 border-[#00C06B] text-[#00C06B] font-bold' : 'bg-white border-gray-200 text-gray-600 hover:border-[#00C06B]'}`}
                        >
                            {s.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Override Area */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
                {enableOverride ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Sidebar - Categories */}
                            <div className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
                                <div className="p-3 border-b border-gray-100 bg-gray-50/30">
                                    <span className="font-bold text-gray-700 text-sm">前台分类排序</span>
                                </div>
                                <div className="flex-1 overflow-y-auto py-2">
                                    {categories.map((cat, idx) => (
                                        <div 
                                            key={cat} 
                                            onClick={() => setActiveCategory(cat)}
                                            className={`flex justify-between items-center px-4 py-2.5 cursor-pointer text-sm transition-colors ${activeCategory === cat ? 'bg-[#00C06B]/10 text-[#00C06B] font-bold border-r-2 border-[#00C06B]' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <span>{cat}</span>
                                            {cat !== '全部' && (
                                                <div className="flex items-center" onClick={e => e.stopPropagation()}>
                                                    <input 
                                                        type="number" 
                                                        className="w-10 h-6 border border-gray-200 rounded text-center text-xs focus:border-[#00C06B] focus:outline-none" 
                                                        defaultValue={idx}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Content - Product Grid */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                <div className="p-3 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-700">分类下商品排序及属性</span>
                                    <span className="text-xs text-gray-400"><AlertCircle size={12} className="inline mr-1 -mt-0.5"/>点击高亮文本即可修改</span>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead className="bg-white text-gray-400 text-xs sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="py-3 px-4 font-medium w-16">排序</th>
                                                <th className="py-3 px-4 font-medium">商品名称</th>
                                                <th className="py-3 px-4 font-medium w-24">售价</th>
                                                <th className="py-3 px-4 font-medium">可售时间</th>
                                                <th className="py-3 px-4 font-medium">做法加料</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {displayProducts.map((p, idx) => {
                                                const currentPrice = getOverrideValue(p.id, 'price', p.price);
                                                const priceOverridden = isOverridden(p.id, 'price');
                                                const currentTime = getOverrideValue(p.id, 'time', '全时段');
                                                const timeOverridden = isOverridden(p.id, 'time');
                                                const currentSort = getOverrideValue(p.id, 'sort', idx + 1);

                                                return (
                                                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                        <td className="py-3 px-4">
                                                            <input 
                                                                type="number" 
                                                                value={currentSort}
                                                                onChange={(e) => handleOverrideChange(p.id, 'sort', e.target.value)}
                                                                className="w-12 h-7 border border-gray-200 rounded text-center text-xs focus:border-[#00C06B] focus:outline-none hover:border-gray-300 transition-colors bg-white" 
                                                            />
                                                        </td>
                                                        <td className="py-3 px-4 flex items-center">
                                                            <img src={p.image} className="w-8 h-8 rounded object-cover mr-2 border border-gray-100"/>
                                                            <span className="font-medium text-gray-800">{p.name}</span>
                                                        </td>
                                                        {/* Price Cell with Popover Edit */}
                                                        <td className="py-3 px-4 relative">
                                                            <div 
                                                                onClick={() => setActivePopover({ id: p.id, field: 'price' })}
                                                                className={`cursor-pointer group flex items-center ${priceOverridden ? 'text-orange-500 font-bold' : 'text-gray-600'}`}
                                                            >
                                                                ￥{Number(currentPrice).toFixed(2)}
                                                                <FileEdit size={12} className={`ml-1 opacity-0 group-hover:opacity-100 transition-opacity ${priceOverridden ? 'text-orange-500' : 'text-gray-400'}`}/>
                                                                {priceOverridden && <div className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
                                                            </div>
                                                            {activePopover?.id === p.id && activePopover?.field === 'price' && (
                                                                <div className="absolute top-10 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-3 flex items-center space-x-2 animate-in fade-in zoom-in-95">
                                                                    <div className="text-xs text-gray-500 font-medium">售价:</div>
                                                                    <input 
                                                                        type="number" 
                                                                        className="w-20 border border-gray-200 rounded px-2 py-1 text-sm focus:border-[#00C06B] focus:outline-none" 
                                                                        autoFocus
                                                                        defaultValue={currentPrice}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleOverrideChange(p.id, 'price', Number(e.currentTarget.value));
                                                                                setActivePopover(null);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <button 
                                                                        onClick={() => setActivePopover(null)}
                                                                        className="px-3 py-1 bg-[#00C06B] text-white rounded text-xs font-bold"
                                                                    >
                                                                        确认
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                        {/* Time Cell */}
                                                        <td className="py-3 px-4 relative">
                                                            <div 
                                                                onClick={() => setActivePopover({ id: p.id, field: 'time' })}
                                                                className={`cursor-pointer group flex items-center ${timeOverridden ? 'text-orange-500 font-bold' : 'text-gray-600'}`}
                                                            >
                                                                {currentTime}
                                                                <FileEdit size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"/>
                                                            </div>
                                                            {activePopover?.id === p.id && activePopover?.field === 'time' && (
                                                                <div className="absolute top-10 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-2 flex flex-col space-y-1 animate-in fade-in zoom-in-95 w-32">
                                                                    {['全时段', '07:00-10:00', '10:00-14:00', '14:00-22:00'].map(t => (
                                                                        <div 
                                                                            key={t}
                                                                            onClick={() => {
                                                                                handleOverrideChange(p.id, 'time', t);
                                                                                setActivePopover(null);
                                                                            }}
                                                                            className="px-3 py-1.5 hover:bg-gray-50 cursor-pointer rounded text-sm text-gray-700"
                                                                        >
                                                                            {t}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                        {/* Modifiers Cell */}
                                                        <td className="py-3 px-4">
                                                            <div className="flex space-x-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => alert('这里可以弹出做法加料选择弹窗')}>
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">甜度</span>
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">温度</span>
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">加小料</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gray-50/50 flex flex-col items-center justify-center m-4 rounded-lg border-2 border-dashed border-gray-200">
                        <Layers size={48} className="text-gray-300 mb-4"/>
                        <h4 className="text-gray-500 font-bold mb-2">未开启差异化配置</h4>
                        <p className="text-gray-400 text-sm mb-4">将直接按总部标准商品数据同步至选定门店</p>
                        <button 
                            onClick={() => setEnableOverride(true)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-600 text-sm hover:border-[#00C06B] hover:text-[#00C06B] transition-colors"
                        >
                            开启差异化配置
                        </button>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors">上一步</button>
                <button 
                    disabled={selectedStores.length === 0}
                    onClick={() => setStep(3)}
                    className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00A35B] transition-colors shadow-md"
                >
                    确认同步
                </button>
            </div>
            
            {/* Click outside overlay for popovers */}
            {activePopover && (
                <div className="fixed inset-0 z-40" onClick={() => setActivePopover(null)}></div>
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="flex-1 flex flex-col items-center justify-center bg-white h-full">
            <div className="w-16 h-16 bg-[#00C06B] rounded-full flex items-center justify-center text-white mb-6 shadow-lg animate-in zoom-in">
                <CheckCircle2 size={32}/>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">同步任务已提交</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
                成功将 {selectedProducts.length} 个商品同步至 {selectedStores.length} 家门店。<br/>
                {enableOverride && Object.keys(overrides).length > 0 && <span className="text-orange-500 font-medium mt-2 block">包含 {Object.keys(overrides).length} 个门店差异化配置</span>}
            </p>
            <div className="flex space-x-4">
                <button onClick={() => { setStep(1); setSelectedProducts([]); setSelectedStores([]); setOverrides({}); setEnableOverride(false); }} className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors">继续同步</button>
                <button className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B] transition-colors shadow-md">查看同步记录</button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
            {/* Wizard Header */}
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white shrink-0">
                <div className="font-bold text-gray-800 text-lg">商品同步工具</div>
                <div className="flex items-center space-x-4 text-sm font-bold">
                    <div className={`flex items-center ${step >= 1 ? 'text-[#00C06B]' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs ${step >= 1 ? 'bg-[#00C06B] text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
                        选择商品
                    </div>
                    <div className="w-12 h-px bg-gray-200"></div>
                    <div className={`flex items-center ${step >= 2 ? 'text-[#00C06B]' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs ${step >= 2 ? 'bg-[#00C06B] text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
                        选择门店 & 设置
                    </div>
                    <div className="w-12 h-px bg-gray-200"></div>
                    <div className={`flex items-center ${step >= 3 ? 'text-[#00C06B]' : 'text-gray-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs ${step >= 3 ? 'bg-[#00C06B] text-white' : 'bg-gray-100 text-gray-400'}`}>3</div>
                        完成
                    </div>
                </div>
            </div>

            {/* Wizard Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
        </div>
    );
};
