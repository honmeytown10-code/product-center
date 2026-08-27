import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Search,
  Store,
  X,
} from 'lucide-react';

type TaskType = 'update_platform_product' | 'auto_mapping';
type TaskStatus = 'completed' | 'running' | 'partial_failed' | 'failed';

type MappingTask = {
  id: string;
  type: TaskType;
  createdAt: string;
  completedAt?: string;
  operator: string;
  status: TaskStatus;
  platform: string;
  storeCount: number;
  successCount: number;
  failedCount: number;
  waitingCount: number;
};

type StoreTaskResult = {
  store: string;
  status: 'success' | 'failed' | 'waiting';
  processed: number;
  issue?: string;
};

const initialTasks: MappingTask[] = [
  { id: '1297204877659642021', type: 'update_platform_product', createdAt: '2026-08-20 14:29:03', completedAt: '2026-08-20 14:29:31', operator: '孙猛', status: 'completed', platform: '美团外卖', storeCount: 1, successCount: 1, failedCount: 0, waitingCount: 0 },
  { id: '1291105153797521438', type: 'update_platform_product', createdAt: '2026-08-03 18:30:56', completedAt: '2026-08-03 18:31:27', operator: '刘剑', status: 'completed', platform: '美团外卖', storeCount: 1, successCount: 1, failedCount: 0, waitingCount: 0 },
  { id: '1291104345890684926', type: 'update_platform_product', createdAt: '2026-08-03 18:27:43', completedAt: '2026-08-03 18:28:21', operator: '刘剑', status: 'completed', platform: '淘宝闪购', storeCount: 1, successCount: 1, failedCount: 0, waitingCount: 0 },
  { id: '1291084481000043512', type: 'update_platform_product', createdAt: '2026-08-03 17:08:47', completedAt: '2026-08-03 17:09:42', operator: '刘剑', status: 'partial_failed', platform: '美团外卖', storeCount: 18, successCount: 16, failedCount: 2, waitingCount: 0 },
  { id: '1289688992479694210', type: 'auto_mapping', createdAt: '2026-07-30 20:43:20', completedAt: '2026-07-30 20:43:38', operator: '周镇', status: 'completed', platform: '美团外卖', storeCount: 2734, successCount: 2734, failedCount: 0, waitingCount: 0 },
  { id: '1288564837265471496', type: 'update_platform_product', createdAt: '2026-07-27 18:16:37', operator: '刘剑', status: 'running', platform: '抖音在线点', storeCount: 42, successCount: 28, failedCount: 0, waitingCount: 14 },
  { id: '1288552271461963511', type: 'auto_mapping', createdAt: '2026-07-27 17:26:41', completedAt: '2026-07-27 17:27:12', operator: '刘剑', status: 'failed', platform: '美团外卖', storeCount: 3, successCount: 0, failedCount: 3, waitingCount: 0 },
];

const taskTypeLabels: Record<TaskType, string> = {
  update_platform_product: '更新平台商品',
  auto_mapping: '自动关联',
};

const statusMeta: Record<TaskStatus, { label: string; classes: string }> = {
  completed: { label: '已完成', classes: 'bg-[#E8FFF3] text-[#008A4B]' },
  running: { label: '执行中', classes: 'bg-[#E8F3FF] text-[#2468A2]' },
  partial_failed: { label: '部分失败', classes: 'bg-[#FFF7E8] text-[#D46B08]' },
  failed: { label: '失败', classes: 'bg-[#FFECE8] text-[#CB2634]' },
};

const buildStoreResults = (task: MappingTask): StoreTaskResult[] => {
  if (task.status === 'completed') {
    return [
      { store: task.storeCount > 1 ? `全部目标门店（${task.storeCount} 家）` : '易到家（五一广场店）', status: 'success', processed: task.successCount },
    ];
  }
  if (task.status === 'running') {
    return [
      { store: `已完成门店（${task.successCount} 家）`, status: 'success', processed: task.successCount },
      { store: `等待执行门店（${task.waitingCount} 家）`, status: 'waiting', processed: 0 },
    ];
  }
  return [
    { store: task.successCount ? `处理成功门店（${task.successCount} 家）` : '暂无成功门店', status: task.successCount ? 'success' : 'failed', processed: task.successCount },
    { store: `处理失败门店（${task.failedCount} 家）`, status: 'failed', processed: 0, issue: task.type === 'auto_mapping' ? '平台授权已过期，无法拉取商品进行关联' : '平台商品拉取超时，可从失败范围重试' },
  ];
};

export const WebProductMappingTasks: React.FC = () => {
  const [taskIdInput, setTaskIdInput] = useState('');
  const [taskTypeInput, setTaskTypeInput] = useState<'all' | TaskType>('all');
  const [statusInput, setStatusInput] = useState<'all' | TaskStatus>('all');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [filters, setFilters] = useState({ taskId: '', taskType: 'all' as 'all' | TaskType, status: 'all' as 'all' | TaskStatus, startDate: '', endDate: '' });
  const [selectedTask, setSelectedTask] = useState<MappingTask | null>(null);
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

  const query = () => setFilters({ taskId: taskIdInput.trim(), taskType: taskTypeInput, status: statusInput, startDate: startDateInput, endDate: endDateInput });
  const reset = () => {
    setTaskIdInput('');
    setTaskTypeInput('all');
    setStatusInput('all');
    setStartDateInput('');
    setEndDateInput('');
    setFilters({ taskId: '', taskType: 'all', status: 'all', startDate: '', endDate: '' });
  };

  const retryTask = (task: MappingTask) => {
    setMessage(`已按任务 ${task.id} 的失败门店范围创建重试任务，执行结果将在本列表更新。`);
    setSelectedTask(null);
  };

  const storeResults = selectedTask ? buildStoreResults(selectedTask) : [];

  return (
    <div className="space-y-3">
      {message && (
        <div className="flex items-center justify-between rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-[13px] text-[#245B8A]">
          <span>{message}</span><button type="button" onClick={() => setMessage('')} aria-label="关闭提示"><X size={16} /></button>
        </div>
      )}

      <section className="rounded-lg border border-[#E5E6EB] bg-white p-4">
        <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-3">
          <label>
            <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">创建时间</span>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input type="date" value={startDateInput} onChange={event => setStartDateInput(event.target.value)} className="h-9 min-w-0 rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]" />
              <span className="text-[12px] text-[#86909C]">至</span>
              <input type="date" value={endDateInput} onChange={event => setEndDateInput(event.target.value)} className="h-9 min-w-0 rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]" />
            </div>
          </label>
          <label>
            <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">任务 ID</span>
            <div className="flex h-9 items-center rounded-md border border-[#C9CDD4] bg-white px-3"><Search size={15} className="mr-2 text-[#86909C]" /><input value={taskIdInput} onChange={event => setTaskIdInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') query(); }} placeholder="请输入任务 ID" className="min-w-0 flex-1 text-[13px] outline-none" /></div>
          </label>
          <label>
            <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">操作类型</span>
            <select value={taskTypeInput} onChange={event => setTaskTypeInput(event.target.value as 'all' | TaskType)} className="h-9 w-full rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] outline-none focus:border-[#00B460]"><option value="all">全部操作类型</option><option value="update_platform_product">更新平台商品</option><option value="auto_mapping">自动关联</option></select>
          </label>
          <label>
            <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">状态</span>
            <select value={statusInput} onChange={event => setStatusInput(event.target.value as 'all' | TaskStatus)} className="h-9 w-full rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] outline-none focus:border-[#00B460]"><option value="all">全部状态</option><option value="completed">已完成</option><option value="running">执行中</option><option value="partial_failed">部分失败</option><option value="failed">失败</option></select>
          </label>
          <div className="col-span-2 flex items-end gap-2"><button type="button" onClick={query} className="h-9 rounded-md bg-[#00B460] px-5 text-[13px] font-bold text-white hover:bg-[#009A52]">查询</button><button type="button" onClick={reset} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-5 text-[13px] text-[#4E5969]">重置</button></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex h-11 items-center justify-between border-b border-[#E5E6EB] px-4 text-[12px] text-[#86909C]"><span>共 {filteredTasks.length} 条任务</span><span>任务由“更新平台商品”或“按商品标识匹配”等异步操作产生</span></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed text-left text-[13px]">
            <thead className="bg-[#F7F8FA] text-[#4E5969]"><tr><th className="w-[220px] px-4 py-3 font-medium">任务 ID</th><th className="w-[170px] px-4 py-3 font-medium">操作类型</th><th className="w-[190px] px-4 py-3 font-medium">创建时间</th><th className="w-[120px] px-4 py-3 font-medium">操作人</th><th className="w-[180px] px-4 py-3 font-medium">状态</th><th className="w-[130px] px-4 py-3 font-medium">操作门店数</th><th className="w-[110px] px-4 py-3 font-medium">操作</th></tr></thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task.id} className="border-t border-[#F0F1F2] text-[#4E5969] hover:bg-[#FAFBFC]">
                  <td className="px-4 py-4 font-mono text-[12px] text-[#1D2129]">{task.id}</td>
                  <td className="px-4 py-4"><div className="font-medium text-[#1D2129]">{taskTypeLabels[task.type]}</div><div className="mt-1 text-[11px] text-[#86909C]">{task.platform}</div></td>
                  <td className="px-4 py-4">{task.createdAt}</td>
                  <td className="px-4 py-4">{task.operator}</td>
                  <td className="px-4 py-4"><span className={`inline-flex rounded px-2 py-1 text-[12px] font-medium ${statusMeta[task.status].classes}`}>{statusMeta[task.status].label}</span>{task.completedAt && <div className="mt-1 text-[11px] text-[#86909C]">{task.completedAt}</div>}</td>
                  <td className="px-4 py-4 font-medium text-[#1D2129]">{task.storeCount}</td>
                  <td className="px-4 py-4"><button type="button" onClick={() => setSelectedTask(task)} className="font-medium text-[#00A35B] hover:text-[#008A4B]">任务详情</button></td>
                </tr>
              ))}
              {filteredTasks.length === 0 && <tr><td colSpan={7} className="px-4 py-16 text-center"><Search size={28} className="mx-auto text-[#C9CDD4]" /><div className="mt-3 text-[13px] text-[#86909C]">没有符合当前条件的任务</div><button type="button" onClick={reset} className="mt-2 text-[13px] font-medium text-[#00A35B]">清空筛选条件</button></td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="flex h-12 items-center justify-end gap-2 border-t border-[#E5E6EB] px-4 text-[12px] text-[#4E5969]"><button type="button" disabled className="flex h-8 w-8 items-center justify-center rounded bg-[#F2F3F5] text-[#C9CDD4]" aria-label="上一页"><ChevronLeft size={15} /></button><span className="flex h-8 min-w-8 items-center justify-center rounded bg-[#00B460] px-2 font-bold text-white">1</span><button type="button" disabled className="flex h-8 w-8 items-center justify-center rounded bg-[#F2F3F5] text-[#C9CDD4]" aria-label="下一页"><ChevronRight size={15} /></button><span className="ml-2">共 {filteredTasks.length} 条</span></footer>
      </section>

      {selectedTask && (
        <div className="fixed inset-0 z-[320] flex justify-end bg-[#1D2129]/45" role="dialog" aria-modal="true" aria-label="商品管理任务详情">
          <div className="flex h-full w-[760px] flex-col bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5"><div><h3 className="text-[18px] font-bold text-[#1D2129]">任务详情</h3><p className="mt-1 font-mono text-[12px] text-[#86909C]">{selectedTask.id}</p></div><button type="button" onClick={() => setSelectedTask(null)} className="rounded p-1.5 hover:bg-[#F2F3F5]" aria-label="关闭任务详情"><X size={18} /></button></header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-4 gap-3 rounded-md bg-[#F7F8FA] p-4">
                <div><div className="text-[11px] text-[#86909C]">目标门店</div><div className="mt-1 text-[20px] font-bold text-[#1D2129]">{selectedTask.storeCount}</div></div>
                <div><div className="text-[11px] text-[#86909C]">成功</div><div className="mt-1 text-[20px] font-bold text-[#00A35B]">{selectedTask.successCount}</div></div>
                <div><div className="text-[11px] text-[#86909C]">失败</div><div className="mt-1 text-[20px] font-bold text-[#CB2634]">{selectedTask.failedCount}</div></div>
                <div><div className="text-[11px] text-[#86909C]">等待</div><div className="mt-1 text-[20px] font-bold text-[#2468A2]">{selectedTask.waitingCount}</div></div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 rounded-md border border-[#E5E6EB] p-4 text-[12px]"><div><dt className="text-[#86909C]">操作类型</dt><dd className="mt-1 font-medium text-[#1D2129]">{taskTypeLabels[selectedTask.type]}</dd></div><div><dt className="text-[#86909C]">平台渠道</dt><dd className="mt-1 font-medium text-[#1D2129]">{selectedTask.platform}</dd></div><div><dt className="text-[#86909C]">创建时间</dt><dd className="mt-1 text-[#4E5969]">{selectedTask.createdAt}</dd></div><div><dt className="text-[#86909C]">操作人</dt><dd className="mt-1 text-[#4E5969]">{selectedTask.operator}</dd></div></dl>
              <h4 className="mt-5 text-[14px] font-bold text-[#1D2129]">门店执行结果</h4>
              <div className="mt-3 overflow-hidden rounded-md border border-[#E5E6EB]">
                {storeResults.map((result, index) => (
                  <div key={`${result.store}-${index}`} className="flex min-h-[66px] items-center border-t border-[#F0F1F2] px-4 py-3 first:border-t-0">
                    <span className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${result.status === 'success' ? 'bg-[#E8FFF3] text-[#00A35B]' : result.status === 'waiting' ? 'bg-[#E8F3FF] text-[#2468A2]' : 'bg-[#FFECE8] text-[#CB2634]'}`}>{result.status === 'success' ? <CheckCircle2 size={17} /> : result.status === 'waiting' ? <Clock3 size={17} /> : <AlertCircle size={17} />}</span>
                    <div className="min-w-0 flex-1"><div className="font-medium text-[#1D2129]">{result.store}</div>{result.issue && <div className="mt-1 text-[12px] text-[#CB2634]">{result.issue}</div>}</div>
                    <span className="text-[12px] text-[#86909C]">{result.processed ? `处理 ${result.processed} 家` : result.status === 'waiting' ? '等待中' : '未完成'}</span>
                  </div>
                ))}
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4"><button type="button" onClick={() => setSelectedTask(null)} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]">关闭</button>{selectedTask.failedCount > 0 && <button type="button" onClick={() => retryTask(selectedTask)} className="inline-flex h-9 items-center rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white"><Loader2 size={14} className="mr-1.5" />重试失败范围</button>}</footer>
          </div>
        </div>
      )}
    </div>
  );
};
