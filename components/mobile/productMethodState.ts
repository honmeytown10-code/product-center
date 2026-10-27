import type { LocalMethod } from './types';

/** App 原型的门店商品经营状态，不写入公共做法定义或 PC 商品数据。 */
export interface ProductMethodConfig {
  groupId: string;
  valueIds: string[];
  disabledValueIds: string[];
  required: boolean;
  defaultValueId?: string;
  valuePrices?: Record<string, string>;
}

/** 门店不可售值沿用生产展示口径：不进入商品做法配置或选择列表。 */
export function visibleMethodConfig(config: ProductMethodConfig[], library: LocalMethod[]): ProductMethodConfig[] {
  return config.map(group => ({ ...group, valueIds: group.valueIds.filter(id => library.find(item => item.id === group.groupId)?.values.some(value => value.id === id && value.status !== 'inactive')) })).filter(group => group.valueIds.length > 0);
}

/** 选择器只编辑当前可见值；隐藏不是解除关联，保留其加价和商品启停配置。 */
export function mergeMethodSelection(config: ProductMethodConfig[], library: LocalMethod[], selected: Record<string, string[]>): ProductMethodConfig[] {
  const merged: ProductMethodConfig[] = library.flatMap(group => {
    const old = config.find(item => item.groupId === group.id);
    const available = group.values.filter(value => value.status !== 'inactive');
    const hiddenIds = (old?.valueIds ?? []).filter(id => !available.some(value => value.id === id));
    const visibleIds = available.filter(value => selected[group.id]?.includes(value.id)).map(value => value.id);
    const ids = [...hiddenIds, ...visibleIds];
    if (!ids.length) return [];
    return [{ ...old, groupId: group.id, valueIds: ids, disabledValueIds: (old?.disabledValueIds ?? []).filter(id => ids.includes(id)), required: old?.required ?? false, valuePrices: Object.fromEntries(ids.map(id => [id, old?.valuePrices?.[id] ?? ''])) }];
  });
  return [...merged, ...config.filter(group => !library.some(definition => definition.id === group.groupId))];
}

// 仅为现有饮品样例补充关联，供商品级启停演示；不是生产关联数据。
export function demoProductMethods(productId: string): ProductMethodConfig[] {
  if (!['1', '2', '3', '4', '9', '12'].includes(productId)) return [];
  return [
    { groupId: 'm_brand_1', valueIds: ['v_b1_1', 'v_b1_2', 'v_b1_3', 'v_b1_4', 'v_b1_5'], disabledValueIds: [], required: true },
    { groupId: 'm_brand_2', valueIds: ['v_b2_1', 'v_b2_2', 'v_b2_3', 'v_b2_4', 'v_b2_5'], disabledValueIds: [], required: true },
  ];
}

export function methodConfigError(config: ProductMethodConfig[], library: LocalMethod[]): string {
  for (const group of visibleMethodConfig(config, library)) {
    const definition = library.find(item => item.id === group.groupId);
    if (!definition) return '做法配置已变化，请返回后重新打开商品。';
    const available = definition.values.filter(value => group.valueIds.includes(value.id) && value.status !== 'inactive' && !group.disabledValueIds.includes(value.id));
    if (group.required && !available.length) return `“${definition.name}”为必选做法，请至少保留一个可用选项。`;
    if (group.defaultValueId && !available.some(value => value.id === group.defaultValueId)) return `“${definition.name}”的默认做法不可用，请先调整默认做法。`;
    for (const id of group.valueIds) {
      const price = group.valuePrices?.[id]?.trim();
      if (price && (!/^\d+(\.\d{1,2})?$/.test(price) || !Number.isFinite(Number(price)))) return `“${definition.values.find(value => value.id === id)?.name}”的加价请输入非负金额，最多两位小数。`;
    }
  }
  return '';
}

export function methodConfigSummary(config: ProductMethodConfig[], library: LocalMethod[]): string {
  const visible = visibleMethodConfig(config, library);
  if (!visible.length) return '设置做法';
  const values = visible.flatMap(group => {
    const definition = library.find(item => item.id === group.groupId);
    return group.valueIds.map(id => ({ enabled: !group.disabledValueIds.includes(id) && definition?.values.some(value => value.id === id && value.status !== 'inactive') }));
  });
  const disabled = values.filter(value => !value.enabled).length;
  return disabled ? `${visible.length} 组 · ${disabled} 项已禁用` : `${visible.length} 组 · ${values.length} 项`;
}
