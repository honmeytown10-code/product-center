import React, { useMemo, useState } from 'react';
import { ListFilter, Plus, Search, X } from 'lucide-react';

export type AttributeMutexRuleRecord = {
  id: string;
  name: string;
  baseItems: string;
  mutexItems: string;
  remark?: string;
  enabled: boolean;
};

export const MOCK_ATTRIBUTE_MUTEX_RULES: AttributeMutexRuleRecord[] = [
  { id: 'mutex-1', name: '冷热温度互斥', baseItems: '- / 中杯,2 / -', mutexItems: '- / 中杯,七分糖 / -', remark: '冷热饮温度选择不可混用', enabled: true },
  { id: 'mutex-2', name: '冷热口味互斥', baseItems: '热 / - / -', mutexItems: '冷 / - / -', remark: '避免冷热口味同时被选择', enabled: false },
  { id: 'mutex-3', name: '容量与冰量互斥', baseItems: '700ml / 七分糖 / 泡泡冰热', mutexItems: '- / 三分糖,少量冰饮用 / 泡泡冰冰', remark: '大杯容量不支持部分冰量搭配', enabled: true },
  { id: 'mutex-4', name: '测试规则A', baseItems: '- / - / 测试,asl', mutexItems: '- / - / 测试,asl3', enabled: false },
  { id: 'mutex-5', name: '测试规则B', baseItems: '- / - / 测试,asl', mutexItems: '- / - / 测试,asl2', enabled: false },
  { id: 'mutex-6', name: '果味与奶盖互斥', baseItems: '- / - / 椰果', mutexItems: '- / - / 奶盖1', remark: '门店反馈该组合口感不稳定', enabled: false },
  { id: 'mutex-7', name: '冰量互斥规则', baseItems: '多 / - / -', mutexItems: '- / 少冰,碎冰,多冰 / -', enabled: false },
  { id: 'mutex-8', name: '温度容量互斥', baseItems: '多 / 不多 / - / -', mutexItems: '- / 全糖,热 / -', remark: '温度与容量存在出杯限制', enabled: false },
];

type SearchType = 'name' | 'remark';

const SEARCH_OPTIONS: Array<{ type: SearchType; label: string }> = [
  { type: 'name', label: '按规则名称搜索' },
  { type: 'remark', label: '按备注搜索' },
];

export const WebAttributeMutexRuleList: React.FC<{
  onCreateRule?: () => void;
  onEditRule?: (rule: AttributeMutexRuleRecord) => void;
}> = ({ onCreateRule, onEditRule }) => {
  const [keyword, setKeyword] = useState('');
  const [searchType, setSearchType] = useState<SearchType | null>(null);
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [rules, setRules] = useState(MOCK_ATTRIBUTE_MUTEX_RULES);

  const filteredRules = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword || !searchType) return rules;
    return rules.filter(item =>
      (searchType === 'name' ? item.name : item.remark || '').toLowerCase().includes(normalizedKeyword)
    );
  }, [keyword, rules, searchType]);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(item => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  };

  const clearSearch = () => {
    setKeyword('');
    setSearchType(null);
    setShowSearchOptions(false);
  };

  const selectSearchType = (type: SearchType) => {
    setSearchType(type);
    setShowSearchOptions(false);
  };

  return (
    <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4">
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
        <div className="px-6 py-4 border-b border-[#E8E8E8] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input
                value={keyword}
                onChange={e => {
                  setKeyword(e.target.value);
                  setShowSearchOptions(!!e.target.value.trim());
                }}
                onFocus={() => setShowSearchOptions(!!keyword.trim())}
                onBlur={() => window.setTimeout(() => setShowSearchOptions(false), 120)}
                placeholder="请输入搜索内容"
                className={`h-[38px] w-[300px] rounded-lg border bg-white pl-9 pr-10 text-sm text-[#333] outline-none transition-colors ${
                  showSearchOptions ? 'border-[#00C06B]' : 'border-[#E8E8E8] focus:border-[#00C06B]'
                }`}
              />
              {keyword && (
                <button
                  type="button"
                  onMouseDown={event => event.preventDefault()}
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full text-[#C7CDD8] hover:text-[#8B95A5]"
                  aria-label="清空搜索"
                >
                  <X size={16} />
                </button>
              )}

              {showSearchOptions && (
                <div className="absolute left-0 top-[44px] z-30 w-[360px] rounded-lg border border-[#00C06B] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
                  <div className="border-b border-[#E5E7EB] pb-3 text-sm text-[#98A2B3]">请选择搜索对象</div>
                  <div className="pt-2">
                    {SEARCH_OPTIONS.map(option => (
                      <button
                        key={option.type}
                        type="button"
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => selectSearchType(option.type)}
                        className={`block w-full rounded-md px-0 py-2.5 text-left text-sm transition-colors hover:text-[#00C06B] ${
                          searchType === option.type ? 'font-bold text-[#00C06B]' : 'text-[#4B5563]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center rounded-lg border border-[#E8E8E8] bg-white px-3 py-2.5 text-sm font-medium text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]">
              <ListFilter size={14} />
            </button>
            <button onClick={onCreateRule} className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">
              <Plus size={14} className="mr-1.5" />
              添加互斥规则
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left">
            <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
              <tr>
                <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">规则名称</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">基础规格/做法/加料</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">互斥规格/做法/加料</th>
                <th className="w-[240px] border-b border-[#E8E8E8] px-4 py-4">备注</th>
                <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4 text-center">是否启用</th>
                <th className="sticky right-0 z-10 w-[150px] border-b border-[#E8E8E8] bg-[#F7F8FA] px-4 py-4 text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {filteredRules.map(rule => (
                <tr key={rule.id} className="group border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
                  <td className="px-4 py-4 font-medium">{rule.name}</td>
                  <td className="px-4 py-4 text-[#666]">{rule.baseItems}</td>
                  <td className="px-4 py-4 text-[#666]">{rule.mutexItems}</td>
                  <td className="px-4 py-4 text-[#666]">
                    <div className="max-w-[220px] truncate" title={rule.remark || '-'}>
                      {rule.remark || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleRule(rule.id)}
                        role="switch"
                        aria-checked={rule.enabled}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                          rule.enabled ? 'border-[#0FBE6C] bg-[#0FBE6C]' : 'border-[#E5E7EB] bg-[#F3F4F6]'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            rule.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="sticky right-0 z-10 bg-white px-4 py-4 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)] group-hover:bg-[#FCFFFD]">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => onEditRule?.(rule)} className="font-medium text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                      <button className="font-medium text-[#00C06B] hover:text-[#00A35B]">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-sm text-[#999]">
                    暂无属性互斥规则
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
