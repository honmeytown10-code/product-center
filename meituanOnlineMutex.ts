/** Product-local semantic rules. Transport routing belongs to the platform adapter. */
export type OnlineMutexKind = 'sale' | 'premium' | 'mixed';
export type OnlineMutexOption = {
  id: string; name: string; groupId: string; groupName: string;
  source: 'spec' | 'method' | 'addon';
};
export type OnlineMutexPair = {
  kind: OnlineMutexKind; left: string; right: string; leftLabel: string; rightLabel: string;
};
export type OnlineMutexRule = {
  version: 2; id: string; left: string[]; right: string[]; labels: Record<string, string>;
};
export type OnlineMutexContext = {
  options: OnlineMutexOption[];
  skus: Array<{ id: string; name: string; optionIds: string[] }>;
  defaultIds: string[];
  mandatoryIds?: string[];
  addonRequirements?: Array<{ label: string; minimum: number; items: Array<{ id: string; capacity: number }> }>;
};
export const onlineMutexLabel = (option: OnlineMutexOption) => `${option.groupName} / ${option.name}`;
export const onlineMutexKind = (option: OnlineMutexOption): OnlineMutexKind => option.source === 'addon' ? 'premium' : 'sale';
// A relation is symmetric and independent of either object's transport representation.
export const onlineMutexKey = (pair: Pick<OnlineMutexPair, 'left' | 'right'>) => JSON.stringify([pair.left, pair.right].sort());
const validIds = (ids: unknown): ids is string[] => Array.isArray(ids) && ids.length > 0 && ids.every(id => typeof id === 'string' && id.trim()) && new Set(ids).size === ids.length;
export function readOnlineMutexRules(value: unknown): { rules: OnlineMutexRule[]; error: string } {
  if (value === undefined) return { rules: [], error: '' };
  if (!Array.isArray(value)) return { rules: [], error: '互斥关系数据无法读取，请重新加载商品资料。' };
  const rules: OnlineMutexRule[] = [];
  for (const [index, encoded] of value.entries()) {
    try {
      const rule = JSON.parse(encoded);
      if (rule.version === 2) {
        if (typeof rule.id !== 'string' || !rule.id || !validIds(rule.left) || !validIds(rule.right) || !rule.labels || typeof rule.labels !== 'object'
          || [...rule.left, ...rule.right].some(id => typeof rule.labels[id] !== 'string' || !rule.labels[id])) throw new Error();
        rules.push(rule);
      } else {
        if (!['sale', 'premium', 'mixed'].includes(rule.kind) || ![rule.left, rule.right, rule.leftLabel, rule.rightLabel].every(item => typeof item === 'string' && item.length)) throw new Error();
        rules.push({ version: 2, id: `legacy-${index}`, left: [rule.left], right: [rule.right], labels: { [rule.left]: rule.leftLabel, [rule.right]: rule.rightLabel } });
      }
    } catch { return { rules, error: '部分互斥关系数据无法读取，请重新加载商品资料，避免覆盖原有配置。' }; }
  }
  if (new Set(rules.map(rule => rule.id)).size !== rules.length) return { rules, error: '互斥关系标识重复，请重新加载商品资料。' };
  return { rules, error: '' };
}
export function expandOnlineMutexRules(rules: OnlineMutexRule[]): OnlineMutexPair[] {
  return rules.flatMap(rule => rule.left.flatMap(left => rule.right.map(right => ({
    kind: 'mixed' as const, left, right, leftLabel: rule.labels[left] || left, rightLabel: rule.labels[right] || right,
  }))));
}
export function readOnlineMutexPairs(value: unknown): { pairs: OnlineMutexPair[]; error: string } {
  const decoded = readOnlineMutexRules(value);
  return { pairs: expandOnlineMutexRules(decoded.rules), error: decoded.error };
}
export function onlineMutexBlocker(id: string, selectedIds: string[], pairs: OnlineMutexPair[]) {
  return selectedIds.find(selected => pairs.some(pair => (pair.left === id && pair.right === selected) || (pair.right === id && pair.left === selected)));
}
export function validateOnlineMutex(pairs: OnlineMutexPair[], context: OnlineMutexContext): string[] {
  const errors: string[] = [];
  const options = new Map(context.options.map(option => [option.id, option]));
  const keys = new Set<string>();
  for (const pair of pairs) {
    const left = options.get(pair.left), right = options.get(pair.right);
    const label = `“${left ? onlineMutexLabel(left) : pair.leftLabel}”与“${right ? onlineMutexLabel(right) : pair.rightLabel}”`;
    if (!left || !right) { errors.push(`${label}引用的选项已停用或移除，请编辑或删除关系。`); continue; }
    if (pair.left === pair.right) errors.push('两侧不能包含同一个选项，请移除重复选项。');
    if (left.source !== 'addon' && right.source !== 'addon' && left.groupId === right.groupId) errors.push(`${label}属于同一单选组，无需配置互斥。`);
    if (keys.has(onlineMutexKey(pair))) errors.push(`${label}的互斥关系已存在，请勿重复添加，包括反向配置。`);
    keys.add(onlineMutexKey(pair));
    if (context.defaultIds.includes(pair.left) && context.defaultIds.includes(pair.right)) errors.push(`${label}同时被默认选中，请先调整商品属性中的默认选择。`);
  }
  if (errors.length || !pairs.length) return [...new Set(errors)];
  const groups = [...new Set(context.options.filter(option => option.source === 'method').map(option => option.groupId))]
    .map(groupId => context.options.filter(option => option.groupId === groupId).map(option => option.id));
  const requirements = (context.addonRequirements || []).filter(requirement => requirement.minimum > 0);
  const compatible = (ids: string[]) => !ids.some((id, index) => onlineMutexBlocker(id, ids.slice(0, index), pairs));
  const canSelectAddons = (selected: string[]): boolean => {
    const unmet = requirements.find(requirement => requirement.items.filter(item => selected.includes(item.id)).reduce((sum, item) => sum + item.capacity, 0) < requirement.minimum);
    if (!unmet) return true;
    const candidates = unmet.items.filter(item => item.capacity > 0 && !selected.includes(item.id) && !onlineMutexBlocker(item.id, selected, pairs));
    const potential = unmet.items.filter(item => selected.includes(item.id)).reduce((sum, item) => sum + item.capacity, 0) + candidates.reduce((sum, item) => sum + item.capacity, 0);
    return potential >= unmet.minimum && candidates.some(item => canSelectAddons([...selected, item.id]));
  };
  const canSelectMethods = (index: number, selected: string[]): boolean => {
    if (index === groups.length) return canSelectAddons(selected);
    return groups[index].some(id => !onlineMutexBlocker(id, selected, pairs) && canSelectMethods(index + 1, [...selected, id]));
  };
  const skuChoices = context.skus.length ? context.skus.map(sku => sku.optionIds) : [[]];
  // Filter impossible channel selections without changing or deleting the master SKU.
  if (!skuChoices.some(ids => {
    const initial = [...new Set([...ids, ...(context.mandatoryIds || [])])];
    return compatible(initial) && canSelectMethods(0, initial);
  })) errors.push('当前互斥关系使所有商品组合不可选，或无法满足已有的必选、起购数量规则，请调整关系或原有选择规则。');
  return errors;
}
export function onlineMutexSettingsError(value: unknown, context?: OnlineMutexContext) {
  const decoded = readOnlineMutexPairs(value);
  if (decoded.error) return decoded.error;
  if (decoded.pairs.length && !context) return '商品属性尚未加载，请加载后再保存互斥关系。';
  return context ? validateOnlineMutex(decoded.pairs, context)[0] || '' : '';
}
export type OnlineMutexBinding = { code: string; kind: 'sale' | 'premium' };
/** Internal adapter plan, NOT a Meituan request DTO.
 * Resolve bindings AFTER converting Qmai methods/addons. Sale/premium relations
 * become SKU-conditional visibility restrictions. Production must expand the full
 * sale-attribute SKU (including methods), write hide rules and clear stale hides.
 * Both selection orders and previously selected addons need integration checks. */
export function planOnlineMutex(pairs: OnlineMutexPair[], resolveBinding: (id: string) => OnlineMutexBinding) {
  const sale: Record<string, string[]> = {}, premium: Record<string, string[]> = {}, hides: Record<string, string[]> = {};
  const append = (map: Record<string, string[]>, from: string, to: string) => { map[from] = [...new Set([...(map[from] || []), to])]; };
  for (const pair of pairs) {
    const left = resolveBinding(pair.left), right = resolveBinding(pair.right);
    if (!left?.code || !right?.code || !['sale', 'premium'].includes(left.kind) || !['sale', 'premium'].includes(right.kind)) throw new Error('互斥选项缺少有效的平台编码映射，不能同步。');
    if (left.kind === right.kind) {
      if (left.code === right.code) throw new Error('不同互斥选项映射到了同一个平台编码，请先修复映射。');
      const map = left.kind === 'sale' ? sale : premium;
      append(map, left.code, right.code); append(map, right.code, left.code);
    } else {
      const saleAttribute = left.kind === 'sale' ? left : right, addon = left.kind === 'premium' ? left : right;
      append(hides, saleAttribute.code, addon.code);
    }
  }
  return {
    extendInfoMap: { SALE_ATTRIBUTE_MUTEX_MAP: JSON.stringify(sale), PREMIUM_ATTRIBUTE_MUTEX_MAP: JSON.stringify(premium) },
    conditionalVisibility: Object.entries(hides).map(([saleAttributeCode, premiumCodes]) => ({ saleAttributeCode, premiumCodes, hide: true as const })),
  };
}
/** Legacy helper for same-type transport pairs. Mixed pairs require resolved bindings. */
export function serializeOnlineMutex(pairs: OnlineMutexPair[], resolveCode: (id: string) => string) {
  if (pairs.some(pair => pair.kind === 'mixed')) throw new Error('请先完成平台编码和类型映射，再生成同步规则。');
  const bindings = new Map<string, OnlineMutexBinding>();
  for (const pair of pairs) for (const id of [pair.left, pair.right]) {
    const binding: OnlineMutexBinding = { code: resolveCode(id), kind: pair.kind as 'sale' | 'premium' };
    const old = bindings.get(id);
    if (old && old.kind !== binding.kind) throw new Error('同一选项的平台类型映射不一致。');
    bindings.set(id, binding);
  }
  return planOnlineMutex(pairs, id => bindings.get(id)!).extendInfoMap;
}
