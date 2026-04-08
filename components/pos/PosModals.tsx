
import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, RotateCcw, Lock, Clock3, AlertTriangle, Delete, Layers, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight, Table } from 'lucide-react';
import { useProducts } from '../../context';
import { CHANNEL_TABS, SHELF_VIEW_TABS, ChannelType, ChannelTabType, NumpadInput, ChannelTag } from './PosCommon';
import { ChannelGroup } from '../../types';

// --- Shelf Action Dialog ---
export const ShelfActionDialog = ({
  open,
  data, 
  onClose,
  onConfirm,
  isShelvesUnited,
  enableChannelGrouping,
  channelGroups
}: {
  open: boolean;
  data: { item?: any; items?: any[]; action: 'on' | 'off'; targetChannel: ChannelType; isAllView: boolean; visibleChannels?: string[] };
  onClose: () => void;
  onConfirm: (updates: Record<string, 'on_shelf' | 'off_shelf'>) => void;
  isShelvesUnited: boolean;
  enableChannelGrouping?: boolean;
  channelGroups?: ChannelGroup[];
}) => {
  const isBatch = !!data.items;
  const items = isBatch ? (data.items || []) : (data.item ? [data.item] : []);
  const count = items.length;
  const name = isBatch ? `${count}个商品` : data.item?.name;
  
  // Calculate which channels are mapped for ALL selected items
  const validChannels = useMemo(() => {
     return CHANNEL_TABS.map(t => t.id).filter(chId => {
         return items.every(i => {
             const dataKey = chId === 'mini_dine' || chId === 'mini_take' || chId === 'mini_pickup' ? 'mini' : chId;
             return i.channels[dataKey as ChannelTabType] !== 'unmapped';
         });
     });
  }, [items]);

  // State for single product channel statuses
  const [channelStatus, setChannelStatus] = useState<Record<string, 'on_shelf' | 'off_shelf'>>({});
  
  // State for batch action selected channels
  const [batchSelectedChannels, setBatchSelectedChannels] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    
    if (isBatch) {
        setBatchSelectedChannels(validChannels);
    } else if (data.item) {
        const initialStatus: Record<string, 'on_shelf' | 'off_shelf'> = {};
        validChannels.forEach(ch => {
            const dataKey = ch === 'mini_dine' || ch === 'mini_take' || ch === 'mini_pickup' ? 'mini' : ch;
            const status = data.item.channels[dataKey as ChannelTabType] || 'off_shelf';
            initialStatus[ch] = isShelvesUnited ? data.item.status : status;
        });
        setChannelStatus(initialStatus);
    }
  }, [open, data, validChannels, isBatch, isShelvesUnited]);

  const toggleChannelStatus = (chId: string) => {
      if (isShelvesUnited) return; // locked
      setChannelStatus(prev => ({
          ...prev,
          [chId]: prev[chId] === 'on_shelf' ? 'off_shelf' : 'on_shelf'
      }));
  };

  const toggleGroupStatus = (groupChannels: string[], targetStatus?: 'on_shelf' | 'off_shelf') => {
      if (isShelvesUnited) return; // locked
      const validGroupChannels = groupChannels.filter(c => validChannels.includes(c));
      if (validGroupChannels.length === 0) return;
      
      setChannelStatus(prev => {
          const next = { ...prev };
          const allOn = validGroupChannels.every(c => prev[c] === 'on_shelf');
          const newStatus = targetStatus || (allOn ? 'off_shelf' : 'on_shelf');
          validGroupChannels.forEach(c => { next[c] = newStatus; });
          return next;
      });
  };

  const handleAllChannels = (status: 'on_shelf' | 'off_shelf') => {
      setChannelStatus(prev => {
          const next = { ...prev };
          validChannels.forEach(c => { next[c] = status; });
          return next;
      });
  };

  const toggleBatchChannel = (chId: string) => {
      if (isShelvesUnited) return; // locked
      setBatchSelectedChannels(prev => prev.includes(chId) ? prev.filter(c => c !== chId) : [...prev, chId]);
  };

  const toggleBatchGroup = (groupChannels: string[]) => {
      if (isShelvesUnited) return; // locked
      const validGroupChannels = groupChannels.filter(c => validChannels.includes(c));
      if (validGroupChannels.length === 0) return;
      
      const allSelected = validGroupChannels.every(c => batchSelectedChannels.includes(c));
      if (allSelected) {
          setBatchSelectedChannels(prev => prev.filter(c => !validGroupChannels.includes(c)));
      } else {
          const toAdd = validGroupChannels.filter(c => !batchSelectedChannels.includes(c));
          setBatchSelectedChannels(prev => [...prev, ...toAdd]);
      }
  };

  const handleConfirm = () => {
      if (isBatch) {
          const updates: Record<string, 'on_shelf' | 'off_shelf'> = {};
          const status = data.action === 'on' ? 'on_shelf' : 'off_shelf';
          batchSelectedChannels.forEach(ch => { updates[ch] = status; });
          onConfirm(updates);
      } else {
          onConfirm(channelStatus);
      }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-[12px] shadow-2xl w-[500px] overflow-hidden animate-in zoom-in-95 font-sans flex flex-col max-h-[80vh]">
          <div className="pt-6 pb-4 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
             <h3 className="text-xl font-bold text-[#333] flex items-center">
                {isBatch ? '批量' : ''}{actionText}操作
             </h3>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
             <div className="mb-6 text-center">
                <span className="text-[#666] text-base">确认将 <span className="font-bold text-[#333] text-lg mx-1">{name}</span> {actionText}吗？</span>
             </div>

             {isShelvesUnited && (
                 <div className="mb-6 bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start">
                     <Lock size={16} className="text-orange-500 mr-2 mt-0.5 shrink-0"/>
                     <div className="text-sm text-orange-700">
                         <div className="font-bold mb-1">已开启全渠道统一</div>
                         <p className="opacity-90 text-xs">本次操作将自动同步至所有已关联渠道，无需单独勾选。</p>
                     </div>
                 </div>
             )}

             {/* Always show channel selection, but lock it if united */}
             <div className="bg-[#F7F8FA] rounded-xl p-5 border border-[#E8E8E8]">
                 <div className="text-sm font-bold text-gray-700 mb-4">选择生效渠道</div>
                 
                 {enableChannelGrouping ? (
                     // Grouped toggles
                         <div className="space-y-3">
                             {channelGroups?.map(group => {
                                 const gChannels = group.channels.filter(c => CHANNEL_TABS.some(t => t.id === c));
                                 const validGChannels = gChannels.filter(c => validChannels.includes(c));
                                 if (validGChannels.length === 0) return null;
                                 
                                 const isAllSelected = validGChannels.every(c => batchSelectedChannels.includes(c));
                                 
                                 return (
                                     <div 
                                         key={group.id} 
                                         onClick={() => toggleBatchGroup(validGChannels)}
                                         className={`flex items-center justify-between p-4 bg-white border rounded-lg cursor-pointer transition-all hover:border-[#00C06B]/50 ${isAllSelected ? 'border-[#00C06B] shadow-sm' : 'border-gray-200'}`}
                                     >
                                         <div>
                                             <div className="font-bold text-gray-800 text-sm mb-1">{group.name}</div>
                                             <div className="text-xs text-gray-500">包含: {validGChannels.map(c => CHANNEL_TABS.find(t => t.id === c)?.label).join(', ')}</div>
                                         </div>
                                         <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAllSelected ? 'bg-[#00C06B] border-[#00C06B]' : 'border-gray-300'}`}>
                                             {isAllSelected && <Check size={14} className="text-white"/>}
                                         </div>
                                     </div>
                                 )
                             })}
                         </div>
                     ) : (
                         // Independent flat toggles
                         <div className="grid grid-cols-2 gap-3">
                             {CHANNEL_TABS.map(tab => {
                                 const isValid = validChannels.includes(tab.id);
                                 const isSelected = batchSelectedChannels.includes(tab.id);
                                 
                                 if (!isValid) return null;
                                 
                                 return (
                                     <div 
                                         key={tab.id}
                                         onClick={() => toggleBatchChannel(tab.id)}
                                         className={`flex items-center justify-between p-3 bg-white border rounded-lg transition-all ${isShelvesUnited ? 'opacity-60 cursor-not-allowed border-gray-200' : `cursor-pointer hover:border-[#00C06B]/50 ${isSelected ? 'border-[#00C06B] shadow-sm' : 'border-gray-200'}`}`}
                                     >
                                         <div className="flex items-center space-x-3">
                                             <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isShelvesUnited ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>{tab.icon}</div>
                                             <span className="font-bold text-[#333] text-sm">{tab.label}</span>
                                         </div>
                                         <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#00C06B] border-[#00C06B]' : 'border-gray-300'}`}>
                                             {isSelected && <Check size={12} className="text-white"/>}
                                         </div>
                                     </div>
                                 )
                             })}
                         </div>
                     )}
                 </div>
          </div>
          
          <div className="p-6 pt-4 border-t border-gray-100 flex space-x-4 shrink-0">
             <button onClick={onClose} className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">取消</button>
             <button 
                 onClick={handleConfirm} 
                 disabled={!isShelvesUnited && batchSelectedChannels.length === 0}
                 className="flex-1 py-3 rounded-lg text-white font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-[#00C06B] hover:bg-[#00A35B]"
             >
                 确认{actionText}
             </button>
          </div>
       </div>
    </div>
  );
};

// --- Shelf Management Modal ---
export const ShelfManagementModal = ({ item, onClose, onConfirm, isShelvesUnited, enableChannelGrouping, channelGroups }: { item: any, onClose: () => void, onConfirm: (updated: any) => void, isShelvesUnited: boolean, enableChannelGrouping?: boolean, channelGroups?: ChannelGroup[] }) => {
   const [localChannels, setLocalChannels] = useState(item.channels);
   const [globalStatus, setGlobalStatus] = useState(item.status);

   const toggleChannel = (chId: ChannelTabType) => {
      if (isShelvesUnited) return;
      const current = localChannels[chId];
      if (current === 'unmapped') return;
      setLocalChannels((prev: any) => ({ ...prev, [chId]: current === 'on_shelf' ? 'off_shelf' : 'on_shelf' }));
   };

   const toggleGroup = (group: ChannelGroup) => {
       if (isShelvesUnited) return;
       const statuses = group.channels.map(ch => localChannels[ch]);
       const validStatuses = statuses.filter(s => s !== 'unmapped');
       if (validStatuses.length === 0) return; // All unmapped

       // Logic: If ALL are ON, turn OFF. Otherwise turn ON.
       const allOn = validStatuses.every(s => s === 'on_shelf');
       const targetStatus = allOn ? 'off_shelf' : 'on_shelf';

       const newState = { ...localChannels };
       group.channels.forEach(ch => {
           if (newState[ch] !== 'unmapped') {
               newState[ch] = targetStatus;
           }
       });
       setLocalChannels(newState);
   };

   const handleBatch = (action: 'on' | 'off') => {
      const newState = { ...localChannels };
      (Object.keys(newState) as ChannelTabType[]).forEach(key => { if (newState[key] !== 'unmapped') newState[key] = action === 'on' ? 'on_shelf' : 'off_shelf'; });
      setLocalChannels(newState);
   };

   const handleConfirm = () => {
       let globalStatus = item.status;
       if (isShelvesUnited) {
           // In unified mode, assume if any valid channel is on_shelf, global is on_shelf
           const hasOn = Object.values(localChannels).some(s => s === 'on_shelf');
           globalStatus = hasOn ? 'on_shelf' : 'off_shelf';
       }
       onConfirm({ ...item, status: globalStatus, channels: localChannels });
   };

   // Render Logic
   const renderContent = () => {
       if (isShelvesUnited) {
           return (
               <div className="space-y-4">
                   <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start">
                       <Lock size={16} className="text-orange-500 mr-2 mt-0.5 shrink-0"/>
                       <div className="text-sm text-orange-700">
                           <div className="font-bold mb-1">已开启全渠道统一</div>
                           <p className="opacity-90 text-xs">本次操作将自动同步至以下所有已关联渠道，不支持单独修改。请点击下方按钮进行一键操作。</p>
                       </div>
                   </div>
                   <div className="bg-white rounded-xl border border-gray-200 p-5">
                       <div className="text-sm font-bold text-gray-700 mb-4">生效渠道 (只读)</div>
                       <div className="flex flex-wrap gap-2">
                           {CHANNEL_TABS.map(tab => {
                               if (localChannels[tab.id] === 'unmapped') return null;
                               return (
                                   <div key={tab.id} className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
                                       <span className="text-gray-400">{tab.icon}</span>
                                       <span className="text-sm text-gray-600 font-medium">{tab.label}</span>
                                   </div>
                               )
                           })}
                       </div>
                   </div>
               </div>
           );
       } else if (enableChannelGrouping && channelGroups.length > 0) {
           return (
               <div className="space-y-4">
                   {channelGroups.map(group => {
                       const groupChannels = group.channels
                           .filter(c => localChannels[c])
                           .map(c => {
                               const def = CHANNEL_TABS.find(t => t.id === c);
                               return { id: c, ...def, status: localChannels[c] };
                           }).filter(c => c.label); // Filter valid

                       if (groupChannels.length === 0) return null;
                       
                       const isUnmappedGroup = groupChannels.every(ch => ch.status === 'unmapped');
                       const allOn = groupChannels.filter(ch => ch.status !== 'unmapped').every(ch => ch.status === 'on_shelf');

                       return (
                           <div key={group.id} className={`bg-white rounded-xl border ${isUnmappedGroup ? 'border-gray-100 opacity-60' : 'border-gray-200'} overflow-hidden shadow-sm`}>
                               {/* Group Header */}
                               <div className="flex items-center justify-between p-4 bg-gray-50/50 border-b border-gray-100">
                                   <div className="flex items-center">
                                       <span className="font-bold text-[#333]">{group.name}</span>
                                   </div>
                                   {!isUnmappedGroup && (
                                       <div onClick={() => toggleGroup(group)} className={`w-14 h-8 rounded-full relative transition-all ${isShelvesUnited ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${allOn ? 'bg-[#3B72FF]' : 'bg-gray-200'}`}>
                                           <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm flex items-center justify-center ${allOn ? 'left-7' : 'left-1'}`}>
                                               {allOn ? <Check size={14} className="text-blue-600"/> : <X size={14} className="text-gray-400"/>}
                                           </div>
                                       </div>
                                   )}
                               </div>
                               {/* Channel List in Group */}
                               <div className="p-4 space-y-3 bg-white">
                                   {groupChannels.map(ch => {
                                       const isOn = ch.status === 'on_shelf';
                                       const isUnmapped = ch.status === 'unmapped';
                                       return (
                                           <div key={ch.id} className="flex items-center justify-between">
                                               <div className="flex items-center">
                                                   <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center mr-3 text-gray-500">{ch.icon}</div>
                                                   <span className="text-sm font-medium text-gray-700">{ch.label}</span>
                                               </div>
                                               <div className="flex items-center">
                                                   {isUnmapped ? (
                                                       <span className="text-[10px] text-red-400 bg-red-50 px-2 py-0.5 rounded font-bold">未建立映射</span>
                                                   ) : (
                                                       <div onClick={() => toggleChannel(ch.id as ChannelTabType)} className={`w-10 h-6 rounded-full relative transition-all ${isShelvesUnited ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isOn ? 'bg-[#00C06B]' : 'bg-gray-200'}`}>
                                                           <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm flex items-center justify-center ${isOn ? 'left-4.5' : 'left-0.5'}`}></div>
                                                       </div>
                                                   )}
                                               </div>
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       );
                   })}
               </div>
           );
       } else {
           // Legacy List View
           return (
               <div className="space-y-3">
                  {CHANNEL_TABS.map(tab => {
                     const status = localChannels[tab.id];
                     if (!status) return null;
                     const isUnmapped = status === 'unmapped';
                     const isOn = status === 'on_shelf';
                     return (
                        <div key={tab.id} className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-all ${isUnmapped ? 'opacity-60 border-gray-100' : 'border-gray-200 hover:border-blue-200'}`}>
                           <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${isUnmapped ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>{tab.icon}</div>
                              <div className="flex flex-col"><span className="font-bold text-[#333]">{tab.label}</span>{isUnmapped && <span className="text-[10px] text-red-500 font-medium">未建立映射</span>}</div>
                           </div>
                           {!isUnmapped && (
                               <div onClick={() => toggleChannel(tab.id as ChannelTabType)} className={`w-14 h-8 rounded-full relative transition-all ${isShelvesUnited ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isOn ? 'bg-[#3B72FF]' : 'bg-gray-200'}`}>
                                   <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm flex items-center justify-center ${isOn ? 'left-7' : 'left-1'}`}>
                                       {isOn ? <Check size={14} className="text-blue-600"/> : <X size={14} className="text-gray-400"/>}
                                   </div>
                               </div>
                           )}
                           {isUnmapped && <div className="px-3 py-1 bg-gray-100 rounded text-xs text-gray-400 font-bold">不可操作</div>}
                        </div>
                     );
                  })}
               </div>
           );
       }
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
         <div className="bg-white rounded-[12px] shadow-2xl w-[600px] overflow-hidden animate-in zoom-in-95 font-sans flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
               <div><h3 className="text-xl font-bold text-[#333]">多渠道上下架管理</h3><p className="text-sm text-gray-500 mt-1">{item.name}</p></div>
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
            </div>
            <div className="p-6 bg-[#F7F8FA] overflow-y-auto">
               {!isShelvesUnited && (
                   <div className="flex space-x-3 mb-6">
                      <button onClick={() => handleBatch('on')} className="flex-1 bg-white border border-gray-200 text-blue-600 font-bold py-3 rounded-lg shadow-sm hover:border-blue-400 hover:shadow-md transition-all active:scale-95">一键全渠道上架</button>
                      <button onClick={() => handleBatch('off')} className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-lg shadow-sm hover:border-gray-400 hover:shadow-md transition-all active:scale-95">一键全渠道下架</button>
                   </div>
               )}
               {renderContent()}
            </div>
            <div className="p-6 border-t border-gray-100 bg-white shrink-0">
               {isShelvesUnited ? (
                   <div className="flex space-x-3">
                       {globalStatus === 'on_shelf' ? (
                           <button onClick={() => handleBatch('off')} className="flex-1 h-12 bg-white border border-gray-200 text-gray-600 text-lg font-bold rounded-xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all">下架</button>
                       ) : (
                           <button onClick={() => handleBatch('on')} className="flex-1 h-12 bg-[#3B72FF] text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all">上架</button>
                       )}
                   </div>
               ) : (
                   <button onClick={handleConfirm} className="w-full h-12 bg-[#3B72FF] text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all">确认修改</button>
               )}
            </div>
         </div>
      </div>
   );
};

// --- Clearance Settings Modal ---
export const ClearanceSettingsModal: React.FC<{ product?: any; batchIds?: string[]; isBatch?: boolean; onClose: () => void; onConfirm: () => void; activeChannel: ChannelType | string }> = ({ product, batchIds, isBatch, onClose, onConfirm, activeChannel }) => {
  const { activeBrandId, brandConfigs } = useProducts();
  const currentConfig = brandConfigs[activeBrandId];
  const isStockShared = currentConfig?.features.stock_shared ?? true;
  const enableChannelGrouping = currentConfig?.enableChannelGrouping ?? false;
  const channelGroups = currentConfig?.channelGroups || [];

  const title = isBatch ? `批量沽清 (${batchIds?.length}个商品)` : product?.name;
  const isMultiSpec = !isBatch && product?.hasMultipleSpecs;

  // Resolve valid channels for stockout operation
  const resolvedChannels = useMemo(() => {
      return CHANNEL_TABS.map(t => t.id).filter(chId => {
          if (isBatch) return true; // simplified for batch
          if (!product) return false;
          const dataKey = chId === 'mini_dine' || chId === 'mini_take' || chId === 'mini_pickup' ? 'mini' : chId;
          return product.channels[dataKey as ChannelTabType] !== 'unmapped';
      });
  }, [product, isBatch]);

  const [selectedChannels, setSelectedChannels] = useState<string[]>(resolvedChannels);

  useEffect(() => {
      setSelectedChannels(resolvedChannels);
  }, [resolvedChannels, isStockShared]);

  const toggleChannel = (c: string) => {
    if (isStockShared) return; 
    setSelectedChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const renderChannelSelector = () => {
      if (enableChannelGrouping && !isStockShared) {
          // Find unassigned channels
          const assignedChannels = new Set(channelGroups.flatMap(g => g.channels));
          const unassignedChannels = resolvedChannels.filter(c => !assignedChannels.has(c));
          
          const groupsToRender = [...channelGroups];
          if (unassignedChannels.length > 0) {
              groupsToRender.push({
                  id: 'ungrouped_fallback',
                  name: '未分组渠道',
                  channels: unassignedChannels
              });
          }

          return groupsToRender.map(group => {
              const groupChannels = group.channels.filter(c => resolvedChannels.includes(c));
              if (groupChannels.length === 0) return null;
              
              const isGroupActive = groupChannels.every(id => selectedChannels.includes(id));
              const isLocked = false; // groups only render in independent mode, so never locked here
              
              return (
                  <div 
                    key={group.id}
                    onClick={() => {
                        if (isGroupActive) setSelectedChannels(prev => prev.filter(id => !groupChannels.includes(id)));
                        else setSelectedChannels(prev => Array.from(new Set([...prev, ...groupChannels])));
                    }}
                    className={`
                        flex flex-col p-3 rounded-xl border-2 transition-all cursor-pointer min-w-[140px] relative
                        ${isGroupActive ? 'bg-[#00C06B]/10 border-[#00C06B] text-[#00C06B]' : 'bg-white border-gray-200 text-gray-500 hover:border-[#00C06B]/50'}
                    `}
                  >
                      <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{group.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                          {groupChannels.map(cId => (
                              <span key={cId} className={`text-[10px] px-1.5 py-0.5 rounded border ${isGroupActive ? 'bg-white border-[#00C06B]/30 text-[#00C06B]' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                  {CHANNEL_TABS.find(t => t.id === cId)?.label || cId}
                              </span>
                          ))}
                      </div>
                  </div>
              );
          });
      }

      // Legacy flat channels or Shared mode
      return resolvedChannels.map(chId => {
          const tab = CHANNEL_TABS.find(t => t.id === chId);
          const isActive = selectedChannels.includes(chId);
          const isLocked = isStockShared;

          return (
              <div 
                key={chId}
                onClick={() => toggleChannel(chId)}
                className={`flex items-center px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${isActive ? 'border-[#00C06B] bg-[#00C06B]/10 text-[#00C06B]' : 'border-gray-200 bg-white text-gray-600'} ${isLocked ? 'opacity-80 cursor-not-allowed' : 'hover:border-[#00C06B]/50'}`}
              >
                  <span className="text-sm font-bold mr-2">{tab?.label}</span>
                  {isLocked && <Lock size={12} className="text-orange-400"/>}
              </div>
          );
      });
  };

  // State management for 2-column unified layout
  const [globalMethod, setGlobalMethod] = useState<'day' | 'long'>('day');
  
  // Logic for default dayNextLimit (if product has maxStock, use it, else empty string representing infinite)
  const defaultNextLimit = product?.maxStock !== undefined && product?.maxStock !== null ? String(product.maxStock) : '';
  
  const [targetValues, setTargetValues] = useState({ dayRemain: '0', dayNextLimit: defaultNextLimit, longLimit: '0' });
  const [activeField, setActiveField] = useState<'dayRemain' | 'dayNextLimit' | 'longLimit'>('dayRemain');
  
  // Selected specs for multi-spec operations
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  const handleMethodChange = (m: 'day' | 'long') => {
      setGlobalMethod(m);
      setActiveField(m === 'day' ? 'dayRemain' : 'longLimit');
  };

  const handleNumpadInput = (key: string) => {
     const updateValue = (current: string) => {
         if (key === 'backspace') return current.slice(0, -1);
         if (key === 'clear') return '';
         if (key === '.') return current.includes('.') ? current : current + '.';
         return current + key;
     };
     setTargetValues(prev => ({ ...prev, [activeField]: updateValue(prev[activeField]) }));
  };

  const toggleSpec = (id: string) => {
      setSelectedSpecs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllSpecs = () => {
      if (selectedSpecs.length === product.specs.length) setSelectedSpecs([]);
      else setSelectedSpecs(product.specs.map((s:any) => s.id));
  };

  const canConfirm = isMultiSpec ? selectedSpecs.length > 0 : true;

  // View toggle for stock details
  const [showStockDetails, setShowStockDetails] = useState(false);
  const showDetailsButton = !isStockShared && !isBatch;

  // Prepare specs for table view (handles both single and multi-spec)
  const tableSpecs = isMultiSpec ? product?.specs : [{ id: 'default', name: product?.spec || '标准', stock: product?.stock }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className={`bg-white rounded-[24px] h-[680px] shadow-2xl flex overflow-hidden transform scale-100 transition-all font-sans ${showStockDetails ? 'w-[800px]' : 'w-[880px]'}`}>
            
            {/* Left Panel: Settings Workspace */}
            <div className="flex-1 flex flex-col bg-white relative border-r border-gray-100 min-w-0">
               <div className="p-8 pb-6 flex justify-between items-start shrink-0 border-b border-gray-50">
                  <div>
                     <h3 className="text-2xl font-black text-gray-900 leading-tight">{title}</h3>
                     {!isBatch && !isMultiSpec && (
                         <div className="text-sm font-bold text-gray-400 mt-2 flex items-center gap-2">
                            <span className="text-gray-600">¥{product?.price?.toFixed(2)}</span> 
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{product?.spec}</span>
                            {isStockShared && (
                                <>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="text-gray-500">剩余: {product?.stock ?? 0}</span>
                                </>
                            )}
                         </div>
                     )}
                  </div>
                  {showDetailsButton && (
                      <button 
                          onClick={() => setShowStockDetails(!showStockDetails)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${showStockDetails ? 'bg-[#00C06B]/10 border-[#00C06B] text-[#00C06B]' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#00C06B]/30 hover:text-[#00C06B]'}`}
                      >
                          <Table size={16} />
                          {showStockDetails ? '返回操作面板' : '查看各渠道库存'}
                      </button>
                  )}
               </div>

               {showStockDetails ? (
                   <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar animate-in fade-in zoom-in-95 duration-200">
                       <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                           <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                               <div className="font-bold text-sm text-gray-700 flex items-center">
                                   <Layers size={16} className="mr-2 text-gray-500" />
                                   商品多渠道库存明细
                               </div>
                           </div>
                           <div className="overflow-x-auto">
                               <table className="w-full text-left text-sm">
                                   <thead>
                                       <tr className="bg-white border-b border-gray-100">
                                           <th className="py-3 px-4 font-bold text-gray-500 bg-gray-50/50 sticky left-0 z-10 w-[120px]">{isMultiSpec ? '规格名称' : '商品规格'}</th>
                                           {resolvedChannels.map(chId => (
                                               <th key={chId} className="py-3 px-4 font-bold text-gray-500 whitespace-nowrap">
                                                   {CHANNEL_TABS.find(t => t.id === chId)?.label || chId}
                                               </th>
                                           ))}
                                       </tr>
                                   </thead>
                                   <tbody>
                                       {tableSpecs?.map((spec: any, idx: number) => (
                                           <tr key={spec.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                               <td className="py-3 px-4 font-bold text-gray-800 bg-white sticky left-0 z-10">{spec.name}</td>
                                               {resolvedChannels.map(chId => {
                                                   // Use channelStocks if available, otherwise fallback to standard logic
                                                   let stock = '0';
                                                   if (product?.channelStocks && product.channelStocks[chId] !== undefined) {
                                                        if (typeof product.channelStocks[chId] === 'object') {
                                                            stock = String(product.channelStocks[chId][spec.name] ?? 0);
                                                        } else {
                                                            stock = String(product.channelStocks[chId] ?? 0); // single spec logic
                                                        }
                                                   } else {
                                                       stock = String(spec.stock ?? 0); // Fallback to base spec stock
                                                   }
                                                   const isZero = stock === '0';
                                                   return (
                                                       <td key={chId} className="py-3 px-4">
                                                           <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${isZero ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                                                               {stock}
                                                           </span>
                                                       </td>
                                                   );
                                               })}
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       </div>
                       <div className="mt-4 text-xs text-gray-400 flex items-center justify-center">
                           <AlertTriangle size={14} className="mr-1" />
                           此页面为只读视图，请返回操作面板进行库存修改
                       </div>
                   </div>
               ) : (
                   <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar space-y-8 animate-in fade-in zoom-in-95 duration-200">
                   {/* Method Toggle */}
                   <div>
                       <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">沽清类型</div>
                       <div className="flex space-x-4">
                           <button onClick={() => handleMethodChange('day')} className={`flex-1 py-3.5 rounded-xl text-[15px] font-black transition-all border-2 ${globalMethod === 'day' ? 'bg-[#00C06B]/10 border-[#00C06B] text-[#00C06B] shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>当日沽清</button>
                           <button onClick={() => handleMethodChange('long')} className={`flex-1 py-3.5 rounded-xl text-[15px] font-black transition-all border-2 ${globalMethod === 'long' ? 'bg-[#00C06B]/10 border-[#00C06B] text-[#00C06B] shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>长期沽清</button>
                       </div>
                   </div>

                   {/* Specs Selection */}
                   {isMultiSpec && (
                       <div>
                           <div className="flex justify-between items-center mb-4">
                               <div className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center">
                                   生效规格 <span className="text-red-500 ml-1">*</span>
                                   <span className="ml-2 text-[10px] text-gray-400 font-normal bg-gray-100 px-1.5 py-0.5 rounded">已选 {selectedSpecs.length}/{product.specs.length}</span>
                               </div>
                               <button onClick={selectAllSpecs} className="text-[#00C06B] text-sm font-bold hover:text-[#00A35B] transition-colors">
                                   {selectedSpecs.length === product.specs.length ? '取消全选' : '全选'}
                               </button>
                           </div>
                           <div className="grid grid-cols-3 gap-3">
                               {product.specs.map((spec: any) => {
                                   const isSelected = selectedSpecs.includes(spec.id);
                                   return (
                                       <div 
                                           key={spec.id} 
                                           onClick={() => toggleSpec(spec.id)}
                                           className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center h-[54px] relative overflow-hidden group ${isSelected ? 'border-[#00C06B] bg-[#00C06B]/5' : 'border-gray-200 bg-white hover:border-[#00C06B]/30'}`}
                                       >
                                           <div className="flex items-center justify-center w-full z-10 relative">
                                               <span className={`font-bold text-[15px] ${isSelected ? 'text-[#00C06B] mr-6' : 'text-gray-800'}`}>{spec.name}</span>
                                               {isSelected && <CheckCircle2 size={18} className="text-[#00C06B] absolute right-0"/>}
                                           </div>
                                           {isStockShared && (
                                               <span className="text-[10px] text-gray-500 mt-0.5 font-normal z-10">剩余: {spec.stock ?? 0}</span>
                                           )}
                                           {isSelected && <div className="absolute inset-0 bg-[#00C06B]/5 z-0 pointer-events-none"></div>}
                                       </div>
                                   )
                               })}
                           </div>
                       </div>
                   )}
                   
                   {/* Inputs */}
                   <div>
                       <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">库存设置</div>
                       {globalMethod === 'day' ? (
                           <div className="grid grid-cols-2 gap-4">
                               <NumpadInput label="今日剩余数量" value={targetValues.dayRemain} active={activeField === 'dayRemain'} onFocus={() => setActiveField('dayRemain')} placeholder="必填"/>
                               <NumpadInput label="次日补足数量" value={targetValues.dayNextLimit} active={activeField === 'dayNextLimit'} onFocus={() => setActiveField('dayNextLimit')} placeholder="不填默认为无限"/>
                           </div>
                       ) : (
                           <div>
                               <NumpadInput label="剩余可售数量" value={targetValues.longLimit} active={activeField === 'longLimit'} onFocus={() => setActiveField('longLimit')} placeholder="设为0即长期售罄" large/>
                           </div>
                       )}
                   </div>

                   {/* Channel Selector Area */}
                   <div>
                       <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                           操作生效渠道
                           {isStockShared && <span className="ml-3 normal-case text-orange-500 bg-orange-50 px-2 py-0.5 rounded font-bold flex items-center text-[10px]"><Lock size={10} className="mr-1"/> 全渠道锁定</span>}
                       </div>
                       <div className="flex flex-wrap gap-3">
                           {renderChannelSelector()}
                       </div>
                   </div>
               </div>
               )}
               
               {/* Global Lock Info Bar */}
               <div className="px-8 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                   <div className="text-xs font-bold text-gray-500 flex items-center">
                       当前库存规则：
                       {isStockShared ? (
                           <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded flex items-center ml-2"><Lock size={12} className="mr-1"/> 共享库存 (全局同步)</span>
                       ) : enableChannelGrouping ? (
                           <span className="text-[#00C06B] bg-[#00C06B]/10 px-2 py-1 rounded flex items-center ml-2"><Layers size={12} className="mr-1"/> 渠道分组独立</span>
                       ) : (
                           <span className="text-gray-600 bg-gray-200 px-2 py-1 rounded ml-2">全渠道完全独立</span>
                       )}
                   </div>
               </div>
            </div>

            {/* Right Panel: Numpad & Actions */}
            {!showStockDetails && (
                <div className="w-[320px] bg-[#F7F8FA] p-6 flex flex-col justify-between shrink-0 select-none relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2.5 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-500 transition-colors z-10 active:scale-90"><X size={20}/></button>
                    
                    <div className="mt-12 grid grid-cols-3 gap-3 flex-1 content-start mb-6">
                       {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(num => (
                           <button key={num} onClick={() => handleNumpadInput(num.toString())} className="h-[72px] bg-white rounded-2xl shadow-sm border border-gray-200 text-2xl font-black text-gray-800 hover:bg-white hover:border-[#00C06B] hover:text-[#00C06B] hover:shadow-md active:bg-[#00C06B]/5 active:scale-95 transition-all">{num}</button>
                       ))}
                       <button onClick={() => handleNumpadInput('backspace')} className="h-[72px] bg-white rounded-2xl shadow-sm border border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 hover:shadow-md active:scale-95 transition-all flex items-center justify-center"><X size={28}/></button>
                    </div>
                    
                    <div className="space-y-3">
                        <button onClick={() => handleNumpadInput('clear')} className="w-full py-3 text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors">清空当前输入</button>
                        <div className="flex gap-3">
                            {(!isBatch && (product?.status === 'sold_out' || product?.status === 'warning')) && (
                                <button onClick={onConfirm} className="flex-[0.8] h-16 bg-white border-2 border-red-100 text-red-500 rounded-2xl text-lg font-black hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all flex items-center justify-center shadow-sm">取消沽清</button>
                            )}
                            <button 
                                onClick={onConfirm} 
                                disabled={!canConfirm}
                                className={`flex-1 h-16 text-white rounded-2xl text-xl font-black shadow-lg transition-all flex items-center justify-center ${canConfirm ? 'bg-[#00C06B] shadow-[#00C06B]/30 hover:bg-[#00A35B] active:scale-95' : 'bg-gray-300 shadow-none cursor-not-allowed'}`}
                            >
                                确认修改
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
