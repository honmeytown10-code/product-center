import React, { useState } from 'react';
import {
  X, HelpCircle, CheckCircle2, Search, Coffee, ArrowUp, ArrowDown, AlertTriangle
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
  const [addonKeyword, setAddonKeyword] = useState('');
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [notice, setNotice] = useState('');

  const openManageModal = (group: any) => {
    setEditingGroup(group);
    // Mock initializing selected addons
    setSelectedAddons(MOCK_ALL_ADDONS.slice(0, group.count).map(a => a.id));
    setIsFallback(group.isFallback);
    setAddonKeyword('');
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
    setNotice(`已保存“${editingGroup.name}”的加料映射`);
    closeManageModal();
  };

  const moveGroup = (groupId: string, direction: -1 | 1) => {
    setGroups(current => {
      const ordered = [...current].sort((a, b) => a.level - b.level);
      const index = ordered.findIndex(item => item.id === groupId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return current;
      [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
      return ordered.map((item, itemIndex) => ({ ...item, level: itemIndex + 1 }));
    });
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
      {notice && <div className="fixed right-6 top-[76px] z-[120] rounded-md bg-[#1D2129] px-4 py-2.5 text-[13px] text-white shadow-lg">{notice}</div>}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-5">
         <div className="flex items-center gap-3">
            {onBack && (
               <button onClick={onBack} className="mr-4 text-[#666] hover:text-[#333]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
               </button>
            )}
            <strong className="text-[15px] text-[#1D2129]">加料分组</strong>
            <span className="text-[12px] text-[#86909C]">{groups.length} 个分组 · 同一加料只可属于一个分组</span>
         </div>
         <div className="flex space-x-3">
            <button type="button" onClick={() => setPriorityOpen(true)} className="px-4 py-1.5 border border-[#E8E8E8] text-[#333] rounded text-sm hover:bg-gray-50 flex items-center">
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
                     <button type="button" onClick={() => group.count > 0 ? setNotice(`“${group.name}”仍关联 ${group.count} 个加料，请先移除关联`) : setDeleteTarget(group)} className="text-red-500 text-sm hover:underline">删除</button>
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
                        <input value={addonKeyword} onChange={event => setAddonKeyword(event.target.value)} className="pl-8 pr-3 py-1.5 border border-[#E8E8E8] rounded text-xs w-48 focus:border-[#00C06B] focus:outline-none" placeholder="搜索加料名称"/>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                     {MOCK_ALL_ADDONS.filter(addon => addon.name.includes(addonKeyword.trim())).map(addon => {
                        const isSelected = selectedAddons.includes(addon.id);
                        return (
                           <button type="button"
                              key={addon.id}
                              onClick={() => toggleAddon(addon.id)}
                              className={`
                                 border rounded p-2 text-sm cursor-pointer flex justify-between items-center text-left transition-colors
                                 ${isSelected ? 'border-[#00C06B] bg-[#00C06B]/5 text-[#00C06B] font-medium' : 'border-[#E8E8E8] text-[#666] hover:border-[#00C06B]'}
                              `}
                           >
                              <span>{addon.name}</span>
                              {isSelected && <CheckCircle2 size={14}/>}
                           </button>
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
      {priorityOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="加料分组优先级管理">
          <div className="w-[520px] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-[#E8E8E8] px-5">
              <div><strong>优先级管理</strong><span className="ml-3 text-[12px] text-[#86909C]">数字越小优先级越高</span></div>
              <button type="button" onClick={() => setPriorityOpen(false)} aria-label="关闭优先级管理"><X size={20} /></button>
            </div>
            <div className="max-h-[440px] overflow-y-auto p-5 no-scrollbar">
              {[...groups].sort((a, b) => a.level - b.level).map((group, index, ordered) => (
                <div key={group.id} className="mb-2 flex h-12 items-center rounded-md border border-[#E5E7EB] px-3">
                  <b className="mr-3 w-7 text-[#008F4C]">{index + 1}</b><span className="font-medium">{group.name}</span><span className="ml-2 text-[12px] text-[#98A2B3]">{group.count} 个加料</span>
                  <div className="ml-auto flex gap-1"><button type="button" disabled={index === 0} onClick={() => moveGroup(group.id, -1)} aria-label={`上移${group.name}`} className="rounded border p-1.5 disabled:opacity-30"><ArrowUp size={14} /></button><button type="button" disabled={index === ordered.length - 1} onClick={() => moveGroup(group.id, 1)} aria-label={`下移${group.name}`} className="rounded border p-1.5 disabled:opacity-30"><ArrowDown size={14} /></button></div>
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-[#E8E8E8] px-5 py-3"><button type="button" onClick={() => { setPriorityOpen(false); setNotice('加料分组优先级已更新'); }} className="h-9 rounded-md bg-[#00C06B] px-4 text-[13px] font-medium text-white">完成</button></div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" role="alertdialog" aria-modal="true">
          <div className="w-[440px] rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex gap-3"><AlertTriangle size={22} className="shrink-0 text-[#D92D20]" /><div><strong>删除加料分组</strong><p className="mt-2 text-[13px] leading-6 text-[#667085]">确认删除“{deleteTarget.name}”？该分组未关联加料，删除后无法恢复。</p></div></div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="h-9 rounded-md border px-4 text-[13px]">取消</button><button type="button" onClick={() => { setGroups(current => current.filter(item => item.id !== deleteTarget.id)); setNotice(`已删除“${deleteTarget.name}”`); setDeleteTarget(null); }} className="h-9 rounded-md bg-[#D92D20] px-4 text-[13px] font-medium text-white">确认删除</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
