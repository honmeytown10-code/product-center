import React, { useMemo, useState } from 'react';
import {
    Search, ChevronRight, CheckCircle2, ChevronDown,
    Layers, RefreshCw, FileUp, FileEdit, X
} from 'lucide-react';

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

type MethodConfig = {
    id: string;
    name: string;
    price: number;
    code: string;
    temperature: string;
};

type AddonConfig = {
    id: string;
    name: string;
    code: string;
    limit: number;
    stock: number;
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
    methods: MethodConfig[];
    addons: AddonConfig[];
    addonMode: '限制所有加料购买总量' | '点餐时数量不限';
    categories: ProductCategoryConfig[];
};

const CATEGORY_OPTIONS = ['AAA', '超值儿童餐', '测试满赠分类', '咖啡-邵亮测试', '新品推荐'];
const METHOD_LIBRARY: MethodConfig[] = [
    { id: 'method_1', name: '冰量', price: 0, code: '/', temperature: '冷' },
    { id: 'method_2', name: '糖度', price: 0, code: '/', temperature: '冷/热' },
    { id: 'method_3', name: '温度', price: 0, code: '/', temperature: '冷/热' },
    { id: 'method_4', name: '冷热', price: 0, code: '/', temperature: '冷/热' },
    { id: 'method_5', name: '规格做法', price: 1, code: 'GF001', temperature: '常温' },
];
const ADDON_LIBRARY: AddonConfig[] = [
    { id: 'addon_1', name: '椰果', code: 'AG001', limit: 9999, stock: 9999, price: 1 },
    { id: 'addon_2', name: '珍珠', code: 'AG002', limit: 9999, stock: 9999, price: 1 },
    { id: 'addon_3', name: '奶盖', code: 'AG003', limit: 9999, stock: 9999, price: 2 },
    { id: 'addon_4', name: '西柚粒', code: 'AG004', limit: 9999, stock: 9999, price: 1 },
    { id: 'addon_5', name: '加浓', code: 'AG005', limit: 9999, stock: 9999, price: 3 },
    { id: 'addon_6', name: '小料', code: 'AG006', limit: 9999, stock: 9999, price: 1 },
];

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
        methods: [METHOD_LIBRARY[0], METHOD_LIBRARY[1]].map(item => ({ ...item })),
        addons: [ADDON_LIBRARY[0], ADDON_LIBRARY[1]].map(item => ({ ...item })),
        addonMode: '点餐时数量不限',
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
        methods: [METHOD_LIBRARY[2]].map(item => ({ ...item })),
        addons: [ADDON_LIBRARY[2]].map(item => ({ ...item })),
        addonMode: '限制所有加料购买总量',
        categories: [
            { id: 'cate_3', name: 'AAA', categorySort: 1, productSort: 2 },
            { id: 'cate_4', name: '测试满赠分类', categorySort: 3, productSort: 1 },
        ],
    },
    {
        id: '3',
        name: '柠檬茶',
        code: '1246829509485641731',
        type: '标准商品',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=100',
        price: 16,
        salesMode: '仅套餐售卖',
        timeSale: {
            enabled: true,
            startDate: '2026-04-14',
            endDate: '2026-04-20',
            weekdays: ['周六', '周日'],
            startTime: '10:00',
            endTime: '21:00',
        },
        specs: [
            { id: 'spec_5', name: '统', price: 16 },
        ],
        methods: [METHOD_LIBRARY[2]].map(item => ({ ...item })),
        addons: [ADDON_LIBRARY[3]].map(item => ({ ...item })),
        addonMode: '点餐时数量不限',
        categories: [
            { id: 'cate_5', name: '咖啡-邵亮测试', categorySort: 4, productSort: 1 },
        ],
    },
];

const WEEKDAY_OPTIONS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const SALES_MODE_OPTIONS: EditableProduct['salesMode'][] = ['正常售卖', '仅套餐售卖'];

const cloneInitialProducts = () => INITIAL_SYNC_PRODUCTS.map(product => ({
    ...product,
    timeSale: {
        ...product.timeSale,
        weekdays: [...product.timeSale.weekdays],
    },
    specs: product.specs.map(spec => ({ ...spec })),
    methods: product.methods.map(method => ({ ...method })),
    addons: product.addons.map(addon => ({ ...addon })),
    addonMode: product.addonMode,
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
    if (product.price !== initial.price) changed.push('基础价格');
    if (JSON.stringify(product.specs) !== JSON.stringify(initial.specs)) changed.push('规格基础价格');
    if (JSON.stringify(product.timeSale) !== JSON.stringify(initial.timeSale)) changed.push('售卖时间');
    if (JSON.stringify(product.methods) !== JSON.stringify(initial.methods)) changed.push('做法');
    if (JSON.stringify(product.addons) !== JSON.stringify(initial.addons)) changed.push('加料');
    if (product.salesMode !== initial.salesMode) changed.push('售卖方式');
    return changed;
};

const getNameSummary = (items: Array<{ name: string }>) => getSummaryText(items.map(item => item.name));

export const WebProductSync: React.FC = () => {
    const [step, setStep] = useState(0);
    const [products, setProducts] = useState<EditableProduct[]>(() => cloneInitialProducts());
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('all');
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [methodPickerOpen, setMethodPickerOpen] = useState(false);
    const [addonPickerOpen, setAddonPickerOpen] = useState(false);

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
        setMethodPickerOpen(false);
        setAddonPickerOpen(false);
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

    const toggleMethodSelection = (productId: string, methodName: string) => {
        updateProduct(productId, product => {
            const exists = product.methods.some(item => item.name === methodName);
            return {
                ...product,
                methods: exists
                    ? product.methods.filter(item => item.name !== methodName)
                    : [...product.methods, { ...METHOD_LIBRARY.find(item => item.name === methodName)! }],
            };
        });
    };

    const toggleAddonSelection = (productId: string, addonName: string) => {
        updateProduct(productId, product => {
            const exists = product.addons.some(item => item.name === addonName);
            return {
                ...product,
                addons: exists
                    ? product.addons.filter(item => item.name !== addonName)
                    : [...product.addons, { ...ADDON_LIBRARY.find(item => item.name === addonName)! }],
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

    const updateMethod = (productId: string, methodId: string, updater: (method: MethodConfig) => MethodConfig) => {
        updateProduct(productId, product => ({
            ...product,
            methods: product.methods.map(method => (
                method.id === methodId ? updater(method) : method
            )),
        }));
    };

    const updateAddon = (productId: string, addonId: string, updater: (addon: AddonConfig) => AddonConfig) => {
        updateProduct(productId, product => ({
            ...product,
            addons: product.addons.map(addon => (
                addon.id === addonId ? updater(addon) : addon
            )),
        }));
    };

    const renderToolsMenu = () => (
        <div className="p-8 h-full overflow-y-auto">
            <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center before:content-[''] before:w-1 before:h-4 before:bg-[#00C06B] before:mr-2">商品同步</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div
                        onClick={() => setStep(1)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-[#00C06B] cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#00C06B]"></div>
                        <div className="flex items-start">
                            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                <RefreshCw size={24} className="text-orange-500" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-gray-800 mb-1">同步商品至门店</h4>
                                <p className="text-xs text-gray-400">同步商品至门店</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-start">
                        <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mr-4">
                            <FileUp size={24} className="text-[#00C06B]" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-gray-800 mb-1">同步套餐商品至门店</h4>
                            <p className="text-xs text-gray-400">仅同步套餐商品至门店</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-start">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-4">
                            <Layers size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-gray-800 mb-1">批量同步模板至门店</h4>
                            <p className="text-xs text-gray-400">批量同步多个模板的商品至门店</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center before:content-[''] before:w-1 before:h-4 before:bg-[#00C06B] before:mr-2">批量修改</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start opacity-70">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-4">
                            <FileEdit size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-gray-800 mb-1">批量修改标准商品</h4>
                            <p className="text-xs text-gray-400">批量修改商品库、模板、门店的商品信息</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

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
                            <div className="text-lg font-bold text-gray-800">编辑商品信息</div>
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
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
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

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="text-base font-bold text-gray-800 mb-4">商品属性</div>
                            <div className="text-sm text-gray-600 mb-3">规格基础价格</div>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#F5F5F5] text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">规格</th>
                                            <th className="px-4 py-3">基础价格</th>
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

                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-bold text-gray-800">做法</div>
                                    <button
                                        onClick={() => setMethodPickerOpen(prev => !prev)}
                                        className="px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-700 hover:border-[#00C06B]/40"
                                    >
                                        + 选择做法
                                    </button>
                                </div>
                                {methodPickerOpen && (
                                    <div className="mb-3 p-3 rounded-lg border border-dashed border-[#00C06B]/30 bg-[#F7FFFB] flex flex-wrap gap-2">
                                        {METHOD_LIBRARY.map(option => {
                                            const active = product.methods.some(item => item.name === option.name);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => toggleMethodSelection(product.id, option.name)}
                                                    className={`px-3 py-1.5 rounded text-sm border ${
                                                        active
                                                            ? 'bg-[#00C06B] text-white border-[#00C06B]'
                                                            : 'bg-white text-gray-600 border-gray-200'
                                                    }`}
                                                >
                                                    {active ? '已选 ' : ''}{option.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[#F5F5F5] text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3">做法名称</th>
                                                <th className="px-4 py-3">做法价格</th>
                                                <th className="px-4 py-3">做法标识码</th>
                                                <th className="px-4 py-3">做法温层</th>
                                                <th className="px-4 py-3 w-24">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {product.methods.length > 0 ? product.methods.map(method => (
                                                <tr key={method.id} className="border-t border-gray-100">
                                                    <td className="px-4 py-3 text-gray-700">{method.name}</td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={method.price}
                                                            onChange={event => updateMethod(product.id, method.id, current => ({
                                                                ...current,
                                                                price: Number(event.target.value) || 0,
                                                            }))}
                                                            className="w-20 border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#00C06B]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            value={method.code}
                                                            onChange={event => updateMethod(product.id, method.id, current => ({
                                                                ...current,
                                                                code: event.target.value,
                                                            }))}
                                                            className="w-24 border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#00C06B]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            value={method.temperature}
                                                            onChange={event => updateMethod(product.id, method.id, current => ({
                                                                ...current,
                                                                temperature: event.target.value,
                                                            }))}
                                                            className="w-24 border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#00C06B]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => toggleMethodSelection(product.id, method.name)}
                                                            className="text-gray-500 hover:text-red-500"
                                                        >
                                                            删除
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">未选择做法</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-bold text-gray-800">加料</div>
                                    <button
                                        onClick={() => setAddonPickerOpen(prev => !prev)}
                                        className="px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-700 hover:border-[#00C06B]/40"
                                    >
                                        + 选择加料
                                    </button>
                                </div>
                                {addonPickerOpen && (
                                    <div className="mb-3 p-3 rounded-lg border border-dashed border-[#00C06B]/30 bg-[#F7FFFB] flex flex-wrap gap-2">
                                        {ADDON_LIBRARY.map(option => {
                                            const active = product.addons.some(item => item.name === option.name);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => toggleAddonSelection(product.id, option.name)}
                                                    className={`px-3 py-1.5 rounded text-sm border ${
                                                        active
                                                            ? 'bg-[#00C06B] text-white border-[#00C06B]'
                                                            : 'bg-white text-gray-600 border-gray-200'
                                                    }`}
                                                >
                                                    {active ? '已选 ' : ''}{option.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="mb-3 flex items-center gap-4 text-sm">
                                    <span className="text-gray-500">加料配置</span>
                                    <select
                                        value={product.addonMode}
                                        onChange={event => updateProduct(product.id, current => ({
                                            ...current,
                                            addonMode: event.target.value as EditableProduct['addonMode'],
                                        }))}
                                        className="border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#00C06B]"
                                    >
                                        <option value="限制所有加料购买总量">限制所有加料购买总量</option>
                                        <option value="点餐时数量不限">点餐时数量不限</option>
                                    </select>
                                </div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[#F5F5F5] text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3">加料商品名</th>
                                                <th className="px-4 py-3">加料商品编码</th>
                                                <th className="px-4 py-3">限购</th>
                                                <th className="px-4 py-3">初始库存</th>
                                                <th className="px-4 py-3">初始价格</th>
                                                <th className="px-4 py-3 w-24">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {product.addons.length > 0 ? product.addons.map(addon => (
                                                <tr key={addon.id} className="border-t border-gray-100">
                                                    <td className="px-4 py-3 text-gray-700">{addon.name}</td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            value={addon.code}
                                                            onChange={event => updateAddon(product.id, addon.id, current => ({
                                                                ...current,
                                                                code: event.target.value,
                                                            }))}
                                                            className="w-24 border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#00C06B]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={addon.limit}
                                                            onChange={event => updateAddon(product.id, addon.id, current => ({
                                                                ...current,
                                                                limit: Number(event.target.value) || 0,
                                                            }))}
                                                            className="w-20 border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#00C06B]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={addon.stock}
                                                            onChange={event => updateAddon(product.id, addon.id, current => ({
                                                                ...current,
                                                                stock: Number(event.target.value) || 0,
                                                            }))}
                                                            className="w-20 border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#00C06B]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={addon.price}
                                                            onChange={event => updateAddon(product.id, addon.id, current => ({
                                                                ...current,
                                                                price: Number(event.target.value) || 0,
                                                            }))}
                                                            className="w-20 border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#00C06B]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => toggleAddonSelection(product.id, addon.name)}
                                                            className="text-gray-500 hover:text-red-500"
                                                        >
                                                            删除
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">未选择加料</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
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

    const renderStep1 = () => (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="p-6 border-b border-gray-100 flex items-center space-x-6">
                <label className="flex items-center space-x-2 text-sm text-gray-500 cursor-pointer">
                    <input type="radio" name="source" className="w-4 h-4 text-[#00C06B] focus:ring-[#00C06B]" />
                    <span>选择模板商品</span>
                </label>
                <label className="flex items-center space-x-2 text-sm font-bold text-[#00C06B] cursor-pointer">
                    <input type="radio" name="source" defaultChecked className="w-4 h-4 text-[#00C06B] focus:ring-[#00C06B]" />
                    <span>选择商品库商品</span>
                </label>
            </div>

            <div className="p-6 border-b border-gray-100">
                <div className="text-sm font-bold text-gray-700 mb-3">选择渠道</div>
                <div className="flex space-x-4">
                    {['全选', '小程序堂食', '小程序外卖', 'POS', '美团外卖', '淘宝闪购'].map(ch => (
                        <label key={ch} className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#00C06B] rounded border-gray-300 focus:ring-[#00C06B]" />
                            <span>{ch}</span>
                        </label>
                    ))}
                </div>
                <div className="mt-4 flex items-center space-x-4">
                    <button className="px-6 py-1.5 bg-[#00C06B] text-white rounded text-sm font-bold hover:bg-[#00A35B]">选择商品</button>
                    <span className="text-xs text-gray-400">选择套餐商品同步至门店，会默认将套餐中所有子商品同步至门店</span>
                </div>
            </div>

            <div className="px-6 py-3 border-b border-gray-100 bg-[#FAFBFC] text-sm text-gray-500">
                已选 <span className="font-bold text-gray-800">{products.length}</span> 个商品
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
                                <th className="py-3 px-4 font-medium">基础价格</th>
                                <th className="py-3 px-4 font-medium">可售时间</th>
                                <th className="py-3 px-4 font-medium">做法/加料</th>
                                <th className="py-3 px-4 font-medium w-[132px] min-w-[132px] sticky right-0 z-30 bg-[#F5F5F5] shadow-[-10px_0_14px_-10px_rgba(0,0,0,0.18)]">操作</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600">
                            {filteredProducts.map(product => {
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
                                        <td className="py-4 px-4 align-top">
                                            <div className="text-gray-800">
                                                {product.methods.length > 0 || product.addons.length > 0 ? '已配置' : '未配置'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                做法 {product.methods.length} 项 / 加料 {product.addons.length} 项
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 align-top w-[132px] min-w-[132px] sticky right-0 z-30 bg-white group-hover:bg-[#F7F8FA] shadow-[-10px_0_14px_-10px_rgba(0,0,0,0.16)]">
                                            <div className="flex items-center gap-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => openEditor(product.id)}
                                                    className="text-[#00C06B] hover:underline"
                                                >
                                                    编辑商品
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
                <button className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors mr-4">取消</button>
                <button onClick={() => setStep(2)} className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B] transition-colors shadow-md">下一步</button>
            </div>

            {renderEditorDrawer()}
        </div>
    );

    const renderStep2 = () => (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="p-6 flex-1 overflow-auto">
                <div className="max-w-4xl">
                    <h3 className="font-bold text-gray-800 mb-4 text-base">商品同步规则</h3>
                    <div className="flex items-start mb-6">
                        <span className="w-24 text-gray-500 text-sm mt-0.5">相同商品</span>
                        <div className="flex-1">
                            <label className="flex items-center text-[#00C06B] font-bold text-sm mb-2 cursor-pointer">
                                <input type="radio" checked readOnly className="mr-2 text-[#00C06B] focus:ring-[#00C06B]"/> 合并到门店商品
                            </label>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                                <p className="text-gray-500 mb-3">如果遇到重复商品，会覆盖门店重复商品，覆盖属性：</p>
                                <div className="flex flex-wrap gap-x-6 gap-y-3">
                                    {['基础价格', '库存', '起购限购', '商品排序', '分类排序', '售卖时间', '加料', '做法', '前台分类', '商品主图', '商品封面图', '商品详情图', '商品档口'].map(attr => (
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
                    </div>

                    <div className="flex items-center mb-8">
                        <span className="w-24 text-gray-500 text-sm">同步时间</span>
                        <div className="flex space-x-6 text-sm">
                            <label className="flex items-center text-gray-400 cursor-not-allowed"><input type="radio" disabled className="mr-2"/> 手动执行</label>
                            <label className="flex items-center text-[#00C06B] font-bold cursor-pointer"><input type="radio" defaultChecked name="syncTime" className="mr-2 text-[#00C06B] focus:ring-[#00C06B]"/> 立即执行</label>
                            <label className="flex items-center text-gray-600 cursor-pointer"><input type="radio" name="syncTime" className="mr-2"/> 定时执行</label>
                        </div>
                        <span className="ml-4 text-xs text-red-500">高峰期进行商品同步等待时间可能较久，请尽量在非高峰期进行（定时）下发</span>
                    </div>

                    <h3 className="font-bold text-gray-800 mb-4 text-base">选择门店</h3>
                    <div className="border border-gray-200 rounded-lg flex h-[400px] shrink-0 min-h-[400px]">
                        {/* Tree Left */}
                        <div className="w-64 border-r border-gray-200 flex flex-col shrink-0">
                            <div className="p-2 border-b border-gray-200 bg-gray-50">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2 top-2 text-gray-400"/>
                                    <input className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#00C06B]" placeholder="请输入门店名称/编码/ID"/>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-2 space-y-1">
                                <div className="flex items-center px-2 py-1.5 bg-[#00C06B]/10 text-[#00C06B] rounded cursor-pointer text-sm font-bold">
                                    <ChevronDown size={14} className="mr-1"/> 餐饮2.0
                                </div>
                                <div className="flex items-center px-2 py-1.5 text-gray-600 hover:bg-gray-50 rounded cursor-pointer text-sm ml-4">
                                    <ChevronRight size={14} className="mr-1"/> S茶
                                </div>
                                <div className="flex items-center px-2 py-1.5 text-gray-600 hover:bg-gray-50 rounded cursor-pointer text-sm ml-4">
                                    <ChevronRight size={14} className="mr-1"/> No1A
                                </div>
                            </div>
                        </div>
                        {/* List Right */}
                        <div className="flex-1 flex flex-col">
                            <div className="p-2 border-b border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
                                <span>餐饮2.0 <span className="mx-2">|</span> 共 5348 家门店</span>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white text-gray-500 sticky top-0 border-b border-gray-100">
                                        <tr>
                                            <th className="py-2 px-4 w-10"><input type="checkbox" className="rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"/></th>
                                            <th className="py-2 px-4">门店名称</th>
                                            <th className="py-2 px-4">门店ID</th>
                                            <th className="py-2 px-4">门店编码</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3].map(i => (
                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-2 px-4"><input type="checkbox" className="rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"/></td>
                                                <td className="py-2 px-4 text-gray-800">新建门店 {i}</td>
                                                <td className="py-2 px-4 text-gray-500">56563{i}</td>
                                                <td className="py-2 px-4 text-gray-500">-</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end items-center shrink-0">
                <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors mr-4">上一步</button>
                <button onClick={() => setStep(3)} className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B] transition-colors shadow-md">提交并同步</button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="flex-1 flex flex-col items-center justify-center bg-white h-full">
            <div className="w-16 h-16 bg-[#00C06B] rounded-full flex items-center justify-center text-white mb-6 shadow-lg animate-in zoom-in">
                <CheckCircle2 size={32}/>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">同步任务已提交</h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
                请在同步记录中查看任务执行进度。
            </p>
            <div className="flex space-x-4">
                <button onClick={() => setStep(0)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded font-bold hover:bg-gray-50 transition-colors">返回工具页</button>
                <button className="px-6 py-2 bg-[#00C06B] text-white rounded font-bold hover:bg-[#00A35B] transition-colors shadow-md">查看同步记录</button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#F5F6FA] font-sans overflow-hidden">
            {/* Header Tabs Mock */}
            <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 space-x-6 shrink-0 text-sm">
                <div className="text-[#00C06B] font-bold border-b-2 border-[#00C06B] h-full flex items-center px-2">商品工具</div>
                <div className="text-gray-600 hover:text-gray-800 cursor-pointer h-full flex items-center px-2">同步记录</div>
            </div>

            {/* Main Content Area */}
            {step === 0 ? (
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
                                    <div className={`font-bold whitespace-nowrap ${step === 1 ? 'text-[#00C06B]' : 'text-gray-800'}`}>选择商品及渠道</div>
                                </div>
                            </div>

                            <div className={`flex items-start mb-12 relative ${step === 2 ? 'opacity-100' : 'opacity-50'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-4 mt-0.5 z-10 shrink-0 ${step >= 2 ? 'bg-[#00C06B] text-white ring-4 ring-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {step > 2 ? <CheckCircle2 size={14}/> : '2'}
                                </div>
                                <div>
                                    <div className={`font-bold whitespace-nowrap ${step === 2 ? 'text-[#00C06B]' : 'text-gray-800'}`}>选择门店及规则设置</div>
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
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </div>
                </div>
            )}
        </div>
    );
};
