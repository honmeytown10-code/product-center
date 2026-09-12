import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Loader2, Search, Store, X } from 'lucide-react';

type TaskType = 'update_platform_product' | 'auto_mapping';
type TaskStatus = 'completed' | 'running' | 'partial_failed' | 'failed';
type MappingResult = 'mapped' | 'failed' | 'unmapped';

type MappingTask = {
  id: string; type: TaskType; createdAt: string; completedAt?: string; operator: string;
  status: TaskStatus; platform: string; storeCount: number; successCount: number; failedCount: number; waitingCount: number;
};

type StoreTaskResult = {
  store: string; status: 'success' | 'failed' | 'waiting'; mappedCount: number; failedCount: number; issue?: string;
};

type ProductMappingDetail = {
  id: string; store: string; platformName: string; platformProductId: string; platformSku: string; platformSpec: string;
  qimaiName?: string; qimaiSku?: string; qimaiSpec?: string; basis?: string; result: MappingResult; reason?: string;
};

const initialTasks: MappingTask[] = [
  { id: '1297204877659642021', type: 'update_platform_product', createdAt: '2026-08-20 14:29:03', completedAt: '2026-08-20 14:29:31', operator: '孙猛', status: 'completed', platform: '美团外卖', storeCount: 1, successCount: 1, failedCount: 0, waitingCount: 0 },
  { id: '1291105153797521438', type: 'update_platform_product', createdAt: '2026-08-03 18:30:56', completedAt: '2026-08-03 18:31:27', operator: '刘剑', status: 'completed', platform: '美团外卖', storeCount: 1, successCount: 1, failedCount: 0, waitingCount: 0 },
  { id: '1291104345890684926', type: 'update_platform_product', createdAt: '2026-08-03 18:27:43', completedAt: '2026-08-03 18:28:21', operator: '刘剑', status: 'completed', platform: '淘宝闪购', storeCount: 1, successCount: 1, failedCount: 0, waitingCount: 0 },
  { id: '1291084481000043512', type: 'update_platform_product', createdAt: '2026-08-03 17:08:47', completedAt: '2026-08-03 17:09:42', operator: '刘剑', status: 'completed', platform: '美团外卖', storeCount: 18, successCount: 16, failedCount: 2, waitingCount: 0 },
  { id: '1289688992479694210', type: 'auto_mapping', createdAt: '2026-07-30 20:43:20', completedAt: '2026-07-30 20:43:38', operator: '周镇', status: 'completed', platform: '美团外卖', storeCount: 2734, successCount: 2730, failedCount: 4, waitingCount: 0 },
  { id: '1288564837265471496', type: 'update_platform_product', createdAt: '2026-07-27 18:16:37', operator: '刘剑', status: 'running', platform: '抖音在线点', storeCount: 42, successCount: 28, failedCount: 0, waitingCount: 14 },
  { id: '1288552271461963511', type: 'auto_mapping', createdAt: '2026-07-27 17:26:41', completedAt: '2026-07-27 17:27:12', operator: '刘剑', status: 'completed', platform: '美团外卖', storeCount: 3, successCount: 0, failedCount: 3, waitingCount: 0 },
];

const productMappingDetails: ProductMappingDetail[] = [
  { id: 'd1', store: '南山万象店', platformName: '招牌珍珠奶茶', platformProductId: '30824739921', platformSku: 'MT-1001-L', platformSpec: '大杯', qimaiName: '招牌珍珠奶茶', qimaiSku: 'SKU 1001', qimaiSpec: '大杯', basis: '企迈 SKUID', result: 'mapped' },
  { id: 'd2', store: '南山万象店', platformName: '手打柠檬茶', platformProductId: '30824739922', platformSku: 'MT-1002-N', platformSpec: '标准', qimaiName: '手打柠檬茶', qimaiSku: 'SKU 1002', qimaiSpec: '标准', basis: '商家商品标识', result: 'mapped' },
  { id: 'd3', store: '福田卓悦店', platformName: '黑糖波波鲜奶', platformProductId: '30824739923', platformSku: 'MT-1003-M', platformSpec: '中杯', qimaiName: '黑糖波波鲜奶', qimaiSku: 'SKU 1003', qimaiSpec: '中杯', basis: '后台绑定', result: 'mapped' },
  { id: 'd4', store: '易到家（五一广场店）', platformName: '辣椒炒肉', platformProductId: '34581232438', platformSku: 'MT-2208-200', platformSpec: '200 克', qimaiName: '番茄水果茶', qimaiSku: 'SKU 1003', qimaiSpec: '大杯', result: 'failed', reason: '绑定冲突：该门店商品已被其他平台商品绑定' },
  { id: 'd5', store: '宝安壹方城店', platformName: '经典牛肉汉堡', platformProductId: '30824739925', platformSku: 'MT-3001-N', platformSpec: '标准', result: 'unmapped', reason: '未找到商品标识和规格均一致的门店商品' },
];

const taskTypeLabels: Record<TaskType, string> = { update_platform_product: '更新平台商品', auto_mapping: '自动关联' };
const statusMeta: Record<TaskStatus, { label: string; classes: string }> = {
  completed: { label: '已完成', classes: 'bg-[#E8FFF3] text-[#008A4B]' }, running: { label: '执行中', classes: 'bg-[#E8F3FF] text-[#2468A2]' },
  partial_failed: { label: '部分失败', classes: 'bg-[#FFF7E8] text-[#D46B08]' }, failed: { label: '失败', classes: 'bg-[#FFECE8] text-[#CB2634]' },
};
const resultMeta: Record<MappingResult, { label: string; classes: string }> = {
  mapped: { label: '已绑定', classes: 'bg-[#E8FFF3] text-[#008A4B]' }, failed: { label: '绑定失败', classes: 'bg-[#FFECE8] text-[#CB2634]' },
  unmapped: { label: '未找到', classes: 'bg-[#FFF7E8] text-[#D46B08]' },
};

const buildStoreResults = (task: MappingTask): StoreTaskResult[] => {
  if (task.status === 'running') return [
    { store: `已完成门店（${task.successCount} 家）`, status: 'success', mappedCount: 86, failedCount: 0 },
    { store: `等待执行门店（${task.waitingCount} 家）`, status: 'waiting', mappedCount: 0, failedCount: 0 },
  ];
  if (task.failedCount > 0) return [
    { store: task.successCount ? `处理成功门店（${task.successCount} 家）` : '暂无成功门店', status: task.successCount ? 'success' : 'failed', mappedCount: task.successCount ? 86 : 0, failedCount: 0 },
    { store: '易到家（五一广场店）', status: 'failed', mappedCount: 23, failedCount: task.failedCount, issue: '存在商品绑定冲突或未找到可匹配的门店商品' },
  ];
  return [{ store: task.storeCount > 1 ? `全部目标门店（${task.storeCount} 家）` : '南山万象店', status: 'success', mappedCount: 28, failedCount: 0 }];
};

export const WebProductMappingTasks: React.FC = () => {
  const [taskIdInput, setTaskIdInput] = useState('');
  const [taskTypeInput, setTaskTypeInput] = useState<'all' | TaskType>('all');
  const [statusInput, setStatusInput] = useState<'all' | TaskStatus>('all');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [filters, setFilters] = useState({ taskId: '', taskType: 'all' as 'all' | TaskType, status: 'all' as 'all' | TaskStatus, startDate: '', endDate: '' });
  const [selectedTask, setSelectedTask] = useState<MappingTask | null>(() => {
    const requestedTaskId = new URLSearchParams(window.location.search).get('task');
    return initialTasks.find(task => task.id === requestedTaskId) || null;
  });
  const [detailView, setDetailView] = useState<'stores' | 'products'>(() => new URLSearchParams(window.location.search).get('detail') === 'products' ? 'products' : 'stores');
  const [detailStore, setDetailStore] = useState('all');
  const [detailKeyword, setDetailKeyword] = useState('');
  const [detailResult, setDetailResult] = useState<'all' | MappingResult>('all');
  const [message, setMessage] = useState('');

  const filteredTasks = useMemo(() => initialTasks.filter(task => {
    if (filters.taskId && !task.id.includes(filters.taskId)) return false;
    if (filters.taskType !== 'all' && task.type !== filters.taskType) return false;
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    const date = task.createdAt.slice(0, 10);
    if (filters.startDate && date < filters.startDate) return false;
    if (filters.endDate && date > filters.endDate) return false;
    return true;
  }), [filters]);
  const visibleDetails = useMemo(() => productMappingDetails.filter(detail => {
    if (detailStore !== 'all' && detail.store !== detailStore) return false;
    if (detailResult !== 'all' && detail.result !== detailResult) return false;
    return !detailKeyword || `${detail.platformName}${detail.platformProductId}${detail.platformSku}${detail.qimaiName || ''}${detail.qimaiSku || ''}`.toLowerCase().includes(detailKeyword.toLowerCase());
  }), [detailKeyword, detailResult, detailStore]);
  const query = () => setFilters({ taskId: taskIdInput.trim(), taskType: taskTypeInput, status: statusInput, startDate: startDateInput, endDate: endDateInput });
  const reset = () => { setTaskIdInput(''); setTaskTypeInput('all'); setStatusInput('all'); setStartDateInput(''); setEndDateInput(''); setFilters({ taskId: '', taskType: 'all', status: 'all', startDate: '', endDate: '' }); };
  const openTask = (task: MappingTask) => { setSelectedTask(task); setDetailView('stores'); setDetailStore('all'); setDetailKeyword(''); setDetailResult('all'); };
  const retryTask = (task: MappingTask) => { setMessage(`已按任务 ${task.id} 的失败门店范围创建重试任务，执行结果将在本列表更新。`); setSelectedTask(null); };
  const storeResults = selectedTask ? buildStoreResults(selectedTask) : [];

  return <div className="space-y-3">
    {message && <div className="flex items-center justify-between rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-[13px] text-[#245B8A]"><span>{message}</span><button type="button" onClick={() => setMessage('')} aria-label="关闭提示"><X size={16} /></button></div>}
    <section className="rounded-lg border border-[#E5E6EB] bg-white p-4">
      <div className="grid grid-cols-[minmax(340px,1.35fr)_minmax(220px,1fr)_minmax(180px,.8fr)] gap-3">
        <label><span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">创建时间</span><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><input type="date" value={startDateInput} onChange={event => setStartDateInput(event.target.value)} className="h-9 min-w-0 rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]" /><span className="text-[12px] text-[#86909C]">至</span><input type="date" value={endDateInput} onChange={event => setEndDateInput(event.target.value)} className="h-9 min-w-0 rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]" /></div></label>
        <label><span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">任务 ID</span><div className="flex h-9 items-center rounded-md border border-[#C9CDD4] bg-white px-3"><Search size={15} className="mr-2 shrink-0 text-[#86909C]" /><input value={taskIdInput} onChange={event => setTaskIdInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') query(); }} placeholder="请输入任务 ID" className="min-w-0 flex-1 text-[13px] outline-none" /></div></label>
        <label><span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">操作类型</span><select value={taskTypeInput} onChange={event => setTaskTypeInput(event.target.value as 'all' | TaskType)} className="h-9 w-full rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px]"><option value="all">全部操作类型</option><option value="update_platform_product">更新平台商品</option><option value="auto_mapping">自动关联</option></select></label>
        <label><span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">执行状态</span><select value={statusInput} onChange={event => setStatusInput(event.target.value as 'all' | TaskStatus)} className="h-9 w-full rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px]"><option value="all">全部状态</option><option value="completed">已完成</option><option value="running">执行中</option><option value="partial_failed">部分失败</option><option value="failed">失败</option></select></label>
        <div className="col-span-2 flex items-end gap-2"><button type="button" onClick={query} className="h-9 shrink-0 whitespace-nowrap rounded-md bg-[#00B460] px-5 text-[13px] font-bold text-white">查询</button><button type="button" onClick={reset} className="h-9 shrink-0 whitespace-nowrap rounded-md border border-[#C9CDD4] bg-white px-5 text-[13px]">重置</button></div>
      </div>
    </section>
    <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
      <div className="flex min-h-11 items-center justify-between gap-4 border-b border-[#E5E6EB] px-4 py-2 text-[12px] text-[#86909C]"><span className="shrink-0">共 {filteredTasks.length} 条任务</span><span className="text-right">免绑定商品在任务创建前排除，本页仅统计实际进入执行范围的商品</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1040px] table-fixed text-left text-[13px]"><thead className="bg-[#F7F8FA] text-[#4E5969]"><tr><th className="w-[188px] px-4 py-3 font-medium">任务 ID</th><th className="w-[132px] px-4 py-3 font-medium">操作类型</th><th className="w-[164px] px-4 py-3 font-medium">创建时间</th><th className="w-[72px] px-4 py-3 font-medium">操作人</th><th className="w-[130px] px-4 py-3 font-medium">执行状态</th><th className="w-[90px] px-4 py-3 font-medium">门店数</th><th className="w-[190px] px-4 py-3 font-medium">执行结果</th><th className="w-[90px] px-4 py-3 font-medium">操作</th></tr></thead><tbody>
        {filteredTasks.map(task => <tr key={task.id} className="border-t border-[#F0F1F2] text-[#4E5969] hover:bg-[#FAFBFC]"><td className="px-4 py-3 font-mono text-[12px] text-[#1D2129]">{task.id}</td><td className="px-4 py-3"><div className="font-medium text-[#1D2129]">{taskTypeLabels[task.type]}</div><div className="mt-1 text-[11px] text-[#86909C]">{task.platform}</div></td><td className="px-4 py-3 tabular-nums">{task.createdAt}</td><td className="px-4 py-3">{task.operator}</td><td className="px-4 py-3"><span className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[12px] font-medium ${statusMeta[task.status].classes}`}>{statusMeta[task.status].label}</span>{task.completedAt && <div className="mt-1 whitespace-nowrap text-[11px] text-[#86909C]">{task.completedAt.slice(5)}</div>}</td><td className="px-4 py-3 font-medium tabular-nums text-[#1D2129]">{task.storeCount}</td><td className="px-4 py-3"><div className="flex flex-nowrap gap-1.5"><span className="whitespace-nowrap rounded bg-[#E8FFF3] px-2 py-1 text-[11px] text-[#008A4B]">成功 {task.successCount}</span><span className={`whitespace-nowrap rounded px-2 py-1 text-[11px] ${task.failedCount ? 'bg-[#FFECE8] font-semibold text-[#CB2634]' : 'bg-[#F2F3F5] text-[#86909C]'}`}>失败 {task.failedCount}</span>{task.waitingCount > 0 && <span className="whitespace-nowrap rounded bg-[#E8F3FF] px-2 py-1 text-[11px] text-[#2468A2]">等待 {task.waitingCount}</span>}</div></td><td className="px-4 py-3"><button type="button" onClick={() => openTask(task)} className="whitespace-nowrap font-medium text-[#00A35B]">查看详情</button></td></tr>)}
        {filteredTasks.length === 0 && <tr><td colSpan={8} className="px-4 py-16 text-center text-[13px] text-[#86909C]">没有符合当前条件的任务</td></tr>}
      </tbody></table></div>
      <footer className="flex h-12 items-center justify-end gap-2 border-t border-[#E5E6EB] px-4 text-[12px] text-[#4E5969]"><button type="button" disabled className="flex h-8 w-8 items-center justify-center rounded bg-[#F2F3F5] text-[#C9CDD4]" aria-label="上一页"><ChevronLeft size={15} /></button><span className="flex h-8 min-w-8 items-center justify-center rounded bg-[#00B460] px-2 font-bold text-white">1</span><button type="button" disabled className="flex h-8 w-8 items-center justify-center rounded bg-[#F2F3F5] text-[#C9CDD4]" aria-label="下一页"><ChevronRight size={15} /></button><span className="ml-2">共 {filteredTasks.length} 条</span></footer>
    </section>
    {selectedTask && <div className="fixed inset-0 z-[320] flex justify-end bg-[#1D2129]/45" role="dialog" aria-modal="true" aria-label="商品管理任务详情"><div className="flex h-full w-[min(900px,calc(100vw-64px))] flex-col bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5"><div><h3 className="text-[18px] font-bold text-[#1D2129]">任务详情</h3><p className="mt-1 font-mono text-[12px] text-[#86909C]">{selectedTask.id}</p></div><button type="button" onClick={() => setSelectedTask(null)} className="rounded p-1.5 hover:bg-[#F2F3F5]" aria-label="关闭任务详情"><X size={18} /></button></header>
      <div className="shrink-0 border-b border-[#E5E6EB] px-6 pt-4"><div className="grid grid-cols-4 gap-3 rounded-md bg-[#F7F8FA] p-4"><div><div className="text-[11px] text-[#86909C]">目标门店</div><div className="mt-1 text-[20px] font-bold tabular-nums">{selectedTask.storeCount}</div></div><div><div className="text-[11px] text-[#86909C]">成功</div><div className="mt-1 text-[20px] font-bold tabular-nums text-[#00A35B]">{selectedTask.successCount}</div></div><div><div className="text-[11px] text-[#86909C]">失败</div><div className="mt-1 text-[20px] font-bold tabular-nums text-[#CB2634]">{selectedTask.failedCount}</div></div><div><div className="text-[11px] text-[#86909C]">等待</div><div className="mt-1 text-[20px] font-bold tabular-nums text-[#2468A2]">{selectedTask.waitingCount}</div></div></div>
        <dl className="mt-3 grid grid-cols-4 gap-4 text-[12px]"><div><dt className="text-[#86909C]">操作类型</dt><dd className="mt-1 font-medium">{taskTypeLabels[selectedTask.type]}</dd></div><div><dt className="text-[#86909C]">平台渠道</dt><dd className="mt-1 font-medium">{selectedTask.platform}</dd></div><div><dt className="text-[#86909C]">创建时间</dt><dd className="mt-1 whitespace-nowrap tabular-nums">{selectedTask.createdAt}</dd></div><div><dt className="text-[#86909C]">操作人</dt><dd className="mt-1">{selectedTask.operator}</dd></div></dl>
        <nav className="mt-4 flex h-10 gap-6" aria-label="任务详情视图"><button type="button" onClick={() => setDetailView('stores')} className={`border-b-2 px-1 text-[13px] ${detailView === 'stores' ? 'border-[#00B460] font-bold text-[#00A35B]' : 'border-transparent text-[#667085]'}`}>门店执行结果</button><button type="button" onClick={() => setDetailView('products')} className={`border-b-2 px-1 text-[13px] ${detailView === 'products' ? 'border-[#00B460] font-bold text-[#00A35B]' : 'border-transparent text-[#667085]'}`}>商品绑定明细</button></nav>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{detailView === 'stores' ? <div className="overflow-hidden rounded-md border border-[#E5E6EB]"><div className="grid grid-cols-[minmax(0,1fr)_110px_90px_120px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]"><div>门店</div><div>已绑定商品</div><div>失败</div><div>操作</div></div>{storeResults.map((result, index) => <div key={`${result.store}-${index}`} className="grid min-h-[72px] grid-cols-[minmax(0,1fr)_110px_90px_120px] items-center border-t border-[#F0F1F2] px-4 py-3 text-[13px]"><div className="flex min-w-0 items-center"><span className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${result.status === 'success' ? 'bg-[#E8FFF3] text-[#00A35B]' : result.status === 'waiting' ? 'bg-[#E8F3FF] text-[#2468A2]' : 'bg-[#FFECE8] text-[#CB2634]'}`}>{result.status === 'success' ? <CheckCircle2 size={17} /> : result.status === 'waiting' ? <Clock3 size={17} /> : <AlertCircle size={17} />}</span><div className="min-w-0"><div className="truncate font-medium">{result.store}</div>{result.issue && <div className="mt-1 truncate text-[12px] text-[#CB2634]">{result.issue}</div>}</div></div><div className="tabular-nums">{result.status === 'waiting' ? '--' : result.mappedCount}</div><div className={result.failedCount ? 'font-semibold tabular-nums text-[#CB2634]' : 'tabular-nums text-[#86909C]'}>{result.status === 'waiting' ? '--' : result.failedCount}</div><div><button type="button" onClick={() => { setDetailStore(result.store.includes('易到家') ? '易到家（五一广场店）' : 'all'); setDetailView('products'); }} className="inline-flex items-center whitespace-nowrap font-medium text-[#00A35B]">查看绑定明细<ArrowRight size={13} className="ml-1" /></button></div></div>)}</div> : <>
        <div className="mb-3 flex flex-nowrap gap-2 overflow-x-auto pb-0.5"><label className="flex h-9 min-w-[280px] flex-1 items-center rounded-md border border-[#C9CDD4] bg-white px-3"><Search size={15} className="mr-2 shrink-0 text-[#86909C]" /><input value={detailKeyword} onChange={event => setDetailKeyword(event.target.value)} placeholder="搜索平台商品 ID、名称或门店商品 SKU" className="min-w-0 flex-1 text-[12px] outline-none" /></label><select value={detailStore} onChange={event => setDetailStore(event.target.value)} className="h-9 w-[190px] shrink-0 rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px]"><option value="all">全部门店</option>{Array.from(new Set(productMappingDetails.map(item => item.store))).map(store => <option key={store} value={store}>{store}</option>)}</select><select value={detailResult} onChange={event => setDetailResult(event.target.value as 'all' | MappingResult)} className="h-9 w-[130px] shrink-0 rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px]"><option value="all">全部结果</option><option value="mapped">已绑定</option><option value="failed">绑定失败</option><option value="unmapped">未找到</option></select></div>
        <div className="overflow-hidden rounded-md border border-[#E5E6EB]"><div className="grid grid-cols-[minmax(0,1.05fr)_36px_minmax(0,1fr)_112px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]"><div>平台商品</div><div /><div>绑定的门店商品</div><div>结果</div></div>{visibleDetails.map(detail => <div key={detail.id} className="grid min-h-[92px] grid-cols-[minmax(0,1.05fr)_36px_minmax(0,1fr)_112px] items-center border-t border-[#F0F1F2] px-4 py-3 text-[12px]"><div className="min-w-0"><div className="mb-1.5 inline-flex max-w-full items-center rounded bg-[#F2F3F5] px-1.5 py-0.5 text-[10px] text-[#667085]"><Store size={11} className="mr-1 shrink-0" /><span className="truncate">{detail.store}</span></div><div className="truncate font-bold">{detail.platformName} · {detail.platformSpec}</div><div className="mt-1 truncate font-mono text-[11px] text-[#86909C]">商品 ID {detail.platformProductId} · SKU {detail.platformSku}</div></div><ArrowRight size={15} className="text-[#C9CDD4]" /><div className="min-w-0">{detail.qimaiName ? <><div className="truncate font-bold">{detail.qimaiName} · {detail.qimaiSpec}</div><div className="mt-1 truncate text-[11px] text-[#86909C]">门店商品 {detail.qimaiSku}{detail.basis ? ` · ${detail.basis}` : ''}</div></> : <div className="text-[#86909C]">未绑定门店商品</div>}</div><div><span className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium ${resultMeta[detail.result].classes}`}>{resultMeta[detail.result].label}</span>{detail.reason && <div className="mt-1.5 text-[11px] leading-4 text-[#CB2634]">{detail.reason}</div>}</div></div>)}{visibleDetails.length === 0 && <div className="py-14 text-center text-[12px] text-[#86909C]">没有符合条件的商品绑定明细</div>}</div>
      </>}</div>
      <footer className="flex min-h-16 items-center justify-between gap-4 border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-3"><span className="text-[12px] text-[#667085]">任务明细仅包含实际进入执行范围的平台商品</span><div className="flex shrink-0 gap-2"><button type="button" onClick={() => setSelectedTask(null)} className="h-9 whitespace-nowrap rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px]">关闭</button>{selectedTask.failedCount > 0 && <button type="button" onClick={() => retryTask(selectedTask)} className="inline-flex h-9 items-center whitespace-nowrap rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white"><Loader2 size={14} className="mr-1.5" />重试失败范围</button>}</div></footer>
    </div></div>}
  </div>;
};
