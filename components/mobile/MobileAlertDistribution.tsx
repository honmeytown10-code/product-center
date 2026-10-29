import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, LoaderCircle, PackageSearch } from 'lucide-react';
import type { DemoScenario, DemoState, DistributionTask } from './mappingAlertDemo';
import { lookupLibrarySku, lookupLibraryTradeMark, type LibrarySkuLookup } from './mappingAlertCatalog';

export interface DistributionTarget {
  alertId: string;
  storeId: string;
  storeName: string;
  channelId: string;
  channelName: string;
  lookupBy: 'skuid' | 'trade-mark';
  lookupValue: string;
  sourceName: string;
  sourceSpec: string;
}
const timeLabel = (time: number) => new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(time);

export const MobileAlertDistribution: React.FC<{
  target: DistributionTarget;
  state: DemoState;
  getLatestState: () => DemoState;
  onSave: (state: DemoState) => void;
  scenario: DemoScenario;
  onBack: () => void;
  onDone: () => void;
}> = ({ target, state, getLatestState, onSave, scenario, onBack, onDone }) => {
  const byTradeMark = target.lookupBy === 'trade-mark';
  const existingTask = state.distributions.find(task => task.alertId === target.alertId);
  const [view, setView] = useState<'lookup' | 'result'>(existingTask ? 'result' : 'lookup');
  const [taskId, setTaskId] = useState(existingTask?.id ?? '');
  const [query, setQuery] = useState<LibrarySkuLookup | { status: 'loading' | 'error' }>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [issue, setIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failedOnce = useRef(false);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    setQuery({ status: 'loading' });
    const lookupTimer = setTimeout(() => {
      if (scenario === 'library-error' && attempt === 0) setQuery({ status: 'error' });
      else setQuery(byTradeMark ? lookupLibraryTradeMark(target.lookupValue) : lookupLibrarySku(target.lookupValue));
    }, 250);
    return () => clearTimeout(lookupTimer);
  }, [target.lookupBy, target.lookupValue, scenario, attempt]);

  const match = query.status === 'found' ? query : null;
  const task = state.distributions.find(item => item.id === taskId);
  const blocked = scenario === 'read-only' || scenario === 'expired';
  const blockedText = scenario === 'read-only' ? '没有该门店的商品添加权限，请联系有权限的品牌工作人员。' : '该门店渠道授权已失效，请先到 PC 恢复连接。';
  const valid = !!match?.product.ready && !blocked;
  const run = (done: () => void) => {
    if (lock.current) return;
    lock.current = true; setSubmitting(true);
    timer.current = setTimeout(() => { lock.current = false; setSubmitting(false); done(); }, 450);
  };
  const submit = () => {
    if (!match || !valid) return;
    run(() => {
      const latest = getLatestState();
      const duplicate = latest.distributions.find(item => item.storeId === target.storeId && item.channelId === target.channelId
        && item.skuIds.includes(match.sku.id) && item.status !== 'failed');
      if (duplicate) { onSave(latest); setTaskId(duplicate.id); setView('result'); return; }
      if (scenario === 'error' && !failedOnce.current) {
        failedOnce.current = true; setIssue('添加任务提交失败，请重试。'); return;
      }
      if (scenario === 'conflict') { setIssue('门店渠道商品已发生变化，请返回告警重新确认，避免重复添加。'); return; }
      const nextTask: DistributionTask = {
        id: 'DIST' + Date.now(), alertId: target.alertId, productId: match.product.id, productName: match.product.name,
        libraryName: match.product.libraryName, skuIds: match.product.skus.map(sku => sku.id),
        orderSkuId: byTradeMark ? '' : target.lookupValue,
        ...(byTradeMark ? { orderTradeMark: target.lookupValue, matchedSkuId: match.sku.id } : {}),
        storeId: target.storeId, storeName: target.storeName, channelId: target.channelId, channelName: target.channelName,
        status: 'waiting', createdAt: Date.now(),
      };
      onSave({ ...latest, distributions: [nextTask, ...latest.distributions] });
      setTaskId(nextTask.id); setIssue(''); setView('result');
    });
  };
  const refresh = () => {
    if (!task || task.status !== 'waiting') return;
    run(() => {
      const latest = getLatestState();
      onSave({ ...latest, distributions: latest.distributions.map(item => item.id === task.id && item.status === 'waiting'
        ? scenario === 'error' && !item.retried ? { ...item, status: 'failed', reason: '渠道商品写入超时，请重试。' }
          : { ...item, status: 'success', reason: undefined } : item) });
    });
  };
  const retry = () => {
    if (!task || task.status !== 'failed' || blocked) return;
    run(() => {
      const latest = getLatestState();
      onSave({ ...latest, distributions: latest.distributions.map(item => item.id === task.id && item.status === 'failed'
        ? { ...item, status: 'waiting', retried: true, reason: undefined } : item) });
    });
  };
  return <>
    <header className="ma-header"><button className="ma-icon-button" aria-label="返回" disabled={submitting} onClick={onBack}><ArrowLeft size={21} /></button><h1>{view === 'result' ? '商品添加结果' : byTradeMark && (query.status === 'missing' || query.status === 'ambiguous') ? '处理指引' : '添加门店商品'}</h1></header>
    <div className={'ma-content' + (view === 'result' ? ' ma-result' : '')}>
      {view === 'lookup' && <>
        <div className="ma-warning"><AlertTriangle size={18} /><div><h2>本店渠道未找到订单商品</h2><p>{target.storeName} · {target.channelName}</p><p>{byTradeMark ? '商品标识' : '商品 skuid'}：{target.lookupValue}</p></div></div>
        {blocked && <div className="ma-inline-issue" role="status">{blockedText}</div>}
        {issue && <div className="ma-inline-issue" role="alert">{issue}</div>}
        {query.status === 'loading' && <div className="ma-empty" role="status"><LoaderCircle size={28} className="animate-spin" /><h2>正在查询商品库</h2></div>}
        {query.status === 'error' && <section className="ma-section ma-empty" role="alert"><AlertTriangle size={30} /><h2>商品库查询失败</h2><p>暂时无法确认该{byTradeMark ? '商品标识' : ' skuid'}对应的商品，请重试。</p><button className="ma-link" onClick={() => setAttempt(value => value + 1)}>重新查询</button></section>}
        {query.status === 'missing' && <section className="ma-section ma-empty" role="status"><PackageSearch size={30} /><h2>{byTradeMark ? '此商品标识未匹配到商品' : '商品库中未找到此商品'}</h2><p>{byTradeMark ? '本店渠道和商品库均未匹配到此标识，请检查企迈商品是否正确维护了商品标识。' : '请检查三方订单中的商品 skuid 是否准确。'}</p><p className="ma-secondary">订单商品：{target.sourceName} · {target.sourceSpec}</p></section>}
        {query.status === 'ambiguous' && <section className="ma-section ma-empty" role="alert"><AlertTriangle size={30} /><h2>该{byTradeMark ? '商品标识' : ' skuid'}对应多个商品</h2><p>请到商品库核对{byTradeMark ? '商品标识' : ' skuid'}，暂不能直接添加。</p></section>}
        {match && <>
          <section className="ma-section" data-library-match="true"><h2 className="ma-section-label">商品库中已找到</h2><div className="ma-product-row"><div className="ma-product-image"><PackageSearch size={23} /></div><div className="ma-product-copy"><h3>{match.product.name}</h3><p>规格：{match.sku.spec}</p><p>{byTradeMark ? '商品标识：' + match.sku.tradeMark : 'skuid：' + match.sku.id}</p></div></div>
            {!match.product.ready && <p className="ma-secondary ma-unavailable">商品资料不完整，请先到商品库完善后再添加。</p>}
          </section>
          <section className="ma-section"><h2 className="ma-section-label">添加到</h2><Row label="门店" value={target.storeName} /><Row label="渠道" value={target.channelName} />
            <details className="ma-guide-values"><summary>商品范围：1 个商品 · {match.product.skus.length} 个 SKU</summary>{match.product.skus.map(sku => <Row key={sku.id} label={sku.spec} value={byTradeMark ? sku.tradeMark ?? '未维护商品标识' : sku.id} />)}</details>
          </section>
          <p className="ma-footnote">仅添加到本店该渠道，已有商品不覆盖。历史订单不自动重试。</p>
        </>}
      </>}
      {view === 'result' && task && <>
        <div className={'ma-result-icon' + (task.status === 'waiting' ? ' is-pending' : '')}>{task.status === 'waiting' ? <Clock3 size={30} /> : task.status === 'failed' ? <AlertTriangle size={30} /> : <CheckCircle2 size={32} />}</div>
        <h2>{task.status === 'waiting' ? '商品添加处理中' : task.status === 'failed' ? '商品添加失败' : '门店渠道商品已补齐'}</h2>
        <p>{task.storeName} · {task.channelName}</p>
        <section className="ma-section ma-result-details"><Row label="任务编号" value={task.id} /><Row label="创建时间" value={timeLabel(task.createdAt)} /><Row label="添加商品" value={task.productName} /><Row label="SKU 数量" value={String(task.skuIds.length)} /><Row label={task.orderTradeMark ? '商品标识' : '商品 skuid'} value={task.orderTradeMark ?? task.orderSkuId} />
          {!task.orderTradeMark && <details className="ma-guide-values"><summary>查看全部添加 SKU</summary>{task.skuIds.map(id => <p className="ma-secondary" key={id}>{id}</p>)}</details>}
          {task.status === 'waiting' && <button className="ma-link" disabled={submitting} onClick={refresh}>{submitting ? '刷新中' : '刷新进度'}</button>}
          {task.reason && <p className="ma-secondary ma-unavailable" role="alert">{task.reason}</p>}
        </section>
        <p className="ma-footnote">演示任务，点击刷新推进结果。不自动重试历史订单。</p>
      </>}
    </div>
    <footer className="ma-footer">
      {view === 'lookup' && match && <button className="ma-primary-button" disabled={!valid || submitting} onClick={submit}>{submitting && <LoaderCircle size={16} className="animate-spin" />}{submitting ? '提交中' : '确认添加到门店'}</button>}
      {view === 'lookup' && !match && <button className="ma-primary-button" onClick={onDone}>返回告警中心</button>}
      {view === 'result' && <>{task?.status === 'failed' && <button className="ma-secondary-button" disabled={blocked || submitting} onClick={retry}>{submitting ? '提交中' : '重试添加'}</button>}<button className="ma-primary-button" disabled={submitting} onClick={onDone}>返回告警中心</button></>}
    </footer>
  </>;
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="ma-result-row"><span>{label}</span><strong>{value}</strong></div>;
