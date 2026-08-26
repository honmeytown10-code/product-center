import React, { useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, X } from 'lucide-react';
import { ShelfChannelId, getShelfChannelLabel } from './WebShelfConfirmModal';

export type StockoutSpec = {
  id: string;
  name: string;
  currentStock?: number;
  remainStock: string;
  nextDayStock: string;
  nextDayUnlimited?: boolean;
};

const checkboxClass = 'h-5 w-5 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]';

export const WebStockoutModal: React.FC<{
  itemName: string;
  entityLabel?: '商品' | '加料';
  channels: ShelfChannelId[];
  isStockShared: boolean;
  isMultiSpec: boolean;
  specs?: StockoutSpec[];
  defaultRemainStock?: string;
  defaultNextDayUnlimited?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    type: 'day' | 'long';
    channels: ShelfChannelId[];
    remainStock: string;
    nextDayUnlimited: boolean;
    nextDayStock: string;
    specs: StockoutSpec[];
  }) => void;
}> = ({
  itemName,
  entityLabel = '商品',
  channels,
  isStockShared,
  isMultiSpec,
  specs = [],
  defaultRemainStock = '0',
  defaultNextDayUnlimited = true,
  onClose,
  onConfirm,
}) => {
  const [stockoutType, setStockoutType] = useState<'day' | 'long'>('day');
  const [selectedChannels, setSelectedChannels] = useState<ShelfChannelId[]>(channels);
  const [remainStock, setRemainStock] = useState(defaultRemainStock);
  const [nextDayUnlimited, setNextDayUnlimited] = useState(defaultNextDayUnlimited);
  const [nextDayStock, setNextDayStock] = useState('9999');
  const [selectedSpecIds, setSelectedSpecIds] = useState<string[]>(specs.map(spec => spec.id));
  const [specRows, setSpecRows] = useState<StockoutSpec[]>(
    specs.length
      ? specs
      : []
  );

  const allChannelsChecked = selectedChannels.length === channels.length;
  const allSpecsChecked = selectedSpecIds.length === specRows.length;

  const summaryLabel = useMemo(() => {
    return `沽清${entityLabel}`;
  }, [entityLabel]);

  const toggleChannel = (channelId: ShelfChannelId) => {
    if (isStockShared) return;
    setSelectedChannels(prev => (
      prev.includes(channelId) ? prev.filter(item => item !== channelId) : [...prev, channelId]
    ));
  };

  const toggleAllChannels = () => {
    if (isStockShared) return;
    setSelectedChannels(allChannelsChecked ? [] : channels);
  };

  const toggleSpec = (specId: string) => {
    setSelectedSpecIds(prev => (
      prev.includes(specId) ? prev.filter(item => item !== specId) : [...prev, specId]
    ));
  };

  const toggleAllSpecs = () => {
    setSelectedSpecIds(allSpecsChecked ? [] : specRows.map(spec => spec.id));
  };

  const updateSpecRow = (specId: string, updates: Partial<StockoutSpec>) => {
    setSpecRows(prev => prev.map(spec => (spec.id === specId ? { ...spec, ...updates } : spec)));
  };

  const adjustNumber = (value: string, delta: number, onChange: (next: string) => void) => {
    const current = Number(value);
    onChange(String(Math.max(0, (Number.isFinite(current) ? current : 0) + delta)));
  };

  const handleConfirm = () => {
    onConfirm({
      type: stockoutType,
      channels: isStockShared ? channels : selectedChannels,
      remainStock,
      nextDayUnlimited,
      nextDayStock,
      specs: specRows.filter(spec => selectedSpecIds.includes(spec.id)),
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40">
      <div className={`max-h-[90vh] w-[980px] max-w-[calc(100vw-48px)] overflow-hidden rounded-[18px] bg-white shadow-2xl ${isMultiSpec ? 'w-[1260px]' : ''}`}>
        <div className="flex items-center justify-between px-8 pt-8">
          <div className="flex items-center gap-2">
        <h3 className="text-[18px] font-semibold text-[#333]">沽清设置</h3>
            <AlertCircle size={18} className="text-[#999]" />
          </div>
          <button onClick={onClose} className="text-[#999] transition-colors hover:text-[#333]">
            <X size={22} />
          </button>
        </div>

        <div className="overflow-auto px-8 pb-8 pt-6">
          {isStockShared && (
            <div className="mb-8 flex items-center rounded-md bg-[#FFF7EB] px-5 py-4 text-[16px] text-[#D97706]">
              <AlertCircle size={18} className="mr-3 shrink-0" />
              已开启全渠道库存管理，沽清后会同步修改所有渠道中该{entityLabel}库存
            </div>
          )}

          <div className="mb-8 grid grid-cols-[140px_1fr] items-start gap-y-6 text-[18px] text-[#666]">
            <div>沽清{entityLabel}</div>
            <div className="font-medium text-[#333]">{itemName}</div>

            <div>
              <span className="mr-1 text-[#FF4D4F]">*</span>沽清类型
            </div>
            <div className="flex items-center gap-10">
              <label className="flex cursor-pointer items-center text-[#00B75A]">
                <input
                  type="radio"
                  checked={stockoutType === 'day'}
                  onChange={() => setStockoutType('day')}
                  className="mr-3 h-5 w-5 accent-[#00B75A]"
                />
                当日沽清
              </label>
              <label className="flex cursor-pointer items-center text-[#666]">
                <input
                  type="radio"
                  checked={stockoutType === 'long'}
                  onChange={() => setStockoutType('long')}
                  className="mr-3 h-5 w-5 accent-[#00B75A]"
                />
                长期沽清
              </label>
            </div>
          </div>

          {!isMultiSpec ? (
            <div className="mb-8 grid grid-cols-[140px_1fr] items-start gap-y-6 text-[18px] text-[#666]">
              <div>
                <span className="mr-1 text-[#FF4D4F]">*</span>沽清后剩余库存
              </div>
              <div>
                <div className="relative inline-flex">
                  <input
                    value={remainStock}
                    onChange={e => setRemainStock(e.target.value)}
                    className="h-[48px] w-[140px] rounded-l-md border border-[#D9D9D9] px-4 text-center text-[18px] text-[#666] outline-none focus:border-[#00C06B]"
                  />
                  <div className="flex w-[50px] flex-col rounded-r-md border border-l-0 border-[#D9D9D9]">
                    <button type="button" onClick={() => adjustNumber(remainStock, 1, setRemainStock)} aria-label="剩余库存加一" className="flex flex-1 items-center justify-center border-b border-[#E8E8E8] text-[#999]">
                      <ChevronDown size={16} className="rotate-180" />
                    </button>
                    <button type="button" onClick={() => adjustNumber(remainStock, -1, setRemainStock)} aria-label="剩余库存减一" className="flex flex-1 items-center justify-center text-[#999]">
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <span className="mr-1 text-[#FF4D4F]">*</span>次日补足库存
              </div>
              <div className="flex items-center gap-5">
                {nextDayUnlimited ? (
                  <span className="text-[#666]">无限库存</span>
                ) : (
                  <div className="relative inline-flex">
                    <input
                      value={nextDayStock}
                      onChange={e => setNextDayStock(e.target.value)}
                      className="h-[48px] w-[140px] rounded-l-md border border-[#D9D9D9] px-4 text-center text-[18px] text-[#666] outline-none focus:border-[#00C06B]"
                    />
                    <div className="flex w-[50px] flex-col rounded-r-md border border-l-0 border-[#D9D9D9]">
                      <button type="button" onClick={() => adjustNumber(nextDayStock, 1, setNextDayStock)} aria-label="次日库存加一" className="flex flex-1 items-center justify-center border-b border-[#E8E8E8] text-[#999]">
                        <ChevronDown size={16} className="rotate-180" />
                      </button>
                      <button type="button" onClick={() => adjustNumber(nextDayStock, -1, setNextDayStock)} aria-label="次日库存减一" className="flex flex-1 items-center justify-center text-[#999]">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setNextDayUnlimited(prev => !prev)}
                  className="text-[18px] text-[#00C06B] hover:text-[#00A35B]"
                >
                  {nextDayUnlimited ? '改为自定义库存' : '改为无限库存'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8 grid grid-cols-[140px_1fr] items-start gap-y-6 text-[18px] text-[#666]">
              <div>
                <span className="mr-1 text-[#FF4D4F]">*</span>沽清设置
              </div>
              <div className="overflow-hidden rounded-md border border-[#E8E8E8]">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#F7F8FA] text-[16px] text-[#666]">
                    <tr>
                      <th className="w-[110px] px-4 py-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={allSpecsChecked}
                            onChange={toggleAllSpecs}
                            className={checkboxClass}
                          />
                          <span className="ml-3">是否沽清</span>
                        </label>
                      </th>
                      <th className="px-4 py-4">规格</th>
                      {isStockShared && <th className="px-4 py-4">当前剩余库存</th>}
                      <th className="px-4 py-4">沽清后剩余库存</th>
                      <th className="px-4 py-4">次日补足库存</th>
                    </tr>
                  </thead>
                  <tbody className="text-[16px] text-[#666]">
                    {specRows.map(spec => {
                      const selected = selectedSpecIds.includes(spec.id);
                      return (
                        <tr key={spec.id} className="border-t border-[#EDEDED]">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSpec(spec.id)}
                              className={checkboxClass}
                            />
                          </td>
                          <td className="px-4 py-3">{spec.name}</td>
                          {isStockShared && <td className="px-4 py-3">{spec.currentStock ?? 9999}</td>}
                          <td className="px-4 py-3">
                            <input
                              value={spec.remainStock}
                              onChange={e => updateSpecRow(spec.id, { remainStock: e.target.value })}
                              disabled={!selected}
                              className="h-[42px] w-[170px] rounded-md border border-[#D9D9D9] px-4 text-center outline-none focus:border-[#00C06B] disabled:bg-[#F5F5F5] disabled:text-[#BFBFBF]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-4">
                              {spec.nextDayUnlimited ? (
                                <span className="text-[#666]">无限库存</span>
                              ) : (
                                <input
                                  value={spec.nextDayStock}
                                  onChange={e => updateSpecRow(spec.id, { nextDayStock: e.target.value })}
                                  disabled={!selected}
                                  className="h-[42px] w-[140px] rounded-md border border-[#D9D9D9] px-4 text-center outline-none focus:border-[#00C06B] disabled:bg-[#F5F5F5] disabled:text-[#BFBFBF]"
                                />
                              )}
                              <button
                                onClick={() => updateSpecRow(spec.id, { nextDayUnlimited: !spec.nextDayUnlimited })}
                                className="text-[#00C06B] hover:text-[#00A35B]"
                              >
                                {spec.nextDayUnlimited ? '改为自定义库存' : '改为无限库存'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-[140px_1fr] items-start text-[18px] text-[#666]">
            <div>
              <span className="mr-1 text-[#FF4D4F]">*</span>沽清渠道
            </div>
            <div>
              <label className={`mb-5 flex items-center ${isStockShared ? 'cursor-not-allowed text-[#BFBFBF]' : 'cursor-pointer text-[#00B75A]'}`}>
                <input
                  type="checkbox"
                  checked={allChannelsChecked}
                  onChange={toggleAllChannels}
                  disabled={isStockShared}
                  className={checkboxClass}
                />
                <span className="ml-3">全选</span>
              </label>
              <div className="flex flex-wrap gap-x-12 gap-y-5">
                {channels.map(channelId => (
                  <label
                    key={channelId}
                    className={`flex items-center ${isStockShared ? 'cursor-not-allowed text-[#C8CDD6]' : 'cursor-pointer text-[#00B75A]'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(channelId)}
                      onChange={() => toggleChannel(channelId)}
                      disabled={isStockShared}
                      className={checkboxClass}
                    />
                    <span className="ml-3">{getShelfChannelLabel(channelId)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end gap-4 border-t border-[#EDEDED] pt-8">
            <button
              onClick={onClose}
              className="h-[48px] rounded-md border border-[#D9D9D9] px-10 text-[18px] text-[#666] hover:bg-[#FAFAFA]"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isStockShared && selectedChannels.length === 0}
              className="h-[48px] rounded-md bg-[#11B45C] px-10 text-[18px] text-white hover:bg-[#0D9D50] disabled:cursor-not-allowed disabled:bg-[#A7DDBE]"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
