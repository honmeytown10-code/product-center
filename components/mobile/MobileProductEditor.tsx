import React, { useState } from 'react';
import { Category, Product } from '../../types';
import { MobileStandardProductCreator } from './MobileStandardProductCreator';
import { MobileBadgeItem, MobileLabelGroup } from './productMeta';
import { Check, ChevronLeft, Printer, ShoppingBag, Smartphone, Store, X } from 'lucide-react';

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
}) => {
  const initialChannels = getInitialChannels(activeChannel);
  const [pendingPayload, setPendingPayload] = useState<null | {
    name: string;
    category: string;
    basePrice: string;
    specItems: { name: string; price: string }[];
  }>(null);
  const [applyMode, setApplyMode] = useState<'all' | 'partial'>('all');
  const [effectiveChannels, setEffectiveChannels] = useState<string[]>(['mini', 'meituan', 'taobao', 'pos']);

  const submitEdit = (
    payload: { name: string; category: string; basePrice: string; specItems: { name: string; price: string }[] },
    options?: { mode: 'all' | 'partial'; channels: string[] }
  ) => {
    const nextPrice = Number(payload.basePrice) || product.price;
    const nextSpecs = product.isMultiSpec && payload.specItems.length
      ? payload.specItems.map((item, index) => ({
          ...product.specs?.[index],
          name: item.name,
          price: Number(item.price) || product.specs?.[index]?.price || nextPrice,
          stock: product.specs?.[index]?.stock ?? 0,
        }))
      : product.specs;

    onSave?.({
      name: payload.name,
      category: payload.category,
      price: nextPrice,
      specs: nextSpecs,
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
        labelGroups={labelGroups}
        badges={badges}
        onLabelGroupsChange={onLabelGroupsChange}
        onBadgesChange={onBadgesChange}
        initialData={{
          name: product.name,
          category: product.category,
          basePrice: String(product.price),
          stock: product.stock === -1 ? '' : String(product.stock ?? ''),
          specType: product.isMultiSpec ? 'multi' : 'single',
          channels: initialChannels,
          detailContent: '',
          listDesc: '',
          selectedLabelIds: [],
          selectedBadgeId: '',
          badgeStartDate: '',
          badgeEndDate: '',
          specItems: (product.specs || []).map(spec => ({
            name: spec.name,
            price: String(spec.price ?? product.price),
          })),
        }}
        onPrimaryAction={data => {
          const payload = {
            name: data.name,
            category: data.category,
            basePrice: data.basePrice,
            specItems: data.specItems,
          };
          if (activeChannel === 'all') {
            setPendingPayload(payload);
            setApplyMode('all');
            return;
          }
          submitEdit(payload, { mode: 'partial', channels: initialChannels });
        }}
      />

      {pendingPayload ? (
        <ApplyChannelModal
          mode={applyMode}
          selectedChannels={effectiveChannels}
          onClose={() => setPendingPayload(null)}
          onModeChange={setApplyMode}
          onToggleChannel={channel =>
            setEffectiveChannels(prev => prev.includes(channel) ? prev.filter(item => item !== channel) : [...prev, channel])
          }
          onConfirm={() => submitEdit(pendingPayload, {
            mode: applyMode,
            channels: applyMode === 'all' ? ['mini', 'meituan', 'taobao', 'pos'] : effectiveChannels,
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

const ApplyChannelModal = ({
  mode,
  selectedChannels,
  onClose,
  onModeChange,
  onToggleChannel,
  onConfirm,
}: {
  mode: 'all' | 'partial';
  selectedChannels: string[];
  onClose: () => void;
  onModeChange: (mode: 'all' | 'partial') => void;
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
      <div className="mt-4 space-y-3">
        <button
          onClick={() => onModeChange('all')}
          className={`flex w-full items-start rounded-2xl border px-4 py-4 text-left ${mode === 'all' ? 'border-[#00C06B] bg-[#F3FCF7]' : 'border-[#EEF1F5] bg-white'}`}
        >
          <div className="flex-1">
            <div className="text-sm font-black text-[#1F2129]">同步到所有渠道</div>
            <div className="mt-1 text-[11px] text-[#98A1B3]">本次修改会同步到小程序、美团外卖、淘宝闪购、POS 收银</div>
          </div>
          {mode === 'all' ? <Check size={18} className="text-[#00C06B]" /> : null}
        </button>
        <button
          onClick={() => onModeChange('partial')}
          className={`flex w-full items-start rounded-2xl border px-4 py-4 text-left ${mode === 'partial' ? 'border-[#00C06B] bg-[#F3FCF7]' : 'border-[#EEF1F5] bg-white'}`}
        >
          <div className="flex-1">
            <div className="text-sm font-black text-[#1F2129]">指定渠道修改</div>
            <div className="mt-1 text-[11px] text-[#98A1B3]">仅对本次勾选的渠道生效</div>
          </div>
          {mode === 'partial' ? <Check size={18} className="text-[#00C06B]" /> : null}
        </button>
      </div>
      {mode === 'partial' ? (
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
      ) : null}
      <div className="mt-5 flex gap-3">
        <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#667085]">取消</button>
        <button
          onClick={onConfirm}
          disabled={mode === 'partial' && selectedChannels.length === 0}
          className="flex-1 h-11 rounded-xl bg-[#00C06B] text-sm font-bold text-white disabled:opacity-40"
        >
          确认保存
        </button>
      </div>
    </div>
  </div>
);
