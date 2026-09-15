import React, { useEffect, useRef } from 'react';
import { Check, CheckSquare, Search, X } from 'lucide-react';


export function PosCategories({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) {
  return <nav className="pos-categories" aria-label="分类筛选">{items.map(item => <button key={item} aria-pressed={value === item} className={value === item ? 'active' : ''} onClick={() => onChange(item)}>{item}</button>)}</nav>;
}

export function PosEmpty({ filtered, onReset }: { filtered?: boolean; onReset?: () => void }) {
  return <div className="pos-empty"><Search size={34} /><h3>{filtered ? '没有找到符合条件的内容' : '当前暂无数据'}</h3><p>{filtered ? '试试其他关键词，或清除筛选条件。' : '当前门店暂无可展示的内容。'}</p>{filtered && <button className="pos-button secondary" onClick={onReset}>清除筛选</button>}</div>;
}

export function PosSelection({ selected }: { selected: boolean }) {
  return <span className={`pos-selection ${selected ? 'selected' : ''}`} aria-hidden="true">{selected && <Check size={17} strokeWidth={3} />}</span>;
}

export function PosStatusFilters({ options, value, onChange }: {
  options: { id: string; label: string; count: number; attention?: boolean; tone?: 'danger' | 'warning' | 'long' }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return <nav className="pos-status-filters" aria-label="状态筛选">{options.map(option => (
    <button key={option.id} className={'pos-dock-filter' + (value === option.id ? ' active' : '')} aria-label={`${option.label} ${option.count}`} aria-pressed={value === option.id} onClick={() => onChange(option.id)}>
      <i className={'pos-dot' + (option.tone ? ` ${option.tone}` : option.attention ? ' danger' : '')} aria-hidden="true" />
      {option.label}<b>{option.count}</b>
    </button>
  ))}</nav>;
}

export function PosDock({ batch, count, allSelected, onSelectAll, onBatch, onExit, children, filters }: { batch: boolean; count: number; allSelected: boolean; onSelectAll: () => void; onBatch: () => void; onExit: () => void; children: React.ReactNode; filters: React.ReactNode }) {
  return <footer className={`pos-dock ${batch ? 'batch' : ''}`} aria-label="批量操作">{batch ? <><button className="pos-button quiet" onClick={onSelectAll}><PosSelection selected={allSelected} />全选当前结果</button><span className="pos-selected-count">已选 <b>{count}</b> 项</span><div className="pos-dock-actions">{children}</div><button className="pos-button quiet" onClick={onExit}>退出批量</button></> : <>{filters}<span className="pos-divider" /><button className="pos-button secondary" onClick={onBatch}><CheckSquare size={19} />批量管理</button></>}</footer>;
}

export function PosDialog({ title, children, footer, onClose, className = '' }: { title: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void; className?: string }) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    dialog.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
      if (event.key === 'Tab') {
        const nodes = Array.from(dialog.current?.querySelectorAll('button:not(:disabled), input, select, [tabindex="0"]') || []) as HTMLElement[];
        if (!nodes.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, []);
  return <div className="pos-overlay"><div className={`pos-dialog ${className}`} ref={dialog} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}><header><h2>{title}</h2><button className="pos-icon-button" aria-label="关闭" onClick={onClose}><X size={22} /></button></header><div className="pos-dialog-body">{children}</div>{footer && <footer>{footer}</footer>}</div></div>;
}

export function PosResult({ message, onClose }: { message: string; onClose: () => void }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => close.current(), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);
  return message ? <div className="pos-result" role="status" aria-live="polite"><Check size={18} /><span>{message}</span></div> : null;
}
