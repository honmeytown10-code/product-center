// Isolated prototype catalog. Production lookup uses the exact order SKU code
// within authorized brand libraries, never a product-name similarity match.
export interface AlertCatalogProduct {
  id: string;
  name: string;
  libraryName: string;
  ready: boolean;
  skus: Array<{ id: string; spec: string; tradeMark?: string }>;
}
export const DEMO_LIBRARY_PRODUCTS: AlertCatalogProduct[] = [
  { id: 'library-silky-latte', name: '生椰丝绒拿铁', libraryName: '外卖商品库', ready: true,
    skus: [{ id: '623802011', spec: '大杯 · 冰', tradeMark: 'COFFEE-SILKY-ICE' }, { id: '623802012', spec: '大杯 · 热', tradeMark: 'COFFEE-SILKY-HOT' }] },
  { id: 'library-coconut-latte', name: '生椰拿铁', libraryName: '外卖商品库', ready: true,
    skus: [{ id: '623801955', spec: '大杯 · 冰' }] },
  { id: 'library-silky-latte-draft', name: '生椰丝绒拿铁（资料待完善）', libraryName: '外卖商品库', ready: false,
    skus: [{ id: '623802111', spec: '大杯 · 冰' }] },
];
export type LibrarySkuLookup =
  | { status: 'missing' | 'ambiguous' }
  | { status: 'found'; product: AlertCatalogProduct; sku: AlertCatalogProduct['skus'][number] };
export function lookupLibrarySku(code: string, products = DEMO_LIBRARY_PRODUCTS): LibrarySkuLookup {
  const matches = products.flatMap(product => product.skus.filter(sku => sku.id === code).map(sku => ({ product, sku })));
  if (!matches.length) return { status: 'missing' };
  if (matches.length !== 1) return { status: 'ambiguous' };
  return { status: 'found', ...matches[0] };
}
// Brand-maintained identifiers are independent from Qimai skuid. No fallback.
export function lookupLibraryTradeMark(value: string, products = DEMO_LIBRARY_PRODUCTS): LibrarySkuLookup {
  if (!value.trim()) return { status: 'missing' };
  const matches = products.flatMap(product => product.skus.filter(sku => sku.tradeMark === value).map(sku => ({ product, sku })));
  if (!matches.length) return { status: 'missing' };
  if (matches.length !== 1) return { status: 'ambiguous' };
  return { status: 'found', ...matches[0] };
}
