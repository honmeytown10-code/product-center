
import React, { useState } from 'react';
import { ChevronLeft, Info, GripVertical, Check, HelpCircle, X } from 'lucide-react';

interface AttributeItem {
  id: string;
  name: string;
  isDefault: boolean;
}

interface AttributeGroup {
  id: string;
  name: string;
  type: 'method' | 'spec' | 'addon';
  items: AttributeItem[];
}

interface Props {
  onBack: () => void;
  onSave: (groups: AttributeGroup[]) => void;
}

const INITIAL_GROUPS: AttributeGroup[] = [
  {
    id: 'g1',
    name: '0910 做法-3',
    type: 'method',
    items: [
      { id: 'v1', name: '中杯', isDefault: false },
      { id: 'v2', name: '霸王杯', isDefault: true },
    ]
  },
  {
    id: 'g2',
    name: '蛋糕A',
    type: 'spec',
    items: [
      { id: 'v3', name: '4寸A', isDefault: true },
      { id: 'v4', name: '6寸A', isDefault: false },
    ]
  },
  {
    id: 'g3',
    name: '0119加料-10',
    type: 'addon',
    items: [
      { id: 'v5', name: '0119-鸭', isDefault: false },
      { id: 'v6', name: '0119-鹅', isDefault: false },
      { id: 'v7', name: '0119-猫', isDefault: false },
      { id: 'v8', name: '0119-狗', isDefault: false },
    ]
  }
];

export const MobileProductAttributeSorter: React.FC<Props> = ({ onBack, onSave }) => {
  const [groups, setGroups] = useState<AttributeGroup[]>(INITIAL_GROUPS);
  const [customSorting, setCustomSorting] = useState(true);
  
  // Drag and Drop States
  const [draggedGroupIdx, setDraggedGroupIdx] = useState<number | null>(null);
  const [draggedItemInfo, setDraggedItemInfo] = useState<{ groupIdx: number, itemIdx: number } | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ type: 'group' | 'item', index: number, groupId?: string } | null>(null);

  const toggleDefault = (groupId: string, itemId: string) => {
    if (customSorting) return; // Disable selection when sorting
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        items: g.items.map(item => ({
          ...item,
          isDefault: item.id === itemId ? !item.isDefault : (g.type === 'spec' ? false : item.isDefault)
        }))
      };
    }));
  };

  const getBadgeStyle = (type: AttributeGroup['type']) => {
    switch (type) {
      case 'method': return 'bg-green-50 text-green-500 border-green-100';
      case 'spec': return 'bg-blue-50 text-blue-500 border-blue-100';
      case 'addon': return 'bg-teal-50 text-teal-500 border-teal-100';
    }
  };

  const getTypeText = (type: AttributeGroup['type']) => {
    switch (type) {
      case 'method': return '做法';
      case 'spec': return '规格';
      case 'addon': return '加料';
    }
  };

  // --- Group Drag Handlers ---
  const handleGroupDragStart = (e: React.DragEvent, index: number) => {
    setDraggedGroupIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    // Set a dummy image to hide the default preview if desired, or just let it be
  };

  const handleGroupDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemInfo) return; // Only allow group sorting when not dragging an item
    setDropIndicator({ type: 'group', index });
  };

  const handleGroupDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (draggedGroupIdx === null || draggedGroupIdx === toIdx) {
      setDropIndicator(null);
      return;
    }
    const next = [...groups];
    const [moved] = next.splice(draggedGroupIdx, 1);
    next.splice(toIdx, 0, moved);
    setGroups(next);
    setDraggedGroupIdx(null);
    setDropIndicator(null);
  };

  // --- Item Drag Handlers ---
  const handleItemDragStart = (e: React.DragEvent, groupIdx: number, itemIdx: number) => {
    e.stopPropagation(); // Prevent group drag start
    setDraggedItemInfo({ groupIdx, itemIdx });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragOver = (e: React.DragEvent, groupIdx: number, itemIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItemInfo || draggedItemInfo.groupIdx !== groupIdx) return; // Only sort within same group
    setDropIndicator({ type: 'item', index: itemIdx, groupId: groups[groupIdx].id });
  };

  const handleItemDrop = (e: React.DragEvent, groupIdx: number, toIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItemInfo || draggedItemInfo.groupIdx !== groupIdx || draggedItemInfo.itemIdx === toIdx) {
      setDropIndicator(null);
      setDraggedItemInfo(null);
      return;
    }

    const next = [...groups];
    const group = { ...next[groupIdx] };
    const items = [...group.items];
    const [moved] = items.splice(draggedItemInfo.itemIdx, 1);
    items.splice(toIdx, 0, moved);
    group.items = items;
    next[groupIdx] = group;
    
    setGroups(next);
    setDraggedItemInfo(null);
    setDropIndicator(null);
  };

  return (
    <div className="absolute inset-0 z-[150] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 shadow-sm relative z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 active:text-black">
          <ChevronLeft size={24} />
        </button>
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">商品属性排序</span>
      </div>

      {/* Top Description & Toggle */}
      <div className="bg-white px-5 py-4 space-y-4 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-[13px] font-bold text-gray-700">
            自定义属性组排序 
            <HelpCircle size={14} className="ml-1 text-gray-400" />
          </div>
          <div 
            onClick={() => setCustomSorting(!customSorting)}
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${customSorting ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${customSorting ? 'left-6' : 'left-1'}`}></div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-3 flex items-start">
          <div className="text-[11px] text-gray-400 leading-relaxed font-medium">
            标 <span className="inline-block w-2.5 h-2.5 bg-[#00C06B] rounded-sm align-middle mx-0.5"></span> 为默认属性，可自定义设置默认规格；规格需必选默认值
          </div>
        </div>
      </div>

      {/* Attribute Groups List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24">
        {groups.map((group, groupIdx) => (
          <div 
            key={group.id} 
            draggable={customSorting && draggedItemInfo === null}
            onDragStart={(e) => handleGroupDragStart(e, groupIdx)}
            onDragOver={(e) => handleGroupDragOver(e, groupIdx)}
            onDrop={(e) => handleGroupDrop(e, groupIdx)}
            className={`
              bg-white rounded-2xl p-5 shadow-sm border-2 transition-all relative group
              ${dropIndicator?.type === 'group' && dropIndicator.index === groupIdx ? 'border-dashed border-[#00C06B]' : 'border-white'}
              ${draggedGroupIdx === groupIdx ? 'opacity-40 grayscale scale-95' : ''}
            `}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <span className="font-black text-base text-gray-800">{group.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getBadgeStyle(group.type)}`}>
                  {getTypeText(group.type)}
                </span>
              </div>
              {customSorting && (
                <div className="p-2 text-gray-300 cursor-grab active:cursor-grabbing">
                  <GripVertical size={18} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {group.items.map((item, itemIdx) => {
                const isDragTarget = dropIndicator?.type === 'item' && dropIndicator.groupId === group.id && dropIndicator.index === itemIdx;
                const isDragging = draggedItemInfo?.groupIdx === groupIdx && draggedItemInfo.itemIdx === itemIdx;

                return (
                  <div 
                    key={item.id}
                    draggable={customSorting}
                    onDragStart={(e) => handleItemDragStart(e, groupIdx, itemIdx)}
                    onDragOver={(e) => handleItemDragOver(e, groupIdx, itemIdx)}
                    onDrop={(e) => handleItemDrop(e, groupIdx, itemIdx)}
                    onClick={() => toggleDefault(group.id, item.id)}
                    className={`
                      px-4 py-2.5 rounded-xl border flex items-center transition-all min-w-[80px] select-none
                      ${customSorting ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                      ${item.isDefault ? 'bg-[#F0FDF4] border-[#DCFCE7]' : 'bg-gray-50 border-transparent'}
                      ${isDragTarget ? 'ring-2 ring-[#00C06B] ring-dashed scale-105' : ''}
                      ${isDragging ? 'opacity-20 border-dashed border-gray-400' : ''}
                      active:scale-95 transition-transform
                    `}
                  >
                    <div className={`w-3.5 h-3.5 rounded-sm mr-2 flex items-center justify-center transition-colors ${item.isDefault ? 'bg-[#00C06B]' : 'bg-white border border-gray-200'}`}>
                      {item.isDefault && <Check size={10} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`text-sm font-bold ${item.isDefault ? 'text-[#00C06B]' : 'text-gray-600'}`}>
                      {item.name}
                    </span>
                    {customSorting && (
                       <GripVertical size={12} className="ml-2 text-gray-300 opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="py-20 text-center text-gray-300">
             <Info size={40} className="mx-auto mb-2 opacity-20" />
             <p className="text-xs font-bold">暂无属性数据</p>
          </div>
        )}
      </div>

      {/* Footer Save Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <button 
          onClick={() => { onSave(groups); onBack(); }}
          className="w-full h-12 bg-[#1F2129] text-white rounded-xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all"
        >
          保存排序设置
        </button>
      </div>
    </div>
  );
};
