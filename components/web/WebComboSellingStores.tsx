import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import type { StoreProductRecord } from './WebStoreProductList';
import { normalizeDetailChannel, detailChannels, type DetailShelfRequest, type DetailShelfResult } from './comboDetailStoreOperations';
import { getOmnichannelChannel } from '../../omnichannel';

export const detailChannelName = (id: string) => ({ mini_dine: '小程序-堂食', mini_take: '小程序-外卖', pos: 'POS' }[normalizeDetailChannel(id)]
  || getOmnichannelChannel(id as Parameters<typeof getOmnichannelChannel>[0])?.name || id);

interface Props {
  productId: string;
  productName: string;
  records: StoreProductRecord[];
  channelIds?: string[];
  initialChannel?: string;
  onChannelChange?: (channel: string) => void;
  onShelfChange?: (request: DetailShelfRequest) => Promise<DetailShelfResult>;
}
export function WebComboSellingStores({ productId, productName, records, channelIds = [], initialChannel = 'mini_dine', onChannelChange, onShelfChange }: Props) {
  const ownRecords = records.filter(row => row.baseProductId === productId);
  const channels = detailChannels(records, productId, channelIds);
  const [chosenChannel, setChosenChannel] = useState(initialChannel);
  const channel = channels.includes(chosenChannel) ? chosenChannel : channels[0] || '';
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pending, setPending] = useState<{ status: StoreProductRecord['status']; rows: StoreProductRecord[]; channel: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; failures?: string[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [queryRevision, setQueryRevision] = useState(0);
  useEffect(() => { setChosenChannel(initialChannel); setQuery(''); setPage(1); setSelected([]); setPending(null); setFeedback(null); }, [productId]);
  const filtered = useMemo(() => ownRecords.filter(row => row.channels.some(id => normalizeDetailChannel(id) === channel)
    && `${row.storeName} ${row.storeId} ${row.formData?.storeCode || ''}`.toLowerCase().includes(query.trim().toLowerCase())), [records, productId, channel, query, queryRevision]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedRows = filtered.filter(row => selected.includes(row.id));
  const targets = selectedRows.length ? selectedRows : filtered;
  const changeChannel = (id: string) => { setChosenChannel(id); onChannelChange?.(id); setSelected([]); setQuery(''); setPage(1); setFeedback(null); };
  const requestAction = (status: StoreProductRecord['status'], rows: StoreProductRecord[] = targets) => {
    const eligible = rows.filter(row => row.status !== status);
    if (eligible.length) setPending({ status, rows: eligible, channel });
  };
  const confirm = async () => {
    if (!pending || !onShelfChange || submitting) return;
    setSubmitting(true);
    try {
      const result = await onShelfChange({ productId, channelId: pending.channel, status: pending.status,
        targets: pending.rows.map(row => ({ id: row.id, expectedStatus: row.status })) });
      setFeedback({ text: `${detailChannelName(pending.channel)}：成功 ${result.succeededIds.length} 家，失败 ${result.failures.length} 家。`,
        failures: result.failures.map(failure => `${pending.rows.find(row => row.id === failure.id)?.storeName || failure.id}：${failure.reason}`) });
      setSelected([]); setPending(null);
    } catch (error) {
      setFeedback({ text: '操作失败，尚未确认执行结果；请刷新核对后重试。', failures: [error instanceof Error ? error.message : '暂时无法提交，请稍后重试。'] });
    } finally { setSubmitting(false); }
  };
  const refresh = () => {
    setRefreshing(true); setQueryRevision(value => value + 1); setSelected([]);
    // 原型重新读取父级共享门店商品数据；生产替换为同范围查询。
    window.setTimeout(() => setRefreshing(false), 180);
  };
  const canAct = Boolean(onShelfChange) && !submitting;
  return <div>
    <div className="mb-4 flex flex-wrap gap-1 rounded bg-[#F5F5F5] p-1 w-fit" role="tablist" aria-label="门店商品渠道">
      {channels.map(id => <button type="button" role="tab" key={id} aria-selected={channel === id} disabled={submitting} onClick={() => changeChannel(id)} className={`rounded px-6 py-2 ${channel === id ? 'bg-white text-[#333] shadow-sm' : 'text-[#666]'}`}>{detailChannelName(id)}</button>)}
    </div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <label className="flex h-8 w-[280px] items-center gap-2 rounded border border-[#DCDFE6] px-3"><Search size={14} className="text-[#999]" /><input aria-label="搜索门店名称、编码或ID" disabled={submitting} value={query} onChange={event => { setQuery(event.target.value); setPage(1); setSelected([]); }} placeholder="请输入门店名称 / 编码 / ID" className="min-w-0 flex-1 outline-none" /></label>
      <div className="flex items-center gap-3"><button type="button" onClick={refresh} disabled={submitting || refreshing} className="flex items-center gap-1 text-[#00A35B]"><RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />{refreshing ? '正在刷新' : '刷新'}</button>
        <button type="button" disabled={!canAct || !targets.some(row => row.status === 'off_shelf')} onClick={() => requestAction('on_shelf')} className="console-secondary-button disabled:opacity-40">一键上架</button>
        <button type="button" disabled={!canAct || !targets.some(row => row.status === 'on_shelf')} onClick={() => requestAction('off_shelf')} className="console-secondary-button disabled:opacity-40">一键下架</button>
      </div>
    </div>
    <p className="mb-3 text-xs text-[#86909C]">{detailChannelName(channel)} · 共 {filtered.length} 家门店{selectedRows.length ? ` · 已选 ${selectedRows.length} 家` : ' · 未勾选时，一键操作作用于当前查询结果的全部门店（含所有分页）'}</p>
    {feedback && <div role="status" className="mb-3 rounded border border-[#E5E6EB] bg-[#F7F8FA] p-3"><div>{feedback.text}</div>{feedback.failures?.map((reason, index) => <p key={index} className="mt-1 text-xs text-[#D03050]">{reason}</p>)}</div>}
    <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-[#F7F8FA] text-[#666]"><tr>
      <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="选择本页全部门店" disabled={submitting || !pageRows.length} checked={pageRows.length > 0 && pageRows.every(row => selected.includes(row.id))} onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...pageRows.map(row => row.id)])] : selected.filter(id => !pageRows.some(row => row.id === id)))} /></th>
      {['门店名称', '商品单价（元）', '商品库存', '状态', '操作'].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}
    </tr></thead><tbody>{pageRows.length ? pageRows.map(row => <tr key={row.id} className="border-b border-[#F0F0F0]">
      <td className="px-4 py-3"><input type="checkbox" aria-label={`选择${row.storeName}`} disabled={submitting} checked={selected.includes(row.id)} onChange={event => setSelected(event.target.checked ? [...selected, row.id] : selected.filter(id => id !== row.id))} /></td>
      <td className="px-4 py-3"><div>{row.storeName}</div><div className="mt-1 text-xs text-[#999]">{row.storeId}</div></td>
      <td className="px-4 py-3">{row.formData?.s_price == null || row.formData.s_price === '' ? '--' : Number(row.formData.s_price).toFixed(2)}</td>
      <td className="px-4 py-3">{row.stockCount === 9999 || row.stockCount === -1 ? '不限库存' : row.stockCount}</td>
      <td className="px-4 py-3">{row.status === 'on_shelf' ? '已上架' : '已下架'}{row.stockStatus === 'empty' ? ' · 已售罄' : ''}</td>
      <td className="px-4 py-3"><div className="flex gap-3 whitespace-nowrap"><button type="button" disabled={!canAct || row.status === 'on_shelf'} onClick={() => requestAction('on_shelf', [row])} className="text-[#00A35B] disabled:text-[#C9CDD4]">上架</button><button type="button" disabled={!canAct || row.status === 'off_shelf'} onClick={() => requestAction('off_shelf', [row])} className="text-[#00A35B] disabled:text-[#C9CDD4]">下架</button></div></td>
    </tr>) : <tr><td colSpan={6} className="py-12 text-center text-[#999]">{query ? '没有符合条件的门店商品' : `当前${channel ? detailChannelName(channel) : '渠道'}暂无门店商品`}</td></tr>}</tbody></table></div>
    <div className="mt-4 flex items-center justify-end gap-3 text-xs text-[#86909C]"><span>共 {filtered.length} 条</span><select aria-label="门店列表每页条数" disabled={submitting} value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded border border-[#DCDFE6] px-2 py-1.5">{[10, 20, 50].map(size => <option key={size} value={size}>{size}条/页</option>)}</select><button type="button" aria-label="上一页门店" disabled={currentPage === 1 || submitting} onClick={() => setPage(currentPage - 1)} className="disabled:opacity-30"><ChevronLeft size={16} /></button><span>{currentPage} / {pages}</span><button type="button" aria-label="下一页门店" disabled={currentPage === pages || submitting} onClick={() => setPage(currentPage + 1)} className="disabled:opacity-30"><ChevronRight size={16} /></button></div>
    {pending && <div role="dialog" aria-modal="true" aria-label="确认门店商品上下架" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 p-6"><div className="w-[520px] rounded-lg bg-white shadow-xl"><header className="flex items-center justify-between border-b border-[#E8E8E8] px-5 py-4"><h2 className="text-base font-semibold">确认{pending.status === 'on_shelf' ? '上架' : '下架'}</h2><button type="button" aria-label="取消上下架" disabled={submitting} onClick={() => setPending(null)}><X size={18} /></button></header><div className="space-y-3 p-5 text-sm"><p className="break-all font-medium">{productName}</p><p>渠道：{detailChannelName(pending.channel)} · {pending.rows.length} 家门店</p><p className="text-xs leading-5 text-[#86909C]">{pending.rows.slice(0, 5).map(row => row.storeName).join('、')}{pending.rows.length > 5 ? '等' : ''}</p><p className="text-xs leading-5 text-[#666]">确认后立即更新以上门店在当前渠道的上下架状态，其他渠道、价格和库存保持原值。可通过相反操作恢复。</p></div><footer className="flex justify-end gap-3 border-t border-[#E8E8E8] px-5 py-3"><button type="button" disabled={submitting} onClick={() => setPending(null)} className="console-secondary-button">取消</button><button type="button" disabled={submitting} onClick={confirm} className="console-primary-button">{submitting ? '正在提交…' : `确认${pending.status === 'on_shelf' ? '上架' : '下架'}`}</button></footer></div></div>}
  </div>;
}
