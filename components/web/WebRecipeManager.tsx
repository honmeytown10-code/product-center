import React, { useMemo, useState } from 'react';
import { 
  Search, Plus, CheckCircle2, ChevronLeft, Settings, 
  Trash2, X, RefreshCw, Download, Upload, Info, 
  MapPin, Store, AlertTriangle, Layers
} from 'lucide-react';
import { useProducts } from '../../context';

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

type RecipeBaseSettings = {
  printSeparatorMode: 'system' | 'custom';
  printSeparatorValue: string;
  enableRecipeCode: boolean;
  enableRecipeImage: boolean;
  enableAddonRecipe: boolean;
  addonMatchMode: 'strict' | 'group';
  enableNewRecipe: boolean;
  enableSweetness: boolean;
  sweetnessMode: 'custom' | 'formula';
};

const DEFAULT_RECIPE_BASE_SETTINGS: RecipeBaseSettings = {
  printSeparatorMode: 'system',
  printSeparatorValue: '#',
  enableRecipeCode: true,
  enableRecipeImage: true,
  enableAddonRecipe: true,
  addonMatchMode: 'group',
  enableNewRecipe: true,
  enableSweetness: true,
  sweetnessMode: 'formula',
};

// --- MAIN COMPONENT ---
export const WebRecipeManager: React.FC<{
  onNavigate?: (path: string) => void;
  newRecipeEnabled?: boolean;
  onNewRecipeEnabledChange?: (enabled: boolean) => void;
}> = ({ onNavigate, newRecipeEnabled = true, onNewRecipeEnabledChange }) => {
  const [showBaseSettings, setShowBaseSettings] = useState(false);
  const [recipeBaseSettings, setRecipeBaseSettings] = useState<RecipeBaseSettings>({
    ...DEFAULT_RECIPE_BASE_SETTINGS,
    enableNewRecipe: newRecipeEnabled,
  });
  const [draftRecipeBaseSettings, setDraftRecipeBaseSettings] = useState<RecipeBaseSettings>({
    ...DEFAULT_RECIPE_BASE_SETTINGS,
    enableNewRecipe: newRecipeEnabled,
  });
  
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'policy_list' | 'policy_detail' | 'policy_products'>('list');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  React.useEffect(() => {
    setRecipeBaseSettings(prev => ({ ...prev, enableNewRecipe: newRecipeEnabled }));
    setDraftRecipeBaseSettings(prev => ({ ...prev, enableNewRecipe: newRecipeEnabled }));
  }, [newRecipeEnabled]);

  const openBaseSettings = () => {
    setDraftRecipeBaseSettings(recipeBaseSettings);
    setShowBaseSettings(true);
  };

  const saveBaseSettings = () => {
    setRecipeBaseSettings(draftRecipeBaseSettings);
    onNewRecipeEnabledChange?.(draftRecipeBaseSettings.enableNewRecipe);
    setShowBaseSettings(false);
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-[#F5F6FA] overflow-hidden">

      {currentView === 'list' && (
        <RecipeList 
          onViewDetail={(p) => { setSelectedProduct(p); setCurrentView('detail'); }} 
          onNavigate={onNavigate}
          onOpenBaseSettings={openBaseSettings}
          onOpenPolicies={() => setCurrentView('policy_list')}
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
          onBack={() => setCurrentView('list')}
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

      {showBaseSettings && (
        <div className="absolute inset-0 z-30 flex justify-end bg-black/20">
          <div className="h-full w-[500px] bg-white shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-[#E8E8E8] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#333]">基础配置</h3>
              </div>
              <button onClick={() => setShowBaseSettings(false)} className="text-[#999] hover:text-[#333]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div>
                <div className="text-sm font-bold text-[#333] mb-3">打印分隔符</div>
                <div className="flex items-center gap-6 mb-3">
                  <label className="flex items-center gap-2 text-sm text-[#333] cursor-pointer">
                    <input
                      type="radio"
                      checked={draftRecipeBaseSettings.printSeparatorMode === 'system'}
                      onChange={() => setDraftRecipeBaseSettings(prev => ({ ...prev, printSeparatorMode: 'system' }))}
                      className="text-[#00C06B] focus:ring-[#00C06B]"
                    />
                    <span>系统默认</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#333] cursor-pointer">
                    <input
                      type="radio"
                      checked={draftRecipeBaseSettings.printSeparatorMode === 'custom'}
                      onChange={() => setDraftRecipeBaseSettings(prev => ({ ...prev, printSeparatorMode: 'custom' }))}
                      className="text-[#00C06B] focus:ring-[#00C06B]"
                    />
                    <span>自定义</span>
                  </label>
                </div>
                {draftRecipeBaseSettings.printSeparatorMode === 'custom' && (
                  <input
                    value={draftRecipeBaseSettings.printSeparatorValue}
                    onChange={e => setDraftRecipeBaseSettings(prev => ({ ...prev, printSeparatorValue: e.target.value.slice(0, 10) }))}
                    placeholder="请输入打印分隔符"
                    className="w-full rounded-md border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#00C06B] focus:outline-none"
                  />
                )}
              </div>

              <div className="space-y-5">
                <SettingSwitchRow
                  title="启用配方编码"
                  desc="开启后，可以针对商品组合设置配方编码，适用于部分场景和对接商品。"
                  checked={draftRecipeBaseSettings.enableRecipeCode}
                  onChange={(checked) => setDraftRecipeBaseSettings(prev => ({ ...prev, enableRecipeCode: checked }))}
                />
                <SettingSwitchRow
                  title="启用配方图片"
                  desc="开启后，可以针对商品组合设置配方图片，设置完成后可在打印单中引用。"
                  checked={draftRecipeBaseSettings.enableRecipeImage}
                  onChange={(checked) => setDraftRecipeBaseSettings(prev => ({ ...prev, enableRecipeImage: checked }))}
                />

                <div className="border-b border-[#F2F2F2] pb-5">
                  <SettingSwitchRow
                    title="加料参与配方"
                    desc="开启后，加料在成品商品组合时将参与商品配方生成，支持按加料完全匹配或按加料分组匹配生成商品组合。"
                    checked={draftRecipeBaseSettings.enableAddonRecipe}
                    onChange={(checked) => setDraftRecipeBaseSettings(prev => ({ ...prev, enableAddonRecipe: checked }))}
                    borderless
                  />
                  {draftRecipeBaseSettings.enableAddonRecipe && (
                    <div className="mt-3 pl-1">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-[#666] cursor-pointer">
                          <input
                            type="radio"
                            checked={draftRecipeBaseSettings.addonMatchMode === 'strict'}
                            onChange={() => setDraftRecipeBaseSettings(prev => ({ ...prev, addonMatchMode: 'strict' }))}
                            className="text-[#00C06B] focus:ring-[#00C06B]"
                          />
                          <span>按加料完全匹配</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#00A35B] cursor-pointer font-medium">
                          <input
                            type="radio"
                            checked={draftRecipeBaseSettings.addonMatchMode === 'group'}
                            onChange={() => setDraftRecipeBaseSettings(prev => ({ ...prev, addonMatchMode: 'group' }))}
                            className="text-[#00C06B] focus:ring-[#00C06B]"
                          />
                          <span>按加料分组匹配</span>
                        </label>
                      </div>
                      <div className="mt-2 text-xs leading-5 text-red-500">
                        可根据实际场景创建多个分组，用户下单加配料时按加料组匹配配方；默认仅加方式后，现有官方方式失效，请谨慎切换。
                      </div>
                    </div>
                  )}
                </div>

                <SettingSwitchRow
                  title="启用新版本配方"
                  desc="开启此配置后，所有商品配方打印跟调逻辑将默认为新版配方数据。关闭后走旧版配方数据，请务必检查商品配方满足使用条件后再进行启用。"
                  checked={draftRecipeBaseSettings.enableNewRecipe}
                  onChange={(checked) => setDraftRecipeBaseSettings(prev => ({ ...prev, enableNewRecipe: checked }))}
                />

                <div className="border-b border-[#F2F2F2] pb-5">
                  <SettingSwitchRow
                    title="启用甜度"
                    desc="开启此配置后，在生成配方时可以根据公式自动计算甜度。"
                    checked={draftRecipeBaseSettings.enableSweetness}
                    onChange={(checked) => setDraftRecipeBaseSettings(prev => ({ ...prev, enableSweetness: checked }))}
                    borderless
                  />
                  {draftRecipeBaseSettings.enableSweetness && (
                    <div className="mt-3 pl-1 flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm text-[#666] cursor-pointer">
                        <input
                          type="radio"
                          checked={draftRecipeBaseSettings.sweetnessMode === 'custom'}
                          onChange={() => setDraftRecipeBaseSettings(prev => ({ ...prev, sweetnessMode: 'custom' }))}
                          className="text-[#00C06B] focus:ring-[#00C06B]"
                        />
                        <span>自定义输入</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#00A35B] cursor-pointer font-medium">
                        <input
                          type="radio"
                          checked={draftRecipeBaseSettings.sweetnessMode === 'formula'}
                          onChange={() => setDraftRecipeBaseSettings(prev => ({ ...prev, sweetnessMode: 'formula' }))}
                          className="text-[#00C06B] focus:ring-[#00C06B]"
                        />
                        <span>公式计算</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E8E8E8] flex justify-end gap-3 bg-white">
              <button onClick={() => setShowBaseSettings(false)} className="px-5 py-2 border border-[#E8E8E8] rounded text-sm text-[#666] hover:bg-gray-50">
                取消
              </button>
              <button onClick={saveBaseSettings} className="px-5 py-2 bg-[#00C06B] text-white rounded text-sm font-medium hover:bg-[#00A35B]">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

// 1. 默认配方列表页
const RecipeList = ({ onViewDetail, onNavigate, onOpenBaseSettings, onOpenPolicies }: { onViewDetail: (p: any) => void, onNavigate?: (path: string) => void, onOpenBaseSettings?: () => void, onOpenPolicies?: () => void }) => {
  const { products: brandProducts } = useProducts();
  const [recipes, setRecipes] = useState(MOCK_RECIPE_LIST);
  const [nameKeyword, setNameKeyword] = useState('');
  const [idKeyword, setIdKeyword] = useState('');
  const [showMoreConfig, setShowMoreConfig] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<(typeof MOCK_RECIPE_LIST)[number] | null>(null);
  const [message, setMessage] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);

  const filteredRecipes = useMemo(() => recipes.filter(item => {
    const matchedName = !nameKeyword.trim() || item.name.toLowerCase().includes(nameKeyword.trim().toLowerCase());
    const matchedId = !idKeyword.trim() || item.id.includes(idKeyword.trim());
    return matchedName && matchedId;
  }), [idKeyword, nameKeyword, recipes]);

  const availableProducts = brandProducts.filter(product => !recipes.some(item => item.id === product.id));

  const addProducts = () => {
    const additions = brandProducts.filter(product => pendingProductIds.includes(product.id)).map(product => ({
      id: product.id,
      name: product.name,
      category: product.category || '未分类',
      total: 1,
      configured: 0,
      status: 'none',
      isChecked: false,
    }));
    setRecipes(prev => [...prev, ...additions]);
    setShowProductSelector(false);
    setMessage(`已添加 ${additions.length} 个商品，待配置配方`);
  };

  return (
    <div className="relative m-4 flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#E8E8E8] bg-white p-4">
        <div className="flex space-x-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input value={nameKeyword} onChange={event => setNameKeyword(event.target.value)} className="w-52 rounded-lg border border-[#E8E8E8] py-2 pl-9 pr-3 text-sm focus:border-[#00C06B] focus:outline-none" placeholder="搜索商品名称" />
          </div>
          <input value={idKeyword} onChange={event => setIdKeyword(event.target.value)} className="w-48 rounded-lg border border-[#E8E8E8] px-3 py-2 text-sm focus:border-[#00C06B] focus:outline-none" placeholder="商品ID" />
        </div>
        <div className="relative flex space-x-2">
          <button type="button" onClick={() => setShowBulkImport(true)} className="flex items-center rounded-lg border border-[#D9DEE7] bg-white px-4 py-2 text-sm font-medium text-[#4E5969] hover:border-[#8BD7AE] hover:text-[#008F4C]">
            <Upload size={15} className="mr-1.5" />导入配方
          </button>
          <button type="button" onClick={() => setShowBulkExport(true)} className="flex items-center rounded-lg border border-[#D9DEE7] bg-white px-4 py-2 text-sm font-medium text-[#4E5969] hover:border-[#8BD7AE] hover:text-[#008F4C]">
            <Download size={15} className="mr-1.5" />导出配方
          </button>
          <button onClick={onOpenPolicies} className="flex items-center rounded-lg border border-[#D9DEE7] bg-white px-4 py-2 text-sm font-medium text-[#4E5969] hover:border-[#8BD7AE] hover:text-[#008F4C]">
            门店配方策略
          </button>
          <button type="button" onClick={() => setShowMoreConfig(prev => !prev)} className="flex items-center gap-2 rounded-lg border border-[#D9DEE7] bg-white px-4 py-2 text-sm font-medium text-[#4E5969] hover:border-[#8BD7AE] hover:text-[#008F4C]">
            <Settings size={15} />更多配置
          </button>
          <button onClick={() => { setPendingProductIds([]); setShowProductSelector(true); }} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white hover:bg-[#00A35B]">
            <Plus size={16} className="mr-1 inline" />添加商品
          </button>
          {showMoreConfig && (
            <div className="absolute right-[108px] top-11 z-20 w-44 overflow-hidden rounded-lg border border-[#E4E7EC] bg-white py-1 shadow-lg">
              <button type="button" onClick={() => { setShowMoreConfig(false); onNavigate?.('addon_group'); }} className="block w-full px-4 py-2.5 text-left text-sm text-[#444] hover:bg-[#F5FBF8]">加料分组</button>
              <button type="button" onClick={() => { setShowMoreConfig(false); onNavigate?.('ingredient_library'); }} className="block w-full px-4 py-2.5 text-left text-sm text-[#444] hover:bg-[#F5FBF8]">配料库</button>
              <button type="button" onClick={() => { setShowMoreConfig(false); onOpenBaseSettings?.(); }} className="block w-full px-4 py-2.5 text-left text-sm text-[#444] hover:bg-[#F5FBF8]">基础设置</button>
              <button type="button" onClick={() => { setShowMoreConfig(false); onOpenBaseSettings?.(); }} className="block w-full px-4 py-2.5 text-left text-sm text-[#444] hover:bg-[#F5FBF8]">甜度计算公式</button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="flex items-center justify-between border-b border-[#CBEFDC] bg-[#F1FFF7] px-5 py-2 text-sm text-[#087A49]">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} className="rounded p-1 hover:bg-white/70" aria-label="关闭提示"><X size={14} /></button>
        </div>
      )}

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
            {filteredRecipes.map(item => (
              <tr key={item.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC]">
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
                  <span className={item.configured === item.total && item.total > 0 ? 'text-[#00A35B]' : item.configured > 0 ? 'text-[#D97706]' : 'text-[#999]'}>
                    {item.configured}/{item.total}
                  </span>
                </td>
                <td className="py-4 px-5 text-right pr-8">
                  <button onClick={() => onViewDetail(item)} className="text-[#00C06B] hover:underline mr-4">查看详情</button>
                  <button onClick={() => setDeleteTarget(item)} className="text-[#666] hover:text-[#D92D20]">删除</button>
                </td>
              </tr>
            ))}
            {filteredRecipes.length === 0 && (
              <tr><td colSpan={5} className="py-16 text-center text-sm text-[#999]">未找到符合条件的商品</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="h-12 border-t border-[#E8E8E8] flex items-center justify-end px-5 text-xs text-[#666]">
         <span className="mr-4">共 {filteredRecipes.length} 条</span>
         <span className="mr-4">20条/页</span>
         <div className="flex space-x-1">
           <button type="button" disabled aria-current="page" className="w-6 h-6 border rounded bg-[#00C06B] text-white">1</button>
         </div>
      </div>

      {showProductSelector && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 p-6">
          <div className="flex max-h-[70vh] w-[620px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4">
              <div><div className="text-base font-bold text-[#222]">添加配方商品</div><div className="mt-1 text-xs text-[#999]">加入后按商品规格与做法组合配置配方</div></div>
              <button type="button" onClick={() => setShowProductSelector(false)} className="rounded p-1.5 text-[#777] hover:bg-[#F5F5F5]" aria-label="关闭"><X size={18} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="overflow-hidden rounded-lg border border-[#E8E8E8]">
                {availableProducts.map(product => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-3 border-b border-[#F0F0F0] px-4 py-3 last:border-b-0 hover:bg-[#FAFBFC]">
                    <input type="checkbox" checked={pendingProductIds.includes(product.id)} onChange={event => setPendingProductIds(prev => event.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id))} className="h-4 w-4 accent-[#00C06B]" />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-[#333]">{product.name}</div><div className="mt-1 text-xs text-[#999]">商品ID：{product.id} · {product.category || '未分类'}</div></div>
                  </label>
                ))}
                {availableProducts.length === 0 && <div className="px-4 py-10 text-center text-sm text-[#999]">暂无可添加商品</div>}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#E8E8E8] px-6 py-4">
              <span className="text-sm text-[#999]">已选 {pendingProductIds.length} 个</span>
              <div className="flex gap-3"><button type="button" onClick={() => setShowProductSelector(false)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" disabled={pendingProductIds.length === 0} onClick={addProducts} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">确认添加</button></div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 p-6">
          <div className="w-[440px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start gap-3 px-6 py-5"><div className="rounded-full bg-[#FFF1F0] p-2 text-[#D92D20]"><AlertTriangle size={18} /></div><div><div className="font-bold text-[#222]">移除配方商品</div><div className="mt-2 text-sm leading-6 text-[#666]">将从配方管理中移除“{deleteTarget.name}”。已配置的 {deleteTarget.configured} 个组合不会在此原型中恢复。</div></div></div>
            <div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4"><button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={() => { setRecipes(prev => prev.filter(item => item.id !== deleteTarget.id)); setMessage(`已移除 ${deleteTarget.name}`); setDeleteTarget(null); }} className="rounded-lg bg-[#D92D20] px-4 py-2 text-sm font-medium text-white">确认移除</button></div>
          </div>
        </div>
      )}

      {showBulkImport && (
        <BulkRecipeImportDialog
          title="导入总部默认配方"
          subtitle="一次导入多个商品的配方，原单商品导入入口仍可继续使用"
          scopeText="当前品牌全部商品"
          impactText="仅新增或覆盖文件中存在的配方，未出现在文件中的配方不会删除。"
          onClose={() => setShowBulkImport(false)}
          onComplete={() => setMessage('总部默认配方批量导入完成：成功 1,238 条，跳过 4 条')}
        />
      )}

      {showBulkExport && (
        <BulkRecipeExportDialog
          title="导出总部默认配方"
          scopeText="当前品牌"
          totalCount={recipes.length}
          filteredCount={filteredRecipes.length}
          onClose={() => setShowBulkExport(false)}
          onComplete={() => setMessage('总部默认配方导出任务已创建，可在下载中心查看进度')}
        />
      )}
    </div>
  );
};

type BulkRecipeImportDialogProps = {
  title: string;
  subtitle: string;
  scopeText: string;
  impactText: string;
  onClose: () => void;
  onComplete: () => void;
};

const BulkRecipeImportDialog = ({ title, subtitle, scopeText, impactText, onClose, onComplete }: BulkRecipeImportDialogProps) => {
  const [fileName, setFileName] = useState('');
  const [stage, setStage] = useState<'select' | 'validating' | 'validated' | 'importing' | 'done'>('select');

  const downloadCsv = (fileName: string, rows: string[]) => {
    const blob = new Blob([`\uFEFF${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const validateFile = () => {
    setStage('validating');
    window.setTimeout(() => setStage('validated'), 650);
  };

  const importRecipes = () => {
    setStage('importing');
    window.setTimeout(() => {
      setStage('done');
      onComplete();
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex max-h-[82vh] w-[620px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E8E8E8] px-6 py-5">
          <div><h3 className="text-[17px] font-bold text-[#222]">{title}</h3><p className="mt-1 text-xs text-[#98A2B3]">{subtitle}</p></div>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#98A2B3] hover:bg-[#F5F5F5]" aria-label="关闭"><X size={19} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {stage === 'done' ? (
            <div className="py-7 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F9F1] text-[#00A35B]"><CheckCircle2 size={27} /></div>
              <div className="mt-4 text-base font-bold text-[#222]">批量导入完成</div>
              <div className="mt-2 text-sm text-[#667085]">成功导入 1,238 条配方，4 条异常数据已跳过</div>
              <button type="button" onClick={() => downloadCsv('配方导入错误明细.csv', ['行号,商品ID,错误原因', '25,1223580519924977664,规格组合不存在', '78,1053321487375503361,配料编码无效'])} className="mt-3 text-sm text-[#00A35B] hover:underline">下载错误明细</button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-md bg-[#F7F8FA] px-4 py-3 text-sm">
                <span className="text-[#667085]">导入范围：</span><span className="font-medium text-[#1D2129]">{scopeText}</span>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-[#333]">上传配方文件</span><button type="button" onClick={() => downloadCsv('商品配方批量导入模板.csv', ['商品ID,商品名称,规格组合,做法组合,加料组合,配方编码,配料编码,配料用量,单位', '示例ID,示例商品,大杯,少冰,不加料,RECIPE-001,MATERIAL-001,100,ml'])} className="text-sm text-[#00A35B] hover:underline">下载导入模板</button></div>
                <label className="flex cursor-pointer flex-col items-center rounded-md border border-dashed border-[#C9D0D9] bg-[#FAFBFC] px-4 py-7 text-center hover:border-[#00B460]">
                  <Upload size={24} className="text-[#00A35B]" />
                  <span className="mt-2 text-sm text-[#4E5969]">选择 Excel 或 CSV 文件</span>
                  <span className="mt-1 text-xs text-[#98A2B3]">单个文件不超过 10MB</span>
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={event => { setFileName(event.target.files?.[0]?.name || ''); setStage('select'); }} />
                </label>
                {fileName && <div className="mt-2 flex items-center justify-between rounded-md border border-[#CBEFDC] bg-[#F1FFF7] px-3 py-2 text-sm text-[#087A49]"><span className="truncate">{fileName}</span><button type="button" onClick={() => { setFileName(''); setStage('select'); }} aria-label="移除文件"><X size={15} /></button></div>}
              </div>

              <div className="rounded-md border border-[#F2D49B] bg-[#FFF9EB] px-4 py-3 text-xs leading-5 text-[#8A5B00]">{impactText} 系统将按商品ID及完整规格、做法、加料组合进行匹配，校验通过后才可确认导入。</div>

              {(stage === 'validating' || stage === 'importing') && (
                <div className="flex items-center justify-center gap-2 rounded-md border border-[#E8E8E8] py-6 text-sm text-[#667085]"><RefreshCw size={17} className="animate-spin text-[#00A35B]" />{stage === 'validating' ? '正在校验商品、组合和配料数据…' : '正在导入配方，请勿重复提交…'}</div>
              )}

              {stage === 'validated' && (
                <div className="overflow-hidden rounded-md border border-[#E8E8E8]">
                  <div className="border-b border-[#E8E8E8] bg-[#F7F8FA] px-4 py-3 text-sm font-medium text-[#333]">文件校验结果</div>
                  <div className="grid grid-cols-4 divide-x divide-[#E8E8E8] px-2 py-4 text-center"><div><div className="text-lg font-bold text-[#222]">6</div><div className="mt-1 text-xs text-[#98A2B3]">匹配商品</div></div><div><div className="text-lg font-bold text-[#222]">1,242</div><div className="mt-1 text-xs text-[#98A2B3]">配方明细</div></div><div><div className="text-lg font-bold text-[#00A35B]">1,238</div><div className="mt-1 text-xs text-[#98A2B3]">校验通过</div></div><div><div className="text-lg font-bold text-[#D92D20]">4</div><div className="mt-1 text-xs text-[#98A2B3]">异常跳过</div></div></div>
                  <div className="flex items-center justify-between border-t border-[#F0F0F0] px-4 py-3 text-xs text-[#667085]"><span>异常数据不会导入，不影响其他校验通过的数据</span><button type="button" onClick={() => downloadCsv('配方校验错误明细.csv', ['行号,商品ID,错误原因', '25,1223580519924977664,规格组合不存在', '78,1053321487375503361,配料编码无效'])} className="text-[#00A35B] hover:underline">下载错误明细</button></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4">
          {stage === 'done' ? <button type="button" onClick={onClose} className="rounded-md bg-[#00B460] px-5 py-2 text-sm font-medium text-white">完成</button> : <><button type="button" onClick={onClose} disabled={stage === 'validating' || stage === 'importing'} className="rounded-md border border-[#DDE2E8] px-5 py-2 text-sm text-[#4E5969] disabled:opacity-50">取消</button>{stage === 'validated' ? <button type="button" onClick={importRecipes} className="rounded-md bg-[#00B460] px-5 py-2 text-sm font-medium text-white">确认导入</button> : <button type="button" onClick={validateFile} disabled={!fileName || stage === 'validating' || stage === 'importing'} className="rounded-md bg-[#00B460] px-5 py-2 text-sm font-medium text-white disabled:opacity-40">开始校验</button>}</>}
        </div>
      </div>
    </div>
  );
};

type BulkRecipeExportDialogProps = {
  title: string;
  scopeText: string;
  totalCount: number;
  filteredCount: number;
  onClose: () => void;
  onComplete: () => void;
};

const BulkRecipeExportDialog = ({ title, scopeText, totalCount, filteredCount, onClose, onComplete }: BulkRecipeExportDialogProps) => {
  const [scope, setScope] = useState<'all' | 'filtered'>('all');
  const [stage, setStage] = useState<'select' | 'creating' | 'done'>('select');

  const createTask = () => {
    setStage('creating');
    window.setTimeout(() => {
      setStage('done');
      onComplete();
    }, 750);
  };

  const count = scope === 'all' ? totalCount : filteredCount;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-[540px] overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E8E8E8] px-6 py-5"><div><h3 className="text-[17px] font-bold text-[#222]">{title}</h3><p className="mt-1 text-xs text-[#98A2B3]">按商品导出规格、做法、加料组合及配料用量明细</p></div><button type="button" onClick={onClose} className="rounded p-1 text-[#98A2B3] hover:bg-[#F5F5F5]" aria-label="关闭"><X size={19} /></button></div>
        <div className="px-6 py-5">
          {stage === 'done' ? (
            <div className="py-5 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F9F1] text-[#00A35B]"><CheckCircle2 size={27} /></div><div className="mt-4 text-base font-bold text-[#222]">导出任务已创建</div><div className="mt-2 text-sm text-[#667085]">系统正在生成 {count} 个商品的配方文件，完成后可在下载中心获取</div></div>
          ) : stage === 'creating' ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#667085]"><RefreshCw size={18} className="animate-spin text-[#00A35B]" />正在创建导出任务…</div>
          ) : (
            <div>
              <div className="mb-3 text-sm font-medium text-[#333]">导出范围</div>
              <div className="space-y-2">
                <label className={`flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 ${scope === 'all' ? 'border-[#00B460] bg-[#F1FFF7]' : 'border-[#E5E7EB]'}`}><span><span className="block text-sm font-medium text-[#333]">全部配方商品</span><span className="mt-1 block text-xs text-[#98A2B3]">导出{scopeText}下全部 {totalCount} 个商品</span></span><input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} className="h-4 w-4 accent-[#00B460]" /></label>
                <label className={`flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 ${scope === 'filtered' ? 'border-[#00B460] bg-[#F1FFF7]' : 'border-[#E5E7EB]'}`}><span><span className="block text-sm font-medium text-[#333]">当前筛选结果</span><span className="mt-1 block text-xs text-[#98A2B3]">按当前搜索条件导出 {filteredCount} 个商品</span></span><input type="radio" checked={scope === 'filtered'} onChange={() => setScope('filtered')} className="h-4 w-4 accent-[#00B460]" /></label>
              </div>
              <div className="mt-4 rounded-md bg-[#F7F8FA] px-4 py-3 text-xs leading-5 text-[#667085]">数据量较大时将通过异步任务生成文件，关闭弹窗不会中断任务。</div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4">{stage === 'done' ? <button type="button" onClick={onClose} className="rounded-md bg-[#00B460] px-5 py-2 text-sm font-medium text-white">完成</button> : <><button type="button" onClick={onClose} disabled={stage === 'creating'} className="rounded-md border border-[#DDE2E8] px-5 py-2 text-sm text-[#4E5969] disabled:opacity-50">取消</button><button type="button" onClick={createTask} disabled={stage === 'creating'} className="rounded-md bg-[#00B460] px-5 py-2 text-sm font-medium text-white disabled:opacity-50">创建导出任务</button></>}</div>
      </div>
    </div>
  );
};

const SettingSwitchRow = ({
  title,
  desc,
  checked,
  onChange,
  borderless = false,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  borderless?: boolean;
}) => (
  <div className={borderless ? '' : 'border-b border-[#F2F2F2] pb-5'}>
    <div className="flex items-start justify-between gap-4">
      <div className="pr-6">
        <div className="text-sm font-bold text-[#333]">{title}</div>
        <div className="mt-1 text-xs leading-5 text-[#999]">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#00C06B]' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  </div>
);

// 2. 配方详情配置页 (含降维方案)
type RecipeIngredientRow = { id: string; name: string; amount: string; unit: string };
type RecipeCardState = {
  id: string;
  title: string;
  recipeId: string;
  code: string;
  priority: string;
  initialSweetness: string;
  calculatedSweetness: string;
  imageName: string;
  expanded: boolean;
  ingredients: RecipeIngredientRow[];
};

const INITIAL_RECIPE_CARDS: RecipeCardState[] = [
  {
    id: 'recipe-base', title: '基础配方', recipeId: '124105829894429184', code: '', priority: '',
    initialSweetness: '', calculatedSweetness: '--', imageName: '', expanded: true,
    ingredients: [
      { id: 'ingredient-tea', name: '红茶茶汤', amount: '200', unit: 'ml' },
      { id: 'ingredient-milk', name: '鲜牛乳', amount: '80', unit: 'ml' },
    ],
  },
  {
    id: 'recipe-addon', title: '加料分组：BBB', recipeId: '1241058292919595009', code: '', priority: '1',
    initialSweetness: '', calculatedSweetness: '--', imageName: '', expanded: false,
    ingredients: [],
  },
];

const RecipeDetail = ({ product, onBack, isOverrideMode }: { product: any, onBack: () => void, isOverrideMode: boolean }) => {
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [dimensionDraft, setDimensionDraft] = useState(MOCK_PRACTICE_GROUPS);
  const [practiceGroups, setPracticeGroups] = useState(MOCK_PRACTICE_GROUPS);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => Object.fromEntries(MOCK_PRACTICE_GROUPS.filter(group => group.isIncluded).map(group => [group.id, group.values[0]])));
  const [recipeCards, setRecipeCards] = useState<RecipeCardState[]>(INITIAL_RECIPE_CARDS);
  const [copiedRecipe, setCopiedRecipe] = useState<RecipeCardState | null>(null);
  const [ingredientTargetId, setIngredientTargetId] = useState<string | null>(null);
  const [pendingIngredients, setPendingIngredients] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: 'regenerate' | 'clear' | 'delete'; recipeId?: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totalCombos = useMemo(() => practiceGroups.filter(group => group.isIncluded).reduce((total, group) => total * group.values.length, 1), [practiceGroups]);
  const selectedCombination = practiceGroups.filter(group => group.isIncluded).map(group => selectedValues[group.id] || group.values[0]).join(' × ');
  const configuredCombos = recipeCards.some(card => card.ingredients.length > 0 || card.code.trim()) ? Math.min(totalCombos, product?.configured || 1) : 0;

  const updateRecipe = (id: string, updates: Partial<RecipeCardState>) => {
    setRecipeCards(prev => prev.map(card => card.id === id ? { ...card, ...updates } : card));
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'regenerate') {
      setRecipeCards(prev => prev.map(card => ({ ...card, code: '', priority: '', initialSweetness: '', calculatedSweetness: '--', imageName: '', ingredients: [] })));
      setMessage(`已按 ${totalCombos} 个组合重新生成，原组合配方已清空`);
    }
    if (confirmAction.type === 'clear' && confirmAction.recipeId) {
      updateRecipe(confirmAction.recipeId, { code: '', priority: '', initialSweetness: '', calculatedSweetness: '--', imageName: '', ingredients: [] });
      setMessage('当前配方已清空');
    }
    if (confirmAction.type === 'delete' && confirmAction.recipeId) {
      setRecipeCards(prev => prev.filter(card => card.id !== confirmAction.recipeId));
      setMessage('加料分组配方已删除');
    }
    setConfirmAction(null);
  };

  const saveRecipes = () => {
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      setMessage(`已保存“${selectedCombination}”的 ${recipeCards.length} 组配方`);
    }, 350);
  };

  const exportRecipes = () => {
    const header = '组合,配方名称,配方ID,配方编码,优先级,初始甜度,配料,用量,单位';
    const rows = recipeCards.flatMap(card => card.ingredients.length ? card.ingredients.map(ingredient => [selectedCombination, card.title, card.recipeId, card.code, card.priority, card.initialSweetness, ingredient.name, ingredient.amount, ingredient.unit]) : [[selectedCombination, card.title, card.recipeId, card.code, card.priority, card.initialSweetness, '', '', '']]);
    const blob = new Blob([`\uFEFF${[header, ...rows.map(row => row.join(','))].join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${product?.name || '商品'}-配方.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('已导出当前商品配方');
  };

  const ingredientOptions: RecipeIngredientRow[] = [
    { id: 'ingredient-tea', name: '红茶茶汤', amount: '200', unit: 'ml' },
    { id: 'ingredient-milk', name: '鲜牛乳', amount: '80', unit: 'ml' },
    { id: 'ingredient-syrup', name: '原味糖浆', amount: '20', unit: 'ml' },
    { id: 'ingredient-ice', name: '食用冰', amount: '120', unit: 'g' },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-6 shadow-sm">
        <div className="flex min-w-0 items-center">
          <button type="button" onClick={onBack} className="mr-3 rounded p-1.5 text-[#666] hover:bg-[#F5F5F5]" aria-label="返回配方商品列表"><ChevronLeft size={20} /></button>
          <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-base font-bold text-[#333]">{product?.name || '0316标品-6'}</h2>{isOverrideMode && <span className="rounded border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-600">门店策略重写中</span>}</div><div className="mt-1 text-xs text-[#999]">商品ID：{product?.id || '1240342344214237185'}</div></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-5 border-r border-[#E8E8E8] pr-4 text-center text-xs"><div><div className="text-[#999]">全部组合</div><div className="mt-1 font-bold text-[#333]">{totalCombos}</div></div><div><div className="text-[#999]">已配置</div><div className="mt-1 font-bold text-[#00A35B]">{configuredCombos}</div></div><div><div className="text-[#999]">未配置</div><div className="mt-1 font-bold text-[#D92D20]">{Math.max(0, totalCombos - configuredCombos)}</div></div></div>
          <button type="button" onClick={() => setConfirmAction({ type: 'regenerate' })} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#555] hover:bg-[#FAFAFA]">重新生成</button>
          <button type="button" onClick={() => setMessage('已获取最新商品规格和做法配置，当前组合无变化')} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#555] hover:bg-[#FAFAFA]">获取最新配置</button>
          <button type="button" onClick={() => { setImportFile(''); setShowImport(true); }} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#555] hover:bg-[#FAFAFA]">导入</button>
          <button type="button" onClick={exportRecipes} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#555] hover:bg-[#FAFAFA]">导出</button>
          <button type="button" disabled={isSaving} onClick={saveRecipes} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white hover:bg-[#00A35B] disabled:opacity-60">{isSaving ? '保存中…' : '保存配方'}</button>
        </div>
      </div>

      {message && <div className="flex items-center justify-between border-b border-[#CBEFDC] bg-[#F1FFF7] px-6 py-2 text-sm text-[#087A49]"><span>{message}</span><button type="button" onClick={() => setMessage('')} className="rounded p-1 hover:bg-white/70" aria-label="关闭提示"><X size={14} /></button></div>}

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-lg border border-[#E8E8E8] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E8E8E8] bg-[#FAFAFA] p-3"><span className="text-sm font-bold text-[#333]">组合维度</span>{!isOverrideMode && <button type="button" onClick={() => { setDimensionDraft(practiceGroups.map(group => ({ ...group }))); setShowDimensionModal(true); }} className="flex items-center rounded px-2 py-1 text-xs text-[#00A35B] hover:bg-[#E9FFF3]"><Settings size={12} className="mr-1" />参与维度</button>}</div>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
            {practiceGroups.filter(group => group.isIncluded).map(group => <div key={group.id}><div className="mb-2 flex items-center gap-2"><span className="text-sm font-bold text-[#333]">{group.name}</span><span className="rounded bg-[#E9FFF3] px-1.5 py-0.5 text-[10px] text-[#00A35B]">{group.type}</span></div><div className="flex flex-wrap gap-2">{group.values.map(value => <button key={value} type="button" onClick={() => setSelectedValues(prev => ({ ...prev, [group.id]: value }))} className={`rounded border px-3 py-1.5 text-xs ${selectedValues[group.id] === value ? 'border-[#00C06B] bg-[#F0FFF7] text-[#00A35B]' : 'border-[#E8E8E8] text-[#666] hover:border-[#8BD7AE]'}`}>{value}</button>)}</div></div>)}
          </div>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#E8E8E8] bg-white shadow-sm">
          {isOverrideMode && <div className="flex items-center border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-700"><Info size={14} className="mr-1.5" />当前商品使用加入策略时生成的独立配方快照；保存后仅当前策略适用门店生效。</div>}
          <div className="flex items-center justify-between border-b border-[#E8E8E8] px-4 py-3"><div><h3 className="text-sm font-bold text-[#333]">{selectedCombination || '默认组合'}</h3><div className="mt-1 text-xs text-[#999]">当前组合共 {recipeCards.length} 组配方</div></div><button type="button" onClick={() => setRecipeCards(prev => [...prev, { id: `recipe-${Date.now()}`, title: `加料分组：未命名`, recipeId: `${Date.now()}`, code: '', priority: '', initialSweetness: '', calculatedSweetness: '--', imageName: '', expanded: true, ingredients: [] }])} className="rounded-lg border border-[#D9DEE7] px-3 py-2 text-sm text-[#4E5969] hover:border-[#8BD7AE] hover:text-[#008F4C]"><Plus size={15} className="mr-1 inline" />新增加料分组配方</button></div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F8F9FB] p-4">
            {recipeCards.map(card => <div key={card.id} className="rounded-lg border border-[#E8E8E8] bg-white">
              <div className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3"><div className="flex items-center gap-2"><span className="text-sm font-bold text-[#333]">{card.title}</span>{isOverrideMode && <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-600">已重写</span>}</div><button type="button" onClick={() => updateRecipe(card.id, { expanded: !card.expanded })} className="text-xs text-[#00A35B]">{card.expanded ? '收起' : `展开（${card.ingredients.length} 项配料）`}</button></div>
              <div className="flex gap-4 px-4 py-3 text-xs"><label className="flex h-[58px] w-[58px] shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded border border-dashed border-[#CFCFCF] bg-[#FAFAFA] text-[#999] hover:border-[#00C06B] hover:text-[#00A35B]">{card.imageName ? <><CheckCircle2 size={16} /><span className="mt-1 max-w-[50px] truncate px-1">已上传</span></> : <><Plus size={17} /><span className="mt-1">配方图片</span></>}<input type="file" accept="image/*" className="hidden" onChange={event => updateRecipe(card.id, { imageName: event.target.files?.[0]?.name || '' })} /></label><div className="grid min-w-0 flex-1 grid-cols-4 gap-3"><label className="text-[#666]">配方ID<input value={card.recipeId} disabled className="mt-1 w-full rounded border border-[#E8E8E8] bg-[#F7F7F7] px-2 py-1.5 text-[#999]" /></label><label className="text-[#666]">配方编码<input value={card.code} onChange={event => updateRecipe(card.id, { code: event.target.value })} placeholder="请输入" className="mt-1 w-full rounded border border-[#E8E8E8] px-2 py-1.5 outline-none focus:border-[#00C06B]" /></label><label className="text-[#666]">优先级<input value={card.priority} onChange={event => /^\d*$/.test(event.target.value) && updateRecipe(card.id, { priority: event.target.value })} placeholder="请输入" className="mt-1 w-full rounded border border-[#E8E8E8] px-2 py-1.5 outline-none focus:border-[#00C06B]" /></label><label className="text-[#666]">初始甜度<input value={card.initialSweetness} onChange={event => /^\d*(\.\d{0,2})?$/.test(event.target.value) && updateRecipe(card.id, { initialSweetness: event.target.value, calculatedSweetness: event.target.value ? `${event.target.value}%` : '--' })} placeholder="请输入" className="mt-1 w-full rounded border border-[#E8E8E8] px-2 py-1.5 outline-none focus:border-[#00C06B]" /></label></div></div>
              {card.expanded && <div className="border-t border-[#F0F0F0] px-4 py-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold text-[#555]">配料明细</span><button type="button" onClick={() => { setIngredientTargetId(card.id); setPendingIngredients([]); }} className="text-xs text-[#00A35B]"><Plus size={13} className="mr-1 inline" />添加配料</button></div><table className="w-full table-fixed text-xs"><thead className="bg-[#F7F8FA] text-left text-[#666]"><tr><th className="px-3 py-2 font-medium">配料名称</th><th className="w-36 px-3 py-2 font-medium">用量</th><th className="w-24 px-3 py-2 font-medium">单位</th><th className="w-20 px-3 py-2 text-right font-medium">操作</th></tr></thead><tbody>{card.ingredients.map(ingredient => <tr key={ingredient.id} className="border-b border-[#F2F2F2]"><td className="px-3 py-2.5 text-[#333]">{ingredient.name}</td><td className="px-3 py-2"><input value={ingredient.amount} onChange={event => /^\d*(\.\d{0,2})?$/.test(event.target.value) && updateRecipe(card.id, { ingredients: card.ingredients.map(item => item.id === ingredient.id ? { ...item, amount: event.target.value } : item) })} className="w-full rounded border border-[#E8E8E8] px-2 py-1 outline-none focus:border-[#00C06B]" /></td><td className="px-3 py-2 text-[#666]">{ingredient.unit}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => updateRecipe(card.id, { ingredients: card.ingredients.filter(item => item.id !== ingredient.id) })} className="text-[#D92D20]">移除</button></td></tr>)}{card.ingredients.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-[#999]">尚未添加配料</td></tr>}</tbody></table></div>}
              <div className="flex items-center justify-between border-t border-[#F0F0F0] px-4 py-3"><span className="text-xs text-[#999]">测算甜度：<strong className="text-[#555]">{card.calculatedSweetness}</strong>{card.imageName && <span className="ml-3">图片：{card.imageName}</span>}</span><div className="flex gap-2"><button type="button" disabled={!copiedRecipe} onClick={() => copiedRecipe && updateRecipe(card.id, { code: copiedRecipe.code, priority: copiedRecipe.priority, initialSweetness: copiedRecipe.initialSweetness, calculatedSweetness: copiedRecipe.calculatedSweetness, imageName: copiedRecipe.imageName, ingredients: copiedRecipe.ingredients.map(item => ({ ...item })) })} className="rounded border border-[#E8E8E8] px-3 py-1 text-xs text-[#666] disabled:opacity-40">粘贴</button><button type="button" onClick={() => { setCopiedRecipe({ ...card, ingredients: card.ingredients.map(item => ({ ...item })) }); setMessage(`已复制“${card.title}”`); }} className="rounded border border-[#E8E8E8] px-3 py-1 text-xs text-[#666]">复制</button><button type="button" onClick={() => setConfirmAction({ type: 'clear', recipeId: card.id })} className="rounded border border-[#E8E8E8] px-3 py-1 text-xs text-[#666]">清空</button>{card.id !== 'recipe-base' && <button type="button" onClick={() => setConfirmAction({ type: 'delete', recipeId: card.id })} className="rounded border border-red-200 px-3 py-1 text-xs text-red-600">删除</button>}</div></div>
            </div>)}
          </div>
        </div>
      </div>

      {showDimensionModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"><div className="w-[540px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-center justify-between border-b border-[#E8E8E8] px-5 py-4"><div><h3 className="font-bold text-[#333]">设置参与配方的做法维度</h3><div className="mt-1 text-xs text-[#999]">取消无关维度会减少需要维护的组合数量</div></div><button type="button" onClick={() => setShowDimensionModal(false)} className="text-[#999]" aria-label="关闭"><X size={18} /></button></div><div className="p-5"><div className="mb-4 space-y-3 rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] p-4">{dimensionDraft.filter(group => group.type !== '规格').map(group => <label key={group.id} className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={group.isIncluded} onChange={event => setDimensionDraft(prev => prev.map(item => item.id === group.id ? { ...item, isIncluded: event.target.checked } : item))} className="h-4 w-4 accent-[#00C06B]" /><span className="text-sm text-[#333]">{group.name} <span className="text-xs text-[#999]">（{group.values.join('、')}）</span></span></label>)}</div><div className="flex items-start rounded-lg border border-orange-100 bg-orange-50 p-3 text-xs leading-5 text-orange-700"><AlertTriangle size={16} className="mr-2 mt-0.5 shrink-0" /><span>确认后将按新维度生成 {dimensionDraft.filter(group => group.isIncluded).reduce((total, group) => total * group.values.length, 1)} 个组合，历史组合配方会被清空，无法自动恢复。</span></div></div><div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-5 py-4"><button type="button" onClick={() => setShowDimensionModal(false)} className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={() => { const nextTotal = dimensionDraft.filter(group => group.isIncluded).reduce((total, group) => total * group.values.length, 1); setPracticeGroups(dimensionDraft); setSelectedValues(Object.fromEntries(dimensionDraft.filter(group => group.isIncluded).map(group => [group.id, group.values[0]]))); setRecipeCards(prev => prev.map(card => ({ ...card, code: '', priority: '', initialSweetness: '', calculatedSweetness: '--', imageName: '', ingredients: [] }))); setShowDimensionModal(false); setMessage(`已按 ${nextTotal} 个组合重新生成，原组合配方已清空`); }} className="rounded-lg bg-[#D97706] px-4 py-2 text-sm font-medium text-white">确认并重新生成</button></div></div></div>}

      {ingredientTargetId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"><div className="flex max-h-[70vh] w-[560px] flex-col overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-center justify-between border-b border-[#E8E8E8] px-5 py-4"><div><h3 className="font-bold text-[#333]">添加配料</h3><div className="mt-1 text-xs text-[#999]">选择后可在配方中维护用量</div></div><button type="button" onClick={() => setIngredientTargetId(null)} className="text-[#999]" aria-label="关闭"><X size={18} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-4">{ingredientOptions.map(option => <label key={option.id} className="flex cursor-pointer items-center gap-3 border-b border-[#F0F0F0] px-3 py-3"><input type="checkbox" checked={pendingIngredients.includes(option.id)} onChange={event => setPendingIngredients(prev => event.target.checked ? [...prev, option.id] : prev.filter(id => id !== option.id))} className="h-4 w-4 accent-[#00C06B]" /><span className="flex-1 text-sm text-[#333]">{option.name}</span><span className="text-xs text-[#999]">默认 {option.amount} {option.unit}</span></label>)}</div><div className="flex items-center justify-between border-t border-[#E8E8E8] px-5 py-4"><span className="text-sm text-[#999]">已选 {pendingIngredients.length} 项</span><div className="flex gap-3"><button type="button" onClick={() => setIngredientTargetId(null)} className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" disabled={pendingIngredients.length === 0} onClick={() => { const target = recipeCards.find(card => card.id === ingredientTargetId); if (target) updateRecipe(target.id, { ingredients: [...target.ingredients, ...ingredientOptions.filter(option => pendingIngredients.includes(option.id) && !target.ingredients.some(item => item.id === option.id))] }); setIngredientTargetId(null); }} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">确认添加</button></div></div></div></div>}

      {showImport && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"><div className="w-[500px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-center justify-between border-b border-[#E8E8E8] px-5 py-4"><div><h3 className="font-bold text-[#333]">导入商品配方</h3><div className="mt-1 text-xs text-[#999]">上传后先校验组合、配料及用量，不直接覆盖现有配方</div></div><button type="button" onClick={() => setShowImport(false)} className="text-[#999]" aria-label="关闭"><X size={18} /></button></div><div className="p-5"><label className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-[#CFCFCF] bg-[#FAFAFA] px-4 py-8 text-center"><Upload size={24} className="text-[#00A35B]" /><span className="mt-2 text-sm text-[#555]">选择 Excel 或 CSV 文件</span><span className="mt-1 text-xs text-[#999]">单个文件不超过 10MB</span><input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={event => setImportFile(event.target.files?.[0]?.name || '')} /></label>{importFile && <div className="mt-3 rounded-lg bg-[#F1FFF7] px-3 py-2 text-sm text-[#087A49]">已选择：{importFile}</div>}</div><div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-5 py-4"><button type="button" onClick={() => setShowImport(false)} className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" disabled={!importFile} onClick={() => { setShowImport(false); setMessage('文件校验完成：组合和配料数据均可导入'); }} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">开始校验</button></div></div></div>}

      {confirmAction && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6"><div className="w-[460px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-start gap-3 px-6 py-5"><div className="rounded-full bg-[#FFF1F0] p-2 text-[#D92D20]"><AlertTriangle size={18} /></div><div><div className="font-bold text-[#222]">{confirmAction.type === 'regenerate' ? '重新生成配方组合' : confirmAction.type === 'clear' ? '清空当前配方' : '删除加料分组配方'}</div><div className="mt-2 text-sm leading-6 text-[#666]">{confirmAction.type === 'regenerate' ? `将重新生成 ${totalCombos} 个组合，并清空现有配方内容；原数据无法自动恢复。` : confirmAction.type === 'clear' ? '配方编码、甜度和配料明细将被清空；保存前可重新录入。' : '该加料分组的配方和配料用量将被删除，不影响基础配方。'}</div></div></div><div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4"><button type="button" onClick={() => setConfirmAction(null)} className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={executeConfirmAction} className="rounded-lg bg-[#D92D20] px-4 py-2 text-sm font-medium text-white">确认</button></div></div></div>}
    </div>
  );
};

// 3. 配方策略列表页 (Solution 2)
const PolicyList = ({ onViewPolicy, onViewPolicyProducts, onBack }: { onViewPolicy: (p: any) => void, onViewPolicyProducts: (p: any) => void, onBack: () => void }) => {
  const [policies, setPolicies] = useState(MOCK_POLICIES);
  const [deleteTarget, setDeleteTarget] = useState<(typeof MOCK_POLICIES)[number] | null>(null);

  const togglePolicyStatus = (id: string) => {
    setPolicies(policies.map(p => 
      p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
  };

  const deletePolicy = (id: string) => {
    setPolicies(policies.filter(p => p.id !== id));
    setDeleteTarget(null);
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
         <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E7EB] text-[#667085] hover:border-[#8BD7AE] hover:text-[#008F4C]" title="返回总部默认配方">
              <ChevronLeft size={17} />
            </button>
            <h2 className="text-[16px] font-bold text-[#333]">门店配方策略</h2>
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
                     <button
                        type="button"
                        aria-label={policy.status === 'active' ? '停用策略' : '启用策略'}
                        className={`relative inline-block w-8 h-4 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${policy.status === 'active' ? 'bg-[#00C06B]' : 'bg-gray-300'}`} 
                        onClick={() => togglePolicyStatus(policy.id)}
                        title={policy.status === 'active' ? '点击停用' : '点击启用'}
                     >
                        <span className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out ${policy.status === 'active' ? 'transform translate-x-4' : ''}`}></span>
                     </button>
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
                     <button onClick={() => setDeleteTarget(policy)} className="text-[#999] hover:text-red-500 text-xs font-medium transition-colors">删除</button>
                     <div className="w-px h-3 bg-gray-200"></div>
                     <button onClick={() => onViewPolicy(policy)} className="text-[#00C06B] text-xs hover:underline font-medium">基础信息</button>
                     <div className="w-px h-3 bg-gray-200"></div>
                     <button onClick={() => onViewPolicyProducts(policy)} className="text-[#00C06B] text-xs hover:underline font-medium">配方商品</button>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {deleteTarget && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 p-6">
          <div className="w-[440px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start gap-3 px-6 py-5">
              <div className="rounded-full bg-[#FFF1F0] p-2 text-[#D92D20]"><AlertTriangle size={18} /></div>
              <div><div className="font-bold text-[#222]">删除配方策略</div><div className="mt-2 text-sm leading-6 text-[#666]">删除“{deleteTarget.name}”后，{deleteTarget.storeCount} 家门店将恢复使用总部默认配方，策略中的差异配方不再生效。</div></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4"><button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={() => deletePolicy(deleteTarget.id)} className="rounded-lg bg-[#D92D20] px-4 py-2 text-sm font-medium text-white">确认删除</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. 配方策略详情页
const PolicyDetail = ({ policy, onBack }: { policy: any, onBack: () => void }) => {
  const [isActive, setIsActive] = useState(policy?.status === 'active');
  const [policyName, setPolicyName] = useState(policy?.name || '');
  const [remark, setRemark] = useState(policy?.remark || '');
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(policy?.storeCount > 0 ? ['store-shenzhen', 'store-guangzhou'] : []);
  const [pendingStoreIds, setPendingStoreIds] = useState<string[]>([]);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'leave' | null>(null);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const storeOptions = [
    { id: 'store-shenzhen', name: '深圳海岸城店', region: '华南区' },
    { id: 'store-guangzhou', name: '广州正佳广场店', region: '华南区' },
    { id: 'store-futian', name: '深圳福田中心店', region: '华南区' },
    { id: 'store-beijing', name: '北京朝阳大悦城店', region: '华北区', conflictPolicy: '华北特殊配方策略' },
  ];

  const selectedStores = storeOptions.filter(store => selectedStoreIds.includes(store.id));
  const markDirty = () => setIsDirty(true);

  const savePolicy = () => {
    if (!policyName.trim() || selectedStoreIds.length === 0) return;
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      setMessage(`策略已保存，将对 ${selectedStoreIds.length} 家门店${isActive ? '生效' : '保持停用'}`);
    }, 350);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6FA]">
       {/* Header */}
       <div className="h-[60px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
         <div className="flex items-center">
            <button type="button" onClick={() => isDirty ? setConfirmAction('leave') : onBack()} className="mr-4 rounded p-1.5 text-[#666] hover:bg-[#F5F5F5]" aria-label="返回策略列表"><ChevronLeft size={20}/></button>
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
            <div className="flex items-center mr-2">
               <span className="text-sm text-[#666] mr-2">启用策略</span>
               <button type="button" aria-label={isActive ? '停用策略' : '启用策略'} className={`relative inline-block w-10 h-5 transition-colors duration-200 ease-in-out rounded-full ${isActive ? 'bg-[#00C06B]' : 'bg-gray-300'}`} onClick={() => { setIsActive(!isActive); markDirty(); }}>
                  <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${isActive ? 'transform translate-x-5' : ''}`}></span>
               </button>
            </div>
            <button type="button" onClick={() => setConfirmAction('delete')} className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm text-[#D92D20] hover:bg-[#FFF8F7]">删除</button>
            <button type="button" disabled={!policyName.trim() || selectedStoreIds.length === 0 || isSaving} onClick={savePolicy} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-bold text-white hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:opacity-40">{isSaving ? '保存中…' : '保存配置'}</button>
         </div>
       </div>

       {message && <div className="flex items-center justify-between border-b border-[#CBEFDC] bg-[#F1FFF7] px-6 py-2 text-sm text-[#087A49]"><span>{message}</span><button type="button" onClick={() => setMessage('')} className="rounded p-1 hover:bg-white/70" aria-label="关闭提示"><X size={14} /></button></div>}

       <div className="flex-1 overflow-y-auto p-6 flex justify-center">
          <div className="w-[900px] space-y-4">
             
             {/* Base Info Card */}
             <div className="bg-white rounded-md shadow-sm border border-[#E8E8E8] p-5">
                <h3 className="font-bold text-[#333] mb-4 border-b border-[#F0F0F0] pb-2">基础信息</h3>
                <div className="space-y-4">
                   <div className="flex items-center">
                      <span className="w-24 text-sm text-[#666]"><span className="mr-1 text-red-500">*</span>策略名称</span>
                      <div className="flex-1"><input value={policyName} maxLength={30} onChange={event => { setPolicyName(event.target.value); markDirty(); }} className={`w-full rounded border px-3 py-2 text-sm outline-none ${policyName.trim() ? 'border-[#E8E8E8] focus:border-[#00C06B]' : 'border-red-300'}`} placeholder="请输入策略名称" />{!policyName.trim() && <div className="mt-1 text-xs text-red-500">请输入策略名称</div>}</div>
                   </div>
                   <div className="flex items-start">
                      <span className="w-24 text-sm text-[#666] mt-1.5"><span className="mr-1 text-red-500">*</span>适用门店</span>
                      <div className="flex-1">
                         <div className={`flex min-h-[76px] flex-wrap content-start gap-2 rounded border bg-[#FAFAFA] p-3 ${selectedStoreIds.length > 0 ? 'border-[#E8E8E8]' : 'border-red-300'}`}>
                            {selectedStores.map(store => <span key={store.id} className="flex items-center rounded border border-[#E8E8E8] bg-white px-2 py-1 text-xs">{store.name}<button type="button" onClick={() => { setSelectedStoreIds(prev => prev.filter(id => id !== store.id)); markDirty(); }} className="ml-1 rounded text-[#999] hover:text-red-500" aria-label={`移除${store.name}`}><X size={12} /></button></span>)}
                            {selectedStoreIds.length === 0 && <span className="mr-2 mt-1 text-sm text-gray-400">暂未选择门店</span>}
                            <button type="button" onClick={() => { setPendingStoreIds(selectedStoreIds); setShowStoreSelector(true); }} className="flex items-center rounded border border-dashed border-[#00C06B] bg-white px-2 py-1 text-xs text-[#00C06B] hover:bg-[#00C06B]/5">
                               <Plus size={12} className="mr-1"/> 添加门店
                            </button>
                         </div>
                         <p className="text-[11px] text-[#999] mt-1">启用后，所选门店对已加入策略的商品使用独立配方快照；未加入策略的商品继续使用总部默认配方。</p>
                         {selectedStoreIds.length === 0 && <div className="mt-1 text-xs text-red-500">请至少选择一家门店</div>}
                      </div>
                   </div>
                   <div className="flex items-start mt-4">
                      <span className="w-24 text-sm text-[#666] mt-1.5">备注</span>
                      <div className="flex-1"><textarea value={remark} maxLength={200} onChange={event => { setRemark(event.target.value); markDirty(); }} className="min-h-[80px] w-full rounded border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#00C06B]" placeholder="选填，请输入备注信息"></textarea><div className="mt-1 text-right text-xs text-[#999]">{remark.length}/200</div></div>
                   </div>
                </div>
             </div>

          </div>
       </div>

       {showStoreSelector && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"><div className="flex max-h-[72vh] w-[640px] flex-col overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-center justify-between border-b border-[#E8E8E8] px-5 py-4"><div><h3 className="font-bold text-[#333]">选择适用门店</h3><div className="mt-1 text-xs text-[#999]">同一家门店只能生效一个门店配方策略</div></div><button type="button" onClick={() => setShowStoreSelector(false)} className="text-[#999]" aria-label="关闭"><X size={18} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-4"><div className="overflow-hidden rounded-lg border border-[#E8E8E8]">{storeOptions.map(store => { const disabled = Boolean(store.conflictPolicy); return <label key={store.id} className={`flex items-start gap-3 border-b border-[#F0F0F0] px-4 py-3 last:border-b-0 ${disabled ? 'cursor-not-allowed bg-[#FAFAFA]' : 'cursor-pointer hover:bg-[#F8FCFA]'}`}><input type="checkbox" disabled={disabled} checked={pendingStoreIds.includes(store.id)} onChange={event => setPendingStoreIds(prev => event.target.checked ? [...prev, store.id] : prev.filter(id => id !== store.id))} className="mt-0.5 h-4 w-4 accent-[#00C06B]" /><div className="min-w-0 flex-1"><div className={`text-sm font-medium ${disabled ? 'text-[#999]' : 'text-[#333]'}`}>{store.name}</div><div className="mt-1 text-xs text-[#999]">{store.region}</div>{store.conflictPolicy && <div className="mt-1 flex items-center text-xs text-[#D92D20]"><AlertTriangle size={12} className="mr-1" />已用于“{store.conflictPolicy}”，请先从原策略移除</div>}</div></label>; })}</div></div><div className="flex items-center justify-between border-t border-[#E8E8E8] px-5 py-4"><span className="text-sm text-[#999]">已选 {pendingStoreIds.length} 家</span><div className="flex gap-3"><button type="button" onClick={() => setShowStoreSelector(false)} className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={() => { setSelectedStoreIds(pendingStoreIds); setShowStoreSelector(false); markDirty(); }} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white">确认选择</button></div></div></div></div>}

       {confirmAction && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6"><div className="w-[460px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-start gap-3 px-6 py-5"><div className="rounded-full bg-[#FFF1F0] p-2 text-[#D92D20]"><AlertTriangle size={18} /></div><div><div className="font-bold text-[#222]">{confirmAction === 'delete' ? '删除配方策略' : '离开当前页面'}</div><div className="mt-2 text-sm leading-6 text-[#666]">{confirmAction === 'delete' ? `删除后，${selectedStoreIds.length} 家门店恢复使用总部默认配方，策略内的差异配方不再生效。` : '当前修改尚未保存，离开后本次修改将丢失。'}</div></div></div><div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4"><button type="button" onClick={() => setConfirmAction(null)} className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm text-[#666]">继续编辑</button><button type="button" onClick={onBack} className="rounded-lg bg-[#D92D20] px-4 py-2 text-sm font-medium text-white">{confirmAction === 'delete' ? '确认删除' : '放弃修改并离开'}</button></div></div></div>}
    </div>
  );
};

// 5. 策略配方商品管理页
const PolicyProductManager = ({ policy, onBack, onConfigProduct }: { policy: any, onBack: () => void, onConfigProduct: (p: any) => void }) => {
  const { products: brandProducts } = useProducts();
  const [strategyProducts, setStrategyProducts] = useState<any[]>(policy?.productCount > 0
    ? MOCK_RECIPE_LIST.slice(0, Math.min(policy.productCount, MOCK_RECIPE_LIST.length)).map((product, index) => ({
        ...product,
        snapshotTime: `2026-03-${20 - index} 14:32`,
        snapshotStatus: 'ready',
      }))
    : []);
  const [keyword, setKeyword] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const [removeTarget, setRemoveTarget] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [message, setMessage] = useState('');

  const filteredProducts = strategyProducts.filter(product => !keyword.trim() || product.name.toLowerCase().includes(keyword.trim().toLowerCase()) || product.id.includes(keyword.trim()));
  const availableProducts = brandProducts.filter(product => !strategyProducts.some(item => item.id === product.id));

  const addStrategyProducts = () => {
    const now = new Date().toLocaleString();
    const additions = brandProducts.filter(product => pendingProductIds.includes(product.id)).map(product => ({
      id: product.id,
      name: product.name,
      category: product.category || '未分类',
      total: 1,
      configured: 0,
      status: 'none',
      snapshotStatus: 'ready',
      snapshotTime: now,
    }));
    setStrategyProducts(prev => [...prev, ...additions]);
    setShowProductSelector(false);
    setMessage(`已为 ${additions.length} 个商品生成独立配方快照`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6FA]">
       <div className="h-[60px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
         <div className="flex items-center">
            <button type="button" onClick={onBack} className="mr-4 rounded p-1.5 text-[#666] hover:bg-[#F5F5F5]" aria-label="返回策略列表"><ChevronLeft size={20}/></button>
            <h2 className="text-lg font-bold text-[#333] flex items-center">
               {policy?.name || '策略配方商品管理'} · 配方商品
            </h2>
         </div>
         <div className="flex gap-3">
           <button type="button" onClick={() => setShowBulkImport(true)} className="flex items-center rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#555] hover:bg-[#FAFAFA]"><Upload size={15} className="mr-1.5" />导入配方</button>
           <button type="button" onClick={() => setShowBulkExport(true)} className="flex items-center rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#555] hover:bg-[#FAFAFA]"><Download size={15} className="mr-1.5" />导出配方</button>
           <button type="button" onClick={() => { setPendingProductIds([]); setShowProductSelector(true); }} className="flex items-center rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-bold text-white hover:bg-[#00A35B]"><Plus size={16} className="mr-1" />添加商品</button>
         </div>
       </div>
       {message && <div className="flex items-center justify-between border-b border-[#CBEFDC] bg-[#F1FFF7] px-6 py-2 text-sm text-[#087A49]"><span>{message}</span><button type="button" onClick={() => setMessage('')} className="rounded p-1 hover:bg-white/70" aria-label="关闭提示"><X size={14} /></button></div>}
       <div className="min-h-0 flex-1 p-4"><div className="flex h-full flex-col overflow-hidden rounded-lg border border-[#E8E8E8] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E8E8E8] px-4 py-3"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索商品名称、商品ID" className="w-64 rounded-lg border border-[#E8E8E8] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]" /></div><div className="flex items-center gap-2 text-xs text-[#667085]"><Info size={14} className="text-[#2E90FA]" />加入策略后生成独立快照，不再跟随总部默认配方更新</div></div>
          <div className="min-h-0 flex-1 overflow-auto"><table className="w-full table-fixed text-left text-sm"><thead className="sticky top-0 z-10 bg-[#F7F8FA] text-[#555]"><tr><th className="w-[320px] border-b border-[#E8E8E8] px-5 py-3 font-bold">商品</th><th className="border-b border-[#E8E8E8] px-5 py-3 font-bold">独立快照</th><th className="w-40 border-b border-[#E8E8E8] px-5 py-3 font-bold">配置进度</th><th className="w-44 border-b border-[#E8E8E8] px-5 py-3 font-bold">快照生成时间</th><th className="w-40 border-b border-[#E8E8E8] px-5 py-3 text-right font-bold">操作</th></tr></thead><tbody>{filteredProducts.map(product => <tr key={product.id} className="border-b border-[#F2F2F2] hover:bg-[#FAFCFB]"><td className="px-5 py-4"><div className="font-medium text-[#333]">{product.name}</div><div className="mt-1 text-xs text-[#999]">商品ID：{product.id} · {product.category}</div></td><td className="px-5 py-4"><span className="inline-flex items-center text-[#00A35B]"><CheckCircle2 size={14} className="mr-1.5" />已生成，独立于总部默认配方</span></td><td className="px-5 py-4"><div className="text-[#555]">{product.configured}/{product.total} 组合</div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EDEDED]"><div className="h-full bg-[#00C06B]" style={{ width: `${product.total ? Math.round(product.configured / product.total * 100) : 0}%` }} /></div></td><td className="px-5 py-4 text-[#666]">{product.snapshotTime}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => onConfigProduct(product)} className="mr-4 text-[#00A35B] hover:underline">配置配方</button><button type="button" onClick={() => setRemoveTarget(product)} className="text-[#666] hover:text-[#D92D20]">移除</button></td></tr>)}{filteredProducts.length === 0 && <tr><td colSpan={5} className="py-16 text-center"><div className="text-sm text-[#999]">{keyword ? '未找到符合条件的商品' : '当前策略暂未添加商品'}</div><button type="button" onClick={() => keyword ? setKeyword('') : setShowProductSelector(true)} className="mt-2 text-sm text-[#00A35B]">{keyword ? '清空搜索条件' : '添加商品并生成配方快照'}</button></td></tr>}</tbody></table></div>
          <div className="flex h-12 items-center justify-end border-t border-[#E8E8E8] px-5 text-xs text-[#666]">共 {filteredProducts.length} 条</div>
       </div></div>

       {showProductSelector && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"><div className="flex max-h-[72vh] w-[660px] flex-col overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-center justify-between border-b border-[#E8E8E8] px-5 py-4"><div><h3 className="font-bold text-[#333]">添加策略配方商品</h3><div className="mt-1 text-xs text-[#999]">确认后复制当前总部默认配方，生成独立快照</div></div><button type="button" onClick={() => setShowProductSelector(false)} className="text-[#999]" aria-label="关闭"><X size={18} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-4"><div className="overflow-hidden rounded-lg border border-[#E8E8E8]">{availableProducts.map(product => <label key={product.id} className="flex cursor-pointer items-center gap-3 border-b border-[#F0F0F0] px-4 py-3 last:border-b-0 hover:bg-[#FAFCFB]"><input type="checkbox" checked={pendingProductIds.includes(product.id)} onChange={event => setPendingProductIds(prev => event.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id))} className="h-4 w-4 accent-[#00C06B]" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-[#333]">{product.name}</div><div className="mt-1 text-xs text-[#999]">商品ID：{product.id} · {product.category || '未分类'}</div></div></label>)}{availableProducts.length === 0 && <div className="py-10 text-center text-sm text-[#999]">暂无可添加商品</div>}</div></div><div className="flex items-center justify-between border-t border-[#E8E8E8] px-5 py-4"><span className="text-sm text-[#999]">已选 {pendingProductIds.length} 个</span><div className="flex gap-3"><button type="button" onClick={() => setShowProductSelector(false)} className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" disabled={pendingProductIds.length === 0} onClick={addStrategyProducts} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">生成快照并添加</button></div></div></div></div>}

       {removeTarget && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6"><div className="w-[470px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-start gap-3 px-6 py-5"><div className="rounded-full bg-[#FFF1F0] p-2 text-[#D92D20]"><AlertTriangle size={18} /></div><div><div className="font-bold text-[#222]">移除策略配方商品</div><div className="mt-2 text-sm leading-6 text-[#666]">移除“{removeTarget.name}”后，策略适用门店将恢复使用总部当前默认配方；该商品的独立快照及已配置内容将删除。</div></div></div><div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4"><button type="button" onClick={() => setRemoveTarget(null)} className="rounded-lg border border-[#E8E8E8] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={() => { setStrategyProducts(prev => prev.filter(item => item.id !== removeTarget.id)); setMessage(`已移除 ${removeTarget.name}，门店恢复使用总部默认配方`); setRemoveTarget(null); }} className="rounded-lg bg-[#D92D20] px-4 py-2 text-sm font-medium text-white">确认移除</button></div></div></div>}

       {showBulkImport && (
         <BulkRecipeImportDialog
           title={`导入“${policy?.name || '当前策略'}”配方`}
           subtitle="一次导入当前门店配方策略下多个商品的差异配方"
           scopeText={`${policy?.name || '当前策略'} · ${policy?.storeCount || 0} 家适用门店`}
           impactText="仅修改当前策略的配方快照；适用门店存在对应商品时才会生效，文件中未出现的数据不会删除。"
           onClose={() => setShowBulkImport(false)}
           onComplete={() => setMessage('门店策略配方批量导入完成：成功 1,238 条，跳过 4 条')}
         />
       )}

       {showBulkExport && (
         <BulkRecipeExportDialog
           title={`导出“${policy?.name || '当前策略'}”配方`}
           scopeText="当前门店配方策略"
           totalCount={strategyProducts.length}
           filteredCount={filteredProducts.length}
           onClose={() => setShowBulkExport(false)}
           onComplete={() => setMessage('门店策略配方导出任务已创建，可在下载中心查看进度')}
         />
       )}
    </div>
  );
};
