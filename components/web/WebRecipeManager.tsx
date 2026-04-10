import React, { useState } from 'react';
import { 
  Search, Plus, CheckCircle2, ChevronLeft, Settings, 
  Trash2, X, RefreshCw, Download, Upload, Info, 
  MapPin, Store, AlertTriangle, Layers
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_RECIPE_LIST = [
  { id: '1240342344214237185', name: '0316标品-6', category: '分类123', total: 880, configured: 0, status: 'none', isChecked: true },
  { id: '1053321487375503361', name: '玫瑰香拿铁', category: '招牌冷饮,会员价商品', total: 66, configured: 0, status: 'none', isChecked: false, image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=50&h=50&fit=crop' },
  { id: '1223633431963361280', name: '0129标品-7', category: '全部渠道分类', total: 263, configured: 263, status: 'all', isChecked: false },
  { id: '1223633192309219329', name: '0129标品-2', category: '全部渠道分类', total: 120, configured: 120, status: 'all', isChecked: false },
  { id: '1223580519924977664', name: '测试新商品配方导入', category: '洛希,会员价商品', total: 60, configured: 0, status: 'none', isChecked: false },
];

const MOCK_PRACTICE_GROUPS = [
  { id: 'g1', name: 'KOI规格', type: '规格', values: ['大杯', '中杯'], isIncluded: true },
  { id: 'g2', name: 'KOI甜度', type: '做法', values: ['七分糖70%', '微糖25%', '不加糖0%', '全糖100%', '多糖120%'], isIncluded: true },
  { id: 'g3', name: 'KOI温度', type: '做法', values: ['正常冰', '少冰', '热', '温'], isIncluded: true },
  { id: 'g4', name: '包装方式', type: '做法', values: ['堂食', '打包', '外卖'], isIncluded: false }, // 默认不参与
];

const MOCK_POLICIES = [
  { id: 'p1', name: '华南区夏季减糖配方', storeCount: 15, productCount: 3, status: 'active', updateTime: '2026-03-20 14:30:00' },
  { id: 'p2', name: '测试门店特殊物料配方', storeCount: 1, productCount: 1, status: 'inactive', updateTime: '2026-03-19 10:15:00' },
];

// --- MAIN COMPONENT ---
export const WebRecipeManager: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  // Add top-level tab state for switching between Default Recipes and Policies
  const [activeTab, setActiveTab] = useState<'default' | 'policy'>('default');
  
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'policy_list' | 'policy_detail' | 'policy_products'>('list');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  // Synchronize view when top tab changes
  React.useEffect(() => {
    setCurrentView(activeTab === 'default' ? 'list' : 'policy_list');
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full w-full bg-[#F5F6FA] overflow-hidden">
      
      {/* Top Level Tabs for New Recipe System */}
      <div className="h-12 bg-white border-b border-[#E8E8E8] flex items-center px-4 space-x-6 shrink-0 z-20">
         <button 
            onClick={() => setActiveTab('default')}
            className={`h-full px-2 border-b-2 font-bold text-[14px] transition-colors ${activeTab === 'default' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-[#666] hover:text-[#333]'}`}
         >
            总部默认配方
         </button>
         <button 
            onClick={() => setActiveTab('policy')}
            className={`h-full px-2 border-b-2 font-bold text-[14px] transition-colors flex items-center ${activeTab === 'policy' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-[#666] hover:text-[#333]'}`}
         >
            门店配方策略 <span className="ml-1.5 px-1 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded leading-none">新</span>
         </button>
      </div>

      {currentView === 'list' && (
        <RecipeList 
          onViewDetail={(p) => { setSelectedProduct(p); setCurrentView('detail'); }} 
          onNavigate={onNavigate}
        />
      )}
      {currentView === 'detail' && (
        <RecipeDetail 
          product={selectedProduct} 
          onBack={() => setCurrentView('list')} 
          isOverrideMode={false}
        />
      )}
      {currentView === 'policy_list' && (
        <PolicyList 
          onViewPolicy={(p) => { setSelectedPolicy(p); setCurrentView('policy_detail'); }}
          onViewPolicyProducts={(p) => { setSelectedPolicy(p); setCurrentView('policy_products'); }}
        />
      )}
      {currentView === 'policy_detail' && (
        <PolicyDetail 
          policy={selectedPolicy} 
          onBack={() => setCurrentView('policy_list')}
        />
      )}
      {currentView === 'policy_products' && (
        <PolicyProductManager 
          policy={selectedPolicy} 
          onBack={() => setCurrentView('policy_list')}
          onConfigProduct={(p) => { setSelectedProduct(p); setCurrentView('detail'); }}
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

// 1. 默认配方列表页
const RecipeList = ({ onViewDetail, onNavigate }: { onViewDetail: (p: any) => void, onNavigate?: (path: string) => void }) => {
  return (
    <div className="flex-1 flex flex-col m-4 bg-white rounded-md shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-[#E8E8E8] flex justify-between items-center bg-white">
        <div className="flex space-x-3">
          <input className="px-3 py-1.5 border border-[#E8E8E8] rounded text-sm w-48 focus:border-[#00C06B] focus:outline-none" placeholder="商品名称: 请输入" />
          <input className="px-3 py-1.5 border border-[#E8E8E8] rounded text-sm w-48 focus:border-[#00C06B] focus:outline-none" placeholder="商品ID: 请输入" />
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1.5 border border-[#E8E8E8] rounded hover:bg-gray-50 text-[#666] flex items-center">
             <Settings size={14}/>
          </button>
          <button 
             onClick={() => onNavigate && onNavigate('addon_group')}
             className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-medium hover:bg-[#00A35B]"
          >
             加料分组
          </button>
          <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-medium hover:bg-[#00A35B]">甜度计算公式</button>
          <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-medium hover:bg-[#00A35B]">配料库</button>
          <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-medium hover:bg-[#00A35B]">基础设置</button>
          <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-medium hover:bg-[#00A35B]">添加商品</button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F7F8FA] text-sm text-[#333] sticky top-0">
            <tr>
              <th className="py-3 px-5 border-b font-bold w-[300px]">商品名称</th>
              <th className="py-3 px-5 border-b font-bold">商品分类</th>
              <th className="py-3 px-5 border-b font-bold text-center">全部组合</th>
              <th className="py-3 px-5 border-b font-bold text-center">配置状态</th>
              <th className="py-3 px-5 border-b font-bold text-right pr-8">操作</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#666]">
            {MOCK_RECIPE_LIST.map((item, idx) => (
              <tr key={idx} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC]">
                <td className="py-4 px-5">
                  <div className="flex items-center">
                    {item.isChecked ? (
                      <div className="w-8 h-8 rounded-full bg-[#00C06B] flex items-center justify-center text-white mr-3 shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                    ) : item.image ? (
                      <img src={item.image} className="w-8 h-8 rounded object-cover mr-3 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-500 mr-3 shrink-0">
                        <Layers size={14}/>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-[#333]">{item.name}</div>
                      <div className="text-xs text-[#999]">{item.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-5">{item.category}</td>
                <td className="py-4 px-5 text-center">{item.total}</td>
                <td className="py-4 px-5 text-center">
                  {item.status === 'none' ? <span className="text-[#999]">未配置</span> : <span className="text-[#333]">全部配置</span>}
                </td>
                <td className="py-4 px-5 text-right pr-8">
                  <button onClick={() => onViewDetail(item)} className="text-[#00C06B] hover:underline mr-4">查看详情</button>
                  <button className="text-[#00C06B] hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="h-12 border-t border-[#E8E8E8] flex items-center justify-end px-5 text-xs text-[#666]">
         <span className="mr-4">共 42 条</span>
         <span className="mr-4">20条/页</span>
         <div className="flex space-x-1">
           <button className="w-6 h-6 border rounded bg-[#00C06B] text-white">1</button>
           <button className="w-6 h-6 border rounded hover:border-[#00C06B]">2</button>
           <button className="w-6 h-6 border rounded hover:border-[#00C06B]">3</button>
         </div>
      </div>
    </div>
  );
};

// 2. 配方详情配置页 (含降维方案)
const RecipeDetail = ({ product, onBack, isOverrideMode }: { product: any, onBack: () => void, isOverrideMode: boolean }) => {
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [practiceGroups, setPracticeGroups] = useState(MOCK_PRACTICE_GROUPS);
  const [totalCombos, setTotalCombos] = useState(product?.total || 880);

  // Calculate combinations based on included groups
  const calculateCombos = (groups: any[]) => {
    let total = 1;
    groups.filter(g => g.isIncluded).forEach(g => {
       total *= g.values.length;
    });
    return total;
  };

  const handleSaveDimensions = (newGroups: any[]) => {
    setPracticeGroups(newGroups);
    setTotalCombos(calculateCombos(newGroups));
    setShowDimensionModal(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6FA]">
      {/* Header */}
      <div className="h-16 bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center">
           <button onClick={onBack} className="mr-4 text-[#666] hover:text-[#333]"><ChevronLeft size={20}/></button>
           <div className="w-10 h-10 rounded-full bg-[#00C06B] flex items-center justify-center text-white mr-3">
             <CheckCircle2 size={24} />
           </div>
           <div>
             <div className="flex items-center space-x-2">
               <h2 className="text-lg font-bold text-[#333]">{product?.name || '0316标品-6'}</h2>
               {isOverrideMode && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] rounded border border-orange-200">门店策略重写中</span>}
             </div>
             <div className="text-xs text-[#999]">商品ID: {product?.id || '1240342344214237185'}</div>
           </div>
        </div>

        <div className="flex items-center space-x-8">
           <div className="flex space-x-6 text-center">
              <div><div className="text-xs text-[#999] mb-1">规格组合</div><div className="text-lg font-bold text-[#00C06B]">{totalCombos}</div></div>
              <div><div className="text-xs text-[#999] mb-1">已配置</div><div className="text-lg font-bold text-[#00C06B]">0</div></div>
              <div><div className="text-xs text-[#999] mb-1">未配置</div><div className="text-lg font-bold text-red-500">{totalCombos}</div></div>
              <div><div className="text-xs text-[#999] mb-1">已失效</div><div className="text-lg font-bold text-[#999]">0</div></div>
           </div>
           <div className="flex space-x-2">
             <button className="px-3 py-1.5 border border-[#E8E8E8] rounded text-sm hover:bg-gray-50 bg-white">重新生成</button>
             <button className="px-3 py-1.5 border border-[#E8E8E8] rounded text-sm hover:bg-gray-50 bg-white">获取最新商品配置</button>
             <button className="px-3 py-1.5 border border-[#E8E8E8] rounded text-sm hover:bg-gray-50 bg-white">导入</button>
             <button className="px-3 py-1.5 border border-[#E8E8E8] rounded text-sm hover:bg-gray-50 bg-white">导出</button>
           </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 space-x-4">
        {/* Left Panel: Practice Groups */}
        <div className="w-[280px] bg-white rounded-md shadow-sm border border-[#E8E8E8] flex flex-col shrink-0">
           <div className="p-3 border-b border-[#E8E8E8] flex justify-between items-center bg-[#F9F9F9]">
              <span className="font-bold text-sm text-[#333]">组合维度</span>
              {!isOverrideMode && (
                <button 
                  onClick={() => setShowDimensionModal(true)}
                  className="text-xs text-[#00C06B] flex items-center hover:underline bg-[#00C06B]/10 px-2 py-1 rounded"
                >
                  <Settings size={12} className="mr-1"/> 参与配方维度
                </button>
              )}
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {practiceGroups.filter(g => g.isIncluded).map(group => (
                <div key={group.id}>
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-bold text-[#333] mr-2">{group.name}</span>
                    <span className="text-[10px] px-1 bg-[#00C06B]/10 text-[#00C06B] rounded">{group.type}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((v, i) => (
                      <div key={v} className={`px-3 py-1 border rounded text-xs cursor-pointer ${i === 0 ? 'border-[#00C06B] text-[#00C06B] bg-[#00C06B]/5' : 'border-[#E8E8E8] text-[#666] hover:border-[#00C06B]'}`}>
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Right Panel: Recipe Config */}
        <div className="flex-1 bg-white rounded-md shadow-sm border border-[#E8E8E8] flex flex-col overflow-hidden relative">
           {isOverrideMode && (
              <div className="absolute top-0 left-0 right-0 bg-blue-50 text-blue-600 text-xs px-4 py-2 border-b border-blue-100 flex items-center z-10">
                <Info size={14} className="mr-1.5"/> 当前处于策略重写模式。未重写的组合将自动穿透继承「总部默认配方」。
              </div>
           )}
           <div className={`p-4 border-b border-[#E8E8E8] flex justify-between items-center ${isOverrideMode ? 'mt-8' : ''}`}>
              <h3 className="font-bold text-[#333]">七分糖70% x 正常冰 x 2 x 中杯(11)</h3>
              <button className="px-3 py-1.5 border border-[#E8E8E8] rounded text-sm hover:bg-gray-50">新增加料分组配方</button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 bg-[#F9FAFB]">
              {/* Card 1 */}
              <div className="bg-white border border-[#E8E8E8] rounded-md p-4 mb-4 shadow-sm relative group">
                 {isOverrideMode && <div className="absolute -top-2.5 -right-2.5 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded shadow-sm">已重写</div>}
                 <div className="flex space-x-6 mb-4">
                    <div className="w-16 h-16 border border-dashed border-[#CCC] rounded flex items-center justify-center text-[#CCC] hover:border-[#00C06B] hover:text-[#00C06B] cursor-pointer bg-[#FAFAFA]">
                      <Plus size={20} />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-8">
                       <div>
                         <div className="text-xs text-[#666] mb-1">配方ID: 124105829894429184</div>
                         <div className="text-xs text-[#666]">配方编码: <span className="text-[#00C06B]">输入编码</span></div>
                       </div>
                       <div>
                         <div className="text-xs text-[#666] mb-1">优先级:</div>
                       </div>
                       <div>
                         <div className="text-xs text-[#666] mb-1">初始甜度: <input className="border border-[#E8E8E8] rounded px-2 py-0.5 w-24 text-xs ml-1" /></div>
                       </div>
                       <div>
                         <div className="text-xs text-[#666] mb-1">测算甜度:</div>
                       </div>
                    </div>
                 </div>
                 <div className="flex justify-between items-center pt-3 border-t border-[#F0F0F0]">
                    <div className="text-xs text-[#00C06B] cursor-pointer">展开 v</div>
                    <div className="flex space-x-2">
                       <button className="px-3 py-1 border border-[#E8E8E8] rounded text-xs text-[#666] hover:bg-gray-50">粘贴</button>
                       <button className="px-3 py-1 border border-[#E8E8E8] rounded text-xs text-[#666] hover:bg-gray-50">复制</button>
                       <button className="px-3 py-1 border border-[#E8E8E8] rounded text-xs text-[#666] hover:bg-gray-50">清空</button>
                    </div>
                 </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-[#E8E8E8] rounded-md p-4 shadow-sm">
                 <div className="font-bold text-sm text-[#333] mb-3">加料分组: BBB</div>
                 <div className="flex space-x-6 mb-4">
                    <div className="w-16 h-16 border border-dashed border-[#CCC] rounded flex items-center justify-center text-[#CCC] bg-[#FAFAFA]">
                      <Plus size={20} />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-8">
                       <div>
                         <div className="text-xs text-[#666] mb-1">配方ID: 1241058292919595009</div>
                         <div className="text-xs text-[#666]">配方编码: <span className="text-[#00C06B]">输入编码</span></div>
                       </div>
                       <div>
                         <div className="text-xs text-[#666] mb-1">优先级: 1</div>
                       </div>
                       <div>
                         <div className="text-xs text-[#666] mb-1">初始甜度: <input className="border border-[#E8E8E8] rounded px-2 py-0.5 w-24 text-xs ml-1" /></div>
                       </div>
                       <div>
                         <div className="text-xs text-[#666] mb-1">测算甜度:</div>
                       </div>
                    </div>
                 </div>
                 <div className="flex justify-between items-center pt-3 border-t border-[#F0F0F0]">
                    <div className="text-xs text-[#00C06B] cursor-pointer">展开 v</div>
                    <div className="flex space-x-2">
                       <button className="px-3 py-1 border border-[#E8E8E8] rounded text-xs text-[#666] hover:bg-gray-50">粘贴</button>
                       <button className="px-3 py-1 border border-[#E8E8E8] rounded text-xs text-[#666] hover:bg-gray-50">复制</button>
                       <button className="px-3 py-1 border border-[#E8E8E8] rounded text-xs text-[#666] hover:bg-gray-50">清空</button>
                       <button className="px-3 py-1 border border-red-200 text-red-500 rounded text-xs hover:bg-red-50">删除</button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Solution 1 Modal: Dimension Reduction */}
      {showDimensionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#E8E8E8] flex justify-between items-center bg-[#F9F9F9]">
              <h3 className="font-bold text-[16px] text-[#333]">设置参与配方的做法维度</h3>
              <button onClick={() => setShowDimensionModal(false)} className="text-[#999] hover:text-[#333]"><X size={18}/></button>
            </div>
            
            <div className="p-5">
               <div className="mb-4 text-sm text-[#666] leading-relaxed">
                 取消勾选不影响配方的做法组（如：包装方式），系统将把它们从配方排列组合中剔除，大幅减少配置工作量。
               </div>

               <div className="space-y-3 mb-6 border border-[#E8E8E8] rounded-md p-4 bg-[#FAFAFA]">
                  {practiceGroups.filter(g => g.type !== '规格').map(g => (
                    <label key={g.id} className="flex items-center space-x-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-[#00C06B] rounded border-gray-300 focus:ring-[#00C06B]"
                        checked={g.isIncluded}
                        onChange={(e) => {
                          const newGroups = practiceGroups.map(pg => pg.id === g.id ? { ...pg, isIncluded: e.target.checked } : pg);
                          setPracticeGroups(newGroups);
                        }}
                      />
                      <span className="text-sm text-[#333] group-hover:text-[#00C06B]">
                        {g.name} <span className="text-xs text-[#999]">({g.values.join(', ')})</span>
                      </span>
                    </label>
                  ))}
               </div>

               {/* Warning Box */}
               <div className="bg-orange-50 border border-orange-100 rounded-md p-3 flex items-start">
                  <AlertTriangle size={16} className="text-orange-500 mr-2 mt-0.5 shrink-0"/>
                  <div className="text-xs text-orange-700 leading-relaxed">
                    <strong>注意：</strong>修改参与配方的维度将导致组合重新生成。<br/>
                    历史配方组合数据将被直接清空并移除，不再进行任何继承，请谨慎操作！
                  </div>
               </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E8E8E8] flex justify-end space-x-3 bg-[#F9F9F9]">
              <button onClick={() => setShowDimensionModal(false)} className="px-4 py-1.5 border border-[#E8E8E8] rounded text-sm text-[#666] hover:bg-gray-50 bg-white">取消</button>
              <button onClick={() => handleSaveDimensions(practiceGroups)} className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-medium hover:bg-[#00A35B]">确认并重新生成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. 配方策略列表页 (Solution 2)
const PolicyList = ({ onViewPolicy, onViewPolicyProducts }: { onViewPolicy: (p: any) => void, onViewPolicyProducts: (p: any) => void }) => {
  const [policies, setPolicies] = useState(MOCK_POLICIES);

  const togglePolicyStatus = (id: string) => {
    setPolicies(policies.map(p => 
      p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
  };

  const deletePolicy = (id: string) => {
    if (window.confirm('确定要删除该配方策略吗？相关门店将恢复为默认配方。')) {
      setPolicies(policies.filter(p => p.id !== id));
    }
  };

  const handleCreatePolicy = () => {
    const newPolicy = {
      id: `p${Date.now()}`,
      name: '新建配方策略',
      storeCount: 0,
      productCount: 0,
      status: 'inactive',
      updateTime: new Date().toLocaleString()
    };
    setPolicies([newPolicy, ...policies]);
    onViewPolicy(newPolicy);
  };

  return (
    <div className="flex-1 flex flex-col m-4 bg-white rounded-md shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#E8E8E8] flex justify-between items-center">
         <div>
            <h2 className="text-[16px] font-bold text-[#333]">门店配方策略</h2>
            <p className="text-xs text-[#999] mt-1">创建区域或特殊门店的配方重写策略，未配置的商品将继承默认配方。</p>
         </div>
         <button onClick={handleCreatePolicy} className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-medium hover:bg-[#00A35B] flex items-center">
            <Plus size={16} className="mr-1"/> 新建配方策略
         </button>
      </div>

      <div className="flex-1 p-4 grid grid-cols-3 gap-4 auto-rows-max overflow-y-auto">
         {policies.map(policy => (
            <div key={policy.id} className="border border-[#E8E8E8] rounded-lg p-5 hover:border-[#00C06B] transition-colors bg-white shadow-sm flex flex-col">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                     <h3 className="font-bold text-[#333] text-[15px] mr-3">{policy.name}</h3>
                     {/* Switch Toggle */}
                     <div 
                        className={`relative inline-block w-8 h-4 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${policy.status === 'active' ? 'bg-[#00C06B]' : 'bg-gray-300'}`} 
                        onClick={() => togglePolicyStatus(policy.id)}
                        title={policy.status === 'active' ? '点击停用' : '点击启用'}
                     >
                        <span className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out ${policy.status === 'active' ? 'transform translate-x-4' : ''}`}></span>
                     </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] rounded border ${policy.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                     {policy.status === 'active' ? '生效中' : '已停用'}
                  </span>
               </div>
               
               <div className="flex-1 space-y-3 mb-5">
                  <div className="flex items-center text-sm text-[#666]">
                     <Store size={14} className="mr-2 text-[#999]"/> 
                     <span>适用门店: <strong className="text-[#333]">{policy.storeCount}</strong> 家</span>
                  </div>
                  <div className="flex items-center text-sm text-[#666]">
                     <Layers size={14} className="mr-2 text-[#999]"/> 
                     <span>差异化商品: <strong className="text-[#333]">{policy.productCount}</strong> 款</span>
                  </div>
               </div>

               <div className="flex justify-between items-center pt-4 border-t border-[#F5F5F5] mt-auto">
                  <span className="text-[11px] text-[#999] truncate mr-2" title={`更新于 ${policy.updateTime}`}>更新于 {policy.updateTime.split(' ')[0]}</span>
                  <div className="flex items-center space-x-2 shrink-0">
                     <button onClick={() => deletePolicy(policy.id)} className="text-[#999] hover:text-red-500 text-xs font-medium transition-colors">删除</button>
                     <div className="w-px h-3 bg-gray-200"></div>
                     <button onClick={() => onViewPolicy(policy)} className="text-[#00C06B] text-xs hover:underline font-medium">基础信息</button>
                     <div className="w-px h-3 bg-gray-200"></div>
                     <button onClick={() => onViewPolicyProducts(policy)} className="text-[#00C06B] text-xs hover:underline font-medium">配方商品</button>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

// 4. 配方策略详情页
const PolicyDetail = ({ policy, onBack }: { policy: any, onBack: () => void }) => {
  const [isActive, setIsActive] = useState(policy?.status === 'active');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6FA]">
       {/* Header */}
       <div className="h-[60px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
         <div className="flex items-center">
            <button onClick={onBack} className="mr-4 text-[#666] hover:text-[#333]"><ChevronLeft size={20}/></button>
            <h2 className="text-lg font-bold text-[#333] flex items-center">
               {policy?.name || '新建策略'} 
               <span className="ml-3 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded border border-blue-200">策略模式</span>
               {isActive ? (
                  <span className="ml-2 px-1.5 py-0.5 bg-green-50 text-green-600 text-[10px] rounded border border-green-200">已启用</span>
               ) : (
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-50 text-gray-500 text-[10px] rounded border border-gray-200">已停用</span>
               )}
            </h2>
         </div>
         <div className="flex items-center space-x-3">
            <label className="flex items-center cursor-pointer mr-2">
               <span className="text-sm text-[#666] mr-2">启用策略</span>
               <div className={`relative inline-block w-10 h-5 transition-colors duration-200 ease-in-out rounded-full ${isActive ? 'bg-[#00C06B]' : 'bg-gray-300'}`} onClick={() => setIsActive(!isActive)}>
                  <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${isActive ? 'transform translate-x-5' : ''}`}></span>
               </div>
            </label>
            <button className="px-4 py-1.5 border border-[#E8E8E8] text-[#333] rounded text-sm hover:bg-gray-50">删除</button>
            <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-bold hover:bg-[#00A35B]">保存配置</button>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 flex justify-center">
          <div className="w-[900px] space-y-6">
             
             {/* Base Info Card */}
             <div className="bg-white rounded-md shadow-sm border border-[#E8E8E8] p-5">
                <h3 className="font-bold text-[#333] mb-4 border-b border-[#F0F0F0] pb-2">基础信息</h3>
                <div className="space-y-4">
                   <div className="flex items-center">
                      <span className="w-20 text-sm text-[#666]">策略名称:</span>
                      <input className="flex-1 border border-[#E8E8E8] rounded px-3 py-1.5 text-sm focus:border-[#00C06B] focus:outline-none" defaultValue={policy?.name} placeholder="请输入策略名称" />
                   </div>
                   <div className="flex items-start">
                      <span className="w-20 text-sm text-[#666] mt-1.5">适用门店:</span>
                      <div className="flex-1">
                         <div className="border border-[#E8E8E8] rounded p-3 min-h-[80px] bg-[#FAFAFA] flex flex-wrap gap-2">
                            {policy?.storeCount > 0 ? (
                               <>
                                 <span className="px-2 py-1 bg-white border border-[#E8E8E8] rounded text-xs flex items-center">深圳海岸城店 <X size={12} className="ml-1 text-[#999] cursor-pointer hover:text-red-500"/></span>
                                 <span className="px-2 py-1 bg-white border border-[#E8E8E8] rounded text-xs flex items-center">广州正佳广场店 <X size={12} className="ml-1 text-[#999] cursor-pointer hover:text-red-500"/></span>
                               </>
                            ) : (
                               <span className="text-sm text-gray-400 mt-1">暂无绑定门店</span>
                            )}
                            <button className="px-2 py-1 bg-white border border-dashed border-[#00C06B] text-[#00C06B] rounded text-xs flex items-center hover:bg-[#00C06B]/5">
                               <Plus size={12} className="mr-1"/> 添加门店
                            </button>
                         </div>
                         <p className="text-[11px] text-[#999] mt-1">选中的门店在请求配方时，将优先使用此策略中配置的数据。</p>
                         
                         {/* Conflict Warning Message (Hidden by default, shown when conflict detected) */}
                         <div className="mt-2 hidden bg-red-50 border border-red-100 text-red-600 text-[11px] p-2 rounded items-start">
                            <AlertTriangle size={14} className="mr-1.5 mt-0.5 flex-shrink-0"/>
                            <div>
                               <strong>门店冲突：</strong> 发现“广州正佳广场店”已绑定在“华北特殊配方策略”中。同一门店同时只能生效一个策略，请先在其他策略中移除该门店。
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-start mt-4">
                      <span className="w-20 text-sm text-[#666] mt-1.5">备注:</span>
                      <textarea className="flex-1 border border-[#E8E8E8] rounded px-3 py-2 text-sm focus:border-[#00C06B] focus:outline-none min-h-[80px]" placeholder="选填，请输入备注信息" defaultValue={policy?.remark}></textarea>
                   </div>
                </div>
             </div>

          </div>
       </div>
    </div>
  );
};

// 5. 策略配方商品管理页
const PolicyProductManager = ({ policy, onBack, onConfigProduct }: { policy: any, onBack: () => void, onConfigProduct: (p: any) => void }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6FA]">
       <div className="h-[60px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
         <div className="flex items-center">
            <button onClick={onBack} className="mr-4 text-[#666] hover:text-[#333]"><ChevronLeft size={20}/></button>
            <h2 className="text-lg font-bold text-[#333] flex items-center">
               {policy?.name || '策略配方商品管理'} 
            </h2>
         </div>
         <button className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-sm font-bold hover:bg-[#00A35B] flex items-center">
            <Plus size={16} className="mr-1"/> 导入/添加商品
         </button>
       </div>
       <div className="flex-1 overflow-y-auto p-6 flex justify-center">
          <div className="w-[900px] space-y-6">
             
             {/* Overridden Products Card */}
             <div className="bg-white rounded-md shadow-sm border border-[#E8E8E8] p-5">
                <div className="flex justify-between items-center mb-4 border-b border-[#F0F0F0] pb-2">
                   <h3 className="font-bold text-[#333]">差异化配方商品 ({policy?.productCount || 0})</h3>
                </div>
                
                {policy?.productCount > 0 ? (
                  <table className="w-full text-left text-sm">
                     <thead className="bg-[#F9F9F9] text-[#666]">
                        <tr>
                           <th className="py-2 px-4 font-normal rounded-l">商品名称</th>
                           <th className="py-2 px-4 font-normal">配方覆盖状态</th>
                           <th className="py-2 px-4 font-normal text-right rounded-r">操作</th>
                        </tr>
                     </thead>
                     <tbody>
                        <tr className="border-b border-[#F5F5F5]">
                           <td className="py-3 px-4 font-medium text-[#333]">0316标品-6</td>
                           <td className="py-3 px-4 text-[#00C06B] font-medium flex items-center">
                              <CheckCircle2 size={14} className="mr-1.5"/> 已整体覆盖
                           </td>
                           <td className="py-3 px-4 text-right">
                              <button onClick={() => onConfigProduct(MOCK_RECIPE_LIST[0])} className="text-[#00C06B] hover:underline mr-3">去配置</button>
                              <button className="text-red-500 hover:underline">移除</button>
                           </td>
                        </tr>
                     </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                     <div className="text-gray-400 mb-2">当前策略暂未绑定任何商品</div>
                     <button className="text-[#00C06B] text-sm hover:underline">立即添加商品，生成配方快照</button>
                  </div>
                )}
                <p className="text-[11px] text-[#999] mt-4 bg-blue-50/50 border border-blue-100 p-3 rounded leading-relaxed text-blue-800">
                   💡 <strong>核心机制说明：</strong>将商品添加至此策略后，系统会为其创建一份“独立配方快照”。<br/>
                   该商品在此策略（及绑定的门店）下的所有组合配方，将<strong>完全脱离总部默认配方</strong>。您可以在此安全地进行修改，总部后续对该商品默认配方的任何调整，都不会影响此策略中的数据。
                </p>
             </div>
          </div>
       </div>
    </div>
  );
};
