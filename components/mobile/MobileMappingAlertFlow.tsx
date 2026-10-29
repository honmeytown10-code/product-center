import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  LoaderCircle,
  PackageSearch,
  Search,
} from 'lucide-react';
import './mappingAlerts.css';
import { advanceDemoTask, DEMO_STORAGE_KEY, DemoScenario, DemoState, DemoTask, emptyDemoState, pairKey, readDemoState, SkuPair, taskCounts, taskLabel, writeDemoState } from './mappingAlertDemo';
import { MobileAlertDistribution } from './MobileAlertDistribution';

type FlowScreen = 'alerts' | 'detail' | 'picker' | 'batch' | 'result' | 'tasks' | 'distribution';
type TriggerScene = 'order' | 'operation';
type MappingMode = 'qimai-managed' | 'platform-sku' | 'brand-code';
const TRADEMARK_BINDING_FLAG = 'Goods.bindME.by TradeMark';

interface MappingAlert {
  id: string;
  storeId: string;
  channelId: string;
  platformSkuId: string;
  qimaiSkuId?: string;
  resolution?: 'distribute';
  scene: TriggerScene;
  mappingMode: Exclude<MappingMode, 'brand-code'>;
  brandFlags?: { [TRADEMARK_BINDING_FLAG]: boolean };
  sourceTradeMark?: string;
  operationIssue?: 'local-unmapped' | 'platform-mapping-lost';
  title: string;
  meta: string;
  impact: string;
  since: string;
  repeated: string;
  sourceName: string;
  sourceSpec: string;
  sourceCode: string;
  operation?: string;
}

interface Candidate {
  id: string;
  name: string;
  spec: string;
  code: string;
  category: string;
  score: number;
}

interface StoreMapping {
  id: string;
  name: string;
  state: 'current' | 'bound' | 'matchable' | 'missing' | 'ambiguous' | 'no-data' | 'exempt' | 'no-permission';
  platformProduct?: string;
  platformSkuId?: string;
  platformSpec?: string;
  qimaiSkuId?: string;
}

const ALERTS: MappingAlert[] = [
  {
    id: 'AL202610290039', storeId: 'store-8', channelId: 'meituan', platformSkuId: 'MT-99238039',
    scene: 'order', mappingMode: 'qimai-managed', brandFlags: { [TRADEMARK_BINDING_FLAG]: true }, sourceTradeMark: 'COFFEE-SILKY-ICE',
    title: '接单异常，门店未找到商品标识', meta: '杭州湖滨店 · 美团外卖',
    impact: '订单已携带商品标识，先查商品库，查到后添加到本店渠道。',
    since: '已告警 2 分钟', repeated: '今日第 1 次', sourceName: '生椰丝绒拿铁', sourceSpec: '大杯 · 冰', sourceCode: '',
  },
  {
    id: 'AL202610290040', storeId: 'store-8', channelId: 'meituan', platformSkuId: 'MT-99238040',
    scene: 'order', mappingMode: 'qimai-managed', brandFlags: { [TRADEMARK_BINDING_FLAG]: true }, sourceTradeMark: 'COFFEE-UNKNOWN-ICE',
    title: '接单异常，商品标识未匹配', meta: '杭州湖滨店 · 美团外卖',
    impact: '本店渠道和商品库均未匹配到对应标识，检查企迈商品侧维护值。',
    since: '已告警 3 分钟', repeated: '今日第 1 次', sourceName: '桂花乌龙拿铁', sourceSpec: '大杯 · 冰', sourceCode: '',
  },
  {
    id: 'AL202610290041', storeId: 'store-3', channelId: 'taobao', platformSkuId: 'ELM-99238041',
    scene: 'order', mappingMode: 'qimai-managed', brandFlags: { [TRADEMARK_BINDING_FLAG]: true },
    title: '接单异常，订单未携带商品标识', meta: '上海南京路旗舰店 · 淘宝闪购',
    impact: '订单没有商品标识，只能引导检查平台商品侧是否正确维护。',
    since: '已告警 5 分钟', repeated: '今日第 2 次', sourceName: '生椰拿铁', sourceSpec: '大杯 · 冰', sourceCode: '',
  },
  {
    id: 'AL202610290042', storeId: 'store-4', channelId: 'taobao', platformSkuId: 'ELM-5202116', qimaiSkuId: '735202116',
    scene: 'operation', mappingMode: 'qimai-managed', brandFlags: { [TRADEMARK_BINDING_FLAG]: true },
    title: '下架失败，企迈商品未维护商品标识', meta: '上海静安寺店 · 淘宝闪购',
    impact: '企迈商品侧没有商品标识，需先检查企迈商品资料。',
    since: '已告警 6 分钟', repeated: '今日第 1 次', sourceName: '轻乳茶', sourceSpec: '中杯 · 少冰', sourceCode: '', operation: '下架商品',
  },
  {
    id: 'AL202610150036', storeId: 'store-8', channelId: 'meituan', platformSkuId: 'MT-99238011', qimaiSkuId: '623802011',
    scene: 'order', mappingMode: 'platform-sku', resolution: 'distribute',
    title: '接单异常，门店渠道缺少商品', meta: '杭州湖滨店 · 美团外卖',
    impact: '先按商品 skuid 查询商品库，查到后添加到告警门店及渠道。',
    since: '已告警 5 分钟', repeated: '今日第 2 次', sourceName: '生椰丝绒拿铁', sourceSpec: '大杯 · 冰',
    sourceCode: '商品 skuid 623802011',
  },
  {
    id: 'AL202610200037', storeId: 'store-8', channelId: 'meituan', platformSkuId: 'MT-99238999', qimaiSkuId: '623899999',
    scene: 'order', mappingMode: 'platform-sku', resolution: 'distribute',
    title: '接单异常，商品 skuid 未找到商品', meta: '杭州湖滨店 · 美团外卖',
    impact: '商品 skuid 在门店和商品库均未找到商品，需要检查 skuid。',
    since: '已告警 3 分钟', repeated: '今日第 1 次', sourceName: '生椰丝绒拿铁', sourceSpec: '大杯 · 冰',
    sourceCode: '商品 skuid 623899999',
  },
  {
    id: 'AL202610070018',
    storeId: 'store-current', channelId: 'meituan', platformSkuId: 'MT-88231014',
    scene: 'order',
    mappingMode: 'qimai-managed',
    title: '接单异常，平台商品未绑定',
    meta: '北京国贸店 · 美团外卖',
    impact: '影响接单后的商品识别、杯贴打印、BOM 扣减与商品统计',
    since: '已告警 18 分钟',
    repeated: '今日第 6 次',
    sourceName: '生椰拿铁（大杯 / 冰）',
    sourceSpec: '大杯 · 冰',
    sourceCode: '平台商品编码 MT-88231014',
  },
  {
    id: 'AL202610070021',
    storeId: 'store-current', channelId: 'meituan', platformSkuId: 'MT-88231014', qimaiSkuId: '623801955',
    scene: 'operation',
    mappingMode: 'qimai-managed',
    operationIssue: 'local-unmapped',
    title: '沽清失败，商品未映射',
    meta: '北京国贸店 · 美团外卖',
    impact: '本次沽清未在平台生效，可能继续产生不可履约订单',
    since: '已告警 7 分钟',
    repeated: '今日第 2 次',
    sourceName: '生椰拿铁',
    sourceSpec: '大杯 · 冰',
    sourceCode: '企迈 skuid 623801955',
    operation: '沽清 · 库存设为 0',
  },
  {
    id: 'AL202610070024',
    storeId: 'store-4', channelId: 'taobao', platformSkuId: 'ELM-5202116', qimaiSkuId: '735202116',
    scene: 'operation',
    mappingMode: 'qimai-managed',
    operationIssue: 'local-unmapped',
    title: '下架失败，商品未映射',
    meta: '上海静安寺店 · 淘宝闪购',
    impact: '企迈尚未建立映射，本次下架未执行',
    since: '已告警 12 分钟',
    repeated: '今日第 1 次',
    sourceName: '轻乳茶',
    sourceSpec: '中杯 · 少冰',
    sourceCode: '企迈 skuid 735202116',
    operation: '下架商品',
  },
  {
    id: 'AL202610280038', storeId: 'store-6', channelId: 'meituan', platformSkuId: 'MT-88236014', qimaiSkuId: '623801955',
    scene: 'operation', mappingMode: 'qimai-managed', operationIssue: 'platform-mapping-lost',
    title: '沽清失败，三方映射丢失', meta: '广州天河城店 · 美团外卖',
    impact: '企迈已有映射，调用三方平台返回找不到对应映射关系，需要重新映射。',
    since: '已告警 4 分钟', repeated: '今日第 1 次', sourceName: '生椰拿铁', sourceSpec: '大杯 · 冰',
    sourceCode: '企迈 skuid 623801955', operation: '沽清 · 库存设为 0',
  },
  {
    id: 'AL202610070028',
    storeId: 'store-8', channelId: 'douyin', platformSkuId: 'DY-80114260',
    scene: 'order',
    mappingMode: 'platform-sku',
    title: '接单异常，未找到对应企迈 SKU',
    meta: '杭州湖滨店 · 抖音在线点',
    impact: '该映射由平台商品字段维护，企迈没有可直接修改的映射记录',
    since: '已告警 25 分钟',
    repeated: '今日第 3 次',
    sourceName: '厚椰拿铁（大杯）',
    sourceSpec: '大杯 · 热',
    sourceCode: '平台已填企迈 SKU ID 80114260',
  },
  {
    id: 'AL202610070031',
    storeId: 'store-5', channelId: 'meituan', platformSkuId: 'MT-99235018',
    scene: 'operation',
    mappingMode: 'qimai-managed',
    brandFlags: { [TRADEMARK_BINDING_FLAG]: true },
    sourceTradeMark: 'COFFEE-OSM-018',
    qimaiSkuId: '623803018',
    operationIssue: 'local-unmapped',
    title: '库存同步失败，未找到对应 SKU',
    meta: '深圳万象天地店 · 美团外卖',
    impact: '该品牌按 SKU 级自有商品标识匹配，需核对企迈与平台两侧字段',
    since: '已告警 31 分钟',
    repeated: '今日第 2 次',
    sourceName: '桂花酒酿拿铁',
    sourceSpec: '大杯 · 冰',
    sourceCode: 'SKU 商品标识 COFFEE-OSM-018',
    operation: '修改库存为 200',
  },
];

const CANDIDATES: Record<TriggerScene, Candidate[]> = {
  order: [
    { id: 'sku-623801955', name: '生椰拿铁', spec: '大杯 / 冰', code: 'SKU 623801955', category: '咖啡 · 拿铁', score: 92 },
    { id: 'sku-623801972', name: '厚椰拿铁', spec: '大杯 / 冰', code: 'SKU 623801972', category: '咖啡 · 拿铁', score: 74 },
    { id: 'sku-623802011', name: '生椰丝绒拿铁', spec: '大杯 / 冰', code: 'SKU 623802011', category: '咖啡 · 特调', score: 61 },
    { id: 'sku-623802064', name: '燕麦拿铁', spec: '大杯 / 冰', code: 'SKU 623802064', category: '咖啡 · 拿铁', score: 45 },
  ],
  operation: [
    { id: 'mt-88231014', name: '生椰拿铁（大杯 / 冰）', spec: '大杯 · 冰', code: 'MT-88231014', category: '美团外卖 · 售卖中', score: 90 },
    { id: 'mt-88990021', name: '生椰拿铁（赠饮）', spec: '大杯', code: 'MT-88990021', category: '美团外卖 · 售卖中', score: 68 },
    { id: 'mt-88231088', name: '厚椰拿铁（大杯 / 冰）', spec: '大杯 · 冰', code: 'MT-88231088', category: '美团外卖 · 已下架', score: 55 },
  ],
};

const ALERT_CANDIDATES: Record<string, Candidate[]> = {
  AL202610290042: [{ id: 'elm-5202116', name: '轻乳茶（中杯 / 少冰）', spec: '中杯 · 少冰', code: 'ELM-5202116', category: '淘宝闪购 · 售卖中', score: 90 }],
  AL202610070031: [
    { id: 'mt-99235018', name: '桂花酒酿拿铁（大杯 / 冰）', spec: '大杯 · 冰', code: 'MT-99235018', category: '美团外卖 · 售卖中', score: 90 },
    { id: 'mt-99235019', name: '桂花酒酿拿铁（大杯 / 热）', spec: '大杯 · 热', code: 'MT-99235019', category: '美团外卖 · 售卖中', score: 70 },
  ],
  AL202610280038: [
    { id: 'mt-88336014', name: '生椰拿铁（大杯 / 冰）', spec: '大杯 · 冰', code: 'MT-88336014', category: '美团外卖 · 售卖中', score: 90 },
    { id: 'mt-88236014', name: '生椰拿铁（原映射商品）', spec: '大杯 · 冰', code: 'MT-88236014', category: '美团外卖 · 售卖中', score: 85 },
  ],
  AL202610070024: [
    { id: 'elm-735202116', name: '轻乳茶（中杯 / 少冰）', spec: '中杯 · 少冰', code: 'ELM-5202116', category: '淘宝闪购 · 售卖中', score: 94 },
    { id: 'elm-735202119', name: '轻乳茶（中杯 / 正常冰）', spec: '中杯 · 正常冰', code: 'ELM-5202119', category: '淘宝闪购 · 售卖中', score: 72 },
    { id: 'elm-735202125', name: '茉莉轻乳茶', spec: '中杯 · 少冰', code: 'ELM-5202125', category: '淘宝闪购 · 已下架', score: 58 },
  ],
};

const STORE_MAPPINGS: StoreMapping[] = [
  { id: 'store-current', name: '北京国贸店', state: 'current', platformProduct: '生椰拿铁（大杯 / 冰）', platformSkuId: 'MT-88231014', platformSpec: '大杯 · 冰', qimaiSkuId: '623801955' },
  { id: 'store-2', name: '北京三里屯店', state: 'matchable', platformProduct: '生椰拿铁（大杯 / 冰）', platformSkuId: 'MT-88232014', platformSpec: '大杯 · 冰', qimaiSkuId: '623801955' },
  { id: 'store-3', name: '上海南京路旗舰店', state: 'matchable', platformProduct: '生椰拿铁 大杯冰', platformSkuId: 'MT-88233014', platformSpec: '大杯 · 冰', qimaiSkuId: '623801955' },
  { id: 'store-4', name: '上海静安寺店', state: 'matchable', platformProduct: '生椰拿铁（大杯 / 冰）', platformSkuId: 'MT-88234014', platformSpec: '大杯 · 冰', qimaiSkuId: '623801955' },
  { id: 'store-5', name: '深圳万象天地店', state: 'ambiguous', platformProduct: '生椰拿铁（大杯）', platformSkuId: 'MT-88235014', platformSpec: '大杯 · 温度未确认' },
  { id: 'store-6', name: '广州天河城店', state: 'matchable', platformProduct: '生椰拿铁（大杯 / 冰）', platformSkuId: 'MT-88236014', platformSpec: '大杯 · 冰', qimaiSkuId: '623801955' },
  { id: 'store-7', name: '成都太古里店', state: 'missing' },
  { id: 'store-8', name: '杭州湖滨店', state: 'matchable', platformProduct: '生椰拿铁（大杯 / 冰）', platformSkuId: 'MT-88238014', platformSpec: '大杯 · 冰', qimaiSkuId: '623801955' },
  { id: 'store-9', name: '武汉江汉路店', state: 'no-data' },
  { id: 'store-10', name: '南京新街口店', state: 'exempt' },
  { id: 'store-11', name: '西安大雁塔店', state: 'bound', platformProduct: '生椰拿铁（大杯 / 冰）' },
  { id: 'store-12', name: '重庆解放碑店', state: 'no-permission' },
];

const Header: React.FC<{ title: string; onBack: () => void; disabled?: boolean }> = ({ title, onBack, disabled }) => (
  <header className="ma-header">
    <button onClick={onBack} disabled={disabled} className="ma-icon-button" aria-label="返回"><ArrowLeft size={21} /></button>
    <h1>{title}</h1>
  </header>
);

export const MobileMappingAlertFlow: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [screen, setScreen] = useState<FlowScreen>('alerts');
  const [activeAlert, setActiveAlert] = useState<MappingAlert>(ALERTS[0]);
  const [alertFilter, setAlertFilter] = useState<'all' | TriggerScene>('all');
  const [selectedCandidateId, setSelectedCandidateId] = useState(CANDIDATES.order[0].id);
  const [draftCandidateId, setDraftCandidateId] = useState(selectedCandidateId);
  const [search, setSearch] = useState('');
  const [selectedStores, setSelectedStores] = useState<Set<string>>(
    () => new Set(STORE_MAPPINGS.filter(item => item.state === 'matchable').map(item => item.id)),
  );
  const [showBatchPrompt, setShowBatchPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMode, setResultMode] = useState<'single' | 'batch'>('single');
  const [demo, setDemo] = useState<DemoState>(readDemoState);
  const demoRef = useRef(demo);
  const [taskId, setTaskId] = useState('');
  const [scenario, setScenario] = useState<DemoScenario>('normal');
  // Simulates the brand capability returned by the platform-product data service.
  const [hasAggregatedPlatformData, setHasAggregatedPlatformData] = useState(true);
  const [tradeMarkOverride, setTradeMarkOverride] = useState<'brand' | 'enabled' | 'disabled'>('brand');
  const [issue, setIssue] = useState('');
  const [crossStoreIssue, setCrossStoreIssue] = useState('');
  const failedOnce = useRef(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);
  const sheetRef = useRef<HTMLElement | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (submitTimer.current) clearTimeout(submitTimer.current);
  }, []);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== DEMO_STORAGE_KEY) return;
      const next = readDemoState();
      demoRef.current = next;
      setDemo(next);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (!showBatchPrompt) return;
    const previous = document.activeElement as HTMLElement | null;
    const sheet: HTMLElement | null = sheetRef.current;
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !sheet) return;
      const buttons = Array.from(sheet.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    sheet?.querySelector<HTMLButtonElement>('button')?.focus();
    sheet?.addEventListener('keydown', trap);
    return () => { sheet?.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus(); };
  }, [showBatchPrompt]);

  const mappingModeFor = (item: MappingAlert): MappingMode => {
    const meEleme = item.channelId === 'meituan' || item.channelId === 'taobao';
    const byTradeMark = tradeMarkOverride === 'brand' ? item.brandFlags?.[TRADEMARK_BINDING_FLAG] === true : tradeMarkOverride === 'enabled';
    return meEleme && byTradeMark ? 'brand-code' : item.mappingMode;
  };
  const mappingMode = mappingModeFor(activeAlert);
  const shouldDistribute = (item: MappingAlert) => item.scene === 'order' && (mappingModeFor(item) === 'brand-code'
    ? !!item.sourceTradeMark?.trim() : item.resolution === 'distribute' && !!item.qimaiSkuId);
  const alertTitle = (item: MappingAlert) => mappingModeFor(item) === 'brand-code'
    ? item.title.split('，')[0] + (item.sourceTradeMark?.trim() ? '，商品标识未匹配' : item.scene === 'order' ? '，订单未携带商品标识' : '，企迈商品未维护商品标识') : item.title;
  const direct = mappingMode === 'qimai-managed';
  const repairingMapping = direct && activeAlert.operationIssue === 'platform-mapping-lost';
  const candidates = ALERT_CANDIDATES[activeAlert.id] ?? CANDIDATES[activeAlert.scene];
  const selectedCandidate = candidates.find(item => item.id === selectedCandidateId) ?? candidates[0];
  const storeName = activeAlert.meta.split(' · ')[0];
  const platformName = activeAlert.meta.split(' · ')[1];
  const channelId = activeAlert.channelId;
  const currentPair: SkuPair = {
    storeId: activeAlert.storeId, storeName, channelId,
    platformSkuId: activeAlert.scene === 'order' ? activeAlert.platformSkuId : selectedCandidate.code,
    platformName: activeAlert.scene === 'order' ? activeAlert.sourceName : selectedCandidate.name,
    platformSpec: activeAlert.scene === 'order' ? activeAlert.sourceSpec : selectedCandidate.spec,
    qimaiSkuId: activeAlert.scene === 'order' ? selectedCandidate.code.replace('SKU ', '') : activeAlert.qimaiSkuId!,
    qimaiName: activeAlert.scene === 'order' ? selectedCandidate.name : activeAlert.sourceName,
    qimaiSpec: activeAlert.scene === 'order' ? selectedCandidate.spec : activeAlert.sourceSpec,
  };
  const sourceRelation = (item: MappingAlert, state: DemoState = demo): SkuPair | undefined => {
    if (mappingModeFor(item) !== 'qimai-managed') return undefined;
    // An existing Qimai record alone does not resolve a third-party mapping failure.
    if (item.operationIssue === 'platform-mapping-lost') {
      const repair = state.mappingRepairs[item.id];
      const saved = repair && state.relations[pairKey(repair)];
      return saved?.qimaiSkuId === item.qimaiSkuId ? saved : undefined;
    }
    return Object.values(state.relations).find(pair => pair.storeId === item.storeId
      && pair.channelId === item.channelId
      && (item.scene === 'order' ? pair.platformSkuId === item.platformSkuId : pair.qimaiSkuId === item.qimaiSkuId));
  };
  const boundRelation = sourceRelation(activeAlert);
  const currentStoreBound = !!boundRelation;
  const currentTask = demo.tasks.find(item => item.id === taskId);
  const latestTask = demo.tasks.find(item => item.alertId === activeAlert.id);
  const pendingCurrentTask = demo.tasks.find(task => task.rows.some(row => row.status === 'waiting' && pairKey(row) === pairKey(currentPair)));
  const restricted = scenario === 'read-only' || scenario === 'exempt' || scenario === 'expired';
  const canBatch = direct && activeAlert.scene === 'order' && hasAggregatedPlatformData && selectedCandidate.id === candidates[0].id && !restricted && !crossStoreIssue && !(issue && scenario === 'conflict');
  const storePair = (store: StoreMapping): SkuPair => ({
    ...currentPair, storeId: store.id, storeName: store.name,
    platformSkuId: store.platformSkuId!, platformName: store.platformProduct!, platformSpec: store.platformSpec!, qimaiSkuId: store.qimaiSkuId!,
    qimaiName: '生椰拿铁', qimaiSpec: '大杯 · 冰',
  });
  const storeStatus = (store: StoreMapping) => {
    if (store.state === 'current') return currentStoreBound ? 'bound' : pendingCurrentTask ? 'pending' : 'current';
    if (store.state !== 'matchable') return store.state;
    if (demo.relations[pairKey(storePair(store))]) return 'bound';
    if (demo.tasks.some(task => task.rows.some(row => pairKey(row) === pairKey(storePair(store)) && row.status === 'waiting'))) return 'pending';
    return 'matchable';
  };
  const matchableStores = canBatch ? STORE_MAPPINGS.filter(item => storeStatus(item) === 'matchable') : [];
  const selectedEligibleStores = matchableStores.filter(item => selectedStores.has(item.id));
  const batchCount = selectedEligibleStores.length + (!currentStoreBound && !pendingCurrentTask && !restricted ? 1 : 0);
  const unboundStores = STORE_MAPPINGS.filter(item => storeStatus(item) === 'current' || storeStatus(item) === 'matchable');
  const visibleAlerts = ALERTS.filter(item => alertFilter === 'all' || item.scene === alertFilter);
  const filteredCandidates = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return candidates.filter(item => !keyword || (item.name + item.spec + item.code).toLowerCase().includes(keyword));
  }, [candidates, search]);

  const flash = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  };
  const save = (value: DemoState) => {
    demoRef.current = value;
    setDemo(value);
    if (!writeDemoState(value)) flash('浏览器无法保存，离开后可能丢失演示记录');
  };
  const latestState = () => {
    // Use in-memory state if browser persistence is unavailable.
    try { if (localStorage.getItem(DEMO_STORAGE_KEY)) return readDemoState(); } catch { /* use memory */ }
    return demoRef.current;
  };
  const viewTask = (task: DemoTask) => { setTaskId(task.id); setResultMode('batch'); setScreen('result'); };

  const openAlert = (alertItem: MappingAlert) => {
    setActiveAlert(alertItem);
    const relation = sourceRelation(alertItem, demoRef.current);
    const choices = ALERT_CANDIDATES[alertItem.id] ?? CANDIDATES[alertItem.scene];
    setSelectedCandidateId(choices.find(item => alertItem.scene === 'order' ? item.code === 'SKU ' + relation?.qimaiSkuId : item.code === relation?.platformSkuId)?.id ?? choices[0].id);
    setSearch('');
    setSelectedStores(new Set(STORE_MAPPINGS.filter(item => item.state === 'matchable').map(item => item.id)));
    setShowBatchPrompt(false);
    setIssue('');
    setCrossStoreIssue('');
    failedOnce.current = false;
    setScreen(shouldDistribute(alertItem) ? 'distribution' : 'detail');
  };

  const openPicker = () => {
    setDraftCandidateId(selectedCandidateId);
    setSearch('');
    setScreen('picker');
  };

  const finishSingle = () => {
    setShowBatchPrompt(false);
    setResultMode('single');
    setScreen('result');
  };

  const submit = (done: () => void) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    submitTimer.current = setTimeout(() => {
      submittingRef.current = false;
      setSubmitting(false);
      done();
    }, 500);
  };

  const completeCurrentStore = () => {
    if (currentStoreBound) return finishSingle();
    if (!direct || restricted) return;
    submit(() => {
      const state = latestState();
      if (scenario === 'error' && !failedOnce.current) {
        failedOnce.current = true; setIssue('网络请求失败，未保存绑定。请重试。'); return;
      }
      if (scenario === 'conflict') {
        save({ ...state, relations: { ...state.relations, [pairKey(currentPair)]: { ...currentPair, qimaiSkuId: '623801972', qimaiName: '厚椰拿铁' } } });
        setIssue('其他人员已绑定至厚椰拿铁，未覆盖。请到 PC 核对或换绑。'); return;
      }
      const existing = state.relations[pairKey(currentPair)];
      if (existing && existing.qimaiSkuId !== currentPair.qimaiSkuId) {
        save(state); setIssue('该平台 SKU 已有其他绑定，未覆盖。请到 PC 核对或换绑。'); return;
      }
      if (state.tasks.some(task => task.rows.some(row => row.status === 'waiting' && pairKey(row) === pairKey(currentPair)))) {
        save(state); setIssue('该 SKU 已在绑定任务中，请先查看任务结果。'); return;
      }
      const relations = { ...state.relations };
      if (repairingMapping) {
        const previousKey = pairKey({ ...currentPair, platformSkuId: activeAlert.platformSkuId });
        const previous = relations[previousKey];
        if (previous && previous.qimaiSkuId !== activeAlert.qimaiSkuId) {
          save(state); setIssue('原映射已被其他人员修改，请返回告警重新确认。'); return;
        }
        if (previousKey !== pairKey(currentPair)) delete relations[previousKey];
      }
      relations[pairKey(currentPair)] = currentPair;
      save({ ...state, relations, mappingRepairs: repairingMapping ? { ...state.mappingRepairs, [activeAlert.id]: currentPair } : state.mappingRepairs });
      setIssue('');
      if (canBatch && matchableStores.length) setShowBatchPrompt(true);
      else finishSingle();
    });
  };

  const createBatchTask = (ids: string[] = Array.from(selectedStores)) => {
    if (!canBatch) return;
    const rows = STORE_MAPPINGS.filter(store => ids.includes(store.id) && storeStatus(store) === 'matchable').map(storePair);
    if (!currentStoreBound && !pendingCurrentTask) rows.unshift(currentPair);
    if (!rows.length) return;
    submit(() => {
      const state = latestState();
      if (scenario === 'error' && !failedOnce.current) {
        failedOnce.current = true; setIssue('任务提交失败，所选门店已保留。请重试。'); return;
      }
      const validRows = rows.filter(row => !state.relations[pairKey(row)]
        && !state.tasks.some(task => task.rows.some(other => pairKey(other) === pairKey(row) && other.status === 'waiting')));
      if (validRows.length !== rows.length) { save(state); setIssue('部分门店映射已变化，已更新可选范围。请重新确认。'); return; }
      const task: DemoTask = { id: 'MAP' + Date.now(), alertId: activeAlert.id, createdAt: Date.now(), round: 0, rows: validRows.map(row => ({ ...row, status: 'waiting' })) };
      save({ ...state, tasks: [task, ...state.tasks] });
      setTaskId(task.id);
      setIssue('');
      setShowBatchPrompt(false);
      setResultMode('batch');
      setScreen('result');
    });
  };

  const copyIdentifier = async (value: string) => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      flash('已复制');
    } catch {
      flash('复制失败，请手动复制');
    }
  };
  const retryFailed = () => {
    if (!currentTask || restricted) return;
    submit(() => {
      const state = latestState();
      const task = state.tasks.find(item => item.id === currentTask.id);
      if (!task) return;
      save({ ...state, tasks: state.tasks.map(item => item.id === task.id ? { ...task, round: 1,
        rows: task.rows.map(row => row.status === 'failed' && !state.relations[pairKey(row)]
          ? { ...row, status: 'waiting', retried: true, reason: undefined } : row),
      } : item) });
    });
  };

  const renderAlerts = () => (
    <>
      <Header title="告警中心" onBack={onBack} />
      <div className="ma-content">
        {demo.tasks.length + demo.distributions.length > 0 && <button className="ma-cross-stores ma-task-entry" onClick={() => setScreen('tasks')}><span><strong>处理任务</strong><small>{demo.tasks.filter(task => taskCounts(task).waiting).length + demo.distributions.filter(task => task.status === 'waiting').length} 个处理中</small></span><ChevronRight size={17} /></button>}
        <nav className="ma-tabs" aria-label="告警场景">
          {([
            ['all', '全部'],
            ['order', '接单异常'],
            ['operation', '商品操作'],
          ] as const).map(([id, label]) => (
            <button key={id} className={alertFilter === id ? 'is-active' : ''} aria-pressed={alertFilter === id} onClick={() => setAlertFilter(id)}>
              {label}{id === 'all' ? ' ' + ALERTS.length : ''}
            </button>
          ))}
        </nav>
        <div className="ma-alert-list">
          {visibleAlerts.map(item => (
            <button key={item.id} data-alert-id={item.id} className="ma-alert-item" onClick={() => openAlert(item)}>
              <div className="ma-alert-meta"><span>重要</span><span>{item.since}</span><span>{item.repeated}</span></div>
              <h2>{alertTitle(item)}</h2>
              <p className="ma-alert-product">{item.sourceName.replace(/（.*）/, '')} · {item.sourceSpec}</p>
              <div className="ma-alert-bottom">
                <span>{item.meta}</span>
                <span className="ma-link">{shouldDistribute(item) ? demo.distributions.some(task => task.alertId === item.id) ? '查看结果' : '去处理' : mappingModeFor(item) === 'brand-code' ? '查看指引' : sourceRelation(item) ? '查看绑定' : mappingModeFor(item) === 'qimai-managed' ? '去处理' : '查看指引'}<ChevronRight size={14} /></span>
              </div>
            </button>
          ))}
        </div>
        <details className="ma-demo-options">
          <summary>原型演示选项</summary>
          <label>当前门店场景<select aria-label="演示场景" value={scenario} onChange={event => setScenario(event.target.value as DemoScenario)}>
            <option value="normal">正常处理</option><option value="read-only">仅查看，无绑定权限</option><option value="exempt">商品已设免绑定</option><option value="conflict">提交时被他人绑定</option><option value="error">首次提交网络失败</option><option value="expired">平台授权失效</option>
            <option value="library-error">商品库查询失败</option>
          </select></label>
          <label>品牌平台商品数据<select aria-label="品牌平台商品数据" value={hasAggregatedPlatformData ? 'aggregated' : 'current-store-only'} onChange={event => setHasAggregatedPlatformData(event.target.value === 'aggregated')}><option value="aggregated">已聚合各门店平台商品</option><option value="current-store-only">未聚合，仅当前门店数据</option></select></label>
          <label>美团／饿了么匹配方式<select aria-label="按商品标识开关" value={tradeMarkOverride} onChange={event => setTradeMarkOverride(event.target.value as typeof tradeMarkOverride)}><option value="brand">读取告警所属品牌配置</option><option value="enabled">按商品标识（开关开启）</option><option value="disabled">商品绑定（开关关闭）</option></select></label>
          <p>对应开关：{TRADEMARK_BINDING_FLAG}</p>
          <p>仅模拟交互，任务与绑定记录保存在本浏览器，不连接生产系统。</p>
          <button className="ma-link" onClick={() => { save(emptyDemoState()); setScenario('normal'); setHasAggregatedPlatformData(true); setTradeMarkOverride('brand'); setTaskId(''); flash('演示记录已重置'); }}>重置演示记录</button>
        </details>
      </div>
    </>
  );

  const renderSource = () => (
    <section className="ma-section">
      <h2 className="ma-section-label">{activeAlert.scene === 'order' ? '平台商品' : '企迈商品'}</h2>
      <div className="ma-product-row">
        <div className="ma-product-image"><PackageSearch size={23} /></div>
        <div className="ma-product-copy">
          <h3>{activeAlert.sourceName}</h3>
          <p>规格：{activeAlert.sourceSpec}</p>
          <div className="ma-code-row">
            <span>{mappingMode === 'brand-code' ? activeAlert.sourceTradeMark?.trim() ? '商品标识：' + activeAlert.sourceTradeMark : activeAlert.scene === 'order' ? '订单未携带商品标识' : '商品标识：未维护' : activeAlert.sourceCode}</span>
          </div>
          {repairingMapping && <p>原映射平台 skuid：{activeAlert.platformSkuId}</p>}
        </div>
      </div>
    </section>
  );

  const renderCandidate = () => (
    <section className="ma-section">
      <div className="ma-section-heading">
        <h2 className="ma-section-label">{activeAlert.scene === 'order' ? '匹配企迈商品' : repairingMapping ? '重新映射平台商品' : '匹配平台商品'}</h2>
        {!currentStoreBound && !pendingCurrentTask && !restricted && <button className="ma-link" onClick={openPicker}>换一个<ChevronRight size={14} /></button>}
      </div>
      <div className="ma-candidate">
        <div className="ma-candidate-title"><h3>{boundRelation ? (activeAlert.scene === 'order' ? boundRelation.qimaiName : boundRelation.platformName) : selectedCandidate.name}</h3><span>{currentStoreBound ? '已绑定' : selectedCandidate.id === candidates[0].id ? '推荐匹配' : '手动选择'}</span></div>
        <p>规格：{boundRelation ? (activeAlert.scene === 'order' ? boundRelation.qimaiSpec : boundRelation.platformSpec) : selectedCandidate.spec}</p>
        <p className="ma-secondary">{boundRelation ? (activeAlert.scene === 'order' ? 'SKU ' + boundRelation.qimaiSkuId : boundRelation.platformSkuId) : selectedCandidate.code}</p>
      </div>
      {!currentStoreBound && selectedCandidate.id !== candidates[0].id && <p className="ma-footnote ma-unavailable">请确认名称与完整规格。{activeAlert.scene === 'order' && '其他门店不沿用本次选择。'}</p>}
      {activeAlert.scene === 'operation' && !currentStoreBound && !restricted && (
        <div className="ma-sync-row">
          <span>当前门店平台商品</span>
          <button className="ma-link" disabled={submitting} onClick={() => submit(() => {
            if (scenario === 'error' && !failedOnce.current) { failedOnce.current = true; setIssue('平台商品获取失败，请重试。'); }
            else { setIssue(''); flash('演示商品数据已刷新'); }
          })}>刷新商品</button>
        </div>
      )}
    </section>
  );

  const renderCrossStores = () => canBatch && matchableStores.length > 0 ? (
    <button className="ma-cross-stores" disabled={!matchableStores.length || submitting} onClick={() => { setIssue(''); setScreen('batch'); }}>
      <span><strong>其他门店</strong><small>{matchableStores.length} 家可绑定</small></span>
      <ChevronRight size={17} />
    </button>
  ) : null;

  const missingQimaiTradeMark = mappingMode === 'brand-code' && activeAlert.scene === 'operation' && !activeAlert.sourceTradeMark?.trim();
  const guideSteps = mappingMode === 'platform-sku'
    ? ['在企迈商品详情找到同一商品与完整规格的 SKU ID', '核对平台当前填写值，按正确 SKU ID 修改', '在平台保存并发布']
    : missingQimaiTradeMark
      ? ['在企迈商品库及对应门店，找到同一商品和规格', '检查商品标识是否已准确维护，完善后保存']
      : activeAlert.scene === 'order'
        ? ['在平台找到同一商品和规格，检查商品标识是否已准确维护', '按企迈商品侧人工维护的标识核对平台填写值，修正后保存并发布']
        : ['核对企迈商品及平台同一规格人工维护的商品标识', '修正填写错误的一侧并保存；平台侧有改动时再发布'];

  const renderGuide = () => (
    <section className="ma-section ma-guide">
      <h2>{mappingMode === 'brand-code' ? '核对商品标识' : '处理方法'}</h2>
      <p className="ma-secondary">{mappingMode === 'platform-sku' ? '当前填写值不代表正确值，请先找到同一规格。' : missingQimaiTradeMark ? '企迈商品未维护商品标识，请检查企迈商品侧的维护值。' : activeAlert.scene === 'order' ? '订单未携带商品标识，请检查平台商品是否正确维护了商品标识。' : '企迈已维护商品标识，平台未匹配到对应商品，请核对两侧同一规格的标识是否准确。'}</p>
      <ol>
        {guideSteps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}
      </ol>
    </section>
  );

  const renderDetail = () => (
    <>
      <Header title={direct ? '处理商品映射' : '处理指引'} disabled={submitting} onBack={() => setScreen('alerts')} />
      <div className="ma-content">
        <div className="ma-warning">
          <AlertTriangle size={18} />
          <div>
            <h2>{alertTitle(activeAlert)}</h2>
            <p>{activeAlert.meta}</p>
            {activeAlert.scene === 'operation' && <p>本次操作：{activeAlert.operation}</p>}
            {direct && activeAlert.scene === 'operation' && <p>{currentStoreBound ? '本店映射已处理，原操作未自动重试。' : repairingMapping ? '企迈已有映射，三方返回“找不到对应映射关系”。请选择本店平台商品重新映射。' : '企迈尚未建立映射，请选择本店平台商品绑定。'}</p>}
          </div>
        </div>
        {renderSource()}
        {direct && restricted && <div className="ma-inline-issue" role="status">{scenario === 'read-only' ? '你可以查看告警，但没有本店绑定权限。请联系有权限的品牌工作人员处理。' : scenario === 'exempt' ? '该 SKU 已设为免绑定，无需建立映射，也不会加入批量任务。' : '本店平台授权已失效，请先到 PC 恢复授权，再处理映射。'}</div>}
        {issue && <div className="ma-inline-issue" role="alert">{issue}</div>}
        {direct ? (
          <>
            {renderCandidate()}
            {renderCrossStores()}
            {latestTask && <button className="ma-cross-stores ma-task-entry" onClick={() => viewTask(latestTask)}><span><strong>最近绑定任务</strong><small>{taskLabel(latestTask)}</small></span><ChevronRight size={17} /></button>}
            <p className="ma-footnote">{activeAlert.scene === 'order' ? '绑定对后续订单生效，历史订单不回溯。' : '仅处理本店映射，不自动重试原操作。'}</p>
          </>
        ) : renderGuide()}
      </div>
      <footer className="ma-footer">
        {direct ? (
          <>
            <button className="ma-secondary-button" disabled={submitting} onClick={() => setScreen('alerts')}>稍后处理</button>
            <button className="ma-primary-button" disabled={submitting || restricted || !!issue && scenario === 'conflict'} onClick={() => pendingCurrentTask ? viewTask(pendingCurrentTask) : completeCurrentStore()}>
              {submitting && <LoaderCircle size={16} className="animate-spin" />}
              {submitting ? '处理中' : restricted ? '当前不可绑定' : pendingCurrentTask ? '查看绑定任务' : currentStoreBound ? '查看绑定结果' : issue ? '重试绑定' : repairingMapping ? '确认重新映射' : '确认绑定'}
            </button>
          </>
        ) : <button className="ma-primary-button" onClick={() => setScreen('alerts')}>返回告警中心</button>}
      </footer>
      {showBatchPrompt && (
        <div className="ma-overlay" onClick={() => { if (!submitting) finishSingle(); }}>
          <section ref={sheetRef} className="ma-sheet" role="dialog" aria-modal="true" aria-labelledby="ma-sheet-title" onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape' && !submitting) finishSingle(); }}>
            <CheckCircle2 size={27} className="ma-success-icon" />
            <h2 id="ma-sheet-title">本店已绑定，一并处理其他门店？</h2>
            <p>{matchableStores.length} 家门店可绑定，将创建批量任务。</p>
            <div className="ma-sheet-stores">{matchableStores.slice(0, 2).map(item => item.name).join('、')}等</div>
            <button autoFocus className="ma-primary-button" disabled={submitting} onClick={() => { setShowBatchPrompt(false); setScreen('batch'); }}>
              查看并确认 {matchableStores.length} 家
            </button>
            <div className="ma-sheet-actions">
              <button className="ma-secondary-button" disabled={submitting} onClick={finishSingle}>仅处理本店</button>
            </div>
          </section>
        </div>
      )}
    </>
  );

  const renderPicker = () => (
    <>
      <Header title={activeAlert.scene === 'order' ? '选择企迈商品' : '选择平台商品'} onBack={() => setScreen('detail')} />
      <div className="ma-content">
        <label className="ma-search"><Search size={17} /><input aria-label="搜索商品" value={search} onChange={event => setSearch(event.target.value)} placeholder={activeAlert.scene === 'order' ? '商品名称 / SKU ID' : '商品名称 / 平台编码'} /></label>
        <p className="ma-list-label">{storeName} · {activeAlert.scene === 'order' ? '企迈商品' : platformName}</p>
        <div className="ma-selection-list">
          {filteredCandidates.length ? filteredCandidates.map(item => (
            <label className="ma-selection-row" key={item.id}>
              <input type="radio" name="mapping-candidate" value={item.id} checked={draftCandidateId === item.id} onChange={() => setDraftCandidateId(item.id)} />
              <span><strong>{item.name}</strong><small>{item.spec} · {item.code}</small></span>
            </label>
          )) : (
            <div className="ma-empty"><PackageSearch size={30} /><h2>未找到商品</h2><p>试试其他名称或编码</p><button className="ma-link" onClick={() => setSearch('')}>清空搜索</button></div>
          )}
        </div>
      </div>
      <footer className="ma-footer"><button className="ma-primary-button" onClick={() => { setSelectedCandidateId(draftCandidateId); setIssue(''); setScreen('detail'); }}>确认选择</button></footer>
    </>
  );

  const renderBatch = () => (
    <>
      <Header title="批量绑定门店" disabled={submitting} onBack={() => setScreen('detail')} />
      <div className="ma-content">
        <section className="ma-section ma-batch-target">
          <h2 className="ma-section-label">{activeAlert.scene === 'order' ? '绑定企迈商品' : '待映射企迈商品'}</h2>
          <h3>{activeAlert.scene === 'order' ? selectedCandidate.name : activeAlert.sourceName}</h3>
          <p>{activeAlert.scene === 'order' ? selectedCandidate.spec : activeAlert.sourceSpec}</p>
          <p>企迈 skuid {currentPair.qimaiSkuId} · {platformName}</p>
        </section>
        {issue && <div className="ma-inline-issue" role="alert">{issue}</div>}
        {crossStoreIssue && <div className="ma-inline-issue" role="alert">{crossStoreIssue}</div>}
        <div className="ma-list-heading">
          <span>未绑定门店 {unboundStores.length} 家</span>
          <button className="ma-link" disabled={submitting || !matchableStores.length} onClick={() => setSelectedStores(selectedEligibleStores.length === matchableStores.length ? new Set() : new Set(matchableStores.map(item => item.id)))}>
            {selectedEligibleStores.length === matchableStores.length && matchableStores.length ? '取消全选' : '全选可绑定'}
          </button>
        </div>
        <div className="ma-selection-list">
          {unboundStores.map(item => {
            const status = storeStatus(item);
            const enabled = canBatch && status === 'matchable' && !submitting;
            const isCurrent = item.state === 'current';
            return (
              <div className={'ma-store-item' + (enabled ? '' : ' is-disabled')} key={item.id}>
              <label className="ma-selection-row ma-store-row">
                <input type="checkbox" disabled={!enabled} checked={(enabled && selectedStores.has(item.id)) || (isCurrent && !currentStoreBound && !pendingCurrentTask && !restricted)} onChange={() => setSelectedStores(previous => {
                  const next = new Set(previous);
                  if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                  return next;
                })} />
                <span><strong>{isCurrent ? storeName : item.name}</strong>{isCurrent && <small>本次告警门店</small>}</span>
              </label>
              </div>
            );
          })}
        </div>
        <p className="ma-footnote">仅绑定已选门店，不覆盖已有关系。</p>
        <details className="ma-demo-options"><summary>演示跨店数据异常</summary><button className="ma-link" disabled={submitting} onClick={() => setCrossStoreIssue('跨店平台数据获取失败，不能确认绑定范围。请重新获取。')}>模拟获取失败</button><button className="ma-link" disabled={submitting} onClick={() => { setCrossStoreIssue(''); setIssue(''); flash('演示跨店数据已重新获取'); }}>重新获取</button></details>
      </div>
      <footer className="ma-footer">
        <span className="ma-selected-count">已选 <strong>{batchCount}</strong> 家</span>
        <button className="ma-primary-button" disabled={submitting || batchCount === 0 || !canBatch} onClick={() => createBatchTask()}>
          {submitting && <LoaderCircle size={16} className="animate-spin" />}{submitting ? '提交中' : '批量绑定'}
        </button>
      </footer>
    </>
  );

  const renderResult = () => {
    const batch = resultMode === 'batch';
    const task = currentTask;
    const counts = task ? taskCounts(task) : null;
    const retryable = task?.rows.filter(row => row.status === 'failed' && !demo.relations[pairKey(row)]).length ?? 0;
    const relation = boundRelation;
    return (
      <>
        <Header title={batch ? '绑定任务' : '绑定结果'} disabled={submitting} onBack={() => setScreen('alerts')} />
        <div className="ma-content ma-result">
          <div className={'ma-result-icon' + (batch && counts?.waiting ? ' is-pending' : '')}>{batch && counts?.waiting ? <Clock3 size={30} /> : counts?.failed ? <AlertTriangle size={30} /> : <CheckCircle2 size={32} />}</div>
          <h2>{batch ? task ? taskLabel(task) === '处理中' ? '批量绑定处理中' : taskLabel(task) === '已完成' ? '批量绑定已完成' : counts?.success ? '部分门店未绑定' : '批量绑定失败' : '任务记录不存在' : repairingMapping ? '本店已重新映射' : '本店已建立映射'}</h2>
          <p>{batch && counts ? `成功 ${counts.success} · 失败 ${counts.failed} · 等待 ${counts.waiting}` : storeName + ' · ' + platformName}</p>
          <section className="ma-section ma-result-details">
            {batch && task ? (
              <>
                <div className="ma-task-id"><ResultRow label="任务编号" value={task.id} /><button className="ma-copy" aria-label="复制任务编号" onClick={() => copyIdentifier(task.id)}><Copy size={14} /></button></div>
                <ResultRow label="创建时间" value={new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(task.createdAt)} />
                <ResultRow label="企迈 SKU" value={task.rows[0].qimaiName + ' · ' + task.rows[0].qimaiSpec} />
                <ResultRow label="平台" value={task.rows[0].channelId === 'meituan' ? '美团外卖' : platformName} />
                {counts?.waiting ? <button className="ma-link" disabled={submitting} onClick={() => submit(() => save(advanceDemoTask(latestState(), task.id)))}>刷新进度</button> : <span className="ma-secondary">任务已结束</span>}
              </>
            ) : (
              <>
                <ResultRow label="企迈商品" value={relation ? relation.qimaiName + ' · ' + relation.qimaiSpec : '未建立映射'} />
                <ResultRow label="企迈 SKU" value={relation?.qimaiSkuId ?? '—'} />
                <ResultRow label="平台商品" value={relation ? relation.platformName + ' · ' + relation.platformSpec : '—'} />
                <ResultRow label="平台 SKU" value={relation?.platformSkuId ?? '—'} />
                {activeAlert.scene === 'operation' && <ResultRow label="原操作" value="未重试" />}
              </>
            )}
          </section>
          {batch && task && <section className="ma-selection-list ma-task-rows">{[...task.rows].sort((a, b) => ({ failed: 0, waiting: 1, success: 2 }[a.status] - { failed: 0, waiting: 1, success: 2 }[b.status])).map(row => <details className="ma-task-store" key={pairKey(row)} open={row.status === 'failed'}>
            <summary><strong>{row.storeName}</strong><span className={row.status === 'failed' ? 'ma-unavailable' : ''}>{row.status === 'success' ? '已绑定' : row.status === 'failed' ? '失败' : '等待绑定'}</span><ChevronRight size={14} /></summary>
            {row.reason && <p className="ma-unavailable">{row.reason}</p>}<p>平台 SKU：{row.platformSkuId} · {row.platformSpec}</p><p>企迈 SKU：{row.qimaiSkuId} · {row.qimaiSpec}</p>
          </details>)}</section>}
          {batch && <p className="ma-footnote">演示任务：点击刷新推进进度；记录可从告警或绑定任务找回。仅建立映射，不重放经营操作。</p>}
          {!batch && activeAlert.scene === 'order' && <p className="ma-footnote">后续订单生效，历史订单不回溯。</p>}
          {!batch && activeAlert.scene === 'operation' && <p className="ma-footnote">请先核对平台当前状态，再决定是否重新操作，避免覆盖更新后的库存或上下架状态。</p>}
          {!batch && latestTask && <button className="ma-link" onClick={() => viewTask(latestTask)}>查看跨店绑定任务<ChevronRight size={14} /></button>}
        </div>
        <footer className="ma-footer">{batch && retryable > 0 && <button className="ma-secondary-button" disabled={submitting || restricted} onClick={retryFailed}>{submitting ? '提交中' : `重试失败 ${retryable} 家`}</button>}<button className="ma-primary-button" disabled={submitting} onClick={() => setScreen('alerts')}>返回告警中心</button></footer>
      </>
    );
  };

  const renderTasks = () => <><Header title="处理任务" onBack={() => setScreen('alerts')} /><div className="ma-content"><div className="ma-alert-list">
    {demo.tasks.map(task => {
      const counts = taskCounts(task);
      const alert = ALERTS.find(item => item.id === task.alertId);
      if (!alert) return null;
      return <button className="ma-alert-item" key={task.id} onClick={() => { setActiveAlert(alert); viewTask(task); }}>
        <div className="ma-alert-meta"><span>{taskLabel(task)}</span><span>{task.rows.length} 家门店</span></div>
        <h2>{task.rows[0].qimaiName} · {task.rows[0].qimaiSpec}</h2><p className="ma-alert-product">成功 {counts.success} · 失败 {counts.failed} · 等待 {counts.waiting}</p>
        <div className="ma-alert-bottom"><span>{task.id}</span><span className="ma-link">查看结果<ChevronRight size={14} /></span></div>
      </button>;
    })}
    {demo.distributions.map(task => <button className="ma-alert-item" key={task.id} onClick={() => {
      const alert = ALERTS.find(item => item.id === task.alertId); if (!alert) return;
      setActiveAlert(alert); setScreen('distribution');
    }}><div className="ma-alert-meta"><span>商品下发</span><span>{task.status === 'waiting' ? '处理中' : task.status === 'failed' ? '失败' : '已完成'}</span></div><h2>{task.productName}</h2><p className="ma-alert-product">{task.storeName} · {task.channelName}</p><div className="ma-alert-bottom"><span>{task.id}</span><span className="ma-link">查看结果<ChevronRight size={14} /></span></div></button>)}
    {!demo.tasks.length && !demo.distributions.length && <div className="ma-empty"><Clock3 size={30} /><h2>暂无处理任务</h2><p>绑定或下发提交后可在这里查看</p></div>}
  </div></div></>;

  return (
    <div className="mapping-alert">
      {screen === 'alerts' && renderAlerts()}
      {screen === 'detail' && renderDetail()}
      {screen === 'picker' && renderPicker()}
      {screen === 'batch' && renderBatch()}
      {screen === 'result' && renderResult()}
      {screen === 'tasks' && renderTasks()}
      {screen === 'distribution' && !shouldDistribute(activeAlert) && renderDetail()}
      {screen === 'distribution' && shouldDistribute(activeAlert) && <MobileAlertDistribution key={activeAlert.id} target={{ alertId: activeAlert.id, storeId: activeAlert.storeId, storeName, channelId, channelName: platformName, lookupBy: mappingMode === 'brand-code' ? 'trade-mark' : 'skuid', lookupValue: mappingMode === 'brand-code' ? activeAlert.sourceTradeMark! : activeAlert.qimaiSkuId!, sourceName: activeAlert.sourceName, sourceSpec: activeAlert.sourceSpec }} state={demo} getLatestState={latestState} onSave={save} scenario={scenario} onBack={() => setScreen('alerts')} onDone={() => setScreen('alerts')} />}
      {toast && <div role="status" className="ma-toast">{toast}</div>}
    </div>
  );
};

const ResultRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="ma-result-row"><span>{label}</span><strong>{value}</strong></div>
);
