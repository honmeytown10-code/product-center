import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, Circle, Edit2, ImageIcon, Lock, Plus, Search, Settings2, Tags, Trash2, X } from 'lucide-react';
import { MobileLabelGroup, MobileLabelItem, StoreDataSource, VisualStyleType } from './productMeta';

interface Props {
  onBack: () => void;
  groups: MobileLabelGroup[];
  onChange: (groups: MobileLabelGroup[]) => void;
}

type LabelEditorState =
  | { mode: 'group_create' | 'group_edit'; group?: MobileLabelGroup; name: string }
  | {
      mode: 'label_create' | 'label_edit';
      groupId: string;
      item?: MobileLabelItem;
      name: string;
      styleType: VisualStyleType;
      backgroundColor: string;
      textColor: string;
      imageName?: string;
    };

export const MobileLabelManager: React.FC<Props> = ({ onBack, groups, onChange }) => {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [keyword, setKeyword] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<LabelEditorState | null>(null);
  const [showGroupManager, setShowGroupManager] = useState(false);

  const activeGroup = useMemo(
    () => groups.find(group => group.id === selectedGroupId) || groups[0],
    [groups, selectedGroupId]
  );
  const filteredItems = useMemo(() => {
    if (!activeGroup) return [];
    if (!keyword.trim()) return activeGroup.items;
    return activeGroup.items.filter(item => item.name.toLowerCase().includes(keyword.trim().toLowerCase()));
  }, [activeGroup, keyword]);
  const isBrandGroup = activeGroup?.source === 'brand';

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteItem = (itemId: string) => {
    if (isBrandGroup) return;
    if (!window.confirm('确认删除该标签吗？')) return;
    onChange(groups.map(group => (
      group.id === activeGroup.id
        ? { ...group, items: group.items.filter(item => item.id !== itemId) }
        : group
    )));
  };

  const handleBatchDelete = () => {
    if (isBrandGroup || !selectedIds.size) return;
    if (!window.confirm(`确认删除选中的 ${selectedIds.size} 个标签吗？`)) return;
    onChange(groups.map(group => (
      group.id === activeGroup.id
        ? { ...group, items: group.items.filter(item => !selectedIds.has(item.id)) }
        : group
    )));
    setSelectedIds(new Set());
    setIsBatchMode(false);
  };

  const handleSave = () => {
    if (!editor) return;
    if (editor.mode === 'group_create' || editor.mode === 'group_edit') {
      const nextName = editor.name.trim();
      if (!nextName) return;
      if (editor.mode === 'group_create') {
        const nextGroup: MobileLabelGroup = { id: `label_group_${Date.now()}`, name: nextName, source: 'store', items: [] };
        onChange([...groups, nextGroup]);
        setSelectedGroupId(nextGroup.id);
      } else if (editor.group) {
        onChange(groups.map(group => group.id === editor.group?.id ? { ...group, name: nextName } : group));
      }
      setEditor(null);
      return;
    }

    const nextName = editor.name.trim();
    if (!nextName) return;
    const nextItem: MobileLabelItem = {
      id: editor.item?.id || `label_${Date.now()}`,
      name: nextName,
      styleType: editor.styleType,
      backgroundColor: editor.backgroundColor,
      textColor: editor.textColor,
      imageName: editor.imageName,
      source: 'store',
    };
    onChange(groups.map(group => {
      if (group.id !== editor.groupId) return group;
      if (editor.mode === 'label_edit' && editor.item) {
        return { ...group, items: group.items.map(item => item.id === editor.item?.id ? nextItem : item) };
      }
      return { ...group, items: [...group.items, nextItem] };
    }));
    setEditor(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
      <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24} /></button>
        <span className="font-bold text-base">描述标签</span>
        <div className="w-8"></div>
      </div>

      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A0B3]" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索标签"
            className="h-[40px] w-full rounded-xl bg-[#F5F6FA] pl-9 pr-3 text-sm font-medium outline-none"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-24 bg-[#F8FAFB] overflow-y-auto no-scrollbar border-r border-gray-100 shrink-0">
          {groups.map(group => (
            <div
              key={group.id}
              onClick={() => {
                setSelectedGroupId(group.id);
                setSelectedIds(new Set());
                setIsBatchMode(false);
              }}
              className={`px-2 py-5 text-center text-[12px] font-bold border-l-4 transition-all ${selectedGroupId === group.id ? 'bg-white text-[#00C06B] border-[#00C06B]' : 'text-[#5B6475] border-transparent'}`}
            >
              <div className="truncate">{group.name}</div>
              <div className="mt-1 text-[10px] text-[#A0A6B7]">{group.items.length} 个</div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24 bg-gray-50">
          {activeGroup && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeGroup.name}</span>
                <SourceBadge source={activeGroup.source} />
              </div>
              <span className="text-[10px] text-gray-400 font-bold bg-gray-200/50 px-2 py-0.5 rounded-full">共 {filteredItems.length} 项</span>
            </div>
          )}

          {filteredItems.map(item => {
            const isSelected = selectedIds.has(item.id);
            const isBrand = item.source === 'brand';
            return (
              <div
                key={item.id}
                onClick={() => isBatchMode && toggleSelection(item.id)}
                className={`bg-white p-4 rounded-xl border transition-all shadow-sm ${isBatchMode && isSelected ? 'border-[#00C06B] ring-1 ring-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100'}`}
              >
                <div className="flex items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-800">{item.name}</span>
                    </div>
                    <div className="mt-2">
                      {item.styleType === 'image'
                        ? <ImageStylePreview name={item.imageName || item.name} />
                        : (
                          <span
                            className="inline-flex rounded-full px-3 py-1 text-[12px] font-bold"
                            style={{ backgroundColor: item.backgroundColor, color: item.textColor }}
                          >
                            {item.name}
                          </span>
                        )}
                    </div>
                  </div>

                  {!isBatchMode ? (
                    isBrand ? null : (
                      <div className="ml-3 flex items-center space-x-2">
                        <button
                          onClick={() => setEditor({
                            mode: 'label_edit',
                            groupId: activeGroup.id,
                            item,
                            name: item.name,
                            styleType: item.styleType,
                            backgroundColor: item.backgroundColor,
                            textColor: item.textColor,
                            imageName: item.imageName,
                          })}
                          className="p-2 text-gray-400"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-gray-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="ml-3">{isSelected ? <CheckCircle2 className="text-[#00C06B]" size={20} fill="currentColor" color="white" /> : <Circle className="text-gray-300" size={20} />}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isBatchMode ? (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-500">已选 {selectedIds.size} 项</span>
            <button onClick={() => setSelectedIds(selectedIds.size === filteredItems.length ? new Set() : new Set(filteredItems.filter(item => item.source === 'store').map(item => item.id)))} className="text-xs font-bold text-[#00C06B]">全选</button>
          </div>
          <div className="flex gap-3">
            <button disabled={isBrandGroup || !selectedIds.size} onClick={handleBatchDelete} className={`flex-1 py-3.5 rounded-xl font-bold ${isBrandGroup || !selectedIds.size ? 'bg-gray-100 text-gray-300' : 'bg-red-50 text-red-500 border border-red-100'}`}>批量删除</button>
            <button onClick={() => setIsBatchMode(false)} className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-600 font-bold">取消</button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button onClick={() => setIsBatchMode(true)} className="flex flex-col items-center justify-center px-2 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 min-w-[72px]">
            <Tags size={20} className="mb-1" />
            <span className="text-[10px] font-bold">批量管理</span>
          </button>
          <button onClick={() => setShowGroupManager(true)} className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl flex flex-col items-center justify-center">
            <Settings2 size={22} className="mb-0.5" />
            <span className="text-[10px]">标签组管理</span>
          </button>
          <button
            disabled={isBrandGroup}
            onClick={() => activeGroup && setEditor({ mode: 'label_create', groupId: activeGroup.id, name: '', styleType: 'text', backgroundColor: '#EAF8EF', textColor: '#00A35B', imageName: '' })}
            className={`flex-1 py-2 bg-[#1F2129] text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center ${isBrandGroup ? 'opacity-30' : ''}`}
          >
            <Plus size={24} className="mb-0.5" />
            <span className="text-[10px]">{isBrandGroup ? '总部禁用新增' : '新增标签'}</span>
          </button>
        </div>
      )}

      {showGroupManager && (
        <GroupManagerPage
          groups={groups}
          onBack={() => setShowGroupManager(false)}
          onChange={onChange}
          onEdit={group => setEditor({ mode: 'group_edit', group, name: group.name })}
          onCreate={() => setEditor({ mode: 'group_create', name: '' })}
        />
      )}

      {editor && (
        <EditorModal editor={editor} onClose={() => setEditor(null)} onSave={handleSave} onChange={setEditor} />
      )}
    </div>
  );
};

const GroupManagerPage = ({
  groups,
  onBack,
  onChange,
  onEdit,
  onCreate,
}: {
  groups: MobileLabelGroup[];
  onBack: () => void;
  onChange: (groups: MobileLabelGroup[]) => void;
  onEdit: (group: MobileLabelGroup) => void;
  onCreate: () => void;
}) => (
  <div className="absolute inset-0 z-[150] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
    <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
      <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24} /></button>
      <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">标签组管理</span>
    </div>
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
      {groups.map(group => {
        const isBrand = group.source === 'brand';
        return (
          <div key={group.id} className={`flex items-center justify-between p-4 rounded-2xl border ${isBrand ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div>
              <div className="flex items-center">
                <span className={`font-black text-sm ${isBrand ? 'text-gray-500' : 'text-gray-800'}`}>{group.name}</span>
                <SourceBadge source={group.source} />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">包含 {group.items.length} 个标签</div>
            </div>
            {!isBrand ? (
              <div className="flex items-center space-x-2">
                <button onClick={() => onEdit(group)} className="p-2 text-gray-400"><Edit2 size={16} /></button>
                <button onClick={() => {
                  if (!window.confirm('确认删除该标签分组吗？')) return;
                  onChange(groups.filter(item => item.id !== group.id));
                }} className="p-2 text-gray-400"><Trash2 size={16} /></button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
    <div className="p-4 pb-8 bg-white border-t border-gray-100">
      <button onClick={onCreate} className="w-full h-12 bg-[#1F2129] text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center">
        <Plus size={18} className="mr-2" /> 新增标签分组
      </button>
    </div>
  </div>
);

const EditorModal = ({
  editor,
  onClose,
  onSave,
  onChange,
}: {
  editor: LabelEditorState;
  onClose: () => void;
  onSave: () => void;
  onChange: React.Dispatch<React.SetStateAction<LabelEditorState | null>>;
}) => (
  <div className="absolute inset-0 z-[200] flex flex-col justify-end bg-black/50 animate-in fade-in">
    <div className="flex-1" onClick={onClose}></div>
    <div className="bg-white rounded-t-[24px] p-5 pb-8 animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-gray-900">
          {editor.mode === 'group_create' ? '新增标签分组' : editor.mode === 'group_edit' ? '编辑标签分组' : editor.mode === 'label_create' ? '新增标签' : '编辑标签'}
        </h3>
        <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full text-gray-500"><X size={16} /></button>
      </div>
      <div className="mt-5 space-y-4">
        <Field label={editor.mode.includes('group') ? '标签分组名称' : '标签名称'}>
          <input
            value={editor.name}
            onChange={e => onChange(prev => prev ? { ...prev, name: e.target.value.slice(0, 10) } : prev)}
            placeholder={editor.mode.includes('group') ? '请输入标签分组名称' : '请输入标签名称'}
            className="h-[42px] w-full rounded-xl bg-gray-50 px-4 text-sm font-bold outline-none"
          />
        </Field>
        {!editor.mode.includes('group') && (
          <>
            <Field label="标签样式">
              <div className="flex gap-2">
                {(['text', 'image'] as VisualStyleType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => onChange(prev => prev && !prev.mode.includes('group') ? { ...prev, styleType: type } : prev)}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${editor.styleType === type ? 'border-[#00C06B] bg-[#F3FCF7] text-[#00A35B]' : 'border-gray-200 text-gray-500'}`}
                  >
                    {type === 'text' ? '文字' : '图片'}
                  </button>
                ))}
              </div>
            </Field>
            {editor.styleType === 'text' ? (
              <>
                <Field label="背景颜色">
                  <ColorPalette
                    value={editor.backgroundColor}
                    onChange={value => onChange(prev => prev && !prev.mode.includes('group') ? { ...prev, backgroundColor: value } : prev)}
                    colors={['#00C06B', '#FF8A00', '#7A5AF8', '#2F6FED', '#111827', '#E84C84']}
                  />
                </Field>
                <Field label="字体颜色">
                  <ColorPalette
                    value={editor.textColor}
                    onChange={value => onChange(prev => prev && !prev.mode.includes('group') ? { ...prev, textColor: value } : prev)}
                    colors={['#FFFFFF', '#111827', '#00A35B', '#B54708', '#7A5AF8', '#2F6FED']}
                  />
                </Field>
              </>
            ) : (
              <Field label="标签图片">
                <ImageUploadPanel
                  value={editor.imageName}
                  onChange={value => onChange(prev => prev && !prev.mode.includes('group') ? { ...prev, imageName: value } : prev)}
                />
              </Field>
            )}
            <Field label="标签预览">
              {editor.styleType === 'image'
                ? <ImageStylePreview name={editor.imageName || editor.name || '标签图片'} />
                : <span className="inline-flex rounded-full px-3 py-1 text-[12px] font-bold" style={{ backgroundColor: editor.backgroundColor, color: editor.textColor }}>{editor.name || '标签'}</span>}
            </Field>
          </>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">取消</button>
        <button onClick={onSave} className="flex-1 h-11 rounded-xl bg-[#00C06B] text-sm font-bold text-white">确定</button>
      </div>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="text-[12px] font-bold text-gray-500">{label}</div>
    {children}
  </div>
);

const ColorPalette = ({ value, onChange, colors }: { value: string; onChange: (value: string) => void; colors: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {colors.map(color => {
      const active = value.toLowerCase() === color.toLowerCase();
      return (
        <button key={color} onClick={() => onChange(color)} className={`relative h-10 w-10 rounded-2xl border-2 ${active ? 'border-[#111827]' : 'border-white'}`} style={{ backgroundColor: color }}>
          {active ? <CheckCircle2 size={16} className="absolute inset-0 m-auto text-white" fill="currentColor" color="white" /> : null}
        </button>
      );
    })}
    <input value={value} onChange={e => onChange(e.target.value)} className="h-[42px] min-w-0 flex-1 rounded-xl bg-gray-50 px-4 text-sm font-bold outline-none" />
  </div>
);

const ImageUploadPanel = ({ value, onChange }: { value?: string; onChange: (value: string) => void }) => (
  <div className="rounded-2xl border border-dashed border-[#D5DAE1] bg-[#FAFBFC] p-3">
    <div className="flex items-center justify-between gap-3">
      {value ? <ImageStylePreview name={value} /> : <div className="text-[12px] text-[#99A1B1]">上传后展示图片样式</div>}
      <div className="flex gap-2">
        <button onClick={() => onChange('拍照上传图')} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#333] shadow-sm">拍照</button>
        <button onClick={() => onChange('相册图片')} className="rounded-full bg-[#1F2129] px-3 py-1.5 text-[11px] font-bold text-white">相册</button>
      </div>
    </div>
  </div>
);

const ImageStylePreview = ({ name }: { name: string }) => (
  <div className="inline-flex items-center rounded-xl border border-[#DCE3EC] bg-white px-2.5 py-2">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#64748B]">
      <ImageIcon size={16} />
    </div>
    <div className="ml-2">
      <div className="text-[12px] font-bold text-[#1F2129]">{name}</div>
      <div className="text-[10px] text-[#99A1B1]">图片样式</div>
    </div>
  </div>
);

const SourceBadge = ({ source }: { source: StoreDataSource }) => (
  source === 'brand'
    ? <span className="ml-2 inline-flex items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-black text-orange-600 border border-orange-100"><Lock size={8} className="mr-0.5" />总部</span>
    : <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-black text-green-600 border border-green-100">自建</span>
);
