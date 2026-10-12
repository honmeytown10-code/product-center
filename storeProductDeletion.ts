import type { PublishBatch } from './components/web/WebPublishRecords';
import { isTakeoutChannel, takeoutOperationPlan } from './takeoutSync';

export type DeleteTarget = { id: string; productId: string; name: string; storeId: string; storeName: string; channel: string; type: string };
export type DeleteFacts = { references: string[]; referencesVerified: boolean; authorized: boolean; actionAllowed: boolean; mappingOwned: boolean; managed: boolean; pendingWrite: boolean };
export type DeletePolicy = 'qimai_only' | 'qimai_and_platform';
export const deletionChannelName = (id: string) => ({ meituan: '美团外卖', taobao: '淘宝闪购', jd: '京东外卖', pos: 'POS', mini_dine: '小程序堂食', mini_take: '小程序外卖', meituan_dine: '美团在线点', douyin_dine: '抖音在线点', eleme: '淘宝闪购' }[id] || id);
export const normalizeDeletionChannel = (id: string) => id === 'eleme' ? 'taobao' : id;
export function removeDeletedTargets<T extends { id: string; channels: string[] }>(records: T[], targets: DeleteTarget[]): T[] {
  const ids = new Set(targets.map(t => t.id));
  return records.map(record => ({ ...record, channels: record.channels.filter(channel => !ids.has(`${record.id}:${channel}`)) })).filter(record => record.channels.length > 0);
}
export function checkStoreDeletion(target: DeleteTarget, policy: DeletePolicy, facts?: DeleteFacts): string[] {
  if (!facts) return ['尚未核验权限、引用与映射，请重新检查。'];
  const errors: string[] = [];
  if (!facts.actionAllowed) errors.push('没有该门店渠道的删除权限。');
  if (!facts.referencesVerified) errors.push('引用关系尚未核验，不能删除。');
  if (facts.references.length) errors.push(`仍被引用：${facts.references.join('、')}。请先处理关联，不会自动拆解套餐或删除共享对象。`);
  if (facts.pendingWrite) errors.push('同一对象还有未完成的发布或经营任务，请取消或等待任务完成后再检查。');
  if (policy === 'qimai_and_platform') {
    if (!isTakeoutChannel(normalizeDeletionChannel(target.channel))) errors.push('本次同步删除只支持美团外卖、淘宝闪购、京东外卖。');
    if (!facts.managed) errors.push('平台资料由平台维护，请先在平台处理，不从企迈删除平台对象。');
    if (!facts.authorized) errors.push('平台授权失效或门店未绑定，请恢复连接后重新检查。');
    if (!facts.mappingOwned) errors.push('没有已核验的企迈管理映射，不能按名称匹配删除平台商品。');
  }
  return errors;
}

let deleteSequence = 0;
export function createStoreDeletionBatch(targets: DeleteTarget[], policy: DeletePolicy, outcomes: Record<string, 'success' | 'waiting' | 'failed'>): PublishBatch {
  if (!targets.length || new Set(targets.map(t => t.id)).size !== targets.length) throw new Error('删除对象必须非空且不能重复');
  if (targets.some(t => !outcomes[t.id])) throw new Error('每个对象都需要明确执行结果');
  const id = `DELETE-${Date.now()}-${++deleteSequence}`;
  const now = new Date().toLocaleString('sv-SE', { hour12: false });
  const success = targets.filter(t => outcomes[t.id] === 'success').length;
  const waiting = targets.filter(t => outcomes[t.id] === 'waiting').length;
  const failed = targets.length - success - waiting;
  const details: NonNullable<PublishBatch['details']> = targets.flatMap(target => (policy === 'qimai_only' ? ['qimai'] as const : ['qimai', 'platform'] as const).map(taskType => ({
    id: `${id}-${target.id}-${taskType}`, taskType, productName: target.name, productId: target.productId, skuName: '', skuId: '', storeName: target.storeName, storeId: target.storeId,
    channel: deletionChannelName(target.channel), action: taskType === 'qimai' ? '移除企迈门店渠道商品' : '删除对应平台商品', fields: ['门店渠道商品'], status: outcomes[target.id], finishedAt: outcomes[target.id] === 'waiting' ? '等待平台回查' : now,
    ...(outcomes[target.id] === 'failed' ? { error: '删除未完成，企迈对象与映射保留；按原任务范围重试。' } : {}),
  })));
  const tasks: PublishBatch['tasks'] = targets.flatMap(target => {
    const status = outcomes[target.id];
    const channel = normalizeDeletionChannel(target.channel);
    const common = { channels: [deletionChannelName(channel)], status, progress: status === 'waiting' ? 0 : 100, productCount: 1, skuCount: 0, storeCount: 1, successCount: status === 'success' ? 1 : 0, failedCount: status === 'failed' ? 1 : 0, waitingCount: status === 'waiting' ? 1 : 0, startedAt: now, ...(status !== 'waiting' ? { finishedAt: now } : {}) };
    const qimai = { ...common, id: `${id}-${target.id}-qimai`, type: 'qimai' as const, target: `${target.storeName} · ${target.name} · 移除企迈渠道商品`, waitingReason: policy === 'qimai_and_platform' ? '平台删除尚未确认，保留企迈商品及有效映射。' : '仅移除所选企迈门店渠道商品。', ...(status === 'failed' ? { error: '平台删除未完成，企迈商品保留；恢复连接后按原快照重试。' } : {}) };
    if (policy === 'qimai_only') return [qimai];
    return [qimai, { ...common, id: `${id}-${target.id}-platform`, type: 'platform' as const, target: `${target.storeName} · ${target.name} · 删除平台商品`, waitingReason: isTakeoutChannel(channel) ? `${takeoutOperationPlan(channel, 'delete')}；超时先回查，禁止换外码重建。` : '', ...(status === 'failed' ? { error: '演示：平台接口失败。保留原任务快照和映射，不能当成删除成功。' } : {}) }];
  });
  return { id, recordType: 'store_publish', details, title: '删除门店商品（本地演示）', action: '删除门店商品', sourceType: '门店商品', sourceName: '已选择门店渠道商品', snapshot: JSON.stringify({ policy, targets, audit: '保留历史映射、外码与审计，不连带删除共享对象。' }), channels: [...new Set(targets.map(t => deletionChannelName(t.channel)))], storeScope: [...new Set(targets.map(t => t.storeName))].join('、'), storeCount: new Set(targets.map(t => t.storeId)).size, productCount: new Set(targets.map(t => t.productId)).size, skuCount: 0, status: waiting ? success || failed ? 'partial' : 'running' : failed ? success ? 'partial' : 'failed' : 'success', createdAt: now, creator: '当前用户', tasks };
}
