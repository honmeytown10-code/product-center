import React, { useState } from 'react';
import { Search, Plus, Filter, ChevronRight, ChevronDown, Edit2, Info, ArrowRight, X, Minus, HelpCircle } from 'lucide-react';
import { SwitchRow } from '../mobile/MobileCommon';

interface DisplayCategory {
    id: string;
    name: string;
    alias: string;
    sort: number;
    hasSub: boolean;
    displayChannels: string[];
    saleChannels: string[];
    remark: string;
    productCount: number;
    parentId?: string;
    children?: DisplayCategory[];
}

const MOCK_DATA: DisplayCategory[] = [
    { id: '1', name: '测试', alias: '-', sort: 1, hasSub: true, displayChannels: ['mini', 'pos'], saleChannels: ['dine_in', 'takeout'], remark: 'hshsbd', productCount: 0, children: [
        { id: '1-1', name: '子测试1', alias: '-', sort: 1, hasSub: false, displayChannels: ['mini'], saleChannels: ['dine_in'], remark: '', productCount: 5, parentId: '1' }
    ] },
    { id: '2', name: '精品套餐', alias: '-', sort: 1, hasSub: false, displayChannels: ['mini', 'pos', 'kiosk'], saleChannels: ['dine_in', 'takeout'], remark: '', productCount: 12 },
    { id: '3', name: '蛋糕', alias: '-', sort: 2, hasSub: false, displayChannels: ['mini', 'pos'], saleChannels: ['dine_in', 'takeout'], remark: '', productCount: 8 },
    { id: '4', name: '0318分类', alias: '0318', sort: 2, hasSub: false, displayChannels: ['mini', 'pos', 'kiosk', 'douyin'], saleChannels: ['dine_in', 'takeout'], remark: '', productCount: 45 },
    { id: '5', name: '酒水', alias: '-', sort: 3, hasSub: false, displayChannels: ['mini', 'pos', 'kiosk'], saleChannels: ['dine_in'], remark: '', productCount: 20 },
];

export const WebCategoryListManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'backend' | 'frontend'>('frontend');
    const [categories, setCategories] = useState<DisplayCategory[]>(MOCK_DATA);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
    const [search, setSearch] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<DisplayCategory | null>(null);
    const [parentForNew, setParentForNew] = useState<DisplayCategory | null>(null);
    
    // Transfer confirm modal state
    const [transferConfirm, setTransferConfirm] = useState<{parent: DisplayCategory, newSubName: string} | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCreateSub = (parent: DisplayCategory) => {
        if (parent.productCount > 0 && (!parent.children || parent.children.length === 0)) {
            // Trigger intercept
            setParentForNew(parent);
            setEditingCat(null);
            setIsModalOpen(true);
        } else {
            // Normal create sub
            setParentForNew(parent);
            setEditingCat(null);
            setIsModalOpen(true);
        }
    };

    const handleSaveCategory = (data: any) => {
        if (parentForNew && parentForNew.productCount > 0 && (!parentForNew.children || parentForNew.children.length === 0)) {
            // Intercept and show transfer confirm
            setTransferConfirm({ parent: parentForNew, newSubName: data.name });
            setIsModalOpen(false);
            return;
        }

        // ... normal save logic (mocked)
        alert('保存成功');
        setIsModalOpen(false);
    };

    const handleConfirmTransfer = () => {
        if (!transferConfirm) return;
        alert(`已创建二级分类【${transferConfirm.newSubName}】，并将【${transferConfirm.parent.name}】下的 ${transferConfirm.parent.productCount} 个商品转移至该分类下。`);
        setTransferConfirm(null);
        // In real app, update local state here
    };

    const renderRow = (cat: DisplayCategory, level: number = 0) => {
        const isExpanded = expandedIds.has(cat.id);
        const hasChildren = cat.children && cat.children.length > 0;

        return (
            <React.Fragment key={cat.id}>
                <div className="flex items-center py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-[100px] pl-6 text-sm text-gray-600">{cat.sort}</div>
                    <div className="w-[200px] flex items-center">
                        <div style={{ width: level * 24 }} className="shrink-0"></div>
                        {hasChildren ? (
                            <button onClick={() => toggleExpand(cat.id)} className="mr-2 text-gray-400 hover:text-[#00C06B]">
                                {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                            </button>
                        ) : (
                            <div className="w-6 shrink-0"></div>
                        )}
                        <span className="text-sm font-bold text-gray-800 truncate">{cat.name}</span>
                        {cat.productCount > 0 && level === 0 && (!cat.children || cat.children.length === 0) && (
                            <span className="ml-2 text-[10px] bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded font-bold">含商品</span>
                        )}
                    </div>
                    <div className="w-[120px] text-sm text-gray-600">{cat.alias}</div>
                    <div className="w-[120px] text-sm text-gray-600">-</div>
                    <div className="w-[100px] text-sm text-gray-600">{cat.hasSub ? '是' : '否'}</div>
                    <div className="w-[120px] flex space-x-1">
                        {cat.displayChannels.map(c => <span key={c} className="w-5 h-5 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-[10px] font-bold">{c[0].toUpperCase()}</span>)}
                    </div>
                    <div className="w-[150px] text-sm text-gray-600 truncate">{cat.saleChannels.join(', ')}</div>
                    <div className="flex-1 text-sm text-gray-600 truncate">{cat.remark}</div>
                    <div className="w-[200px] flex items-center space-x-4 pr-6">
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
                <button onClick={() => setActiveTab('backend')} className={`text-base font-bold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'backend' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>后台分类</button>
                <button onClick={() => setActiveTab('frontend')} className={`text-base font-bold pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'frontend' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>前台分类</button>
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
                <div className="min-w-[1000px]">
                    {/* Header */}
                    <div className="flex items-center py-3 bg-gray-50 border-y border-gray-100 font-bold text-gray-500 text-xs">
                        <div className="w-[100px] pl-6">分类排序</div>
                        <div className="w-[200px]">分类名称</div>
                        <div className="w-[120px]">分类别名</div>
                        <div className="w-[120px]">分类图片</div>
                        <div className="w-[100px]">是否有子级</div>
                        <div className="w-[120px]">展示渠道</div>
                        <div className="w-[150px]">售卖渠道</div>
                        <div className="flex-1">备注</div>
                        <div className="w-[200px] pr-6">操作</div>
                    </div>
                    {/* Body */}
                    <div className="pb-20">
                        {categories.map(cat => renderRow(cat))}
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

            {/* Transfer Confirm Modal (The Intercept) */}
            {transferConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg w-[420px] flex flex-col overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[#333]">系统提示</h3>
                            <button onClick={() => setTransferConfirm(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <div className="px-8 py-6">
                            <div className="flex items-start mb-4">
                                <Info size={24} className="text-[#00C06B] mr-3 shrink-0 mt-0.5" />
                                <div className="text-[14px] text-[#333] leading-relaxed">
                                    当前 <span className="font-bold">【{transferConfirm.parent.name}】</span> 分类下已有 <span className="font-bold text-[#00C06B]">{transferConfirm.parent.productCount}</span> 个商品。创建二级分类后，这些商品将自动移入您即将创建的 <span className="font-bold">【{transferConfirm.newSubName}】</span> 分类中。
                                </div>
                            </div>
                            <p className="text-[13px] text-[#999] ml-9">您可以在创建完成后，再根据需要将商品移动到其他分类。</p>
                        </div>
                        <div className="px-6 py-4 flex justify-end space-x-3 mt-2">
                            <button onClick={() => setTransferConfirm(null)} className="px-5 py-2 rounded text-[14px] text-[#666] bg-white border border-gray-200 hover:bg-gray-50 transition-colors">取消</button>
                            <button onClick={handleConfirmTransfer} className="px-5 py-2 rounded text-[14px] text-white bg-[#00C06B] hover:bg-[#00A35B] transition-colors">
                                确认创建
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};