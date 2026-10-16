import React, { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

const exampleImage = new URL('../../assets/store-menu-partition-example.png', import.meta.url).href;

export const WebStoreMenuDisplayGuide: React.FC = () => {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) closeRef.current?.focus(); }, [open]);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  return <>
    <div data-menu-guide className="mx-4 my-2 flex shrink-0 items-center gap-2 rounded border border-[#E9EDF2] bg-[#F7F8FA] px-3 py-2 text-[13px] leading-5">
      <Info size={15} className="shrink-0 text-[#667085]" />
      <p className="min-w-0 text-[#4E5969]">开启小程序分区菜单后，点单页将按门店配置的分区菜单展示商品，不再统一展示门店商品，<strong className="font-medium text-[#1D2129]">且不展示商品推荐</strong>。</p>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-label="查看分区菜单效果示例" className="ml-2 shrink-0 text-[#008F4C]">查看效果示例</button>
    </div>
    {open && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-6" onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); close(); }
      if (event.key === 'Tab') { event.preventDefault(); closeRef.current?.focus(); }
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="store-menu-example-title" className="flex max-h-[calc(100vh-48px)] w-[540px] max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#E9EDF2] px-5 py-4"><h3 id="store-menu-example-title" className="text-[16px] font-semibold">小程序分区菜单效果示例</h3><button ref={closeRef} type="button" aria-label="关闭效果示例" onClick={close} className="rounded p-1 text-[#667085] hover:bg-[#F2F4F7]"><X size={18} /></button></div>
        <div className="min-h-0 overflow-auto no-scrollbar p-4"><p className="mb-3 text-[13px] leading-6 text-[#667085]">开启小程序分区菜单后，点单页将按门店配置的分区菜单展示商品，不再统一展示门店商品，且不展示商品推荐。下图为分区菜单的展示效果，实际内容以门店配置为准。</p><img src={exampleImage} alt="小程序点单页完整示例，店铺信息下方展示生鲜区、牛奶区、烧烤区分区菜单" className="mx-auto max-h-[68vh] max-w-full object-contain" /></div>
      </div>
    </div>}
  </>;
};
