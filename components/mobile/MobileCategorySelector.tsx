import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Check, Plus, SearchCheck, ChevronRight, FolderPlus } from 'lucide-react';
import { MobileCategoryNode, STORE_CREATION_CATEGORIES } from './productMeta';

interface CategoryItem {
  id: string;
  name: string;
  parentName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: CategoryItem) => void;
  initialCategoryName?: string;
  productType?: 'standard' | 'combo';
}

export const MobileCategorySelector: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialCategoryName,
  productType = 'standard',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTree, setCategoryTree] = useState<MobileCategoryNode[]>(STORE_CREATION_CATEGORIES[productType]);
  const [activeParentId, setActiveParentId] = useState<string>(STORE_CREATION_CATEGORIES[productType][0]?.id || '');
  const [selectedId, setSelectedId] = useState<string>('');
  const [creatorState, setCreatorState] = useState<{ mode: 'parent' | 'child'; name: string } | null>(null);

  useEffect(() => {
    setCategoryTree(STORE_CREATION_CATEGORIES[productType]);
    setActiveParentId(STORE_CREATION_CATEGORIES[productType][0]?.id || '');
  }, [productType]);

  useEffect(() => {
    if (!initialCategoryName) return;
    const matched = flattenCategories(categoryTree).find(item => item.name === initialCategoryName || `${item.parentName}/${item.name}` === initialCategoryName);
    if (matched) {
      setSelectedId(matched.id);
      setActiveParentId(matched.parentName ? findParentId(categoryTree, matched.id) : matched.id);
    }
  }, [categoryTree, initialCategoryName]);

  const flatCategories = useMemo(() => flattenCategories(categoryTree), [categoryTree]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return flatCategories;
    return flatCategories.filter(cat => 
      `${cat.parentName || ''} ${cat.name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [flatCategories, searchQuery]);

  const activeParent = categoryTree.find(item => item.id === activeParentId) || categoryTree[0];
  const childOptions = activeParent?.children || [];

  const handleCreateCategory = () => {
    const nextName = creatorState?.name.trim();
    if (!creatorState || !nextName) return;
    if (creatorState.mode === 'parent') {
      const nextParentId = `store_parent_${Date.now()}`;
      const nextParent: MobileCategoryNode = {
        id: nextParentId,
        name: nextName,
        source: 'store',
        children: [],
      };
      setCategoryTree(prev => [...prev, nextParent]);
      setActiveParentId(nextParentId);
      setSelectedId(nextParentId);
    } else {
      const nextChildId = `store_child_${Date.now()}`;
      setCategoryTree(prev => prev.map(item => (
        item.id === activeParentId
          ? {
              ...item,
              children: [...(item.children || []), { id: nextChildId, name: nextName, source: 'store' }],
            }
          : item
      )));
      setSelectedId(nextChildId);
    }
    setCreatorState(null);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[200] flex flex-col justify-end bg-black/40 animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose}></div>

      <div className="bg-white rounded-t-[24px] flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300 relative overflow-hidden">
        <div className="h-[56px] border-b border-gray-100 flex items-center justify-between px-4 shrink-0 bg-white">
          <div className="text-[17px] font-black text-[#1F2129]">选择商品分类</div>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-4 py-3 shrink-0 bg-white space-y-3">
          <div className="relative flex items-center h-[40px] bg-[#F5F5F5] rounded-[8px] px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00C06B]/20 transition-all">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400 font-medium" 
              placeholder="搜索分类名称"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400">
                <X size={16} className="text-gray-300 fill-current" />
              </button>
            )}
          </div>
          {!searchQuery ? (
            <div className="flex gap-2">
              <button
                onClick={() => setCreatorState({ mode: 'parent', name: '' })}
                className="inline-flex h-[34px] items-center rounded-full bg-[#F5F6FA] px-3 text-[12px] font-bold text-[#333]"
              >
                <FolderPlus size={14} className="mr-1.5" />
                新增一级分类
              </button>
              <button
                onClick={() => setCreatorState({ mode: 'child', name: '' })}
                disabled={!activeParent}
                className="inline-flex h-[34px] items-center rounded-full bg-[#F5F6FA] px-3 text-[12px] font-bold text-[#333] disabled:opacity-40"
              >
                <Plus size={14} className="mr-1.5" />
                新增二级分类
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
          {filteredCategories.length > 0 ? (
            searchQuery ? (
              <div className="px-4 pb-6">
                {filteredCategories.map((cat, idx) => {
                  const isSelected = selectedId === cat.id;
                  return (
                    <div
                      key={`${cat.id}-${idx}`}
                      onClick={() => {
                        setSelectedId(cat.id);
                        const parentId = findParentId(categoryTree, cat.id);
                        if (parentId) setActiveParentId(parentId);
                      }}
                      className={`mb-3 min-h-[62px] rounded-2xl border px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'border-[#00C06B] bg-[#F3FCF7] text-[#00C06B]' : 'border-[#EEF1F5] bg-white text-[#333]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-[15px] font-bold">{cat.name}</div>
                          {cat.parentName ? <div className="mt-1 text-[11px] text-[#99A1B1]">{cat.parentName}</div> : null}
                        </div>
                        {isSelected && <Check size={20} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 pb-6 space-y-3">
                {categoryTree.map(parent => {
                  const isActive = activeParentId === parent.id;
                  const parentSelected = selectedId === parent.id;
                  const hasChildren = Boolean(parent.children?.length);
                  return (
                    <div
                      key={parent.id}
                      className={`overflow-hidden rounded-[20px] border transition-all ${isActive ? 'border-[#00C06B] bg-[#F7FDF9]' : 'border-[#EEF1F5] bg-white'}`}
                    >
                      <button
                        onClick={() => {
                          setActiveParentId(parent.id);
                          if (!hasChildren) setSelectedId(parent.id);
                        }}
                        className="flex w-full items-center justify-between px-4 py-4 text-left"
                      >
                        <div>
                          <div className={`text-[15px] font-black ${isActive ? 'text-[#00A35B]' : 'text-[#1F2129]'}`}>{parent.name}</div>
                          <div className="mt-1 text-[11px] text-[#99A1B1]">
                            {hasChildren ? '选择下方二级分类' : '当前分类可直接使用'}
                          </div>
                        </div>
                        {parentSelected && !hasChildren ? <Check size={18} className="text-[#00C06B]" /> : <ChevronRight size={16} className="text-[#C0C4CF]" />}
                      </button>
                      {hasChildren ? (
                        <div className="border-t border-[#EEF1F5] bg-[#FAFBFC] px-3 py-3">
                          <div className="grid grid-cols-2 gap-2">
                            {parent.children?.map(child => {
                              const childSelected = selectedId === child.id;
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => {
                                    setActiveParentId(parent.id);
                                    setSelectedId(child.id);
                                  }}
                                  className={`min-h-[48px] rounded-2xl border px-3 py-3 text-left text-[13px] font-bold transition-all ${childSelected ? 'border-[#00C06B] bg-[#F3FCF7] text-[#00A35B]' : 'border-[#E7EBF0] bg-white text-[#344054]'}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate">{child.name}</span>
                                    {childSelected ? <Check size={16} /> : null}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95">
              <div className="relative w-40 h-40 mb-2 flex items-center justify-center">
                 <div className="relative">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100/50">
                        <SearchCheck size={64} className="text-gray-200" strokeWidth={1}/>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 flex items-center">
                        <span className="text-[10px] font-bold text-gray-300">没有搜到分类</span>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-gray-100 shrink-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => {
              const cat = flatCategories.find(c => c.id === selectedId);
              if (cat) onSelect(cat);
            }}
            disabled={!selectedId}
            className="flex-1 h-[44px] rounded-[8px] bg-[#00C06B] text-white text-[16px] font-bold shadow-lg shadow-green-100 active:bg-[#00A35B] active:scale-[0.98] transition-all"
          >
            确认
          </button>
        </div>

        {creatorState && (
          <div className="absolute inset-0 z-[220] flex items-center justify-center bg-black/45 px-5">
            <div className="w-full rounded-[20px] bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="text-[18px] font-black text-[#1F2129]">
                  {creatorState.mode === 'parent' ? '新增一级分类' : '新增二级分类'}
                </div>
                <button onClick={() => setCreatorState(null)} className="rounded-full bg-[#F5F5F5] p-1.5 text-[#98A0B3]">
                  <X size={16} />
                </button>
              </div>
              {creatorState.mode === 'child' ? (
                <div className="mt-2 text-[12px] text-[#98A0B3]">将新增到“{activeParent?.name || '-'}”下</div>
              ) : null}
              <div className="mt-5">
                <input
                  autoFocus
                  value={creatorState.name}
                  onChange={e => setCreatorState(prev => prev ? { ...prev, name: e.target.value.slice(0, 10) } : prev)}
                  placeholder={creatorState.mode === 'parent' ? '请输入一级分类名称' : '请输入二级分类名称'}
                  className="h-[44px] w-full rounded-[12px] border border-[#E5E7EB] px-4 text-[15px] outline-none focus:border-[#00C06B]"
                />
                <div className="mt-2 text-right text-[11px] text-[#A0A6B7]">{creatorState.name.length}/10</div>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setCreatorState(null)} className="flex-1 h-[44px] rounded-[12px] border border-[#E5E7EB] text-[15px] font-bold text-[#5B6475]">取消</button>
                <button onClick={handleCreateCategory} className="flex-1 h-[44px] rounded-[12px] bg-[#00C06B] text-[15px] font-bold text-white disabled:opacity-40" disabled={!creatorState.name.trim()}>
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const flattenCategories = (categories: MobileCategoryNode[]) =>
  categories.flatMap(category => {
    const current = {
      id: category.id,
      name: category.name,
      parentName: undefined,
    };
    const children = (category.children || []).map(child => ({
      id: child.id,
      name: child.name,
      parentName: category.name,
    }));
    return [current, ...children];
  });

const findParentId = (categories: MobileCategoryNode[], targetId: string) => {
  const parent = categories.find(category => category.children?.some(child => child.id === targetId));
  return parent?.id || targetId;
};
