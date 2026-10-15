import React, { useMemo, useState } from 'react';
import { BLIND_BAG_CHANNEL_IDS, buildBlindBagProduct } from '../../blindBag';
import { WebProductForm, type WebProductFormProps } from './WebProductForm';
import { readProductFormRecovery } from './productFormRecovery';

// Reuse the actual Ops category and its saved fields. This adapter only supplies
// blind-bag identity, existing inventory/save behavior and isolated recovery.
export const WebBlindBagProductForm: React.FC<WebProductFormProps> = props => {
  const [newIdentity] = useState(() => ({ id: `blind-bag-${crypto.randomUUID()}`, skuCode: `BB-${crypto.randomUUID()}` }));
  const store = props.formScope === 'store';
  const recoveryKey = props.recoveryKey ? `${props.recoveryKey}:blind_bag` : undefined;
  const [recovery] = useState(() => !store && props.mode !== 'edit' && recoveryKey ? readProductFormRecovery(recoveryKey) : null);
  const sourceProduct: any = recovery?.product || props.initialProduct;
  const category = props.category;
  const initialProduct = useMemo(() => {
    const previous = sourceProduct;
    const source = previous?.formData || {};
    const channels = source.salesScope?.channelIds || source.applicableChannelIds || BLIND_BAG_CHANNEL_IDS;
    const row = source.takeoutFormState?.specConfigRows?.[0] || {};
    const initial = buildBlindBagProduct({
      id: previous?.id || newIdentity.id, skuCode: previous?.skuCode || newIdentity.skuCode,
      createdTime: previous?.createdTime || new Date().toLocaleString('sv-SE', { hour12: false }),
      status: previous?.status || 'draft', channelIds: BLIND_BAG_CHANNEL_IDS.filter(id => channels.includes(id)),
      unlimited: store ? previous?.stockCount === 9999 : row.s_spec_inventory_mode === 'unlimited' || previous?.stock === -1,
      fieldConfigs: category.standardFields,
      formData: { ...source, p_name: previous?.name || '', p_img: source.p_img || previous?.image || '',
        p_front_cat: source.p_front_cat || [], p_back_cat: source.p_back_cat || [],
        p_unit: source.p_unit || '袋', p_cat: category.name, prototypeCategoryId: category.id,
        s_price: row.s_spec_price ?? source.s_price ?? (props.mode === 'edit' ? String(previous?.price ?? '') : ''),
        s_cost: row.s_spec_cost ?? source.s_cost ?? '', s_market_price: row.s_spec_market ?? source.s_market_price ?? '',
        s_stock: store && previous?.stockCount !== undefined ? previous.stockCount === 9999 ? '' : String(previous.stockCount) : row.s_spec_initial_stock ?? source.s_stock ?? '',
      },
    });
    return { ...previous, ...initial, ...(store ? { baseProductId: previous?.baseProductId, channels: previous?.channels, storeId: previous?.storeId, storeName: previous?.storeName, stockCount: previous?.stockCount } : {}) };
  }, [sourceProduct, category, props.mode, store, newIdentity]);
  const key = `standard:${category.id}`;
  return <div className="flex min-h-0 min-w-0 flex-1" data-testid="blind-bag-form"><WebProductForm {...props}
    type="standard" category={category} categories={[category]} initialProduct={initialProduct}
    formScope={store ? 'store' : 'unified'} unifiedManagementView blindBagContext
    previewPreferenceKey="blind-bag-library-form"
    commonFieldConfigs={{ ...props.commonFieldConfigs, [key]: category.standardFields }}
    recoveryKey={recoveryKey} recovered={!!recovery || props.recovered}
    thirdPartyChannelAttributeIds={[]} channelContext={{ ...props.channelContext,
      catalogName: '盲袋商品', channelIds: [...BLIND_BAG_CHANNEL_IDS], channelNames: ['小程序堂食', '小程序外卖'],
      masterName: initialProduct.name, skuId: initialProduct.skuCode,
    }} onOpenCommonFieldSettings={undefined} />
  </div>;
};
