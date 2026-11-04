import type { Product } from '../../types';
import type { ComboGroup } from './WebComboProductDetail';
import type { StoreProductRecord } from './WebStoreProductList';

// 独立原型示例：通过商品库列表或 preview=complex-combo 查看，不覆盖已有商品。
export const COMPLEX_COMBO_DEMO_ID = 'demo-complex-combo';
const item = (id: string, name: string, spec: string, quantity = 1, surcharge = 0, isDefault = false) => ({
  id, productId: `demo-item-${id}`, name, spec, quantity, surcharge, isDefault, skuCode: `DEMO-SKU-${id.toUpperCase()}`, channelEnabled: true,
});
export const COMPLEX_COMBO_GROUPS: ComboGroup[] = [
  { id: 'fixed-main', type: 'fixed', title: '双人分享 · 固定主餐', items: [
    item('f1', '招牌炭烤厚切牛肉汉堡', '双层牛肉 / 原味', 2),
    item('f2', '海盐薯条', '大份 180g', 1),
    item('f3', '香酥鸡块', '6块装', 1),
  ] },
  { id: 'optional-main', type: 'optional', title: '主食升级 · 四选二', configMode: 'pick', requiredOptionCount: 2,
    isRequired: true, minTotalQuantity: 2, maxTotalQuantity: 2, relativePrice: false, remark: '默认搭配经典汉堡与鸡腿堡，可更换为升级商品。', items: [
      item('m1', '经典牛肉汉堡', '单层 / 原味', 1, 0, true),
      item('m2', '香辣鸡腿堡', '微辣 / 常规', 1, 0, true),
      item('m3', '黑松露安格斯牛肉汉堡（双层厚切牛肉配切达芝士与慢煎洋葱）', '双层牛肉 / 双份芝士 / 原味', 1, 12),
      item('m4', '香煎鳕鱼堡', '常规 / 少酱', 1, 6),
    ] },
  { id: 'optional-drinks', type: 'optional', title: '双人饮品 · 按数量必选', configMode: 'flexible', isRequired: true,
    minTotalQuantity: 2, maxTotalQuantity: 4, relativePrice: true, remark: '至少选择2份，最多4份；相同商品可重复选择。', items: [
      { ...item('d1', '冰可乐', '中杯 480ml / 正常冰', 2, 0, true), productId: 'demo-ice-cola' },
      { ...item('d2', '冰可乐', '大杯 600ml / 正常冰', 1, 2), productId: 'demo-ice-cola' },
      item('d3', '鲜萃柠檬红茶', '大杯 600ml / 少冰 / 标准糖', 1, 3),
      { ...item('d4', '生椰拿铁', '中杯 480ml / 冰 / 无糖', 1, 8), productId: 'demo-coconut-latte' },
      { ...item('d5', '生椰拿铁', '大杯 600ml / 热 / 无糖', 1, 10), productId: 'demo-coconut-latte' },
    ] },
  { id: 'fixed-sides', type: 'fixed', title: '分享小食 · 固定搭配', items: [
    item('s1', '黄金洋葱圈', '8个装', 1),
    item('s2', '番茄酱', '独立装 10g', 3),
    item('s3', '蜂蜜芥末酱', '独立装 15g', 2),
  ] },
  { id: 'optional-extras', type: 'optional', title: '加购小食 · 非必选', configMode: 'flexible', isRequired: false,
    minTotalQuantity: 0, maxTotalQuantity: 3, relativePrice: false, remark: '可不选；如需加购，最多选择3份。', items: [
      item('e1', '香辣鸡翅', '2只装 / 微辣', 1, 12),
      item('e2', '鸡米花', '小份 100g', 1, 8),
      item('e3', '芝士薯条', '大份 180g', 1, 15),
      item('e4', '田园蔬菜沙拉', '常规 / 油醋汁', 1, 10),
    ] },
  { id: 'free-dessert', type: 'free', title: '餐后甜品随心配', desc: '4个可选商品 · 最少选择1份 · 最多选择2份', items: [
    item('t1', '香草冰淇淋', '单球 / 杯装', 1, 0, true),
    item('t2', '巧克力冰淇淋', '双球 / 杯装', 1, 5),
    item('t3', '提拉米苏', '单人份 100g', 1, 12),
    item('t4', '巴斯克芝士蛋糕', '原味 / 单人份 120g', 1, 15),
  ] },
  { id: 'fixed-multi', type: 'fixed_multi', title: '双拼披萨 · 固定搭配（多拼商品）', items: [
    item('p1', '经典意式肉酱披萨', '12寸 / 薄底 / 半份', 1),
    item('p2', '夏威夷风情披萨', '12寸 / 薄底 / 半份', 1),
  ] },
];

export function createComplexComboDetailDemo(): Product {
  return {
    id: COMPLEX_COMBO_DEMO_ID, name: '周末双人欢聚套餐', price: 168, type: 'combo',
    category: '双人套餐', skuCode: '1324030139146539010', status: 'on_shelf', stockStatus: 'available',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200&h=200&fit=crop',
    createdTime: '2026-11-03 10:30:00',
    formData: {
      p_name: '周末双人欢聚套餐', p_front_cat: ['套餐 / 分享套餐 / 双人套餐'], p_back_cat: '套餐', p_unit: '套',
      combo_price_type: 'markup',
      salesScope: { channelIds: ['mini_program_dine_in', 'mini_program_delivery', 'pos'] },
      applicableChannelIds: ['mini_program_dine_in', 'mini_program_delivery', 'pos'],
      takeoutFormState: {
        comboGroupCards: COMPLEX_COMBO_GROUPS,
        specConfigRows: [{ id: 'combo-spec', s_spec_name: '双人份', s_spec_price: '168', s_spec_sku_code: 'COMBO-WEEKEND-2', s_spec_barcode: '6901234567890', s_spec_mark: '周末限定' }],
      },
    },
  };
}

export const COMPLEX_COMBO_STORES: StoreProductRecord[] = ['mini_dine', 'mini_take', 'pos'].flatMap((channel, channelIndex) =>
  ['国贸店', '望京店', '三里屯店'].map((storeName, index) => ({
    id: `demo-complex-${channel}-${index}`, baseProductId: COMPLEX_COMBO_DEMO_ID, name: '周末双人欢聚套餐', type: 'Combo',
    category: '双人套餐', storeId: `demo-store-${index}`, storeName, channels: [channel], image: '', tags: [],
    status: (channelIndex + index) % 3 === 1 ? 'off_shelf' : 'on_shelf',
    stockStatus: channel === 'pos' && index === 2 ? 'empty' : 'normal',
    stockCount: channel === 'pos' && index === 2 ? 0 : 80 - channelIndex * 15 - index * 5,
    formData: { s_price: (168 + channelIndex * 10 + index * 5).toFixed(2), storeCode: `QM00${index + 1}` },
    lastSync: '2026-11-03 10:30:00', sortIndex: index,
  })));
export const COMPLEX_COMBO_SALES = {
  '7': { saleCount: 24, grossAmount: 4032, receiptAmount: 3830.4, avgPrice: 168 },
  '30': { saleCount: 128, grossAmount: 21504, receiptAmount: 20428.8, avgPrice: 168 },
  '90': { saleCount: 328, grossAmount: 55104, receiptAmount: 52348.8, avgPrice: 168 },
};
export const COMPLEX_COMBO_TEMPLATES = [
  { id: 'demo-combo-tpl-1', name: '全国堂食周末套餐模板', channels: ['pos', 'mini_program_dine_in'], status: 'enabled' },
  { id: 'demo-combo-tpl-2', name: '华东外卖分享套餐模板', channels: ['mini_program_delivery', 'meituan'], status: 'enabled' },
];

// 将既有 ID=10 的演示记录补齐为同一套复杂配置，保留其身份、名称和价格。
export function enrichValueComboDemo(product: Product): Product {
  const sample = createComplexComboDetailDemo();
  return {
    ...sample, ...product,
    formData: {
      ...sample.formData, ...product.formData, p_name: product.name,
      takeoutFormState: {
        ...sample.formData?.takeoutFormState,
        ...product.formData?.takeoutFormState,
        comboGroupCards: COMPLEX_COMBO_GROUPS,
        specConfigRows: [{ ...sample.formData!.takeoutFormState.specConfigRows[0], s_spec_price: String(product.price), s_spec_sku_code: 'COMBO-VALUE-2', s_spec_mark: '超值双人' }],
      },
    },
  };
}
export const VALUE_COMBO_STORES: StoreProductRecord[] = COMPLEX_COMBO_STORES.map(row => ({
  ...row, id: row.id.replace('demo-complex-', 'demo-value-'), baseProductId: '10', name: '超值双人套餐', category: '西式快餐',
  formData: { ...row.formData, s_price: (Number(row.formData?.s_price) - 80).toFixed(2) },
}));
export const VALUE_COMBO_SALES = {
  '7': { saleCount: 24, grossAmount: 2112, receiptAmount: 2006.4, avgPrice: 88 },
  '30': { saleCount: 128, grossAmount: 11264, receiptAmount: 10700.8, avgPrice: 88 },
  '90': { saleCount: 328, grossAmount: 28864, receiptAmount: 27420.8, avgPrice: 88 },
};
