import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, MoreHorizontal, Plus, Search, X } from 'lucide-react';

export type RequiredPolicyRecord = {
  id: string;
  name: string;
  targetName: string;
  targetType: '商品';
  status: 'enabled' | 'disabled';
  version: number;
  orderMode: '自动加入购物车' | '下单前检查';
  selectionRule: '全部商品必选' | '任选一种';
  channels: string[];
  tableType: string;
  tableAreaScope: string;
  effectiveRule: string;
  applicableStores: string[];
  updatedAt: string;
};

export const MOCK_REQUIRED_POLICIES: RequiredPolicyRecord[] = [
  {
    id: 'RP-1001', name: '火锅锅底必选', targetName: '经典牛油锅底、番茄锅底、菌汤锅底', targetType: '商品',
    status: 'enabled', version: 6, orderMode: '自动加入购物车', selectionRule: '全部商品必选', channels: ['POS', '小程序'], tableType: '不限定桌位类型', tableAreaScope: '不限定桌位区域',
    effectiveRule: '永久有效 · 每天全天', applicableStores: ['范先生的门店', '品牌直营', 'orgtest一级'], updatedAt: '2026-09-02 14:20',
  },
  {
    id: 'RP-1002', name: '麻辣烫口味任选', targetName: '麻辣酱、芝麻酱、蒜泥酱、香辣酱', targetType: '商品',
    status: 'enabled', version: 4, orderMode: '下单前检查', selectionRule: '任选一种', channels: ['POS', '小程序'], tableType: '不限定桌位类型', tableAreaScope: '2 家门店限定区域',
    effectiveRule: '永久有效 · 每天 10:00–22:00', applicableStores: ['范先生的门店', '一级071'], updatedAt: '2026-09-02 11:08',
  },
  {
    id: 'RP-1003', name: '包间茶位必选', targetName: '精品茉莉花茶、陈皮白茶', targetType: '商品',
    status: 'disabled', version: 3, orderMode: '下单前检查', selectionRule: '任选一种', channels: ['POS'], tableType: '限定：包间', tableAreaScope: '1 家门店限定区域',
    effectiveRule: '永久有效 · 每天全天', applicableStores: ['品牌直营'], updatedAt: '2026-09-01 16:30',
  },
];

export const WebRequiredProductPolicyList: React.FC<{
  onCreatePolicy?: () => void;
  onEditPolicy?: (policy: RequiredPolicyRecord) => void;
}> = ({ onCreatePolicy, onEditPolicy }) => {
  const [policies, setPolicies] = useState(MOCK_REQUIRED_POLICIES);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | RequiredPolicyRecord['status']>('all');
  const [detail, setDetail] = useState<RequiredPolicyRecord | null>(null);
  const [deletePolicy, setDeletePolicy] = useState<RequiredPolicyRecord | null>(null);
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionProducts, setExceptionProducts] = useState(['柚C果茶', '米饭']);
  const [exceptionCandidate, setExceptionCandidate] = useState('可乐');
  const [moreId, setMoreId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const filteredPolicies = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return policies.filter(item => (!query || item.name.toLowerCase().includes(query)) && (status === 'all' || item.status === status));
  }, [keyword, policies, status]);

  const reset = () => { setKeyword(''); setStatus('all'); };
  const feedback = (text: string) => { setToast(text); window.setTimeout(() => setToast(''), 2600); };
  const storeSummary = (stores: string[]) => {
    if (!stores.length) return '未选择门店';
    if (stores.length === 1) return stores[0];
    return `${stores[0]}、${stores[1]}${stores.length > 2 ? ` 等 ${stores.length} 家` : ''}`;
  };

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#F5F6FA] p-3">
      {toast && <div className="absolute left-1/2 top-4 z-[110] -translate-x-1/2 rounded-md bg-[#1D2129] px-4 py-2 text-[13px] text-white shadow-lg">{toast}</div>}
      <div className="console-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E9EDF2] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <label className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
              <input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="请输入方案名称" className="h-9 w-[280px] rounded-md border border-[#DDE2E8] pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]" />
            </label>
            <label className="relative">
              <select value={status} onChange={event => setStatus(event.target.value as typeof status)} className="h-9 w-36 appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-8 text-[13px]">
                <option value="all">状态：全部</option><option value="enabled">启用</option><option value="disabled">禁用</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            </label>
            <button onClick={reset} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">重置</button>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => setExceptionOpen(true)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px] text-[#4E5969]">特例设置</button>
            <button onClick={onCreatePolicy} className="inline-flex h-9 items-center rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white"><Plus size={15} className="mr-1.5" />新增必选商品</button>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-[#E9EDF2] px-4 py-2.5 text-[13px] text-[#667085]">
          <span>共 <strong className="text-[#1D2129]">{filteredPolicies.length}</strong> 个方案</span>
          <span>方案按适用门店生效，POS 与小程序直接读取品牌规则</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1240px] table-fixed border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-[#4E5969]"><tr className="border-b border-[#E5E7EB]">
              <th className="w-[210px] px-4 py-3 font-medium">方案名称 / ID</th><th className="px-3 py-3 font-medium">必选商品</th><th className="w-[160px] px-3 py-3 font-medium">必选类型</th><th className="w-[220px] px-3 py-3 font-medium">适用门店</th><th className="w-[200px] px-3 py-3 font-medium">渠道 / 堂食范围</th><th className="w-[100px] px-3 py-3 font-medium">状态</th><th className="w-[150px] px-3 py-3 font-medium">更新时间</th><th className="w-[150px] px-3 py-3 font-medium">操作</th>
            </tr></thead>
            <tbody>{filteredPolicies.map(policy => (
              <tr key={policy.id} className="border-b border-[#EEF0F3] hover:bg-[#FAFCFB]">
                <td className="px-4 py-3"><button onClick={() => setDetail(policy)} className="font-medium text-[#1D2129] hover:text-[#008F4C]">{policy.name}</button><div className="mt-1 text-[12px] text-[#98A2B3]">ID：{policy.id} · V{policy.version}</div></td>
                <td className="px-3 py-3"><div className="line-clamp-2 text-[#344054]">{policy.targetName}</div></td>
                <td className="px-3 py-3"><div className="text-[#344054]">{policy.orderMode}</div><div className="mt-1 text-[12px] text-[#98A2B3]">{policy.selectionRule}</div></td>
                <td className="px-3 py-3"><div className="line-clamp-2 text-[#344054]">{storeSummary(policy.applicableStores)}</div><button onClick={() => setDetail(policy)} className="mt-1 text-[12px] text-[#008F4C]">查看全部 {policy.applicableStores.length} 家</button></td>
                <td className="px-3 py-3"><div className="text-[#344054]">{policy.channels.join('、')}</div><div className="mt-1 text-[12px] text-[#98A2B3]">{policy.tableType}</div><div className="mt-1 text-[12px] text-[#98A2B3]">{policy.tableAreaScope}</div></td>
                <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 ${policy.status === 'enabled' ? 'text-[#008F4C]' : 'text-[#667085]'}`}><span className={`h-2 w-2 rounded-full ${policy.status === 'enabled' ? 'bg-[#00B460]' : 'bg-[#98A2B3]'}`} />{policy.status === 'enabled' ? '启用' : '禁用'}</span></td>
                <td className="px-3 py-3 text-[#667085]">{policy.updatedAt}</td>
                <td className="px-3 py-3"><div className="relative flex items-center gap-3">
                  <button onClick={() => setDetail(policy)} className="font-medium text-[#008F4C]">查看</button><button onClick={() => onEditPolicy?.(policy)} className="text-[#008F4C]">编辑</button><button aria-label="更多操作" onClick={() => setMoreId(moreId === policy.id ? null : policy.id)}><MoreHorizontal size={17} className="text-[#667085]" /></button>
                  {moreId === policy.id && <div className="absolute right-0 top-7 z-30 w-32 rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg">
                    <button onClick={() => { setPolicies(current => current.map(item => item.id === policy.id ? { ...item, status: item.status === 'enabled' ? 'disabled' : 'enabled', updatedAt: '刚刚' } : item)); setMoreId(null); feedback(policy.status === 'enabled' ? '方案已禁用' : '方案已启用'); }} className="w-full px-3 py-2 text-left hover:bg-[#F7F8FA]">{policy.status === 'enabled' ? '禁用' : '启用'}</button>
                    <button onClick={() => { setPolicies(current => [{ ...policy, id: `RP-${Date.now()}`, name: `${policy.name}-副本`, status: 'disabled', updatedAt: '刚刚' }, ...current]); setMoreId(null); feedback('必选方案已复制，新方案默认为禁用'); }} className="w-full px-3 py-2 text-left hover:bg-[#F7F8FA]">复制</button>
                    <button disabled={policy.status === 'enabled'} title={policy.status === 'enabled' ? '请先禁用方案' : '删除方案'} onClick={() => { setDeletePolicy(policy); setMoreId(null); }} className="w-full px-3 py-2 text-left text-[#D92D20] hover:bg-[#FFF5F5] disabled:cursor-not-allowed disabled:text-[#B8C0CC] disabled:hover:bg-white">删除</button>
                  </div>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          {filteredPolicies.length === 0 && <div className="flex h-56 flex-col items-center justify-center text-[13px] text-[#98A2B3]"><Search size={28} className="mb-3" /><span>没有符合当前条件的必选商品方案</span><button onClick={reset} className="mt-2 text-[#008F4C]">清空筛选</button></div>}
        </div>
      </div>

      {detail && <div className="fixed inset-0 z-[80] flex justify-end bg-black/35"><div className="flex h-full w-[560px] flex-col bg-white shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-5"><h3 className="text-[17px] font-semibold">必选方案详情</h3><button onClick={() => setDetail(null)} aria-label="关闭详情"><X size={20} className="text-[#667085]" /></button></div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5 text-[13px]"><div className="rounded-md bg-[#F7F8FA] p-4"><div className="flex items-center justify-between"><div className="font-medium">{detail.name}</div><span className={detail.status === 'enabled' ? 'text-[#008F4C]' : 'text-[#667085]'}>{detail.status === 'enabled' ? '启用' : '禁用'}</span></div><div className="mt-1 text-[#667085]">ID：{detail.id} · 品牌版本 V{detail.version}</div></div>
          <DetailField label="必选商品" value={detail.targetName} /><DetailField label="必选类型" value={detail.orderMode} /><DetailField label="选择规则" value={detail.selectionRule} /><DetailField label={`适用门店（${detail.applicableStores.length} 家）`} value={detail.applicableStores.join('、')} /><DetailField label="适用渠道" value={detail.channels.join('、')} /><DetailField label="桌位类型限定" value={detail.tableType} /><DetailField label="桌位区域限定" value={detail.tableAreaScope} /><DetailField label="生效规则" value={detail.effectiveRule} /><DetailField label="点单约束" value="门店命中多个启用方案时，各方案分别校验并同时满足。" />
        </div>
        <div className="flex justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3"><button onClick={() => setDetail(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">关闭</button><button onClick={() => { setDetail(null); onEditPolicy?.(detail); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white">编辑方案</button></div>
      </div></div>}

      {exceptionOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[620px] rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4"><div><h3 className="font-semibold">特例设置</h3><p className="mt-1 text-[12px] text-[#667085]">订单内商品全部属于特例商品时，不校验必选商品与分类必选。</p></div><button onClick={() => setExceptionOpen(false)} aria-label="关闭特例设置"><X size={20} className="text-[#667085]" /></button></div>
        <div className="space-y-4 p-5 text-[13px]"><div className="flex gap-2"><select value={exceptionCandidate} onChange={event => setExceptionCandidate(event.target.value)} className="h-9 flex-1 rounded-md border border-[#DDE2E8] px-3">{['可乐', '雪碧', '柚C果茶', '米饭', '餐具'].map(product => <option key={product}>{product}</option>)}</select><button onClick={() => { if (!exceptionProducts.includes(exceptionCandidate)) setExceptionProducts(current => [...current, exceptionCandidate]); }} className="h-9 rounded-md border border-[#00B460] px-4 font-medium text-[#008F4C]">添加商品</button></div>
          <div className="overflow-hidden rounded-md border border-[#E5E7EB]"><div className="grid grid-cols-[1fr_90px] bg-[#F7F8FA] px-4 py-3 font-medium text-[#4E5969]"><span>特例商品</span><span>操作</span></div>{exceptionProducts.map(product => <div key={product} className="grid grid-cols-[1fr_90px] border-t border-[#EEF0F3] px-4 py-3"><span>{product}</span><button onClick={() => setExceptionProducts(current => current.filter(item => item !== product))} className="text-left text-[#D92D20]">移除</button></div>)}</div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-[#E5E7EB] px-5 py-3"><span className="text-[12px] text-[#667085]">品牌统一维护，POS 与小程序直接读取。</span><div className="flex gap-2"><button onClick={() => setExceptionOpen(false)} className="h-9 rounded-md border border-[#DDE2E8] px-4">取消</button><button onClick={() => { setExceptionOpen(false); feedback('特例设置已保存，品牌配置已更新'); }} className="h-9 rounded-md bg-[#00B460] px-4 font-medium text-white">保存</button></div></div>
      </div></div>}

      {deletePolicy && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35"><div className="w-[480px] rounded-lg bg-white p-5 shadow-2xl"><div className="flex gap-3"><AlertTriangle size={22} className="shrink-0 text-[#F79009]" /><div><h3 className="font-semibold">删除必选商品方案</h3><p className="mt-2 text-[13px] leading-6 text-[#667085]">删除方案“{deletePolicy.name}”后，其适用门店将不再命中该规则。删除不可恢复，但保留操作审计。</p></div></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeletePolicy(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4">取消</button><button onClick={() => { setPolicies(current => current.filter(item => item.id !== deletePolicy.id)); feedback(`方案“${deletePolicy.name}”已删除`); setDeletePolicy(null); }} className="h-9 rounded-md bg-[#D92D20] px-4 font-medium text-white">确认删除</button></div></div></div>}
    </div>
  );
};

const DetailField = ({ label, value }: { label: string; value: string }) => <div><div className="text-[12px] text-[#98A2B3]">{label}</div><div className="mt-2 rounded-md border border-[#E5E7EB] p-3 leading-6 text-[#344054]">{value || '--'}</div></div>;
