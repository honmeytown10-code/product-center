import type { Product } from '../../types';
import { calculateBatchProductPatch, type BatchEditConfiguration } from './batchProductPatch';

export const BATCH_PRODUCT_LIMIT = 100;
// Prototype adapter only; production batch size/concurrency must follow the API contract.
export const DEMO_BATCH_SIZE = 20;
export const BATCH_CHANNELS = [
  { id: 'mini', name: '小程序' }, { id: 'meituan', name: '美团外卖' },
  { id: 'taobao', name: '淘宝闪购' }, { id: 'pos', name: 'POS收银' },
];
export const BATCH_FIELDS: Record<string, string> = { p_name: '商品名称', s_price: '基础价格', p_cat: '商品分类', st_time: '售卖时间' };
export type ItemStatus = 'pending' | 'running' | 'success' | 'failed' | 'unknown';
export type BatchItem = {
  id: string; productId: string; name: string; image: string; channel: string;
  payload: Partial<Product>; status: ItemStatus; attempts: number; reason?: string;
};
export type BatchTask = {
  version: 1; id: string; scope: string; storeName: string; createdAt: string;
  fields: string[]; channels: string[]; productCount: number; items: BatchItem[];
};
export type ItemResult = { id: string; status: 'success' | 'failed' | 'unknown'; reason?: string };
export type BatchTransport = {
  submit: (items: BatchItem[], taskId: string) => Promise<ItemResult[]>;
  confirm: (items: BatchItem[], taskId: string) => Promise<ItemResult[]>;
};

export function createBatchTask(products: Product[], config: BatchEditConfiguration, scope: string, storeName: string): BatchTask {
  const unique = [...new Map(products.map(product => [product.id, product])).values()];
  if (!unique.length || unique.length > BATCH_PRODUCT_LIMIT) throw new Error('每次请选择 1–100 个商品');
  const channels = config.channels.includes('all') ? BATCH_CHANNELS.map(channel => channel.id) : [...new Set(config.channels)].filter(id => BATCH_CHANNELS.some(channel => channel.id === id));
  if (!channels.length) throw new Error('请选择生效渠道');
  if (!config.fields.length) throw new Error('请选择修改项');
  const id = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    version: 1, id, scope, storeName, createdAt: new Date().toISOString(), fields: [...config.fields], channels, productCount: unique.length,
    items: unique.flatMap(product => {
      const payload = calculateBatchProductPatch(product, config);
      return channels.map(channel => ({ id: `${id}:${product.id}:${channel}`, productId: product.id, name: product.name, image: product.image, channel, payload: JSON.parse(JSON.stringify(payload)), status: 'pending' as const, attempts: 0 }));
    }),
  };
}

export function planBatches(items: BatchItem[], size = DEMO_BATCH_SIZE): BatchItem[][] {
  if (!Number.isInteger(size) || size < 1) throw new Error('Invalid batch size');
  const eligible = items.filter(item => item.status === 'pending' || item.status === 'failed');
  const productIds = [...new Set(eligible.map(item => item.productId))];
  const batches: BatchItem[][] = [];
  for (let index = 0; index < productIds.length; index += size) {
    const ids = new Set(productIds.slice(index, index + size));
    batches.push(eligible.filter(item => ids.has(item.productId)));
  }
  return batches;
}
export function productTaskStats(task: BatchTask) {
  const ids = [...new Set(task.items.map(item => item.productId))];
  const success = ids.filter(id => task.items.filter(item => item.productId === id).every(item => item.status === 'success')).length;
  return { total: ids.length, success, failed: ids.length - success };
}

export function applyBatchResults(task: BatchTask, requested: BatchItem[], results: ItemResult[]): BatchTask {
  const ids = new Set(requested.map(item => item.id));
  const byId = new Map(results.map(result => [result.id, result]));
  return { ...task, items: task.items.map(item => {
    if (!ids.has(item.id) || item.status === 'success') return item;
    const result = byId.get(item.id);
    return { ...item, status: result?.status ?? 'unknown', reason: result?.reason ?? (result ? undefined : '暂未收到结果，需先确认修改状态') };
  }) };
}
export function recoverBatchTask(raw: string | null, scope: string): BatchTask | null {
  try {
    if (!raw) return null;
    const task = JSON.parse(raw) as BatchTask;
    if (task.version !== 1 || task.scope !== scope || !Array.isArray(task.items) || !task.items.length || task.items.length > 400 || !Array.isArray(task.channels) || !Array.isArray(task.fields)) return null;
    if (!task.items.every(item => item && typeof item.id === 'string' && ['pending','running','success','failed','unknown'].includes(item.status) && item.payload && typeof item.payload === 'object')) return null;
    return { ...task, items: task.items.map(item => item.status === 'running' ? { ...item, status: 'unknown', reason: '上次提交被中断，需确认修改结果' } : item) };
  } catch { return null; }
}
export function taskStats(task: BatchTask) {
  const count = (status: ItemStatus) => task.items.filter(item => item.status === status).length;
  const success = count('success'), failed = count('failed'), unknown = count('unknown');
  return { total: task.items.length, success, failed, unknown, pending: count('pending') + count('running'), processed: success + failed + unknown };
}

// Deterministic demo failures; never calls a production submission API.
export function demoTransport(scenario: string): BatchTransport {
  const wait = () => new Promise(resolve => setTimeout(resolve, 350));
  return {
    async submit(items) {
      await wait();
      return items.map((item, index) => {
        if (scenario === 'all-failed') return { id: item.id, status: 'failed', reason: '渠道服务暂不可用，请稍后重试' };
        if (scenario !== 'success' && item.attempts === 1 && item.productId === items[0]?.productId && item.channel === 'meituan') return { id: item.id, status: 'failed', reason: '渠道服务繁忙，请重试' };
        return { id: item.id, status: 'success' };
      });
    },
    async confirm(items) {
      await wait();
      return items.map(item => ({ id: item.id, status: 'success' }));
    },
  };
}
