import type { DynamicFieldConfig } from '../../types';

// Supplement only the fields verified in the production category audit.
// These remain formData fields; product types, SKU structure and save semantics are unchanged.
export type CategorySupplementField = DynamicFieldConfig & {
    categories: string[];
    unit?: string;
    maxLength?: number;
    inputType?: 'date';
    dependsOn?: string;
    integer?: boolean;
    maxNumber?: number;
    unitOptions?: string[];
    unitField?: string;
};
const singles = ['w_cat_s1', 'w_cat_s2', 'w_cat_s3', 'w_cat_s4', 'w_cat_s5', 'w_cat_s6'];
const bakery = ['w_cat_s4', 'w_cat_c3'];
const blindBoxes = ['w_cat_c1', 'w_cat_c2', 'w_cat_c4'];
export const CATEGORY_SUPPLEMENT_FIELDS: CategorySupplementField[] = [
    { id: 's_reservation', label: '预约下单', module: 'sales', type: 'switch', categories: singles, description: '开启后，可设置此商品需要提前预约的时间。' },
    { id: 's_reservation_lead_time', label: '提前预约时间', module: 'sales', type: 'number', categories: singles, dependsOn: 's_reservation', unitOptions: ['天', '时', '分'], unitField: 's_reservation_unit', integer: true, maxNumber: 999999999, description: '不填写或填 0 时，使用门店的预约下单时间。' },
    { id: 's_require_message', label: '要求留言', module: 'sales', type: 'switch', categories: ['w_cat_s1', 'w_cat_s2', 'w_cat_s4'] },
    { id: 's_selling_point', label: '商品卖点', module: 'sales', type: 'input', categories: bakery, description: '在商品详情页标题下展示。' },
    { id: 's_max_reservation_days', label: '最长预约', module: 'sales', type: 'number', categories: bakery, unit: '天', integer: true, description: '含下单当日；不填写或填 0 时使用门店设置。订单取各商品预约天数的最小值。' },
    { id: 's_auto_cart', label: '默认加入购物车', module: 'sales', type: 'switch', categories: ['w_cat_s4'], description: '仅对普通商品生效；多规格、多做法或配置加料时不生效。' },
    { id: 's_exclude_cup_count', label: '不参与出杯数统计', module: 'sales', type: 'switch', categories: ['w_cat_s2'] },
    { id: 'p_nutrition_public', label: '营养成分公开', module: 'display', type: 'switch', categories: ['w_cat_s2'], description: '需先完成小程序营养公开页面装修。' },
    { id: 'o_main_ingredients', label: '主要成分', module: 'others', type: 'input', categories: ['w_cat_s2'], maxLength: 80 },
    { id: 'o_ingredient_description', label: '成分描述', module: 'others', type: 'textarea', categories: ['w_cat_s2'], maxLength: 80 },
    { id: 'o_flavor', label: '产品风味', module: 'others', type: 'input', categories: ['w_cat_s2'], maxLength: 80 },
    { id: 'o_flavor_description', label: '风味描述', module: 'others', type: 'textarea', categories: ['w_cat_s2'], maxLength: 80 },
    { id: 'o_nutrition_image', label: '营养成分图片', module: 'others', type: 'image', categories: ['w_cat_s2'], description: '用于杯贴打印，JPG 格式，大小不超过 20KB。' },
    { id: 'o_creation_date', label: '创作时间', module: 'others', type: 'input', inputType: 'date', categories: ['w_cat_s2'], description: '用于 POS 杯贴打印。' },
    { id: 'o_storage_temperature', label: '储存温度', module: 'others', type: 'number', categories: ['w_cat_s2', 'w_cat_s4'], unit: '℃' },
    { id: 'o_shelf_life_days', label: '保质期', module: 'others', type: 'number', categories: ['w_cat_s2', 'w_cat_s4'], unit: '天' },
    { id: 'o_small_ingredient', label: '小料商品', module: 'others', type: 'switch', categories: ['w_cat_s2'], description: '开启后，点餐时自动加入购物车，适用于火锅等场景。' },
    { id: 'o_combo_addon_restrict', label: '加料购买限制', module: 'others', type: 'switch', categories: ['w_cat_c1', 'w_cat_c2', 'w_cat_c3'], description: '开启后，小程序套餐不展示子商品的加料，仅支持选择子商品做法。' },
    { id: 'c_blind_draw_count', label: '盲盒抽取数量限制', module: 'sales', type: 'number', categories: blindBoxes, dependsOn: 'blind_box', unit: '件', integer: true, description: '从盲盒套餐商品中随机抽取；抽取数量须少于配置的标准商品总数量。' },
    { id: 'c_hotpot_type', label: '锅底类型', module: 'base', type: 'radio_group', categories: ['w_cat_c5'], presetValues: ['固定锅底', '自选锅底'], description: '用于控制小程序锅底展示样式。' },
    { id: 'c_pos_discount', label: '是否参与POS折扣', module: 'sales', type: 'switch', categories: ['w_cat_c5'], description: '开启后，POS 结账时此商品参与折扣。' },
    { id: 'c_diners_min', label: '最少用餐人数', module: 'others', type: 'number', categories: ['w_cat_c5'], unit: '人', integer: true, maxNumber: 999999 },
    { id: 'c_diners_max', label: '最多用餐人数', module: 'others', type: 'number', categories: ['w_cat_c5'], unit: '人', integer: true, maxNumber: 999999 },
];
export const CATEGORY_SUPPLEMENT_IDS = new Set(CATEGORY_SUPPLEMENT_FIELDS.map(field => field.id));
export const categorySupplementFields = (categoryId: string) => CATEGORY_SUPPLEMENT_FIELDS.filter(field => field.categories.includes(categoryId));
export const isCategorySupplementActive = (field: CategorySupplementField, data: Record<string, any>) => !field.dependsOn || (field.dependsOn === 'blind_box' ? (data.p_display_type || []).includes('blind_box') : !!data[field.dependsOn]);
export const categoryRestoredFieldIds = (categoryId: string) => [
    'p_badge_date', 'o_base_sales',
    ...(categoryId === 'w_cat_s6' ? [] : ['o_more_settings']),
    ...(categoryId.startsWith('w_cat_s') ? ['s_jump_third_mini_program', 's_third_mini_program_path', 's_sales_commission_amount', 'o_product_share'] : []),
    ...(['w_cat_s1', 'w_cat_s4', 'w_cat_s5', 'w_cat_s6'].includes(categoryId) ? ['o_more_barcodes'] : []),
];

export const CATEGORY_DISPLAY_OPTIONS = [
    { key: 'cake_booking', label: '蛋糕预订', desc: '在小程序独立的蛋糕预订页下单，不在普通点单页展示。', categories: ['w_cat_s4'] },
    { key: 'express_delivery', label: '支持快递配送', desc: '', categories: ['w_cat_s4', 'w_cat_s5'] },
    { key: 'pos_special', label: 'POS端特殊商品标识', desc: '含此商品的订单在 POS 端显示特殊标记。', categories: bakery },
    { key: 'auto_transfer', label: '自动转单商品标识', desc: '含此商品的订单自动转单。', categories: bakery },
    { key: 'blind_box', label: '盲盒商品', desc: '购买套餐后随机抽取所配置的商品。', categories: blindBoxes },
    { key: 'presale', label: '预售商品', desc: '仅用于预售营销活动，不在门店点单页展示；不支持团餐、称重、蛋糕预订、积分兑换及展示商品。', categories: ['w_cat_s1', 'w_cat_s2', 'w_cat_s4', 'w_cat_s5', 'w_cat_c1', 'w_cat_c2', 'w_cat_c3', 'w_cat_c4'] },
];

export function validateCategorySupplement(categoryId: string, data: Record<string, any>, blindTotal: number) {
    const errors: Record<string, string> = {};
    const tags: string[] = data.p_display_type || [];
    for (const field of categorySupplementFields(categoryId)) {
        if (!isCategorySupplementActive(field, data)) continue;
        const value = data[field.id];
        if (value === '' || value === undefined || value === null || field.type !== 'number') continue;
        const number = Number(value);
        if (!Number.isFinite(number) || (field.id !== 'o_storage_temperature' && number < 0) || (field.integer && !Number.isInteger(number))) {
            errors[field.id] = `请填写${field.id === 'o_storage_temperature' ? '有效温度' : field.integer ? '非负整数' : '非负数值'}。`;
        }
        if (field.maxNumber !== undefined && number > field.maxNumber) errors[field.id] = `不能超过 ${field.maxNumber}。`;
        if (number > 0 && field.unitField && !field.unitOptions?.includes(data[field.unitField])) errors[field.id] = '请选择提前预约时间的单位。';
    }
    if (tags.includes('presale') && (tags.some(tag => ['group_meal', 'group_meal_only', 'cake_booking', 'display_product'].includes(tag)) || data.p_points_exchange_rule || categoryId === 'w_cat_s3')) {
        errors.p_display_type = '预售不支持团餐、称重、蛋糕预订、积分兑换或展示商品，请关闭预售或取消冲突设置。';
    }
    if (tags.includes('blind_box') && data.c_blind_draw_count !== '' && data.c_blind_draw_count != null) {
        const count = Number(data.c_blind_draw_count);
        if (count < 1 || count >= blindTotal) errors.c_blind_draw_count = `抽取数量须为正整数且小于标准商品总数量（当前 ${blindTotal} 件）。`;
    }
    if (categoryId === 'w_cat_c5' && data.c_diners_min !== '' && data.c_diners_max !== '' && data.c_diners_min != null && data.c_diners_max != null && Number(data.c_diners_min) > Number(data.c_diners_max)) {
        errors.c_diners_max = '最多用餐人数不能少于最少用餐人数。';
    }
    return errors;
}
