import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleX,
  Clock3,
  Ellipsis,
  HelpCircle,
  Link2,
  Loader2,
  Search,
  Send,
  Settings2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useProducts } from '../../context';
import {
  getEffectiveChannelGroups,
  getOmnichannelChannel,
  getOmnichannelConfig,
} from '../../omnichannel';
import type { Product } from '../../types';

export type WorkbenchTargetMenu =
  | 'product_list'
  | 'channel_product_library'
  | 'product_sync'
  | 'product_mapping'
  | 'product_template'
  | 'product_logs'
  | 'general_settings';

export type WorkbenchNavigationOptions = {
  groupId?: string;
  publishTab?: 'publish' | 'records';
  createType?: 'standard' | 'combo';
};

interface Props {
  onNavigate: (target: WorkbenchTargetMenu, options?: WorkbenchNavigationOptions) => void;
}

type TaskGroupId =
  | 'incomplete'
  | 'channel-confirm'
  | 'publish-failed'
  | 'assigned'
  | 'approving'
  | 'mapping';

type DemoState = 'success' | 'loading' | 'empty' | 'error' | 'permission';

type WorkTask = {
  id: string;
  group: TaskGroupId;
  productId: string;
  productName: string;
  productCode: string;
  image: string;
  issue: string;
  issueDetail: string;
  channels: string;
  stores: string;
  priority: '高' | '中' | '低';
  deadline: string;
  owner: string;
  status: string;
  source: string;
  created: string;
  target: WorkbenchTargetMenu;
};

const taskGroups: Array<{
  label: string;
  items: Array<{ id: TaskGroupId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }>;
}> = [
  {
    label: '需我处理',
    items: [
      { id: 'incomplete', label: '待完善', icon: CircleAlert },
      { id: 'channel-confirm', label: '待渠道确认', icon: HelpCircle },
      { id: 'publish-failed', label: '发布失败', icon: CircleX },
    ],
  },
  {
    label: '等待他人',
    items: [
      { id: 'assigned', label: '已指派', icon: UsersRound },
      { id: 'approving', label: '审批中', icon: Clock3 },
    ],
  },
  {
    label: '风险治理',
    items: [
      { id: 'mapping', label: '映射异常', icon: Link2 },
    ],
  },
];

const buildTask = (
  product: Product,
  index: number,
  group: TaskGroupId,
  issue: string,
  channels: string,
  priority: WorkTask['priority'],
  deadline: string,
  owner: string,
  status: string,
  target: WorkbenchTargetMenu,
): WorkTask => ({
  id: `TK20260801${String(index + 1).padStart(4, '0')}`,
  group,
  productId: product.id,
  productName: product.name,
  productCode: product.skuCode || product.id,
  image: product.image,
  issue,
  issueDetail: issue,
  channels,
  stores: index % 3 === 0 ? '128 家门店' : index % 3 === 1 ? '42 家门店' : '18 家门店',
  priority,
  deadline,
  owner,
  status,
  source: group === 'publish-failed'
    ? `发布批次 PB20260801${String(index + 20).padStart(4, '0')}`
    : group === 'mapping'
      ? `映射校验 MP20260801${String(index + 8).padStart(4, '0')}`
      : `资料校验 CK20260801${String(index + 16).padStart(4, '0')}`,
  created: index < 3 ? '08-01 09:42' : '07-31 17:28',
  target,
});

const createTasks = (products: Product[], channelLabel: string): WorkTask[] => {
  if (products.length === 0) return [];
  const productAt = (index: number) => products[index % products.length];
  return [
    buildTask(productAt(0), 0, 'incomplete', '商品资料存在待完善项', channelLabel, '高', '今天 18:00', '张晓明', '待完善', 'product_list'),
    buildTask(productAt(1), 1, 'incomplete', '渠道发布前校验未通过', '美团外卖', '高', '已逾期 2 小时', '李强', '待完善', 'product_list'),
    buildTask(productAt(2), 2, 'incomplete', '部分规格资料需要补充', '美团外卖、抖音在线点', '中', '明天 12:00', '王芳', '待完善', 'product_list'),
    buildTask(productAt(3), 3, 'incomplete', '展示资料需要完善', '抖音在线点', '中', '明天 18:00', '刘洋', '待完善', 'product_list'),
    buildTask(productAt(4), 4, 'incomplete', '渠道资料完整性不足', channelLabel, '低', '后天 18:00', '张晓明', '待完善', 'product_list'),
    buildTask(productAt(5), 5, 'channel-confirm', '主档结构变更等待渠道确认', channelLabel, '中', '08-05 18:00', '王芳', '待确认', 'channel_product_library'),
    buildTask(productAt(6), 6, 'publish-failed', '发布任务执行失败，需要处理失败范围', '美团外卖', '高', '已逾期 1 天', '刘洋', '发布失败', 'product_sync'),
    buildTask(productAt(7), 7, 'mapping', '平台 SKU 映射关系存在冲突', '美团外卖', '高', '今天 20:00', '张晓明', '映射冲突', 'product_mapping'),
    buildTask(productAt(8), 8, 'mapping', '门店渠道商品尚未建立平台映射', channelLabel, '中', '08-04 12:00', '王芳', '未映射', 'product_mapping'),
    buildTask(productAt(9), 9, 'assigned', '商品资料任务已转交渠道负责人', channelLabel, '低', '08-06 18:00', '赵敏', '已指派', 'channel_product_library'),
    buildTask(productAt(10), 10, 'approving', '结构变更正在等待审批结论', '全部企迈管理渠道', '高', '今天 16:00', '商品负责人', '审批中', 'product_logs'),
  ];
};

const Modal: React.FC<{
  title: string;
  width?: number;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, width = 560, onClose, footer, children }) => (
  <div
    className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1D2129]/50 p-6"
    onMouseDown={event => event.target === event.currentTarget && onClose()}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="flex max-h-[calc(100vh-48px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
      style={{ width }}
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E8E8E8] px-5">
        <h2 className="text-[16px] font-bold text-[#1D2129]">{title}</h2>
        <button type="button" onClick={onClose} className="text-[#86909C] hover:text-[#1D2129]" aria-label={`关闭${title}`}>
          <X size={19} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-5 no-scrollbar">{children}</div>
      <footer className="flex h-16 shrink-0 items-center justify-end gap-3 border-t border-[#E8E8E8] px-5">{footer}</footer>
    </section>
  </div>
);

const EmptyState: React.FC<{
  state: Exclude<DemoState, 'success' | 'loading'>;
  onReset: () => void;
}> = ({ state, onReset }) => {
  const copy = {
    empty: [Search, '没有找到符合条件的任务', '调整筛选条件，或清空筛选后查看全部待办。', '清空筛选'],
    error: [CircleX, '任务加载失败', '已保留当前筛选条件，请重新加载任务。', '重新加载'],
    permission: [UsersRound, '暂无此范围的查看权限', '当前账号无法查看该品牌、渠道或门店范围内的商品任务。', '切换范围'],
  }[state];
  const Icon = copy[0];
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F4F7] text-[#86909C]"><Icon size={23} /></span>
      <h3 className="text-[15px] font-bold text-[#1D2129]">{copy[1]}</h3>
      <p className="mt-1 text-[13px] text-[#86909C]">{copy[2]}</p>
      <button type="button" onClick={onReset} className="mt-4 h-9 rounded-md border border-[#D9DDE2] px-4 text-[13px] text-[#4E5969] hover:border-[#00B460] hover:text-[#008F4C]">{copy[3]}</button>
    </div>
  );
};

export const WebProductWorkbench: React.FC<Props> = ({ onNavigate }) => {
  const { products, brandConfigs, activeBrandId } = useProducts();
  const config = useMemo(
    () => getOmnichannelConfig(brandConfigs[activeBrandId] || brandConfigs.b_1),
    [activeBrandId, brandConfigs],
  );
  const channelGroups = useMemo(() => getEffectiveChannelGroups(config), [config]);
  const channelLabel = channelGroups[0]?.channels
    .slice(0, 2)
    .map(channelId => getOmnichannelChannel(channelId).shortName)
    .join('、') || '企迈管理渠道';
  const initialTasks = useMemo(() => createTasks(products, channelLabel), [channelLabel, products]);
  const [tasks, setTasks] = useState<WorkTask[]>(initialTasks);
  const [activeGroup, setActiveGroup] = useState<TaskGroupId>('incomplete');
  const [search, setSearch] = useState('');
  const [taskType, setTaskType] = useState('全部类型');
  const [channel, setChannel] = useState('全部渠道');
  const [owner, setOwner] = useState('全部负责人');
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerTask, setDrawerTask] = useState<WorkTask | null>(null);
  const [modal, setModal] = useState<'scope' | 'transfer' | 'ignore' | 'batch' | null>(null);
  const [demoState, setDemoState] = useState<DemoState>('success');
  const [stateMenuOpen, setStateMenuOpen] = useState(false);
  const [batchCollapsed, setBatchCollapsed] = useState(false);
  const [toast, setToast] = useState('');

  const taskCounts = useMemo(() => {
    const counts = {} as Record<TaskGroupId, number>;
    taskGroups.forEach(group => group.items.forEach(item => { counts[item.id] = tasks.filter(task => task.group === item.id).length; }));
    return counts;
  }, [tasks]);

  const visibleTasks = useMemo(() => tasks.filter(item => (
    item.group === activeGroup
    && (!search || `${item.productName}${item.productCode}${item.issue}${item.id}`.toLowerCase().includes(search.toLowerCase()))
    && (taskType === '全部类型'
      || (taskType === '资料完善' && item.group === 'incomplete')
      || (taskType === '发布异常' && item.group === 'publish-failed')
      || (taskType === '治理风险' && item.group === 'mapping'))
    && (channel === '全部渠道' || item.channels.includes(channel))
    && (owner === '全部负责人' || item.owner === owner)
  )), [activeGroup, channel, owner, search, taskType, tasks]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const switchGroup = (groupId: TaskGroupId) => {
    setActiveGroup(groupId);
    setSelected([]);
    setDrawerTask(null);
    setDemoState('success');
  };

  const openGroupTask = (groupId: TaskGroupId) => {
    switchGroup(groupId);
    const firstTask = tasks.find(task => task.group === groupId);
    if (firstTask) {
      setDrawerTask(firstTask);
      return;
    }
    notify('当前没有需要处理的任务');
  };

  const resetFilters = () => {
    setSearch('');
    setTaskType('全部类型');
    setChannel('全部渠道');
    setOwner('全部负责人');
    setDemoState('success');
  };

  const actionIds = selected.length > 0 ? selected : drawerTask ? [drawerTask.id] : [];
  const transferTasks = (newOwner: string) => {
    setTasks(current => current.map(item => actionIds.includes(item.id) ? { ...item, owner: newOwner, group: 'assigned', status: '已指派' } : item));
    setSelected([]);
    setDrawerTask(null);
    setModal(null);
    notify(`${actionIds.length} 项任务已转交给 ${newOwner}`);
  };

  const ignoreTasks = () => {
    setTasks(current => current.filter(item => !actionIds.includes(item.id)));
    setSelected([]);
    setDrawerTask(null);
    setModal(null);
    notify(`已忽略 ${actionIds.length} 项本次待办，处理记录已保留`);
  };

  const batchTasks = () => {
    const completed = selected.slice(0, Math.max(1, selected.length - 1));
    setTasks(current => current.filter(item => !completed.includes(item.id)));
    setSelected(current => current.filter(id => !completed.includes(id)));
    setDrawerTask(null);
    setModal(null);
    notify(`${completed.length} 项已处理，剩余任务保留在当前列表`);
  };

  const allVisibleSelected = visibleTasks.length > 0 && visibleTasks.every(item => selected.includes(item.id));
  const activeTaskLabel = taskGroups.flatMap(group => group.items).find(item => item.id === activeGroup)?.label || '待完善';
  const actionableGroups: Array<{ id: TaskGroupId; label: string; action: string }> = [
    { id: 'incomplete', label: '商品资料待完善', action: '去完善' },
    { id: 'channel-confirm', label: '渠道资料待确认', action: '去确认' },
    { id: 'publish-failed', label: '渠道发布失败', action: '去处理' },
    { id: 'mapping', label: '平台商品映射异常', action: '去映射' },
  ];
  const overviewStats = [
    { label: '商品主档', value: products.length, unit: '个', note: `${taskCounts.incomplete || 0} 个待完善`, tone: 'default' },
    { label: '渠道商品', value: products.length + channelGroups.length * 3, unit: '个', note: `${channelGroups.length} 个商品库`, tone: 'default' },
    { label: '待发布变更', value: (taskCounts['channel-confirm'] || 0) + 5, unit: '项', note: `涉及 ${channelGroups.length} 个商品库`, tone: 'warning' },
    { label: '发布异常', value: taskCounts['publish-failed'] || 0, unit: '项', note: '需优先处理', tone: 'danger' },
    { label: '未建立映射', value: (taskCounts.mapping || 0) + 5, unit: '个', note: '三方渠道商品', tone: 'warning' },
  ] as const;
  const recentActivities = tasks.slice(0, 4).map((task, index) => ({
    text: index === 0
      ? `${task.owner} 开始处理「${task.productName}」`
      : `${task.productName} · ${task.status}`,
    meta: `${task.created} · ${task.channels}`,
    tone: task.priority === '高' ? 'danger' : index === 2 ? 'warning' : 'default',
  }));

  return (
    <main className="relative min-w-0 flex-1 overflow-hidden bg-[#F5F6F8]">
      <div className="h-full overflow-y-auto p-5 no-scrollbar">
        <div className="mx-auto max-w-[1580px]">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[19px] font-bold leading-7 text-[#1D2129]">商品工作台</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-[#86909C]">
                <span>当前身份</span><strong className="font-medium text-[#4E5969]">品牌商品管理员</strong>
                <span className="text-[#C9CDD4]">·</span><span>{config.collaborationMode === 'unified' ? '统一管理' : '分渠道协作'}</span>
                <span className="text-[#C9CDD4]">·</span><span>{channelGroups.length} 个渠道商品库</span>
                <span className="text-[#C9CDD4]">·</span><span>数据截至今天 09:00</span>
                <button type="button" onClick={() => notify('工作台数据已刷新')} className="font-medium text-[#008F4C]">刷新</button>
                <button type="button" onClick={() => setModal('scope')} className="ml-1 inline-flex items-center gap-1 font-medium text-[#008F4C]">切换范围 <ArrowRightLeft size={13} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E6EB] bg-white text-[#4E5969]" aria-label="工作台演示状态" onClick={() => setStateMenuOpen(open => !open)}><Ellipsis size={17} /></button>
                {stateMenuOpen && (
                  <div className="absolute right-0 top-9 z-40 w-40 overflow-hidden rounded-lg border border-[#E5E6EB] bg-white py-1 shadow-xl">
                    <div className="border-b border-[#F0F0F0] px-3 py-2 text-[12px] font-medium text-[#86909C]">页面状态演示</div>
                    {([['success', '正常数据'], ['loading', '加载中'], ['empty', '筛选无结果'], ['error', '加载失败'], ['permission', '权限不足']] as Array<[DemoState, string]>).map(([value, label]) => <button key={value} type="button" className="w-full px-3 py-2 text-left text-[13px] text-[#4E5969] hover:bg-[#F7F8FA]" onClick={() => { setDemoState(value); setStateMenuOpen(false); }}>{label}</button>)}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => onNavigate('product_list', { createType: 'standard' })} className="h-8 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white hover:bg-[#009F55]">＋ 新建商品主档</button>
            </div>
          </div>

          <section className="mt-4 grid grid-cols-5 overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
            {overviewStats.map((stat, index) => (
              <button key={stat.label} type="button" onClick={() => index === 3 ? openGroupTask('publish-failed') : index === 4 ? openGroupTask('mapping') : undefined} className={`min-w-0 px-5 py-3.5 text-left ${index > 0 ? 'border-l border-[#F0F1F2]' : ''}`}>
                <div className="text-[12px] text-[#86909C]">{stat.label}</div>
                <div className="mt-1 flex items-end gap-1"><strong className={`text-[23px] leading-7 ${stat.tone === 'danger' ? 'text-[#CB2634]' : stat.tone === 'warning' ? 'text-[#D46B08]' : 'text-[#1D2129]'}`}>{stat.value}</strong><span className="pb-0.5 text-[12px] text-[#86909C]">{stat.unit}</span></div>
                <div className="mt-1 truncate text-[11px] text-[#A9AEB8]">{stat.note}</div>
              </button>
            ))}
          </section>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_380px] items-start gap-4">
            <div className="min-w-0 space-y-4">
              <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
                <header className="flex h-12 items-center justify-between border-b border-[#F0F1F2] px-4">
                  <div className="flex items-baseline gap-2"><h2 className="text-[14px] font-bold text-[#1D2129]">待处理事项</h2><span className="text-[12px] text-[#86909C]">{actionableGroups.length} 类 · 共 {actionableGroups.reduce((sum, item) => sum + (taskCounts[item.id] || 0), 0)} 项</span></div>
                  <button type="button" onClick={() => onNavigate('product_logs')} className="text-[12px] font-medium text-[#008F4C]">变更记录 ›</button>
                </header>
                <div>
                  {actionableGroups.map((summary, index) => {
                    const count = taskCounts[summary.id] || 0;
                    const sample = tasks.find(task => task.group === summary.id);
                    const danger = ['publish-failed', 'mapping'].includes(summary.id);
                    return (
                      <button key={summary.id} type="button" onClick={() => openGroupTask(summary.id)} className={`grid w-full grid-cols-[12px_minmax(0,1fr)_72px_76px] items-center gap-3 border-b border-[#F0F1F2] px-4 py-3 text-left last:border-b-0 hover:bg-[#FAFBFC] ${activeGroup === summary.id ? 'bg-[#F6FCF9]' : ''}`}>
                        <span className={`h-2 w-2 rounded-full ${danger ? 'bg-[#F53F3F]' : count > 0 ? 'bg-[#FF9A2E]' : 'bg-[#C9CDD4]'}`} />
                        <span className="min-w-0"><strong className="block text-[13px] font-semibold text-[#1D2129]">{summary.label}</strong><small className="mt-1 block truncate text-[12px] text-[#86909C]">{sample?.issue || '当前没有需要处理的事项'}{sample ? ` · ${sample.channels}` : ''}</small></span>
                        <span className="text-right"><strong className={`block text-[18px] leading-5 ${danger && count ? 'text-[#CB2634]' : count ? 'text-[#D46B08]' : 'text-[#1D2129]'}`}>{count}</strong><small className="text-[11px] text-[#A9AEB8]">项任务</small></span>
                        <span className="h-8 rounded-md border border-[#E5E6EB] bg-white px-2 text-center text-[12px] leading-8 text-[#1D2129]">{summary.action}</span>
                      </button>
                    );
                  })}
                </div>
                <footer className="flex h-10 items-center gap-3 bg-[#FAFBFC] px-4 text-[12px] text-[#86909C]">
                  <span>等待他人</span>
                  <button type="button" onClick={() => openGroupTask('assigned')} className="text-[#4E5969]">已指派 {taskCounts.assigned || 0}</button>
                  <span className="text-[#C9CDD4]">·</span>
                  <button type="button" onClick={() => openGroupTask('approving')} className="text-[#4E5969]">审批中 {taskCounts.approving || 0}</button>
                </footer>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
                <header className="flex h-12 items-center justify-between border-b border-[#F0F1F2] px-4"><h2 className="text-[14px] font-bold text-[#1D2129]">渠道商品库运行情况</h2><button type="button" onClick={() => onNavigate('general_settings')} className="text-[12px] font-medium text-[#008F4C]">管理策略 ›</button></header>
                <div>{channelGroups.map((group, index) => <button key={group.id} type="button" onClick={() => onNavigate('channel_product_library', { groupId: group.id })} className="block w-full border-b border-[#F0F1F2] px-4 py-3 text-left last:border-b-0 hover:bg-[#FAFBFC]"><span className="flex items-center justify-between"><strong className="text-[13px] text-[#1D2129]">{group.name}</strong><small className="text-[#86909C]">{Math.max(1, products.length - index)} 个商品</small></span><span className="mt-2 flex flex-wrap gap-1">{group.channels.slice(0, 3).map(id => <small key={id} className="rounded bg-[#F2F3F5] px-1.5 py-0.5 text-[10px] text-[#4E5969]">{getOmnichannelChannel(id).shortName}</small>)}</span><small className="mt-2 block text-[#86909C]">{Math.max(0, taskCounts['channel-confirm'] - index)} 项待发布</small></button>)}</div>
              </section>
              <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
                <header className="flex h-12 items-center border-b border-[#F0F1F2] px-4"><h2 className="text-[14px] font-bold text-[#1D2129]">最近动态</h2></header>
                <div>{recentActivities.map((activity, index) => <div key={`${activity.text}-${index}`} className="flex gap-3 border-b border-[#F0F1F2] px-4 py-3 last:border-b-0"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${activity.tone === 'danger' ? 'bg-[#F53F3F]' : activity.tone === 'warning' ? 'bg-[#FF9A2E]' : 'bg-[#C9CDD4]'}`} /><span className="min-w-0"><span className="block text-[12px] leading-5 text-[#1D2129]">{activity.text}</span><small className="mt-0.5 block truncate text-[11px] text-[#A9AEB8]">{activity.meta}</small></span></div>)}</div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {selected.length > 0 && demoState === 'success' && (batchCollapsed ? (
        <button type="button" onClick={() => setBatchCollapsed(false)} className="absolute bottom-5 left-1/2 z-30 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-[#D7EDE1] bg-white px-5 text-[13px] font-medium text-[#008F4C] shadow-[0_10px_28px_rgba(17,24,39,.14)]" aria-label="展开批量操作">
          已选 {selected.length} 项，展开批量操作 <ChevronDown size={16} className="rotate-180" />
        </button>
      ) : (
        <div className="absolute bottom-5 left-1/2 z-30 flex min-h-[64px] w-[min(920px,calc(100%-280px))] -translate-x-1/2 items-center rounded-lg border border-[#E5E6EB] bg-white px-4 shadow-[0_10px_28px_rgba(17,24,39,.14)]">
          <button type="button" onClick={() => setBatchCollapsed(true)} className="mr-3 flex h-9 w-9 items-center justify-center rounded-md bg-[#F2F4F7] text-[#4E5969]" aria-label="收起批量操作"><ChevronDown size={17} /></button>
          <div className="min-w-0"><strong className="text-[14px] text-[#1D2129]">已选 {selected.length} 项</strong><span className="ml-3 text-[13px] text-[#86909C]">涉及 {Math.min(selected.length, 3)} 个商品 / 4 个渠道 / 128 家门店</span><button type="button" onClick={() => setSelected([])} className="ml-3 text-[13px] text-[#008F4C]">清空</button></div>
          <div className="ml-auto flex gap-2"><button type="button" onClick={() => setModal('transfer')} className="h-9 rounded-md border border-[#D9DDE2] px-4 text-[13px]">转交</button><button type="button" onClick={() => setModal('ignore')} className="h-9 rounded-md border border-[#D9DDE2] px-4 text-[13px]">忽略本次</button><button type="button" onClick={() => setModal('batch')} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white">批量处理</button></div>
        </div>
      ))}

      {demoState === 'loading' && <button type="button" onClick={() => setDemoState('success')} className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-md border border-[#E5E6EB] bg-white px-4 py-2 text-[13px] shadow"><Loader2 size={16} className="animate-spin" />取消加载演示</button>}

      {drawerTask && (
        <>
          <button type="button" aria-label="关闭待办详情" className="fixed inset-0 top-[64px] z-[60] bg-[#1D2129]/10" onClick={() => setDrawerTask(null)} />
          <aside className="fixed bottom-0 right-0 top-[64px] z-[70] flex w-[420px] flex-col border-l border-[#E5E6EB] bg-white shadow-[-14px_0_36px_rgba(17,24,39,.12)]" aria-label="待办详情">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E6EB] px-5"><h2 className="text-[18px] font-bold text-[#1D2129]">待办详情</h2><button type="button" onClick={() => setDrawerTask(null)} className="text-[#4E5969]" aria-label="关闭待办详情"><X size={20} /></button></header>
            <div className="min-h-0 flex-1 overflow-auto p-5 no-scrollbar">
              <div className="flex items-center rounded-lg bg-[#F7F8FA] p-4"><img src={drawerTask.image} alt="" className="mr-3 h-14 w-14 rounded-md object-cover" /><span><strong className="block text-[16px] text-[#1D2129]">{drawerTask.productName}</strong><small className="mt-1 block text-[#86909C]">{drawerTask.productCode}</small></span></div>
              <dl className="mt-5 grid grid-cols-2 gap-x-5 border-t border-[#E5E6EB] text-[13px]">
                {[
                  ['任务类型', activeTaskLabel], ['优先级', drawerTask.priority], ['问题描述', drawerTask.issueDetail], ['影响范围', `${drawerTask.channels} · ${drawerTask.stores}`], ['来源任务', drawerTask.source], ['创建时间', drawerTask.created], ['负责人', drawerTask.owner], ['状态', drawerTask.status],
                ].map(([label, value], index) => <div key={label} className={`${[2, 3, 4].includes(index) ? 'col-span-2' : ''} border-b border-[#E5E6EB] py-3`}><dt className="mb-1 text-[12px] text-[#98A2B3]">{label}</dt><dd className={label === '来源任务' ? 'font-medium text-[#1677FF]' : 'text-[#344054]'}>{value}</dd></div>)}
              </dl>
              <div className="mt-5 rounded-lg border border-[#E5E6EB] p-4"><h3 className="mb-4 text-[16px] font-bold text-[#1D2129]">处理记录</h3>{[[drawerTask.created, '任务已创建', '系统完成业务校验并生成待办'], [drawerTask.created, `分配给 ${drawerTask.owner}`, '负责人来源与任务路由规则待接入'], ['08-01 10:20', '提醒已发送', '系统提醒当前负责人处理']].map(([time, title, description], index) => <div key={`${time}-${title}`} className="relative flex gap-3 pb-5 last:pb-0"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${index === 0 ? 'bg-[#00B460]' : 'bg-[#C9CDD4]'}`} /><span className="min-w-0"><strong className="text-[13px] text-[#4E5969]">{time}　{title}</strong><small className="mt-1 block text-[#98A2B3]">{description}</small></span></div>)}</div>
            </div>
            <footer className="flex h-16 shrink-0 items-center justify-end gap-3 border-t border-[#E5E6EB] px-5"><button type="button" onClick={() => setModal('transfer')} className="h-9 rounded-md border border-[#D9DDE2] px-4 text-[13px]">转交任务</button><button type="button" onClick={() => { setDrawerTask(null); onNavigate(drawerTask.target); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white">去处理</button></footer>
          </aside>
        </>
      )}

      {modal === 'scope' && <ScopeModal collaborationMode={config.collaborationMode} onClose={() => setModal(null)} onSave={(channelScope, storeScope) => { setModal(null); setSelected([]); notify(`工作范围已切换为${channelScope} · ${storeScope}`); }} />}
      {modal === 'transfer' && <TransferModal count={actionIds.length} currentOwner={actionIds.length > 1 ? '多人' : drawerTask?.owner || '当前负责人'} onClose={() => setModal(null)} onSubmit={transferTasks} />}
      {modal === 'ignore' && <IgnoreModal count={actionIds.length} onClose={() => setModal(null)} onSubmit={ignoreTasks} />}
      {modal === 'batch' && <BatchModal count={selected.length} onClose={() => setModal(null)} onSubmit={batchTasks} />}
      {toast && <div className="fixed left-1/2 top-20 z-[110] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#1D2129] px-4 py-3 text-[13px] text-white shadow-xl"><CheckCircle2 size={17} className="text-[#45D483]" />{toast}</div>}
    </main>
  );
};

const ScopeModal: React.FC<{
  collaborationMode: 'unified' | 'channel_division';
  onClose: () => void;
  onSave: (channel: string, store: string) => void;
}> = ({ collaborationMode, onClose, onSave }) => {
  const [channel, setChannel] = useState('全部渠道');
  const [storeScope, setStoreScope] = useState('全部门店');
  return (
    <Modal title="切换工作范围" width={640} onClose={onClose} footer={<><button type="button" className="h-9 rounded-md border border-[#D9DDE2] px-4 text-[13px]" onClick={onClose}>取消</button><button type="button" className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white" onClick={() => onSave(channel, storeScope)}>应用范围</button></>}>
      <div className="grid grid-cols-2 gap-4 text-[13px]"><label><span className="mb-2 block text-[#4E5969]">品牌</span><input value="企迈餐饮" disabled readOnly className="h-9 w-full rounded-md border bg-[#F7F8FA] px-3" /></label><label><span className="mb-2 block text-[#4E5969]">协作方式</span><input value={collaborationMode === 'unified' ? '统一商品维护' : '按渠道职责协作'} disabled readOnly className="h-9 w-full rounded-md border bg-[#F7F8FA] px-3" /></label><label className="col-span-2"><span className="mb-2 block text-[#4E5969]">渠道范围</span><select value={channel} onChange={event => setChannel(event.target.value)} className="h-9 w-full rounded-md border px-3"><option>全部渠道</option><option>全部企迈管理渠道</option><option>美团外卖</option><option>抖音在线点</option></select></label><fieldset className="col-span-2"><legend className="mb-2 text-[#4E5969]">门店范围</legend><div className="flex gap-5">{['全部门店', '华东区域', '指定门店'].map(value => <label key={value} className="flex items-center gap-2"><input type="radio" name="workbench-store" checked={storeScope === value} onChange={() => setStoreScope(value)} />{value}</label>)}</div></fieldset></div>
      <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#F7F8FA] p-3 text-[13px] text-[#667085]"><CircleAlert size={17} className="mt-0.5 shrink-0" />切换范围会清空当前勾选，但保留搜索条件和页面状态设置。</div>
    </Modal>
  );
};

const TransferModal: React.FC<{ count: number; currentOwner: string; onClose: () => void; onSubmit: (owner: string) => void }> = ({ count, currentOwner, onClose, onSubmit }) => {
  const [owner, setOwner] = useState('赵敏');
  return <Modal title="转交任务" onClose={onClose} footer={<><button type="button" className="h-9 rounded-md border border-[#D9DDE2] px-4 text-[13px]" onClick={onClose}>取消</button><button type="button" className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white" onClick={() => onSubmit(owner)}>确认转交</button></>}><div className="mb-5 flex gap-3 rounded-lg bg-[#F2FFF8] p-4"><ArrowRightLeft size={18} className="mt-0.5 text-[#008F4C]" /><span><strong className="block text-[#1D2129]">将 {count || 1} 项任务转交给其他负责人</strong><small className="mt-1 block text-[#667085]">任务会进入“已指派”，转交动作写入处理记录。</small></span></div><div className="space-y-4 text-[13px]"><label className="block"><span className="mb-2 block">当前负责人</span><input value={currentOwner} disabled readOnly className="h-9 w-full rounded-md border bg-[#F7F8FA] px-3" /></label><label className="block"><span className="mb-2 block">新负责人 <b className="text-[#F53F3F]">*</b></span><select value={owner} onChange={event => setOwner(event.target.value)} className="h-9 w-full rounded-md border px-3">{['赵敏', '王芳', '李强', '刘洋'].map(name => <option key={name}>{name}</option>)}</select></label><label className="block"><span className="mb-2 block">处理截止时间</span><input type="datetime-local" defaultValue="2026-08-02T18:00" className="h-9 w-full rounded-md border px-3" /></label><label className="block"><span className="mb-2 block">转交说明</span><textarea maxLength={200} className="h-20 w-full resize-none rounded-md border p-3" placeholder="向新负责人说明需要关注的信息" /></label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked />通过站内通知提醒新负责人</label></div></Modal>;
};

const IgnoreModal: React.FC<{ count: number; onClose: () => void; onSubmit: () => void }> = ({ count, onClose, onSubmit }) => (
  <Modal title="忽略本次待办" onClose={onClose} footer={<><button type="button" className="h-9 rounded-md border border-[#D9DDE2] px-4 text-[13px]" onClick={onClose}>取消</button><button type="button" className="h-9 rounded-md bg-[#CB2634] px-4 text-[13px] font-medium text-white" onClick={onSubmit}>确认忽略</button></>}><div className="mb-5 flex gap-3 rounded-lg border border-[#FFD6D6] bg-[#FFF7F7] p-4"><AlertTriangle size={19} className="mt-0.5 text-[#CB2634]" /><span><strong className="block text-[#1D2129]">将忽略 {count || 1} 项待办</strong><small className="mt-1 block text-[#667085]">只忽略本次提醒，不修改商品资料，也不取消关联发布任务。</small></span></div><div className="space-y-4 text-[13px]"><label className="block"><span className="mb-2 block">忽略原因 <b className="text-[#F53F3F]">*</b></span><select className="h-9 w-full rounded-md border px-3"><option>本次发布暂不处理</option><option>商品即将归档</option><option>已在线下协调处理</option><option>其他</option></select></label><label className="block"><span className="mb-2 block">忽略有效期</span><select className="h-9 w-full rounded-md border px-3"><option>仅本次</option><option>7 天</option><option>30 天</option></select></label><label className="block"><span className="mb-2 block">补充说明</span><textarea maxLength={200} className="h-20 w-full resize-none rounded-md border p-3" /></label></div></Modal>
);

const BatchModal: React.FC<{ count: number; onClose: () => void; onSubmit: () => void }> = ({ count, onClose, onSubmit }) => (
  <Modal title="批量处理待办" width={680} onClose={onClose} footer={<><button type="button" className="h-9 rounded-md border border-[#D9DDE2] px-4 text-[13px]" onClick={onClose}>取消</button><button type="button" className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white" onClick={onSubmit}>开始批量处理</button></>}><div className="grid grid-cols-4 gap-3">{[[count || 1, '项待办'], [Math.min(count || 1, 3), '个商品'], [4, '个渠道'], [128, '家门店']].map(([value, label]) => <div key={label} className="rounded-lg border border-[#E5E6EB] p-3 text-center"><strong className="block text-[20px] text-[#1D2129]">{value}</strong><span className="text-[12px] text-[#86909C]">{label}</span></div>)}</div><div className="mt-5 space-y-3"><div className="flex gap-3 rounded-lg bg-[#F2FFF8] p-4"><CheckCircle2 size={18} className="mt-0.5 text-[#00B460]" /><span><strong className="block text-[13px] text-[#1D2129]">可直接进入现有商品或渠道页面处理</strong><small className="mt-1 block text-[#667085]">沿用真实字段、类目与校验，不在工作台内复制商品表单。</small></span></div><div className="flex gap-3 rounded-lg bg-[#FFF7E8] p-4"><CircleAlert size={18} className="mt-0.5 text-[#D46B08]" /><span><strong className="block text-[13px] text-[#1D2129]">部分任务需要逐项处理</strong><small className="mt-1 block text-[#667085]">无法批量处理的任务将保留在当前列表，并给出失败原因。</small></span></div></div><label className="mt-5 flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked />先处理可批量执行项，其余任务保留</label></Modal>
);
