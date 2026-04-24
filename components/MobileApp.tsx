import React, { useState } from 'react';
import { 
  ScanLine, ChevronDown, CheckCircle2, 
  ShoppingBag, Plus, Layers, Database, Tag, Scale, Box, Edit3, Store, ChevronLeft,
  PieChart, ClipboardList, Wallet, Bell, Search, LayoutGrid, ArrowRight, FileText, ArrowDownCircle
} from 'lucide-react';
import { useProducts } from '../context';
import { MobileProductList } from './mobile/MobileProductList';
import { MobileCategoryManager } from './mobile/MobileCategoryManager';
import { MobileSpecManager } from './mobile/MobileSpecManager';
import { MobileMethodManager } from './mobile/MobileMethodManager';
import { MobileComboGroupManager } from './mobile/MobileComboGroupManager';
import { MobileProductCreator } from './mobile/MobileProductCreator';
import { MobileAddonManager } from './mobile/MobileAddonManager';
import { MobileAddonTypeManager } from './mobile/MobileAddonTypeManager';
import { MobileProductTools } from './mobile/MobileProductTools';
import { MobileBrandProductTools } from './mobile/MobileBrandProductTools';
import { MobileProductSorter } from './mobile/MobileProductSorter';
import { MobileCategorySorter } from './mobile/MobileCategorySorter';
import { MobileProductEditor } from './mobile/MobileProductEditor';
import { BatchOperationSelect, BatchConfigStep, BatchActionMenu, BatchActionType, BatchStep } from './mobile/MobileBatchComponents';

type Screen = 'dashboard' | 'product_tools' | 'brand_product_tools' | 'product_list' | 'product_create' | 'product_edit' | 'category_list' | 'addon_list' | 'addon_type_list' | 'method_list' | 'spec_list' | 'combo_list' | 'batch_operation_select' | 'batch_config' | 'product_sort' | 'category_sort';
type OrgType = 'brand' | 'region' | 'store';

interface OrgNode {
  id: string;
  name: string;
  type: OrgType;
  children?: OrgNode[];
}

const ORG_TREE: OrgNode[] = [
  {
    id: 'brand_root',
    name: '餐饮2.0 (品牌总部)',
    type: 'brand',
    children: [
      { 
        id: 'region_1', 
        name: '华东直营大区', 
        type: 'region', 
        children: [
           { id: 'store_1', name: '上海环球港旗舰店', type: 'store' },
           { id: 'store_2', name: '杭州西湖银泰店', type: 'store' },
           { id: 'store_3', name: '南京新街口店', type: 'store' }
        ]
      },
      { id: 'store_4', name: '北京三里屯测试店', type: 'store' } 
    ]
  }
];

export const MobileApp: React.FC = () => {
  const { products, activeBrandId, brandConfigs, categories, toggleShelfStatus, updateProduct } = useProducts();
  
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [activeOrg, setActiveOrg] = useState<OrgNode>(ORG_TREE[0].children![0].children![0]); 
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [returnScreen, setReturnScreen] = useState<Screen>('dashboard');
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Batch Mode State (Shared between List and Batch Screens)
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchActionType, setBatchActionType] = useState<BatchActionType>(null);
  const [batchStep, setBatchStep] = useState<BatchStep>('selection'); // used for menu flow inside list
  const [isAdvancedBatchFlow, setIsAdvancedBatchFlow] = useState(false); // used to determine if we are in the multi-step flow

  const currentConfig = brandConfigs[activeBrandId] || brandConfigs['b_1'];
  const isStockShared = currentConfig?.features.stock_shared ?? true;
  const isShelvesUnited = currentConfig?.features.shelves_unite ?? true;

  const handleSwitchOrg = (node: OrgNode) => {
      setActiveOrg(node);
      setShowOrgSelector(false);
      setCurrentScreen('dashboard'); 
      setIsBatchMode(false);
  };

  const handleBatchConfirm = (batchData: any) => {
      if (batchData.action === 'edit_attr') {
          Array.from(selectedIds).forEach(id => {
              const product = products.find(item => item.id === id);
              if (!product) return;

              const updates: any = {};

              if (batchData.fields?.includes('s_price')) {
                  const priceData = batchData.data?.s_price;
                  if (product.isMultiSpec && product.specs && product.specs.length > 0) {
                      const specPriceMap = priceData?.specPrices?.[id];
                      if (specPriceMap) {
                          const nextSpecs = product.specs.map((spec, index) => {
                              const nextPrice = Number(specPriceMap[index]);
                              return {
                                  ...spec,
                                  price: Number.isFinite(nextPrice) && specPriceMap[index] !== '' ? nextPrice : (spec.price ?? product.price),
                              };
                          });
                          const validPrices = nextSpecs
                              .map(spec => spec.price)
                              .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));

                          updates.specs = nextSpecs;
                          if (validPrices.length > 0) {
                              updates.price = Math.min(...validPrices);
                          }
                      }
                  } else {
                      const nextPriceValue = priceData?.specPrices?.[id]?.[0] ?? priceData?.uniformPrice;
                      const nextPrice = Number(nextPriceValue);
                      if (Number.isFinite(nextPrice)) {
                          updates.price = nextPrice;
                      }
                  }
              }

              if (batchData.fields?.includes('st_time')) {
                  const timeSaleData = batchData.data?.st_time;
                  if (timeSaleData?.mode === 'always') {
                      updates.timeSales = null;
                  } else if (timeSaleData?.config) {
                      updates.timeSales = timeSaleData.config;
                  }
              }

              batchData.fields?.forEach((field: string) => {
                  if (['s_price', 'st_time'].includes(field)) return;
                  if (batchData.data?.[field] !== undefined) {
                      if (field === 'p_cat' && Array.isArray(batchData.data[field])) {
                          updates.category = batchData.data[field].join('、');
                      } else {
                          updates[field] = batchData.data[field];
                      }
                  }
              });

              updateProduct(id, updates);
          });
          alert(`已批量修改 ${selectedIds.size} 个商品的属性`);
      } else {
          alert(`批量${batchData.action}操作模拟完成`);
      }
      setIsBatchMode(false);
      setSelectedIds(new Set());
      setBatchActionType(null);
      setIsAdvancedBatchFlow(false);
      setCurrentScreen('dashboard');
  };

  const navigateTo = (screen: Screen, from: Screen = 'dashboard') => {
      setReturnScreen(from);
      setCurrentScreen(screen);
  };

  const renderDashboard = () => (
    <div className="flex-1 bg-[#F5F7FA] overflow-y-auto pb-24 no-scrollbar">
       
       {/* Dashboard Header */}
       <div className="bg-white px-5 pt-4 pb-6 rounded-b-[32px] shadow-sm mb-5 relative z-10">
          <div className="flex items-center justify-between mb-6">
             <div onClick={() => setShowOrgSelector(true)} className="flex items-center space-x-2 bg-gray-50 pl-2 pr-3 py-1.5 rounded-full cursor-pointer active:bg-gray-100 transition-colors">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${activeOrg.type === 'brand' ? 'bg-orange-500' : 'bg-[#00C06B]'}`}>
                   {activeOrg.type === 'brand' ? '品' : '店'}
                </div>
                <span className="font-bold text-sm text-[#1F2129] max-w-[140px] truncate">{activeOrg.name}</span>
                <ChevronDown size={14} className="text-gray-400"/>
             </div>
             <div className="flex items-center space-x-3 text-gray-600">
                <button className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><Search size={18}/></button>
                <button className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><ScanLine size={18}/></button>
             </div>
          </div>

          <div className="bg-gradient-to-br from-[#1F2129] to-[#363B47] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden mb-2">
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <div className="text-xs text-gray-400 mb-1">{activeOrg.type === 'brand' ? '品牌今日总营收 (元)' : '今日预计营业额 (元)'}</div>
                      <div className="text-3xl font-black font-mono">{activeOrg.type === 'brand' ? '1,248,849.00' : '12,849.00'}</div>
                   </div>
                   <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm">{activeOrg.type === 'brand' ? '82 家门店' : '实时数据'}</div>
                </div>
                <div className="flex space-x-8">
                   <div>
                      <div className="text-[10px] text-gray-400 mb-0.5">{activeOrg.type === 'brand' ? '总订单量' : '订单量'}</div>
                      <div className="text-sm font-bold">{activeOrg.type === 'brand' ? '14,232 单' : '142 单'}</div>
                   </div>
                   <div>
                      <div className="text-[10px] text-gray-400 mb-0.5">{activeOrg.type === 'brand' ? '平均客单' : '客单价'}</div>
                      <div className="text-sm font-bold">¥ {activeOrg.type === 'brand' ? '87.2' : '90.4'}</div>
                   </div>
                </div>
             </div>
             <div className="absolute right-0 bottom-0 opacity-10"><PieChart size={120}/></div>
          </div>
       </div>

       {/* Common Applications */}
       <div className="px-5 space-y-5">
          <div>
             <h3 className="text-sm font-black text-[#1F2129] mb-3 px-1">常用应用</h3>
             {activeOrg.type === 'store' ? (
                 <div className="grid grid-cols-2 gap-3">
                    {/* Primary Tool: Product Management */}
                    <div 
                        onClick={() => navigateTo('product_tools')} 
                        className="bg-white p-4 rounded-2xl shadow-sm border border-transparent active:border-[#00C06B] active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden group"
                    >
                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-2">
                            <ShoppingBag size={20}/>
                        </div>
                        <div>
                            <div className="font-black text-sm text-[#1F2129] mb-0.5">商品管理</div>
                            <div className="text-[10px] text-gray-400">菜品/菜单/库存</div>
                        </div>
                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500"><ArrowRight size={16}/></div>
                    </div>

                    {/* New: Create Product */}
                    <MockToolCard 
                        icon={<Plus size={20}/>} 
                        label="新建商品" 
                        desc="快速录入新菜品" 
                        color="bg-blue-50 text-blue-500"
                        onClick={() => navigateTo('product_create')}
                    />

                    {/* New: Batch Edit */}
                    <MockToolCard 
                        icon={<Edit3 size={20}/>} 
                        label="批量修改" 
                        desc="改价/上下架/沽清" 
                        color="bg-indigo-50 text-indigo-500"
                        onClick={() => navigateTo('batch_operation_select')}
                    />

                    {/* Placeholder Tools */}
                    <MockToolCard icon={<ClipboardList size={20}/>} label="订单中心" desc="处理退单/售后" color="bg-cyan-50 text-cyan-600"/>
                    <MockToolCard icon={<Store size={20}/>} label="门店运营" desc="营业状态/打印" color="bg-green-50 text-green-500"/>
                    <MockToolCard icon={<PieChart size={20}/>} label="数据报表" desc="营收/商品分析" color="bg-purple-50 text-purple-500"/>
                 </div>
             ) : (
                 <div className="grid grid-cols-2 gap-3">
                    {/* Brand Primary Tool: Product Center */}
                    <div 
                        onClick={() => navigateTo('brand_product_tools')} 
                        className="bg-white p-4 rounded-2xl shadow-sm border border-transparent active:border-[#00C06B] active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden group"
                    >
                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-2">
                            <ShoppingBag size={20}/>
                        </div>
                        <div>
                            <div className="font-black text-sm text-[#1F2129] mb-0.5">商品中心</div>
                            <div className="text-[10px] text-gray-400">品牌库/下发/模板</div>
                        </div>
                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500"><ArrowRight size={16}/></div>
                    </div>

                    <MockToolCard icon={<FileText size={20}/>} label="品牌菜品库" desc="统一管理标准菜品" color="bg-blue-50 text-blue-500" onClick={() => navigateTo('product_list')} />
                    <MockToolCard icon={<ArrowDownCircle size={20}/>} label="一键下发" desc="快速同步至门店" color="bg-purple-50 text-purple-500" onClick={() => {}} />
                    <MockToolCard icon={<Layers size={20}/>} label="类目管理" desc="维护品牌标准分类" color="bg-green-50 text-green-500" onClick={() => navigateTo('category_list')} />
                 </div>
             )}
          </div>

          {/* Banner */}
          <div className="bg-gradient-to-r from-[#E0F7EF] to-[#F0FDF4] p-4 rounded-2xl flex items-center justify-between relative overflow-hidden">
             <div className="z-10">
                <div className="text-[#00C06B] font-black text-sm mb-1">新一代经营方式引领者</div>
                <div className="text-[#00C06B]/70 text-[10px] font-bold bg-white/60 px-2 py-1 rounded w-fit">助力商家数据化升级</div>
             </div>
             <div className="opacity-20"><Layers size={60} className="text-[#00C06B]"/></div>
          </div>
       </div>
    </div>
  );

  const renderContent = () => {
      switch (currentScreen) {
          case 'product_tools':
            return <MobileProductTools onBack={() => setCurrentScreen('dashboard')} onNavigate={(screen) => navigateTo(screen as Screen, 'product_tools')} />;
          case 'brand_product_tools':
            return <MobileBrandProductTools onBack={() => setCurrentScreen('dashboard')} onNavigate={(screen) => navigateTo(screen as Screen, 'brand_product_tools')} />;
          case 'product_list': 
            return (
                <>
                    <MobileProductList 
                        products={products}
                        isBatchMode={isBatchMode}
                        selectedIds={selectedIds}
                        batchActionType={batchActionType}
                        onToggleSelection={(id) => setSelectedIds(prev => { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; })}
                        onSelectAll={() => setSelectedIds(new Set(products.map(p => p.id)))}
                        onBack={() => { setCurrentScreen(returnScreen); setIsBatchMode(false); }}
                        onNavigate={(target) => {
                            if (target === 'category_list') setCurrentScreen('category_list');
                            if (target === 'create') setCurrentScreen('product_create');
                            if (target === 'batch_action') setBatchStep('menu'); // Open menu overlay
                            if (target === 'batch_entry') setCurrentScreen('batch_operation_select'); // Optimization: Direct jump to batch ops
                            if (target === 'batch_next') setCurrentScreen('batch_config'); // Optimization: Direct jump to config
                            if (target === 'product_sort') setCurrentScreen('product_sort'); // New sorting entry
                        }}
                        onBatchModeToggle={setIsBatchMode}
                        activeOrgType={activeOrg.type}
                        toggleShelfStatus={toggleShelfStatus}
                        onUpdateProduct={updateProduct}
                        onEditProduct={(p) => {
                            setEditingProduct(p);
                            navigateTo('product_edit', 'product_list');
                        }}
                        isStockShared={isStockShared}
                        isShelvesUnited={isShelvesUnited}
                    />
                    {isBatchMode && batchStep === 'menu' && (
                        <BatchActionMenu 
                            selectedCount={selectedIds.size}
                            onClose={() => setBatchStep('selection')} 
                            onSelectAction={(action) => {
                                setBatchActionType(action);
                                if (action === 'edit_attr') {
                                    setCurrentScreen('batch_config'); // Go to config step
                                    setIsAdvancedBatchFlow(true);
                                } else {
                                    setCurrentScreen('batch_config');
                                }
                                setBatchStep('selection'); // Reset local menu step
                            }}
                        />
                    )}
                </>
            );
          case 'product_create': 
            return <MobileProductCreator onBack={() => setCurrentScreen(returnScreen)} categories={categories} />;
          case 'product_edit':
            return <MobileProductEditor product={editingProduct} onBack={() => setCurrentScreen('product_list')} categories={categories} />;
          case 'category_list': 
            return <MobileCategoryManager onBack={() => setCurrentScreen(returnScreen)} />;
          case 'addon_list':
            return <MobileAddonManager onBack={() => setCurrentScreen(returnScreen)} onNavigate={(screen) => setCurrentScreen(screen as Screen)} isStockShared={isStockShared} isShelvesUnited={isShelvesUnited} />;
          case 'addon_type_list':
            return <MobileAddonTypeManager onBack={() => setCurrentScreen('addon_list')} />;
          case 'spec_list': 
            return <MobileSpecManager onBack={() => setCurrentScreen(returnScreen)} />;
          case 'method_list': 
            return <MobileMethodManager onBack={() => setCurrentScreen(returnScreen)} products={products} />;
          case 'combo_list': 
            return <MobileComboGroupManager onBack={() => setCurrentScreen(returnScreen)} />;
          case 'product_sort':
            return <MobileProductSorter products={products} onBack={() => setCurrentScreen('product_list')} onSave={() => setCurrentScreen('product_list')} onNavigate={(t) => setCurrentScreen(t as Screen)}/>;
          case 'category_sort':
            return <MobileCategorySorter onBack={() => setCurrentScreen('product_sort')} onSave={() => setCurrentScreen('product_sort')} />;
          case 'batch_operation_select': 
            return (
                <BatchOperationSelect 
                    onBack={() => setCurrentScreen(returnScreen)} 
                    onSelectAction={(action) => {
                        setBatchActionType(action);
                        setIsBatchMode(true);
                        setIsAdvancedBatchFlow(true);
                        setCurrentScreen('product_list');
                    }}
                />
            );
          case 'batch_config':
            return (
                <BatchConfigStep 
                    actionType={batchActionType}
                    selectedIds={selectedIds}
                    products={products}
                    onBack={() => setCurrentScreen('product_list')}
                    onConfirm={handleBatchConfirm}
                    isShelvesUnited={isShelvesUnited}
                />
            );
          default: 
            return renderDashboard();
      }
  };

  return (
    <div className="w-full h-full bg-[#F5F6FA] flex flex-col font-sans text-gray-800 relative">
      {/* Content Render */}
      {renderContent()}

      {/* Org Selector Modal */}
      {showOrgSelector && (<div className="absolute inset-0 z-[100] bg-[#F5F6FA] flex flex-col animate-in slide-in-from-bottom duration-300"><div className="h-[50px] flex items-center px-4 bg-white border-b border-gray-100"><button onClick={() => setShowOrgSelector(false)} className="mr-4"><ChevronLeft size={24}/></button><span className="font-bold text-base">切换身份角色</span></div><div className="flex-1 overflow-y-auto no-scrollbar p-4"><div className="mb-6"><div className="text-xs font-bold text-gray-400 mb-2 px-2">总部视角</div><div onClick={() => handleSwitchOrg(ORG_TREE[0])} className={`bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border-2 transition-all ${activeOrg.id === ORG_TREE[0].id ? 'border-[#00C06B]' : 'border-transparent'}`}><div className="flex items-center"><div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mr-3 font-bold">HQ</div><div><div className="font-black text-sm text-gray-800">{ORG_TREE[0].name}</div><div className="text-xs text-gray-400 mt-0.5">admin</div></div></div>{activeOrg.id === ORG_TREE[0].id && <CheckCircle2 className="text-[#00C06B]" size={20} fill="currentColor" color="white"/>}</div></div><div><div className="text-xs font-bold text-gray-400 mb-2 px-2">门店视角</div><div className="space-y-3">{ORG_TREE[0].children?.map(child => (<React.Fragment key={child.id}>{child.type === 'region' ? (child.children?.map(store => (<OrgCard key={store.id} node={store} activeId={activeOrg.id} onClick={() => handleSwitchOrg(store)} />))) : (<OrgCard key={child.id} node={child} activeId={activeOrg.id} onClick={() => handleSwitchOrg(child)} />)}</React.Fragment>))}</div></div></div></div>)}
    </div>
  );
};

// Mock Card for other tools
const MockToolCard = ({ icon, label, desc, color, onClick }: any) => (
    <div onClick={onClick} className="bg-white p-4 rounded-2xl shadow-sm border border-transparent active:border-gray-200 active:bg-gray-50 transition-all cursor-pointer flex flex-col justify-between h-28">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${color}`}>
            {icon}
        </div>
        <div>
            <div className="font-bold text-sm text-[#1F2129] mb-0.5">{label}</div>
            <div className="text-[10px] text-gray-400">{desc}</div>
        </div>
    </div>
);

const OrgCard: React.FC<{ node: OrgNode, activeId: string, onClick: () => void }> = ({ node, activeId, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-4 rounded-xl shadow-sm border-2 transition-all flex items-center justify-between ${activeId === node.id ? 'border-[#00C06B]' : 'border-transparent'}`}
    >
        <div>
            <div className="flex items-center mb-1">
                <div className="font-black text-sm text-gray-800 mr-2">{node.name}</div>
                <span className="text-[9px] border border-green-200 text-green-600 px-1 rounded">门店</span>
            </div>
            <div className="text-xs text-gray-400">系统店员 123123</div>
        </div>
        {activeId === node.id && <CheckCircle2 className="text-[#00C06B]" size={20} fill="currentColor" color="white"/>}
    </div>
);
