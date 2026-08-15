import React, { useMemo, useState } from 'react';
import {
  Search,
  Download,
  Upload,
  Plus,
  ChevronDown,
  ChevronRight,
  Package2,
  ImageIcon,
  X,
  AlertTriangle,
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

type IngredientEditor =
  | { kind: 'group'; mode: 'create' | 'edit'; id?: string; name: string; code: string }
  | { kind: 'item'; mode: 'create' | 'edit'; id?: string; groupId: string; name: string }
  | { kind: 'material'; mode: 'create' | 'edit'; id?: string; name: string; imageStatus: '已上传' | '待上传' };

type DeleteTarget = { kind: 'group' | 'item' | 'material'; id: string; groupId?: string; name: string; blockedCount?: number };

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
  const [groups, setGroups] = useState<IngredientGroup[]>(MOCK_INGREDIENT_GROUPS);
  const [materials, setMaterials] = useState<MaterialItem[]>(MOCK_MATERIALS);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set(['group-1']));
  const [imageStatusFilter, setImageStatusFilter] = useState<'all' | '已上传' | '待上传'>('all');
  const [editor, setEditor] = useState<IngredientEditor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [message, setMessage] = useState('');

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedKeyword) return groups;

    return groups.reduce<IngredientGroup[]>((acc, group) => {
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
  }, [groups, normalizedKeyword]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(item => (!normalizedKeyword || item.name.toLowerCase().includes(normalizedKeyword)) && (imageStatusFilter === 'all' || item.imageStatus === imageStatusFilter));
  }, [imageStatusFilter, materials, normalizedKeyword]);

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

  const saveEditor = () => {
    if (!editor) return;
    if (editor.kind === 'group') {
      const name = editor.name.trim();
      if (!name) return;
      const nextGroup: IngredientGroup = { id: editor.id || `group-${Date.now()}`, name, code: editor.code.trim(), items: editor.mode === 'edit' ? groups.find(group => group.id === editor.id)?.items || [] : [] };
      setGroups(prev => editor.mode === 'edit' ? prev.map(group => group.id === editor.id ? nextGroup : group) : [nextGroup, ...prev]);
    } else if (editor.kind === 'item') {
      const name = editor.name.trim();
      if (!name || !editor.groupId) return;
      setGroups(prev => prev.map(group => group.id === editor.groupId ? {
        ...group,
        items: editor.mode === 'edit'
          ? group.items.map(item => item.id === editor.id ? { ...item, name } : item)
          : [{ id: `item-${Date.now()}`, name }, ...group.items],
      } : group));
      setExpandedGroupIds(prev => new Set([...prev, editor.groupId]));
    } else {
      const name = editor.name.trim();
      if (!name) return;
      const nextMaterial: MaterialItem = { id: editor.id || `material-${Date.now()}`, name, imageStatus: editor.imageStatus };
      setMaterials(prev => editor.mode === 'edit' ? prev.map(item => item.id === editor.id ? nextMaterial : item) : [nextMaterial, ...prev]);
    }
    setEditor(null);
    setMessage('保存成功');
  };

  const confirmDelete = () => {
    if (!deleteTarget || deleteTarget.blockedCount) return;
    if (deleteTarget.kind === 'group') setGroups(prev => prev.filter(group => group.id !== deleteTarget.id));
    if (deleteTarget.kind === 'item' && deleteTarget.groupId) setGroups(prev => prev.map(group => group.id === deleteTarget.groupId ? { ...group, items: group.items.filter(item => item.id !== deleteTarget.id) } : group));
    if (deleteTarget.kind === 'material') setMaterials(prev => prev.filter(item => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    setMessage('删除成功');
  };

  const exportIngredients = () => {
    const rows = [['分组名称', '分组编码', '配料名称'], ...groups.flatMap(group => group.items.length ? group.items.map(item => [group.name, group.code, item.name]) : [[group.name, group.code, '']])];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = '配料库.csv';
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`已导出 ${groups.reduce((count, group) => count + group.items.length, 0)} 条配料`);
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
                      <button type="button" onClick={() => setEditor({ kind: 'item', mode: 'create', groupId: group.id, name: '' })} className="text-[#00C06B] hover:text-[#00A35B]">新增配料</button>
                      <button type="button" onClick={() => setEditor({ kind: 'group', mode: 'edit', id: group.id, name: group.name, code: group.code })} className="text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                      <button type="button" onClick={() => setDeleteTarget({ kind: 'group', id: group.id, name: group.name, blockedCount: group.items.length || undefined })} className="text-[#FF5A5F] hover:text-[#E5484D]">删除</button>
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
                        <button type="button" onClick={() => setEditor({ kind: 'item', mode: 'edit', id: item.id, groupId: group.id, name: item.name })} className="text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                        <button type="button" onClick={() => setDeleteTarget({ kind: 'item', id: item.id, groupId: group.id, name: item.name })} className="text-[#FF5A5F] hover:text-[#E5484D]">删除</button>
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
                  <button type="button" onClick={() => setEditor({ kind: 'material', mode: 'edit', id: item.id, name: item.name, imageStatus: item.imageStatus })} className="text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                  <button type="button" onClick={() => setDeleteTarget({ kind: 'material', id: item.id, name: item.name })} className="text-[#FF5A5F] hover:text-[#E5484D]">删除</button>
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
      <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-sm">
        {message && <div className="flex items-center justify-between border-b border-[#B8DBFF] bg-[#F2F8FF] px-4 py-2 text-[12px] text-[#245B8A]"><span>{message}</span><button type="button" onClick={() => setMessage('')} aria-label="关闭提示"><X size={14} /></button></div>}
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
            {activeTab === 'material' && (
              <select value={imageStatusFilter} onChange={event => setImageStatusFilter(event.target.value as 'all' | '已上传' | '待上传')} className="h-[38px] rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#666] outline-none focus:border-[#00C06B]">
                <option value="all">图片状态 全部</option><option value="已上传">已上传</option><option value="待上传">待上传</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'ingredient' ? (
              <>
                <button
                  type="button"
                  onClick={exportIngredients}
                  className="inline-flex items-center rounded-lg border border-[#00C06B] bg-white px-4 py-2 text-sm font-medium text-[#00C06B] transition-colors hover:bg-[#F0FDF4]"
                >
                  <Download size={16} className="mr-2" />
                  配料导出
                </button>
                <button
                  type="button"
                  onClick={() => { setShowImport(true); setImportFileName(''); }}
                  className="inline-flex items-center rounded-lg border border-[#00C06B] bg-white px-4 py-2 text-sm font-medium text-[#00C06B] transition-colors hover:bg-[#F0FDF4]"
                >
                  <Upload size={16} className="mr-2" />
                  配料导入
                </button>
                <button
                  type="button"
                  onClick={() => setEditor({ kind: 'group', mode: 'create', name: '', code: '' })}
                  className="inline-flex items-center rounded-lg border border-[#00C06B] bg-white px-4 py-2 text-sm font-medium text-[#00C06B] transition-colors hover:bg-[#F0FDF4]"
                >
                  <Plus size={16} className="mr-2" />
                  新增分组
                </button>
                <button
                  type="button"
                  onClick={() => setEditor({ kind: 'item', mode: 'create', groupId: groups[0]?.id || '', name: '' })}
                  className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00A35B]"
                >
                  <Plus size={16} className="mr-2" />
                  新增配料
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditor({ kind: 'material', mode: 'create', name: '', imageStatus: '待上传' })}
                className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00A35B]"
              >
                <Plus size={16} className="mr-2" />
                添加
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center border-b border-[#F5F5F5] bg-[#FCFCFD] px-6 py-2 text-xs text-[#999]">
          <div className="flex items-center gap-2">
            {activeTab === 'ingredient' ? <Package2 size={14} /> : <ImageIcon size={14} />}
            <span>
              {activeTab === 'ingredient'
                ? `当前共 ${filteredGroups.length} 个配料分组，已展开 ${Array.from(expandedGroupIds).length} 个分组`
                : `当前共 ${filteredMaterials.length} 条原料记录`}
            </span>
          </div>
        </div>

        {activeTab === 'ingredient' ? renderIngredientTable() : renderMaterialTable()}

        {editor && <IngredientEditorModal draft={editor} groups={groups} onChange={setEditor} onCancel={() => setEditor(null)} onConfirm={saveEditor} />}
        {deleteTarget && <IngredientDeleteModal draft={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
        {showImport && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 p-6">
            <div className="w-full max-w-[560px] rounded-lg bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-5"><div><div className="text-[18px] font-bold text-[#333]">导入配料</div><div className="mt-1 text-xs text-[#999]">按分组编码识别现有分组，空白字段不覆盖原值。</div></div><button type="button" onClick={() => setShowImport(false)}><X size={18} /></button></div>
              <div className="p-6"><label className="flex h-[128px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#C9CDD4] hover:border-[#00C06B]"><Upload size={24} className="text-[#00C06B]" /><span className="mt-2 text-sm font-medium">{importFileName || '选择 Excel 或 CSV 文件'}</span><span className="mt-1 text-xs text-[#999]">支持分组名称、分组编码、配料名称</span><input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={event => setImportFileName(event.target.files?.[0]?.name || '')} /></label></div>
              <div className="flex items-center justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4"><button type="button" onClick={() => setShowImport(false)} className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm">取消</button><button type="button" disabled={!importFileName} onClick={() => { setShowImport(false); setMessage(`已提交“${importFileName}”校验，完成后可查看失败明细`); }} className="rounded-md bg-[#00C06B] px-4 py-2 text-sm font-medium text-white disabled:bg-[#BFC6CF]">开始校验</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const IngredientEditorModal = ({ draft, groups, onChange, onCancel, onConfirm }: { draft: IngredientEditor; groups: IngredientGroup[]; onChange: (draft: IngredientEditor) => void; onCancel: () => void; onConfirm: () => void }) => {
  const title = draft.kind === 'group' ? `${draft.mode === 'create' ? '新增' : '编辑'}配料分组` : draft.kind === 'item' ? `${draft.mode === 'create' ? '新增' : '编辑'}配料` : `${draft.mode === 'create' ? '添加' : '编辑'}原料`;
  const patchDraft = (patch: Record<string, unknown>) => onChange({ ...draft, ...patch } as IngredientEditor);
  const canSave = draft.name.trim() && (draft.kind !== 'item' || draft.groupId);
  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-[560px] rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-5"><div className="text-[18px] font-bold text-[#333]">{title}</div><button type="button" onClick={onCancel} aria-label="关闭"><X size={18} /></button></div>
        <div className="space-y-5 px-6 py-5">
          {draft.kind === 'item' && <label className="block"><span className="mb-2 block text-sm text-[#333]"><b className="mr-1 text-red-500">*</b>所属分组</span><select value={draft.groupId} onChange={event => patchDraft({ groupId: event.target.value })} className="h-10 w-full rounded-md border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#00C06B]">{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>}
          <label className="block"><span className="mb-2 block text-sm text-[#333]"><b className="mr-1 text-red-500">*</b>{draft.kind === 'group' ? '分组名称' : draft.kind === 'item' ? '配料名称' : '原料名称'}</span><input value={draft.name} maxLength={40} onChange={event => patchDraft({ name: event.target.value })} className="h-10 w-full rounded-md border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#00C06B]" placeholder="请输入名称" /></label>
          {draft.kind === 'group' && <label className="block"><span className="mb-2 block text-sm text-[#333]">分组编码</span><input value={draft.code} maxLength={20} onChange={event => patchDraft({ code: event.target.value })} className="h-10 w-full rounded-md border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#00C06B]" placeholder="用于导入识别，可不填" /></label>}
          {draft.kind === 'material' && <label className="block"><span className="mb-2 block text-sm text-[#333]">原料展示图</span><select value={draft.imageStatus} onChange={event => patchDraft({ imageStatus: event.target.value })} className="h-10 w-full rounded-md border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#00C06B]"><option value="待上传">待上传</option><option value="已上传">已上传</option></select><span className="mt-1 block text-xs text-[#999]">高保真原型以状态模拟素材库上传；生产实现接入统一素材选择器。</span></label>}
        </div>
        <div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4"><button type="button" onClick={onCancel} className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm">取消</button><button type="button" disabled={!canSave} onClick={onConfirm} className="rounded-md bg-[#00C06B] px-4 py-2 text-sm font-medium text-white disabled:bg-[#BFC6CF]">保存</button></div>
      </div>
    </div>
  );
};

const IngredientDeleteModal = ({ draft, onCancel, onConfirm }: { draft: DeleteTarget; onCancel: () => void; onConfirm: () => void }) => {
  const blocked = Boolean(draft.blockedCount);
  return (
    <div className="fixed inset-0 z-[97] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-[480px] rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-5"><div className="text-[18px] font-bold text-[#333]">{blocked ? '暂时无法删除' : '确认删除'}</div><button type="button" onClick={onCancel}><X size={18} /></button></div>
        <div className="p-6"><div className={`flex items-start gap-3 rounded-lg border px-4 py-4 text-sm leading-6 ${blocked ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-100 bg-red-50 text-red-700'}`}><AlertTriangle size={18} className="mt-1 shrink-0" /><span>{blocked ? `“${draft.name}”下仍有 ${draft.blockedCount} 条配料，请先移动或删除配料后再删除分组。` : `删除“${draft.name}”后不可恢复。若生产数据存在商品配方引用，服务端仍需再次校验并阻止删除。`}</span></div></div>
        <div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4"><button type="button" onClick={onCancel} className="rounded-md border border-[#E5E7EB] px-4 py-2 text-sm">{blocked ? '我知道了' : '取消'}</button>{!blocked && <button type="button" onClick={onConfirm} className="rounded-md bg-[#E5484D] px-4 py-2 text-sm font-medium text-white">删除</button>}</div>
      </div>
    </div>
  );
};
