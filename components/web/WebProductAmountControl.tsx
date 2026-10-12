import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';

const UNIT_GROUPS = [
    { label: '准确重量单位', units: ['克', '千克', '毫升', '厘米'] },
    { label: '准确数量单位', units: ['份', '个'] },
    { label: '适用人数', units: ['人'] },
];

interface Props {
    amount: string;
    unit: string;
    onAmountChange: (value: string) => void;
    onUnitChange: (value: string) => void;
    onFocus?: () => void;
    label?: string;
}

/** Shares the same stored amount/unit fields in single- and multi-SKU forms. */
export const WebProductAmountControl: React.FC<Props> = ({ amount, unit, onAmountChange, onUnitChange, onFocus, label = '商品份量' }) => {
    const [open, setOpen] = useState(false);
    const [group, setGroup] = useState(0);
    const [position, setPosition] = useState({ left: 0, top: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const close = () => { setOpen(false); triggerRef.current?.focus(); };

    useLayoutEffect(() => {
        if (!open) return;
        const place = () => {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const height = popupRef.current?.offsetHeight || 224;
            const width = Math.min(360, window.innerWidth - 24);
            setPosition({ left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)), top: rect.bottom + height + 8 < window.innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - height - 8) });
        };
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
    }, [open, group]);

    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => {
            if (!popupRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); } };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        popupRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, [open]);

    const step = (direction: number) => {
        onFocus?.();
        const current = Number(amount || 0);
        if (Number.isFinite(current)) onAmountChange((Math.max(0, Math.round(current * 100) + direction) / 100).toFixed(2));
    };

    return <div className="grid min-w-[250px] grid-cols-[minmax(0,1fr)_112px] gap-3">
        <div className="flex h-10 overflow-hidden rounded-md border border-gray-200 bg-white focus-within:border-[#00A35B]">
            <button type="button" aria-label={`减少${label}`} disabled={Number(amount || 0) <= 0} onClick={() => step(-1)} className="flex w-9 shrink-0 items-center justify-center border-r border-gray-200 bg-[#F7F8FA] text-[#667085] hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"><Minus size={16} /></button>
            <input type="number" step="0.01" value={amount} onFocus={onFocus} onChange={event => onAmountChange(event.target.value)} aria-label={label} placeholder="0.00" className="min-w-0 flex-1 bg-transparent px-2 text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            <button type="button" aria-label={`增加${label}`} onClick={() => step(1)} className="flex w-9 shrink-0 items-center justify-center border-l border-gray-200 bg-[#F7F8FA] text-[#667085] hover:bg-gray-100"><Plus size={16} /></button>
        </div>
        <button type="button" ref={triggerRef} aria-label={`${label}单位：${unit}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => { onFocus?.(); setGroup(Math.max(0, UNIT_GROUPS.findIndex(item => item.units.includes(unit)))); setOpen(value => !value); }} className={`flex h-10 items-center justify-between rounded-md border bg-white px-3 text-sm ${open ? 'border-[#00A35B] text-[#00A35B]' : 'border-gray-200 text-[#4E5969]'}`}>
            <span>{unit || '选择单位'}</span><ChevronDown size={16} className={open ? 'rotate-180' : ''} />
        </button>
        {open && createPortal(<div ref={popupRef} role="dialog" aria-label={`${label}单位选择`} style={{ left: position.left, top: position.top, width: 'min(360px, calc(100vw - 24px))' }} className="fixed z-[1500] flex overflow-hidden rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
            <div className="w-[58%] border-r border-gray-100 px-2">
                {UNIT_GROUPS.map((item, index) => <button type="button" key={item.label} aria-pressed={group === index} onClick={() => setGroup(index)} className={`flex min-h-11 w-full items-center justify-between rounded-md px-3 text-sm ${group === index ? 'bg-[#E8F7EF] font-semibold text-[#00A35B]' : 'text-[#667085] hover:bg-[#F7F8FA]'}`}><span>{item.label}</span><ChevronRight size={16} /></button>)}
            </div>
            <div className="flex-1 px-2">
                {UNIT_GROUPS[group].units.map(option => <button type="button" key={option} aria-pressed={unit === option} onClick={() => { onUnitChange(option); close(); }} className={`flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm ${unit === option ? 'font-semibold text-[#00A35B]' : 'text-[#667085] hover:bg-[#F7F8FA]'}`}><Check size={16} className={unit === option ? '' : 'invisible'} />{option}</button>)}
            </div>
        </div>, document.body)}
    </div>;
};
