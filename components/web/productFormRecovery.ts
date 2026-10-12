// Local recovery is not a saved draft and never creates a product or a publish task.
export type ProductFormRecovery = {
  version: 1;
  categoryId: string;
  product: { id: string; name: string; price: number; image: string; formData: Record<string, any> };
};

export const productFormRecoveryKey = (brandId: string, scope: string, type: string, catalogId = '') =>
  `product-center:create-recovery:v1:${brandId}:${scope}:${catalogId}:${type}`;

export const readProductFormRecovery = (key: string): ProductFormRecovery | null => {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (value?.version !== 1 || typeof value.categoryId !== 'string' || !value.product ||
        typeof value.product.name !== 'string' || typeof value.product.formData !== 'object' || !value.product.formData) return null;
    return value;
  } catch { return null; }
};

export const clearProductFormRecovery = (key?: string) => {
  if (!key) return;
  try { window.localStorage.removeItem(key); } catch { /* Browser storage may be unavailable. */ }
};
