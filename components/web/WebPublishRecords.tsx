import { WebTaskRecords } from './WebTaskRecords';
import type { ExecutionMode, TaskConfiguration, FieldValues } from './taskModel';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

export type BatchStatus = 'success' | 'running' | 'partial' | 'failed' | 'pending';
export type TaskStatus = 'success' | 'running' | 'waiting' | 'failed' | 'pending';
type TaskType = 'qimai' | 'platform';
type RecordType = 'store_publish' | 'douyin_standard' | 'douyin_addon' | 'meituan_brand';
export type RecordView = 'all' | 'qimai' | 'platform';
type PlatformObjectType = 'brand_product' | 'addon' | 'store_product';

export type PublishTask = {
  id: string;
  type: TaskType;
  target: string;
  channels: string[];
  status: TaskStatus;
  progress: number;
  productCount: number;
  skuCount: number;
  storeCount: number;
  successCount: number;
  failedCount: number;
  waitingCount: number;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  waitingReason?: string;
};

export type PublishBatch = {
  remark?: string;
  executionMode?: ExecutionMode;
  scheduledAt?: string;
  executedAt?: string;
  configuration?: TaskConfiguration;
  recordType?: RecordType;
  id: string;
  title: string;
  action: string;
  sourceType: string;
  sourceName: string;
  snapshot: string;
  channels: string[];
  storeScope: string;
  storeCount: number;
  productCount: number;
  skuCount: number;
  status: BatchStatus;
  createdAt: string;
  creator: string;
  tasks: PublishTask[];
  details?: TaskExecutionDetail[];
  fieldSnapshots?: TaskFieldSnapshot[];
};

type PlatformTaskRecord = {
  task: PublishTask;
  batch: PublishBatch;
  platform: string;
  objectType: PlatformObjectType;
  triggerType: 'direct' | 'qimai_batch';
};

type TaskFieldSnapshot = {
  name: string;
  mode: '修改' | '覆盖' | '同步';
  before?: string;
  after?: string;
};

export type TaskExecutionDetail = {
  taskId?: string;
  executedValues?: FieldValues;
  id: string;
  taskType?: TaskType;
  productName: string;
  productId: string;
  skuName: string;
  skuId: string;
  storeName: string;
  storeId: string;
  channel: string;
  action: string;
  fields: string[];
  status: TaskStatus;
  finishedAt: string;
  error?: string;
};

export type MasterChannelSyncRecord = {
  id: string;
  title: string;
  sourceName: string;
  catalogNames: string[];
  fieldNames: string[];
  productCount: number;
  createdAt: string;
};

const batches: PublishBatch[] = [
  {
    recordType: 'meituan_brand',
    id: 'MBS202609100006',
    title: '美团在线点品牌商品同步',
    action: '创建或更新美团品牌商品',
    sourceType: '渠道商品库',
    sourceName: '在线点商品库',
    snapshot: '在线点商品库 V20260910.2',
    channels: ['美团在线点'],
    storeScope: '品牌级同步，不涉及门店',
    storeCount: 0,
    productCount: 9,
    skuCount: 18,
    status: 'success',
    createdAt: '2026-09-10 15:18:06',
    creator: '周镇',
    tasks: [{
      id: 'MBS202609100006', type: 'platform', target: '美团在线点品牌商品', channels: ['美团在线点'], status: 'success', progress: 100,
      productCount: 9, skuCount: 18, storeCount: 0, successCount: 9, failedCount: 0, waitingCount: 0,
      startedAt: '2026-09-10 15:18:08', finishedAt: '2026-09-10 15:19:21',
    }],
  },
  {
    recordType: 'store_publish',
    id: 'PB202608290031',
    title: '美团在线点新品下发',
    action: '发布商品至门店',
    sourceType: '商品模板',
    sourceName: '华东门店新品模板',
    snapshot: '华东门店新品模板 V20260829.5',
    channels: ['美团在线点'],
    storeScope: '上海与杭州试点门店',
    storeCount: 18,
    productCount: 6,
    skuCount: 14,
    status: 'running',
    createdAt: '2026-08-29 16:42:08',
    creator: '周镇',
    tasks: [
      {
        id: 'QM202608290031',
        type: 'qimai',
        target: '生成门店商品（美团在线点渠道）',
        channels: ['美团在线点'],
        status: 'success',
        progress: 100,
        productCount: 6,
        skuCount: 14,
        storeCount: 18,
        successCount: 252,
        failedCount: 0,
        waitingCount: 0,
        startedAt: '2026-08-29 16:42:10',
        finishedAt: '2026-08-29 16:43:19',
      },
      {
        id: 'MTD202608290031',
        type: 'platform',
        target: '创建或更新美团门店商品',
        channels: ['美团在线点'],
        status: 'running',
        progress: 72,
        productCount: 6,
        skuCount: 14,
        storeCount: 18,
        successCount: 181,
        failedCount: 0,
        waitingCount: 71,
        startedAt: '2026-08-29 16:43:21',
      },
    ],
  },
  {
    recordType: 'douyin_standard',
    id: 'DS202608190012',
    title: '抖音在线点标品同步',
    action: '创建并提交品牌标品审核',
    sourceType: '渠道商品库',
    sourceName: '在线点商品库',
    snapshot: '在线点商品库 V20260819.4',
    channels: ['抖音在线点'],
    storeScope: '品牌级同步，不涉及门店',
    storeCount: 0,
    productCount: 12,
    skuCount: 26,
    status: 'running',
    createdAt: '2026-08-19 15:26:18',
    creator: '周镇',
    tasks: [{
      id: 'DYS202608190012', type: 'platform', target: '抖音在线点标品', channels: ['抖音在线点'], status: 'running', progress: 58,
      productCount: 12, skuCount: 26, storeCount: 0, successCount: 5, failedCount: 0, waitingCount: 7,
      startedAt: '2026-08-19 15:26:20',
    }],
  },
  {
    recordType: 'douyin_addon',
    id: 'DA202608190008',
    title: '抖音在线点加料品同步',
    action: '创建或更新品牌加料品',
    sourceType: '渠道商品属性',
    sourceName: '抖音在线点加料品',
    snapshot: '抖音加料品 V20260819.2',
    channels: ['抖音在线点'],
    storeScope: '品牌级同步，不涉及门店',
    storeCount: 0,
    productCount: 8,
    skuCount: 0,
    status: 'partial',
    createdAt: '2026-08-19 14:08:06',
    creator: '周镇',
    tasks: [{
      id: 'DYA202608190008', type: 'platform', target: '抖音在线点加料品', channels: ['抖音在线点'], status: 'failed', progress: 100,
      productCount: 8, skuCount: 0, storeCount: 0, successCount: 6, failedCount: 2, waitingCount: 0,
      startedAt: '2026-08-19 14:08:08', finishedAt: '2026-08-19 14:09:33', error: '2 个加料品缺少抖音要求的售卖单位，请补充后重试。',
    }],
  },
  {
    recordType: 'store_publish',
    id: 'PB202607290018',
    title: '华东新品首发',
    action: '发布商品至门店',
    sourceType: '渠道商品库',
    sourceName: '外卖商品库',
    snapshot: '外卖商品库 V20260729.3',
    channels: ['小程序外卖', '美团外卖', '抖音在线点'],
    storeScope: '华东直营门店',
    storeCount: 86,
    productCount: 24,
    skuCount: 41,
    status: 'partial',
    createdAt: '2026-07-29 14:32:18',
    creator: '王静',
    tasks: [
      {
        id: 'QM202607290018',
        type: 'qimai',
        target: '企迈侧门店渠道商品',
        channels: ['小程序外卖', '美团外卖', '抖音在线点'],
        status: 'success',
        progress: 100,
        productCount: 24,
        skuCount: 41,
        storeCount: 86,
        successCount: 7396,
        failedCount: 0,
        waitingCount: 0,
        startedAt: '2026-07-29 14:32:20',
        finishedAt: '2026-07-29 14:36:42',
      },
      {
        id: 'MT202607290018',
        type: 'platform',
        target: '美团外卖平台',
        channels: ['美团外卖'],
        status: 'success',
        progress: 100,
        productCount: 24,
        skuCount: 41,
        storeCount: 86,
        successCount: 3526,
        failedCount: 0,
        waitingCount: 0,
        startedAt: '2026-07-29 14:36:44',
        finishedAt: '2026-07-29 14:48:09',
      },
      {
        id: 'DY202607290018',
        type: 'platform',
        target: '抖音在线点平台',
        channels: ['抖音在线点'],
        status: 'failed',
        progress: 100,
        productCount: 24,
        skuCount: 41,
        storeCount: 86,
        successCount: 3478,
        failedCount: 48,
        waitingCount: 0,
        startedAt: '2026-07-29 14:36:45',
        finishedAt: '2026-07-29 14:50:16',
        error: '2 个商品的图片含平台不支持的营销文字，影响 48 条门店商品明细。',
      },
    ],
  },
  {
    recordType: 'store_publish',
    id: 'PB202607290017',
    title: '全国标准模板价格更新',
    action: '更新门店商品属性',
    sourceType: '商品模板',
    sourceName: '全国标准菜单',
    snapshot: '全国标准菜单 V20260729.2',
    channels: ['POS', '小程序堂食'],
    storeScope: '全国在营门店',
    storeCount: 1268,
    productCount: 12,
    skuCount: 18,
    status: 'success',
    createdAt: '2026-07-29 11:08:06',
    creator: '李明',
    tasks: [
      {
        id: 'QM202607290017',
        type: 'qimai',
        target: '企迈侧门店渠道商品',
        channels: ['POS', '小程序堂食'],
        status: 'success',
        progress: 100,
        productCount: 12,
        skuCount: 18,
        storeCount: 1268,
        successCount: 45648,
        failedCount: 0,
        waitingCount: 0,
        startedAt: '2026-07-29 11:08:08',
        finishedAt: '2026-07-29 11:21:33',
      },
    ],
  },
  {
    recordType: 'store_publish',
    id: 'PB202607290016',
    title: '在线点新品试点',
    action: '发布商品至门店',
    sourceType: '渠道商品库',
    sourceName: '在线点商品库',
    snapshot: '在线点商品库 V20260729.1',
    channels: ['美团在线点', '抖音在线点'],
    storeScope: '深圳试点门店',
    storeCount: 12,
    productCount: 8,
    skuCount: 14,
    status: 'running',
    createdAt: '2026-07-29 10:42:51',
    creator: '赵敏',
    tasks: [
      {
        id: 'QM202607290016',
        type: 'qimai',
        target: '企迈侧门店渠道商品',
        channels: ['美团在线点', '抖音在线点'],
        status: 'success',
        progress: 100,
        productCount: 8,
        skuCount: 14,
        storeCount: 12,
        successCount: 336,
        failedCount: 0,
        waitingCount: 0,
        startedAt: '2026-07-29 10:42:53',
        finishedAt: '2026-07-29 10:43:26',
      },
      {
        id: 'MD202607290016',
        type: 'platform',
        target: '美团在线点平台',
        channels: ['美团在线点'],
        status: 'success',
        progress: 100,
        productCount: 8,
        skuCount: 14,
        storeCount: 12,
        successCount: 168,
        failedCount: 0,
        waitingCount: 0,
        startedAt: '2026-07-29 10:43:28',
        finishedAt: '2026-07-29 10:45:39',
      },
      {
        id: 'DY202607290016',
        type: 'platform',
        target: '抖音在线点平台',
        channels: ['抖音在线点'],
        status: 'running',
        progress: 68,
        productCount: 8,
        skuCount: 14,
        storeCount: 12,
        successCount: 112,
        failedCount: 0,
        waitingCount: 56,
        startedAt: '2026-07-29 10:43:29',
      },
    ],
  },
  {
    recordType: 'store_publish',
    id: 'PB202607280063',
    title: '淘闪菜单批量发布',
    action: '批量发布模板商品',
    sourceType: '商品模板',
    sourceName: '华南外卖菜单',
    snapshot: '华南外卖菜单 V20260728.6',
    channels: ['淘宝闪购'],
    storeScope: '华南加盟门店',
    storeCount: 43,
    productCount: 36,
    skuCount: 62,
    status: 'failed',
    createdAt: '2026-07-28 18:26:14',
    creator: '陈晨',
    tasks: [
      {
        id: 'QM202607280063',
        type: 'qimai',
        target: '企迈侧门店渠道商品',
        channels: ['淘宝闪购镜像'],
        status: 'success',
        progress: 100,
        productCount: 36,
        skuCount: 62,
        storeCount: 43,
        successCount: 2666,
        failedCount: 0,
        waitingCount: 0,
        startedAt: '2026-07-28 18:26:16',
        finishedAt: '2026-07-28 18:28:02',
      },
      {
        id: 'TB202607280063',
        type: 'platform',
        target: '淘宝闪购平台',
        channels: ['淘宝闪购'],
        status: 'failed',
        progress: 100,
        productCount: 36,
        skuCount: 62,
        storeCount: 43,
        successCount: 0,
        failedCount: 2666,
        waitingCount: 0,
        startedAt: '2026-07-28 18:28:04',
        finishedAt: '2026-07-28 18:28:42',
        error: '平台授权已失效，43 家门店均未执行平台同步。',
      },
    ],
  },
];

const statusMeta: Record<BatchStatus | TaskStatus, { label: string; className: string }> = {
  pending: { label: '未执行', className: 'bg-slate-100 text-slate-600' },
  success: { label: '成功', className: 'bg-[#EAF8F1] text-[#008F4C]' },
  running: { label: '执行中', className: 'bg-[#EDF5FF] text-[#246BCE]' },
  partial: { label: '部分成功', className: 'bg-[#FFF4E5] text-[#C76600]' },
  failed: { label: '失败', className: 'bg-[#FFF0F0] text-[#D9363E]' },
  waiting: { label: '等待中', className: 'bg-[#F3F4F6] text-[#666]' },
};

const StatusTag: React.FC<{ status: BatchStatus | TaskStatus }> = ({ status }) => (
  <span className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded px-2 text-xs font-medium ${statusMeta[status].className}`}>
    {status === 'running' && <Clock3 size={13} className="mr-1" />}
    {status === 'success' && <CheckCircle2 size={13} className="mr-1" />}
    {(status === 'partial' || status === 'failed') && <AlertCircle size={13} className="mr-1" />}
    {statusMeta[status].label}
  </span>
);

const getTaskGroupStatus = (tasks: PublishTask[]): BatchStatus => {
  if (tasks.length === 0) return 'success';
  if (tasks.some(task => task.status === 'running' || task.status === 'waiting')) return 'running';
  const failedTasks = tasks.filter(task => task.status === 'failed');
  if (failedTasks.length === tasks.length) return tasks.some(task => task.successCount > 0) ? 'partial' : 'failed';
  if (failedTasks.length > 0) return 'partial';
  return 'success';
};

const getPlatformObjectType = (batch: PublishBatch): PlatformObjectType => {
  if (batch.recordType === 'douyin_addon') return 'addon';
  if (batch.recordType === 'douyin_standard' || batch.recordType === 'meituan_brand') return 'brand_product';
  return 'store_product';
};

const platformObjectMeta: Record<PlatformObjectType, { label: string; unit: string }> = {
  brand_product: { label: '品牌商品', unit: '商品' },
  addon: { label: '品牌加料', unit: '加料品' },
  store_product: { label: '门店商品', unit: '商品' },
};

const getSnapshotFieldNames = (snapshot: string) => {
  const raw = snapshot.includes('：') ? snapshot.split('：').slice(1).join('：') : '';
  return raw ? raw.split('、').map(item => item.trim()).filter(Boolean) : [];
};

const getTaskFieldSnapshots = (batch: PublishBatch, task: PublishTask): TaskFieldSnapshot[] => {
  if (batch.fieldSnapshots) return batch.fieldSnapshots;
  if (batch.action === '更新门店商品属性') {
    return [
      { name: '规格售价', mode: '修改', before: '门店当前售价', after: '按「全国标准菜单」模板售价更新' },
      { name: '售卖时间', mode: '修改', before: '门店当前售卖时间', after: '09:00–22:00' },
      { name: '前台分类', mode: '修改', before: '门店当前分类', after: '按模板分类更新' },
    ];
  }

  if (batch.action === '更新渠道商品资料') {
    const fields = getSnapshotFieldNames(batch.snapshot);
    return (fields.length ? fields : ['商品名称', '前台分类', '计量单位']).map(name => ({
      name,
      mode: '同步' as const,
      before: '渠道商品当前值',
      after: '商品主档快照值',
    }));
  }

  if (task.type === 'platform') {
    if (batch.recordType === 'douyin_addon') {
      return ['加料名称', '加料类型', '抖音商品类目', '加料价格'].map(name => ({ name, mode: '同步' as const }));
    }
    if (batch.recordType === 'douyin_standard') {
      return ['商品名称', '平台类目', '商品主图', '规格与 SKU', '规格售价', '不加价做法'].map(name => ({ name, mode: '同步' as const }));
    }
    if (batch.recordType === 'meituan_brand') {
      return ['商品名称', '平台类目', '商品图片', '规格与 SKU', '规格售价', '商品简述'].map(name => ({ name, mode: '同步' as const }));
    }
    return ['门店商品名称', 'SKU 与售价', '售卖时间', '包装费', '做法与加料关联'].map(name => ({ name, mode: '同步' as const }));
  }

  return [
    { name: '商品名称', mode: '覆盖' },
    { name: '前台分类', mode: '覆盖' },
    { name: '商品主图', mode: '覆盖' },
    { name: '规格与 SKU', mode: '覆盖' },
    { name: '规格售价', mode: '覆盖' },
    { name: '售卖时间', mode: '覆盖' },
    { name: '做法与加料', mode: '覆盖' },
  ];
};

const standardProducts = [
  { name: '手打柠檬茶', id: 'SPU100021', sku: '大杯 / 正常冰 / 正常糖', skuId: 'SKU10002101' },
  { name: '黑糖波波鲜奶', id: 'SPU100036', sku: '中杯 / 少冰 / 七分糖', skuId: 'SKU10003602' },
  { name: '超值双人套餐', id: 'SPU100088', sku: '双人套餐', skuId: 'SKU10008801' },
  { name: '生椰拿铁', id: 'SPU100052', sku: '大杯 / 热', skuId: 'SKU10005203' },
  { name: '葡萄冰茶', id: 'SPU100063', sku: '中杯 / 正常冰', skuId: 'SKU10006301' },
  { name: '茉莉奶绿', id: 'SPU100074', sku: '大杯 / 少冰', skuId: 'SKU10007402' },
];

const addonProducts = [
  { name: '椰果', id: 'ADD10001', sku: '标准份', skuId: 'ADD-SKU10001' },
  { name: '珍珠', id: 'ADD10002', sku: '标准份', skuId: 'ADD-SKU10002' },
  { name: '西柚粒', id: 'ADD10003', sku: '标准份', skuId: 'ADD-SKU10003' },
  { name: '爆爆珠', id: 'ADD10004', sku: '标准份', skuId: 'ADD-SKU10004' },
];

const taskStores = [
  { name: '上海静安嘉里中心店', id: 'SH001' },
  { name: '上海虹桥天地店', id: 'SH008' },
  { name: '杭州湖滨银泰店', id: 'HZ003' },
  { name: '深圳南山万象店', id: 'SZ001' },
  { name: '深圳福田卓悦店', id: 'SZ002' },
  { name: '广州天环广场店', id: 'GZ006' },
];

const buildTaskExecutionDetails = (
  batch: PublishBatch,
  task: PublishTask,
  fields: TaskFieldSnapshot[],
): TaskExecutionDetail[] => {
  if (batch.details) return batch.details.filter(detail => task.channels.includes(detail.channel) && (!detail.taskType || detail.taskType === task.type));
  const products = batch.recordType === 'douyin_addon' ? addonProducts : standardProducts;
  const isBrandLevel = task.storeCount === 0;
  const rowCount = isBrandLevel ? Math.min(Math.max(task.productCount, 4), 6) : 8;
  return Array.from({ length: rowCount }, (_, index) => {
    const product = products[index % products.length];
    const store = taskStores[index % taskStores.length];
    const channel = task.channels[index % task.channels.length] || batch.channels[0] || '企迈渠道';
    let rowStatus: TaskStatus = 'success';
    if (task.failedCount > 0 && index === rowCount - 2) rowStatus = 'failed';
    if (task.waitingCount > 0 && index === rowCount - 1) rowStatus = 'waiting';
    if (task.status === 'running' && task.waitingCount > 0 && index >= rowCount - 2) rowStatus = 'waiting';
    const error = rowStatus === 'failed'
      ? task.error || (task.type === 'platform' ? '平台类目校验未通过，请维护平台专属资料后重试。' : '目标门店商品已被其他任务更新，请刷新快照后重试。')
      : undefined;
    return {
      id: `${task.id}-${index + 1}`,
      productName: product.name,
      productId: product.id,
      skuName: product.sku,
      skuId: product.skuId,
      storeName: isBrandLevel ? '品牌级，不涉及门店' : store.name,
      storeId: isBrandLevel ? '--' : store.id,
      channel,
      action: batch.action,
      fields: fields.map(field => field.name),
      status: rowStatus,
      finishedAt: rowStatus === 'waiting' ? '等待执行' : task.finishedAt || task.startedAt,
      error,
    };
  });
};

const TaskRecordDetailPage: React.FC<{
  batch: PublishBatch;
  task: PublishTask;
  scope: 'qimai' | 'platform';
  onBack: () => void;
  onOpenRelated?: () => void;
  onRetry: () => void;
  notice?: string;
  onTaskChange?: (taskId: string) => void;
}> = ({ batch, task, scope, onBack, onOpenRelated, onRetry, notice, onTaskChange }) => {
  const fields = useMemo(() => getTaskFieldSnapshots(batch, task), [batch, task]);
  const details = useMemo(() => buildTaskExecutionDetails(batch, task, fields), [batch, fields, task]);
  const [keyword, setKeyword] = useState('');
  const [detailStatus, setDetailStatus] = useState<'all' | TaskStatus>('all');
  const [detailChannel, setDetailChannel] = useState('all');
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredDetails = details.filter(item => {
    const matchesKeyword = !normalizedKeyword || [item.productName, item.productId, item.skuName, item.skuId, item.storeName, item.storeId]
      .some(value => value.toLowerCase().includes(normalizedKeyword));
    return matchesKeyword
      && (detailStatus === 'all' || item.status === detailStatus)
      && (detailChannel === 'all' || item.channel === detailChannel);
  });
  const channels = Array.from(new Set(details.map(item => item.channel)));
  const totalDetailCount = task.successCount + task.failedCount + task.waitingCount;
  const objectUnit = batch.recordType === 'douyin_addon' ? '加料品' : '商品';
  const isBatchModify = batch.action === '更新门店商品属性';
  const isMasterChannelSync = batch.action === '更新渠道商品资料';
  const contentTitle = isBatchModify ? '本次修改内容' : isMasterChannelSync ? '本次同步字段' : scope === 'platform' ? '本次平台同步字段' : '目标已有商品时的覆盖字段';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F5F6F8]">
      {notice && <div className="absolute right-6 top-[76px] z-[120] rounded-md bg-[#1D2129] px-4 py-2.5 text-[13px] text-white shadow-lg">{notice}</div>}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} className="rounded p-1.5 text-[#4E5969] hover:bg-[#F2F3F5]" aria-label="返回任务列表"><ChevronLeft size={20} /></button>
          <div className="min-w-0">
            <div className="flex items-center gap-3"><h2 className="truncate text-base font-bold text-[#1D2129]">{task.target}</h2><StatusTag status={task.status} /></div>
            <div className="mt-0.5 text-xs text-[#86909C]">任务编号 {task.id} · 所属批次 {batch.id}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onOpenRelated && <button type="button" onClick={onOpenRelated} className="h-9 rounded border border-[#D9DDE3] bg-white px-4 text-sm text-[#4E5969] hover:bg-[#F7F8FA]">{scope === 'qimai' ? '查看关联平台任务' : '查看企迈同步批次'}</button>}
          {task.failedCount > 0 && <button type="button" onClick={onRetry} className="inline-flex h-9 items-center rounded bg-[#00B460] px-4 text-sm font-medium text-white hover:bg-[#009E55]"><RefreshCw size={14} className="mr-1.5" />重试失败项</button>}
        </div>
      </div>

      {onTaskChange && <nav className="flex shrink-0 flex-wrap gap-2 border-b border-[#E5E7EB] bg-white px-5 py-3" aria-label="同步任务各阶段">{batch.tasks.map(stage => <button key={stage.id} type="button" aria-pressed={task.id === stage.id} onClick={() => onTaskChange(stage.id)} className={`flex items-center gap-2 rounded border px-3 py-2 text-xs ${task.id === stage.id ? 'border-[#00B460] bg-[#EAF8F1] text-[#008F4C]' : 'border-[#E5E7EB] text-[#667085]'}`}><span>{stage.type === 'qimai' ? '企迈' : '平台'} · {stage.target}</span><StatusTag status={stage.status} /></button>)}</nav>}
      <div className="min-h-0 flex-1 overflow-auto p-5">
        <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-[#E3E6EA] bg-white">
          <div className="border-r border-[#EEEEEE] p-4"><div className="text-xs text-[#86909C]">数据来源</div><div className="mt-1 text-sm font-medium text-[#1D2129]">{batch.sourceType.replace('商品模板', '商品下发模板')} · {batch.sourceName}</div><div className="mt-1 text-xs text-[#86909C]">{batch.snapshot}</div></div>
          <div className="border-r border-[#EEEEEE] p-4"><div className="text-xs text-[#86909C]">执行范围</div><div className="mt-1 text-sm font-medium text-[#1D2129]">{batch.storeScope}</div><div className="mt-1 text-xs text-[#86909C]">{task.storeCount > 0 ? `${task.storeCount} 家门店 · ${task.channels.length} 个渠道` : '品牌级任务，不涉及门店'}</div></div>
          <div className="border-r border-[#EEEEEE] p-4"><div className="text-xs text-[#86909C]">对象规模</div><div className="mt-1 text-sm font-medium text-[#1D2129]">{task.productCount} 个{objectUnit}{task.skuCount > 0 ? ` · ${task.skuCount} 个 SKU` : ''}</div><div className="mt-1 text-xs text-[#86909C]">成功 {task.successCount} · 失败 {task.failedCount} · 等待 {task.waitingCount}</div></div>
          <div className="p-4"><div className="text-xs text-[#86909C]">创建信息</div><div className="mt-1 text-sm font-medium text-[#1D2129]">{batch.createdAt}</div><div className="mt-1 text-xs text-[#86909C]">操作人 {batch.creator}</div></div>
        </div>

        <section className="mt-4 rounded-lg border border-[#E3E6EA] bg-white p-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-[#1D2129]">{contentTitle}</h3>
              <p className="mt-1 text-xs leading-5 text-[#86909C]">
                {isBatchModify
                  ? '批量任务固定保存提交时的修改前值、修改后值和对象快照，重试不会读取后续变更。'
                  : isMasterChannelSync
                    ? '以下字段按提交时的商品主档快照更新至目标渠道商品库。'
                    : scope === 'platform'
                      ? '以下字段按平台接口口径生成请求快照；平台返回结果记录到每条商品明细。'
                      : '新建目标商品时写入完整快照；识别到相同来源商品时，仅覆盖下列字段，不覆盖门店独立经营值。'}
              </p>
            </div>
            <span className="shrink-0 text-xs text-[#86909C]">共 {fields.length} 个字段</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {fields.map(field => (
              <div key={field.name} className="rounded border border-[#E5E7EB] bg-[#FAFBFC] px-3 py-2 text-xs">
                <div className="flex items-center gap-2"><span className="font-medium text-[#1D2129]">{field.name}</span><span className="rounded bg-[#EAF8F1] px-1.5 py-0.5 text-[#008F4C]">{field.mode}</span></div>
                {(field.before || field.after) && <div className="mt-1 text-[#667085]">{field.before || '--'} <span className="mx-1 text-[#A0A7B2]">→</span> {field.after || '--'}</div>}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-lg border border-[#E3E6EA] bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#E8E8E8] p-4">
            <div className="mr-auto">
              <h3 className="text-sm font-bold text-[#1D2129]">执行明细</h3>
              <div className="mt-1 text-xs text-[#86909C]">按{batch.recordType === 'douyin_addon' ? '加料品' : '商品 / SKU'} × {task.storeCount > 0 ? '门店 × ' : ''}渠道记录本次执行结果</div>
            </div>
            <div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-[#999]" /><input value={keyword} onChange={event => setKeyword(event.target.value)} className="h-9 w-64 rounded border border-[#D9DDE3] pl-9 pr-3 text-sm outline-none focus:border-[#00B460]" placeholder="搜索商品、SKU 或门店" /></div>
            <select value={detailChannel} onChange={event => setDetailChannel(event.target.value)} className="h-9 w-36 rounded border border-[#D9DDE3] bg-white px-3 text-sm text-[#555]"><option value="all">全部渠道</option>{channels.map(channel => <option key={channel} value={channel}>{channel}</option>)}</select>
            <select value={detailStatus} onChange={event => setDetailStatus(event.target.value as 'all' | TaskStatus)} className="h-9 w-32 rounded border border-[#D9DDE3] bg-white px-3 text-sm text-[#555]"><option value="all">全部结果</option><option value="success">成功</option><option value="failed">失败</option><option value="waiting">等待中</option><option value="running">执行中</option></select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] table-fixed text-left text-sm">
              <thead className="h-11 bg-[#F5F6F8] text-[#667085]"><tr><th className="w-[210px] px-4 font-medium">{batch.recordType === 'douyin_addon' ? '加料品' : '商品 / SKU'}</th><th className="w-[180px] px-4 font-medium">门店</th><th className="w-[135px] px-4 font-medium">渠道</th><th className="w-[150px] px-4 font-medium">执行动作</th><th className="px-4 font-medium">修改 / 覆盖字段</th><th className="w-[190px] px-4 font-medium">执行结果</th><th className="w-[145px] px-4 font-medium">完成时间</th></tr></thead>
              <tbody>
                {filteredDetails.map(item => (
                  <tr key={item.id} className="border-t border-[#EEEEEE] align-top text-[#4E5969]">
                    <td className="px-4 py-3"><div className="font-medium text-[#1D2129]">{item.productName}</div><div className="mt-1 text-xs text-[#86909C]">{item.productId}</div><div className="mt-1 truncate text-xs text-[#667085]" title={`${item.skuName} · ${item.skuId}`}>{item.skuName} · {item.skuId}</div></td>
                    <td className="px-4 py-3"><div className="font-medium text-[#1D2129]">{item.storeName}</div><div className="mt-1 text-xs text-[#86909C]">{item.storeId}</div></td>
                    <td className="px-4 py-3"><span className="rounded border border-[#E1E4E8] px-2 py-1 text-xs">{item.channel}</span></td>
                    <td className="px-4 py-3 text-xs leading-5">{item.action}</td>
                    <td className="px-4 py-3"><div className="line-clamp-2 text-xs leading-5" title={item.fields.join('、')}>{item.fields.join('、')}</div></td>
                    <td className="px-4 py-3"><StatusTag status={item.status} />{item.error && <div className="mt-1 text-xs leading-5 text-[#D9363E]" title={item.error}>{item.error}</div>}{item.status === 'failed' && <button type="button" onClick={onRetry} className="mt-1 text-xs font-medium text-[#D9363E] hover:text-[#B4232A]">重试该明细</button>}</td>
                    <td className="px-4 py-3 text-xs leading-5">{item.finishedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDetails.length === 0 && <div className="flex h-40 flex-col items-center justify-center text-sm text-[#86909C]"><FileText size={30} className="mb-2 text-[#C9CDD3]" />暂无符合条件的执行明细</div>}
          <div className="flex h-12 items-center justify-between border-t border-[#E8E8E8] px-4 text-xs text-[#667085]"><span>共 {totalDetailCount} 条执行明细，当前页展示 {filteredDetails.length} 条</span><span>总结果：成功 {task.successCount} · 失败 {task.failedCount} · 等待 {task.waitingCount}</span></div>
        </section>
      </div>
    </div>
  );
};

export const WebPublishRecords: React.FC<{
  masterChannelSyncRecords?: MasterChannelSyncRecord[];
  extraBatches?: PublishBatch[];
  view?: RecordView;
  onViewChange?: (view: RecordView) => void;
}> = ({ masterChannelSyncRecords = [], extraBatches = [], view = 'all', onViewChange }) => {
  const allBatches = useMemo<PublishBatch[]>(() => {
    const masterChannelBatches = masterChannelSyncRecords.map(record => ({
      id: record.id,
      title: record.title,
      action: '更新渠道商品资料',
      sourceType: '商品主档',
      sourceName: record.sourceName,
      snapshot: `字段快照：${record.fieldNames.join('、')}`,
      channels: record.catalogNames,
      storeScope: `${record.catalogNames.length} 个渠道商品库`,
      storeCount: 0,
      productCount: record.productCount,
      skuCount: record.productCount,
      status: 'running' as BatchStatus,
      createdAt: record.createdAt,
      creator: '企迈静静',
      tasks: [{
        id: `TASK-${record.id}`,
        type: 'qimai' as TaskType,
        target: '渠道商品库资料',
        channels: record.catalogNames,
        status: 'running' as TaskStatus,
        progress: 36,
        productCount: record.productCount,
        skuCount: record.productCount,
        storeCount: 0,
        successCount: 0,
        failedCount: 0,
        waitingCount: record.productCount * Math.max(record.catalogNames.length, 1),
        startedAt: record.createdAt,
      }],
    }));
    return [...extraBatches, ...masterChannelBatches, ...batches];
  }, [extraBatches, masterChannelSyncRecords]);
  return <WebTaskRecords batches={allBatches} view={view as RecordView} onViewChange={onViewChange} legacyDetails={buildTaskExecutionDetails} />;
};
