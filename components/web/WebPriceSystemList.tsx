import React, { useMemo, useState } from 'react';
import { Store, ShoppingBag, MoreHorizontal, X } from 'lucide-react';

type PriceStatus = 'enabled' | 'disabled';

type PriceSystemRecord = {
  id: string;
  name: string;
  storeName: string;
  status: PriceStatus;
  channels: Array<'mini' | 'pos' | 'takeout'>;
  effectiveTime: string;
};

type PriceStrategyModalState = {
  mode: 'create' | 'edit';
  record?: PriceSystemRecord;
};

const PRICE_SYSTEMS: PriceSystemRecord[] = [
  {
    id: '1214953234677141504',
    name: '多的是',
    storeName: '深圳南山万象店',
    status: 'disabled',
    channels: ['mini', 'takeout'],
    effectiveTime: '查看生效日期/周期/时段',
  },
  {
    id: '1209877285232644096',
    name: '1',
    storeName: '清远阳山门店城镇北门店',
    status: 'disabled',
    channels: ['mini', 'takeout'],
    effectiveTime: '查看生效日期/周期/时段',
  },
  {
    id: '1194673558491480065',
    name: '修银2.0',
    storeName: '修银体验店',
    status: 'enabled',
    channels: ['mini', 'takeout', 'pos'],
    effectiveTime: '查看生效日期/周期/时段',
  },
  {
    id: '1194672688387309568',
    name: '餐饮2.0',
    storeName: '餐饮2.0品牌+',
    status: 'enabled',
    channels: ['mini', 'takeout', 'pos'],
    effectiveTime: '查看生效日期/周期/时段',
  },
];

export const WebPriceSystemList: React.FC = () => {
  const [systemId, setSystemId] = useState('');
  const [systemName, setSystemName] = useState('');
  const [storeKeyword, setStoreKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [modalState, setModalState] = useState<PriceStrategyModalState | null>(null);

  const filteredRecords = useMemo(() => {
    const normalizedSystemId = systemId.trim().toLowerCase();
    const normalizedSystemName = systemName.trim().toLowerCase();
    const normalizedStoreKeyword = storeKeyword.trim().toLowerCase();

    return PRICE_SYSTEMS.filter(record => {
      if (normalizedSystemId && !record.id.toLowerCase().includes(normalizedSystemId)) return false;
      if (normalizedSystemName && !record.name.toLowerCase().includes(normalizedSystemName)) return false;
      if (normalizedStoreKeyword && !record.storeName.toLowerCase().includes(normalizedStoreKeyword)) return false;
      if (status && record.status !== status) return false;
      return true;
    });
  }, [systemId, systemName, storeKeyword, status]);

  const resetFilters = () => {
    setSystemId('');
    setSystemName('');
    setStoreKeyword('');
    setStatus('');
  };

  return (
    <>
      <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4">
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
        <div className="border-b border-[#E8E8E8] bg-white px-6 py-5">
          <div className="grid grid-cols-4 gap-4">
            <FilterInput label="策略ID" value={systemId} onChange={setSystemId} placeholder="请输入策略ID" />
            <FilterInput label="策略名称" value={systemName} onChange={setSystemName} placeholder="请输入策略名称" />
            <FilterInput label="机构门店" value={storeKeyword} onChange={setStoreKeyword} placeholder="请选择机构门店" />
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="mb-2 text-sm text-[#666]">启用状态</div>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="h-[38px] w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#333] outline-none focus:border-[#00C06B]"
                >
                  <option value="">请选择</option>
                  <option value="enabled">启用中</option>
                  <option value="disabled">禁用中</option>
                </select>
              </div>
              <button className="rounded-lg bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">筛选</button>
              <button onClick={resetFilters} className="text-sm font-bold text-[#00C06B] hover:text-[#00A35B]">清空筛选条件</button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 text-xs text-[#666]">
          价格策略支持为不同区域与门店配置差异化价格
          <span className="ml-2 text-[#00C06B]">查看帮助文档</span>
        </div>

        <div className="border-b border-[#E8E8E8] px-6 pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setModalState({ mode: 'create' })}
              className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]}"
            >
              新增价格策略
            </button>
            <button className="text-sm font-bold text-[#666] hover:text-[#333]">价格策略说明</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-4 min-w-[900px]">
            {filteredRecords.map(record => (
              <div key={record.id} className="rounded-xl border border-[#E8E8E8] bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4">
                  <div>
                    <div className="text-[28px] font-bold leading-none text-[#333]">{record.name}</div>
                    <div className="mt-3 text-sm text-[#999]">ID：{record.id}</div>
                  </div>
                  <span className={`rounded-md px-3 py-1 text-xs font-bold ${record.status === 'enabled' ? 'bg-[#EAF3FF] text-[#5B8FF9]' : 'bg-[#F5F5F5] text-[#666]'}`}>
                    {record.status === 'enabled' ? '启用中' : '禁用中'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 px-5 py-6 text-sm">
                  <div>
                    <div className="mb-3 text-[#999]">下发渠道</div>
                    <div className="flex items-center gap-2">
                      {record.channels.map(channel => (
                        <ChannelBadge key={channel} channel={channel} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 text-[#999]">生效时间</div>
                    <button className="text-sm font-medium text-[#00C06B] hover:text-[#00A35B]">{record.effectiveTime}</button>
                  </div>
                </div>

                <div className="border-t border-[#F0F0F0] bg-[#FAFAFA] px-5 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6 text-[#666]">
                      <button className="hover:text-[#00C06B]">价格管理</button>
                      <button className="hover:text-[#00C06B]">适用门店</button>
                      <button onClick={() => setModalState({ mode: 'edit', record })} className="hover:text-[#00C06B]">编辑策略</button>
                    </div>
                    <button className="text-[#999] hover:text-[#666]">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredRecords.length === 0 && (
              <div className="col-span-2 rounded-xl border border-dashed border-[#D9D9D9] px-6 py-16 text-center text-sm text-[#999]">
                暂无价格策略
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      {modalState && (
        <PriceStrategyModal
          mode={modalState.mode}
          record={modalState.record}
          onClose={() => setModalState(null)}
        />
      )}
    </>
  );
};

const FilterInput = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div>
    <div className="mb-2 text-sm text-[#666]">{label}</div>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-[38px] w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#333] outline-none focus:border-[#00C06B]"
    />
  </div>
);

const ChannelBadge = ({ channel }: { channel: 'mini' | 'pos' | 'takeout' }) => {
  if (channel === 'mini') {
    return <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#FFF7E6] text-[#FA8C16]"><ShoppingBag size={14} /></span>;
  }
  if (channel === 'takeout') {
    return <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#F6FFED] text-[#52C41A]"><Store size={14} /></span>;
  }
  return <span className="inline-flex rounded-md bg-[#EAF3FF] px-2 py-1 text-[10px] font-bold text-[#5B8FF9]">POS</span>;
};

const PriceStrategyModal = ({
  mode,
  record,
  onClose,
}: {
  mode: 'create' | 'edit';
  record?: PriceSystemRecord;
  onClose: () => void;
}) => {
  const [name, setName] = useState(record?.name || '');
  const [desc, setDesc] = useState('');
  const [dateMode, setDateMode] = useState<'always' | 'custom'>('always');
  const [channelConfig, setChannelConfig] = useState({
    miniProgram: { dineIn: false, takeout: false },
    pos: { dineIn: true, takeout: true },
  });

  const updateChannelConfig = (
    channel: 'miniProgram' | 'pos',
    field: 'dineIn' | 'takeout'
  ) => {
    setChannelConfig(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [field]: !prev[channel][field],
      },
    }));
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.35)]">
      <div className="w-[820px] rounded-2xl bg-white shadow-[0_18px_48px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4">
          <h3 className="text-lg font-bold text-[#333]">{mode === 'create' ? '新建价格策略' : '编辑价格策略'}</h3>
          <button onClick={onClose} className="text-[#999] hover:text-[#666]">
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-6">
          <div className="space-y-5">
            <ModalRow label="策略名称" required>
              <div className="relative w-full max-w-[340px]">
                <input
                  value={name}
                  onChange={e => setName(e.target.value.slice(0, 20))}
                  className="h-[36px] w-full rounded border border-[#E8E8E8] px-3 pr-12 text-sm outline-none focus:border-[#00C06B]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#BFBFBF]">{name.length}/20</span>
              </div>
            </ModalRow>

            <ModalRow label="策略描述">
              <div className="relative w-full max-w-[420px]">
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value.slice(0, 50))}
                  rows={4}
                  className="w-full rounded border border-[#E8E8E8] px-3 py-2 pr-12 text-sm outline-none focus:border-[#00C06B] resize-none"
                />
                <span className="absolute bottom-3 right-3 text-xs text-[#BFBFBF]">{desc.length}/50</span>
              </div>
            </ModalRow>

            <ModalRow label="生效日期" required>
              <div className="flex items-center gap-8 pt-2 text-sm">
                <label className={`flex items-center gap-2 ${dateMode === 'always' ? 'text-[#00C06B] font-bold' : 'text-[#666]'}`}>
                  <input
                    type="radio"
                    checked={dateMode === 'always'}
                    onChange={() => setDateMode('always')}
                    className="accent-[#00C06B]"
                  />
                  全时段
                </label>
                <label className={`flex items-center gap-2 ${dateMode === 'custom' ? 'text-[#00C06B] font-bold' : 'text-[#666]'}`}>
                  <input
                    type="radio"
                    checked={dateMode === 'custom'}
                    onChange={() => setDateMode('custom')}
                    className="accent-[#00C06B]"
                  />
                  自定义日期
                </label>
              </div>
            </ModalRow>

            <ModalRow label="生效渠道" required>
              <div className="w-full max-w-[520px] overflow-hidden rounded border border-[#E8E8E8]">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#F7F8FA] text-xs font-bold text-[#666]">
                    <tr>
                      <th className="border-b border-[#E8E8E8] px-4 py-3">售卖渠道</th>
                      <th className="border-b border-l border-[#E8E8E8] px-4 py-3" colSpan={2}>售卖类型</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-[#666]">
                    <tr>
                      <td className="border-b border-[#E8E8E8] px-4 py-3">小程序</td>
                      <td className="border-b border-l border-[#E8E8E8] px-4 py-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={channelConfig.miniProgram.dineIn}
                            onChange={() => updateChannelConfig('miniProgram', 'dineIn')}
                            className="accent-[#00C06B]"
                          />
                          堂食
                        </label>
                      </td>
                      <td className="border-b border-[#E8E8E8] px-4 py-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={channelConfig.miniProgram.takeout}
                            onChange={() => updateChannelConfig('miniProgram', 'takeout')}
                            className="accent-[#00C06B]"
                          />
                          外卖
                        </label>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">POS</td>
                      <td className="border-l border-[#E8E8E8] px-4 py-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={channelConfig.pos.dineIn}
                            onChange={() => updateChannelConfig('pos', 'dineIn')}
                            className="accent-[#00C06B]"
                          />
                          堂食
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={channelConfig.pos.takeout}
                            onChange={() => updateChannelConfig('pos', 'takeout')}
                            className="accent-[#00C06B]"
                          />
                          外卖
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ModalRow>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E8E8E8] px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-[#E8E8E8] px-5 py-2 text-sm text-[#666] hover:bg-gray-50">取消</button>
          <button className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">确定</button>
        </div>
      </div>
    </div>
  );
};

const ModalRow = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex items-start">
    <div className="w-[100px] shrink-0 pr-4 pt-2 text-right text-sm text-[#666]">
      {required && <span className="mr-1 text-[#FF4D4F]">*</span>}
      {label}:
    </div>
    <div className="flex-1">{children}</div>
  </div>
);
