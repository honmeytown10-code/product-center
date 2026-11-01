import assert from 'node:assert/strict';
import { executeLocalTask, pendingTask, characterCount } from '../components/web/taskModel.ts';
const fields = { '商品名称': '创建时名称', '售价': 20, '排序': 2, '开关': true, '说明': '原说明' };
const batch = {
  id: 'test', tasks: [{ id: 'q', type: 'qimai', target: '企迈', channels: ['POS'], status: 'success', startedAt: 'old', successCount: 1, failedCount: 0, waitingCount: 0 }],
  details: [{ id: 'row', taskId: 'q', taskType: 'qimai', productId: 'p', channel: 'POS', status: 'success' }],
  configuration: { products: [{ id: 'p', name: '商品', skus: [] }], operation: 'sync', fields: Object.keys(fields), source: { type: 'master', name: '主档' }, overrides: { p: { '售价': 18, '排序': 0, '开关': false, '说明': '' } } },
  executionMode: 'manual', remark: '测试备注',
};
const pending = pendingTask(batch);
assert.equal(pending.status, 'pending'); assert.equal(pending.tasks[0].startedAt, ''); assert.equal(pending.tasks[0].waitingCount, 0);
const executed = executeLocalTask(pending, () => ({ ...fields, '商品名称': '执行时最新名称', '售价': 25 }));
const result = executed.details[0].executedValues;
assert.equal(result['商品名称'], '执行时最新名称'); assert.equal(result['售价'], 18);
assert.equal(result['排序'], 0); assert.equal(result['开关'], false); assert.equal(result['说明'], '');
assert.equal(executed.remark, '测试备注'); assert.equal(executed.status, 'success'); assert(executed.executedAt);
const failed = executeLocalTask(pending, () => undefined);
assert.equal(failed.status, 'failed'); assert.match(failed.details[0].error, /来源商品已删除/);
const retry = executeLocalTask({ ...executed, details: [...executed.details, { ...executed.details[0], id: 'failed', status: 'failed' }] }, () => ({ ...fields, '商品名称': '重试名称' }), 'q', true);
assert.equal(retry.details[0].executedValues['商品名称'], '执行时最新名称'); assert.equal(retry.details[1].executedValues['商品名称'], '重试名称');
assert.equal(characterCount('中A😀'), 3);
console.log('Task model: 16 assertions passed.');
