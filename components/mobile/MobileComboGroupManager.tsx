
import React, { useState } from 'react';
import { ChevronLeft, Plus, Lock, Box, ChevronRight, X, ArrowUp, ArrowDown, Trash2, Check, Coffee } from 'lucide-react';
import { LocalComboGroup, LocalComboItem } from './types';
import { Product } from '../../types';

const INITIAL_COMBO_GROUPS: LocalComboGroup[] = [
  {
    id: 'cg_brand_1',
    name: '随心选饮品组',
    source: 'brand',
    isRelativePrice: false,
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    items: [
      { id: 'ci_1', productId: 'prod_1', productName: '槐店生椰拿铁', quantity: 1, isDefault: true, markupPrice: '0', hasPackFee: false },
      { id: 'ci_2', productId: 'prod_6', productName: '手打柠檬茶', quantity: 1, isDefault: false, markupPrice: '0', hasPackFee: false }
    ]
  },
  {
    id: 'cg_store_1',
    name: '自建小食组',
    source: 'store',
    isRelativePrice: true,
    code: 'G001',
    remark: '下午茶套餐专用',
    isRequired: false,
    minSelect: 0,
    maxSelect: 2,
    items: [
      { id: 'ci_3', productId: 'prod_5', productName: '时令水果拼盘', quantity: 1, isDefault: false, markupPrice: '5', hasPackFee: true }
    ]
  }
];

interface Props {
  onBack: () => void;
}

export const MobileComboGroupManager: React.FC<Props> = ({ onBack }) => {
  const [localComboGroups, setLocalComboGroups] = useState<LocalComboGroup[]>(INITIAL_COMBO_GROUPS);
  const [comboModal, setComboModal] = useState<{ show: boolean, type: 'create' | 'edit' | 'view', item?: LocalComboGroup } | null>(null);

  const handleSaveComboGroup = (groupData: LocalComboGroup) => {
    if (comboModal?.type === 'create') {
      setLocalComboGroups(prev => [...prev, groupData]);
    } else {
      setLocalComboGroups(prev => prev.map(g => g.id === groupData.id ? groupData : g));
    }
    setComboModal(null);
  };

  const handleDeleteComboGroup = (id: string) => {
    if (id === 'cg_store_1') {
        alert('该随心配分组已被套餐商品关联，不允许直接删除。请先解除关联。');
        return;
    }
    if (confirm('确认删除此随心配分组吗？')) {
        setLocalComboGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
      <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-base">随心配管理</span>
        <button 
          onClick={() => setComboModal({ show: true, type: 'create' })}
          className="p-2 -mr-2 text-[#00C06B] font-bold text-sm flex items-center"
        >
          <Plus size={18} className="mr-1"/> 新建分组
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 pb-24">
        {localComboGroups.map(group => (
          <div 
            key={group.id} 
            onClick={() => setComboModal({ show: true, type: group.source === 'brand' ? 'view' : 'edit', item: group })}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <div className="flex items-center mb-1">
                  <span className="font-black text-base text-[#1F2129] mr-2">{group.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center ${group.source === 'brand' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                    {group.source === 'brand' && <Lock size={8} className="mr-1"/>}
                    {group.source === 'brand' ? '总部' : '自建'}
                  </span>
                </div>
                {group.remark && <p className="text-xs text-gray-400">{group.remark}</p>}
              </div>
              <ChevronRight size={16} className="text-gray-300"/>
            </div>
            
            <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 bg-gray-50 p-2 rounded-lg">
                <span className={`${group.isRequired ? 'text-red-500 bg-red-50' : 'text-blue-500 bg-blue-50'} px-1.5 py-0.5 rounded text-[10px] font-bold`}>
                    {group.isRequired ? '必选' : '可选'}
                </span>
                <span className="text-gray-400 mx-1">|</span>
                <span>{group.minSelect} 选 {group.maxSelect}</span>
                <span className="text-gray-400 mx-1">|</span>
                <span>共 {group.items.length} 个子商品</span>
            </div>
          </div>
        ))}
        
        {localComboGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center h-60 text-gray-400">
            <Box size={48} className="mb-4 opacity-20"/>
            <span className="text-xs">暂无随心配分组</span>
          </div>
        )}
      </div>

      {comboModal && (
        <ComboGroupFormModal
          onClose={() => setComboModal(null)}
          onSave={handleSaveComboGroup}
          onDelete={handleDeleteComboGroup}
          onAddProduct={() => {}} // Placeholder as mock
          item={comboModal.item}
          type={comboModal.type}
        />
      )}
    </div>
  );
};

const ComboGroupFormModal = ({ onClose, onSave, onDelete, onAddProduct, item, type }: { 
    onClose: () => void, 
    onSave: (data: LocalComboGroup) => void, 
    onDelete: (id: string) => void, 
    onAddProduct: () => void,
    item?: LocalComboGroup, 
    type: 'create' | 'edit' | 'view'
}) => {
    const isView = type === 'view';
    const isBrand = item?.source === 'brand';
    
    const [name, setName] = useState(item?.name || '');
    const [isRelativePrice, setIsRelativePrice] = useState(item?.isRelativePrice || false);
    const [code, setCode] = useState(item?.code || '');
    const [remark, setRemark] = useState(item?.remark || '');
    
    const [isRequired, setIsRequired] = useState(item?.isRequired ?? true);
    const [minSelect, setMinSelect] = useState(item?.minSelect || 1);
    const [maxSelect, setMaxSelect] = useState(item?.maxSelect || 1);
    
    const [items, setItems] = useState<LocalComboItem[]>(item?.items || []);

    const handleAddItemMock = () => {
        const newItem: LocalComboItem = {
            id: `ci_new_${Date.now()}`,
            productId: 'prod_mock',
            productName: '新添加商品 (Mock)',
            quantity: 1,
            isDefault: false,
            markupPrice: '0',
            hasPackFee: false
        };
        setItems([...items, newItem]);
    };

    const handleUpdateItem = (id: string, updates: Partial<LocalComboItem>) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleSort = (index: number, direction: 'up' | 'down') => {
        const newItems = [...items];
        if (direction === 'up' && index > 0) {
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        } else if (direction === 'down' && index < newItems.length - 1) {
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        }
        setItems(newItems);
    };

    const handleSave = () => {
        if (!name) return;
        const groupData: LocalComboGroup = {
            id: item?.id || `cg_store_${Date.now()}`,
            name,
            source: item?.source || 'store',
            isRelativePrice,
            code,
            remark,
            isRequired,
            minSelect,
            maxSelect,
            items
        };
        onSave(groupData);
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in">
            <div className="flex-1" onClick={onClose}></div>
            <div className="bg-white rounded-t-[24px] overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-[#1F2129]">
                            {type === 'create' ? '新建随心配分组' : (isBrand ? '随心配详情 (只读)' : '编辑随心配分组')}
                        </h3>
                    </div>
                    <button onClick={onClose} className="bg-white p-1.5 rounded-full text-gray-500 shadow-sm"><X size={18}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-8 bg-[#F8FAFB]">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">基础信息</h4>
                        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1.5 block">分组名称 <span className="text-red-500">*</span></label>
                                <input 
                                    value={name} onChange={e => setName(e.target.value)} disabled={isView}
                                    className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none ${isView ? 'bg-gray-50 text-gray-500' : 'bg-white focus:border-[#00C06B]'}`} 
                                    placeholder="请输入分组名称"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <div className="text-sm font-bold text-gray-800">开启相对价</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5 max-w-[240px] leading-tight">以默认子商品的加价为基础，其他子商品加价将基于此计算。</div>
                                </div>
                                <div onClick={() => !isView && setIsRelativePrice(!isRelativePrice)} className={`w-11 h-6 rounded-full relative transition-colors ${isView ? 'opacity-60' : 'cursor-pointer'} ${isRelativePrice ? 'bg-[#00C06B]' : 'bg-gray-200'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isRelativePrice ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">分组编码</label>
                                    <input value={code} onChange={e => setCode(e.target.value)} disabled={isView} className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none ${isView ? 'bg-gray-50' : 'bg-white'}`} placeholder="选填"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">备注</label>
                                    <input value={remark} onChange={e => setRemark(e.target.value)} disabled={isView} className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none ${isView ? 'bg-gray-50' : 'bg-white'}`} placeholder="选填"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">分组设置</h4>
                        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-2 block">选择类型</label>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button onClick={() => !isView && setIsRequired(true)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${isRequired ? 'bg-white text-[#00C06B] shadow-sm' : 'text-gray-500'}`}>必选</button>
                                    <button onClick={() => !isView && setIsRequired(false)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${!isRequired ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-500'}`}>可选</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-2 block">数量限制 (最少 / 最多)</label>
                                <div className="flex items-center space-x-3">
                                    <div className="flex-1 flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                                        <span className="text-xs text-gray-400 mr-2">Min</span>
                                        <input type="number" value={minSelect} onChange={e => setMinSelect(Number(e.target.value))} disabled={isView} className="flex-1 bg-transparent text-sm font-bold text-center outline-none"/>
                                    </div>
                                    <span className="text-gray-300">-</span>
                                    <div className="flex-1 flex items-center border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                                        <span className="text-xs text-gray-400 mr-2">Max</span>
                                        <input type="number" value={maxSelect} onChange={e => setMaxSelect(Number(e.target.value))} disabled={isView} className="flex-1 bg-transparent text-sm font-bold text-center outline-none"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">子商品配置 ({items.length})</h4>
                            {!isView && (
                                <button onClick={handleAddItemMock} className="text-[#00C06B] text-xs font-bold flex items-center bg-green-50 px-2 py-1 rounded-lg">
                                    <Plus size={12} className="mr-1"/> 添加商品
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {items.map((subItem, idx) => (
                                <div key={subItem.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400 mr-3"><Coffee size={16}/></div>
                                            <span className="font-bold text-sm text-[#1F2129]">{subItem.productName}</span>
                                        </div>
                                        {!isView && (
                                            <div className="flex items-center space-x-1">
                                                <button onClick={() => handleSort(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-300 hover:text-black disabled:opacity-30"><ArrowUp size={14}/></button>
                                                <button onClick={() => handleSort(idx, 'down')} disabled={idx === items.length - 1} className="p-1 text-gray-300 hover:text-black disabled:opacity-30"><ArrowDown size={14}/></button>
                                                <div className="w-px h-3 bg-gray-200 mx-1"></div>
                                                <button onClick={() => handleRemoveItem(subItem.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="flex items-center border border-gray-100 rounded-lg px-2 py-1.5 bg-gray-50">
                                            <span className="text-[10px] text-gray-400 mr-2">数量</span>
                                            <input type="number" value={subItem.quantity} onChange={e => handleUpdateItem(subItem.id, { quantity: Number(e.target.value) })} disabled={isView} className="flex-1 bg-transparent text-xs font-bold text-right outline-none"/>
                                        </div>
                                        <div className="flex items-center border border-gray-100 rounded-lg px-2 py-1.5 bg-gray-50">
                                            <span className="text-[10px] text-gray-400 mr-2">加价</span>
                                            <input type="number" value={subItem.markupPrice} onChange={e => handleUpdateItem(subItem.id, { markupPrice: e.target.value })} disabled={isView} className="flex-1 bg-transparent text-xs font-bold text-right outline-none"/>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                        <label className="flex items-center space-x-2">
                                            <div onClick={() => !isView && handleUpdateItem(subItem.id, { isDefault: !subItem.isDefault })} className={`w-3 h-3 rounded-full border flex items-center justify-center ${subItem.isDefault ? 'bg-[#00C06B] border-[#00C06B]' : 'border-gray-300'}`}>
                                                {subItem.isDefault && <Check size={8} className="text-white"/>}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600">默认选中</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <div onClick={() => !isView && handleUpdateItem(subItem.id, { hasPackFee: !subItem.hasPackFee })} className={`w-3 h-3 rounded-full border flex items-center justify-center ${subItem.hasPackFee ? 'bg-[#00C06B] border-[#00C06B]' : 'border-gray-300'}`}>
                                                {subItem.hasPackFee && <Check size={8} className="text-white"/>}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600">收包装费</span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3">
                    {!isBrand && type === 'edit' && (
                        <button onClick={() => onDelete(item!.id)} className="px-4 py-3.5 bg-red-50 text-red-500 rounded-xl font-bold active:scale-95 transition-transform">
                            <Trash2 size={20}/>
                        </button>
                    )}
                    {isBrand ? (
                        <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold">关闭</button>
                    ) : (
                        <button onClick={handleSave} className={`flex-1 py-3.5 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-transform ${name ? 'bg-[#1F2129] text-white' : 'bg-gray-200 text-gray-400'}`} disabled={!name}>
                            保存
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
