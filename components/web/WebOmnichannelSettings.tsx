import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ExternalLink,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useProducts } from '../../context';
import type {
  OmnichannelBrandConfig,
  OmnichannelChannelGroup,
  OmnichannelChannelId,
  QimaiChannelCapability,
  ThirdPartyChannelId,
} from '../../types';
import {
  ALL_OMNICHANNEL_CHANNELS,
  channelNeedsAuthorization,
  getChannelCatalogChannels,
  getOmnichannelChannel,
  getOmnichannelConfig,
  isThirdPartyChannelId,
  TAKEAWAY_STORE_BINDING_URL,
} from '../../omnichannel';

/*
 * 生产组件映射（迁移 goods-vue 时替换）：
 *   页面外壳 / 保存栏  -> 商品设置子页统一外壳
 *   渠道总表           -> QmListTable（本页无分页、无筛选，故不接 QmSearch）
 *   所属渠道商品库 列  -> el-select（size=small）
 *   影响确认弹窗       -> qmai-ui Dialog + 自定义 body
 *   未保存离开拦截     -> 路由 beforeRouteLeave + Dialog
 * 本文件为 React 原型，硬编码色值在生产实现中改为主题变量。
 */

type Props = {
  onBack: () => void;
};

type ImpactLevel = 'high' | 'medium' | 'info';

type ImpactItem = {
  level: ImpactLevel;
  title: string;
  detail: string;
};

type MigrationTask = {
  id: string;
  status: 'running' | 'completed';
  sourceMode: OmnichannelBrandConfig['collaborationMode'];
  targetMode: OmnichannelBrandConfig['collaborationMode'];
  progress: number;
  targetConfig: OmnichannelBrandConfig;
  primaryGroupName?: string;
  startedAt: string;
};

const LEVEL_META: Record<ImpactLevel, { label: string; chipBg: string; chipText: string }> = {
  high: { label: '高风险', chipBg: '#FFF1F0', chipText: '#CB2634' },
  medium: { label: '需留意', chipBg: '#FFF7E8', chipText: '#D46B08' },
  info: { label: '提示', chipBg: '#F2F3F5', chipText: '#4E5969' },
};

const CAPABILITY_LABELS: Array<[QimaiChannelCapability, string]> = [
  ['order_receiving', '企迈接单'],
  ['product_operations', '上下架/库存'],
];

const Radio: React.FC<{ active: boolean; disabled?: boolean }> = ({ active, disabled }) => (
  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
    disabled
      ? 'border-[#E5E6EB] bg-[#F2F3F5]'
      : active ? 'border-[#00B460]' : 'border-[#C9CDD4]'
  }`}>
    {active && !disabled && <span className="h-2 w-2 rounded-full bg-[#00B460]" />}
  </span>
);

const Checkbox: React.FC<{ checked: boolean; disabled?: boolean }> = ({ checked, disabled }) => (
  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
    checked
      ? 'border-[#00B460] bg-[#00B460] text-white'
      : disabled
        ? 'border-[#E5E6EB] bg-[#F2F3F5]'
        : 'border-[#C9CDD4] bg-white'
  }`}>
    {checked && <Check size={11} strokeWidth={3} />}
  </span>
);

const Tag: React.FC<{ tone?: 'neutral' | 'info' | 'warn'; children: React.ReactNode }> = ({ tone = 'neutral', children }) => {
  const tones = {
    neutral: 'bg-[#F2F3F5] text-[#4E5969]',
    info: 'bg-[#EEF6FF] text-[#2476C7]',
    warn: 'bg-[#FFF7E8] text-[#D46B08]',
  };
  return <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] leading-4 ${tones[tone]}`}>{children}</span>;
};

const newGroupId = () => `channel-group-${Date.now()}`;

const cloneConfig = (config: OmnichannelBrandConfig): OmnichannelBrandConfig => ({
  ...config,
  thirdPartyStrategies: { ...config.thirdPartyStrategies },
  channelConnections: Object.fromEntries(
    Object.entries(config.channelConnections).map(([id, connection]) => [id, { capabilities: [...connection.capabilities] }])
  ) as OmnichannelBrandConfig['channelConnections'],
  channelGroups: config.channelGroups.map(group => ({ ...group, channels: [...group.channels] })),
});

/** 通用确认弹窗，替换原生 window.confirm */
const ConfirmDialog: React.FC<{
  title: string;
  tone?: 'danger' | 'normal';
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}> = ({ title, tone = 'normal', confirmText, onConfirm, onCancel, children }) => (
  <div className="fixed inset-0 z-[320] flex items-center justify-center bg-[#1D2129]/55 px-6">
    <div className="w-[460px] overflow-hidden rounded-lg bg-white shadow-2xl">
      <div className="flex items-start gap-3 px-6 pb-4 pt-6">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          tone === 'danger' ? 'bg-[#FFF1F0] text-[#CB2634]' : 'bg-[#FFF7E8] text-[#D46B08]'
        }`}>
          <AlertTriangle size={17} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold text-[#1D2129]">{title}</h3>
          <div className="mt-2 text-[13px] leading-[22px] text-[#4E5969]">{children}</div>
        </div>
      </div>
      <div className="flex justify-end gap-2 bg-[#F7F8FA] px-6 py-4">
        <button type="button" onClick={onCancel} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969] hover:border-[#86909C]">
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`h-9 rounded-md px-4 text-[13px] font-bold text-white ${
            tone === 'danger' ? 'bg-[#CB2634] hover:bg-[#A81E2A]' : 'bg-[#1D2129] hover:bg-black'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
);

export const WebOmnichannelSettings: React.FC<Props> = ({ onBack }) => {
  const { activeBrandId, brandConfigs, products, updateBrandConfig } = useProducts();
  const currentBrandConfig = brandConfigs[activeBrandId];

  const [baseline, setBaseline] = useState<OmnichannelBrandConfig>(() => getOmnichannelConfig(currentBrandConfig));
  const [draft, setDraft] = useState<OmnichannelBrandConfig>(() => getOmnichannelConfig(currentBrandConfig));
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [sortGroups, setSortGroups] = useState<OmnichannelChannelGroup[]>([]);
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  // 主商品库是模式迁移时的独立选择，不能由商品库展示顺序隐式推导。
  const [primaryGroupId, setPrimaryGroupId] = useState('');
  const [migrationConfirmed, setMigrationConfirmed] = useState(false);
  const [migrationTask, setMigrationTask] = useState<MigrationTask | null>(null);

  const divided = draft.collaborationMode === 'channel_division';

  const catalogChannels = useMemo(() => getChannelCatalogChannels(draft), [draft]);
  const catalogChannelIds = useMemo(() => new Set(catalogChannels.map(channel => channel.id)), [catalogChannels]);

  const groupOfChannel = useMemo(() => {
    const map = new Map<OmnichannelChannelId, OmnichannelChannelGroup>();
    draft.channelGroups.forEach(group => {
      group.channels.forEach(channelId => map.set(channelId, group));
    });
    return map;
  }, [draft.channelGroups]);

  const unassignedChannels = useMemo(
    () => (divided ? catalogChannels.filter(channel => !groupOfChannel.has(channel.id)) : []),
    [catalogChannels, divided, groupOfChannel]
  );
  const unassignedIds = useMemo(() => new Set(unassignedChannels.map(channel => channel.id)), [unassignedChannels]);

  const dirty = useMemo(() => JSON.stringify(baseline) !== JSON.stringify(draft), [baseline, draft]);
  const collaborationModeChanged = baseline.collaborationMode !== draft.collaborationMode;
  const migrationRunning = migrationTask?.status === 'running';

  useEffect(() => {
    if (!migrationTask || migrationTask.status !== 'running') return;
    const timer = window.setTimeout(() => {
      const nextProgress = migrationTask.progress < 24
        ? 24
        : migrationTask.progress < 62
          ? 62
          : migrationTask.progress < 88
            ? 88
            : 100;
      if (nextProgress < 100) {
        setMigrationTask({ ...migrationTask, progress: nextProgress });
        return;
      }
      const next = cloneConfig(migrationTask.targetConfig);
      updateBrandConfig(activeBrandId, { ...currentBrandConfig, omnichannel: next });
      setBaseline(next);
      setDraft(next);
      setMigrationTask({ ...migrationTask, progress: 100, status: 'completed' });
      setSavedFlash(true);
      setShowValidation(false);
      window.setTimeout(() => setSavedFlash(false), 2400);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activeBrandId, currentBrandConfig, migrationTask, updateBrandConfig]);

  /** 保存前的影响清单：把这次改动会波及的下游结构显式列出来 */
  const impacts = useMemo<ImpactItem[]>(() => {
    if (!dirty) return [];
    const items: ImpactItem[] = [];

    if (baseline.collaborationMode !== draft.collaborationMode) {
      items.push(draft.collaborationMode === 'unified'
        ? {
            level: 'high',
            title: '协作方式改为「统一管理」',
            detail: '保存后将创建迁移任务：全部商品取并集，重复商品以选定的主商品库公共资料为准；原商品库和权限保存快照，不会直接删除。',
          }
        : {
            level: 'high',
            title: '协作方式改为「分渠道协作」',
            detail: '保存后将创建迁移任务：统一商品库中的全部商品复制到每个目标商品库，完成后再由各渠道团队批量移出不经营的商品。',
          });
    }

    if (baseline.channelProductCreationMode !== draft.channelProductCreationMode) {
      items.push({
        level: 'medium',
        title: draft.channelProductCreationMode === 'create_master_and_channel'
          ? '渠道商品库允许直接新建商品'
          : '渠道商品库仅允许选择已有主档',
        detail: draft.channelProductCreationMode === 'create_master_and_channel'
          ? '具备商品主档创建权限和当前商品库创建权限的人员，可一次填写主档资料与渠道商品资料并同时创建。'
          : '渠道商品库不再提供新建主档入口，渠道人员只能把已有商品主档加入当前商品库。',
      });
    }

    ALL_OMNICHANNEL_CHANNELS.forEach(channel => {
      if (!isThirdPartyChannelId(channel.id)) return;
      const before = baseline.thirdPartyStrategies[channel.id];
      const after = draft.thirdPartyStrategies[channel.id];
      if (before === after) return;
      if (after === 'platform') {
        const keepsQimaiOperations = draft.channelConnections[channel.id].capabilities.length > 0;
        const currentGroup = draft.channelGroups.find(group => group.channels.includes(channel.id));
        items.push({
          level: 'high',
          title: `${channel.name} 改为平台维护资料`,
          detail: keepsQimaiOperations
            ? `企迈不再维护或发布该平台的专属商品资料；仍从「${draft.collaborationMode === 'unified' ? '品牌默认商品库' : currentGroup?.name || '待分配商品库'}」下发企迈侧门店渠道商品，并通过商品映射继续接单或管理上下架、库存。`
            : '企迈不再维护或发布该平台的专属商品资料，当前也未启用企迈接单、上下架或库存能力；该渠道不再要求渠道商品库和门店绑定。',
        });
      } else {
        items.push({
          level: 'medium',
          title: `${channel.name} 纳入企迈管理`,
          detail: '企迈接单、商品发布与上下架库存将默认全部开启，并需要在门店绑定中心完成该渠道的门店授权。',
        });
      }
    });

    ALL_OMNICHANNEL_CHANNELS.forEach(channel => {
      if (!isThirdPartyChannelId(channel.id)) return;
      if (baseline.thirdPartyStrategies[channel.id] !== draft.thirdPartyStrategies[channel.id]) return;
      if (draft.thirdPartyStrategies[channel.id] !== 'platform') return;
      const before = [...baseline.channelConnections[channel.id].capabilities].sort().join(',');
      const after = [...draft.channelConnections[channel.id].capabilities].sort().join(',');
      if (before === after) return;
      const afterLabels = CAPABILITY_LABELS.filter(([id]) => draft.channelConnections[channel.id].capabilities.includes(id))
        .map(([, label]) => label);
      items.push({
        level: 'medium',
        title: `${channel.name} 的企迈参与能力变更`,
        detail: afterLabels.length
          ? `变更后企迈参与：${afterLabels.join('、')}；渠道继续使用渠道商品库下发门店商品，并需保持门店绑定和商品映射有效。`
          : '变更后不再通过企迈接单或操作商品；该渠道退出渠道商品库归属，并停止生成新的企迈侧门店渠道商品。',
      });
    });

    if (draft.collaborationMode === 'channel_division') {
      const baselineGroupOf = new Map<OmnichannelChannelId, string>();
      baseline.channelGroups.forEach(group => group.channels.forEach(id => baselineGroupOf.set(id, group.name)));
      catalogChannels.forEach(channel => {
        if (isThirdPartyChannelId(channel.id)
          && baseline.thirdPartyStrategies[channel.id] !== draft.thirdPartyStrategies[channel.id]) return;
        const before = baselineGroupOf.get(channel.id);
        const after = groupOfChannel.get(channel.id)?.name;
        if (before === after) return;
        if (before && after) {
          items.push({
            level: 'medium',
            title: `${channel.name} 迁移商品库`,
            detail: `由「${before}」迁移到「${after}」，该渠道已有的渠道商品资料归属随之变更。`,
          });
        } else if (after) {
          items.push({ level: 'info', title: `${channel.name} 加入「${after}」`, detail: '该渠道的售卖资料将由此商品库维护。' });
        } else {
          items.push({
            level: 'high',
            title: `${channel.name} 变为未分组`,
            detail: '未分组渠道无法确定售卖资料来源，需先分配商品库才能保存。',
          });
        }
      });

      draft.channelGroups.forEach(group => {
        if (!baseline.channelGroups.some(item => item.id === group.id)) {
          items.push({ level: 'info', title: `新增渠道商品库「${group.name}」`, detail: `包含 ${group.channels.length} 个渠道。` });
        }
      });
      baseline.channelGroups.forEach(group => {
        const stillThere = draft.channelGroups.find(item => item.id === group.id);
        if (!stillThere) {
          items.push({ level: 'medium', title: `删除渠道商品库「${group.name}」`, detail: '商品工作台对应的分页将不再出现。' });
        } else if (stillThere.name !== group.name) {
          items.push({ level: 'info', title: '商品库改名', detail: `「${group.name}」改为「${stillThere.name}」。` });
        }
      });

      const baselineExistingOrder = baseline.channelGroups
        .filter(group => draft.channelGroups.some(item => item.id === group.id))
        .map(group => group.id);
      const draftExistingOrder = draft.channelGroups
        .filter(group => baseline.channelGroups.some(item => item.id === group.id))
        .map(group => group.id);
      if (baselineExistingOrder.join(',') !== draftExistingOrder.join(',')) {
        items.push({
          level: 'info',
          title: '调整渠道商品库展示顺序',
          detail: `展示顺序调整为：${draft.channelGroups.map(group => group.name).join(' → ')}。仅影响商品库页签、选择器和默认打开顺序，不改变渠道归属、商品数据、权限或同步优先级。`,
        });
      }
    }

    const mappingVisible = (config: OmnichannelBrandConfig) => (
      Object.values(config.thirdPartyStrategies).some(mode => mode === 'platform')
      || Object.values(config.channelConnections).some(connection => connection.capabilities.length > 0)
    );
    if (mappingVisible(baseline) !== mappingVisible(draft)) {
      items.push({
        level: 'info',
        title: mappingVisible(draft) ? '左侧将出现「商品映射」菜单' : '左侧「商品映射」菜单将收起',
        detail: '该菜单在存在平台管理渠道、或平台管理渠道启用了企迈能力时出现。',
      });
    }

    return items;
  }, [baseline, catalogChannels, dirty, draft, groupOfChannel]);

  const highImpactCount = impacts.filter(item => item.level === 'high').length;

  if (!currentBrandConfig) return null;

  const updateStrategy = (channelId: ThirdPartyChannelId, mode: 'qimai' | 'platform') => {
    const oldMode = draft.thirdPartyStrategies[channelId];
    if (oldMode === mode) return;
    const capabilities: QimaiChannelCapability[] = mode === 'qimai'
      ? ['order_receiving', 'product_operations']
      : draft.channelConnections[channelId].capabilities;

    setDraft({
      ...draft,
      thirdPartyStrategies: { ...draft.thirdPartyStrategies, [channelId]: mode },
      channelConnections: { ...draft.channelConnections, [channelId]: { capabilities } },
      // 平台维护资料但继续使用企迈接单/经营能力时，仍保留渠道商品库归属。
      channelGroups: mode === 'platform' && capabilities.length === 0
        ? draft.channelGroups.map(group => ({ ...group, channels: group.channels.filter(id => id !== channelId) }))
        : draft.channelGroups,
    });
  };

  const selectCollaborationMode = (mode: OmnichannelBrandConfig['collaborationMode']) => {
    if (migrationRunning) return;
    if (draft.collaborationMode === mode) return;
    setPrimaryGroupId('');
    setMigrationConfirmed(false);
    setDraft({
      ...draft,
      collaborationMode: mode,
      // 统一管理的推荐路径是从默认渠道商品库一次创建主档与渠道商品；
      // 切回分渠道协作时保留该能力，由品牌按职责决定是否关闭。
      channelProductCreationMode: mode === 'unified'
        ? 'create_master_and_channel'
        : draft.channelProductCreationMode,
    });
  };

  const toggleCapability = (channelId: ThirdPartyChannelId, capability: QimaiChannelCapability) => {
    if (draft.thirdPartyStrategies[channelId] === 'qimai') return;
    const { capabilities } = draft.channelConnections[channelId];
    const nextCapabilities = capabilities.includes(capability)
      ? capabilities.filter(item => item !== capability)
      : [...capabilities, capability];
    setDraft({
      ...draft,
      channelConnections: {
        ...draft.channelConnections,
        [channelId]: {
          capabilities: nextCapabilities,
        },
      },
      channelGroups: nextCapabilities.length === 0
        ? draft.channelGroups.map(group => ({ ...group, channels: group.channels.filter(id => id !== channelId) }))
        : draft.channelGroups,
    });
  };

  /** 行内改归属：从所有分组移除后写入目标分组，天然满足「一个渠道只属于一个商品库」 */
  const assignGroup = (channelId: OmnichannelChannelId, groupId: string) => {
    setDraft({
      ...draft,
      channelGroups: draft.channelGroups.map(group => {
        const channels = group.channels.filter(id => id !== channelId);
        return group.id === groupId ? { ...group, channels: [...channels, channelId] } : { ...group, channels };
      }),
    });
  };

  const addGroup = () => {
    const id = newGroupId();
    const existing = draft.channelGroups.length + 1;
    const name = `渠道商品库 ${existing}`;
    setDraft({ ...draft, channelGroups: [...draft.channelGroups, { id, name, channels: [] }] });
    setRenamingGroupId(id);
    setRenameValue(name);
  };

  const commitRename = () => {
    if (!renamingGroupId) return;
    const name = renameValue.trim();
    if (name) {
      setDraft(prev => ({
        ...prev,
        channelGroups: prev.channelGroups.map(group => (group.id === renamingGroupId ? { ...group, name } : group)),
      }));
    }
    setRenamingGroupId(null);
    setRenameValue('');
  };

  const deleteGroup = (groupId: string) => {
    setDraft({ ...draft, channelGroups: draft.channelGroups.filter(group => group.id !== groupId) });
    setDeletingGroupId(null);
  };

  const openGroupSort = () => {
    setSortGroups(draft.channelGroups.map(group => ({ ...group, channels: [...group.channels] })));
    setDraggingGroupId(null);
    setSortOpen(true);
  };

  const moveSortGroup = (groupId: string, offset: -1 | 1) => {
    setSortGroups(current => {
      const currentIndex = current.findIndex(group => group.id === groupId);
      const nextIndex = currentIndex + offset;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
      return next;
    });
  };

  const dropSortGroup = (targetGroupId: string) => {
    if (!draggingGroupId || draggingGroupId === targetGroupId) {
      setDraggingGroupId(null);
      return;
    }
    setSortGroups(current => {
      const sourceIndex = current.findIndex(group => group.id === draggingGroupId);
      const targetIndex = current.findIndex(group => group.id === targetGroupId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moving] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moving);
      return next;
    });
    setDraggingGroupId(null);
  };

  const confirmGroupSort = () => {
    setDraft(prev => ({
      ...prev,
      channelGroups: sortGroups.map(group => ({ ...group, channels: [...group.channels] })),
    }));
    setDraggingGroupId(null);
    setSortOpen(false);
  };

  const requestSave = () => {
    if (migrationRunning) return;
    setShowValidation(true);
    if (unassignedChannels.length > 0) return;
    if (!dirty) return;
    setMigrationConfirmed(false);
    setImpactOpen(true);
  };

  const confirmSave = () => {
    setImpactOpen(false);
    const next = cloneConfig(draft);
    if (collaborationModeChanged) {
      const primaryGroup = baseline.channelGroups.find(group => group.id === primaryGroupId);
      setMigrationTask({
        id: `MIG${Date.now().toString().slice(-10)}`,
        status: 'running',
        sourceMode: baseline.collaborationMode,
        targetMode: draft.collaborationMode,
        progress: 8,
        targetConfig: next,
        primaryGroupName: draft.collaborationMode === 'unified' ? primaryGroup?.name : undefined,
        startedAt: '刚刚',
      });
      return;
    }
    setSaving(true);
    // 生产实现：改为真实接口调用，失败时展示 error 状态并保留当前编辑内容
    window.setTimeout(() => {
      updateBrandConfig(activeBrandId, { ...currentBrandConfig, omnichannel: next });
      setBaseline(next);
      setSaving(false);
      setSavedFlash(true);
      setShowValidation(false);
      window.setTimeout(() => setSavedFlash(false), 2400);
    }, 450);
  };

  const handleBack = () => {
    if (migrationRunning) return;
    if (dirty) { setLeaveOpen(true); return; }
    onBack();
  };

  const deletingGroup = draft.channelGroups.find(group => group.id === deletingGroupId);
  const modeLabel = (mode: OmnichannelBrandConfig['collaborationMode']) => (
    mode === 'unified' ? '统一管理' : '分渠道协作'
  );
  const migrationStage = migrationTask
    ? migrationTask.progress < 24
      ? '准备数据'
      : migrationTask.progress < 88
        ? '迁移商品'
        : migrationTask.status === 'completed'
          ? '迁移完成'
          : '完成切换'
    : '';
  const migrationConfirmationReady = !collaborationModeChanged || (
    migrationConfirmed
    && (draft.collaborationMode !== 'unified' || baseline.channelGroups.length === 0 || !!primaryGroupId)
  );

  const renderOwnershipRow = (channel: typeof ALL_OMNICHANNEL_CHANNELS[number]) => {
    const channelId = channel.id as ThirdPartyChannelId;
    const strategy = draft.thirdPartyStrategies[channelId];
    const requiresAuth = channelNeedsAuthorization(draft, channelId);
    return (
      <div key={channel.id} className="grid grid-cols-[220px_200px_minmax(260px,1fr)_140px] items-start gap-3 border-t border-[#F0F1F2] px-5 py-3.5">
        <div className="min-w-0"><strong className="text-[13px] font-semibold text-[#1D2129]">{channel.name}</strong><div className="mt-1.5 flex flex-wrap gap-1">{channel.platformProductScope === 'store_only' ? <Tag>仅门店级</Tag> : <Tag>品牌级+门店级</Tag>}{channel.requiresBrandReview && <Tag tone="warn">需品牌审核</Tag>}{channel.supportsServiceProviderBilling && <Tag tone="warn">服务商计费</Tag>}</div></div>
        <div className="inline-flex w-fit rounded-md bg-[#F2F3F5] p-0.5">
          <button type="button" onClick={() => updateStrategy(channelId, 'qimai')} className={`flex h-7 items-center gap-1.5 rounded px-3 text-[12px] ${strategy === 'qimai' ? 'bg-white font-semibold text-[#008F4C] shadow-sm' : 'text-[#86909C]'}`}><Radio active={strategy === 'qimai'} />企迈管理</button>
          <button type="button" onClick={() => updateStrategy(channelId, 'platform')} className={`flex h-7 items-center gap-1.5 rounded px-3 text-[12px] ${strategy === 'platform' ? 'bg-white font-semibold text-[#1D2129] shadow-sm' : 'text-[#86909C]'}`}><Radio active={strategy === 'platform'} />平台管理</button>
        </div>
        <div className="min-w-0">
          {strategy === 'qimai' ? <><div className="flex flex-wrap gap-1.5"><span className="rounded bg-[#EAF8F1] px-2 py-1 text-[11px] text-[#087A49]">接单</span><span className="rounded bg-[#EAF8F1] px-2 py-1 text-[11px] text-[#087A49]">商品发布</span><span className="rounded bg-[#EAF8F1] px-2 py-1 text-[11px] text-[#087A49]">上下架/库存</span></div><div className="mt-1.5 text-[11px] text-[#A9AEB8]">由企迈管理固定包含，不可调整</div></> : <><div className="flex flex-wrap gap-2">{CAPABILITY_LABELS.map(([capability, label]) => <button key={capability} type="button" onClick={() => toggleCapability(channelId, capability)} className={`flex h-7 items-center gap-1.5 rounded border px-2.5 text-[12px] ${draft.channelConnections[channelId].capabilities.includes(capability) ? 'border-[#8BD7AE] bg-[#F2FFF8] text-[#087A49]' : 'border-[#E5E6EB] bg-white text-[#667085]'}`}><Checkbox checked={draft.channelConnections[channelId].capabilities.includes(capability)} />{label}</button>)}</div><div className="mt-1.5 text-[11px] text-[#A9AEB8]">{draft.channelConnections[channelId].capabilities.length ? '启用后需下发企迈侧商品并建立映射' : '企迈不参与该渠道接单和商品经营'}</div></>}
        </div>
        <div>{requiresAuth ? <button type="button" onClick={() => window.open(TAKEAWAY_STORE_BINDING_URL, '_blank', 'noopener,noreferrer')} className="inline-flex items-center text-[12px] font-medium text-[#D46B08]">需门店绑定<ExternalLink size={11} className="ml-1" /></button> : <span className="text-[12px] text-[#A9AEB8]">无需绑定</span>}</div>
      </div>
    );
  };

  const renderAssignmentRow = (channel: typeof ALL_OMNICHANNEL_CHANNELS[number]) => {
    const thirdParty = isThirdPartyChannelId(channel.id);
    const strategy = thirdParty ? draft.thirdPartyStrategies[channel.id as ThirdPartyChannelId] : 'qimai';
    const usesCatalog = catalogChannelIds.has(channel.id);
    const group = groupOfChannel.get(channel.id);
    const missingGroup = showValidation && unassignedIds.has(channel.id);
    return (
      <div key={channel.id} className={`grid grid-cols-[230px_110px_180px_minmax(240px,1fr)] items-center gap-3 border-t border-[#F0F1F2] px-5 py-3 ${missingGroup ? 'bg-[#FFF9F0]' : ''}`}>
        <div><strong className="text-[13px] font-semibold text-[#1D2129]">{channel.name}</strong>{thirdParty && strategy === 'platform' && <div className="mt-1 text-[11px] text-[#86909C]">平台维护专属资料</div>}</div>
        <span className="w-fit rounded bg-[#F2F3F5] px-2 py-1 text-[11px] text-[#667085]">{thirdParty ? '三方渠道' : '自有渠道'}</span>
        <span className="text-[12px] text-[#4E5969]">{strategy === 'qimai' ? '企迈管理' : usesCatalog ? '平台资料 / 企迈经营' : '平台管理'}</span>
        <div className="min-w-0">{!usesCatalog ? <span className="text-[12px] text-[#A9AEB8]">未启用企迈经营能力，无需商品库</span> : !divided ? <span className="text-[12px] font-medium text-[#4E5969]">品牌默认商品库</span> : <><select value={group?.id || ''} onChange={event => assignGroup(channel.id, event.target.value)} className={`h-8 w-full max-w-[240px] rounded-md border bg-white px-2 text-[12px] outline-none ${missingGroup ? 'border-[#FF9A2E] text-[#9A5A16]' : 'border-[#E5E6EB] text-[#1D2129]'}`}><option value="">未分配</option>{draft.channelGroups.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{missingGroup && <div className="mt-1 text-[11px] text-[#D46B08]">未分配将阻止保存</div>}{!missingGroup && thirdParty && strategy === 'platform' && <div className="mt-1 text-[11px] text-[#86909C]">下发企迈侧门店商品后用于映射</div>}</>}</div>
      </div>
    );
  };

  const thirdPartyChannels = ALL_OMNICHANNEL_CHANNELS.filter(channel => isThirdPartyChannelId(channel.id));

  return (
    <div className="h-full min-w-0 flex-1 overflow-hidden bg-[#F5F6F8]">
      <main className="h-full overflow-y-auto no-scrollbar">
        <div className="mx-auto max-w-[1320px] px-6 pb-16 pt-5">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <button type="button" disabled={migrationRunning} onClick={handleBack} className="mb-1.5 inline-flex items-center gap-1 text-[12px] text-[#86909C] hover:text-[#4E5969] disabled:cursor-not-allowed disabled:text-[#C9CDD4]"><ArrowLeft size={14} />商品设置</button>
              <div className="flex items-center gap-2"><h1 className="text-[19px] font-bold leading-7 text-[#1D2129]">全渠道商品管理策略</h1><span className="rounded bg-[#F2F3F5] px-2 py-0.5 text-[11px] text-[#667085]">品牌级</span></div>
              <div className="mt-1 text-[12px] text-[#86909C]">品牌级配置 · 当前{modeLabel(baseline.collaborationMode)} · 普通配置保存后生效，协作方式变更完成迁移后生效</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {savedFlash && <span className="mr-1 inline-flex items-center text-[12px] font-medium text-[#008F4C]"><CheckCircle2 size={14} className="mr-1" />已保存</span>}
              {dirty && !savedFlash && !migrationRunning && <span className="mr-1 text-[12px] text-[#D46B08]">{impacts.length || 1} 项待保存变更</span>}
              <button type="button" disabled={!dirty || saving || migrationRunning} onClick={() => { setDraft(baseline); setShowValidation(false); }} className="h-8 rounded-md border border-[#E5E6EB] bg-white px-3 text-[13px] text-[#4E5969] disabled:cursor-not-allowed disabled:text-[#C9CDD4]">放弃改动</button>
              <button type="button" onClick={requestSave} disabled={!dirty || saving || migrationRunning} className={`inline-flex h-8 items-center rounded-md px-4 text-[13px] font-medium ${!dirty || saving || migrationRunning ? 'cursor-not-allowed bg-[#F2F3F5] text-[#C9CDD4]' : 'bg-[#00B460] text-white hover:bg-[#009F55]'}`}>{saving ? <><Loader2 size={14} className="mr-1.5 animate-spin" />保存中</> : migrationRunning ? <><Loader2 size={14} className="mr-1.5 animate-spin" />迁移中</> : <><Save size={14} className="mr-1.5" />保存策略</>}</button>
            </div>
          </div>

          {migrationTask && (
            <section className={`mt-4 rounded-lg border bg-white px-5 py-4 ${migrationTask.status === 'completed' ? 'border-[#A7E1C1]' : 'border-[#FFD8A8]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${migrationTask.status === 'completed' ? 'bg-[#EAF8F1] text-[#008F4C]' : 'bg-[#FFF7E8] text-[#D46B08]'}`}>
                    {migrationTask.status === 'completed' ? <CheckCircle2 size={17} /> : <Loader2 size={17} className="animate-spin" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><strong className="text-[14px] text-[#1D2129]">{modeLabel(migrationTask.sourceMode)} → {modeLabel(migrationTask.targetMode)}</strong><Tag tone={migrationTask.status === 'completed' ? 'info' : 'warn'}>{migrationTask.status === 'completed' ? '已完成' : '迁移中'}</Tag></div>
                    <p className="mt-1 text-[12px] text-[#667085]">任务 {migrationTask.id} · {migrationStage} · {migrationTask.startedAt}由王静发起</p>
                  </div>
                </div>
                {migrationTask.status === 'completed' && <button type="button" onClick={() => setMigrationTask(null)} className="text-[12px] text-[#86909C] hover:text-[#4E5969]">收起</button>}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F2F3F5]"><div className={`h-full rounded-full transition-all duration-500 ${migrationTask.status === 'completed' ? 'bg-[#00B460]' : 'bg-[#FF9A2E]'}`} style={{ width: `${migrationTask.progress}%` }} /></div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#86909C]"><span>{migrationStage}</span><span>{migrationTask.progress}%</span></div>
              <div className="mt-3 grid grid-cols-4 gap-3 border-t border-[#F0F1F2] pt-3 text-[12px]"><div><span className="text-[#86909C]">商品</span><strong className="ml-2 text-[#1D2129]">{products.length} 个</strong></div><div><span className="text-[#86909C]">渠道</span><strong className="ml-2 text-[#1D2129]">{catalogChannels.length} 个</strong></div><div><span className="text-[#86909C]">商品库</span><strong className="ml-2 text-[#1D2129]">{migrationTask.targetMode === 'unified' ? 1 : draft.channelGroups.length} 个</strong></div><div><span className="text-[#86909C]">策略状态</span><strong className="ml-2 text-[#1D2129]">{migrationTask.status === 'completed' ? '可编辑' : '暂不可编辑'}</strong></div></div>
            </section>
          )}

          {showValidation && unassignedChannels.length > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-[#FFD8A8] bg-[#FFF7E8] px-4 py-2.5 text-[13px] text-[#9A5A16]">
              <AlertCircle size={16} className="shrink-0" />
              <span>{unassignedChannels.map(channel => channel.name).join('、')}需要下发企迈侧门店商品，请先选择所属渠道商品库。</span>
            </div>
          )}

          <fieldset disabled={migrationRunning} className={migrationRunning ? 'opacity-60' : ''}>
          <section className="mt-4 overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
            <div className="flex items-center gap-3 border-b border-[#F0F1F2] px-5 py-4">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#1D2129] text-[12px] font-bold text-white">1</span>
              <div><h2 className="text-[15px] font-bold text-[#1D2129]">谁来管每个三方渠道</h2><p className="mt-0.5 text-[12px] text-[#86909C]">选择平台商品资料的维护方，并决定企迈是否参与接单、商品发布或上下架/库存。</p></div>
              <button type="button" onClick={() => window.open(TAKEAWAY_STORE_BINDING_URL, '_blank', 'noopener,noreferrer')} className="ml-auto inline-flex h-8 items-center rounded-md border border-[#E5E6EB] px-3 text-[12px] text-[#4E5969]">门店绑定<ExternalLink size={12} className="ml-1" /></button>
            </div>
            <div className="overflow-x-auto"><div className="min-w-[920px]"><div className="grid grid-cols-[220px_200px_minmax(260px,1fr)_140px] gap-3 bg-[#F7F8FA] px-5 py-2.5 text-[12px] font-medium text-[#4E5969]"><span>渠道</span><span>平台商品资料</span><span>企迈参与能力</span><span>门店连接要求</span></div>{thirdPartyChannels.map(renderOwnershipRow)}</div></div>
          </section>

          <section className="mt-4 overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
            <div className="flex items-center gap-3 border-b border-[#F0F1F2] px-5 py-4">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#1D2129] text-[12px] font-bold text-white">2</span>
              <div><h2 className="text-[15px] font-bold text-[#1D2129]">商品资料怎么分工与创建</h2><p className="mt-0.5 text-[12px] text-[#86909C]">菜单结构始终一致；协作方式只决定商品库数量、职责边界和创建路径。</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {([
                ['unified', '统一管理', '保留商品主档与渠道商品入口，全部渠道共用一个品牌默认商品库。', '适合同一团队维护、各渠道资料差异较小的品牌'],
                ['channel_division', '分渠道协作', '保留相同菜单，由多个渠道商品库分别承接不同团队的售卖资料。', '适合堂食、外卖和在线点由不同团队管理的品牌'],
              ] as const).map(([mode, title, description, fit]) => {
                const active = draft.collaborationMode === mode;
                const current = baseline.collaborationMode === mode;
                const statusLabel = active && !current ? '待切换' : current ? '当前生效' : '';
                return <button key={mode} type="button" onClick={() => selectCollaborationMode(mode)} className={`rounded-lg border p-4 text-left ${active ? 'border-[#00B460] bg-[#F6FCF9]' : 'border-[#E5E6EB] bg-white hover:border-[#C9CDD4]'}`}><div className="flex items-center justify-between"><strong className="text-[14px] text-[#1D2129]">{title}</strong>{statusLabel && <span className={`text-[11px] font-medium ${active ? 'text-[#008F4C]' : 'text-[#86909C]'}`}>{statusLabel}</span>}</div><p className="mt-2 text-[12px] leading-5 text-[#4E5969]">{description}</p><div className="mt-2 text-[11px] text-[#86909C]">{fit}</div></button>;
              })}
            </div>
            <div className="border-t border-[#F0F1F2] bg-[#FAFBFC] px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div><strong className="text-[13px] text-[#1D2129]">渠道商品库的商品创建方式</strong><p className="mt-1 text-[11px] text-[#86909C]">品牌级策略，统一管理和分渠道协作都适用；最终还需同时满足主档与商品库操作权限。</p></div>
                {draft.collaborationMode === 'unified' && <span className="rounded bg-[#EAF8F1] px-2 py-1 text-[11px] text-[#087A49]">统一管理推荐允许直接新建</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['existing_master_only', '仅选择已有商品主档', '渠道人员从商品主档中选择商品加入当前商品库，不在此处创建新主档。'],
                  ['create_master_and_channel', '允许同时创建主档与渠道商品', '按“主档资料 / 渠道商品资料”分区填写，一次提交同时创建并加入当前商品库。'],
                ] as const).map(([mode, title, description]) => {
                  const active = draft.channelProductCreationMode === mode;
                  return <button key={mode} type="button" onClick={() => setDraft({ ...draft, channelProductCreationMode: mode })} className={`flex items-start gap-3 rounded-md border p-3 text-left ${active ? 'border-[#8BD7AE] bg-white' : 'border-[#E5E6EB] bg-white hover:border-[#C9CDD4]'}`}><Radio active={active} /><span><strong className="block text-[13px] text-[#1D2129]">{title}</strong><span className="mt-1 block text-[11px] leading-5 text-[#667085]">{description}</span></span></button>;
                })}
              </div>
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
            <div className="flex items-center gap-3 border-b border-[#F0F1F2] px-5 py-4">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#1D2129] text-[12px] font-bold text-white">3</span>
              <div><h2 className="text-[15px] font-bold text-[#1D2129]">确认每个渠道的商品来源</h2><p className="mt-0.5 text-[12px] text-[#86909C]">{divided ? `${catalogChannels.length} 个渠道需要从所属渠道商品库下发企迈侧门店商品。` : `${catalogChannels.length} 个渠道统一使用品牌默认商品库。`}</p></div>
              {divided && <div className="ml-auto flex items-center gap-2">{draft.channelGroups.length > 1 && <button type="button" onClick={openGroupSort} className="inline-flex h-8 items-center rounded-md border border-[#E5E6EB] bg-white px-3 text-[12px] text-[#4E5969] hover:border-[#C9CDD4]"><GripVertical size={13} className="mr-1" />调整顺序</button>}<button type="button" onClick={addGroup} className="inline-flex h-8 items-center rounded-md border border-[#E5E6EB] bg-white px-3 text-[12px] text-[#1D2129] hover:border-[#C9CDD4]"><Plus size={13} className="mr-1" />新建商品库</button></div>}
            </div>

            {divided ? (
              <div className="flex flex-wrap gap-3 border-b border-[#F0F1F2] bg-[#FAFBFC] p-4">
                {draft.channelGroups.map(group => <div key={group.id} className="w-[270px] rounded-lg border border-[#E5E6EB] bg-white p-3"><div className="flex items-center gap-2">{renamingGroupId === group.id ? <input autoFocus value={renameValue} onChange={event => setRenameValue(event.target.value)} onBlur={commitRename} onKeyDown={event => { if (event.key === 'Enter') commitRename(); if (event.key === 'Escape') { setRenamingGroupId(null); setRenameValue(''); } }} className="h-7 min-w-0 flex-1 rounded border border-[#00B460] px-2 text-[12px] outline-none" /> : <strong className="min-w-0 flex-1 truncate text-[13px] text-[#1D2129]">{group.name}</strong>}<button type="button" onClick={() => { setRenamingGroupId(group.id); setRenameValue(group.name); }} className="text-[#86909C]" title="重命名"><Pencil size={13} /></button><button type="button" onClick={() => setDeletingGroupId(group.id)} className="text-[#C9CDD4] hover:text-[#CB2634]" title="删除"><Trash2 size={13} /></button></div><div className="mt-2 text-[12px] text-[#86909C]">{group.channels.length} 个渠道</div><div className="mt-2 flex min-h-[22px] flex-wrap gap-1">{group.channels.slice(0, 4).map(id => <span key={id} className="rounded bg-[#EAF8F1] px-2 py-0.5 text-[11px] text-[#087A49]">{getOmnichannelChannel(id).shortName}</span>)}</div></div>)}
                {draft.channelGroups.length === 0 && <div className="text-[12px] text-[#D46B08]">请先新建至少一个渠道商品库</div>}
              </div>
            ) : (
              <div className="border-b border-[#F0F1F2] bg-[#FAFBFC] px-5 py-3 text-[12px] text-[#4E5969]"><strong className="mr-2 text-[#1D2129]">品牌默认商品库</strong>{catalogChannels.length} 个渠道使用</div>
            )}
            <div className="overflow-x-auto"><div className="min-w-[840px]"><div className="grid grid-cols-[230px_110px_180px_minmax(240px,1fr)] gap-3 bg-[#F7F8FA] px-5 py-2.5 text-[12px] font-medium text-[#4E5969]"><span>渠道</span><span>类型</span><span>管理方式</span><span>所属渠道商品库</span></div>{ALL_OMNICHANNEL_CHANNELS.map(renderAssignmentRow)}</div></div>
          </section>
          </fieldset>
        </div>
      </main>

      {/* ===== 渠道商品库展示顺序 ===== */}
      {sortOpen && (
        <div className="fixed inset-0 z-[330] flex items-center justify-center bg-[#1D2129]/55 px-6">
          <div className="flex max-h-[calc(100vh-96px)] w-[600px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div>
                <h3 className="text-[18px] font-bold text-[#1D2129]">调整渠道商品库展示顺序</h3>
                <p className="mt-1 text-[12px] leading-5 text-[#86909C]">拖动商品库，或使用上下按钮调整；保存策略后，所有商品库页签和选择器将按此顺序展示。</p>
              </div>
              <button type="button" onClick={() => { setSortOpen(false); setDraggingGroupId(null); }} className="flex h-8 w-8 items-center justify-center rounded-md text-[#4E5969] hover:bg-[#F2F3F5]" title="关闭排序弹窗">
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="mb-3 rounded-md border border-[#DDEFE5] bg-[#F6FCF9] px-3 py-2 text-[12px] leading-5 text-[#4E5969]">
                排在首位的有权商品库会作为相关页面首次进入时的默认展示范围；这不代表主商品库或同步优先级。
              </div>
              <div className="space-y-2">
                {sortGroups.map((group, index) => (
                  <div
                    key={group.id}
                    draggable
                    onDragStart={() => setDraggingGroupId(group.id)}
                    onDragEnd={() => setDraggingGroupId(null)}
                    onDragOver={event => event.preventDefault()}
                    onDrop={() => dropSortGroup(group.id)}
                    className={`flex items-center gap-3 rounded-md border px-3 py-3 transition-colors ${draggingGroupId === group.id ? 'border-[#8BD7AE] bg-[#F2FFF8] opacity-70' : 'border-[#E5E6EB] bg-white hover:border-[#C9CDD4]'}`}
                  >
                    <span className="cursor-grab text-[#A9AEB8] active:cursor-grabbing" title="拖动调整顺序"><GripVertical size={17} /></span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F2F3F5] text-[11px] font-semibold text-[#4E5969]">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[#1D2129]">{group.name}</div>
                      <div className="mt-1 truncate text-[11px] text-[#86909C]">{group.channels.length > 0 ? `${group.channels.length} 个渠道 · ${group.channels.map(id => getOmnichannelChannel(id).shortName).join('、')}` : '暂未关联渠道'}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" disabled={index === 0} onClick={() => moveSortGroup(group.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E6EB] text-[#4E5969] hover:border-[#C9CDD4] disabled:cursor-not-allowed disabled:bg-[#F7F8FA] disabled:text-[#C9CDD4]" title="上移"><ArrowUp size={14} /></button>
                      <button type="button" disabled={index === sortGroups.length - 1} onClick={() => moveSortGroup(group.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E6EB] text-[#4E5969] hover:border-[#C9CDD4] disabled:cursor-not-allowed disabled:bg-[#F7F8FA] disabled:text-[#C9CDD4]" title="下移"><ArrowDown size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
              <span className="text-[12px] text-[#86909C]">仅调整展示顺序，不迁移商品、不改变渠道归属或权限。</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setSortOpen(false); setDraggingGroupId(null); }} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969] hover:border-[#86909C]">取消</button>
                <button type="button" onClick={confirmGroupSort} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-semibold text-white hover:bg-[#009F55]">确认顺序</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 保存前影响确认 ===== */}
      {impactOpen && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-[#1D2129]/55 px-6">
          <div className="flex max-h-[calc(100vh-96px)] w-[680px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div>
                <h3 className="text-[18px] font-bold text-[#1D2129]">{collaborationModeChanged ? '校验并确认协作方式切换' : '确认本次策略变更'}</h3>
                <p className="mt-1 text-[12px] text-[#86909C]">
                  {collaborationModeChanged
                    ? `${modeLabel(baseline.collaborationMode)}将切换为${modeLabel(draft.collaborationMode)}，迁移完成前仍按当前模式运行。`
                    : <>共 {impacts.length} 项影响{highImpactCount > 0 && <span className="text-[#CB2634]">，其中 {highImpactCount} 项会改变商品资料或发布链路</span>}。</>}
                </p>
              </div>
              <button type="button" onClick={() => setImpactOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-[#4E5969] hover:bg-[#F2F3F5]" title="关闭">
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {collaborationModeChanged && (
                <div className="mb-4 space-y-3">
                  <div className="rounded-md border border-[#FFD8A8] bg-[#FFF9F0] p-4">
                    <div className="flex items-center gap-2"><AlertTriangle size={16} className="text-[#D46B08]" /><strong className="text-[13px] text-[#1D2129]">商品数据将通过迁移任务处理</strong></div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]"><div><span className="text-[#86909C]">商品</span><strong className="ml-2 text-[#1D2129]">{products.length} 个</strong></div><div><span className="text-[#86909C]">渠道</span><strong className="ml-2 text-[#1D2129]">{catalogChannels.length} 个</strong></div><div><span className="text-[#86909C]">目标商品库</span><strong className="ml-2 text-[#1D2129]">{draft.collaborationMode === 'unified' ? 1 : draft.channelGroups.length} 个</strong></div></div>
                    <p className="mt-3 text-[12px] leading-5 text-[#4E5969]">
                      {draft.collaborationMode === 'unified'
                        ? '全部商品取并集并按商品主档去重；重复商品使用主商品库的公共渠道资料，其他商品库和权限保留快照。'
                        : '统一商品库中的全部商品会复制到每个目标商品库；切换完成后，各渠道团队可批量移出不经营的商品。'}
                    </p>
                  </div>

                  {draft.collaborationMode === 'unified' && baseline.channelGroups.length > 0 && (
                    <label className="block rounded-md border border-[#E5E6EB] p-3">
                      <span className="block text-[13px] font-bold text-[#1D2129]">重复商品以哪个商品库资料为准</span>
                      <span className="mt-1 block text-[11px] text-[#86909C]">只在同一商品存在不同公共渠道资料时使用；平台专属资料和映射关系仍按原渠道保留。</span>
                      <select value={primaryGroupId} onChange={event => setPrimaryGroupId(event.target.value)} className="mt-3 h-9 w-full rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#1D2129] outline-none focus:border-[#00B460]">
                        <option value="">请选择主商品库</option>
                        {baseline.channelGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                      </select>
                    </label>
                  )}

                  <div className="rounded-md border border-[#E5E6EB] p-3">
                    <div className="text-[13px] font-bold text-[#1D2129]">保存前校验</div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-[12px] text-[#4E5969] sm:grid-cols-3">
                      <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#00B460]" />渠道均已分配商品库</span>
                      <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#00B460]" />无发布、导入执行中任务</span>
                      <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#00B460]" />迁移前自动保存数据快照</span>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-2.5 rounded-md bg-[#F7F8FA] p-3 text-[12px] leading-5 text-[#4E5969]">
                    <input type="checkbox" checked={migrationConfirmed} onChange={event => setMigrationConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-[#00B460]" />
                    <span>我已确认上述固定迁移规则。迁移期间全渠道策略和受影响渠道商品暂不可编辑，迁移成功后新协作方式才会生效。</span>
                  </label>
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                {impacts.filter(item => !collaborationModeChanged || !item.title.startsWith('协作方式改为')).map((item, index) => {
                  const meta = LEVEL_META[item.level];
                  return (
                    <div key={index} className="rounded-md border border-[#E5E6EB] p-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: meta.chipBg, color: meta.chipText }}>
                          {meta.label}
                        </span>
                        <span className="text-[13px] font-bold text-[#1D2129]">{item.title}</span>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-5 text-[#4E5969]">{item.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
              <span className="text-[12px] text-[#86909C]">{collaborationModeChanged ? '迁移完成前继续使用当前协作方式，不影响门店现有售卖。' : '保存后立即对当前品牌生效。'}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setImpactOpen(false)} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969] hover:border-[#86909C]">
                  返回修改
                </button>
                <button type="button" disabled={!migrationConfirmationReady} onClick={confirmSave} className="inline-flex h-9 items-center rounded-md bg-[#1D2129] px-4 text-[13px] font-bold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-[#C9CDD4]">
                  {collaborationModeChanged ? '开始迁移' : '确认保存'}<ArrowRight size={15} className="ml-1.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 删除分组确认 ===== */}
      {deletingGroup && (
        <ConfirmDialog
          title={`删除渠道商品库「${deletingGroup.name}」？`}
          tone="danger"
          confirmText="删除"
          onCancel={() => setDeletingGroupId(null)}
          onConfirm={() => deleteGroup(deletingGroup.id)}
        >
          {deletingGroup.channels.length > 0 ? (
            <>
              该商品库下的 {deletingGroup.channels.length} 个渠道
              （{deletingGroup.channels.map(id => getOmnichannelChannel(id).name).join('、')}）
              将变为<span className="font-bold text-[#1D2129]">未分配</span>，需要重新指定商品库后才能保存策略。
              商品工作台中对应的分页也会消失。
            </>
          ) : (
            <>该商品库当前没有关联渠道，删除后商品工作台对应分页将不再出现。</>
          )}
        </ConfirmDialog>
      )}

      {/* ===== 未保存离开拦截 ===== */}
      {leaveOpen && (
        <ConfirmDialog
          title="放弃未保存的变更？"
          confirmText="放弃并离开"
          onCancel={() => setLeaveOpen(false)}
          onConfirm={() => { setLeaveOpen(false); onBack(); }}
        >
          当前策略有未保存的修改，离开后这些修改会丢失。
        </ConfirmDialog>
      )}
    </div>
  );
};
