import React, { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  ChevronDown,
  ChevronRight,
  Package2,
  ImageIcon,
} from 'lucide-react';

type IngredientItem = {
  id: string;
  name: string;
};

type IngredientGroup = {
  id: string;
  name: string;
  code: string;
  items: IngredientItem[];
};

type MaterialItem = {
  id: string;
  name: string;
  imageStatus: '已上传' | '待上传';
};

const MOCK_INGREDIENT_GROUPS: IngredientGroup[] = [
  {
    id: 'group-1',
    name: '卤味（J）',
    code: 'J',
    items: [
      { id: 'item-1', name: '大蒜' },
      { id: 'item-2', name: '桂皮1' },
      { id: 'item-3', name: '八角' },
      { id: 'item-4', name: '生姜' },
      { id: 'item-5', name: '辣椒' },
      { id: 'item-6', name: '小茴香' },
      { id: 'item-7', name: '老抽' },
      { id: 'item-8', name: '糖' },
      { id: 'item-9', name: '6' },
      { id: 'item-10', name: '7' },
      { id: 'item-11', name: '8' },
    ],
  },
  {
    id: 'group-2',
    name: '烘焙基础',
    code: 'HB',
    items: [
      { id: 'item-12', name: '牛奶' },
      { id: 'item-13', name: '淡奶油' },
      { id: 'item-14', name: '黄油' },
      { id: 'item-15', name: '细砂糖' },
    ],
  },
  {
    id: 'group-3',
    name: '果酱辅料',
    code: 'GJ',
    items: [
      { id: 'item-16', name: '草莓酱' },
      { id: 'item-17', name: '蓝莓酱' },
      { id: 'item-18', name: '柠檬汁' },
    ],
  },
];

const MOCK_MATERIALS: MaterialItem[] = [
  { id: 'material-1', name: '咳嗽奶茶的咳嗽', imageStatus: '已上传' },
  { id: 'material-2', name: '大别山车厘子', imageStatus: '已上传' },
  { id: 'material-3', name: '新疆葡萄干', imageStatus: '已上传' },
  { id: 'material-4', name: '有机酸奶', imageStatus: '已上传' },
  { id: 'material-5', name: '现做马蹄', imageStatus: '已上传' },
  { id: 'material-6', name: '甄选优质牛油果', imageStatus: '已上传' },
  { id: 'material-7', name: '百分百牧场牛乳', imageStatus: '已上传' },
  { id: 'material-8', name: '致臻厚乳', imageStatus: '已上传' },
  { id: 'material-9', name: '进口抹茶粉', imageStatus: '待上传' },
];

export const WebIngredientLibraryManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ingredient' | 'material'>('ingredient');
  const [keyword, setKeyword] = useState('');
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set(['group-1']));

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedKeyword) return MOCK_INGREDIENT_GROUPS;

    return MOCK_INGREDIENT_GROUPS.reduce<IngredientGroup[]>((acc, group) => {
      const matchedItems = group.items.filter(item => item.name.toLowerCase().includes(normalizedKeyword));
      const matchedGroup = group.name.toLowerCase().includes(normalizedKeyword) || group.code.toLowerCase().includes(normalizedKeyword);

      if (matchedGroup || matchedItems.length > 0) {
        acc.push({
          ...group,
          items: matchedGroup ? group.items : matchedItems,
        });
      }

      return acc;
    }, []);
  }, [normalizedKeyword]);

  const filteredMaterials = useMemo(() => {
    if (!normalizedKeyword) return MOCK_MATERIALS;
    return MOCK_MATERIALS.filter(item => item.name.toLowerCase().includes(normalizedKeyword));
  }, [normalizedKeyword]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const renderIngredientTable = () => (
    <div className="flex-1 overflow-auto">
      <table className="min-w-full table-fixed border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
          <tr className="text-left text-xs font-bold text-[#666]">
            <th className="w-[320px] border-b border-[#EDEDED] px-5 py-3">分组名称</th>
            <th className="border-b border-[#EDEDED] px-5 py-3">配料名称</th>
            <th className="w-[180px] border-b border-[#EDEDED] px-5 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white text-sm text-[#333]">
          {filteredGroups.map(group => {
            const isExpanded = expandedGroupIds.has(group.id);

            return (
              <React.Fragment key={group.id}>
                <tr className="hover:bg-[#FAFBFC]">
                  <td className="border-b border-[#F1F1F1] px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="flex items-center gap-2 text-sm font-medium text-[#333]"
                    >
                      {isExpanded ? <ChevronDown size={16} className="text-[#999]" /> : <ChevronRight size={16} className="text-[#999]" />}
                      <span>{group.name}</span>
                    </button>
                  </td>
                  <td className="border-b border-[#F1F1F1] px-5 py-4 text-[#999]">-</td>
                  <td className="border-b border-[#F1F1F1] px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-4 text-sm font-medium">
                      <button type="button" className="text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                      <button type="button" className="text-[#FF5A5F] hover:text-[#E5484D]">删除</button>
                    </div>
                  </td>
                </tr>
                {isExpanded && group.items.map(item => (
                  <tr key={item.id} className="hover:bg-[#FAFBFC]">
                    <td className="border-b border-[#F7F7F7] px-5 py-4 text-[#999]">
                      <span className="ml-7">-</span>
                    </td>
                    <td className="border-b border-[#F7F7F7] px-5 py-4">{item.name}</td>
                    <td className="border-b border-[#F7F7F7] px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-4 text-sm font-medium">
                        <button type="button" className="text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                        <button type="button" className="text-[#FF5A5F] hover:text-[#E5484D]">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderMaterialTable = () => (
    <div className="flex-1 overflow-auto">
      <table className="min-w-full table-fixed border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
          <tr className="text-left text-xs font-bold text-[#666]">
            <th className="border-b border-[#EDEDED] px-5 py-3">原料名称</th>
            <th className="w-[220px] border-b border-[#EDEDED] px-5 py-3">原料展示图</th>
            <th className="w-[180px] border-b border-[#EDEDED] px-5 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white text-sm text-[#333]">
          {filteredMaterials.map(item => (
            <tr key={item.id} className="hover:bg-[#FAFBFC]">
              <td className="border-b border-[#F1F1F1] px-5 py-4">{item.name}</td>
              <td className="border-b border-[#F1F1F1] px-5 py-4">
                <span className={item.imageStatus === '已上传' ? 'font-medium text-[#00C06B]' : 'font-medium text-[#F59E0B]'}>
                  {item.imageStatus}
                </span>
              </td>
              <td className="border-b border-[#F1F1F1] px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-4 text-sm font-medium">
                  <button type="button" className="text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                  <button type="button" className="text-[#FF5A5F] hover:text-[#E5484D]">删除</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex-1 bg-[#F5F6FA] p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-[#EDEDED] px-6">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('ingredient')}
              className={`relative py-4 text-sm font-bold transition-colors ${activeTab === 'ingredient' ? 'text-[#00C06B]' : 'text-[#666] hover:text-[#333]'}`}
            >
              配料库
              {activeTab === 'ingredient' && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#00C06B]" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('material')}
              className={`relative py-4 text-sm font-bold transition-colors ${activeTab === 'material' ? 'text-[#00C06B]' : 'text-[#666] hover:text-[#333]'}`}
            >
              原料库
              {activeTab === 'material' && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#00C06B]" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-[#F2F2F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索"
                className="w-[220px] rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-[#333] outline-none transition-colors focus:border-[#00C06B]"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#666] transition-colors hover:bg-[#FAFAFA]"
            >
              <Filter size={16} className="mr-2 text-[#999]" />
              筛选
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'ingredient' ? (
              <>
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg border border-[#00C06B] bg-white px-4 py-2 text-sm font-medium text-[#00C06B] transition-colors hover:bg-[#F0FDF4]"
                >
                  <Download size={16} className="mr-2" />
                  配料导出
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg border border-[#00C06B] bg-white px-4 py-2 text-sm font-medium text-[#00C06B] transition-colors hover:bg-[#F0FDF4]"
                >
                  <Upload size={16} className="mr-2" />
                  配料导入
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00A35B]"
                >
                  <Plus size={16} className="mr-2" />
                  新增配料
                </button>
              </>
            ) : (
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00A35B]"
              >
                <Plus size={16} className="mr-2" />
                添加
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#F5F5F5] bg-[#FCFCFD] px-6 py-3 text-xs text-[#999]">
          <div className="flex items-center gap-2">
            {activeTab === 'ingredient' ? <Package2 size={14} /> : <ImageIcon size={14} />}
            <span>
              {activeTab === 'ingredient'
                ? `当前共 ${filteredGroups.length} 个配料分组，已展开 ${Array.from(expandedGroupIds).length} 个分组`
                : `当前共 ${filteredMaterials.length} 条原料记录`}
            </span>
          </div>
          <span>
            {activeTab === 'ingredient' ? '支持按分组维护配料，并快速导入导出' : '支持维护原料展示图，便于前后台统一识别'}
          </span>
        </div>

        {activeTab === 'ingredient' ? renderIngredientTable() : renderMaterialTable()}
      </div>
    </div>
  );
};
