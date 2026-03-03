
import React, { useState } from 'react';
import { ChevronLeft, Plus, ChevronRight, ArrowUp, ArrowDown, Trash2, Edit2, Check } from 'lucide-react';
import { LocalCategory } from './types';

// Reuse LocalCategory type but adapted for Addon Types context if needed
// For now we assume a simple structure
interface AddonType {
  id: string;
  name: string;
  source: 'brand' | 'store';
  count: number;
  description?: string;
  sortOrder?: number;
  isMultiSelect?: boolean;
}

const INITIAL_TYPES: AddonType[] = [
  { id: 'at_1', name: '默认类型', source: 'brand', count: 12, description: '系统默认分类', sortOrder: 1, isMultiSelect: true },
  { id: 'at_2', name: '小料', source: 'store', count: 5, description: '加料区', sortOrder: 10, isMultiSelect: true },
  { id: 'at_3', name: '奶盖', source: 'store', count: 3, description: '顶部配料', sortOrder: 20, isMultiSelect: false },
  { id: 'at_4', name: '基底', source: 'store', count: 4, description: '替换基底', sortOrder: 30, isMultiSelect: false },
];

interface Props {
  onBack: () => void;
}

export const MobileAddonTypeManager: React.FC<Props> = ({ onBack }) => {
  const [view, setView] = useState<'list' | 'sort'>('list');
  const [types, setTypes] = useState<AddonType[]>(INITIAL_TYPES);
  const [modal, setModal] = useState<{ show: boolean, type: 'create' | 'edit', item?: AddonType } | null>(null);

  const handleSave = (data: Partial<AddonType>) => {
    if (modal?.type === 'create') {
      const newType: AddonType = {
        id: `at_${Date.now()}`,
        name: data.name || '未命名',
        source: 'store',
        count: 0,
        description: data.description,
        sortOrder: data.sortOrder,
        isMultiSelect: data.isMultiSelect
      };
      setTypes(prev => [...prev, newType]);
    } else if (modal?.type === 'edit' && modal.item) {
      setTypes(prev => prev.map(t => t.id === modal.item!.id ? { ...t, ...data } : t));
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('确认删除此加料类型吗？')) {
      setTypes(prev => prev.filter(t => t.id !== id));
      setModal(null);
    }
  };

  const handleSort = (items: AddonType[]) => {
      setTypes(items);
      setView('list');
  };

  if (view === 'sort') {
      return <TypeSorter items={types} onBack={() => setView('list')} onSave={handleSort} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
      <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-base">加料类型管理</span>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24">
        {types.map(type => (
          <div 
            key={type.id} 
            onClick={() => setModal({ show: true, type: 'edit', item: type })}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform flex items-center justify-between"
          >
            <div className="flex items-center">
                <span className="font-bold text-sm text-[#1F2129] mr-2">{type.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${type.source === 'brand' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  {type.source === 'brand' ? '总部' : '门店'}
                </span>
            </div>
            {type.source === 'store' && <ChevronRight size={16} className="text-gray-300"/>}
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-20 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
         <button onClick={() => setView('sort')} className="flex-1 py-3.5 bg-gray-50 text-gray-600 font-bold rounded-xl active:bg-gray-100 flex items-center justify-center">
            <ArrowUp size={16} className="mr-1"/> 排序
         </button>
         <button onClick={() => setModal({ show: true, type: 'create' })} className="flex-[2] py-3.5 bg-[#00C06B] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform">
            新建加料类型
         </button>
      </div>

      {modal && (
        <TypeFormModal 
            onClose={() => setModal(null)}
            onSave={handleSave}
            onDelete={handleDelete}
            item={modal.item}
            type={modal.type}
        />
      )}
    </div>
  );
};

const TypeFormModal = ({ onClose, onSave, onDelete, item, type }: { onClose: () => void, onSave: (data: Partial<AddonType>) => void, onDelete: (id: string) => void, item?: AddonType, type: 'create' | 'edit' }) => {
    const isBrand = item?.source === 'brand';
    const [form, setForm] = useState<Partial<AddonType>>({
        name: item?.name || '',
        description: item?.description || '',
        sortOrder: item?.sortOrder,
        isMultiSelect: item?.isMultiSelect ?? false
    });

    const updateForm = (key: keyof AddonType, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in">
            <div className="flex-1" onClick={onClose}></div>
            <div className="bg-white rounded-t-[24px] p-6 animate-in slide-in-from-bottom duration-300 pb-10 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="text-lg font-black text-gray-900">{type === 'create' ? '新建加料类型' : '编辑类型'}</h3>
                    {isBrand && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold">默认类型不支持修改</span>}
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 mb-4">
                    <div className="space-y-4">
                        <Input 
                            label="加料类型" 
                            required 
                            value={form.name} 
                            onChange={(v: string) => updateForm('name', v)} 
                            placeholder="请输入加料类型名称" 
                            disabled={isBrand}
                        />
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-500">描述</label>
                                <button className="text-[10px] font-bold text-[#00C06B]">查看示例</button>
                            </div>
                            <input 
                                value={form.description || ''} 
                                onChange={e => updateForm('description', e.target.value)} 
                                disabled={isBrand}
                                className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-colors ${isBrand ? 'bg-gray-50 text-gray-500' : 'bg-gray-50 focus:border-[#00C06B] text-gray-800'}`} 
                                placeholder="请输入加料类型描述"
                            />
                        </div>

                        <Input 
                            label="排序" 
                            type="number"
                            value={form.sortOrder?.toString()} 
                            onChange={(v: string) => updateForm('sortOrder', parseInt(v) || 0)} 
                            placeholder="请输入加料类型排序" 
                            disabled={isBrand}
                        />

                        <div className="flex items-center justify-between py-2">
                            <span className="text-xs font-bold text-gray-500">顾客可多选</span>
                            <div 
                                onClick={() => !isBrand && updateForm('isMultiSelect', !form.isMultiSelect)} 
                                className={`w-11 h-6 rounded-full relative transition-colors ${isBrand ? 'opacity-60' : 'cursor-pointer'} ${form.isMultiSelect ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${form.isMultiSelect ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-auto shrink-0">
                    {!isBrand && type === 'edit' && (
                        <button onClick={() => onDelete(item!.id)} className="px-4 py-3.5 bg-red-50 text-red-500 rounded-xl font-bold active:scale-95 transition-transform">
                            <Trash2 size={20}/>
                        </button>
                    )}
                    {isBrand ? (
                        <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold">关闭</button>
                    ) : (
                        <button 
                            onClick={() => { if(form.name?.trim()) onSave(form); }} 
                            className={`flex-1 py-3.5 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-transform ${form.name?.trim() ? 'bg-[#00C06B] text-white' : 'bg-gray-200 text-gray-400'}`} 
                            disabled={!form.name?.trim()}
                        >
                            保存
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const Input = ({ label, required, value, onChange, placeholder, type = 'text', disabled }: any) => (
    <div className="flex flex-col space-y-2">
        <label className="text-xs font-bold text-gray-500">{label} {required && <span className="text-red-500">*</span>}</label>
        <input 
            type={type} 
            value={value || ''} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-colors ${disabled ? 'bg-gray-50 text-gray-500' : 'bg-gray-50 focus:border-[#00C06B] text-gray-800'}`}
        />
    </div>
);

const TypeSorter = ({ items, onBack, onSave }: { items: AddonType[], onBack: () => void, onSave: (items: AddonType[]) => void }) => {
    const [list, setList] = useState(items);
    
    const move = (idx: number, dir: 'up' | 'down') => {
        const next = [...list];
        if (dir === 'up' && idx > 0) [next[idx], next[idx-1]] = [next[idx-1], next[idx]];
        else if (dir === 'down' && idx < next.length - 1) [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
        setList(next);
    };

    return (
        <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
            <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-20">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black"><ChevronLeft size={24}/></button>
                <span className="font-bold text-base">加料类型排序</span>
                <div className="w-8"></div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                {list.map((item, idx) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center">
                            <span className="w-6 text-xs font-bold text-gray-400 mr-2">{idx + 1}</span>
                            <span className="font-bold text-sm text-[#1F2129]">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => move(idx, 'up')} disabled={idx === 0} className="p-2 bg-gray-50 rounded text-gray-600 disabled:opacity-30"><ArrowUp size={14}/></button>
                            <button onClick={() => move(idx, 'down')} disabled={idx === list.length - 1} className="p-2 bg-gray-50 rounded text-gray-600 disabled:opacity-30"><ArrowDown size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                <button onClick={() => onSave(list)} className="w-full py-3.5 bg-[#00C06B] text-white rounded-xl font-bold shadow-lg">保存排序</button>
            </div>
        </div>
    );
};
