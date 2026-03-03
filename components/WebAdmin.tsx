
import React, { useState } from 'react';
import { 
  Box, ChevronDown, ChevronUp, Search, Bell, LayoutGrid, Clock, Settings, Store
} from 'lucide-react';
import { useProducts } from '../context';
import { Category, CategoryFieldConfig } from '../types';
import { SidebarItem } from './web/WebCommon';
import { WebProductList } from './web/WebProductList';
import { WebStoreProductList } from './web/WebStoreProductList'; // Imported new component
import { WebCategoryManager } from './web/WebCategoryManager';
import { WebImportModal, WebCategorySelectModal } from './web/WebModals';
import { WebProductForm } from './web/WebProductForm';

// Extended Category type for Web Admin local state
export interface WebCategory extends Category {
  classification: 'standard' | 'combo';
}

const DEFAULT_STANDARD_FIELDS: CategoryFieldConfig[] = [
  { id: 'p_name', isRequired: true },
  { id: 'p_cat', isRequired: true },
  { id: 'p_img', isRequired: true },
  { id: 'p_unit', isRequired: true },
  { id: 's_price', isRequired: true },
  { id: 's_stock', isRequired: true },
  { id: 's_pack_fee', isRequired: false },
  { id: 'p_desc_tags', isRequired: false },
  { id: 'p_list_desc', isRequired: false },
  { id: 'm_name', isRequired: false },
  { id: 'm_tags', isRequired: false },
  { id: 'a_ref', isRequired: false },
  { id: 'st_member', isRequired: false },
];

const DEFAULT_COMBO_FIELDS: CategoryFieldConfig[] = [
  { id: 'p_name', isRequired: true },
  { id: 'p_cat', isRequired: true },
  { id: 'p_img', isRequired: true },
  { id: 's_price', isRequired: true },
  { id: 's_stock', isRequired: true },
  { id: 'c_groups', isRequired: true },
  { id: 'p_list_desc', isRequired: false },
  { id: 'st_member', isRequired: false },
];

const INITIAL_WEB_CATEGORIES: WebCategory[] = [
  // Standard Categories
  { id: 'w_cat_s1', name: '通用菜品', productCount: 120, standardFields: DEFAULT_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s2', name: '现制饮品', productCount: 45, standardFields: [...DEFAULT_STANDARD_FIELDS, {id: 'm_name', isRequired: true}], comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s3', name: '称重商品', productCount: 15, standardFields: DEFAULT_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s4', name: '蛋糕/烘焙', productCount: 30, standardFields: DEFAULT_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s5', name: '零售商品', productCount: 80, standardFields: DEFAULT_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard' },
  // Combo Categories
  { id: 'w_cat_c1', name: '通用套餐', productCount: 20, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c2', name: '现制饮品套餐', productCount: 10, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c3', name: '蛋糕/烘焙套餐', productCount: 5, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c4', name: '零售套餐', productCount: 8, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c5', name: '火锅锅底', productCount: 12, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
];

export const WebAdmin: React.FC = () => {
  // Navigation State
  const [activeMenu, setActiveMenu] = useState('product_list');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['product_archives', 'store_products']); // Expanded 'store_products' by default for visibility

  // Creation/Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [creationType, setCreationType] = useState<'standard' | 'combo' | null>(null); // Triggers Category Modal
  const [creationContext, setCreationContext] = useState<{ type: 'standard' | 'combo', category: Category } | null>(null); // Triggers Form Page

  // Category Manager State
  const [webCategories, setWebCategories] = useState<WebCategory[]>(INITIAL_WEB_CATEGORIES);
  const [selectedManageCat, setSelectedManageCat] = useState<Category | null>(null);

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
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
                  onClose={() => setCreationContext(null)} 
              />
          );
      }

      if (activeMenu === 'store_product_list') {
          return <WebStoreProductList />;
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

      // Default: Product List
      return (
         <WebProductList 
            onCreateClick={setCreationType} 
            onImportClick={() => setIsImportModalOpen(true)} 
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
                    <SidebarItem label="商品属性" />
                    <SidebarItem label="价格体系" />
                    <SidebarItem label="属性互斥规则" />
                    <SidebarItem label="商品推荐" />
                    <SidebarItem label="模板管理" />
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
                    <SidebarItem label="全部商品" active={activeMenu === 'store_product_list'} onClick={() => { setActiveMenu('store_product_list'); setCreationContext(null); }} />
                    <SidebarItem label="门店商品属性" />
                    <SidebarItem label="门店做法" />
                    <SidebarItem label="门店区域" />
                    <SidebarItem label="必选商品" />
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
      
      {/* Category Selection Modal */}
      {creationType && (
        <WebCategorySelectModal 
          type={creationType} 
          onClose={() => setCreationType(null)} 
          categories={webCategories.filter(c => c.classification === creationType)} 
          onSelect={(category) => {
              setCreationType(null); // Close modal
              setCreationContext({ type: creationType, category }); // Open full page form
          }}
        />
      )}

    </div>
  );
};
