import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FolderTree, Layers3, RotateCcw, Save, ShieldCheck, Sparkles } from 'lucide-react';
import { AVAILABLE_DYNAMIC_FIELDS, Category, CategoryFieldConfig, COMMON_FIELD_CHILD_CONFIG_LIBRARY, DynamicFieldConfig } from '../../types';

type WebCategoryLike = Category & {
    classification: 'standard' | 'combo';
};

type CommonFieldConfigs = Record<string, CategoryFieldConfig[]>;

type FieldGroup = {
    id: string;
    label: string;
    desc: string;
    fieldIds: string[];
    type?: 'standard' | 'combo' | 'all';
    showHeader?: boolean;
};

type FieldModuleSection = {
    id: string;
    label: string;
    desc: string;
    groups: FieldGroup[];
};

const FORM_STRUCTURE: FieldModuleSection[] = [
    {
        id: 'base',
        label: '基础信息',
        desc: '对应创建表单里的基础信息区域，包含名称、分类、单位等基础录入字段。',
        groups: [
            { id: 'base_main', label: '基础信息', desc: '商品基础标识、分类、单位及展示类型等基础录入字段。', fieldIds: ['p_name', 'p_alias', 'p_code', 'p_front_cat', 'p_back_cat', 'p_cat', 'p_weight_flag', 'p_unit', 'p_display_type', 'p_remark', 'p_stat_tags', 'p_tare_weight'] },
        ],
    },
    {
        id: 'product_attr',
        label: '商品属性',
        desc: '对应创建表单里的商品属性区域，按规格、做法、加料、套餐信息拆分展示。',
        groups: [
            { id: 'attr_spec', label: '规格', desc: '规格设置与规格内价格、库存、标识等能力。', fieldIds: ['s_specs', 's_spec_name', 's_spec_price', 's_spec_cost', 's_spec_market', 's_spec_stock', 's_spec_img', 's_spec_code'], showHeader: true },
            { id: 'attr_method', label: '做法', desc: '做法名称、加价、编码等做法配置。', fieldIds: ['m_methods', 'm_method_name', 'm_method_markup', 'm_method_code'], showHeader: true },
            { id: 'attr_addon', label: '加料', desc: '加料选择与加料配置能力。', fieldIds: ['a_addons'], showHeader: true },
            { id: 'attr_points', label: '积分兑换', desc: '积分兑换规则相关配置。', fieldIds: ['p_points_exchange_rule'], type: 'standard', showHeader: true },
            { id: 'attr_combo', label: '套餐信息', desc: '套餐商品的分组与组合能力。', fieldIds: ['c_groups'], type: 'combo', showHeader: true },
        ],
    },
    {
        id: 'display',
        label: '展示设置',
        desc: '对应创建表单里的展示设置区域，按列表页与详情页拆分。',
        groups: [
            { id: 'display_list', label: '列表页展示', desc: '列表卡片中直接展示的图片、文案与标签。', fieldIds: ['p_img', 'p_list_desc', 'p_desc_tags', 'p_order_tags', 'p_badge'], showHeader: true },
            { id: 'display_detail', label: '详情页展示', desc: '详情页内容和富文本展示信息。', fieldIds: ['p_video', 'p_rich_desc'], showHeader: true },
        ],
    },
    {
        id: 'sales',
        label: '销售属性',
        desc: '对应创建表单里的销售属性区域，统一展示售卖规则等配置字段。',
        groups: [
            { id: 'sales_main', label: '销售属性', desc: '售卖规则、起购限购、分时段销售及税率等配置。', fieldIds: ['s_price', 's_cost', 's_market_price', 's_pack_fee', 's_stock', 's_limit', 's_pos_edit', 's_min_purchase_toggle', 's_min_purchase_value', 's_max_purchase_toggle', 's_max_purchase_value', 's_time_sale_toggle', 's_time_sale_rule', 's_sale_mode', 's_takeout_rule', 's_sale_settings', 's_tax_rate'] },
        ],
    },
    {
        id: 'others',
        label: '其他属性',
        desc: '对应创建表单里的其他属性区域，统一展示会员、开票、原料与补充属性配置。',
        groups: [
            { id: 'other_main', label: '其他属性', desc: '会员、税务、原料及其他补充属性。', fieldIds: ['st_member', 'o_tax', 'o_invoice', 'o_origin', 'o_ingredients', 'o_print_stat_test', 'o_1202_attr'] },
        ],
    },
];

const getConfigKey = (type: 'standard' | 'combo', categoryId: string) => `${type}:${categoryId}`;
const SALES_FIELDS_HIDDEN_WHEN_SPECS = new Set(['s_price', 's_cost', 's_market_price', 's_pack_fee', 's_stock']);

const buildChildConfigs = (fieldId: string, current?: Record<string, boolean>) => {
    const childTemplates = COMMON_FIELD_CHILD_CONFIG_LIBRARY[fieldId] || [];
    if (childTemplates.length === 0) return undefined;
    return childTemplates.reduce<Record<string, boolean>>((acc, child) => {
        acc[child.id] = current?.[child.id] ?? !!(child.isDefaultSelected || child.isSystem);
        return acc;
    }, {});
};

const buildDraftFieldConfig = (config: CategoryFieldConfig): CategoryFieldConfig => ({
    id: config.id,
    isRequired: config.isRequired,
    childConfigs: buildChildConfigs(config.id, config.childConfigs),
    childRequiredConfigs: config.childRequiredConfigs,
});

interface Props {
    categories: WebCategoryLike[];
    configs: CommonFieldConfigs;
    initialType?: 'standard' | 'combo';
    initialCategoryId?: string | null;
    onBack: () => void;
    onSave: (type: 'standard' | 'combo', categoryId: string, fieldConfigs: CategoryFieldConfig[]) => void;
    onReset: (type: 'standard' | 'combo', categoryId: string) => void;
}

export const WebCommonFieldSettings: React.FC<Props> = ({
    categories,
    configs,
    initialType = 'standard',
    initialCategoryId = null,
    onBack,
    onSave,
    onReset,
}) => {
    const [activeType, setActiveType] = useState<'standard' | 'combo'>(initialType);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId);
    const [draftFieldConfigs, setDraftFieldConfigs] = useState<CategoryFieldConfig[]>([]);
    const [savedMessage, setSavedMessage] = useState('');

    const displayCategories = useMemo(
        () => categories.filter(item => item.classification === activeType),
        [activeType, categories]
    );

    useEffect(() => {
        if (displayCategories.length === 0) {
            setSelectedCategoryId(null);
            return;
        }
        const hasSelected = selectedCategoryId && displayCategories.some(item => item.id === selectedCategoryId);
        if (!hasSelected) {
            setSelectedCategoryId(initialCategoryId && displayCategories.some(item => item.id === initialCategoryId)
                ? initialCategoryId
                : displayCategories[0].id);
        }
    }, [activeType, displayCategories, initialCategoryId, selectedCategoryId]);

    const selectedCategory = useMemo(
        () => displayCategories.find(item => item.id === selectedCategoryId) || null,
        [displayCategories, selectedCategoryId]
    );

    const categoryFieldConfigs = useMemo<CategoryFieldConfig[]>(() => {
        if (!selectedCategory) return [];
        return activeType === 'standard' ? selectedCategory.standardFields : selectedCategory.comboFields;
    }, [activeType, selectedCategory]);

    const availableCategoryFields = useMemo(() => (
        categoryFieldConfigs
            .map(config => {
                const field = AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === config.id);
                return field ? { config, field } : null;
            })
            .filter((item): item is { config: CategoryFieldConfig; field: typeof AVAILABLE_DYNAMIC_FIELDS[number] } => !!item)
    ), [categoryFieldConfigs]);

    useEffect(() => {
        if (!selectedCategory) {
            setDraftFieldConfigs([]);
            setSavedMessage('');
            return;
        }
        const configKey = getConfigKey(activeType, selectedCategory.id);
        setDraftFieldConfigs((configs[configKey] || []).map(buildDraftFieldConfig));
        setSavedMessage('');
    }, [activeType, configs, selectedCategory]);

    const requiredFieldIds = useMemo(() => (
        availableCategoryFields
            .filter(item => item.config.isRequired || item.field.isRequired || item.field.isSystem)
            .map(item => item.field.id)
    ), [availableCategoryFields]);

    const normalizedDraftConfigs = useMemo(() => {
        const availableIds = new Set(availableCategoryFields.map(item => item.field.id));
        const fieldMap = new Map(availableCategoryFields.map(item => [item.field.id, item]));
        const nextMap = new Map<string, CategoryFieldConfig>();

        draftFieldConfigs
            .filter(item => availableIds.has(item.id))
            .forEach(item => {
                nextMap.set(item.id, buildDraftFieldConfig(item));
            });

        requiredFieldIds.forEach(fieldId => {
            const source = fieldMap.get(fieldId);
            if (!source) return;
            const existing = nextMap.get(fieldId);
            nextMap.set(fieldId, buildDraftFieldConfig(existing || source.config));
        });

        return Array.from(nextMap.values());
    }, [availableCategoryFields, draftFieldConfigs, requiredFieldIds]);

    const draftIdSet = useMemo(() => new Set(normalizedDraftConfigs.map(item => item.id)), [normalizedDraftConfigs]);
    const normalizedDraftConfigMap = useMemo(() => new Map(normalizedDraftConfigs.map(item => [item.id, item])), [normalizedDraftConfigs]);

    const fieldLookup = useMemo(() => new Map(availableCategoryFields.map(item => [item.field.id, item])), [availableCategoryFields]);

    const groupedFields = useMemo(() => (
        FORM_STRUCTURE.map(section => ({
            ...section,
            groups: section.groups
                .filter(group => !group.type || group.type === 'all' || group.type === activeType)
                .map(group => ({
                    ...group,
                    items: group.fieldIds
                        .filter(fieldId => !(section.id === 'sales' && fieldLookup.has('s_specs') && SALES_FIELDS_HIDDEN_WHEN_SPECS.has(fieldId)))
                        .map(fieldId => fieldLookup.get(fieldId))
                        .filter((item): item is { config: CategoryFieldConfig; field: DynamicFieldConfig } => !!item),
                }))
                .filter(group => group.items.length > 0),
        })).filter(section => section.groups.length > 0)
    ), [activeType, fieldLookup]);

    const currentConfigKey = selectedCategory ? getConfigKey(activeType, selectedCategory.id) : '';
    const persistedSelection = configs[currentConfigKey] || [];
    const hasChanges = JSON.stringify(normalizedDraftConfigs) !== JSON.stringify(persistedSelection);

    const handleToggleField = (fieldId: string) => {
        if (requiredFieldIds.includes(fieldId)) return;
        setSavedMessage('');
        setDraftFieldConfigs(prev => {
            const exists = prev.some(item => item.id === fieldId);
            if (exists) {
                return prev.filter(item => item.id !== fieldId);
            }
            const sourceField = availableCategoryFields.find(item => item.field.id === fieldId);
            if (!sourceField) return prev;
            return [...prev, buildDraftFieldConfig(sourceField.config)];
        });
    };

    const handleToggleChildField = (parentId: string, childId: string) => {
        setSavedMessage('');
        setDraftFieldConfigs(prev => prev.map(item => {
            if (item.id !== parentId) return item;
            return {
                ...item,
                childConfigs: {
                    ...buildChildConfigs(parentId, item.childConfigs),
                    [childId]: !(item.childConfigs?.[childId] ?? false),
                },
            };
        }));
    };

    const handleSave = () => {
        if (!selectedCategory) return;
        onSave(activeType, selectedCategory.id, normalizedDraftConfigs);
        setSavedMessage('常用字段保存成功，创建页已按最新配置展示。');
    };

    const handleReset = () => {
        if (!selectedCategory) return;
        onReset(activeType, selectedCategory.id);
        setSavedMessage('已恢复系统默认字段方案。');
    };

    return (
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-[#F5F6FA]">
            <div className="h-16 shrink-0 border-b border-[#E8E8E8] bg-white px-8 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1F2129]"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-[20px] font-black text-[#1F2129]">常用字段设置</h2>
                            <span className="rounded-full bg-[#EAF9F1] px-3 py-1 text-xs font-bold text-[#00A35B]">
                                品牌级按类目生效
                            </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-400">为不同商品类目配置默认展示字段，创建商品时不再依赖统一展示或折叠交互。</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={!selectedCategory}
                        className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1F2129] disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#00C06B] hover:bg-[#F8FFFB]"
                    >
                        <RotateCcw size={15} className="mr-2" />
                        恢复系统默认
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!selectedCategory || !hasChanges}
                        className="inline-flex items-center rounded-xl bg-[#1F2129] px-5 py-2.5 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        <Save size={15} className="mr-2" />
                        保存配置
                    </button>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
                <aside className="w-[300px] shrink-0 border-r border-[#E8E8E8] bg-white flex flex-col">
                    <div className="border-b border-[#E8E8E8] p-6">
                        <div className="flex rounded-2xl bg-[#F5F6FA] p-1">
                            <button
                                type="button"
                                onClick={() => setActiveType('standard')}
                                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${activeType === 'standard' ? 'bg-white text-[#00A35B] shadow-sm' : 'text-gray-500'}`}
                            >
                                标准商品
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveType('combo')}
                                className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${activeType === 'combo' ? 'bg-white text-[#00A35B] shadow-sm' : 'text-gray-500'}`}
                            >
                                套餐商品
                            </button>
                        </div>
                        <div className="mt-5 rounded-2xl border border-[#E8F7EF] bg-[#F7FFF9] p-4">
                            <div className="flex items-center gap-2 text-sm font-black text-[#1F2129]">
                                <Sparkles size={16} className="text-[#00A35B]" />
                                配置规则
                            </div>
                            <div className="mt-2 text-xs leading-6 text-gray-500">
                                系统必填字段默认勾选且不可取消，保存后当前品牌该类目的创建表单会默认展示这些常用字段。
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                        {displayCategories.map(item => {
                            const active = item.id === selectedCategoryId;
                            const selectedCount = (configs[getConfigKey(activeType, item.id)] || []).length;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelectedCategoryId(item.id)}
                                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${active ? 'border-[#BBF7D0] bg-[#F0FDF4]' : 'border-transparent bg-[#FAFAFA] hover:border-gray-200 hover:bg-white'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className={`truncate text-sm font-black ${active ? 'text-[#1F2129]' : 'text-[#333]'}`}>{item.name}</div>
                                            <div className="mt-1 text-xs text-gray-400">已配置 {selectedCount} 个常用字段</div>
                                        </div>
                                        <FolderTree size={16} className={active ? 'text-[#00A35B]' : 'text-gray-300'} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <main className="flex-1 min-w-0 overflow-y-auto no-scrollbar p-8">
                    {!selectedCategory ? (
                        <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-gray-200 bg-white text-gray-400">
                            请选择左侧类目后开始配置
                        </div>
                    ) : availableCategoryFields.length === 0 ? (
                        <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-gray-200 bg-white text-gray-400">
                            当前类目暂无可配置字段
                        </div>
                    ) : (
                        <div className="mx-auto max-w-[1180px] space-y-6">
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                                <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="text-[22px] font-black text-[#1F2129]">{selectedCategory.name}</div>
                                        <span className="rounded-full bg-[#F5F6FA] px-3 py-1 text-xs font-bold text-gray-500">
                                            {activeType === 'standard' ? '标准商品' : '套餐商品'}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-sm leading-6 text-gray-500">
                                        勾选后，这些字段会直接展示在商品创建页；未勾选的类目字段将不再出现在创建表单中。
                                    </div>
                                </div>
                                <div className="rounded-[24px] border border-[#E8F7EF] bg-[#F7FFF9] p-6 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-black text-[#1F2129]">
                                        <ShieldCheck size={16} className="text-[#00A35B]" />
                                        配置摘要
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-white px-4 py-3">
                                            <div className="text-xs text-gray-400">常用字段</div>
                                            <div className="mt-1 text-2xl font-black text-[#1F2129]">{normalizedDraftConfigs.length}</div>
                                        </div>
                                        <div className="rounded-2xl bg-white px-4 py-3">
                                            <div className="text-xs text-gray-400">类目总字段</div>
                                            <div className="mt-1 text-2xl font-black text-[#1F2129]">{availableCategoryFields.length}</div>
                                        </div>
                                    </div>
                                    {savedMessage && (
                                        <div className="mt-4 rounded-2xl border border-[#BBF7D0] bg-white px-4 py-3 text-sm font-medium text-[#166534]">
                                            {savedMessage}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {groupedFields.map(module => (
                                <section key={module.id} className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-lg font-black text-[#1F2129]">{module.label}</div>
                                            <div className="mt-1 text-sm text-gray-400">{module.desc}</div>
                                        </div>
                                        <div className="rounded-full bg-[#F5F6FA] px-3 py-1 text-xs font-bold text-gray-500">
                                            {module.groups.flatMap(group => group.items).filter(item => draftIdSet.has(item.field.id)).length}/{module.groups.flatMap(group => group.items).length}
                                        </div>
                                    </div>
                                    <div className="mt-5 space-y-4">
                                        {module.groups.map(group => (
                                            <div key={group.id} className={group.showHeader ? 'rounded-[20px] border border-[#EEF0F4] bg-[#FAFBFC] p-5' : ''}>
                                                {group.showHeader && (
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Layers3 size={15} className="text-[#00A35B]" />
                                                                <div className="text-sm font-black text-[#1F2129]">{group.label}</div>
                                                            </div>
                                                            <div className="mt-1 text-xs leading-5 text-gray-400">{group.desc}</div>
                                                        </div>
                                                        <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500 shadow-sm">
                                                            {group.items.filter(item => draftIdSet.has(item.field.id)).length}/{group.items.length}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`${group.showHeader ? 'mt-4' : ''} grid grid-cols-1 gap-3 lg:grid-cols-2`}>
                                                    {group.items.map(({ field, config }) => {
                                                        const checked = draftIdSet.has(field.id);
                                                        const disabled = requiredFieldIds.includes(field.id);
                                                        const currentDraftConfig = normalizedDraftConfigMap.get(field.id);
                                                        const childTemplates = COMMON_FIELD_CHILD_CONFIG_LIBRARY[field.id] || [];
                                                        const enabledChildCount = childTemplates.filter(child => currentDraftConfig?.childConfigs?.[child.id] ?? !!(child.isDefaultSelected || child.isSystem)).length;
                                                        const useFullWidthLayout = childTemplates.length > 0;
                                                        return (
                                                            <div
                                                                key={field.id}
                                                                className={`${useFullWidthLayout ? 'lg:col-span-2' : ''} rounded-[22px] border px-5 py-5 transition-colors ${checked ? 'border-[#BBF7D0] bg-[#F6FFF9] shadow-sm' : 'border-gray-200 bg-white hover:bg-[#FCFCFD]'}`}
                                                            >
                                                                <label className={`flex items-start gap-3 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                                        checked={checked}
                                                                        disabled={disabled}
                                                                        onChange={() => handleToggleField(field.id)}
                                                                    />
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="text-sm font-black text-[#1F2129]">{field.label}</span>
                                                                            {(config.isRequired || field.isRequired) && (
                                                                                <span className="rounded-full bg-[#FFF1F2] px-2 py-0.5 text-[10px] font-bold text-[#E11D48]">
                                                                                    必填
                                                                                </span>
                                                                            )}
                                                                            {field.isSystem && (
                                                                                <span className="rounded-full bg-[#F5F6FA] px-2 py-0.5 text-[10px] font-bold text-gray-500">
                                                                                    系统字段
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-1 text-xs leading-5 text-gray-400">
                                                                            {field.description || '用于当前类目商品创建时的默认录入字段。'}
                                                                        </div>
                                                                        {childTemplates.length > 0 && (
                                                                            <div className="mt-3 inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#166534] shadow-sm">
                                                                                已启用 {checked ? enabledChildCount : 0}/{childTemplates.length} 个子字段
                                                                            </div>
                                                                        )}
                                                                        <div className="mt-2 text-[11px] text-gray-300">字段 ID: {field.id}</div>
                                                                    </div>
                                                                </label>
                                                                {checked && childTemplates.length > 0 && currentDraftConfig && (
                                                                    <div className="mt-5 rounded-[22px] border border-[#DDEEE4] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(16,185,129,0.06)]">
                                                                        <div className="mb-4 flex items-center justify-between gap-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="h-2 w-2 rounded-full bg-[#00A35B]" />
                                                                                <div className="text-sm font-black text-[#1F2129]">子字段配置</div>
                                                                            </div>
                                                                            <div className="rounded-full bg-[#F0FDF4] px-3 py-1 text-[11px] font-bold text-[#166534]">
                                                                                {enabledChildCount}/{childTemplates.length}
                                                                            </div>
                                                                        </div>
                                                                        <div className="mb-4 text-xs leading-6 text-gray-400">
                                                                            列表字段支持继续配置二级列项，勾选后会同步影响创建商品时的表格列和规则区域展示。
                                                                        </div>
                                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                                            {childTemplates.map(child => {
                                                                                const childChecked = currentDraftConfig.childConfigs?.[child.id] ?? !!(child.isDefaultSelected || child.isSystem);
                                                                                const childLocked = !!child.isSystem;
                                                                                return (
                                                                                    <button
                                                                                        key={child.id}
                                                                                        type="button"
                                                                                        disabled={childLocked}
                                                                                        onClick={() => handleToggleChildField(field.id, child.id)}
                                                                                        className={`flex min-h-[88px] items-start justify-between rounded-[20px] border px-4 py-4 text-left transition-colors ${childChecked ? 'border-[#BBF7D0] bg-[#F0FDF4]' : 'border-gray-200 bg-[#FAFAFA]'} ${childLocked ? 'cursor-default' : 'hover:border-[#86EFAC] hover:bg-white'}`}
                                                                                    >
                                                                                        <div className="min-w-0 pr-3">
                                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                                <div className="text-sm font-black text-[#1F2129]">{child.label}</div>
                                                                                                {childLocked && (
                                                                                                    <span className="rounded-full bg-[#F5F6FA] px-2 py-0.5 text-[10px] font-bold text-gray-500">
                                                                                                        系统内置
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            {child.description && (
                                                                                                <div className="mt-1.5 text-xs leading-5 text-gray-400">{child.description}</div>
                                                                                            )}
                                                                                            <div className="mt-3 text-[11px] text-gray-300">code: {child.id}</div>
                                                                                        </div>
                                                                                        <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${childChecked ? 'border-[#00C06B] bg-[#00C06B] text-white' : 'border-gray-300 text-transparent'}`}>
                                                                                            ✓
                                                                                        </div>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {checked && field.children && field.children.length > 0 && childTemplates.length === 0 && (
                                                                    <div className="mt-3 rounded-2xl bg-white/90 px-3 py-3">
                                                                        <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">对应子字段</div>
                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                            {field.children.map(child => (
                                                                                <span key={child.id} className="rounded-full border border-[#D8EADF] bg-[#F7FFF9] px-2.5 py-1 text-[11px] font-bold text-[#166534]">
                                                                                    {child.label}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
