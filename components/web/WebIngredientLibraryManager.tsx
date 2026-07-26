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
  X,
  Trash2,
} from 'lucide-react';

type IngredientItem = {
  id: string;
  name: string;
  thirdPartyCode?: string;
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
      { id: 'item-1', name: '大蒜', thirdPartyCode: 'TP0001' },
      { id: 'item-2', name: '桂皮1', thirdPartyCode: 'TP0002' },
      { id: 'item-3', name: '八角', thirdPartyCode: 'TP0003' },
      { id: 'item-4', name: '生姜', thirdPartyCode: 'TP0004' },
      { id: 'item-5', name: '辣椒', thirdPartyCode: 'TP0005' },
      { id: 'item-6', name: '小茴香', thirdPartyCode: 'TP0006' },
      { id: 'item-7', name: '老抽', thirdPartyCode: 'TP0007' },
      { id: 'item-8', name: '糖', thirdPartyCode: 'TP0008' },
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
      { id: 'item-12', name: '牛奶', thirdPartyCode: 'MILK001' },
      { id: 'item-13', name: '淡奶油', thirdPartyCode: 'CREAM01' },
      { id: 'item-14', name: '黄油', thirdPartyCode: 'BUTTER1' },
      { id: 'item-15', name: '细砂糖', thirdPartyCode: 'SUGAR01' },
    ],
  },
  {
    id: 'group-3',
    name: '果酱辅料',
    code: 'GJ',
    items: [
      { id: 'item-16', name: '草莓酱', thirdPartyCode: 'JAM001' },
      { id: 'item-17', name: '蓝莓酱', thirdPartyCode: 'JAM002' },
      { id: 'item-18', name: '柠檬汁', thirdPartyCode: 'LEMON01' },
    ],
  },
];

const THIRD_PARTY_CODE_MAX_LENGTH = 15;

type IngredientEditorState = {
  mode: 'create' | 'edit';
  group: IngredientGroup;
};

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
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroup[]>(MOCK_INGREDIENT_GROUPS);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set(['group-1']));
  const [ingredientEditor, setIngredientEditor] = useState<IngredientEditorState | null>(null);

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedKeyword) return ingredientGroups;

    return ingredientGroups.reduce<IngredientGroup[]>((acc, group) => {
      const matchedItems = group.items.filter(item =>
        item.name.toLowerCase().includes(normalizedKeyword) ||
        (item.thirdPartyCode || '').toLowerCase().includes(normalizedKeyword)
      );
      const matchedGroup = group.name.toLowerCase().includes(normalizedKeyword) || group.code.toLowerCase().includes(normalizedKeyword);

      if (matchedGroup || matchedItems.length > 0) {
        acc.push({
          ...group,
          items: matchedGroup ? group.items : matchedItems,
        });
      }

      return acc;
    }, []);
  }, [ingredientGroups, normalizedKeyword]);

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

  const openCreateIngredientEditor = () => {
    setIngredientEditor({
      mode: 'create',
      group: {
        id: `group-${Date.now()}`,
        name: '',
        code: '',
        items: [{ id: `item-${Date.now()}`, name: '', thirdPartyCode: '' }],
      },
    });
  };

  const openEditIngredientEditor = (group: IngredientGroup) => {
    setIngredientEditor({
      mode: 'edit',
      group: {
        ...group,
        items: group.items.map(item => ({ ...item })),
      },
    });
  };

  const saveIngredientGroup = (group: IngredientGroup) => {
    const cleanedGroup = {
      ...group,
      code: group.code.trim(),
      items: group.items
        .filter(item => item.name.trim())
        .map(item => ({
          ...item,
          name: item.name.trim(),
          thirdPartyCode: (item.thirdPartyCode || '').trim(),
        })),
    };

    setIngredientGroups(prev => {
      if (ingredientEditor?.mode === 'edit') {
        return prev.map(item => (item.id === cleanedGroup.id ? cleanedGroup : item));
      }
      return [...prev, cleanedGroup];
    });
    setExpandedGroupIds(prev => new Set(prev).add(cleanedGroup.id));
    setIngredientEditor(null);
  };

  const renderIngredientTable = () => (
    <div className="flex-1 overflow-auto">
      <table className="min-w-full table-fixed border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
          <tr className="text-left text-xs font-bold text-[#666]">
            <th className="w-[320px] border-b border-[#EDEDED] px-5 py-3">分组名称</th>
            <th className="border-b border-[#EDEDED] px-5 py-3">配料名称</th>
            <th className="w-[220px] border-b border-[#EDEDED] px-5 py-3">三方编码</th>
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
                  <td className="border-b border-[#F1F1F1] px-5 py-4 font-mono text-xs text-[#666]">{group.code || '-'}</td>
                  <td className="border-b border-[#F1F1F1] px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-4 text-sm font-medium">
                      <button type="button" onClick={() => openEditIngredientEditor(group)} className="text-[#00C06B] hover:text-[#00A35B]">编辑</button>
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
                    <td className="border-b border-[#F7F7F7] px-5 py-4 font-mono text-xs text-[#666]">{item.thirdPartyCode || '-'}</td>
                    <td className="border-b border-[#F7F7F7] px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-4 text-sm font-medium">
                        <button type="button" onClick={() => openEditIngredientEditor(group)} className="text-[#00C06B] hover:text-[#00A35B]">编辑</button>
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
                  onClick={openCreateIngredientEditor}
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
      {ingredientEditor && (
        <IngredientEditorModal
          state={ingredientEditor}
          onChange={setIngredientEditor}
          onClose={() => setIngredientEditor(null)}
          onSave={saveIngredientGroup}
        />
      )}
    </div>
  );
};

const IngredientEditorModal: React.FC<{
  state: IngredientEditorState;
  onChange: React.Dispatch<React.SetStateAction<IngredientEditorState | null>>;
  onClose: () => void;
  onSave: (group: IngredientGroup) => void;
}> = ({ state, onChange, onClose, onSave }) => {
  const group = state.group;
  const hasValidContent = group.name.trim() && group.items.some(item => item.name.trim());

  const updateGroup = (updates: Partial<IngredientGroup>) => {
    onChange(prev => (prev ? { ...prev, group: { ...prev.group, ...updates } } : prev));
  };

  const updateItem = (itemId: string, updates: Partial<IngredientItem>) => {
    updateGroup({
      items: group.items.map(item => (item.id === itemId ? { ...item, ...updates } : item)),
    });
  };

  const addItem = () => {
    updateGroup({
      items: [...group.items, { id: `item-${Date.now()}`, name: '', thirdPartyCode: '' }],
    });
  };

  const removeItem = (itemId: string) => {
    updateGroup({
      items: group.items.length > 1 ? group.items.filter(item => item.id !== itemId) : group.items,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#111827]/55">
      <div className="flex h-[78vh] w-[980px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#E8E8E8] px-6">
          <div>
            <div className="text-lg font-bold text-[#333]">{state.mode === 'create' ? '新增配料' : '编辑配料'}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-[#98A2B3] hover:bg-[#F5F6FA] hover:text-[#333]">
            <X size={20} />
          </button>
        </div>

        <div className="shrink-0 border-b border-[#F2F2F2] px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="w-[92px] text-right text-sm text-[#666]">
              <span className="mr-1 text-[#FF4D4F]">*</span>分组名称:
            </label>
            <input
              value={group.name}
              onChange={event => updateGroup({ name: event.target.value })}
              placeholder="请输入分组名称"
              className="h-[38px] w-[280px] rounded-lg border border-[#E5E7EB] px-3 text-sm text-[#333] outline-none focus:border-[#00C06B]"
            />
            <label className="ml-6 text-sm text-[#666]">三方编码:</label>
            <div className="relative">
              <input
                value={group.code}
                maxLength={THIRD_PARTY_CODE_MAX_LENGTH}
                onChange={event => updateGroup({ code: event.target.value })}
                placeholder="请输入三方编码"
                className="h-[38px] w-[240px] rounded-lg border border-[#E5E7EB] px-3 pr-14 font-mono text-sm text-[#333] outline-none focus:border-[#00C06B]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3]">
                {group.code.length}/{THIRD_PARTY_CODE_MAX_LENGTH}
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-[#333]">配料明细</div>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]"
            >
              <Plus size={14} className="mr-1.5" />
              新增配料
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#E8E8E8]">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs font-bold text-[#666]">
                <tr>
                  <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-3">排序</th>
                  <th className="border-b border-[#E8E8E8] px-4 py-3">
                    <span className="mr-1 text-[#FF4D4F]">*</span>配料名称
                  </th>
                  <th className="w-[260px] border-b border-[#E8E8E8] px-4 py-3">三方编码</th>
                  <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#333]">
                {group.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-[#F3F4F6]">
                    <td className="px-4 py-3 text-[#00A35B]">{index + 1}</td>
                    <td className="px-4 py-3">
                      <input
                        value={item.name}
                        onChange={event => updateItem(item.id, { name: event.target.value })}
                        placeholder="请输入配料名称"
                        className="h-[36px] w-full rounded-md border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#00C06B]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <input
                          value={item.thirdPartyCode || ''}
                          maxLength={THIRD_PARTY_CODE_MAX_LENGTH}
                          onChange={event => updateItem(item.id, { thirdPartyCode: event.target.value })}
                          placeholder="请输入三方编码"
                          className="h-[36px] w-full rounded-md border border-[#E5E7EB] px-3 pr-14 font-mono text-sm outline-none focus:border-[#00C06B]"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3]">
                          {(item.thirdPartyCode || '').length}/{THIRD_PARTY_CODE_MAX_LENGTH}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={group.items.length <= 1}
                        className="inline-flex items-center text-sm font-medium text-[#FF5A5F] hover:text-[#E5484D] disabled:cursor-not-allowed disabled:text-[#C0C4CC]"
                      >
                        <Trash2 size={14} className="mr-1" />
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex h-[64px] shrink-0 items-center justify-end gap-3 border-t border-[#E8E8E8] px-6">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#E5E7EB] px-5 py-2 text-sm font-bold text-[#667085] hover:bg-[#F7F8FA]">
            取消
          </button>
          <button
            type="button"
            disabled={!hasValidContent}
            onClick={() => onSave(group)}
            className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:bg-[#B7E8CC]"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
