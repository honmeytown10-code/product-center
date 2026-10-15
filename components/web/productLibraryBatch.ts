import { AVAILABLE_DYNAMIC_FIELDS, type CategoryFieldConfig, type Product } from '../../types';
import { applyLibraryPrice } from './WebProductLibraryBatchDialog';
import { isBlindBagProduct } from '../../blindBag';
import { DEFAULT_BLIND_BAG_CATEGORY_FIELDS } from '../../categoryConfiguration';

// Use the existing form field dictionary; this adapter does not introduce business fields.
const LABEL_ALIASES: Record<string, string> = {
  '列表页简述': 'p_list_desc', '前台分类': 'p_front_cat', '商品主图': 'p_img',
  '商品名称': 'p_name', '包装费': 's_pack_fee', '描述标签': 'p_desc_tags',
};
const SPEC_FIELDS: Record<string, string> = { '商品标识': 's_spec_mark', '商品条码': 's_spec_barcode', '商品规格码': 's_spec_sku_code', '预计成本': 's_spec_cost' };
export function libraryBatchPatch(product: Product, values: Record<string, string | number | boolean>, categoryFields: CategoryFieldConfig[] = DEFAULT_BLIND_BAG_CATEGORY_FIELDS): Partial<Product> {
  const data = (product as Product & { formData?: Record<string, any> }).formData || {};
  const patch: Record<string, any> = {};
  let formData = { ...data };
  for (const [field, value] of Object.entries(values)) {
    if (field === '售价') {
      const price = Number(value);
      if (!Number.isFinite(price) || price < 0) throw new Error('销售价不能为负数或为空。');
      const result = applyLibraryPrice({ ...product, formData } as Product, () => price);
      Object.assign(patch, result.patch); formData = (result.patch as any).formData || formData;
      continue;
    }
    if (SPEC_FIELDS[field]) {
      if (isBlindBagProduct(product)) throw new Error(`“${product.name}”为盲袋商品，请从专属表单维护${field}。`);
      const rows = formData.takeoutFormState?.specConfigRows;
      if (!rows?.length) throw new Error(`“${product.name}”尚无可编辑的规格资料，请进入商品表单维护${field}。`);
      formData.takeoutFormState = { ...formData.takeoutFormState, specConfigRows: rows.map((row: any) => ({ ...row, [SPEC_FIELDS[field]]: value })) };
      continue;
    }
    const definition = AVAILABLE_DYNAMIC_FIELDS.find(item => item.id === LABEL_ALIASES[field] || item.label === field);
    if (isBlindBagProduct(product) && (!definition || !categoryFields.some(config => config.id === definition.id && config.displayMode !== 'hidden'))) throw new Error(`盲袋商品不支持批量修改“${field}”，请从盲袋商品入口维护。`);
    if (!definition || ['tag_group', 'checkbox_group', 'custom'].includes(definition.type)) throw new Error(`“${field}”请通过商品表单或对应专用工具维护；本次修改尚未执行。`);
    formData[definition.id] = definition.id === 'p_front_cat' ? String(value).split('、').filter(Boolean) : value;
    if (definition.id === 'p_name') patch.name = String(value);
    if (definition.id === 'p_img') patch.image = String(value);
    if (definition.id === 'p_front_cat') patch.category = String(value);
  }
  return { ...patch, formData } as Partial<Product>;
}
