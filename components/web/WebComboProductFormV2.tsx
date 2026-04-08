import React, { useState } from 'react';
import { ArrowLeft, FileText, Utensils, LayoutGrid, Check, Plus, Trash2, Settings, GripVertical, Info, Sparkles, ChevronDown, ChevronRight, X, Search, Filter, Edit2 } from 'lucide-react';
import { Category } from '../../types';
import { SectionHeader, FormRow, Switch } from './WebCommon';

// --- Types ---
type GroupType = 'fixed' | 'optional' | 'free';

interface ComboItem {
    id: string;
    productId: string;
    name: string;
    spec: string;
    quantity: number;
    printLabel?: boolean; // 固定搭配特有
    isDefault?: boolean; // 可选分组特有
    surcharge?: number;  // 可选分组特有
}

interface ComboGroup {
    id: string;
    type: GroupType;
    name: string; // 分组名称
    relativePrice?: boolean; // 可选分组特有：相对价
    isRequired?: boolean; // 可选分组特有：是否必选
    remark?: string;
    minSelect?: number; // 可选分组规则
    maxSelect?: number; // 可选分组规则
    templateId?: string; // 随心配特有
    saveAsFreeMatch?: boolean; // 可选分组特有：保存为随心配
    items: ComboItem[];
}

// --- Mock Data ---
const MOCK_FREE_TEMPLATES = [
    { id: 't1', name: '披萨随心配', code: '1', date: '2026-02-11 10:42:38', remark: '随心配默认备注', minSelect: 1, maxSelect: 3 },
    { id: 't2', name: '饮品二选一', code: '1', date: '2026-02-10 15:58:53', remark: '', minSelect: 1, maxSelect: 2 },
    { id: 't3', name: '主食二选一', code: '1', date: '2026-02-10 15:58:02', remark: '', minSelect: 1, maxSelect: 2 },
];

const MOCK_PRODUCTS = [
    { id: 'p1', name: '金穗祥虾贺岁披萨', spec: '默认', price: 39 },
    { id: 'p2', name: '全家福日式豚骨拉面', spec: '大份', price: 28 },
    { id: 'p3', name: '芝士玉子烧', spec: '默认', price: 15 },
    { id: 'p4', name: '0330标品-5', spec: '默认', price: 10 },
];

interface Props {
    category: Category;
    onClose: () => void;
}

export const WebComboProductFormV2: React.FC<Props> = ({ category, onClose }) => {
    const [activeSection, setActiveSection] = useState('basic');
    const [groups, setGroups] = useState<ComboGroup[]>([]);
    const [isFreeModalOpen, setIsFreeModalOpen] = useState(false);

    // 可选分组弹窗状态
    const [optionalModalConfig, setOptionalModalConfig] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        groupIndex?: number;
        data: Partial<ComboGroup>;
        affectedStoreCount?: number; // 模拟：被多少门店关联
    }>({ isOpen: false, mode: 'create', data: {} });

    // 商品选择弹窗状态
    const [productModalConfig, setProductModalConfig] = useState<{
        isOpen: boolean;
        groupIndex?: number;
    }>({ isOpen: false });
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    // 拖拽相关状态
    const [draggedGroupIdx, setDraggedGroupIdx] = useState<number | null>(null);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // --- Actions ---
    const addGroup = (type: GroupType) => {
        if (type === 'free') {
            setIsFreeModalOpen(true);
            return;
        }

        if (type === 'optional') {
            setOptionalModalConfig({
                isOpen: true,
                mode: 'create',
                data: { name: '', isRequired: true, minSelect: 1, maxSelect: 100, relativePrice: false, remark: '', saveAsFreeMatch: false }
            });
            return;
        }

        const newGroup: ComboGroup = {
            id: `g_${Date.now()}`,
            type,
            name: type === 'fixed' ? '固定搭配' : '',
            items: []
        };
        setGroups([...groups, newGroup]);
    };

    const saveOptionalGroup = (saveAsNew: boolean = false) => {
        if (optionalModalConfig.mode === 'create' || saveAsNew) {
            const newGroup: ComboGroup = {
                id: `g_${Date.now()}`,
                type: 'optional',
                name: optionalModalConfig.data.name || '未命名分组',
                isRequired: optionalModalConfig.data.isRequired,
                minSelect: optionalModalConfig.data.minSelect,
                maxSelect: optionalModalConfig.data.maxSelect,
                relativePrice: optionalModalConfig.data.relativePrice,
                remark: optionalModalConfig.data.remark,
                saveAsFreeMatch: optionalModalConfig.data.saveAsFreeMatch,
                items: optionalModalConfig.data.items || [] // 继承原有商品
            };
            
            if (saveAsNew && optionalModalConfig.groupIndex !== undefined) {
                // 另存为新分组：替换原有位置的分组为新ID的分组
                const newGroups = [...groups];
                newGroups[optionalModalConfig.groupIndex] = newGroup;
                setGroups(newGroups);
            } else {
                setGroups([...groups, newGroup]);
            }
        } else if (optionalModalConfig.mode === 'edit' && optionalModalConfig.groupIndex !== undefined) {
            const newGroups = [...groups];
            newGroups[optionalModalConfig.groupIndex] = {
                ...newGroups[optionalModalConfig.groupIndex],
                ...optionalModalConfig.data
            };
            setGroups(newGroups);
        }
        setOptionalModalConfig({ isOpen: false, mode: 'create', data: {} });
    };

    const editOptionalGroup = (index: number) => {
        // 模拟：随机生成 0 或 大于0 的门店关联数
        const mockAffectedCount = Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 1 : 0;
        
        setOptionalModalConfig({
            isOpen: true,
            mode: 'edit',
            groupIndex: index,
            data: { ...groups[index] },
            affectedStoreCount: mockAffectedCount
        });
    };

    const removeGroup = (id: string) => {
        setGroups(groups.filter(g => g.id !== id));
    };

    const handleFreeTemplateSelect = (template: typeof MOCK_FREE_TEMPLATES[0]) => {
        const newGroup: ComboGroup = {
            id: `g_${Date.now()}`,
            type: 'free',
            name: template.name,
            templateId: template.id,
            remark: template.remark,
            minSelect: template.minSelect,
            maxSelect: template.maxSelect,
            items: [
                { id: `i_${Date.now()}`, productId: 'p1', name: '金穗祥虾贺岁披萨', spec: '默认', quantity: 1 },
                { id: `i_${Date.now()+1}`, productId: 'p2', name: '全家福日式豚骨拉面', spec: '大份', quantity: 1 }
            ] // 模拟从模板拉取的商品
        };
        setGroups([...groups, newGroup]);
        setIsFreeModalOpen(false);
    };

    const handleAddProducts = () => {
        if (productModalConfig.groupIndex === undefined) return;
        
        const newGroups = [...groups];
        const group = newGroups[productModalConfig.groupIndex];
        
        const productsToAdd = MOCK_PRODUCTS.filter(p => selectedProductIds.includes(p.id));
        
        productsToAdd.forEach(p => {
            group.items.push({
                id: `i_${Date.now()}_${Math.random()}`,
                productId: p.id,
                name: p.name,
                spec: p.spec,
                quantity: 1,
                printLabel: true,
                isDefault: false,
                surcharge: 0
            });
        });
        
        setGroups(newGroups);
        setProductModalConfig({ isOpen: false });
    };

    // --- Drag & Drop ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedGroupIdx(index);
        e.dataTransfer.effectAllowed = 'move';
        // 使拖拽时的视觉效果半透明
        setTimeout(() => {
            if (e.target instanceof HTMLElement) e.target.classList.add('opacity-50');
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedGroupIdx(null);
        if (e.target instanceof HTMLElement) e.target.classList.remove('opacity-50');
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedGroupIdx === null || draggedGroupIdx === index) return;

        const newGroups = [...groups];
        const draggedItem = newGroups[draggedGroupIdx];
        newGroups.splice(draggedGroupIdx, 1);
        newGroups.splice(index, 0, draggedItem);
        
        setDraggedGroupIdx(index);
        setGroups(newGroups);
    };

    return (
        <div className="absolute inset-0 z-50 bg-[#F5F6FA] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="h-14 bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center">
                    <button onClick={onClose} className="mr-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-800 text-lg">创建套餐商品 (全新重构)</span>
                            <span className="text-[10px] bg-[#00C06B]/10 text-[#00C06B] px-2 py-0.5 rounded-full font-bold border border-[#00C06B]/20">类目: {category.name}</span>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors">取消</button>
                    <button className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-[#00C06B] hover:bg-[#00A35B] shadow-md shadow-[#00C06B]/20 transition-all active:scale-95">保存商品</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Navigation */}
                <div className="w-48 bg-white border-r border-[#E8E8E8] py-6 flex flex-col space-y-1 overflow-y-auto shrink-0">
                    <div className="px-6 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">填写导航</div>
                    {['basic', 'combo'].map(section => (
                        <div 
                            key={section}
                            onClick={() => scrollToSection(section)}
                            className={`px-6 py-3 text-sm font-bold cursor-pointer border-r-[3px] transition-all flex items-center ${activeSection === section ? 'border-[#00C06B] text-[#00C06B] bg-[#00C06B]/5' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                        >
                            {section === 'basic' && '基础信息'}
                            {section === 'combo' && '套餐商品配置'}
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    <div className="max-w-[1000px] mx-auto space-y-6 pb-32">
                        
                        {/* Section: Basic */}
                        <div id="basic" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="基础信息" icon={<FileText size={20}/>} />
                            <div className="grid grid-cols-2 gap-8">
                                <FormRow label="套餐名称" required><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]" placeholder="请输入套餐名称"/></FormRow>
                                <FormRow label="基础价格" required><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]" placeholder="0.00"/></FormRow>
                            </div>
                        </div>

                        {/* Section: Combo */}
                        <div id="combo" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6 min-h-[400px]">
                            <SectionHeader title="套餐商品配置" icon={<Utensils size={20}/>} />
                            
                            <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                                <span className="text-sm font-bold text-gray-600 mr-2">添加配置:</span>
                                {/* 固定搭配仅允许添加一组 */}
                                {!groups.some(g => g.type === 'fixed') && (
                                    <button onClick={() => addGroup('fixed')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:text-[#00C06B] hover:border-[#00C06B]/30 hover:bg-[#00C06B]/5 transition-colors flex items-center shadow-sm">
                                        <Plus size={16} className="mr-2"/> 固定搭配
                                    </button>
                                )}
                                <button onClick={() => addGroup('optional')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:text-[#00C06B] hover:border-[#00C06B]/30 hover:bg-[#00C06B]/5 transition-colors flex items-center shadow-sm">
                                    <Plus size={16} className="mr-2"/> 可选分组
                                </button>
                                <button onClick={() => addGroup('free')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:text-[#00C06B] hover:border-[#00C06B]/30 hover:bg-[#00C06B]/5 transition-colors flex items-center shadow-sm">
                                    <Plus size={16} className="mr-2"/> 选择随心配
                                </button>
                            </div>

                            {groups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                                    <Sparkles size={32} className="text-gray-300 mb-4" />
                                    <span className="text-gray-400 font-medium text-sm">暂无配置，请点击上方按钮添加套餐明细</span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {groups.map((group, index) => (
                                        <div 
                                            key={group.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group/card"
                                        >
                                            {/* Card Header */}
                                            <div className={`px-6 py-4 border-b cursor-move ${group.type === 'free' ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-gray-100'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <GripVertical size={18} className="text-gray-400 cursor-move hover:text-gray-600" />
                                                        <span className="font-bold text-gray-800 text-base flex items-center">
                                                            {group.type === 'fixed' ? (
                                                                <>
                                                                    <span>固定搭配：</span>
                                                                    <input 
                                                                        type="text" 
                                                                        value={group.name} 
                                                                        onChange={(e) => {
                                                                            const newGroups = [...groups];
                                                                            newGroups[index].name = e.target.value;
                                                                            setGroups(newGroups);
                                                                        }}
                                                                        placeholder="请输入分组名称"
                                                                        className="bg-transparent border-b border-dashed border-gray-300 focus:border-[#00C06B] outline-none text-base font-bold text-gray-800 w-48 px-1 py-0.5 placeholder:font-normal placeholder:text-sm"
                                                                    />
                                                                </>
                                                            ) : 
                                                             group.type === 'optional' ? `可选分组名称：${group.name}` : 
                                                             `随心配分组名称：${group.name}`}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        {group.type === 'optional' && (
                                                            <button onClick={() => editOptionalGroup(index)} className="text-sm text-[#00C06B] hover:text-[#00A35B] font-medium">
                                                                修改
                                                            </button>
                                                        )}
                                                        <button className="text-sm text-[#00C06B] hover:text-[#00A35B] font-medium">
                                                            更改排序
                                                        </button>
                                                        <button onClick={() => removeGroup(group.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {group.type !== 'fixed' && (
                                                    <div className="flex items-center space-x-8 text-sm text-gray-600 pl-7">
                                                        {group.type === 'free' && <span>分组编码：{group.templateId || '1'}</span>}
                                                        <span>备注：{group.remark || '--'}</span>
                                                        <span>
                                                            分组设置：
                                                            {group.type === 'free' ? '随心配' : '商品'}
                                                            {group.type === 'free' ? `${group.maxSelect || 3}选${group.minSelect || 1}` : 
                                                             group.isRequired === false ? 
                                                                (group.maxSelect ? `${group.maxSelect}选${group.minSelect || 0}` : `选${group.minSelect || 0}`) : 
                                                                (group.maxSelect ? `${group.maxSelect}选${group.minSelect || 1}` : `选${group.minSelect || 1}`)
                                                            }
                                                        </span>
                                                        <span>是否为锅底：否</span>
                                                        {group.type === 'optional' && group.relativePrice && <span>相对价：是</span>}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-0">
                                                {/* Items Table */}
                                                <div className="w-full text-sm">
                                                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500">
                                                        <div className="col-span-1 text-center">排序</div>
                                                        <div className="col-span-3">商品名称</div>
                                                        <div className="col-span-2">商品规格</div>
                                                        <div className="col-span-2 text-center">数量</div>
                                                        {group.type === 'optional' && <div className="col-span-2 text-center">加价/默认</div>}
                                                        {group.type === 'fixed' && <div className="col-span-2 text-center">是否打印</div>}
                                                        {group.type === 'free' && <div className="col-span-2 text-center">来源</div>}
                                                        <div className="col-span-2 text-right">操作</div>
                                                    </div>
                                                    
                                                    {group.items.length === 0 ? (
                                                        <div className="py-8 text-center text-sm text-gray-400">暂无商品数据</div>
                                                    ) : (
                                                        group.items.map((item, i) => (
                                                            <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-50 items-center hover:bg-gray-50/50 transition-colors">
                                                                <div className="col-span-1 text-center text-gray-400">{i + 1}</div>
                                                                <div className="col-span-3 font-bold text-gray-800 truncate">{item.name}</div>
                                                                <div className="col-span-2 text-gray-500 truncate">{item.spec}</div>
                                                                <div className="col-span-2 flex justify-center">
                                                                    {group.type === 'free' ? (
                                                                        <span className="text-gray-500">{item.quantity}</span>
                                                                    ) : (
                                                                        <input type="number" defaultValue={item.quantity} className="w-16 border border-gray-200 rounded px-2 py-1 text-center outline-none focus:border-[#00C06B] text-xs"/>
                                                                    )}
                                                                </div>
                                                                
                                                                {group.type === 'optional' && (
                                                                    <div className="col-span-2 flex items-center justify-center space-x-2">
                                                                        <input type="number" placeholder="加价" className="w-16 border border-gray-200 rounded px-2 py-1 text-center outline-none focus:border-[#00C06B] text-xs"/>
                                                                        <label className="flex items-center space-x-1 cursor-pointer">
                                                                            <input type="checkbox" className="w-3 h-3 accent-[#00C06B]" />
                                                                            <span className="text-[10px] text-gray-500">默认</span>
                                                                        </label>
                                                                    </div>
                                                                )}
                                                                
                                                                {group.type === 'fixed' && (
                                                                    <div className="col-span-2 flex justify-center">
                                                                        <Switch active={item.printLabel !== false} onClick={() => {}} />
                                                                    </div>
                                                                )}

                                                                {group.type === 'free' && (
                                                                    <div className="col-span-2 text-center text-[10px] text-orange-500">模板同步</div>
                                                                )}

                                                                <div className="col-span-2 text-right">
                                                                    {group.type === 'free' ? (
                                                                        <span className="text-[10px] text-gray-400">不可编辑</span>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => {
                                                                                const newGroups = [...groups];
                                                                                newGroups[index].items = newGroups[index].items.filter(it => it.id !== item.id);
                                                                                setGroups(newGroups);
                                                                            }}
                                                                            className="text-sm font-bold text-red-500 hover:text-red-600"
                                                                        >
                                                                            删除
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Add Item Button */}
                                                {group.type !== 'free' && (
                                                    <div className="px-6 py-4 bg-gray-50/30">
                                                        <button 
                                                            onClick={() => {
                                                                setProductModalConfig({ isOpen: true, groupIndex: index });
                                                                setSelectedProductIds([]);
                                                            }}
                                                            className="px-4 py-2 bg-[#00C06B] text-white rounded text-sm font-bold hover:bg-[#00A35B] transition-colors flex items-center shadow-sm"
                                                        >
                                                            添加商品
                                                        </button>
                                                    </div>
                                                )}
                                                {group.type === 'free' && (
                                                    <div className="px-6 py-3 bg-orange-50/30 text-xs text-orange-600 flex items-center justify-center">
                                                        <Info size={12} className="mr-1"/> 此模块受随心配模板控制，商品明细及规则不可在此修改
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Free Template Selection Modal */}
            {isFreeModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-[800px] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">添加分组 (随心配模板)</h3>
                            <button onClick={() => setIsFreeModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <div className="flex space-x-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex-1 flex items-center space-x-2">
                                    <span className="text-sm text-gray-500 whitespace-nowrap">分组名称:</span>
                                    <input type="text" placeholder="请输入分组名称" className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:border-[#00C06B]"/>
                                </div>
                                <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-bold hover:bg-[#00A35B] transition-colors">筛选</button>
                            </div>
                            
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500">
                                    <div className="col-span-2">分组名称</div>
                                    <div className="col-span-1">分组编码</div>
                                    <div className="col-span-1">创建时间</div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {MOCK_FREE_TEMPLATES.map(t => (
                                        <div 
                                            key={t.id} 
                                            onClick={() => handleFreeTemplateSelect(t)}
                                            className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-50 text-sm cursor-pointer hover:bg-[#00C06B]/5 hover:text-[#00C06B] transition-colors group"
                                        >
                                            <div className="col-span-2 font-bold text-gray-800 group-hover:text-[#00C06B]">{t.name}</div>
                                            <div className="col-span-1 text-gray-500">{t.code}</div>
                                            <div className="col-span-1 text-gray-500">{t.date}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Optional Group Settings Modal */}
            {optionalModalConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-[700px] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">{optionalModalConfig.mode === 'create' ? '添加可选分组' : '编辑可选分组'}</h3>
                            <button onClick={() => setOptionalModalConfig({ isOpen: false, mode: 'create', data: {} })} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <FormRow label="可选分组名称" required>
                                <input 
                                    type="text" 
                                    value={optionalModalConfig.data.name || ''} 
                                    onChange={(e) => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, name: e.target.value } })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]" 
                                    placeholder="请输入可选分组名称"
                                />
                            </FormRow>
                            
                            <FormRow label="相对价">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center h-[24px]">
                                        <Switch 
                                            active={optionalModalConfig.data.relativePrice || false} 
                                            onClick={() => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, relativePrice: !optionalModalConfig.data.relativePrice } })} 
                                        />
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        开启后，用户点单时该随心配会以默认子商品的加价为基础价，其他子商品的加价金额将按基础价计算 <span className="text-[#00C06B] cursor-pointer hover:underline">查看示例</span>
                                    </div>
                                </div>
                            </FormRow>

                            <FormRow label="备注">
                                <textarea 
                                    value={optionalModalConfig.data.remark || ''}
                                    onChange={(e) => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, remark: e.target.value } })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B] resize-none h-20" 
                                    placeholder="请输入备注"
                                />
                            </FormRow>

                            {/* 此处省略了商品信息表格的完整实现，保持在主卡片中维护商品 */}
                            <FormRow label="商品信息" required>
                                <div className="text-sm text-gray-400 bg-gray-50 border border-gray-200 border-dashed rounded-lg p-4 text-center">
                                    <div className="mb-2">可在列表卡片中直接添加和管理商品</div>
                                    <button onClick={() => setOptionalModalConfig({ isOpen: false, mode: 'create', data: {} })} className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] transition-colors">
                                        去添加商品
                                    </button>
                                </div>
                            </FormRow>

                            <FormRow label="分组设置" required>
                                <div className="flex flex-col space-y-4">
                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input 
                                                type="radio" 
                                                name="isRequired" 
                                                className="peer sr-only" 
                                                checked={optionalModalConfig.data.isRequired !== false} 
                                                onChange={() => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, isRequired: true, minSelect: Math.max(1, optionalModalConfig.data.minSelect || 1) } })}
                                            />
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 peer-checked:border-[#00C06B] group-hover:border-[#00C06B]/50 transition-colors"></div>
                                            <div className="absolute w-2 h-2 rounded-full bg-[#00C06B] opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                        </div>
                                        <span className={`text-sm ${optionalModalConfig.data.isRequired !== false ? 'text-[#00C06B]' : 'text-gray-700'}`}>分组为必选，分组内商品必须选择</span>
                                        <div className="flex items-center border border-gray-200 rounded overflow-hidden h-8">
                                            <button 
                                                className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-r border-gray-200 disabled:opacity-50"
                                                onClick={(e) => { e.preventDefault(); setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, minSelect: Math.max(1, (optionalModalConfig.data.minSelect || 1) - 1) } }); }}
                                                disabled={optionalModalConfig.data.isRequired === false}
                                            >−</button>
                                            <input 
                                                type="number" 
                                                value={optionalModalConfig.data.isRequired !== false ? (optionalModalConfig.data.minSelect || 1) : ''} 
                                                onChange={(e) => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, minSelect: parseInt(e.target.value) || 1 } })}
                                                disabled={optionalModalConfig.data.isRequired === false}
                                                className="w-12 text-center text-sm outline-none focus:bg-gray-50 disabled:bg-gray-100"
                                            />
                                            <button 
                                                className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-l border-gray-200 disabled:opacity-50"
                                                onClick={(e) => { e.preventDefault(); setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, minSelect: (optionalModalConfig.data.minSelect || 1) + 1 } }); }}
                                                disabled={optionalModalConfig.data.isRequired === false}
                                            >+</button>
                                        </div>
                                    </label>

                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input 
                                                type="radio" 
                                                name="isRequired" 
                                                className="peer sr-only" 
                                                checked={optionalModalConfig.data.isRequired === false} 
                                                onChange={() => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, isRequired: false, minSelect: 0 } })}
                                            />
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 peer-checked:border-[#00C06B] group-hover:border-[#00C06B]/50 transition-colors"></div>
                                            <div className="absolute w-2 h-2 rounded-full bg-[#00C06B] opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                        </div>
                                        <span className={`text-sm ${optionalModalConfig.data.isRequired === false ? 'text-[#00C06B]' : 'text-gray-700'}`}>分组为可选，单个商品可多选，限制分组内商品</span>
                                        <div className="flex items-center border border-gray-200 rounded overflow-hidden h-8">
                                            <button 
                                                className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-r border-gray-200 disabled:opacity-50"
                                                onClick={(e) => { e.preventDefault(); setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, minSelect: Math.max(0, (optionalModalConfig.data.minSelect || 0) - 1) } }); }}
                                                disabled={optionalModalConfig.data.isRequired !== false}
                                            >−</button>
                                            <input 
                                                type="number" 
                                                value={optionalModalConfig.data.isRequired === false ? (optionalModalConfig.data.minSelect || 0) : ''} 
                                                onChange={(e) => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, minSelect: parseInt(e.target.value) || 0 } })}
                                                disabled={optionalModalConfig.data.isRequired !== false}
                                                className="w-12 text-center text-sm outline-none focus:bg-gray-50 disabled:bg-gray-100"
                                            />
                                            <button 
                                                className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-l border-gray-200 disabled:opacity-50"
                                                onClick={(e) => { e.preventDefault(); setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, minSelect: (optionalModalConfig.data.minSelect || 0) + 1 } }); }}
                                                disabled={optionalModalConfig.data.isRequired !== false}
                                            >+</button>
                                        </div>
                                    </label>

                                    <div className="flex items-center space-x-3 pl-7">
                                        <span className="text-sm text-gray-700">最多购买总数</span>
                                        <div className="flex items-center border border-gray-200 rounded overflow-hidden h-8">
                                            <button 
                                                className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-r border-gray-200"
                                                onClick={(e) => { e.preventDefault(); setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, maxSelect: Math.max(1, (optionalModalConfig.data.maxSelect || 100) - 1) } }); }}
                                            >−</button>
                                            <input 
                                                type="number" 
                                                value={optionalModalConfig.data.maxSelect || 100} 
                                                onChange={(e) => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, maxSelect: parseInt(e.target.value) || 100 } })}
                                                className="w-16 text-center text-sm outline-none focus:bg-gray-50"
                                            />
                                            <button 
                                                className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-l border-gray-200"
                                                onClick={(e) => { e.preventDefault(); setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, maxSelect: (optionalModalConfig.data.maxSelect || 100) + 1 } }); }}
                                            >+</button>
                                        </div>
                                    </div>
                                </div>
                            </FormRow>

                            <FormRow label="保存为随心配">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center h-[24px]">
                                        <Switch 
                                            active={optionalModalConfig.data.saveAsFreeMatch || false} 
                                            onClick={() => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, saveAsFreeMatch: !optionalModalConfig.data.saveAsFreeMatch } })} 
                                        />
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        开启后将保存到随心配分组列表，可在其他套餐中复用
                                    </div>
                                </div>
                            </FormRow>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex-1">
                                {optionalModalConfig.mode === 'edit' && (optionalModalConfig.affectedStoreCount || 0) > 0 && (
                                    <div className="text-xs text-orange-500 font-medium flex items-center">
                                        <Info size={14} className="mr-1"/> 该分组已被 {optionalModalConfig.affectedStoreCount} 家门店商品关联，修改将全局同步。
                                    </div>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={() => setOptionalModalConfig({ isOpen: false, mode: 'create', data: {} })} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-white border border-gray-200 transition-colors">取消</button>
                                {optionalModalConfig.mode === 'edit' && (optionalModalConfig.affectedStoreCount || 0) > 0 ? (
                                    <>
                                        <button 
                                            onClick={() => saveOptionalGroup(true)} 
                                            className="px-4 py-2 rounded-lg text-sm font-bold text-[#00C06B] bg-white border border-[#00C06B] hover:bg-[#00C06B]/5 transition-colors"
                                        >
                                            另存为新分组
                                        </button>
                                        <button 
                                            onClick={() => saveOptionalGroup(false)} 
                                            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all active:scale-95"
                                        >
                                            确认修改全局
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => saveOptionalGroup(false)} 
                                        className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-[#00C06B] hover:bg-[#00A35B] shadow-md shadow-[#00C06B]/20 transition-all active:scale-95"
                                    >
                                        保存
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Product Selection Modal */}
            {productModalConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl w-[800px] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">选择商品</h3>
                            <button onClick={() => setProductModalConfig({ isOpen: false })} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <div className="flex space-x-3 mb-6">
                                <input type="text" placeholder="搜索商品名称" className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:border-[#00C06B]"/>
                                <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-bold hover:bg-[#00A35B] transition-colors">搜索</button>
                            </div>
                            
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500">
                                    <div className="col-span-1 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="w-3.5 h-3.5 accent-[#00C06B]"
                                            checked={selectedProductIds.length === MOCK_PRODUCTS.length && MOCK_PRODUCTS.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedProductIds(MOCK_PRODUCTS.map(p => p.id));
                                                } else {
                                                    setSelectedProductIds([]);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-5">商品名称</div>
                                    <div className="col-span-3">商品规格</div>
                                    <div className="col-span-3">价格</div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {MOCK_PRODUCTS.map(p => (
                                        <div key={p.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-50 text-sm items-center hover:bg-[#00C06B]/5 transition-colors">
                                            <div className="col-span-1 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-3.5 h-3.5 accent-[#00C06B]"
                                                    checked={selectedProductIds.includes(p.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedProductIds([...selectedProductIds, p.id]);
                                                        } else {
                                                            setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-5 font-bold text-gray-800">{p.name}</div>
                                            <div className="col-span-3 text-gray-500">{p.spec}</div>
                                            <div className="col-span-3 text-gray-500">¥{p.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                            <button onClick={() => setProductModalConfig({ isOpen: false })} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-white border border-gray-200 transition-colors">取消</button>
                            <button 
                                onClick={handleAddProducts} 
                                disabled={selectedProductIds.length === 0}
                                className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-[#00C06B] hover:bg-[#00A35B] disabled:opacity-50 shadow-md shadow-[#00C06B]/20 transition-all active:scale-95"
                            >
                                确定添加 ({selectedProductIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};