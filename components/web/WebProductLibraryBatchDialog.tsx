import React, { useMemo, useRef, useState } from 'react';
import { useProducts } from '../../context';
import type { Product } from '../../types';
import { WebPublishDialog } from './WebPublishDialog';
import { INITIAL_RECORDS } from './WebProductTemplateManager';

const secondary = 'rounded-md border border-[#DDE3EA] px-4 py-2 text-sm text-[#4E5969] hover:bg-[#F7F8FA] disabled:opacity-50';
const primary = 'rounded-md bg-[#008647] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00783F] disabled:cursor-not-allowed disabled:opacity-50';
const control = 'h-9 rounded-md border border-[#D0D5DD] bg-white px-3 text-sm text-[#344054] focus:border-[#008647] focus:outline-none';

export function applyLibraryPrice(product: Product, transform: (price: number) => number): { patch: Partial<Product>; changed: number; skipped: number } {
  const form = (product as Product & { formData?: Record<string, any> }).formData;
  const rows = form?.takeoutFormState?.specConfigRows;
  const prices = rows?.length ? rows.map((row: any) => Number(row.s_spec_price)) : product.specs?.length ? product.specs.map(row => Number(row.price ?? product.price)) : [Number(product.price)];
  let changed = 0, skipped = 0;
  const values = prices.map((price: number) => {
    const next = Math.round(transform(price) * 100) / 100;
    if (!Number.isFinite(price) || !Number.isFinite(next) || next < 0) { skipped++; return price; }
    if (next !== price) changed++;
    return next;
  });
  const patch: Record<string, any> = { price: values[0] };
  if (!rows?.length && product.specs?.length) patch.specs = product.specs.map((row, index) => ({ ...row, price: values[index] }));
  if (form) patch.formData = {
    ...form,
    s_price: values[0],
    ...(rows?.length ? { takeoutFormState: { ...form.takeoutFormState, specConfigRows: rows.map((row: any, i: number) => ({ ...row, s_spec_price: String(values[i]) })) } } : {}),
  };
  return { patch, changed, skipped };
}

export const WebProductLibraryBatchDialog: React.FC<{
  action: 'price' | 'template' | 'enable';
  products: Product[];
  templateProductIds?: Record<string, string[]>;
  onAddToTemplates?: (templateIds: string[], productIds: string[]) => void | Promise<void>;
  onCancel: () => void;
  onComplete: (message: string) => void;
}> = ({ action, products: targets, templateProductIds = {}, onAddToTemplates, onCancel, onComplete }) => {
  const { products, updateProduct } = useProducts();
  const [direction, setDirection] = useState<'add' | 'subtract'>('add');
  const [unit, setUnit] = useState<'amount' | 'percent'>('amount');
  const [amount, setAmount] = useState('0.00');
  const [templateIds, setTemplateIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const delta = Number(amount);
  const invalidPrice = amount.trim() === '' || !Number.isFinite(delta) || delta <= 0;
  const transform = (price: number) => price + (direction === 'add' ? 1 : -1) * (unit === 'amount' ? delta : price * delta / 100);
  const preview = useMemo(() => targets.map(product => ({ product, ...applyLibraryPrice(product, transform) })), [targets, direction, unit, amount]);
  const changed = preview.reduce((sum, item) => sum + item.changed, 0);
  const skipped = preview.reduce((sum, item) => sum + item.skipped, 0);
  const close = React.useCallback(() => { if (!lock.current) onCancel(); }, [onCancel]);
  const submit = async () => {
    if (lock.current) return;
    if (targets.some(target => !products.some(product => product.id === target.id))) { setError('商品已发生变化，请关闭弹窗并重新选择。'); return; }
    if (action === 'price' && (invalidPrice || !changed)) { setError('请输入大于 0 的改价幅度，并确认至少一个规格可以改价。'); return; }
    if (action === 'template' && (!templateIds.length || !onAddToTemplates)) { setError('请选择商品下发模板。'); return; }
    lock.current = true; setSubmitting(true); setError('');
    try {
      if (action === 'price') {
        const current = targets.map(target => products.find(product => product.id === target.id)!);
        const updates = current.map(product => ({ product, ...applyLibraryPrice(product, transform) }));
        updates.filter(item => item.changed > 0).forEach(item => updateProduct(item.product.id, item.patch));
        onComplete(`商品库改价完成：${updates.reduce((sum, item) => sum + item.changed, 0)} 个规格已修改，${updates.reduce((sum, item) => sum + item.skipped, 0)} 个规格超出价格范围未修改。`);
      } else if (action === 'enable') {
        targets.forEach(product => updateProduct(product.id, { status: 'on_shelf' }));
        onComplete(`已启用 ${targets.length} 个商品，未自动上架门店商品。`);
      } else {
        await onAddToTemplates!(templateIds, targets.map(product => product.id));
        onComplete(`已将 ${targets.length} 个商品加入 ${templateIds.length} 个商品下发模板，已有商品保留，未下发至门店。`);
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : '操作失败，请重试。已选商品和设置已保留。'); }
    finally { lock.current = false; setSubmitting(false); }
  };
  return <WebPublishDialog title={action === 'price' ? '批量改价' : action === 'template' ? '加入到商品下发模板' : '确认批量启用商品'} onClose={close}
    footer={<><button type="button" disabled={submitting} onClick={close} className={secondary}>取消</button><button type="button" disabled={submitting || (action === 'price' && (invalidPrice || !changed)) || (action === 'template' && !templateIds.length)} onClick={submit} className={primary}>{submitting ? '处理中…' : '确认'}</button></>}>
    <p className="mb-4 text-sm text-[#4E5969]">已选择 <strong className="text-[#008647]">{targets.length}</strong> 个商品{action === 'price' ? '，修改商品库各规格销售价。' : '。'}</p>
    {action === 'price' && <>
      <fieldset disabled={submitting} className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm text-[#4E5969]">
        <span>改价类型</span><div className="flex gap-3"><select aria-label="改价类型" value={direction} onChange={event => setDirection(event.target.value as typeof direction)} className={control}><option value="add">加价</option><option value="subtract">减价</option></select><select aria-label="改价方式" value={unit} onChange={event => setUnit(event.target.value as typeof unit)} className={control}><option value="amount">固定金额</option><option value="percent">百分比</option></select></div>
        <label htmlFor="library-price-amount">改价幅度</label><div className="flex items-center gap-2"><input id="library-price-amount" type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className={control} />{unit === 'amount' ? '元' : '%'}</div>
      </fieldset>
      <p className="mt-4 text-xs leading-5 text-[#667085]">仅修改商品库，不自动更新门店、渠道商品或模板。减价后小于 0 的规格不生效，例如原价 1 元减价 10 元，该规格保持原价。</p>
      {!invalidPrice && <p role="status" className="mt-3 text-sm text-[#4E5969]">预计修改 {changed} 个规格；{skipped} 个规格超出价格范围，将跳过。</p>}
    </>}
    {action === 'enable' && <p className="rounded-md bg-[#F7F8FA] p-4 text-sm leading-6 text-[#4E5969]">启用后商品库商品恢复可用，不会自动上架任何门店商品。请按需要再下发或管理门店上下架。</p>}
    {action === 'template' && <>
      <fieldset disabled={submitting} className="space-y-2">{INITIAL_RECORDS.filter(template => template.status === 'enabled').map(template => {
        const already = targets.filter(product => (templateProductIds[template.id] || []).includes(product.id)).length;
        return <label key={template.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-[#E5E6EB] px-3 py-2 text-sm text-[#4E5969]"><span className="flex items-center gap-2"><input type="checkbox" checked={templateIds.includes(template.id)} onChange={() => setTemplateIds(current => current.includes(template.id) ? current.filter(id => id !== template.id) : [...current, template.id])} className="accent-[#008647]" />{template.name}</span><small className="text-[#667085]">{already ? `${already} 个商品已在模板中` : '可加入'}</small></label>;
      })}</fieldset>
      <p className="mt-4 text-xs leading-5 text-[#667085]">已有模板商品保留，不重复添加或覆盖差异资料；本次只加入模板，不下发门店。</p>
    </>}
    {error && <p role="alert" className="mt-4 text-sm text-[#CB2634]">{error}</p>}
  </WebPublishDialog>;
};
