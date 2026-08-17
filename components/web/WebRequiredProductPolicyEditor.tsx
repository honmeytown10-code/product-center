import React, { useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, Plus, Search, ChevronRight, CheckSquare, Square, CircleDot, Upload, X } from 'lucide-react';
import type { RequiredPolicyRecord } from './WebRequiredProductPolicyList';

type StoreNode = {
  id: string;
  name: string;
  code: string;
};

type RequiredItemRow = {
  id: string;
  name: string;
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  dineInCount: number;
  takeawayCount: number;
};

const STORE_GROUPS = [
  { id: 'brand-1', name: '餐饮2.0品牌+', code: '11185', count: 1 },
];

const STORE_NODES: StoreNode[] = [
  { id: 'store-1', name: '范先生的门店', code: '103210' },
  { id: 'store-2', name: '品牌直营', code: '103195' },
  { id: 'store-3', name: 'orgtest一级', code: '101608' },
  { id: 'store-4', name: '一级071', code: '101593' },
  { id: 'store-5', name: '一级06', code: '101587' },
];

const REQUIRED_PRODUCTS = ['方案商品111', '招牌珍珠奶茶', '手打柠檬茶', '杨枝甘露', '精品拿铁', '超值双人套餐'];

export const WebRequiredProductPolicyEditor: React.FC<{
  mode: 'create' | 'edit';
  policy?: RequiredPolicyRecord | null;
  onBack: () => void;
}> = ({ mode, policy, onBack }) => {
  const [policyName, setPolicyName] = useState(policy?.name || '');
  const [storeKeyword, setStoreKeyword] = useState('');
  const [storeType, setStoreType] = useState('all');
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [removeRowId, setRemoveRowId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set(
    (policy?.stores || ['范先生的门店']).map((storeName, index) => {
      const matched = STORE_NODES.find(item => item.name === storeName);
      return matched?.id || `preset-${index}`;
    })
  ));
  const [requiredRows, setRequiredRows] = useState<RequiredItemRow[]>([
    { id: 'item-1', name: policy?.targetName || '方案商品111', dineInEnabled: true, takeawayEnabled: true, dineInCount: 2, takeawayCount: 2 },
  ]);

  const visibleStores = useMemo(() => {
    const normalizedKeyword = storeKeyword.trim().toLowerCase();
    const typedStores = storeType === 'all' ? STORE_NODES : STORE_NODES.filter((_, index) => storeType === '直营店' ? index % 2 === 0 : index % 2 === 1);
    if (!normalizedKeyword) return typedStores;
    return typedStores.filter(item =>
      [item.name, item.code].join(' ').toLowerCase().includes(normalizedKeyword)
    );
  }, [storeKeyword, storeType]);

  const selectedStores = STORE_NODES.filter(item => selectedStoreIds.has(item.id));

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds(prev => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const updateRow = (rowId: string, updater: (row: RequiredItemRow) => RequiredItemRow) => {
    setRequiredRows(prev => prev.map(row => (row.id === rowId ? updater(row) : row)));
  };

  const addRequiredItem = (name: string) => {
    if (requiredRows.some(item => item.name === name)) return setMessage(`“${name}”已在必选设置中`);
    setRequiredRows(prev => [
      ...prev,
      {
        id: `item-${prev.length + 1}`,
        name,
        dineInEnabled: true,
        takeawayEnabled: false,
        dineInCount: 1,
        takeawayCount: 1,
      },
    ]);
    setProductSelectorOpen(false);
    setMessage('');
  };

  const savePolicy = () => {
    if (!policyName.trim()) return setMessage('请输入方案名称');
    if (!requiredRows.length) return setMessage('请至少选择一个必选商品');
    if (requiredRows.some(row => !row.dineInEnabled && !row.takeawayEnabled)) return setMessage('每个必选商品至少选择堂食或外卖一种必选类型');
    if (!selectedStores.length) return setMessage('请至少选择一家适用门店');
    setMessage(mode === 'create' ? '必选商品方案已创建' : '必选商品方案已保存');
    window.setTimeout(onBack, 900);
  };

  return (
    <div className="pc-page flex flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="h-[60px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 text-[#666] hover:text-[#333]"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-bold text-[#333]">{mode === 'create' ? '新增必选商品' : `编辑${policy?.name || '必选商品'}`}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-5 py-2 rounded-lg border border-[#E8E8E8] text-sm text-[#666] hover:bg-gray-50">取消</button>
          <button onClick={savePolicy} className="px-5 py-2 rounded-lg bg-[#00C06B] text-sm font-bold text-white hover:bg-[#00A35B]">保存</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-[#E8E8E8] p-6">
            <h3 className="text-base font-bold text-[#333] mb-6">基础设置</h3>
            <div className="space-y-6">
              <EditorRow label="方案名称" required>
                <input
                  value={policyName}
                  onChange={e => setPolicyName(e.target.value)}
                  className="h-[38px] w-[360px] rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]"
                />
              </EditorRow>

              <EditorRow label="必选类型" required>
                <div className="flex items-center gap-8 text-sm">
                  <label className="flex items-center gap-2 text-[#00C06B] font-bold">
                    <CircleDot size={16} className="text-[#00C06B]" />
                    商品必选
                  </label>
                </div>
              </EditorRow>

              <EditorRow label="必选设置" required alignTop>
                <div className="space-y-4">
                  <button onClick={() => setProductSelectorOpen(true)} className="inline-flex items-center rounded-lg border border-[#00B460] bg-white px-4 py-2.5 text-sm font-bold text-[#008F4C] hover:bg-[#F3FCF7]">
                    <Plus size={14} className="mr-1.5" />
                    选择商品
                  </button>

                  <div className="overflow-x-auto rounded-lg border border-[#E8E8E8]">
                    <table className="min-w-[920px] w-full border-collapse text-left">
                      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
                        <tr>
                          <th className="px-4 py-4">必选商品</th>
                          <th className="px-4 py-4">必选类型</th>
                          <th className="px-4 py-4">必选数量</th>
                          <th className="px-4 py-4 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-[#333]">
                        {requiredRows.map(row => (
                          <tr key={row.id} className="border-t border-[#F3F4F6]">
                            <td className="px-4 py-4">{row.name}</td>
                            <td className="px-4 py-4">
                              <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[#00C06B]">
                                  <button onClick={() => updateRow(row.id, current => ({ ...current, dineInEnabled: !current.dineInEnabled }))}>
                                    {row.dineInEnabled ? <CheckSquare size={16} className="text-[#00C06B]" /> : <Square size={16} className="text-[#C7CDD4]" />}
                                  </button>
                                  堂食
                                </label>
                                <label className="flex items-center gap-2 text-[#00C06B]">
                                  <button onClick={() => updateRow(row.id, current => ({ ...current, takeawayEnabled: !current.takeawayEnabled }))}>
                                    {row.takeawayEnabled ? <CheckSquare size={16} className="text-[#00C06B]" /> : <Square size={16} className="text-[#C7CDD4]" />}
                                  </button>
                                  外卖
                                </label>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="space-y-3">
                                <QuantitySetting
                                  active={row.dineInEnabled}
                                  count={row.dineInCount}
                                  onDecrease={() => updateRow(row.id, current => ({ ...current, dineInCount: Math.max(1, current.dineInCount - 1) }))}
                                  onIncrease={() => updateRow(row.id, current => ({ ...current, dineInCount: current.dineInCount + 1 }))}
                                />
                                <QuantitySetting
                                  active={row.takeawayEnabled}
                                  count={row.takeawayCount}
                                  onDecrease={() => updateRow(row.id, current => ({ ...current, takeawayCount: Math.max(1, current.takeawayCount - 1) }))}
                                  onIncrease={() => updateRow(row.id, current => ({ ...current, takeawayCount: current.takeawayCount + 1 }))}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button onClick={() => setRemoveRowId(row.id)} className="font-medium text-[#D92D20] hover:text-[#B42318]">删除</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </EditorRow>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-[#E8E8E8] p-6">
            <h3 className="text-base font-bold text-[#333] mb-6">选择适用门店</h3>

            <div className="flex flex-wrap items-center gap-4 mb-5">
              <input
                value={storeKeyword}
                onChange={e => setStoreKeyword(e.target.value)}
                placeholder="请输入门店名称/编码/ID"
                className="h-[38px] w-[260px] rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]"
              />
              <select value={storeType} onChange={e => setStoreType(e.target.value)} className="h-[38px] w-[180px] rounded-lg border border-[#E8E8E8] px-3 text-sm text-[#666] outline-none focus:border-[#00C06B]">
                <option value="all">门店类型：全部</option>
                <option value="直营店">直营店</option>
                <option value="商场店">商场店</option>
              </select>
              <button onClick={() => { setStoreKeyword(''); setStoreType('all'); }} className="text-sm font-bold text-[#00C06B] hover:text-[#00A35B]">清空搜索条件</button>
              <button onClick={() => setImportOpen(true)} className="ml-auto inline-flex items-center rounded-lg border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm font-bold text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]"><Upload size={14} className="mr-1.5" />导入门店</button>
            </div>

            <div className="grid grid-cols-[240px_1fr_280px] rounded-xl border border-[#E8E8E8] overflow-hidden min-h-[320px]">
              <div className="border-r border-[#E8E8E8] bg-[#FAFAFA] p-4">
                {STORE_GROUPS.map(group => (
                  <div key={group.id} className="rounded-lg border border-[#D9F7E7] bg-[#F3FCF7] p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#333]">{group.name}</div>
                      <div className="text-sm text-[#666]">{group.count} &gt;</div>
                    </div>
                    <div className="mt-2 text-xs text-[#999]">ID：{group.code}</div>
                  </div>
                ))}
              </div>

              <div className="border-r border-[#E8E8E8] bg-white p-4">
                <div className="space-y-3">
                  {visibleStores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => toggleStore(store.id)}
                      className="flex w-full items-start justify-between rounded-lg px-3 py-2 text-left hover:bg-[#FAFAFA]"
                    >
                      <div className="flex items-start gap-3">
                        {selectedStoreIds.has(store.id) ? <CheckSquare size={16} className="mt-0.5 text-[#00C06B]" /> : <Square size={16} className="mt-0.5 text-[#C7CDD4]" />}
                        <div>
                          <div className="text-sm text-[#333]">{store.name}</div>
                          <div className="mt-1 text-xs text-[#999]">ID：{store.code}</div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="mt-0.5 text-[#C7CDD4]" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-[#666]">已选 {selectedStores.length} 个门店</div>
                  <button onClick={() => setSelectedStoreIds(new Set())} className="text-sm font-bold text-[#00C06B] hover:text-[#00A35B]">清空已选</button>
                </div>
                <div className="space-y-3">
                  {selectedStores.map(store => (
                    <div key={store.id} className="rounded-lg bg-[#FAFAFA] px-3 py-2 text-sm text-[#333]">
                      {store.name}
                    </div>
                  ))}
                  {selectedStores.length === 0 && (
                    <div className="pt-10 text-center text-sm text-[#999]">暂无已选门店</div>
                  )}
                </div>
              </div>
            </div>
          </section>
          {message && <div className={`flex items-center rounded-lg border px-4 py-3 text-sm ${message.includes('已') ? 'border-[#D9F2E4] bg-[#F3FCF7] text-[#008F4C]' : 'border-[#FECACA] bg-[#FFF7F6] text-[#D92D20]'}`}><AlertCircle size={16} className="mr-2" />{message}</div>}
        </div>
      </div>
      {productSelectorOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[520px] rounded-lg bg-white shadow-2xl"><div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-5"><div><h3 className="font-semibold">选择必选商品</h3><p className="text-xs text-[#667085]">已添加商品会保留在当前方案中</p></div><button onClick={() => setProductSelectorOpen(false)}><X size={20} className="text-[#667085]" /></button></div><div className="grid grid-cols-2 gap-2 p-5">{REQUIRED_PRODUCTS.map(product => <button key={product} disabled={requiredRows.some(item => item.name === product)} onClick={() => addRequiredItem(product)} className="flex items-center justify-between rounded-md border border-[#DDE2E8] px-3 py-3 text-left text-sm hover:border-[#00B460] disabled:cursor-not-allowed disabled:bg-[#F7F8FA] disabled:text-[#98A2B3]"><span>{product}</span>{requiredRows.some(item => item.name === product) && <span className="text-xs">已添加</span>}</button>)}</div></div></div>}
      {importOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[520px] rounded-lg bg-white shadow-2xl"><div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-5"><h3 className="font-semibold">导入门店</h3><button onClick={() => setImportOpen(false)}><X size={20} className="text-[#667085]" /></button></div><div className="p-5"><div className="rounded-lg border border-dashed border-[#C7CDD4] px-6 py-10 text-center text-sm text-[#667085]"><Upload size={28} className="mx-auto mb-3 text-[#98A2B3]" />上传包含门店编码的 Excel 文件<div className="mt-2 text-xs text-[#98A2B3]">系统将校验不存在、重复和无权限门店</div></div></div><div className="flex justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3"><button onClick={() => setImportOpen(false)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-sm">取消</button><button onClick={() => { setSelectedStoreIds(new Set(STORE_NODES.map(item => item.id))); setImportOpen(false); setMessage('门店文件校验通过，已导入 5 家门店'); }} className="h-9 rounded-md bg-[#00B460] px-4 text-sm font-medium text-white">模拟校验并导入</button></div></div></div>}
      {removeRowId && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[420px] rounded-lg bg-white p-5 shadow-2xl"><h3 className="font-semibold">移除必选商品</h3><p className="mt-2 text-sm leading-6 text-[#667085]">移除后，该商品不再参与本方案的堂食/外卖必选数量校验；保存方案后生效。</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setRemoveRowId(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-sm">取消</button><button onClick={() => { setRequiredRows(current => current.filter(item => item.id !== removeRowId)); setRemoveRowId(null); }} className="h-9 rounded-md bg-[#D92D20] px-4 text-sm font-medium text-white">确认移除</button></div></div></div>}
    </div>
  );
};

const EditorRow = ({
  label,
  required,
  children,
  alignTop = false,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  alignTop?: boolean;
}) => (
  <div className="flex items-start">
    <div className={`w-[120px] shrink-0 text-right pr-6 text-sm text-[#666] ${alignTop ? 'pt-2' : 'pt-2.5'}`}>
      {required && <span className="text-red-500 mr-1">*</span>}
      {label}:
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const QuantitySetting = ({
  active,
  count,
  onDecrease,
  onIncrease,
}: {
  active: boolean;
  count: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="flex items-center text-[#00C06B]">
      <CircleDot size={14} className="mr-1.5" />
      固定数量
    </span>
    <div className={`inline-flex items-center rounded-lg border ${active ? 'border-[#E8E8E8]' : 'border-[#F0F0F0] opacity-40'}`}>
      <button onClick={onDecrease} disabled={!active} className="h-8 w-8 border-r border-[#E8E8E8] text-[#999] hover:bg-[#FAFAFA] disabled:cursor-not-allowed">-</button>
      <div className="w-10 text-center">{count}</div>
      <button onClick={onIncrease} disabled={!active} className="h-8 w-8 border-l border-[#E8E8E8] text-[#999] hover:bg-[#FAFAFA] disabled:cursor-not-allowed">+</button>
    </div>
    <span className="flex items-center text-[#00C06B]">
      <CircleDot size={14} className="mr-1.5" />
      与用餐人数相同
    </span>
  </div>
);
