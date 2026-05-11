import React, { useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import type { StoreRegionRecord } from './WebStoreRegionList';

type RelatedProduct = {
  id: string;
  name: string;
  type: string;
  category: string;
  price: number;
};

const STORE_NAME_MAP: Record<string, string> = {
  s1: '范先生的门店',
  s2: '南山万象店',
  s3: '福田卓悦店',
};

export const WebStoreRegionEditor: React.FC<{
  region: StoreRegionRecord;
  onBack: () => void;
}> = ({ region, onBack }) => {
  const [products, setProducts] = useState<RelatedProduct[]>([]);

  const handleAddProduct = () => {
    setProducts(prev => [
      ...prev,
      {
        id: `p-${prev.length + 1}`,
        name: `区域商品${prev.length + 1}`,
        type: '标准商品',
        category: '通用菜品',
        price: 18 + prev.length,
      },
    ]);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="h-[60px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 text-[#666] hover:text-[#333]"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-bold text-[#333]">编辑</h2>
        </div>
        <button className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">保存</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-6">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-[#666]">
            <div>门店名称：<span className="text-[#333]">{STORE_NAME_MAP[region.storeId] || region.storeId}</span></div>
            <div>区域名称：<span className="text-[#333]">{region.name}</span></div>
          </div>

          <div className="mt-6">
            <div className="mb-3 text-sm font-medium text-[#666]">关联商品：</div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
                  <tr>
                    <th className="px-4 py-4">商品名称</th>
                    <th className="px-4 py-4">商品类型</th>
                    <th className="px-4 py-4">商品分类</th>
                    <th className="px-4 py-4">销售价格（元）</th>
                    <th className="px-4 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#333]">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border-t border-[#F3F4F6] px-4 py-10 text-center text-[#999]">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    products.map(product => (
                      <tr key={product.id} className="border-t border-[#F3F4F6] hover:bg-[#FCFFFD]">
                        <td className="px-4 py-4">{product.name}</td>
                        <td className="px-4 py-4">{product.type}</td>
                        <td className="px-4 py-4">{product.category}</td>
                        <td className="px-4 py-4">{product.price}</td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => setProducts(prev => prev.filter(item => item.id !== product.id))} className="font-medium text-[#00C06B] hover:text-[#00A35B]">
                            移除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-[#666]">已添加 <span className="text-[#00C06B] font-bold">{products.length}</span> 个商品</div>
              <button onClick={handleAddProduct} className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">
                <Plus size={14} className="mr-1.5" />
                添加商品
              </button>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button onClick={onBack} className="rounded-lg border border-[#E8E8E8] px-5 py-2 text-sm text-[#666] hover:bg-gray-50">取消</button>
              <button className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">保存</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
