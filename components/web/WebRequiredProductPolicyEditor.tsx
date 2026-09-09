import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, CheckSquare, ChevronLeft, CircleDot, Plus, Search, Square, X } from 'lucide-react';
import type { RequiredPolicyRecord } from './WebRequiredProductPolicyList';

type QuantityMode = 'fixed' | 'diners';
type OrderMode = 'auto' | 'check';
type SelectionRule = 'all' | 'anyOne';
type EffectiveMode = 'forever' | 'custom';
type ActivityPeriod = 'daily' | 'weekly' | 'monthly';
type ActivityTime = 'allDay' | 'specified';

type RequiredItemRow = {
  id: string;
  name: string;
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  dineInQuantityMode: QuantityMode;
  takeawayQuantityMode: QuantityMode;
  dineInCount: number;
  takeawayCount: number;
};

type Feedback = { kind: 'success' | 'error'; text: string };

const REQUIRED_PRODUCTS = ['方案商品111', '招牌珍珠奶茶', '手打柠檬茶', '杨枝甘露', '精品拿铁', '超值双人套餐'];

const STORE_OPTIONS = [
  { id: 'store-1', name: '范先生的门店', code: '103210', organization: '餐饮2.0品牌+' },
  { id: 'store-2', name: '品牌直营', code: '103195', organization: '餐饮2.0品牌+' },
  { id: 'store-3', name: 'orgtest一级', code: '101608', organization: '华南区域' },
  { id: 'store-4', name: '一级071', code: '101593', organization: '华南区域' },
  { id: 'store-5', name: '一级06', code: '101587', organization: '华东区域' },
];

export const WebRequiredProductPolicyEditor: React.FC<{
  mode: 'create' | 'edit';
  policy?: RequiredPolicyRecord | null;
  onBack: () => void;
}> = ({ mode, policy, onBack }) => {
  const [policyName, setPolicyName] = useState(policy?.name || '');
  const [channels, setChannels] = useState<Set<string>>(new Set(['POS', '小程序']));
  const [orderMode, setOrderMode] = useState<OrderMode>(() => policy?.orderMode === '下单前检查' ? 'check' : 'auto');
  const [selectionRule, setSelectionRule] = useState<SelectionRule>(() => policy?.selectionRule === '任选一种' ? 'anyOne' : 'all');
  const [tableType, setTableType] = useState('全部桌位类型');
  const [effectiveMode, setEffectiveMode] = useState<EffectiveMode>('forever');
  const [effectiveStart, setEffectiveStart] = useState('2026-08-29');
  const [effectiveEnd, setEffectiveEnd] = useState('2026-12-31');
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>('daily');
  const [activityTime, setActivityTime] = useState<ActivityTime>('allDay');
  const [timeStart, setTimeStart] = useState('10:00');
  const [timeEnd, setTimeEnd] = useState('22:00');
  const [retriggersWithDiners, setRetriggersWithDiners] = useState(true);
  const [allowQuantityEdit, setAllowQuantityEdit] = useState(false);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [storeKeyword, setStoreKeyword] = useState('');
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(() => {
    const names = policy?.applicableStores || ['范先生的门店', '品牌直营'];
    return new Set(STORE_OPTIONS.filter(store => names.includes(store.name)).map(store => store.id));
  });
  const [removeRowId, setRemoveRowId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [requiredRows, setRequiredRows] = useState<RequiredItemRow[]>([
    {
      id: 'item-1',
      name: policy?.targetName?.split('、')[0] || '方案商品111',
      dineInEnabled: true,
      takeawayEnabled: true,
      dineInQuantityMode: 'fixed',
      takeawayQuantityMode: 'fixed',
      dineInCount: 2,
      takeawayCount: 2,
    },
  ]);

  const toggleChannel = (channel: string) => {
    setChannels(current => {
      const next = new Set(current);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  };

  const updateRow = (rowId: string, updater: (row: RequiredItemRow) => RequiredItemRow) => {
    setRequiredRows(current => current.map(row => (row.id === rowId ? updater(row) : row)));
  };

  const addRequiredItem = (name: string) => {
    if (requiredRows.some(item => item.name === name)) {
      setFeedback({ kind: 'error', text: `“${name}”已在必选设置中` });
      return;
    }
    setRequiredRows(current => [
      ...current,
      {
        id: `item-${Date.now()}`,
        name,
        dineInEnabled: true,
        takeawayEnabled: false,
        dineInQuantityMode: 'fixed',
        takeawayQuantityMode: 'fixed',
        dineInCount: 1,
        takeawayCount: 1,
      },
    ]);
    setProductSelectorOpen(false);
    setFeedback(null);
  };

  const savePolicy = () => {
    if (!policyName.trim()) return setFeedback({ kind: 'error', text: '请输入方案名称' });
    if (!channels.size) return setFeedback({ kind: 'error', text: '请至少选择一个适用渠道' });
    if (!selectedStoreIds.size) return setFeedback({ kind: 'error', text: '请至少选择一家适用门店' });
    if (!requiredRows.length) return setFeedback({ kind: 'error', text: '请至少选择一个必选商品' });
    if (requiredRows.some(row => !row.dineInEnabled && !row.takeawayEnabled)) {
      return setFeedback({ kind: 'error', text: '每个必选商品至少选择堂食或外卖一种订单类型' });
    }
    if (requiredRows.some(row =>
      (row.dineInEnabled && row.dineInQuantityMode === 'fixed' && row.dineInCount < 1)
      || (row.takeawayEnabled && row.takeawayQuantityMode === 'fixed' && row.takeawayCount < 1)
    )) return setFeedback({ kind: 'error', text: '固定必选数量必须大于 0' });
    if (effectiveMode === 'custom' && (!effectiveStart || !effectiveEnd || effectiveStart > effectiveEnd)) {
      return setFeedback({ kind: 'error', text: '请设置正确的生效日期范围' });
    }
    if (activityTime === 'specified' && (!timeStart || !timeEnd || timeStart >= timeEnd)) {
      return setFeedback({ kind: 'error', text: '请设置正确的活动时段' });
    }
    setFeedback({
      kind: 'success',
      text: mode === 'create'
        ? `方案已创建，将在所选 ${selectedStoreIds.size} 家门店按生效规则执行。`
        : `方案已保存，所选 ${selectedStoreIds.size} 家门店将直接读取品牌最新规则。`,
    });
  };

  const visibleStores = STORE_OPTIONS.filter(store => {
    const query = storeKeyword.trim().toLowerCase();
    return !query || [store.name, store.code, store.organization].join(' ').toLowerCase().includes(query);
  });

  const selectedStores = STORE_OPTIONS.filter(store => selectedStoreIds.has(store.id));

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds(current => {
      const next = new Set(current);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  return (
    <div className="pc-page flex flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-6 shadow-sm">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 text-[#667085] hover:text-[#1D2939]" aria-label="返回必选商品列表"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-bold text-[#1D2939]">{mode === 'create' ? '新增必选商品' : `编辑${policy?.name || '必选商品'}`}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="h-9 rounded-md border border-[#DDE2E8] px-5 text-sm text-[#475467] hover:bg-[#F7F8FA]">取消</button>
          <button onClick={savePolicy} className="h-9 rounded-md bg-[#00B460] px-5 text-sm font-bold text-white hover:bg-[#009D54]">保存方案</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-[1380px] space-y-4">
          <section className="rounded-lg border border-[#E5E9EF] bg-white p-5">
            <h3 className="mb-5 text-base font-semibold text-[#1D2939]">基础设置</h3>
            <div className="space-y-5">
              <EditorRow label="方案名称" required>
                <input value={policyName} onChange={event => setPolicyName(event.target.value)} placeholder="请输入方案名称" className="h-9 w-[360px] rounded-md border border-[#DDE2E8] px-3 text-sm outline-none focus:border-[#00B460]" />
              </EditorRow>

              <EditorRow label="适用渠道" required>
                <div className="flex h-9 items-center gap-6">
                  {['POS', '小程序'].map(channel => <CheckOption key={channel} checked={channels.has(channel)} onClick={() => toggleChannel(channel)} label={channel} />)}
                </div>
              </EditorRow>

              <EditorRow label="必选类型" required alignTop>
                <div className="grid max-w-[820px] grid-cols-2 gap-3">
                  <ChoiceCard selected={orderMode === 'auto'} title="自动加入购物车" description="系统按配置数量加入全部必选商品。" onClick={() => { setOrderMode('auto'); setSelectionRule('all'); }} />
                  <ChoiceCard selected={orderMode === 'check'} title="下单前检查" description="不自动加购，未满足时提示顾客选择必选商品。" onClick={() => setOrderMode('check')} />
                </div>
              </EditorRow>

              <EditorRow label="选择规则" required alignTop>
                <div className="grid max-w-[820px] grid-cols-2 gap-3">
                  <ChoiceCard selected={selectionRule === 'all'} title="全部商品必选" description="方案内每个商品都要满足各自的必选数量。" onClick={() => setSelectionRule('all')} />
                  <ChoiceCard selected={selectionRule === 'anyOne'} title="任选一种" description={orderMode === 'auto' ? '自动加入购物车会加入全部商品，不支持任选一种。' : '方案内任意一种商品满足配置数量即可。'} disabled={orderMode === 'auto'} onClick={() => setSelectionRule('anyOne')} />
                </div>
              </EditorRow>

              <EditorRow label="桌位类型限定">
                <select value={tableType} onChange={event => setTableType(event.target.value)} className="h-9 w-[280px] rounded-md border border-[#DDE2E8] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#00B460]">
                  <option>全部桌位类型</option><option>散台</option><option>包间</option><option>大厅卡座</option><option>露台</option>
                </select>
                <span className="ml-3 text-xs text-[#98A2B3]">仅对堂食订单生效</span>
              </EditorRow>

              <EditorRow label="必选设置" required alignTop>
                <div className="space-y-3">
                  <button onClick={() => setProductSelectorOpen(true)} className="inline-flex h-9 items-center rounded-md border border-[#00B460] bg-white px-4 text-sm font-bold text-[#008F4C] hover:bg-[#F1FBF5]"><Plus size={14} className="mr-1.5" />选择商品</button>
                  <div className="overflow-x-auto rounded-md border border-[#E5E9EF]">
                    <table className="min-w-[1000px] w-full border-collapse text-left">
                      <thead className="bg-[#F7F8FA] text-xs font-semibold text-[#475467]"><tr><th className="w-[220px] px-4 py-3">必选商品</th><th className="w-[120px] px-4 py-3">订单类型</th><th className="px-4 py-3">必选数量</th><th className="w-[88px] px-4 py-3 text-right">操作</th></tr></thead>
                      <tbody className="text-sm text-[#344054]">
                        {requiredRows.map(row => (
                          <tr key={row.id} className="border-t border-[#EEF1F4] align-top">
                            <td className="px-4 py-4 font-medium">{row.name}</td>
                            <td className="px-4 py-4"><div className="space-y-4"><CheckOption checked={row.dineInEnabled} onClick={() => updateRow(row.id, current => ({ ...current, dineInEnabled: !current.dineInEnabled }))} label="堂食" /><CheckOption checked={row.takeawayEnabled} onClick={() => updateRow(row.id, current => ({ ...current, takeawayEnabled: !current.takeawayEnabled }))} label="外卖" /></div></td>
                            <td className="px-4 py-3">
                              <div className="space-y-2">
                                <QuantitySetting label="堂食" active={row.dineInEnabled} mode={row.dineInQuantityMode} count={row.dineInCount} onModeChange={next => updateRow(row.id, current => ({ ...current, dineInQuantityMode: next }))} onDecrease={() => updateRow(row.id, current => ({ ...current, dineInCount: Math.max(1, current.dineInCount - 1) }))} onIncrease={() => updateRow(row.id, current => ({ ...current, dineInCount: current.dineInCount + 1 }))} />
                                <QuantitySetting label="外卖" active={row.takeawayEnabled} mode={row.takeawayQuantityMode} count={row.takeawayCount} onModeChange={next => updateRow(row.id, current => ({ ...current, takeawayQuantityMode: next }))} onDecrease={() => updateRow(row.id, current => ({ ...current, takeawayCount: Math.max(1, current.takeawayCount - 1) }))} onIncrease={() => updateRow(row.id, current => ({ ...current, takeawayCount: current.takeawayCount + 1 }))} />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right"><button onClick={() => setRemoveRowId(row.id)} className="font-medium text-[#D92D20] hover:text-[#B42318]">删除</button></td>
                          </tr>
                        ))}
                        {!requiredRows.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-[#98A2B3]">暂未选择必选商品</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs leading-5 text-[#667085]">堂食与外卖分别设置；每种订单类型只能选择“固定数量”或“与用餐人数相同”中的一种。{selectionRule === 'anyOne' && ' 下单时任一候选商品达到对应数量即视为本方案满足。'}</p>
                </div>
              </EditorRow>
            </div>
          </section>

          <section className="rounded-lg border border-[#E5E9EF] bg-white p-5">
            <h3 className="mb-5 text-base font-semibold text-[#1D2939]">时间设置</h3>
            <div className="space-y-5">
              <EditorRow label="生效时间" required>
                <div className="flex flex-wrap items-center gap-5"><RadioOption checked={effectiveMode === 'forever'} onClick={() => setEffectiveMode('forever')} label="永久有效" /><RadioOption checked={effectiveMode === 'custom'} onClick={() => setEffectiveMode('custom')} label="自定义日期" />{effectiveMode === 'custom' && <div className="flex items-center gap-2"><input type="date" value={effectiveStart} onChange={event => setEffectiveStart(event.target.value)} className="h-9 rounded-md border border-[#DDE2E8] px-3 text-sm" /><span className="text-[#98A2B3]">至</span><input type="date" value={effectiveEnd} onChange={event => setEffectiveEnd(event.target.value)} className="h-9 rounded-md border border-[#DDE2E8] px-3 text-sm" /></div>}</div>
              </EditorRow>
              <EditorRow label="活动周期" required><div className="flex h-9 items-center gap-5">{([['daily', '每天'], ['weekly', '每周'], ['monthly', '每月']] as const).map(([value, label]) => <RadioOption key={value} checked={activityPeriod === value} onClick={() => setActivityPeriod(value)} label={label} />)}</div></EditorRow>
              <EditorRow label="活动时段" required>
                <div className="flex flex-wrap items-center gap-5"><RadioOption checked={activityTime === 'allDay'} onClick={() => setActivityTime('allDay')} label="全天" /><RadioOption checked={activityTime === 'specified'} onClick={() => setActivityTime('specified')} label="指定时间段" />{activityTime === 'specified' && <div className="flex items-center gap-2"><input type="time" value={timeStart} onChange={event => setTimeStart(event.target.value)} className="h-9 rounded-md border border-[#DDE2E8] px-3 text-sm" /><span className="text-[#98A2B3]">至</span><input type="time" value={timeEnd} onChange={event => setTimeEnd(event.target.value)} className="h-9 rounded-md border border-[#DDE2E8] px-3 text-sm" /></div>}</div>
              </EditorRow>
            </div>
          </section>

          <section className="rounded-lg border border-[#E5E9EF] bg-white p-5">
            <h3 className="mb-5 text-base font-semibold text-[#1D2939]">适用门店</h3>
            <EditorRow label="门店范围" required alignTop>
              <div className="max-w-[900px]">
                <button type="button" onClick={() => setStoreSelectorOpen(true)} className="flex h-10 w-full items-center justify-between rounded-md border border-[#DDE2E8] bg-white px-3 text-sm hover:border-[#00B460]">
                  <span className={selectedStores.length ? 'text-[#344054]' : 'text-[#98A2B3]'}>{selectedStores.length ? `已选择 ${selectedStores.length} 家门店` : '请选择适用门店'}</span>
                  <span className="font-medium text-[#008F4C]">选择门店</span>
                </button>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedStores.slice(0, 6).map(store => <span key={store.id} className="rounded bg-[#F2F4F7] px-2 py-1 text-xs text-[#4E5969]">{store.name}</span>)}
                  {selectedStores.length > 6 && <span className="py-1 text-xs text-[#667085]">另 {selectedStores.length - 6} 家</span>}
                </div>
                <p className="mt-2 text-xs leading-5 text-[#667085]">保存后，POS 与小程序按当前门店直接读取品牌规则；不生成门店副本。</p>
              </div>
            </EditorRow>
          </section>

          <section className="rounded-lg border border-[#E5E9EF] bg-white p-5">
            <h3 className="mb-5 text-base font-semibold text-[#1D2939]">高级设置</h3>
            <div className="divide-y divide-[#EEF1F4]">
              <SwitchSetting title="增加人数再次触发必选" description="开启后，堂食订单增加用餐人数时，再次检查并补充对应必选商品。" checked={retriggersWithDiners} onChange={() => setRetriggersWithDiners(value => !value)} />
              <SwitchSetting title="允许修改必选商品数量" description="开启后，门店点餐时可修改自动加入购物车的必选商品数量；仍需满足方案最低数量。" checked={allowQuantityEdit} onChange={() => setAllowQuantityEdit(value => !value)} />
            </div>
          </section>

          {feedback && <div className={`flex items-start rounded-md border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-[#CDEEDC] bg-[#F1FBF5] text-[#26734D]' : 'border-[#FECACA] bg-[#FFF7F6] text-[#B42318]'}`}>{feedback.kind === 'success' ? <CheckCircle2 size={16} className="mr-2 mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />}{feedback.text}</div>}
        </div>
      </div>

      {productSelectorOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[520px] rounded-lg bg-white shadow-2xl"><div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-5"><div><h3 className="font-semibold">选择必选商品</h3><p className="text-xs text-[#667085]">已添加商品会保留在当前方案中</p></div><button onClick={() => setProductSelectorOpen(false)} aria-label="关闭选择商品"><X size={20} className="text-[#667085]" /></button></div><div className="grid grid-cols-2 gap-2 p-5">{REQUIRED_PRODUCTS.map(product => <button key={product} disabled={requiredRows.some(item => item.name === product)} onClick={() => addRequiredItem(product)} className="flex items-center justify-between rounded-md border border-[#DDE2E8] px-3 py-3 text-left text-sm hover:border-[#00B460] disabled:cursor-not-allowed disabled:bg-[#F7F8FA] disabled:text-[#98A2B3]"><span>{product}</span>{requiredRows.some(item => item.name === product) && <span className="text-xs">已添加</span>}</button>)}</div></div></div>}
      {storeSelectorOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="选择适用门店"><div className="flex h-[620px] w-[900px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5"><div><h3 className="font-semibold">选择适用门店</h3><p className="mt-0.5 text-xs text-[#667085]">可按门店名称、编码或组织筛选</p></div><button onClick={() => setStoreSelectorOpen(false)} aria-label="关闭选择门店"><X size={20} className="text-[#667085]" /></button></div>
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_300px]">
          <div className="min-h-0 border-r border-[#E5E7EB]"><div className="border-b border-[#EEF0F3] p-4"><label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /><input value={storeKeyword} onChange={event => setStoreKeyword(event.target.value)} placeholder="搜索门店名称、编码或组织" className="h-9 w-full rounded-md border border-[#DDE2E8] pl-9 pr-3 text-sm outline-none focus:border-[#00B460]" /></label></div><div className="h-[484px] overflow-y-auto p-2">{visibleStores.map(store => <label key={store.id} className="flex cursor-pointer items-center rounded-md px-3 py-3 hover:bg-[#F7F8FA]"><input type="checkbox" checked={selectedStoreIds.has(store.id)} onChange={() => toggleStore(store.id)} className="h-4 w-4 accent-[#00B460]" /><span className="ml-3"><span className="block text-sm text-[#344054]">{store.name}</span><span className="mt-0.5 block text-xs text-[#98A2B3]">{store.organization} · {store.code}</span></span></label>)}</div></div>
          <div className="min-h-0 bg-[#FAFBFC] p-4"><div className="flex items-center justify-between text-sm"><span className="font-medium text-[#344054]">已选 {selectedStores.length} 家</span><button onClick={() => setSelectedStoreIds(new Set())} className="text-[#008F4C]">清空</button></div><div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto">{selectedStores.map(store => <div key={store.id} className="flex items-center justify-between rounded-md border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm"><span className="truncate">{store.name}</span><button onClick={() => toggleStore(store.id)} aria-label={`移除${store.name}`}><X size={14} className="text-[#98A2B3]" /></button></div>)}{!selectedStores.length && <div className="py-12 text-center text-sm text-[#98A2B3]">暂未选择门店</div>}</div></div>
        </div>
        <div className="flex h-14 shrink-0 items-center justify-between border-t border-[#E5E7EB] px-5"><span className="text-xs text-[#667085]">按具体门店 ID 保存适用范围</span><div className="flex gap-2"><button onClick={() => setStoreSelectorOpen(false)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-sm">取消</button><button disabled={!selectedStores.length} onClick={() => setStoreSelectorOpen(false)} className="h-9 rounded-md bg-[#00B460] px-4 text-sm font-medium text-white disabled:bg-[#B8C0CC]">确认选择</button></div></div>
      </div></div>}
      {removeRowId && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[420px] rounded-lg bg-white p-5 shadow-2xl"><h3 className="font-semibold">移除必选商品</h3><p className="mt-2 text-sm leading-6 text-[#667085]">移除后，该商品不再参与本方案的堂食/外卖必选数量校验；保存方案后生效。</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setRemoveRowId(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-sm">取消</button><button onClick={() => { setRequiredRows(current => current.filter(item => item.id !== removeRowId)); setRemoveRowId(null); }} className="h-9 rounded-md bg-[#D92D20] px-4 text-sm font-medium text-white">确认移除</button></div></div></div>}
    </div>
  );
};

const EditorRow = ({ label, required, children, alignTop = false }: { label: string; required?: boolean; children: React.ReactNode; alignTop?: boolean }) => (
  <div className="flex items-start"><div className={`w-[136px] shrink-0 pr-6 text-right text-sm text-[#667085] ${alignTop ? 'pt-2' : 'pt-2.5'}`}>{required && <span className="mr-1 text-[#F04438]">*</span>}{label}:</div><div className="min-w-0 flex-1">{children}</div></div>
);

const CheckOption = ({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} className={`flex items-center gap-2 text-sm ${checked ? 'text-[#008F4C]' : 'text-[#667085]'}`}>{checked ? <CheckSquare size={16} className="text-[#00B460]" /> : <Square size={16} className="text-[#B8C0CC]" />}{label}</button>
);

const RadioOption = ({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} className={`flex items-center gap-2 text-sm ${checked ? 'text-[#008F4C]' : 'text-[#667085]'}`}><span className={`flex h-4 w-4 items-center justify-center rounded-full border ${checked ? 'border-[#00B460]' : 'border-[#B8C0CC]'}`}>{checked && <span className="h-2 w-2 rounded-full bg-[#00B460]" />}</span>{label}</button>
);

const ChoiceCard = ({ selected, title, description, onClick, disabled = false }: { selected: boolean; title: string; description: string; onClick: () => void; disabled?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={`rounded-md border p-4 text-left ${disabled ? 'cursor-not-allowed border-[#E5E9EF] bg-[#F7F8FA] opacity-60' : selected ? 'border-[#00B460] bg-[#F1FBF5]' : 'border-[#DDE2E8] bg-white hover:border-[#AEB8C5]'}`}><div className={`flex items-center gap-2 text-sm font-semibold ${disabled ? 'text-[#98A2B3]' : selected ? 'text-[#008F4C]' : 'text-[#1D2939]'}`}><CircleDot size={16} className={disabled ? 'text-[#C3CAD3]' : selected ? 'text-[#00B460]' : 'text-[#C3CAD3]'} />{title}</div><div className="mt-2 pl-6 text-xs leading-5 text-[#667085]">{description}</div></button>
);

const QuantitySetting = ({ label, active, mode, count, onModeChange, onDecrease, onIncrease }: { label: string; active: boolean; mode: QuantityMode; count: number; onModeChange: (mode: QuantityMode) => void; onDecrease: () => void; onIncrease: () => void }) => (
  <div className={`flex min-h-9 items-center gap-5 rounded-md bg-[#FAFBFC] px-3 py-1.5 ${active ? '' : 'opacity-45'}`}><span className="w-10 shrink-0 text-xs font-medium text-[#667085]">{label}</span><RadioOption checked={mode === 'fixed'} onClick={() => active && onModeChange('fixed')} label="固定数量" /><div className={`inline-flex h-8 items-center overflow-hidden rounded-md border border-[#DDE2E8] bg-white ${mode !== 'fixed' || !active ? 'invisible' : ''}`}><button type="button" onClick={onDecrease} disabled={!active} className="h-8 w-8 border-r border-[#E5E9EF] text-[#667085] hover:bg-[#F7F8FA]">−</button><div className="w-10 text-center text-sm">{count}</div><button type="button" onClick={onIncrease} disabled={!active} className="h-8 w-8 border-l border-[#E5E9EF] text-[#667085] hover:bg-[#F7F8FA]">＋</button></div><RadioOption checked={mode === 'diners'} onClick={() => active && onModeChange('diners')} label="与用餐人数相同" /></div>
);

const SwitchSetting = ({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: () => void }) => (
  <div className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0"><div><div className="text-sm font-medium text-[#344054]">{title}</div><div className="mt-1 text-xs leading-5 text-[#667085]">{description}</div></div><button type="button" onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#00B460]' : 'bg-[#C7CDD4]'}`} aria-label={`${checked ? '关闭' : '开启'}${title}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} /></button></div>
);
