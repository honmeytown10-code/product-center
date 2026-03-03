
import React, { useState } from 'react';
import { ChevronLeft, Plus, Lock, Edit2, Trash2, X } from 'lucide-react';
import { LocalMethod } from './types';
import { MethodGroupFormModal } from './MobileMethodManager';

interface Props {
  groups: LocalMethod[];
  onBack: () => void;
  onUpdate: (groups: LocalMethod[]) => void;
}

export const MobileMethodGroupManagerPage: React.FC<Props> = ({ groups, onBack, onUpdate }) => {
  const [methodModal, setMethodModal] = useState<{ show: boolean, type: 'create' | 'edit', item?: LocalMethod } | null>(null);

  const handleDelete = (id: string) => {
    const group = groups.find(m => m.id === id);
    if (group?.source === 'brand') {
      alert('总部下发的分组不支持删除');
      return;
    }
    if (confirm('确认删除该做法分组吗？所有关联关系将被解除。')) {
      onUpdate(groups.filter(m => m.id !== id));
    }
  };

  const handleSave = (methodData: LocalMethod) => {
    if (methodModal?.type === 'create') {
      onUpdate([...groups, methodData]);
    } else {
      onUpdate(groups.map(m => m.id === methodData.id ? methodData : m));
    }
    setMethodModal(null);
  };

  return (
    <div className="absolute inset-0 z-[150] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
      <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0 shadow-sm relative z-50">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 active:text-black">
          <ChevronLeft size={24} />
        </button>
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">做法分组管理</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {groups.map(g => {
          const isHQ = g.source === 'brand';
          return (
            <div key={g.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isHQ ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-sm hover:border-orange-200'}`}>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className={`font-bold text-sm ${isHQ ? 'text-gray-400' : 'text-gray-800'}`}>{g.name}</span>
                  {isHQ ? (
                    <span className="ml-2 text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold flex items-center uppercase tracking-wider"><Lock size={8} className="mr-0.5"/> 总部</span>
                  ) : (
                    <span className="ml-2 text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold flex items-center uppercase tracking-wider">自建</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">包含 {g.values.length} 个做法值</span>
              </div>
              <div className="flex items-center space-x-2">
                {!isHQ ? (
                  <>
                    <button onClick={() => setMethodModal({ show: true, type: 'edit', item: g })} className="p-2 text-gray-400 hover:text-blue-500 active:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(g.id)} className="p-2 text-gray-400 hover:text-red-500 active:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                  </>
                ) : (
                  <div className="p-2 text-gray-300"><Lock size={16}/></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 pb-8 bg-white border-t border-gray-100 shrink-0">
        <button 
          onClick={() => setMethodModal({ show: true, type: 'create' })}
          className="w-full h-12 bg-[#1F2129] text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center active:scale-[0.98] transition-all"
        >
          <Plus size={20} className="mr-2"/> 新增做法分组
        </button>
      </div>

      {methodModal && (
        <MethodGroupFormModal
          onClose={() => setMethodModal(null)}
          onSave={handleSave}
          item={methodModal.item}
          type={methodModal.type}
        />
      )}
    </div>
  );
};
