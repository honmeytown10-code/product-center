import React, { useState } from 'react';
import { 
  Plus, Trash2, X, HelpCircle, CheckCircle2, Search, Coffee
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_ADDON_GROUPS = [
  { id: '1220003880955199489', name: 'BBB', level: 1, count: 3, isFallback: true },
  { id: '1220004044302368769', name: 'KKK', level: 2, count: 2, isFallback: false },
  { id: '1220003857609703424', name: 'AAA', level: 3, count: 0, isFallback: false },
  { id: '1220003898147651584', name: 'CCC', level: 4, count: 3, isFallback: false },
  { id: '1220003916703252481', name: 'DDD', level: 5, count: 3, isFallback: false },
  { id: '1220003937767047168', name: 'EEE', level: 6, count: 4, isFallback: false },
];

const MOCK_ALL_ADDONS = [
  { id: 'a1', name: '波霸' },
  { id: 'a2', name: '珍珠' },
  { id: 'a3', name: '椰果' },
  { id: 'a4', name: '仙草' },
  { id: 'a5', name: '布丁' },
  { id: 'a6', name: '奶霜' },
  { id: 'a7', name: '冰淇淋' },
];

export const WebAddonGroupManager: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [groups, setGroups] = useState(MOCK_ADDON_GROUPS);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);

  // Modal States
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isFallback, setIsFallback] = useState(false);

  const openManageModal = (group: any) => {
    setEditingGroup(group);
    // Mock initializing selected addons
    setSelectedAddons(MOCK_ALL_ADDONS.slice(0, group.count).map(a => a.id));
    setIsFallback(group.isFallback);
  };

  const closeManageModal = () => {
    setEditingGroup(null);
  };

  const handleSaveAddons = () => {
    // If setting this group as fallback, remove fallback from others
    let updatedGroups = groups.map(g => {
      if (g.id === editingGroup.id) {
        return { ...g, count: selectedAddons.length, isFallback: isFallback };
      }
      if (isFallback && g.isFallback) {
        return { ...g, isFallback: false };
      }
      return g;
    });

    setGroups(updatedGroups);
    closeManageModal();
  };

  const toggleAddon = (id: string) => {
    if (selectedAddons.includes(id)) {
      setSelectedAddons(selectedAddons.filter(a => a !== id));
    } else {
      setSelectedAddons([...selectedAddons, id]);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F5F6FA] overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-white border-b border-[#E8E8E8] flex justify-between items-start shrink-0">
         <div className="flex items-center">
            {onBack && (
               <button onClick={onBack} className="mr-4 text-[#666] hover:text-[#333]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
               </button>
            )}
            <div>
               <h2 className="text-xl font-bold text-[#333] mb-2">加料分组管理</h2>
               <p className="text-sm text-[#666] flex items-center">
                  此处仅维护加料的所属分组，配方及甜度匹配计算逻辑在商品配方中配置 <span className="text-[#999] ml-1">【同一加料只可属于一个分组】</span>
               </p>
            </div>
         </div>
         <div className="flex space-x-3">
            <button className="px-4 py-1.5 border border-[#E8E8E8] text-[#333] rounded text-sm hover:bg-gray-50 flex items-center">
               <HelpCircle size={14} className="mr-1.5 text-[#999]"/> 优先级管理
            </button>
         </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto p-5">
         <div className="grid grid-cols-3 gap-5 auto-rows-max">
            {groups.map(group => (
               <div key={group.id} className="bg-white border border-[#E8E8E8] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="font-bold text-[16px] text-[#333] mb-1 flex items-center">
                           {group.name}
                           {group.isFallback && (
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded border border-blue-200" title="当订单无加料时，将命中此分组的配方">
                                 无加料兜底
                              </span>
                           )}
                        </h3>
                        <div className="text-[12px] text-[#999] font-mono">ID: {group.id}</div>
                     </div>
                     <button className="text-red-500 text-sm hover:underline">删除</button>
                  </div>

                  <div className="flex space-x-4 mb-6">
                     <div className="flex-1 bg-[#F9FAFB] rounded p-3">
                        <div className="text-[12px] text-[#999] mb-1">当前优先级</div>
                        <div className="font-bold text-red-500 flex items-center text-sm">
                           <div className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center mr-1 text-[10px]">↑</div>
                           Level {group.level}
                        </div>
                     </div>
                     <div className="flex-1 bg-[#F9FAFB] rounded p-3">
                        <div className="text-[12px] text-[#999] mb-1">关联加料数量</div>
                        <div className="font-bold text-blue-600 flex items-center text-sm">
                           <div className="w-4 h-4 rounded bg-blue-100 text-blue-600 flex items-center justify-center mr-1 text-[10px]">#</div>
                           {group.count} 个
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end">
                     <button 
                        onClick={() => openManageModal(group)}
                        className="px-4 py-1.5 border border-[#00C06B] text-[#00C06B] rounded text-sm hover:bg-[#00C06B]/5 font-medium"
                     >
                        加料管理
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Manage Addons Modal (Where the Virtual Mapping happens) */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[560px] flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-[#E8E8E8] flex justify-between items-center bg-[#F9F9F9]">
              <h3 className="font-bold text-[16px] text-[#333]">管理加料 - {editingGroup.name}</h3>
              <button onClick={closeManageModal} className="text-[#999] hover:text-[#333]"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
               
               {/* 核心需求落地：无加料场景的虚拟映射配置 */}
               <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start cursor-pointer group">
                     <div className="mt-0.5 mr-3">
                        <input 
                           type="checkbox" 
                           className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600"
                           checked={isFallback}
                           onChange={(e) => setIsFallback(e.target.checked)}
                        />
                     </div>
                     <div>
                        <div className="font-bold text-blue-800 text-sm mb-1 flex items-center">
                           <Coffee size={14} className="mr-1.5"/> 将“无加料”场景映射至此分组
                        </div>
                        <div className="text-xs text-blue-600/80 leading-relaxed">
                           开启后，当用户下单未选择任何加料时，系统将自动使用该分组的配方及甜度。（注意只能设置一个兜底分组）
                        </div>
                     </div>
                  </label>
               </div>

               <div className="border-t border-[#E8E8E8] pt-6">
                  <div className="flex justify-between items-center mb-4">
                     <h4 className="font-bold text-sm text-[#333]">选择实体加料</h4>
                     <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-2 text-[#999]"/>
                        <input className="pl-8 pr-3 py-1.5 border border-[#E8E8E8] rounded text-xs w-48 focus:border-[#00C06B] focus:outline-none" placeholder="搜索加料名称"/>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                     {MOCK_ALL_ADDONS.map(addon => {
                        const isSelected = selectedAddons.includes(addon.id);
                        return (
                           <div 
                              key={addon.id}
                              onClick={() => toggleAddon(addon.id)}
                              className={`
                                 border rounded p-2 text-sm cursor-pointer flex justify-between items-center transition-colors
                                 ${isSelected ? 'border-[#00C06B] bg-[#00C06B]/5 text-[#00C06B] font-medium' : 'border-[#E8E8E8] text-[#666] hover:border-[#00C06B]'}
                              `}
                           >
                              <span>{addon.name}</span>
                              {isSelected && <CheckCircle2 size={14}/>}
                           </div>
                        )
                     })}
                  </div>
               </div>

            </div>

            <div className="px-6 py-4 border-t border-[#E8E8E8] flex justify-end space-x-3 bg-[#F9F9F9]">
              <button onClick={closeManageModal} className="px-5 py-1.5 border border-[#E8E8E8] rounded text-sm text-[#666] hover:bg-gray-50 bg-white">取消</button>
              <button onClick={handleSaveAddons} className="px-5 py-1.5 bg-[#00C06B] text-white rounded text-sm font-medium hover:bg-[#00A35B]">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};