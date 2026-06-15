import React, { useState } from 'react';
import { Category, Product } from '../../types';
import { useProducts } from '../../context';
import { MobileStandardProductCreator } from './MobileStandardProductCreator';
import { MobileBadgeItem, MobileLabelGroup } from './productMeta';
import { ChevronLeft, Printer, ShoppingBag, Smartphone, Store, X } from 'lucide-react';
import { LocalSpec } from './types';

interface SpecItemDraft {
  name: string;
  price: string;
  stock: string;
  unlimited: boolean;
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
}) => {
  const { products } = useProducts();
  const initialChannels = getInitialChannels(activeChannel);
  const [pendingPayload, setPendingPayload] = useState<null | {
    name: string;
    category: string;
    basePrice: string;
    specItems: SpecItemDraft[];
    linkedStallIds: string[];
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
    payload: { name: string; category: string; basePrice: string; specItems: SpecItemDraft[]; linkedStallIds: string[] },
    options?: { mode: 'all' | 'partial'; channels: string[] }
  ) => {
    const nextPrice = Number(payload.basePrice) || product.price;
    const nextSpecs = product.isMultiSpec && payload.specItems.length
      ? payload.specItems.map((item, index) => ({
          ...product.specs?.[index],
          name: item.name,
          price: Number(item.price) || product.specs?.[index]?.price || nextPrice,
          stock: item.unlimited ? -1 : (Number(item.stock) || product.specs?.[index]?.stock || 0),
          unlimited: item.unlimited,
        }))
      : product.specs;

    onSave?.({
      name: payload.name,
      category: payload.category,
      price: nextPrice,
      specs: nextSpecs,
      linkedStallIds: payload.linkedStallIds,
    }, options);
    onBack();
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
        channelSelectorHelperText="渠道开启后商品将在门店上架售卖，关闭后商品将从渠道移除。"
        onBeforeChannelToggle={guardChannelClose}
        labelGroups={labelGroups}
        badges={badges}
        onLabelGroupsChange={onLabelGroupsChange}
        onBadgesChange={onBadgesChange}
        initialData={{
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
          specItems: draftSpecItems ?? (product.specs || []).map(spec => ({
            name: spec.name,
            price: String(spec.price ?? product.price),
            stock: spec.unlimited || spec.stock === -1 ? '' : String(spec.stock ?? ''),
            unlimited: !!spec.unlimited || spec.stock === -1,
          })),
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
          };
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

const ApplyChannelModal = ({
  selectedChannels,
  onClose,
  onToggleChannel,
  onConfirm,
}: {
  selectedChannels: string[];
  onClose: () => void;
  onToggleChannel: (channel: string) => void;
  onConfirm: () => void;
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
