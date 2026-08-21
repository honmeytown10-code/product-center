import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Info, LockKeyhole, RefreshCw, X } from 'lucide-react';
import type { Product } from '../../types';

export type MasterChannelSyncFieldId =
  | 'name'
  | 'frontendCategory'
  | 'price'
  | 'mainImage'
  | 'productType'
  | 'productCategory'
  | 'backendCategory'
  | 'mnemonicCode'
  | 'weightFlag'
  | 'unit'
  | 'specs'
  | 'methods'
  | 'addons'
  | 'tax';

export type MasterChannelSyncCatalog = {
  id: string;
  name: string;
  channelNames: string[];
};

export type MasterChannelSyncSubmitPayload = {
  productIds: string[];
  catalogIds: string[];
  fieldIds: MasterChannelSyncFieldId[];
  fieldNames: string[];
};

export type MasterChannelSyncDialogContext = {
  entry: 'after-save' | 'master-list' | 'channel-list';
  products: Product[];
  catalogs: MasterChannelSyncCatalog[];
  lockedCatalogId?: string;
  changedFieldIds?: MasterChannelSyncFieldId[];
};

type FieldDefinition = {
  id: MasterChannelSyncFieldId;
  label: string;
  defaultSelected: boolean;
  selectionMode: 'locked' | 'optional';
  description: string;
};

const FIELD_DEFINITIONS: FieldDefinition[] = [
  { id: 'name', label: '商品名称', defaultSelected: true, selectionMode: 'optional', description: '渠道可维护；勾选后使用主档名称覆盖渠道商品名称。' },
  { id: 'frontendCategory', label: '前台分类', defaultSelected: true, selectionMode: 'optional', description: '渠道可维护；勾选后使用主档默认分类覆盖当前商品库归属。' },
  { id: 'price', label: '规格售价', defaultSelected: true, selectionMode: 'optional', description: '渠道可维护；勾选后按当前 SKU 对应关系更新渠道售价。' },
  { id: 'mainImage', label: '商品主图', defaultSelected: true, selectionMode: 'optional', description: '渠道可维护；勾选后使用主档当前主图覆盖渠道主图。' },
  { id: 'productType', label: '商品类型', defaultSelected: true, selectionMode: 'locked', description: '渠道不可修改，固定同步标准商品或套餐商品身份。' },
  { id: 'productCategory', label: '商品类目', defaultSelected: true, selectionMode: 'locked', description: '渠道不可修改，固定使用主档商品类目及类目字段结构。' },
  { id: 'backendCategory', label: '后台分类', defaultSelected: true, selectionMode: 'locked', description: '渠道不可修改，固定同步主档后台经营分类。' },
  { id: 'mnemonicCode', label: '数字助记码', defaultSelected: true, selectionMode: 'locked', description: '渠道不可修改，固定同步主档数字助记码。' },
  { id: 'weightFlag', label: '称重商品属性', defaultSelected: true, selectionMode: 'locked', description: '渠道不可修改，固定同步是否称重商品。' },
  { id: 'unit', label: '计量单位', defaultSelected: true, selectionMode: 'locked', description: '渠道不可修改，始终使用主档当前计量单位。' },
  { id: 'specs', label: '规格结构', defaultSelected: true, selectionMode: 'locked', description: '固定同步规格组、规格值及 SKU 组合，并重新校验渠道可售范围。' },
  { id: 'methods', label: '做法', defaultSelected: true, selectionMode: 'locked', description: '固定同步做法定义与关联关系；渠道仍可缩小启用范围。' },
  { id: 'addons', label: '加料', defaultSelected: true, selectionMode: 'locked', description: '固定同步加料定义与关联关系；渠道仍可缩小启用范围。' },
  { id: 'tax', label: '税率设置', defaultSelected: true, selectionMode: 'locked', description: '固定同步税收分类、税率、开票项目名称和自定义开票单位。' },
];

const getFrontendCategory = (product: Product) => {
  const formData = (product as Product & { formData?: Record<string, unknown> }).formData;
  const value = formData?.p_front_cat;
  if (Array.isArray(value) && value.length > 0) return String(value[value.length - 1]);
  if (typeof value === 'string' && value.trim()) return value;
  return product.category || '未分类';
};

const getFieldValue = (product: Product, fieldId: MasterChannelSyncFieldId) => {
  const formData = (product as Product & { formData?: Record<string, unknown> }).formData || {};
  if (fieldId === 'name') return product.name;
  if (fieldId === 'frontendCategory') return getFrontendCategory(product);
  if (fieldId === 'price') return product.specs?.length
    ? `${product.specs.length} 个规格，¥${Number(product.specs[0]?.price ?? product.price).toFixed(2)} 起`
    : `¥${Number(product.price || 0).toFixed(2)}`;
  if (fieldId === 'mainImage') return product.image ? '已配置主图' : '未配置';
  if (fieldId === 'productType') return product.type === 'combo' || product.isCombo ? '套餐商品' : '标准商品';
  if (fieldId === 'productCategory') return String(formData.p_cat || product.category || '未选择');
  if (fieldId === 'backendCategory') return String(formData.p_back_cat || '未选择');
  if (fieldId === 'mnemonicCode') return String(formData.p_code || '未填写');
  if (fieldId === 'weightFlag') return formData.p_weight_flag ? '称重商品' : '非称重商品';
  if (fieldId === 'unit') return String(formData.p_unit || '未填写');
  if (fieldId === 'specs') return product.specs?.length ? `${product.specs.length} 个 SKU` : '按主档当前规格';
  if (fieldId === 'methods') return formData.m_methods ? '已配置做法' : '按主档当前做法';
  if (fieldId === 'addons') return formData.a_addons ? '已配置加料' : '按主档当前加料';
  if (fieldId === 'tax') {
    const taxName = String(formData.s_tax_category_name || '未选择税收分类');
    const taxRate = String(formData.s_tax_rate || '未设置税率');
    return `${taxName} · ${taxRate}`;
  }
  return '—';
};

export const WebMasterChannelSyncDialog: React.FC<{
  context: MasterChannelSyncDialogContext;
  onClose: () => void;
  onSubmit: (payload: MasterChannelSyncSubmitPayload) => void;
  onOpenRecords: () => void;
}> = ({ context, onClose, onSubmit, onOpenRecords }) => {
  const defaultFieldIds = useMemo(() => FIELD_DEFINITIONS.filter(field => field.defaultSelected).map(field => field.id), []);
  const availableCatalogIds = context.catalogs.map(catalog => catalog.id);
  const initialCatalogIds = context.lockedCatalogId ? [context.lockedCatalogId] : availableCatalogIds;
  const [selectedFieldIds, setSelectedFieldIds] = useState<MasterChannelSyncFieldId[]>(defaultFieldIds);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>(initialCatalogIds);
  const [showLockedFieldDetails, setShowLockedFieldDetails] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const title = context.entry === 'after-save'
    ? '商品主档已保存'
    : context.entry === 'channel-list'
      ? '从商品主档更新'
      : '同步至渠道商品';
  const selectedFields = FIELD_DEFINITIONS.filter(field => selectedFieldIds.includes(field.id));
  const lockedFields = FIELD_DEFINITIONS.filter(field => field.selectionMode === 'locked');
  const optionalFields = FIELD_DEFINITIONS.filter(field => field.selectionMode === 'optional');
  const selectedOptionalFields = FIELD_DEFINITIONS.filter(field => field.selectionMode === 'optional' && selectedFieldIds.includes(field.id));
  const selectedCatalogs = context.catalogs.filter(catalog => selectedCatalogIds.includes(catalog.id));
  const canSubmit = selectedFieldIds.length > 0 && selectedCatalogIds.length > 0;
  const firstProduct = context.products[0];

  const toggleField = (fieldId: MasterChannelSyncFieldId) => {
    if (FIELD_DEFINITIONS.find(field => field.id === fieldId)?.selectionMode === 'locked') return;
    setSelectedFieldIds(current => current.includes(fieldId)
      ? current.filter(id => id !== fieldId)
      : [...current, fieldId]);
  };

  const toggleCatalog = (catalogId: string) => {
    if (context.lockedCatalogId) return;
    setSelectedCatalogIds(current => current.includes(catalogId)
      ? current.filter(id => id !== catalogId)
      : [...current, catalogId]);
  };

  const selectAllCatalogs = () => {
    if (context.lockedCatalogId) return;
    setSelectedCatalogIds(availableCatalogIds);
  };

  const clearCatalogs = () => {
    if (context.lockedCatalogId) return;
    setSelectedCatalogIds([]);
  };

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      productIds: context.products.map(product => product.id),
      catalogIds: selectedCatalogIds,
      fieldIds: selectedFieldIds,
      fieldNames: selectedFields.map(field => field.label),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="更新任务已创建">
        <div className="w-[520px] rounded-lg bg-white p-8 text-center shadow-2xl">
          <CheckCircle2 size={42} className="mx-auto text-[#00B460]" />
          <h2 className="mt-4 text-xl font-bold text-[#1D2129]">更新任务已创建</h2>
          <p className="mx-auto mt-2 max-w-[400px] text-sm leading-6 text-[#667085]">
            将为 {context.products.length} 个商品更新 {selectedFields.length} 个字段，涉及 {selectedCatalogs.length} 个渠道商品库。任务在后台执行，可继续处理其他商品。
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={onClose} className="console-secondary-button">完成</button>
            <button type="button" onClick={onOpenRecords} className="console-primary-button">
              查看同步记录 <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex max-h-[88vh] w-[1080px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between border-b border-[#E8E8E8] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#1D2129]">{title}</h2>
            <p className="mt-1 text-sm text-[#667085]">
              {context.entry === 'after-save'
                ? '主档保存已完成，可选择将本次资料更新到渠道商品；暂不处理不会影响已保存的主档。'
                : context.entry === 'channel-list'
                  ? `选择需要从主档更新到“${context.catalogs[0]?.name || '当前商品库'}”的字段。`
                  : '选择需要同步的字段和渠道商品库，系统将生成后台更新任务。'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#667085] hover:bg-[#F2F3F5]" aria-label="关闭"><X size={20} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          <section className="rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-3">
            <div className="flex items-center gap-3">
              {firstProduct?.image && <img src={firstProduct.image} alt="" className="h-11 w-11 rounded border border-[#E5E7EB] object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[#1D2129]">{context.products.length === 1 ? firstProduct?.name : `已选择 ${context.products.length} 个商品主档`}</div>
                <div className="mt-1 text-xs text-[#98A2B3]">{context.products.length === 1 ? `商品ID ${firstProduct?.id}` : '所有商品使用同一字段范围，按各自主档当前值更新'}</div>
              </div>
              <span className="rounded bg-[#EAF8F1] px-2.5 py-1 text-xs font-medium text-[#008F4C]">来源：商品主档</span>
            </div>
          </section>

          <div className="mt-5 grid min-h-0 grid-cols-[minmax(0,1fr)_350px] items-start gap-5">
            <section className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#1D2129]">1. 确认更新字段</h3>
                  <p className="mt-1 text-xs text-[#667085]">固定字段必定同步；渠道可维护字段可按本次需要选择。</p>
                </div>
                <span className="shrink-0 rounded bg-[#EAF8F1] px-2.5 py-1 text-xs font-medium text-[#008F4C]">共更新 {selectedFields.length} 项</span>
              </div>

              <div className="rounded-lg border border-[#CDEBDB] bg-[#F5FCF8] px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1D2129]">
                      <LockKeyhole size={15} className="text-[#00A85A]" />固定同步 {lockedFields.length} 项
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#667085]">这些字段由商品主档统一控制，创建任务时自动更新且不可取消。</p>
                  </div>
                  <button type="button" onClick={() => setShowLockedFieldDetails(value => !value)} className="shrink-0 text-xs font-medium text-[#008F4C] hover:underline">
                    {showLockedFieldDetails ? '收起明细' : '查看明细'}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {lockedFields.map(field => <span key={field.id} className="rounded border border-[#D6EDE1] bg-white px-2 py-1 text-xs text-[#475467]">{field.label}</span>)}
                </div>
                {showLockedFieldDetails && (
                  <div className="mt-3 overflow-hidden rounded-md border border-[#DCEDE4] bg-white">
                    {lockedFields.map((field, index) => (
                      <div key={field.id} className={`grid grid-cols-[118px_145px_1fr] gap-3 px-3 py-2.5 text-xs ${index ? 'border-t border-[#EEF2F0]' : ''}`}>
                        <span className="font-medium text-[#1D2129]">{field.label}</span>
                        <span className="truncate text-[#667085]" title={firstProduct ? getFieldValue(firstProduct, field.id) : ''}>{firstProduct ? getFieldValue(firstProduct, field.id) : '按各商品当前值'}</span>
                        <span className="leading-5 text-[#98A2B3]">{field.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1D2129]">可选择更新</h4>
                  <span className="text-xs text-[#667085]">已选 {selectedOptionalFields.length}/{optionalFields.length} 项</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {optionalFields.map(field => {
                    const checked = selectedFieldIds.includes(field.id);
                    const changed = context.changedFieldIds?.includes(field.id);
                    return (
                      <label key={field.id} className={`cursor-pointer rounded-lg border px-3.5 py-3 ${checked ? 'border-[#00B460] bg-[#F5FCF8]' : 'border-[#E5E7EB] bg-white hover:border-[#B7E7CF]'}`}>
                        <div className="flex items-start gap-2.5">
                          <input type="checkbox" checked={checked} onChange={() => toggleField(field.id)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#00B460]" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-[#1D2129]">
                              {field.label}
                              {changed && <span className="rounded bg-[#FFF4E5] px-1.5 py-0.5 text-[10px] font-medium text-[#C76600]">本次已修改</span>}
                            </div>
                            <div className="mt-1 truncate text-xs text-[#667085]" title={firstProduct ? getFieldValue(firstProduct, field.id) : ''}>{firstProduct ? getFieldValue(firstProduct, field.id) : '按各商品当前值'}</div>
                            <div className="mt-1 text-xs leading-5 text-[#98A2B3]">{field.description}</div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#D9EAFB] bg-[#F5FAFF] px-4 py-3 text-xs leading-5 text-[#476582]">
                <Info size={15} className="mt-0.5 shrink-0" />
                <span>只更新渠道商品库资料，不会直接发布到门店或三方平台。未勾选的渠道可维护字段保留原值。</span>
              </div>
            </section>

            <aside className="sticky top-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#1D2129]">2. {context.lockedCatalogId ? '确认当前商品库' : '选择渠道商品库'}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#98A2B3]">仅展示当前账号有数据权限的商品库。</p>
                </div>
                {!context.lockedCatalogId && context.catalogs.length > 1 && (
                  <div className="flex shrink-0 gap-2 text-xs">
                    <button type="button" onClick={selectAllCatalogs} className="text-[#008F4C] hover:underline">全选</button>
                    <button type="button" onClick={clearCatalogs} className="text-[#667085] hover:underline">清空</button>
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {context.catalogs.map(catalog => {
                  const checked = selectedCatalogIds.includes(catalog.id);
                  return (
                    <label key={catalog.id} className={`flex min-h-[68px] items-start gap-3 rounded-lg border px-3 py-3 ${context.lockedCatalogId ? 'cursor-default' : 'cursor-pointer'} ${checked ? 'border-[#00B460] bg-[#F3FBF7]' : 'border-[#E5E7EB] bg-white hover:border-[#B7E7CF]'}`}>
                      <input type="checkbox" checked={checked} disabled={Boolean(context.lockedCatalogId)} onChange={() => toggleCatalog(catalog.id)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#00B460] disabled:opacity-100" />
                      <div className="min-w-0">
                        <div className="font-bold text-[#1D2129]">{catalog.name}</div>
                        <div className="mt-1 line-clamp-2 text-xs leading-5 text-[#98A2B3]">{catalog.channelNames.join('、')}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {selectedCatalogIds.length === 0 && <div className="mt-2 text-xs font-medium text-[#D92D20]">请至少选择一个渠道商品库</div>}

              <div className="mt-4 rounded-lg bg-[#F7F8FA] px-3.5 py-3">
                <div className="text-sm font-bold text-[#1D2129]">本次更新范围</div>
                <dl className="mt-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3"><dt className="text-[#667085]">商品主档</dt><dd className="font-medium text-[#1D2129]">{context.products.length} 个</dd></div>
                  <div className="flex items-center justify-between gap-3"><dt className="text-[#667085]">渠道商品库</dt><dd className="font-medium text-[#1D2129]">{selectedCatalogIds.length} 个</dd></div>
                  <div className="flex items-center justify-between gap-3"><dt className="text-[#667085]">固定同步</dt><dd className="font-medium text-[#1D2129]">{lockedFields.length} 项</dd></div>
                  <div className="flex items-center justify-between gap-3"><dt className="text-[#667085]">可选更新</dt><dd className="font-medium text-[#1D2129]">{selectedOptionalFields.length} 项</dd></div>
                </dl>
              </div>
            </aside>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-[#E8E8E8] px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-[#98A2B3]"><RefreshCw size={13} />提交后可在“发布中心—同步记录”查看进度与失败原因</div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="console-secondary-button">{context.entry === 'after-save' ? '稍后处理' : '取消'}</button>
            <button type="button" disabled={!canSubmit} onClick={submit} className="console-primary-button disabled:cursor-not-allowed disabled:opacity-40">创建更新任务</button>
          </div>
        </footer>
      </div>
    </div>
  );
};
