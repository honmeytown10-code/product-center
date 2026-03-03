
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, Plus, ChevronRight, Scale, X, Trash2, Edit2, Info, Lock, 
  Check, CheckSquare, Settings2, Trash, CheckCircle2, Circle, Search, Minus
} from 'lucide-react';
import { LocalSpec } from './types';

const INITIAL_LOCAL_SPECS: LocalSpec[] = [
  { id: 's1', name: '容量', source: 'brand', values: ['中杯', '大杯', '超大杯'] },
  { id: 's2', name: '辣度', source: 'brand', values: ['不辣', '微辣', '中辣', '特辣'] },
  { id: 's3', name: '牛排熟度', source: 'brand', values: ['三分熟', '五分熟', '七分熟', '全熟'] },
  { id: 's_store_1', name: '甜品份量', source: 'store', values: ['单人份', '双人份'] },
];

interface Props {
  onBack: () => void;
}

export const MobileSpecManager: React.FC<Props> = ({ onBack }) => {
  const [localSpecs, setLocalSpecs] = useState<LocalSpec[]>(INITIAL_LOCAL_SPECS);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(INITIAL_LOCAL_SPECS[0].id);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Page/Modal States
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [valueModal, setValueModal] = useState<{ show: boolean, index: number, text: string } | null>(null);

  const activeGroup = useMemo(() => 
    localSpecs.find(s => s.id === selectedGroupId) || localSpecs[0]
  , [localSpecs, selectedGroupId]);

  const isHQ = activeGroup.source === 'brand';

  const handleToggleSelection = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  const handleBatchDelete = () => {
    if (isHQ) return;
    if (confirm(`确认删除选中的 ${selectedIndices.size} 个规格值吗？`)) {
      setLocalSpecs(prev => prev.map(s => {
        if (s.id !== selectedGroupId) return s;
        return {
          ...s,
          values: s.values.filter((_, idx) => !selectedIndices.has(idx))
        };
      }));
      setIsBatchMode(false);
      setSelectedIndices(new Set());
    }
  };

  const handleSaveValue = (text: string) => {
    if (!text.trim()) return;
    setLocalSpecs(prev => prev.map(s => {
      if (s.id !== selectedGroupId) return s;
      const nextValues = [...s.values];
      if (valueModal && valueModal.index !== -1) {
        nextValues[valueModal.index] = text.trim();
      } else {
        nextValues.push(text.trim());
      }
      return { ...s, values: nextValues };
    }));
    setValueModal(null);
  };

  const handleDeleteValue = (idx: number) => {
    if (confirm('确认删除此规格值吗？')) {
      setLocalSpecs(prev => prev.map(s => {
        if (s.id !== selectedGroupId) return s;
        return { ...s, values: s.values.filter((_, i) => i !== idx) };
      }));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full font-sans select-none animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-base text-[#1F2129]">规格管理</span>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Spec Groups */}
        <div className="w-22 bg-[#F8FAFB] overflow-y-auto no-scrollbar border-r border-gray-100 shrink-0">
          {localSpecs.map(s => {
            return (
              <div 
                key={s.id} 
                onClick={() => { setSelectedGroupId(s.id); setIsBatchMode(false); setSelectedIndices(new Set()); }}
                className={`px-1 py-6 text-[12px] text-center font-bold border-l-4 transition-all relative flex flex-col items-center justify-center ${selectedGroupId === s.id ? 'bg-white text-[#00C06B] border-[#00C06B]' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
              >
                <span className="truncate w-full px-2">{s.name}</span>
              </div>
            );
          })}
        </div>

        {/* Main Content: Value List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24 bg-gray-50">
          <div className="flex items-center justify-between px-1 mb-1">
            <div className="flex items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeGroup.name} 细分规格</span>
              {isHQ && (
                <span className="ml-2 text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-black border border-orange-100 flex items-center tracking-wider">
                  <Lock size={8} className="mr-0.5"/> 总部下发
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-bold bg-gray-200/50 px-2 py-0.5 rounded-full">共 {activeGroup.values.length} 项</span>
          </div>

          {activeGroup.values.map((val, idx) => {
            const isSelected = selectedIndices.has(idx);
            return (
              <div 
                key={idx} 
                onClick={() => isBatchMode && handleToggleSelection(idx)}
                className={`bg-white p-4 rounded-xl border transition-all relative overflow-hidden shadow-sm ${isBatchMode && isSelected ? 'border-[#00C06B] ring-1 ring-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100'} active:bg-gray-50`}
              >
                <div className="flex items-center">
                  <div className="flex-1 min-w-0" onClick={() => !isBatchMode && !isHQ && setValueModal({ show: true, index: idx, text: val })}>
                    <span className={`font-black text-sm text-gray-800`}>{val}</span>
                  </div>

                  {!isBatchMode ? (
                    <div className="flex items-center space-x-3">
                      {!isHQ && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setValueModal({ show: true, index: idx, text: val }); }} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg transition-colors">
                            <Edit2 size={16}/>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteValue(idx); }} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                            <Trash size={16}/>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="p-1">{isSelected ? <CheckCircle2 className="text-[#00C06B]" size={20} fill="white"/> : <Circle className="text-gray-300" size={20}/>}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Bar */}
      {isBatchMode ? (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 z-30 shadow-lg animate-in slide-in-from-bottom">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-xs font-bold text-gray-500">已选 {selectedIndices.size} 项</span>
            <button onClick={() => setSelectedIndices(selectedIndices.size === activeGroup.values.length ? new Set() : new Set(activeGroup.values.map((_, i) => i)))} className="text-xs font-bold text-[#00C06B]">全选</button>
          </div>
          <div className="flex gap-3">
             <button 
                disabled={isHQ || selectedIndices.size === 0}
                onClick={handleBatchDelete}
                className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 ${isHQ || selectedIndices.size === 0 ? 'bg-gray-100 text-gray-300' : 'bg-red-50 text-red-500 border border-red-100'}`}
             >
                <Trash size={18} className="mr-2"/>
                批量删除
             </button>
             <button onClick={() => setIsBatchMode(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">取消选择</button>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button onClick={() => setIsBatchMode(true)} className="flex flex-col items-center justify-center px-2 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 active:bg-gray-50 min-w-[72px]">
            <CheckSquare size={20} className="mb-1"/>
            <span className="text-[10px] font-bold">批量管理</span>
          </button>
          <button 
            onClick={() => setShowGroupManager(true)}
            className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl active:bg-gray-50 flex flex-col items-center justify-center"
          >
            <Settings2 size={24} className="mb-0.5"/>
            <span className="text-[10px]">规格组管理</span>
          </button>
          <button 
            disabled={isHQ}
            onClick={() => setValueModal({ show: true, index: -1, text: '' })}
            className={`flex-1 py-2 bg-[#1F2129] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center ${isHQ ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
          >
            <Plus size={24} className="mb-0.5"/>
            <span className="text-[10px]">{isHQ ? '总部禁用新增' : '新增规格值'}</span>
          </button>
        </div>
      )}

      {/* Group Manager Page */}
      {showGroupManager && (
        <MobileSpecGroupManagerPage 
          groups={localSpecs}
          onBack={() => setShowGroupManager(false)}
          onUpdate={(next) => setLocalSpecs(next)}
        />
      )}

      {/* Value Edit Modal */}
      {valueModal && (
        <ValueEditModal 
          text={valueModal.text}
          onClose={() => setValueModal(null)}
          onSave={handleSaveValue}
        />
      )}
    </div>
  );
};

// --- Value Edit Modal ---
const ValueEditModal = ({ text, onClose, onSave }: { text: string, onClose: () => void, onSave: (val: string) => void }) => {
  const [val, setVal] = useState(text);
  return (
    <div className="absolute inset-0 z-[200] flex flex-col justify-end bg-black/50 animate-in fade-in">
      <div className="flex-1" onClick={onClose}></div>
      <div className="bg-white rounded-t-[24px] overflow-hidden animate-in slide-in-from-bottom duration-300 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-gray-900">{text ? '编辑规格项' : '新增规格项'}</h3>
          <button onClick={onClose} className="p-1.5 bg-gray-100 rounded-full text-gray-500"><X size={18}/></button>
        </div>
        <div className="space-y-4 mb-8">
           <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">规格名称 <span className="text-red-500">*</span></label>
           <input 
              autoFocus
              value={val}
              onChange={e => setVal(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-[#00C06B] transition-all"
              placeholder="请输入规格名称，如：大杯"
           />
        </div>
        <button 
           onClick={() => onSave(val)}
           disabled={!val.trim()}
           className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] ${val.trim() ? 'bg-[#00C06B] text-white shadow-green-100' : 'bg-gray-200 text-gray-400'}`}
        >
          保存
        </button>
      </div>
    </div>
  );
};

// --- Group Manager Page ---
const MobileSpecGroupManagerPage = ({ groups, onBack, onUpdate }: { groups: LocalSpec[], onBack: () => void, onUpdate: (groups: LocalSpec[]) => void }) => {
  const [editingGroup, setEditingGroup] = useState<LocalSpec | null>(null);

  const handleDelete = (id: string) => {
    if (groups.find(g => g.id === id)?.source === 'brand') return;
    if (confirm('确认删除该规格分组吗？')) {
      onUpdate(groups.filter(g => g.id !== id));
    }
  };

  const handleSaveGroup = (groupData: LocalSpec) => {
    if (!groupData.name.trim()) return;
    
    if (groupData.id) {
      onUpdate(groups.map(g => g.id === groupData.id ? groupData : g));
    } else {
      const next: LocalSpec = { 
          ...groupData,
          id: `s_store_${Date.now()}`, 
          source: 'store'
      };
      onUpdate([...groups, next]);
    }
    setEditingGroup(null);
  };

  return (
    <div className="absolute inset-0 z-[150] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
      <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 shadow-sm relative z-50">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">规格组管理</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {groups.map(g => {
          const isHQ = g.source === 'brand';
          return (
            <div key={g.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isHQ ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-sm hover:border-orange-200'}`}>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className={`font-black text-sm ${isHQ ? 'text-gray-400' : 'text-gray-800'}`}>{g.name}</span>
                  {isHQ ? (
                    <span className="ml-2 text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-black border border-orange-100 flex items-center tracking-wider uppercase"><Lock size={8} className="mr-0.5"/> 总部</span>
                  ) : (
                    <span className="ml-2 text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-black border border-green-100 flex items-center tracking-wider uppercase">自建</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">包含 {g.values.length} 个规格项</span>
              </div>
              {!isHQ && (
                <div className="flex items-center space-x-2">
                   <button onClick={() => setEditingGroup(g)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"><Edit2 size={16}/></button>
                   <button onClick={() => handleDelete(g.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={16}/></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 pb-8 bg-white border-t border-gray-100 shrink-0">
        <button 
          onClick={() => setEditingGroup({ id: '', name: '', source: 'store', values: [] })}
          className="w-full h-12 bg-[#1F2129] text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center active:scale-[0.98] transition-all"
        >
          <Plus size={20} className="mr-2"/> 新增规格组
        </button>
      </div>

      {editingGroup && (
        <SpecGroupFormModal
            item={editingGroup}
            onClose={() => setEditingGroup(null)}
            onSave={handleSaveGroup}
        />
      )}
    </div>
  );
};

// Add SpecGroupFormModal component
const SpecGroupFormModal = ({ item, onClose, onSave }: { item: LocalSpec, onClose: () => void, onSave: (data: LocalSpec) => void }) => {
    const [name, setName] = useState(item.name);
    // Convert values array to object array for better management
    // Ensure new groups start with one empty value
    const [values, setValues] = useState<{ id: string, name: string }[]>(
        item.values.length > 0 
            ? item.values.map((v, i) => ({ id: `v_${i}`, name: v }))
            : [{ id: `v_${Date.now()}`, name: '' }]
    );

    const handleAddValue = () => {
        setValues([...values, { id: `v_${Date.now()}`, name: '' }]);
    };

    const handleValueChange = (id: string, newName: string) => {
        setValues(prev => prev.map(v => v.id === id ? { ...v, name: newName } : v));
    };

    const handleRemoveValue = (id: string) => {
        setValues(prev => prev.filter(v => v.id !== id));
    };

    const handleConfirm = () => {
        if (!name.trim()) {
            alert("请输入规格名称");
            return;
        }
        if (values.some(v => !v.name.trim())) {
            alert("请完善所有规格值");
            return;
        }
        
        onSave({
            ...item,
            name: name.trim(),
            values: values.map(v => v.name.trim())
        });
    };

    return (
        <div className="absolute inset-0 z-[160] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
           {/* Header */}
           <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 shadow-sm">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-600"><ChevronLeft size={24}/></button>
                <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">{item.id ? '编辑规格' : '新增规格'}</span>
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
              {/* Group Name */}
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                 <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <label className="text-sm font-bold text-gray-700 flex items-center">
                        <span className="text-red-500 mr-1">*</span>规格名称
                    </label>
                    <input 
                        className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4"
                        placeholder="请输入规格名称"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                 </div>
              </div>

              {/* Spec Values */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <h4 className="text-sm font-black text-gray-800 flex items-center"><span className="text-red-500 mr-1">*</span> 规格值</h4>
                    <button onClick={handleAddValue} className="text-[#00C06B] text-[13px] font-bold flex items-center bg-green-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                        <Plus size={14} className="mr-1"/> 添加规格值
                    </button>
                 </div>
                 
                 {values.length === 0 ? (
                    <div className="py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
                        <Scale size={32} className="opacity-10 mb-2"/>
                        <span className="text-xs font-bold">暂无规格值</span>
                    </div>
                 ) : (
                    values.map((val, idx) => (
                        <div key={val.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between space-x-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-400">规格值 {idx + 1}</span>
                                        {values.length > 1 && (
                                            <button onClick={() => handleRemoveValue(val.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={16}/>
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:bg-white focus:border-[#00C06B] transition-all"
                                        placeholder="输入规格值名称"
                                        value={val.name}
                                        onChange={e => handleValueChange(val.id, e.target.value)}
                                        autoFocus={!val.name}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                 )}
              </div>
           </div>

           <div className="p-4 pb-8 bg-white border-t border-gray-100 shrink-0 flex gap-3 shadow-lg">
                <button 
                    onClick={onClose}
                    className="flex-1 h-12 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm active:scale-95 transition-all"
                >
                    取消
                </button>
                <button 
                    onClick={handleConfirm}
                    className="flex-[2] h-12 bg-[#00C06B] text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 active:scale-95 transition-all"
                >
                    确定
                </button>
           </div>
        </div>
    );
};
