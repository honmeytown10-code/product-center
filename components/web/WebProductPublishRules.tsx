import React, { useCallback, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { WebPublishDialog } from './WebPublishDialog';
import { isBlindBagProduct } from '../../blindBag';

// One field contract for save-and-publish and the existing manual publishing tool.
// Production maps this controlled field group to the existing sync-rule form.
export const PUBLISH_OVERWRITE_FIELDS = [
  '商品名称', '售价', '库存', '计划库存', '起购限购', '商品排序', '分类排序',
  '售卖时间', '售卖方式', '加料', '做法', '前台分类', '商品主图', '商品封面图',
  '商品详情图', '商品档口', '渠道专属属性',
];
export const DEFAULT_PUBLISH_OVERWRITE_FIELDS = PUBLISH_OVERWRITE_FIELDS.filter(field => !['库存', '计划库存'].includes(field));
export const publishDefaultsKey = (brandId: string) => `product-center:publish-overwrite-defaults:${brandId}`;
export const getPublishOverwriteDefaults = (brandId: string): string[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(publishDefaultsKey(brandId)) || 'null');
    if (Array.isArray(saved?.fields) && saved.fields.every((field: unknown) => typeof field === 'string' && PUBLISH_OVERWRITE_FIELDS.includes(field))) return [...new Set<string>(saved.fields)];
  } catch { /* Unavailable or obsolete local demo storage: use the existing defaults. */ }
  return [...DEFAULT_PUBLISH_OVERWRITE_FIELDS];
};

export const WebProductPublishRules: React.FC<{
  value: string[];
  onChange: (fields: string[]) => void;
  disabled?: boolean;
  defaultsBrandId?: string;
  allowedFields?: string[];
  compact?: boolean;
}> = ({ value, onChange, disabled = false, defaultsBrandId, allowedFields = PUBLISH_OVERWRITE_FIELDS, compact = false }) => {
  const [draftDefaults, setDraftDefaults] = useState<string[] | null>(null);
  const [saveError, setSaveError] = useState('');
  const close = useCallback(() => { setDraftDefaults(null); setSaveError(''); }, []);
  const saveDefaults = () => {
    if (!draftDefaults || !defaultsBrandId) return;
    try { localStorage.setItem(publishDefaultsKey(defaultsBrandId), JSON.stringify({ version: 1, fields: draftDefaults })); }
    catch { setSaveError('默认参数未保存，请检查浏览器存储权限后重试。本次设置未改变。'); return; }
    onChange(draftDefaults.filter(field => allowedFields.includes(field))); close();
  };
  return <><fieldset disabled={disabled} className="min-w-0 space-y-3">
  <legend className="mb-3 text-sm font-semibold text-[#1D2129]">相同商品</legend>
  <label className="flex items-center gap-2 text-sm text-[#4E5969]"><input type="radio" checked readOnly aria-label="相同商品合并到门店商品" className="h-4 w-4 accent-[#00B460]" />合并到门店商品</label>
  <div className="text-xs leading-5 text-[#667085]">新增商品使用完整资料；相同商品仅覆盖勾选属性，其余资料及上下架状态保留。</div>
  <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-[#4E5969]">覆盖属性</span>{defaultsBrandId && <button type="button" onClick={() => { setDraftDefaults(getPublishOverwriteDefaults(defaultsBrandId)); setSaveError(''); }} className="flex items-center gap-1 text-xs text-[#008647] hover:underline"><Settings2 size={14} />默认参数配置</button>}</div>
  <div className={compact ? 'grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4' : 'grid grid-cols-3 gap-x-4 gap-y-3'}>{allowedFields.map(field => <label key={field} className="flex items-center gap-2 text-sm text-[#4E5969]"><input type="checkbox" checked={value.includes(field)} onChange={() => onChange(value.includes(field) ? value.filter(item => item !== field) : [...value, field])} className="h-4 w-4 shrink-0 accent-[#00B460]" />{field}</label>)}</div>
</fieldset>
{draftDefaults && <WebPublishDialog title="默认参数配置" onClose={close} footer={<><button type="button" onClick={close} className="rounded-md border border-[#E5E6EB] px-5 py-2 text-sm text-[#4E5969]">取消</button><button type="button" onClick={saveDefaults} className="rounded-md bg-[#008647] px-5 py-2 text-sm font-medium text-white">保存并应用</button></>}>
  <p className="mb-4 text-sm leading-6 text-[#4E5969]">设置当前品牌下发相同商品时的默认覆盖属性。保存后应用于本次任务，后续任务默认使用；单次调整不会改变默认值。</p>
  <div className="grid grid-cols-3 gap-x-4 gap-y-4">{allowedFields.map(field => <label key={field} className="flex items-center gap-2 text-sm text-[#4E5969]"><input type="checkbox" checked={draftDefaults.includes(field)} onChange={() => setDraftDefaults(previous => previous!.includes(field) ? previous!.filter(item => item !== field) : [...previous!, field])} className="h-4 w-4 shrink-0 accent-[#008647]" />{field}</label>)}</div>
  <p className="mt-5 text-xs leading-5 text-[#86909C]">原型按品牌保存在当前浏览器。正式环境需接入品牌配置接口，供品牌内有权限的用户共用。</p>
  {saveError && <p role="alert" className="mt-3 text-sm text-[#B42318]">{saveError}</p>}
</WebPublishDialog>}
</>;
};

export const mergePublishedFormData = (previous: Record<string, any>, source: Record<string, any>, fields: string[]) => {
  // Older task snapshots retain their original labels; field IDs are unchanged.
  fields = fields.map(field => ({ '基础价格': '售价', '基础售价': '售价', '展示分类': '前台分类' } as Record<string, string>)[field] || field);
  const data = { ...previous };
  const keys: Record<string, string[]> = {
    '商品名称': ['p_name'], '售价': ['s_price'],
    '库存': ['s_stock'], '计划库存': ['s_plan_stock'],
    '起购限购': ['s_limit', 's_min_purchase_toggle', 's_min_purchase_value', 's_max_purchase_toggle', 's_max_purchase_value'],
    '商品排序': ['p_sort'], '分类排序': ['categorySort'],
    '售卖时间': ['s_time_sale_toggle', 's_time_sale_rule'], '售卖方式': ['s_sale_mode'],
    '前台分类': ['p_front_cat'], '商品主图': ['p_img', 'p_img_gallery'],
    '商品封面图': ['p_cover_img'], '商品详情图': ['p_detail_images', 'p_detail_bottom_img'],
    '渠道专属属性': ['channelSpecificValues'],
  };
  if (isBlindBagProduct({ formData: source })) Object.assign(keys, {
    '列表页简述': ['p_list_desc'], '描述标签': ['p_desc_tags'], '点单标签': ['p_order_tags'],
    '商品角标': ['p_badge'], '角标展示日期': ['p_badge_date', 'p_badge_start_date', 'p_badge_end_date'],
    '商品视频': ['p_video'], '详情页描述': ['p_rich_desc'], '包装费': ['s_pack_fee'],
    '会员折扣/积分': ['st_member', 's_sale_settings'], '基础销量': ['o_base_sales'],
    '商品分享': ['o_product_share', 'o_share_title', 'o_share_image'], '自定义属性': ['customAttributes'],
  });
  for (const field of fields) for (const key of keys[field] || []) {
    if (Object.prototype.hasOwnProperty.call(source, key)) data[key] = source[key];
  }
  if (fields.includes('商品档口') && source.s_sale_settings && '关联档口' in source.s_sale_settings) {
    data.s_sale_settings = { ...previous.s_sale_settings, '关联档口': source.s_sale_settings['关联档口'] };
  }
  const incoming = source.takeoutFormState;
  if (incoming) {
    const state = { ...(previous.takeoutFormState || {}) };
    if (fields.includes('做法') && 'methodConfigRows' in incoming) state.methodConfigRows = incoming.methodConfigRows;
    if (fields.includes('加料') && 'addonConfigRows' in incoming) state.addonConfigRows = incoming.addonConfigRows;
    const specKeys = [
      ...(fields.includes('售价') ? ['s_spec_price', 's_spec_channel_price'] : []),
      ...(fields.includes('库存') ? ['s_spec_inventory_mode', 's_spec_initial_stock', 's_spec_max_stock', 's_spec_auto_restock'] : []),
      ...(fields.includes('计划库存') ? ['s_spec_manage_plan_stock', 's_spec_daily_plan_stock'] : []),
      ...(isBlindBagProduct({ formData: source }) && fields.includes('包装费') ? ['s_spec_store_pack_fee', 's_spec_store_pack_mark', 's_spec_take_pack_fee', 's_spec_take_pack_mark'] : []),
    ];
    if (specKeys.length && incoming.specConfigRows) {
      state.specConfigRows = (previous.takeoutFormState?.specConfigRows || incoming.specConfigRows).map((old: Record<string, any>) => {
        const row = incoming.specConfigRows.find((item: Record<string, any>) => item.id === old.id);
        return row ? { ...old, ...Object.fromEntries(specKeys.filter(key => key in row).map(key => [key, row[key]])) } : old;
      });
    }
    data.takeoutFormState = state;
  }
  if (isBlindBagProduct({ formData: source })) {
    data.p_business_type = 'blind_bag';
    data.p_weight_flag = false;
    data.m_methods = []; data.a_addons = []; data.p_display_type = [];
    data.takeoutFormState = { ...source.takeoutFormState, ...data.takeoutFormState,
      specDisplayMode: 'single', selectedSpecValuesByGroup: {}, methodConfigRows: [], addonConfigRows: [], comboGroupCards: [],
    };
    data.takeoutSnapshot = { ...source.takeoutSnapshot, ...previous.takeoutSnapshot,
      specGroupCount: 0, methods: [], addonCount: 0, addonItems: [], comboGroupCount: 0, comboGroups: [],
    };
    data.takeoutSnapshot.skus = (data.takeoutSnapshot.skus || source.takeoutSnapshot?.skus || []).map((sku: any, index: number) => {
      const row = data.takeoutFormState.specConfigRows?.[index];
      return { ...sku, ...(fields.includes('售价') && row ? { price: row.s_spec_price } : {}),
        ...(fields.includes('库存') && row ? { stock: row.s_spec_initial_stock, inventoryMode: row.s_spec_inventory_mode } : {}),
        ...(fields.includes('包装费') && row ? { packagingFee: String(row.s_spec_take_pack_fee || row.s_spec_store_pack_fee || '0') } : {}),
      };
    });
  }
  return data;
};

// Update the list's inventory projection only when inventory was explicitly selected.
export const publishedStockCount = (source: Record<string, any>, fallback: number) => {
  const rows = source.takeoutFormState?.specConfigRows;
  if (rows?.length && rows.every((row: any) => row.s_spec_inventory_mode === 'custom' && String(row.s_spec_initial_stock ?? '').trim() !== '' && Number.isFinite(Number(row.s_spec_initial_stock)))) {
    return rows.reduce((total: number, row: any) => total + Number(row.s_spec_initial_stock), 0);
  }
  if (rows?.length && rows.every((row: any) => row.s_spec_inventory_mode === 'unlimited')) return 9999;
  return String(source.s_stock ?? '').trim() !== '' && Number.isFinite(Number(source.s_stock)) ? Number(source.s_stock) : fallback;
};
