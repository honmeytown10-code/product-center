import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, Loader2, Search } from 'lucide-react';
import { useProducts } from '../../context';
import { getEffectiveChannelGroups, getOmnichannelChannel, getOmnichannelConfig, isThirdPartyChannelId } from '../../omnichannel';
import type { OmnichannelChannelId, Product } from '../../types';
import { WebStoreScopeSelector } from './WebStoreScopeSelector';
import { checkJdStoreReadiness, checkTakeoutProduct, isTakeoutChannel, takeoutOperationPlan } from '../../takeoutSync';
import { WebTakeoutSyncPreview } from './WebTakeoutSyncPreview';
import { PRODUCT_SALES_SCOPE_STORES, type ProductSalesScope } from './WebProductSalesScope';
import { INITIAL_RECORDS } from './WebProductTemplateManager';
import { STORE_OPTIONS } from './WebProductTemplateDetail';
import { MASTER_ADDON_OPTIONS, METHOD_GROUPS } from './WebProductAttributeManager';
import { WebBatchAddonAssociation, type AddonAssociationDraft } from './WebBatchAddonAssociation';
import type { StoreProductRecord } from './WebStoreProductList';
import type { PublishBatch } from './WebPublishRecords';

export type ProductTool = 'template_publish' | 'attribute_update' | 'addon_bulk' | 'addon_association' | 'method_association' | 'method_status' | 'delete_goods' | 'delete_addon' | 'copy_store' | 'copy_channel';
const TITLES: Record<ProductTool, string> = {
  template_publish: '批量发布模板商品', attribute_update: '更新门店商品属性', addon_bulk: '批量修改加料商品', addon_association: '批量修改商品关联加料',
  method_association: '批量修改商品关联做法', method_status: '批量启用/禁用门店做法', delete_goods: '删除门店商品', delete_addon: '删除门店加料', copy_store: '门店商品复制', copy_channel: '渠道商品复制',
};
const btn = 'inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#D0D5DD] bg-white px-4 text-sm text-[#344054] hover:bg-[#F5F6F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460] disabled:cursor-not-allowed disabled:opacity-50';
const input = 'h-9 rounded-md border border-[#D0D5DD] bg-white px-3 text-sm text-[#344054] focus:border-[#00B460] focus:outline-none';
const toggle = <T extends string,>(values: T[], value: T): T[] => values.includes(value) ? values.filter(id => id !== value) : [...values, value];
const legacyChannel: Record<string, string> = { mini_program_dine_in: 'mini_dine', mini_program_delivery: 'mini_take', douyin: 'douyin_dine' };
const channelInRecord = (record: StoreProductRecord, id: OmnichannelChannelId) => record.channels.includes(id) || record.channels.includes(legacyChannel[id]);

type Props = { tool: ProductTool; products: Product[]; catalogProductIds?: Record<string, string[]>; channelProductOverrides?: Record<string, any>; storeRecords: StoreProductRecord[]; directUse: boolean; unified: boolean; onBack: () => void; onSubmitTask?: (batch: PublishBatch) => void; onOpenRecords: () => void };

/** Local prototype tasks only; no production API or platform operation is called. */
export const WebProductToolFlow: React.FC<Props> = ({ tool, products, catalogProductIds = {}, channelProductOverrides = {}, storeRecords, directUse, unified, onBack, onSubmitTask, onOpenRecords }) => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = getOmnichannelConfig(brandConfigs[activeBrandId] || brandConfigs.b_1);
  const groups = getEffectiveChannelGroups(config);
  const channels = Array.from(new Set(groups.flatMap(group => group.channels)));
  const templates = INITIAL_RECORDS.filter(record => record.status === 'enabled');
  const templateTool = tool === 'template_publish' || tool === 'attribute_update';
  const association = tool === 'method_association' || tool === 'addon_association';
  const addonTool = tool === 'addon_bulk' || tool === 'delete_addon';
  const copy = tool === 'copy_store' || tool === 'copy_channel';
  const deletion = tool === 'delete_goods' || tool === 'delete_addon';
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<'master' | 'channel_catalog' | 'template' | 'store'>(directUse || unified ? 'master' : 'channel_catalog');
  const [catalogId, setCatalogId] = useState(groups[0]?.id || '');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [sourceStoreIds, setSourceStoreIds] = useState<string[]>([]);
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [channelIds, setChannelIds] = useState<OmnichannelChannelId[]>([]);
  const [fromChannel, setFromChannel] = useState<OmnichannelChannelId | ''>('');
  const [toChannel, setToChannel] = useState<OmnichannelChannelId | ''>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [allDelete, setAllDelete] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [associationMode, setAssociationMode] = useState('add');
  const [individual, setIndividual] = useState(false);
  const [methodValues, setMethodValues] = useState<string[]>([]);
  const [individualValues, setIndividualValues] = useState<Record<string, string[]>>({});
  const [targetScopes, setTargetScopes] = useState<string[]>(['brand']);
  const [execution, setExecution] = useState<'now' | 'manual' | 'scheduled'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PublishBatch | null>(null);
  const [addonDraft, setAddonDraft] = useState<AddonAssociationDraft | undefined>();
  const heading = useRef<HTMLHeadingElement>(null);
  const submitLock = useRef(false);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const sourceLabel = templateTool ? '商品下发模板' : copy || addonTool || tool === 'method_status' ? '门店商品' : source === 'master' ? unified ? '商品库' : '商品主档' : source === 'channel_catalog' ? groups.find(group => group.id === catalogId)?.name || '渠道商品库' : source === 'template' ? templates.find(template => template.id === templateId)?.name || '商品下发模板' : '门店商品';
  const matchBase = (record: StoreProductRecord) => products.find(product => product.id === record.baseProductId) || products.find(product => product.name === record.name);
  const pool = useMemo(() => {
    if (source === 'channel_catalog') return products.filter(product => (catalogProductIds[catalogId] || []).includes(product.id));
    // Matches the incumbent template-manager demo seed. Production must read saved template links, not slice IDs.
    if (source === 'template') return products.slice(0, templates.find(template => template.id === templateId)?.productCount || 0);
    if (source === 'store') { const ids = new Set(storeRecords.filter(record => sourceStoreIds.includes(record.storeId)).map(record => matchBase(record)?.id)); return products.filter(product => ids.has(product.id)); }
    return products;
  }, [source, products, catalogId, catalogProductIds, templateId, sourceStoreIds, storeRecords]);
  const items = addonTool ? MASTER_ADDON_OPTIONS.map(item => ({ id: item.id, name: item.name, description: `${item.type} · ¥${item.price.toFixed(2)}` })) : tool === 'method_status' ? METHOD_GROUPS.flatMap(group => group.values.map(value => ({ id: value.id, name: `${group.name} / ${value.name}`, description: value.code }))) : pool.map(product => ({ id: product.id, name: product.name, description: `${product.type === 'combo' ? '套餐商品' : '标准商品'} · ${product.skuCode || product.id}` }));
  const selectedItems = items.filter(item => selectedIds.includes(item.id));
  const shownItems = items.filter(item => `${item.name} ${item.description}`.toLowerCase().includes(keyword.trim().toLowerCase()));
  const chosenTemplates = templates.filter(template => templateIds.includes(template.id));
  const templateStores = STORE_OPTIONS.map(store => ({ ...store, code: store.id, tags: [] }));
  const inheritedStoreIds = Array.from(new Set(chosenTemplates.flatMap(template => templateStores.slice(0, template.storeCount).map(store => store.id))));
  const inheritedChannels = Array.from(new Set(chosenTemplates.flatMap(template => template.channels)));
  const effectiveStores = templateTool ? inheritedStoreIds : storeIds;
  const scopeStores = templateTool ? templateStores : PRODUCT_SALES_SCOPE_STORES;
  const scopeName = effectiveStores.map(id => scopeStores.find(store => store.id === id)?.name || id).join('、');
  const availableChannels = association && source === 'channel_catalog' ? groups.find(group => group.id === catalogId)?.channels || [] : channels;
  const effectiveChannels = templateTool ? inheritedChannels : tool === 'copy_store' || tool === 'delete_goods' ? channels : tool === 'copy_channel' ? toChannel ? [toChannel] : [] : channelIds;
  const restrictedStructure = association && source === 'channel_catalog';
  const destructive = deletion || copy || association && ['replace', 'clear', 'remove'].includes(associationMode);
  const storeTarget = !association || targetScopes.includes('store');
  const sourceCopyRecords = storeRecords.filter(record => tool === 'copy_store' ? sourceStoreIds.includes(record.storeId) : storeIds.includes(record.storeId) && !!fromChannel && channelInRecord(record, fromChannel));
  const copyItems = Array.from(new Map<string, StoreProductRecord>(sourceCopyRecords.map(record => [record.baseProductId, record] as const)).values());

  const changeSource = (next: typeof source) => { setSource(next); setSelectedIds([]); setKeyword(''); setError(''); setAddonDraft(undefined); setTargetScopes(['brand']); setAssociationMode('add'); setIndividual(false); };
  const sourceControls = !directUse && !addonTool && tool !== 'method_status' && !copy && !templateTool ? <div className="mb-5 space-y-3 border-b border-[#E5E6EB] pb-5">
    <h3 className="text-sm font-semibold">商品来源</h3><div className="flex flex-wrap gap-2">{([['master', unified ? '商品库' : '商品主档'], ...(!unified ? [['channel_catalog', '渠道商品库']] : []), ['template', '商品下发模板'], ['store', '门店商品']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={source === id} onClick={() => changeSource(id)} className={`${btn} ${source === id ? '!border-[#00B460] !bg-[#EAF8F2] !text-[#008F4C]' : ''}`}>{label}</button>)}</div>
    {source === 'channel_catalog' && <select className={input} aria-label="来源商品库" value={catalogId} onChange={event => { setCatalogId(event.target.value); setSelectedIds([]); setChannelIds([]); }}>{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select>}
    {source === 'template' && <select className={input} aria-label="来源模板" value={templateId} onChange={event => { setTemplateId(event.target.value); setSelectedIds([]); }}>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select>}
    {source === 'store' && <WebStoreScopeSelector stores={PRODUCT_SALES_SCOPE_STORES} value={sourceStoreIds} onChange={ids => { setSourceStoreIds(ids); setSelectedIds([]); }} widthClassName="w-[280px]" />}
  </div> : null;

  const validate = (scope: boolean) => {
    let message = '';
    if (templateTool && !chosenTemplates.length) message = '请选择要使用的模板。';
    else if (!templateTool && !copy && !allDelete && !selectedItems.length) message = `请选择${addonTool ? '加料' : tool === 'method_status' ? '做法值' : '商品'}。`;
    else if (association && tool === 'method_association' && !restrictedStructure && associationMode !== 'clear' && (individual ? selectedIds.some(id => !individualValues[id]?.length) : !methodValues.length)) message = '请为所选商品选择需要修改的做法值。';
    else if (tool === 'method_association' && associationMode === 'default' && (individual ? selectedIds.map(id => individualValues[id] || []) : [methodValues]).some(values => METHOD_GROUPS.some(group => !group.multi && group.values.filter(value => values.includes(value.id)).length > 1))) message = '单选做法组只能设置一个默认值，请调整所选做法。';
    else if (copy && tool === 'copy_store' && !sourceStoreIds.length) message = '请选择一个源门店。';
    else if (copy && tool === 'copy_channel' && (!fromChannel || !toChannel || fromChannel === toChannel)) message = '请选择两个不同的源渠道和目标渠道。';
    else if (copy && !sourceCopyRecords.length) message = '所选来源没有可复制的门店商品，请调整来源范围。';
    else if (scope && storeTarget && !effectiveStores.length) message = '请选择至少一家目标门店。';
    else if (scope && storeTarget && !effectiveChannels.length) message = '请选择至少一个目标渠道。';
    else if (scope && tool === 'copy_channel' && storeIds.length > 100) message = '渠道商品复制一次最多选择 100 家门店。';
    else if (scope && tool === 'copy_store' && sourceStoreIds.some(id => storeIds.includes(id))) message = '源门店不能同时作为目标门店。';
    else if (scope && association && !targetScopes.length) message = '请选择修改的生效范围。';
    else if (scope && execution === 'scheduled' && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) message = '请选择晚于当前时间的执行时间。';
    else if (scope && destructive && !confirmed) message = '请先确认删除或覆盖操作的影响。';
    setError(message); return !message;
  };
  const settingsSummary = templateTool ? chosenTemplates.map(template => template.name).join('、') : tool === 'addon_association' ? addonDraft?.summary || (enabled ? '启用关联加料' : '禁用关联加料') : tool === 'method_association' ? `${restrictedStructure ? enabled ? '启用' : '禁用' : { add: '新增', replace: '覆盖', remove: '移除', clear: '清空', default: '修改默认值' }[associationMode]}做法；${individual ? '分别设置' : METHOD_GROUPS.flatMap(group => group.values).filter(value => methodValues.includes(value.id)).map(value => value.name).join('、')}` : tool === 'addon_bulk' ? enabled ? '上架加料' : '下架加料' : tool === 'method_status' ? enabled ? '启用做法' : '禁用做法' : deletion ? allDelete ? '清空目标门店数据' : '按所选名称匹配删除' : tool === 'copy_channel' ? `${fromChannel && getOmnichannelChannel(fromChannel).name} → ${toChannel && getOmnichannelChannel(toChannel).name}；完全覆盖替换` : `来源：${PRODUCT_SALES_SCOPE_STORES.find(store => store.id === sourceStoreIds[0])?.name || ''}；完整复制`;

  const submit = async (executeManual = false) => {
    if (submitLock.current || !executeManual && !validate(true)) return;
    submitLock.current = true; setSubmitting(true); setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      const now = new Date().toLocaleString('sv-SE', { hour12: false });
      const waiting = !executeManual && execution !== 'now';
      const batchId = result?.id || `TOOL-${Date.now()}`;
      const templateRows = chosenTemplates.flatMap(template => products.slice(0, template.productCount).map(product => ({ id: product.id, name: product.name, templateId: template.id })));
      const rows = templateTool ? templateRows : copy ? copyItems.map(record => ({ id: record.baseProductId, name: record.name })) : allDelete ? tool === 'delete_goods' ? Array.from(new Map(storeRecords.filter(record => storeIds.includes(record.storeId)).map(record => [record.baseProductId, { id: record.baseProductId, name: record.name }])).values()) : MASTER_ADDON_OPTIONS : selectedItems;
      if (!rows.length) { setError('所选范围没有可处理的数据，请返回调整范围。'); return; }
      const targetStoreIds = association ? [...(targetScopes.includes('brand') ? ['brand'] : []), ...(storeTarget ? effectiveStores : [])] : effectiveStores;
      const details = targetStoreIds.flatMap(storeId => (storeId === 'brand' ? [undefined] : effectiveChannels).flatMap(channelId => rows.filter(row => {
        if (storeId === 'brand') return true;
        if (templateTool) { const template = chosenTemplates.find(item => item.id === (row as { templateId?: string }).templateId); return !!template && templateStores.slice(0, template.storeCount).some(store => store.id === storeId) && !!channelId && template.channels.includes(channelId); }
        if (tool === 'delete_goods') return storeRecords.some(record => record.storeId === storeId && record.name === row.name && !!channelId && channelInRecord(record, channelId));
        if (tool === 'copy_channel') return sourceCopyRecords.some(record => record.storeId === storeId && record.baseProductId === row.id);
        if (tool === 'copy_store') return sourceCopyRecords.some(record => record.baseProductId === row.id && !!channelId && channelInRecord(record, channelId));
        if (association && storeTarget && directUse) { const product = products.find(item => item.id === row.id) as Product & { formData?: { salesScope?: ProductSalesScope } }; const scope = product?.formData?.salesScope; return !!scope && scope.storeIds.includes(storeId) && !!channelId && scope.channelIds.includes(channelId); }
        if (association && storeTarget) return storeRecords.some(record => record.storeId === storeId && (record.baseProductId === row.id || record.name === row.name) && !!channelId && channelInRecord(record, channelId));
        return true;
      }).map(row => ({ id: `${batchId}-${storeId}-${channelId || 'brand'}-${row.id}-${(row as { templateId?: string }).templateId || ''}`, taskType: 'qimai' as const, productName: row.name, productId: row.id, skuName: '', skuId: '', storeName: scopeStores.find(store => store.id === storeId)?.name || sourceLabel, storeId: storeId === 'brand' ? '' : storeId, channel: channelId ? getOmnichannelChannel(channelId).name : sourceLabel, action: TITLES[tool], fields: [settingsSummary], status: waiting ? 'waiting' as const : 'success' as const, finishedAt: waiting ? execution === 'manual' ? '等待手动执行' : '等待定时执行' : now }))));
      const uniqueDetails = Array.from(new Map<string, typeof details[number]>(details.map(detail => [detail.id, detail] as const)).values());
      if (!uniqueDetails.length) { setError('所选商品在目标门店和渠道没有匹配数据，请返回调整范围。'); return; }
      const platformOperation = tool === 'addon_bulk' ? 'addon_shelf' : tool === 'method_status' ? 'method' : deletion ? 'delete' : 'structure';
      const platformIds = !waiting && storeTarget ? effectiveChannels.filter(channelId => !(channelId === 'meituan' && tool === 'addon_bulk') && isThirdPartyChannelId(channelId) && config.thirdPartyStrategies[channelId] === 'qimai' && uniqueDetails.some(detail => detail.channel === getOmnichannelChannel(channelId).name)) : [];
      const platformDetails = platformIds.flatMap(channelId => uniqueDetails.filter(detail => detail.channel === getOmnichannelChannel(channelId).name).map(detail => {
        const unsupported = channelId === 'meituan_dine' && products.find(product => product.id === detail.productId)?.type === 'combo';
        const master = products.find(item => item.id === detail.productId);
        const override = source === 'channel_catalog' ? channelProductOverrides[`${catalogId}:${detail.productId}`] : undefined;
        const product = master ? { ...master, ...override, formData: { ...(master as any).formData, ...override?.formData } } : undefined;
        const issues = product && isTakeoutChannel(channelId) && platformOperation === 'structure' ? checkTakeoutProduct(product, channelId) : [];
        const readiness = channelId === 'jd' ? checkJdStoreReadiness(product?.formData?.jdStoreReadiness) : [];
        const failure = unsupported ? '美团在线点暂不支持套餐商品，企迈侧结果不受影响。' : [...issues, ...readiness].map(issue => `${issue.field}：${issue.message}`).join('；');
        return { ...detail, id: `${detail.id}-platform`, taskType: 'platform' as const, action: isTakeoutChannel(channelId) ? takeoutOperationPlan(channelId, platformOperation) : detail.action, status: failure ? 'failed' as const : 'waiting' as const, finishedAt: failure ? now : '等待平台处理', ...(failure ? { error: failure } : {}) };
      }));
      const names = Array.from(new Set(uniqueDetails.map(detail => detail.channel)));
      const batch: PublishBatch = { id: batchId, recordType: 'store_publish', title: TITLES[tool], action: TITLES[tool], sourceType: sourceLabel, sourceName: templateTool ? chosenTemplates.map(template => template.name).join('、') : sourceLabel, snapshot: `${settingsSummary}；${waiting ? execution === 'manual' ? '手动执行' : scheduledAt.replace('T', ' ') : '立即执行'}（本地演示）`, channels: names, storeScope: storeTarget ? scopeName : sourceLabel, storeCount: new Set(uniqueDetails.map(detail => detail.storeId).filter(Boolean)).size, productCount: new Set(uniqueDetails.map(detail => detail.productId)).size, skuCount: 0, status: waiting ? 'running' : 'success', createdAt: result?.createdAt || now, creator: '当前用户', fieldSnapshots: [{ name: TITLES[tool], mode: deletion || copy ? '覆盖' : '修改', after: settingsSummary }], details: [...uniqueDetails, ...platformDetails], tasks: [{ id: `QM-${batchId}`, type: 'qimai', target: storeTarget ? '企迈门店商品' : sourceLabel, channels: names, status: waiting ? 'waiting' : 'success', progress: waiting ? 0 : 100, productCount: rows.length, skuCount: 0, storeCount: storeTarget ? effectiveStores.length : 0, successCount: waiting ? 0 : uniqueDetails.length, failedCount: 0, waitingCount: waiting ? uniqueDetails.length : 0, startedAt: now, finishedAt: waiting ? undefined : now, ...(waiting ? { waitingReason: execution === 'manual' ? '等待手动执行' : `等待 ${scheduledAt.replace('T', ' ')}` } : {}) }, ...platformIds.map(channelId => { const records = platformDetails.filter(detail => detail.channel === getOmnichannelChannel(channelId).name); const failed = records.filter(detail => detail.status === 'failed').length; return { id: `PL-${batchId}-${channelId}`, type: 'platform' as const, target: `${getOmnichannelChannel(channelId).name}平台商品`, channels: [getOmnichannelChannel(channelId).name], status: failed === records.length ? 'failed' as const : 'waiting' as const, progress: failed === records.length ? 100 : 0, productCount: new Set(records.map(record => record.productId)).size, skuCount: 0, storeCount: new Set(records.map(record => record.storeId)).size, successCount: 0, failedCount: failed, waitingCount: records.length - failed, startedAt: now, waitingReason: isTakeoutChannel(channelId) ? takeoutOperationPlan(channelId, platformOperation) : ['douyin', 'meituan_dine'].includes(channelId) ? '等待品牌商品可用；抖音需审核通过后继续门店任务' : '等待平台执行' }; })] };
      onSubmitTask?.(batch); setResult(batch); setStep(3);
    } catch { setError('演示任务未能创建，已保留当前配置，请重试。'); }
    finally { setSubmitting(false); submitLock.current = false; }
  };

  if (tool === 'addon_association' && step === 1 && !restrictedStructure) return <WebBatchAddonAssociation key={`${source}:${catalogId}:${templateId}:${sourceStoreIds.join(',')}`} sourceControls={sourceControls} products={pool.map(product => ({ id: product.id, name: product.name, code: product.skuCode || product.id, type: product.type === 'combo' ? '套餐商品' : '标准商品', price: product.price }))} initialDraft={addonDraft} onBack={onBack} onContinue={draft => { setAddonDraft(draft); setSelectedIds(draft.productIds); setAssociationMode(draft.mode); setStep(2); }} />;

  const selectionTable = <section><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">{addonTool ? '选择加料商品' : tool === 'method_status' ? '选择做法值' : '选择商品'}</h3><label className="flex items-center gap-2 text-sm text-[#667085]"><Search size={16} /><input aria-label="搜索对象" className={input} value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索名称或编码" /></label></div><div className="max-h-[360px] overflow-auto rounded-md border border-[#E5E6EB]"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-[#F5F6F7] text-[#4E5969]"><tr><th className="w-10 p-3"><input type="checkbox" aria-label="全选当前筛选对象" checked={shownItems.length > 0 && shownItems.every(item => selectedIds.includes(item.id))} onChange={() => setSelectedIds(shownItems.every(item => selectedIds.includes(item.id)) ? selectedIds.filter(id => !shownItems.some(item => item.id === id)) : Array.from(new Set([...selectedIds, ...shownItems.map(item => item.id)])))} /></th><th className="p-3">名称</th><th className="p-3">{individual && association ? '本次做法' : '类型 / 编码'}</th></tr></thead><tbody>{shownItems.map(item => <tr key={item.id} className="border-t border-[#F0F1F3] hover:bg-[#FAFBFC]"><td className="p-3"><input aria-label={`选择${item.name}`} type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds(toggle(selectedIds, item.id))} /></td><td className="p-3">{item.name}</td><td className="p-3 text-[#667085]">{individual && association && selectedIds.includes(item.id) ? <div className="flex flex-wrap gap-3">{METHOD_GROUPS.flatMap(group => group.values).map(value => <label key={value.id} className="flex items-center gap-1"><input type="checkbox" checked={(individualValues[item.id] || []).includes(value.id)} onChange={() => setIndividualValues(current => ({ ...current, [item.id]: toggle(current[item.id] || [], value.id) }))} />{value.name}</label>)}</div> : item.description}</td></tr>)}</tbody></table>{!shownItems.length && <div className="p-8 text-center text-sm text-[#667085]">{keyword ? '没有匹配的结果，请调整搜索条件。' : source === 'store' && !sourceStoreIds.length ? '先选择来源门店，再选择商品。' : '当前范围没有可选数据，请调整来源。'}</div>}</div><p className="mt-2 text-xs text-[#667085]">已选 {selectedItems.length} 项</p></section>;
  const storePicker = <WebStoreScopeSelector stores={tool === 'copy_store' ? PRODUCT_SALES_SCOPE_STORES.filter(store => !sourceStoreIds.includes(store.id)) : PRODUCT_SALES_SCOPE_STORES} value={storeIds} onChange={ids => { setStoreIds(ids); setConfirmed(false); }} widthClassName="w-[280px]" />;
  const channelPicker = <div className="flex flex-wrap gap-x-5 gap-y-3">{availableChannels.map(id => <label key={id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={channelIds.includes(id)} onChange={() => { setChannelIds(toggle(channelIds, id)); setConfirmed(false); }} />{getOmnichannelChannel(id).name}</label>)}</div>;

  return <div className="flex h-full min-h-0 flex-col bg-[#F5F6FA] p-5 text-[#1D2129]">
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
      <header className="flex shrink-0 flex-wrap items-center gap-4 border-b border-[#E5E6EB] px-5 py-4"><button className={btn} onClick={onBack} disabled={submitting} aria-label="返回工具页"><ArrowLeft size={16} /></button><h2 ref={heading} tabIndex={-1} className="mr-auto text-base font-semibold outline-none">{TITLES[tool]}</h2><ol className="flex items-center gap-3 text-xs text-[#667085]">{['选择内容', '确认范围', '处理结果'].map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={`flex items-center gap-2 ${step === index + 1 ? 'font-semibold text-[#008F4C]' : ''}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full ${step === index + 1 ? 'bg-[#00B460] text-white' : 'bg-[#F2F4F7]'}`}>{index + 1}</span>{label}{index < 2 && <ChevronRight size={12} />}</li>)}</ol></header>
      <main className="min-h-0 flex-1 overflow-auto px-6 py-5"><div className="mx-auto max-w-[1060px] space-y-5">
        {error && <div role="alert" className="rounded-md bg-[#FFF0F0] p-3 text-sm text-[#B42318]">{error}</div>}
        {step === 1 && <>
          {sourceControls}
          {templateTool ? <><p className="text-sm text-[#667085]">{tool === 'attribute_update' ? '按模板更新门店已有商品的属性，不新增门店商品。' : '使用各模板中已配置的商品、适用门店和渠道。'}</p><div className="overflow-auto rounded-md border border-[#E5E6EB]"><table className="w-full text-left text-sm"><thead className="bg-[#F5F6F7]"><tr><th className="w-10 p-3">选择</th><th className="p-3">模板名称</th><th className="p-3">商品数</th><th className="p-3">适用门店</th><th className="p-3">适用渠道</th></tr></thead><tbody>{templates.map(template => <tr key={template.id} className="border-t border-[#F0F1F3]"><td className="p-3"><input aria-label={`选择${template.name}`} type={tool === 'attribute_update' ? 'radio' : 'checkbox'} name="source-template" checked={templateIds.includes(template.id)} onChange={() => setTemplateIds(tool === 'attribute_update' ? [template.id] : toggle(templateIds, template.id))} /></td><td className="p-3 font-medium">{template.name}<p className="mt-1 text-xs font-normal text-[#667085]">{template.description}</p></td><td className="p-3 tabular-nums">{Math.min(template.productCount, products.length)}</td><td className="p-3 tabular-nums">{template.storeCount} 家</td><td className="p-3 text-[#667085]">{template.channels.map(id => getOmnichannelChannel(id).name).join('、')}</td></tr>)}</tbody></table></div></> : copy ? <>
            {tool === 'copy_store' ? <div className="grid grid-cols-2 gap-6"><label className="space-y-2"><span className="block text-sm font-semibold">源门店</span><WebStoreScopeSelector stores={PRODUCT_SALES_SCOPE_STORES} selectionMode="single" value={sourceStoreIds} onChange={ids => { setSourceStoreIds(ids); setStoreIds(current => current.filter(id => !ids.includes(id))); setConfirmed(false); }} widthClassName="w-full" /></label><div className="space-y-2"><h3 className="text-sm font-semibold">目标门店</h3>{storePicker}</div></div> : <><h3 className="text-sm font-semibold">选择门店</h3>{storePicker}<p className="text-xs text-[#667085]">每次最多 100 家门店。</p><div className="grid grid-cols-2 gap-6">{([['源渠道', fromChannel, setFromChannel], ['目标渠道', toChannel, setToChannel]] as const).map(([label, value, setter]) => <label key={label} className="space-y-2"><span className="block text-sm font-semibold">{label}</span><select aria-label={label} className={`${input} w-full`} value={value} onChange={event => { setter(event.target.value as OmnichannelChannelId); setConfirmed(false); }}><option value="">请选择渠道</option>{channels.map(id => <option key={id} value={id}>{getOmnichannelChannel(id).name}</option>)}</select></label>)}</div></>}
            <div className="rounded-md bg-[#F7F8FA] p-4 text-sm text-[#4E5969]">{copyItems.length ? <>来源共有 {copyItems.length} 个商品：{copyItems.slice(0, 5).map(item => item.name).join('、')}{copyItems.length > 5 ? '等' : ''}</> : '选择来源后，在这里预览将要复制的商品。'}</div>
          </> : <>
            {deletion && <div className="flex items-center gap-6 text-sm"><span className="font-semibold">删除规则</span><label className="flex items-center gap-2"><input type="radio" name="delete-rule" checked={!allDelete} onChange={() => { setAllDelete(false); setConfirmed(false); }} />{addonTool ? '删除部分加料' : '删除所选商品'}</label><label className="flex items-center gap-2"><input type="radio" name="delete-rule" checked={allDelete} onChange={() => { setAllDelete(true); setConfirmed(false); }} />{addonTool ? '删除全部加料' : '清空门店商品'}</label></div>}
            {(tool === 'addon_bulk' || tool === 'method_status' || restrictedStructure) && <div className="flex flex-wrap gap-5 text-sm"><span className="font-semibold">{tool === 'addon_bulk' ? '上下架状态' : '启用状态'}</span>{[true, false].map(value => <label key={String(value)} className="flex items-center gap-2"><input type="radio" name="enabled" checked={enabled === value} onChange={() => setEnabled(value)} />{tool === 'addon_bulk' ? value ? '上架' : '下架' : value ? '启用' : '禁用'}</label>)}{restrictedStructure && <p className="w-full text-xs text-[#667085]">做法和加料沿用商品主档，只调整当前商品库的启用状态。</p>}</div>}
            {tool === 'method_association' && !restrictedStructure && <><div className="flex flex-wrap gap-5 text-sm"><span className="font-semibold">修改方式</span>{[['add', '新增做法'], ['replace', '覆盖做法'], ['remove', '移除做法'], ['clear', '清空做法'], ['default', '更改做法默认值']].map(([id, label]) => <label key={id} className="flex items-center gap-2"><input type="radio" name="association-mode" checked={associationMode === id} onChange={() => { setAssociationMode(id); setConfirmed(false); }} />{label}</label>)}</div><div className="flex gap-5 text-sm">{[false, true].map(value => <label key={String(value)} className="flex items-center gap-2"><input type="radio" name="individual" checked={individual === value} onChange={() => setIndividual(value)} />{value ? '单个修改' : '统一修改'}</label>)}</div>{associationMode !== 'clear' && !individual && <div className="space-y-3 rounded-md border border-[#E5E6EB] p-4">{METHOD_GROUPS.map(group => <div key={group.id} className="flex flex-wrap gap-4 text-sm"><span className="min-w-[120px] font-medium">{group.name}</span>{group.values.length ? group.values.map(value => <label key={value.id} className="flex items-center gap-2"><input type="checkbox" checked={methodValues.includes(value.id)} onChange={() => setMethodValues(toggle(methodValues, value.id))} />{value.name}</label>) : <span className="text-[#667085]">暂无做法值</span>}</div>)}</div>}</>}
            {!allDelete && selectionTable}
          </>}
        </>}
        {step === 2 && <>
          <dl className="grid grid-cols-[100px_1fr] gap-x-5 gap-y-3 rounded-md bg-[#F7F8FA] p-4 text-sm"><dt className="text-[#667085]">本次操作</dt><dd>{settingsSummary}</dd><dt className="text-[#667085]">处理对象</dt><dd>{templateTool ? `${chosenTemplates.length} 个模板` : copy ? `${copyItems.length} 个来源商品` : allDelete ? '目标范围内全部数据' : `${selectedItems.length} 项：${selectedItems.slice(0, 4).map(item => item.name).join('、')}`}</dd></dl>
          {association && <section className="space-y-3"><h3 className="text-sm font-semibold">生效范围</h3><div className="flex flex-wrap gap-5 text-sm">{[['brand', sourceLabel], ['store', '门店商品']].map(([id, label]) => <label key={id} className="flex items-center gap-2"><input type="checkbox" checked={targetScopes.includes(id)} onChange={() => setTargetScopes(toggle(targetScopes, id))} />{label}</label>)}</div>{directUse && <p className="text-xs text-[#667085]">商品库资料在这里维护；更新门店时仅处理商品已配置的适用门店和渠道。</p>}</section>}
          {storeTarget && <section className="space-y-3"><h3 className="text-sm font-semibold">{templateTool ? '模板适用门店和渠道' : '目标门店与渠道'}</h3>{templateTool ? <p className="text-sm leading-6 text-[#4E5969]">{scopeName}<br />{inheritedChannels.map(id => getOmnichannelChannel(id).name).join('、')}</p> : <>{storePicker}{effectiveStores.length > 0 && <p className="text-xs text-[#667085]">{scopeName}</p>}{tool !== 'copy_store' && tool !== 'delete_goods' && tool !== 'copy_channel' ? channelPicker : <p className="text-xs text-[#667085]">{tool === 'copy_channel' ? `${fromChannel && getOmnichannelChannel(fromChannel).name} → ${toChannel && getOmnichannelChannel(toChannel).name}` : '处理门店已有的全部渠道数据。'}</p>}</>}</section>}
          {storeTarget && <WebTakeoutSyncPreview channelIds={effectiveChannels.filter(id => isThirdPartyChannelId(id) && config.thirdPartyStrategies[id] === 'qimai')} operation={tool === 'addon_bulk' ? 'addon_shelf' : tool === 'method_status' ? 'method' : deletion ? 'delete' : 'structure'} />}
          <section className="space-y-3 border-t border-[#E5E6EB] pt-5"><h3 className="text-sm font-semibold">执行时间</h3><div className="flex gap-6 text-sm">{([['now', '立即执行'], ['manual', '手动执行'], ['scheduled', '定时执行']] as const).map(([id, label]) => <label key={id} className="flex items-center gap-2"><input type="radio" name="tool-execution" checked={execution === id} onChange={() => setExecution(id)} />{label}</label>)}</div>{execution === 'scheduled' && <input aria-label="工具定时执行时间" type="datetime-local" className={input} value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} />}</section>
          {destructive && <div className="space-y-3 rounded-md border border-[#FEDF89] bg-[#FFFAEB] p-4 text-sm text-[#7A2E0E]"><p className="flex items-start gap-2"><AlertTriangle size={17} className="shrink-0" />{deletion ? '仅删除目标门店数据，不删除品牌商品资料；如需恢复，请重新下发。删除必选加料可能导致关联商品无法正常点单。' : copy ? '目标范围将按来源商品资料更新；渠道复制会完全覆盖替换目标渠道商品。请先确认目标门店的经营差异。恢复需要重新下发原资料。' : '覆盖、移除或清空会改变商品原有关联，请确认已保留所需做法或加料。恢复需要重新设置。'}</p><label className="flex items-center gap-2"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />我已确认对象、门店、渠道及执行时间</label><p className="text-xs">操作将保留任务记录；生产环境还需接入统一审计日志。</p></div>}
        </>}
        {step === 3 && result && <><div className="flex items-start gap-3 py-2"><CheckCircle2 size={28} className="text-[#008F4C]" /><div><h3 className="text-base font-semibold">{result.status === 'running' ? '任务已创建，等待执行' : '企迈侧演示处理完成'}</h3><p className="mt-2 text-sm text-[#667085]">{result.storeCount} 家门店 · {result.productCount} 项 · 任务 {result.id}</p></div></div><div className="rounded-md border border-[#E5E6EB]"><table className="w-full text-left text-sm"><thead className="bg-[#F5F6F7]"><tr><th className="p-3">处理目标</th><th className="p-3">成功</th><th className="p-3">失败</th><th className="p-3">等待</th><th className="p-3">说明</th></tr></thead><tbody>{result.tasks.map(task => <tr key={task.id} className="border-t border-[#F0F1F3]"><td className="p-3">{task.target}</td><td className="p-3 tabular-nums">{task.successCount}</td><td className="p-3 tabular-nums text-[#B42318]">{task.failedCount}</td><td className="p-3 tabular-nums">{task.waitingCount}</td><td className="p-3 text-[#667085]">{task.failedCount ? '查看任务记录中的失败原因' : task.waitingReason || '本地演示结果'}</td></tr>)}</tbody></table></div><p className="text-xs leading-5 text-[#667085]">此处演示任务与结果，不连接生产门店或平台。平台管理的渠道不创建商品同步任务。</p></>}
      </div></main>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E5E6EB] px-5 py-3"><span aria-live="polite" className="text-xs text-[#667085]">{submitting ? '正在创建演示任务…' : step === 3 ? '可在任务记录查看门店和渠道明细' : '确认提交前不会执行操作'}</span><div className="flex gap-3">{step === 3 ? <><button className={btn} onClick={onBack}>返回工具页</button>{execution === 'manual' && result?.status === 'running' && <button className={btn} disabled={submitting} onClick={() => submit(true)}>执行演示任务</button>}<button className={`${btn} !border-[#00B460] !bg-[#00B460] !text-white`} onClick={onOpenRecords}>查看任务记录</button></> : <><button className={btn} disabled={submitting} onClick={() => step === 2 ? (setError(''), setStep(1)) : onBack()}>{step === 2 ? '上一步' : '取消'}</button><button className={`${btn} !border-[#00B460] !bg-[#00B460] !text-white`} disabled={submitting} onClick={() => step === 1 ? validate(false) && setStep(2) : submit()}>{submitting && <Loader2 size={15} className="animate-spin" />}{step === 1 ? '下一步' : '确认提交'}</button></>}</div></footer>
    </div>
  </div>;
};
