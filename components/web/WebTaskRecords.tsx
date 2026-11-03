import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, FileText, GitBranch, Info, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { useProducts } from '../../context';
import type { PublishBatch, PublishTask, TaskExecutionDetail, RecordView } from './WebPublishRecords';
import { displayValue, executeLocalTask, matchesTask, modeLabel, operationLabel, operationOf } from './taskModel';
import { demonstrationTasks, resolveTaskSource, saveTask, useTaskRepository } from './taskRepository';
import { WebStoreScopeSelector, type StoreScopeOption } from './WebStoreScopeSelector';
import { PRODUCT_SALES_SCOPE_STORES } from './WebProductSalesScope';
import { matchesAffectedStores, taskStoreRows } from './taskStoreFilter';
import './taskExperience.css';

const labels = { pending: '未执行', running: '执行中', waiting: '等待处理', success: '成功', partial: '部分成功', failed: '失败' };
export const TaskStatusTag = ({ status }: { status: keyof typeof labels }) => <span className={`task-status is-${status}`}>{status === 'success' ? <CheckCircle2 size={13} /> : status === 'failed' || status === 'partial' ? <AlertCircle size={13} /> : <Clock3 size={13} />}{labels[status]}</span>;
const text = (value?: string) => value || '--';
const subjectLabel = (batch: PublishBatch) => batch.configuration?.extension?.kind === 'category_sort' ? '分类' : batch.configuration?.extension?.kind === 'addon_sync' ? '加料' : '商品';
const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

// Production mapping: QmList + QmSearch + tree rows in QmListTable, overlay el-drawer.
export function WebTaskRecords({ batches, view, onViewChange, legacyDetails }: {
  batches: PublishBatch[]; view: RecordView; onViewChange?: (view: RecordView) => void;
  legacyDetails: (batch: PublishBatch, task: PublishTask, fields: any[]) => TaskExecutionDetail[];
}) {
  const { activeBrandId } = useProducts();
  const repository = useTaskRepository(activeBrandId);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [operation, setOperation] = useState('all');
  const [channel, setChannel] = useState('all');
  const [affectedStoreIds, setAffectedStoreIds] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string[]>(['DEMO-SYNC-001', 'DEMO-DELETE-004']);
  const [selection, setSelection] = useState<{ batchId: string; taskId?: string } | null>(null);
  const [tab, setTab] = useState('config');
  const [detailKeyword, setDetailKeyword] = useState('');
  const [detailStatus, setDetailStatus] = useState('all');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirm, setConfirm] = useState<{ batch: PublishBatch; taskId?: string; retry?: boolean } | null>(null);
  const [scenario, setScenario] = useState(new URLSearchParams(location.search).get('taskState') || 'normal');
  const closeButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const drawer = useRef<HTMLElement>(null);

  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    if (!selection) return;
    restoreFocus.current = document.activeElement as HTMLElement;
    closeButton.current?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (confirm) setConfirm(null); else setSelection(null); }
      if (event.key !== 'Tab' || confirm) return;
      const nodes = (Array.from(drawer.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,[tabindex="0"]') || []) as HTMLElement[]).filter(node => node.getBoundingClientRect().width);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handle);
    return () => { document.removeEventListener('keydown', handle); restoreFocus.current?.focus(); };
  }, [!!selection, !!confirm]);

  const all = useMemo(() => {
    const map = new Map<string, PublishBatch>();
    [...batches, ...demonstrationTasks(), ...repository.tasks].forEach(batch => map.set(batch.id, batch));
    return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [batches, repository.tasks]);
  const scoped = useMemo(() => {
    if (scenario === 'no-permission' || scenario === 'empty') return [];
    const visible = scenario === 'partial-permission' ? all.filter(batch => batch.id === 'DEMO-SYNC-001').map(batch => ({ ...batch, storeScope: '上海静安店', storeCount: 1, tasks: batch.tasks.filter(task => task.type === 'qimai').map(task => ({ ...task, storeCount: 1 })), details: batch.details?.filter(row => row.storeName === '上海静安店' && row.taskType === 'qimai') })) : all;
    return visible.map(batch => ({ ...batch, tasks: batch.tasks.filter(task => view === 'all' || task.type === view) })).filter(batch => batch.tasks.length);
  }, [all, view, scenario]);
  const channels = unique(scoped.flatMap(batch => batch.tasks.flatMap(task => task.channels)));
  const affectedStores = useMemo(() => {
    const stores = new Map<string, StoreScopeOption>();
    for (const batch of scoped) for (const row of taskStoreRows(batch)) {
      const known = PRODUCT_SALES_SCOPE_STORES.find(store => store.id === row.storeId);
      stores.set(row.storeId, known ? { ...known, name: row.storeName } : { id: row.storeId, name: row.storeName, code: row.storeId, organization: '任务记录门店', tags: [] });
    }
    return [...stores.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }, [scoped]);
  const filtered = scoped.filter(batch => {
    const term = keyword.trim().toLowerCase();
    return (!term || [batch.id, batch.title, batch.sourceName, batch.creator, batch.remark, ...batch.tasks.flatMap(task => [task.id, task.target])].some(value => value?.toLowerCase().includes(term)))
      && matchesAffectedStores(batch, affectedStoreIds, channel)
      && (status === 'all' || batch.status === status)
      && (operation === 'all' || operationOf(batch) === operation)
      && (channel === 'all' || batch.tasks.some(task => task.channels.includes(channel)))
      && (!from || batch.createdAt.slice(0, 10) >= from) && (!to || batch.createdAt.slice(0, 10) <= to);
  });
  useEffect(() => { setPage(1); }, [keyword, status, operation, channel, affectedStoreIds, from, to, view]);
  const current = filtered.slice((page - 1) * 8, page * 8);
  const selected = scoped.find(batch => batch.id === selection?.batchId);
  const selectedTask = selected?.tasks.find(task => task.id === selection?.taskId);
  const selectedTasks = selected ? selectedTask ? [selectedTask] : selected.tasks : [];
  const details = selected ? selected.details ? selected.details.filter(row => selectedTasks.some(task => matchesTask(row, task))) : selectedTasks.flatMap(task => legacyDetails(selected, task, [])) : [];
  const visibleDetails = details.filter(row => (!detailKeyword || `${row.productName} ${row.productId} ${row.skuName} ${row.storeName} ${row.channel}`.includes(detailKeyword)) && (detailStatus === 'all' || row.status === detailStatus));
  const config = selected?.configuration;
  const objectTypeName = config?.extension?.kind === 'category_sort' ? '分类' : config?.extension?.kind === 'addon_sync' ? '加料' : '商品';
  const isNonProduct = objectTypeName !== '商品';
  const resolve = (batch: PublishBatch, id: string) => {
    return resolveTaskSource(activeBrandId, batch, id);
  };
  const open = (batchId: string, taskId?: string) => { setSelection({ batchId, taskId }); setTab('config'); setDetailKeyword(''); setDetailStatus('all'); };
  const refresh = () => { setRefreshing(true); repository.reload(); setTimeout(() => { setRefreshing(false); setNotice('已更新任务记录'); }, 300); };
  const run = async () => {
    if (!confirm || busy) return;
    const input = confirm; setBusy(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 450));
      const result = executeLocalTask(input.batch, id => resolve(input.batch, id), input.taskId, input.retry);
      saveTask(activeBrandId, result); setConfirm(null);
      setNotice(result.status === 'failed' || result.status === 'partial' ? '处理已结束，请查看失败原因' : '本地演示任务执行完成，已保留实际使用数据');
    } catch (error) { setNotice(error instanceof Error ? error.message : '任务执行失败，配置已保留'); }
    finally { setBusy(false); }
  };
  const executeButton = (batch: PublishBatch, task?: PublishTask) => {
    const state = task?.status || batch.status;
    if (state === 'pending' && batch.executionMode === 'manual') return <button className="task-link" onClick={() => setConfirm({ batch, taskId: task?.id })}>执行</button>;
    if ((state === 'failed' || state === 'partial') && batch.configuration?.demoSource) return <button className="task-link" onClick={() => setConfirm({ batch, taskId: task?.id, retry: true })}>重试失败项</button>;
    return null;
  };
  const stateError = repository.error || (scenario === 'error' ? '任务记录加载失败，请重试。已保存配置不会丢失。' : '');

  return <div className="task-experience">
    <div className="task-list-surface">
      <div className="task-status-toolbar">
      <div className="task-state-tabs" role="tablist" aria-label="任务状态">{[['all', '全部任务'], ['pending', '未执行'], ['running', '执行中'], ['partial', '部分成功'], ['failed', '失败'], ['success', '成功']].map(([id, label]) => <button role="tab" aria-selected={status === id} key={id} onClick={() => setStatus(id)}>{label}<span>{id === 'all' ? scoped.length : scoped.filter(batch => batch.status === id).length}</span></button>)}</div>
        <button className="task-button task-refresh" onClick={refresh} disabled={refreshing}><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />刷新</button>
      </div>
      <div className="task-filters"><label className="task-search"><Search size={16} /><input aria-label="搜索任务" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="任务编号、名称、来源、操作人或备注" /></label><select aria-label="任务类型" value={operation} onChange={event => setOperation(event.target.value)}><option value="all">全部任务类型</option>{Object.entries(operationLabel).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><select aria-label="渠道筛选" value={channel} onChange={event => setChannel(event.target.value)}><option value="all">全部渠道</option>{channels.map(name => <option key={name}>{name}</option>)}</select><div className="task-store-filter" role="group" aria-label="影响门店筛选"><span>影响门店</span><WebStoreScopeSelector stores={affectedStores} value={affectedStoreIds} onChange={setAffectedStoreIds} widthClassName="w-[170px]" />{affectedStoreIds.length > 0 && <button className="task-link muted" aria-label="清空门店筛选" onClick={() => setAffectedStoreIds([])}><X size={14} /></button>}</div><label className="task-date-filter">创建时间<input type="date" aria-label="创建开始日期" value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} /><span>至</span><input type="date" aria-label="创建结束日期" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} /></label><button className="task-link muted" onClick={() => { setKeyword(''); setAffectedStoreIds([]); setOperation('all'); setChannel('all'); setStatus('all'); setFrom(''); setTo(''); }}>重置</button></div>
      <div className="task-list-caption"><span><GitBranch size={14} />主任务保留统一配置，子任务按执行目标独立查看</span><button className="task-link muted" onClick={() => setExpanded(current.every(batch => expanded.includes(batch.id)) ? [] : current.map(batch => batch.id))}>{current.length > 0 && current.every(batch => expanded.includes(batch.id)) ? '收起本页子任务' : '展开本页子任务'}</button></div>
      {scenario === 'partial-permission' && <div className="task-inline-info"><Info size={15} />当前仅展示你有权访问的门店与渠道，数量按可见范围计算。</div>}
      {scenario === 'no-permission' ? <div className="task-empty"><AlertCircle /><h3>暂无任务查看权限</h3><p>请联系管理员开通页面及对应商品库、门店的数据权限。</p></div> : stateError ? <div className="task-empty"><AlertCircle /><h3>任务记录暂时无法加载</h3><p>{stateError}</p><button className="task-button" onClick={() => { setScenario('normal'); refresh(); }}>重新加载</button></div> : scenario === 'loading' ? <div className="task-empty" role="status"><Loader2 className="animate-spin" /><p>正在加载任务记录…</p></div> : scenario === 'empty' || !filtered.length ? <div className="task-empty"><FileText /><h3>{scenario === 'empty' ? '还没有商品任务' : '没有符合条件的任务'}</h3><p>{scenario === 'empty' ? '创建下发、批量修改、复制或删除任务后，可在这里查看。' : '调整筛选条件，或按任务备注查找。'}</p>{scenario !== 'empty' && <button className="task-button" onClick={() => { setKeyword(''); setAffectedStoreIds([]); setStatus('all'); setOperation('all'); setChannel('all'); setFrom(''); setTo(''); }}>清空筛选</button>}</div> : <div className="task-table-scroll" tabIndex={0} aria-label="任务列表，可横向滚动"><table className="task-tree-table"><colgroup><col style={{ width: 288 }} /><col style={{ width: 204 }} /><col style={{ width: 160 }} /><col style={{ width: 108 }} /><col style={{ width: 142 }} /><col style={{ width: 175 }} /><col style={{ width: 115 }} /></colgroup><thead><tr><th>任务 / 执行目标</th><th>来源与范围</th><th>执行方式 / 计划时间</th><th>状态</th><th>创建信息</th><th>任务备注</th><th className="task-sticky-action">操作</th></tr></thead><tbody>{current.map(batch => <React.Fragment key={batch.id}>
        <tr className="task-parent-row" data-task-id={batch.id}><td><div className="task-parent-name"><button className="task-expand" aria-label={`${expanded.includes(batch.id) ? '收起' : '展开'}${batch.title}`} aria-expanded={expanded.includes(batch.id)} onClick={() => setExpanded(expanded.includes(batch.id) ? expanded.filter(id => id !== batch.id) : [...expanded, batch.id])}>{expanded.includes(batch.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button><div><strong>{batch.title}</strong><small>{batch.id}</small><span className="task-subline">{operationLabel[operationOf(batch)]} · {batch.tasks.length} 个子任务</span></div></div></td><td><div className="task-clamp" title={batch.sourceName}>{batch.sourceName}</div><small className="task-clamp" title={batch.storeScope}>{batch.storeCount ? `${batch.storeCount} 家门店 · ` : ''}{batch.storeScope}</small><small>{batch.productCount} 个{subjectLabel(batch)}{!batch.configuration?.extension ? ` · ${batch.skuCount} 个 SKU` : ''}</small></td><td>{batch.executionMode ? modeLabel[batch.executionMode] : '立即执行'}<small>{batch.executionMode === 'scheduled' ? batch.scheduledAt?.replace('T', ' ') || '--' : batch.executionMode === 'manual' && batch.status === 'pending' ? '等待手动触发' : '--'}</small></td><td><TaskStatusTag status={batch.status} /></td><td><span>{batch.createdAt.slice(0, 10)}</span><small>{batch.createdAt.slice(11)} · {batch.creator}</small></td><td><div className="task-clamp task-remark-preview" title={batch.remark || '无备注'}>{text(batch.remark)}</div></td><td className="task-sticky-action"><div className="task-row-actions"><button className="task-link" onClick={() => open(batch.id)}>查看配置</button>{executeButton(batch)}</div></td></tr>
        {expanded.includes(batch.id) && batch.tasks.map((task, index) => <tr className="task-child-row" key={task.id} data-subtask-id={task.id}><td><div className="task-child-name"><span className={`task-branch ${index === batch.tasks.length - 1 ? 'last' : ''}`} /><div><span>{task.target}</span><small>{task.id}</small></div></div></td><td><span className="task-clamp" title={task.channels.join('、')}>{task.channels.join('、')}</span><small>{task.storeCount ? `${task.storeCount} 家门店 · ` : '品牌级 · '}{task.productCount} 个{subjectLabel(batch)}</small></td><td><small>{task.status === 'pending' ? '尚未开始' : task.startedAt || '--'}</small></td><td><TaskStatusTag status={task.status} /></td><td colSpan={2}>{task.status === 'pending' ? <span className="task-child-outcome">尚未执行，可先核对配置</span> : <div className="task-child-outcome">成功 <b>{task.successCount}</b><span>失败 <b className={task.failedCount ? 'task-danger' : ''}>{task.failedCount}</b></span><span>等待 <b>{task.waitingCount}</b></span>{task.error && <small className="task-danger task-clamp" title={task.error}>{task.error}</small>}</div>}</td><td className="task-sticky-action"><div className="task-row-actions"><button className="task-link" onClick={() => open(batch.id, task.id)}>查看详情</button>{executeButton(batch, task)}</div></td></tr>)}
      </React.Fragment>)}</tbody></table></div>}
      <div className="task-pagination"><span>共 {filtered.length} 个主任务 · 子任务不重复计数</span><div><button aria-label="上一页" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={15} /></button><span>{page} / {Math.max(1, Math.ceil(filtered.length / 8))}</span><button aria-label="下一页" disabled={page * 8 >= filtered.length} onClick={() => setPage(page + 1)}><ChevronRight size={15} /></button></div></div>
    </div>
    {notice && createPortal(<div className="task-toast" role="status"><Info size={16} />{notice}</div>, document.body)}
    {selected && selection && createPortal(<div className="task-overlay"><button className="task-overlay-shade" aria-label="关闭任务详情遮罩" onClick={() => setSelection(null)} /><section ref={drawer} className="task-drawer" role="dialog" aria-modal="true" aria-labelledby="task-detail-title"><header><div>{selectedTask && <button className="task-link task-back" onClick={() => open(selected.id)}><ArrowLeft size={14} />主任务配置</button>}<h2 id="task-detail-title">{selectedTask ? '子任务详情' : '任务配置'} <TaskStatusTag status={selectedTask?.status || selected.status} /></h2><p>{selectedTask?.target || selected.title}<span>{selectedTask?.id || selected.id}</span></p></div><button ref={closeButton} aria-label="关闭任务详情" className="task-icon-button" onClick={() => setSelection(null)}><X size={20} /></button></header>
      <div className="task-detail-meta"><div><span>任务类型</span><strong>{operationLabel[operationOf(selected)]}</strong></div><div><span>执行方式</span><strong>{modeLabel[selected.executionMode || 'now']}</strong></div><div><span>计划执行时间</span><strong>{text(selected.scheduledAt?.replace('T', ' '))}</strong></div><div><span>创建人 / 时间</span><strong>{selected.creator} · {selected.createdAt}</strong></div><div className="task-detail-remark"><span>任务备注</span><p>{text(selected.remark)}</p></div></div>
      <nav className="task-detail-tabs" aria-label="任务详情内容">{[['config', '任务配置'], ['objects', '对象与范围'], ['results', '执行结果']].map(([id, label]) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>
      <div className="task-drawer-body">
      {tab === 'config' && <>
        {!config ? <div className="task-inline-info"><Info size={16} />历史演示记录未保存完整原始配置，下方仅展示已有字段记录，不使用当前商品资料补造。</div> : <>
          {(operationOf(selected) === 'sync' || operationOf(selected) === 'copy') && <div className="task-inline-info"><Info size={16} /><span>执行时读取来源的最新数据；本任务明确修改的属性优先，未修改属性使用来源最新值。选择的对象范围保持不变。</span></div>}
          <section className="task-detail-section"><h3>{operationOf(selected) === 'delete' ? '删除设置' : operationOf(selected) === 'copy' ? '复制设置' : '来源与处理方式'}</h3><dl><div><dt>数据来源</dt><dd>{config.source.name}</dd></div>{config.settings?.map((setting, index) => <div key={index}><dt>{setting.label}</dt><dd>{setting.value}</dd></div>)}</dl></section>
        </>}
        {config?.extension && <section className="task-detail-section"><h3>{config.extension.kind === 'category_sort' ? '分类排序明细' : config.extension.kind === 'addon_sync' ? '加料同步明细' : '关联门店商品处理'}</h3><p>{config.extension.kind === 'category_sort' ? '只更新分类排序，不覆盖商品资料或商品排序。' : config.extension.kind === 'addon_sync' ? '加料资料同步与商品关联加料、上下架操作分别处理。' : '按触发时记录的已有门店商品范围处理；未关联门店商品不生成任务。'}</p><table className="task-detail-table"><thead><tr><th>对象 / ID</th>{config.fields.map(field => <th key={field}>{field}</th>)}</tr></thead><tbody>{config.extension.subjects.filter(subject => !selectedTask || details.some(row => row.productId === subject.id)).map(subject => <tr key={subject.id}><td>{subject.name}<small>{subject.id}</small></td>{config.fields.map(field => <td key={field}>{displayValue(subject.values[field])}</td>)}</tr>)}</tbody></table></section>}
        {operationOf(selected) === 'sync' && <section className="task-detail-section"><h3>相同商品覆盖属性 <span>{config?.fields.length ?? selected.fieldSnapshots?.length ?? 0} 项</span></h3><p>新商品按来源资料创建；相同商品仅覆盖已勾选属性。</p><div className="task-field-chips">{(config?.fields || selected.fieldSnapshots?.map(field => field.name) || []).map(field => <span key={field}><Check size={12} />{field}</span>)}</div></section>}
        {operationOf(selected) === 'batch' && <section className="task-detail-section"><h3>本次批量修改属性</h3><p>仅执行本次明确设置的属性，未修改属性保持原值。</p><div className="task-field-chips">{(config?.fields || selected.fieldSnapshots?.map(field => field.name) || []).map(field => <span key={field}><Check size={12} />{field}</span>)}</div></section>}
        {config && ['sync', 'batch', 'copy'].includes(operationOf(selected)) && <section className="task-detail-section"><h3>{operationOf(selected) === 'batch' ? '商品修改明细' : '任务差异修改'}<span>空值、0 和关闭状态均保留</span></h3><div className="task-detail-table-scroll"><table className="task-detail-table"><thead><tr><th>商品</th><th>属性</th><th>任务设置值</th><th>{selected.executedAt ? '实际执行使用值' : '来源当前值（参考）'}</th></tr></thead><tbody>{config.products.flatMap(product => Object.entries(config.overrides[product.id] || {}).map(([field, value]) => {
          const result = details.find(row => row.productId === product.id && row.executedValues)?.executedValues;
          return <tr key={`${product.id}-${field}`}><td>{product.name}<small>{product.id}</small></td><td>{field}</td><td className="task-override-value">{displayValue(value)}</td><td>{displayValue(selected.executedAt ? result?.[field] : resolve(selected, product.id)?.[field])}</td></tr>;
        }))}{!Object.values(config.overrides).some(values => Object.keys(values).length) && <tr><td colSpan={4} className="task-table-empty">未设置差异修改{operationOf(selected) !== 'batch' ? '，执行时读取来源最新数据' : ''}</td></tr>}</tbody></table></div></section>}
        {!config && selected.fieldSnapshots?.length > 0 && <section className="task-detail-section"><h3>已有字段记录</h3><dl>{selected.fieldSnapshots.map((field, i) => <div key={i}><dt>{field.name}</dt><dd>{field.after || '--'}</dd></div>)}</dl></section>}
        {!selectedTask && <section className="task-detail-section"><h3>子任务 <span>{selected.tasks.length} 个</span></h3><div className="task-detail-subtasks">{selected.tasks.map(task => <button key={task.id} onClick={() => open(selected.id, task.id)}><div><strong>{task.target}</strong><small>{task.channels.join('、')} · {task.id}</small></div><TaskStatusTag status={task.status} /><ArrowRight size={15} /></button>)}</div></section>}
      </>}
      {tab === 'objects' && <><section className="task-detail-section"><h3>渠道与门店</h3><dl><div><dt>渠道</dt><dd>{unique(selectedTasks.flatMap(task => task.channels)).join('、')}</dd></div><div><dt>门店范围</dt><dd>{selected.storeScope}</dd></div></dl></section><section className="task-detail-section"><h3>已选择{config?.extension?.kind === 'category_sort' ? '分类' : config?.extension?.kind === 'addon_sync' ? '加料' : '对象'}</h3><p>按任务保存的对象与 SKU 展示，不自动加入后来新增的商品或门店。</p><table className="task-detail-table"><thead><tr><th>{objectTypeName}</th><th>对象 ID</th>{!isNonProduct && <th>SKU</th>}</tr></thead><tbody>{config?.products.map(product => <tr key={product.id}><td>{product.name}</td><td>{product.id}</td>{!isNonProduct && <td>{product.skus.map(sku => `${sku.name}（${sku.id}）`).join('、') || '--'}</td>}</tr>)}{!config && <tr><td colSpan={3}>历史任务未保存完整对象配置，请查看已有执行明细。</td></tr>}</tbody></table></section><section className="task-detail-section"><h3>门店清单</h3><div className="task-field-chips">{unique(details.map(row => row.storeName)).map(store => <span key={store}>{store}</span>)}</div></section></>}
      {tab === 'results' && <>
        {selectedTasks.every(task => task.status === 'pending') ? <div className="task-empty task-pending-empty"><Clock3 size={32} /><h3>任务尚未执行</h3><p>{selected.executionMode === 'manual' ? '等待手动触发，可先核对已保存的任务配置。' : `计划于 ${selected.scheduledAt?.replace('T', ' ')} 执行，可先核对配置。`}</p><button className="task-button" onClick={() => setTab('config')}>查看任务配置</button></div> : <><div className="task-result-summary">{selectedTask ? selectedTask.target : '全部子任务'}<span>成功 <b>{selectedTasks.reduce((n, task) => n + task.successCount, 0)}</b></span><span>失败 <b className="task-danger">{selectedTasks.reduce((n, task) => n + task.failedCount, 0)}</b></span><span>等待 <b>{selectedTasks.reduce((n, task) => n + task.waitingCount, 0)}</b></span></div><div className="task-result-filters"><label className="task-search"><Search size={15} /><input aria-label="搜索执行明细" placeholder={isNonProduct ? `${objectTypeName}、门店或渠道` : '商品、SKU、门店或渠道'} value={detailKeyword} onChange={event => setDetailKeyword(event.target.value)} /></label><select aria-label="执行结果筛选" value={detailStatus} onChange={event => setDetailStatus(event.target.value)}><option value="all">全部结果</option>{Object.entries(labels).filter(([id]) => id !== 'partial').map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
        <div className="task-detail-table-scroll"><table className="task-detail-table task-result-table"><thead><tr><th>{isNonProduct ? objectTypeName : '商品 / SKU'}</th><th>门店 / 渠道</th><th>执行内容</th><th>结果 / 原因</th><th>完成时间</th></tr></thead><tbody>{visibleDetails.slice(0, 100).map(row => <tr key={row.id}><td>{row.productName}<small>{row.skuName || row.productId}</small></td><td>{row.storeName}<small>{row.channel}</small></td><td>{row.action}<small>{row.fields.join('、') || '--'}</small>{row.executedValues && <details><summary>实际使用数据</summary>{Object.entries(row.executedValues).filter(([field]) => ['商品名称', '售价', ...(config?.fields || [])].includes(field)).map(([field, value]) => <p key={field}>{field}：{displayValue(value)}</p>)}</details>}</td><td><TaskStatusTag status={row.status} />{row.error && <p className="task-danger">{row.error}</p>}</td><td>{text(row.finishedAt)}</td></tr>)}</tbody></table>{!visibleDetails.length && <div className="task-empty"><FileText /><p>没有符合条件的执行明细</p></div>}</div><p className="task-table-note">当前显示 {Math.min(100, visibleDetails.length)} / {visibleDetails.length} 条{!selected.details ? ' · 历史演示样例，不代表完整生产明细' : ''}</p></>}
      </>}
      </div><footer><span>{selected.configuration?.demoSource ? '独立演示样例，不调用生产接口' : '本地演示记录；平台结果以真实接口接入为准'}</span><div>{!selectedTask && selected.configuration?.demoSource && selected.status === 'pending' && selected.executionMode === 'scheduled' && <button className="task-button" onClick={() => setConfirm({ batch: selected })}>模拟到时执行</button>}{executeButton(selected, selectedTask)}<button className="task-button" onClick={() => setSelection(null)}>关闭</button></div></footer>
    </section></div>, document.body)}
    {confirm && createPortal(<TaskRunConfirmation busy={busy} batch={confirm.batch} retry={confirm.retry} onCancel={() => setConfirm(null)} onConfirm={run} />, document.body)}
  </div>;
}

function TaskRunConfirmation({ batch, retry, busy, onCancel, onConfirm }: { batch: PublishBatch; retry?: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) { event.stopImmediatePropagation(); onCancel(); }
      if (event.key === 'Tab') {
        const buttons = Array.from(box.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []) as HTMLButtonElement[];
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
      }
    }; document.addEventListener('keydown', handle, true); return () => document.removeEventListener('keydown', handle, true);
  }, [busy]);
  return <div className="task-confirm-overlay"><div className="task-confirm" ref={box} role="alertdialog" aria-modal="true" aria-labelledby="task-run-title"><h2 id="task-run-title">{retry ? '重试失败项' : '确认执行演示任务'}</h2><p>{batch.title}</p><dl><div><dt>范围</dt><dd>{batch.storeScope} · {batch.channels.join('、')}</dd></div><div><dt>生效时间</dt><dd>本次确认后执行</dd></div><div><dt>处理方式</dt><dd>{retry ? '只处理失败明细，成功对象不重复执行。' : '读取当前来源数据，任务差异值优先。'}</dd></div></dl>{operationOf(batch) === 'delete' && <p className="task-danger">删除无法一键撤销；恢复售卖需重新建品。保留操作记录及失败原因。</p>}<p className="task-table-note">仅更新本地演示执行记录，不调用生产接口。</p><footer><button className="task-button" disabled={busy} onClick={onCancel}>取消</button><button className="task-button primary" disabled={busy} onClick={onConfirm}>{busy && <Loader2 size={14} className="animate-spin" />}{busy ? '处理中…' : '确认执行'}</button></footer></div></div>;
}
