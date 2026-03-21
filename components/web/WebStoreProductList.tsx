import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, ChevronDown, MoreHorizontal, FileUp, Settings, 
  Printer, Smartphone, Store, ShoppingBag, Coffee, ChevronLeft, 
  ChevronRight, CheckCircle2, X, Link, Layers,
  Eye, GripVertical, ArrowUpDown, RefreshCw, Upload, Download
} from 'lucide-react';
import { useProducts } from '../../context';

// Enhanced Mock Data
const MOCK_STORE_PRODUCTS = [
  {
    id: '974340414367182854',
    name: '奶茶2min',
    type: 'Standard',
    category: '叫号出餐，叫号排队',
    storeName: 'allen的测试店',
    channels: ['pos', 'mini_dine', 'mini_take'],
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=100',
    tags: ['新品'],
    status: 'on_shelf',
    sortIndex: 0
  },
  {
    id: '920793637960982529',
    name: '柠檬茶',
    type: 'Standard',
    category: '商城分类，新时沏测试...',
    storeName: 'allen的测试店',
    channels: ['mini_dine', 'mini_take'],
    image: 'https://images.unsplash.com/photo-1589301760576-47f4056966d5?auto=format&fit=crop&q=80&w=100',
    tags: [],
    status: 'on_shelf',
    sortIndex: 1
  },
  {
    id: '924336445413220352',
    name: '海盐芝士拿铁',
    type: 'Standard',
    category: '咖啡系列',
    storeName: 'allen的测试店',
    channels: ['pos', 'mini_dine', 'mini_take', 'meituan', 'taobao'],
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=100',
    tags: ['热销'],
    status: 'on_shelf',
    sortIndex: 1
  },
  {
    id: '934501236899667968',
    name: '大大大测试加料',
    type: 'Standard',
    category: '测试123',
    storeName: 'allen的测试店',
    channels: ['pos', 'meituan', 'eleme'],
    image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd71?auto=format&fit=crop&q=80&w=100',
    tags: [],
    status: 'on_shelf',
    sortIndex: 1
  },
  {
    id: '956890134637523945',
    name: '测试套餐0商品',
    type: 'Combo',
    category: '套餐商品',
    storeName: 'allen的测试店',
    channels: ['pos', 'taobao'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=100',
    tags: ['特价'],
    status: 'on_shelf',
    sortIndex: 2
  }
];

const MOCK_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: '1', name: '叫号出餐，叫号排队' },
  { id: '2', name: '商城分类，新时沏测试' },
  { id: '3', name: '咖啡系列' },
  { id: '4', name: '测试123' },
  { id: '5', name: '套餐商品' },
  { id: '6', name: '奶茶分类' },
  { id: '7', name: '洛希' },
  { id: '8', name: '0410分类' }
];

const CHANNEL_DEFS: Record<string, { label: string, icon: React.ReactNode, color: string }> = {
  'pos': { label: 'POS', icon: <Printer size={10}/>, color: 'bg-blue-100 text-blue-700' },
  'mini_dine': { label: '小程序-堂食', icon: <Coffee size={10}/>, color: 'bg-[#00C06B]/10 text-[#00C06B]' },
  'mini_take': { label: '小程序-外卖', icon: <Smartphone size={10}/>, color: 'bg-[#00C06B]/10 text-[#00C06B]' },
  'meituan': { label: '美团-外卖', icon: <Store size={10}/>, color: 'bg-yellow-100 text-yellow-700' },
  'meituan_tuangou': { label: '美团-团购', icon: <Store size={10}/>, color: 'bg-yellow-100 text-yellow-700' },
  'taobao': { label: '淘宝闪购', icon: <ShoppingBag size={10}/>, color: 'bg-orange-100 text-orange-700' },
  'eleme': { label: '饿了么', icon: <Store size={10}/>, color: 'bg-blue-100 text-blue-600' },
};

const DEFAULT_CHANNELS = [
  { id: 'mini_dine', label: '小程序-堂食' },
  { id: 'mini_take', label: '小程序-外卖' },
  { id: 'meituan', label: '美团-外卖' },
  { id: 'meituan_tuangou', label: '美团-团购' },
  { id: 'taobao', label: '淘宝闪购' },
  { id: 'pos', label: 'POS' },
];

export const WebStoreProductList: React.FC = () => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = brandConfigs[activeBrandId];
  const enableGrouping = config?.enableChannelGrouping ?? false;
  const groups = config?.channelGroups || [];

  const [activeTabId, setActiveTabId] = useState('all');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [notification, setNotification] = useState<{ message: string, type: 'info' | 'success', subMessage?: string } | null>(null);

  // Category Sorting States
  const [categories, setCategories] = useState(MOCK_CATEGORIES.filter(c => c.id !== 'all'));
  const [isSorting, setIsSorting] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Reset sorting state when tab changes
  useEffect(() => {
     setIsSorting(false);
  }, [activeTabId]);

  const tabs = useMemo(() => {
      return [{ id: 'all', label: '全部渠道' }, ...DEFAULT_CHANNELS];
  }, []);

  const filteredProducts = useMemo(() => {
      let filtered = MOCK_STORE_PRODUCTS;
      if (activeTabId !== 'all') {
          filtered = filtered.filter(p => p.channels.includes(activeTabId));
      }
      if (activeCategoryId !== 'all') {
          const categoryName = MOCK_CATEGORIES.find(c => c.id === activeCategoryId)?.name;
          // Soft match since mock data names might be truncated
          filtered = filtered.filter(p => p.category.includes(categoryName?.substring(0, 4) || ''));
      }
      return filtered;
  }, [activeTabId, activeCategoryId]);

  const handleAction = (product: any, action: 'shelf' | 'stock' | 'edit') => {
      if (action === 'edit') {
         setNotification({ type: 'info', message: '打开商品编辑页面' });
         return;
      }
      
      if (activeTabId === 'all') {
          setNotification({
              type: 'success',
              message: `${action === 'shelf' ? '上下架' : '沽清'}操作成功`,
              subMessage: '已应用至商品所有关联渠道'
          });
          return;
      }

      let affectedChannels = [activeTabId];
      let groupName = null;

      if (enableGrouping) {
          const group = groups.find(g => g.channels.includes(activeTabId));
          if (group) {
              affectedChannels = group.channels;
              groupName = group.name;
          }
      }

      const actionName = action === 'shelf' ? '上下架' : '沽清';
      
      if (groupName && affectedChannels.length > 1) {
          const channelNames = affectedChannels.map(c => CHANNEL_DEFS[c]?.label || c).join('、');
          setNotification({
              type: 'info',
              message: `已触发“${groupName}”分组联动${actionName}`,
              subMessage: `同步生效渠道：${channelNames}`
          });
      } else {
          setNotification({
              type: 'success',
              message: `${CHANNEL_DEFS[activeTabId]?.label || activeTabId} ${actionName}成功`,
          });
      }
  };

  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => setNotification(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/html', ''); 
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const newCategories = [...categories];
    const draggedItem = newCategories[draggedIdx];
    newCategories.splice(draggedIdx, 1);
    newCategories.splice(index, 0, draggedItem);
    
    setDraggedIdx(index);
    setCategories(newCategories);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const saveCategorySort = () => {
     setIsSorting(false);
     if (activeTabId === 'all') {
         setNotification({ 
            type: 'info', 
            message: '全局分类排序已保存',
            subMessage: '已同步至所有渠道' 
         });
     } else {
         setNotification({ 
            type: 'success', 
            message: `${CHANNEL_DEFS[activeTabId]?.label || '当前渠道'} 分类排序保存成功` 
         });
     }
  };

  return (
    <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4">
      
      {/* Toast Notification */}
      {notification && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
              <div className="bg-[#1F2129] text-white px-6 py-4 rounded-xl shadow-2xl flex items-start max-w-md border border-gray-700">
                  <div className={`mt-0.5 mr-3 ${notification.type === 'info' ? 'text-blue-400' : 'text-[#00C06B]'}`}>
                      {notification.type === 'info' ? <Link size={18}/> : <CheckCircle2 size={18}/>}
                  </div>
                  <div>
                      <div className="font-bold text-sm mb-1">{notification.message}</div>
                      {notification.subMessage && <div className="text-xs text-gray-400 leading-relaxed">{notification.subMessage}</div>}
                  </div>
                  <button onClick={() => setNotification(null)} className="ml-4 text-gray-500 hover:text-white"><X size={14}/></button>
              </div>
          </div>
      )}

      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header: Store Info */}
          <div className="px-5 py-4 border-b border-[#E8E8E8] flex justify-between items-center bg-white shrink-0">
              <div>
                 <h1 className="text-xl font-bold text-[#333] mb-1">allen的测试店</h1>
                 <div className="text-xs text-[#999]">ID: 1111778</div>
              </div>
          </div>

          {/* Filter Section */}
          <div className="p-5 border-b border-[#E8E8E8] bg-white space-y-4 shrink-0 z-20">
            <div className="flex flex-wrap gap-3 items-center">
              <FilterInput label="商品ID" placeholder="请输入" />
              <FilterInput label="SKUID" placeholder="请输入" />
              <FilterSelect label="商品类型" placeholder="请选择" />
              <FilterSelect label="售卖状态" placeholder="全部" canClear />
              <FilterSelect label="库存状态" placeholder="请选择" canClear />
              
              <button className="h-[34px] px-3 border border-dashed border-[#AAA] text-[#666] rounded hover:border-[#00C06B] hover:text-[#00C06B] transition-colors text-xs flex items-center bg-white">
                  <Plus size={14} className="mr-1"/> 添加筛选
              </button>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                  <button className="flex items-center text-xs text-[#666] border border-[#E8E8E8] px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
                      <FileUp size={14} className="mr-1.5"/> 保存快捷筛选选项
                  </button>
                  {enableGrouping && (
                      <div className="flex items-center px-3 py-1.5 bg-orange-50 text-orange-600 rounded text-xs font-bold border border-orange-100">
                          <Layers size={12} className="mr-1.5"/>
                          已开启渠道分组联动
                      </div>
                  )}
              </div>
              
              <div className="flex space-x-3">
                  <button className="px-6 py-1.5 border border-[#E8E8E8] text-[#333] rounded text-xs hover:bg-gray-50 transition-colors">重置</button>
                  <button className="px-6 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">查询</button>
              </div>
            </div>
          </div>

          {/* Toolbar & Tabs Section */}
          <div className="px-5 py-3 flex justify-between items-center border-b border-[#E8E8E8] bg-white shrink-0 z-10">
              <div className="flex items-center space-x-4">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-[#999]"/>
                    <input className="pl-9 pr-4 py-1.5 border border-[#E8E8E8] rounded w-48 text-sm focus:border-[#00C06B] focus:outline-none transition-colors" placeholder="搜索"/>
                </div>
                
                <div className="flex items-center space-x-1 overflow-x-auto max-w-[550px] no-scrollbar">
                    {tabs.map(tab => (
                      <button 
                          key={tab.id}
                          onClick={() => setActiveTabId(tab.id)}
                          className={`
                            relative px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap rounded-lg
                            ${activeTabId === tab.id ? 'text-[#00C06B] bg-[#00C06B]/5' : 'text-[#666] hover:text-[#333] hover:bg-gray-50'}
                          `}
                      >
                          {tab.label}
                          {activeTabId === tab.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#00C06B] rounded-full"></div>}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="flex items-center px-3 py-1.5 border border-[#E8E8E8] rounded text-xs text-[#333] hover:bg-gray-50 font-medium">
                    <ArrowUpDown size={14} className="mr-1.5 text-[#666]"/> 排序管理
                </button>
                <button className="flex items-center px-3 py-1.5 border border-[#E8E8E8] rounded text-xs text-[#333] hover:bg-gray-50 font-medium">
                    <Upload size={14} className="mr-1.5 text-[#666]"/> 导入
                </button>
                <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">
                    日志导出
                </button>
              </div>
          </div>

          {/* Bottom Content Area: Left Categories + Right Product List */}
          <div className="flex-1 flex overflow-hidden bg-white">
              
              {/* Left Sidebar - Categories (Now placed here) */}
              <div className="w-56 bg-white border-r border-[#E8E8E8] flex flex-col z-10 flex-shrink-0">
                <div className="p-4 border-b border-[#E8E8E8] flex justify-between items-center">
                    <span className="font-bold text-[#333]">前台分类</span>
                    {!isSorting && (
                      <button 
                          onClick={() => setIsSorting(true)}
                          className="text-xs flex items-center text-[#00C06B] hover:text-[#00A35B] transition-colors px-2 py-1 rounded border border-[#00C06B]"
                      >
                          <ArrowUpDown size={12} className="mr-1"/> 排序
                      </button>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
                    {isSorting && activeTabId === 'all' && (
                        <div className="mx-2 mb-2 px-3 py-2 bg-blue-50 text-blue-600 rounded text-[11px] leading-relaxed border border-blue-100 flex items-start">
                            <Link size={12} className="mr-1.5 mt-0.5 flex-shrink-0"/>
                            <span>全局排序模式：保存后将同步至所有渠道。</span>
                        </div>
                    )}

                    {!isSorting && (
                      <div 
                          className={`px-4 py-2.5 mx-2 rounded flex justify-between items-center cursor-pointer mb-1 ${activeCategoryId === 'all' ? 'bg-[#00C06B]/10 text-[#00C06B] font-bold' : 'text-[#666] hover:bg-gray-50'}`}
                          onClick={() => setActiveCategoryId('all')}
                      >
                          <div className="flex items-center">
                             <span className="w-1 h-1 rounded-full bg-[#00C06B] mr-2 opacity-0"></span>
                             <span className="text-sm">全部</span>
                          </div>
                      </div>
                    )}

                    {categories.map((cat, idx) => (
                      <div 
                          key={cat.id}
                          draggable={isSorting}
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          onClick={() => !isSorting && setActiveCategoryId(cat.id)}
                          className={`
                            px-4 py-2.5 mx-2 rounded flex justify-between items-center mb-1 transition-all duration-200
                            ${isSorting ? 'cursor-move bg-white border border-dashed border-[#CCC] hover:border-[#00C06B] shadow-sm' : 'cursor-pointer border border-transparent'}
                            ${!isSorting && activeCategoryId === cat.id ? 'bg-[#00C06B]/10 text-[#00C06B] font-bold' : (!isSorting ? 'text-[#666] hover:bg-gray-50' : 'text-[#333]')}
                            ${draggedIdx === idx ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
                          `}
                      >
                          <div className="flex items-center overflow-hidden">
                            {isSorting && <GripVertical size={14} className="text-[#999] mr-2 flex-shrink-0"/>}
                            <span className="text-sm truncate max-w-[120px]" title={cat.name}>{cat.name}</span>
                          </div>
                          {!isSorting && <Eye size={14} className="text-[#999] hover:text-[#333] flex-shrink-0"/>}
                      </div>
                    ))}
                </div>

                {isSorting && (
                    <div className="p-3 border-t border-[#E8E8E8] flex justify-between space-x-2 bg-[#F7F8FA]">
                      <button 
                          onClick={() => setIsSorting(false)}
                          className="flex-1 py-1.5 border border-[#E8E8E8] text-[#666] text-xs rounded hover:bg-white transition-colors bg-white"
                      >
                          取消
                      </button>
                      <button 
                          onClick={saveCategorySort}
                          className="flex-1 py-1.5 bg-[#00C06B] text-white text-xs rounded font-bold hover:bg-[#00A35B] transition-colors"
                      >
                          保存
                      </button>
                    </div>
                )}
              </div>

              {/* Right Content - Product List Table */}
              <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
                  {/* Table */}
                  <div className="flex-1 overflow-auto no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#F7F8FA] z-10 text-xs font-bold text-[#333]">
                        <tr>
                          <th className="w-12 py-3 pl-5 border-b border-[#E8E8E8]"><input type="checkbox" className="rounded border-gray-300"/></th>
                          <th className="py-3 px-4 border-b border-[#E8E8E8] w-16">排序</th>
                          <th className="py-3 px-4 border-b border-[#E8E8E8]">商品名称</th>
                          <th className="py-3 px-4 border-b border-[#E8E8E8] w-24">商品类型</th>
                          <th className="py-3 px-4 border-b border-[#E8E8E8]">前台分类</th>
                          <th className="py-3 px-4 border-b border-[#E8E8E8] w-[220px]">
                              {activeTabId === 'all' ? '投放渠道' : '渠道'}
                          </th>
                          <th className="py-3 px-4 border-b border-[#E8E8E8] w-48 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-[#333]">
                        {filteredProducts.map((product, index) => {
                          return (
                              <tr key={product.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC] transition-colors group">
                                <td className="py-4 pl-5"><input type="checkbox" className="rounded border-gray-300"/></td>
                                <td className="py-4 px-4 text-[#666]">{product.sortIndex}</td>
                                <td className="py-4 px-4">
                                    <div className="flex items-start">
                                      <div className="relative mr-3">
                                          <img src={product.image} className="w-10 h-10 rounded object-cover border border-[#EEE]" alt={product.name}/>
                                      </div>
                                      <div>
                                          <div className="flex items-center mb-1">
                                            <span className="font-bold text-[#333] mr-2">{product.name}</span>
                                          </div>
                                          <div className="flex gap-1 mb-1">
                                            {product.tags.map(tag => (
                                                <span key={tag} className="text-[10px] px-1 rounded border border-[#E8E8E8] text-[#999]">{tag}</span>
                                            ))}
                                          </div>
                                          <div className="text-[11px] text-[#999] font-mono">{product.id}</div>
                                      </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-[#666]">{product.type === 'Standard' ? '标准商品' : '套餐商品'}</td>
                                <td className="py-4 px-4 text-[#666] max-w-[180px] truncate" title={product.category}>{product.category}</td>
                                <td className="py-4 px-4">
                                    {activeTabId === 'all' ? (
                                        <div className="flex flex-wrap gap-1.5">
                                          {product.channels.map(ch => {
                                              const def = CHANNEL_DEFS[ch];
                                              if (!def) return <span key={ch} className="text-xs bg-gray-100 px-1 rounded">{ch}</span>;
                                              return (
                                                <div key={ch} className={`px-1.5 py-0.5 rounded-[4px] flex items-center text-[10px] font-bold ${def.color}`}>
                                                    {def.label}
                                                </div>
                                              )
                                          })}
                                        </div>
                                    ) : (
                                        <div className="text-[#333]">
                                            {CHANNEL_DEFS[activeTabId]?.label || activeTabId}
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <div className="flex items-center justify-center space-x-3 text-sm">
                                      <button 
                                          onClick={() => handleAction(product, 'shelf')}
                                          className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline"
                                      >
                                          {product.status === 'on_shelf' ? '下架' : '上架'}
                                      </button>
                                      <button 
                                          onClick={() => handleAction(product, 'edit')}
                                          className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline"
                                      >
                                          编辑
                                      </button>
                                      <button 
                                          onClick={() => handleAction(product, 'stock')}
                                          className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline"
                                      >
                                          沽清
                                      </button>
                                      <div className="h-3 w-px bg-gray-300"></div>
                                      <button className="text-[#999] hover:text-[#333]"><MoreHorizontal size={16}/></button>
                                    </div>
                                </td>
                              </tr>
                          );
                        })}
                        {filteredProducts.length === 0 && (
                           <tr>
                              <td colSpan={7} className="py-10 text-center text-[#999]">暂无商品数据</td>
                           </tr>
                        )}
                    </tbody>
                  </table>
              </div>

              {/* Pagination */}
              <div className="h-12 border-t border-[#E8E8E8] flex items-center justify-end px-5 text-xs text-[#666] bg-white shrink-0">
                  <span className="mr-4">共 {filteredProducts.length} 条</span>
                  <div className="flex items-center mr-4">
                    <span className="mr-2">20条/页</span>
                    <ChevronDown size={14}/>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B] disabled:opacity-50"><ChevronLeft size={12}/></button>
                    <button className="w-6 h-6 flex items-center justify-center bg-[#00C06B] text-white rounded font-bold">1</button>
                    <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">2</button>
                    <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">3</button>
                    <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">...</button>
                    <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]"><ChevronRight size={12}/></button>
                  </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const FilterInput = ({ label, placeholder }: { label: string, placeholder: string }) => (
   <div className="flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white hover:border-[#00C06B] transition-colors w-[200px]">
      <span className="text-xs text-[#666] mr-2 whitespace-nowrap">{label}:</span>
      <input className="flex-1 text-xs outline-none min-w-0" placeholder={placeholder}/>
   </div>
);

const FilterSelect = ({ label, placeholder, canClear }: { label: string, placeholder: string, canClear?: boolean }) => (
   <div className="flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white hover:border-[#00C06B] transition-colors cursor-pointer w-[200px] group">
      <span className="text-xs text-[#666] mr-2 whitespace-nowrap">{label}:</span>
      <span className={`flex-1 text-xs truncate ${placeholder === '全部商品' ? 'text-[#333]' : 'text-[#999] group-hover:text-[#666]'}`}>{placeholder}</span>
      {canClear && placeholder !== '请选择' ? <X size={12} className="text-[#999] hover:text-red-500"/> : <ChevronDown size={12} className="text-[#999] group-hover:text-[#00C06B]"/>}
   </div>
);
