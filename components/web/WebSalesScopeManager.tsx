import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

type ScopeObjectType = 'sku' | 'method' | 'addon';
type ScopeMode = 'only_selected' | 'except_selected';
type ScopeStatus = 'enabled' | 'disabled';
type RelationProductScope = 'all_linked_products' | 'selected_products';
type EditorStep = 1 | 2 | 3;

type RuleObjectSelection = {
  productName: string;
  allSkus?: boolean;
  values: string[];
};

type ScopeRule = {
  id: string;
  name: string;
  objectType: ScopeObjectType;
  productNames: string[];
  objectSelections?: RuleObjectSelection[];
  sharedObjectValues?: string[];
  relationProductScope?: RelationProductScope;
  mode: ScopeMode;
  stores: string[];
  channels: string[];
  status: ScopeStatus;
  updatedAt: string;
};

const OBJECT_LABELS: Record<ScopeObjectType, string> = {
  sku: '商品 / 规格',
  method: '商品做法',
  addon: '商品加料',
};

const MODE_LABELS: Record<ScopeMode, string> = {
  only_selected: '仅选中门店可售',
  except_selected: '选中门店不可售',
};

const getModeLabel = (mode: ScopeMode, objectType: ScopeObjectType) => {
  const selectableObject = objectType === 'method' || objectType === 'addon';
  if (!selectableObject) return MODE_LABELS[mode];
  if (mode === 'only_selected') return '仅选中门店可选';
  return '选中门店不可选';
};

const getRuleObjectValueCount = (rule: ScopeRule) => {
  if (rule.objectType === 'sku') return (rule.objectSelections || []).reduce(
    (total, selection) => total + getAffectedSkuOptions(selection.productName, Boolean(selection.allSkus), selection.values).length,
    0,
  );
  return (rule.sharedObjectValues || []).length;
};

const getRuleObjectSelectionText = (rule: ScopeRule) => (rule.objectSelections || [])
  .map(selection => selection.allSkus
    ? `${selection.productName}：全部 ${getSkuOptions(selection.productName).length} 个有效 SKU`
    : `${selection.productName}：规格值 ${selection.values.join('、')}（影响 ${getAffectedSkuOptions(selection.productName, false, selection.values).length} 个 SKU）`)
  .join('；');

const getRelationScopeText = (rule: ScopeRule) => rule.relationProductScope === 'selected_products'
  ? `指定 ${rule.productNames.length} 个商品`
  : '全部关联商品';

const CHANNELS = ['POS', '小程序堂食', '小程序外卖', '美团外卖', '淘宝闪购', '抖音在线点'];
const STORE_OPTIONS = [
  { id: 'store-001', name: '南山万象店', code: 'SZ001', organization: '深圳直营区', region: '华南', type: '直营店' },
  { id: 'store-002', name: '福田卓悦店', code: 'SZ002', organization: '深圳直营区', region: '华南', type: '直营店' },
  { id: 'store-003', name: '宝安壹方城店', code: 'SZ003', organization: '深圳直营区', region: '华南', type: '直营店' },
  { id: 'store-004', name: '机场 T3 店', code: 'SZ004', organization: '交通枢纽事业部', region: '华南', type: '机场店' },
  { id: 'store-005', name: '虹桥枢纽店', code: 'SH001', organization: '交通枢纽事业部', region: '华东', type: '高铁店' },
  { id: 'store-006', name: '华东测试店', code: 'SH002', organization: '上海直营区', region: '华东', type: '直营店' },
  { id: 'store-007', name: '杭州湖滨店', code: 'HZ001', organization: '浙江直营区', region: '华东', type: '直营店' },
  { id: 'store-008', name: '南京德基店', code: 'NJ001', organization: '江苏直营区', region: '华东', type: '直营店' },
  { id: 'store-009', name: '北京国贸店', code: 'BJ001', organization: '北京直营区', region: '华北', type: '直营店' },
  { id: 'store-010', name: '成都太古里店', code: 'CD001', organization: '成都直营区', region: '西南', type: '直营店' },
  { id: 'store-011', name: '武汉天地店', code: 'WH001', organization: '华中直营区', region: '华中', type: '直营店' },
  { id: 'store-012', name: '西安赛格店', code: 'XA001', organization: '西北加盟区', region: '西北', type: '加盟店' },
] as const;
const STORES = STORE_OPTIONS.map(store => store.name);
const STORE_ORGANIZATIONS = Array.from(new Set(STORE_OPTIONS.map(store => store.organization)));
const STORE_TYPES = Array.from(new Set(STORE_OPTIONS.map(store => store.type)));
const PRODUCTS = ['招牌珍珠奶茶', '杨枝甘露', '手打柠檬茶', '精品拿铁', '超值双人套餐'];
const SKU_OPTIONS: Record<string, string[]> = {
  招牌珍珠奶茶: ['中杯 / 标准冰 / 标准糖', '大杯 / 标准冰 / 标准糖', '大杯 / 少冰 / 少糖'],
  杨枝甘露: ['标准杯 / 标准冰', '大杯 / 标准冰', '大杯 / 少冰'],
  手打柠檬茶: ['标准杯 / 标准冰 / 标准糖', '超大杯 / 少冰 / 少糖'],
  精品拿铁: ['中杯 / 冰', '中杯 / 热', '大杯 / 冰', '大杯 / 热'],
  超值双人套餐: ['双人标准套餐', '双人升级套餐'],
};

const SPEC_VALUE_GROUPS: Record<string, Array<{ name: string; values: string[] }>> = {
  招牌珍珠奶茶: [
    { name: '杯型', values: ['中杯', '大杯'] },
    { name: '冰度', values: ['标准冰', '少冰'] },
    { name: '甜度', values: ['标准糖', '少糖'] },
  ],
  杨枝甘露: [
    { name: '杯型', values: ['标准杯', '大杯'] },
    { name: '冰度', values: ['标准冰', '少冰'] },
  ],
  手打柠檬茶: [
    { name: '杯型', values: ['标准杯', '超大杯'] },
    { name: '冰度', values: ['标准冰', '少冰'] },
    { name: '甜度', values: ['标准糖', '少糖'] },
  ],
  精品拿铁: [
    { name: '杯型', values: ['中杯', '大杯'] },
    { name: '温度', values: ['冰', '热'] },
  ],
  超值双人套餐: [
    { name: '套餐版本', values: ['双人标准套餐', '双人升级套餐'] },
  ],
};

const SHARED_OBJECT_GROUPS: Record<'method' | 'addon', Array<{ name: string; values: string[] }>> = {
  method: [
    { name: '冰度', values: ['少冰', '去冰'] },
    { name: '温度', values: ['常温', '加热'] },
    { name: '甜度', values: ['少糖', '无糖'] },
    { name: '出餐方式', values: ['统一出餐', '分开打包'] },
  ],
  addon: [
    { name: '风味小料', values: ['珍珠', '椰果', '西柚粒', '芒果粒'] },
    { name: '奶基底', values: ['奶盖', '燕麦奶'] },
    { name: '餐食小料', values: ['薯条', '鸡块'] },
  ],
};

const getSkuOptions = (productName: string) => SKU_OPTIONS[productName] || [];
const getSpecValueGroups = (productName: string) => SPEC_VALUE_GROUPS[productName] || [];
const getSpecValues = (productName: string) => getSpecValueGroups(productName).flatMap(group => group.values);
const getAffectedSkuOptions = (productName: string, allSkus: boolean, specValues: string[]) => {
  const skuOptions = getSkuOptions(productName);
  if (allSkus) return skuOptions;
  return skuOptions.filter(sku => {
    const skuSpecValues = sku.split('/').map(value => value.trim());
    return specValues.some(value => skuSpecValues.includes(value));
  });
};

const INITIAL_RULES: ScopeRule[] = [
  {
    id: 'scope-1',
    name: '机场门店含酒精商品限制',
    objectType: 'sku',
    productNames: ['杨枝甘露', '超值双人套餐'],
    objectSelections: [
      { productName: '杨枝甘露', allSkus: true, values: [] },
      { productName: '超值双人套餐', allSkus: true, values: [] },
    ],
    mode: 'except_selected',
    stores: ['机场 T3 店', '虹桥枢纽店'],
    channels: ['POS', '小程序堂食'],
    status: 'enabled',
    updatedAt: '2026-07-29 16:20',
  },
  {
    id: 'scope-2',
    name: '华东新品试点范围',
    objectType: 'sku',
    productNames: ['招牌珍珠奶茶'],
    objectSelections: [{ productName: '招牌珍珠奶茶', allSkus: false, values: ['大杯'] }],
    mode: 'only_selected',
    stores: ['华东测试店', '虹桥枢纽店'],
    channels: ['小程序外卖', '美团外卖', '淘宝闪购'],
    status: 'enabled',
    updatedAt: '2026-07-29 14:42',
  },
  {
    id: 'scope-3',
    name: '部分门店暂停去冰做法',
    objectType: 'method',
    productNames: [],
    sharedObjectValues: ['去冰'],
    relationProductScope: 'all_linked_products',
    mode: 'except_selected',
    stores: ['南山万象店', '福田卓悦店', '宝安壹方城店'],
    channels: ['小程序外卖'],
    status: 'enabled',
    updatedAt: '2026-07-28 18:05',
  },
  {
    id: 'scope-4',
    name: '柠檬茶椰果例外',
    objectType: 'addon',
    productNames: ['手打柠檬茶'],
    sharedObjectValues: ['椰果'],
    relationProductScope: 'selected_products',
    mode: 'only_selected',
    stores: ['南山万象店', '福田卓悦店'],
    channels: ['美团外卖'],
    status: 'enabled',
    updatedAt: '2026-07-28 11:36',
  },
];

type ConflictComparableRule = Pick<
  ScopeRule,
  'id' | 'objectType' | 'productNames' | 'objectSelections' | 'sharedObjectValues' | 'relationProductScope' | 'mode' | 'stores' | 'channels' | 'status'
>;

const hasIntersection = (left: string[], right: string[]) => left.some(value => right.includes(value));

const hasManagedObjectIntersection = (left: ConflictComparableRule, right: ConflictComparableRule) => {
  if (left.objectType !== right.objectType) return false;
  if (left.objectType === 'sku') return (left.objectSelections || []).some(leftGroup => {
    const rightGroup = (right.objectSelections || []).find(group => group.productName === leftGroup.productName);
    if (!rightGroup) return false;
    const leftValues = getAffectedSkuOptions(leftGroup.productName, Boolean(leftGroup.allSkus), leftGroup.values);
    const rightValues = getAffectedSkuOptions(rightGroup.productName, Boolean(rightGroup.allSkus), rightGroup.values);
    return hasIntersection(leftValues, rightValues);
  });
  if (!hasIntersection(left.sharedObjectValues || [], right.sharedObjectValues || [])) return false;
  if (left.relationProductScope !== 'selected_products' || right.relationProductScope !== 'selected_products') return true;
  return hasIntersection(left.productNames, right.productNames);
};

const findConflictingRule = (
  candidate: ConflictComparableRule,
  rules: ScopeRule[],
  excludedRuleId?: string | null
) => rules.find(rule => {
  if (rule.id === excludedRuleId || rule.status !== 'enabled') return false;
  const sameObject = hasManagedObjectIntersection(rule, candidate);
  if (!sameObject) return false;

  const hasOppositeResult = (rule.mode === 'except_selected') !== (candidate.mode === 'except_selected');
  return hasOppositeResult
    && hasIntersection(rule.stores, candidate.stores)
    && hasIntersection(rule.channels, candidate.channels);
});

export const WebSalesScopeManager: React.FC = () => {
  const [rules, setRules] = useState<ScopeRule[]>(INITIAL_RULES);
  const [keyword, setKeyword] = useState('');
  const [objectFilter, setObjectFilter] = useState<'all' | ScopeObjectType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ScopeStatus>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailRule, setDetailRule] = useState<ScopeRule | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftObjectType, setDraftObjectType] = useState<ScopeObjectType>('sku');
  const [draftProducts, setDraftProducts] = useState<string[]>([PRODUCTS[0]]);
  const [draftObjectSelections, setDraftObjectSelections] = useState<Record<string, string[]>>({});
  const [draftAllSkuProducts, setDraftAllSkuProducts] = useState<string[]>([PRODUCTS[0]]);
  const [draftSharedObjectValues, setDraftSharedObjectValues] = useState<string[]>([]);
  const [draftRelationProductScope, setDraftRelationProductScope] = useState<RelationProductScope>('all_linked_products');
  const [draftMode, setDraftMode] = useState<ScopeMode>('except_selected');
  const [draftStores, setDraftStores] = useState<string[]>([STORES[0]]);
  const [draftChannels, setDraftChannels] = useState<string[]>([CHANNELS[0]]);
  const [toast, setToast] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingToggle, setPendingToggle] = useState<ScopeRule | null>(null);
  const [moreRuleId, setMoreRuleId] = useState<string | null>(null);
  const [moreMenuPosition, setMoreMenuPosition] = useState({ top: 0, right: 0 });
  const [deleteTarget, setDeleteTarget] = useState<ScopeRule | null>(null);
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<string[]>([]);
  const [productSelectorKeyword, setProductSelectorKeyword] = useState('');
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [pendingStores, setPendingStores] = useState<string[]>([]);
  const [storeSelectorKeyword, setStoreSelectorKeyword] = useState('');
  const [storeOrganizationFilter, setStoreOrganizationFilter] = useState('all');
  const [storeTypeFilter, setStoreTypeFilter] = useState('all');
  const [editorStep, setEditorStep] = useState<EditorStep>(1);
  const [skuSelectorProduct, setSkuSelectorProduct] = useState<string | null>(null);
  const [pendingSkuValues, setPendingSkuValues] = useState<string[]>([]);
  const [sharedObjectSelectorOpen, setSharedObjectSelectorOpen] = useState(false);
  const [pendingSharedObjectValues, setPendingSharedObjectValues] = useState<string[]>([]);

  const filteredRules = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return rules.filter(rule => {
      const objectValues = [
        ...(rule.objectSelections || []).flatMap(selection => selection.values),
        ...(rule.sharedObjectValues || []),
      ];
      if (
        normalized
        && ![rule.name, ...rule.productNames, ...objectValues].some(value => value.toLowerCase().includes(normalized))
      ) return false;
      if (objectFilter !== 'all' && rule.objectType !== objectFilter) return false;
      if (statusFilter !== 'all' && rule.status !== statusFilter) return false;
      return true;
    });
  }, [keyword, objectFilter, rules, statusFilter]);

  const draftProductNames = draftObjectType === 'method' || draftObjectType === 'addon'
    ? (draftRelationProductScope === 'selected_products' ? draftProducts : [])
    : draftProducts;
  const draftObjectSelectionList = draftObjectType === 'sku'
    ? draftProducts.map(productName => ({
      productName,
      allSkus: draftAllSkuProducts.includes(productName),
      values: draftObjectSelections[productName] || [],
    }))
    : undefined;
  const filteredSelectorProducts = PRODUCTS.filter(product => !productSelectorKeyword.trim() || product.includes(productSelectorKeyword.trim()));
  const filteredSelectorStores = STORE_OPTIONS.filter(store => {
    const keywordMatch = !storeSelectorKeyword.trim()
      || [store.name, store.code, store.organization, store.region].some(value => value.includes(storeSelectorKeyword.trim()));
    const organizationMatch = storeOrganizationFilter === 'all' || store.organization === storeOrganizationFilter;
    const typeMatch = storeTypeFilter === 'all' || store.type === storeTypeFilter;
    return keywordMatch && organizationMatch && typeMatch;
  });

  const draftConflictRule = useMemo(() => findConflictingRule({
    id: editingRuleId || 'draft',
    objectType: draftObjectType,
    productNames: draftProductNames,
    objectSelections: draftObjectSelectionList,
    sharedObjectValues: draftSharedObjectValues,
    relationProductScope: draftRelationProductScope,
    mode: draftMode,
    stores: draftStores,
    channels: draftChannels,
    status: 'enabled',
  }, rules, editingRuleId), [
    draftChannels,
    draftMode,
    draftObjectSelectionList,
    draftObjectType,
    draftProductNames,
    draftRelationProductScope,
    draftSharedObjectValues,
    draftStores,
    editingRuleId,
    rules,
  ]);
  const hasDraftConflict = Boolean(draftConflictRule);
  const pendingEnableConflict = useMemo(
    () => pendingToggle?.status === 'disabled'
      ? findConflictingRule({ ...pendingToggle, status: 'enabled' }, rules, pendingToggle.id)
      : undefined,
    [pendingToggle, rules]
  );

  const resetDraft = () => {
    setEditingRuleId(null);
    setDraftName('');
    setDraftObjectType('sku');
    setDraftProducts([PRODUCTS[0]]);
    setDraftObjectSelections({});
    setDraftAllSkuProducts([PRODUCTS[0]]);
    setDraftSharedObjectValues([]);
    setDraftRelationProductScope('all_linked_products');
    setDraftMode('except_selected');
    setDraftStores([STORES[0]]);
    setDraftChannels([CHANNELS[0]]);
    setEditorStep(1);
  };

  const openCreate = () => {
    resetDraft();
    setEditorOpen(true);
  };

  const openEdit = (rule: ScopeRule) => {
    setEditingRuleId(rule.id);
    setDraftName(rule.name);
    setDraftObjectType(rule.objectType);
    setDraftProducts(rule.productNames);
    setDraftObjectSelections((rule.objectSelections || []).reduce<Record<string, string[]>>((acc, selection) => {
      acc[selection.productName] = selection.values;
      return acc;
    }, {}));
    setDraftAllSkuProducts((rule.objectSelections || []).filter(selection => selection.allSkus).map(selection => selection.productName));
    setDraftSharedObjectValues(rule.sharedObjectValues || []);
    setDraftRelationProductScope(rule.relationProductScope || 'all_linked_products');
    setDraftMode(rule.mode);
    setDraftStores(rule.stores);
    setDraftChannels(rule.channels);
    setEditorStep(1);
    setEditorOpen(true);
  };

  const saveRule = () => {
    if (!draftName.trim() || draftStores.length === 0 || draftChannels.length === 0) return;
    if (draftObjectType === 'sku' && draftProductNames.length === 0) return;
    if (draftObjectType === 'sku' && draftProducts.some(product => !draftAllSkuProducts.includes(product) && (draftObjectSelections[product] || []).length === 0)) return;
    if ((draftObjectType === 'method' || draftObjectType === 'addon') && draftSharedObjectValues.length === 0) return;
    if ((draftObjectType === 'method' || draftObjectType === 'addon') && draftRelationProductScope === 'selected_products' && draftProducts.length === 0) return;
    if (hasDraftConflict) return;

    const nextRule: ScopeRule = {
      id: editingRuleId || `scope-${Date.now()}`,
      name: draftName.trim(),
      objectType: draftObjectType,
      productNames: draftProductNames,
      objectSelections: draftObjectSelectionList,
      sharedObjectValues: draftObjectType === 'method' || draftObjectType === 'addon' ? draftSharedObjectValues : undefined,
      relationProductScope: draftObjectType === 'method' || draftObjectType === 'addon' ? draftRelationProductScope : undefined,
      mode: draftMode,
      stores: draftStores,
      channels: draftChannels,
      status: editingRuleId ? (rules.find(rule => rule.id === editingRuleId)?.status || 'enabled') : 'enabled',
      updatedAt: '刚刚',
    };

    setRules(current => editingRuleId
      ? current.map(rule => rule.id === editingRuleId ? nextRule : rule)
      : [nextRule, ...current]);
    setEditorOpen(false);
    setToast(editingRuleId ? '门店售卖规则已更新' : '门店售卖规则已创建');
    window.setTimeout(() => setToast(''), 2600);
  };

  const toggleSelection = (value: string, current: string[], change: (next: string[]) => void) => {
    change(current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const openProductSelector = () => {
    setPendingProducts(draftProducts);
    setProductSelectorKeyword('');
    setProductSelectorOpen(true);
  };

  const buildDefaultObjectSelections = (type: ScopeObjectType, products: string[]) => type !== 'sku'
    ? {}
    : products.reduce<Record<string, string[]>>((acc, product) => {
      const currentValues = draftObjectSelections[product] || [];
      const allowedValues = getSpecValues(product);
      const retainedValues = currentValues.filter(value => allowedValues.includes(value));
      acc[product] = retainedValues;
      return acc;
    }, {});

  const applySelectedProducts = (products: string[]) => {
    setDraftAllSkuProducts(current => draftObjectType === 'sku'
      ? products.filter(product => current.includes(product) || !draftProducts.includes(product))
      : []);
    setDraftProducts(products);
    setDraftObjectSelections(buildDefaultObjectSelections(draftObjectType, products));
  };

  const removeDraftProduct = (product: string) => {
    const nextProducts = draftProducts.filter(item => item !== product);
    setDraftProducts(nextProducts);
    setDraftAllSkuProducts(current => current.filter(item => item !== product));
    setDraftObjectSelections(current => {
      const next = { ...current };
      delete next[product];
      return next;
    });
  };

  const changeDraftObjectType = (type: ScopeObjectType) => {
    setDraftObjectType(type);
    setDraftObjectSelections(buildDefaultObjectSelections(type, draftProducts));
    setDraftSharedObjectValues([]);
    setDraftRelationProductScope('all_linked_products');
    if (type === 'method' || type === 'addon') setDraftProducts([]);
    if (type === 'method' || type === 'addon') setDraftAllSkuProducts([]);
    if (type === 'sku') {
      setDraftProducts(current => {
        const next = current.length > 0 ? current : [PRODUCTS[0]];
        setDraftAllSkuProducts(next);
        return next;
      });
    }
  };

  const setProductSkuScope = (productName: string, scope: 'all' | 'selected') => {
    if (scope === 'all') {
      setDraftAllSkuProducts(current => current.includes(productName) ? current : [...current, productName]);
      setDraftObjectSelections(current => ({ ...current, [productName]: [] }));
      return;
    }
    setDraftAllSkuProducts(current => current.filter(item => item !== productName));
  };

  const openSkuSelector = (productName: string) => {
    setSkuSelectorProduct(productName);
    setPendingSkuValues(draftObjectSelections[productName] || []);
  };

  const openSharedObjectSelector = () => {
    setPendingSharedObjectValues(draftSharedObjectValues);
    setSharedObjectSelectorOpen(true);
  };

  const openStoreSelector = () => {
    setPendingStores(draftStores);
    setStoreSelectorKeyword('');
    setStoreOrganizationFilter('all');
    setStoreTypeFilter('all');
    setStoreSelectorOpen(true);
  };

  const stepOneValid = Boolean(
    draftName.trim()
    && (
      (draftObjectType === 'sku' && draftProducts.length > 0 && draftProducts.every(product => draftAllSkuProducts.includes(product) || (draftObjectSelections[product] || []).length > 0))
      || ((draftObjectType === 'method' || draftObjectType === 'addon')
        && draftSharedObjectValues.length > 0
        && (draftRelationProductScope === 'all_linked_products' || draftProducts.length > 0))
    )
  );
  const stepTwoValid = draftStores.length > 0 && draftChannels.length > 0;
  const canSaveRule = Boolean(stepOneValid && stepTwoValid && !hasDraftConflict);

  return (
    <div className="relative flex min-h-0 min-w-0 w-full max-w-full flex-1 overflow-hidden bg-[#F5F6FA] p-3">
      <div className="console-panel flex h-full min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-[#E9EDF2] px-4">
          <div className="text-[13px] text-[#667085]">商品 / 规格、做法和加料的门店渠道可售范围 · 共 <strong className="text-[#1D2129]">{rules.length}</strong> 条</div>
          <button type="button" onClick={openCreate} className="console-primary-button shrink-0 whitespace-nowrap">
            <Plus size={16} />
            新增售卖规则
          </button>
        </div>

        <div className="shrink-0 border-b border-[#EDEDED] px-4 py-3">
          <div className="grid grid-cols-2 gap-3 2xl:grid-cols-[minmax(240px,1fr)_180px_180px]">
            <label className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
              <input
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
                placeholder="搜索规则、商品、做法或加料"
                className="h-9 w-full rounded-md border border-[#DDE2E8] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]"
              />
            </label>
            <label className="relative">
              <select
                value={objectFilter}
                onChange={event => setObjectFilter(event.target.value as 'all' | ScopeObjectType)}
                className="h-9 w-full appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-8 text-[13px] outline-none focus:border-[#00B460]"
              >
                <option value="all">对象类型：全部</option>
                <option value="sku">商品 / 规格</option>
                <option value="method">商品做法</option>
                <option value="addon">商品加料</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            </label>
            <label className="relative">
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value as 'all' | ScopeStatus)}
                className="h-9 w-full appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-8 text-[13px] outline-none focus:border-[#00B460]"
              >
                <option value="all">规则状态：全部</option>
                <option value="enabled">已启用</option>
                <option value="disabled">已停用</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setKeyword('');
                  setObjectFilter('all');
                  setStatusFilter('all');
                }}
                className="h-9 rounded-md border border-[#DDE2E8] bg-white px-4 text-[13px] text-[#4E5969] hover:bg-[#F7F8FA]"
              >
                重置
              </button>
              <button type="button" onClick={() => setToast(`已查询到 ${filteredRules.length} 条规则`)} className="h-9 rounded-md bg-[#00B460] px-5 text-[13px] font-medium text-white hover:bg-[#009F55]">
                查询
              </button>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#EDEDED] px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#667085]">
            <span>共 <strong className="text-[#1D2129]">{filteredRules.length}</strong> 条规则</span>
            {selectedIds.length > 0 && <span>已选择 <strong className="text-[#1D2129]">{selectedIds.length}</strong> 条</span>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" disabled={!selectedIds.length} onClick={() => { setRules(current => current.map(rule => selectedIds.includes(rule.id) ? { ...rule, status: 'disabled', updatedAt: '刚刚' } : rule)); setToast(`已停用 ${selectedIds.length} 条规则`); setSelectedIds([]); }} className="inline-flex h-9 items-center rounded-md border border-[#DDE2E8] bg-white px-3 text-[13px] text-[#4E5969] hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-40">
              <SlidersHorizontal size={15} className="mr-1.5" />
              批量停用{selectedIds.length ? `（${selectedIds.length}）` : ''}
            </button>
            <button type="button" onClick={() => { setToast('销售规则已导出，包含规则对象、经营结果、门店、渠道和状态'); }} className="inline-flex h-9 items-center rounded-md border border-[#DDE2E8] bg-white px-3 text-[13px] text-[#4E5969] hover:bg-[#F7F8FA]">
              <Download size={14} className="mr-1.5" />
              导出规则
            </button>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-[#4E5969]">
              <tr className="border-b border-[#E5E7EB]">
                <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="选择全部规则" checked={filteredRules.length > 0 && filteredRules.every(rule => selectedIds.includes(rule.id))} onChange={() => setSelectedIds(filteredRules.every(rule => selectedIds.includes(rule.id)) ? selectedIds.filter(id => !filteredRules.some(rule => rule.id === id)) : Array.from(new Set([...selectedIds, ...filteredRules.map(rule => rule.id)])))} /></th>
                <th className="w-[190px] px-3 py-3 font-medium">规则名称</th>
                <th className="w-[190px] px-3 py-3 font-medium">管控对象</th>
                <th className="w-[150px] px-3 py-3 font-medium">经营结果</th>
                <th className="w-[170px] px-3 py-3 font-medium">适用门店</th>
                <th className="w-[170px] px-3 py-3 font-medium">适用渠道</th>
                <th className="w-[76px] px-3 py-3 font-medium">状态</th>
                <th className="sticky right-0 z-20 w-[168px] border-l border-[#EEF0F3] bg-[#F7F8FA] px-3 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map(rule => (
                <tr key={rule.id} className="border-b border-[#EEF0F3] bg-white hover:bg-[#FAFCFB]">
                  <td className="px-4 py-3"><input type="checkbox" aria-label={`选择${rule.name}`} checked={selectedIds.includes(rule.id)} onChange={() => setSelectedIds(current => current.includes(rule.id) ? current.filter(id => id !== rule.id) : [...current, rule.id])} /></td>
                  <td className="overflow-visible px-2 py-3">
                    <button type="button" onClick={() => setDetailRule(rule)} className="max-w-[190px] truncate font-medium text-[#1D2129] hover:text-[#008F4C]">
                      {rule.name}
                    </button>
                    <div className="mt-1 truncate text-[12px] text-[#98A2B3]">规则 ID：{rule.id} · {rule.updatedAt}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#EEF8F3] px-1.5 py-0.5 text-[12px] text-[#008F4C]">{OBJECT_LABELS[rule.objectType]}</span>
                      <span className="max-w-[120px] truncate font-medium text-[#344054]">{rule.objectType === 'method' || rule.objectType === 'addon' ? (rule.sharedObjectValues || []).slice(0, 2).join('、') : rule.productNames.slice(0, 2).join('、')}</span>
                    </div>
                    {rule.objectType === 'sku' && <div className="mt-1 text-[12px] text-[#667085]">{rule.productNames.length} 个商品 · {getRuleObjectValueCount(rule)} 个 SKU</div>}
                    {(rule.objectType === 'method' || rule.objectType === 'addon') && <div className="mt-1 text-[12px] text-[#667085]">{getRelationScopeText(rule)}</div>}
                  </td>
                  <td className="px-3 py-3 text-[#344054]">{getModeLabel(rule.mode, rule.objectType)}</td>
                  <td className="px-3 py-3">
                    <div className="max-w-[180px] truncate text-[#344054]">{rule.stores.slice(0, 2).join('、')}</div>
                    {rule.stores.length > 2 && <div className="mt-1 text-[12px] text-[#008F4C]">另 {rule.stores.length - 2} 家</div>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex max-w-[180px] flex-wrap gap-1">
                      {rule.channels.slice(0, 2).map(channel => (
                        <span key={channel} className="border border-[#E1E5EA] bg-white px-1.5 py-0.5 text-[12px] text-[#667085]">{channel}</span>
                      ))}
                      {rule.channels.length > 2 && <span className="text-[12px] text-[#667085]">+{rule.channels.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rule.status === 'enabled'}
                      aria-label={`${rule.status === 'enabled' ? '停用' : '启用'}规则${rule.name}`}
                      title={`${rule.status === 'enabled' ? '已启用' : '已停用'}，点击${rule.status === 'enabled' ? '停用' : '启用'}`}
                      onClick={() => setPendingToggle(rule)}
                      className="inline-flex items-center"
                    >
                      <span className={`relative h-5 w-8 shrink-0 rounded-full transition-colors ${rule.status === 'enabled' ? 'bg-[#00B460]' : 'bg-[#C9CDD4]'}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${rule.status === 'enabled' ? 'translate-x-[14px]' : 'translate-x-0.5'}`} />
                      </span>
                      <span className="sr-only">{rule.status === 'enabled' ? '已启用' : '已停用'}</span>
                    </button>
                  </td>
                  <td className="sticky right-0 border-l border-[#EEF0F3] bg-white px-3 py-3 shadow-[-6px_0_8px_rgba(17,24,39,0.025)]">
                    <div className="relative flex items-center gap-2.5 whitespace-nowrap">
                      <button type="button" onClick={() => setDetailRule(rule)} className="text-[#008F4C] hover:text-[#006F3B]">查看详情</button>
                      <button type="button" onClick={() => openEdit(rule)} className="text-[#008F4C] hover:text-[#006F3B]">编辑</button>
                      <button type="button" aria-label="更多操作" aria-expanded={moreRuleId === rule.id} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); const nextOpen = moreRuleId !== rule.id; setMoreRuleId(nextOpen ? rule.id : null); if (nextOpen) setMoreMenuPosition({ top: Math.min(rect.bottom + 6, window.innerHeight - 116), right: Math.max(16, window.innerWidth - rect.right) }); }} className="rounded p-1 text-[#667085] hover:bg-[#F2F4F7] hover:text-[#1D2129]"><MoreHorizontal size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRules.length === 0 && (
            <div className="flex h-56 flex-col items-center justify-center text-[#98A2B3]">
              <Filter size={28} className="mb-3" />
              <p>没有符合当前条件的门店售卖规则</p>
              <button type="button" onClick={() => { setKeyword(''); setObjectFilter('all'); setStatusFilter('all'); }} className="mt-2 text-[#008F4C]">
                清空筛选
              </button>
            </div>
          )}
        </div>
      </div>

      {moreRuleId && (() => {
        const rule = rules.find(item => item.id === moreRuleId);
        if (!rule) return null;
        return (
          <div className="fixed inset-0 z-[75]" onClick={() => setMoreRuleId(null)}>
            <div
              className="fixed w-[144px] overflow-hidden rounded-md border border-[#E3E7EC] bg-white py-1 shadow-[0_8px_24px_rgba(17,24,39,0.18)]"
              style={{ top: moreMenuPosition.top, right: moreMenuPosition.right }}
              onClick={event => event.stopPropagation()}
              role="menu"
              aria-label={`${rule.name}更多操作`}
            >
              <button type="button" role="menuitem" onClick={() => { setRules(current => [{ ...rule, id: `scope-${Date.now()}`, name: `${rule.name}-副本`, status: 'disabled', updatedAt: '刚刚' }, ...current]); setToast('规则已复制，副本默认为停用状态'); setMoreRuleId(null); }} className="block w-full px-3 py-2 text-left text-[13px] text-[#344054] hover:bg-[#F7F8FA]">复制规则</button>
              <button type="button" role="menuitem" disabled={rule.status === 'enabled'} title={rule.status === 'enabled' ? '请先停用规则后再删除' : '删除规则'} onClick={() => { setDeleteTarget(rule); setMoreRuleId(null); }} className="block w-full px-3 py-2 text-left text-[13px] text-[#D92D20] hover:bg-[#FFF5F4] disabled:cursor-not-allowed disabled:text-[#B8C0CC] disabled:hover:bg-white">删除规则</button>
              {rule.status === 'enabled' && <div className="px-3 pb-1 text-[11px] leading-4 text-[#98A2B3]">停用后可删除</div>}
            </div>
          </div>
        );
      })()}

      {editorOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/35" role="dialog" aria-modal="true" aria-label="配置门店售卖规则">
          <div className="flex h-full w-[860px] max-w-[calc(100vw-48px)] flex-col bg-white shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5">
              <div>
                <h2 className="text-[17px] font-semibold text-[#1D2129]">{editingRuleId ? '编辑售卖规则' : '新增售卖规则'}</h2>
                <p className="mt-0.5 text-[12px] text-[#667085]">按对象、范围、校验三步完成配置；未配置规则时默认全部门店可售或可选。</p>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} aria-label="关闭" className="rounded p-1 text-[#667085] hover:bg-[#F2F4F7]"><X size={20} /></button>
            </div>

            <div className="shrink-0 border-b border-[#EEF0F3] bg-[#FAFBFC] px-5 py-3">
              <div className="grid grid-cols-3 gap-3">
                {([
                  [1, '管控对象', '选择商品或公共属性'],
                  [2, '门店与渠道', '确定生效范围'],
                  [3, '校验确认', '检查冲突后保存'],
                ] as [EditorStep, string, string][]).map(([step, title, description]) => (
                  <button key={step} type="button" onClick={() => { if (step === 1 || (step === 2 && stepOneValid) || (step === 3 && stepOneValid && stepTwoValid)) setEditorStep(step); }} className={`flex items-center rounded-md border px-3 py-2 text-left ${editorStep === step ? 'border-[#00B460] bg-[#F0FAF5]' : 'border-[#E3E7EC] bg-white'}`}>
                    <span className={`mr-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${editorStep === step ? 'bg-[#00B460] text-white' : 'bg-[#EEF0F3] text-[#667085]'}`}>{step}</span>
                    <span><span className="block text-[13px] font-medium text-[#344054]">{title}</span><span className="block text-[11px] text-[#98A2B3]">{description}</span></span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {editorStep === 1 && (
                <div className="space-y-5">
                  <label className="block text-[13px] font-medium text-[#344054]">规则名称 <span className="text-[#D92D20]">*</span><input value={draftName} onChange={event => setDraftName(event.target.value)} placeholder="例如：机场门店暂停含酒精商品" className="mt-1.5 h-9 w-full rounded-md border border-[#DDE2E8] px-3 font-normal outline-none focus:border-[#00B460]" /></label>
                  <section>
                    <h3 className="mb-2 text-[13px] font-medium text-[#344054]">管控对象 <span className="text-[#D92D20]">*</span></h3>
                    <div className="grid grid-cols-3 gap-2">{(Object.keys(OBJECT_LABELS) as ScopeObjectType[]).map(type => <button key={type} type="button" onClick={() => changeDraftObjectType(type)} className={`h-10 rounded-md border text-[13px] ${draftObjectType === type ? 'border-[#00B460] bg-[#EEF9F4] font-medium text-[#008F4C]' : 'border-[#DDE2E8] bg-white text-[#4E5969]'}`}>{OBJECT_LABELS[type]}</button>)}</div>
                    <p className="mt-2 text-[12px] text-[#667085]">{draftObjectType === 'sku' ? '先选择商品，默认管控该商品全部有效 SKU；需要细分时，只能从该商品实际关联的规格组中选择规格值。选中规格值后，规则自动作用于所有包含该值的 SKU。' : `${OBJECT_LABELS[draftObjectType]}是公共对象，默认作用于所有关联商品，可按需收窄到指定商品。`}</p>
                  </section>

                  {draftObjectType === 'sku' && (
                    <section className="rounded-md border border-[#E3E7EC] p-3">
                      <div className="mb-2 flex items-center justify-between"><span className="text-[13px] font-medium text-[#344054]">商品 <span className="text-[#D92D20]">*</span></span><button type="button" onClick={openProductSelector} className="text-[13px] font-medium text-[#008F4C]">选择商品</button></div>
                      {draftProducts.length === 0 ? <button type="button" onClick={openProductSelector} className="h-12 w-full rounded-md border border-dashed border-[#C9CDD4] text-[13px] text-[#667085]">+ 选择商品</button> : <div className="overflow-hidden rounded-md border border-[#EEF0F3]">{draftProducts.map(product => { const selected = draftObjectSelections[product] || []; const allSkus = draftAllSkuProducts.includes(product); const affectedSkuCount = getAffectedSkuOptions(product, allSkus, selected).length; return <div key={product} className="grid grid-cols-[190px_180px_minmax(0,1fr)_96px_28px] items-center gap-3 border-b border-[#EEF0F3] px-3 py-3 last:border-b-0"><div><div className="font-medium text-[#344054]">{product}</div><div className="mt-1 text-[12px] text-[#98A2B3]">{getSpecValues(product).length} 个规格值 · {getSkuOptions(product).length} 个有效 SKU</div></div><div className="flex rounded-md bg-[#F2F4F7] p-0.5"><button type="button" onClick={() => setProductSkuScope(product, 'all')} className={`h-7 flex-1 rounded text-[12px] ${allSkus ? 'bg-white font-medium text-[#008F4C] shadow-sm' : 'text-[#667085]'}`}>整个商品</button><button type="button" onClick={() => setProductSkuScope(product, 'selected')} className={`h-7 flex-1 rounded text-[12px] ${!allSkus ? 'bg-white font-medium text-[#008F4C] shadow-sm' : 'text-[#667085]'}`}>指定规格值</button></div><div className="min-w-0 text-[12px] text-[#667085]">{allSkus ? <span className="font-medium text-[#008F4C]">覆盖全部当前及后续有效 SKU</span> : selected.length > 0 ? <><span className="font-medium text-[#008F4C]">已选 {selected.length} 个规格值：</span>{selected.slice(0, 3).join('、')}{selected.length > 3 ? ` 等 ${selected.length} 个` : ''}<span className="ml-1 text-[#98A2B3]">· 影响 {affectedSkuCount} 个 SKU</span></> : <span className="text-[#D92D20]">请选择规格值</span>}</div><button type="button" disabled={allSkus} onClick={() => openSkuSelector(product)} className="h-8 rounded-md border border-[#DDE2E8] text-[12px] text-[#008F4C] disabled:cursor-not-allowed disabled:bg-[#F5F6F7] disabled:text-[#B8C0CC]">选择规格值</button><button type="button" onClick={() => removeDraftProduct(product)} aria-label={`移除${product}`} className="text-[#98A2B3] hover:text-[#D92D20]"><X size={15} /></button></div>; })}</div>}
                    </section>
                  )}

                  {(draftObjectType === 'method' || draftObjectType === 'addon') && (
                    <section className="space-y-4 rounded-md border border-[#E3E7EC] p-3">
                      <div><div className="mb-2 flex items-center justify-between"><span className="text-[13px] font-medium text-[#344054]">{OBJECT_LABELS[draftObjectType]} <span className="text-[#D92D20]">*</span></span><button type="button" onClick={openSharedObjectSelector} className="text-[13px] font-medium text-[#008F4C]">选择{OBJECT_LABELS[draftObjectType]}</button></div>{draftSharedObjectValues.length > 0 ? <div className="flex flex-wrap gap-2">{draftSharedObjectValues.map(value => <span key={value} className="rounded bg-[#EEF8F3] px-2 py-1 text-[12px] text-[#008F4C]">{value}</span>)}</div> : <button type="button" onClick={openSharedObjectSelector} className="h-12 w-full rounded-md border border-dashed border-[#C9CDD4] text-[13px] text-[#667085]">+ 从公共{OBJECT_LABELS[draftObjectType]}库选择</button>}</div>
                      <div className="border-t border-[#EEF0F3] pt-3"><div className="mb-2 text-[13px] font-medium text-[#344054]">适用商品范围</div><div className="grid grid-cols-2 gap-2"><label className={`cursor-pointer rounded-md border p-3 ${draftRelationProductScope === 'all_linked_products' ? 'border-[#00B460] bg-[#F3FBF7]' : 'border-[#E3E7EC]'}`}><input type="radio" name="relation-scope" checked={draftRelationProductScope === 'all_linked_products'} onChange={() => { setDraftRelationProductScope('all_linked_products'); setDraftProducts([]); }} className="mr-2 accent-[#00B460]" /><span className="text-[13px] font-medium text-[#344054]">全部关联商品</span><p className="ml-6 mt-1 text-[12px] text-[#667085]">门店内所有使用所选{OBJECT_LABELS[draftObjectType]}的商品均生效</p></label><label className={`cursor-pointer rounded-md border p-3 ${draftRelationProductScope === 'selected_products' ? 'border-[#00B460] bg-[#F3FBF7]' : 'border-[#E3E7EC]'}`}><input type="radio" name="relation-scope" checked={draftRelationProductScope === 'selected_products'} onChange={() => setDraftRelationProductScope('selected_products')} className="mr-2 accent-[#00B460]" /><span className="text-[13px] font-medium text-[#344054]">指定商品</span><p className="ml-6 mt-1 text-[12px] text-[#667085]">仅对少量例外商品生效</p></label></div>{draftRelationProductScope === 'selected_products' && <div className="mt-3"><button type="button" onClick={openProductSelector} className="flex h-10 w-full items-center justify-between rounded-md border border-[#DDE2E8] px-3 text-[13px]"><span>{draftProducts.length ? `已选择 ${draftProducts.length} 个商品` : '请选择商品'}</span><span className="text-[#008F4C]">选择商品</span></button></div>}</div>
                    </section>
                  )}

                  <section><h3 className="mb-2 text-[13px] font-medium text-[#344054]">经营结果 <span className="text-[#D92D20]">*</span></h3><div className="grid grid-cols-2 gap-2">{([['only_selected', draftObjectType === 'method' || draftObjectType === 'addon' ? '仅选中门店可选' : '仅选中门店可售'], ['except_selected', draftObjectType === 'method' || draftObjectType === 'addon' ? '选中门店不可选' : '选中门店不可售']] as [ScopeMode, string][]).map(([mode, label]) => <label key={mode} className={`cursor-pointer rounded-md border px-3 py-3 ${draftMode === mode ? 'border-[#00B460] bg-[#F3FBF7]' : 'border-[#E3E7EC]'}`}><input type="radio" name="scope-mode" checked={draftMode === mode} onChange={() => setDraftMode(mode)} className="mr-2 accent-[#00B460]" /><span className="text-[13px] font-medium text-[#344054]">{label}</span></label>)}</div></section>
                </div>
              )}

              {editorStep === 2 && (
                <div className="space-y-5"><section><div className="mb-2 flex items-center justify-between"><h3 className="text-[14px] font-semibold text-[#1D2129]">适用门店 <span className="text-[#D92D20]">*</span></h3><span className="text-[12px] text-[#667085]">区域、组织和门店类型仅用于选择器筛选</span></div><button type="button" onClick={openStoreSelector} className="flex h-11 w-full items-center justify-between rounded-md border border-[#DDE2E8] px-3 text-[13px]"><span>{draftStores.length ? `已选择 ${draftStores.length} 家门店` : '请选择门店'}</span><span className="font-medium text-[#008F4C]">选择门店</span></button><div className="mt-2 flex flex-wrap gap-2">{draftStores.slice(0, 8).map(store => <span key={store} className="rounded bg-[#F2F4F7] px-2 py-1 text-[12px] text-[#4E5969]">{store}</span>)}{draftStores.length > 8 && <span className="py-1 text-[12px] text-[#667085]">另 {draftStores.length - 8} 家</span>}</div></section><section className="border-t border-[#EEF0F3] pt-5"><h3 className="mb-2 text-[14px] font-semibold text-[#1D2129]">适用渠道 <span className="text-[#D92D20]">*</span></h3><div className="grid grid-cols-3 gap-2">{CHANNELS.map(channel => <label key={channel} className={`flex cursor-pointer items-center rounded-md border px-3 py-2.5 text-[13px] ${draftChannels.includes(channel) ? 'border-[#9ADFC0] bg-[#F3FBF7] text-[#008F4C]' : 'border-[#E3E7EC] text-[#4E5969]'}`}><input type="checkbox" checked={draftChannels.includes(channel)} onChange={() => toggleSelection(channel, draftChannels, setDraftChannels)} className="mr-2 accent-[#00B460]" />{channel}</label>)}</div></section></div>
              )}

              {editorStep === 3 && (
                <div className="space-y-4"><section className="rounded-md border border-[#E3E7EC]"><div className="border-b border-[#EEF0F3] bg-[#F7F8FA] px-4 py-3 text-[14px] font-semibold text-[#1D2129]">规则摘要</div><dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-3 px-4 py-4 text-[13px]"><dt className="text-[#98A2B3]">规则名称</dt><dd className="font-medium text-[#344054]">{draftName}</dd><dt className="text-[#98A2B3]">管控对象</dt><dd className="text-[#344054]">{OBJECT_LABELS[draftObjectType]} · {draftObjectType === 'sku' ? `${draftProducts.length} 个商品 / 最终影响 ${draftObjectSelectionList?.reduce((sum, group) => sum + getAffectedSkuOptions(group.productName, Boolean(group.allSkus), group.values).length, 0) || 0} 个 SKU` : `${draftSharedObjectValues.join('、')} · ${draftRelationProductScope === 'all_linked_products' ? '全部关联商品' : `指定 ${draftProducts.length} 个商品`}`}</dd><dt className="text-[#98A2B3]">经营结果</dt><dd className="text-[#344054]">{getModeLabel(draftMode, draftObjectType)}</dd><dt className="text-[#98A2B3]">适用范围</dt><dd className="text-[#344054]">{draftStores.length} 家门店 · {draftChannels.length} 个渠道</dd></dl></section>{hasDraftConflict ? <div className="rounded-md border border-[#F7C8C5] bg-[#FFF6F5] p-4"><div className="flex items-center font-medium text-[#B42318]"><AlertTriangle size={16} className="mr-2" />发现 1 个反向规则冲突</div><p className="mt-2 pl-6 text-[12px] leading-5 text-[#667085]">与规则“{draftConflictRule?.name}”按规格值展开后的最终 SKU、门店和渠道范围重叠，且经营结果相反。请返回修改对象或范围后再保存。</p></div> : <div className="flex items-center rounded-md border border-[#B9E8D1] bg-[#F3FBF7] p-4 text-[13px] text-[#007A43]"><CheckCircle2 size={17} className="mr-2" />校验通过：规格值已展开为最终 SKU 集合，未发现相反经营结果。</div>}<p className="text-[12px] leading-5 text-[#667085]">保存后生成新规则版本并立即启用；规则用于后续商品发布和点单校验，不自动改变已发布商品状态。</p></div>
              )}
            </div>

            <div className="flex h-16 shrink-0 items-center justify-between border-t border-[#E5E7EB] bg-white px-5">
              <button type="button" onClick={() => setEditorOpen(false)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px] text-[#4E5969]">取消</button>
              <div className="flex items-center gap-2">
                {editorStep > 1 && <button type="button" onClick={() => setEditorStep(current => (current - 1) as EditorStep)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px] text-[#4E5969]">上一步</button>}
                {editorStep < 3 ? <button type="button" disabled={editorStep === 1 ? !stepOneValid : !stepTwoValid} onClick={() => setEditorStep(current => (current + 1) as EditorStep)} className="h-9 rounded-md bg-[#00B460] px-5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#B8C0CC]">下一步</button> : <button type="button" onClick={saveRule} disabled={!canSaveRule} className="h-9 rounded-md bg-[#00B460] px-5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#B8C0CC]">{hasDraftConflict ? '请先解决冲突' : '保存规则'}</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {skuSelectorProduct && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label={`选择${skuSelectorProduct}的规格`}>
          <div className="flex h-[560px] w-[720px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5"><div><h3 className="font-semibold text-[#1D2129]">选择规格值</h3><p className="mt-0.5 text-[12px] text-[#667085]">{skuSelectorProduct} · 仅展示该商品已关联的规格组与规格值；选中值将命中所有包含该值的 SKU。</p></div><button type="button" onClick={() => setSkuSelectorProduct(null)} className="text-[#667085]"><X size={19} /></button></div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FA] p-4"><div className="space-y-3">{getSpecValueGroups(skuSelectorProduct).map(group => <section key={group.name} className="rounded-md border border-[#E3E7EC] bg-white"><div className="flex items-center justify-between border-b border-[#EEF0F3] px-4 py-2.5"><span className="text-[13px] font-medium text-[#344054]">{group.name}</span><span className="text-[12px] text-[#98A2B3]">已选 {group.values.filter(value => pendingSkuValues.includes(value)).length}/{group.values.length}</span></div><div className="grid grid-cols-3 gap-2 p-3">{group.values.map(value => <label key={`${group.name}-${value}`} className={`flex cursor-pointer items-center rounded-md border px-3 py-2.5 text-[13px] ${pendingSkuValues.includes(value) ? 'border-[#9ADFC0] bg-[#F3FBF7] text-[#008F4C]' : 'border-[#DDE2E8] text-[#4E5969]'}`}><input type="checkbox" checked={pendingSkuValues.includes(value)} onChange={() => setPendingSkuValues(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])} className="mr-2 h-4 w-4 accent-[#00B460]" />{value}</label>)}</div></section>)}</div></div>
            <div className="flex h-16 shrink-0 items-center justify-between border-t border-[#E5E7EB] px-5"><span className="text-[13px] text-[#667085]">已选 <strong className="text-[#008F4C]">{pendingSkuValues.length}</strong> 个规格值 · 将影响 <strong className="text-[#008F4C]">{getAffectedSkuOptions(skuSelectorProduct, false, pendingSkuValues).length}</strong> 个 SKU</span><div className="flex gap-2"><button type="button" onClick={() => setSkuSelectorProduct(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">取消</button><button type="button" disabled={pendingSkuValues.length === 0} onClick={() => { setDraftObjectSelections(current => ({ ...current, [skuSelectorProduct]: pendingSkuValues })); setSkuSelectorProduct(null); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white disabled:bg-[#B8C0CC]">确认选择</button></div></div>
          </div>
        </div>
      )}

      {sharedObjectSelectorOpen && (draftObjectType === 'method' || draftObjectType === 'addon') && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label={`选择${OBJECT_LABELS[draftObjectType]}`}>
          <div className="flex h-[620px] w-[760px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5"><div><h3 className="font-semibold text-[#1D2129]">选择{OBJECT_LABELS[draftObjectType]}</h3><p className="mt-0.5 text-[12px] text-[#667085]">从公共{OBJECT_LABELS[draftObjectType]}库按分组选择；保存后作用于其关联商品。</p></div><button type="button" onClick={() => setSharedObjectSelectorOpen(false)} className="text-[#667085]"><X size={19} /></button></div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FA] p-4"><div className="space-y-3">{SHARED_OBJECT_GROUPS[draftObjectType].map(group => <section key={group.name} className="rounded-md border border-[#E3E7EC] bg-white"><div className="flex items-center justify-between border-b border-[#EEF0F3] px-4 py-2.5"><span className="text-[13px] font-medium text-[#344054]">{group.name}</span><span className="text-[12px] text-[#98A2B3]">{group.values.filter(value => pendingSharedObjectValues.includes(value)).length}/{group.values.length}</span></div><div className="grid grid-cols-3 gap-2 p-3">{group.values.map(value => <label key={value} className={`flex cursor-pointer items-center rounded-md border px-3 py-2.5 text-[13px] ${pendingSharedObjectValues.includes(value) ? 'border-[#9ADFC0] bg-[#F3FBF7] text-[#008F4C]' : 'border-[#DDE2E8] text-[#4E5969]'}`}><input type="checkbox" checked={pendingSharedObjectValues.includes(value)} onChange={() => setPendingSharedObjectValues(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])} className="mr-2 accent-[#00B460]" />{value}</label>)}</div></section>)}</div></div>
            <div className="flex h-16 shrink-0 items-center justify-between border-t border-[#E5E7EB] px-5"><span className="text-[13px] text-[#667085]">已选择 <strong className="text-[#008F4C]">{pendingSharedObjectValues.length}</strong> 项</span><div className="flex gap-2"><button type="button" onClick={() => setPendingSharedObjectValues([])} className="h-9 rounded-md border border-[#DDE2E8] px-3 text-[13px]">清空</button><button type="button" onClick={() => setSharedObjectSelectorOpen(false)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">取消</button><button type="button" disabled={pendingSharedObjectValues.length === 0} onClick={() => { setDraftSharedObjectValues(pendingSharedObjectValues); setSharedObjectSelectorOpen(false); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white disabled:bg-[#B8C0CC]">确认选择</button></div></div>
          </div>
        </div>
      )}

      {productSelectorOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="选择商品">
          <div className="flex h-[560px] w-[680px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5">
                <div><h3 className="font-semibold text-[#1D2129]">选择商品</h3><p className="mt-0.5 text-[12px] text-[#667085]">{draftObjectType === 'sku' ? '支持多选；新选商品默认管控全部有效 SKU，确认后可按商品改为指定规格值。' : `仅在“指定商品”范围下使用，用于收窄${OBJECT_LABELS[draftObjectType]}的关联商品。`}</p></div>
              <button type="button" onClick={() => setProductSelectorOpen(false)} aria-label="关闭" className="text-[#667085]"><X size={19} /></button>
            </div>
            <div className="shrink-0 border-b border-[#E5E7EB] bg-[#F7F8FA] p-4">
              <label className="relative block w-[360px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                <input value={productSelectorKeyword} onChange={event => setProductSelectorKeyword(event.target.value)} placeholder="搜索商品名称或商品 ID" className="h-9 w-full rounded-md border border-[#DDE2E8] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]" />
              </label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="overflow-hidden rounded-md border border-[#E3E7EC]">
                {filteredSelectorProducts.map((product, index) => (
                  <label key={product} className="flex cursor-pointer items-center gap-3 border-b border-[#EEF0F3] px-4 py-3 last:border-b-0 hover:bg-[#FAFCFB]">
                    <input type="checkbox" checked={pendingProducts.includes(product)} onChange={() => setPendingProducts(current => current.includes(product) ? current.filter(item => item !== product) : [...current, product])} className="h-4 w-4 accent-[#00B460]" />
                    <div className="min-w-0 flex-1"><div className="font-medium text-[#344054]">{product}</div><div className="mt-0.5 text-[12px] text-[#98A2B3]">商品 ID：{1001 + index} · {product.includes('套餐') ? '套餐商品' : '标准商品'}{draftObjectType === 'sku' ? ` · ${getSkuOptions(product).length} 个可售 SKU` : ''}</div></div>
                  </label>
                ))}
                {filteredSelectorProducts.length === 0 && <div className="py-16 text-center text-[13px] text-[#98A2B3]">没有符合条件的商品</div>}
              </div>
            </div>
            <div className="flex h-16 shrink-0 items-center justify-between border-t border-[#E5E7EB] px-5">
              <div className="text-[13px] text-[#667085]">已选择 <strong className="text-[#008F4C]">{pendingProducts.length}</strong> 个商品</div>
              <div className="flex items-center gap-2"><button type="button" onClick={() => setPendingProducts([])} className="h-9 rounded-md border border-[#DDE2E8] px-3 text-[13px] text-[#4E5969]">清空</button><button type="button" onClick={() => setProductSelectorOpen(false)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px] text-[#4E5969]">取消</button><button type="button" disabled={pendingProducts.length === 0} onClick={() => { applySelectedProducts(pendingProducts); setProductSelectorOpen(false); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#B8C0CC]">确认选择</button></div>
            </div>
          </div>
        </div>
      )}

      {storeSelectorOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="选择适用门店">
          <div className="flex h-[680px] w-[860px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5">
              <div><h3 className="font-semibold text-[#1D2129]">选择适用门店</h3><p className="mt-0.5 text-[12px] text-[#667085]">可按门店、编码、组织、区域和类型筛选；保存规则时按具体门店记录。</p></div>
              <button type="button" onClick={() => setStoreSelectorOpen(false)} aria-label="关闭" className="text-[#667085]"><X size={19} /></button>
            </div>
            <div className="grid shrink-0 grid-cols-[minmax(260px,1fr)_190px_150px] gap-3 border-b border-[#E5E7EB] bg-[#F7F8FA] p-4">
              <label className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                <input value={storeSelectorKeyword} onChange={event => setStoreSelectorKeyword(event.target.value)} placeholder="搜索门店名称、编码、区域" className="h-9 w-full rounded-md border border-[#DDE2E8] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]" />
              </label>
              <label className="relative"><select value={storeOrganizationFilter} onChange={event => setStoreOrganizationFilter(event.target.value)} className="h-9 w-full appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-8 text-[13px]"><option value="all">所属组织：全部</option>{STORE_ORGANIZATIONS.map(value => <option key={value} value={value}>{value}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /></label>
              <label className="relative"><select value={storeTypeFilter} onChange={event => setStoreTypeFilter(event.target.value)} className="h-9 w-full appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-8 text-[13px]"><option value="all">门店类型：全部</option>{STORE_TYPES.map(value => <option key={value} value={value}>{value}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /></label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="overflow-hidden rounded-md border border-[#E3E7EC]">
                <div className="grid grid-cols-[44px_minmax(180px,1.2fr)_140px_150px_100px] bg-[#F7F8FA] px-3 py-2.5 text-[12px] font-medium text-[#667085]"><span></span><span>门店</span><span>区域</span><span>所属组织</span><span>门店类型</span></div>
                {filteredSelectorStores.map(store => (
                  <label key={store.id} className="grid cursor-pointer grid-cols-[44px_minmax(180px,1.2fr)_140px_150px_100px] items-center border-t border-[#EEF0F3] px-3 py-3 text-[13px] hover:bg-[#FAFCFB]">
                    <input type="checkbox" checked={pendingStores.includes(store.name)} onChange={() => setPendingStores(current => current.includes(store.name) ? current.filter(item => item !== store.name) : [...current, store.name])} className="h-4 w-4 accent-[#00B460]" />
                    <span className="min-w-0"><span className="block truncate font-medium text-[#344054]">{store.name}</span><span className="mt-0.5 block text-[12px] text-[#98A2B3]">{store.code}</span></span>
                    <span className="text-[#667085]">{store.region}</span><span className="truncate text-[#667085]">{store.organization}</span><span className="text-[#667085]">{store.type}</span>
                  </label>
                ))}
                {filteredSelectorStores.length === 0 && <div className="py-16 text-center text-[13px] text-[#98A2B3]">没有符合条件的门店</div>}
              </div>
            </div>
            <div className="flex h-16 shrink-0 items-center justify-between border-t border-[#E5E7EB] px-5">
              <div className="text-[13px] text-[#667085]">已选择 <strong className="text-[#008F4C]">{pendingStores.length}</strong> 家门店</div>
              <div className="flex items-center gap-2"><button type="button" onClick={() => setPendingStores([])} className="h-9 rounded-md border border-[#DDE2E8] px-3 text-[13px] text-[#4E5969]">清空</button><button type="button" onClick={() => setStoreSelectorOpen(false)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px] text-[#4E5969]">取消</button><button type="button" disabled={pendingStores.length === 0} onClick={() => { setDraftStores(pendingStores); setStoreSelectorOpen(false); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#B8C0CC]">确认选择</button></div>
            </div>
          </div>
        </div>
      )}

      {pendingToggle && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="确认更改售卖规则状态">
          <div className="w-[470px] rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3"><AlertTriangle size={22} className="mt-0.5 shrink-0 text-[#F79009]" /><div><h3 className="font-semibold text-[#1D2129]">{pendingToggle.status === 'enabled' ? '停用' : '启用'}门店售卖规则</h3><p className="mt-2 text-[13px] leading-6 text-[#667085]">规则“{pendingToggle.name}”管控 {getRuleObjectValueCount(pendingToggle)} 个{OBJECT_LABELS[pendingToggle.objectType]}、{pendingToggle.stores.length} 家门店和 {pendingToggle.channels.length} 个渠道。</p><p className="text-[13px] leading-6 text-[#667085]">{pendingToggle.status === 'enabled' ? '停用后不再参与后续发布和点单校验，已发布门店商品不会自动上下架。' : '启用前会再次校验对象、门店和渠道范围；通过后用于后续发布和点单校验。'}</p></div></div>
            {pendingEnableConflict && (
              <div className="mt-4 rounded-md border border-[#F7C8C5] bg-[#FFF6F5] px-3 py-2 text-[12px] leading-5 text-[#B42318]">
                启用校验未通过：与规则“{pendingEnableConflict.name}”范围重叠且售卖结果相反，请先调整其中一条规则。
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setPendingToggle(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">取消</button><button disabled={Boolean(pendingEnableConflict)} onClick={() => { if (pendingEnableConflict) return; setRules(current => current.map(item => item.id === pendingToggle.id ? { ...item, status: item.status === 'enabled' ? 'disabled' : 'enabled', updatedAt: '刚刚' } : item)); setToast(`规则“${pendingToggle.name}”已${pendingToggle.status === 'enabled' ? '停用' : '启用'}`); setPendingToggle(null); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#B8C0CC]">{pendingEnableConflict ? '请先解决冲突' : `确认${pendingToggle.status === 'enabled' ? '停用' : '启用'}`}</button></div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/35 p-6" role="alertdialog" aria-modal="true" aria-label="确认删除售卖规则">
          <div className="w-[480px] rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3"><AlertTriangle size={22} className="mt-0.5 shrink-0 text-[#D92D20]" /><div><h3 className="font-semibold text-[#1D2129]">删除门店售卖规则</h3><p className="mt-2 text-[13px] leading-6 text-[#667085]">确定删除规则“{deleteTarget.name}”吗？该规则管控 {getRuleObjectValueCount(deleteTarget)} 个{OBJECT_LABELS[deleteTarget.objectType]}、{deleteTarget.stores.length} 家门店和 {deleteTarget.channels.length} 个渠道。</p><p className="text-[13px] leading-6 text-[#667085]">删除后无法在列表恢复；已发布门店商品不会自动上下架，历史操作记录仍保留用于审计。</p></div></div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px] text-[#4E5969]">取消</button><button type="button" onClick={() => { setRules(current => current.filter(rule => rule.id !== deleteTarget.id)); setSelectedIds(current => current.filter(id => id !== deleteTarget.id)); setDetailRule(current => current?.id === deleteTarget.id ? null : current); setToast(`规则“${deleteTarget.name}”已删除`); setDeleteTarget(null); }} className="h-9 rounded-md bg-[#D92D20] px-4 text-[13px] font-medium text-white hover:bg-[#B42318]">确认删除</button></div>
          </div>
        </div>
      )}

      {detailRule && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="查看售卖规则详情">
          <div className="w-[680px] overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-5">
              <div>
                <h2 className="text-[17px] font-semibold text-[#1D2129]">售卖规则详情</h2>
                <p className="text-[12px] text-[#667085]">{detailRule.id} · {detailRule.updatedAt}</p>
              </div>
              <button type="button" onClick={() => setDetailRule(null)} aria-label="关闭" className="rounded p-1 text-[#667085] hover:bg-[#F2F4F7]"><X size={20} /></button>
            </div>
            <div className="px-5 py-4">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
                <div><dt className="text-[#98A2B3]">规则名称</dt><dd className="mt-1 font-medium text-[#344054]">{detailRule.name}</dd></div>
                <div><dt className="text-[#98A2B3]">状态</dt><dd className="mt-1 font-medium text-[#344054]">{detailRule.status === 'enabled' ? '已启用' : '已停用'}</dd></div>
                <div className="col-span-2"><dt className="text-[#98A2B3]">管控对象</dt><dd className="mt-1 font-medium text-[#344054]">{OBJECT_LABELS[detailRule.objectType]} · {detailRule.objectType === 'method' || detailRule.objectType === 'addon' ? (detailRule.sharedObjectValues || []).join('、') : detailRule.productNames.join('、')}</dd>{detailRule.objectType === 'sku' && <dd className="mt-1 leading-6 text-[#667085]">{getRuleObjectSelectionText(detailRule)}</dd>}{(detailRule.objectType === 'method' || detailRule.objectType === 'addon') && <dd className="mt-1 leading-6 text-[#667085]">适用商品：{getRelationScopeText(detailRule)}{detailRule.relationProductScope === 'selected_products' ? `（${detailRule.productNames.join('、')}）` : ''}</dd>}</div>
                <div><dt className="text-[#98A2B3]">经营结果</dt><dd className="mt-1 font-medium text-[#344054]">{getModeLabel(detailRule.mode, detailRule.objectType)}</dd></div>
                <div><dt className="text-[#98A2B3]">适用渠道</dt><dd className="mt-1 text-[#344054]">{detailRule.channels.join('、')}</dd></div>
                <div className="col-span-2"><dt className="text-[#98A2B3]">适用门店（{detailRule.stores.length} 家）</dt><dd className="mt-1 leading-6 text-[#344054]">{detailRule.stores.join('、')}</dd></div>
              </dl>
            </div>
            <div className="flex h-14 items-center justify-between gap-2 border-t border-[#E5E7EB] px-5">
              <button type="button" disabled={detailRule.status === 'enabled'} title={detailRule.status === 'enabled' ? '请先停用规则后再删除' : '删除规则'} onClick={() => { setDeleteTarget(detailRule); setDetailRule(null); }} className="h-9 rounded-md px-3 text-[13px] text-[#D92D20] hover:bg-[#FFF5F4] disabled:cursor-not-allowed disabled:text-[#B8C0CC] disabled:hover:bg-transparent">{detailRule.status === 'enabled' ? '停用后可删除' : '删除规则'}</button>
              <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setRules(current => [{ ...detailRule, id: `scope-${Date.now()}`, name: `${detailRule.name}-副本`, status: 'disabled', updatedAt: '刚刚' }, ...current]); setToast('规则已复制，副本默认为停用状态'); setDetailRule(null); }} className="inline-flex h-9 items-center rounded-md border border-[#DDE2E8] px-3 text-[13px] text-[#4E5969]"><Copy size={14} className="mr-1.5" />复制规则</button>
              <button type="button" onClick={() => { setDetailRule(null); openEdit(detailRule); }} className="inline-flex h-9 items-center rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white"><Eye size={14} className="mr-1.5" />编辑规则</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 items-center rounded-md bg-[#1D2129] px-4 py-2.5 text-[13px] text-white shadow-lg">
          <CheckCircle2 size={16} className="mr-2 text-[#65D9A2]" />
          {toast}
        </div>
      )}
    </div>
  );
};
