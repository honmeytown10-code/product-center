import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

type BatchStatus = 'success' | 'running' | 'partial' | 'failed';
type TaskStatus = 'success' | 'running' | 'waiting' | 'failed';
type TaskType = 'qimai' | 'platform';
type RecordType = 'store_publish' | 'douyin_standard' | 'douyin_addon';

type PublishTask = {
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
};

type PublishBatch = {
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
};

const batches: PublishBatch[] = [
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
        channels: ['小程序外卖', '美团外卖镜像', '抖音在线点镜像'],
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
        channels: ['美团在线点镜像', '抖音在线点镜像'],
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
  success: { label: '成功', className: 'bg-[#EAF8F1] text-[#008F4C]' },
  running: { label: '执行中', className: 'bg-[#EDF5FF] text-[#246BCE]' },
  partial: { label: '部分成功', className: 'bg-[#FFF4E5] text-[#C76600]' },
  failed: { label: '失败', className: 'bg-[#FFF0F0] text-[#D9363E]' },
  waiting: { label: '等待中', className: 'bg-[#F3F4F6] text-[#666]' },
};

const StatusTag: React.FC<{ status: BatchStatus | TaskStatus }> = ({ status }) => (
  <span className={`inline-flex h-6 items-center rounded px-2 text-xs font-medium ${statusMeta[status].className}`}>
    {status === 'running' && <Clock3 size={13} className="mr-1" />}
    {status === 'success' && <CheckCircle2 size={13} className="mr-1" />}
    {(status === 'partial' || status === 'failed') && <AlertCircle size={13} className="mr-1" />}
    {statusMeta[status].label}
  </span>
);

export const WebPublishRecords: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | BatchStatus>('all');
  const [channel, setChannel] = useState('all');
  const [recordType, setRecordType] = useState<'all' | RecordType>('all');
  const [expandedIds, setExpandedIds] = useState<string[]>([batches[0].id]);
  const [detailBatch, setDetailBatch] = useState<PublishBatch | null>(null);
  const [notice, setNotice] = useState('');

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const channels = useMemo(
    () => Array.from(new Set(batches.flatMap(batch => batch.channels))),
    [],
  );

  const filteredBatches = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return batches.filter(batch => {
      const matchesKeyword = !normalizedKeyword
        || [batch.id, batch.title, batch.sourceName, batch.creator].some(value => value.toLowerCase().includes(normalizedKeyword));
      const matchesStatus = status === 'all' || batch.status === status;
      const matchesChannel = channel === 'all' || batch.channels.includes(channel);
      const matchesRecordType = recordType === 'all' || batch.recordType === recordType;
      return matchesKeyword && matchesStatus && matchesChannel && matchesRecordType;
    });
  }, [channel, keyword, recordType, status]);

  const toggleBatch = (batchId: string) => {
    setExpandedIds(current => (
      current.includes(batchId)
        ? current.filter(id => id !== batchId)
        : [...current, batchId]
    ));
  };

  const renderTaskTable = (batch: PublishBatch) => (
    <div className="border-t border-[#E8E8E8] bg-[#FAFBFC] px-12 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-[#333]">任务明细</span>
          <span className="ml-2 text-xs text-[#999]">{batch.storeCount > 0 ? '企迈侧渠道合并执行，三方平台按平台拆分任务' : '品牌级平台对象独立执行，不包含门店范围'}</span>
        </div>
        <span className="text-xs text-[#999]">来源快照：{batch.snapshot}</span>
      </div>
      <div className="overflow-hidden rounded border border-[#E8E8E8] bg-white">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="h-10 bg-[#F5F6F8] text-[#666]">
            <tr>
              <th className="w-[150px] px-4 font-medium">任务编号</th>
              <th className="w-[160px] px-4 font-medium">执行目标</th>
              <th className="px-4 font-medium">渠道范围</th>
              <th className="w-[130px] px-4 font-medium">对象范围</th>
              <th className="w-[160px] px-4 font-medium">执行结果</th>
              <th className="w-[150px] px-4 font-medium">开始 / 完成</th>
              <th className="w-[120px] px-4 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {batch.tasks.map(task => (
              <tr key={task.id} className="border-t border-[#EEEEEE] align-top text-[#555]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#333]">{task.id}</div>
                  <div className="mt-1 text-[#999]">{task.type === 'qimai' ? '企迈侧同步任务' : '三方平台同步任务'}</div>
                </td>
                <td className="px-4 py-3 font-medium text-[#333]">{task.target}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {task.channels.map(item => (
                      <span key={item} className="rounded border border-[#E4E7EB] bg-white px-1.5 py-0.5 text-[#666]">{item}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {batch.recordType === 'douyin_addon' ? (
                    <><div>{task.productCount} 个加料品</div><div className="mt-1 text-[#999]">品牌级</div></>
                  ) : batch.recordType === 'douyin_standard' ? (
                    <><div>{task.productCount} 个标品</div><div className="mt-1 text-[#999]">{task.skuCount} 个 SKU · 品牌级</div></>
                  ) : (
                    <><div>{task.storeCount} 家门店</div><div className="mt-1 text-[#999]">{task.skuCount} 个 SKU</div></>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusTag status={task.status} />
                    {task.status === 'running' && <span className="text-[#246BCE]">{task.progress}%</span>}
                  </div>
                  <div className="mt-2 text-[#777]">
                    成功 {task.successCount} · 失败 <span className={task.failedCount ? 'text-[#D9363E]' : ''}>{task.failedCount}</span>
                    {task.waitingCount > 0 && <> · 等待 {task.waitingCount}</>}
                  </div>
                  {task.error && <div className="mt-1 line-clamp-2 text-[#D9363E]">{task.error}</div>}
                </td>
                <td className="px-4 py-3 leading-5">
                  <div>{task.startedAt.slice(5)}</div>
                  <div className="text-[#999]">{task.finishedAt ? task.finishedAt.slice(5) : '尚未完成'}</div>
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setDetailBatch(batch)} className="mr-3 text-[#008F4C] hover:text-[#006E3A]">查看</button>
                  {task.failedCount > 0 && (
                    <button type="button" onClick={() => showNotice(`已为 ${task.target} 创建失败明细重试任务`)} className="inline-flex items-center text-[#D9363E] hover:text-[#B4232A]">
                      <RefreshCw size={13} className="mr-1" />重试
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F5F6F8]">
      {notice && <div className="absolute right-6 top-[76px] z-[120] rounded-md bg-[#1D2129] px-4 py-2.5 text-[13px] text-white shadow-lg">{notice}</div>}
      <div className="shrink-0 border-b border-[#E8E8E8] bg-white px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-[#999]" />
            <input
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              className="h-9 w-72 rounded border border-[#D9DDE3] pl-9 pr-3 text-sm outline-none focus:border-[#00B460]"
              placeholder="搜索任务编号、名称、来源或操作人"
            />
          </div>
          <select value={recordType} onChange={event => setRecordType(event.target.value as 'all' | RecordType)} className="h-9 w-44 rounded border border-[#D9DDE3] bg-white px-3 text-sm text-[#555] outline-none focus:border-[#00B460]">
            <option value="all">全部任务类型</option>
            <option value="store_publish">门店商品下发</option>
            <option value="douyin_standard">抖音标品同步</option>
            <option value="douyin_addon">抖音加料品同步</option>
          </select>
          <select value={status} onChange={event => setStatus(event.target.value as 'all' | BatchStatus)} className="h-9 w-36 rounded border border-[#D9DDE3] bg-white px-3 text-sm text-[#555] outline-none focus:border-[#00B460]">
            <option value="all">全部状态</option>
            <option value="running">执行中</option>
            <option value="partial">部分成功</option>
            <option value="failed">失败</option>
            <option value="success">成功</option>
          </select>
          <select value={channel} onChange={event => setChannel(event.target.value)} className="h-9 w-40 rounded border border-[#D9DDE3] bg-white px-3 text-sm text-[#555] outline-none focus:border-[#00B460]">
            <option value="all">全部渠道</option>
            {channels.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="button" onClick={() => showNotice(`已查询到 ${filteredBatches.length} 条同步记录`)} className="h-9 rounded bg-[#00B460] px-5 text-sm font-medium text-white hover:bg-[#009E55]">查询</button>
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setStatus('all');
              setChannel('all');
              setRecordType('all');
            }}
            className="h-9 rounded border border-[#D9DDE3] px-5 text-sm text-[#555] hover:bg-[#F7F8FA]"
          >
            重置
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        <div className="overflow-hidden rounded-lg border border-[#E3E6EA] bg-white">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="h-11 bg-[#F5F6F8] text-[#666]">
              <tr>
                <th className="w-10 px-3" />
                <th className="w-[215px] px-3 font-medium">任务记录</th>
                <th className="w-[170px] px-3 font-medium">数据来源</th>
                <th className="px-3 font-medium">同步范围</th>
                <th className="w-[130px] px-3 font-medium">对象规模</th>
                <th className="w-[105px] px-3 font-medium">状态</th>
                <th className="w-[150px] px-3 font-medium">创建信息</th>
                <th className="w-[130px] px-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map(batch => {
                const expanded = expandedIds.includes(batch.id);
                return (
                  <React.Fragment key={batch.id}>
                    <tr className="border-t border-[#EEEEEE] text-[#555] hover:bg-[#FCFDFC]">
                      <td className="px-3 py-4">
                        <button type="button" onClick={() => toggleBatch(batch.id)} aria-label={expanded ? '收起任务' : '展开任务'} className="text-[#777]">
                          {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <button type="button" onClick={() => toggleBatch(batch.id)} className="text-left">
                          <div className="font-bold text-[#222]">{batch.title}</div>
                          <div className="mt-1 text-xs text-[#999]">{batch.id} · {batch.action}</div>
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-medium text-[#333]">{batch.sourceType}</div>
                        <div className="mt-1 text-xs text-[#999]">{batch.sourceName}</div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          {batch.channels.map(item => <span key={item} className="rounded border border-[#E4E7EB] px-1.5 py-0.5 text-xs">{item}</span>)}
                        </div>
                        <div className="mt-2 text-xs text-[#999]">{batch.storeCount > 0 ? `${batch.storeScope} · ${batch.storeCount} 家门店` : batch.storeScope}</div>
                      </td>
                      <td className="px-3 py-4">
                        <div>{batch.productCount} 个{batch.recordType === 'douyin_addon' ? '加料品' : batch.recordType === 'douyin_standard' ? '标品' : '商品'}</div>
                        {batch.skuCount > 0 && <div className="mt-1 text-xs text-[#999]">{batch.skuCount} 个 SKU</div>}
                      </td>
                      <td className="px-3 py-4"><StatusTag status={batch.status} /></td>
                      <td className="px-3 py-4">
                        <div>{batch.createdAt}</div>
                        <div className="mt-1 text-xs text-[#999]">{batch.creator}</div>
                      </td>
                      <td className="px-3 py-4">
                        <button type="button" onClick={() => setDetailBatch(batch)} className="mr-3 inline-flex items-center text-[#008F4C] hover:text-[#006E3A]">
                          <Eye size={14} className="mr-1" />详情
                        </button>
                        {(batch.status === 'failed' || batch.status === 'partial') && (
                          <button type="button" onClick={() => showNotice(`已为 ${batch.id} 创建失败项重试任务`)} className="text-[#D9363E] hover:text-[#B4232A]">重试失败项</button>
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={8}>{renderTaskTable(batch)}</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filteredBatches.length === 0 && (
            <div className="flex h-56 flex-col items-center justify-center text-[#999]">
              <FileText size={34} className="mb-3 text-[#C9CDD3]" />
              <span>暂无符合条件的同步记录</span>
            </div>
          )}
          <div className="flex h-12 items-center justify-between border-t border-[#E8E8E8] px-4 text-sm text-[#777]">
            <span>共 {filteredBatches.length} 条同步记录</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled aria-label="上一页" className="h-8 w-8 cursor-not-allowed rounded border border-[#E1E4E8] text-[#AAA]">‹</button>
              <button type="button" disabled aria-current="page" className="h-8 w-8 rounded border border-[#00B460] bg-[#EAF8F1] font-medium text-[#008F4C]">1</button>
              <button type="button" disabled aria-label="下一页" title="当前演示数据仅一页" className="h-8 w-8 cursor-not-allowed rounded border border-[#E1E4E8] text-[#AAA]">›</button>
            </div>
          </div>
        </div>
      </div>

      {detailBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-8" role="dialog" aria-modal="true" aria-label="同步任务详情">
          <div className="flex max-h-[88vh] w-[1120px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E8E8E8] px-5">
              <div>
                <span className="font-bold text-[#222]">同步任务详情</span>
                <span className="ml-3 text-sm text-[#999]">{detailBatch.id}</span>
              </div>
              <button type="button" onClick={() => setDetailBatch(null)} className="rounded p-1 text-[#777] hover:bg-[#F2F3F5]" aria-label="关闭"><X size={20} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-5">
              <div className="grid grid-cols-4 gap-x-6 gap-y-4 rounded border border-[#E8E8E8] bg-[#FAFBFC] p-4 text-sm">
                <div><div className="text-xs text-[#999]">发布动作</div><div className="mt-1 font-medium text-[#333]">{detailBatch.action}</div></div>
                <div><div className="text-xs text-[#999]">数据来源</div><div className="mt-1 font-medium text-[#333]">{detailBatch.sourceType} · {detailBatch.sourceName}</div></div>
                <div><div className="text-xs text-[#999]">冻结快照</div><div className="mt-1 font-medium text-[#333]">{detailBatch.snapshot}</div></div>
                <div><div className="text-xs text-[#999]">批次状态</div><div className="mt-1"><StatusTag status={detailBatch.status} /></div></div>
                <div><div className="text-xs text-[#999]">同步范围</div><div className="mt-1 font-medium text-[#333]">{detailBatch.storeCount > 0 ? `${detailBatch.storeScope} · ${detailBatch.storeCount} 家` : detailBatch.storeScope}</div></div>
                <div><div className="text-xs text-[#999]">对象范围</div><div className="mt-1 font-medium text-[#333]">{detailBatch.productCount} 个{detailBatch.recordType === 'douyin_addon' ? '加料品' : detailBatch.recordType === 'douyin_standard' ? '标品' : '商品'}{detailBatch.skuCount > 0 ? ` · ${detailBatch.skuCount} 个 SKU` : ''}</div></div>
                <div><div className="text-xs text-[#999]">创建时间</div><div className="mt-1 font-medium text-[#333]">{detailBatch.createdAt}</div></div>
                <div><div className="text-xs text-[#999]">操作人</div><div className="mt-1 font-medium text-[#333]">{detailBatch.creator}</div></div>
              </div>

              <div className="mt-5">
                <h3 className="mb-3 font-bold text-[#333]">执行任务</h3>
                <div className="overflow-hidden rounded border border-[#E8E8E8]">
                  {detailBatch.tasks.map((task, index) => (
                    <div key={task.id} className={`grid grid-cols-[180px_180px_1fr_160px_170px] items-start gap-3 p-4 text-sm ${index ? 'border-t border-[#EEEEEE]' : ''}`}>
                      <div>
                        <div className="font-medium text-[#333]">{task.target}</div>
                        <div className="mt-1 text-xs text-[#999]">{task.id}</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {task.channels.map(item => <span key={item} className="rounded border border-[#E4E7EB] px-1.5 py-0.5 text-xs text-[#666]">{item}</span>)}
                      </div>
                      <div>
                        <div className="text-[#555]">成功 {task.successCount} · 失败 <span className={task.failedCount ? 'text-[#D9363E]' : ''}>{task.failedCount}</span> · 等待 {task.waitingCount}</div>
                        {task.error && (
                          <div className="mt-2 rounded bg-[#FFF5F5] px-3 py-2 text-xs leading-5 text-[#C92A32]">
                            {task.error}
                          </div>
                        )}
                      </div>
                      <div><StatusTag status={task.status} /></div>
                      <div className="text-xs leading-5 text-[#777]">
                        <div>{task.startedAt}</div>
                        <div>{task.finishedAt || '尚未完成'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex h-14 shrink-0 items-center justify-between border-t border-[#E8E8E8] px-5">
              <span className="text-xs text-[#999]">失败重试仅重跑失败对象，不重复处理已成功数据。</span>
              <div className="flex gap-3">
                {(detailBatch.status === 'failed' || detailBatch.status === 'partial') && (
                  <button type="button" onClick={() => showNotice(`已为 ${detailBatch.id} 创建失败项重试任务`)} className="inline-flex h-9 items-center rounded border border-[#D9363E] px-4 text-sm text-[#D9363E] hover:bg-[#FFF5F5]">
                    <RefreshCw size={14} className="mr-1.5" />重试失败项
                  </button>
                )}
                <button type="button" onClick={() => setDetailBatch(null)} className="h-9 rounded bg-[#1F2329] px-5 text-sm text-white hover:bg-[#101216]">关闭</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
