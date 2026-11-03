import type { PublishBatch } from './WebPublishRecords';
import { nowText, type ExecutionMode } from './taskModel.ts';

export type TaskSubject = { id: string; name: string; values: Record<string, unknown> };
const sources = new Map<string, TaskSubject[]>();
export const rememberDomainSource = (brand: string, kind: string, subjects: TaskSubject[]) => { sources.set(`${brand}:${kind}`, subjects); try { localStorage.setItem(`task-domain-source:${brand}:${kind}`, JSON.stringify(subjects)); } catch { /* Task submission reports storage failures without breaking the source page. */ } };
export const currentDomainValue = (brand: string, kind: string, id: string) => (sources.get(`${brand}:${kind}`) || JSON.parse(localStorage.getItem(`task-domain-source:${brand}:${kind}`) || '[]')).find((s: TaskSubject) => s.id === id)?.values;

export type ExtendedKind = 'discontinue' | 'archive' | 'category_sort' | 'addon_sync';
export const extendedNames = { discontinue: '下架门店商品', archive: '删除门店商品', category_sort: '同步分类排序至门店', addon_sync: '同步加料至门店' };
// Data provenance and creation trigger are different concepts.
export const extendedTaskMetadata = (kind: ExtendedKind) => ({
  discontinue: { sourceType: '商品库', sourceName: '商品库', trigger: '商品库商品停售后自动触发' },
  archive: { sourceType: '归档前记录', sourceName: '归档前商品库记录', trigger: '商品库商品归档后自动触发' },
  category_sort: { sourceType: '前台分类', sourceName: '品牌前台分类', trigger: '用户提交分类排序同步' },
  addon_sync: { sourceType: '品牌加料', sourceName: '品牌加料资料', trigger: '用户提交加料同步' },
})[kind];
export function createExtendedTask(input: {
  kind: ExtendedKind; subjects: TaskSubject[]; stores: Array<{ id: string; name: string }>;
  channels: string[]; remark?: string; mode?: ExecutionMode; at?: string;
  targets?: Array<{ storeId: string; storeName: string; channel: string; productId: string; type?: 'qimai' | 'platform' }>;
}): PublishBatch {
  if (!input.subjects.length || !input.stores.length || !input.channels.length) throw new Error('请选择处理对象、门店和渠道。');
  if (input.mode === 'scheduled' && (!input.at || Date.parse(input.at) <= Date.now())) throw new Error('请选择晚于当前时间的执行时间。');
  const { kind, subjects } = input, title = extendedNames[kind], at = nowText(), id = `EXT-${kind}-${Date.now()}`;
  const pending = input.mode === 'manual' || input.mode === 'scheduled';
  const { sourceType, sourceName, trigger } = extendedTaskMetadata(kind);
  const fields = [...new Set(subjects.flatMap(s => Object.keys(s.values)))];
  const targets = input.targets || input.stores.flatMap(store => input.channels.flatMap(channel => subjects.map(s => ({ storeId: store.id, storeName: store.name, channel, productId: s.id, type: 'qimai' as const }))));
  const groups = [...new Set(targets.map(t => t.type === 'platform' ? `platform:${t.channel}` : 'qimai'))];
  const tasks = groups.map((group, index) => {
    const rows = targets.filter(t => (t.type === 'platform' ? `platform:${t.channel}` : 'qimai') === group);
    return { id: `${id}-${index}`, type: group === 'qimai' ? 'qimai' as const : 'platform' as const,
      target: group === 'qimai' ? `企迈门店${kind === 'category_sort' ? '分类排序' : kind === 'addon_sync' ? '加料' : '商品'}` : group.slice(9),
      channels: [...new Set(rows.map(t => t.channel))], status: pending ? 'pending' as const : group === 'qimai' ? 'success' as const : 'waiting' as const,
      progress: pending || group !== 'qimai' ? 0 : 100, productCount: new Set(rows.map(t => t.productId)).size, skuCount: 0, storeCount: new Set(rows.map(t => t.storeId)).size,
      successCount: !pending && group === 'qimai' ? rows.length : 0, failedCount: 0, waitingCount: !pending && group !== 'qimai' ? rows.length : 0,
      startedAt: pending ? '' : at, finishedAt: !pending && group === 'qimai' ? at : undefined,
      waitingReason: group !== 'qimai' ? '等待平台确认，企迈侧结果独立保留' : undefined };
  });
  return { id, title, action: title, sourceType, sourceName,
    snapshot: trigger, storeScope: input.stores.map(s => s.name).join('、'), storeCount: input.stores.length, channels: input.channels,
    productCount: subjects.length, skuCount: 0, creator: '当前用户', createdAt: at, executionMode: input.mode || 'now', scheduledAt: input.at, remark: input.remark || '',
    status: pending ? 'pending' : tasks.some(t => t.status === 'waiting') ? 'running' : 'success', tasks,
    configuration: { operation: kind === 'discontinue' ? 'off_shelf' : kind === 'archive' ? 'delete' : kind, source: { type: kind, name: sourceName },
      products: subjects.map(s => ({ id: s.id, name: s.name, skus: [] })), fields, overrides: {},
      extension: { kind, subjects }, settings: [{ label: '触发方式', value: trigger },
        { label: '处理范围', value: kind === 'category_sort' ? '全部模板、全部门店的分类排序；不修改分类归属及商品排序' : kind === 'addon_sync' ? '仅同步已选加料资料，不修改商品关联加料和购买规则' : kind === 'archive' ? '删除已有门店商品；不重新读取已归档商品作为来源' : '仅下架已有门店商品，保留商品资料及关联' },
        ...(kind === 'archive' ? [{ label: '恢复方式', value: '不自动恢复，重新售卖需重新建品或下发；保留历史记录' }] : [])] },
    details: targets.map((row, index) => { const task = tasks.find(t => t.type === (row.type || 'qimai') && t.channels.includes(row.channel))!;
      const subject = subjects.find(s => s.id === row.productId)!;
      return { id: `${id}-row-${index}`, taskId: task.id, taskType: task.type, productId: subject.id, productName: subject.name, skuId: '', skuName: '', storeId: row.storeId, storeName: row.storeName, channel: row.channel, action: title, fields, status: task.status, finishedAt: task.finishedAt || '', executedValues: task.status === 'success' ? subject.values : undefined }; }) };
}
