import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  Info,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldOff,
  SlidersHorizontal,
  Sparkles,
  Store,
  Unlink,
  X,
} from 'lucide-react';
import { useProducts } from '../../context';
import { THIRD_PARTY_CHANNELS } from '../../omnichannel';
import type { Product, ThirdPartyChannelId } from '../../types';
import { WebProductMappingTasks } from './WebProductMappingTasks';
import { WebTakeawayMappingDiagnosis } from './WebTakeawayMappingDiagnosis';
import { WebMappingExemptionManager } from './WebMappingExemptionManager';
import { WebBatchProductMapping } from './WebBatchProductMapping';

type MappingView = 'store' | 'brand' | 'diagnosis' | 'tasks' | 'special';
type MappingStatus = 'unmapped' | 'mapped';
type MappingBasis = 'qimai_publish' | 'qimai_sku_id' | 'merchant_product_code' | 'manual_binding' | '--';
type SpecialRuleStatus = 'enabled' | 'disabled';

type MappingRow = {
  id: string;
  platformName: string;
  platformProductId: string;
  platformSku: string;
  platformSpec: string;
  platformType: 'standard' | 'combo' | 'display';
  qimaiProductId?: string;
  status: MappingStatus;
  mappingBasis: MappingBasis;
  updatedAt: string;
};

type SpecialRule = {
  id: string;
  name: string;
  channel: string;
  type: 'product_name' | 'sku_name' | 'attribute_name';
  source: string;
  target: string;
  status: SpecialRuleStatus;
  updatedAt: string;
};

const initialRows: MappingRow[] = [
  {
    id: 'm1',
    platformName: '招牌珍珠奶茶',
    platformProductId: '30824739921',
    platformSku: 'MT-77821',
    platformSpec: '大杯 / 冰',
    platformType: 'standard',
    qimaiProductId: '1',
    status: 'mapped',
    mappingBasis: 'qimai_publish',
    updatedAt: '2026-07-29 09:42',
  },
  {
    id: 'm2',
    platformName: '手打柠檬茶（冰）',
    platformProductId: '30824739922',
    platformSku: 'MT-77822',
    platformSpec: '标准',
    platformType: 'standard',
    status: 'unmapped',
    mappingBasis: '--',
    updatedAt: '2026-07-29 09:41',
  },
  {
    id: 'm3',
    platformName: '黑糖波波鲜奶',
    platformProductId: '30824739923',
    platformSku: 'MT-77823',
    platformSpec: '中杯',
    platformType: 'standard',
    qimaiProductId: '3',
    status: 'mapped',
    mappingBasis: 'merchant_product_code',
    updatedAt: '2026-07-29 09:40',
  },
  {
    id: 'm4',
    platformName: '多肉葡萄',
    platformProductId: '30824739924',
    platformSku: 'MT-77824',
    platformSpec: '大杯',
    platformType: 'standard',
    qimaiProductId: '4',
    status: 'mapped',
    mappingBasis: 'manual_binding',
    updatedAt: '2026-07-28 18:22',
  },
  {
    id: 'm5',
    platformName: '经典牛肉汉堡',
    platformProductId: '30824739925',
    platformSku: 'MT-77825',
    platformSpec: '标准',
    platformType: 'standard',
    qimaiProductId: '6',
    status: 'mapped',
    mappingBasis: 'qimai_sku_id',
    updatedAt: '2026-07-28 17:56',
  },
  {
    id: 'm6',
    platformName: '选择我们的理由',
    platformProductId: '30824739926',
    platformSku: 'MT-DISPLAY-001',
    platformSpec: '品牌展示卡片',
    platformType: 'display',
    status: 'unmapped',
    mappingBasis: '--',
    updatedAt: '2026-09-11 15:13',
  },
  {
    id: 'm7',
    platformName: '产品 100% 每日现做不隔夜',
    platformProductId: '30824739927',
    platformSku: 'MT-DISPLAY-002',
    platformSpec: '品牌展示卡片',
    platformType: 'display',
    status: 'unmapped',
    mappingBasis: '--',
    updatedAt: '2026-09-11 15:13',
  },
  {
    id: 'm8',
    platformName: '经典珍珠奶绿',
    platformProductId: '30824739935',
    platformSku: 'MT-77826',
    platformSpec: '中杯',
    platformType: 'standard',
    qimaiProductId: '1',
    status: 'mapped',
    mappingBasis: 'qimai_publish',
    updatedAt: '2026-09-10 12:16',
  },
  {
    id: 'm9',
    platformName: '手打柠檬茶',
    platformProductId: '30824739928',
    platformSku: 'MT-77827',
    platformSpec: '大杯',
    platformType: 'standard',
    qimaiProductId: '2',
    status: 'mapped',
    mappingBasis: 'manual_binding',
    updatedAt: '2026-09-10 11:35',
  },
  {
    id: 'm10',
    platformName: '手打柠檬茶',
    platformProductId: '30824739929',
    platformSku: 'MT-77828',
    platformSpec: '大杯',
    platformType: 'standard',
    qimaiProductId: '4',
    status: 'mapped',
    mappingBasis: 'manual_binding',
    updatedAt: '2026-09-09 16:48',
  },
  {
    id: 'm11',
    platformName: '黑糖波波鲜奶',
    platformProductId: '30824739923',
    platformSku: 'MT-77829',
    platformSpec: '大杯',
    platformType: 'standard',
    status: 'unmapped',
    mappingBasis: '--',
    updatedAt: '2026-09-09 15:20',
  },
  {
    id: 'm12',
    platformName: '多肉葡萄',
    platformProductId: '30824739924',
    platformSku: 'MT-77830',
    platformSpec: '中杯',
    platformType: 'standard',
    qimaiProductId: '4',
    status: 'mapped',
    mappingBasis: 'qimai_sku_id',
    updatedAt: '2026-09-09 14:42',
  },
  {
    id: 'm13',
    platformName: '经典牛肉汉堡',
    platformProductId: '30824739925',
    platformSku: 'MT-77831',
    platformSpec: '双层',
    platformType: 'standard',
    qimaiProductId: '6',
    status: 'mapped',
    mappingBasis: 'qimai_publish',
    updatedAt: '2026-09-09 13:18',
  },
  {
    id: 'm14',
    platformName: '双人分享套餐',
    platformProductId: '30824739930',
    platformSku: 'MT-77832',
    platformSpec: '2 人份',
    platformType: 'combo',
    qimaiProductId: '13',
    status: 'mapped',
    mappingBasis: 'manual_binding',
    updatedAt: '2026-09-09 12:05',
  },
  {
    id: 'm15',
    platformName: '双人分享套餐',
    platformProductId: '30824739931',
    platformSku: 'MT-77833',
    platformSpec: '2 人份',
    platformType: 'combo',
    status: 'unmapped',
    mappingBasis: '--',
    updatedAt: '2026-09-09 11:36',
  },
  {
    id: 'm16',
    platformName: '午市工作餐',
    platformProductId: '30824739932',
    platformSku: 'MT-77834',
    platformSpec: '单人份',
    platformType: 'combo',
    qimaiProductId: '13',
    status: 'mapped',
    mappingBasis: 'qimai_publish',
    updatedAt: '2026-09-08 18:24',
  },
  {
    id: 'm17',
    platformName: '季节限定草莓奶昔',
    platformProductId: '30824739933',
    platformSku: 'MT-77835',
    platformSpec: '中杯',
    platformType: 'standard',
    qimaiProductId: '7',
    status: 'mapped',
    mappingBasis: 'manual_binding',
    updatedAt: '2026-09-08 17:50',
  },
  {
    id: 'm18',
    platformName: '老娘舅随心套餐',
    platformProductId: '30824739934',
    platformSku: 'MT-77836',
    platformSpec: '1 人份',
    platformType: 'combo',
    qimaiProductId: '13',
    status: 'mapped',
    mappingBasis: 'manual_binding',
    updatedAt: '2026-09-08 16:12',
  },
];

const getPlatformSkuId = (row: MappingRow) => {
  const sequence = Number(row.id.replace(/\D/g, '')) || 0;
  return `1297157935115968${String(500 + sequence).padStart(3, '0')}`;
};

const initialSpecialRules: SpecialRule[] = [
  {
    id: 's1',
    name: '去除外卖专享后缀',
    channel: '美团外卖',
    type: 'product_name',
    source: '（外卖专享）',
    target: '',
    status: 'enabled',
    updatedAt: '2026-07-29 16:24',
  },
  {
    id: 's2',
    name: '规格括号统一',
    channel: '淘宝闪购',
    type: 'sku_name',
    source: '【大杯】',
    target: '大杯',
    status: 'enabled',
    updatedAt: '2026-07-28 18:10',
  },
  {
    id: 's3',
    name: '属性名称同义词',
    channel: '美团外卖',
    type: 'attribute_name',
    source: '温度选择',
    target: '温度',
    status: 'disabled',
    updatedAt: '2026-07-27 11:36',
  },
];

const statusMeta: Record<MappingStatus, { label: string; classes: string }> = {
  unmapped: { label: '未映射', classes: 'bg-[#FFF7E8] text-[#D46B08]' },
  mapped: { label: '已映射', classes: 'bg-[#E8FFF3] text-[#008A4B]' },
};

const storeStatusTabs: Array<{ id: 'all' | MappingStatus; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'unmapped', label: '未映射' },
  { id: 'mapped', label: '已映射' },
];

const viewTabs: Array<{ id: MappingView; label: string; icon: React.ElementType }> = [
  { id: 'store', label: '门店商品映射', icon: Store },
  { id: 'brand', label: '商品批量映射', icon: Building2 },
  { id: 'diagnosis', label: '外卖映射诊断', icon: Activity },
  { id: 'tasks', label: '商品管理任务', icon: ClipboardList },
  { id: 'special', label: '特殊映射配置', icon: Settings2 },
];

const copyStoreOptions = [
  { id: 's2', name: '福田卓悦店', code: '100102' },
  { id: 's3', name: '宝安壹方城店', code: '100103' },
  { id: 's4', name: '龙华壹方天地店', code: '100104' },
  { id: 's5', name: '罗湖万象城店', code: '100105' },
];

const Radio: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
      active ? 'border-[#00B460]' : 'border-[#C9CDD4]'
    }`}
  >
    {active && <span className="h-2 w-2 rounded-full bg-[#00B460]" />}
  </span>
);

const Checkbox: React.FC<{ checked: boolean; onClick: () => void }> = ({ checked, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex h-4 w-4 items-center justify-center rounded border ${
      checked ? 'border-[#00B460] bg-[#00B460] text-white' : 'border-[#C9CDD4] bg-white'
    }`}
  >
    {checked && <Check size={12} strokeWidth={3} />}
  </button>
);

const Field: React.FC<{ children: React.ReactNode; width?: string }> = ({ children, width = 'min-w-[156px]' }) => (
  <div
    className={`inline-flex h-9 items-center justify-between rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969] ${width}`}
  >
    {children}
    <ChevronDown size={14} className="ml-3 text-[#86909C]" />
  </div>
);

export const WebProductMapping: React.FC = () => {
  const { products } = useProducts();
  const [activeView, setActiveView] = useState<MappingView>(() => {
    const requestedView = new URLSearchParams(window.location.search).get('view') as MappingView | null;
    return requestedView && viewTabs.some(tab => tab.id === requestedView) ? requestedView : 'store';
  });
  const [channelId, setChannelId] = useState<ThirdPartyChannelId>('meituan');
  const [status, setStatus] = useState<'all' | MappingStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [qimaiKeyword, setQimaiKeyword] = useState('');
  const [qimaiSkuIdKeyword, setQimaiSkuIdKeyword] = useState('');
  const [qimaiMarkKeyword, setQimaiMarkKeyword] = useState('');
  const [relatedPlatformKeyword, setRelatedPlatformKeyword] = useState('');
  const [qimaiProductType, setQimaiProductType] = useState<'all' | 'standard' | 'combo'>('all');
  const [activePlatformRowId, setActivePlatformRowId] = useState(initialRows[0]?.id || '');
  const [draggingPlatformRowId, setDraggingPlatformRowId] = useState<string | null>(null);
  const [collapsedPlatformSpuIds, setCollapsedPlatformSpuIds] = useState<string[]>([]);
  const [selectedQimaiProductIds, setSelectedQimaiProductIds] = useState<string[]>([]);
  const [rows, setRows] = useState<MappingRow[]>(initialRows);
  const [bindingRow, setBindingRow] = useState<MappingRow | null>(null);
  const [candidateKeyword, setCandidateKeyword] = useState('');
  const [candidateProductId, setCandidateProductId] = useState('');
  const [message, setMessage] = useState('');
  const [exemptRowIds, setExemptRowIds] = useState<string[]>(['m6', 'm7']);
  const [showExemptionManager, setShowExemptionManager] = useState(false);
  const [showQimaiMoreFilters, setShowQimaiMoreFilters] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [relationDetailProductId, setRelationDetailProductId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('mappingDetail'));
  const [collapsedQimaiProductIds, setCollapsedQimaiProductIds] = useState<string[]>([]);
  const [showImportProducts, setShowImportProducts] = useState(() => new URLSearchParams(window.location.search).get('mappingDialog') === 'import');
  const [importKeyword, setImportKeyword] = useState('');
  const [selectedImportProductIds, setSelectedImportProductIds] = useState<string[]>([]);
  const [showCopyRelations, setShowCopyRelations] = useState(() => new URLSearchParams(window.location.search).get('mappingDialog') === 'copy');
  const [copyScope, setCopyScope] = useState<'all' | 'partial'>('all');
  const [selectedCopyProductIds, setSelectedCopyProductIds] = useState<string[]>(['1', '2']);
  const [selectedCopyStoreIds, setSelectedCopyStoreIds] = useState<string[]>(['s2', 's3']);

  const [specialRules, setSpecialRules] = useState<SpecialRule[]>(initialSpecialRules);
  const [specialKeyword, setSpecialKeyword] = useState('');
  const [editingRule, setEditingRule] = useState<SpecialRule | null>(null);

  const getProduct = (id?: string) => products.find(item => item.id === id);
  const getProductType = (product?: Product) => product?.type === 'combo' ? 'combo' : 'standard';
  const getProductSpecMeta = (product: Product, index: number) => {
    const multiSpec = Boolean(product.specs && product.specs.length > 1);
    const suffix = multiSpec ? `-${index + 1}` : '';
    return {
      name: product.specs?.[index]?.name || product.specs?.[0]?.name || '标准规格',
      skuId: `${product.skuCode}${suffix}`,
      mark: `${getProductType(product) === 'combo' ? 'COMBO' : 'STD'}-${product.skuCode}${suffix}`,
    };
  };
  const getProductMark = (product?: Product) => product ? getProductSpecMeta(product, 0).mark : '--';
  const relationDetailProduct = getProduct(relationDetailProductId);
  const relationDetailRows = rows.filter(row => row.qimaiProductId === relationDetailProductId);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  const candidateProducts = useMemo(
    () =>
      products
        .filter(
          product =>
            !candidateKeyword ||
            `${product.name}${product.skuCode}`.toLowerCase().includes(candidateKeyword.toLowerCase()),
        )
        .slice(0, 8),
    [candidateKeyword, products],
  );

  const importCandidateProducts = useMemo(
    () => products.filter(product => {
      if (!importKeyword) return true;
      const specCount = Math.max(product.specs?.length || 0, 1);
      const specKeywords = Array.from({ length: specCount }, (_, index) => {
        const meta = getProductSpecMeta(product, index);
        return `${meta.name}${meta.skuId}${meta.mark}`;
      }).join('');
      return `${product.name}${product.id}${product.skuCode}${specKeywords}`.toLowerCase().includes(importKeyword.trim().toLowerCase());
    }).slice(0, 8),
    [importKeyword, products],
  );

  const filteredQimaiProducts = useMemo(
    () => products.filter(product => {
      const relatedRows = rows.filter(row => row.qimaiProductId === product.id);
      const nameMatched = !qimaiKeyword || product.name.toLowerCase().includes(qimaiKeyword.trim().toLowerCase());
      const specCount = Math.max(product.specs?.length || 0, 1);
      const skuMatched = !qimaiSkuIdKeyword || Array.from({ length: specCount }, (_, index) => getProductSpecMeta(product, index).skuId).some(skuId => skuId.toLowerCase().includes(qimaiSkuIdKeyword.trim().toLowerCase()));
      const markMatched = !qimaiMarkKeyword || Array.from({ length: specCount }, (_, index) => getProductSpecMeta(product, index).mark).some(mark => mark.toLowerCase().includes(qimaiMarkKeyword.trim().toLowerCase()));
      const typeMatched = qimaiProductType === 'all' || getProductType(product) === qimaiProductType;
      const platformMatched = !relatedPlatformKeyword || relatedRows.some(row =>
        `${row.platformName}${row.platformSku}`.toLowerCase().includes(relatedPlatformKeyword.trim().toLowerCase()),
      );
      return nameMatched && skuMatched && markMatched && typeMatched && platformMatched;
    }),
    [products, qimaiKeyword, qimaiMarkKeyword, qimaiProductType, qimaiSkuIdKeyword, relatedPlatformKeyword, rows],
  );

  const filteredSpecialRules = useMemo(
    () =>
      specialRules.filter(
        rule =>
          !specialKeyword ||
          `${rule.name}${rule.channel}${rule.source}${rule.target}`
            .toLowerCase()
            .includes(specialKeyword.toLowerCase()),
      ),
    [specialKeyword, specialRules],
  );

  const counts = useMemo(
    () => ({
      all: rows.filter(row => !exemptRowIds.includes(row.id)).length,
      unmapped: rows.filter(row => !exemptRowIds.includes(row.id) && row.status === 'unmapped').length,
      mapped: rows.filter(row => !exemptRowIds.includes(row.id) && row.status === 'mapped').length,
    }),
    [exemptRowIds, rows],
  );

  const openBinding = (row: MappingRow) => {
    setBindingRow(row);
    setCandidateProductId(row.qimaiProductId || '');
    setCandidateKeyword('');
  };

  const saveBinding = () => {
    if (!bindingRow || !candidateProductId) return;
    setRows(current =>
      current.map(row =>
        row.id === bindingRow.id
          ? {
              ...row,
              qimaiProductId: candidateProductId,
              status: 'mapped',
              mappingBasis: 'manual_binding',
              updatedAt: '刚刚',
            }
          : row,
      ),
    );
    setBindingRow(null);
    setMessage('映射关系已保存，后续接单识别、库存扣减和商品统计将使用新的企迈商品。');
  };

  const removeBinding = (rowId: string) => {
    if (!window.confirm('解除后该平台商品将无法匹配企迈商品，确定解除吗？')) return;
    setRows(current =>
      current.map(row =>
        row.id === rowId
          ? {
              ...row,
              qimaiProductId: undefined,
              status: 'unmapped',
              mappingBasis: '--',
              updatedAt: '刚刚',
            }
          : row,
      ),
    );
  };

  const autoMatch = () => {
    setRows(current =>
      current.map(row =>
        row.status === 'unmapped' && !exemptRowIds.includes(row.id)
          ? {
              ...row,
              qimaiProductId: '2',
              status: 'mapped',
              mappingBasis: 'qimai_sku_id',
              updatedAt: '刚刚',
            }
          : row,
      ),
    );
    setMessage(`自动关联已完成；${exemptRowIds.length} 个免绑定商品未进入任务。`);
  };

  const bindPlatformRowToProduct = (rowId: string, productId: string) => {
    const platformRow = rows.find(row => row.id === rowId);
    const product = getProduct(productId);
    if (!platformRow || !product) return;
    setRows(current => current.map(row => row.id === rowId
      ? {
          ...row,
          qimaiProductId: productId,
          status: 'mapped',
          mappingBasis: 'manual_binding',
          updatedAt: '刚刚',
        }
      : row));
    setActivePlatformRowId(rowId);
    setDraggingPlatformRowId(null);
    setMessage(`已将“${platformRow.platformName}”关联至企迈商品“${product.name}”。`);
  };

  const saveSpecialRule = () => {
    if (!editingRule) return;
    setSpecialRules(current => {
      const exists = current.some(rule => rule.id === editingRule.id);
      if (exists) {
        return current.map(rule =>
          rule.id === editingRule.id ? { ...editingRule, updatedAt: '刚刚' } : rule,
        );
      }
      return [{ ...editingRule, updatedAt: '刚刚' }, ...current];
    });
    setEditingRule(null);
    setMessage('替换规则已保存；后续自动关联会先按规则统一平台文本，再执行商品匹配。');
  };

  const renderStoreMapping = () => {
    const activeChannel = THIRD_PARTY_CHANNELS.find(channel => channel.id === channelId);
    const platformRows = rows.filter(row => {
      if (exemptRowIds.includes(row.id)) return false;
      const statusMatched = status === 'all' || row.status === status;
      const keywordMatched = !keyword || `${row.platformName}${row.platformProductId}${getPlatformSkuId(row)}${row.platformSku}${row.platformSpec}`.toLowerCase().includes(keyword.trim().toLowerCase());
      return statusMatched && keywordMatched;
    });
    const activePlatformRow = platformRows.find(row => row.id === activePlatformRowId) || platformRows[0];
    const platformSpuGroups = Array.from(platformRows.reduce((groups, row) => {
      const group = groups.get(row.platformProductId) || [];
      group.push(row);
      groups.set(row.platformProductId, group);
      return groups;
    }, new Map<string, MappingRow[]>()).entries()).map(([spuId, skuRows]) => ({ spuId, skuRows }));
    const statusTabs = storeStatusTabs;

    return (
      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex h-14 items-center gap-3 border-b border-[#E5E6EB] px-4">
          <button type="button" className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-[#C9CDD4] bg-white px-3 text-[14px] font-bold text-[#1D2129]">
            <Store size={15} className="text-[#00A35B]" />
            <span>南山万象店</span>
            <ChevronDown size={14} className="text-[#667085]" />
          </button>
          <span className="h-5 w-px shrink-0 bg-[#E5E6EB]" />
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {THIRD_PARTY_CHANNELS.map(channel => (
              <button
                key={channel.id}
                type="button"
                onClick={() => {
                  setChannelId(channel.id);
                  setSelectedQimaiProductIds([]);
                }}
                className={`h-8 shrink-0 whitespace-nowrap rounded-md px-3 text-[12px] transition-colors ${channelId === channel.id ? 'bg-[#E8FFF3] font-bold text-[#008A4B]' : 'text-[#4E5969] hover:bg-[#F2F3F5]'}`}
              >
                {channel.shortName}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setShowExemptionManager(true)} className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-[#F0C98B] bg-[#FFF9F0] px-3 text-[12px] font-medium text-[#A8620A]"><ShieldOff size={13} />免绑定商品 {exemptRowIds.length}</button>
        </div>

        <div className="grid min-h-[720px] grid-cols-[308px_minmax(0,1fr)]">
          <aside className="min-w-0 border-r border-[#E5E6EB] bg-white">
            <div className="flex h-12 items-center justify-between gap-2 border-b border-[#EEF0F3] px-3">
              <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[15px] font-semibold text-[#1D2129]">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-[#FFD84D] text-[11px] font-bold text-[#7A4B00]">{activeChannel?.shortName.slice(0, 1)}</span>
                {activeChannel?.shortName}商品
                <span className="text-[10px] font-normal text-[#98A2B3]">{platformSpuGroups.length} SPU</span>
              </div>
              <button type="button" onClick={() => setMessage(`${activeChannel?.name}平台商品已刷新；${exemptRowIds.length} 个免绑定商品未进入列表。`)} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] font-medium text-[#00A35B]"><RefreshCw size={13} />更新</button>
            </div>

            <div className="border-b border-[#EEF0F3] p-3">
              <div className="flex overflow-x-auto rounded-md border border-[#E5E6EB] bg-[#F7F8FA] p-0.5">
                {statusTabs.map(tab => (
                  <button key={tab.id} type="button" onClick={() => setStatus(tab.id)} className={`h-7 flex-1 shrink-0 rounded px-2 text-[12px] ${status === tab.id ? 'bg-white font-semibold text-[#00A35B] shadow-sm' : 'text-[#667085]'}`}>
                    {tab.label}<span className="ml-1 text-[10px] text-[#98A2B3]">{counts[tab.id]}</span>
                  </button>
                ))}
              </div>
              <label className="mt-2 flex h-8 items-center rounded-md border border-[#C9CDD4] bg-white px-3">
                <Search size={15} className="mr-2 text-[#86909C]" />
                <input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="商品名称 / SPU ID / SKU ID / SKU码" className="min-w-0 flex-1 text-[12px] outline-none" />
              </label>
            </div>

            <div className="max-h-[610px] space-y-2 overflow-y-auto p-3">
              {platformSpuGroups.map((group, index) => {
                const firstRow = group.skuRows[0];
                const collapsed = collapsedPlatformSpuIds.includes(group.spuId);
                const mappedCount = group.skuRows.filter(row => row.status === 'mapped').length;
                const mockImage = getProduct(firstRow.qimaiProductId)?.image || products[index % Math.max(products.length, 1)]?.image;
                return (
                  <article key={group.spuId} className="overflow-hidden rounded-md border border-[#E5E6EB] bg-white">
                    <button type="button" onClick={() => setCollapsedPlatformSpuIds(collapsed ? collapsedPlatformSpuIds.filter(id => id !== group.spuId) : [...collapsedPlatformSpuIds, group.spuId])} className="flex w-full items-center gap-2.5 bg-[#FAFBFC] px-2.5 py-2 text-left hover:bg-[#F5FFF9]">
                      {mockImage ? <img src={mockImage} alt="" className="h-8 w-8 shrink-0 rounded object-cover" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#F2F3F5] text-xs text-[#667085]">{firstRow.platformName.slice(0, 1)}</span>}
                      <div className="min-w-0 flex-1"><div className="flex items-center gap-1"><span className="truncate text-[13px] font-semibold text-[#1D2129]">{firstRow.platformName}</span><ChevronDown size={13} className={`shrink-0 text-[#86909C] transition-transform ${collapsed ? '-rotate-90' : ''}`} /></div><div className="mt-0.5 truncate text-[10px] text-[#86909C]">SPU ID {group.spuId} · {group.skuRows.length} 个SKU</div></div>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${mappedCount === group.skuRows.length ? statusMeta.mapped.classes : mappedCount === 0 ? statusMeta.unmapped.classes : 'bg-[#F2F8FF] text-[#245B8A]'}`}>{mappedCount}/{group.skuRows.length} 已映射</span>
                    </button>
                    {!collapsed && <div className="border-t border-[#EEF0F3]">{group.skuRows.map(row => {
                      const active = activePlatformRow?.id === row.id;
                      return <div key={row.id} draggable onDragStart={() => setDraggingPlatformRowId(row.id)} onDragEnd={() => setDraggingPlatformRowId(null)} onClick={() => setActivePlatformRowId(row.id)} className={`cursor-pointer border-b border-[#F0F1F2] px-3 py-2 text-left last:border-b-0 ${active ? 'bg-[#F2FFF8]' : 'bg-white hover:bg-[#F7F8FA]'}`}>
                        <div className="flex items-start gap-2"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9CDD4]" /><div className="min-w-0 flex-1"><div className="truncate text-[12px] font-medium text-[#1D2129]">{row.platformSpec}</div><div className="mt-0.5 truncate font-mono text-[10px] text-[#86909C]">SKU ID {getPlatformSkuId(row)}</div><div className="mt-0.5 truncate font-mono text-[10px] text-[#86909C]">SKU码 {row.platformSku}</div></div><span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${statusMeta[row.status].classes}`}>{statusMeta[row.status].label}</span></div>
                      </div>;
                    })}</div>}
                  </article>
                );
              })}
              {platformRows.length === 0 && (
                <div className="py-16 text-center text-[12px] text-[#86909C]">
                  暂无符合条件的平台商品
                  <button type="button" onClick={() => { setKeyword(''); setStatus('all'); }} className="mt-2 block w-full text-[#00A35B]">清空筛选</button>
                </div>
              )}
            </div>
          </aside>

          <div className="relative min-w-0 bg-white">
            <div className="flex h-12 flex-nowrap items-center gap-2 border-b border-[#EEF0F3] px-3">
              <div className="mr-auto flex min-w-0 items-center gap-2 text-[15px] font-semibold text-[#1D2129]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00B460] text-xs font-bold text-white">企</span>
                <span className="truncate">企迈平台商品</span>
                <span className="shrink-0 text-[11px] font-normal text-[#86909C]">共 {filteredQimaiProducts.length} 个</span>
              </div>
              <button type="button" onClick={() => setMessage('页面已刷新。')} className="h-8 shrink-0 whitespace-nowrap rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] text-[#4E5969]">刷新</button>
              <button type="button" onClick={() => setShowBatchActions(value => !value)} className={`inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md border px-3 text-[12px] ${selectedQimaiProductIds.length ? 'border-[#8EDCB2] bg-[#F2FFF8] font-medium text-[#008A4B]' : 'border-[#C9CDD4] bg-white text-[#4E5969]'}`}>批量操作{selectedQimaiProductIds.length > 0 && `（${selectedQimaiProductIds.length}）`}<ChevronDown size={13} className="ml-1.5" /></button>
              <button type="button" onClick={autoMatch} className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md bg-[#00B460] px-3 text-[12px] font-semibold text-white"><Sparkles size={14} className="mr-1.5" />自动关联</button>
            </div>

            {showBatchActions && <div className="absolute right-[102px] top-11 z-30 w-[210px] rounded-md border border-[#D9DDE2] bg-white p-1.5 text-[12px] shadow-xl"><button type="button" disabled={!selectedQimaiProductIds.length} onClick={() => { setMessage(`已选择 ${selectedQimaiProductIds.length} 个企迈商品，移出渠道商品需二次确认。`); setShowBatchActions(false); }} className="h-9 w-full rounded px-3 text-left text-[#4E5969] hover:bg-[#F7F8FA] disabled:text-[#BFC5D0]">移出渠道商品{!selectedQimaiProductIds.length && <span className="ml-2 text-[10px]">需先勾选</span>}</button><button type="button" onClick={() => { setShowImportProducts(true); setShowBatchActions(false); setSelectedImportProductIds([]); }} className="h-9 w-full rounded px-3 text-left text-[#4E5969] hover:bg-[#F7F8FA]">移入商品库商品</button><button type="button" onClick={() => { setShowCopyRelations(true); setShowBatchActions(false); }} className="h-9 w-full rounded px-3 text-left text-[#4E5969] hover:bg-[#F7F8FA]">复制关系到其他门店</button></div>}

            <div className="flex h-12 items-center gap-2 border-b border-[#EEF0F3] bg-[#FAFBFC] px-3">
              <label className="flex h-8 min-w-[150px] flex-[1.2] items-center rounded-md border border-[#C9CDD4] bg-white px-3">
                <Search size={14} className="mr-2 text-[#86909C]" />
                <input value={qimaiKeyword} onChange={event => setQimaiKeyword(event.target.value)} placeholder="企迈商品名称" className="min-w-0 flex-1 text-[12px] outline-none" />
              </label>
              <label className="flex h-8 min-w-[135px] flex-1 items-center rounded-md border border-[#C9CDD4] bg-white px-3">
                <Search size={14} className="mr-2 text-[#86909C]" />
                <input value={qimaiMarkKeyword} onChange={event => setQimaiMarkKeyword(event.target.value)} placeholder="商品标识" className="min-w-0 flex-1 text-[12px] outline-none" />
              </label>
              <select value={qimaiProductType} onChange={event => setQimaiProductType(event.target.value as 'all' | 'standard' | 'combo')} className="h-8 w-[130px] shrink-0 rounded-md border border-[#C9CDD4] bg-white px-2 text-[12px] text-[#4E5969] outline-none"><option value="all">全部商品类型</option><option value="standard">标准商品</option><option value="combo">套餐商品</option></select>
              <button type="button" onClick={() => setShowQimaiMoreFilters(value => !value)} className={`inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md border px-3 text-[12px] ${showQimaiMoreFilters || relatedPlatformKeyword || qimaiSkuIdKeyword ? 'border-[#77D9A5] bg-[#F2FFF8] text-[#008A4B]' : 'border-[#C9CDD4] bg-white text-[#4E5969]'}`}><SlidersHorizontal size={13} className="mr-1.5" />更多筛选{(relatedPlatformKeyword || qimaiSkuIdKeyword) && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-[#00B460]" />}</button>
              <button type="button" onClick={() => { setQimaiKeyword(''); setQimaiMarkKeyword(''); setRelatedPlatformKeyword(''); setQimaiSkuIdKeyword(''); setQimaiProductType('all'); }} className="h-8 shrink-0 px-2 text-[12px] text-[#4E5969]">重置</button>
            </div>

            {showQimaiMoreFilters && <div className="absolute right-3 top-[92px] z-20 w-[460px] rounded-lg border border-[#D9DDE2] bg-white p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><span className="text-[13px] font-bold text-[#1D2129]">更多筛选</span><button type="button" onClick={() => setShowQimaiMoreFilters(false)} title="关闭"><X size={15} /></button></div><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-[12px] text-[#667085]">关联平台商品</span><input value={relatedPlatformKeyword} onChange={event => setRelatedPlatformKeyword(event.target.value)} placeholder={`${activeChannel?.shortName}商品名称 / SKU ID`} className="h-9 w-full rounded-md border border-[#C9CDD4] px-3 text-[12px] outline-none focus:border-[#00B460]" /></label><label><span className="mb-1.5 block text-[12px] text-[#667085]">企迈 SKU ID</span><input value={qimaiSkuIdKeyword} onChange={event => setQimaiSkuIdKeyword(event.target.value)} placeholder="输入企迈 SKU ID" className="h-9 w-full rounded-md border border-[#C9CDD4] px-3 text-[12px] outline-none focus:border-[#00B460]" /></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setRelatedPlatformKeyword(''); setQimaiSkuIdKeyword(''); }} className="h-8 rounded-md border border-[#C9CDD4] px-3 text-[12px] text-[#4E5969]">清空</button><button type="button" onClick={() => setShowQimaiMoreFilters(false)} className="h-8 rounded-md bg-[#00B460] px-3 text-[12px] font-bold text-white">完成</button></div></div>}

            <div className="max-h-[610px] space-y-3 overflow-y-auto bg-[#F7F8FA] p-3">
              {filteredQimaiProducts.map(product => {
                const relatedRows = rows.filter(row => row.qimaiProductId === product.id);
                const activeRelationIsHere = activePlatformRow?.qimaiProductId === product.id;
                const selected = selectedQimaiProductIds.includes(product.id);
                const collapsed = collapsedQimaiProductIds.includes(product.id);
                const relationRows: Array<MappingRow | null> = relatedRows.length ? relatedRows : [null];
                const productSpecs = product.specs?.map(spec => spec.name) || [];
                return (
                  <article key={product.id} className="overflow-hidden rounded-md border border-[#E5E6EB] bg-white">
                    <div className="flex h-11 items-center gap-2.5 bg-[#FAFBFC] px-3">
                      <Checkbox checked={selected} onClick={() => setSelectedQimaiProductIds(selected ? selectedQimaiProductIds.filter(id => id !== product.id) : [...selectedQimaiProductIds, product.id])} />
                      <img src={product.image} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                      <button type="button" onClick={() => setCollapsedQimaiProductIds(collapsed ? collapsedQimaiProductIds.filter(id => id !== product.id) : [...collapsedQimaiProductIds, product.id])} className="flex min-w-0 items-center gap-1.5 text-left"><span className="truncate text-[13px] font-bold text-[#1D2129]">{product.name}</span><ChevronDown size={14} className={`shrink-0 text-[#667085] transition-transform ${collapsed ? '-rotate-90' : ''}`} /></button>
                      <button type="button" onClick={() => setRelationDetailProductId(product.id)} disabled={!relatedRows.length} title="查看关联商品及两侧 ID" className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#86909C] hover:bg-white hover:text-[#00A35B] disabled:text-[#D9DDE2]"><Info size={14} /></button>
                      <span className="ml-auto shrink-0 text-[12px] text-[#4E5969]">{activeChannel?.shortName}商品关联</span>
                      <button type="button" disabled={!activePlatformRow || activeRelationIsHere} onClick={() => activePlatformRow && bindPlatformRowToProduct(activePlatformRow.id, product.id)} className="shrink-0 text-[12px] font-medium text-[#00A35B] disabled:text-[#BFC5D0]">{activeRelationIsHere ? '当前已关联' : activePlatformRow?.qimaiProductId ? '改绑到此' : relatedRows.length ? '新增关联' : '关联'}</button>
                      {relatedRows.length > 1 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E8FFF3] px-1.5 text-[10px] font-bold text-[#008A4B]">{relatedRows.length}</span>}
                    </div>
                    {!collapsed && <div
                      onDragOver={event => event.preventDefault()}
                      onDrop={() => {
                        const rowId = draggingPlatformRowId || activePlatformRow?.id;
                        if (rowId) bindPlatformRowToProduct(rowId, product.id);
                      }}
                    >
                      {relationRows.map((row, index) => {
                        const specIndex = index % Math.max(productSpecs.length, 1);
                        const qimaiSpec = getProductSpecMeta(product, specIndex);
                        return <div key={row?.id || `${product.id}-empty`} className="grid min-h-[64px] grid-cols-[minmax(170px,0.85fr)_34px_minmax(230px,1.15fr)_100px] items-center gap-2 border-t border-[#EEF0F3] px-3 py-2">
                          <div className="flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-sm border border-dashed border-[#D3D7DE] bg-white px-3 py-1.5 text-[12px]"><div className="min-w-0"><div className="truncate text-[#4E5969]">{product.name}</div><div className="mt-0.5 truncate text-[10px] text-[#86909C]">SKU {qimaiSpec.skuId} · 标识 {qimaiSpec.mark}</div></div><div className="shrink-0 text-right font-medium text-[#1D2129]"><div>{qimaiSpec.name}</div><div className="mt-0.5 text-[11px] font-normal text-[#667085]">¥{product.price.toFixed(2)}</div></div></div>
                          <div className="flex justify-center text-[#98A2B3]"><ArrowRightLeft size={17} /></div>
                          {row ? <div className="min-h-11 min-w-0 rounded-sm border border-dashed border-[#9ADBB8] bg-[#F5FFF9] px-3 py-1.5 text-[12px]"><div className="flex items-center gap-2"><div className="min-w-0 flex-1 truncate font-medium text-[#1D2129]">{row.platformName}</div><span className="shrink-0 font-mono text-[10px] text-[#86909C]">SPU {row.platformProductId}</span></div><div className="mt-1 flex items-center gap-2 border-t border-[#DDF3E7] pt-1"><span className="shrink-0 font-medium text-[#1D2129]">{row.platformSpec}</span><span className="min-w-0 flex-1 truncate text-right font-mono text-[10px] text-[#86909C]">SKU ID {getPlatformSkuId(row)} · SKU码 {row.platformSku}</span></div></div> : <div className="flex min-h-11 items-center justify-center rounded-sm border border-dashed border-[#C9CDD4] bg-white px-3 text-[12px] text-[#A9AFB9]">将左侧{activeChannel?.shortName}商品拖入这里</div>}
                          <div className="flex justify-end gap-2.5 whitespace-nowrap">{row ? <><button type="button" onClick={() => openBinding(row)} className="text-[12px] font-medium text-[#00A35B]">更换</button><button type="button" onClick={() => removeBinding(row.id)} className="text-[12px] text-[#667085]">解除</button></> : <button type="button" disabled={!activePlatformRow} onClick={() => activePlatformRow && bindPlatformRowToProduct(activePlatformRow.id, product.id)} className="text-[12px] font-medium text-[#00A35B] disabled:text-[#BFC5D0]">绑定</button>}</div>
                        </div>;
                      })}
                    </div>}
                  </article>
                );
              })}
              {filteredQimaiProducts.length === 0 && (
                <div className="flex h-[260px] flex-col items-center justify-center text-center text-[13px] text-[#86909C]">
                  <Search size={28} className="text-[#C9CDD4]" />
                  <div className="mt-3 font-semibold text-[#4E5969]">没有符合条件的企迈商品</div>
                  <button type="button" onClick={() => { setQimaiKeyword(''); setQimaiMarkKeyword(''); setRelatedPlatformKeyword(''); setQimaiSkuIdKeyword(''); setQimaiProductType('all'); }} className="mt-2 text-[#00A35B]">清空搜索条件</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderSpecialMapping = () => (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex items-center gap-3 border-b border-[#E5E6EB] p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F2F3F5] text-[#4E5969]"><Settings2 size={18} /></div>
          <div className="min-w-0"><div className="text-[14px] font-bold text-[#1D2129]">特殊映射配置</div><div className="mt-1 text-[12px] text-[#86909C]">映射匹配前替换平台商品文本，只影响匹配结果，不修改平台商品资料。</div></div>
          <button type="button" onClick={() => setEditingRule({ id: `s${Date.now()}`, name: '', channel: '美团外卖', type: 'product_name', source: '', target: '', status: 'enabled', updatedAt: '刚刚' })} className="ml-auto inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-md bg-[#00B460] px-3 text-[13px] font-bold text-white"><Plus size={15} className="mr-1.5" />新增替换规则</button>
        </div>
        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto bg-[#F7F8FA] p-4">
          <label className="flex h-9 min-w-[320px] flex-1 items-center rounded-md border border-[#C9CDD4] bg-white px-3"><Search size={15} className="mr-2 shrink-0 text-[#86909C]" /><input value={specialKeyword} onChange={event => setSpecialKeyword(event.target.value)} placeholder="搜索规则名称、查找文本或替换文本" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" /></label>
          <Field width="w-[170px] shrink-0"><span>渠道：全部</span></Field><Field width="w-[190px] shrink-0"><span>生效字段：全部</span></Field>
          <button type="button" onClick={() => setSpecialKeyword('')} className="h-9 shrink-0 whitespace-nowrap rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]">重置</button>
        </div>
      </section>
      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex min-h-11 items-center justify-between gap-4 border-b border-[#E5E6EB] px-4 py-2 text-[13px] text-[#4E5969]"><span className="shrink-0">共 {filteredSpecialRules.length} 条替换规则</span><span className="text-right text-[12px] text-[#86909C]">规则仅用于消除两端命名差异，停用后不再参与后续自动关联</span></div>
        <div className="overflow-x-auto"><div className="min-w-[980px]">
          <div className="grid grid-cols-[minmax(180px,1fr)_120px_130px_minmax(150px,1fr)_40px_minmax(150px,1fr)_100px_130px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]"><div>规则名称</div><div>平台渠道</div><div>生效字段</div><div>查找文本</div><div /><div>替换为</div><div>状态</div><div>操作</div></div>
          {filteredSpecialRules.map(rule => {
            const typeLabel = rule.type === 'product_name' ? '商品名称' : rule.type === 'sku_name' ? '规格名称' : '属性名称';
            return <div key={rule.id} className="grid min-h-[76px] grid-cols-[minmax(180px,1fr)_120px_130px_minmax(150px,1fr)_40px_minmax(150px,1fr)_100px_130px] items-center border-t border-[#F0F1F2] px-4 py-3 text-[13px]">
              <div className="min-w-0"><div className="truncate font-bold text-[#1D2129]">{rule.name}</div><div className="mt-1 text-[11px] text-[#86909C]">{rule.updatedAt}</div></div><div>{rule.channel}</div><div>{typeLabel}</div><div className="truncate pr-3 font-medium text-[#1D2129]">{rule.source}</div><ArrowRightLeft size={15} className="text-[#C9CDD4]" /><div className="truncate pr-3 text-[#1D2129]">{rule.target || '删除该文本'}</div><div><span className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[12px] font-medium ${rule.status === 'enabled' ? 'bg-[#E8FFF3] text-[#008A4B]' : 'bg-[#F2F3F5] text-[#667085]'}`}>{rule.status === 'enabled' ? '已启用' : '已停用'}</span></div><div className="flex gap-3 whitespace-nowrap"><button type="button" onClick={() => setEditingRule(rule)} className="font-medium text-[#00A35B]">编辑</button><button type="button" onClick={() => setSpecialRules(current => current.map(item => item.id === rule.id ? { ...item, status: item.status === 'disabled' ? 'enabled' : 'disabled', updatedAt: '刚刚' } : item))} className="text-[#4E5969]">{rule.status === 'disabled' ? '启用' : '停用'}</button></div>
            </div>;
          })}
        </div></div>
      </section>
    </div>
  );

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6F8]">
      <header className="shrink-0 border-b border-[#E5E6EB] bg-white">
        <nav className="flex h-12 items-end gap-6 overflow-x-auto px-6">
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveView(tab.id);
                  setMessage('');
                }}
                className={`flex h-full shrink-0 items-center whitespace-nowrap border-b-2 px-1 text-[13px] ${
                  activeView === tab.id
                    ? 'border-[#00B460] font-bold text-[#00A35B]'
                    : 'border-transparent text-[#4E5969] hover:text-[#1D2129]'
                }`}
              >
                <Icon size={15} className="mr-1.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto p-3">
        {activeView === 'store' && renderStoreMapping()}
        {activeView === 'brand' && (
          <WebBatchProductMapping
            products={products}
            channelId={channelId}
            exemptRowIds={exemptRowIds}
            exemptCount={exemptRowIds.length}
            onChannelChange={setChannelId}
            onOpenExemption={() => setShowExemptionManager(true)}
            onMessage={setMessage}
          />
        )}
        {activeView === 'diagnosis' && <WebTakeawayMappingDiagnosis />}
        {activeView === 'tasks' && <WebProductMappingTasks />}
        {activeView === 'special' && renderSpecialMapping()}
      </main>

      {message && <div role="status" aria-live="polite" className="fixed right-6 top-[68px] z-[500] flex max-w-[440px] items-start gap-2.5 rounded-lg border border-[#BFEBD3] bg-white px-4 py-3 text-[13px] leading-5 text-[#1D2129] shadow-[0_8px_28px_rgba(29,33,41,0.16)]"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00B460] text-white"><Check size={13} strokeWidth={3} /></span><span>{message}</span></div>}

      {showImportProducts && <div className="fixed inset-0 z-[320] flex items-center justify-center bg-[#1D2129]/50" role="dialog" aria-modal="true" aria-label="移入商品库商品"><div className="flex max-h-[720px] w-[min(760px,calc(100vw-48px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start border-b border-[#E5E6EB] px-6 py-4"><div><h3 className="text-[17px] font-bold text-[#1D2129]">移入商品库商品</h3><p className="mt-1 text-[12px] text-[#86909C]">从品牌商品库选择商品加入“南山万象店”，无需先在当前列表勾选。</p></div><button type="button" onClick={() => setShowImportProducts(false)} title="关闭" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#F2F3F5]"><X size={18} /></button></div><div className="shrink-0 border-b border-[#E5E6EB] bg-[#FAFBFC] p-4"><label className="flex h-9 items-center rounded-md border border-[#C9CDD4] bg-white px-3"><Search size={15} className="mr-2 text-[#86909C]" /><input value={importKeyword} onChange={event => setImportKeyword(event.target.value)} placeholder="商品名称 / SPU ID / SKU ID / 商品标识" className="min-w-0 flex-1 text-[13px] outline-none" /></label></div><div className="min-h-0 flex-1 overflow-y-auto p-4"><div className="overflow-hidden rounded-md border border-[#E5E6EB]"><div className="grid grid-cols-[44px_minmax(200px,1fr)_180px_140px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]"><div /><div>商品</div><div>SKU ID / 商品标识</div><div>商品类型</div></div>{importCandidateProducts.map(product => { const checked=selectedImportProductIds.includes(product.id); const meta=getProductSpecMeta(product,0); return <div key={product.id} className="grid min-h-[64px] grid-cols-[44px_minmax(200px,1fr)_180px_140px] items-center border-t border-[#EEF0F3] px-4 py-2.5 text-[12px]"><Checkbox checked={checked} onClick={() => setSelectedImportProductIds(checked ? selectedImportProductIds.filter(id => id !== product.id) : [...selectedImportProductIds, product.id])} /><div className="flex min-w-0 items-center gap-2.5"><img src={product.image} alt="" className="h-8 w-8 shrink-0 rounded object-cover" /><div className="min-w-0"><div className="truncate font-medium text-[#1D2129]">{product.name}</div><div className="mt-1 text-[11px] text-[#86909C]">SPU {product.id}</div></div></div><div className="min-w-0"><div className="truncate font-mono text-[#4E5969]">{meta.skuId}</div><div className="mt-1 truncate font-mono text-[11px] text-[#86909C]">{meta.mark}</div></div><div>{getProductType(product) === 'combo' ? '套餐商品' : '标准商品'}</div></div>; })}</div></div><div className="flex items-center justify-between border-t border-[#E5E6EB] bg-[#FAFBFC] px-6 py-4"><span className="text-[12px] text-[#667085]">已选择 {selectedImportProductIds.length} 个商品</span><div className="flex gap-2"><button type="button" onClick={() => setShowImportProducts(false)} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px]">取消</button><button type="button" disabled={!selectedImportProductIds.length} onClick={() => { setShowImportProducts(false); setMessage(`已将 ${selectedImportProductIds.length} 个商品从品牌商品库加入南山万象店。`); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white disabled:bg-[#C9CDD4]">确认移入</button></div></div></div></div>}

      {showCopyRelations && <div className="fixed inset-0 z-[320] flex items-center justify-center bg-[#1D2129]/50" role="dialog" aria-modal="true" aria-label="复制关系到其他门店"><div className="flex max-h-[760px] w-[min(780px,calc(100vw-48px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-start border-b border-[#E5E6EB] px-6 py-4"><div><h3 className="text-[17px] font-bold text-[#1D2129]">复制关系到其他门店</h3><p className="mt-1 text-[12px] text-[#86909C]">以“南山万象店”为来源，在流程内选择复制全部或部分商品关系。</p></div><button type="button" onClick={() => setShowCopyRelations(false)} title="关闭" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#F2F3F5]"><X size={18} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-6"><div className="text-[13px] font-bold text-[#1D2129]">1. 选择复制商品范围</div><div className="mt-3 grid grid-cols-2 gap-3"><button type="button" onClick={() => setCopyScope('all')} className={`rounded-lg border p-4 text-left ${copyScope === 'all' ? 'border-[#45D28A] bg-[#F2FFF8]' : 'border-[#E5E6EB]'}`}><div className="flex items-center gap-2 font-medium text-[#1D2129]"><Radio active={copyScope === 'all'} />全部已映射商品</div><div className="mt-2 pl-6 text-[11px] text-[#86909C]">复制当前门店全部 {counts.mapped} 个已映射平台商品</div></button><button type="button" onClick={() => setCopyScope('partial')} className={`rounded-lg border p-4 text-left ${copyScope === 'partial' ? 'border-[#45D28A] bg-[#F2FFF8]' : 'border-[#E5E6EB]'}`}><div className="flex items-center gap-2 font-medium text-[#1D2129]"><Radio active={copyScope === 'partial'} />选择部分商品</div><div className="mt-2 pl-6 text-[11px] text-[#86909C]">在本流程选择需要复制的商品关系</div></button></div>{copyScope === 'partial' && <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-[#E5E6EB] bg-[#FAFBFC] p-3">{products.slice(0,6).map(product => { const checked=selectedCopyProductIds.includes(product.id); return <div key={product.id} className="flex h-9 items-center rounded-md bg-white px-3 text-[12px]"><Checkbox checked={checked} onClick={() => setSelectedCopyProductIds(checked ? selectedCopyProductIds.filter(id => id !== product.id) : [...selectedCopyProductIds, product.id])} /><span className="ml-2 truncate">{product.name}</span></div>; })}</div>}<div className="mt-6 text-[13px] font-bold text-[#1D2129]">2. 选择目标门店</div><div className="mt-3 grid grid-cols-2 gap-2">{copyStoreOptions.map(storeOption => { const checked=selectedCopyStoreIds.includes(storeOption.id); return <div key={storeOption.id} className={`flex h-12 items-center rounded-md border px-3 text-[12px] ${checked ? 'border-[#77D9A5] bg-[#F2FFF8]' : 'border-[#E5E6EB]'}`}><Checkbox checked={checked} onClick={() => setSelectedCopyStoreIds(checked ? selectedCopyStoreIds.filter(id => id !== storeOption.id) : [...selectedCopyStoreIds, storeOption.id])} /><div className="ml-2"><div className="font-medium text-[#1D2129]">{storeOption.name}</div><div className="mt-0.5 text-[10px] text-[#86909C]">门店编号 {storeOption.code}</div></div></div>; })}</div><div className="mt-4 rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-[12px] text-[#245B8A]">复制时若目标门店已存在关系，将在确认页逐条提示覆盖冲突，不会直接静默替换。</div></div><div className="flex items-center justify-between border-t border-[#E5E6EB] bg-[#FAFBFC] px-6 py-4"><span className="text-[12px] text-[#667085]">{copyScope === 'all' ? `全部 ${counts.mapped} 个已映射商品` : `已选 ${selectedCopyProductIds.length} 个商品`} · {selectedCopyStoreIds.length} 家目标门店</span><div className="flex gap-2"><button type="button" onClick={() => setShowCopyRelations(false)} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px]">取消</button><button type="button" disabled={!selectedCopyStoreIds.length || (copyScope === 'partial' && !selectedCopyProductIds.length)} onClick={() => { setShowCopyRelations(false); setMessage(`复制任务已创建：${copyScope === 'all' ? `全部 ${counts.mapped} 个` : `${selectedCopyProductIds.length} 个`}商品关系，目标 ${selectedCopyStoreIds.length} 家门店。`); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white disabled:bg-[#C9CDD4]">下一步：确认冲突</button></div></div></div></div>}

      {relationDetailProduct && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center bg-[#1D2129]/50" role="dialog" aria-modal="true" aria-label="映射关系详情">
          <div className="flex max-h-[760px] w-[min(1080px,calc(100vw-48px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start border-b border-[#E5E6EB] px-6 py-4">
              <div><h3 className="text-[17px] font-bold text-[#1D2129]">映射关系详情</h3><p className="mt-1 text-[12px] text-[#86909C]">一个企迈商品可关联多个{THIRD_PARTY_CHANNELS.find(channel => channel.id === channelId)?.shortName}商品，解除操作仅影响所选关系。</p></div>
              <button type="button" onClick={() => setRelationDetailProductId(null)} title="关闭" className="ml-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#F2F3F5]"><X size={18} /></button>
            </div>
            <div className="shrink-0 border-b border-[#E5E6EB] bg-[#F5FFF9] px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00B460] text-[12px] font-bold text-white">企</span><div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold text-[#1D2129]">{relationDetailProduct.name}</div><div className="mt-1 text-[12px] text-[#667085]">企迈 SPU ID <span className="select-all font-mono text-[#1D2129]">{relationDetailProduct.id}</span><span className="mx-2 text-[#C9CDD4]">·</span>{Math.max(relationDetailProduct.specs?.length || 0, 1)} 个企迈规格</div></div><span className="shrink-0 rounded bg-[#E8FFF3] px-2 py-1 text-[12px] font-medium text-[#008A4B]">已关联 {new Set(relationDetailRows.map(row => row.platformProductId)).size} 个平台 SPU / {relationDetailRows.length} 个 SKU</span></div></div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="overflow-x-auto rounded-md border border-[#E5E6EB]"><div className="min-w-[1000px]">
                <div className="grid grid-cols-[165px_135px_165px_170px_120px_140px_56px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]"><div>企迈规格 / SKU ID</div><div>商品标识</div><div>{THIRD_PARTY_CHANNELS.find(channel => channel.id === channelId)?.shortName}商品 / 规格</div><div>平台 SPU / SKU ID</div><div>平台 SKU码</div><div>绑定更新时间</div><div>操作</div></div>
                {Array.from({ length: Math.max(relationDetailProduct.specs?.length || 0, relationDetailRows.length, 1) }, (_, index) => {
                  const specIndex = index % Math.max(relationDetailProduct.specs?.length || 0, 1);
                  const specMeta = getProductSpecMeta(relationDetailProduct, specIndex);
                  const row = relationDetailRows[index];
                  return <div key={row?.id || `${relationDetailProduct.id}-spec-${index}`} className="grid min-h-[72px] grid-cols-[165px_135px_165px_170px_120px_140px_56px] items-center border-t border-[#EEF0F3] px-4 py-2.5 text-[12px]"><div className="min-w-0 pr-3"><div className="truncate font-medium text-[#1D2129]">{specMeta.name}</div><div className="mt-1 select-all truncate font-mono text-[11px] text-[#667085]">{specMeta.skuId}</div></div><div className="select-all truncate pr-3 font-mono text-[#1D2129]">{specMeta.mark}</div><div className="min-w-0 pr-3">{row ? <><div className="truncate font-medium text-[#1D2129]">{row.platformName}</div><div className="mt-1 truncate text-[11px] text-[#86909C]">{row.platformSpec}</div></> : <span className="text-[#A9AFB9]">未绑定平台商品</span>}</div><div className="min-w-0 pr-3">{row ? <><div className="select-all truncate font-mono text-[#4E5969]">SPU {row.platformProductId}</div><div className="mt-1 select-all truncate font-mono text-[11px] text-[#667085]">SKU {getPlatformSkuId(row)}</div></> : <span className="text-[#A9AFB9]">--</span>}</div><div className="select-all truncate pr-3 font-mono text-[#4E5969]">{row?.platformSku || '--'}</div><div className="text-[#4E5969]">{row?.updatedAt || '--'}</div><div>{row ? <button type="button" onClick={() => removeBinding(row.id)} className="font-medium text-[#CB2634]">解除</button> : <span className="text-[#BFC5D0]">--</span>}</div></div>;
                })}
              </div></div>
            </div>
            <div className="flex justify-end border-t border-[#E5E6EB] bg-[#FAFBFC] px-6 py-4"><button type="button" onClick={() => setRelationDetailProductId(null)} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]">关闭</button></div>
          </div>
        </div>
      )}

      {bindingRow && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#1D2129]/55">
          <div className="flex max-h-[720px] w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div>
                <h3 className="text-[18px] font-bold text-[#1D2129]">选择企迈商品</h3>
                <p className="mt-1 text-[12px] text-[#86909C]">
                  {bindingRow.platformName} · {bindingRow.platformSpec} · SKU ID {getPlatformSkuId(bindingRow)} · SKU码 {bindingRow.platformSku}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBindingRow(null)}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[#F2F3F5]"
                title="关闭"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <label className="flex h-9 items-center rounded-md border border-[#C9CDD4] bg-white px-3">
                <Search size={15} className="mr-2 text-[#86909C]" />
                <input
                  value={candidateKeyword}
                  onChange={event => setCandidateKeyword(event.target.value)}
                  placeholder="搜索商品名称或 SKUID"
                  className="min-w-0 flex-1 text-[13px] outline-none"
                />
              </label>
              <div className="mt-3 overflow-hidden rounded-md border border-[#E5E6EB]">
                {candidateProducts.map((product: Product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setCandidateProductId(product.id)}
                    className={`flex w-full items-center gap-3 border-b border-[#F0F1F2] px-4 py-3 text-left last:border-b-0 ${
                      candidateProductId === product.id ? 'bg-[#F2FFF8]' : 'hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <Radio active={candidateProductId === product.id} />
                    <img src={product.image} alt="" className="h-10 w-10 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-[#1D2129]">{product.name}</div>
                      <div className="mt-1 text-[12px] text-[#86909C]">
                        商品标识 {getProductMark(product)} · SKUID {product.skuCode} · {getProductType(product) === 'combo' ? '套餐商品' : '标准商品'}
                      </div>
                    </div>
                    <div className="text-[12px] text-[#4E5969]">¥{product.price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
              <button
                type="button"
                onClick={() => setBindingRow(null)}
                className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]"
              >
                取消
              </button>
              <button
                type="button"
                disabled={!candidateProductId}
                onClick={saveBinding}
                className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C9CDD4]"
              >
                保存映射
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRule && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#1D2129]/55">
          <div className="flex max-h-[760px] w-[min(680px,calc(100vw-64px))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div>
                <h3 className="text-[18px] font-bold text-[#1D2129]">
                  {specialRules.some(rule => rule.id === editingRule.id) ? '编辑替换规则' : '新增替换规则'}
                </h3>
                <p className="mt-1 text-[12px] text-[#86909C]">
                  配置平台文本在匹配前的替换方式，不会回写平台商品资料。
                </p>
              </div>
              <button type="button" onClick={() => setEditingRule(null)} title="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-y-auto p-6">
              <label className="col-span-2">
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">规则名称 *</span>
                <input
                  value={editingRule.name}
                  onChange={event => setEditingRule({ ...editingRule, name: event.target.value })}
                  placeholder="请输入便于识别的规则名称"
                  className="h-9 w-full rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">平台渠道</span>
                <select
                  value={editingRule.channel}
                  onChange={event => setEditingRule({ ...editingRule, channel: event.target.value })}
                  className="h-9 w-full rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] outline-none"
                >
                  <option>美团外卖</option>
                  <option>淘宝闪购</option>
                  <option>抖音在线点</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">生效字段</span>
                <select
                  value={editingRule.type}
                  onChange={event =>
                    setEditingRule({
                      ...editingRule,
                      type: event.target.value as SpecialRule['type'],
                    })
                  }
                  className="h-9 w-full rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] outline-none"
                >
                  <option value="product_name">商品名称</option>
                  <option value="sku_name">规格名称</option>
                  <option value="attribute_name">属性名称</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">查找文本 *</span>
                <input
                  value={editingRule.source}
                  onChange={event => setEditingRule({ ...editingRule, source: event.target.value })}
                  placeholder="例如：（外卖专享）"
                  className="h-9 w-full rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">替换为</span>
                <input
                  value={editingRule.target}
                  onChange={event => setEditingRule({ ...editingRule, target: event.target.value })}
                  placeholder="留空表示删除查找文本"
                  className="h-9 w-full rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]"
                />
              </label>
              <div className="col-span-2 flex items-start gap-2 rounded-md border border-[#FFD8A8] bg-[#FFF9F0] px-3 py-2 text-[12px] text-[#9A5A16]">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                示例：“招牌奶茶（外卖专享）”查找“（外卖专享）”并替换为空后，将以“招牌奶茶”参与匹配。相同渠道和字段下不允许重复查找文本。
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]"
              >
                取消
              </button>
              <button
                type="button"
                disabled={!editingRule.name || !editingRule.source}
                onClick={saveSpecialRule}
                className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C9CDD4]"
              >
                保存规则
              </button>
            </div>
          </div>
        </div>
      )}

      {showExemptionManager && (
        <WebMappingExemptionManager
          channelName={THIRD_PARTY_CHANNELS.find(channel => channel.id === channelId)?.name || '当前渠道'}
          rows={rows}
          exemptRowIds={exemptRowIds}
          onChange={ids => {
            const addedCount = ids.filter(id => !exemptRowIds.includes(id)).length;
            const restoredCount = exemptRowIds.filter(id => !ids.includes(id)).length;
            setExemptRowIds(ids);
            setMessage(addedCount ? `已新增 ${addedCount} 个免绑定商品。` : restoredCount ? `已恢复 ${restoredCount} 个商品至待映射范围。` : '免绑定商品配置未变化。');
          }}
          onClose={() => setShowExemptionManager(false)}
        />
      )}

    </div>
  );
};
