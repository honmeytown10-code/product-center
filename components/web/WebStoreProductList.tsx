
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, ChevronDown, MoreHorizontal, FileUp, Settings, 
  Printer, Smartphone, Store, ShoppingBag, Coffee, ChevronLeft, 
  ChevronRight, AlertCircle, CheckCircle2, X, Link, Layers
} from 'lucide-react';
import { useProducts } from '../../context';

// Enhanced Mock Data with channel-specific statuses
// In a real app, this would be more complex nested objects
const MOCK_STORE_PRODUCTS = [
  {
    id: '1000422408674873344',
    name: '一杯酸奶茶展示',
    type: 'Standard',
    category: '经典系列',
    storeName: '阿富测试门店',
    channels: ['pos', 'mini_dine', 'mini_take'],
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=100',
    tags: ['加入社群'],
    status: 'on_shelf'
  },
  {
    id: '1000422408674873345',
    name: '招牌红烧肉套餐',
    type: 'Combo',
    category: '超值套餐',
    storeName: '创建时间好的',
    channels: ['pos', 'meituan', 'eleme'],
    image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd71?auto=format&fit=crop&q=80&w=100',
    tags: ['特价'],
    status: 'on_shelf'
  },
  {
    id: '1000422408674873346',
    name: '茉莉冰豆浆',
    type: 'Standard',
    category: '早安系列',
    storeName: '毛宁测试门店...',
    channels: ['mini_dine', 'mini_take'],
    image: 'https://images.unsplash.com/photo-1589301760576-47f4056966d5?auto=format&fit=crop&q=80&w=100',
    tags: ['新品'],
    status: 'on_shelf'
  },
  {
    id: '1000422408674873347',
    name: '香辣鸡腿堡',
    type: 'Standard',
    category: '汉堡/卷',
    storeName: '支付自助手测...',
    channels: ['pos', 'taobao'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=100',
    tags: [],
    status: 'on_shelf'
  },
  {
    id: '1000422408674873348',
    name: '大杯拿铁',
    type: 'Standard',
    category: '咖啡',
    storeName: 'zrr的门店1',
    channels: ['pos', 'mini_dine', 'mini_take', 'meituan', 'taobao'],
    image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=100',
    tags: [],
    status: 'on_shelf'
  }
];

const CHANNEL_DEFS: Record<string, { label: string, icon: React.ReactNode, color: string }> = {
  'pos': { label: 'POS', icon: <Printer size={10}/>, color: 'bg-blue-100 text-blue-700' },
  'mini_dine': { label: '小程序堂食', icon: <Coffee size={10}/>, color: 'bg-green-100 text-green-700' },
  'mini_take': { label: '小程序外卖', icon: <Smartphone size={10}/>, color: 'bg-green-100 text-green-700' },
  'meituan': { label: '美团外卖', icon: <Store size={10}/>, color: 'bg-yellow-100 text-yellow-700' },
  'taobao': { label: '淘宝闪购', icon: <ShoppingBag size={10}/>, color: 'bg-orange-100 text-orange-700' },
  'eleme': { label: '饿了么', icon: <Store size={10}/>, color: 'bg-blue-100 text-blue-600' },
};

const DEFAULT_CHANNELS = [
  { id: 'pos', label: 'POS' },
  { id: 'mini_dine', label: '小程序-堂食' },
  { id: 'mini_take', label: '小程序-外卖' },
  { id: 'meituan', label: '美团-外卖' },
  { id: 'taobao', label: '淘宝闪购' },
];

export const WebStoreProductList: React.FC = () => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = brandConfigs[activeBrandId];
  const enableGrouping = config?.enableChannelGrouping ?? false;
  const groups = config?.channelGroups || [];

  const [activeTabId, setActiveTabId] = useState('all');
  const [notification, setNotification] = useState<{ message: string, type: 'info' | 'success', subMessage?: string } | null>(null);

  // Requirement: Always display detailed channels + All, regardless of grouping config
  const tabs = useMemo(() => {
      return [{ id: 'all', label: '全部渠道' }, ...DEFAULT_CHANNELS];
  }, []);

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
      if (activeTabId === 'all') return MOCK_STORE_PRODUCTS;
      return MOCK_STORE_PRODUCTS.filter(p => p.channels.includes(activeTabId));
  }, [activeTabId]);

  const handleAction = (product: any, action: 'shelf' | 'stock') => {
      if (activeTabId === 'all') {
          // Global action
          setNotification({
              type: 'success',
              message: `${action === 'shelf' ? '上下架' : '沽清'}操作成功`,
              subMessage: '已应用至商品所有关联渠道'
          });
          return;
      }

      // Channel specific action
      // Check if grouping is enabled and if current channel belongs to a group
      let affectedChannels = [activeTabId];
      let groupName = null;

      if (enableGrouping) {
          const group = groups.find(g => g.channels.includes(activeTabId));
          if (group) {
              // Found a group, action syncs to all channels in this group
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

  // Auto-dismiss notification
  useEffect(() => {
      if (notification) {
          const timer = setTimeout(() => setNotification(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [notification]);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0 font-sans relative">
      
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

      {/* Filter Section */}
      <div className="p-5 border-b border-[#E8E8E8] bg-white space-y-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10">
        <div className="flex flex-wrap gap-3 items-center">
           <FilterInput label="商品ID" placeholder="请输入" />
           <FilterInput label="SKUID" placeholder="请输入" />
           <FilterSelect label="机构门店" placeholder="请选择" />
           <FilterSelect label="商品类型" placeholder="请选择" />
           <FilterSelect label="售卖状态" placeholder="全部商品" canClear />
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

      {/* Toolbar Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
         <div className="px-5 py-3 flex justify-between items-center border-b border-[#E8E8E8]">
            <div className="flex items-center space-x-4">
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-[#999]"/>
                  <input className="pl-9 pr-4 py-2 border border-[#E8E8E8] rounded w-64 text-sm focus:border-[#00C06B] focus:outline-none transition-colors" placeholder="搜索"/>
               </div>
               
               <div className="flex items-center space-x-1 overflow-x-auto max-w-[600px] no-scrollbar">
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
               <button className="p-2 border border-[#E8E8E8] rounded hover:bg-gray-50 text-[#666]"><Settings size={16}/></button>
               <button className="px-4 py-2 border border-[#E8E8E8] rounded text-xs text-[#333] hover:bg-gray-50 font-medium">导入</button>
               <button className="px-4 py-2 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">日志导出</button>
            </div>
         </div>

         {/* Table */}
         <div className="flex-1 overflow-auto bg-white no-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="sticky top-0 bg-[#F7F8FA] z-10 text-xs font-bold text-[#333]">
                  <tr>
                     <th className="w-12 py-3 pl-5 border-b border-[#E8E8E8]"><input type="checkbox" className="rounded border-gray-300"/></th>
                     <th className="py-3 px-4 border-b border-[#E8E8E8]">商品名称</th>
                     <th className="py-3 px-4 border-b border-[#E8E8E8] w-24">商品类型</th>
                     <th className="py-3 px-4 border-b border-[#E8E8E8]">前台分类</th>
                     <th className="py-3 px-4 border-b border-[#E8E8E8]">门店名称</th>
                     <th className="py-3 px-4 border-b border-[#E8E8E8] w-[220px]">
                        {activeTabId === 'all' ? '投放渠道' : '当前渠道状态'}
                     </th>
                     <th className="py-3 px-4 border-b border-[#E8E8E8] w-48 text-center">操作</th>
                  </tr>
               </thead>
               <tbody className="text-sm text-[#333]">
                  {filteredProducts.map((product, index) => {
                     return (
                        <tr key={index} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC] transition-colors group">
                           <td className="py-4 pl-5"><input type="checkbox" className="rounded border-gray-300"/></td>
                           <td className="py-4 px-4">
                              <div className="flex items-start">
                                 <div className="relative mr-3">
                                    <img src={product.image} className="w-10 h-10 rounded object-cover border border-[#EEE]"/>
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-[#EEE]">
                                       <div className="w-3 h-3 bg-[#00C06B] rounded-full"></div>
                                    </div>
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
                              <button className="text-[#00C06B] hover:underline">{product.storeName}</button>
                           </td>
                           <td className="py-4 px-4">
                              {activeTabId === 'all' ? (
                                  <div className="flex flex-wrap gap-1.5">
                                     {product.channels.map(ch => {
                                        const def = CHANNEL_DEFS[ch];
                                        if (!def) return <span key={ch} className="text-xs bg-gray-100 px-1 rounded">{ch}</span>;
                                        return (
                                           <div key={ch} className={`px-1.5 py-0.5 rounded-[4px] flex items-center text-[10px] font-bold ${def.color}`}>
                                              <span className="mr-1">{def.icon}</span>
                                              {def.label}
                                           </div>
                                        )
                                     })}
                                  </div>
                              ) : (
                                  <div className="flex items-center">
                                      <div className={`w-2 h-2 rounded-full mr-2 ${product.status === 'on_shelf' ? 'bg-[#00C06B]' : 'bg-gray-300'}`}></div>
                                      <span className="text-xs font-bold text-gray-600">{product.status === 'on_shelf' ? '已上架 / 售卖中' : '已下架'}</span>
                                  </div>
                              )}
                           </td>
                           <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center space-x-3 text-sm">
                                 <button 
                                    onClick={() => handleAction(product, 'shelf')}
                                    className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline"
                                 >
                                    上下架
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
  );
};

const FilterInput = ({ label, placeholder }: { label: string, placeholder: string }) => (
   <div className="flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white hover:border-[#00C06B] transition-colors w-[220px]">
      <span className="text-xs text-[#666] mr-2 whitespace-nowrap">{label}:</span>
      <input className="flex-1 text-xs outline-none min-w-0" placeholder={placeholder}/>
   </div>
);

const FilterSelect = ({ label, placeholder, canClear }: { label: string, placeholder: string, canClear?: boolean }) => (
   <div className="flex items-center border border-[#E8E8E8] rounded h-[34px] px-3 bg-white hover:border-[#00C06B] transition-colors cursor-pointer w-[220px] group">
      <span className="text-xs text-[#666] mr-2 whitespace-nowrap">{label}:</span>
      <span className={`flex-1 text-xs truncate ${placeholder === '全部商品' ? 'text-[#333]' : 'text-[#999] group-hover:text-[#666]'}`}>{placeholder}</span>
      {canClear && placeholder !== '请选择' ? <X size={12} className="text-[#999] hover:text-red-500"/> : <ChevronDown size={12} className="text-[#999] group-hover:text-[#00C06B]"/>}
   </div>
);
