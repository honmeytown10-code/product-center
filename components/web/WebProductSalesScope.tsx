import React from 'react';
import { OmnichannelChannelId } from '../../types';
import { getOmnichannelChannel } from '../../omnichannel';
import { StoreScopeOption, WebStoreScopeSelector } from './WebStoreScopeSelector';
import type { StoreProductRecord } from './WebStoreProductList';

export type ProductSalesScope = { channelIds: OmnichannelChannelId[]; storeIds: string[] };

export const toStoreChannel = (id: OmnichannelChannelId): string => ({ mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take', douyin: 'douyin_dine' } as Record<string, string>)[id] || id;
export const fromStoreChannel = (id: string): OmnichannelChannelId => ({ mini_dine: 'mini_program_dine_in', mini_take: 'mini_program_delivery', douyin_dine: 'douyin', taobao: 'eleme' } as Record<string, string>)[id] as OmnichannelChannelId || id as OmnichannelChannelId;
// Production maps by stable master/SPU identity, never by product name.
export const getProductStoreRecords = (records: StoreProductRecord[], productId: string) => records.filter(record => record.baseProductId === productId);

// Same stores as the existing store-product prototype. Production uses the authorized organization tree.
export const PRODUCT_SALES_SCOPE_STORES: StoreScopeOption[] = [
  { id: 's1', name: '南山万象店', code: 'S001', organization: '深圳门店', tags: ['直营'] },
  { id: 's2', name: '福田卓悦店', code: 'S002', organization: '深圳门店', tags: ['直营'] },
  { id: 's3', name: '宝安壹方城店', code: 'S003', organization: '深圳门店', tags: ['加盟'] },
  { id: 's4', name: '龙华红山店', code: 'S004', organization: '深圳门店', tags: ['加盟'] },
];

export const WebProductSalesScope: React.FC<{
  value: ProductSalesScope;
  channels: OmnichannelChannelId[];
  onChange: (value: ProductSalesScope) => void;
  showErrors: boolean;
  showStores?: boolean;
  requireStores?: boolean;
  compact?: boolean;
  readOnlyChannels?: boolean;
  disabledChannelIds?: OmnichannelChannelId[];
  children?: React.ReactNode;
}> = ({ value, channels, onChange, showErrors, showStores = false, requireStores = false, compact = false, readOnlyChannels = false, disabledChannelIds = [], children }) => <section id={showStores ? 'publish-sales-scope' : 'sales-scope'} className={compact ? '' : 'scroll-mt-[180px] rounded-lg border border-[#E5E6EB] bg-white p-4'}>
  {!compact && <h2 className="mb-4 text-[15px] font-semibold text-[#1D2129]">{children ? '销售渠道与专属属性' : showStores ? '销售范围' : '销售渠道'}</h2>}
  <div className="grid grid-cols-[100px_1fr] items-start gap-x-4 gap-y-4 text-[14px]">
    <span className="pt-1 text-[#4E5969]"><span className="mr-1 text-[#E5484D]">*</span>{compact ? '下发渠道' : '销售渠道'}</span>
    <div>
      {readOnlyChannels ? <p className="pt-1 leading-5 text-[#4E5969]" aria-label="下发渠道">{value.channelIds.map(id => getOmnichannelChannel(id).name).join('、') || '未设置'}</p> : <div className="flex flex-wrap gap-x-5 gap-y-3">{channels.map(id => <label key={id} className={`flex items-center gap-2 text-[#4E5969] ${disabledChannelIds.includes(id) ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`} title={disabledChannelIds.includes(id) ? `${getOmnichannelChannel(id).name}暂不支持套餐商品` : undefined}><input type="checkbox" disabled={disabledChannelIds.includes(id)} checked={value.channelIds.includes(id)} onChange={() => onChange({ ...value, channelIds: value.channelIds.includes(id) ? value.channelIds.filter(item => item !== id) : [...value.channelIds, id] })} className="h-4 w-4 accent-[#00B460]" />{getOmnichannelChannel(id).name}{disabledChannelIds.includes(id) && <span className="text-xs">暂不支持套餐</span>}</label>)}</div>}
      {showErrors && !value.channelIds.length && <p role="alert" className="mt-2 text-[12px] text-[#CB2634]">请选择至少一个销售渠道。</p>}
    </div>
    {showStores && <><span className="pt-1 text-[#4E5969]">{requireStores && <span className="mr-1 text-[#E5484D]">*</span>}{compact ? '下发门店' : '销售门店'}</span>
    <div>
      <WebStoreScopeSelector stores={PRODUCT_SALES_SCOPE_STORES} value={value.storeIds} onChange={storeIds => onChange({ ...value, storeIds })} widthClassName="w-[260px]" placement="above" />
      {!!value.storeIds.length && <p className="mt-2 text-[12px] text-[#667085]">{PRODUCT_SALES_SCOPE_STORES.filter(store => value.storeIds.includes(store.id)).map(store => store.name).join('、')}</p>}
      {showErrors && requireStores && !value.storeIds.length && <p role="alert" className="mt-2 text-[12px] text-[#CB2634]">下发前请选择至少一家销售门店。</p>}
    </div></>}
  </div>
  {compact ? <p className="mt-3 pl-[116px] text-xs leading-5 text-[#667085]">{readOnlyChannels ? '按商品设置的全部销售渠道下发，仅作用于本次所选门店。' : '仅下发到本次所选范围，不修改商品的销售渠道。'}</p> : <p className="mt-4 text-[12px] leading-5 text-[#667085]">{showStores ? '这里只选择本次下发范围，不保存为商品的固定门店范围。' : '用于管控商品可售渠道；未勾选的渠道不可下发至对应门店渠道售卖。'}</p>}
  {children && <div id="third_party" className="mt-4 scroll-mt-[180px] border-t border-[#E5E6EB] pt-4"><h3 className="mb-3 text-[13px] font-semibold text-[#1D2129]">所选渠道的专属属性</h3>{children}</div>}
</section>;
