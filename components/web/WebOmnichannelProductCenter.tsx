import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileStack,
  GitBranch,
  Image as ImageIcon,
  Layers3,
  Link2,
  Package,
  Play,
  RefreshCw,
  Send,
  Settings2,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Tags,
  UsersRound,
} from 'lucide-react';

type TabId = 'overview' | 'strategy' | 'goods' | 'template' | 'publish';
type CollaborationMode = 'unified' | 'channel';
type ManagementMode = 'qimai' | 'platform';
type ScenarioId = 'unified' | 'channel' | 'hybrid' | 'platform';
type ChannelKey = 'pos' | 'mini' | 'meituan' | 'taobao' | 'jingdong' | 'douyin';
type ThirdChannelKey = 'meituan' | 'taobao' | 'jingdong' | 'douyin';
type FieldType = 'select' | 'image' | 'switch' | 'radio' | 'checkbox';
type FieldValue = string | boolean | string[];

interface ChannelMeta {
  key: ChannelKey;
  name: string;
  shortName: string;
  kind: 'private' | 'third';
  tone: string;
}

interface ChannelFieldDefinition {
  code: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
}

interface ScenarioPreset {
  id: ScenarioId;
  name: string;
  summary: string;
  collaborationMode: CollaborationMode;
  managementModes: Record<ThirdChannelKey, ManagementMode>;
  groupAssignments: Partial<Record<ThirdChannelKey, string>>;
}

interface PublishTaskRow {
  id: string;
  channel: ChannelKey;
  task: string;
  target: string;
  dependency: string;
  result: string;
  resultTone: 'gray' | 'green' | 'amber';
}

const PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=320&h=320&fit=crop';

const CHANNELS: ChannelMeta[] = [
  { key: 'pos', name: 'POS', shortName: 'POS', kind: 'private', tone: 'bg-slate-100 text-slate-700' },
  { key: 'mini', name: '品牌小程序', shortName: '小程序', kind: 'private', tone: 'bg-emerald-50 text-emerald-700' },
  { key: 'meituan', name: '美团外卖', shortName: '美团', kind: 'third', tone: 'bg-amber-50 text-amber-700' },
  { key: 'taobao', name: '淘宝闪购', shortName: '淘宝', kind: 'third', tone: 'bg-orange-50 text-orange-700' },
  { key: 'jingdong', name: '京东外卖', shortName: '京东', kind: 'third', tone: 'bg-red-50 text-red-700' },
  { key: 'douyin', name: '抖音在线点', shortName: '抖音', kind: 'third', tone: 'bg-cyan-50 text-cyan-700' },
];

const THIRD_CHANNELS = CHANNELS.filter((channel): channel is ChannelMeta & { key: ThirdChannelKey } => channel.kind === 'third');

const CHANNEL_GROUPS = [
  { id: 'delivery', name: '外卖运营组', owner: '外卖商品团队' },
  { id: 'online', name: '在线点运营组', owner: '在线业务团队' },
];

const SCENARIOS: ScenarioPreset[] = [
  {
    id: 'unified',
    name: '企迈统一管理',
    summary: '所有渠道使用商品主档，三方渠道由企迈统一发布。',
    collaborationMode: 'unified',
    managementModes: { meituan: 'qimai', taobao: 'qimai', jingdong: 'qimai', douyin: 'qimai' },
    groupAssignments: {},
  },
  {
    id: 'channel',
    name: '按渠道职责管理',
    summary: '私域使用主档，三方渠道按外卖和在线点团队维护渠道商品。',
    collaborationMode: 'channel',
    managementModes: { meituan: 'qimai', taobao: 'qimai', jingdong: 'qimai', douyin: 'qimai' },
    groupAssignments: { meituan: 'delivery', taobao: 'delivery', jingdong: 'delivery', douyin: 'online' },
  },
  {
    id: 'hybrid',
    name: '部分渠道企迈管理',
    summary: '在线点由企迈管理，外卖平台自行维护并与企迈商品映射。',
    collaborationMode: 'channel',
    managementModes: { meituan: 'platform', taobao: 'platform', jingdong: 'platform', douyin: 'qimai' },
    groupAssignments: { douyin: 'online' },
  },
  {
    id: 'platform',
    name: '三方平台自行维护',
    summary: '商品主档只服务私域及企迈侧镜像，三方资料在平台维护。',
    collaborationMode: 'unified',
    managementModes: { meituan: 'platform', taobao: 'platform', jingdong: 'platform', douyin: 'platform' },
    groupAssignments: {},
  },
];

const getDefaultTemplateChannels = (scenarioId: ScenarioId): ChannelKey[] => {
  if (scenarioId === 'hybrid') return ['pos', 'mini', 'meituan', 'taobao'];
  if (scenarioId === 'channel') return ['meituan', 'taobao', 'jingdong'];
  return ['pos', 'mini', 'meituan', 'taobao', 'douyin'];
};

const pageParams = new URLSearchParams(window.location.search);
const requestedScenario = pageParams.get('scenario') as ScenarioId | null;
const requestedTab = pageParams.get('omniTab') as TabId | null;
const INITIAL_SCENARIO = SCENARIOS.find(item => item.id === requestedScenario) || SCENARIOS.find(item => item.id === 'hybrid')!;
const INITIAL_TAB: TabId = (['overview', 'strategy', 'goods', 'template', 'publish'] as TabId[]).includes(requestedTab as TabId)
  ? requestedTab as TabId
  : 'overview';

const CHANNEL_FIELD_DEFINITIONS: Partial<Record<ThirdChannelKey, ChannelFieldDefinition[]>> = {
  meituan: [
    { code: 'mt.category', label: '商品类目', type: 'select', required: true, options: ['饮品 / 奶茶', '饮品 / 果茶', '小吃 / 甜品'] },
    { code: 'mt.image', label: '商品图片', type: 'image' },
    { code: 'mt.attributeMutex', label: '属性互斥', type: 'switch', hint: '开启后，加料属性按美团互斥规则发布' },
    { code: 'mt.comboOnly', label: '仅在套餐内售卖', type: 'radio', options: ['是', '否'] },
    { code: 'mt.noSingleDelivery', label: '单点不送', type: 'radio', options: ['是', '否'] },
    { code: 'mt.signature', label: '商品特色', type: 'checkbox', options: ['招牌菜'] },
  ],
  taobao: [
    { code: 'tb.category', label: '商品类目', type: 'select', required: true, options: ['茶饮 / 奶茶', '茶饮 / 果茶', '即时零售 / 甜品'] },
    { code: 'tb.image', label: '商品图片', type: 'image' },
    { code: 'tb.comboOnly', label: '仅在套餐内售卖', type: 'radio', options: ['是', '否'] },
    { code: 'tb.noSingleDelivery', label: '单点不送', type: 'radio', options: ['是', '否'] },
    { code: 'tb.features', label: '商品特色', type: 'checkbox', options: ['招牌菜', '配菜', '新菜', '辣'] },
  ],
};

const INITIAL_FIELD_VALUES: Record<string, FieldValue> = {
  'mt.category': '饮品 / 奶茶',
  'mt.image': PRODUCT_IMAGE,
  'mt.attributeMutex': true,
  'mt.comboOnly': '否',
  'mt.noSingleDelivery': '否',
  'mt.signature': ['招牌菜'],
  'tb.category': '茶饮 / 奶茶',
  'tb.image': PRODUCT_IMAGE,
  'tb.comboOnly': '否',
  'tb.noSingleDelivery': '否',
  'tb.features': ['招牌菜', '新菜'],
};

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: '场景总览', icon: <Boxes size={16} /> },
  { id: 'strategy', label: '管理策略', icon: <Settings2 size={16} /> },
  { id: 'goods', label: '商品资料', icon: <Database size={16} /> },
  { id: 'template', label: '商品模板', icon: <FileStack size={16} /> },
  { id: 'publish', label: '发布演示', icon: <Send size={16} /> },
];

const getChannel = (key: ChannelKey) => CHANNELS.find(channel => channel.key === key)!;

const Badge: React.FC<{ children: React.ReactNode; tone?: 'green' | 'blue' | 'amber' | 'gray' | 'red' }> = ({ children, tone = 'gray' }) => {
  const toneClass = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    gray: 'border-slate-200 bg-slate-50 text-slate-600',
    red: 'border-red-200 bg-red-50 text-red-700',
  }[tone];
  return <span className={`inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>{children}</span>;
};

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    aria-pressed={checked}
    onClick={onChange}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#1FC069]' : 'bg-slate-300'}`}
  >
    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${checked ? 'left-6' : 'left-1'}`} />
  </button>
);

const EmptyLine: React.FC = () => <span className="text-slate-300">—</span>;

export const WebOmnichannelProductCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(INITIAL_TAB);
  const [scenarioId, setScenarioId] = useState<ScenarioId>(INITIAL_SCENARIO.id);
  const [collaborationMode, setCollaborationMode] = useState<CollaborationMode>(INITIAL_SCENARIO.collaborationMode);
  const [managementModes, setManagementModes] = useState<Record<ThirdChannelKey, ManagementMode>>({ ...INITIAL_SCENARIO.managementModes });
  const [groupAssignments, setGroupAssignments] = useState<Partial<Record<ThirdChannelKey, string>>>({ ...INITIAL_SCENARIO.groupAssignments });
  const [selectedDataChannel, setSelectedDataChannel] = useState<ChannelKey>('meituan');
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>(INITIAL_FIELD_VALUES);
  const [templateChannels, setTemplateChannels] = useState<ChannelKey[]>(getDefaultTemplateChannels(INITIAL_SCENARIO.id));
  const [templateScope, setTemplateScope] = useState('华东区域 · 126 家门店');
  const [publishChannels, setPublishChannels] = useState<ChannelKey[]>(CHANNELS.map(channel => channel.key));
  const [publishSource, setPublishSource] = useState<'direct' | 'template'>('template');
  const [publishStatus, setPublishStatus] = useState<'draft' | 'running' | 'done'>('draft');

  const sourceForChannel = (key: ChannelKey) => {
    const channel = getChannel(key);
    if (channel.kind === 'private') return { id: 'master', label: '商品主档', type: 'master' as const };
    const mode = managementModes[key as ThirdChannelKey];
    if (mode === 'platform' || collaborationMode === 'unified') return { id: 'master', label: '商品主档', type: 'master' as const };
    const groupId = groupAssignments[key as ThirdChannelKey];
    const group = CHANNEL_GROUPS.find(item => item.id === groupId);
    return group
      ? { id: `catalog:${group.id}`, label: `渠道商品库 · ${group.name}`, type: 'catalog' as const }
      : { id: 'unassigned', label: '尚未配置渠道分组', type: 'missing' as const };
  };

  const maintenanceForChannel = (key: ChannelKey) => {
    const channel = getChannel(key);
    if (channel.kind === 'private') return '商品主档';
    if (managementModes[key as ThirdChannelKey] === 'platform') return '平台商家后台';
    return collaborationMode === 'unified' ? '商品主档' : sourceForChannel(key).label;
  };

  const publishBehaviorForChannel = (key: ChannelKey) => {
    const channel = getChannel(key);
    if (channel.kind === 'private') return '同步企迈侧渠道商品';
    return managementModes[key as ThirdChannelKey] === 'qimai'
      ? '企迈侧同步 + 平台发布 + 自动映射'
      : '企迈侧镜像 + 映射准备';
  };

  const activeScenario = SCENARIOS.find(item => item.id === scenarioId)!;
  const qimaiThirdCount = THIRD_CHANNELS.filter(channel => managementModes[channel.key] === 'qimai').length;
  const platformThirdCount = THIRD_CHANNELS.length - qimaiThirdCount;
  const activeCatalogIds = Array.from(new Set(
    THIRD_CHANNELS
      .filter(channel => managementModes[channel.key] === 'qimai' && collaborationMode === 'channel')
      .map(channel => groupAssignments[channel.key])
      .filter(Boolean)
  ));

  const applyScenario = (id: ScenarioId) => {
    const scenario = SCENARIOS.find(item => item.id === id)!;
    setScenarioId(id);
    setCollaborationMode(scenario.collaborationMode);
    setManagementModes({ ...scenario.managementModes });
    setGroupAssignments({ ...scenario.groupAssignments });
    setPublishChannels(CHANNELS.map(channel => channel.key));
    setPublishStatus('draft');
    setTemplateChannels(getDefaultTemplateChannels(id));
  };

  const updateManagementMode = (channel: ThirdChannelKey, mode: ManagementMode) => {
    setScenarioId('hybrid');
    setManagementModes(current => ({ ...current, [channel]: mode }));
    if (mode === 'qimai' && collaborationMode === 'channel' && !groupAssignments[channel]) {
      setGroupAssignments(current => ({ ...current, [channel]: channel === 'douyin' ? 'online' : 'delivery' }));
    }
    setPublishStatus('draft');
  };

  const updateCollaborationMode = (mode: CollaborationMode) => {
    setScenarioId('hybrid');
    setCollaborationMode(mode);
    if (mode === 'channel') {
      setGroupAssignments(current => {
        const next = { ...current };
        THIRD_CHANNELS.forEach(channel => {
          if (managementModes[channel.key] === 'qimai' && !next[channel.key]) {
            next[channel.key] = channel.key === 'douyin' ? 'online' : 'delivery';
          }
        });
        return next;
      });
    }
    setPublishStatus('draft');
  };

  const toggleFieldOption = (code: string, option: string) => {
    setFieldValues(current => {
      const selected = Array.isArray(current[code]) ? current[code] as string[] : [];
      return {
        ...current,
        [code]: selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option],
      };
    });
  };

  const toggleTemplateChannel = (key: ChannelKey) => {
    setTemplateChannels(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  };

  const templateSources = useMemo(() => {
    return Array.from(new Map(templateChannels.map(key => {
      const source = sourceForChannel(key);
      return [source.id, source];
    })).values());
  }, [templateChannels, collaborationMode, managementModes, groupAssignments]);

  const templateHasConflict = templateSources.length !== 1 || templateSources[0]?.type === 'missing';

  const togglePublishChannel = (key: ChannelKey) => {
    setPublishChannels(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
    setPublishStatus('draft');
  };

  const publishTasks = useMemo<PublishTaskRow[]>(() => {
    return publishChannels.flatMap((key) => {
      const channel = getChannel(key);
      const source = sourceForChannel(key).label;
      if (channel.kind === 'private') {
        return [{
          id: `${key}-qimai`, channel: key, task: '企迈侧同步任务', target: '门店渠道商品', dependency: source,
          result: '生成并更新门店商品', resultTone: 'green' as const,
        }];
      }
      const mode = managementModes[key as ThirdChannelKey];
      if (mode === 'platform') {
        return [
          {
            id: `${key}-mirror`, channel: key, task: '企迈侧镜像任务', target: '门店渠道商品', dependency: source,
            result: '生成企迈侧商品', resultTone: 'green' as const,
          },
          {
            id: `${key}-mapping`, channel: key, task: '映射准备任务', target: '平台服务', dependency: '企迈侧商品成功',
            result: '等待标识匹配', resultTone: 'amber' as const,
          },
        ];
      }
      return [
        {
          id: `${key}-qimai`, channel: key, task: '企迈侧同步任务', target: '门店渠道商品', dependency: source,
          result: '生成企迈侧商品', resultTone: 'green' as const,
        },
        {
          id: `${key}-platform`, channel: key, task: '三方平台发布任务', target: channel.name, dependency: '企迈侧商品成功',
          result: '发布成功并自动映射', resultTone: 'green' as const,
        },
      ];
    });
  }, [publishChannels, collaborationMode, managementModes, groupAssignments]);

  const simulatePublish = () => {
    if (publishChannels.length === 0 || templateHasConflict && publishSource === 'template') return;
    setPublishStatus('running');
    window.setTimeout(() => setPublishStatus('done'), 900);
  };

  const currentDataChannel = getChannel(selectedDataChannel);
  const currentDataMode = currentDataChannel.kind === 'third' ? managementModes[selectedDataChannel as ThirdChannelKey] : 'qimai';
  const currentFieldDefinitions = currentDataChannel.kind === 'third'
    ? CHANNEL_FIELD_DEFINITIONS[selectedDataChannel as ThirdChannelKey] || []
    : [];

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 border border-slate-200 bg-white">
        {[
          { label: '商品资料协作', value: collaborationMode === 'unified' ? '统一维护' : '按渠道职责', meta: activeCatalogIds.length ? `${activeCatalogIds.length} 个渠道商品库` : '不启用渠道商品库' },
          { label: '企迈管理三方渠道', value: `${qimaiThirdCount} 个`, meta: qimaiThirdCount ? '同步企迈侧并发布平台' : '当前未启用' },
          { label: '平台自行维护渠道', value: `${platformThirdCount} 个`, meta: platformThirdCount ? '仅同步镜像与映射' : '当前未启用' },
          { label: '本次发布任务', value: `${publishTasks.length} 个`, meta: `覆盖 ${publishChannels.length} 个渠道` },
        ].map((item, index) => (
          <div key={item.label} className={`px-5 py-4 ${index < 3 ? 'border-r border-slate-200' : ''}`}>
            <div className="text-[12px] text-slate-500">{item.label}</div>
            <div className="mt-1 text-[22px] font-bold text-slate-900">{item.value}</div>
            <div className="mt-1 text-[12px] text-slate-400">{item.meta}</div>
          </div>
        ))}
      </div>

      <section className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h3 className="font-bold text-slate-900">渠道管理路径</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">当前场景：{activeScenario.name}</p>
          </div>
          <button onClick={() => setActiveTab('strategy')} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#159A55] hover:text-[#0D7D43]">
            调整配置 <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-[12px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">售卖渠道</th>
                <th className="px-4 py-3 font-semibold">资料管理方式</th>
                <th className="px-4 py-3 font-semibold">企迈商品来源</th>
                <th className="px-4 py-3 font-semibold">渠道差异维护</th>
                <th className="px-4 py-3 font-semibold">发布动作</th>
                <th className="px-4 py-3 font-semibold">映射结果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CHANNELS.map(channel => {
                const mode = channel.kind === 'private' ? 'qimai' : managementModes[channel.key as ThirdChannelKey];
                const source = sourceForChannel(channel.key);
                return (
                  <tr key={channel.key} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 items-center justify-center text-[11px] font-bold ${channel.tone}`}>{channel.shortName.slice(0, 2)}</span>
                        <span className="font-semibold text-slate-800">{channel.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><Badge tone={mode === 'qimai' ? 'green' : 'amber'}>{mode === 'qimai' ? '企迈管理' : '平台自行维护'}</Badge></td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">{source.label}</td>
                    <td className="px-4 py-3.5 text-slate-600">{maintenanceForChannel(channel.key)}</td>
                    <td className="px-4 py-3.5 text-slate-600">{publishBehaviorForChannel(channel.key)}</td>
                    <td className="px-4 py-3.5">
                      {channel.kind === 'private' ? <Badge>无需映射</Badge> : mode === 'qimai' ? <Badge tone="green">发布后自动映射</Badge> : <Badge tone="amber">标识匹配 / 人工映射</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-slate-200 bg-white px-5 py-4">
        <div className="mb-4 flex items-center gap-2">
          <GitBranch size={17} className="text-[#1FC069]" />
          <h3 className="font-bold text-slate-900">当前发布链路</h3>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-3">
          {[
            { title: '商品资料', text: collaborationMode === 'unified' ? '商品主档统一维护' : '主档与渠道商品分工维护', icon: <Database size={18} /> },
            { title: '商品模板', text: '按适用渠道自动判断唯一来源', icon: <FileStack size={18} /> },
            { title: '发布批次', text: `${publishChannels.length} 个渠道拆分 ${publishTasks.length} 个任务`, icon: <Layers3 size={18} /> },
            { title: '门店与平台', text: '企迈侧商品、平台商品与映射结果', icon: <Store size={18} /> },
          ].map((item, index) => (
            <React.Fragment key={item.title}>
              <div className="border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 font-semibold text-slate-800"><span className="text-[#1FC069]">{item.icon}</span>{item.title}</div>
                <div className="mt-2 text-[12px] leading-5 text-slate-500">{item.text}</div>
              </div>
              {index < 3 && <div className="flex items-center text-slate-300"><ArrowRight size={18} /></div>}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );

  const renderStrategy = () => (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-4">
      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-bold text-slate-900">品牌商品协作方式</h3>
          <div className="mt-3 inline-flex border border-slate-200 bg-slate-50 p-1">
            {[
              { id: 'unified' as const, label: '统一维护', icon: <Database size={15} /> },
              { id: 'channel' as const, label: '按渠道职责', icon: <UsersRound size={15} /> },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => updateCollaborationMode(item.id)}
                className={`flex items-center gap-2 px-4 py-2 text-[12px] font-semibold ${collaborationMode === item.id ? 'bg-white text-[#159A55] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">三方渠道管理策略</h3>
            <Badge tone="blue">私域渠道默认由企迈管理</Badge>
          </div>
          <div className="overflow-hidden border border-slate-200">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">三方渠道</th>
                  <th className="px-4 py-3 font-semibold">商品资料管理</th>
                  <th className="px-4 py-3 font-semibold">协作分组</th>
                  <th className="px-4 py-3 font-semibold">系统计算结果</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {THIRD_CHANNELS.map(channel => {
                  const mode = managementModes[channel.key];
                  const source = sourceForChannel(channel.key);
                  return (
                    <tr key={channel.key}>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{channel.name}</td>
                      <td className="px-4 py-3.5">
                        <select
                          value={mode}
                          onChange={(event) => updateManagementMode(channel.key, event.target.value as ManagementMode)}
                          className="h-8 min-w-[130px] border border-slate-200 bg-white px-2 text-[12px] text-slate-700 outline-none focus:border-[#1FC069]"
                        >
                          <option value="qimai">企迈管理</option>
                          <option value="platform">平台自行维护</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        {collaborationMode === 'channel' && mode === 'qimai' ? (
                          <div className="relative inline-flex items-center">
                            <select
                              value={groupAssignments[channel.key] || ''}
                              onChange={(event) => {
                                setScenarioId('hybrid');
                                setGroupAssignments(current => ({ ...current, [channel.key]: event.target.value }));
                              }}
                              className="h-8 min-w-[130px] appearance-none border border-slate-200 bg-white px-2 pr-7 text-[12px] text-slate-700 outline-none focus:border-[#1FC069]"
                            >
                              <option value="">请选择分组</option>
                              {CHANNEL_GROUPS.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                            </select>
                            <ChevronDown size={13} className="pointer-events-none absolute right-2 text-slate-400" />
                          </div>
                        ) : <EmptyLine />}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-700">{source.label}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">{mode === 'qimai' ? '企迈维护并发布' : '仅生成企迈侧商品'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-slate-900">场景方案</h3>
          <div className="mt-3 space-y-2">
            {SCENARIOS.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => applyScenario(scenario.id)}
                className={`w-full border px-3 py-3 text-left transition-colors ${scenarioId === scenario.id ? 'border-[#1FC069] bg-emerald-50/60' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-slate-800">{scenario.name}</span>
                  {scenarioId === scenario.id && <Check size={15} className="text-[#1FC069]" />}
                </div>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">{scenario.summary}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2"><UsersRound size={16} className="text-[#1FC069]" /><h3 className="font-bold text-slate-900">渠道协作分组</h3></div>
          <div className="mt-3 space-y-3">
            {collaborationMode === 'unified' ? (
              <div className="border border-dashed border-slate-200 px-3 py-4 text-center text-[12px] text-slate-400">统一维护模式不启用渠道商品库</div>
            ) : CHANNEL_GROUPS.map(group => {
              const members = THIRD_CHANNELS.filter(channel => managementModes[channel.key] === 'qimai' && groupAssignments[channel.key] === group.id);
              return (
                <div key={group.id} className="border border-slate-200 px-3 py-3">
                  <div className="flex items-center justify-between"><span className="text-[12px] font-semibold text-slate-800">{group.name}</span><Badge>{group.owner}</Badge></div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {members.length ? members.map(channel => <span key={channel.key} className="bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{channel.shortName}</span>) : <span className="text-[11px] text-slate-400">暂无渠道</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );

  const renderField = (field: ChannelFieldDefinition) => {
    const value = fieldValues[field.code];
    if (field.type === 'select') {
      return (
        <select value={String(value || '')} onChange={(event) => setFieldValues(current => ({ ...current, [field.code]: event.target.value }))} className="h-9 w-[280px] border border-slate-200 bg-white px-3 text-[12px] outline-none focus:border-[#1FC069]">
          {field.options?.map(option => <option key={option}>{option}</option>)}
        </select>
      );
    }
    if (field.type === 'image') {
      return (
        <div className="flex items-center gap-3">
          <img src={String(value || PRODUCT_IMAGE)} alt="渠道商品" className="h-16 w-16 border border-slate-200 object-cover" />
          <button className="flex items-center gap-1.5 border border-slate-200 px-3 py-2 text-[12px] text-slate-600 hover:border-[#1FC069] hover:text-[#159A55]"><ImageIcon size={14} />更换图片</button>
          <span className="text-[11px] text-slate-400">当前继承商品主图</span>
        </div>
      );
    }
    if (field.type === 'switch') {
      return <div className="flex items-center gap-3"><Toggle checked={Boolean(value)} onChange={() => setFieldValues(current => ({ ...current, [field.code]: !current[field.code] }))} /><span className="text-[11px] text-amber-600">{field.hint}</span></div>;
    }
    if (field.type === 'radio') {
      return (
        <div className="flex items-center gap-5">
          {field.options?.map(option => (
            <button key={option} onClick={() => setFieldValues(current => ({ ...current, [field.code]: option }))} className="flex items-center gap-2 text-[12px] text-slate-700">
              <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${value === option ? 'border-[#1FC069]' : 'border-slate-300'}`}>{value === option && <span className="h-2 w-2 rounded-full bg-[#1FC069]" />}</span>{option}
            </button>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-4">
        {field.options?.map(option => {
          const checked = Array.isArray(value) && value.includes(option);
          return (
            <button key={option} onClick={() => toggleFieldOption(field.code, option)} className="flex items-center gap-2 text-[12px] text-slate-700">
              <span className={`flex h-4 w-4 items-center justify-center border ${checked ? 'border-[#1FC069] bg-[#1FC069] text-white' : 'border-slate-300'}`}>{checked && <Check size={11} />}</span>{option}
            </button>
          );
        })}
      </div>
    );
  };

  const renderGoods = () => (
    <div className="grid grid-cols-[250px_minmax(0,1fr)] gap-4">
      <aside className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3"><h3 className="font-bold text-slate-900">商品资料视图</h3></div>
        <div className="p-2">
          {CHANNELS.map(channel => {
            const source = sourceForChannel(channel.key);
            return (
              <button key={channel.key} onClick={() => setSelectedDataChannel(channel.key)} className={`mb-1 w-full px-3 py-3 text-left ${selectedDataChannel === channel.key ? 'bg-emerald-50 text-[#159A55]' : 'text-slate-600 hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2"><span className="text-[12px] font-semibold">{channel.name}</span>{selectedDataChannel === channel.key && <CircleDot size={14} />}</div>
                <div className="mt-1 truncate text-[11px] text-slate-400">{source.label}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-4">
        <section className="border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <div className="flex items-center gap-3">
              <img src={PRODUCT_IMAGE} alt="招牌珍珠奶茶" className="h-12 w-12 object-cover" />
              <div><h3 className="font-bold text-slate-900">招牌珍珠奶茶</h3><div className="mt-1 text-[11px] text-slate-400">企迈 SKU ID：QM-SKU-1001 · 标准商品 · ¥18.00</div></div>
            </div>
            <div className="text-right"><Badge tone={currentDataMode === 'qimai' ? 'green' : 'amber'}>{currentDataMode === 'qimai' ? '企迈管理' : '平台自行维护'}</Badge><div className="mt-1 text-[11px] text-slate-400">{currentDataChannel.name}</div></div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-slate-100 px-5 py-3 text-[12px]">
            <div><span className="text-slate-400">统一商品身份</span><div className="mt-1 font-semibold text-slate-700">QM-SKU-1001</div></div>
            <div className="pl-4"><span className="text-slate-400">企迈商品来源</span><div className="mt-1 font-semibold text-slate-700">{sourceForChannel(selectedDataChannel).label}</div></div>
            <div className="pl-4"><span className="text-slate-400">渠道差异维护</span><div className="mt-1 font-semibold text-slate-700">{maintenanceForChannel(selectedDataChannel)}</div></div>
            <div className="pl-4"><span className="text-slate-400">发布行为</span><div className="mt-1 font-semibold text-slate-700">{publishBehaviorForChannel(selectedDataChannel)}</div></div>
          </div>
        </section>

        {currentDataChannel.kind === 'private' ? (
          <section className="border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2"><Package size={17} className="text-[#1FC069]" /><h3 className="font-bold text-slate-900">商品主档资料</h3></div>
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 text-[12px]">
              {[
                ['商品名称', '招牌珍珠奶茶'], ['前台分类', '现制饮品'], ['基础售价', '¥18.00'], ['商品图片', '继承商品主图'],
              ].map(([label, value]) => <div key={label} className="border-b border-slate-100 pb-3"><div className="text-slate-400">{label}</div><div className="mt-1 font-medium text-slate-700">{value}</div></div>)}
            </div>
          </section>
        ) : currentDataMode === 'platform' ? (
          <section className="border border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-start gap-3">
              <ExternalLink size={20} className="mt-0.5 text-amber-600" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{currentDataChannel.name}商品资料在平台商家后台维护</h3>
                <div className="mt-3 grid grid-cols-3 border border-amber-200 bg-white text-[12px]">
                  <div className="border-r border-amber-100 px-4 py-3"><div className="text-slate-400">企迈侧准备</div><div className="mt-1 font-semibold text-slate-700">从商品主档生成门店渠道商品</div></div>
                  <div className="border-r border-amber-100 px-4 py-3"><div className="text-slate-400">平台侧建品</div><div className="mt-1 font-semibold text-slate-700">填写 QM-SKU-1001 或商家商品标识</div></div>
                  <div className="px-4 py-3"><div className="text-slate-400">后续能力</div><div className="mt-1 font-semibold text-slate-700">映射后统一上下架、库存与接单识别</div></div>
                </div>
                <button onClick={() => setActiveTab('publish')} className="mt-4 flex items-center gap-2 bg-[#1FC069] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#16A95C]"><Play size={14} />生成企迈侧商品</button>
              </div>
            </div>
          </section>
        ) : (
          <section className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div><h3 className="font-bold text-slate-900">{currentDataChannel.name}售卖属性</h3><div className="mt-0.5 text-[11px] text-slate-400">维护位置：{maintenanceForChannel(selectedDataChannel)}</div></div>
              <Badge tone="blue">能力版本 {selectedDataChannel === 'meituan' ? 'mt-menu-v0' : selectedDataChannel === 'taobao' ? 'tb-menu-v0' : '字段待接入'}</Badge>
            </div>
            {currentFieldDefinitions.length ? (
              <div className="divide-y divide-slate-100 px-5">
                {currentFieldDefinitions.map(field => (
                  <div key={field.code} className="grid grid-cols-[150px_minmax(0,1fr)] items-start py-4">
                    <div className="pt-2 text-right text-[12px] font-medium text-slate-600"><span className="mr-1 text-red-500">{field.required ? '*' : ''}</span>{field.label}：</div>
                    <div className="pl-5">{renderField(field)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-5 py-10 text-[12px] text-slate-500"><SlidersHorizontal size={20} className="text-slate-300" />该渠道详细属性尚未录入，当前发布仅使用商品主档公共资料。</div>
            )}
          </section>
        )}
      </div>
    </div>
  );

  const renderTemplate = () => (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4">
      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">华东区域标准菜单</h3><Badge tone={templateHasConflict ? 'red' : 'green'}>{templateHasConflict ? '来源冲突' : '可发布'}</Badge></div>
          <div className="mt-1 text-[11px] text-slate-400">模板用于维护区域门店差异，商品来源根据适用渠道自动判断</div>
        </div>
        <div className="space-y-5 p-5">
          <div>
            <label className="text-[12px] font-semibold text-slate-700">适用渠道</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {CHANNELS.map(channel => {
                const checked = templateChannels.includes(channel.key);
                return (
                  <button key={channel.key} onClick={() => toggleTemplateChannel(channel.key)} className={`flex items-center justify-between border px-3 py-3 text-[12px] ${checked ? 'border-[#1FC069] bg-emerald-50 text-[#159A55]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    <span className="font-semibold">{channel.name}</span><span className={`flex h-4 w-4 items-center justify-center border ${checked ? 'border-[#1FC069] bg-[#1FC069] text-white' : 'border-slate-300'}`}>{checked && <Check size={11} />}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`border px-4 py-3 ${templateHasConflict ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50/60'}`}>
            <div className="flex items-start gap-2.5">
              {templateHasConflict ? <AlertTriangle size={18} className="mt-0.5 text-red-500" /> : <CheckCircle2 size={18} className="mt-0.5 text-[#1FC069]" />}
              <div>
                <div className="text-[12px] font-bold text-slate-800">{templateHasConflict ? '所选渠道存在多个商品来源，需要拆分模板' : `商品来源：${templateSources[0]?.label || '请选择渠道'}`}</div>
                <div className="mt-1 text-[11px] leading-5 text-slate-500">{templateHasConflict ? templateSources.map(source => source.label).join('、') : '系统自动判断，用户无需选择商品来源。'}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-[12px] text-slate-600">适用门店范围
              <select value={templateScope} onChange={(event) => setTemplateScope(event.target.value)} className="mt-2 h-9 w-full border border-slate-200 bg-white px-3 text-[12px] text-slate-700 outline-none focus:border-[#1FC069]">
                <option>华东区域 · 126 家门店</option><option>新品试点 · 8 家门店</option><option>全部门店 · 1,280 家门店</option>
              </select>
            </label>
            <label className="text-[12px] text-slate-600">前台分类覆盖
              <select className="mt-2 h-9 w-full border border-slate-200 bg-white px-3 text-[12px] text-slate-700 outline-none focus:border-[#1FC069]"><option>区域热销</option><option>奶茶系列</option><option>新品推荐</option></select>
            </label>
          </div>

          <div className="overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3"><span className="text-[12px] font-semibold text-slate-700">模板商品</span><span className="text-[11px] text-slate-400">1 个商品 · 覆盖价格和前台分类</span></div>
            <div className="grid grid-cols-[56px_1fr_120px_140px] items-center gap-3 px-4 py-4 text-[12px]">
              <img src={PRODUCT_IMAGE} alt="招牌珍珠奶茶" className="h-12 w-12 object-cover" />
              <div><div className="font-semibold text-slate-800">招牌珍珠奶茶</div><div className="mt-1 text-[11px] text-slate-400">QM-SKU-1001</div></div>
              <div><div className="text-slate-400">模板售价</div><div className="mt-1 font-semibold text-slate-700">¥17.00</div></div>
              <div><div className="text-slate-400">渠道扩展覆盖</div><div className="mt-1 font-semibold text-slate-700">{templateChannels.filter(key => getChannel(key).kind === 'third' && managementModes[key as ThirdChannelKey] === 'qimai').length} 个渠道</div></div>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2"><Layers3 size={17} className="text-[#1FC069]" /><h3 className="font-bold text-slate-900">来源判定明细</h3></div>
          <div className="mt-3 space-y-2">
            {templateChannels.length ? templateChannels.map(key => {
              const channel = getChannel(key);
              const source = sourceForChannel(key);
              return <div key={key} className="flex items-center justify-between border-b border-slate-100 py-2 text-[11px]"><span className="font-medium text-slate-600">{channel.name}</span><span className={source.type === 'missing' ? 'text-red-500' : 'text-slate-500'}>{source.label}</span></div>;
            }) : <div className="py-5 text-center text-[12px] text-slate-400">请选择适用渠道</div>}
          </div>
        </section>
        <section className="border border-slate-200 bg-white p-4">
          <div className="text-[12px] font-bold text-slate-800">本次模板范围</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-50 px-3 py-3"><div className="text-[20px] font-bold text-slate-800">{templateChannels.length}</div><div className="mt-1 text-[11px] text-slate-400">适用渠道</div></div>
            <div className="bg-slate-50 px-3 py-3"><div className="text-[20px] font-bold text-slate-800">{templateScope.includes('1,280') ? '1,280' : templateScope.includes('126') ? '126' : '8'}</div><div className="mt-1 text-[11px] text-slate-400">目标门店</div></div>
          </div>
          <button disabled={templateHasConflict || templateChannels.length === 0} onClick={() => { setPublishChannels(templateChannels); setPublishSource('template'); setActiveTab('publish'); setPublishStatus('draft'); }} className="mt-4 flex w-full items-center justify-center gap-2 bg-[#1FC069] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#16A95C] disabled:cursor-not-allowed disabled:bg-slate-300"><Send size={14} />使用模板发布</button>
        </section>
      </aside>
    </div>
  );

  const renderPublish = () => (
    <div className="space-y-4">
      <section className="border border-slate-200 bg-white">
        <div className="grid grid-cols-[220px_1fr_200px_auto] items-end gap-5 px-5 py-4">
          <label className="text-[12px] text-slate-600">发布来源
            <select value={publishSource} onChange={(event) => { setPublishSource(event.target.value as 'direct' | 'template'); setPublishStatus('draft'); }} className="mt-2 h-9 w-full border border-slate-200 bg-white px-3 text-[12px] text-slate-700 outline-none focus:border-[#1FC069]"><option value="template">华东区域标准菜单</option><option value="direct">商品来源直接发布</option></select>
          </label>
          <div>
            <div className="text-[12px] text-slate-600">目标渠道</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {CHANNELS.map(channel => {
                const checked = publishChannels.includes(channel.key);
                return <button key={channel.key} onClick={() => togglePublishChannel(channel.key)} className={`border px-3 py-2 text-[11px] font-semibold ${checked ? 'border-[#1FC069] bg-emerald-50 text-[#159A55]' : 'border-slate-200 text-slate-500'}`}>{channel.shortName}</button>;
              })}
            </div>
          </div>
          <div className="border-l border-slate-200 pl-5"><div className="text-[11px] text-slate-400">预计执行</div><div className="mt-1 text-[24px] font-bold text-slate-900">{publishTasks.length}<span className="ml-1 text-[12px] font-normal text-slate-500">个任务</span></div></div>
          <button onClick={simulatePublish} disabled={publishStatus === 'running' || publishChannels.length === 0 || (publishSource === 'template' && templateHasConflict)} className="flex h-9 items-center gap-2 bg-[#1FC069] px-4 text-[12px] font-semibold text-white hover:bg-[#16A95C] disabled:cursor-not-allowed disabled:bg-slate-300">{publishStatus === 'running' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}{publishStatus === 'draft' ? '提交发布' : publishStatus === 'running' ? '执行中' : '重新演示'}</button>
        </div>
        {publishSource === 'template' && templateHasConflict && <div className="border-t border-red-100 bg-red-50 px-5 py-2.5 text-[12px] text-red-600">当前模板包含多个商品来源，请返回模板拆分后再发布。</div>}
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div><h3 className="font-bold text-slate-900">发布批次预览</h3><div className="mt-0.5 text-[11px] text-slate-400">批次 FCG-20260714-001 · 商品 1 个 · 华东区域 126 家门店</div></div>
          <div className="flex items-center gap-2">{publishStatus === 'draft' ? <Badge>待提交</Badge> : publishStatus === 'running' ? <Badge tone="blue">执行中</Badge> : <Badge tone="green">执行完成</Badge>}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-[12px]">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3 font-semibold">售卖渠道</th><th className="px-4 py-3 font-semibold">执行任务</th><th className="px-4 py-3 font-semibold">执行目标</th><th className="px-4 py-3 font-semibold">前置依赖 / 数据来源</th><th className="px-4 py-3 font-semibold">演示结果</th><th className="px-4 py-3 font-semibold">状态</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {publishTasks.map(task => {
                const channel = getChannel(task.channel);
                const statusLabel = publishStatus === 'draft' ? '等待提交' : publishStatus === 'running' ? (task.task.includes('三方') ? '等待前置' : '执行中') : task.result;
                return (
                  <tr key={task.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{channel.name}</td>
                    <td className="px-4 py-3.5 text-slate-700">{task.task}</td>
                    <td className="px-4 py-3.5 text-slate-600">{task.target}</td>
                    <td className="px-4 py-3.5 text-slate-500">{task.dependency}</td>
                    <td className="px-4 py-3.5 text-slate-600">{task.result}</td>
                    <td className="px-4 py-3.5">{publishStatus === 'done' ? <Badge tone={task.resultTone === 'amber' ? 'amber' : 'green'}>{statusLabel}</Badge> : publishStatus === 'running' ? <Badge tone="blue">{statusLabel}</Badge> : <Badge>{statusLabel}</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-3 border border-slate-200 bg-white">
        <div className="border-r border-slate-200 px-5 py-4"><div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800"><ClipboardCheck size={16} className="text-[#1FC069]" />数据快照</div><div className="mt-2 text-[11px] leading-5 text-slate-500">固化商品来源、模板版本、门店范围及美团/淘宝能力版本。</div></div>
        <div className="border-r border-slate-200 px-5 py-4"><div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800"><Link2 size={16} className="text-[#1FC069]" />映射治理</div><div className="mt-2 text-[11px] leading-5 text-slate-500">企迈发布自动映射；平台自行维护渠道进入标识匹配或人工映射。</div></div>
        <div className="px-5 py-4"><div className="flex items-center gap-2 text-[12px] font-semibold text-slate-800"><RefreshCw size={16} className="text-[#1FC069]" />失败恢复</div><div className="mt-2 text-[11px] leading-5 text-slate-500">按失败门店、渠道和 SKU 重试，继续使用原始发布快照。</div></div>
      </div>
    </div>
  );

  const content = {
    overview: renderOverview,
    strategy: renderStrategy,
    goods: renderGoods,
    template: renderTemplate,
    publish: renderPublish,
  }[activeTab]();

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] text-slate-400">商品管理 / 全渠道商品</div>
            <h1 className="mt-1 text-[20px] font-bold text-slate-900">全渠道商品管理</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right"><div className="text-[11px] text-slate-400">当前演示场景</div><div className="mt-0.5 text-[12px] font-semibold text-slate-700">{activeScenario.name}</div></div>
            <select value={scenarioId} onChange={(event) => applyScenario(event.target.value as ScenarioId)} className="h-9 min-w-[190px] border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#1FC069]">
              {SCENARIOS.map(scenario => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}
            </select>
          </div>
        </div>
        <nav className="mt-4 flex h-10 items-end gap-7">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex h-10 items-center gap-2 border-b-2 px-1 text-[12px] font-semibold ${activeTab === tab.id ? 'border-[#1FC069] text-[#159A55]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{tab.icon}{tab.label}</button>
          ))}
        </nav>
      </div>
      <div className="min-w-[1000px] flex-1 overflow-auto p-5 no-scrollbar">{content}</div>
    </main>
  );
};
