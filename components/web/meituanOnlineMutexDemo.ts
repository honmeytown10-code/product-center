import { type OnlineMutexPair, type OnlineMutexRule } from '../../meituanOnlineMutex';

export const MEITUAN_MUTEX_DEMO_KEY = 'qmai-meituan-online-mutex-demo-v1';
export function getMeituanMutexDemoKey() {
  const scope = new URLSearchParams(window.location.search).get('mutexScope');
  return scope === 'template' || scope === 'store' ? `${MEITUAN_MUTEX_DEMO_KEY}:${scope}` : MEITUAN_MUTEX_DEMO_KEY;
}
export function createMeituanMutexDemoProduct() {
  const sample = new URLSearchParams(window.location.search).get('mutexSample') || 'saved';
  if (sample === 'saved') {
    try { const saved = JSON.parse(localStorage.getItem(getMeituanMutexDemoKey()) || 'null'); if (saved?.id === 'demo-meituan-latte' && saved.formData?.takeoutFormState) return saved; } catch { /* Keep the demo accessible if storage is unavailable. */ }
  }
  const sale: OnlineMutexPair = { kind: 'sale', left: `spec:${JSON.stringify(['spec-group-1', '中杯 480ml'])}`, right: 'method:method-2', leftLabel: '杯型规格 / 中杯 480ml', rightLabel: '温度 / 少冰' };
  const premium: OnlineMutexPair = { kind: 'premium', left: 'addon:addon-1', right: 'addon:addon-2', leftLabel: '小料 / 西米', rightLabel: '小料 / 芒果粒' };
  const pairs = sample === 'empty' || sample === 'no-options' ? [] : [sale, premium];
  if (sample === 'invalid') pairs[0] = { ...sale, right: 'method:removed', rightLabel: '温度 / 已移除的温热选项' };
  const unifiedRules: OnlineMutexRule[] = [
    { version: 2, id: 'demo-unified-1', left: [sale.left, 'method:method-2'], right: ['method:method-4', 'addon:addon-2'], labels: {
      [sale.left]: sale.leftLabel, 'method:method-2': '温度 / 少冰', 'method:method-4': '糖度 / 七分糖', 'addon:addon-2': '小料 / 芒果粒',
    } },
    { version: 2, id: 'demo-unified-2', left: ['addon:addon-1'], right: ['addon:addon-3'], labels: { 'addon:addon-1': '小料 / 西米', 'addon:addon-3': '小料 / 红柚粒' } },
  ];
  const encodedRules = ['legacy', 'invalid', 'default-conflict', 'empty', 'no-options'].includes(sample)
    ? pairs.map(pair => JSON.stringify(pair)) : unifiedRules.map(rule => JSON.stringify(rule));
  return {
    id: 'demo-meituan-latte', name: '醇香拿铁', skuCode: 'LATTE-001', price: 22, category: '咖啡', type: 'standard',
    formData: {
      p_name: '醇香拿铁', p_front_cat: '咖啡', p_back_cat: '饮品', p_unit: '杯', salesChannelIds: ['meituan_dine'],
      channelSpecificValues: { meituan_dine: { onlineMutexPairs: encodedRules } },
      takeoutFormState: {
        disabledChannelSpecValues: [],
        specDisplayMode: sample === 'no-options' ? 'single' : 'multi',
        selectedSpecValuesByGroup: sample === 'no-options' ? {} : { 'spec-group-1': ['中杯 480ml', '大杯 600ml'] },
        specConfigRows: ['中杯 480ml', '大杯 600ml'].map((name, index) => ({
          id: `spec-${index + 1}`, s_spec_name: name, s_spec_price: String(22 + index * 4), s_spec_channel_price: String(22 + index * 4), s_spec_market: String(22 + index * 4),
          s_spec_initial_stock: '9999', s_spec_max_stock: '9999', s_spec_auto_restock: false, s_spec_inventory_mode: 'unlimited', s_spec_sale_status: 'on',
          s_spec_sku_code: `LATTE-${index + 1}`, s_spec_code: `LATTE-${index + 1}`, s_spec_barcode: '', s_spec_store_pack_fee: '0', s_spec_take_pack_fee: '0',
        })),
        methodConfigRows: sample === 'no-options' ? [] : [
          { id: 'method-1', groupName: '温度', m_method_name: '热', m_method_sync: true, m_method_markup: '0' },
          { id: 'method-2', groupName: '温度', m_method_name: '少冰', m_method_sync: true, m_method_markup: '0' },
          { id: 'method-3', groupName: '糖度', m_method_name: '标准糖', m_method_sync: true, m_method_markup: '0' },
          { id: 'method-4', groupName: '糖度', m_method_name: '七分糖', m_method_sync: true, m_method_markup: '0' },
        ],
        addonConfigRows: sample === 'no-options' ? [] : [
          { id: 'addon-1', groupName: '小料', addonName: '西米', addonCode: '1210585227812483072', addonStatus: 'on', addonPrice: '2', addonSpecPrice: '', addonLimit: '3', fixedQuantity: '1' },
          { id: 'addon-2', groupName: '小料', addonName: '芒果粒', addonCode: '1210585270384668672', addonStatus: 'on', addonPrice: '3', addonSpecPrice: '', addonLimit: '2', fixedQuantity: '1' },
          { id: 'addon-3', groupName: '小料', addonName: '红柚粒', addonCode: '1210585270384668675', addonStatus: 'on', addonPrice: '3', addonSpecPrice: '', addonLimit: '2', fixedQuantity: '1' },
        ],
        attrDefaultSelections: { spec: '中杯 480ml', 'method:温度': sample === 'default-conflict' ? '少冰' : '热', 'method:糖度': '标准糖', 'addon:小料': ['西米'] },
        attrPanelOrder: ['spec', 'method:温度', 'method:糖度', 'addon:小料'],
        addonScope: 'total', addonTotalRule: { ruleMode: 'unlimited', min: '0', max: '10', required: '1', isRequired: false },
      },
    },
  };
}
