import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

export type SelectableProduct = {
  id: string;
  name: string;
  image?: string;
  skuCode?: string;
  productCode?: string;
  category?: string;
  frontendCategory?: string;
  type?: string;
  price?: number;
  status?: string;
};

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  products: SelectableProduct[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  onSecondaryConfirm?: () => void;
  secondaryConfirmLabel?: string;
  maxSelected?: number;
  fixedType?: 'standard' | 'combo';
  disabledIds?: string[];
  disabledLabel?: string;
  showSkuFields?: boolean;
};

const PAGE_SIZE = 10;

const getTypeLabel = (type?: string) => {
  if (type === 'combo' || type === '套餐商品') return '套餐商品';
  return '标准商品';
};

const getStatusLabel = (status?: string) => {
  if (status === 'off_shelf' || status === '停售') return '停售';
  if (status === 'draft' || status === '草稿') return '草稿';
  return '可售';
};

export const WebProductSelectorDialog: React.FC<Props> = ({
  open,
  title = '选择商品',
  description,
  products,
  selectedIds,
  onSelectedIdsChange,
  onCancel,
  onConfirm,
  confirmLabel = '确定',
  onSecondaryConfirm,
  secondaryConfirmLabel,
  maxSelected,
  fixedType,
  disabledIds = [],
  disabledLabel,
  showSkuFields = true,
}) => {
  const [draftFilters, setDraftFilters] = useState({
    name: '',
    productId: '',
    skuCode: '',
    productCode: '',
    category: 'all',
    type: fixedType || 'all',
  });
  const [filters, setFilters] = useState(draftFilters);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!open) return;
    const next = {
      name: '',
      productId: '',
      skuCode: '',
      productCode: '',
      category: 'all',
      type: fixedType || 'all',
    };
    setDraftFilters(next);
    setFilters(next);
    setPage(1);
  }, [fixedType, open]);

  const categories = useMemo(
    () => Array.from(new Set(products.map(product => product.frontendCategory || product.category).filter(Boolean))) as string[],
    [products]
  );

  const filteredProducts = useMemo(() => products.filter(product => {
    const type = product.type === 'combo' || product.type === '套餐商品' ? 'combo' : 'standard';
    const category = product.frontendCategory || product.category || '';
    return (!filters.name || product.name.toLowerCase().includes(filters.name.toLowerCase()))
      && (!filters.productId || product.id.includes(filters.productId))
      && (!showSkuFields || !filters.skuCode || (product.skuCode || '').includes(filters.skuCode))
      && (!filters.productCode || (product.productCode || '').includes(filters.productCode))
      && (filters.category === 'all' || category === filters.category)
      && (filters.type === 'all' || type === filters.type);
  }), [filters, products, showSkuFields]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageIds = pageProducts.filter(product => !disabledIds.includes(product.id)).map(product => product.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));

  if (!open) return null;

  const toggleProduct = (productId: string) => {
    if (disabledIds.includes(productId)) return;
    if (selectedIds.includes(productId)) {
      onSelectedIdsChange(selectedIds.filter(id => id !== productId));
      return;
    }
    if (maxSelected && selectedIds.length >= maxSelected) return;
    onSelectedIdsChange([...selectedIds, productId]);
  };

  const togglePage = () => {
    if (allPageSelected) {
      onSelectedIdsChange(selectedIds.filter(id => !pageIds.includes(id)));
      return;
    }
    const availableIds = pageIds.filter(id => !selectedIds.includes(id));
    const allowedIds = maxSelected
      ? availableIds.slice(0, Math.max(0, maxSelected - selectedIds.length))
      : availableIds;
    onSelectedIdsChange([...selectedIds, ...allowedIds]);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-5">
      <div className="flex h-[760px] w-[1180px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#E5E6EB] px-6">
          <div>
            <div className="text-[18px] font-bold text-[#1D2129]">{title}</div>
            {description ? <div className="mt-1 text-[12px] text-[#86909C]">{description}</div> : null}
          </div>
          <button type="button" onClick={onCancel} title="关闭" className="text-[#86909C] hover:text-[#4E5969]">
            <X size={20} />
          </button>
        </div>

        <div className="shrink-0 border-b border-[#E5E6EB] bg-[#F7F8FA] px-5 py-4">
          <div className="grid grid-cols-3 gap-3">
            <label className="flex h-10 items-center border border-[#E5E6EB] bg-white px-3 text-[13px]">
              <span className="mr-3 shrink-0 text-[#4E5969]">商品名称</span>
              <input value={draftFilters.name} onChange={event => setDraftFilters(prev => ({ ...prev, name: event.target.value }))} className="min-w-0 flex-1 outline-none" placeholder="请输入商品名称" />
            </label>
            <label className="flex h-10 items-center border border-[#E5E6EB] bg-white px-3 text-[13px]">
              <span className="mr-3 shrink-0 text-[#4E5969]">商品 ID</span>
              <input value={draftFilters.productId} onChange={event => setDraftFilters(prev => ({ ...prev, productId: event.target.value }))} className="min-w-0 flex-1 outline-none" placeholder="请输入商品 ID" />
            </label>
            {showSkuFields && <label className="flex h-10 items-center border border-[#E5E6EB] bg-white px-3 text-[13px]">
              <span className="mr-3 shrink-0 text-[#4E5969]">SKUID</span>
              <input value={draftFilters.skuCode} onChange={event => setDraftFilters(prev => ({ ...prev, skuCode: event.target.value }))} className="min-w-0 flex-1 outline-none" placeholder="请输入 SKUID" />
            </label>}
            <label className="flex h-10 items-center border border-[#E5E6EB] bg-white px-3 text-[13px]">
              <span className="mr-3 shrink-0 text-[#4E5969]">商品标识</span>
              <input value={draftFilters.productCode} onChange={event => setDraftFilters(prev => ({ ...prev, productCode: event.target.value }))} className="min-w-0 flex-1 outline-none" placeholder="请输入商品标识" />
            </label>
            <label className="flex h-10 items-center border border-[#E5E6EB] bg-white px-3 text-[13px]">
              <span className="mr-3 shrink-0 text-[#4E5969]">前台分类</span>
              <select value={draftFilters.category} onChange={event => setDraftFilters(prev => ({ ...prev, category: event.target.value }))} className="min-w-0 flex-1 bg-white outline-none">
                <option value="all">全部</option>
                {categories.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="flex h-10 items-center border border-[#E5E6EB] bg-white px-3 text-[13px]">
              <span className="mr-3 shrink-0 text-[#4E5969]">商品类型</span>
              <select value={draftFilters.type} disabled={!!fixedType} onChange={event => setDraftFilters(prev => ({ ...prev, type: event.target.value as typeof prev.type }))} className="min-w-0 flex-1 bg-white outline-none disabled:text-[#86909C]">
                <option value="all">全部</option>
                <option value="standard">标准商品</option>
                <option value="combo">套餐商品</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => { setFilters(draftFilters); setPage(1); }} className="inline-flex h-9 items-center bg-[#00B460] px-5 text-[13px] font-medium text-white hover:bg-[#009A52]"><Search size={14} className="mr-1.5" />查询</button>
            <button type="button" onClick={() => { const next = { name: '', productId: '', skuCode: '', productCode: '', category: 'all', type: fixedType || 'all' }; setDraftFilters(next); setFilters(next); setPage(1); }} className="h-9 border border-[#E5E6EB] bg-white px-5 text-[13px] text-[#4E5969]">重置</button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 pt-4">
          <table className={`w-full table-fixed text-left text-[13px] ${showSkuFields ? 'min-w-[1040px]' : 'min-w-[880px]'}`}>
            <thead className="sticky top-0 z-10 bg-[#F2F3F5] text-[#4E5969]">
              <tr>
                <th className="w-12 px-4 py-3"><input type="checkbox" checked={allPageSelected} onChange={togglePage} className="h-4 w-4 rounded border-gray-300 text-[#00B460]" /></th>
                <th className="w-[260px] px-4 py-3">商品名称</th>
                <th className="w-[110px] px-4 py-3">商品类型</th>
                <th className="w-[140px] px-4 py-3">前台分类</th>
                <th className="w-[160px] px-4 py-3">商品标识</th>
                {showSkuFields && <th className="w-[160px] px-4 py-3">SKUID</th>}
                <th className="w-[100px] px-4 py-3">基础价格</th>
                <th className="w-[90px] px-4 py-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {pageProducts.map(product => {
                const selected = selectedIds.includes(product.id);
                const disabled = disabledIds.includes(product.id);
                return (
                  <tr key={product.id} className={`border-b border-[#F0F0F0] ${disabled ? 'bg-[#F7F8FA] text-[#98A2B3]' : selected ? 'bg-[#F0FBF5]' : 'bg-white hover:bg-[#FAFBFC]'}`}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selected} disabled={disabled} onChange={() => toggleProduct(product.id)} className="h-4 w-4 rounded border-gray-300 text-[#00B460] disabled:cursor-not-allowed disabled:opacity-40" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? <img src={product.image} alt="" className="h-10 w-10 shrink-0 border border-[#E5E6EB] object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#F2F4F7] text-[14px] font-semibold text-[#667085]">{product.name.slice(0, 1)}</span>}
                        <div className="min-w-0"><div className="flex items-center gap-2"><div className="truncate font-medium text-[#1D2129]">{product.name}</div>{disabled && disabledLabel ? <span className="shrink-0 rounded bg-[#EEF1F4] px-1.5 py-0.5 text-[11px] font-medium text-[#667085]">{disabledLabel}</span> : null}</div><div className="mt-1 text-[12px] text-[#86909C]">商品ID {product.id}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4E5969]">{getTypeLabel(product.type)}</td>
                    <td className="px-4 py-3 text-[#4E5969]">{product.frontendCategory || product.category || '-'}</td>
                    <td className="px-4 py-3 text-[#4E5969]">{product.productCode || '-'}</td>
                    {showSkuFields && <td className="px-4 py-3 text-[#4E5969]">{product.skuCode || '-'}</td>}
                    <td className="px-4 py-3 text-[#1D2129]">¥{Number(product.price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-[#4E5969]">{getStatusLabel(product.status)}</td>
                  </tr>
                );
              })}
              {pageProducts.length === 0 ? <tr><td colSpan={showSkuFields ? 8 : 7} className="py-16 text-center text-[#86909C]">没有符合条件的商品</td></tr> : null}
            </tbody>
          </table>
        </div>

        <div className="flex h-[68px] shrink-0 items-center justify-between border-t border-[#E5E6EB] bg-white px-6">
          <div className="text-[13px] text-[#4E5969]">已选择 <span className="font-bold text-[#F53F3F]">{selectedIds.length}</span> 个商品{maxSelected ? ` / 最多 ${maxSelected} 个` : ''}</div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-[13px] text-[#4E5969]">
              <span>共 {filteredProducts.length} 条</span>
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage(prev => Math.max(1, prev - 1))} className="flex h-8 w-8 items-center justify-center border border-[#E5E6EB] disabled:text-[#C9CDD4]"><ChevronLeft size={15} /></button>
              <span>{currentPage} / {pageCount}</span>
              <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(prev => Math.min(pageCount, prev + 1))} className="flex h-8 w-8 items-center justify-center border border-[#E5E6EB] disabled:text-[#C9CDD4]"><ChevronRight size={15} /></button>
            </div>
            <button type="button" onClick={() => onSelectedIdsChange([])} className="h-9 border border-[#E5E6EB] bg-white px-5 text-[13px] text-[#4E5969]">清空选择</button>
            <button type="button" onClick={onCancel} className="h-9 border border-[#E5E6EB] bg-white px-5 text-[13px] font-medium text-[#4E5969]">取消</button>
            {onSecondaryConfirm && secondaryConfirmLabel ? <button type="button" onClick={onSecondaryConfirm} className="h-9 border border-[#00B460] bg-white px-5 text-[13px] font-medium text-[#008F4C] hover:bg-[#F3FCF7]">{secondaryConfirmLabel}</button> : null}
            <button type="button" onClick={onConfirm} className="h-9 bg-[#00B460] px-6 text-[13px] font-medium text-white hover:bg-[#009A52]">{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
