import React, { useState } from 'react';
import { 
  ArrowLeft, FileText, Scale, Sliders, Settings, 
  Check, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Utensils, Coffee,
  Box, LayoutGrid, Sparkles, ChevronRight, X
} from 'lucide-react';
import { Category, Product, INITIAL_PRODUCTS } from '../../types';
import { Switch, SectionHeader, FormRow, ChannelSwitch } from './WebCommon';

interface WebComboProductFormProps {
    category: Category;
    onClose: () => void;
}

// 统一的分组类型定义
interface ComboGroup {
    id: string;
    type: 'fixed' | 'optional' | 'free'; // 固定 | 可选 | 随心配
    name: string;
    items: ComboItem[];
    // 可选/随心配特有属性
    minSelect?: number;
    maxSelect?: number;
    isMultiSpec?: boolean; // 是否多规格(针对固定搭配)
    // 可选分组特有配置
    isMustSelect?: boolean; // 分组是否必选
    allowMultiSelect?: boolean; // 单个商品是否可多选
    maxTotalQuantity?: number; // 最多购买总数
    saveAsFreeGroup?: boolean; // 是否保存为随心配
    relativePricing?: boolean; // 相对计价
    note?: string; // 备注
}

interface ComboItem {
    id: string;
    productId: string;
    name: string;
    spec: string;
    price?: number;
    quantity: number;
    isDefault?: boolean; // 是否默认选中(针对可选分组)
    extraPrice?: number; // 加价
    packageFee?: boolean; // 额外收取包装费
    note?: string;
}

// Mock 随心配库 (复用分组)
const MOCK_FREE_GROUPS = [
    { id: 'fg_1', name: '随心配2选1', minSelect: 1, maxSelect: 1, items: [{id: 'i1', productId: '1', name: '招牌珍珠奶茶', spec: '中杯', quantity: 1}, {id: 'i2', productId: '2', name: '手打柠檬茶', spec: '中杯', quantity: 1}] },
    { id: 'fg_2', name: '小料3选1', minSelect: 1, maxSelect: 1, items: [] }
];

export const WebComboProductForm: React.FC<WebComboProductFormProps> = ({ category, onClose }) => {
    const [activeFormSection, setActiveFormSection] = useState('basic');
    const [pricingType, setPricingType] = useState<'markup' | 'combined'>('markup');
    
    // 核心改进：统一的 groups 数组，包含所有类型的分组
    const [groups, setGroups] = useState<ComboGroup[]>([
        { 
            id: 'g_1', 
            type: 'fixed', 
            name: '固定搭配', 
            items: [
                { id: 'i_1', productId: '5', name: '麻辣火锅底料', spec: '标准', quantity: 1, price: 45, packageFee: true }
            ] 
        }
    ]);

    const scrollToSection = (id: string) => {
        setActiveFormSection(id);
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // 添加分组
    const addGroup = (type: 'fixed' | 'optional' | 'free') => {
        if (type === 'free') {
            // 模拟从库中选择
            const selected = MOCK_FREE_GROUPS[0];
            const newGroup: ComboGroup = {
                id: `g_${Date.now()}`,
                type: 'free',
                name: selected.name,
                minSelect: selected.minSelect,
                maxSelect: selected.maxSelect,
                items: selected.items as ComboItem[]
            };
            setGroups([...groups, newGroup]);
        } else {
            const newGroup: ComboGroup = {
                id: `g_${Date.now()}`,
                type: type,
                name: type === 'fixed' ? '新固定搭配' : '新可选分组',
                minSelect: 1,
                maxSelect: 1,
                items: [],
                isMustSelect: true,
                maxTotalQuantity: 100
            };
            setGroups([...groups, newGroup]);
        }
    };

    // 排序逻辑
    const moveGroup = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === groups.length - 1) return;
        
        const newGroups = [...groups];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];
        setGroups(newGroups);
    };

    const removeGroup = (index: number) => {
        const newGroups = [...groups];
        newGroups.splice(index, 1);
        setGroups(newGroups);
    };

    // 更新分组属性
    const updateGroup = (index: number, updates: Partial<ComboGroup>) => {
        const newGroups = [...groups];
        newGroups[index] = { ...newGroups[index], ...updates };
        setGroups(newGroups);
    };

    // 渲染分组卡片
    const renderGroupCard = (group: ComboGroup, index: number) => {
        return (
            <div key={group.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4 group animate-in slide-in-from-bottom-2">
                {/* Group Header */}
                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            group.type === 'fixed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            group.type === 'optional' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-purple-50 text-purple-600 border-purple-100'
                        }`}>
                            {group.type === 'fixed' ? '固定搭配' : group.type === 'optional' ? '可选分组' : '随心配'}
                        </div>
                        <div className="flex items-center">
                            <input 
                                className="bg-transparent font-bold text-sm text-gray-700 outline-none hover:bg-white hover:px-2 hover:py-1 rounded transition-all focus:bg-white focus:ring-2 focus:ring-[#00C06B]/20 w-48"
                                value={group.name}
                                placeholder="请输入分组名称"
                                onChange={(e) => updateGroup(index, { name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => moveGroup(index, 'up')} 
                            disabled={index === 0}
                            className="p-1.5 hover:bg-white rounded text-gray-400 hover:text-[#00C06B] disabled:opacity-30"
                        >
                            <ChevronUp size={16}/>
                        </button>
                        <button 
                            onClick={() => moveGroup(index, 'down')} 
                            disabled={index === groups.length - 1}
                            className="p-1.5 hover:bg-white rounded text-gray-400 hover:text-[#00C06B] disabled:opacity-30"
                        >
                            <ChevronDown size={16}/>
                        </button>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <button 
                            onClick={() => removeGroup(index)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>

                {/* Group Configuration Area */}
                <div className="p-5">
                    {/* Optional Group Settings */}
                    {group.type === 'optional' && (
                        <div className="mb-6 space-y-4 pb-6 border-b border-gray-100">
                            <div className="flex items-start space-x-8">
                                <div className="flex items-center space-x-2 w-24 pt-2">
                                    <span className="text-sm font-bold text-gray-600">相对价</span>
                                    <Switch checked={group.relativePricing || false} onChange={(checked) => updateGroup(index, { relativePricing: checked })} />
                                </div>
                                <div className="flex-1 text-xs text-gray-400 pt-2 leading-relaxed">
                                    开启后，用户点单时该随心配会以默认子商品的加价为基础价，其他子商品的加价金额将按基础价计算 <span className="text-[#00C06B] cursor-pointer">查看示例</span>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-8">
                                <div className="w-24 pt-2 text-sm font-bold text-gray-600">备注</div>
                                <div className="flex-1">
                                    <textarea 
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B] min-h-[60px]" 
                                        placeholder="请输入备注"
                                        value={group.note || ''}
                                        onChange={(e) => updateGroup(index, { note: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="bg-gray-50/50 rounded-lg border border-gray-100 overflow-hidden mb-6">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 text-xs font-bold text-gray-500 border-b border-gray-200">
                            <div className="col-span-3">商品信息</div>
                            <div className="col-span-2">规格</div>
                            <div className="col-span-2">数量</div>
                            {group.type !== 'fixed' && <div className="col-span-1 text-center">默认</div>}
                            <div className="col-span-2">{group.type === 'fixed' ? '价格/加价' : '加价'}</div>
                            <div className="col-span-2 text-right">操作</div>
                        </div>

                        {/* Table Rows */}
                        {group.items.length > 0 ? (
                            group.items.map((item, itemIdx) => (
                                <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                                    <div className="col-span-3">
                                        <div className="font-medium text-sm text-gray-800">{item.name}</div>
                                        <div className="text-xs text-gray-400">{item.productId}</div>
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-600">{item.spec}</div>
                                    <div className="col-span-2 flex items-center">
                                        <div className="flex items-center border border-gray-200 rounded bg-white">
                                            <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-50">-</button>
                                            <input className="w-8 text-center text-xs outline-none" value={item.quantity} readOnly />
                                            <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-50">+</button>
                                        </div>
                                    </div>
                                    {group.type !== 'fixed' && (
                                        <div className="col-span-1 flex justify-center">
                                            <Switch checked={item.isDefault || false} onChange={() => {}} size="sm"/>
                                        </div>
                                    )}
                                    <div className="col-span-2">
                                        <div className="flex items-center border border-gray-200 rounded bg-white">
                                            <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-50">-</button>
                                            <input className="w-12 text-center text-xs outline-none" value={item.price || item.extraPrice || 0} readOnly />
                                            <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-50">+</button>
                                        </div>
                                        {group.type === 'fixed' && (
                                            <div className="mt-1 flex items-center">
                                                <Switch checked={item.packageFee || false} onChange={() => {}} size="sm"/>
                                                <span className="text-[10px] text-gray-400 ml-1">包装费</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <button className="text-xs text-red-500 hover:text-red-600 font-medium">删除</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-gray-400 text-xs">暂无商品</div>
                        )}
                        
                        {/* Add Button */}
                        <div className="px-4 py-3 bg-white border-t border-gray-100">
                            <button className="flex items-center px-3 py-1.5 border border-gray-200 rounded hover:border-[#00C06B] hover:text-[#00C06B] text-xs font-bold text-gray-600 transition-colors">
                                <Plus size={14} className="mr-1"/> 添加商品
                            </button>
                        </div>
                    </div>

                    {/* Group Footer Settings */}
                    {group.type !== 'fixed' && (
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-gray-600 w-20">分组设置:</span>
                                <div className="flex items-center space-x-6">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${group.isMustSelect ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300'}`}>
                                            {group.isMustSelect && <Check size={10} className="text-white"/>}
                                        </div>
                                        <span className="text-sm text-gray-700">分组为必选，分组内商品必须选择</span>
                                    </label>
                                    <div className="flex items-center bg-gray-100 rounded px-2 py-1">
                                        <span className="text-xs text-gray-500 mr-2">当前 {group.minSelect} 选 {group.maxSelect}</span>
                                        <Plus size={12} className="text-gray-400"/>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 pl-[88px]">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!group.isMustSelect ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300'}`}>
                                        {!group.isMustSelect && <Check size={10} className="text-white"/>}
                                    </div>
                                    <span className="text-sm text-gray-700">分组为可选</span>
                                </label>
                                <span className="text-sm text-gray-600 ml-4">单个商品可多选，限制分组内商品</span>
                                <div className="flex items-center border border-gray-200 rounded bg-white w-24">
                                    <button className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50">-</button>
                                    <input className="flex-1 text-center text-xs outline-none" value="0" readOnly />
                                    <button className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50">+</button>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 pl-[88px]">
                                <span className="text-sm text-gray-600">最多购买总数</span>
                                <div className="flex items-center border border-gray-200 rounded bg-white w-24">
                                    <button className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50">-</button>
                                    <input className="flex-1 text-center text-xs outline-none" value={group.maxTotalQuantity || 100} readOnly />
                                    <button className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50">+</button>
                                </div>
                            </div>

                            {group.type === 'optional' && (
                                <div className="flex items-center space-x-2 border-t border-gray-100 pt-4 mt-4">
                                    <span className="text-sm font-bold text-gray-600 w-24">保存为随心配:</span>
                                    <Switch checked={group.saveAsFreeGroup || false} onChange={(checked) => updateGroup(index, { saveAsFreeGroup: checked })} />
                                    <span className="text-xs text-gray-400 ml-2">开启后将保存到随心配分组列表，可在其他套餐中复用</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 px-8 bg-white border-b border-[#E8E8E8] flex justify-between items-center shrink-0 shadow-sm z-20">
                <div className="flex items-center">
                    <button onClick={onClose} className="mr-4 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={20} className="text-gray-600"/></button>
                    <div>
                        <h3 className="text-lg font-black text-[#1F2129]">创建套餐商品 (改进版)</h3>
                        <p className="text-xs text-gray-400 mt-0.5">当前类目: {category.name}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm">取消</button>
                    <button onClick={onClose} className="px-6 py-2 bg-[#1F2129] text-white font-bold rounded-lg shadow-lg hover:bg-black transition-all active:scale-95 text-sm flex items-center"><Check size={16} className="mr-2"/> 完成创建</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-48 bg-white border-r border-[#E8E8E8] py-6 flex flex-col space-y-1 overflow-y-auto no-scrollbar shrink-0">
                    <div className="px-6 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">填写导航</div>
                    {['basic', 'combo', 'display', 'sales'].map(section => (
                        <div 
                            key={section}
                            onClick={() => scrollToSection(section)}
                            className={`px-6 py-3 text-sm font-bold cursor-pointer border-r-[3px] transition-all flex items-center ${activeFormSection === section ? 'border-[#00C06B] text-[#00C06B] bg-[#00C06B]/5' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                        >
                            {section === 'basic' && '基础信息'}
                            {section === 'combo' && '套餐商品'}
                            {section === 'display' && '展示设置'}
                            {section === 'sales' && '售卖属性'}
                        </div>
                    ))}
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth no-scrollbar">
                    <div className="w-full max-w-[1200px] mx-auto pb-24 space-y-6">
                        
                        {/* Basic Section (Simplified) */}
                        <div id="basic" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="基础信息" icon={<FileText size={20}/>} />
                            <div className="grid grid-cols-2 gap-8">
                                <FormRow label="套餐名称" required><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]" placeholder="请输入套餐名称"/></FormRow>
                                <FormRow label="基础价格" required><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]" placeholder="0.00"/></FormRow>
                            </div>
                        </div>

                        {/* Combo Configuration Section */}
                        <div id="combo" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="套餐商品配置" icon={<Utensils size={20}/>} />
                            
                            {/* Pricing Type */}
                            <FormRow label="套餐计价类型" required>
                                <div className="flex space-x-6">
                                    <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setPricingType('markup')}>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${pricingType === 'markup' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                            {pricingType === 'markup' && <div className="w-2 h-2 bg-[#00C06B] rounded-full"/>}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">销售加价 <span className="text-xs text-[#00C06B] bg-[#00C06B]/10 px-1 rounded ml-1">推荐</span></span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer" onClick={() => setPricingType('combined')}>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${pricingType === 'combined' ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                            {pricingType === 'combined' && <div className="w-2 h-2 bg-[#00C06B] rounded-full"/>}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">合并计价</span>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {pricingType === 'markup' ? '套餐基础价格为基本费用，总价根据随心配商品加价波动' : '套餐内所有商品独立收费，总价根据用户选择商品合并计价'}
                                </p>
                            </FormRow>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 py-2">
                                <button onClick={() => addGroup('fixed')} className="flex items-center px-4 py-2 bg-white border border-[#00C06B] text-[#00C06B] rounded-lg text-sm font-bold hover:bg-[#E6F8F0] transition-colors shadow-sm">
                                    <Plus size={16} className="mr-1.5"/> 添加固定搭配
                                </button>
                                <button onClick={() => addGroup('fixed')} className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                                    <Plus size={16} className="mr-1.5"/> 添加固定搭配(多拼)
                                </button>
                                <div className="w-px h-8 bg-gray-200 mx-2"></div>
                                <button onClick={() => addGroup('free')} className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm group">
                                    <Sparkles size={16} className="mr-1.5 text-purple-500 group-hover:text-purple-600"/> 添加随心配
                                </button>
                                <button onClick={() => addGroup('optional')} className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                                    <LayoutGrid size={16} className="mr-1.5"/> 添加可选分组
                                </button>
                            </div>

                            {/* Group List */}
                            <div className="bg-gray-50/50 rounded-xl p-4 border border-dashed border-gray-200 min-h-[200px]">
                                {groups.length > 0 ? (
                                    groups.map((group, index) => renderGroupCard(group, index))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                        <Box size={32} className="mb-2 opacity-50"/>
                                        <span className="text-sm">暂无套餐内容，请点击上方按钮添加</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Other Sections (Placeholders) */}
                        <div id="display" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm min-h-[200px] flex items-center justify-center text-gray-400">
                            展示设置 (同标准商品)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
