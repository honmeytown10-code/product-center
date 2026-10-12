import { useSyncExternalStore } from 'react';
import { useProducts } from '../../context';

export const ATTRIBUTE_TYPES = ['通用属性', '打印属性', '打印统计属性', '打印属性-优先级'] as const;
export type Attribute = { id: string; name: string; type: '文本' | '单选' | '多选' | '数字'; attributeType?: typeof ATTRIBUTE_TYPES[number]; description: string; options: string[]; productTypes: string[]; enabled: boolean; required: boolean };
const INITIAL: Attribute[] = [
    { id: 'custom-1', name: '辣度偏好', type: '单选', description: '补充商品的辣度信息', options: ['不辣', '微辣', '中辣'], productTypes: ['标准商品', '套餐商品'], enabled: true, required: false },
    { id: 'custom-2', name: '过敏原提示', type: '多选', description: '填写商品包含的过敏原', options: ['乳制品', '坚果', '麸质'], productTypes: ['标准商品', '套餐商品'], enabled: true, required: false },
    { id: 'custom-3', name: '杯贴短文案', type: '文本', description: '', options: [], productTypes: ['标准商品'], enabled: true, required: false },
    { id: 'custom-4', name: '咖啡因含量', type: '数字', description: '', options: [], productTypes: ['标准商品'], enabled: false, required: false },
];
const cache = new Map<string, Attribute[]>();
const listeners = new Set<() => void>();
const read = (key: string) => {
    if (!cache.has(key)) {
        try { const stored = JSON.parse(localStorage.getItem(key) || 'null'); cache.set(key, Array.isArray(stored) && stored.every(item => item && typeof item.id === 'string' && Array.isArray(item.options) && Array.isArray(item.productTypes)) ? stored : INITIAL); }
        catch { cache.set(key, INITIAL); }
    }
    return cache.get(key)!;
};
export function useCustomAttributeDefinitions() {
    const { activeBrandId } = useProducts();
    const key = `product-center:custom-attributes:v1:${activeBrandId}`;
    const records = useSyncExternalStore(callback => { listeners.add(callback); return () => { listeners.delete(callback); }; }, () => read(key), () => INITIAL);
    const setRecords = (update: Attribute[] | ((current: Attribute[]) => Attribute[])) => {
        const next = typeof update === 'function' ? update(read(key)) : update;
        cache.set(key, next);
        // Local prototype persistence, not a production configuration endpoint.
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep the current session editable if browser storage is full. */ }
        listeners.forEach(callback => callback());
    };
    return [records, setRecords] as const;
}
