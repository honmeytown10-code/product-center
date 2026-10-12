import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WebStoreScopeSelector } from './WebStoreScopeSelector';
import { AlertTriangle, ArrowLeft, Loader2, Search, Trash2, X } from 'lucide-react';
import type { PublishBatch } from './WebPublishRecords';
import { checkStoreDeletion, createStoreDeletionBatch, deletionChannelName, normalizeDeletionChannel, type DeleteFacts, type DeletePolicy, type DeleteTarget } from '../../storeProductDeletion';

type Source = { id: string; baseProductId: string; name: string; storeId: string; storeName: string; type: string; channels: string[] };
type Scenario = 'clear' | 'unknown' | 'reference' | 'expired' | 'no_permission' | 'pending';
export const WebStoreProductDeleteFlow = ({ products, managedChannels, initialChannel, onClose, onSubmit, onLocalRemove, inline = false }: {
  products: Source[]; managedChannels: string[]; initialChannel?: string; inline?: boolean;
  onClose: () => void; onSubmit?: (batch: PublishBatch) => void; onLocalRemove?: (targets: DeleteTarget[]) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [store, setStore] = useState('all');
  const [channel, setChannel] = useState(initialChannel || 'all');
  const [query, setQuery] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [policy, setPolicy] = useState<DeletePolicy>('qimai_only');
  const [scenario, setScenario] = useState<Scenario>('unknown');
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [outcome, setOutcome] = useState<'waiting' | 'partial' | 'failed' | 'success'>('waiting');
  const [result, setResult] = useState<{ success: number; waiting: number; failed: number; batch: string } | null>(null);
  const targets: DeleteTarget[] = useMemo<DeleteTarget[]>(() => products.flatMap(p => p.channels.map(ch => ({ id: `${p.id}:${ch}`, productId: p.baseProductId, name: p.name, storeId: p.storeId, storeName: p.storeName, channel: ch, type: p.type }))), [products]);
  const storeOptions: Array<[string, string]> = Array.from(new Map<string, string>(products.map(p => [p.storeId, p.storeName])).entries());
  const channelOptions: string[] = Array.from(new Set<string>(targets.map(t => t.channel)));
  const visible = targets.filter(t => (store === 'all' || t.storeId === store) && (channel === 'all' || t.channel === channel) && `${t.name}${t.productId}`.includes(query.trim()));
  const selected = targets.filter(t => ids.includes(t.id));
  const facts = (t: DeleteTarget): DeleteFacts => ({ referencesVerified: scenario !== 'unknown', references: scenario === 'reference' ? ['示例：双人套餐 / 在用加料组'] : [], authorized: scenario !== 'expired', actionAllowed: scenario !== 'no_permission', mappingOwned: scenario !== 'unknown', managed: managedChannels.includes(normalizeDeletionChannel(t.channel)), pendingWrite: scenario === 'pending' });
  const issues = selected.flatMap(t => checkStoreDeletion(t, policy, facts(t)).map(message => ({ target: t, message })));
  const resetCheck = () => { setChecked(false); setConfirmed(false); };
  useEffect(() => {
    if (inline) return;
    const previous = document.activeElement as HTMLElement;
    ref.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !checking) onClose();
      if (e.key === 'Tab') {
        const nodes = [...(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled])') || [])].filter(n => n.getBoundingClientRect().width);
        if (!nodes.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handle); return () => { document.removeEventListener('keydown', handle); previous?.focus(); };
  }, [inline, checking, onClose]);
  const submit = () => {
    if (!checked || !confirmed || !selected.length || issues.length) return;
    const states = Object.fromEntries(selected.map((t, i) => [t.id, policy === 'qimai_only' || outcome === 'success' ? 'success' : outcome === 'partial' ? i === 0 ? 'success' : i === 1 ? 'failed' : 'waiting' : outcome])) as Record<string, 'success' | 'waiting' | 'failed'>;
    const batch = createStoreDeletionBatch(selected, policy, states);
    onSubmit?.(batch);
    onLocalRemove?.(selected.filter(t => states[t.id] === 'success'));
    setResult({ success: selected.filter(t => states[t.id] === 'success').length, failed: selected.filter(t => states[t.id] === 'failed').length, waiting: selected.filter(t => states[t.id] === 'waiting').length, batch: batch.id });
  };
  const control = 'h-9 rounded border border-[#DDE2E8] bg-white px-3 text-sm text-[#4E5969] focus:border-[#008F4C] focus:outline-none';
  const content = <div ref={ref} tabIndex={-1} role={inline ? undefined : 'dialog'} aria-modal={inline ? undefined : true} aria-labelledby="store-delete-title" className={`${inline ? 'h-full w-full' : 'max-h-[88vh] w-[960px] max-w-[calc(100vw-48px)] rounded-xl shadow-xl'} flex min-h-0 flex-col bg-white outline-none`}>
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E5E6EB] px-6 py-4"><div className="flex items-center gap-3">{inline && <button aria-label="返回商品工具" onClick={onClose}><ArrowLeft size={20} /></button>}<h2 id="store-delete-title" className="text-lg font-semibold text-[#1D2129]">删除门店商品</h2><span className="text-xs text-[#667085]">{result ? '处理结果' : step === 1 ? '选择门店与渠道商品' : '检查并确认'}</span></div><button aria-label="关闭删除窗口" onClick={onClose} className="rounded p-1 text-[#667085] hover:bg-[#F2F3F5]"><X size={20} /></button></div>
    <div className="min-h-0 flex-1 overflow-auto no-scrollbar p-6">
      {result ? <section role="status" className="space-y-4"><h3 className="text-base font-semibold text-[#1D2129]">演示结果：已完成 {result.success}，失败 {result.failed}，等待 {result.waiting}</h3><p className="text-sm text-[#4E5969]">仅完成的门店渠道商品已移除；失败或等待的企迈商品仍保留。主档、渠道库、模板、其他门店渠道及历史订单不受影响。</p><p className="break-all text-xs text-[#667085]">批次：{result.batch}；请在同步记录中查看对象级原因。平台删除不可一键撤销，重新售卖需重新建品；保留原外码和映射历史。</p><p className="text-xs text-[#667085]">当前为本地演示，没有执行真实平台删除。</p></section> : <>
      {step === 1 ? <>
        <div className="mb-4 flex flex-wrap gap-3"><WebStoreScopeSelector stores={storeOptions.map(([id, name]) => ({ id, name, code: id, organization: "现有门店", tags: [] }))} selectionMode="single" value={store === "all" ? [] : [store]} onChange={ids => setStore(ids[0] || "all")} widthClassName="w-[220px]" /><select aria-label="删除范围渠道" value={channel} onChange={e => setChannel(e.target.value)} className={control}><option value="all">全部渠道</option>{channelOptions.map(id => <option key={id} value={id}>{deletionChannelName(id)}</option>)}</select><label className="flex items-center gap-2"><Search size={16} className="text-[#667085]" /><input aria-label="搜索待删除商品" value={query} onChange={e => setQuery(e.target.value)} placeholder="商品名称 / ID" className={control} /></label></div>
        <p className="mb-3 text-xs text-[#667085]">选择已经生成的门店渠道商品，不会删除品牌商品资料。已选 {selected.length} 个门店渠道对象。</p>
        <table className="w-full text-left text-sm"><thead className="bg-[#F7F8FA] text-[#4E5969]"><tr><th className="p-3"><input aria-label="选择当前筛选全部商品" type="checkbox" checked={visible.length > 0 && visible.every(t => ids.includes(t.id))} onChange={e => setIds(prev => e.target.checked ? [...new Set([...prev, ...visible.map(t => t.id)])] : prev.filter(id => !visible.some(t => t.id === id)))} /></th><th className="p-3">商品</th><th className="p-3">门店</th><th className="p-3">渠道</th></tr></thead><tbody>{visible.map(t => <tr key={t.id} className="border-b border-[#F2F3F5]"><td className="p-3"><input type="checkbox" aria-label={`选择${t.storeName}${deletionChannelName(t.channel)}${t.name}`} checked={ids.includes(t.id)} onChange={e => setIds(prev => e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id))} /></td><td className="p-3 text-[#1D2129]">{t.name}<span className="block text-xs text-[#667085]">{t.type === 'Combo' ? '套餐商品' : '标准商品'}</span></td><td className="p-3 text-[#4E5969]">{t.storeName}</td><td className="p-3 text-[#4E5969]">{deletionChannelName(t.channel)}</td></tr>)}{!visible.length && <tr><td colSpan={4} className="p-8 text-center text-[#667085]">当前范围没有门店商品，请调整筛选。</td></tr>}</tbody></table>
      </> : <>
        <p className="mb-4 text-sm text-[#4E5969]">{new Set(selected.map(t => t.storeId)).size} 家门店 · {selected.length} 个渠道商品：{[...new Set(selected.map(t => deletionChannelName(t.channel)))].join('、')}</p>
        <fieldset className="space-y-3"><legend className="mb-3 text-sm font-semibold text-[#1D2129]">删除范围</legend>{([['qimai_only', '仅移除企迈门店渠道商品', '平台商品仍保留，可能继续售卖；请确认平台接单映射的后续处理。'], ['qimai_and_platform', '同时删除对应平台商品', '只处理已映射且由企迈管理的三方商品；平台确认删除后再移除企迈对象。']] as const).map(([id, label, tip]) => <label key={id} className="flex gap-3 text-sm"><input type="radio" name="delete-policy" checked={policy === id} onChange={() => { setPolicy(id); resetCheck(); }} className="mt-1" /><div><span className="font-medium text-[#1D2129]">{label}</span><p className="mt-1 text-xs leading-5 text-[#667085]">{tip}</p></div></label>)}</fieldset>
        <div className="my-5 flex flex-wrap items-center gap-3 border-y border-[#E5E6EB] py-4"><label className="text-xs text-[#667085]">演示校验结果 <select aria-label="演示删除校验场景" value={scenario} onChange={e => { setScenario(e.target.value as Scenario); resetCheck(); }} className={`${control} ml-2`}><option value="unknown">尚未核验</option><option value="clear">引用与映射已核验</option><option value="reference">仍被套餐 / 加料组引用</option><option value="expired">平台授权失效</option><option value="no_permission">没有删除权限</option><option value="pending">还有未完成任务</option></select></label><button disabled={checking} className="inline-flex items-center gap-1 text-sm text-[#008F4C] disabled:text-[#667085]" onClick={() => { setChecking(true); setTimeout(() => { setChecked(true); setChecking(false); }, 250); }}>{checking && <Loader2 size={14} className="animate-spin" />}检查删除影响</button></div>
        {checked && <div role="status" className="mb-4 space-y-2 text-sm">{issues.length ? issues.map((issue, i) => <p key={i} className="text-[#B42318]">{issue.target.storeName} · {deletionChannelName(issue.target.channel)} · {issue.target.name}：{issue.message}</p>) : <p className="text-[#008F4C]">演示检查通过，无引用冲突。不会连带删除共享子品或加料。</p>}</div>}
        {policy === 'qimai_and_platform' && <label className="mb-4 block text-xs text-[#667085]">演示平台执行结果 <select aria-label="演示删除执行结果" value={outcome} onChange={e => { setOutcome(e.target.value as typeof outcome); setConfirmed(false); }} className={`${control} ml-2`}><option value="waiting">平台处理中 / 等待回查</option><option value="partial">部分成功</option><option value="failed">平台失败</option><option value="success">回查确认已删除</option></select></label>}
        <div className="flex items-start gap-2 rounded bg-[#FFFAEB] p-3 text-xs leading-5 text-[#7A2E0E]"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><p>删除立即进入任务处理，不能一键撤销。仅影响选中的门店渠道；不删除主档、渠道库、模板、共享子品/加料和历史订单。失败或等待的对象仍保留，超时先回查再重试；恢复售卖需重新建品。</p></div>
        <label className="mt-4 flex items-start gap-2 text-sm text-[#4E5969]"><input type="checkbox" checked={confirmed} disabled={!checked || !!issues.length} onChange={e => setConfirmed(e.target.checked)} className="mt-1" /><span>{policy === 'qimai_only' ? '我已确认移除范围，并了解平台商品仍保留及接单映射风险。' : '我已确认平台删除范围、无法一键撤销及重新建品方式。'}</span></label>
      </>}
      </>}
    </div>
    <div className="flex shrink-0 items-center justify-between border-t border-[#E5E6EB] px-6 py-4"><span className="text-xs text-[#667085]">{result ? '操作及映射历史保留在批次中' : '生产提交前须重新核验权限、引用、版本与授权'}</span><div className="flex gap-3">{step === 2 && !result && <button onClick={() => { setStep(1); resetCheck(); }} className={control}>上一步</button>}<button onClick={onClose} className={control}>{result ? '完成' : '取消'}</button>{!result && (step === 1 ? <button disabled={!selected.length} onClick={() => setStep(2)} className="rounded bg-[#00B460] px-4 py-2 text-sm font-medium text-white disabled:bg-[#E5E6EB] disabled:text-[#667085]">下一步</button> : <button disabled={!checked || !!issues.length || !confirmed || checking} onClick={submit} className="inline-flex items-center gap-2 rounded bg-[#B42318] px-4 py-2 text-sm font-medium text-white disabled:bg-[#E5E6EB] disabled:text-[#667085]"><Trash2 size={15} />确认删除</button>)}</div></div>
  </div>;
  return inline ? content : createPortal(<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/35">{content}</div>, document.body);
};
