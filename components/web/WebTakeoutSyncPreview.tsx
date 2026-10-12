import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getOmnichannelChannel } from '../../omnichannel';
import { isTakeoutChannel, takeoutOperationPlan } from '../../takeoutSync';

type Props = { channelIds: string[]; operation?: Parameters<typeof takeoutOperationPlan>[1] };
export const WebTakeoutSyncPreview = ({ channelIds, operation = 'structure' }: Props) => {
  const channels = channelIds.filter(isTakeoutChannel);
  if (!channels.length) return null;
  return <section aria-label="外卖渠道同步方式" className="space-y-3 border-t border-[#E5E6EB] pt-4 text-sm">
    {channels.map(channel => <div key={channel} className="flex items-start gap-2 text-[#4E5969]">
      {operation === 'addon_shelf' && channel === 'meituan' ? <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#B54708]" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#008F4C]" />}
      <div><span className="font-medium text-[#1D2129]">{getOmnichannelChannel(channel).name}</span><p className="mt-1 text-xs leading-5">{takeoutOperationPlan(channel, operation)}</p></div>
    </div>)}
    {operation === 'structure' && <p className="text-xs leading-5 text-[#667085]">直接同步平台门店商品，无需品牌商品审核。套餐会等待同门店子 SKU 成功；平台失败不会回滚企迈结果。</p>}
  </section>;
};
