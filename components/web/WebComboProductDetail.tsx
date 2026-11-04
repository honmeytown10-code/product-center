import { WebComboSellingStores } from './WebComboSellingStores';
import { detailChannels, normalizeDetailChannel, type DetailShelfRequest, type DetailShelfResult } from './comboDetailStoreOperations';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import type { StoreProductRecord } from './WebStoreProductList';
import { getOmnichannelChannel } from '../../omnichannel';
import { useProducts } from '../../context';
import type { Product } from '../../types';

export interface ComboDetailProps {
  product: Product;
  onClose: () => void;
  onEdit?: () => void;
  catalogName?: string;
  storeRecords?: StoreProductRecord[];
  templates?: { id: string; name: string; channels: string[]; status: string }[];
  onOpenStoreProducts?: () => void;
  onOpenTemplates?: () => void;
  storeChannelIds?: string[];
  onChangeStoreShelf?: (request: DetailShelfRequest) => Promise<DetailShelfResult>;
  salesByPeriod?: Record<string, { saleCount: number; grossAmount: number; receiptAmount: number; avgPrice: number }>;
}

// 与 WebProductForm 保存的 takeoutFormState 保持一致；详情不补造分组或经营数据。
interface ComboItem {
  id: string;
  productId: string;
  name?: string;
  spec?: string;
  quantity?: number;
  surcharge?: number;
  isDefault?: boolean;
  channelEnabled?: boolean;
}
export interface ComboGroup {
  id: string;
  type?: 'fixed' | 'fixed_multi' | 'optional' | 'free';
  title: string;
  desc?: string;
  remark?: string;
  items?: ComboItem[];
  isRequired?: boolean;
  configMode?: 'pick' | 'flexible';
  requiredOptionCount?: number;
  minTotalQuantity?: number;
  maxTotalQuantity?: number;
  relativePrice?: boolean;
  channelEnabled?: boolean;
}

const displayValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(displayValue).join('、') || '--';
  return value === null || value === undefined || value === '' ? '--' : String(value);
};

type DetailTab = 'content' | 'stores' | 'templates';
const channelName = (id: string) => {
  const alias: Record<string, string> = { mini_dine: '小程序堂食', mini_take: '小程序外卖', mini_pickup: '小程序自提' };
  return alias[id] || getOmnichannelChannel(id as Parameters<typeof getOmnichannelChannel>[0])?.name || id;
};

export const WebComboProductDetail: React.FC<ComboDetailProps> = ({
  product, onClose, onEdit, catalogName, storeRecords = [], templates = [], onOpenStoreProducts, onOpenTemplates, storeChannelIds, onChangeStoreShelf, salesByPeriod,
}) => {
  const { products } = useProducts();
  const [activeTab, setActiveTab] = useState<DetailTab>('content');
  const [period, setPeriod] = useState('30');
  const [storeChannel, setStoreChannel] = useState('mini_dine');
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [identityOpen, setIdentityOpen] = useState(false);
  const groupElements = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    setActiveTab('content'); setStoreChannel('mini_dine'); setCollapsed([]); setIdentityOpen(false);
  }, [product.id]);
  const data = product.formData || {};
  const savedGroups = data.takeoutFormState?.comboGroupCards;
  const groups: ComboGroup[] = Array.isArray(savedGroups) ? savedGroups : product.comboItemIds?.length ? [{
    id: 'legacy-items', title: '套餐商品', items: product.comboItemIds.map(id => ({
      id, productId: id, name: products.find(item => item.id === id)?.name,
    })),
  }] : [];
  const status = { on_shelf: '已启用', off_shelf: '已停用', draft: '草稿' }[product.status];
  const specRows = data.takeoutFormState?.specConfigRows;
  const identities = Array.isArray(specRows) && specRows.length ? specRows.map(row => ({
    name: row.s_spec_name, sku: row.s_spec_sku_code, barcode: row.s_spec_barcode, mark: row.s_spec_mark,
  })) : [{ name: '默认规格', sku: product.skuCode, barcode: undefined, mark: undefined }];
  const barcodes = identities.map(row => row.barcode).filter(Boolean);
  const marks = identities.map(row => row.mark).filter(Boolean);
  const applicableChannels = storeChannelIds || data.salesScope?.channelIds || data.applicableChannelIds || [];
  const channels = detailChannels(storeRecords, product.id, applicableChannels);
  const currentChannel = channels.includes(storeChannel) ? storeChannel : channels[0] || '';
  const storeCount = new Set(storeRecords.filter(row => row.baseProductId === product.id
    && row.channels.some(id => normalizeDetailChannel(id) === currentChannel)).map(row => row.storeId)).size;
  const sales = salesByPeriod?.[period];
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  const startDate = new Date(`${today}T00:00:00+08:00`);
  startDate.setDate(startDate.getDate() - Number(period) + 1);
  const dateLabel = `${startDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })} ~ ${today}`;
  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'content', label: `套餐内容（${groups.length}）` },
    { key: 'stores', label: `在售门店（${storeCount}）` },
    { key: 'templates', label: `商品模板（${templates.length}）` },
  ];
  const identityButton = (values: unknown[], unit: string) => values.length > 1
    ? <button type="button" onClick={() => setIdentityOpen(true)} className="text-[#00B460] hover:underline">{values.length} 个{unit}</button>
    : <span className="break-all">{displayValue(values[0])}</span>;

  return (
    <main className="pc-page flex h-full min-h-0 flex-1 flex-col bg-[#F5F6FA] text-[13px] text-[#333]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-4">
        <div className="flex items-center gap-2 text-[#666]"><button type="button" onClick={onClose} className="hover:text-[#00B460]">商品库</button><ChevronRight size={14} /><h1 className="font-medium text-[#333]">商品详情</h1></div>
        <button type="button" onClick={onClose} aria-label="关闭商品详情" className="p-1 text-[#999] hover:text-[#333]"><X size={20} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-3 no-scrollbar">
        <div className="rounded-lg bg-white">
          <section className="flex items-start gap-6 border-b-[12px] border-[#F5F6FA] px-6 py-6">
            {product.image ? <img src={product.image} alt="" className="mt-2 h-20 w-20 shrink-0 rounded object-cover" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-[#F7F8FA] text-xs text-[#999]">暂无图片</div>}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="break-all text-xl font-semibold">{product.name}</h2>
                <span className="rounded-sm border border-[#00B460] px-2 py-0.5 text-xs text-[#00B460]">套餐商品</span>
                <span className="border-l border-[#E8E8E8] pl-4 text-lg font-semibold">{data.combo_price_type === 'total' ? '合并计价' : `¥${product.price.toFixed(2)}${data.combo_price_type === 'markup' ? '起' : ''}`}</span>
                <span className="text-xs text-[#86909C]">{status}</span>
              </div>
              {catalogName && <div className="mt-2 text-xs text-[#86909C]">商品库：{catalogName}</div>}
              <dl className="mt-5 grid grid-cols-3 gap-x-6 gap-y-4">
                <div className="flex min-w-0 gap-3"><dt className="w-[72px] shrink-0 text-[#999]">商品ID</dt><dd className="break-all">{product.id}</dd></div>
                <div className="flex min-w-0 gap-3"><dt className="w-[72px] shrink-0 text-[#999]">商品条码</dt><dd>{identityButton(barcodes, '条码')}</dd></div>
                <div className="flex min-w-0 gap-3"><dt className="w-[72px] shrink-0 text-[#999]">前台分类</dt><dd className="min-w-0 break-all">{displayValue(data.p_front_cat ?? product.category)}</dd></div>
                <div className="flex min-w-0 gap-3"><dt className="w-[72px] shrink-0 text-[#999]">SKUID</dt><dd>{displayValue(product.skuCode)}</dd></div>
                <div className="flex min-w-0 gap-3"><dt className="w-[72px] shrink-0 text-[#999]">商品标识</dt><dd>{identityButton(marks, '标识')}</dd></div>
                <div className="flex min-w-0 gap-3"><dt className="w-[72px] shrink-0 text-[#999]">创建时间</dt><dd className="break-words">{displayValue(product.createdTime)}</dd></div>
              </dl>
            </div>
            {onEdit && <button type="button" onClick={onEdit} className="console-secondary-button shrink-0">编辑</button>}
          </section>
          <section className="px-6 pb-5 pt-6" aria-label="商品销售数据">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3"><h2 className="text-base font-semibold">商品销售数据</h2>{!sales && <span className="text-xs text-[#999]">暂无销售数据</span>}</div>
              <div className="flex items-center gap-3 text-xs text-[#86909C]"><span>{dateLabel}</span><select aria-label="销售数据时间范围" value={period} onChange={event => setPeriod(event.target.value)} className="border-l border-[#E8E8E8] bg-white pl-3 text-[#666]"><option value="7">近7日</option><option value="30">近30日</option><option value="90">近90日</option></select></div>
            </div>
            <div className="grid grid-cols-4 gap-4">{[
              { label: '累计销量', value: sales?.saleCount, money: false },
              { label: '累计销售金额', value: sales?.grossAmount, money: true },
              { label: '累计实收金额', value: sales?.receiptAmount, money: true },
              { label: '平均单价（元）', value: sales?.avgPrice, money: true },
            ].map(metric => <div key={metric.label} className="rounded-md bg-[#F6F6F6] px-6 py-5"><div className="text-[13px] text-[#666]">{metric.label}</div><div className="mt-3 text-[30px] font-semibold leading-9 text-[#333]">{metric.value == null ? '--' : metric.money ? metric.value.toFixed(2) : metric.value}</div></div>)}</div>
          </section>
          <section className="px-6 pb-6">
            <div role="tablist" aria-label="套餐经营详情" className="mb-5 flex gap-8 border-b border-[#E5E6EB]">{tabs.map(tab => <button type="button" role="tab" id={`combo-tab-${tab.key}`} aria-selected={activeTab === tab.key} aria-controls="combo-detail-panel" key={tab.key} onClick={() => setActiveTab(tab.key)} className={`border-b-2 py-3 text-sm ${activeTab === tab.key ? 'border-[#00B460] font-medium text-[#00B460]' : 'border-transparent text-[#666] hover:text-[#333]'}`}>{tab.label}</button>)}</div>
            <div role="tabpanel" id="combo-detail-panel" aria-labelledby={`combo-tab-${activeTab}`}>
              {activeTab === 'content' && <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#86909C]"><span>{groups.length} 个分组 · {groups.reduce((sum, group) => sum + (group.items?.length || 0), 0)} 个商品选项{data.combo_price_type === 'markup' ? ' · 销售加价' : data.combo_price_type === 'total' ? ' · 合并计价' : ''}</span>{groups.length > 1 && <button type="button" onClick={() => setCollapsed(collapsed.length === groups.length ? [] : groups.map(group => group.id))} className="text-[#00B460]">{collapsed.length === groups.length ? '展开全部' : '收起全部'}</button>}</div>
                <div className={groups.length > 1 ? 'grid grid-cols-[180px_minmax(0,1fr)] items-start gap-4' : ''}>
                  {groups.length > 1 && <nav aria-label="套餐分组目录" className="sticky top-3 self-start rounded-md border border-[#E8E8E8] bg-white py-2">
                    <div className="px-3 py-2 text-xs font-medium text-[#86909C]">分组目录</div>
                    {groups.map((group, index) => <button type="button" key={group.id} onClick={() => {
                      setCollapsed(current => current.filter(id => id !== group.id));
                      groupElements.current[group.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }} className="block w-full px-3 py-2.5 text-left hover:bg-[#F0FAF5] hover:text-[#00A35B]">
                      <div className="flex gap-2"><span className="shrink-0 text-xs text-[#999]">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 break-words text-xs leading-5">{group.title}</span></div>
                      <div className="ml-6 mt-1 text-[11px] text-[#999]">{group.items?.length || 0} 个商品 · {group.type === 'optional' ? '可选分组' : group.type === 'free' ? '随心配' : '固定搭配'}</div>
                    </button>)}
                  </nav>}
                  <div className="min-w-0 space-y-4">
                  {groups.length === 0 ? <div className="px-6 py-12 text-center text-[#999]">暂无套餐内容</div> : groups.map(group => (
            <div key={group.id} ref={element => { groupElements.current[group.id] = element; }} className="scroll-mt-3 overflow-hidden rounded-md border border-[#E8E8E8]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#F7F8FA] px-6 py-3">
                <button type="button" aria-expanded={!collapsed.includes(group.id)} onClick={() => setCollapsed(current => current.includes(group.id) ? current.filter(id => id !== group.id) : [...current, group.id])} className="flex items-center gap-2 text-left font-semibold">{collapsed.includes(group.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}<span className="break-all">{group.title}</span></button>
                {group.type && <span className="text-xs text-[#666]">{{ fixed: '固定搭配', fixed_multi: '固定搭配（多拼商品）', optional: '可选分组', free: '随心配' }[group.type]}</span>}
                {group.type === 'optional' && <span className="text-xs text-[#666]">{group.isRequired === undefined ? '' : group.isRequired ? '必选 · ' : '非必选 · '}{group.configMode === 'flexible' ? `购买总数 ${displayValue(group.minTotalQuantity)}–${displayValue(group.maxTotalQuantity)}` : `选择 ${displayValue(group.requiredOptionCount)} 种商品${group.minTotalQuantity == null && group.maxTotalQuantity == null ? '' : ` · 购买总数 ${displayValue(group.minTotalQuantity)}–${displayValue(group.maxTotalQuantity)}`}`}{group.relativePrice === undefined ? '' : group.relativePrice ? ' · 相对价' : ' · 非相对价'}</span>}
                {group.type === 'free' && group.desc && <span className="text-xs text-[#666]">{group.desc}</span>}
                <span className="text-xs text-[#86909C]">{group.items?.length || 0} 个商品</span>
                {catalogName && group.channelEnabled === false && <span className="text-xs text-[#999]">已禁用</span>}
              </div>
              {group.remark && !collapsed.includes(group.id) && <p className="border-t border-[#E8E8E8] px-6 py-2 text-xs leading-5 text-[#86909C]">{group.remark}</p>}
              {!collapsed.includes(group.id) && <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead className="text-xs text-[#999]"><tr><th className="px-6 py-3 font-normal">商品名称</th><th className="px-4 py-3 font-normal">规格</th><th className="px-4 py-3 text-right font-normal">数量</th>{(group.type === 'optional' || group.type === 'free') && <><th className="px-4 py-3 text-right font-normal">加价（元）</th><th className="px-6 py-3 font-normal">默认选中</th></>}{catalogName && <th className="px-6 py-3 font-normal">状态</th>}</tr></thead>
                  <tbody>{group.items?.length ? group.items.map(item => <tr key={item.id} className="border-t border-[#F0F0F0]">
                    <td className="max-w-[360px] break-all px-6 py-3">{item.name || `商品ID：${item.productId}`}</td><td className="max-w-[240px] break-all px-4 py-3">{displayValue(item.spec)}</td><td className="px-4 py-3 text-right">{displayValue(item.quantity)}</td>
                    {(group.type === 'optional' || group.type === 'free') && <><td className="px-4 py-3 text-right">{item.surcharge == null ? '--' : item.surcharge.toFixed(2)}</td><td className="px-6 py-3">{item.isDefault == null ? '--' : item.isDefault ? '是' : '否'}</td></>}
                    {catalogName && <td className="px-6 py-3">{group.channelEnabled === false || item.channelEnabled === false ? '已禁用' : '已启用'}</td>}
                  </tr>) : <tr><td colSpan={(group.type === 'optional' || group.type === 'free' ? 5 : 3) + (catalogName ? 1 : 0)} className="px-6 py-6 text-center text-[#999]">暂无商品明细</td></tr>}</tbody>
                </table>
              </div>}
            </div>
          ))}
                  </div>
                </div>
              </div>}
              {activeTab === 'stores' && <WebComboSellingStores productId={product.id} productName={product.name}
                records={storeRecords} channelIds={applicableChannels} initialChannel={currentChannel}
                onChannelChange={setStoreChannel} onShelfChange={onChangeStoreShelf} />}
              {activeTab === 'templates' && <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left"><thead className="bg-[#F7F8FA] text-[#666]"><tr>{['模板名称', '适用渠道', '模板状态'].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{templates.length ? templates.map(template => <tr key={template.id} className="border-b border-[#F0F0F0]"><td className="px-4 py-3">{template.name}</td><td className="px-4 py-3">{template.channels.map(channelName).join('、')}</td><td className="px-4 py-3">{template.status === 'enabled' ? '已启用' : '已停用'}</td></tr>) : <tr><td colSpan={3} className="py-12 text-center text-[#999]">暂未关联商品模板</td></tr>}</tbody></table>{onOpenTemplates && <button type="button" onClick={onOpenTemplates} className="mt-4 text-[#00B460] hover:underline">查看商品模板</button>}</div>}
            </div>
          </section>
        </div>
      </div>
      {identityOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-6" role="dialog" aria-modal="true" aria-label="商品编码明细"><div className="w-[720px] max-w-full rounded-lg bg-white shadow-xl"><header className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4"><h2 className="text-base font-semibold">商品编码明细</h2><button type="button" onClick={() => setIdentityOpen(false)} aria-label="关闭编码明细"><X size={18} /></button></header><div className="max-h-[60vh] overflow-auto p-6"><table className="w-full text-left"><thead className="bg-[#F7F8FA]"><tr>{['规格', '商品规格码', '商品条码', '商品标识'].map(label => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{identities.map((row, index) => <tr key={index} className="border-b border-[#F0F0F0]">{[row.name, row.sku, row.barcode, row.mark].map((value, index) => <td key={index} className="break-all px-3 py-3">{displayValue(value)}</td>)}</tr>)}</tbody></table></div></div></div>}
    </main>
  );
};
