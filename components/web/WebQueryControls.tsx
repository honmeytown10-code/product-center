import React, { Children, createContext, isValidElement, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, CalendarDays, Check, ChevronDown, Filter, Plus, Search, Trash2, X } from 'lucide-react';
import { useProducts } from '../../context';
import './webQueryControls.css';
// React prototype equivalents of the production QmSearch controls. Existing page
// values, predicates and query callbacks remain authoritative.
type PopupAnchor = {
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    transform?: string;
};
const QueryPopupContext = createContext<string[]>([]);
function useQueryPopup(open: boolean, close: () => void, preferredWidth?: number) {
    const popupId = useId(), ancestors = useContext(QueryPopupContext), lineage = [...ancestors, popupId];
    const trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<PopupAnchor>({ top: 0, left: 0, width: 240, maxHeight: 400 });
    useEffect(() => {
        if (!open)
            return;
        const reposition = () => {
            const rect = trigger.current?.getBoundingClientRect();
            if (!rect)
                return;
            const width = Math.min(preferredWidth || Math.max(rect.width, 200), window.innerWidth - 24);
            const below = window.innerHeight - rect.bottom - 16;
            const above = rect.top - 16;
            const placeBelow = below >= Math.min(300, above);
            setPosition({ top: placeBelow ? rect.bottom + 6 : rect.top - 6, transform: placeBelow ? undefined : 'translateY(-100%)', left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), width, maxHeight: Math.max(80, Math.min(430, (placeBelow ? below : above) - 6)) });
        };
        const outside = (event: MouseEvent) => { const target = event.target as Element; const owner = target.closest?.('[data-query-ancestors]')?.getAttribute('data-query-ancestors')?.split(' ') || []; if (owner.includes(popupId))
            return; if (!trigger.current?.contains(target) && !panel.current?.contains(target))
            close(); };
        const escape = (event: KeyboardEvent) => { const popups = document.querySelectorAll<HTMLElement>('[data-query-popup]'); if (popups[popups.length - 1]?.dataset.queryPopup !== popupId)
            return; if (event.key === 'Escape') {
            event.stopImmediatePropagation();
            close();
            trigger.current?.focus();
        } if (event.key === 'Tab' && panel.current?.contains(event.target as Node)) {
            const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]')) as HTMLElement[];
            const first = nodes[0], last = nodes[nodes.length - 1];
            if (event.shiftKey && event.target === first) {
                event.preventDefault();
                last?.focus();
            }
            else if (!event.shiftKey && event.target === last) {
                event.preventDefault();
                first?.focus();
            }
        } };
        reposition();
        const focusTimer = window.setTimeout(() => { const node = panel.current?.querySelector<HTMLElement>('input:not(:disabled),button:not(:disabled)'); node?.focus(); }, 0);
        document.addEventListener('mousedown', outside);
        document.addEventListener('keydown', escape, true);
        window.addEventListener('resize', reposition);
        window.addEventListener('scroll', reposition, true);
        return () => { window.clearTimeout(focusTimer); document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape, true); window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition, true); };
    }, [open, preferredWidth]);
    return { trigger, panel, position, popupId, lineage };
}
export type WebQueryInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & {
    onValueChange?: (value: string) => void;
    onSearch?: () => void;
    embedded?: boolean;
    showIcon?: boolean;
    prefix?: React.ReactNode;
};
export function WebQueryInput({ value, defaultValue, onValueChange, onSearch, onKeyDown, className = '', style, embedded = false, showIcon = !embedded, prefix, ...props }: WebQueryInputProps) {
    const input = useRef<HTMLInputElement>(null), composing = useRef(false);
    const [internal, setInternal] = useState(String(defaultValue ?? ''));
    const current = value === undefined ? internal : String(value ?? '');
    const change = (next: string) => { if (value === undefined)
        setInternal(next); onValueChange?.(next); };
    return <span className={`cq-input ${embedded ? 'is-embedded' : ''} ${className}`} style={style} data-query-control="input">
    {showIcon && <Search size={16} aria-hidden="true" className="cq-input-icon"/>}{prefix && <span className="cq-input-prefix">{prefix}</span>}
    <input {...props} ref={input} value={current} className="cq-input-control" aria-label={props['aria-label'] || (typeof props.placeholder === 'string' ? props.placeholder : '搜索')} onChange={event => change(event.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} onKeyDown={event => { if (event.key === 'Enter' && (composing.current || event.nativeEvent.isComposing)) {
        event.preventDefault();
        return;
    } onKeyDown?.(event); if (event.key === 'Enter' && !composing.current && !event.nativeEvent.isComposing && !event.defaultPrevented)
        onSearch?.(); }}/>
    {current && !props.disabled && !props.readOnly && <button type="button" className="cq-clear" aria-label={`清空${props['aria-label'] || props.placeholder || '搜索'}`} onMouseDown={event => event.preventDefault()} onClick={event => { event.preventDefault(); event.stopPropagation(); change(''); input.current?.focus(); }}><X size={13}/></button>}
  </span>;
}
type QueryOption = {
    value: string;
    label: string;
    disabled?: boolean;
};
function optionText(node: React.ReactNode): string { return Children.toArray(node).map(child => isValidElement<{
    children?: React.ReactNode;
}>(child) ? optionText(child.props.children) : String(child ?? '')).join(''); }
function queryOptions(children: React.ReactNode, inheritedDisabled = false): QueryOption[] {
    return Children.toArray(children).flatMap(child => {
        if (!isValidElement<{
            children?: React.ReactNode;
            value?: string | number;
            disabled?: boolean;
            label?: string;
        }>(child))
            return [];
        if (child.type === 'option')
            return [{ value: String(child.props.value ?? optionText(child.props.children)), label: child.props.label || optionText(child.props.children), disabled: inheritedDisabled || child.props.disabled }];
        return queryOptions(child.props.children, inheritedDisabled || child.props.disabled);
    });
}
export type WebQuerySelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size' | 'multiple' | 'value' | 'defaultValue'> & {
    value?: string | number;
    defaultValue?: string | number;
    onValueChange?: (value: string) => void;
    embedded?: boolean;
    searchable?: boolean;
};
export function WebQuerySelect({ value, defaultValue, onValueChange, children, className = '', style, embedded = false, searchable, disabled, title, ...props }: WebQuerySelectProps) {
    const [internal, setInternal] = useState<string | undefined>(defaultValue === undefined ? undefined : String(defaultValue)), [open, setOpen] = useState(false), [keyword, setKeyword] = useState(''), [active, setActive] = useState(0);
    const popup = useQueryPopup(open, () => setOpen(false));
    const id = useId();
    const options = queryOptions(children), current = value === undefined ? internal ?? options[0]?.value ?? '' : String(value);
    const selected = options.find(option => option.value === current);
    const shown = options.filter(option => option.label.toLowerCase().includes(keyword.trim().toLowerCase()));
    const canSearch = searchable ?? options.length > 6;
    const select = (option: QueryOption) => { if (option.disabled)
        return; if (value === undefined)
        setInternal(option.value); onValueChange?.(option.value); setOpen(false); popup.trigger.current?.focus(); };
    const keydown = (event: React.KeyboardEvent) => {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
            if (event.key === ' ' && event.target instanceof HTMLInputElement)
                return;
            event.preventDefault();
            if (!open) {
                setKeyword('');
                setActive(Math.max(0, options.findIndex(option => option.value === current)));
                setOpen(true);
                return;
            }
            const enabled = shown.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
            if (event.key === 'ArrowDown')
                setActive(index => enabled.find(next => next > index) ?? enabled.at(-1) ?? 0);
            if (event.key === 'ArrowUp')
                setActive(index => [...enabled].reverse().find(next => next < index) ?? enabled[0] ?? 0);
            if (event.key === 'Home')
                setActive(enabled[0] ?? 0);
            if (event.key === 'End')
                setActive(enabled.at(-1) ?? 0);
            if ((event.key === 'Enter' || event.key === ' ') && shown[active])
                select(shown[active]);
        }
    };
    useEffect(() => { if (open)
        popup.panel.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }); }, [open, active]);
    return <span className={`cq-select ${embedded ? 'is-embedded' : ''} ${className}`} style={style} data-query-control="select">
    <button ref={popup.trigger} id={props.id} type="button" role="combobox" aria-label={props['aria-label'] || title || selected?.label || '筛选条件'} aria-expanded={open} aria-controls={open ? id : undefined} aria-haspopup="listbox" aria-activedescendant={open && shown[active] ? `${id}-${active}` : undefined} disabled={disabled} title={title || selected?.label} onKeyDown={keydown} onClick={() => { setKeyword(''); setActive(Math.max(0, options.findIndex(option => option.value === current))); setOpen(!open); }}><span>{selected?.label || '请选择'}</span><ChevronDown size={14} aria-hidden="true"/></button>
    {props.name && <input type="hidden" name={props.name} value={current}/>}
    {open && createPortal(<div ref={popup.panel} data-query-popup={popup.popupId} data-query-ancestors={popup.lineage.join(' ')} className="cq-popover cq-select-popup" style={popup.position} onKeyDown={keydown}>
      {canSearch && <div className="cq-popup-search"><WebQueryInput autoFocus placeholder="搜索选项" value={keyword} onValueChange={next => { setKeyword(next); setActive(0); }}/></div>}
      <div id={id} role="listbox" aria-label={props['aria-label'] || '筛选选项'} className="cq-options">{shown.map((option, index) => <button id={`${id}-${index}`} key={`${option.value}-${index}`} type="button" role="option" aria-selected={option.value === current} aria-disabled={option.disabled} disabled={option.disabled} data-active={index === active} onMouseEnter={() => setActive(index)} onClick={() => select(option)}><span>{option.label}</span>{option.value === current && <Check size={14}/>}</button>)}{!shown.length && <div className="cq-popup-empty">没有匹配选项</div>}</div>
    </div>, document.body)}
  </span>;
}
export function WebQuerySearch({ searchType, onSearchTypeChange, searchOptions, ...props }: Omit<WebQueryInputProps, 'prefix'> & {
    searchType: string;
    onSearchTypeChange: (value: string) => void;
    searchOptions: Array<{
        value: string;
        label: string;
    }>;
}) {
    return <WebQueryInput {...props} prefix={<WebQuerySelect embedded className="cq-search-type" aria-label={`${props['aria-label'] || '搜索'}类型`} value={searchType} onValueChange={onSearchTypeChange} searchable={false}>
    {searchOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
  </WebQuerySelect>}/>;
}
export function WebQueryBar({ children, className = '', label = '筛选查询', onSearch }: {
    children: React.ReactNode;
    className?: string;
    label?: string;
    onSearch?: () => void;
}) {
    return <div className={`console-query-bar ${className}`} role="search" aria-label={label} onKeyDown={event => { if (onSearch && event.currentTarget.contains(event.target as Node) && event.key === 'Enter' && event.target instanceof HTMLInputElement && !event.nativeEvent.isComposing && !event.defaultPrevented) {
        event.preventDefault();
        onSearch();
    } }}>{children}</div>;
}
export function WebQueryMore({ children, activeCount = 0, onReset, onApply }: {
    children: React.ReactNode;
    activeCount?: number;
    onReset?: () => void;
    onApply?: () => void;
}) {
    const [open, setOpen] = useState(false);
    const popup = useQueryPopup(open, () => setOpen(false), 560);
    const id = useId();
    return <><button type="button" ref={popup.trigger} className={`cq-button ${activeCount ? 'is-active' : ''}`} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}><Filter size={15}/>更多{activeCount > 0 && <span className="cq-count">{activeCount}</span>}<ChevronDown size={13}/></button>{open && createPortal(<div ref={popup.panel} data-query-popup={popup.popupId} data-query-ancestors={popup.lineage.join(' ')} id={id} className="cq-popover cq-more" style={popup.position} role="dialog" aria-label="更多筛选"><header><strong>更多筛选</strong><button type="button" className="cq-clear" aria-label="关闭更多筛选" onClick={() => { setOpen(false); popup.trigger.current?.focus(); }}><X size={16}/></button></header><QueryPopupContext.Provider value={popup.lineage}><div className="cq-more-fields">{children}</div></QueryPopupContext.Provider><footer>{onReset && <button type="button" className="cq-button" onClick={onReset}>重置</button>}<button type="button" className="cq-button primary" onClick={() => { onApply?.(); setOpen(false); popup.trigger.current?.focus(); }}>查询</button></footer></div>, document.body)}</>;
}
export function WebQueryDateRange({ label = '创建时间', value, onChange }: {
    label?: string;
    value: [
        string,
        string
    ];
    onChange: (value: [
        string,
        string
    ]) => void;
}) {
    const [open, setOpen] = useState(false), [draft, setDraft] = useState<[
        string,
        string
    ]>(value), [error, setError] = useState('');
    const popup = useQueryPopup(open, () => setOpen(false), 390);
    const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const preset = (days: number) => { const end = new Date(), start = new Date(); start.setDate(start.getDate() - days + 1); setDraft([format(start), format(end)]); setError(''); };
    return <span className="cq-date-range"><button type="button" ref={popup.trigger} className="cq-date-trigger" aria-label={`${label}范围`} aria-expanded={open} onClick={() => { setDraft(value); setError(''); setOpen(!open); }}><span className="cq-date-label">{label}</span><span className="cq-date-operator">~</span><span className={!value[0] && !value[1] ? 'cq-placeholder' : ''}>{value[0] || '开始日期'}<span className="cq-date-separator">~</span>{value[1] || '结束日期'}</span><CalendarDays size={16}/></button>{(value[0] || value[1]) && <button className="cq-date-clear cq-clear" type="button" aria-label={`清空${label}`} onClick={() => { onChange(['', '']); setOpen(false); }}><X size={13}/></button>}
    {open && createPortal(<div ref={popup.panel} data-query-popup={popup.popupId} data-query-ancestors={popup.lineage.join(' ')} role="dialog" aria-label={`选择${label}`} className="cq-popover cq-date-popup" style={popup.position}><strong>{label}</strong><div className="cq-date-presets">{[[1, '今天'], [7, '近7天'], [30, '近30天']].map(([days, name]) => <button type="button" key={days} onClick={() => preset(Number(days))}>{name}</button>)}<button type="button" onClick={() => { const end = new Date(); setDraft([format(new Date(end.getFullYear(), end.getMonth(), 1)), format(end)]); setError(''); }}>本月</button></div><div className="cq-date-inputs"><label>开始日期<input type="date" aria-label={`${label}开始日期`} value={draft[0]} max={draft[1] || undefined} onChange={e => { setDraft([e.target.value, draft[1]]); setError(''); }}/></label><span>至</span><label>结束日期<input type="date" aria-label={`${label}结束日期`} value={draft[1]} min={draft[0] || undefined} onChange={e => { setDraft([draft[0], e.target.value]); setError(''); }}/></label></div>{error && <p role="alert" className="cq-error">{error}</p>}<footer><button type="button" className="cq-button" onClick={() => setOpen(false)}>取消</button><button type="button" className="cq-button primary" onClick={() => { if (draft[0] && draft[1] && draft[0] > draft[1]) {
        setError('开始日期不能晚于结束日期');
        return;
    } onChange(draft); setOpen(false); popup.trigger.current?.focus(); }}>确定</button></footer></div>, document.body)}
  </span>;
}
type QueryValues = Record<string, string | number | boolean | string[]>;
type Scheme<T> = {
    id: string;
    name: string;
    values: T;
};
export function WebQuerySchemes<T extends QueryValues>({ scope, value, onApply }: {
    scope: string;
    value: T;
    onApply: (value: T) => void;
}) {
    const { activeBrandId } = useProducts();
    const storageKey = `console-query-schemes-v1:${activeBrandId}:${scope}`;
    const [schemes, setSchemes] = useState<Scheme<T>[]>([]), [open, setOpen] = useState(false), [name, setName] = useState(''), [error, setError] = useState('');
    const popup = useQueryPopup(open, () => setOpen(false), 300);
    useEffect(() => { try {
        const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
        setSchemes(Array.isArray(data) ? data.filter(item => item && typeof item.name === 'string' && item.values && typeof item.values === 'object').slice(0, 8) : []);
        setError('');
    }
    catch {
        setSchemes([]);
        setError('筛选方案读取失败，可重新保存');
    } }, [storageKey]);
    const persist = (next: Scheme<T>[]) => { try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setSchemes(next);
        setError('');
        return true;
    }
    catch {
        setError('保存失败，请检查浏览器存储后重试');
        return false;
    } };
    return <><button type="button" ref={popup.trigger} className="cq-button" aria-expanded={open} onClick={() => setOpen(!open)}><Bookmark size={15}/>筛选方案<ChevronDown size={13}/></button>{open && createPortal(<div ref={popup.panel} data-query-popup={popup.popupId} data-query-ancestors={popup.lineage.join(' ')} className="cq-popover cq-schemes" style={popup.position} role="dialog" aria-label="筛选方案"><header><strong>筛选方案</strong><span>当前页面 · 最多8个</span></header><div className="cq-scheme-list">{schemes.map(s => <div key={s.id}><button type="button" onClick={() => { onApply(JSON.parse(JSON.stringify(s.values))); setOpen(false); popup.trigger.current?.focus(); }} title={s.name}>{s.name}</button><button type="button" className="cq-clear" aria-label={`删除方案${s.name}`} onClick={() => persist(schemes.filter(item => item.id !== s.id))}><Trash2 size={14}/></button></div>)}{!schemes.length && <p className="cq-popup-empty">暂无方案，可保存当前筛选条件</p>}</div><div className="cq-save-scheme"><input value={name} maxLength={20} aria-label="筛选方案名称" placeholder="输入方案名称，最多20字" onChange={e => { setName(e.target.value); setError(''); }}/><button type="button" className="cq-button" onClick={() => { const title = name.trim(); if (!title) {
        setError('请输入方案名称');
        return;
    } if (schemes.some(s => s.name === title)) {
        setError('方案名称已存在');
        return;
    } if (schemes.length >= 8) {
        setError('最多保存8个方案，请先删除不需要的方案');
        return;
    } if (persist([...schemes, { id: String(Date.now()), name: title, values: JSON.parse(JSON.stringify(value)) }]))
        setName(''); }}><Plus size={14}/>保存</button></div>{error && <p className="cq-error" role="alert">{error}</p>}</div>, document.body)}</>;
}
