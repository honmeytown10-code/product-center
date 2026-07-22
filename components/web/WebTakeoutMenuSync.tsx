import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  CircleHelp,
  FileText,
  LoaderCircle,
  PackagePlus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

type ChannelId = 'meituan' | 'taobao';
type SyncTool = 'upsert' | 'full' | 'delete';
type StoreTab = 'eligible' | 'partial';
type TaskCreationStatus = 'creating' | 'success' | 'failed';

type ChannelConfig = {
  id: ChannelId;
  name: string;
  shortName: string;
  color: string;
  softColor: string;
};

type StoreRecord = {
  id: string;
  name: string;
  area: string;
  authorizedChannels: ChannelId[];
  channelStoreIds: Partial<Record<ChannelId, string>>;
};

type SyncRecord = {
  id: string;
  content: string;
  channel: ChannelId;
  storeCount: number;
  status: '待执行' | '执行中' | '执行成功' | '部分成功' | '执行失败';
  createdAt: string;
};

type TaskCreationItem = {
  channel: ChannelId;
  status: TaskCreationStatus;
  taskId?: string;
  errorMessage?: string;
};

const CHANNELS: ChannelConfig[] = [
  {
    id: 'meituan',
    name: '美团外卖',
    shortName: '美团',
    color: '#FFC300',
    softColor: '#FFF8D9',
  },
  {
    id: 'taobao',
    name: '淘宝闪购',
    shortName: '闪购',
    color: '#FF6400',
    softColor: '#FFF1E8',
  },
];

const MENUS = [
  { id: 'menu-1', name: 'XJ 外卖菜单', productCount: 126 },
  { id: 'menu-2', name: '华东区域外卖菜单', productCount: 98 },
  { id: 'menu-3', name: '夜宵专属菜单', productCount: 42 },
];

const PRODUCTS = [
  { id: 'p-1', name: '重庆测试单位商品', code: '1276505558829625344', type: '标准商品', price: 22 },
  { id: 'p-2', name: '招牌酸菜鱼', code: '1276505558829625345', type: '标准商品', price: 68 },
  { id: 'p-3', name: '双人欢聚套餐', code: '1276505558829625346', type: '套餐商品', price: 128 },
  { id: 'p-4', name: '冰镇柠檬茶', code: '1276505558829625347', type: '标准商品', price: 12 },
];

const STORES: StoreRecord[] = [
  {
    id: 'store-1',
    name: '槐店王婆北京朝阳店',
    area: '北京市 / 朝阳区',
    authorizedChannels: ['meituan', 'taobao'],
    channelStoreIds: { meituan: 'MT10023891', taobao: 'TB88362109' },
  },
  {
    id: 'store-2',
    name: '槐店王婆上海静安店',
    area: '上海市 / 静安区',
    authorizedChannels: ['meituan', 'taobao'],
    channelStoreIds: { meituan: 'MT10023892', taobao: 'TB88362110' },
  },
  {
    id: 'store-3',
    name: '槐店王婆杭州西湖店',
    area: '浙江省 / 杭州市',
    authorizedChannels: ['meituan'],
    channelStoreIds: { meituan: 'MT10023893' },
  },
  {
    id: 'store-4',
    name: '槐店王婆深圳福田店',
    area: '广东省 / 深圳市',
    authorizedChannels: ['taobao'],
    channelStoreIds: { taobao: 'TB88362112' },
  },
  {
    id: 'store-5',
    name: '槐店王婆成都春熙店',
    area: '四川省 / 成都市',
    authorizedChannels: ['meituan', 'taobao'],
    channelStoreIds: { meituan: 'MT10023895', taobao: 'TB88362113' },
  },
];

const INITIAL_RECORDS: SyncRecord[] = [
  {
    id: '1284846229923434496',
    content: '删除商品 · 6个商品',
    channel: 'meituan',
    storeCount: 3,
    status: '执行成功',
    createdAt: '2026-07-17 12:00:12',
  },
  {
    id: '1284846229923434497',
    content: '删除商品 · 6个商品',
    channel: 'taobao',
    storeCount: 3,
    status: '执行成功',
    createdAt: '2026-07-17 12:00:12',
  },
  {
    id: '1284846226601545729',
    content: '新增商品 · 12个商品',
    channel: 'meituan',
    storeCount: 5,
    status: '执行成功',
    createdAt: '2026-07-17 12:00:11',
  },
  {
    id: '1284665046421590017',
    content: '同步整体菜单 · 126个商品',
    channel: 'meituan',
    storeCount: 2,
    status: '部分成功',
    createdAt: '2026-07-17 00:00:14',
  },
  {
    id: '1284665046421590018',
    content: '同步整体菜单 · 126个商品',
    channel: 'taobao',
    storeCount: 2,
    status: '执行成功',
    createdAt: '2026-07-17 00:00:14',
  },
];

const TOOL_CONFIG: Record<SyncTool, { title: string; description: string; icon: React.ReactNode; tone: string }> = {
  upsert: {
    title: '新增/更新商品',
    description: '将选中的商品新增或更新到外卖渠道',
    icon: <PackagePlus size={24} />,
    tone: 'text-orange-500 bg-orange-50',
  },
  full: {
    title: '同步整体菜单',
    description: '按当前菜单完整覆盖外卖渠道的门店菜单',
    icon: <FileText size={24} />,
    tone: 'text-cyan-500 bg-cyan-50',
  },
  delete: {
    title: '删除商品',
    description: '从外卖渠道的门店菜单中删除指定商品',
    icon: <Trash2 size={24} />,
    tone: 'text-red-500 bg-red-50',
  },
};

const channelById = (channelId: ChannelId) => CHANNELS.find(channel => channel.id === channelId)!;

const ChannelBadge: React.FC<{ channelId: ChannelId; compact?: boolean }> = ({ channelId, compact }) => {
  const channel = channelById(channelId);
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 font-medium ${compact ? 'text-[11px]' : 'text-xs'}`}
      style={{ color: channel.id === 'meituan' ? '#8A6800' : '#C44E00', backgroundColor: channel.softColor }}
    >
      <span className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: channel.color }} />
      {compact ? channel.shortName : channel.name}
    </span>
  );
};

export const WebTakeoutMenuSync: React.FC = () => {
  const [activeTool, setActiveTool] = useState<SyncTool | null>(null);
  const [menuId, setMenuId] = useState(MENUS[0].id);
  const [syncMode, setSyncMode] = useState<'create' | 'update'>('create');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(['p-1', 'p-2']);
  const [selectedChannels, setSelectedChannels] = useState<ChannelId[]>(['meituan', 'taobao']);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>(['store-1']);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeTab, setStoreTab] = useState<StoreTab>('eligible');
  const [storeKeyword, setStoreKeyword] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creationItems, setCreationItems] = useState<TaskCreationItem[] | null>(null);
  const [creationComplete, setCreationComplete] = useState(false);
  const [detailRecord, setDetailRecord] = useState<SyncRecord | null>(null);
  const [records, setRecords] = useState<SyncRecord[]>(INITIAL_RECORDS);
  const [recordKeyword, setRecordKeyword] = useState('');

  const selectedMenu = MENUS.find(menu => menu.id === menuId) || MENUS[0];
  const selectedStores = STORES.filter(store => selectedStoreIds.includes(store.id));
  const isMultiChannel = selectedChannels.length > 1;
  const singleChannelId = selectedChannels.length === 1 ? selectedChannels[0] : null;
  const singleChannel = singleChannelId ? channelById(singleChannelId) : null;
  const isStoreEligible = (store: StoreRecord, channels = selectedChannels) => (
    channels.length > 0 && channels.every(channelId => store.authorizedChannels.includes(channelId))
  );

  const eligibleStores = useMemo(
    () => isMultiChannel ? STORES : STORES.filter(store => isStoreEligible(store)),
    [selectedChannels],
  );

  const partialStores = useMemo(
    () => !isMultiChannel && selectedChannels.length > 0 ? STORES.filter(store => !isStoreEligible(store)) : [],
    [selectedChannels],
  );

  const filteredModalStores = (storeTab === 'eligible' ? eligibleStores : partialStores).filter(store => (
    store.name.includes(storeKeyword) || store.area.includes(storeKeyword)
  ));

  const filteredRecords = records.filter(record => (
    !recordKeyword || record.id.includes(recordKeyword) || record.content.includes(recordKeyword)
  ));

  const toggleChannel = (channelId: ChannelId) => {
    const nextChannels = selectedChannels.includes(channelId)
      ? selectedChannels.filter(id => id !== channelId)
      : [...selectedChannels, channelId];

    setSelectedChannels(nextChannels);
    setStoreTab('eligible');
    const retainedStores = selectedStoreIds.filter(storeId => {
      const store = STORES.find(item => item.id === storeId);
      if (!store || nextChannels.length === 0) return false;
      return nextChannels.length > 1 || store.authorizedChannels.includes(nextChannels[0]);
    });
    setSelectedStoreIds(retainedStores);
  };

  const openTool = (tool: SyncTool) => {
    setActiveTool(tool);
    setSelectedChannels(['meituan', 'taobao']);
    setSelectedStoreIds(['store-1']);
  };

  const isReadyToSubmit = !!activeTool
    && !!menuId
    && selectedChannels.length > 0
    && selectedStoreIds.length > 0
    && (activeTool === 'full' || selectedProductIds.length > 0);

  const createChannelTasks = async (channels: ChannelId[]) => {
    if (!activeTool) return;
    const tool = TOOL_CONFIG[activeTool];
    const contentCount = activeTool === 'full' ? selectedMenu.productCount : selectedProductIds.length;
    const createdAt = Date.now();
    const storeCount = selectedStoreIds.length;

    const createdRecords = await Promise.all(channels.map(async (channel, index): Promise<SyncRecord | null> => {
      try {
        // Prototype delay mirrors the independent create-task API request for each channel.
        await new Promise(resolve => window.setTimeout(resolve, 850 + index * 650));
        const taskId = `${createdAt + index}`;
        setCreationItems(prev => prev?.map(item => item.channel === channel
          ? { ...item, status: 'success', taskId, errorMessage: undefined }
          : item) || null);
        return {
          id: taskId,
          content: `${activeTool === 'upsert' ? (syncMode === 'create' ? '新增商品' : '更新商品') : tool.title} · ${contentCount}个商品`,
          channel,
          storeCount,
          status: '待执行',
          createdAt: '2026-07-20 10:18:30',
        };
      } catch {
        setCreationItems(prev => prev?.map(item => item.channel === channel
          ? { ...item, status: 'failed', errorMessage: '任务创建失败，请重试' }
          : item) || null);
        return null;
      }
    }));

    const successfulRecords = createdRecords.filter((record): record is SyncRecord => !!record);
    if (successfulRecords.length > 0) {
      setRecords(prev => [...successfulRecords, ...prev]);
    }
    setCreationComplete(true);
  };

  const submitTask = () => {
    setConfirmOpen(false);
    setCreationComplete(false);
    setCreationItems(selectedChannels.map(channel => ({ channel, status: 'creating' })));
    void createChannelTasks(selectedChannels);
  };

  const retryFailedCreations = () => {
    const failedChannels = creationItems?.filter(item => item.status === 'failed').map(item => item.channel) || [];
    if (failedChannels.length === 0) return;
    setCreationComplete(false);
    setCreationItems(prev => prev?.map(item => failedChannels.includes(item.channel)
      ? { channel: item.channel, status: 'creating' }
      : item) || null);
    void createChannelTasks(failedChannels);
  };

  const handleRefreshRecords = () => {
    setRecords(prev => prev.map(record => {
      if (record.status === '待执行') return { ...record, status: '执行中' };
      if (record.status === '执行中') return { ...record, status: '执行成功' };
      return record;
    }));
  };

  const renderHome = () => (
    <div className="h-full overflow-y-auto bg-white">
      <div className="border-b border-gray-100 px-7 py-5">
        <div className="flex items-center gap-2 text-base font-bold text-gray-800">
          外卖菜单同步
          <button className="inline-flex items-center gap-1 text-xs font-normal text-[#00A85A]" title="查看外卖菜单同步使用说明">
            使用说明 <CircleHelp size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 px-7 py-6">
        {(Object.keys(TOOL_CONFIG) as SyncTool[]).map(toolId => {
          const tool = TOOL_CONFIG[toolId];
          return (
            <button
              key={toolId}
              type="button"
              onClick={() => openTool(toolId)}
              className="group flex min-h-[112px] items-start border border-gray-200 bg-[#FBFCFD] p-5 text-left transition hover:border-[#00C06B] hover:bg-white hover:shadow-sm"
            >
              <span className={`mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${tool.tone}`}>{tool.icon}</span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-gray-800 group-hover:text-[#00A85A]">{tool.title}</span>
                <span className="mt-2 block text-sm leading-5 text-gray-400">{tool.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-7 pb-7">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800">批量同步记录</h3>
            <button onClick={handleRefreshRecords} className="inline-flex items-center gap-1 text-xs text-[#00A85A]"><RefreshCw size={13} />刷新</button>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              value={recordKeyword}
              onChange={event => setRecordKeyword(event.target.value)}
              placeholder="搜索任务ID或同步内容"
              className="h-9 w-[260px] border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]"
            />
          </div>
        </div>
        <div className="overflow-hidden border border-gray-200">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-[#F5F6F8] text-gray-600">
              <tr>
                <th className="w-[220px] px-4 py-3 font-medium">任务ID</th>
                <th className="px-4 py-3 font-medium">同步内容</th>
                <th className="w-[210px] px-4 py-3 font-medium">同步渠道</th>
                <th className="w-[90px] px-4 py-3 font-medium">门店数</th>
                <th className="w-[110px] px-4 py-3 font-medium">执行状态</th>
                <th className="w-[180px] px-4 py-3 font-medium">创建时间</th>
                <th className="w-[90px] px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id} className="border-t border-gray-100 text-gray-600 hover:bg-gray-50/60">
                  <td className="px-4 py-4 text-xs text-gray-500">{record.id}</td>
                  <td className="px-4 py-4 text-gray-800">{record.content}</td>
                  <td className="px-4 py-4">
                    <ChannelBadge channelId={record.channel} compact />
                  </td>
                  <td className="px-4 py-4">{record.storeCount}</td>
                  <td className="px-4 py-4">
                    <span className={
                      record.status === '待执行'
                        ? 'text-gray-500'
                        : record.status === '执行中'
                          ? 'text-blue-500'
                          : record.status === '部分成功'
                            ? 'text-orange-500'
                            : record.status === '执行失败'
                              ? 'text-red-500'
                              : 'text-[#00A85A]'
                    }>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs">{record.createdAt}</td>
                  <td className="px-4 py-4"><button onClick={() => setDetailRecord(record)} className="text-[#00A85A]">查看详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProductSelector = () => {
    if (activeTool === 'full') {
      return (
        <div className="border border-gray-200 bg-[#FAFBFC] px-4 py-3 text-sm text-gray-600">
          将同步菜单内全部 <span className="font-bold text-gray-800">{selectedMenu.productCount}</span> 个商品，目标渠道中不在当前菜单内的商品将被删除。
        </div>
      );
    }

    return (
      <div className="overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between bg-[#F8F9FA] px-4 py-3">
          <span className="text-sm text-gray-600">已选择 <b className="text-[#00A85A]">{selectedProductIds.length}</b> 个商品</span>
          <button
            onClick={() => setSelectedProductIds(PRODUCTS.map(product => product.id))}
            className="text-xs text-[#00A85A]"
          >
            选择全部
          </button>
        </div>
        <table className="w-full table-fixed text-left text-sm">
          <thead className="border-t border-gray-100 bg-white text-gray-500">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="px-3 py-3 font-medium">商品名称</th>
              <th className="w-[160px] px-3 py-3 font-medium">商品类型</th>
              <th className="w-[120px] px-3 py-3 font-medium">价格</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map(product => (
              <tr key={product.id} className="border-t border-gray-100 text-gray-600">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => setSelectedProductIds(prev => prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id])}
                    className="h-4 w-4 accent-[#00C06B]"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-gray-800">{product.name}</div>
                  <div className="mt-0.5 text-xs text-gray-400">{product.code}</div>
                </td>
                <td className="px-3 py-3">{product.type}</td>
                <td className="px-3 py-3">￥{product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderForm = () => {
    if (!activeTool) return null;
    const tool = TOOL_CONFIG[activeTool];

    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="sticky top-0 z-20 flex h-[58px] items-center border-b border-gray-100 bg-white px-7">
          <button onClick={() => setActiveTool(null)} className="mr-3 text-gray-500 hover:text-gray-800" title="返回同步工具"><ChevronLeft size={20} /></button>
          <div>
            <h2 className="font-bold text-gray-800">{tool.title}</h2>
          </div>
        </div>

        <div className="mx-auto max-w-[1180px] px-8 py-7">
          <section className="border-b border-gray-100 pb-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00C06B] text-sm font-bold text-white">1</span>
              <div><h3 className="font-bold text-gray-800">同步内容</h3><p className="text-xs text-gray-400">选择菜单和需要处理的商品</p></div>
            </div>
            <div className="ml-10 space-y-5">
              <div className="flex items-center">
                <label className="w-[110px] text-sm text-gray-600"><span className="mr-1 text-red-500">*</span>菜单名称</label>
                <div className="relative w-[320px]">
                  <select value={menuId} onChange={event => setMenuId(event.target.value)} className="h-10 w-full appearance-none border border-gray-200 bg-white px-3 pr-9 text-sm outline-none focus:border-[#00C06B]">
                    {MENUS.map(menu => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
              {activeTool === 'upsert' && (
                <div className="flex items-center">
                  <label className="w-[110px] text-sm text-gray-600"><span className="mr-1 text-red-500">*</span>同步方式</label>
                  <div className="flex gap-6">
                    {([['create', '新增商品'], ['update', '更新商品']] as const).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                        <input type="radio" checked={syncMode === value} onChange={() => setSyncMode(value)} className="h-4 w-4 accent-[#00C06B]" />{label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-start">
                <label className="w-[110px] shrink-0 pt-3 text-sm text-gray-600"><span className="mr-1 text-red-500">*</span>同步商品</label>
                <div className="min-w-0 flex-1">{renderProductSelector()}</div>
              </div>
            </div>
          </section>

          <section className="border-b border-gray-100 py-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00C06B] text-sm font-bold text-white">2</span>
              <h3 className="font-bold text-gray-800">同步渠道</h3>
            </div>
            <div className="ml-10 grid max-w-[680px] grid-cols-2 gap-3">
              {CHANNELS.map(channel => {
                const selected = selectedChannels.includes(channel.id);
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    className={`flex h-[72px] items-center justify-between border px-4 text-left transition ${selected ? 'border-[#00C06B] bg-[#F2FBF7]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold" style={{ color: channel.id === 'meituan' ? '#8A6800' : '#C44E00', backgroundColor: channel.softColor }}>{channel.shortName}</span>
                      <b className="block text-sm text-gray-800">{channel.name}</b>
                    </span>
                    <span className={`flex h-5 w-5 items-center justify-center border ${selected ? 'border-[#00C06B] bg-[#00C06B] text-white' : 'border-gray-300 text-transparent'}`}><Check size={14} /></span>
                  </button>
                );
              })}
            </div>
            {selectedChannels.length === 0 && <p className="ml-10 mt-2 text-xs text-red-500">请至少选择一个同步渠道</p>}
          </section>

          <section className="border-b border-gray-100 py-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00C06B] text-sm font-bold text-white">3</span>
              <div>
                <h3 className="font-bold text-gray-800">同步门店</h3>
                <p className="text-xs text-gray-400">{isMultiChannel ? '已选择多个渠道，可选择全部门店' : '仅支持选择已授权所选渠道的门店'}</p>
              </div>
            </div>
            <div className="ml-10">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  已选 <b className="text-[#00A85A]">{selectedStoreIds.length}</b> 家门店
                </div>
                <button
                  onClick={() => { setStoreTab('eligible'); setStoreModalOpen(true); }}
                  disabled={selectedChannels.length === 0}
                  className="h-9 border border-[#00C06B] px-4 text-sm text-[#00A85A] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                >
                  选择门店
                </button>
              </div>
              <div className="overflow-hidden border border-gray-200">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="bg-[#F5F6F8] text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">门店名称</th>
                      {singleChannel && <>
                        <th className="w-[160px] px-4 py-3 font-medium">绑定渠道</th>
                        <th className="w-[210px] px-4 py-3 font-medium">{singleChannel.shortName}门店ID</th>
                        <th className="w-[260px] px-4 py-3 font-medium">{singleChannel.shortName}门店名称</th>
                      </>}
                      <th className="w-[100px] px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStores.length > 0 ? selectedStores.map(store => (
                      <tr key={store.id} className="border-t border-gray-100 text-gray-600">
                        <td className="px-4 py-3"><div className="font-medium text-gray-800">{store.name}</div><div className="mt-0.5 text-xs text-gray-400">{store.area}</div></td>
                        {singleChannelId && <>
                          <td className="px-4 py-3"><ChannelBadge channelId={singleChannelId} compact /></td>
                          <td className="px-4 py-3 text-gray-700">{store.channelStoreIds[singleChannelId] || '-'}</td>
                          <td className="truncate px-4 py-3 text-gray-700" title={store.name}>{store.name}</td>
                        </>}
                        <td className="px-4 py-3"><button onClick={() => setSelectedStoreIds(prev => prev.filter(id => id !== store.id))} className="text-red-500">移除</button></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={singleChannel ? 5 : 2} className="h-24 text-center text-sm text-gray-400">尚未选择门店</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="py-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00C06B] text-sm font-bold text-white">4</span>
              <h3 className="font-bold text-gray-800">执行设置</h3>
            </div>
            <div className="ml-10 flex items-center gap-8 text-sm text-gray-700">
              <label className="flex cursor-pointer items-center gap-2"><input type="radio" defaultChecked name="sync-time" className="h-4 w-4 accent-[#00C06B]" />立即执行</label>
              <label className="flex cursor-pointer items-center gap-2 text-gray-400"><input type="radio" name="sync-time" className="h-4 w-4 accent-[#00C06B]" />定时执行</label>
            </div>
          </section>

          <div className="sticky bottom-0 -mx-8 flex items-center justify-between border-t border-gray-100 bg-white/95 px-8 py-4 backdrop-blur-sm">
            <div className="text-xs text-gray-500">
              将创建 <b className="text-gray-800">{selectedChannels.length}</b> 个渠道任务，覆盖 <b className="text-gray-800">{selectedStoreIds.length}</b> 家门店
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveTool(null)} className="h-10 border border-gray-200 px-5 text-sm text-gray-600">取消</button>
              <button disabled={!isReadyToSubmit} onClick={() => setConfirmOpen(true)} className="h-10 bg-[#00C06B] px-6 text-sm font-medium text-white hover:bg-[#00A85A] disabled:cursor-not-allowed disabled:bg-gray-300">确认同步</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStoreModal = () => {
    if (!storeModalOpen) return null;
    const allEligibleSelected = filteredModalStores.length > 0 && filteredModalStores.every(store => selectedStoreIds.includes(store.id));

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-6">
        <div className="flex h-[calc(100vh-48px)] max-h-[680px] w-[1080px] max-w-[calc(100vw-48px)] flex-col bg-white shadow-2xl">
          <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-gray-100 px-6">
            <h3 className="font-bold text-gray-800">选择同步门店</h3>
            <button onClick={() => setStoreModalOpen(false)} title="关闭"><X size={20} className="text-gray-400" /></button>
          </div>

          <div className="grid grid-cols-[1fr_330px] overflow-hidden flex-1">
            <div className="flex min-w-0 flex-col border-r border-gray-100">
              <div className={`flex items-end border-b border-gray-100 px-5 pt-4 ${isMultiChannel ? 'justify-end' : 'justify-between'}`}>
                {!isMultiChannel && <div className="flex gap-6">
                  <button onClick={() => setStoreTab('eligible')} className={`border-b-2 pb-3 text-sm ${storeTab === 'eligible' ? 'border-[#00C06B] font-bold text-[#00A85A]' : 'border-transparent text-gray-500'}`}>可选择门店 {eligibleStores.length}</button>
                  <button onClick={() => setStoreTab('partial')} className={`border-b-2 pb-3 text-sm ${storeTab === 'partial' ? 'border-orange-400 font-bold text-orange-600' : 'border-transparent text-gray-500'}`}>授权不完整 {partialStores.length}</button>
                </div>}
                <div className="relative mb-2.5">
                  <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  <input value={storeKeyword} onChange={event => setStoreKeyword(event.target.value)} placeholder="搜索门店名称或区域" className="h-9 w-[240px] border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]" />
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-[#F5F6F8] text-gray-600">
                    <tr>
                      <th className="w-12 px-4 py-3">
                        {storeTab === 'eligible' && <input type="checkbox" checked={allEligibleSelected} onChange={() => setSelectedStoreIds(allEligibleSelected ? selectedStoreIds.filter(id => !filteredModalStores.some(store => store.id === id)) : Array.from(new Set([...selectedStoreIds, ...filteredModalStores.map(store => store.id)])))} className="h-4 w-4 accent-[#00C06B]" />}
                      </th>
                      <th className="px-3 py-3 font-medium">门店名称</th>
                      {!isMultiChannel && <th className="w-[250px] px-3 py-3 font-medium">渠道授权状态</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModalStores.map(store => (
                      <tr key={store.id} className={`border-t border-gray-100 ${storeTab === 'partial' ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-4"><input type="checkbox" disabled={storeTab === 'partial'} checked={selectedStoreIds.includes(store.id)} onChange={() => setSelectedStoreIds(prev => prev.includes(store.id) ? prev.filter(id => id !== store.id) : [...prev, store.id])} className="h-4 w-4 accent-[#00C06B] disabled:cursor-not-allowed" /></td>
                        <td className="px-3 py-4"><div className={`font-medium ${storeTab === 'partial' ? 'text-gray-500' : 'text-gray-800'}`}>{store.name}</div><div className="mt-1 text-xs text-gray-400">{store.area}</div></td>
                        {!isMultiChannel && <td className="px-3 py-4">
                          <div className="space-y-2">
                            {selectedChannels.map(channelId => {
                              const authorized = store.authorizedChannels.includes(channelId);
                              return (
                                <div key={channelId} className="flex items-center justify-between text-xs">
                                  <ChannelBadge channelId={channelId} compact />
                                  <span className={authorized ? 'text-[#00A85A]' : 'text-red-500'}>{authorized ? '已授权' : '未授权'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col bg-[#FAFBFC]">
              <div className="border-b border-gray-100 px-5 py-4"><b className="text-sm text-gray-800">已选择 {selectedStoreIds.length} 家门店</b></div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {selectedStores.map(store => (
                  <div key={store.id} className="flex items-center justify-between border border-gray-200 bg-white px-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-700">{store.name}</div>
                      {!isMultiChannel && <div className="mt-1 flex gap-1">{selectedChannels.map(id => <ChannelBadge key={id} channelId={id} compact />)}</div>}
                    </div>
                    <button onClick={() => setSelectedStoreIds(prev => prev.filter(id => id !== store.id))} title="移除门店"><X size={16} className="text-gray-400 hover:text-red-500" /></button>
                  </div>
                ))}
                {selectedStores.length === 0 && <div className="pt-16 text-center text-sm text-gray-400">尚未选择门店</div>}
              </div>
            </div>
          </div>

          <div className="flex h-[64px] shrink-0 items-center justify-end border-t border-gray-100 px-6">
            <div className="flex gap-3"><button onClick={() => setStoreModalOpen(false)} className="h-9 border border-gray-200 px-5 text-sm text-gray-600">取消</button><button onClick={() => setStoreModalOpen(false)} className="h-9 bg-[#00C06B] px-6 text-sm font-medium text-white">确定</button></div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmModal = () => {
    if (!confirmOpen || !activeTool) return null;
    const tool = TOOL_CONFIG[activeTool];
    const productCount = activeTool === 'full' ? selectedMenu.productCount : selectedProductIds.length;
    return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-6">
        <div className="w-[620px] max-w-full bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4"><h3 className="font-bold text-gray-800">确认{tool.title}</h3><button onClick={() => setConfirmOpen(false)} title="关闭"><X size={20} className="text-gray-400" /></button></div>
          <div className="p-6">
            {activeTool === 'full' || activeTool === 'delete' ? (
              <div className="mb-5 flex items-start gap-3 border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-700"><AlertTriangle size={18} className="mt-0.5 shrink-0" /><span>{activeTool === 'full' ? '整体同步会以当前菜单为准覆盖渠道门店菜单，渠道中多余的商品将被删除。' : '删除后商品会从所选渠道的门店菜单中移除，请确认商品和门店范围。'}</span></div>
            ) : null}
            <dl className="grid grid-cols-[110px_1fr] gap-y-4 text-sm">
              <dt className="text-gray-500">菜单</dt><dd className="font-medium text-gray-800">{selectedMenu.name}</dd>
              <dt className="text-gray-500">同步内容</dt><dd className="text-gray-800">{tool.title}，共 {productCount} 个商品</dd>
              <dt className="text-gray-500">同步渠道</dt><dd className="flex flex-wrap gap-2">{selectedChannels.map(id => <ChannelBadge key={id} channelId={id} />)}</dd>
              <dt className="text-gray-500">同步门店</dt><dd className="text-gray-800">{selectedStoreIds.length} 家</dd>
              <dt className="text-gray-500">任务数量</dt><dd className="text-gray-800">{selectedChannels.length} 个</dd>
            </dl>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4"><button onClick={() => setConfirmOpen(false)} className="h-9 border border-gray-200 px-5 text-sm text-gray-600">返回修改</button><button onClick={submitTask} className="h-9 bg-[#00C06B] px-6 text-sm font-medium text-white">确认创建</button></div>
        </div>
      </div>
    );
  };

  const closeCreationModal = () => {
    if (!creationComplete) return;
    setCreationItems(null);
    setActiveTool(null);
  };

  const renderCreationModal = () => {
    if (!creationItems) return null;
    const successCount = creationItems.filter(item => item.status === 'success').length;
    const failedCount = creationItems.filter(item => item.status === 'failed').length;

    return (
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-6">
        <div className="w-[680px] max-w-full bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="font-bold text-gray-800">创建同步任务</h3>
            {creationComplete && <button onClick={closeCreationModal} title="关闭"><X size={20} className="text-gray-400" /></button>}
          </div>
          <div className="px-6 py-5">
            {!creationComplete ? (
              <div className="mb-5 flex items-center gap-3 border border-blue-100 bg-blue-50 px-4 py-3">
                <LoaderCircle size={20} className="animate-spin text-blue-500" />
                <div>
                  <b className="text-sm text-gray-800">正在创建同步任务</b>
                  <p className="mt-0.5 text-xs text-gray-500">已完成 {successCount + failedCount}/{creationItems.length}，请稍候</p>
                </div>
              </div>
            ) : failedCount === 0 ? (
              <div className="mb-5 flex items-start gap-3 border border-green-100 bg-green-50 px-4 py-3">
                <CheckCircle2 size={20} className="mt-0.5 text-[#00A85A]" />
                <div>
                  <b className="text-sm text-gray-800">{successCount} 个同步任务创建成功</b>
                  <p className="mt-1 text-xs text-gray-500">任务已进入异步执行队列，可在同步记录中刷新查看最新状态</p>
                </div>
              </div>
            ) : (
              <div className="mb-5 flex items-start gap-3 border border-orange-200 bg-orange-50 px-4 py-3">
                <CircleAlert size={20} className="mt-0.5 text-orange-500" />
                <div>
                  <b className="text-sm text-gray-800">成功创建 {successCount} 个，失败 {failedCount} 个</b>
                  <p className="mt-1 text-xs text-gray-500">已成功的任务不会重复创建，可单独重试失败渠道</p>
                </div>
              </div>
            )}
            <div className="overflow-hidden border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F6F8] text-gray-600"><tr><th className="px-4 py-3 font-medium">同步渠道</th><th className="w-[150px] px-4 py-3 font-medium">创建状态</th><th className="w-[210px] px-4 py-3 font-medium">任务ID</th></tr></thead>
                <tbody>
                  {creationItems.map(item => (
                    <tr key={item.channel} className="border-t border-gray-100">
                      <td className="px-4 py-4"><ChannelBadge channelId={item.channel} /></td>
                      <td className="px-4 py-4">
                        {item.status === 'creating' && <span className="inline-flex items-center gap-1.5 text-blue-500"><LoaderCircle size={14} className="animate-spin" />创建中</span>}
                        {item.status === 'success' && <span className="inline-flex items-center gap-1.5 text-[#00A85A]"><CheckCircle2 size={14} />创建成功</span>}
                        {item.status === 'failed' && <span className="inline-flex items-center gap-1.5 text-red-500"><CircleAlert size={14} />创建失败</span>}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">{item.taskId || item.errorMessage || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            {!creationComplete ? (
              <button disabled className="h-9 bg-gray-300 px-6 text-sm font-medium text-white">正在创建...</button>
            ) : failedCount > 0 ? (
              <><button onClick={closeCreationModal} className="h-9 border border-gray-200 px-5 text-sm text-gray-600">查看同步记录</button><button onClick={retryFailedCreations} className="h-9 bg-[#00C06B] px-6 text-sm font-medium text-white">重试失败任务</button></>
            ) : (
              <button onClick={closeCreationModal} className="h-9 bg-[#00C06B] px-6 text-sm font-medium text-white">查看同步记录</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskDetailModal = () => {
    if (!detailRecord) return null;
    const isAsyncRunning = detailRecord.status === '待执行' || detailRecord.status === '执行中';
    return (
      <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-6">
        <div className="w-[560px] max-w-full bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4"><h3 className="font-bold text-gray-800">同步任务详情</h3><button onClick={() => setDetailRecord(null)} title="关闭"><X size={20} className="text-gray-400" /></button></div>
          <div className="p-6">
            {isAsyncRunning && (
              <div className="mb-5 flex items-start gap-3 border border-blue-100 bg-blue-50 px-4 py-3">
                <LoaderCircle size={18} className={detailRecord.status === '执行中' ? 'mt-0.5 animate-spin text-blue-500' : 'mt-0.5 text-blue-500'} />
                <div><b className="text-sm text-gray-800">任务正在异步处理</b><p className="mt-1 text-xs text-gray-500">请返回同步记录并点击刷新，查看最新执行状态</p></div>
              </div>
            )}
            <dl className="grid grid-cols-[100px_1fr] gap-y-4 text-sm">
              <dt className="text-gray-500">任务ID</dt><dd className="text-gray-800">{detailRecord.id}</dd>
              <dt className="text-gray-500">同步渠道</dt><dd><ChannelBadge channelId={detailRecord.channel} /></dd>
              <dt className="text-gray-500">同步内容</dt><dd className="text-gray-800">{detailRecord.content}</dd>
              <dt className="text-gray-500">门店范围</dt><dd className="text-gray-800">{detailRecord.storeCount} 家门店</dd>
              <dt className="text-gray-500">执行状态</dt><dd className={isAsyncRunning ? 'text-blue-500' : detailRecord.status === '执行失败' ? 'text-red-500' : 'text-[#00A85A]'}>{detailRecord.status}</dd>
              <dt className="text-gray-500">创建时间</dt><dd className="text-gray-800">{detailRecord.createdAt}</dd>
            </dl>
          </div>
          <div className="flex justify-end border-t border-gray-100 px-6 py-4"><button onClick={() => setDetailRecord(null)} className="h-9 bg-[#00C06B] px-6 text-sm font-medium text-white">关闭</button></div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full min-w-0 overflow-hidden bg-white">
      {activeTool ? renderForm() : renderHome()}
      {renderStoreModal()}
      {renderConfirmModal()}
      {renderCreationModal()}
      {renderTaskDetailModal()}
    </div>
  );
};
