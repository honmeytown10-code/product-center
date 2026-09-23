import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  History,
  Loader2,
  LockKeyhole,
  PackagePlus,
} from 'lucide-react';
import { useProducts } from '../../context';
import { ALL_OMNICHANNEL_CHANNELS } from '../../omnichannel';
import type { OmnichannelChannelId, OmnichannelCollaborationMode } from '../../types';

export type PrototypeOmnichannelScenario = 'initialized' | 'first_activation';

type InitializationStatus = 'editing' | 'running' | 'completed';
type InitializationDemoScenario = 'standard' | 'legacy_online_order';

type DraftCatalog = {
  id: string;
  name: string;
  channels: OmnichannelChannelId[];
};

const INITIAL_CATALOGS: DraftCatalog[] = [
  { id: 'init-dine-in', name: '堂食商品库', channels: ['pos', 'mini_program_dine_in'] },
  { id: 'init-delivery', name: '外卖商品库', channels: ['mini_program_delivery', 'meituan', 'taobao', 'meituan_pinhaofan'] },
  { id: 'init-online', name: '在线点商品库', channels: ['douyin', 'meituan_dine'] },
];

const LEGACY_ONLINE_ORDER_CATALOGS: DraftCatalog[] = [
  { id: 'init-dine-in', name: '堂食商品库', channels: ['pos', 'mini_program_dine_in'] },
  { id: 'init-delivery', name: '外卖商品库', channels: ['mini_program_delivery', 'meituan', 'taobao', 'meituan_pinhaofan'] },
  { id: 'init-douyin-online', name: '抖音在线点商品库', channels: ['douyin'] },
  { id: 'init-meituan-online', name: '美团在线点商品库', channels: ['meituan_dine'] },
];

const LOCKED_LEGACY_CHANNELS: OmnichannelChannelId[] = ['douyin', 'meituan_dine'];
const LOCKED_LEGACY_CATALOG_IDS = ['init-douyin-online', 'init-meituan-online'];

const CREATION_MODES = [
  {
    id: 'existing_master_only' as const,
    title: '仅从商品主档添加',
    description: '渠道负责人只能选择已有主档，主档仍由商品团队统一创建。',
  },
  {
    id: 'create_master_and_channel' as const,
    title: '允许同时创建主档与渠道商品',
    description: '具备双重权限的人员可一次填写并同时创建两个对象。',
  },
];

const STEPS = [
  ['1', '确认管理方式'],
  ['2', '建立商品库'],
  ['3', '确认启用'],
] as const;

const RadioMark: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? 'border-[#00B460]' : 'border-[#C9CDD4]'}`}>
    {active && <span className="h-2 w-2 rounded-full bg-[#00B460]" />}
  </span>
);

interface EmptyProps {
  onStartInitialization: () => void;
  onBackToMaster: () => void;
}

export const WebChannelProductInitializationEmpty: React.FC<EmptyProps> = ({
  onStartInitialization,
  onBackToMaster,
}) => (
  <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA] p-3">
    <section className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-[#E5E6EB] bg-white px-8 py-12">
      <div className="w-full max-w-[720px] text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF9F1] text-[#00A35B]">
          <PackagePlus size={27} />
        </div>
        <h1 className="mt-5 text-[20px] font-bold text-[#1D2129]">尚未初始化渠道商品库</h1>
        <p className="mx-auto mt-2 max-w-[560px] text-[13px] leading-6 text-[#667085]">
          这是品牌首次启用全渠道商品中心。请先确认管理方式、建立渠道商品库，系统会按所选模式处理现有商品主档。
        </p>

        <div className="mx-auto mt-7 grid max-w-[620px] grid-cols-3 gap-3 text-left">
          {[
            ['1', '确认管理方式', '统一管理或分渠道协作'],
            ['2', '建立商品库', '确认渠道归属与初始化规则'],
            ['3', '完成初始化', '成功后进入渠道商品管理'],
          ].map(([number, title, description]) => (
            <div key={number} className="rounded-md border border-[#E5E6EB] bg-[#FAFBFC] p-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF9F1] text-[12px] font-bold text-[#008F53]">{number}</div>
              <strong className="mt-3 block text-[13px] text-[#1D2129]">{title}</strong>
              <span className="mt-1 block text-[12px] leading-5 text-[#86909C]">{description}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-center gap-3">
          <button type="button" onClick={onBackToMaster} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969] hover:border-[#86909C]">
            返回商品主档
          </button>
          <button type="button" onClick={onStartInitialization} className="inline-flex h-9 items-center rounded-md bg-[#00B460] px-5 text-[13px] font-medium text-white hover:bg-[#009E54]">
            开始初始化<ArrowRight size={15} className="ml-1.5" />
          </button>
        </div>
        <div className="mt-4 text-[12px] text-[#98A2B3]">初始化不会自动发布商品，也不会修改现有商品主档。</div>
      </div>
    </section>
  </main>
);

interface InitializationProps {
  onBack: () => void;
  onComplete: () => void;
}

export const WebOmnichannelInitialization: React.FC<InitializationProps> = ({ onBack, onComplete }) => {
  const { products } = useProducts();
  const [demoScenario, setDemoScenario] = useState<InitializationDemoScenario>('standard');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<OmnichannelCollaborationMode | null>(null);
  const [creationMode, setCreationMode] = useState<'existing_master_only' | 'create_master_and_channel'>('existing_master_only');
  const [catalogs, setCatalogs] = useState<DraftCatalog[]>(INITIAL_CATALOGS);
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<InitializationStatus>('editing');
  const [progress, setProgress] = useState(0);
  const legacyOnlineOrder = demoScenario === 'legacy_online_order';

  useEffect(() => {
    if (status !== 'running') return undefined;
    const timers = [
      window.setTimeout(() => setProgress(28), 350),
      window.setTimeout(() => setProgress(62), 900),
      window.setTimeout(() => setProgress(88), 1450),
      window.setTimeout(() => {
        setProgress(100);
        setStatus('completed');
      }, 2100),
    ];
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [status]);

  const effectiveCatalogs = mode === 'unified'
    ? [{ id: 'unified-default', name: '品牌默认商品库', channels: ALL_OMNICHANNEL_CHANNELS.map(channel => channel.id) }]
    : catalogs;
  const selectedProductCount = mode === 'unified' ? products.length : 0;
  const channelProductCount = selectedProductCount * effectiveCatalogs.length;
  const allChannelsAssigned = mode !== 'channel_division'
    || ALL_OMNICHANNEL_CHANNELS.every(channel => catalogs.some(catalog => catalog.channels.includes(channel.id)));
  const canContinueStep2 = allChannelsAssigned;

  const assignChannel = (channelId: OmnichannelChannelId, catalogId: string) => {
    if (legacyOnlineOrder && LOCKED_LEGACY_CHANNELS.includes(channelId)) return;
    setCatalogs(current => current.map(catalog => ({
      ...catalog,
      channels: catalog.id === catalogId
        ? Array.from(new Set([...catalog.channels, channelId]))
        : catalog.channels.filter(id => id !== channelId),
    })));
  };

  const addCatalog = () => {
    const suffix = catalogs.length + 1;
    setCatalogs(current => [...current, { id: `init-custom-${Date.now()}`, name: `渠道商品库 ${suffix}`, channels: [] }]);
  };

  const selectDemoScenario = (scenario: InitializationDemoScenario) => {
    setDemoScenario(scenario);
    setStep(1);
    setConfirmed(false);
    if (scenario === 'legacy_online_order') {
      setMode('channel_division');
      setCatalogs(LEGACY_ONLINE_ORDER_CATALOGS);
      return;
    }
    setMode(null);
    setCatalogs(INITIAL_CATALOGS);
  };

  if (status !== 'editing') {
    const completed = status === 'completed';
    const isUnified = mode === 'unified';
    return (
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
        <div className="flex h-[72px] shrink-0 items-center border-b border-[#E5E6EB] bg-white px-6">
          <div>
            <h1 className="text-[19px] font-bold text-[#1D2129]">初始化全渠道商品管理</h1>
            <p className="mt-1 text-[12px] text-[#86909C]">初始化任务可在后台继续执行，完成前不会启用新的渠道商品库。</p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <section className="w-full max-w-[760px] rounded-lg border border-[#E5E6EB] bg-white p-8 shadow-sm">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${completed ? 'bg-[#EAF9F1] text-[#00A35B]' : 'bg-[#F2F8FF] text-[#2475C1]'}`}>
              {completed ? <CheckCircle2 size={28} /> : <Loader2 size={28} className="animate-spin" />}
            </div>
            <h2 className="mt-4 text-center text-[18px] font-bold text-[#1D2129]">{completed ? '初始化完成' : '正在初始化渠道商品库'}</h2>
            <p className="mt-2 text-center text-[13px] text-[#667085]">
              {completed
                ? isUnified
                  ? `已创建 1 个品牌默认商品库，并加入 ${channelProductCount} 个现有主档商品。`
                  : legacyOnlineOrder
                    ? `已创建 ${effectiveCatalogs.length} 个渠道商品库，并提交抖音、美团在线点历史商品迁移任务。`
                    : `已创建 ${effectiveCatalogs.length} 个渠道商品库，暂未加入主档商品。`
                : isUnified
                  ? '正在创建默认商品库并加入现有主档商品，请勿重复提交。'
                  : legacyOnlineOrder
                    ? '正在创建专属商品库并准备历史在线点商品迁移，请勿重复提交。'
                    : '正在按渠道归属创建商品库，请勿重复提交。'}
            </p>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#EEF1F4]">
              <div className="h-full rounded-full bg-[#00B460] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[12px] text-[#86909C]"><span>{completed ? '全部处理完成' : progress < 35 ? '正在创建商品库' : progress < 75 ? isUnified ? '正在加入现有主档商品' : legacyOnlineOrder ? '正在准备历史在线点迁移' : '正在保存渠道归属' : '正在校验初始化结果'}</span><strong className="text-[#344054]">{progress}%</strong></div>
            <div className="mt-6 grid grid-cols-3 divide-x divide-[#EEF1F4] rounded-md border border-[#EEF1F4] bg-[#FAFBFC] py-4 text-center">
              <div><span className="block text-[12px] text-[#98A2B3]">商品库</span><strong className="mt-1 block text-[16px] text-[#1D2129]">{effectiveCatalogs.length}</strong></div>
              <div><span className="block text-[12px] text-[#98A2B3]">渠道</span><strong className="mt-1 block text-[16px] text-[#1D2129]">{ALL_OMNICHANNEL_CHANNELS.length}</strong></div>
              <div><span className="block text-[12px] text-[#98A2B3]">{legacyOnlineOrder ? '历史迁移任务' : '渠道商品'}</span><strong className="mt-1 block text-[16px] text-[#1D2129]">{legacyOnlineOrder ? (progress < 35 ? 0 : 2) : completed ? channelProductCount : Math.round(channelProductCount * progress / 100)}</strong></div>
            </div>
            {completed && !isUnified && <div className="mt-4 rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-center text-[12px] text-[#4E6A85]">{legacyOnlineOrder ? '历史在线点商品将在后台迁移，不会触发抖音或美团平台商品同步；其他渠道可按需从商品主档添加商品。' : '各渠道团队可进入对应商品库，按需从商品主档添加经营商品。'}</div>}
            {completed && <div className="mt-6 text-center"><button type="button" onClick={onComplete} className="inline-flex h-9 items-center rounded-md bg-[#00B460] px-5 text-[13px] font-medium text-white hover:bg-[#009E54]">进入渠道商品<ArrowRight size={15} className="ml-1.5" /></button></div>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#E5E6EB] bg-white px-6">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onBack} className="mt-0.5 rounded p-1 text-[#667085] hover:bg-[#F2F3F5]" title="返回商品设置"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2"><h1 className="text-[19px] font-bold text-[#1D2129]">初始化全渠道商品管理</h1><span className="rounded bg-[#F2F4F7] px-2 py-0.5 text-[11px] text-[#667085]">首次启用</span></div>
            <p className="mt-1 text-[12px] text-[#86909C]">完成后才会启用渠道商品库；现有商品主档不会被修改。</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-[#DDE2E8] bg-[#F7F8FA] p-1" aria-label="原型模拟场景">
          <span className="px-2 text-[11px] text-[#86909C]">演示场景</span>
          <button type="button" onClick={() => selectDemoScenario('standard')} className={`h-7 rounded px-3 text-[12px] transition-colors ${!legacyOnlineOrder ? 'bg-white font-medium text-[#1D2129] shadow-sm' : 'text-[#667085] hover:bg-white'}`}>普通首次启用</button>
          <button type="button" onClick={() => selectDemoScenario('legacy_online_order')} className={`inline-flex h-7 items-center rounded px-3 text-[12px] transition-colors ${legacyOnlineOrder ? 'bg-[#FFF4E8] font-medium text-[#9A5A16] shadow-sm' : 'text-[#667085] hover:bg-white'}`}><History size={13} className="mr-1.5" />历史在线点商家</button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 p-3">
        <aside className="w-[220px] shrink-0 rounded-l-lg border border-r-0 border-[#E5E6EB] bg-white p-5">
          <div className="space-y-1">
            {STEPS.map(([number, label], index) => {
              const stepNumber = (index + 1) as 1 | 2 | 3;
              const active = step === stepNumber;
              const done = step > stepNumber;
              return (
                <div key={number} className="relative flex min-h-[76px] gap-3">
                  {index < STEPS.length - 1 && <span className={`absolute left-[13px] top-8 h-[44px] w-px ${done ? 'bg-[#8BD7AE]' : 'bg-[#E5E6EB]'}`} />}
                  <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${done ? 'bg-[#DDF6E9] text-[#008F53]' : active ? 'bg-[#00B460] text-white' : 'bg-[#F2F3F5] text-[#98A2B3]'}`}>{done ? <Check size={14} /> : number}</span>
                  <div className={`pt-1 text-[13px] font-medium ${active ? 'text-[#008F53]' : done ? 'text-[#667085]' : 'text-[#98A2B3]'}`}>{label}</div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-r-lg border border-[#E5E6EB] bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {step === 1 && (
              <div className="mx-auto max-w-[1040px]">
                <div><h2 className="text-[17px] font-bold text-[#1D2129]">确认品牌的商品管理方式</h2><p className="mt-1 text-[12px] text-[#86909C]">{legacyOnlineOrder ? '系统已根据历史在线点使用记录确定本次初始化方式。' : '请选择最符合当前团队职责的方式。首次启用后仍可通过受控迁移调整。'}</p></div>
                {legacyOnlineOrder && <div className="mt-4 flex items-start gap-3 rounded-md border border-[#FFD8A8] bg-[#FFF9F0] px-4 py-3"><History size={17} className="mt-0.5 shrink-0 text-[#D46B08]" /><div><strong className="text-[13px] text-[#1D2129]">检测到抖音在线点、美团在线点历史商品</strong><p className="mt-1 text-[12px] leading-5 text-[#667085]">为保证历史商品独立迁移，本次只能使用分渠道协作。系统将在下一步分别创建两个平台专属商品库。</p></div></div>}
                <div className="mt-5 grid grid-cols-2 gap-4">
                  {[
                    ['unified', '统一管理', '所有渠道共用一个品牌默认商品库，由同一团队集中维护渠道售卖资料。', '适合渠道差异较小、职责集中的品牌'],
                    ['channel_division', '分渠道协作', '按渠道职责建立多个商品库，不同团队分别维护各自渠道商品。', '适合堂食、外卖、在线点分别运营的品牌'],
                  ].map(([id, title, description, fit]) => {
                    const active = mode === id;
                    const disabled = legacyOnlineOrder && id === 'unified';
                    return <button key={id} type="button" disabled={disabled} onClick={() => setMode(id as OmnichannelCollaborationMode)} className={`rounded-lg border p-5 text-left transition-colors ${disabled ? 'cursor-not-allowed border-[#E5E6EB] bg-[#F7F8FA] opacity-70' : active ? 'border-[#00B460] bg-[#F2FFF8]' : 'border-[#E5E6EB] bg-white hover:border-[#B9DDCA]'}`}><div className="flex items-center gap-3"><RadioMark active={active} /><strong className="text-[15px] text-[#1D2129]">{title}</strong>{id === 'unified' && !legacyOnlineOrder && <span className="rounded bg-[#EAF9F1] px-2 py-0.5 text-[11px] text-[#008F53]">推荐集中管理品牌</span>}{disabled && <span className="inline-flex items-center rounded bg-[#EEF1F4] px-2 py-0.5 text-[11px] text-[#667085]"><LockKeyhole size={11} className="mr-1" />历史在线点商家不可选</span>}{legacyOnlineOrder && id === 'channel_division' && <span className="rounded bg-[#EAF9F1] px-2 py-0.5 text-[11px] text-[#008F53]">系统已选择</span>}</div><p className="mt-3 text-[13px] leading-6 text-[#4E5969]">{description}</p><div className="mt-2 text-[12px] text-[#98A2B3]">{fit}</div></button>;
                  })}
                </div>

                <div className="mt-7 border-t border-[#EEF1F4] pt-6"><h3 className="text-[14px] font-bold text-[#1D2129]">渠道商品创建方式</h3><div className="mt-3 grid grid-cols-2 gap-3">{CREATION_MODES.map(item => { const active = creationMode === item.id; return <button key={item.id} type="button" onClick={() => setCreationMode(item.id)} className={`flex items-start gap-3 rounded-md border p-4 text-left ${active ? 'border-[#8BD7AE] bg-[#F7FFFA]' : 'border-[#E5E6EB]'}`}><RadioMark active={active} /><span><strong className="block text-[13px] text-[#1D2129]">{item.title}</strong><span className="mt-1 block text-[12px] leading-5 text-[#86909C]">{item.description}</span></span></button>; })}</div></div>
              </div>
            )}

            {step === 2 && mode && (
              <div className="mx-auto max-w-[1080px]">
                <div className="flex items-start justify-between"><div><h2 className="text-[17px] font-bold text-[#1D2129]">建立渠道商品库</h2><p className="mt-1 text-[12px] text-[#86909C]">确认商品库与渠道归属；初始化不会自动发布商品到门店或三方平台。</p></div>{mode === 'channel_division' && <button type="button" onClick={addCatalog} className="inline-flex h-8 items-center rounded-md border border-[#C9CDD4] px-3 text-[12px] text-[#4E5969] hover:border-[#00B460] hover:text-[#008F53]">+ 新建商品库</button>}</div>

                {legacyOnlineOrder && <div className="mt-4 flex items-start gap-3 rounded-md border border-[#DDEFE5] bg-[#F6FCF9] px-4 py-3"><LockKeyhole size={16} className="mt-0.5 shrink-0 text-[#008F53]" /><div><strong className="text-[13px] text-[#1D2129]">两个在线点渠道由系统固定归属</strong><p className="mt-1 text-[12px] leading-5 text-[#667085]">抖音在线点、美团在线点将分别进入同名商品库，本次初始化不可改名或调整渠道；其他渠道仍可按团队职责配置。</p></div></div>}

                {mode === 'unified' ? (
                  <div className="mt-5 rounded-lg border border-[#8BD7AE] bg-[#F7FFFA] p-4">
                    <div className="flex items-start justify-between gap-4"><div><strong className="text-[13px] text-[#1D2129]">现有主档商品将自动加入默认商品库</strong><p className="mt-1 text-[12px] leading-5 text-[#667085]">系统将为全部 {products.length} 个现有商品主档建立渠道商品引用，名称、图片、前台分类和商品结构按继承规则生成。</p></div><span className="shrink-0 rounded bg-white px-3 py-1.5 text-[12px] font-medium text-[#008F53]">{products.length} 个商品</span></div>
                    <div className="mt-3 border-t border-[#DDF1E6] pt-3 text-[12px] text-[#667085]">只完成商品准备，不创建发布任务，不改变门店或三方平台当前商品状态。</div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-lg border border-[#B8DBFF] bg-[#F7FAFF] p-4">
                    <div className="flex items-start justify-between gap-4"><div><strong className="text-[13px] text-[#1D2129]">{legacyOnlineOrder ? '在线点历史商品将在初始化后迁移' : '初始化阶段暂不添加主档商品'}</strong><p className="mt-1 text-[12px] leading-5 text-[#667085]">{legacyOnlineOrder ? '系统将把抖音历史商品迁入对应商品库，并根据现有美团模板和门店商品生成美团渠道商品；其他商品库暂不批量添加主档商品。' : '本次只建立商品库并保存渠道归属。启用后，各渠道团队进入自己负责的商品库，从商品主档按需选择经营商品。'}</p></div><span className="shrink-0 rounded bg-white px-3 py-1.5 text-[12px] font-medium text-[#245B8A]">{legacyOnlineOrder ? '后台迁移' : '0 个商品'}</span></div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#DCEAF7] pt-3 text-[12px] text-[#4E6A85]">{legacyOnlineOrder ? <><span>1. 创建专属商品库</span><span>2. 迁移历史商品</span><span>3. 校验映射关系</span></> : <><span>1. 完成品牌初始化</span><span>2. 进入对应商品库</span><span>3. 从主档选择商品</span></>}</div>
                  </div>
                )}

                <div className="mt-5 rounded-lg border border-[#E5E6EB]">
                  <div className="flex items-center justify-between border-b border-[#EEF1F4] bg-[#FAFBFC] px-4 py-3"><div className="flex items-center gap-2"><Database size={16} className="text-[#00A35B]" /><strong className="text-[13px] text-[#1D2129]">{mode === 'unified' ? '品牌默认商品库' : `渠道商品库（${catalogs.length} 个）`}</strong></div><span className="text-[12px] text-[#86909C]">共 {ALL_OMNICHANNEL_CHANNELS.length} 个渠道待归属</span></div>
                  {mode === 'unified' ? (
                    <div className="p-4"><div className="rounded-md border border-[#8BD7AE] bg-[#F2FFF8] p-4"><div className="flex items-center justify-between"><strong className="text-[14px] text-[#008F53]">品牌默认商品库</strong><span className="text-[12px] text-[#667085]">系统自动创建</span></div><div className="mt-3 flex flex-wrap gap-2">{ALL_OMNICHANNEL_CHANNELS.map(channel => <span key={channel.id} className="rounded bg-white px-2 py-1 text-[11px] text-[#4E5969]">{channel.shortName}</span>)}</div></div></div>
                  ) : (
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-3">{catalogs.map(catalog => { const locked = legacyOnlineOrder && LOCKED_LEGACY_CATALOG_IDS.includes(catalog.id); return <div key={catalog.id} className={`rounded-md border p-3 ${locked ? 'border-[#B8E2CD] bg-[#F7FFFA]' : 'border-[#E5E6EB]'}`}><div className="flex items-center gap-2"><input value={catalog.name} disabled={locked} onChange={event => setCatalogs(current => current.map(item => item.id === catalog.id ? { ...item, name: event.target.value } : item))} className={`h-8 w-full rounded border px-2 text-[13px] font-medium outline-none ${locked ? 'cursor-not-allowed border-transparent bg-transparent text-[#087A49]' : 'border-[#DDE2E8] text-[#1D2129] focus:border-[#00B460]'}`} />{locked && <LockKeyhole size={13} className="shrink-0 text-[#008F53]" />}</div><div className="mt-2 text-[11px] text-[#98A2B3]">{locked ? '系统创建 · 渠道固定' : `已分配 ${catalog.channels.length} 个渠道`}</div></div>; })}</div>
                      <div className="mt-4 overflow-hidden rounded-md border border-[#EEF1F4]"><div className="grid grid-cols-[1fr_180px_260px] bg-[#F7F8FA] px-4 py-2 text-[12px] font-medium text-[#667085]"><span>渠道</span><span>渠道类型</span><span>所属渠道商品库</span></div>{ALL_OMNICHANNEL_CHANNELS.map(channel => { const catalog = catalogs.find(item => item.channels.includes(channel.id)); const locked = legacyOnlineOrder && LOCKED_LEGACY_CHANNELS.includes(channel.id); const selectableCatalogs = legacyOnlineOrder && !locked ? catalogs.filter(item => !LOCKED_LEGACY_CATALOG_IDS.includes(item.id)) : catalogs; return <div key={channel.id} className={`grid grid-cols-[1fr_180px_260px] items-center border-t border-[#EEF1F4] px-4 py-2.5 text-[12px] ${locked ? 'bg-[#FAFFFC]' : ''}`}><strong className="flex items-center gap-2 text-[#344054]">{channel.name}{locked && <span className="inline-flex items-center rounded bg-[#EAF8F1] px-1.5 py-0.5 text-[10px] font-normal text-[#087A49]"><LockKeyhole size={10} className="mr-1" />固定归属</span>}</strong><span className="text-[#86909C]">{channel.type === 'private' ? '自营渠道' : '三方渠道'}</span><select value={catalog?.id || ''} disabled={locked} onChange={event => assignChannel(channel.id, event.target.value)} className={`h-8 rounded-md border px-2 text-[12px] outline-none ${locked ? 'cursor-not-allowed border-[#DDEFE5] bg-[#F2F8F5] text-[#667085]' : 'border-[#DDE2E8] bg-white text-[#344054] focus:border-[#00B460]'}`}><option value="">请选择商品库</option>{selectableCatalogs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>; })}</div>
                    </div>
                  )}
                </div>

                {!allChannelsAssigned && <div className="mt-4 rounded-md border border-[#FFD7A8] bg-[#FFF9F0] px-4 py-3 text-[12px] text-[#9A5A16]">仍有渠道未分配商品库，完成分配后才能继续。</div>}
              </div>
            )}

            {step === 3 && mode && (
              <div className="mx-auto max-w-[920px]">
                <div><h2 className="text-[17px] font-bold text-[#1D2129]">确认并启用全渠道商品管理</h2><p className="mt-1 text-[12px] text-[#86909C]">提交后将创建后台初始化任务，全部成功后才正式启用。</p></div>
                <div className="mt-5 overflow-hidden rounded-lg border border-[#E5E6EB]"><div className="grid grid-cols-2 gap-px bg-[#EEF1F4]">{[
                  ['管理方式', mode === 'unified' ? '统一管理' : '分渠道协作'],
                  ['渠道建品方式', creationMode === 'create_master_and_channel' ? '允许联合创建' : '仅从主档添加'],
                  ['渠道商品库', `${effectiveCatalogs.length} 个`],
                  ['已归属渠道', `${ALL_OMNICHANNEL_CHANNELS.length} 个`],
                  [legacyOnlineOrder ? '历史在线点渠道' : '加入主档商品', legacyOnlineOrder ? '抖音在线点、美团在线点' : `${selectedProductCount} 个`],
                  [legacyOnlineOrder ? '历史商品处理' : '预计生成渠道商品', legacyOnlineOrder ? '创建 2 个后台迁移任务' : `${channelProductCount} 条`],
                ].map(([label, value]) => <div key={label} className="bg-white px-5 py-4"><span className="text-[12px] text-[#98A2B3]">{label}</span><strong className="ml-3 text-[13px] text-[#1D2129]">{value}</strong></div>)}</div></div>
                <div className="mt-5 rounded-md border border-[#B8DBFF] bg-[#F2F8FF] p-4"><strong className="text-[13px] text-[#245B8A]">本次初始化的数据处理</strong>{mode === 'unified' ? <ul className="mt-2 space-y-1 text-[12px] leading-5 text-[#4E6A85]"><li>• 全部现有商品主档加入品牌默认商品库，只建立渠道商品引用。</li><li>• 名称、图片、前台分类、规格结构和规格售价按现有继承规则生成。</li><li>• 渠道独有资料可在初始化后继续完善；本次不会自动发布到门店或平台。</li></ul> : legacyOnlineOrder ? <ul className="mt-2 space-y-1 text-[12px] leading-5 text-[#4E6A85]"><li>• 创建并锁定抖音在线点、美团在线点两个专属渠道商品库。</li><li>• 抖音历史品牌商品、加料和门店商品从平台服务迁移；门店加料随门店商品生成。</li><li>• 美团根据现有模板和门店商品生成渠道商品；初始化不会同步或改变平台线上商品。</li></ul> : <ul className="mt-2 space-y-1 text-[12px] leading-5 text-[#4E6A85]"><li>• 本次只创建渠道商品库并保存每个渠道的商品库归属。</li><li>• 不批量复制或添加现有商品主档，避免不同渠道团队产生无效商品。</li><li>• 启用后由各渠道团队在有权商品库中按需从商品主档添加。</li></ul>}</div>
                <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-md border border-[#E5E6EB] p-4 text-[12px] leading-5 text-[#4E5969]"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#00B460]" /><span>我已确认上述管理方式、渠道商品库及商品范围。初始化完成前不会启用新的渠道商品库。</span></label>
              </div>
            )}
          </div>

          <div className="flex h-[64px] shrink-0 items-center justify-between border-t border-[#E5E6EB] bg-[#FAFBFC] px-6">
            <span className="text-[12px] text-[#98A2B3]">可随时返回商品设置；未提交前不会产生渠道商品数据。</span>
            <div className="flex gap-2">
              {step > 1 && <button type="button" onClick={() => setStep(current => (current - 1) as 1 | 2)} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]">上一步</button>}
              {step < 3 ? <button type="button" disabled={step === 1 ? !mode : !canContinueStep2} onClick={() => setStep(current => (current + 1) as 2 | 3)} className="inline-flex h-9 items-center rounded-md bg-[#00B460] px-5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#C9CDD4]">下一步<ChevronRight size={15} className="ml-1" /></button> : <button type="button" disabled={!confirmed} onClick={() => { setProgress(8); setStatus('running'); }} className="inline-flex h-9 items-center rounded-md bg-[#1D2129] px-5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#C9CDD4]">确认并开始初始化<ArrowRight size={15} className="ml-1.5" /></button>}
            </div>
          </div>
        </section>
      </div>

    </main>
  );
};
