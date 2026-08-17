import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Clock3, Copy, MoreHorizontal, Search, Store, X } from 'lucide-react';

type PriceStatus = 'enabled' | 'disabled';
type PriceChannel = 'mini' | 'pos' | 'takeout';

type PriceSystemRecord = {
  id: string;
  name: string;
  storeName: string;
  status: PriceStatus;
  channels: PriceChannel[];
  effectiveTime: string;
};

type PriceStrategyModalState = { mode: 'create' | 'edit'; record?: PriceSystemRecord };
type ConfirmState = { kind: 'toggle' | 'delete'; record: PriceSystemRecord };
type DetailState = { kind: 'price' | 'store' | 'time'; record: PriceSystemRecord };

const INITIAL_PRICE_SYSTEMS: PriceSystemRecord[] = [
  { id: '1214953234677141504', name: '多的是', storeName: '深圳南山万象店', status: 'disabled', channels: ['mini', 'takeout'], effectiveTime: '全时段' },
  { id: '1209877285232644096', name: '1', storeName: '清远阳山门店城镇北门店', status: 'disabled', channels: ['mini', 'takeout'], effectiveTime: '2026-08-01 至 2026-12-31' },
  { id: '1194673558491480065', name: '修银2.0', storeName: '修银体验店', status: 'enabled', channels: ['mini', 'takeout', 'pos'], effectiveTime: '全时段' },
  { id: '1194672688387309568', name: '餐饮2.0', storeName: '餐饮2.0品牌+', status: 'enabled', channels: ['mini', 'takeout', 'pos'], effectiveTime: '每周一至周五 09:00-22:00' },
];

const CHANNEL_LABELS: Record<PriceChannel, string> = { mini: '小程序-堂食', pos: 'POS', takeout: '小程序-外卖' };

export const WebPriceSystemList: React.FC = () => {
  const [records, setRecords] = useState(INITIAL_PRICE_SYSTEMS);
  const [systemId, setSystemId] = useState('');
  const [systemName, setSystemName] = useState('');
  const [storeKeyword, setStoreKeyword] = useState('');
  const [channel, setChannel] = useState<'' | PriceChannel>('');
  const [status, setStatus] = useState<'' | PriceStatus>('');
  const [modalState, setModalState] = useState<PriceStrategyModalState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [moreId, setMoreId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const filteredRecords = useMemo(() => records.filter(record => {
    if (systemId.trim() && !record.id.includes(systemId.trim())) return false;
    if (systemName.trim() && !record.name.toLowerCase().includes(systemName.trim().toLowerCase())) return false;
    if (storeKeyword.trim() && !record.storeName.toLowerCase().includes(storeKeyword.trim().toLowerCase())) return false;
    if (channel && !record.channels.includes(channel)) return false;
    return !status || record.status === status;
  }), [records, systemId, systemName, storeKeyword, channel, status]);

  const resetFilters = () => { setSystemId(''); setSystemName(''); setStoreKeyword(''); setChannel(''); setStatus(''); };
  const feedback = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const saveRecord = (record: PriceSystemRecord) => {
    setRecords(current => modalState?.mode === 'edit'
      ? current.map(item => item.id === record.id ? record : item)
      : [record, ...current]);
    feedback(modalState?.mode === 'edit' ? '价格策略已更新' : '价格策略已创建，当前为停用状态');
    setModalState(null);
  };
  const executeConfirm = () => {
    if (!confirmState) return;
    const { kind, record } = confirmState;
    if (kind === 'delete') {
      setRecords(current => current.filter(item => item.id !== record.id));
      feedback(`价格策略“${record.name}”已删除`);
    } else {
      setRecords(current => current.map(item => item.id === record.id ? { ...item, status: item.status === 'enabled' ? 'disabled' : 'enabled' } : item));
      feedback(`价格策略“${record.name}”已${record.status === 'enabled' ? '停用' : '启用'}`);
    }
    setConfirmState(null);
  };

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#F5F6FA] p-3">
      <div className="console-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {toast && <div className="absolute left-1/2 top-4 z-[100] -translate-x-1/2 rounded-md bg-[#1D2129] px-4 py-2 text-[13px] text-white shadow-lg">{toast}</div>}

        <div className="shrink-0 border-b border-[#E9EDF2] px-4 py-3">
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-[minmax(150px,0.8fr)_minmax(170px,1fr)_minmax(190px,1.15fr)_170px_150px_auto]">
            <FilterInput value={systemId} onChange={setSystemId} placeholder="策略ID" />
            <FilterInput value={systemName} onChange={setSystemName} placeholder="策略名称" />
            <FilterInput value={storeKeyword} onChange={setStoreKeyword} placeholder="机构/门店名称" />
            <label className="relative">
              <select value={channel} onChange={event => setChannel(event.target.value as '' | PriceChannel)} className={`h-9 w-full appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-8 text-[13px] outline-none focus:border-[#00B460] ${channel ? 'text-[#344054]' : 'text-[#98A2B3]'}`}>
                <option value="">生效渠道：请选择</option>
                <option value="mini">小程序-堂食</option>
                <option value="takeout">小程序-外卖</option>
                <option value="pos">POS</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            </label>
            <label className="relative">
              <select value={status} onChange={event => setStatus(event.target.value as '' | PriceStatus)} className={`h-9 w-full appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-8 text-[13px] outline-none focus:border-[#00B460] ${status ? 'text-[#344054]' : 'text-[#98A2B3]'}`}>
                <option value="">启用状态：请选择</option><option value="enabled">启用中</option><option value="disabled">禁用中</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={resetFilters} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px] text-[#4E5969] hover:bg-[#F7F8FA]">重置</button>
              <button type="button" onClick={() => feedback(`已查询到 ${filteredRecords.length} 条价格策略`)} className="h-9 rounded-md bg-[#00B460] px-5 text-[13px] font-medium text-white hover:bg-[#009F55]">查询</button>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-[#E9EDF2] px-4 py-2.5 text-[13px] text-[#667085]">
          <span>共 <strong className="text-[#1D2129]">{filteredRecords.length}</strong> 条策略 · 启用 {records.filter(item => item.status === 'enabled').length} 条</span>
          <button type="button" onClick={() => setModalState({ mode: 'create' })} className="h-9 shrink-0 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white hover:bg-[#009F55]">新增价格策略</button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1040px] table-fixed border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-[#4E5969]"><tr className="border-b border-[#E5E7EB]">
              <th className="w-[210px] px-4 py-3 font-medium">策略名称 / ID</th><th className="w-[220px] px-3 py-3 font-medium">机构门店</th><th className="w-[220px] px-3 py-3 font-medium">生效渠道</th><th className="px-3 py-3 font-medium">生效时间</th><th className="w-[110px] px-3 py-3 font-medium">状态</th><th className="sticky right-0 z-20 w-[210px] border-l border-[#EEF0F3] bg-[#F7F8FA] px-3 py-3 font-medium">操作</th>
            </tr></thead>
            <tbody>{filteredRecords.map(record => <tr key={record.id} className="border-b border-[#EEF0F3] bg-white hover:bg-[#FAFCFB]">
              <td className="px-4 py-3"><div className="font-medium text-[#1D2129]">{record.name}</div><div className="mt-1 text-[12px] text-[#98A2B3]">ID：{record.id}</div></td>
              <td className="px-3 py-3"><button type="button" onClick={() => setDetailState({ kind: 'store', record })} className="text-[#344054] hover:text-[#008F4C]">{record.storeName}</button></td>
              <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{record.channels.map(channel => <span key={channel} className="rounded border border-[#E1E5EA] bg-white px-2 py-0.5 text-[12px] text-[#667085]">{CHANNEL_LABELS[channel]}</span>)}</div></td>
              <td className="px-3 py-3"><button type="button" onClick={() => setDetailState({ kind: 'time', record })} className="inline-flex items-center text-[#344054] hover:text-[#008F4C]"><Clock3 size={14} className="mr-1.5 text-[#98A2B3]" />{record.effectiveTime}</button></td>
              <td className="px-3 py-3"><button type="button" onClick={() => setConfirmState({ kind: 'toggle', record })} className={record.status === 'enabled' ? 'text-[#008F4C]' : 'text-[#98A2B3]'}><span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${record.status === 'enabled' ? 'bg-[#00B460]' : 'bg-[#B8C0CC]'}`} />{record.status === 'enabled' ? '启用中' : '禁用中'}</button></td>
              <td className="sticky right-0 border-l border-[#EEF0F3] bg-white px-3 py-3 shadow-[-6px_0_8px_rgba(17,24,39,0.025)]"><div className="relative flex items-center gap-3 whitespace-nowrap">
                <button type="button" onClick={() => setDetailState({ kind: 'price', record })} className="text-[#008F4C] hover:text-[#006F3B]">价格管理</button>
                <button type="button" onClick={() => setModalState({ mode: 'edit', record })} className="text-[#008F4C] hover:text-[#006F3B]">编辑</button>
                <button type="button" aria-label="更多操作" onClick={() => setMoreId(moreId === record.id ? null : record.id)} className="text-[#667085] hover:text-[#1D2129]"><MoreHorizontal size={17} /></button>
                {moreId === record.id && <div className="absolute right-0 top-7 z-30 w-32 rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg">
                  <button type="button" onClick={() => { setRecords(current => [{ ...record, id: `${Date.now()}`, name: `${record.name}-副本`, status: 'disabled' }, ...current]); setMoreId(null); feedback('已复制策略，副本默认为停用状态'); }} className="flex w-full items-center px-3 py-2 text-left text-[13px] hover:bg-[#F7F8FA]"><Copy size={14} className="mr-2" />复制</button>
                  <button type="button" onClick={() => { setConfirmState({ kind: 'delete', record }); setMoreId(null); }} className="w-full px-3 py-2 text-left text-[13px] text-[#D92D20] hover:bg-[#FFF5F5]">删除</button>
                </div>}
              </div></td>
            </tr>)}</tbody>
          </table>
          {filteredRecords.length === 0 && <div className="flex h-56 flex-col items-center justify-center text-[13px] text-[#98A2B3]"><Search size={28} className="mb-3" /><p>没有符合当前条件的价格策略</p><button type="button" onClick={resetFilters} className="mt-2 text-[#008F4C]">清空筛选</button></div>}
        </div>
      </div>

      {modalState && <PriceStrategyModal mode={modalState.mode} record={modalState.record} onClose={() => setModalState(null)} onSave={saveRecord} />}
      {detailState && <DetailDrawer state={detailState} onClose={() => setDetailState(null)} />}
      {confirmState && <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} onConfirm={executeConfirm} />}
    </div>
  );
};

const FilterInput = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="h-9 w-full rounded-md border border-[#DDE2E8] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]" /></label>;

const PriceStrategyModal = ({ mode, record, onClose, onSave }: { mode: 'create' | 'edit'; record?: PriceSystemRecord; onClose: () => void; onSave: (record: PriceSystemRecord) => void }) => {
  const [name, setName] = useState(record?.name || '');
  const [desc, setDesc] = useState('');
  const [dateMode, setDateMode] = useState<'always' | 'custom'>(record?.effectiveTime === '全时段' ? 'always' : 'custom');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [channelConfig, setChannelConfig] = useState({ miniProgram: { dineIn: record?.channels.includes('mini') ?? false, takeout: record?.channels.includes('takeout') ?? false }, pos: { dineIn: record?.channels.includes('pos') ?? true, takeout: record?.channels.includes('pos') ?? true } });
  const [error, setError] = useState('');
  const update = (channel: 'miniProgram' | 'pos', field: 'dineIn' | 'takeout') => setChannelConfig(prev => ({ ...prev, [channel]: { ...prev[channel], [field]: !prev[channel][field] } }));
  const submit = () => {
    if (!name.trim()) return setError('请输入策略名称');
    const channels: PriceChannel[] = [];
    if (channelConfig.miniProgram.dineIn) channels.push('mini');
    if (channelConfig.miniProgram.takeout) channels.push('takeout');
    if (channelConfig.pos.dineIn || channelConfig.pos.takeout) channels.push('pos');
    if (!channels.length) return setError('请至少选择一个生效渠道和售卖类型');
    onSave({ id: record?.id || `${Date.now()}`, name: name.trim(), storeName: record?.storeName || '暂未选择机构门店', status: record?.status || 'disabled', channels: Array.from(new Set(channels)), effectiveTime: dateMode === 'always' ? '全时段' : `${startDate} 至 ${endDate}` });
  };
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true">
    <div className="flex max-h-[86vh] w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5"><div><h3 className="text-[17px] font-semibold text-[#1D2129]">{mode === 'create' ? '新增价格策略' : '编辑价格策略'}</h3><p className="text-[12px] text-[#667085]">配置策略定义；适用门店与商品价格在后续管理中维护。</p></div><button onClick={onClose} aria-label="关闭"><X size={20} className="text-[#667085]" /></button></div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <ModalRow label="策略名称" required><div><input value={name} onChange={event => { setName(event.target.value.slice(0, 20)); setError(''); }} className="h-9 w-[360px] rounded-md border border-[#DDE2E8] px-3 text-[13px] outline-none focus:border-[#00B460]" /><span className="ml-2 text-[12px] text-[#98A2B3]">{name.length}/20</span></div></ModalRow>
        <ModalRow label="策略描述"><textarea value={desc} onChange={event => setDesc(event.target.value.slice(0, 50))} rows={3} className="w-[460px] resize-none rounded-md border border-[#DDE2E8] px-3 py-2 text-[13px] outline-none focus:border-[#00B460]" /><div className="mt-1 text-[12px] text-[#98A2B3]">{desc.length}/50</div></ModalRow>
        <ModalRow label="生效日期" required><div className="space-y-3 text-[13px]"><div className="flex gap-6"><label><input type="radio" checked={dateMode === 'always'} onChange={() => setDateMode('always')} className="mr-2 accent-[#00B460]" />全时段</label><label><input type="radio" checked={dateMode === 'custom'} onChange={() => setDateMode('custom')} className="mr-2 accent-[#00B460]" />自定义日期</label></div>{dateMode === 'custom' && <div className="flex items-center gap-2"><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="h-9 rounded-md border border-[#DDE2E8] px-3" /><span>至</span><input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} className="h-9 rounded-md border border-[#DDE2E8] px-3" /></div>}</div></ModalRow>
        <ModalRow label="生效渠道" required><div className="w-[500px] overflow-hidden rounded-md border border-[#E5E7EB]"><table className="w-full text-left text-[13px]"><thead className="bg-[#F7F8FA]"><tr><th className="px-4 py-2.5">售卖渠道</th><th className="px-4 py-2.5">堂食</th><th className="px-4 py-2.5">外卖</th></tr></thead><tbody><ChannelRow name="小程序" values={channelConfig.miniProgram} onChange={field => update('miniProgram', field)} /><ChannelRow name="POS" values={channelConfig.pos} onChange={field => update('pos', field)} /></tbody></table></div></ModalRow>
        {error && <div className="ml-[112px] text-[13px] text-[#D92D20]">{error}</div>}
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-[#E5E7EB] px-5 py-3"><span className="text-[12px] text-[#667085]">新建策略默认停用，完成价格与门店配置后再启用。</span><div className="flex gap-2"><button onClick={onClose} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">取消</button><button onClick={submit} className="h-9 rounded-md bg-[#00B460] px-5 text-[13px] font-medium text-white">保存</button></div></div>
    </div>
  </div>;
};

const ChannelRow = ({ name, values, onChange }: { name: string; values: { dineIn: boolean; takeout: boolean }; onChange: (field: 'dineIn' | 'takeout') => void }) => <tr className="border-t border-[#EEF0F3]"><td className="px-4 py-3">{name}</td><td className="px-4 py-3"><label><input type="checkbox" checked={values.dineIn} onChange={() => onChange('dineIn')} className="mr-2 accent-[#00B460]" />堂食</label></td><td className="px-4 py-3"><label><input type="checkbox" checked={values.takeout} onChange={() => onChange('takeout')} className="mr-2 accent-[#00B460]" />外卖</label></td></tr>;
const ModalRow = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => <div className="flex items-start"><div className="w-28 shrink-0 pt-2 text-right text-[13px] text-[#4E5969]">{required && <span className="mr-1 text-[#D92D20]">*</span>}{label}：</div><div className="min-w-0 flex-1 pl-4">{children}</div></div>;

const DetailDrawer = ({ state, onClose }: { state: DetailState; onClose: () => void }) => <div className="fixed inset-0 z-[80] flex justify-end bg-black/35" role="dialog" aria-modal="true"><div className="flex h-full w-[520px] flex-col bg-white shadow-2xl"><div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-5"><h3 className="text-[17px] font-semibold">{state.kind === 'price' ? '价格管理' : state.kind === 'store' ? '适用门店' : '生效时间'}</h3><button onClick={onClose}><X size={20} className="text-[#667085]" /></button></div><div className="flex-1 overflow-y-auto p-5 text-[13px]"><div className="rounded-md bg-[#F7F8FA] p-4"><div className="font-medium">{state.record.name}</div><div className="mt-1 text-[#667085]">ID：{state.record.id}</div></div>{state.kind === 'store' && <div className="mt-5"><div className="mb-2 font-medium">当前适用机构门店</div><div className="rounded-md border border-[#E5E7EB] p-4"><Store size={16} className="mr-2 inline text-[#00B460]" />{state.record.storeName}</div></div>}{state.kind === 'time' && <div className="mt-5"><div className="mb-2 font-medium">当前生效日期/周期/时段</div><div className="rounded-md border border-[#E5E7EB] p-4">{state.record.effectiveTime}</div></div>}{state.kind === 'price' && <div className="mt-5"><div className="mb-2 font-medium">渠道价格配置</div>{state.record.channels.map(channel => <div key={channel} className="mb-2 flex items-center justify-between rounded-md border border-[#E5E7EB] px-4 py-3"><span>{CHANNEL_LABELS[channel]}</span><button type="button" disabled title="商品价格编辑器尚未接入当前原型" className="cursor-not-allowed text-[#98A2B3]">价格编辑待接入</button></div>)}<p className="mt-4 text-[#667085]">保存价格后形成待发布变更，不会直接覆盖门店当前价格。</p></div>}</div><div className="border-t border-[#E5E7EB] px-5 py-3 text-right"><button onClick={onClose} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">关闭</button></div></div></div>;

const ConfirmDialog = ({ state, onClose, onConfirm }: { state: ConfirmState; onClose: () => void; onConfirm: () => void }) => { const enabling = state.kind === 'toggle' && state.record.status === 'disabled'; const deleting = state.kind === 'delete'; return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[460px] rounded-lg bg-white p-5 shadow-2xl"><div className="flex items-start gap-3"><AlertTriangle size={22} className="mt-0.5 shrink-0 text-[#F79009]" /><div><h3 className="font-semibold text-[#1D2129]">{deleting ? '删除价格策略' : `${enabling ? '启用' : '停用'}价格策略`}</h3><p className="mt-2 text-[13px] leading-6 text-[#667085]">操作对象：“{state.record.name}”，适用范围：{state.record.storeName}、{state.record.channels.map(item => CHANNEL_LABELS[item]).join('、')}。</p><p className="mt-1 text-[13px] leading-6 text-[#667085]">{deleting ? '删除后不可恢复；已下发的门店价格不会自动回滚，可在发布记录中追溯。' : enabling ? '启用后后续发布将按此策略计算渠道价格。' : '停用后不再参与后续价格发布，已下发价格保持不变。'}</p></div></div><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">取消</button><button onClick={onConfirm} className={`h-9 rounded-md px-4 text-[13px] font-medium text-white ${deleting ? 'bg-[#D92D20]' : 'bg-[#00B460]'}`}>{deleting ? '确认删除' : `确认${enabling ? '启用' : '停用'}`}</button></div></div></div>; };
