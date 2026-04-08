
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Product, Category, ManagementPolicy, BrandConfig, 
  INITIAL_CATEGORIES, INITIAL_PRODUCTS, MOCK_BRANDS 
} from './types';

// Mock Policies
const INITIAL_POLICIES: ManagementPolicy[] = [
  {
    id: 'p_1',
    name: '强管控全量同步模式',
    applicableBrands: 82,
    status: 'active',
    sync: {
      mode: 'auto',
      syncFieldsMode: 'all',
      autoSyncFields: [],
      autoSyncImage: true
    },
    permission: {
      canStoreCreate: 'forbidden',
      canStoreEdit: false,
      brandSource: { source: 'brand', editableFields: [], allowDelete: false, needsAudit: true },
      storeSource: { source: 'store', editableFields: [], allowDelete: false, needsAudit: true },
      priceLimit: { enable: true, maxDeviation: 0 }
    },
    template: { enable: false, editableFields: [] },
    lifecycle: { deleteFlow: 'recycle' }
  },
  {
    id: 'p_2',
    name: '弱管控自主经营模式',
    applicableBrands: 15,
    status: 'active',
    sync: {
      mode: 'manual',
      syncFieldsMode: 'partial',
      autoSyncFields: ['p_name', 'p_cat', 'p_img'], // Basic info only
      autoSyncImage: false
    },
    permission: {
      canStoreCreate: 'allow',
      canStoreEdit: true,
      brandSource: { source: 'brand', editableFields: ['s_price', 's_stock', 'p_desc'], allowDelete: false, needsAudit: false },
      storeSource: { source: 'store', editableFields: [], allowDelete: true, needsAudit: false },
      priceLimit: { enable: false, maxDeviation: 0 }
    },
    template: { enable: true, editableFields: ['s_price', 's_stock'] },
    lifecycle: { deleteFlow: 'direct' }
  }
];

// Initial config for the main brand 'b_1'
const INITIAL_BRAND_CONFIGS: Record<string, BrandConfig> = {
  'b_1': {
    policyId: INITIAL_POLICIES[0].id,
    features: {
      stock_shared: false, // Default changed to false
      auto_mapping: false,
      markup_type: false,
      batch_check: true,
      shelves_unite: false, // Default changed to false
      class_sort: true,
      app_get_data: false,
      new_edit_page: true,
      store_export: true,
      upgrade_3_0: true
    },
    enableChannelGrouping: true,
    channelGroups: [
        { id: 'cg_self', name: '自营渠道', channels: ['pos', 'mini_dine', 'mini_take', 'mini_pickup'] },
        { id: 'cg_third', name: '三方外卖', channels: ['meituan', 'taobao', 'jingdong'] }
    ],
    posStockoutMode: 'spu',
    posStockoutWarningThreshold: 30
  }
};

interface ProductContextType {
  products: Product[];
  categories: Category[];
  policies: ManagementPolicy[];
  brandConfigs: Record<string, BrandConfig>;
  activeBrandId: string;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addPolicy: (policy: ManagementPolicy) => void;
  updatePolicy: (id: string, updates: Partial<ManagementPolicy>) => void;
  deletePolicy: (id: string) => void;
  updateBrandConfig: (brandId: string, config: BrandConfig) => void;
  setActiveBrandId: (id: string) => void;
  toggleShelfStatus: (id: string) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [policies, setPolicies] = useState<ManagementPolicy[]>(INITIAL_POLICIES);
  const [brandConfigs, setBrandConfigs] = useState<Record<string, BrandConfig>>(INITIAL_BRAND_CONFIGS);
  const [activeBrandId, setActiveBrandId] = useState<string>('b_1');

  const addProduct = (product: Product) => setProducts([...products, product]);
  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };
  const deleteProduct = (id: string) => setProducts(products.filter(p => p.id !== id));

  const addCategory = (category: Category) => setCategories([...categories, category]);
  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteCategory = (id: string) => setCategories(categories.filter(c => c.id !== id));

  const addPolicy = (policy: ManagementPolicy) => setPolicies([...policies, policy]);
  const updatePolicy = (id: string, updates: Partial<ManagementPolicy>) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, ...updates } : p));
  };
  const deletePolicy = (id: string) => setPolicies(policies.filter(p => p.id !== id));

  const updateBrandConfig = (brandId: string, config: BrandConfig) => {
    setBrandConfigs(prev => ({ ...prev, [brandId]: config }));
  };

  const toggleShelfStatus = (id: string) => {
      setProducts(prev => prev.map(p => {
          if (p.id !== id) return p;
          return { ...p, status: p.status === 'on_shelf' ? 'off_shelf' : 'on_shelf' };
      }));
  };

  return (
    <ProductContext.Provider value={{
      products, categories, policies, brandConfigs, activeBrandId,
      addProduct, updateProduct, deleteProduct,
      addCategory, updateCategory, deleteCategory,
      addPolicy, updatePolicy, deletePolicy,
      updateBrandConfig, setActiveBrandId,
      toggleShelfStatus
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
