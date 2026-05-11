import React, { useMemo, useState } from 'react';
import { Search, Plus, Filter, ChevronRight, ChevronDown, Info, X, Minus, HelpCircle } from 'lucide-react';

interface DisplayCategory {
    id: string;
    name: string;
    code: string;
    sort: number;
    iconText: string;
    tag: string;
    requiredGroup: boolean;
    displaySettings: string[];
    saleScopes: string[];
    saleTypes: string[];
    remark: string;
    productCount: number;
    parentId?: string;
    children?: DisplayCategory[];
}

const MOCK_DATA: DisplayCategory[] = [
    { id: '1', name: '测试', code: '-', sort: 1, iconText: '测', tag: '推荐', requiredGroup: true, displaySettings: ['微信小程序', '企迈POS'], saleScopes: ['堂食', '外带'], saleTypes: ['到店'], remark: '用于点单页首屏曝光', productCount: 0, children: [
        { id: '1-1', name: '子测试1', code: 'child-test-1', sort: 1, iconText: '子', tag: '', requiredGroup: false, displaySettings: ['微信小程序'], saleScopes: ['堂食'], saleTypes: ['到店'], remark: '二级分类示例', productCount: 5, parentId: '1' }
    ] },
    { id: '2', name: '精品套餐', code: 'combo', sort: 1, iconText: '套', tag: '热门', requiredGroup: false, displaySettings: ['微信小程序', '企迈POS', '企迈H5'], saleScopes: ['堂食', '外带'], saleTypes: ['到店', '自提'], remark: '套餐类统一归档', productCount: 12 },
    { id: '3', name: '蛋糕', code: 'cake', sort: 2, iconText: '糕', tag: '新品', requiredGroup: false, displaySettings: ['微信小程序', '支付宝小程序'], saleScopes: ['堂食', '外带'], saleTypes: ['到店', '外送'], remark: '生日蛋糕单独展示', productCount: 8 },
    { id: '4', name: '0318分类', code: '0318', sort: 2, iconText: '03', tag: '活动', requiredGroup: false, displaySettings: ['微信小程序', '企迈POS', '企迈H5', '抖音小程序'], saleScopes: ['堂食', '外带', '外卖'], saleTypes: ['到店', '外送'], remark: '0318活动期间专用分类', productCount: 45 },
    { id: '5', name: '酒水', code: 'drink', sort: 3, iconText: '饮', tag: '', requiredGroup: false, displaySettings: ['微信小程序', '企迈POS'], saleScopes: ['堂食'], saleTypes: ['到店'], remark: '仅堂食场景展示', productCount: 20 },
];

export const WebCategoryListManager: React.FC = () => {
    const tableGridClassName = 'grid grid-cols-[56px_100px_110px_220px_140px_120px_130px_220px_180px_180px_220px_200px] items-center';
    const [activeTab, setActiveTab] = useState<'backend' | 'frontend'>('frontend');
    const [categories, setCategories] = useState<DisplayCategory[]>(MOCK_DATA);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
    const [search, setSearch] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<DisplayCategory | null>(null);
    const [parentForNew, setParentForNew] = useState<DisplayCategory | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCreateSub = (parent: DisplayCategory) => {
        // No intercept needed, allow direct creation
        setParentForNew(parent);
        setEditingCat(null);
        setIsModalOpen(true);
    };

    const handleSaveCategory = (data: any) => {
        // ... normal save logic (mocked)
        alert('保存成功');
        setIsModalOpen(false);
    };

    const filteredCategories = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return categories;

        const filterTree = (items: DisplayCategory[]): DisplayCategory[] => {
            return items.reduce<DisplayCategory[]>((acc, item) => {
                const matchedChildren = item.children ? filterTree(item.children) : undefined;
                const selfMatched = [
                    item.name,
                    item.code,
                    item.tag,
                    item.remark,
                    ...item.displaySettings,
                    ...item.saleScopes,
                    ...item.saleTypes,
                ].some(field => field.toLowerCase().includes(keyword));

                if (selfMatched || (matchedChildren && matchedChildren.length > 0)) {
                    acc.push({
                        ...item,
                        children: matchedChildren,
                    });
                }

                return acc;
            }, []);
        };

        return filterTree(categories);
    }, [categories, search]);

    const renderTagList = (items: string[], tone: 'green' | 'blue' | 'orange' = 'green') => {
        const toneClassMap = {
            green: 'bg-[#F0FDF4] text-[#00A35B]',
            blue: 'bg-[#EEF4FF] text-[#2563EB]',
            orange: 'bg-[#FFF7ED] text-[#EA580C]',
        };

        if (!items.length) {
            return <span className="text-sm text-gray-400">-</span>;
        }

        return (
            <div className="flex flex-wrap gap-2">
                {items.map(item => (
                    <span
                        key={item}
                        className={`inline-flex px-2 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${toneClassMap[tone]}`}
                    >
                        {item}
                    </span>
                ))}
            </div>
        );
    };

    const renderRow = (cat: DisplayCategory, level: number = 0) => {
        const isExpanded = expandedIds.has(cat.id);
        const hasChildren = cat.children && cat.children.length > 0;

        return (
            <React.Fragment key={cat.id}>
                <div className={`${tableGridClassName} group py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors`}>
                    <div className="pl-4 pr-2">
                        <div className="flex items-center">
                            <div style={{ width: level * 16 }} className="shrink-0"></div>
                            {hasChildren ? (
                                <button onClick={() => toggleExpand(cat.id)} className="shrink-0 text-gray-400 hover:text-[#00C06B]">
                                    {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                </button>
                            ) : (
                                <div className="w-4 shrink-0"></div>
                            )}
                        </div>
                    </div>
                    <div className="pl-6 pr-3 text-sm text-gray-600">{cat.sort}</div>
                    <div className="px-2">
                        <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#00C06B] font-black flex items-center justify-center text-sm">
                            {cat.iconText}
                        </div>
                    </div>
                    <div className="pr-3">
                        <div className="flex items-center min-w-0">
                            <span className="min-w-0 truncate text-sm font-bold text-gray-800">{cat.name}</span>
                            {cat.productCount > 0 && level === 0 && (!cat.children || cat.children.length === 0) && (
                                <span className="ml-2 shrink-0 text-[10px] bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded font-bold">含商品</span>
                            )}
                        </div>
                    </div>
                    <div className="pr-3 text-sm text-gray-600 truncate">{cat.code}</div>
                    <div className="pr-3">
                        {cat.tag ? (
                            <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-bold bg-[#FFF7ED] text-[#EA580C]">
                                {cat.tag}
                            </span>
                        ) : (
                            <span className="text-sm text-gray-400">-</span>
                        )}
                    </div>
                    <div className="pr-3 text-sm text-gray-600">{cat.requiredGroup ? '是' : '否'}</div>
                    <div className="pr-3">{renderTagList(cat.displaySettings, 'green')}</div>
                    <div className="pr-3">{renderTagList(cat.saleScopes, 'blue')}</div>
                    <div className="pr-3">{renderTagList(cat.saleTypes, 'orange')}</div>
                    <div className="pr-4 text-sm text-gray-600 break-all">{cat.remark || '-'}</div>
                    <div className="sticky right-0 z-20 flex h-full w-[200px] items-center space-x-4 border-l border-gray-100 bg-white px-4 group-hover:bg-gray-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.2)]">
                        {level === 0 && (
                            <button onClick={() => handleCreateSub(cat)} className="text-sm font-bold text-[#00C06B] hover:text-[#00A35B]">新建二级分类</button>
                        )}
                        <button onClick={() => { setEditingCat(cat); setParentForNew(null); setIsModalOpen(true); }} className="text-sm font-bold text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                    </div>
                </div>
                {isExpanded && cat.children?.map(sub => renderRow(sub, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="flex-1 bg-white m-4 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex space-x-8">
                <button onClick={() => setActiveTab('frontend')} className={`text-base font-bold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'frontend' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>前台分类</button>
                <button onClick={() => setActiveTab('backend')} className={`text-base font-bold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'backend' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>后台分类</button>
            </div>
            
            <div className="p-4 bg-orange-50/50 text-orange-600 text-xs flex items-center px-6">
                <Info size={14} className="mr-2"/> 原商品分类，商品前台展示分类，用于小程序端、企迈POS端等展示 <a href="#" className="ml-2 text-[#00C06B] hover:underline">查看帮助文档</a>
            </div>

            <div className="px-6 py-4 flex justify-between items-center">
                <div className="flex space-x-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input 
                            type="text" 
                            placeholder="搜索" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-[240px] focus:border-[#00C06B] outline-none transition-colors"
                        />
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 flex items-center hover:bg-gray-50 transition-colors">
                        <Filter size={16} className="mr-2 text-gray-400"/> 筛选
                    </button>
                </div>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 flex items-center hover:bg-gray-50 transition-colors">
                        排序管理
                    </button>
                    <button onClick={() => { setEditingCat(null); setParentForNew(null); setIsModalOpen(true); }} className="px-4 py-2 bg-[#00C06B] text-white rounded-lg text-sm font-bold hover:bg-[#00A35B] transition-colors">
                        添加分类
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="min-w-[1716px]">
                    {/* Header */}
                    <div className={`${tableGridClassName} py-3 bg-gray-50 border-y border-gray-100 font-bold text-gray-500 text-xs`}>
                        <div className="pl-4 pr-2"></div>
                        <div className="pl-6 pr-3">分类排序</div>
                        <div className="px-2">分类图标</div>
                        <div className="pr-3">分类名称</div>
                        <div className="pr-3">分类标识</div>
                        <div className="pr-3">分类标签</div>
                        <div className="pr-3">是否必选分组</div>
                        <div className="pr-3">展示设置</div>
                        <div className="pr-3">售卖桌道</div>
                        <div className="pr-3">售卖类型</div>
                        <div className="pr-4">备注</div>
                        <div className="sticky right-0 z-30 flex h-full w-[200px] items-center border-l border-gray-200 bg-gray-50 px-4 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.2)]">操作</div>
                    </div>
                    {/* Body */}
                    <div className="pb-20">
                        {filteredCategories.map(cat => renderRow(cat))}
                    </div>
                </div>
            </div>

            {/* Simple Create/Edit Modal Mock */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg w-[480px] flex flex-col overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[#333]">
                                {editingCat ? '编辑分类' : (parentForNew ? '新增二级分类' : '新增一级分类')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <div className="px-10 py-6 space-y-6">
                            {parentForNew && (
                                <div className="flex items-center text-[14px]">
                                    <span className="text-[#666] w-[120px] text-right pr-4 shrink-0">所属一级分类:</span>
                                    <div className="flex items-center text-[#333]">
                                        <span>{parentForNew.name}</span>
                                        <HelpCircle size={14} className="ml-1.5 text-gray-400 cursor-help" />
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center text-[14px]">
                                <span className="text-[#666] w-[120px] text-right pr-4 shrink-0"><span className="text-red-500 mr-1">*</span>{parentForNew ? '二级分类名称' : '分类名称'}:</span>
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        defaultValue={editingCat?.name || ''} 
                                        className="w-full border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#00C06B] text-[14px]" 
                                        id="catNameInput"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">0/10</span>
                                </div>
                            </div>
                            <div className="flex items-center text-[14px]">
                                <span className="text-[#666] w-[120px] text-right pr-4 shrink-0"><span className="text-red-500 mr-1">*</span>排序:</span>
                                <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                                    <button className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 border-r border-gray-200"><Minus size={14}/></button>
                                    <input type="text" defaultValue="1" className="w-16 h-8 text-center outline-none text-[14px]"/>
                                    <button className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 border-l border-gray-200"><Plus size={14}/></button>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 flex justify-end space-x-3 mt-4">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded text-[14px] text-[#666] bg-white border border-gray-200 hover:bg-gray-50 transition-colors">取消</button>
                            <button onClick={() => handleSaveCategory({ name: (document.getElementById('catNameInput') as HTMLInputElement).value })} className="px-5 py-2 rounded text-[14px] text-white bg-[#00C06B] hover:bg-[#00A35B] transition-colors">确定</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
