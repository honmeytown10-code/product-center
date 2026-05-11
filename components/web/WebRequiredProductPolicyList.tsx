import React, { useMemo, useState } from 'react';
import { Search, Filter, ListFilter, Plus } from 'lucide-react';

export type RequiredPolicyRecord = {
  id: string;
  name: string;
  targetName: string;
  targetType: '商品分类' | '商品';
  stores: string[];
  updatedAt: string;
};

export const MOCK_REQUIRED_POLICIES: RequiredPolicyRecord[] = [
  {
    id: 'policy-1',
    name: '测试11',
    targetName: '方案商品111',
    targetType: '商品分类',
    stores: ['范先生的门店', '南山万象店'],
    updatedAt: '2026-05-10 09:20',
  },
  {
    id: 'policy-2',
    name: '111',
    targetName: '新时测测试',
    targetType: '商品分类',
    stores: ['福田卓悦店'],
    updatedAt: '2026-05-09 18:32',
  },
  {
    id: 'policy-3',
    name: 'hulh必选方案11',
    targetName: '热销菜1003, 热销菜1002, 热销菜1001',
    targetType: '商品',
    stores: ['南山万象店', '福田卓悦店', '宝安壹方城店'],
    updatedAt: '2026-05-08 16:11',
  },
  {
    id: 'policy-4',
    name: '测试',
    targetName: '霸王西瓜汁',
    targetType: '商品',
    stores: ['范先生的门店'],
    updatedAt: '2026-05-07 14:45',
  },
  {
    id: 'policy-5',
    name: '测试必选',
    targetName: '标准商品',
    targetType: '商品分类',
    stores: ['南山万象店', '龙华红山店'],
    updatedAt: '2026-05-06 10:08',
  },
];

export const WebRequiredProductPolicyList: React.FC<{
  onCreatePolicy?: () => void;
  onEditPolicy?: (policy: RequiredPolicyRecord) => void;
}> = ({ onCreatePolicy, onEditPolicy }) => {
  const [keyword, setKeyword] = useState('');

  const filteredPolicies = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return MOCK_REQUIRED_POLICIES;
    return MOCK_REQUIRED_POLICIES.filter(item =>
      [item.name, item.targetName, item.targetType, item.stores.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(normalizedKeyword)
    );
  }, [keyword]);

  return (
    <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4">
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
        <div className="px-6 py-4 border-b border-[#E8E8E8] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索"
                className="h-[38px] w-[220px] rounded-lg border border-[#E8E8E8] bg-white pl-9 pr-3 text-sm text-[#333] outline-none focus:border-[#00C06B]"
              />
            </div>
            <button className="inline-flex items-center rounded-lg border border-[#E8E8E8] px-4 py-2.5 text-sm font-bold text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]">
              <Filter size={14} className="mr-1.5 text-[#999]" />
              筛选
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center rounded-lg border border-[#E8E8E8] bg-white px-3 py-2.5 text-sm font-medium text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]">
              <ListFilter size={14} />
            </button>
            <button onClick={onCreatePolicy} className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">
              新增必选商品
            </button>
            <button className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">
              特例设置
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-[#FAFAFA] border-b border-[#E8E8E8] text-xs text-[#666]">
          必选商品按策略生效，一个策略可绑定多个适用门店；命中的门店在点单时需优先满足该策略配置。
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
              <tr>
                <th className="w-[220px] border-b border-[#E8E8E8] px-6 py-4">方案名称</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">商品/分类名称</th>
                <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">适用门店</th>
                <th className="w-[160px] border-b border-[#E8E8E8] px-4 py-4">更新时间</th>
                <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {filteredPolicies.map(policy => (
                <tr key={policy.id} className="border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
                  <td className="px-6 py-4">{policy.name}</td>
                  <td className="px-4 py-4">
                    <div className="text-[#333]">{policy.targetName}</div>
                    <div className="mt-1 text-xs text-[#999]">{policy.targetType}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {policy.stores.map(store => (
                        <span key={store} className="rounded-full bg-[#F3FCF7] px-2 py-1 text-xs text-[#1F9D55]">
                          {store}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#666]">{policy.updatedAt}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => onEditPolicy?.(policy)} className="font-medium text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                      <button className="font-medium text-[#00C06B] hover:text-[#00A35B]">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPolicies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-sm text-[#999]">
                    暂无必选商品策略
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
