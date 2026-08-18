
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  ArrowLeft, FileText, Scale, Sliders, Pencil, Settings, Printer, 
  CupSoda, ShoppingBag, Store, Check, Plus, ImageIcon, ChevronRight, Clock3, Eye, EyeOff,
  CheckCircle2, CircleAlert, Send, ClipboardList, ArrowRight, Tags, ChefHat, ChevronLeft, ChevronDown, ChevronUp, GripVertical, X, CircleHelp, Trash2, Search, LoaderCircle
} from 'lucide-react';
import { Category, CategoryFieldConfig, AVAILABLE_DYNAMIC_FIELDS, COMMON_FIELD_CHILD_CONFIG_LIBRARY, DynamicFieldConfig, OmnichannelChannelId, ThirdPartyChannelId, resolveChildRequiredConfigs } from '../../types';
import { channelGroupIncludesMiniProgram } from '../../omnichannel';
import { Switch, SectionHeader, FormRow } from './WebCommon';
import { WebCategorySelectModal } from './WebModals';
import { WebThirdPartyChannelFields } from './WebThirdPartyChannelFields';

interface WebProductFormProps {
    type: 'standard' | 'combo';
    category: Category;
    categories: Category[];
    onClose: () => void;
    mode?: 'create' | 'edit';
    initialProduct?: Record<string, any> | null;
    existingProductCount?: number;
    previewPreferenceKey?: string;
    commonFieldConfigs?: Record<string, CategoryFieldConfig[]>;
    channelEditableFieldIds?: string[];
    onOpenCommonFieldSettings?: (type: 'standard' | 'combo', categoryId: string) => void;
    groupedTagOptions?: Record<GroupedTagFieldId, GroupedTagGroup[]>;
    badgeOptions?: BadgeOptionConfig[];
    onGroupedTagOptionsChange?: (value: Record<GroupedTagFieldId, GroupedTagGroup[]>) => void;
    onBadgeOptionsChange?: (value: BadgeOptionConfig[]) => void;
    thirdPartyChannelAttributeIds?: ThirdPartyChannelId[];
    formScope?: 'master' | 'channel' | 'unified' | 'store';
    channelContext?: {
        catalogName: string;
        channelIds: OmnichannelChannelId[];
        channelNames: string[];
        masterName: string;
        skuId: string;
    };
    storeContext?: {
        storeId: string;
        storeName: string;
        currentChannelIds: string[];
        activeChannelId: string;
    };
    onProductSaved?: (product: {
        id?: string;
        name: string;
        price: number;
        category: string;
        image: string;
        skuCode: string;
        type: 'standard' | 'combo';
        formData?: Record<string, any>;
    }, action: 'create' | 'edit') => void;
    onOpenChannelCatalog?: () => void;
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
type SectionId = 'basic' | 'third_party' | 'display' | 'spec' | 'method' | 'settings';
type ValidationItem = {
    key: string;
    label: string;
    section: SectionId;
    filled: boolean;
    type: 'required' | 'recommended';
};
type PreviewField = 'p_name' | 'p_img' | 'p_list_desc' | 's_specs' | 'm_methods' | 'a_addons' | 'default';
type PageView = 'form' | 'success' | 'sync' | 'template' | 'detail' | 'templateHistory';
type StoreSaveStage = 'confirm' | 'saving' | 'result';
type TaskFlowView = 'sync' | 'template';
type TaskExecutionMode = 'manual' | 'immediate' | 'scheduled';
type TemplateTaskStatus = 'processing' | 'completed';
type TemplateTaskType = '添加商品' | '更新商品';
type TemplateOption = {
    id: string;
    name: string;
    desc: string;
    channels: string;
    saleType: string;
    group: string;
    type: string;
};
type CategoryTreeNode = {
    id: string;
    name: string;
    children: Array<{
        id: string;
        name: string;
    }>;
};

const STORE_CHANNEL_LABELS: Record<string, string> = {
    mini_dine: '小程序-堂食',
    mini_take: '小程序-外卖',
    pos: 'POS',
    meituan: '美团-外卖',
    meituan_dine: '美团-在线点',
    meituan_tuangou: '美团-团购',
    taobao: '淘宝闪购',
    eleme: '饿了么',
    douyin_dine: '抖音在线点',
};

const STORE_COMBO_MISSING_CHILDREN: Record<string, string[]> = {
    taobao: ['经典薯条', '可口可乐'],
    meituan: ['经典薯条'],
    eleme: ['可口可乐'],
};
export type TagStyleType = 'text' | 'image';
export type GroupedTagFieldId = 'p_desc_tags' | 'p_order_tags' | 'p_stat_tags';
export type GroupedTagOption = {
    id: string;
    name: string;
    styleType?: TagStyleType;
    backgroundColor?: string;
    textColor?: string;
    source?: 'brand' | 'store';
};
export type GroupedTagGroup = {
    id: string;
    name: string;
    options: GroupedTagOption[];
    source?: 'brand' | 'store';
};
export type BadgeOptionConfig = {
    id: string;
    name: string;
    badgeType: TagStyleType;
    backgroundColor: string;
    startDate: string;
    endDate: string;
    source?: 'brand' | 'store';
};
type ColorPickerTarget = 'background' | 'text';
type CreatableSelectFieldId =
    | 'p_front_cat'
    | 'p_back_cat'
    | 'p_stat_tags'
    | 'p_desc_tags'
    | 'p_order_tags'
    | 'p_badge';
type QuickCreateOptionModalState = {
    fieldId: CreatableSelectFieldId;
    mode: 'category_group' | 'category_item' | 'tag_group' | 'tag_item' | 'badge';
    title: string;
    helperText: string;
    placeholder: string;
    confirmText: string;
    maxLength: number;
    level?: 1 | 2;
    parentId?: string;
    parentName?: string;
};
type InventoryMode = 'unlimited' | 'custom';
type SpecConfigModuleKey = 'price' | 'identity' | 'inventory' | 'info' | 'packaging';
type SpecHeaderHelpKey = 'basePrice' | 'estimatedCost' | 'marketPrice' | 'specLargeImage';
type SpecBulkEditorKey =
    | 's_spec_price'
    | 's_spec_cost'
    | 's_spec_market'
    | 's_spec_barcode'
    | 's_spec_mark'
    | 's_spec_sku_code'
    | 's_spec_code'
    | 'inventory_mode'
    | 'stock'
    | 'plan_stock_toggle'
    | 'daily_plan_stock'
    | 's_spec_alias'
    | 'amount'
    | 's_spec_store_pack_fee'
    | 's_spec_store_pack_mark'
    | 's_spec_take_pack_fee'
    | 's_spec_take_pack_mark';
type SpecConfigRow = {
    id: string;
    s_spec_name: string;
    s_spec_price: string;
    s_spec_channel_price?: string;
    s_spec_cost: string;
    s_spec_market: string;
    s_spec_barcode: string;
    s_spec_mark: string;
    s_spec_sku_code: string;
    s_spec_alias: string;
    s_spec_amount: string;
    s_spec_amount_unit: string;
    s_spec_inventory_mode: InventoryMode;
    s_spec_initial_stock: string;
    s_spec_max_stock: string;
    s_spec_auto_restock: boolean;
    s_spec_manage_plan_stock: boolean;
    s_spec_daily_plan_stock: string;
    s_spec_warning_stock: string;
    s_spec_sale_status: 'on' | 'off';
    s_spec_channels: ChannelKey[];
    s_spec_store_pack_fee: string;
    s_spec_store_pack_mark: string;
    s_spec_take_pack_fee: string;
    s_spec_take_pack_mark: string;
    s_spec_img: string;
    s_spec_large_img: string;
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
    fixedQuantity: string;
    addonPrice: string;
    addonSpecPrice: string;
    addonStatus: 'on' | 'off';
};
type AddonRuleMode = 'unlimited' | 'range' | 'required';
type AddonScope = 'total' | 'type';
type AddonCountMetric = 'quantity' | 'distinct';
type AddonGroupMode = 'customer' | 'fixed';
type AddonRuleConfig = {
    ruleMode: AddonRuleMode;
    min: string;
    max: string;
    required: string;
    isRequired: boolean;
};
type AddonGroupRule = AddonRuleConfig & {
    mode: AddonGroupMode;
    countMetric: AddonCountMetric;
};
type TemplateTaskRecord = {
    id: string;
    type: TemplateTaskType;
    content: string;
    operator: string;
    status: TemplateTaskStatus;
    result: string;
    createdAt: string;
};
type ComboOptionalItem = {
    id: string;
    productId: string;
    name: string;
    spec: string;
    skuCode: string;
    frontendCategory: string;
    quantity: number;
    surcharge: number;
    isDefault: boolean;
};
type ComboOptionalProductFilters = {
    name: string;
    barcode: string;
    productFlag: string;
    skuCode: string;
    productId: string;
    frontendCategory: string;
};
type ComboGroupCard = {
    id: string;
    type: 'fixed' | 'fixed_multi' | 'optional' | 'free';
    title: string;
    desc: string;
    items?: ComboOptionalItem[];
    requiredOptionCount?: number;
    minTotalQuantity?: number;
    maxTotalQuantity?: number;
    isRequired?: boolean;
    configMode?: 'pick' | 'flexible';
    relativePrice?: boolean;
    saveAsFreeMatch?: boolean;
    remark?: string;
    affectedStoreCount?: number;
};
type ComboOptionalGroupModalState = {
    mode: 'create' | 'edit';
    sourceCardId?: string;
    originalTitle?: string;
    draft: ComboGroupCard;
};
type SpecSelectionMap = Record<string, string[]>;
type PendingChannelSpecValueToggle = {
    value: string;
    nextDisabled: boolean;
    affectedSkuCount: number;
};
type PreviewDisplayPreference = 'expanded' | 'collapsed';
type DisplayTypeOption = { key: string; label: string; desc: string };

const DEFAULT_TEMPLATE_HISTORY_RECORDS: TemplateTaskRecord[] = [
    { id: 'tpl-task-001', type: '添加商品', content: '2个商品,2个模板', operator: '周镇', status: 'completed', result: '成功:4条, 失败:0条', createdAt: '2026-05-26 20:54:44' },
    { id: 'tpl-task-002', type: '添加商品', content: '1个商品,1个模板', operator: '刘', status: 'completed', result: '成功:1条, 失败:0条', createdAt: '2026-05-21 15:18:43' },
    { id: 'tpl-task-003', type: '添加商品', content: '1个商品,1个模板', operator: 'wjgui', status: 'completed', result: '成功:1条, 失败:0条', createdAt: '2026-05-21 14:15:09' },
    { id: 'tpl-task-004', type: '更新商品', content: '1个商品,1个模板', operator: '178', status: 'completed', result: '成功:1条, 失败:0条', createdAt: '2026-05-19 17:54:12' },
];
const DEFAULT_TEMPLATE_OPTIONS: TemplateOption[] = [
    { id: 'template-1', name: '春夏饮品模板', desc: '适用于门店日常新品和活动饮品下发', channels: '小程序堂食 / 外卖 / POS', saleType: '堂食,外卖', group: '品牌通用', type: '品牌模板' },
    { id: 'template-2', name: '门店标准商品模板', desc: '适用于常规商品统一下发和门店复用', channels: '小程序堂食 / POS', saleType: '堂食,外卖', group: '门店基础', type: '通用模板' },
    { id: 'template-3', name: '套餐季节活动模板', desc: '适用于套餐商品季度更新后统一下发', channels: '小程序堂食 / POS / 外卖', saleType: '堂食,外卖', group: '活动模板', type: '套餐模板' },
    { id: 'template-4', name: '新品上架模板 0518-01', desc: '适用于新品标准化上架流程', channels: '小程序 / POS', saleType: '堂食', group: '新品模板', type: '普通模板' },
    { id: 'template-5', name: '外卖爆品模板', desc: '适用于外卖菜单快速复用', channels: '外卖 / POS', saleType: '外卖', group: '外卖专区', type: '普通模板' },
];
const COMBO_OPTIONAL_PRODUCT_LIBRARY: ComboOptionalItem[] = [
    { id: 'combo-item-1', productId: '1293655926072582145', name: '香辣鸡腿堡', spec: '标准规格', skuCode: 'SKU-10001', frontendCategory: '主食', quantity: 1, surcharge: 0, isDefault: true },
    { id: 'combo-item-2', productId: '1293655804269993984', name: '新奥尔良鸡腿堡', spec: '标准规格', skuCode: 'SKU-10002', frontendCategory: '主食', quantity: 1, surcharge: 2, isDefault: false },
    { id: 'combo-item-3', productId: '1293521187567181824', name: '经典牛肉堡', spec: '标准规格', skuCode: 'SKU-10003', frontendCategory: '主食', quantity: 1, surcharge: 4, isDefault: false },
    { id: 'combo-item-4', productId: '1293520168208703488', name: '脆皮鸡翅', spec: '2只', skuCode: 'SKU-10004', frontendCategory: '小吃', quantity: 1, surcharge: 3, isDefault: false },
    { id: 'combo-item-5', productId: '1293572875820875776', name: '藤椒鸡腿堡', spec: '标准规格', skuCode: 'SKU-10005', frontendCategory: '主食', quantity: 1, surcharge: 2, isDefault: false },
    { id: 'combo-item-6', productId: '1293506622283880448', name: '薯条', spec: '中份', skuCode: 'SKU-10006', frontendCategory: '小吃', quantity: 1, surcharge: 0, isDefault: false },
    { id: 'combo-item-7', productId: '1293504293387069440', name: '香辣鸡米花', spec: '小份', skuCode: 'SKU-10007', frontendCategory: '小吃', quantity: 1, surcharge: 1, isDefault: false },
    { id: 'combo-item-8', productId: '1293499835987996672', name: '冰柠可乐', spec: '中杯', skuCode: 'SKU-10008', frontendCategory: '饮品', quantity: 1, surcharge: 0, isDefault: false },
    { id: 'combo-item-9', productId: '1293499835987996672', name: '冰柠可乐', spec: '大杯', skuCode: 'SKU-10009', frontendCategory: '饮品', quantity: 1, surcharge: 2, isDefault: false },
];
const EMPTY_COMBO_OPTIONAL_PRODUCT_FILTERS: ComboOptionalProductFilters = {
    name: '',
    barcode: '',
    productFlag: '',
    skuCode: '',
    productId: '',
    frontendCategory: 'all',
};

const formatDateTime = (date: Date) => {
    const pad = (value: number) => `${value}`.padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeHexColor = (value: string, fallback = '#F2F2F2') => {
    const cleaned = value.trim().replace('#', '');
    if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) return `#${cleaned.toUpperCase()}`;
    if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) return `#${cleaned.split('').map(item => `${item}${item}`).join('').toUpperCase()}`;
    return fallback;
};

const hsvToHex = (h: number, s: number, v: number) => {
    const hue = ((h % 360) + 360) % 360;
    const saturation = clamp(s, 0, 1);
    const value = clamp(v, 0, 1);
    const c = value * saturation;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = value - c;
    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) [r, g, b] = [c, x, 0];
    else if (hue < 120) [r, g, b] = [x, c, 0];
    else if (hue < 180) [r, g, b] = [0, c, x];
    else if (hue < 240) [r, g, b] = [0, x, c];
    else if (hue < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsv = (hex: string) => {
    const normalized = normalizeHexColor(hex);
    const r = parseInt(normalized.slice(1, 3), 16) / 255;
    const g = parseInt(normalized.slice(3, 5), 16) / 255;
    const b = parseInt(normalized.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;

    if (delta !== 0) {
        if (max === r) h = 60 * (((g - b) / delta) % 6);
        else if (max === g) h = 60 * ((b - r) / delta + 2);
        else h = 60 * ((r - g) / delta + 4);
    }

    if (h < 0) h += 360;

    return {
        h,
        s: max === 0 ? 0 : delta / max,
        v: max,
    };
};

const PREP_UNIT_OPTIONS: PrepUnit[] = ['分钟', '小时', '天'];
const SECTION_LABELS: Record<SectionId, string> = {
    basic: '基础信息',
    third_party: '三方渠道属性',
    display: '展示设置',
    spec: '销售属性',
    method: '商品属性',
    settings: '其他属性',
};
const SECTION_ORDER: SectionId[] = ['basic', 'method', 'display', 'spec', 'settings', 'third_party'];
const MASTER_FIELD_IDS = new Set([
    'p_name',
    'p_code',
    'p_front_cat',
    'p_back_cat',
    'p_cat',
    'p_weight_flag',
    'p_unit',
    'p_remark',
    'p_stat_tags',
    'p_img',
    's_specs',
    'm_methods',
    'a_addons',
    'c_groups',
    'o_invoice',
    'o_tax_category',
]);
const UNIFIED_CHANNEL_BASIC_FIELD_IDS = new Set([
    'p_alias',
    'p_display_type',
    'p_tare_weight',
]);
const CHANNEL_HIDDEN_FIELD_IDS = new Set([
    'p_merchant_code',
    'p_remark',
    'p_stat_tags',
    's_cost',
    'o_invoice',
    'o_tax_category',
    'o_recipe_ref',
    'o_nutrition_ref',
]);
const CHANNEL_READONLY_FIELD_IDS = new Set([
    'p_code',
    'p_back_cat',
    'p_cat',
    'p_weight_flag',
    'p_unit',
]);
const CHANNEL_POS_ONLY_FIELD_IDS = new Set(['p_tare_weight']);
const MASTER_SPEC_CHILD_IDS = new Set([
    's_spec_name',
    's_spec_price',
    's_spec_barcode',
    's_spec_mark',
    's_spec_sku_code',
    's_spec_code',
    's_spec_amount',
]);
const CHANNEL_SPEC_HIDDEN_CHILD_IDS = new Set([
    's_spec_barcode',
    's_spec_mark',
    's_spec_sku_code',
    's_spec_code',
]);
const MASTER_METHOD_CHILD_IDS = new Set(['m_method_name', 'm_method_code', 'm_method_remark']);
const MASTER_ADDON_CHILD_IDS = new Set(['a_addon_name', 'a_addon_code']);
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
    { key: 'blind_box', label: '盲盒商品', desc: '开启后，支持设置盲盒商品，建议设置大人向系列且净利润高的商品。' },
    { key: 'display_product', label: '展示商品', desc: '开启后，展示商品在前端只作为展示，不支持直接下单结算。' },
    { key: 'group_meal', label: '团餐商品', desc: '开启后，可用于团餐或统一套餐业务场景。' },
    { key: 'pos_edit_price', label: 'POS 临时改价', desc: '开启后，可用于门店 POS 端临时改价场景。' },
    { key: 'temp_product', label: '是否为临时商品', desc: '开启后，可用于临时菜品或按次上新的商品。' },
    { key: 'market_price_product', label: '是否时价商品', desc: '开启后，可在 POS 端按实时价格售卖。' },
    { key: 'children_meal', label: '是否为儿童餐', desc: '开启后，小程序可按儿童餐场景进行展示。' },
];
const COLLAPSIBLE_BASIC_FIELD_IDS = ['p_display_type', 'p_remark', 'p_stat_tags', 'p_tare_weight'] as const;
const COLLAPSIBLE_SALES_FIELDS = [
    { id: 's_sale_settings', label: '售卖设置' },
    { id: 's_tax_rate', label: '税率' },
    { id: 'p_points_exchange_rule', label: '积分兑换规则' },
    { id: 's_jump_third_mini_program', label: '是否跳转三方小程序' },
    { id: 's_third_mini_program_path', label: '三方小程序页面路径' },
    { id: 's_sales_commission_amount', label: '销售提成金额' },
] as const;
const COLLAPSIBLE_DISPLAY_LIST_FIELDS = [
    { id: 'p_badge', label: '商品角标' },
    { id: 'p_badge_date', label: '角标展示日期' },
] as const;
const COLLAPSIBLE_DISPLAY_DETAIL_FIELDS = [
    { id: 'p_detail_bottom_img', label: '商品详情页底图' },
    { id: 'p_video', label: '商品视频' },
] as const;
const COLLAPSIBLE_OTHER_SECTIONS = [
    { id: 'o_more_settings', label: '更多设置' },
    { id: 'o_base_sales', label: '基础销量' },
    { id: 'o_more_barcodes', label: '更多条码' },
    { id: 'o_product_share', label: '商品分享' },
] as const;
const DISPLAY_MORE_FIELD_MAPPINGS = [
    { id: 'p_badge', label: '商品角标' },
    { id: 'p_badge_date', label: '角标展示日期' },
    { id: 'p_detail_bottom_img', label: '商品详情页底图' },
    { id: 'p_video', label: '商品视频' },
] as const;
const SALES_MORE_FIELD_MAPPINGS = [
    { id: 's_sale_settings', label: '售卖设置' },
    { id: 's_tax_rate', label: '税率' },
    { id: 'p_points_exchange_rule', label: '积分兑换规则' },
    { id: 's_jump_third_mini_program', label: '跳转三方小程序' },
    { id: 's_third_mini_program_path', label: '三方小程序页面路径' },
    { id: 's_sales_commission_amount', label: '销售提成金额' },
] as const;
const OTHER_MORE_FIELD_MAPPINGS = [
    { id: 'o_more_settings', label: '更多设置' },
    { id: 'o_base_sales', label: '基础销量' },
    { id: 'o_more_barcodes', label: '更多条码' },
    { id: 'o_product_share', label: '商品分享' },
] as const;
const DEFAULT_COLLAPSED_FIELD_IDS = Array.from(new Set([
    ...COLLAPSIBLE_BASIC_FIELD_IDS,
    ...DISPLAY_MORE_FIELD_MAPPINGS.map(item => item.id),
    ...SALES_MORE_FIELD_MAPPINGS.map(item => item.id),
    ...OTHER_MORE_FIELD_MAPPINGS.map(item => item.id),
]));
const COMBO_FALLBACK_FIELDS: CategoryFieldConfig[] = [
    { id: 'p_name', isRequired: true },
    { id: 'p_alias', isRequired: false },
    { id: 'p_code', isRequired: false },
    { id: 'p_front_cat', isRequired: true },
    { id: 'p_back_cat', isRequired: true },
    { id: 'p_cat', isRequired: true },
    { id: 'p_unit', isRequired: false },
    { id: 'p_display_type', isRequired: false },
    { id: 'p_remark', isRequired: false },
    { id: 'p_stat_tags', isRequired: false },
    { id: 's_specs', isRequired: false },
    { id: 'm_methods', isRequired: false },
    { id: 'c_groups', isRequired: true },
    { id: 'p_points_exchange_rule', isRequired: false },
    { id: 's_price', isRequired: true },
    { id: 's_cost', isRequired: false },
    { id: 's_market_price', isRequired: false },
    { id: 's_stock', isRequired: true },
    { id: 's_pack_fee', isRequired: false },
    { id: 's_min_purchase_toggle', isRequired: false },
    { id: 's_min_purchase_value', isRequired: false },
    { id: 's_max_purchase_toggle', isRequired: false },
    { id: 's_max_purchase_value', isRequired: false },
    { id: 's_time_sale_toggle', isRequired: false },
    { id: 's_time_sale_rule', isRequired: false },
    { id: 's_sale_mode', isRequired: false },
    { id: 's_sale_settings', isRequired: false },
    { id: 's_takeout_rule', isRequired: false },
    { id: 's_tax_rate', isRequired: false },
    { id: 'p_img', isRequired: false },
    { id: 'p_desc_tags', isRequired: false },
    { id: 'p_list_desc', isRequired: false },
    { id: 'p_badge', isRequired: false },
    { id: 'p_video', isRequired: false },
    { id: 'p_rich_desc', isRequired: false },
    { id: 'st_member', isRequired: false },
    { id: 'o_invoice', isRequired: false },
    { id: 'o_origin', isRequired: false },
    { id: 'o_ingredients', isRequired: false },
];
const WEIGHT_UNIT_OPTIONS = ['克', '千克', '斤', '两'] as const;
const DEFAULT_FRONT_CATEGORY_TREE: CategoryTreeNode[] = [
    {
        id: 'front-cat-1',
        name: '热销推荐',
        children: [
            { id: 'front-cat-1-1', name: '招牌热销' },
            { id: 'front-cat-1-2', name: '门店爆款' },
        ],
    },
    {
        id: 'front-cat-2',
        name: '奶茶系列',
        children: [
            { id: 'front-cat-2-1', name: '经典奶茶' },
            { id: 'front-cat-2-2', name: '轻乳茶' },
        ],
    },
    {
        id: 'front-cat-3',
        name: '咖啡系列',
        children: [
            { id: 'front-cat-3-1', name: '拿铁咖啡' },
            { id: 'front-cat-3-2', name: '美式咖啡' },
        ],
    },
    {
        id: 'front-cat-4',
        name: '果茶系列',
        children: [
            { id: 'front-cat-4-1', name: '鲜果茶' },
            { id: 'front-cat-4-2', name: '气泡果茶' },
        ],
    },
];
const DEFAULT_BACK_CATEGORY_TREE: CategoryTreeNode[] = [
    {
        id: 'back-cat-1',
        name: '常规商品',
        children: [
            { id: 'back-cat-1-1', name: '门店常规款' },
            { id: 'back-cat-1-2', name: '长期售卖款' },
        ],
    },
    {
        id: 'back-cat-2',
        name: '新品商品',
        children: [
            { id: 'back-cat-2-1', name: '本月新品' },
            { id: 'back-cat-2-2', name: '测试上新' },
        ],
    },
    {
        id: 'back-cat-3',
        name: '活动商品',
        children: [
            { id: 'back-cat-3-1', name: '营销活动款' },
            { id: 'back-cat-3-2', name: '限时促销款' },
        ],
    },
    {
        id: 'back-cat-4',
        name: '原料商品',
        children: [
            { id: 'back-cat-4-1', name: '包材耗材' },
            { id: 'back-cat-4-2', name: '原料辅料' },
        ],
    },
];
const TAG_BACKGROUND_COLOR_OPTIONS = ['#EEF2FF', '#ECFDF3', '#FEF3C7', '#FCE7F3', '#E0F2FE'];
const TAG_TEXT_COLOR_OPTIONS = ['#4338CA', '#047857', '#B45309', '#BE185D', '#0369A1'];
export const DEFAULT_GROUPED_TAG_OPTIONS: Record<GroupedTagFieldId, GroupedTagGroup[]> = {
    p_desc_tags: [
        {
            id: 'desc-group-1',
            name: '0910',
            source: 'brand',
            options: [
                { id: 'desc-1', name: '0910图片1', styleType: 'image', backgroundColor: '#EEF2FF', textColor: '#4338CA', source: 'brand' },
                { id: 'desc-2', name: '0910文字', styleType: 'text', backgroundColor: '#ECFDF3', textColor: '#047857', source: 'brand' },
            ],
        },
        {
            id: 'desc-group-2',
            name: '口味描述',
            source: 'store',
            options: [
                { id: 'desc-3', name: '店长推荐', styleType: 'text', backgroundColor: '#FEF3C7', textColor: '#B45309', source: 'store' },
                { id: 'desc-4', name: '无糖低脂', styleType: 'text', backgroundColor: '#E0F2FE', textColor: '#0369A1', source: 'store' },
            ],
        },
    ],
    p_order_tags: [
        {
            id: 'order-group-1',
            name: '热销推荐',
            source: 'brand',
            options: [
                { id: 'order-1', name: '门店推荐', styleType: 'text', backgroundColor: '#ECFDF3', textColor: '#047857', source: 'brand' },
                { id: 'order-2', name: '新品尝鲜', styleType: 'image', backgroundColor: '#EEF2FF', textColor: '#4338CA', source: 'brand' },
            ],
        },
        {
            id: 'order-group-2',
            name: '营销活动',
            source: 'store',
            options: [
                { id: 'order-3', name: '本周爆款', styleType: 'text', backgroundColor: '#FCE7F3', textColor: '#BE185D', source: 'store' },
            ],
        },
    ],
    p_stat_tags: [
        {
            id: 'stat-group-1',
            name: '销量统计',
            source: 'brand',
            options: [
                { id: 'stat-1', name: '销量统计', source: 'brand' },
                { id: 'stat-2', name: '活动统计', source: 'brand' },
            ],
        },
        {
            id: 'stat-group-2',
            name: '经营分析',
            source: 'store',
            options: [
                { id: 'stat-3', name: '成本统计', source: 'store' },
                { id: 'stat-4', name: '渠道统计', source: 'store' },
            ],
        },
    ],
};
export const DEFAULT_BADGE_OPTIONS: BadgeOptionConfig[] = [
    { id: 'badge-1', name: '新品', badgeType: 'text', backgroundColor: '#ECFDF3', startDate: '2026-05-01', endDate: '2026-06-30', source: 'brand' },
    { id: 'badge-2', name: '招牌', badgeType: 'text', backgroundColor: '#FEF3C7', startDate: '2026-05-01', endDate: '2026-12-31', source: 'brand' },
    { id: 'badge-3', name: '限时', badgeType: 'image', backgroundColor: '#FCE7F3', startDate: '2026-05-20', endDate: '2026-06-20', source: 'store' },
];
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
            { id: 'addon-item-1', name: '西米', code: '1210585227812483072', price: '2', defaultLimit: '3', status: 'on' as const },
            { id: 'addon-item-2', name: '芒果粒', code: '1210585270384668672', price: '3', defaultLimit: '2', status: 'on' as const },
            { id: 'addon-item-5', name: '红柚粒', code: '1210585270384668675', price: '3', defaultLimit: '2', status: 'on' as const },
            { id: 'addon-item-6', name: '椰奶冻', code: '1210585270384668676', price: '2', defaultLimit: '3', status: 'on' as const },
            { id: 'addon-item-7', name: '脆波波', code: '1210585270384668677', price: '2', defaultLimit: '3', status: 'on' as const },
        ],
    },
    {
        id: 'addon-group-2',
        name: '蛋糕夹心',
        items: [
            { id: 'addon-item-3', name: '草莓夹心', code: '1210585270384668673', price: '6', defaultLimit: '2', status: 'on' as const },
            { id: 'addon-item-4', name: '芒果夹心', code: '1210585270384668674', price: '8', defaultLimit: '2', status: 'off' as const },
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
const SPEC_CONFIG_MODULES: Array<{
    key: SpecConfigModuleKey;
    label: string;
    desc: string;
}> = [
    { key: 'price', label: '价格设置', desc: '设置基础价格、市场价和预估成本。' },
    { key: 'identity', label: '标识设置', desc: '配置商品标识、规格码和条码信息。' },
    { key: 'inventory', label: '库存设置', desc: '管理不限库存、自定义库存和计划库存。' },
    { key: 'info', label: '规格信息', desc: '补充规格图片、规格大图、别名和商品份量。' },
    { key: 'packaging', label: '包装费设置', desc: '配置规格包装费与包装标识。' },
];

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
    s_spec_alias: '',
    s_spec_amount: '',
    s_spec_amount_unit: '份',
    s_spec_inventory_mode: 'unlimited',
    s_spec_initial_stock: '',
    s_spec_max_stock: '',
    s_spec_auto_restock: false,
    s_spec_manage_plan_stock: false,
    s_spec_daily_plan_stock: '',
    s_spec_warning_stock: '',
    s_spec_sale_status: 'on',
    s_spec_channels: [],
    s_spec_store_pack_fee: '',
    s_spec_store_pack_mark: '',
    s_spec_take_pack_fee: '',
    s_spec_take_pack_mark: '',
    s_spec_img: '',
    s_spec_large_img: '',
    s_spec_code: '',
});

const createChannelDemoSpecRow = (
    id: string,
    name: string,
    price: string,
    marketPrice: string,
    mark: string,
    skuCode: string,
    productCode: string,
    barcode: string
): SpecConfigRow => ({
    ...createEmptySpecConfigRow(id, name),
    s_spec_price: price,
    s_spec_channel_price: price,
    s_spec_market: marketPrice,
    s_spec_barcode: barcode,
    s_spec_mark: mark,
    s_spec_sku_code: skuCode,
    s_spec_code: productCode,
    s_spec_inventory_mode: 'custom',
    s_spec_initial_stock: '100',
    s_spec_max_stock: '9999',
    s_spec_warning_stock: '10',
    s_spec_store_pack_fee: '1',
    s_spec_store_pack_mark: '蛋糕盒',
    s_spec_take_pack_fee: '2',
    s_spec_take_pack_mark: '配送包装',
});

const deriveSpecSelectionMap = (specNames: string[]): SpecSelectionMap => {
    const nextMap: SpecSelectionMap = {};
    specNames.forEach(specName => {
        const parts = specName.split(' / ').map(item => item.trim()).filter(Boolean);
        SPEC_LIBRARY.forEach(group => {
            const matched = group.values.filter(value => parts.includes(value));
            if (matched.length > 0) {
                nextMap[group.id] = Array.from(new Set([...(nextMap[group.id] || []), ...matched]));
            }
        });
    });
    return nextMap;
};

const buildSpecCombinationNames = (selectionMap: SpecSelectionMap): string[] => {
    const selectedGroups = SPEC_LIBRARY
        .map(group => ({
            ...group,
            selectedValues: (selectionMap[group.id] || []).filter(value => group.values.includes(value as never)),
        }))
        .filter(group => group.selectedValues.length > 0);

    if (selectedGroups.length === 0) return [];

    return selectedGroups.reduce<string[]>((acc, group) => {
        if (acc.length === 0) return [...group.selectedValues];
        return acc.flatMap(prefix => group.selectedValues.map(value => `${prefix} / ${value}`));
    }, []);
};

const isSpecConfigRowEmpty = (row: SpecConfigRow) => ![
    row.s_spec_name,
    row.s_spec_price,
    row.s_spec_cost,
    row.s_spec_market,
    row.s_spec_barcode,
    row.s_spec_mark,
    row.s_spec_sku_code,
    row.s_spec_alias,
    row.s_spec_amount,
    row.s_spec_initial_stock,
    row.s_spec_max_stock,
    row.s_spec_daily_plan_stock,
    row.s_spec_warning_stock,
    row.s_spec_store_pack_fee,
    row.s_spec_store_pack_mark,
    row.s_spec_take_pack_fee,
    row.s_spec_take_pack_mark,
    row.s_spec_img,
    row.s_spec_large_img,
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

const getCommonFieldConfigKey = (type: 'standard' | 'combo', categoryId: string) => `${type}:${categoryId}`;

export const WebProductForm: React.FC<WebProductFormProps> = ({
    type,
    category,
    categories,
    onClose,
    mode = 'create',
    initialProduct = null,
    existingProductCount = 0,
    previewPreferenceKey = 'default-account',
    commonFieldConfigs = {},
    channelEditableFieldIds = ['p_name'],
    onOpenCommonFieldSettings,
    groupedTagOptions: groupedTagOptionsProp,
    badgeOptions: badgeOptionsProp,
    onGroupedTagOptionsChange,
    onBadgeOptionsChange,
    thirdPartyChannelAttributeIds = [],
    formScope = 'store',
    channelContext,
    storeContext,
    onProductSaved,
    onOpenChannelCatalog,
}) => {
    const defaultPreviewPreference: PreviewDisplayPreference = existingProductCount > 10 ? 'collapsed' : 'expanded';
    const isComboProduct = type === 'combo';
    const isMasterForm = formScope === 'master';
    const isChannelForm = formScope === 'channel';
    const isUnifiedForm = formScope === 'unified';
    const isStoreForm = formScope === 'store';
    const isPosChannelProduct = (isChannelForm || isUnifiedForm) && !!channelContext?.channelNames.some(name => (
        name.toUpperCase().includes('POS')
    ));
    const channelRequiresMainImage = (isChannelForm || isUnifiedForm) && (
        channelGroupIncludesMiniProgram(channelContext?.channelIds || [])
        || !!channelContext?.channelNames.some(name => name.includes('小程序'))
    );
    const initialMasterProductName = String(initialProduct?.masterName || channelContext?.masterName || initialProduct?.name || '');
    const [masterProductName, setMasterProductName] = useState(initialMasterProductName);
    const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>(() => initialProduct ? {
        p_name: initialProduct.name || '',
        p_front_cat: initialProduct.category ? [initialProduct.category] : [],
        p_back_cat: '',
        p_img: initialProduct.image || '',
        p_img_gallery: Array.isArray(initialProduct.images)
            ? initialProduct.images
            : (initialProduct.image ? [initialProduct.image] : []),
        p_desc_tags: [],
        p_order_tags: '',
        p_stat_tags: '',
        p_badge: '',
        p_weight_flag: false,
        p_business_type: category.businessType || '',
        p_applicable_people: initialProduct.applicablePeople || '1',
        p_deposit_required: !!initialProduct.depositRequired,
        p_unit: '',
        s_price: isChannelForm || isUnifiedForm ? initialProduct.price || '' : '',
        ...(initialProduct.formData || {}),
    } : {
        p_front_cat: [],
        p_back_cat: '',
        p_img_gallery: [],
        p_desc_tags: [],
        p_order_tags: '',
        p_stat_tags: '',
        p_badge: '',
        p_weight_flag: false,
        p_business_type: category.businessType || '',
        p_applicable_people: '1',
        p_deposit_required: category.businessType === 'buffet_ticket',
        p_unit: '',
    });
    const formContentRef = useRef<HTMLDivElement | null>(null);
    const stickyToolbarRef = useRef<HTMLDivElement | null>(null);
    const specTableScrollRef = useRef<HTMLDivElement | null>(null);
    const specSectionHeaderRefs = useRef<Partial<Record<SpecConfigModuleKey, HTMLTableCellElement | null>>>({});
    const [activeFormSection, setActiveFormSection] = useState<SectionId>('basic');
    const [pageView, setPageView] = useState<PageView>('form');
    const [storeSaveStage, setStoreSaveStage] = useState<StoreSaveStage | null>(null);
    const [selectedStoreChannelIds, setSelectedStoreChannelIds] = useState<string[]>(() => {
        const availableChannelIds = storeContext?.currentChannelIds || [];
        if (storeContext?.activeChannelId && storeContext.activeChannelId !== 'all') {
            return availableChannelIds.includes(storeContext.activeChannelId)
                ? [storeContext.activeChannelId]
                : availableChannelIds.slice(0, 1);
        }
        return availableChannelIds;
    });
    const selectedStoreChannelImpacts = useMemo(() => selectedStoreChannelIds.map(channelId => ({
        channelId,
        label: STORE_CHANNEL_LABELS[channelId] || channelId,
        missingChildren: isComboProduct ? (STORE_COMBO_MISSING_CHILDREN[channelId] || []) : [],
    })), [isComboProduct, selectedStoreChannelIds]);
    const storeMissingChildCount = selectedStoreChannelImpacts.reduce(
        (total, item) => total + item.missingChildren.length,
        0,
    );
    const [currentCategory, setCurrentCategory] = useState(category);
    const isBuffetTicketCategory = currentCategory.businessType === 'buffet_ticket';
    const [prepEnabled, setPrepEnabled] = useState(true);
    const [prepScope, setPrepScope] = useState<PrepScope>('spu');
    const [splitByStockState, setSplitByStockState] = useState(false);
    const [specDisplayMode, setSpecDisplayMode] = useState<'single' | 'multi'>(mode === 'create' ? 'single' : 'multi');
    const [activeSpecConfigModule, setActiveSpecConfigModule] = useState<SpecConfigModuleKey>('price');
    const [activeSpecBulkField, setActiveSpecBulkField] = useState<SpecBulkEditorKey | null>(null);
    const [activeSpecHeaderHelp, setActiveSpecHeaderHelp] = useState<SpecHeaderHelpKey | null>(null);
    const [specBulkDraft, setSpecBulkDraft] = useState<Record<string, string | boolean>>({});
    const [activePreviewField, setActivePreviewField] = useState<PreviewField>('default');
    const [previewPreference, setPreviewPreference] = useState<PreviewDisplayPreference | null>(() => getStoredPreviewPreference(previewPreferenceKey));
    const [showPreviewPreferenceMenu, setShowPreviewPreferenceMenu] = useState(false);
    const [showCategoryPickerModal, setShowCategoryPickerModal] = useState(false);
    const [expandedMoreFields, setExpandedMoreFields] = useState<string[]>([]);
    const [expandedComboAdvancedFields, setExpandedComboAdvancedFields] = useState<string[]>([]);
    const [comboAdvancedExpandedAll, setComboAdvancedExpandedAll] = useState(false);
    const [activeCreatableSelect, setActiveCreatableSelect] = useState<CreatableSelectFieldId | null>(null);
    const [frontCategoryTree, setFrontCategoryTree] = useState<CategoryTreeNode[]>(DEFAULT_FRONT_CATEGORY_TREE);
    const [backCategoryTree, setBackCategoryTree] = useState<CategoryTreeNode[]>(DEFAULT_BACK_CATEGORY_TREE);
    const [categoryPanelParentIds, setCategoryPanelParentIds] = useState<Record<'p_front_cat' | 'p_back_cat', string | null>>({
        p_front_cat: DEFAULT_FRONT_CATEGORY_TREE[0]?.id || null,
        p_back_cat: DEFAULT_BACK_CATEGORY_TREE[0]?.id || null,
    });
    const [groupedTagOptions, setGroupedTagOptions] = useState<Record<GroupedTagFieldId, GroupedTagGroup[]>>(
        groupedTagOptionsProp || DEFAULT_GROUPED_TAG_OPTIONS
    );
    const [activeGroupedTagIds, setActiveGroupedTagIds] = useState<Record<GroupedTagFieldId, string | null>>({
        p_desc_tags: DEFAULT_GROUPED_TAG_OPTIONS.p_desc_tags[0]?.id || null,
        p_order_tags: DEFAULT_GROUPED_TAG_OPTIONS.p_order_tags[0]?.id || null,
        p_stat_tags: DEFAULT_GROUPED_TAG_OPTIONS.p_stat_tags[0]?.id || null,
    });
    const [badgeOptions, setBadgeOptions] = useState<BadgeOptionConfig[]>(badgeOptionsProp || DEFAULT_BADGE_OPTIONS);
    const [quickCreateOptionModal, setQuickCreateOptionModal] = useState<QuickCreateOptionModalState | null>(null);
    const [quickCreateOptionDraft, setQuickCreateOptionDraft] = useState('');
    const [quickCreateStyleType, setQuickCreateStyleType] = useState<TagStyleType>('text');
    const [quickCreateBackgroundColor, setQuickCreateBackgroundColor] = useState(TAG_BACKGROUND_COLOR_OPTIONS[0]);
    const [quickCreateTextColor, setQuickCreateTextColor] = useState(TAG_TEXT_COLOR_OPTIONS[0]);
    const [quickCreateStartDate, setQuickCreateStartDate] = useState('2026-05-27');
    const [quickCreateEndDate, setQuickCreateEndDate] = useState('2026-06-27');
    const [activeColorPickerTarget, setActiveColorPickerTarget] = useState<ColorPickerTarget | null>(null);
    const [colorPickerHue, setColorPickerHue] = useState(0);
    const [colorPickerSaturation, setColorPickerSaturation] = useState(0);
    const [colorPickerValue, setColorPickerValue] = useState(0.95);
    const [colorPickerHexInput, setColorPickerHexInput] = useState('#F2F2F2');
    const [showMethodPickerModal, setShowMethodPickerModal] = useState(false);
    const [showAddonPickerModal, setShowAddonPickerModal] = useState(false);
    const [showSpecPickerModal, setShowSpecPickerModal] = useState(false);
    const [disabledChannelSpecValues, setDisabledChannelSpecValues] = useState<string[]>(['12寸']);
    const [draftDisabledChannelSpecValues, setDraftDisabledChannelSpecValues] = useState<string[]>([]);
    const [showChannelSpecValueModal, setShowChannelSpecValueModal] = useState(false);
    const [pendingChannelSpecValueToggle, setPendingChannelSpecValueToggle] = useState<PendingChannelSpecValueToggle | null>(null);
    const [activeSpecGroupId, setActiveSpecGroupId] = useState<string>(SPEC_LIBRARY[0].id);
    const [selectedSpecValuesByGroup, setSelectedSpecValuesByGroup] = useState<SpecSelectionMap>(() => (
        mode === 'create' ? {} : deriveSpecSelectionMap(['8寸', '10寸', '12寸'])
    ));
    const [tempSpecSelections, setTempSpecSelections] = useState<SpecSelectionMap>({});
    const [activeMethodGroupId, setActiveMethodGroupId] = useState<string>(METHOD_LIBRARY[0].id);
    const [activeAddonGroupId, setActiveAddonGroupId] = useState<string>(ADDON_LIBRARY[0].id);
    const [tempMethodSelections, setTempMethodSelections] = useState<string[]>([]);
    const [tempAddonSelections, setTempAddonSelections] = useState<string[]>([]);
    const [addonScope, setAddonScope] = useState<AddonScope>('type');
    const [addonTotalRule, setAddonTotalRule] = useState<AddonRuleConfig>({
        ruleMode: 'unlimited',
        min: '0',
        max: '10',
        required: '1',
        isRequired: false,
    });
    const [addonGroupRules, setAddonGroupRules] = useState<Record<string, AddonGroupRule>>({});
    const [comboGroupCards, setComboGroupCards] = useState<ComboGroupCard[]>(() => (
        mode === 'create'
            ? []
            : [
                { id: 'combo-fixed-1', type: 'fixed', title: '固定搭配', desc: '已添加 2 个固定商品' },
                {
                    id: 'combo-optional-1',
                    type: 'optional',
                    title: '主食任选',
                    desc: '按种类选择 · 3 选 1',
                    items: COMBO_OPTIONAL_PRODUCT_LIBRARY.slice(0, 3),
                    requiredOptionCount: 1,
                    minTotalQuantity: 1,
                    maxTotalQuantity: 2,
                    isRequired: true,
                    configMode: 'pick',
                    relativePrice: false,
                    saveAsFreeMatch: false,
                    remark: '套餐主食选择',
                    affectedStoreCount: 18,
                },
            ]
    ));
    const [comboOptionalGroupModal, setComboOptionalGroupModal] = useState<ComboOptionalGroupModalState | null>(null);
    const [confirmingComboOptionalSave, setConfirmingComboOptionalSave] = useState(false);
    const [comboOptionalProductPickerOpen, setComboOptionalProductPickerOpen] = useState(false);
    const [comboOptionalProductPickerDraftIds, setComboOptionalProductPickerDraftIds] = useState<string[]>([]);
    const [comboOptionalProductDraftFilters, setComboOptionalProductDraftFilters] = useState<ComboOptionalProductFilters>({ ...EMPTY_COMBO_OPTIONAL_PRODUCT_FILTERS });
    const [comboOptionalProductFilters, setComboOptionalProductFilters] = useState<ComboOptionalProductFilters>({ ...EMPTY_COMBO_OPTIONAL_PRODUCT_FILTERS });
    const [comboOptionalProductPage, setComboOptionalProductPage] = useState(1);
    const [comboOptionalBatchFilterOpen, setComboOptionalBatchFilterOpen] = useState(false);
    const [comboOptionalBatchFilterInput, setComboOptionalBatchFilterInput] = useState('');
    const [comboOptionalBatchProductIds, setComboOptionalBatchProductIds] = useState<string[]>([]);
    const [comboOptionalBatchFilterError, setComboOptionalBatchFilterError] = useState('');
    const [attrGroupSortEnabled, setAttrGroupSortEnabled] = useState(false);
    const [attrPanelOrder, setAttrPanelOrder] = useState<string[]>(() => (
        mode === 'create'
            ? ['spec']
            : ['spec', 'addon:小料', 'method:温度哎', 'method:自建做法组']
    ));
    const [attrDefaultSelections, setAttrDefaultSelections] = useState<Record<string, string | string[]>>(() => (
        mode === 'create'
            ? { spec: '标准规格' }
            : {
                spec: '8寸',
                'method:温度哎': '热',
                'method:自建做法组': '做法1',
                'addon:小料': ['西米', '芒果粒'],
            }
    ));
    const [draggingAttrPanelId, setDraggingAttrPanelId] = useState<string | null>(null);
    const [draggingAttrItem, setDraggingAttrItem] = useState<{ groupId: string; item: string } | null>(null);
    const [showAttrSortTip, setShowAttrSortTip] = useState(false);
    const [draggingProductImageIndex, setDraggingProductImageIndex] = useState<number | null>(null);
    const effectivePreviewPreference = previewPreference ?? defaultPreviewPreference;
    const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(effectivePreviewPreference === 'expanded');
    const compactFormMode = !isPreviewPanelOpen;
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
            : formScope === 'channel'
                ? [
                    createChannelDemoSpecRow('spec-1', '8寸 / 原味', '128', '148', '经典款', 'SKU-08-O', 'CAKE-08-O', '690000000801'),
                    createChannelDemoSpecRow('spec-2', '8寸 / 巧克力', '138', '158', '巧克力款', 'SKU-08-C', 'CAKE-08-C', '690000000802'),
                    createChannelDemoSpecRow('spec-3', '10寸 / 原味', '168', '188', '热销', 'SKU-10-O', 'CAKE-10-O', '690000000803'),
                    createChannelDemoSpecRow('spec-4', '10寸 / 巧克力', '178', '198', '聚会款', 'SKU-10-C', 'CAKE-10-C', '690000000804'),
                    createChannelDemoSpecRow('spec-5', '12寸 / 原味', '228', '258', '大份', 'SKU-12-O', 'CAKE-12-O', '690000000805'),
                    createChannelDemoSpecRow('spec-6', '12寸 / 巧克力', '238', '268', '大份巧克力', 'SKU-12-C', 'CAKE-12-C', '690000000806'),
                ]
            : [
                { id: 'spec-1', s_spec_name: '8寸', s_spec_price: '128', s_spec_cost: '76', s_spec_market: '148', s_spec_barcode: '690000000801', s_spec_mark: '经典款', s_spec_sku_code: 'SKU-08', s_spec_alias: '经典八寸', s_spec_amount: '1.00', s_spec_amount_unit: '克', s_spec_inventory_mode: 'custom', s_spec_initial_stock: '200', s_spec_max_stock: '9999', s_spec_auto_restock: true, s_spec_manage_plan_stock: true, s_spec_daily_plan_stock: '80', s_spec_warning_stock: '20', s_spec_sale_status: 'on', s_spec_channels: ['mini_dine', 'mini_take', 'pos'], s_spec_store_pack_fee: '1', s_spec_store_pack_mark: '蛋糕盒', s_spec_take_pack_fee: '2', s_spec_take_pack_mark: '保温袋', s_spec_img: '已上传', s_spec_large_img: '已上传', s_spec_code: 'CAKE-08' },
                { id: 'spec-2', s_spec_name: '10寸', s_spec_price: '168', s_spec_cost: '98', s_spec_market: '188', s_spec_barcode: '690000000802', s_spec_mark: '热销', s_spec_sku_code: 'SKU-10', s_spec_alias: '热销十寸', s_spec_amount: '1.50', s_spec_amount_unit: '克', s_spec_inventory_mode: 'custom', s_spec_initial_stock: '120', s_spec_max_stock: '9999', s_spec_auto_restock: false, s_spec_manage_plan_stock: false, s_spec_daily_plan_stock: '', s_spec_warning_stock: '15', s_spec_sale_status: 'on', s_spec_channels: ['mini_dine', 'meituan'], s_spec_store_pack_fee: '1', s_spec_store_pack_mark: '礼盒装', s_spec_take_pack_fee: '3', s_spec_take_pack_mark: '配送包装', s_spec_img: '', s_spec_large_img: '', s_spec_code: 'CAKE-10' },
                { id: 'spec-3', s_spec_name: '12寸', s_spec_price: '228', s_spec_cost: '132', s_spec_market: '258', s_spec_barcode: '690000000803', s_spec_mark: '大份', s_spec_sku_code: 'SKU-12', s_spec_alias: '聚会十二寸', s_spec_amount: '2.00', s_spec_amount_unit: '克', s_spec_inventory_mode: 'unlimited', s_spec_initial_stock: '0', s_spec_max_stock: '9999', s_spec_auto_restock: false, s_spec_manage_plan_stock: false, s_spec_daily_plan_stock: '', s_spec_warning_stock: '0', s_spec_sale_status: 'off', s_spec_channels: ['mini_take'], s_spec_store_pack_fee: '2', s_spec_store_pack_mark: '生日套装', s_spec_take_pack_fee: '4', s_spec_take_pack_mark: '加固包装', s_spec_img: '', s_spec_large_img: '', s_spec_code: 'CAKE-12' },
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
                { id: 'addon-1', groupName: '小料', addonName: '西米', addonCode: '1210585227812483072', addonLimit: '3', fixedQuantity: '1', addonPrice: '2', addonSpecPrice: '', addonStatus: 'on' },
                { id: 'addon-2', groupName: '小料', addonName: '芒果粒', addonCode: '1210585270384668672', addonLimit: '2', fixedQuantity: '1', addonPrice: '3', addonSpecPrice: '', addonStatus: 'on' },
            ]
    ));
    const getStickyOffset = () => {
        const stickyHeight = stickyToolbarRef.current?.offsetHeight ?? 0;
        return stickyHeight + 16;
    };

    const scrollToSection = (id: SectionId) => {
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
        const anchorId = getValidationAnchorId(itemKey);
        if (typeof document !== 'undefined' && document.getElementById(anchorId)) return anchorId;
        return getValidationModuleTargetId(itemKey);
    };

    const currentFieldConfigs = useMemo(() => {
        const rawConfigs = isComboProduct ? currentCategory.comboFields : currentCategory.standardFields;
        const sourceConfigs = isComboProduct && rawConfigs.length === 0 ? COMBO_FALLBACK_FIELDS : rawConfigs;
        const configMap = new Map<string, CategoryFieldConfig>();
        sourceConfigs.forEach(config => {
            if (isComboProduct && config.id === 'a_addons') return;
            configMap.set(config.id, config);
        });
        if (isComboProduct) {
            COMBO_FALLBACK_FIELDS.forEach(config => {
                if (!configMap.has(config.id)) {
                    configMap.set(config.id, config);
                }
            });
        }
        const scopeFieldIds = isMasterForm
            ? Array.from(MASTER_FIELD_IDS)
            : isChannelForm
            ? Array.from(CHANNEL_READONLY_FIELD_IDS)
            : [];
        scopeFieldIds.forEach(fieldId => {
            if (!configMap.has(fieldId) && AVAILABLE_DYNAMIC_FIELDS.some(field => field.id === fieldId)) {
                configMap.set(fieldId, { id: fieldId, isRequired: false, displayMode: 'visible' });
            }
        });
        return Array.from(configMap.values());
    }, [currentCategory, isChannelForm, isComboProduct, isMasterForm]);
    const currentCategoryFieldIds = useMemo(() => currentFieldConfigs.map(field => field.id), [currentFieldConfigs]);
    const currentCategoryFieldIdSet = useMemo(() => new Set(currentCategoryFieldIds), [currentCategoryFieldIds]);
    const currentFieldConfigMap = useMemo(() => new Map(currentFieldConfigs.map(field => [field.id, field])), [currentFieldConfigs]);
    const commonFieldConfigKey = getCommonFieldConfigKey(type, currentCategory.id);
    const commonFieldConfigList = useMemo(() => (commonFieldConfigs[commonFieldConfigKey] || []).filter(item => currentCategoryFieldIdSet.has(item.id)), [commonFieldConfigKey, commonFieldConfigs, currentCategoryFieldIdSet]);
    const resolvedCommonFieldConfigList = useMemo(() => {
        const scopeVisibleIds = isMasterForm
            ? Array.from(MASTER_FIELD_IDS).filter(id => currentCategoryFieldIdSet.has(id))
            : isChannelForm
            ? Array.from(CHANNEL_READONLY_FIELD_IDS).filter(id => currentCategoryFieldIdSet.has(id))
            : [];
        const requiredIds = currentFieldConfigs
            .filter(field => field.isRequired || AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === field.id)?.isRequired)
            .map(field => field.id);
        if (commonFieldConfigList.length > 0) {
            const configuredIdSet = new Set(commonFieldConfigList.map(item => item.id));
            const childModuleFallbackIds = Object.keys(COMMON_FIELD_CHILD_CONFIG_LIBRARY).filter(id => (
                currentCategoryFieldIdSet.has(id)
                && !configuredIdSet.has(id)
                && !requiredIds.includes(id)
            ));
            return Array.from(new Map(
                [
                    ...commonFieldConfigList,
                    ...childModuleFallbackIds.map(id => ({
                        ...(currentFieldConfigMap.get(id) || { id, isRequired: false }),
                        displayMode: currentFieldConfigMap.get(id)?.displayMode ?? 'visible' as const,
                    })),
                    ...requiredIds.map(id => ({
                        ...(currentFieldConfigMap.get(id) || { id, isRequired: true }),
                        displayMode: 'visible' as const,
                    })),
                    ...scopeVisibleIds.map(id => ({
                        ...(currentFieldConfigMap.get(id) || { id, isRequired: false }),
                        displayMode: 'visible' as const,
                    })),
                ]
                    .map(item => [
                        item.id,
                        {
                            ...item,
                            displayMode: requiredIds.includes(item.id) ? 'visible' : (item.displayMode ?? 'visible'),
                        },
                    ])
            ).values());
        }

        const fallbackVisibleIds = Array.from(new Set([
            ...currentCategoryFieldIds.slice(0, Math.min(8, currentCategoryFieldIds.length)),
            ...requiredIds,
            ...scopeVisibleIds,
        ]));
        const fallbackVisibleIdSet = new Set(fallbackVisibleIds);
        const fallbackCollapsedIds = DEFAULT_COLLAPSED_FIELD_IDS.filter(id => (
            currentCategoryFieldIdSet.has(id) && !fallbackVisibleIdSet.has(id)
        ));

        return [
            ...fallbackVisibleIds.map(id => ({
                ...(currentFieldConfigMap.get(id) || { id, isRequired: requiredIds.includes(id) }),
                displayMode: 'visible' as const,
            })),
            ...fallbackCollapsedIds.map(id => ({
                ...(currentFieldConfigMap.get(id) || { id, isRequired: false }),
                displayMode: 'collapsed' as const,
            })),
        ];
    }, [commonFieldConfigList, currentCategoryFieldIdSet, currentCategoryFieldIds, currentFieldConfigMap, currentFieldConfigs, isChannelForm, isMasterForm]);
    const resolvedCommonFieldConfigMap = useMemo(() => new Map(resolvedCommonFieldConfigList.map(item => [item.id, item])), [resolvedCommonFieldConfigList]);
    const configuredCommonFieldIds = useMemo(
        () => resolvedCommonFieldConfigList.filter(item => (item.displayMode ?? 'visible') !== 'hidden').map(item => item.id),
        [resolvedCommonFieldConfigList]
    );
    const commonFieldIdSet = useMemo(
        () => new Set(resolvedCommonFieldConfigList.filter(item => (item.displayMode ?? 'visible') === 'visible').map(item => item.id)),
        [resolvedCommonFieldConfigList]
    );
    const collapsedCommonFieldIdSet = useMemo(
        () => new Set(resolvedCommonFieldConfigList.filter(item => item.displayMode === 'collapsed').map(item => item.id)),
        [resolvedCommonFieldConfigList]
    );
    const visibleFieldIds = useMemo(() => {
        const fieldIds = new Set(configuredCommonFieldIds.filter(fieldId => {
            if (isMasterForm) return MASTER_FIELD_IDS.has(fieldId);
            if (isChannelForm) {
                if (CHANNEL_HIDDEN_FIELD_IDS.has(fieldId)) return false;
                if (CHANNEL_POS_ONLY_FIELD_IDS.has(fieldId) && !isPosChannelProduct) return false;
            }
            return true;
        }));
        if (channelRequiresMainImage) fieldIds.add('p_img');
        return fieldIds;
    }, [channelRequiresMainImage, configuredCommonFieldIds, isChannelForm, isMasterForm, isPosChannelProduct]);
    const moreFieldMappings = useMemo(() => ([
        ...COLLAPSIBLE_BASIC_FIELD_IDS.map(id => {
            const field = AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === id);
            return field ? { id, label: field.label } : null;
        }).filter((item): item is { id: string; label: string } => !!item),
        ...DISPLAY_MORE_FIELD_MAPPINGS,
        ...SALES_MORE_FIELD_MAPPINGS,
        ...OTHER_MORE_FIELD_MAPPINGS,
        { id: 's_specs', label: '规格信息' },
        { id: 'm_methods', label: '做法' },
        { id: 'a_addons', label: '加料' },
    ].filter(item => collapsedCommonFieldIdSet.has(item.id))), [collapsedCommonFieldIdSet]);
    const expandedMoreFieldSet = useMemo(() => new Set(expandedMoreFields), [expandedMoreFields]);
    const isCommonFieldEnabled = (fieldId: string) => visibleFieldIds.has(fieldId) && commonFieldIdSet.has(fieldId);
    const isMoreFieldEnabled = (fieldId: string) => visibleFieldIds.has(fieldId) && collapsedCommonFieldIdSet.has(fieldId) && expandedMoreFieldSet.has(fieldId);
    const isFieldRendered = (fieldId: string) => isCommonFieldEnabled(fieldId) || isMoreFieldEnabled(fieldId);
    const expandedBasicFields = useMemo(
        () => COLLAPSIBLE_BASIC_FIELD_IDS.filter(id => expandedMoreFieldSet.has(id)),
        [expandedMoreFieldSet]
    );
    const expandedSalesFields = useMemo(
        () => SALES_MORE_FIELD_MAPPINGS.map(item => item.id).filter(id => expandedMoreFieldSet.has(id)),
        [expandedMoreFieldSet]
    );
    const expandedOtherSections = useMemo(
        () => OTHER_MORE_FIELD_MAPPINGS.map(item => item.id).filter(id => expandedMoreFieldSet.has(id)),
        [expandedMoreFieldSet]
    );
    const expandedDisplayListFields = useMemo(
        () => DISPLAY_MORE_FIELD_MAPPINGS.filter(item => ['p_badge', 'p_badge_date'].includes(item.id)).map(item => item.id).filter(id => expandedMoreFieldSet.has(id)),
        [expandedMoreFieldSet]
    );
    const expandedDisplayDetailFields = useMemo(
        () => DISPLAY_MORE_FIELD_MAPPINGS.filter(item => ['p_detail_bottom_img', 'p_video'].includes(item.id)).map(item => item.id).filter(id => expandedMoreFieldSet.has(id)),
        [expandedMoreFieldSet]
    );
    const basicCollapsedFieldMappings = useMemo(
        () => COLLAPSIBLE_BASIC_FIELD_IDS
            .map(id => {
                const field = AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === id);
                return field
                    && collapsedCommonFieldIdSet.has(id)
                    && (!isUnifiedForm || MASTER_FIELD_IDS.has(id))
                    ? { id, label: field.label }
                    : null;
            })
            .filter((item): item is { id: string; label: string } => !!item),
        [collapsedCommonFieldIdSet, isUnifiedForm]
    );
    const unifiedChannelBasicCollapsedFieldMappings = useMemo(
        () => COLLAPSIBLE_BASIC_FIELD_IDS
            .map(id => {
                const field = AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === id);
                return field
                    && isUnifiedForm
                    && UNIFIED_CHANNEL_BASIC_FIELD_IDS.has(id)
                    && collapsedCommonFieldIdSet.has(id)
                    ? { id, label: field.label }
                    : null;
            })
            .filter((item): item is { id: string; label: string } => !!item),
        [collapsedCommonFieldIdSet, isUnifiedForm]
    );
    const displayCollapsedFieldMappings = useMemo(
        () => DISPLAY_MORE_FIELD_MAPPINGS.filter(item => collapsedCommonFieldIdSet.has(item.id)),
        [collapsedCommonFieldIdSet]
    );
    const salesCollapsedFieldMappings = useMemo(
        () => SALES_MORE_FIELD_MAPPINGS.filter(item => collapsedCommonFieldIdSet.has(item.id)),
        [collapsedCommonFieldIdSet]
    );
    const otherCollapsedFieldMappings = useMemo(
        () => OTHER_MORE_FIELD_MAPPINGS.filter(item => collapsedCommonFieldIdSet.has(item.id)),
        [collapsedCommonFieldIdSet]
    );
    const collapsedAttrModuleMappings = useMemo(
        () => [
            { id: 'm_methods', label: '做法' },
            { id: 'a_addons', label: '加料' },
        ].filter(item => collapsedCommonFieldIdSet.has(item.id) && currentCategoryFieldIdSet.has(item.id)),
        [collapsedCommonFieldIdSet, currentCategoryFieldIdSet]
    );
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

    const getFieldSection = (field: DynamicFieldConfig): SectionId => {
        if (field.id === 'p_img') return isMasterForm || isUnifiedForm ? 'basic' : 'display';
        if (isUnifiedForm && UNIFIED_CHANNEL_BASIC_FIELD_IDS.has(field.id)) return 'display';
        if (field.id === 'p_points_exchange_rule') return 'spec';
        if (field.module === 'base') return 'basic';
        if (field.module === 'display') return 'display';
        if (field.module === 'sales') return 'spec';
        if (field.module === 'product_attr') return 'method';
        return 'settings';
    };

    const getFieldConfig = (fieldId: string) => currentFieldConfigMap.get(fieldId);
    const isFieldEnabled = (fieldId: string) => visibleFieldIds.has(fieldId);
    const isChannelFieldReadonly = (fieldId: string) => (
        isChannelForm
        && (
            CHANNEL_READONLY_FIELD_IDS.has(fieldId)
            || (
                ['p_name', 'p_img'].includes(fieldId)
                && !channelEditableFieldIds.includes(fieldId)
            )
        )
    );
    const isChannelSpecFieldReadonly = (fieldId: string) => (
        isChannelForm
        && fieldId === 's_spec_alias'
    );
    const isChildFieldAllowed = (fieldId: string, childId: string) => {
        if (isMasterForm) {
            if (fieldId === 's_specs') return MASTER_SPEC_CHILD_IDS.has(childId);
            if (fieldId === 'm_methods') return MASTER_METHOD_CHILD_IDS.has(childId);
            if (fieldId === 'a_addons') return MASTER_ADDON_CHILD_IDS.has(childId);
        }
        if (isChannelForm && fieldId === 's_specs') {
            return !CHANNEL_SPEC_HIDDEN_CHILD_IDS.has(childId);
        }
        return true;
    };
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
    const getChildDisplayModes = (fieldId: string, fallbackIds: string[]) => {
        const childTemplates = COMMON_FIELD_CHILD_CONFIG_LIBRARY[fieldId] || [];
        if (childTemplates.length === 0) {
            return fallbackIds.reduce<Record<string, 'visible' | 'collapsed' | 'hidden'>>((acc, id) => {
                acc[id] = 'visible';
                return acc;
            }, {});
        }
        const childConfigs = resolvedCommonFieldConfigMap.get(fieldId)?.childConfigs || getFieldConfig(fieldId)?.childConfigs;
        const childRequiredConfigs = resolveChildRequiredConfigs(
            fieldId,
            currentFieldConfigMap,
            resolvedCommonFieldConfigMap.get(fieldId)?.childRequiredConfigs || getFieldConfig(fieldId)?.childRequiredConfigs
        );
        return childTemplates.reduce<Record<string, 'visible' | 'hidden'>>((acc, child) => {
            if (!isChildFieldAllowed(fieldId, child.id)) {
                acc[child.id] = 'hidden';
                return acc;
            }
            const normalizedMode = normalizeChildDisplayMode(childConfigs?.[child.id], !!(child.isDefaultSelected || child.isSystem));
            acc[child.id] = child.isSystem || !!childRequiredConfigs?.[child.id] ? 'visible' : normalizedMode;
            return acc;
        }, {});
    };
    const getEnabledChildIds = (fieldId: string, fallbackIds: string[]) => {
        const childModes = getChildDisplayModes(fieldId, fallbackIds);
        return fallbackIds.filter(id => childModes[id] !== 'hidden');
    };
    const specChildDisplayModes = useMemo(() => getChildDisplayModes('s_specs', [
        's_spec_name',
        's_spec_price',
        's_spec_market',
        's_spec_cost',
        's_spec_barcode',
        's_spec_mark',
        's_spec_sku_code',
        's_spec_code',
        's_spec_stock',
        's_spec_plan_stock',
        's_spec_img',
        's_spec_large_img',
        's_spec_alias',
        's_spec_amount',
        's_spec_store_pack_fee',
        's_spec_store_pack_mark',
        's_spec_take_pack_fee',
        's_spec_take_pack_mark',
    ]), [currentFieldConfigMap, isChannelForm, isMasterForm, resolvedCommonFieldConfigMap]);
    const methodChildDisplayModes = useMemo(() => getChildDisplayModes('m_methods', [
        'm_method_name',
        'm_method_sync',
        'm_method_markup',
        'm_method_code',
        'm_method_remark',
        'm_method_tip',
    ]), [currentFieldConfigMap, isChannelForm, isMasterForm, resolvedCommonFieldConfigMap]);
    const addonChildDisplayModes = useMemo(() => getChildDisplayModes('a_addons', [
        'a_rule_scope',
        'a_rule_unlimited',
        'a_rule_limit',
        'a_rule_required',
        'a_addon_name',
        'a_addon_code',
        'a_addon_limit',
        'a_addon_price',
        'a_addon_spec_price',
        'a_addon_status',
        'a_empty_tip',
    ]), [currentFieldConfigMap, isChannelForm, isMasterForm, resolvedCommonFieldConfigMap]);
    const specVisibleChildIds = useMemo(
        () => Object.entries(specChildDisplayModes).filter(([, mode]) => mode === 'visible').map(([id]) => id),
        [specChildDisplayModes]
    );
    const methodVisibleChildIds = useMemo(
        () => Object.entries(methodChildDisplayModes).filter(([, mode]) => mode === 'visible').map(([id]) => id),
        [methodChildDisplayModes]
    );
    const addonVisibleChildIds = useMemo(
        () => Object.entries(addonChildDisplayModes).filter(([, mode]) => mode === 'visible').map(([id]) => id),
        [addonChildDisplayModes]
    );
    const renderedSpecChildIds = specVisibleChildIds;
    const renderedMethodChildIds = methodVisibleChildIds;
    const renderedAddonChildIds = addonVisibleChildIds;
    const enabledSpecChildIds = specVisibleChildIds;
    const enabledMethodChildIds = methodVisibleChildIds;
    const enabledAddonChildIds = addonVisibleChildIds;
    const hasSpecModuleEnabled = isFieldRendered('s_specs');
    const hasRenderableSpecFields = enabledSpecChildIds.length > 0;
    const hasMethodModuleEnabled = isFieldRendered('m_methods') && enabledMethodChildIds.length > 0;
    const hasAddonModuleEnabled = isFieldRendered('a_addons') && enabledAddonChildIds.length > 0;

    const isDynamicFieldFilled = (field: DynamicFieldConfig) => {
        const value = dynamicFormData[field.id];
        switch (field.type) {
            case 'input':
            case 'selector':
            case 'textarea':
            case 'rich_text':
            case 'number':
            case 'ref_selector':
                return Array.isArray(value)
                    ? value.length > 0
                    : value !== undefined && value !== null && String(value).trim() !== '';
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
    const productImages = useMemo<string[]>(() => {
        const gallery = Array.isArray(dynamicFormData.p_img_gallery)
            ? dynamicFormData.p_img_gallery.filter((item: unknown): item is string => typeof item === 'string' && item.trim() !== '')
            : [];
        if (gallery.length > 0) return gallery;
        return dynamicFormData.p_img ? [dynamicFormData.p_img] : [];
    }, [dynamicFormData.p_img, dynamicFormData.p_img_gallery]);

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
    const isSpecPriceRequired = useMemo(
        () => !!(currentFieldConfigMap.get('s_price')?.isRequired || AVAILABLE_DYNAMIC_FIELDS.find(field => field.id === 's_price')?.isRequired),
        [currentFieldConfigMap]
    );
    const isSpecStockRequired = useMemo(
        () => !!currentFieldConfigMap.get('s_stock')?.isRequired,
        [currentFieldConfigMap]
    );
    const isSpecPackRequired = useMemo(
        () => !!currentFieldConfigMap.get('s_pack_fee')?.isRequired,
        [currentFieldConfigMap]
    );

    const validationItems = useMemo<ValidationItem[]>(() => {
        const items: ValidationItem[] = [];
        currentFieldConfigs.forEach(config => {
            const field = AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === config.id);
            if (!field || !visibleFieldIds.has(field.id)) return;
            if (field.id === 'p_cat') return;
            if (['s_price', 's_pack_fee', 's_stock', 's_specs'].includes(field.id)) return;
            const required = config.isRequired || !!field.isRequired;
            if (isUnifiedForm && field.id === 'p_name') {
                if (required) {
                    items.push({
                        key: 'master-name',
                        label: '主档商品名称',
                        section: 'basic',
                        filled: masterProductName.trim() !== '',
                        type: 'required',
                    });
                }
                return;
            }
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

        if (hasRenderableSpecFields && enabledSpecChildIds.includes('s_spec_price') && isSpecPriceRequired) {
            items.push({
                key: 'spec-price',
                label: '规格销售价',
                section: 'method',
                filled: isSpecPriceFilled,
                type: 'required',
            });
        }

        if (hasRenderableSpecFields && enabledSpecChildIds.includes('s_spec_stock') && isSpecStockRequired) {
            items.push({
                key: 'spec-stock',
                label: '规格库存',
                section: 'method',
                filled: isSpecStockFilled,
                type: 'required',
            });
        }

        if (
            hasRenderableSpecFields
            && isSpecPackRequired
            && enabledSpecChildIds.some(id => ['s_spec_store_pack_fee', 's_spec_take_pack_fee'].includes(id))
        ) {
            items.push({
                key: 'spec-pack',
                label: '规格包装费',
                section: 'method',
                filled: isSpecPackFilled,
                type: 'required',
            });
        }

        if (channelRequiresMainImage && !items.some(item => item.key === 'p_img')) {
            items.push({
                key: 'p_img',
                label: '商品主图',
                section: 'display',
                filled: String(dynamicFormData.p_img || '').trim() !== '',
                type: 'required',
            });
        }

        return items;
    }, [channelRequiresMainImage, currentCategory.id, currentFieldConfigs, dynamicFormData, enabledSpecChildIds, hasRenderableSpecFields, isSpecPackFilled, isSpecPackRequired, isSpecPriceFilled, isSpecPriceRequired, isSpecStockFilled, isSpecStockRequired, isUnifiedForm, masterProductName, visibleFieldIds, visibleSpecRows.length]);

    const requiredMissingItems = useMemo(
        () => validationItems.filter(item => item.type === 'required' && !item.filled),
        [validationItems]
    );
    const requiredStatusItems = useMemo(
        () => validationItems.filter(item => item.type === 'required'),
        [validationItems]
    );
    const recommendedStatusItems = useMemo(() => {
        const requiredRawKeys = new Set(
            validationItems
                .filter(item => item.type === 'required')
                .map(item => item.key.replace('recommend-', ''))
        );
        return validationItems.filter(item => (
            item.type === 'recommended'
            && !requiredRawKeys.has(item.key.replace('recommend-', ''))
        ));
    }, [validationItems]);
    const recommendedMissingItems = useMemo(
        () => recommendedStatusItems.filter(item => !item.filled),
        [recommendedStatusItems]
    );
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
    ), [requiredStatusItems, validationItems]);
    const completionSummary = useMemo(() => {
        const total = requiredStatusItems.length;
        return { total, completed: requiredStatusItems.filter(item => item.filled).length };
    }, [requiredStatusItems]);
    const expandedBasicDynamicFields = useMemo(
        () => AVAILABLE_DYNAMIC_FIELDS.filter(field => (
            expandedBasicFields.includes(field.id)
            && (!isUnifiedForm || MASTER_FIELD_IDS.has(field.id))
        )),
        [expandedBasicFields, isUnifiedForm]
    );
    const visibleBasicFields = useMemo(
        () => AVAILABLE_DYNAMIC_FIELDS.filter(field => (
            isCommonFieldEnabled(field.id)
            && field.module === 'base'
            && field.id !== 'p_img'
            && (!isUnifiedForm || field.id !== 'p_name')
            && (!isUnifiedForm || MASTER_FIELD_IDS.has(field.id))
            && (field.id !== 'p_cat' || isChannelForm)
        )),
        [isChannelForm, isCommonFieldEnabled, isUnifiedForm]
    );
    const visibleUnifiedChannelBasicFields = useMemo(
        () => isUnifiedForm
            ? AVAILABLE_DYNAMIC_FIELDS.filter(field => (
                field.module === 'base'
                && UNIFIED_CHANNEL_BASIC_FIELD_IDS.has(field.id)
                && visibleFieldIds.has(field.id)
                && (
                    commonFieldIdSet.has(field.id)
                    || (collapsedCommonFieldIdSet.has(field.id) && expandedMoreFieldSet.has(field.id))
                )
            ))
            : [],
        [collapsedCommonFieldIdSet, commonFieldIdSet, expandedMoreFieldSet, isUnifiedForm, visibleFieldIds]
    );
    const showMasterMainImage = (isMasterForm || isUnifiedForm) && isFieldRendered('p_img');
    const hasMethodSection = useMemo(() => (
        isComboProduct
            ? hasSpecModuleEnabled || visibleFieldIds.has('c_groups') || hasMethodModuleEnabled
            : hasSpecModuleEnabled || hasMethodModuleEnabled || hasAddonModuleEnabled || collapsedAttrModuleMappings.length > 0
    ), [collapsedAttrModuleMappings.length, hasAddonModuleEnabled, hasMethodModuleEnabled, hasSpecModuleEnabled, isComboProduct, visibleFieldIds]);
    const hasDisplaySection = useMemo(() => (
        visibleUnifiedChannelBasicFields.length > 0 || [
            ...(isMasterForm ? [] : ['p_img']),
            'p_list_desc',
            'p_desc_tags',
            'p_order_tags',
            'p_badge',
            'p_badge_date',
            'p_rich_desc',
            'p_detail_bottom_img',
            'p_video',
        ].some(fieldId => visibleFieldIds.has(fieldId))
    ), [isMasterForm, visibleFieldIds, visibleUnifiedChannelBasicFields.length]);
    const hasSalesSection = useMemo(() => (
        [
            's_price',
            's_cost',
            's_market_price',
            's_pack_fee',
            's_stock',
            's_limit',
            's_pos_edit',
            's_min_purchase_toggle',
            's_min_purchase_value',
            's_max_purchase_toggle',
            's_max_purchase_value',
            's_time_sale_toggle',
            's_time_sale_rule',
            's_sale_mode',
            's_takeout_rule',
            's_sale_settings',
            's_tax_rate',
            'p_points_exchange_rule',
            's_jump_third_mini_program',
            's_third_mini_program_path',
            's_sales_commission_amount',
        ].some(fieldId => visibleFieldIds.has(fieldId))
    ), [visibleFieldIds]);
    const hasOtherSection = useMemo(() => (
        AVAILABLE_DYNAMIC_FIELDS.some(field => (
            field.module === 'others' && visibleFieldIds.has(field.id)
        ))
    ), [visibleFieldIds]);
    const sectionVisibility = useMemo<Record<SectionId, boolean>>(() => ({
        basic: visibleBasicFields.length > 0 || showMasterMainImage || isUnifiedForm,
        third_party: thirdPartyChannelAttributeIds.length > 0,
        method: hasMethodSection,
        display: hasDisplaySection,
        spec: hasSalesSection,
        settings: hasOtherSection,
    }), [hasDisplaySection, hasMethodSection, hasOtherSection, hasSalesSection, isUnifiedForm, showMasterMainImage, thirdPartyChannelAttributeIds.length, visibleBasicFields.length]);
    const visibleSectionOrder = useMemo(
        () => SECTION_ORDER.filter(section => sectionVisibility[section]),
        [sectionVisibility]
    );
    const getSectionLabel = (section: SectionId) => {
        if (isMasterForm) {
            if (section === 'basic') return '主档信息';
            if (section === 'method') return '商品结构';
            if (section === 'display') return '识别图片';
            if (section === 'settings') return '补充资料';
        }
        if (isChannelForm) {
            if (section === 'basic') return '渠道基础';
            if (section === 'method') return '商品配置';
            if (section === 'third_party') return '渠道专属属性';
        }
        if (isUnifiedForm) {
            if (section === 'basic') return '主档基础资料';
            if (section === 'method') return '主档商品结构';
            if (section === 'display') return '渠道展示资料';
            if (section === 'spec') return '渠道售卖资料';
            if (section === 'settings') return '渠道补充资料';
            if (section === 'third_party') return '渠道专属属性';
        }
        return SECTION_LABELS[section];
    };
    const firstVisibleSection = visibleSectionOrder[0] || 'basic';
    const isWeightProduct = !!dynamicFormData.p_weight_flag;
    const isSingleSpecOnly = isWeightProduct || isBuffetTicketCategory;

    useEffect(() => {
        if (visibleSectionOrder.length === 0) return;
        if (!visibleSectionOrder.includes(activeFormSection)) {
            setActiveFormSection(firstVisibleSection);
        }
    }, [activeFormSection, firstVisibleSection, visibleSectionOrder]);

    useEffect(() => {
        if (groupedTagOptionsProp) {
            setGroupedTagOptions(groupedTagOptionsProp);
        }
    }, [groupedTagOptionsProp]);

    useEffect(() => {
        if (badgeOptionsProp) {
            setBadgeOptions(badgeOptionsProp);
        }
    }, [badgeOptionsProp]);

    useEffect(() => {
        onGroupedTagOptionsChange?.(groupedTagOptions);
    }, [groupedTagOptions, onGroupedTagOptionsChange]);

    useEffect(() => {
        onBadgeOptionsChange?.(badgeOptions);
    }, [badgeOptions, onBadgeOptionsChange]);

    useEffect(() => {
        if (isSingleSpecOnly && specDisplayMode !== 'single') {
            setSpecDisplayMode('single');
        }
        if (isBuffetTicketCategory) {
            setSpecConfigRows(prev => prev.length > 0 ? prev.slice(0, 1) : [createEmptySpecConfigRow('spec-1')]);
            setDynamicFormData(prev => ({
                ...prev,
                p_business_type: 'buffet_ticket',
                p_applicable_people: String(Math.max(1, Math.floor(Number(prev.p_applicable_people) || 1))),
                p_deposit_required: !!prev.p_deposit_required,
            }));
        } else {
            setDynamicFormData(prev => {
                if (!prev.p_business_type) return prev;
                const next = { ...prev };
                delete next.p_business_type;
                return next;
            });
        }
    }, [isBuffetTicketCategory, isSingleSpecOnly, specDisplayMode]);

    useEffect(() => {
        if (specDisplayMode === 'single') {
            setActiveSpecBulkField(null);
            setSpecBulkDraft({});
        }
    }, [specDisplayMode]);

    useEffect(() => {
        const validFieldIds = new Set(moreFieldMappings.map(item => item.id));
        setExpandedMoreFields(prev => prev.filter(id => validFieldIds.has(id)));
    }, [moreFieldMappings]);

    useEffect(() => {
        if (!isComboProduct) return;
        setDynamicFormData(prev => ({
            ...prev,
            c_groups: comboGroupCards.map(item => item.title),
            a_addons: '',
        }));
    }, [comboGroupCards, isComboProduct]);

    const getFieldDescription = (field: DynamicFieldConfig) => {
        if (field.id === 'p_name' && isChannelForm) {
            return '仅修改当前渠道商品库的售卖名称，不会修改商品主档名称。';
        }
        if (field.id === 'p_front_cat' && isChannelForm) {
            return '默认继承商品主档的前台分类；修改后仅对当前渠道商品库生效，不回写商品主档。';
        }
        if (field.id === 'p_unit') {
            return isWeightProduct ? '称重商品的价格单位，单位设置建议与电子秤单位一致' : undefined;
        }
        return field.description;
    };

    const getFieldDisplayLabel = (field: DynamicFieldConfig) => {
        if (field.id === 'p_name' && isChannelForm) return isComboProduct ? '渠道套餐名称' : '渠道商品名称';
        if (field.id === 'p_name' && isMasterForm) return isComboProduct ? '主档套餐名称' : '主档商品名称';
        if (field.id === 'p_front_cat' && isChannelForm) return '前台分类';
        if (!isComboProduct) return field.label;
        if (field.id === 'p_name') return '套餐名称';
        if (field.id === 'p_alias') return '商品别名';
        return field.label;
    };

    const getValidationAnchorId = (itemKey: string) => `required-field-${itemKey.replace('recommend-', '')}`;
    const getValidationModuleTargetId = (itemKey: string) => {
        if (['spec-price', 'spec-stock', 'spec-pack', 's_specs', 'c_groups'].includes(itemKey)) return 'field-s_specs';
        const rawKey = itemKey.replace('recommend-', '');
        return `field-${rawKey}`;
    };
    const locateValidationItem = (item: ValidationItem) => {
        scrollToTarget(getValidationTargetId(item.key), item.section);
    };
    const locateValidationModule = (item: ValidationItem) => {
        scrollToTarget(getValidationModuleTargetId(item.key), item.section);
    };
    const renderSectionCollapsedEntry = (
        items: Array<{ id: string; label: string }>
    ) => {
        if (items.length === 0) return null;
        const itemIds = items.map(item => item.id);
        const localExpandedIds = expandedMoreFields.filter(id => itemIds.includes(id));
        return (
            <div className="pt-1">
                {renderCollapsedFieldControls(
                    items,
                    localExpandedIds,
                    () => setExpandedMoreFields(prev => Array.from(new Set([...prev, ...itemIds]))),
                    fieldId => setExpandedMoreFields(prev => (prev.includes(fieldId) ? prev : [...prev, fieldId])),
                    () => setExpandedMoreFields(prev => prev.filter(id => !itemIds.includes(id))),
                    {
                        gapClass: 'gap-2',
                        buttonClassName: 'px-3 py-1.5 text-xs',
                        chipClassName: 'px-3 py-1.5 text-xs',
                    }
                )}
            </div>
        );
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

    const syncProductImages = (nextImages: string[]) => {
        setDynamicFormData(prev => ({
            ...prev,
            p_img: nextImages[0] || '',
            p_img_gallery: nextImages,
        }));
    };

    const buildMockProductImage = (index: number) => `product-image-${index + 1}`;

    const renderDisplayMainImageField = ({ compact = false }: { compact?: boolean } = {}) => {
        const imageField = AVAILABLE_DYNAMIC_FIELDS.find(field => field.id === 'p_img');
        const imageRequired = channelRequiresMainImage || currentFieldConfigMap.get('p_img')?.isRequired || imageField?.isRequired;
        const imageReadonly = channelRequiresMainImage ? false : isChannelFieldReadonly('p_img');
        const channelImageRequirementHint = channelRequiresMainImage ? (
            <div className={`text-xs font-medium ${saveAttempted && productImages.length === 0 ? 'text-[#E5484D]' : 'text-[#667085]'}`}>
                {isUnifiedForm
                    ? '当前商品适用范围包含小程序，商品主图为必填项；缺失时不可发布至小程序。'
                    : '当前渠道商品库包含小程序渠道，商品主图为必填项；缺失时不可发布至小程序。'}
            </div>
        ) : null;

        const addProductImage = () => {
            if (imageReadonly) return;
            if (productImages.length >= 10) return;
            syncProductImages([...productImages, buildMockProductImage(productImages.length)]);
            setActivePreviewField('p_img');
        };

        const removeProductImage = (index: number) => {
            if (imageReadonly) return;
            const nextImages = productImages.filter((_, currentIndex) => currentIndex !== index);
            syncProductImages(nextImages);
        };

        const moveProductImage = (fromIndex: number, toIndex: number) => {
            if (imageReadonly) return;
            if (fromIndex === toIndex) return;
            const nextImages = [...productImages];
            const [moved] = nextImages.splice(fromIndex, 1);
            nextImages.splice(toIndex, 0, moved);
            syncProductImages(nextImages);
        };

        const imageTiles = (
            <div className="flex flex-wrap gap-3">
                {productImages.map((image, index) => (
                    <div
                        key={`${image}-${index}`}
                        draggable={!imageReadonly}
                        onDragStart={e => {
                            setDraggingProductImageIndex(index);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', String(index));
                        }}
                        onDragOver={e => {
                            if (draggingProductImageIndex === null || draggingProductImageIndex === index) return;
                            e.preventDefault();
                        }}
                        onDrop={e => {
                            if (draggingProductImageIndex === null || draggingProductImageIndex === index) return;
                            e.preventDefault();
                            moveProductImage(draggingProductImageIndex, index);
                            setDraggingProductImageIndex(null);
                        }}
                        onDragEnd={() => setDraggingProductImageIndex(null)}
                        className={`group relative h-[132px] w-[132px] overflow-hidden rounded-xl border bg-white ${draggingProductImageIndex === index ? 'border-[#00C06B] shadow-[0_0_0_3px_rgba(0,192,107,0.12)]' : 'border-[#E5E7EB]'}`}
                    >
                        <button
                            type="button"
                            disabled={imageReadonly}
                            onClick={() => {
                                setActivePreviewField('p_img');
                                syncProductImages(productImages.map((item, itemIndex) => itemIndex === index ? buildMockProductImage(index + 10) : item));
                            }}
                            className="h-full w-full bg-gradient-to-br from-[#F3F4F6] via-[#E5E7EB] to-[#D1D5DB]"
                        >
                            <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#6B7280]">
                                商品主图
                            </div>
                        </button>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/45 px-2 py-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                                type="button"
                                disabled={imageReadonly}
                                onClick={() => setActivePreviewField('p_img')}
                                className="text-white/90 hover:text-white"
                            >
                                <ImageIcon size={16} />
                            </button>
                            <button
                                type="button"
                                disabled={imageReadonly}
                                onClick={() => removeProductImage(index)}
                                className="text-white/90 hover:text-white"
                            >
                                <CircleAlert size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {productImages.length < 10 && !imageReadonly && (
                    <button
                        type="button"
                        onClick={addProductImage}
                        className="flex h-[132px] w-[132px] items-center justify-center rounded-xl border border-dashed border-[#D9DDE7] bg-white text-[#666] transition-colors hover:border-[#00C06B] hover:text-[#00A35B]"
                    >
                        <Plus size={28} />
                    </button>
                )}
            </div>
        );

        if (compact) {
            return (
                <div id="field-p_img" className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                    <div className="pt-2 text-sm font-bold text-[#1F2129]">
                        <span className="mr-1 text-[#FF4D4F]">{imageRequired ? '*' : ''}</span>
                        商品主图
                    </div>
                    <div className={`space-y-3 ${imageReadonly ? 'opacity-65' : ''}`}>
                        {imageTiles}
                        {channelImageRequirementHint}
                        {imageReadonly && <div className="text-xs font-medium text-gray-400">由主档管理团队设为不可覆盖</div>}
                        <div className="text-xs leading-5 text-gray-400">
                            建议尺寸：1:1，单张大小不超过 300K，最多可上传 10 张；支持拖拽调整图片顺序。
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div id="field-p_img" className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-3 space-y-3">
                <div className="flex items-center gap-1 text-sm font-bold text-[#1F2129]">
                    <span className="text-[#FF4D4F]">{imageRequired ? '*' : ''}</span>
                    <span>商品主图</span>
                </div>
                <div className={imageReadonly ? 'opacity-65' : ''}>{imageTiles}</div>
                {channelImageRequirementHint}
                {imageReadonly && <div className="text-xs font-medium text-gray-400">由主档管理团队设为不可覆盖</div>}
                <div className="text-xs leading-5 text-gray-400">
                    建议尺寸：1:1，单张大小不超过 300K，最多可上传 10 张；支持拖拽调整图片顺序。
                </div>
            </div>
        );
    };

    const renderMasterMainImageField = () => {
        const primaryImage = productImages[0];
        const replacePrimaryImage = () => {
            syncProductImages([buildMockProductImage(productImages.length + 20)]);
            setActivePreviewField('p_img');
        };

        return (
            <div id="field-p_img" className="col-span-1">
                <FormRow
                    label="商品主图"
                    description="选填；作为渠道商品首次创建时的默认图片，渠道可按售卖需要调整。"
                    descriptionPlacement="bottom"
                >
                    <div className="flex min-h-[82px] items-center gap-3">
                        <button
                            type="button"
                            onClick={replacePrimaryImage}
                            className={`group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border transition-colors ${
                                primaryImage
                                    ? 'border-[#E5E7EB] bg-gradient-to-br from-[#F3F4F6] via-[#E5E7EB] to-[#D1D5DB]'
                                    : 'border-dashed border-[#D9DDE7] bg-[#FAFAFA] text-[#667085] hover:border-[#00C06B] hover:text-[#00A35B]'
                            }`}
                        >
                            {primaryImage ? (
                                <>
                                    <span className="text-xs font-bold text-[#667085]">商品主图</span>
                                    <span className="absolute inset-x-0 bottom-0 bg-black/45 py-1 text-center text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                        更换
                                    </span>
                                </>
                            ) : (
                                <Plus size={22} />
                            )}
                        </button>
                        <div className="min-w-0 space-y-1.5">
                            <button
                                type="button"
                                onClick={replacePrimaryImage}
                                className="text-sm font-semibold text-[#00A35B] hover:text-[#008F50]"
                            >
                                {primaryImage ? '更换图片' : '上传图片'}
                            </button>
                            {primaryImage && (
                                <button
                                    type="button"
                                    onClick={() => syncProductImages([])}
                                    className="ml-3 text-sm text-[#667085] hover:text-[#E5484D]"
                                >
                                    移除
                                </button>
                            )}
                            <div className="text-xs leading-5 text-[#98A2B3]">建议 1:1，单张不超过 300K</div>
                        </div>
                    </div>
                </FormRow>
            </div>
        );
    };

    const commitProductSave = (showSuccessPage = true) => {
        const nextSuccessMode = hasSavedProduct ? 'edit' : 'create';
        const inheritedChannelFormData = isUnifiedForm
            ? {
                ...dynamicFormData,
                p_name: masterProductName,
                p_front_cat: Array.isArray(dynamicFormData.p_front_cat) && dynamicFormData.p_front_cat.length > 0
                    ? dynamicFormData.p_front_cat
                    : [currentCategory.name],
                s_price: dynamicFormData.s_price || visibleSpecRows[0]?.s_spec_price || initialProduct?.price || '',
                channel_inherit_mode: 'follow_master',
                channel_inheritance: {
                    name: 'follow_master',
                    image: 'follow_master',
                    structure: 'follow_master',
                    price: 'follow_master',
                },
            }
            : dynamicFormData;
        onProductSaved?.({
            id: initialProduct?.id,
            name: String(
                isUnifiedForm
                    ? masterProductName
                    : (dynamicFormData.p_name || initialProduct?.name || `${isComboProduct ? '套餐商品' : '商品'}${existingProductCount + 1}`)
            ),
            price: Number(
                ((isMasterForm || isUnifiedForm) ? visibleSpecRows[0]?.s_spec_price : dynamicFormData.s_price)
                || initialProduct?.price
                || 0
            ),
            category: Array.isArray(dynamicFormData.p_front_cat) ? (dynamicFormData.p_front_cat[0] || category.name) : (dynamicFormData.p_front_cat || category.name),
            image: String(
                isChannelForm
                    ? (dynamicFormData.p_img || '')
                    : (dynamicFormData.p_img || initialProduct?.image || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&h=200&fit=crop')
            ),
            skuCode: String(initialProduct?.skuCode || `${Date.now()}`.slice(-8)),
            type,
            formData: inheritedChannelFormData,
        }, nextSuccessMode);
        setSuccessMode(nextSuccessMode);
        setHasSavedProduct(true);
        if (showSuccessPage) setPageView('success');
        setSelectedSuccessAction(null);
    };

    const handleSave = () => {
        setDraftSaved(false);
        setSaveAttempted(true);
        if (!isStoreForm && requiredMissingItems.length > 0) {
            locateValidationItem(requiredMissingItems[0]);
            return;
        }
        if (isStoreForm) {
            setStoreSaveStage('confirm');
            return;
        }
        commitProductSave();
    };

    const handleConfirmStoreSave = () => {
        if (selectedStoreChannelIds.length === 0) return;
        setStoreSaveStage('saving');
        window.setTimeout(() => {
            commitProductSave(false);
            setStoreSaveStage('result');
        }, 900);
    };

    const handleFinishStoreSave = () => {
        setStoreSaveStage(null);
        onClose();
    };

    const handleSaveDraft = () => {
        setDraftSaved(true);
        setSaveAttempted(false);
    };

    const handleSuccessAction = (action: 'sync' | 'template' | 'detail') => {
        setSelectedSuccessAction(action);
        if (action === 'sync' || action === 'template') {
            setTaskFlowStep(prev => ({ ...prev, [action]: 0 }));
            if (action === 'template') {
                const defaultTemplateIds = successMode === 'edit' ? ['template-1', 'template-2'] : [];
                setSelectedTemplateIds(defaultTemplateIds);
                setTemplatePickerDraftIds(defaultTemplateIds);
                setShowTemplatePickerModal(false);
                setTemplateKeyword('');
                setTemplateDescKeyword('');
                setTemplateChannelFilter('');
                setTemplateSaleTypeFilter('');
                setTemplateGroupFilter('');
                setTemplateHistoryTypeFilter('all');
                setTemplateHistoryStatusFilter('all');
            }
            setTaskExecutionMode('immediate');
            setSelectedStoreIds(['store-1151709', 'store-1151708']);
            setStoreKeyword('');
            setStoreTagFilter('');
            setStoreCodeFilter('');
            setSelectedOverrideFields([
                '基础价格',
                '库存',
                '起购限购',
                '商品排序',
                '分类排序',
                '售卖时间',
                '加料',
                '做法',
                '前台分类',
                '商品主图',
                '商品封面图',
                '商品详情图',
                '商品档口',
                '其他属性',
            ]);
            setConfirmingTask(null);
        }
        setPageView(action);
    };

    const handleContinueCreate = () => {
        setDynamicFormData({
            p_weight_flag: false,
            p_business_type: category.businessType || '',
            p_applicable_people: '1',
            p_deposit_required: category.businessType === 'buffet_ticket',
            p_unit: '',
        });
        setCommittedStarterName('');
        setDraftSaved(false);
        setSaveAttempted(false);
        setHasSavedProduct(false);
        setSuccessMode('create');
        setSelectedSuccessAction(null);
        setActivePreviewField('default');
        setActiveFormSection('required');
        setCurrentCategory(category);
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

    const handleSingleExpand = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        fieldId: string,
        setExpandedAll?: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        setter(prev => (prev.includes(fieldId) ? prev : [...prev, fieldId]));
        setExpandedAll?.(false);
    };

    const handleExpandAll = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        fieldIds: string[],
        setExpandedAll?: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        setter(fieldIds);
        setExpandedAll?.(true);
    };

    const handleCategorySelect = (nextCategory: Category) => {
        setCurrentCategory(nextCategory);
        if (nextCategory.businessType === 'buffet_ticket') {
            setDynamicFormData(prev => ({ ...prev, p_deposit_required: true }));
        }
        setShowCategoryPickerModal(false);
        setActiveFormSection('required');
    };

    const renderCollapsedFieldControls = (
        items: Array<{ id: string; label: string }>,
        expandedIds: string[],
        onExpandAll: () => void,
        onExpandOne: (id: string) => void,
        onCollapseAll: () => void,
        options?: {
            gapClass?: string;
            buttonClassName?: string;
            chipClassName?: string;
            showCollapse?: boolean;
        }
    ) => {
        const collapsedItems = items.filter(item => !expandedIds.includes(item.id));
        const hasCollapsedItems = collapsedItems.length > 0;
        const allExpanded = items.length > 0 && expandedIds.length >= items.length;
        const gapClass = options?.gapClass ?? 'gap-3';
        const buttonClassName = options?.buttonClassName ?? 'px-4 py-2';
        const chipClassName = options?.chipClassName ?? 'px-4 py-2';
        const showCollapse = options?.showCollapse ?? allExpanded;

        return (
            <div className={`flex flex-wrap items-center ${gapClass}`}>
                {hasCollapsedItems && (
                    <button
                        type="button"
                        onClick={onExpandAll}
                        className={`inline-flex items-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors ${buttonClassName}`}
                    >
                        展开
                        <ChevronDown size={16} className="ml-1.5 text-gray-400" />
                    </button>
                )}
                {collapsedItems.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onExpandOne(item.id)}
                        className={`inline-flex items-center rounded-xl bg-[#F5F7FA] text-sm font-bold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors ${chipClassName}`}
                    >
                        {item.label}
                    </button>
                ))}
                {(showCollapse || allExpanded) && (
                    <button
                        type="button"
                        onClick={onCollapseAll}
                        className={`inline-flex items-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors ${buttonClassName}`}
                    >
                        收起
                        <ChevronUp size={16} className="ml-1.5 text-gray-400" />
                    </button>
                )}
            </div>
        );
    };

    const buildCategoryValue = (parentName: string, childName?: string) => childName ? `${parentName} / ${childName}` : parentName;
    const normalizeStringArrayValue = (value: unknown) => (
        Array.isArray(value)
            ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            : typeof value === 'string' && value.trim().length > 0
                ? [value]
                : []
    );
    const getGroupedTagOptionsByField = (fieldId: GroupedTagFieldId) => groupedTagOptions[fieldId];
    const updateGroupedTagOptionsByField = (
        fieldId: GroupedTagFieldId,
        updater: (prev: GroupedTagGroup[]) => GroupedTagGroup[]
    ) => {
        setGroupedTagOptions(prev => ({
            ...prev,
            [fieldId]: updater(prev[fieldId]),
        }));
    };
    const getGroupedTagSelectionMode = (fieldId: GroupedTagFieldId) => fieldId === 'p_desc_tags' ? 'multi' : 'single';
    const getGroupedTagDisplayNames = (fieldId: GroupedTagFieldId, value: unknown) => {
        const currentValue = getGroupedTagSelectionMode(fieldId) === 'multi'
            ? normalizeStringArrayValue(value)
            : (typeof value === 'string' && value.trim() ? [value] : []);
        return currentValue;
    };
    const findGroupedTagOption = (fieldId: GroupedTagFieldId, optionName: string) => (
        groupedTagOptions[fieldId].flatMap(group => group.options).find(option => option.name === optionName)
    );
    const findBadgeOption = (badgeName: string) => badgeOptions.find(item => item.name === badgeName);

    const getCategoryTreeByField = (fieldId: 'p_front_cat' | 'p_back_cat') => (
        fieldId === 'p_front_cat' ? frontCategoryTree : backCategoryTree
    );

    const updateCategoryTreeByField = (
        fieldId: 'p_front_cat' | 'p_back_cat',
        updater: (prev: CategoryTreeNode[]) => CategoryTreeNode[]
    ) => {
        if (fieldId === 'p_front_cat') {
            setFrontCategoryTree(updater);
        } else {
            setBackCategoryTree(updater);
        }
    };

    const openQuickCreateOptionModal = (config: QuickCreateOptionModalState) => {
        setQuickCreateOptionModal(config);
        setQuickCreateOptionDraft('');
        setQuickCreateStyleType('text');
        setQuickCreateBackgroundColor(TAG_BACKGROUND_COLOR_OPTIONS[0]);
        setQuickCreateTextColor(TAG_TEXT_COLOR_OPTIONS[0]);
        setQuickCreateStartDate('2026-05-27');
        setQuickCreateEndDate('2026-06-27');
    };

    const closeQuickCreateOptionModal = () => {
        setQuickCreateOptionModal(null);
        setQuickCreateOptionDraft('');
        setQuickCreateStyleType('text');
        setQuickCreateBackgroundColor(TAG_BACKGROUND_COLOR_OPTIONS[0]);
        setQuickCreateTextColor(TAG_TEXT_COLOR_OPTIONS[0]);
        setActiveColorPickerTarget(null);
        setColorPickerHexInput('#F2F2F2');
    };

    const openColorPicker = (target: ColorPickerTarget) => {
        const initialColor = normalizeHexColor(target === 'background' ? quickCreateBackgroundColor : quickCreateTextColor);
        const hsv = hexToHsv(initialColor);
        setActiveColorPickerTarget(target);
        setColorPickerHue(hsv.h);
        setColorPickerSaturation(hsv.s);
        setColorPickerValue(hsv.v);
        setColorPickerHexInput(initialColor);
    };

    const applyColorToTarget = (target: ColorPickerTarget, nextHex: string) => {
        if (target === 'background') {
            setQuickCreateBackgroundColor(nextHex);
        } else {
            setQuickCreateTextColor(nextHex);
        }
    };

    const handleColorBoardSelect = (
        event: React.MouseEvent<HTMLDivElement>,
        target: ColorPickerTarget
    ) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const nextSaturation = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const nextValue = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
        const nextHex = hsvToHex(colorPickerHue, nextSaturation, nextValue);
        setColorPickerSaturation(nextSaturation);
        setColorPickerValue(nextValue);
        setColorPickerHexInput(nextHex);
        applyColorToTarget(target, nextHex);
    };

    const handleHueStripSelect = (
        event: React.MouseEvent<HTMLDivElement>,
        target: ColorPickerTarget
    ) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const nextHue = clamp(((event.clientY - rect.top) / rect.height) * 360, 0, 360);
        const nextHex = hsvToHex(nextHue, colorPickerSaturation, colorPickerValue);
        setColorPickerHue(nextHue);
        setColorPickerHexInput(nextHex);
        applyColorToTarget(target, nextHex);
    };

    const handleColorHexConfirm = (target: ColorPickerTarget) => {
        const nextHex = normalizeHexColor(colorPickerHexInput, target === 'background' ? '#F2F2F2' : '#666666');
        const hsv = hexToHsv(nextHex);
        setColorPickerHue(hsv.h);
        setColorPickerSaturation(hsv.s);
        setColorPickerValue(hsv.v);
        setColorPickerHexInput(nextHex);
        applyColorToTarget(target, nextHex);
        setActiveColorPickerTarget(null);
    };

    const handleColorClear = (target: ColorPickerTarget) => {
        const fallback = target === 'background' ? '#F2F2F2' : '#666666';
        const hsv = hexToHsv(fallback);
        setColorPickerHue(hsv.h);
        setColorPickerSaturation(hsv.s);
        setColorPickerValue(hsv.v);
        setColorPickerHexInput(fallback);
        applyColorToTarget(target, fallback);
    };

    useEffect(() => {
        if (!activeCreatableSelect) return;

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('[data-creatable-select-root="true"]')) return;
            setActiveCreatableSelect(null);
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [activeCreatableSelect]);

    const handleCategoryValueSelect = (fieldId: 'p_front_cat' | 'p_back_cat', parentId: string, childId?: string) => {
        const categoryTree = getCategoryTreeByField(fieldId);
        const parent = categoryTree.find(item => item.id === parentId);
        if (!parent) return;
        if (!childId && parent.children.length > 0) return;
        const child = childId ? parent.children.find(item => item.id === childId) : undefined;
        const nextValue = buildCategoryValue(parent.name, child?.name);
        setCategoryPanelParentIds(prev => ({ ...prev, [fieldId]: parentId }));
        setDynamicFormData(prev => {
            const current = normalizeStringArrayValue(prev[fieldId]);
            const exists = current.includes(nextValue);
            if (fieldId === 'p_back_cat') {
                return {
                    ...prev,
                    [fieldId]: exists ? '' : nextValue,
                };
            }
            return {
                ...prev,
                [fieldId]: exists ? current.filter(item => item !== nextValue) : [...current, nextValue],
            };
        });
        if (fieldId === 'p_back_cat') {
            setActiveCreatableSelect(null);
        }
    };

    const handleOpenCategoryCreate = (
        fieldId: 'p_front_cat' | 'p_back_cat',
        level: 1 | 2,
        parent?: CategoryTreeNode
    ) => {
        const fieldLabel = fieldId === 'p_front_cat' ? '前台分类' : '后台分类';
        openQuickCreateOptionModal({
            fieldId,
            mode: level === 1 ? 'category_group' : 'category_item',
            title: level === 1 ? `新增一级${fieldLabel}` : `新增二级${fieldLabel}`,
            helperText: level === 1
                ? '仅用于当前表单快速补建分类，新增后会自动带回当前商品表单。'
                : `将新增到“${parent?.name || ''}”下，新增后会自动带回当前商品表单。`,
            placeholder: level === 1 ? `请输入一级${fieldLabel}名称` : `请输入二级${fieldLabel}名称`,
            confirmText: '确定',
            maxLength: 8,
            level,
            parentId: parent?.id,
            parentName: parent?.name,
        });
    };

    const handleOpenTagCreateGroup = (fieldId: GroupedTagFieldId) => {
        const fieldLabelMap: Record<GroupedTagFieldId, string> = {
            p_desc_tags: '描述标签组',
            p_order_tags: '点单标签组',
            p_stat_tags: '统计标签组',
        };
        openQuickCreateOptionModal({
            fieldId,
            mode: 'tag_group',
            title: `新增${fieldLabelMap[fieldId]}`,
            helperText: '快速新增一个标签组名称，新增后可继续在该组下补充标签。',
            placeholder: '请输入标签组名称',
            confirmText: '确定',
            maxLength: 10,
        });
    };

    const handleOpenTagCreateItem = (fieldId: GroupedTagFieldId, parent?: GroupedTagGroup) => {
        const fieldLabelMap: Record<GroupedTagFieldId, string> = {
            p_desc_tags: '描述标签',
            p_order_tags: '点单标签',
            p_stat_tags: '统计标签',
        };
        openQuickCreateOptionModal({
            fieldId,
            mode: 'tag_item',
            title: `新增${fieldLabelMap[fieldId]}`,
            helperText: fieldId === 'p_stat_tags'
                ? '仅需填写标签名称，适用于当前商品快速补充统计标签。'
                : '可配置标签样式、背景颜色和字体颜色，新增后会自动带回当前表单。',
            placeholder: `请输入${fieldLabelMap[fieldId]}名称`,
            confirmText: '确定',
            maxLength: 10,
            parentId: parent?.id,
            parentName: parent?.name,
        });
    };

    const handleOpenBadgeCreate = () => {
        openQuickCreateOptionModal({
            fieldId: 'p_badge',
            mode: 'badge',
            title: '新增角标',
            helperText: '支持设置角标类型、背景颜色和有效期，新增后会自动带回当前商品表单。',
            placeholder: '请输入角标名称',
            confirmText: '保存',
            maxLength: 8,
        });
    };

    const handleOpenCreatableOptionModal = (fieldId: Exclude<CreatableSelectFieldId, 'p_front_cat' | 'p_back_cat'>) => {
        const metaMap = {
            p_stat_tags: {
                action: () => handleOpenTagCreateItem(fieldId, getGroupedTagOptionsByField(fieldId)[0]),
            },
            p_desc_tags: {
                action: () => handleOpenTagCreateItem(fieldId, getGroupedTagOptionsByField(fieldId).find(group => group.id === activeGroupedTagIds[fieldId]) || getGroupedTagOptionsByField(fieldId)[0]),
            },
            p_order_tags: {
                action: () => handleOpenTagCreateItem(fieldId, getGroupedTagOptionsByField(fieldId).find(group => group.id === activeGroupedTagIds[fieldId]) || getGroupedTagOptionsByField(fieldId)[0]),
            },
            p_badge: {
                action: handleOpenBadgeCreate,
            },
        } satisfies Record<Exclude<CreatableSelectFieldId, 'p_front_cat' | 'p_back_cat'>, { action: () => void }>;

        metaMap[fieldId].action();
    };

    const handleConfirmQuickCreateOption = () => {
        if (!quickCreateOptionModal) return;
        const nextName = quickCreateOptionDraft.trim();
        if (!nextName) return;

        const { fieldId, mode } = quickCreateOptionModal;

        if ((fieldId === 'p_front_cat' || fieldId === 'p_back_cat') && (mode === 'category_group' || mode === 'category_item')) {
            if (mode === 'category_item' && quickCreateOptionModal.parentId) {
                updateCategoryTreeByField(fieldId, prev => prev.map(item => (
                    item.id === quickCreateOptionModal.parentId
                        ? {
                            ...item,
                            children: item.children.some(child => child.name === nextName)
                                ? item.children
                                : [...item.children, { id: `${fieldId}-${Date.now()}`, name: nextName }],
                        }
                        : item
                )));
                setCategoryPanelParentIds(prev => ({ ...prev, [fieldId]: quickCreateOptionModal.parentId || null }));
                setDynamicFormData(prev => ({
                    ...prev,
                    [fieldId]: Array.from(new Set([...normalizeStringArrayValue(prev[fieldId]), buildCategoryValue(quickCreateOptionModal.parentName || '', nextName)])),
                }));
            } else {
                const nextRootId = `${fieldId}-${Date.now()}`;
                updateCategoryTreeByField(fieldId, prev => (
                    prev.some(item => item.name === nextName)
                        ? prev
                        : [...prev, { id: nextRootId, name: nextName, children: [] }]
                ));
                setCategoryPanelParentIds(prev => ({ ...prev, [fieldId]: nextRootId }));
                setDynamicFormData(prev => ({ ...prev, [fieldId]: Array.from(new Set([...normalizeStringArrayValue(prev[fieldId]), nextName])) }));
            }
        } else if ((fieldId === 'p_desc_tags' || fieldId === 'p_order_tags' || fieldId === 'p_stat_tags') && mode === 'tag_group') {
            const nextGroupId = `${fieldId}-group-${Date.now()}`;
            updateGroupedTagOptionsByField(fieldId, prev => (
                prev.some(group => group.name === nextName)
                    ? prev
                    : [...prev, { id: nextGroupId, name: nextName, options: [], source: 'store' }]
            ));
            setActiveGroupedTagIds(prev => ({ ...prev, [fieldId]: nextGroupId }));
        } else if ((fieldId === 'p_desc_tags' || fieldId === 'p_order_tags' || fieldId === 'p_stat_tags') && mode === 'tag_item' && quickCreateOptionModal.parentId) {
            updateGroupedTagOptionsByField(fieldId, prev => prev.map(group => (
                group.id === quickCreateOptionModal.parentId
                    ? {
                        ...group,
                        options: group.options.some(option => option.name === nextName)
                            ? group.options
                            : [
                                ...group.options,
                                {
                                    id: `${fieldId}-option-${Date.now()}`,
                                    name: nextName,
                                    ...(fieldId === 'p_stat_tags' ? {} : {
                                        styleType: quickCreateStyleType,
                                        backgroundColor: quickCreateBackgroundColor,
                                        textColor: quickCreateTextColor,
                                    }),
                                    source: 'store',
                                },
                            ],
                    }
                    : group
            )));
            if (fieldId === 'p_desc_tags') {
                setDynamicFormData(prev => ({ ...prev, [fieldId]: Array.from(new Set([...normalizeStringArrayValue(prev[fieldId]), nextName])) }));
            } else {
                setDynamicFormData(prev => ({ ...prev, [fieldId]: nextName }));
            }
        } else if (fieldId === 'p_badge' && mode === 'badge') {
            const nextBadge: BadgeOptionConfig = {
                id: `badge-${Date.now()}`,
                name: nextName,
                badgeType: quickCreateStyleType,
                backgroundColor: quickCreateBackgroundColor,
                startDate: quickCreateStartDate,
                endDate: quickCreateEndDate,
                source: 'store',
            };
            setBadgeOptions(prev => [...prev, nextBadge]);
            setDynamicFormData(prev => ({
                ...prev,
                p_badge: nextName,
                p_badge_start_date: quickCreateStartDate,
                p_badge_end_date: quickCreateEndDate,
            }));
        }

        closeQuickCreateOptionModal();
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
        const nextSelections = Object.keys(selectedSpecValuesByGroup).length > 0
            ? selectedSpecValuesByGroup
            : deriveSpecSelectionMap(specConfigRows.map(row => row.s_spec_name).filter(Boolean));
        if (isComboProduct) {
            const firstSelectedGroupEntry = Object.entries(nextSelections).find(([, values]) => values.length > 0);
            if (firstSelectedGroupEntry) {
                setActiveSpecGroupId(firstSelectedGroupEntry[0]);
                setTempSpecSelections({ [firstSelectedGroupEntry[0]]: firstSelectedGroupEntry[1] });
            } else {
                setTempSpecSelections({});
            }
        } else {
            setTempSpecSelections(nextSelections);
        }
        setShowSpecPickerModal(true);
    };

    const confirmSpecPicker = () => {
        const sanitizedSelections = isComboProduct
            ? (() => {
                const firstSelectedGroupEntry = Object.entries(tempSpecSelections).find(([, values]) => values.length > 0);
                return firstSelectedGroupEntry ? { [firstSelectedGroupEntry[0]]: firstSelectedGroupEntry[1] } : {};
            })()
            : tempSpecSelections;
        const nextSpecNames = buildSpecCombinationNames(sanitizedSelections);
        const existingMap = new Map(specConfigRows.map(row => [row.s_spec_name, row]));
        const nextRows = nextSpecNames.map((specName, index) => {
            const existingRow = existingMap.get(specName);
            return existingRow || createEmptySpecConfigRow(`spec-${index + 1}`, specName);
        });
        setSelectedSpecValuesByGroup(sanitizedSelections);
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
                addonLimit: addonMeta?.defaultLimit || '',
                fixedQuantity: '1',
                addonPrice: addonMeta?.price || '0',
                addonSpecPrice: '',
                addonStatus: addonMeta?.status || 'on',
            };
        });
        setAddonConfigRows(nextRows);
        setAttrDefaultSelections(prev => {
            const next = { ...prev };
            ADDON_LIBRARY.forEach(group => {
                const key = `addon:${group.name}`;
                const currentValue = next[key];
                const currentValues = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
                const selectedNames = new Set(nextRows.filter(row => row.groupName === group.name).map(row => row.addonName));
                const validValues = currentValues.filter(value => selectedNames.has(value));
                if (validValues.length > 0) next[key] = validValues;
                else delete next[key];
            });
            return next;
        });
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
        const selectableAddonGroupNames = addonGroupNames.filter(groupName => (addonGroupRules[groupName]?.mode || 'customer') === 'customer');
        const rawGroups = [
            ...(hasSpecAttr ? [{
                id: 'spec',
                title: '规格',
                tag: '规格',
                items: specConfigRows.map(row => row.s_spec_name),
                defaultKey: 'spec',
            }] : []),
            ...selectableAddonGroupNames.map(groupName => ({
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
                            标<span className="mx-1 inline-block h-3 w-3 rounded-sm bg-[#00C06B]" />为默认属性值；规格需设置一个默认值，加料支持设置多个默认值
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
                        const isAddonGroup = group.tag === '加料';
                        const defaultValues = Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : [];
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
                                        const isDefault = defaultValues.includes(item);
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
                                                        if (isAddonGroup) {
                                                            const currentValue = prev[group.defaultKey];
                                                            const currentValues = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
                                                            const nextValues = isDefault ? currentValues.filter(value => value !== item) : [...currentValues, item];
                                                            if (nextValues.length === 0) {
                                                                const next = { ...prev };
                                                                delete next[group.defaultKey];
                                                                return next;
                                                            }
                                                            return { ...prev, [group.defaultKey]: nextValues };
                                                        }
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
    const renderSelectionChips = (values: string[], placeholder: string) => {
        if (values.length === 0) {
            return <span className="text-gray-400">{placeholder}</span>;
        }
        return (
            <div className="flex flex-wrap gap-2">
                {values.map(item => (
                    <span key={item} className="inline-flex max-w-full items-center rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-sm text-[#1F2129]">
                        <span className="truncate">{item}</span>
                    </span>
                ))}
            </div>
        );
    };

    const renderTagPreview = (option: Pick<GroupedTagOption, 'name' | 'backgroundColor' | 'textColor'>) => (
        <span
            className="inline-flex rounded-md px-2 py-1 text-xs font-bold"
            style={{ backgroundColor: option.backgroundColor || '#F3F4F6', color: option.textColor || '#1F2129' }}
        >
            {option.name}
        </span>
    );

    const renderBadgePreview = (option: Pick<BadgeOptionConfig, 'name' | 'backgroundColor'>) => (
        <span
            className="inline-flex rounded-md px-2 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: option.backgroundColor }}
        >
            {option.name}
        </span>
    );

    const renderQuickCreateOptionPopover = ({
        fieldId,
        className,
    }: {
        fieldId: CreatableSelectFieldId;
        className?: string;
    }) => {
        if (!quickCreateOptionModal || quickCreateOptionModal.fieldId !== fieldId) return null;
        const isTagItem = quickCreateOptionModal.mode === 'tag_item';
        const isBadge = quickCreateOptionModal.mode === 'badge';
        const supportsStyleConfig = isTagItem && (fieldId === 'p_desc_tags' || fieldId === 'p_order_tags');
        const pickerHex = hsvToHex(colorPickerHue, colorPickerSaturation, colorPickerValue);
        const pickerHueColor = hsvToHex(colorPickerHue, 1, 1);

        const renderColorPickerField = (label: string, target: ColorPickerTarget) => {
            const currentColor = normalizeHexColor(target === 'background' ? quickCreateBackgroundColor : quickCreateTextColor, target === 'background' ? '#F2F2F2' : '#666666');
            const isPickerOpen = activeColorPickerTarget === target;

            return (
                <div className="relative">
                    <div className="text-[14px] font-bold text-[#1F2129]">
                        <span className="mr-1 text-[#FF4D4F]">*</span>
                        {label}
                    </div>
                    <button
                        type="button"
                        onClick={() => openColorPicker(target)}
                        className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm"
                    >
                        <span className="h-8 w-8 rounded-lg border border-gray-200" style={{ backgroundColor: currentColor }} />
                    </button>
                    {isPickerOpen && (
                        <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[470px] rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_20px_48px_rgba(15,23,42,0.18)]">
                            <div className="flex gap-3">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={event => handleColorBoardSelect(event, target)}
                                    onKeyDown={() => undefined}
                                    className="relative h-[270px] flex-1 cursor-crosshair overflow-hidden rounded-xl border border-gray-200"
                                    style={{ backgroundColor: pickerHueColor }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    <span
                                        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                                        style={{ left: `${colorPickerSaturation * 100}%`, top: `${(1 - colorPickerValue) * 100}%` }}
                                    />
                                </div>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={event => handleHueStripSelect(event, target)}
                                    onKeyDown={() => undefined}
                                    className="relative h-[270px] w-5 cursor-row-resize overflow-hidden rounded-full border border-gray-200"
                                    style={{ background: 'linear-gradient(180deg, #FF0000 0%, #FFFF00 17%, #00FF00 34%, #00FFFF 51%, #0000FF 68%, #FF00FF 85%, #FF0000 100%)' }}
                                >
                                    <span
                                        className="pointer-events-none absolute left-1/2 h-2.5 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                                        style={{ top: `${(colorPickerHue / 360) * 100}%`, backgroundColor: '#FFFFFF' }}
                                    />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                                <input
                                    className="q-form-input h-11 flex-1"
                                    value={colorPickerHexInput}
                                    onChange={e => setColorPickerHexInput(e.target.value.toUpperCase())}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleColorClear(target)}
                                    className="text-base font-bold text-[#00C06B] hover:text-[#00A35B]"
                                >
                                    清空
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleColorHexConfirm(target)}
                                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-base font-bold text-gray-500 hover:bg-gray-50"
                                >
                                    确定
                                </button>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">当前颜色：{pickerHex}</div>
                        </div>
                    )}
                </div>
            );
        };

        if (supportsStyleConfig || isBadge) {
            return (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 px-4 py-8">
                    <div className="flex max-h-[84vh] w-full max-w-[520px] flex-col overflow-visible rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <div className="text-[18px] font-bold text-[#1F2129]">{quickCreateOptionModal.title}</div>
                            <button
                                type="button"
                                onClick={closeQuickCreateOptionModal}
                                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                            <div className="space-y-4">
                                <div className="text-sm leading-6 text-gray-400">{quickCreateOptionModal.helperText}</div>
                                {quickCreateOptionModal.parentName && (
                                    <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-3 py-2 text-sm text-[#166534]">
                                        {quickCreateOptionModal.mode === 'category_item' ? '上级分类' : '上级分组'}：<span className="font-bold">{quickCreateOptionModal.parentName}</span>
                                    </div>
                                )}
                                <div>
                                    <div className="text-[14px] font-bold text-[#1F2129]">
                                        <span className="mr-1 text-[#FF4D4F]">*</span>
                                        {isBadge ? '角标名称' : '标签名称'}
                                    </div>
                                    <div className="relative mt-2">
                                        <input
                                            autoFocus
                                            className="q-form-input h-10 pr-14 text-sm"
                                            placeholder={quickCreateOptionModal.placeholder}
                                            value={quickCreateOptionDraft}
                                            maxLength={quickCreateOptionModal.maxLength}
                                            onChange={e => setQuickCreateOptionDraft(e.target.value.slice(0, quickCreateOptionModal.maxLength))}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                            {quickCreateOptionDraft.length}/{quickCreateOptionModal.maxLength}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[14px] font-bold text-[#1F2129]">
                                        <span className="mr-1 text-[#FF4D4F]">*</span>
                                        {isBadge ? '角标类型' : '标签样式'}
                                    </div>
                                    <div className="mt-2 flex items-center gap-6">
                                        {(['text', 'image'] as TagStyleType[]).map(option => (
                                            <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-[#1F2129]">
                                                <input
                                                    type="radio"
                                                    checked={quickCreateStyleType === option}
                                                    onChange={() => setQuickCreateStyleType(option)}
                                                    className="h-4 w-4 border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                />
                                                {option === 'text' ? '文字' : '图片'}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {renderColorPickerField('背景颜色', 'background')}
                                    {supportsStyleConfig && renderColorPickerField('字体颜色', 'text')}
                                </div>
                                {isBadge && (
                                    <div>
                                        <div className="text-[14px] font-bold text-[#1F2129]">
                                            <span className="mr-1 text-[#FF4D4F]">*</span>
                                            有效期
                                        </div>
                                        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] gap-2">
                                            <input type="date" className="q-form-input h-10" value={quickCreateStartDate} onChange={e => setQuickCreateStartDate(e.target.value)} />
                                            <div className="flex items-center justify-center text-sm font-bold text-gray-400">至</div>
                                            <input type="date" className="q-form-input h-10" value={quickCreateEndDate} onChange={e => setQuickCreateEndDate(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-[14px] font-bold text-[#1F2129]">预览</div>
                                    <div className="mt-2 rounded-xl border border-gray-100 bg-[#FAFAFA] px-3 py-3">
                                        {isBadge
                                            ? renderBadgePreview({ name: quickCreateOptionDraft || '角标', backgroundColor: quickCreateBackgroundColor })
                                            : renderTagPreview({ name: quickCreateOptionDraft || '标签', backgroundColor: quickCreateBackgroundColor, textColor: quickCreateTextColor })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={closeQuickCreateOptionModal}
                                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                disabled={!quickCreateOptionDraft.trim()}
                                onClick={handleConfirmQuickCreateOption}
                                className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white ${
                                    quickCreateOptionDraft.trim() ? 'bg-[#00C06B] hover:bg-[#00A35B]' : 'bg-[#BFEFD4] cursor-not-allowed'
                                }`}
                            >
                                {quickCreateOptionModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`absolute z-30 w-[360px] rounded-2xl border border-gray-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.18)] ${className || ''}`}>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div className="text-base font-black text-[#1F2129]">{quickCreateOptionModal.title}</div>
                    <button
                        type="button"
                        onClick={closeQuickCreateOptionModal}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="space-y-3 px-4 pb-4 pt-3">
                    <div className="text-xs leading-5 text-gray-400">{quickCreateOptionModal.helperText}</div>
                    {quickCreateOptionModal.parentName && (
                        <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-3 py-2 text-xs text-[#166534]">
                            {quickCreateOptionModal.mode === 'category_item' ? '上级分类' : '上级分组'}：<span className="font-bold">{quickCreateOptionModal.parentName}</span>
                        </div>
                    )}
                    <div>
                        <div className="text-sm font-bold text-[#1F2129]">
                            <span className="mr-1 text-[#FF4D4F]">*</span>
                            {quickCreateOptionModal.mode === 'category_group' ? '一级分类名称'
                                : quickCreateOptionModal.mode === 'category_item' ? '二级分类名称'
                                : quickCreateOptionModal.mode === 'tag_group' ? '标签组名称'
                                : isBadge ? '角标名称'
                                : '标签名称'}
                        </div>
                        <div className="relative mt-2">
                            <input
                                autoFocus
                                className="q-form-input pr-14"
                                placeholder={quickCreateOptionModal.placeholder}
                                value={quickCreateOptionDraft}
                                maxLength={quickCreateOptionModal.maxLength}
                                onChange={e => setQuickCreateOptionDraft(e.target.value.slice(0, quickCreateOptionModal.maxLength))}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                {quickCreateOptionDraft.length}/{quickCreateOptionModal.maxLength}
                            </span>
                        </div>
                    </div>
                    {(supportsStyleConfig || isBadge) && (
                        <div>
                            <div className="text-sm font-bold text-[#1F2129]">
                                <span className="mr-1 text-[#FF4D4F]">*</span>
                                {isBadge ? '角标类型' : '标签样式'}
                            </div>
                            <div className="mt-2 flex items-center gap-6">
                                {(['text', 'image'] as TagStyleType[]).map(option => (
                                    <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-[#1F2129]">
                                        <input
                                            type="radio"
                                            checked={quickCreateStyleType === option}
                                            onChange={() => setQuickCreateStyleType(option)}
                                            className="h-4 w-4 border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                        />
                                        {option === 'text' ? '文字' : '图片'}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    {(supportsStyleConfig || isBadge) && (
                        <div>
                            <div className="text-sm font-bold text-[#1F2129]">
                                <span className="mr-1 text-[#FF4D4F]">*</span>
                                背景颜色
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {TAG_BACKGROUND_COLOR_OPTIONS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setQuickCreateBackgroundColor(color)}
                                        className={`h-8 w-8 rounded-lg border-2 ${quickCreateBackgroundColor === color ? 'border-[#00C06B]' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {supportsStyleConfig && (
                        <div>
                            <div className="text-sm font-bold text-[#1F2129]">
                                <span className="mr-1 text-[#FF4D4F]">*</span>
                                字体颜色
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {TAG_TEXT_COLOR_OPTIONS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setQuickCreateTextColor(color)}
                                        className={`h-8 w-8 rounded-lg border-2 ${quickCreateTextColor === color ? 'border-[#00C06B]' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {isBadge && (
                        <div>
                            <div className="text-sm font-bold text-[#1F2129]">
                                <span className="mr-1 text-[#FF4D4F]">*</span>
                                有效期
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                                <input type="date" className="q-form-input" value={quickCreateStartDate} onChange={e => setQuickCreateStartDate(e.target.value)} />
                                <input type="date" className="q-form-input" value={quickCreateEndDate} onChange={e => setQuickCreateEndDate(e.target.value)} />
                            </div>
                        </div>
                    )}
                    {(supportsStyleConfig || isBadge) && (
                        <div>
                            <div className="text-sm font-bold text-[#1F2129]">预览</div>
                            <div className="mt-2">
                                {isBadge
                                    ? renderBadgePreview({ name: quickCreateOptionDraft || '角标', backgroundColor: quickCreateBackgroundColor })
                                    : renderTagPreview({ name: quickCreateOptionDraft || '标签', backgroundColor: quickCreateBackgroundColor, textColor: quickCreateTextColor })}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeQuickCreateOptionModal}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            disabled={!quickCreateOptionDraft.trim()}
                            onClick={handleConfirmQuickCreateOption}
                            className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${
                                quickCreateOptionDraft.trim() ? 'bg-[#00C06B] hover:bg-[#00A35B]' : 'bg-[#BFEFD4] cursor-not-allowed'
                            }`}
                        >
                            {quickCreateOptionModal.confirmText}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderGroupedTagSelectControl = ({
        fieldId,
        fieldLabel,
        placeholder,
    }: {
        fieldId: GroupedTagFieldId;
        fieldLabel: string;
        placeholder: string;
    }) => {
        const isOpen = activeCreatableSelect === fieldId;
        const groups = getGroupedTagOptionsByField(fieldId);
        const activeGroupId = activeGroupedTagIds[fieldId] || groups[0]?.id || null;
        const activeGroup = groups.find(group => group.id === activeGroupId) || groups[0];
        const isMulti = getGroupedTagSelectionMode(fieldId) === 'multi';
        const selectedValues = getGroupedTagDisplayNames(fieldId, dynamicFormData[fieldId]);

        return (
            <div className="relative" data-creatable-select-root="true">
                <button
                    type="button"
                    onClick={() => {
                        setActivePreviewField('default');
                        setActiveCreatableSelect(prev => prev === fieldId ? null : fieldId);
                    }}
                    className="q-form-select flex items-center justify-between gap-3 text-left text-[#1F2129] hover:border-[#00C06B]"
                >
                    <div className="min-w-0 flex-1 overflow-hidden">
                        {renderSelectionChips(selectedValues, placeholder)}
                    </div>
                    <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className="absolute z-20 mt-2 w-[680px] max-w-[calc(100vw-64px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="grid grid-cols-[260px_minmax(0,1fr)]">
                            <div className="flex min-h-[320px] flex-col border-r border-gray-100">
                                <div className="max-h-72 flex-1 overflow-y-auto p-2">
                                    {groups.map(group => {
                                        const isActive = activeGroup?.id === group.id;
                                        return (
                                            <button
                                                key={group.id}
                                                type="button"
                                                onClick={() => setActiveGroupedTagIds(prev => ({ ...prev, [fieldId]: group.id }))}
                                                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                                                    isActive ? 'bg-[#F0FDF4] font-bold text-[#00A35B]' : 'text-[#1F2129] hover:bg-[#F7F8FA]'
                                                }`}
                                            >
                                                <span className="truncate">{group.name}</span>
                                                <ChevronRight size={16} className={isActive ? 'text-[#00A35B]' : 'text-gray-300'} />
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="border-t border-gray-100 bg-[#FAFAFA] px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenTagCreateGroup(fieldId)}
                                        className="inline-flex items-center text-sm font-bold text-[#00A35B] hover:text-[#008A4D]"
                                    >
                                        <Plus size={14} className="mr-1.5" />
                                        新增标签组
                                    </button>
                                </div>
                            </div>
                            <div className="flex min-h-[320px] flex-col">
                                <div className="max-h-72 flex-1 overflow-y-auto p-2">
                                    {activeGroup?.options.length ? activeGroup.options.map(option => {
                                        const checked = isMulti ? selectedValues.includes(option.name) : dynamicFormData[fieldId] === option.name;
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isMulti) {
                                                        setDynamicFormData(prev => {
                                                            const current = normalizeStringArrayValue(prev[fieldId]);
                                                            return {
                                                                ...prev,
                                                                [fieldId]: checked ? current.filter(item => item !== option.name) : [...current, option.name],
                                                            };
                                                        });
                                                    } else {
                                                        setDynamicFormData(prev => ({ ...prev, [fieldId]: checked ? '' : option.name }));
                                                    }
                                                }}
                                                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                                                    checked ? 'bg-[#F0FDF4] font-bold text-[#00A35B]' : 'text-[#1F2129] hover:bg-[#F7F8FA]'
                                                }`}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300 bg-white'}`}>
                                                        {checked && <Check size={12} className="text-white" />}
                                                    </span>
                                                    {fieldId === 'p_stat_tags' ? <span>{option.name}</span> : renderTagPreview(option)}
                                                </span>
                                            </button>
                                        );
                                    }) : (
                                        <div className="flex min-h-[180px] items-center justify-center px-6 text-center text-sm text-gray-400">
                                            当前标签组下暂无标签，可先新增标签。
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-gray-100 bg-[#FAFAFA] px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => activeGroup && handleOpenTagCreateItem(fieldId, activeGroup)}
                                        className="inline-flex items-center text-sm font-bold text-[#00A35B] hover:text-[#008A4D]"
                                    >
                                        <Plus size={14} className="mr-1.5" />
                                        新增标签
                                    </button>
                                </div>
                            </div>
                        </div>
                        {renderQuickCreateOptionPopover({
                            fieldId,
                            className: 'right-4 top-4',
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderBadgeSelectControl = ({
        fieldLabel,
        placeholder,
    }: {
        fieldLabel: string;
        placeholder: string;
    }) => {
        const fieldId: CreatableSelectFieldId = 'p_badge';
        const isOpen = activeCreatableSelect === fieldId;
        const currentBadge = typeof dynamicFormData.p_badge === 'string' ? findBadgeOption(dynamicFormData.p_badge) : undefined;

        return (
            <div className="relative" data-creatable-select-root="true">
                <button
                    type="button"
                    onClick={() => {
                        setActivePreviewField('default');
                        setActiveCreatableSelect(prev => prev === fieldId ? null : fieldId);
                    }}
                    className="q-form-select flex items-center justify-between gap-3 text-left text-[#1F2129] hover:border-[#00C06B]"
                >
                    <div className="min-w-0 flex-1 overflow-hidden">
                        {currentBadge ? renderBadgePreview(currentBadge) : <span className="text-gray-400">{placeholder || `请选择${fieldLabel}...`}</span>}
                    </div>
                    <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className="absolute z-20 mt-2 w-[420px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="max-h-72 overflow-y-auto p-2">
                            {badgeOptions.map(option => {
                                const checked = dynamicFormData.p_badge === option.name;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            setDynamicFormData(prev => ({
                                                ...prev,
                                                p_badge: checked ? '' : option.name,
                                                p_badge_start_date: checked ? '' : option.startDate,
                                                p_badge_end_date: checked ? '' : option.endDate,
                                            }));
                                        }}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                                            checked ? 'bg-[#F0FDF4] font-bold text-[#00A35B]' : 'text-[#1F2129] hover:bg-[#F7F8FA]'
                                        }`}
                                    >
                                        <span className="space-y-2">
                                            <span className="flex items-center gap-3">
                                                <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${checked ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300 bg-white'}`}>
                                                    {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                </span>
                                                {renderBadgePreview(option)}
                                            </span>
                                            <span className="block text-xs font-normal text-gray-400">{option.startDate} 至 {option.endDate}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="border-t border-gray-100 bg-[#FAFAFA] px-4 py-3">
                            <button
                                type="button"
                                onClick={handleOpenBadgeCreate}
                                className="inline-flex items-center text-sm font-bold text-[#00A35B] hover:text-[#008A4D]"
                            >
                                <Plus size={14} className="mr-1.5" />
                                新增角标
                            </button>
                        </div>
                        {renderQuickCreateOptionPopover({
                            fieldId,
                            className: 'right-4 top-4',
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderCategorySelectControl = ({
        fieldId,
        value,
        fieldLabel,
    }: {
        fieldId: 'p_front_cat' | 'p_back_cat';
        value: string[] | string;
        fieldLabel: string;
    }) => {
        const categoryTree = getCategoryTreeByField(fieldId);
        const isOpen = activeCreatableSelect === fieldId;
        const isMultiSelect = fieldId === 'p_front_cat';
        const activeParentId = categoryPanelParentIds[fieldId] || categoryTree[0]?.id || null;
        const activeParent = categoryTree.find(item => item.id === activeParentId) || categoryTree[0];
        const secondaryCreateLabel = `新增二级${fieldId === 'p_front_cat' ? '前台分类' : '后台分类'}`;
        const selectedValues = normalizeStringArrayValue(value);
        const canCreateCategoryDefinition = !isChannelForm;

        return (
            <div className="relative" data-creatable-select-root="true">
                <button
                    type="button"
                    onClick={() => {
                        setActivePreviewField('default');
                        setActiveCreatableSelect(prev => prev === fieldId ? null : fieldId);
                        if (!categoryPanelParentIds[fieldId] && categoryTree[0]) {
                            setCategoryPanelParentIds(prev => ({ ...prev, [fieldId]: categoryTree[0].id }));
                        }
                    }}
                    className="q-form-select flex items-center justify-between text-left text-[#1F2129] hover:border-[#00C06B]"
                >
                    <div className="min-w-0 flex-1 overflow-hidden">
                        {renderSelectionChips(selectedValues, `请选择${fieldLabel}...`)}
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className="absolute z-20 mt-2 w-[680px] max-w-[calc(100vw-64px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <div className="flex min-h-[320px] flex-col border-r border-gray-100">
                                <div className="max-h-72 flex-1 overflow-y-auto p-2">
                                    {categoryTree.map(parent => {
                                        const canSelectParent = parent.children.length === 0;
                                        const selectedRoot = canSelectParent && selectedValues.includes(parent.name);
                                        const isActiveParent = activeParent?.id === parent.id;
                                        return (
                                            <button
                                                key={parent.id}
                                                type="button"
                                                onClick={() => {
                                                    setCategoryPanelParentIds(prev => ({ ...prev, [fieldId]: parent.id }));
                                                    if (parent.children.length === 0) {
                                                        handleCategoryValueSelect(fieldId, parent.id);
                                                    }
                                                }}
                                                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                                                    isActiveParent || selectedRoot
                                                        ? 'bg-[#F0FDF4] font-bold text-[#00A35B]'
                                                        : 'text-[#1F2129] hover:bg-[#F7F8FA]'
                                                }`}
                                            >
                                                <span className="flex items-center gap-3">
                                                    {canSelectParent ? (
                                                        <span
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleCategoryValueSelect(fieldId, parent.id);
                                                            }}
                                                            className={`flex h-4 w-4 items-center justify-center ${isMultiSelect ? 'rounded border' : 'rounded-full border'} ${selectedRoot ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300 bg-white'}`}
                                                        >
                                                            {selectedRoot && (isMultiSelect ? <Check size={12} className="text-white" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />)}
                                                        </span>
                                                    ) : (
                                                        <span className="h-4 w-4 shrink-0" />
                                                    )}
                                                    <span className="truncate">{parent.name}</span>
                                                </span>
                                                {parent.children.length > 0 ? (
                                                    <ChevronRight size={16} className={isActiveParent ? 'text-[#00A35B]' : 'text-gray-300'} />
                                                ) : selectedRoot ? (
                                                    <Check size={14} className="text-[#00A35B]" />
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                                {canCreateCategoryDefinition && <div className="border-t border-gray-100 bg-[#FAFAFA] px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenCategoryCreate(fieldId, 1)}
                                        className="inline-flex items-center text-sm font-bold text-[#00A35B] hover:text-[#008A4D]"
                                    >
                                        <Plus size={14} className="mr-1.5" />
                                        新增一级{fieldId === 'p_front_cat' ? '前台分类' : '后台分类'}
                                    </button>
                                </div>}
                            </div>
                            <div className="flex min-h-[320px] flex-col">
                                <div className="max-h-72 flex-1 overflow-y-auto p-2">
                                    {activeParent?.children.length ? activeParent.children.map(child => {
                                        const selectedLeaf = selectedValues.includes(buildCategoryValue(activeParent.name, child.name));
                                        return (
                                            <button
                                                key={child.id}
                                                type="button"
                                                onClick={() => handleCategoryValueSelect(fieldId, activeParent.id, child.id)}
                                                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                                                    selectedLeaf ? 'bg-[#F0FDF4] font-bold text-[#00A35B]' : 'text-[#1F2129] hover:bg-[#F7F8FA]'
                                                }`}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <span className={`flex h-4 w-4 items-center justify-center ${isMultiSelect ? 'rounded border' : 'rounded-full border'} ${selectedLeaf ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300 bg-white'}`}>
                                                        {selectedLeaf && (isMultiSelect ? <Check size={12} className="text-white" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />)}
                                                    </span>
                                                    <span className="truncate">{child.name}</span>
                                                </span>
                                                {selectedLeaf && (isMultiSelect ? <Check size={14} className="text-[#00A35B]" /> : <span className="h-2.5 w-2.5 rounded-full bg-[#00A35B]" />)}
                                            </button>
                                        );
                                    }) : (
                                        <div className="flex min-h-[180px] items-center justify-center px-6 text-center text-sm text-gray-400">
                                            {canCreateCategoryDefinition
                                                ? '当前一级分类下暂无二级分类，可直接选择一级分类或新增二级分类。'
                                                : '当前一级分类下暂无二级分类，可直接选择一级分类。分类定义请在商品主档维护。'}
                                        </div>
                                    )}
                                </div>
                                {canCreateCategoryDefinition && <div className="border-t border-gray-100 bg-[#FAFAFA] px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenCategoryCreate(fieldId, 2, activeParent)}
                                        className="inline-flex items-center text-sm font-bold text-[#00A35B] hover:text-[#008A4D]"
                                    >
                                        <Plus size={14} className="mr-1.5" />
                                        {secondaryCreateLabel}
                                    </button>
                                </div>}
                            </div>
                        </div>
                        {canCreateCategoryDefinition && renderQuickCreateOptionPopover({
                            fieldId,
                            className: 'right-4 top-4',
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderDynamicInput = (field: DynamicFieldConfig & { isRequiredConfig: boolean }) => {
        const value = dynamicFormData[field.id] || '';
        const setValue = (v: any) => setDynamicFormData(prev => ({ ...prev, [field.id]: v }));
        const fieldLabel = getFieldDisplayLabel(field);
        const previewField: PreviewField = ['p_name', 'p_img', 'p_list_desc', 'm_methods', 'a_addons'].includes(field.id)
            ? field.id as PreviewField
            : 'default';
        const setPreview = () => setActivePreviewField(previewField);
        
        if (field.id === 'p_cat') {
             return (
                 <div className="relative">
                     <button
                        type="button"
                        onClick={() => {
                            setPreview();
                            setShowCategoryPickerModal(true);
                        }}
                        className="q-form-select text-left text-[#1F2129] hover:border-[#00C06B]"
                     >
                        {currentCategory.name}
                     </button>
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

        if (field.id === 'p_applicable_people') {
            return (
                <div className="relative">
                    <input
                        onFocus={setPreview}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="q-form-input pr-12"
                        placeholder="请输入适用人数"
                        value={value ?? ''}
                        onChange={e => {
                            const rawValue = e.target.value;
                            if (/^\d*$/.test(rawValue)) setValue(rawValue);
                        }}
                        onBlur={() => {
                            if (value === '' || value === undefined || value === null) return;
                            setValue(String(Math.max(1, Math.floor(Number(value) || 1))));
                        }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">人</span>
                </div>
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
            const enabledDisplayTypeIds = new Set(getEnabledChildIds('p_display_type', [
                'blind_box',
                'display_product',
                'group_meal',
                'group_meal_only',
                'pos_edit_price',
                'temp_product',
                'market_price_product',
                'children_meal',
            ]));
            if (isComboProduct) {
                const isBlindBox = selectedTypes.includes('blind_box');
                const isGroupMeal = selectedTypes.includes('group_meal');
                const isGroupMealOnly = selectedTypes.includes('group_meal_only');
                const toggleType = (typeKey: string, checked: boolean) => {
                    let nextValue = checked
                        ? [...selectedTypes, typeKey]
                        : selectedTypes.filter(item => item !== typeKey);

                    if (typeKey === 'group_meal' && !checked) {
                        nextValue = nextValue.filter(item => item !== 'group_meal_only');
                    }

                    const normalizedValue = Array.from(new Set(nextValue));
                    setValue(normalizedValue);
                    if (typeKey === 'group_meal' || typeKey === 'group_meal_only') {
                        const nextGroupMealOnly = typeKey === 'group_meal_only'
                            ? checked
                            : normalizedValue.includes('group_meal_only');
                        setDynamicFormData(prev => ({
                            ...prev,
                            s_sale_mode: nextGroupMealOnly ? '仅团餐业务售卖' : '正常售卖',
                        }));
                    }
                };
                return (
                    <div className="rounded-2xl bg-[#FAFAFA] border border-gray-200 p-4 space-y-4">
                        {[
                            {
                                key: 'blind_box',
                                label: '是否为盲盒商品',
                                desc: '开启后，支持设置盲盒商品，适用于套餐盲盒等特殊售卖场景。',
                                active: isBlindBox,
                            },
                            {
                                key: 'group_meal',
                                label: '是否为团餐商品',
                                desc: '开启后，可用于团餐或统一套餐业务场景。',
                                active: isGroupMeal,
                            },
                        ].filter(option => enabledDisplayTypeIds.has(option.key)).map(option => (
                            <label key={option.key} className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    checked={option.active}
                                    onChange={() => toggleType(option.key, !option.active)}
                                />
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-[#1F2129]">{option.label}</div>
                                    <div className="mt-1 text-xs leading-5 text-gray-400">{option.desc}</div>
                                </div>
                            </label>
                        ))}
                        {isGroupMeal && enabledDisplayTypeIds.has('group_meal_only') && (
                            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                        checked={isGroupMealOnly}
                                        onChange={() => toggleType('group_meal_only', !isGroupMealOnly)}
                                    />
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-[#1F2129]">是否仅团餐业务售卖</div>
                                        <div className="mt-1 text-xs leading-5 text-gray-400">开启后，该套餐仅在团餐业务中展示和售卖。</div>
                                    </div>
                                </label>
                                <div className="mt-3 border-t border-gray-100 pt-3">
                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                        <Switch active={isGroupMealOnly} onClick={() => toggleType('group_meal_only', !isGroupMealOnly)} />
                                        <span>{isGroupMealOnly ? '已开启' : '未开启'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            return (
                <div className="rounded-2xl bg-[#FAFAFA] border border-gray-200 p-4 space-y-4">
                    {DISPLAY_TYPE_OPTIONS.filter(option => enabledDisplayTypeIds.has(option.key)).map(option => {
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
                        placeholder="请输入商品皮重"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">克</span>
                </div>
            );
        }

        if (field.id === 'p_front_cat' || field.id === 'p_back_cat') {
            return renderCategorySelectControl({ fieldId: field.id, value, fieldLabel });
        }

        if (field.id === 'p_stat_tags') {
            return renderGroupedTagSelectControl({
                fieldId: 'p_stat_tags',
                fieldLabel,
                placeholder: `请选择${fieldLabel}...`,
            });
        }

        switch (field.type) {
           case 'input': return (
               <div className="relative">
                   <input
                       onFocus={setPreview}
                       className="q-form-input"
                       placeholder={field.placeholder || `请输入${fieldLabel}`}
                       value={value}
                       onChange={e => setValue(e.target.value)}
                   />
                   {['p_name', 'p_code'].includes(field.id) && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">{String(value).length}/70</span>}
               </div>
           );
           case 'number': return MONEY_FIELD_IDS.has(field.id) ? (<div className="relative"><input onFocus={setPreview} type="number" className="q-form-input pl-8" placeholder="0.00" value={value} onChange={e => setValue(e.target.value)} /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span></div>) : (<input onFocus={setPreview} type="number" className="q-form-input" placeholder={field.placeholder || `请输入${fieldLabel}`} value={value} onChange={e => setValue(e.target.value)} />);
           case 'selector': return (
                   <select onFocus={setPreview} className="q-form-select" value={value} onChange={e => setValue(e.target.value)}>
                       <option value="">请选择{fieldLabel}...</option>
                       {(field.presetValues || ['选项一', '选项二']).map(option => <option key={option} value={option}>{option}</option>)}
                   </select>
               );
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

    const channelSpecValues = useMemo(() => {
        const valueMap = new Map<string, number>();
        visibleSpecRows.forEach(row => {
            row.s_spec_name.split(' / ').map(value => value.trim()).filter(Boolean).forEach(value => {
                valueMap.set(value, (valueMap.get(value) || 0) + 1);
            });
        });
        return Array.from(valueMap.entries()).map(([value, affectedSkuCount]) => ({ value, affectedSkuCount }));
    }, [visibleSpecRows]);

    const isChannelSkuEnabled = (row: SpecConfigRow) => (
        row.s_spec_name.split(' / ').map(value => value.trim()).filter(Boolean)
            .every(value => !disabledChannelSpecValues.includes(value))
    );

    const requestChannelSpecValueToggle = (value: string, affectedSkuCount: number) => {
        setPendingChannelSpecValueToggle({
            value,
            affectedSkuCount,
            nextDisabled: !draftDisabledChannelSpecValues.includes(value),
        });
    };

    const confirmChannelSpecValueToggle = () => {
        if (!pendingChannelSpecValueToggle) return;
        setDraftDisabledChannelSpecValues(prev => pendingChannelSpecValueToggle.nextDisabled
            ? Array.from(new Set([...prev, pendingChannelSpecValueToggle.value]))
            : prev.filter(value => value !== pendingChannelSpecValueToggle.value));
        setPendingChannelSpecValueToggle(null);
    };

    const openChannelSpecValueModal = () => {
        setDraftDisabledChannelSpecValues(disabledChannelSpecValues);
        setShowChannelSpecValueModal(true);
    };

    const closeChannelSpecValueModal = () => {
        setPendingChannelSpecValueToggle(null);
        setShowChannelSpecValueModal(false);
    };

    const saveChannelSpecValueSettings = () => {
        setDisabledChannelSpecValues(draftDisabledChannelSpecValues);
        setShowChannelSpecValueModal(false);
    };

    const createSpecBulkDraft = (key: SpecBulkEditorKey): Record<string, string | boolean> => {
        switch (key) {
            case 'inventory_mode':
                return { inventoryMode: 'unlimited' };
            case 'stock':
                return { initialStock: '', maxStock: '', autoRestock: false };
            case 'plan_stock_toggle':
                return { managePlanStock: true };
            case 'daily_plan_stock':
                return { dailyPlanStock: '' };
            case 'amount':
                return { amount: '', unit: '份' };
            default:
                return { value: '' };
        }
    };

    const openSpecBulkEditor = (key: SpecBulkEditorKey) => {
        setActivePreviewField('s_specs');
        setActiveSpecBulkField(prev => {
            if (prev === key) {
                setSpecBulkDraft({});
                return null;
            }
            setSpecBulkDraft(createSpecBulkDraft(key));
            return key;
        });
    };

    const applyBulkToVisibleSpecRows = (updater: (row: SpecConfigRow) => SpecConfigRow) => {
        const visibleIds = new Set(visibleSpecRows.map(row => row.id));
        setSpecConfigRows(prev => prev.map(row => (visibleIds.has(row.id) ? updater(row) : row)));
    };

    const applySpecBulkEdit = () => {
        if (!activeSpecBulkField) return;

        switch (activeSpecBulkField) {
            case 's_spec_price':
            case 's_spec_cost':
            case 's_spec_market':
            case 's_spec_barcode':
            case 's_spec_mark':
            case 's_spec_sku_code':
            case 's_spec_code':
            case 's_spec_alias':
            case 's_spec_store_pack_fee':
            case 's_spec_store_pack_mark':
            case 's_spec_take_pack_fee':
            case 's_spec_take_pack_mark': {
                const value = String(specBulkDraft.value ?? '');
                applyBulkToVisibleSpecRows(row => ({ ...row, [activeSpecBulkField]: value }));
                break;
            }
            case 'inventory_mode': {
                const inventoryMode = (specBulkDraft.inventoryMode === 'custom' ? 'custom' : 'unlimited') as InventoryMode;
                applyBulkToVisibleSpecRows(row => ({
                    ...row,
                    s_spec_inventory_mode: inventoryMode,
                    ...(inventoryMode === 'unlimited'
                        ? {
                            s_spec_initial_stock: '',
                            s_spec_max_stock: '',
                            s_spec_auto_restock: false,
                        }
                        : {}),
                }));
                break;
            }
            case 'stock': {
                const initialStock = String(specBulkDraft.initialStock ?? '');
                const maxStock = String(specBulkDraft.maxStock ?? '');
                const autoRestock = !!specBulkDraft.autoRestock;
                applyBulkToVisibleSpecRows(row => ({
                    ...row,
                    s_spec_inventory_mode: 'custom',
                    s_spec_initial_stock: initialStock,
                    s_spec_max_stock: maxStock,
                    s_spec_auto_restock: autoRestock,
                }));
                break;
            }
            case 'plan_stock_toggle': {
                const managePlanStock = !!specBulkDraft.managePlanStock;
                applyBulkToVisibleSpecRows(row => ({
                    ...row,
                    s_spec_manage_plan_stock: managePlanStock,
                    s_spec_daily_plan_stock: managePlanStock ? row.s_spec_daily_plan_stock : '',
                }));
                break;
            }
            case 'daily_plan_stock': {
                const dailyPlanStock = String(specBulkDraft.dailyPlanStock ?? '');
                applyBulkToVisibleSpecRows(row => ({
                    ...row,
                    s_spec_manage_plan_stock: true,
                    s_spec_daily_plan_stock: dailyPlanStock,
                }));
                break;
            }
            case 'amount': {
                const amount = String(specBulkDraft.amount ?? '');
                const unit = String(specBulkDraft.unit ?? '份');
                applyBulkToVisibleSpecRows(row => ({
                    ...row,
                    s_spec_amount: amount,
                    s_spec_amount_unit: unit,
                }));
                break;
            }
        }

        setActiveSpecBulkField(null);
        setSpecBulkDraft({});
    };

    const scrollToSpecSection = (sectionKey: SpecConfigModuleKey) => {
        setActiveSpecConfigModule(sectionKey);
        const container = specTableScrollRef.current;
        const target = specSectionHeaderRefs.current[sectionKey];
        if (!container || !target) return;
        const nextLeft = Math.max(0, target.offsetLeft - 220);
        container.scrollTo({ left: nextLeft, behavior: 'smooth' });
    };

    const handleSpecTableScroll = () => {
        const container = specTableScrollRef.current;
        if (!container) return;
        const sectionMarker = container.scrollLeft + 260;
        let nextSection: SpecConfigModuleKey = 'price';
        SPEC_CONFIG_MODULES.forEach(module => {
            const header = specSectionHeaderRefs.current[module.key];
            if (header && sectionMarker >= header.offsetLeft) {
                nextSection = module.key;
            }
        });
        setActiveSpecConfigModule(nextSection);
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

        const renderGroupedTagField = (label: string, fieldId: GroupedTagFieldId, placeholder: string) => (
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                <div className="pt-2 text-sm font-bold text-[#1F2129]">{label}</div>
                {renderGroupedTagSelectControl({
                    fieldId,
                    fieldLabel: label,
                    placeholder,
                })}
            </div>
        );

        const renderBadgeField = (label: string, placeholder: string) => (
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                <div className="pt-2 text-sm font-bold text-[#1F2129]">{label}</div>
                {renderBadgeSelectControl({ fieldLabel: label, placeholder })}
            </div>
        );

        const showMainImage = !isUnifiedForm && isFieldRendered('p_img');
        const showListDesc = isFieldRendered('p_list_desc');
        const showDescTags = isFieldRendered('p_desc_tags');
        const showOrderTags = isFieldRendered('p_order_tags');
        const showBadge = isFieldRendered('p_badge');
        const showBadgeDate = isFieldRendered('p_badge_date');
        const showRichDesc = isFieldRendered('p_rich_desc');
        const showDisplayListGroup = showMainImage || showListDesc || showDescTags || showOrderTags || showBadge || showBadgeDate;
        const showDisplayDetailGroup = showRichDesc || expandedDisplayDetailFields.length > 0;

        return (
            <div className="space-y-2.5">
                {showDisplayListGroup && (
                    <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-3 space-y-2">
                        <div>
                            <div className="text-base font-black text-[#1F2129]">列表页展示</div>
                            <div className="mt-1 text-xs text-gray-400">以下配置会直接展示在小程序商品列表页。</div>
                        </div>

                        <div className="space-y-2 rounded-2xl bg-white p-3">
                            {showMainImage && renderDisplayMainImageField({ compact: true })}

                            {showListDesc && (
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
                            )}

                            {showDescTags && renderGroupedTagField('描述标签', 'p_desc_tags', '请选择描述标签')}
                            {showOrderTags && renderGroupedTagField('点单标签', 'p_order_tags', '请选择点单标签')}

                            <div className="pt-1 space-y-2.5">
                                {showBadge && renderBadgeField('商品角标', '请选择角标')}
                                {showBadgeDate && (
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
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showDisplayDetailGroup && (
                    <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-3 space-y-2">
                        <div>
                            <div className="text-base font-black text-[#1F2129]">详情页展示</div>
                            <div className="mt-1 text-xs text-gray-400">以下配置会直接展示在小程序商品详情页。</div>
                        </div>

                        <div className="space-y-2 rounded-2xl bg-white p-3">
                            {showRichDesc && (
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
                            )}

                            <div className="pt-1 space-y-2.5">
                                {expandedDisplayDetailFields.length > 0 && (
                                    <>
                                        {expandedDisplayDetailFields.includes('p_detail_bottom_img') && (
                                            <>
                                                {renderDisplayUploadField({
                                                    fieldId: 'p_detail_bottom_img',
                                                    label: '商品详情页底图',
                                                    tip: '图片将在规格做法加料区下方展示，建议尺寸：高度不限，宽度建议 690。',
                                                    widthClass: 'h-28 w-36',
                                                })}
                                            </>
                                        )}
                                        {expandedDisplayDetailFields.includes('p_video') && (
                                            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 items-start">
                                                <div className="pt-2 text-sm font-bold text-[#1F2129]">商品视频</div>
                                                <div className="space-y-2">
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
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
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
        const pointsExchangeEnabled = !!dynamicFormData.p_points_exchange_rule;

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
            <div className="space-y-2.5">
                {(isFieldEnabled('s_min_purchase_toggle') || isFieldEnabled('s_max_purchase_toggle') || isFieldEnabled('s_time_sale_toggle')) && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2.5">
                        {isFieldEnabled('s_min_purchase_toggle') && renderSwitchRow('起购数量', 's_min_purchase_toggle', 's_min_purchase_value', '请输入起购数量')}
                        {isFieldEnabled('s_max_purchase_toggle') && renderSwitchRow('限购数量', 's_max_purchase_toggle', 's_max_purchase_value', '请输入限购数量')}
                        {isFieldEnabled('s_time_sale_toggle') && renderSwitchRow('分时段销售', 's_time_sale_toggle', 's_time_sale_rule', '例如：工作日 10:00-14:00 / 17:00-21:00')}
                    </div>
                )}

                {!isComboProduct && isFieldEnabled('s_sale_mode') && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                        <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                            <div className="pt-1 text-sm font-bold text-[#1F2129]">售卖方式</div>
                            <div>
                                <div className="flex flex-wrap gap-x-8 gap-y-2">
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
                    </div>
                )}

                {isFieldEnabled('s_takeout_rule') && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                        <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                            <div className="pt-1 text-sm font-bold text-[#1F2129]">外带设置</div>
                            <div className="rounded-2xl bg-[#FAFAFA] p-3.5">
                                <div className="text-sm font-bold text-[#1F2129]">外带显示规则</div>
                                <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
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

                <div className="pt-1 space-y-2">
                    {expandedSalesFields.length > 0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2.5">
                                {expandedSalesFields.includes('s_sale_settings') && isFieldEnabled('s_sale_settings') && (
                                    <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">售卖设置</div>
                                        <div className="rounded-2xl bg-[#FAFAFA] p-3.5 space-y-2.5">
                                            {[
                                                {
                                                    key: '单点不送',
                                                    desc: '开启后，外卖单点该商品无法下单，需配合其他商品才可下单，常用于饮料等底价小件商品'
                                                },
                                                {
                                                    key: '是否双拼',
                                                    desc: '开启后，套餐商品支持双拼，小程序端用户可在随心配分组中一次需要选择两份商品进行下单'
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
                                {expandedSalesFields.includes('s_tax_rate') && isFieldEnabled('s_tax_rate') && (
                                    <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">税率</div>
                                        <div className="rounded-2xl bg-[#FAFAFA] p-3.5 space-y-2.5">
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

                                            {taxRate && (
                                                <>
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
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {expandedSalesFields.includes('p_points_exchange_rule') && isFieldEnabled('p_points_exchange_rule') && (
                                    <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">积分兑换规则</div>
                                        <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] px-3.5 py-3.5 space-y-2">
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
                                    </div>
                                )}
                                {expandedSalesFields.includes('s_jump_third_mini_program') && (
                                    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
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
                                    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
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
                                    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
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
                    )}
                </div>
            </div>
        );
    };

    const renderOthersAttributePanel = () => {
        const baseSales = dynamicFormData.o_base_sales || '0';
        const moreBarcodes = dynamicFormData.o_more_barcodes || '';
        const shareTitle = dynamicFormData.o_share_title || '';
        const shareImage = dynamicFormData.o_share_image || '';
        const otherDynamicFields = AVAILABLE_DYNAMIC_FIELDS.filter(field => (
            field.module === 'others'
            && visibleFieldIds.has(field.id)
            && !['o_more_settings', 'o_base_sales', 'o_more_barcodes', 'o_product_share'].includes(field.id)
        ));
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
            <div className="space-y-2.5">
                {otherDynamicFields.length > 0 && (
                    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                        {otherDynamicFields.map(field => {
                            const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                            const isInheritedReadonly = isChannelFieldReadonly(field.id);
                            return (
                                <div key={field.id} id={`field-${field.id}`} className="relative">
                                    {isInheritedReadonly && (
                                        <span className="absolute right-0 top-0 z-[1] text-[11px] font-medium text-gray-400">继承主档，不可修改</span>
                                    )}
                                    <fieldset disabled={isInheritedReadonly} className={isInheritedReadonly ? 'opacity-65' : ''}>
                                    <FormRow label={getFieldDisplayLabel(field)} required={isRequired} description={getFieldDescription(field)} descriptionPlacement="bottom">
                                        {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                    </FormRow>
                                    </fieldset>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="pt-1 space-y-2">
                    {expandedOtherSections.length > 0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2.5">
                                {expandedOtherSections.includes('o_more_settings') && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">更多设置</div>
                                        <div className="rounded-2xl bg-[#FAFAFA] p-3.5 space-y-2.5">
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
                                )}
                                {expandedOtherSections.includes('o_base_sales') && (
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 items-start">
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
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 items-start">
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
                                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 items-start">
                                        <div className="pt-1 text-sm font-bold text-[#1F2129]">商品分享</div>
                                        <div className="rounded-2xl bg-[#FAFAFA] p-3.5 space-y-2.5">
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
                    )}
                </div>
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
            : (specDisplayMode === 'multi' ? ['待选择规格'] : ['标准规格']);
        const primarySpecPrice = visibleSpecRows[0]?.s_spec_price || '--';
        const currentPreviewPreference = previewPreference ?? defaultPreviewPreference;

        return (
            <div className="w-full min-w-0 bg-white border-r border-[#E8E8E8] p-4 overflow-y-auto">
                <div className="rounded-2xl overflow-hidden border border-[#12B76A]/20 shadow-sm">
                    <div className="bg-[#12B76A] px-4 py-3 text-white">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-xl font-black">效果示例</div>
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
                            <div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-400 border border-gray-200">
                                {currentPreviewPreference === 'collapsed' ? '默认收起' : '默认展开'}
                            </div>
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

    const renderSpecConfigTable = (options: { embedded?: boolean; title?: string } = {}) => {
        const embedded = options.embedded ?? false;
        const panelTitle = options.title || '规格设置';
        const specCount = visibleSpecRows.length;
        if (isChannelForm) {
            return (
                <div className={embedded ? 'space-y-4' : 'rounded-lg border border-gray-200 bg-white p-4 space-y-4'}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-bold text-[#1F2129]">{panelTitle}</div>
                            <div className="mt-1 text-xs leading-5 text-gray-400">
                                规格结构和识别字段继承商品主档。渠道按规格值控制可售范围，并维护各 SKU 的销售价、市场价、库存和包装配置。
                            </div>
                        </div>
                        <span className="shrink-0 rounded bg-[#F2F4F7] px-2 py-1 text-xs text-[#667085]">共 {channelSpecValues.length} 个规格值 · {specCount} 个 SKU</span>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-bold text-[#1F2129]">SKU 销售配置</div>
                                <div className="mt-1 text-xs text-gray-400">识别字段只读；销售、库存和包装字段可维护</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-[#667085]">已禁用 {disabledChannelSpecValues.length} 个规格值</span>
                                <button type="button" onClick={openChannelSpecValueModal} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#344054] hover:border-[#00B460] hover:text-[#008F4C]">配置规格值</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-[2200px] w-full border-collapse">
                                <thead className="bg-[#F7F8FA]">
                                    <tr className="text-left text-xs font-medium text-[#667085]">
                                        <th className="sticky left-0 z-10 w-[190px] border-b border-r border-gray-200 bg-[#F7F8FA] px-3 py-3">规格组合</th>
                                        <th className="w-[150px] border-b border-gray-200 px-3 py-3">渠道销售价</th>
                                        <th className="w-[150px] border-b border-gray-200 px-3 py-3">市场价</th>
                                        <th className="w-[150px] border-b border-gray-200 px-3 py-3">商品标识</th>
                                        <th className="w-[170px] border-b border-gray-200 px-3 py-3">商品规格码</th>
                                        <th className="w-[170px] border-b border-gray-200 px-3 py-3">商品编码</th>
                                        <th className="w-[190px] border-b border-gray-200 px-3 py-3">商品条码</th>
                                        <th className="w-[260px] border-b border-gray-200 px-3 py-3">库存管理</th>
                                        <th className="w-[320px] border-b border-gray-200 px-3 py-3">包装费与包装标识</th>
                                        <th className="w-[140px] border-b border-gray-200 px-3 py-3">可售结果</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleSpecRows.map(row => {
                                        const enabled = isChannelSkuEnabled(row);
                                        const disabledValues = row.s_spec_name.split(' / ').filter(value => disabledChannelSpecValues.includes(value));
                                        return (
                                            <tr key={row.id} className="text-[13px] text-[#1F2129]">
                                                <td className="sticky left-0 z-[5] border-b border-r border-gray-100 bg-white px-3 py-3 font-medium shadow-[8px_0_12px_-10px_rgba(15,23,42,0.18)]">{row.s_spec_name}</td>
                                                <td className="border-b border-gray-100 px-3 py-3">
                                                    <div className="relative w-[120px]">
                                                        <input type="number" value={row.s_spec_channel_price ?? row.s_spec_price} onChange={event => updateSpecConfigRow(row.id, 's_spec_channel_price', event.target.value)} className="h-8 w-full rounded-md border border-gray-200 bg-white px-3 pr-7 outline-none focus:border-[#00C06B]" />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">元</span>
                                                    </div>
                                                </td>
                                                <td className="border-b border-gray-100 px-3 py-3">
                                                    <div className="relative w-[120px]">
                                                        <input type="number" value={row.s_spec_market} onChange={event => updateSpecConfigRow(row.id, 's_spec_market', event.target.value)} className="h-8 w-full rounded-md border border-gray-200 bg-white px-3 pr-7 outline-none focus:border-[#00C06B]" />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">元</span>
                                                    </div>
                                                </td>
                                                {[row.s_spec_mark, row.s_spec_sku_code, row.s_spec_code, row.s_spec_barcode].map((value, index) => (
                                                    <td key={`${row.id}-identity-${index}`} className="border-b border-gray-100 px-3 py-3 text-[#667085]">
                                                        <div className="max-w-[170px] truncate" title={value || '--'}>{value || '--'}</div>
                                                        <div className="mt-1 text-[11px] text-gray-400">主档只读</div>
                                                    </td>
                                                ))}
                                                <td className="border-b border-gray-100 px-3 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <select value={row.s_spec_inventory_mode} onChange={event => updateSpecConfigRow(row.id, 's_spec_inventory_mode', event.target.value as InventoryMode)} className="h-8 w-[104px] rounded-md border border-gray-200 bg-white px-2 outline-none focus:border-[#00C06B]">
                                                            <option value="unlimited">不限库存</option>
                                                            <option value="custom">管理库存</option>
                                                        </select>
                                                        {row.s_spec_inventory_mode === 'custom' && <input type="number" value={row.s_spec_initial_stock} onChange={event => updateSpecConfigRow(row.id, 's_spec_initial_stock', event.target.value)} className="h-8 w-[76px] rounded-md border border-gray-200 px-2 text-center outline-none focus:border-[#00C06B]" aria-label={`${row.s_spec_name}库存值`} />}
                                                        {row.s_spec_inventory_mode === 'custom' && <span className="text-xs text-gray-400">件</span>}
                                                    </div>
                                                </td>
                                                <td className="border-b border-gray-100 px-3 py-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex items-center gap-1"><span className="w-10 text-xs text-gray-400">外带</span><input type="number" value={row.s_spec_store_pack_fee} onChange={event => updateSpecConfigRow(row.id, 's_spec_store_pack_fee', event.target.value)} className="h-8 w-16 rounded-md border border-gray-200 px-2 text-center outline-none focus:border-[#00C06B]" /><input value={row.s_spec_store_pack_mark} onChange={event => updateSpecConfigRow(row.id, 's_spec_store_pack_mark', event.target.value)} className="h-8 min-w-0 flex-1 rounded-md border border-gray-200 px-2 outline-none focus:border-[#00C06B]" placeholder="包装标识" /></div>
                                                        <div className="flex items-center gap-1"><span className="w-10 text-xs text-gray-400">外卖</span><input type="number" value={row.s_spec_take_pack_fee} onChange={event => updateSpecConfigRow(row.id, 's_spec_take_pack_fee', event.target.value)} className="h-8 w-16 rounded-md border border-gray-200 px-2 text-center outline-none focus:border-[#00C06B]" /><input value={row.s_spec_take_pack_mark} onChange={event => updateSpecConfigRow(row.id, 's_spec_take_pack_mark', event.target.value)} className="h-8 min-w-0 flex-1 rounded-md border border-gray-200 px-2 outline-none focus:border-[#00C06B]" placeholder="包装标识" /></div>
                                                    </div>
                                                </td>
                                                <td className="border-b border-gray-100 px-3 py-3">
                                                    <span className={enabled ? 'text-[#008F4C]' : 'text-gray-400'}>{enabled ? '可售' : '不可售'}</span>
                                                    {!enabled && <div className="mt-1 text-[11px] text-gray-400">因 {disabledValues.join('、')} 禁用</div>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="text-xs leading-5 text-gray-400">主档新增的规格值默认在当前商品库禁用；主档停用规格值时，渠道侧同步不可售且不可重新开启。</div>

                    {showChannelSpecValueModal && (
                        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-6">
                            <div className="flex max-h-[720px] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
                                    <div>
                                        <div className="text-base font-bold text-[#1F2129]">配置规格值可售范围</div>
                                        <div className="mt-1 text-xs leading-5 text-gray-400">关闭规格值后，所有包含该规格值的 SKU 均不可在当前商品库售卖。</div>
                                    </div>
                                    <button type="button" onClick={closeChannelSpecValueModal} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100" aria-label="关闭规格值配置">×</button>
                                </div>
                                <div className="overflow-y-auto px-6 py-5">
                                    <div className="mb-3 flex items-center justify-between text-xs text-[#667085]">
                                        <span>共 {channelSpecValues.length} 个规格值</span>
                                        <span>本次已禁用 {draftDisabledChannelSpecValues.length} 个</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {channelSpecValues.map(item => {
                                            const disabled = draftDisabledChannelSpecValues.includes(item.value);
                                            return (
                                                <div key={item.value} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium text-[#1F2129]">{item.value}</div>
                                                        <div className="mt-1 text-xs text-gray-400">关联 {item.affectedSkuCount} 个 SKU</div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <Switch active={!disabled} onClick={() => requestChannelSpecValueToggle(item.value, item.affectedSkuCount)} />
                                                        <span className={disabled ? 'text-xs text-gray-400' : 'text-xs text-[#008F4C]'}>{disabled ? '已禁用' : '可售'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                                    <button type="button" onClick={closeChannelSpecValueModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-[#475467]">取消</button>
                                    <button type="button" onClick={saveChannelSpecValueSettings} className="rounded-lg bg-[#00B460] px-4 py-2 text-sm font-medium text-white">保存配置</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {pendingChannelSpecValueToggle && (
                        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-6">
                            <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
                                <div className="border-b border-gray-100 px-6 py-5 text-base font-bold text-[#1F2129]">
                                    {pendingChannelSpecValueToggle.nextDisabled ? '确认禁用规格值' : '确认启用规格值'}
                                </div>
                                <div className="px-6 py-5 text-sm leading-6 text-[#475467]">
                                    {pendingChannelSpecValueToggle.nextDisabled
                                        ? `禁用“${pendingChannelSpecValueToggle.value}”后，当前商品库中包含该规格值的 ${pendingChannelSpecValueToggle.affectedSkuCount} 个 SKU 将全部不可售。`
                                        : `启用“${pendingChannelSpecValueToggle.value}”后，包含该规格值且未被其他规格值禁用的 SKU 将恢复可售。`}
                                </div>
                                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                                    <button type="button" onClick={() => setPendingChannelSpecValueToggle(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-[#475467]">取消</button>
                                    <button type="button" onClick={confirmChannelSpecValueToggle} className={pendingChannelSpecValueToggle.nextDisabled ? 'rounded-lg bg-[#D92D20] px-4 py-2 text-sm font-medium text-white' : 'rounded-lg bg-[#00B460] px-4 py-2 text-sm font-medium text-white'}>{pendingChannelSpecValueToggle.nextDisabled ? '确认禁用' : '确认启用'}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        const priceFilledCount = visibleSpecRows.filter(row => String(row.s_spec_price || '').trim() !== '').length;
        const identityFilledCount = visibleSpecRows.filter(row => [row.s_spec_mark, row.s_spec_sku_code, row.s_spec_barcode].some(value => String(value || '').trim() !== '')).length;
        const customInventoryCount = visibleSpecRows.filter(row => row.s_spec_inventory_mode === 'custom').length;
        const uploadedImageCount = visibleSpecRows.filter(row => !!row.s_spec_img || !!row.s_spec_large_img).length;
        const packagingFilledCount = visibleSpecRows.filter(row => String(row.s_spec_store_pack_fee || '').trim() !== '' || String(row.s_spec_take_pack_fee || '').trim() !== '').length;
        const moduleStatusMap: Record<SpecConfigModuleKey, string> = {
            price: `${priceFilledCount}/${Math.max(specCount, 1)} 已填写`,
            identity: `${identityFilledCount}/${Math.max(specCount, 1)} 已配置`,
            inventory: `${customInventoryCount} 个自定义库存`,
            info: `${uploadedImageCount}/${Math.max(specCount, 1)} 已上传图片`,
            packaging: `${packagingFilledCount}/${Math.max(specCount, 1)} 已设置`,
        };
        const bulkFieldMeta: Record<SpecBulkEditorKey, { title: string }> = {
            s_spec_price: { title: '批量修改基础价格' },
            s_spec_cost: { title: '批量修改预估成本' },
            s_spec_market: { title: '批量修改市场价' },
            s_spec_barcode: { title: '批量修改商品条码' },
            s_spec_mark: { title: '批量修改商品标识' },
            s_spec_sku_code: { title: '批量修改商品规格码' },
            s_spec_code: { title: '批量修改商品编码' },
            inventory_mode: { title: '批量修改库存设置' },
            stock: { title: '批量修改初始库存' },
            plan_stock_toggle: { title: '批量修改计划库存开关' },
            daily_plan_stock: { title: '批量修改每日计划库存' },
            s_spec_alias: { title: '批量修改规格别名' },
            amount: { title: '批量修改商品分量' },
            s_spec_store_pack_fee: { title: '批量修改到店外带包装费' },
            s_spec_store_pack_mark: { title: '批量修改到店外带包装标识' },
            s_spec_take_pack_fee: { title: '批量修改外卖配送包装费' },
            s_spec_take_pack_mark: { title: '批量修改外卖配送包装标识' },
        };
        const batchEditableFields = new Set<SpecBulkEditorKey>([
            's_spec_price',
            's_spec_market',
            's_spec_cost',
            'inventory_mode',
            'stock',
            'daily_plan_stock',
            'amount',
            's_spec_store_pack_fee',
            's_spec_take_pack_fee',
        ]);
        const renderedSpecChildIdSet = new Set(renderedSpecChildIds);
        const showSpecPrice = renderedSpecChildIdSet.has('s_spec_price');
        const showSpecMarket = renderedSpecChildIdSet.has('s_spec_market');
        const showSpecCost = renderedSpecChildIdSet.has('s_spec_cost');
        const showSpecBarcode = renderedSpecChildIdSet.has('s_spec_barcode');
        const showSpecMark = renderedSpecChildIdSet.has('s_spec_mark');
        const showSpecSkuCode = renderedSpecChildIdSet.has('s_spec_sku_code');
        const showSpecCode = renderedSpecChildIdSet.has('s_spec_code');
        const showSpecStock = renderedSpecChildIdSet.has('s_spec_stock');
        const showSpecPlanStock = renderedSpecChildIdSet.has('s_spec_plan_stock');
        const showSpecImg = renderedSpecChildIdSet.has('s_spec_img');
        const showSpecLargeImg = renderedSpecChildIdSet.has('s_spec_large_img');
        const showSpecAlias = renderedSpecChildIdSet.has('s_spec_alias');
        const showSpecAmount = renderedSpecChildIdSet.has('s_spec_amount');
        const showSpecStorePackFee = renderedSpecChildIdSet.has('s_spec_store_pack_fee');
        const showSpecStorePackMark = renderedSpecChildIdSet.has('s_spec_store_pack_mark');
        const showSpecTakePackFee = renderedSpecChildIdSet.has('s_spec_take_pack_fee');
        const showSpecTakePackMark = renderedSpecChildIdSet.has('s_spec_take_pack_mark');
        const priceColSpan = [showSpecPrice, showSpecMarket, showSpecCost].filter(Boolean).length;
        const identityColSpan = [showSpecBarcode, showSpecMark, showSpecSkuCode, showSpecCode].filter(Boolean).length;
        const inventoryColSpan = [showSpecStock, showSpecPlanStock].filter(Boolean).reduce((sum, visible, index) => {
            if (!visible) return sum;
            return sum + (index === 0 ? 2 : 2);
        }, 0);
        const infoColSpan = [showSpecImg, showSpecLargeImg, showSpecAlias, showSpecAmount].filter(Boolean).length;
        const packagingColSpan = [showSpecStorePackFee, showSpecStorePackMark, showSpecTakePackFee, showSpecTakePackMark].filter(Boolean).length;
        const visibleSpecModules = SPEC_CONFIG_MODULES.filter(module => (
            (module.key === 'price' && priceColSpan > 0)
            || (module.key === 'identity' && identityColSpan > 0)
            || (module.key === 'inventory' && inventoryColSpan > 0)
            || (module.key === 'info' && infoColSpan > 0)
            || (module.key === 'packaging' && packagingColSpan > 0)
        ));

        const renderSpecNameCell = (row: SpecConfigRow) => (
            <td className="sticky left-0 z-[1] border-b border-gray-100 bg-white bg-clip-padding px-4 py-4 shadow-[8px_0_12px_-10px_rgba(15,23,42,0.18)]">
                <div
                    onClick={() => setActivePreviewField('s_specs')}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-[#F8FAFB] px-3 py-2.5"
                >
                    {specDisplayMode === 'single' ? (
                        <div className="text-sm font-bold text-[#1F2129]">统一规格</div>
                    ) : (
                        <>
                            <div className="text-sm font-bold text-[#1F2129]">{row.s_spec_name}</div>
                            <div className="mt-1 text-xs text-gray-400">
                                {row.s_spec_price ? `销售价 ¥${row.s_spec_price}` : '销售价待设置'}
                            </div>
                        </>
                    )}
                </div>
            </td>
        );

        const renderColumnHeader = (
            label: string,
            bulkKey?: SpecBulkEditorKey,
            options: {
                required?: boolean;
                helperKey?: SpecHeaderHelpKey;
                helperTooltip?: string;
            } = {}
        ) => (
            <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5">
                    {options.required ? <span className="text-red-500">*</span> : null}
                    <span>{label}</span>
                    {options.helperKey && options.helperTooltip ? (
                        <span className="relative inline-flex">
                            <button
                                type="button"
                                aria-label={`查看${label}说明`}
                                aria-expanded={activeSpecHeaderHelp === options.helperKey}
                                onClick={() => setActiveSpecHeaderHelp(current => current === options.helperKey ? null : options.helperKey!)}
                                className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                                    activeSpecHeaderHelp === options.helperKey
                                        ? 'bg-[#E8F8F0] text-[#00A35B]'
                                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                }`}
                            >
                                <CircleHelp size={14} />
                            </button>
                            {activeSpecHeaderHelp === options.helperKey ? (
                                <span
                                    role="dialog"
                                    aria-label={`${label}说明`}
                                    className="absolute left-0 top-[calc(100%+8px)] z-50 w-[260px] rounded-lg border border-gray-200 bg-white p-3 text-left shadow-[0_10px_28px_rgba(15,23,42,0.16)]"
                                >
                                    <span className="flex items-start justify-between gap-3">
                                        <span className="text-xs font-bold text-[#1F2129]">{label}说明</span>
                                        <button
                                            type="button"
                                            aria-label={`关闭${label}说明`}
                                            onClick={() => setActiveSpecHeaderHelp(null)}
                                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                        >
                                            <X size={13} />
                                        </button>
                                    </span>
                                    <span className="mt-1.5 block text-xs font-normal leading-5 text-gray-600">
                                        {options.helperTooltip}
                                    </span>
                                </span>
                            ) : null}
                        </span>
                    ) : null}
                    {bulkKey && specDisplayMode === 'multi' && batchEditableFields.has(bulkKey) ? (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => openSpecBulkEditor(bulkKey)}
                                className={`inline-flex h-4 w-4 items-center justify-center rounded-sm transition-colors ${
                                    activeSpecBulkField === bulkKey
                                        ? 'bg-[#F0FDF4] text-[#00A35B]'
                                        : 'text-gray-400 hover:text-[#00A35B]'
                                }`}
                            >
                                <Pencil size={11} />
                            </button>
                            {activeSpecBulkField === bulkKey ? (
                                <div className="absolute left-1/2 top-[calc(100%+10px)] z-40 w-[300px] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                                    <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-gray-200 bg-white" />
                                    <div className="text-sm font-bold text-[#1F2129]">{bulkFieldMeta[bulkKey].title}</div>
                                    <div className="mt-3 space-y-3">
                                    {['s_spec_price', 's_spec_market', 's_spec_cost', 's_spec_store_pack_fee', 's_spec_take_pack_fee'].includes(bulkKey) && (
                                        <div className="relative">
                                            <input
                                                value={String(specBulkDraft.value ?? '')}
                                                onChange={e => setSpecBulkDraft(prev => ({ ...prev, value: e.target.value }))}
                                                className="q-form-input h-11 pr-8 text-center text-lg font-bold"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">元</span>
                                        </div>
                                    )}
                                    {bulkKey === 'inventory_mode' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { key: 'unlimited', label: '不限库存' },
                                                { key: 'custom', label: '自定义库存' },
                                            ].map(option => (
                                                <button
                                                    key={option.key}
                                                    type="button"
                                                    onClick={() => setSpecBulkDraft(prev => ({ ...prev, inventoryMode: option.key }))}
                                                    className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                                                        specBulkDraft.inventoryMode === option.key
                                                            ? 'border-[#00C06B] bg-[#F0FDF4] text-[#166534]'
                                                            : 'border-gray-200 text-gray-500'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {bulkKey === 'stock' && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    value={String(specBulkDraft.initialStock ?? '')}
                                                    onChange={e => setSpecBulkDraft(prev => ({ ...prev, initialStock: e.target.value }))}
                                                    className="q-form-input h-10"
                                                    placeholder="库存值"
                                                />
                                                <input
                                                    value={String(specBulkDraft.maxStock ?? '')}
                                                    onChange={e => setSpecBulkDraft(prev => ({ ...prev, maxStock: e.target.value }))}
                                                    className="q-form-input h-10"
                                                    placeholder="库存最大值"
                                                />
                                            </div>
                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={!!specBulkDraft.autoRestock}
                                                    onChange={e => setSpecBulkDraft(prev => ({ ...prev, autoRestock: e.target.checked }))}
                                                    className="rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                />
                                                是否自动补足
                                            </label>
                                        </div>
                                    )}
                                    {bulkKey === 'daily_plan_stock' && (
                                        <input
                                            value={String(specBulkDraft.dailyPlanStock ?? '')}
                                            onChange={e => setSpecBulkDraft(prev => ({ ...prev, dailyPlanStock: e.target.value }))}
                                            className="q-form-input h-10"
                                            placeholder="请输入每日计划库存"
                                        />
                                    )}
                                    {bulkKey === 'amount' && (
                                        <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
                                            <input
                                                value={String(specBulkDraft.amount ?? '')}
                                                onChange={e => setSpecBulkDraft(prev => ({ ...prev, amount: e.target.value }))}
                                                className="q-form-input h-10"
                                                placeholder="请输入份量"
                                            />
                                            <select
                                                value={String(specBulkDraft.unit ?? '份')}
                                                onChange={e => setSpecBulkDraft(prev => ({ ...prev, unit: e.target.value }))}
                                                className="q-form-select h-10"
                                            >
                                                {['克', '千克', '份', '个'].map(option => <option key={option} value={option}>{option}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={applySpecBulkEdit}
                                        className="rounded-xl bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B]"
                                    >
                                        确定
                                    </button>
                                </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        );

        const renderMoneyInput = (
            row: SpecConfigRow,
            key: keyof SpecConfigRow,
            placeholder = '请输入'
        ) => (
            <div className="relative">
                <input
                    onFocus={() => setActivePreviewField('s_specs')}
                    type="number"
                    value={String(row[key] ?? '')}
                    disabled={isChannelSpecFieldReadonly(String(key))}
                    onChange={e => updateSpecConfigRow(row.id, key, e.target.value)}
                    className="q-form-input h-10 pr-8 text-center font-bold text-[#1F2129]"
                    placeholder={placeholder}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">元</span>
            </div>
        );

        const renderTextInput = (
            row: SpecConfigRow,
            key: keyof SpecConfigRow,
            options: { placeholder?: string; maxLength?: number; className?: string } = {}
        ) => {
            const value = String(row[key] ?? '');
            return (
                <div className="relative">
                    <input
                        onFocus={() => setActivePreviewField('s_specs')}
                        value={value}
                        maxLength={options.maxLength}
                        disabled={isChannelSpecFieldReadonly(String(key))}
                        onChange={e => updateSpecConfigRow(row.id, key, e.target.value)}
                        className={`q-form-input h-10 ${options.className || ''}`.trim()}
                        placeholder={options.placeholder || '请输入'}
                    />
                    {options.maxLength ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{value.length}/{options.maxLength}</span> : null}
                </div>
            );
        };

        return (
            <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white ${embedded ? '' : ''}`}>
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                    <div className="text-sm font-bold text-[#1F2129]">{panelTitle}</div>
                    <div className="text-xs font-bold text-gray-400">
                        共 {specCount} 个规格
                    </div>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-[#FAFAFA] px-5 py-4">
                    <div className="flex items-center gap-8">
                        <div className="shrink-0 text-sm text-[#1F2129]">规格</div>
                        <div className="flex items-center gap-8">
                            {[
                                { key: 'single' as const, label: '统一规格' },
                                { key: 'multi' as const, label: '多规格' },
                            ].map(option => (
                                <label
                                    key={option.key}
                                    className={`flex items-center gap-2 text-sm ${(isChannelForm || (isSingleSpecOnly && option.key === 'multi')) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                >
                                    <input
                                        type="radio"
                                        checked={specDisplayMode === option.key}
                                        disabled={isChannelForm || (isWeightProduct && option.key === 'multi')}
                                        onChange={() => {
                                            if (isChannelForm) return;
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
                    <div className="flex items-center gap-4">
                        {!isChannelForm && specDisplayMode === 'multi' && specConfigRows.length > 0 && (
                            <button
                                type="button"
                                onClick={openSpecPicker}
                                className="text-sm font-bold text-[#00A35B] hover:text-[#008A4D]"
                            >
                                调整规格
                            </button>
                        )}
                        {isChannelForm ? (
                            <div className="text-xs text-gray-400">规格身份与结构继承商品主档，不可在渠道商品库修改</div>
                        ) : isSingleSpecOnly && (
                            <div className="text-xs font-bold text-amber-600">{isBuffetTicketCategory ? '自助餐门票仅支持统一规格' : '称重商品不支持多规格，已自动切换为统一规格'}</div>
                        )}
                    </div>
                </div>
                {specDisplayMode === 'multi' && specConfigRows.length === 0 ? (
                    <div className="px-5 py-10">
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] px-6 py-10 text-center">
                            <div className="text-base font-bold text-[#1F2129]">暂未选择多规格</div>
                            <div className="mt-2 text-sm text-gray-400">先选择需要添加的规格值，再按规格分别配置销售价、库存和包装费信息。</div>
                            {!isChannelForm ? <button
                                type="button"
                                onClick={openSpecPicker}
                                className="mt-5 inline-flex items-center rounded-xl bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]"
                            >
                                <Plus size={16} className="mr-2" />
                                选择规格
                            </button> : <div className="mt-3 text-sm text-gray-400">请先在商品主档中维护规格结构</div>}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="border-b border-gray-100 px-5 py-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                                {visibleSpecModules.map(module => (
                                    <button
                                        key={module.key}
                                        type="button"
                                        onClick={() => scrollToSpecSection(module.key)}
                                        className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                                            activeSpecConfigModule === module.key
                                                ? 'border-[#00C06B] bg-[#F0FDF4] shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-[#86EFAC]'
                                        }`}
                                    >
                                        <div className={`text-sm font-bold ${activeSpecConfigModule === module.key ? 'text-[#166534]' : 'text-[#1F2129]'}`}>{module.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative bg-white py-5">
                            <div
                                ref={specTableScrollRef}
                                onScroll={handleSpecTableScroll}
                                className="overflow-x-auto"
                            >
                                <div className="min-w-fit px-5">
                                    <table className={isMasterForm ? 'min-w-[1040px] w-full table-fixed border-collapse' : 'min-w-[3560px] w-full border-collapse'}>
                                <thead>
                                    <tr className="text-left text-xs font-bold text-gray-500">
                                        <th className={`${isMasterForm ? 'w-[176px]' : 'min-w-[180px]'} sticky left-0 z-30 border-b border-r border-gray-200 bg-[#F7F8FA] bg-clip-padding px-4 py-3 shadow-[8px_0_12px_-10px_rgba(15,23,42,0.18)]`} rowSpan={2}>
                                            规格名称
                                        </th>
                                        {priceColSpan > 0 && <th
                                            ref={node => { specSectionHeaderRefs.current.price = node; }}
                                            className="border-b border-r border-gray-200 bg-[#F7F8FA] px-4 py-3 text-[#1F2129]"
                                            colSpan={priceColSpan}
                                        >
                                            价格设置
                                        </th>}
                                        {identityColSpan > 0 && <th
                                            ref={node => { specSectionHeaderRefs.current.identity = node; }}
                                            className="border-b border-r border-gray-200 bg-[#F7F8FA] px-4 py-3 text-[#1F2129]"
                                            colSpan={identityColSpan}
                                        >
                                            标识设置
                                        </th>}
                                        {inventoryColSpan > 0 && <th
                                            ref={node => { specSectionHeaderRefs.current.inventory = node; }}
                                            className="border-b border-r border-gray-200 bg-[#F7F8FA] px-4 py-3 text-[#1F2129]"
                                            colSpan={inventoryColSpan}
                                        >
                                            库存设置
                                        </th>}
                                        {infoColSpan > 0 && <th
                                            ref={node => { specSectionHeaderRefs.current.info = node; }}
                                            className="border-b border-r border-gray-200 bg-[#F7F8FA] px-4 py-3 text-[#1F2129]"
                                            colSpan={infoColSpan}
                                        >
                                            规格信息
                                        </th>}
                                        {packagingColSpan > 0 && <th
                                            ref={node => { specSectionHeaderRefs.current.packaging = node; }}
                                            className="border-b border-gray-200 bg-[#F7F8FA] px-4 py-3 text-[#1F2129]"
                                            colSpan={packagingColSpan}
                                        >
                                            包装费设置
                                        </th>}
                                    </tr>
                                    <tr className="text-left text-xs font-bold text-gray-500">
                                        {showSpecPrice && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('基础价格', 's_spec_price', {
                                            required: true,
                                            helperKey: 'basePrice',
                                            helperTooltip: '商品实际销售时使用的价格，即顾客购买该规格需要支付的价格。',
                                        })}</th>}
                                        {showSpecMarket && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('市场价', 's_spec_market', {
                                            helperKey: 'marketPrice',
                                            helperTooltip: '商品在市场上的参考价格，类似零售价。填写后，小程序端会将该价格展示为划线价，与基础价格进行对比。',
                                        })}</th>}
                                        {showSpecCost && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('预估成本', 's_spec_cost', {
                                            helperKey: 'estimatedCost',
                                            helperTooltip: '用于记录该规格的预计成本，便于核算毛利等经营数据。',
                                        })}</th>}
                                        {showSpecBarcode && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('商品条码', 's_spec_barcode')}</th>}
                                        {showSpecMark && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('商品标识', 's_spec_mark')}</th>}
                                        {showSpecSkuCode && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('商品规格码', 's_spec_sku_code')}</th>}
                                        {showSpecCode && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('商品编码', 's_spec_code')}</th>}
                                        {showSpecStock && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('库存设置', 'inventory_mode')}</th>}
                                        {showSpecStock && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('初始库存', 'stock')}</th>}
                                        {showSpecPlanStock && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('是否管理计划库存')}</th>}
                                        {showSpecPlanStock && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('每日计划库存', 'daily_plan_stock')}</th>}
                                        {showSpecImg && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('规格图片')}</th>}
                                        {showSpecLargeImg && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('规格大图', undefined, {
                                            helperKey: 'specLargeImage',
                                            helperTooltip: '优先使用规格大图，建议尺寸 800*450。',
                                        })}</th>}
                                        {showSpecAlias && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('规格别名', 's_spec_alias')}</th>}
                                        {showSpecAmount && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('商品分量', 'amount')}</th>}
                                        {showSpecStorePackFee && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('到店外带包装费', 's_spec_store_pack_fee')}</th>}
                                        {showSpecStorePackMark && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('到店外带包装标识', 's_spec_store_pack_mark')}</th>}
                                        {showSpecTakePackFee && <th className="border-b border-r border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('外卖配送包装费', 's_spec_take_pack_fee')}</th>}
                                        {showSpecTakePackMark && <th className="border-b border-gray-200 bg-[#FCFCFD] px-4 py-3">{renderColumnHeader('外卖配送包装标识', 's_spec_take_pack_mark')}</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleSpecRows.map(row => (
                                        <tr key={row.id}>
                                            {renderSpecNameCell(row)}
                                            {showSpecPrice && <td className="border-b border-r border-gray-100 px-4 py-4">{renderMoneyInput(row, 's_spec_price', '请输入销售价')}</td>}
                                            {showSpecMarket && <td className="border-b border-r border-gray-100 px-4 py-4">{renderMoneyInput(row, 's_spec_market')}</td>}
                                            {showSpecCost && <td className="border-b border-r border-gray-100 px-4 py-4">{renderMoneyInput(row, 's_spec_cost')}</td>}
                                            {showSpecBarcode && <td className="border-b border-r border-gray-100 px-4 py-4">{renderTextInput(row, 's_spec_barcode', { maxLength: 50, className: 'pr-14' })}</td>}
                                            {showSpecMark && <td className="border-b border-r border-gray-100 px-4 py-4">{renderTextInput(row, 's_spec_mark', { maxLength: 50, className: 'pr-14' })}</td>}
                                            {showSpecSkuCode && <td className="border-b border-r border-gray-100 px-4 py-4">{renderTextInput(row, 's_spec_sku_code', { maxLength: 50, className: 'pr-14' })}</td>}
                                            {showSpecCode && <td className="border-b border-r border-gray-100 px-4 py-4">{renderTextInput(row, 's_spec_code', { maxLength: 50, className: 'pr-14' })}</td>}
                                            {showSpecStock && <td className="border-b border-r border-gray-100 px-4 py-4">
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                                        <input
                                                            type="radio"
                                                            checked={row.s_spec_inventory_mode === 'unlimited'}
                                                            onChange={() => updateSpecConfigRow(row.id, 's_spec_inventory_mode', 'unlimited')}
                                                            className="text-[#00C06B] focus:ring-[#00C06B]"
                                                        />
                                                        不限库存
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm text-gray-600">
                                                        <input
                                                            type="radio"
                                                            checked={row.s_spec_inventory_mode === 'custom'}
                                                            onChange={() => updateSpecConfigRow(row.id, 's_spec_inventory_mode', 'custom')}
                                                            className="text-[#00C06B] focus:ring-[#00C06B]"
                                                        />
                                                        自定义库存
                                                    </label>
                                                </div>
                                            </td>}
                                            {showSpecStock && <td className="border-b border-r border-gray-100 px-4 py-4">
                                                {row.s_spec_inventory_mode === 'custom' ? (
                                                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                                                        <div>
                                                            <div className="mb-1 text-[11px] font-bold text-gray-400">库存值</div>
                                                            <input onFocus={() => setActivePreviewField('s_specs')} type="number" value={row.s_spec_initial_stock} onChange={e => updateSpecConfigRow(row.id, 's_spec_initial_stock', e.target.value)} className="q-form-input h-10 text-center font-bold" placeholder="请输入" />
                                                        </div>
                                                        <div>
                                                            <div className="mb-1 text-[11px] font-bold text-gray-400">库存最大值</div>
                                                            <input onFocus={() => setActivePreviewField('s_specs')} type="number" value={row.s_spec_max_stock} onChange={e => updateSpecConfigRow(row.id, 's_spec_max_stock', e.target.value)} className="q-form-input h-10 text-center font-bold" placeholder="请输入" />
                                                        </div>
                                                        <label className="flex h-full min-h-[40px] items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-[#1F2129]">
                                                            <input
                                                                type="checkbox"
                                                                checked={row.s_spec_auto_restock}
                                                                onChange={e => updateSpecConfigRow(row.id, 's_spec_auto_restock', e.target.checked)}
                                                                className="rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                            />
                                                            是否自动补足
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-dashed border-gray-200 bg-[#FAFAFA] px-4 py-3 text-sm text-gray-400">不限库存时无需设置库存值</div>
                                                )}
                                            </td>}
                                            {showSpecPlanStock && <td className="border-b border-r border-gray-100 px-4 py-4">
                                                <Switch
                                                    checked={row.s_spec_manage_plan_stock}
                                                    onChange={(checked) => {
                                                        updateSpecConfigRow(row.id, 's_spec_manage_plan_stock', checked);
                                                        if (!checked) updateSpecConfigRow(row.id, 's_spec_daily_plan_stock', '');
                                                    }}
                                                />
                                            </td>}
                                            {showSpecPlanStock && <td className="border-b border-r border-gray-100 px-4 py-4">
                                                {row.s_spec_manage_plan_stock ? (
                                                    <input
                                                        onFocus={() => setActivePreviewField('s_specs')}
                                                        type="number"
                                                        value={row.s_spec_daily_plan_stock}
                                                        onChange={e => updateSpecConfigRow(row.id, 's_spec_daily_plan_stock', e.target.value)}
                                                        className="q-form-input h-10 text-center font-bold"
                                                        placeholder="请输入"
                                                    />
                                                ) : (
                                                    <div className="text-sm text-gray-400">开启后展示</div>
                                                )}
                                            </td>}
                                            {showSpecImg && <td className="border-b border-r border-gray-100 px-4 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActivePreviewField('s_specs');
                                                        updateSpecConfigRow(row.id, 's_spec_img', row.s_spec_img ? '' : '已上传');
                                                    }}
                                                    className={`h-[56px] w-[88px] rounded-xl border text-xs font-bold ${row.s_spec_img ? 'border-[#00C06B] bg-[#F0FDF4] text-[#00A35B]' : 'border-dashed border-gray-200 text-gray-400 hover:border-[#00C06B]'}`}
                                                >
                                                    {row.s_spec_img ? '已上传' : '上传图片'}
                                                </button>
                                            </td>}
                                            {showSpecLargeImg && <td className="border-b border-r border-gray-100 px-4 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActivePreviewField('s_specs');
                                                        updateSpecConfigRow(row.id, 's_spec_large_img', row.s_spec_large_img ? '' : '已上传');
                                                    }}
                                                    className={`h-[56px] w-[88px] rounded-xl border text-xs font-bold ${row.s_spec_large_img ? 'border-[#00C06B] bg-[#F0FDF4] text-[#00A35B]' : 'border-dashed border-gray-200 text-gray-400 hover:border-[#00C06B]'}`}
                                                >
                                                    {row.s_spec_large_img ? '已上传' : '上传大图'}
                                                </button>
                                            </td>}
                                            {showSpecAlias && <td className="border-b border-r border-gray-100 px-4 py-4">{renderTextInput(row, 's_spec_alias', { maxLength: 30, className: 'pr-14' })}</td>}
                                            {showSpecAmount && <td className="border-b border-r border-gray-100 px-4 py-4">
                                                <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
                                                    <input
                                                        onFocus={() => setActivePreviewField('s_specs')}
                                                        type="number"
                                                        step="0.01"
                                                        value={row.s_spec_amount}
                                                        onChange={e => updateSpecConfigRow(row.id, 's_spec_amount', e.target.value)}
                                                        className="q-form-input h-10 text-center font-bold"
                                                        placeholder="请输入"
                                                    />
                                                    <select
                                                        value={row.s_spec_amount_unit}
                                                        onChange={e => updateSpecConfigRow(row.id, 's_spec_amount_unit', e.target.value)}
                                                        className="q-form-select h-10 min-w-[88px]"
                                                    >
                                                        {['克', '千克', '份', '个'].map(option => <option key={option} value={option}>{option}</option>)}
                                                    </select>
                                                </div>
                                            </td>}
                                            {showSpecStorePackFee && <td className="border-b border-r border-gray-100 px-4 py-4">{renderMoneyInput(row, 's_spec_store_pack_fee')}</td>}
                                            {showSpecStorePackMark && <td className="border-b border-r border-gray-100 px-4 py-4">{renderTextInput(row, 's_spec_store_pack_mark', { maxLength: 128, className: 'pr-16' })}</td>}
                                            {showSpecTakePackFee && <td className="border-b border-r border-gray-100 px-4 py-4">{renderMoneyInput(row, 's_spec_take_pack_fee')}</td>}
                                            {showSpecTakePackMark && <td className="border-b border-gray-100 px-4 py-4">{renderTextInput(row, 's_spec_take_pack_mark', { maxLength: 128, className: 'pr-16' })}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 bg-white" />
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderComboProductPanel = () => {
        if (!isComboProduct) return null;

        const comboPriceType = dynamicFormData.combo_price_type || 'markup';
        const comboPackMode = dynamicFormData.combo_pack_mode || 'whole';
        const comboPriceStyle = dynamicFormData.combo_price_style || 'markup';
        const comboDisplayPrice = dynamicFormData.combo_display_price || '';
        const showComboSpecGroup = hasSpecModuleEnabled;
        const showComboInfoGroup = isFieldEnabled('c_groups');
        const optionalComboFields = isChannelForm
            ? [
                { id: 'combo_packaging', label: '包装费配置' },
                { id: 'combo_display_price', label: '展示价格' },
                { id: 'combo_price_style', label: '随心配价格样式' },
            ]
            : [];
        const comboButtons = [
            { key: 'fixed' as const, label: '添加固定搭配', desc: '添加套餐固定商品明细' },
            { key: 'optional' as const, label: '添加可选分组', desc: '配置套餐可选商品分组' },
            { key: 'free' as const, label: '添加随心配', desc: '引用已有随心配模板' },
        ];

        const createOptionalGroupDraft = (): ComboGroupCard => ({
            id: `combo-optional-${Date.now()}`,
            type: 'optional',
            title: '',
            desc: '',
            items: [],
            requiredOptionCount: 1,
            minTotalQuantity: 1,
            maxTotalQuantity: 2,
            isRequired: true,
            configMode: 'pick',
            relativePrice: false,
            saveAsFreeMatch: false,
            remark: '',
            affectedStoreCount: 0,
        });

        const openOptionalGroupEditor = (card?: ComboGroupCard) => {
            setConfirmingComboOptionalSave(false);
            setComboOptionalGroupModal(card
                ? {
                    mode: 'edit',
                    sourceCardId: card.id,
                    originalTitle: card.title,
                    draft: {
                        ...card,
                        items: (card.items || []).map(item => ({ ...item })),
                    },
                }
                : {
                    mode: 'create',
                    draft: createOptionalGroupDraft(),
                });
        };

        const updateOptionalGroupDraft = (patch: Partial<ComboGroupCard>) => {
            setComboOptionalGroupModal(current => current
                ? { ...current, draft: { ...current.draft, ...patch } }
                : current);
        };

        const updateOptionalGroupItems = (
            updater: (items: ComboOptionalItem[]) => ComboOptionalItem[]
        ) => {
            setComboOptionalGroupModal(current => current
                ? {
                    ...current,
                    draft: {
                        ...current.draft,
                        items: updater(current.draft.items || []),
                    },
                }
                : current);
        };

        const openOptionalProductPicker = () => {
            setComboOptionalProductPickerDraftIds(
                comboOptionalGroupModal?.draft.items?.map(item => item.id) || []
            );
            setComboOptionalProductDraftFilters({ ...EMPTY_COMBO_OPTIONAL_PRODUCT_FILTERS });
            setComboOptionalProductFilters({ ...EMPTY_COMBO_OPTIONAL_PRODUCT_FILTERS });
            setComboOptionalProductPage(1);
            setComboOptionalBatchFilterOpen(false);
            setComboOptionalBatchFilterInput('');
            setComboOptionalBatchProductIds([]);
            setComboOptionalBatchFilterError('');
            setComboOptionalProductPickerOpen(true);
        };

        const openOptionalBatchFilter = () => {
            setComboOptionalBatchFilterInput(comboOptionalBatchProductIds.join('\n'));
            setComboOptionalBatchFilterError('');
            setComboOptionalBatchFilterOpen(true);
        };

        const parsedOptionalBatchTokens = comboOptionalBatchFilterInput
            .split(/[\s,，;；]+/)
            .map(value => value.trim())
            .filter(Boolean);
        const parsedOptionalBatchProductIds = Array.from(new Set(
            parsedOptionalBatchTokens.filter(value => /^\d+$/.test(value))
        ));
        const invalidOptionalBatchTokenCount = parsedOptionalBatchTokens.length
            - parsedOptionalBatchTokens.filter(value => /^\d+$/.test(value)).length;

        const applyOptionalBatchFilter = () => {
            if (parsedOptionalBatchProductIds.length === 0) {
                setComboOptionalBatchFilterError('请输入至少 1 个有效的商品 ID');
                return;
            }
            if (parsedOptionalBatchProductIds.length > 200) {
                setComboOptionalBatchFilterError(`单次最多支持 200 个商品 ID，当前已识别 ${parsedOptionalBatchProductIds.length} 个`);
                return;
            }

            setComboOptionalBatchProductIds(parsedOptionalBatchProductIds);
            setComboOptionalProductPage(1);
            setComboOptionalBatchFilterError('');
            setComboOptionalBatchFilterOpen(false);
        };

        const confirmOptionalProductPicker = () => {
            if (!comboOptionalGroupModal) return;

            const currentItems = comboOptionalGroupModal.draft.items || [];
            const nextItems = comboOptionalProductPickerDraftIds
                .map(productId => {
                    const currentItem = currentItems.find(item => item.id === productId);
                    const libraryItem = COMBO_OPTIONAL_PRODUCT_LIBRARY.find(item => item.id === productId);
                    return currentItem || (libraryItem ? { ...libraryItem, isDefault: false } : null);
                })
                .filter((item): item is ComboOptionalItem => !!item);

            if (nextItems.length > 0 && !nextItems.some(item => item.isDefault)) {
                nextItems[0] = { ...nextItems[0], isDefault: true };
            }

            updateOptionalGroupDraft({ items: nextItems });
            setComboOptionalProductPickerOpen(false);
        };

        const removeOptionalProduct = (productId: string) => {
            updateOptionalGroupItems(items => {
                const removedItem = items.find(item => item.id === productId);
                const nextItems = items.filter(item => item.id !== productId);
                if (removedItem?.isDefault && nextItems.length > 0) {
                    nextItems[0] = { ...nextItems[0], isDefault: true };
                }
                return nextItems;
            });
        };

        const closeOptionalGroupEditor = () => {
            setComboOptionalGroupModal(null);
            setConfirmingComboOptionalSave(false);
            setComboOptionalProductPickerOpen(false);
            setComboOptionalProductPickerDraftIds([]);
            setComboOptionalProductDraftFilters({ ...EMPTY_COMBO_OPTIONAL_PRODUCT_FILTERS });
            setComboOptionalProductFilters({ ...EMPTY_COMBO_OPTIONAL_PRODUCT_FILTERS });
            setComboOptionalProductPage(1);
            setComboOptionalBatchFilterOpen(false);
            setComboOptionalBatchFilterInput('');
            setComboOptionalBatchProductIds([]);
            setComboOptionalBatchFilterError('');
        };

        const buildOptionalGroupCard = (
            draft: ComboGroupCard,
            options: { saveAsNew?: boolean } = {}
        ): ComboGroupCard => {
            const itemCount = draft.items?.length || 0;
            const requiredCount = Math.min(
                Math.max(1, draft.requiredOptionCount || 1),
                Math.max(1, itemCount)
            );
            const minTotal = Math.max(0, draft.minTotalQuantity ?? 0);
            const maxTotal = Math.max(minTotal || 1, draft.maxTotalQuantity || 1);
            const configMode = draft.configMode || 'pick';
            const fallbackTitle = options.saveAsNew
                ? `${comboOptionalGroupModal?.originalTitle || '可选分组'}（副本）`
                : '未命名可选分组';
            const normalizedTitle = draft.title.trim();
            const resolvedTitle = options.saveAsNew
                && normalizedTitle === comboOptionalGroupModal?.originalTitle
                ? `${normalizedTitle}（副本）`
                : normalizedTitle || fallbackTitle;

            return {
                ...draft,
                id: options.saveAsNew ? `combo-optional-${Date.now()}` : draft.id,
                title: resolvedTitle,
                desc: configMode === 'pick'
                    ? `按种类选择 · ${itemCount} 选 ${requiredCount}`
                    : `按数量选择 · ${draft.isRequired === false ? '非必选' : '必选'} · ${minTotal}～${maxTotal} 份`,
                requiredOptionCount: requiredCount,
                minTotalQuantity: minTotal,
                maxTotalQuantity: maxTotal,
                configMode,
                affectedStoreCount: options.saveAsNew ? 0 : draft.affectedStoreCount,
            };
        };

        const saveOptionalGroup = (saveAsNew = false) => {
            if (!comboOptionalGroupModal) return;

            const nextCard = buildOptionalGroupCard(comboOptionalGroupModal.draft, { saveAsNew });
            setComboGroupCards(current => {
                if (comboOptionalGroupModal.mode === 'create') {
                    return [...current, nextCard];
                }

                return current.map(card => (
                    card.id === comboOptionalGroupModal.sourceCardId ? nextCard : card
                ));
            });
            closeOptionalGroupEditor();
        };

        const addComboCard = (cardType: ComboGroupCard['type']) => {
            if (cardType === 'optional') {
                openOptionalGroupEditor();
                return;
            }

            const titleMap: Record<ComboGroupCard['type'], string> = {
                fixed: '固定搭配',
                fixed_multi: '固定搭配(多拼商品)',
                optional: '可选分组',
                free: '随心配',
            };
            const descMap: Record<ComboGroupCard['type'], string> = {
                fixed: '待添加套餐固定商品',
                fixed_multi: '待添加多拼商品明细',
                optional: '待设置可选商品与选购规则',
                free: '待选择随心配模板',
            };
            setComboGroupCards(prev => (
                [...prev, {
                    id: `${cardType}-${Date.now()}-${prev.length + 1}`,
                    type: cardType,
                    title: titleMap[cardType],
                    desc: descMap[cardType],
                }]
            ));
        };

        const optionalGroupDraft = comboOptionalGroupModal?.draft;
        const canSaveOptionalGroup = !!optionalGroupDraft?.title.trim()
            && (optionalGroupDraft.items?.length || 0) > 0;
        const isEditingLinkedOptionalGroup = comboOptionalGroupModal?.mode === 'edit'
            && (optionalGroupDraft?.affectedStoreCount || 0) > 0;
        const optionalProductPickerResults = COMBO_OPTIONAL_PRODUCT_LIBRARY.filter(product => {
            const batchMatched = comboOptionalBatchProductIds.length === 0
                || comboOptionalBatchProductIds.includes(product.productId);
            return batchMatched
                && (!comboOptionalProductFilters.name || product.name.toLowerCase().includes(comboOptionalProductFilters.name.toLowerCase()))
                && (!comboOptionalProductFilters.barcode || '--'.includes(comboOptionalProductFilters.barcode))
                && (!comboOptionalProductFilters.productFlag || '--'.includes(comboOptionalProductFilters.productFlag))
                && (!comboOptionalProductFilters.skuCode || product.skuCode.toLowerCase().includes(comboOptionalProductFilters.skuCode.toLowerCase()))
                && (!comboOptionalProductFilters.productId || product.productId.includes(comboOptionalProductFilters.productId))
                && (comboOptionalProductFilters.frontendCategory === 'all' || product.frontendCategory === comboOptionalProductFilters.frontendCategory);
        });
        const matchedOptionalBatchProductCount = new Set(
            optionalProductPickerResults.map(product => product.productId)
        ).size;
        const optionalProductPageSize = 6;
        const optionalProductPageCount = Math.max(1, Math.ceil(optionalProductPickerResults.length / optionalProductPageSize));
        const currentOptionalProductPage = Math.min(comboOptionalProductPage, optionalProductPageCount);
        const optionalProductPickerPageResults = optionalProductPickerResults.slice(
            (currentOptionalProductPage - 1) * optionalProductPageSize,
            currentOptionalProductPage * optionalProductPageSize
        );

        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
                {showComboSpecGroup && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">{isMasterForm ? '规格结构' : '套餐计价类型'}</div>
                        <div className="space-y-4">
                            {!isMasterForm && (
                                <div className="space-y-4">
                                    {[
                                        { key: 'markup', label: '销售加价', desc: '套餐基础价格作为基本费用，总价根据随心配商品加价波动', badge: '推荐' },
                                        { key: 'total', label: '合并计价', desc: '套餐内所有商品独立收费，总价根据用户选择商品合并计算' },
                                    ].map(option => (
                                        <label key={option.key} className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={comboPriceType === option.key}
                                                onChange={() => setDynamicFormData(prev => ({ ...prev, combo_price_type: option.key }))}
                                                className="mt-1 h-4 w-4 border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                            />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 text-sm font-bold text-[#1F2129]">
                                                    <span>{option.label}</span>
                                                    {option.badge ? <span className="rounded-full bg-[#FEE2E2] px-1.5 py-0.5 text-[10px] text-[#DC2626]">{option.badge}</span> : null}
                                                </div>
                                                <div className="mt-1 text-xs text-gray-400">{option.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {renderSpecConfigTable({ embedded: true, title: '规格设置' })}
                        </div>
                    </div>
                )}

                {showComboInfoGroup && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">套餐信息</div>
                        <div className="rounded-2xl bg-[#FAFAFA] p-4 space-y-4">
                            <div className="flex flex-wrap gap-3">
                                {comboButtons.map(button => (
                                    <button
                                        key={button.key}
                                        type="button"
                                        onClick={() => addComboCard(button.key)}
                                        className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                    >
                                        <Plus size={15} className="mr-2" />
                                        {button.label}
                                    </button>
                                ))}
                            </div>
                            {comboGroupCards.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                    {comboGroupCards.map(card => (
                                        <div
                                            key={card.id}
                                            className={`rounded-xl border border-gray-200 bg-white ${
                                                card.type === 'optional' ? 'xl:col-span-2' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4 px-4 py-3.5">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="text-sm font-bold text-[#1F2129]">{card.title}</div>
                                                        <span className="rounded bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-bold text-[#15803D]">
                                                            {card.type === 'optional' ? '可选分组' : card.type === 'free' ? '随心配' : '固定搭配'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1.5 text-xs text-gray-500">{card.desc}</div>
                                                    {card.type === 'optional' ? (
                                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                            <span>{card.configMode === 'flexible' ? '按数量选择' : '按种类选择'}</span>
                                                            {card.configMode === 'flexible' ? (
                                                                <span>{card.isRequired === false ? '非必选' : '必选'}</span>
                                                            ) : null}
                                                            <span>{card.relativePrice ? '启用相对价' : '未启用相对价'}</span>
                                                            {card.saveAsFreeMatch ? <span className="font-bold text-[#00A35B]">已保存为随心配</span> : null}
                                                            <span>备注：{card.remark || '--'}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    {card.type === 'optional' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openOptionalGroupEditor(card)}
                                                            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-[#00A35B] hover:bg-[#F0FDF4]"
                                                        >
                                                            <Pencil size={13} />
                                                            编辑
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        title="删除分组"
                                                        aria-label={`删除${card.title}`}
                                                        onClick={() => setComboGroupCards(prev => prev.filter(item => item.id !== card.id))}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {card.type === 'optional' && (card.items?.length || 0) > 0 ? (
                                                <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-[#FCFCFD] px-4 py-3">
                                                    {card.items?.map(item => (
                                                        <span
                                                            key={item.id}
                                                            className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600"
                                                        >
                                                            {item.name}
                                                            {item.surcharge > 0 ? ` +¥${item.surcharge}` : ''}
                                                            {item.isDefault ? <span className="ml-1.5 text-[#00A35B]">默认</span> : null}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
                                    暂未添加套餐信息，请按需添加固定搭配、可选分组或随心配。
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isFieldEnabled('m_methods') && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">做法</div>
                        <div className="rounded-2xl bg-[#FAFAFA] p-4">
                            {renderMethodAddonPanel({ embedded: true, showAttrSort: false })}
                        </div>
                    </div>
                )}

                {!isMasterForm && (specDisplayMode === 'multi' || methodConfigRows.length > 0) && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">属性排序</div>
                        <div>{renderAttributeSortPanel()}</div>
                    </div>
                )}

                {isChannelForm && expandedComboAdvancedFields.includes('combo_packaging') && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">包装费配置</div>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-x-8 gap-y-3">
                                {[
                                    { key: 'whole', label: '按整个套餐收取包装费' },
                                    { key: 'inherit', label: '使用套餐内商品的包装设置' },
                                ].map(option => (
                                    <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={comboPackMode === option.key}
                                            onChange={() => setDynamicFormData(prev => ({ ...prev, combo_pack_mode: option.key }))}
                                            className="h-4 w-4 border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                        />
                                        <span className={`text-sm ${comboPackMode === option.key ? 'font-bold text-[#00A35B]' : 'text-gray-600'}`}>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="rounded-2xl bg-[#FAFAFA] px-4 py-3 text-sm text-gray-500">
                                {comboPackMode === 'whole'
                                    ? '按整个套餐收取包装费时，无需在此处单独填写费用，具体包装费可在规格列表对应字段中配置。'
                                    : '使用套餐内商品的包装设置时，将按套餐内商品自身的包装费规则进行汇总展示。'}
                            </div>
                        </div>
                    </div>
                )}

                {isChannelForm && expandedComboAdvancedFields.includes('combo_display_price') && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">展示价格</div>
                        <div className="max-w-[220px]">
                            <div className="relative">
                                <input
                                    type="number"
                                    className="q-form-input pl-8"
                                    placeholder="0.00"
                                    value={comboDisplayPrice}
                                    onChange={e => setDynamicFormData(prev => ({ ...prev, combo_display_price: e.target.value }))}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                            </div>
                        </div>
                    </div>
                )}

                {isChannelForm && expandedComboAdvancedFields.includes('combo_price_style') && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">随心配价格样式</div>
                        <div className="flex flex-wrap gap-x-8 gap-y-3">
                            {[
                                { key: 'markup', label: '加价样式', desc: '选择随心配商品时展示“+加价”符号' },
                                { key: 'fixed', label: '定价样式', desc: '选择定价样式时，随心配商品不会展示“+加价”符号' },
                            ].map(option => (
                                <label key={option.key} className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={comboPriceStyle === option.key}
                                        onChange={() => setDynamicFormData(prev => ({ ...prev, combo_price_style: option.key }))}
                                        className="mt-1 h-4 w-4 border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    />
                                    <div>
                                        <div className={`text-sm ${comboPriceStyle === option.key ? 'font-bold text-[#00A35B]' : 'text-gray-600'}`}>{option.label}</div>
                                        <div className="mt-1 text-xs text-gray-400">{option.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-1">
                    {renderCollapsedFieldControls(
                        optionalComboFields,
                        expandedComboAdvancedFields,
                        () => {
                            setExpandedComboAdvancedFields(optionalComboFields.map(field => field.id));
                            setComboAdvancedExpandedAll(true);
                        },
                        fieldId => {
                            setExpandedComboAdvancedFields(prev => Array.from(new Set([...prev, fieldId])));
                            setComboAdvancedExpandedAll(false);
                        },
                        () => {
                            setExpandedComboAdvancedFields([]);
                            setComboAdvancedExpandedAll(false);
                        },
                        { showCollapse: comboAdvancedExpandedAll || expandedComboAdvancedFields.length > 0 }
                    )}
                </div>

                {comboOptionalGroupModal && optionalGroupDraft ? (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-6">
                        <div className="flex max-h-[88vh] w-full max-w-[920px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                            <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 py-4">
                                <div>
                                    <div className="text-lg font-bold text-[#1F2129]">
                                        {comboOptionalGroupModal.mode === 'create' ? '添加可选分组' : '编辑可选分组'}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-400">
                                        {comboOptionalGroupModal.mode === 'create'
                                            ? '配置分组商品和选择规则，保存后添加到当前套餐。'
                                            : '配置分组商品和选择规则。'}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    aria-label="关闭可选分组编辑"
                                    onClick={closeOptionalGroupEditor}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {isEditingLinkedOptionalGroup ? (
                                    <div className="mb-5 flex items-start gap-3 rounded-lg border border-[#F2D38A] bg-[#FFF9EB] px-4 py-3 text-[#8A4B08]">
                                        <CircleAlert size={16} className="mt-0.5 shrink-0" />
                                        <div className="min-w-0 text-xs leading-5">
                                            <div className="text-sm font-bold">该分组已被 {optionalGroupDraft.affectedStoreCount} 家门店商品使用</div>
                                            <div className="mt-1">
                                                保存修改会影响引用该分组的门店商品。新增商品仅在门店已有对应商品时生效；移除商品将直接生效。
                                            </div>
                                            <div className="text-[#A15C12]">如不希望影响已有门店，请另存为新分组。</div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-bold text-[#1F2129]">
                                            <span className="mr-1 text-red-500">*</span>分组名称
                                        </span>
                                        <input
                                            value={optionalGroupDraft.title}
                                            maxLength={30}
                                            onChange={event => updateOptionalGroupDraft({ title: event.target.value })}
                                            className="q-form-input h-10"
                                            placeholder="如：主食任选"
                                        />
                                        <span className="mt-1 block text-right text-xs text-gray-400">
                                            {optionalGroupDraft.title.length}/30
                                        </span>
                                    </label>
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-bold text-[#1F2129]">备注</span>
                                        <input
                                            value={optionalGroupDraft.remark || ''}
                                            maxLength={100}
                                            onChange={event => updateOptionalGroupDraft({ remark: event.target.value })}
                                            className="q-form-input h-10"
                                            placeholder="记录该分组的用途，非必填"
                                        />
                                        <span className="mt-1 block text-right text-xs text-gray-400">
                                            {(optionalGroupDraft.remark || '').length}/100
                                        </span>
                                    </label>
                                </div>

                                <div className="mt-2">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-[#1F2129]">
                                                <span className="mr-1 text-red-500">*</span>分组商品
                                            </div>
                                            <div className="mt-1 text-xs text-gray-400">
                                                已选 {optionalGroupDraft.items?.length || 0} 个，可设置数量、加价和默认商品。
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openOptionalProductPicker}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#00C06B] px-3 text-sm font-bold text-[#00A35B] hover:bg-[#F0FDF4]"
                                        >
                                            <Plus size={16} />
                                            添加商品
                                        </button>
                                    </div>
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <div className="grid grid-cols-[minmax(180px,1fr)_100px_120px_88px_72px] items-center bg-[#F7F8FA] px-3 py-2.5 text-xs font-bold text-gray-500">
                                            <span>商品</span>
                                            <span className="text-center">数量</span>
                                            <span className="text-center">加价</span>
                                            <span className="text-center">默认</span>
                                            <span className="text-center">操作</span>
                                        </div>
                                        {(optionalGroupDraft.items || []).length > 0 ? (
                                            (optionalGroupDraft.items || []).map(selectedItem => (
                                                <div
                                                    key={selectedItem.id}
                                                    className="grid min-h-[62px] grid-cols-[minmax(180px,1fr)_100px_120px_88px_72px] items-center border-t border-gray-100 px-3 py-2 text-sm"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate font-bold text-[#1F2129]">{selectedItem.name}</div>
                                                        <div className="mt-0.5 text-xs text-gray-400">{selectedItem.spec}</div>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={selectedItem.quantity}
                                                        onChange={event => updateOptionalGroupItems(items => items.map(item => (
                                                            item.id === selectedItem.id
                                                                ? { ...item, quantity: Math.max(1, Number(event.target.value) || 1) }
                                                                : item
                                                        )))}
                                                        className="q-form-input mx-auto h-8 w-16 text-center"
                                                    />
                                                    <div className="relative mx-auto w-24">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={selectedItem.surcharge}
                                                            onChange={event => updateOptionalGroupItems(items => items.map(item => (
                                                                item.id === selectedItem.id
                                                                    ? { ...item, surcharge: Math.max(0, Number(event.target.value) || 0) }
                                                                    : item
                                                            )))}
                                                            className="q-form-input h-8 pr-7 text-center"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">元</span>
                                                    </div>
                                                    <label className="flex justify-center">
                                                        <input
                                                            type="radio"
                                                            name="combo-optional-default"
                                                            checked={selectedItem.isDefault}
                                                            onChange={() => updateOptionalGroupItems(items => items.map(item => ({
                                                                ...item,
                                                                isDefault: item.id === selectedItem.id,
                                                            })))}
                                                            className="h-4 w-4 border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                        />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOptionalProduct(selectedItem.id)}
                                                        className="mx-auto inline-flex h-8 items-center gap-1 rounded px-2 text-xs font-medium text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={14} />
                                                        移除
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex min-h-[126px] flex-col items-center justify-center border-t border-gray-100 text-sm text-gray-400">
                                                <div>暂未添加商品</div>
                                                <button
                                                    type="button"
                                                    onClick={openOptionalProductPicker}
                                                    className="mt-3 inline-flex h-8 items-center gap-1 text-sm font-bold text-[#00A35B] hover:underline"
                                                >
                                                    <Plus size={15} />
                                                    添加商品
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 border-t border-gray-100 pt-5">
                                    <div className="mb-3 text-sm font-bold text-[#1F2129]">分组设置</div>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[#F8FAFB] px-4 py-3">
                                            <div>
                                                <div className="text-sm font-medium text-[#1F2129]">配置方式</div>
                                                <div className="mt-1 text-xs leading-5 text-gray-400">
                                                    按种类选择用于“几选几”；按数量选择用于设置是否必选及购买总数。
                                                </div>
                                            </div>
                                            <div className="flex rounded-lg border border-gray-200 bg-white p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => updateOptionalGroupDraft({ configMode: 'pick' })}
                                                    className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                                                        optionalGroupDraft.configMode !== 'flexible'
                                                            ? 'bg-[#00C06B] text-white'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    按种类选择
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateOptionalGroupDraft({
                                                        configMode: 'flexible',
                                                        minTotalQuantity: optionalGroupDraft.isRequired === false
                                                            ? optionalGroupDraft.minTotalQuantity ?? 0
                                                            : Math.max(1, optionalGroupDraft.minTotalQuantity || 1),
                                                    })}
                                                    className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                                                        optionalGroupDraft.configMode === 'flexible'
                                                            ? 'bg-[#00C06B] text-white'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    按数量选择
                                                </button>
                                            </div>
                                        </div>

                                        {optionalGroupDraft.configMode !== 'flexible' ? (
                                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[#F8FAFB] px-4 py-3">
                                                <div>
                                                    <div className="text-sm font-medium text-[#1F2129]">分组内必选商品种类数</div>
                                                    <div className="mt-1 text-xs text-gray-400">
                                                        当前规则：{optionalGroupDraft.items?.length || 0} 选 {Math.min(
                                                            optionalGroupDraft.requiredOptionCount || 1,
                                                            Math.max(1, optionalGroupDraft.items?.length || 1)
                                                        )}
                                                    </div>
                                                </div>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={Math.max(1, optionalGroupDraft.items?.length || 1)}
                                                    value={optionalGroupDraft.requiredOptionCount || 1}
                                                    onChange={event => updateOptionalGroupDraft({
                                                        requiredOptionCount: Math.min(
                                                            Math.max(1, Number(event.target.value) || 1),
                                                            Math.max(1, optionalGroupDraft.items?.length || 1)
                                                        ),
                                                    })}
                                                    className="q-form-input h-10 w-24 text-center"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[#F8FAFB] px-4 py-3">
                                                    <div>
                                                        <div className="text-sm font-medium text-[#1F2129]">是否必选</div>
                                                        <div className="mt-1 text-xs text-gray-400">必选时，起购数量不能小于 1。</div>
                                                    </div>
                                                    <div className="flex rounded-lg border border-gray-200 bg-white p-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateOptionalGroupDraft({
                                                                isRequired: true,
                                                                minTotalQuantity: Math.max(1, optionalGroupDraft.minTotalQuantity || 1),
                                                            })}
                                                            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                                                                optionalGroupDraft.isRequired !== false
                                                                    ? 'bg-[#00C06B] text-white'
                                                                    : 'text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            必选
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateOptionalGroupDraft({ isRequired: false })}
                                                            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                                                                optionalGroupDraft.isRequired === false
                                                                    ? 'bg-[#00C06B] text-white'
                                                                    : 'text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            非必选
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg bg-[#F8FAFB] px-4 py-3">
                                                    <div className="text-sm font-medium text-[#1F2129]">商品购买数量限制</div>
                                                    <div className="mt-1 text-xs text-gray-400">设置用户在本组内最少和最多可购买的商品总数。</div>
                                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                                        <span className="text-sm text-gray-600">起购数量</span>
                                                        <input
                                                            type="number"
                                                            min={optionalGroupDraft.isRequired === false ? 0 : 1}
                                                            max={100}
                                                            value={optionalGroupDraft.minTotalQuantity ?? 0}
                                                            onChange={event => {
                                                                const minValue = optionalGroupDraft.isRequired === false ? 0 : 1;
                                                                const nextMin = Math.min(100, Math.max(minValue, Number(event.target.value) || 0));
                                                                updateOptionalGroupDraft({
                                                                    minTotalQuantity: nextMin,
                                                                    maxTotalQuantity: Math.max(nextMin, optionalGroupDraft.maxTotalQuantity || 100),
                                                                });
                                                            }}
                                                            className="q-form-input h-10 w-24 text-center"
                                                        />
                                                        <span className="text-gray-300">～</span>
                                                        <span className="text-sm text-gray-600">限购数量</span>
                                                        <input
                                                            type="number"
                                                            min={Math.max(1, optionalGroupDraft.minTotalQuantity || 0)}
                                                            max={100}
                                                            value={optionalGroupDraft.maxTotalQuantity || 100}
                                                            onChange={event => updateOptionalGroupDraft({
                                                                maxTotalQuantity: Math.min(
                                                                    100,
                                                                    Math.max(
                                                                        Math.max(1, optionalGroupDraft.minTotalQuantity || 0),
                                                                        Number(event.target.value) || 100
                                                                    )
                                                                ),
                                                            })}
                                                            className="q-form-input h-10 w-24 text-center"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-gray-100 pt-4">
                                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={!!optionalGroupDraft.relativePrice}
                                                onChange={event => updateOptionalGroupDraft({ relativePrice: event.target.checked })}
                                                className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                            />
                                            启用相对价
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={!!optionalGroupDraft.saveAsFreeMatch}
                                                onChange={event => updateOptionalGroupDraft({ saveAsFreeMatch: event.target.checked })}
                                                className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                            />
                                            <span>
                                                保存为随心配
                                                <span className="ml-2 text-xs text-gray-400">保存后可在其他套餐中直接复用</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4">
                                {confirmingComboOptionalSave && isEditingLinkedOptionalGroup ? (
                                    <div className="mb-3 flex items-center justify-between gap-4 rounded-lg border border-[#F2D38A] bg-[#FFF9EB] px-4 py-3 text-sm text-[#8A4B08]">
                                        <span>
                                            保存后将更新原分组，并影响已关联的门店商品。请确认是否继续。
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmingComboOptionalSave(false)}
                                            className="shrink-0 font-bold hover:underline"
                                        >
                                            返回检查
                                        </button>
                                    </div>
                                ) : null}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="text-xs text-gray-400">
                                        {!canSaveOptionalGroup
                                            ? '请填写分组名称并至少选择 1 个商品'
                                            : comboOptionalGroupModal.mode === 'edit'
                                                ? '另存为新分组不会影响原分组及已关联的门店商品'
                                                : '保存后将添加到当前套餐'}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={closeOptionalGroupEditor}
                                            className="h-10 rounded-lg border border-gray-200 px-5 text-sm font-bold text-gray-600 hover:bg-gray-50"
                                        >
                                            取消
                                        </button>
                                        {comboOptionalGroupModal.mode === 'edit' && !confirmingComboOptionalSave ? (
                                            <button
                                                type="button"
                                                disabled={!canSaveOptionalGroup}
                                                onClick={() => saveOptionalGroup(true)}
                                                className="h-10 rounded-lg border border-[#00C06B] px-5 text-sm font-bold text-[#00A35B] hover:bg-[#F0FDF4] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                                            >
                                                另存为新分组
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            disabled={!canSaveOptionalGroup}
                                            onClick={() => {
                                                if (isEditingLinkedOptionalGroup && !confirmingComboOptionalSave) {
                                                    setConfirmingComboOptionalSave(true);
                                                    return;
                                                }
                                                saveOptionalGroup(false);
                                            }}
                                            className={`h-10 rounded-lg px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300 ${
                                                'bg-[#00C06B] hover:bg-[#00A35B]'
                                            }`}
                                        >
                                            {comboOptionalGroupModal.mode === 'create'
                                                ? '保存'
                                                : confirmingComboOptionalSave
                                                    ? '确认保存修改'
                                                    : isEditingLinkedOptionalGroup
                                                        ? '保存修改'
                                                        : '保存'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {comboOptionalProductPickerOpen && optionalGroupDraft ? (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-5">
                        <div className="flex h-[820px] w-[1540px] max-h-[calc(100vh-40px)] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
                            <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#E5E6EB] px-6">
                                <div className="text-[18px] font-bold text-[#1D2129]">选择商品</div>
                                <button
                                    type="button"
                                    aria-label="关闭商品选择"
                                    onClick={() => setComboOptionalProductPickerOpen(false)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="shrink-0 border-b border-[#E5E6EB] bg-[#F7F8FA] px-5 py-4">
                                <div className="grid grid-cols-3 gap-3">
                                    {([
                                        ['name', '商品名称', '请输入商品名称'],
                                        ['barcode', '商品条码', '请输入商品条码'],
                                        ['productFlag', '商品标识', '请输入商品标识'],
                                        ['skuCode', '商品规格码', '请输入商品规格码'],
                                        ['productId', '商品 ID', '请输入商品 ID'],
                                    ] as Array<[keyof ComboOptionalProductFilters, string, string]>).map(([key, label, placeholder]) => (
                                        <label key={key} className="flex h-10 items-center border border-[#E5E6EB] bg-white px-3 text-[13px]">
                                            <span className="mr-3 shrink-0 text-[#4E5969]">{label}</span>
                                            <span className="mr-3 text-[#C9CDD4]">=</span>
                                            <input
                                                value={comboOptionalProductDraftFilters[key]}
                                                onChange={event => setComboOptionalProductDraftFilters(current => ({ ...current, [key]: event.target.value }))}
                                                className="min-w-0 flex-1 outline-none"
                                                placeholder={placeholder}
                                            />
                                        </label>
                                    ))}
                                    <label className="flex h-10 items-center border border-[#E5E6EB] bg-white px-3 text-[13px]">
                                        <span className="mr-3 shrink-0 text-[#4E5969]">前台分类</span>
                                        <span className="mr-3 text-[#C9CDD4]">=</span>
                                        <select
                                            value={comboOptionalProductDraftFilters.frontendCategory}
                                            onChange={event => setComboOptionalProductDraftFilters(current => ({ ...current, frontendCategory: event.target.value }))}
                                            className="min-w-0 flex-1 bg-white outline-none"
                                        >
                                            <option value="all">请选择前台分类</option>
                                            <option value="主食">主食</option>
                                            <option value="小吃">小吃</option>
                                            <option value="饮品">饮品</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setComboOptionalProductFilters({ ...comboOptionalProductDraftFilters });
                                            setComboOptionalProductPage(1);
                                        }}
                                        className="h-9 bg-[#00B460] px-5 text-[13px] font-medium text-white hover:bg-[#009A52]"
                                    >
                                        查询
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setComboOptionalProductDraftFilters({ ...EMPTY_COMBO_OPTIONAL_PRODUCT_FILTERS });
                                            setComboOptionalProductFilters({ ...EMPTY_COMBO_OPTIONAL_PRODUCT_FILTERS });
                                            setComboOptionalProductPage(1);
                                        }}
                                        className="h-9 border border-[#E5E6EB] bg-white px-5 text-[13px] text-[#4E5969]"
                                    >
                                        重置
                                    </button>
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col px-5 pt-4">
                                <div className="mb-3 flex h-10 shrink-0 items-center justify-end gap-3">
                                    {comboOptionalBatchProductIds.length > 0 ? (
                                        <span className="text-[12px] text-[#86909C]">
                                            已按 {comboOptionalBatchProductIds.length} 个商品 ID 筛选，命中 {matchedOptionalBatchProductCount} 个商品、{optionalProductPickerResults.length} 条规格
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setComboOptionalBatchProductIds([]);
                                                    setComboOptionalBatchFilterInput('');
                                                    setComboOptionalProductPage(1);
                                                }}
                                                className="ml-2 text-[#00B460] hover:underline"
                                            >
                                                清除
                                            </button>
                                        </span>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={openOptionalBatchFilter}
                                        className="h-9 border border-[#E5E6EB] bg-white px-4 text-[13px] text-[#4E5969] hover:border-[#00B460] hover:text-[#00B460]"
                                    >
                                        批量商品 ID 筛选
                                    </button>
                                </div>
                                <div className="min-h-0 flex-1 overflow-auto border border-[#E5E6EB]">
                                    <table className="w-full min-w-[1400px] table-fixed text-left text-[13px]">
                                        <thead className="sticky top-0 z-10 bg-[#F2F3F5] text-[#4E5969]">
                                            <tr>
                                                <th className="w-12 px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        aria-label="全选当前页"
                                                        checked={optionalProductPickerPageResults.length > 0 && optionalProductPickerPageResults.every(product => comboOptionalProductPickerDraftIds.includes(product.id))}
                                                        onChange={event => {
                                                            const pageIds = optionalProductPickerPageResults.map(product => product.id);
                                                            setComboOptionalProductPickerDraftIds(current => (
                                                                event.target.checked
                                                                    ? Array.from(new Set([...current, ...pageIds]))
                                                                    : current.filter(id => !pageIds.includes(id))
                                                            ));
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-[#00B460]"
                                                    />
                                                </th>
                                                <th className="w-[260px] px-4 py-3">商品名称</th>
                                                <th className="w-[110px] px-4 py-3">商品类型</th>
                                                <th className="w-[140px] px-4 py-3">前台分类</th>
                                                <th className="w-[120px] px-4 py-3">规格</th>
                                                <th className="w-[130px] px-4 py-3">商品标识</th>
                                                <th className="w-[130px] px-4 py-3">商品条码</th>
                                                <th className="w-[150px] px-4 py-3">商品规格码</th>
                                                <th className="w-[100px] px-4 py-3">数据来源</th>
                                                <th className="w-[100px] px-4 py-3">备注</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {optionalProductPickerPageResults.map(product => {
                                                const selected = comboOptionalProductPickerDraftIds.includes(product.id);
                                                return (
                                                    <tr key={product.id} className={`border-b border-[#F0F0F0] ${selected ? 'bg-[#F0FBF5]' : 'bg-white hover:bg-[#FAFBFC]'}`}>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected}
                                                                onChange={event => setComboOptionalProductPickerDraftIds(current => (
                                                                    event.target.checked
                                                                        ? [...current, product.id]
                                                                        : current.filter(id => id !== product.id)
                                                                ))}
                                                                className="h-4 w-4 rounded border-gray-300 text-[#00B460]"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#E5E6EB] bg-[#F7F8FA] text-[#86909C]">
                                                                    <CupSoda size={18} />
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <div className="truncate font-medium text-[#1D2129]">{product.name}</div>
                                                                    <div className="mt-1 text-[12px] text-[#86909C]">{product.productId}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-[#4E5969]">标准商品</td>
                                                        <td className="px-4 py-3 text-[#4E5969]">{product.frontendCategory}</td>
                                                        <td className="px-4 py-3 text-[#4E5969]">{product.spec}</td>
                                                        <td className="px-4 py-3 text-[#4E5969]">--</td>
                                                        <td className="px-4 py-3 text-[#4E5969]">--</td>
                                                        <td className="px-4 py-3 text-[#4E5969]">{product.skuCode}</td>
                                                        <td className="px-4 py-3 text-[#4E5969]">品牌</td>
                                                        <td className="px-4 py-3 text-[#4E5969]">--</td>
                                                    </tr>
                                                );
                                            })}
                                            {optionalProductPickerPageResults.length === 0 ? (
                                                <tr>
                                                    <td colSpan={10} className="py-16 text-center text-[#86909C]">
                                                        {comboOptionalBatchProductIds.length > 0 ? '未找到这些商品 ID 对应的商品规格' : '没有符合条件的商品'}
                                                    </td>
                                                </tr>
                                            ) : null}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex h-[68px] shrink-0 items-center justify-between border-t border-[#E5E6EB] bg-white px-6">
                                <div className="text-[13px] text-[#4E5969]">
                                    已选择 <span className="font-bold text-[#F53F3F]">{comboOptionalProductPickerDraftIds.length}</span> 个商品 / 最多可选择 <span className="font-bold text-[#F53F3F]">100</span> 个商品
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-[13px] text-[#4E5969]">
                                        <span>共 {optionalProductPickerResults.length} 条</span>
                                        <button
                                            type="button"
                                            aria-label="上一页"
                                            disabled={currentOptionalProductPage <= 1}
                                            onClick={() => setComboOptionalProductPage(current => Math.max(1, current - 1))}
                                            className="flex h-8 w-8 items-center justify-center border border-[#E5E6EB] disabled:text-[#C9CDD4]"
                                        >
                                            <ChevronLeft size={15} />
                                        </button>
                                        <span>{currentOptionalProductPage} / {optionalProductPageCount}</span>
                                        <button
                                            type="button"
                                            aria-label="下一页"
                                            disabled={currentOptionalProductPage >= optionalProductPageCount}
                                            onClick={() => setComboOptionalProductPage(current => Math.min(optionalProductPageCount, current + 1))}
                                            className="flex h-8 w-8 items-center justify-center border border-[#E5E6EB] disabled:text-[#C9CDD4]"
                                        >
                                            <ChevronRight size={15} />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setComboOptionalProductPickerDraftIds([])}
                                        className="h-9 border border-[#E5E6EB] bg-white px-5 text-[13px] text-[#4E5969]"
                                    >
                                        清空选择
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setComboOptionalProductPickerOpen(false)}
                                        className="h-9 border border-[#E5E6EB] bg-white px-5 text-[13px] font-medium text-[#4E5969]"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmOptionalProductPicker}
                                        className="h-9 bg-[#00B460] px-6 text-[13px] font-medium text-white hover:bg-[#009A52]"
                                    >
                                        确定
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {comboOptionalBatchFilterOpen ? (
                    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/45 p-6">
                        <div className="w-full max-w-[640px] overflow-hidden rounded-xl bg-white shadow-2xl">
                            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                                <div>
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <h3 className="text-lg font-bold text-[#1F2129]">批量商品 ID 筛选</h3>
                                        <span className="text-xs text-gray-400">单次最多 200 个商品</span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">命中商品后，将展示其下全部可选规格供勾选。</p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="关闭批量商品 ID 筛选"
                                    onClick={() => setComboOptionalBatchFilterOpen(false)}
                                    className="inline-flex h-8 w-8 items-center justify-center text-[#86909C] hover:text-[#4E5969]"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-3 px-6 py-5">
                                <div className="relative">
                                    <textarea
                                        value={comboOptionalBatchFilterInput}
                                        onChange={event => {
                                            setComboOptionalBatchFilterInput(event.target.value);
                                            setComboOptionalBatchFilterError('');
                                        }}
                                        rows={8}
                                        autoFocus
                                        className={`w-full resize-none rounded-lg border bg-white px-3 py-3 pr-20 text-sm leading-6 text-[#1F2129] outline-none transition-colors ${
                                            comboOptionalBatchFilterError
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-gray-200 focus:border-[#00C06B]'
                                        }`}
                                        placeholder={'请输入商品 ID，每行一个，例如：\n1293655926072582145\n1293499835987996672'}
                                    />
                                    <span className={`absolute bottom-3 right-3 text-xs ${
                                        parsedOptionalBatchProductIds.length > 200 ? 'text-red-500' : 'text-gray-400'
                                    }`}>
                                        {parsedOptionalBatchProductIds.length}/200
                                    </span>
                                </div>
                                <div className="flex min-h-5 flex-wrap items-start justify-between gap-2 text-xs">
                                    <span className={comboOptionalBatchFilterError ? 'text-red-500' : 'text-gray-400'}>
                                        {comboOptionalBatchFilterError || '支持换行、空格或逗号分隔，自动去重并忽略非数字内容。'}
                                    </span>
                                    {invalidOptionalBatchTokenCount > 0 ? (
                                        <span className="shrink-0 text-amber-600">将忽略 {invalidOptionalBatchTokenCount} 项无效内容</span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() => setComboOptionalBatchFilterOpen(false)}
                                    className="h-10 rounded-lg border border-gray-200 px-5 text-sm font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    onClick={applyOptionalBatchFilter}
                                    className="h-10 rounded-lg bg-[#00C06B] px-5 text-sm font-bold text-white hover:bg-[#00A35B]"
                                >
                                    确定筛选
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };

    const renderMethodAddonPanel = (options: { embedded?: boolean; showAttrSort?: boolean } = {}) => {
        const embedded = options.embedded ?? false;
        const showAttrSort = options.showAttrSort ?? true;
        const addonEmptyTipEnabled = !!dynamicFormData.a_addon_empty_tip_enabled;
        const selectedMethodCount = methodConfigRows.length;
        const selectedAddonCount = addonConfigRows.length;
        const methodGroups = Array.from(new Set(methodConfigRows.map(row => row.groupName)));
        const addonGroups = Array.from(new Set(addonConfigRows.map(row => row.groupName)));
        const renderedMethodChildIdSet = new Set(renderedMethodChildIds);
        const renderedAddonChildIdSet = new Set(renderedAddonChildIds);
        const showMethodName = renderedMethodChildIdSet.has('m_method_name');
        const showMethodSync = renderedMethodChildIdSet.has('m_method_sync');
        const showMethodMarkup = renderedMethodChildIdSet.has('m_method_markup');
        const showMethodCode = renderedMethodChildIdSet.has('m_method_code');
        const showMethodRemark = renderedMethodChildIdSet.has('m_method_remark');
        const showMethodTip = renderedMethodChildIdSet.has('m_method_tip');
        const showAddonRuleScope = renderedAddonChildIdSet.has('a_rule_scope');
        const showAddonRuleUnlimited = renderedAddonChildIdSet.has('a_rule_unlimited');
        const showAddonRuleLimit = renderedAddonChildIdSet.has('a_rule_limit');
        const showAddonRuleRequired = renderedAddonChildIdSet.has('a_rule_required');
        const showAddonName = renderedAddonChildIdSet.has('a_addon_name');
        const showAddonCode = renderedAddonChildIdSet.has('a_addon_code');
        const showAddonLimit = renderedAddonChildIdSet.has('a_addon_limit');
        const showAddonPrice = renderedAddonChildIdSet.has('a_addon_price');
        const showAddonSpecPrice = renderedAddonChildIdSet.has('a_addon_spec_price');
        const showAddonStatus = renderedAddonChildIdSet.has('a_addon_status');
        const showAddonEmptyTip = renderedAddonChildIdSet.has('a_empty_tip');

        const updateMethodRow = (id: string, key: keyof MethodConfigRow, value: string | boolean) => {
            setMethodConfigRows(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
        };

        const removeMethodRow = (id: string) => {
            setMethodConfigRows(prev => prev.filter(row => row.id !== id));
        };

        const updateAddonRow = (id: string, key: keyof AddonConfigRow, value: string | boolean) => {
            setAddonConfigRows(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
        };

        const getAddonGroupRule = (groupName: string): AddonGroupRule => addonGroupRules[groupName] || {
            mode: 'customer',
            countMetric: 'quantity',
            ruleMode: 'unlimited',
            min: '0',
            max: '10',
            required: '1',
            isRequired: false,
        };

        const updateAddonGroupRule = (groupName: string, patch: Partial<AddonGroupRule>) => {
            setAddonGroupRules(prev => ({
                ...prev,
                [groupName]: { ...getAddonGroupRule(groupName), ...patch },
            }));
        };

        const changeAddonScope = (scope: AddonScope) => {
            setAddonScope(scope);
            if (scope === 'total') {
                setAddonGroupRules(prev => Object.fromEntries(
                    Object.entries(prev).map(([groupName, rule]) => [groupName, { ...rule, mode: 'customer' as AddonGroupMode }])
                ));
            }
        };

        const renderRuleInputs = (
            config: AddonRuleConfig,
            onChange: (patch: Partial<AddonRuleConfig>) => void,
            name: string,
            unit: '份' | '种' = '份'
        ) => (
            <div className="flex flex-wrap items-center gap-4">
                {showAddonRuleUnlimited && (
                    <label className={`flex items-center gap-2 text-sm ${config.ruleMode === 'unlimited' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}>
                        <input type="radio" name={name} checked={config.ruleMode === 'unlimited'} onChange={() => onChange({ ruleMode: 'unlimited' })} className="accent-[#00C06B]" />
                        {unit === '种' ? '种类不限' : '数量不限'}
                    </label>
                )}
                {showAddonRuleLimit && (
                    <label className={`flex items-center gap-2 text-sm ${config.ruleMode === 'range' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}>
                        <input type="radio" name={name} checked={config.ruleMode === 'range'} onChange={() => onChange({ ruleMode: 'range' })} className="accent-[#00C06B]" />
                        {unit === '种' ? '起选/限选' : '起购/限购'}
                    </label>
                )}
                {config.ruleMode === 'range' && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <input value={config.min} onChange={e => onChange({ min: e.target.value })} className="w-16 rounded-lg border border-gray-200 px-2.5 py-2 text-center outline-none focus:border-[#00C06B]" />
                        <span>至</span>
                        <input value={config.max} onChange={e => onChange({ max: e.target.value })} className="w-16 rounded-lg border border-gray-200 px-2.5 py-2 text-center outline-none focus:border-[#00C06B]" />
                        <span>{unit}</span>
                    </div>
                )}
                {showAddonRuleRequired && config.ruleMode === 'range' && (
                    <label className={`flex items-center gap-2 text-sm ${config.isRequired ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}>
                        <input type="checkbox" checked={config.isRequired} onChange={e => onChange({ isRequired: e.target.checked })} className="h-4 w-4 rounded border-gray-300 accent-[#00C06B]" />
                        是否必选
                    </label>
                )}
                {showAddonRuleRequired && (
                    <label className={`flex items-center gap-2 text-sm ${config.ruleMode === 'required' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}>
                        <input type="radio" name={name} checked={config.ruleMode === 'required'} onChange={() => onChange({ ruleMode: 'required' })} className="accent-[#00C06B]" />
                        点餐时必选
                    </label>
                )}
                {config.ruleMode === 'required' && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{unit === '种' ? '必须选择' : '必须购买'}</span>
                        <input value={config.required} onChange={e => onChange({ required: e.target.value })} className="w-16 rounded-lg border border-gray-200 px-2.5 py-2 text-center outline-none focus:border-[#00C06B]" />
                        <span>{unit}</span>
                    </div>
                )}
            </div>
        );

        const removeAddonRow = (id: string) => {
            setAddonConfigRows(prev => prev.filter(row => row.id !== id));
        };

        return (
            <div className={embedded ? 'space-y-6' : 'rounded-2xl border border-gray-200 bg-white p-5 space-y-6'}>
                {!isComboProduct && hasSpecModuleEnabled && (
                    <div id="field-s_specs" className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">规格</div>
                        <div className="rounded-2xl bg-[#FAFAFA] p-4">
                            {hasRenderableSpecFields ? (
                                renderSpecConfigTable({ embedded: true, title: '规格设置' })
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
                                    当前未配置任何规格字段，请在“常用字段设置”中选择需要展示的规格字段。
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {hasMethodModuleEnabled && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">做法</div>
                        <div className="space-y-4">
                            {isChannelForm && (
                                <div className="text-xs leading-5 text-gray-400">
                                    做法及做法值继承商品主档，渠道不可新增、删除或修改，仅可控制是否在当前渠道启用。
                                </div>
                            )}
                            {!isChannelForm && (
                                <button
                                    type="button"
                                    onClick={openMethodPicker}
                                    className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                >
                                    <Plus size={16} className="mr-2" />
                                    选择做法
                                </button>
                            )}
                            {selectedMethodCount > 0 && (
                                <div className="rounded-2xl border border-gray-200 overflow-hidden">
                                    <table className="w-full border-collapse table-fixed">
                                        <thead className="bg-[#F7F8FA]">
                                            <tr className="text-left text-xs font-bold text-gray-500">
                                                <th className="w-[100px] px-3 py-3 border-b border-gray-200">做法</th>
                                                {showMethodName && <th className="w-[90px] px-3 py-3 border-b border-gray-200">做法值</th>}
                                                {showMethodSync && <th className="w-[118px] px-3 py-3 border-b border-gray-200">{isChannelForm ? '渠道状态' : '同步'}</th>}
                                                {!isChannelForm && showMethodMarkup && <th className="w-[96px] px-3 py-3 border-b border-gray-200">价格</th>}
                                                {!isChannelForm && showMethodCode && <th className="w-[100px] px-3 py-3 border-b border-gray-200">标识码</th>}
                                                {!isChannelForm && showMethodRemark && <th className="w-[100px] px-3 py-3 border-b border-gray-200">备注</th>}
                                                {!isChannelForm && showMethodTip && <th className="w-[110px] px-3 py-3 border-b border-gray-200">温馨提示</th>}
                                                {!isChannelForm && <th className="w-[64px] px-3 py-3 border-b border-gray-200">操作</th>}
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
                                                        {showMethodName && <td className="px-3 py-3 border-b border-gray-100">{row.m_method_name}</td>}
                                                        {showMethodSync && <td className="px-3 py-3 border-b border-gray-100">
                                                            <div className="flex items-center gap-2">
                                                                <Switch active={row.m_method_sync} onClick={() => updateMethodRow(row.id, 'm_method_sync', !row.m_method_sync)} />
                                                                {isChannelForm && (
                                                                    <span className={row.m_method_sync ? 'text-[#008F4C]' : 'text-gray-400'}>
                                                                        {row.m_method_sync ? '已启用' : '已禁用'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>}
                                                        {!isChannelForm && showMethodMarkup && <td className="px-3 py-3 border-b border-gray-100">
                                                            <div className="relative">
                                                                <input
                                                                    value={row.m_method_markup}
                                                                    onChange={e => updateMethodRow(row.id, 'm_method_markup', e.target.value)}
                                                                    className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-[#1F2129] outline-none focus:border-[#00C06B]"
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">元</span>
                                                            </div>
                                                        </td>}
                                                        {!isChannelForm && showMethodCode && <td className="px-3 py-3 border-b border-gray-100">
                                                            <input
                                                                value={row.m_method_code}
                                                                disabled={isChannelForm}
                                                                onChange={e => updateMethodRow(row.id, 'm_method_code', e.target.value)}
                                                                className={`w-full rounded-lg border px-2.5 py-2 text-[13px] outline-none ${
                                                                    isChannelForm
                                                                        ? 'cursor-not-allowed border-gray-200 bg-[#F5F6F7] text-gray-400'
                                                                        : 'border-gray-200 text-[#1F2129] focus:border-[#00C06B]'
                                                                }`}
                                                            />
                                                        </td>}
                                                        {!isChannelForm && showMethodRemark && <td className="px-3 py-3 border-b border-gray-100">
                                                            <input
                                                                value={row.m_method_remark}
                                                                disabled={isChannelForm}
                                                                onChange={e => updateMethodRow(row.id, 'm_method_remark', e.target.value)}
                                                                className={`w-full rounded-lg border px-2.5 py-2 text-[13px] outline-none ${
                                                                    isChannelForm
                                                                        ? 'cursor-not-allowed border-gray-200 bg-[#F5F6F7] text-gray-400'
                                                                        : 'border-gray-200 text-[#1F2129] focus:border-[#00C06B]'
                                                                }`}
                                                            />
                                                        </td>}
                                                        {!isChannelForm && showMethodTip && <td className="px-3 py-3 border-b border-gray-100">
                                                            <input
                                                                value={row.m_method_tip}
                                                                onChange={e => updateMethodRow(row.id, 'm_method_tip', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[13px] text-[#1F2129] outline-none focus:border-[#00C06B]"
                                                            />
                                                        </td>}
                                                        {!isChannelForm && <td className="px-3 py-3 border-b border-gray-100">
                                                            <button type="button" onClick={() => removeMethodRow(row.id)} className="text-[13px] font-bold text-gray-400 hover:text-[#00A35B]">
                                                                删除
                                                            </button>
                                                        </td>}
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

                {!isComboProduct && hasAddonModuleEnabled && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">加料</div>
                        <div className="space-y-4">
                            {isChannelForm && (
                                <div className="text-xs leading-5 text-gray-400">
                                    加料分组与加料商品继承商品主档，渠道不可新增、删除或修改，仅可控制是否在当前渠道启用。
                                </div>
                            )}
                            {!isChannelForm && (
                                <button
                                    type="button"
                                    onClick={openAddonPicker}
                                    className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:text-[#00A35B] transition-colors"
                                >
                                    <Plus size={16} className="mr-2" />
                                    选择加料
                                </button>
                            )}
                            {selectedAddonCount > 0 && (
                                <>
                                    {!isChannelForm && (showAddonRuleScope || showAddonRuleUnlimited || showAddonRuleLimit || showAddonRuleRequired) && (
                                        <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4 space-y-4">
                                            {showAddonRuleScope && (
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <span className="text-sm font-bold text-[#1F2129]">购买限制范围</span>
                                                    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                                                        <button type="button" onClick={() => changeAddonScope('total')} className={`rounded-md px-3 py-1.5 text-sm ${addonScope === 'total' ? 'bg-[#E9F9F0] font-bold text-[#00A35B]' : 'text-gray-500'}`}>限制所有加料购买总量</button>
                                                        <button type="button" onClick={() => setAddonScope('type')} className={`rounded-md px-3 py-1.5 text-sm ${addonScope === 'type' ? 'bg-[#E9F9F0] font-bold text-[#00A35B]' : 'text-gray-500'}`}>按加料类型限制购买数</button>
                                                    </div>
                                                </div>
                                            )}
                                            {addonScope === 'total' && (
                                                <div className="border-t border-gray-200 pt-4">
                                                    <div className="mb-3 text-xs text-gray-500">下方所有加料共用一套购买数量规则。</div>
                                                    {renderRuleInputs(addonTotalRule, patch => setAddonTotalRule(prev => ({ ...prev, ...patch })), 'addon-total-rule')}
                                                    {addonTotalRule.ruleMode === 'range' && !addonTotalRule.isRequired && <div className="mt-3 text-xs text-gray-400">非必选；顾客一旦购买，需要满足以上起购/限购规则。</div>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="rounded-2xl border border-gray-200 bg-[#FAFAFA] p-4 space-y-4">
                                        {addonGroups.map(groupName => {
                                            const groupRows = addonConfigRows.filter(row => row.groupName === groupName);
                                            const groupRule = getAddonGroupRule(groupName);
                                            const isFixedGroup = addonScope === 'type' && groupRule.mode === 'fixed';
                                            const fixedTotal = groupRows.reduce((sum, row) => sum + (Number(row.fixedQuantity) || 0), 0);
                                            const ruleUnit = groupRule.countMetric === 'distinct' ? '种' : '份';
                                            return (
                                                <div key={groupName} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                                    <div className="space-y-3 border-b border-gray-200 px-4 py-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-bold text-[#1F2129]">加料类型：{groupName}</span>
                                                                {isFixedGroup && <span className="rounded bg-[#E9F9F0] px-2 py-1 text-xs font-bold text-[#00A35B]">固定 {fixedTotal} 份</span>}
                                                            </div>
                                                            {addonScope === 'type' && (
                                                                <div className="inline-flex rounded-lg border border-gray-200 bg-[#FAFAFA] p-1">
                                                                    <button type="button" onClick={() => updateAddonGroupRule(groupName, { mode: 'customer' })} className={`rounded-md px-3 py-1.5 text-xs ${!isFixedGroup ? 'bg-white font-bold text-[#1F2129] shadow-sm' : 'text-gray-500'}`}>自由选择</button>
                                                                    <button type="button" onClick={() => updateAddonGroupRule(groupName, { mode: 'fixed' })} className={`rounded-md px-3 py-1.5 text-xs ${isFixedGroup ? 'bg-white font-bold text-[#1F2129] shadow-sm' : 'text-gray-500'}`}>固定加料</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {addonScope === 'type' && !isFixedGroup && (
                                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-gray-100 pt-3">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <span className="text-gray-500">限制单位</span>
                                                                    <select value={groupRule.countMetric} onChange={e => updateAddonGroupRule(groupName, { countMetric: e.target.value as AddonCountMetric })} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 outline-none focus:border-[#00C06B]">
                                                                        <option value="quantity">购买份数</option>
                                                                        <option value="distinct">加料种类</option>
                                                                    </select>
                                                                </div>
                                                                {renderRuleInputs(groupRule, patch => updateAddonGroupRule(groupName, patch), `addon-group-rule-${groupName}`, ruleUnit)}
                                                                {groupRule.ruleMode === 'range' && !groupRule.isRequired && <div className="w-full text-xs text-gray-400">非必选；顾客一旦购买，需要满足以上起购/限购规则。</div>}
                                                            </div>
                                                        )}
                                                        {isFixedGroup && <div className="border-t border-gray-100 pt-3 text-xs text-gray-400">该类型下的加料会随商品固定带入，顾客不可修改；如不需要某项，请从加料类型中移除。</div>}
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-[860px] w-full border-collapse table-fixed">
                                                            <thead className="bg-[#F7F8FA]">
                                                                <tr className="text-left text-xs font-bold text-gray-500">
                                                                    {showAddonName && <th className="w-[168px] px-3 py-3 border-b border-gray-200">加料商品</th>}
                                                                    {showAddonCode && <th className="w-[146px] px-3 py-3 border-b border-gray-200">商品编码</th>}
                                                                    {isFixedGroup && <th className="w-[104px] px-3 py-3 border-b border-gray-200">固定数量</th>}
                                                                    {showAddonLimit && !isFixedGroup && <th className="w-[104px] px-3 py-3 border-b border-gray-200">单品限购</th>}
                                                                    {(showAddonPrice || showAddonSpecPrice) && <th className="w-[112px] px-3 py-3 border-b border-gray-200">加料价格</th>}
                                                                    {showAddonStatus && <th className="w-[92px] px-3 py-3 border-b border-gray-200">商品状态</th>}
                                                                    <th className="w-[64px] px-3 py-3 border-b border-gray-200">操作</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {groupRows.map(row => (
                                                                        <tr key={row.id} className="align-top text-[13px] text-[#1F2129]">
                                                                            {showAddonName && <td className="px-3 py-3 border-b border-gray-100"><div className="font-bold">{row.addonName}</div><div className="mt-1 text-[11px] text-gray-400">ID: {row.addonCode}</div></td>}
                                                                            {showAddonCode && <td className="px-3 py-3 border-b border-gray-100 text-gray-400 break-all">{row.addonCode || '/'}</td>}
                                                                            {isFixedGroup && <td className="px-3 py-3 border-b border-gray-100">
                                                                                <input value={row.fixedQuantity} onChange={e => updateAddonRow(row.id, 'fixedQuantity', e.target.value)} className="w-20 rounded-lg border border-gray-200 px-2.5 py-2 text-center outline-none focus:border-[#00C06B]" />
                                                                            </td>}
                                                                            {showAddonLimit && !isFixedGroup && <td className="px-3 py-3 border-b border-gray-100">
                                                                                <input value={row.addonLimit} onChange={e => updateAddonRow(row.id, 'addonLimit', e.target.value)} className="w-20 rounded-lg border border-gray-200 px-2.5 py-2 text-center outline-none focus:border-[#00C06B]" />
                                                                            </td>}
                                                                            {(showAddonPrice || showAddonSpecPrice) && <td className="px-3 py-3 border-b border-gray-100 font-bold">¥{row.addonPrice}</td>}
                                                                            {showAddonStatus && <td className="px-3 py-3 border-b border-gray-100"><span className={`inline-flex rounded px-2 py-1 text-[11px] font-bold ${row.addonStatus === 'on' ? 'bg-[#ECFDF3] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>{row.addonStatus === 'on' ? '启用中' : '已停用'}</span></td>}
                                                                            <td className="px-3 py-3 border-b border-gray-100"><button type="button" onClick={() => removeAddonRow(row.id)} className="text-[13px] font-bold text-gray-400 hover:text-[#00A35B]">删除</button></td>
                                                                        </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {!isChannelForm && showAddonEmptyTip && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-[#1F2129]">加料未点提示:</span>
                                            <Switch active={addonEmptyTipEnabled} onClick={() => setDynamicFormData(prev => ({ ...prev, a_addon_empty_tip_enabled: !addonEmptyTipEnabled }))} />
                                            <span className="text-sm text-gray-400">当加料未点时，将展示该提示信息</span>
                                        </div>
                                        <div className="rounded-xl bg-[#FAFAFA] px-4 py-3 text-xs leading-6 text-gray-400">
                                            <div>说明：</div>
                                            <div>1、自由选择模式下，默认选中在下方“商品属性排序”中统一配置，顾客自行选择购买数量，此处设置购买限制。</div>
                                            <div>2、固定加料模式下，关联的加料会随商品固定带入，只需设置每项固定数量。</div>
                                            <div>3、固定加料和自由选择属于不同的加料类型；同一类型内不建议混合配置。</div>
                                        </div>
                                    </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                                {renderSectionCollapsedEntry(collapsedAttrModuleMappings)}

                {!isChannelForm && showAttrSort && (specDisplayMode === 'multi' || selectedMethodCount > 0 || (!isComboProduct && selectedAddonCount > 0)) && (
                    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                        <div className="pt-2 text-sm font-bold text-[#1F2129]">属性排序</div>
                        <div>{renderAttributeSortPanel()}</div>
                    </div>
                )}
            </div>
        );
    };

    const renderSpecPickerModal = () => {
        if (!showSpecPickerModal) return null;
        const activeGroup = SPEC_LIBRARY.find(group => group.id === activeSpecGroupId) || SPEC_LIBRARY[0];
        const activeSelections = tempSpecSelections[activeGroup.id] || [];
        const totalSelectedCount = Object.values(tempSpecSelections).reduce((sum, items) => sum + items.length, 0);
        const comboLockedGroupId = isComboProduct
            ? Object.entries(tempSpecSelections).find(([groupId, values]) => groupId !== activeGroup.id && values.length > 0)?.[0]
            : null;
        const selectedGroups = SPEC_LIBRARY
            .map(group => ({ ...group, selectedValues: tempSpecSelections[group.id] || [] }))
            .filter(group => group.selectedValues.length > 0);

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
                                <button type="button" disabled title="请先在“分类与属性”中维护规格" className="cursor-not-allowed text-gray-400">新增规格</button>
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
                                <button type="button" disabled title="请先在“分类与属性”中维护规格值" className="cursor-not-allowed text-gray-400">新增规格值</button>
                            </div>
                            {isComboProduct && (
                                <div className="mb-3 rounded-xl bg-[#FFF7ED] px-3 py-2 text-xs leading-5 text-[#C2410C]">
                                    套餐多规格只允许选择一组规格值，切换到其他组会覆盖之前的选择。
                                </div>
                            )}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-medium text-[#1F2129]">
                                    <input
                                        type="checkbox"
                                        checked={activeGroup.values.length > 0 && activeGroup.values.every(value => activeSelections.includes(value))}
                                        onChange={() => {
                                            const groupValues = [...activeGroup.values];
                                            const allChecked = groupValues.every(value => activeSelections.includes(value));
                                            setTempSpecSelections(prev => (
                                                isComboProduct
                                                    ? { [activeGroup.id]: allChecked ? [] : groupValues }
                                                    : {
                                                        ...prev,
                                                        [activeGroup.id]: allChecked ? [] : groupValues,
                                                    }
                                            ));
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    />
                                    <span>全部</span>
                                </label>
                                {activeGroup.values.map(value => {
                                    const checked = activeSelections.includes(value);
                                    return (
                                        <label key={value} className="flex items-center gap-3 text-sm text-[#1F2129]">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => setTempSpecSelections(prev => {
                                                    const groupSelections = prev[activeGroup.id] || [];
                                                    const nextGroupSelections = checked
                                                        ? groupSelections.filter(item => item !== value)
                                                        : [...groupSelections, value];
                                                    if (isComboProduct) {
                                                        return { [activeGroup.id]: nextGroupSelections };
                                                    }
                                                    return {
                                                        ...prev,
                                                        [activeGroup.id]: nextGroupSelections,
                                                    };
                                                })}
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
                                <span>已选择({totalSelectedCount})</span>
                                <button type="button" onClick={() => setTempSpecSelections({})} className="text-[#00A35B]">清空</button>
                            </div>
                            <div className="space-y-2">
                                {comboLockedGroupId && (
                                    <div className="rounded-xl bg-[#F5F7FA] px-3 py-2 text-xs text-gray-500">
                                        当前已选规格组：{SPEC_LIBRARY.find(group => group.id === comboLockedGroupId)?.name}
                                    </div>
                                )}
                                {selectedGroups.length > 0 ? selectedGroups.map(group => (
                                    <div key={group.id} className="rounded-xl bg-[#FAFAFA] px-3 py-3">
                                        <div className="text-xs font-bold text-gray-500">{group.name}</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {group.selectedValues.map(label => (
                                                <span key={label} className="rounded-full bg-white px-2.5 py-1 text-sm text-[#1F2129]">
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )) : <div className="text-sm text-gray-400">暂未选择规格</div>}
                                {selectedGroups.length > 1 && !isComboProduct && (
                                    <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] px-3 py-3 text-sm text-[#166534]">
                                        自动生成 {buildSpecCombinationNames(tempSpecSelections).length} 个规格组合
                                    </div>
                                )}
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
        const activeMethodSelections = tempMethodSelections.filter(item => item.startsWith(`${activeGroup.name}:`));
        const isAllMethodsChecked = activeGroup.values.length > 0 && activeGroup.values.every(value => activeMethodSelections.includes(`${activeGroup.name}:${value}`));
        const selectedMethodLabels = tempMethodSelections.map(item => item.split(':')[1]);

        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                <div className="w-full max-w-[1020px] h-[660px] rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <div className="text-xl font-black text-[#1F2129]">{isChannelForm ? '从商品主档选择做法' : '选择做法'}</div>
                            {isChannelForm && <div className="mt-1 text-xs text-gray-400">仅展示当前商品主档已关联的做法；渠道只能管理启用子集和售卖配置。</div>}
                        </div>
                        <button type="button" onClick={() => setShowMethodPickerModal(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                            <ChevronDown size={18} className="rotate-45" />
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-[220px_1fr_260px] min-h-0">
                        <div className="border-r border-gray-100 p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>做法</span>
                                {!isChannelForm && <button type="button" disabled title="请先在“分类与属性”中维护做法" className="cursor-not-allowed text-gray-400">新增做法</button>}
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
                                {!isChannelForm && <button type="button" disabled title="请先在“分类与属性”中维护做法值" className="cursor-not-allowed text-gray-400">新增做法值</button>}
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-medium text-[#1F2129]">
                                    <input
                                        type="checkbox"
                                        checked={isAllMethodsChecked}
                                        onChange={() => {
                                            const groupKeys = activeGroup.values.map(value => `${activeGroup.name}:${value}`);
                                            setTempMethodSelections(prev => {
                                                const otherSelections = prev.filter(item => !item.startsWith(`${activeGroup.name}:`));
                                                return isAllMethodsChecked ? otherSelections : [...otherSelections, ...groupKeys];
                                            });
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    />
                                    <span>全部</span>
                                </label>
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
        const activeAddonSelections = tempAddonSelections.filter(item => item.startsWith(`${activeGroup.name}:`));
        const isAllAddonsChecked = activeGroup.items.length > 0 && activeGroup.items.every(item => activeAddonSelections.includes(`${activeGroup.name}:${item.name}`));
        const selectedAddonLabels = tempAddonSelections.map(item => item.split(':')[1]);

        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                <div className="w-full max-w-[1020px] h-[660px] rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <div className="text-xl font-black text-[#1F2129]">{isChannelForm ? '从商品主档选择加料' : '添加加料商品'}</div>
                            {isChannelForm && <div className="mt-1 text-xs text-gray-400">仅展示当前商品主档已关联的加料；渠道只能管理启用子集和售卖配置。</div>}
                        </div>
                        <button type="button" onClick={() => setShowAddonPickerModal(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                            <ChevronDown size={18} className="rotate-45" />
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-[220px_1fr_260px] min-h-0">
                        <div className="border-r border-gray-100 p-4 overflow-y-auto">
                            <div className="mb-3 flex items-center justify-between text-sm font-bold text-gray-500">
                                <span>加料组</span>
                                {!isChannelForm && <button type="button" disabled title="请先在“配方与营养”中维护加料组" className="cursor-not-allowed text-gray-400">新增加料组</button>}
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
                                {!isChannelForm && <button type="button" disabled title="请先在“分类与属性”中维护加料商品" className="cursor-not-allowed text-gray-400">新增加料商品</button>}
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-medium text-[#1F2129]">
                                    <input
                                        type="checkbox"
                                        checked={isAllAddonsChecked}
                                        onChange={() => {
                                            const groupKeys = activeGroup.items.map(item => `${activeGroup.name}:${item.name}`);
                                            setTempAddonSelections(prev => {
                                                const otherSelections = prev.filter(item => !item.startsWith(`${activeGroup.name}:`));
                                                return isAllAddonsChecked ? otherSelections : [...otherSelections, ...groupKeys];
                                            });
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    />
                                    <span>全部</span>
                                </label>
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

    const [taskFlowStep, setTaskFlowStep] = useState<Record<TaskFlowView, number>>({ sync: 0, template: 0 });
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [showTemplatePickerModal, setShowTemplatePickerModal] = useState(false);
    const [templatePickerDraftIds, setTemplatePickerDraftIds] = useState<string[]>([]);
    const [templateKeyword, setTemplateKeyword] = useState('');
    const [templateDescKeyword, setTemplateDescKeyword] = useState('');
    const [templateChannelFilter, setTemplateChannelFilter] = useState('');
    const [templateSaleTypeFilter, setTemplateSaleTypeFilter] = useState('');
    const [templateGroupFilter, setTemplateGroupFilter] = useState('');
    const [selectedSyncProductIds, setSelectedSyncProductIds] = useState<string[]>(['current-product']);
    const [latestTemplateTask, setLatestTemplateTask] = useState<TemplateTaskRecord | null>(null);
    const [templateHistoryTypeFilter, setTemplateHistoryTypeFilter] = useState<'all' | TemplateTaskType>('all');
    const [templateHistoryStatusFilter, setTemplateHistoryStatusFilter] = useState<'all' | TemplateTaskStatus>('all');
    const [activeStoreGroupId, setActiveStoreGroupId] = useState('brand-root');
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(['store-1151709', 'store-1151708']);
    const [storeKeyword, setStoreKeyword] = useState('');
    const [storeTagFilter, setStoreTagFilter] = useState('');
    const [storeCodeFilter, setStoreCodeFilter] = useState('');
    const [selectedOverrideFields, setSelectedOverrideFields] = useState<string[]>([
        '基础价格',
        '库存',
        '起购限购',
        '商品排序',
        '分类排序',
        '售卖时间',
        '加料',
        '做法',
        '前台分类',
        '商品主图',
        '商品封面图',
        '商品详情图',
        '商品档口',
        '其他属性',
    ]);
    const [taskExecutionMode, setTaskExecutionMode] = useState<TaskExecutionMode>('immediate');
    const [scheduledExecutionText, setScheduledExecutionText] = useState('今晚21:00-早上10:30');
    const [confirmingTask, setConfirmingTask] = useState<TaskFlowView | null>(null);
    const templateHistoryRecords = [latestTemplateTask, ...DEFAULT_TEMPLATE_HISTORY_RECORDS]
        .filter((item): item is TemplateTaskRecord => !!item)
        .filter(item => templateHistoryTypeFilter === 'all' || item.type === templateHistoryTypeFilter)
        .filter(item => templateHistoryStatusFilter === 'all' || item.status === templateHistoryStatusFilter);
    const templateOptions = DEFAULT_TEMPLATE_OPTIONS;

    const renderTaskPage = (task: 'sync' | 'template' | 'detail') => {
        const currentSpecRows = specDisplayMode === 'single' ? specConfigRows.slice(0, 1) : specConfigRows;
        const currentCreatedProduct = {
            name: dynamicFormData.p_name || '未命名商品',
            typeLabel: type === 'combo' ? '套餐商品' : '标准商品',
            frontCategory: normalizeStringArrayValue(dynamicFormData.p_front_cat).join('、') || '未设置前台分类',
            stockLabel: currentSpecRows[0]?.s_spec_inventory_mode === 'unlimited'
                ? '不限库存'
                : `${currentSpecRows.reduce((sum, row) => sum + Number(row.s_spec_initial_stock || 0), 0)} 件`,
            statusLabel: currentSpecRows.some(row => row.s_spec_sale_status === 'on') ? '上架中' : '已下架',
            markLabel: currentSpecRows[0]?.s_spec_mark || '本次创建',
            barcode: currentSpecRows[0]?.s_spec_barcode || '--',
        };
        const taskProducts = [
            { id: 'current-product', ...currentCreatedProduct, actionLabel: successMode === 'edit' ? '当前编辑商品' : '当前创建商品' },
            { id: 'similar-product-1', name: `${currentCreatedProduct.name || '新品'}-堂食版`, typeLabel: currentCreatedProduct.typeLabel, frontCategory: currentCreatedProduct.frontCategory, stockLabel: '不限库存', statusLabel: '上架中', markLabel: '同系列', barcode: '690000009901', actionLabel: '可一并下发' },
            { id: 'similar-product-2', name: `${currentCreatedProduct.name || '新品'}-外卖版`, typeLabel: currentCreatedProduct.typeLabel, frontCategory: currentCreatedProduct.frontCategory, stockLabel: '86 件', statusLabel: '上架中', markLabel: '外卖专用', barcode: '690000009902', actionLabel: '可一并下发' },
        ];
        const storeGroups = [
            {
                id: 'brand-root',
                name: '餐饮2.0品牌+',
                count: 23175,
                stores: [
                    { id: 'store-1151709', name: '汤圆003', code: '-', tag: '直营网' },
                    { id: 'store-1151708', name: '御茶冰雪测试门店', code: '2341320001', tag: '测试门店' },
                    { id: 'store-1151703', name: '518待开业门店', code: '-', tag: '待开业' },
                ],
            },
            {
                id: 'brand-direct',
                name: '品牌直营',
                count: 128,
                stores: [
                    { id: 'store-1151712', name: '品牌直营-上海静安店', code: 'SH20012', tag: '直营网' },
                    { id: 'store-1151713', name: '品牌直营-杭州滨江店', code: 'HZ20031', tag: '直营网' },
                ],
            },
            {
                id: 'brand-franchise',
                name: '一级071',
                count: 64,
                stores: [
                    { id: 'store-1151801', name: '一级071-杭州西湖店', code: 'HZ71001', tag: '加盟门店' },
                    { id: 'store-1151802', name: '一级071-宁波天一店', code: 'NB71012', tag: '加盟门店' },
                ],
            },
        ];
        const overrideFieldOptions = [
            '基础价格',
            '库存',
            '起购限购',
            '商品排序',
            '分类排序',
            '售卖时间',
            '加料',
            '做法',
            '前台分类',
            '商品主图',
            '商品封面图',
            '商品详情图',
            '商品档口',
            '其他属性',
        ];
        const config = {
            sync: {
                title: '创建同步任务',
                subtitle: '待下发商品',
                desc: successMode === 'edit'
                    ? '当前编辑商品已自动加入本次同步任务，可继续补充其他商品后一并下发。'
                    : '当前创建的商品已自动加入本次同步任务，可继续补充其他商品后一并下发。',
                steps: ['选择商品', '选择门店&设置', '完成'],
            },
            template: {
                title: successMode === 'edit' ? '更新模板商品' : '加入商品模板',
                subtitle: successMode === 'edit' ? '选择待更新模板' : '选择加入商品模板',
                desc: successMode === 'edit'
                    ? '选择需要更新的模板，并勾选本次要同步到模板的属性范围。提交后将生成异步模板更新任务。'
                    : '选择需要加入的商品模板，确认后将当前商品加入模板，并生成异步模板任务。',
                steps: ['选择模板', '提交成功'],
            },
            detail: {
                title: '商品详情',
                subtitle: '查看商品信息',
                desc: '查看刚创建商品的详情与后续操作。',
                steps: ['商品信息', '渠道状态', '后续操作'],
            },
        }[task];

        if (task === 'detail') {
            return (
                <div className="min-w-0 space-y-6">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="text-lg font-black text-[#1F2129]">{config.title}</div>
                        <div className="mt-2 text-sm text-gray-400">{config.desc}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-500">
                        当前创建商品：<span className="font-bold text-[#1F2129]">{currentCreatedProduct.name}</span>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setPageView('success')} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">返回</button>
                        <button type="button" onClick={() => setPageView('success')} className="px-5 py-2 rounded-xl bg-[#00C06B] text-white text-sm font-bold">继续处理</button>
                    </div>
                </div>
            );
        }

        const activeStep = taskFlowStep[task];
        const activeStoreGroup = storeGroups.find(group => group.id === activeStoreGroupId) || storeGroups[0];
        const visibleStores = activeStoreGroup.stores.filter(store => {
            const keywordMatched = !storeKeyword || `${store.name}${store.id}${store.code}`.toLowerCase().includes(storeKeyword.toLowerCase());
            const tagMatched = !storeTagFilter || store.tag === storeTagFilter;
            const codeMatched = !storeCodeFilter || `${store.code}${store.id}`.toLowerCase().includes(storeCodeFilter.toLowerCase());
            return keywordMatched && tagMatched && codeMatched;
        });
        const visibleStoreIds = visibleStores.map(store => store.id);
        const allVisibleStoresSelected = visibleStoreIds.length > 0 && visibleStoreIds.every(id => selectedStoreIds.includes(id));
        const selectedStoreCount = selectedStoreIds.length;
        const selectedTemplates = templateOptions.filter(item => selectedTemplateIds.includes(item.id));
        const selectedTemplateNames = selectedTemplates.map(item => item.name).join('、');
        const filteredTemplateOptions = templateOptions.filter(template => {
            const keywordMatched = !templateKeyword || template.name.toLowerCase().includes(templateKeyword.toLowerCase());
            const descMatched = !templateDescKeyword || template.desc.toLowerCase().includes(templateDescKeyword.toLowerCase());
            const channelMatched = !templateChannelFilter || template.channels.includes(templateChannelFilter);
            const saleTypeMatched = !templateSaleTypeFilter || template.saleType.includes(templateSaleTypeFilter);
            const groupMatched = !templateGroupFilter || template.group.includes(templateGroupFilter);
            return keywordMatched && descMatched && channelMatched && saleTypeMatched && groupMatched;
        });
        const executionSummary = taskExecutionMode === 'scheduled'
            ? `定时执行（${scheduledExecutionText}）`
            : taskExecutionMode === 'manual'
                ? '手动执行'
                : '立即执行';
        const selectedAllOverrideFields = selectedOverrideFields.length === overrideFieldOptions.length;

        const renderStepAside = () => (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                {config.steps.map((step, index) => {
                    const completed = index < activeStep;
                    const current = index === activeStep;
                    return (
                        <div key={step} className="flex items-center mb-6 last:mb-0">
                            <div className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${completed || current ? 'border-[#00C06B] bg-[#00C06B] text-white' : 'border-gray-300 bg-white text-gray-400'}`}>
                                {completed ? <Check size={12} /> : null}
                            </div>
                            <div className={`text-sm font-bold ${current || completed ? 'text-[#1F2129]' : 'text-gray-400'}`}>{step}</div>
                        </div>
                    );
                })}
            </div>
        );

        const renderStoreSelector = () => (
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                    <div className="text-base font-black text-[#1F2129]">选择门店</div>
                    <div className="mt-1 text-xs text-gray-400">支持按门店名称、标签、编码筛选要同步的门店范围。</div>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
                        <input className="q-form-input" placeholder="请输入门店名称/编码/ID" value={storeKeyword} onChange={e => setStoreKeyword(e.target.value)} />
                        <select className="q-form-select" value={storeTagFilter} onChange={e => setStoreTagFilter(e.target.value)}>
                            <option value="">请选择门店标签</option>
                            {Array.from(new Set(storeGroups.flatMap(group => group.stores.map(store => store.tag)))).map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                        <input className="q-form-input" placeholder="门店编码 / 门店ID 筛选" value={storeCodeFilter} onChange={e => setStoreCodeFilter(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 xl:grid-cols-[260px_minmax(0,1fr)]">
                        <div className="border-r border-gray-200 bg-[#FAFAFA] p-3 space-y-2">
                            {storeGroups.map(group => {
                                const active = group.id === activeStoreGroupId;
                                return (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => setActiveStoreGroupId(group.id)}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors ${active ? 'bg-[#EAF9F1] text-[#00A35B]' : 'bg-white text-[#1F2129] hover:bg-[#F7F8FA]'}`}
                                    >
                                        <span className="text-sm font-bold">{group.name}</span>
                                        <span className="text-xs text-gray-400">{group.count}家</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="min-w-0 p-3">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-[#1F2129]">
                                    <input
                                        type="checkbox"
                                        checked={allVisibleStoresSelected}
                                        onChange={() => {
                                            setSelectedStoreIds(prev => (
                                                allVisibleStoresSelected
                                                    ? prev.filter(id => !visibleStoreIds.includes(id))
                                                    : Array.from(new Set([...prev, ...visibleStoreIds]))
                                            ));
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    />
                                    全选
                                </label>
                                <div className="text-xs text-gray-400">{activeStoreGroup.name}，共{activeStoreGroup.count}家门店</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-[720px] w-full border-collapse">
                                    <thead className="bg-[#F7F8FA]">
                                        <tr className="text-left text-xs font-bold text-gray-500">
                                            <th className="w-14 px-3 py-3 border-b border-gray-200">选择</th>
                                            <th className="px-3 py-3 border-b border-gray-200">门店名称</th>
                                            <th className="px-3 py-3 border-b border-gray-200">门店ID</th>
                                            <th className="px-3 py-3 border-b border-gray-200">门店编码</th>
                                            <th className="px-3 py-3 border-b border-gray-200">门店标签</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleStores.map(store => {
                                            const checked = selectedStoreIds.includes(store.id);
                                            return (
                                                <tr key={store.id} className={checked ? 'bg-[#F8FFFB]' : 'hover:bg-[#FAFAFA]'}>
                                                    <td className="px-3 py-3 border-b border-gray-100">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => setSelectedStoreIds(prev => (
                                                                checked ? prev.filter(id => id !== store.id) : [...prev, store.id]
                                                            ))}
                                                            className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3 border-b border-gray-100 text-sm font-bold text-[#1F2129]">{store.name}</td>
                                                    <td className="px-3 py-3 border-b border-gray-100 text-sm text-gray-500">{store.id.replace('store-', '')}</td>
                                                    <td className="px-3 py-3 border-b border-gray-100 text-sm text-gray-500">{store.code}</td>
                                                    <td className="px-3 py-3 border-b border-gray-100 text-sm text-gray-500">{store.tag}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

        const renderConfirmModal = () => {
            if (confirmingTask !== task) return null;
            return (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 px-4">
                    <div className="w-full max-w-[640px] rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <div className="text-[18px] font-black text-[#1F2129]">提示</div>
                            <button type="button" onClick={() => setConfirmingTask(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="px-6 py-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF7ED] text-[#D97706]">
                                    <CircleAlert size={20} />
                                </div>
                                <div>
                                    {task === 'template' ? (
                                        <>
                                            <div className="text-[16px] leading-8 text-[#1F2129]">确认提交模板任务吗？提交后将进入异步处理，请确认是否继续？</div>
                                            <div className="mt-3 text-base text-[#1F2129]">
                                                目标模板：
                                                <span className="ml-2 font-black text-[#00A35B]">{selectedTemplateNames || '未选择模板'}</span>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-400">
                                                {successMode === 'edit'
                                                    ? `本次将更新 ${selectedTemplateIds.length} 个模板，并按已勾选的 ${selectedOverrideFields.length} 项属性同步模板商品，可在模板批量操作历史查看处理进度。`
                                                    : `将把当前商品加入 ${selectedTemplateIds.length} 个模板，可在模板批量操作历史查看处理进度。`}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-[16px] leading-8 text-[#1F2129]">确认进行商品同步吗？操作不可恢复，请确认是否继续？</div>
                                            <div className="mt-3 text-base text-[#1F2129]">
                                                执行时间：
                                                <span className="ml-2 font-black text-[#FF4D4F]">{executionSummary}</span>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-400">将同步到 {selectedStoreCount} 家门店，覆盖 {selectedOverrideFields.length} 项同商品属性范围。</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 pb-6">
                            <button type="button" onClick={() => setConfirmingTask(null)} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">取消</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setConfirmingTask(null);
                                    if (task === 'template') {
                                        setLatestTemplateTask({
                                            id: `tpl-task-${Date.now()}`,
                                            type: successMode === 'edit' ? '更新商品' : '添加商品',
                                            content: `1个商品,${selectedTemplateIds.length}个模板`,
                                            operator: '周镇',
                                            status: 'processing',
                                            result: '处理中',
                                            createdAt: formatDateTime(new Date()),
                                        });
                                        setTaskFlowStep(prev => ({ ...prev, template: 1 }));
                                    } else {
                                        setTaskFlowStep(prev => ({ ...prev, [task]: 2 }));
                                    }
                                }}
                                className="rounded-xl bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]"
                            >
                                {task === 'template' ? '确认提交' : '确定'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        const renderSyncSettings = () => (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-base font-black text-[#1F2129]">商品同步规则</div>
                <div className="mt-4 rounded-2xl bg-[#FAFAFA] p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="text-sm text-gray-500">相同商品</div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked readOnly className="h-4 w-4 border-gray-300 text-[#00C06B] focus:ring-[#00C06B]" />
                            <span className="text-sm font-bold text-[#00A35B]">合并到门店商品</span>
                        </label>
                    </div>
                    <div className="mt-3 text-xs text-gray-400">如果遇到同名商品，会覆盖门店原商品，请勾选需要覆盖的属性范围。</div>
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 xl:grid-cols-4">
                        {overrideFieldOptions.map(field => {
                            const checked = selectedOverrideFields.includes(field);
                            return (
                                <label key={field} className="flex items-center gap-2 text-sm text-[#1F2129] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => setSelectedOverrideFields(prev => (
                                            checked ? prev.filter(item => item !== field) : [...prev, field]
                                        ))}
                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    />
                                    <span>{field}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-[96px_minmax(0,1fr)] gap-4 items-start">
                    <div className="pt-2 text-sm font-bold text-[#1F2129]">同步时间</div>
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-x-8 gap-y-3">
                            {[
                                { key: 'manual' as TaskExecutionMode, label: '手动执行' },
                                { key: 'immediate' as TaskExecutionMode, label: '立即执行' },
                                { key: 'scheduled' as TaskExecutionMode, label: '定时执行' },
                            ].map(option => (
                                <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={taskExecutionMode === option.key}
                                        onChange={() => setTaskExecutionMode(option.key)}
                                        className="h-4 w-4 border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    />
                                    <span className={`text-sm ${taskExecutionMode === option.key ? 'font-bold text-[#00A35B]' : 'text-gray-600'}`}>{option.label}</span>
                                </label>
                            ))}
                        </div>
                        {taskExecutionMode === 'scheduled' && (
                            <div className="max-w-[320px]">
                                <input className="q-form-input" value={scheduledExecutionText} onChange={e => setScheduledExecutionText(e.target.value)} />
                            </div>
                        )}
                        <div className="text-sm text-[#FF4D4F]">高峰期进行商品同步等待时间可能较久，请尽量在非高峰期进行（定时）下发，即：晚上21:00-早上10:30</div>
                    </div>
                </div>
            </div>
        );

        const renderTemplateFieldSettings = () => (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="text-base font-black text-[#1F2129]">更新属性</div>
                <div className="mt-1 text-xs text-gray-400">选择要同步更新到模板商品的属性范围，未勾选属性不会进入本次异步任务。</div>
                <div className="mt-5 rounded-2xl border border-gray-200 bg-[#FAFAFA] p-5">
                    <label className="flex items-center gap-3 text-sm font-bold text-[#1F2129] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedAllOverrideFields}
                            onChange={() => setSelectedOverrideFields(selectedAllOverrideFields ? [] : overrideFieldOptions)}
                            className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                        />
                        <span>全选以下选项</span>
                    </label>
                    <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5 xl:grid-cols-5">
                        {overrideFieldOptions.map(field => {
                            const checked = selectedOverrideFields.includes(field);
                            return (
                                <label key={field} className="flex items-center gap-3 text-sm text-[#1F2129] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => setSelectedOverrideFields(prev => (
                                            checked ? prev.filter(item => item !== field) : [...prev, field]
                                        ))}
                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                    />
                                    <span>{field}</span>
                                </label>
                            );
                        })}
                    </div>
                    <div className="mt-5 text-sm text-[#FF4D4F]">将模板内所有商品的已勾选属性，更新为当前商品库一致。</div>
                </div>
            </div>
        );

        const renderSelectedTemplateSelector = () => (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <div className="text-base font-black text-[#1F2129]">{successMode === 'edit' ? '选择待更新模板' : '选择加入商品模板'}</div>
                            <div className="mt-1 text-xs text-gray-400">
                                {successMode === 'edit'
                                    ? '已自动带出商品所在模板，也可删除或继续添加模板，并勾选本次要同步到模板的商品属性。'
                                    : '请选择要加入的商品模板，支持后续继续添加或移除模板后再提交。'}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setTemplatePickerDraftIds(selectedTemplateIds);
                                setShowTemplatePickerModal(true);
                            }}
                            className="inline-flex items-center justify-center rounded-xl border border-[#00C06B] bg-white px-4 py-2 text-sm font-bold text-[#00A35B] hover:bg-[#F0FDF4]"
                        >
                            {selectedTemplateIds.length > 0 ? '添加/调整模板' : '选择模板'}
                        </button>
                    </div>
                    <div className="mt-4 rounded-2xl border border-[#D1FAE5] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
                        {successMode === 'edit' ? '待更新商品：' : '待加入模板商品：'}
                        <span className="font-bold">{currentCreatedProduct.name}</span>
                    </div>
                </div>
                <div className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#FAFAFA] px-4 py-3">
                        <div className="text-sm text-gray-500">
                            已选择 <span className="font-black text-[#1F2129]">{selectedTemplateIds.length}</span> 个模板
                        </div>
                        {selectedTemplateIds.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedTemplateIds([])}
                                className="text-sm font-bold text-gray-500 hover:text-[#1F2129]"
                            >
                                清空
                            </button>
                        )}
                    </div>

                    {selectedTemplates.length > 0 ? (
                        <div className="overflow-hidden rounded-2xl border border-gray-200">
                            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_1fr_1fr_140px] gap-4 bg-[#F7F8FA] px-6 py-4 text-sm font-bold text-gray-500">
                                <div>模板名称</div>
                                <div>模板描述</div>
                                <div>售卖渠道</div>
                                <div>售卖类型</div>
                                <div className="text-right">操作</div>
                            </div>
                            {selectedTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_1fr_1fr_140px] gap-4 border-t border-gray-100 px-6 py-5 text-sm text-gray-500"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-black text-[#1F2129]">{template.name}</div>
                                    </div>
                                    <div className="min-w-0 break-all">{template.desc || '-'}</div>
                                    <div className="break-all">{template.channels}</div>
                                    <div>{template.saleType}</div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTemplateIds(prev => prev.filter(id => id !== template.id))}
                                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-[#1F2129]"
                                        >
                                            移除
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-[#FAFAFA] px-6 py-10 text-center">
                            <div className="text-sm font-bold text-[#1F2129]">暂未选择模板</div>
                            <div className="mt-2 text-sm text-gray-400">
                                {successMode === 'edit'
                                    ? '如需更新模板商品，请先选择或补充模板。'
                                    : '请先从模板弹窗中选择要加入的模板。'}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setTemplatePickerDraftIds(selectedTemplateIds);
                                    setShowTemplatePickerModal(true);
                                }}
                                className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]"
                            >
                                选择模板
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );

        const renderTemplateSelectionModal = () => {
            if (!showTemplatePickerModal) return null;
            return (
                <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/25 px-4 py-10">
                    <div className="flex max-h-[88vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <div className="text-[18px] font-black text-[#1F2129]">选择模板</div>
                            <button
                                type="button"
                                onClick={() => setShowTemplatePickerModal(false)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="border-b border-gray-100 bg-[#FAFAFA] px-6 py-5">
                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_280px]">
                                <input className="q-form-input" placeholder="请输入模板名称" value={templateKeyword} onChange={e => setTemplateKeyword(e.target.value)} />
                                <input className="q-form-input" placeholder="请输入模板描述" value={templateDescKeyword} onChange={e => setTemplateDescKeyword(e.target.value)} />
                                <select className="q-form-select" value={templateChannelFilter} onChange={e => setTemplateChannelFilter(e.target.value)}>
                                    <option value="">请选择售卖渠道</option>
                                    <option value="小程序">小程序</option>
                                    <option value="POS">POS</option>
                                    <option value="外卖">外卖</option>
                                </select>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[280px_280px_auto]">
                                <select className="q-form-select" value={templateSaleTypeFilter} onChange={e => setTemplateSaleTypeFilter(e.target.value)}>
                                    <option value="">请选择售卖类型</option>
                                    <option value="堂食">堂食</option>
                                    <option value="外卖">外卖</option>
                                </select>
                                <select className="q-form-select" value={templateGroupFilter} onChange={e => setTemplateGroupFilter(e.target.value)}>
                                    <option value="">请选择或输入模板分组</option>
                                    {Array.from(new Set(templateOptions.map(item => item.group))).map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                                <div className="flex gap-3">
                                    <span className="inline-flex items-center px-3 text-xs text-gray-400">筛选条件实时生效</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTemplateKeyword('');
                                            setTemplateDescKeyword('');
                                            setTemplateChannelFilter('');
                                            setTemplateSaleTypeFilter('');
                                            setTemplateGroupFilter('');
                                        }}
                                        className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    >
                                        重置
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
                            <table className="min-w-[980px] w-full border-collapse">
                                <thead className="bg-[#F7F8FA]">
                                    <tr className="text-left text-xs font-bold text-gray-500">
                                        <th className="w-14 px-4 py-3 border-b border-gray-200">选择</th>
                                        <th className="px-4 py-3 border-b border-gray-200">模板名称</th>
                                        <th className="px-4 py-3 border-b border-gray-200">模板描述</th>
                                        <th className="px-4 py-3 border-b border-gray-200">售卖渠道</th>
                                        <th className="px-4 py-3 border-b border-gray-200">售卖类型</th>
                                        <th className="px-4 py-3 border-b border-gray-200">模板类型</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTemplateOptions.map(template => {
                                        const checked = templatePickerDraftIds.includes(template.id);
                                        return (
                                            <tr key={template.id} className={checked ? 'bg-[#F8FFFB]' : 'hover:bg-[#FAFAFA]'}>
                                                <td className="px-4 py-4 border-b border-gray-100">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => setTemplatePickerDraftIds(prev => (
                                                            checked ? prev.filter(id => id !== template.id) : [...prev, template.id]
                                                        ))}
                                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm font-bold text-[#1F2129]">{template.name}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{template.desc}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{template.channels}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{template.saleType}</td>
                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{template.type}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredTemplateOptions.length === 0 && (
                                <div className="py-16 text-center text-sm text-gray-400">暂无符合条件的模板</div>
                            )}
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                            <div className="text-sm text-gray-500">已选择 <span className="font-black text-[#1F2129]">{templatePickerDraftIds.length}</span> 个模板</div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowTemplatePickerModal(false)} className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">取消</button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTemplateIds(templatePickerDraftIds);
                                        setShowTemplatePickerModal(false);
                                    }}
                                    className="rounded-xl bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B]"
                                >
                                    确定
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        const renderCompletedPanel = () => (
            <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#F0FDF4] text-[#00A35B]">
                        <CheckCircle2 size={52} />
                    </div>
          <div className="mt-6 text-[22px] font-semibold text-[#1F2129]">
                        {task === 'sync'
                            ? '同步成功，商品已下发门店'
                            : successMode === 'edit'
                                ? '更新模板任务已提交'
                                : '加入模板任务已提交'}
                    </div>
                    <div className="mt-3 text-sm text-gray-400">
                        {task === 'sync'
                            ? '可到商品同步记录里查看同步结果，也可继续处理其他商品。'
                            : `${selectedTemplateNames || `${selectedTemplateIds.length}个模板`} 已收到本次${successMode === 'edit' ? '更新' : '加入'}任务，系统将异步处理，可前往模板批量操作历史查看进度。`}
                    </div>
                    <div className="mt-8 flex justify-center gap-3">
                        {task === 'sync' ? (
                            <>
                                <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">返回列表</button>
                                <button type="button" onClick={() => setTaskFlowStep(prev => ({ ...prev, [task]: 0 }))} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">继续同步</button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">返回商品列表</button>
                                <button type="button" onClick={() => setPageView('templateHistory')} className="rounded-xl bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">查看模板批量操作历史</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );

        return (
            <>
                <div className="min-w-0 space-y-6">
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
                        {renderStepAside()}
                        <div className="space-y-5">
                            {task === 'sync' && activeStep === 0 && (
                                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                    <div className="flex flex-col gap-4 border-b border-gray-100 p-6 xl:flex-row xl:items-center xl:justify-between">
                                        <div>
                                            <div className="text-base font-black text-[#1F2129]">选择商品</div>
                                            <div className="mt-1 text-xs text-gray-400">选择本次需要同步到门店的商品，当前商品默认已加入。</div>
                                        </div>
                                        <button type="button" disabled title="批量商品选择器尚未接入当前原型" className="inline-flex cursor-not-allowed items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-400">
                                            <Plus size={16} className="mr-2" />
                                            添加商品
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-[980px] w-full border-collapse">
                                                <thead className="bg-[#F7F8FA]">
                                                    <tr className="text-left text-xs font-bold text-gray-500">
                                                        <th className="w-14 px-4 py-3 border-b border-gray-200">选择</th>
                                                        <th className="px-4 py-3 border-b border-gray-200">商品名称</th>
                                                        <th className="px-4 py-3 border-b border-gray-200">商品类型</th>
                                                        <th className="px-4 py-3 border-b border-gray-200">前台分类</th>
                                                        <th className="px-4 py-3 border-b border-gray-200">商品库存</th>
                                                        <th className="px-4 py-3 border-b border-gray-200">商品状态</th>
                                                        <th className="px-4 py-3 border-b border-gray-200">商品标识</th>
                                                        <th className="px-4 py-3 border-b border-gray-200">商品条码</th>
                                                        <th className="px-4 py-3 border-b border-gray-200">说明</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {taskProducts.map(product => {
                                                        const checked = selectedSyncProductIds.includes(product.id);
                                                        return (
                                                            <tr key={product.id} className={checked ? 'bg-[#F8FFFB]' : 'hover:bg-[#FAFAFA]'}>
                                                                <td className="px-4 py-4 border-b border-gray-100">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => setSelectedSyncProductIds(prev => (
                                                                            checked ? prev.filter(id => id !== product.id) : [...prev, product.id]
                                                                        ))}
                                                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-4 border-b border-gray-100 text-sm font-bold text-[#1F2129]">{product.name}</td>
                                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{product.typeLabel}</td>
                                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{product.frontCategory}</td>
                                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{product.stockLabel}</td>
                                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{product.statusLabel}</td>
                                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{product.markLabel}</td>
                                                                <td className="px-4 py-4 border-b border-gray-100 text-sm text-gray-500">{product.barcode}</td>
                                                                <td className="px-4 py-4 border-b border-gray-100">
                                                                    <span className="inline-flex items-center rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-bold text-[#166534]">{product.actionLabel}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-6 flex justify-end gap-3">
                                            <button type="button" onClick={() => setPageView('success')} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">取消</button>
                                            <button
                                                type="button"
                                                disabled={selectedSyncProductIds.length === 0}
                                                onClick={() => setTaskFlowStep(prev => ({ ...prev, sync: 1 }))}
                                                className="px-5 py-2 rounded-xl bg-[#00C06B] text-white text-sm font-bold disabled:cursor-not-allowed disabled:bg-[#B7E7CB]"
                                            >
                                                下一步
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {task === 'template' && activeStep === 0 && renderSelectedTemplateSelector()}

                            {task === 'template' && activeStep === 0 && successMode === 'edit' && renderTemplateFieldSettings()}

                            {task === 'sync' && activeStep === 1 && (
                                <>
                                    {renderSyncSettings()}
                                    {renderStoreSelector()}
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setPageView('success')} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">取消</button>
                                        <button type="button" onClick={() => setTaskFlowStep(prev => ({ ...prev, sync: 0 }))} className="px-5 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-bold">上一步</button>
                                        <button
                                            type="button"
                                            disabled={selectedOverrideFields.length === 0 || selectedStoreCount === 0}
                                            onClick={() => setConfirmingTask('sync')}
                                            className="px-5 py-2 rounded-xl bg-[#00C06B] text-white text-sm font-bold disabled:cursor-not-allowed disabled:bg-[#B7E7CB]"
                                        >
                                            提交并同步
                                        </button>
                                    </div>
                                </>
                            )}

                            {task === 'template' && activeStep === 0 && (
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setPageView('success')} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">取消</button>
                                    <button
                                        type="button"
                                        disabled={selectedTemplateIds.length === 0 || (successMode === 'edit' && selectedOverrideFields.length === 0)}
                                        onClick={() => setConfirmingTask('template')}
                                        className="px-5 py-2 rounded-xl bg-[#00C06B] text-white text-sm font-bold disabled:cursor-not-allowed disabled:bg-[#B7E7CB]"
                                    >
                                        {successMode === 'edit' ? '提交更新' : '确认添加'}
                                    </button>
                                </div>
                            )}

                            {task === 'template' && activeStep === 1 && renderCompletedPanel()}

                            {task === 'sync' && activeStep === 2 && renderCompletedPanel()}
                        </div>
                    </div>
                </div>
                {renderConfirmModal()}
                {renderTemplateSelectionModal()}
            </>
        );
    };

    const renderTemplateHistoryPage = () => (
        <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="text-lg font-black text-[#1F2129]">模板批量操作历史</div>
                        <div className="mt-1 text-sm text-gray-400">查看加入模板、更新模板商品等异步任务的处理进度与结果。</div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => setPageView('template')} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">返回提交结果</button>
                        <button type="button" onClick={onClose} className="rounded-xl bg-[#00C06B] px-4 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">返回商品列表</button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_240px_auto]">
                    <div>
                        <div className="mb-2 text-sm font-bold text-[#1F2129]">操作类型</div>
                        <select className="q-form-select" value={templateHistoryTypeFilter} onChange={e => setTemplateHistoryTypeFilter(e.target.value as 'all' | TemplateTaskType)}>
                            <option value="all">全部</option>
                            <option value="添加商品">添加商品</option>
                            <option value="更新商品">更新商品</option>
                        </select>
                    </div>
                    <div>
                        <div className="mb-2 text-sm font-bold text-[#1F2129]">执行状态</div>
                        <select className="q-form-select" value={templateHistoryStatusFilter} onChange={e => setTemplateHistoryStatusFilter(e.target.value as 'all' | TemplateTaskStatus)}>
                            <option value="all">全部</option>
                            <option value="processing">处理中</option>
                            <option value="completed">处理完成</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="inline-flex items-center pb-2 text-xs text-gray-400">筛选条件实时生效</span>
                        <button
                            type="button"
                            onClick={() => {
                                setTemplateHistoryTypeFilter('all');
                                setTemplateHistoryStatusFilter('all');
                            }}
                            className="text-sm font-bold text-[#00A35B]"
                        >
                            清空筛选条件
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[1080px] w-full border-collapse">
                        <thead className="bg-[#F7F8FA]">
                            <tr className="text-left text-xs font-bold text-gray-500">
                                <th className="px-5 py-4 border-b border-gray-200">操作类型</th>
                                <th className="px-5 py-4 border-b border-gray-200">操作内容</th>
                                <th className="px-5 py-4 border-b border-gray-200">操作账号</th>
                                <th className="px-5 py-4 border-b border-gray-200">状态</th>
                                <th className="px-5 py-4 border-b border-gray-200">结果</th>
                                <th className="px-5 py-4 border-b border-gray-200">创建时间</th>
                                <th className="px-5 py-4 border-b border-gray-200">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templateHistoryRecords.map(record => (
                                <tr key={record.id} className="hover:bg-[#FAFAFA]">
                                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-[#1F2129]">{record.type}</td>
                                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-[#1F2129]">{record.content}</td>
                                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-500">{record.operator}</td>
                                    <td className="px-5 py-4 border-b border-gray-100 text-sm">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                            record.status === 'processing'
                                                ? 'bg-[#FFF7E6] text-[#D97706]'
                                                : 'bg-[#F0FDF4] text-[#166534]'
                                        }`}>
                                            {record.status === 'processing' ? '处理中' : '处理完成'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-500">{record.result}</td>
                                    <td className="px-5 py-4 border-b border-gray-100 text-sm text-gray-500">{record.createdAt}</td>
                                    <td className="px-5 py-4 border-b border-gray-100 text-sm">
                                        <div className="flex gap-4 font-bold text-[#00A35B]">
                                            <button type="button" disabled title="任务详情接口尚未接入当前原型" className="cursor-not-allowed text-gray-400">查看详情</button>
                                            <button type="button" disabled title="任务结果接口尚未接入当前原型" className="cursor-not-allowed text-gray-400">执行结果</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {templateHistoryRecords.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">暂无符合条件的模板任务记录</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

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
        <div className="pc-page flex h-full w-full min-w-0 flex-col overflow-hidden bg-[#FAFAFA] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="pc-page-header z-20 flex h-[56px] min-w-0 shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-5">
                <div className="flex min-w-0 items-center">
                    {(pageView === 'form' || pageView === 'templateHistory') && (
                        <button
                            type="button"
                            aria-label="返回上一页"
                            onClick={pageView === 'form' ? onClose : () => setPageView('template')}
                            className="mr-3 -ml-2 rounded-md p-2 hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600"/>
                        </button>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <h3 className="truncate text-[18px] font-bold text-[#1F2129]">
                                {pageView === 'form' && (
                                    isChannelForm
                                        ? `编辑渠道${isComboProduct ? '套餐商品' : '商品'}`
                                        : isUnifiedForm
                                            ? `${hasSavedProduct ? '编辑' : '新建'}${isComboProduct ? '套餐商品' : '商品'}（主档 + 渠道商品）`
                                        : isMasterForm
                                            ? `${hasSavedProduct ? '编辑' : '新建'}商品主档`
                                            : isStoreForm
                                                ? `编辑门店${isComboProduct ? '套餐商品' : '商品'}`
                                            : (hasSavedProduct ? `编辑${isComboProduct ? '套餐商品' : '商品'}资料` : `填写${isComboProduct ? '套餐商品' : '商品'}资料`)
                                )}
                                {pageView === 'success' && (successMode === 'edit' ? `${isComboProduct ? '套餐商品' : '商品'}编辑成功` : `${isComboProduct ? '套餐商品' : '商品'}创建成功`)}
                                {pageView === 'sync' && '创建同步任务'}
                                {pageView === 'template' && (successMode === 'edit' ? '更新模板商品' : '加入模板')}
                                {pageView === 'detail' && '商品详情'}
                                {pageView === 'templateHistory' && '模板批量操作历史'}
                            </h3>
                            {pageView === 'form' && !isChannelForm && !isStoreForm && (
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryPickerModal(true)}
                                    className="inline-flex items-center rounded-md border border-[#B7E7CB] bg-[#EAF9F1] px-3 py-1 font-medium text-[#00A35B]"
                                >
                                    商品类目：{currentCategory.name}
                                </button>
                            )}
                        </div>
                        {pageView === 'form' && isStoreForm && (
                            <p className="truncate text-xs text-gray-400 mt-0.5">
                                {storeContext?.storeName || '当前门店'} · 商品 ID：{initialProduct?.baseProductId || initialProduct?.id || '--'}
                            </p>
                        )}
                        {pageView !== 'form' && (
                            <p className="truncate text-xs text-gray-400 mt-0.5">
                                {`已从${successMode === 'edit' ? '编辑商品页' : '创建商品页'}进入后续处理流程`}
                            </p>
                        )}
                    </div>
                </div>
                <div className="ml-4 flex shrink-0 items-center space-x-3">
                    {pageView === 'form' ? (
                        <>
                            <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm">
                                取消
                            </button>
                            {!isChannelForm && !isStoreForm && (
                                <button onClick={handleSaveDraft} className="px-5 py-2 border border-gray-200 bg-white text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                    保存为草稿
                                </button>
                            )}
                            <button onClick={handleSave} className="px-5 py-2 bg-[#1F2129] text-white font-bold rounded-lg shadow-lg hover:bg-black transition-all active:scale-95 text-sm flex items-center">
                                <Check size={16} className="mr-2"/> {hasSavedProduct ? '保存修改' : '保存'}
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            <div className="relative flex-1 flex overflow-hidden min-w-0">
                {pageView === 'form' && !isMasterForm && isPreviewPanelOpen && (
                    <div className="w-[300px] bg-white border-r border-[#E8E8E8] shrink-0 flex flex-col">
                        {renderPreviewPanel()}
                    </div>
                )}

                {pageView === 'form' && !isMasterForm && (
                    <button
                        type="button"
                        onClick={togglePreviewPanel}
                        className={`absolute top-1/2 z-20 flex h-12 -translate-y-1/2 items-center justify-center rounded-r-full rounded-l-[14px] border backdrop-blur-sm transition-all ${
                            isPreviewPanelOpen
                                ? 'w-8 border-white/80 bg-white/88 text-[#7C8596] shadow-[0_10px_24px_rgba(15,23,42,0.10)] hover:border-[#D7F0E1] hover:bg-white hover:text-[#00A35B]'
                                : 'w-9 border-[#D7F0E1] bg-[#F7FFF9]/96 text-[#00A35B] shadow-[0_12px_28px_rgba(0,192,107,0.16)] hover:border-[#B7E7CB] hover:bg-white'
                        }`}
                        style={{ left: isPreviewPanelOpen ? 290 : 0 }}
                        title={isPreviewPanelOpen ? '收起效果示例' : '展开效果示例'}
                    >
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                            isPreviewPanelOpen ? 'bg-[#F4F6F8] text-[#667085]' : 'bg-[#ECFDF3] text-[#00A35B]'
                        }`}>
                            {isPreviewPanelOpen ? <EyeOff size={15} /> : <Eye size={15} />}
                        </span>
                    </button>
                )}

                {/* Form Content */}
                <div ref={formContentRef} className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto px-4 pb-8 scroll-smooth no-scrollbar lg:px-5 xl:px-6">
                    <div className={`w-full min-w-0 mx-auto pt-3 pb-12 ${compactFormMode ? 'max-w-[1480px] space-y-1.5' : 'max-w-[1240px] space-y-2'}`}>
                        {pageView === 'success' ? (
                            <div className="space-y-5">
                                <div className="rounded-lg border border-[#D7F0E1] bg-white p-6">
                                    <div className="w-full">
                                        <div className="inline-flex items-center rounded-md border border-[#C9EFD8] bg-[#F2FCF6] px-3 py-1.5 text-sm font-bold text-[#00A35B]">
                                            <CheckCircle2 size={16} className="mr-2" />
                                            {successMode === 'edit' ? '编辑成功' : '创建成功'}
                                        </div>
                                        <div className="mt-4 text-[20px] font-bold text-[#1F2129]">
                                            {isChannelForm
                                                ? '渠道商品资料已保存'
                                                : isUnifiedForm
                                                    ? (successMode === 'edit' ? '商品已更新' : '商品已创建')
                                                    : successMode === 'edit'
                                                        ? '商品主档已更新'
                                                        : '商品主档已创建'}
                                        </div>
                                         <div className="mt-3 text-sm text-gray-500">
                                             {isChannelForm
                                                 ? `已保存至${channelContext?.catalogName || '渠道商品库'}，可继续加入模板或发布至门店渠道。`
                                                 : isUnifiedForm
                                                 ? `主档资料与渠道商品资料已一次保存，并已加入${channelContext?.catalogName || '当前渠道商品库'}；当前尚未发布。`
                                                 : successMode === 'edit'
                                                 ? '商品主档修改已保存。渠道商品仍保留自己的销售属性，可进入渠道商品库确认继承变化后再发布。'
                                                 : '商品主档已创建，系统已自动在品牌默认商品库生成对应渠道商品。渠道商品当前未发布，可继续维护销售属性和适用渠道。'}
                                         </div>
                                         {successMode === 'create' && isMasterForm && (
                                             <div className="mt-5 flex items-start border border-[#C9EFD8] bg-[#F2FCF6] px-4 py-3">
                                                 <CheckCircle2 size={17} className="mr-2 mt-0.5 shrink-0 text-[#00A35B]" />
                                                 <div><div className="text-sm font-black text-[#087443]">已自动加入品牌默认商品库</div><div className="mt-1 text-xs leading-5 text-[#4D7C62]">自动加入不等于发布或上架；名称、图片、售价、适用渠道及平台专属属性需在渠道商品库确认。</div></div>
                                             </div>
                                         )}
                                         <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                                             <button
                                                 type="button"
                                                onClick={() => (isUnifiedForm || successMode === 'edit')
                                                    ? handleSuccessAction('sync')
                                                    : onOpenChannelCatalog?.()}
                                                 className="rounded-lg border border-[#BBF7D0] bg-[#F7FFF9] p-5 text-left hover:border-[#00C06B] hover:bg-[#F0FDF4] transition-colors"
                                             >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="inline-flex items-center rounded-full bg-[#00C06B] px-3 py-1 text-xs font-black text-white">推荐</div>
                                                    <Send size={18} className="text-[#00A35B]" />
                                                </div>
                                                 <div className="mt-4 text-base font-bold text-[#1F2129]">{isChannelForm || isUnifiedForm || successMode === 'edit' ? '下发更新到门店' : '维护渠道销售属性'}</div>
                                                 <div className="mt-1.5 text-sm text-gray-500">{isChannelForm || isUnifiedForm || successMode === 'edit' ? '确认本次商品改动后，创建发布任务并同步至适用门店渠道。' : '进入品牌默认商品库，确认渠道名称、售价、图片、适用渠道和平台属性。'}</div>
                                                 <div className="mt-4 inline-flex items-center rounded-md bg-[#00C06B] px-4 py-2 text-sm font-bold text-white">
                                                     {isUnifiedForm || successMode === 'edit' ? '立即下发更新' : '进入渠道商品库'}
                                                    <ArrowRight size={16} className="ml-2" />
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSuccessAction('template')}
                                                className="rounded-lg border border-gray-200 bg-[#FAFAFA] p-5 text-left hover:border-[#00C06B] hover:bg-white transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-black text-gray-500 border border-gray-200">备选方式</div>
                                                    <ClipboardList size={18} className="text-[#00A35B]" />
                                                </div>
                                                <div className="mt-4 text-base font-bold text-[#1F2129]">{successMode === 'edit' ? '更新模板商品' : '加入商品模板'}</div>
                                                <div className="mt-1.5 text-sm text-gray-500">{successMode === 'edit' ? '适合通过模板管理门店商品，且此次改动需要更新模板商品。' : '适合同一商品在不同门店做差异化配置，可基于模板统一维护门店属性。'}</div>
                                                <div className="mt-4 inline-flex items-center text-sm font-bold text-[#00A35B]">
                                                    {successMode === 'edit' ? '选择模板并更新' : '选择模板并加入'}
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
                                    <button type="button" onClick={() => setPageView('form')} className="flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:bg-[#F8FFFB] transition-colors">
                                        <ClipboardList size={16} className="mr-2 text-[#00A35B]" />
                                        继续编辑
                                    </button>
                                    <button type="button" onClick={onClose} className="flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-[#1F2129] hover:border-[#00C06B] hover:bg-[#F8FFFB] transition-colors">
                                        <ArrowLeft size={16} className="mr-2 text-[#00A35B]" />
                                        {isChannelForm || isUnifiedForm ? '返回渠道商品库' : '返回商品主档'}
                                    </button>
                                </div>
                            </div>
                        ) : pageView === 'sync' || pageView === 'template' || pageView === 'detail' ? (
                            renderTaskPage(pageView)
                        ) : pageView === 'templateHistory' ? (
                            renderTemplateHistoryPage()
                        ) : (
                        <>
                        {!isMasterForm && (
                        <div ref={stickyToolbarRef} className="sticky top-0 z-10 pb-2 bg-[#F5F6FA]">
                            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                                <div className="px-4 pt-2.5 pb-1.5 border-b border-gray-100">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                                            {visibleSectionOrder.map(section => (
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
                                                    <span>{getSectionLabel(section)}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {!isStoreForm && <div className="shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => onOpenCommonFieldSettings?.(type, currentCategory.id)}
                                                 className="inline-flex items-center rounded-lg border border-[#B7E7CB] bg-[#F7FFF9] px-3.5 py-2 text-sm font-bold text-[#00A35B] hover:bg-[#F0FDF4]"
                                            >
                                                <Settings size={14} className="mr-2" />
                                                常用字段设置
                                            </button>
                                        </div>}
                                    </div>
                                </div>
                                {!isChannelForm && !isStoreForm && (
                                <div className="px-4 py-2 bg-[#FCFCFD]">
                                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                                        <div className="text-sm font-black text-[#1F2129] shrink-0">创建进度</div>
                                        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-[#1F2129]">
                                            {completionSummary.completed}/{completionSummary.total}
                                        </div>
                                        {requiredStatusItems.map(item => (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => locateValidationItem(item)}
                                                className={`inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                                                    item.filled
                                                        ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534] hover:bg-[#ECFDF3]'
                                                        : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                }`}
                                            >
                                                {item.filled ? <CheckCircle2 size={12} className="mr-1.5" /> : <CircleAlert size={12} className="mr-1.5" />}
                                                {item.label}
                                            </button>
                                        ))}
                                        {recommendedStatusItems.map(item => (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => scrollToTarget(getValidationTargetId(item.key), item.section)}
                                                className={`inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                                                    item.filled
                                                        ? 'border-[#D1FAE5] bg-white text-[#166534] hover:bg-[#F0FDF4]'
                                                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                                                    item.filled
                                                        ? 'bg-[#F0FDF4] text-[#166534]'
                                                        : 'bg-[#F5F6FA] text-gray-500'
                                                }`}>
                                                    建议
                                                </span>
                                                {item.filled ? <CheckCircle2 size={12} className="mr-1.5 text-[#16A34A]" /> : null}
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-2">
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
                                </div>
                                )}
                            </div>
                        </div>
                        )}
                        {/* Basic Section */}
                        {sectionVisibility.basic && (
                            <div id="basic" className={`scroll-mt-[190px] bg-white rounded-lg border border-gray-200 ${compactFormMode ? 'p-3.5 xl:p-4 space-y-1.5' : 'p-4 xl:p-5 space-y-2'}`}>
                                <SectionHeader title={getSectionLabel('basic')} icon={<FileText size={20}/>} />
                                {isUnifiedForm && (
                                    <div id="field-master-name" className="col-span-full mb-2 max-w-[760px]">
                                            <label className="mb-2 block text-sm font-bold text-[#1D2129]"><span className="mr-1 text-[#E5484D]">*</span>{isComboProduct ? '套餐名称' : '商品名称'}</label>
                                            <div className="relative">
                                                <input
                                                    id="required-field-master-name"
                                                    className="q-form-input pr-14"
                                                    value={masterProductName}
                                                    maxLength={70}
                                                    placeholder={`请输入${isComboProduct ? '套餐' : '商品'}名称`}
                                                    onChange={event => {
                                                        const nextName = event.target.value;
                                                        setMasterProductName(nextName);
                                                        setDynamicFormData(prev => ({ ...prev, p_name: nextName }));
                                                    }}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3]">{masterProductName.length}/70</span>
                                            </div>
                                    </div>
                                )}
                                <div className={`grid ${compactFormMode ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-1' : 'grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-1.5'}`}>
                                    {visibleBasicFields.map(field => {
                                        const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                        const isFullWidth = ['p_display_type', 'p_remark'].includes(field.id) || field.type === 'rich_text';
                                        const isInheritedReadonly = isChannelFieldReadonly(field.id);
                                        return (
                                            <div
                                                id={`field-${field.id}`}
                                                key={field.id}
                                                className={
                                                    isFullWidth
                                                        ? 'col-span-full'
                                                        : 'col-span-1'
                                                }
                                                    >
                                                <div className="relative" onClick={() => setActivePreviewField((field.id === 'p_name' ? 'p_name' : 'default') as PreviewField)}>
                                                    {isInheritedReadonly && (
                                                        <span className="absolute right-0 top-0 z-[1] text-[11px] font-medium text-gray-400">继承主档，不可修改</span>
                                                    )}
                                                    <fieldset disabled={isInheritedReadonly} className={isInheritedReadonly ? 'opacity-65' : ''}>
                                                    <FormRow label={getFieldDisplayLabel(field)} required={isRequired} description={getFieldDescription(field)} descriptionPlacement="bottom">
                                                        {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                                    </FormRow>
                                                    </fieldset>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {showMasterMainImage && renderMasterMainImageField()}
                                </div>
                                {expandedBasicDynamicFields.length > 0 && (
                                    <div className={`grid ${compactFormMode ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-1' : 'grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-1.5'}`}>
                                        {expandedBasicDynamicFields.map(field => {
                                            const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                            const isFullWidth = ['p_display_type', 'p_remark'].includes(field.id) || field.type === 'rich_text';
                                            const isInheritedReadonly = isChannelFieldReadonly(field.id);
                                            return (
                                                <div
                                                    id={`field-${field.id}`}
                                                    key={field.id}
                                                    className={isFullWidth ? 'col-span-full' : 'col-span-1'}
                                                >
                                                    <div className="relative" onClick={() => setActivePreviewField((field.id === 'p_name' ? 'p_name' : 'default') as PreviewField)}>
                                                        {isInheritedReadonly && (
                                                            <span className="absolute right-0 top-0 z-[1] text-[11px] font-medium text-gray-400">继承主档，不可修改</span>
                                                        )}
                                                        <fieldset disabled={isInheritedReadonly} className={isInheritedReadonly ? 'opacity-65' : ''}>
                                                        <FormRow label={getFieldDisplayLabel(field)} required={isRequired} description={getFieldDescription(field)} descriptionPlacement="bottom">
                                                            {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                                        </FormRow>
                                                        </fieldset>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {renderSectionCollapsedEntry(basicCollapsedFieldMappings)}
                            </div>
                        )}

                        <>
                        {/* Product Attr Section */}
                        {sectionVisibility.method && (
                            <div id="method" className={`scroll-mt-[190px] bg-white rounded-lg border border-gray-200 ${compactFormMode ? 'p-3.5 xl:p-4 space-y-2' : 'p-4 xl:p-5 space-y-2.5'}`}>
                                <SectionHeader title={getSectionLabel('method')} icon={<ChefHat size={20}/>} />
                                {isComboProduct ? (
                                    <div id="field-s_specs">
                                        {renderComboProductPanel()}
                                    </div>
                                ) : (
                                    renderMethodAddonPanel()
                                )}
                            </div>
                        )}

                        {/* Display Section */}
                        {sectionVisibility.display && (
                            <div id="display" className={`scroll-mt-[190px] bg-white rounded-lg border border-gray-200 ${compactFormMode ? 'p-3.5 xl:p-4 space-y-2' : 'p-4 xl:p-5 space-y-2.5'}`}>
                                <SectionHeader title={getSectionLabel('display')} icon={<Tags size={20}/>} />
                                {isUnifiedForm && visibleUnifiedChannelBasicFields.length > 0 && (
                                    <div className="rounded-lg border border-[#DDE5EC] bg-[#FAFCFD] p-4">
                                        <div className="mb-3">
                                            <div className="text-sm font-bold text-[#1F2129]">渠道基础属性</div>
                                            <div className="mt-1 text-xs leading-5 text-[#667085]">这些信息只影响当前渠道商品库，可在创建时直接设置。</div>
                                        </div>
                                        <div className={`grid ${compactFormMode ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-3 gap-y-1' : 'grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-1.5'}`}>
                                            {visibleUnifiedChannelBasicFields.map(field => {
                                                const isRequired = currentFieldConfigMap.get(field.id)?.isRequired || field.isRequired;
                                                const isFullWidth = field.id === 'p_display_type';
                                                return (
                                                    <div id={`field-${field.id}`} key={`unified-channel-${field.id}`} className={isFullWidth ? 'col-span-full' : 'col-span-1'}>
                                                        <FormRow label={getFieldDisplayLabel(field)} required={isRequired} description={getFieldDescription(field)} descriptionPlacement="bottom">
                                                            {renderDynamicInput({ ...field, isRequiredConfig: !!isRequired })}
                                                        </FormRow>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {renderDisplaySettingsSection()}
                                {renderSectionCollapsedEntry([
                                    ...unifiedChannelBasicCollapsedFieldMappings,
                                    ...displayCollapsedFieldMappings,
                                ])}
                            </div>
                        )}

                        {/* Sales Section */}
                        {sectionVisibility.spec && (
                            <div id="spec" className={`scroll-mt-[190px] bg-white rounded-lg border border-gray-200 ${compactFormMode ? 'p-3.5 xl:p-4 space-y-2' : 'p-4 xl:p-5 space-y-2.5'}`}>
                                <SectionHeader title={getSectionLabel('spec')} icon={<Scale size={20}/>} />
                                {renderSalesAttributePanel()}
                                <div className={`grid ${compactFormMode ? 'grid-cols-2 xl:grid-cols-4 gap-x-3 gap-y-2' : 'grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-2.5'}`}>
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
                                {renderSectionCollapsedEntry(salesCollapsedFieldMappings)}
                            </div>
                        )}

                        {/* Others Section */}
                        {sectionVisibility.settings && (
                            <div id="settings" className={`scroll-mt-[190px] bg-white rounded-lg border border-gray-200 min-w-0 overflow-hidden ${compactFormMode ? 'p-3.5 xl:p-4 space-y-2' : 'p-4 xl:p-5 space-y-2.5'}`}>
                                <SectionHeader title={getSectionLabel('settings')} icon={<Settings size={20}/>} />
                                {renderOthersAttributePanel()}
                                {renderSectionCollapsedEntry(otherCollapsedFieldMappings)}
                            </div>
                        )}

                        {thirdPartyChannelAttributeIds.length > 0 && (
                            <div id="third_party" className="scroll-mt-[190px] bg-white rounded-lg border border-gray-200 p-4 xl:p-5">
                                <WebThirdPartyChannelFields
                                    channelIds={thirdPartyChannelAttributeIds}
                                    location={isChannelForm || isUnifiedForm ? 'channel' : 'master'}
                                    title={isChannelForm || isUnifiedForm ? '渠道专属属性' : '三方渠道发布属性'}
                                />
                            </div>
                        )}
                        </>
                        </>
                        )}

                    </div>
                </div>
            </div>
            {showCategoryPickerModal && (
                <WebCategorySelectModal
                    type={type}
                    onClose={() => setShowCategoryPickerModal(false)}
                    categories={categories}
                    onSelect={handleCategorySelect}
                />
            )}
            {renderSpecPickerModal()}
            {renderMethodPickerModal()}
            {renderAddonPickerModal()}
            {isStoreForm && storeSaveStage && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-6">
                    <div className="flex max-h-[82vh] w-full max-w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-[#E8E8E8] px-6 py-5">
                            <div>
                                <h3 className="text-lg font-black text-[#1F2129]">
                                    {storeSaveStage === 'saving'
                                        ? '正在保存门店商品'
                                        : storeSaveStage === 'result'
                                            ? '门店商品保存完成'
                                            : '确认保存门店商品'}
                                </h3>
                                <p className="mt-1 text-xs text-[#667085]">
                                    {storeContext?.storeName || '当前门店'} · {initialProduct?.name || (isComboProduct ? '套餐商品' : '商品')}
                                </p>
                            </div>
                            {storeSaveStage !== 'saving' && (
                                <button
                                    type="button"
                                    aria-label="关闭"
                                    onClick={() => setStoreSaveStage(null)}
                                    className="rounded-md p-1.5 text-[#98A2B3] hover:bg-[#F5F6F8] hover:text-[#475467]"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                            {storeSaveStage === 'saving' ? (
                                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                                    <LoaderCircle size={36} className="animate-spin text-[#00B865]" />
                                    <div className="mt-4 text-base font-black text-[#1F2129]">正在实时更新 {selectedStoreChannelIds.length} 个渠道</div>
                                    <div className="mt-2 text-sm text-[#667085]">请勿关闭页面，全部渠道保存完成后将直接反馈结果。</div>
                                </div>
                            ) : (
                                <>
                                    {storeSaveStage === 'confirm' && (
                                        <div className="mb-4 rounded-md border border-[#E5EAF0] bg-white px-4 py-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-sm font-black text-[#1F2129]">
                                                        <span className="text-[#F04438]">*</span>
                                                        生效渠道
                                                        <span className="ml-1 text-xs font-normal text-[#98A2B3]">已选 {selectedStoreChannelIds.length} 个</span>
                                                    </div>
                                                    <div className="mt-1 text-xs leading-5 text-[#667085]">
                                                        {storeContext?.activeChannelId === 'all'
                                                            ? '默认选中该商品当前所在渠道，可按本次修改范围调整。'
                                                            : `当前从${STORE_CHANNEL_LABELS[storeContext?.activeChannelId || ''] || '指定渠道'}进入，本次仅保存到该渠道。`}
                                                    </div>
                                                </div>
                                                {storeContext?.activeChannelId === 'all' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedStoreChannelIds(storeContext?.currentChannelIds || [])}
                                                        className="text-xs font-bold text-[#00A35B] hover:text-[#008F50]"
                                                    >
                                                        全选当前渠道
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {(storeContext?.currentChannelIds || []).map(channelId => {
                                                    const selected = selectedStoreChannelIds.includes(channelId);
                                                    const selectable = storeContext?.activeChannelId === 'all';
                                                    return (
                                                        <button
                                                            key={channelId}
                                                            type="button"
                                                            disabled={!selectable}
                                                            onClick={() => {
                                                                if (!selectable) return;
                                                                setSelectedStoreChannelIds(prev => selected
                                                                    ? prev.filter(id => id !== channelId)
                                                                    : [...prev, channelId]);
                                                            }}
                                                            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                                                                selected
                                                                    ? 'border-[#7AD7A6] bg-[#F0FBF5] text-[#087443]'
                                                                    : 'border-[#DDE3EA] bg-white text-[#667085] hover:border-[#B7E7CB]'
                                                            } ${selectable ? '' : 'cursor-default opacity-80'}`}
                                                        >
                                                            <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-[#00B865] bg-[#00B865] text-white' : 'border-[#B8C0CC] bg-white'}`}>
                                                                {selected && <Check size={11} strokeWidth={3} />}
                                                            </span>
                                                            {STORE_CHANNEL_LABELS[channelId] || channelId}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {selectedStoreChannelIds.length === 0 && (
                                                <div className="mt-2 text-xs text-[#F04438]">请至少选择一个生效渠道</div>
                                            )}
                                        </div>
                                    )}

                                    <div className={`flex items-start gap-3 rounded-md border px-4 py-3 ${
                                        storeSaveStage === 'result'
                                            ? 'border-[#B7E7CB] bg-[#F0FBF5]'
                                            : storeMissingChildCount > 0
                                                ? 'border-[#F4D28C] bg-[#FFF9EB]'
                                                : 'border-[#DDE5EC] bg-[#F7F9FB]'
                                    }`}>
                                        {storeSaveStage === 'result'
                                            ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#00A35B]" />
                                            : <CircleAlert size={19} className={`mt-0.5 shrink-0 ${storeMissingChildCount > 0 ? 'text-[#D97706]' : 'text-[#667085]'}`} />}
                                        <div>
                                            <div className="text-sm font-black text-[#1F2129]">
                                                {storeSaveStage === 'result'
                                                    ? `已成功更新 ${selectedStoreChannelIds.length} 个渠道`
                                                    : `本次修改将作用于 ${selectedStoreChannelIds.length} 个渠道`}
                                            </div>
                                            <div className="mt-1 text-xs leading-5 text-[#667085]">
                                                {storeSaveStage === 'result'
                                                    ? '所选渠道均已实时保存完成，本次修改已生效。'
                                                    : storeMissingChildCount > 0
                                                        ? '缺失的套餐子商品将继承门店商品资料并默认上架；每个渠道内先补齐子商品，成功后再更新套餐结构。'
                                                        : '确认后将实时更新所选渠道，全部保存完成后再返回结果。'}
                                            </div>
                                        </div>
                                    </div>

                                    {storeSaveStage === 'confirm' && storeMissingChildCount > 0 && (
                                        <div className="mt-4 text-xs leading-5 text-[#667085]">
                                            共需在所选渠道补齐 {storeMissingChildCount} 个套餐子商品。若某渠道补齐失败，该渠道不会继续更新套餐结构，其他渠道不受影响。
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {storeSaveStage !== 'saving' && (
                            <div className="flex items-center justify-between border-t border-[#E8E8E8] bg-white px-6 py-4">
                                <div className="text-xs text-[#98A2B3]">
                                    {storeSaveStage === 'result' ? '本次保存已完成' : '保存时将实时更新所选渠道'}
                                </div>
                                <div className="flex gap-3">
                                    {storeSaveStage === 'confirm' ? (
                                        <>
                                            <button type="button" onClick={() => setStoreSaveStage(null)} className="rounded-md border border-[#DDE3EA] px-5 py-2 text-sm font-bold text-[#475467] hover:bg-[#F7F8FA]">取消</button>
                                            <button
                                                type="button"
                                                onClick={handleConfirmStoreSave}
                                                disabled={selectedStoreChannelIds.length === 0}
                                                className="rounded-md bg-[#00B865] px-5 py-2 text-sm font-bold text-white hover:bg-[#009F57] disabled:cursor-not-allowed disabled:bg-[#B7E7CB]"
                                            >
                                                确认保存
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" onClick={handleFinishStoreSave} className="rounded-md bg-[#00B865] px-5 py-2 text-sm font-bold text-white hover:bg-[#009F57]">返回门店商品</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`.q-form-input { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 8px 12px; min-height: 38px; font-size: 13px; outline: none; transition: all 0.2s; background: white; } .q-form-input:focus { border-color: #00C06B; box-shadow: 0 0 0 3px rgba(0, 192, 107, 0.1); } .q-form-select { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 8px 12px; min-height: 38px; font-size: 13px; outline: none; transition: all 0.2s; background: white; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; } .q-form-input:disabled, .q-form-select:disabled, fieldset:disabled .q-form-input, fieldset:disabled .q-form-select { cursor: not-allowed; border-color: #E5E7EB; color: #6B7280; background-color: #F5F6F7; }`}</style>
        </div>
    );
}
