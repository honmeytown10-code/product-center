import type { StoreProductRecord } from './WebStoreProductList';

export const normalizeDetailChannel = (id: string) => ({
  mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take', douyin_dine: 'douyin',
}[id] || id);

export function detailChannels(records: StoreProductRecord[], productId: string, channelIds: string[] = []) {
  const priority = ['mini_dine', 'mini_take', 'pos'];
  return [...new Set([...channelIds, ...records.filter(row => row.baseProductId === productId).flatMap(row => row.channels)].map(normalizeDetailChannel))]
    .sort((a, b) => (priority.includes(a) ? priority.indexOf(a) : 99) - (priority.includes(b) ? priority.indexOf(b) : 99));
}

export interface DetailShelfRequest {
  productId: string;
  channelId: string;
  targets: { id: string; expectedStatus: StoreProductRecord['status'] }[];
  status: StoreProductRecord['status'];
}
export interface DetailShelfResult {
  succeededIds: string[];
  failures: { id: string; reason: string }[];
}

// 与门店商品页相同：多渠道合并记录先拆出当前渠道，不能连带修改其他渠道。
export function applyDetailShelfChange(records: StoreProductRecord[], request: DetailShelfRequest) {
  let nextRecords = [...records];
  const result: DetailShelfResult = { succeededIds: [], failures: [] };
  for (const target of request.targets) {
    const index = nextRecords.findIndex(row => row.id === target.id && row.baseProductId === request.productId
      && row.channels.some(id => normalizeDetailChannel(id) === normalizeDetailChannel(request.channelId)));
    if (index < 0) { result.failures.push({ id: target.id, reason: '门店渠道商品已移除或范围已变化，请刷新后重试。' }); continue; }
    const row = nextRecords[index];
    if (row.status !== target.expectedStatus && row.status !== request.status) {
      result.failures.push({ id: target.id, reason: '上下架状态已变化，请刷新后重试。' }); continue;
    }
    if (row.status !== request.status) {
      const selected = row.channels.filter(id => normalizeDetailChannel(id) === normalizeDetailChannel(request.channelId));
      const remaining = row.channels.filter(id => !selected.includes(id));
      if (remaining.length) {
        nextRecords[index] = { ...row, channels: remaining };
        nextRecords.push({ ...row, id: `${row.id}::${normalizeDetailChannel(request.channelId)}`, channels: [selected[0]], status: request.status });
      } else nextRecords[index] = { ...row, status: request.status };
    }
    result.succeededIds.push(target.id);
  }
  return { records: nextRecords, ...result };
}
