
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check, Info, Layers, AlertCircle } from 'lucide-react';
import { BrandConfig, ChannelGroup } from '../../types';
import { Switch } from './OpsCommon';

const ALL_CHANNELS = [
  { id: 'pos', label: 'POS收银' },
  { id: 'mini_dine', label: '小程序堂食' },
  { id: 'mini_pickup', label: '小程序自提' },
  { id: 'mini_take', label: '小程序外卖' },
  { id: 'meituan', label: '美团外卖' },
  { id: 'taobao', label: '淘宝闪购' },
  { id: 'jingdong', label: '京东外卖' },
];

interface Props {
  config: BrandConfig;
  onChange: (config: BrandConfig) => void;
}

export const OpsChannelGroupingConfig: React.FC<Props> = ({ config, onChange }) => {
  const isEnabled = config.enableChannelGrouping ?? false;
  const groups = config.channelGroups || [];
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  // Calculate used channels excluding current editing group
  const getUsedChannels = (excludeGroupId?: string | null) => {
    const used = new Set<string>();
    groups.forEach(g => {
      if (g.id !== excludeGroupId) {
        g.channels.forEach(c => used.add(c));
      }
    });
    return used;
  };

  const handleOpenModal = (group?: ChannelGroup) => {
    if (group) {
      setEditingId(group.id);
      setGroupName(group.name);
      setGroupDesc(group.description || '');
      setSelectedChannels(group.channels);
    } else {
      setEditingId(null);
      setGroupName('');
      setGroupDesc('');
      setSelectedChannels([]);
    }
    setModalOpen(true);
  };

  const handleSaveGroup = () => {
    if (!groupName) return;
    
    let newGroups = [...groups];
    if (editingId) {
      newGroups = newGroups.map(g => g.id === editingId ? { ...g, name: groupName, description: groupDesc, channels: selectedChannels } : g);
    } else {
      newGroups.push({
        id: `cg_${Date.now()}`,
        name: groupName,
        description: groupDesc,
        channels: selectedChannels
      });
    }
    onChange({ ...config, channelGroups: newGroups });
    setModalOpen(false);
  };

  const handleDeleteGroup = (id: string) => {
    if(confirm('确认删除该分组吗？')) {
      onChange({ ...config, channelGroups: groups.filter(g => g.id !== id) });
    }
  };

  const usedChannels = getUsedChannels(editingId);

  return (
    <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm mt-8">
        <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
                <h4 className="text-lg font-black text-gray-900 flex items-center">
                    <Layers className="mr-2 text-orange-500" size={20}/>
                    POS商品沽清渠道展示配置
                </h4>
                <p className="text-sm text-gray-400 mt-1">开启后，商品沽清时将按配置的分组展示渠道</p>
            </div>
            <Switch active={isEnabled} onClick={() => onChange({ ...config, enableChannelGrouping: !isEnabled })} />
        </div>

        {isEnabled && (
            <div className="animate-in fade-in slide-in-from-top-2">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6">
                    <div className="flex items-center text-xs text-orange-600 font-bold mb-4 bg-orange-100/50 p-3 rounded-xl border border-orange-100">
                        <Info size={14} className="mr-2 shrink-0"/>
                        每个渠道仅能归属于一个分组，未分配的渠道将不显示在分组视图中（或显示在“其他”）。
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {groups.map(group => (
                            <div key={group.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:border-orange-300 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-gray-800">{group.name}</h5>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(group)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><Edit2 size={14}/></button>
                                        <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded text-gray-500"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                                {group.description && <p className="text-xs text-gray-400 mb-3">{group.description}</p>}
                                <div className="flex flex-wrap gap-1.5">
                                    {group.channels.map(c => {
                                        const label = ALL_CHANNELS.find(ch => ch.id === c)?.label || c;
                                        return <span key={c} className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded">{label}</span>
                                    })}
                                    {group.channels.length === 0 && <span className="text-[10px] text-gray-300 italic">未选择渠道</span>}
                                </div>
                            </div>
                        ))}
                        
                        <button onClick={() => handleOpenModal()} className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/10 transition-all min-h-[120px]">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2 group-hover:bg-orange-100 transition-colors">
                                <Plus size={20}/>
                            </div>
                            <span className="text-xs font-bold">新建渠道分组</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {modalOpen && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl w-[500px] overflow-hidden shadow-2xl animate-in zoom-in-95">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-black text-gray-800">{editingId ? '编辑分组' : '新建分组'}</h3>
                        <button onClick={() => setModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                    </div>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1.5">分组名称 <span className="text-red-500">*</span></label>
                            <input value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500 transition-colors" placeholder="例如：堂食, 外卖"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1.5">分组描述 (选填)</label>
                            <input value={groupDesc} onChange={e => setGroupDesc(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500 transition-colors" placeholder="例如：包含所有外卖平台渠道"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-2">包含渠道</label>
                            <div className="space-y-2">
                                {ALL_CHANNELS.map(ch => {
                                    const isUsed = usedChannels.has(ch.id);
                                    const isSelected = selectedChannels.includes(ch.id);
                                    return (
                                        <div 
                                            key={ch.id} 
                                            onClick={() => {
                                                if (isUsed) return;
                                                if (isSelected) setSelectedChannels(prev => prev.filter(id => id !== ch.id));
                                                else setSelectedChannels(prev => [...prev, ch.id]);
                                            }}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isUsed ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'} ${isSelected ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600'}`}
                                        >
                                            <span className="text-sm font-bold">{ch.label}</span>
                                            {isUsed ? (
                                                <span className="text-[10px] text-gray-400">已被其他分组占用</span>
                                            ) : (
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                                                    {isSelected && <Check size={12} className="text-white"/>}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                        <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-white transition-all">取消</button>
                        <button onClick={handleSaveGroup} disabled={!groupName} className={`px-6 py-2.5 rounded-xl text-white text-xs font-black shadow-lg transition-all ${groupName ? 'bg-[#1F2129] hover:bg-black active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}>保存</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
