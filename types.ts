
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
  posStockoutMode?: 'spu' | 'sku'; // POS沽清模式 (SPU / SKU)
  posStockoutWarningThreshold?: number; // POS已沽清列表预警阈值
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

export type ControlType = 'input' | 'number' | 'switch' | 'image' | 'textarea' | 'tag_group' | 'selector' | 'rich_text' | 'ref_selector' | 'radio_group' | 'checkbox_group';

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

export interface FieldChildOption {
  id: string;
  label: string;
  isSystem?: boolean;
  isDefaultSelected?: boolean;
  description?: string;
}

export const COMMON_FIELD_CHILD_CONFIG_LIBRARY: Record<string, FieldChildOption[]> = {
  p_display_type: [
    { id: 'blind_box', label: '盲盒商品', isDefaultSelected: true, description: '适用于套餐盲盒等特殊售卖场景。' },
    { id: 'display_product', label: '展示商品', isDefaultSelected: true, description: '前端仅展示，不支持直接下单结算。' },
    { id: 'group_meal', label: '团餐商品', isDefaultSelected: true, description: '用于团餐或统一套餐业务场景。' },
    { id: 'group_meal_only', label: '仅团餐业务售卖', isDefaultSelected: true, description: '开启后仅在团餐业务中展示和售卖。' },
    { id: 'pos_edit_price', label: 'POS 临时改价', isDefaultSelected: true, description: '门店 POS 端支持临时改价。' },
    { id: 'temp_product', label: '临时商品', isDefaultSelected: true, description: '用于临时菜品或按次上新的商品。' },
    { id: 'market_price_product', label: '时价商品', isDefaultSelected: true, description: '支持 POS 端按实时价格售卖。' },
    { id: 'children_meal', label: '儿童餐', isDefaultSelected: true, description: '小程序可按儿童餐场景进行展示。' },
  ],
  s_specs: [
    { id: 's_spec_name', label: '规格名称', isSystem: true, isDefaultSelected: true, description: '规格首列名称，默认保留。' },
    { id: 's_spec_price', label: '销售价', isSystem: true, isDefaultSelected: true, description: '规格价格设置中的核心字段。' },
    { id: 's_spec_market', label: '市场价', isDefaultSelected: true, description: '规格市场划线价。' },
    { id: 's_spec_cost', label: '预估成本价', isDefaultSelected: true, description: '规格成本或预估成本。' },
    { id: 's_spec_barcode', label: '商品条码', isDefaultSelected: true, description: '规格对应的商品条码。' },
    { id: 's_spec_mark', label: '商品标识', isDefaultSelected: true, description: '规格标识或内部识别码。' },
    { id: 's_spec_sku_code', label: '商品规格码', isDefaultSelected: true, description: '规格 SKU 编码字段。' },
    { id: 's_spec_code', label: '商品编码', isDefaultSelected: true, description: '规格商品编码。' },
    { id: 's_spec_stock', label: '库存设置', isSystem: true, isDefaultSelected: true, description: '库存模式与初始库存。' },
    { id: 's_spec_plan_stock', label: '计划库存', isDefaultSelected: true, description: '计划库存开关与每日计划库存。' },
    { id: 's_spec_img', label: '规格图片', isDefaultSelected: true, description: '规格独立图片上传。' },
    { id: 's_spec_large_img', label: '规格大图', isDefaultSelected: true, description: '规格大图，优先用于规格区域展示，建议尺寸 800*450。' },
    { id: 's_spec_alias', label: '规格别名', isDefaultSelected: true, description: '规格别名文案。' },
    { id: 's_spec_amount', label: '商品分量', isDefaultSelected: true, description: '规格分量与单位。' },
    { id: 's_spec_store_pack_fee', label: '到店外带包装费', isDefaultSelected: true, description: '到店外带场景包装费。' },
    { id: 's_spec_store_pack_mark', label: '到店外带包装标识', isDefaultSelected: true, description: '到店外带包装标识。' },
    { id: 's_spec_take_pack_fee', label: '外卖配送包装费', isDefaultSelected: true, description: '外卖配送包装费。' },
    { id: 's_spec_take_pack_mark', label: '外卖配送包装标识', isDefaultSelected: true, description: '外卖配送包装标识。' },
  ],
  m_methods: [
    { id: 'm_method_name', label: '做法值', isSystem: true, isDefaultSelected: true, description: '做法值名称，默认保留。' },
    { id: 'm_method_sync', label: '同步', isDefaultSelected: true, description: '是否同步到相关规格或门店。' },
    { id: 'm_method_markup', label: '做法加价', isDefaultSelected: true, description: '做法附加价格。' },
    { id: 'm_method_code', label: '标识码', isDefaultSelected: true, description: '做法编码或标识码。' },
    { id: 'm_method_remark', label: '备注', isDefaultSelected: true, description: '做法备注信息。' },
    { id: 'm_method_tip', label: '温馨提示', isDefaultSelected: true, description: '前台温馨提示文案。' },
  ],
  a_addons: [
    { id: 'a_rule_scope', label: '加料配置', isDefaultSelected: true, description: '限制所有加料购买总量或限制单个加料购买量。' },
    { id: 'a_rule_unlimited', label: '点餐时数量不限', isDefaultSelected: true, description: '加料数量不限的规则项。' },
    { id: 'a_rule_limit', label: '点餐时起购限购数', isDefaultSelected: true, description: '控制起购与限购规则。' },
    { id: 'a_rule_required', label: '点餐时必选', isDefaultSelected: true, description: '配置加料必选规则。' },
    { id: 'a_addon_name', label: '加料商品名称', isSystem: true, isDefaultSelected: true, description: '加料表格中的商品名称列。' },
    { id: 'a_addon_code', label: '加料商品编码', isDefaultSelected: true, description: '加料商品编码列。' },
    { id: 'a_addon_limit', label: '限购', isDefaultSelected: true, description: '加料单项限购值。' },
    { id: 'a_addon_price', label: '初始价格', isDefaultSelected: true, description: '加料基础价格。' },
    { id: 'a_addon_spec_price', label: '规格加价', isDefaultSelected: true, description: '不同规格下的加价设置入口。' },
    { id: 'a_addon_status', label: '商品状态', isDefaultSelected: true, description: '加料商品当前启停状态。' },
    { id: 'a_empty_tip', label: '加料未点提示', isDefaultSelected: true, description: '未选择加料时的提示文案与说明。' },
  ],
};

export const AVAILABLE_DYNAMIC_FIELDS: DynamicFieldConfig[] = [
  // 1. 基础属性 (base)
  { id: 'p_name', label: '商品名称', module: 'base', type: 'input', isBase: true, isSystem: true, sortOrder: 10, isRequired: true, placeholder: '请输入商品名称' },
  { id: 'p_alias', label: '商品别名', module: 'base', type: 'input', sortOrder: 20, placeholder: '请输入商品别名' },
  { id: 'p_code', label: '数字助记码', module: 'base', type: 'input', sortOrder: 30, description: '便于仓边收银使用助记码查找商品', placeholder: '请输入商品助记码' },
  { id: 'p_front_cat', label: '前台分类', module: 'base', type: 'selector', applyToBrands: ['b_1', 'b_2'], sortOrder: 40, isRequired: true, description: '用于前台展示，如小程序、美团、淘宝闪购等渠道的分类展示', presetValues: ['热销推荐', '奶茶系列', '咖啡系列', '果茶系列'] },
  { id: 'p_back_cat', label: '后台分类', module: 'base', type: 'selector', sortOrder: 45, description: '用于店铺内部经营管理和数据统计等，不在前台展示', presetValues: ['常规商品', '新品商品', '活动商品', '原料商品'] },
  { id: 'p_cat', label: '商品类目', module: 'base', type: 'selector', isBase: true, isSystem: true, sortOrder: 50, isRequired: false },
  { id: 'p_applicable_people', label: '适用人数', module: 'base', type: 'number', isSystem: true, sortOrder: 51, isRequired: true, description: '每售出 1 份自助餐门票所覆盖的用餐人数' },
  { id: 'p_deposit_required', label: '是否收取押金', module: 'base', type: 'switch', isSystem: true, sortOrder: 52, description: '开启后，POS 收银时将按押金业务流程处理' },
  { id: 'p_weight_flag', label: '是否称重商品', module: 'base', type: 'switch', sortOrder: 52, description: '用于企迈 POS 端称重商品业务，开启后商品不支持多规格' },
  { id: 'p_unit', label: '计量单位', module: 'base', type: 'input', isBase: true, isSystem: true, sortOrder: 53, isRequired: false },
  { id: 'p_display_type', label: '商品展示类型', module: 'base', type: 'checkbox_group', sortOrder: 55, description: '为商品配置特殊标识用于个性化业务场景' },
  { id: 'p_remark', label: '备注', module: 'base', type: 'textarea', sortOrder: 60, description: '用于标记商品，以便识别同名商品', placeholder: '请输入备注' },
  { id: 'p_stat_tags', label: '统计标签', module: 'base', type: 'selector', sortOrder: 70, description: '用于商品报表统计，最多支持 4 个', presetValues: ['销量统计', '活动统计', '成本统计', '渠道统计'] },
  { id: 'p_tare_weight', label: '商品皮重', module: 'base', type: 'number', sortOrder: 80, description: '用于称重商品去除包装皮重' },

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
        { id: 's_spec_large_img', label: '规格大图', module: 'product_attr', type: 'image', sortOrder: 7 },
        { id: 's_spec_code', label: '规格编码', module: 'product_attr', type: 'input', sortOrder: 8 },
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
  { id: 'p_points_exchange_rule', label: '积分兑换规则', module: 'product_attr', type: 'switch', sortOrder: 35 },
  { id: 'c_groups', label: '套餐分组', module: 'product_attr', type: 'tag_group', presetValues: ['主食区', '加餐小食', '饮品区'], sortOrder: 40 },

  // 3. 销售信息 (sales)
  { id: 's_price', label: '基础售价', module: 'sales', type: 'number', isBase: true, isSystem: true, sortOrder: 10, isRequired: true },
  { id: 's_cost', label: '成本价', module: 'sales', type: 'number', sortOrder: 20 },
  { id: 's_market_price', label: '市场价格', module: 'sales', type: 'number', sortOrder: 30 },
  { id: 's_pack_fee', label: '包装费', module: 'sales', type: 'number', sortOrder: 40 },
  { id: 's_stock', label: '库存设置', module: 'sales', type: 'number', isBase: true, isSystem: true, sortOrder: 50 },
  { id: 's_limit', label: '起购/限购数量', module: 'sales', type: 'number', sortOrder: 60 },
  { id: 's_pos_edit', label: 'POS临时改价', module: 'sales', type: 'switch', sortOrder: 70 },
  { id: 's_min_purchase_toggle', label: '起购数量', module: 'sales', type: 'switch', sortOrder: 80 },
  { id: 's_min_purchase_value', label: '起购数量值', module: 'sales', type: 'number', sortOrder: 81 },
  { id: 's_max_purchase_toggle', label: '限购数量', module: 'sales', type: 'switch', sortOrder: 82 },
  { id: 's_max_purchase_value', label: '限购数量值', module: 'sales', type: 'number', sortOrder: 83 },
  { id: 's_time_sale_toggle', label: '分时段销售', module: 'sales', type: 'switch', sortOrder: 84 },
  { id: 's_time_sale_rule', label: '分时段规则', module: 'sales', type: 'input', sortOrder: 85 },
  { id: 's_sale_mode', label: '售卖方式', module: 'sales', type: 'radio_group', presetValues: ['正常售卖', '仅在套餐售卖'], sortOrder: 86 },
  { id: 's_sale_settings', label: '售卖设置', module: 'sales', type: 'checkbox_group', presetValues: ['单点不送', '关联档口', '参与会员折扣'], sortOrder: 87 },
  { id: 's_takeout_rule', label: '外带显示规则', module: 'sales', type: 'radio_group', presetValues: ['正常售卖', '外带时隐藏', '仅外带显示'], sortOrder: 88 },
  { id: 's_tax_rate', label: '税率', module: 'sales', type: 'selector', sortOrder: 89 },

  // 4. 展示信息 (display)
  { id: 'p_img', label: '商品主图', module: 'display', type: 'image', isBase: true, sortOrder: 10 },
  { id: 'p_list_desc', label: '列表页简述', module: 'display', type: 'textarea', sortOrder: 20 },
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
  { id: 'o_print_stat_test', label: '测试打印统计', module: 'others', type: 'radio_group', presetValues: ['番茄酱', '糖醋酱'], sortOrder: 60 },
  { id: 'o_1202_attr', label: '1202属性', module: 'others', type: 'checkbox_group', presetValues: ['多选1', '多选2', '多选3', '多选4', '多选5', '多选6', '多选7', '多选8'], sortOrder: 70 },
];

export interface CategoryFieldConfig {
  id: string;
  isRequired: boolean;
  displayMode?: 'visible' | 'collapsed' | 'hidden'; // 字段展示模式
  childConfigs?: Record<string, boolean | 'visible' | 'collapsed' | 'hidden'>; // 子字段展示状态，仅支持 visible/hidden，兼容历史 collapsed
  childRequiredConfigs?: Record<string, boolean>; // 子字段必填状态 (ID -> 是否必填)
}

export const CHILD_REQUIRED_FIELD_DEPENDENCIES: Record<string, Record<string, string[]>> = {
  s_specs: {
    s_spec_price: ['s_price'],
    s_spec_stock: ['s_stock'],
    s_spec_store_pack_fee: ['s_pack_fee'],
    s_spec_take_pack_fee: ['s_pack_fee'],
  },
};

export const resolveChildRequiredConfigs = (
  fieldId: string,
  fieldConfigs: CategoryFieldConfig[] | Map<string, CategoryFieldConfig>,
  currentRequiredConfigs?: Record<string, boolean>
) => {
  const dependencies = CHILD_REQUIRED_FIELD_DEPENDENCIES[fieldId];
  const mergedRequiredConfigs = { ...(currentRequiredConfigs || {}) };

  if (dependencies) {
    const configMap = fieldConfigs instanceof Map
      ? fieldConfigs
      : new Map(fieldConfigs.map(item => [item.id, item]));

    Object.entries(dependencies).forEach(([childId, requiredFieldIds]) => {
      if (mergedRequiredConfigs[childId]) return;
      if (requiredFieldIds.some(requiredFieldId => !!configMap.get(requiredFieldId)?.isRequired)) {
        mergedRequiredConfigs[childId] = true;
      }
    });
  }

  return Object.keys(mergedRequiredConfigs).length > 0 ? mergedRequiredConfigs : undefined;
};

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
  classification?: 'standard' | 'combo';
  businessType?: 'buffet_ticket';
}

export interface TimeRule {
  id: string;
  days: number[];
  times: string[];
}

export interface TimeSalesConfig {
  startDate: string;
  endDate: string;
  rules: TimeRule[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  status: 'on_shelf' | 'off_shelf' | 'draft';
  stockStatus: 'available' | 'sold_out';
  image: string;
  skuCode: string;
  type?: 'standard' | 'combo';
  industryId?: IndustryTemplateId;
  createdTime?: string;
  isCombo?: boolean;
  // 新增多规格支持
  isMultiSpec?: boolean;
  stock?: number; // 单规格库存，-1表示无限(9999)
  specs?: { name: string; stock: number; price?: number; unlimited?: boolean }[];
  timeSales?: TimeSalesConfig | null;
  linkedStallIds?: string[];
  comboItemIds?: string[];
  businessType?: 'buffet_ticket';
  applicablePeople?: number;
  depositRequired?: boolean;
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
  { id: '1', name: '招牌珍珠奶茶', price: 18, category: '现制饮品', status: 'on_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=200&h=200&fit=crop', skuCode: '1001', stock: 100, isMultiSpec: true, specs: [{name: '中杯/热/少糖', stock: 50}, {name: '大杯/冷/正常糖', stock: 20}] },
  { id: '2', name: '手打柠檬茶', price: 22, category: '现制饮品', status: 'on_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&h=200&fit=crop', skuCode: '1002', stock: 85 },
  { id: '3', name: '黑糖波波鲜奶', price: 24, category: '现制饮品', status: 'off_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&h=200&fit=crop', skuCode: '1003', stock: 0 },
  { id: '4', name: '多肉葡萄', price: 28, category: '现制饮品', status: 'on_shelf', stockStatus: 'sold_out', image: 'https://images.unsplash.com/photo-1626803775151-61d756612fcd?w=200&h=200&fit=crop', skuCode: '1004', stock: 0 },
  { id: '5', name: '麻辣火锅底料', price: 45, category: '中式正餐', status: 'on_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&h=200&fit=crop', skuCode: '2001', stock: 200 },
  { id: '6', name: '经典牛肉汉堡', price: 32, category: '西式快餐', status: 'on_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', skuCode: '3001', stock: 50 },
  { id: '7', name: '提拉米苏蛋糕', price: 38, category: '烘焙甜品', status: 'on_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=200&h=200&fit=crop', skuCode: '4001', stock: 15 },
  { id: '8', name: '精品挂耳咖啡', price: 59, category: '零售商品', status: 'on_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=200&fit=crop', skuCode: '5001', stock: 500 },
  // 新增 Mock 数据以覆盖更多场景
  { id: '9', name: '季节限定樱花拿铁', price: 35, category: '现制饮品', status: 'off_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=200&h=200&fit=crop', skuCode: '1005', stock: 100 }, // 已下架
  { id: '10', name: '超值双人套餐', price: 88, category: '西式快餐', status: 'on_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200&h=200&fit=crop', skuCode: '3002', stock: 20, type: 'combo', comboItemIds: ['1', '6'] }, // 套餐
  { id: '11', name: '库存紧张示例商品', price: 15, category: '零售商品', status: 'on_shelf', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1584736286279-4a858e984928?w=200&h=200&fit=crop', skuCode: '5002', stock: 5, isMultiSpec: true, specs: [{name: '小', stock: 2}, {name: '大', stock: 3}] }, // 库存紧张
  { id: '12', name: '杨枝甘露测试稿', price: 26, category: '现制饮品', status: 'draft', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop', skuCode: '1006', stock: 0 },
  { id: '13', name: '午市双人套餐草稿', price: 96, category: '西式快餐', status: 'draft', stockStatus: 'available', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop', skuCode: '3003', stock: 0, type: 'combo', comboItemIds: ['1', '2'] },
];
