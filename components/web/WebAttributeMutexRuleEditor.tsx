import React, { useState } from 'react';
import { ChevronLeft, Plus, X, CircleDot } from 'lucide-react';
import type { AttributeMutexRuleRecord } from './WebAttributeMutexRuleList';

type RuleGroup = {
  id: string;
  conditionItems: string[];
  mutexItems: string[];
};

export const WebAttributeMutexRuleEditor: React.FC<{
  mode: 'create' | 'edit';
  rule?: AttributeMutexRuleRecord | null;
  onBack: () => void;
}> = ({ mode, rule, onBack }) => {
  const [ruleName, setRuleName] = useState(rule?.name || '');
  const [applyScope, setApplyScope] = useState<'all' | 'specific' | 'exclude'>('all');
  const [groups, setGroups] = useState<RuleGroup[]>([
    {
      id: 'group-1',
      conditionItems: ['添加规格', '添加做法', '添加加料'],
      mutexItems: ['添加规格', '添加做法', '添加加料'],
    },
    {
      id: 'group-2',
      conditionItems: ['添加规格', '添加做法', '添加加料'],
      mutexItems: ['添加规格', '添加做法', '添加加料'],
    },
  ]);

  const addGroup = () => {
    setGroups(prev => [
      ...prev,
      {
        id: `group-${prev.length + 1}`,
        conditionItems: ['添加规格', '添加做法', '添加加料'],
        mutexItems: ['添加规格', '添加做法', '添加加料'],
      },
    ]);
  };

  const removeGroup = (groupId: string) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="h-[60px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 text-[#666] hover:text-[#333]"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-bold text-[#333]">{mode === 'create' ? '新增互斥规则' : '编辑互斥规则'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-5 py-2 rounded-lg border border-[#E8E8E8] text-sm text-[#666] hover:bg-gray-50">返回</button>
          <button className="px-5 py-2 rounded-lg bg-[#00C06B] text-sm font-bold text-white hover:bg-[#00A35B]">提交</button>
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
              <input
                value={ruleName}
                onChange={e => setRuleName(e.target.value)}
                placeholder="请输入规则名称"
                className="h-[38px] w-[360px] rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]"
              />
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
                            {group.conditionItems.map(item => (
                              <button key={`${group.id}-${item}`} className="mr-3 text-sm font-medium text-[#00C06B] hover:text-[#00A35B]">
                                + {item}
                              </button>
                            ))}
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
                            {group.mutexItems.map(item => (
                              <button key={`${group.id}-mutex-${item}`} className="mr-3 text-sm font-medium text-[#00C06B] hover:text-[#00A35B]">
                                + {item}
                              </button>
                            ))}
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
              <div className="flex flex-wrap items-center gap-8 text-sm">
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
              </div>
            </EditorRow>
          </div>
        </div>
      </div>
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
