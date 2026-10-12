import React, { useCallback, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { WebPublishDialog } from './WebPublishDialog';

export type PublishInfoWarning = { channel: string; name: string; field: string; message: string };
export const WebPublishWarnings: React.FC<{ rows: PublishInfoWarning[] }> = ({ rows }) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  if (!rows.length) return null;
  const productCount = new Set(rows.map(row => `${row.channel}:${row.name}`)).size;
  return <>
    <div role="status" className="mb-5 flex flex-wrap items-center gap-2 rounded-md bg-[#FFFAEB] px-3 py-2.5 text-sm text-[#93370D]"><AlertTriangle size={16} className="shrink-0" /><span>待补充信息 · {rows.length} 项</span><span className="text-xs text-[#86909C]">涉及 {productCount} 个渠道商品</span><button type="button" onClick={() => setOpen(true)} className="ml-auto text-xs font-medium underline underline-offset-2">查看详情</button></div>
    {open && <WebPublishDialog title={`待补充信息 · ${rows.length} 项`} onClose={close} footer={<button type="button" onClick={close} className="rounded-md bg-[#008647] px-5 py-2 text-sm font-medium text-white">我知道了</button>}>
      <p className="mb-4 text-sm leading-6 text-[#667085]">请在来源商品中补充以下资料后重新下发。三方平台仅检查由企迈维护商品的渠道。</p>
      <div className="overflow-auto rounded-md border border-[#E5E6EB]"><table className="w-full text-left text-sm"><thead className="bg-[#F7F8FA] text-xs text-[#667085]"><tr>{['商品 / 渠道', '缺失信息', '处理说明'].map(label => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.channel}:${row.name}:${row.field}:${index}`} className="border-t border-[#F2F3F5]"><td className="px-3 py-3 text-[#1D2129]">{row.name}<div className="mt-1 text-xs text-[#86909C]">{row.channel}</div></td><td className="px-3 py-3 text-[#4E5969]">{row.field}</td><td className="px-3 py-3 text-xs leading-5 text-[#667085]">{row.message}</td></tr>)}</tbody></table></div>
    </WebPublishDialog>}
  </>;
};
