import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

/** 总部分组限制新增，但保留点击和键盘操作以说明原因。 */
export const MobileGroupAddButton = ({ blocked, label, blockedLabel, itemName, onAdd, compact = false }: {
  blocked: boolean;
  label: string;
  blockedLabel: string;
  itemName: string;
  onAdd: () => void;
  compact?: boolean;
}) => {
  const [notice, setNotice] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearNotice = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setNotice(false);
  };
  useEffect(() => {
    clearNotice();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [blocked, itemName]);
  const handleClick = () => {
    if (!blocked) { clearNotice(); onAdd(); return; }
    if (timer.current) clearTimeout(timer.current);
    setNotice(true);
    timer.current = setTimeout(() => { setNotice(false); timer.current = null; }, 3000);
  };
  return <div className={compact ? 'relative' : 'relative flex flex-1'}>
    <button
      type="button"
      aria-disabled={blocked || undefined}
      onClick={handleClick}
      className={compact
        ? `flex min-h-11 items-center gap-1 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 ${blocked ? 'text-gray-400' : 'text-green-700'}`
        : `flex min-h-14 w-full flex-col items-center justify-center rounded-xl py-2 font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${blocked ? 'bg-gray-100 text-gray-400' : 'bg-[#1F2129] text-white shadow-lg active:bg-gray-800'}`}
    >
      <Plus size={compact ? 15 : 24} className={compact ? 'shrink-0' : 'mb-0.5'} />
      <span className={compact ? '' : 'text-[10px]'}>{blocked ? blockedLabel : label}</span>
    </button>
    {notice && <div role="status" aria-live="polite" className="pointer-events-none absolute bottom-[calc(100%+12px)] right-0 z-[220] w-[264px] max-w-[calc(100vw-48px)] rounded-xl bg-gray-900 px-4 py-3 text-center text-xs font-normal leading-5 text-white shadow-lg">总部创建的分组，门店不可新增{itemName}</div>}
  </div>;
};
