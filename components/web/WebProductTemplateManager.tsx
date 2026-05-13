import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Download,
  Upload,
  Filter,
  ListFilter,
} from 'lucide-react';

type TemplateStatus = 'enabled' | 'disabled';

type TemplateGroup = {
  id: string;
  name: string;
  level: number;
};

type ProductTemplateRecord = {
  id: string;
  name: string;
  description: string;
  status: TemplateStatus;
  productCount: number;
  storeCount: number;
  groupId: string;
};

const TEMPLATE_GROUPS: TemplateGroup[] = [
  { id: 'all', name: '全部', level: 0 },
  { id: 'area-1', name: '区域1', level: 0 },
  { id: 'test-2', name: '测试分组2', level: 0 },
  { id: 'test-2-1', name: '子分组2', level: 1 },
  { id: 'test-2-2', name: '测试分组2...', level: 1 },
  { id: 'test-1', name: '测试分组1', level: 0 },
  { id: 'ungrouped', name: '未分组', level: 0 },
];

const TEMPLATE_RECORDS: ProductTemplateRecord[] = [
  { id: 'tpl-1', name: '0427 模板-1', description: '-', status: 'enabled', productCount: 3, storeCount: 0, groupId: 'all' },
  { id: 'tpl-2', name: '0427 档口模板-1', description: '11', status: 'enabled', productCount: 2, storeCount: 0, groupId: 'area-1' },
  { id: 'tpl-3', name: '0420 模板-1', description: '11', status: 'enabled', productCount: 1, storeCount: 1, groupId: 'test-2' },
  { id: 'tpl-4', name: '0407 模板-1', description: '-', status: 'enabled', productCount: 26, storeCount: 1, groupId: 'test-2' },
  { id: 'tpl-5', name: '企迈饭店模板', description: '-', status: 'enabled', productCount: 44, storeCount: 0, groupId: 'test-2-1' },
  { id: 'tpl-6', name: '测试多群商品同步', description: '-', status: 'enabled', productCount: 10, storeCount: 2, groupId: 'test-2-2' },
  { id: 'tpl-7', name: '0316 模板-2', description: '-', status: 'enabled', productCount: 6, storeCount: 0, groupId: 'test-1' },
  { id: 'tpl-8', name: '0316 模板-1', description: '-', status: 'enabled', productCount: 3, storeCount: 0, groupId: 'ungrouped' },
];

const FILTER_OPTIONS = [
  { label: '筛选类型：按门店筛选', value: 'store' },
  { label: '机构门店：南边先择...', value: 'org' },
  { label: '启用状态：启用', value: 'enabled' },
];

export const WebProductTemplateManager: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [activeGroupId, setActiveGroupId] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TemplateStatus>('enabled');

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return TEMPLATE_RECORDS.filter(record => {
      const matchedKeyword =
        !normalizedKeyword ||
        record.name.toLowerCase().includes(normalizedKeyword) ||
        record.description.toLowerCase().includes(normalizedKeyword);

      if (!matchedKeyword) return false;
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;
      if (activeGroupId !== 'all' && record.groupId !== activeGroupId) return false;

      return true;
    });
  }, [activeGroupId, keyword, statusFilter]);

  return (
    <div className="flex-1 bg-[#F5F6FA] p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-[#EDEDED] px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {FILTER_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#666] transition-colors hover:border-[#00C06B]/30 hover:text-[#00A35B]"
              >
                <span>{option.label}</span>
                <ChevronDown size={16} className="ml-2 text-[#999]" />
              </button>
            ))}
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-dashed border-[#D9D9D9] bg-white px-4 py-2 text-sm text-[#666] transition-colors hover:border-[#00C06B]/30 hover:text-[#00A35B]"
            >
              <Plus size={16} className="mr-2" />
              添加筛选
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#666] transition-colors hover:bg-[#FAFAFA]"
            >
              保存快捷筛选项
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#666] transition-colors hover:bg-[#FAFAFA]"
              >
                重置
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00A35B]"
              >
                查询
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-[#F0F0F0] px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索"
                className="w-[180px] rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-[#333] outline-none transition-colors focus:border-[#00C06B]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#666] transition-colors hover:bg-[#FAFAFA]"
              >
                <ListFilter size={16} className="mr-2 text-[#999]" />
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#666] transition-colors hover:bg-[#FAFAFA]"
              >
                批量操作
                <ChevronDown size={16} className="ml-2 text-[#999]" />
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm text-[#666] transition-colors hover:bg-[#FAFAFA]"
              >
                导入/导出
                <ChevronDown size={16} className="ml-2 text-[#999]" />
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00A35B]"
              >
                创建模版
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex w-[170px] shrink-0 flex-col border-r border-[#EDEDED] bg-[#FAFAFA]">
            <div className="p-4">
              <button
                type="button"
                className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#666] transition-colors hover:border-[#00C06B]/30 hover:text-[#00A35B]"
              >
                新增分组
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
              <div className="space-y-1">
                {TEMPLATE_GROUPS.map(group => {
                  const active = activeGroupId === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setActiveGroupId(group.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? 'bg-[#EAF8F1] font-medium text-[#00A35B]'
                          : 'text-[#666] hover:bg-white hover:text-[#333]'
                      }`}
                      style={{ paddingLeft: `${12 + group.level * 18}px` }}
                    >
                      <span className="truncate">{group.name}</span>
                      <MoreHorizontal size={14} className="shrink-0 text-[#999]" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-auto px-4 py-4">
              <table className="min-w-full table-fixed border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                  <tr className="text-left text-xs font-bold text-[#666]">
                    <th className="w-[280px] border-b border-[#EDEDED] px-4 py-3">模板名称</th>
                    <th className="w-[180px] border-b border-[#EDEDED] px-4 py-3">模板描述</th>
                    <th className="w-[120px] border-b border-[#EDEDED] px-4 py-3">模...</th>
                    <th className="w-[110px] border-b border-[#EDEDED] px-4 py-3">模板商品</th>
                    <th className="w-[110px] border-b border-[#EDEDED] px-4 py-3">适用门店</th>
                    <th className="w-[160px] border-b border-[#EDEDED] px-4 py-3">操作</th>
                    <th className="w-[60px] border-b border-[#EDEDED] px-4 py-3 text-center">
                      <Filter size={14} className="mx-auto text-[#999]" />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white text-sm text-[#333]">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-[#FAFBFC]">
                      <td className="border-b border-[#F1F1F1] px-4 py-4">
                        <button type="button" className="font-medium text-[#00A35B] hover:text-[#008C58]">
                          {record.name}
                        </button>
                      </td>
                      <td className="border-b border-[#F1F1F1] px-4 py-4 text-[#666]">{record.description}</td>
                      <td className="border-b border-[#F1F1F1] px-4 py-4">
                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                          record.status === 'enabled' ? 'bg-[#EAF8F1] text-[#00A35B]' : 'bg-[#F5F5F5] text-[#999]'
                        }`}>
                          {record.status === 'enabled' ? '生效中' : '已停用'}
                        </span>
                      </td>
                      <td className="border-b border-[#F1F1F1] px-4 py-4 text-[#666]">{record.productCount}</td>
                      <td className="border-b border-[#F1F1F1] px-4 py-4 text-[#666]">{record.storeCount}</td>
                      <td className="border-b border-[#F1F1F1] px-4 py-4">
                        <div className="flex items-center gap-3 text-sm font-medium text-[#00A35B]">
                          <button type="button" className="hover:text-[#008C58]">管理</button>
                          <button type="button" className="hover:text-[#008C58]">编辑</button>
                          <button type="button" className="text-[#999] hover:text-[#666]">...</button>
                        </div>
                      </td>
                      <td className="border-b border-[#F1F1F1] px-4 py-4 text-center text-[#999]">
                        <MoreHorizontal size={16} className="mx-auto" />
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm text-[#999]">
                        暂无模板数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="border-t border-[#F0F0F0] px-4 py-3">
          <div className="flex items-center justify-end gap-3 text-sm text-[#666]">
            <span>共 998 条</span>
            <button type="button" className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 hover:bg-[#FAFAFA]">
              20条/页
            </button>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(page => (
                <button
                  key={page}
                  type="button"
                  className={`h-8 min-w-[32px] rounded-lg px-3 ${
                    page === 1 ? 'bg-[#00C06B] text-white' : 'border border-[#E5E7EB] bg-white text-[#666] hover:bg-[#FAFAFA]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
