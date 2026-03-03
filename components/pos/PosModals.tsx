
import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, RotateCcw, Lock, Clock3, AlertTriangle, Delete, Layers, CheckCircle2, RefreshCw } from 'lucide-react';
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
  onConfirm: (channels: ChannelTabType[]) => void;
  isShelvesUnited: boolean;
  enableChannelGrouping?: boolean;
  channelGroups?: ChannelGroup[];
}) => {
  const [selectedChannels, setSelectedChannels] = useState<ChannelTabType[]>([]);

  const isBatch = !!data.items;
  const items = isBatch ? (data.items || []) : (data.item ? [data.item] : []);
  const count = items.length;
  const name = isBatch ? `${count}个商品` : data.item?.name;
  const actionText = data.action === 'on' ? '上架' : '下架';
  const targetLabel = data.isAllView ? '全部渠道' : (SHELF_VIEW_TABS.find(t => t.id === data.targetChannel)?.label || 'POS');
  
  const visibleChannels = data.visibleChannels;
  
  // Special mode: Not unified, but grouped and in "All" view. Force group selection.
  const isGroupMode = !isShelvesUnited && enableChannelGrouping && data.isAllView;

  useEffect(() => {
    if (!open) return;
    
    // If visibleChannels are passed (e.g. from Group view), use them
    if (visibleChannels && visibleChannels.length > 0) {
        const validVisible = visibleChannels.filter(chId => items.every(i => i.channels[chId === 'mini_dine' || chId === 'mini_take' || chId === 'mini_pickup' ? 'mini' : chId] !== 'unmapped'));
        setSelectedChannels(validVisible as ChannelTabType[]);
        return;
    }

    if (isShelvesUnited || (enableChannelGrouping && !data.isAllView)) {
        // Strict lock cases
        setSelectedChannels(CHANNEL_TABS.map(t => t.id));
        return;
    }
    
    if (isGroupMode) {
        // In group mode, default select all *mapped* channels
        // User can then toggle groups
        const allMapped = CHANNEL_TABS.map(t => t.id).filter(chId => items.every(i => i.channels[chId] !== 'unmapped'));
        setSelectedChannels(allMapped);
        return;
    }

    // Default individual independent behavior
    const validChannels = CHANNEL_TABS
        .filter(t => t.id !== data.targetChannel)
        .map(t => t.id);
    const initiallySelected = validChannels.filter(chId => items.every(i => i.channels[chId] !== 'unmapped'));
    setSelectedChannels(initiallySelected);
  }, [open, data, items, isShelvesUnited, enableChannelGrouping, visibleChannels, isGroupMode]);

  const toggleGroup = (groupId: string) => {
      const group = channelGroups?.find(g => g.id === groupId);
      if (!group) return;
      
      const groupChannels = group.channels.filter(c => CHANNEL_TABS.some(t => t.id === c)) as ChannelTabType[];
      const validChannels = groupChannels.filter(c => !items.some(i => i.channels[c] === 'unmapped'));
      
      if (validChannels.length === 0) return;

      const allSelected = validChannels.every(c => selectedChannels.includes(c));
      
      if (allSelected) {
          // Deselect all
          setSelectedChannels(prev => prev.filter(c => !validChannels.includes(c)));
      } else {
          // Select all
          const toAdd = validChannels.filter(c => !selectedChannels.includes(c));
          setSelectedChannels(prev => [...prev, ...toAdd]);
      }
  };

  const renderGroups = () => {
      if (!channelGroups) return null;
      return channelGroups.map(group => {
         const groupChannels = group.channels.filter(c => CHANNEL_TABS.some(t => t.id === c));
         if (groupChannels.length === 0) return null;
         
         const validGroupChannels = groupChannels.filter(c => !items.some(i => i.channels[c as any] === 'unmapped'));
         // If no valid channels in this group for this item, we can disable or hide.
         const isDisabled = validGroupChannels.length === 0;

         const allInGroupSelected = validGroupChannels.length > 0 && validGroupChannels.every(c => selectedChannels.includes(c as ChannelTabType));
         const someInGroupSelected = validGroupChannels.some(c => selectedChannels.includes(c as ChannelTabType));
         
         return (
            <div 
               key={group.id}
               className={`border rounded-xl p-3 transition-all ${isDisabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'} ${allInGroupSelected ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200'}`}
               onClick={() => !isDisabled && toggleGroup(group.id)}
            >
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                     <div className={`w-5 h-5 rounded border mr-2 flex items-center justify-center transition-colors ${allInGroupSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                        {allInGroupSelected && <Check size={12} className="text-white"/>}
                        {!allInGroupSelected && someInGroupSelected && <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>}
                     </div>
                     <span className="font-bold text-sm text-gray-800">{group.name}</span>
                  </div>
               </div>
               <div className="flex flex-wrap gap-1 pl-7">
                  {groupChannels.map(c => {
                     const tab = CHANNEL_TABS.find(t => t.id === c);
                     const isUnmapped = items.some(i => i.channels[c as any] === 'unmapped');
                     return <span key={c} className={`text-[10px] border px-1.5 py-0.5 rounded ${isUnmapped ? 'bg-gray-100 text-gray-400 border-gray-100' : 'bg-white border-gray-200 text-gray-600'}`}>{tab?.label}</span>
                  })}
               </div>
            </div>
         )
      })
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-[12px] shadow-2xl w-[600px] overflow-hidden animate-in zoom-in-95 font-sans">
          <div className="pt-8 pb-4 text-center">
             <h3 className="text-2xl font-bold text-[#333] tracking-tight">{actionText}确认</h3>
             {(isShelvesUnited || (enableChannelGrouping && !isGroupMode)) && (
                 <div className="mt-2 inline-flex items-center bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    <Lock size={12} className="text-orange-500 mr-1.5"/>
                    <span className="text-xs font-bold text-orange-600">
                        {isShelvesUnited ? '已开启全渠道统一上下架，操作将同步至所有渠道' : '已开启渠道分组，操作将同步至分组下所有渠道'}
                    </span>
                 </div>
             )}
             {isGroupMode && (
                 <div className="mt-2 inline-flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <RotateCcw size={12} className="text-blue-500 mr-1.5"/>
                    <span className="text-xs font-bold text-blue-600">渠道分组联动模式，操作将按分组同步</span>
                 </div>
             )}
          </div>
          <div className="px-10 text-center mb-8">
             <span className="text-[#666] text-lg">确认在 <span className="font-bold text-[#333]">{targetLabel}</span> {actionText} <span className="font-bold text-[#333]">{name}</span> 吗？</span>
          </div>
          <div className="mx-8 mb-8 bg-[#F7F8FA] rounded-xl p-6 border border-[#E8E8E8]">
             {(!isShelvesUnited && !enableChannelGrouping) && (
                 <div className="flex items-center mb-4 text-[#666] text-sm font-bold">
                    <RotateCcw size={14} className="mr-2 text-blue-600"/>
                    {visibleChannels ? `选择需要${actionText}的渠道` : (data.isAllView ? `选择需要${actionText}的渠道` : `同步${actionText}其他渠道`)}
                 </div>
             )}
             
             {isGroupMode ? (
                 <div className="flex flex-col gap-3">
                     {renderGroups()}
                 </div>
             ) : (
                 <div className="grid grid-cols-2 gap-3">
                    {CHANNEL_TABS.filter(t => {
                        if (visibleChannels) {
                            return visibleChannels.includes(t.id);
                        }
                        // If standard grouping lock is active, show all
                        // If standard individual mode, filter out current target (unless all view)
                        return (isShelvesUnited || enableChannelGrouping) ? true : (data.isAllView ? true : t.id !== data.targetChannel);
                    }).map(tab => {
                       const isUnmapped = items.some(i => i.channels[tab.id] === 'unmapped');
                       const isChecked = selectedChannels.includes(tab.id);
                       // Lock if United OR (Grouping AND NOT AllView)
                       const isDisabled = isShelvesUnited || (enableChannelGrouping && !data.isAllView) || isUnmapped;
                       
                       return (
                          <div 
                            key={tab.id}
                            onClick={() => {
                                if (isDisabled) return;
                                if (selectedChannels.includes(tab.id)) setSelectedChannels(prev => prev.filter(c => c !== tab.id));
                                else setSelectedChannels(prev => [...prev, tab.id]);
                            }}
                            className={`
                                flex items-center p-3 bg-white border rounded-lg transition-all select-none
                                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-orange-400 hover:shadow-sm'}
                                ${isDisabled && isUnmapped ? 'opacity-60 border-gray-100' : 'border-[#E8E8E8]'}
                                ${isChecked && !isDisabled ? 'border-orange-500' : ''}
                            `}
                          >
                             <div className={`w-5 h-5 rounded border-[1.5px] flex items-center justify-center mr-3 transition-colors ${isChecked ? (isDisabled ? 'bg-gray-300 border-gray-300' : 'bg-[#FF5500] border-[#FF5500]') : 'bg-white border-gray-300'}`}>
                                {isChecked && <Check size={12} className="text-white" strokeWidth={4}/>}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#333]">{tab.label}</span>
                                {isUnmapped && <span className="text-[10px] text-red-500 font-medium mt-0.5">未映射关联</span>}
                             </div>
                          </div>
                       )
                    })}
                 </div>
             )}
          </div>
          <div className="flex p-8 pt-0 gap-4">
             <button onClick={onClose} className="flex-1 h-[56px] rounded-[8px] bg-[#F5F5F5] text-[#666] text-lg font-bold hover:bg-[#E0E0E0] transition-colors">取消</button>
             <button onClick={() => onConfirm(selectedChannels)} className={`flex-1 h-[56px] rounded-[8px] text-white text-lg font-bold transition-all shadow-lg active:scale-95 ${data.action === 'on' ? 'bg-[#3B72FF] hover:bg-[#2F60E8]' : 'bg-[#FF5500] hover:bg-[#E04800]'}`}>确认{actionText}</button>
          </div>
       </div>
    </div>
  );
};

// --- Shelf Management Modal ---
export const ShelfManagementModal = ({ item, onClose, onConfirm }: { item: any, onClose: () => void, onConfirm: (updated: any) => void }) => {
   const { activeBrandId, brandConfigs } = useProducts();
   const currentConfig = brandConfigs[activeBrandId];
   const enableChannelGrouping = currentConfig?.enableChannelGrouping ?? false;
   const channelGroups = currentConfig?.channelGroups || [];

   const [localChannels, setLocalChannels] = useState(item.channels);

   const toggleChannel = (chId: ChannelTabType) => {
      const current = localChannels[chId];
      if (current === 'unmapped') return;
      setLocalChannels((prev: any) => ({ ...prev, [chId]: current === 'on_shelf' ? 'off_shelf' : 'on_shelf' }));
   };

   const toggleGroup = (group: ChannelGroup) => {
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

   // Render Logic
   const renderContent = () => {
       if (enableChannelGrouping && channelGroups.length > 0) {
           return (
               <div className="space-y-4">
                   {channelGroups.map(group => {
                       const groupChannels = group.channels.map(cId => {
                           const def = CHANNEL_TABS.find(t => t.id === cId);
                           return { id: cId, ...def, status: localChannels[cId] };
                       }).filter(c => c.label); // Filter valid

                       const validStatuses = groupChannels.filter(c => c.status !== 'unmapped').map(c => c.status);
                       const isUnmappedGroup = validStatuses.length === 0;
                       const allOn = !isUnmappedGroup && validStatuses.every(s => s === 'on_shelf');
                       
                       return (
                           <div key={group.id} className={`p-4 bg-white rounded-xl border transition-all ${isUnmappedGroup ? 'border-gray-100 opacity-60' : 'border-gray-200 hover:border-blue-200'}`}>
                               <div className="flex items-center justify-between mb-3">
                                   <div className="flex items-center">
                                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${isUnmappedGroup ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
                                           <Layers size={20}/>
                                       </div>
                                       <div className="flex flex-col">
                                           <span className="font-bold text-[#333] text-sm">{group.name}</span>
                                           {isUnmappedGroup && <span className="text-[10px] text-red-500 font-medium">无关联渠道</span>}
                                       </div>
                                   </div>
                                   {!isUnmappedGroup && (
                                       <div onClick={() => toggleGroup(group)} className={`w-14 h-8 rounded-full relative cursor-pointer transition-all ${allOn ? 'bg-[#3B72FF]' : 'bg-gray-200'}`}>
                                           <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm flex items-center justify-center ${allOn ? 'left-7' : 'left-1'}`}>
                                               {allOn ? <Check size={14} className="text-blue-600"/> : <X size={14} className="text-gray-400"/>}
                                           </div>
                                       </div>
                                   )}
                               </div>
                               {/* Channel List in Group */}
                               <div className="pl-[56px] space-y-2">
                                   {groupChannels.map(ch => (
                                       <div key={ch.id} className="flex items-center text-xs text-gray-500">
                                           <div className="w-5 h-5 flex items-center justify-center mr-2">{ch.icon}</div>
                                           <span className="flex-1">{ch.label}</span>
                                           {ch.status === 'unmapped' ? (
                                               <span className="text-red-400 bg-red-50 px-1.5 rounded-[4px] scale-90">未关联</span>
                                           ) : (
                                               <span className={`px-1.5 rounded-[4px] scale-90 font-bold ${ch.status === 'on_shelf' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-100'}`}>
                                                   {ch.status === 'on_shelf' ? '已上架' : '已下架'}
                                               </span>
                                           )}
                                       </div>
                                   ))}
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
                     const isUnmapped = status === 'unmapped';
                     const isOn = status === 'on_shelf';
                     return (
                        <div key={tab.id} className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-all ${isUnmapped ? 'opacity-60 border-gray-100' : 'border-gray-200 hover:border-blue-200'}`}>
                           <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${isUnmapped ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>{tab.icon}</div>
                              <div className="flex flex-col"><span className="font-bold text-[#333]">{tab.label}</span>{isUnmapped && <span className="text-[10px] text-red-500 font-medium">未建立映射</span>}</div>
                           </div>
                           {!isUnmapped && (<div onClick={() => toggleChannel(tab.id)} className={`w-14 h-8 rounded-full relative cursor-pointer transition-all ${isOn ? 'bg-[#3B72FF]' : 'bg-gray-200'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm flex items-center justify-center ${isOn ? 'left-7' : 'left-1'}`}>{isOn ? <Check size={14} className="text-blue-600"/> : <X size={14} className="text-gray-400"/>}</div></div>)}
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
               <div className="flex space-x-3 mb-6">
                  <button onClick={() => handleBatch('on')} className="flex-1 bg-white border border-gray-200 text-blue-600 font-bold py-3 rounded-lg shadow-sm hover:border-blue-400 hover:shadow-md transition-all active:scale-95">一键全渠道上架</button>
                  <button onClick={() => handleBatch('off')} className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-lg shadow-sm hover:border-gray-400 hover:shadow-md transition-all active:scale-95">一键全渠道下架</button>
               </div>
               {renderContent()}
            </div>
            <div className="p-6 border-t border-gray-100 bg-white shrink-0">
               <button onClick={() => onConfirm({ ...item, channels: localChannels })} className="w-full h-12 bg-[#3B72FF] text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all">确认修改</button>
            </div>
         </div>
      </div>
   );
};

// --- Clearance Settings Modal ---
export const ClearanceSettingsModal: React.FC<{ product: any; onClose: () => void; onConfirm: () => void; activeChannel: ChannelType | string }> = ({ product, onClose, onConfirm, activeChannel }) => {
  const { activeBrandId, brandConfigs } = useProducts();
  const currentConfig = brandConfigs[activeBrandId];
  const isStockShared = currentConfig?.features.stock_shared ?? true;
  const enableChannelGrouping = currentConfig?.enableChannelGrouping ?? false;
  const channelGroups = currentConfig?.channelGroups || [];

  const [method, setMethod] = useState<'cycle' | 'total'>('cycle');
  const [cycleMode, setCycleMode] = useState<'day' | 'meal'>('day');
  
  // Resolve activeChannel to a list of channels
  const resolvedChannels = useMemo(() => {
      if (activeChannel === 'all') {
          // Use all defined channels from CHANNEL_TABS to ensure complete coverage (e.g. jingdong)
          return CHANNEL_TABS.map(t => t.id);
      }
      const group = channelGroups.find(g => g.id === activeChannel);
      if (group) return group.channels;
      return [activeChannel];
  }, [activeChannel, channelGroups]);

  const [selectedChannels, setSelectedChannels] = useState<string[]>(() => {
    return resolvedChannels;
  });
  
  useEffect(() => {
      setSelectedChannels(resolvedChannels);
  }, [resolvedChannels]);

  const [formValues, setFormValues] = useState({ dayLimit: '', dayRemain: '0', mealLunchLimit: '', mealLunchRemain: '0', mealDinnerLimit: '', mealDinnerRemain: '0', totalLimit: '' });
  const [activeField, setActiveField] = useState<keyof typeof formValues>('dayLimit');

  useEffect(() => {
     if (method === 'total') setActiveField('totalLimit');
     else if (cycleMode === 'day') setActiveField('dayLimit');
     else setActiveField('mealLunchLimit');
  }, [method, cycleMode]);

  const toggleChannel = (c: string) => {
    // Logic update: Locked if Shared OR if we are inside a specific Group view
    // (User req 3: In single group mode, channels inside cannot be deselected)
    const isGroupView = enableChannelGrouping && channelGroups.some(g => g.id === activeChannel);
    if (isStockShared || isGroupView) return; 
    
    if (selectedChannels.includes(c)) setSelectedChannels(prev => prev.filter(x => x !== c));
    else setSelectedChannels(prev => [...prev, c]);
  };

  const handleNumpadInput = (key: string) => {
     setFormValues(prev => {
        const current = prev[activeField];
        let next = current;
        if (key === 'backspace') next = current.slice(0, -1);
        else if (key === 'clear') next = '';
        else if (key === '.') { if (!current.includes('.')) next = current + '.'; }
        else next = current + key;
        return { ...prev, [activeField]: next };
     });
  };

  // Calculate aggregated stock for a group
  const getGroupStock = (group: ChannelGroup) => {
      const uniqueDataKeys = new Set(group.channels.map(ch => 
          ch === 'mini_dine' || ch === 'mini_take' || ch === 'mini_pickup' ? 'mini' : ch
      ));
      
      let total = 0;
      uniqueDataKeys.forEach(key => {
          total += (product.channelStocks?.[key] || 0);
      });
      return total;
  };

  // Helper to render channel selector
  const renderChannelSelector = () => {
      // Scenario: Grouping Enabled AND All Channels View
      if (enableChannelGrouping && activeChannel === 'all') {
          return channelGroups.map(group => {
              const groupChannelIds = group.channels;
              // Group is active if all its channels are selected
              const isGroupActive = groupChannelIds.every(id => selectedChannels.includes(id));
              // Locked logic: Locked if stock is shared
              const isLocked = isStockShared;
              
              return (
                  <div 
                    key={group.id}
                    onClick={() => {
                        if (isLocked) return;
                        if (isGroupActive) {
                            // Deselect all
                            setSelectedChannels(prev => prev.filter(id => !groupChannelIds.includes(id)));
                        } else {
                            // Select all
                            setSelectedChannels(prev => {
                                const next = new Set(prev);
                                groupChannelIds.forEach(id => next.add(id));
                                return Array.from(next);
                            });
                        }
                    }}
                    className={`
                        flex flex-col p-3 rounded-xl border-2 transition-all cursor-pointer min-w-[140px] relative
                        ${isGroupActive 
                            ? 'bg-blue-50 border-blue-600 text-blue-700' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }
                        ${isLocked ? 'cursor-not-allowed opacity-80' : ''}
                    `}
                  >
                      <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{group.name}</span>
                          {isLocked && <Lock size={12} className="ml-1 text-orange-400"/>}
                      </div>
                      
                      {/* Enhanced Channel Chips Display */}
                      <div className="flex flex-wrap gap-1.5">
                          {groupChannelIds.map(cId => {
                              const def = CHANNEL_TABS.find(t => t.id === cId);
                              const label = def?.label || cId;
                              return (
                                  <span key={cId} className={`text-[10px] px-1.5 py-0.5 rounded border ${isGroupActive ? 'bg-white border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                      {label}
                                  </span>
                              )
                          })}
                      </div>
                  </div>
              );
          });
      }

      // Scenario: Specific Group or No Grouping - Show individual channels
      return resolvedChannels.map(chId => {
          const tab = CHANNEL_TABS.find(t => t.id === chId);
          const label = tab?.label || chId;
          const isActive = selectedChannels.includes(chId);
          
          // Lock if Stock Shared is ON OR if in Group View (User req 3)
          const isGroupView = enableChannelGrouping && channelGroups.some(g => g.id === activeChannel);
          const isLocked = isStockShared || isGroupView;

          return (
              <ChannelTag 
                key={chId}
                label={label} 
                active={isActive} 
                locked={isLocked} 
                onClick={() => toggleChannel(chId)}
              />
          );
      });
  };

  // Check if product is restorable (sold out or partial/warning)
  const isRestorable = product.status === 'sold_out' || product.status === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-[24px] w-[960px] h-[650px] shadow-2xl flex overflow-hidden transform scale-100 transition-all font-sans">
            <div className="flex-1 flex flex-col p-8 bg-white relative">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <h3 className="text-2xl font-black text-gray-900 leading-tight">{product.name}</h3>
                     <div className="text-sm font-bold text-gray-400 mt-1 flex items-center gap-2">
                        <span>¥{product.price}</span> 
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>{product.spec}</span>
                     </div>
                  </div>
                  <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={20}/></button>
               </div>
               
               {/* Inventory Display Logic - Updated: Show Group Stock if Grouping Enabled & All View */}
               {(!isStockShared && activeChannel === 'all') && (
                   <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                           {enableChannelGrouping ? '各分组当前库存' : '各渠道当前库存'}
                       </div>
                       <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                           {enableChannelGrouping ? (
                               // Render Groups Stock (User Req 1)
                               channelGroups.map(group => {
                                   const stock = getGroupStock(group);
                                   return (
                                       <div key={group.id} className="flex flex-col items-center min-w-[60px]">
                                           <span className="text-xs text-gray-500 font-bold mb-1 truncate max-w-[80px]">{group.name}</span>
                                           <span className={`text-sm font-black font-mono ${stock > 0 ? 'text-gray-800' : 'text-red-500'}`}>{stock}</span>
                                       </div>
                                   );
                               })
                           ) : (
                               // Render Individual Channels Stock
                               resolvedChannels.map(ch => {
                                   const dataKey = ch === 'mini_dine' || ch === 'mini_take' || ch === 'mini_pickup' ? 'mini' : ch;
                                   const stock = product.channelStocks?.[dataKey] || 0;
                                   const isUnmapped = product.channels?.[dataKey] === 'unmapped';
                                   const label = CHANNEL_TABS.find(t => t.id === ch)?.label || ch;
                                   return (
                                       <div key={ch} className={`flex flex-col items-center ${isUnmapped ? 'opacity-50' : ''} min-w-[60px]`}>
                                           <span className="text-xs text-gray-500 font-bold mb-1">{label}</span>
                                           {isUnmapped ? <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-500">未映射</span> : <span className={`text-sm font-black font-mono ${stock > 0 ? 'text-gray-800' : 'text-red-500'}`}>{stock}</span>}
                                       </div>
                                   );
                               })
                           )}
                       </div>
                   </div>
               )}

               <div className="bg-gray-100 p-1 rounded-xl flex mb-8 w-fit">
                   <button onClick={() => setMethod('cycle')} className={`px-8 py-2.5 rounded-lg text-sm font-black transition-all ${method === 'cycle' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>按周期沽清</button>
                   <button onClick={() => setMethod('total')} className={`px-8 py-2.5 rounded-lg text-sm font-black transition-all ${method === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>按总数沽清</button>
               </div>
               <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
                  {method === 'cycle' ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                         <div className="flex items-center space-x-6 mb-2">
                             <label className="flex items-center space-x-2 cursor-pointer group"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${cycleMode === 'day' ? 'border-blue-500' : 'border-gray-300 group-hover:border-blue-400'}`}>{cycleMode === 'day' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}</div><input type="radio" className="hidden" checked={cycleMode === 'day'} onChange={() => setCycleMode('day')}/><span className={`font-bold ${cycleMode === 'day' ? 'text-gray-900' : 'text-gray-500'}`}>按营业日</span></label>
                             <label className="flex items-center space-x-2 cursor-pointer group"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${cycleMode === 'meal' ? 'border-blue-500' : 'border-gray-300 group-hover:border-blue-400'}`}>{cycleMode === 'meal' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}</div><input type="radio" className="hidden" checked={cycleMode === 'meal'} onChange={() => setCycleMode('meal')}/><span className={`font-bold ${cycleMode === 'meal' ? 'text-gray-900' : 'text-gray-500'}`}>按餐段</span></label>
                         </div>
                         {cycleMode === 'day' ? (
                             <div className="grid grid-cols-2 gap-6"><NumpadInput label="每日限售数量" value={formValues.dayLimit} active={activeField === 'dayLimit'} onFocus={() => setActiveField('dayLimit')} placeholder="不限制"/><NumpadInput label="今日剩余数量" value={formValues.dayRemain} active={activeField === 'dayRemain'} onFocus={() => setActiveField('dayRemain')}/></div>
                         ) : (
                             <div className="space-y-6"><div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100"><div className="text-xs font-bold text-blue-800 mb-3 flex items-center"><Clock3 size={12} className="mr-1"/> 午市 (10:00-14:00)</div><div className="grid grid-cols-2 gap-4"><NumpadInput label="限售" value={formValues.mealLunchLimit} active={activeField === 'mealLunchLimit'} onFocus={() => setActiveField('mealLunchLimit')} placeholder="不限"/><NumpadInput label="剩余" value={formValues.mealLunchRemain} active={activeField === 'mealLunchRemain'} onFocus={() => setActiveField('mealLunchRemain')}/></div></div><div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100"><div className="text-xs font-bold text-orange-800 mb-3 flex items-center"><Clock3 size={12} className="mr-1"/> 晚市 (17:00-21:00)</div><div className="grid grid-cols-2 gap-4"><NumpadInput label="限售" value={formValues.mealDinnerLimit} active={activeField === 'mealDinnerLimit'} onFocus={() => setActiveField('mealDinnerLimit')} placeholder="不限"/><NumpadInput label="剩余" value={formValues.mealDinnerRemain} active={activeField === 'mealDinnerRemain'} onFocus={() => setActiveField('mealDinnerRemain')}/></div></div></div>
                         )}
                      </div>
                  ) : (
                      <div className="py-10 animate-in fade-in slide-in-from-right-4 duration-300"><NumpadInput label="可售总数量" value={formValues.totalLimit} active={activeField === 'totalLimit'} onFocus={() => setActiveField('totalLimit')} placeholder="不限制" large/></div>
                  )}
                  
                  <div className="mt-8 pt-8 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">生效渠道</div>
                          {(isStockShared || (enableChannelGrouping && (activeChannel !== 'all' || isStockShared))) && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center">
                                  <Lock size={10} className="mr-1"/> 
                                  {enableChannelGrouping ? '渠道分组联动锁定' : '全渠道库存共享锁定'}
                              </span>
                          )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                          {renderChannelSelector()}
                      </div>
                  </div>
               </div>
            </div>
            <div className="w-[340px] bg-gray-50 border-l border-gray-200 p-6 flex flex-col justify-between shrink-0 select-none">
                <div className="grid grid-cols-3 gap-3 flex-1 content-start mb-6">
                   {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(num => (<button key={num} onClick={() => handleNumpadInput(num.toString())} className="h-[72px] bg-white rounded-2xl shadow-sm border border-gray-200 text-2xl font-black text-gray-800 hover:bg-white hover:border-blue-400 hover:text-blue-600 hover:shadow-md active:bg-blue-50 active:scale-95 transition-all">{num}</button>))}
                   <button onClick={() => handleNumpadInput('backspace')} className="h-[72px] bg-white rounded-2xl shadow-sm border border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 hover:shadow-md active:scale-95 transition-all flex items-center justify-center"><Delete size={28}/></button>
                </div>
                <div className="space-y-3">
                    <button onClick={() => handleNumpadInput('clear')} className="w-full py-3 text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors">清空当前输入</button>
                    <div className="flex gap-3">
                        {isRestorable && (
                            <button 
                                onClick={onConfirm} 
                                className="flex-1 h-16 bg-white border-2 border-red-100 text-red-500 rounded-2xl text-lg font-black hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all flex items-center justify-center"
                            >
                                取消沽清
                            </button>
                        )}
                        <button 
                            onClick={onConfirm} 
                            className={`${isRestorable ? 'flex-[1.5]' : 'w-full'} h-16 bg-blue-600 text-white rounded-2xl text-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 active:scale-95 transition-all flex items-center justify-center`}
                        >
                            {isRestorable ? '更新设置' : '确认沽清'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
