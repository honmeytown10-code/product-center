
import React, { useState, useMemo } from 'react';
import { Search, Plus, ChevronDown, MoreHorizontal, Filter, ListFilter, Database, X, Trash2, HelpCircle, Package, ChevronLeft, ChevronRight, Box, Utensils, CupSoda } from 'lucide-react';
import { useProducts } from '../../context';
import { TabItem } from './WebCommon';

// Mock counts for tabs
const TAB_COUNTS = {
  all: 11132,
  on_shelf: 11029,
  off_shelf: 103,
  draft: 0
};

export const WebProductList: React.FC<{ 
    onCreateClick: (type: 'standard' | 'combo') => void;
    onImportClick: () => void;
    onViewDetail?: (product: any) => void;
}> = ({ onCreateClick, onImportClick, onViewDetail }) => {
  const { products, categories } = useProducts();
  const [activeTab, setActiveTab] = useState<'all' | 'on_shelf' | 'off_shelf' | 'draft'>('on_shelf');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDropdown, setShowImportDropdown] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (activeTab === 'on_shelf' && p.status !== 'on_shelf') return false;
      if (activeTab === 'off_shelf' && p.status !== 'off_shelf') return false;
      if (activeTab === 'draft') return false; 
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.skuCode.includes(searchQuery)) {
        return false;
      }
      return true;
    });
  }, [products, activeTab, searchQuery]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
        {/* Tab Header */}
        <div className="h-[48px] border-b border-[#E8E8E8] flex items-center justify-between px-5 bg-white shrink-0">
        <div className="flex space-x-8 h-full">
            <TabItem label="全部" count={TAB_COUNTS.all} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
            <TabItem label="可售商品" count={TAB_COUNTS.on_shelf} active={activeTab === 'on_shelf'} onClick={() => setActiveTab('on_shelf')} />
            <TabItem label="停售商品" count={TAB_COUNTS.off_shelf} active={activeTab === 'off_shelf'} onClick={() => setActiveTab('off_shelf')} />
            <TabItem label="草稿" count={TAB_COUNTS.draft} active={activeTab === 'draft'} onClick={() => setActiveTab('draft')} />
        </div>
        <button className="flex items-center text-[#666] text-[13px] hover:text-[#333]">
            <Trash2 size={14} className="mr-1.5"/> 回收站
        </button>
        </div>

        {/* Filter Area */}
        <div className="p-4 bg-[#F5F6FA] border-b border-[#E8E8E8] space-y-4 shrink-0">
        <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center bg-white border border-[#E8E8E8] rounded-md px-3 h-[36px] w-[200px] hover:border-[#00C06B] transition-colors">
                <span className="text-gray-500 text-xs mr-2 whitespace-nowrap">商品ID:</span>
                <input className="flex-1 text-sm outline-none w-full" placeholder="请输入"/>
            </div>
            <div className="flex items-center bg-white border border-[#E8E8E8] rounded-md px-3 h-[36px] w-[200px] hover:border-[#00C06B] transition-colors">
                <span className="text-gray-500 text-xs mr-2 whitespace-nowrap">SKUID:</span>
                <input className="flex-1 text-sm outline-none w-full" placeholder="请输入"/>
            </div>
            <div className="flex items-center bg-white border border-[#E8E8E8] rounded-md px-3 h-[36px] w-[200px] hover:border-[#00C06B] transition-colors cursor-pointer group">
                <span className="text-gray-500 text-xs mr-2 whitespace-nowrap">前台分类:</span>
                <span className="flex-1 text-sm text-gray-400 group-hover:text-gray-600">请选择...</span>
                <ChevronDown size={14} className="text-gray-400 group-hover:text-[#00C06B]"/>
            </div>
            <div className="flex items-center bg-white border border-[#E8E8E8] rounded-md px-3 h-[36px] w-[240px] hover:border-[#00C06B] transition-colors">
                <span className="text-gray-500 text-xs mr-2 whitespace-nowrap">商品类型:</span>
                <select className="flex-1 text-sm outline-none bg-transparent cursor-pointer w-full">
                    <option value="standard">标准商品</option>
                    <option value="combo">套餐商品</option>
                </select>
                <X size={14} className="text-gray-400 ml-1 cursor-pointer hover:text-red-500"/>
            </div>
            
            <button className="bg-white border border-[#E8E8E8] text-[#666] px-4 h-[36px] rounded-md text-[13px] hover:bg-gray-50 flex items-center hover:text-[#00C06B] hover:border-[#00C06B] transition-all">
                <Plus size={14} className="mr-1"/> 添加筛选
            </button>
        </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <button className="bg-white border border-[#E8E8E8] text-[#333] px-4 py-1.5 rounded-md text-[13px] flex items-center hover:bg-gray-50 shadow-sm transition-all">
                    <Box size={14} className="mr-2 text-gray-400"/> 保存快捷筛选项
                </button>
            </div>
            <div className="flex items-center space-x-3">
                <button className="bg-white border border-[#E8E8E8] text-[#333] px-5 h-[36px] rounded-md text-[13px] hover:bg-gray-50 hover:text-[#00C06B] transition-colors">重置</button>
                <button className="bg-[#00C06B] text-white px-6 h-[36px] rounded-md text-[13px] font-bold hover:bg-[#00A35B] shadow-sm active:scale-95 transition-all">查询</button>
            </div>
        </div>
        </div>

        {/* Toolbar & Table Area */}
        <div className="flex-1 flex flex-col p-4 bg-white overflow-hidden min-h-0">
        <div className="flex justify-between items-center mb-4 shrink-0">
            <div className="relative group">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400 group-hover:text-[#00C06B] transition-colors"/>
                <input 
                    className="bg-white border border-[#E8E8E8] rounded-md pl-9 pr-4 h-[36px] w-[240px] text-[13px] focus:border-[#00C06B] focus:outline-none transition-colors" 
                    placeholder="搜索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center space-x-3">
                <button className="border border-[#E8E8E8] text-[#666] px-3 h-[36px] rounded-md text-[13px] hover:bg-gray-50 flex items-center hover:border-[#00C06B] hover:text-[#00C06B] transition-all"><ListFilter size={14} className="mr-1.5"/> 排序管理</button>
                
                {/* IMPORT / EXPORT DROPDOWN */}
                <div className="relative group">
                <button 
                    className="border border-[#E8E8E8] text-[#666] px-3 h-[36px] rounded-md text-[13px] hover:bg-gray-50 flex items-center hover:border-[#00C06B] hover:text-[#00C06B] transition-all"
                    onClick={() => setShowImportDropdown(!showImportDropdown)}
                >
                    导入/导出 <ChevronDown size={14} className="ml-1"/>
                </button>
                <div className="absolute top-[38px] left-0 w-36 bg-white border border-gray-100 shadow-xl rounded-lg overflow-hidden z-20 hidden group-hover:block">
                    <button onClick={onImportClick} className="w-full text-left px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#00C06B] font-bold">批量导入商品</button>
                    <button className="w-full text-left px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#00C06B] font-bold">导出选中商品</button>
                </div>
                </div>

                <button className="border border-[#E8E8E8] text-[#666] px-3 h-[36px] rounded-md text-[13px] hover:bg-gray-50 flex items-center hover:border-[#00C06B] hover:text-[#00C06B] transition-all">更多操作 <ChevronDown size={14} className="ml-1"/></button>
                
                {/* Direct Entry Points for Product Creation */}
                <button onClick={() => onCreateClick('standard')} className="bg-[#00C06B] text-white px-4 h-[36px] rounded-md text-[13px] font-bold hover:bg-[#00A35B] shadow-sm transition-all flex items-center active:scale-95">
                    <CupSoda size={16} className="mr-1.5"/> 新建标准商品
                </button>
                <button onClick={() => onCreateClick('combo')} className="bg-white border border-[#00C06B] text-[#00C06B] px-4 h-[36px] rounded-md text-[13px] font-bold hover:bg-[#E6F8F0] shadow-sm transition-all flex items-center active:scale-95">
                    <Utensils size={16} className="mr-1.5"/> 新建套餐商品
                </button>

            </div>
        </div>

        {/* Table */}
        <div className="flex-1 border border-[#E8E8E8] rounded-lg overflow-auto no-scrollbar relative">
            <table className="w-full text-left border-collapse">
                <thead className="bg-[#F7F8FA] sticky top-0 z-10">
                    <tr className="text-[12px] font-bold text-[#666] border-b border-[#E8E8E8] h-[48px]">
                    <th className="pl-4 w-[50px]"><input type="checkbox" className="rounded-sm border-gray-300"/></th>
                    <th className="px-4 min-w-[280px]">商品名称</th>
                    <th className="px-4 w-[100px]">商品类型 <Filter size={12} className="inline ml-1 text-[#00C06B]"/></th>
                    <th className="px-4 w-[120px]">前台分类</th>
                    <th className="px-4 w-[100px]">基础价格</th>
                    <th className="px-4 w-[100px]">售卖状态</th>
                    <th className="px-4 w-[100px]">数据来源</th>
                    <th className="px-4 w-[160px]">创建时间</th>
                    <th className="px-4 w-[100px]">备注</th>
                    <th className="px-4 w-[140px] sticky right-0 bg-[#F7F8FA] shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)] text-center">操作</th>
                    </tr>
                </thead>
                <tbody className="text-[13px] text-[#333]">
                    {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                        <tr key={p.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC] transition-colors group">
                            <td className="pl-4 py-3"><input type="checkbox" className="rounded-sm border-gray-300"/></td>
                            <td className="px-4 py-3">
                                <div className="flex items-center">
                                <img src={p.image} className="w-10 h-10 rounded-md object-cover border border-[#EEE] mr-3 group-hover:border-[#00C06B] transition-colors"/>
                                <div>
                                    <div className="font-bold mb-0.5 group-hover:text-[#00C06B] transition-colors cursor-pointer">{p.name}</div>
                                    <div className="text-[11px] text-[#999] font-mono">{p.id}</div>
                                </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-[#666]">
                                {p.type === 'standard' ? '标准商品' : '套餐商品'}
                            </td>
                            <td className="px-4 py-3 text-[#666]">
                                {categories.find(c => c.children?.some(sc => sc.id === p.category))?.children?.find(sc => sc.id === p.category)?.name || '未分类'}
                            </td>
                            <td className="px-4 py-3 font-medium font-mono">
                                {p.price} <span className="text-[10px] text-gray-400">元</span>
                            </td>
                            <td className="px-4 py-3">
                                {p.status === 'on_shelf' ? <span className="text-[#333]">可售</span> : <span className="text-[#999]">停售</span>}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center text-[#666]">品牌 <HelpCircle size={12} className="ml-1 text-[#00C06B] cursor-help"/></div>
                            </td>
                            <td className="px-4 py-3 text-[#666] text-[12px] font-mono">{p.createdTime}</td>
                            <td className="px-4 py-3 text-[#999]">-</td>
                            <td className="px-4 py-3 sticky right-0 bg-white group-hover:bg-[#F9FFFC] shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center justify-center space-x-3 text-[#00C06B]">
                                <button className="hover:underline font-medium hover:text-[#00A35B]">编辑</button>
                                <button className="hover:underline font-medium hover:text-[#00A35B]" onClick={() => onViewDetail?.(p)}>详情</button>
                                <div className="relative group/more">
                                    <MoreHorizontal size={16} className="text-[#999] hover:text-[#00C06B] cursor-pointer"/>
                                </div>
                                </div>
                            </td>
                        </tr>
                    ))
                    ) : (
                    <tr>
                        <td colSpan={10} className="py-20 text-center text-[#999] bg-gray-50/30">
                            <div className="flex flex-col items-center">
                                <Package size={40} className="mb-4 text-[#EEE]"/>
                                <span>暂无相关商品数据</span>
                            </div>
                        </td>
                    </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination Mock */}
        <div className="h-[48px] flex items-center justify-end px-4 border-t border-[#E8E8E8] text-[12px] text-[#666] shrink-0 bg-white">
            <span>共 {filteredProducts.length} 条</span>
            <div className="flex items-center ml-4 space-x-2">
                <button className="w-6 h-6 border rounded flex items-center justify-center bg-gray-50 text-gray-400 cursor-not-allowed"><ChevronLeft size={12}/></button>
                <button className="w-6 h-6 border rounded border-[#00C06B] text-[#00C06B] flex items-center justify-center bg-white font-bold">1</button>
                <button className="w-6 h-6 border rounded flex items-center justify-center bg-white hover:bg-gray-50 hover:border-[#00C06B] hover:text-[#00C06B] transition-colors">2</button>
                <button className="w-6 h-6 border rounded flex items-center justify-center bg-white hover:bg-gray-50 hover:border-[#00C06B] hover:text-[#00C06B] transition-colors">...</button>
                <button className="w-6 h-6 border rounded flex items-center justify-center bg-white hover:bg-gray-50 hover:border-[#00C06B] hover:text-[#00C06B] transition-colors">10</button>
                <button className="w-6 h-6 border rounded flex items-center justify-center bg-white hover:bg-gray-50 hover:border-[#00C06B] hover:text-[#00C06B] transition-colors"><ChevronRight size={12}/></button>
            </div>
            <select className="ml-4 border rounded px-1 py-0.5 bg-white outline-none hover:border-[#00C06B] transition-colors cursor-pointer">
                <option>20条/页</option>
                <option>50条/页</option>
            </select>
        </div>
        </div>
    </main>
  );
};
