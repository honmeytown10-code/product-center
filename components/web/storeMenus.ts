// Fusion prototype: menus are owned by a store, independently of organization regions.
// Production: replace these fixtures with the authorized store-menu / store-product APIs.
import type { StoreScopeOption } from './WebStoreScopeSelector';

export type StoreMenuRecord = { id: string; storeId: string; sort: number; name: string; icon?: string; productIds: string[] };
export type MenuProduct = { id: string; name: string; type: string; category: string; price: number; image: string; code: string };
export const MENU_STORES: StoreScopeOption[] = [
  { id: 's1', name: '范先生的门店', code: 'S001', organization: '直营门店', tags: [] },
  { id: 's2', name: '南山万象店', code: 'S002', organization: '直营门店', tags: [] },
  { id: 's3', name: '福田卓悦店', code: 'S003', organization: '直营门店', tags: [] },
];
export const MENU_PRODUCTS: MenuProduct[] = [
  { id: 'rp-1', name: '招牌珍珠奶茶', type: '标准商品', category: '现制饮品', price: 18, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=120&h=120&fit=crop', code: 'SP00012876' },
  { id: 'rp-2', name: '手打柠檬茶', type: '标准商品', category: '现制饮品', price: 22, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=120&h=120&fit=crop', code: 'SP00012877' },
  { id: 'rp-3', name: '超值双人套餐', type: '套餐商品', category: '套餐', price: 49, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=120&h=120&fit=crop', code: 'SP00012878' },
  { id: 'rp-4', name: '精品拿铁', type: '标准商品', category: '咖啡', price: 26, image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=120&h=120&fit=crop', code: 'SP00012879' },
];
export const INITIAL_STORE_MENUS: StoreMenuRecord[] = [
  // Illustrative uploaded icon; menus without an icon remain valid and have no default icon.
  { id: 'menu-1', storeId: 's1', sort: 1, name: '人气推荐', icon: new URL('../../assets/store-menu-recommendation-icon.svg', import.meta.url).href, productIds: ['rp-1', 'rp-2'] },
  { id: 'menu-2', storeId: 's1', sort: 2, name: '超值套餐', productIds: ['rp-3'] },
  { id: 'menu-3', storeId: 's2', sort: 1, name: '现制饮品', productIds: ['rp-1', 'rp-2', 'rp-4'] },
];
export const menuStoreName = (storeId: string) => MENU_STORES.find(store => store.id === storeId)?.name || storeId;
