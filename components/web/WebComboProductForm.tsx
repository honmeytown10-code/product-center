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
    showSettings?: boolean; // UI状态：是否展开高级设置
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
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [showFreeGroupModal, setShowFreeGroupModal] = useState(false);
    const [showProductSelector, setShowProductSelector] = useState<{ groupId: string; groupType: string } | null>(null);
    const [editingOptionalGroup, setEditingOptionalGroup] = useState<ComboGroup | null>(null);
    const [isNewOptionalGroup, setIsNewOptionalGroup] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<{groupId: string, index: number} | null>(null);

    // Mock 商品库 (用于选择)
    const MOCK_PRODUCTS_POOL = [
        { id: 'p1', name: '招牌珍珠奶茶', price: 15, specs: ['中杯', '大杯'] },
        { id: 'p2', name: '手打柠檬茶', price: 18, specs: ['标准'] },
        { id: 'p3', name: '芋圆波波奶茶', price: 16, specs: ['中杯', '大杯'] },
        { id: 'p4', name: '多肉葡萄', price: 22, specs: ['标准'] },
        { id: 'p5', name: '芝士莓莓', price: 24, specs: ['标准'] },
        { id: 'p6', name: '烤翅', price: 12, specs: ['2对', '4对'] },
        { id: 'p7', name: '薯条', price: 8, specs: ['中', '大'] },
    ];
    
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
            setShowFreeGroupModal(true);
        } else if (type === 'optional') {
            const newGroup: ComboGroup = {
                id: `g_${Date.now()}`,
                type: 'optional',
                name: '新可选分组',
                minSelect: 1,
                maxSelect: 1,
                items: [],
                isMustSelect: true,
                maxTotalQuantity: 100
            };
            setEditingOptionalGroup(newGroup);
            setIsNewOptionalGroup(true);
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

    // 处理随心配模板选择
    const handleSelectFreeGroup = (template: typeof MOCK_FREE_GROUPS[0]) => {
        const newGroup: ComboGroup = {
            id: `g_${Date.now()}`,
            type: 'free',
            name: template.name,
            minSelect: template.minSelect,
            maxSelect: template.maxSelect,
            items: template.items as ComboItem[],
            isMustSelect: true, // 随心配通常作为整体是可选或必选，这里简化
            maxTotalQuantity: template.maxSelect
        };
        setGroups([...groups, newGroup]);
        setShowFreeGroupModal(false);
    };

    // 处理单个/批量商品添加
    const handleAddProducts = (selectedProducts: any[]) => {
        if (!showProductSelector) return;
        
        const newGroups = [...groups];
        const targetGroupIndex = newGroups.findIndex(g => g.id === showProductSelector.groupId);
        
        if (targetGroupIndex > -1) {
            const newItems = selectedProducts.map(p => ({
                id: `i_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                productId: p.id,
                name: p.name,
                spec: p.specs[0] || '标准', // 默认选中第一个规格
                quantity: 1,
                price: showProductSelector.groupType === 'fixed' ? p.price : 0, // 固定搭配带入原价，可选默认为0
                extraPrice: 0,
                isDefault: false
            }));
            
            newGroups[targetGroupIndex].items = [
                ...newGroups[targetGroupIndex].items,
                ...newItems
            ];
            setGroups(newGroups);
        }
        setShowProductSelector(null);
    };
    // 处理可选分组保存
    const handleSaveOptionalGroup = (group: ComboGroup) => {
        if (isNewOptionalGroup) {
            setGroups([...groups, group]);
        } else {
            const newGroups = groups.map(g => g.id === group.id ? group : g);
            setGroups(newGroups);
        }
        setEditingOptionalGroup(null);
        setIsNewOptionalGroup(false);
    };

    // 排序逻辑
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Hide standard HTML5 drag image for custom styling if needed, or leave default
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // 必须阻止默认行为才能触发 drop
        if (draggedIndex === null || draggedIndex === index) return;
        
        const newGroups = [...groups];
        const draggedItem = newGroups[draggedIndex];
        newGroups.splice(draggedIndex, 1);
        newGroups.splice(index, 0, draggedItem);
        
        setDraggedIndex(index);
        setGroups(newGroups);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
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

    // 商品排序逻辑
    const handleItemDragStart = (e: React.DragEvent, groupId: string, index: number) => {
        e.stopPropagation(); // 阻止冒泡到分组拖拽
        setDraggedItemIndex({ groupId, index });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleItemDragOver = (e: React.DragEvent, groupId: string, index: number) => {
        e.preventDefault();
        if (!draggedItemIndex || draggedItemIndex.groupId !== groupId || draggedItemIndex.index === index) return;
        
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const newGroups = [...groups];
        const items = [...newGroups[groupIndex].items];
        const draggedItem = items[draggedItemIndex.index];
        
        items.splice(draggedItemIndex.index, 1);
        items.splice(index, 0, draggedItem);
        
        newGroups[groupIndex].items = items;
        setGroups(newGroups);
        setDraggedItemIndex({ groupId, index });
    };

    const handleItemDragEnd = () => {
        setDraggedItemIndex(null);
    };

    // 渲染分组卡片
    const renderGroupCard = (group: ComboGroup, index: number) => {
        const isFree = group.type === 'free';
        const fixedGroupTotalPrice = group.type === 'fixed' 
            ? group.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
            : 0;
        
        return (
            <div 
                key={group.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all mb-4 group/card relative ${draggedIndex === index ? 'opacity-50 border-dashed border-[#00C06B]' : 'border-gray-200'}`}
            >
                {/* 拖拽手柄区域 */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors z-10">
                    <GripVertical size={16} className="text-gray-300 group-hover/card:text-gray-500" />
                </div>

                {/* Group Header */}
                <div className="bg-gray-50 pl-10 pr-4 py-3 flex justify-between items-center border-b border-gray-100">
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
                                className="bg-transparent font-bold text-sm text-gray-700 outline-none hover:bg-white hover:px-2 hover:py-1 rounded transition-all focus:bg-white focus:ring-2 focus:ring-[#00C06B]/20 w-48 disabled:opacity-70 disabled:hover:bg-transparent"
                                value={group.name}
                                placeholder="请输入分组名称"
                                disabled={isFree}
                                onChange={(e) => updateGroup(index, { name: e.target.value })}
                            />
                        </div>
                        {isFree && (
                            <span className="text-[11px] text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded ml-2 flex items-center">
                                <FileText size={12} className="mr-1"/> 引用随心配模板
                            </span>
                        )}
                        {group.type === 'fixed' && group.items.length > 0 && (
                            // Reference price removed as per user request
                            null
                        )}
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        {isFree && (
                            <button 
                                onClick={() => setShowFreeGroupModal(true)}
                                className="text-xs text-[#00C06B] font-medium hover:text-[#009b56] px-2 py-1 bg-[#00C06B]/10 rounded mr-2"
                            >
                                更换模板
                            </button>
                        )}
                        <button 
                            onClick={() => removeGroup(index)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                            title="删除分组"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>

                {/* Group Configuration Area */}
                <div className="pl-10 pr-5 py-5">
                    {/* Optional Group Advanced Settings Toggle */}
                    {group.type === 'optional' && (
                        <div className="mb-4">
                            <button 
                                onClick={() => updateGroup(index, { showSettings: !group.showSettings })}
                                className="flex items-center text-xs text-gray-500 hover:text-[#00C06B] transition-colors font-medium"
                            >
                                <Settings size={14} className="mr-1"/> 
                                {group.showSettings ? '收起高级配置' : '展开高级配置'}
                                {group.showSettings ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/>}
                            </button>
                            
                            {group.showSettings && (
                                <div className="mt-3 p-4 bg-orange-50/30 rounded-lg border border-orange-100/50 space-y-4 animate-in slide-in-from-top-2">
                                    <div className="flex items-center space-x-8">
                                        <div className="flex items-center space-x-2 w-24">
                                            <span className="text-sm font-bold text-gray-600">相对价</span>
                                            <Switch checked={group.relativePricing || false} onChange={(checked) => updateGroup(index, { relativePricing: checked })} />
                                        </div>
                                        <div className="flex-1 text-xs text-gray-400">
                                            开启后，用户点单时该随心配会以默认子商品的加价为基础价计算 <span className="text-[#00C06B] cursor-pointer hover:underline">查看示例</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-8">
                                        <div className="w-24 pt-1 text-sm font-bold text-gray-600">备注说明</div>
                                        <div className="flex-1">
                                            <input 
                                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#00C06B]" 
                                                placeholder="用户点单时可见的分组提示说明"
                                                value={group.note || ''}
                                                onChange={(e) => updateGroup(index, { note: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="bg-gray-50/50 rounded-lg border border-gray-100 overflow-hidden mb-5">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100/80 text-xs font-bold text-gray-500 border-b border-gray-200">
                            <div className="col-span-4">商品信息</div>
                            <div className="col-span-2">规格</div>
                            <div className="col-span-2">数量</div>
                            {group.type !== 'fixed' && <div className="col-span-1 text-center">默认</div>}
                            <div className="col-span-2">{group.type === 'fixed' ? '价格/加价' : '加价'}</div>
                            {!isFree && <div className="col-span-1 text-right">操作</div>}
                        </div>

                        {/* Table Rows */}
                        {group.items.length > 0 ? (
                            group.items.map((item, itemIdx) => (
                                <div 
                                    key={item.id} 
                                    draggable={!isFree}
                                    onDragStart={(e) => handleItemDragStart(e, group.id, itemIdx)}
                                    onDragOver={(e) => handleItemDragOver(e, group.id, itemIdx)}
                                    onDragEnd={handleItemDragEnd}
                                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-gray-100 last:border-0 transition-colors relative ${isFree ? 'bg-white' : 'hover:bg-gray-50 cursor-grab active:cursor-grabbing'} ${draggedItemIndex?.groupId === group.id && draggedItemIndex?.index === itemIdx ? 'opacity-50 border-dashed border-[#00C06B]' : ''}`}
                                >
                                    <div className="col-span-4 flex items-center">
                                        {!isFree && (
                                            <div className="mr-2 text-gray-300 hover:text-gray-500 flex-shrink-0 cursor-grab active:cursor-grabbing">
                                                <GripVertical size={14} />
                                            </div>
                                        )}
                                        <div className="w-8 h-8 bg-gray-100 rounded mr-3 flex-shrink-0 flex items-center justify-center text-gray-400">
                                            <Coffee size={14} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-gray-800">{item.name}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">{item.productId}</div>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        {isFree ? (
                                            <span className="text-xs text-gray-600">{item.spec}</span>
                                        ) : (
                                            <span className="text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded">{item.spec}</span>
                                        )}
                                    </div>
                                    <div className="col-span-2 flex items-center">
                                        {isFree ? (
                                            <span className="text-sm font-medium text-gray-700">{item.quantity}</span>
                                        ) : (
                                            <div className="flex items-center border border-gray-200 rounded bg-white">
                                                <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50">-</button>
                                                <input className="w-8 text-center text-xs outline-none bg-transparent" value={item.quantity} readOnly />
                                                <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50">+</button>
                                            </div>
                                        )}
                                    </div>
                                    {group.type !== 'fixed' && (
                                        <div className="col-span-1 flex justify-center">
                                            {isFree ? (
                                                item.isDefault ? <Check size={16} className="text-[#00C06B]" /> : <span className="text-gray-300">-</span>
                                            ) : (
                                                <Switch checked={item.isDefault || false} onChange={() => {}} size="sm"/>
                                            )}
                                        </div>
                                    )}
                                    {group.type !== 'fixed' && (
                                        <div className="col-span-2">
                                            {isFree ? (
                                                <span className="text-sm font-medium text-gray-700">￥{item.price || item.extraPrice || 0}</span>
                                            ) : (
                                                <div className="flex items-center border border-gray-200 rounded bg-white">
                                                    <span className="text-gray-400 text-xs pl-2">￥</span>
                                                    <input className="w-10 text-center text-xs outline-none bg-transparent" value={item.price || item.extraPrice || 0} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {(!isFree && group.type !== 'optional') && (
                                        <div className="col-span-1 text-right">
                                            <button className="text-xs text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-gray-400 text-xs">暂无商品</div>
                        )}
                        
                        {/* Add Button */}
                        {!isFree && (
                            <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex items-center">
                                <button 
                                    onClick={() => setShowProductSelector({ groupId: group.id, groupType: group.type })}
                                    className="flex items-center text-xs font-bold text-[#00C06B] hover:text-[#009b56] transition-colors"
                                >
                                    <Plus size={14} className="mr-1"/> 添加商品
                                </button>
                                <span className="text-xs text-gray-300 mx-3">|</span>
                                <button className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">
                                    批量导入
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Group Footer Settings (For Optional & Free) */}
                    {group.type !== 'fixed' && (
                        <div className="flex items-center justify-between bg-gray-50/80 px-4 py-3 rounded-lg border border-gray-100">
                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-gray-600">必选设置:</span>
                                    {isFree ? (
                                        <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">{group.isMustSelect ? '必选分组' : '可选分组'}</span>
                                    ) : (
                                        <div className="flex items-center space-x-3 ml-2">
                                            <label className="flex items-center space-x-1.5 cursor-pointer">
                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${group.isMustSelect ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300'}`}>
                                                    {group.isMustSelect && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                                <span className="text-xs text-gray-700">必选分组</span>
                                            </label>
                                            <label className="flex items-center space-x-1.5 cursor-pointer">
                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${!group.isMustSelect ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300'}`}>
                                                    {!group.isMustSelect && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                                <span className="text-xs text-gray-700">可选分组</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="w-px h-4 bg-gray-200"></div>

                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-gray-600">选品规则:</span>
                                    {isFree ? (
                                        <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">选 {group.minSelect} 至 {group.maxSelect} 项</span>
                                    ) : (
                                        <div className="flex items-center text-xs">
                                            <span className="text-gray-500 mr-1">选</span>
                                            <input className="w-8 text-center border border-gray-200 rounded py-0.5 mx-1" value={group.minSelect || 1} />
                                            <span className="text-gray-500 mx-1">至</span>
                                            <input className="w-8 text-center border border-gray-200 rounded py-0.5 mx-1" value={group.maxSelect || 1} />
                                            <span className="text-gray-500 ml-1">项</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-px h-4 bg-gray-200"></div>

                                <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-gray-600">总数上限:</span>
                                    {isFree ? (
                                        <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">{group.maxTotalQuantity || 100}</span>
                                    ) : (
                                        <input className="w-12 text-center border border-gray-200 rounded py-0.5 text-xs" value={group.maxTotalQuantity || 100} />
                                    )}
                                </div>
                            </div>

                            {group.type === 'optional' && !isFree && (
                                <div className="flex items-center space-x-2">
                                    <Switch checked={group.saveAsFreeGroup || false} onChange={(checked) => updateGroup(index, { saveAsFreeGroup: checked })} size="sm"/>
                                    <span className="text-xs text-gray-500 font-medium">存为随心配模板</span>
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
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        addGroup('free');
                                    }} 
                                    className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm group"
                                >
                                    <Sparkles size={16} className="mr-1.5 text-purple-500 group-hover:text-purple-600"/> 添加随心配
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        addGroup('optional');
                                    }} 
                                    className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
                                >
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

            {/* 批量添加商品选择弹窗 */}
            {showProductSelector && (
                <ProductSelectorModal 
                    onClose={() => setShowProductSelector(null)}
                    onConfirm={handleAddProducts}
                    products={MOCK_PRODUCTS_POOL}
                />
            )}

            {/* 可选分组编辑器弹窗 */}
            {editingOptionalGroup && (
                <OptionalGroupEditorModal 
                    group={editingOptionalGroup}
                    isNew={isNewOptionalGroup}
                    onClose={() => {
                        setEditingOptionalGroup(null);
                        setIsNewOptionalGroup(false);
                    }}
                    onSave={handleSaveOptionalGroup}
                    productPool={MOCK_PRODUCTS_POOL}
                />
            )}
        </div>
    );
};

// 可选分组编辑器组件
const OptionalGroupEditorModal = ({ group, isNew, onClose, onSave, productPool }: { 
    group: ComboGroup, 
    isNew: boolean, 
    onClose: () => void, 
    onSave: (group: ComboGroup) => void,
    productPool: any[]
}) => {
    const [currentGroup, setCurrentGroup] = useState<ComboGroup>(JSON.parse(JSON.stringify(group)));
    const [showSelector, setShowSelector] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<{groupId: string, index: number} | null>(null);

    const updateField = (field: keyof ComboGroup, value: any) => {
        setCurrentGroup(prev => ({ ...prev, [field]: value }));
    };

    const addProducts = (products: any[]) => {
        const newItems = products.map(p => ({
            id: `i_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            productId: p.id,
            name: p.name,
            spec: p.specs[0] || '标准',
            quantity: 1,
            extraPrice: 0,
            isDefault: false
        }));
        setCurrentGroup(prev => ({ ...prev, items: [...prev.items, ...newItems] }));
        setShowSelector(false);
    };

    const updateItem = (index: number, field: keyof ComboItem, value: any) => {
        const newItems = [...currentGroup.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setCurrentGroup(prev => ({ ...prev, items: newItems }));
    };

    const removeItem = (index: number) => {
        const newItems = [...currentGroup.items];
        newItems.splice(index, 1);
        setCurrentGroup(prev => ({ ...prev, items: newItems }));
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-[800px] max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <LayoutGrid size={20} className="mr-2 text-orange-500"/>
                        {isNew ? '添加可选分组' : '编辑可选分组'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
                    {/* Basic Info */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">分组信息</h4>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 text-sm text-gray-500">分组名称</div>
                            <input 
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]" 
                                value={currentGroup.name}
                                onChange={e => updateField('name', e.target.value)}
                                placeholder="如：小料五选一"
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 text-sm text-gray-500">必选设置</div>
                            <div className="flex items-center space-x-4">
                                <label 
                                    className="flex items-center space-x-2 cursor-pointer"
                                    onClick={() => updateField('isMustSelect', true)}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${currentGroup.isMustSelect ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300'}`}>
                                        {currentGroup.isMustSelect && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-sm text-gray-700">必选分组</span>
                                </label>
                                <label 
                                    className="flex items-center space-x-2 cursor-pointer"
                                    onClick={() => updateField('isMustSelect', false)}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!currentGroup.isMustSelect ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300'}`}>
                                        {!currentGroup.isMustSelect && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-sm text-gray-700">可选分组</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 text-sm text-gray-500">选品规则</div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">最少选</span>
                                <input 
                                    type="number"
                                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm outline-none focus:border-[#00C06B]" 
                                    value={currentGroup.minSelect}
                                    onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        updateField('minSelect', val);
                                        updateField('isMustSelect', val > 0);
                                    }}
                                />
                                <span className="text-sm text-gray-600">项，最多选</span>
                                <input 
                                    type="number"
                                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm outline-none focus:border-[#00C06B]" 
                                    value={currentGroup.maxSelect}
                                    onChange={e => updateField('maxSelect', parseInt(e.target.value) || 1)}
                                />
                                <span className="text-sm text-gray-600">项</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 text-sm text-gray-500">总数上限</div>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="number"
                                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm outline-none focus:border-[#00C06B]" 
                                    value={currentGroup.maxTotalQuantity}
                                    onChange={e => updateField('maxTotalQuantity', parseInt(e.target.value) || 100)}
                                />
                                <span className="text-xs text-gray-400">限制该分组内商品购买总数</span>
                            </div>
                        </div>
                    </div>

                    {/* Product List */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-gray-700">分组商品 ({currentGroup.items.length})</h4>
                            <button 
                                onClick={() => setShowSelector(true)}
                                className="text-xs bg-[#00C06B] text-white px-3 py-1.5 rounded-lg hover:bg-[#009b56] transition-colors flex items-center font-bold"
                            >
                                <Plus size={14} className="mr-1"/> 添加商品
                            </button>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-200">
                                <div className="col-span-4">商品名称</div>
                                <div className="col-span-2">规格</div>
                                <div className="col-span-2">默认选中</div>
                                <div className="col-span-3">加价</div>
                                <div className="col-span-1 text-right">操作</div>
                            </div>
                            
                            <div className="max-h-[300px] overflow-y-auto">
                                {currentGroup.items.length > 0 ? (
                                    currentGroup.items.map((item, idx) => (
                                        <div 
                                            key={item.id} 
                                            draggable
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                setDraggedItemIndex({ groupId: currentGroup.id, index: idx });
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                if (draggedItemIndex?.index === idx) return;
                                                const newItems = [...currentGroup.items];
                                                const draggedItem = newItems[draggedItemIndex!.index];
                                                newItems.splice(draggedItemIndex!.index, 1);
                                                newItems.splice(idx, 0, draggedItem);
                                                setCurrentGroup(prev => ({ ...prev, items: newItems }));
                                                setDraggedItemIndex({ groupId: currentGroup.id, index: idx });
                                            }}
                                            onDragEnd={() => setDraggedItemIndex(null)}
                                            className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-gray-100 last:border-0 transition-colors cursor-grab active:cursor-grabbing ${draggedItemIndex?.index === idx ? 'opacity-50 border-dashed border-[#00C06B] bg-gray-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="col-span-4 flex items-center overflow-hidden">
                                                <div className="mr-2 text-gray-300 flex-shrink-0">
                                                    <GripVertical size={14} />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
                                            </div>
                                            <div className="col-span-2 text-xs text-gray-500">{item.spec}</div>
                                            <div className="col-span-2">
                                                <Switch checked={item.isDefault || false} onChange={(checked) => updateItem(idx, 'isDefault', checked)} size="sm"/>
                                            </div>
                                            <div className="col-span-3 flex items-center">
                                                <span className="text-xs text-gray-400 mr-1">+￥</span>
                                                <input 
                                                    type="number"
                                                    className="w-16 border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-[#00C06B]"
                                                    value={item.extraPrice}
                                                    onChange={e => updateItem(idx, 'extraPrice', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-gray-400 text-sm">暂无商品，请点击右上角添加</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-100">取消</button>
                    <button 
                        onClick={() => onSave(currentGroup)}
                        className="px-5 py-2 bg-[#1F2129] text-white rounded-lg text-sm font-bold hover:bg-black shadow-lg"
                    >
                        保存配置
                    </button>
                </div>
            </div>

            {/* Nested Product Selector */}
            {showSelector && (
                <div className="absolute inset-0 z-[110]">
                    <ProductSelectorModal 
                        onClose={() => setShowSelector(false)}
                        onConfirm={addProducts}
                        products={productPool}
                    />
                </div>
            )}
        </div>
    );
};

// 简单的商品选择器组件
const ProductSelectorModal = ({ onClose, onConfirm, products }: { onClose: () => void, onConfirm: (products: any[]) => void, products: any[] }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredProducts = products.filter(p => p.name.includes(searchTerm));

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">选择商品</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <input 
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#00C06B]"
                        placeholder="搜索商品名称..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredProducts.map(product => (
                        <div 
                            key={product.id} 
                            onClick={() => toggleSelect(product.id)}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(product.id) ? 'bg-[#00C06B]/5 border border-[#00C06B]/20' : 'hover:bg-gray-50 border border-transparent'}`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-4 ${selectedIds.includes(product.id) ? 'bg-[#00C06B] border-[#00C06B]' : 'border-gray-300'}`}>
                                {selectedIds.includes(product.id) && <Check size={12} className="text-white"/>}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800 text-sm">{product.name}</div>
                                <div className="text-xs text-gray-400">¥{product.price}</div>
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">无相关商品</div>}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl">
                    <span className="text-sm text-gray-600">已选 {selectedIds.length} 项</span>
                    <div className="flex space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">取消</button>
                        <button 
                            onClick={() => {
                                const selected = products.filter(p => selectedIds.includes(p.id));
                                onConfirm(selected);
                            }} 
                            disabled={selectedIds.length === 0}
                            className="px-6 py-2 bg-[#1F2129] text-white rounded-lg text-sm font-bold hover:bg-black disabled:opacity-50 transition-colors"
                        >
                            确认添加
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
