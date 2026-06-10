import React, { useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { MobileStallOption } from './productMeta';

interface Props {
  isOpen: boolean;
  options: MobileStallOption[];
  selectedIds: string[];
  onClose: () => void;
  onSave: (nextIds: string[]) => void;
}

export const MobileStallSelector: React.FC<Props> = ({
  isOpen,
  options,
  selectedIds,
  onClose,
  onSave,
}) => {
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraftIds(selectedIds);
      setKeyword('');
    }
  }, [isOpen, selectedIds]);

  const selectedOptions = useMemo(
    () => options.filter(item => draftIds.includes(item.id)),
    [draftIds, options]
  );

  const filteredOptions = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return options;
    return options.filter(item => item.name.toLowerCase().includes(query));
  }, [keyword, options]);

  const toggleDraft = (id: string) => {
    setDraftIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const removeDraft = (id: string) => {
    setDraftIds(prev => prev.filter(item => item !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[130] flex flex-col justify-end bg-black/50 animate-in fade-in">
      <div className="flex-1" onClick={onClose}></div>
      <div className="max-h-[80vh] rounded-t-[24px] bg-white p-4 pb-8 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between px-1">
          <div className="text-lg font-black text-[#1F2129]">选择关联档口</div>
          <button onClick={onClose} className="rounded-full bg-[#F5F5F5] p-1.5 text-[#98A0B3]">
            <X size={16} />
          </button>
        </div>
        <div className="mt-3 rounded-2xl bg-[#F7F9FC] p-4">
          <div className="flex items-center rounded-2xl border border-[#E5E7EB] bg-[#FAFBFC] px-3">
            <Search size={16} className="text-[#98A1B3]" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索档口名称"
              className="h-11 flex-1 bg-transparent px-2 text-sm font-medium text-[#1F2129] outline-none placeholder:text-[#B8BFCC]"
            />
            {keyword ? (
              <button onClick={() => setKeyword('')} className="rounded-full p-1 text-[#B8BFCC]">
                <X size={14} />
              </button>
            ) : null}
          </div>

          {selectedOptions.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedOptions.map(item => (
                <button
                  key={item.id}
                  onClick={() => removeDraft(item.id)}
                  className="inline-flex items-center rounded-full bg-[#F2F4F7] px-3 py-1.5 text-sm font-bold text-[#667085]"
                >
                  <span>{item.name}</span>
                  <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D0D5DD] text-white">
                    <X size={10} />
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 max-h-[42vh] overflow-y-auto no-scrollbar rounded-2xl bg-white py-2 shadow-sm">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => {
              const active = draftIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleDraft(option.id)}
                  className={`flex w-full items-center justify-between px-4 py-4 text-left transition-colors ${active ? 'bg-[#F5F3FF]' : 'bg-white'} ${option.id !== filteredOptions[filteredOptions.length - 1]?.id ? 'border-b border-[#F2F4F7]' : ''}`}
                >
                  <span className={`text-lg ${active ? 'font-black text-[#6E59FF]' : 'font-medium text-[#344054]'}`}>{option.name}</span>
                  {active ? <Check size={18} className="text-[#6E59FF]" /> : null}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center text-sm font-medium text-[#98A1B3]">未找到匹配的档口</div>
          )}
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#667085]">取消</button>
          <button
            onClick={() => onSave(draftIds)}
            className="flex-1 h-11 rounded-xl bg-[#00C06B] text-sm font-bold text-white"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
