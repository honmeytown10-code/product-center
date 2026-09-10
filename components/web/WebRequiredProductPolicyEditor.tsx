import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, CheckSquare, ChevronLeft, CircleDot, Plus, Search, Square, X } from 'lucide-react';
import type { RequiredPolicyRecord } from './WebRequiredProductPolicyList';
import { WebProductSelectorDialog, type SelectableProduct } from './WebProductSelectorDialog';

type QuantityMode = 'fixed' | 'diners';
type OrderMode = 'auto' | 'check';
type SelectionRule = 'all' | 'anyOne';
type EffectiveMode = 'forever' | 'custom';
type ActivityPeriod = 'daily' | 'weekly' | 'monthly';
type ActivityTime = 'allDay' | 'specified';

type RequiredItemRow = {
  id: string;
  productId: string;
  name: string;
  autoAddEligible: boolean;
  autoAddRestriction?: string;
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  takeoutEnabled: boolean;
  dineInQuantityMode: QuantityMode;
  takeawayQuantityMode: QuantityMode;
  takeoutQuantityMode: QuantityMode;
  dineInCount: number;
  takeawayCount: number;
  takeoutCount: number;
};

type Feedback = { kind: 'success' | 'error'; text: string };

type RequiredProductOption = SelectableProduct & {
  tags: string[];
  autoAddEligible: boolean;
  autoAddRestriction?: string;
};

const REQUIRED_PRODUCTS: RequiredProductOption[] = [
  { id: 'product-101', name: '方案商品111', tags: ['单规格'], autoAddEligible: true, type: 'standard', frontendCategory: '主食', productCode: 'SP000101', skuCode: 'SKU000101', price: 18, status: 'on_shelf' },
  { id: 'product-102', name: '经典牛油锅底', tags: ['单规格'], autoAddEligible: true, type: 'standard', frontendCategory: '锅底', productCode: 'SP000102', skuCode: 'SKU000102', price: 38, status: 'on_shelf' },
  { id: 'product-103', name: '招牌珍珠奶茶', tags: ['多规格'], autoAddEligible: false, autoAddRestriction: '多规格商品不支持自动加入购物车', type: 'standard', frontendCategory: '饮品', productCode: 'SP000103', skuCode: '3 个规格', price: 16, status: 'on_shelf' },
  { id: 'product-104', name: '手打柠檬茶', tags: ['含加料'], autoAddEligible: false, autoAddRestriction: '已配置加料，不支持自动加入购物车', type: 'standard', frontendCategory: '饮品', productCode: 'SP000104', skuCode: 'SKU000104', price: 15, status: 'on_shelf' },
  { id: 'product-105', name: '杨枝甘露', tags: ['含做法'], autoAddEligible: false, autoAddRestriction: '已配置做法，不支持自动加入购物车', type: 'standard', frontendCategory: '甜品', productCode: 'SP000105', skuCode: 'SKU000105', price: 22, status: 'on_shelf' },
  { id: 'product-106', name: '精品拿铁', tags: ['多规格', '含加料'], autoAddEligible: false, autoAddRestriction: '多规格且已配置加料，不支持自动加入购物车', type: 'standard', frontendCategory: '饮品', productCode: 'SP000106', skuCode: '4 个规格', price: 20, status: 'on_shelf' },
  { id: 'product-107', name: '超值双人套餐', tags: ['单规格'], autoAddEligible: true, type: 'combo', frontendCategory: '套餐', productCode: 'CP000107', skuCode: 'SKU000107', price: 68, status: 'on_shelf' },
  { id: 'product-108', name: '麻辣酱', tags: ['单规格'], autoAddEligible: true, type: 'standard', frontendCategory: '口味', productCode: 'SP000108', skuCode: 'SKU000108', price: 0, status: 'on_shelf' },
  { id: 'product-109', name: '精品茉莉花茶', tags: ['单规格'], autoAddEligible: true, type: 'standard', frontendCategory: '茶位', productCode: 'SP000109', skuCode: 'SKU000109', price: 8, status: 'on_shelf' },
];

const STORE_OPTIONS = [
  { id: 'store-1', name: '范先生的门店', code: '103210', organization: '餐饮2.0品牌+', tableAreas: ['一楼大厅', '临窗区', '包间区', '露台'] },
  { id: 'store-2', name: '品牌直营', code: '103195', organization: '餐饮2.0品牌+', tableAreas: ['大厅 A 区', '大厅 B 区', '包间'] },
  { id: 'store-3', name: 'orgtest一级', code: '101608', organization: '华南区域', tableAreas: [] },
  { id: 'store-4', name: '一级071', code: '101593', organization: '华南区域', tableAreas: ['一层大厅', '二层包间'] },
  { id: 'store-5', name: '一级06', code: '101587', organization: '华东区域', tableAreas: ['大厅', '卡座区'] },
];

const createRequiredItemRow = (name: string, id: string): RequiredItemRow => {
  const product = REQUIRED_PRODUCTS.find(item => item.name === name);
  return {
    id,
    productId: product?.id || `legacy-${id}`,
    name,
    autoAddEligible: product?.autoAddEligible ?? true,
    autoAddRestriction: product?.autoAddRestriction,
    dineInEnabled: true,
    takeawayEnabled: id === 'item-1',
    takeoutEnabled: false,
    dineInQuantityMode: 'fixed',
    takeawayQuantityMode: 'fixed',
    takeoutQuantityMode: 'fixed',
    dineInCount: id === 'item-1' ? 2 : 1,
    takeawayCount: id === 'item-1' ? 2 : 1,
    takeoutCount: 1,
  };
};

export const WebRequiredProductPolicyEditor: React.FC<{
  mode: 'create' | 'edit';
  policy?: RequiredPolicyRecord | null;
  onBack: () => void;
}> = ({ mode, policy, onBack }) => {
  const [policyName, setPolicyName] = useState(policy?.name || '');
  const [channels, setChannels] = useState<Set<string>>(new Set(['POS', '小程序']));
  const [orderMode, setOrderMode] = useState<OrderMode>(() => policy?.orderMode === '自动加入购物车' ? 'auto' : 'check');
  const [selectionRule, setSelectionRule] = useState<SelectionRule>(() => policy?.selectionRule === '任选一种' ? 'anyOne' : 'all');
  const [tableTypeEnabled, setTableTypeEnabled] = useState(false);
  const [tableType, setTableType] = useState('');
  const [tableAreaEnabled, setTableAreaEnabled] = useState(false);
  const [storeAreaSelections, setStoreAreaSelections] = useState<Record<string, string[]>>({});
  const [areaConfigStoreId, setAreaConfigStoreId] = useState<string | null>(null);
  const [areaDraft, setAreaDraft] = useState<Set<string>>(new Set());
  const [orderModeNotice, setOrderModeNotice] = useState<string | null>(null);
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
  const [productDraftIds, setProductDraftIds] = useState<string[]>([]);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [storeKeyword, setStoreKeyword] = useState('');
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(() => {
    const names = policy?.applicableStores || ['范先生的门店', '品牌直营'];
    return new Set(STORE_OPTIONS.filter(store => names.includes(store.name)).map(store => store.id));
  });
  const [removeRowId, setRemoveRowId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [requiredRows, setRequiredRows] = useState<RequiredItemRow[]>([
    createRequiredItemRow(policy?.targetName?.split('、')[0] || '方案商品111', 'item-1'),
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

  const changeOrderMode = (nextMode: OrderMode) => {
    if (nextMode === 'auto') {
      const incompatibleItems = requiredRows.filter(item => !item.autoAddEligible);
      if (incompatibleItems.length) {
        setOrderModeNotice(`请先移除不支持自动加入的商品：${incompatibleItems.map(item => item.name).join('、')}`);
        return;
      }
      setSelectionRule('all');
    }
    setOrderMode(nextMode);
    setOrderModeNotice(null);
    setFeedback(null);
  };

  const openProductSelector = () => {
    setProductDraftIds(requiredRows.map(row => row.productId));
    setProductSelectorOpen(true);
  };

  const savePolicy = () => {
    if (!policyName.trim()) return setFeedback({ kind: 'error', text: '请输入方案名称' });
    if (!channels.size) return setFeedback({ kind: 'error', text: '请至少选择一个适用渠道' });
    if (!selectedStoreIds.size) return setFeedback({ kind: 'error', text: '请至少选择一家适用门店' });
    if (!requiredRows.length) return setFeedback({ kind: 'error', text: '请至少选择一个必选商品' });
    if (orderMode === 'auto' && requiredRows.some(row => !row.autoAddEligible)) {
      return setFeedback({ kind: 'error', text: '自动加入购物车仅支持单规格且未配置做法、加料的商品，请调整必选商品' });
    }
    if (requiredRows.some(row => !row.dineInEnabled && !row.takeawayEnabled && !row.takeoutEnabled)) {
      return setFeedback({ kind: 'error', text: '每个必选商品至少选择堂食、外卖或外带中的一种订单类型' });
    }
    if (requiredRows.some(row =>
      (row.dineInEnabled && row.dineInQuantityMode === 'fixed' && row.dineInCount < 1)
      || (row.takeawayEnabled && row.takeawayQuantityMode === 'fixed' && row.takeawayCount < 1)
      || (row.takeoutEnabled && row.takeoutQuantityMode === 'fixed' && row.takeoutCount < 1)
    )) return setFeedback({ kind: 'error', text: '固定必选数量必须大于 0' });
    if (effectiveMode === 'custom' && (!effectiveStart || !effectiveEnd || effectiveStart > effectiveEnd)) {
      return setFeedback({ kind: 'error', text: '请设置正确的生效日期范围' });
    }
    if (activityTime === 'specified' && (!timeStart || !timeEnd || timeStart >= timeEnd)) {
      return setFeedback({ kind: 'error', text: '请设置正确的活动时段' });
    }
    if (tableTypeEnabled && !tableType) {
      return setFeedback({ kind: 'error', text: '已开启桌位类型限定，请选择一个桌位类型' });
    }
    if (tableAreaEnabled) {
      const pendingStores = selectedStores.filter(store => !(storeAreaSelections[store.id]?.length));
      if (pendingStores.length) {
        return setFeedback({ kind: 'error', text: `请完成 ${pendingStores.map(store => store.name).join('、')} 的桌位区域配置` });
      }
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
  const areaConfigStore = STORE_OPTIONS.find(store => store.id === areaConfigStoreId) || null;
  const legacyRequiredProducts: RequiredProductOption[] = requiredRows
    .filter(row => !REQUIRED_PRODUCTS.some(product => product.id === row.productId))
    .map(row => ({ id: row.productId, name: row.name, tags: ['历史商品'], autoAddEligible: row.autoAddEligible, autoAddRestriction: row.autoAddRestriction, type: 'standard', frontendCategory: '未分类', productCode: '--', skuCode: '--', price: 0, status: 'on_shelf' }));
  const selectableRequiredProducts = [...REQUIRED_PRODUCTS, ...legacyRequiredProducts];
  const visibleRequiredProducts = orderMode === 'auto'
    ? selectableRequiredProducts.filter(product => product.autoAddEligible)
    : selectableRequiredProducts;

  const confirmProductSelection = () => {
    const productsById = new Map(selectableRequiredProducts.map(product => [product.id, product]));
    setRequiredRows(current => productDraftIds.flatMap(productId => {
      const existing = current.find(row => row.productId === productId);
      if (existing) return [existing];
      const product = productsById.get(productId);
      return product ? [createRequiredItemRow(product.name, `item-${product.id}`)] : [];
    }));
    setProductSelectorOpen(false);
    setOrderModeNotice(null);
    setFeedback(null);
  };

  const toggleStore = (storeId: string) => {
    const removing = selectedStoreIds.has(storeId);
    setSelectedStoreIds(current => {
      const next = new Set(current);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
    if (removing) {
      setStoreAreaSelections(current => {
        const next = { ...current };
        delete next[storeId];
        return next;
      });
    }
  };

  const clearSelectedStores = () => {
    setSelectedStoreIds(new Set());
    setStoreAreaSelections({});
  };

  const openAreaConfig = (storeId: string) => {
    setAreaConfigStoreId(storeId);
    setAreaDraft(new Set(storeAreaSelections[storeId] || []));
  };

  const toggleAreaDraft = (area: string) => {
    setAreaDraft(current => {
      const next = new Set(current);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const saveAreaConfig = () => {
    if (!areaConfigStoreId || !areaDraft.size) return;
    setStoreAreaSelections(current => ({ ...current, [areaConfigStoreId]: Array.from(areaDraft) }));
    setAreaConfigStoreId(null);
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
                <div className="max-w-[820px]">
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceCard selected={orderMode === 'check'} title="下单前检查" description="默认方式。不自动加购，未满足时提示顾客选择必选商品。" onClick={() => changeOrderMode('check')} />
                    <ChoiceCard selected={orderMode === 'auto'} title="自动加入购物车" description="系统按配置数量加入全部必选商品。" onClick={() => changeOrderMode('auto')} />
                  </div>
                  {orderMode === 'auto' && !orderModeNotice && <div className="mt-2 flex items-start rounded-md bg-[#FFF8E8] px-3 py-2 text-xs leading-5 text-[#8A5A00]"><AlertCircle size={14} className="mr-2 mt-0.5 shrink-0" />仅支持单规格且未配置做法、加料的商品；选择商品时仅展示符合条件的商品。</div>}
                  {orderModeNotice && <div className="mt-2 flex items-start rounded-md bg-[#FFF1F0] px-3 py-2 text-xs leading-5 text-[#B42318]"><AlertCircle size={14} className="mr-2 mt-0.5 shrink-0" />{orderModeNotice}</div>}
                </div>
              </EditorRow>

              <EditorRow label="选择规则" required alignTop>
                <div className="grid max-w-[820px] grid-cols-2 gap-3">
                  <ChoiceCard selected={selectionRule === 'all'} title="全部商品必选" description="方案内每个商品都要满足各自的必选数量。" onClick={() => setSelectionRule('all')} />
                  <ChoiceCard selected={selectionRule === 'anyOne'} title="任选一种" description={orderMode === 'auto' ? '自动加入购物车会加入全部商品，不支持任选一种。' : '方案内任意一种商品满足配置数量即可。'} disabled={orderMode === 'auto'} onClick={() => setSelectionRule('anyOne')} />
                </div>
              </EditorRow>

              <EditorRow label="必选设置" required alignTop>
                <div className="space-y-3">
                  <button onClick={openProductSelector} className="inline-flex h-9 items-center rounded-md border border-[#00B460] bg-white px-4 text-sm font-bold text-[#008F4C] hover:bg-[#F1FBF5]"><Plus size={14} className="mr-1.5" />选择商品</button>
                  <div className="overflow-x-auto rounded-md border border-[#E5E9EF]">
                    <table className="min-w-[960px] w-full border-collapse text-left">
                      <thead className="bg-[#F7F8FA] text-xs font-semibold text-[#475467]"><tr><th className="w-[220px] px-4 py-3">必选商品</th><th className="px-4 py-3">订单类型与必选数量</th><th className="w-[88px] px-4 py-3 text-right">操作</th></tr></thead>
                      <tbody className="text-sm text-[#344054]">
                        {requiredRows.map(row => (
                          <tr key={row.id} className="border-t border-[#EEF1F4] align-top">
                            <td className="px-4 py-4 font-medium">{row.name}</td>
                            <td className="px-4 py-3">
                              <div className="overflow-hidden rounded-md border border-[#E8ECF1]">
                                <OrderQuantitySetting label="堂食" active={row.dineInEnabled} supportsDiners mode={row.dineInQuantityMode} count={row.dineInCount} onToggle={() => updateRow(row.id, current => ({ ...current, dineInEnabled: !current.dineInEnabled }))} onModeChange={next => updateRow(row.id, current => ({ ...current, dineInQuantityMode: next }))} onDecrease={() => updateRow(row.id, current => ({ ...current, dineInCount: Math.max(1, current.dineInCount - 1) }))} onIncrease={() => updateRow(row.id, current => ({ ...current, dineInCount: current.dineInCount + 1 }))} />
                                <OrderQuantitySetting label="外卖" active={row.takeawayEnabled} mode={row.takeawayQuantityMode} count={row.takeawayCount} onToggle={() => updateRow(row.id, current => ({ ...current, takeawayEnabled: !current.takeawayEnabled }))} onModeChange={next => updateRow(row.id, current => ({ ...current, takeawayQuantityMode: next }))} onDecrease={() => updateRow(row.id, current => ({ ...current, takeawayCount: Math.max(1, current.takeawayCount - 1) }))} onIncrease={() => updateRow(row.id, current => ({ ...current, takeawayCount: current.takeawayCount + 1 }))} />
                                <OrderQuantitySetting label="外带" active={row.takeoutEnabled} supportsDiners mode={row.takeoutQuantityMode} count={row.takeoutCount} onToggle={() => updateRow(row.id, current => ({ ...current, takeoutEnabled: !current.takeoutEnabled }))} onModeChange={next => updateRow(row.id, current => ({ ...current, takeoutQuantityMode: next }))} onDecrease={() => updateRow(row.id, current => ({ ...current, takeoutCount: Math.max(1, current.takeoutCount - 1) }))} onIncrease={() => updateRow(row.id, current => ({ ...current, takeoutCount: current.takeoutCount + 1 }))} />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right"><button onClick={() => setRemoveRowId(row.id)} className="font-medium text-[#D92D20] hover:text-[#B42318]">删除</button></td>
                          </tr>
                        ))}
                        {!requiredRows.length && <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-[#98A2B3]">暂未选择必选商品</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs leading-5 text-[#667085]">堂食与外带可选择固定数量或与用餐人数相同；外卖仅支持固定数量。{selectionRule === 'anyOne' && ' 下单时任一候选商品达到对应数量即视为本方案满足。'}</p>
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
            <div className="space-y-5">
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

              <EditorRow label="桌位区域限定" alignTop>
                <div className="max-w-[900px]">
                  <div className="flex min-h-9 items-center"><CheckOption checked={tableAreaEnabled} onClick={() => setTableAreaEnabled(value => !value)} label="按门店限定桌位区域" /></div>
                  <p className="mt-1 text-xs leading-5 text-[#667085]">默认不限定。开启后需为每家适用门店分别选择区域，仅对堂食订单生效。</p>
                  {tableAreaEnabled && <div className="mt-3 overflow-hidden rounded-md border border-[#E5E9EF]">
                    <div className="flex items-center justify-between border-b border-[#E5E9EF] bg-[#FAFBFC] px-4 py-2.5 text-xs text-[#667085]"><span>逐店配置区域，各门店区域数据相互独立</span><span>已配置 {selectedStores.filter(store => storeAreaSelections[store.id]?.length).length}/{selectedStores.length} 家</span></div>
                    {selectedStores.length ? <table className="w-full table-fixed border-collapse text-left text-sm">
                      <thead className="bg-[#F7F8FA] text-xs font-medium text-[#667085]"><tr><th className="w-[240px] px-4 py-2.5">门店</th><th className="px-4 py-2.5">已选桌位区域</th><th className="w-[96px] px-4 py-2.5">状态</th><th className="w-[88px] px-4 py-2.5 text-right">操作</th></tr></thead>
                      <tbody>{selectedStores.map(store => {
                        const selectedAreas = storeAreaSelections[store.id] || [];
                        const hasAreas = store.tableAreas.length > 0;
                        return <tr key={store.id} className="border-t border-[#EEF1F4]">
                          <td className="px-4 py-3"><span className="block font-medium text-[#344054]">{store.name}</span><span className="mt-0.5 block text-xs text-[#98A2B3]">{store.code}</span></td>
                          <td className="px-4 py-3 text-[#667085]">{selectedAreas.length ? <span>{selectedAreas.slice(0, 3).join('、')}{selectedAreas.length > 3 ? ` 等 ${selectedAreas.length} 个` : ''}</span> : hasAreas ? <span className="text-[#98A2B3]">请选择该门店区域</span> : <span className="text-[#B54708]">该门店未维护桌位区域</span>}</td>
                          <td className="px-4 py-3">{selectedAreas.length ? <span className="text-[#008F4C]">已配置</span> : <span className="text-[#B54708]">待配置</span>}</td>
                          <td className="px-4 py-3 text-right"><button type="button" onClick={() => openAreaConfig(store.id)} className="font-medium text-[#008F4C] hover:text-[#007A41]">{selectedAreas.length ? '修改' : '配置'}</button></td>
                        </tr>;
                      })}</tbody>
                    </table> : <div className="px-4 py-8 text-center text-sm text-[#98A2B3]">请先选择适用门店，再逐店配置桌位区域</div>}
                  </div>}
                </div>
              </EditorRow>
            </div>
          </section>

          <section className="rounded-lg border border-[#E5E9EF] bg-white p-5">
            <h3 className="mb-5 text-base font-semibold text-[#1D2939]">高级设置</h3>
            <div className="divide-y divide-[#EEF1F4]">
              <SwitchSetting title="限定桌位类型" description="默认不限定。开启后仅指定桌位类型的堂食订单执行本方案。" checked={tableTypeEnabled} onChange={() => { setTableTypeEnabled(value => !value); setFeedback(null); }}>
                {tableTypeEnabled && <select value={tableType} onChange={event => setTableType(event.target.value)} className="h-9 w-[280px] rounded-md border border-[#DDE2E8] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#00B460]">
                  <option value="">请选择桌位类型</option><option>散台</option><option>包间</option><option>大厅卡座</option><option>露台</option>
                </select>}
              </SwitchSetting>
              <SwitchSetting title="增加人数再次触发必选" description="开启后，堂食订单增加用餐人数时，再次检查并补充对应必选商品。" checked={retriggersWithDiners} onChange={() => setRetriggersWithDiners(value => !value)} />
              <SwitchSetting title="允许修改必选商品数量" description="开启后，门店点餐时可修改自动加入购物车的必选商品数量；仍需满足方案最低数量。" checked={allowQuantityEdit} onChange={() => setAllowQuantityEdit(value => !value)} />
            </div>
          </section>

          {feedback && <div className={`flex items-start rounded-md border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-[#CDEEDC] bg-[#F1FBF5] text-[#26734D]' : 'border-[#FECACA] bg-[#FFF7F6] text-[#B42318]'}`}>{feedback.kind === 'success' ? <CheckCircle2 size={16} className="mr-2 mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />}{feedback.text}</div>}
        </div>
      </div>

      <WebProductSelectorDialog
        open={productSelectorOpen}
        title="选择必选商品"
        description={orderMode === 'auto' ? '当前仅展示单规格且未配置做法、加料的商品。' : '支持按商品名称、商品 ID、规格码、商品标识、分类和商品类型筛选。'}
        products={visibleRequiredProducts}
        selectedIds={productDraftIds}
        onSelectedIdsChange={setProductDraftIds}
        onCancel={() => setProductSelectorOpen(false)}
        onConfirm={confirmProductSelection}
        confirmLabel="确认选择"
      />
      {storeSelectorOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="选择适用门店"><div className="flex h-[620px] w-[900px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5"><div><h3 className="font-semibold">选择适用门店</h3><p className="mt-0.5 text-xs text-[#667085]">可按门店名称、编码或组织筛选</p></div><button onClick={() => setStoreSelectorOpen(false)} aria-label="关闭选择门店"><X size={20} className="text-[#667085]" /></button></div>
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_300px]">
          <div className="min-h-0 border-r border-[#E5E7EB]"><div className="border-b border-[#EEF0F3] p-4"><label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /><input value={storeKeyword} onChange={event => setStoreKeyword(event.target.value)} placeholder="搜索门店名称、编码或组织" className="h-9 w-full rounded-md border border-[#DDE2E8] pl-9 pr-3 text-sm outline-none focus:border-[#00B460]" /></label></div><div className="h-[484px] overflow-y-auto p-2">{visibleStores.map(store => <label key={store.id} className="flex cursor-pointer items-center rounded-md px-3 py-3 hover:bg-[#F7F8FA]"><input type="checkbox" checked={selectedStoreIds.has(store.id)} onChange={() => toggleStore(store.id)} className="h-4 w-4 accent-[#00B460]" /><span className="ml-3"><span className="block text-sm text-[#344054]">{store.name}</span><span className="mt-0.5 block text-xs text-[#98A2B3]">{store.organization} · {store.code}</span></span></label>)}</div></div>
          <div className="min-h-0 bg-[#FAFBFC] p-4"><div className="flex items-center justify-between text-sm"><span className="font-medium text-[#344054]">已选 {selectedStores.length} 家</span><button onClick={clearSelectedStores} className="text-[#008F4C]">清空</button></div><div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto">{selectedStores.map(store => <div key={store.id} className="flex items-center justify-between rounded-md border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm"><span className="truncate">{store.name}</span><button onClick={() => toggleStore(store.id)} aria-label={`移除${store.name}`}><X size={14} className="text-[#98A2B3]" /></button></div>)}{!selectedStores.length && <div className="py-12 text-center text-sm text-[#98A2B3]">暂未选择门店</div>}</div></div>
        </div>
        <div className="flex h-14 shrink-0 items-center justify-between border-t border-[#E5E7EB] px-5"><span className="text-xs text-[#667085]">按具体门店 ID 保存适用范围</span><div className="flex gap-2"><button onClick={() => setStoreSelectorOpen(false)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-sm">取消</button><button disabled={!selectedStores.length} onClick={() => setStoreSelectorOpen(false)} className="h-9 rounded-md bg-[#00B460] px-4 text-sm font-medium text-white disabled:bg-[#B8C0CC]">确认选择</button></div></div>
      </div></div>}
      {areaConfigStore && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label={`配置${areaConfigStore.name}桌位区域`}><div className="flex w-[560px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex min-h-14 items-center justify-between border-b border-[#E5E7EB] px-5 py-3"><div><h3 className="font-semibold text-[#1D2939]">配置桌位区域</h3><p className="mt-0.5 text-xs text-[#667085]">{areaConfigStore.name} · {areaConfigStore.code}</p></div><button type="button" onClick={() => setAreaConfigStoreId(null)} aria-label="关闭桌位区域配置"><X size={20} className="text-[#667085]" /></button></div>
        <div className="p-5">
          <div className="mb-4 rounded-md bg-[#F7F8FA] px-3 py-2.5 text-xs leading-5 text-[#667085]">这里仅展示当前门店已维护的桌位区域。选中的区域才执行本必选方案，未选区域不受影响。</div>
          {areaConfigStore.tableAreas.length ? <div className="max-h-[320px] space-y-1 overflow-y-auto rounded-md border border-[#E5E9EF] p-2">{areaConfigStore.tableAreas.map(area => <label key={area} className="flex cursor-pointer items-center rounded-md px-3 py-3 hover:bg-[#F7F8FA]"><input type="checkbox" checked={areaDraft.has(area)} onChange={() => toggleAreaDraft(area)} className="h-4 w-4 accent-[#00B460]" /><span className="ml-3 text-sm text-[#344054]">{area}</span></label>)}</div> : <div className="rounded-md border border-dashed border-[#DDE2E8] px-4 py-10 text-center"><p className="text-sm font-medium text-[#475467]">该门店未维护桌位区域</p><p className="mt-1 text-xs leading-5 text-[#98A2B3]">请先在门店桌位设置中维护区域，再返回配置。</p><button type="button" className="mt-3 text-sm font-medium text-[#008F4C]">前往门店桌位设置</button></div>}
        </div>
        <div className="flex h-14 items-center justify-between border-t border-[#E5E7EB] px-5"><span className="text-xs text-[#667085]">已选 {areaDraft.size} 个区域</span><div className="flex gap-2"><button type="button" onClick={() => setAreaConfigStoreId(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-sm text-[#475467]">取消</button><button type="button" disabled={!areaDraft.size} onClick={saveAreaConfig} className="h-9 rounded-md bg-[#00B460] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-[#B8C0CC]">确认</button></div></div>
      </div></div>}
      {removeRowId && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[420px] rounded-lg bg-white p-5 shadow-2xl"><h3 className="font-semibold">移除必选商品</h3><p className="mt-2 text-sm leading-6 text-[#667085]">移除后，该商品不再参与本方案的堂食、外卖或外带必选数量校验；保存方案后生效。</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setRemoveRowId(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-sm">取消</button><button onClick={() => { setRequiredRows(current => current.filter(item => item.id !== removeRowId)); setRemoveRowId(null); }} className="h-9 rounded-md bg-[#D92D20] px-4 text-sm font-medium text-white">确认移除</button></div></div></div>}
    </div>
  );
};

const EditorRow = ({ label, required, children, alignTop = false }: { label: string; required?: boolean; children: React.ReactNode; alignTop?: boolean }) => (
  <div className={`grid grid-cols-[136px_minmax(0,1fr)] ${alignTop ? 'items-start' : 'items-center'}`}><div className={`pr-6 text-right text-sm leading-5 text-[#667085] ${alignTop ? 'pt-2' : ''}`}>{required && <span className="mr-1 text-[#F04438]">*</span>}{label}:</div><div className="min-w-0">{children}</div></div>
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

const OrderQuantitySetting = ({ label, active, supportsDiners = false, mode, count, onToggle, onModeChange, onDecrease, onIncrease }: { label: string; active: boolean; supportsDiners?: boolean; mode: QuantityMode; count: number; onToggle: () => void; onModeChange: (mode: QuantityMode) => void; onDecrease: () => void; onIncrease: () => void }) => (
  <div className="grid min-h-12 grid-cols-[96px_minmax(0,1fr)] items-center border-t border-[#EEF1F4] px-3 first:border-t-0">
    <CheckOption checked={active} onClick={onToggle} label={label} />
    <div className={`flex min-w-0 items-center gap-5 py-2 transition-opacity ${active ? '' : 'pointer-events-none opacity-40'}`}>
      <RadioOption checked={!supportsDiners || mode === 'fixed'} onClick={() => onModeChange('fixed')} label="固定数量" />
      <div className={`inline-flex h-8 items-center overflow-hidden rounded-md border border-[#DDE2E8] bg-white ${supportsDiners && mode !== 'fixed' ? 'invisible' : ''}`}>
        <button type="button" onClick={onDecrease} disabled={!active} aria-label={`${label}必选数量减一`} className="h-8 w-8 border-r border-[#E5E9EF] text-[#667085] hover:bg-[#F7F8FA] disabled:cursor-not-allowed">−</button>
        <div className="w-10 text-center text-sm tabular-nums">{count}</div>
        <button type="button" onClick={onIncrease} disabled={!active} aria-label={`${label}必选数量加一`} className="h-8 w-8 border-l border-[#E5E9EF] text-[#667085] hover:bg-[#F7F8FA] disabled:cursor-not-allowed">＋</button>
      </div>
      {supportsDiners ? <RadioOption checked={mode === 'diners'} onClick={() => onModeChange('diners')} label="与用餐人数相同" /> : <span className="text-xs text-[#98A2B3]">不支持按用餐人数</span>}
    </div>
  </div>
);

const SwitchSetting = ({ title, description, checked, onChange, children }: { title: string; description: string; checked: boolean; onChange: () => void; children?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0"><div><div className="text-sm font-medium text-[#344054]">{title}</div><div className="mt-1 text-xs leading-5 text-[#667085]">{description}</div>{children && <div className="mt-3">{children}</div>}</div><button type="button" onClick={onChange} className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#00B460]' : 'bg-[#C7CDD4]'}`} aria-label={`${checked ? '关闭' : '开启'}${title}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} /></button></div>
);
