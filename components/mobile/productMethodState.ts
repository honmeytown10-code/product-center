import type { LocalMethod } from './types';

/** 后端权限编号由产品补充；原型仅接收已解析的权限结果。 */
export const PRODUCT_METHOD_TOGGLE_PERMISSION = {
  name: '商品级做法启用/禁用',
  permissionId: '',
  deniedMessage: '暂无此字段变更权限，请联系管理员',
} as const;

export const STORE_METHOD_DISABLED_MESSAGE = '该做法已在门店禁用，无法启用';

/** App 原型的门店商品经营状态，不写入公共做法定义或 PC 商品数据。 */
export interface ProductMethodConfig {
  groupId: string;
  valueIds: string[];
  disabledValueIds: string[];
  required: boolean;
  defaultValueId?: string;
  valuePrices?: Record<string, string>;
}

export function methodToggleBlockReason(library: LocalMethod[], groupId: string, valueId: string, canToggle: boolean, nextEnabled = true): string {
  if (!canToggle) return PRODUCT_METHOD_TOGGLE_PERMISSION.deniedMessage;
  const value = library.find(group => group.id === groupId)?.values.find(item => item.id === valueId);
  return nextEnabled && value?.status === 'inactive' ? STORE_METHOD_DISABLED_MESSAGE : '';
}

/** 新增关联的默认启用和删除关联不属于独立的启停操作。 */
export function methodAvailabilityChanged(previous: ProductMethodConfig[], next: ProductMethodConfig[]): boolean {
  return next.some(group => {
    const old = previous.find(item => item.groupId === group.groupId);
    return group.valueIds.some(id => {
      const wasDisabled = old?.disabledValueIds.includes(id) ?? false;
      return wasDisabled !== group.disabledValueIds.includes(id);
    });
  });
}

export function enablesStoreDisabledMethod(previous: ProductMethodConfig[], next: ProductMethodConfig[], library: LocalMethod[]): boolean {
  return next.some(group => group.valueIds.some(id => {
    if (group.disabledValueIds.includes(id)) return false;
    const old = previous.find(item => item.groupId === group.groupId);
    const wasEnabled = old?.valueIds.includes(id) && !old.disabledValueIds.includes(id);
    return !wasEnabled && library.find(item => item.id === group.groupId)?.values.some(value => value.id === id && value.status === 'inactive');
  }));
}

/** 已关联列表保留所有做法，门店状态与商品级状态独立展示。 */
export function associatedMethodConfig(config: ProductMethodConfig[], library: LocalMethod[]): ProductMethodConfig[] {
  return config.map(group => ({ ...group, valueIds: group.valueIds.filter(id => library.find(item => item.id === group.groupId)?.values.some(value => value.id === id)) })).filter(group => group.valueIds.length > 0);
}

/** 新增选择器仍只提供门店可售值，不因过滤解除已有隐藏关联。 */
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
  const visible = associatedMethodConfig(config, library);
  if (!visible.length) return '设置做法';
  const values = visible.flatMap(group => {
    return group.valueIds.map(id => ({ enabled: !group.disabledValueIds.includes(id) }));
  });
  const disabled = values.filter(value => !value.enabled).length;
  return disabled ? `${visible.length} 组 · ${disabled} 项已禁用` : `${visible.length} 组 · ${values.length} 项`;
}
