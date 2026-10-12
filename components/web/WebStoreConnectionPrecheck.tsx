import React from 'react';
import { AlertCircle } from 'lucide-react';
import { getOmnichannelChannel, isThirdPartyChannelId } from '../../omnichannel';
import { PRODUCT_SALES_SCOPE_STORES } from './WebProductSalesScope';

// Connection facts are owned by store/platform APIs, not by brand capability switches.
// The prototype has no per-store binding/authorization response: never report these as passed.
export const WebStoreConnectionPrecheck: React.FC<{ storeIds: string[]; channelIds: string[] }> = ({ storeIds, channelIds }) => {
  const platformChannels = channelIds.filter(isThirdPartyChannelId);
  if (!storeIds.length || !platformChannels.length) return null;
  return <section className="my-4 rounded-md border border-[#FEDF89] bg-[#FFFCF5] p-4" aria-label="门店连接预检">
    <h4 className="flex items-center gap-2 text-sm font-semibold text-[#93370D]"><AlertCircle size={16} />门店授权与绑定待检测</h4>
    <p className="mt-1 text-xs leading-5 text-[#667085]">提交平台同步前需确认目标门店已授权并绑定对应平台。当前原型未接入检测接口，以下连接状态不代表已通过。</p>
    <ul className="mt-3 max-h-32 space-y-1 overflow-auto text-xs leading-5 text-[#7A2E0E] no-scrollbar">{storeIds.flatMap(storeId => platformChannels.map(channelId => <li key={`${storeId}:${channelId}`}>{PRODUCT_SALES_SCOPE_STORES.find(store => store.id === storeId)?.name || storeId} · {getOmnichannelChannel(channelId).name}：授权、绑定待检测</li>))}</ul>
    <p className="mt-2 text-xs leading-5 text-[#667085]">未授权或未绑定时，平台同步需先完成连接；企迈已成功的商品资料保留，失败或等待原因可在同步任务中查看。</p>
  </section>;
};
