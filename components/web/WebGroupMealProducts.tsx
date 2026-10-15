import React, { useState } from 'react';
import { Plus, Search, UtensilsCrossed } from 'lucide-react';
import { useProducts } from '../../context';
import { isBlindBagProduct } from '../../blindBag';
import { WebProductSelectorDialog } from './WebProductSelectorDialog';

export const isGroupMealProduct = (product: any) => Array.isArray(product.formData?.p_display_type) && product.formData.p_display_type.includes('group_meal');

export const WebGroupMealProducts: React.FC<{ onCreate: (type: 'standard' | 'combo') => void; onEdit: (product: any) => void }> = ({ onCreate, onEdit }) => {
  const { products, updateProduct } = useProducts();
  const [keyword, setKeyword] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const rows = products.filter(isGroupMealProduct).filter(product => !keyword || `${product.name} ${product.id}`.includes(keyword));
  const updateMark = (product: any, marked: boolean) => {
    if (isBlindBagProduct(product)) return;
    const tags: string[] = product.formData?.p_display_type || [];
    updateProduct(product.id, { formData: { ...product.formData,
      p_display_type: marked ? [...new Set([...tags, 'group_meal'])] : tags.filter(tag => tag !== 'group_meal' && tag !== 'group_meal_only'),
      ...(!marked && tags.includes('group_meal_only') ? { s_sale_mode: '正常售卖' } : {}),
    }} as any);
  };
  return <main className="pc-page flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA] p-4">
    <div className="pc-surface flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="border-b border-[#E8E8E8] p-5"><h1 className="text-lg font-semibold text-[#1D2129]">团餐商品</h1><p className="mt-2 text-sm leading-6 text-[#667085]">从商品库选择商品标记为团餐商品，也可直接创建。</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E8E8] p-4">
        <label className="flex h-9 items-center gap-2 rounded-md border border-[#E5E6EB] px-3"><Search size={16} className="text-[#86909C]" /><input aria-label="搜索团餐商品" placeholder="搜索名称或商品 ID" value={keyword} onChange={event => setKeyword(event.target.value)} className="w-56 text-sm outline-none" /></label>
        <div className="flex flex-wrap gap-2"><button className="console-secondary-button" onClick={() => { setSelectedIds([]); setPickerOpen(true); }}>从商品库选择</button><button className="console-secondary-button" onClick={() => onCreate('combo')}><Plus size={15} />新建套餐</button><button className="console-primary-button" onClick={() => onCreate('standard')}><Plus size={15} />新建单品</button></div>
      </div>
      {notice && <p role="status" className="bg-[#F1FBF6] px-4 py-2 text-sm text-[#087443]">{notice}</p>}
      <div className="min-h-0 flex-1 overflow-auto no-scrollbar">
        <table className="w-full min-w-[740px] text-left text-sm"><thead className="bg-[#F7F8FA] text-[#4E5969]"><tr>{['商品名称', '商品类型', '商品类目', '售价', '状态', '操作'].map(label => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{rows.map((product: any) => <tr key={product.id} className="border-t border-[#F0F1F2]"><td className="px-4 py-4"><span className="font-medium text-[#1D2129]">{product.name}</span><div className="mt-1 text-xs text-[#667085]">商品 ID：{product.id}</div></td><td className="px-4 py-4">{product.type === 'combo' ? '套餐商品' : '标准商品'}</td><td className="px-4 py-4">{product.formData?.p_weight_flag ? '称重商品' : product.category}</td><td className="px-4 py-4 tabular-nums">¥{Number(product.price).toFixed(2)}</td><td className="px-4 py-4">{product.status === 'draft' ? '草稿' : product.status === 'off_shelf' ? '已停用' : '已启用'}</td><td className="px-4 py-4"><div className="flex gap-4"><button className="text-[#008F4C]" onClick={() => onEdit(product)}>编辑</button><button className="text-[#667085]" onClick={() => { updateMark(product, false); setNotice(`已移出团餐，商品“${product.name}”仍保留在商品库；已有门店商品未改动。`); }}>移出团餐</button></div></td></tr>)}</tbody></table>
        {!rows.length && <div className="flex min-h-[260px] flex-col items-center justify-center text-[#667085]"><UtensilsCrossed size={32} className="mb-3" /><strong className="text-base text-[#1D2129]">{keyword ? '没有符合条件的团餐商品' : '尚未设置团餐商品'}</strong><p className="mt-2 text-sm">{keyword ? '请调整搜索条件。' : '选择已有商品，或新建团餐单品、套餐。'}</p></div>}
      </div>
      <div className="border-t border-[#E8E8E8] px-4 py-3 text-xs text-[#667085]">共 {rows.length} 个商品；标记与移出团餐不会自动下发或修改已有门店商品。</div>
    </div>
    <WebProductSelectorDialog open={pickerOpen} title="选择团餐商品" description="将选中商品标记为团餐商品，不复制商品，不改变称重设置。" products={products.filter(product => !isGroupMealProduct(product))} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} onCancel={() => setPickerOpen(false)} confirmLabel="标记为团餐商品" onConfirm={() => { products.filter(product => selectedIds.includes(product.id)).forEach(product => updateMark(product, true)); setNotice(`已将 ${selectedIds.length} 个商品标记为团餐商品。`); setPickerOpen(false); }} />
  </main>;
};
