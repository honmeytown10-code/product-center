import React, { useState } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';

interface Props {
  product: any;
  onClose: () => void;
}

// Mock Optional Groups
const INITIAL_GROUPS = [
  {
    id: 'og_1',
    name: '生椰拿铁必选规格',
    code: '124621886011',
    associatedCombo: '生椰拿铁套餐等(3个)',
    remark: '必选项',
    status: 'valid', // 生效中
    isLastProduct: true // 模拟：该商品是该分组的最后一个商品
  },
  {
    id: 'og_2',
    name: '废弃的无效分组',
    code: '124621886012',
    associatedCombo: '-',
    remark: '已经没用了',
    status: 'invalid', // 已失效（孤儿分组）
    isLastProduct: true // 模拟：该商品是该分组的最后一个商品
  }
];

export const WebProductDetail: React.FC<Props> = ({ product, onClose }) => {
  const [activeTab, setActiveTab] = useState('optional_groups');
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleUnlink = (groupIds: string[]) => {
    if (groupIds.length === 0) {
      alert('请选择要解除关联的分组');
      return;
    }

    let hasError = false;
    const toRemove: string[] = [];

    for (const id of groupIds) {
      const group = groups.find(g => g.id === id);
      if (!group) continue;

      // === 核心豁免逻辑验证 ===
      if (group.status === 'valid' && group.isLastProduct) {
        alert(`解除失败！该商品为生效分组【${group.name}】的最后一个商品，不可解除关联，否则会导致套餐点单报错。`);
        hasError = true;
        break; // Stop processing
      } else {
        toRemove.push(id);
      }
    }

    if (!hasError && toRemove.length > 0) {
      // 检查是否有触发自动清理的无效分组
      const cleanedGroups = toRemove.filter(id => {
        const g = groups.find(x => x.id === id);
        return g?.status === 'invalid' && g?.isLastProduct;
      });

      if (cleanedGroups.length > 0) {
        alert(`解除关联成功！触发静默垃圾回收(GC)：已自动清理 ${cleanedGroups.length} 个空的无效分组。`);
      } else {
        alert('解除关联成功！');
      }

      setGroups(groups.filter(g => !toRemove.includes(g.id)));
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === groups.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(groups.map(g => g.id));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
      {/* Top Navigation Bar Mock */}
      <div className="h-[48px] bg-white border-b border-[#E8E8E8] flex items-center px-4 shrink-0 shadow-sm z-10">
         <div className="flex items-center text-[13px] text-[#666]">
            <span className="cursor-pointer hover:text-[#00C06B]">商品管理</span>
            <ChevronRight size={14} className="mx-1"/>
            <span className="cursor-pointer hover:text-[#00C06B]">全部商品</span>
            <ChevronRight size={14} className="mx-1"/>
            <span className="font-bold text-[#333]">商品详情</span>
         </div>
         <div className="ml-auto flex items-center">
            <button onClick={onClose} className="text-[#999] hover:text-[#333] transition-colors p-1">
               <X size={20} />
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-4 no-scrollbar">
        {/* Header Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E8E8E8] mb-4 relative">
           <button className="absolute top-6 right-6 border border-[#E8E8E8] text-[#333] px-4 py-1.5 rounded-md hover:border-[#00C06B] hover:text-[#00C06B] transition-colors text-[13px]">
              编辑
           </button>
           <div className="flex items-start">
              <div className="flex items-start mr-12 min-w-[300px]">
                 <img src={product.image || "https://via.placeholder.com/60"} className="w-16 h-16 rounded-md object-cover border border-gray-100 mr-4" />
                 <div>
                    <div className="flex items-center mb-4">
                       <h2 className="text-[18px] font-bold text-[#333] mr-2">{product.name}</h2>
                       <span className="text-[10px] text-[#00C06B] border border-[#00C06B] px-1 rounded-sm bg-white">标准商品</span>
                    </div>
                    <div className="text-[12px] text-[#999] flex flex-col space-y-2">
                       <div className="flex"><span className="w-[60px]">商品ID:</span> <span>{product.id}</span></div>
                       <div className="flex"><span className="w-[60px]">SKUID:</span> <span>{product.id + '080'}</span></div>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-start space-x-16 text-[12px] text-[#333]">
                 <div className="flex flex-col space-y-4">
                    <div className="flex items-center text-[16px] font-bold">
                       <span className="mr-1">￥</span> {product.price || 1} <span className="text-[12px] font-normal text-[#666] ml-1">元起</span>
                    </div>
                    <div className="flex text-[#999]"><span className="w-[60px]">商品条码:</span> <span className="text-[#333]">-</span></div>
                    <div className="flex text-[#999]"><span className="w-[60px]">商品标识:</span> <span className="text-[#333]">-</span></div>
                 </div>
                 <div className="flex flex-col space-y-4 pt-8">
                    <div className="flex text-[#999]"><span className="w-[60px]">前台分类:</span> <span className="text-[#333]">0330分类-4</span></div>
                    <div className="flex text-[#999]"><span className="w-[60px]">创建时间:</span> <span className="text-[#333]">2026-04-01 21:48:49</span></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Sales Data Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E8E8E8] mb-4">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[#333]">商品销售数据</h3>
              <span className="text-[12px] text-[#999]">2026-03-04~2026-04-02 | 近30日 ▾</span>
           </div>
           <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#F7F8FA] rounded-lg p-4">
                 <div className="text-[13px] text-[#666] mb-2">累计销量</div>
                 <div className="text-[28px] font-bold text-[#333]">0</div>
              </div>
              <div className="bg-[#F7F8FA] rounded-lg p-4">
                 <div className="text-[13px] text-[#666] mb-2">累计销售金额</div>
                 <div className="text-[28px] font-bold text-[#333]">0</div>
              </div>
              <div className="bg-[#F7F8FA] rounded-lg p-4">
                 <div className="text-[13px] text-[#666] mb-2">累计实收金额</div>
                 <div className="text-[28px] font-bold text-[#333]">0</div>
              </div>
              <div className="bg-[#F7F8FA] rounded-lg p-4">
                 <div className="text-[13px] text-[#666] mb-2">平均单价(元)</div>
                 <div className="text-[28px] font-bold text-[#333]">0</div>
              </div>
           </div>
        </div>

        {/* Tabs & Table */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E8E8E8] min-h-[400px]">
           <div className="flex border-b border-[#E8E8E8] px-6">
              {['在售门店 (1)', '商品模板', '套餐组合', '随心配', '可选分组'].map((tab, idx) => {
                 const key = ['stores', 'templates', 'combos', 'free_match', 'optional_groups'][idx];
                 const isActive = activeTab === key;
                 return (
                    <div 
                       key={key}
                       onClick={() => setActiveTab(key)}
                       className={`py-4 px-4 text-[14px] cursor-pointer relative ${isActive ? 'text-[#00C06B] font-bold' : 'text-[#666] hover:text-[#333]'}`}
                    >
                       {tab}
                       {isActive && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00C06B]"></div>}
                    </div>
                 );
              })}
           </div>

           <div className="p-6">
              {activeTab === 'optional_groups' && (
                 <>
                    <div className="flex justify-end mb-4">
                       <button 
                          onClick={() => handleUnlink(selectedIds)}
                          className="border border-[#E8E8E8] text-[#333] px-4 py-1.5 rounded-md text-[13px] hover:border-[#00C06B] hover:text-[#00C06B] transition-colors"
                       >
                          批量解除关联
                       </button>
                    </div>
                    
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-[#F7F8FA]">
                          <tr className="text-[13px] font-bold text-[#666] border-b border-[#E8E8E8]">
                             <th className="pl-4 py-3 w-[50px]">
                                <input 
                                   type="checkbox" 
                                   checked={selectedIds.length > 0 && selectedIds.length === groups.length}
                                   onChange={toggleAll}
                                />
                             </th>
                             <th className="px-4 py-3">分组ID</th>
                             <th className="px-4 py-3">分组名称</th>
                             <th className="px-4 py-3">分组状态</th>
                             <th className="px-4 py-3">分组编码</th>
                             <th className="px-4 py-3">关联套餐</th>
                             <th className="px-4 py-3">分组备注</th>
                             <th className="px-4 py-3 text-center">操作</th>
                          </tr>
                       </thead>
                       <tbody className="text-[13px] text-[#333]">
                          {groups.length > 0 ? groups.map(g => (
                             <tr key={g.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC]">
                                <td className="pl-4 py-3">
                                   <input 
                                      type="checkbox" 
                                      checked={selectedIds.includes(g.id)}
                                      onChange={() => toggleSelect(g.id)}
                                   />
                                </td>
                                <td className="px-4 py-3 text-[#999]">{g.id}</td>
                                <td className="px-4 py-3 font-bold">{g.name}</td>
                                <td className="px-4 py-3">
                                   {g.status === 'valid' ? (
                                      <span className="text-[#00C06B] bg-[#E6F8F0] px-2 py-0.5 rounded text-[11px]">生效中</span>
                                   ) : (
                                      <span className="text-[#999] bg-gray-100 px-2 py-0.5 rounded text-[11px]">已失效(无关联)</span>
                                   )}
                                </td>
                                <td className="px-4 py-3">{g.code}</td>
                                <td className="px-4 py-3 text-[#999]">{g.associatedCombo}</td>
                                <td className="px-4 py-3 text-[#999]">{g.remark}</td>
                                <td className="px-4 py-3 text-center">
                                   <button 
                                      onClick={() => handleUnlink([g.id])}
                                      className="text-[#00C06B] hover:text-[#00A35B] hover:underline"
                                   >
                                      解除关联
                                   </button>
                                </td>
                             </tr>
                          )) : (
                             <tr>
                                <td colSpan={8} className="py-16 text-center text-[#999]">暂无数据</td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                 </>
              )}
              {activeTab !== 'optional_groups' && (
                 <div className="py-20 text-center text-[#999]">暂无数据</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
