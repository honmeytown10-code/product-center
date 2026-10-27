import React, { useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Inbox, Search, Trash2, X } from 'lucide-react';
import type { OnlineMutexOption, OnlineMutexRule } from '../../meituanOnlineMutex';
const DRAG_TYPE = 'application/x-qmai-mutex-option';
const sourceName = (source: OnlineMutexOption['source']) => ({ spec: '规格', method: '做法', addon: '加料' })[source];

/** Shared attribute tree + two drop zones; click/keyboard also support assignment. */
export function WebMutexRuleBuilder({ rule, options, label, disabled, onChange, onError }: {
  rule: OnlineMutexRule; options: OnlineMutexOption[]; label: (id: string) => string; disabled: boolean;
  onChange: (rule: OnlineMutexRule) => void; onError: (message: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<'left' | 'right'>('left');
  const [closed, setClosed] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState<'left' | 'right' | null>(null);
  const visible = options.filter(option => `${sourceName(option.source)} ${label(option.id)}`.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (id: string) => setClosed(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const expanded = (id: string) => !!query.trim() || !closed.includes(id);
  const groupNumber = (side: 'left' | 'right') => side === 'left' ? 1 : 2;
  const blockedReason = (id: string, side: 'left' | 'right') => {
    const option = options.find(item => item.id === id);
    if (!option) return '该属性已停用或移除，请重新选择。';
    const opposite = rule[side === 'left' ? 'right' : 'left'].filter(item => item !== id);
    if (option.source !== 'addon' && options.some(item => opposite.includes(item.id) && item.source !== 'addon' && item.groupId === option.groupId)) return '与另一组属性属于同一单选组，无需设置互斥。';
    return '';
  };
  const assign = (id: string, side: 'left' | 'right') => {
    if (disabled) return;
    const error = blockedReason(id, side);
    if (error) { onError(error); return; }
    if (rule[side].includes(id)) return;
    const next = { ...rule, left: rule.left.filter(item => item !== id), right: rule.right.filter(item => item !== id) };
    next[side] = [...next[side], id]; onChange(next); onError('');
  };
  const startDrag = (event: React.DragEvent, id: string) => {
    if (disabled) { event.preventDefault(); return; }
    event.dataTransfer.setData(DRAG_TYPE, id); event.dataTransfer.effectAllowed = 'move';
  };
  return <div className="relative grid grid-cols-3 gap-4" aria-label="互斥属性分组">
    <div className="flex h-[400px] min-w-0 flex-col overflow-hidden rounded border border-[#DDE3E8] bg-white">
      <div className="border-b border-[#E5E6EB] px-3 py-3"><h4 className="text-sm font-medium text-[#344054]">规格 / 做法 / 加料</h4><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#86909C]"><span>点击添加到</span><div className="inline-flex overflow-hidden rounded border border-[#DDE3E8]">{(['left', 'right'] as const).map(side => <button type="button" key={side} disabled={disabled} aria-pressed={target === side} onClick={() => setTarget(side)} className={`px-2 py-1 ${target === side ? 'bg-[#EAF8F1] text-[#008F4C]' : 'text-[#667085]'}`}>属性组{groupNumber(side)}</button>)}</div></div></div>
      <div className="flex items-center gap-2 border-b border-[#E5E6EB] px-3"><Search size={14} className="shrink-0 text-[#86909C]" /><input disabled={disabled} aria-label="搜索互斥属性" placeholder="搜索属性" value={query} onChange={event => setQuery(event.target.value)} className="h-9 min-w-0 flex-1 text-xs outline-none" /></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 no-scrollbar" tabIndex={0} role="tree" aria-label="当前商品属性">
        {!visible.length && <p className="px-2 py-8 text-center text-xs text-[#86909C]">{query ? '没有匹配的属性' : '暂无可选属性'}</p>}
        {(['spec', 'method', 'addon'] as const).map(source => {
          const items = visible.filter(option => option.source === source);
          if (!items.length) return null;
          const rootId = `source:${source}`, rootOpen = expanded(rootId);
          return <div key={source} className="mb-2" role="treeitem" aria-label={sourceName(source)} aria-expanded={rootOpen}>
            <button type="button" aria-label={`${rootOpen ? '收起' : '展开'}${sourceName(source)}`} disabled={disabled} onClick={() => toggle(rootId)} className="flex w-full items-center gap-1.5 rounded bg-[#F7F8FA] px-2 py-2 text-left text-sm font-medium text-[#344054]">{rootOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}{sourceName(source)}</button>
            {rootOpen && <div role="group" className="pl-2">{[...new Set(items.map(item => item.groupId))].map(groupId => {
              const group = items.filter(item => item.groupId === groupId), open = expanded(groupId);
              return <div key={groupId} className="mt-1" role="treeitem" aria-label={group[0].groupName} aria-expanded={open}>
                <button type="button" disabled={disabled} aria-label={`${open ? '收起' : '展开'}${group[0].groupName}`} onClick={() => toggle(groupId)} className="flex w-full items-start gap-1 py-1.5 text-left text-xs text-[#667085]">{open ? <ChevronDown size={13} className="mt-0.5 shrink-0" /> : <ChevronRight size={13} className="mt-0.5 shrink-0" />}<span className="min-w-0 break-words">{group[0].groupName}</span></button>
                {open && <div role="group">{group.map(option => {
                  const assigned = rule.left.includes(option.id) ? 'left' : rule.right.includes(option.id) ? 'right' : null;
                  const reason = blockedReason(option.id, target);
                  return <div key={option.id} draggable={!disabled} onDragStart={event => startDrag(event, option.id)} data-mutex-option={option.id} role="treeitem" aria-selected={!!assigned} className="group flex min-w-0 items-start gap-1 rounded pl-3 hover:bg-[#F5F8F6]" title={reason || label(option.id)}>
                    <GripVertical size={12} className="mt-2 shrink-0 cursor-grab text-[#A9AEB8]" />
                    <button type="button" disabled={disabled || !!reason} aria-label={`添加${label(option.id)}到属性组${groupNumber(target)}`} onClick={() => assign(option.id, target)} className="min-w-0 flex-1 break-words py-1.5 text-left text-xs leading-5 text-[#344054] disabled:text-[#A9AEB8]">{option.name}</button>
                    {assigned && <span className="mt-2 shrink-0 rounded bg-[#F2F3F5] px-1 text-[10px] text-[#86909C]">组{groupNumber(assigned)}</span>}
                  </div>;
                })}</div>}
              </div>;
            })}</div>}
          </div>;
        })}
      </div>
    </div>
    {(['left', 'right'] as const).map(side => <section key={side} role="group" aria-label={`属性组${groupNumber(side)}`} onDragOver={event => {
      if (!disabled && event.dataTransfer.types.includes(DRAG_TYPE)) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOver(side); }
    }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(null); }} onDrop={event => {
      event.preventDefault(); setDragOver(null); const id = event.dataTransfer.getData(DRAG_TYPE); if (id) assign(id, side);
    }} className={`flex h-[400px] min-w-0 flex-col overflow-hidden rounded border bg-white ${side === 'left' ? 'border-[#B8D5F1]' : 'border-[#B8DFC7]'} ${dragOver === side ? 'ring-2 ring-[#00B460]/40' : ''}`}>
      <header className={`flex min-h-12 items-center justify-between gap-2 px-3 ${side === 'left' ? 'bg-[#F0F6FF]' : 'bg-[#EFFAF1]'}`}><button type="button" disabled={disabled} onClick={() => setTarget(side)} className="text-sm font-medium text-[#344054]">属性组{groupNumber(side)}</button><button type="button" disabled={disabled || !rule[side].length} aria-label={`清空属性组${groupNumber(side)}`} onClick={() => { onChange({ ...rule, [side]: [] }); onError(''); }} className="inline-flex shrink-0 items-center gap-1 text-xs text-[#86909C] disabled:opacity-40"><Trash2 size={12} />清空</button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 no-scrollbar" tabIndex={0}>
        {!rule[side].length ? <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center text-xs text-[#A9AEB8]"><Inbox size={38} strokeWidth={1} /><p>拖入属性，或从左侧点击添加</p></div> : <div className="space-y-2">{rule[side].map(id => {
          const option = options.find(item => item.id === id);
          return <div key={id} draggable={!disabled && !!option} onDragStart={event => startDrag(event, id)} data-mutex-selected={id} className={`flex min-w-0 items-start gap-1.5 rounded border p-2 ${option ? 'border-[#E5E6EB] bg-[#FAFBFC]' : 'border-[#F3C4BF] bg-[#FFF4F2]'}`} title={label(id)}>
            <GripVertical size={13} className="mt-0.5 shrink-0 cursor-grab text-[#A9AEB8]" /><div className="min-w-0 flex-1"><div className="break-words text-sm leading-5 text-[#344054]">{option?.name || rule.labels[id] || '原属性'}</div><div className={`mt-1 break-words text-[11px] ${option ? 'text-[#86909C]' : 'text-[#B42318]'}`}>{option ? `${sourceName(option.source)} / ${option.groupName}` : '已停用或移除'}</div></div><button type="button" disabled={disabled} aria-label={`移除属性组${groupNumber(side)}：${label(id)}`} onClick={() => { onChange({ ...rule, [side]: rule[side].filter(item => item !== id) }); onError(''); }} className="shrink-0 rounded text-[#86909C] hover:bg-[#F2F3F5]"><X size={14} /></button>
          </div>;
        })}</div>}
      </div>
    </section>)}
    <span className="pointer-events-none absolute left-[calc(66.666%+3px)] top-3 -translate-x-1/2 rounded-full border-2 border-white bg-[#E5F3EE] px-1.5 py-1 text-[11px] font-medium text-[#008F4C]">互斥</span>
  </div>;
}
