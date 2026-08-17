import React, { useMemo, useState } from 'react';
import { ArrowLeft, FileText, Utensils, LayoutGrid, Plus, Trash2, Settings, GripVertical, Info, Sparkles, ChevronDown, ChevronUp, X, Search, ImageIcon, Clock3 } from 'lucide-react';
import { Category } from '../../types';
import { SectionHeader, FormRow, Switch } from './WebCommon';

// --- Types ---
type GroupType = 'fixed' | 'optional' | 'free';
type SectionId = 'basic' | 'combo' | 'display' | 'sales' | 'settings';

type ComboFormState = {
    name: string;
    price: string;
    frontCategory: string;
    backCategory: string;
    unit: string;
    remark: string;
    image: string;
    listDesc: string;
    descTags: string;
    badge: string;
    badgeDate: string;
    detailImages: string;
    richDesc: string;
    detailBottomImage: string;
    video: string;
    minPurchaseEnabled: boolean;
    minPurchaseValue: string;
    maxPurchaseEnabled: boolean;
    maxPurchaseValue: string;
    timeSaleEnabled: boolean;
    timeSaleRule: string;
    saleMode: 'all' | 'store' | 'takeout';
    takeoutRule: 'inherit' | 'visible' | 'hidden';
    saleSettings: string;
    pointsExchangeEnabled: boolean;
    taxRate: string;
    prepEnabled: boolean;
    prepTime: string;
    stapleEnabled: boolean;
    baseSales: string;
    shareTitle: string;
    shareDesc: string;
};

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
    minSelect?: number; // 随心配模板规则：最少选择数
    maxSelect?: number; // 随心配模板规则：最多选择数
    requiredOptionCount?: number; // 可选分组：需选择的商品种类数
    minTotalQuantity?: number; // 可选分组：最少购买总数
    maxTotalQuantity?: number; // 可选分组：最多购买总数
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

const DISPLAY_COLLAPSIBLE_FIELDS = [
    { id: 'badge', label: '商品角标' },
    { id: 'badgeDate', label: '角标展示日期' },
    { id: 'detailBottomImage', label: '商品详情页底图' },
    { id: 'video', label: '商品视频' },
] as const;

const SALES_COLLAPSIBLE_FIELDS = [
    { id: 'saleSettings', label: '售卖设置' },
    { id: 'pointsExchange', label: '积分兑换规则' },
    { id: 'taxRate', label: '税率' },
] as const;

const OTHER_COLLAPSIBLE_FIELDS = [
    { id: 'prep', label: '预留备货时间' },
    { id: 'staple', label: '设为主食' },
    { id: 'baseSales', label: '基础销量' },
    { id: 'share', label: '商品分享' },
] as const;

const DEFAULT_FORM_STATE: ComboFormState = {
    name: '',
    price: '',
    frontCategory: '',
    backCategory: '',
    unit: '份',
    remark: '',
    image: '',
    listDesc: '',
    descTags: '',
    badge: '',
    badgeDate: '',
    detailImages: '',
    richDesc: '',
    detailBottomImage: '',
    video: '',
    minPurchaseEnabled: false,
    minPurchaseValue: '',
    maxPurchaseEnabled: false,
    maxPurchaseValue: '',
    timeSaleEnabled: false,
    timeSaleRule: '',
    saleMode: 'all',
    takeoutRule: 'inherit',
    saleSettings: '',
    pointsExchangeEnabled: false,
    taxRate: '',
    prepEnabled: false,
    prepTime: '',
    stapleEnabled: false,
    baseSales: '',
    shareTitle: '',
    shareDesc: '',
};

interface Props {
    category: Category;
    onClose: () => void;
}

const getOptionalRequiredOptionCount = (group: Partial<ComboGroup>) => (
    group.requiredOptionCount ?? Math.max(1, group.minSelect ?? 1)
);

const getOptionalMinTotalQuantity = (group: Partial<ComboGroup>) => {
    if (typeof group.minTotalQuantity === 'number') return group.minTotalQuantity;
    return group.isRequired === false ? 0 : 1;
};

const getOptionalMaxTotalQuantity = (group: Partial<ComboGroup>) => (
    group.maxTotalQuantity ?? group.maxSelect ?? 100
);

export const WebComboProductFormV2: React.FC<Props> = ({ category, onClose }) => {
    const [activeSection, setActiveSection] = useState<SectionId>('basic');
    const [groups, setGroups] = useState<ComboGroup[]>([]);
    const [formState, setFormState] = useState<ComboFormState>({
        ...DEFAULT_FORM_STATE,
        frontCategory: category.name,
    });
    const [isBasicExpanded, setIsBasicExpanded] = useState(false);
    const [expandedDisplayFields, setExpandedDisplayFields] = useState<string[]>([]);
    const [expandedSalesFields, setExpandedSalesFields] = useState<string[]>([]);
    const [expandedOtherFields, setExpandedOtherFields] = useState<string[]>([]);
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

    const scrollToSection = (id: SectionId) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const updateFormState = <K extends keyof ComboFormState>(key: K, value: ComboFormState[K]) => {
        setFormState(prev => ({ ...prev, [key]: value }));
    };

    const progress = useMemo(() => {
        const items = [
            Boolean(formState.name && formState.image),
            groups.length > 0,
            Boolean(formState.listDesc || formState.richDesc || formState.detailImages),
            Boolean(formState.minPurchaseEnabled || formState.maxPurchaseEnabled || formState.timeSaleEnabled || formState.saleSettings || formState.pointsExchangeEnabled || formState.taxRate),
        ];
        return {
            completed: items.filter(Boolean).length,
            total: items.length,
        };
    }, [formState, groups.length]);

    const renderCollapseActions = (
        items: readonly { id: string; label: string }[],
        expandedIds: string[],
        setExpandedIds: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        const allExpanded = items.length > 0 && items.every(item => expandedIds.includes(item.id));

        return (
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setExpandedIds(allExpanded ? [] : items.map(item => item.id))}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#666] transition-colors hover:border-[#00C06B]/30 hover:text-[#00A35B]"
                >
                    {allExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {allExpanded ? '收起' : '展开'}
                </button>
                {!allExpanded && items.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setExpandedIds(prev => (prev.includes(item.id) ? prev : [...prev, item.id]))}
                        className="rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-medium text-[#4E5969] transition-colors hover:bg-[#ECFDF3] hover:text-[#00A35B]"
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        );
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
                data: {
                    name: '',
                    isRequired: true,
                    requiredOptionCount: 1,
                    minTotalQuantity: 1,
                    maxTotalQuantity: 100,
                    relativePrice: false,
                    remark: '',
                    saveAsFreeMatch: false
                }
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
                requiredOptionCount: getOptionalRequiredOptionCount(optionalModalConfig.data),
                minTotalQuantity: getOptionalMinTotalQuantity(optionalModalConfig.data),
                maxTotalQuantity: getOptionalMaxTotalQuantity(optionalModalConfig.data),
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
    <div className="pc-page absolute inset-0 z-50 flex flex-col bg-[#F5F6FA] animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="h-14 bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center">
                    <button onClick={onClose} className="mr-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-800 text-lg">填写套餐商品资料</span>
                            <span className="text-[10px] bg-[#00C06B]/10 text-[#00C06B] px-2 py-0.5 rounded-full font-bold border border-[#00C06B]/20">类目: {category.name}</span>
                        </div>
                        <div className="text-xs text-gray-400">套餐创建页已补充为和新建商品页相近的模块结构，套餐不支持加料配置。</div>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors">取消</button>
                    <button className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-[#00C06B] hover:bg-[#00A35B] shadow-md shadow-[#00C06B]/20 transition-all active:scale-95">保存套餐</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Navigation */}
                <div className="w-48 bg-white border-r border-[#E8E8E8] py-6 flex flex-col space-y-1 overflow-y-auto shrink-0">
                    <div className="px-6 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">填写导航</div>
                    {(['basic', 'combo', 'display', 'sales', 'settings'] as SectionId[]).map(section => (
                        <div 
                            key={section}
                            onClick={() => scrollToSection(section)}
                            className={`px-6 py-3 text-sm font-bold cursor-pointer border-r-[3px] transition-all flex items-center ${activeSection === section ? 'border-[#00C06B] text-[#00C06B] bg-[#00C06B]/5' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                        >
                            {section === 'basic' && '基础信息'}
                            {section === 'combo' && '套餐商品配置'}
                            {section === 'display' && '展示设置'}
                            {section === 'sales' && '销售属性'}
                            {section === 'settings' && '其他属性'}
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    <div className="max-w-[1000px] mx-auto space-y-6 pb-32">
                        
                        {/* Section: Basic */}
                        <div id="basic" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-4">
                            <SectionHeader title="基础信息" icon={<FileText size={20}/>} />
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <FormRow label="套餐名称" required>
                                    <input
                                        value={formState.name}
                                        onChange={(e) => updateFormState('name', e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                        placeholder="请输入套餐名称"
                                    />
                                </FormRow>
                                <FormRow label="基础价格" required>
                                    <input
                                        value={formState.price}
                                        onChange={(e) => updateFormState('price', e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                        placeholder="0.00"
                                    />
                                </FormRow>
                                <FormRow label="前台分类" required>
                                    <input
                                        value={formState.frontCategory}
                                        onChange={(e) => updateFormState('frontCategory', e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                        placeholder="请选择前台分类"
                                    />
                                </FormRow>
                                <FormRow label="商品类目" required>
                                    <input
                                        value={category.name}
                                        readOnly
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 outline-none"
                                    />
                                </FormRow>
                                <FormRow label="计量单位">
                                    <input
                                        value={formState.unit}
                                        onChange={(e) => updateFormState('unit', e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                        placeholder="请输入计量单位"
                                    />
                                </FormRow>
                                <FormRow label="商品主图" required description="支持填写图片链接预览效果">
                                    <div className="rounded-xl border border-dashed border-[#8BE1B2] bg-[#F2FFF8] p-3">
                                        <div className="flex items-center justify-center bg-white rounded-lg min-h-[88px]">
                                            {formState.image ? (
                                                <img src={formState.image} alt="套餐主图" className="max-h-[88px] object-cover rounded-md" />
                                            ) : (
                                                <div className="text-center">
                                                    <ImageIcon size={22} className="mx-auto text-[#00C06B] opacity-70" />
                                                    <div className="mt-1 text-xs text-gray-500">未上传主图</div>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            value={formState.image}
                                            onChange={(e) => updateFormState('image', e.target.value)}
                                            className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                            placeholder="请输入主图链接"
                                        />
                                    </div>
                                </FormRow>
                            </div>
                            <div className="pt-1 flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setIsBasicExpanded(prev => !prev)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#666] transition-colors hover:border-[#00C06B]/30 hover:text-[#00A35B]"
                                >
                                    {isBasicExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    {isBasicExpanded ? '收起' : '展开'}
                                </button>
                                {!isBasicExpanded && (
                                    <>
                                        <button type="button" onClick={() => setIsBasicExpanded(true)} className="rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-medium text-[#4E5969] hover:bg-[#ECFDF3] hover:text-[#00A35B]">后台分类</button>
                                        <button type="button" onClick={() => setIsBasicExpanded(true)} className="rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-medium text-[#4E5969] hover:bg-[#ECFDF3] hover:text-[#00A35B]">备注</button>
                                    </>
                                )}
                            </div>
                            {isBasicExpanded && (
                                <div className="rounded-xl bg-[#FAFBFC] border border-gray-200/70 p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <FormRow label="后台分类">
                                            <input
                                                value={formState.backCategory}
                                                onChange={(e) => updateFormState('backCategory', e.target.value)}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                placeholder="请输入后台分类"
                                            />
                                        </FormRow>
                                        <FormRow label="备注">
                                            <input
                                                value={formState.remark}
                                                onChange={(e) => updateFormState('remark', e.target.value)}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                placeholder="请输入备注"
                                            />
                                        </FormRow>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section: Combo */}
                        <div id="combo" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6 min-h-[400px]">
                            <SectionHeader
                                title="套餐商品配置"
                                icon={<Utensils size={20}/>}
                                meta={<span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFF7E8] text-[#D46B08]">套餐不支持加料</span>}
                            />
                            
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
                                                        {group.type === 'free' ? (
                                                            <span>分组设置：随心配{group.maxSelect || 3}选{group.minSelect || 1}</span>
                                                        ) : (
                                                            <>
                                                                <span>分组设置：{group.items.length}选{getOptionalRequiredOptionCount(group)}</span>
                                                                <span>是否必选：{group.isRequired === false ? '非必选' : '必选'}</span>
                                                                <span>购买数量限制：{getOptionalMinTotalQuantity(group)} ~ {getOptionalMaxTotalQuantity(group)}</span>
                                                            </>
                                                        )}
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

                        <div id="display" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-4">
                            <SectionHeader title="展示设置" icon={<LayoutGrid size={20}/>} />
                            <div className="space-y-4">
                                <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 space-y-4">
                                    <div className="text-sm font-bold text-gray-800">列表页展示</div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <FormRow label="商品列表简述">
                                            <input
                                                value={formState.listDesc}
                                                onChange={(e) => updateFormState('listDesc', e.target.value)}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                placeholder="请输入商品列表简述"
                                            />
                                        </FormRow>
                                        <FormRow label="描述标签">
                                            <input
                                                value={formState.descTags}
                                                onChange={(e) => updateFormState('descTags', e.target.value)}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                placeholder="如：双人套餐 / 人气推荐"
                                            />
                                        </FormRow>
                                    </div>
                                    {renderCollapseActions(DISPLAY_COLLAPSIBLE_FIELDS.slice(0, 2), expandedDisplayFields, setExpandedDisplayFields)}
                                    {(expandedDisplayFields.includes('badge') || expandedDisplayFields.includes('badgeDate')) && (
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                            {expandedDisplayFields.includes('badge') && (
                                                <FormRow label="商品角标">
                                                    <input
                                                        value={formState.badge}
                                                        onChange={(e) => updateFormState('badge', e.target.value)}
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                        placeholder="如：新品 / 限时"
                                                    />
                                                </FormRow>
                                            )}
                                            {expandedDisplayFields.includes('badgeDate') && (
                                                <FormRow label="角标展示日期">
                                                    <input
                                                        value={formState.badgeDate}
                                                        onChange={(e) => updateFormState('badgeDate', e.target.value)}
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                        placeholder="如：2026-05-01 ~ 2026-05-31"
                                                    />
                                                </FormRow>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 space-y-4">
                                    <div className="text-sm font-bold text-gray-800">详情页展示</div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <FormRow label="商品详情图">
                                            <textarea
                                                value={formState.detailImages}
                                                onChange={(e) => updateFormState('detailImages', e.target.value)}
                                                className="w-full min-h-[88px] resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                placeholder="请输入详情图链接，多个链接可换行输入"
                                            />
                                        </FormRow>
                                        <FormRow label="商品详情">
                                            <textarea
                                                value={formState.richDesc}
                                                onChange={(e) => updateFormState('richDesc', e.target.value)}
                                                className="w-full min-h-[88px] resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                placeholder="请输入套餐详情描述"
                                            />
                                        </FormRow>
                                    </div>
                                    {renderCollapseActions(DISPLAY_COLLAPSIBLE_FIELDS.slice(2), expandedDisplayFields, setExpandedDisplayFields)}
                                    {(expandedDisplayFields.includes('detailBottomImage') || expandedDisplayFields.includes('video')) && (
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                            {expandedDisplayFields.includes('detailBottomImage') && (
                                                <FormRow label="商品详情页底图">
                                                    <input
                                                        value={formState.detailBottomImage}
                                                        onChange={(e) => updateFormState('detailBottomImage', e.target.value)}
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                        placeholder="请输入详情页底图链接"
                                                    />
                                                </FormRow>
                                            )}
                                            {expandedDisplayFields.includes('video') && (
                                                <FormRow label="商品视频">
                                                    <input
                                                        value={formState.video}
                                                        onChange={(e) => updateFormState('video', e.target.value)}
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                        placeholder="请输入视频链接"
                                                    />
                                                </FormRow>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div id="sales" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-4">
                            <SectionHeader title="销售属性" icon={<Settings size={20}/>} />
                            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <FormRow label="起购数量">
                                        <div className="flex items-center gap-3">
                                            <Switch active={formState.minPurchaseEnabled} onClick={() => updateFormState('minPurchaseEnabled', !formState.minPurchaseEnabled)} />
                                            {formState.minPurchaseEnabled && (
                                                <input
                                                    value={formState.minPurchaseValue}
                                                    onChange={(e) => updateFormState('minPurchaseValue', e.target.value)}
                                                    className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                    placeholder="请输入数量"
                                                />
                                            )}
                                        </div>
                                    </FormRow>
                                    <FormRow label="限购数量">
                                        <div className="flex items-center gap-3">
                                            <Switch active={formState.maxPurchaseEnabled} onClick={() => updateFormState('maxPurchaseEnabled', !formState.maxPurchaseEnabled)} />
                                            {formState.maxPurchaseEnabled && (
                                                <input
                                                    value={formState.maxPurchaseValue}
                                                    onChange={(e) => updateFormState('maxPurchaseValue', e.target.value)}
                                                    className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                    placeholder="请输入数量"
                                                />
                                            )}
                                        </div>
                                    </FormRow>
                                    <FormRow label="分时段销售">
                                        <div className="flex items-center gap-3">
                                            <Switch active={formState.timeSaleEnabled} onClick={() => updateFormState('timeSaleEnabled', !formState.timeSaleEnabled)} />
                                            {formState.timeSaleEnabled && (
                                                <input
                                                    value={formState.timeSaleRule}
                                                    onChange={(e) => updateFormState('timeSaleRule', e.target.value)}
                                                    className="w-[260px] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                    placeholder="如：10:00-14:00,17:00-20:00"
                                                />
                                            )}
                                        </div>
                                    </FormRow>
                                    <FormRow label="售卖方式">
                                        <div className="flex flex-wrap items-center gap-5 pt-1 text-sm text-gray-700">
                                            {[
                                                { key: 'all', label: '全部渠道' },
                                                { key: 'store', label: '仅门店' },
                                                { key: 'takeout', label: '仅外卖' },
                                            ].map(item => (
                                                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" checked={formState.saleMode === item.key} onChange={() => updateFormState('saleMode', item.key as ComboFormState['saleMode'])} className="accent-[#00C06B]" />
                                                    <span>{item.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </FormRow>
                                    <FormRow label="外带设置">
                                        <div className="flex flex-wrap items-center gap-5 pt-1 text-sm text-gray-700">
                                            {[
                                                { key: 'inherit', label: '跟随门店' },
                                                { key: 'visible', label: '允许外带' },
                                                { key: 'hidden', label: '不支持外带' },
                                            ].map(item => (
                                                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" checked={formState.takeoutRule === item.key} onChange={() => updateFormState('takeoutRule', item.key as ComboFormState['takeoutRule'])} className="accent-[#00C06B]" />
                                                    <span>{item.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </FormRow>
                                </div>
                            </div>

                            {renderCollapseActions(SALES_COLLAPSIBLE_FIELDS, expandedSalesFields, setExpandedSalesFields)}
                            {expandedSalesFields.length > 0 && (
                                <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 space-y-4">
                                    {expandedSalesFields.includes('saleSettings') && (
                                        <FormRow label="售卖设置">
                                            <textarea
                                                value={formState.saleSettings}
                                                onChange={(e) => updateFormState('saleSettings', e.target.value)}
                                                className="w-full min-h-[88px] resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                placeholder="请输入套餐售卖设置说明"
                                            />
                                        </FormRow>
                                    )}
                                    {expandedSalesFields.includes('pointsExchange') && (
                                        <FormRow label="积分兑换规则" description="套餐支持配置纯积分或积分+金额兑换规则。" descriptionPlacement="bottom">
                                            <div className="flex items-center gap-3">
                                                <Switch active={formState.pointsExchangeEnabled} onClick={() => updateFormState('pointsExchangeEnabled', !formState.pointsExchangeEnabled)} />
                                                <span className="text-sm text-gray-600">开启后可同步到积分商城套餐商品</span>
                                            </div>
                                        </FormRow>
                                    )}
                                    {expandedSalesFields.includes('taxRate') && (
                                        <FormRow label="税率">
                                            <input
                                                value={formState.taxRate}
                                                onChange={(e) => updateFormState('taxRate', e.target.value)}
                                                className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                placeholder="如：6%"
                                            />
                                        </FormRow>
                                    )}
                                </div>
                            )}
                        </div>

                        <div id="settings" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-4">
                            <SectionHeader title="其他属性" icon={<Clock3 size={20}/>} />
                            {renderCollapseActions(OTHER_COLLAPSIBLE_FIELDS, expandedOtherFields, setExpandedOtherFields)}
                            {expandedOtherFields.length > 0 ? (
                                <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 space-y-4">
                                    {expandedOtherFields.includes('prep') && (
                                        <FormRow label="预留备货时间" description="用于提前备货的套餐场景。" descriptionPlacement="bottom">
                                            <div className="flex items-center gap-3">
                                                <Switch active={formState.prepEnabled} onClick={() => updateFormState('prepEnabled', !formState.prepEnabled)} />
                                                {formState.prepEnabled && (
                                                    <input
                                                        value={formState.prepTime}
                                                        onChange={(e) => updateFormState('prepTime', e.target.value)}
                                                        className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                        placeholder="如：30分钟"
                                                    />
                                                )}
                                            </div>
                                        </FormRow>
                                    )}
                                    {expandedOtherFields.includes('staple') && (
                                        <FormRow label="设为主食">
                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                <Switch active={formState.stapleEnabled} onClick={() => updateFormState('stapleEnabled', !formState.stapleEnabled)} />
                                                <span>用于部分套餐主食展示场景</span>
                                            </div>
                                        </FormRow>
                                    )}
                                    {expandedOtherFields.includes('baseSales') && (
                                        <FormRow label="基础销量">
                                            <input
                                                value={formState.baseSales}
                                                onChange={(e) => updateFormState('baseSales', e.target.value)}
                                                className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                placeholder="请输入基础销量"
                                            />
                                        </FormRow>
                                    )}
                                    {expandedOtherFields.includes('share') && (
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                            <FormRow label="分享标题">
                                                <input
                                                    value={formState.shareTitle}
                                                    onChange={(e) => updateFormState('shareTitle', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                    placeholder="请输入分享标题"
                                                />
                                            </FormRow>
                                            <FormRow label="分享描述">
                                                <input
                                                    value={formState.shareDesc}
                                                    onChange={(e) => updateFormState('shareDesc', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                                                    placeholder="请输入分享描述"
                                                />
                                            </FormRow>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-gray-200 bg-[#FAFAFA] px-4 py-6 text-center text-sm text-gray-400">
                                    当前模块以低频配置为主，按需展开填写即可。
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
                                    <div className="rounded-xl border border-[#E8E8E8] bg-[#FAFAFA] p-4 space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="text-sm font-medium text-[#333]">分组内需选商品种类数</div>
                                                <div className="mt-1 text-xs text-[#98A2B3]">
                                                    用于配置用户在该分组下必须选择几种商品，体现为前台“几选几”规则
                                                    <span className="ml-2 cursor-pointer text-[#00C06B] hover:underline">查看示例</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center border border-gray-200 rounded overflow-hidden h-8 bg-white">
                                                <button
                                                    className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-r border-gray-200"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setOptionalModalConfig({
                                                            ...optionalModalConfig,
                                                            data: {
                                                                ...optionalModalConfig.data,
                                                                requiredOptionCount: Math.max(1, getOptionalRequiredOptionCount(optionalModalConfig.data) - 1)
                                                            }
                                                        });
                                                    }}
                                                >−</button>
                                                <input
                                                    type="number"
                                                    value={getOptionalRequiredOptionCount(optionalModalConfig.data)}
                                                    onChange={(e) => setOptionalModalConfig({
                                                        ...optionalModalConfig,
                                                        data: {
                                                            ...optionalModalConfig.data,
                                                            requiredOptionCount: Math.max(1, parseInt(e.target.value) || 1)
                                                        }
                                                    })}
                                                    className="w-14 text-center text-sm outline-none focus:bg-gray-50"
                                                />
                                                <button
                                                    className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-l border-gray-200"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setOptionalModalConfig({
                                                            ...optionalModalConfig,
                                                            data: {
                                                                ...optionalModalConfig.data,
                                                                requiredOptionCount: getOptionalRequiredOptionCount(optionalModalConfig.data) + 1
                                                            }
                                                        });
                                                    }}
                                                >+</button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <div className="text-sm font-medium text-[#333]">是否必选</div>
                                                <div className="mt-1 text-xs text-[#98A2B3]">是否必选由独立配置控制，不再根据最少购买总数自动判断</div>
                                            </div>
                                            <div className="flex items-center rounded-lg border border-[#E8E8E8] bg-white p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, isRequired: true } })}
                                                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${optionalModalConfig.data.isRequired !== false ? 'bg-[#00C06B] text-white' : 'text-[#666] hover:bg-[#F5F7FA]'}`}
                                                >
                                                    必选
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setOptionalModalConfig({ ...optionalModalConfig, data: { ...optionalModalConfig.data, isRequired: false } })}
                                                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${optionalModalConfig.data.isRequired === false ? 'bg-[#00C06B] text-white' : 'text-[#666] hover:bg-[#F5F7FA]'}`}
                                                >
                                                    非必选
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-sm font-medium text-[#333]">商品购买数量限制</div>
                                                <div className="mt-1 text-xs text-[#98A2B3]">
                                                    单个商品可多选，限制分组内商品购买总数，原有示例保留
                                                    <span className="ml-2 cursor-pointer text-[#00C06B] hover:underline">查看示例</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-700">最少购买总数</span>
                                                <div className="flex items-center border border-gray-200 rounded overflow-hidden h-8 bg-white">
                                                    <button
                                                        className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-r border-gray-200"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setOptionalModalConfig({
                                                                ...optionalModalConfig,
                                                                data: {
                                                                    ...optionalModalConfig.data,
                                                                    minTotalQuantity: Math.max(0, getOptionalMinTotalQuantity(optionalModalConfig.data) - 1)
                                                                }
                                                            });
                                                        }}
                                                    >−</button>
                                                    <input
                                                        type="number"
                                                        value={getOptionalMinTotalQuantity(optionalModalConfig.data)}
                                                        onChange={(e) => setOptionalModalConfig({
                                                            ...optionalModalConfig,
                                                            data: {
                                                                ...optionalModalConfig.data,
                                                                minTotalQuantity: Math.max(0, parseInt(e.target.value) || 0)
                                                            }
                                                        })}
                                                        className="w-16 text-center text-sm outline-none focus:bg-gray-50"
                                                    />
                                                    <button
                                                        className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-l border-gray-200"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setOptionalModalConfig({
                                                                ...optionalModalConfig,
                                                                data: {
                                                                    ...optionalModalConfig.data,
                                                                    minTotalQuantity: getOptionalMinTotalQuantity(optionalModalConfig.data) + 1
                                                                }
                                                            });
                                                        }}
                                                    >+</button>
                                                </div>
                                                <span className="text-sm text-gray-700">最多购买总数</span>
                                                <div className="flex items-center border border-gray-200 rounded overflow-hidden h-8 bg-white">
                                                    <button
                                                        className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-r border-gray-200"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setOptionalModalConfig({
                                                                ...optionalModalConfig,
                                                                data: {
                                                                    ...optionalModalConfig.data,
                                                                    maxTotalQuantity: Math.max(1, getOptionalMaxTotalQuantity(optionalModalConfig.data) - 1)
                                                                }
                                                            });
                                                        }}
                                                    >−</button>
                                                    <input
                                                        type="number"
                                                        value={getOptionalMaxTotalQuantity(optionalModalConfig.data)}
                                                        onChange={(e) => setOptionalModalConfig({
                                                            ...optionalModalConfig,
                                                            data: {
                                                                ...optionalModalConfig.data,
                                                                maxTotalQuantity: Math.max(1, parseInt(e.target.value) || 1)
                                                            }
                                                        })}
                                                        className="w-16 text-center text-sm outline-none focus:bg-gray-50"
                                                    />
                                                    <button
                                                        className="px-2 bg-gray-50 text-gray-500 hover:bg-gray-100 border-l border-gray-200"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setOptionalModalConfig({
                                                                ...optionalModalConfig,
                                                                data: {
                                                                    ...optionalModalConfig.data,
                                                                    maxTotalQuantity: getOptionalMaxTotalQuantity(optionalModalConfig.data) + 1
                                                                }
                                                            });
                                                        }}
                                                    >+</button>
                                                </div>
                                            </div>
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
