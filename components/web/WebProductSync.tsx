import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Search, ChevronRight, CheckCircle2, ChevronDown,
    Layers, RefreshCw, FileUp, FileEdit, X, PackagePlus, Tickets, Tags, Copy, Trash2
} from 'lucide-react';
import { WebProductToolFlow, type ProductTool } from './WebProductToolFlow';
import { useProducts } from '../../context';
import {
    channelGroupIncludesMiniProgram,
    getEffectiveChannelGroups,
    getOmnichannelChannel,
    getOmnichannelConfig,
    isThirdPartyChannelId,
    shouldShowChannelCatalog,
} from '../../omnichannel';
import { AVAILABLE_DYNAMIC_FIELDS, type OmnichannelChannelId, type Product } from '../../types';
import { PRODUCT_SALES_SCOPE_STORES, type ProductSalesScope } from './WebProductSalesScope';
import { WebStoreScopeSelector } from './WebStoreScopeSelector';
import { WebStoreScopePanel } from './WebStoreScopePanel';
import type { StoreProductRecord } from './WebStoreProductList';
import { INITIAL_RECORDS as TEMPLATE_RECORDS } from './WebProductTemplateManager';
import { STORE_OPTIONS as TEMPLATE_STORES } from './WebProductTemplateDetail';
import { WebPublishRecords, type MasterChannelSyncRecord, type PublishBatch, type RecordView } from './WebPublishRecords';
import { WebProductSelectorDialog, type SelectableProduct } from './WebProductSelectorDialog';
import { checkJdStoreReadiness, checkTakeoutProduct, checkTakeoutRequiredInfo, isTakeoutChannel, takeoutOperationPlan } from '../../takeoutSync';
import { WebStoreProductDeleteFlow } from './WebStoreProductDeleteFlow';
import type { DeleteTarget } from '../../storeProductDeletion';
import { WebPublishWarnings } from './WebPublishWarnings';
import { checkChannelRequiredFields } from './WebThirdPartyChannelFields';
import { WebProductPublishRules, getPublishOverwriteDefaults } from './WebProductPublishRules';

type ProductCategoryConfig = {
    id: string;
    name: string;
    categorySort: number;
    productSort: number;
};

type ProductSpec = {
    id: string;
    name: string;
    price: number;
};

type TimeSaleConfig = {
    enabled: boolean;
    startDate: string;
    endDate: string;
    weekdays: string[];
    startTime: string;
    endTime: string;
};

type EditableProduct = {
    id: string;
    name: string;
    code: string;
    type: string;
    image: string;
    price: number;
    salesMode: '正常售卖' | '仅套餐售卖';
    timeSale: TimeSaleConfig;
    specs: ProductSpec[];
    categories: ProductCategoryConfig[];
};

const CATEGORY_OPTIONS = ['AAA', '超值儿童餐', '测试满赠分类', '咖啡-邵亮测试', '新品推荐'];

const INITIAL_SYNC_PRODUCTS: EditableProduct[] = [
    {
        id: '1',
        name: '福佳白275',
        code: '1246829509485641729',
        type: '标准商品',
        image: 'https://images.unsplash.com/photo-1516455207990-7a41ce80f7ee?auto=format&fit=crop&q=80&w=100',
        price: 18,
        salesMode: '正常售卖',
        timeSale: {
            enabled: false,
            startDate: '2026-04-14',
            endDate: '2026-04-30',
            weekdays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            startTime: '00:00',
            endTime: '23:59',
        },
        specs: [
            { id: 'spec_1', name: '统', price: 18 },
            { id: 'spec_2', name: '大杯', price: 20 },
        ],
        categories: [
            { id: 'cate_1', name: 'AAA', categorySort: 1, productSort: 1 },
            { id: 'cate_2', name: '超值儿童餐', categorySort: 2, productSort: 3 },
        ],
    },
    {
        id: '2',
        name: '生椰拿铁',
        code: '1246829509485641730',
        type: '标准商品',
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=100',
        price: 22,
        salesMode: '正常售卖',
        timeSale: {
            enabled: true,
            startDate: '2026-04-14',
            endDate: '2026-04-30',
            weekdays: ['周一', '周二', '周三', '周四', '周五'],
            startTime: '09:00',
            endTime: '17:00',
        },
        specs: [
            { id: 'spec_3', name: '统', price: 22 },
            { id: 'spec_4', name: '大杯', price: 25 },
        ],
        categories: [
            { id: 'cate_3', name: 'AAA', categorySort: 1, productSort: 2 },
            { id: 'cate_4', name: '测试满赠分类', categorySort: 3, productSort: 1 },
        ],
    },
    {
        id: '3',
        name: '双人下午茶套餐',
        code: '1246829509485641731',
        type: '套餐商品',
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=100',
        price: 58,
        salesMode: '正常售卖',
        timeSale: {
            enabled: true,
            startDate: '2026-04-14',
            endDate: '2026-04-20',
            weekdays: ['周六', '周日'],
            startTime: '10:00',
            endTime: '21:00',
        },
        specs: [
            { id: 'spec_5', name: '双人套餐', price: 58 },
        ],
        categories: [
            { id: 'cate_5', name: '超值儿童餐', categorySort: 2, productSort: 4 },
        ],
    },
];

const WEEKDAY_OPTIONS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const SALES_MODE_OPTIONS: EditableProduct['salesMode'][] = ['正常售卖', '仅套餐售卖'];
const DEFAULT_PUBLISH_CHANNEL_IDS: OmnichannelChannelId[] = [
    'mini_program_dine_in',
    'mini_program_delivery',
    'pos',
    'meituan',
    'taobao',
];
const BATCH_FIELD_GROUPS = [
    { title: '基础信息', fields: ['商品名称', '前台分类', '是否展示商品'] },
    { title: '商品属性', fields: ['售价', '商品标识', '商品条码', '预计成本', '商品份量'] },
    { title: '展示设置', fields: ['商品主图', '规格图片', '商品详情图', '列表页简述', '描述标签'] },
    { title: '销售属性', fields: ['售卖时间', '是否为套餐商品', '是否为小料商品', '起购限购', '单点不送', '包装费'] },
];
const BATCH_PLATFORM_FIELD_SUPPORT: Record<string, Array<'douyin' | 'meituan'>> = {
    商品名称: ['douyin', 'meituan'],
    售价: ['douyin', 'meituan'],
    商品主图: ['douyin', 'meituan'],
    售卖时间: ['douyin', 'meituan'],
    包装费: ['douyin'],
};
// Existing combo form fields, verified against the production batch-update page.
const BATCH_COMBO_FIELD_GROUPS = [
    { title: '基础信息', fields: ['商品名称', '前台分类'] },
    { title: '商品属性', fields: ['售价', '商品标识', '商品条码', '商品规格码', '商品份量'] },
    { title: '展示设置', fields: ['商品主图', '规格图片', '详情页描述', '列表页简述', '描述标签', '点单标签', '商品角标', '商品封面', '商品详情页底图'] },
    { title: '销售属性', fields: ['售卖时间', '是否为团餐商品', '参与会员折扣', '起购限购', '包装费'] },
];
const BATCH_BOOLEAN_FIELDS = new Set(['是否展示商品', '是否为套餐商品', '是否为小料商品', '单点不送', '是否为团餐商品', '参与会员折扣']);
const BATCH_NUMBER_FIELDS = new Set(['售价', '预计成本', '包装费']);
const BATCH_IMAGE_FIELDS = new Set(['商品主图', '规格图片', '商品详情图', '商品封面', '商品详情页底图']);
type BatchFieldValue = string | number | boolean;
const TEMPLATE_RANGE_OPTIONS = TEMPLATE_RECORDS.filter(template => template.status === 'enabled').map(template => ({ ...template, count: template.storeCount }));
const STORE_RANGE_OPTIONS = [
    { id: 'store-1', name: '南山万象店', code: 'SZ001' },
    { id: 'store-2', name: '福田卓悦店', code: 'SZ002' },
    { id: 'store-3', name: '虹桥枢纽店', code: 'SH001' },
];

const cloneInitialProducts = () => INITIAL_SYNC_PRODUCTS.map(product => ({
    ...product,
    timeSale: {
        ...product.timeSale,
        weekdays: [...product.timeSale.weekdays],
    },
    specs: product.specs.map(spec => ({ ...spec })),
    categories: product.categories.map(category => ({ ...category })),
}));

const getSummaryText = (items: string[]) => {
    if (items.length === 0) return '未设置';
    if (items.length === 1) return items[0];
    return `${items[0]} +${items.length - 1}`;
};

const getTimeSaleSummary = (timeSale: TimeSaleConfig) => {
    if (!timeSale.enabled) return '未开启';
    const weekdayText = timeSale.weekdays.length === 7 ? '每天' : getSummaryText(timeSale.weekdays);
    return `${weekdayText} ${timeSale.startTime}-${timeSale.endTime}`;
};

const getListTimeSaleSummary = (timeSale: TimeSaleConfig) => (
    timeSale.enabled ? '已开启分时段售卖' : '全时段售卖'
);

type ToolCardConfig = {
    iconClassName: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
};

const getDisplayCategory = (product: EditableProduct, selectedCategoryName: string) => {
    if (selectedCategoryName !== 'all') {
        return product.categories.find(category => category.name === selectedCategoryName);
    }

    return [...product.categories].sort((a, b) => {
        if (a.categorySort !== b.categorySort) return a.categorySort - b.categorySort;
        return a.productSort - b.productSort;
    })[0];
};

const getChangedFields = (product: EditableProduct) => {
    const initial = INITIAL_SYNC_PRODUCTS.find(item => item.id === product.id);
    if (!initial) return [] as string[];

    const changed: string[] = [];
    if (JSON.stringify(product.categories) !== JSON.stringify(initial.categories)) changed.push('前台分类');
    if (product.price !== initial.price || JSON.stringify(product.specs) !== JSON.stringify(initial.specs)) {
        changed.push('售价');
    }
    if (JSON.stringify(product.timeSale) !== JSON.stringify(initial.timeSale)) changed.push('售卖时间');
    if (product.salesMode !== initial.salesMode) changed.push('售卖方式');
    return changed;
};

export const WebProductSync: React.FC<{
    initialBatch?: { type: 'standard' | 'combo'; productIds: string[] };
    onReturnToLibrary?: () => void;
    onApplyLibraryBatch?: (updates: Array<{ productId: string; values: Record<string, BatchFieldValue> }>) => void;
    initialPublish?: { productId?: string; productIds?: string[]; source?: 'master' | 'channel_catalog'; catalogId?: string; channelIds: OmnichannelChannelId[]; storeIds?: string[] };
    onCreateProduct?: (type: 'standard' | 'combo', selection: { productIds: string[]; channelIds: OmnichannelChannelId[]; storeIds: string[]; source: 'master' | 'channel_catalog'; catalogId?: string }) => void;
    onReturnToStore?: () => void;
    initialTab?: 'publish' | 'records' | 'qimai-records' | 'platform-records';
    masterChannelSyncRecords?: MasterChannelSyncRecord[];
    extraBatches?: PublishBatch[];
    sourceProducts?: Product[];
    catalogProductIds?: Record<string, string[]>;
    storeSourceRecords?: StoreProductRecord[];
    channelProductOverrides?: Record<string, any>;
    onSubmitTask?: (batch: PublishBatch) => void;
  onRemoveStoreTargets?: (targets: DeleteTarget[]) => void;
    onOpenRecords?: () => void;
    unifiedManagementView?: boolean;
    directUse?: boolean;
    focus?: 'publish' | 'batch' | 'records';
    hideNavigation?: boolean;
    onRecordViewChange?: (tab: 'qimai-records' | 'platform-records') => void;
}> = ({ initialBatch, onReturnToLibrary, onApplyLibraryBatch, initialPublish, onReturnToStore, onCreateProduct, initialTab = 'publish', masterChannelSyncRecords = [], extraBatches = [], sourceProducts, catalogProductIds, storeSourceRecords = [], channelProductOverrides = {}, onSubmitTask, onRemoveStoreTargets, onOpenRecords, unifiedManagementView = false, directUse = false, focus, hideNavigation = false, onRecordViewChange }) => {
    const batchStandardPreview = typeof window !== 'undefined'
        && new URLSearchParams(window.location.search).get('tool') === 'batch-standard';
    const { activeBrandId, brandConfigs } = useProducts();
    const omnichannelConfig = getOmnichannelConfig(brandConfigs[activeBrandId] || brandConfigs.b_1);
    const channelCatalogGroups = getEffectiveChannelGroups(omnichannelConfig);
    const channelCatalogEnabled = !unifiedManagementView && shouldShowChannelCatalog(omnichannelConfig) && channelCatalogGroups.length > 0;
    const [step, setStep] = useState(initialPublish || initialBatch || batchStandardPreview ? 1 : 0);
    const [publishEntry, setPublishEntry] = useState(initialPublish);
    const [activeBatchTool, setActiveBatchTool] = useState<ProductTool | null>(null);
    const [comboOnly, setComboOnly] = useState(false);
    const [pageTab, setPageTab] = useState<'publish' | 'qimai-records' | 'platform-records'>(
        focus === 'records' ? (initialTab === 'platform-records' ? 'platform-records' : 'qimai-records') : focus ? 'publish' : initialTab === 'records' ? 'qimai-records' : initialTab,
    );
    useEffect(() => {
        if (focus === 'records') setPageTab(initialTab === 'platform-records' ? 'platform-records' : 'qimai-records');
    }, [focus, initialTab]);
    const [operationMode, setOperationMode] = useState<'sync' | 'batch_standard' | 'batch_combo'>(initialBatch?.type === 'combo' ? 'batch_combo' : initialBatch || batchStandardPreview ? 'batch_standard' : 'sync');
    const [syncSource, setSyncSource] = useState<'master' | 'template' | 'channel_catalog'>(() => unifiedManagementView ? 'master' : initialPublish?.source || (channelCatalogEnabled ? 'channel_catalog' : 'master'));
    const [batchSource, setBatchSource] = useState<'master' | 'channel_catalog' | 'template' | 'store'>(() => initialBatch || unifiedManagementView ? 'master' : 'channel_catalog');
    const [sourceTemplateId, setSourceTemplateId] = useState('tpl-1');
    const [sourceStoreIds, setSourceStoreIds] = useState<string[]>([]);
    // 原型默认当前账号拥有全部固定渠道权限；生产环境需先按账号的 channelId 数据范围过滤，
    // 再由当前动态分组反向计算可见/可选商品库，不能把菜单权限等同于全部商品库权限。
    const authorizedChannelCatalogGroups = channelCatalogGroups;
    const [selectedChannelGroupIds, setSelectedChannelGroupIds] = useState<string[]>(() => initialPublish?.catalogId ? [initialPublish.catalogId] : channelCatalogGroups[0] ? [channelCatalogGroups[0].id] : []);
    const [selectedTargetChannelGroupIds, setSelectedTargetChannelGroupIds] = useState<string[]>(() => channelCatalogGroups[0] ? [channelCatalogGroups[0].id] : []);
    const [selectedTargetScopes, setSelectedTargetScopes] = useState<Array<'master' | 'template' | 'store' | 'channel_catalog'>>(initialBatch || unifiedManagementView ? ['master'] : ['channel_catalog']);
    const [batchChangeMode, setBatchChangeMode] = useState<'individual' | 'unified'>('individual');
    const [unifiedShelfStatus, setUnifiedShelfStatus] = useState<'on' | 'off'>('on');
    const [templateRangeMode, setTemplateRangeMode] = useState<'all' | 'selected'>('all');
    const [storeRangeMode, setStoreRangeMode] = useState<'all' | 'selected' | 'template'>('selected');
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(['tpl-1']);
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(initialPublish?.storeIds || []);
    const [selectedBatchChannelIds, setSelectedBatchChannelIds] = useState<OmnichannelChannelId[]>(() => (
        channelCatalogEnabled
            ? Array.from(new Set(channelCatalogGroups.flatMap(group => group.channels)))
            : DEFAULT_PUBLISH_CHANNEL_IDS
    ));
    const [selectedBatchFields, setSelectedBatchFields] = useState<string[]>(initialBatch ? [] : ['商品名称', '前台分类', '售价']);
    const [selectedBatchProductIds, setSelectedBatchProductIds] = useState<string[]>(initialBatch?.productIds || ['1', '2']);
    const [selectedBatchRowIds, setSelectedBatchRowIds] = useState<string[]>([]);
    const [batchDraftValues, setBatchDraftValues] = useState<Record<string, Record<string, BatchFieldValue>>>({});
    const [selectedSyncProductIds, setSelectedSyncProductIds] = useState<string[]>(initialPublish?.productIds || (initialPublish?.productId ? [initialPublish.productId] : initialPublish ? [] : ['1', '2', '3']));
    const [selectedPublishChannelIds, setSelectedPublishChannelIds] = useState<OmnichannelChannelId[]>(() => (
        initialPublish ? [...initialPublish.channelIds] : channelCatalogEnabled
            ? Array.from(new Set(channelCatalogGroups.flatMap(group => group.channels)))
            : DEFAULT_PUBLISH_CHANNEL_IDS
    ));
    const [publishValidationMessage, setPublishValidationMessage] = useState('');
    const [overwriteFields, setOverwriteFields] = useState<string[]>(() => getPublishOverwriteDefaults(activeBrandId));
    useEffect(() => { setOverwriteFields(getPublishOverwriteDefaults(activeBrandId)); }, [activeBrandId]);
    const [executionTime, setExecutionTime] = useState<'now' | 'scheduled'>('now');
    const [scheduledAt, setScheduledAt] = useState('');
    const [productSelectorMode, setProductSelectorMode] = useState<'sync' | 'batch' | null>(null);
    const [pendingSelectorProductIds, setPendingSelectorProductIds] = useState<string[]>([]);
    const [products, setProducts] = useState<EditableProduct[]>(() => sourceProducts ? sourceProducts.map((product, index) => ({
        id: product.id, name: product.name, code: product.skuCode || product.id,
        type: product.type === 'combo' ? '套餐商品' : '标准商品', image: product.image, price: product.price,
        salesMode: '正常售卖', timeSale: { ...INITIAL_SYNC_PRODUCTS[0].timeSale, weekdays: [...INITIAL_SYNC_PRODUCTS[0].timeSale.weekdays] },
        specs: product.specs?.length ? product.specs.map((spec, i) => ({ id: `${product.id}-${i}`, name: spec.name, price: spec.price ?? product.price })) : [{ id: `${product.id}-sku`, name: '单规格', price: product.price }],
        categories: [{ id: product.category, name: product.category, categorySort: 1, productSort: index + 1 }],
    })) : cloneInitialProducts());
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('all');
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const sourceCatalogId = operationMode === 'sync' ? selectedChannelGroupIds[0] : selectedTargetChannelGroupIds[0];
    const readingCatalog = operationMode === 'sync' ? syncSource === 'channel_catalog' : batchSource === 'channel_catalog';
    const readingTemplate = operationMode === 'sync' ? syncSource === 'template' : batchSource === 'template';
    const sourceStoreProducts = useMemo(() => Array.from(new Map(storeSourceRecords.filter(record => sourceStoreIds.includes(record.storeId)).map(record => {
        // Only aligns the incumbent demo datasets; production reads store-SKU details by ID.
        const base = products.find(product => product.id === record.baseProductId || product.name === record.name);
        return [record.baseProductId, { ...base, id: record.baseProductId, name: record.name, code: record.baseProductId, type: record.type === 'Combo' ? '套餐商品' : '标准商品', image: record.image, price: base?.price || 0, salesMode: '正常售卖' as const, timeSale: base?.timeSale || INITIAL_SYNC_PRODUCTS[0].timeSale, specs: base?.specs || [{ id: `${record.baseProductId}-sku`, name: '单规格', price: base?.price || 0 }], categories: base?.categories || [{ id: record.category, name: record.category, categorySort: 1, productSort: record.sortIndex }] } as EditableProduct] as const;
    })).values()), [storeSourceRecords, sourceStoreIds, products]);
    const sourceProductPool = useMemo(() => readingCatalog && !unifiedManagementView && catalogProductIds
        ? products.filter(product => (catalogProductIds[sourceCatalogId] || []).includes(product.id)) : readingTemplate
        ? products.slice(0, TEMPLATE_RANGE_OPTIONS.find(template => template.id === sourceTemplateId)?.productCount || 0) : operationMode !== 'sync' && batchSource === 'store' ? sourceStoreProducts : products,
    [products, readingCatalog, readingTemplate, unifiedManagementView, catalogProductIds, sourceCatalogId, sourceTemplateId, operationMode, batchSource, sourceStoreProducts]);
    const currentSourceProducts = useMemo(() => sourceProductPool.filter(product => operationMode === 'sync' ? !comboOnly || product.type === '套餐商品' : operationMode === 'batch_combo' ? product.type === '套餐商品' : product.type !== '套餐商品'), [sourceProductPool, operationMode, comboOnly]);
    const usingTemplateStores = readingTemplate || operationMode !== 'sync' && storeRangeMode === 'template';
    const scopeStores = usingTemplateStores ? TEMPLATE_STORES.map(store => ({ ...store, code: store.id, tags: [] })) : PRODUCT_SALES_SCOPE_STORES;
    const previousTemplateStoreScope = useRef(usingTemplateStores);
    useEffect(() => {
        if (previousTemplateStoreScope.current !== usingTemplateStores) setSelectedStoreIds([]);
        previousTemplateStoreScope.current = usingTemplateStores;
    }, [usingTemplateStores]);
    const batchChannels = batchSource === 'channel_catalog'
        ? channelCatalogGroups.find(group => group.id === selectedTargetChannelGroupIds[0])?.channels || []
        : batchSource === 'template' ? TEMPLATE_RANGE_OPTIONS.find(template => template.id === sourceTemplateId)?.channels || []
        : Array.from(new Set(channelCatalogGroups.flatMap(group => group.channels)));
    const effectiveBatchChannelIds = selectedBatchChannelIds.filter(channelId => batchChannels.includes(channelId));

    const availablePublishChannelIds = useMemo<OmnichannelChannelId[]>(() => (
        publishEntry?.channelIds.length ? publishEntry.channelIds : syncSource === 'template' ? TEMPLATE_RANGE_OPTIONS.find(template => template.id === sourceTemplateId)?.channels || [] : syncSource === 'channel_catalog'
            ? Array.from(new Set(
                authorizedChannelCatalogGroups
                    .filter(group => selectedChannelGroupIds.includes(group.id))
                    .flatMap(group => group.channels)
            ))
            : Array.from(new Set(channelCatalogGroups.flatMap(group => group.channels)))
    ), [authorizedChannelCatalogGroups, selectedChannelGroupIds, syncSource, sourceTemplateId, publishEntry]);
    const availablePublishChannelKey = availablePublishChannelIds.join('|');

    useEffect(() => {
        setSelectedPublishChannelIds(availablePublishChannelIds);
        setPublishValidationMessage('');
    }, [availablePublishChannelKey]);

    const selectedSyncProducts = useMemo(
        () => currentSourceProducts.filter(product => selectedSyncProductIds.includes(product.id)),
        [currentSourceProducts, selectedSyncProductIds]
    );
    const takeoutPrecheckRows = (operationMode === 'sync' || batchChangeMode !== 'unified' && !selectedBatchFields.every(field => ['售价'].includes(field)))
        ? (operationMode === 'sync' ? selectedPublishChannelIds : effectiveBatchChannelIds).filter(isThirdPartyChannelId).filter(id => omnichannelConfig.thirdPartyStrategies[id] === 'qimai').flatMap(channel =>
            (operationMode === 'sync' ? selectedSyncProducts : currentSourceProducts.filter(product => selectedBatchProductIds.includes(product.id))).flatMap(product => {
                const master = sourceProducts?.find(item => item.id === product.id);
                const override = readingCatalog ? channelProductOverrides[`${sourceCatalogId}:${product.id}`] : undefined;
                const input = { ...master, ...product, ...override, name: String(batchDraftValues[product.id]?.['商品名称'] || override?.name || product.name), formData: { ...(master as any)?.formData, ...override?.formData } };
                const issues = isTakeoutChannel(channel) ? checkTakeoutRequiredInfo(input, channel) : checkChannelRequiredFields(channel, input.formData);
                return issues.map(issue => ({ channel, name: product.name, ...issue }));
            })) : [];
    const batchRangeInvalid = operationMode !== 'sync' && (
        selectedTargetScopes.length === 0
        || (selectedTargetScopes.includes('template') && templateRangeMode === 'selected' && selectedTemplateIds.length === 0)
        || (selectedTargetScopes.includes('store') && storeRangeMode === 'selected' && selectedStoreIds.length === 0)
        || (selectedTargetScopes.includes('store') && storeRangeMode === 'template' && !selectedTargetScopes.includes('template'))
        || (selectedTargetScopes.includes('store') && storeRangeMode !== 'template' && effectiveBatchChannelIds.length === 0)
        || (selectedTargetScopes.includes('channel_catalog') && selectedTargetChannelGroupIds.length === 0)
    );
    const miniProgramMainImageMissingProducts = useMemo(() => (
        channelGroupIncludesMiniProgram(selectedPublishChannelIds)
            ? selectedSyncProducts.filter(product => !String(product.image || '').trim())
            : []
    ), [selectedPublishChannelIds, selectedSyncProducts]);

    const submitTask = () => {
        const chosenProducts = operationMode === 'sync' ? selectedSyncProducts : currentSourceProducts.filter(product => selectedBatchProductIds.includes(product.id));
        if (operationMode !== 'sync' && batchChangeMode === 'individual') {
            for (const product of chosenProducts) {
                for (const field of selectedBatchFields) {
                    const value = batchDraftValues[product.id]?.[field] ?? getBatchFieldValue(product, field);
                    if (field === '商品名称' && (!String(value).trim() || String(value).length > 70) || BATCH_NUMBER_FIELDS.has(field) && (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) { setPublishValidationMessage(`请检查“${product.name}”的${field}：名称不能为空且最多 70 字，金额不能为负数或为空。`); return; }
                }
            }
        }
        const targetsStore = operationMode === 'sync' || selectedTargetScopes.includes('store');
        const productScopes = new Map<string, ProductSalesScope | undefined>((sourceProducts || []).map(product => [product.id, (product as Product & { formData?: { salesScope?: ProductSalesScope } }).formData?.salesScope] as const));
        const selectedTemplates = TEMPLATE_RANGE_OPTIONS.filter(template => templateRangeMode === 'all' || selectedTemplateIds.includes(template.id));
        const channels = operationMode === 'sync' ? selectedPublishChannelIds : storeRangeMode === 'template' ? Array.from(new Set(selectedTemplates.flatMap(template => template.channels))) : effectiveBatchChannelIds;
        if (operationMode === 'sync') {
            const invalid = chosenProducts.find(product => {
                const scope = productScopes.get(product.id);
                return scope?.channelIds?.length && channels.some(channel => !scope.channelIds.includes(channel));
            });
            if (invalid) { setPublishValidationMessage(`“${invalid.name}”未配置全部所选销售渠道，请调整下发渠道或商品库销售渠道。`); return; }
        }
        const templateStoreCount = Math.max(0, ...selectedTemplates.map(template => template.count));
        const stores = scopeStores.filter((store, index) => operationMode !== 'sync' && storeRangeMode === 'template' ? index < templateStoreCount : operationMode !== 'sync' && storeRangeMode === 'all' || selectedStoreIds.includes(store.id));
        if (!chosenProducts.length || (targetsStore && (!stores.length || !channels.length))) {
            setPublishValidationMessage('请选择商品，并确认适用门店和渠道。');
            return;
        }
        if (executionTime === 'scheduled' && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) {
            setPublishValidationMessage('请选择晚于当前时间的执行时间。');
            return;
        }
        const createdAt = new Date().toLocaleString('sv-SE', { hour12: false });
        const batchId = `PB${Date.now()}`;
        const isScheduled = executionTime === 'scheduled';
        const fieldNames = operationMode === 'sync' ? overwriteFields : batchChangeMode === 'unified' ? ['上下架'] : selectedBatchFields;
        const scopeNames = selectedTargetScopes.map(scope => ({ master: unifiedManagementView ? '商品库' : '商品主档', template: '商品下发模板', channel_catalog: '渠道商品库', store: '门店商品' })[scope]);
        const source = operationMode === 'sync' ? syncSource : batchSource;
        const sourceName = source === 'channel_catalog' ? unifiedManagementView ? '商品库' : channelCatalogGroups.find(group => group.id === sourceCatalogId)?.name || '渠道商品库' : source === 'template' ? TEMPLATE_RANGE_OPTIONS.find(template => template.id === sourceTemplateId)?.name || '商品下发模板' : source === 'store' ? '门店商品' : unifiedManagementView ? '商品库' : '商品主档';
        const channelNames = channels.map(id => getOmnichannelChannel(id).name);
        const platformChannels = targetsStore ? channels.filter(id => isThirdPartyChannelId(id) && omnichannelConfig.thirdPartyStrategies[id] === 'qimai' && (operationMode === 'sync' || batchChangeMode === 'unified' || !['douyin', 'meituan_dine'].includes(id) || fieldNames.some(field => (BATCH_PLATFORM_FIELD_SUPPORT[field] || []).includes(id === 'douyin' ? 'douyin' : 'meituan')))) : [];
        const skuCount = chosenProducts.reduce((sum, product) => sum + product.specs.length, 0);
        const allowedInStore = (product: EditableProduct, storeId: string, channelId: OmnichannelChannelId | undefined) => {
            if (!targetsStore || !channelId) return true;
            if (batchSource === 'store' && operationMode !== 'sync') {
                const alias: Record<string, string> = { mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take', douyin: 'douyin_dine' };
                return storeSourceRecords.some(record => record.baseProductId === product.id && record.storeId === storeId && record.channels.includes(alias[channelId] || channelId));
            }
            if (directUse && operationMode !== 'sync') {
                const alias: Record<string, string> = { mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take', douyin: 'douyin_dine' };
                return storeSourceRecords.some(record => record.baseProductId === product.id && record.storeId === storeId && record.channels.includes(alias[channelId] || channelId));
            }
            return true;
        };
        const details = (targetsStore ? stores : [{ id: '', name: '品牌资料' }]).flatMap(store => (targetsStore ? channels : [undefined]).flatMap(channelId => chosenProducts.filter(product => allowedInStore(product, store.id, channelId)).flatMap(product => product.specs.map(spec => ({
            id: `${batchId}-${store.id}-${channelId || 'brand'}-${spec.id}`, taskType: 'qimai' as const,
            productName: product.name, productId: product.id, skuName: spec.name, skuId: spec.id,
            storeName: store.name, storeId: store.id, channel: channelId ? getOmnichannelChannel(channelId).name : '品牌资料',
            action: operationMode === 'sync' ? '下发门店商品' : '批量修改', fields: fieldNames,
            status: isScheduled ? 'waiting' as const : 'success' as const, finishedAt: isScheduled ? '等待定时执行' : createdAt,
        })))));
        if (operationMode === 'sync') {
            // Normal publication upserts combo children; combo-only publication preserves existing children.
            for (const parent of chosenProducts.filter(product => product.type === '套餐商品')) {
                const childIds = sourceProducts?.find(product => product.id === parent.id)?.comboItemIds || [];
                for (const childId of childIds) {
                    const child = products.find(product => product.id === childId);
                    if (!child) continue;
                    for (const store of stores) for (const channelId of channels) {
                        const alias: Record<string, string> = { mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take', douyin: 'douyin_dine' };
                        const exists = storeSourceRecords.some(record => record.storeId === store.id && (record.baseProductId === child.id || record.name === child.name) && (record.channels.includes(channelId) || record.channels.includes(alias[channelId])));
                        if (comboOnly && exists) continue;
                        for (const spec of child.specs) {
                            const id = `${batchId}-${store.id}-${channelId}-${spec.id}`;
                            if (details.some(detail => detail.id === id)) continue;
                            details.push({ id, taskType: 'qimai', productName: child.name, productId: child.id, skuName: spec.name, skuId: spec.id, storeName: store.name, storeId: store.id, channel: getOmnichannelChannel(channelId).name, action: exists ? '更新套餐子商品' : '新增套餐子商品', fields: fieldNames, status: isScheduled ? 'waiting' : 'success', finishedAt: isScheduled ? '等待定时执行' : createdAt });
                        }
                    }
                }
            }
        }
        if (!details.length) { setPublishValidationMessage('所选范围内没有可修改的门店商品，请调整商品、门店或渠道。'); return; }
        // Apply only edited cells; an untouched column must never write a mock placeholder value.
        if (operationMode !== 'sync' && !isScheduled && selectedTargetScopes.includes('master') && batchChangeMode === 'individual') {
            const updates = chosenProducts.map(product => ({ productId: product.id, values: Object.fromEntries(Object.entries(batchDraftValues[product.id] || {}).filter(([field]) => selectedBatchFields.includes(field))) })).filter(item => Object.keys(item.values).length);
            try { onApplyLibraryBatch?.(updates); }
            catch (error) { setPublishValidationMessage(error instanceof Error ? error.message : '商品库更新失败，请重试。'); return; }
        }
        const activePlatformChannels = platformChannels.filter(channelId => details.some(detail => detail.channel === getOmnichannelChannel(channelId).name));
        const takeoutOperation = operationMode === 'sync' ? 'structure' : batchChangeMode === 'unified' ? 'shelf' : fieldNames.every(field => ['售价'].includes(field)) ? 'price' : 'structure';
        const platformDetails = !isScheduled ? details.filter(detail => activePlatformChannels.some(id => getOmnichannelChannel(id).name === detail.channel)).map(detail => {
            const comboUnsupported = detail.channel === getOmnichannelChannel('meituan_dine').name && chosenProducts.find(product => product.id === detail.productId)?.type === '套餐商品';
            const takeoutChannel = activePlatformChannels.find(id => isTakeoutChannel(id) && getOmnichannelChannel(id).name === detail.channel);
            const master = sourceProducts?.find(product => product.id === detail.productId);
            const groupId = source === 'channel_catalog' ? sourceCatalogId : undefined;
            const override = groupId ? channelProductOverrides[`${groupId}:${detail.productId}`] : undefined;
            const input = { ...master, ...override, name: String(batchDraftValues[detail.productId]?.['商品名称'] || override?.name || chosenProducts.find(product => product.id === detail.productId)?.name || detail.productName), formData: { ...(master as any)?.formData, ...override?.formData } };
            const issues = takeoutChannel && isTakeoutChannel(takeoutChannel) && takeoutOperation === 'structure' ? checkTakeoutProduct(input, takeoutChannel) : [];
            const readiness = takeoutChannel === 'jd' ? checkJdStoreReadiness(input.formData?.jdStoreReadiness) : [];
            const failure = comboUnsupported ? '美团在线点暂不支持同步套餐商品；企迈门店商品已保留。' : [...issues, ...readiness].map(issue => `${issue.field}：${issue.message}`).join('；');
            return { ...detail, id: `${detail.id}-platform`, taskType: 'platform' as const, action: takeoutChannel && isTakeoutChannel(takeoutChannel) ? takeoutOperationPlan(takeoutChannel, takeoutOperation) : '同步平台门店商品', status: failure ? 'failed' as const : 'waiting' as const, finishedAt: failure ? createdAt : '等待平台执行（演示）', ...(failure ? { error: failure } : {}) };
        }) : [];
        onSubmitTask?.({
            id: batchId, recordType: 'store_publish', title: `${operationMode === 'sync' ? '商品下发' : '批量修改'} · ${sourceName}`, action: operationMode === 'sync' ? '发布商品至门店' : '批量修改商品资料',
            sourceType: sourceName, sourceName, snapshot: `${isScheduled ? `定时执行 ${scheduledAt.replace('T', ' ')}；` : ''}${operationMode === 'sync' ? '同款覆盖' : '修改字段'}：${fieldNames.join('、')}`,
            channels: targetsStore ? channelNames : ['品牌资料'], storeScope: targetsStore ? stores.map(store => store.name).join('、') : scopeNames.join('、'), storeCount: targetsStore ? stores.length : 0,
            productCount: new Set(details.map(detail => detail.productId)).size, skuCount: new Set(details.map(detail => detail.skuId)).size, status: isScheduled ? 'running' : 'success', createdAt, creator: '当前用户',
            fieldSnapshots: fieldNames.map(name => ({ name, mode: operationMode === 'sync' ? '覆盖' : '修改', before: '执行前目标值（演示）', after: operationMode === 'sync' ? comboOnly ? '套餐来源资料；已有子商品不覆盖，缺少时新增' : '本次来源资料（含套餐子商品）' : batchChangeMode === 'unified' ? unifiedShelfStatus === 'on' ? '上架' : '下架' : chosenProducts.map(product => `${product.name}：${String(batchDraftValues[product.id]?.[name] ?? getBatchFieldValue(product, name))}`).join('；') })),
            tasks: [{ id: `QM-${batchId}`, type: 'qimai', target: targetsStore ? '企迈门店商品' : scopeNames.join('、'), channels: targetsStore ? channelNames : ['品牌资料'], status: isScheduled ? 'waiting' : 'success', progress: isScheduled ? 0 : 100, productCount: chosenProducts.length, skuCount, storeCount: targetsStore ? stores.length : 0, successCount: isScheduled ? 0 : details.length, failedCount: 0, waitingCount: isScheduled ? details.length : 0, startedAt: createdAt, finishedAt: isScheduled ? undefined : createdAt },
                ...(!isScheduled ? activePlatformChannels.map(channelId => {
                    const rows = platformDetails.filter(detail => detail.channel === getOmnichannelChannel(channelId).name);
                    const failedCount = rows.filter(detail => detail.status === 'failed').length;
                    return { id: `PL-${batchId}-${channelId}`, type: 'platform' as const, target: `${getOmnichannelChannel(channelId).name}门店商品`, channels: [getOmnichannelChannel(channelId).name], status: failedCount === rows.length ? 'failed' as const : 'waiting' as const, progress: failedCount === rows.length ? 100 : 0, productCount: new Set(rows.map(detail => detail.productId)).size, skuCount: new Set(rows.map(detail => detail.skuId)).size, storeCount: new Set(rows.map(detail => detail.storeId)).size, successCount: 0, failedCount, waitingCount: rows.length - failedCount, startedAt: createdAt, ...(failedCount ? { error: rows.find(row => row.error)?.error } : {}), waitingReason: isTakeoutChannel(channelId) ? takeoutOperationPlan(channelId, takeoutOperation) : ['douyin', 'meituan_dine'].includes(channelId) ? '等待在线点品牌商品可用；抖音需审核通过' : '等待平台执行' };
                }) : [])],
            details: [...details, ...platformDetails],
        });
        setPublishValidationMessage('');
        setStep(3);
    };

    const categoryList = useMemo(() => {
        const map = new Map<string, { name: string; categorySort: number; productCount: number }>();
        products.forEach(product => {
            product.categories.forEach(category => {
                const current = map.get(category.name);
                if (current) {
                    current.productCount += 1;
                    current.categorySort = Math.min(current.categorySort, category.categorySort);
                } else {
                    map.set(category.name, {
                        name: category.name,
                        categorySort: category.categorySort,
                        productCount: 1,
                    });
                }
            });
        });
        return Array.from(map.values()).sort((a, b) => a.categorySort - b.categorySort);
    }, [products]);

    const filteredProducts = useMemo(() => {
        const list = selectedCategoryName === 'all'
            ? currentSourceProducts
            : currentSourceProducts.filter(product => product.categories.some(category => category.name === selectedCategoryName));

        return [...list].sort((a, b) => {
            const aCategory = getDisplayCategory(a, selectedCategoryName);
            const bCategory = getDisplayCategory(b, selectedCategoryName);
            if (!aCategory && !bCategory) return 0;
            if (!aCategory) return 1;
            if (!bCategory) return -1;
            if (aCategory.productSort !== bCategory.productSort) return aCategory.productSort - bCategory.productSort;
            return a.name.localeCompare(b.name, 'zh-CN');
        });
    }, [currentSourceProducts, selectedCategoryName]);

    const selectorProducts = useMemo<SelectableProduct[]>(() => currentSourceProducts.map(product => ({
        id: product.id,
        name: product.name,
        image: product.image,
        skuCode: product.code,
        productCode: product.code,
        category: product.categories[0]?.name || '未分类',
        frontendCategory: product.categories[0]?.name || '未分类',
        type: product.type.includes('套餐') ? 'combo' : 'standard',
        price: product.price,
        status: 'on_shelf',
    })), [currentSourceProducts]);

    const openProductSelector = (mode: 'sync' | 'batch') => {
        setProductSelectorMode(mode);
        setPendingSelectorProductIds(mode === 'sync' ? selectedSyncProductIds : selectedBatchProductIds);
    };

    const confirmProductSelector = () => {
        if (productSelectorMode === 'sync') setSelectedSyncProductIds(pendingSelectorProductIds);
        if (productSelectorMode === 'batch') setSelectedBatchProductIds(pendingSelectorProductIds);
        setProductSelectorMode(null);
    };

    const updateProduct = (productId: string, updater: (product: EditableProduct) => EditableProduct) => {
        setProducts(prev => prev.map(product => (
            product.id === productId ? updater(product) : product
        )));
    };

    const getBatchFieldValue = (product: EditableProduct, field: string): BatchFieldValue => {
        const source = sourceProducts?.find(item => item.id === product.id) as Product & { formData?: Record<string, any> } | undefined;
        const data = source?.formData || {};
        const aliases: Record<string, string> = { '列表页简述': 'p_list_desc', '前台分类': 'p_front_cat', '商品主图': 'p_img', '包装费': 's_pack_fee', '描述标签': 'p_desc_tags' };
        const definition = AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === aliases[field] || item.label === field);
        if (definition && data[definition.id] !== undefined) { const value = data[definition.id]; return Array.isArray(value) ? value.join('、') : typeof value === 'object' ? '' : value; }
        const specFields: Record<string, string> = { '商品标识': 's_spec_mark', '商品条码': 's_spec_barcode', '商品规格码': 's_spec_sku_code', '预计成本': 's_spec_cost' };
        const row = data.takeoutFormState?.specConfigRows?.[0];
        if (specFields[field] && row) return row[specFields[field]] ?? '';
        switch (field) {
            case '商品名称': return product.name;
            case '前台分类': return product.categories[0]?.name || '';
            case '是否展示商品': return false;
            case '售价': return product.price;
            case '商品标识': return '';
            case '商品条码': return '';
            case '预计成本': return '';
            case '商品份量': return '';
            case '商品主图': return product.image || '';
            case '规格图片': return '';
            case '商品详情图': return '';
            case '列表页简述': return '';
            case '描述标签': return '';
            case '售卖时间': return getListTimeSaleSummary(product.timeSale);
            case '是否为套餐商品': return product.type.includes('套餐');
            case '是否为小料商品': return false;
            case '起购限购': return '1 / 99';
            case '单点不送': return false;
            case '包装费': return 0;
            default: return '';
        }
    };

    const updateBatchDraftValue = (productId: string, field: string, value: BatchFieldValue) => {
        setBatchDraftValues(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value,
            },
        }));
    };

    const renderBatchFieldControl = (
        field: string,
        value: BatchFieldValue,
        onChange: (value: BatchFieldValue) => void,
        unified = false,
    ) => {
        const controlClass = 'h-9 w-full min-w-[132px] border border-gray-200 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-[#00B460]';

        if (field === '前台分类') {
            return (
                <select value={String(value)} onChange={event => onChange(event.target.value)} className={controlClass}>
                    <option value="">请选择分类</option>
                    {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
            );
        }

        if (BATCH_BOOLEAN_FIELDS.has(field)) {
            return (
                <select value={String(value)} onChange={event => onChange(event.target.value === 'true')} className={controlClass}>
                    {unified && <option value="">请选择</option>}
                    <option value="true">是</option>
                    <option value="false">否</option>
                </select>
            );
        }

        if (BATCH_NUMBER_FIELDS.has(field)) {
            return (
                <input
                    type="number"
                    min="0"
                    value={value === '' ? '' : Number(value)}
                    placeholder={unified ? '请输入统一值' : undefined}
                    onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))}
                    className={controlClass}
                />
            );
        }

        if (BATCH_IMAGE_FIELDS.has(field)) {
            return (
                <label className={`${controlClass} flex cursor-pointer items-center justify-between text-left hover:bg-[#F7FCF9]`}>
                    <span className={value ? 'text-gray-700' : 'text-gray-400'}>{value ? '已配置图片 · 点击替换' : '选择图片'}</span>
                    <input aria-label={`上传${field}`} type="file" accept="image/*" className="sr-only" onChange={event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => onChange(String(reader.result)); reader.readAsDataURL(file); }} />
                    <FileUp size={15} className="ml-2 shrink-0 text-[#00A35B]" />
                </label>
            );
        }

        if (field === '售卖时间') {
            return (
                <select value={String(value)} onChange={event => onChange(event.target.value)} className={controlClass}>
                    {unified && <option value="">请选择</option>}
                    <option value="全时段售卖">全时段售卖</option>
                    <option value="已开启分时段售卖">分时段售卖</option>
                </select>
            );
        }

        return (
            <input
                value={String(value)}
                placeholder={unified ? '请输入统一值' : undefined}
                onChange={event => onChange(event.target.value)}
                className={controlClass}
            />
        );
    };

    const handleCategorySortChange = (categoryName: string, value: number) => {
        setProducts(prev => prev.map(product => ({
            ...product,
            categories: product.categories.map(category => (
                category.name === categoryName ? { ...category, categorySort: value } : category
            )),
        })));
    };

    const handleProductSortChange = (productId: string, categoryName: string, value: number) => {
        updateProduct(productId, product => ({
            ...product,
            categories: product.categories.map(category => (
                category.name === categoryName ? { ...category, productSort: value } : category
            )),
        }));
    };

    const handleRemoveProduct = (productId: string) => {
        setProducts(prev => prev.filter(product => product.id !== productId));
    };

    const openEditor = (productId: string) => {
        setEditingProductId(productId);
        setCategoryDropdownOpen(false);
    };

    const toggleCategory = (productId: string, categoryName: string) => {
        updateProduct(productId, product => {
            const exists = product.categories.some(category => category.name === categoryName);
            if (exists) {
                return {
                    ...product,
                    categories: product.categories.filter(category => category.name !== categoryName),
                };
            }

            const maxSort = product.categories.reduce((max, item) => Math.max(max, item.categorySort), 0);
            return {
                ...product,
                categories: [
                    ...product.categories,
                    {
                        id: `${product.id}_${categoryName}`,
                        name: categoryName,
                        categorySort: maxSort + 1,
                        productSort: 1,
                    },
                ],
            };
        });
    };

    const toggleWeekday = (productId: string, weekday: string) => {
        updateProduct(productId, product => {
            const exists = product.timeSale.weekdays.includes(weekday);
            return {
                ...product,
                timeSale: {
                    ...product.timeSale,
                    weekdays: exists
                        ? product.timeSale.weekdays.filter(item => item !== weekday)
                        : [...product.timeSale.weekdays, weekday],
                },
            };
        });
    };

    const renderToolsMenu = () => {
        const syncCards: ToolCardConfig[] = [
            {
                title: '发布商品至门店',
                desc: '按商品来源创建门店渠道发布任务',
                icon: <RefreshCw size={20} />,
                iconClassName: 'text-[#C57100]',
                onClick: () => { setComboOnly(false); setOperationMode('sync'); setOverwriteFields(getPublishOverwriteDefaults(activeBrandId)); setStep(1); },
            },
            {
                title: '批量发布模板商品',
                desc: '批量选择模板并发布至适用门店',
                icon: <Layers size={20} />,
                iconClassName: 'text-[#008F97]',
                onClick: () => setActiveBatchTool('template_publish'),
            },
            {
                title: '同步套餐商品至门店',
                desc: '下发套餐，并补齐门店缺少的子商品',
                icon: <PackagePlus size={20} />,
                iconClassName: 'text-[#00A35B]',
                onClick: () => { setComboOnly(true); setOperationMode('sync'); setOverwriteFields(getPublishOverwriteDefaults(activeBrandId)); setSelectedSyncProductIds(products.filter(product => product.type === '套餐商品').map(product => product.id)); setStep(1); },
            },
        ];

        const batchCards: ToolCardConfig[] = [
            {
                title: '批量修改标准商品',
                desc: directUse ? '修改商品库及门店商品资料' : '修改商品库、模板或门店商品资料',
                icon: <FileEdit size={20} />,
                iconClassName: 'text-[#2185D0]',
                onClick: () => { setOperationMode('batch_standard'); setSelectedBatchProductIds(sourceProductPool.filter(product => product.type !== '套餐商品').slice(0, 2).map(product => product.id)); setStep(1); },
            },
            {
                title: '批量修改套餐商品',
                desc: directUse ? '修改商品库及门店套餐资料' : '修改商品库、模板或门店套餐资料',
                icon: <PackagePlus size={20} />,
                iconClassName: 'text-[#00A35B]',
                onClick: () => { setOperationMode('batch_combo'); setSelectedBatchProductIds(sourceProductPool.filter(product => product.type === '套餐商品').slice(0, 1).map(product => product.id)); setStep(1); },
            },
            {
                title: '批量修改加料商品',
                desc: '批量设置门店加料的上下架状态',
                icon: <Tickets size={20} />,
                iconClassName: 'text-[#8460D7]',
                onClick: () => setActiveBatchTool('addon_bulk'),
            },
            {
                title: '批量修改商品关联加料',
                desc: '调整商品关联的加料及选择规则',
                icon: <Tags size={20} />,
                iconClassName: 'text-[#8460D7]',
                onClick: () => setActiveBatchTool('addon_association'),
            },
            {
                title: '批量修改商品关联做法',
                desc: '调整商品关联的做法及选项',
                icon: <Layers size={20} />,
                iconClassName: 'text-[#00A35B]',
                onClick: () => setActiveBatchTool('method_association'),
            },
            {
                title: '批量启用/禁用门店做法',
                desc: '设置门店可用的做法选项',
                icon: <Layers size={20} />,
                iconClassName: 'text-[#00A35B]',
                onClick: () => setActiveBatchTool('method_status'),
            },
        ];

        const productToolCards: ToolCardConfig[] = [
            {
                title: '删除门店商品',
                desc: '从指定门店和渠道移除商品',
                icon: <Trash2 size={20} />,
                iconClassName: 'text-[#E65050]',
                onClick: () => setActiveBatchTool('delete_goods'),
            },
            {
                title: '删除门店加料',
                desc: '从指定门店和渠道移除加料',
                icon: <Trash2 size={20} />,
                iconClassName: 'text-[#E65050]',
                onClick: () => setActiveBatchTool('delete_addon'),
            },
            {
                title: '门店商品复制',
                desc: '将源门店商品复制到目标门店',
                icon: <Copy size={20} />,
                iconClassName: 'text-[#00A35B]',
                onClick: () => setActiveBatchTool('copy_store'),
            },
            {
                title: '渠道商品复制',
                desc: '用源渠道商品覆盖目标渠道商品',
                icon: <Copy size={20} />,
                iconClassName: 'text-[#008F97]',
                onClick: () => setActiveBatchTool('copy_channel'),
            },
        ];

        // Production goodsSynch: uniform neutral entries, colored icons, three columns.
        // Keep the established React tool flows; this only mirrors the guide-container layout.
        const renderToolEntries = (cards: ToolCardConfig[]) => (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cards.map(card => (
                    <button
                        key={card.title}
                        type="button"
                        onClick={card.onClick}
                        className="group flex min-h-[96px] w-full items-start gap-3 rounded-lg border border-transparent bg-[#F6F7FA] p-4 text-left transition-colors duration-150 hover:border-[#B8DECC] hover:bg-[#F0F5F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008F4C]"
                    >
                        <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white [&_svg]:h-7 [&_svg]:w-7 ${card.iconClassName}`}>{card.icon}</span>
                        <span className="min-w-0 flex-1"><span className="block text-base font-semibold leading-6 text-[#1D2129] transition-colors duration-150 group-hover:text-[#008F4C]">{card.title}</span><span className="mt-1 block text-sm leading-5 text-[#667085]">{card.desc}</span></span>
                    </button>
                ))}
            </div>
        );

        const sections = [
            ...(!directUse && focus !== 'batch' ? [{ title: '商品下发', cards: syncCards }] : []),
            ...(focus !== 'publish' ? [{ title: '商品资料', cards: batchCards.slice(0, 3) }, { title: '做法与加料', cards: batchCards.slice(3) }, { title: '删除与复制', cards: productToolCards }] : []),
        ];
        return <div className="h-full overflow-auto bg-white px-6 py-5 selection:bg-[#DDF3E8] selection:text-[#006B3C]">
            <div className="space-y-6">{sections.map(section => <section key={section.title} aria-label={section.title}>
                {focus !== 'publish' && <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#344054]"><span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#00B460]" />{section.title}</h2>}
                {renderToolEntries(section.cards)}
            </section>)}</div>
        </div>;
    };

    const renderEditorDrawer = () => {
        if (!editingProductId) return null;

        const product = products.find(item => item.id === editingProductId);
        if (!product) return null;
        const changedFields = getChangedFields(product);

        return (
            <div className="fixed inset-0 z-[100] flex justify-end">
                <div className="absolute inset-0 bg-black/25" onClick={() => setEditingProductId(null)}></div>
                <div className="relative w-[860px] h-full bg-white shadow-2xl border-l border-gray-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-100 bg-white flex items-center justify-between">
                        <div>
                            <div className="text-lg font-bold text-gray-800">差异化属性修改</div>
                            <div className="text-xs text-gray-400 mt-1">仅影响本次同步到门店的数据</div>
                        </div>
                        <button
                            onClick={() => setEditingProductId(null)}
                            className="p-2 text-gray-400 hover:text-gray-700"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FB]">
                        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-5">
                            <div className="text-base font-bold text-gray-800">基础信息</div>
                            <div className="grid grid-cols-[120px_1fr] gap-y-5 items-start">
                                <div className="text-sm text-gray-600 pt-2">商品名称</div>
                                <div>
                                    <input
                                        value={product.name}
                                        onChange={event => updateProduct(product.id, current => ({
                                            ...current,
                                            name: event.target.value,
                                        }))}
                                        className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-[#00C06B]"
                                    />
                                </div>

                                <div className="text-sm text-gray-600 pt-2">前台分类</div>
                                <div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setCategoryDropdownOpen(prev => !prev)}
                                            className="w-full border border-gray-200 rounded px-3 py-2.5 text-left flex items-center justify-between hover:border-[#00C06B]/40"
                                        >
                                            <span className={`${product.categories.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                                                {product.categories.length > 0
                                                    ? product.categories.map(category => category.name).join('、')
                                                    : '请选择前台分类'}
                                            </span>
                                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {categoryDropdownOpen && (
                                            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-auto">
                                                {CATEGORY_OPTIONS.map(option => {
                                                    const active = product.categories.some(category => category.name === option);
                                                    return (
                                                        <label
                                                            key={option}
                                                            className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={active}
                                                                onChange={() => toggleCategory(product.id, option)}
                                                                className="mr-3 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                            />
                                                            <span>{option}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">用于门店商品展示，本次同步将按这里的分类结果覆盖</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                            <div className="text-base font-bold text-gray-800 mb-4">商品属性</div>
                            <div className="text-sm text-gray-600 mb-3">售价</div>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#F5F5F5] text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">规格</th>
                                            <th className="px-4 py-3">售价</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.specs.map(spec => (
                                            <tr key={spec.id} className="border-t border-gray-100">
                                                <td className="px-4 py-3 text-gray-700">{spec.name}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center w-[180px]">
                                                        <span className="text-gray-400 mr-2">￥</span>
                                                        <input
                                                            type="number"
                                                            value={spec.price}
                                                            onChange={event => updateProduct(product.id, current => {
                                                                const nextSpecs = current.specs.map(item => (
                                                                    item.id === spec.id
                                                                        ? { ...item, price: Number(event.target.value) || 0 }
                                                                        : item
                                                                ));
                                                                return {
                                                                    ...current,
                                                                    specs: nextSpecs,
                                                                    price: nextSpecs[0]?.price || 0,
                                                                };
                                                            })}
                                                            className="w-full border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#00C06B]"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-white p-5">
                            <div className="text-base font-bold text-gray-800 mb-4">销售属性</div>
                            <div className="grid grid-cols-[120px_1fr] gap-y-6 items-start">
                                <div className="text-sm text-gray-600 pt-2">可售卖时间</div>
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <button
                                            onClick={() => updateProduct(product.id, current => ({
                                                ...current,
                                                timeSale: { ...current.timeSale, enabled: !current.timeSale.enabled },
                                            }))}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${
                                                product.timeSale.enabled ? 'bg-[#00C06B]' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                                                    product.timeSale.enabled ? 'translate-x-5' : 'translate-x-0.5'
                                                }`}
                                            />
                                        </button>
                                        <span className="text-sm text-gray-700">分时段售卖</span>
                                    </div>

                                    {product.timeSale.enabled ? (
                                        <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-[#FAFBFC]">
                                            <div className="text-xs text-gray-400">开启后可设置销售日期、每周售卖日和营业时间，效果更接近后台当前的分时段售卖配置</div>
                                            <div className="grid grid-cols-[96px_1fr] items-center gap-y-4">
                                                <div className="text-sm text-gray-500">销售日期</div>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="date"
                                                        value={product.timeSale.startDate}
                                                        onChange={event => updateProduct(product.id, current => ({
                                                            ...current,
                                                            timeSale: { ...current.timeSale, startDate: event.target.value },
                                                        }))}
                                                        className="border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#00C06B]"
                                                    />
                                                    <span className="text-gray-400">至</span>
                                                    <input
                                                        type="date"
                                                        value={product.timeSale.endDate}
                                                        onChange={event => updateProduct(product.id, current => ({
                                                            ...current,
                                                            timeSale: { ...current.timeSale, endDate: event.target.value },
                                                        }))}
                                                        className="border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#00C06B]"
                                                    />
                                                </div>

                                                <div className="text-sm text-gray-500">每周</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {WEEKDAY_OPTIONS.map(day => {
                                                        const active = product.timeSale.weekdays.includes(day);
                                                        return (
                                                            <button
                                                                key={day}
                                                                onClick={() => toggleWeekday(product.id, day)}
                                                                className={`px-3 py-2 rounded text-sm border ${
                                                                    active
                                                                        ? 'bg-[#EAF8F1] text-[#00C06B] border-[#00C06B]/40'
                                                                        : 'bg-white text-gray-600 border-gray-200'
                                                                }`}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <div className="text-sm text-gray-500">营业时间</div>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="time"
                                                        value={product.timeSale.startTime}
                                                        onChange={event => updateProduct(product.id, current => ({
                                                            ...current,
                                                            timeSale: { ...current.timeSale, startTime: event.target.value },
                                                        }))}
                                                        className="border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#00C06B]"
                                                    />
                                                    <span className="text-gray-400">至</span>
                                                    <input
                                                        type="time"
                                                        value={product.timeSale.endTime}
                                                        onChange={event => updateProduct(product.id, current => ({
                                                            ...current,
                                                            timeSale: { ...current.timeSale, endTime: event.target.value },
                                                        }))}
                                                        className="border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#00C06B]"
                                                    />
                                                </div>

                                                <div className="text-sm text-gray-500">说明</div>
                                                <div className="text-xs text-gray-400">
                                                    日期可为空，为空表示不限制售卖总日期；每周和营业时间用于模拟后台分时段售卖规则。
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-400">关闭后按全时段售卖处理</div>
                                    )}
                                </div>

                                <div className="text-sm text-gray-600 pt-2">售卖方式</div>
                                <div className="flex items-center gap-6">
                                    {SALES_MODE_OPTIONS.map(option => (
                                        <label key={option} className="flex items-center text-sm text-gray-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`sales-mode-${product.id}`}
                                                checked={product.salesMode === option}
                                                onChange={() => updateProduct(product.id, current => ({
                                                    ...current,
                                                    salesMode: option,
                                                }))}
                                                className="mr-2 text-[#00C06B] focus:ring-[#00C06B]"
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            已修改：{changedFields.length > 0 ? changedFields.join('、') : '暂无改动'}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setEditingProductId(null)}
                                className="px-5 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => setEditingProductId(null)}
                                className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B]"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBatchStep1 = () => {
        const selectedBatchProducts = currentSourceProducts.filter(product => selectedBatchProductIds.includes(product.id));
        const allRowsSelected = selectedBatchProducts.length > 0 && selectedBatchProducts.every(product => selectedBatchRowIds.includes(product.id));

        return (
            <div className="flex h-full flex-1 flex-col bg-white">
                <div className="min-h-0 flex-1 overflow-auto p-7">
                    <div className="w-full">
                        <div className="mb-7">
                            <h2 className="text-xl font-black text-gray-900">{operationMode === 'batch_combo' ? '批量修改套餐商品' : '批量修改标准商品'}</h2>
                        </div>
                        {initialBatch && <p className="mb-4 text-sm text-[#667085]">商品来源：{unifiedManagementView ? '商品库' : '商品主档'} · 已带入 {selectedBatchProducts.length} 个{operationMode === 'batch_combo' ? '套餐商品' : '标准商品'}。仅修改本次选择的资料，生效范围将在下一步确认。</p>}
                        {!directUse && !initialBatch && <div className="mb-6 border-b border-gray-100 pb-6">
                            <div className="mb-3 text-sm font-black text-gray-800">商品来源</div>
                            <div className="flex flex-wrap gap-2">
                                {([['master', unifiedManagementView ? '商品库' : '商品主档'], ...(!unifiedManagementView ? [['channel_catalog', '渠道商品库']] : []), ...(!directUse ? [['template', '商品下发模板']] : []), ['store', '门店商品']] as Array<[typeof batchSource, string]>).map(([id, label]) => <button key={id} type="button" aria-pressed={batchSource === id} onClick={() => { setBatchSource(id); setSelectedBatchProductIds([]); setSelectedTargetScopes(id === 'master' ? ['master'] : id === 'store' ? ['store'] : id === 'template' ? ['template'] : ['channel_catalog']); }} className={`rounded border px-3 py-2 text-sm ${batchSource === id ? 'border-[#00B460] bg-[#EAF8F2] font-semibold text-[#008F4C]' : 'border-[#E5E6EB] text-[#4E5969] hover:border-[#00B460]'}`}>{label}</button>)}
                            </div>
                            {batchSource === 'channel_catalog' && <div className="mt-3 flex flex-wrap gap-2">{authorizedChannelCatalogGroups.map(group => <button key={group.id} type="button" aria-pressed={selectedTargetChannelGroupIds.includes(group.id)} onClick={() => { setSelectedTargetChannelGroupIds([group.id]); setSelectedBatchProductIds([]); }} className={`rounded border px-3 py-1.5 text-xs ${selectedTargetChannelGroupIds.includes(group.id) ? 'border-[#00B460] bg-[#F1FBF5] font-semibold text-[#008F4C]' : 'border-[#E5E6EB] text-[#667085]'}`}>{group.name}</button>)}</div>}
                            {batchSource === 'template' && <select aria-label="来源商品下发模板" value={sourceTemplateId} onChange={event => { setSourceTemplateId(event.target.value); setSelectedTemplateIds([event.target.value]); setTemplateRangeMode('selected'); setSelectedBatchProductIds([]); }} className="mt-3 h-9 rounded-md border border-[#E5E6EB] bg-white px-3 text-sm">{TEMPLATE_RANGE_OPTIONS.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select>}
                            {batchSource === 'store' && <div className="mt-3"><WebStoreScopeSelector stores={PRODUCT_SALES_SCOPE_STORES} value={sourceStoreIds} onChange={ids => { setSourceStoreIds(ids); setSelectedStoreIds(ids); setSelectedBatchProductIds([]); }} widthClassName="w-[260px]" /></div>}
                            <p className="mt-2 text-xs text-[#667085]">切换来源会清空已选商品。修改哪一层资料与影响哪些门店渠道，请在下一步确认。</p>
                        </div>}

                        <div className="mb-6 border-b border-gray-100 pb-6">
                            <div className="mb-3 text-sm font-black text-gray-800">修改方式</div>
                            <div className="flex items-center gap-8 text-sm">
                                <label className={`flex cursor-pointer items-center font-bold ${batchChangeMode === 'individual' ? 'text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" checked={batchChangeMode === 'individual'} onChange={() => setBatchChangeMode('individual')} className="mr-2" />个性修改</label>
                                <label className={`flex cursor-pointer items-center font-bold ${batchChangeMode === 'unified' ? 'text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" checked={batchChangeMode === 'unified'} onChange={() => setBatchChangeMode('unified')} className="mr-2" />统一修改</label>
                            </div>
                        </div>

                        {batchChangeMode === 'individual' ? (
                            <div className="mb-7 border-b border-gray-100 pb-7">
                                <div className="mb-5 border-b border-gray-100 pb-4">
                                    <div className="text-sm font-black text-gray-800">选择修改字段</div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                        <span>字段后的标识表示可同步的平台</span>
                                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-[#E9FAF8] px-1.5 font-medium text-[#087F7A]">抖</span>
                                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-[#FFF5DC] px-1.5 font-medium text-[#9A6400]">美</span>
                                        <span>无标识仅更新企迈资料</span>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    {(operationMode === 'batch_combo' ? BATCH_COMBO_FIELD_GROUPS : BATCH_FIELD_GROUPS).map(group => (
                                        <div key={group.title} className="flex items-start">
                                            <div className="w-28 shrink-0 pt-1 text-sm font-black text-gray-800">{group.title}</div>
                                            <div className="flex flex-1 flex-wrap gap-x-6 gap-y-3">
                                                {group.fields.map(field => {
                                                    const selected = selectedBatchFields.includes(field);
                                                    const support = BATCH_PLATFORM_FIELD_SUPPORT[field] || [];
                                                    return (
                                                        <label key={field} className={`flex cursor-pointer items-center text-sm ${selected ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}>
                                                            <input type="checkbox" checked={selected} onChange={() => setSelectedBatchFields(prev => selected ? prev.filter(item => item !== field) : [...prev, field])} className="mr-2 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />
                                                            <span>{field}</span>
                                                            {support.includes('douyin') && <span title="支持同步到抖音在线点" className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-[#E9FAF8] px-1.5 text-[11px] font-medium text-[#087F7A]">抖</span>}
                                                            {support.includes('meituan') && <span title="支持同步到美团在线点" className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded bg-[#FFF5DC] px-1.5 text-[11px] font-medium text-[#9A6400]">美</span>}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-7 border-b border-gray-100 pb-7">
                                <div className="mb-3 text-sm font-black text-gray-800">统一设置上下架状态</div>
                                <div className="flex items-center gap-8 text-sm">
                                    <label className={`flex cursor-pointer items-center font-bold ${unifiedShelfStatus === 'on' ? 'text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="unified-shelf-status" checked={unifiedShelfStatus === 'on'} onChange={() => setUnifiedShelfStatus('on')} className="mr-2" />上架</label>
                                    <label className={`flex cursor-pointer items-center font-bold ${unifiedShelfStatus === 'off' ? 'text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="unified-shelf-status" checked={unifiedShelfStatus === 'off'} onChange={() => setUnifiedShelfStatus('off')} className="mr-2" />下架</label>
                                </div>
                                <div className="mt-3 text-xs text-gray-400">所选商品将统一调整为该状态，并按下一步选择的生效范围执行。</div>
                            </div>
                        )}

                        <section aria-labelledby="batch-product-list-title" className="mb-6">
                            <div className="mb-3">
                                <div>
                                    <h3 id="batch-product-list-title" className="text-base font-black text-gray-900">选择商品</h3>
                                    <p className="mt-1 text-xs text-gray-400">{batchChangeMode === 'individual' ? '已选字段将作为可编辑列展示在商品列表中' : `添加需要统一${unifiedShelfStatus === 'on' ? '上架' : '下架'}的商品`}</p>
                                </div>
                            </div>

                            <div className="overflow-hidden border border-gray-200 bg-white">
                                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => openProductSelector('batch')} className="h-9 bg-[#00B460] px-4 text-sm font-bold text-white hover:bg-[#00A35B]">{operationMode === 'batch_combo' ? '添加套餐商品' : '添加标准商品'}</button>
                                        <span className="text-xs text-gray-500">已添加 <strong className="text-gray-800">{selectedBatchProducts.length}</strong> 个{batchChangeMode === 'individual' ? <>，可编辑 <strong className="text-gray-800">{selectedBatchFields.length}</strong> 个字段</> : <>，统一<strong className="ml-1 text-[#00A35B]">{unifiedShelfStatus === 'on' ? '上架' : '下架'}</strong></>}</span>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={selectedBatchRowIds.length === 0}
                                        onClick={() => {
                                            setSelectedBatchProductIds(prev => prev.filter(id => !selectedBatchRowIds.includes(id)));
                                            setSelectedBatchRowIds([]);
                                        }}
                                        className="h-9 border border-gray-200 bg-white px-4 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                                    >
                                        删除商品
                                    </button>
                                </div>
                                <div className="max-w-full overflow-x-auto">
                                    <table className="w-full table-fixed text-left" style={{ minWidth: `${420 + (batchChangeMode === 'individual' ? selectedBatchFields.length * 180 : 0)}px` }}>
                                        <thead className="bg-[#F5F6F7] text-sm font-bold text-gray-700">
                                            <tr>
                                                <th className="w-12 px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        aria-label="全选商品"
                                                        checked={allRowsSelected}
                                                        onChange={() => setSelectedBatchRowIds(allRowsSelected ? [] : selectedBatchProducts.map(product => product.id))}
                                                        className="h-4 w-4 rounded border-gray-300 text-[#00C06B]"
                                                    />
                                                </th>
                                                <th className="w-[240px] px-3 py-3">商品</th>
                                                {batchChangeMode === 'individual' && selectedBatchFields.map(field => <th key={field} className="w-[180px] px-3 py-3">{field}</th>)}
                                                <th className="sticky right-0 z-30 w-20 border-l border-gray-200 bg-[#F5F6F7] px-3 py-3 text-center shadow-[-10px_0_14px_-10px_rgba(0,0,0,0.18)]">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm">
                                            {selectedBatchProducts.map(product => {
                                                const rowSelected = selectedBatchRowIds.includes(product.id);
                                                return (
                                                    <tr key={product.id} className={rowSelected ? 'bg-[#F7FCF9]' : 'bg-white'}>
                                                        <td className="px-4 py-3 align-top">
                                                            <input
                                                                type="checkbox"
                                                                aria-label={`选择${product.name}`}
                                                                checked={rowSelected}
                                                                onChange={() => setSelectedBatchRowIds(prev => rowSelected ? prev.filter(id => id !== product.id) : [...prev, product.id])}
                                                                className="mt-2 h-4 w-4 rounded border-gray-300 text-[#00C06B]"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3 align-top">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center border border-gray-100 bg-[#F5F7F8] text-gray-300">
                                                                    <PackagePlus size={18} />
                                                                    <img src={product.image} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="truncate font-bold text-gray-800">{product.name}</div>
                                                                    <div className="mt-1 truncate text-xs text-gray-400">ID：{product.code}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {batchChangeMode === 'individual' && selectedBatchFields.map(field => (
                                                            <td key={field} className="px-3 py-3 align-top">
                                                                {renderBatchFieldControl(
                                                                    field,
                                                                    batchDraftValues[product.id]?.[field] ?? getBatchFieldValue(product, field),
                                                                    value => updateBatchDraftValue(product.id, field, value),
                                                                )}
                                                            </td>
                                                        ))}
                                                        <td className={`sticky right-0 z-20 border-l border-gray-100 px-3 py-3 text-center align-top shadow-[-10px_0_14px_-10px_rgba(0,0,0,0.14)] ${rowSelected ? 'bg-[#F7FCF9]' : 'bg-white'}`}>
                                                            <button
                                                                type="button"
                                                                aria-label={`移除${product.name}`}
                                                                onClick={() => {
                                                                    setSelectedBatchProductIds(prev => prev.filter(id => id !== product.id));
                                                                    setSelectedBatchRowIds(prev => prev.filter(id => id !== product.id));
                                                                }}
                                                                className="h-9 text-sm font-bold text-[#00A35B] hover:text-red-500"
                                                            >
                                                                删除
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {selectedBatchProducts.length === 0 && (
                                                <tr>
                                                    <td colSpan={(batchChangeMode === 'individual' ? selectedBatchFields.length : 0) + 3} className="h-36 px-6 text-center text-sm text-gray-400">
                                                        暂未添加商品，请点击“添加标准商品”选择本次要修改的商品
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                <div className="flex shrink-0 justify-end border-t border-gray-100 bg-white p-4"><button type="button" onClick={() => initialBatch ? onReturnToLibrary?.() : setStep(0)} className="mr-4 border border-gray-200 px-6 py-2 text-sm font-bold text-gray-600">取消</button><button type="button" onClick={() => setStep(2)} disabled={selectedBatchProducts.length === 0 || (batchChangeMode === 'individual' && selectedBatchFields.length === 0)} className="bg-[#00C06B] px-6 py-2 text-sm font-bold text-white disabled:bg-gray-300">下一步</button></div>
            </div>
        );
    };

    const renderStep1 = () => (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="border-b border-gray-100 p-6">
                <div className="mb-3 text-sm font-bold text-gray-700">选择商品</div>
                <div className="flex items-center gap-6">
                    {publishEntry?.productId ? <span className="text-sm text-[#4E5969]">商品库</span> : <>
                    {(!channelCatalogEnabled || (!!onCreateProduct && !unifiedManagementView)) && <label className={`flex cursor-pointer items-center space-x-2 text-sm ${syncSource === 'master' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="source" checked={syncSource === 'master'} onChange={() => { setSyncSource('master'); setSelectedSyncProductIds([]); }} className="h-4 w-4 text-[#00C06B]" /><span>商品主档</span></label>}
                    <label className={`flex cursor-pointer items-center space-x-2 text-sm ${syncSource === 'template' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="source" checked={syncSource === 'template'} onChange={() => { setSyncSource('template'); setSelectedSyncProductIds([]); }} className="h-4 w-4 text-[#00C06B]" /><span>商品下发模板</span></label>
                    {channelCatalogEnabled && <label className={`flex cursor-pointer items-center space-x-2 text-sm ${syncSource === 'channel_catalog' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="source" checked={syncSource === 'channel_catalog'} onChange={() => { setSyncSource('channel_catalog'); setSelectedSyncProductIds([]); }} className="h-4 w-4 text-[#00C06B]" /><span>{unifiedManagementView ? '商品库' : '渠道商品库'}</span></label>}
                    </>}
                </div>
                {syncSource === 'channel_catalog' && !unifiedManagementView && (
                    <div className="mt-4"><div className="flex flex-wrap gap-2">
                        {authorizedChannelCatalogGroups.map(group => { const selected = selectedChannelGroupIds[0] === group.id; return <button key={group.id} type="button" onClick={() => { setSelectedChannelGroupIds([group.id]); setSelectedSyncProductIds([]); }} className={`border px-3 py-2 text-xs font-bold ${selected ? 'border-[#8BD7AE] bg-[#F0FBF5] text-[#008F53]' : 'border-gray-200 text-gray-500'}`}><span>{group.name}</span><span className="ml-2 font-normal">{group.channels.map(id => getOmnichannelChannel(id).shortName).join('、')}</span></button>; })}
                    </div></div>
                )}
                {syncSource === 'template' && <select aria-label="来源商品下发模板" value={sourceTemplateId} onChange={event => { setSourceTemplateId(event.target.value); setSelectedSyncProductIds([]); }} className="mt-3 h-9 rounded-md border border-[#E5E6EB] bg-white px-3 text-sm">{TEMPLATE_RANGE_OPTIONS.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select>}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-sm text-gray-500">已选 <span className="font-bold text-gray-800">{selectedSyncProductIds.length}</span> 个商品</span>
                    {!publishEntry?.productId && <button type="button" onClick={() => openProductSelector('sync')} className="bg-[#00C06B] px-6 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">选择商品</button>}
                </div>
            </div>

            <div className="p-6 border-b border-gray-100">
                <div className="text-sm font-bold text-gray-700 mb-3">{publishEntry?.productId ? '下发渠道' : '选择渠道'}</div>
                {publishEntry?.productId ? <p aria-label="下发渠道" className="text-sm leading-6 text-[#4E5969]">{selectedPublishChannelIds.map(id => getOmnichannelChannel(id).name).join('、')}<span className="mt-1 block text-xs text-[#667085]">沿用商品设置的全部销售渠道。</span></p> : <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {availablePublishChannelIds.map(channelId => {
                        const checked = selectedPublishChannelIds.includes(channelId);
                        return (
                        <label key={channelId} className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                    setSelectedPublishChannelIds(prev => (
                                        checked
                                            ? prev.filter(id => id !== channelId)
                                            : [...prev, channelId]
                                    ));
                                    setPublishValidationMessage('');
                                }}
                                className="w-4 h-4 text-[#00C06B] rounded border-gray-300 focus:ring-[#00C06B]"
                            />
                            <span>{getOmnichannelChannel(channelId).shortName}</span>
                        </label>
                        );
                    })}
                </div>}
            </div>

            <div className="flex-1 overflow-hidden flex">
                <div className="w-[220px] border-r border-gray-100 bg-[#FAFAFA] flex flex-col shrink-0">
                    <div className="px-4 py-4 border-b border-gray-100 text-sm font-bold text-gray-700">前台分类</div>
                    <div className="flex-1 overflow-y-auto py-2">
                        <button
                            onClick={() => setSelectedCategoryName('all')}
                            className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${
                                selectedCategoryName === 'all'
                                    ? 'bg-[#EAF8F1] border-[#00C06B] text-[#00C06B]'
                                    : 'border-transparent text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">全部</span>
                                <span className="text-xs text-gray-400">{products.length}</span>
                            </div>
                        </button>

                        {categoryList.map(category => (
                            <button
                                key={category.name}
                                onClick={() => setSelectedCategoryName(category.name)}
                                className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${
                                    selectedCategoryName === category.name
                                        ? 'bg-[#EAF8F1] border-[#00C06B]'
                                        : 'border-transparent hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className={`text-sm truncate ${selectedCategoryName === category.name ? 'text-[#00C06B] font-bold' : 'text-gray-700'}`}>
                                        {category.name}
                                    </div>
                                    <input
                                        type="number"
                                        value={category.categorySort}
                                        onClick={event => event.stopPropagation()}
                                        onChange={event => handleCategorySortChange(category.name, Number(event.target.value) || 0)}
                                        className="w-12 border border-gray-200 rounded px-1.5 py-1 text-xs outline-none focus:border-[#00C06B] bg-white text-center"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-white">
                    <table className={`w-full text-left ${selectedCategoryName === 'all' ? 'min-w-[1010px]' : 'min-w-[1100px]'}`}>
                        <thead className="bg-[#F5F5F5] text-gray-500 text-xs sticky top-0 z-10 border-b border-gray-200">
                            <tr>
                                {selectedCategoryName !== 'all' && (
                                    <th className="py-3 px-4 font-medium w-[90px] sticky left-0 z-20 bg-[#F5F5F5] shadow-[8px_0_12px_-10px_rgba(0,0,0,0.16)]">排序</th>
                                )}
                                <th className="py-3 px-4 font-medium w-[300px]">商品名称</th>
                                <th className="py-3 px-4 font-medium">商品类型</th>
                                <th className="py-3 px-4 font-medium">前台分类</th>
                                <th className="py-3 px-4 font-medium">售价</th>
                                <th className="py-3 px-4 font-medium">可售时间</th>
                                <th className="py-3 px-4 font-medium w-[132px] min-w-[132px] sticky right-0 z-30 bg-[#F5F5F5] shadow-[-10px_0_14px_-10px_rgba(0,0,0,0.18)]">操作</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600">
                            {filteredProducts.filter(product => selectedSyncProductIds.includes(product.id)).map(product => {
                                const activeCategory = getDisplayCategory(product, selectedCategoryName);

                                return (
                                    <tr key={product.id} className="group border-b border-gray-100 bg-white hover:bg-gray-50/40">
                                        {selectedCategoryName !== 'all' && (
                                            <td className="py-4 px-4 align-top sticky left-0 z-20 bg-white group-hover:bg-[#F7F8FA] shadow-[8px_0_12px_-10px_rgba(0,0,0,0.12)]">
                                                {activeCategory ? (
                                                    <input
                                                        type="number"
                                                        value={activeCategory.productSort}
                                                        onChange={event => handleProductSortChange(
                                                            product.id,
                                                            activeCategory.name,
                                                            Number(event.target.value) || 0
                                                        )}
                                                        className="w-16 border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00C06B]"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="py-4 px-4 align-top">
                                            <div className="flex items-start">
                                                <img src={product.image} className="w-10 h-10 rounded object-cover mr-3 border border-gray-100" />
                                                <div>
                                                    <div className="font-medium text-gray-800 mb-1">{product.name}</div>
                                                    <div className="text-xs text-gray-400">{product.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 align-top">{product.type}</td>
                                        <td className="py-4 px-4 align-top text-gray-800">
                                            {selectedCategoryName === 'all'
                                                ? getSummaryText(product.categories.map(category => category.name))
                                                : selectedCategoryName}
                                        </td>
                                        <td className="py-4 px-4 align-top text-gray-800">
                                            ￥{product.price}
                                        </td>
                                        <td className="py-4 px-4 align-top">
                                            <div className="text-gray-800">{getListTimeSaleSummary(product.timeSale)}</div>
                                            <div className="text-xs text-gray-400 mt-1">{product.salesMode}</div>
                                        </td>
                                        <td className="py-4 px-4 align-top w-[132px] min-w-[132px] sticky right-0 z-30 bg-white group-hover:bg-[#F7F8FA] shadow-[-10px_0_14px_-10px_rgba(0,0,0,0.16)]">
                                            <div className="flex items-center gap-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => openEditor(product.id)}
                                                    className="text-[#00C06B] hover:underline"
                                                >
                                                    差异化属性修改
                                                </button>
                                                {!publishEntry?.productId && <button
                                                    onClick={() => handleRemoveProduct(product.id)}
                                                    className="text-gray-500 hover:text-red-500"
                                                >
                                                    移除
                                                </button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end items-center shrink-0">
                <button onClick={() => { setPublishEntry(undefined); setStep(0); }} className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors mr-4">取消</button>
                <button onClick={() => setStep(2)} disabled={!selectedSyncProducts.length || !selectedPublishChannelIds.length} className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B] transition-colors shadow-md disabled:bg-gray-300">下一步</button>
            </div>

            {renderEditorDrawer()}
        </div>
    );

    const renderStoreSelector = () => <WebStoreScopePanel stores={scopeStores} value={selectedStoreIds} onChange={setSelectedStoreIds} />;

    const renderStep2 = () => (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="p-6 flex-1 overflow-auto">
                <div className="max-w-4xl">
                    {operationMode !== 'sync' && (
                        <div className="mb-8">
                            <h3 className="mb-4 text-base font-bold text-gray-800">确认生效范围</h3>
                            <div className="divide-y divide-gray-100 border border-gray-200">
                                {batchSource === 'master' && <div className={`px-4 py-3 ${selectedTargetScopes.includes('master') ? 'bg-[#F7FCF9]' : 'bg-white'}`}>
                                    <label className={`flex cursor-pointer items-center text-sm font-bold ${selectedTargetScopes.includes('master') ? 'text-[#008F53]' : 'text-gray-700'}`}>
                                        <input type="checkbox" checked={selectedTargetScopes.includes('master')} onChange={() => setSelectedTargetScopes(prev => prev.includes('master') ? prev.filter(id => id !== 'master') : [...prev, 'master'])} className="mr-3 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />
                                        {unifiedManagementView ? '商品库' : '商品主档'}
                                    </label>
                                </div>}

                                {!directUse && (batchSource === 'master' || batchSource === 'template') && <div className={`px-4 py-3 ${selectedTargetScopes.includes('template') ? 'bg-[#F7FCF9]' : 'bg-white'}`}>
                                    <label className={`flex cursor-pointer items-center text-sm font-bold ${selectedTargetScopes.includes('template') ? 'text-[#008F53]' : 'text-gray-700'}`}>
                                        <input type="checkbox" checked={selectedTargetScopes.includes('template')} onChange={() => {
                                            if (selectedTargetScopes.includes('template') && storeRangeMode === 'template') setStoreRangeMode('selected');
                                            setSelectedTargetScopes(prev => prev.includes('template') ? prev.filter(id => id !== 'template') : [...prev, 'template']);
                                        }} className="mr-3 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />
                                        商品下发模板
                                    </label>
                                    {selectedTargetScopes.includes('template') && (
                                        <div className="ml-7 mt-3 border-t border-[#DDEFE5] pt-3">
                                            <div className="flex items-center gap-6">
                                                <label className={`flex cursor-pointer items-center text-sm ${templateRangeMode === 'all' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="templateRange" checked={templateRangeMode === 'all'} onChange={() => setTemplateRangeMode('all')} className="mr-2" />全部模板</label>
                                                <label className={`flex cursor-pointer items-center text-sm ${templateRangeMode === 'selected' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="templateRange" checked={templateRangeMode === 'selected'} onChange={() => setTemplateRangeMode('selected')} className="mr-2" />指定模板</label>
                                            </div>
                                            {templateRangeMode === 'selected' && <div className="mt-3 flex flex-wrap gap-2">{TEMPLATE_RANGE_OPTIONS.map(template => { const selected = selectedTemplateIds.includes(template.id); return <button key={template.id} type="button" onClick={() => setSelectedTemplateIds(prev => selected ? prev.filter(id => id !== template.id) : [...prev, template.id])} className={`border px-3 py-2 text-xs ${selected ? 'border-[#8BD7AE] bg-white font-bold text-[#008F53]' : 'border-gray-200 bg-white text-gray-500'}`}>{template.name}<span className="ml-2 font-normal">{template.count} 家门店</span></button>; })}</div>}
                                        </div>
                                    )}
                                </div>}

                                <div className={`px-4 py-3 ${selectedTargetScopes.includes('store') ? 'bg-[#F7FCF9]' : 'bg-white'}`}>
                                    <label className={`flex cursor-pointer items-center text-sm font-bold ${selectedTargetScopes.includes('store') ? 'text-[#008F53]' : 'text-gray-700'}`}>
                                        <input type="checkbox" checked={selectedTargetScopes.includes('store')} onChange={() => setSelectedTargetScopes(prev => prev.includes('store') ? prev.filter(id => id !== 'store') : [...prev, 'store'])} className="mr-3 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />
                                        门店渠道商品
                                    </label>
                                    {selectedTargetScopes.includes('store') && (
                                        <div className="ml-7 mt-3 border-t border-[#DDEFE5] pt-3">
                                            <div className="flex items-center gap-6">
                                                <label className={`flex cursor-pointer items-center text-sm ${storeRangeMode === 'all' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="storeRange" checked={storeRangeMode === 'all'} onChange={() => setStoreRangeMode('all')} className="mr-2" />全部门店</label>
                                                <label className={`flex cursor-pointer items-center text-sm ${storeRangeMode === 'selected' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="storeRange" checked={storeRangeMode === 'selected'} onChange={() => setStoreRangeMode('selected')} className="mr-2" />指定门店</label>
                                                {selectedTargetScopes.includes('template') && <label className={`flex cursor-pointer items-center text-sm ${storeRangeMode === 'template' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="storeRange" checked={storeRangeMode === 'template'} onChange={() => setStoreRangeMode('template')} className="mr-2" />指定模板门店及渠道</label>}
                                            </div>
                                            {storeRangeMode === 'selected' && <div className="mt-3">{renderStoreSelector()}</div>}
                                            {storeRangeMode !== 'template' && (
                                                <div className="mt-3 border-t border-[#DDEFE5] pt-3">
                                                    <div className="mb-2 text-xs font-medium text-gray-500">修改渠道</div>
                                                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                                                        {(batchChannels.length ? batchChannels : DEFAULT_PUBLISH_CHANNEL_IDS).map(channelId => {
                                                            const checked = selectedBatchChannelIds.includes(channelId);
                                                            return (
                                                                <label key={channelId} className="flex cursor-pointer items-center text-sm text-gray-600">
                                                                    <input type="checkbox" checked={checked} onChange={() => setSelectedBatchChannelIds(prev => checked ? prev.filter(id => id !== channelId) : [...prev, channelId])} className="mr-2 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />
                                                                    {getOmnichannelChannel(channelId).shortName}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            {storeRangeMode === 'template' && (
                                                <div className="mt-3 flex flex-wrap gap-2 border-t border-[#DDEFE5] pt-3">
                                                    {(templateRangeMode === 'all' ? TEMPLATE_RANGE_OPTIONS : TEMPLATE_RANGE_OPTIONS.filter(template => selectedTemplateIds.includes(template.id))).map(template => (
                                                        <span key={template.id} className="border border-[#8BD7AE] bg-white px-3 py-2 text-xs font-bold text-[#008F53]">
                                                            {template.name}<span className="ml-2 font-normal">{template.count} 家门店 · {template.channels.map(channelId => getOmnichannelChannel(channelId).shortName).join('、')}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {channelCatalogEnabled && !unifiedManagementView && (batchSource === 'master' || batchSource === 'channel_catalog') && (
                                    <div className={`px-4 py-3 ${selectedTargetScopes.includes('channel_catalog') ? 'bg-[#F7FCF9]' : 'bg-white'}`}>
                                        <label className={`flex cursor-pointer items-center text-sm font-bold ${selectedTargetScopes.includes('channel_catalog') ? 'text-[#008F53]' : 'text-gray-700'}`}>
                                            <input type="checkbox" checked={selectedTargetScopes.includes('channel_catalog')} onChange={() => setSelectedTargetScopes(prev => prev.includes('channel_catalog') ? prev.filter(id => id !== 'channel_catalog') : [...prev, 'channel_catalog'])} className="mr-3 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />
                                            渠道商品库
                                        </label>
                                        {selectedTargetScopes.includes('channel_catalog') && (
                                            <div className="ml-7 mt-3 flex flex-wrap gap-2 border-t border-[#DDEFE5] pt-3">
                                                {authorizedChannelCatalogGroups.filter(group => batchSource !== 'channel_catalog' || selectedTargetChannelGroupIds.includes(group.id)).map(group => { const selected = selectedTargetChannelGroupIds.includes(group.id); return <button key={group.id} type="button" disabled={batchSource === 'channel_catalog'} onClick={() => setSelectedTargetChannelGroupIds(prev => selected ? prev.filter(id => id !== group.id) : [...prev, group.id])} className={`border px-3 py-2 text-xs font-bold ${selected ? 'border-[#8BD7AE] bg-white text-[#008F53]' : 'border-gray-200 bg-white text-gray-500'}`}>{group.name}<span className="ml-2 font-normal">{group.channels.map(id => getOmnichannelChannel(id).shortName).join('、')}</span></button>; })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <h3 className="font-bold text-gray-800 mb-4 text-base">{operationMode === 'sync' ? '商品下发规则' : '修改规则'}</h3>
                    {operationMode === 'sync' ? <div className="mb-6 max-w-[680px]"><WebProductPublishRules value={overwriteFields} onChange={setOverwriteFields} defaultsBrandId={activeBrandId} /></div> : <div className="mb-6 flex items-start"><span className="w-24 shrink-0 text-sm text-gray-500">修改内容</span>{batchChangeMode === 'unified' ? <span className={`border px-3 py-1 text-xs font-bold ${unifiedShelfStatus === 'on' ? 'border-[#B7E7CB] bg-[#F4FBF7] text-[#008F53]' : 'border-gray-300 bg-gray-50 text-gray-700'}`}>统一{unifiedShelfStatus === 'on' ? '上架' : '下架'}</span> : <div className="flex flex-1 flex-wrap gap-2">{selectedBatchFields.map(field => <span key={field} className="border border-[#B7E7CB] bg-[#F4FBF7] px-2.5 py-1 text-xs font-bold text-[#008F53]">{field}</span>)}</div>}</div>}

                    <WebPublishWarnings rows={[
                        ...takeoutPrecheckRows.map(row => ({ ...row, channel: getOmnichannelChannel(row.channel).name })),
                        ...(operationMode === 'sync' ? miniProgramMainImageMissingProducts.map(product => ({ channel: '小程序', name: product.name, field: '商品主图', message: '请上传小程序售卖所需的商品主图。' })) : []),
                    ]} />

                    <div className="flex items-center mb-8">
                        <span className="w-24 text-gray-500 text-sm">同步时间</span>
                        <div className="flex space-x-6 text-sm">
                            <label className="flex items-center text-gray-400 cursor-not-allowed"><input type="radio" disabled className="mr-2"/> 手动执行</label>
                            <label className="flex items-center text-[#00C06B] font-bold cursor-pointer"><input type="radio" checked={executionTime === 'now'} onChange={() => setExecutionTime('now')} name="syncTime" className="mr-2 text-[#00C06B] focus:ring-[#00C06B]"/> 立即执行</label>
                            <label className="flex items-center text-gray-600 cursor-pointer"><input type="radio" checked={executionTime === 'scheduled'} onChange={() => setExecutionTime('scheduled')} name="syncTime" className="mr-2"/> 定时执行</label>
                        </div>
                        <span className="ml-4 text-xs text-red-500">高峰期进行商品同步等待时间可能较久，请尽量在非高峰期进行（定时）下发</span>
                    </div>
                    {executionTime === 'scheduled' && <label className="mb-6 flex items-center gap-4 text-sm text-gray-600"><span className="w-20">执行时间</span><input aria-label="定时执行时间" type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} className="h-9 rounded-md border border-gray-200 px-3" /></label>}

                    {operationMode === 'sync' && <>
                    <h3 className="font-bold text-gray-800 mb-4 text-base">选择门店</h3>
                    {renderStoreSelector()}
                    </>}
                </div>
            </div>

            {publishValidationMessage && (
                <div className="mx-6 mb-3 border border-[#FECACA] bg-[#FFF7F7] px-4 py-3 text-sm text-[#B42318]">
                    {publishValidationMessage}
                </div>
            )}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end items-center shrink-0">
                <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors mr-4">上一步</button>
                <button
                    onClick={() => {
                        if (operationMode === 'sync' && miniProgramMainImageMissingProducts.length > 0) {
                            const names = miniProgramMainImageMissingProducts.slice(0, 3).map(product => product.name).join('、');
                            const suffix = miniProgramMainImageMissingProducts.length > 3
                                ? `等 ${miniProgramMainImageMissingProducts.length} 个商品`
                                : '';
                            setPublishValidationMessage(`所选渠道包含小程序，${names}${suffix}缺少商品主图，请补充后再发布。`);
                            return;
                        }
                        submitTask();
                    }}
                    disabled={batchRangeInvalid || operationMode === 'sync' && !selectedStoreIds.length}
                    className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B] transition-colors shadow-md disabled:bg-gray-300"
                >
                    {operationMode === 'sync' ? '提交并同步' : '提交修改'}
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="flex-1 flex flex-col items-center justify-center bg-white h-full">
            <div className="w-16 h-16 bg-[#00C06B] rounded-full flex items-center justify-center text-white mb-6 shadow-lg animate-in zoom-in">
                <CheckCircle2 size={32}/>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{operationMode === 'sync' ? '同步任务已提交' : '批量修改任务已提交'}</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
                请在任务记录中查看各门店、渠道和商品的处理结果。企迈管理的三方渠道在企迈任务成功后继续同步平台。
            </p>
            <div className="flex space-x-4">
                {onReturnToStore && <button type="button" onClick={onReturnToStore} className="rounded border border-[#E5E7EB] px-5 py-2 text-sm text-[#667085]">返回原门店商品</button>}
                <button onClick={() => initialBatch ? onReturnToLibrary?.() : setStep(0)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors">{initialBatch ? '返回商品库' : '返回工具页'}</button>
                <button onClick={() => onOpenRecords ? onOpenRecords() : setPageTab('qimai-records')} className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B] transition-colors shadow-md">查看同步任务</button>
            </div>
        </div>
    );

    if (activeBatchTool === 'delete_goods') {
        return <WebStoreProductDeleteFlow inline products={storeSourceRecords} managedChannels={['meituan', 'taobao', 'jd'].filter(id => omnichannelConfig.thirdPartyStrategies[id as 'meituan' | 'taobao' | 'jd'] === 'qimai')} onClose={() => setActiveBatchTool(null)} onSubmit={onSubmitTask} onLocalRemove={onRemoveStoreTargets} />;
    }
    if (activeBatchTool) {
        return <WebProductToolFlow key={activeBatchTool} tool={activeBatchTool} products={sourceProducts || []} catalogProductIds={catalogProductIds} channelProductOverrides={channelProductOverrides} storeRecords={storeSourceRecords} directUse={directUse} unified={unifiedManagementView} onBack={() => setActiveBatchTool(null)} onSubmitTask={onSubmitTask} onOpenRecords={() => onOpenRecords ? onOpenRecords() : (setActiveBatchTool(null), setPageTab('qimai-records'))} />;
    }

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA] font-sans">
            {!hideNavigation && !focus && <div className="console-view-tabs flex h-[48px] shrink-0 items-stretch border-b border-[#E5E7EB] bg-white px-6 text-sm" role="tablist" aria-label="商品同步">
                <div className="flex h-full items-stretch gap-8">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={pageTab === 'publish'}
                        onClick={() => setPageTab('publish')}
                        className={`relative flex h-full items-center px-0.5 text-[14px] transition-colors ${pageTab === 'publish' ? 'font-semibold text-[#008F4C] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t after:bg-[#00B460]' : 'font-medium text-[#667085] hover:text-[#1D2129]'}`}
                    >
                        下发与批量工具
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={pageTab === 'qimai-records'}
                        onClick={() => setPageTab('qimai-records')}
                        className={`relative flex h-full items-center px-0.5 text-[14px] transition-colors ${pageTab === 'qimai-records' ? 'font-semibold text-[#008F4C] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t after:bg-[#00B460]' : 'font-medium text-[#667085] hover:text-[#1D2129]'}`}
                    >
                        同步任务
                    </button>
                </div>
            </div>}
            {!hideNavigation && focus === 'records' && <div className="h-12 shrink-0 border-b border-[#E5E7EB] bg-white px-6 py-3 text-sm font-semibold">同步任务</div>}
            {!hideNavigation && focus && focus !== 'records' && <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-6 py-3 text-[15px] font-semibold text-[#1D2129]">{focus === 'publish' ? '商品下发' : '批量管理'}</div>}

            {/* Main Content Area */}
            {pageTab !== 'publish' ? (
                <WebPublishRecords
                    masterChannelSyncRecords={masterChannelSyncRecords}
                    extraBatches={extraBatches}
                    view="all"
                    onViewChange={view => {
                        const tab = view === 'platform' ? 'platform-records' : 'qimai-records';
                        setPageTab(tab);
                        onRecordViewChange?.(tab);
                    }}
                />
            ) : step === 0 ? (
                renderToolsMenu()
            ) : (
                <div className="flex-1 flex overflow-hidden m-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Vertical Wizard Navigation */}
                    <div className="w-56 border-r border-gray-100 bg-white py-8 px-6 shrink-0">
                        <div className="relative">
                            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-100 -z-10"></div>
                            
                            <div className={`flex items-start mb-12 relative ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-4 mt-0.5 z-10 shrink-0 ${step >= 1 ? 'bg-[#00C06B] text-white ring-4 ring-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {step > 1 ? <CheckCircle2 size={14}/> : '1'}
                                </div>
                                <div>
                                    <div className={`font-bold whitespace-nowrap ${step === 1 ? 'text-[#00C06B]' : 'text-gray-800'}`}>{operationMode === 'sync' ? '选择商品及渠道' : '选择修改内容'}</div>
                                </div>
                            </div>

                            <div className={`flex items-start mb-12 relative ${step === 2 ? 'opacity-100' : 'opacity-50'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-4 mt-0.5 z-10 shrink-0 ${step >= 2 ? 'bg-[#00C06B] text-white ring-4 ring-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {step > 2 ? <CheckCircle2 size={14}/> : '2'}
                                </div>
                                <div>
                                    <div className={`font-bold whitespace-nowrap ${step === 2 ? 'text-[#00C06B]' : 'text-gray-800'}`}>{operationMode === 'sync' ? '选择门店及规则设置' : '确认生效范围'}</div>
                                </div>
                            </div>

                            <div className={`flex items-start relative ${step === 3 ? 'opacity-100' : 'opacity-50'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-4 mt-0.5 z-10 shrink-0 ${step >= 3 ? 'bg-[#00C06B] text-white ring-4 ring-white' : 'bg-gray-200 text-gray-500'}`}>
                                    3
                                </div>
                                <div>
                                    <div className={`font-bold whitespace-nowrap ${step === 3 ? 'text-[#00C06B]' : 'text-gray-800'}`}>完成</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                        {step === 1 && (operationMode === 'sync' ? renderStep1() : renderBatchStep1())}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </div>
                </div>
            )}
            <WebProductSelectorDialog
                open={productSelectorMode !== null}
                title={productSelectorMode === 'batch' ? operationMode === 'batch_combo' ? '添加套餐商品' : '添加标准商品' : comboOnly ? '选择套餐商品' : '选择同步商品'}
                description={productSelectorMode === 'batch'
                    ? `选择本次需要批量修改的${operationMode === 'batch_combo' ? '套餐商品' : '标准商品'}。`
                    : `筛选并选择本次需要同步下发的商品；当前来源：${syncSource === 'channel_catalog' ? unifiedManagementView ? '商品库' : authorizedChannelCatalogGroups.find(group => group.id === selectedChannelGroupIds[0])?.name || '渠道商品库' : syncSource === 'template' ? '商品下发模板' : unifiedManagementView ? '商品库' : '商品主档'}。`}
                products={selectorProducts}
                selectedIds={pendingSelectorProductIds}
                onSelectedIdsChange={setPendingSelectorProductIds}
                onCancel={() => setProductSelectorMode(null)}
                onConfirm={confirmProductSelector}
                onCreateProduct={productSelectorMode === 'sync' && syncSource !== 'template' && onCreateProduct ? type => {
                    setProductSelectorMode(null);
                    onCreateProduct(type, { productIds: [...pendingSelectorProductIds], channelIds: [...selectedPublishChannelIds], storeIds: [...selectedStoreIds], source: syncSource === 'channel_catalog' ? 'channel_catalog' : 'master', catalogId: selectedChannelGroupIds[0] });
                } : undefined}
                fixedType={productSelectorMode === 'batch' ? (operationMode === 'batch_combo' ? 'combo' : 'standard') : comboOnly ? 'combo' : undefined}
            />
        </div>
    );
};
