import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { applyBatchResults, BatchItem, BatchTask, demoTransport, planBatches, productTaskStats } from './batchEditTask';

type Props = {
  task: BatchTask; scenario?: string;
  onChange: (task: BatchTask) => void;
  onSuccess: () => void;
  onClose: () => void;
};
export const MobileBatchEditProgress = ({ task, scenario = 'mixed', onChange, onSuccess, onClose }: Props) => {
  const current = useRef<BatchTask>(task);
  const locked = useRef(false);
  const mounted = useRef(true);
  const started = useRef(false);
  const transport = useRef(demoTransport(scenario));
  const [running, setRunning] = useState(task.items.some(item => item.status === 'pending' || item.status === 'running'));
  const [progress, setProgress] = useState({ done: 0, total: task.productCount, retry: false });
  const publish = (next: BatchTask) => { current.current = next; if (mounted.current) onChange(next); };
  const stats = productTaskStats(task);

  const run = async () => {
    if (locked.current) return;
    const targets = current.current.items.filter(item => item.status !== 'success');
    const targetProducts = new Set(targets.map(item => item.productId));
    if (!targetProducts.size) { onSuccess(); return; }
    const retry = targets.some(item => item.attempts > 0);
    locked.current = true; setRunning(true);
    setProgress({ done: 0, total: targetProducts.size, retry });
    try {
      // Uncertain responses are verified internally before any retry.
      const uncertain = targets.filter(item => item.status === 'unknown');
      if (uncertain.length) {
        let results;
        try { results = await transport.current.confirm(uncertain, current.current.id); }
        catch { results = uncertain.map(item => ({ id: item.id, status: 'unknown' as const, reason: '暂时无法确认修改结果，请稍后重试' })); }
        if (!mounted.current) return;
        publish(applyBatchResults(current.current, uncertain, results));
      }
      for (const batch of planBatches(current.current.items)) {
        if (!mounted.current) return;
        const ids = new Set(batch.map(item => item.id));
        publish({ ...current.current, items: current.current.items.map(item => ids.has(item.id) ? { ...item, status: 'running', attempts: item.attempts + 1, reason: undefined } : item) });
        const request = current.current.items.filter(item => ids.has(item.id));
        let results;
        try { results = await transport.current.submit(request, current.current.id); }
        catch { results = request.map(item => ({ id: item.id, status: 'unknown' as const, reason: '提交超时，请重试' })); }
        if (!mounted.current) return;
        publish(applyBatchResults(current.current, request, results));
        const done = [...targetProducts].filter(id => !current.current.items.some(item => item.productId === id && ['pending', 'running'].includes(item.status))).length;
        setProgress({ done, total: targetProducts.size, retry });
      }
      if (mounted.current && productTaskStats(current.current).failed === 0) onSuccess();
    } finally {
      locked.current = false;
      if (mounted.current) setRunning(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    if (!started.current && task.items.some(item => item.status === 'pending')) { started.current = true; void run(); }
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!running) return;
    const block = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', block);
    return () => window.removeEventListener('beforeunload', block);
  }, [running]);
  const percentage = progress.total ? Math.round(progress.done / progress.total * 100) : 0;
  return (
    <div className="absolute inset-0 z-[180] flex items-center justify-center bg-black/45 px-6">
      <section role="dialog" aria-modal="true" aria-labelledby="batch-progress-title" aria-busy={running} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {running ? <>
          <div className="mb-4 flex justify-center text-[#00B460]"><Loader2 size={30} className="animate-spin" /></div>
          <h2 id="batch-progress-title" className="text-center text-base font-bold text-[#1F2129]">{progress.retry ? '正在重试失败商品' : '正在修改商品'}</h2>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label="商品修改进度" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[#00C06B] transition-all duration-200" style={{ width: `${percentage}%` }} /></div>
          <div className="mt-3 flex justify-between text-xs text-gray-500"><span>已处理 {progress.done}/{progress.total} 个商品</span><span>{percentage}%</span></div>
          <p className="mt-5 text-center text-xs text-gray-400">请稍候，完成前请勿关闭页面</p>
        </> : <>
          <div className="flex items-center justify-center gap-2">
            <AlertCircle size={20} className="shrink-0 text-orange-500" aria-hidden="true" />
            <h2 id="batch-progress-title" className="text-base font-bold text-[#1F2129]">{stats.success ? '部分商品修改失败' : '商品修改失败'}</h2>
          </div>
          <div className="mt-5 grid grid-cols-2 divide-x divide-gray-100 text-center">
            <div><strong className="text-2xl font-bold text-[#00A35B]">{stats.success}</strong><p className="mt-1 text-xs text-gray-500">成功商品</p></div>
            <div><strong className="text-2xl font-bold text-red-500">{stats.failed}</strong><p className="mt-1 text-xs text-gray-500">失败商品</p></div>
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-gray-500">可直接重试失败部分，已成功的修改不会重复提交。</p>
          <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="h-11 flex-1 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">完成</button>
            <button onClick={() => void run()} className="h-11 flex-[2] rounded-xl bg-[#00C06B] text-sm font-bold text-white">重试失败商品</button>
          </div>
        </>}
      </section>
    </div>
  );
};
