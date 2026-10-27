import React, { useState } from 'react';
import { Category, Product } from '../../types';
import { useProducts } from '../../context';
import { MobileStandardProductCreator } from './MobileStandardProductCreator';
import { MobileBadgeItem, MobileLabelGroup } from './productMeta';
import { ChevronLeft, Printer, ShoppingBag, Smartphone, Store, X } from 'lucide-react';
import { LocalSpec } from './types';
import type { LocalMethod } from './types';
import type { ProductMethodConfig } from './productMethodState';

interface SpecItemDraft {
  name: string;
  price: string;
  stock: string;
  unlimited: boolean;
  storePackFee?: string;
  takePackFee?: string;
  storePackMark?: string;
  takePackMark?: string;
}

const DEFAULT_SPEC_LIBRARY: LocalSpec[] = [
  { id: 'spec_capacity', name: '杯型', source: 'brand', values: ['小杯', '中杯', '大杯'] },
  { id: 'spec_volume', name: '规格值', source: 'brand', values: ['200ml', '300ml', '500ml'] },
  { id: 'spec_temp', name: '温度', source: 'brand', values: ['热', '常温', '少冰'] },
  { id: 'spec_empty', name: '规格组', source: 'store', values: [] },
];

interface Props {
  product: Product;
  onBack: () => void;
  categories: Category[];
  activeChannel?: 'all' | 'mini' | 'meituan' | 'taobao' | 'pos';
  labelGroups: MobileLabelGroup[];
  badges: MobileBadgeItem[];
  onLabelGroupsChange: (groups: MobileLabelGroup[]) => void;
  onBadgesChange: (badges: MobileBadgeItem[]) => void;
  onSave?: (updates: Partial<Product>, options?: { mode: 'all' | 'partial'; channels: string[] }) => void;
  draftBasePrice?: string;
  draftSpecItems?: SpecItemDraft[];
  packageFeeLevel?: 'product' | 'spec';
  methodConfiguration?: ProductMethodConfig[];
  methodLibrary?: LocalMethod[];
  storeName?: string;
  onSaveMethods?: (config: ProductMethodConfig[]) => void;
  onSaveMethodLibrary?: (library: LocalMethod[]) => void;
}

export const MobileProductEditor: React.FC<Props> = ({
  product,
  onBack,
  categories,
  activeChannel = 'all',
  labelGroups,
  badges,
  onLabelGroupsChange,
  onBadgesChange,
  onSave,
  draftBasePrice,
  draftSpecItems,
  packageFeeLevel = 'product',
  methodConfiguration = [],
  methodLibrary = [],
  storeName,
  onSaveMethods,
  onSaveMethodLibrary,
}: Props) => {
  const { products } = useProducts();
  const initialChannels = getInitialChannels(activeChannel);
  const [pendingPayload, setPendingPayload] = useState<null | {
    name: string;
    category: string;
    basePrice: string;
    specItems: SpecItemDraft[];
    linkedStallIds: string[];
    storePackFee: string;
    takePackFee: string;
    storePackMark: string;
    takePackMark: string;
    methodConfiguration?: ProductMethodConfig[];
    methodDefinitions?: LocalMethod[];
  }>(null);
  const [effectiveChannels, setEffectiveChannels] = useState<string[]>(['mini', 'meituan', 'taobao', 'pos']);

  const getRelatedComboNames = (currentProduct: Product) => (
    products
      .filter(item => item.type === 'combo' && item.comboItemIds?.includes(currentProduct.id))
      .map(item => item.name)
  );

  const guardChannelClose = (_channelId: string, nextEnabled: boolean, _nextChannels: string[], _prevChannels: string[]) => {
    if (nextEnabled) return [];
    return getRelatedComboNames(product);
  };

  const submitEdit = (
    payload: { name: string; category: string; basePrice: string; specItems: SpecItemDraft[]; linkedStallIds: string[]; storePackFee: string; takePackFee: string; storePackMark: string; takePackMark: string; methodConfiguration?: ProductMethodConfig[]; methodDefinitions?: LocalMethod[] },
    options?: { mode: 'all' | 'partial'; channels: string[] },
    methodsOnly = false,
  ) => {
    if (payload.methodDefinitions && JSON.stringify(payload.methodDefinitions) !== JSON.stringify(methodLibrary)) onSaveMethodLibrary?.(payload.methodDefinitions);
    if (payload.methodConfiguration && JSON.stringify(payload.methodConfiguration) !== JSON.stringify(methodConfiguration)) onSaveMethods?.(payload.methodConfiguration);
    if (methodsOnly) { onBack(); return; }
    const nextPrice = payload.basePrice.trim() ? Number(payload.basePrice) : product.price;
    const nextSpecs = product.isMultiSpec && payload.specItems.length
      ? payload.specItems.map((item, index) => ({
          ...product.specs?.[index],
          name: item.name,
          price: item.price.trim() ? Number(item.price) : (product.specs?.[index]?.price ?? nextPrice),
          stock: item.unlimited ? -1 : (item.stock.trim() ? Number(item.stock) : (product.specs?.[index]?.stock ?? 0)),
          unlimited: item.unlimited,
          ...(packageFeeLevel === 'spec' ? {
            storePackFee: parseOptionalMoney(item.storePackFee),
            takePackFee: parseOptionalMoney(item.takePackFee),
            storePackMark: item.storePackMark || undefined,
            takePackMark: item.takePackMark || undefined,
          } : {}),
        }))
      : packageFeeLevel === 'spec' ? [{
          ...product.specs?.[0],
          name: product.specs?.[0]?.name || '统一规格',
          price: nextPrice, stock: product.stock ?? -1,
          storePackFee: parseOptionalMoney(payload.storePackFee),
          takePackFee: parseOptionalMoney(payload.takePackFee),
          storePackMark: payload.storePackMark || undefined,
          takePackMark: payload.takePackMark || undefined,
        }] : product.specs;

    onSave?.({
      name: payload.name,
      category: payload.category,
      price: nextPrice,
      specs: nextSpecs,
      ...(packageFeeLevel === 'product' ? {
        storePackFee: parseOptionalMoney(payload.storePackFee),
        takePackFee: parseOptionalMoney(payload.takePackFee),
        storePackMark: payload.storePackMark || undefined,
        takePackMark: payload.takePackMark || undefined,
      } : {}),
      linkedStallIds: payload.linkedStallIds,
    }, options);
    onBack();
  };

  const initialSpecItems = draftSpecItems ?? (product.specs || []).map(spec => ({
    name: spec.name,
    price: String(spec.price ?? product.price),
    stock: spec.unlimited || spec.stock === -1 ? '' : String(spec.stock ?? ''),
    unlimited: !!spec.unlimited || spec.stock === -1,
    storePackFee: spec.storePackFee === undefined ? '' : String(spec.storePackFee),
    takePackFee: spec.takePackFee === undefined ? '' : String(spec.takePackFee),
    storePackMark: spec.storePackMark || '',
    takePackMark: spec.takePackMark || '',
  }));
  const initialPackaging = {
    storePackFee: String((packageFeeLevel === 'spec' && !product.isMultiSpec ? product.specs?.[0]?.storePackFee : product.storePackFee) ?? ''),
    takePackFee: String((packageFeeLevel === 'spec' && !product.isMultiSpec ? product.specs?.[0]?.takePackFee : product.takePackFee) ?? ''),
    storePackMark: (packageFeeLevel === 'spec' && !product.isMultiSpec ? product.specs?.[0]?.storePackMark : product.storePackMark) || '',
    takePackMark: (packageFeeLevel === 'spec' && !product.isMultiSpec ? product.specs?.[0]?.takePackMark : product.takePackMark) || '',
  };

  return (
    <>
      <MobileStandardProductCreator
        onBack={onBack}
        categories={categories}
        productType={product.type || 'standard'}
        mode="edit"
        title="编辑商品"
        hideSecondaryAction
        primaryActionText="保存修改"
        lockSpecEdit
        lockStockEdit
        packageFeeLevel={packageFeeLevel}
        methodLibrary={methodLibrary}
        storeName={storeName}
        channelSelectorHelperText="渠道开启后商品将在门店上架售卖，关闭后商品将从渠道移除。"
        onBeforeChannelToggle={guardChannelClose}
        labelGroups={labelGroups}
        badges={badges}
        onLabelGroupsChange={onLabelGroupsChange}
        onBadgesChange={onBadgesChange}
        initialData={{
          methodConfiguration,
          name: product.name,
          category: product.category,
          basePrice: draftBasePrice ?? String(product.price),
          stock: product.stock === -1 ? '' : String(product.stock ?? ''),
          specType: product.isMultiSpec ? 'multi' : 'single',
          channels: initialChannels,
          detailContent: '',
          listDesc: '',
          selectedLabelIds: [],
          selectedBadgeId: '',
          badgeStartDate: '',
          badgeEndDate: '',
          specItems: initialSpecItems,
          ...initialPackaging,
          specSelection: inferSpecSelection((product.specs || []).map(spec => spec.name), DEFAULT_SPEC_LIBRARY),
          specLibrary: DEFAULT_SPEC_LIBRARY,
          linkedStallIds: product.linkedStallIds || [],
        }}
        onPrimaryAction={data => {
          const payload = {
            name: data.name,
            category: data.category,
            basePrice: data.basePrice,
            specItems: data.specItems,
            linkedStallIds: data.linkedStallIds,
            storePackFee: data.storePackFee,
            takePackFee: data.takePackFee,
            storePackMark: data.storePackMark,
            takePackMark: data.takePackMark,
            methodConfiguration: data.methodConfiguration,
            methodDefinitions: data.methodDefinitions,
          };
          const methodsChanged = JSON.stringify(data.methodConfiguration) !== JSON.stringify(methodConfiguration) || JSON.stringify(data.methodDefinitions) !== JSON.stringify(methodLibrary);
          const otherFieldsUnchanged = data.name === product.name && data.category === product.category
            && data.basePrice === (draftBasePrice ?? String(product.price))
            && JSON.stringify(data.channels) === JSON.stringify(initialChannels)
            && JSON.stringify(data.specItems) === JSON.stringify(initialSpecItems)
            && JSON.stringify(data.linkedStallIds) === JSON.stringify(product.linkedStallIds || [])
            && Object.entries(initialPackaging).every(([key, value]) => data[key] === value);
          if (methodsChanged && otherFieldsUnchanged) {
            submitEdit(payload, undefined, true);
            return;
          }
          if (activeChannel === 'all') {
            setPendingPayload(payload);
            setEffectiveChannels(['mini', 'meituan', 'taobao', 'pos']);
            return;
          }
          submitEdit(payload, { mode: 'partial', channels: initialChannels });
        }}
      />

      {pendingPayload ? (
        <ApplyChannelModal
          methodsChanged={JSON.stringify(pendingPayload.methodConfiguration) !== JSON.stringify(methodConfiguration)}
          selectedChannels={effectiveChannels}
          onClose={() => setPendingPayload(null)}
          onToggleChannel={channel =>
            setEffectiveChannels(prev => prev.includes(channel) ? prev.filter(item => item !== channel) : [...prev, channel])
          }
          onConfirm={() => submitEdit(pendingPayload, {
            mode: 'partial',
            channels: effectiveChannels,
          })}
        />
      ) : null}
    </>
  );
};

const getInitialChannels = (activeChannel: Props['activeChannel']) => {
  if (activeChannel === 'all') return ['mini', 'mini_dine', 'mini_take', 'meituan', 'taobao', 'pos'];
  if (activeChannel === 'mini') return ['mini', 'mini_dine', 'mini_take'];
  return activeChannel ? [activeChannel] : ['mini', 'mini_dine', 'mini_take', 'meituan', 'taobao', 'pos'];
};

const APPLY_CHANNEL_OPTIONS = [
  { id: 'mini', label: '小程序', icon: <Smartphone size={16} />, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'meituan', label: '美团外卖', icon: <Store size={16} />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={16} />, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'pos', label: 'POS收银', icon: <Printer size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
];

const inferSpecSelection = (specNames: string[], library: LocalSpec[]) => {
  const valueMap: Record<string, string[]> = {};
  library.forEach(group => {
    const matchedValues = group.values.filter(value =>
      specNames.some(name => name.includes(value))
    );
    if (matchedValues.length > 0) {
      valueMap[group.id] = matchedValues;
    }
  });
  return {
    groupIds: library.filter(group => (valueMap[group.id] || []).length > 0).map(group => group.id),
    valueMap,
  };
};

const parseOptionalMoney = (value?: string) => {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const ApplyChannelModal = ({
  selectedChannels,
  onClose,
  onToggleChannel,
  onConfirm,
  methodsChanged,
}: {
  selectedChannels: string[];
  onClose: () => void;
  onToggleChannel: (channel: string) => void;
  onConfirm: () => void;
  methodsChanged?: boolean;
}) => (
  <div className="absolute inset-0 z-[120] flex flex-col justify-end bg-black/50 animate-in fade-in">
    <div className="flex-1" onClick={onClose}></div>
    <div className="rounded-t-[24px] bg-white p-4 pb-8 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between px-1">
        <div className="text-lg font-black text-[#1F2129]">选择生效渠道</div>
        <button onClick={onClose} className="rounded-full bg-[#F5F5F5] p-1.5 text-[#98A0B3]"><X size={16} /></button>
      </div>
      <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
        <div className="text-[12px] leading-5 font-medium text-orange-700">
          本次保存会用当前整条商品信息覆盖所选渠道中的商品内容，不仅同步本次修改的字段，请谨慎选择生效渠道。
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-[#F7F9FC] p-3">
        {methodsChanged && <p className="mb-3 text-xs leading-5 text-gray-600">做法启停对当前门店的此商品生效，不受下方渠道选择限制。</p>}
        <div className="mb-3 text-[12px] font-bold text-[#667085]">选择渠道</div>
        <div className="grid grid-cols-2 gap-2">
          {APPLY_CHANNEL_OPTIONS.map(option => {
            const active = selectedChannels.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => onToggleChannel(option.id)}
                className={`flex items-center rounded-2xl border px-3 py-3 ${active ? 'border-[#00C06B] bg-white' : 'border-[#E5E7EB] bg-white'}`}
              >
                <div className={`mr-3 rounded-xl p-2 ${active ? `${option.bg} ${option.color}` : 'bg-[#F3F4F6] text-[#98A1B3]'}`}>{option.icon}</div>
                <span className={`text-sm font-bold ${active ? 'text-[#1F2129]' : 'text-[#98A1B3]'}`}>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#667085]">取消</button>
        <button
          onClick={onConfirm}
          disabled={selectedChannels.length === 0}
          className="flex-1 h-11 rounded-xl bg-[#00C06B] text-sm font-bold text-white disabled:opacity-40"
        >
          确认保存
        </button>
      </div>
    </div>
  </div>
);
