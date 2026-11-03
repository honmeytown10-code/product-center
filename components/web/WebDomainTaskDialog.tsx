import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useProducts } from '../../context';
import { WebTaskRemark, WebTaskTiming } from './WebTaskFields';
import { WebStoreScopeSelector } from './WebStoreScopeSelector';
import { PRODUCT_SALES_SCOPE_STORES } from './WebProductSalesScope';
import { createExtendedTask, extendedNames, rememberDomainSource, type TaskSubject } from './extendedTasks';
import { saveTask } from './taskRepository';
import type { ExecutionMode } from './taskModel';

export function WebDomainTaskDialog({ kind, subjects, onClose, onSaved }: { kind: 'category_sort' | 'addon_sync'; subjects: TaskSubject[]; onClose: () => void; onSaved: () => void }) {
  const { activeBrandId } = useProducts();
  const [ids, setIds] = useState<string[]>(kind === 'category_sort' ? subjects.map(s => s.id) : []);
  const [stores, setStores] = useState<string[]>(kind === 'category_sort' ? PRODUCT_SALES_SCOPE_STORES.map(s => s.id) : []);
  const [channels, setChannels] = useState<string[]>(['POS', '小程序堂食', '小程序外卖']);
  const [mode, setMode] = useState<ExecutionMode>('now'), [at, setAt] = useState(''), [remark, setRemark] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement;
    dialog.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab') return;
      const nodes = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea,select') || []) as HTMLElement[];
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key); return () => { document.removeEventListener('keydown', key); prior?.focus(); };
  }, [busy]);
  const toggle = (items: string[], id: string) => items.includes(id) ? items.filter(x => x !== id) : [...items, id];
  return createPortal(<div className="task-confirm-overlay"><section ref={dialog} tabIndex={-1} className="task-confirm" role="dialog" aria-modal="true" aria-label={extendedNames[kind]} style={{ width: 760, maxHeight: '90vh', overflow: 'auto' }}><h2>{extendedNames[kind]}</h2><p>{kind === 'category_sort' ? '同步至全部模板和全部门店，仅更新分类排序。' : '选择需要同步的品牌加料，不修改商品关联加料、默认值或购买规则。'}</p>
    <div style={{ maxHeight: 240, overflow: 'auto' }}><table className="task-detail-table"><thead><tr><th>{kind === 'addon_sync' ? '选择' : '范围'}</th><th>对象</th>{[...new Set(subjects.flatMap(s => Object.keys(s.values)))].map(field => <th key={field}>{field}</th>)}</tr></thead><tbody>{subjects.map(s => <tr key={s.id}><td><input type="checkbox" disabled={kind === 'category_sort'} aria-label={`选择${s.name}`} checked={ids.includes(s.id)} onChange={() => setIds(toggle(ids, s.id))} /></td><td>{s.name}</td>{[...new Set(subjects.flatMap(s => Object.keys(s.values)))].map(field => <td key={field}>{String(s.values[field] ?? '--')}</td>)}</tr>)}</tbody></table></div>
    {kind === 'addon_sync' && <><h3>目标门店</h3><WebStoreScopeSelector stores={PRODUCT_SALES_SCOPE_STORES} value={stores} onChange={setStores} /><h3>企迈门店渠道</h3>{['POS', '小程序堂食', '小程序外卖'].map(ch => <label key={ch} style={{ marginRight: 16 }}><input type="checkbox" checked={channels.includes(ch)} onChange={() => setChannels(toggle(channels, ch))} />{ch}</label>)}</>}
    <WebTaskTiming mode={mode} onModeChange={setMode} at={at} onAtChange={setAt} /><WebTaskRemark value={remark} onChange={setRemark} />{error && <p role="alert" className="task-danger">{error}</p>}
    <footer><button className="task-button" disabled={busy} onClick={onClose}>取消</button><button className="task-button primary" disabled={busy} onClick={() => { setBusy(true); try { const selected = subjects.filter(s => ids.includes(s.id)); rememberDomainSource(activeBrandId, kind, subjects); saveTask(activeBrandId, createExtendedTask({ kind, subjects: selected, stores: PRODUCT_SALES_SCOPE_STORES.filter(s => stores.includes(s.id)), channels, mode, at: mode === 'scheduled' ? at : undefined, remark: remark.trim() })); onSaved(); } catch (e) { setError(e instanceof Error ? e.message : '保存失败，请重试'); setBusy(false); } }}>{mode === 'now' ? '保存并同步' : '保存任务'}</button></footer>
  </section></div>, document.body);
}

export { rememberDomainSource } from './extendedTasks';
