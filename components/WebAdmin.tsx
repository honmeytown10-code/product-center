
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Bell,
  Box,
  ChevronDown,
  ChevronUp,
  Clock,
  FlaskConical,
  LayoutGrid,
  Link2,
  Package,
  Rocket,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tags,
  UtensilsCrossed,
} from 'lucide-react';
import { useProducts } from '../context';
import { Category, CategoryFieldConfig, COMMON_FIELD_CHILD_CONFIG_LIBRARY, INITIAL_PRODUCTS, OmnichannelChannelId, Product, resolveChildRequiredConfigs, ThirdPartyChannelId } from '../types';
import { categoryRestoredFieldIds, categorySupplementFields } from './web/productCategoryFields';
import { SidebarItem } from './web/WebCommon';
import { WebProductList } from './web/WebProductList';
import { MOCK_STORE_PRODUCTS, StoreProductRecord, WebStoreProductList } from './web/WebStoreProductList';
import { PRODUCT_SALES_SCOPE_STORES, ProductSalesScope, fromStoreChannel, getProductStoreRecords } from './web/WebProductSalesScope';
import { libraryBatchPatch } from './web/productLibraryBatch';
import { checkJdStoreReadiness, checkTakeoutProduct, createTakeoutStoreBatch, isTakeoutChannel, takeoutOperationPlan } from '../takeoutSync';
import { removeDeletedTargets } from '../storeProductDeletion';
import { WebStoreCategoryList } from './web/WebStoreCategoryList';
import { WebCategoryManager } from './web/WebCategoryManager';
import { WebStoreAttributeManager } from './web/WebStoreAttributeManager';
import { WebStoreRegionList } from './web/WebStoreRegionList';
import { MOCK_REQUIRED_POLICIES, WebRequiredProductPolicyList, type RequiredPolicyRecord } from './web/WebRequiredProductPolicyList';
import { WebRequiredProductPolicyEditor } from './web/WebRequiredProductPolicyEditor';
import { WebStoreRegionEditor } from './web/WebStoreRegionEditor';
import { WebAttributeMutexRuleList } from './web/WebAttributeMutexRuleList';
import { WebAttributeMutexRuleEditor } from './web/WebAttributeMutexRuleEditor';
import { WebCategorySelectModal, WebImportModal, WebThirdPartyImportRecordsModal } from './web/WebModals';
import { BadgeOptionConfig, DEFAULT_BADGE_OPTIONS, DEFAULT_GROUPED_TAG_OPTIONS, GroupedTagFieldId, GroupedTagGroup, WebProductForm } from './web/WebProductForm';
import { WebProductDetail } from './web/WebProductDetail';
import { WebRecipeManager } from './web/WebRecipeManager'; 
import { WebIngredientLibraryManager } from './web/WebIngredientLibraryManager';
import { WebNutritionManager } from './web/WebNutritionManager';
import { WebAddonGroupManager } from './web/WebAddonGroupManager'; // Import new component
import { WebProductSync } from './web/WebProductSync'; // Import new component
import { WebTakeoutMenuSync } from './web/WebTakeoutMenuSync';
import { WebProductAttributeManager } from './web/WebProductAttributeManager';
import { WebPriceSystemList } from './web/WebPriceSystemList';
import { WebProductTemplateManager, INITIAL_RECORDS as PRODUCT_TEMPLATE_RECORDS } from './web/WebProductTemplateManager';
import { WebSalesScopeManager } from './web/WebSalesScopeManager';
import { WebBuffetMenuManager } from './web/WebBuffetMenuManager';
import { WebGroupMealProducts } from './web/WebGroupMealProducts';
import { productFormRecoveryKey, readProductFormRecovery } from './web/productFormRecovery';
import { WebProductLogPage } from './web/WebProductLogPage';
import { WebCommonFieldSettings } from './web/WebCommonFieldSettings';
import { WebChannelProductLibrary } from './web/WebChannelProductLibrary';
import {
  WebMasterChannelSyncDialog,
  type MasterChannelSyncDialogContext,
  type MasterChannelSyncFieldId,
  type MasterChannelSyncSubmitPayload,
} from './web/WebMasterChannelSyncDialog';
import type { MasterChannelSyncRecord, PublishBatch } from './web/WebPublishRecords';
import { WebChannelOverrideSettings } from './web/WebChannelOverrideSettings';
import { WebOmnichannelSettings } from './web/WebOmnichannelSettings';
import { mergePublishedFormData, publishedStockCount } from './web/WebProductPublishRules';
import { WebProductMapping } from './web/WebProductMapping';
import { WebProductRecommendationManager } from './web/WebProductRecommendationManager';
import { WebDifferenceInspection } from './web/WebDifferenceInspection';
import {
  UNIFIED_CHANNEL_CATALOG_ID,
  ALL_OMNICHANNEL_CHANNELS,
  getEffectiveChannelGroups,
  getOmnichannelChannel,
  getOmnichannelConfig,
  isThirdPartyChannelId,
  shouldShowChannelCatalog,
} from '../omnichannel';

import { WebGeneralSettings } from './web/WebGeneralSettings'; // Import new component

// Extended Category type for Web Admin local state
export interface WebCategory extends Category {
  classification: 'standard' | 'combo';
}

const getSyncFormData = (product: Product) => (
  (product as Product & { formData?: Record<string, unknown> }).formData || {}
);

const applyMasterFieldsToChannelProduct = (
  master: Product,
  current: Record<string, any>,
  fieldIds: MasterChannelSyncFieldId[],
) => {
  const masterFormData = getSyncFormData(master);
  const next: Record<string, any> = {
    ...current,
    id: master.id,
    formData: { ...(current.formData || {}) },
  };
  if (fieldIds.includes('name')) {
    next.name = master.name;
    next.formData.p_name = master.name;
  }
  if (fieldIds.includes('frontendCategory')) {
    next.formData.p_front_cat = masterFormData.p_front_cat || [master.category];
  }
  if (fieldIds.includes('price')) {
    next.price = master.price;
    next.formData.s_price = masterFormData.s_price || String(master.price);
  }
  if (fieldIds.includes('mainImage')) {
    next.image = master.image;
    next.formData.p_img = masterFormData.p_img || master.image;
  }
  if (fieldIds.includes('productType')) {
    next.type = master.type;
    next.isCombo = master.isCombo;
  }
  if (fieldIds.includes('productCategory')) {
    next.category = master.category;
    next.formData.p_cat = masterFormData.p_cat;
  }
  if (fieldIds.includes('backendCategory')) next.formData.p_back_cat = masterFormData.p_back_cat;
  if (fieldIds.includes('mnemonicCode')) next.formData.p_code = masterFormData.p_code;
  if (fieldIds.includes('weightFlag')) next.formData.p_weight_flag = masterFormData.p_weight_flag;
  if (fieldIds.includes('unit') && masterFormData.p_unit !== undefined) next.formData.p_unit = masterFormData.p_unit;
  if (fieldIds.includes('specs')) {
    const currentSpecs = Array.isArray(current.specs) ? current.specs : [];
    next.specs = fieldIds.includes('price')
      ? master.specs
      : master.specs?.map(masterSpec => {
          const channelSpec = currentSpecs.find((spec: { name?: string }) => spec.name === masterSpec.name);
          return channelSpec?.price === undefined ? masterSpec : { ...masterSpec, price: channelSpec.price };
        });
    next.formData.s_specs = masterFormData.s_specs;
  }
  if (fieldIds.includes('methods')) next.formData.m_methods = masterFormData.m_methods;
  if (fieldIds.includes('addons')) next.formData.a_addons = masterFormData.a_addons;
  if (fieldIds.includes('tax')) {
    next.formData.s_tax_rate = masterFormData.s_tax_rate;
    next.formData.s_tax_category_code = masterFormData.s_tax_category_code;
    next.formData.s_tax_category_name = masterFormData.s_tax_category_name;
    next.formData.s_invoice_item_name = masterFormData.s_invoice_item_name;
    next.formData.s_invoice_custom_unit = masterFormData.s_invoice_custom_unit;
  }
  return next;
};

type StoreProductManagePreset = {
  storeId?: string;
  channelId?: string;
  keyword?: string;
};

type StoreAdditionContext = {
  productIds: string[];
  channelIds: OmnichannelChannelId[];
  storeIds: string[];
  source: 'master' | 'channel_catalog';
  catalogId?: string;
  returnToStore: StoreProductManagePreset;
};

type CreationContext = {
  storeAddition?: StoreAdditionContext;
  storeReturn?: StoreProductManagePreset;
  groupMeal?: boolean;
  type: 'standard' | 'combo';
  category: Category;
  mode?: 'create' | 'edit';
  product?: any;
  scope?: TopNavView;
  formScope?: 'master' | 'channel' | 'unified' | 'store';
  channelContext?: {
    catalogId: string;
    catalogName: string;
    channelIds: OmnichannelChannelId[];
    channelNames: string[];
    masterName: string;
    skuId: string;
  };
  channelAttributeIds?: ThirdPartyChannelId[];
  channelProductKey?: string;
  initialSection?: 'sales-scope' | 'third_party';
  storeContext?: {
    storeId: string;
    storeName: string;
    currentChannelIds: string[];
    activeChannelId: string;
  };
};

type TopNavView = 'brand' | 'store';

type CommonFieldConfigs = Record<string, CategoryFieldConfig[]>;

const COMMON_FIELD_PRIORITY: Record<'standard' | 'combo', string[]> = {
  standard: ['p_name', 'p_alias', 'p_front_cat', 'p_img', 'p_list_desc', 's_price', 's_stock', 'm_methods', 'a_addons'],
  combo: ['p_name', 'p_front_cat', 'p_img', 'p_list_desc', 's_price', 's_stock', 'c_groups', 'm_methods'],
};

const getCommonFieldConfigKey = (type: 'standard' | 'combo', categoryId: string) => `${type}:${categoryId}`;
const FULL_FIELD_DEMO_CATEGORY_IDS = new Set(['w_cat_s1']);

const normalizeChildDisplayMode = (
  value: boolean | 'visible' | 'collapsed' | 'hidden' | undefined,
  isDefaultSelected: boolean
) => {
  if (value === 'visible') return 'visible';
  if (value === 'hidden') return 'hidden';
  if (value === 'collapsed') return 'visible';
  if (typeof value === 'boolean') return value ? 'visible' : 'hidden';
  return isDefaultSelected ? 'visible' : 'hidden';
};

const buildChildConfigs = (
  fieldId: string,
  current?: Record<string, boolean | 'visible' | 'collapsed' | 'hidden'>,
  currentRequiredConfigs?: Record<string, boolean>
) => {
  const childTemplates = COMMON_FIELD_CHILD_CONFIG_LIBRARY[fieldId] || [];
  if (childTemplates.length === 0) return undefined;
  return childTemplates.reduce<Record<string, 'visible' | 'collapsed' | 'hidden'>>((acc, child) => {
    const normalizedMode = normalizeChildDisplayMode(current?.[child.id], !!(child.isDefaultSelected || child.isSystem));
    acc[child.id] = child.isSystem || !!currentRequiredConfigs?.[child.id] ? 'visible' : normalizedMode;
    return acc;
  }, {});
};

const buildCommonFieldConfigEntry = (
  fieldConfig: CategoryFieldConfig,
  fieldConfigMap: Map<string, CategoryFieldConfig>
): CategoryFieldConfig => {
  const childRequiredConfigs = resolveChildRequiredConfigs(fieldConfig.id, fieldConfigMap, fieldConfig.childRequiredConfigs);
  return {
    id: fieldConfig.id,
    isRequired: fieldConfig.isRequired,
    displayMode: fieldConfig.displayMode ?? 'visible',
    childConfigs: buildChildConfigs(fieldConfig.id, fieldConfig.childConfigs, childRequiredConfigs),
    childRequiredConfigs,
  };
};

const buildDefaultCommonFieldIds = (category: WebCategory) => {
  const fieldConfigs = category.classification === 'standard' ? category.standardFields : category.comboFields;
  const availableIds = fieldConfigs.map(field => field.id);
  const requiredIds = fieldConfigs.filter(field => field.isRequired).map(field => field.id);
  const preferredIds = COMMON_FIELD_PRIORITY[category.classification].filter(id => availableIds.includes(id));
  const fallbackIds = availableIds.slice(0, Math.min(8, availableIds.length));
  return Array.from(new Set([...requiredIds, ...preferredIds, ...fallbackIds]));
};

const buildInitialCommonFieldConfigs = (categories: WebCategory[]): CommonFieldConfigs => (
  categories.reduce<CommonFieldConfigs>((acc, category) => {
    const fieldConfigs = category.classification === 'standard' ? category.standardFields : category.comboFields;
    const fieldConfigMap = new Map(fieldConfigs.map(field => [field.id, field]));
    const defaultIds = new Set(buildDefaultCommonFieldIds(category));
    const showAllFieldsForDemo = FULL_FIELD_DEMO_CATEGORY_IDS.has(category.id);
    const sourceFields = Array.from(new Map(fieldConfigs.map(field => [field.id, field])).values());
    acc[getCommonFieldConfigKey(category.classification, category.id)] = sourceFields
      .map(field => {
        const entry = buildCommonFieldConfigEntry(field, fieldConfigMap);
        if (!showAllFieldsForDemo) {
          const collapsibleIds = ['p_display_type', 'p_remark', 'p_stat_tags', 'p_cover_img', 'p_badge', 'p_badge_date', 'p_detail_images', 'p_detail_bottom_img', 'p_video', 's_sale_settings', 's_jump_third_mini_program', 's_third_mini_program_path', 's_sales_commission_amount', 'o_more_settings', 'o_base_sales', 'o_more_barcodes', 'o_product_share'];
          return { ...entry, displayMode: entry.displayMode === 'collapsed' || (!defaultIds.has(field.id) && collapsibleIds.includes(field.id)) ? 'collapsed' as const : entry.displayMode };
        }
        const childTemplates = COMMON_FIELD_CHILD_CONFIG_LIBRARY[field.id] || [];
        return {
          ...entry,
          displayMode: 'visible' as const,
          childConfigs: childTemplates.length > 0
            ? childTemplates.reduce<Record<string, 'visible'>>((childAcc, child) => {
              childAcc[child.id] = 'visible';
              return childAcc;
            }, {})
            : entry.childConfigs,
        };
      });
    return acc;
  }, {})
);

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
  { id: 'p_img', isRequired: false },
  { id: 'p_cover_img', isRequired: false },
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
  { id: 'p_list_desc', isRequired: false },
  { id: 'p_badge', isRequired: false },
  { id: 'p_badge_date', isRequired: false },
  { id: 'p_video', isRequired: false },
  { id: 'p_rich_desc', isRequired: false },
  { id: 'p_detail_images', isRequired: false },
  { id: 'p_detail_bottom_img', isRequired: false },
  { id: 'st_member', isRequired: false },
  { id: 'o_invoice', isRequired: false },
  { id: 'o_origin', isRequired: false },
  { id: 'o_ingredients', isRequired: false },
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
  { id: 'p_img', isRequired: false },
  { id: 'p_cover_img', isRequired: false },
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
  { id: 'p_badge_date', isRequired: false },
  { id: 'p_video', isRequired: false },
  { id: 'p_rich_desc', isRequired: false },
  { id: 'p_detail_bottom_img', isRequired: false },
  { id: 'st_member', isRequired: false },
  { id: 'o_invoice', isRequired: false },
  { id: 'o_origin', isRequired: false },
  { id: 'o_ingredients', isRequired: false },
];

const BUFFET_TICKET_UNSUPPORTED_FIELD_IDS = new Set([
  'p_weight_flag',
  'p_tare_weight',
]);

const BUFFET_TICKET_DEFAULT_HIDDEN_FIELD_IDS = new Set([
  'p_unit',
  'p_display_type',
  'm_methods',
  'a_addons',
]);

const BUFFET_TICKET_STANDARD_FIELDS: CategoryFieldConfig[] = DEFAULT_STANDARD_FIELDS
  .filter(field => !BUFFET_TICKET_UNSUPPORTED_FIELD_IDS.has(field.id))
  .map(field => BUFFET_TICKET_DEFAULT_HIDDEN_FIELD_IDS.has(field.id)
    ? { ...field, displayMode: 'hidden' as const }
    : field
  )
  .flatMap(field => field.id === 'p_cat'
    ? [
        field,
        { id: 'p_applicable_people', isRequired: true },
        { id: 'p_deposit_required', isRequired: false },
      ]
    : [field]
  );

const INITIAL_WEB_CATEGORIES: WebCategory[] = ([
  // Standard Categories
  { id: 'w_cat_s1', name: '通用菜品', productCount: 120, standardFields: DEFAULT_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s2', name: '现制饮品', productCount: 45, standardFields: DEFAULT_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s3', name: '称重商品', productCount: 15, standardFields: DEFAULT_STANDARD_FIELDS.filter(field => field.id !== 's_sale_mode'), comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s4', name: '蛋糕/烘焙', productCount: 30, standardFields: DEFAULT_STANDARD_FIELDS.filter(field => !['s_pack_fee', 'p_stat_tags'].includes(field.id)), comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s5', name: '零售商品', productCount: 80, standardFields: DEFAULT_STANDARD_FIELDS.filter(field => !['st_member', 'm_methods', 'a_addons'].includes(field.id)).concat([{ id: 'o_invoice', isRequired: false }, { id: 'o_origin', isRequired: false }]), comboFields: [], source: 'system', classification: 'standard' },
  { id: 'w_cat_s6', name: '自助餐标', productCount: 0, standardFields: BUFFET_TICKET_STANDARD_FIELDS, comboFields: [], source: 'system', classification: 'standard', businessType: 'buffet_ticket' },
  // Combo Categories
  { id: 'w_cat_c1', name: '通用套餐', productCount: 20, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c2', name: '现制饮品套餐', productCount: 10, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c3', name: '蛋糕/烘焙套餐', productCount: 5, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c4', name: '零售套餐', productCount: 8, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
  { id: 'w_cat_c5', name: '火锅锅底', productCount: 12, standardFields: [], comboFields: DEFAULT_COMBO_FIELDS, source: 'system', classification: 'combo' },
] as WebCategory[]).map(category => category.id === 'w_cat_s3' ? category : ({ ...category,
  standardFields: category.standardFields.filter(field => field.id !== 'p_weight_flag'),
  comboFields: category.comboFields.filter(field => field.id !== 'p_weight_flag'),
})).map(category => {
  const key = category.classification === 'combo' ? 'comboFields' : 'standardFields';
  const extraIds = categoryRestoredFieldIds(category.id);
  const additions = [...extraIds, ...categorySupplementFields(category.id).map(field => field.id)]
    .filter(id => !category[key].some(field => field.id === id))
    .map(id => ({ id, isRequired: false, displayMode: 'collapsed' as const }));
  return { ...category, [key]: [...category[key], ...additions] };
});

export interface WebAdminExperience {
  unified: boolean;
  initialMenu?: string;
  header?: React.ReactNode;
  renderSidebar: (menu: string, navigate: (menu: string) => void) => React.ReactNode;
}

export const WebAdmin: React.FC<{ experience?: WebAdminExperience }> = ({ experience }) => {
  // Body-mounted selectors and menus share the PC theme without affecting App/POS.
  useEffect(() => {
    document.body.classList.add('console-pc-active');
    return () => document.body.classList.remove('console-pc-active');
  }, []);
  const { products, brandConfigs, activeBrandId, addProduct, updateProduct, deleteProduct } = useProducts();
  const currentProductsRef = useRef(products);
  currentProductsRef.current = products;
  const omnichannelConfig = useMemo(
    () => {
      const config = getOmnichannelConfig(brandConfigs[activeBrandId] || brandConfigs.b_1);
      return experience ? { ...config, collaborationMode: experience.unified ? 'unified' as const : 'channel_division' as const } : config;
    },
    [activeBrandId, brandConfigs, experience?.unified]
  );
  const unifiedManagement = omnichannelConfig.collaborationMode === 'unified';
  const channelCatalogMenuVisible = shouldShowChannelCatalog(omnichannelConfig);
  const productMappingVisible = Object.values(omnichannelConfig.thirdPartyStrategies).some(mode => mode === 'platform')
    || Object.values(omnichannelConfig.channelConnections).some(connection => connection.capabilities.length > 0);
  const unifiedDefaultGroup = useMemo(
    () => getEffectiveChannelGroups(omnichannelConfig)[0],
    [omnichannelConfig]
  );
  const masterChannelSyncCatalogs = useMemo(() => getEffectiveChannelGroups(omnichannelConfig).map(group => ({
    id: group.id,
    name: group.name,
    channelNames: group.channels.map(channelId => getOmnichannelChannel(channelId).name),
  })), [omnichannelConfig]);
  const productMenuGuideStorageKey = 'web-admin-product-menu-upgrade-guide-v2';
  // Navigation State
  const [activeTopNav, setActiveTopNav] = useState<TopNavView>(() => (experience?.initialMenu === 'product_logs' ? 'brand' : 'store'));
  const [activeMenu, setActiveMenu] = useState(() => (
    experience?.initialMenu || new URLSearchParams(window.location.search).get('menu') || 'buffet_menu'
  ));
  const [newRecipeEnabled, setNewRecipeEnabled] = useState(true);
  const [lastRecipeMenu, setLastRecipeMenu] = useState<'recipe_legacy' | 'recipe_new'>('recipe_new');
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [productSyncInitialTab, setProductSyncInitialTab] = useState<'publish' | 'qimai-records' | 'platform-records'>(() => (
    new URLSearchParams(window.location.search).get('recordView') === 'platform' ? 'platform-records' : 'publish'
  ));
  const [productPublishPreset, setProductPublishPreset] = useState<{ productId?: string; productIds?: string[]; source?: 'master' | 'channel_catalog'; catalogId?: string; channelIds: OmnichannelChannelId[]; storeIds?: string[]; returnToStore?: StoreProductManagePreset } | null>(null);
  const [libraryBatchPreset, setLibraryBatchPreset] = useState<{ type: 'standard' | 'combo'; productIds: string[]; returnTab: 'all' | 'on_shelf' | 'off_shelf' | 'draft' } | null>(null);
  const [libraryReturnTab, setLibraryReturnTab] = useState<'all' | 'on_shelf' | 'off_shelf' | 'draft'>('on_shelf');
  const [templateMembershipsByBrand, setTemplateMembershipsByBrand] = useState<Record<string, Record<string, string[]>>>({});
  const templateMemberships = templateMembershipsByBrand[activeBrandId] || Object.fromEntries(PRODUCT_TEMPLATE_RECORDS.map(template => [template.id, INITIAL_PRODUCTS.slice(0, template.productCount).filter(product => products.some(current => current.id === product.id)).map(product => product.id)]));
  const applyLibraryBatch = (updates: Array<{ productId: string; values: Record<string, string | number | boolean> }>) => {
    // Validate every patch before applying any; local prototype writes never touch production.
    const patches = updates.map(item => {
      const product = currentProductsRef.current.find(product => product.id === item.productId);
      if (!product) throw new Error('商品已变化，请返回商品库重新选择。');
      return { id: product.id, patch: libraryBatchPatch(product, item.values) };
    });
    patches.forEach(item => updateProduct(item.id, item.patch));
  };
  useEffect(() => { if (activeMenu !== 'product_sync') setProductPublishPreset(null); }, [activeMenu]);
  useEffect(() => { if (activeMenu !== 'product_sync') setLibraryBatchPreset(null); }, [activeMenu]);
  useEffect(() => {
    if (!experience || activeMenu !== 'product_records') return;
    const url = new URL(window.location.href);
    url.searchParams.set('menu', 'product_records');
    url.searchParams.set('recordView', productSyncInitialTab === 'platform-records' ? 'platform' : 'qimai');
    window.history.replaceState(null, '', url);
  }, [activeMenu, productSyncInitialTab, !!experience]);

  // Creation/Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isThirdPartyImportRecordsOpen, setIsThirdPartyImportRecordsOpen] = useState(false);
  const [categorySelectContext, setCategorySelectContext] = useState<{
    storeAddition?: StoreAdditionContext;

    storeReturn?: StoreProductManagePreset;
    groupMeal?: boolean;
    type: 'standard' | 'combo';
    scope: TopNavView;
    formScope?: 'master' | 'channel' | 'unified' | 'store';
    channelContext?: CreationContext['channelContext'];
    channelAttributeIds?: ThirdPartyChannelId[];
  } | null>(null);
  const [detailContext, setDetailContext] = useState<any>(null); // New detail context
  const [creationContext, setCreationContext] = useState<CreationContext | null>(null); // Triggers Form Page
  const resumeStoreAddition = (context: StoreAdditionContext, newProductId?: string) => {
    setProductPublishPreset({ ...context, source: newProductId && !experience?.unified ? 'master' : context.source,
      productIds: [...new Set([...context.productIds, ...(newProductId ? [newProductId] : [])])],
    });
    setCreationContext(null);
    setCategorySelectContext(null);
    setProductSyncInitialTab('publish');
    setActiveMenu('product_sync');
  };
  const [onlineCatalogId, setOnlineCatalogId] = useState<string | undefined>();
  const [automaticOnlineSubmissions, setAutomaticOnlineSubmissions] = useState<Record<string, Record<string, Record<string, string>>>>({});
  const [storeProductManagePreset, setStoreProductManagePreset] = useState<StoreProductManagePreset | null>(null);
  const [directStoreProductsByBrand, setDirectStoreProductsByBrand] = useState<Record<string, StoreProductRecord[]>>({});
  // Explicit legacy demo aliases only; production queries use canonical SPU IDs, never product names.
  const demoStoreProducts = useMemo(() => MOCK_STORE_PRODUCTS.map(record => ({ ...record, baseProductId: ({ '974340414367182854': '1', '924336445413220352': '3', '934501236899667968': '4' } as Record<string, string>)[record.baseProductId] || record.baseProductId })), []);
  const directStoreProducts = directStoreProductsByBrand[activeBrandId] || demoStoreProducts;
  const updateStoreRecords = (updater: (records: StoreProductRecord[]) => StoreProductRecord[]) => setDirectStoreProductsByBrand(current => ({ ...current, [activeBrandId]: updater(current[activeBrandId] || demoStoreProducts) }));
  const [directSyncBatchesByBrand, setDirectSyncBatchesByBrand] = useState<Record<string, PublishBatch[]>>({});
  const directSyncBatches = directSyncBatchesByBrand[activeBrandId] || [];
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Array<{ brandId: string; productId: string; channelIds: string[]; batch: PublishBatch }>>([]);
  useEffect(() => {
    const job = pendingWithdrawals[0];
    if (!job) return;
    const timer = window.setTimeout(() => {
      setDirectStoreProductsByBrand(current => ({ ...current, [job.brandId]: (current[job.brandId] || demoStoreProducts).flatMap(record => {
        if (record.baseProductId !== job.productId) return [record];
        const affected = record.channels.filter(id => job.channelIds.includes(id));
        const remaining = record.channels.filter(id => !job.channelIds.includes(id));
        return [...(remaining.length ? [{ ...record, channels: remaining }] : []), ...affected.map(channel => ({ ...record, id: `${record.id}-withdraw-${channel}`, channels: [channel], status: 'off_shelf' as const, lastSync: '刚刚' }))];
      }) }));
      const finishedAt = new Date().toLocaleString('sv-SE', { hour12: false });
      setDirectSyncBatchesByBrand(current => ({ ...current, [job.brandId]: (current[job.brandId] || []).map(batch => batch.id === job.batch.id ? { ...batch, status: 'success', tasks: batch.tasks.map(task => task.type === 'qimai' ? { ...task, status: 'success', progress: 100, successCount: task.waitingCount, waitingCount: 0, finishedAt } : task), details: batch.details?.map(detail => detail.taskType === 'qimai' ? { ...detail, status: 'success', finishedAt } : detail) } : batch) }));
      setPendingWithdrawals(current => current.slice(1));
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [pendingWithdrawals]);
  // Local prototype only: store rows change after the task completes.
  const [pendingDirectJobs, setPendingDirectJobs] = useState<Array<{
    brandId: string; productId: string; records: StoreProductRecord[];
    batch: PublishBatch; readyAt: number; draft: any; previousProduct: any; overwriteFields: string[];
  }>>([]);
  useEffect(() => {
    const job = pendingDirectJobs[0];
    if (!job) return;
    const timer = window.setTimeout(() => {
      const currentProduct = currentProductsRef.current.find(product => product.id === job.productId) as any;
      const currentChannels: string[] | undefined = currentProduct?.formData?.applicableChannelIds;
      const aliases: Record<string, string> = { mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take', douyin: 'douyin_dine' };
      if (currentChannels && job.records.some(record => record.channels.some(channel => !currentChannels.some(id => (aliases[id] || id) === channel)))) {
        const error = '销售渠道已变更，本次未执行。请重新选择下发范围。';
        setDirectSyncBatchesByBrand(current => ({ ...current, [job.brandId]: (current[job.brandId] || []).map(batch => batch.id === job.batch.id ? { ...batch, status: 'failed', tasks: batch.tasks.map(task => ({ ...task, status: 'failed', error, progress: 100, successCount: 0, failedCount: task.waitingCount, waitingCount: 0 })), details: batch.details?.map(detail => ({ ...detail, status: 'failed', error, finishedAt: '未执行' })) } : batch) }));
        setPendingDirectJobs(current => current.filter(item => item.batch.id !== job.batch.id));
        return;
      }
      setDirectStoreProductsByBrand(current => ({
        ...current,
        [job.brandId]: [...job.records.map(record => {
          const previous = (current[job.brandId] || MOCK_STORE_PRODUCTS).find(item => item.baseProductId === job.productId && item.storeId === record.storeId && item.channels.some(channel => record.channels.includes(channel)));
          const stockCount = publishedStockCount(job.draft.formData || {}, previous?.stockCount ?? record.stockCount);
          return previous ? { ...record, name: job.overwriteFields.includes('商品名称') ? record.name : previous.name, category: job.overwriteFields.some(field => ['前台分类', '展示分类'].includes(field)) ? record.category : previous.category, image: job.overwriteFields.includes('商品主图') ? record.image : previous.image, status: previous.status, stockStatus: job.overwriteFields.includes('库存') ? stockCount === 0 ? 'empty' : stockCount < 20 ? 'low' : 'normal' : previous.stockStatus, stockCount: job.overwriteFields.includes('库存') ? stockCount : previous.stockCount, sortIndex: job.overwriteFields.includes('商品排序') && Number.isFinite(Number(job.draft.formData?.p_sort)) ? Number(job.draft.formData.p_sort) : previous.sortIndex, isMultiSpec: previous.isMultiSpec, specs: previous.specs } : { ...record, stockCount, stockStatus: stockCount === 0 ? 'empty' : stockCount < 20 ? 'low' : 'normal' };
        }), ...(current[job.brandId] || MOCK_STORE_PRODUCTS).flatMap(item => {
          if (item.baseProductId !== job.productId) return [item];
          const channels = item.channels.filter(channel => !job.records.some(record => record.storeId === item.storeId && record.channels.includes(channel)));
          return channels.length ? [{ ...item, channels }] : [];
        })],
      }));
      setStoreFormOverrides(current => {
        const next = { ...current };
        for (const record of job.records) {
          const priorRecord = (directStoreProductsByBrand[job.brandId] || demoStoreProducts).find(item => item.baseProductId === job.productId && item.storeId === record.storeId && item.channels.includes(record.channels[0]));
          const previous = current[`${job.brandId}:${priorRecord?.id || record.id}:${record.channels[0]}`];
          const data = priorRecord ? mergePublishedFormData({ ...(job.previousProduct?.formData || {}), ...(previous?.formData || {}) }, job.draft.formData || {}, job.overwriteFields) : { ...job.draft.formData };
          next[`${job.brandId}:${record.id}:${record.channels[0]}`] = { ...previous, formData: data, name: job.overwriteFields.includes('商品名称') || !priorRecord ? record.name : previous?.name || priorRecord.name, category: job.overwriteFields.some(field => ['前台分类', '展示分类'].includes(field)) || !priorRecord ? record.category : previous?.category || priorRecord.category, image: job.overwriteFields.includes('商品主图') || !priorRecord ? record.image : previous?.image || priorRecord.image, price: job.overwriteFields.some(field => ['售价', '基础售价', '基础价格'].includes(field)) || !priorRecord ? job.draft.price : previous?.price ?? job.previousProduct?.price };
        }
        return next;
      });
      const finishedAt = new Date().toLocaleString('sv-SE', { hour12: false });
      const completedBatch: PublishBatch = {
        ...job.batch,
        tasks: job.batch.tasks.map(task => task.type === 'qimai' ? { ...task, finishedAt } : task),
        details: job.batch.details?.map(detail => detail.taskType === 'qimai' ? { ...detail, finishedAt } : detail),
      };
      setDirectSyncBatchesByBrand(current => ({
        ...current,
        [job.brandId]: (current[job.brandId] || []).map(batch => batch.id === job.batch.id ? completedBatch : batch),
      }));
      setPendingDirectJobs(current => current.filter(item => item.batch.id !== job.batch.id));
    }, Math.max(0, job.readyAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [pendingDirectJobs]);
  const [storeFormOverrides, setStoreFormOverrides] = useState<Record<string, any>>({});
  const handleProductToolTask = (batch: PublishBatch) => {
    setDirectSyncBatchesByBrand(current => ({ ...current, [activeBrandId]: [batch, ...(current[activeBrandId] || []).filter(item => item.id !== batch.id)] }));
    if (batch.action !== '发布商品至门店' || batch.tasks.find(task => task.type === 'qimai')?.status !== 'success') return;
    const aliases: Record<string, string> = { mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take', douyin: 'douyin_dine' };
    const targets = Array.from(new Map((batch.details || []).filter(detail => detail.taskType === 'qimai' && detail.status === 'success').map(detail => [detail.productId + ':' + detail.storeId + ':' + detail.channel, detail])).values());
    setStoreFormOverrides(current => {
      const next = { ...current };
      for (const detail of targets) {
        const source = products.find(product => product.id === detail.productId) as any;
        const channel = ALL_OMNICHANNEL_CHANNELS.find(item => item.name === detail.channel);
        if (!source || !channel || !detail.storeId) continue;
        const id = aliases[channel.id] || channel.id;
        const existing = (directStoreProductsByBrand[activeBrandId] || demoStoreProducts).find(record => record.baseProductId === source.id && record.storeId === detail.storeId && record.channels.includes(id));
        const key = `${activeBrandId}:${existing?.id || `manual-${source.id}-${detail.storeId}-${id}`}:${id}`;
        const previous = current[key];
        next[key] = {
          ...previous,
          formData: existing ? mergePublishedFormData(previous?.formData || source.formData || {}, source.formData || {}, detail.fields) : { ...source.formData },
          name: !existing || detail.fields.includes('商品名称') ? detail.productName : previous?.name || existing.name,
          category: !existing || detail.fields.includes('前台分类') ? source.category : previous?.category || existing.category,
          image: !existing || detail.fields.includes('商品主图') ? source.image : previous?.image || existing.image,
          price: !existing || detail.fields.some(field => ['售价', '基础售价', '基础价格'].includes(field)) ? source.price : previous?.price ?? source.price,
        };
      }
      return next;
    });
    setDirectStoreProductsByBrand(current => {
      let records = [...(current[activeBrandId] || demoStoreProducts)];
      for (const detail of targets) {
        const source = products.find(product => product.id === detail.productId);
        const channel = ALL_OMNICHANNEL_CHANNELS.find(channel => channel.name === detail.channel);
        if (!source || !channel || !detail.storeId) continue;
        const id = aliases[channel.id] || channel.id;
        const existing = records.find(record => record.baseProductId === source.id && record.storeId === detail.storeId && record.channels.includes(id));
        const row: StoreProductRecord = { ...existing, id: existing?.id || `manual-${source.id}-${detail.storeId}-${id}`, baseProductId: source.id, storeId: detail.storeId, storeName: detail.storeName, channels: [id], name: !existing || detail.fields.includes('商品名称') ? detail.productName : existing.name, category: !existing || detail.fields.includes('前台分类') ? source.category : existing.category, image: !existing || detail.fields.includes('商品主图') ? source.image : existing.image, type: source.type === 'combo' ? 'Combo' : 'Standard', tags: existing?.tags || [], status: existing?.status || 'off_shelf', stockStatus: existing?.stockStatus || 'normal', stockCount: existing?.stockCount ?? 9999, lastSync: '刚刚', sortIndex: existing?.sortIndex || 0 };
        if (!existing || detail.fields.includes('库存')) {
          row.stockCount = publishedStockCount((source as any).formData || {}, row.stockCount);
          row.stockStatus = row.stockCount === 0 ? 'empty' : row.stockCount < 20 ? 'low' : 'normal';
        }
        records = [...records.flatMap(record => record === existing ? record.channels.filter(channel => channel !== id).length ? [{ ...record, channels: record.channels.filter(channel => channel !== id) }] : [] : [record]), row];
      }
      return { ...current, [activeBrandId]: records };
    });
  };
  const [storeCategoryReturnMenu, setStoreCategoryReturnMenu] = useState('store_product_list');
  const [requiredPolicies, setRequiredPolicies] = useState<RequiredPolicyRecord[]>(MOCK_REQUIRED_POLICIES);
  const [requiredPolicyNotice, setRequiredPolicyNotice] = useState('');
  const [requiredPolicyEditorContext, setRequiredPolicyEditorContext] = useState<{ mode: 'create' | 'edit'; policy?: RequiredPolicyRecord } | null>(() => (
    new URLSearchParams(window.location.search).get('action') === 'create'
      ? { mode: 'create' }
      : null
  ));
  const [storeRegionEditorContext, setStoreRegionEditorContext] = useState<any>(null);
  const [attributeMutexEditorContext, setAttributeMutexEditorContext] = useState<{ mode: 'create' | 'edit'; rule?: any } | null>(null);
  const [showProductMenuGuide, setShowProductMenuGuide] = useState(false);
  const [currentProductMenuGuideStep, setCurrentProductMenuGuideStep] = useState(0);
  const [commonFieldConfigs, setCommonFieldConfigs] = useState<CommonFieldConfigs>(() => buildInitialCommonFieldConfigs(INITIAL_WEB_CATEGORIES));
  const [channelCommonFieldConfigs, setChannelCommonFieldConfigs] = useState<CommonFieldConfigs>(() => buildInitialCommonFieldConfigs(INITIAL_WEB_CATEGORIES));
  const [channelEditableFieldIds, setChannelEditableFieldIds] = useState<string[]>(['p_name']);
  const [channelProductOverrides, setChannelProductOverrides] = useState<Record<string, any>>({});
  const [templateProductOverrides, setTemplateProductOverrides] = useState<Record<string, Product>>({});
  const [masterChannelSyncDialogContext, setMasterChannelSyncDialogContext] = useState<MasterChannelSyncDialogContext | null>(null);
  const [masterChannelSyncRecords, setMasterChannelSyncRecords] = useState<MasterChannelSyncRecord[]>([]);
  const [commonFieldSettingsContext, setCommonFieldSettingsContext] = useState<{
    type: 'standard' | 'combo';
    categoryId: string | null;
    formScope?: 'master' | 'channel' | 'store';
    catalogName?: string;
  } | null>(null);
  const [storeGroupedTagOptions, setStoreGroupedTagOptions] = useState<Record<GroupedTagFieldId, GroupedTagGroup[]>>(() => ({
    ...DEFAULT_GROUPED_TAG_OPTIONS,
    p_desc_tags: DEFAULT_GROUPED_TAG_OPTIONS.p_desc_tags.map(group => ({
      ...group,
      options: group.options.map(option => ({ ...option })),
    })),
    // Keep legacy point-order tag data compatible, but do not expose it in the fusion UI.
    p_order_tags: DEFAULT_GROUPED_TAG_OPTIONS.p_order_tags.map(group => ({
      ...group,
      options: group.options.map(option => ({ ...option })),
    })),
    p_stat_tags: DEFAULT_GROUPED_TAG_OPTIONS.p_stat_tags.map(group => ({
      ...group,
      options: group.options.map(option => ({ ...option })),
    })),
  }));
  const [storeBadgeOptions, setStoreBadgeOptions] = useState<BadgeOptionConfig[]>(() => DEFAULT_BADGE_OPTIONS.map(option => ({ ...option })));

  const handleMasterChannelSyncSubmit = (payload: MasterChannelSyncSubmitPayload) => {
    if (!masterChannelSyncDialogContext) return;
    const selectedMasters = masterChannelSyncDialogContext.products.filter(product => payload.productIds.includes(product.id));
    setChannelProductOverrides(current => {
      const next = { ...current };
      payload.catalogIds.forEach(catalogId => {
        selectedMasters.forEach(master => {
          const key = `${catalogId}:${master.id}`;
          next[key] = applyMasterFieldsToChannelProduct(master, next[key] || {}, payload.fieldIds);
        });
      });
      return next;
    });

    if (masterChannelSyncDialogContext.entry === 'after-create' || masterChannelSyncDialogContext.entry === 'after-save') {
      return;
    }

    const selectedCatalogNames = masterChannelSyncCatalogs
      .filter(catalog => payload.catalogIds.includes(catalog.id))
      .map(catalog => catalog.name);
    const firstProduct = selectedMasters[0];
    const title = selectedMasters.length === 1
      ? `${firstProduct?.name || '商品'}主档资料更新`
      : `批量同步 ${selectedMasters.length} 个商品主档资料`;
    setMasterChannelSyncRecords(current => [{
      id: `MC${Date.now()}`,
      title,
      sourceName: selectedMasters.length === 1 ? firstProduct?.name || '商品主档' : `已选 ${selectedMasters.length} 个商品主档`,
      catalogNames: selectedCatalogNames,
      fieldNames: payload.fieldNames,
      productCount: selectedMasters.length,
      createdAt: new Date().toLocaleString('sv-SE', { hour12: false }),
    }, ...current]);
  };

  const openMasterChannelSyncRecords = () => {
    setMasterChannelSyncDialogContext(null);
    setProductSyncInitialTab('qimai-records');
    setCreationContext(null);
    setDetailContext(null);
    setActiveMenu(experience ? 'product_records' : 'product_sync');
  };

  // Category Manager State
  const [webCategories, setWebCategories] = useState<WebCategory[]>(INITIAL_WEB_CATEGORIES);
  useEffect(() => {
    if (!categorySelectContext || categorySelectContext.scope === 'store') return;
    const scope = categorySelectContext.formScope || 'master';
    const key = productFormRecoveryKey(activeBrandId, scope, categorySelectContext.type, categorySelectContext.channelContext?.catalogId || (categorySelectContext.groupMeal ? 'group-meal' : ''));
    const recovery = readProductFormRecovery(key);
    if (!recovery) return;
    const category = webCategories.find(item => item.id === recovery.categoryId && item.classification === categorySelectContext.type);
    if (!category) return;
    setCreationContext({ ...categorySelectContext, category, mode: 'create', product: { ...recovery.product, recoveryRestored: true } });
    setCategorySelectContext(null);
  }, [categorySelectContext, activeBrandId, webCategories]);
  const [selectedManageCat, setSelectedManageCat] = useState<Category | null>(null);
  const storeRequiredVisibleFieldIds = ['p_desc_tags', 'p_badge', 'p_badge_date', 'p_rich_desc'];

  const storeCommonFieldConfigs = useMemo<CommonFieldConfigs>(() => (
    webCategories.reduce<CommonFieldConfigs>((acc, category) => {
      const key = getCommonFieldConfigKey(category.classification, category.id);
      const fieldConfigs = category.classification === 'standard' ? category.standardFields : category.comboFields;
      const fieldMap = new Map<string, CategoryFieldConfig>(fieldConfigs.map(field => [field.id, field] as const));
      const nextConfigList = (commonFieldConfigs[key] || []).map(item => ({ ...item }));

      storeRequiredVisibleFieldIds.forEach(fieldId => {
        const sourceField = fieldMap.get(fieldId);
        if (!sourceField) return;
        const targetIndex = nextConfigList.findIndex(item => item.id === fieldId);
        const nextFieldConfig = {
          ...sourceField,
          ...(targetIndex >= 0 ? nextConfigList[targetIndex] : {}),
          displayMode: 'visible' as const,
        };
        if (targetIndex >= 0) nextConfigList[targetIndex] = nextFieldConfig;
        else nextConfigList.push(nextFieldConfig);
      });

      acc[key] = nextConfigList;
      return acc;
    }, {})
  ), [commonFieldConfigs, webCategories]);

  const unifiedCommonFieldConfigs = useMemo<CommonFieldConfigs>(() => {
    const keys = new Set([
      ...Object.keys(commonFieldConfigs),
      ...Object.keys(channelCommonFieldConfigs),
    ]);
    const merged: CommonFieldConfigs = {};

    keys.forEach(key => {
      const fieldMap = new Map<string, CategoryFieldConfig>();
      (commonFieldConfigs[key] || []).forEach(field => fieldMap.set(field.id, { ...field }));
      (channelCommonFieldConfigs[key] || []).forEach(field => {
        fieldMap.set(field.id, { ...(fieldMap.get(field.id) || {}), ...field });
      });
      merged[key] = Array.from(fieldMap.values());
    });

    return merged;
  }, [channelCommonFieldConfigs, commonFieldConfigs]);

  useEffect(() => {
    const syncConfigs = (prev: CommonFieldConfigs) => {
      const next: CommonFieldConfigs = {};

      webCategories.forEach(category => {
        const key = getCommonFieldConfigKey(category.classification, category.id);
        const fieldConfigs = category.classification === 'standard' ? category.standardFields : category.comboFields;
        const fieldMap = new Map<string, CategoryFieldConfig>(fieldConfigs.map(field => [field.id, field] as const));
        const defaultEntries = buildInitialCommonFieldConfigs([category])[key] || [];
        const prevEntries = prev[key] || defaultEntries;
        const selectedIds = new Set([
          ...prevEntries.map(field => field.id),
          ...fieldConfigs.filter(field => field.isRequired).map(field => field.id),
        ]);

        next[key] = Array.from(selectedIds)
          .map(fieldId => {
            const sourceField = fieldMap.get(fieldId);
            if (!sourceField) return null;
            const prevField = prevEntries.find(item => item.id === fieldId);
            return buildCommonFieldConfigEntry({
              ...sourceField,
              displayMode: prevField?.displayMode ?? sourceField.displayMode ?? 'visible',
              childConfigs: buildChildConfigs(
                fieldId,
                prevField?.childConfigs || sourceField.childConfigs,
                resolveChildRequiredConfigs(fieldId, fieldMap, prevField?.childRequiredConfigs || sourceField.childRequiredConfigs)
              ),
              childRequiredConfigs: prevField?.childRequiredConfigs || sourceField.childRequiredConfigs,
            }, fieldMap);
          })
          .filter((item): item is CategoryFieldConfig => !!item);
      });

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const serialize = (value: CategoryFieldConfig[] = []) => JSON.stringify(value);
      const changed = prevKeys.length !== nextKeys.length || nextKeys.some(key => serialize(prev[key]) !== serialize(next[key]));
      return changed ? next : prev;
    };

    setCommonFieldConfigs(syncConfigs);
    setChannelCommonFieldConfigs(syncConfigs);
  }, [webCategories]);

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleProductMenu = (key: 'product_library' | 'product_operations') => {
    setExpandedMenus(prev => {
      const otherGroups = prev.filter(item => !['product_library', 'product_operations'].includes(item));
      return prev.includes(key) ? otherGroups : [...otherGroups, key];
    });
  };

  const resetTransientViews = () => {
    setCreationContext(null);
    setDetailContext(null);
    setRequiredPolicyEditorContext(null);
    setStoreRegionEditorContext(null);
    setAttributeMutexEditorContext(null);
    setCategorySelectContext(null);
  };

  const switchTopNav = (target: TopNavView) => {
    if (target === activeTopNav) return;
    resetTransientViews();
    setActiveTopNav(target);

    if (target === 'brand') {
      setExpandedMenus(['security_compliance', 'log_audit']);
      setActiveMenu('product_logs');
      return;
    }

    setExpandedMenus([]);
    setActiveMenu('product_list');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(productMenuGuideStorageKey, 'seen');
    setShowProductMenuGuide(false);
  }, []);

  useEffect(() => {
    if (!channelCatalogMenuVisible && activeMenu === 'channel_product_library') {
      setActiveMenu('product_list');
    }
  }, [activeMenu, channelCatalogMenuVisible]);

  useEffect(() => {
    if (!experience) return;
    if (['product_publish', 'product_batch', 'takeout_menu_sync'].includes(activeMenu)) {
      setActiveMenu('product_sync');
      return;
    }
    if (experience.unified && ['channel_product_library', 'channel_attributes', 'channel_categories', 'channel_custom_attributes'].includes(activeMenu)) {
      setActiveMenu('product_list');
      setCreationContext(null);
      setDetailContext(null);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'web');
    url.searchParams.delete('scenario');
    url.searchParams.set('menu', activeMenu);
    window.history.replaceState(null, '', url);
  }, [activeMenu, experience?.unified]);

  useEffect(() => {
    const libraryMenus = [
      'product_list', 'categories', 'category_management', 'product_attributes',
      'channel_product_library', 'channel_categories', 'channel_attributes', 'channel_custom_attributes',
      'ingredient_library', 'nutrition_manager',
      'recipe_default', 'recipe_legacy', 'recipe_new', 'addon_group',
    ];
    const operationMenus = [
      'product_sync', 'product_publish', 'product_batch', 'product_records', 'product_template', 'sales_scope', 'buffet_menu', 'price_systems',
      'attribute_mutex_rules', 'required_product_policy', 'product_recommendation', 'product_mapping',
    ];
    const targetGroup = libraryMenus.includes(activeMenu)
      ? 'product_library'
      : operationMenus.includes(activeMenu)
        ? 'product_operations'
        : null;

    if (!targetGroup) return;
    setExpandedMenus(prev => [
      ...prev.filter(item => !['product_library', 'product_operations'].includes(item)),
      targetGroup,
    ]);
  }, [activeMenu]);

  const handleCloseProductMenuGuide = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(productMenuGuideStorageKey, 'seen');
    }
    setShowProductMenuGuide(false);
  };

  const productMenuGuideSteps = [
    {
      step: '1/2',
      title: '新增【商品销售管理】入口',
      desc: '商品下发模板、门店售卖规则、价格策略等能力统一进入【商品销售管理】',
      cardPosition: 'left-[164px] top-[138px]',
      highlightPosition: 'left-[12px] top-[198px] h-[120px] w-[176px]',
    },
    {
      step: '2/2',
      title: '【门店分类与属性】入口升级',
      desc: '门店分类、门店加料和门店做法统一进入【门店分类与属性】',
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
      if (activeMenu === 'common_field_settings') {
          return (
              <WebCommonFieldSettings
                  categories={webCategories}
                  configs={commonFieldSettingsContext?.formScope === 'unified' ? unifiedCommonFieldConfigs : commonFieldSettingsContext?.formScope === 'channel' ? channelCommonFieldConfigs : commonFieldConfigs}
                  initialType={commonFieldSettingsContext?.type}
                  initialCategoryId={commonFieldSettingsContext?.categoryId || null}
                  fieldScope={commonFieldSettingsContext?.formScope || 'master'}
                  scopeLabel={commonFieldSettingsContext?.formScope === 'channel'
                    ? `${commonFieldSettingsContext.catalogName || '渠道商品库'}常用字段`
                    : commonFieldSettingsContext?.formScope === 'unified'
                      ? '商品常用字段'
                      : '商品主档常用字段'}
                  onBack={() => setActiveMenu('product_list')}
                  onSave={(type, categoryId, fieldConfigs) => {
                      if (commonFieldSettingsContext?.formScope === 'unified') {
                        const key = getCommonFieldConfigKey(type, categoryId);
                        setCommonFieldConfigs(prev => ({ ...prev, [key]: fieldConfigs }));
                        setChannelCommonFieldConfigs(prev => ({ ...prev, [key]: fieldConfigs }));
                        return;
                      }
                      const updateConfigs = commonFieldSettingsContext?.formScope === 'channel'
                        ? setChannelCommonFieldConfigs
                        : setCommonFieldConfigs;
                      updateConfigs(prev => ({
                          ...prev,
                          [getCommonFieldConfigKey(type, categoryId)]: fieldConfigs,
                      }));
                  }}
                  onReset={(type, categoryId) => {
                      const targetCategory = webCategories.find(item => item.classification === type && item.id === categoryId);
                      if (!targetCategory) return;
                      const defaultConfigKey = getCommonFieldConfigKey(type, categoryId);
                      const defaultConfigs = buildInitialCommonFieldConfigs([targetCategory])[defaultConfigKey] || [];
                      if (commonFieldSettingsContext?.formScope === 'unified') {
                        setCommonFieldConfigs(prev => ({ ...prev, [defaultConfigKey]: defaultConfigs }));
                        setChannelCommonFieldConfigs(prev => ({ ...prev, [defaultConfigKey]: defaultConfigs }));
                        return;
                      }
                      const updateConfigs = commonFieldSettingsContext?.formScope === 'channel'
                        ? setChannelCommonFieldConfigs
                        : setCommonFieldConfigs;
                      updateConfigs(prev => ({
                          ...prev,
                          [defaultConfigKey]: defaultConfigs,
                      }));
                  }}
              />
          );
      }

      if (creationContext) {
          const effectiveFormScope = creationContext.formScope
            || (creationContext.scope === 'store'
              ? 'store'
              : unifiedManagement
                ? 'unified'
                : 'master');
          const unifiedChannelIds = unifiedDefaultGroup?.channels || [];
          const effectiveChannelContext = creationContext.channelContext || (
            effectiveFormScope === 'unified'
              ? {
                  catalogId: unifiedDefaultGroup?.id || UNIFIED_CHANNEL_CATALOG_ID,
                  catalogName: '商品',
                  channelIds: unifiedChannelIds,
                  channelNames: unifiedChannelIds.map(channelId => getOmnichannelChannel(channelId).shortName),
                  masterName: creationContext.product?.name || '新建单品',
                  skuId: creationContext.product?.skuId || creationContext.product?.id || '',
                }
              : undefined
          );
          return (
              <WebProductForm
                  key={`${effectiveFormScope}:${creationContext.mode || 'create'}:${creationContext.product?.id || 'new'}:${creationContext.category?.id || 'uncategorized'}`}
                  type={creationContext.type} 
                  category={creationContext.category} 
                  categories={webCategories.filter(cat => cat.classification === creationContext.type)}
                  mode={creationContext.mode || 'create'}
                  initialProduct={creationContext.product || null}
                  recoveryKey={creationContext.scope !== 'store' && creationContext.mode !== 'edit' ? productFormRecoveryKey(activeBrandId, effectiveFormScope, creationContext.type, creationContext.channelContext?.catalogId || (creationContext.groupMeal ? 'group-meal' : '')) : undefined}
                  recovered={!!creationContext.product?.recoveryRestored}
                  formScope={effectiveFormScope}
                  unifiedManagementView={!!experience?.unified && effectiveFormScope === 'unified'}
                  groupMealContext={!!creationContext.groupMeal}
                  storeAdditionFlow={!!creationContext.storeAddition}
                  initialSection={creationContext.initialSection}
                  initialPublishStoreIds={creationContext.storeReturn?.storeId ? [creationContext.storeReturn.storeId] : undefined}
                  onOpenStoreProducts={() => { setCreationContext(null); setStoreProductManagePreset({ keyword: creationContext.product?.name || '' }); setActiveMenu('store_product_list'); }}
                  onOpenSyncRecords={() => { setCreationContext(null); setProductSyncInitialTab('qimai-records'); setActiveMenu(experience ? 'product_records' : 'product_sync'); }}
                  onOpenManagementTools={() => { setCreationContext(null); setProductSyncInitialTab('publish'); setActiveMenu('product_sync'); }}
                  onOpenStorePublish={product => {
                    setProductPublishPreset({ productId: product.id, channelIds: [...(product.formData?.salesScope?.channelIds || product.formData?.applicableChannelIds || [])], storeIds: creationContext.storeReturn?.storeId ? [creationContext.storeReturn.storeId] : undefined, returnToStore: creationContext.storeReturn });
                    setCreationContext(null);
                    setProductSyncInitialTab('publish');
                    setActiveMenu('product_sync');
                  }}
                  channelContext={effectiveChannelContext}
                  storeContext={creationContext.storeContext}
                  storeRecords={directStoreProducts}
                  onQuerySellingStores={async productId => {
                    // Independent read of the full brand store-product set; no menu/list-filter scope.
                    await new Promise(resolve => window.setTimeout(resolve, 180));
                    return getProductStoreRecords(directStoreProducts, productId).filter(record => record.status === 'on_shelf');
                  }}
                  existingProductCount={products.length}
                  previewPreferenceKey={creationContext.scope === 'store' ? 'web-admin-store-product-form' : 'web-admin-qimai-jingjing'}
                  commonFieldConfigs={creationContext.scope === 'store'
                    ? storeCommonFieldConfigs
                    : effectiveFormScope === 'unified'
                    ? unifiedCommonFieldConfigs
                    : effectiveFormScope === 'channel'
                    ? channelCommonFieldConfigs
                    : commonFieldConfigs}
                  channelEditableFieldIds={channelEditableFieldIds}
                  groupedTagOptions={creationContext.scope === 'store' ? storeGroupedTagOptions : undefined}
                  badgeOptions={creationContext.scope === 'store' ? storeBadgeOptions : undefined}
                  thirdPartyManagementModes={omnichannelConfig.thirdPartyStrategies}
                  onGroupedTagOptionsChange={creationContext.scope === 'store' ? setStoreGroupedTagOptions : undefined}
                  onBadgeOptionsChange={creationContext.scope === 'store' ? setStoreBadgeOptions : undefined}
                   thirdPartyChannelAttributeIds={creationContext.channelAttributeIds || (
                     effectiveFormScope === 'unified'
                       ? unifiedChannelIds.filter(isThirdPartyChannelId)
                       : []
                   )}
                   onProductSaved={(draft, action, saveOptions) => {
                     if (effectiveFormScope === 'store') {
                       const record = creationContext.product as StoreProductRecord;
                       const targets: string[] = draft.formData?.storeTargetChannelIds || record.channels;
                       updateStoreRecords(records => records.flatMap(item => {
                         if (item.id !== record.id || item.storeId !== record.storeId) return [item];
                         const remaining = item.channels.filter(channel => !targets.includes(channel));
                         const changed = { ...item, name: draft.name, price: draft.price, image: draft.image, category: draft.category, formData: draft.formData, channels: item.channels.filter(channel => targets.includes(channel)), id: remaining.length ? `${item.id}:edited:${targets.join('-')}` : item.id };
                         return [...(remaining.length ? [{ ...item, channels: remaining }] : []), ...(changed.channels.length ? [changed] : [])];
                       }));
                       setStoreFormOverrides(current => ({ ...current, ...Object.fromEntries(targets.map(channel => [`${activeBrandId}:${record.id}:${channel}`, draft])) }));
                       const batch = createTakeoutStoreBatch({ ...draft, id: record.baseProductId, storeId: record.storeId, storeName: record.storeName }, targets.filter(isTakeoutChannel).filter(channel => omnichannelConfig.thirdPartyStrategies[channel] === 'qimai'), 'structure');
                       if (batch) setDirectSyncBatchesByBrand(current => ({ ...current, [activeBrandId]: [batch, ...(current[activeBrandId] || [])] }));
                       return;
                     }
                     if (creationContext.formScope === 'channel') {
                       if (creationContext.channelProductKey) {
                         setChannelProductOverrides(prev => ({
                           ...prev,
                           [creationContext.channelProductKey as string]: {
                             ...(prev[creationContext.channelProductKey as string] || creationContext.product),
                             ...draft,
                           },
                         }));
                       }
                       return;
                     }
                      if (effectiveFormScope === 'unified') {
                        const productId = draft.id || creationContext.product?.id || `product-${Date.now()}`;
                        const channelProductName = String(draft.formData?.p_name || draft.name || '');
                        const nextProduct = {
                          ...creationContext.product,
                          ...draft,
                          id: productId,
                          name: draft.name,
                          formData: {
                            ...(draft.formData || {}),
                            p_name: draft.name,
                          },
                          status: saveOptions?.intent === 'draft' ? 'draft' : (creationContext.product?.status && creationContext.product.status !== 'draft' ? creationContext.product.status : 'on_shelf'),
                          stockStatus: draft.stockStatus || creationContext.product?.stockStatus || 'available',
                        };
                       if (action === 'edit') {
                         updateProduct(productId, nextProduct);
                       } else {
                         addProduct(nextProduct);
                       }
                       if (creationContext.storeAddition && saveOptions?.intent === 'save') resumeStoreAddition(creationContext.storeAddition, productId);
                       if (saveOptions?.withdrawalAction === 'off_shelf' && saveOptions.withdrawnChannelIds?.length) {
                         const alias: Record<string, string> = { mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take', douyin: 'douyin_dine', eleme: 'taobao' };
                         const withdrawn = saveOptions.withdrawnChannelIds;
                         const rows = directStoreProducts.filter(record => record.baseProductId === productId).flatMap(record => record.channels.filter(channel => withdrawn.some(id => (alias[id] || id) === channel || id === channel)).map(channel => ({ ...record, channel })));
                         if (rows.length) {
                           const id = `WD${Date.now()}`, createdAt = new Date().toLocaleString('sv-SE', { hour12: false });
                           const storeCount = new Set(rows.map(row => row.storeId)).size;
                           const channels = withdrawn.map(channel => getOmnichannelChannel(channel).name);
                           const platformChannels = withdrawn.filter(channel => isThirdPartyChannelId(channel) && omnichannelConfig.thirdPartyStrategies[channel] === 'qimai');
                           const batch: PublishBatch = {
                             id, recordType: 'store_publish', title: `${draft.name} · 取消渠道并下架`, action: '下架门店渠道商品', sourceType: '门店商品', sourceName: draft.name,
                             snapshot: '取消销售渠道时确认的已有门店商品', channels, storeScope: `${storeCount} 家已有门店`, storeCount, productCount: 1, skuCount: 1, status: 'running', createdAt, creator: '当前用户',
                             tasks: [{ id: `QM-${id}`, type: 'qimai', target: '下架企迈门店商品', channels, status: 'running', progress: 0, productCount: 1, skuCount: 1, storeCount, successCount: 0, failedCount: 0, waitingCount: rows.length, startedAt: createdAt }, ...platformChannels.map(channel => ({ id: `PL-${id}-${channel}`, type: 'platform' as const, target: `${getOmnichannelChannel(channel).name}门店商品下架`, channels: [getOmnichannelChannel(channel).name], status: 'waiting' as const, progress: 0, productCount: 1, skuCount: 1, storeCount, successCount: 0, failedCount: 0, waitingCount: rows.filter(row => row.channel === (alias[channel] || channel)).length, startedAt: createdAt, waitingReason: '等待企迈下架任务完成' }))],
                             details: rows.map(row => ({ id: `${id}-${row.id}-${row.channel}`, taskType: 'qimai', productName: row.name, productId, skuName: '当前规格', skuId: productId, storeName: row.storeName, storeId: row.storeId, channel: channels[withdrawn.findIndex(channel => (alias[channel] || channel) === row.channel || channel === row.channel)] || row.channel, action: '下架企迈门店商品', fields: ['上下架'], status: 'running', finishedAt: '等待执行' })),
                           };
                           setDirectSyncBatchesByBrand(current => ({ ...current, [activeBrandId]: [batch, ...(current[activeBrandId] || [])] }));
                           setPendingWithdrawals(current => [...current, { brandId: activeBrandId, productId, channelIds: Array.from(new Set(rows.map(row => row.channel))), batch }]);
                         }
                       }
                        const targetCatalogId = effectiveChannelContext?.catalogId || UNIFIED_CHANNEL_CATALOG_ID;
                        setChannelProductOverrides(prev => ({
                          ...prev,
                          [`${targetCatalogId}:${productId}`]: {
                            ...nextProduct,
                            name: channelProductName,
                            formData: {
                              ...(draft.formData || {}),
                              p_name: channelProductName,
                            },
                          },
                        }));
                       if (saveOptions?.intent === 'publish') {
                         const scope = saveOptions.publishScope;
                         if (scope?.channelIds?.length && scope.storeIds?.length) {
                           const channelAlias: Record<string, string> = {
                             mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take',
                             douyin: 'douyin_dine', meituan_dine: 'meituan_dine',
                           };
                           const records: StoreProductRecord[] = scope.storeIds.flatMap(storeId => {
                             const store = PRODUCT_SALES_SCOPE_STORES.find(item => item.id === storeId);
                             if (!store) return [];
                             return scope.channelIds.map((channelId, index) => ({
                               id: `direct-${productId}-${storeId}-${channelId}`,
                               baseProductId: productId, name: draft.name,
                               type: draft.type === 'combo' ? 'Combo' as const : 'Standard' as const,
                               category: draft.category, storeName: store.name, storeId,
                               channels: [channelAlias[channelId] || channelId], image: draft.image, tags: [],
                               status: 'off_shelf' as const, stockStatus: 'normal' as const, stockCount: 9999,
                               isMultiSpec: false, lastSync: '刚刚', sortIndex: index,
                             }));
                           });
                           const managedPlatformChannels = scope.channelIds.filter(channelId => isThirdPartyChannelId(channelId) && omnichannelConfig.thirdPartyStrategies[channelId] === 'qimai');
                           const onlineChannels = managedPlatformChannels.filter(channelId => channelId === 'douyin' || channelId === 'meituan_dine');
                           const createdAt = new Date().toLocaleString('sv-SE', { hour12: false });
                           setAutomaticOnlineSubmissions(current => {
                             const brand = current[activeBrandId] || {};
                             return { ...current, [activeBrandId]: Object.fromEntries(['douyin', 'meituan'].map(platform => {
                               const updates = { ...(brand[platform] || {}) };
                               delete updates[productId];
                               if (onlineChannels.includes(platform === 'douyin' ? 'douyin' : 'meituan_dine')) updates[productId] = createdAt;
                               return [platform, updates];
                             })) };
                           });
                           const batchId = `DS${Date.now()}`;
                           const takeoutFailures = Object.fromEntries(managedPlatformChannels.filter(isTakeoutChannel).map(channel => [channel, [...checkTakeoutProduct(draft, channel), ...(channel === 'jd' ? checkJdStoreReadiness(draft.formData?.jdStoreReadiness) : [])].map(issue => `${issue.field}：${issue.message}`).join('；')]));
                           const channelNames = scope.channelIds.map(channelId => getOmnichannelChannel(channelId).name);
                           const brandBatches: PublishBatch[] = onlineChannels.map(channelId => {
                             const channelName = getOmnichannelChannel(channelId).name;
                             const isDouyin = channelId === 'douyin';
                             const waitingReason = isDouyin ? '品牌商品同步待执行；同步后需等待抖音审核通过' : '品牌商品同步待执行';
                             return {
                               recordType: isDouyin ? 'douyin_standard' : 'meituan_brand',
                               id: `BR-${batchId}-${channelId}`, title: `${channelName}品牌商品同步`,
                               action: '创建或更新平台品牌商品', sourceType: '商品库', sourceName: draft.name,
                               snapshot: `商品 ${draft.name} · 保存时资料`, channels: [channelName],
                               storeScope: '品牌级同步，不涉及门店', storeCount: 0, productCount: 1, skuCount: 1,
                               status: 'running', createdAt, creator: '当前用户',
                               tasks: [{ id: `BR-TASK-${batchId}-${channelId}`, type: 'platform', target: `${channelName}品牌商品`, channels: [channelName], status: 'waiting', progress: 0, productCount: 1, skuCount: 1, storeCount: 0, successCount: 0, failedCount: 0, waitingCount: 1, startedAt: createdAt, waitingReason }],
                             };
                           });
                           const batch: PublishBatch = {
                             recordType: 'store_publish', id: batchId,
                             title: `${draft.name} · 保存并下发`,
                             action: action === 'create' ? '创建企迈门店商品' : '更新企迈门店商品',
                             sourceType: '商品库', sourceName: draft.name,
                             snapshot: `销售渠道 ${scope.channelIds.length} 个、销售门店 ${scope.storeIds.length} 家；已有商品更新：${saveOptions.overwriteFields?.join('、') || '不覆盖已有资料'}`,
                             channels: channelNames, storeScope: PRODUCT_SALES_SCOPE_STORES.filter(store => scope.storeIds.includes(store.id)).map(store => store.name).join('、'), storeCount: scope.storeIds.length,
                             productCount: 1, skuCount: 1, status: 'success', createdAt, creator: '当前用户',
                             tasks: [{ id: `QM-${batchId}`, type: 'qimai', target: '企迈门店渠道商品', channels: channelNames, status: 'success', progress: 100, productCount: 1, skuCount: 1, storeCount: scope.storeIds.length, successCount: records.length, failedCount: 0, waitingCount: 0, startedAt: createdAt, finishedAt: createdAt },
                               ...managedPlatformChannels.map(channelId => ({ id: `PL-${batchId}-${channelId}`, type: 'platform' as const, target: `${getOmnichannelChannel(channelId).name}门店商品`, channels: [getOmnichannelChannel(channelId).name], status: takeoutFailures[channelId] ? 'failed' as const : 'waiting' as const, progress: takeoutFailures[channelId] ? 100 : 0, productCount: 1, skuCount: 1, storeCount: scope.storeIds.length, successCount: 0, failedCount: takeoutFailures[channelId] ? scope.storeIds.length : 0, waitingCount: takeoutFailures[channelId] ? 0 : scope.storeIds.length, startedAt: createdAt, ...(takeoutFailures[channelId] ? { error: takeoutFailures[channelId] } : {}), ...(isTakeoutChannel(channelId) ? { waitingReason: takeoutOperationPlan(channelId, 'structure') } : channelId === 'douyin' ? { waitingReason: '等待抖音品牌商品同步并审核通过' } : channelId === 'meituan_dine' ? { waitingReason: '等待美团品牌商品同步成功' } : {}) }))],
                             details: scope.storeIds.flatMap(storeId => scope.channelIds.flatMap(channelId => {
                               const detail = { productName: draft.name, productId, skuName: '当前规格', skuId: String(draft.skuId || productId), storeName: PRODUCT_SALES_SCOPE_STORES.find(store => store.id === storeId)?.name || storeId, storeId, channel: getOmnichannelChannel(channelId).name, fields: saveOptions.overwriteFields || [] };
                               return [{ ...detail, id: `${batchId}-qimai-${storeId}-${channelId}`, taskType: 'qimai' as const, action: action === 'create' ? '创建企迈门店商品' : '更新企迈门店商品', status: 'success' as const, finishedAt: createdAt }, ...(managedPlatformChannels.includes(channelId) ? [{ ...detail, id: `${batchId}-platform-${storeId}-${channelId}`, taskType: 'platform' as const, action: isTakeoutChannel(channelId) ? takeoutOperationPlan(channelId, 'structure') : '同步平台门店商品', status: takeoutFailures[channelId] ? 'failed' as const : 'waiting' as const, finishedAt: takeoutFailures[channelId] ? createdAt : '等待平台执行', ...(takeoutFailures[channelId] ? { error: takeoutFailures[channelId] } : {}) }] : [])];
                             })),
                           };
                           const pendingBatch: PublishBatch = {
                             ...batch, status: 'running',
                             tasks: batch.tasks.filter(task => task.type === 'qimai').map(task => ({ ...task, status: 'running', progress: 0, successCount: 0, waitingCount: records.length, finishedAt: undefined })),
                             details: batch.details?.filter(detail => detail.taskType === 'qimai').map(detail => ({ ...detail, status: 'running', finishedAt: '等待企迈任务执行' })),
                           };
                           setDirectSyncBatchesByBrand(current => ({ ...current, [activeBrandId]: [pendingBatch, ...brandBatches, ...(current[activeBrandId] || [])] }));
                           setPendingDirectJobs(current => [...current, { brandId: activeBrandId, productId, records, batch, draft, previousProduct: products.find(product => product.id === productId) || creationContext.product, overwriteFields: saveOptions.overwriteFields || [], readyAt: Date.now() + 4000 }]);
                         }
                       }
                       return;
                      }
                      if (action === 'edit' && draft.id) {
                        updateProduct(draft.id, { ...draft, ...(creationContext.storeAddition && saveOptions?.intent === 'save' ? { status: 'on_shelf' } : {}) });
                        if (creationContext.storeAddition && saveOptions?.intent === 'save') resumeStoreAddition(creationContext.storeAddition, draft.id);
                        return;
                      }
                      if (action === 'create') {
                        addProduct({
                          ...draft,
                          id: draft.id,
                          status: creationContext.storeAddition && saveOptions?.intent === 'save' ? 'on_shelf' : 'draft',
                          stockStatus: 'available',
                        });
                      }
                      if (creationContext.storeAddition && saveOptions?.intent === 'save') resumeStoreAddition(creationContext.storeAddition, draft.id);
                    }}
                    onOpenChannelCatalog={(action, product) => {
                      const currentMaster = products.find(item => item.id === product.id);
                      setMasterChannelSyncDialogContext({
                        entry: action === 'add' ? 'after-create' : 'after-save',
                        products: [{ ...currentMaster, ...product } as Product],
                        catalogs: masterChannelSyncCatalogs,
                      });
                    }}
                   onOpenCommonFieldSettings={(type, categoryId) => {
                      setCommonFieldSettingsContext({
                        type,
                        categoryId,
                        formScope: effectiveFormScope === 'unified' && !experience?.unified ? 'channel' : effectiveFormScope,
                        catalogName: effectiveFormScope === 'unified'
                          ? creationContext.channelContext?.catalogName || '品牌默认商品库'
                          : creationContext.channelContext?.catalogName,
                      });
                      setActiveMenu('common_field_settings');
                  }}
                  onClose={() => creationContext.storeAddition ? resumeStoreAddition(creationContext.storeAddition) : setCreationContext(null)}
              />
          );
      }

      if (detailContext) {
          return (
              <WebProductDetail 
                  product={detailContext} 
                  onClose={() => setDetailContext(null)} 
                  onEdit={() => {
                    const product = detailContext;
                    const targetType = product.type === 'combo' ? 'combo' : 'standard';
                    const matchedCategory = webCategories
                      .filter(category => category.classification === targetType)
                      .find(category => category.children?.some(child => child.id === product.category));
                    const targetCategory = matchedCategory?.children?.find(child => child.id === product.category)
                      || webCategories.find(category => category.classification === targetType)
                      || webCategories[0];
                    setCreationContext({
                      type: targetType,
                      category: targetCategory,
                      mode: 'edit',
                      product,
                      scope: 'brand',
                      formScope: experience?.unified ? 'unified' : 'master',
                    });
                    setDetailContext(null);
                  }}
              />
          );
      }

      if (activeMenu === 'required_product_policy' && requiredPolicyEditorContext) {
          return (
              <WebRequiredProductPolicyEditor
                  mode={requiredPolicyEditorContext.mode}
                  policy={requiredPolicyEditorContext.policy}
                  policies={requiredPolicies}
                  onBack={() => setRequiredPolicyEditorContext(null)}
                  onSave={(savedPolicy) => {
                    setRequiredPolicies(current => requiredPolicyEditorContext.mode === 'create'
                      ? [savedPolicy, ...current]
                      : current.map(item => item.id === savedPolicy.id ? savedPolicy : item));
                    setRequiredPolicyNotice(requiredPolicyEditorContext.mode === 'create'
                      ? `方案“${savedPolicy.name}”创建成功，已启用`
                      : `方案“${savedPolicy.name}”保存成功`);
                    setRequiredPolicyEditorContext(null);
                  }}
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
          return (
            <WebStoreProductList
              key={`${storeProductManagePreset?.storeId || 'all'}:${storeProductManagePreset?.channelId || 'all'}`}
              mode="manage"
              records={directStoreProducts}
              onRecordsChange={updateStoreRecords}
              expandedChannelNavigation={!!experience}
              managePreset={storeProductManagePreset}
              onAddProduct={target => {
                const returnToStore = { storeId: target.storeId, channelId: target.channelId };
                setProductPublishPreset({ channelIds: target.channelId === 'all' ? [] : [fromStoreChannel(target.channelId)], storeIds: target.storeId === 'all' ? [] : [target.storeId], returnToStore });
                setProductSyncInitialTab('publish');
                setActiveMenu('product_sync');
              }}

              onSubmitTask={batch => setDirectSyncBatchesByBrand(current => ({ ...current, [activeBrandId]: [batch, ...(current[activeBrandId] || [])] }))}
              onEditProduct={(product, channelId) => {
                const targetType = product.type === 'Combo' ? 'combo' : 'standard';
                const libraryProduct: any = products.find(item => item.id === product.baseProductId || item.name === product.name);
                const storedCategoryId = (product as any).formData?.prototypeCategoryId || libraryProduct?.formData?.prototypeCategoryId;
                const targetCategory = webCategories.find(cat => cat.id === storedCategoryId && cat.classification === targetType)
                  || webCategories.find(cat => cat.name === product.category && cat.classification === targetType)
                  || (targetType === 'standard' && libraryProduct?.formData?.p_weight_flag ? webCategories.find(cat => cat.id === 'w_cat_s3') : undefined)
                  || webCategories.find(cat => cat.classification === targetType) || webCategories[0];
                if (!targetCategory) return;
                setCreationContext({
                  type: targetType,
                  category: targetCategory,
                  mode: 'edit',
                  product: {
                    ...products.find(item => item.id === product.baseProductId || item.name === product.name),
                    ...product,
                    category: product.category,
                    ...(storeFormOverrides[`${activeBrandId}:${product.id}:${channelId === 'all' ? product.channels[0] : channelId}`] || {}),
                  },
                  scope: 'store',
                  formScope: 'store',
                  channelAttributeIds: (channelId === 'all' ? product.channels : [channelId]).map(id => id === 'eleme' ? 'taobao' : id === 'douyin_dine' ? 'douyin' : id).filter(isThirdPartyChannelId).filter(id => omnichannelConfig.thirdPartyStrategies[id] === 'qimai'),
                  storeContext: {
                    storeId: product.storeId,
                    storeName: product.storeName,
                    currentChannelIds: product.channels,
                    activeChannelId: channelId,
                  },
                });
              }}
            />
          );
      }

      if (activeMenu === 'group_meal_products') {
        return <WebGroupMealProducts onCreate={type => {
          const formScope = experience?.unified ? 'unified' : 'master';
          setCategorySelectContext({ type, scope: 'brand', formScope, groupMeal: true });
        }} onEdit={product => {
          const type = product.type === 'combo' ? 'combo' : 'standard';
          const category = webCategories.find(item => item.id === product.formData?.prototypeCategoryId) || webCategories.find(item => item.classification === type);
          if (category) setCreationContext({ type, category, mode: 'edit', product, scope: 'brand', formScope: experience?.unified ? 'unified' : 'master', groupMeal: true });
        }} />;
      }

      if (activeMenu === 'store_product_coverage') {
          return (
            <WebStoreProductList
              mode="coverage"
              records={directStoreProducts}
              onRecordsChange={updateStoreRecords}
              onOpenManageProduct={(preset) => {
                setStoreProductManagePreset(preset);
                setActiveMenu('store_product_list');
              }}
            />
          );
      }

      if (activeMenu === 'store_addon_list') {
          return (
            <WebStoreAttributeManager
              onSubmitTask={batch => setDirectSyncBatchesByBrand(current => ({ ...current, [activeBrandId]: [batch, ...(current[activeBrandId] || [])] }))}
              initialTab="addon"
              showTabs={false}
              groupedTagOptions={storeGroupedTagOptions}
              badgeOptions={storeBadgeOptions}
              onGroupedTagOptionsChange={setStoreGroupedTagOptions}
              onBadgeOptionsChange={setStoreBadgeOptions}
            />
          );
      }

      if (activeMenu === 'store_method_list') {
          return (
            <WebStoreAttributeManager
              onSubmitTask={batch => setDirectSyncBatchesByBrand(current => ({ ...current, [activeBrandId]: [batch, ...(current[activeBrandId] || [])] }))}
              initialTab="method"
              showTabs={false}
              groupedTagOptions={storeGroupedTagOptions}
              badgeOptions={storeBadgeOptions}
              onGroupedTagOptionsChange={setStoreGroupedTagOptions}
              onBadgeOptionsChange={setStoreBadgeOptions}
            />
          );
      }

      if (activeMenu === 'store_attribute_list') {
          return (
            <WebStoreAttributeManager
              onSubmitTask={batch => setDirectSyncBatchesByBrand(current => ({ ...current, [activeBrandId]: [batch, ...(current[activeBrandId] || [])] }))}
              initialTab="addon"
              showTabs={false}
              groupedTagOptions={storeGroupedTagOptions}
              badgeOptions={storeBadgeOptions}
              onGroupedTagOptionsChange={setStoreGroupedTagOptions}
              onBadgeOptionsChange={setStoreBadgeOptions}
            />
          );
      }

      if (activeMenu === 'store_region_list') {
          return <WebStoreRegionList onEditRegion={(region) => setStoreRegionEditorContext(region)} />;
      }

      if (activeMenu === 'required_product_policy') {
          return (
              <WebRequiredProductPolicyList
                  policies={requiredPolicies}
                  onPoliciesChange={setRequiredPolicies}
                  notice={requiredPolicyNotice}
                  onNoticeConsumed={() => setRequiredPolicyNotice('')}
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
          return (
            <WebProductAttributeManager
              scope="master"
              initialTab="category"
            />
          );
      }

      if (activeMenu === 'channel_categories') {
          return <WebProductAttributeManager scope="channel" initialTab="category" />;
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
          return <WebNutritionManager onNavigate={(path) => setActiveMenu(path)} />;
      }

      if (activeMenu === 'addon_group') {
          return <WebAddonGroupManager onBack={() => setActiveMenu(lastRecipeMenu)} />;
      }

      if (activeMenu === 'general_settings') {
          return (
            <WebGeneralSettings
              configOverride={experience ? omnichannelConfig : undefined}
              onOpenChannelFieldSettings={() => {
                const firstStandardCategory = webCategories.find(item => item.classification === 'standard');
                setCommonFieldSettingsContext({
                  type: 'standard',
                  categoryId: firstStandardCategory?.id || null,
                  formScope: experience?.unified ? 'unified' : 'channel',
                  catalogName: '渠道商品库',
                });
                setActiveMenu('common_field_settings');
              }}
               onOpenChannelOverrideSettings={() => setActiveMenu('channel_override_settings')}
                onOpenOmnichannelSettings={() => setActiveMenu('omnichannel_settings')}
                onOpenProductRecommendation={() => setActiveMenu('product_recommendation')}
             />
          );
      }

      if (activeMenu === 'omnichannel_settings') {
          return <WebOmnichannelSettings
            key={experience ? omnichannelConfig.collaborationMode : undefined}
            configOverride={experience ? omnichannelConfig : undefined}
            onBack={() => setActiveMenu('general_settings')}
          />;
      }

      if (activeMenu === 'channel_override_settings') {
          return (
            <WebChannelOverrideSettings
              value={channelEditableFieldIds}
              onChange={setChannelEditableFieldIds}
              onBack={() => setActiveMenu('general_settings')}
            />
          );
      }

      if (activeMenu === 'product_attributes') {
          return <WebProductAttributeManager scope={experience?.unified ? 'all' : 'master'} />;
      }

      if (activeMenu === 'channel_attributes') {
          return <WebProductAttributeManager scope="channel" onOpenSyncRecords={() => { setProductSyncInitialTab('platform-records'); setActiveMenu(experience ? 'product_records' : 'product_sync'); }} />;
      }

      if (activeMenu === 'channel_custom_attributes') {
          return <WebProductAttributeManager scope="channel" initialTab="custom_attribute" />;
      }

      if (activeMenu === 'price_systems') {
          return <WebPriceSystemList />;
      }

      if (['product_sync', 'product_publish', 'product_batch', 'product_records'].includes(activeMenu)) {
          const focus = activeMenu === 'product_records' ? 'records' : undefined;
          const catalogProductIds = Object.fromEntries(getEffectiveChannelGroups(omnichannelConfig).map((group, index) => [group.id,
            unifiedManagement ? products.map(product => product.id) : Array.from(new Set([
              ...(index === 0 ? products.slice(0, 4) : products.slice(1, 3)).map(product => product.id),
              ...products.filter(product => product.type === 'combo').slice(0, 1).map(product => product.id),
              ...products.filter(product => !!channelProductOverrides[`${group.id}:${product.id}`]).map(product => product.id),
            ])),
          ]));
          return <WebProductSync key={`${activeMenu}:${omnichannelConfig.collaborationMode}:${JSON.stringify(libraryBatchPreset || productPublishPreset) || 'default'}`} initialBatch={libraryBatchPreset || undefined} onApplyLibraryBatch={applyLibraryBatch} onReturnToLibrary={() => { if (libraryBatchPreset) setLibraryReturnTab(libraryBatchPreset.returnTab); setLibraryBatchPreset(null); setActiveMenu('product_list'); }} initialPublish={productPublishPreset || undefined} focus={focus} hideNavigation={!!experience} onRecordViewChange={setProductSyncInitialTab} directUse={false} unifiedManagementView={!!experience?.unified} initialTab={activeMenu === 'product_records' ? productSyncInitialTab : 'publish'} masterChannelSyncRecords={masterChannelSyncRecords} extraBatches={directSyncBatches} sourceProducts={products} catalogProductIds={catalogProductIds} channelProductOverrides={channelProductOverrides} storeSourceRecords={directStoreProducts} onRemoveStoreTargets={targets => updateStoreRecords(prev => removeDeletedTargets(prev, targets))}
            onSubmitTask={handleProductToolTask}
            onCreateProduct={productPublishPreset?.returnToStore ? (type, selection) => setCategorySelectContext({ type, scope: 'brand', formScope: experience?.unified ? 'unified' : 'master', storeAddition: { ...selection, returnToStore: productPublishPreset.returnToStore! } }) : undefined}
            onReturnToStore={productPublishPreset?.returnToStore ? () => { setStoreProductManagePreset(productPublishPreset.returnToStore!); setActiveMenu('store_product_list'); } : undefined}
            onOpenRecords={() => { setProductSyncInitialTab('qimai-records'); setActiveMenu(experience ? 'product_records' : 'product_sync'); }} />;
      }

      if (activeMenu === 'product_mapping') {
          return <WebProductMapping />;
      }

      if (activeMenu === 'difference_inspection') {
          return <WebDifferenceInspection />;
      }

      if (activeMenu === 'product_recommendation') {
          return <WebProductRecommendationManager />;
      }

      if (activeMenu === 'takeout_menu_sync' && !experience) {
          return <WebTakeoutMenuSync />;
      }

      if (activeMenu === 'product_template') {
          return <WebProductTemplateManager channelProductOverrides={channelProductOverrides} templateProductOverrides={templateProductOverrides} onTemplateProductSaved={(key, product) => setTemplateProductOverrides(prev => ({ ...prev, [key]: product }))} categories={webCategories} commonFieldConfigs={channelCommonFieldConfigs} channelEditableFieldIds={channelEditableFieldIds} productMemberships={templateMemberships} onMembershipChange={(templateId, ids) => setTemplateMembershipsByBrand(current => ({ ...current, [activeBrandId]: { ...templateMemberships, [templateId]: ids } }))} onNavigate={(path) => {
            if (path === 'product_sync') setProductSyncInitialTab('publish');
            navigateExperience(path);
          }} />;
      }

      if (activeMenu === 'sales_scope') {
          return <WebSalesScopeManager />;
      }

      if (activeMenu === 'buffet_menu') {
          return <WebBuffetMenuManager />;
      }

      if (activeMenu === 'channel_product_library' || activeMenu === 'platform_douyin' || activeMenu === 'platform_douyin_addons' || activeMenu === 'platform_meituan') {
          return (
            <WebChannelProductLibrary
              key={`channel-workspace:${activeBrandId}:${omnichannelConfig.collaborationMode}`}
              unifiedManagementView={!!experience?.unified}
              configOverride={experience ? omnichannelConfig : undefined}
              initialGroupId={onlineCatalogId || (activeMenu.startsWith('platform_') ? getEffectiveChannelGroups(omnichannelConfig).find(group => group.channels.includes(activeMenu === 'platform_meituan' ? 'meituan_dine' : 'douyin'))?.id : undefined)}
              onOpenWorkspace={(platform, view, catalogId) => {
                setOnlineCatalogId(catalogId);
                navigateExperience(platform === 'meituan' ? 'platform_meituan' : view === 'addons' ? 'platform_douyin_addons' : 'platform_douyin');
              }}
              initialWorkspace={activeMenu.startsWith('platform_') ? { platform: activeMenu === 'platform_meituan' ? 'meituan' : 'douyin', view: activeMenu === 'platform_douyin_addons' ? 'addons' : 'products' } : undefined}
              workspaceNavigation={experience && activeMenu.startsWith('platform_') ? <div className="console-view-tabs flex h-12 shrink-0 items-end gap-6 border-b border-[#E5E6EB] bg-white px-5" role="tablist" aria-label="在线点商品视图">{[
                ['platform_douyin', '抖音在线点商品'], ['platform_douyin_addons', '抖音在线点加料'], ['platform_meituan', '美团在线点商品'],
              ].filter(([menu]) => {
                const group = getEffectiveChannelGroups(omnichannelConfig).find(item => item.id === onlineCatalogId)
                  || getEffectiveChannelGroups(omnichannelConfig).find(item => item.channels.includes(activeMenu === 'platform_meituan' ? 'meituan_dine' : 'douyin'));
                return group?.channels.includes(menu === 'platform_meituan' ? 'meituan_dine' : 'douyin');
              }).map(([menu, label]) => <button key={menu} type="button" role="tab" aria-selected={activeMenu === menu} aria-current={activeMenu === menu ? 'page' : undefined} onClick={() => navigateExperience(menu)} className={`h-full border-b-2 px-1 text-[14px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460] ${activeMenu === menu ? 'border-[#00B460] text-[#008F4C]' : 'border-transparent text-[#667085] hover:text-[#1D2129]'}`}>{label}</button>)}</div> : undefined}
              onLeaveWorkspace={activeMenu.startsWith('platform_') ? () => navigateExperience(experience?.unified ? 'product_list' : 'channel_product_library') : undefined}
              productOverrides={channelProductOverrides}
              automaticSubmissions={automaticOnlineSubmissions[activeBrandId]}
              onOpenSyncRecords={() => {
                setProductSyncInitialTab('platform-records');
                setActiveMenu(experience ? 'product_records' : 'product_sync');
              }}
              onBatchEdit={() => {
                setCreationContext(null);
                setActiveMenu(experience ? 'product_records' : 'product_sync');
              }}
              onCreateProduct={({ type, catalogId, catalogName, channelIds, channelNames, thirdPartyChannelIds }) => {
                setCategorySelectContext({
                  type,
                  scope: 'brand',
                  formScope: 'unified',
                  channelContext: {
                    catalogId,
                    catalogName,
                    channelIds,
                    channelNames,
                    masterName: '新建单品',
                    skuId: '',
                  },
                  channelAttributeIds: thirdPartyChannelIds,
                });
              }}
              onEditProduct={({ product, catalogId, catalogName, channelIds, channelNames, thirdPartyChannelIds }) => {
                const masterProduct = products.find(item => item.id === product.id) || product;
                const targetType = masterProduct.type === 'combo' ? 'combo' : 'standard';
                const matchedCategory = webCategories
                  .filter(category => category.classification === targetType)
                  .find(category => category.children?.some(child => child.id === masterProduct.category));
                const targetCategory = matchedCategory?.children?.find(child => child.id === masterProduct.category)
                  || webCategories.find(category => category.classification === targetType)
                  || webCategories[0];
                const channelProductKey = `${catalogId}:${product.id}`;
                const channelProduct = channelProductOverrides[channelProductKey] || product;
                setCreationContext({
                  type: targetType,
                  category: targetCategory,
                  mode: 'edit',
                  product: experience?.unified ? masterProduct : channelProduct,
                  scope: 'brand',
                  formScope: experience?.unified ? 'unified' : 'channel',
                  initialSection: activeMenu.startsWith('platform_') ? (experience?.unified ? 'sales-scope' : 'third_party') : undefined,
                  channelContext: {
                    catalogId,
                    catalogName,
                    channelIds,
                    channelNames,
                    masterName: masterProduct.name,
                    skuId: masterProduct.skuCode,
                  },
                  channelAttributeIds: thirdPartyChannelIds,
                  channelProductKey,
                });
              }}
              onEditMasterProduct={({ product }) => {
                const masterProduct = products.find(item => item.id === product.id) || product;
                const targetType = masterProduct.type === 'combo' ? 'combo' : 'standard';
                const matchedCategory = webCategories
                  .filter(category => category.classification === targetType)
                  .find(category => category.children?.some(child => child.id === masterProduct.category));
                const targetCategory = matchedCategory?.children?.find(child => child.id === masterProduct.category)
                  || webCategories.find(category => category.classification === targetType)
                  || webCategories[0];
                setCreationContext({
                  type: targetType,
                  category: targetCategory,
                  mode: 'edit',
                  product: masterProduct,
                  scope: 'brand',
                  formScope: experience?.unified ? 'unified' : 'master',
                });
              }}
              onSyncFromMaster={({ products: selectedChannelProducts, catalogId, catalogName, channelNames }) => {
                const masterProducts = selectedChannelProducts.map(product => products.find(item => item.id === product.id) || product);
                setMasterChannelSyncDialogContext({
                  entry: 'channel-list',
                  products: masterProducts,
                  catalogs: [{ id: catalogId, name: catalogName, channelNames }],
                  lockedCatalogId: catalogId,
                });
              }}
            />
          );
      }

      if (activeMenu === 'product_logs') {
          return <WebProductLogPage />;
      }

      // Default: Product List
      return (
         <WebProductList 
            initialTab={libraryReturnTab}
            onBatchEdit={(type, selectedProducts, returnTab) => { setLibraryReturnTab(returnTab); setLibraryBatchPreset({ type, productIds: selectedProducts.map(product => product.id), returnTab }); setProductPublishPreset(null); setProductSyncInitialTab('publish'); setActiveMenu('product_sync'); }}
            templateProductIds={templateMemberships}
            onAddToTemplates={(templateIds, productIds) => {
              if (productIds.some(id => !currentProductsRef.current.some(product => product.id === id))) throw new Error('商品已变化，请重新选择。');
              setTemplateMembershipsByBrand(current => {
                const memberships = current[activeBrandId] || templateMemberships;
                return { ...current, [activeBrandId]: { ...memberships, ...Object.fromEntries(templateIds.map(id => [id, [...new Set([...(memberships[id] || []), ...productIds])]])) } };
              });
            }}
            onCreateClick={(type) => {
              setCategorySelectContext({ type, scope: 'brand', formScope: experience?.unified ? 'unified' : 'master' });
            }}
            onImportClick={() => setIsImportModalOpen(true)} 
            onImportRecordsClick={() => setIsThirdPartyImportRecordsOpen(true)}
            onViewDetail={(p: any) => setDetailContext(p)}
            onEditProduct={(p: any) => {
              const targetType = p.type === 'combo' ? 'combo' : 'standard';
              const matchedCategory = webCategories
                .filter(cat => cat.classification === targetType)
                .find(cat => cat.children?.some(sc => sc.id === p.category));
              const storedCategory = webCategories.flatMap(category => [category, ...(category.children || [])]).find(category => category.id === p.formData?.prototypeCategoryId);
              const targetCategory = storedCategory || matchedCategory?.children?.find(sc => sc.id === p.category) || webCategories.find(cat => cat.classification === targetType) || webCategories[0];
              setCreationContext({
                type: targetType,
                category: targetCategory,
                mode: 'edit',
                product: p,
                scope: 'brand',
                formScope: experience?.unified ? 'unified' : 'master',
              });
            }}
            onSyncToChannelProducts={(selectedProducts) => {
              setMasterChannelSyncDialogContext({
                entry: 'master-list',
                products: selectedProducts,
                catalogs: masterChannelSyncCatalogs,
              });
            }}
            unifiedManagement={!!experience?.unified}
            directUse={!!experience?.unified}
            storeRecords={directStoreProducts}
            onLifecycleAction={(action, targets) => {
              const ids = new Set(targets.map(product => product.id));
              if (targets.some(target => !currentProductsRef.current.some(product => product.id === target.id))) throw new Error('商品已变更，请关闭弹窗后刷新列表再操作。');
              if (experience?.unified) {
                const removedRecords = directStoreProducts.filter(record => ids.has(record.baseProductId));
                updateStoreRecords(records => action === 'archive'
                  ? records.filter(record => !ids.has(record.baseProductId))
                  : records.map(record => ids.has(record.baseProductId) ? { ...record, status: 'off_shelf', lastSync: '刚刚' } : record));
                if (action === 'archive') setStoreFormOverrides(current => Object.fromEntries(Object.entries(current).filter(([key]) => !removedRecords.some(record => key.startsWith(`${activeBrandId}:${record.id}:`)))));
                // A queued publish must not recreate archived products or undo a disable.
                const cancelledBatches = new Set(pendingDirectJobs.filter(job => job.brandId === activeBrandId && ids.has(job.productId)).map(job => job.batch.id));
                setPendingDirectJobs(current => current.filter(job => job.brandId !== activeBrandId || !ids.has(job.productId)));
                if (cancelledBatches.size) setDirectSyncBatchesByBrand(current => ({ ...current, [activeBrandId]: (current[activeBrandId] || []).map(batch => cancelledBatches.has(batch.id) ? { ...batch, status: 'failed', tasks: batch.tasks.map(task => ({ ...task, status: 'failed', progress: 100, error: action === 'archive' ? '商品已归档，未执行下发。' : '商品已停用，未执行下发。', failedCount: task.waitingCount, waitingCount: 0 })), details: batch.details?.map(detail => ({ ...detail, status: 'failed', error: action === 'archive' ? '商品已归档，未执行下发。' : '商品已停用，未执行下发。' })) } : batch) }));
              }
              targets.forEach(product => action === 'disable' ? updateProduct(product.id, { status: 'off_shelf' }) : deleteProduct(product.id));
            }}
            onlineChannels={{ douyin: !!unifiedDefaultGroup?.channels.includes('douyin'), meituan: !!unifiedDefaultGroup?.channels.includes('meituan_dine') }}
            onOpenOnlineProducts={(platform, view) => {
              setOnlineCatalogId(unifiedDefaultGroup?.id);
              navigateExperience(platform === 'meituan' ? 'platform_meituan' : view === 'addons' ? 'platform_douyin_addons' : 'platform_douyin');
            }}
         />
      );
  };

  const renderContextTabs = () => {
    if (
      creationContext
      || detailContext
      || commonFieldSettingsContext && activeMenu === 'common_field_settings'
      || requiredPolicyEditorContext
      || attributeMutexEditorContext
      || storeRegionEditorContext
      || activeMenu === 'addon_group'
    ) {
      return null;
    }

    type ContextTab = {
      key: string;
      label: string;
      active: boolean;
      onClick: () => void;
    };

    let ariaLabel = '';
    let tabs: ContextTab[] = [];

    if ((experience || activeMenu === 'product_template') && ['product_sync', 'product_publish', 'product_batch', 'product_records', 'product_template'].includes(activeMenu)) {
      ariaLabel = '商品批量管理';
      const currentToolView = ['product_publish', 'product_batch'].includes(activeMenu) ? 'product_sync' : activeMenu;
      tabs = [
        { key: 'product_sync', label: '下发与批量工具' },
        { key: 'product_template', label: '商品下发模板' },
        { key: 'qimai-records', label: '同步任务' },
      ].map(({ key, label }) => ({
        key, label,
        active: key === 'qimai-records' || key === 'platform-records'
          ? currentToolView === 'product_records'
          : currentToolView === key,
        onClick: () => {
          if (key === 'qimai-records' || key === 'platform-records') {
            setProductSyncInitialTab(key);
            navigateExperience('product_records');
          } else navigateExperience(key);
        },
      }));
    }

    const recipeMenus = [
      'ingredient_library', 'nutrition_manager',
      'recipe_default', 'recipe_legacy', 'recipe_new',
    ];
    if (recipeMenus.includes(activeMenu)) {
      ariaLabel = '配方与营养';
      tabs = [
        {
          key: 'recipe',
          label: '商品配方',
          active: ['ingredient_library', 'recipe_default', 'recipe_legacy', 'recipe_new'].includes(activeMenu),
          onClick: () => {
            setLastRecipeMenu('recipe_new');
            setActiveMenu('recipe_new');
          },
        },
        { key: 'nutrition', label: '营养成分', active: activeMenu === 'nutrition_manager', onClick: () => setActiveMenu('nutrition_manager') },
      ];
    }

    if ([
      'sales_scope', 'price_systems', 'attribute_mutex_rules', 'required_product_policy',
    ].includes(activeMenu)) {
      ariaLabel = '销售规则';
      tabs = [
        {
          key: 'sales-scope',
          label: '门店售卖规则',
          active: activeMenu === 'sales_scope',
          onClick: () => setActiveMenu('sales_scope'),
        },
        { key: 'price', label: '价格策略', active: activeMenu === 'price_systems', onClick: () => setActiveMenu('price_systems') },
        {
          key: 'mutex',
          label: '属性互斥',
          active: activeMenu === 'attribute_mutex_rules',
          onClick: () => {
            setAttributeMutexEditorContext(null);
            setActiveMenu('attribute_mutex_rules');
          },
        },
        {
          key: 'required',
          label: '必选商品',
          active: activeMenu === 'required_product_policy',
          onClick: () => {
            setRequiredPolicyEditorContext(null);
            setActiveMenu('required_product_policy');
          },
        },
      ];
    }

    const storeProductMenus = ['store_product_list', 'store_product_coverage', 'store_region_list'];
    if (storeProductMenus.includes(activeMenu)) {
      ariaLabel = '门店商品';
      tabs = [
        {
          key: 'store-products',
          label: '门店渠道商品',
          active: ['store_product_list', 'store_product_coverage'].includes(activeMenu),
          onClick: () => {
            setStoreProductManagePreset(null);
            setActiveMenu('store_product_list');
          },
        },
        {
          key: 'store-region',
          label: '门店区域商品',
          active: activeMenu === 'store_region_list',
          onClick: () => {
            setStoreRegionEditorContext(null);
            setActiveMenu('store_region_list');
          },
        },
      ];
    }

    const storeCategoryAttributeMenus = [
      'store_category_list', 'store_attribute_list', 'store_addon_list', 'store_method_list',
    ];
    if (storeCategoryAttributeMenus.includes(activeMenu)) {
      ariaLabel = '门店分类与属性';
      tabs = [
        {
          key: 'store-addon',
          label: '门店加料',
          active: ['store_attribute_list', 'store_addon_list'].includes(activeMenu),
          onClick: () => setActiveMenu('store_addon_list'),
        },
        {
          key: 'store-method',
          label: '门店做法',
          active: activeMenu === 'store_method_list',
          onClick: () => setActiveMenu('store_method_list'),
        },
        {
          key: 'store-category',
          label: '门店前台分类',
          active: activeMenu === 'store_category_list',
          onClick: () => {
            setStoreCategoryReturnMenu('store_product_list');
            setActiveMenu('store_category_list');
          },
        },
      ];
    }

    if (tabs.length === 0) return null;

    return (
      <div className="console-view-tabs flex h-[48px] shrink-0 items-stretch border-b border-[#E5E7EB] bg-white px-6" role="tablist" aria-label={ariaLabel}>
        <div className="flex h-full min-w-0 items-stretch gap-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.active}
              onClick={tab.onClick}
              className={`relative flex h-full shrink-0 items-center px-0.5 text-[14px] transition-colors ${
                tab.active
                  ? 'font-semibold text-[#008F4C] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t after:bg-[#00B460]'
                  : 'font-medium text-[#667085] hover:text-[#1D2129]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const navigateExperience = (menu: string) => {
    const targetMenu = ['product_sync', 'product_publish', 'product_batch'].includes(menu) ? 'product_sync' : menu;
    setActiveMenu(targetMenu);
    setCreationContext(null);
    setDetailContext(null);
    setCategorySelectContext(null);
    setRequiredPolicyEditorContext(null);
    setAttributeMutexEditorContext(null);
    setStoreRegionEditorContext(null);
    setStoreProductManagePreset(null);
    if (['product_sync', 'product_publish', 'product_batch'].includes(menu)) setProductSyncInitialTab('publish');
    if (experience) {
      const url = new URL(window.location.href);
      url.searchParams.set('menu', targetMenu);
      if (targetMenu !== 'product_records') url.searchParams.delete('recordView');
      window.history.replaceState(null, '', url);
    }
  };

  return (
    <div className="console-shell console-figma flex h-full w-full flex-col overflow-hidden bg-[#F5F6FA] font-sans text-[14px] text-[#333]">
      
      {/* Header */}
      <header className="console-global-header z-40 flex h-[52px] shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-4">
        <div className="flex items-center space-x-4">
          <button type="button" className="flex items-center text-[#333] font-semibold text-[15px] hover:bg-gray-50 px-3 py-1.5 rounded-md transition-colors">
             槐店王婆 <ChevronDown size={14} className="ml-2 text-[#999]"/>
          </button>
          <div className="h-5 w-px bg-gray-200"></div>
          <nav className="flex space-x-2 text-[#666] font-medium text-[13px]">
            <button
              onClick={() => switchTopNav('brand')}
              className={`px-3 py-1.5 rounded-md flex items-center transition-all ${
                activeTopNav === 'brand'
                  ? 'bg-[#E6F8F0] text-[#00C06B] font-bold border border-[#00C06B]/20'
                  : 'hover:bg-gray-100'
              }`}
            >
               <LayoutGrid size={16} className="mr-2"/> 品牌管理
            </button>
            <button className="flex items-center hover:bg-gray-100 px-3 py-1.5 rounded-md transition-all">
               <Clock size={16} className="mr-2"/> 经营洞察
            </button>
            <button
              onClick={() => switchTopNav('store')}
              className={`px-3 py-1.5 rounded-md flex items-center transition-all ${
                activeTopNav === 'store'
                  ? 'bg-[#E6F8F0] text-[#00C06B] font-bold border border-[#00C06B]/20'
                  : 'hover:bg-gray-100'
              }`}
            >
               <Store size={16} className="mr-2"/> 门店业务 <ChevronDown size={14} className="ml-1"/>
            </button>
          </nav>
        </div>
        <div className={`flex items-center text-[13px] ${experience ? 'gap-3' : 'space-x-6'}`}>
           {experience?.header}
           <div className="relative">
              <Search size={14} className="absolute left-3 top-2 text-[#AAA]"/>
              <input className={`h-8 ${experience ? 'w-[180px]' : 'w-[280px]'} rounded-md border border-transparent bg-[#F2F3F5] pl-9 pr-12 text-[13px] transition-all focus:bg-white focus:outline-none`} placeholder="搜索功能导航、帮助文档"/>
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

      <div className="console-body flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        {experience && activeTopNav !== 'brand' ? experience.renderSidebar(activeMenu, navigateExperience) : activeTopNav === 'brand' ? (
        <aside
          className="pc-sidebar-scroll w-[200px] bg-[#F7F8FA] border-r border-[#E8E8E8] flex flex-col pt-2 overflow-y-auto no-scrollbar shrink-0 z-30"
          tabIndex={0}
          aria-label="品牌管理菜单"
        >
           <div className="px-3 py-2">
              <div className="flex items-center rounded-xl bg-white px-3 py-3 shadow-sm border border-[#EEF0F3]">
                 <Box size={18} className="mr-2 text-[#00C06B]"/>
                 <span className="font-bold text-[#333]">品牌管理</span>
              </div>
           </div>

           <div className="px-3 py-1 space-y-1 text-[13px] text-[#4B5563]">
              <div className="flex items-center rounded-lg px-3 py-2 hover:bg-white cursor-pointer">
                 <span className="mr-2 text-[#98A2B3]">▣</span>品牌概览
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white cursor-pointer">
                 <div><span className="mr-2 text-[#98A2B3]">▤</span>门店管理</div>
                 <ChevronDown size={14} className="text-[#98A2B3]" />
              </div>
              <div className="flex items-center rounded-lg px-3 py-2 hover:bg-white cursor-pointer">
                 <span className="mr-2 text-[#98A2B3]">◫</span>素材管理
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white cursor-pointer">
                 <div><span className="mr-2 text-[#98A2B3]">◌</span>费用中心</div>
                 <ChevronDown size={14} className="text-[#98A2B3]" />
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white cursor-pointer">
                 <div><span className="mr-2 text-[#98A2B3]">◌</span>支付管理</div>
                 <ChevronDown size={14} className="text-[#98A2B3]" />
              </div>

              <div className="rounded-xl bg-white border border-[#E8E8E8] overflow-hidden">
                 <div
                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer text-[#1F2937]"
                    onClick={() => toggleMenu('security_compliance')}
                 >
                    <div><span className="mr-2 text-[#00C06B]">▣</span><span className="font-semibold">安全合规</span></div>
                    {expandedMenus.includes('security_compliance') ? <ChevronUp size={14} className="text-[#98A2B3]" /> : <ChevronDown size={14} className="text-[#98A2B3]" />}
                 </div>

                 {expandedMenus.includes('security_compliance') && (
                   <div className="border-t border-[#F0F1F3] bg-white py-1">
                     <div
                       className="flex items-center justify-between px-3 py-2 cursor-pointer text-[#4B5563] hover:bg-[#F7F8FA]"
                       onClick={() => toggleMenu('log_audit')}
                     >
                       <span className="pl-5">审计日志</span>
                       {expandedMenus.includes('log_audit') ? <ChevronUp size={14} className="text-[#98A2B3]" /> : <ChevronDown size={14} className="text-[#98A2B3]" />}
                     </div>

                     {expandedMenus.includes('log_audit') && (
                       <div className="space-y-1 px-2 py-1">
                         <div className="rounded-lg px-3 py-2 text-[#4B5563] hover:bg-[#F7F8FA] cursor-pointer pl-9">
                           操作日志
                         </div>
                         <div
                           onClick={() => { setActiveMenu('product_logs'); setCreationContext(null); }}
                           className={`rounded-lg px-3 py-2 cursor-pointer pl-9 ${
                             activeMenu === 'product_logs' ? 'bg-[#00C06B] text-white font-semibold shadow-sm' : 'text-[#4B5563] hover:bg-[#F7F8FA]'
                           }`}
                         >
                           商品日志
                         </div>
                       </div>
                     )}

                     <div
                       className="flex items-center justify-between px-3 py-2 cursor-pointer text-[#4B5563] hover:bg-[#F7F8FA]"
                       onClick={() => toggleMenu('coupon_logs')}
                     >
                       <span className="pl-5">卡券日志</span>
                       {expandedMenus.includes('coupon_logs') ? <ChevronUp size={14} className="text-[#98A2B3]" /> : <ChevronDown size={14} className="text-[#98A2B3]" />}
                     </div>

                     <div className="rounded-lg px-3 py-2 text-[#4B5563] hover:bg-[#F7F8FA] cursor-pointer pl-8">门店日志</div>
                     <div className="rounded-lg px-3 py-2 text-[#4B5563] hover:bg-[#F7F8FA] cursor-pointer pl-8">系统日志</div>
                     <div className="rounded-lg px-3 py-2 text-[#4B5563] hover:bg-[#F7F8FA] cursor-pointer pl-8">用户权益日志</div>
                   </div>
                 )}
              </div>

              <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white cursor-pointer">
                 <div><span className="mr-2 text-[#98A2B3]">▣</span>品牌管理</div>
                 <ChevronDown size={14} className="text-[#98A2B3]" />
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white cursor-pointer">
                 <div><span className="mr-2 text-[#98A2B3]">▣</span>应用市场</div>
                 <ChevronDown size={14} className="text-[#98A2B3]" />
              </div>
           </div>

           <div className="mt-auto px-3 pb-4 pt-6">
             <div className="grid grid-cols-3 gap-2 text-center text-[12px] text-[#98A2B3]">
               <div className="rounded-lg bg-white px-2 py-2 border border-[#EEF0F3]">账户</div>
               <div className="rounded-lg bg-white px-2 py-2 border border-[#EEF0F3]">更新</div>
               <div className="rounded-lg bg-white px-2 py-2 border border-[#EEF0F3]">记录</div>
             </div>
           </div>
        </aside>
        ) : (
        <aside aria-label="商品中心导航" className="product-navigation z-30 flex w-[216px] shrink-0 flex-col overflow-y-auto border-r border-[#E8E8E8] bg-white pt-2 no-scrollbar">
           <div className="px-4 py-3 mb-2">
              <div className="flex items-center font-bold text-[#333] mb-1">
                 <Box size={18} className="mr-2 text-[#00C06B]"/> 商品中心
              </div>
           </div>

           <div className="product-navigation-group">商品资料</div>
           <SidebarItem
             label="商品主档"
             icon={<Package size={17} />}
             active={activeMenu === 'product_list' && !creationContext}
             onClick={() => { setActiveMenu('product_list'); setCreationContext(null); }}
           />
           <SidebarItem
             label="分类与属性"
             icon={<Tags size={17} />}
             active={['product_attributes', 'categories', 'category_management'].includes(activeMenu)}
             onClick={() => { setActiveMenu('product_attributes'); setCreationContext(null); }}
           />
           <SidebarItem
             label="配方与营养"
             icon={<FlaskConical size={17} />}
             active={['ingredient_library', 'nutrition_manager', 'recipe_default', 'recipe_legacy', 'recipe_new', 'addon_group'].includes(activeMenu)}
             onClick={() => { setLastRecipeMenu('recipe_new'); setActiveMenu('recipe_new'); setCreationContext(null); }}
           />

           <div className="product-navigation-group">渠道经营</div>
           {channelCatalogMenuVisible && (
             <>
               <SidebarItem
                 label="渠道商品"
                 icon={<Store size={17} />}
                 active={activeMenu === 'channel_product_library'}
                 onClick={() => { setActiveMenu('channel_product_library'); setCreationContext(null); }}
               />
               <SidebarItem
                 label="渠道属性"
                 icon={<Tags size={17} />}
                 active={['channel_attributes', 'channel_categories', 'channel_custom_attributes'].includes(activeMenu)}
                 onClick={() => { setActiveMenu('channel_attributes'); setCreationContext(null); }}
               />
             </>
           )}
           <SidebarItem
             label="销售规则"
             icon={<SlidersHorizontal size={17} />}
             active={['sales_scope', 'price_systems', 'attribute_mutex_rules', 'required_product_policy'].includes(activeMenu)}
             onClick={() => { setActiveMenu('sales_scope'); setCreationContext(null); }}
           />
           <SidebarItem
             label="自助餐菜单"
             icon={<UtensilsCrossed size={17} />}
             active={activeMenu === 'buffet_menu'}
             onClick={() => { setActiveMenu('buffet_menu'); setCreationContext(null); }}
           />
           <SidebarItem
             label="商品推荐"
             icon={<Sparkles size={17} />}
             active={activeMenu === 'product_recommendation'}
             onClick={() => { setActiveMenu('product_recommendation'); setCreationContext(null); }}
           />

           <div className="product-navigation-group">发布与治理</div>
           <SidebarItem
             label="发布中心"
             icon={<Rocket size={17} />}
             active={['product_sync', 'product_publish', 'product_batch', 'product_records', 'product_template'].includes(activeMenu)}
             onClick={() => { setProductSyncInitialTab('publish'); setActiveMenu('product_sync'); setCreationContext(null); }}
           />
           {productMappingVisible && (
             <SidebarItem
               label="外卖商品映射"
               icon={<Link2 size={17} />}
               active={activeMenu === 'product_mapping'}
               onClick={() => { setActiveMenu('product_mapping'); setCreationContext(null); }}
             />
           )}
           <div className="product-navigation-group">门店经营</div>
           <SidebarItem
             label="门店商品"
             icon={<ShoppingBag size={17} />}
             active={['store_product_list', 'store_product_coverage', 'store_region_list'].includes(activeMenu)}
             onClick={() => {
               setActiveMenu('store_product_list');
               setStoreProductManagePreset(null);
               setCreationContext(null);
             }}
           />
           <SidebarItem
             label="门店分类与属性"
             icon={<Tags size={17} />}
             active={['store_category_list', 'store_attribute_list', 'store_addon_list', 'store_method_list'].includes(activeMenu)}
             onClick={() => {
               setStoreCategoryReturnMenu('store_product_list');
               setActiveMenu('store_addon_list');
               setCreationContext(null);
             }}
           />

           <div className="product-navigation-group">商品设置</div>
           <SidebarItem
             label="商品设置"
             icon={<Settings size={17} />}
             active={['general_settings', 'channel_override_settings', 'omnichannel_settings'].includes(activeMenu)}
             onClick={() => {
               setActiveMenu('general_settings');
               setCreationContext(null);
             }}
           />

           <div className="mt-auto h-4"></div>
        </aside>
        )}

        {/* Main Content */}
         <div className="console-workspace flex min-w-0 flex-1 flex-col overflow-hidden">
           {renderContextTabs()}
           <div className="console-page flex min-h-0 min-w-0 flex-1 overflow-hidden">
             {renderContent()}
           </div>
        </div>
      </div>

      {/* Global Modals */}
      {isImportModalOpen && <WebImportModal onClose={() => setIsImportModalOpen(false)} />}
      {isThirdPartyImportRecordsOpen && (
        <WebThirdPartyImportRecordsModal
          onClose={() => setIsThirdPartyImportRecordsOpen(false)}
          onStartImport={() => setIsImportModalOpen(true)}
        />
      )}
      {categorySelectContext && (
        <WebCategorySelectModal
          type={categorySelectContext.type}
          categories={webCategories}
          onClose={() => categorySelectContext.storeAddition ? resumeStoreAddition(categorySelectContext.storeAddition) : setCategorySelectContext(null)}
          onSelect={(selectedCategory) => {
            setCreationContext({
              type: categorySelectContext.type,
              category: selectedCategory,
              scope: categorySelectContext.scope,
              formScope: categorySelectContext.formScope || (categorySelectContext.scope === 'store' ? 'store' : 'master'),
              channelContext: categorySelectContext.channelContext,
              channelAttributeIds: categorySelectContext.channelAttributeIds,
              groupMeal: categorySelectContext.groupMeal,
              storeAddition: categorySelectContext.storeAddition,
              storeReturn: categorySelectContext.storeReturn,
              ...(categorySelectContext.groupMeal ? { product: { name: '', formData: { p_display_type: ['group_meal'] } } } : {}),
            });
            setCategorySelectContext(null);
          }}
        />
      )}
      {masterChannelSyncDialogContext && (
        <WebMasterChannelSyncDialog
          context={masterChannelSyncDialogContext}
          onClose={() => setMasterChannelSyncDialogContext(null)}
          onSubmit={handleMasterChannelSyncSubmit}
          onOpenRecords={openMasterChannelSyncRecords}
        />
      )}
      {showProductMenuGuide && (
        <div className="absolute inset-0 z-[80] bg-black/35">
          <div className={`pointer-events-none absolute rounded-lg border-2 border-[#17C964] bg-white/10 shadow-[0_0_0_9999px_rgba(17,24,39,0.20),0_0_0_6px_rgba(23,201,100,0.12)] ${currentGuideStep.highlightPosition}`}></div>
          <div className={`absolute w-[360px] rounded-lg bg-[#17C964] p-5 text-white shadow-[0_18px_48px_rgba(6,78,59,0.28)] ${currentGuideStep.cardPosition}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-full bg-white/16 px-3 py-1 text-[12px] font-black">
                {currentGuideStep.step}
              </div>
            </div>
            <div className="mt-2 rounded-lg bg-white/12 p-4">
              <div className="text-[16px] font-black">{currentGuideStep.title}</div>
              <div className="mt-1 text-[13px] leading-6 text-white/90">
                {currentGuideStep.desc}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handlePrevProductMenuGuide}
                disabled={currentProductMenuGuideStep === 0}
                className="rounded-lg border border-white/22 px-4 py-2 text-[13px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
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
                className="rounded-lg bg-white px-4 py-2 text-[13px] font-black text-[#12A150] shadow-sm transition-colors hover:bg-[#F3FFF8]"
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
