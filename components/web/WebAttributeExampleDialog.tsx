import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type AttributeExampleKind = 'desc' | 'order' | 'stats' | 'badge';
export const ATTRIBUTE_EXPLANATIONS: Record<AttributeExampleKind, string> = {
  desc: '展示在小程序的商品名称下方、分类名称上方，用于说明口味、含糖等商品信息或分类卖点。',
  order: '为商品添加点单时的提示标签，如“门店推荐”“新品尝鲜”。展示效果以小程序点单样式为准。',
  stats: '给商品添加统计标记，如“新品”，便于汇总这些商品的数据；不在点单页展示。每个商品最多选择 10 个。',
  badge: '显示在小程序点单列表的商品图片上，用于标记新品、套餐等信息。',
};
export function WebAttributeExampleDialog({ kind, onClose }: { kind: AttributeExampleKind; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') { event.preventDefault(); panel.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [onClose]);
  const title = { desc: '描述标签', order: '点单标签', stats: '统计标签', badge: '商品角标' }[kind];
  return createPortal(<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="attribute-example-title" onClick={event => event.stopPropagation()} className="flex max-h-[88vh] w-full max-w-[650px] flex-col rounded-lg bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-[#E6E8EB] px-6 py-4"><h2 id="attribute-example-title" className="text-lg font-semibold">{title}示例</h2><button type="button" aria-label="关闭示例" onClick={onClose} className="rounded p-2 text-[#667085] hover:bg-[#F7F8FA]"><X size={18} /></button></header>
      <div className="overflow-auto p-6"><p className="mb-5 text-sm leading-6 text-[#4E5969]">{ATTRIBUTE_EXPLANATIONS[kind]}</p>
        {kind === 'desc' || kind === 'badge' ? <img src={kind === 'desc' ? '/reference/product-label-example.png' : '/reference/product-badge-example.png'} alt={kind === 'desc' ? '小程序商品名称下方的描述标签位置，红框标注' : '小程序商品图片上的角标位置，红框标注'} className="mx-auto w-full max-w-[330px] rounded border border-[#E6E8EB]" /> :
          <svg viewBox="0 0 550 300" role="img" aria-label={kind === 'stats' ? '统计标签示意：关联新品标签的商品汇总在新品统计中' : '点单标签示意：商品关联门店推荐标签'} className="w-full rounded bg-[#F7F8FA]">
            <rect x="24" y="24" width="502" height="252" rx="8" fill="white" stroke="#E6E8EB" />
            <text x="48" y="60" fontSize="16" fill="#1D2129">{kind === 'stats' ? '商品关联统计标签' : '商品点单提示'}</text>
            <text x="48" y="112" fontSize="15" fill="#4E5969">杨枝甘露</text><rect x="210" y="88" width="100" height="34" rx="4" fill="#EAF8F1" /><text x="226" y="111" fontSize="14" fill="#008F4C">{kind === 'stats' ? '新品' : '门店推荐'}</text>
            {kind === 'stats' && <><text x="48" y="163" fontSize="15" fill="#4E5969">鲜橙果茶</text><rect x="210" y="139" width="100" height="34" rx="4" fill="#EAF8F1" /><text x="226" y="162" fontSize="14" fill="#008F4C">新品</text><path d="M340 108h35m-8-7 8 7-8 7" fill="none" stroke="#86909C" strokeWidth="2" /><text x="391" y="113" fontSize="14" fill="#1D2129">新品统计</text><text x="391" y="145" fontSize="13" fill="#667085">汇总关联商品</text></>}
            <text x="48" y="240" fontSize="12" fill="#667085">{kind === 'stats' ? '示意：标签用于数据筛选与汇总，不展示给顾客。' : '示意：实际位置与样式由小程序点单页面决定。'}</text>
          </svg>}
      </div>
    </div>
  </div>, document.body);
}
