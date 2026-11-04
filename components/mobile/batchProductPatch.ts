import type { Product } from '../../types';

export type BatchNameEditorData = {
  mode: 'individual' | 'uniform';
  uniformMethod: 'overwrite' | 'replace' | 'affix';
  overwriteName: string;
  findText: string;
  replaceText: string;
  affixPosition: 'prefix' | 'suffix';
  affixText: string;
  individualNames: Record<string, string>;
};

export const PRODUCT_NAME_MAX_LENGTH = 70;

export const applyBatchProductName = (
  currentName: string,
  productId: string,
  data?: BatchNameEditorData,
) => {
  if (!data) return currentName;
  if (data.mode === 'individual') return data.individualNames[productId] ?? currentName;
  if (data.uniformMethod === 'overwrite') return data.overwriteName;
  if (data.uniformMethod === 'replace') {
    return data.findText ? currentName.split(data.findText).join(data.replaceText) : currentName;
  }
  return data.affixPosition === 'prefix'
    ? `${data.affixText}${currentName}`
    : `${currentName}${data.affixText}`;
};

export type BatchEditConfiguration = {
  action: 'edit_attr'; fields: string[]; data: Record<string, any>; channels: string[];
};

// Resolve relative changes once. Retries reuse these absolute values.
export function calculateBatchProductPatch(product: Product, batchData: BatchEditConfiguration): Partial<Product> {
  const id = product.id;
              const updates: any = {};

              if (batchData.fields?.includes('p_name')) {
                  const nameData = batchData.data?.p_name as BatchNameEditorData | undefined;
                  const nextName = applyBatchProductName(product.name, product.id, nameData);
                  if (nextName.trim() && nextName !== product.name) {
                      updates.name = nextName;
                  }
              }

              if (batchData.fields?.includes('s_price')) {
                  const priceData = batchData.data?.s_price;
                  if (priceData?.mode === 'uniform') {
                      const isFixedMode = priceData?.uniformMethod === 'fixed';
                      const fixedPrice = Number(priceData?.fixedPrice);
                      const nextFixedPrice = Number.isFinite(fixedPrice) ? fixedPrice : 0;
                      const adjustAmount = Number(priceData?.adjustAmount);
                      const delta = Number.isFinite(adjustAmount) ? adjustAmount : 0;
                      const factor = priceData?.adjustType === 'decrease' ? -1 : 1;

                      if (product.isMultiSpec && product.specs && product.specs.length > 0) {
                          const nextSpecs = product.specs.map(spec => ({
                              ...spec,
                              price: isFixedMode ? nextFixedPrice : (spec.price ?? product.price) + factor * delta,
                          }));
                          const validPrices = nextSpecs
                              .map(spec => spec.price)
                              .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));

                          updates.specs = nextSpecs;
                          if (validPrices.length > 0) {
                              updates.price = Math.min(...validPrices);
                          }
                      } else if (isFixedMode) {
                          updates.price = nextFixedPrice;
                      } else if (delta || priceData?.adjustAmount === '0' || priceData?.adjustAmount === '0.00') {
                          updates.price = product.price + factor * delta;
                      }
                  } else if (product.isMultiSpec && product.specs && product.specs.length > 0) {
                      const specPriceMap = priceData?.specPrices?.[id];
                      if (specPriceMap) {
                          const nextSpecs = product.specs.map((spec, index) => {
                              const nextPrice = Number(specPriceMap[index]);
                              return {
                                  ...spec,
                                  price: Number.isFinite(nextPrice) && specPriceMap[index] !== '' ? nextPrice : (spec.price ?? product.price),
                              };
                          });
                          const validPrices = nextSpecs
                              .map(spec => spec.price)
                              .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));

                          updates.specs = nextSpecs;
                          if (validPrices.length > 0) {
                              updates.price = Math.min(...validPrices);
                          }
                      }
                  } else {
                      const nextPriceValue = priceData?.specPrices?.[id]?.[0];
                      const nextPrice = Number(nextPriceValue);
                      if (Number.isFinite(nextPrice)) {
                          updates.price = nextPrice;
                      }
                  }
              }

              if (batchData.fields?.includes('st_time')) {
                  const timeSaleData = batchData.data?.st_time;
                  if (timeSaleData?.mode === 'always') {
                      updates.timeSales = null;
                  } else if (timeSaleData?.config) {
                      updates.timeSales = timeSaleData.config;
                  }
              }

              batchData.fields?.forEach((field: string) => {
                  if (['p_name', 's_price', 'st_time'].includes(field)) return;
                  if (batchData.data?.[field] !== undefined) {
                      if (field === 'p_cat' && Array.isArray(batchData.data[field])) {
                          updates.category = batchData.data[field].join('、');
                      } else {
                          updates[field] = batchData.data[field];
                      }
                  }
              });

  return updates;
}
