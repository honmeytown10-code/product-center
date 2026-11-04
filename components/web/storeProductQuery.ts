export type StoreProductQuery = { productId: string; skuId: string; productType: string; shelfStatus: string; stockStatus: string };
export const EMPTY_STORE_PRODUCT_QUERY: StoreProductQuery = { productId: '', skuId: '', productType: 'all', shelfStatus: 'all', stockStatus: 'all' };
export function matchesStoreProductQuery(record: { baseProductId: string; specs?: Array<{ id: string }>; type: string; status: string; stockStatus: string }, query: StoreProductQuery) {
  return (!query.productId.trim() || record.baseProductId.toLowerCase().includes(query.productId.trim().toLowerCase()))
    && (!query.skuId.trim() || (record.specs || []).some(spec => spec.id.toLowerCase().includes(query.skuId.trim().toLowerCase())))
    && (query.productType === 'all' || record.type === query.productType)
    && (query.shelfStatus === 'all' || record.status === query.shelfStatus)
    && (query.stockStatus === 'all' || record.stockStatus === query.stockStatus);
}
