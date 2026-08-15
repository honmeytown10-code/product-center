import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRightLeft,
  Building2,
  Check,
  ChevronDown,
  Copy,
  Link2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Store,
  Unlink,
  X,
} from 'lucide-react';
import { useProducts } from '../../context';
import { THIRD_PARTY_CHANNELS } from '../../omnichannel';
import type { Product, ThirdPartyChannelId } from '../../types';

type MappingView = 'store' | 'brand' | 'special';
type MappingStatus = 'unmapped' | 'mapped' | 'conflict' | 'invalid';
type MappingBasis = 'qimai_publish' | 'qimai_sku_id' | 'merchant_product_code' | 'manual_binding' | '--';
type BrandApplyStatus = 'ready' | 'partial' | 'conflict' | 'applied';
type SpecialRuleStatus = 'enabled' | 'disabled' | 'conflict';

type MappingRow = {
  id: string;
  platformName: string;
  platformSku: string;
  platformSpec: string;
  qimaiProductId?: string;
  status: MappingStatus;
  mappingBasis: MappingBasis;
  updatedAt: string;
  issue?: string;
};

type BrandMappingRow = {
  id: string;
  qimaiProductId: string;
  platformProduct: string;
  platformSpec: string;
  sourceStore: string;
  targetStoreCount: number;
  matchedStoreCount: number;
  status: BrandApplyStatus;
  issue?: string;
};

type SpecialRule = {
  id: string;
  name: string;
  channel: string;
  type: 'attribute_to_addon' | 'combo_item';
  source: string;
  target: string;
  stores: string;
  priority: number;
  status: SpecialRuleStatus;
  updatedAt: string;
};

const initialRows: MappingRow[] = [
  {
    id: 'm1',
    platformName: '招牌珍珠奶茶',
    platformSku: 'MT-77821',
    platformSpec: '大杯 / 冰',
    qimaiProductId: '1',
    status: 'mapped',
    mappingBasis: 'qimai_publish',
    updatedAt: '2026-07-29 09:42',
  },
  {
    id: 'm2',
    platformName: '手打柠檬茶（冰）',
    platformSku: 'MT-77822',
    platformSpec: '标准',
    status: 'unmapped',
    mappingBasis: '--',
    updatedAt: '2026-07-29 09:41',
  },
  {
    id: 'm3',
    platformName: '黑糖波波鲜奶',
    platformSku: 'MT-77823',
    platformSpec: '中杯',
    qimaiProductId: '3',
    status: 'conflict',
    mappingBasis: 'merchant_product_code',
    updatedAt: '2026-07-29 09:40',
    issue: '同一商品标识匹配到 2 个企迈规格',
  },
  {
    id: 'm4',
    platformName: '多肉葡萄',
    platformSku: 'MT-77824',
    platformSpec: '大杯',
    qimaiProductId: '4',
    status: 'invalid',
    mappingBasis: 'manual_binding',
    updatedAt: '2026-07-28 18:22',
    issue: '关联的企迈商品已停用',
  },
  {
    id: 'm5',
    platformName: '经典牛肉汉堡',
    platformSku: 'MT-77825',
    platformSpec: '标准',
    qimaiProductId: '6',
    status: 'mapped',
    mappingBasis: 'qimai_sku_id',
    updatedAt: '2026-07-28 17:56',
  },
];

const initialBrandRows: BrandMappingRow[] = [
  {
    id: 'b1',
    qimaiProductId: '1',
    platformProduct: '招牌珍珠奶茶',
    platformSpec: '中杯、大杯',
    sourceStore: '南山万象店',
    targetStoreCount: 18,
    matchedStoreCount: 18,
    status: 'ready',
  },
  {
    id: 'b2',
    qimaiProductId: '2',
    platformProduct: '手打柠檬茶',
    platformSpec: '标准',
    sourceStore: '南山万象店',
    targetStoreCount: 18,
    matchedStoreCount: 15,
    status: 'partial',
    issue: '3 家门店未找到同标识平台商品',
  },
  {
    id: 'b3',
    qimaiProductId: '3',
    platformProduct: '黑糖波波鲜奶',
    platformSpec: '中杯',
    sourceStore: '福田卓悦店',
    targetStoreCount: 12,
    matchedStoreCount: 10,
    status: 'conflict',
    issue: '2 家门店存在重复映射关系',
  },
  {
    id: 'b4',
    qimaiProductId: '6',
    platformProduct: '经典牛肉汉堡',
    platformSpec: '标准',
    sourceStore: '宝安壹方城店',
    targetStoreCount: 8,
    matchedStoreCount: 8,
    status: 'applied',
  },
];

const initialSpecialRules: SpecialRule[] = [
  {
    id: 's1',
    name: '美团甜度属性转加料',
    channel: '美团外卖',
    type: 'attribute_to_addon',
    source: '甜度：少糖 / 半糖 / 无糖',
    target: '加料组：甜度',
    stores: '华东区域 · 58 家门店',
    priority: 10,
    status: 'enabled',
    updatedAt: '2026-07-29 16:24',
  },
  {
    id: 's2',
    name: '淘宝闪购温度属性转做法',
    channel: '淘宝闪购',
    type: 'attribute_to_addon',
    source: '温度：热 / 常温 / 去冰',
    target: '做法组：温度',
    stores: '全部门店 · 168 家',
    priority: 20,
    status: 'enabled',
    updatedAt: '2026-07-28 18:10',
  },
  {
    id: 's3',
    name: '双人套餐子项映射',
    channel: '美团外卖',
    type: 'combo_item',
    source: '平台套餐组：饮品二选一',
    target: '企迈套餐组：双人餐饮品',
    stores: '华南区域 · 42 家门店',
    priority: 30,
    status: 'conflict',
    updatedAt: '2026-07-27 11:36',
  },
];

const mappingBasisLabels: Record<MappingBasis, string> = {
  qimai_publish: '企迈发布建立',
  qimai_sku_id: '企迈 SKUID',
  merchant_product_code: '商家商品标识',
  manual_binding: '后台绑定',
  '--': '--',
};

const statusMeta: Record<MappingStatus, { label: string; classes: string }> = {
  unmapped: { label: '未映射', classes: 'bg-[#FFF7E8] text-[#D46B08]' },
  mapped: { label: '已映射', classes: 'bg-[#E8FFF3] text-[#008A4B]' },
  conflict: { label: '映射冲突', classes: 'bg-[#FFECE8] text-[#CB2634]' },
  invalid: { label: '关系失效', classes: 'bg-[#F2F3F5] text-[#667085]' },
};

const storeStatusTabs: Array<{ id: 'all' | MappingStatus; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'unmapped', label: '未映射' },
  { id: 'conflict', label: '映射冲突' },
  { id: 'invalid', label: '关系失效' },
  { id: 'mapped', label: '已映射' },
];

const viewTabs: Array<{ id: MappingView; label: string; icon: React.ElementType }> = [
  { id: 'store', label: '门店商品映射', icon: Store },
  { id: 'brand', label: '品牌批量映射', icon: Building2 },
  { id: 'special', label: '特殊映射配置', icon: Settings2 },
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
  const [activeView, setActiveView] = useState<MappingView>('store');
  const [channelId, setChannelId] = useState<ThirdPartyChannelId>('meituan');
  const [status, setStatus] = useState<'all' | MappingStatus>('unmapped');
  const [keyword, setKeyword] = useState('');
  const [qimaiKeyword, setQimaiKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rows, setRows] = useState<MappingRow[]>(initialRows);
  const [bindingRow, setBindingRow] = useState<MappingRow | null>(null);
  const [candidateKeyword, setCandidateKeyword] = useState('');
  const [candidateProductId, setCandidateProductId] = useState('');
  const [message, setMessage] = useState('');

  const [brandRows, setBrandRows] = useState<BrandMappingRow[]>(initialBrandRows);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [brandKeyword, setBrandKeyword] = useState('');
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  const [specialRules, setSpecialRules] = useState<SpecialRule[]>(initialSpecialRules);
  const [specialKeyword, setSpecialKeyword] = useState('');
  const [editingRule, setEditingRule] = useState<SpecialRule | null>(null);

  const getProduct = (id?: string) => products.find(item => item.id === id);

  const filteredRows = useMemo(
    () =>
      rows.filter(row => {
        const statusMatched = status === 'all' || row.status === status;
        const keywordMatched =
          !keyword || `${row.platformName}${row.platformSku}`.toLowerCase().includes(keyword.toLowerCase());
        const product = products.find(item => item.id === row.qimaiProductId);
        const qimaiMatched =
          !qimaiKeyword ||
          `${product?.name || ''}${product?.skuCode || ''}`.toLowerCase().includes(qimaiKeyword.toLowerCase());
        return statusMatched && keywordMatched && qimaiMatched;
      }),
    [keyword, products, qimaiKeyword, rows, status],
  );

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

  const filteredBrandRows = useMemo(
    () =>
      brandRows.filter(row => {
        const product = getProduct(row.qimaiProductId);
        return (
          !brandKeyword ||
          `${product?.name || ''}${row.platformProduct}${row.sourceStore}`
            .toLowerCase()
            .includes(brandKeyword.toLowerCase())
        );
      }),
    [brandKeyword, brandRows, products],
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
      all: rows.length,
      unmapped: rows.filter(row => row.status === 'unmapped').length,
      mapped: rows.filter(row => row.status === 'mapped').length,
      conflict: rows.filter(row => row.status === 'conflict').length,
      invalid: rows.filter(row => row.status === 'invalid').length,
    }),
    [rows],
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
              issue: undefined,
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
              issue: undefined,
              updatedAt: '刚刚',
            }
          : row,
      ),
    );
  };

  const autoMatch = () => {
    setRows(current =>
      current.map(row =>
        row.status === 'unmapped'
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
    setMessage('商品标识匹配已完成：新增 1 条关系；冲突结果仍需人工确认。');
  };

  const applyBrandMappings = () => {
    setBrandRows(current =>
      current.map(row =>
        selectedBrandIds.includes(row.id) && row.status !== 'conflict'
          ? {
              ...row,
              status: 'applied',
              matchedStoreCount: row.targetStoreCount,
              issue: undefined,
            }
          : row,
      ),
    );
    const conflictCount = brandRows.filter(
      row => selectedBrandIds.includes(row.id) && row.status === 'conflict',
    ).length;
    setMessage(
      `品牌映射已应用至目标门店：成功 ${selectedBrandIds.length - conflictCount} 个商品${
        conflictCount ? `，${conflictCount} 个冲突商品未处理` : ''
      }。`,
    );
    setSelectedBrandIds([]);
    setShowApplyDialog(false);
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
    setMessage('特殊映射规则已保存；发布与接单识别时将按适用渠道、门店范围和优先级执行。');
  };

  const renderStoreMapping = () => (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E6EB] px-4 py-3">
          <span className="mr-1 text-[13px] font-bold text-[#1D2129]">映射范围</span>
          <Field>
            <span className="inline-flex items-center">
              <Store size={14} className="mr-1.5 text-[#86909C]" />
              南山万象店
            </span>
          </Field>
          <span className="ml-3 text-[13px] font-bold text-[#1D2129]">平台渠道</span>
          <div className="flex flex-wrap gap-1">
            {THIRD_PARTY_CHANNELS.map(channel => (
              <button
                key={channel.id}
                type="button"
                onClick={() => setChannelId(channel.id)}
                className={`h-8 rounded-md px-3 text-[12px] ${
                  channelId === channel.id
                    ? 'bg-[#E8FFF3] font-bold text-[#008A4B]'
                    : 'text-[#4E5969] hover:bg-[#F2F3F5]'
                }`}
              >
                {channel.shortName}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setMessage('已创建平台商品更新任务，完成后将重新计算待映射与冲突数量。')}
              className="inline-flex h-8 items-center rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] text-[#4E5969]"
            >
              <RefreshCw size={14} className="mr-1.5" />
              更新平台商品
            </button>
            <button
              type="button"
              onClick={autoMatch}
              className="inline-flex h-8 items-center rounded-md bg-[#00B460] px-3 text-[12px] font-bold text-white"
            >
              <Sparkles size={14} className="mr-1.5" />
              按商品标识匹配
            </button>
          </div>
        </div>

        <div className="flex h-12 items-end gap-6 border-b border-[#E5E6EB] px-4">
          {storeStatusTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatus(tab.id);
                setSelectedIds([]);
              }}
              className={`h-full border-b-2 px-1 text-[13px] ${
                status === tab.id
                  ? 'border-[#00B460] font-bold text-[#00A35B]'
                  : 'border-transparent text-[#4E5969]'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[11px] text-[#86909C]">{counts[tab.id]}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_1fr_120px] gap-3 bg-[#F7F8FA] p-4">
          <label className="flex h-9 items-center rounded-md border border-[#C9CDD4] bg-white px-3">
            <Search size={15} className="mr-2 text-[#86909C]" />
            <input
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              placeholder="平台商品名称 / 平台 SKU"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            />
          </label>
          <label className="flex h-9 items-center rounded-md border border-[#C9CDD4] bg-white px-3">
            <Search size={15} className="mr-2 text-[#86909C]" />
            <input
              value={qimaiKeyword}
              onChange={event => setQimaiKeyword(event.target.value)}
              placeholder="企迈商品名称 / SKUID"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setQimaiKeyword('');
            }}
            className="h-9 rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]"
          >
            重置
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex h-12 items-center justify-between border-b border-[#E5E6EB] px-4">
          <div className="text-[13px] text-[#4E5969]">
            {selectedIds.length > 0 ? (
              <>
                已选 <strong className="text-[#00A35B]">{selectedIds.length}</strong> 项
              </>
            ) : (
              `共 ${filteredRows.length} 条映射关系`
            )}
          </div>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            className="inline-flex h-8 items-center rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] text-[#4E5969] disabled:cursor-not-allowed disabled:text-[#C9CDD4]"
          >
            <ArrowRightLeft size={14} className="mr-1.5" />
            批量建立映射
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1220px]">
            <div className="grid grid-cols-[44px_1.15fr_48px_1.15fr_120px_140px_120px_150px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]">
              <div />
              <div>{THIRD_PARTY_CHANNELS.find(channel => channel.id === channelId)?.name}商品</div>
              <div />
              <div>企迈门店渠道商品</div>
              <div>映射状态</div>
              <div>关联依据</div>
              <div>更新时间</div>
              <div>操作</div>
            </div>

            {filteredRows.map(row => {
              const product = getProduct(row.qimaiProductId);
              const selected = selectedIds.includes(row.id);
              return (
                <div
                  key={row.id}
                  className="grid min-h-[92px] grid-cols-[44px_1.15fr_48px_1.15fr_120px_140px_120px_150px] items-center border-t border-[#F0F1F2] px-4 py-3 text-[13px]"
                >
                  <div>
                    <Checkbox
                      checked={selected}
                      onClick={() =>
                        setSelectedIds(
                          selected ? selectedIds.filter(id => id !== row.id) : [...selectedIds, row.id],
                        )
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-[#1D2129]" title={row.platformName}>
                      {row.platformName}
                    </div>
                    <div className="mt-1 text-[12px] text-[#86909C]">
                      {row.platformSpec} · {row.platformSku}
                    </div>
                  </div>
                  <div className="flex justify-center text-[#C9CDD4]">
                    <Link2 size={18} />
                  </div>
                  <div className="min-w-0">
                    {product ? (
                      <div className="flex min-w-0 items-center gap-2">
                        <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                        <div className="min-w-0">
                          <div className="truncate font-bold text-[#1D2129]" title={product.name}>
                            {product.name}
                          </div>
                          <div className="mt-1 text-[12px] text-[#86909C]">SKUID {product.skuCode}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[12px] text-[#86909C]">尚未关联企迈商品</span>
                    )}
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded px-2 py-1 text-[12px] font-medium ${
                        statusMeta[row.status].classes
                      }`}
                    >
                      {statusMeta[row.status].label}
                    </span>
                    {row.issue && (
                      <div
                        className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#CB2634]"
                        title={row.issue}
                      >
                        {row.issue}
                      </div>
                    )}
                  </div>
                  <div className="text-[#4E5969]">{mappingBasisLabels[row.mappingBasis]}</div>
                  <div className="text-[12px] text-[#86909C]">{row.updatedAt}</div>
                  <div className="flex items-center gap-3 bg-white">
                    <button
                      type="button"
                      onClick={() => openBinding(row)}
                      className="font-medium text-[#00A35B]"
                    >
                      {row.qimaiProductId ? '修改映射' : '建立映射'}
                    </button>
                    {row.qimaiProductId && (
                      <button
                        type="button"
                        onClick={() => removeBinding(row.id)}
                        className="text-[#4E5969]"
                        title="解除映射"
                      >
                        <Unlink size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredRows.length === 0 && (
          <div className="flex h-[260px] flex-col items-center justify-center text-center">
            <Search size={28} className="text-[#C9CDD4]" />
            <div className="mt-3 text-[14px] font-bold text-[#4E5969]">没有符合条件的商品</div>
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setQimaiKeyword('');
                setStatus('all');
              }}
              className="mt-2 text-[13px] text-[#00A35B]"
            >
              清空筛选
            </button>
          </div>
        )}
      </section>
    </div>
  );

  const renderBrandMapping = () => (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E6EB] p-4">
          <div className="mr-3 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8FFF3] text-[#00A35B]">
              <Copy size={18} />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#1D2129]">复用已验证的门店映射关系</div>
              <div className="mt-1 text-[12px] text-[#86909C]">
                以参考门店为基准，校验目标门店平台商品后批量建立关系。
              </div>
            </div>
          </div>
          <Field>
            <span>渠道：美团外卖</span>
          </Field>
          <Field width="min-w-[184px]">
            <span>参考门店：南山万象店</span>
          </Field>
          <Field width="min-w-[196px]">
            <span>目标范围：华南区域 18 家</span>
          </Field>
        </div>
        <div className="flex items-center gap-3 bg-[#F7F8FA] p-4">
          <label className="flex h-9 min-w-[360px] items-center rounded-md border border-[#C9CDD4] bg-white px-3">
            <Search size={15} className="mr-2 text-[#86909C]" />
            <input
              value={brandKeyword}
              onChange={event => setBrandKeyword(event.target.value)}
              placeholder="搜索企迈商品、平台商品或参考门店"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => setBrandKeyword('')}
            className="h-9 rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]"
          >
            重置
          </button>
          <button
            type="button"
            onClick={() => setMessage('已重新校验品牌映射的门店差异，冲突结果已刷新。')}
            className="ml-auto inline-flex h-9 items-center rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]"
          >
            <RefreshCw size={14} className="mr-1.5" />
            重新校验门店差异
          </button>
          <button
            type="button"
            disabled={selectedBrandIds.length === 0}
            onClick={() => setShowApplyDialog(true)}
            className="inline-flex h-9 items-center rounded-md bg-[#00B460] px-3 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C9CDD4]"
          >
            <ArrowRightLeft size={14} className="mr-1.5" />
            批量应用映射
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex h-11 items-center justify-between border-b border-[#E5E6EB] px-4 text-[13px] text-[#4E5969]">
          <span>
            共 {filteredBrandRows.length} 个品牌商品
            {selectedBrandIds.length > 0 && (
              <>
                ，已选 <strong className="text-[#00A35B]">{selectedBrandIds.length}</strong> 个
              </>
            )}
          </span>
          <span className="text-[12px] text-[#86909C]">冲突商品不会被批量覆盖，需先调整门店关系</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <div className="grid grid-cols-[44px_1.15fr_1.1fr_150px_120px_150px_160px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]">
              <div />
              <div>企迈品牌商品</div>
              <div>参考门店平台商品</div>
              <div>来源门店</div>
              <div>目标门店</div>
              <div>校验结果</div>
              <div>操作</div>
            </div>
            {filteredBrandRows.map(row => {
              const product = getProduct(row.qimaiProductId);
              const selected = selectedBrandIds.includes(row.id);
              const meta: Record<BrandApplyStatus, { label: string; classes: string }> = {
                ready: { label: '可应用', classes: 'bg-[#E8FFF3] text-[#008A4B]' },
                partial: { label: '部分匹配', classes: 'bg-[#FFF7E8] text-[#D46B08]' },
                conflict: { label: '存在冲突', classes: 'bg-[#FFECE8] text-[#CB2634]' },
                applied: { label: '已应用', classes: 'bg-[#F2F3F5] text-[#667085]' },
              };
              return (
                <div
                  key={row.id}
                  className="grid min-h-[88px] grid-cols-[44px_1.15fr_1.1fr_150px_120px_150px_160px] items-center border-t border-[#F0F1F2] px-4 py-3 text-[13px]"
                >
                  <Checkbox
                    checked={selected}
                    onClick={() =>
                      setSelectedBrandIds(
                        selected
                          ? selectedBrandIds.filter(id => id !== row.id)
                          : [...selectedBrandIds, row.id],
                      )
                    }
                  />
                  <div className="flex min-w-0 items-center gap-2">
                    {product && (
                      <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-bold text-[#1D2129]">{product?.name || '--'}</div>
                      <div className="mt-1 text-[12px] text-[#86909C]">SKUID {product?.skuCode || '--'}</div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[#1D2129]">{row.platformProduct}</div>
                    <div className="mt-1 text-[12px] text-[#86909C]">{row.platformSpec}</div>
                  </div>
                  <div className="text-[#4E5969]">{row.sourceStore}</div>
                  <div>
                    <div className="font-medium text-[#1D2129]">{row.targetStoreCount} 家</div>
                    <div className="mt-1 text-[11px] text-[#86909C]">
                      已匹配 {row.matchedStoreCount} 家
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded px-2 py-1 text-[12px] font-medium ${
                        meta[row.status].classes
                      }`}
                    >
                      {meta[row.status].label}
                    </span>
                    {row.issue && (
                      <div className="mt-1 text-[11px] leading-4 text-[#CB2634]">{row.issue}</div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setMessage(`${row.platformProduct}：目标门店 ${row.targetStoreCount} 家，已匹配 ${row.matchedStoreCount} 家${row.issue ? `；${row.issue}` : ''}`)} className="font-medium text-[#00A35B]">
                      查看门店差异
                    </button>
                    {row.status === 'conflict' && (
                      <button type="button" onClick={() => setMessage(`请先调整“${row.platformProduct}”的来源门店或企迈商品关系，再批量应用映射。`)} className="text-[#4E5969]">
                        调整关系
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );

  const renderSpecialMapping = () => (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex items-center gap-3 border-b border-[#E5E6EB] p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#F2F3F5] text-[#4E5969]">
            <Settings2 size={18} />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#1D2129]">处理平台与企迈商品结构差异</div>
            <div className="mt-1 text-[12px] text-[#86909C]">
              仅为普通 SKU 映射无法表达的属性、加料与套餐子项关系建立例外规则。
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditingRule({
                id: `s${Date.now()}`,
                name: '',
                channel: '美团外卖',
                type: 'attribute_to_addon',
                source: '',
                target: '',
                stores: '全部门店',
                priority: 10,
                status: 'enabled',
                updatedAt: '刚刚',
              })
            }
            className="ml-auto inline-flex h-9 items-center rounded-md bg-[#00B460] px-3 text-[13px] font-bold text-white"
          >
            <Plus size={15} className="mr-1.5" />
            新增特殊映射
          </button>
        </div>
        <div className="flex items-center gap-3 bg-[#F7F8FA] p-4">
          <label className="flex h-9 min-w-[420px] items-center rounded-md border border-[#C9CDD4] bg-white px-3">
            <Search size={15} className="mr-2 text-[#86909C]" />
            <input
              value={specialKeyword}
              onChange={event => setSpecialKeyword(event.target.value)}
              placeholder="搜索规则名称、平台属性或企迈目标"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            />
          </label>
          <Field>
            <span>渠道：全部</span>
          </Field>
          <Field>
            <span>规则类型：全部</span>
          </Field>
          <button
            type="button"
            onClick={() => setSpecialKeyword('')}
            className="h-9 rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#4E5969]"
          >
            重置
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
        <div className="flex h-11 items-center justify-between border-b border-[#E5E6EB] px-4 text-[13px] text-[#4E5969]">
          <span>共 {filteredSpecialRules.length} 条特殊映射规则</span>
          <span className="inline-flex items-center text-[12px] text-[#86909C]">
            <AlertCircle size={14} className="mr-1.5" />
            同渠道、同门店范围内命中多条规则时，优先级数字小的先执行
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-[1.1fr_120px_150px_1fr_1fr_190px_90px_120px_160px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]">
              <div>规则名称</div>
              <div>平台渠道</div>
              <div>规则类型</div>
              <div>平台对象</div>
              <div>企迈对象</div>
              <div>适用门店</div>
              <div>优先级</div>
              <div>状态</div>
              <div>操作</div>
            </div>
            {filteredSpecialRules.map(rule => {
              const ruleType =
                rule.type === 'attribute_to_addon' ? '属性 / 做法转换' : '套餐子项映射';
              const ruleStatus: Record<SpecialRuleStatus, { label: string; classes: string }> = {
                enabled: { label: '已启用', classes: 'bg-[#E8FFF3] text-[#008A4B]' },
                disabled: { label: '已停用', classes: 'bg-[#F2F3F5] text-[#667085]' },
                conflict: { label: '存在冲突', classes: 'bg-[#FFECE8] text-[#CB2634]' },
              };
              return (
                <div
                  key={rule.id}
                  className="grid min-h-[82px] grid-cols-[1.1fr_120px_150px_1fr_1fr_190px_90px_120px_160px] items-center border-t border-[#F0F1F2] px-4 py-3 text-[13px]"
                >
                  <div>
                    <div className="font-bold text-[#1D2129]">{rule.name}</div>
                    <div className="mt-1 text-[11px] text-[#86909C]">{rule.updatedAt}</div>
                  </div>
                  <div className="text-[#4E5969]">{rule.channel}</div>
                  <div className="text-[#4E5969]">{ruleType}</div>
                  <div className="pr-3 text-[#4E5969]">{rule.source}</div>
                  <div className="pr-3 text-[#4E5969]">{rule.target}</div>
                  <div className="text-[#4E5969]">{rule.stores}</div>
                  <div className="font-medium text-[#1D2129]">{rule.priority}</div>
                  <div>
                    <span
                      className={`inline-flex rounded px-2 py-1 text-[12px] font-medium ${
                        ruleStatus[rule.status].classes
                      }`}
                    >
                      {ruleStatus[rule.status].label}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingRule(rule)}
                      className="font-medium text-[#00A35B]"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSpecialRules(current =>
                          current.map(item =>
                            item.id === rule.id
                              ? {
                                  ...item,
                                  status: item.status === 'disabled' ? 'enabled' : 'disabled',
                                  updatedAt: '刚刚',
                                }
                              : item,
                          ),
                        )
                      }
                      className="text-[#4E5969]"
                    >
                      {rule.status === 'disabled' ? '启用' : '停用'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6F8]">
      <header className="shrink-0 border-b border-[#E5E6EB] bg-white">
        <nav className="flex h-12 items-end gap-7 px-6">
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
                className={`flex h-full items-center border-b-2 px-1 text-[13px] ${
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
        {message && (
          <div className="mb-3 flex items-center justify-between rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-[13px] text-[#245B8A]">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} title="关闭">
              <X size={16} />
            </button>
          </div>
        )}
        {activeView === 'store' && renderStoreMapping()}
        {activeView === 'brand' && renderBrandMapping()}
        {activeView === 'special' && renderSpecialMapping()}
      </main>

      {bindingRow && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#1D2129]/55">
          <div className="flex max-h-[720px] w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div>
                <h3 className="text-[18px] font-bold text-[#1D2129]">选择企迈商品</h3>
                <p className="mt-1 text-[12px] text-[#86909C]">
                  {bindingRow.platformName} · {bindingRow.platformSpec} · {bindingRow.platformSku}
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
                        SKUID {product.skuCode} · {product.category}
                      </div>
                    </div>
                    <div className="text-[12px] text-[#4E5969]">¥{product.price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
              {bindingRow.status === 'conflict' && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-[#FFD8A8] bg-[#FFF9F0] px-3 py-2 text-[12px] text-[#9A5A16]">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  保存后将替换当前冲突关系，仅保留本次选择的企迈商品。
                </div>
              )}
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

      {showApplyDialog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#1D2129]/55">
          <div className="w-[620px] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div>
                <h3 className="text-[18px] font-bold text-[#1D2129]">确认批量应用映射</h3>
                <p className="mt-1 text-[12px] text-[#86909C]">
                  将参考门店中已验证的关系应用到目标门店。
                </p>
              </div>
              <button type="button" onClick={() => setShowApplyDialog(false)} title="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-6 text-[13px]">
              <div className="grid grid-cols-2 gap-3 rounded-md bg-[#F7F8FA] p-4">
                <div>
                  <div className="text-[12px] text-[#86909C]">已选品牌商品</div>
                  <div className="mt-1 text-[18px] font-bold text-[#1D2129]">
                    {selectedBrandIds.length} 个
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-[#86909C]">目标范围</div>
                  <div className="mt-1 text-[14px] font-bold text-[#1D2129]">华南区域 18 家门店</div>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-[#FFD8A8] bg-[#FFF9F0] px-3 py-2 text-[12px] text-[#9A5A16]">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                系统仅为平台商品标识与规格结构一致的门店建立关系；冲突与未找到商品的门店不会被覆盖。
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowApplyDialog(false)}
                className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={applyBrandMappings}
                className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white"
              >
                确认应用
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRule && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#1D2129]/55">
          <div className="flex max-h-[760px] w-[720px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div>
                <h3 className="text-[18px] font-bold text-[#1D2129]">
                  {specialRules.some(rule => rule.id === editingRule.id) ? '编辑特殊映射' : '新增特殊映射'}
                </h3>
                <p className="mt-1 text-[12px] text-[#86909C]">
                  仅用于普通商品映射无法表达的平台结构差异。
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
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">规则类型</span>
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
                  <option value="attribute_to_addon">属性 / 做法转换</option>
                  <option value="combo_item">套餐子项映射</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">平台对象 *</span>
                <input
                  value={editingRule.source}
                  onChange={event => setEditingRule({ ...editingRule, source: event.target.value })}
                  placeholder="选择平台属性或套餐组"
                  className="h-9 w-full rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">企迈对象 *</span>
                <input
                  value={editingRule.target}
                  onChange={event => setEditingRule({ ...editingRule, target: event.target.value })}
                  placeholder="选择企迈做法、加料或套餐组"
                  className="h-9 w-full rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">适用门店</span>
                <input
                  value={editingRule.stores}
                  onChange={event => setEditingRule({ ...editingRule, stores: event.target.value })}
                  className="h-9 w-full rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-medium text-[#4E5969]">优先级</span>
                <input
                  type="number"
                  value={editingRule.priority}
                  onChange={event =>
                    setEditingRule({ ...editingRule, priority: Number(event.target.value) })
                  }
                  className="h-9 w-full rounded-md border border-[#C9CDD4] px-3 text-[13px] outline-none focus:border-[#00B460]"
                />
              </label>
              <div className="col-span-2 flex items-start gap-2 rounded-md border border-[#FFD8A8] bg-[#FFF9F0] px-3 py-2 text-[12px] text-[#9A5A16]">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                保存时将校验同渠道、同门店范围内是否已有相同平台对象；存在重叠时需调整优先级或缩小范围。
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
                disabled={!editingRule.name || !editingRule.source || !editingRule.target}
                onClick={saveSpecialRule}
                className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#C9CDD4]"
              >
                保存规则
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
