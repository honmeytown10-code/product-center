import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FolderTree, Layers3, RotateCcw, Save, ShieldCheck, Sparkles } from 'lucide-react';
import { AVAILABLE_DYNAMIC_FIELDS, Category, CategoryFieldConfig, COMMON_FIELD_CHILD_CONFIG_LIBRARY, DynamicFieldConfig, resolveChildRequiredConfigs } from '../../types';

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
            { id: 'display_list', label: '列表页展示', desc: '列表卡片中直接展示的图片、文案与标签。', fieldIds: ['p_img', 'p_list_desc', 'p_desc_tags', 'p_badge'], showHeader: true },
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
const MASTER_FIELD_IDS = new Set([
    'p_name', 'p_code', 'p_front_cat', 'p_back_cat', 'p_cat', 'p_weight_flag', 'p_unit', 'p_remark',
    'p_stat_tags', 'p_tare_weight', 'p_img', 's_specs', 'm_methods', 'a_addons',
    'c_groups', 'o_origin', 'o_ingredients',
]);
const CHANNEL_HIDDEN_FIELD_IDS = new Set([
    'p_code', 'p_back_cat', 'p_cat', 'p_stat_tags', 'p_tare_weight', 'o_origin', 'o_ingredients',
]);
const MASTER_SPEC_CHILD_IDS = new Set([
    's_spec_name', 's_spec_price', 's_spec_barcode', 's_spec_mark', 's_spec_sku_code', 's_spec_code', 's_spec_amount',
]);
const MASTER_METHOD_CHILD_IDS = new Set(['m_method_name', 'm_method_code', 'm_method_remark']);
const MASTER_ADDON_CHILD_IDS = new Set(['a_addon_name', 'a_addon_code']);
const CHANNEL_SPEC_HIDDEN_CHILD_IDS = new Set(['s_spec_barcode', 's_spec_mark', 's_spec_sku_code', 's_spec_code']);
const normalizeChildDisplayMode = (
    value: boolean | 'visible' | 'collapsed' | 'hidden' | undefined,
    isDefaultSelected: boolean
) => {
    if (value === 'visible') return 'visible';
    if (value === 'hidden') return 'hidden';
    if (value === 'collapsed') return 'visible';
    if (typeof value === 'boolean') return value ? 'visible' : 'hidden';
    return isDefaultSelected ? 'visible' : 'hidden';
};

const buildChildConfigs = (
    fieldId: string,
    current?: Record<string, boolean | 'visible' | 'collapsed' | 'hidden'>,
    currentRequiredConfigs?: Record<string, boolean>
) => {
    const childTemplates = COMMON_FIELD_CHILD_CONFIG_LIBRARY[fieldId] || [];
    if (childTemplates.length === 0) return undefined;
    return childTemplates.reduce<Record<string, 'visible' | 'collapsed' | 'hidden'>>((acc, child) => {
        const normalizedMode = normalizeChildDisplayMode(current?.[child.id], !!(child.isDefaultSelected || child.isSystem));
        acc[child.id] = child.isSystem || !!currentRequiredConfigs?.[child.id] ? 'visible' : normalizedMode;
        return acc;
    }, {});
};

const buildDraftFieldConfig = (
    config: CategoryFieldConfig,
    fieldConfigMap: Map<string, CategoryFieldConfig>
): CategoryFieldConfig => {
    const childRequiredConfigs = resolveChildRequiredConfigs(config.id, fieldConfigMap, config.childRequiredConfigs);
    return {
        id: config.id,
        isRequired: config.isRequired,
        displayMode: config.displayMode ?? 'visible',
        childConfigs: buildChildConfigs(config.id, config.childConfigs, childRequiredConfigs),
        childRequiredConfigs,
    };
};

interface Props {
    categories: WebCategoryLike[];
    configs: CommonFieldConfigs;
    initialType?: 'standard' | 'combo';
    initialCategoryId?: string | null;
    fieldScope?: 'master' | 'channel' | 'store';
    scopeLabel?: string;
    onBack: () => void;
    onSave: (type: 'standard' | 'combo', categoryId: string, fieldConfigs: CategoryFieldConfig[]) => void;
    onReset: (type: 'standard' | 'combo', categoryId: string) => void;
}

export const WebCommonFieldSettings: React.FC<Props> = ({
    categories,
    configs,
    initialType = 'standard',
    initialCategoryId = null,
    fieldScope = 'store',
    scopeLabel = '品牌级按类目生效',
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
    const categoryFieldConfigMap = useMemo(
        () => new Map(categoryFieldConfigs.map(config => [config.id, config])),
        [categoryFieldConfigs]
    );

    const availableCategoryFields = useMemo(() => (
        categoryFieldConfigs
            .filter(config => {
                if (fieldScope === 'master') return MASTER_FIELD_IDS.has(config.id);
                if (fieldScope === 'channel') return !CHANNEL_HIDDEN_FIELD_IDS.has(config.id);
                return true;
            })
            .map(config => {
                const field = AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === config.id);
                return field ? { config, field } : null;
            })
            .filter((item): item is { config: CategoryFieldConfig; field: typeof AVAILABLE_DYNAMIC_FIELDS[number] } => !!item)
    ), [categoryFieldConfigs, fieldScope]);

    useEffect(() => {
        if (!selectedCategory) {
            setDraftFieldConfigs([]);
            setSavedMessage('');
            return;
        }
        const configKey = getConfigKey(activeType, selectedCategory.id);
        setDraftFieldConfigs((configs[configKey] || []).map(config => buildDraftFieldConfig(config, categoryFieldConfigMap)));
        setSavedMessage('');
    }, [activeType, categoryFieldConfigMap, configs, selectedCategory]);

    const requiredFieldIds = useMemo(() => (
        availableCategoryFields
            .filter(item => item.config.isRequired || item.field.isRequired || item.field.isSystem)
            .map(item => item.field.id)
    ), [availableCategoryFields]);

    const normalizedDraftConfigs = useMemo(() => {
        const availableIds = new Set(availableCategoryFields.map(item => item.field.id));
        const fieldMap = new Map<string, { config: CategoryFieldConfig; field: DynamicFieldConfig }>(
            availableCategoryFields.map(item => [item.field.id, item] as const)
        );
        const nextMap = new Map<string, CategoryFieldConfig>();

        draftFieldConfigs
            .filter(item => availableIds.has(item.id))
            .forEach(item => {
                nextMap.set(item.id, buildDraftFieldConfig(item, categoryFieldConfigMap));
            });

        requiredFieldIds.forEach(fieldId => {
            const source = fieldMap.get(fieldId);
            if (!source) return;
            const existing = nextMap.get(fieldId);
            nextMap.set(fieldId, buildDraftFieldConfig(existing || source.config, categoryFieldConfigMap));
        });

        return Array.from(nextMap.values());
    }, [availableCategoryFields, categoryFieldConfigMap, draftFieldConfigs, requiredFieldIds]);

    const draftIdSet = useMemo(() => new Set(normalizedDraftConfigs.map(item => item.id)), [normalizedDraftConfigs]);
    const normalizedDraftConfigMap = useMemo(() => new Map(normalizedDraftConfigs.map(item => [item.id, item])), [normalizedDraftConfigs]);

    const fieldLookup = useMemo(
        () => new Map<string, { config: CategoryFieldConfig; field: DynamicFieldConfig }>(
            availableCategoryFields.map(item => [item.field.id, item] as const)
        ),
        [availableCategoryFields]
    );
    const getChildLockedState = (parentId: string, childId: string, child: { isSystem?: boolean }) => {
        const parentConfig = normalizedDraftConfigMap.get(parentId) || fieldLookup.get(parentId)?.config;
        return {
            required: !!parentConfig?.childRequiredConfigs?.[childId],
            locked: !!child.isSystem || !!parentConfig?.childRequiredConfigs?.[childId],
        };
    };

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

    const getFieldDisplayMode = (config?: CategoryFieldConfig, locked = false) => {
        if (locked) return 'visible' as const;
        return config?.displayMode ?? 'visible';
    };

    const visibleFieldCount = useMemo(
        () => normalizedDraftConfigs.filter(item => (item.displayMode ?? 'visible') === 'visible').length,
        [normalizedDraftConfigs]
    );
    const collapsedFieldCount = useMemo(
        () => normalizedDraftConfigs.filter(item => item.displayMode === 'collapsed').length,
        [normalizedDraftConfigs]
    );

    const handleSetFieldDisplayMode = (fieldId: string, displayMode: 'visible' | 'collapsed' | 'hidden') => {
        if (requiredFieldIds.includes(fieldId)) return;
        setSavedMessage('');
        setDraftFieldConfigs(prev => {
            const exists = prev.find(item => item.id === fieldId);
            if (exists) {
                return prev.map(item => item.id === fieldId ? { ...item, displayMode } : item);
            }
            const sourceField = availableCategoryFields.find(item => item.field.id === fieldId);
            if (!sourceField) return prev;
            return [...prev, { ...buildDraftFieldConfig(sourceField.config, categoryFieldConfigMap), displayMode }];
        });
    };

    const handleSetChildFieldDisplayMode = (parentId: string, childId: string, displayMode: 'visible' | 'hidden') => {
        const childTemplate = (COMMON_FIELD_CHILD_CONFIG_LIBRARY[parentId] || []).find(item => item.id === childId);
        if (childTemplate && getChildLockedState(parentId, childId, childTemplate).locked) return;
        setSavedMessage('');
        setDraftFieldConfigs(prev => {
            const existing = prev.find(item => item.id === parentId);
            if (existing) {
                return prev.map(item => {
                    if (item.id !== parentId) return item;
                    const childRequiredConfigs = resolveChildRequiredConfigs(parentId, categoryFieldConfigMap, item.childRequiredConfigs);
                    return {
                        ...item,
                        childConfigs: {
                            ...buildChildConfigs(parentId, item.childConfigs, childRequiredConfigs),
                            [childId]: displayMode,
                        },
                        childRequiredConfigs,
                    };
                });
            }

            const sourceField = availableCategoryFields.find(item => item.field.id === parentId);
            if (!sourceField) return prev;
            const nextItem = buildDraftFieldConfig(sourceField.config, categoryFieldConfigMap);
            return [...prev, {
                ...nextItem,
                childConfigs: {
                    ...buildChildConfigs(parentId, nextItem.childConfigs, nextItem.childRequiredConfigs),
                    [childId]: displayMode,
                },
            }];
        });
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
            <div className="h-16 shrink-0 border-b border-[#E8E8E8] bg-white px-5 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1F2129]"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <h2 className="text-[18px] font-bold text-[#1F2129]">常用字段设置</h2>
                            <span className="rounded-md bg-[#EAF9F1] px-2.5 py-1 text-xs font-bold text-[#00A35B]">
                                {scopeLabel}
                            </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-400">
                            {fieldScope === 'channel'
                                ? '由渠道运营团队按商品类目配置渠道商品表单的字段展示方式。'
                                : '为不同商品类目配置默认字段的展示方式，支持直接显示、折叠显示和隐藏。'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={!selectedCategory}
                        className="inline-flex items-center rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1F2129] disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#00C06B] hover:bg-[#F8FFFB]"
                    >
                        <RotateCcw size={15} className="mr-2" />
                        恢复系统默认
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!selectedCategory || !hasChanges}
                        className="inline-flex items-center rounded-md bg-[#1F2129] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        <Save size={15} className="mr-2" />
                        保存配置
                    </button>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
                <aside className="w-[300px] shrink-0 border-r border-[#E8E8E8] bg-white flex flex-col">
                    <div className="border-b border-[#E8E8E8] p-4">
                        <div className="flex rounded-md bg-[#F5F6FA] p-1">
                            <button
                                type="button"
                                onClick={() => setActiveType('standard')}
                                className={`flex-1 rounded px-3 py-2 text-sm font-bold transition-colors ${activeType === 'standard' ? 'bg-white text-[#00A35B]' : 'text-gray-500'}`}
                            >
                                标准商品
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveType('combo')}
                                className={`flex-1 rounded px-3 py-2 text-sm font-bold transition-colors ${activeType === 'combo' ? 'bg-white text-[#00A35B]' : 'text-gray-500'}`}
                            >
                                套餐商品
                            </button>
                        </div>
                        <div className="mt-4 rounded-md border border-[#E8F7EF] bg-[#F7FFF9] p-3">
                            <div className="flex items-center gap-2 text-sm font-black text-[#1F2129]">
                                <Sparkles size={16} className="text-[#00A35B]" />
                                配置规则
                            </div>
                            <div className="mt-2 text-xs leading-6 text-gray-500">
                                {fieldScope === 'channel'
                                    ? '这里只控制字段显示、折叠和隐藏；渠道可覆盖权限由主档管理团队统一设置。'
                                    : '系统必填字段默认直接显示且不可取消，保存后当前品牌该类目的创建表单会按你的显示/折叠规则渲染。'}
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
                                    className={`w-full rounded-md border px-3 py-3 text-left transition-all ${active ? 'border-[#BBF7D0] bg-[#F0FDF4]' : 'border-transparent bg-[#FAFAFA] hover:border-gray-200 hover:bg-white'}`}
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

                <main className="flex-1 min-w-0 overflow-y-auto no-scrollbar p-4">
                    {!selectedCategory ? (
                        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white text-gray-400">
                            请选择左侧类目后开始配置
                        </div>
                    ) : availableCategoryFields.length === 0 ? (
                        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white text-gray-400">
                            当前类目暂无可配置字段
                        </div>
                    ) : (
                        <div className="mx-auto max-w-[1180px] space-y-6">
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                                <div className="rounded-lg border border-gray-200 bg-white p-5">
                                    <div className="flex flex-wrap items-center gap-3">
              <div className="text-[18px] font-semibold text-[#1F2129]">{selectedCategory.name}</div>
                                        <span className="rounded-full bg-[#F5F6FA] px-3 py-1 text-xs font-bold text-gray-500">
                                            {activeType === 'standard' ? '标准商品' : '套餐商品'}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-sm leading-6 text-gray-500">
                                        可按类目配置字段的默认展示方式：高频字段直接显示，低频但仍会用到的字段默认折叠，其余字段隐藏。
                                    </div>
                                </div>
                                <div className="rounded-lg border border-[#E8F7EF] bg-[#F7FFF9] p-5">
                                    <div className="flex items-center gap-2 text-sm font-black text-[#1F2129]">
                                        <ShieldCheck size={16} className="text-[#00A35B]" />
                                        配置摘要
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                                            <div className="rounded-md bg-white px-4 py-3">
                                            <div className="text-xs text-gray-400">直接显示</div>
                                            <div className="mt-1 text-2xl font-black text-[#1F2129]">{visibleFieldCount}</div>
                                        </div>
                                                            <div className="rounded-md bg-white px-4 py-3">
                                            <div className="text-xs text-gray-400">折叠字段</div>
                                            <div className="mt-1 text-2xl font-black text-[#1F2129]">{collapsedFieldCount}</div>
                                        </div>
                                                            <div className="rounded-md bg-white px-4 py-3">
                                            <div className="text-xs text-gray-400">已配置字段</div>
                                            <div className="mt-1 text-2xl font-black text-[#1F2129]">{normalizedDraftConfigs.length}</div>
                                        </div>
                                                            <div className="rounded-md bg-white px-4 py-3">
                                            <div className="text-xs text-gray-400">类目总字段</div>
                                            <div className="mt-1 text-2xl font-black text-[#1F2129]">{availableCategoryFields.length}</div>
                                        </div>
                                    </div>
                                    {savedMessage && (
                                                    <div className="mt-4 rounded-md border border-[#BBF7D0] bg-white px-4 py-3 text-sm font-medium text-[#166534]">
                                            {savedMessage}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {groupedFields.map(module => (
                                <section key={module.id} className="rounded-lg border border-gray-200 bg-white p-5">
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
                                            <div key={group.id} className={group.showHeader ? 'rounded-md border border-[#EEF0F4] bg-[#FAFBFC] p-4' : ''}>
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
                                                        const disabled = requiredFieldIds.includes(field.id);
                                                        const currentDraftConfig = normalizedDraftConfigMap.get(field.id);
                                                        const childTemplates = (COMMON_FIELD_CHILD_CONFIG_LIBRARY[field.id] || []).filter(child => {
                                                            if (fieldScope === 'master') {
                                                                if (field.id === 's_specs') return MASTER_SPEC_CHILD_IDS.has(child.id);
                                                                if (field.id === 'm_methods') return MASTER_METHOD_CHILD_IDS.has(child.id);
                                                                if (field.id === 'a_addons') return MASTER_ADDON_CHILD_IDS.has(child.id);
                                                            }
                                                            if (fieldScope === 'channel' && field.id === 's_specs') {
                                                                return !CHANNEL_SPEC_HIDDEN_CHILD_IDS.has(child.id);
                                                            }
                                                            return true;
                                                        });
                                                        const hasChildControls = childTemplates.length > 0;
                                                        const effectiveConfig = currentDraftConfig || (childTemplates.length > 0 ? buildDraftFieldConfig(config, categoryFieldConfigMap) : undefined);
                                                        const childModeMap = childTemplates.reduce<Record<string, 'visible' | 'hidden'>>((acc, child) => {
                                                            const childState = getChildLockedState(field.id, child.id, child);
                                                            acc[child.id] = normalizeChildDisplayMode(
                                                                effectiveConfig?.childConfigs?.[child.id],
                                                                !!(child.isDefaultSelected || child.isSystem)
                                                            );
                                                            if (childState.locked) {
                                                                acc[child.id] = 'visible';
                                                            }
                                                            return acc;
                                                        }, {});
                                                        const visibleChildCount = childTemplates.filter(child => childModeMap[child.id] === 'visible').length;
                                                        const hiddenChildCount = childTemplates.length - visibleChildCount;
                                                        const displayMode = disabled ? 'visible' : (currentDraftConfig?.displayMode ?? 'hidden');
                                                        const isVisible = displayMode === 'visible';
                                                        const isCollapsed = displayMode === 'collapsed';
                                                        const isHidden = displayMode === 'hidden';
                                                        const useFullWidthLayout = childTemplates.length > 0;
                                                        return (
                                                            <div
                                                                key={field.id}
                                                                    className={`${useFullWidthLayout ? 'lg:col-span-2' : ''} rounded-lg border px-4 py-4 transition-colors ${
                                                                    isVisible
                                                                        ? 'border-[#BBF7D0] bg-[#F6FFF9] shadow-sm'
                                                                        : isCollapsed
                                                                            ? 'border-[#FDE68A] bg-[#FFFBEB] shadow-sm'
                                                                            : 'border-gray-200 bg-white hover:bg-[#FCFCFD]'
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                                                                        isVisible
                                                                            ? 'border-[#00C06B] bg-[#00C06B] text-white'
                                                                            : isCollapsed
                                                                                ? 'border-[#F59E0B] bg-[#F59E0B] text-white'
                                                                                : 'border-gray-300 bg-white text-transparent'
                                                                    }`}>
                                                                        ✓
                                                                    </div>
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
                                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                                            {disabled ? (
                                                                                <span className="inline-flex items-center rounded-full bg-[#ECFDF3] px-3 py-1 text-[11px] font-bold text-[#166534]">
                                                                                    必填字段，默认直接显示
                                                                                </span>
                                                                            ) : (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSetFieldDisplayMode(field.id, 'visible')}
                                                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                                                                                            isVisible
                                                                                                ? 'bg-[#00C06B] text-white'
                                                                                                : 'bg-[#F5F6FA] text-gray-500 hover:bg-[#EAF9F1] hover:text-[#00A35B]'
                                                                                        }`}
                                                                                    >
                                                                                        直接显示
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSetFieldDisplayMode(field.id, 'collapsed')}
                                                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                                                                                            isCollapsed
                                                                                                ? 'bg-[#F59E0B] text-white'
                                                                                                : 'bg-[#F5F6FA] text-gray-500 hover:bg-[#FFF7ED] hover:text-[#B45309]'
                                                                                        }`}
                                                                                    >
                                                                                        折叠显示
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSetFieldDisplayMode(field.id, 'hidden')}
                                                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                                                                                            isHidden
                                                                                                ? 'bg-[#1F2129] text-white'
                                                                                                : 'bg-[#F5F6FA] text-gray-500 hover:bg-gray-200 hover:text-[#1F2129]'
                                                                                        }`}
                                                                                    >
                                                                                        隐藏
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        {childTemplates.length > 0 && (
                                                                            <div className="mt-3 inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#166534] shadow-sm">
                                                                                直接显示 {visibleChildCount} 项，已隐藏 {hiddenChildCount} 项
                                                                            </div>
                                                                        )}
                                                                        <div className="mt-2 text-[11px] text-gray-300">字段 ID: {field.id}</div>
                                                                    </div>
                                                                </div>
                                                                {childTemplates.length > 0 && (
                                                                        <div className="mt-5 rounded-lg border border-[#DDEEE4] bg-white px-4 py-4">
                                                                        <div className="mb-4 flex items-center justify-between gap-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="h-2 w-2 rounded-full bg-[#00A35B]" />
                                                                                <div className="text-sm font-black text-[#1F2129]">子字段配置</div>
                                                                            </div>
                                                                            <div className="rounded-full bg-[#F0FDF4] px-3 py-1 text-[11px] font-bold text-[#166534]">
                                                                                {visibleChildCount}/{childTemplates.length}
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                                            {childTemplates.map(child => {
                                                                                const childMode = childModeMap[child.id];
                                                                                const childState = getChildLockedState(field.id, child.id, child);
                                                                                const childLocked = childState.locked;
                                                                                const hideChildActions = !!child.isSystem;
                                                                                return (
                                                                                    <div
                                                                                        key={child.id}
                                                                                        className={`min-h-[88px] rounded-md border px-4 py-4 transition-colors ${
                                                                                            childMode === 'visible'
                                                                                                ? 'border-[#BBF7D0] bg-[#F0FDF4]'
                                                                                                : 'border-gray-200 bg-[#FAFAFA]'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-start justify-between gap-3">
                                                                                            <div className="min-w-0 pr-3">
                                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                                    <div className="text-sm font-black text-[#1F2129]">{child.label}</div>
                                                                                                    {childState.required && (
                                                                                                        <span className="rounded-full bg-[#FFF1F2] px-2 py-0.5 text-[10px] font-bold text-[#E11D48]">
                                                                                                            必填
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {childLocked && (
                                                                                                        <span className="rounded-full bg-[#F5F6FA] px-2 py-0.5 text-[10px] font-bold text-gray-500">
                                                                                                            {child.isSystem ? '系统内置' : '固定显示'}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                {child.description && (
                                                                                                    <div className="mt-1.5 text-xs leading-5 text-gray-400">{child.description}</div>
                                                                                                )}
                                                                                                <div className="mt-3 text-[11px] text-gray-300">code: {child.id}</div>
                                                                                            </div>
                                                                                            <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                                                                                                childMode === 'visible'
                                                                                                    ? 'border-[#00C06B] bg-[#00C06B] text-white'
                                                                                                    : 'border-gray-300 bg-white text-transparent'
                                                                                            }`}>
                                                                                                ✓
                                                                                            </div>
                                                                                        </div>
                                                                                        {!hideChildActions && (
                                                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    disabled={childLocked}
                                                                                                    onClick={() => handleSetChildFieldDisplayMode(field.id, child.id, 'visible')}
                                                                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                                                                                                        childMode === 'visible'
                                                                                                            ? 'bg-[#00C06B] text-white'
                                                                                                            : 'bg-[#F5F6FA] text-gray-500 hover:bg-[#EAF9F1] hover:text-[#00A35B]'
                                                                                                    } ${childLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                                                                                                >
                                                                                                    直接显示
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    disabled={childLocked}
                                                                                                    onClick={() => handleSetChildFieldDisplayMode(field.id, child.id, 'hidden')}
                                                                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                                                                                                        childMode === 'hidden'
                                                                                                            ? 'bg-[#1F2129] text-white'
                                                                                                            : 'bg-[#F5F6FA] text-gray-500 hover:bg-gray-200 hover:text-[#1F2129]'
                                                                                                    } ${childLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                                                                                                >
                                                                                                    隐藏
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {currentDraftConfig && field.children && field.children.length > 0 && childTemplates.length === 0 && (
                                                                                            <div className="mt-3 rounded-md bg-white/90 px-3 py-3">
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
