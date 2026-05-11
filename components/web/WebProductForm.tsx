
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  ArrowLeft, FileText, Scale, Sliders, Settings, Printer, 
  CupSoda, ShoppingBag, Store, Check, Plus, ImageIcon, ChevronRight, AlertTriangle, Clock3,
  CheckCircle2, CircleAlert, Send, ClipboardList, ArrowRight, Tags, ChefHat, ChevronDown, ChevronUp, GripVertical
} from 'lucide-react';
import { Category, AVAILABLE_DYNAMIC_FIELDS, DynamicFieldConfig } from '../../types';
import { Switch, SectionHeader, FormRow } from './WebCommon';
import { WebCategorySelectModal } from './WebModals';

interface WebProductFormProps {
    type: 'standard' | 'combo';
    category: Category;
    categories: Category[];
    onClose: () => void;
    mode?: 'create' | 'edit';
    initialProduct?: Record<string, any> | null;
    existingProductCount?: number;
    previewPreferenceKey?: string;
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
    groupName: string;
    m_method_name: string;
    m_method_sync: boolean;
    m_method_markup: string;
    m_method_code: string;
    m_method_remark: string;
    m_method_tip: string;
};
type AddonConfigRow = {
    id: string;
    groupName: string;
    addonName: string;
    addonCode: string;
    addonLimit: string;
    addonPrice: string;
    addonSpecPrice: string;
    addonStatus: 'on' | 'off';
};
type PreviewDisplayPreference = 'expanded' | 'collapsed';
type DisplayTypeOption = { key: string; label: string; desc: string };

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
const PREVIEW_PREFERENCE_STORAGE_PREFIX = 'pc-product-form-preview:';
const MONEY_FIELD_IDS = new Set([
    's_price',
    's_cost',
    's_market_price',
    's_pack_fee',
    'm_method_markup',
]);
const DISPLAY_TYPE_OPTIONS: DisplayTypeOption[] = [
    { key: 'display_product', label: '展示商品', desc: '开启后，展示商品在前端只作为展示，不支持直接下单结算。' },
    { key: 'group_meal', label: '团餐商品', desc: '开启后，可用于团餐或统一套餐业务场景。' },
    { key: 'pos_edit_price', label: 'POS 临时改价', desc: '开启后，可用于门店 POS 端临时改价场景。' },
    { key: 'temp_product', label: '是否为临时商品', desc: '开启后，可用于临时菜品或按次上新的商品。' },
    { key: 'market_price_product', label: '是否时价商品', desc: '开启后，可在 POS 端按实时价格售卖。' },
    { key: 'children_meal', label: '是否为儿童餐', desc: '开启后，小程序可按儿童餐场景进行展示。' },
];
const COLLAPSIBLE_BASIC_FIELD_IDS = ['p_code', 'p_display_type', 'p_remark', 'p_stat_tags', 'p_tare_weight'] as const;
const COLLAPSIBLE_SALES_FIELDS = [
    { id: 's_jump_third_mini_program', label: '是否跳转三方小程序' },
    { id: 's_third_mini_program_path', label: '三方小程序页面路径' },
    { id: 's_sales_commission_amount', label: '销售提成金额' },
] as const;
const COLLAPSIBLE_OTHER_SECTIONS = [
    { id: 'o_base_sales', label: '基础销量' },
    { id: 'o_more_barcodes', label: '更多条码' },
    { id: 'o_product_share', label: '商品分享' },
] as const;
const WEIGHT_UNIT_OPTIONS = ['克', '千克', '斤', '两'] as const;
const DEFAULT_FRONT_CATEGORY_OPTIONS = ['热销推荐', '奶茶系列', '咖啡系列', '果茶系列'];
const DEFAULT_BACK_CATEGORY_OPTIONS = ['常规商品', '新品商品', '活动商品', '原料商品'];
const SPEC_LIBRARY = [
    { id: 'spec-group-1', name: '杯型规格', values: ['中杯 480ml', '大杯 600ml', '超大杯 700ml'] },
    { id: 'spec-group-2', name: '蛋糕规格', values: ['6寸', '8寸', '10寸', '12寸'] },
    { id: 'spec-group-3', name: '份量规格', values: ['小份', '中份', '大份'] },
] as const;
const METHOD_LIBRARY = [
    { id: 'method-group-1', name: '温度哎', values: ['热', '少冰', '多冰'] },
    { id: 'method-group-2', name: '自建做法组', values: ['做法1', '做法2'] },
    { id: 'method-group-3', name: '口味默认', values: ['标准糖', '七分糖'] },
] as const;
const ADDON_LIBRARY = [
    {
        id: 'addon-group-1',
        name: '小料',
        items: [
            { id: 'addon-item-1', name: '小料1', code: '1210585227812483072', price: '0', status: 'on' as const },
            { id: 'addon-item-2', name: '小料2', code: '1210585270384668672', price: '0', status: 'on' as const },
        ],
    },
    {
        id: 'addon-group-2',
        name: '蛋糕夹心',
        items: [
            { id: 'addon-item-3', name: '草莓夹心', code: '1210585270384668673', price: '6', status: 'on' as const },
            { id: 'addon-item-4', name: '芒果夹心', code: '1210585270384668674', price: '8', status: 'off' as const },
        ],
    },
] as const;
const PREVIEW_FIELD_TITLES: Record<PreviewField, { title: string; desc: string }> = {
    default: { title: '商品展示效果', desc: '点击表单中的关键字段，可查看其在小程序端的展示位置。' },
    p_name: { title: '商品名称效果', desc: '用于突出商品标题，帮助用户快速识别商品。' },
    p_img: { title: '商品主图效果', desc: '主图会展示在商品列表首位区域，影响首屏点击率。' },
    p_list_desc: { title: '列表页简述效果', desc: '列表页简述展示在商品标题下方，用于补充口味卖点。' },
    s_specs: { title: '暂无填写效果示例', desc: '规格配置暂不提供左侧效果预览，可直接在右侧完成规格设置。' },
    m_methods: { title: '做法展示效果', desc: '做法会作为可选项展示，可配置加价信息。' },
    a_addons: { title: '加料展示效果', desc: '加料会在详情页作为附加选项展示，便于用户搭配。' },
};
const DISPLAY_DESC_TAG_OPTIONS = ['店长推荐', '新品首发', '无糖低脂', '人气爆款'];
const DISPLAY_BADGE_OPTIONS = ['新品', '招牌', '限时', '热卖'];

const CATEGORY_MATCH_RULES: Array<{ categoryNames: string[]; keywords: string[] }> = [
    { categoryNames: ['现制饮品'], keywords: ['咖啡', '美式', '拿铁', '摩卡', '果茶', '奶茶', '柠檬', '石榴', '椰', '茶'] },
    { categoryNames: ['蛋糕/烘焙'], keywords: ['蛋糕', '吐司', '面包', '奶油', '可颂', '蛋挞', '烘焙'] },
    { categoryNames: ['称重商品'], keywords: ['称重', '散装', '熟食', '自选', '斤', '克'] },
    { categoryNames: ['零售商品'], keywords: ['零售', '瓶装', '罐装', '饼干', '薯片', '矿泉水', '礼盒'] },
    { categoryNames: ['通用菜品'], keywords: ['饭', '面', '汤', '小炒', '锅', '套餐', '盖饭'] },
];

const matchCategoryFromName = (name: string, categories: Category[], fallbackCategory: Category) => {
    const normalizedName = name.trim().toLowerCase();
    if (!normalizedName) return fallbackCategory;

    for (const rule of CATEGORY_MATCH_RULES) {
        if (!rule.keywords.some(keyword => normalizedName.includes(keyword.toLowerCase()))) continue;
        const matchedCategory = categories.find(item => rule.categoryNames.includes(item.name));
        if (matchedCategory) return matchedCategory;
    }

    return (
        categories.find(item => normalizedName.includes(item.name.toLowerCase()))
        || categories.find(item => item.name.includes('通用'))
        || categories[0]
        || fallbackCategory
    );
};

const getCategoryImageTheme = (categoryName: string) => {
    if (categoryName.includes('饮品')) return { bg: '#FFF4E5', accent: '#FA8C16', deco: '#FFD591' };
    if (categoryName.includes('蛋糕') || categoryName.includes('烘焙')) return { bg: '#FFF1F0', accent: '#EB2F96', deco: '#FFADD2' };
    if (categoryName.includes('零售')) return { bg: '#F6FFED', accent: '#52C41A', deco: '#B7EB8F' };
    if (categoryName.includes('称重')) return { bg: '#F9F0FF', accent: '#722ED1', deco: '#D3ADF7' };
    return { bg: '#E6F7FF', accent: '#1677FF', deco: '#91CAFF' };
};

const generateProductImageDraft = (productName: string, categoryName: string) => {
    const safeName = productName.trim().slice(0, 12) || '新商品';
    const theme = getCategoryImageTheme(categoryName);
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
            <rect width="320" height="320" rx="32" fill="${theme.bg}" />
            <circle cx="84" cy="86" r="42" fill="${theme.deco}" opacity="0.9" />
            <circle cx="248" cy="70" r="26" fill="${theme.accent}" opacity="0.18" />
            <circle cx="252" cy="244" r="38" fill="${theme.deco}" opacity="0.6" />
            <rect x="56" y="182" width="208" height="78" rx="22" fill="#FFFFFF" opacity="0.96" />
            <text x="56" y="140" font-size="26" font-weight="700" fill="${theme.accent}" font-family="Arial, sans-serif">${categoryName}</text>
            <text x="56" y="228" font-size="28" font-weight="700" fill="#1F2129" font-family="Arial, sans-serif">${safeName}</text>
            <text x="56" y="268" font-size="16" fill="#667085" font-family="Arial, sans-serif">AI draft image</text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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

const createEmptySpecConfigRow = (id: string, name = ''): SpecConfigRow => ({
    id,
    s_spec_name: name,
    s_spec_price: '',
    s_spec_cost: '',
    s_spec_market: '',
    s_spec_barcode: '',
    s_spec_mark: '',
    s_spec_sku_code: '',
    s_spec_amount: '',
    s_spec_amount_unit: '份',
    s_spec_inventory_mode: 'custom',
    s_spec_initial_stock: '',
    s_spec_max_stock: '',
    s_spec_warning_stock: '',
    s_spec_sale_status: 'on',
    s_spec_channels: [],
    s_spec_store_pack_fee: '',
    s_spec_store_pack_mark: '',
    s_spec_take_pack_fee: '',
    s_spec_take_pack_mark: '',
    s_spec_img: '',
    s_spec_code: '',
});

const isSpecConfigRowEmpty = (row: SpecConfigRow) => ![
    row.s_spec_name,
    row.s_spec_price,
    row.s_spec_cost,
    row.s_spec_market,
    row.s_spec_barcode,
    row.s_spec_mark,
    row.s_spec_sku_code,
    row.s_spec_amount,
    row.s_spec_initial_stock,
    row.s_spec_max_stock,
    row.s_spec_warning_stock,
    row.s_spec_store_pack_fee,
    row.s_spec_store_pack_mark,
    row.s_spec_take_pack_fee,
    row.s_spec_take_pack_mark,
    row.s_spec_img,
    row.s_spec_code,
].some(value => String(value || '').trim().length > 0);

const clonePrepRule = (rule: PrepRule): PrepRule => ({ ...rule });

const formatPrepRuleSummary = (rule: PrepRule) => {
    const duration = rule.duration || '0';
    const windowText = rule.window === 'same_day' ? '当天备货' : '提前备货';
    const deferText = rule.window === 'advance' && rule.deferNextDay ? `，${rule.deferAfterTime}后下单顺延至次日制作` : '';
    return `${duration}${rule.unit}，${windowText}${deferText}`;
};

const getStoredPreviewPreference = (key: string): PreviewDisplayPreference | null => {
    if (typeof window === 'undefined') return null;
    const rawValue = window.localStorage.getItem(`${PREVIEW_PREFERENCE_STORAGE_PREFIX}${key}`);
    return rawValue === 'expanded' || rawValue === 'collapsed' ? rawValue : null;
};

export const WebProductForm: React.FC<WebProductFormProps> = ({ type, category, categories, onClose, mode = 'create', initialProduct = null, existingProductCount = 0, previewPreferenceKey = 'default-account' }) => {
    const defaultPreviewPreference: PreviewDisplayPreference = existingProductCount > 10 ? 'collapsed' : 'expanded';
    const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>(() => initialProduct ? {
        p_name: initialProduct.name || '',
        p_front_cat: initialProduct.category || '',
        p_img: initialProduct.image || '',
        p_weight_flag: false,
        p_unit: '',
    } : {
        p_weight_flag: false,
        p_unit: '',
    });
    const formContentRef = useRef<HTMLDivElement | null>(null);
    const stickyToolbarRef = useRef<HTMLDivElement | null>(null);
    const [activeFormSection, setActiveFormSection] = useState('basic');
    const [pageView, setPageView] = useState<PageView>('form');
    const [currentCategory, setCurrentCategory] = useState(category);
    const [isCategoryManuallyAdjusted, setIsCategoryManuallyAdjusted] = useState(mode === 'edit');
    const [pendingCategory, setPendingCategory] = useState<Category | null>(null);
    const [showCategoryImpactModal, setShowCategoryImpactModal] = useState(false);
    const [showCategoryPickerModal, setShowCategoryPickerModal] = useState(false);
    const [prepEnabled, setPrepEnabled] = useState(true);
    const [prepScope, setPrepScope] = useState<PrepScope>('spu');
    const [splitByStockState, setSplitByStockState] = useState(false);
    const [specDisplayMode, setSpecDisplayMode] = useState<'single' | 'multi'>(mode === 'create' ? 'single' : 'multi');
    const [activePreviewField, setActivePreviewField] = useState<PreviewField>('default');
    const [previewPreference, setPreviewPreference] = useState<PreviewDisplayPreference | null>(() => getStoredPreviewPreference(previewPreferenceKey));
    const [showPreviewPreferenceMenu, setShowPreviewPreferenceMenu] = useState(false);
    const [expandedBasicFields, setExpandedBasicFields] = useState<string[]>([]);
    const [expandedSalesFields, setExpandedSalesFields] = useState<string[]>([]);
    const [expandedOtherSections, setExpandedOtherSections] = useState<string[]>([]);
    const [isPointsRuleCollapsed, setIsPointsRuleCollapsed] = useState(true);
    const [activeCategorySelector, setActiveCategorySelector] = useState<'p_front_cat' | 'p_back_cat' | null>(null);
    const [frontCategoryOptions, setFrontCategoryOptions] = useState<string[]>(DEFAULT_FRONT_CATEGORY_OPTIONS);
    const [backCategoryOptions, setBackCategoryOptions] = useState<string[]>(DEFAULT_BACK_CATEGORY_OPTIONS);
    const [showMethodPickerModal, setShowMethodPickerModal] = useState(false);
    const [showAddonPickerModal, setShowAddonPickerModal] = useState(false);
    const [showSpecPickerModal, setShowSpecPickerModal] = useState(false);
    const [activeSpecGroupId, setActiveSpecGroupId] = useState<string>(SPEC_LIBRARY[0].id);
    const [tempSpecSelections, setTempSpecSelections] = useState<string[]>([]);
    const [activeMethodGroupId, setActiveMethodGroupId] = useState<string>(METHOD_LIBRARY[0].id);
    const [activeAddonGroupId, setActiveAddonGroupId] = useState<string>(ADDON_LIBRARY[0].id);
    const [tempMethodSelections, setTempMethodSelections] = useState<string[]>([]);
    const [tempAddonSelections, setTempAddonSelections] = useState<string[]>([]);
    const [attrGroupSortEnabled, setAttrGroupSortEnabled] = useState(false);
    const [attrPanelOrder, setAttrPanelOrder] = useState<string[]>(() => (
        mode === 'create'
            ? ['spec']
            : ['spec', 'addon:小料', 'method:温度哎', 'method:自建做法组']
    ));
    const [attrDefaultSelections, setAttrDefaultSelections] = useState<Record<string, string>>(() => (
        mode === 'create'
            ? { spec: '标准规格' }
            : {
                spec: '8寸',
                'method:温度哎': '热',
                'method:自建做法组': '做法1',
                'addon:小料': '小料1',
            }
    ));
    const [draggingAttrPanelId, setDraggingAttrPanelId] = useState<string | null>(null);
    const [draggingAttrItem, setDraggingAttrItem] = useState<{ groupId: string; item: string } | null>(null);
    const [showAttrSortTip, setShowAttrSortTip] = useState(false);
    const effectivePreviewPreference = previewPreference ?? defaultPreviewPreference;
    const isCompactPreview = effectivePreviewPreference === 'collapsed';
    const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(effectivePreviewPreference === 'expanded');
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
    const [specConfigRows, setSpecConfigRows] = useState<SpecConfigRow[]>(() => (
        mode === 'create'
            ? [createEmptySpecConfigRow('spec-1')]
            : [
                { id: 'spec-1', s_spec_name: '8寸', s_spec_price: '', s_spec_cost: '76', s_spec_market: '148', s_spec_barcode: '690000000801', s_spec_mark: '经典款', s_spec_sku_code: 'SKU-08', s_spec_amount: '1.00', s_spec_amount_unit: '克', s_spec_inventory_mode: 'custom', s_spec_initial_stock: '200', s_spec_max_stock: '9999', s_spec_warning_stock: '20', s_spec_sale_status: 'on', s_spec_channels: ['mini_dine', 'mini_take', 'pos'], s_spec_store_pack_fee: '1', s_spec_store_pack_mark: '蛋糕盒', s_spec_take_pack_fee: '2', s_spec_take_pack_mark: '保温袋', s_spec_img: '已上传', s_spec_code: 'CAKE-08' },
                { id: 'spec-2', s_spec_name: '10寸', s_spec_price: '', s_spec_cost: '98', s_spec_market: '188', s_spec_barcode: '690000000802', s_spec_mark: '热销', s_spec_sku_code: 'SKU-10', s_spec_amount: '1.50', s_spec_amount_unit: '克', s_spec_inventory_mode: 'custom', s_spec_initial_stock: '120', s_spec_max_stock: '9999', s_spec_warning_stock: '15', s_spec_sale_status: 'on', s_spec_channels: ['mini_dine', 'meituan'], s_spec_store_pack_fee: '1', s_spec_store_pack_mark: '礼盒装', s_spec_take_pack_fee: '3', s_spec_take_pack_mark: '配送包装', s_spec_img: '', s_spec_code: 'CAKE-10' },
                { id: 'spec-3', s_spec_name: '12寸', s_spec_price: '', s_spec_cost: '132', s_spec_market: '258', s_spec_barcode: '690000000803', s_spec_mark: '大份', s_spec_sku_code: 'SKU-12', s_spec_amount: '2.00', s_spec_amount_unit: '克', s_spec_inventory_mode: 'unlimited', s_spec_initial_stock: '0', s_spec_max_stock: '9999', s_spec_warning_stock: '0', s_spec_sale_status: 'off', s_spec_channels: ['mini_take'], s_spec_store_pack_fee: '2', s_spec_store_pack_mark: '生日套装', s_spec_take_pack_fee: '4', s_spec_take_pack_mark: '加固包装', s_spec_img: '', s_spec_code: 'CAKE-12' },
            ]
    ));
    const [methodConfigRows, setMethodConfigRows] = useState<MethodConfigRow[]>(() => (
        mode === 'create'
            ? []
            : [
                { id: 'method-1', groupName: '温度哎', m_method_name: '热', m_method_sync: true, m_method_markup: '0', m_method_code: '/', m_method_remark: '/', m_method_tip: '/' },
                { id: 'method-2', groupName: '温度哎', m_method_name: '少冰', m_method_sync: true, m_method_markup: '0', m_method_code: '/', m_method_remark: '/', m_method_tip: '/' },
                { id: 'method-3', groupName: '温度哎', m_method_name: '多冰', m_method_sync: false, m_method_markup: '0', m_method_code: '/', m_method_remark: '/', m_method_tip: '/' },
                { id: 'method-4', groupName: '自建做法组', m_method_name: '做法1', m_method_sync: false, m_method_markup: '0', m_method_code: '/', m_method_remark: '/', m_method_tip: '/' },
                { id: 'method-5', groupName: '自建做法组', m_method_name: '做法2', m_method_sync: false, m_method_markup: '0', m_method_code: '/', m_method_remark: '/', m_method_tip: '/' },
            ]
    ));
    const [addonConfigRows, setAddonConfigRows] = useState<AddonConfigRow[]>(() => (
        mode === 'create'
            ? []
            : [
                { id: 'addon-1', groupName: '小料', addonName: '小料1', addonCode: '1210585227812483072', addonLimit: '', addonPrice: '0', addonSpecPrice: '', addonStatus: 'on' },
                { id: 'addon-2', groupName: '小料', addonName: '小料2', addonCode: '1210585270384668672', addonLimit: '', addonPrice: '0', addonSpecPrice: '', addonStatus: 'on' },
            ]
    ));
    const [committedStarterName, setCommittedStarterName] = useState(() => String(initialProduct?.name || '').trim());
    const starterProductName = String(dynamicFormData.p_name || '').trim();
    const isProgressiveCreateMode = mode === 'create';
    const matchedCategory = useMemo(
        () => matchCategoryFromName(committedStarterName, categories, category),
        [committedStarterName, categories, category]
    );
    const isStarterReady = !isProgressiveCreateMode || committedStarterName.length > 0;
    const commitStarterName = () => {
        if (!isProgressiveCreateMode) return;
        const normalizedName = String(dynamicFormData.p_name || '').trim();
        if (normalizedName === committedStarterName) return;
        if (!normalizedName) {
            setCommittedStarterName('');
            setIsCategoryManuallyAdjusted(false);
            setCurrentCategory(category);
            setDynamicFormData(prev => (prev.p_img ? { ...prev, p_img: '' } : prev));
            return;
        }
        setCommittedStarterName(normalizedName);
    };

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
    const primaryBasicFields = useMemo(
        () => AVAILABLE_DYNAMIC_FIELDS.filter(field => (
            visibleFieldIds.has(field.id)
            && field.module === 'base'
            && !COLLAPSIBLE_BASIC_FIELD_IDS.includes(field.id as typeof COLLAPSIBLE_BASIC_FIELD_IDS[number])
        )),
        [visibleFieldIds]
    );
    const optionalBasicFields = useMemo(
        () => AVAILABLE_DYNAMIC_FIELDS.filter(field => (
            visibleFieldIds.has(field.id)
            && field.module === 'base'
            && COLLAPSIBLE_BASIC_FIELD_IDS.includes(field.id as typeof COLLAPSIBLE_BASIC_FIELD_IDS[number])
        )),
        [visibleFieldIds]
    );
    const isWeightProduct = !!dynamicFormData.p_weight_flag;

    useEffect(() => {
        if (isWeightProduct && specDisplayMode !== 'single') {
            setSpecDisplayMode('single');
        }
    }, [isWeightProduct, specDisplayMode]);

    useEffect(() => {
        if (!isProgressiveCreateMode || isCategoryManuallyAdjusted) return;
        if (!committedStarterName) return;
        if (matchedCategory.id === currentCategory.id) return;
        setCurrentCategory(matchedCategory);
    }, [committedStarterName, currentCategory.id, isCategoryManuallyAdjusted, isProgressiveCreateMode, matchedCategory]);

    useEffect(() => {
        if (!isProgressiveCreateMode || !committedStarterName) return;
        setDynamicFormData(prev => {
            const nextImage = generateProductImageDraft(committedStarterName, currentCategory.name);
            if (prev.p_img === nextImage) return prev;
            return {
                ...prev,
                p_img: nextImage,
            };
        });
    }, [committedStarterName, currentCategory.name, isProgressiveCreateMode]);

    const getFieldDescription = (field: DynamicFieldConfig) => {
        if (field.id === 'p_unit') {
            return isWeightProduct ? '称重商品的价格单位，单位设置建议与电子秤单位一致' : undefined;
        }
        return field.description;
    };

    const renderSectionMeta = (sectionId: SectionId) => {
        const info = sectionProgress[sectionId];
        if (!info || info.status === 'optional') return null;
        return (
            <span className="inline-flex min-w-[42px] justify-center rounded-full bg-[#F0FDF4] px-2.5 py-1 text-xs font-bold text-[#00A35B]">
                {info.completed}/{info.total}
            </span>
        );
    };

    const renderBasicImageField = () => {
        const imageValue = dynamicFormData.p_img || '';
        const hasImage = !!imageValue;
        const hasPreviewImage = typeof imageValue === 'string' && imageValue.startsWith('data:image');
        const imageField = AVAILABLE_DYNAMIC_FIELDS.find(field => field.id === 'p_img');
        const imageRequired = currentFieldConfigMap.get('p_img')?.isRequired || imageField?.isRequired;

        return (
            <div id="field-p_img" className="rounded-2xl border border-gray-200 bg-[#FCFCFD] p-4 space-y-3">
                <FormRow
                    label="商品主图"
                    required={!!imageRequired}
                    description="主图为必填信息，系统会根据商品名称自动生成草稿图，也可手动替换。"
                    descriptionPlacement="bottom"
                >
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => {
                                setActivePreviewField('p_img');
                                setDynamicFormData(prev => ({
                                    ...prev,
                                    p_img: prev.p_img ? '' : 'mock-image',
                                }));
                            }}
                            className={`group flex h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
                                hasImage
                                    ? 'border-[#00C06B] bg-[#F0FDF4]'
                                    : 'border-gray-200 bg-white text-gray-400 hover:border-[#00C06B] hover:text-[#00A35B]'
                            }`}
                        >
                            {hasPreviewImage ? (
                                <img src={imageValue} alt="商品主图" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <div className={`mb-2 rounded-full p-3 ${hasImage ? 'bg-white text-[#00A35B]' : 'bg-[#F7F8FA]'}`}>
                                        {hasImage ? <ImageIcon size={22} /> : <Plus size={22} />}
                                    </div>
                                    <span className={`text-sm font-bold ${hasImage ? 'text-[#00A35B]' : 'text-gray-500 group-hover:text-[#00A35B]'}`}>
                                        {hasImage ? '已生成主图草稿，点击可清空' : '点击添加商品主图'}
                                    </span>
                                </div>
                            )}
                        </button>
                        <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                            <span>建议尺寸：800x800px，支持 JPG/PNG，大小不超过 2MB。</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setActivePreviewField('p_img');
                                    setDynamicFormData(prev => ({
                                        ...prev,
                                        p_img: committedStarterName ? generateProductImageDraft(committedStarterName, currentCategory.name) : '',
                                    }));
                                }}
                                className="shrink-0 font-bold text-[#00A35B] hover:text-[#008A4D]"
                            >
                                重新生成草稿
                            </button>
                        </div>
                    </div>
                </FormRow>
            </div>
        );
    };

    const handleCategoryChangeRequest = (targetCategory: Category) => {
        if (!targetCategory || targetCategory.id === currentCategory.id) return;
        setIsCategoryManuallyAdjusted(true);
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
        setDynamicFormData({ p_weight_flag: false, p_unit: '' });
        setCommittedStarterName('');
        setDraftSaved(false);
        setSaveAttempted(false);
        setHasSavedProduct(false);
        setSuccessMode('create');
        setSelectedSuccessAction(null);
        setActivePreviewField('default');
        setActiveFormSection('basic');
        setCurrentCategory(category);
        setIsCategoryManuallyAdjusted(false);
        setPageView('form');
        formContentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    };

    const updatePreviewPreference = (nextPreference: PreviewDisplayPreference) => {
        setPreviewPreference(nextPreference);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(`${PREVIEW_PREFERENCE_STORAGE_PREFIX}${previewPreferenceKey}`, nextPreference);
        }
        setShowPreviewPreferenceMenu(false);
        setIsPreviewPanelOpen(nextPreference === 'expanded');
    };

    const togglePreviewPanel = () => {
        setShowPreviewPreferenceMenu(false);
        setIsPreviewPanelOpen(prev => !prev);
    };

    const handleInlineCategoryCreate = (fieldId: 'p_front_cat' | 'p_back_cat') => {
        const nextLabel = fieldId === 'p_front_cat'
            ? `新建前台分类${frontCategoryOptions.length + 1}`
            : `新建后台分类${backCategoryOptions.length + 1}`;
        if (fieldId === 'p_front_cat') {
            setFrontCategoryOptions(prev => [...prev, nextLabel]);
        } else {
            setBackCategoryOptions(prev => [...prev, nextLabel]);
        }
        setDynamicFormData(prev => ({ ...prev, [fieldId]: nextLabel }));
        setActiveCategorySelector(null);
    };

    const openMethodPicker = () => {
        setActivePreviewField('m_methods');
        setActiveMethodGroupId(METHOD_LIBRARY[0].id);
        setTempMethodSelections(methodConfigRows.map(row => `${row.groupName}:${row.m_method_name}`));
        setShowMethodPickerModal(true);
    };

    const openSpecPicker = () => {
        setActivePreviewField('s_specs');
        setActiveSpecGroupId(SPEC_LIBRARY[0].id);
        setTempSpecSelections(specConfigRows.map(row => row.s_spec_name).filter(Boolean));
        setShowSpecPickerModal(true);
    };

    const confirmSpecPicker = () => {
        const existingMap = new Map(specConfigRows.map(row => [row.s_spec_name, row]));
        const nextRows = tempSpecSelections.map((specName, index) => {
            const existingRow = existingMap.get(specName);
            return existingRow || createEmptySpecConfigRow(`spec-${index + 1}`, specName);
        });
        setSpecConfigRows(nextRows);
        setAttrDefaultSelections(prev => {
            const next = { ...prev };
            if (nextRows.length > 0) {
                next.spec = nextRows[0].s_spec_name;
            } else {
                delete next.spec;
            }
            return next;
        });
        setShowSpecPickerModal(false);
    };

    const confirmMethodPicker = () => {
        const existingMap = new Map(methodConfigRows.map(row => [`${row.groupName}:${row.m_method_name}`, row]));
        const nextRows = tempMethodSelections.map((selection, index) => {
            const [groupName, methodName] = selection.split(':');
            const existingRow = existingMap.get(selection);
            return existingRow || {
                id: `method-${index + 1}`,
                groupName,
                m_method_name: methodName,
                m_method_sync: groupName === '温度哎',
                m_method_markup: '0',
                m_method_code: '/',
                m_method_remark: '/',
                m_method_tip: '/',
            };
        });
        setMethodConfigRows(nextRows);
        setShowMethodPickerModal(false);
    };

    const openAddonPicker = () => {
        setActivePreviewField('a_addons');
        setActiveAddonGroupId(ADDON_LIBRARY[0].id);
        setTempAddonSelections(addonConfigRows.map(row => `${row.groupName}:${row.addonName}`));
        setShowAddonPickerModal(true);
    };

    const confirmAddonPicker = () => {
        const existingMap = new Map(addonConfigRows.map(row => [`${row.groupName}:${row.addonName}`, row]));
        const nextRows = tempAddonSelections.map((selection, index) => {
            const [groupName, addonName] = selection.split(':');
            const existingRow = existingMap.get(selection);
            const addonMeta = ADDON_LIBRARY.flatMap(group => group.items.map(item => ({ groupName: group.name, ...item })))
                .find(item => item.groupName === groupName && item.name === addonName);
            return existingRow || {
                id: `addon-${index + 1}`,
                groupName,
                addonName,
                addonCode: addonMeta?.code || '/',
                addonLimit: '',
                addonPrice: addonMeta?.price || '0',
                addonSpecPrice: '',
                addonStatus: addonMeta?.status || 'on',
            };
        });
        setAddonConfigRows(nextRows);
        setDynamicFormData(prev => ({ ...prev, a_addons: nextRows.length ? 'selected' : '' }));
        setShowAddonPickerModal(false);
    };

    const reorderAttrPanels = (fromPanelId: string, toPanelId: string) => {
        if (fromPanelId === toPanelId) return;
        setAttrPanelOrder(prev => {
            const next = [...prev];
            const fromIndex = next.indexOf(fromPanelId);
            const toIndex = next.indexOf(toPanelId);
            if (fromIndex === -1 || toIndex === -1) return prev;
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    };

    const moveAttrRows = <T,>(rows: T[], fromItem: string, toItem: string, getItemLabel: (row: T) => string) => {
        const next = [...rows];
        const fromIndex = next.findIndex(row => getItemLabel(row) === fromItem);
        const toIndex = next.findIndex(row => getItemLabel(row) === toItem);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return rows;
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
    };

    const reorderAttrItems = (groupId: string, fromItem: string, toItem: string) => {
        if (fromItem === toItem) return;

        if (groupId === 'spec') {
            setSpecConfigRows(prev => moveAttrRows(prev, fromItem, toItem, row => row.s_spec_name));
            return;
        }

        if (groupId.startsWith('method:')) {
            const groupName = groupId.slice('method:'.length);
            setMethodConfigRows(prev => {
                const reorderedRows = moveAttrRows(
                    prev.filter(row => row.groupName === groupName),
                    fromItem,
                    toItem,
                    row => row.m_method_name
                );
                let cursor = 0;
                return prev.map(row => (row.groupName === groupName ? reorderedRows[cursor++] : row));
            });
            return;
        }

        if (groupId.startsWith('addon:')) {
            const groupName = groupId.slice('addon:'.length);
            setAddonConfigRows(prev => {
                const reorderedRows = moveAttrRows(
                    prev.filter(row => row.groupName === groupName),
                    fromItem,
                    toItem,
                    row => row.addonName
                );
                let cursor = 0;
                return prev.map(row => (row.groupName === groupName ? reorderedRows[cursor++] : row));
            });
        }
    };

    const renderAttributeSortPanel = () => {
        const hasSpecAttr = specDisplayMode === 'multi';
        const hasMethodAttr = methodConfigRows.length > 0;
        const hasAddonAttr = addonConfigRows.length > 0;
        const shouldShow = hasSpecAttr || hasMethodAttr || hasAddonAttr;

        if (!shouldShow) return null;

        const methodGroupNames = Array.from(new Set(methodConfigRows.map(row => row.groupName)));
        const addonGroupNames = Array.from(new Set(addonConfigRows.map(row => row.groupName)));
        const rawGroups = [
            ...(hasSpecAttr ? [{
                id: 'spec',
                title: '规格',
                tag: '规格',
                items: specConfigRows.map(row => row.s_spec_name),
                defaultKey: 'spec',
            }] : []),
            ...addonGroupNames.map(groupName => ({
                id: `addon:${groupName}`,
                title: groupName,
                tag: '加料',
                items: addonConfigRows.filter(row => row.groupName === groupName).map(row => row.addonName),
                defaultKey: `addon:${groupName}`,
            })),
            ...methodGroupNames.map(groupName => ({
                id: `method:${groupName}`,
                title: groupName,
                tag: '做法',
                items: methodConfigRows.filter(row => row.groupName === groupName).map(row => row.m_method_name),
                defaultKey: `method:${groupName}`,
            })),
        ];

        const orderedIds = [...attrPanelOrder.filter(id => rawGroups.some(group => group.id === id)), ...rawGroups.map(group => group.id).filter(id => !attrPanelOrder.includes(id))];
        const activeGroups = orderedIds.map(id => rawGroups.find(group => group.id === id)).filter(Boolean) as typeof rawGroups;

        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="text-lg font-black text-[#1F2129]">商品属性排序</div>
                        <div className="mt-1 text-sm text-gray-400">
                            标<span className="mx-1 inline-block h-3 w-3 rounded-sm bg-[#00C06B]" />为默认属性，可自定义设置默认规格；规格需必选默认值，属性值支持直接拖动排序
                        </div>
                    </div>
                    <div className="relative flex items-center gap-3">
                        <span className="text-sm font-bold text-[#1F2129]">自定义属性组排序</span>
                        <button
                            type="button"
                            onClick={() => setShowAttrSortTip(prev => !prev)}
                            className="text-gray-400 hover:text-[#00A35B]"
                        >
                            <CircleAlert size={16} />
                        </button>
                        <Switch active={attrGroupSortEnabled} onClick={() => setAttrGroupSortEnabled(prev => !prev)} />
                        {showAttrSortTip && (
                            <div className="absolute right-0 top-full mt-2 w-[260px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs leading-5 text-gray-500 shadow-lg">
                                开启后可在下方统一调整属性组顺序
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {activeGroups.map(group => {
                        const defaultValue = attrDefaultSelections[group.defaultKey];
                        const isSpecGroup = group.id === 'spec';
                        return (
                            <div
                                key={group.id}
                                draggable={attrGroupSortEnabled}
                                onDragStart={() => setDraggingAttrPanelId(group.id)}
                                onDragOver={e => {
                                    if (!attrGroupSortEnabled || !draggingAttrPanelId || draggingAttrPanelId === group.id) return;
                                    e.preventDefault();
                                }}
                                onDrop={e => {
                                    e.preventDefault();
                                    if (attrGroupSortEnabled && draggingAttrPanelId) {
                                        reorderAttrPanels(draggingAttrPanelId, group.id);
                                    }
                                    setDraggingAttrPanelId(null);
                                }}
                                onDragEnd={() => setDraggingAttrPanelId(null)}
                                className={`rounded-2xl bg-[#FAFAFA] px-5 py-4 transition-shadow ${draggingAttrPanelId === group.id ? 'shadow-lg ring-2 ring-[#BBF7D0]' : ''}`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {attrGroupSortEnabled && (
                                            <button
                                                type="button"
                                                draggable
                                                onDragStart={() => setDraggingAttrPanelId(group.id)}
                                                className="cursor-grab rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-[#00A35B]"
                                            >
                                                <GripVertical size={18} />
                                            </button>
                                        )}
                                        <div className="flex items-center gap-2">
                                        <div className="text-[16px] font-black text-[#1F2129]">{group.title}</div>
                                        <span className="inline-flex rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 py-1 text-xs font-bold text-[#00A35B]">
                                            {group.tag}
                                        </span>
                                    </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {group.items.map(item => {
                                        const isDefault = defaultValue === item;
                                        const isDraggingItem = draggingAttrItem?.groupId === group.id && draggingAttrItem.item === item;
                                        return (
                                            <button
                                                key={item}
                                                type="button"
                                                draggable
                                                onDragStart={e => {
                                                    e.stopPropagation();
                                                    setDraggingAttrItem({ groupId: group.id, item });
                                                }}
                                                onDragOver={e => {
                                                    if (!draggingAttrItem || draggingAttrItem.groupId !== group.id || draggingAttrItem.item === item) return;
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                onDrop={e => {
                                                    if (!draggingAttrItem || draggingAttrItem.groupId !== group.id) return;
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    reorderAttrItems(group.id, draggingAttrItem.item, item);
                                                    setDraggingAttrItem(null);
                                                }}
                                                onDragEnd={e => {
                                                    e.stopPropagation();
                                                    setDraggingAttrItem(null);
                                                }}
                                                onClick={() => {
                                                    setAttrDefaultSelections(prev => {
                                                        if (isSpecGroup) return { ...prev, [group.defaultKey]: item };
                                                        if (isDefault) {
                                                            const next = { ...prev };
                                                            delete next[group.defaultKey];
                                                            return next;
                                                        }
                                                        return { ...prev, [group.defaultKey]: item };
                                                    });
                                                }}
                                                className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left text-sm transition-colors ${
                                                    isDefault ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#1F2129]' : 'border-transparent bg-white text-[#1F2129] hover:border-gray-200'
                                                } ${isDraggingItem ? 'cursor-grabbing shadow-lg ring-2 ring-[#BBF7D0]' : 'cursor-grab'}`}
                                            >
                                                <span className="flex items-center">
                                                    <span className={`mr-3 h-5 w-5 rounded-[4px] border ${isDefault ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300 bg-white'}`} />
                                                    <span className="font-bold">
                                                        {isDefault ? `默认${item}` : item}
                                                    </span>
                                                </span>
                                                <span className={`ml-3 rounded-md p-1 ${isDraggingItem ? 'text-[#00A35B]' : 'text-gray-300'}`}>
                                                    <GripVertical size={16} />
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
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
                     <button
                        type="button"
                        onClick={() => setShowCategoryPickerModal(true)}
                        className="q-form-select text-left text-[#1F2129] hover:border-[#00C06B]"
                     >
                        {currentCategory.name}
                     </button>
                     <p className="text-[11px] text-gray-400 mt-2">切换类目后，不适用字段会在保存时被清空或恢复默认值。</p>
                 </div>
             );
        }

        if (field.id === 'p_weight_flag') {
            const weightValue = !!dynamicFormData.p_weight_flag;
            return (
                <select
                    onFocus={setPreview}
                    className="q-form-select"
                    value={weightValue ? 'yes' : 'no'}
                    onChange={e => {
                        const nextIsWeight = e.target.value === 'yes';
                        setDynamicFormData(prev => ({
                            ...prev,
                            p_weight_flag: nextIsWeight,
                            p_unit: nextIsWeight ? (prev.p_unit || '千克') : prev.p_unit || '',
                        }));
                    }}
                >
                    <option value="no">否</option>
                    <option value="yes">是</option>
                </select>
            );
        }

        if (field.id === 'p_unit') {
            if (isWeightProduct) {
                return (
                    <select
                        onFocus={setPreview}
                        className="q-form-select"
                        value={value || '千克'}
                        onChange={e => setValue(e.target.value)}
                    >
                        {WEIGHT_UNIT_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                );
            }

            return (
                <div className="relative">
                    <input
                        onFocus={setPreview}
                        className="q-form-input pr-14"
                        placeholder="请输入计量单位"
                        value={value}
                        maxLength={30}
                        onChange={e => setValue(e.target.value.slice(0, 30))}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">{String(value).length}/30</span>
                </div>
            );
        }

        if (field.id === 'p_display_type') {
            const selectedTypes = (value as string[]) || [];
            return (
                <div className="rounded-2xl bg-[#FAFAFA] border border-gray-200 p-4 space-y-4">
                    {DISPLAY_TYPE_OPTIONS.map(option => {
                        const active = selectedTypes.includes(option.key);
                        return (
                            <label key={option.key} className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    checked={active}
                                    onChange={() => {
                                        const nextValue = active
                                            ? selectedTypes.filter(item => item !== option.key)
                                            : [...selectedTypes, option.key];
                                        setValue(nextValue);
                                    }}
                                />
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-[#1F2129]">{option.label}</div>
                                    <div className="mt-1 text-xs leading-5 text-gray-400">{option.desc}</div>
                                </div>
                            </label>
                        );
                    })}
                </div>
            );
        }

        if (field.id === 'p_tare_weight') {
            return (
                <div className="relative">
                    <input
                        onFocus={setPreview}
                        type="number"
                        className="q-form-input pr-10"
                        placeholder="请输入去皮重量"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">克</span>
                </div>
            );
        }

        if (field.id === 'p_front_cat' || field.id === 'p_back_cat') {
            const options = field.id === 'p_front_cat' ? frontCategoryOptions : backCategoryOptions;
            const createLabel = field.id === 'p_front_cat' ? '新增前台分类' : '新增后台分类';
            const helperText = field.id === 'p_front_cat' ? '新增完成后会自动带回当前商品表单' : '可先补建后台分类，再继续完成当前商品创建';
            const isOpen = activeCategorySelector === field.id;

            return (
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setPreview();
                            setActiveCategorySelector(prev => prev === field.id ? null : field.id);
                        }}
                        className="q-form-select text-left text-[#1F2129] hover:border-[#00C06B]"
                    >
                        {value || `请选择${field.label}...`}
                    </button>
                    {isOpen && (
                        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                            <div className="max-h-56 overflow-y-auto p-2">
                                {options.map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => {
                                            setValue(option);
                                            setActiveCategorySelector(null);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                            value === option ? 'bg-[#F0FDF4] font-bold text-[#00A35B]' : 'text-[#1F2129] hover:bg-[#F7F8FA]'
                                        }`}
                                    >
                                        <span>{option}</span>
                                        {value === option && <Check size={14} className="text-[#00A35B]" />}
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-gray-100 bg-[#FAFAFA] px-3 py-3">
                                <button
                                    type="button"
                                    onClick={() => handleInlineCategoryCreate(field.id)}
                                    className="inline-flex items-center text-sm font-bold text-[#00A35B] hover:text-[#008A4D]"
                                >
                                    <Plus size={14} className="mr-1.5" />
                                    {createLabel}
                                </button>
                                <div className="mt-1 text-[11px] text-gray-400">{helperText}</div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        switch (field.type) {
           case 'input': return (
               <div className="relative">
                   <input
                       onFocus={setPreview}
                       className="q-form-input"
                       placeholder={field.placeholder || `请输入${field.label}`}
                       value={value}
                       onChange={e => setValue(e.target.value)}
                       onBlur={field.id === 'p_name' ? commitStarterName : undefined}
                       onKeyDown={field.id === 'p_name' ? (e => {
                           if (e.key === 'Enter') {
                               e.preventDefault();
                               commitStarterName();
                               (e.currentTarget as HTMLInputElement).blur();
                           }
                       }) : undefined}
                   />
                   {['p_name', 'p_code'].includes(field.id) && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">{String(value).length}/70</span>}
               </div>
           );
           case 'number': return MONEY_FIELD_IDS.has(field.id) ? (<div className="relative"><input onFocus={setPreview} type="number" className="q-form-input pl-8" placeholder="0.00" value={value} onChange={e => setValue(e.target.value)} /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span></div>) : (<input onFocus={setPreview} type="number" className="q-form-input" placeholder={field.placeholder || `请输入${field.label}`} value={value} onChange={e => setValue(e.target.value)} />);
           case 'selector': return (<select onFocus={setPreview} className="q-form-select" value={value} onChange={e => setValue(e.target.value)}><option value="">请选择{field.label}...</option>{(field.presetValues || ['选项一', '选项二']).map(option => <option key={option} value={option}>{option}</option>)}</select>);
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

    const renderDisplaySettingsSection = () => {
        const listDescValue = dynamicFormData.p_list_desc || '';
        const detailVideoValue = dynamicFormData.p_video || '';
        const badgeStartDate = dynamicFormData.p_badge_start_date || '';
        const badgeEndDate = dynamicFormData.p_badge_end_date || '';
        const detailContent = dynamicFormData.p_rich_desc || '';

        const renderDisplayUploadField = ({
            fieldId,
            label,
            tip,
            widthClass = 'h-28 w-28',
            previewField = 'default',
            extraAction,
        }: {
            fieldId: string;
            label: string;
            tip: string;
            widthClass?: string;
            previewField?: PreviewField;
            extraAction?: React.ReactNode;
        }) => {
            const uploaded = !!dynamicFormData[fieldId];
            return (
                <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                    <div className="pt-2 text-sm font-bold text-[#1F2129]">{label}</div>
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => {
                                setActivePreviewField(previewField);
                                setDynamicFormData(prev => ({
                                    ...prev,
                                    [fieldId]: prev[fieldId] ? '' : `${fieldId}-mock`,
                                }));
                            }}
                            className={`${widthClass} flex items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
                                uploaded
                                    ? 'border-[#00C06B] bg-[#F0FDF4] text-[#00A35B]'
                                    : 'border-gray-200 bg-[#FAFAFA] text-gray-400 hover:border-[#00C06B] hover:text-[#00A35B]'
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center">
                                {uploaded ? <ImageIcon size={24} /> : <Plus size={24} />}
                                <span className="mt-2 text-xs font-bold">{uploaded ? '已上传' : '添加图片'}</span>
                            </div>
                        </button>
                        <div className="flex flex-wrap items-center gap-2 text-xs leading-5 text-gray-400">
                            <span>{tip}</span>
                            {extraAction}
                        </div>
                    </div>
                </div>
            );
        };

        const renderSelectField = (label: string, fieldId: string, options: string[], placeholder: string) => (
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                <div className="pt-2 text-sm font-bold text-[#1F2129]">{label}</div>
                <select
                    className="q-form-select"
                    value={dynamicFormData[fieldId] || ''}
                    onChange={e => setDynamicFormData(prev => ({ ...prev, [fieldId]: e.target.value }))}
                >
                    <option value="">{placeholder}</option>
                    {options.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
        );

        return (
            <div className="space-y-5">
                <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4 space-y-4">
                    <div>
                        <div className="text-base font-black text-[#1F2129]">列表页展示</div>
                        <div className="mt-1 text-xs text-gray-400">以下配置会直接展示在小程序商品列表页。</div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-4">
                        {renderDisplayUploadField({
                            fieldId: 'p_cover_img',
                            label: '商品封面',
                            tip: '建议尺寸：265*132.5PX，单张大小不超过 300K，上传后展示商品列表封面。',
                            extraAction: (
                                <button
                                    type="button"
                                    onClick={() => setActivePreviewField('p_img')}
                                    className="font-bold text-[#00A35B] hover:text-[#008A4D]"
                                >
                                    查看示例
                                </button>
                            ),
                        })}

                        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                            <div className="pt-2 text-sm font-bold text-[#1F2129]">商品列表简述</div>
                            <div>
                                <textarea
                                    className="q-form-input min-h-[92px] py-3"
                                    placeholder="请输入商品列表页简述"
                                    value={listDescValue}
                                    onFocus={() => setActivePreviewField('p_list_desc')}
                                    onChange={e => setDynamicFormData(prev => ({ ...prev, p_list_desc: e.target.value.slice(0, 100) }))}
                                />
                                <div className="mt-2 text-right text-xs text-gray-400">{String(listDescValue).length}/100</div>
                            </div>
                        </div>

                        {renderSelectField('描述标签', 'p_desc_tags', DISPLAY_DESC_TAG_OPTIONS, '请选择')}
                        {renderSelectField('商品角标', 'p_badge', DISPLAY_BADGE_OPTIONS, '请选择角标')}

                        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                            <div className="pt-2 text-sm font-bold text-[#1F2129]">角标展示日期</div>
                            <div className="grid grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] gap-3">
                                <input
                                    type="date"
                                    className="q-form-input"
                                    value={badgeStartDate}
                                    onChange={e => setDynamicFormData(prev => ({ ...prev, p_badge_start_date: e.target.value }))}
                                />
                                <div className="flex items-center justify-center text-sm font-bold text-gray-400">至</div>
                                <input
                                    type="date"
                                    className="q-form-input"
                                    value={badgeEndDate}
                                    onChange={e => setDynamicFormData(prev => ({ ...prev, p_badge_end_date: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4 space-y-4">
                    <div>
                        <div className="text-base font-black text-[#1F2129]">详情页展示</div>
                        <div className="mt-1 text-xs text-gray-400">以下配置会直接展示在小程序商品详情页。</div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-white p-4">
                        {renderDisplayUploadField({
                            fieldId: 'p_detail_imgs',
                            label: '商品详情图',
                            tip: '建议尺寸：800*450PX，单张大小不超过 1M，详情图展示在商品详情页顶部，最多可上传 10 张；可拖拽调整顺序。',
                            widthClass: 'h-28 w-40',
                        })}

                        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                            <div className="pt-2 text-sm font-bold text-[#1F2129]">商品详情</div>
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm text-gray-400">
                                    {['B', 'I', 'A', '默认字号', '撤销', '重做', '全屏'].map(tool => (
                                        <button
                                            key={tool}
                                            type="button"
                                            onClick={() => setActivePreviewField('default')}
                                            className="rounded-lg px-2 py-1 hover:bg-[#F7F8FA] hover:text-[#1F2129]"
                                        >
                                            {tool}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    className="min-h-[180px] w-full resize-none border-0 px-4 py-3 text-sm text-[#1F2129] focus:outline-none"
                                    placeholder="请输入商品详情内容"
                                    value={detailContent}
                                    onChange={e => setDynamicFormData(prev => ({ ...prev, p_rich_desc: e.target.value }))}
                                />
                            </div>
                        </div>

                        {renderDisplayUploadField({
                            fieldId: 'p_detail_bottom_img',
                            label: '商品详情页底图',
                            tip: '图片将在规格做法加料区下方展示，建议尺寸：高度不限，宽度建议 690。',
                            widthClass: 'h-28 w-36',
                        })}

                        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                            <div className="pt-2 text-sm font-bold text-[#1F2129]">商品视频</div>
                            <div className="space-y-3">
                                <input
                                    className="q-form-input"
                                    placeholder="请输入商品视频路径"
                                    value={detailVideoValue}
                                    onChange={e => setDynamicFormData(prev => ({ ...prev, p_video: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setDynamicFormData(prev => ({ ...prev, p_video: prev.p_video || 'https://video.example.com/product-demo.mp4' }))}
                                    className="text-sm font-bold text-[#00A35B] hover:text-[#008A4D]"
                                >
                                    点我查看视频转换链接教程
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSalesAttributePanel = () => {
        const minPurchaseEnabled = !!dynamicFormData.s_min_purchase_toggle;
        const maxPurchaseEnabled = !!dynamicFormData.s_max_purchase_toggle;
        const timeSaleEnabled = !!dynamicFormData.s_time_sale_toggle;
        const saleMode = dynamicFormData.s_sale_mode || '正常售卖';
        const saleSettings = dynamicFormData.s_sale_settings || {};
        const takeoutRule = dynamicFormData.s_takeout_rule || '正常售卖';
        const taxRate = dynamicFormData.s_tax_rate || '';
        const thirdMiniProgramEnabled = !!dynamicFormData.s_jump_third_mini_program;
        const thirdMiniProgramPath = dynamicFormData.s_third_mini_program_path || '';
        const salesCommissionAmount = dynamicFormData.s_sales_commission_amount || '';
        const invoiceItemName = dynamicFormData.s_invoice_item_name || '';
        const invoiceCustomUnit = dynamicFormData.s_invoice_custom_unit || '';
        const optionalSalesFields = COLLAPSIBLE_SALES_FIELDS;

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

        const updateSalesCommissionAmount = (delta: number) => {
            const current = Number(salesCommissionAmount || 0);
            const next = Math.max(0, current + delta);
            setDynamicFormData(prev => ({ ...prev, s_sales_commission_amount: String(next) }));
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
                                            key: '点餐场景',
                                            desc: '用于补充商品适用的点餐场景，可在后续配置对应场景入口'
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
                                                        {(item.key === '点餐场景' || item.key === '关联档口') && <ChevronRight size={14} className="text-gray-400" />}
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
                                <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                                    <div className="pt-1 text-sm font-bold text-[#1F2129]">税率</div>
                                    <div className="rounded-2xl bg-[#FAFAFA] p-5 space-y-5">
                                        <div className="max-w-[260px]">
                                            <div className="mb-2 text-sm font-bold text-[#1F2129]">选择税率</div>
                                            <select
                                                className="q-form-select"
                                                value={taxRate}
                                                onChange={e => setDynamicFormData(prev => ({ ...prev, s_tax_rate: e.target.value }))}
                                            >
                                                <option value="">请选择</option>
                                                <option value="0%">0%</option>
                                                <option value="1%">1%</option>
                                                <option value="3%">3%</option>
                                                <option value="6%">6%</option>
                                                <option value="9%">9%</option>
                                                <option value="13%">13%</option>
                                            </select>
                                        </div>

                                        <div className="max-w-[520px]">
                                            <div className="mb-2 text-sm font-bold text-[#1F2129]">开票项目名称</div>
                                            <input
                                                className="q-form-input"
                                                placeholder="请输入内容"
                                                value={invoiceItemName}
                                                onChange={e => setDynamicFormData(prev => ({ ...prev, s_invoice_item_name: e.target.value }))}
                                            />
                                            <div className="mt-2 text-xs text-gray-400">用户端开票时展示</div>
                                        </div>

                                        <div className="max-w-[520px]">
                                            <div className="mb-2 text-sm font-bold text-[#1F2129]">自定义开票单位</div>
                                            <input
                                                className="q-form-input"
                                                placeholder="请输入内容"
                                                value={invoiceCustomUnit}
                                                onChange={e => setDynamicFormData(prev => ({ ...prev, s_invoice_custom_unit: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="pt-1">
                    {expandedSalesFields.length === 0 ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setExpandedSalesFields(optionalSalesFields.map(field => field.id))}
                                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                            >
                                展开
                                <ChevronDown size={16} className="ml-1.5 text-gray-400" />
                            </button>
                            {optionalSalesFields.map(field => (
                                <button
                                    key={field.id}
                                    type="button"
                                    onClick={() => setExpandedSalesFields(prev => prev.includes(field.id) ? prev : [...prev, field.id])}
                                    className="inline-flex items-center rounded-xl bg-[#F5F7FA] px-4 py-2 text-sm font-bold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                                >
                                    {field.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
                                {expandedSalesFields.includes('s_jump_third_mini_program') && (
                                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">是否跳转三方小程序</div>
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                active={thirdMiniProgramEnabled}
                                                onClick={() => setDynamicFormData(prev => ({ ...prev, s_jump_third_mini_program: !thirdMiniProgramEnabled }))}
                                            />
                                            <span className="text-sm text-gray-400">{thirdMiniProgramEnabled ? '已开启' : '未开启'}</span>
                                        </div>
                                    </div>
                                )}

                                {expandedSalesFields.includes('s_third_mini_program_path') && (
                                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">三方小程序页面路径</div>
                                        <div>
                                            <input
                                                className="q-form-input"
                                                placeholder="请输入页面路径"
                                                value={thirdMiniProgramPath}
                                                onChange={e => setDynamicFormData(prev => ({ ...prev, s_third_mini_program_path: e.target.value.slice(0, 150) }))}
                                            />
                                            <div className="mt-2 text-right text-xs text-gray-400">{String(thirdMiniProgramPath).length}/150</div>
                                        </div>
                                    </div>
                                )}

                                {expandedSalesFields.includes('s_sales_commission_amount') && (
                                    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">销售提成金额</div>
                                        <div className="max-w-[260px]">
                                            <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => updateSalesCommissionAmount(-1)}
                                                    className="flex h-11 w-12 items-center justify-center text-gray-400 hover:bg-[#F7F8FA] hover:text-[#1F2129]"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    className="h-11 flex-1 border-x border-gray-200 px-3 text-center text-sm font-bold text-[#1F2129] focus:outline-none"
                                                    value={salesCommissionAmount}
                                                    onChange={e => setDynamicFormData(prev => ({ ...prev, s_sales_commission_amount: e.target.value }))}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateSalesCommissionAmount(1)}
                                                    className="flex h-11 w-12 items-center justify-center text-gray-400 hover:bg-[#F7F8FA] hover:text-[#1F2129]"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={() => setExpandedSalesFields([])}
                                    className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                >
                                    收起
                                    <ChevronUp size={16} className="ml-1.5 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderOthersAttributePanel = () => {
        const optionalSections = COLLAPSIBLE_OTHER_SECTIONS;
        const baseSales = dynamicFormData.o_base_sales || '0';
        const moreBarcodes = dynamicFormData.o_more_barcodes || '';
        const shareTitle = dynamicFormData.o_share_title || '';
        const shareImage = dynamicFormData.o_share_image || '';
        const moreSettings = [
            {
                key: 'o_need_prep_time',
                label: '需要预留备货时间',
                desc: '',
            },
            {
                key: 'o_advance_kitchen_print',
                label: '是否提前厨打',
                desc: '开启后，商品支持提前厨打，用于预制商品提前下单制作',
            },
            {
                key: 'o_non_operating_income',
                label: '营业外收入',
                desc: '开启后，该商品在 POS 上不可与大厅商品同时下单，订单收入记为营业外收入，适用于线下 POS 临时售卖不记名卡券并统计为营业外收入场景',
            },
            {
                key: 'o_set_as_staple',
                label: '设为主食',
                desc: '开启后，小程序点单提交订单时，若主食商品，则提示顾客，避免漏点主食',
            },
        ];

        const updateBaseSales = (delta: number) => {
            const current = Number(baseSales || 0);
            const next = Math.max(0, current + delta);
            setDynamicFormData(prev => ({ ...prev, o_base_sales: String(next) }));
        };

        return (
            <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-1 text-sm font-bold text-[#1F2129]">更多设置</div>
                        <div className="rounded-2xl bg-[#FAFAFA] p-5 space-y-5">
                            {moreSettings.map(item => (
                                <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                        checked={!!dynamicFormData[item.key]}
                                        onChange={() => setDynamicFormData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                    />
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-[#1F2129]">{item.label}</div>
                                        {item.desc && <div className="mt-1 text-xs leading-5 text-gray-400">{item.desc}</div>}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-1">
                    {expandedOtherSections.length === 0 ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setExpandedOtherSections(optionalSections.map(section => section.id))}
                                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                            >
                                展开
                                <ChevronDown size={16} className="ml-1.5 text-gray-400" />
                            </button>
                            {optionalSections.map(section => (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => setExpandedOtherSections(prev => prev.includes(section.id) ? prev : [...prev, section.id])}
                                    className="inline-flex items-center rounded-xl bg-[#F5F7FA] px-4 py-2 text-sm font-bold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                                >
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
                                {expandedOtherSections.includes('o_base_sales') && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">基础销量</div>
                                        <div className="max-w-[220px]">
                                            <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => updateBaseSales(-1)}
                                                    className="flex h-11 w-12 items-center justify-center text-gray-400 hover:bg-[#F7F8FA] hover:text-[#1F2129]"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    className="h-11 flex-1 border-x border-gray-200 px-3 text-center text-sm font-bold text-[#1F2129] focus:outline-none"
                                                    value={baseSales}
                                                    onChange={e => setDynamicFormData(prev => ({ ...prev, o_base_sales: e.target.value }))}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateBaseSales(1)}
                                                    className="flex h-11 w-12 items-center justify-center text-gray-400 hover:bg-[#F7F8FA] hover:text-[#1F2129]"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {expandedOtherSections.includes('o_more_barcodes') && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">更多条码</div>
                                        <div className="max-w-[520px]">
                                            <input
                                                className="q-form-input"
                                                placeholder="请输入更多条码"
                                                value={moreBarcodes}
                                                onChange={e => setDynamicFormData(prev => ({ ...prev, o_more_barcodes: e.target.value }))}
                                            />
                                            <div className="mt-2 text-xs text-gray-400">多个条码请用英文模式下逗号隔开</div>
                                        </div>
                                    </div>
                                )}

                                {expandedOtherSections.includes('o_product_share') && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">商品分享</div>
                                        <div className="rounded-2xl bg-[#FAFAFA] p-5 space-y-5">
                                            <div>
                                                <div className="mb-2 text-sm font-bold text-[#1F2129]">分享标题</div>
                                                <input
                                                    className="q-form-input"
                                                    placeholder="请输入分享标题"
                                                    value={shareTitle}
                                                    onChange={e => setDynamicFormData(prev => ({ ...prev, o_share_title: e.target.value.slice(0, 20) }))}
                                                />
                                                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                                                    <span>未设置则默认取商品名称</span>
                                                    <span>{String(shareTitle).length}/20</span>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="mb-2 text-sm font-bold text-[#1F2129]">分享图片</div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActivePreviewField('p_img');
                                                        setDynamicFormData(prev => ({ ...prev, o_share_image: prev.o_share_image ? '' : 'o_share_image-mock' }));
                                                    }}
                                                    className={`h-28 w-40 flex items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
                                                        shareImage
                                                            ? 'border-[#00C06B] bg-[#F0FDF4] text-[#00A35B]'
                                                            : 'border-gray-200 bg-white text-gray-400 hover:border-[#00C06B] hover:text-[#00A35B]'
                                                    }`}
                                                >
                                                    <div className="flex flex-col items-center justify-center">
                                                        {shareImage ? <ImageIcon size={24} /> : <Plus size={24} />}
                                                        <span className="mt-2 text-xs font-bold">{shareImage ? '已上传' : '添加图片'}</span>
                                                    </div>
                                                </button>
                                                <div className="mt-2 text-xs text-gray-400">建议尺寸：300*240px，未设置则默认取商品图片</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={() => setExpandedOtherSections([])}
                                    className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                >
                                    收起
                                    <ChevronUp size={16} className="ml-1.5 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPreviewPanel = (compact = false) => {
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
            : (specDisplayMode === 'multi' ? ['待选择规格'] : ['标准规格']);
        const primarySpecPrice = visibleSpecRows[0]?.s_spec_price || '--';
        const currentPreviewPreference = previewPreference ?? defaultPreviewPreference;

        return (
            <div className={compact ? 'w-[320px] max-w-[calc(100vw-32px)] rounded-[28px] border border-gray-200 bg-white p-4 shadow-2xl overflow-y-auto max-h-[calc(100vh-128px)]' : 'w-full min-w-0 bg-white border-r border-[#E8E8E8] p-4 overflow-y-auto'}>
                <div className="rounded-2xl overflow-hidden border border-[#12B76A]/20 shadow-sm">
                    <div className="bg-[#12B76A] px-4 py-3 text-white">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-xl font-black">效果示例</div>
                                {compact && <div className="mt-1 text-xs text-white/80">{previewTitle.title}</div>}
                            </div>
                            <div className="relative flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPreviewPreferenceMenu(prev => !prev)}
                                    className="inline-flex items-center rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                                >
                                    <Sliders size={13} className="mr-1.5" />
                                    个性化设置
                                </button>
                                {compact && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPreviewPreferenceMenu(false);
                                            setIsPreviewPanelOpen(false);
                                        }}
                                        className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                                    >
                                        收起
                                    </button>
                                )}
                                {showPreviewPreferenceMenu && (
                                    <div className="absolute right-0 top-[42px] z-20 w-[196px] rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                                        {[
                                            { value: 'expanded' as PreviewDisplayPreference, label: '默认展开' },
                                            { value: 'collapsed' as PreviewDisplayPreference, label: '默认收起' },
                                        ].map(option => {
                                            const active = currentPreviewPreference === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => updatePreviewPreference(option.value)}
                                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${active ? 'bg-[#F0FDF4] text-[#00A35B]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#1F2129]'}`}
                                                >
                                                    <span>{option.label}</span>
                                                    {active && <Check size={14} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-[#F8FAFC]">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-[#1F2129]">{previewTitle.title}</div>
                                <div className="text-xs text-gray-500 mt-2 leading-5">{previewTitle.desc}</div>
                            </div>
                            {!compact && (
                                <div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-400 border border-gray-200">
                                    {currentPreviewPreference === 'collapsed' ? '默认收起' : '默认展开'}
                                </div>
                            )}
                        </div>
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
                                            <div className="text-[#12B76A] text-xs font-black">¥{primarySpecPrice}起</div>
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
                            <label
                                key={option.key}
                                className={`flex items-center gap-2 text-sm ${isWeightProduct && option.key === 'multi' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <input
                                    type="radio"
                                    checked={specDisplayMode === option.key}
                                    disabled={isWeightProduct && option.key === 'multi'}
                                    onChange={() => {
                                        if (option.key === 'single' && specConfigRows.length === 0) {
                                            setSpecConfigRows([createEmptySpecConfigRow('spec-1')]);
                                            setAttrDefaultSelections(prev => ({ ...prev, spec: '标准规格' }));
                                        }
                                        if (option.key === 'multi' && specConfigRows.length === 1 && isSpecConfigRowEmpty(specConfigRows[0])) {
                                            setSpecConfigRows([]);
                                            setAttrDefaultSelections(prev => {
                                                const next = { ...prev };
                                                delete next.spec;
                                                return next;
                                            });
                                        }
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
                {specDisplayMode === 'multi' && (
                    <button
                        type="button"
                        onClick={openSpecPicker}
                        className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                    >
                        <Plus size={16} className="mr-2" />
                        选择规格
                    </button>
                )}
                {isWeightProduct && (
                    <div className="text-xs font-bold text-amber-600">称重商品不支持多规格，已自动切换为统一规格</div>
                )}
            </div>
            <div className="relative">
                {specDisplayMode === 'multi' && specConfigRows.length === 0 ? (
                    <div className="px-5 py-10">
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] px-6 py-10 text-center">
                            <div className="text-base font-bold text-[#1F2129]">暂未选择多规格</div>
                            <div className="mt-2 text-sm text-gray-400">先选择需要添加的规格值，再按规格分别配置价格、库存和包装信息。</div>
                            <button
                                type="button"
                                onClick={openSpecPicker}
                                className="mt-5 inline-flex items-center rounded-xl bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]"
                            >
                                <Plus size={16} className="mr-2" />
                                选择规格
                            </button>
                        </div>
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-[2860px] w-full border-collapse">
                        <thead className="bg-[#F7F8FA]">
                            <tr className="text-left text-xs font-bold text-gray-500">
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">规格名称</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[140px]">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="text-red-500">*</span>
                                        <span>基础价格</span>
                                    </span>
                                </th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[140px]">预估成本</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[140px]">市场价</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[180px]">商品条码</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[180px]">商品标识</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[180px]">商品规格码</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[180px]">商品编码</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[180px]">商品份量</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[190px]">库存设置</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[220px]">初始库存</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[140px]">到店外带包装费</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[180px]">到店外带包装标识</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[140px]">外卖配送包装费</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[180px]">外卖配送包装标识</th>
                                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">规格图片</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(specDisplayMode === 'single' ? specConfigRows.slice(0, 1) : specConfigRows).map((row, index) => (
                                <tr key={row.id}>
                                    <td className="px-3 py-3 border-b border-gray-100">
                                        <input
                                            onFocus={() => setActivePreviewField('s_specs')}
                                            value={specDisplayMode === 'single' ? '标准规格' : row.s_spec_name}
                                            onChange={e => updateSpecConfigRow(row.id, 's_spec_name', e.target.value)}
                                            className="q-form-input h-10"
                                            placeholder="规格名称"
                                            disabled={specDisplayMode === 'single' && index === 0}
                                        />
                                    </td>
                                    {(['s_spec_price', 's_spec_cost', 's_spec_market'] as const).map(key => (
                                        <td key={key} className="px-3 py-3 border-b border-gray-100">
                                            <div className="relative">
                                                <input
                                                    onFocus={() => setActivePreviewField('s_specs')}
                                                    type="number"
                                                    value={row[key]}
                                                    onChange={e => updateSpecConfigRow(row.id, key, e.target.value)}
                                                    className="q-form-input h-10 pr-8 text-center font-bold text-[#1F2129]"
                                                    placeholder={key === 's_spec_price' ? '请输入基础价格' : '请输入'}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">元</span>
                                            </div>
                                        </td>
                                    ))}
                                    {(['s_spec_barcode', 's_spec_mark', 's_spec_sku_code', 's_spec_code'] as const).map(key => (
                                        <td key={key} className="px-3 py-3 border-b border-gray-100">
                                            <div className="relative">
                                                <input
                                                    maxLength={50}
                                                    onFocus={() => setActivePreviewField('s_specs')}
                                                    value={row[key]}
                                                    onChange={e => updateSpecConfigRow(row.id, key, e.target.value)}
                                                    className="q-form-input h-10 pr-10"
                                                    placeholder="请输入"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{row[key].length}/50</span>
                                            </div>
                                        </td>
                                    ))}
                                    <td className="px-3 py-3 border-b border-gray-100">
                                        <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
                                            <input
                                                onFocus={() => setActivePreviewField('s_specs')}
                                                type="number"
                                                step="0.01"
                                                value={row.s_spec_amount}
                                                onChange={e => updateSpecConfigRow(row.id, 's_spec_amount', e.target.value)}
                                                className="q-form-input h-10 text-center font-bold"
                                            />
                                            <select
                                                value={row.s_spec_amount_unit}
                                                onChange={e => updateSpecConfigRow(row.id, 's_spec_amount_unit', e.target.value)}
                                                className="q-form-select h-10 min-w-[88px]"
                                            >
                                                {['克', '千克', '份', '个'].map(option => <option key={option} value={option}>{option}</option>)}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 border-b border-gray-100">
                                        <div className="space-y-1.5">
                                            <label className="flex items-center gap-2 text-xs text-gray-600">
                                                <input type="radio" checked={row.s_spec_inventory_mode === 'unlimited'} onChange={() => updateSpecConfigRow(row.id, 's_spec_inventory_mode', 'unlimited')} className="text-[#00C06B] focus:ring-[#00C06B]" />
                                                不限库存
                                            </label>
                                            <label className="flex items-center gap-2 text-xs text-gray-600">
                                                <input type="radio" checked={row.s_spec_inventory_mode === 'custom'} onChange={() => updateSpecConfigRow(row.id, 's_spec_inventory_mode', 'custom')} className="text-[#00C06B] focus:ring-[#00C06B]" />
                                                自定义库存
                                            </label>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 border-b border-gray-100">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <div className="mb-1 text-[11px] text-gray-400">初始</div>
                                                <input onFocus={() => setActivePreviewField('s_specs')} type="number" value={row.s_spec_initial_stock} onChange={e => updateSpecConfigRow(row.id, 's_spec_initial_stock', e.target.value)} className="q-form-input h-10 text-center font-bold" />
                                            </div>
                                            <div>
                                                <div className="mb-1 text-[11px] text-gray-400">最大</div>
                                                <input onFocus={() => setActivePreviewField('s_specs')} type="number" value={row.s_spec_max_stock} onChange={e => updateSpecConfigRow(row.id, 's_spec_max_stock', e.target.value)} className="q-form-input h-10 text-center font-bold" />
                                            </div>
                                        </div>
                                    </td>
                                    {(['s_spec_store_pack_fee', 's_spec_take_pack_fee'] as const).map(key => (
                                        <td key={key} className="px-3 py-3 border-b border-gray-100">
                                            <div className="relative">
                                                <input
                                                    onFocus={() => setActivePreviewField('s_specs')}
                                                    type="number"
                                                    value={row[key]}
                                                    onChange={e => updateSpecConfigRow(row.id, key, e.target.value)}
                                                    className="q-form-input h-10 pr-8 text-center font-bold text-[#1F2129]"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">元</span>
                                            </div>
                                        </td>
                                    ))}
                                    {(['s_spec_store_pack_mark', 's_spec_take_pack_mark'] as const).map(key => (
                                        <td key={key} className="px-3 py-3 border-b border-gray-100">
                                            <div className="relative">
                                                <input
                                                    maxLength={128}
                                                    onFocus={() => setActivePreviewField('s_specs')}
                                                    value={row[key]}
                                                    onChange={e => updateSpecConfigRow(row.id, key, e.target.value)}
                                                    className="q-form-input h-10 pr-12"
                                                    placeholder="请输入"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{row[key].length}/128</span>
                                            </div>
                                        </td>
                                    ))}
                                    <td className="px-3 py-3 border-b border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActivePreviewField('s_specs');
                                                updateSpecConfigRow(row.id, 's_spec_img', row.s_spec_img ? '' : '已上传');
                                            }}
                                            className={`w-[72px] h-[56px] rounded-xl border text-xs font-bold ${row.s_spec_img ? 'border-[#00C06B] bg-[#F0FDF4] text-[#00A35B]' : 'border-dashed border-gray-200 text-gray-400 hover:border-[#00C06B]'}`}
                                        >
                                            {row.s_spec_img ? '已上传' : '上传图片'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/90 to-transparent" />
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-[#FAFAFA]">
                <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-4 py-3 text-xs font-bold text-[#166534]">
                    可 Shift + 鼠标滚轮左右滑动查看更多规格信息
                </div>
            </div>
        </div>
    );

    const renderMethodAddonPanel = () => {
        const addonEmptyTipEnabled = !!dynamicFormData.a_addon_empty_tip_enabled;
        const pointsExchangeEnabled = !!dynamicFormData.p_points_exchange_rule;
        const selectedMethodCount = methodConfigRows.length;
        const selectedAddonCount = addonConfigRows.length;
        const methodGroups = Array.from(new Set(methodConfigRows.map(row => row.groupName)));
        const addonGroups = Array.from(new Set(addonConfigRows.map(row => row.groupName)));

        const updateMethodRow = (id: string, key: keyof MethodConfigRow, value: string | boolean) => {
            setMethodConfigRows(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
        };

        const removeMethodRow = (id: string) => {
            setMethodConfigRows(prev => prev.filter(row => row.id !== id));
        };

        const updateAddonRow = (id: string, key: keyof AddonConfigRow, value: string) => {
            setAddonConfigRows(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
        };

        const removeAddonRow = (id: string) => {
            setAddonConfigRows(prev => prev.filter(row => row.id !== id));
        };

        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-6">
                {isFieldEnabled('m_methods') && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">做法</div>
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={openMethodPicker}
                                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                            >
                                <Plus size={16} className="mr-2" />
                                选择做法
                            </button>
                            {selectedMethodCount > 0 && (
                                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                                    <table className="w-full border-collapse table-fixed">
                                        <thead className="bg-[#F7F8FA]">
                                            <tr className="text-left text-xs font-bold text-gray-500">
                                                <th className="w-[100px] px-3 py-3 border-b border-gray-200">做法</th>
                                                <th className="w-[90px] px-3 py-3 border-b border-gray-200">做法值</th>
                                                <th className="w-[76px] px-3 py-3 border-b border-gray-200">同步</th>
                                                <th className="w-[96px] px-3 py-3 border-b border-gray-200">价格</th>
                                                <th className="w-[100px] px-3 py-3 border-b border-gray-200">标识码</th>
                                                <th className="w-[100px] px-3 py-3 border-b border-gray-200">备注</th>
                                                <th className="w-[110px] px-3 py-3 border-b border-gray-200">温馨提示</th>
                                                <th className="w-[64px] px-3 py-3 border-b border-gray-200">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {methodGroups.map(groupName => {
                                                const groupRows = methodConfigRows.filter(row => row.groupName === groupName);
                                                return groupRows.map((row, index) => (
                                                    <tr key={row.id} className="align-top text-[13px] text-[#1F2129]">
                                                        {index === 0 && (
                                                            <td rowSpan={groupRows.length} className="px-3 py-3 border-b border-gray-100 font-bold bg-white">
                                                                {groupName}
                                                            </td>
                                                        )}
                                                        <td className="px-3 py-3 border-b border-gray-100">{row.m_method_name}</td>
                                                        <td className="px-3 py-3 border-b border-gray-100">
                                                            <Switch active={row.m_method_sync} onClick={() => updateMethodRow(row.id, 'm_method_sync', !row.m_method_sync)} />
                                                        </td>
                                                        <td className="px-3 py-3 border-b border-gray-100">
                                                            <div className="relative">
                                                                <input
                                                                    value={row.m_method_markup}
                                                                    onChange={e => updateMethodRow(row.id, 'm_method_markup', e.target.value)}
                                                                    className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-[#1F2129] outline-none focus:border-[#00C06B]"
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">元</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 border-b border-gray-100">
                                                            <input
                                                                value={row.m_method_code}
                                                                onChange={e => updateMethodRow(row.id, 'm_method_code', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-[#1F2129] outline-none focus:border-[#00C06B]"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3 border-b border-gray-100">
                                                            <input
                                                                value={row.m_method_remark}
                                                                onChange={e => updateMethodRow(row.id, 'm_method_remark', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-[#1F2129] outline-none focus:border-[#00C06B]"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3 border-b border-gray-100">
                                                            <input
                                                                value={row.m_method_tip}
                                                                onChange={e => updateMethodRow(row.id, 'm_method_tip', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-[#1F2129] outline-none focus:border-[#00C06B]"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3 border-b border-gray-100">
                                                            <button type="button" onClick={() => removeMethodRow(row.id)} className="text-[13px] font-bold text-gray-400 hover:text-[#00A35B]">
                                                                删除
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ));
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isFieldEnabled('a_addons') && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">加料</div>
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={openAddonPicker}
                                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                            >
                                <Plus size={16} className="mr-2" />
                                选择加料
                            </button>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-[#1F2129]">加料配置:</span>
                                    <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1F2129] outline-none focus:border-[#00C06B]">
                                        <option>限制所有加料购买总量</option>
                                        <option>限制单个加料购买量</option>
                                    </select>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-[#00A35B] font-bold">
                                    <input type="radio" name="addonRule" defaultChecked className="accent-[#00C06B]" />
                                    点餐时数量不限
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-500">
                                    <input type="radio" name="addonRule" className="accent-[#00C06B]" />
                                    点餐时起购限购数
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-500">
                                    <input type="radio" name="addonRule" className="accent-[#00C06B]" />
                                    点餐时必选
                                </label>
                            </div>
                            {selectedAddonCount > 0 && (
                                <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4 space-y-4">
                                    {addonGroups.map(groupName => (
                                        <div key={groupName} className="space-y-3">
                                            <div className="text-sm font-bold text-[#1F2129]">加料商品类型：{groupName}</div>
                                            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                                                <table className="w-full border-collapse table-fixed">
                                                    <thead className="bg-[#F7F8FA]">
                                                        <tr className="text-left text-xs font-bold text-gray-500">
                                                            <th className="w-[180px] px-3 py-3 border-b border-gray-200">加料商品名称</th>
                                                            <th className="w-[150px] px-3 py-3 border-b border-gray-200">加料商品编码</th>
                                                            <th className="w-[88px] px-3 py-3 border-b border-gray-200">限购</th>
                                                            <th className="w-[88px] px-3 py-3 border-b border-gray-200">初始价格</th>
                                                            <th className="w-[92px] px-3 py-3 border-b border-gray-200">规格加价</th>
                                                            <th className="w-[104px] px-3 py-3 border-b border-gray-200">商品状态</th>
                                                            <th className="w-[64px] px-3 py-3 border-b border-gray-200">操作</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {addonConfigRows.filter(row => row.groupName === groupName).map(row => (
                                                            <tr key={row.id} className="align-top text-[13px] text-[#1F2129]">
                                                                <td className="px-3 py-3 border-b border-gray-100">
                                                                    <div className="font-bold">{row.addonName}</div>
                                                                    <div className="mt-1 text-[11px] leading-5 text-gray-400">ID: {row.addonCode}</div>
                                                                </td>
                                                                <td className="px-3 py-3 border-b border-gray-100 text-gray-400 break-all">{row.addonCode || '/'}</td>
                                                                <td className="px-3 py-3 border-b border-gray-100">
                                                                    <input value={row.addonLimit} onChange={e => updateAddonRow(row.id, 'addonLimit', e.target.value)} placeholder="/" className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-[#1F2129] outline-none focus:border-[#00C06B]" />
                                                                </td>
                                                                <td className="px-3 py-3 border-b border-gray-100">
                                                                    <input value={row.addonPrice} onChange={e => updateAddonRow(row.id, 'addonPrice', e.target.value)} className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-[#1F2129] outline-none focus:border-[#00C06B]" />
                                                                </td>
                                                                <td className="px-3 py-3 border-b border-gray-100">
                                                                    <button type="button" className="text-[13px] font-bold text-[#2563EB] hover:text-[#1D4ED8]">
                                                                        {row.addonSpecPrice ? row.addonSpecPrice : '未设置'}
                                                                    </button>
                                                                </td>
                                                                <td className="px-3 py-3 border-b border-gray-100">
                                                                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${row.addonStatus === 'on' ? 'bg-[#ECFDF3] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                                                                        {row.addonStatus === 'on' ? '启用中' : '已停用'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-3 border-b border-gray-100">
                                                                    <button type="button" onClick={() => removeAddonRow(row.id)} className="text-[13px] font-bold text-gray-400 hover:text-[#00A35B]">
                                                                        删除
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-[#1F2129]">加料未点提示:</span>
                                    <Switch active={addonEmptyTipEnabled} onClick={() => setDynamicFormData(prev => ({ ...prev, a_addon_empty_tip_enabled: !addonEmptyTipEnabled }))} />
                                    <span className="text-sm text-gray-400">当加料未点时，将展示该提示信息</span>
                                </div>
                                <div className="rounded-xl bg-[#FAFAFA] px-4 py-3 text-xs leading-6 text-gray-400">
                                    <div>说明：</div>
                                    <div>1、如果单个加料类型的加料多于 7 个，在小程序商品详情页会折叠显示，可前往加料折叠设置中调整。</div>
                                    <div>2、如果单个加料类型下所有加料都设置限购一份，该加料类型下加料在小程序端将不展示加料“+ -”选择。</div>
                                    <div>3、如果品牌下所有加料都限购一份，可快速统一设置加料小程序显示设置后，小程序端所有加料将不展示加料“+ -”选择。</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(specDisplayMode === 'multi' || selectedMethodCount > 0 || selectedAddonCount > 0) && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">属性排序</div>
                        <div>{renderAttributeSortPanel()}</div>
                    </div>
                )}

                {isFieldEnabled('p_points_exchange_rule') && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">
                            {isPointsRuleCollapsed ? '' : '积分兑换规则'}
                        </div>
                        <div className="space-y-4">
                            {isPointsRuleCollapsed ? (
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsPointsRuleCollapsed(false)}
                                        className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                    >
                                        展开
                                        <ChevronDown size={16} className="ml-1.5 text-gray-400" />
                                    </button>
                                    <span className="inline-flex items-center rounded-full bg-[#F0FDF4] px-3 py-1 text-sm font-bold text-[#00A35B]">
                                        积分兑换规则
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] px-4 py-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Switch active={pointsExchangeEnabled} onClick={() => setDynamicFormData(prev => ({ ...prev, p_points_exchange_rule: !pointsExchangeEnabled }))} />
                                            <span className={`text-sm font-medium ${pointsExchangeEnabled ? 'text-[#1F2129]' : 'text-gray-400'}`}>
                                                {pointsExchangeEnabled ? '已开启积分兑换规则' : '未开启积分兑换规则'}
                                            </span>
                                        </div>
                                        <div className="text-sm leading-6 text-gray-400">
                                            积分商城可选择该商品，如果商品同步到门店，点单页支持纯积分/积分+金额购买商品。
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsPointsRuleCollapsed(true)}
                                        className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                    >
                                        收起
                                        <ChevronUp size={16} className="ml-1.5 text-gray-400" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSpecPickerModal = () => {
        if (!showSpecPickerModal) return null;
        const activeGroup = SPEC_LIBRARY.find(group => group.id === activeSpecGroupId) || SPEC_LIBRARY[0];

        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                <div className="w-full max-w-[1020px] h-[660px] rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div className="text-xl font-black text-[#1F2129]">添加规格</div>
                        <button type="button" onClick={() => setShowSpecPickerModal(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                            <ChevronDown size={18} className="rotate-45" />
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-[220px_1fr_260px] min-h-0">
                        <div className="border-r border-gray-100 p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>规格</span>
                                <button type="button" className="text-[#00A35B]">新增规格</button>
                            </div>
                            <div className="space-y-1.5">
                                {SPEC_LIBRARY.map(group => (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => setActiveSpecGroupId(group.id)}
                                        className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                                            group.id === activeSpecGroupId ? 'bg-[#F0FDF4] font-bold text-[#00A35B]' : 'text-[#1F2129] hover:bg-[#F7F8FA]'
                                        }`}
                                    >
                                        {group.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border-r border-gray-100 p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>规格值</span>
                                <button type="button" className="text-[#00A35B]">新增规格值</button>
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-medium text-[#1F2129]">
                                    <input
                                        type="checkbox"
                                        checked={activeGroup.values.every(value => tempSpecSelections.includes(value))}
                                        onChange={() => {
                                            const groupValues = [...activeGroup.values];
                                            const allChecked = groupValues.every(value => tempSpecSelections.includes(value));
                                            setTempSpecSelections(prev => (
                                                allChecked
                                                    ? prev.filter(item => !groupValues.includes(item))
                                                    : Array.from(new Set([...prev, ...groupValues]))
                                            ));
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    />
                                    <span>全部</span>
                                </label>
                                {activeGroup.values.map(value => {
                                    const checked = tempSpecSelections.includes(value);
                                    return (
                                        <label key={value} className="flex items-center gap-3 text-sm text-[#1F2129]">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => setTempSpecSelections(prev => checked ? prev.filter(item => item !== value) : [...prev, value])}
                                                className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                            />
                                            <span>{value}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>已选择({tempSpecSelections.length})</span>
                                <button type="button" onClick={() => setTempSpecSelections([])} className="text-[#00A35B]">清空</button>
                            </div>
                            <div className="space-y-2">
                                {tempSpecSelections.length > 0 ? tempSpecSelections.map(label => (
                                    <div key={label} className="rounded-xl bg-[#FAFAFA] px-3 py-2 text-sm text-[#1F2129]">
                                        {label}
                                    </div>
                                )) : <div className="text-sm text-gray-400">暂未选择规格</div>}
                            </div>
                        </div>
                    </div>
                    <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                        <button type="button" onClick={() => setShowSpecPickerModal(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                            取消
                        </button>
                        <button type="button" onClick={confirmSpecPicker} className="px-5 py-2 rounded-lg bg-[#00C06B] text-sm font-bold text-white hover:bg-[#00A35B]">
                            确定
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderMethodPickerModal = () => {
        if (!showMethodPickerModal) return null;
        const activeGroup = METHOD_LIBRARY.find(group => group.id === activeMethodGroupId) || METHOD_LIBRARY[0];
        const selectedMethodLabels = tempMethodSelections.map(item => item.split(':')[1]);

        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                <div className="w-full max-w-[1020px] h-[660px] rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div className="text-xl font-black text-[#1F2129]">选择做法</div>
                        <button type="button" onClick={() => setShowMethodPickerModal(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                            <ChevronDown size={18} className="rotate-45" />
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-[220px_1fr_260px] min-h-0">
                        <div className="border-r border-gray-100 p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>做法</span>
                                <button type="button" className="text-[#00A35B]">新增做法</button>
                            </div>
                            <div className="space-y-1.5">
                                {METHOD_LIBRARY.map(group => (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => setActiveMethodGroupId(group.id)}
                                        className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                                            group.id === activeMethodGroupId ? 'bg-[#F0FDF4] font-bold text-[#00A35B]' : 'text-[#1F2129] hover:bg-[#F7F8FA]'
                                        }`}
                                    >
                                        {group.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border-r border-gray-100 p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>做法值</span>
                                <button type="button" className="text-[#00A35B]">新增做法值</button>
                            </div>
                            <div className="space-y-3">
                                {activeGroup.values.map(value => {
                                    const selectionKey = `${activeGroup.name}:${value}`;
                                    const checked = tempMethodSelections.includes(selectionKey);
                                    return (
                                        <label key={selectionKey} className="flex items-center gap-3 text-sm text-[#1F2129]">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => setTempMethodSelections(prev => checked ? prev.filter(item => item !== selectionKey) : [...prev, selectionKey])}
                                                className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                            />
                                            <span>{value}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>已选择({selectedMethodLabels.length})</span>
                                <button type="button" onClick={() => setTempMethodSelections([])} className="text-[#00A35B]">清空</button>
                            </div>
                            <div className="space-y-2">
                                {selectedMethodLabels.length > 0 ? selectedMethodLabels.map(label => (
                                    <div key={label} className="rounded-xl bg-[#FAFAFA] px-3 py-2 text-sm text-[#1F2129]">
                                        {label}
                                    </div>
                                )) : <div className="text-sm text-gray-400">暂未选择做法</div>}
                            </div>
                        </div>
                    </div>
                    <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                        <button type="button" onClick={() => setShowMethodPickerModal(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                            取消
                        </button>
                        <button type="button" onClick={confirmMethodPicker} className="px-5 py-2 rounded-lg bg-[#00C06B] text-sm font-bold text-white hover:bg-[#00A35B]">
                            确定
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderAddonPickerModal = () => {
        if (!showAddonPickerModal) return null;
        const activeGroup = ADDON_LIBRARY.find(group => group.id === activeAddonGroupId) || ADDON_LIBRARY[0];
        const selectedAddonLabels = tempAddonSelections.map(item => item.split(':')[1]);

        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                <div className="w-full max-w-[1020px] h-[660px] rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div className="text-xl font-black text-[#1F2129]">添加加料商品</div>
                        <button type="button" onClick={() => setShowAddonPickerModal(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                            <ChevronDown size={18} className="rotate-45" />
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-[220px_1fr_260px] min-h-0">
                        <div className="border-r border-gray-100 p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>加料组</span>
                                <button type="button" className="text-[#00A35B]">新增加料组</button>
                            </div>
                            <div className="space-y-1.5">
                                {ADDON_LIBRARY.map(group => (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => setActiveAddonGroupId(group.id)}
                                        className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                                            group.id === activeAddonGroupId ? 'bg-[#F0FDF4] font-bold text-[#00A35B]' : 'text-[#1F2129] hover:bg-[#F7F8FA]'
                                        }`}
                                    >
                                        {group.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border-r border-gray-100 p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>加料商品</span>
                                <button type="button" className="text-[#00A35B]">新增加料商品</button>
                            </div>
                            <div className="space-y-3">
                                {activeGroup.items.map(item => {
                                    const selectionKey = `${activeGroup.name}:${item.name}`;
                                    const checked = tempAddonSelections.includes(selectionKey);
                                    return (
                                        <label key={selectionKey} className="flex items-start gap-3 text-sm text-[#1F2129]">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => setTempAddonSelections(prev => checked ? prev.filter(row => row !== selectionKey) : [...prev, selectionKey])}
                                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                            />
                                            <div>
                                                <div>{item.name}</div>
                                                <div className="mt-1 text-xs text-gray-400">价格：{item.price}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>已选择({selectedAddonLabels.length})</span>
                                <button type="button" onClick={() => setTempAddonSelections([])} className="text-[#00A35B]">清空</button>
                            </div>
                            <div className="space-y-2">
                                {selectedAddonLabels.length > 0 ? selectedAddonLabels.map(label => (
                                    <div key={label} className="rounded-xl bg-[#FAFAFA] px-3 py-2 text-sm text-[#1F2129]">
                                        {label}
                                    </div>
                                )) : <div className="text-sm text-gray-400">暂未选择加料</div>}
                            </div>
                        </div>
                    </div>
                    <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
                        <button type="button" onClick={() => setShowAddonPickerModal(false)} className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
                            取消
                        </button>
                        <button type="button" onClick={confirmAddonPicker} className="px-5 py-2 rounded-lg bg-[#00C06B] text-sm font-bold text-white hover:bg-[#00A35B]">
                            确定
                        </button>
                    </div>
                </div>
            </div>
        );
    };

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
                            {pageView === 'form'
                                ? (isProgressiveCreateMode && !starterProductName
                                    ? '请先填写商品名称，系统将自动匹配商品类目并展开后续字段'
                                    : '完善商品信息并保存后，可继续进行后续处理')
                                : `已从${successMode === 'edit' ? '编辑商品页' : '创建商品页'}进入后续处理流程`}
                        </p>
                    </div>
                </div>
                <div className="ml-4 flex shrink-0 items-center space-x-3">
                    {pageView === 'form' ? (
                        <>
                            {isCompactPreview && (
                                <button
                                    type="button"
                                    onClick={togglePreviewPanel}
                                    className="px-4 py-2 border border-gray-200 bg-white text-gray-600 font-bold rounded-lg hover:bg-gray-50 hover:border-[#00C06B] hover:text-[#00A35B] transition-colors text-sm flex items-center"
                                >
                                    <ImageIcon size={15} className="mr-2" />
                                    {isPreviewPanelOpen ? '收起小程序效果' : '查看小程序效果'}
                                </button>
                            )}
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

            <div className="relative flex-1 flex overflow-hidden min-w-0">
                {pageView === 'form' && isStarterReady && !isCompactPreview && (
                    <div className="w-[300px] bg-white border-r border-[#E8E8E8] shrink-0 flex flex-col">
                        {renderPreviewPanel()}
                    </div>
                )}

                {pageView === 'form' && isStarterReady && isCompactPreview && isPreviewPanelOpen && (
                    <div className="pointer-events-none fixed right-6 top-[92px] bottom-6 z-30 flex items-start">
                        <div className="pointer-events-auto">
                            {renderPreviewPanel(true)}
                        </div>
                    </div>
                )}

                {/* Form Content */}
                <div ref={formContentRef} className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-4 pb-8 scroll-smooth no-scrollbar lg:px-6 xl:px-8">
                    <div className="w-full min-w-0 max-w-[1240px] mx-auto pt-5 pb-16 space-y-4">
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
                        {isStarterReady && (
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
                                <div className="px-5 py-2.5 bg-[#FCFCFD]">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <div className="text-sm font-black text-[#1F2129] shrink-0">创建进度</div>
                                            <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-[#1F2129]">
                                                {completionSummary.completed}/{completionSummary.total}
                                            </div>
                                            {requiredMissingItems.length > 0 ? (
                                                <>
                                                    {requiredMissingItems.slice(0, 3).map(item => (
                                                        <button
                                                            key={item.key}
                                                            type="button"
                                                            onClick={() => scrollToTarget(getValidationTargetId(item.key), item.section)}
                                                            className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                                                        >
                                                            <CircleAlert size={12} className="mr-1.5" />
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                    {requiredMissingItems.length > 3 && (
                                                        <span className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-400">
                                                            另有 {requiredMissingItems.length - 3} 项
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="inline-flex items-center rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-1 text-[11px] font-bold text-[#166534]">
                                                    <CheckCircle2 size={12} className="mr-1" />
                                                    可保存
                                                </div>
                                            )}
                                            {requiredMissingItems.length === 0 && recommendedMissingItems.slice(0, 2).map(item => (
                                                <button
                                                    key={item.key}
                                                    type="button"
                                                    onClick={() => scrollToTarget(getValidationTargetId(item.key), item.section)}
                                                    className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                                                >
                                                    建议补充: {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
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
                                    {saveAttempted && requiredMissingItems.length > 0 && (
                                        <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] text-red-600">
                                            仍有 {requiredMissingItems.length} 项必填信息未完成。
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Basic Section */}
                        <div id="basic" className="scroll-mt-[220px] bg-white rounded-2xl p-5 xl:p-6 border border-gray-200 shadow-sm space-y-4">
                            <SectionHeader title="基础信息" icon={<FileText size={20}/>} meta={renderSectionMeta('basic')} />
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-3">
                                    {primaryBasicFields.map(field => {
                                        if (field.id === 'p_img') return null;
                                        if (isProgressiveCreateMode && !isStarterReady && field.id !== 'p_name') return null;
                                        const isFullWidth = ['p_display_type', 'p_remark'].includes(field.id) || field.type === 'rich_text';
                                        const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                        return (
                                            <div id={`field-${field.id}`} key={field.id} className={isFullWidth ? 'col-span-full' : 'col-span-1'}>
                                                <div onClick={() => setActivePreviewField((field.id === 'p_name' ? 'p_name' : 'default') as PreviewField)}>
                                                    <FormRow label={field.label} required={isRequired} description={getFieldDescription(field)} descriptionPlacement="bottom">
                                                        {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                                    </FormRow>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {isStarterReady && (
                                    <div className="xl:pl-1">
                                        {renderBasicImageField()}
                                    </div>
                                )}
                            </div>
                            {isProgressiveCreateMode && !isStarterReady && (
                                <div className="rounded-2xl border border-dashed border-[#D9D9D9] bg-[#FCFCFD] px-4 py-3 text-sm text-gray-500">
                                    先填写并确认`商品名称`，系统会自动匹配商品类目并根据类目展示完整创建表单。
                                </div>
                            )}
                            {optionalBasicFields.length > 0 && isStarterReady && (
                                <div className="pt-1">
                                    {expandedBasicFields.length === 0 ? (
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedBasicFields(optionalBasicFields.map(field => field.id))}
                                                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                            >
                                                展开
                                                <ChevronDown size={16} className="ml-1.5 text-gray-400" />
                                            </button>
                                            {optionalBasicFields.map(field => (
                                                <button
                                                    key={field.id}
                                                    type="button"
                                                    onClick={() => setExpandedBasicFields(prev => prev.includes(field.id) ? prev : [...prev, field.id])}
                                                    className="inline-flex items-center rounded-xl bg-[#F5F7FA] px-3.5 py-2 text-sm font-bold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                                                >
                                                    {field.label}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-3">
                                                {optionalBasicFields.filter(field => expandedBasicFields.includes(field.id)).map(field => {
                                                    const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                                    const isFullWidth = ['p_display_type', 'p_remark'].includes(field.id) || ['rich_text', 'checkbox_group'].includes(field.type);
                                                    return (
                                                        <div id={`field-${field.id}`} key={field.id} className={isFullWidth ? 'col-span-full' : 'col-span-1'}>
                                                            <FormRow label={field.label} required={isRequired} description={getFieldDescription(field)} descriptionPlacement="bottom">
                                                                {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                                            </FormRow>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedBasicFields([])}
                                                    className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                                >
                                                    收起
                                                    <ChevronUp size={16} className="ml-1.5 text-gray-400" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {isStarterReady && (
                        <>
                        {/* Product Attr Section */}
                        <div id="method" className="scroll-mt-[220px] bg-white rounded-2xl p-5 xl:p-6 border border-gray-200 shadow-sm space-y-5">
                            <SectionHeader title="商品属性" icon={<ChefHat size={20}/>} meta={renderSectionMeta('method')} />
                            <div id="field-s_specs">
                                {renderSpecConfigTable()}
                            </div>
                            {renderMethodAddonPanel()}
                        </div>

                        {/* Display Section */}
                        <div id="display" className="scroll-mt-[220px] bg-white rounded-2xl p-5 xl:p-6 border border-gray-200 shadow-sm space-y-5">
                            <SectionHeader title="展示设置" icon={<Tags size={20}/>} meta={renderSectionMeta('display')} />
                            {renderDisplaySettingsSection()}
                        </div>

                        {/* Sales Section */}
                        <div id="spec" className="scroll-mt-[220px] bg-white rounded-2xl p-5 xl:p-6 border border-gray-200 shadow-sm space-y-5">
                            <SectionHeader title="销售属性" icon={<Scale size={20}/>} meta={renderSectionMeta('spec')} />
                            {renderSalesAttributePanel()}
                            <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-5">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => (
                                    f.module === 'sales'
                                    && visibleFieldIds.has(f.id)
                                    && ![
                                        's_price',
                                        's_cost',
                                        's_market_price',
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
                        <div id="settings" className="scroll-mt-[220px] bg-white rounded-2xl p-5 xl:p-6 border border-gray-200 shadow-sm space-y-5 min-w-0 overflow-hidden">
                            <SectionHeader title="其他属性" icon={<Settings size={20}/>} meta={renderSectionMeta('settings')} />
                            {renderOthersAttributePanel()}
                        </div>
                        </>
                        )}
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
            {showCategoryPickerModal && (
                <WebCategorySelectModal
                    type={type}
                    onClose={() => setShowCategoryPickerModal(false)}
                    categories={categories}
                    onSelect={(nextCategory) => {
                        setShowCategoryPickerModal(false);
                        handleCategoryChangeRequest(nextCategory);
                    }}
                />
            )}
            {renderSpecPickerModal()}
            {renderMethodPickerModal()}
            {renderAddonPickerModal()}
            <style>{`.q-form-input { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 8px 12px; min-height: 38px; font-size: 13px; outline: none; transition: all 0.2s; background: white; } .q-form-input:focus { border-color: #00C06B; box-shadow: 0 0 0 3px rgba(0, 192, 107, 0.1); } .q-form-select { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 8px 12px; min-height: 38px; font-size: 13px; outline: none; transition: all 0.2s; background: white; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; }`}</style>
        </div>
    );
}
