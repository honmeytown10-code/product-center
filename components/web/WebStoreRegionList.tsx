import React, { useMemo, useState } from 'react';
import { Info, ArrowUpDown, ChevronDown } from 'lucide-react';

type StoreOption = {
  id: string;
  name: string;
};

export type StoreRegionRecord = {
  id: string;
  storeId: string;
  sort: number;
  name: string;
  relatedProductCount: number;
};

const STORE_OPTIONS: StoreOption[] = [
  { id: 'all', name: '全部门店' },
  { id: 's1', name: '范先生的门店' },
  { id: 's2', name: '南山万象店' },
  { id: 's3', name: '福田卓悦店' },
];

export const MOCK_STORE_REGIONS: StoreRegionRecord[] = [
  { id: 'region-1', storeId: 's1', sort: 1, name: '1楼', relatedProductCount: 0 },
  { id: 'region-2', storeId: 's1', sort: 2, name: '2楼', relatedProductCount: 0 },
  { id: 'region-3', storeId: 's2', sort: 1, name: 'A区', relatedProductCount: 12 },
  { id: 'region-4', storeId: 's3', sort: 1, name: '外摆区', relatedProductCount: 6 },
];

export const WebStoreRegionList: React.FC<{
  onEditRegion?: (region: StoreRegionRecord) => void;
}> = ({ onEditRegion }) => {
  const [storeId, setStoreId] = useState('s1');

  const filteredRegions = useMemo(() => {
    if (storeId === 'all') return MOCK_STORE_REGIONS;
    return MOCK_STORE_REGIONS.filter(item => item.storeId === storeId);
  }, [storeId]);

  return (
    <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4">
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
        <div className="px-6 py-4 border-b border-[#E8E8E8] bg-white">
          <div className="flex items-start text-xs leading-6 text-[#666]">
            <Info size={14} className="mr-2 mt-1 shrink-0 text-[#00C06B]" />
            <div>
              用于品牌形象店、小程序端分区域/楼层点餐设置，仅堂食桌点单页展示区域。
              需要在
              <span className="mx-1 text-[#00C06B]">机构门店</span>
              中提前设置好门店区域，再设置区域关联的商品。
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-[#E8E8E8] bg-[#FAFAFA]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#666] shrink-0">机构门店：</span>
              <div className="relative">
                <select
                  value={storeId}
                  onChange={e => setStoreId(e.target.value)}
                  className="appearance-none h-[38px] w-[260px] rounded-lg border border-[#E8E8E8] bg-white pl-3 pr-8 text-sm text-[#333] outline-none focus:border-[#00C06B]"
                >
                  {STORE_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
              </div>
            </div>
            <button className="text-sm font-bold text-[#00C06B] hover:text-[#00A35B]">
              清空搜索条件
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-[#E8E8E8] bg-white">
          <button className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">
            <ArrowUpDown size={14} className="mr-1.5" />
            排序管理
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
              <tr>
                <th className="w-[140px] border-b border-[#E8E8E8] px-6 py-4">排序</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">区域名称</th>
                <th className="w-[180px] border-b border-[#E8E8E8] px-4 py-4">关联商品</th>
                <th className="w-[160px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {filteredRegions.map(region => (
                <tr key={region.id} className="border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
                  <td className="px-6 py-4">{region.sort}</td>
                  <td className="px-4 py-4">{region.name}</td>
                  <td className="px-4 py-4">{region.relatedProductCount}</td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => onEditRegion?.(region)} className="font-medium text-[#00C06B] hover:text-[#00A35B]">编辑</button>
                  </td>
                </tr>
              ))}
              {filteredRegions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center text-sm text-[#999]">
                    暂无门店区域数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
