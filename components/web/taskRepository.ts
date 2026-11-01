import { useEffect, useState } from 'react';
import type { PublishBatch } from './WebPublishRecords';
import { executeLocalTask, pendingTask, type FieldValues } from './taskModel';

const key = (brand: string) => `product-tasks-demo-v1:${brand}`;
const event = 'product-tasks-changed';
const resolvers = new Map<string, (batch: PublishBatch, id: string) => FieldValues | undefined>();
export const registerTaskSource = (brand: string, resolver: (batch: PublishBatch, id: string) => FieldValues | undefined) => { resolvers.set(brand, resolver); };
export const resolveTaskSource = (brand: string, batch: PublishBatch, id: string) => batch.configuration?.demoSource ? readDemoSource(brand)[id] : resolvers.get(brand)?.(batch, id);

// Local demonstration scheduling only. Timers catch up on the next page load;
// production requires a server-side scheduler and permission/version revalidation.
export function useLocalTaskScheduler(brand: string) {
  useEffect(() => {
    const tick = () => {
      try {
        for (const batch of readTasks(brand)) {
          if (batch.status !== 'pending' || batch.executionMode !== 'scheduled' || !batch.scheduledAt || Date.parse(batch.scheduledAt) > Date.now()) continue;
          saveTask(brand, executeLocalTask(batch, id => resolveTaskSource(brand, batch, id)));
        }
      } catch { /* The record page reports storage errors; never discard a task. */ }
    };
    const timer = setInterval(tick, 1000); tick();
    return () => clearInterval(timer);
  }, [brand]);
}
export const readTasks = (brand: string): PublishBatch[] => {
  const raw = localStorage.getItem(key(brand));
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (!Array.isArray(data) || data.some(batch => !batch.id || !Array.isArray(batch.tasks))) throw new Error('任务记录读取失败，请检查浏览器存储后重试。');
  return data;
};
export function saveTask(brand: string, input: PublishBatch) {
  const batch = input.status === 'pending' ? pendingTask(input) : input;
  if (Array.from(batch.remark || '').length > 100) throw new Error('任务备注不能超过 100 个字符。');
  const tasks = readTasks(brand);
  localStorage.setItem(key(brand), JSON.stringify([batch, ...tasks.filter(item => item.id !== batch.id)]));
  window.dispatchEvent(new CustomEvent(event));
}
export function useTaskRepository(brand: string) {
  const [tasks, setTasks] = useState<PublishBatch[]>([]);
  const [error, setError] = useState('');
  const reload = () => { try { setTasks(readTasks(brand)); setError(''); } catch (err) { setError(err instanceof Error ? err.message : '任务读取失败'); } };
  useEffect(() => { reload(); window.addEventListener(event, reload); window.addEventListener('storage', reload); return () => { window.removeEventListener(event, reload); window.removeEventListener('storage', reload); }; }, [brand]);
  return { tasks, error, reload };
}

export const demoProducts = [
  { id: 'demo-latte', name: '生椰拿铁', skus: [{ id: 'demo-sku-1', name: '大杯 / 冰' }] },
  { id: 'demo-tea', name: '茉莉鲜奶茶', skus: [{ id: 'demo-sku-2', name: '大杯 / 热' }] },
];
export const demoStores = ['上海静安店', '杭州滨江店'];
export function readDemoSource(brand: string): Record<string, FieldValues> {
  return JSON.parse(localStorage.getItem(`${key(brand)}:source`) || 'null') || {
    'demo-latte': { 商品名称: '生椰拿铁', 售价: 22, 前台分类: '现磨咖啡', 商品排序: 1 },
    'demo-tea': { 商品名称: '茉莉鲜奶茶', 售价: 18, 前台分类: '鲜奶茶', 商品排序: 2 },
  };
}
export function writeDemoSource(brand: string, values: Record<string, FieldValues>) {
  localStorage.setItem(`${key(brand)}:source`, JSON.stringify(values));
}
export function demonstrationTasks(): PublishBatch[] {
  const make = (id: string, operation: 'sync' | 'batch' | 'copy' | 'delete', remark: string, mode: 'scheduled' | 'manual' | 'now'): PublishBatch => {
    const names = { sync: '周末新品定时下发', batch: '华东门店价格调整', copy: '新店开业商品复制', delete: '下市商品清理' };
    const fields = operation === 'sync' ? ['商品名称', '售价', '前台分类'] : operation === 'batch' ? ['售价', '商品排序'] : [];
    const tasks = ['企迈门店商品', ...(operation === 'sync' || operation === 'delete' ? ['美团外卖平台', '淘宝闪购平台'] : [])].map((target, index) => ({
      id: `${id}-${index + 1}`, type: index ? 'platform' as const : 'qimai' as const, target,
      channels: index ? [index === 1 ? '美团外卖' : '淘宝闪购'] : ['POS', '小程序堂食'],
      status: mode !== 'now' ? 'pending' as const : index === 2 ? 'failed' as const : 'success' as const,
      progress: mode !== 'now' ? 0 : 100, productCount: 2, skuCount: 2, storeCount: 2,
      successCount: mode !== 'now' || index === 2 ? 0 : 4, failedCount: mode === 'now' && index === 2 ? 4 : 0, waitingCount: 0,
      startedAt: mode === 'now' ? '2026-10-30 09:05:00' : '', finishedAt: mode === 'now' ? '2026-10-30 09:06:12' : undefined,
      ...(mode === 'now' && index === 2 ? { error: '演示：平台授权已失效，对应商品未删除。' } : {}),
    }));
    const batch: PublishBatch = {
      id, title: names[operation], action: { sync: '发布商品至门店', batch: '批量修改商品资料', copy: '门店商品复制', delete: '删除门店商品' }[operation],
      sourceType: operation === 'copy' || operation === 'delete' ? '门店商品' : '渠道商品库', sourceName: operation === 'copy' ? '上海静安店' : '品牌默认商品库',
      snapshot: '本地演示样例', channels: ['POS', '小程序堂食', ...(tasks.length > 1 ? ['美团外卖', '淘宝闪购'] : [])],
      storeScope: demoStores.join('、'), storeCount: 2, productCount: 2, skuCount: 2, status: mode !== 'now' ? 'pending' : operation === 'delete' ? 'partial' : 'success',
      createdAt: '2026-10-30 09:00:00', creator: '企迈静静', executionMode: mode,
      scheduledAt: mode === 'scheduled' ? new Date(Date.now() + 86400000).toLocaleDateString('sv-SE') + 'T06:00' : undefined, remark, tasks,
      configuration: { operation, source: { type: 'demo', name: operation === 'copy' ? '上海静安店' : '品牌默认商品库' }, products: demoProducts, fields, demoSource: true,
        overrides: operation === 'sync' ? { 'demo-latte': { 售价: 18 } } : operation === 'batch' ? { 'demo-latte': { 售价: 19, 商品排序: 0 }, 'demo-tea': { 售价: 16, 商品排序: 1 } } : {},
        settings: operation === 'copy' ? [{ label: '来源门店', value: '上海静安店' }, { label: '目标门店', value: '杭州滨江店' }] : operation === 'delete' ? [{ label: '删除范围', value: '企迈及对应平台商品' }, { label: '恢复方式', value: '无法一键撤销，恢复售卖需重新建品；保留历史记录' }] : [{ label: '相同商品', value: '合并到门店商品' }],
      },
    };
    batch.details = tasks.flatMap(task => demoStores.flatMap((storeName, storeIndex) => demoProducts.map(product => ({
      id: `${task.id}-${storeIndex}-${product.id}`, taskId: task.id, taskType: task.type, productName: product.name, productId: product.id,
      skuName: product.skus[0].name, skuId: product.skus[0].id, storeName, storeId: `demo-store-${storeIndex}`, channel: task.channels[0],
      action: batch.action, fields, status: task.status, finishedAt: task.finishedAt || '', error: task.error,
    }))));
    return batch;
  };
  return [make('DEMO-SYNC-001', 'sync', '周末上新；生椰拿铁按活动价 18 元下发', 'scheduled'), make('DEMO-BATCH-002', 'batch', '华东试点价格调整，保留其他属性', 'manual'), make('DEMO-COPY-003', 'copy', '杭州新店开业，复制静安店商品配置', 'now'), make('DEMO-DELETE-004', 'delete', '下市商品清理，核对平台删除结果', 'now')];
}
