import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Loader2, Plus, X } from 'lucide-react';
import { expandOnlineMutexRules, onlineMutexLabel, readOnlineMutexRules, validateOnlineMutex, type OnlineMutexContext, type OnlineMutexRule } from '../../meituanOnlineMutex';
import { WebMutexRuleBuilder } from './WebMutexRuleBuilder';

const PRIMARY = 'var(--colorPrimary, #00b460)';
const button = 'inline-flex min-h-8 items-center justify-center gap-1.5 rounded border border-[#DDE3E8] bg-white px-3 text-sm text-[#344054] hover:bg-[#F7F8FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460] disabled:cursor-not-allowed disabled:opacity-50';

// Production mapping: QmListTable + el-dialog + object tree. Transport routing remains hidden.
function MutexDialog({ title, onClose, children, footer, wide = false }: {
  title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null), closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const controls = [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]') || [])].filter(node => node.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown, true);
    return () => { document.removeEventListener('keydown', keydown, true); previous?.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/35 p-6" onClick={event => { if (event.target === event.currentTarget) closeRef.current(); }}>
    <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={`flex max-h-[calc(100vh-48px)] ${wide ? 'w-[1000px]' : 'w-[640px]'} max-w-full flex-col overflow-hidden rounded-lg bg-white text-[#1D2129] shadow-xl outline-none`}>
      <header className="flex items-center justify-between border-b border-[#E5E6EB] px-6 py-4"><h3 className="text-base font-semibold">{title}</h3><button type="button" onClick={onClose} aria-label={`关闭${title}`} className="rounded p-1 text-[#667085] hover:bg-[#F2F3F5]"><X size={18} /></button></header>
      <div className="min-h-0 overflow-y-auto px-6 py-5 no-scrollbar">{children}</div>
      <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[#E5E6EB] px-6 py-4">{footer}</footer>
    </div>
  </div>, document.body);
}

type DemoState = 'success' | 'loading' | 'error' | 'no-permission' | 'read-only' | 'submit-error';
export function WebMeituanOnlineMutex({ value, context, scope = 'channel', onChange }: {
  value: unknown; context?: OnlineMutexContext; scope?: 'channel' | 'template' | 'store'; onChange: (encoded: string[]) => void;
}) {
  const scopeMessage = scope === 'template'
    ? '仅修改当前模板商品的美团在线点配置，保存后不会修改来源商品库或已下发门店。通过模板发布后，才更新所选门店。可重新添加恢复，变更随模板商品留痕。'
    : scope === 'store'
      ? '仅修改当前门店所选美团在线点渠道商品，保存并同步后解除限制，不回写模板或来源商品库。可重新添加恢复，变更随门店商品留痕。'
      : '仅影响当前商品的美团在线点配置，保存并同步后解除限制。可重新添加恢复，变更随商品资料留痕。';
  const decoded = readOnlineMutexRules(value), rules = decoded.rules;
  const data: OnlineMutexContext = context || { options: [], skus: [], defaultIds: [] };
  const [editor, setEditor] = useState<{ index: number; rule: OnlineMutexRule } | null>(null);
  const editorInitial = useRef('');
  const [editorError, setEditorError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  // Error/permission demonstrations stay accessible by URL, never as product-form controls.
  const [demoState, setDemoState] = useState<DemoState>(() => {
    const params = new URLSearchParams(window.location.search), state = params.get('mutexState');
    return params.get('preview') === 'meituan-online-mutex' && ['loading', 'error', 'no-permission', 'read-only', 'submit-error'].includes(state || '') ? state as DemoState : 'success';
  });
  useEffect(() => {
    if (demoState !== 'loading') return;
    const timer = window.setTimeout(() => setDemoState('success'), 600);
    return () => window.clearTimeout(timer);
  }, [demoState]);
  const busy = useRef(false), readonly = demoState === 'read-only';
  const errors = decoded.error ? [decoded.error] : validateOnlineMutex(expandOnlineMutexRules(rules), data);
  const label = (id: string) => {
    const option = data.options.find(item => item.id === id);
    if (option) return onlineMutexLabel(option);
    return `${rules.find(rule => rule.labels[id])?.labels[id] || '原属性'}（已停用或移除）`;
  };
  const canAdd = data.options.some(a => data.options.some(b => a.id !== b.id && (a.source === 'addon' || b.source === 'addon' || a.groupId !== b.groupId)));
  const openEditor = (index = -1) => {
    const rule: OnlineMutexRule = rules[index] || { version: 2, id: crypto.randomUUID(), left: [], right: [], labels: {} };
    const initial = { index, rule: { ...rule, left: [...rule.left], right: [...rule.right], labels: { ...rule.labels } } };
    editorInitial.current = JSON.stringify(initial); setEditor(initial); setEditorError(''); setNotice('');
  };
  const closeEditor = () => {
    if (busy.current) return;
    if (editor && editorInitial.current !== JSON.stringify(editor) && !window.confirm('互斥规则尚未保存，确定放弃本次修改吗？')) return;
    setEditor(null);
  };
  const apply = async (retry = false) => {
    if (!editor || busy.current || readonly || decoded.error) return;
    if (!editor.rule.left.length || !editor.rule.right.length) { setEditorError('两个属性组都需要至少添加一项属性。'); return; }
    if (editor.rule.left.some(id => editor.rule.right.includes(id))) { setEditorError('两个属性组不能包含同一项属性。'); return; }
    const rule = { ...editor.rule, labels: Object.fromEntries([...editor.rule.left, ...editor.rule.right].map(id => [id, label(id)])) };
    const next = rules.map((item, index) => index === editor.index ? rule : item);
    if (editor.index < 0) next.push(rule);
    const invalid = validateOnlineMutex(expandOnlineMutexRules(next), data);
    if (invalid.length) { setEditorError(invalid[0]); return; }
    busy.current = true; setSubmitting(true); setEditorError('');
    try {
      await new Promise(resolve => window.setTimeout(resolve, 250));
      if (demoState === 'submit-error' && !retry) { setEditorError('本次修改未应用，已保留所选属性，请重试。'); return; }
      if (retry) setDemoState('success');
      onChange(next.map(rule => JSON.stringify(rule))); setEditor(null); setNotice('互斥规则已更新，请保存商品。');
    } catch (error) { setEditorError(error instanceof Error ? error.message : '设置失败，已保留所选属性，请重试。'); }
    finally { busy.current = false; setSubmitting(false); }
  };
  const renderItems = (ids: string[]) => <div className="space-y-1">{ids.map(id => <p key={id} title={label(id)} className={`break-words text-sm leading-5 ${data.options.some(option => option.id === id) ? 'text-[#344054]' : 'text-[#B42318]'}`}>{label(id)}</p>)}</div>;
  return <section className="space-y-3" aria-label="美团在线点属性互斥">
    <header className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold text-[#1D2129]">属性互斥</h4>{demoState !== 'no-permission' && <button type="button" className={button} style={{ color: PRIMARY, borderColor: PRIMARY }} title={!canAdd ? '请先配置并启用可互斥的商品属性' : undefined} disabled={readonly || !!decoded.error || !context || !canAdd || ['loading', 'error'].includes(demoState)} onClick={() => openEditor()}><Plus size={14} />添加互斥规则</button>}</header>
    {demoState === 'loading' ? <div role="status" className="flex min-h-28 items-center justify-center gap-2 bg-[#FAFBFC] text-sm text-[#667085]"><Loader2 size={16} className="animate-spin" />正在加载…</div>
      : demoState === 'error' ? <div role="alert" className="flex min-h-28 items-center justify-center gap-3 bg-[#FAFBFC] text-sm text-[#667085]">互斥规则加载失败<button type="button" className={button} onClick={() => setDemoState('success')}>重新加载</button></div>
      : demoState === 'no-permission' ? <div role="status" className="bg-[#FAFBFC] p-6 text-center text-sm text-[#667085]">当前账号没有查看互斥规则的权限，请联系管理员。</div>
      : <>
        {readonly && <p role="status" className="text-xs text-[#667085]">当前账号仅可查看互斥规则。</p>}
        {!!errors.length && <div role="alert" className="flex gap-2 rounded border border-[#F3D19E] bg-[#FFFAEB] p-3 text-xs leading-5 text-[#93370D]"><AlertCircle size={15} className="mt-0.5 shrink-0" /><div>{errors.map(error => <p key={error}>{error}</p>)}</div></div>}
        <div className="overflow-x-auto"><table className="w-full min-w-[540px] table-fixed text-left text-sm"><thead className="bg-[#F7F8FA] text-xs text-[#667085]"><tr><th className="w-14 px-3 py-2 font-medium">序号</th><th className="px-3 py-2 font-medium">属性组1</th><th className="w-12" aria-label="互斥" /><th className="px-3 py-2 font-medium">属性组2</th><th className="w-28 px-3 py-2 font-medium">操作</th></tr></thead><tbody>
          {!rules.length && <tr><td colSpan={5} className="py-8 text-center text-xs text-[#86909C]">暂无互斥规则</td></tr>}
          {rules.map((rule, index) => <tr key={rule.id} className="border-b border-[#F0F0F0]"><td className="px-3 py-3 align-top text-[#667085]">{index + 1}</td><td className="px-3 py-3 align-top">{renderItems(rule.left)}</td><td className="text-center text-xs text-[#86909C]">互斥</td><td className="px-3 py-3 align-top">{renderItems(rule.right)}</td><td className="px-3 py-3 align-top"><div className="flex gap-3"><button type="button" aria-label={`编辑互斥规则${index + 1}`} disabled={readonly || !!decoded.error} style={{ color: PRIMARY }} className="disabled:opacity-40" onClick={() => openEditor(index)}>编辑</button><button type="button" aria-label={`删除互斥规则${index + 1}`} disabled={readonly || !!decoded.error} className="text-[#667085] disabled:opacity-40" onClick={() => setDeleteIndex(index)}>删除</button></div></td></tr>)}
        </tbody></table></div>
        {notice && <p role="status" className="sr-only">{notice}</p>}
      </>}
    {editor && <MutexDialog wide title="设置互斥规则" onClose={closeEditor} footer={<><button type="button" disabled={submitting} onClick={closeEditor} className={button}>取消</button><button type="button" disabled={submitting} onClick={() => void apply()} className={`${button} border-transparent text-white`} style={{ background: PRIMARY, color: 'white' }}>{submitting && <Loader2 size={14} className="animate-spin" />}{submitting ? '保存中…' : '确定'}</button></>}>
      <div className="mb-4 flex items-start gap-2 rounded border border-[#E4EAD5] bg-[#FAFCF4] px-3 py-2 text-xs leading-5 text-[#667085]"><AlertCircle size={14} className="mt-0.5 shrink-0" /><p>将属性分别放入两个属性组。两组之间的属性不可同时选择，同组内不新增互斥。</p></div>
      <WebMutexRuleBuilder rule={editor.rule} options={data.options} label={label} disabled={submitting} onChange={rule => { setEditor({ ...editor, rule }); setEditorError(''); }} onError={setEditorError} />
      {editorError && <div role="alert" className="mt-4 text-sm leading-5 text-[#B42318]">{editorError}{demoState === 'submit-error' && <button type="button" disabled={submitting} className="ml-2 underline" onClick={() => void apply(true)}>重试</button>}</div>}
    </MutexDialog>}
    {deleteIndex !== null && rules[deleteIndex] && <MutexDialog title="删除互斥规则" onClose={() => setDeleteIndex(null)} footer={<><button className={button} onClick={() => setDeleteIndex(null)}>取消</button><button className={`${button} border-[#F5B7B1] text-[#B42318]`} onClick={() => { onChange(rules.filter((_, index) => index !== deleteIndex).map(rule => JSON.stringify(rule))); setDeleteIndex(null); setNotice('互斥规则已移除，请保存商品。'); }}>确认删除</button></>}>
      <p className="mb-4 text-sm leading-6">确定删除以下两个属性组之间的互斥规则吗？</p><div className="grid grid-cols-2 gap-4 rounded bg-[#F7F8FA] p-3">{renderItems(rules[deleteIndex].left)}{renderItems(rules[deleteIndex].right)}</div><p className="mt-3 text-xs leading-5 text-[#667085]">{scopeMessage}</p>
    </MutexDialog>}
  </section>;
}
