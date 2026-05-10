
import React, { useMemo, useRef, useState } from 'react';
import { 
  ArrowLeft, FileText, Scale, Sliders, Settings, Printer, 
  CupSoda, ShoppingBag, Store, Check, Plus, ImageIcon, ChevronRight, AlertTriangle, Clock3,
  CheckCircle2, CircleAlert, Send, ClipboardList, ArrowRight, Tags, ChefHat
} from 'lucide-react';
import { Category, AVAILABLE_DYNAMIC_FIELDS, DynamicFieldConfig } from '../../types';
import { Switch, SectionHeader, FormRow } from './WebCommon';

interface WebProductFormProps {
    type: 'standard' | 'combo';
    category: Category;
    categories: Category[];
    onClose: () => void;
    mode?: 'create' | 'edit';
    initialProduct?: Record<string, any> | null;
}

const DEFAULT_RESET_FIELD_IDS = new Set(['p_weight_flag', 'st_member']);

type PrepUnit = '分钟' | '小时' | '天';
type PrepWindow = 'same_day' | 'advance';
type PrepScope = 'spu' | 'spec';

type PrepRule = {
    duration: string;
    unit: PrepUnit;
    window: PrepWindow;
    deferNextDay: boolean;
    deferAfterTime: string;
};

type SpecPrepRuleSet = {
    specId: string;
    specName: string;
    inStock: PrepRule;
    nonStock: PrepRule;
};

type ChannelKey = 'pos' | 'mini_dine' | 'mini_take' | 'meituan';
type SectionId = 'basic' | 'display' | 'spec' | 'method' | 'settings';
type ValidationItem = {
    key: string;
    label: string;
    section: SectionId;
    filled: boolean;
    type: 'required' | 'recommended';
};
type PreviewField = 'p_name' | 'p_img' | 'p_list_desc' | 's_specs' | 'm_methods' | 'a_addons' | 'default';
type PageView = 'form' | 'success' | 'sync' | 'template' | 'detail';
type InventoryMode = 'unlimited' | 'custom';
type SpecConfigRow = {
    id: string;
    s_spec_name: string;
    s_spec_price: string;
    s_spec_cost: string;
    s_spec_market: string;
    s_spec_barcode: string;
    s_spec_mark: string;
    s_spec_sku_code: string;
    s_spec_amount: string;
    s_spec_amount_unit: string;
    s_spec_inventory_mode: InventoryMode;
    s_spec_initial_stock: string;
    s_spec_max_stock: string;
    s_spec_warning_stock: string;
    s_spec_sale_status: 'on' | 'off';
    s_spec_channels: ChannelKey[];
    s_spec_store_pack_fee: string;
    s_spec_store_pack_mark: string;
    s_spec_take_pack_fee: string;
    s_spec_take_pack_mark: string;
    s_spec_img: string;
    s_spec_code: string;
};
type MethodConfigRow = {
    id: string;
    m_method_name: string;
    m_method_markup: string;
    m_method_code: string;
};

const PREP_UNIT_OPTIONS: PrepUnit[] = ['分钟', '小时', '天'];
const SECTION_LABELS: Record<SectionId, string> = {
    basic: '基础信息',
    display: '展示设置',
    spec: '销售属性',
    method: '商品属性',
    settings: '其他属性',
};
const SECTION_ORDER: SectionId[] = ['basic', 'method', 'display', 'spec', 'settings'];
const CHANNEL_OPTIONS: Array<{ key: ChannelKey; label: string; icon: React.ReactNode }> = [
    { key: 'pos', label: 'POS收银', icon: <Printer size={16} /> },
    { key: 'mini_dine', label: '小程序堂食', icon: <CupSoda size={16} /> },
    { key: 'mini_take', label: '小程序外卖', icon: <ShoppingBag size={16} /> },
    { key: 'meituan', label: '美团外卖', icon: <Store size={16} /> },
];
const RECOMMENDED_FIELD_IDS = ['p_img', 'p_list_desc'];
const PREVIEW_FIELD_TITLES: Record<PreviewField, { title: string; desc: string }> = {
    default: { title: '商品展示效果', desc: '点击表单中的关键字段，可查看其在小程序端的展示位置。' },
    p_name: { title: '商品名称效果', desc: '用于突出商品标题，帮助用户快速识别商品。' },
    p_img: { title: '商品主图效果', desc: '主图会展示在商品列表首位区域，影响首屏点击率。' },
    p_list_desc: { title: '列表页简述效果', desc: '列表页简述展示在商品标题下方，用于补充口味卖点。' },
    s_specs: { title: '暂无填写效果示例', desc: '规格配置暂不提供左侧效果预览，可直接在右侧完成规格设置。' },
    m_methods: { title: '做法展示效果', desc: '做法会作为可选项展示，可配置加价信息。' },
    a_addons: { title: '加料展示效果', desc: '加料会在详情页作为附加选项展示，便于用户搭配。' },
};

const createDefaultPrepRule = (overrides: Partial<PrepRule> = {}): PrepRule => ({
    duration: '0',
    unit: '分钟',
    window: 'same_day',
    deferNextDay: false,
    deferAfterTime: '21:00',
    ...overrides,
});

const DEFAULT_SPEC_PREP_RULES: SpecPrepRuleSet[] = [
    {
        specId: 'classic',
        specName: '8寸',
        inStock: createDefaultPrepRule({ duration: '15', unit: '分钟', window: 'same_day' }),
        nonStock: createDefaultPrepRule({ duration: '2', unit: '小时', window: 'advance', deferNextDay: true, deferAfterTime: '21:00' }),
    },
    {
        specId: 'large',
        specName: '10寸',
        inStock: createDefaultPrepRule({ duration: '25', unit: '分钟', window: 'same_day' }),
        nonStock: createDefaultPrepRule({ duration: '4', unit: '小时', window: 'advance', deferNextDay: true, deferAfterTime: '20:00' }),
    },
    {
        specId: 'gift',
        specName: '12寸',
        inStock: createDefaultPrepRule({ duration: '1', unit: '小时', window: 'same_day' }),
        nonStock: createDefaultPrepRule({ duration: '1', unit: '天', window: 'advance', deferNextDay: true, deferAfterTime: '18:00' }),
    },
];

const clonePrepRule = (rule: PrepRule): PrepRule => ({ ...rule });

const formatPrepRuleSummary = (rule: PrepRule) => {
    const duration = rule.duration || '0';
    const windowText = rule.window === 'same_day' ? '当天备货' : '提前备货';
    const deferText = rule.window === 'advance' && rule.deferNextDay ? `，${rule.deferAfterTime}后下单顺延至次日制作` : '';
    return `${duration}${rule.unit}，${windowText}${deferText}`;
};

export const WebProductForm: React.FC<WebProductFormProps> = ({ type, category, categories, onClose, mode = 'create', initialProduct = null }) => {
    const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>(() => initialProduct ? {
        p_name: initialProduct.name || '',
        p_front_cat: initialProduct.category || '',
        p_img: initialProduct.image || '',
    } : {});
    const formContentRef = useRef<HTMLDivElement | null>(null);
    const stickyToolbarRef = useRef<HTMLDivElement | null>(null);
    const [activeFormSection, setActiveFormSection] = useState('basic');
    const [pageView, setPageView] = useState<PageView>('form');
    const [currentCategory, setCurrentCategory] = useState(category);
    const [pendingCategory, setPendingCategory] = useState<Category | null>(null);
    const [showCategoryImpactModal, setShowCategoryImpactModal] = useState(false);
    const [prepEnabled, setPrepEnabled] = useState(true);
    const [prepScope, setPrepScope] = useState<PrepScope>('spu');
    const [splitByStockState, setSplitByStockState] = useState(false);
    const [specDisplayMode, setSpecDisplayMode] = useState<'single' | 'multi'>('multi');
    const [activePreviewField, setActivePreviewField] = useState<PreviewField>('default');
    const [saveAttempted, setSaveAttempted] = useState(false);
    const [draftSaved, setDraftSaved] = useState(false);
    const [hasSavedProduct, setHasSavedProduct] = useState(mode === 'edit');
    const [successMode, setSuccessMode] = useState<'create' | 'edit'>(mode === 'edit' ? 'edit' : 'create');
    const [selectedSuccessAction, setSelectedSuccessAction] = useState<'sync' | 'template' | 'detail' | null>(null);
    const [uniformPrepRule, setUniformPrepRule] = useState<PrepRule>(() => createDefaultPrepRule({ duration: '30', unit: '分钟', window: 'same_day' }));
    const [uniformStockRules, setUniformStockRules] = useState<{ inStock: PrepRule; nonStock: PrepRule }>(() => ({
        inStock: createDefaultPrepRule({ duration: '20', unit: '分钟', window: 'same_day' }),
        nonStock: createDefaultPrepRule({ duration: '4', unit: '小时', window: 'advance', deferNextDay: true, deferAfterTime: '21:00' }),
    }));
    const [specPrepRules, setSpecPrepRules] = useState<SpecPrepRuleSet[]>(() => DEFAULT_SPEC_PREP_RULES.map(item => ({
        specId: item.specId,
        specName: item.specName,
        inStock: clonePrepRule(item.inStock),
        nonStock: clonePrepRule(item.nonStock),
    })));
    const [specConfigRows, setSpecConfigRows] = useState<SpecConfigRow[]>([
        { id: 'spec-1', s_spec_name: '8寸', s_spec_price: '128', s_spec_cost: '76', s_spec_market: '148', s_spec_barcode: '690000000801', s_spec_mark: '经典款', s_spec_sku_code: 'SKU-08', s_spec_amount: '1.00', s_spec_amount_unit: '克', s_spec_inventory_mode: 'custom', s_spec_initial_stock: '200', s_spec_max_stock: '9999', s_spec_warning_stock: '20', s_spec_sale_status: 'on', s_spec_channels: ['mini_dine', 'mini_take', 'pos'], s_spec_store_pack_fee: '1', s_spec_store_pack_mark: '蛋糕盒', s_spec_take_pack_fee: '2', s_spec_take_pack_mark: '保温袋', s_spec_img: '已上传', s_spec_code: 'CAKE-08' },
        { id: 'spec-2', s_spec_name: '10寸', s_spec_price: '168', s_spec_cost: '98', s_spec_market: '188', s_spec_barcode: '690000000802', s_spec_mark: '热销', s_spec_sku_code: 'SKU-10', s_spec_amount: '1.50', s_spec_amount_unit: '克', s_spec_inventory_mode: 'custom', s_spec_initial_stock: '120', s_spec_max_stock: '9999', s_spec_warning_stock: '15', s_spec_sale_status: 'on', s_spec_channels: ['mini_dine', 'meituan'], s_spec_store_pack_fee: '1', s_spec_store_pack_mark: '礼盒装', s_spec_take_pack_fee: '3', s_spec_take_pack_mark: '配送包装', s_spec_img: '', s_spec_code: 'CAKE-10' },
        { id: 'spec-3', s_spec_name: '12寸', s_spec_price: '228', s_spec_cost: '132', s_spec_market: '258', s_spec_barcode: '690000000803', s_spec_mark: '大份', s_spec_sku_code: 'SKU-12', s_spec_amount: '2.00', s_spec_amount_unit: '克', s_spec_inventory_mode: 'unlimited', s_spec_initial_stock: '0', s_spec_max_stock: '9999', s_spec_warning_stock: '0', s_spec_sale_status: 'off', s_spec_channels: ['mini_take'], s_spec_store_pack_fee: '2', s_spec_store_pack_mark: '生日套装', s_spec_take_pack_fee: '4', s_spec_take_pack_mark: '加固包装', s_spec_img: '', s_spec_code: 'CAKE-12' },
    ]);
    const [methodConfigRows, setMethodConfigRows] = useState<MethodConfigRow[]>([
        { id: 'method-1', m_method_name: '生日牌', m_method_markup: '10', m_method_code: 'METHOD-01' },
        { id: 'method-2', m_method_name: '蜡烛套装', m_method_markup: '5', m_method_code: 'METHOD-02' },
    ]);

    const getStickyOffset = () => {
        const stickyHeight = stickyToolbarRef.current?.offsetHeight ?? 0;
        return stickyHeight + 28;
    };

    const scrollToSection = (id: string) => {
        setActiveFormSection(id);
        const container = formContentRef.current;
        const element = document.getElementById(id);
        if (container && element) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const nextTop = container.scrollTop + elementRect.top - containerRect.top - getStickyOffset();
            container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
        }
    };

    const scrollToTarget = (targetId: string, sectionId?: string) => {
        if (sectionId) setActiveFormSection(sectionId);
        const container = formContentRef.current;
        const element = document.getElementById(targetId) || (sectionId ? document.getElementById(sectionId) : null);
        if (container && element) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const nextTop = container.scrollTop + elementRect.top - containerRect.top - getStickyOffset();
            container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
        }
    };

    const getValidationTargetId = (itemKey: string) => {
        if (['spec-price', 'spec-stock', 'spec-pack', 's_specs'].includes(itemKey)) return 'field-s_specs';
        const rawKey = itemKey.startsWith('recommend-') ? itemKey.replace('recommend-', '') : itemKey;
        return `field-${rawKey}`;
    };

    const currentCategoryFieldIds = useMemo(() => {
        const fields = type === 'combo' ? currentCategory.comboFields : currentCategory.standardFields;
        return fields.map(field => field.id);
    }, [currentCategory, type]);

    const currentFieldConfigs = useMemo(
        () => (type === 'combo' ? currentCategory.comboFields : currentCategory.standardFields),
        [currentCategory, type]
    );
    const visibleFieldIds = useMemo(() => new Set(currentCategoryFieldIds), [currentCategoryFieldIds]);
    const currentFieldConfigMap = useMemo(() => new Map(currentFieldConfigs.map(field => [field.id, field])), [currentFieldConfigs]);
    const getImpactedFieldsForCategory = (targetCategory: Category) => {
        const nextFieldIds = new Set((type === 'combo' ? targetCategory.comboFields : targetCategory.standardFields).map(field => field.id));
        const removedIds = currentCategoryFieldIds.filter(id => !nextFieldIds.has(id));
        const removedFields = removedIds
            .map(id => AVAILABLE_DYNAMIC_FIELDS.find(field => field.id === id))
            .filter((field): field is DynamicFieldConfig => !!field);

        return {
            resetFields: removedFields.filter(field => DEFAULT_RESET_FIELD_IDS.has(field.id)),
            clearFields: removedFields.filter(field => !DEFAULT_RESET_FIELD_IDS.has(field.id))
        };
    };

    const impactedFields = useMemo(() => {
        if (!pendingCategory) return { resetFields: [] as DynamicFieldConfig[], clearFields: [] as DynamicFieldConfig[] };
        return getImpactedFieldsForCategory(pendingCategory);
    }, [pendingCategory, currentCategoryFieldIds, type]);

    const getFieldSection = (field: DynamicFieldConfig): SectionId => {
        if (field.module === 'base') return 'basic';
        if (field.module === 'display') return 'display';
        if (field.module === 'sales') return 'spec';
        if (field.module === 'product_attr') return 'method';
        return 'settings';
    };

    const getFieldConfig = (fieldId: string) => currentFieldConfigMap.get(fieldId);
    const isFieldEnabled = (fieldId: string) => visibleFieldIds.has(fieldId);
    const getEnabledChildIds = (fieldId: string, fallbackIds: string[]) => {
        const childConfigs = getFieldConfig(fieldId)?.childConfigs;
        if (!childConfigs) return fallbackIds;
        const enabled = fallbackIds.filter(id => childConfigs[id] !== false);
        return enabled.length > 0 ? enabled : fallbackIds;
    };

    const isDynamicFieldFilled = (field: DynamicFieldConfig) => {
        const value = dynamicFormData[field.id];
        if (field.id === 'p_cat') return !!currentCategory.id;
        switch (field.type) {
            case 'input':
            case 'selector':
            case 'textarea':
            case 'rich_text':
            case 'number':
            case 'ref_selector':
                return value !== undefined && value !== null && String(value).trim() !== '';
            case 'image':
                return !!value;
            case 'switch':
                return typeof value === 'boolean';
            case 'radio_group':
            case 'checkbox_group':
                return !!value && Object.keys(value).length > 0;
            case 'tag_group':
                return Array.isArray(value) ? value.length > 0 : !!value;
            default:
                return !!value;
        }
    };

    const visibleSpecRows = useMemo(
        () => (specDisplayMode === 'single' ? specConfigRows.slice(0, 1) : specConfigRows),
        [specConfigRows, specDisplayMode]
    );

    const isSpecPriceFilled = useMemo(
        () => visibleSpecRows.every(row => String(row.s_spec_price ?? '').trim() !== ''),
        [visibleSpecRows]
    );

    const isSpecStockFilled = useMemo(
        () => visibleSpecRows.every(row => row.s_spec_inventory_mode === 'unlimited' || String(row.s_spec_initial_stock ?? '').trim() !== ''),
        [visibleSpecRows]
    );

    const isSpecPackFilled = useMemo(
        () => visibleSpecRows.every(row => String(row.s_spec_store_pack_fee ?? '').trim() !== '' || String(row.s_spec_take_pack_fee ?? '').trim() !== ''),
        [visibleSpecRows]
    );

    const validationItems = useMemo<ValidationItem[]>(() => {
        const items: ValidationItem[] = [];
        currentFieldConfigs.forEach(config => {
            const field = AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === config.id);
            if (!field || !visibleFieldIds.has(field.id)) return;
            if (['s_price', 's_pack_fee', 's_stock', 's_specs'].includes(field.id)) return;
            const required = config.isRequired || !!field.isRequired;
            if (required) {
                items.push({
                    key: field.id,
                    label: field.label,
                    section: getFieldSection(field),
                    filled: isDynamicFieldFilled(field),
                    type: 'required',
                });
            }
            if (RECOMMENDED_FIELD_IDS.includes(field.id)) {
                items.push({
                    key: `recommend-${field.id}`,
                    label: field.label,
                    section: getFieldSection(field),
                    filled: isDynamicFieldFilled(field),
                    type: 'recommended',
                });
            }
        });

        if (visibleFieldIds.has('s_price')) {
            items.push({
                key: 'spec-price',
                label: '规格基础价格',
                section: 'method',
                filled: isSpecPriceFilled,
                type: 'required',
            });
        }

        if (visibleFieldIds.has('s_stock')) {
            items.push({
                key: 'spec-stock',
                label: '规格库存',
                section: 'method',
                filled: isSpecStockFilled,
                type: 'required',
            });
        }

        if ((currentFieldConfigMap.get('s_pack_fee')?.isRequired || false) && visibleFieldIds.has('s_pack_fee')) {
            items.push({
                key: 'spec-pack',
                label: '规格包装费',
                section: 'method',
                filled: isSpecPackFilled,
                type: 'required',
            });
        }

        if (visibleFieldIds.has('s_specs')) {
            items.push({
                key: 's_specs',
                label: '规格信息配置',
                section: 'method',
                filled: visibleSpecRows.length > 0,
                type: 'recommended',
            });
        }

        return items;
    }, [currentCategory.id, currentFieldConfigMap, currentFieldConfigs, dynamicFormData, isSpecPackFilled, isSpecPriceFilled, isSpecStockFilled, visibleFieldIds, visibleSpecRows.length]);

    const requiredMissingItems = useMemo(
        () => validationItems.filter(item => item.type === 'required' && !item.filled),
        [validationItems]
    );
    const recommendedMissingItems = useMemo(() => {
        const requiredRawKeys = new Set(
            validationItems
                .filter(item => item.type === 'required')
                .map(item => item.key.startsWith('recommend-') ? item.key.replace('recommend-', '') : item.key)
        );
        return validationItems.filter(item => (
            item.type === 'recommended'
            && !item.filled
            && !requiredRawKeys.has(item.key.replace('recommend-', ''))
        ));
    }, [validationItems]);
    const sectionProgress = useMemo(() => (
        SECTION_ORDER.reduce((acc, sectionId) => {
            const sectionItems = validationItems.filter(item => item.section === sectionId && item.type === 'required');
            const completed = sectionItems.filter(item => item.filled).length;
            acc[sectionId] = {
                total: sectionItems.length,
                completed,
                status: sectionItems.length === 0 ? 'optional' : completed === sectionItems.length ? 'completed' : completed > 0 ? 'partial' : 'pending',
            };
            return acc;
        }, {} as Record<SectionId, { total: number; completed: number; status: 'completed' | 'partial' | 'pending' | 'optional' }>)
    ), [validationItems]);
    const completionSummary = useMemo(() => {
        const total = validationItems.filter(item => item.type === 'required').length;
        return { total, completed: total - requiredMissingItems.length };
    }, [requiredMissingItems.length, validationItems]);

    const renderSectionMeta = (sectionId: SectionId) => {
        const info = sectionProgress[sectionId];
        if (!info || info.status === 'optional') return null;
        return (
            <span className="inline-flex min-w-[42px] justify-center rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-bold text-[#00A35B]">
                {info.completed}/{info.total}
            </span>
        );
    };


    const handleCategoryChangeRequest = (categoryId: string) => {
        const targetCategory = categories.find(item => item.id === categoryId);
        if (!targetCategory || targetCategory.id === currentCategory.id) return;
        const nextImpactedFields = getImpactedFieldsForCategory(targetCategory);
        if (nextImpactedFields.resetFields.length === 0 && nextImpactedFields.clearFields.length === 0) {
            setCurrentCategory(targetCategory);
            setPendingCategory(null);
            setShowCategoryImpactModal(false);
            return;
        }
        setPendingCategory(targetCategory);
        setShowCategoryImpactModal(true);
    };

    const confirmCategoryChange = () => {
        if (!pendingCategory) return;
        setCurrentCategory(pendingCategory);
        setPendingCategory(null);
        setShowCategoryImpactModal(false);
    };

    const cancelCategoryChange = () => {
        setPendingCategory(null);
        setShowCategoryImpactModal(false);
    };

    const handleSave = () => {
        setDraftSaved(false);
        setSaveAttempted(true);
        if (requiredMissingItems.length > 0) {
            scrollToTarget(getValidationTargetId(requiredMissingItems[0].key), requiredMissingItems[0].section);
            return;
        }
        const nextSuccessMode = hasSavedProduct ? 'edit' : 'create';
        setSuccessMode(nextSuccessMode);
        setHasSavedProduct(true);
        setPageView('success');
        setSelectedSuccessAction(null);
    };

    const handleSaveDraft = () => {
        setDraftSaved(true);
        setSaveAttempted(false);
    };

    const handleSuccessAction = (action: 'sync' | 'template' | 'detail') => {
        setSelectedSuccessAction(action);
        setPageView(action);
    };

    const handleContinueCreate = () => {
        setDynamicFormData({});
        setDraftSaved(false);
        setSaveAttempted(false);
        setHasSavedProduct(false);
        setSuccessMode('create');
        setSelectedSuccessAction(null);
        setActivePreviewField('default');
        setActiveFormSection('basic');
        setPageView('form');
        formContentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    };

    // Form Renderer Helper
    const renderDynamicInput = (field: DynamicFieldConfig & { isRequiredConfig: boolean }) => {
        const value = dynamicFormData[field.id] || '';
        const setValue = (v: any) => setDynamicFormData(prev => ({ ...prev, [field.id]: v }));
        const previewField: PreviewField = ['p_name', 'p_img', 'p_list_desc', 'm_methods', 'a_addons'].includes(field.id)
            ? field.id as PreviewField
            : 'default';
        const setPreview = () => setActivePreviewField(previewField);
        
        if (field.id === 'p_cat') {
             return (
                 <div className="relative">
                     <select
                        className="q-form-select"
                        value={currentCategory.id}
                        onChange={e => handleCategoryChangeRequest(e.target.value)}
                     >
                        {categories.map(option => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                     </select>
                     <p className="text-[11px] text-gray-400 mt-2">切换类目后，不适用字段会在保存时被清空或恢复默认值。</p>
                 </div>
             );
        }

        switch (field.type) {
           case 'input': return (<div className="relative"><input onFocus={setPreview} className="q-form-input" placeholder={field.placeholder || `请输入${field.label}`} value={value} onChange={e => setValue(e.target.value)} />{field.id === 'p_name' && <span className="absolute right-4 top-3 text-xs text-gray-400">{value.length}/70</span>}</div>);
           case 'number': return (<div className="relative"><input onFocus={setPreview} type="number" className="q-form-input pl-8" placeholder="0.00" value={value} onChange={e => setValue(e.target.value)} /><span className="absolute left-3 top-3 text-gray-400">¥</span></div>);
           case 'selector': return (<select onFocus={setPreview} className="q-form-select" value={value} onChange={e => setValue(e.target.value)}><option value="">请选择{field.label}...</option><option value="opt1">选项一</option><option value="opt2">选项二</option></select>);
           case 'switch': return (<div className="flex items-center space-x-3"><Switch active={!!value} onClick={() => setValue(!value)}/><span className="text-sm text-gray-600">{value ? '已开启' : '已关闭'}</span></div>);
           case 'radio_group': {
               const radioVal = value || {};
               const activeRadioKey = Object.keys(radioVal)[0];
               return (
                   <div className="flex flex-col space-y-2 w-full">
                       <div className="flex flex-wrap gap-x-8 gap-y-3 items-center">
                           {(field.presetValues || []).map(opt => {
                               const isActive = activeRadioKey === opt;
                               const qty = radioVal[opt] || 1;
                               return (
                                   <div key={opt} className="flex items-center space-x-3">
                                   <label className="flex items-center space-x-2 cursor-pointer group py-1.5">
                                       <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'border-[#00C06B]' : 'border-gray-300 group-hover:border-[#00C06B]'}`}>
                                           {isActive && <div className="w-2 h-2 bg-[#00C06B] rounded-full"></div>}
                                       </div>
                                       <span className={`text-[13px] ${isActive ? 'text-[#00C06B] font-bold' : 'text-gray-600'}`}>{opt}</span>
                                       <input type="radio" className="hidden" checked={isActive} onChange={() => setValue({ [opt]: 1 })} />
                                   </label>
                                   {isActive && (
                                       <div className="flex items-center bg-white border border-gray-200 rounded text-xs font-bold animate-in slide-in-from-left-1 fade-in duration-200 shadow-sm overflow-hidden">
                                           <button onClick={(e) => { e.preventDefault(); if (qty <= 1) setValue({}); else setValue({ [opt]: qty - 1 }); }} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#00C06B] hover:bg-[#00C06B]/5 transition-colors">-</button>
                                           <span className="w-6 text-center text-[#1F2129] border-x border-gray-100 bg-gray-50/50 leading-6">{qty}</span>
                                           <button onClick={(e) => { e.preventDefault(); setValue({ [opt]: qty + 1 }); }} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#00C06B] hover:bg-[#00C06B]/5 transition-colors">+</button>
                                       </div>
                                   )}
                               </div>
                           );
                       })}
                       </div>
                   </div>
               );
           }
           case 'checkbox_group': {
               const checkVal = value || {};
               return (
                   <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-2 gap-x-6 items-center w-full">
                       {(field.presetValues || []).map(opt => {
                           const isActive = !!checkVal[opt];
                           const qty = checkVal[opt] || 1;
                           return (
                               <div key={opt} className="flex items-center space-x-3">
                                   <label className="flex items-center space-x-2 cursor-pointer group py-1.5">
                                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-[#00C06B] border-[#00C06B]' : 'border-gray-300 group-hover:border-[#00C06B]'}`}>
                                           {isActive && <Check size={12} className="text-white stroke-[3]"/>}
                                       </div>
                                       <span className={`text-[13px] ${isActive ? 'text-[#00C06B] font-bold' : 'text-gray-600'}`}>{opt}</span>
                                       <input type="checkbox" className="hidden" checked={isActive} onChange={() => {
                                           const newVal = { ...checkVal };
                                           if (isActive) delete newVal[opt];
                                           else newVal[opt] = 1;
                                           setValue(newVal);
                                       }} />
                                   </label>
                                   {isActive && (
                                       <div className="flex items-center bg-white border border-gray-200 rounded text-xs font-bold animate-in slide-in-from-left-1 fade-in duration-200 shadow-sm overflow-hidden">
                                           <button onClick={(e) => { e.preventDefault(); if (qty <= 1) { const newVal = { ...checkVal }; delete newVal[opt]; setValue(newVal); } else setValue({ ...checkVal, [opt]: qty - 1 }); }} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#00C06B] hover:bg-[#00C06B]/5 transition-colors">-</button>
                                           <span className="w-6 text-center text-[#1F2129] border-x border-gray-100 bg-gray-50/50 leading-6">{qty}</span>
                                           <button onClick={(e) => { e.preventDefault(); setValue({ ...checkVal, [opt]: qty + 1 }); }} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#00C06B] hover:bg-[#00C06B]/5 transition-colors">+</button>
                                       </div>
                                   )}
                               </div>
                           );
                       })}
                   </div>
               );
           }
           case 'tag_group': return (<div className="flex flex-wrap gap-2">{(field.presetValues || ['热门', '推荐', '新品']).map(tag => (<button key={tag} onClick={() => { setPreview(); const currentTags = (value as string[]) || []; if (currentTags.includes(tag)) setValue(currentTags.filter(t => t !== tag)); else setValue([...currentTags, tag]); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${(value as string[])?.includes(tag) ? 'bg-[#00C06B]/10 border-[#00C06B] text-[#00C06B]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{tag}</button>))}<button type="button" onClick={() => { setPreview(); const currentTags = (value as string[]) || []; if (!currentTags.includes('自定义标签')) setValue([...currentTags, '自定义标签']); }} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-gray-300 text-gray-400 hover:text-[#00C06B] hover:border-[#00C06B] transition-all flex items-center"><Plus size={12} className="mr-1"/> 自定义</button></div>);
           case 'image': return (<div className="flex items-start space-x-4"><button type="button" onClick={() => { setPreview(); setValue(value ? '' : 'mock-image'); }} className={`w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center transition-colors cursor-pointer group ${value ? 'border-[#00C06B] bg-[#F0FDF4] text-[#00C06B]' : 'bg-gray-50 border-dashed border-gray-200 text-gray-400 hover:border-[#00C06B] hover:text-[#00C06B]'}`}><ImageIcon size={24} className="mb-1"/><span className="text-xs">{value ? '已上传' : '添加图片'}</span></button><div className="text-xs text-gray-400 pt-2"><p>建议尺寸: 800x800px</p><p>支持格式: JPG, PNG</p><p>大小限制: 2MB</p></div></div>);
           case 'textarea': return (<textarea onFocus={setPreview} className="q-form-input min-h-[100px] py-3" placeholder={field.placeholder || "请输入..."} value={value} onChange={e => setValue(e.target.value)}></textarea>);
           case 'rich_text': return (<div className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">富文本编辑器占位</div>);
           case 'ref_selector': return (<button type="button" onClick={() => { setPreview(); setValue(value ? '' : '已选择'); }} className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm flex justify-between items-center cursor-pointer hover:bg-white hover:border-[#00C06B] transition-all"><span>{value ? '已选择 1 项' : '点击选择关联项'}</span><ChevronRight size={16}/></button>);
           default: return <div className="text-gray-400 text-xs">暂不支持该控件类型</div>;
        }
    };

    const updatePrepRuleValue = (
        updater: React.Dispatch<React.SetStateAction<PrepRule>>,
        key: keyof PrepRule,
        value: string | boolean
    ) => {
        updater(prev => ({ ...prev, [key]: value }));
    };

    const updateStockRuleValue = (
        groupUpdater: React.Dispatch<React.SetStateAction<{ inStock: PrepRule; nonStock: PrepRule }>>,
        stockKey: 'inStock' | 'nonStock',
        fieldKey: keyof PrepRule,
        value: string | boolean
    ) => {
        groupUpdater(prev => ({
            ...prev,
            [stockKey]: {
                ...prev[stockKey],
                [fieldKey]: value,
            },
        }));
    };

    const updateSpecRuleValue = (
        specId: string,
        stockKey: 'inStock' | 'nonStock',
        fieldKey: keyof PrepRule,
        value: string | boolean
    ) => {
        setSpecPrepRules(prev => prev.map(item => (
            item.specId === specId
                ? {
                    ...item,
                    [stockKey]: {
                        ...item[stockKey],
                        [fieldKey]: value,
                    },
                }
                : item
        )));
    };

    const handleRuleNumberStep = (
        currentRule: PrepRule,
        updater: React.Dispatch<React.SetStateAction<PrepRule>>,
        delta: number
    ) => {
        const current = Number(currentRule.duration || 0);
        const next = Math.max(0, current + delta);
        updater(prev => ({ ...prev, duration: String(next) }));
    };

    const handleStockRuleNumberStep = (
        rules: { inStock: PrepRule; nonStock: PrepRule },
        updater: React.Dispatch<React.SetStateAction<{ inStock: PrepRule; nonStock: PrepRule }>>,
        stockKey: 'inStock' | 'nonStock',
        delta: number
    ) => {
        const current = Number(rules[stockKey].duration || 0);
        const next = Math.max(0, current + delta);
        updateStockRuleValue(updater, stockKey, 'duration', String(next));
    };

    const handleSpecRuleNumberStep = (specId: string, stockKey: 'inStock' | 'nonStock', currentRule: PrepRule, delta: number) => {
        const current = Number(currentRule.duration || 0);
        const next = Math.max(0, current + delta);
        updateSpecRuleValue(specId, stockKey, 'duration', String(next));
    };

    const handleStockSplitChange = (nextValue: boolean) => {
        setSplitByStockState(nextValue);
        if (nextValue) {
            setUniformStockRules(prev => ({
                inStock: clonePrepRule(prev.inStock.duration ? prev.inStock : uniformPrepRule),
                nonStock: clonePrepRule(prev.nonStock.duration ? prev.nonStock : uniformPrepRule),
            }));
            setSpecPrepRules(prev => prev.map(item => ({
                ...item,
                nonStock: clonePrepRule(item.nonStock.duration ? item.nonStock : item.inStock),
            })));
            return;
        }

        setUniformPrepRule(clonePrepRule(uniformStockRules.inStock));
    };

    const updateSpecConfigRow = (rowId: string, key: keyof SpecConfigRow, value: SpecConfigRow[keyof SpecConfigRow]) => {
        setSpecConfigRows(prev => prev.map(item => item.id === rowId ? { ...item, [key]: value } : item));
    };

    const updateMethodConfigRow = (rowId: string, key: keyof MethodConfigRow, value: string) => {
        setMethodConfigRows(prev => prev.map(item => item.id === rowId ? { ...item, [key]: value } : item));
    };

    const renderSalesAttributePanel = () => {
        const minPurchaseEnabled = !!dynamicFormData.s_min_purchase_toggle;
        const maxPurchaseEnabled = !!dynamicFormData.s_max_purchase_toggle;
        const timeSaleEnabled = !!dynamicFormData.s_time_sale_toggle;
        const saleMode = dynamicFormData.s_sale_mode || '正常售卖';
        const saleSettings = dynamicFormData.s_sale_settings || {};
        const takeoutRule = dynamicFormData.s_takeout_rule || '正常售卖';
        const taxRate = dynamicFormData.s_tax_rate || '';

        const renderSwitchRow = (label: string, toggleId: string, valueId?: string, placeholder?: string) => {
            const enabled = !!dynamicFormData[toggleId];
            const rawValue = valueId ? dynamicFormData[valueId] || '' : '';
            return (
                <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                    <div className="pt-1 text-sm font-bold text-[#1F2129]">{label}</div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Switch
                                active={enabled}
                                onClick={() => setDynamicFormData(prev => ({
                                    ...prev,
                                    [toggleId]: !enabled,
                                    ...(valueId && enabled ? { [valueId]: '' } : {}),
                                }))}
                            />
                            <span className="text-sm text-gray-400">{enabled ? '已开启' : '未开启'}</span>
                        </div>
                        {enabled && valueId && (
                            <div className="max-w-[280px]">
                                <input
                                    type={valueId === 's_time_sale_rule' ? 'text' : 'number'}
                                    className={`q-form-input ${valueId !== 's_time_sale_rule' ? 'pl-4' : ''}`}
                                    placeholder={placeholder}
                                    value={rawValue}
                                    onChange={e => setDynamicFormData(prev => ({ ...prev, [valueId]: e.target.value }))}
                                />
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        const toggleSaleSetting = (key: string) => {
            setDynamicFormData(prev => {
                const current = prev.s_sale_settings || {};
                return {
                    ...prev,
                    s_sale_settings: {
                        ...current,
                        [key]: !current[key],
                    }
                };
            });
        };

        return (
            <div className="space-y-6">
                {(isFieldEnabled('s_min_purchase_toggle') || isFieldEnabled('s_max_purchase_toggle') || isFieldEnabled('s_time_sale_toggle')) && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
                        {isFieldEnabled('s_min_purchase_toggle') && renderSwitchRow('起购数量', 's_min_purchase_toggle', 's_min_purchase_value', '请输入起购数量')}
                        {isFieldEnabled('s_max_purchase_toggle') && renderSwitchRow('限购数量', 's_max_purchase_toggle', 's_max_purchase_value', '请输入限购数量')}
                        {isFieldEnabled('s_time_sale_toggle') && renderSwitchRow('分时段销售', 's_time_sale_toggle', 's_time_sale_rule', '例如：工作日 10:00-14:00 / 17:00-21:00')}
                    </div>
                )}

                {(isFieldEnabled('s_sale_mode') || isFieldEnabled('s_sale_settings')) && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
                        {isFieldEnabled('s_sale_mode') && (
                            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                                <div className="pt-1 text-sm font-bold text-[#1F2129]">售卖方式</div>
                                <div>
                                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                                        {['正常售卖', '仅在套餐售卖'].map(option => {
                                            const active = saleMode === option;
                                            return (
                                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        className="hidden"
                                                        checked={active}
                                                        onChange={() => setDynamicFormData(prev => ({ ...prev, s_sale_mode: option }))}
                                                    />
                                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                                        {active && <span className="w-2 h-2 rounded-full bg-[#00C06B]" />}
                                                    </span>
                                                    <span className={`text-sm ${active ? 'text-[#00A35B] font-bold' : 'text-gray-600'}`}>{option}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">设置“仅在套餐中售卖”则顾客在门店中看不到此商品。</div>
                                </div>
                            </div>
                        )}

                        {isFieldEnabled('s_sale_settings') && (
                            <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                                <div className="pt-1 text-sm font-bold text-[#1F2129]">售卖设置</div>
                                <div className="rounded-2xl bg-[#FAFAFA] p-5 space-y-5">
                                    {[
                                        {
                                            key: '单点不送',
                                            desc: '开启后，外卖单点该商品无法下单，需配合其他商品才可下单，常用于饮料等底价小件商品'
                                        },
                                        {
                                            key: '关联档口',
                                            desc: '可用于关联商品档口，方便按档口出品和管理'
                                        },
                                        {
                                            key: '参与会员折扣',
                                            desc: '开启后，指定商品在下单时可参与会员卡折扣优惠'
                                        }
                                    ].map(item => {
                                        const active = !!saleSettings[item.key];
                                        return (
                                            <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                    checked={active}
                                                    onChange={() => toggleSaleSetting(item.key)}
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-[#1F2129]">
                                                        <span>{item.key}</span>
                                                        {item.key === '关联档口' && <ChevronRight size={14} className="text-gray-400" />}
                                                    </div>
                                                    <div className="mt-1 text-xs leading-5 text-gray-400">{item.desc}</div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {(isFieldEnabled('s_takeout_rule') || isFieldEnabled('s_tax_rate')) && (
                    <>
                        {isFieldEnabled('s_takeout_rule') && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                                <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                                    <div className="pt-1 text-sm font-bold text-[#1F2129]">外带设置</div>
                                    <div className="rounded-2xl bg-[#FAFAFA] p-5">
                                        <div className="text-sm font-bold text-[#1F2129]">外带显示规则</div>
                                        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                                            {['正常售卖', '外带时隐藏', '仅外带显示'].map(option => {
                                                const active = takeoutRule === option;
                                                return (
                                                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            className="hidden"
                                                            checked={active}
                                                            onChange={() => setDynamicFormData(prev => ({ ...prev, s_takeout_rule: option }))}
                                                        />
                                                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'border-[#00C06B]' : 'border-gray-300'}`}>
                                                            {active && <span className="w-2 h-2 rounded-full bg-[#00C06B]" />}
                                                        </span>
                                                        <span className={`text-sm ${active ? 'text-[#00A35B] font-bold' : 'text-gray-600'}`}>{option}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isFieldEnabled('s_tax_rate') && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                    <div className="text-sm font-bold text-[#1F2129]">税率</div>
                                    <div className="max-w-[260px]">
                                        <select
                                            className="q-form-select"
                                            value={taxRate}
                                            onChange={e => setDynamicFormData(prev => ({ ...prev, s_tax_rate: e.target.value }))}
                                        >
                                            <option value="">选择税率</option>
                                            <option value="0%">0%</option>
                                            <option value="1%">1%</option>
                                            <option value="3%">3%</option>
                                            <option value="6%">6%</option>
                                            <option value="9%">9%</option>
                                            <option value="13%">13%</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderPreviewPanel = () => {
        const previewTitle = PREVIEW_FIELD_TITLES[activePreviewField];
        const productName = dynamicFormData.p_name || '商品名称';
        const listDesc = dynamicFormData.p_list_desc || '用于补充口味、卖点或份量信息';
        const imageUploaded = !!dynamicFormData.p_img;
        const visibleSpecRows = specDisplayMode === 'single' ? specConfigRows.slice(0, 1) : specConfigRows;
        const activeSpecLabels = visibleSpecRows.map(item => item.s_spec_name).filter(Boolean);
        const activeMethodLabels = methodConfigRows.map(item => item.m_method_name).filter(Boolean);
        const addonsConfigured = !!dynamicFormData.a_addons;
        const previewSpecChips = activeSpecLabels.length > 0
            ? activeSpecLabels.slice(0, 3)
            : (specDisplayMode === 'single' ? ['标准规格'] : ['中杯 480ml', '大杯 600ml +4']);
        const primarySpecPrice = visibleSpecRows[0]?.s_spec_price || '26';
        const primarySpecLabel = previewSpecChips[0] || '中杯 480ml';

        return (
            <div className="w-full min-w-0 bg-white border-r border-[#E8E8E8] p-4 overflow-y-auto">
                <div className="rounded-2xl overflow-hidden border border-[#12B76A]/20 shadow-sm">
                    <div className="bg-[#12B76A] px-4 py-3 text-white">
                        <div className="text-xl font-black">效果示例</div>
                    </div>
                    <div className="p-4 bg-[#F8FAFC]">
                        <div className="text-sm font-bold text-[#1F2129]">{previewTitle.title}</div>
                        <div className="text-xs text-gray-500 mt-2 leading-5">{previewTitle.desc}</div>
                        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                            {['p_img', 'p_name', 'p_list_desc'].includes(activePreviewField) && (
                                <>
                                    <div className="relative rounded-xl overflow-hidden bg-[#F3F4F6] h-[140px] flex items-center justify-center">
                                        {imageUploaded ? (
                                            <div className="w-full h-full bg-gradient-to-br from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B] flex items-center justify-center text-white font-black text-lg">
                                                商品主图
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-400">未上传主图</div>
                                        )}
                                        {activePreviewField === 'p_img' && <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-[#12B76A] text-white text-xs font-black">商品主图</div>}
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className={`leading-5 ${activePreviewField === 'p_name' ? 'font-black text-[#12B76A]' : 'font-black text-[#1F2129]'}`}>{productName}</div>
                                            <div className="text-[#12B76A] text-xs font-black">¥9.9起</div>
                                        </div>
                                        <div className={`mt-1 text-xs leading-5 ${activePreviewField === 'p_list_desc' ? 'text-[#12B76A] font-bold' : 'text-gray-500'}`}>{listDesc}</div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {activeSpecLabels.slice(0, 3).map(label => (
                                                <span key={label} className="px-2.5 py-1 rounded-full text-xs font-bold border border-gray-200 text-gray-500">{label}</span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                            {['m_methods', 'a_addons'].includes(activePreviewField) && (
                                <div className="rounded-[18px] bg-[#1F2129] p-3 text-white">
                                    <div className="rounded-2xl bg-[#2A2D36] p-3">
                                        <div className="font-black">{productName}</div>
                                        <div className="mt-3 rounded-2xl bg-white p-3 text-[#1F2129]">
                                            <div className="text-xs font-bold text-gray-500 mb-2">{activePreviewField === 'm_methods' ? '做法' : '加料'}</div>
                                            <div className="flex flex-wrap gap-2">
                                                {(activePreviewField === 'm_methods' ? activeMethodLabels : addonsConfigured ? ['奶油顶', '巧克力牌'] : []).slice(0, 4).map((label, index) => (
                                                    <span key={label} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${index === 0 ? 'bg-[#00C06B] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!['p_img', 'p_name', 'p_list_desc', 'm_methods', 'a_addons'].includes(activePreviewField) && (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] h-[260px] flex flex-col items-center justify-center text-center px-6">
                                    <div className="text-sm font-bold text-gray-400">无填写效果示例</div>
                                    <div className="text-xs text-gray-400 mt-2 leading-5">当前字段暂无可视化示例，点击做法、加料、商品主图或列表页简述可查看对应展示效果。</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSpecConfigTable = () => (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div>
                    <div className="text-sm font-bold text-[#1F2129]">规格设置</div>
                    <div className="text-xs text-gray-400 mt-1">按规格设置价格、库存、包装费和图片。</div>
                </div>
            </div>
            <div className="px-5 py-4 border-b border-gray-100 bg-[#FAFAFA] flex items-center justify-between gap-4">
                <div className="flex items-center gap-8">
                    <div className="text-sm text-[#1F2129] shrink-0">规格</div>
                    <div className="flex items-center gap-8">
                        {[
                            { key: 'single' as const, label: '统一规格' },
                            { key: 'multi' as const, label: '多规格' },
                        ].map(option => (
                            <label key={option.key} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    checked={specDisplayMode === option.key}
                                    onChange={() => {
                                        setSpecDisplayMode(option.key);
                                        setActivePreviewField('s_specs');
                                    }}
                                    className="text-[#00C06B] focus:ring-[#00C06B]"
                                />
                                <span className={specDisplayMode === option.key ? 'font-bold text-[#00A35B]' : 'text-gray-500'}>{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="relative">
            <div className="overflow-x-auto">
                        <table className="min-w-[3440px] w-full border-collapse">
                    <thead className="bg-[#F7F8FA]">
                        <tr className="text-left text-xs font-bold text-gray-500">
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[140px]">规格名称</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[190px]">基础价格</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[190px]">预估成本</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[190px]">市场价</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[220px]">商品条码</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[220px]">商品标识</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[220px]">商品规格码</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[220px]">商品编码</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[240px]">商品份量</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[260px]">库存设置</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[260px]">初始库存</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[180px]">库存预警</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[180px]">售卖状态</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[320px]">适用渠道</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[190px]">到店外带包装费</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[220px]">到店外带包装标识</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[190px]">外卖配送包装费</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[220px]">外卖配送包装标识</th>
                            <th className="px-4 py-3 border-b border-gray-200 min-w-[130px]">规格图片</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(specDisplayMode === 'single' ? specConfigRows.slice(0, 1) : specConfigRows).map((row, index) => (
                            <tr key={row.id}>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <input onFocus={() => setActivePreviewField('s_specs')} value={specDisplayMode === 'single' ? '标准规格' : row.s_spec_name} onChange={e => updateSpecConfigRow(row.id, 's_spec_name', e.target.value)} className="q-form-input h-10" placeholder="规格名称" disabled={specDisplayMode === 'single' && index === 0} />
                                </td>
                                {(['s_spec_price', 's_spec_cost', 's_spec_market'] as const).map(key => (
                                    <td key={key} className="px-4 py-4 border-b border-gray-100">
                                        <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white h-12">
                                            <button type="button" className="w-12 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, key, String(Math.max(0, Number(row[key] || 0) - 1)))}>-</button>
                                            <input onFocus={() => setActivePreviewField('s_specs')} type="number" value={row[key]} onChange={e => updateSpecConfigRow(row.id, key, e.target.value)} className="flex-1 h-full text-center outline-none text-[#1F2129] font-bold border-x border-gray-100" />
                                            <button type="button" className="w-12 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, key, String(Number(row[key] || 0) + 1))}>+</button>
                                            <div className="w-12 h-full flex items-center justify-center text-gray-500 border-l border-gray-100">元</div>
                                        </div>
                                    </td>
                                ))}
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="relative">
                                        <input maxLength={50} onFocus={() => setActivePreviewField('s_specs')} value={row.s_spec_barcode} onChange={e => updateSpecConfigRow(row.id, 's_spec_barcode', e.target.value)} className="q-form-input h-12 pr-12" placeholder="0/50" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{row.s_spec_barcode.length}/50</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="relative">
                                        <input maxLength={50} onFocus={() => setActivePreviewField('s_specs')} value={row.s_spec_mark} onChange={e => updateSpecConfigRow(row.id, 's_spec_mark', e.target.value)} className="q-form-input h-12 pr-12" placeholder="0/50" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{row.s_spec_mark.length}/50</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="relative">
                                        <input maxLength={50} onFocus={() => setActivePreviewField('s_specs')} value={row.s_spec_sku_code} onChange={e => updateSpecConfigRow(row.id, 's_spec_sku_code', e.target.value)} className="q-form-input h-12 pr-12" placeholder="0/50" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{row.s_spec_sku_code.length}/50</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="relative">
                                        <input maxLength={50} onFocus={() => setActivePreviewField('s_specs')} value={row.s_spec_code} onChange={e => updateSpecConfigRow(row.id, 's_spec_code', e.target.value)} className="q-form-input h-12 pr-12" placeholder="0/50" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{row.s_spec_code.length}/50</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white h-12 min-w-[140px]">
                                            <button type="button" className="w-10 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, 's_spec_amount', Math.max(0, Number(row.s_spec_amount || 0) - 0.5).toFixed(2))}>-</button>
                                            <input onFocus={() => setActivePreviewField('s_specs')} type="number" step="0.01" value={row.s_spec_amount} onChange={e => updateSpecConfigRow(row.id, 's_spec_amount', e.target.value)} className="flex-1 h-full text-center outline-none font-bold border-x border-gray-100" />
                                            <button type="button" className="w-10 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, 's_spec_amount', (Number(row.s_spec_amount || 0) + 0.5).toFixed(2))}>+</button>
                                        </div>
                                        <select value={row.s_spec_amount_unit} onChange={e => updateSpecConfigRow(row.id, 's_spec_amount_unit', e.target.value)} className="q-form-select h-12 min-w-[110px]">
                                            {['克', '千克', '份', '个'].map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input type="radio" checked={row.s_spec_inventory_mode === 'unlimited'} onChange={() => updateSpecConfigRow(row.id, 's_spec_inventory_mode', 'unlimited')} className="text-[#00C06B] focus:ring-[#00C06B]" />
                                            不限库存
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input type="radio" checked={row.s_spec_inventory_mode === 'custom'} onChange={() => updateSpecConfigRow(row.id, 's_spec_inventory_mode', 'custom')} className="text-[#00C06B] focus:ring-[#00C06B]" />
                                            自定义库存
                                        </label>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white h-12 min-w-[130px]">
                                            <button type="button" className="w-10 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, 's_spec_initial_stock', String(Math.max(0, Number(row.s_spec_initial_stock || 0) - 1)))}>-</button>
                                            <input onFocus={() => setActivePreviewField('s_specs')} type="number" value={row.s_spec_initial_stock} onChange={e => updateSpecConfigRow(row.id, 's_spec_initial_stock', e.target.value)} className="flex-1 h-full text-center outline-none font-bold border-x border-gray-100" />
                                            <button type="button" className="w-10 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, 's_spec_initial_stock', String(Number(row.s_spec_initial_stock || 0) + 1))}>+</button>
                                        </div>
                                        <span className="text-sm text-gray-400">最大:</span>
                                        <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white h-12 min-w-[130px]">
                                            <button type="button" className="w-10 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, 's_spec_max_stock', String(Math.max(0, Number(row.s_spec_max_stock || 0) - 1)))}>-</button>
                                            <input onFocus={() => setActivePreviewField('s_specs')} type="number" value={row.s_spec_max_stock} onChange={e => updateSpecConfigRow(row.id, 's_spec_max_stock', e.target.value)} className="flex-1 h-full text-center outline-none font-bold border-x border-gray-100" />
                                            <button type="button" className="w-10 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, 's_spec_max_stock', String(Number(row.s_spec_max_stock || 0) + 1))}>+</button>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white h-12 min-w-[120px]">
                                        <button type="button" className="w-10 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, 's_spec_warning_stock', String(Math.max(0, Number(row.s_spec_warning_stock || 0) - 1)))}>-</button>
                                        <input onFocus={() => setActivePreviewField('s_specs')} type="number" value={row.s_spec_warning_stock} onChange={e => updateSpecConfigRow(row.id, 's_spec_warning_stock', e.target.value)} className="flex-1 h-full text-center outline-none font-bold border-x border-gray-100" />
                                        <button type="button" className="w-10 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, 's_spec_warning_stock', String(Number(row.s_spec_warning_stock || 0) + 1))}>+</button>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => updateSpecConfigRow(row.id, 's_spec_sale_status', 'on')}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border ${row.s_spec_sale_status === 'on' ? 'border-[#00C06B] bg-[#F0FDF4] text-[#00A35B]' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            上架
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateSpecConfigRow(row.id, 's_spec_sale_status', 'off')}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border ${row.s_spec_sale_status === 'off' ? 'border-[#111827] bg-[#F3F4F6] text-[#111827]' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            下架
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <div className="flex flex-wrap gap-2">
                                        {CHANNEL_OPTIONS.map(channel => {
                                            const active = row.s_spec_channels.includes(channel.key);
                                            return (
                                                <button
                                                    key={channel.key}
                                                    type="button"
                                                    onClick={() => updateSpecConfigRow(
                                                        row.id,
                                                        's_spec_channels',
                                                        active
                                                            ? row.s_spec_channels.filter(item => item !== channel.key)
                                                            : [...row.s_spec_channels, channel.key]
                                                    )}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${active ? 'border-[#00C06B] bg-[#F0FDF4] text-[#00A35B]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                >
                                                    {channel.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </td>
                                {(['s_spec_store_pack_fee', 's_spec_take_pack_fee'] as const).map(key => (
                                    <td key={key} className="px-4 py-4 border-b border-gray-100">
                                        <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white h-12">
                                            <button type="button" className="w-12 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, key, String(Math.max(0, Number(row[key] || 0) - 1)))}>-</button>
                                            <input onFocus={() => setActivePreviewField('s_specs')} type="number" value={row[key]} onChange={e => updateSpecConfigRow(row.id, key, e.target.value)} className="flex-1 h-full text-center outline-none text-[#1F2129] font-bold border-x border-gray-100" />
                                            <button type="button" className="w-12 h-full text-gray-400 hover:bg-gray-50" onClick={() => updateSpecConfigRow(row.id, key, String(Number(row[key] || 0) + 1))}>+</button>
                                            <div className="w-12 h-full flex items-center justify-center text-gray-500 border-l border-gray-100">元</div>
                                        </div>
                                    </td>
                                ))}
                                {(['s_spec_store_pack_mark', 's_spec_take_pack_mark'] as const).map(key => (
                                    <td key={key} className="px-4 py-4 border-b border-gray-100">
                                        <div className="relative">
                                            <input maxLength={128} onFocus={() => setActivePreviewField('s_specs')} value={row[key]} onChange={e => updateSpecConfigRow(row.id, key, e.target.value)} className="q-form-input h-12 pr-14" placeholder="0/128" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{row[key].length}/128</span>
                                        </div>
                                    </td>
                                ))}
                                <td className="px-4 py-4 border-b border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActivePreviewField('s_specs');
                                            updateSpecConfigRow(row.id, 's_spec_img', row.s_spec_img ? '' : '已上传');
                                        }}
                                        className={`w-[84px] h-[68px] rounded-xl border text-xs font-bold ${row.s_spec_img ? 'border-[#00C06B] bg-[#F0FDF4] text-[#00A35B]' : 'border-dashed border-gray-200 text-gray-400 hover:border-[#00C06B]'}`}
                                    >
                                        {row.s_spec_img ? '已上传' : '上传图片'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/90 to-transparent" />
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-[#FAFAFA]">
                <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-4 py-3 text-xs font-bold text-[#166534]">
                    可 Shift + 鼠标滚轮左右滑动查看更多规格信息
                </div>
            </div>
        </div>
    );

    const renderMethodAddonPanel = () => (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {isFieldEnabled('m_methods') && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold text-[#1F2129]">做法配置</div>
                            <div className="text-xs text-gray-400 mt-1">可配置做法名称、加价和编码，保存后展示在商品详情页。</div>
                        </div>
                        <button type="button" onClick={() => setActivePreviewField('m_methods')} className="text-xs font-bold text-[#00A35B]">查看效果</button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {methodConfigRows.map(row => (
                            <div key={row.id} className="grid grid-cols-3 gap-3">
                                <input onFocus={() => setActivePreviewField('m_methods')} className="q-form-input" value={row.m_method_name} onChange={e => updateMethodConfigRow(row.id, 'm_method_name', e.target.value)} placeholder="做法名称" />
                                <input onFocus={() => setActivePreviewField('m_methods')} type="number" className="q-form-input" value={row.m_method_markup} onChange={e => updateMethodConfigRow(row.id, 'm_method_markup', e.target.value)} placeholder="做法加价" />
                                <input onFocus={() => setActivePreviewField('m_methods')} className="q-form-input" value={row.m_method_code} onChange={e => updateMethodConfigRow(row.id, 'm_method_code', e.target.value)} placeholder="做法编码" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {isFieldEnabled('a_addons') && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold text-[#1F2129]">加料配置</div>
                            <div className="text-xs text-gray-400 mt-1">加料会作为附加选项展示，支持单独配置与复用已有加料库。</div>
                        </div>
                        <button type="button" onClick={() => setActivePreviewField('a_addons')} className="text-xs font-bold text-[#00A35B]">查看效果</button>
                    </div>
                    <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
                        <button
                            type="button"
                            onClick={() => {
                                setActivePreviewField('a_addons');
                                setDynamicFormData(prev => ({ ...prev, a_addons: prev.a_addons ? '' : '奶油顶, 巧克力牌' }));
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-500 hover:border-[#00C06B] hover:text-[#00C06B] transition-colors"
                        >
                            {dynamicFormData.a_addons ? '已选择 2 项加料，点击可清空' : '点击选择加料'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const [selectedTemplateId, setSelectedTemplateId] = useState('template-1');

    const renderTaskPage = (task: 'sync' | 'template' | 'detail') => {
        const currentSpecRows = specDisplayMode === 'single' ? specConfigRows.slice(0, 1) : specConfigRows;
        const currentCreatedProduct = {
            name: dynamicFormData.p_name || '未命名商品',
            typeLabel: type === 'combo' ? '套餐商品' : '标准商品',
            frontCategory: dynamicFormData.p_front_cat || '未设置前台分类',
            stockLabel: currentSpecRows[0]?.s_spec_inventory_mode === 'unlimited'
                ? '不限库存'
                : `${currentSpecRows.reduce((sum, row) => sum + Number(row.s_spec_initial_stock || 0), 0)} 件`,
            statusLabel: currentSpecRows.some(row => row.s_spec_sale_status === 'on') ? '上架中' : '已下架',
            markLabel: currentSpecRows[0]?.s_spec_mark || '本次创建',
            barcode: currentSpecRows[0]?.s_spec_barcode || '--',
        };
        const templateOptions = [
            { id: 'template-1', name: '春夏饮品模板', desc: '适用于门店日常新品和活动饮品下发', channels: '小程序堂食 / 外卖 / POS', type: '品牌模板' },
            { id: 'template-2', name: '门店标准商品模板', desc: '适用于常规商品统一下发和门店复用', channels: '小程序堂食 / POS', type: '通用模板' },
        ];
        const config = {
            sync: {
                title: '创建同步任务',
                subtitle: '待下发商品',
                desc: successMode === 'edit'
                    ? '当前编辑商品已自动加入本次同步任务，可继续补充其他商品后一并下发。'
                    : '当前创建的商品已自动加入本次同步任务，可继续补充其他商品后一并下发。',
                steps: ['选择商品', '选择门店&设置', '完成'],
                actionLabel: '已加入同步任务',
            },
            template: {
                title: successMode === 'edit' ? '更新模板并下发' : '加入模板并下发',
                subtitle: successMode === 'edit' ? '选择待更新模板' : '选择加入模板',
                desc: successMode === 'edit'
                    ? '先选择需要更新的模板，再将当前商品的修改内容同步到模板并继续下发到门店。'
                    : '先选择要加入的模板，再将当前商品加入模板并继续下发到门店。',
                steps: ['选择模板', '确认更新内容', '完成'],
                actionLabel: '作为更新内容',
            },
            detail: {
                title: '商品详情',
                subtitle: '查看商品信息',
                desc: '查看刚创建商品的详情与后续操作。',
                steps: ['商品信息', '渠道状态', '后续操作'],
                actionLabel: '查看详情',
            },
        }[task];

        if (task === 'sync') {
            return (
                <div className="min-w-0 space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-6 min-w-0">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            {config.steps.map((step, index) => (
                                <div key={step} className="flex items-center mb-6 last:mb-0">
                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 ${index === 0 ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300 bg-white'}`} />
                                    <div className={`text-sm font-bold ${index === 0 ? 'text-[#1F2129]' : 'text-gray-400'}`}>{step}</div>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm min-w-0 overflow-hidden">
                            <div className="flex flex-col gap-4 border-b border-gray-100 p-6 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <div className="text-base font-black text-[#1F2129]">待下发商品</div>
                                    <div className="mt-1 text-xs text-gray-400">{successMode === 'edit' ? '当前编辑商品已自动加入，可继续添加其他商品一起下发。' : '当前创建商品已自动加入，可继续添加其他商品一起下发。'}</div>
                                </div>
                                <button type="button" className="inline-flex items-center rounded-xl border border-[#00C06B] bg-white px-4 py-2 text-sm font-bold text-[#00A35B] hover:bg-[#F8FFFB] transition-colors">
                                    <Plus size={16} className="mr-2" />
                                    添加商品
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-[980px] w-full border-collapse">
                                        <thead className="bg-[#F7F8FA]">
                                            <tr className="text-left text-xs font-bold text-gray-500">
                                                <th className="px-4 py-3 border-b border-gray-200">商品名称</th>
                                                <th className="px-4 py-3 border-b border-gray-200">商品类型</th>
                                                <th className="px-4 py-3 border-b border-gray-200">前台分类</th>
                                                <th className="px-4 py-3 border-b border-gray-200">商品库存</th>
                                                <th className="px-4 py-3 border-b border-gray-200">商品状态</th>
                                                <th className="px-4 py-3 border-b border-gray-200">商品标识</th>
                                                <th className="px-4 py-3 border-b border-gray-200">商品条码</th>
                                                <th className="px-4 py-3 border-b border-gray-200">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-[#FAFAFA] transition-colors">
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm font-bold text-[#1F2129]">{currentCreatedProduct.name}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{currentCreatedProduct.typeLabel}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{currentCreatedProduct.frontCategory}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{currentCreatedProduct.stockLabel}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{currentCreatedProduct.statusLabel}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{currentCreatedProduct.markLabel}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{currentCreatedProduct.barcode}</td>
                                                <td className="px-4 py-4 border-b border-gray-100">
                                                    <span className="inline-flex items-center rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-bold text-[#166534]">
                                                        已加入同步
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setPageView('success')} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">取消</button>
                                    <button type="button" className="px-5 py-2 rounded-xl bg-[#00C06B] text-white text-sm font-bold">下一步</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (task === 'template') {
            return (
                <div className="min-w-0 space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-6 min-w-0">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            {config.steps.map((step, index) => (
                                <div key={step} className="flex items-center mb-6 last:mb-0">
                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 ${index === 0 ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300 bg-white'}`} />
                                    <div className={`text-sm font-bold ${index === 0 ? 'text-[#1F2129]' : 'text-gray-400'}`}>{step}</div>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm min-w-0 overflow-hidden">
                            <div className="border-b border-gray-100 p-6">
                                <div className="text-base font-black text-[#1F2129]">选择加入模板</div>
                                <div className="mt-1 text-xs text-gray-400">{successMode === 'edit' ? '先选择要更新的模板，再将当前商品的修改内容同步到模板并继续后续下发。' : '先选择模板，再将当前创建商品加入模板并继续后续下发。'}</div>
                                <div className="mt-4 rounded-2xl border border-[#D1FAE5] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
                                    {successMode === 'edit' ? '当前编辑商品：' : '当前创建商品：'}<span className="font-bold">{currentCreatedProduct.name}</span>，将作为本次模板更新内容。
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button type="button" className="rounded-xl bg-[#00C06B] px-4 py-2 text-sm font-bold text-white hover:bg-[#00A35B] transition-colors">{successMode === 'edit' ? '选择待更新模板' : '选择模板'}</button>
                                    <button type="button" className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">新建模板</button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-[900px] w-full border-collapse">
                                        <thead className="bg-[#F7F8FA]">
                                            <tr className="text-left text-xs font-bold text-gray-500">
                                                <th className="w-14 px-4 py-3 border-b border-gray-200">选择</th>
                                                <th className="px-4 py-3 border-b border-gray-200">模板名称</th>
                                                <th className="px-4 py-3 border-b border-gray-200">模板描述</th>
                                                <th className="px-4 py-3 border-b border-gray-200">售卖渠道</th>
                                                <th className="px-4 py-3 border-b border-gray-200">模板类型</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {templateOptions.map(template => {
                                                const checked = selectedTemplateId === template.id;
                                                return (
                                                    <tr key={template.id} className={`transition-colors ${checked ? 'bg-[#F8FFFB]' : 'hover:bg-[#FAFAFA]'}`}>
                                                        <td className="px-4 py-4 border-b border-gray-100">
                                                            <input
                                                                type="radio"
                                                                name="template"
                                                                className="h-4 w-4 border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                                checked={checked}
                                                                onChange={() => setSelectedTemplateId(template.id)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4 border-b border-gray-100 text-sm font-bold text-[#1F2129]">{template.name}</td>
                                                        <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{template.desc}</td>
                                                        <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{template.channels}</td>
                                                        <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{template.type}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setPageView('success')} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">取消</button>
                                    <button type="button" className="px-5 py-2 rounded-xl bg-[#00C06B] text-white text-sm font-bold">下一步</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-w-0 space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="text-lg font-black text-[#1F2129]">{config.title}</div>
                    <div className="text-sm text-gray-400 mt-2">{config.desc}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-500">
                    当前创建商品：<span className="font-bold text-[#1F2129]">{currentCreatedProduct.name}</span>
                </div>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setPageView('success')} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">返回</button>
                    <button type="button" className="px-5 py-2 rounded-xl bg-[#00C06B] text-white text-sm font-bold">继续处理</button>
                </div>
            </div>
        );
    };

    const renderPrepRuleEditor = (
        title: string,
        description: string,
        rule: PrepRule,
        onChange: (key: keyof PrepRule, value: string | boolean) => void,
        onStep: (delta: number) => void
    ) => (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4 shadow-sm">
            <div>
                <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-[#1F2129]">{title}</div>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-500">{formatPrepRuleSummary(rule)}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1 leading-5">{description}</div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
                <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <button
                        type="button"
                        onClick={() => onStep(-1)}
                        className="w-11 h-11 text-lg text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        -
                    </button>
                    <input
                        type="number"
                        min="0"
                        value={rule.duration}
                        onChange={e => onChange('duration', e.target.value)}
                        className="flex-1 h-11 text-center text-sm font-bold text-[#1F2129] outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => onStep(1)}
                        className="w-11 h-11 text-lg text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        +
                    </button>
                </div>
                <select
                    value={rule.unit}
                    onChange={e => onChange('unit', e.target.value)}
                    className="q-form-select h-11"
                >
                    {PREP_UNIT_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-wrap gap-3">
                {[
                    { value: 'same_day' as PrepWindow, label: '当天备货', desc: '下单后按当日节奏制作' },
                    { value: 'advance' as PrepWindow, label: '提前备货', desc: '可提前开始制作或预处理' },
                ].map(option => {
                    const active = rule.window === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange('window', option.value)}
                            className={`flex-1 min-w-[180px] rounded-xl border px-4 py-3 text-left transition-all ${active ? 'border-[#00C06B] bg-[#F0FDF4]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                        >
                            <div className={`text-sm font-bold ${active ? 'text-[#00C06B]' : 'text-[#1F2129]'}`}>{option.label}</div>
                            <div className="text-xs text-gray-400 mt-1">{option.desc}</div>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-xl bg-[#FAFAFA] border border-gray-200 px-4 py-3">
                {rule.window === 'advance' ? (
                    <>
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-sm font-bold text-[#1F2129]">顺延设置</div>
                                <div className="text-xs text-gray-400 mt-1">可设置几点后的订单顺延至次日开始制作</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={rule.deferNextDay}
                                onChange={e => onChange('deferNextDay', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                            />
                        </label>
                        {rule.deferNextDay && (
                            <div className="mt-3 flex items-center gap-3">
                                <input
                                    type="time"
                                    value={rule.deferAfterTime}
                                    onChange={e => onChange('deferAfterTime', e.target.value)}
                                    className="q-form-input max-w-[180px]"
                                />
                                <span className="text-sm text-gray-500">后下单顺延至次日开始制作</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-xs text-gray-400">当天备货按下单后立即进入制作节奏，无需额外顺延设置。</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-[#FAFAFA] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 px-6 lg:px-8 bg-white border-b border-[#E8E8E8] flex min-w-0 justify-between items-center shrink-0 shadow-sm z-20">
                <div className="flex min-w-0 items-center">
                    {pageView === 'form' && (
                        <button onClick={onClose} className="mr-4 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={20} className="text-gray-600"/></button>
                    )}
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-black text-[#1F2129]">
                            {pageView === 'form' && (hasSavedProduct ? '编辑商品资料' : '填写商品资料')}
                            {pageView === 'success' && (successMode === 'edit' ? '商品编辑成功' : '商品创建成功')}
                            {pageView === 'sync' && '创建同步任务'}
                            {pageView === 'template' && (successMode === 'edit' ? '更新模板并下发' : '加入模板并下发')}
                            {pageView === 'detail' && '商品详情'}
                        </h3>
                        <p className="truncate text-xs text-gray-400 mt-0.5">
                            {pageView === 'form' ? `当前类目: ${currentCategory.name}` : `已从${successMode === 'edit' ? '编辑商品页' : '创建商品页'}进入后续处理流程`}
                        </p>
                    </div>
                </div>
                <div className="ml-4 flex shrink-0 items-center space-x-3">
                    {pageView === 'form' ? (
                        <>
                            <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm">
                                取消
                            </button>
                            <button onClick={handleSaveDraft} className="px-5 py-2 border border-gray-200 bg-white text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                保存为草稿
                            </button>
                            <button onClick={handleSave} className="px-5 py-2 bg-[#1F2129] text-white font-bold rounded-lg shadow-lg hover:bg-black transition-all active:scale-95 text-sm flex items-center">
                                <Check size={16} className="mr-2"/> {hasSavedProduct ? '保存修改' : '保存'}
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden min-w-0">
                {pageView === 'form' && (
                    <div className="w-[300px] bg-white border-r border-[#E8E8E8] shrink-0 flex flex-col">
                        {renderPreviewPanel()}
                    </div>
                )}

                {/* Form Content */}
                <div ref={formContentRef} className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-4 pb-8 scroll-smooth no-scrollbar lg:px-6 xl:px-8">
                    <div className="w-full min-w-0 max-w-[1180px] mx-auto pt-8 pb-24 space-y-6">
                        {pageView === 'success' ? (
                            <div className="space-y-5">
                                <div className="rounded-[28px] border border-[#D7F0E1] bg-white p-8 shadow-sm">
                                    <div className="w-full">
                                        <div className="inline-flex items-center rounded-full border border-[#C9EFD8] bg-[#F2FCF6] px-3 py-1.5 text-sm font-bold text-[#00A35B]">
                                            <CheckCircle2 size={16} className="mr-2" />
                                            {successMode === 'edit' ? '编辑成功' : '创建成功'}
                                        </div>
                                        <div className="mt-4 text-[28px] leading-none font-black text-[#1F2129]">{successMode === 'edit' ? '商品已更新完成' : '商品已创建完成'}</div>
                                        <div className="mt-3 text-sm text-gray-500">
                                            {successMode === 'edit'
                                                ? '商品修改不会自动同步到门店，需要手动下发更新后才会生效。请选择处理方式。'
                                                : '商品不会自动更新至门店，需要手动下发后才会生效。请选择下发方式。'}
                                        </div>
                                        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSuccessAction('sync')}
                                                className="rounded-[24px] border border-[#BBF7D0] bg-[#F7FFF9] p-5 text-left hover:border-[#00C06B] hover:bg-[#F0FDF4] transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="inline-flex items-center rounded-full bg-[#00C06B] px-3 py-1 text-xs font-black text-white">推荐</div>
                                                    <Send size={18} className="text-[#00A35B]" />
                                                </div>
                                                <div className="mt-4 text-lg font-black text-[#1F2129]">{successMode === 'edit' ? '下发更新到门店' : '直接下发到门店'}</div>
                                                <div className="mt-1.5 text-sm text-gray-500">{successMode === 'edit' ? '适合已修改完成，需要尽快同步门店售卖信息的场景。' : '适合商品信息已确认，需要尽快在门店生效。'}</div>
                                                <div className="mt-4 inline-flex items-center rounded-xl bg-[#00C06B] px-4 py-2 text-sm font-bold text-white">
                                                    {successMode === 'edit' ? '立即下发更新' : '立即下发到门店'}
                                                    <ArrowRight size={16} className="ml-2" />
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSuccessAction('template')}
                                                className="rounded-[24px] border border-gray-200 bg-[#FAFAFA] p-5 text-left hover:border-[#00C06B] hover:bg-white transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-black text-gray-500 border border-gray-200">备选方式</div>
                                                    <ClipboardList size={18} className="text-[#00A35B]" />
                                                </div>
                                                <div className="mt-4 text-lg font-black text-[#1F2129]">{successMode === 'edit' ? '更新模板并下发门店' : '加入模板后下发'}</div>
                                                <div className="mt-1.5 text-sm text-gray-500">{successMode === 'edit' ? '适合当前商品已在模板中复用，需要先更新模板再统一下发门店。' : '适合后续还会复用，或需要统一模板后再下发门店。'}</div>
                                                <div className="mt-4 inline-flex items-center text-sm font-bold text-[#00A35B]">
                                                    {successMode === 'edit' ? '更新模板并继续' : '加入模板并继续'}
                                                    <ArrowRight size={16} className="ml-1" />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className={`grid grid-cols-1 gap-3 ${successMode === 'edit' ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                                    {successMode === 'create' && (
                                        <button type="button" onClick={handleContinueCreate} className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:bg-[#F8FFFB] transition-colors">
                                            <ArrowRight size={16} className="mr-2 text-[#00A35B]" />
                                            继续创建
                                        </button>
                                    )}
                                    <button type="button" onClick={() => setPageView('form')} className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:bg-[#F8FFFB] transition-colors">
                                        <ClipboardList size={16} className="mr-2 text-[#00A35B]" />
                                        继续编辑
                                    </button>
                                    <button type="button" onClick={onClose} className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:bg-[#F8FFFB] transition-colors">
                                        <ArrowLeft size={16} className="mr-2 text-[#00A35B]" />
                                        返回商品列表
                                    </button>
                                </div>
                            </div>
                        ) : pageView === 'sync' || pageView === 'template' || pageView === 'detail' ? (
                            renderTaskPage(pageView)
                        ) : (
                        <>
                        <div ref={stickyToolbarRef} className="sticky top-0 z-10 -mx-2 px-2 pb-3 bg-[#FAFAFA]">
                            <div className="rounded-[24px] border border-gray-200 bg-white shadow-sm overflow-hidden">
                                <div className="px-5 pt-3 pb-1.5 border-b border-gray-100">
                                    <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                                        {SECTION_ORDER.map(section => (
                                            <button
                                                key={section}
                                                type="button"
                                                onClick={() => scrollToSection(section)}
                                                className={`shrink-0 pb-2.5 text-sm font-bold border-b-2 transition-colors ${
                                                    activeFormSection === section
                                                        ? 'border-[#00C06B] text-[#00A35B]'
                                                        : 'border-transparent text-gray-400 hover:text-[#1F2129]'
                                                }`}
                                            >
                                                <span>{SECTION_LABELS[section]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="px-5 py-3 bg-[#FCFCFD]">
                                    <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                                        <div className="min-w-0">
                                            <div className="text-sm font-black text-[#1F2129]">创建进度</div>
                                            <div className="text-xs text-gray-400 mt-0.5">先补齐必填项，再按需完善展示配置。</div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                            <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#1F2129]">
                                                已完成 {completionSummary.completed}/{completionSummary.total}
                                            </div>
                                            {requiredMissingItems.length > 0 ? (
                                                <div className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
                                                    待完善 {requiredMissingItems.length} 项
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 py-1.5 text-xs font-bold text-[#166534]">
                                                    <CheckCircle2 size={12} className="mr-1.5" />
                                                    可以直接保存
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-3">
                                        <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-[#00C06B] transition-all"
                                                style={{ width: `${completionSummary.total === 0 ? 100 : (completionSummary.completed / completionSummary.total) * 100}%` }}
                                            />
                                        </div>
                                        <div className="shrink-0 text-[11px] font-medium text-gray-400">
                                            {completionSummary.total === 0 ? '100%' : `${Math.round((completionSummary.completed / completionSummary.total) * 100)}%`}
                                        </div>
                                    </div>
                                    <div className="mt-2.5 flex flex-wrap gap-2">
                                        {requiredMissingItems.length > 0 ? requiredMissingItems.slice(0, 3).map(item => (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => scrollToTarget(getValidationTargetId(item.key), item.section)}
                                                className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors flex items-center"
                                            >
                                                <CircleAlert size={12} className="mr-1.5" />
                                                待完善: {item.label}
                                            </button>
                                        )) : null}
                                        {recommendedMissingItems.slice(0, 2).map(item => (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => scrollToTarget(getValidationTargetId(item.key), item.section)}
                                                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                                            >
                                                建议补充: {item.label}
                                            </button>
                                        ))}
                                        {requiredMissingItems.length > 3 && (
                                            <span className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-400">
                                                另有 {requiredMissingItems.length - 3} 项待完善
                                            </span>
                                        )}
                                    </div>
                                    {saveAttempted && requiredMissingItems.length > 0 && (
                                        <div className="mt-2.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                                            仍有 {requiredMissingItems.length} 项必填信息未完成，保存前请先补齐。
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Basic Section */}
                        <div id="basic" className="scroll-mt-[220px] bg-white rounded-2xl p-6 xl:p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="基础信息" icon={<FileText size={20}/>} meta={renderSectionMeta('basic')} />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => visibleFieldIds.has(f.id) && f.module === 'base').map(field => {
                                    const isFullWidth = ['p_rich_desc', 'p_list_desc', 'p_img', 'p_desc_tags', 'p_order_tags'].includes(field.id) || field.type === 'textarea' || field.type === 'rich_text';
                                    const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                    return (
                                        <div id={`field-${field.id}`} key={field.id} className={isFullWidth ? 'col-span-full' : 'col-span-1'}>
                                            <div onClick={() => setActivePreviewField((field.id === 'p_name' ? 'p_name' : 'default') as PreviewField)}>
                                                <FormRow label={field.label} required={isRequired} description={field.description}>
                                                    {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                                </FormRow>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Product Attr Section */}
                        <div id="method" className="scroll-mt-[220px] bg-white rounded-2xl p-6 xl:p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="商品属性" icon={<ChefHat size={20}/>} meta={renderSectionMeta('method')} />
                            <div id="field-s_specs">
                                {renderSpecConfigTable()}
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'product_attr' && visibleFieldIds.has(f.id) && !['s_specs', 'm_methods', 'a_addons'].includes(f.id)).map(field => {
                                    const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                    return (
                                        <div id={`field-${field.id}`}>
                                        <FormRow key={field.id} label={field.label} required={isRequired}>
                                            {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                        </FormRow>
                                        </div>
                                    );
                                })}
                            </div>
                            {renderMethodAddonPanel()}
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] p-5">
                                <div className="text-sm font-bold text-[#1F2129]">属性扩展字段</div>
                                <div className="text-xs text-gray-400 mt-1">可继续承接系统里的口味、标签、做法提示和组合属性配置。</div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {['口味标签', '规格备注', '做法说明', '加料分组', '默认推荐做法'].map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setActivePreviewField('default')}
                                            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-500 hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Display Section */}
                        <div id="display" className="scroll-mt-[220px] bg-white rounded-2xl p-6 xl:p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="展示设置" icon={<Tags size={20}/>} meta={renderSectionMeta('display')} />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'display' && visibleFieldIds.has(f.id)).map(field => {
                                    const isFullWidth = ['p_rich_desc', 'p_list_desc', 'p_desc_tags', 'p_order_tags'].includes(field.id) || field.type === 'textarea' || field.type === 'rich_text';
                                    const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                    return (
                                        <div id={`field-${field.id}`} key={field.id} className={isFullWidth ? 'col-span-full' : 'col-span-1'}>
                                            <div onClick={() => setActivePreviewField((['p_img', 'p_list_desc'].includes(field.id) ? field.id : 'default') as PreviewField)}>
                                                <FormRow label={field.label} required={isRequired} description={field.description}>
                                                    {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                                </FormRow>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] p-5">
                                <div className="text-sm font-bold text-[#1F2129]">扩展展示字段</div>
                                <div className="text-xs text-gray-400 mt-1">按系统常用配置补充展示类信息，便于继续扩展列表标签、视频和详情描述。</div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {['统计标签', '描述标签', '点单标签', '商品角标', '商品视频', '详情页描述'].map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setActivePreviewField('default')}
                                            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-500 hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sales Section */}
                        <div id="spec" className="scroll-mt-[220px] bg-white rounded-2xl p-6 xl:p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="销售属性" icon={<Scale size={20}/>} meta={renderSectionMeta('spec')} />
                            {renderSalesAttributePanel()}
                            <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => (
                                    f.module === 'sales'
                                    && visibleFieldIds.has(f.id)
                                    && ![
                                        's_price',
                                        's_pack_fee',
                                        's_stock',
                                        's_specs',
                                        's_limit',
                                        's_pos_edit',
                                        's_min_purchase_toggle',
                                        's_min_purchase_value',
                                        's_max_purchase_toggle',
                                        's_max_purchase_value',
                                        's_time_sale_toggle',
                                        's_time_sale_rule',
                                        's_sale_mode',
                                        's_sale_settings',
                                        's_takeout_rule',
                                        's_tax_rate'
                                    ].includes(f.id)
                                )).map(field => {
                                    const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                    return (
                                    <div id={`field-${field.id}`} key={field.id} className={field.type === 'textarea' ? 'col-span-full' : 'col-span-1'}>
                                        <FormRow label={field.label} required={isRequired}>
                                            {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                        </FormRow>
                                    </div>
                                )})}
                            </div>
                        </div>

                        {/* Others Section */}
                        <div id="settings" className="scroll-mt-[220px] bg-white rounded-2xl p-6 xl:p-8 border border-gray-200 shadow-sm space-y-6 min-w-0 overflow-hidden">
                            <SectionHeader title="其他属性" icon={<Settings size={20}/>} meta={renderSectionMeta('settings')} />
                            <div className="rounded-2xl border border-[#DCFCE7] bg-gradient-to-br from-[#F7FFF9] to-white p-6 space-y-5 min-w-0">
                                <div className="space-y-4">
                                    <div className="max-w-[720px]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-xl bg-[#00C06B]/10 text-[#00C06B] flex items-center justify-center">
                                                <Clock3 size={18} />
                                            </div>
                                            <div>
                                                <div className="text-base font-black text-[#1F2129]">备货时间设置</div>
                                                <div className="text-xs text-gray-400 mt-1">按商品制作方式设置下单后的备货规则，支持统一配置或按规格分别设置。</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`flex justify-end ${prepScope === 'spec' ? 'pr-4 xl:pr-6' : ''}`}>
                                        <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-3">
                                        <Switch active={prepEnabled} onClick={() => setPrepEnabled(prev => !prev)} />
                                        </div>
                                    </div>
                                </div>

                                {!prepEnabled ? (
                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-6 text-sm text-gray-400">
                                        当前商品无需预留备货时间；如需控制不同规格或不同库存状态的制作节奏，可重新开启后进行设置。
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className={`grid grid-cols-1 gap-5 w-full 2xl:grid-cols-2 ${prepScope === 'spec' ? 'pr-4 xl:pr-6' : ''}`}>
                                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                                <div className="text-sm font-bold text-[#1F2129] mb-3">配置方式</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { value: 'spu' as PrepScope, label: '统一设置', desc: '适用于各规格备货规则一致的商品' },
                                                        { value: 'spec' as PrepScope, label: '按规格设置', desc: '适用于不同规格备货规则不一致的商品' },
                                                    ].map(option => {
                                                        const active = prepScope === option.value;
                                                        return (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setPrepScope(option.value)}
                                                                className={`rounded-xl border px-4 py-4 text-left transition-all ${active ? 'border-[#00C06B] bg-[#F0FDF4]' : 'border-gray-200 hover:border-gray-300'}`}
                                                            >
                                                                <div className={`text-sm font-bold ${active ? 'text-[#00C06B]' : 'text-[#1F2129]'}`}>{option.label}</div>
                                                                <div className="text-xs text-gray-400 mt-1 leading-5">{option.desc}</div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                                <div className="text-sm font-bold text-[#1F2129] mb-3">现货状态</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { value: false, label: '不区分现货/非现货', desc: '无论是否有现货，都使用同一套规则' },
                                                        { value: true, label: '区分现货/非现货', desc: '现货与非现货分别设置备货时间' },
                                                    ].map(option => {
                                                        const active = splitByStockState === option.value;
                                                        return (
                                                            <button
                                                                key={option.label}
                                                                type="button"
                                                                onClick={() => handleStockSplitChange(option.value)}
                                                                className={`rounded-xl border px-4 py-4 text-left transition-all ${active ? 'border-[#00C06B] bg-[#F0FDF4]' : 'border-gray-200 hover:border-gray-300'}`}
                                                            >
                                                                <div className={`text-sm font-bold ${active ? 'text-[#00C06B]' : 'text-[#1F2129]'}`}>{option.label}</div>
                                                                <div className="text-xs text-gray-400 mt-1 leading-5">{option.desc}</div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {prepScope === 'spu' ? (
                                            splitByStockState ? (
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                    {renderPrepRuleEditor(
                                                        '现货规则',
                                                        '适用于有现货、可快速出餐的商品。',
                                                        uniformStockRules.inStock,
                                                        (key, value) => updateStockRuleValue(setUniformStockRules, 'inStock', key, value),
                                                        delta => handleStockRuleNumberStep(uniformStockRules, setUniformStockRules, 'inStock', delta)
                                                    )}
                                                    {renderPrepRuleEditor(
                                                        '非现货规则',
                                                        '适用于需提前生产、解冻、预加工的商品。',
                                                        uniformStockRules.nonStock,
                                                        (key, value) => updateStockRuleValue(setUniformStockRules, 'nonStock', key, value),
                                                        delta => handleStockRuleNumberStep(uniformStockRules, setUniformStockRules, 'nonStock', delta)
                                                    )}
                                                </div>
                                            ) : (
                                                renderPrepRuleEditor(
                                                    '统一备货规则',
                                                    '适用于商品下各规格使用同一套备货规则的场景。',
                                                    uniformPrepRule,
                                                    (key, value) => updatePrepRuleValue(setUniformPrepRule, key, value),
                                                    delta => handleRuleNumberStep(uniformPrepRule, setUniformPrepRule, delta)
                                                )
                                            )
                                        ) : (
                                            <div className="space-y-5">
                                                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                                                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-bold text-[#1F2129]">规格规则明细</div>
                                                        </div>
                                                        <div className="text-xs text-gray-400">如规格较多，可左右滚动查看完整内容</div>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-[980px] w-full border-collapse">
                                                            <thead className="bg-[#F7F8FA]">
                                                                <tr className="text-left text-xs font-bold text-gray-500">
                                                                    <th className="px-4 py-3 border-b border-gray-200 w-[140px]">商品规格</th>
                                                                    {splitByStockState && <th className="px-4 py-3 border-b border-gray-200 w-[100px]">库存状态</th>}
                                                                    <th className="px-4 py-3 border-b border-gray-200 w-[220px]">备货时长</th>
                                                                    <th className="px-4 py-3 border-b border-gray-200 w-[220px]">备货时段</th>
                                                                    <th className="px-4 py-3 border-b border-gray-200 min-w-[260px]">制作顺延设置</th>
                                                                </tr>
                                                            </thead>
                                                            {specPrepRules.map(specRule => (
                                                                <tbody key={specRule.specId}>
                                                                    {[
                                                                        { key: 'inStock' as const, label: '现货', rule: specRule.inStock },
                                                                        ...(splitByStockState ? [{ key: 'nonStock' as const, label: '非现货', rule: specRule.nonStock }] : []),
                                                                    ].map((item, index) => (
                                                                        <tr key={`${specRule.specId}-${item.key}`} className="align-top">
                                                                            {index === 0 && (
                                                                                <td rowSpan={splitByStockState ? 2 : 1} className="px-4 py-4 border-b border-gray-100 bg-white">
                                                                                    <div className="font-bold text-[#1F2129]">{specRule.specName}</div>
                                                                                </td>
                                                                            )}
                                                                            {splitByStockState && (
                                                                                <td className="px-4 py-4 border-b border-gray-100">
                                                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${item.key === 'inStock' ? 'bg-[#E6F8F0] text-[#00A35B]' : 'bg-[#FFF7E6] text-[#C77A00]'}`}>
                                                                                        {item.label}
                                                                                    </span>
                                                                                </td>
                                                                            )}
                                                                            <td className="px-4 py-4 border-b border-gray-100">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleSpecRuleNumberStep(specRule.specId, item.key, item.rule, -1)}
                                                                                            className="w-9 h-9 text-gray-500 hover:bg-gray-50 transition-colors"
                                                                                        >
                                                                                            -
                                                                                        </button>
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            value={item.rule.duration}
                                                                                            onChange={e => updateSpecRuleValue(specRule.specId, item.key, 'duration', e.target.value)}
                                                                                            className="w-14 h-9 text-center text-sm font-bold text-[#1F2129] outline-none border-x border-gray-100"
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleSpecRuleNumberStep(specRule.specId, item.key, item.rule, 1)}
                                                                                            className="w-9 h-9 text-gray-500 hover:bg-gray-50 transition-colors"
                                                                                        >
                                                                                            +
                                                                                        </button>
                                                                                    </div>
                                                                                    <select
                                                                                        value={item.rule.unit}
                                                                                        onChange={e => updateSpecRuleValue(specRule.specId, item.key, 'unit', e.target.value)}
                                                                                        className="q-form-select h-9 min-w-[88px]"
                                                                                    >
                                                                                        {PREP_UNIT_OPTIONS.map(option => (
                                                                                            <option key={option} value={option}>{option}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-4 border-b border-gray-100">
                                                                                <div className="flex items-center gap-4">
                                                                                    {[
                                                                                        { value: 'same_day' as PrepWindow, label: '当天备货' },
                                                                                        { value: 'advance' as PrepWindow, label: '提前备货' },
                                                                                    ].map(option => (
                                                                                        <label key={option.value} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                                                            <input
                                                                                                type="radio"
                                                                                                name={`window-${specRule.specId}-${item.key}`}
                                                                                                checked={item.rule.window === option.value}
                                                                                                onChange={() => updateSpecRuleValue(specRule.specId, item.key, 'window', option.value)}
                                                                                                className="text-[#00C06B] focus:ring-[#00C06B]"
                                                                                            />
                                                                                            <span>{option.label}</span>
                                                                                        </label>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-4 border-b border-gray-100">
                                                                                {item.rule.window === 'advance' ? (
                                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={item.rule.deferNextDay}
                                                                                            onChange={e => updateSpecRuleValue(specRule.specId, item.key, 'deferNextDay', e.target.checked)}
                                                                                            className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                                                        />
                                                                                        <input
                                                                                            type="time"
                                                                                            value={item.rule.deferAfterTime}
                                                                                            disabled={!item.rule.deferNextDay}
                                                                                            onChange={e => updateSpecRuleValue(specRule.specId, item.key, 'deferAfterTime', e.target.value)}
                                                                                            className="q-form-input h-9 w-[126px] disabled:bg-gray-100 disabled:text-gray-400"
                                                                                        />
                                                                                        <span className="text-sm text-gray-500">后顺延至次日制作</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-sm text-gray-400">当天备货不支持顺延设置</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            ))}
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'others' && visibleFieldIds.has(f.id)).map(field => {
                                    const isFullWidth = field.type === 'radio_group' || field.type === 'checkbox_group' || field.type === 'textarea';
                                    const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                    return (
                                         <div id={`field-${field.id}`} key={field.id} className={isFullWidth ? 'col-span-full' : 'col-span-1'}>
                                             <div className={`rounded-xl ${isFullWidth && field.type !== 'textarea' ? 'bg-gray-50/20 border border-gray-100 p-6 shadow-sm mt-4' : 'border-transparent'}`}>
                                                 <FormRow 
                                                     key={field.id} 
                                                     label={field.label} 
                                                     required={isRequired}
                                                     isHorizontal={field.type === 'radio_group' || field.type === 'checkbox_group'}
                                                 >
                                                     {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                                 </FormRow>
                                             </div>
                                         </div>
                                     );
                                })}
                            </div>
                        </div>
                        </>
                        )}

                    </div>
                </div>
            </div>
            {showCategoryImpactModal && pendingCategory && (
                <div className="fixed inset-0 z-50 bg-[#1F2129]/40 flex items-center justify-center p-6">
                    <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-start">
                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mr-3 shrink-0">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-[#1F2129]">确认切换商品类目</h4>
                                <p className="text-sm text-gray-500 mt-1">当前类目将从“{currentCategory.name}”切换为“{pendingCategory.name}”。保存后，部分字段会被清空或恢复默认值。</p>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-5">
                            {impactedFields.resetFields.length > 0 && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="text-sm font-bold text-amber-800 mb-2">将恢复默认值的字段</div>
                                    <div className="flex flex-wrap gap-2">
                                        {impactedFields.resetFields.map(field => (
                                            <span key={field.id} className="px-3 py-1 rounded-full text-xs font-bold bg-white text-amber-700 border border-amber-200">
                                                {field.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {impactedFields.clearFields.length > 0 && (
                                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                                    <div className="text-sm font-bold text-red-700 mb-2">将清空配置的字段</div>
                                    <div className="flex flex-wrap gap-2">
                                        {impactedFields.clearFields.map(field => (
                                            <span key={field.id} className="px-3 py-1 rounded-full text-xs font-bold bg-white text-red-600 border border-red-100">
                                                {field.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {impactedFields.resetFields.length === 0 && impactedFields.clearFields.length === 0 && (
                                <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-4 text-sm text-[#166534]">
                                    新类目与当前类目字段差异较小，切换后不会产生额外字段清理。
                                </div>
                            )}
                            <div className="text-xs text-gray-400 leading-6">
                                保存后系统会按新类目保留字段；不再适用的可选配置会被清空，系统基础字段会恢复默认值，不会继续以隐藏状态生效。
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={cancelCategoryChange} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                                取消
                            </button>
                            <button onClick={confirmCategoryChange} className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-[#1F2129] hover:bg-black transition-colors">
                                确认切换
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.q-form-input { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 10px 12px; font-size: 13px; outline: none; transition: all 0.2s; background: white; } .q-form-input:focus { border-color: #00C06B; box-shadow: 0 0 0 3px rgba(0, 192, 107, 0.1); } .q-form-select { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 10px 12px; font-size: 13px; outline: none; transition: all 0.2s; background: white; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; }`}</style>
        </div>
    );
}
