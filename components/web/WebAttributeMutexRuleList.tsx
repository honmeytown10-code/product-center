import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Plus, Search, X } from 'lucide-react';

export type AttributeMutexRuleRecord = { id: string; name: string; baseItems: string; mutexItems: string; remark?: string; enabled: boolean };

export const MOCK_ATTRIBUTE_MUTEX_RULES: AttributeMutexRuleRecord[] = [
  { id: 'mutex-1', name: '冷热温度互斥', baseItems: '- / 中杯,2 / -', mutexItems: '- / 中杯,七分糖 / -', enabled: true },
  { id: 'mutex-2', name: '冷热口味互斥', baseItems: '热 / - / -', mutexItems: '冷 / - / -', enabled: false },
  { id: 'mutex-3', name: '容量与冰量互斥', baseItems: '700ml / 七分糖 / 泡泡冰热', mutexItems: '- / 三分糖,少量冰饮用 / 泡泡冰冰', enabled: true },
  { id: 'mutex-4', name: '测试规则A', baseItems: '- / - / 测试,asl', mutexItems: '- / - / 测试,asl3', enabled: false },
  { id: 'mutex-5', name: '测试规则B', baseItems: '- / - / 测试,asl', mutexItems: '- / - / 测试,asl2', enabled: false },
  { id: 'mutex-6', name: '果味与奶盖互斥', baseItems: '- / - / 椰果', mutexItems: '- / - / 奶盖1', enabled: false },
  { id: 'mutex-7', name: '冰量互斥规则', baseItems: '多 / - / -', mutexItems: '- / 少冰,碎冰,多冰 / -', enabled: false },
  { id: 'mutex-8', name: '温度容量互斥', baseItems: '多 / 不多 / - / -', mutexItems: '- / 全糖,热 / -', enabled: false },
];

type PendingAction = { kind: 'toggle' | 'delete'; rule: AttributeMutexRuleRecord };

export const WebAttributeMutexRuleList: React.FC<{ onCreateRule?: () => void; onEditRule?: (rule: AttributeMutexRuleRecord) => void }> = ({ onCreateRule, onEditRule }) => {
  const [rules, setRules] = useState(MOCK_ATTRIBUTE_MUTEX_RULES);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [detail, setDetail] = useState<AttributeMutexRuleRecord | null>(null);
  const [toast, setToast] = useState('');

  const filteredRules = useMemo(() => rules.filter(item => {
    const matchesKeyword = !keyword.trim() || [item.name, item.baseItems, item.mutexItems, item.remark || ''].join(' ').toLowerCase().includes(keyword.trim().toLowerCase());
    return matchesKeyword && (status === 'all' || (status === 'enabled' ? item.enabled : !item.enabled));
  }), [keyword, rules, status]);
  const reset = () => { setKeyword(''); setStatus('all'); };
  const feedback = (text: string) => { setToast(text); window.setTimeout(() => setToast(''), 2400); };
  const execute = () => {
    if (!pending) return;
    if (pending.kind === 'delete') { setRules(current => current.filter(item => item.id !== pending.rule.id)); feedback(`规则“${pending.rule.name}”已删除`); }
    else { setRules(current => current.map(item => item.id === pending.rule.id ? { ...item, enabled: !item.enabled } : item)); feedback(`规则“${pending.rule.name}”已${pending.rule.enabled ? '停用' : '启用'}`); }
    setPending(null);
  };

  return <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#F5F6FA] p-3">
    {toast && <div className="absolute left-1/2 top-4 z-[100] -translate-x-1/2 rounded-md bg-[#1D2129] px-4 py-2 text-[13px] text-white shadow-lg">{toast}</div>}
    <div className="console-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E9EDF2] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2"><label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="规则名称、规格、做法或加料" className="h-9 w-[280px] rounded-md border border-[#DDE2E8] pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]" /></label><label className="relative"><select value={status} onChange={event => setStatus(event.target.value as typeof status)} className="h-9 w-40 appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-8 text-[13px] outline-none"><option value="all">状态：全部</option><option value="enabled">已启用</option><option value="disabled">已停用</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /></label><button onClick={reset} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px] text-[#4E5969]">重置</button></div>
        <button onClick={onCreateRule} className="inline-flex h-9 shrink-0 items-center rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white hover:bg-[#009F55]"><Plus size={15} className="mr-1.5" />添加互斥规则</button>
      </div>
      <div className="flex shrink-0 items-center justify-between border-b border-[#E9EDF2] px-4 py-2.5 text-[13px] text-[#667085]"><span>共 <strong className="text-[#1D2129]">{filteredRules.length}</strong> 条 · 已启用 {rules.filter(item => item.enabled).length} 条</span><span>启用后在点单选择规格、做法和加料时实时校验</span></div>
      <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[1040px] table-fixed border-collapse text-left text-[13px]"><thead className="sticky top-0 z-10 bg-[#F7F8FA] text-[#4E5969]"><tr className="border-b border-[#E5E7EB]"><th className="w-[220px] px-4 py-3 font-medium">规则名称</th><th className="px-3 py-3 font-medium">基础规格 / 做法 / 加料</th><th className="px-3 py-3 font-medium">互斥规格 / 做法 / 加料</th><th className="w-[120px] px-3 py-3 font-medium">状态</th><th className="w-[170px] px-3 py-3 font-medium">操作</th></tr></thead>
        <tbody>{filteredRules.map(rule => <tr key={rule.id} className="border-b border-[#EEF0F3] hover:bg-[#FAFCFB]"><td className="px-4 py-3"><button onClick={() => setDetail(rule)} className="font-medium text-[#1D2129] hover:text-[#008F4C]">{rule.name}</button><div className="mt-1 text-[12px] text-[#98A2B3]">ID：{rule.id}</div></td><td className="px-3 py-3 text-[#4E5969]">{rule.baseItems}</td><td className="px-3 py-3 text-[#4E5969]">{rule.mutexItems}</td><td className="px-3 py-3"><button onClick={() => setPending({ kind: 'toggle', rule })} className={rule.enabled ? 'text-[#008F4C]' : 'text-[#98A2B3]'}><span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${rule.enabled ? 'bg-[#00B460]' : 'bg-[#B8C0CC]'}`} />{rule.enabled ? '已启用' : '已停用'}</button></td><td className="px-3 py-3"><div className="flex gap-3"><button onClick={() => setDetail(rule)} className="text-[#008F4C]">查看</button><button onClick={() => onEditRule?.(rule)} className="text-[#008F4C]">编辑</button><button onClick={() => setPending({ kind: 'delete', rule })} className="text-[#D92D20]">删除</button></div></td></tr>)}</tbody></table>
        {filteredRules.length === 0 && <div className="flex h-56 flex-col items-center justify-center text-[13px] text-[#98A2B3]"><Search size={28} className="mb-3" /><span>没有符合当前条件的互斥规则</span><button onClick={reset} className="mt-2 text-[#008F4C]">清空筛选</button></div>}
      </div>
    </div>
    {detail && <div className="fixed inset-0 z-[80] flex justify-end bg-black/35"><div className="flex h-full w-[520px] flex-col bg-white shadow-2xl"><div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-5"><h3 className="text-[17px] font-semibold">互斥规则详情</h3><button onClick={() => setDetail(null)}><X size={20} className="text-[#667085]" /></button></div><div className="flex-1 space-y-5 overflow-y-auto p-5 text-[13px]"><div><div className="text-[12px] text-[#98A2B3]">规则名称</div><div className="mt-1 font-medium">{detail.name}</div></div><div><div className="text-[12px] text-[#98A2B3]">条件组</div><div className="mt-2 rounded-md border border-[#E5E7EB] p-3">{detail.baseItems}</div></div><div><div className="text-[12px] text-[#98A2B3]">互斥组</div><div className="mt-2 rounded-md border border-[#E5E7EB] p-3">{detail.mutexItems}</div></div><div><div className="text-[12px] text-[#98A2B3]">规则状态</div><div className="mt-1">{detail.enabled ? '已启用' : '已停用'}</div></div></div><div className="flex justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3"><button onClick={() => setDetail(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">关闭</button><button onClick={() => { setDetail(null); onEditRule?.(detail); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white">编辑规则</button></div></div></div>}
    {pending && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[460px] rounded-lg bg-white p-5 shadow-2xl"><div className="flex gap-3"><AlertTriangle size={22} className="shrink-0 text-[#F79009]" /><div><h3 className="font-semibold">{pending.kind === 'delete' ? '删除互斥规则' : `${pending.rule.enabled ? '停用' : '启用'}互斥规则`}</h3><p className="mt-2 text-[13px] leading-6 text-[#667085]">规则“{pending.rule.name}”将影响其适用商品下的规格、做法与加料选择。</p><p className="text-[13px] leading-6 text-[#667085]">{pending.kind === 'delete' ? '删除后不可恢复；历史订单不受影响。' : pending.rule.enabled ? '停用后新订单不再校验该互斥关系，已生成订单不受影响。' : '启用后新订单立即按此关系限制组合选择，请先确认客户端版本兼容。'}</p></div></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setPending(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">取消</button><button onClick={execute} className={`h-9 rounded-md px-4 text-[13px] font-medium text-white ${pending.kind === 'delete' ? 'bg-[#D92D20]' : 'bg-[#00B460]'}`}>确认{pending.kind === 'delete' ? '删除' : pending.rule.enabled ? '停用' : '启用'}</button></div></div></div>}
  </div>;
};
