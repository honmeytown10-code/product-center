// Prototype-only persistence. Production must supply identity, permissions and task APIs.
export const DEMO_STORAGE_KEY = 'product-center:mapping-alert-demo:v2';
export type DemoScenario = 'normal' | 'read-only' | 'exempt' | 'conflict' | 'error' | 'expired' | 'library-error';
export interface SkuPair {
  storeId: string;
  storeName: string;
  channelId: string;
  platformSkuId: string;
  platformName: string;
  platformSpec: string;
  qimaiSkuId: string;
  qimaiName: string;
  qimaiSpec: string;
}
export interface DemoTaskRow extends SkuPair {
  status: 'waiting' | 'success' | 'failed';
  reason?: string;
  retried?: boolean;
}
export interface DemoTask {
  id: string;
  alertId: string;
  createdAt: number;
  rows: DemoTaskRow[];
  // Each refresh advances the illustrative task, not a live production job.
  round: number;
}
export interface DistributionTask {
  id: string;
  alertId: string;
  productId: string;
  productName: string;
  libraryName: string;
  skuIds: string[];
  orderSkuId: string;
  orderTradeMark?: string;
  matchedSkuId?: string;
  storeId: string;
  storeName: string;
  channelId: string;
  channelName: string;
  status: 'waiting' | 'success' | 'failed';
  createdAt: number;
  reason?: string;
  retried?: boolean;
}
export interface DemoState {
  version: 2;
  relations: Record<string, SkuPair>;
  tasks: DemoTask[];
  distributions: DistributionTask[];
  mappingRepairs: Record<string, SkuPair>;
}
export const emptyDemoState = (): DemoState => ({ version: 2, relations: {}, tasks: [], distributions: [], mappingRepairs: {} });
export const pairKey = (pair: Pick<SkuPair, 'storeId' | 'channelId' | 'platformSkuId'>) =>
  JSON.stringify([pair.storeId, pair.channelId, pair.platformSkuId]);

function validPair(value: unknown): value is SkuPair {
  return !!value && typeof value === 'object' && ['storeId', 'storeName', 'channelId', 'platformSkuId', 'platformName', 'platformSpec', 'qimaiSkuId', 'qimaiName', 'qimaiSpec']
    .every(key => typeof (value as Record<string, unknown>)[key] === 'string');
}
export function readDemoState(): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return emptyDemoState();
    const value = JSON.parse(raw);
    if (value.version !== 2 || !value.relations || !Array.isArray(value.tasks)) return emptyDemoState();
    if (!Object.values(value.relations).every(validPair)) return emptyDemoState();
    if (!value.tasks.every((task: DemoTask) => typeof task.id === 'string' && typeof task.alertId === 'string'
      && typeof task.createdAt === 'number' && typeof task.round === 'number' && Array.isArray(task.rows)
      && task.rows.length > 0 && task.rows.every(row => validPair(row) && ['waiting', 'success', 'failed'].includes(row.status)))) return emptyDemoState();
    const distributions = value.distributions ?? [];
    if (!Array.isArray(distributions) || !distributions.every(task =>
      ['id', 'alertId', 'productId', 'productName', 'libraryName', 'orderSkuId', 'storeId', 'storeName', 'channelId', 'channelName'].every(key => typeof task[key] === 'string')
      && (task.orderTradeMark === undefined || typeof task.orderTradeMark === 'string')
      && (task.matchedSkuId === undefined || typeof task.matchedSkuId === 'string')
      && Array.isArray(task.skuIds) && task.skuIds.length > 0 && task.skuIds.every((id: unknown) => typeof id === 'string')
      && ['waiting', 'success', 'failed'].includes(task.status) && typeof task.createdAt === 'number')) return emptyDemoState();
    const mappingRepairs = value.mappingRepairs ?? {};
    if (!mappingRepairs || typeof mappingRepairs !== 'object' || Array.isArray(mappingRepairs) || !Object.values(mappingRepairs).every(validPair)) return emptyDemoState();
    return { ...value, distributions, mappingRepairs };
  } catch { return emptyDemoState(); }
}
export function writeDemoState(value: DemoState): boolean {
  try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function taskCounts(task: DemoTask) {
  return {
    success: task.rows.filter(row => row.status === 'success').length,
    failed: task.rows.filter(row => row.status === 'failed').length,
    waiting: task.rows.filter(row => row.status === 'waiting').length,
  };
}
export function taskLabel(task: DemoTask): string {
  const counts = taskCounts(task);
  return counts.waiting ? '处理中' : counts.failed ? (counts.success ? '部分失败' : '失败') : '已完成';
}
export function advanceDemoTask(state: DemoState, id: string): DemoState {
  const task = state.tasks.find(item => item.id === id);
  if (!task || !task.rows.some(row => row.status === 'waiting')) return state;
  const relations = { ...state.relations };
  const round = task.round + 1;
  const rows = task.rows.map((row, index): DemoTaskRow => {
    if (row.status !== 'waiting' || (round === 1 && index > 1)) return row;
    const existing = relations[pairKey(row)];
    if (existing && existing.qimaiSkuId !== row.qimaiSkuId) return { ...row, status: 'failed', reason: '已有其他绑定，未覆盖。请到 PC 核对。' };
    if (row.storeId === 'store-8' && !row.retried) return { ...row, status: 'failed', reason: '平台请求超时，可重试。' };
    relations[pairKey(row)] = row;
    return { ...row, status: 'success', reason: undefined };
  });
  return { ...state, relations, tasks: state.tasks.map(item => item.id === id ? { ...task, rows, round } : item) };
}
