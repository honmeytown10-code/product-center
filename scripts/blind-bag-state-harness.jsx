import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProductProvider, useProducts } from '../context';
import { isBlindBagProduct } from '../blindBag';
import { WebBlindBagProducts } from '../components/web/WebBlindBagProducts';

let root;
function State({ kind }) {
  const { products, deleteProduct, updateProduct } = useProducts();
  React.useEffect(() => { if (kind === 'first-empty') products.filter(isBlindBagProduct).forEach(product => deleteProduct(product.id)); }, [kind]);
  React.useEffect(() => { if (kind === 'long-name') { const product = products.find(item => item.id === 'demo-blind-bag-bakery'); const name = '烘焙鲜食盲袋商品名称及购买须知长文案验收'.repeat(3).slice(0, 70); updateProduct(product.id, { name, formData: { ...product.formData, p_name: name } }); } }, [kind]);
  const permissions = { view: kind !== 'no-permission', create: true, edit: true, publish: true, lifecycle: true,
    ...(kind === 'partial-permission' ? { visibleProductIds: ['demo-blind-bag-bakery'] } : {}),
    ...(kind === 'no-range' ? { visibleProductIds: [] } : {}),
  };
  return <WebBlindBagProducts permissions={permissions} state={kind === 'loading' || kind === 'error' ? kind : 'success'} storeRecords={[]} onCreate={() => {}} onEdit={() => {}} onPublish={() => {}} onRetry={() => {}} />;
}
export function mount(kind) {
  root?.unmount();
  let element = document.getElementById('blind-bag-state-harness');
  if (!element) { element = document.createElement('div'); element.id = 'blind-bag-state-harness'; Object.assign(element.style, { position: 'fixed', inset: '0', display: 'flex', zIndex: '10000' }); document.body.append(element); }
  root = createRoot(element);
  root.render(<ProductProvider><State kind={kind} /></ProductProvider>);
}
export function unmount() { root?.unmount(); root = undefined; document.getElementById('blind-bag-state-harness')?.remove(); }
