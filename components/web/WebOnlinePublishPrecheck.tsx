import React from 'react';
import { CircleAlert } from 'lucide-react';
import type { OmnichannelChannelId } from '../../types';
import type { OnlineOrderingPlatform } from './WebOnlineOrderingPlatformHub';

export type OnlineAuditScenario = 'current' | 'brand_reviewing' | 'addon_reviewing' | 'brand_rejected' | 'addon_rejected' | 'ready' | 'query_error';
export const ONLINE_AUDIT_SCENARIOS: [OnlineAuditScenario, string][] = [
  ['current', '当前状态'], ['brand_reviewing', '商品审核中'], ['addon_reviewing', '加料审核中'],
  ['brand_rejected', '商品审核未通过'], ['addon_rejected', '加料审核未通过'], ['ready', '审核全部通过'], ['query_error', '状态查询失败'],
];
type AuditIssue = 'reviewing' | 'rejected';
export type OnlineAuditCheck = {
  channelId: 'douyin' | 'meituan_dine'; platform: OnlineOrderingPlatform; name: string;
  brand: string; addons: string; brandIssue?: AuditIssue; addonIssue?: AuditIssue; ready: boolean; canSync: boolean;
};
export const onlineAuditCacheKey = (brandId: string, catalogId: string, platform: OnlineOrderingPlatform) => `online-entry:${brandId}:${catalogId}:${platform}`;

// Read the incumbent platform-result cache. No independent editable product source.
export function checkOnlinePublish(input: { channelIds: OmnichannelChannelId[]; brandId: string; catalogId: string; productId: string; addons: { id: string; name: string }[]; scenario: OnlineAuditScenario }, read: (key: string) => string | null = key => sessionStorage.getItem(key)): OnlineAuditCheck[] {
  if (input.scenario === 'query_error') throw Error('暂时无法查询平台审核状态，请重试。普通保存不受影响。');
  return input.channelIds.filter((id): id is 'douyin' | 'meituan_dine' => id === 'douyin' || id === 'meituan_dine').map(channelId => {
    const platform = channelId === 'douyin' ? 'douyin' : 'meituan', name = platform === 'douyin' ? '抖音在线点' : '美团在线点';
    const cache = input.scenario === 'current' ? JSON.parse(read(onlineAuditCacheKey(input.brandId, input.catalogId, platform)) || 'null') : null;
    const state = cache?.states?.[input.productId];
    let brandReady = !!state?.platformId && state.syncStatus === 'synced' && (platform === 'meituan' || state.reviewStatus === 'approved');
    let brandIssue: AuditIssue | undefined = brandReady ? undefined : state?.reviewStatus === 'rejected' || state?.syncStatus === 'failed' ? 'rejected' : 'reviewing';
    let brand = brandReady ? '商品审核通过' : brandIssue === 'rejected' ? '商品审核未通过，请修改资料后重新提交' : !state ? '商品待提交审核，保存时将自动提交平台' : '商品审核中，请等待平台处理';
    const required = platform === 'douyin' ? input.addons : [];
    const pending = required.filter(addon => { const row = cache?.addons?.find((item: any) => item.id === addon.id); return !row?.platformId || row.syncStatus !== 'synced' || row.reviewStatus && row.reviewStatus !== 'approved'; });
    const rejected = pending.filter(addon => { const row = cache?.addons?.find((item: any) => item.id === addon.id); return row?.syncStatus === 'failed' || row?.reviewStatus === 'rejected'; });
    let addonIssue: AuditIssue | undefined = !pending.length ? undefined : rejected.length ? 'rejected' : 'reviewing';
    let addonsReady = !pending.length;
    let addons = !pending.length ? '关联加料审核通过' : [rejected.length ? `${rejected.length} 个加料审核未通过：${rejected.map(item => item.name).join('、')}` : '', pending.length > rejected.length ? `${pending.length - rejected.length} 个加料待平台审核：${pending.filter(item => !rejected.includes(item)).map(item => item.name).join('、')}` : ''].filter(Boolean).join('；');
    if (input.scenario !== 'current') {
      brandIssue = input.scenario === 'brand_reviewing' ? 'reviewing' : input.scenario === 'brand_rejected' ? 'rejected' : undefined;
      brandReady = !brandIssue;
      brand = brandIssue === 'reviewing' ? '商品审核中，请等待平台处理' : brandIssue === 'rejected' ? '商品审核未通过：图片含营销文字，请调整后重新提交' : '商品审核通过';
      addonIssue = required.length && input.scenario === 'addon_reviewing' ? 'reviewing' : required.length && input.scenario === 'addon_rejected' ? 'rejected' : undefined;
      addonsReady = !addonIssue;
      addons = addonIssue ? `${required.length} 个加料${addonIssue === 'rejected' ? '审核未通过' : '审核中'}：${required.map(item => item.name).join('、')}` : '关联加料审核通过';
    }
    const canSync = input.scenario === 'current' ? (!brandReady && (!state || state.syncStatus === 'not_synced' || brandIssue === 'rejected')) || pending.some(addon => { const row = cache?.addons?.find((item: any) => item.id === addon.id); return !row || row.syncStatus === 'not_synced' || row.syncStatus === 'failed' || row.reviewStatus === 'rejected'; }) : brandIssue === 'rejected' || addonIssue === 'rejected';
    return { channelId, platform, name, brand, addons, brandIssue, addonIssue, ready: brandReady && addonsReady, canSync };
  });
}

const stableJson = (value: any): string => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const submissionSignature = (product: Record<string, any>) => stableJson({ name: product.name, price: product.price, image: product.image, type: product.type, category: product.category, formData: product.formData });

export function isOnlineSubmissionCurrent(brandId: string, catalogId: string, product: { id: string; formData?: Record<string, any> }, channels: OmnichannelChannelId[]) {
  return channels.every(channel => {
    const cache = JSON.parse(sessionStorage.getItem(onlineAuditCacheKey(brandId, catalogId, channel === 'douyin' ? 'douyin' : 'meituan')) || 'null');
    return submissionSignature(product) === (cache?.submissionSignatures?.[product.id] || (cache?.snapshots?.[product.id] ? submissionSignature(cache.snapshots[product.id]) : ''));
  });
}

// Repeated unchanged saves must not reset an approved result or duplicate an
// in-flight submission. These are prototype pending states, never fake approvals.
export function cacheOnlineBrandSubmission(brandId: string, catalogId: string, product: { id: string; formData?: Record<string, any> }, channels: OmnichannelChannelId[], force = false): OmnichannelChannelId[] {
  const at = new Date().toLocaleString('sv-SE'), submitted: OmnichannelChannelId[] = [];
  for (const channel of channels.filter(id => id === 'douyin' || id === 'meituan_dine')) {
    const platform = channel === 'douyin' ? 'douyin' : 'meituan', key = onlineAuditCacheKey(brandId, catalogId, platform);
    const cache = JSON.parse(sessionStorage.getItem(key) || 'null') || {};
    const signature = submissionSignature(product), state = cache.states?.[product.id];
    const sameSubmission = signature === (cache.submissionSignatures?.[product.id] || (cache.snapshots?.[product.id] ? submissionSignature(cache.snapshots[product.id]) : ''));
    if (sameSubmission && state && !(force && (state.syncStatus === 'failed' || state.reviewStatus === 'rejected' || (cache.addons || []).some((addon: any) => product.formData?.takeoutSnapshot?.addonItems?.some((item: any) => item.id === addon.id) && (addon.syncStatus === 'failed' || addon.reviewStatus === 'rejected'))))) continue;
    const addons = [...(cache.addons || [])];
    if (platform === 'douyin') for (const addon of product.formData?.takeoutSnapshot?.addonItems || []) {
      const index = addons.findIndex(item => item.id === addon.id), existing = addons[index];
      const unchanged = existing && existing.name === addon.name && Number(existing.price) === Number(addon.price);
      if (unchanged && (existing.syncStatus === 'syncing' || existing.syncStatus === 'synced' && existing.platformId && existing.reviewStatus !== 'rejected')) continue;
      const row = { ...addon, addonType: addon.groupName, category: '', syncStatus: 'syncing', reviewStatus: 'reviewing', updatedAt: at };
      if (index < 0) addons.push(row); else addons[index] = { ...existing, ...row };
    }
    sessionStorage.setItem(key, JSON.stringify({ ...cache, submissionSignatures: { ...cache.submissionSignatures, [product.id]: signature }, states: { ...cache.states, [product.id]: { ...state, syncStatus: 'syncing', reviewStatus: platform === 'douyin' ? 'reviewing' : 'not_submitted', updatedAt: at } }, snapshots: { ...cache.snapshots, [product.id]: product }, addons, submittedProductIds: [...new Set([...(cache.submittedProductIds || []), product.id])] }));
    submitted.push(channel);
  }
  return submitted;
}

export const OnlineAuditDemoControl: React.FC<{ value: OnlineAuditScenario; onChange: (value: OnlineAuditScenario) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => <label className="flex shrink-0 items-center gap-2 text-xs text-[#667085]">原型演示<select aria-label="在线点状态演示（仅原型）" value={value} onChange={event => onChange(event.target.value as OnlineAuditScenario)} disabled={disabled} className="h-8 max-w-[160px] rounded border border-[#DDE3EA] bg-white px-2 text-[#4E5969] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008647]">{ONLINE_AUDIT_SCENARIOS.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;

type Props = { loading: boolean; error: string; checks: OnlineAuditCheck[]; onRetry: () => void; onSync: () => void; syncing: boolean; notice: string; onViewStatus?: () => void };
export const WebOnlinePublishPrecheck: React.FC<Props> = ({ loading, error, checks, onRetry, onSync, syncing, notice, onViewStatus }) => {
  const failed = checks.filter(check => !check.ready);
  if (!loading && !error && !failed.length) return null;
  return <section aria-label="在线点下发前校验" className="mt-4 text-xs">
    {loading ? <p role="status" className="text-[#667085]">正在查询平台审核状态…</p> : error ? <div role="alert" className="flex items-start gap-2 rounded-md bg-[#FFF2F0] p-3 leading-5 text-[#B42318]"><CircleAlert size={16} className="mt-0.5 shrink-0" /><span>{error}<button type="button" onClick={onRetry} className="ml-2 font-semibold underline">重新查询</button></span></div> : <details className="group rounded-md border border-[#F5D6AE] bg-[#FFFAF0] text-[#754210]">
      <summary className="flex cursor-pointer list-none items-start gap-2 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008647]"><CircleAlert size={17} className="mt-0.5 shrink-0" /><span className="min-w-0 flex-1 leading-5"><strong className="block font-semibold">在线点商品或加料审核未完成，暂不可下发</strong><span>涉及 {failed.map(check => check.name).join('、')}；普通保存不受影响。</span></span><span className="shrink-0 pt-0.5 font-semibold underline"><span className="group-open:hidden">查看详情</span><span className="hidden group-open:inline">收起详情</span></span></summary>
      <div className="mx-3 border-t border-[#F5D6AE] py-3 leading-5">
        {failed.map(check => <div key={check.channelId} className="mb-3 last:mb-0"><p className="font-semibold">{check.name}</p>{check.brandIssue && <p className="mt-1 break-words">{check.brand}</p>}{check.addonIssue && <p className="mt-1 break-words">{check.addons}</p>}</div>)}
        <p>保存时自动提交平台；审核通过后请重新下发，不会自动创建门店下发任务。</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[#00783F]">{failed.some(check => check.canSync) && <button type="button" onClick={onSync} disabled={syncing} className="font-semibold underline disabled:opacity-50">{syncing ? '正在保存并提交…' : '保存并提交平台审核'}</button>}{onViewStatus && <button type="button" disabled={syncing} onClick={onViewStatus} className="underline">查看审核状态</button>}<button type="button" onClick={onRetry} disabled={syncing} className="underline">刷新状态</button></div>
      </div>
    </details>}
    {notice && <p role="status" className="mt-2 leading-5 text-[#00783F]">{notice}</p>}
  </section>;
};
