import React, { useEffect, useMemo, useState } from 'react';
import {
    Search, ChevronRight, CheckCircle2, ChevronDown,
    Layers, RefreshCw, FileUp, FileEdit, X, PackagePlus, Tickets, Tags, Copy, Trash2, SquarePen
} from 'lucide-react';
import { WebBatchAddonAssociation } from './WebBatchAddonAssociation';
import { useProducts } from '../../context';
import {
    channelGroupIncludesMiniProgram,
    getEffectiveChannelGroups,
    getOmnichannelChannel,
    getOmnichannelConfig,
    shouldShowChannelCatalog,
} from '../../omnichannel';
import type { OmnichannelChannelId } from '../../types';
import { WebPublishRecords } from './WebPublishRecords';
import { WebProductSelectorDialog, type SelectableProduct } from './WebProductSelectorDialog';

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
    { title: '商品属性', fields: ['基础价格', '商品标识', '商品条码', '预计成本', '商品份量'] },
    { title: '展示设置', fields: ['商品主图', '规格图片', '商品详情图', '列表页简述', '描述标签'] },
    { title: '销售属性', fields: ['售卖时间', '是否为套餐商品', '是否为小料商品', '起购限购', '单点不送', '包装费'] },
];
const TEMPLATE_RANGE_OPTIONS = [
    { id: 'template-1', name: '华南直营门店模板', count: 56, channels: ['mini_program_dine_in', 'pos'] as OmnichannelChannelId[] },
    { id: 'template-2', name: '机场枢纽门店模板', count: 12, channels: ['pos', 'mini_program_dine_in'] as OmnichannelChannelId[] },
    { id: 'template-3', name: '外卖渠道模板', count: 128, channels: ['mini_program_delivery', 'meituan', 'taobao'] as OmnichannelChannelId[] },
];
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
    title: string;
    desc: string;
    icon: React.ReactNode;
    iconWrapClass: string;
    onClick?: () => void;
    featured?: boolean;
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
        changed.push('基础售价');
    }
    if (JSON.stringify(product.timeSale) !== JSON.stringify(initial.timeSale)) changed.push('售卖时间');
    if (product.salesMode !== initial.salesMode) changed.push('售卖方式');
    return changed;
};

export const WebProductSync: React.FC<{ initialTab?: 'publish' | 'records' }> = ({ initialTab = 'publish' }) => {
    const { activeBrandId, brandConfigs } = useProducts();
    const omnichannelConfig = getOmnichannelConfig(brandConfigs[activeBrandId] || brandConfigs.b_1);
    const channelCatalogGroups = getEffectiveChannelGroups(omnichannelConfig);
    const channelCatalogEnabled = shouldShowChannelCatalog(omnichannelConfig) && channelCatalogGroups.length > 0;
    const [step, setStep] = useState(0);
    const [activeBatchTool, setActiveBatchTool] = useState<'addon-association' | null>(null);
    const [pageTab, setPageTab] = useState<'publish' | 'records'>(initialTab);
    const [operationMode, setOperationMode] = useState<'sync' | 'batch_standard' | 'batch_combo'>('sync');
    const [syncSource, setSyncSource] = useState<'master' | 'template' | 'channel_catalog'>(() => channelCatalogEnabled ? 'channel_catalog' : 'master');
    // 原型默认当前账号拥有全部固定渠道权限；生产环境需先按账号的 channelId 数据范围过滤，
    // 再由当前动态分组反向计算可见/可选商品库，不能把菜单权限等同于全部商品库权限。
    const authorizedChannelCatalogGroups = channelCatalogGroups;
    const [selectedChannelGroupIds, setSelectedChannelGroupIds] = useState<string[]>(() => channelCatalogGroups[0] ? [channelCatalogGroups[0].id] : []);
    const [selectedTargetChannelGroupIds, setSelectedTargetChannelGroupIds] = useState<string[]>(() => channelCatalogGroups[0] ? [channelCatalogGroups[0].id] : []);
    const [selectedTargetScopes, setSelectedTargetScopes] = useState<Array<'master' | 'template' | 'store' | 'channel_catalog'>>(['master', 'template', 'store']);
    const [batchChangeMode, setBatchChangeMode] = useState<'individual' | 'unified'>('individual');
    const [batchProductSource, setBatchProductSource] = useState<'master' | 'channel_catalog'>('master');
    const [batchChannelGroupId, setBatchChannelGroupId] = useState<string>(() => channelCatalogGroups[0]?.id || '');
    const [templateRangeMode, setTemplateRangeMode] = useState<'all' | 'selected'>('all');
    const [storeRangeMode, setStoreRangeMode] = useState<'all' | 'selected' | 'template'>('selected');
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(['template-1']);
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(['store-1', 'store-2']);
    const [selectedBatchChannelIds, setSelectedBatchChannelIds] = useState<OmnichannelChannelId[]>(() => (
        channelCatalogEnabled
            ? Array.from(new Set(channelCatalogGroups.flatMap(group => group.channels)))
            : DEFAULT_PUBLISH_CHANNEL_IDS
    ));
    const [selectedBatchFields, setSelectedBatchFields] = useState<string[]>(['商品名称', '前台分类', '基础价格']);
    const [selectedBatchProductIds, setSelectedBatchProductIds] = useState<string[]>(['1', '2']);
    const [selectedSyncProductIds, setSelectedSyncProductIds] = useState<string[]>(['1', '2', '3']);
    const [selectedPublishChannelIds, setSelectedPublishChannelIds] = useState<OmnichannelChannelId[]>(() => (
        channelCatalogEnabled
            ? Array.from(new Set(channelCatalogGroups.flatMap(group => group.channels)))
            : DEFAULT_PUBLISH_CHANNEL_IDS
    ));
    const [publishValidationMessage, setPublishValidationMessage] = useState('');
    const [productSelectorMode, setProductSelectorMode] = useState<'sync' | 'batch' | null>(null);
    const [pendingSelectorProductIds, setPendingSelectorProductIds] = useState<string[]>([]);
    const [products, setProducts] = useState<EditableProduct[]>(() => cloneInitialProducts());
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('all');
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

    const availablePublishChannelIds = useMemo<OmnichannelChannelId[]>(() => (
        syncSource === 'channel_catalog'
            ? Array.from(new Set(
                authorizedChannelCatalogGroups
                    .filter(group => selectedChannelGroupIds.includes(group.id))
                    .flatMap(group => group.channels)
            ))
            : DEFAULT_PUBLISH_CHANNEL_IDS
    ), [authorizedChannelCatalogGroups, selectedChannelGroupIds, syncSource]);
    const availablePublishChannelKey = availablePublishChannelIds.join('|');

    useEffect(() => {
        setSelectedPublishChannelIds(availablePublishChannelIds);
        setPublishValidationMessage('');
    }, [availablePublishChannelKey]);

    const selectedSyncProducts = useMemo(
        () => products.filter(product => selectedSyncProductIds.includes(product.id)),
        [products, selectedSyncProductIds]
    );
    const batchRangeInvalid = operationMode !== 'sync' && (
        selectedTargetScopes.length === 0
        || (selectedTargetScopes.includes('template') && templateRangeMode === 'selected' && selectedTemplateIds.length === 0)
        || (selectedTargetScopes.includes('store') && storeRangeMode === 'selected' && selectedStoreIds.length === 0)
        || (selectedTargetScopes.includes('store') && storeRangeMode === 'template' && !selectedTargetScopes.includes('template'))
        || (selectedTargetScopes.includes('store') && storeRangeMode !== 'template' && selectedBatchChannelIds.length === 0)
        || (selectedTargetScopes.includes('channel_catalog') && selectedTargetChannelGroupIds.length === 0)
    );
    const miniProgramMainImageMissingProducts = useMemo(() => (
        channelGroupIncludesMiniProgram(selectedPublishChannelIds)
            ? selectedSyncProducts.filter(product => !String(product.image || '').trim())
            : []
    ), [selectedPublishChannelIds, selectedSyncProducts]);
    const includesMeituanDine = operationMode === 'sync' && selectedPublishChannelIds.includes('meituan_dine');
    const qimaiManagesMeituanDine = omnichannelConfig.thirdPartyStrategies.meituan_dine === 'qimai';
    const meituanMissingBrandProducts = selectedSyncProducts.filter(product => ['2', '3'].includes(product.id));
    const meituanComboProducts = selectedSyncProducts.filter(product => product.type.includes('套餐'));

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
            ? products
            : products.filter(product => product.categories.some(category => category.name === selectedCategoryName));

        return [...list].sort((a, b) => {
            const aCategory = getDisplayCategory(a, selectedCategoryName);
            const bCategory = getDisplayCategory(b, selectedCategoryName);
            if (!aCategory && !bCategory) return 0;
            if (!aCategory) return 1;
            if (!bCategory) return -1;
            if (aCategory.productSort !== bCategory.productSort) return aCategory.productSort - bCategory.productSort;
            return a.name.localeCompare(b.name, 'zh-CN');
        });
    }, [products, selectedCategoryName]);

    const selectorProducts = useMemo<SelectableProduct[]>(() => products.map(product => ({
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
    })), [products]);

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
                icon: <RefreshCw size={24} className="text-orange-500" />,
                iconWrapClass: 'bg-orange-50',
                onClick: () => { setOperationMode('sync'); setStep(1); },
                featured: true,
            },
            {
                title: '批量发布模板商品',
                desc: '批量选择模板并发布至适用门店',
                icon: <Layers size={24} className="text-cyan-500" />,
                iconWrapClass: 'bg-cyan-50',
                disabled: true,
            },
            {
                title: '更新门店商品属性',
                desc: '更新商品属性至门店',
                icon: <SquarePen size={24} className="text-green-500" />,
                iconWrapClass: 'bg-green-50',
                disabled: true,
            },
            {
                title: '同步套餐商品至门店',
                desc: '仅同步套餐商品至门店',
                icon: <PackagePlus size={24} className="text-emerald-500" />,
                iconWrapClass: 'bg-emerald-50',
            },
        ];

        const batchCards: ToolCardConfig[] = [
            {
                title: '批量修改标准商品',
                desc: '批量修改商品库、模板、门店的商品信息',
                icon: <FileEdit size={24} className="text-blue-500" />,
                iconWrapClass: 'bg-blue-50',
                onClick: () => { setOperationMode('batch_standard'); setStep(1); },
            },
            {
                title: '批量修改套餐商品',
                desc: '批量修改商品库、模板、门店的商品信息',
                icon: <PackagePlus size={24} className="text-emerald-500" />,
                iconWrapClass: 'bg-emerald-50',
                disabled: true,
                onClick: () => { setOperationMode('batch_combo'); setStep(1); },
            },
            {
                title: '批量修改加料商品',
                desc: '批量修改门店商品信息',
                icon: <Tickets size={24} className="text-violet-500" />,
                iconWrapClass: 'bg-violet-50',
                disabled: true,
            },
            {
                title: '批量修改商品关联加料',
                desc: '修改部分商品库、模板、门店商品关联的加料',
                icon: <Tags size={24} className="text-rose-500" />,
                iconWrapClass: 'bg-rose-50',
                onClick: () => setActiveBatchTool('addon-association'),
            },
            {
                title: '批量修改商品关联做法',
                desc: '批量修改商品库、模板、门店商品的做法',
                icon: <Layers size={24} className="text-lime-500" />,
                iconWrapClass: 'bg-lime-50',
                disabled: true,
            },
            {
                title: '批量启用/禁用门店做法',
                desc: '批量启用或禁用门店对应的做法',
                icon: <Layers size={24} className="text-yellow-500" />,
                iconWrapClass: 'bg-yellow-50',
                disabled: true,
            },
        ];

        const productToolCards: ToolCardConfig[] = [
            {
                title: '删除门店商品',
                desc: '根据各种匹配配置信息从门店删除',
                icon: <Trash2 size={24} className="text-red-500" />,
                iconWrapClass: 'bg-red-50',
                disabled: true,
            },
            {
                title: '删除门店加料',
                desc: '根据各种匹配配置从门店删除加料',
                icon: <Trash2 size={24} className="text-red-500" />,
                iconWrapClass: 'bg-red-50',
                disabled: true,
            },
            {
                title: '门店商品复制',
                desc: '适用于将店开业等门店商品完整克隆至目标门店',
                icon: <Copy size={24} className="text-emerald-500" />,
                iconWrapClass: 'bg-emerald-50',
                disabled: true,
            },
        ];

        const renderCardGrid = (cards: ToolCardConfig[]) => (
            <div className="grid grid-cols-3 gap-4">
                {cards.map(card => (
                    <button
                        key={card.title}
                        type="button"
                        onClick={card.onClick}
                        disabled={card.disabled}
                        className={`relative overflow-hidden rounded-lg border bg-white p-4 text-left transition-colors ${
                            card.featured
                                ? 'border-[#00C06B] hover:bg-[#F8FFFB]'
                                : 'border-gray-200 hover:border-[#A9E4C3]'
                        } ${card.disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}
                    >
                        {card.featured && <div className="absolute left-0 top-0 h-full w-1 bg-[#00C06B]" />}
                        <div className="flex items-start">
                            <div className={`mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.iconWrapClass}`}>
                                {card.icon}
                            </div>
                            <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2"><h4 className="text-base font-bold text-gray-800">{card.title}</h4>{card.disabled && <span className="rounded bg-[#F2F4F7] px-1.5 py-0.5 text-[11px] font-medium text-[#667085]">现有系统未接入</span>}</div>
                                <p className="text-xs text-gray-400">{card.desc}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        );

        return (
            <div className="h-full overflow-y-auto p-8">
                <div className="mb-8">
                    <h3 className="mb-4 flex items-center font-bold text-gray-800 before:mr-2 before:h-4 before:w-1 before:bg-[#00C06B] before:content-['']">商品发布</h3>
                    {renderCardGrid(syncCards)}
                </div>

                <div className="mb-8">
                    <h3 className="mb-4 flex items-center font-bold text-gray-800 before:mr-2 before:h-4 before:w-1 before:bg-[#00C06B] before:content-['']">批量修改</h3>
                    {renderCardGrid(batchCards)}
                </div>

                <div>
                    <h3 className="mb-4 flex items-center font-bold text-gray-800 before:mr-2 before:h-4 before:w-1 before:bg-[#00C06B] before:content-['']">发布工具</h3>
                    {renderCardGrid(productToolCards)}
                </div>
            </div>
        );
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
                            <div className="text-sm text-gray-600 mb-3">基础售价</div>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#F5F5F5] text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">规格</th>
                                            <th className="px-4 py-3">基础售价</th>
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

    const renderBatchStep1 = () => (
        <div className="flex h-full flex-1 flex-col bg-white">
            <div className="min-h-0 flex-1 overflow-auto p-7">
                <div className="max-w-5xl">
                    <div className="mb-7">
                        <h2 className="text-xl font-black text-gray-900">{operationMode === 'batch_combo' ? '批量修改套餐商品' : '批量修改标准商品'}</h2>
                    </div>

                    <div className="mb-7 border-b border-gray-100 pb-6">
                        <div className="mb-3 text-sm font-black text-gray-800">修改方式</div>
                        <div className="flex items-center gap-8 text-sm">
                            <label className={`flex cursor-pointer items-center font-bold ${batchChangeMode === 'individual' ? 'text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" checked={batchChangeMode === 'individual'} onChange={() => setBatchChangeMode('individual')} className="mr-2" />个性修改</label>
                            <label className={`flex cursor-pointer items-center font-bold ${batchChangeMode === 'unified' ? 'text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" checked={batchChangeMode === 'unified'} onChange={() => setBatchChangeMode('unified')} className="mr-2" />统一修改</label>
                        </div>
                    </div>

                    <div className="mb-7 border-b border-gray-100 pb-6">
                        <div className="mb-3 text-sm font-black text-gray-800">选择商品</div>
                        <div className="flex items-center gap-8 text-sm">
                            <label className={`flex cursor-pointer items-center font-bold ${batchProductSource === 'master' ? 'text-[#00A35B]' : 'text-gray-500'}`}>
                                <input type="radio" name="batch-product-source" checked={batchProductSource === 'master'} onChange={() => { setBatchProductSource('master'); setSelectedBatchProductIds([]); }} className="mr-2" />
                                商品主档
                            </label>
                            {channelCatalogEnabled && (
                                <label className={`flex cursor-pointer items-center font-bold ${batchProductSource === 'channel_catalog' ? 'text-[#00A35B]' : 'text-gray-500'}`}>
                                    <input type="radio" name="batch-product-source" checked={batchProductSource === 'channel_catalog'} onChange={() => { setBatchProductSource('channel_catalog'); setSelectedBatchProductIds([]); }} className="mr-2" />
                                    渠道商品库
                                </label>
                            )}
                        </div>
                        {batchProductSource === 'channel_catalog' && channelCatalogEnabled && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {authorizedChannelCatalogGroups.map(group => {
                                    const selected = batchChannelGroupId === group.id;
                                    return <button key={group.id} type="button" onClick={() => { setBatchChannelGroupId(group.id); setSelectedBatchProductIds([]); }} className={`border px-3 py-2 text-xs font-bold ${selected ? 'border-[#8BD7AE] bg-[#F0FBF5] text-[#008F53]' : 'border-gray-200 text-gray-500'}`}><span>{group.name}</span><span className="ml-2 font-normal">{group.channels.map(id => getOmnichannelChannel(id).shortName).join('、')}</span></button>;
                                })}
                            </div>
                        )}
                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                            <span className="text-sm text-gray-500">已选 <span className="font-bold text-gray-800">{selectedBatchProductIds.length}</span> 个商品</span>
                            <button type="button" onClick={() => openProductSelector('batch')} className="border border-[#00B460] bg-white px-4 py-2 text-sm font-bold text-[#00A35B] hover:bg-[#F0FBF5]">选择商品</button>
                        </div>
                        {selectedBatchProductIds.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2 border border-gray-200 bg-[#FAFBFC] px-4 py-3">
                                {products.filter(product => selectedBatchProductIds.includes(product.id)).map(product => (
                                    <span key={product.id} className="inline-flex items-center border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700">
                                        {product.name}
                                        <button type="button" aria-label={`移除${product.name}`} onClick={() => setSelectedBatchProductIds(prev => prev.filter(id => id !== product.id))} className="ml-2 text-gray-400 hover:text-red-500"><X size={13} /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mb-8 space-y-5">
                        {BATCH_FIELD_GROUPS.map(group => (
                            <div key={group.title} className="flex items-start">
                                <div className="w-28 shrink-0 pt-1 text-sm font-black text-gray-800">{group.title}</div>
                                <div className="flex flex-1 flex-wrap gap-x-6 gap-y-3">
                                    {group.fields.map(field => {
                                        const selected = selectedBatchFields.includes(field);
                                        return <label key={field} className={`flex cursor-pointer items-center text-sm ${selected ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="checkbox" checked={selected} onChange={() => setSelectedBatchFields(prev => selected ? prev.filter(item => item !== field) : [...prev, field])} className="mr-2 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />{field}</label>;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
            <div className="flex shrink-0 justify-end border-t border-gray-100 bg-white p-4"><button type="button" onClick={() => setStep(0)} className="mr-4 border border-gray-200 px-6 py-2 text-sm font-bold text-gray-600">取消</button><button type="button" onClick={() => setStep(2)} disabled={selectedBatchFields.length === 0 || selectedBatchProductIds.length === 0} className="bg-[#00C06B] px-6 py-2 text-sm font-bold text-white disabled:bg-gray-300">下一步</button></div>
        </div>
    );

    const renderStep1 = () => (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="border-b border-gray-100 p-6">
                <div className="mb-3 text-sm font-bold text-gray-700">选择商品</div>
                <div className="flex items-center gap-6">
                    {!channelCatalogEnabled && <label className={`flex cursor-pointer items-center space-x-2 text-sm ${syncSource === 'master' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="source" checked={syncSource === 'master'} onChange={() => setSyncSource('master')} className="h-4 w-4 text-[#00C06B]" /><span>商品主档</span></label>}
                    <label className={`flex cursor-pointer items-center space-x-2 text-sm ${syncSource === 'template' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="source" checked={syncSource === 'template'} onChange={() => setSyncSource('template')} className="h-4 w-4 text-[#00C06B]" /><span>商品模板</span></label>
                    {channelCatalogEnabled && <label className={`flex cursor-pointer items-center space-x-2 text-sm ${syncSource === 'channel_catalog' ? 'font-bold text-[#00A35B]' : 'text-gray-500'}`}><input type="radio" name="source" checked={syncSource === 'channel_catalog'} onChange={() => setSyncSource('channel_catalog')} className="h-4 w-4 text-[#00C06B]" /><span>渠道商品库</span></label>}
                </div>
                {syncSource === 'channel_catalog' && (
                    <div className="mt-4"><div className="flex flex-wrap gap-2">
                        {authorizedChannelCatalogGroups.map(group => { const selected = selectedChannelGroupIds[0] === group.id; return <button key={group.id} type="button" onClick={() => { setSelectedChannelGroupIds([group.id]); setSelectedSyncProductIds([]); }} className={`border px-3 py-2 text-xs font-bold ${selected ? 'border-[#8BD7AE] bg-[#F0FBF5] text-[#008F53]' : 'border-gray-200 text-gray-500'}`}><span>{group.name}</span><span className="ml-2 font-normal">{group.channels.map(id => getOmnichannelChannel(id).shortName).join('、')}</span></button>; })}
                    </div></div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-sm text-gray-500">已选 <span className="font-bold text-gray-800">{selectedSyncProductIds.length}</span> 个商品</span>
                    <button type="button" onClick={() => openProductSelector('sync')} className="bg-[#00C06B] px-6 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">选择商品</button>
                </div>
            </div>

            <div className="p-6 border-b border-gray-100">
                <div className="text-sm font-bold text-gray-700 mb-3">选择渠道</div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
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
                </div>
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
                                <th className="py-3 px-4 font-medium">基础售价</th>
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
                                                <button
                                                    onClick={() => handleRemoveProduct(product.id)}
                                                    className="text-gray-500 hover:text-red-500"
                                                >
                                                    移除
                                                </button>
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
                <button onClick={() => setStep(0)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors mr-4">取消</button>
                <button onClick={() => setStep(2)} className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B] transition-colors shadow-md">下一步</button>
            </div>

            {renderEditorDrawer()}
        </div>
    );

    const renderStoreSelector = () => (
        <div className="flex h-[400px] min-h-[400px] shrink-0 border border-gray-200">
            <div className="flex w-64 shrink-0 flex-col border-r border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 p-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-2 text-gray-400" />
                        <input className="w-full border border-gray-200 py-1 pl-7 pr-2 text-xs outline-none focus:border-[#00C06B]" placeholder="请输入门店名称/编码/ID" />
                    </div>
                </div>
                <div className="flex-1 space-y-1 overflow-auto p-2">
                    <div className="flex cursor-pointer items-center bg-[#00C06B]/10 px-2 py-1.5 text-sm font-bold text-[#00C06B]">
                        <ChevronDown size={14} className="mr-1" /> 餐饮2.0
                    </div>
                    <div className="ml-4 flex cursor-pointer items-center px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                        <ChevronRight size={14} className="mr-1" /> S茶
                    </div>
                    <div className="ml-4 flex cursor-pointer items-center px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                        <ChevronRight size={14} className="mr-1" /> No1A
                    </div>
                </div>
            </div>
            <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-2 text-xs text-gray-500">
                    <span>餐饮2.0 <span className="mx-2">|</span> 共 5348 家门店</span>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 border-b border-gray-100 bg-white text-gray-500">
                            <tr>
                                <th className="w-10 px-4 py-2"><input type="checkbox" className="rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]" /></th>
                                <th className="px-4 py-2">门店名称</th>
                                <th className="px-4 py-2">门店ID</th>
                                <th className="px-4 py-2">门店编码</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3].map(i => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-4 py-2"><input type="checkbox" className="rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]" /></td>
                                    <td className="px-4 py-2 text-gray-800">新建门店 {i}</td>
                                    <td className="px-4 py-2 text-gray-500">56563{i}</td>
                                    <td className="px-4 py-2 text-gray-500">--</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="p-6 flex-1 overflow-auto">
                <div className="max-w-4xl">
                    {operationMode !== 'sync' && (
                        <div className="mb-8">
                            <h3 className="mb-4 text-base font-bold text-gray-800">确认生效范围</h3>
                            <div className="divide-y divide-gray-100 border border-gray-200">
                                <div className={`px-4 py-3 ${selectedTargetScopes.includes('master') ? 'bg-[#F7FCF9]' : 'bg-white'}`}>
                                    <label className={`flex cursor-pointer items-center text-sm font-bold ${selectedTargetScopes.includes('master') ? 'text-[#008F53]' : 'text-gray-700'}`}>
                                        <input type="checkbox" checked={selectedTargetScopes.includes('master')} onChange={() => setSelectedTargetScopes(prev => prev.includes('master') ? prev.filter(id => id !== 'master') : [...prev, 'master'])} className="mr-3 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />
                                        商品主档
                                    </label>
                                </div>

                                <div className={`px-4 py-3 ${selectedTargetScopes.includes('template') ? 'bg-[#F7FCF9]' : 'bg-white'}`}>
                                    <label className={`flex cursor-pointer items-center text-sm font-bold ${selectedTargetScopes.includes('template') ? 'text-[#008F53]' : 'text-gray-700'}`}>
                                        <input type="checkbox" checked={selectedTargetScopes.includes('template')} onChange={() => {
                                            if (selectedTargetScopes.includes('template') && storeRangeMode === 'template') setStoreRangeMode('selected');
                                            setSelectedTargetScopes(prev => prev.includes('template') ? prev.filter(id => id !== 'template') : [...prev, 'template']);
                                        }} className="mr-3 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />
                                        商品模板
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
                                </div>

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
                                                        {(channelCatalogEnabled ? Array.from(new Set(channelCatalogGroups.flatMap(group => group.channels))) : DEFAULT_PUBLISH_CHANNEL_IDS).map(channelId => {
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

                                {channelCatalogEnabled && (
                                    <div className={`px-4 py-3 ${selectedTargetScopes.includes('channel_catalog') ? 'bg-[#F7FCF9]' : 'bg-white'}`}>
                                        <label className={`flex cursor-pointer items-center text-sm font-bold ${selectedTargetScopes.includes('channel_catalog') ? 'text-[#008F53]' : 'text-gray-700'}`}>
                                            <input type="checkbox" checked={selectedTargetScopes.includes('channel_catalog')} onChange={() => setSelectedTargetScopes(prev => prev.includes('channel_catalog') ? prev.filter(id => id !== 'channel_catalog') : [...prev, 'channel_catalog'])} className="mr-3 h-4 w-4 rounded border-gray-300 text-[#00C06B]" />
                                            渠道商品库
                                        </label>
                                        {selectedTargetScopes.includes('channel_catalog') && (
                                            <div className="ml-7 mt-3 flex flex-wrap gap-2 border-t border-[#DDEFE5] pt-3">
                                                {authorizedChannelCatalogGroups.map(group => { const selected = selectedTargetChannelGroupIds.includes(group.id); return <button key={group.id} type="button" onClick={() => setSelectedTargetChannelGroupIds(prev => selected ? prev.filter(id => id !== group.id) : [...prev, group.id])} className={`border px-3 py-2 text-xs font-bold ${selected ? 'border-[#8BD7AE] bg-white text-[#008F53]' : 'border-gray-200 bg-white text-gray-500'}`}>{group.name}<span className="ml-2 font-normal">{group.channels.map(id => getOmnichannelChannel(id).shortName).join('、')}</span></button>; })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <h3 className="font-bold text-gray-800 mb-4 text-base">{operationMode === 'sync' ? '商品同步规则' : '修改规则'}</h3>
                    {operationMode === 'sync' ? <div className="flex items-start mb-6">
                        <span className="w-24 text-gray-500 text-sm mt-0.5">相同商品</span>
                        <div className="flex-1">
                            <label className="flex items-center text-[#00C06B] font-bold text-sm mb-2 cursor-pointer">
                                <input type="radio" checked readOnly className="mr-2 text-[#00C06B] focus:ring-[#00C06B]"/> 合并到门店商品
                            </label>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                                <p className="text-gray-500 mb-3">如果遇到重复商品，会覆盖门店重复商品，覆盖属性：</p>
                                <div className="flex flex-wrap gap-x-6 gap-y-3">
                                    {['商品名称', '基础售价', '商品排序', '分类排序', '售卖时间', '售卖方式', '前台分类'].map(attr => (
                                        <label key={attr} className="flex items-center text-gray-700 cursor-pointer">
                                            <input type="checkbox" defaultChecked className="mr-2 text-[#00C06B] rounded border-gray-300 focus:ring-[#00C06B]"/> {attr}
                                        </label>
                                    ))}
                                    <label className="flex items-center text-gray-400 cursor-not-allowed">
                                        <input type="checkbox" disabled className="mr-2 rounded border-gray-200"/> 其他属性 <span className="ml-1 text-xs bg-gray-200 px-1 rounded">默认参数配置</span>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-400 mt-4 border-t border-gray-200 pt-3">勾选以上任意选项后，将覆盖门店对应的商品属性</p>
                            </div>
                        </div>
                    </div> : <div className="mb-6 flex items-start"><span className="w-24 text-sm text-gray-500">修改内容</span><div className="flex flex-1 flex-wrap gap-2">{selectedBatchFields.map(field => <span key={field} className="border border-[#B7E7CB] bg-[#F4FBF7] px-2.5 py-1 text-xs font-bold text-[#008F53]">{field}</span>)}</div></div>}

                    {includesMeituanDine && (
                        <div className="mb-7 overflow-hidden rounded-lg border border-[#DDE5EC] bg-white">
                            <div className="flex items-start justify-between gap-4 border-b border-[#E8ECEF] bg-[#F7FAF8] px-4 py-3.5">
                                <div>
                                    <div className="text-sm font-black text-[#1F2129]">美团在线点任务编排</div>
                                    <div className="mt-1 text-xs leading-5 text-[#667085]">页面只确认商品、门店和渠道；系统自动处理平台品牌商品依赖。</div>
                                </div>
                                <span className={`shrink-0 rounded px-2.5 py-1 text-[11px] font-bold ${qimaiManagesMeituanDine ? 'bg-[#EAF8F1] text-[#087443]' : 'bg-[#F2F4F7] text-[#667085]'}`}>
                                    {qimaiManagesMeituanDine ? '企迈管理平台商品' : '平台自行管理商品'}
                                </span>
                            </div>
                            <div className="grid gap-0 md:grid-cols-3">
                                {[
                                    ['1', '补齐平台品牌商品', meituanMissingBrandProducts.length > 0 ? `${meituanMissingBrandProducts.length} 个商品尚未创建，将自动创建` : '所选商品均已具备平台品牌商品'],
                                    ['2', '更新企迈门店商品', syncSource === 'template' ? '模板仅更新门店商品，不直接改品牌商品' : '按本次门店范围创建或更新'],
                                    ['3', '同步美团门店商品', qimaiManagesMeituanDine ? '企迈门店商品成功后执行平台子任务' : '不创建平台商品同步任务'],
                                ].map(([index, title, desc]) => (
                                    <div key={index} className="border-b border-[#EEF0F2] px-4 py-4 md:border-b-0 md:border-r last:border-r-0">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#1F2129]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00B865] text-[11px] text-white">{index}</span>{title}</div>
                                        <div className="mt-2 text-xs leading-5 text-[#667085]">{desc}</div>
                                    </div>
                                ))}
                            </div>
                            {meituanComboProducts.length > 0 && (
                                <div className="border-t border-[#E8ECEF] bg-[#FFF9EB] px-4 py-3 text-xs leading-5 text-[#8A5A00]">
                                    已选 {meituanComboProducts.length} 个套餐。下发前将校验套餐分组、子商品和选购规则；不兼容时仅阻断对应美团平台子任务，企迈门店商品仍按现有逻辑处理。
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center mb-8">
                        <span className="w-24 text-gray-500 text-sm">同步时间</span>
                        <div className="flex space-x-6 text-sm">
                            <label className="flex items-center text-gray-400 cursor-not-allowed"><input type="radio" disabled className="mr-2"/> 手动执行</label>
                            <label className="flex items-center text-[#00C06B] font-bold cursor-pointer"><input type="radio" defaultChecked name="syncTime" className="mr-2 text-[#00C06B] focus:ring-[#00C06B]"/> 立即执行</label>
                            <label className="flex items-center text-gray-600 cursor-pointer"><input type="radio" name="syncTime" className="mr-2"/> 定时执行</label>
                        </div>
                        <span className="ml-4 text-xs text-red-500">高峰期进行商品同步等待时间可能较久，请尽量在非高峰期进行（定时）下发</span>
                    </div>

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
                        setPublishValidationMessage('');
                        setStep(3);
                    }}
                    disabled={batchRangeInvalid}
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
                {includesMeituanDine && qimaiManagesMeituanDine
                    ? '系统将依次补齐美团品牌商品、更新企迈门店商品并同步美团门店商品；请在发布记录中查看子任务结果。'
                    : '请在发布记录中查看任务执行进度和各范围处理结果。'}
            </p>
            <div className="flex space-x-4">
                <button onClick={() => setStep(0)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors">返回工具页</button>
                <button onClick={() => setPageTab('records')} className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B] transition-colors shadow-md">查看发布记录</button>
            </div>
        </div>
    );

    if (activeBatchTool === 'addon-association') {
        return <WebBatchAddonAssociation onBack={() => setActiveBatchTool(null)} />;
    }

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA] font-sans">
            <div className="flex h-[48px] shrink-0 items-stretch border-b border-[#E5E7EB] bg-white px-6 text-sm" role="tablist" aria-label="商品同步">
                <div className="flex h-full items-stretch gap-8">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={pageTab === 'publish'}
                        onClick={() => setPageTab('publish')}
                        className={`relative flex h-full items-center px-0.5 text-[14px] transition-colors ${pageTab === 'publish' ? 'font-semibold text-[#008F4C] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t after:bg-[#00B460]' : 'font-medium text-[#667085] hover:text-[#1D2129]'}`}
                    >
                        同步与批量工具
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={pageTab === 'records'}
                        onClick={() => setPageTab('records')}
                        className={`relative flex h-full items-center px-0.5 text-[14px] transition-colors ${pageTab === 'records' ? 'font-semibold text-[#008F4C] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t after:bg-[#00B460]' : 'font-medium text-[#667085] hover:text-[#1D2129]'}`}
                    >
                        同步记录
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {pageTab === 'records' ? (
                <WebPublishRecords />
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
                title={productSelectorMode === 'batch' ? '选择批量修改商品' : '选择同步商品'}
                description={productSelectorMode === 'batch'
                    ? `筛选并选择本次需要批量修改的商品；当前来源：${batchProductSource === 'master' ? '商品主档' : authorizedChannelCatalogGroups.find(group => group.id === batchChannelGroupId)?.name || '渠道商品库'}。`
                    : `筛选并选择本次需要同步下发的商品；当前来源：${syncSource === 'channel_catalog' ? authorizedChannelCatalogGroups.find(group => group.id === selectedChannelGroupIds[0])?.name || '渠道商品库' : syncSource === 'template' ? '商品模板' : '商品主档'}。`}
                products={selectorProducts}
                selectedIds={pendingSelectorProductIds}
                onSelectedIdsChange={setPendingSelectorProductIds}
                onCancel={() => setProductSelectorMode(null)}
                onConfirm={confirmProductSelector}
                fixedType={productSelectorMode === 'batch' ? (operationMode === 'batch_combo' ? 'combo' : 'standard') : undefined}
            />
        </div>
    );
};
