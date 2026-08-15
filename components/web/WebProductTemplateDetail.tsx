import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Info, Package, Plus, RefreshCw, Search, Send, Store, Trash2, X } from 'lucide-react';
import type { Product } from '../../types';
import type { OmnichannelChannel } from '../../omnichannel';
import { ALL_OMNICHANNEL_CHANNELS } from '../../omnichannel';
import { WebProductSelectorDialog } from './WebProductSelectorDialog';

export type TemplateDetailRecord = {
  id: string;
  name: string;
  description: string;
  status: 'enabled' | 'disabled';
  channels: OmnichannelChannel['id'][];
};

type StoreOption = {
  id: string;
  name: string;
  organization: string;
  region: string;
};

const STORE_OPTIONS: StoreOption[] = [
  { id: 'store-1', name: '槐店王婆·合肥政务店', organization: '华东一区', region: '安徽合肥' },
  { id: 'store-2', name: '槐店王婆·合肥万象城店', organization: '华东一区', region: '安徽合肥' },
  { id: 'store-3', name: '槐店王婆·南京新街口店', organization: '华东二区', region: '江苏南京' },
  { id: 'store-4', name: '槐店王婆·南京河西店', organization: '华东二区', region: '江苏南京' },
  { id: 'store-5', name: '槐店王婆·杭州滨江店', organization: '华东三区', region: '浙江杭州' },
  { id: 'store-6', name: '槐店王婆·杭州城西店', organization: '华东三区', region: '浙江杭州' },
  { id: 'store-7', name: '槐店王婆·上海静安店', organization: '华东四区', region: '上海' },
  { id: 'store-8', name: '槐店王婆·上海徐汇店', organization: '华东四区', region: '上海' },
  { id: 'store-9', name: '槐店王婆·苏州中心店', organization: '华东二区', region: '江苏苏州' },
  { id: 'store-10', name: '槐店王婆·无锡恒隆店', organization: '华东二区', region: '江苏无锡' },
  { id: 'store-11', name: '槐店王婆·宁波天一店', organization: '华东三区', region: '浙江宁波' },
  { id: 'store-12', name: '槐店王婆·温州万象店', organization: '华东三区', region: '浙江温州' },
];

type Props = {
  template: TemplateDetailRecord;
  products: Product[];
  productIds: string[];
  storeIds: string[];
  sourceLabel: string;
  sourceDescription: string;
  storeConflicts: Record<string, string>;
  onProductIdsChange: (ids: string[]) => void;
  onStoreIdsChange: (ids: string[]) => void;
  onBack: () => void;
  onCreatePublish?: () => void;
};

export const WebProductTemplateDetail: React.FC<Props> = ({
  template,
  products,
  productIds,
  storeIds,
  sourceLabel,
  sourceDescription,
  storeConflicts,
  onProductIdsChange,
  onStoreIdsChange,
  onBack,
  onCreatePublish,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
  const [keyword, setKeyword] = useState('');
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [draftProductIds, setDraftProductIds] = useState<string[]>([]);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [draftStoreIds, setDraftStoreIds] = useState<string[]>([]);
  const [storeSelectorKeyword, setStoreSelectorKeyword] = useState('');
  const [removeTarget, setRemoveTarget] = useState<{ type: 'product' | 'store'; id: string; name: string } | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [notice, setNotice] = useState('');

  const selectedProducts = useMemo(
    () => products.filter(product => productIds.includes(product.id) && (!keyword.trim() || product.name.toLowerCase().includes(keyword.trim().toLowerCase()) || product.skuCode.includes(keyword.trim()))),
    [keyword, productIds, products],
  );
  const selectedStores = useMemo(
    () => STORE_OPTIONS.filter(store => storeIds.includes(store.id) && (!keyword.trim() || store.name.includes(keyword.trim()) || store.organization.includes(keyword.trim()) || store.region.includes(keyword.trim()))),
    [keyword, storeIds],
  );
  const selectorStores = STORE_OPTIONS.filter(store => !storeSelectorKeyword.trim() || store.name.includes(storeSelectorKeyword.trim()) || store.organization.includes(storeSelectorKeyword.trim()) || store.region.includes(storeSelectorKeyword.trim()));

  const showNotice = (message: string) => setNotice(message);

  const openProductSelector = () => {
    setDraftProductIds([...productIds]);
    setProductSelectorOpen(true);
  };

  const openStoreSelector = () => {
    setDraftStoreIds([...storeIds]);
    setStoreSelectorKeyword('');
    setStoreSelectorOpen(true);
  };

  const removeSelectedTarget = () => {
    if (!removeTarget) return;
    if (removeTarget.type === 'product') onProductIdsChange(productIds.filter(id => id !== removeTarget.id));
    else onStoreIdsChange(storeIds.filter(id => id !== removeTarget.id));
    showNotice(`已从模板移除“${removeTarget.name}”，已发布门店不会自动变化`);
    setRemoveTarget(null);
  };

  return (
    <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-6 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} title="返回模板列表" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#666] hover:border-[#8BD7AE] hover:text-[#00A35B]"><ArrowLeft size={18} /></button>
          <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-base font-bold text-[#222]">{template.name}</h2><span className={`rounded px-2 py-1 text-xs font-medium ${template.status === 'enabled' ? 'bg-[#EAF8F1] text-[#00A35B]' : 'bg-[#F5F5F5] text-[#999]'}`}>{template.status === 'enabled' ? '已启用' : '已停用'}</span></div><div className="mt-1 truncate text-xs text-[#999]">{template.description || '--'} · 模板ID {template.id}</div></div>
        </div>
        <button type="button" disabled={template.status !== 'enabled' || productIds.length === 0 || storeIds.length === 0} onClick={() => { showNotice('模板范围已确认，即将进入发布中心创建发布批次'); onCreatePublish?.(); }} className="console-primary-button shrink-0 disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} />创建发布任务</button>
      </div>

      <div className="flex shrink-0 items-center justify-between border-b border-[#DDEFE5] bg-[#F5FCF8] px-6 py-2 text-xs"><div className="flex min-w-0 items-center"><Info size={14} className="mr-2 shrink-0 text-[#00A35B]" /><span className="font-medium text-[#087A49]">商品来源：{sourceLabel}</span><span className="ml-3 truncate text-[#667085]">{sourceDescription}</span></div><span className="ml-4 shrink-0 text-[#667085]">{template.channels.map(channelId => ALL_OMNICHANNEL_CHANNELS.find(channel => channel.id === channelId)?.shortName).join('、')}</span></div>

      {notice && <div className="flex shrink-0 items-center justify-between border-b border-[#CBEFDC] bg-[#F1FFF7] px-6 py-2 text-sm text-[#087A49]"><span><Check size={14} className="mr-2 inline" />{notice}</span><button type="button" onClick={() => setNotice('')} className="rounded p-1 hover:bg-white/70" aria-label="关闭提示"><X size={14} /></button></div>}

      <div className="flex h-12 shrink-0 border-b border-[#E8E8E8] bg-white px-6">
        <button type="button" onClick={() => { setActiveTab('products'); setKeyword(''); }} className={`border-b-2 px-1 text-sm font-medium ${activeTab === 'products' ? 'border-[#00C06B] text-[#00A35B]' : 'border-transparent text-[#666]'}`}>模板商品 <span className="ml-1 text-xs text-[#999]">{productIds.length}</span></button>
        <button type="button" onClick={() => { setActiveTab('stores'); setKeyword(''); }} className={`ml-8 border-b-2 px-1 text-sm font-medium ${activeTab === 'stores' ? 'border-[#00C06B] text-[#00A35B]' : 'border-transparent text-[#666]'}`}>适用门店 <span className="ml-1 text-xs text-[#999]">{storeIds.length}</span></button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex shrink-0 items-center justify-between rounded-t-lg border border-b-0 border-[#E8E8E8] bg-white px-4 py-3">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" /><input value={keyword} onChange={event => setKeyword(event.target.value)} className="w-[320px] rounded-lg border border-[#E5E7EB] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]" placeholder={activeTab === 'products' ? '搜索商品名称、SKUID' : '搜索门店、机构、区域'} /></div>
          <div className="flex items-center gap-3">{activeTab === 'products' && <button type="button" onClick={() => setConfirmRefresh(true)} className="flex items-center rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#555] hover:bg-[#FAFAFA]"><RefreshCw size={15} className="mr-2" />更新商品资料</button>}<button type="button" onClick={activeTab === 'products' ? openProductSelector : openStoreSelector} className="flex items-center rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white hover:bg-[#00A35B]"><Plus size={15} className="mr-2" />{activeTab === 'products' ? '添加商品' : '添加门店'}</button></div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-b-lg border border-[#E8E8E8] bg-white">
          {activeTab === 'products' ? <table className="min-w-[960px] table-fixed text-left text-sm"><thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs font-bold text-[#555]"><tr><th className="w-[72px] px-5 py-3">排序</th><th className="w-[300px] px-4 py-3">商品</th><th className="w-[120px] px-4 py-3">商品类型</th><th className="w-[150px] px-4 py-3">前台分类</th><th className="w-[120px] px-4 py-3">基础价格</th><th className="w-[110px] px-4 py-3">状态</th><th className="w-[100px] px-4 py-3 text-right">操作</th></tr></thead><tbody>{selectedProducts.map((product, index) => <tr key={product.id} className="border-t border-[#F0F0F0] hover:bg-[#FAFBFC]"><td className="px-5 py-4 text-[#999]">{index + 1}</td><td className="px-4 py-4"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-10 w-10 rounded border border-[#E5E7EB] object-cover" /><div className="min-w-0"><div className="truncate font-medium text-[#222]">{product.name}</div><div className="mt-1 text-xs text-[#999]">商品ID {product.id} · SKUID {product.skuCode}</div></div></div></td><td className="px-4 py-4 text-[#666]">{product.type === 'combo' ? '套餐商品' : '标准商品'}</td><td className="px-4 py-4 text-[#666]">{product.category || '--'}</td><td className="px-4 py-4 text-[#333]">¥{Number(product.price).toFixed(2)}</td><td className="px-4 py-4"><span className={product.status === 'on_shelf' ? 'text-[#00A35B]' : product.status === 'draft' ? 'text-[#D97706]' : 'text-[#999]'}>{product.status === 'on_shelf' ? '可售' : product.status === 'draft' ? '草稿' : '停售'}</span></td><td className="px-4 py-4 text-right"><button type="button" onClick={() => setRemoveTarget({ type: 'product', id: product.id, name: product.name })} className="text-[#D92D20]">移除</button></td></tr>)}{selectedProducts.length === 0 && <tr><td colSpan={7} className="py-16 text-center"><Package size={28} className="mx-auto text-[#C9CDD4]" /><div className="mt-3 text-sm text-[#999]">{keyword ? '没有符合条件的模板商品' : '暂无模板商品'}</div><button type="button" onClick={() => keyword ? setKeyword('') : openProductSelector()} className="mt-2 text-sm text-[#00A35B]">{keyword ? '清空搜索条件' : '添加商品'}</button></td></tr>}</tbody></table> : <table className="min-w-[820px] table-fixed text-left text-sm"><thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs font-bold text-[#555]"><tr><th className="w-[300px] px-5 py-3">门店</th><th className="w-[200px] px-4 py-3">所属机构</th><th className="w-[180px] px-4 py-3">区域</th><th className="w-[120px] px-4 py-3">状态</th><th className="w-[100px] px-4 py-3 text-right">操作</th></tr></thead><tbody>{selectedStores.map(store => <tr key={store.id} className="border-t border-[#F0F0F0] hover:bg-[#FAFBFC]"><td className="px-5 py-4 font-medium text-[#222]">{store.name}</td><td className="px-4 py-4 text-[#666]">{store.organization}</td><td className="px-4 py-4 text-[#666]">{store.region}</td><td className="px-4 py-4"><span className="text-[#00A35B]">营业中</span></td><td className="px-4 py-4 text-right"><button type="button" onClick={() => setRemoveTarget({ type: 'store', id: store.id, name: store.name })} className="text-[#D92D20]">移除</button></td></tr>)}{selectedStores.length === 0 && <tr><td colSpan={5} className="py-16 text-center"><Store size={28} className="mx-auto text-[#C9CDD4]" /><div className="mt-3 text-sm text-[#999]">{keyword ? '没有符合条件的适用门店' : '暂无适用门店'}</div><button type="button" onClick={() => keyword ? setKeyword('') : openStoreSelector()} className="mt-2 text-sm text-[#00A35B]">{keyword ? '清空搜索条件' : '添加门店'}</button></td></tr>}</tbody></table>}
        </div>
      </div>

      <WebProductSelectorDialog open={productSelectorOpen} title="选择模板商品" description={`商品来源：${sourceLabel}。已选商品保留勾选，可继续追加或取消。`} products={products} selectedIds={draftProductIds} onSelectedIdsChange={setDraftProductIds} onCancel={() => setProductSelectorOpen(false)} onConfirm={() => { const added = draftProductIds.filter(id => !productIds.includes(id)).length; onProductIdsChange(draftProductIds); setProductSelectorOpen(false); showNotice(`商品范围已保存，新增 ${added} 个商品`); }} confirmLabel="保存商品范围" />

      {storeSelectorOpen && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="flex h-[680px] w-[820px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4"><div><div className="text-base font-bold text-[#222]">选择适用门店</div><div className="mt-1 text-xs text-[#999]">同渠道下已被其他启用模板覆盖的门店不可重复选择</div></div><button type="button" onClick={() => setStoreSelectorOpen(false)} className="text-[#999]" aria-label="关闭"><X size={18} /></button></div><div className="border-b border-[#E5E7EB] bg-[#F7F8FA] p-4"><div className="relative w-[320px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" /><input value={storeSelectorKeyword} onChange={event => setStoreSelectorKeyword(event.target.value)} placeholder="搜索门店、机构、区域" className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]" /></div></div><div className="min-h-0 flex-1 overflow-y-auto p-4"><div className="overflow-hidden rounded-lg border border-[#E5E7EB]">{selectorStores.map(store => { const conflictTemplate = storeConflicts[store.id]; const selected = draftStoreIds.includes(store.id); const disabled = Boolean(conflictTemplate && !storeIds.includes(store.id)); return <label key={store.id} className={`flex items-start gap-3 border-b border-[#F0F0F0] px-4 py-3 last:border-b-0 ${disabled ? 'cursor-not-allowed bg-[#FAFAFA]' : 'cursor-pointer hover:bg-[#FAFCFB]'}`}><input type="checkbox" disabled={disabled} checked={selected} onChange={event => setDraftStoreIds(prev => event.target.checked ? [...prev, store.id] : prev.filter(id => id !== store.id))} className="mt-0.5 h-4 w-4 accent-[#00C06B]" /><div className="min-w-0 flex-1"><div className={`text-sm font-medium ${disabled ? 'text-[#999]' : 'text-[#222]'}`}>{store.name}</div><div className="mt-1 text-xs text-[#999]">{store.organization} · {store.region}</div>{disabled && <div className="mt-1 flex items-center text-xs text-[#D92D20]"><AlertTriangle size={12} className="mr-1" />已用于模板“{conflictTemplate}”</div>}</div></label>; })}{selectorStores.length === 0 && <div className="py-12 text-center text-sm text-[#999]">没有符合条件的门店</div>}</div></div><div className="flex items-center justify-between border-t border-[#E5E7EB] px-6 py-4"><div className="text-sm text-[#666]">已选择 <span className="font-bold text-[#00A35B]">{draftStoreIds.length}</span> 家门店</div><div className="flex gap-3"><button type="button" onClick={() => setDraftStoreIds([])} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">清空选择</button><button type="button" onClick={() => setStoreSelectorOpen(false)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={() => { const added = draftStoreIds.filter(id => !storeIds.includes(id)).length; onStoreIdsChange(draftStoreIds); setStoreSelectorOpen(false); showNotice(`门店范围已保存，新增 ${added} 家门店`); }} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-medium text-white">保存门店范围</button></div></div></div></div>}

      {removeTarget && <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/35 p-6"><div className="w-[470px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-start gap-3 px-6 py-5"><div className="rounded-full bg-[#FFF1F0] p-2 text-[#D92D20]"><AlertTriangle size={18} /></div><div><div className="font-bold text-[#222]">从模板移除{removeTarget.type === 'product' ? '商品' : '门店'}</div><div className="mt-2 text-sm leading-6 text-[#666]">移除“{removeTarget.name}”只修改模板配置，已经发布到门店或渠道的数据不会自动回滚；变更将在下一次发布后生效。</div></div></div><div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4"><button type="button" onClick={() => setRemoveTarget(null)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={removeSelectedTarget} className="rounded-lg bg-[#D92D20] px-4 py-2 text-sm font-medium text-white">确认移除</button></div></div></div>}

      {confirmRefresh && <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/35 p-6"><div className="w-[500px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-start gap-3 px-6 py-5"><div className="rounded-full bg-orange-50 p-2 text-[#D97706]"><RefreshCw size={18} /></div><div><div className="font-bold text-[#222]">更新模板商品资料</div><div className="mt-2 text-sm leading-6 text-[#666]">将按“{sourceLabel}”的最新资料更新 {productIds.length} 个模板商品。模板内经营差异仍保留，来源中已停用或删除的对象会在校验结果中提示。</div></div></div><div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4"><button type="button" onClick={() => setConfirmRefresh(false)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={() => { setConfirmRefresh(false); showNotice(`已更新 ${productIds.length} 个模板商品，未发现失效对象`); }} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white">确认更新</button></div></div></div>}
    </div>
  );
};
