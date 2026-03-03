import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, Plus, X, Trash2, Check, Lock, Sliders, CheckSquare, Circle, CheckCircle2,
  Power, Edit2, Settings2, Trash, Info
} from 'lucide-react';
import { LocalMethod, LocalMethodValue } from './types';
import { Product } from '../../types';
import { MobileMethodGroupManagerPage } from './MobileMethodGroupManagerPage';

const INITIAL_LOCAL_METHODS: LocalMethod[] = [
  {
    id: 'm_brand_1',
    name: '甜度',
    source: 'brand',
    values: [
      { id: 'v_b1_1', name: '标准糖', linkedProductIds: ['prod_1'], status: 'active' },
      { id: 'v_b1_2', name: '七分糖', linkedProductIds: ['prod_1'], status: 'active' },
      { id: 'v_b1_3', name: '五分糖', linkedProductIds: [], status: 'active' },
      { id: 'v_b1_4', name: '三分糖', linkedProductIds: [], status: 'inactive' },
      { id: 'v_b1_5', name: '不加糖', linkedProductIds: ['prod_1'], status: 'active' }
    ]
  },
  {
    id: 'm_brand_2',
    name: '温度',
    source: 'brand',
    values: [
      { id: 'v_b2_1', name: '正常冰', linkedProductIds: ['prod_1'], status: 'active' },
      { id: 'v_b2_2', name: '少冰', linkedProductIds: ['prod_1'], status: 'active' },
      { id: 'v_b2_3', name: '去冰', linkedProductIds: [], status: 'active' },
      { id: 'v_b2_4', name: '温', linkedProductIds: [], status: 'inactive' },
      { id: 'v_b2_5', name: '热', linkedProductIds: [], status: 'inactive' }
    ]
  },
  {
    id: 'm_store_1',
    name: '牛排熟度',
    source: 'store',
    values: [
      { id: 'v_s1_1', name: '三分熟', linkedProductIds: ['prod_2'], status: 'active' },
      { id: 'v_s1_2', name: '五分熟', linkedProductIds: [], status: 'active' },
      { id: 'v_s1_3', name: '七分熟', linkedProductIds: [], status: 'active' },
      { id: 'v_s1_4', name: '全熟', linkedProductIds: [], status: 'active' }
    ]
  }
];

interface Props {
  onBack: () => void;
  products: Product[];
}

export const MobileMethodManager: React.FC<Props> = ({ onBack, products }) => {
  const [localMethods, setLocalMethods] = useState<LocalMethod[]>(INITIAL_LOCAL_METHODS);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(INITIAL_LOCAL_METHODS[0].id);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Page/Modal States
  const [showGroupManagerPage, setShowGroupManagerPage] = useState(false);
  const [methodModal, setMethodModal] = useState<{ show: boolean, type: 'create' | 'edit', item?: LocalMethod } | null>(null);
  const [valueEditModal, setValueEditModal] = useState<{ show: boolean, value: LocalMethodValue, groupId: string } | null>(null);

  const activeGroup = useMemo(() => 
    localMethods.find(m => m.id === selectedGroupId) || localMethods[0]
  , [localMethods, selectedGroupId]);

  const isCurrentGroupHQ = activeGroup.source === 'brand';

  const toggleValueStatus = (groupId: string, valueId: string) => {
    setLocalMethods(prev => prev.map(m => {
        if (m.id !== groupId) return m;
        return {
            ...m,
            values: m.values.map(v => {
                if (v.id !== valueId) return v;
                return { ...v, status: v.status === 'inactive' ? 'active' : 'inactive' };
            })
        };
    }));
  };

  const handleBatchStatus = (status: 'active' | 'inactive') => {
      setLocalMethods(prev => prev.map(m => ({
          ...m,
          values: m.values.map(v => selectedIds.has(v.id) ? { ...v, status } : v)
      })));
      setIsBatchMode(false);
      setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
      if (isCurrentGroupHQ) {
          alert('总部下发的做法分组不支持批量删除做法值');
          return;
      }
      if (confirm(`确认删除选中的 ${selectedIds.size} 个做法值吗？`)) {
          setLocalMethods(prev => prev.map(m => ({
              ...m,
              values: m.values.filter(v => !selectedIds.has(v.id))
          })));
          setIsBatchMode(false);
          setSelectedIds(new Set());
      }
  };

  const toggleSelection = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
  };

  const handleSaveMethodGroup = (methodData: LocalMethod) => {
    if (methodModal?.type === 'create') {
      setLocalMethods(prev => [...prev, methodData]);
      setSelectedGroupId(methodData.id);
    } else {
      setLocalMethods(prev => prev.map(m => m.id === methodData.id ? methodData : m));
    }
    setMethodModal(null);
  };

  const handleSaveValue = (groupId: string, updatedValue: LocalMethodValue) => {
      setLocalMethods(prev => prev.map(m => {
          if (m.id !== groupId) return m;
          return {
              ...m,
              values: m.values.map(v => v.id === updatedValue.id ? updatedValue : v)
          };
      }));
      setValueEditModal(null);
  };

  const handleDeleteValue = (groupId: string, valueId: string) => {
      const group = localMethods.find(m => m.id === groupId);
      if (group?.source === 'brand') {
          alert('总部下发的做法分组不支持直接删除内部做法值');
          return;
      }
      if (confirm('确认删除该做法值吗？')) {
          setLocalMethods(prev => prev.map(m => {
              if (m.id !== groupId) return m;
              return {
                  ...m,
                  values: m.values.filter(v => v.id !== valueId)
              };
          }));
          if (valueEditModal) setValueEditModal(null);
      }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-base">做法管理</span>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Method Groups */}
        <div className="w-22 bg-[#F8FAFB] overflow-y-auto no-scrollbar border-r border-gray-100 shrink-0">
          {localMethods.map(m => {
            return (
              <div 
                key={m.id} 
                onClick={() => setSelectedGroupId(m.id)}
                className={`px-1 py-6 text-[12px] text-center font-bold border-l-4 transition-all relative flex flex-col items-center justify-center ${selectedGroupId === m.id ? 'bg-white text-[#00C06B] border-[#00C06B]' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
              >
                <span className="truncate w-full px-2">{m.name}</span>
              </div>
            );
          })}
        </div>

        {/* Main: Values List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24 bg-gray-50">
          <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeGroup.name} 细分项</span>
                {activeGroup.source === 'brand' && (
                    <span className="ml-2 text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold border border-orange-100 flex items-center">
                        <Lock size={8} className="mr-0.5"/> 总部
                    </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400 font-bold bg-gray-200/50 px-2 py-0.5 rounded-full">共 {activeGroup.values.length} 项</span>
          </div>

          {activeGroup.values.map(val => {
            const isSelected = selectedIds.has(val.id);
            const isInactive = val.status === 'inactive';
            return (
              <div 
                key={val.id} 
                onClick={() => isBatchMode && toggleSelection(val.id)}
                className={`bg-white p-4 rounded-xl border transition-all relative overflow-hidden shadow-sm ${isBatchMode && isSelected ? 'border-[#00C06B] ring-1 ring-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100'}`}
              >
                <div className="flex items-center">
                  <div className="flex-1 min-w-0" onClick={() => !isBatchMode && setValueEditModal({ show: true, value: val, groupId: selectedGroupId })}>
                      <div className="flex items-center">
                        <span className={`font-bold text-sm ${isInactive ? 'text-gray-400' : 'text-gray-800'}`}>{val.name}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 flex items-center">
                         <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isInactive ? 'bg-gray-300' : 'bg-[#00C06B]'}`}></div>
                         {isInactive ? '已禁用' : '启用中'}
                      </div>
                  </div>

                  {!isBatchMode ? (
                      <div className="flex items-center space-x-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleValueStatus(selectedGroupId, val.id); }}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all ${isInactive ? 'text-[#00C06B] bg-green-50' : 'text-gray-400 bg-gray-100'}`}
                        >
                            {isInactive ? '启用' : '禁用'}
                        </button>
                        {activeGroup.source === 'store' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteValue(selectedGroupId, val.id); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-100 rounded-lg active:scale-95 transition-all"
                            >
                              <Trash2 size={18}/>
                            </button>
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

      {/* Bottom Action Bar */}
      {isBatchMode ? (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 z-30 shadow-lg animate-in slide-in-from-bottom">
              <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-gray-500">已选 {selectedIds.size} 项</span>
                  <button onClick={() => setSelectedIds(selectedIds.size === activeGroup.values.length ? new Set() : new Set(activeGroup.values.map(v => v.id)))} className="text-xs font-bold text-[#00C06B]">全选</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => handleBatchStatus('active')} className="flex flex-col items-center justify-center py-3 rounded-xl border border-gray-200 bg-white active:scale-95 transition-all">
                      <Check size={18} className="text-[#00C06B] mb-1"/>
                      <span className="text-[10px] font-bold">批量启用</span>
                  </button>
                  <button onClick={() => handleBatchStatus('inactive')} className="flex flex-col items-center justify-center py-3 rounded-xl border border-gray-200 bg-white active:scale-95 transition-all">
                      <Power size={18} className="text-gray-400 mb-1"/>
                      <span className="text-[10px] font-bold">批量禁用</span>
                  </button>
                  <button 
                    disabled={activeGroup.source === 'brand'}
                    onClick={handleBatchDelete} 
                    className={`flex flex-col items-center justify-center py-3 rounded-xl border border-red-100 bg-red-50 text-red-500 active:scale-95 transition-all ${activeGroup.source === 'brand' ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                      <Trash2 size={18} className="mb-1"/>
                      <span className="text-[10px] font-bold">批量删除</span>
                  </button>
                  <button onClick={() => setIsBatchMode(false)} className="flex flex-col items-center justify-center py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 active:scale-95 transition-all">
                      <X size={18} className="mb-1"/>
                      <span className="text-[10px] font-bold">取消</span>
                  </button>
              </div>
          </div>
      ) : (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 z-20 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
              <button onClick={() => setIsBatchMode(true)} className="flex flex-col items-center justify-center px-2 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 active:bg-gray-50 min-w-[72px]">
                  <CheckSquare size={20} className="mb-1"/>
                  <span className="text-[10px] font-bold">批量管理</span>
              </button>
              <button 
                onClick={() => setShowGroupManagerPage(true)}
                className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl active:bg-gray-50 flex flex-col items-center justify-center"
              >
                  <Settings2 size={24} className="mb-0.5"/>
                  <span className="text-[10px]">做法分组管理</span>
              </button>
              <button 
                disabled={activeGroup.source === 'brand'}
                onClick={() => setMethodModal({ show: true, type: 'create' })}
                className={`flex-1 py-2 bg-[#1F2129] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center ${activeGroup.source === 'brand' ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
              >
                  <Plus size={24} className="mb-0.5"/>
                  <span className="text-[10px]">{activeGroup.source === 'brand' ? '总部禁用新增' : '新增做法'}</span>
              </button>
          </div>
      )}

      {/* Pages */}
      {showGroupManagerPage && (
          <MobileMethodGroupManagerPage 
            groups={localMethods}
            onBack={() => setShowGroupManagerPage(false)}
            onUpdate={(next) => { setLocalMethods(next); }}
          />
      )}

      {/* Modals */}
      {methodModal && (
        <MethodGroupFormModal
          onClose={() => setMethodModal(null)}
          onSave={handleSaveMethodGroup}
          item={methodModal.item}
          type={methodModal.type}
        />
      )}

      {valueEditModal && (
          <ValueEditModal 
            groupId={valueEditModal.groupId}
            value={valueEditModal.value}
            source={activeGroup.source}
            onClose={() => setValueEditModal(null)}
            onSave={handleSaveValue}
            onDelete={handleDeleteValue}
          />
      )}
    </div>
  );
};

// ... Internal Form Components ...

export const MethodValueItem: React.FC<{ 
    index: number; 
    value: any; 
    onUpdate: (updates: any) => void; 
    onDelete?: () => void;
    hideDelete?: boolean;
}> = ({ 
    index, 
    value, 
    onUpdate, 
    onDelete,
    hideDelete
}) => {
    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-base font-black text-gray-800">做法值项</h4>
                {onDelete && !hideDelete && (
                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={20}/>
                    </button>
                )}
            </div>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <label className="text-sm font-bold text-gray-600 flex items-center">
                        <span className="text-red-500 mr-1">*</span>做法值
                    </label>
                    <input 
                        className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4"
                        placeholder="请输入做法值名称"
                        value={value.name}
                        onChange={e => onUpdate({ name: e.target.value })}
                    />
                </div>
                
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <label className="text-sm font-bold text-gray-600">做法标识码</label>
                    <input 
                        className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4"
                        placeholder="请输入做法标识码"
                        value={value.code || ''}
                        onChange={e => onUpdate({ code: e.target.value })}
                    />
                </div>
                
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <label className="text-sm font-bold text-gray-600">备注</label>
                    <input 
                        className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4"
                        placeholder="请输入备注"
                        value={value.remark || ''}
                        onChange={e => onUpdate({ remark: e.target.value })}
                    />
                </div>
                
                <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <label className="text-sm font-bold text-gray-600">温馨提示</label>
                    <input 
                        className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4"
                        placeholder="请输入温馨提示"
                        value={value.prompt || ''}
                        onChange={e => onUpdate({ prompt: e.target.value })}
                    />
                </div>
                
                <div className="flex justify-between items-center py-1">
                    <label className="text-sm font-bold text-gray-600">是否打印</label>
                    <div className="flex items-center text-sm text-[#00C06B] font-bold">
                        <div onClick={() => onUpdate({ print: !value.print })} className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${value.print ? 'bg-[#00C06B]' : 'bg-gray-200'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${value.print ? 'left-6' : 'left-1'}`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MethodGroupFormModal = ({ onClose, onSave, item, type }: { onClose: () => void, onSave: (data: LocalMethod) => void, item?: LocalMethod, type: 'create' | 'edit' }) => {
    const isBrand = item?.source === 'brand';
    
    // Group settings state
    const [groupName, setGroupName] = useState(item?.name || '');
    const [description, setDescription] = useState('');
    const [isMulti, setIsMulti] = useState(false);
    const [isRequired, setIsRequired] = useState(false);
    
    // Method values state
    const [methodValues, setMethodValues] = useState<any[]>(
        item?.values.map(v => ({
            id: v.id,
            name: v.name,
            code: '',
            remark: '',
            prompt: '',
            linkedProductIds: v.linkedProductIds || [],
            status: v.status || 'active',
            print: true
        })) || [
            { id: `v_${Date.now()}`, name: '', code: '', remark: '', prompt: '', linkedProductIds: [], status: 'active', print: true }
        ]
    );

    const handleAddValue = () => {
        setMethodValues([...methodValues, { 
            id: `v_${Date.now()}`, 
            name: '', 
            code: '', 
            remark: '', 
            prompt: '', 
            linkedProductIds: [], 
            status: 'active',
            print: true
        }]);
    };

    const handleUpdateValue = (index: number, updates: any) => {
        const next = [...methodValues];
        next[index] = { ...next[index], ...updates };
        setMethodValues(next);
    };

    const handleDeleteValue = (index: number) => {
        if (methodValues.length <= 1) {
            alert('至少需要一个做法值');
            return;
        }
        setMethodValues(methodValues.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!groupName) {
            alert('请输入做法名称');
            return;
        }
        if (methodValues.some(v => !v.name)) {
            alert('请完善所有做法值名称');
            return;
        }

        const finalData: LocalMethod = {
            id: item?.id || `m_st_${Date.now()}`,
            name: groupName,
            source: item?.source || 'store',
            values: methodValues.map(v => ({
                id: v.id,
                name: v.name,
                linkedProductIds: v.linkedProductIds,
                status: v.status
            }))
        };
        onSave(finalData);
    };

    return (
        <div className="absolute inset-0 z-[200] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 shadow-sm relative z-50">
                <button onClick={onClose} className="p-2 -ml-2 text-gray-600">
                    <ChevronLeft size={24}/>
                </button>
                <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">
                    {type === 'create' ? '新建做法' : '编辑做法'}
                </span>
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-32">
                
                {/* Section 1: Basic Info */}
                <div className="bg-white rounded-2xl p-5 shadow-sm space-y-6">
                    <h4 className="text-base font-black text-gray-800">基本信息</h4>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <label className="text-sm font-bold text-gray-600 flex items-center">
                                <span className="text-red-500 mr-1">*</span>做法名称
                            </label>
                            <input 
                                className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1 ml-4"
                                placeholder="请输入做法名称"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                disabled={isBrand}
                            />
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <label className="text-sm font-bold text-gray-700">做法描述</label>
                            <div className="flex items-center flex-1 ml-4">
                                <input 
                                    className="text-right text-sm font-medium outline-none placeholder-gray-300 flex-1"
                                    placeholder="请输入做法描述"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                                <span className="text-[11px] font-bold text-[#00C06B] ml-2 shrink-0">查看示例</span>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <label className="text-sm font-bold text-gray-700">做法值多选</label>
                            <div 
                                onClick={() => !isBrand && setIsMulti(!isMulti)}
                                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${isMulti ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isMulti ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-1">
                            <label className="text-sm font-bold text-gray-700">做法必选</label>
                            <div 
                                onClick={() => !isBrand && setIsRequired(!isRequired)}
                                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${isRequired ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isRequired ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Method Values */}
                <div className="space-y-3">
                    {methodValues.map((val, idx) => (
                        <MethodValueItem 
                            key={val.id}
                            index={idx}
                            value={val}
                            onUpdate={(updates) => handleUpdateValue(idx, updates)}
                            onDelete={() => handleDeleteValue(idx)}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 flex gap-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={handleAddValue}
                    className="flex-1 h-12 bg-white border border-gray-200 rounded-xl font-bold text-[#333] text-sm active:bg-gray-50 active:scale-95 transition-all flex items-center justify-center"
                >
                    <Plus size={18} className="mr-1"/> 添加做法值
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-[1.5] h-12 bg-[#00C06B] text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 active:bg-[#00A35B] active:scale-[0.98] transition-all"
                >
                    保存
                </button>
            </div>
        </div>
    );
};

const ValueEditModal = ({ groupId, value, source, onClose, onSave, onDelete }: { groupId: string, value: LocalMethodValue, source: 'brand' | 'store', onClose: () => void, onSave: (groupId: string, v: LocalMethodValue) => void, onDelete: (groupId: string, id: string) => void }) => {
    const isHQ = source === 'brand';
    // Unified state to support same fields as creation
    const [form, setForm] = useState({
        ...value,
        print: true // Mock default
    });

    return (
        <div className="absolute inset-0 z-[120] flex flex-col justify-end bg-black/50 animate-in fade-in">
            <div className="flex-1" onClick={onClose}></div>
            <div className="bg-[#F5F6FA] rounded-t-[24px] p-0 overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col shadow-2xl max-h-[85vh]">
                <div className="p-5 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-black text-gray-900">编辑做法项</h3>
                    <button onClick={onClose} className="bg-gray-100 p-1.5 rounded-full"><X size={16} className="text-gray-500"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar p-3">
                    <MethodValueItem 
                        index={0}
                        value={form}
                        onUpdate={(updates) => setForm(prev => ({ ...prev, ...updates }))}
                        hideDelete={true}
                    />
                </div>

                <div className="p-4 pb-8 bg-white border-t border-gray-100 flex gap-3 shrink-0">
                    {!isHQ && (
                        <button onClick={() => onDelete(groupId, value.id)} className="px-4 py-3.5 bg-red-50 text-red-500 rounded-xl font-bold active:scale-95 transition-all">
                            <Trash2 size={20}/>
                        </button>
                    )}
                    <button 
                        onClick={() => { if(form.name) onSave(groupId, form); }} 
                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold shadow-lg ${form.name ? 'bg-[#1F2129] text-white' : 'bg-gray-200 text-gray-400'}`} 
                        disabled={!form.name}
                    >
                        保存修改
                    </button>
                </div>
            </div>
        </div>
    );
};
