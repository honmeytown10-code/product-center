import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, PackageOpen, Plus, Search, Send } from 'lucide-react';
import type { Product } from '../../types';
import { useProducts } from '../../context';
import { BLIND_BAG_PUBLISH_CHANNEL_IDS, blindBagChannels, isBlindBagProduct } from '../../blindBag';
import { getOmnichannelChannel } from '../../omnichannel';
import type { StoreProductRecord } from './WebStoreProductList';
import { WebProductLifecycleConfirm, type ProductLifecycleAction } from './WebProductLifecycleConfirm';
import { WebProductLibraryBatchDialog } from './WebProductLibraryBatchDialog';

export type BlindBagPermissions = { view: boolean; create: boolean; edit: boolean; publish: boolean; lifecycle?: boolean; visibleProductIds?: string[] };
const allPermissions: BlindBagPermissions = { view: true, create: true, edit: true, publish: true, lifecycle: true };
const statusLabel = (product: Product) => product.status === 'draft' ? '草稿' : product.status === 'on_shelf' ? '已启用' : '已停用';
const button = 'h-9 rounded-md border border-[#D9DDE3] bg-white px-4 text-sm text-[#4E5969] hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-50';
const filter = 'flex h-9 items-center rounded-md border border-[#E8E8E8] bg-white px-3 transition-colors hover:border-[#00B460] focus-within:border-[#00B460]';

// Shares product IDs and the existing publication tool with the library.
// Lifecycle actions reuse the library confirmations and state handler.
// Production injects page/action/object permissions; the prototype assumes full access.
export const WebBlindBagProducts: React.FC<{
  onCreate: () => void;
  onEdit: (product: Product) => void;
  onPublish: (products: Product[], allowedProductIds: string[]) => void;
  onLifecycleAction?: (action: ProductLifecycleAction, products: Product[]) => void | Promise<void>;
  unifiedManagement?: boolean;
  storeRecords: StoreProductRecord[];
  permissions?: BlindBagPermissions;
  state?: 'success' | 'loading' | 'error';
  onRetry?: () => void;
  creationUnavailableReason?: string;
}> = ({ onCreate, onEdit, onPublish, onLifecycleAction, unifiedManagement = false, storeRecords, permissions = allPermissions, state = 'success', onRetry, creationUnavailableReason }) => {
  const { products, updateProduct, deleteProduct } = useProducts();
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [channel, setChannel] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [lifecycleConfirmation, setLifecycleConfirmation] = useState<{ action: ProductLifecycleAction; products: Product[] } | null>(null);
  const [enableProducts, setEnableProducts] = useState<Product[] | null>(null);
  const canManageLifecycle = permissions.lifecycle ?? permissions.edit;
  const scoped = useMemo(() => products.filter(isBlindBagProduct).filter(product => !permissions.visibleProductIds || permissions.visibleProductIds.includes(product.id)), [products, permissions.visibleProductIds]);
  const rows = scoped.filter(product => (!search || `${product.name} ${product.id} ${product.skuCode}`.toLowerCase().includes(search.toLowerCase())) && (status === 'all' || product.status === status) && (channel === 'all' || blindBagChannels(product).includes(channel as any)));
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pages);
  const shown = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const selectedProducts = rows.filter(product => selected.includes(product.id));
  const canPublish = selectedProducts.length
    ? selectedProducts.every(product => product.status === 'on_shelf') && BLIND_BAG_PUBLISH_CHANNEL_IDS.some(id => selectedProducts.every(product => blindBagChannels(product).includes(id)))
    : scoped.some(product => product.status === 'on_shelf' && blindBagChannels(product).includes('mini_program_dine_in'));
  const publishReason = selectedProducts.some(product => product.status !== 'on_shelf')
    ? '草稿请先完善资料；停用商品请先启用。'
    : selectedProducts.length && !canPublish ? '盲袋暂仅支持下发小程序堂食，请检查所选商品的销售渠道。'
    : !canPublish ? '暂无可下发商品，请先完善资料或启用商品。' : '';
  const allShownSelected = shown.length > 0 && shown.every(product => selected.includes(product.id));
  useEffect(() => { setSelected([]); setPage(1); }, [search, status, channel]);
  return <main className="pc-page flex min-h-0 min-w-0 flex-1 flex-col bg-[#F5F6FA] p-3" data-testid="blind-bag-list">
    <div className="pc-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white">
      <header className="shrink-0 border-b border-[#E5E6EB] px-5 py-4">
        <h1 className="text-lg font-semibold text-[#1D2129]">盲袋商品</h1>
        <p className="mt-2 text-sm leading-6 text-[#667085]">将当日未售完的烘焙、蛋糕、小食等鲜食装成盲袋，以优惠价格售卖，减少尾货损耗。顾客下单时不知道具体内容，到店自提时揭晓。</p>
      </header>
      {permissions.view && creationUnavailableReason && <p role="status" className="mx-5 mt-3 rounded-md bg-[#FFF8EB] px-3 py-2 text-sm text-[#8F5700]">{creationUnavailableReason}</p>}
      {!permissions.view || permissions.visibleProductIds?.length === 0 ? <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <h2 className="text-base font-semibold">{permissions.view ? '暂无获授权的盲袋商品范围' : '暂无盲袋商品查看权限'}</h2>
        <p className="text-sm text-[#667085]">请联系品牌管理员申请页面及商品数据范围权限。</p>
      </div> : <>
        {permissions.visibleProductIds && <p role="status" className="mx-5 mt-4 rounded-md bg-[#FFF8EB] p-3 text-sm text-[#8F5700]">当前仅展示获授权范围内的盲袋商品。</p>}
        <form onSubmit={event => { event.preventDefault(); setSearch(keyword.trim()); }} className="flex shrink-0 flex-wrap items-center gap-3 px-5 py-4" data-testid="blind-bag-filters">
          <div className={`${filter} w-[340px]`}>
            <label htmlFor="blind-list-search" className="mr-2 shrink-0 text-xs text-[#667085]">商品查询：</label>
            <Search size={14} className="mr-2 shrink-0 text-[#86909C]" />
            <input id="blind-list-search" aria-label="搜索商品名称、商品ID、SKU编码" value={keyword} onChange={event => setKeyword(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" placeholder="名称、商品ID、SKU编码" />
          </div>
          <div className={`${filter} w-[190px]`}>
            <label htmlFor="blind-list-status" className="mr-2 shrink-0 text-xs text-[#667085]">商品状态：</label>
            <select id="blind-list-status" value={status} onChange={event => setStatus(event.target.value)} className="min-w-0 flex-1 cursor-pointer bg-transparent text-[13px] outline-none">
              <option value="all">全部状态</option><option value="on_shelf">已启用</option><option value="off_shelf">已停用</option><option value="draft">草稿</option>
            </select>
          </div>
          <div className={`${filter} w-[220px]`}>
            <label htmlFor="blind-list-channel" className="mr-2 shrink-0 text-xs text-[#667085]">销售渠道：</label>
            <select id="blind-list-channel" value={channel} onChange={event => setChannel(event.target.value)} className="min-w-0 flex-1 cursor-pointer bg-transparent text-[13px] outline-none">
              <option value="all">全部渠道</option><option value="mini_program_dine_in">小程序堂食</option><option value="mini_program_delivery">小程序外卖</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" className={button} onClick={() => { setKeyword(''); setSearch(''); setStatus('all'); setChannel('all'); }}>重置</button>
            <button type="submit" className="h-9 rounded-md bg-[#00B460] px-5 text-sm font-medium text-white hover:bg-[#009F55]">查询</button>
          </div>
        </form>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#F2F3F5] px-5 py-3">
          <span className="text-xs text-[#86909C]">共 {rows.length} 个商品{selectedProducts.length > 0 ? `，已选 ${selectedProducts.length} 个` : ''}</span>
          <div className="flex items-center gap-3">
            {permissions.publish && <button className={button} disabled={!canPublish || state !== 'success'} title={publishReason || (selectedProducts.length ? `下发已选的 ${selectedProducts.length} 个商品` : '进入商品下发工具选择盲袋商品')} onClick={() => onPublish(selectedProducts, scoped.map(product => product.id))}><Send size={14} className="mr-2 inline" />下发门店</button>}
            {permissions.create && <button disabled={!!creationUnavailableReason} title={creationUnavailableReason} className="flex h-9 items-center gap-2 rounded-md bg-[#00B460] px-4 text-sm font-medium text-white hover:bg-[#009F55] disabled:cursor-not-allowed disabled:opacity-50" onClick={onCreate}><Plus size={15} />新建盲袋商品</button>}
          </div>
        </div>
        {notice && <p role="status" className="mx-5 mb-3 rounded-md bg-[#EAF8F2] px-3 py-2 text-sm text-[#008F4C]">{notice}</p>}
        <div className="min-h-0 flex-1 overflow-auto no-scrollbar">
          {state === 'loading' ? <div role="status" className="flex min-h-[260px] items-center justify-center gap-2 text-sm text-[#667085]"><LoaderCircle size={18} className="animate-spin" />正在加载盲袋商品…</div>
          : state === 'error' ? <div role="alert" className="flex min-h-[260px] flex-col items-center justify-center gap-3"><p className="text-sm text-[#B42318]">盲袋商品加载失败，请重试。</p><button className={button} onClick={onRetry}>重新加载</button></div>
          : rows.length ? <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs text-[#667085]"><tr>
              <th className="w-12 px-5 py-3"><input type="checkbox" aria-label="选择当前页盲袋商品" checked={allShownSelected} onChange={() => setSelected(current => allShownSelected ? current.filter(id => !shown.some(product => product.id === id)) : [...new Set([...current, ...shown.map(product => product.id)])])} className="accent-[#00B460]" /></th>
              {['商品', '前台分类', '售价（元 / 袋）', '销售渠道', '已下发门店', '状态'].map(label => <th key={label} className="px-3 py-3">{label}</th>)}
              <th className="sticky right-0 bg-[#F7F8FA] px-4 py-3">操作</th>
            </tr></thead>
            <tbody>{shown.map(product => <tr key={product.id} className="border-b border-[#F2F3F5] hover:bg-[#FAFBFC]">
              <td className="px-5 py-4"><input type="checkbox" aria-label={`选择${product.name}`} checked={selected.includes(product.id)} onChange={() => setSelected(current => current.includes(product.id) ? current.filter(id => id !== product.id) : [...current, product.id])} className="accent-[#00B460]" /></td>
              <td className="max-w-[280px] px-3 py-4"><div className="flex items-center gap-3">
                {product.image ? <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" /> : <PackageOpen size={26} className="shrink-0 text-[#86909C]" />}
                <div className="min-w-0"><div className="break-words font-medium text-[#1D2129]">{product.name}</div><div className="mt-1 break-all text-xs text-[#86909C]">{product.id}</div></div>
              </div></td>
              <td className="max-w-[140px] break-words px-3 py-4 text-[#4E5969]">{product.category || '--'}</td>
              <td className="px-3 py-4 tabular-nums">{product.formData?.s_price === '' ? '--' : `¥${product.price.toFixed(2)}`}</td>
              <td className="px-3 py-4 text-[#4E5969]">{blindBagChannels(product).map(id => <div key={id} className="leading-6">{getOmnichannelChannel(id).name}</div>)}</td>
              <td className="px-3 py-4 tabular-nums">{new Set(storeRecords.filter(record => record.baseProductId === product.id).map(record => record.storeId)).size} 家</td>
              <td className="px-3 py-4"><span className={product.status === 'on_shelf' ? 'text-[#008F4C]' : 'text-[#667085]'}>{statusLabel(product)}</span></td>
              <td className="sticky right-0 bg-white px-4 py-4"><div className="flex gap-4 whitespace-nowrap">
                {permissions.edit && <button className="text-[#008F4C] hover:underline" onClick={() => onEdit(product)}>{product.status === 'draft' ? '完善资料' : '编辑'}</button>}
                {canManageLifecycle && product.status !== 'draft' && <button className="text-[#008F4C] hover:underline" onClick={() => product.status === 'on_shelf' ? setLifecycleConfirmation({ action: 'disable', products: [product] }) : setEnableProducts([product])}>{product.status === 'on_shelf' ? '停用' : '启用'}</button>}
                {canManageLifecycle && <button className="text-[#667085] hover:underline" onClick={() => setLifecycleConfirmation({ action: 'archive', products: [product] })}>归档</button>}
              </div></td>
            </tr>)}</tbody>
          </table> : <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
            <PackageOpen size={36} className="text-[#98A2B3]" /><h2 className="text-base font-semibold text-[#1D2129]">{scoped.length ? '没有符合条件的盲袋商品' : '尚未创建盲袋商品'}</h2>
            <p className="text-sm text-[#667085]">{scoped.length ? '请调整筛选条件，或重置后查看全部商品。' : '创建商品资料后，即可下发到门店。'}</p>
            {!scoped.length && permissions.create && <button className={button} disabled={!!creationUnavailableReason} title={creationUnavailableReason} onClick={onCreate}>新建盲袋商品</button>}
          </div>}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-[#E5E6EB] px-5 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3"><span className="shrink-0 text-sm text-[#667085]">已选 {selectedProducts.length} 个</span>{selectedProducts.length > 0 && <>
            {canManageLifecycle && <>
              <button className={button} disabled={state !== 'success' || !selectedProducts.every(product => product.status === 'off_shelf')} onClick={() => setEnableProducts(selectedProducts)}>批量启用</button>
              <button className={button} disabled={state !== 'success' || !selectedProducts.every(product => product.status === 'on_shelf')} onClick={() => setLifecycleConfirmation({ action: 'disable', products: selectedProducts })}>批量停用</button>
              <button className={button} disabled={state !== 'success'} onClick={() => setLifecycleConfirmation({ action: 'archive', products: selectedProducts })}>批量归档</button>
            </>}
            <button className="shrink-0 text-sm text-[#008F4C] hover:underline" onClick={() => setSelected([])}>清空选择</button>
            {publishReason && <span className="text-xs text-[#86909C]">{publishReason}</span>}
          </>}</div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-[#667085]"><span>{currentPage} / {pages}</span><button className={button} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>上一页</button><button className={button} disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>下一页</button></div>
        </footer>
      </>}
    </div>
    {lifecycleConfirmation && <WebProductLifecycleConfirm action={lifecycleConfirmation.action} products={lifecycleConfirmation.products} unifiedManagement={unifiedManagement}
      storeCount={new Set(storeRecords.filter(record => lifecycleConfirmation.products.some(product => product.id === record.baseProductId)).map(record => record.storeId)).size}
      onCancel={() => setLifecycleConfirmation(null)} onConfirm={async () => {
        const { action, products: targets } = lifecycleConfirmation;
        if (onLifecycleAction) await onLifecycleAction(action, targets);
        else targets.forEach(product => action === 'disable' ? updateProduct(product.id, { status: 'off_shelf' }) : deleteProduct(product.id));
        setLifecycleConfirmation(null); setSelected([]);
        setNotice(action === 'disable' ? `已停用 ${targets.length} 个商品${unifiedManagement ? '，所有关联门店商品已下架' : ''}。` : `已归档 ${targets.length} 个商品。`);
      }} />}
    {enableProducts && <WebProductLibraryBatchDialog action="enable" products={enableProducts} onCancel={() => setEnableProducts(null)} onComplete={message => { setEnableProducts(null); setSelected([]); setNotice(message); }} />}
  </main>;
};
