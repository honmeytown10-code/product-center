import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Store } from 'lucide-react';
import type { OnlineOrderingPlatform, OnlineOrderingPlatformView } from './WebOnlineOrderingPlatformHub';

interface Props {
  label?: string;
  douyin: boolean;
  meituan: boolean;
  onOpen: (platform: OnlineOrderingPlatform, view: OnlineOrderingPlatformView) => void;
}

// One entrance shared by the product library and the current channel library.
export const WebOnlineOrderingEntry: React.FC<Props> = ({ douyin, meituan, onOpen, label = '在线点商品' }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const options = [
    ...(douyin ? [
      { platform: 'douyin' as const, view: 'products' as const, label: '抖音在线点商品' },
      { platform: 'douyin' as const, view: 'addons' as const, label: '抖音在线点加料' },
    ] : []),
    ...(meituan ? [{ platform: 'meituan' as const, view: 'products' as const, label: '美团在线点商品' }] : []),
  ];
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (rect) setPosition({ top: Math.min(rect.bottom + 6, window.innerHeight - options.length * 42 - 16), left: Math.max(8, Math.min(rect.right - 224, window.innerWidth - 232)) });
    };
    update();
    const frame = requestAnimationFrame(() => menu.current?.querySelector<HTMLButtonElement>('button')?.focus());
    const outside = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open, options.length]);
  if (!options.length) return null;
  return <>
    <button ref={trigger} type="button" className="console-secondary-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); } }}><Store size={15} />{label}<ChevronDown size={14} /></button>
    {open && createPortal(<div ref={menu} role="menu" aria-label={label + '入口'} style={position} className="fixed z-[100] w-[224px] rounded-md border border-[#E5E6EB] bg-white p-1 shadow-lg" onKeyDown={event => {
      const buttons: HTMLButtonElement[] = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button') || []);
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Escape' || event.key === 'Tab') { if (event.key === 'Escape') event.preventDefault(); close(); }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus(); }
    }}>{options.map(option => <button key={`${option.platform}:${option.view}`} type="button" role="menuitem" onClick={() => { setOpen(false); onOpen(option.platform, option.view); }} className="flex min-h-10 w-full items-center justify-between gap-3 rounded px-3 text-left text-[13px] text-[#1D2129] hover:bg-[#F7F8FA] focus-visible:bg-[#EAF8F2] focus-visible:outline-none">{option.label}<ChevronRight size={14} className="text-[#86909C]" /></button>)}</div>, document.body)}
  </>;
};
