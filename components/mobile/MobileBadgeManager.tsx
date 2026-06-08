import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, Circle, Coffee, Edit2, ImageIcon, Lock, Plus, Search, Trash2, X } from 'lucide-react';
import { MobileBadgeItem, StoreDataSource, VisualStyleType } from './productMeta';

interface Props {
  onBack: () => void;
  badges: MobileBadgeItem[];
  onChange: (badges: MobileBadgeItem[]) => void;
}

interface BadgeEditorState {
  item?: MobileBadgeItem;
  name: string;
  badgeType: VisualStyleType;
  backgroundColor: string;
  imageName?: string;
  startDate: string;
  endDate: string;
}

export const MobileBadgeManager: React.FC<Props> = ({ onBack, badges, onChange }) => {
  const [keyword, setKeyword] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<BadgeEditorState | null>(null);

  const filteredBadges = useMemo(() => {
    if (!keyword.trim()) return badges;
    return badges.filter(item => item.name.toLowerCase().includes(keyword.trim().toLowerCase()));
  }, [badges, keyword]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDelete = (badgeId: string, source: StoreDataSource) => {
    if (source === 'brand') return;
    if (!window.confirm('确认删除该角标吗？')) return;
    onChange(badges.filter(item => item.id !== badgeId));
  };

  const handleBatchDelete = () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`确认删除选中的 ${selectedIds.size} 个角标吗？`)) return;
    onChange(badges.filter(item => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setIsBatchMode(false);
  };

  const handleSave = () => {
    if (!editor) return;
    const nextName = editor.name.trim();
    if (!nextName) return;
    const nextBadge: MobileBadgeItem = {
      id: editor.item?.id || `badge_${Date.now()}`,
      name: nextName,
      badgeType: editor.badgeType,
      backgroundColor: editor.backgroundColor,
      imageName: editor.imageName,
      startDate: editor.startDate,
      endDate: editor.endDate,
      source: 'store',
    };
    if (editor.item) onChange(badges.map(item => item.id === editor.item?.id ? nextBadge : item));
    else onChange([nextBadge, ...badges]);
    setEditor(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
      <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24} /></button>
        <span className="font-bold text-base">角标管理</span>
        <div className="w-8"></div>
      </div>

      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A0B3]" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索角标"
            className="h-[40px] w-full rounded-xl bg-[#F5F6FA] pl-9 pr-3 text-sm font-medium outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24 bg-gray-50">
        {filteredBadges.map(item => {
          const isBrand = item.source === 'brand';
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => isBatchMode && !isBrand && toggleSelection(item.id)}
              className={`bg-white p-4 rounded-xl border transition-all shadow-sm ${isBatchMode && isSelected ? 'border-[#00C06B] ring-1 ring-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100'}`}
            >
              <div className="flex items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-800">{item.name}</span>
                    <SourceBadge source={item.source} />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {item.badgeType === 'image'
                      ? <ImageStylePreview name={item.imageName || item.name} />
                      : <span className="inline-flex rounded-full px-3 py-1 text-[12px] font-bold text-white" style={{ backgroundColor: item.backgroundColor }}>{item.name}</span>}
                    <span className="text-[11px] text-[#99A1B1]">{item.badgeType === 'image' ? '图片角标' : '文字角标'}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#99A1B1]">默认有效期：{item.startDate} 至 {item.endDate}</div>
                </div>
                {!isBatchMode ? (
                  isBrand ? (
                    <div className="ml-3 inline-flex items-center text-[11px] font-bold text-[#A0A6B7]">
                      <Lock size={12} className="mr-1" />
                      只读
                    </div>
                  ) : (
                    <div className="ml-3 flex items-center space-x-2">
                      <button onClick={() => setEditor({ item, name: item.name, badgeType: item.badgeType, backgroundColor: item.backgroundColor, imageName: item.imageName, startDate: item.startDate, endDate: item.endDate })} className="p-2 text-gray-400"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id, item.source)} className="p-2 text-gray-400"><Trash2 size={16} /></button>
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

      {isBatchMode ? (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-500">已选 {selectedIds.size} 项</span>
            <button onClick={() => setSelectedIds(selectedIds.size === filteredBadges.filter(item => item.source === 'store').length ? new Set() : new Set(filteredBadges.filter(item => item.source === 'store').map(item => item.id)))} className="text-xs font-bold text-[#00C06B]">全选</button>
          </div>
          <div className="flex gap-3">
            <button disabled={!selectedIds.size} onClick={handleBatchDelete} className={`flex-1 py-3.5 rounded-xl font-bold ${!selectedIds.size ? 'bg-gray-100 text-gray-300' : 'bg-red-50 text-red-500 border border-red-100'}`}>批量删除</button>
            <button onClick={() => setIsBatchMode(false)} className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-600 font-bold">取消</button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button onClick={() => setIsBatchMode(true)} className="flex flex-col items-center justify-center px-2 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 min-w-[72px]">
            <Coffee size={20} className="mb-1" />
            <span className="text-[10px] font-bold">批量管理</span>
          </button>
          <button onClick={() => setEditor({ name: '', badgeType: 'text', backgroundColor: '#00C06B', imageName: '', startDate: '2026-06-08', endDate: '2026-06-30' })} className="flex-1 py-2 bg-[#1F2129] text-white font-bold rounded-xl shadow-lg flex flex-col items-center justify-center">
            <Plus size={24} className="mb-0.5" />
            <span className="text-[10px]">新增角标</span>
          </button>
        </div>
      )}

      {editor && <BadgeEditorModal editor={editor} onClose={() => setEditor(null)} onSave={handleSave} onChange={setEditor} />}
    </div>
  );
};

const BadgeEditorModal = ({
  editor,
  onClose,
  onSave,
  onChange,
}: {
  editor: BadgeEditorState;
  onClose: () => void;
  onSave: () => void;
  onChange: React.Dispatch<React.SetStateAction<BadgeEditorState | null>>;
}) => (
  <div className="absolute inset-0 z-[200] flex flex-col justify-end bg-black/50 animate-in fade-in">
    <div className="flex-1" onClick={onClose}></div>
    <div className="bg-white rounded-t-[24px] p-5 pb-8 animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-gray-900">{editor.item ? '编辑角标' : '新增角标'}</h3>
        <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full text-gray-500"><X size={16} /></button>
      </div>
      <div className="mt-5 space-y-4">
        <Field label="角标名称">
          <input value={editor.name} onChange={e => onChange(prev => prev ? { ...prev, name: e.target.value.slice(0, 10) } : prev)} placeholder="请输入角标名称" className="h-[42px] w-full rounded-xl bg-gray-50 px-4 text-sm font-bold outline-none" />
        </Field>
        <Field label="角标类型">
          <div className="flex gap-2">
            {(['text', 'image'] as VisualStyleType[]).map(type => (
              <button key={type} onClick={() => onChange(prev => prev ? { ...prev, badgeType: type } : prev)} className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold ${editor.badgeType === type ? 'border-[#00C06B] bg-[#F3FCF7] text-[#00A35B]' : 'border-gray-200 text-gray-500'}`}>
                {type === 'text' ? '文字' : '图片'}
              </button>
            ))}
          </div>
        </Field>
        {editor.badgeType === 'text' ? (
          <Field label="背景颜色">
            <ColorPalette
              value={editor.backgroundColor}
              onChange={value => onChange(prev => prev ? { ...prev, backgroundColor: value } : prev)}
              colors={['#00C06B', '#FF8A00', '#7A5AF8', '#2F6FED', '#111827', '#E84C84']}
            />
          </Field>
        ) : (
          <Field label="角标图片">
            <ImageUploadPanel
              value={editor.imageName}
              onChange={value => onChange(prev => prev ? { ...prev, imageName: value } : prev)}
            />
          </Field>
        )}
        <Field label="有效期">
          <div className="grid grid-cols-[1fr_24px_1fr] gap-2">
            <input type="date" value={editor.startDate} onChange={e => onChange(prev => prev ? { ...prev, startDate: e.target.value } : prev)} className="h-[42px] rounded-xl bg-gray-50 px-3 text-sm font-bold outline-none" />
            <div className="flex items-center justify-center text-sm text-[#A0A6B7]">至</div>
            <input type="date" value={editor.endDate} onChange={e => onChange(prev => prev ? { ...prev, endDate: e.target.value } : prev)} className="h-[42px] rounded-xl bg-gray-50 px-3 text-sm font-bold outline-none" />
          </div>
        </Field>
        <Field label="预览">
          {editor.badgeType === 'image'
            ? <ImageStylePreview name={editor.imageName || editor.name || '角标图片'} />
            : <span className="inline-flex rounded-full px-3 py-1 text-[12px] font-bold text-white" style={{ backgroundColor: editor.backgroundColor }}>{editor.name || '角标'}</span>}
        </Field>
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">取消</button>
        <button onClick={onSave} className="flex-1 h-11 rounded-xl bg-[#00C06B] text-sm font-bold text-white">保存</button>
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
    ? <span className="inline-flex items-center rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-black text-orange-600 border border-orange-100"><Lock size={8} className="mr-0.5" />总部</span>
    : <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-black text-green-600 border border-green-100">自建</span>
);
