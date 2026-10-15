import type { CategoryFieldConfig, OmnichannelChannelId, Product } from './types';
import { BLIND_BAG_CATEGORY_ID, DEFAULT_BLIND_BAG_CATEGORY_FIELDS, projectConfiguredFormData, configuredSpecValueKeys } from './categoryConfiguration';

export const BLIND_BAG_CHANNEL_IDS: OmnichannelChannelId[] = ['mini_program_dine_in', 'mini_program_delivery'];
export const BLIND_BAG_PUBLISH_CHANNEL_IDS: OmnichannelChannelId[] = ['mini_program_dine_in'];
export const blindBagPublishError = (products: any[], channelIds: string[], blindBagOnly = false): string | undefined => {
  if (blindBagOnly && products.some(product => !isBlindBagProduct(product))) return '盲袋下发仅支持选择盲袋商品。';
  if (products.some(isBlindBagProduct) && channelIds.some(id => !BLIND_BAG_PUBLISH_CHANNEL_IDS.includes(id as OmnichannelChannelId))) return '盲袋商品暂仅支持下发小程序堂食渠道。';
};
export const BLIND_BAG_PUBLISH_FIELDS = ['商品名称', '售价', '库存', '起购限购', '售卖时间', '前台分类', '商品主图', '商品封面图', '商品详情图',
  '列表页简述', '描述标签', '点单标签', '商品角标', '角标展示日期', '商品视频', '详情页描述',
  '包装费', '会员折扣/积分', '基础销量', '商品分享', '自定义属性'];
export type BlindBagProduct = Product & { type: 'standard'; businessType: 'blind_bag'; formData: Record<string, any> };
export const isBlindBagProduct = (product: any): boolean => product?.businessType === 'blind_bag' || product?.formData?.p_business_type === 'blind_bag';

// A business identity, not a category or a user-editable display tag. Production
// must apply these same checks at the save/import/publish API boundary.
export function blindBagStructureError(product: any): string | undefined {
  if (!isBlindBagProduct(product)) return;
  const data = product.formData || {};
  const state = data.takeoutFormState || {};
  const snapshot = data.takeoutSnapshot || {};
  if (product.type !== 'standard' || product.isCombo || product.comboItemIds?.length || snapshot.comboGroupCount || snapshot.comboGroups?.length || state.comboGroupCards?.length) return '盲袋仅支持标准商品，不支持套餐搭配。';
  if (product.isMultiSpec || product.specs?.length > 1 || state.specDisplayMode === 'multi' || (state.specConfigRows || state.specRows)?.length > 1 || snapshot.skus?.length > 1 || snapshot.specGroupCount || Object.keys(state.selectedSpecValuesByGroup || {}).length) return '盲袋仅支持单规格，请移除多规格配置。';
  if (data.m_methods?.length || data.a_addons?.length || state.methodConfigRows?.length || state.methodRows?.length || state.addonConfigRows?.length || state.addonRows?.length || snapshot.methods?.length || snapshot.addonCount || snapshot.addonItems?.length) return '盲袋不支持做法和加料。';
  if (data.p_weight_flag) return '盲袋不支持称重。';
  if (data.p_display_type?.length || Object.keys(data.channelSpecificValues || {}).length) return '盲袋不支持普通商品特殊标识或三方平台属性。';
  const channelGroups = [data.salesScope?.channelIds, data.applicableChannelIds, data.salesChannelIds].filter(Array.isArray) as string[][];
  if (channelGroups.some(ids => ids.some(id => !BLIND_BAG_CHANNEL_IDS.includes(id as OmnichannelChannelId)))) return '盲袋销售渠道仅支持小程序堂食、小程序外卖。';
  if (!channelGroups.length || channelGroups.some(ids => !ids.length)) return '请选择至少一个盲袋销售渠道。';
  if (channelGroups.some(ids => ids.length !== channelGroups[0].length || ids.some(id => !channelGroups[0].includes(id)))) return '盲袋销售渠道配置不一致，请重新保存。';
}

export const blindBagChannels = (product: any): OmnichannelChannelId[] => {
  const ids: string[] = product?.formData?.salesScope?.channelIds || product?.formData?.applicableChannelIds || [];
  return BLIND_BAG_CHANNEL_IDS.filter(id => ids.includes(id));
};

// Fields and child values follow the category data saved in Ops.

export function buildBlindBagProduct(input: {
  id: string; skuCode: string; createdTime: string; status: Product['status'];
  formData: Record<string, any>; channelIds: OmnichannelChannelId[]; unlimited: boolean; fieldConfigs?: CategoryFieldConfig[];
}): BlindBagProduct {
  const fields = input.fieldConfigs || DEFAULT_BLIND_BAG_CATEGORY_FIELDS;
  const data = projectConfiguredFormData(input.formData, fields);
  const price = Number(data.s_price || 0);
  const stock = input.unlimited ? -1 : Number(data.s_stock || 0);
  const skuId = input.skuCode;
  const incomingSpec = input.formData.takeoutFormState?.specConfigRows?.[0] || {};
  const specKeys = configuredSpecValueKeys(fields);
  const spec: Record<string, any> = {
    ...Object.fromEntries(Object.entries(incomingSpec).filter(([key]) => specKeys.has(key))),
    id: skuId, s_spec_name: '默认', s_spec_price: String(data.s_price || ''),
    s_spec_cost: String(data.s_cost || ''), s_spec_market: String(data.s_market_price || ''),
    s_spec_inventory_mode: input.unlimited ? 'unlimited' : 'custom',
    s_spec_initial_stock: input.unlimited ? '' : String(data.s_stock ?? ''),
    s_spec_auto_restock: false, s_spec_manage_plan_stock: false,
  };
  const formData = {
    ...data, p_business_type: 'blind_bag', p_unit: data.p_unit || '袋',
    p_weight_flag: false, p_display_type: [], s_sale_mode: '正常售卖',
    salesScope: { channelIds: [...input.channelIds], storeIds: [] },
    applicableChannelIds: [...input.channelIds], salesChannelIds: [...input.channelIds],
    s_stock: input.unlimited ? '' : String(data.s_stock ?? ''),
    m_methods: [], a_addons: [],
    takeoutFormState: {
      specDisplayMode: 'single', selectedSpecValuesByGroup: {}, specConfigRows: [spec],
      methodConfigRows: [], addonConfigRows: [], comboGroupCards: [],
    },
    takeoutSnapshot: {
      specGroupCount: 0, skus: [{ id: skuId, name: '默认', price: String(price), stock: input.unlimited ? '' : String(stock), maxStock: '', autoRestock: false, packagingFee: String(spec.s_spec_take_pack_fee || spec.s_spec_store_pack_fee || '0'), inventoryMode: input.unlimited ? 'unlimited' : 'custom' }],
      methods: [], addonCount: 0, addonItems: [], comboGroupCount: 0, comboGroups: [],
    },
  };
  const result: BlindBagProduct = {
    id: input.id, skuCode: input.skuCode, createdTime: input.createdTime,
    name: String(data.p_name || '').trim(), price,
    category: data.p_front_cat?.[0] || '未分类', image: String(data.p_img || ''),
    type: 'standard', businessType: 'blind_bag', isCombo: false, isMultiSpec: false,
    stock, stockStatus: stock === 0 ? 'sold_out' : 'available', status: input.status,
    specs: [{ name: '默认', price, stock, unlimited: input.unlimited }], formData,
  };
  const error = blindBagStructureError(result);
  if (error) throw new Error(error);
  return result;
}

/** Normalize the library form's single-SKU draft without dropping compatible
 * display, sales or other settings. Ordinary products retain their own path. */
export function normalizeBlindBagDraft(draft: any, intent: 'draft' | 'save' | 'publish', previous?: any, fieldConfigs?: CategoryFieldConfig[]): BlindBagProduct {
  const data = draft.formData || {};
  const row = data.takeoutFormState?.specConfigRows?.[0] || {};
  const channels = BLIND_BAG_CHANNEL_IDS.filter(id => (data.salesScope?.channelIds || data.applicableChannelIds || []).includes(id));
  const result = buildBlindBagProduct({
    id: draft.id, skuCode: draft.skuCode || previous?.skuCode, createdTime: draft.createdTime,
    status: intent === 'draft' ? 'draft' : previous?.status === 'off_shelf' ? 'off_shelf' : 'on_shelf',
    channelIds: channels, unlimited: row.s_spec_inventory_mode === 'unlimited', fieldConfigs,
    formData: { ...data, p_name: draft.name, p_cat: data.p_cat || previous?.formData?.p_cat,
      s_price: row.s_spec_price ?? data.s_price ?? '', s_cost: row.s_spec_cost ?? data.s_cost ?? '',
      s_market_price: row.s_spec_market ?? data.s_market_price ?? '', s_stock: row.s_spec_initial_stock ?? data.s_stock ?? '',
      s_sale_settings: { ...(data.s_sale_settings && '参与会员折扣' in data.s_sale_settings ? { '参与会员折扣': data.s_sale_settings['参与会员折扣'] } : {}) },
    },
  });
  if (data.storeTargetChannelIds) result.formData.storeTargetChannelIds = [...data.storeTargetChannelIds];
  return result;
}

export function createBlindBagDemoProducts(image: string): BlindBagProduct[] {
  return [
    { id: 'demo-blind-bag-bakery', name: '烘焙惊喜盲袋', price: '12.90', stock: '8', status: 'on_shelf' as const, channels: [...BLIND_BAG_CHANNEL_IDS] },
    { id: 'demo-blind-bag-snack', name: '小食惊喜盲袋', price: '9.90', stock: '0', status: 'off_shelf' as const, channels: ['mini_program_delivery'] as OmnichannelChannelId[] },
    { id: 'demo-blind-bag-draft', name: '甜品盲袋（待完善）', price: '', stock: '', status: 'draft' as const, channels: [...BLIND_BAG_CHANNEL_IDS] },
  ].map((item, index) => buildBlindBagProduct({
    id: item.id, skuCode: `DEMO-BB-${index + 1}`, createdTime: '2026-10-13 09:00:00', status: item.status,
    channelIds: item.channels, unlimited: false,
    formData: { p_name: item.name, p_cat: '盲袋商品', prototypeCategoryId: BLIND_BAG_CATEGORY_ID,
      p_front_cat: ['热销推荐'], p_back_cat: [], p_unit: '袋', p_img: item.status === 'draft' ? '' : image,
      p_list_desc: '本商品为鲜食盲袋，实际食品内容以门店装袋为准。', s_price: item.price, s_stock: item.stock,
    },
  }));
}
