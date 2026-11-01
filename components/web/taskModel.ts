import type { PublishBatch, PublishTask, TaskExecutionDetail } from './WebPublishRecords';

export type ExecutionMode = 'now' | 'manual' | 'scheduled';
export type TaskOperation = 'sync' | 'batch' | 'copy' | 'delete' | 'other';
export type FieldValues = Record<string, unknown>;
export type TaskConfiguration = {
  operation: TaskOperation;
  source: { type: string; id?: string; name: string };
  products: Array<{ id: string; name: string; skus: Array<{ id: string; name: string }> }>;
  fields: string[];
  overrides: Record<string, FieldValues>;
  settings?: Array<{ label: string; value: string }>;
  demoSource?: boolean;
};

export const modeLabel = { now: '立即执行', manual: '手动执行', scheduled: '定时执行' };
export const operationLabel = { sync: '商品同步', batch: '批量修改', copy: '商品复制', delete: '商品删除', other: '商品任务' };
export const displayValue = (value: unknown): string => value === undefined || value === null ? '--' : typeof value === 'object' ? JSON.stringify(value) : String(value);
export const characterCount = (value: string) => Array.from(value).length;
export const nowText = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai', hour12: false });
export const operationOf = (batch: PublishBatch): TaskOperation => batch.configuration?.operation || (/删除/.test(batch.action) ? 'delete' : /复制/.test(batch.action) ? 'copy' : /修改|更新.*属性/.test(batch.action) ? 'batch' : /发布|同步|更新渠道/.test(batch.action) ? 'sync' : 'other');
export const aggregateStatus = (tasks: PublishTask[]): PublishBatch['status'] => {
  if (tasks.every(task => task.status === 'pending')) return 'pending';
  if (tasks.some(task => task.status === 'running' || task.status === 'waiting' || task.status === 'pending')) return tasks.some(task => task.status === 'failed') ? 'partial' : 'running';
  return tasks.every(task => task.status === 'success') ? 'success' : tasks.every(task => task.status === 'failed') ? 'failed' : 'partial';
};

// Read current source values by attribute. Explicit task overrides are kept separately,
// including false, zero, empty strings and structured SKU values.
export function productValues(product: any): FieldValues {
  const data = product.formData || {};
  return { ...data, '商品名称': product.name, '售价': product.specs?.length > 1 ? Object.fromEntries(product.specs.map((sku: any) => [sku.id, sku.price])) : product.price,
    '前台分类': data.p_front_cat ?? product.category, '商品主图': product.image, '商品排序': data.p_sort ?? product.sortIndex,
    '售卖时间': data.p_sale_time ?? product.timeSale, '售卖方式': product.salesMode ?? data.p_sale_mode,
    '库存': data.stock ?? product.stock, '上下架': product.status };
}

export function executeLocalTask(batch: PublishBatch, resolve: (id: string) => FieldValues | undefined, taskId?: string, retry = false): PublishBatch {
  const config = batch.configuration;
  if (!config) throw new Error('历史任务缺少原始配置，不能安全执行。请重新创建任务。');
  const at = nowText();
  const executing = batch.tasks.filter(task => !taskId || task.id === taskId);
  const details = (batch.details || []).map(row => {
    const matching = executing.some(task => row.taskId ? row.taskId === task.id : task.type === row.taskType && task.channels.includes(row.channel));
    if (!matching || retry && row.status !== 'failed') return row;
    const latest = resolve(row.productId);
    const error = latest ? undefined : '来源商品已删除或不在当前有权范围，本条未执行。';
    const values = latest ? { ...latest, ...(config.overrides[row.productId] || {}) } : undefined;
    return { ...row, status: error ? 'failed' as const : 'success' as const, finishedAt: at, error, executedValues: values };
  });
  const tasks = batch.tasks.map(task => {
    if (!executing.some(item => item.id === task.id)) return task;
    const rows = details.filter(row => row.taskId ? row.taskId === task.id : task.type === row.taskType && task.channels.includes(row.channel));
    const failed = rows.filter(row => row.status === 'failed');
    if (!rows.length) return { ...task, status: 'failed' as const, error: '缺少原始对象明细，请重新创建任务。' };
    return { ...task, status: failed.length ? 'failed' as const : 'success' as const, progress: 100,
      successCount: rows.filter(row => row.status === 'success').length, failedCount: failed.length, waitingCount: 0,
      startedAt: task.startedAt && task.status !== 'pending' ? task.startedAt : at, finishedAt: at,
      error: failed[0]?.error, waitingReason: undefined };
  });
  return { ...batch, tasks, details, status: aggregateStatus(tasks), executedAt: at };
}

export function pendingTask(batch: PublishBatch): PublishBatch {
  if (!batch.executionMode || batch.executionMode === 'now') return batch;
  return { ...batch, status: 'pending', tasks: batch.tasks.map(task => ({ ...task, status: 'pending', progress: 0, successCount: 0, failedCount: 0, waitingCount: 0, startedAt: '', finishedAt: undefined, error: undefined })),
    details: batch.details?.map(row => ({ ...row, status: 'pending', finishedAt: '', error: undefined })) };
}

export const matchesTask = (row: TaskExecutionDetail, task: PublishTask) => row.taskId ? row.taskId === task.id : row.taskType === task.type && task.channels.includes(row.channel);
