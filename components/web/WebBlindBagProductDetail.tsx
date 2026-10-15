import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Product } from '../../types';
import { blindBagChannels } from '../../blindBag';
import { getOmnichannelChannel } from '../../omnichannel';
import type { StoreProductRecord } from './WebStoreProductList';

// Uses actual library data and completed store publications; no ordinary-product
// mock sales, template links or combo relationships apply to a blind bag.
export const WebBlindBagProductDetail: React.FC<{ product: Product; records: StoreProductRecord[]; onClose: () => void; onEdit: () => void }> = ({ product, records, onClose, onEdit }) => {
  const data = product.formData || {};
  const stores = records.filter(record => record.baseProductId === product.id);
  const fields = [
    ['商品 ID', product.id], ['SKU 编码', product.skuCode], ['商品类型', '标准商品 · 盲袋'],
    ['商品类目', data.p_cat], ['前台分类', product.category], ['后台分类', (data.p_back_cat || []).join('、')],
    ['售价', `¥${product.price.toFixed(2)} / ${data.p_unit || '袋'}`],
    ['销售渠道', blindBagChannels(product).map(id => getOmnichannelChannel(id).name).join('、')],
    ['库存设置', product.stock === -1 ? '不限库存' : `${product.stock ?? 0} 袋`],
    ['商品状态', product.status === 'draft' ? '草稿' : product.status === 'on_shelf' ? '已启用' : '已停用'],
    ['商品描述', data.p_list_desc], ['内部备注', data.p_remark],
  ];
  return <main className="pc-page flex min-h-0 min-w-0 flex-1 flex-col bg-[#F5F6FA] p-3" data-testid="blind-bag-detail"><header className="flex items-center justify-between rounded-t-lg border-b border-[#E5E6EB] bg-white px-5 py-4"><div className="flex items-center gap-3"><button type="button" aria-label="返回商品列表" onClick={onClose} className="rounded p-1 text-[#667085]"><ArrowLeft size={20} /></button><h1 className="text-lg font-semibold">盲袋商品详情</h1></div><button type="button" onClick={onEdit} className="h-9 rounded-md bg-[#00B460] px-5 text-sm font-medium text-white">编辑商品</button></header><div className="min-h-0 flex-1 overflow-auto rounded-b-lg bg-white p-6 no-scrollbar"><div className="mb-6 flex items-center gap-4">{product.image && <img src={product.image} alt="" className="h-20 w-20 rounded-md object-cover" />}<h2 className="max-w-full break-words text-lg font-semibold">{product.name}</h2></div><dl className="grid grid-cols-2 gap-x-8 gap-y-5">{fields.map(([label, value]) => <div key={label} className="grid min-w-0 grid-cols-[110px_1fr] gap-3 text-sm"><dt className="text-[#667085]">{label}</dt><dd className="break-all leading-6 text-[#1D2129]">{value === '' || value == null ? '--' : value}</dd></div>)}</dl><section className="mt-8"><h2 className="mb-4 text-base font-semibold">已下发门店渠道</h2>{stores.length ? <div className="overflow-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#F7F8FA] text-[#667085]"><tr>{['门店', '渠道', '上下架状态', '当前库存', '最近更新'].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{stores.map(record => <tr key={record.id} className="border-b border-[#F2F3F5]"><td className="px-4 py-3">{record.storeName}</td><td className="px-4 py-3">{record.channels.map(id => id === 'mini_dine' ? '小程序堂食' : id === 'mini_take' ? '小程序外卖' : id).join('、')}</td><td className="px-4 py-3">{record.status === 'on_shelf' ? '已上架' : '已下架'}</td><td className="px-4 py-3">{record.stockCount === 9999 ? '不限库存' : `${record.stockCount} 袋`}</td><td className="px-4 py-3">{record.lastSync || '--'}</td></tr>)}</tbody></table></div> : <p className="rounded-md bg-[#F7F8FA] p-5 text-sm text-[#667085]">尚未下发到门店。保存并启用商品后，可按销售渠道下发门店。</p>}</section></div></main>;
};
