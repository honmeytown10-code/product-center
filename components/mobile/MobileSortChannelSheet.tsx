import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { ChannelType } from './types';

export type SortChannel = Exclude<ChannelType, 'all'>;
export type ChannelSortOrders = Partial<Record<ChannelType, string[]>>;
// Match the channels currently offered by the sorting pages.
export const SORT_CHANNELS: { id: SortChannel; label: string }[] = [
  { id: 'mini', label: '小程序' },
  { id: 'meituan', label: '美团外卖' },
  { id: 'taobao', label: '淘宝闪购' },
  { id: 'pos', label: 'POS收银' },
];

export function applySortOrder<T>(items: T[], order: string[] = [], key: (item: T) => string): T[] {
  const positions = new Map(order.map((id, index) => [id, index]));
  return [...items].sort((a, b) => (positions.get(key(a)) ?? order.length) - (positions.get(key(b)) ?? order.length));
}

export function saveChannelOrder(previous: ChannelSortOrders, channels: SortChannel[], ids: string[]): ChannelSortOrders {
  const next = { ...previous };
  channels.forEach(channel => { next[channel] = [...ids]; });
  return next;
}

export const MobileSortChannelSheet = ({ kind, onClose, onConfirm }: {
  kind: '商品' | '分类';
  onClose: () => void;
  onConfirm: (channels: SortChannel[]) => void;
}) => {
  const [selected, setSelected] = useState<SortChannel[]>(() => SORT_CHANNELS.map(channel => channel.id));
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previousFocus?.focus();
  }, []);
  const allSelected = selected.length === SORT_CHANNELS.length;
  return (
    <div className="absolute inset-0 z-[80] flex flex-col justify-end bg-black/50">
      <button aria-label="取消选择生效渠道" className="flex-1 cursor-default" onClick={onClose} />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="sort-channel-title"
        onKeyDown={event => {
          if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
          if (event.key === 'Tab') {
            const buttons = Array.from(panel.current?.querySelectorAll('button:not(:disabled)') ?? []) as HTMLButtonElement[];
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}
        className="rounded-t-[24px] bg-white p-5 pb-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 id="sort-channel-title" className="text-lg font-bold text-[#1F2129]">选择生效渠道</h2>
          <button aria-label="关闭" onClick={onClose} className="rounded-full bg-gray-100 p-2 text-gray-500"><X size={18} /></button>
        </div>
        <p className="mt-2 text-xs leading-5 text-gray-500">本次{kind}排序将覆盖所选渠道的现有顺序，未选渠道保持不变。</p>
        <button role="checkbox" aria-checked={allSelected} onClick={() => setSelected(allSelected ? [] : SORT_CHANNELS.map(channel => channel.id))}
          className="my-4 flex min-h-11 w-full items-center justify-between text-sm font-bold text-gray-700">
          <span>全部渠道</span><span className="text-[#00A85C]">{allSelected ? '取消全选' : '全选'}</span>
        </button>
        <div className="grid grid-cols-2 gap-3">
          {SORT_CHANNELS.map(channel => {
            const checked = selected.includes(channel.id);
            return <button key={channel.id} role="checkbox" aria-checked={checked}
              onClick={() => setSelected(previous => checked ? previous.filter(id => id !== channel.id) : [...previous, channel.id])}
              className={`flex min-h-12 items-center justify-between rounded-xl border px-3 py-3 text-sm font-bold ${checked ? 'border-[#00C06B] bg-[#E8F8F0] text-[#00A85C]' : 'border-gray-200 text-gray-700'}`}>
              {channel.label}<span className={`ml-2 flex h-4 w-4 items-center justify-center rounded border ${checked ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300'}`}>{checked && <Check size={12} className="text-white" />}</span>
            </button>;
          })}
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="h-12 flex-1 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">取消</button>
          <button disabled={!selected.length} onClick={() => onConfirm(selected)} className="h-12 flex-[2] rounded-xl bg-[#00C06B] text-sm font-bold text-white disabled:bg-gray-200 disabled:text-gray-400">
            {selected.length ? `保存到 ${selected.length} 个渠道` : '请选择生效渠道'}
          </button>
        </div>
      </div>
    </div>
  );
};
