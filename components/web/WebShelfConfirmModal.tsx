import React, { useMemo, useState } from 'react';
import { Bike, ShoppingBag, Smartphone, Store, UtensilsCrossed, X } from 'lucide-react';

export type ShelfChannelId =
  | 'mini_dine'
  | 'mini_take'
  | 'meituan'
  | 'meituan_tuangou'
  | 'taobao'
  | 'eleme'
  | 'pos';

export type ShelfStatus = 'on_shelf' | 'off_shelf';
export type ShelfAction = 'on_shelf' | 'off_shelf';

const CHANNEL_META: Record<ShelfChannelId, {
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}> = {
  mini_dine: {
    label: '小程序-堂食',
    icon: <Store size={16} strokeWidth={2.2} />,
    activeClass: 'bg-[#FDEBD8] text-[#F59E0B]',
  },
  mini_take: {
    label: '小程序-外卖',
    icon: <Bike size={16} strokeWidth={2.2} />,
    activeClass: 'bg-[#DDF5D8] text-[#84CC16]',
  },
  meituan: {
    label: '美团外卖',
    icon: <UtensilsCrossed size={16} strokeWidth={2.2} />,
    activeClass: 'bg-[#FCE9B9] text-[#EAB308]',
  },
  meituan_tuangou: {
    label: '美团团购',
    icon: <UtensilsCrossed size={16} strokeWidth={2.2} />,
    activeClass: 'bg-[#FCE9B9] text-[#EAB308]',
  },
  taobao: {
    label: '淘宝闪购',
    icon: <ShoppingBag size={16} strokeWidth={2.2} />,
    activeClass: 'bg-[#FF7A18] text-white',
  },
  eleme: {
    label: '饿了么',
    icon: <span className="text-[12px] font-black leading-none">e</span>,
    activeClass: 'bg-[#DDEEFF] text-[#3B82F6]',
  },
  pos: {
    label: 'POS',
    icon: <span className="text-[10px] font-black leading-none">POS</span>,
    activeClass: 'bg-[#DDEEFF] text-[#3B82F6]',
  },
};

const ChannelStatusBadge = ({
  channelId,
  status,
}: {
  channelId: ShelfChannelId;
  status: ShelfStatus;
}) => {
  const meta = CHANNEL_META[channelId];
  return (
    <div className="mr-6 mb-3 flex items-center text-[15px] text-[#333]">
      <span className={`mr-3 flex h-8 w-8 items-center justify-center rounded-xl ${meta.activeClass}`}>
        {meta.icon}
      </span>
      <span>{meta.label}({status === 'on_shelf' ? '已上架' : '已下架'})</span>
    </div>
  );
};

const ChannelCheckbox = ({
  channelId,
  checked,
  onToggle,
}: {
  channelId: ShelfChannelId;
  checked: boolean;
  onToggle: () => void;
}) => (
  <label className="mr-10 mb-5 flex cursor-pointer items-center text-[15px] text-[#555]">
    <input
      type="checkbox"
      checked={checked}
      onChange={onToggle}
      className="mr-3 h-5 w-5 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]"
    />
    {CHANNEL_META[channelId].label}
  </label>
);

export const getShelfChannelLabel = (channelId: string) =>
  CHANNEL_META[channelId as ShelfChannelId]?.label || channelId;

export const WebShelfConfirmModal: React.FC<{
  entityLabel: '商品' | '加料';
  itemName: string;
  availableChannels: ShelfChannelId[];
  channelStatuses: Partial<Record<ShelfChannelId, ShelfStatus>>;
  activeTabId: string;
  isShelvesUnited: boolean;
  onClose: () => void;
  onConfirm: (payload: { action: ShelfAction; channels: ShelfChannelId[] }) => void;
}> = ({
  entityLabel,
  itemName,
  availableChannels,
  channelStatuses,
  activeTabId,
  isShelvesUnited,
  onClose,
  onConfirm,
}) => {
  const [selectedChannels, setSelectedChannels] = useState<ShelfChannelId[]>(availableChannels);

  const isAllMode = activeTabId === 'all';
  const currentChannel = (!isAllMode ? activeTabId : null) as ShelfChannelId | null;
  const singleAction = currentChannel && channelStatuses[currentChannel] === 'on_shelf' ? 'off_shelf' : 'on_shelf';
  const allChecked = selectedChannels.length > 0 && selectedChannels.length === availableChannels.length;

  const selectedStatusMap = useMemo(() => {
    const result: Partial<Record<ShelfChannelId, ShelfStatus>> = {};
    availableChannels.forEach(channelId => {
      result[channelId] = channelStatuses[channelId] || 'off_shelf';
    });
    return result;
  }, [availableChannels, channelStatuses]);

  const toggleChannel = (channelId: ShelfChannelId) => {
    setSelectedChannels(prev =>
      prev.includes(channelId) ? prev.filter(item => item !== channelId) : [...prev, channelId]
    );
  };

  const toggleAll = () => {
    setSelectedChannels(allChecked ? [] : availableChannels);
  };

  const modalTitle = isAllMode
    ? `确认上下架${entityLabel}吗?`
    : `确认${singleAction === 'on_shelf' ? '上架' : '下架'}${entityLabel}吗?`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-[1020px] max-w-[calc(100vw-48px)] rounded-[18px] bg-white shadow-2xl">
        <div className="flex items-center justify-between px-8 pt-8">
          <h3 className="text-[18px] font-semibold text-[#333]">{modalTitle}</h3>
          <button onClick={onClose} className="text-[#999] transition-colors hover:text-[#333]">
            <X size={22} />
          </button>
        </div>

        <div className="px-8 pb-8 pt-6">
          <div className="text-[18px] text-[#333]">
            {isAllMode ? '上下架' : singleAction === 'on_shelf' ? '上架' : '下架'}
            {entityLabel}: <span className="font-bold">{itemName}</span>
            {!isAllMode && !isShelvesUnited && currentChannel ? (
              <span className="ml-4">
                {isAllMode ? '' : `${entityLabel === '商品' ? '上下架渠道' : '上下架渠道'}：${getShelfChannelLabel(currentChannel)}`}
              </span>
            ) : null}
          </div>

          {isAllMode && (
            <div className="mt-5 flex flex-wrap">
              {availableChannels.map(channelId => (
                <ChannelStatusBadge
                  key={channelId}
                  channelId={channelId}
                  status={selectedStatusMap[channelId] || 'off_shelf'}
                />
              ))}
            </div>
          )}

          {isAllMode && !isShelvesUnited && (
            <div className="mt-8 rounded-xl bg-[#F7F8FA] px-8 py-6">
              <div className="mb-6 text-[18px] font-bold text-[#333]">选择渠道</div>
              <label className="mb-8 flex cursor-pointer items-center text-[15px] text-[#555]">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="mr-3 h-5 w-5 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]"
                />
                全选
              </label>
              <div className="flex flex-wrap">
                {availableChannels.map(channelId => (
                  <ChannelCheckbox
                    key={channelId}
                    channelId={channelId}
                    checked={selectedChannels.includes(channelId)}
                    onToggle={() => toggleChannel(channelId)}
                  />
                ))}
              </div>
            </div>
          )}

          {((isAllMode && isShelvesUnited) || (!isAllMode && currentChannel)) && (
            <div className="mt-8 rounded bg-[#F7F8FA] px-6 py-4 text-[18px] leading-[30px] text-[#333]">
              <span className="mr-3 text-[22px] leading-none text-[#FF2D20]">•</span>
              {isAllMode && isShelvesUnited ? (
                <>
                  上下架状态为全渠道统一，上下架时会将所有渠道{entityLabel}
                  上下架 <span className="text-[#FF2D20]">状态会同步到美饿平台</span>
                </>
              ) : isShelvesUnited ? (
                <>
                  {singleAction === 'on_shelf' ? '上架' : '下架'}状态为全渠道统一，
                  {singleAction === 'on_shelf' ? '上架' : '下架'}时会将所有渠道{entityLabel}
                  {singleAction === 'on_shelf' ? '上架' : '下架'} <span className="text-[#FF2D20]">状态会同步到美饿平台</span>
                </>
              ) : (
                <>
                  {getShelfChannelLabel(currentChannel || '')}渠道{entityLabel}将{singleAction === 'on_shelf' ? '上架' : '下架'}，
                  {singleAction === 'on_shelf' ? '上架' : '下架'}操作不影响其他渠道上下架状态
                </>
              )}
            </div>
          )}

          <div className="mt-11 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="h-[50px] rounded-md border border-[#D9D9D9] px-10 text-[18px] text-[#666] transition-colors hover:bg-[#FAFAFA]"
            >
              取消
            </button>

            {isAllMode ? (
              <>
                <button
                  onClick={() => onConfirm({ action: 'on_shelf', channels: isShelvesUnited ? availableChannels : selectedChannels })}
                  disabled={!isShelvesUnited && selectedChannels.length === 0}
                  className="h-[50px] rounded-md bg-[#11B45C] px-10 text-[18px] font-medium text-white transition-colors hover:bg-[#0D9D50] disabled:cursor-not-allowed disabled:bg-[#A7DDBE]"
                >
                  上架
                </button>
                <button
                  onClick={() => onConfirm({ action: 'off_shelf', channels: isShelvesUnited ? availableChannels : selectedChannels })}
                  disabled={!isShelvesUnited && selectedChannels.length === 0}
                  className="h-[50px] rounded-md bg-[#F46A6A] px-10 text-[18px] font-medium text-white transition-colors hover:bg-[#E55454] disabled:cursor-not-allowed disabled:bg-[#F5B3B3]"
                >
                  下架
                </button>
              </>
            ) : (
              <button
                onClick={() => onConfirm({ action: singleAction, channels: isShelvesUnited ? availableChannels : currentChannel ? [currentChannel] : [] })}
                className="h-[50px] rounded-md bg-[#11B45C] px-10 text-[18px] font-medium text-white transition-colors hover:bg-[#0D9D50]"
              >
                确定
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
