
import React, { useState, useMemo } from 'react';
import { Search, Info, CheckCircle, CheckSquare, Ban, Zap, PowerOff } from 'lucide-react';
import { CategoryButton } from './PosCommon';

const MOCK_METHOD_GROUPS = ['全部', '甜度', '温度', '加料', '口味'];
const INITIAL_METHOD_ITEMS = [
    { id: 'm1', name: '标准糖', group: '甜度', status: 'available' },
    { id: 'm2', name: '七分糖', group: '甜度', status: 'available' },
    { id: 'm3', name: '五分糖', group: '甜度', status: 'available' },
    { id: 'm4', name: '三分糖', group: '甜度', status: 'available' },
    { id: 'm5', name: '不加糖', group: '甜度', status: 'available' },
    { id: 'm6', name: '正常冰', group: '温度', status: 'available' },
    { id: 'm7', name: '少冰', group: '温度', status: 'available' },
    { id: 'm8', name: '去冰', group: '温度', status: 'available' },
    { id: 'm9', name: '温热', group: '温度', status: 'disabled' },
    { id: 'm10', name: '热饮', group: '温度', status: 'disabled' },
    { id: 'm11', name: '珍珠', group: '加料', status: 'available' },
    { id: 'm12', name: '椰果', group: '加料', status: 'available' },
    { id: 'm13', name: '布丁', group: '加料', status: 'disabled' },
    { id: 'm14', name: '红豆', group: '加料', status: 'available' },
    { id: 'm15', name: '芋圆', group: '加料', status: 'available' },
    { id: 'm16', name: '微辣', group: '口味', status: 'available' },
    { id: 'm17', name: '中辣', group: '口味', status: 'available' },
    { id: 'm18', name: '特辣', group: '口味', status: 'available' },
    { id: 'm19', name: '免葱', group: '口味', status: 'available' },
    { id: 'm20', name: '免蒜', group: '口味', status: 'available' },
];

export const PosMethodView: React.FC = () => {
  const [methodItems, setMethodItems] = useState(INITIAL_METHOD_ITEMS);
  const [selectedMethodGroup, setSelectedMethodGroup] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [methodActionModal, setMethodActionModal] = useState<{ open: boolean; item: any | null; type: 'enable' | 'disable' }>({ open: false, item: null, type: 'disable' });

  const displayMethodItems = useMemo(() => {
      return methodItems.filter(m => {
          const matchGroup = selectedMethodGroup === '全部' || m.group === selectedMethodGroup;
          const matchSearch = m.name.includes(searchQuery);
          return matchGroup && matchSearch;
      });
  }, [methodItems, selectedMethodGroup, searchQuery]);

  const disabledMethodItems = useMemo(() => methodItems.filter(m => m.status === 'disabled'), [methodItems]);

  const handleItemClick = (item: any) => {
    if (isBatchMode) {
      const newSet = new Set(selectedIds);
      if (newSet.has(item.id)) newSet.delete(item.id);
      else newSet.add(item.id);
      setSelectedIds(newSet);
    } else {
        setMethodActionModal({
            open: true,
            item: item,
            type: item.status === 'available' ? 'disable' : 'enable'
        });
    }
  };

  const handleMethodActionConfirm = () => {
      if (!methodActionModal.item) return;
      const newStatus = methodActionModal.type === 'enable' ? 'available' : 'disabled';
      setMethodItems(prev => prev.map(m => m.id === methodActionModal.item.id ? { ...m, status: newStatus } : m));
      setMethodActionModal({ open: false, item: null, type: 'disable' });
  };

  const handleBatchMethodToggle = (action: 'enable' | 'disable') => {
      setMethodItems(prev => prev.map(m => {
          if (selectedIds.has(m.id)) return { ...m, status: action === 'enable' ? 'available' : 'disabled' };
          return m;
      }));
      setIsBatchMode(false);
      setSelectedIds(new Set());
  };

  return (
    <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Disabled List */}
        <div className="w-[340px] bg-white border-r border-gray-200 flex flex-col z-10 shrink-0">
            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-5 bg-white shrink-0">
                <span className="font-bold text-gray-800 text-[16px]">已停用做法</span>
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{disabledMethodItems.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
                {disabledMethodItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 mt-10">
                        <CheckCircle size={48} className="mb-2 text-gray-200"/>
                        <span className="text-sm font-bold">暂无停用做法</span>
                    </div>
                ) : (
                    disabledMethodItems.map(m => (
                        <div key={m.id} onClick={() => handleItemClick(m)} className="px-5 py-4 border-b border-gray-50 cursor-pointer hover:bg-red-50/50 transition-all flex items-center justify-between group">
                            <div>
                                <div className="font-bold text-[14px] text-gray-700 group-hover:text-red-600 transition-colors">{m.name}</div>
                                <div className="text-[10px] text-gray-400 mt-1">{m.group}</div>
                            </div>
                            <div className="px-2 py-1 rounded bg-white border border-gray-200 text-xs font-bold text-gray-500 shadow-sm group-hover:border-red-200 group-hover:text-red-500">启用</div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-500 leading-snug">
                <Info size={12} className="inline mr-1 text-blue-500 mb-0.5"/>
                点击左侧列表中的停用项，可快速重新启用该做法。
            </div>
        </div>

        {/* Right Area */}
        <div className="flex-1 flex flex-col bg-[#F5F6FA] relative min-w-0">
            <div className="bg-white border-b border-gray-200 flex flex-col shrink-0 shadow-sm z-10">
                <div className="h-16 flex items-center px-8 justify-between">
                    <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
                        {MOCK_METHOD_GROUPS.map(group => (
                            <CategoryButton key={group} label={group} active={selectedMethodGroup === group} onClick={() => setSelectedMethodGroup(group)} />
                        ))}
                    </div>
                    <div className="flex items-center ml-6">
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-3 text-gray-400" size={18} />
                            <input className="w-full pl-12 pr-4 py-2.5 bg-[#333]/5 border border-transparent rounded-[6px] text-sm outline-none focus:bg-white focus:border-blue-500 transition-all font-medium" placeholder="搜索做法名称..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-24 no-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 content-start">
                    {displayMethodItems.map(item => {
                        const isSelected = selectedIds.has(item.id);
                        const isDisabled = item.status === 'disabled';
                        return (
                            <div key={item.id} onClick={() => handleItemClick(item)} className={`relative bg-white rounded-xl shadow-sm cursor-pointer transition-all border flex flex-col p-4 h-[120px] group hover:shadow-md overflow-hidden select-none ${isBatchMode && isSelected ? 'border-blue-600 bg-blue-50' : isDisabled ? 'border-gray-100 bg-gray-50' : 'border-gray-100 hover:border-blue-200'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isDisabled ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>{item.group}</span>
                                    {isDisabled && <Ban size={16} className="text-gray-400"/>}
                                </div>
                                <h3 className={`font-bold text-[18px] mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-800'}`}>{item.name}</h3>
                                <div className="mt-auto flex items-center justify-between">
                                    <div className={`text-xs font-bold flex items-center ${isDisabled ? 'text-gray-400' : 'text-green-600'}`}>
                                        <div className={`w-2 h-2 rounded-full mr-1.5 ${isDisabled ? 'bg-gray-400' : 'bg-green-500'}`}></div>
                                        {isDisabled ? '已停用' : '使用中'}
                                    </div>
                                </div>
                                {isBatchMode && <div className="absolute top-2 right-2 z-30"><div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}>{isSelected && <CheckSquare size={12} className="text-white"/>}</div></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-20 flex items-center justify-between px-8 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="flex items-center space-x-4">
                    {!isBatchMode ? (
                        <button onClick={() => setIsBatchMode(true)} className="px-8 py-3 rounded-[6px] bg-blue-600 text-white font-bold hover:bg-blue-700 text-sm transition-all shadow-sm active:scale-95">批量管理</button>
                    ) : (
                        <div className="flex space-x-4">
                            <button onClick={() => selectedIds.size > 0 && handleBatchMethodToggle('enable')} disabled={selectedIds.size === 0} className={`px-6 py-3 rounded-[6px] text-white font-bold shadow text-sm ${selectedIds.size > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}>批量启用</button>
                            <button onClick={() => selectedIds.size > 0 && handleBatchMethodToggle('disable')} disabled={selectedIds.size === 0} className={`px-6 py-3 rounded-[6px] text-white font-bold shadow text-sm ${selectedIds.size > 0 ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 cursor-not-allowed'}`}>批量禁用</button>
                            <button onClick={() => { setIsBatchMode(false); setSelectedIds(new Set()); }} className="px-6 py-3 rounded-[6px] border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 text-sm">取消</button>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500 font-medium"><span>共 {displayMethodItems.length} 条</span><span className="text-gray-300">|</span><span className="text-gray-500">1/1 页</span></div>
            </div>
        </div>

        {methodActionModal.open && methodActionModal.item && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-[16px] shadow-2xl w-[400px] overflow-hidden animate-in zoom-in-95 font-sans">
                  <div className="p-8 text-center">
                     <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${methodActionModal.type === 'disable' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>{methodActionModal.type === 'disable' ? <PowerOff size={32}/> : <Zap size={32}/>}</div>
                     <h3 className="text-xl font-bold text-gray-900 mb-2">确认{methodActionModal.type === 'disable' ? '停用' : '启用'}此做法？</h3>
                     <p className="text-sm text-gray-500 mb-6">{methodActionModal.type === 'disable' ? `停用后，前台点单将无法选择 [${methodActionModal.item.name}]。` : `启用 [${methodActionModal.item.name}] 后，前台点单将恢复可选状态。`}</p>
                     <div className="flex gap-3">
                        <button onClick={() => setMethodActionModal({ open: false, item: null, type: 'disable' })} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">取消</button>
                        <button onClick={handleMethodActionConfirm} className={`flex-1 py-3 rounded-xl text-white font-bold transition-all shadow-md active:scale-95 ${methodActionModal.type === 'disable' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>确认{methodActionModal.type === 'disable' ? '停用' : '启用'}</button>
                     </div>
                  </div>
               </div>
            </div>
        )}
    </div>
  );
};
