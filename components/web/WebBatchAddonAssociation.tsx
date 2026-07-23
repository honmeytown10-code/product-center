import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Info,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';

type ModifyMode = 'replace' | 'add' | 'remove' | 'clear' | 'default';
type LimitMode = 'unlimited' | 'range' | 'required';
type LimitScope = 'total' | 'group';

type LimitRule = {
  limitMode: LimitMode;
  minCount: number;
  maxCount: number;
};

type AddonItem = {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  isDefault?: boolean;
};

type AddonGroup = {
  id: string;
  name: string;
  items: AddonItem[];
  limitMode: LimitMode;
  minCount: number;
  maxCount: number;
};

type ProductItem = {
  id: string;
  name: string;
  code: string;
  type: string;
  price: number;
};

const MODIFY_MODES: Array<{ id: ModifyMode; label: string }> = [
  { id: 'replace', label: '覆盖加料' },
  { id: 'add', label: '新增加料' },
  { id: 'remove', label: '移除加料' },
  { id: 'clear', label: '清空加料' },
  { id: 'default', label: '更改加料默认值' },
];

const INITIAL_GROUPS: AddonGroup[] = [
  {
    id: 'group-1',
    name: '必选加料 1',
    limitMode: 'range',
    minCount: 1,
    maxCount: 2,
    items: [
      { id: 'addon-1', name: '0622 葡萄', code: 'ADD-0622-01', price: 1, stock: 9999 },
      { id: 'addon-2', name: '0622 独立香蕉', code: 'ADD-0622-02', price: 0, stock: 9999 },
      { id: 'addon-3', name: '123', code: 'ADD-00123', price: 1, stock: 9999 },
    ],
  },
  {
    id: 'group-2',
    name: 'ZCW',
    limitMode: 'unlimited',
    minCount: 0,
    maxCount: 0,
    items: [
      { id: 'addon-4', name: '测试 ZCW1', code: 'ZCW', price: 0, stock: 9999 },
    ],
  },
];

const PRODUCTS: ProductItem[] = [
  { id: 'product-1', name: '杨枝甘露', code: '1276505558829625344', type: '标准商品', price: 22 },
  { id: 'product-2', name: '葡萄多多', code: '1276505558829625345', type: '标准商品', price: 18 },
  { id: 'product-3', name: '双人欢聚套餐', code: '1276505558829625346', type: '套餐商品', price: 68 },
  { id: 'product-4', name: '冰镇柠檬茶', code: '1276505558829625347', type: '标准商品', price: 12 },
];

const EXTRA_GROUP: AddonGroup = {
  id: 'group-3',
  name: '夏日小料',
  limitMode: 'required',
  minCount: 1,
  maxCount: 1,
  items: [
    { id: 'addon-5', name: '椰果', code: 'SUMMER-01', price: 1, stock: 9999 },
    { id: 'addon-6', name: '脆啵啵', code: 'SUMMER-02', price: 2, stock: 9999 },
  ],
};

const getLimitSummary = (rule: LimitRule) => {
  if (rule.limitMode === 'range') return `起购 ${rule.minCount} 份，限购 ${rule.maxCount} 份`;
  if (rule.limitMode === 'required') return `点餐时必选 ${rule.minCount} 份`;
  return '点餐时数量不限';
};

const getTotalLimitSummary = (rule: LimitRule) => {
  if (rule.limitMode === 'range') return `所有加料合计起购 ${rule.minCount} 份，限购 ${rule.maxCount} 份`;
  if (rule.limitMode === 'required') return `所有加料合计必选 ${rule.minCount} 份`;
  return '所有加料合计数量不限';
};

const isLimitModeSupported = (mode: ModifyMode) => mode === 'replace' || mode === 'add';

export const WebBatchAddonAssociation: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [scope, setScope] = useState<'uniform' | 'single'>('uniform');
  const [modifyMode, setModifyMode] = useState<ModifyMode>('add');
  const [groups, setGroups] = useState<AddonGroup[]>(INITIAL_GROUPS);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(['product-1', 'product-2']);
  const [productKeyword, setProductKeyword] = useState('');
  const [editorGroupId, setEditorGroupId] = useState<string | null>(null);
  const [draftGroups, setDraftGroups] = useState<AddonGroup[]>([]);
  const [limitScope, setLimitScope] = useState<LimitScope>('group');
  const [globalLimit, setGlobalLimit] = useState<LimitRule>({ limitMode: 'unlimited', minCount: 0, maxCount: 0 });
  const [draftLimitScope, setDraftLimitScope] = useState<LimitScope>('group');
  const [draftGlobalLimit, setDraftGlobalLimit] = useState<LimitRule>({ limitMode: 'unlimited', minCount: 0, maxCount: 0 });
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  const selectedProducts = PRODUCTS.filter(product => selectedProductIds.includes(product.id));
  const filteredProducts = PRODUCTS.filter(product => (
    product.name.includes(productKeyword) || product.code.includes(productKeyword)
  ));
  const usesTotalLimit = modifyMode === 'replace' && limitScope === 'total';
  const modeNotice = useMemo(() => {
    if (modifyMode === 'add') return '新增的加料会保留商品原有关联；购买限制仅对本次新增的加料组生效。';
    if (modifyMode === 'replace') return '覆盖后商品将只保留本次选择的加料，请确认加料及购买限制设置。';
    if (modifyMode === 'remove') return '仅移除所选加料，不会影响商品关联的其他加料。';
    if (modifyMode === 'clear') return '将清空所选商品关联的全部加料，此操作不可恢复。';
    return '统一调整所选商品中对应加料的默认选中状态。';
  }, [modifyMode]);

  const openGroupEditor = (group: AddonGroup) => {
    setEditorGroupId(group.id);
    setDraftGroups(groups.map(item => ({ ...item, items: [...item.items] })));
    setDraftLimitScope(modifyMode === 'replace' ? limitScope : 'group');
    setDraftGlobalLimit({ ...globalLimit });
  };

  const saveLimitSettings = () => {
    setGroups(draftGroups);
    if (modifyMode === 'replace') {
      setLimitScope(draftLimitScope);
      setGlobalLimit(draftGlobalLimit);
    }
    setEditorGroupId(null);
  };

  const updateDraftGroup = (groupId: string, patch: Partial<AddonGroup>) => {
    setDraftGroups(current => current.map(group => group.id === groupId ? { ...group, ...patch } : group));
  };

  const removeAddon = (groupId: string, addonId: string) => {
    setDraftGroups(current => current.map(group => (
      group.id === groupId
        ? { ...group, items: group.items.filter(item => item.id !== addonId) }
        : group
    )));
  };

  const renderGroupCard = (group: AddonGroup) => (
    <div key={group.id} className="border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-gray-800">{group.name}</div>
          {isLimitModeSupported(modifyMode) && !usesTotalLimit && (
            <div className={`mt-1 flex items-center gap-1.5 text-xs ${group.limitMode === 'unlimited' ? 'text-gray-400' : 'text-[#008C4A]'}`}>
              <SlidersHorizontal size={13} />
              <span className="truncate">购买限制：{getLimitSummary(group)}</span>
              <button type="button" onClick={() => openGroupEditor(group)} className="shrink-0 text-[#00A85A] hover:underline">设置</button>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            title="编辑加料"
            onClick={() => openGroupEditor(group)}
            className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#00A85A]"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            title="移除加料组"
            onClick={() => setGroups(current => current.filter(item => item.id !== group.id))}
            className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-red-500"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-4 py-3">
        {group.items.map(item => (
          <span key={item.id} className="bg-[#F5F6F8] px-2.5 py-1.5 text-xs text-gray-600">{item.name}</span>
        ))}
        {group.items.length === 0 && <span className="text-xs text-gray-400">暂未选择加料</span>}
      </div>
    </div>
  );

  const setDraftCount = (groupId: string, field: 'minCount' | 'maxCount', value: number) => {
    setDraftGroups(current => current.map(group => {
      if (group.id !== groupId) return group;
      const nextValue = Math.max(0, Math.min(99, value));
      if (field === 'minCount') return { ...group, minCount: nextValue, maxCount: Math.max(nextValue, group.maxCount) };
      return { ...group, maxCount: Math.max(group.minCount, nextValue) };
    }));
  };

  const setRequiredCount = (groupId: string, value: number) => {
    const nextValue = Math.max(1, Math.min(99, value));
    updateDraftGroup(groupId, { minCount: nextValue, maxCount: nextValue });
  };

  const setDraftGlobalMode = (limitMode: LimitMode) => {
    const requiredCount = Math.max(1, draftGlobalLimit.minCount || 1);
    setDraftGlobalLimit(current => ({
      limitMode,
      minCount: limitMode === 'required' ? requiredCount : limitMode === 'unlimited' ? 0 : current.minCount,
      maxCount: limitMode === 'required' ? requiredCount : limitMode === 'unlimited' ? 0 : Math.max(current.minCount, current.maxCount || 1),
    }));
  };

  const setDraftGlobalCount = (field: 'minCount' | 'maxCount', value: number) => {
    const nextValue = Math.max(0, Math.min(99, value));
    setDraftGlobalLimit(current => {
      if (current.limitMode === 'required') {
        const requiredCount = Math.max(1, nextValue);
        return { ...current, minCount: requiredCount, maxCount: requiredCount };
      }
      if (field === 'minCount') return { ...current, minCount: nextValue, maxCount: Math.max(nextValue, current.maxCount) };
      return { ...current, maxCount: Math.max(current.minCount, nextValue) };
    });
  };

  const renderEditor = () => {
    if (!editorGroupId) return null;
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-6">
        <div className="flex h-[calc(100vh-48px)] max-h-[760px] w-[1080px] max-w-[calc(100vw-48px)] flex-col bg-white shadow-2xl">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-6">
            <h3 className="font-bold text-gray-800">修改加料</h3>
            <button type="button" title="关闭" onClick={() => setEditorGroupId(null)}><X size={20} className="text-gray-400" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <button
              type="button"
              disabled={draftGroups.some(group => group.id === EXTRA_GROUP.id)}
              onClick={() => setDraftGroups(current => [...current, EXTRA_GROUP])}
              className="mb-5 inline-flex h-10 items-center gap-1 border border-gray-200 px-4 text-sm text-gray-600 hover:border-[#00C06B] hover:text-[#00A85A] disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <Plus size={16} />添加加料
            </button>

            <div className="mb-5 bg-[#F7F8FA] px-5 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-gray-600">加料配置：</span>
                <select
                  aria-label="加料配置方式"
                  value={draftLimitScope}
                  disabled={modifyMode !== 'replace'}
                  onChange={event => setDraftLimitScope(event.target.value as LimitScope)}
                  className="h-10 min-w-[230px] border border-gray-200 bg-white px-3 text-gray-600 outline-none focus:border-[#00C06B] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="total">按加料限制购买总量</option>
                  <option value="group">按加料类型限制购买数</option>
                </select>

                {draftLimitScope === 'total' && ([
                  { id: 'unlimited' as LimitMode, label: '点餐时数量不限' },
                  { id: 'range' as LimitMode, label: '点餐时起购限购数' },
                  { id: 'required' as LimitMode, label: '点餐时必选' },
                ]).map(option => (
                  <label key={option.id} className={`flex cursor-pointer items-center gap-2 ${draftGlobalLimit.limitMode === option.id ? 'font-medium text-[#00A85A]' : 'text-gray-500'}`}>
                    <input type="radio" name="global-limit-mode" checked={draftGlobalLimit.limitMode === option.id} onChange={() => setDraftGlobalMode(option.id)} className="h-4 w-4 accent-[#00C06B]" />
                    {option.label}
                  </label>
                ))}
              </div>

              {draftLimitScope === 'total' && draftGlobalLimit.limitMode === 'range' && (
                <div className="mt-3 flex flex-wrap items-center gap-2 pl-[88px] text-sm text-gray-500">
                  <span>所有加料合计起购</span>
                  <div className="flex items-center">
                    <button type="button" title="减少总量起购数" onClick={() => setDraftGlobalCount('minCount', draftGlobalLimit.minCount - 1)} className="flex h-9 w-8 items-center justify-center border border-gray-200 bg-white"><Minus size={14} /></button>
                    <input aria-label="所有加料起购数" type="number" min={0} max={99} value={draftGlobalLimit.minCount} onChange={event => setDraftGlobalCount('minCount', Number(event.target.value) || 0)} className="h-9 w-14 border-y border-gray-200 text-center outline-none" />
                    <button type="button" title="增加总量起购数" onClick={() => setDraftGlobalCount('minCount', draftGlobalLimit.minCount + 1)} className="flex h-9 w-8 items-center justify-center border border-gray-200 bg-white"><Plus size={14} /></button>
                  </div>
                  <span>～ 限购</span>
                  <div className="flex items-center">
                    <button type="button" title="减少总量限购数" onClick={() => setDraftGlobalCount('maxCount', draftGlobalLimit.maxCount - 1)} className="flex h-9 w-8 items-center justify-center border border-gray-200 bg-white"><Minus size={14} /></button>
                    <input aria-label="所有加料限购数" type="number" min={0} max={99} value={draftGlobalLimit.maxCount} onChange={event => setDraftGlobalCount('maxCount', Number(event.target.value) || 0)} className="h-9 w-14 border-y border-gray-200 text-center outline-none" />
                    <button type="button" title="增加总量限购数" onClick={() => setDraftGlobalCount('maxCount', draftGlobalLimit.maxCount + 1)} className="flex h-9 w-8 items-center justify-center border border-gray-200 bg-white"><Plus size={14} /></button>
                  </div>
                  <span>份</span>
                </div>
              )}

              {draftLimitScope === 'total' && draftGlobalLimit.limitMode === 'required' && (
                <div className="mt-3 flex items-center gap-2 pl-[88px] text-sm text-gray-500">
                  <span>所有加料合计必选</span>
                  <div className="flex items-center">
                    <button type="button" title="减少总量必选数" onClick={() => setDraftGlobalCount('minCount', draftGlobalLimit.minCount - 1)} className="flex h-9 w-8 items-center justify-center border border-gray-200 bg-white"><Minus size={14} /></button>
                    <input aria-label="所有加料必选数" type="number" min={1} max={99} value={draftGlobalLimit.minCount} onChange={event => setDraftGlobalCount('minCount', Number(event.target.value) || 1)} className="h-9 w-14 border-y border-gray-200 text-center outline-none" />
                    <button type="button" title="增加总量必选数" onClick={() => setDraftGlobalCount('minCount', draftGlobalLimit.minCount + 1)} className="flex h-9 w-8 items-center justify-center border border-gray-200 bg-white"><Plus size={14} /></button>
                  </div>
                  <span>份</span>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {draftGroups.map(group => (
                <section key={group.id} className={`border ${group.id === editorGroupId ? 'border-[#83D8AF]' : 'border-gray-200'}`}>
                  <div className="flex flex-wrap items-center gap-3 bg-[#FAFBFC] px-4 py-3">
                    <span className="text-sm text-gray-600">加料商品类型：</span>
                    <b className="mr-2 text-sm text-gray-800">{group.name}</b>
                    {draftLimitScope === 'group' && (
                      <>
                        <select
                          aria-label={`${group.name}购买限制`}
                          value={group.limitMode}
                          onChange={event => {
                            const limitMode = event.target.value as LimitMode;
                            const requiredCount = Math.max(1, group.minCount || 1);
                            updateDraftGroup(group.id, {
                              limitMode,
                              minCount: limitMode === 'required' ? requiredCount : limitMode === 'unlimited' ? 0 : group.minCount,
                              maxCount: limitMode === 'required' ? requiredCount : limitMode === 'unlimited' ? 0 : Math.max(group.minCount, group.maxCount || 1),
                            });
                          }}
                          className="h-10 min-w-[190px] border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-[#00C06B]"
                        >
                          <option value="unlimited">点餐时数量不限</option>
                          <option value="range">点餐时起购限购数</option>
                          <option value="required">点餐时必选</option>
                        </select>

                        {group.limitMode === 'range' && (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            <span>起购</span>
                            <div className="flex items-center">
                              <button type="button" title="减少起购数" onClick={() => setDraftCount(group.id, 'minCount', group.minCount - 1)} className="flex h-10 w-9 items-center justify-center border border-gray-200 bg-white"><Minus size={14} /></button>
                              <input aria-label={`${group.name}起购数`} type="number" min={0} max={99} value={group.minCount} onChange={event => setDraftCount(group.id, 'minCount', Number(event.target.value) || 0)} className="h-10 w-14 border-y border-gray-200 text-center outline-none" />
                              <button type="button" title="增加起购数" onClick={() => setDraftCount(group.id, 'minCount', group.minCount + 1)} className="flex h-10 w-9 items-center justify-center border border-gray-200 bg-white"><Plus size={14} /></button>
                            </div>
                            <span>～</span>
                            <span>限购</span>
                            <div className="flex items-center">
                              <button type="button" title="减少限购数" onClick={() => setDraftCount(group.id, 'maxCount', group.maxCount - 1)} className="flex h-10 w-9 items-center justify-center border border-gray-200 bg-white"><Minus size={14} /></button>
                              <input aria-label={`${group.name}限购数`} type="number" min={0} max={99} value={group.maxCount} onChange={event => setDraftCount(group.id, 'maxCount', Number(event.target.value) || 0)} className="h-10 w-14 border-y border-gray-200 text-center outline-none" />
                              <button type="button" title="增加限购数" onClick={() => setDraftCount(group.id, 'maxCount', group.maxCount + 1)} className="flex h-10 w-9 items-center justify-center border border-gray-200 bg-white"><Plus size={14} /></button>
                            </div>
                            <span>份</span>
                          </div>
                        )}

                        {group.limitMode === 'required' && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>必选数量</span>
                            <div className="flex items-center">
                              <button type="button" title="减少必选数量" onClick={() => setRequiredCount(group.id, group.minCount - 1)} className="flex h-10 w-9 items-center justify-center border border-gray-200 bg-white"><Minus size={14} /></button>
                              <input aria-label={`${group.name}必选数量`} type="number" min={1} max={99} value={group.minCount} onChange={event => setRequiredCount(group.id, Number(event.target.value) || 1)} className="h-10 w-14 border-y border-gray-200 text-center outline-none" />
                              <button type="button" title="增加必选数量" onClick={() => setRequiredCount(group.id, group.minCount + 1)} className="flex h-10 w-9 items-center justify-center border border-gray-200 bg-white"><Plus size={14} /></button>
                            </div>
                            <span>份</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] table-fixed text-left text-sm">
                      <thead className="bg-[#F5F6F8] text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">加料商品名称</th>
                          <th className="w-[180px] px-4 py-3 font-medium">加料商品编码</th>
                          <th className="w-[100px] px-4 py-3 font-medium">限购</th>
                          <th className="w-[110px] px-4 py-3 font-medium">初始库存</th>
                          <th className="w-[100px] px-4 py-3 font-medium">加料价格</th>
                          <th className="w-[80px] px-4 py-3 font-medium">默认值</th>
                          <th className="w-[70px] px-4 py-3 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map(item => (
                          <tr key={item.id} className="border-t border-gray-100 text-gray-600">
                            <td className="px-4 py-3"><div className="font-medium text-gray-800">{item.name}</div><div className="text-xs text-gray-400">ID：{item.id}</div></td>
                            <td className="px-4 py-3">{item.code}</td>
                            <td className="px-4 py-3">
                              {draftLimitScope === 'total'
                                ? draftGlobalLimit.limitMode === 'range' ? draftGlobalLimit.maxCount : draftGlobalLimit.limitMode === 'required' ? draftGlobalLimit.minCount : '-'
                                : group.limitMode === 'range' ? group.maxCount : group.limitMode === 'required' ? group.minCount : '-'}
                            </td>
                            <td className="px-4 py-3">{item.stock}</td>
                            <td className="px-4 py-3">{item.price}</td>
                            <td className="px-4 py-3"><input type="checkbox" defaultChecked={item.isDefault} className="h-4 w-4 accent-[#00C06B]" /></td>
                            <td className="px-4 py-3"><button type="button" title="移除加料" onClick={() => removeAddon(group.id, item.id)}><Trash2 size={15} className="text-gray-400 hover:text-red-500" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="flex h-16 shrink-0 items-center justify-end gap-3 border-t border-gray-100 px-6">
            <button type="button" onClick={() => setEditorGroupId(null)} className="h-10 border border-gray-200 px-5 text-sm text-gray-600">取消</button>
            <button type="button" onClick={saveLimitSettings} className="h-10 bg-[#00C06B] px-6 text-sm font-medium text-white hover:bg-[#00A85A]">保存</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-col bg-[#F5F6FA] text-gray-800">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-6">
        <button type="button" title="返回商品工具" onClick={onBack} className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-100"><ArrowLeft size={19} /></button>
        <div><h2 className="text-base font-bold">批量修改商品关联加料</h2><p className="text-xs text-gray-400">修改加料 & 选择商品</p></div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-[250px] shrink-0 border-r border-gray-100 bg-white px-6 py-8">
          <div className="relative space-y-14">
            <div className="absolute bottom-3 left-[11px] top-3 w-px bg-gray-200" />
            {[
              { index: 1, title: '修改加料 & 选择商品', active: true },
              { index: 2, title: '请选择修改方式', active: false },
              { index: 3, title: '定时执行', active: false },
            ].map(item => (
              <div key={item.index} className={`relative flex items-start gap-4 ${item.active ? 'text-gray-800' : 'text-gray-400'}`}>
                <span className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${item.active ? 'border-[#00C06B] bg-[#00C06B] text-white' : 'border-gray-300 bg-white'}`}>{item.active ? <Check size={14} /> : item.index}</span>
                <span className={`text-sm ${item.active ? 'font-bold' : ''}`}>{item.title}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto bg-white px-6 pb-24 pt-5">
          <h3 className="mb-5 text-lg font-bold">修改加料 & 选择商品</h3>
          <div className="mb-5 flex h-11 items-end gap-7 border-b border-gray-200">
            <button type="button" onClick={() => setScope('uniform')} className={`h-11 border-b-2 px-3 text-sm ${scope === 'uniform' ? 'border-[#00C06B] font-bold text-[#00A85A]' : 'border-transparent text-gray-500'}`}>统一修改</button>
            <button type="button" onClick={() => setScope('single')} className={`h-11 border-b-2 px-3 text-sm ${scope === 'single' ? 'border-[#00C06B] font-bold text-[#00A85A]' : 'border-transparent text-gray-500'}`}>单个修改</button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm">
            <span className="text-gray-600">修改方式：</span>
            {MODIFY_MODES.map(mode => (
              <label key={mode.id} className="flex cursor-pointer items-center gap-2 text-gray-600">
                <input type="radio" name="modify-mode" checked={modifyMode === mode.id} onChange={() => setModifyMode(mode.id)} className="h-4 w-4 accent-[#00C06B]" />
                <span className={modifyMode === mode.id ? 'font-medium text-[#00A85A]' : ''}>{mode.label}</span>
              </label>
            ))}
          </div>

          <div className={`mb-4 flex items-start gap-2 border px-4 py-3 text-sm ${modifyMode === 'clear' ? 'border-red-200 bg-red-50 text-red-600' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            {modifyMode === 'clear' ? <AlertTriangle size={17} className="mt-0.5 shrink-0" /> : <Info size={17} className="mt-0.5 shrink-0" />}
            <span>{modeNotice}</span>
          </div>

          {scope === 'single' && (
            <div className="mb-4 flex items-center gap-2 border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-600"><Info size={16} />单个修改时，可在选择商品后分别配置每个商品的关联加料。</div>
          )}

          <div className="grid min-h-[560px] min-w-[1050px] grid-cols-[minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(250px,0.8fr)] border border-gray-200">
            <section className="min-w-0 border-r border-gray-200 p-4">
              <div className="mb-3">
                <h4 className="text-sm font-bold">{modifyMode === 'remove' ? '选择要移除的加料' : '添加加料'}</h4>
                {isLimitModeSupported(modifyMode) && <p className="mt-1 flex items-center gap-1 text-xs text-[#008C4A]"><SlidersHorizontal size={13} />选择后可继续设置加料购买数量限制</p>}
              </div>
              {modifyMode !== 'clear' ? (
                <>
                  <button type="button" onClick={() => setGroupPickerOpen(true)} className="mb-4 flex h-11 w-full items-center justify-center gap-1 border border-dashed border-[#00C06B] text-sm text-[#00A85A] hover:bg-[#F7FCF9]"><Plus size={17} />{modifyMode === 'remove' ? '选择加料' : '添加加料'}</button>
                  {usesTotalLimit && (
                    <div className="mb-3 flex items-center justify-between gap-3 border border-[#BEE8D3] bg-[#F2FBF7] px-3 py-2.5 text-xs text-[#287A54]">
                      <span className="flex min-w-0 items-center gap-1.5"><SlidersHorizontal size={13} className="shrink-0" /><span className="truncate">购买总量：{getTotalLimitSummary(globalLimit)}</span></span>
                      <button type="button" onClick={() => groups[0] && openGroupEditor(groups[0])} className="shrink-0 font-medium text-[#00A85A] hover:underline">设置</button>
                    </div>
                  )}
                  <div className="space-y-3">{groups.map(renderGroupCard)}</div>
                </>
              ) : (
                <div className="flex h-[280px] flex-col items-center justify-center border border-dashed border-red-200 bg-red-50/40 text-center">
                  <Trash2 size={30} className="mb-3 text-red-300" />
                  <div className="text-sm font-bold text-gray-700">清空所选商品的全部关联加料</div>
                  <div className="mt-1 text-xs text-gray-400">无需选择加料，请继续选择需要修改的商品</div>
                </div>
              )}
            </section>

            <section className="min-w-0 border-r border-gray-200 p-4">
              <h4 className="mb-3 text-sm font-bold">选择需要修改的商品</h4>
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-3 text-gray-400" />
                <input value={productKeyword} onChange={event => setProductKeyword(event.target.value)} placeholder="搜索商品名称或ID" className="h-10 w-full border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]" />
              </div>
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500"><span>已选 <b className="text-[#00A85A]">{selectedProductIds.length}</b> 个商品</span><button type="button" onClick={() => setSelectedProductIds(selectedProductIds.length === PRODUCTS.length ? [] : PRODUCTS.map(item => item.id))} className="text-[#00A85A]">{selectedProductIds.length === PRODUCTS.length ? '取消全选' : '选择全部'}</button></div>
              <div className="max-h-[440px] overflow-y-auto border border-gray-200">
                {filteredProducts.map(product => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-3 last:border-b-0 hover:bg-gray-50">
                    <input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => setSelectedProductIds(current => current.includes(product.id) ? current.filter(id => id !== product.id) : [...current, product.id])} className="h-4 w-4 accent-[#00C06B]" />
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#F2FBF7] text-[#00A85A]"><Package size={18} /></span>
                    <span className="min-w-0 flex-1"><b className="block truncate text-sm text-gray-700">{product.name}</b><span className="block truncate text-xs text-gray-400">{product.code}</span></span>
                    <span className="text-xs text-gray-500">￥{product.price}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="min-w-0 bg-[#FAFBFC] p-4">
              <h4 className="mb-3 text-sm font-bold">小程序预览</h4>
              <div className="mb-3 inline-flex border border-gray-200 bg-white p-0.5 text-xs"><span className="bg-[#DFF7EB] px-3 py-1.5 text-[#00A85A]">修改后</span></div>
              <div className="min-h-[460px] overflow-hidden border border-gray-200 bg-white">
                {selectedProducts.length > 0 ? (
                  <>
                    <div className="flex h-32 items-center justify-center bg-[#20211F] text-white/70"><Package size={38} /></div>
                    <div className="p-4">
                      <div className="font-bold text-gray-800">{selectedProducts[0].name}</div>
                      <div className="mt-1 text-sm font-bold text-red-500">￥{selectedProducts[0].price}</div>
                      <div className="mt-5 space-y-5">
                        {usesTotalLimit && (
                          <div className="border-l-2 border-[#00C06B] bg-[#F2FBF7] px-2.5 py-2 text-[11px] text-[#287A54]">
                            {getTotalLimitSummary(globalLimit)}
                          </div>
                        )}
                        {groups.map(group => (
                          <div key={group.id}>
                            <div className="mb-2 flex items-center justify-between"><b className="text-xs text-gray-700">{group.name}</b>{!usesTotalLimit && <span className="text-[11px] text-gray-400">{getLimitSummary(group)}</span>}</div>
                            <div className="space-y-2">{group.items.slice(0, 2).map(item => <div key={item.id} className="flex items-center justify-between text-xs text-gray-600"><span>{item.name}</span><span>＋</span></div>)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : <div className="flex min-h-[460px] items-center justify-center text-sm text-gray-400">请先选择商品</div>}
              </div>
            </section>
          </div>
        </main>
      </div>

      <div className="absolute bottom-0 left-[250px] right-0 z-20 flex h-16 items-center justify-end gap-3 border-t border-gray-200 bg-white/95 px-6 backdrop-blur-sm">
        <button type="button" onClick={onBack} className="h-10 border border-gray-200 px-5 text-sm text-gray-600">取消</button>
        <button type="button" disabled={selectedProductIds.length === 0 || (modifyMode !== 'clear' && groups.length === 0)} className="inline-flex h-10 items-center gap-1 bg-[#00C06B] px-6 text-sm font-medium text-white hover:bg-[#00A85A] disabled:cursor-not-allowed disabled:bg-gray-300">下一步<ChevronRight size={16} /></button>
      </div>

      {groupPickerOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-6">
          <div className="w-[520px] max-w-[calc(100vw-48px)] bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-gray-100 px-5"><b className="text-sm">选择加料组</b><button type="button" title="关闭" onClick={() => setGroupPickerOpen(false)}><X size={19} className="text-gray-400" /></button></div>
            <div className="p-5">
              <div className="flex items-center justify-between border border-gray-200 px-4 py-4">
                <div><b className="text-sm text-gray-800">{EXTRA_GROUP.name}</b><div className="mt-1 text-xs text-gray-400">{EXTRA_GROUP.items.map(item => item.name).join('、')}</div></div>
                {groups.some(group => group.id === EXTRA_GROUP.id) ? <span className="text-xs text-gray-400">已添加</span> : <button type="button" onClick={() => { setGroups(current => [...current, EXTRA_GROUP]); setGroupPickerOpen(false); }} className="h-8 bg-[#00C06B] px-3 text-xs text-white">添加</button>}
              </div>
            </div>
            <div className="flex h-14 items-center justify-end border-t border-gray-100 px-5"><button type="button" onClick={() => setGroupPickerOpen(false)} className="h-9 border border-gray-200 px-4 text-sm text-gray-600">取消</button></div>
          </div>
        </div>
      )}
      {renderEditor()}
    </div>
  );
};
