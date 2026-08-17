import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, Plus, Search, X, CircleDot } from 'lucide-react';
import type { AttributeMutexRuleRecord } from './WebAttributeMutexRuleList';

type RuleGroup = {
  id: string;
  conditionItems: string[];
  mutexItems: string[];
};

const RULE_NAME_MAX_LENGTH = 30;
const REMARK_MAX_LENGTH = 100;
const MUTEX_OPTIONS = {
  '规格': ['中杯', '大杯', '700ml', '热'],
  '做法': ['去冰', '少冰', '三分糖', '七分糖', '加热'],
  '加料': ['椰果', '珍珠', '奶盖1', '燕麦奶'],
};

const SCOPE_PRODUCTS = ['招牌珍珠奶茶', '手打柠檬茶', '杨枝甘露', '精品拿铁', '超值双人套餐'];

export const WebAttributeMutexRuleEditor: React.FC<{
  mode: 'create' | 'edit';
  rule?: AttributeMutexRuleRecord | null;
  onBack: () => void;
}> = ({ mode, rule, onBack }) => {
  const [ruleName, setRuleName] = useState(rule?.name || '');
  const [remark, setRemark] = useState(rule?.remark || '');
  const [applyScope, setApplyScope] = useState<'all' | 'specific' | 'exclude'>('all');
  const [scopeKeyword, setScopeKeyword] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [picker, setPicker] = useState<{ groupId: string; side: 'conditionItems' | 'mutexItems'; type: keyof typeof MUTEX_OPTIONS } | null>(null);
  const [message, setMessage] = useState('');
  const [groups, setGroups] = useState<RuleGroup[]>([
    {
      id: 'group-1',
      conditionItems: rule ? [rule.baseItems] : [],
      mutexItems: rule ? [rule.mutexItems] : [],
    },
  ]);

  const addGroup = () => {
    setGroups(prev => [
      ...prev,
      {
        id: `group-${prev.length + 1}`,
        conditionItems: [],
        mutexItems: [],
      },
    ]);
  };

  const availableProducts = useMemo(() => SCOPE_PRODUCTS.filter(item => item.includes(scopeKeyword.trim())), [scopeKeyword]);

  const addItem = (value: string) => {
    if (!picker) return;
    setGroups(current => current.map(group => group.id === picker.groupId
      ? { ...group, [picker.side]: group[picker.side].includes(value) ? group[picker.side] : [...group[picker.side], value] }
      : group));
    setPicker(null);
  };

  const removeItem = (groupId: string, side: 'conditionItems' | 'mutexItems', value: string) => {
    setGroups(current => current.map(group => group.id === groupId ? { ...group, [side]: group[side].filter(item => item !== value) } : group));
  };

  const submit = () => {
    if (!ruleName.trim()) return setMessage('请输入规则名称');
    if (!groups.length || groups.some(group => !group.conditionItems.length || !group.mutexItems.length)) return setMessage('每个条件组和对应互斥组都至少选择一项');
    if (applyScope !== 'all' && !selectedProducts.length) return setMessage('请选择适用或不适用商品');
    setMessage('互斥规则已保存，启用状态沿用列表设置');
    window.setTimeout(onBack, 900);
  };

  const removeGroup = (groupId: string) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
  };

  return (
    <div className="pc-page flex flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="h-[60px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 text-[#666] hover:text-[#333]"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-bold text-[#333]">{mode === 'create' ? '新增互斥规则' : '编辑互斥规则'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-5 py-2 rounded-lg border border-[#E8E8E8] text-sm text-[#666] hover:bg-gray-50">返回</button>
          <button onClick={submit} className="px-5 py-2 rounded-lg bg-[#00C06B] text-sm font-bold text-white hover:bg-[#00A35B]">保存规则</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-6">
          <div className="rounded-lg border border-[#FFE1E1] bg-[#FFF8F8] px-4 py-3 text-xs leading-6 text-[#999]">
            <span className="font-bold text-[#FF4D4F]">注意：</span>
            若已配置新版的商品互斥规则，请确保相关小程序已升级到支持版本后再正式使用；互斥条件用于限制同一商品下不可同时选择的规格、做法与加料组合。
          </div>

          <div className="mt-6 space-y-6">
            <EditorRow label="规则名称" required>
              <div className="relative w-[360px]">
                <input
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  maxLength={RULE_NAME_MAX_LENGTH}
                  placeholder="请输入规则名称"
                  className="h-[38px] w-full rounded-lg border border-[#E8E8E8] px-3 pr-16 text-sm outline-none focus:border-[#00C06B]"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999]">
                  {ruleName.length}/{RULE_NAME_MAX_LENGTH}
                </span>
              </div>
            </EditorRow>

            <EditorRow label="备注" alignTop>
              <div className="relative w-[480px]">
                <textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  maxLength={REMARK_MAX_LENGTH}
                  placeholder="请输入规则目的或描述，最多100个字符"
                  className="h-[88px] w-full resize-none rounded-lg border border-[#E8E8E8] px-3 py-2 pb-7 pr-16 text-sm leading-5 outline-none focus:border-[#00C06B]"
                />
                <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-[#999]">
                  {remark.length}/{REMARK_MAX_LENGTH}
                </span>
              </div>
            </EditorRow>

            <EditorRow label="互斥规则" required alignTop>
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_40px_1fr] gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-1.5 text-sm text-[#666]">条件组</div>
                      <button onClick={addGroup} className="rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-1.5 text-sm text-[#666] hover:text-[#00C06B]">
                        添加条件组
                      </button>
                    </div>

                    <div className="space-y-4">
                      {groups.map(group => (
                        <div key={group.id} className="relative rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] px-4 py-4">
                          <button onClick={() => removeGroup(group.id)} className="absolute right-3 top-3 text-[#BFBFBF] hover:text-[#666]">
                            <X size={14} />
                          </button>
                          <div className="space-y-3 pr-6">
                            <div className="flex flex-wrap gap-2">{group.conditionItems.map(item => <span key={`${group.id}-${item}`} className="inline-flex items-center rounded-md border border-[#D9F2E4] bg-[#F3FCF7] px-2 py-1 text-sm text-[#008F4C]">{item}<button onClick={() => removeItem(group.id, 'conditionItems', item)} className="ml-1.5"><X size={12} /></button></span>)}</div>
                            <div className="flex flex-wrap gap-3">{(Object.keys(MUTEX_OPTIONS) as Array<keyof typeof MUTEX_OPTIONS>).map(type => <button key={type} onClick={() => setPicker({ groupId: group.id, side: 'conditionItems', type })} className="text-sm font-medium text-[#00C06B] hover:text-[#00A35B]">+ 添加{type}</button>)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-sm text-[#999]">或</div>

                  <div>
                    <div className="mb-2 rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] px-3 py-1.5 text-sm text-[#666]">互斥组</div>
                    <div className="space-y-4">
                      {groups.map(group => (
                        <div key={`${group.id}-mutex`} className="rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] px-4 py-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">{group.mutexItems.map(item => <span key={`${group.id}-mutex-${item}`} className="inline-flex items-center rounded-md border border-[#FDE2E1] bg-[#FFF7F6] px-2 py-1 text-sm text-[#B42318]">{item}<button onClick={() => removeItem(group.id, 'mutexItems', item)} className="ml-1.5"><X size={12} /></button></span>)}</div>
                            <div className="flex flex-wrap gap-3">{(Object.keys(MUTEX_OPTIONS) as Array<keyof typeof MUTEX_OPTIONS>).map(type => <button key={type} onClick={() => setPicker({ groupId: group.id, side: 'mutexItems', type })} className="text-sm font-medium text-[#00C06B] hover:text-[#00A35B]">+ 添加{type}</button>)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-xs leading-6 text-[#999]">
                  用户点单时，条件组与互斥组内不可同时被选中，适用于规格、做法、加料冲突场景。
                  例如：冰少与去冰做法不可同时选择。
                </div>
              </div>
            </EditorRow>

            <EditorRow label="适用商品" required>
              <div className="space-y-4"><div className="flex flex-wrap items-center gap-8 text-sm">
                <label className={`flex items-center gap-2 ${applyScope === 'all' ? 'text-[#00C06B] font-bold' : 'text-[#666]'}`}>
                  <button onClick={() => setApplyScope('all')}>
                    <CircleDot size={16} className={applyScope === 'all' ? 'text-[#00C06B]' : 'text-[#D9D9D9]'} />
                  </button>
                  全部商品
                </label>
                <label className={`flex items-center gap-2 ${applyScope === 'specific' ? 'text-[#00C06B] font-bold' : 'text-[#666]'}`}>
                  <button onClick={() => setApplyScope('specific')}>
                    <CircleDot size={16} className={applyScope === 'specific' ? 'text-[#00C06B]' : 'text-[#D9D9D9]'} />
                  </button>
                  指定商品
                </label>
                <label className={`flex items-center gap-2 ${applyScope === 'exclude' ? 'text-[#00C06B] font-bold' : 'text-[#666]'}`}>
                  <button onClick={() => setApplyScope('exclude')}>
                    <CircleDot size={16} className={applyScope === 'exclude' ? 'text-[#00C06B]' : 'text-[#D9D9D9]'} />
                  </button>
                  指定商品不适用
                </label>
              </div>{applyScope !== 'all' && <div className="w-[620px] rounded-lg border border-[#E8E8E8] p-4"><div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" /><input value={scopeKeyword} onChange={e => setScopeKeyword(e.target.value)} placeholder="搜索商品名称" className="h-9 w-full rounded-md border border-[#DDE2E8] pl-9 pr-3 text-sm" /></div><div className="grid grid-cols-2 gap-2">{availableProducts.map(product => <button key={product} onClick={() => setSelectedProducts(current => current.includes(product) ? current.filter(item => item !== product) : [...current, product])} className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${selectedProducts.includes(product) ? 'border-[#00B460] bg-[#F3FCF7]' : 'border-[#E8E8E8]'}`}><span>{product}</span>{selectedProducts.includes(product) && <Check size={15} className="text-[#00B460]" />}</button>)}</div><div className="mt-3 text-xs text-[#667085]">已选择 {selectedProducts.length} 个商品</div></div>}</div>
            </EditorRow>
            {message && <div className={`ml-[120px] flex items-center text-sm ${message.includes('已保存') ? 'text-[#008F4C]' : 'text-[#D92D20]'}`}><AlertCircle size={15} className="mr-1.5" />{message}</div>}
          </div>
        </div>
      </div>
      {picker && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35"><div className="w-[440px] rounded-lg bg-white shadow-2xl"><div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-5"><div><h3 className="font-semibold">选择{picker.type}</h3><p className="text-xs text-[#667085]">添加到{picker.side === 'conditionItems' ? '条件组' : '互斥组'}</p></div><button onClick={() => setPicker(null)}><X size={20} className="text-[#667085]" /></button></div><div className="grid grid-cols-2 gap-2 p-5">{MUTEX_OPTIONS[picker.type].map(option => <button key={option} onClick={() => addItem(option)} className="rounded-md border border-[#DDE2E8] px-3 py-2 text-left text-sm hover:border-[#00B460] hover:bg-[#F3FCF7]">{option}</button>)}</div></div></div>}
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
    <div className={`w-[120px] shrink-0 pr-6 text-right text-sm text-[#666] ${alignTop ? 'pt-2' : 'pt-2.5'}`}>
      {required && <span className="mr-1 text-red-500">*</span>}
      {label}:
    </div>
    <div className="flex-1">{children}</div>
  </div>
);
