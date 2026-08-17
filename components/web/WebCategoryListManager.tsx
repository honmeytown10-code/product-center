﻿﻿﻿﻿﻿import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ChevronDown, ChevronRight, Eye, GripVertical, Info, ListFilter, Minus, Plus, Search, Trash2, X } from 'lucide-react';

type DisplayCategory = {
  id: string;
  name: string;
  alias: string;
  code: string;
  sort: number;
  iconText: string;
  tag: string;
  requiredGroup: boolean;
  displaySettings: string[];
  saleScopes: string[];
  saleTypes: string[];
  remark: string;
  productCount: number;
  linkedProducts: LinkedProduct[];
  parentId?: string;
  children?: DisplayCategory[];
  sourceType: 'brand' | 'store';
  sourceName: string;
};

type LinkedProduct = {
  id: string;
  name: string;
  type: '商城商品' | '标准商品' | '套餐商品' | '加料商品';
  imageText?: string;
  categoryCount?: number;
};

type LinkProductCandidate = LinkedProduct & {
  categoryPath?: string;
};

type CategoryFormState = {
  name: string;
  alias: string;
  code: string;
  iconText: string;
  iconUploaded: boolean;
  bannerUploaded: boolean;
  tag: string;
  requiredGroup: boolean;
  requiredGroupDineIn: boolean;
  requiredGroupTakeout: boolean;
  requiredGroupDineInLimit: number;
  requiredGroupTakeoutLimit: number;
  displaySettings: string[];
  remark: string;
  sort: number;
  shelfTime: 'all_day' | 'custom';
  limitTop: boolean;
  onlyBackstageGroup: boolean;
  classicMenuHidden: boolean;
  queueSetting: 'join' | 'skip';
  standaloneOrderSetting: 'disabled' | 'enabled';
};

type SecondaryCategoryEditorDraft = {
  id?: string;
  parentId: string;
  parentName: string;
  name: string;
  alias: string;
  sort: number;
};

type CategorySortDraftRow = {
  id: string;
  name: string;
  sort: number;
};

type BackendCategory = {
  id: string;
  name: string;
  code: string;
  sort: number;
  productCount: number;
  linkedProducts: LinkedProduct[];
  children?: BackendCategory[];
};

type SortSyncMode = 'immediate' | 'manual' | 'scheduled';
type CategoryColumnKey = 'sort' | 'icon' | 'name' | 'alias' | 'code' | 'tag' | 'requiredGroup' | 'displaySettings' | 'linkedProducts' | 'remark' | 'source';

const MOCK_DATA: DisplayCategory[] = [
  {
    id: '1',
    name: '测试',
    alias: '本周推荐',
    code: '-',
    sort: 1,
    iconText: '测',
    tag: '推荐',
    requiredGroup: true,
    displaySettings: ['微信小程序', '企迈POS'],
    saleScopes: ['堂食', '外带'],
    saleTypes: ['到店'],
    remark: '用于点单页首屏曝光',
    productCount: 0,
    children: [
      {
        id: '1-1',
        name: '子测试1',
        alias: '人气单品',
        code: '-',
        sort: 1,
        iconText: '',
        tag: '',
        requiredGroup: false,
        displaySettings: [],
        saleScopes: [],
        saleTypes: [],
        remark: '',
        productCount: 5,
        linkedProducts: [
          { id: 'p-101', name: '子测试商品A', type: '标准商品', categoryCount: 2 },
          { id: 'p-102', name: '子测试加料', type: '加料商品', categoryCount: 1 },
        ],
        parentId: '1',
        sourceType: 'brand',
        sourceName: '品牌',
      },
    ],
    linkedProducts: [
      { id: 'p-001', name: '招牌测试套餐', type: '套餐商品', categoryCount: 2 },
      { id: 'p-002', name: '测试标准商品', type: '标准商品', categoryCount: 1 },
      { id: 'p-003', name: '测试商城商品', type: '商城商品', categoryCount: 3 },
    ],
    sourceType: 'brand',
    sourceName: '品牌',
  },
  {
    id: '2',
    name: '精品套餐',
    alias: '多人分享更划算',
    code: 'combo',
    sort: 2,
    iconText: '套',
    tag: '热门',
    requiredGroup: false,
    displaySettings: ['微信小程序', '企迈POS', '企迈H5'],
    saleScopes: ['堂食', '外带'],
    saleTypes: ['到店', '自提'],
    remark: '套餐类统一归档',
    productCount: 12,
    linkedProducts: [
      { id: 'p-011', name: '双人精品套餐', type: '套餐商品', categoryCount: 1 },
      { id: 'p-012', name: '商城精品套餐', type: '商城商品', categoryCount: 2 },
    ],
    sourceType: 'brand',
    sourceName: '品牌',
  },
  {
    id: '3',
    name: '蛋糕',
    alias: '生日仪式感',
    code: 'cake',
    sort: 3,
    iconText: '糕',
    tag: '新品',
    requiredGroup: false,
    displaySettings: ['微信小程序', '支付宝小程序'],
    saleScopes: ['堂食', '外带'],
    saleTypes: ['到店', '外送'],
    remark: '生日蛋糕单独展示',
    productCount: 8,
    linkedProducts: [
      { id: 'p-021', name: '芒果蛋糕', type: '标准商品', categoryCount: 1 },
      { id: 'p-022', name: '草莓蛋糕', type: '商城商品', categoryCount: 2 },
    ],
    sourceType: 'brand',
    sourceName: '品牌',
  },
  {
    id: '4',
    name: '0318分类',
    alias: '',
    code: '0318',
    sort: 4,
    iconText: '03',
    tag: '活动',
    requiredGroup: false,
    displaySettings: ['微信小程序', '企迈POS', '企迈H5', '抖音小程序'],
    saleScopes: ['堂食', '外带', '外卖'],
    saleTypes: ['到店', '外送'],
    remark: '0318活动期间专用分类',
    productCount: 45,
    linkedProducts: [
      { id: 'p-031', name: '活动套餐', type: '套餐商品' },
      { id: 'p-032', name: '活动加料', type: '加料商品' },
      { id: 'p-033', name: '活动单品', type: '标准商品' },
    ],
    sourceType: 'store',
    sourceName: '南山万象店',
  },
  {
    id: '5',
    name: '酒水',
    alias: '清爽饮品',
    code: 'drink',
    sort: 5,
    iconText: '饮',
    tag: '',
    requiredGroup: false,
    displaySettings: ['微信小程序', '企迈POS'],
    saleScopes: ['堂食'],
    saleTypes: ['到店'],
    remark: '仅堂食场景展示',
    productCount: 20,
    linkedProducts: [
      { id: 'p-041', name: '冰美式', type: '标准商品' },
      { id: 'p-042', name: '门店酒水组合', type: '商城商品' },
    ],
    sourceType: 'store',
    sourceName: '福田卓悦店',
  },
];

const MOCK_BACKEND_DATA: BackendCategory[] = [
  {
    id: 'backend-1',
    name: '原材料',
    code: 'material',
    sort: 1,
    productCount: 0,
    linkedProducts: [],
    children: [
      {
        id: 'backend-1-1',
        name: '乳制品',
        code: 'milk',
        sort: 1,
        productCount: 2,
        linkedProducts: [
          { id: 'bp-101', name: '全脂牛奶', type: '标准商品', categoryCount: 2 },
          { id: 'bp-102', name: '厚乳拿铁', type: '标准商品', categoryCount: 1 },
        ],
      },
      {
        id: 'backend-1-2',
        name: '糖浆',
        code: 'syrup',
        sort: 2,
        productCount: 1,
        linkedProducts: [{ id: 'bp-103', name: '焦糖糖浆', type: '加料商品', categoryCount: 1 }],
      },
    ],
  },
  {
    id: 'backend-2',
    name: '包装物料',
    code: 'pack',
    sort: 2,
    productCount: 0,
    linkedProducts: [],
    children: [
      {
        id: 'backend-2-1',
        name: '打包袋',
        code: 'bag',
        sort: 1,
        productCount: 2,
        linkedProducts: [
          { id: 'bp-201', name: '外卖打包袋', type: '标准商品', categoryCount: 2 },
          { id: 'bp-202', name: '冷饮袋', type: '标准商品', categoryCount: 1 },
        ],
      },
    ],
  },
  {
    id: 'backend-3',
    name: '设备耗材',
    code: 'equip',
    sort: 3,
    productCount: 0,
    linkedProducts: [],
  },
];

const DISPLAY_SETTING_OPTIONS = [
  { id: 'wechat_mini', label: '微信小程序' },
  { id: 'alipay_mini', label: '支付宝小程序' },
  { id: 'douyin_mini', label: '抖音小程序' },
  { id: 'qimai_app', label: '企迈数店 app&企迈数店POS' },
  { id: 'qimai_h5', label: '企迈H5' },
];

const COLUMN_DEFS: Array<{ key: CategoryColumnKey; label: string; width: string }> = [
  { key: 'sort', label: '分类排序', width: '110px' },
  { key: 'icon', label: '分类图标', width: '80px' },
  { key: 'name', label: '分类名称', width: '220px' },
  { key: 'alias', label: '分类别名', width: '180px' },
  { key: 'code', label: '分类标识', width: '140px' },
  { key: 'tag', label: '分类标签', width: '110px' },
  { key: 'displaySettings', label: '展示渠道', width: '170px' },
  { key: 'linkedProducts', label: '关联商品', width: '120px' },
  { key: 'requiredGroup', label: '是否必选分组', width: '120px' },
  { key: 'remark', label: '备注', width: '170px' },
  { key: 'source', label: '数据来源', width: '160px' },
];

const ACTION_COLUMN_WIDTH = '280px';

const DEFAULT_VISIBLE_COLUMNS: Record<CategoryColumnKey, boolean> = {
  sort: true,
  icon: true,
  name: true,
  alias: true,
  code: true,
  tag: true,
  requiredGroup: true,
  displaySettings: true,
  linkedProducts: true,
  remark: true,
  source: true,
};

const createRootDraft = (sort: number): CategoryFormState => ({
  name: '',
  alias: '',
  code: '',
  iconText: '',
  iconUploaded: false,
  bannerUploaded: false,
  tag: '',
  requiredGroup: false,
  requiredGroupDineIn: true,
  requiredGroupTakeout: false,
  requiredGroupDineInLimit: 1,
  requiredGroupTakeoutLimit: 0,
  displaySettings: ['微信小程序', '企迈数店 app&企迈数店POS'],
  remark: '',
  sort,
  shelfTime: 'all_day',
  limitTop: false,
  onlyBackstageGroup: false,
  classicMenuHidden: false,
  queueSetting: 'join',
  standaloneOrderSetting: 'disabled',
});

const createRootDraftFromCategory = (category: DisplayCategory): CategoryFormState => ({
  name: category.name,
  alias: category.alias,
  code: category.code === '-' ? '' : category.code,
  iconText: category.iconText,
  iconUploaded: Boolean(category.iconText),
  bannerUploaded: false,
  tag: category.tag,
  requiredGroup: category.requiredGroup,
  requiredGroupDineIn: category.requiredGroup,
  requiredGroupTakeout: false,
  requiredGroupDineInLimit: 1,
  requiredGroupTakeoutLimit: 0,
  displaySettings: category.displaySettings,
  remark: category.remark,
  sort: category.sort,
  shelfTime: 'all_day',
  limitTop: false,
  onlyBackstageGroup: false,
  classicMenuHidden: false,
  queueSetting: 'join',
  standaloneOrderSetting: 'disabled',
});

const sortCategories = (items: DisplayCategory[]) => [...items].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
const sortBackendCategories = (items: BackendCategory[]): BackendCategory[] =>
  [...items]
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
    .map(item => ({
      ...item,
      children: item.children ? sortBackendCategories(item.children) : item.children,
    }));

const findChildCategory = (items: DisplayCategory[], childId: string): DisplayCategory | null => {
  for (const item of items) {
    const match = item.children?.find(child => child.id === childId);
    if (match) return match;
  }
  return null;
};

const findBackendCategory = (items: BackendCategory[], targetId: string): BackendCategory | null => {
  for (const item of items) {
    if (item.id === targetId) return item;
    if (item.children?.length) {
      const matched = findBackendCategory(item.children, targetId);
      if (matched) return matched;
    }
  }
  return null;
};

const updateBackendCategoryTree = (
  items: BackendCategory[],
  targetId: string,
  updater: (item: BackendCategory) => BackendCategory
): BackendCategory[] =>
  sortBackendCategories(
    items.map(item => {
      if (item.id === targetId) return updater(item);
      if (item.children?.length) {
        return { ...item, children: updateBackendCategoryTree(item.children, targetId, updater) };
      }
      return item;
    })
  );

const removeBackendCategoryTree = (items: BackendCategory[], targetId: string): BackendCategory[] =>
  sortBackendCategories(
    items
      .filter(item => item.id !== targetId)
      .map(item => ({
        ...item,
        children: item.children ? removeBackendCategoryTree(item.children, targetId) : item.children,
      }))
  );

const updateBackendCategoryLinkedProductsTree = (
  items: BackendCategory[],
  categoryId: string,
  updater: (products: LinkedProduct[]) => LinkedProduct[]
): BackendCategory[] =>
  items.map(item => {
    if (item.id === categoryId) {
      const nextProducts = updater(item.linkedProducts);
      return {
        ...item,
        linkedProducts: nextProducts,
        productCount: nextProducts.length,
      };
    }
    if (item.children?.length) {
      return {
        ...item,
        children: updateBackendCategoryLinkedProductsTree(item.children, categoryId, updater),
      };
    }
    return item;
  });

const DISPLAY_CHANNEL_ICON_DEFS: Record<string, { shortLabel: string; className: string; label: string }> = {
  微信小程序: { shortLabel: '微', className: 'bg-[#DDF5D8] text-[#22C55E]', label: '微信小程序' },
  支付宝小程序: { shortLabel: '支', className: 'bg-[#DDEEFF] text-[#3B82F6]', label: '支付宝小程序' },
  抖音小程序: { shortLabel: '抖', className: 'bg-[#F5E8FF] text-[#8B5CF6]', label: '抖音小程序' },
  '企迈数店 app&企迈数店POS': { shortLabel: '企', className: 'bg-[#EAF7F0] text-[#00A35B]', label: '企迈数店 app&企迈数店POS' },
  企迈POS: { shortLabel: '企', className: 'bg-[#EAF7F0] text-[#00A35B]', label: '企迈POS' },
  企迈H5: { shortLabel: 'H5', className: 'bg-[#FFF4D6] text-[#D97706]', label: '企迈H5' },
};

const LINKABLE_PRODUCTS_POOL: LinkProductCandidate[] = [
  { id: 'p-301', name: '0520 标品-1', type: '标准商品', imageText: '标', categoryCount: 2, categoryPath: '0413分类1/0413分类1-1' },
  { id: 'p-302', name: '加料打印排序商品', type: '标准商品', imageText: '加', categoryCount: 1, categoryPath: '咖啡' },
  { id: 'p-303', name: '0518 标品-9', type: '标准商品', imageText: '标', categoryCount: 3, categoryPath: '0413分类1/0413分类1-1' },
  { id: 'p-304', name: '商城精品套餐', type: '商城商品', imageText: '商', categoryCount: 2, categoryPath: '精品套餐' },
  { id: 'p-305', name: '双人精品套餐', type: '套餐商品', imageText: '套', categoryCount: 1, categoryPath: '精品套餐' },
  { id: 'p-306', name: '椰奶加料', type: '加料商品', imageText: '料', categoryCount: 2, categoryPath: '测试/子测试1' },
  { id: 'bp-401', name: '奶油蘑菇汤', type: '标准商品', imageText: '奶', categoryCount: 2, categoryPath: '后台分类/原材料/乳制品' },
  { id: 'bp-402', name: '打包吸管', type: '加料商品', imageText: '吸', categoryCount: 1, categoryPath: '后台分类/包装物料/打包袋' },
  { id: 'bp-403', name: '门店纸杯', type: '标准商品', imageText: '杯', categoryCount: 3, categoryPath: '后台分类/包装物料/打包袋' },
];

const collectLeafCategories = (items: DisplayCategory[], trail: string[] = []): Array<{ id: string; name: string; path: string }> =>
  items.flatMap(item => {
    const nextTrail = [...trail, item.name];
    if (item.children?.length) {
      return collectLeafCategories(item.children, nextTrail);
    }
    return [{ id: item.id, name: item.name, path: nextTrail.join('/') }];
  });

const normalizeLinkedProductCounts = (items: DisplayCategory[]) => {
  const countMap = new Map<string, number>();

  const walk = (list: DisplayCategory[]) => {
    list.forEach(item => {
      item.linkedProducts.forEach(product => {
        countMap.set(product.id, (countMap.get(product.id) || 0) + 1);
      });
      if (item.children?.length) walk(item.children);
    });
  };

  walk(items);

  const applyCounts = (list: DisplayCategory[]): DisplayCategory[] =>
    list.map(item => ({
      ...item,
      linkedProducts: item.linkedProducts.map(product => ({
        ...product,
        categoryCount: countMap.get(product.id) || product.categoryCount || 1,
      })),
      children: item.children ? applyCounts(item.children) : item.children,
    }));

  return applyCounts(items);
};

const collectBackendLeafCategories = (items: BackendCategory[], trail: string[] = []): Array<{ id: string; name: string; path: string }> =>
  items.flatMap(item => {
    const nextTrail = [...trail, item.name];
    if (item.children?.length) {
      return collectBackendLeafCategories(item.children, nextTrail);
    }
    return [{ id: item.id, name: item.name, path: nextTrail.join('/') }];
  });

const normalizeBackendLinkedProductCounts = (items: BackendCategory[]) => {
  const countMap = new Map<string, number>();

  const walk = (list: BackendCategory[]) => {
    list.forEach(item => {
      item.linkedProducts.forEach(product => {
        countMap.set(product.id, (countMap.get(product.id) || 0) + 1);
      });
      if (item.children?.length) walk(item.children);
    });
  };

  walk(items);

  const applyCounts = (list: BackendCategory[]): BackendCategory[] =>
    list.map(item => ({
      ...item,
      productCount: item.linkedProducts.length,
      linkedProducts: item.linkedProducts.map(product => ({
        ...product,
        categoryCount: countMap.get(product.id) || product.categoryCount || 1,
      })),
      children: item.children ? applyCounts(item.children) : item.children,
    }));

  return applyCounts(items);
};

type CategoryManagerScope = 'all' | 'backend' | 'frontend';

interface WebCategoryListManagerProps {
  scope?: CategoryManagerScope;
}

export const WebCategoryListManager: React.FC<WebCategoryListManagerProps> = ({ scope = 'all' }) => {
  const [activeTab, setActiveTab] = useState<'backend' | 'frontend'>('frontend');
  const resolvedTab = scope === 'all' ? activeTab : scope;
  const [categories, setCategories] = useState<DisplayCategory[]>(MOCK_DATA);
  const [backendCategories, setBackendCategories] = useState<BackendCategory[]>(MOCK_BACKEND_DATA);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
  const [backendExpandedIds, setBackendExpandedIds] = useState<Set<string>>(new Set(['backend-1', 'backend-2']));
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryCodeInput, setCategoryCodeInput] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [backendCategoryNameInput, setBackendCategoryNameInput] = useState('');
  const [backendCategoryCodeInput, setBackendCategoryCodeInput] = useState('');
  const [backendCategoryName, setBackendCategoryName] = useState('');
  const [backendCategoryCode, setBackendCategoryCode] = useState('');
  const [showColumnPanel, setShowColumnPanel] = useState(false);
  const [columnKeyword, setColumnKeyword] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Record<CategoryColumnKey, boolean>>(DEFAULT_VISIBLE_COLUMNS);
  const [editingRootId, setEditingRootId] = useState<string | null>(null);
  const [editingSecondCategory, setEditingSecondCategory] = useState<SecondaryCategoryEditorDraft | null>(null);
  const [showAliasExample, setShowAliasExample] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortDraftRows, setSortDraftRows] = useState<CategorySortDraftRow[]>([]);
  const [showSortSyncModal, setShowSortSyncModal] = useState(false);
  const [sortSyncMode, setSortSyncMode] = useState<SortSyncMode>('immediate');
  const [showCategoryDispatchModal, setShowCategoryDispatchModal] = useState(false);
  const [categoryDispatchMode, setCategoryDispatchMode] = useState<SortSyncMode>('immediate');
  const [productViewer, setProductViewer] = useState<{ categoryName: string; products: LinkedProduct[] } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ mode: 'confirm' | 'blocked'; categoryId: string; categoryName: string; isChild: boolean } | null>(null);
  const [linkedProductKeyword, setLinkedProductKeyword] = useState('');
  const [linkDialog, setLinkDialog] = useState<{ source: 'frontend' | 'backend'; categoryId: string; categoryName: string; selectedIds: string[] } | null>(null);
  const [unlinkDialog, setUnlinkDialog] = useState<{ source: 'frontend' | 'backend'; categoryId: string; categoryName: string; products: LinkedProduct[]; selectedIds: string[]; keyword: string } | null>(null);
  const [unlinkResultDialog, setUnlinkResultDialog] = useState<{ source: 'frontend' | 'backend'; categoryId: string; categoryName: string; removed: LinkedProduct[]; blocked: LinkedProduct[] } | null>(null);
  const [productCategoryEditor, setProductCategoryEditor] = useState<{ source: 'frontend' | 'backend'; product: LinkedProduct; selectedCategoryIds: string[] } | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>(createRootDraft(MOCK_DATA.length + 1));
  const [backendEditor, setBackendEditor] = useState<{
    mode: 'create' | 'edit';
    categoryId?: string;
    parentId?: string | null;
    parentName?: string;
    name: string;
    code: string;
  } | null>(null);
  const [backendDeleteTarget, setBackendDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const visibleColumnDefs = COLUMN_DEFS.filter(def => visibleColumns[def.key]);
  const tableGridStyle = {
    gridTemplateColumns: `${visibleColumnDefs.map(def => def.width).join(' ')} ${ACTION_COLUMN_WIDTH}`,
  };

  const leafCategoryOptions = useMemo(() => collectLeafCategories(categories), [categories]);
  const backendLeafCategoryOptions = useMemo(() => collectBackendLeafCategories(backendCategories), [backendCategories]);
  const filteredBackendCategories = useMemo(() => {
    const trimName = backendCategoryName.trim().toLowerCase();
    const trimCode = backendCategoryCode.trim().toLowerCase();
    if (!trimName && !trimCode) return backendCategories;

    const filterTree = (items: BackendCategory[]): BackendCategory[] =>
      items.reduce<BackendCategory[]>((acc, item) => {
        const matchedChildren = item.children ? filterTree(item.children) : undefined;
        const matchName = !trimName || item.name.toLowerCase().includes(trimName);
        const matchCode = !trimCode || item.code.toLowerCase().includes(trimCode);
        if ((matchName && matchCode) || (matchedChildren && matchedChildren.length)) {
          acc.push({ ...item, children: matchedChildren });
        }
        return acc;
      }, []);

    return filterTree(backendCategories);
  }, [backendCategories, backendCategoryCode, backendCategoryName]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBackendExpand = (id: string) => {
    setBackendExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateRoot = () => {
    setEditingRootId('new');
    setFormState(createRootDraft(categories.length + 1));
  };

  const handleCreateBackendRoot = () => {
    setBackendEditor({
      mode: 'create',
      parentId: null,
      name: '',
      code: '',
    });
  };

  const handleCreateBackendChild = (category: BackendCategory) => {
    setBackendEditor({
      mode: 'create',
      parentId: category.id,
      parentName: category.name,
      name: '',
      code: '',
    });
  };

  const handleEditBackendCategory = (category: BackendCategory) => {
    setBackendEditor({
      mode: 'edit',
      categoryId: category.id,
      name: category.name,
      code: category.code,
    });
  };

  const handleEditCategory = (category: DisplayCategory) => {
    if (category.parentId) {
      const parent = categories.find(item => item.id === category.parentId);
      setEditingSecondCategory({
        id: category.id,
        parentId: category.parentId,
        parentName: parent?.name || '',
        name: category.name,
        alias: category.alias,
        sort: category.sort,
      });
      return;
    }

    setEditingRootId(category.id);
    setFormState(createRootDraftFromCategory(category));
  };

  const handleCreateSub = (parent: DisplayCategory) => {
    setEditingSecondCategory({
      parentId: parent.id,
      parentName: parent.name,
      name: '',
      alias: '',
      sort: (parent.children?.length || 0) + 1,
    });
  };

  const handleSaveRoot = () => {
    if (!editingRootId) return;

    if (editingRootId === 'new') {
      const nextRoot: DisplayCategory = {
        id: `root-${Date.now()}`,
        name: formState.name.trim() || '未命名分类',
        alias: formState.alias.trim(),
        code: formState.code.trim() || '-',
        sort: formState.sort,
        iconText: formState.iconText.trim() || (formState.name.trim().slice(0, 1) || '图'),
        tag: formState.tag.trim(),
        requiredGroup: formState.requiredGroup,
        displaySettings: formState.displaySettings,
        saleScopes: [],
        saleTypes: [],
        remark: formState.remark.trim(),
        productCount: 0,
        linkedProducts: [],
        children: [],
        sourceType: 'brand',
        sourceName: '品牌',
      };
      setCategories(prev => normalizeLinkedProductCounts(sortCategories([...prev, nextRoot])));
    } else {
      setCategories(prev => normalizeLinkedProductCounts(sortCategories(prev.map(item => item.id === editingRootId ? {
        ...item,
        name: formState.name.trim() || item.name,
        alias: formState.alias.trim(),
        code: formState.code.trim() || '-',
        sort: formState.sort,
        iconText: formState.iconText.trim() || (formState.name.trim().slice(0, 1) || item.iconText),
        tag: formState.tag.trim(),
        requiredGroup: formState.requiredGroup,
        displaySettings: formState.displaySettings,
        remark: formState.remark.trim(),
      } : item))));
    }

    setEditingRootId(null);
  };

  const handleSaveSecondCategory = () => {
    if (!editingSecondCategory) return;
    const existingChild = editingSecondCategory.id ? findChildCategory(categories, editingSecondCategory.id) : null;
    const parentCategory = categories.find(item => item.id === editingSecondCategory.parentId);
    const childPayload: DisplayCategory = {
      id: editingSecondCategory.id || `child-${Date.now()}`,
      parentId: editingSecondCategory.parentId,
      name: editingSecondCategory.name.trim() || '未命名二级分类',
      alias: editingSecondCategory.alias.trim(),
      code: '-',
      sort: editingSecondCategory.sort,
      iconText: '',
      tag: '',
      requiredGroup: false,
      displaySettings: [],
      saleScopes: [],
      saleTypes: [],
      remark: '',
      productCount: existingChild?.productCount || 0,
      linkedProducts: existingChild?.linkedProducts || [],
      sourceType: existingChild?.sourceType || parentCategory?.sourceType || 'brand',
      sourceName: existingChild?.sourceName || parentCategory?.sourceName || '品牌',
    };

    setCategories(prev => {
      const removed = prev.map(item => ({
        ...item,
        children: (item.children || []).filter(child => child.id !== childPayload.id),
      }));

      const appended = removed.map(item => item.id === editingSecondCategory.parentId ? {
        ...item,
        children: sortCategories([...(item.children || []), childPayload]),
      } : item);

      return normalizeLinkedProductCounts(sortCategories(appended));
    });

    setExpandedIds(prev => new Set([...prev, editingSecondCategory.parentId]));
    setEditingSecondCategory(null);
  };

  const handleSaveBackendCategory = () => {
    if (!backendEditor) return;

    if (backendEditor.mode === 'edit' && backendEditor.categoryId) {
      setBackendCategories(prev =>
        updateBackendCategoryTree(prev, backendEditor.categoryId!, item => ({
          ...item,
          name: backendEditor.name.trim() || item.name,
          code: backendEditor.code.trim(),
        }))
      );
      setBackendEditor(null);
      return;
    }

    const nextCategory: BackendCategory = {
      id: `backend-${Date.now()}`,
      name: backendEditor.name.trim() || '未命名分类',
      code: backendEditor.code.trim(),
      sort: 1,
      productCount: 0,
      linkedProducts: [],
      children: [],
    };

    if (!backendEditor.parentId) {
      setBackendCategories(prev =>
        sortBackendCategories([
          ...prev,
          { ...nextCategory, sort: prev.length + 1 },
        ])
      );
      setBackendEditor(null);
      return;
    }

    setBackendCategories(prev =>
      updateBackendCategoryTree(prev, backendEditor.parentId!, item => {
        const nextChildren = [...(item.children || []), { ...nextCategory, sort: (item.children?.length || 0) + 1 }];
        return { ...item, children: nextChildren };
      })
    );
    setBackendExpandedIds(prev => new Set([...prev, backendEditor.parentId!]));
    setBackendEditor(null);
  };

  const handleDeleteBackendCategory = (category: BackendCategory) => {
    setBackendDeleteTarget({ id: category.id, name: category.name });
  };

  const confirmDeleteBackendCategory = () => {
    if (!backendDeleteTarget) return;
    setBackendCategories(prev => removeBackendCategoryTree(prev, backendDeleteTarget.id));
    setBackendDeleteTarget(null);
  };

  const updateBackendCategorySort = (categoryId: string, nextSort: number) => {
    setBackendCategories(prev =>
      updateBackendCategoryTree(prev, categoryId, item => ({
        ...item,
        sort: Math.max(1, nextSort),
      }))
    );
  };

  const handleSearchFrontendCategories = () => {
    setCategoryName(categoryNameInput.trim());
    setCategoryCode(categoryCodeInput.trim());
  };

  const handleResetFrontendCategories = () => {
    setCategoryNameInput('');
    setCategoryCodeInput('');
    setCategoryName('');
    setCategoryCode('');
  };

  const handleSearchBackendCategories = () => {
    setBackendCategoryName(backendCategoryNameInput.trim());
    setBackendCategoryCode(backendCategoryCodeInput.trim());
  };

  const handleResetBackendCategories = () => {
    setBackendCategoryNameInput('');
    setBackendCategoryCodeInput('');
    setBackendCategoryName('');
    setBackendCategoryCode('');
  };

  const openSortModal = () => {
    setSortDraftRows(sortCategories(categories).map(item => ({ id: item.id, name: item.name, sort: item.sort })));
    setShowSortModal(true);
  };

  const updateSortDraftRow = (rowId: string, nextSort: number) => {
    const currentRows = [...sortDraftRows];
    const currentIndex = currentRows.findIndex(item => item.id === rowId);
    const targetIndex = nextSort - 1;
    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= currentRows.length) return;
    const [moved] = currentRows.splice(currentIndex, 1);
    currentRows.splice(targetIndex, 0, moved);
    setSortDraftRows(currentRows.map((item, index) => ({ ...item, sort: index + 1 })));
  };

  const moveSortDraftRow = (dragId: string, targetId: string) => {
    const currentRows = [...sortDraftRows];
    const dragIndex = currentRows.findIndex(item => item.id === dragId);
    const targetIndex = currentRows.findIndex(item => item.id === targetId);
    if (dragIndex === -1 || targetIndex === -1 || dragIndex === targetIndex) return;
    const [moved] = currentRows.splice(dragIndex, 1);
    currentRows.splice(targetIndex, 0, moved);
    setSortDraftRows(currentRows.map((item, index) => ({ ...item, sort: index + 1 })));
  };

  const applySortDraft = () => {
    const sortMap = new Map(sortDraftRows.map(item => [item.id, item.sort]));
    setCategories(prev => sortCategories(prev.map(item => ({ ...item, sort: sortMap.get(item.id) || item.sort }))));
  };

  const saveSortDraft = () => {
    applySortDraft();
    setShowSortModal(false);
  };

  const saveAndSyncSortDraft = () => {
    applySortDraft();
    setShowSortModal(false);
    setShowSortSyncModal(true);
  };

  const handleConfirmSortSync = () => {
    setShowSortSyncModal(false);
    setShowSortModal(false);
  };

  const handleOpenCategoryDispatchModal = () => {
    if (!editingRootId || editingRootId === 'new') return;
    setShowCategoryDispatchModal(true);
  };

  const handleConfirmCategoryDispatch = () => {
    setShowCategoryDispatchModal(false);
    handleSaveRoot();
  };

  const filteredCategories = useMemo(() => {
    const trimName = categoryName.trim().toLowerCase();
    const trimCode = categoryCode.trim().toLowerCase();
    if (!trimName && !trimCode) return categories;

    const filterTree = (items: DisplayCategory[]): DisplayCategory[] => {
      return items.reduce<DisplayCategory[]>((acc, item) => {
        const matchedChildren = item.children ? filterTree(item.children) : undefined;
        const matchName = !trimName || item.name.toLowerCase().includes(trimName);
        const matchCode = !trimCode || item.code.toLowerCase().includes(trimCode);
        if ((matchName && matchCode) || (matchedChildren && matchedChildren.length > 0)) {
          acc.push({ ...item, children: matchedChildren });
        }
        return acc;
      }, []);
    };

    return filterTree(categories);
  }, [categories, categoryCode, categoryName]);

  const renderTagList = (items: string[]) => {
    if (!items.length) return <span className="text-sm text-gray-400">-</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <div
            key={item}
            title={DISPLAY_CHANNEL_ICON_DEFS[item]?.label || item}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${DISPLAY_CHANNEL_ICON_DEFS[item]?.className || 'bg-[#F5F7FA] text-[#666]'}`}
          >
            {DISPLAY_CHANNEL_ICON_DEFS[item]?.shortLabel || item.slice(0, 2)}
          </div>
        ))}
      </div>
    );
  };

  const hasLinkedProductsRecursive = (category: DisplayCategory) => {
    if (category.linkedProducts?.length) return true;
    return (category.children || []).some(child => hasLinkedProductsRecursive(child));
  };

  const handleDeleteCategory = (category: DisplayCategory) => {
    const blocked = hasLinkedProductsRecursive(category);
    setDeleteDialog({
      mode: blocked ? 'blocked' : 'confirm',
      categoryId: category.id,
      categoryName: category.name,
      isChild: Boolean(category.parentId),
    });
  };

  const updateCategoryLinkedProducts = (categoryId: string, updater: (products: LinkedProduct[]) => LinkedProduct[]) => {
    const walk = (items: DisplayCategory[]): DisplayCategory[] =>
      items.map(item => {
        if (item.id === categoryId) {
          const nextProducts = updater(item.linkedProducts);
          return {
            ...item,
            linkedProducts: nextProducts,
            productCount: Math.max(0, nextProducts.length),
          };
        }
        return item.children?.length
          ? { ...item, children: walk(item.children) }
          : item;
      });

    setCategories(prev => normalizeLinkedProductCounts(walk(prev)));
  };

  const updateBackendCategoryLinkedProducts = (categoryId: string, updater: (products: LinkedProduct[]) => LinkedProduct[]) => {
    setBackendCategories(prev => normalizeBackendLinkedProductCounts(updateBackendCategoryLinkedProductsTree(prev, categoryId, updater)));
  };

  const handleOpenLinkDialog = (category: DisplayCategory) => {
    setLinkDialog({ source: 'frontend', categoryId: category.id, categoryName: category.name, selectedIds: [] });
  };

  const handleOpenBackendLinkDialog = (category: BackendCategory) => {
    setLinkDialog({ source: 'backend', categoryId: category.id, categoryName: category.name, selectedIds: [] });
  };

  const handleConfirmLinkDialog = () => {
    if (!linkDialog || !linkDialog.selectedIds.length) {
      setLinkDialog(null);
      return;
    }

    const applyUpdater = (currentProducts: LinkedProduct[]) => {
      const existingIds = new Set(currentProducts.map(product => product.id));
      const additions = LINKABLE_PRODUCTS_POOL.filter(product => linkDialog.selectedIds.includes(product.id) && !existingIds.has(product.id)).map(product => ({
        id: product.id,
        name: product.name,
        type: product.type,
        imageText: product.imageText,
        categoryCount: product.categoryCount,
      }));
      return [...currentProducts, ...additions];
    };

    if (linkDialog.source === 'frontend') {
      updateCategoryLinkedProducts(linkDialog.categoryId, applyUpdater);
    } else {
      updateBackendCategoryLinkedProducts(linkDialog.categoryId, applyUpdater);
    }

    setLinkDialog(null);
  };

  const handleOpenUnlinkDialog = (category: DisplayCategory) => {
    setUnlinkDialog({
      source: 'frontend',
      categoryId: category.id,
      categoryName: category.name,
      products: category.linkedProducts || [],
      selectedIds: [],
      keyword: '',
    });
  };

  const handleOpenBackendUnlinkDialog = (category: BackendCategory) => {
    setUnlinkDialog({
      source: 'backend',
      categoryId: category.id,
      categoryName: category.name,
      products: category.linkedProducts || [],
      selectedIds: [],
      keyword: '',
    });
  };

  const handleConfirmUnlinkDialog = () => {
    if (!unlinkDialog || !unlinkDialog.selectedIds.length) return;

    const selectedProducts = unlinkDialog.products.filter(product => unlinkDialog.selectedIds.includes(product.id));
    const blocked = selectedProducts.filter(product => (product.categoryCount || 1) <= 1);
    const removed = selectedProducts.filter(product => (product.categoryCount || 1) > 1);

    if (removed.length) {
      const updater = (currentProducts: LinkedProduct[]) => currentProducts.filter(product => !removed.some(item => item.id === product.id));
      if (unlinkDialog.source === 'frontend') {
        updateCategoryLinkedProducts(unlinkDialog.categoryId, updater);
      } else {
        updateBackendCategoryLinkedProducts(unlinkDialog.categoryId, updater);
      }
    }

    setUnlinkDialog(null);
    setUnlinkResultDialog({
      source: unlinkDialog.source,
      categoryId: unlinkDialog.categoryId,
      categoryName: unlinkDialog.categoryName,
      removed,
      blocked,
    });
  };

  const handleSaveProductCategoryEditor = () => {
    if (!productCategoryEditor) return;

    const selectedIds = new Set(productCategoryEditor.selectedCategoryIds);
    const targetProduct = productCategoryEditor.product;

    const walkFrontend = (items: DisplayCategory[]): DisplayCategory[] =>
      items.map(item => {
        const alreadyLinked = item.linkedProducts.some(product => product.id === targetProduct.id);
        const shouldLink = selectedIds.has(item.id);

        let nextItem: DisplayCategory = item;
        if (item.children?.length) {
          nextItem = { ...item, children: walkFrontend(item.children) };
        }

        if (!nextItem.children?.length) {
          if (shouldLink && !alreadyLinked) {
            const nextProducts = [
              ...nextItem.linkedProducts,
              {
                id: targetProduct.id,
                name: targetProduct.name,
                type: targetProduct.type,
                imageText: targetProduct.imageText,
                categoryCount: selectedIds.size,
              },
            ];
            return { ...nextItem, linkedProducts: nextProducts, productCount: nextProducts.length };
          }

          if (!shouldLink && alreadyLinked) {
            const nextProducts = nextItem.linkedProducts.filter(product => product.id !== targetProduct.id);
            return { ...nextItem, linkedProducts: nextProducts, productCount: nextProducts.length };
          }
        }

        return nextItem;
      });

    const walkBackend = (items: BackendCategory[]): BackendCategory[] =>
      items.map(item => {
        const alreadyLinked = item.linkedProducts.some(product => product.id === targetProduct.id);
        const shouldLink = selectedIds.has(item.id);

        let nextItem: BackendCategory = item;
        if (item.children?.length) {
          nextItem = { ...item, children: walkBackend(item.children) };
        }

        if (!nextItem.children?.length) {
          if (shouldLink && !alreadyLinked) {
            const nextProducts = [
              ...nextItem.linkedProducts,
              {
                id: targetProduct.id,
                name: targetProduct.name,
                type: targetProduct.type,
                imageText: targetProduct.imageText,
                categoryCount: selectedIds.size,
              },
            ];
            return { ...nextItem, linkedProducts: nextProducts, productCount: nextProducts.length };
          }

          if (!shouldLink && alreadyLinked) {
            const nextProducts = nextItem.linkedProducts.filter(product => product.id !== targetProduct.id);
            return { ...nextItem, linkedProducts: nextProducts, productCount: nextProducts.length };
          }
        }

        return nextItem;
      });

    if (productCategoryEditor.source === 'frontend') {
      setCategories(prev => normalizeLinkedProductCounts(walkFrontend(prev)));
    } else {
      setBackendCategories(prev => normalizeBackendLinkedProductCounts(walkBackend(prev)));
    }
    setProductCategoryEditor(null);
    setUnlinkResultDialog(null);
  };

  const confirmDeleteCategory = () => {
    if (!deleteDialog || deleteDialog.mode !== 'confirm') return;

    if (deleteDialog.isChild) {
      setCategories(prev =>
        sortCategories(
          prev.map(item => ({
            ...item,
            children: (item.children || []).filter(child => child.id !== deleteDialog.categoryId),
          }))
        )
      );
    } else {
      setCategories(prev => sortCategories(prev.filter(item => item.id !== deleteDialog.categoryId)));
    }

    setDeleteDialog(null);
  };

  const renderRow = (cat: DisplayCategory, level = 0) => {
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = !!cat.children?.length;
    const isChild = level > 0;
    const isLeafCategory = !hasChildren;

    return (
      <React.Fragment key={cat.id}>
        <div className="grid items-center border-b border-gray-100 py-3 transition-colors hover:bg-gray-50 group" style={tableGridStyle}>
          {visibleColumns.sort && (
            <div className="pl-4 pr-3">
              <div className="flex items-center text-sm text-gray-600">
                <div style={{ width: level * 18 }} className="shrink-0" />
                {hasChildren ? (
                  <button onClick={() => toggleExpand(cat.id)} className="shrink-0 text-gray-400 hover:text-[#00C06B]">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <div className="w-4 shrink-0" />
                )}
                <span className="ml-3">{cat.sort}</span>
              </div>
            </div>
          )}
          {visibleColumns.icon && (
            <div className="px-2">
              {isChild ? (
                <span className="text-sm text-gray-300">-</span>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDF4] text-sm font-black text-[#00C06B]">
                  {cat.iconText}
                </div>
              )}
            </div>
          )}
          {visibleColumns.name && (
            <div className="pr-3">
              <div className="flex min-w-0 items-center">
                <span className="min-w-0 truncate text-sm font-bold text-gray-800">{cat.name}</span>
                {cat.sourceType === 'store' && (
                  <span className="ml-2 shrink-0 rounded-full border border-[#DDEEE4] bg-[#F7FFF9] px-2 py-0.5 text-[10px] font-bold leading-4 text-[#16A34A]">
                    门店自建
                  </span>
                )}
              </div>
            </div>
          )}
          {visibleColumns.alias && <div className="truncate pr-3 text-sm text-gray-600">{cat.alias || '-'}</div>}
          {visibleColumns.code && <div className="pr-3 text-sm text-gray-600 truncate">{isChild ? '-' : cat.code}</div>}
          {visibleColumns.tag && (
            <div className="pr-3">{!isChild && cat.tag ? <span className="inline-flex rounded-full bg-[#FFF7ED] px-2 py-1 text-[11px] font-bold text-[#EA580C]">{cat.tag}</span> : <span className="text-sm text-gray-400">-</span>}</div>
          )}
          {visibleColumns.displaySettings && <div className="pr-3">{isChild ? <span className="text-sm text-gray-300">-</span> : renderTagList(cat.displaySettings)}</div>}
          {visibleColumns.linkedProducts && (
            <div className="pr-3">
              <button
                onClick={() => {
                  setLinkedProductKeyword('');
                  setProductViewer({ categoryName: cat.name, products: cat.linkedProducts || [] });
                }}
                className="text-sm font-medium text-[#00C06B] hover:text-[#00A35B] hover:underline"
              >
                {(cat.linkedProducts || []).length} 个
              </button>
            </div>
          )}
          {visibleColumns.requiredGroup && <div className="pr-3 text-sm text-gray-600">{isChild ? '-' : (cat.requiredGroup ? '是' : '否')}</div>}
          {visibleColumns.remark && <div className="pr-4 text-sm text-gray-600 break-all">{isChild ? '-' : (cat.remark || '-')}</div>}
          {visibleColumns.source && <div className="pr-4 text-sm text-gray-600 truncate">{cat.sourceName}</div>}
          <div className="sticky right-0 z-20 flex h-full w-[280px] items-center justify-start gap-3 border-l border-gray-100 bg-white px-4 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.2)] transition-colors group-hover:z-40 group-hover:bg-gray-50">
            {!isChild && (
              <button onClick={() => handleCreateSub(cat)} className="shrink-0 whitespace-nowrap text-sm font-bold text-[#00C06B] hover:text-[#00A35B]">新建二级分类</button>
            )}
            <button onClick={() => handleEditCategory(cat)} className="shrink-0 whitespace-nowrap text-sm font-bold text-[#00C06B] hover:text-[#00A35B]">编辑</button>
            <button onClick={() => handleDeleteCategory(cat)} className="shrink-0 whitespace-nowrap text-sm font-bold text-[#FF4D4F] hover:text-[#D9363E]">删除</button>
            {isLeafCategory && (
              <details className="group/more relative ml-auto shrink-0">
                <summary className="cursor-pointer list-none whitespace-nowrap rounded-md px-1 text-sm font-bold text-[#00C06B] transition-colors hover:bg-[#F5FBF7] hover:text-[#00A35B]">更多</summary>
                <div className="absolute right-0 top-full z-[80] mt-2 w-[112px] overflow-hidden rounded-xl border border-[#E8EDF3] bg-white py-2 shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
                  <button onClick={() => handleOpenLinkDialog(cat)} className="block w-full whitespace-nowrap px-4 py-2 text-left text-sm text-[#333] hover:bg-[#F5FBF7] hover:text-[#00A35B]">关联商品</button>
                  <button onClick={() => handleOpenUnlinkDialog(cat)} className="block w-full whitespace-nowrap px-4 py-2 text-left text-sm text-[#333] hover:bg-[#F5FBF7] hover:text-[#00A35B]">解除关联</button>
                </div>
              </details>
            )}
          </div>
        </div>
        {isExpanded && cat.children?.map(sub => renderRow(sub, level + 1))}
      </React.Fragment>
    );
  };

  const renderBackendRow = (category: BackendCategory, level = 0) => {
    const hasChildren = Boolean(category.children?.length);
    const isExpanded = backendExpandedIds.has(category.id);

    return (
      <React.Fragment key={category.id}>
        <div className="grid grid-cols-[180px_minmax(0,1fr)_220px_120px_340px] items-center border-b border-gray-100 py-3 transition-colors hover:bg-gray-50">
          <div className="pl-4 pr-3">
            <div className="flex items-center gap-3">
              <div style={{ width: level * 18 }} className="shrink-0" />
              {hasChildren ? (
                <button onClick={() => toggleBackendExpand(category.id)} className="shrink-0 text-gray-400 hover:text-[#00C06B]">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <div className="w-4 shrink-0" />
              )}
              <input
                value={category.sort}
                onChange={e => updateBackendCategorySort(category.id, Number(e.target.value.replace(/\D/g, '') || '1'))}
                className="h-8 w-[88px] rounded-lg border border-[#E5E7EB] bg-white px-3 text-center text-sm text-[#333] outline-none focus:border-[#00C06B]"
              />
            </div>
          </div>
          <div className="pr-3 text-sm font-medium text-[#1F2129]">{category.name}</div>
          <div className="pr-3 text-sm text-[#5B6475]">{category.code || '-'}</div>
          <div className="pr-3">
            {!hasChildren ? (
              <button
                onClick={() => {
                  setLinkedProductKeyword('');
                  setProductViewer({ categoryName: category.name, products: category.linkedProducts || [] });
                }}
                className="text-sm font-medium text-[#00C06B] hover:text-[#00A35B] hover:underline"
              >
                {(category.linkedProducts || []).length} 个
              </button>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
          <div className="flex items-center gap-4 pr-4 text-sm font-bold">
            <button onClick={() => handleCreateBackendChild(category)} className="whitespace-nowrap text-[#00C06B] hover:text-[#00A35B]">新增子分类</button>
            {!hasChildren && (
              <>
                <button onClick={() => handleOpenBackendLinkDialog(category)} className="whitespace-nowrap text-[#00C06B] hover:text-[#00A35B]">关联商品</button>
                <button onClick={() => handleOpenBackendUnlinkDialog(category)} className="whitespace-nowrap text-[#00C06B] hover:text-[#00A35B]">解除关联</button>
              </>
            )}
            <button onClick={() => handleEditBackendCategory(category)} className="whitespace-nowrap text-[#00C06B] hover:text-[#00A35B]">编辑</button>
            <button onClick={() => handleDeleteBackendCategory(category)} className="whitespace-nowrap text-[#FF4D4F] hover:text-[#D9363E]">删除</button>
          </div>
        </div>
        {isExpanded && category.children?.map(child => renderBackendRow(child, level + 1))}
      </React.Fragment>
    );
  };

  if (editingRootId) {
    const editingCategory = editingRootId === 'new' ? null : categories.find(item => item.id === editingRootId) || null;

    return (
    <div className="pc-page flex min-w-0 flex-1 bg-[#F0F2F5] p-3 font-sans">
      <div className="pc-surface flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="shrink-0 border-b border-[#E8E8E8] bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setEditingRootId(null)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E8E8E8] text-[#666] transition-colors hover:border-[#00C06B] hover:text-[#00C06B]">
                  <ArrowLeft size={16} />
                </button>
                <div className="text-lg font-bold text-[#1F2129]">{editingRootId === 'new' ? '新增分类' : '编辑分类'}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditingRootId(null)} className="rounded-lg border border-[#E8E8E8] px-5 py-2 text-sm text-[#333] hover:bg-gray-50">取消</button>
                {editingRootId === 'new' ? (
                  <button onClick={handleSaveRoot} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">保存</button>
                ) : (
                  <>
                    <button onClick={handleSaveRoot} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">保存并返回列表</button>
                    <button onClick={handleOpenCategoryDispatchModal} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">保存并下发至门店</button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-[#F8FAFB] px-6 py-6">
            <div className="rounded-2xl border border-[#E8E8E8] bg-white p-6">
              <div className="space-y-8">
                <div>
                  <div className="mb-5 text-lg font-bold text-[#1F2129]">基础信息</div>
                  <div className="grid grid-cols-[440px_minmax(0,1fr)] gap-10">
                    <div className="space-y-4">
                      <div className="grid grid-cols-[88px_1fr] items-start gap-4">
                        <div className="pt-2 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>分类名称</div>
                        <div>
                          <input value={formState.name} onChange={e => setFormState(prev => ({ ...prev, name: e.target.value.slice(0, 10) }))} className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm focus:border-[#00C06B] focus:outline-none" />
                          <div className="mt-1 text-right text-xs text-[#999]">{formState.name.length}/10</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-4">
                        <div className="pt-2 text-sm text-[#333]">分类别名</div>
                        <div>
                          <div className="relative">
                            <input
                              value={formState.alias}
                              placeholder="请输入分类别名"
                              maxLength={10}
                              onChange={e => setFormState(prev => ({ ...prev, alias: e.target.value.slice(0, 10) }))}
                              className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 pr-14 text-sm focus:border-[#00C06B] focus:outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999]">{formState.alias.length}/10</div>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-[#999]">
                            <span>用于补充说明分类，配置后将在小程序分类名称下方默认展示</span>
                            <button type="button" onClick={() => setShowAliasExample(true)} className="shrink-0 font-bold text-[#00A35B] hover:text-[#008F50]">查看示例</button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-4">
                        <div className="pt-2 text-sm text-[#333]">分类标识</div>
                        <div>
                          <input value={formState.code} onChange={e => setFormState(prev => ({ ...prev, code: e.target.value.slice(0, 40) }))} className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm focus:border-[#00C06B] focus:outline-none" />
                          <div className="mt-1 text-xs text-[#999]">用于外部对接的分类标识码</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-4">
                        <div className="pt-2 text-sm text-[#333]">分类标签</div>
                        <select value={formState.tag} onChange={e => setFormState(prev => ({ ...prev, tag: e.target.value }))} className="h-10 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm focus:border-[#00C06B] focus:outline-none">
                          <option value="">请选择</option>
                          <option value="热销">热销</option>
                          <option value="推荐">推荐</option>
                          <option value="新品">新品</option>
                          <option value="活动">活动</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-4">
                        <div className="pt-2 text-sm text-[#333]">分类备注</div>
                        <div>
                          <input value={formState.remark} onChange={e => setFormState(prev => ({ ...prev, remark: e.target.value.slice(0, 10) }))} className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm focus:border-[#00C06B] focus:outline-none" />
                          <div className="mt-1 text-xs text-[#999]">用于分类特殊信息备注，不会再小程序端展示</div>
                          <div className="mt-1 text-right text-xs text-[#999]">{formState.remark.length}/10</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-4">
                        <div className="pt-2 text-sm text-[#333]">图标</div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setFormState(prev => ({ ...prev, iconUploaded: !prev.iconUploaded }))}
                            className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#D9DDE7] bg-[#FAFBFC] text-2xl text-[#666]"
                          >
                            {formState.iconUploaded ? (
                              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#DDF5E6,#BFECCD)] text-sm font-bold text-[#00A35B]">
                                图标
                              </div>
                            ) : (
                              '+'
                            )}
                          </button>
                          <div className="mt-2 text-xs text-[#999]">备注：建议图标尺寸：180px * 180px</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-4">
                        <div className="pt-2 text-sm text-[#333]">分类banner</div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setFormState(prev => ({ ...prev, bannerUploaded: !prev.bannerUploaded }))}
                            className="flex h-[88px] w-[220px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#D9DDE7] bg-[#FAFBFC] text-2xl text-[#666]"
                          >
                            {formState.bannerUploaded ? (
                              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(90deg,#E6FFF1,#C8F2DB,#DFF5FF)] text-sm font-bold text-[#00A35B]">
                                Banner
                              </div>
                            ) : (
                              '+'
                            )}
                          </button>
                          <div className="mt-2 text-xs text-[#999]">备注：建议图标尺寸：580px * 120px</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-4">
                        <div className="pt-2 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>排序</div>
                        <div className="flex w-fit items-center overflow-hidden rounded-lg border border-[#E8E8E8]">
                          <button type="button" onClick={() => setFormState(prev => ({ ...prev, sort: Math.max(1, prev.sort - 1) }))} className="flex h-10 w-10 items-center justify-center border-r border-[#E8E8E8] bg-[#F8FAFB] text-[#666] hover:bg-gray-100"><Minus size={14} /></button>
                          <input value={formState.sort} onChange={e => setFormState(prev => ({ ...prev, sort: Math.max(1, Number(e.target.value.replace(/\D/g, '') || '1')) }))} className="h-10 w-20 text-center text-sm outline-none" />
                          <button type="button" onClick={() => setFormState(prev => ({ ...prev, sort: prev.sort + 1 }))} className="flex h-10 w-10 items-center justify-center border-l border-[#E8E8E8] bg-[#F8FAFB] text-[#666] hover:bg-gray-100"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-4 text-lg font-bold text-[#1F2129]">小程序端预览</div>
                      <div className="rounded-2xl bg-[#F6F7FB] p-5">
                        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-4">
                          <div className="space-y-3">
                            <div className="relative flex h-[92px] items-end rounded-2xl bg-white/70 p-3 shadow-sm">
                              {formState.tag && (
                                <span className="absolute right-3 top-3 rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-bold text-[#EA580C]">
                                  {formState.tag}
                                </span>
                              )}
                              <div>
                                {formState.iconUploaded && (
                                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#DDF5E6,#BFECCD)] text-[11px] font-bold text-[#00A35B]">
                                    图标
                                  </div>
                                )}
                                <div className="text-xs text-[#333]">{formState.name || '分类名称'}</div>
                                {formState.alias && <div className="mt-0.5 truncate text-[10px] text-[#98A2B3]">{formState.alias}</div>}
                              </div>
                            </div>
                            <div className="h-[92px] rounded-2xl bg-white/45" />
                            <div className="h-[92px] rounded-2xl bg-white/45" />
                          </div>
                          <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <div className="mb-4">
                              <div className="text-xl font-black text-[#1F2129]">{formState.name || '分类名称'}</div>
                              {formState.alias && <div className="mt-1 text-sm text-[#98A2B3]">{formState.alias}</div>}
                            </div>
                            {formState.bannerUploaded && (
                              <div className="mb-4 overflow-hidden rounded-[14px]">
                                <div className="aspect-[29/6] w-full bg-[linear-gradient(90deg,#E6FFF1,#C8F2DB,#DFF5FF)]" />
                              </div>
                            )}
                            <div className="space-y-4">
                              <div className="h-[54px] rounded-2xl bg-[#F7F8FA]" />
                              <div className="h-[54px] rounded-2xl bg-[#F7F8FA]" />
                              <div className="h-[54px] rounded-2xl bg-[#F7F8FA]" />
                              <div className="h-[54px] rounded-2xl bg-[#F7F8FA]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-5 text-lg font-bold text-[#1F2129]">分类设置</div>
                  <div className="space-y-5">
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="pt-1 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>展示渠道</div>
                      <div className="flex flex-wrap gap-6 rounded-xl bg-[#F7F8FA] px-5 py-4">
                        {DISPLAY_SETTING_OPTIONS.map(option => (
                          <label key={option.id} className={`flex items-center text-sm ${formState.displaySettings.includes(option.label) ? 'text-[#00B96B]' : 'text-[#999]'}`}>
                            <input
                              type="checkbox"
                              checked={formState.displaySettings.includes(option.label)}
                              onChange={e => setFormState(prev => ({
                                ...prev,
                                displaySettings: e.target.checked
                                  ? [...prev.displaySettings, option.label]
                                  : prev.displaySettings.filter(item => item !== option.label),
                              }))}
                              className="mr-2 h-4 w-4 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="pt-1 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>上架时间</div>
                      <div className="flex items-center gap-8 py-2 text-sm">
                        <label className="flex items-center text-[#00B96B]"><input type="radio" checked={formState.shelfTime === 'all_day'} onChange={() => setFormState(prev => ({ ...prev, shelfTime: 'all_day' }))} className="mr-2 h-4 w-4 accent-[#00C06B]" />全时段售卖</label>
                        <label className="flex items-center text-[#666]"><input type="radio" checked={formState.shelfTime === 'custom'} onChange={() => setFormState(prev => ({ ...prev, shelfTime: 'custom' }))} className="mr-2 h-4 w-4 accent-[#00C06B]" />自定义时间</label>
                      </div>
                    </div>
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="pt-1 text-sm text-[#333]">限时置顶</div>
                      <div>
                        <button onClick={() => setFormState(prev => ({ ...prev, limitTop: !prev.limitTop }))} className={`relative h-7 w-12 rounded-full transition-colors ${formState.limitTop ? 'bg-[#00C06B]' : 'bg-[#D9DDE7]'}`}>
                          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${formState.limitTop ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                    {formState.limitTop && (
                      <div className="grid grid-cols-[88px_1fr] gap-3">
                        <div />
                        <div className="rounded-xl bg-[#F7F8FA] px-5 py-4 text-sm text-[#666]">
                          <div className="grid grid-cols-[220px_24px_220px_auto] items-center gap-3">
                            <input className="h-10 rounded-lg border border-[#E8E8E8] bg-white px-3" placeholder="开始时间" />
                            <span className="text-center">-</span>
                            <input className="h-10 rounded-lg border border-[#E8E8E8] bg-white px-3" placeholder="结束时间" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="pt-1 text-sm text-[#333]">更多设置</div>
                      <div className="rounded-xl bg-[#F7F8FA] px-5 py-4 text-sm">
                        <div className="space-y-5">
                          <div className="space-y-1">
                            <label className="flex max-w-[280px] items-center justify-between"><span>仅在后台展示此分组</span><input type="checkbox" checked={formState.onlyBackstageGroup} onChange={e => setFormState(prev => ({ ...prev, onlyBackstageGroup: e.target.checked }))} className="h-5 w-9 rounded-full border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" /></label>
                            <div className="max-w-[680px] text-xs leading-5 text-[#98A2B3]">开启后该分类及该分类下的商品仅在后台展示，小程序及 POS 等点单页面不展示此分类</div>
                          </div>
                          <div className="space-y-1">
                            <label className="flex max-w-[280px] items-center justify-between"><span>经典菜单隐藏</span><input type="checkbox" checked={formState.classicMenuHidden} onChange={e => setFormState(prev => ({ ...prev, classicMenuHidden: e.target.checked }))} className="h-5 w-9 rounded-full border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" /></label>
                            <div className="max-w-[680px] text-xs leading-5 text-[#98A2B3]">开启后该分类及该分类下的商品不在小程序经典菜单隐藏，商品推荐等横向菜单可正常展示</div>
                          </div>
                          <div className="space-y-1">
                            <label className="flex max-w-[280px] items-center justify-between"><span>必选分组</span><input type="checkbox" checked={formState.requiredGroup} onChange={e => setFormState(prev => ({ ...prev, requiredGroup: e.target.checked }))} className="h-5 w-9 rounded-full border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" /></label>
                            <div className="max-w-[680px] text-xs leading-5 text-[#98A2B3]">开启后用户下单时必须有选购该分类下的某个商品，否则不可下单</div>
                          </div>
                          {formState.requiredGroup && (
                            <div className="space-y-3 rounded-xl bg-white px-4 py-4">
                              <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm text-[#00B96B]">
                                  <input
                                    type="checkbox"
                                    checked={formState.requiredGroupDineIn}
                                    onChange={e => setFormState(prev => ({ ...prev, requiredGroupDineIn: e.target.checked }))}
                                    className="h-4 w-4 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]"
                                  />
                                  堂食必选
                                </label>
                                <span className="text-sm text-[#666]">设置购买上限：</span>
                                <div className="inline-flex overflow-hidden rounded-lg border border-[#D9DDE7]">
                                  <button
                                    type="button"
                                    onClick={() => setFormState(prev => ({ ...prev, requiredGroupDineInLimit: Math.max(0, prev.requiredGroupDineInLimit - 1) }))}
                                    className="flex h-10 w-10 items-center justify-center border-r border-[#D9DDE7] bg-[#F8FAFB] text-[#98A2B3]"
                                  >
                                    -
                                  </button>
                                  <div className="flex h-10 w-16 items-center justify-center text-sm text-[#1F2129]">{formState.requiredGroupDineInLimit}</div>
                                  <button
                                    type="button"
                                    onClick={() => setFormState(prev => ({ ...prev, requiredGroupDineInLimit: prev.requiredGroupDineInLimit + 1 }))}
                                    className="flex h-10 w-10 items-center justify-center border-l border-[#D9DDE7] bg-[#F8FAFB] text-[#5B6475]"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm text-[#666]">
                                  <input
                                    type="checkbox"
                                    checked={formState.requiredGroupTakeout}
                                    onChange={e => setFormState(prev => ({ ...prev, requiredGroupTakeout: e.target.checked }))}
                                    className="h-4 w-4 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]"
                                  />
                                  外卖必选
                                </label>
                                <span className="text-sm text-[#666]">设置购买上限：</span>
                                <div className="inline-flex overflow-hidden rounded-lg border border-[#D9DDE7]">
                                  <button
                                    type="button"
                                    onClick={() => setFormState(prev => ({ ...prev, requiredGroupTakeoutLimit: Math.max(0, prev.requiredGroupTakeoutLimit - 1) }))}
                                    className="flex h-10 w-10 items-center justify-center border-r border-[#D9DDE7] bg-[#F8FAFB] text-[#98A2B3]"
                                  >
                                    -
                                  </button>
                                  <div className="flex h-10 w-16 items-center justify-center text-sm text-[#1F2129]">{formState.requiredGroupTakeoutLimit}</div>
                                  <button
                                    type="button"
                                    onClick={() => setFormState(prev => ({ ...prev, requiredGroupTakeoutLimit: prev.requiredGroupTakeoutLimit + 1 }))}
                                    className="flex h-10 w-10 items-center justify-center border-l border-[#D9DDE7] bg-[#F8FAFB] text-[#5B6475]"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="font-medium text-[#333]">不可单独下单</div>
                            <div className="flex items-center gap-8">
                              <label className="flex items-center text-[#00B96B]">
                                <input
                                  type="radio"
                                  checked={formState.standaloneOrderSetting === 'disabled'}
                                  onChange={() => setFormState(prev => ({ ...prev, standaloneOrderSetting: 'disabled' }))}
                                  className="mr-2 h-4 w-4 accent-[#00C06B]"
                                />
                                不启用
                              </label>
                              <label className="flex items-center text-[#666]">
                                <input
                                  type="radio"
                                  checked={formState.standaloneOrderSetting === 'enabled'}
                                  onChange={() => setFormState(prev => ({ ...prev, standaloneOrderSetting: 'enabled' }))}
                                  className="mr-2 h-4 w-4 accent-[#00C06B]"
                                />
                                启用
                              </label>
                            </div>
                            <div className="max-w-[680px] text-xs leading-5 text-[#98A2B3]">若启用，则小程序下单时选购的商品仅包含该分类的商品时，则不可下单</div>
                          </div>
                          <div className="space-y-2">
                            <div className="font-medium text-[#333]">排队取餐</div>
                            <div className="flex items-center gap-8">
                              <label className="flex items-center text-[#00B96B]"><input type="radio" checked={formState.queueSetting === 'join'} onChange={() => setFormState(prev => ({ ...prev, queueSetting: 'join' }))} className="mr-2 h-4 w-4 accent-[#00C06B]" />进入排队</label>
                              <label className="flex items-center text-[#666]"><input type="radio" checked={formState.queueSetting === 'skip'} onChange={() => setFormState(prev => ({ ...prev, queueSetting: 'skip' }))} className="mr-2 h-4 w-4 accent-[#00C06B]" />不进入排队</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showAliasExample && <CategoryAliasExampleModal onClose={() => setShowAliasExample(false)} />}
      </div>
    );
  }

  return (
    <div className="m-4 flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      {scope === 'all' && (
        <div className="flex space-x-8 border-b border-gray-100 px-6 py-4">
          <button onClick={() => setActiveTab('frontend')} className={`-mb-4 border-b-2 pb-4 text-base font-bold transition-colors ${activeTab === 'frontend' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>前台分类</button>
          <button onClick={() => setActiveTab('backend')} className={`-mb-4 border-b-2 pb-4 text-base font-bold transition-colors ${activeTab === 'backend' ? 'border-[#00C06B] text-[#00C06B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>后台分类</button>
        </div>
      )}

      {resolvedTab === 'backend' ? (
        <>
          <div className="bg-orange-50/50 px-6 py-4 text-xs text-orange-600">
            <div className="flex items-center">
              <Info size={14} className="mr-2" />
              原商品类别，商品后台分类，用于店内部经营管理如数据统计等，不在前台展示
              <a href="#" className="ml-2 text-[#00C06B] hover:underline">查看帮助文档</a>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">分类名称</span>
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  type="text"
                  placeholder="请输入"
                  value={backendCategoryNameInput}
                  onChange={e => setBackendCategoryNameInput(e.target.value)}
                  className="h-10 w-[220px] rounded-lg border border-gray-200 bg-white pl-[72px] pr-10 text-sm outline-none transition-colors focus:border-[#00C06B]"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">分类标识</span>
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                <input
                  type="text"
                  placeholder="请输入"
                  value={backendCategoryCodeInput}
                  onChange={e => setBackendCategoryCodeInput(e.target.value)}
                  className="h-10 w-[220px] rounded-lg border border-gray-200 bg-white pl-[72px] pr-10 text-sm outline-none transition-colors focus:border-[#00C06B]"
                />
              </div>
              <button onClick={handleSearchBackendCategories} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#00A35B]">搜索</button>
              <button onClick={handleResetBackendCategories} className="rounded-lg border border-[#D9DDE7] bg-white px-5 py-2 text-sm font-bold text-[#5B6475] transition-colors hover:bg-gray-50">重置</button>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" disabled title="列显示已按当前分类类型固定" className="cursor-not-allowed rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-400">
                <ListFilter size={16} />
              </button>
              <button onClick={handleCreateBackendRoot} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#00A35B]">添加分类</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[180px_minmax(0,1fr)_220px_120px_340px] border-y border-gray-100 bg-gray-50 py-3 text-xs font-bold text-gray-500">
                <div className="pl-4 pr-3">分类排序</div>
                <div className="pr-3">分类名称</div>
                <div className="pr-3">分类编码</div>
                <div className="pr-3">关联商品</div>
                <div className="pr-4">操作</div>
              </div>
              <div className="pb-20">
                {filteredBackendCategories.length ? (
                  filteredBackendCategories.map(category => renderBackendRow(category))
                ) : (
                  <div className="px-6 py-16 text-center text-sm text-[#98A2B3]">暂无匹配分类</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-orange-50/50 px-6 py-4 text-xs text-orange-600"><div className="flex items-center"><Info size={14} className="mr-2" />原商品分类，商品前台展示分类，用于小程序端、企迈POS端等展示 <a href="#" className="ml-2 text-[#00C06B] hover:underline">查看帮助文档</a></div></div>

          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">分类名称</span>
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="请输入" value={categoryNameInput} onChange={e => setCategoryNameInput(e.target.value)} className="w-[220px] rounded-lg border border-gray-200 bg-white py-2 pl-[72px] pr-10 text-sm outline-none transition-colors focus:border-[#00C06B]" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">分类标识</span>
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="请输入" value={categoryCodeInput} onChange={e => setCategoryCodeInput(e.target.value)} className="w-[220px] rounded-lg border border-gray-200 bg-white py-2 pl-[72px] pr-10 text-sm outline-none transition-colors focus:border-[#00C06B]" />
              </div>
              <button onClick={handleSearchFrontendCategories} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#00A35B]">搜索</button>
              <button onClick={handleResetFrontendCategories} className="rounded-lg border border-[#D9DDE7] bg-white px-5 py-2 text-sm font-bold text-[#5B6475] transition-colors hover:bg-gray-50">重置</button>
            </div>
            <div className="relative flex space-x-3">
              <button
                onClick={() => setShowColumnPanel(prev => !prev)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ListFilter size={16} />
              </button>
              <button onClick={openSortModal} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50">排序管理</button>
              <button onClick={() => setShowSortSyncModal(true)} className="rounded-lg border border-[#00C06B] bg-[#F3FCF7] px-4 py-2 text-sm font-bold text-[#00A35B] transition-colors hover:bg-[#E8F8EF]">同步分类排序至门店</button>
              <button onClick={handleCreateRoot} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#00A35B]">添加分类</button>
              {showColumnPanel && (
                <div className="absolute right-0 top-12 z-40 w-[320px] rounded-2xl border border-[#E8E8E8] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                  <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                    <input
                      value={columnKeyword}
                      onChange={e => setColumnKeyword(e.target.value)}
                      placeholder="搜索"
                      className="h-10 w-full rounded-lg border border-[#E8E8E8] pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]"
                    />
                  </div>
                  <div className="mb-3 flex items-center justify-between text-sm text-[#666]">
                    <span>在列表中显示</span>
                    <span className="text-[#999]">冻结</span>
                  </div>
                  <div className="max-h-[360px] space-y-1 overflow-y-auto no-scrollbar">
                    {COLUMN_DEFS.filter(def => def.label.includes(columnKeyword.trim()) || !columnKeyword.trim()).map(def => (
                      <button
                        key={def.key}
                        onClick={() => setVisibleColumns(prev => ({ ...prev, [def.key]: !prev[def.key] }))}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-[#333] transition-colors hover:bg-[#F7F8FA]"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={visibleColumns[def.key]}
                            onChange={() => setVisibleColumns(prev => ({ ...prev, [def.key]: !prev[def.key] }))}
                            className="h-4 w-4 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]"
                          />
                          <span>{def.label}</span>
                        </div>
                        <Eye size={16} className={visibleColumns[def.key] ? 'text-[#98A2B3]' : 'text-[#D1D5DB]'} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="min-w-[1820px]">
              <div className="grid border-y border-gray-100 bg-gray-50 py-3 text-xs font-bold text-gray-500" style={tableGridStyle}>
                {visibleColumns.sort && <div className="pl-4 pr-3">分类排序</div>}
                {visibleColumns.icon && <div className="px-2">分类图标</div>}
                {visibleColumns.name && <div className="pr-3">分类名称</div>}
                {visibleColumns.alias && <div className="pr-3">分类别名</div>}
                {visibleColumns.code && <div className="pr-3">分类标识</div>}
                {visibleColumns.tag && <div className="pr-3">分类标签</div>}
                {visibleColumns.displaySettings && <div className="pr-3">展示渠道</div>}
                {visibleColumns.linkedProducts && <div className="pr-3">关联商品</div>}
                {visibleColumns.requiredGroup && <div className="pr-3">是否必选分组</div>}
                {visibleColumns.remark && <div className="pr-4">备注</div>}
                {visibleColumns.source && <div className="pr-4">数据来源</div>}
                <div className="sticky right-0 z-30 flex h-full w-[280px] items-center border-l border-gray-200 bg-gray-50 px-4 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.2)]">操作</div>
              </div>
              <div className="pb-20">{filteredCategories.map(cat => renderRow(cat))}</div>
            </div>
          </div>
        </>
      )}

      {editingSecondCategory && (
        <SecondaryCategoryEditorModal
          draft={editingSecondCategory}
          onChange={setEditingSecondCategory}
          onCancel={() => setEditingSecondCategory(null)}
          onConfirm={handleSaveSecondCategory}
          onViewAliasExample={() => setShowAliasExample(true)}
        />
      )}
      {showAliasExample && <CategoryAliasExampleModal onClose={() => setShowAliasExample(false)} />}
      {showSortModal && (
        <CategorySortModal
          rows={sortDraftRows}
          onChangeSort={updateSortDraftRow}
          onMoveRow={moveSortDraftRow}
          onSaveAndSync={saveAndSyncSortDraft}
          onCancel={() => setShowSortModal(false)}
          onConfirm={saveSortDraft}
        />
      )}
      {showSortSyncModal && (
        <SortSyncModal
          title="同步分类排序"
          description="修改的分类排序会更新至全部模板、全部门店，更新时间："
          mode={sortSyncMode}
          onChangeMode={setSortSyncMode}
          onCancel={() => setShowSortSyncModal(false)}
          onConfirm={handleConfirmSortSync}
        />
      )}
      {showCategoryDispatchModal && (
        <SortSyncModal
          title="下发至门店"
          description="修改的分类属性会更新至门店分类，门店分类更新时间："
          mode={categoryDispatchMode}
          onChangeMode={setCategoryDispatchMode}
          onCancel={() => setShowCategoryDispatchModal(false)}
          onConfirm={handleConfirmCategoryDispatch}
        />
      )}
      {productViewer && (
        <LinkedProductsModal
          categoryName={productViewer.categoryName}
          products={productViewer.products}
          keyword={linkedProductKeyword}
          onChangeKeyword={setLinkedProductKeyword}
          onClose={() => setProductViewer(null)}
        />
      )}
      {linkDialog && (
        <LinkProductsModal
          categoryName={linkDialog.categoryName}
          selectedIds={linkDialog.selectedIds}
          candidates={LINKABLE_PRODUCTS_POOL.filter(product => {
            const belongsToCurrentSource = linkDialog.source === 'backend'
              ? product.categoryPath?.startsWith('后台分类/')
              : !product.categoryPath?.startsWith('后台分类/');
            if (!belongsToCurrentSource) return false;
            const targetCategory = linkDialog.source === 'frontend'
              ? categories.flatMap(item => [item, ...(item.children || [])]).find(item => item.id === linkDialog.categoryId)
              : findBackendCategory(backendCategories, linkDialog.categoryId);
            const existingIds = new Set((targetCategory?.linkedProducts || []).map(item => item.id));
            return !existingIds.has(product.id);
          })}
          onChangeSelectedIds={selectedIds => setLinkDialog(prev => (prev ? { ...prev, selectedIds } : prev))}
          onCancel={() => setLinkDialog(null)}
          onConfirm={handleConfirmLinkDialog}
        />
      )}
      {unlinkDialog && (
        <UnlinkProductsModal
          categoryName={unlinkDialog.categoryName}
          products={unlinkDialog.products}
          keyword={unlinkDialog.keyword}
          selectedIds={unlinkDialog.selectedIds}
          onChangeKeyword={keyword => setUnlinkDialog(prev => (prev ? { ...prev, keyword } : prev))}
          onChangeSelectedIds={selectedIds => setUnlinkDialog(prev => (prev ? { ...prev, selectedIds } : prev))}
          onCancel={() => setUnlinkDialog(null)}
          onConfirm={handleConfirmUnlinkDialog}
        />
      )}
      {unlinkResultDialog && (
        <UnlinkResultModal
          source={unlinkResultDialog.source}
          categoryId={unlinkResultDialog.categoryId}
          categoryName={unlinkResultDialog.categoryName}
          removed={unlinkResultDialog.removed}
          blocked={unlinkResultDialog.blocked}
          onClose={() => setUnlinkResultDialog(null)}
          onEditProduct={product => {
            const selectedCategoryIds = [unlinkResultDialog.categoryId];
            setProductCategoryEditor({ source: unlinkResultDialog.source, product, selectedCategoryIds });
          }}
        />
      )}
      {productCategoryEditor && (
        <ProductCategoryEditorModal
          product={productCategoryEditor.product}
          options={productCategoryEditor.source === 'frontend' ? leafCategoryOptions : backendLeafCategoryOptions}
          selectedCategoryIds={productCategoryEditor.selectedCategoryIds}
          onChangeSelectedCategoryIds={selectedCategoryIds => setProductCategoryEditor(prev => (prev ? { ...prev, selectedCategoryIds } : prev))}
          onCancel={() => setProductCategoryEditor(null)}
          onConfirm={handleSaveProductCategoryEditor}
        />
      )}
      {deleteDialog && (
        <DeleteCategoryModal
          mode={deleteDialog.mode}
          categoryName={deleteDialog.categoryName}
          onCancel={() => setDeleteDialog(null)}
          onConfirm={confirmDeleteCategory}
        />
      )}
      {backendEditor && (
        <BackendCategoryEditorModal
          mode={backendEditor.mode}
          parentName={backendEditor.parentName}
          name={backendEditor.name}
          code={backendEditor.code}
          onChange={next => setBackendEditor(prev => (prev ? { ...prev, ...next } : prev))}
          onCancel={() => setBackendEditor(null)}
          onConfirm={handleSaveBackendCategory}
        />
      )}
      {backendDeleteTarget && (
        <BackendDeleteCategoryModal
          categoryName={backendDeleteTarget.name}
          onCancel={() => setBackendDeleteTarget(null)}
          onConfirm={confirmDeleteBackendCategory}
        />
      )}
    </div>
  );
};

const SortSyncModal = ({
  title,
  description,
  mode,
  onChangeMode,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  mode: SortSyncMode;
  onChangeMode: (mode: SortSyncMode) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[820px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div className="text-[20px] font-black text-[#1F2129]">{title}</div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="px-8 py-7">
          <div className="rounded-xl bg-[#F7F8FA] px-5 py-5">
            <div className="mb-6 text-[16px] text-[#5B6475]">{description}</div>
            <div className="flex items-center gap-10 text-[16px]">
              <label className={`flex items-center ${mode === 'immediate' ? 'text-[#00C06B]' : 'text-[#666]'}`}>
                <input type="radio" checked={mode === 'immediate'} onChange={() => onChangeMode('immediate')} className="mr-3 h-4 w-4 accent-[#00C06B]" />
                立即执行
              </label>
              <label className={`flex items-center ${mode === 'manual' ? 'text-[#00C06B]' : 'text-[#666]'}`}>
                <input type="radio" checked={mode === 'manual'} onChange={() => onChangeMode('manual')} className="mr-3 h-4 w-4 accent-[#00C06B]" />
                手工执行
              </label>
              <label className={`flex items-center ${mode === 'scheduled' ? 'text-[#00C06B]' : 'text-[#666]'}`}>
                <input type="radio" checked={mode === 'scheduled'} onChange={() => onChangeMode('scheduled')} className="mr-3 h-4 w-4 accent-[#00C06B]" />
                定时执行
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 border-t border-[#EEF1F5] px-8 py-6">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-8 py-3 text-[16px] font-bold text-[#5B6475]">取消</button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-8 py-3 text-[16px] font-bold text-white">确定</button>
        </div>
      </div>
    </div>
  );
};

const SecondaryCategoryEditorModal = ({
  draft,
  onChange,
  onCancel,
  onConfirm,
  onViewAliasExample,
}: {
  draft: SecondaryCategoryEditorDraft;
  onChange: (draft: SecondaryCategoryEditorDraft) => void;
  onCancel: () => void;
  onConfirm: () => void;
  onViewAliasExample: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[900px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div className="text-[20px] font-black text-[#1F2129]">{draft.id ? '编辑二级分类' : '新增二级分类'}</div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="space-y-7 px-8 py-8">
          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-center gap-4">
            <div className="text-[16px] text-[#5B6475]">所属一级分类：</div>
            <div className="text-[18px] text-[#1F2129]">{draft.parentName}</div>
          </div>
          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-center gap-4">
            <div className="text-[16px] text-[#5B6475]"><span className="mr-1 text-[#FF4D4F]">*</span>二级分类名称：</div>
            <div className="relative">
              <input value={draft.name} maxLength={10} onChange={e => onChange({ ...draft, name: e.target.value.slice(0, 10) })} className="h-[48px] w-full rounded-[10px] border border-[#D9DDE7] px-4 pr-16 text-[16px] text-[#1F2129] outline-none focus:border-[#00C06B]" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]">{draft.name.length}/10</div>
            </div>
          </div>
          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-start gap-4">
            <div className="pt-3 text-[16px] text-[#5B6475]">分类别名：</div>
            <div>
              <div className="relative">
                <input
                  value={draft.alias}
                  maxLength={10}
                  placeholder="请输入分类别名"
                  onChange={e => onChange({ ...draft, alias: e.target.value.slice(0, 10) })}
                  className="h-[48px] w-full rounded-[10px] border border-[#D9DDE7] px-4 pr-16 text-[16px] text-[#1F2129] outline-none focus:border-[#00C06B]"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]">{draft.alias.length}/10</div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-[#98A2B3]">
                <span>用于补充说明分类，配置后将在小程序分类名称下方默认展示</span>
                <button type="button" onClick={onViewAliasExample} className="shrink-0 font-bold text-[#00A35B] hover:text-[#008F50]">查看示例</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-center gap-4">
            <div className="text-[16px] text-[#5B6475]"><span className="mr-1 text-[#FF4D4F]">*</span>排序：</div>
            <div className="inline-flex overflow-hidden rounded-[10px] border border-[#D9DDE7]">
              <button onClick={() => onChange({ ...draft, sort: Math.max(1, draft.sort - 1) })} className="flex h-[46px] w-[48px] items-center justify-center bg-[#F8FAFB] text-[24px] text-[#98A2B3] hover:text-[#1F2129]">-</button>
              <div className="flex h-[46px] w-[96px] items-center justify-center border-x border-[#D9DDE7] text-[20px] text-[#1F2129]">{draft.sort}</div>
              <button onClick={() => onChange({ ...draft, sort: draft.sort + 1 })} className="flex h-[46px] w-[48px] items-center justify-center bg-[#F8FAFB] text-[24px] text-[#5B6475] hover:text-[#1F2129]">+</button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 border-t border-[#EEF1F5] px-8 py-6">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-8 py-3 text-[16px] font-bold text-[#5B6475]">取消</button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-8 py-3 text-[16px] font-bold text-white">确定</button>
        </div>
      </div>
    </div>
  );
};

const CategoryAliasExampleModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 px-6" onClick={onClose}>
    <div className="w-full max-w-[680px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]" onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[#EEF1F5] px-7 py-5">
        <div>
          <div className="text-[20px] font-black text-[#1F2129]">分类别名展示示例</div>
          <div className="mt-1 text-sm text-[#98A2B3]">配置别名后，小程序会在分类名称下方展示补充说明</div>
        </div>
        <button type="button" onClick={onClose} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
      </div>
      <div className="px-7 py-7">
        <div className="rounded-2xl bg-[#F6F7FB] p-5">
          <div className="mb-4 text-sm font-bold text-[#5B6475]">小程序点单页</div>
          <div className="grid grid-cols-[128px_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-r border-[#EEF1F5] bg-[#F8FAFB] p-3">
              <div className="rounded-xl border border-[#BFECD3] bg-white px-3 py-4 text-center shadow-sm">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9FAF1] text-lg font-black text-[#00A35B]">披</div>
                <div className="text-sm font-bold leading-5 text-[#1F2129]">披萨系列</div>
                <div className="mt-1 text-xs leading-4 text-[#98A2B3]">现烤薄脆</div>
              </div>
              <div className="mt-3 rounded-xl px-3 py-4 text-center text-sm text-[#5B6475]">能量碗</div>
            </div>
            <div className="p-5">
              <div className="text-lg font-black text-[#1F2129]">披萨系列</div>
              <div className="mt-1 text-sm text-[#98A2B3]">现烤薄脆</div>
              <div className="mt-5 space-y-3">
                <div className="h-16 rounded-xl bg-[#F7F8FA]" />
                <div className="h-16 rounded-xl bg-[#F7F8FA]" />
                <div className="h-16 rounded-xl bg-[#F7F8FA]" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-5 text-xs text-[#5B6475]">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#1F2129]" />分类名称：披萨系列</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#98A2B3]" />分类别名：现烤薄脆</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end border-t border-[#EEF1F5] px-7 py-5">
        <button type="button" onClick={onClose} className="rounded-[10px] bg-[#00C06B] px-7 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">我知道了</button>
      </div>
    </div>
  </div>
);

const CategorySortModal = ({
  rows,
  onChangeSort,
  onMoveRow,
  onSaveAndSync,
  onCancel,
  onConfirm,
}: {
  rows: CategorySortDraftRow[];
  onChangeSort: (rowId: string, nextSort: number) => void;
  onMoveRow: (dragId: string, targetId: string) => void;
  onSaveAndSync: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[980px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-5">
          <div>
            <div className="text-[20px] font-black text-[#1F2129]">分类排序</div>
            <div className="mt-3 text-sm text-[#5B6475]">修改分类排序后需要同步门店后方可生效。</div>
          </div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={20} /></button>
        </div>
        <div className="px-8 py-5">
          <div className="overflow-hidden rounded-[12px] border border-[#EEF1F5]">
            <div className="grid grid-cols-[minmax(0,1fr)_160px] bg-[#F8FAFB] px-4 py-3 text-sm font-bold text-[#5B6475]">
              <div>分类名称</div>
              <div>排序</div>
            </div>
            <div className="max-h-[520px] overflow-y-auto no-scrollbar">
              {rows.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => {
                    setDraggingRowId(item.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item.id);
                  }}
                  onDragOver={e => {
                    if (!draggingRowId || draggingRowId === item.id) return;
                    e.preventDefault();
                  }}
                  onDrop={e => {
                    if (!draggingRowId || draggingRowId === item.id) return;
                    e.preventDefault();
                    onMoveRow(draggingRowId, item.id);
                    setDraggingRowId(null);
                  }}
                  onDragEnd={() => setDraggingRowId(null)}
                  className={`grid grid-cols-[minmax(0,1fr)_160px] items-center border-t border-[#F2F4F7] px-4 py-3 text-sm ${draggingRowId === item.id ? 'bg-[#F3FCF7]' : 'bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="cursor-grab text-[#98A2B3] active:cursor-grabbing" />
                    <div className="font-medium text-[#333]">{item.name}</div>
                  </div>
                  <div>
                    <select value={item.sort} onChange={e => onChangeSort(item.id, Number(e.target.value))} className="h-9 w-full rounded-lg border border-[#D9DDE7] bg-white px-3 text-sm text-[#333] outline-none focus:border-[#00C06B]">
                      {rows.map((_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">取消</button>
          <button onClick={onConfirm} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">保存</button>
          <button onClick={onSaveAndSync} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white">保存并同步至门店</button>
        </div>
      </div>
    </div>
  );
};

const LinkedProductsModal = ({
  categoryName,
  products,
  keyword,
  onChangeKeyword,
  onClose,
}: {
  categoryName: string;
  products: LinkedProduct[];
  keyword: string;
  onChangeKeyword: (keyword: string) => void;
  onClose: () => void;
}) => {
  const typeClassMap: Record<LinkedProduct['type'], string> = {
    商城商品: 'bg-[#EEF4FF] text-[#2563EB]',
    标准商品: 'bg-[#F0FDF4] text-[#00A35B]',
    套餐商品: 'bg-[#FFF7ED] text-[#EA580C]',
    加料商品: 'bg-[#F5F3FF] text-[#7C3AED]',
  };

  const filteredProducts = products.filter(product => product.name.toLowerCase().includes(keyword.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-[97] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[920px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div>
            <div className="text-[20px] font-black text-[#1F2129]">关联商品</div>
            <div className="mt-1 text-sm text-[#98A2B3]">分类：{categoryName}</div>
          </div>
          <button onClick={onClose} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="px-8 py-6">
          <div className="mb-5 rounded-xl bg-[#FFF7E8] px-4 py-3 text-sm text-[#D97706]">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>选定分类：{categoryName}，已关联 {products.length} 个商品</span>
            </div>
          </div>
          <div className="mb-5 rounded-xl bg-[#F8FAFB] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 items-center rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#333]">商品名称</div>
              <div className="relative flex-1">
                <input
                  value={keyword}
                  onChange={e => onChangeKeyword(e.target.value)}
                  placeholder="请输入商品名称"
                  className="h-10 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm outline-none focus:border-[#00C06B]"
                />
              </div>
              <button type="button" onClick={() => onChangeKeyword(keyword.trim())} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white">查询</button>
              <button onClick={() => onChangeKeyword('')} className="rounded-lg border border-[#D9DDE7] bg-white px-5 py-2 text-sm font-bold text-[#5B6475]">重置</button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#EEF1F5]">
            <div className="grid grid-cols-[minmax(0,1.2fr)_160px_220px] bg-[#F8FAFB] px-4 py-3 text-sm font-bold text-[#5B6475]">
              <div>商品名称</div>
              <div>商品类型</div>
              <div>前台分类</div>
            </div>
            <div className="max-h-[420px] overflow-y-auto no-scrollbar">
              {filteredProducts.length ? filteredProducts.map(product => (
                <div key={product.id} className="grid grid-cols-[minmax(0,1.2fr)_160px_220px] items-center border-t border-[#EEF1F5] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#DDF5E6,#CFF3DB)] text-sm font-bold text-[#00A35B]">
                      {product.imageText || product.name.slice(0, 2)}
                    </div>
                    <div className="truncate text-sm text-[#1F2129]">{product.name}</div>
                  </div>
                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${typeClassMap[product.type]}`}>{product.type}</span>
                  </div>
                  <div className="text-sm text-[#5B6475]">{categoryName}</div>
                </div>
              )) : (
                <div className="px-4 py-12 text-center text-sm text-[#98A2B3]">暂无匹配商品</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onClose} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white">关闭</button>
        </div>
      </div>
    </div>
  );
};

const LinkProductsModal = ({
  categoryName,
  candidates,
  selectedIds,
  onChangeSelectedIds,
  onCancel,
  onConfirm,
}: {
  categoryName: string;
  candidates: LinkProductCandidate[];
  selectedIds: string[];
  onChangeSelectedIds: (selectedIds: string[]) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const [keyword, setKeyword] = useState('');
  const selectedIdSet = new Set(selectedIds);
  const filteredCandidates = candidates.filter(product => product.name.toLowerCase().includes(keyword.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-[98] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[1080px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div>
            <div className="text-[20px] font-black text-[#1F2129]">关联商品</div>
            <div className="mt-1 text-sm text-[#98A2B3]">当前分类：{categoryName}</div>
          </div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="px-8 py-6">
          <div className="mb-5 rounded-xl bg-[#F8FAFB] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 items-center rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#333]">商品名称</div>
              <div className="relative flex-1">
                <input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="请输入商品名称"
                  className="h-10 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm outline-none focus:border-[#00C06B]"
                />
              </div>
              <button type="button" onClick={() => setKeyword(current => current.trim())} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white">查询</button>
              <button onClick={() => setKeyword('')} className="rounded-lg border border-[#D9DDE7] bg-white px-5 py-2 text-sm font-bold text-[#5B6475]">重置</button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#EEF1F5]">
            <div className="grid grid-cols-[52px_minmax(0,1.4fr)_140px_220px_120px] bg-[#F8FAFB] px-4 py-3 text-sm font-bold text-[#5B6475]">
              <div />
              <div>商品名称</div>
              <div>商品类型</div>
              <div>前台分类</div>
              <div>已关联分类数</div>
            </div>
            <div className="max-h-[420px] overflow-y-auto no-scrollbar">
              {filteredCandidates.length ? filteredCandidates.map(product => (
                <div key={product.id} className="grid grid-cols-[52px_minmax(0,1.4fr)_140px_220px_120px] items-center border-t border-[#EEF1F5] px-4 py-4">
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedIdSet.has(product.id)}
                      onChange={e => {
                        if (e.target.checked) onChangeSelectedIds([...selectedIds, product.id]);
                        else onChangeSelectedIds(selectedIds.filter(id => id !== product.id));
                      }}
                      className="h-4 w-4 rounded border border-[#D9DDE7] text-[#00C06B] focus:ring-[#00C06B]"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#DDF5E6,#CFF3DB)] text-sm font-bold text-[#00A35B]">
                      {product.imageText || product.name.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[#1F2129]">{product.name}</div>
                      <div className="mt-1 text-xs text-[#98A2B3]">{product.id}</div>
                    </div>
                  </div>
                  <div className="text-sm text-[#5B6475]">{product.type}</div>
                  <div className="truncate text-sm text-[#5B6475]">{product.categoryPath || '-'}</div>
                  <div className="text-sm text-[#5B6475]">{product.categoryCount || 1}</div>
                </div>
              )) : (
                <div className="px-4 py-12 text-center text-sm text-[#98A2B3]">暂无可关联商品</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">取消</button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white">确定</button>
        </div>
      </div>
    </div>
  );
};

const UnlinkProductsModal = ({
  categoryName,
  products,
  keyword,
  selectedIds,
  onChangeKeyword,
  onChangeSelectedIds,
  onCancel,
  onConfirm,
}: {
  categoryName: string;
  products: LinkedProduct[];
  keyword: string;
  selectedIds: string[];
  onChangeKeyword: (keyword: string) => void;
  onChangeSelectedIds: (selectedIds: string[]) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const selectedIdSet = new Set(selectedIds);
  const filteredProducts = products.filter(product => product.name.toLowerCase().includes(keyword.trim().toLowerCase()));
  const allChecked = filteredProducts.length > 0 && filteredProducts.every(product => selectedIdSet.has(product.id));

  return (
    <div className="fixed inset-0 z-[98] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[880px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div>
            <div className="text-[20px] font-black text-[#1F2129]">解除关联</div>
            <div className="mt-1 text-sm text-[#98A2B3]">当前分类：{categoryName}</div>
          </div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="px-8 py-6">
          <div className="mb-4 rounded-xl bg-[#F8FAFB] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 items-center rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#333]">商品名称</div>
              <div className="relative flex-1">
                <input
                  value={keyword}
                  onChange={e => onChangeKeyword(e.target.value)}
                  placeholder="请输入商品名称"
                  className="h-10 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm outline-none focus:border-[#00C06B]"
                />
              </div>
              <button type="button" onClick={() => onChangeKeyword(keyword.trim())} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white">查询</button>
              <button onClick={() => onChangeKeyword('')} className="rounded-lg border border-[#D9DDE7] bg-white px-5 py-2 text-sm font-bold text-[#5B6475]">重置</button>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between rounded-xl bg-[#F8FAFB] px-4 py-3">
            <label className="flex items-center gap-3 text-sm font-medium text-[#333]">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={e => onChangeSelectedIds(e.target.checked ? Array.from(new Set([...selectedIds, ...filteredProducts.map(product => product.id)])) : selectedIds.filter(id => !filteredProducts.some(product => product.id === id)))}
                className="h-4 w-4 rounded border border-[#D9DDE7] text-[#00C06B] focus:ring-[#00C06B]"
              />
              全选当前结果
            </label>
            <div className="text-sm text-[#98A2B3]">若商品仅关联当前分类，则不支持解除</div>
          </div>
          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-[#EEF1F5] no-scrollbar">
            {filteredProducts.map(product => (
              <label key={product.id} className="flex items-center gap-4 border-t border-[#EEF1F5] px-4 py-4 first:border-t-0">
                <input
                  type="checkbox"
                  checked={selectedIdSet.has(product.id)}
                  onChange={e => {
                    if (e.target.checked) onChangeSelectedIds([...selectedIds, product.id]);
                    else onChangeSelectedIds(selectedIds.filter(id => id !== product.id));
                  }}
                  className="h-4 w-4 rounded border border-[#D9DDE7] text-[#00C06B] focus:ring-[#00C06B]"
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#DDF5E6,#CFF3DB)] text-sm font-bold text-[#00A35B]">
                  {product.imageText || product.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[#1F2129]">{product.name}</div>
                  <div className="mt-1 text-xs text-[#98A2B3]">{(product.categoryCount || 1) <= 1 ? '当前为唯一关联分类' : `已关联 ${(product.categoryCount || 1)} 个分类`}</div>
                </div>
                <div className="text-sm text-[#5B6475]">{product.type}</div>
              </label>
            ))}
            {!filteredProducts.length && <div className="px-4 py-12 text-center text-sm text-[#98A2B3]">暂无匹配商品</div>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">取消</button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white">确定</button>
        </div>
      </div>
    </div>
  );
};

const UnlinkResultModal = ({
  source,
  categoryId,
  categoryName,
  removed,
  blocked,
  onClose,
  onEditProduct,
}: {
  source: 'frontend' | 'backend';
  categoryId: string;
  categoryName: string;
  removed: LinkedProduct[];
  blocked: LinkedProduct[];
  onClose: () => void;
  onEditProduct: (product: LinkedProduct) => void;
}) => {
  const removedLabel = removed.length === 1 ? `${removed[0].name}已解除关联` : `${removed.length} 个商品已解除关联`;

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[900px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div>
            <div className="text-[20px] font-black text-[#1F2129]">解除关联结果</div>
            <div className="mt-1 text-sm text-[#98A2B3]">分类：{categoryName}</div>
          </div>
          <button onClick={onClose} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="space-y-5 px-8 py-6">
          {removed.length > 0 && (
            <div className="rounded-xl bg-[#F3FCF7] px-4 py-4 text-sm text-[#00A35B]">{removedLabel}</div>
          )}
          {blocked.length > 0 && (
            <div className="rounded-xl bg-[#FFF7E8] px-4 py-4 text-sm text-[#D97706]">
              {`${removed.length > 0 ? removedLabel + '，' : ''}该分类为以下商品关联的唯一分类，移除将影响商品售卖，请修改商品关联${source === 'frontend' ? '分类' : '后台分类'}`}
            </div>
          )}
          {blocked.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-[#EEF1F5]">
              <div className="grid grid-cols-[minmax(0,1fr)_150px_120px] bg-[#F8FAFB] px-4 py-3 text-sm font-bold text-[#5B6475]">
                <div>商品名称</div>
                <div>商品类型</div>
                <div>操作</div>
              </div>
              {blocked.map(product => (
                <div key={`${categoryId}-${product.id}`} className="grid grid-cols-[minmax(0,1fr)_150px_120px] items-center border-t border-[#EEF1F5] px-4 py-4">
                  <div className="text-sm text-[#1F2129]">{product.name}</div>
                  <div className="text-sm text-[#5B6475]">{product.type}</div>
                  <div>
                    <button onClick={() => onEditProduct(product)} className="text-sm font-bold text-[#00C06B] hover:text-[#00A35B]">编辑商品</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onClose} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white">我知道了</button>
        </div>
      </div>
    </div>
  );
};

const ProductCategoryEditorModal = ({
  product,
  options,
  selectedCategoryIds,
  onChangeSelectedCategoryIds,
  onCancel,
  onConfirm,
}: {
  product: LinkedProduct;
  options: Array<{ id: string; name: string; path: string }>;
  selectedCategoryIds: string[];
  onChangeSelectedCategoryIds: (ids: string[]) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const selectedIdSet = new Set(selectedCategoryIds);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[760px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div>
            <div className="text-[20px] font-black text-[#1F2129]">编辑商品关联分类</div>
            <div className="mt-1 text-sm text-[#98A2B3]">{product.name}</div>
          </div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="max-h-[460px] overflow-y-auto px-8 py-6 no-scrollbar">
          <div className="space-y-3">
            {options.map(option => (
              <label key={option.id} className="flex items-start gap-3 rounded-xl border border-[#EEF1F5] px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedIdSet.has(option.id)}
                  onChange={e => {
                    if (e.target.checked) onChangeSelectedCategoryIds([...selectedCategoryIds, option.id]);
                    else onChangeSelectedCategoryIds(selectedCategoryIds.filter(id => id !== option.id));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border border-[#D9DDE7] text-[#00C06B] focus:ring-[#00C06B]"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#1F2129]">{option.name}</div>
                  <div className="mt-1 text-xs text-[#98A2B3]">{option.path}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">取消</button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white">保存</button>
        </div>
      </div>
    </div>
  );
};

const DeleteCategoryModal = ({
  mode,
  categoryName,
  onCancel,
  onConfirm,
}: {
  mode: 'confirm' | 'blocked';
  categoryName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const isBlocked = mode === 'blocked';

  return (
    <div className="fixed inset-0 z-[98] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[520px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div className="text-[20px] font-black text-[#1F2129]">{isBlocked ? '无法删除' : '删除分类'}</div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="px-8 py-8">
          <div className={`rounded-xl px-4 py-4 text-sm ${isBlocked ? 'bg-[#FFF7E8] text-[#D97706]' : 'bg-[#F8FAFB] text-[#5B6475]'}`}>
            {isBlocked ? '分类已被商品关联使用,请移除后重试' : `确认删除分类“${categoryName}”吗？删除后不可恢复。`}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">{isBlocked ? '我知道了' : '取消'}</button>
          {!isBlocked && (
            <button onClick={onConfirm} className="rounded-[10px] bg-[#FF4D4F] px-6 py-2.5 text-sm font-bold text-white">删除</button>
          )}
        </div>
      </div>
    </div>
  );
};

const BackendCategoryEditorModal = ({
  mode,
  parentName,
  name,
  code,
  onChange,
  onCancel,
  onConfirm,
}: {
  mode: 'create' | 'edit';
  parentName?: string;
  name: string;
  code: string;
  onChange: (next: { name?: string; code?: string }) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[650px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between px-8 py-7">
          <div className="text-[20px] font-black text-[#1F2129]">{mode === 'create' ? '添加后台分类' : '编辑后台分类'}</div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="space-y-7 px-8 pb-8">
          {parentName && (
            <div className="grid grid-cols-[108px_minmax(0,1fr)] items-center gap-4">
              <div className="text-[16px] text-[#5B6475]">上级分类：</div>
              <div className="text-[16px] text-[#1F2129]">{parentName}</div>
            </div>
          )}
          <div className="grid grid-cols-[108px_minmax(0,1fr)] items-center gap-4">
            <div className="text-[16px] text-[#5B6475]">分类名称：</div>
            <div className="relative">
              <input
                value={name}
                maxLength={40}
                onChange={e => onChange({ name: e.target.value.slice(0, 40) })}
                className="h-[48px] w-full rounded-[10px] border border-[#D9DDE7] px-4 pr-16 text-[16px] text-[#1F2129] outline-none focus:border-[#00C06B]"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]">{name.length}/40</div>
            </div>
          </div>
          <div className="grid grid-cols-[108px_minmax(0,1fr)] items-start gap-4">
            <div className="pt-3 text-[16px] text-[#5B6475]">分类编码：</div>
            <div>
              <div className="relative">
                <input
                  value={code}
                  maxLength={30}
                  onChange={e => onChange({ code: e.target.value.slice(0, 30) })}
                  className="h-[48px] w-full rounded-[10px] border border-[#D9DDE7] px-4 pr-16 text-[16px] text-[#1F2129] outline-none focus:border-[#00C06B]"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]">{code.length}/30</div>
              </div>
              <div className="mt-2 text-sm text-[#98A2B3]">用于外部对接的分类标识码</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 px-8 pb-8">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-7 py-3 text-[16px] font-bold text-[#5B6475]">取消</button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-7 py-3 text-[16px] font-bold text-white">确定</button>
        </div>
      </div>
    </div>
  );
};

const BackendDeleteCategoryModal = ({
  categoryName,
  onCancel,
  onConfirm,
}: {
  categoryName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[520px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div className="text-[20px] font-black text-[#1F2129]">删除后台分类</div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="px-8 py-8">
          <div className="rounded-xl bg-[#F8FAFB] px-4 py-4 text-sm text-[#5B6475]">确认删除分类“{categoryName}”吗？删除后不可恢复。</div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">取消</button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#FF4D4F] px-6 py-2.5 text-sm font-bold text-white">删除</button>
        </div>
      </div>
    </div>
  );
};
