import { AVAILABLE_DYNAMIC_FIELDS, COMMON_FIELD_CHILD_CONFIG_LIBRARY, type Category, type CategoryFieldConfig } from './types';

export const BLIND_BAG_CATEGORY_ID = 'w_cat_blind_bag';
export type CategoryCreationScene = 'blind_bag';
export type OpsCategoryConfig = {
  id: string; name: string; sort: number; classification: 'standard' | 'combo';
  fields: CategoryFieldConfig[]; productCount: number; source: 'system' | 'custom';
  applicableBrands: string[] | 'all'; industryDefaults: string[]; status: 'active' | 'disabled';
  creationScene?: CategoryCreationScene;
  icon?: string; selectedIcon?: string; unselectedIcon?: string;
  /** Tracks an explicit Ops field save without replacing incumbent Web defaults. */
  fieldsSaved?: boolean;
};

export const generateInitialCategoryFields = (type: 'standard' | 'combo'): CategoryFieldConfig[] => [
  ...AVAILABLE_DYNAMIC_FIELDS.filter(field => field.isSystem && !field.id.includes('_spec_') && !field.id.includes('_method_')).map(field => ({ id: field.id, isRequired: true })),
  ...(type === 'combo' ? [{ id: 'c_groups', isRequired: true }] : []),
];

// Initial field data, edited through the existing Ops field editor.
// The product form reads the saved configuration instead of constructing a profile.
const blindBagFields = new Set([
  'p_name', 'p_alias', 'p_merchant_code', 'p_front_cat', 'p_back_cat', 'p_cat', 'p_unit', 'p_remark', 'p_stat_tags',
  's_specs', 's_price', 's_cost', 's_market_price', 's_pack_fee', 's_stock',
  's_min_purchase_toggle', 's_min_purchase_value', 's_max_purchase_toggle', 's_max_purchase_value',
  's_time_sale_toggle', 's_time_sale_rule', 's_sale_settings', 's_tax_rate',
  'p_img', 'p_cover_img', 'p_list_desc', 'p_desc_tags', 'p_order_tags', 'p_badge', 'p_badge_date',
  'p_video', 'p_rich_desc', 'p_detail_images', 'p_detail_bottom_img', 'st_member', 'o_base_sales', 'o_product_share',
]);
const blindBagSpecFields = new Set([
  's_spec_name', 's_spec_price', 's_spec_cost', 's_spec_market', 's_spec_stock',
  's_spec_barcode', 's_spec_mark', 's_spec_sku_code', 's_spec_img', 's_spec_large_img', 's_spec_alias',
  's_spec_store_pack_fee', 's_spec_store_pack_mark', 's_spec_take_pack_fee', 's_spec_take_pack_mark',
]);
const collapsed = new Set(['p_badge', 'p_badge_date', 'p_video', 's_sale_settings', 'o_base_sales', 'o_product_share']);
export const DEFAULT_BLIND_BAG_CATEGORY_FIELDS: CategoryFieldConfig[] = AVAILABLE_DYNAMIC_FIELDS
  .filter(field => blindBagFields.has(field.id)).map((field): CategoryFieldConfig => ({
    id: field.id, isRequired: ['p_name', 'p_front_cat', 's_price', 's_stock', 'p_img'].includes(field.id),
    displayMode: collapsed.has(field.id) ? 'collapsed' : 'visible',
    ...(field.id === 's_specs' ? { childConfigs: Object.fromEntries((COMMON_FIELD_CHILD_CONFIG_LIBRARY.s_specs || []).map(child => [child.id, blindBagSpecFields.has(child.id)])) } : {}),
  }));

export const INITIAL_OPS_CATEGORY_CONFIGS: OpsCategoryConfig[] = [
  { id: 'cat_s1', name: '通用菜品', sort: 10, classification: 'standard', fields: generateInitialCategoryFields('standard'), productCount: 120, source: 'system', applicableBrands: 'all', industryDefaults: ['中式正餐', '地方菜系'], status: 'active' },
  { id: 'cat_s2', name: '现制饮品', sort: 20, classification: 'standard', fields: [...generateInitialCategoryFields('standard'), { id: 'm_methods', isRequired: true, childConfigs: { m_method_name: true, m_method_markup: true } }], productCount: 45, source: 'system', applicableBrands: 'all', industryDefaults: ['饮品'], status: 'active' },
  { id: 'cat_s3', name: '称重商品', sort: 30, classification: 'standard', fields: generateInitialCategoryFields('standard'), productCount: 15, source: 'system', applicableBrands: 'all', industryDefaults: [], status: 'active' },
  { id: 'cat_s4', name: '蛋糕/烘焙', sort: 40, classification: 'standard', fields: generateInitialCategoryFields('standard'), productCount: 30, source: 'system', applicableBrands: 'all', industryDefaults: ['烘焙甜品'], status: 'active' },
  { id: 'cat_s5', name: '零售商品', sort: 50, classification: 'standard', fields: generateInitialCategoryFields('standard'), productCount: 80, source: 'system', applicableBrands: 'all', industryDefaults: ['零售'], status: 'active' },
  { id: BLIND_BAG_CATEGORY_ID, name: '盲袋商品', sort: 60, classification: 'standard', fields: DEFAULT_BLIND_BAG_CATEGORY_FIELDS, productCount: 3, source: 'system', applicableBrands: 'all', industryDefaults: [], status: 'active', creationScene: 'blind_bag' },
];

const webId = (id: string) => /^cat_[sc]\d+$/.test(id) ? `w_${id}` : id;
export const resolveWebCategoryConfigs = (baseline: Category[], configs: OpsCategoryConfig[], brandId: string): Category[] => {
  const applicable = configs.filter(config => config.applicableBrands === 'all' || config.applicableBrands.includes(brandId));
  return [...baseline.map(category => {
    const config = applicable.find(item => webId(item.id) === category.id);
    if (!config) return category;
    return { ...category, name: config.name, creationScene: config.creationScene, status: config.status,
      ...(config.creationScene ? { businessType: config.creationScene } : {}),
      ...(config.fieldsSaved ? { [config.classification === 'combo' ? 'comboFields' : 'standardFields']: config.fields } : {}),
    };
  }), ...applicable.filter(config => !baseline.some(category => category.id === webId(config.id))).map(config => ({
    id: webId(config.id), name: config.name, classification: config.classification, productCount: config.productCount,
    source: config.source === 'custom' ? 'brand' as const : 'system' as const,
    status: config.status, creationScene: config.creationScene,
    ...(config.creationScene ? { businessType: config.creationScene } : {}),
    standardFields: config.classification === 'standard' ? config.fields : [], comboFields: config.classification === 'combo' ? config.fields : [],
  }))];
};

export const isOrdinaryCreationCategory = (category: Category) => !category.creationScene && category.status !== 'disabled';

export const hasCategorySceneConflict = (category: OpsCategoryConfig, categories: OpsCategoryConfig[]) => !!category.creationScene && category.status === 'active' && categories.some(other =>
  other.id !== category.id && other.creationScene === category.creationScene && other.status === 'active'
  && (other.applicableBrands === 'all' || category.applicableBrands === 'all' || other.applicableBrands.some(id => category.applicableBrands.includes(id)))
);

// Value keys belonging to existing compound controls; independent of a scenario.
const compoundValueKeys: Record<string, string[]> = {
  p_img: ['p_img_gallery'], p_badge: ['p_badge_start_date', 'p_badge_end_date'],
  p_badge_date: ['p_badge_start_date', 'p_badge_end_date'],
  s_tax_rate: ['s_tax_category_code', 's_tax_category_name', 's_invoice_item_name', 's_invoice_custom_unit'],
  o_product_share: ['o_share_title', 'o_share_image'],
};
export const projectConfiguredFormData = (data: Record<string, any>, fields: CategoryFieldConfig[]) => {
  const keys = new Set(['prototypeCategoryId', 'customAttributes']);
  for (const field of fields.filter(field => field.displayMode !== 'hidden')) {
    keys.add(field.id); (compoundValueKeys[field.id] || []).forEach(key => keys.add(key));
  }
  return Object.fromEntries(Object.entries(data).filter(([key]) => keys.has(key)));
};

export const configuredSpecValueKeys = (fields: CategoryFieldConfig[]) => {
  const spec = fields.find(field => field.id === 's_specs' && field.displayMode !== 'hidden');
  const keys = new Set<string>();
  if (!spec) return keys;
  for (const child of COMMON_FIELD_CHILD_CONFIG_LIBRARY.s_specs || []) {
    const value = spec.childConfigs?.[child.id];
    if (!child.isSystem && (value === false || value === 'hidden' || value === undefined && !child.isDefaultSelected)) continue;
    keys.add(child.id);
    if (child.id === 's_spec_stock') ['s_spec_inventory_mode', 's_spec_initial_stock'].forEach(key => keys.add(key));
  }
  return keys;
};
