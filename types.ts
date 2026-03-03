
export type ManagementMode = 'strict' | 'empower' | 'light';

export interface SourcePermission {
  source: 'brand' | 'store';
  editableFields: string[]; 
  allowDelete: boolean;
  needsAudit: boolean;
}

export interface ManagementPolicy {
  id: string;
  name: string;
  applicableBrands: number;
  status: 'active' | 'disabled';
  sync: {
    mode: 'auto' | 'manual';
    syncFieldsMode: 'all' | 'partial';
    autoSyncFields: string[]; 
    autoSyncImage: boolean;
  };
  permission: {
    canStoreCreate: 'allow' | 'audit' | 'forbidden';
    canStoreEdit: boolean; 
    brandSource: SourcePermission;
    storeSource: SourcePermission;
    priceLimit: {
      enable: boolean;
      maxDeviation: number;
    };
  };
  template: {
    enable: boolean; 
    editableFields: string[]; 
  };
  lifecycle: {
    deleteFlow: 'recycle' | 'direct';
  };
}

export interface ChannelGroup {
  id: string;
  name: string;
  description?: string;
  channels: string[];
}

export interface BrandConfig {
  policyId: string;
  customPolicy?: ManagementPolicy;
  features: {
    stock_shared: boolean;
    auto_mapping: boolean;
    markup_type: boolean;
    batch_check: boolean;
    shelves_unite: boolean;
    class_sort: boolean;
    app_get_data: boolean;
    new_edit_page: boolean;
    store_export: boolean;
    upgrade_3_0: boolean;
  };
  enableChannelGrouping?: boolean;
  channelGroups?: ChannelGroup[];
}

export const MOCK_BRANDS = [
  { id: 'b_1', name: '槐店王婆 (主品牌)', icon: '👑', type: '餐饮·火锅' },
  { id: 'b_2', name: '槐店·茶饮 (子品牌)', icon: '🧋', type: '餐饮·茶饮' },
  { id: 'b_3', name: '槐店·烘焙 (子品牌)', icon: '🥐', type: '餐饮·烘焙' },
  { id: 'b_4', name: '槐店·零售 (子品牌)', icon: '🛍️', type: '零售·百货' }
];

export type IndustryTemplateId = 
  | 'drinks' | 'chinese' | 'western' | 'bakery' | 'retail';

export const INDUSTRY_BLUEPRINT: { id: IndustryTemplateId; name: string; icon: string; description: string }[] = [
  { id: 'drinks', name: '现制饮品', icon: '🧋', description: '适用于奶茶、咖啡、果茶店' },
  { id: 'chinese', name: '中式正餐', icon: '🥢', description: '适用于火锅、炒菜、烧烤店' },
  { id: 'western', name: '西式快餐', icon: '🍔', description: '适用于牛排、汉堡、披萨店' },
  { id: 'bakery', name: '烘焙甜品', icon: '🍰', description: '适用于蛋糕、面包、甜品店' },
  { id: 'retail', name: '零售商品', icon: '🛒', description: '适用于便利店、文创店' },
];

export const CATEGORIES = ['全部', '现制饮品', '中式正餐', '西式快餐', '烘焙甜品', '零售商品'];

export type FieldModule = 'base' | 'product_attr' | 'sales' | 'display' | 'others';

export type ControlType = 'input' | 'number' | 'switch' | 'image' | 'textarea' | 'tag_group' | 'selector' | 'rich_text' | 'ref_selector';

export interface DynamicFieldConfig {
  id: string;
  label: string;
  module: FieldModule;
  type: ControlType;
  description?: string;
  isBase?: boolean;
  isSystem?: boolean; // 系统内置字段，不可取消选中/删除
  isDefaultSelected?: boolean; // 父级选中时默认选中的三级字段
  presetValues?: string[];
  children?: DynamicFieldConfig[]; // 细分配置子字段 (三级)
  
  applyToTypes?: ('standard' | 'combo')[]; 
  applyToCategories?: string[]; 
  applyToBrands?: string[]; 
  isRequired?: boolean; 
  sortOrder?: number; 
  isHidden?: boolean; 
  placeholder?: string; 
}

export const AVAILABLE_DYNAMIC_FIELDS: DynamicFieldConfig[] = [
  // 1. 基础属性 (base)
  { id: 'p_name', label: '商品名称', module: 'base', type: 'input', isBase: true, isSystem: true, sortOrder: 10, isRequired: true },
  { id: 'p_alias', label: '商品别名', module: 'base', type: 'input', sortOrder: 20 },
  { id: 'p_code', label: '数字助记码', module: 'base', type: 'input', sortOrder: 30 },
  { id: 'p_front_cat', label: '前台分类', module: 'base', type: 'selector', applyToBrands: ['b_1', 'b_2'], sortOrder: 40 },
  { id: 'p_cat', label: '商品类目', module: 'base', type: 'selector', isBase: true, isSystem: true, sortOrder: 50, isRequired: false },
  { id: 'p_unit', label: '计量单位', module: 'base', type: 'input', isBase: true, isSystem: true, sortOrder: 60, isRequired: true },
  { id: 'p_weight_flag', label: '是否为称重商品', module: 'base', type: 'switch', sortOrder: 70 },

  // 2. 商品属性 (product_attr)
  { 
    id: 's_specs', label: '规格设置', module: 'product_attr', type: 'tag_group', isBase: true, sortOrder: 10, 
    children: [
        { id: 's_spec_name', label: '规格名称', module: 'product_attr', type: 'input', isSystem: true, isDefaultSelected: true, sortOrder: 1 },
        { id: 's_spec_price', label: '销售价格', module: 'product_attr', type: 'number', isSystem: true, isDefaultSelected: true, sortOrder: 2 },
        { id: 's_spec_cost', label: '成本价', module: 'product_attr', type: 'number', sortOrder: 3 },
        { id: 's_spec_market', label: '市场价格', module: 'product_attr', type: 'number', sortOrder: 4 },
        { id: 's_spec_stock', label: '库存设置', module: 'product_attr', type: 'number', isSystem: true, isDefaultSelected: true, sortOrder: 5 },
        { id: 's_spec_img', label: '规格独立图片', module: 'product_attr', type: 'image', sortOrder: 6 },
        { id: 's_spec_code', label: '规格编码', module: 'product_attr', type: 'input', sortOrder: 7 },
    ]
  },
  { 
    id: 'm_methods', label: '做法配置', module: 'product_attr', type: 'tag_group', sortOrder: 20,
    children: [
        { id: 'm_method_name', label: '做法名称', module: 'product_attr', type: 'input', isSystem: true, isDefaultSelected: true, sortOrder: 1 },
        { id: 'm_method_markup', label: '做法加价', module: 'product_attr', type: 'number', isDefaultSelected: true, sortOrder: 2 },
        { id: 'm_method_code', label: '做法编码', module: 'product_attr', type: 'input', sortOrder: 3 }
    ]
  },
  { id: 'a_addons', label: '加料配置', module: 'product_attr', type: 'ref_selector', sortOrder: 30 },
  { id: 'c_groups', label: '套餐分组', module: 'product_attr', type: 'tag_group', presetValues: ['主食区', '加餐小食', '饮品区'], sortOrder: 40 },

  // 3. 销售信息 (sales)
  { id: 's_price', label: '基础售价', module: 'sales', type: 'number', isBase: true, isSystem: true, sortOrder: 10, isRequired: true },
  { id: 's_cost', label: '成本价', module: 'sales', type: 'number', sortOrder: 20 },
  { id: 's_market_price', label: '市场价格', module: 'sales', type: 'number', sortOrder: 30 },
  { id: 's_pack_fee', label: '包装费', module: 'sales', type: 'number', sortOrder: 40 },
  { id: 's_stock', label: '库存设置', module: 'sales', type: 'number', isBase: true, isSystem: true, sortOrder: 50 },
  { id: 's_limit', label: '起购/限购数量', module: 'sales', type: 'number', sortOrder: 60 },
  { id: 's_pos_edit', label: 'POS临时改价', module: 'sales', type: 'switch', sortOrder: 70 },

  // 4. 展示信息 (display)
  { id: 'p_img', label: '商品主图', module: 'display', type: 'image', isBase: true, sortOrder: 10 },
  { id: 'p_list_desc', label: '列表页简述', module: 'display', type: 'textarea', sortOrder: 20 },
  { id: 'p_stat_tags', label: '统计标签', module: 'display', type: 'tag_group', sortOrder: 30 },
  { id: 'p_desc_tags', label: '描述标签', module: 'display', type: 'tag_group', presetValues: ['店长推荐', '新品', '无糖低脂'], sortOrder: 40 },
  { id: 'p_order_tags', label: '点单标签', module: 'display', type: 'tag_group', applyToBrands: ['b_1'], sortOrder: 50 },
  { id: 'p_badge', label: '商品角标', module: 'display', type: 'image', sortOrder: 60 },
  { id: 'p_video', label: '商品视频', module: 'display', type: 'image', sortOrder: 70 },
  { id: 'p_rich_desc', label: '详情页描述', module: 'display', type: 'rich_text', isBase: true, sortOrder: 80 },

  // 5. 其他信息 (others)
  { id: 'st_member', label: '会员折扣/积分', module: 'others', type: 'switch', applyToBrands: ['b_1', 'b_2', 'b_3'], sortOrder: 10 },
  { id: 'o_tax', label: '税率设置', module: 'others', type: 'number', sortOrder: 20 },
  { id: 'o_invoice', label: '开票项目', module: 'others', type: 'input', sortOrder: 30 },
  { id: 'o_origin', label: '生产地', module: 'others', type: 'input', sortOrder: 40 },
  { id: 'o_ingredients', label: '原料说明', module: 'others', type: 'textarea', sortOrder: 50 },
];

export interface CategoryFieldConfig {
  id: string;
  isRequired: boolean;
  childConfigs?: Record<string, boolean>; // 子字段状态 (ID -> 是否启用)
  childRequiredConfigs?: Record<string, boolean>; // 子字段必填状态 (ID -> 是否必填)
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  industryMapping?: IndustryTemplateId;
  productCount: number;
  standardFields: CategoryFieldConfig[]; 
  comboFields: CategoryFieldConfig[];
  children?: Category[];
  source?: 'system' | 'brand'; 
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  status: 'on_shelf' | 'off_shelf';
  stockStatus: 'available' | 'sold_out';
  image: string;
  skuCode: string;
  type: 'standard' | 'combo';
  industryId: IndustryTemplateId;
  createdTime: string;
  isCombo?: boolean;
  // 新增多规格支持
  isMultiSpec?: boolean;
  stock?: number; // 单规格库存，-1表示无限(9999)
  specs?: { name: string; stock: number; price?: number; unlimited?: boolean }[];
}

const mockFields = (ids: string[]) => ids.map(id => ({ id, isRequired: false }));

export const INITIAL_CATEGORIES: Category[] = [
  { 
    id: 'cat_1', name: '现制饮品', productCount: 45, standardFields: [], comboFields: [], source: 'system',
    children: [
      { id: 'c1_1', name: '奶茶类', productCount: 12, standardFields: mockFields(['m_methods', 'a_addons']), comboFields: [], source: 'system' },
      { id: 'c1_2', name: '咖啡类', productCount: 8, standardFields: mockFields(['m_methods']), comboFields: [], source: 'system' },
    ]
  },
  {
    id: 'cat_2', name: '中式正餐', productCount: 120, standardFields: [], comboFields: [], source: 'system',
    children: [
      { id: 'c2_1', name: '火锅锅底', productCount: 5, standardFields: [], comboFields: [], source: 'system' },
      { id: 'c2_5', name: '炒菜/烧菜类', productCount: 25, standardFields: [], comboFields: [], source: 'system' },
    ]
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "槐店生椰拿铁",
    price: 28,
    category: "c1_2",
    status: "on_shelf",
    stockStatus: "available",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=200",
    skuCode: "SKU10001",
    type: "standard",
    industryId: 'drinks',
    createdTime: "2025-01-20 10:00:00",
    isMultiSpec: false,
    stock: 100
  },
  {
    id: "prod_2",
    name: "美式咖啡（多规格）",
    price: 22,
    category: "c1_2",
    status: "on_shelf",
    stockStatus: "available",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200",
    skuCode: "SKU10002",
    type: "standard",
    industryId: 'drinks',
    createdTime: "2025-01-22 10:00:00",
    isMultiSpec: true,
    specs: [
      { name: '中杯', stock: 50, price: 22 },
      { name: '大杯', stock: 10, unlimited: true, price: 25 },
      { name: '超大杯', stock: 0, price: 28 }
    ]
  }
];