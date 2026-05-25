
import React, { useEffect, useState } from 'react';
import { 
  Box, ChevronDown, ChevronUp, Search, Bell, LayoutGrid, Clock, Settings, Store
} from 'lucide-react';
import { useProducts } from '../context';
import { Category, CategoryFieldConfig } from '../types';
import { SidebarItem } from './web/WebCommon';
import { WebProductList } from './web/WebProductList';
import { WebStoreProductList } from './web/WebStoreProductList'; // Imported new component
import { WebStoreCategoryList } from './web/WebStoreCategoryList';
import { WebCategoryManager } from './web/WebCategoryManager';
import { WebCategoryListManager } from './web/WebCategoryListManager';
import { WebStoreAttributeManager } from './web/WebStoreAttributeManager';
import { WebStoreRegionList } from './web/WebStoreRegionList';
import { WebRequiredProductPolicyList } from './web/WebRequiredProductPolicyList';
import { WebRequiredProductPolicyEditor } from './web/WebRequiredProductPolicyEditor';
import { WebStoreRegionEditor } from './web/WebStoreRegionEditor';
import { WebAttributeMutexRuleList } from './web/WebAttributeMutexRuleList';
import { WebAttributeMutexRuleEditor } from './web/WebAttributeMutexRuleEditor';
import { WebCategorySelectModal, WebImportModal } from './web/WebModals';
import { WebProductForm } from './web/WebProductForm';
import { WebProductDetail } from './web/WebProductDetail';
import { WebRecipeManager } from './web/WebRecipeManager'; 
import { WebIngredientLibraryManager } from './web/WebIngredientLibraryManager';
import { WebNutritionManager } from './web/WebNutritionManager';
import { WebAddonGroupManager } from './web/WebAddonGroupManager'; // Import new component
import { WebProductSync } from './web/WebProductSync'; // Import new component
import { WebProductAttributeManager } from './web/WebProductAttributeManager';
import { WebPriceSystemList } from './web/WebPriceSystemList';
import { WebProductTemplateManager } from './web/WebProductTemplateManager';

import { WebGeneralSettings } from './web/WebGeneralSettings'; // Import new component

// Extended Category type for Web Admin local state
export interface WebCategory extends Category {
  classification: 'standard' | 'combo';
}

type StoreProductManagePreset = {
  keyword?: string;
};

const DEFAULT_STANDARD_FIELDS: CategoryFieldConfig[] = [
  { id: 'p_name', isRequired: true },
  { id: 'p_code', isRequired: false },
  { id: 'p_front_cat', isRequired: true },
  { id: 'p_back_cat', isRequired: false },
  { id: 'p_cat', isRequired: true },
  { id: 'p_weight_flag', isRequired: false },
  { id: 'p_unit', isRequired: false },
  { id: 'p_display_type', isRequired: false },
  { id: 'p_remark', isRequired: false },
  { id: 'p_stat_tags', isRequired: false },
  { id: 'p_tare_weight', isRequired: false },
  { id: 'p_img', isRequired: true },
  { id: 's_specs', isRequired: false },
  { id: 'm_methods', isRequired: false },
  { id: 'a_addons', isRequired: false },
  { id: 'p_points_exchange_rule', isRequired: false },
  { id: 's_price', isRequired: true },
  { id: 's_cost', isRequired: false },
  { id: 's_market_price', isRequired: false },
  { id: 's_stock', isRequired: true },
  { id: 's_pack_fee', isRequired: false },
  { id: 's_min_purchase_toggle', isRequired: false },
  { id: 's_min_purchase_value', isRequired: false },
  { id: 's_max_purchase_toggle', isRequired: false },
  { id: 's_max_purchase_value', isRequired: false },
  { id: 's_time_sale_toggle', isRequired: false },
  { id: 's_time_sale_rule', isRequired: false },
  { id: 's_sale_mode', isRequired: false },
  { id: 's_sale_settings', isRequired: false },
  { id: 's_takeout_rule', isRequired: false },
  { id: 's_tax_rate', isRequired: false },
  { id: 'p_stat_tags', isRequired: false },
  { id: 'p_desc_tags', isRequired: false },
  { id: 'p_order_tags', isRequired: false },
  { id: 'p_list_desc', isRequired: false },
  { id: 'p_badge', isRequired: false },
  { id: 'p_video', isRequired: false },
  { id: 'p_rich_desc', isRequired: false },
  { id: 'st_member', isRequired: false },
  { id: 'o_invoice', isRequired: false },
  { id: 'o_origin', isRequired: false },
  { id: 'o_ingredients', isRequired: false },
  { id: 'o_print_stat_test', isRequired: false },
  { id: 'o_1202_attr', isRequired: false },
];

const DEFAULT_COMBO_FIELDS: CategoryFieldConfig[] = [
  { id: 'p_name', isRequired: true },
  { id: 'p_code', isRequired: false },
  { id: 'p_front_cat', isRequired: false },
  { id: 'p_back_cat', isRequired: false },
  { id: 'p_cat', isRequired: true },
  { id: 'p_display_type', isRequired: false },
  { id: 'p_remark', isRequired: false },
  { id: 'p_stat_tags', isRequired: false },
  { id: 'p_img', isRequired: true },
  { id: 'm_methods', isRequired: false },
  { id: 'a_addons', isRequired: false },
  { id: 'p_points_exchange_rule', isRequired: false },
  { id: 's_price', isRequired: true },
  { id: 's_cost', isRequired: false },
  { id: 's_market_price', isRequired: false },
  { id: 's_stock', isRequired: true },
  { id: 's_min_purchase_toggle', isRequired: false },
  { id: 's_min_purchase_value', isRequired: false },
  { id: 's_max_purchase_toggle', isRequired: false },
  { id: 's_max_purchase_value', isRequired: false },
  { id: 's_time_sale_toggle', isRequired: false },
  { id: 's_time_sale_rule', isRequired: false },
  { id: 's_sale_mode', isRequired: false },
  { id: 's_sale_settings', isRequired: false },
  { id: 's_takeout_rule', isRequired: false },
  { id: 's_tax_rate', isRequired: false },
  { id: 'c_groups', isRequired: true },
  { id: 'p_stat_tags', isRequired: false },
  { id: 'p_desc_tags', isRequired: false },
  { id: 'p_list_desc', isRequired: false },
  { id: 'p_badge', isRequired: false },
  { id: 'p_video', isRequired: false },
  { id: 'p_rich_desc', isRequired: false },
  { id: 'st_member', isRequired: false },
  { id: 'o_invoice', isRequired: false },
  { id: 'o_origin', isRequired: false },
  { id: 'o_ingredients', isRequired: false },
];

const INITIAL_WEB_CATEGORIES: WebCategory[] = [
  // Standard Categories
  { id: 'w_cat_s1', name: '通用菜品', productCount: 120, standardFields: DEFAULT_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s2', name: '现制饮品', productCount: 45, standardFields: DEFAULT_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s3', name: '称重商品', productCount: 15, standardFields: DEFAULT_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s4', name: '蛋糕/烘焙', productCount: 30, standardFields: DEFAULT_STANDARD_FIELDS.filter(field => field.id !== 's_pack_fee').concat([{ id: 'p_badge', isRequired: false }]), comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s5', name: '零售商品', productCount: 80, standardFields: DEFAULT_STANDARD_FIELDS.filter(field => field.id !== 'st_member').concat([{ id: 'o_invoice', isRequired: false }, { id: 'o_origin', isRequired: false }]), comboFields: [], source: 'system', classification: 'standard' },
  // Combo Categories
  { id: 'w_cat_c1', name: '通用套餐', productCount: 20, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c2', name: '现制饮品套餐', productCount: 10, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c3', name: '蛋糕/烘焙套餐', productCount: 5, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c4', name: '零售套餐', productCount: 8, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c5', name: '火锅锅底', productCount: 12, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
];

export const WebAdmin: React.FC = () => {
  const { products } = useProducts();
  const productMenuGuideStorageKey = 'web-admin-product-menu-upgrade-guide-v2';
  // Navigation State
  const [activeMenu, setActiveMenu] = useState('product_list');
  const [newRecipeEnabled, setNewRecipeEnabled] = useState(true);
  const [lastRecipeMenu, setLastRecipeMenu] = useState<'recipe_legacy' | 'recipe_new'>('recipe_new');
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    'product_archives',
    'product_archives_recipe',
    'store_products',
    'chain_management',
    'platform_products',
  ]);

  // Creation/Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [categorySelectType, setCategorySelectType] = useState<'standard' | 'combo' | null>(null);
  const [detailContext, setDetailContext] = useState<any>(null); // New detail context
  const [creationContext, setCreationContext] = useState<{ type: 'standard' | 'combo', category: Category, mode?: 'create' | 'edit', product?: any } | null>(null); // Triggers Form Page
  const [storeProductManagePreset, setStoreProductManagePreset] = useState<StoreProductManagePreset | null>(null);
  const [storeCategoryReturnMenu, setStoreCategoryReturnMenu] = useState('store_product_list');
  const [requiredPolicyEditorContext, setRequiredPolicyEditorContext] = useState<{ mode: 'create' | 'edit'; policy?: any } | null>(null);
  const [storeRegionEditorContext, setStoreRegionEditorContext] = useState<any>(null);
  const [attributeMutexEditorContext, setAttributeMutexEditorContext] = useState<{ mode: 'create' | 'edit'; rule?: any } | null>(null);
  const [showProductMenuGuide, setShowProductMenuGuide] = useState(false);
  const [currentProductMenuGuideStep, setCurrentProductMenuGuideStep] = useState(0);

  // Category Manager State
  const [webCategories, setWebCategories] = useState<WebCategory[]>(INITIAL_WEB_CATEGORIES);
  const [selectedManageCat, setSelectedManageCat] = useState<Category | null>(null);

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(productMenuGuideStorageKey, 'seen');
    setShowProductMenuGuide(false);
  }, []);

  const handleCloseProductMenuGuide = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(productMenuGuideStorageKey, 'seen');
    }
    setShowProductMenuGuide(false);
  };

  const productMenuGuideSteps = [
    {
      step: '1/2',
      title: '新增【商品运营】菜单',
      desc: '商品同步、模板管理、价格体系等商品运营管理能力搬家至【商品运营】菜单',
      cardPosition: 'left-[164px] top-[138px]',
      highlightPosition: 'left-[12px] top-[198px] h-[120px] w-[176px]',
    },
    {
      step: '2/2',
      title: '【门店做法】菜单搬家',
      desc: '【门店做法】迁移至【门店商品属性】菜单',
      cardPosition: 'left-[164px] top-[286px]',
      highlightPosition: 'left-[12px] top-[332px] h-[78px] w-[176px]',
    },
  ];
  const currentGuideStep = productMenuGuideSteps[currentProductMenuGuideStep];

  const handleNextProductMenuGuide = () => {
    if (currentProductMenuGuideStep >= productMenuGuideSteps.length - 1) {
      handleCloseProductMenuGuide();
      return;
    }
    setCurrentProductMenuGuideStep(prev => prev + 1);
  };

  const handlePrevProductMenuGuide = () => {
    setCurrentProductMenuGuideStep(prev => Math.max(prev - 1, 0));
  };

  // Web Category Handlers
  const addWebCategory = (cat: WebCategory) => setWebCategories(prev => [...prev, cat]);
  const updateWebCategory = (id: string, updates: Partial<WebCategory>) => setWebCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const deleteWebCategory = (id: string) => setWebCategories(prev => prev.filter(c => c.id !== id));

  // Determine current content
  const renderContent = () => {
      if (creationContext) {
          return (
              <WebProductForm 
                  type={creationContext.type} 
                  category={creationContext.category} 
                  categories={webCategories.filter(cat => cat.classification === creationContext.type)}
                  mode={creationContext.mode || 'create'}
                  initialProduct={creationContext.product || null}
                  existingProductCount={products.length}
                  previewPreferenceKey="web-admin-qimai-jingjing"
                  onClose={() => setCreationContext(null)} 
              />
          );
      }

      if (detailContext) {
          return (
              <WebProductDetail 
                  product={detailContext} 
                  onClose={() => setDetailContext(null)} 
              />
          );
      }

      if (activeMenu === 'required_product_policy' && requiredPolicyEditorContext) {
          return (
              <WebRequiredProductPolicyEditor
                  mode={requiredPolicyEditorContext.mode}
                  policy={requiredPolicyEditorContext.policy}
                  onBack={() => setRequiredPolicyEditorContext(null)}
              />
          );
      }

      if (activeMenu === 'store_region_list' && storeRegionEditorContext) {
          return (
              <WebStoreRegionEditor
                  region={storeRegionEditorContext}
                  onBack={() => setStoreRegionEditorContext(null)}
              />
          );
      }

      if (activeMenu === 'attribute_mutex_rules' && attributeMutexEditorContext) {
          return (
              <WebAttributeMutexRuleEditor
                  mode={attributeMutexEditorContext.mode}
                  rule={attributeMutexEditorContext.rule}
                  onBack={() => setAttributeMutexEditorContext(null)}
              />
          );
      }

      if (activeMenu === 'store_product_list') {
          return <WebStoreProductList mode="manage" managePreset={storeProductManagePreset} />;
      }

      if (activeMenu === 'store_product_coverage') {
          return (
            <WebStoreProductList
              mode="coverage"
              onOpenManageProduct={(preset) => {
                setStoreProductManagePreset(preset);
                setActiveMenu('store_product_list');
              }}
            />
          );
      }

      if (activeMenu === 'store_addon_list') {
          return <WebStoreAttributeManager initialTab="addon" />;
      }

      if (activeMenu === 'store_method_list') {
          return <WebStoreAttributeManager initialTab="method" />;
      }

      if (activeMenu === 'store_attribute_list') {
          return <WebStoreAttributeManager initialTab="addon" />;
      }

      if (activeMenu === 'store_region_list') {
          return <WebStoreRegionList onEditRegion={(region) => setStoreRegionEditorContext(region)} />;
      }

      if (activeMenu === 'required_product_policy') {
          return (
              <WebRequiredProductPolicyList
                  onCreatePolicy={() => setRequiredPolicyEditorContext({ mode: 'create' })}
                  onEditPolicy={(policy) => setRequiredPolicyEditorContext({ mode: 'edit', policy })}
              />
          );
      }

      if (activeMenu === 'attribute_mutex_rules') {
          return (
              <WebAttributeMutexRuleList
                  onCreateRule={() => setAttributeMutexEditorContext({ mode: 'create' })}
                  onEditRule={(rule) => setAttributeMutexEditorContext({ mode: 'edit', rule })}
              />
          );
      }

      if (activeMenu === 'store_category_list') {
          return <WebStoreCategoryList onCancelEntry={() => setActiveMenu(storeCategoryReturnMenu || 'store_product_list')} />;
      }

      if (activeMenu === 'categories') {
          return <WebCategoryListManager />;
      }

      if (activeMenu === 'category_management') {
          return (
             <WebCategoryManager 
                categories={webCategories}
                selectedManageCat={selectedManageCat} 
                setSelectedManageCat={setSelectedManageCat}
                onAdd={addWebCategory}
                onUpdate={updateWebCategory}
                onDelete={deleteWebCategory}
             />
          );
      }

      if (activeMenu === 'recipe_default' || activeMenu === 'recipe_legacy' || activeMenu === 'recipe_new') {
          return (
            <WebRecipeManager
              onNavigate={(path) => {
                setLastRecipeMenu(activeMenu === 'recipe_legacy' ? 'recipe_legacy' : 'recipe_new');
                setActiveMenu(path);
              }}
              newRecipeEnabled={newRecipeEnabled}
              onNewRecipeEnabledChange={(enabled) => {
                setNewRecipeEnabled(enabled);
                if (enabled) {
                  setLastRecipeMenu('recipe_new');
                  if (activeMenu === 'recipe_legacy') {
                    setActiveMenu('recipe_new');
                  }
                }
              }}
            />
          );
      }

      if (activeMenu === 'ingredient_library') {
          return <WebIngredientLibraryManager />;
      }

      if (activeMenu === 'nutrition_manager') {
          return <WebNutritionManager />;
      }

      if (activeMenu === 'addon_group') {
          return <WebAddonGroupManager onBack={() => setActiveMenu(lastRecipeMenu)} />;
      }

      if (activeMenu === 'general_settings') {
          return <WebGeneralSettings />;
      }

      if (activeMenu === 'product_attributes') {
          return <WebProductAttributeManager />;
      }

      if (activeMenu === 'price_systems') {
          return <WebPriceSystemList />;
      }

      if (activeMenu === 'product_sync') {
          return <WebProductSync />;
      }

      if (activeMenu === 'product_template') {
          return <WebProductTemplateManager />;
      }

      // Default: Product List
      return (
         <WebProductList 
            onCreateClick={(type) => {
              setCategorySelectType(type);
            }}
            onImportClick={() => setIsImportModalOpen(true)} 
            onViewDetail={(p: any) => setDetailContext(p)}
            onEditProduct={(p: any) => {
              const matchedCategory = webCategories
                .filter(cat => cat.classification === p.type)
                .find(cat => cat.children?.some(sc => sc.id === p.category));
              const targetCategory = matchedCategory?.children?.find(sc => sc.id === p.category) || webCategories.find(cat => cat.classification === p.type) || categoryData[0];
              setCreationContext({
                type: p.type,
                category: targetCategory,
                mode: 'edit',
                product: p,
              });
            }}
         />
      );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F5F6FA] font-sans text-[14px] text-[#333] overflow-hidden">
      
      {/* Header */}
      <header className="h-[50px] bg-white flex items-center justify-between px-4 z-40 shadow-sm border-b border-[#E8E8E8] shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-[#333] font-bold text-[16px] cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-md transition-colors">
             槐店王婆 <ChevronDown size={14} className="ml-2 text-[#999]"/>
          </div>
          <div className="h-5 w-px bg-gray-200"></div>
          <nav className="flex space-x-2 text-[#666] font-medium text-[13px]">
            <button className="flex items-center hover:bg-gray-100 px-3 py-1.5 rounded-md transition-all">
               <LayoutGrid size={16} className="mr-2"/> 品牌管理
            </button>
            <button className="flex items-center hover:bg-gray-100 px-3 py-1.5 rounded-md transition-all">
               <Clock size={16} className="mr-2"/> 经营洞察
            </button>
            <button className="bg-[#E6F8F0] px-3 py-1.5 rounded-md flex items-center text-[#00C06B] font-bold border border-[#00C06B]/20">
               <Store size={16} className="mr-2"/> 门店业务 <ChevronDown size={14} className="ml-1"/>
            </button>
          </nav>
        </div>
        <div className="flex items-center space-x-6 text-[13px]">
           <div className="relative">
              <Search size={14} className="absolute left-3 top-2 text-[#AAA]"/>
              <input className="bg-[#F2F3F5] border-none rounded-full pl-9 pr-12 py-1.5 w-[240px] transition-all focus:bg-white focus:ring-2 focus:ring-[#00C06B]/20 focus:outline-none" placeholder="搜索功能导航、帮助文档..."/>
              <span className="absolute right-3 top-2 text-[#AAA] text-xs scale-90 bg-white px-1 rounded border border-gray-200">Ctrl+K</span>
           </div>
           <button className="bg-[#5C6BF0] text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#4B5AE0] flex items-center">
             <Settings size={12} className="mr-1.5"/> 使用反馈
           </button>
           <div className="flex items-center space-x-4 text-[#666]">
              <div className="relative cursor-pointer">
                 <Bell size={18}/>
                 <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center border-2 border-white">1</div>
              </div>
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 pr-2 rounded-full transition-all">
                 <div className="w-7 h-7 bg-[#00C06B] rounded-full flex items-center justify-center text-white text-[12px] font-bold">静</div>
                 <span className="font-bold">企迈静静</span>
              </div>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-[200px] bg-white border-r border-[#E8E8E8] flex flex-col pt-2 overflow-y-auto no-scrollbar shrink-0 z-30">
           <div className="px-4 py-3 mb-2">
              <div className="flex items-center font-bold text-[#333] mb-1">
                 <Box size={18} className="mr-2 text-[#00C06B]"/> 商品管理
              </div>
           </div>
           
           {/* Product Archives Group */}
           <div className="mb-1">
              <div 
                 className="flex items-center justify-between px-6 py-2 cursor-pointer text-[#666] hover:text-[#333] text-[13px]"
                 onClick={() => toggleMenu('product_archives')}
              >
                 <span className="font-bold">商品档案</span>
                 {expandedMenus.includes('product_archives') ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </div>
              {expandedMenus.includes('product_archives') && (
                 <div className="mt-1 space-y-0.5">
                    <SidebarItem label="商品管理" active={activeMenu === 'product_list' && !creationContext} onClick={() => { setActiveMenu('product_list'); setCreationContext(null); }} />
                    <SidebarItem label="商品分类" active={activeMenu === 'categories'} onClick={() => { setActiveMenu('categories'); setCreationContext(null); }} />
                    <SidebarItem label="商品属性" active={activeMenu === 'product_attributes'} onClick={() => { setActiveMenu('product_attributes'); setCreationContext(null); }} />
                    <div>
                       <div
                          className="flex items-center justify-between pl-6 pr-6 py-2.5 text-[13px] font-medium cursor-pointer text-[#666] hover:bg-gray-50 hover:text-[#333] transition-all"
                          onClick={() => toggleMenu('product_archives_recipe')}
                       >
                          <span>配方管理</span>
                          {expandedMenus.includes('product_archives_recipe') ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                       </div>
                       {expandedMenus.includes('product_archives_recipe') && (
                          <div className="space-y-0.5">
                             <div className="pl-6">
                                <SidebarItem
                                  label="配料库"
                                  active={activeMenu === 'ingredient_library'}
                                  onClick={() => {
                                    setActiveMenu('ingredient_library');
                                    setCreationContext(null);
                                  }}
                                />
                             </div>
                             <div className="pl-6">
                                <SidebarItem
                                  label="营养成分"
                                  active={activeMenu === 'nutrition_manager'}
                                  onClick={() => {
                                    setActiveMenu('nutrition_manager');
                                    setCreationContext(null);
                                  }}
                                />
                             </div>
                             <div className="pl-6">
                                {!newRecipeEnabled && (
                                  <SidebarItem
                                    label="商品配方"
                                    active={activeMenu === 'recipe_legacy' || (activeMenu === 'addon_group' && lastRecipeMenu === 'recipe_legacy')}
                                    onClick={() => {
                                      setLastRecipeMenu('recipe_legacy');
                                      setActiveMenu('recipe_legacy');
                                      setCreationContext(null);
                                    }}
                                  />
                                )}
                                <SidebarItem
                                  label="新商品配方"
                                  active={activeMenu === 'recipe_new' || (activeMenu === 'addon_group' && lastRecipeMenu === 'recipe_new')}
                                  onClick={() => {
                                    setLastRecipeMenu('recipe_new');
                                    setActiveMenu('recipe_new');
                                    setCreationContext(null);
                                  }}
                                />
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              )}
           </div>

           <div className="mb-1">
              <div
                 className="flex items-center justify-between px-6 py-2 cursor-pointer text-[#666] hover:text-[#333] text-[13px]"
                 onClick={() => toggleMenu('chain_management')}
              >
                 <span className="font-bold">商品运营</span>
                 {expandedMenus.includes('chain_management') ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </div>
              {expandedMenus.includes('chain_management') && (
                 <div className="mt-1 space-y-0.5">
                    <SidebarItem label="商品模板" active={activeMenu === 'product_template'} onClick={() => { setActiveMenu('product_template'); setCreationContext(null); }} />
                    <SidebarItem label="商品同步" active={activeMenu === 'product_sync'} onClick={() => { setActiveMenu('product_sync'); setCreationContext(null); }} />
                    <SidebarItem label="价格策略" active={activeMenu === 'price_systems'} onClick={() => { setActiveMenu('price_systems'); setCreationContext(null); }} />
                    <SidebarItem label="商品推荐" />
                    <SidebarItem label="属性互斥" active={activeMenu === 'attribute_mutex_rules'} onClick={() => { setActiveMenu('attribute_mutex_rules'); setCreationContext(null); setAttributeMutexEditorContext(null); }} />
                    <SidebarItem label="必选商品" active={activeMenu === 'required_product_policy'} onClick={() => { setActiveMenu('required_product_policy'); setCreationContext(null); setRequiredPolicyEditorContext(null); }} />
                 </div>
              )}
           </div>

           {/* Store Products Group (New) */}
           <div className="mb-1">
              <div 
                 className="flex items-center justify-between px-6 py-2 cursor-pointer text-[#666] hover:text-[#333] text-[13px]"
                 onClick={() => toggleMenu('store_products')}
              >
                 <span className="font-bold">门店商品</span>
                 {expandedMenus.includes('store_products') ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </div>
              {expandedMenus.includes('store_products') && (
                 <div className="mt-1 space-y-0.5">
                    <SidebarItem label="门店商品管理" active={activeMenu === 'store_product_list'} onClick={() => { setActiveMenu('store_product_list'); setStoreProductManagePreset(null); setCreationContext(null); }} />
                    <SidebarItem label="商品在售门店" active={activeMenu === 'store_product_coverage'} onClick={() => { setActiveMenu('store_product_coverage'); setCreationContext(null); }} />
                    <SidebarItem label="门店商品分类" active={activeMenu === 'store_category_list'} onClick={() => { setStoreCategoryReturnMenu(activeMenu); setActiveMenu('store_category_list'); setCreationContext(null); }} />
                    <SidebarItem label="门店商品属性" active={['store_attribute_list', 'store_addon_list', 'store_method_list'].includes(activeMenu)} onClick={() => { setActiveMenu('store_attribute_list'); setCreationContext(null); }} />
                    <SidebarItem label="区域商品" active={activeMenu === 'store_region_list'} onClick={() => { setActiveMenu('store_region_list'); setCreationContext(null); setStoreRegionEditorContext(null); }} />
                 </div>
              )}
           </div>

           <div className="mb-1">
              <div
                 className="flex items-center justify-between px-6 py-2 cursor-pointer text-[#666] hover:text-[#333] text-[13px]"
                 onClick={() => toggleMenu('platform_products')}
              >
                 <span className="font-bold">平台商品</span>
                 {expandedMenus.includes('platform_products') ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </div>
              {expandedMenus.includes('platform_products') && (
                 <div className="mt-1 space-y-0.5">
                    <SidebarItem label="菜单管理" />
                    <SidebarItem label="菜单同步" />
                    <SidebarItem label="美团团单" />
                    <SidebarItem label="在线点餐" />
                    <SidebarItem label="商品映射" />
                 </div>
              )}
           </div>

           <div className="mb-1">
              <div 
                 className="flex items-center justify-between px-6 py-2 cursor-pointer text-[#666] hover:text-[#333] text-[13px]"
                 onClick={() => toggleMenu('product_settings')}
              >
                 <span className="font-bold">商品设置</span>
                 {expandedMenus.includes('product_settings') ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </div>
              {expandedMenus.includes('product_settings') && (
                 <div className="mt-1 space-y-0.5">
                    <SidebarItem label="通用设置" active={activeMenu === 'general_settings'} onClick={() => { setActiveMenu('general_settings'); setCreationContext(null); }} />
                    <SidebarItem label="自定义字段" />
                 </div>
              )}
           </div>

           <div className="mt-auto h-4"></div>
        </aside>

        {/* Main Content */}
        {renderContent()}
      </div>

      {/* Global Modals */}
      {isImportModalOpen && <WebImportModal onClose={() => setIsImportModalOpen(false)} />}
      {categorySelectType && (
        <WebCategorySelectModal
          type={categorySelectType}
          categories={webCategories}
          onClose={() => setCategorySelectType(null)}
          onSelect={(selectedCategory) => {
            setCreationContext({ type: categorySelectType, category: selectedCategory });
            setCategorySelectType(null);
          }}
        />
      )}
      {showProductMenuGuide && (
        <div className="absolute inset-0 z-[80] bg-black/35">
          <div className={`pointer-events-none absolute rounded-[18px] border-2 border-[#17C964] bg-white/10 shadow-[0_0_0_9999px_rgba(17,24,39,0.20),0_0_0_6px_rgba(23,201,100,0.12)] ${currentGuideStep.highlightPosition}`}></div>
          <div className={`absolute w-[360px] rounded-[16px] bg-[#17C964] p-5 text-white shadow-[0_18px_48px_rgba(6,78,59,0.28)] ${currentGuideStep.cardPosition}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-full bg-white/16 px-3 py-1 text-[12px] font-black">
                {currentGuideStep.step}
              </div>
            </div>
            <div className="mt-2 rounded-[12px] bg-white/12 p-4">
              <div className="text-[16px] font-black">{currentGuideStep.title}</div>
              <div className="mt-1 text-[13px] leading-6 text-white/90">
                {currentGuideStep.desc}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handlePrevProductMenuGuide}
                disabled={currentProductMenuGuideStep === 0}
                className="rounded-[10px] border border-white/22 px-4 py-2 text-[13px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                上一步
              </button>
              <div className="flex items-center gap-2">
                {productMenuGuideSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2.5 rounded-full transition-all ${
                      index === currentProductMenuGuideStep ? 'w-6 bg-white' : 'w-2.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNextProductMenuGuide}
                className="rounded-[10px] bg-white px-4 py-2 text-[13px] font-black text-[#12A150] shadow-sm transition-colors hover:bg-[#F3FFF8]"
              >
                {currentProductMenuGuideStep === productMenuGuideSteps.length - 1 ? '完成' : '下一步'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};
