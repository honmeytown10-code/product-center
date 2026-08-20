import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers3, ChefHat, Tags, Tag, Grid2X2, Search, Filter, ListFilter, Heart, Blend, ChevronRight, ChevronDown, Plus, X, Eye, EyeOff, Lock, Braces, FolderTree } from 'lucide-react';
import { WebCustomAttributeManager } from './WebCustomAttributeManager';
import { WebCategoryListManager } from './WebCategoryListManager';

type SpecValue = {
  id: string;
  name: string;
  code: string;
  relatedProducts: LinkedSpecProduct[];
};

type AttributeTab = 'category' | 'spec' | 'method' | 'label' | 'badge' | 'series' | 'custom_attribute' | 'custom_combo' | 'addon';
type LabelTab = 'desc' | 'stats';
type SpecColumnKey = 'name' | 'value' | 'code' | 'relatedProducts';

type LinkedSpecProduct = {
  id: string;
  name: string;
  type: '标准商品' | '套餐商品' | '商城商品' | '加料商品';
  imageText?: string;
};

type SpecGroup = {
  id: string;
  name: string;
  description: string;
  relatedProducts: LinkedSpecProduct[];
  values: SpecValue[];
};

type MethodGroup = {
  id: string;
  name: string;
  remark: string;
  tip: string;
  relationCount: number;
  multi: boolean;
  optionType: string;
  values: Array<{ id: string; name: string; code: string }>;
};

type LabelGroup = {
  id: string;
  groupName: string;
  labels: Array<{
    id: string;
    name: string;
    bgColor: string;
    textColor: string;
    createdAt: string;
  }>;
};

type BadgeRecord = {
  id: string;
  name: string;
  bgColor: string;
  effectText: string;
  image?: string;
  validPeriod: string;
  createdAt: string;
};

type SeriesRecord = {
  id: string;
  name: string;
  image: string;
  relatedCount: number;
  enabled: boolean;
};

type ChannelLibraryEditorState =
  | { kind: 'label_group'; mode: 'create' | 'edit'; groupId?: string; groupName: string }
  | { kind: 'label'; mode: 'create' | 'edit'; groupId: string; labelId?: string; name: string; bgColor: string; textColor: string }
  | { kind: 'badge'; mode: 'create' | 'edit'; id?: string; name: string; bgColor: string; effectText: string; image: string; validPeriod: string }
  | { kind: 'series'; mode: 'create' | 'edit'; id?: string; name: string; image: string; enabled: boolean; relatedCount: number };

type ChannelLibraryDeleteState = {
  kind: 'label_group' | 'label' | 'badge' | 'series';
  id: string;
  parentId?: string;
  name: string;
  blockedCount?: number;
};

type CustomComboConfigMode = 'pick' | 'flexible';

type CustomComboRecord = {
  id: string;
  groupName: string;
  groupCode: string;
  remark: string;
  productCode: string;
  barcode: string;
  configMode: CustomComboConfigMode;
  isRelativePrice: boolean;
  isRequired: boolean;
  requiredOptionCount: number;
  minTotalQuantity: number;
  maxTotalQuantity: number;
  items: CustomComboItem[];
  relatedCount: number;
};

type AddonGroup = {
  id: string;
  typeName: string;
  sort: number;
  productName: string;
  initialPrice: number;
  relatedCount: number;
  createdAt: string;
  enabled: boolean;
  children?: AddonGroup[];
};

type DouyinAddonStatus = 'not_synced' | 'syncing' | 'synced' | 'failed';
type DouyinAddonRecord = {
  id: string;
  name: string;
  source: 'master' | 'platform';
  masterAddonId?: string;
  douyinCategory: string;
  addonType: string;
  price: number;
  status: DouyinAddonStatus;
  platformId?: string;
  updatedAt: string;
};

type DouyinAddonEditorState =
  | { mode: 'master'; selectedIds: string[]; categories: Record<string, string> }
  | { mode: 'platform'; recordId?: string; name: string; category: string; addonType: string; price: string };

type SpecEditorState = {
  mode: 'create' | 'edit';
  groupId?: string;
  name: string;
  description: string;
  values: SpecValue[];
};

type SpecValueEditorState = {
  groupId: string;
  groupName: string;
  values: SpecValue[];
};

type SpecDeleteDialogState =
  | {
      mode: 'confirm';
      targetType: 'group' | 'value';
      groupId: string;
      groupName: string;
      valueId?: string;
      valueName?: string;
    }
  | {
      mode: 'blocked';
      targetType: 'group' | 'value';
      groupId: string;
      groupName: string;
      relationCount: number;
      valueId?: string;
      valueName?: string;
    };

type SpecLinkedProductsViewer = {
  title: string;
  products: LinkedSpecProduct[];
};

type CustomComboItem = {
  id: string;
  name: string;
  spec: string;
  productCode: string;
  barcode: string;
  quantity: number;
};

type CustomComboEditorState = {
  mode: 'create' | 'edit';
  id?: string;
  groupName: string;
  groupCode: string;
  remark: string;
  productCode: string;
  barcode: string;
  configMode: CustomComboConfigMode;
  isRelativePrice: boolean;
  isRequired: boolean;
  requiredOptionCount: number;
  minTotalQuantity: number;
  maxTotalQuantity: number;
  items: CustomComboItem[];
  relatedCount: number;
};

const SPEC_GROUPS: SpecGroup[] = [
  {
    id: 'spec-1',
    name: '0325规格1',
    description: '用于门店测试的默认规格',
    relatedProducts: [
      { id: 'sp-101', name: '经典奶茶', type: '标准商品', imageText: '奶' },
      { id: 'sp-102', name: '双杯套餐', type: '套餐商品', imageText: '套' },
    ],
    values: [{ id: 'sv-1', name: '050811', code: '050811', relatedProducts: [{ id: 'sp-101', name: '经典奶茶', type: '标准商品', imageText: '奶' }] }],
  },
  {
    id: 'spec-2',
    name: '验收-自建规格',
    description: '验收环境下临时使用',
    relatedProducts: [],
    values: [],
  },
  {
    id: 'spec-3',
    name: '人数222',
    description: '按人数区分的规格组',
    relatedProducts: [
      { id: 'sp-103', name: '围炉双人餐', type: '套餐商品', imageText: '围' },
      { id: 'sp-104', name: '围炉四人餐', type: '套餐商品', imageText: '围' },
      { id: 'sp-105', name: '生日聚会套餐', type: '商城商品', imageText: '生' },
    ],
    values: [
      { id: 'sv-2', name: '2人', code: '2', relatedProducts: [{ id: 'sp-103', name: '围炉双人餐', type: '套餐商品', imageText: '围' }] },
      { id: 'sv-3', name: '4人', code: '4', relatedProducts: [{ id: 'sp-104', name: '围炉四人餐', type: '套餐商品', imageText: '围' }, { id: 'sp-105', name: '生日聚会套餐', type: '商城商品', imageText: '生' }] },
    ],
  },
  {
    id: 'spec-4',
    name: 'KOI规格',
    description: '品牌规格示例',
    relatedProducts: [],
    values: [],
  },
];

const SPEC_COLUMN_DEFS: Array<{ key: SpecColumnKey; label: string }> = [
  { key: 'name', label: '规格名称' },
  { key: 'value', label: '规格值' },
  { key: 'code', label: '规格值编码' },
  { key: 'relatedProducts', label: '关联商品数量' },
];

const DEFAULT_VISIBLE_SPEC_COLUMNS: Record<SpecColumnKey, boolean> = {
  name: true,
  value: true,
  code: true,
  relatedProducts: true,
};

const createEmptySpecValue = (): SpecValue => ({
  id: `spec-value-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: '',
  code: '',
  relatedProducts: [],
});

const createMockCustomComboItem = (index: number = 1): CustomComboItem => ({
  id: `custom-combo-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: `随心配商品${index}`,
  spec: '默认',
  productCode: `P${String(index).padStart(3, '0')}`,
  barcode: `BC${String(index).padStart(4, '0')}`,
  quantity: 1,
});

const createEmptyCustomComboEditor = (): CustomComboEditorState => ({
  mode: 'create',
  groupName: '',
  groupCode: '',
  remark: '',
  productCode: '',
  barcode: '',
  configMode: 'pick',
  isRelativePrice: false,
  isRequired: false,
  requiredOptionCount: 1,
  minTotalQuantity: 0,
  maxTotalQuantity: 100,
  items: [createMockCustomComboItem()],
  relatedCount: 0,
});

const getCustomComboModeLabel = (mode: CustomComboConfigMode) => (
  mode === 'pick' ? '按种类选择' : '按数量选择'
);

const getCustomComboOptionRule = (record: Pick<CustomComboRecord, 'configMode' | 'items' | 'requiredOptionCount'>) =>
  record.configMode === 'pick' ? `${record.items.length}选${record.requiredOptionCount}` : '--';

const getCustomComboRequiredLabel = (record: Pick<CustomComboRecord, 'configMode' | 'isRequired'>) => (
  record.configMode === 'flexible' ? (record.isRequired ? '必选' : '非必选') : '--'
);

const getCustomComboQuantityLimit = (record: Pick<CustomComboRecord, 'configMode' | 'minTotalQuantity' | 'maxTotalQuantity'>) =>
  record.configMode === 'flexible' ? `${record.minTotalQuantity} ~ ${record.maxTotalQuantity}` : '--';

const METHOD_GROUPS: MethodGroup[] = [
  {
    id: 'method-1',
    name: '配方做法组A',
    remark: '',
    tip: '',
    relationCount: 4,
    multi: false,
    optionType: '必选',
    values: [
      { id: 'mv-1', name: '050811', code: '050811' },
      { id: 'mv-2', name: '050812', code: '050812' },
      { id: 'mv-3', name: '050813', code: '050813' },
    ],
  },
  {
    id: 'method-2',
    name: '配方做法组B',
    remark: '',
    tip: '',
    relationCount: 0,
    multi: false,
    optionType: '必选',
    values: [],
  },
  {
    id: 'method-3',
    name: '测试做法组',
    remark: '',
    tip: '',
    relationCount: 0,
    multi: false,
    optionType: '非必选',
    values: [],
  },
];

const LABEL_TABS: Array<{ id: LabelTab; label: string }> = [
  { id: 'desc', label: '描述标签' },
  { id: 'stats', label: '统计标签' },
];

const LABEL_GROUPS: Record<LabelTab, LabelGroup[]> = {
  desc: [
    {
      id: 'label-group-1',
      groupName: '0910',
      labels: [
        { id: 'label-1', name: '0910图片', bgColor: '#1F5DD8', textColor: '#FFFFFF', createdAt: '2025-09-10 15:37:03' },
        { id: 'label-2', name: '0910文字', bgColor: '#D8F000', textColor: '#8BCF36', createdAt: '2025-09-10 15:36:45' },
      ],
    },
    { id: 'label-group-2', groupName: '口味描述', labels: [] },
    { id: 'label-group-3', groupName: '0416 描述标签', labels: [] },
  ],
  stats: [
    { id: 'stats-group-1', groupName: '热销统计', labels: [{ id: 'sl-1', name: '热卖', bgColor: '#ECFDF3', textColor: '#12B76A', createdAt: '2024-12-26 11:38:44' }] },
  ],
};

const BADGE_RECORDS: BadgeRecord[] = [
  { id: 'badge-1', name: '角标图片', bgColor: '#FFFFFF', effectText: '图片角标', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&q=80', validPeriod: '2025-09-01 00:00:00 - 2025-12-31 23:59:59', createdAt: '2025-09-10 15:49:30' },
  { id: 'badge-2', name: '角标中文', bgColor: '#2DB55D', effectText: '角标中文', validPeriod: '2025-09-10 00:00:00 - 2025-12-31 23:59:59', createdAt: '2025-09-10 15:48:12' },
  { id: 'badge-3', name: '新品', bgColor: '#FF1F1F', effectText: '新品', validPeriod: '2024-05-29 00:00:00 - 2024-12-31 23:59:59', createdAt: '2024-05-29 17:39:20' },
  { id: 'badge-4', name: '测试测试', bgColor: '#39F115', effectText: '测试测试', validPeriod: '2023-07-12 00:00:00 - 2023-12-31 23:59:59', createdAt: '2023-07-27 13:44:20' },
];

const SERIES_RECORDS: SeriesRecord[] = [
  { id: 'series-1', name: '橘子系列', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=120&q=80', relatedCount: 3, enabled: true },
  { id: 'series-2', name: '草莓系列', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=120&q=80', relatedCount: 5, enabled: true },
  { id: 'series-3', name: '新的系列商品', image: 'https://dummyimage.com/48x48/84cc16/ffffff&text=%E7%B3%BB', relatedCount: 10, enabled: true },
  { id: 'series-4', name: '测试测试', image: 'https://dummyimage.com/48x48/f59e0b/ffffff&text=%E7%B3%BB', relatedCount: 3, enabled: true },
];

const CUSTOM_COMBO_RECORDS: CustomComboRecord[] = [
  {
    id: 'cc-1',
    groupName: '0509随心配-3',
    groupCode: '1',
    remark: '0509随心配-3',
    productCode: '',
    barcode: '',
    configMode: 'pick',
    isRelativePrice: false,
    isRequired: true,
    requiredOptionCount: 1,
    minTotalQuantity: 1,
    maxTotalQuantity: 1,
    items: [createMockCustomComboItem(1), createMockCustomComboItem(2)],
    relatedCount: 0
  },
  {
    id: 'cc-2',
    groupName: '0509随心配-2',
    groupCode: '1',
    remark: '0509随心配-2',
    productCode: '',
    barcode: '',
    configMode: 'flexible',
    isRelativePrice: true,
    isRequired: false,
    requiredOptionCount: 1,
    minTotalQuantity: 0,
    maxTotalQuantity: 2,
    items: [createMockCustomComboItem(1), createMockCustomComboItem(2), createMockCustomComboItem(3)],
    relatedCount: 0
  },
  {
    id: 'cc-3',
    groupName: '0509随心配-1',
    groupCode: '1',
    remark: '0509随心配-1',
    productCode: '',
    barcode: '',
    configMode: 'pick',
    isRelativePrice: false,
    isRequired: true,
    requiredOptionCount: 2,
    minTotalQuantity: 2,
    maxTotalQuantity: 4,
    items: [createMockCustomComboItem(1), createMockCustomComboItem(2), createMockCustomComboItem(3), createMockCustomComboItem(4)],
    relatedCount: 0
  },
  {
    id: 'cc-4',
    groupName: '4月27-3选1',
    groupCode: '1',
    remark: '',
    productCode: '',
    barcode: '',
    configMode: 'pick',
    isRelativePrice: false,
    isRequired: true,
    requiredOptionCount: 1,
    minTotalQuantity: 1,
    maxTotalQuantity: 1,
    items: [createMockCustomComboItem(1), createMockCustomComboItem(2), createMockCustomComboItem(3)],
    relatedCount: 1
  },
  {
    id: 'cc-5',
    groupName: '0427可选分组-1',
    groupCode: '1',
    remark: '',
    productCode: '04270402',
    barcode: '04270401',
    configMode: 'flexible',
    isRelativePrice: true,
    isRequired: false,
    requiredOptionCount: 2,
    minTotalQuantity: 1,
    maxTotalQuantity: 3,
    items: [createMockCustomComboItem(1), createMockCustomComboItem(2), createMockCustomComboItem(3), createMockCustomComboItem(4), createMockCustomComboItem(5)],
    relatedCount: 1
  },
  {
    id: 'cc-6',
    groupName: '果茶随心配',
    groupCode: '1',
    remark: '',
    productCode: 'zfb123',
    barcode: '',
    configMode: 'flexible',
    isRelativePrice: false,
    isRequired: true,
    requiredOptionCount: 1,
    minTotalQuantity: 1,
    maxTotalQuantity: 2,
    items: [createMockCustomComboItem(1), createMockCustomComboItem(2), createMockCustomComboItem(3)],
    relatedCount: 2
  },
  {
    id: 'cc-7',
    groupName: '0330可选分组-3',
    groupCode: '1',
    remark: '',
    productCode: '',
    barcode: '',
    configMode: 'flexible',
    isRelativePrice: false,
    isRequired: false,
    requiredOptionCount: 1,
    minTotalQuantity: 0,
    maxTotalQuantity: 2,
    items: [createMockCustomComboItem(1), createMockCustomComboItem(2)],
    relatedCount: 2
  },
];

const ADDON_GROUPS: AddonGroup[] = [
  {
    id: 'addon-type-default',
    typeName: '默认类型(222)',
    sort: 0,
    productName: '',
    initialPrice: 0,
    relatedCount: 0,
    createdAt: '',
    enabled: true,
    children: [],
  },
  {
    id: 'addon-type-1',
    typeName: '0119加料-1(3)',
    sort: 0,
    productName: '',
    initialPrice: 0,
    relatedCount: 0,
    createdAt: '',
    enabled: true,
    children: [
      { id: 'addon-1', typeName: '0119加料-1(3)', sort: 0, productName: '', initialPrice: 0, relatedCount: 0, createdAt: '2026-05-09 14:22:48', enabled: true },
      { id: 'addon-2', typeName: '0119加料-3(2)', sort: 0, productName: '', initialPrice: 0, relatedCount: 0, createdAt: '2026-01-19 13:41:38', enabled: true },
      { id: 'addon-3', typeName: '0119加料-4(3)', sort: 0, productName: '', initialPrice: 0, relatedCount: 0, createdAt: '2026-01-19 13:41:44', enabled: true },
      { id: 'addon-4', typeName: '1126加料1(16)', sort: 0, productName: '', initialPrice: 0, relatedCount: 0, createdAt: '2025-11-26 15:28:12', enabled: true },
    ],
  },
];

const MASTER_ADDON_OPTIONS = [
  { id: 'master-addon-1', name: '椰果', type: '小料', price: 1, relatedCount: 18 },
  { id: 'master-addon-2', name: '珍珠', type: '小料', price: 1, relatedCount: 26 },
  { id: 'master-addon-3', name: '西柚粒', type: '水果加料', price: 2, relatedCount: 8 },
  { id: 'master-addon-4', name: '燕麦奶', type: '乳品替换', price: 3, relatedCount: 12 },
  { id: 'master-addon-5', name: '浓缩咖啡液', type: '咖啡加料', price: 2, relatedCount: 6 },
];

const INITIAL_DOUYIN_ADDONS: DouyinAddonRecord[] = [
  { id: 'dy-addon-1', name: '椰果', source: 'master', masterAddonId: 'master-addon-1', douyinCategory: '饮品 / 其他饮品', addonType: '小料', price: 1, status: 'synced', platformId: '1866969794974746', updatedAt: '2026-08-19 14:09' },
  { id: 'dy-addon-2', name: '珍珠', source: 'master', masterAddonId: 'master-addon-2', douyinCategory: '饮品 / 奶茶', addonType: '小料', price: 1, status: 'syncing', updatedAt: '2026-08-19 15:26' },
  { id: 'dy-addon-3', name: '西柚粒', source: 'master', masterAddonId: 'master-addon-3', douyinCategory: '饮品 / 果茶', addonType: '水果加料', price: 2, status: 'failed', updatedAt: '2026-08-18 18:42' },
  { id: 'dy-addon-4', name: '爆爆珠', source: 'platform', douyinCategory: '饮品 / 其他饮品', addonType: '小料', price: 2, status: 'not_synced', updatedAt: '2026-08-19 16:08' },
];

const tabs: Array<{ id: AttributeTab; label: string; icon: React.ReactNode }> = [
  { id: 'category', label: '商品分类', icon: <FolderTree size={16} /> },
  { id: 'spec', label: '规格管理', icon: <Layers3 size={16} /> },
  { id: 'method', label: '做法管理', icon: <ChefHat size={16} /> },
  { id: 'label', label: '标签管理', icon: <Tags size={16} /> },
  { id: 'badge', label: '角标管理', icon: <Tag size={16} /> },
  { id: 'series', label: '系列商品', icon: <Grid2X2 size={16} /> },
  { id: 'custom_attribute', label: '自定义属性', icon: <Braces size={16} /> },
  { id: 'custom_combo', label: '随心配管理', icon: <Heart size={16} /> },
  { id: 'addon', label: '加料', icon: <Blend size={16} /> },
];

type ProductAttributeScope = 'all' | 'master' | 'channel';

interface WebProductAttributeManagerProps {
  scope?: ProductAttributeScope;
  initialTab?: AttributeTab;
  onOpenSyncRecords?: () => void;
}

const MASTER_ATTRIBUTE_TABS: AttributeTab[] = ['category', 'spec', 'method', 'label', 'custom_combo', 'addon'];
const CHANNEL_ATTRIBUTE_TABS: AttributeTab[] = ['label', 'badge', 'series', 'custom_attribute', 'addon'];

export const WebProductAttributeManager: React.FC<WebProductAttributeManagerProps> = ({
  scope = 'all',
  initialTab,
  onOpenSyncRecords,
}) => {
  const visibleTabs = useMemo(
    () => tabs
      .filter(tab => (
        scope === 'all'
        || (scope === 'master' && MASTER_ATTRIBUTE_TABS.includes(tab.id))
        || (scope === 'channel' && CHANNEL_ATTRIBUTE_TABS.includes(tab.id))
      ))
      .map(tab => {
        if (tab.id === 'category') {
          return {
            ...tab,
            label: scope === 'master' ? '商品分类' : scope === 'channel' ? '前台分类' : '商品分类',
          };
        }
        if (tab.id === 'label') {
          return {
            ...tab,
            label: scope === 'master' ? '统计标签' : scope === 'channel' ? '描述标签' : '标签管理',
          };
        }
        if (tab.id === 'addon' && scope === 'channel') {
          return { ...tab, label: '抖音加料品' };
        }
        return tab;
      }),
    [scope],
  );
  const visibleLabelTabs = useMemo(
    () => LABEL_TABS.filter(tab => (
      scope === 'all'
      || (scope === 'master' && tab.id === 'stats')
      || (scope === 'channel' && tab.id === 'desc')
    )),
    [scope],
  );
  const [activeTab, setActiveTab] = useState<AttributeTab>(
    initialTab || 'category',
  );
  const [activeLabelTab, setActiveLabelTab] = useState<LabelTab>(scope === 'master' ? 'stats' : 'desc');
  const [keyword, setKeyword] = useState('');
  const [showFieldOwnership, setShowFieldOwnership] = useState(false);
  const [labelGroups, setLabelGroups] = useState<Record<LabelTab, LabelGroup[]>>(LABEL_GROUPS);
  const [badges, setBadges] = useState<BadgeRecord[]>(BADGE_RECORDS);
  const [seriesRecords, setSeriesRecords] = useState<SeriesRecord[]>(SERIES_RECORDS);
  const [channelLibraryEditor, setChannelLibraryEditor] = useState<ChannelLibraryEditorState | null>(null);
  const [channelLibraryDelete, setChannelLibraryDelete] = useState<ChannelLibraryDeleteState | null>(null);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>(SPEC_GROUPS);
  const [specNameInput, setSpecNameInput] = useState('');
  const [specNameFilter, setSpecNameFilter] = useState('');
  const [showSpecColumnPanel, setShowSpecColumnPanel] = useState(false);
  const [specColumnKeyword, setSpecColumnKeyword] = useState('');
  const [visibleSpecColumns, setVisibleSpecColumns] = useState<Record<SpecColumnKey, boolean>>(DEFAULT_VISIBLE_SPEC_COLUMNS);
  const [specEditor, setSpecEditor] = useState<SpecEditorState | null>(null);
  const [specValueEditor, setSpecValueEditor] = useState<SpecValueEditorState | null>(null);
  const [specDeleteDialog, setSpecDeleteDialog] = useState<SpecDeleteDialogState | null>(null);
  const [specProductsViewer, setSpecProductsViewer] = useState<SpecLinkedProductsViewer | null>(null);
  const [customComboRecords, setCustomComboRecords] = useState<CustomComboRecord[]>(CUSTOM_COMBO_RECORDS);
  const [customComboEditor, setCustomComboEditor] = useState<CustomComboEditorState | null>(null);
  const [expandedSpecGroups, setExpandedSpecGroups] = useState<Set<string>>(
    () => new Set(SPEC_GROUPS.filter(group => group.values.length > 0).map(group => group.id))
  );
  const [expandedMethodGroups, setExpandedMethodGroups] = useState<Set<string>>(
    () => new Set(METHOD_GROUPS.filter(group => group.values.length > 0).map(group => group.id))
  );
  const [expandedLabelGroups, setExpandedLabelGroups] = useState<Set<string>>(
    () => new Set(LABEL_GROUPS.desc.filter(group => group.labels.length > 0).map(group => group.id))
  );
  const [expandedAddonGroups, setExpandedAddonGroups] = useState<Set<string>>(
    () => new Set(ADDON_GROUPS.filter(group => (group.children?.length || 0) > 0).map(group => group.id))
  );
  const [actionNotice, setActionNotice] = useState('');
  const [showDouyinAddonSyncDialog, setShowDouyinAddonSyncDialog] = useState(false);
  const [showDouyinAddonCreateMenu, setShowDouyinAddonCreateMenu] = useState(false);
  const [douyinAddonEditor, setDouyinAddonEditor] = useState<DouyinAddonEditorState | null>(null);
  const [douyinAddons, setDouyinAddons] = useState<DouyinAddonRecord[]>(INITIAL_DOUYIN_ADDONS);
  const [selectedDouyinAddonIds, setSelectedDouyinAddonIds] = useState<string[]>([]);
  const [douyinAddonStatusFilter, setDouyinAddonStatusFilter] = useState<'all' | DouyinAddonStatus>('all');
  const showActionNotice = (text: string) => { setActionNotice(text); window.setTimeout(() => setActionNotice(''), 2600); };

  const saveDouyinAddonEditor = (syncAfterSave: boolean) => {
    if (!douyinAddonEditor) return;
    if (douyinAddonEditor.mode === 'master') {
      const selectedOptions = MASTER_ADDON_OPTIONS.filter(option => douyinAddonEditor.selectedIds.includes(option.id));
      const missingCategory = selectedOptions.some(option => !douyinAddonEditor.categories[option.id]);
      if (selectedOptions.length === 0 || missingCategory) {
        showActionNotice(selectedOptions.length === 0 ? '请至少选择一个主档加料' : '请为已选加料维护抖音商品分类');
        return;
      }
      const existingMasterIds = new Set(douyinAddons.map(item => item.masterAddonId).filter(Boolean));
      const additions = selectedOptions.filter(option => !existingMasterIds.has(option.id)).map((option, index) => ({
        id: `dy-addon-master-${Date.now()}-${index}`,
        name: option.name,
        source: 'master' as const,
        masterAddonId: option.id,
        douyinCategory: douyinAddonEditor.categories[option.id],
        addonType: option.type,
        price: option.price,
        status: syncAfterSave ? 'syncing' as const : 'not_synced' as const,
        updatedAt: '2026-08-19 16:30',
      }));
      setDouyinAddons(current => [...current, ...additions]);
      setDouyinAddonEditor(null);
      showActionNotice(syncAfterSave ? `已添加 ${additions.length} 个加料并创建抖音同步任务` : `已添加 ${additions.length} 个抖音加料品，状态为待同步`);
      return;
    }
    if (!douyinAddonEditor.name.trim() || !douyinAddonEditor.category || !douyinAddonEditor.addonType || douyinAddonEditor.price === '') {
      showActionNotice('请完整填写加料名称、抖音商品分类、加料类型和实付价');
      return;
    }
    const addition: DouyinAddonRecord = {
      id: douyinAddonEditor.recordId || `dy-addon-platform-${Date.now()}`,
      name: douyinAddonEditor.name.trim(),
      source: 'platform',
      douyinCategory: douyinAddonEditor.category,
      addonType: douyinAddonEditor.addonType,
      price: Number(douyinAddonEditor.price),
      status: syncAfterSave ? 'syncing' : 'not_synced',
      updatedAt: '2026-08-19 16:30',
    };
    setDouyinAddons(current => douyinAddonEditor.recordId
      ? current.map(item => item.id === douyinAddonEditor.recordId
        ? { ...item, ...addition, source: item.source, masterAddonId: item.masterAddonId }
        : item)
      : [...current, addition]);
    setDouyinAddonEditor(null);
    showActionNotice(syncAfterSave
      ? `${douyinAddonEditor.recordId ? '已保存' : '已创建'}加料品并提交抖音同步任务`
      : `${douyinAddonEditor.recordId ? '已保存抖音加料资料' : '已创建平台加料品，状态为待同步'}`);
  };

  const syncSelectedDouyinAddons = () => {
    const targetIds = selectedDouyinAddonIds.length
      ? selectedDouyinAddonIds
      : douyinAddons.filter(item => item.status === 'not_synced' || item.status === 'failed').map(item => item.id);
    if (targetIds.length === 0) {
      showActionNotice('当前没有可同步的抖音加料品');
      return;
    }
    setSelectedDouyinAddonIds(targetIds);
    setShowDouyinAddonSyncDialog(true);
  };

  const selectedDouyinAddons = douyinAddons.filter(item => selectedDouyinAddonIds.includes(item.id));

  useEffect(() => {
    if (!visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'category');
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (initialTab && visibleTabs.some(tab => tab.id === initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab, visibleTabs]);

  useEffect(() => {
    if (!visibleLabelTabs.some(tab => tab.id === activeLabelTab)) {
      setActiveLabelTab(visibleLabelTabs[0]?.id || 'desc');
    }
  }, [activeLabelTab, visibleLabelTabs]);

  useEffect(() => {
    setExpandedLabelGroups(new Set(
      labelGroups[activeLabelTab]
        .filter(group => group.labels.length > 0)
        .map(group => group.id),
    ));
  }, [activeLabelTab, labelGroups]);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const normalizedSpecName = specNameFilter.trim().toLowerCase();

  const filteredSpecGroups = useMemo(() => {
    if (!normalizedSpecName) return specGroups;
    return specGroups.filter(group => group.name.toLowerCase().includes(normalizedSpecName));
  }, [normalizedSpecName, specGroups]);

  const filteredMethodGroups = useMemo(() => {
    if (!normalizedKeyword) return METHOD_GROUPS;
    return METHOD_GROUPS.filter(group => [group.name, group.optionType, ...group.values.map(value => `${value.name} ${value.code}`)].join(' ').toLowerCase().includes(normalizedKeyword));
  }, [normalizedKeyword]);

  const filteredLabelGroups = useMemo(() => {
    const source = labelGroups[activeLabelTab];
    if (!normalizedKeyword) return source;
    return source.filter(group => [group.groupName, ...group.labels.map(label => label.name)].join(' ').toLowerCase().includes(normalizedKeyword));
  }, [activeLabelTab, labelGroups, normalizedKeyword]);

  const filteredBadges = useMemo(() => {
    if (!normalizedKeyword) return badges;
    return badges.filter(item => [item.name, item.effectText].join(' ').toLowerCase().includes(normalizedKeyword));
  }, [badges, normalizedKeyword]);

  const filteredSeries = useMemo(() => {
    if (!normalizedKeyword) return seriesRecords;
    return seriesRecords.filter(item => item.name.toLowerCase().includes(normalizedKeyword));
  }, [normalizedKeyword, seriesRecords]);

  const filteredCustomCombos = useMemo(() => {
    if (!normalizedKeyword) return customComboRecords;
    return customComboRecords.filter(item =>
      [
        item.groupName,
        item.groupCode,
        item.remark,
        item.productCode,
        item.barcode,
        getCustomComboModeLabel(item.configMode),
        getCustomComboOptionRule(item),
        getCustomComboRequiredLabel(item),
        getCustomComboQuantityLimit(item)
      ].join(' ').toLowerCase().includes(normalizedKeyword)
    );
  }, [customComboRecords, normalizedKeyword]);

  const filteredAddonGroups = useMemo(() => {
    if (!normalizedKeyword) return ADDON_GROUPS;
    return ADDON_GROUPS
      .map(group => {
        if (!group.children?.length) return group;
        const children = group.children.filter(item => item.typeName.toLowerCase().includes(normalizedKeyword));
        if (children.length > 0 || group.typeName.toLowerCase().includes(normalizedKeyword)) {
          return { ...group, children };
        }
        return null;
      })
      .filter(Boolean) as AddonGroup[];
  }, [normalizedKeyword]);

  const placeholderMap: Record<AttributeTab, string> = {
    category: '搜索分类名称',
    spec: '搜索规格名称',
    method: '搜索做法名称',
    label: '搜索标签分组/标签',
    badge: '搜索角标名称',
    series: '搜索系列名称',
    custom_attribute: '搜索自定义属性',
    custom_combo: '搜索分组名称/商品标识',
    addon: '请输入加料名称',
  };

  const buttonLabelMap: Record<AttributeTab, string> = {
    category: scope === 'master' ? '新增商品分类' : scope === 'channel' ? '新增前台分类' : '新增商品分类',
    spec: '新增规格',
    method: '新增做法',
    label: activeLabelTab === 'desc' ? '新建标签分组' : '新增标签',
    badge: '新增角标',
    series: '创建系列',
    custom_attribute: '新增属性',
    custom_combo: '创建分组',
    addon: '创建加料',
  };

  const pageMeta = scope === 'channel'
    ? {
        title: '渠道属性',
        description: '维护渠道商品的展示标签和渠道扩展属性；前台分类定义来自商品主档，渠道商品可在资料页调整当前商品库的分类归属。',
        badge: '分渠道协作',
        facts: [
          ['资料责任', '渠道团队'],
          ['继承来源', '商品主档'],
          ['适用对象', '授权渠道商品库'],
          ['结构变更', '跟随主档确认'],
        ],
      }
    : scope === 'master'
      ? {
          title: '分类与属性',
          description: '维护商品主档的前台分类定义与默认归属、后台分类、规格、做法、统计标签和候选关系；渠道商品可按商品库覆盖前台分类归属。',
          badge: '分渠道协作',
          facts: [
            ['资料责任', '商品团队'],
            ['管理对象', '商品主档'],
            ['下游关系', '渠道商品继承'],
            ['结构变更', '生成渠道确认'],
          ],
        }
      : {
          title: '分类与属性',
          description: '在统一入口维护商品结构与默认售卖属性，保存后按目标渠道生成对应资料。',
          badge: '统一维护',
          facts: [
            ['资料责任', '商品团队'],
            ['管理对象', '商品与默认售卖资料'],
            ['适用范围', '已启用渠道'],
            ['保存结果', '生成待发布差异'],
          ],
        };

  const toggleExpanded = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string
  ) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearchSpecs = () => {
    setSpecNameFilter(specNameInput.trim());
  };

  const handleResetSpecs = () => {
    setSpecNameInput('');
    setSpecNameFilter('');
  };

  const handleOpenCreateSpec = () => {
    setSpecEditor({
      mode: 'create',
      name: '',
      description: '',
      values: [createEmptySpecValue()],
    });
  };

  const handleOpenEditSpec = (group: SpecGroup) => {
    setSpecEditor({
      mode: 'edit',
      groupId: group.id,
      name: group.name,
      description: group.description,
      values: group.values.length ? group.values.map(value => ({ ...value })) : [createEmptySpecValue()],
    });
  };

  const handleOpenSpecValueEditor = (group: SpecGroup) => {
    setSpecValueEditor({
      groupId: group.id,
      groupName: group.name,
      values: group.values.length ? group.values.map(value => ({ ...value })) : [createEmptySpecValue()],
    });
  };

  const handleSaveSpecEditor = () => {
    if (!specEditor) return;

    const nextName = specEditor.name.trim() || '未命名规格';
    const nextDescription = specEditor.description.trim();
    const nextValues = specEditor.values
      .map(value => ({
        ...value,
        name: value.name.trim(),
        code: value.code.trim(),
      }))
      .filter(value => value.name || value.code);

    if (specEditor.mode === 'create') {
      const nextGroupId = `spec-${Date.now()}`;
      setSpecGroups(prev => [
        {
          id: nextGroupId,
          name: nextName,
          description: nextDescription,
          relatedProducts: [],
          values: nextValues,
        },
        ...prev,
      ]);
      if (nextValues.length) {
        setExpandedSpecGroups(prev => new Set([nextGroupId, ...prev]));
      }
    } else if (specEditor.groupId) {
      setSpecGroups(prev =>
        prev.map(group =>
          group.id === specEditor.groupId
            ? {
                ...group,
                name: nextName,
                description: nextDescription,
                values: nextValues,
              }
            : group
        )
      );
      setExpandedSpecGroups(prev => {
        const next = new Set(prev);
        if (nextValues.length) next.add(specEditor.groupId!);
        else next.delete(specEditor.groupId!);
        return next;
      });
    }

    setSpecEditor(null);
  };

  const handleSaveSpecValueEditor = () => {
    if (!specValueEditor) return;

    const nextValues = specValueEditor.values
      .map(value => ({
        ...value,
        name: value.name.trim(),
        code: value.code.trim(),
      }))
      .filter(value => value.name || value.code);

    setSpecGroups(prev =>
      prev.map(group =>
        group.id === specValueEditor.groupId
          ? {
              ...group,
              values: nextValues,
            }
          : group
      )
    );
    setExpandedSpecGroups(prev => {
      const next = new Set(prev);
      if (nextValues.length) next.add(specValueEditor.groupId);
      else next.delete(specValueEditor.groupId);
      return next;
    });
    setSpecValueEditor(null);
  };

  const handleRequestDeleteSpec = (group: SpecGroup) => {
    if (group.relatedProducts.length > 0) {
      setSpecDeleteDialog({
        mode: 'blocked',
        targetType: 'group',
        groupId: group.id,
        groupName: group.name,
        relationCount: group.relatedProducts.length,
      });
      return;
    }

    setSpecDeleteDialog({
      mode: 'confirm',
      targetType: 'group',
      groupId: group.id,
      groupName: group.name,
    });
  };

  const handleRequestDeleteSpecValue = (group: SpecGroup, value: SpecValue) => {
    if (value.relatedProducts.length > 0) {
      setSpecDeleteDialog({
        mode: 'blocked',
        targetType: 'value',
        groupId: group.id,
        groupName: group.name,
        valueId: value.id,
        valueName: value.name,
        relationCount: value.relatedProducts.length,
      });
      return;
    }

    setSpecDeleteDialog({
      mode: 'confirm',
      targetType: 'value',
      groupId: group.id,
      groupName: group.name,
      valueId: value.id,
      valueName: value.name,
    });
  };

  const handleConfirmDeleteSpec = () => {
    if (!specDeleteDialog || specDeleteDialog.mode !== 'confirm') return;

    if (specDeleteDialog.targetType === 'group') {
      setSpecGroups(prev => prev.filter(group => group.id !== specDeleteDialog.groupId));
      setExpandedSpecGroups(prev => {
        const next = new Set(prev);
        next.delete(specDeleteDialog.groupId);
        return next;
      });
      setSpecDeleteDialog(null);
      return;
    }

    let shouldCollapse = false;
    setSpecGroups(prev =>
      prev.map(group => {
        if (group.id !== specDeleteDialog.groupId) return group;
        const nextValues = group.values.filter(value => value.id !== specDeleteDialog.valueId);
        shouldCollapse = nextValues.length === 0;
        return {
          ...group,
          values: nextValues,
        };
      })
    );
    if (shouldCollapse) {
      setExpandedSpecGroups(prev => {
        const next = new Set(prev);
        next.delete(specDeleteDialog.groupId);
        return next;
      });
    }
    setSpecDeleteDialog(null);
  };

  const handleOpenSpecProducts = (title: string, products: LinkedSpecProduct[]) => {
    setSpecProductsViewer({ title, products });
  };

  const handleOpenCreateCustomCombo = () => {
    setCustomComboEditor(createEmptyCustomComboEditor());
  };

  const handleOpenEditCustomCombo = (record: CustomComboRecord) => {
    setCustomComboEditor({
      mode: 'edit',
      id: record.id,
      groupName: record.groupName,
      groupCode: record.groupCode,
      remark: record.remark,
      productCode: record.productCode,
      barcode: record.barcode,
      configMode: record.configMode,
      isRelativePrice: record.isRelativePrice,
      isRequired: record.isRequired,
      requiredOptionCount: record.requiredOptionCount,
      minTotalQuantity: record.minTotalQuantity,
      maxTotalQuantity: record.maxTotalQuantity,
      items: record.items.map(item => ({ ...item })),
      relatedCount: record.relatedCount,
    });
  };

  const handleCopyCustomCombo = (record: CustomComboRecord) => {
    setCustomComboEditor({
      ...createEmptyCustomComboEditor(),
      mode: 'create',
      groupName: `${record.groupName}-复制`,
      groupCode: record.groupCode,
      remark: record.remark,
      productCode: record.productCode,
      barcode: record.barcode,
      configMode: record.configMode,
      isRelativePrice: record.isRelativePrice,
      isRequired: record.isRequired,
      requiredOptionCount: record.requiredOptionCount,
      minTotalQuantity: record.minTotalQuantity,
      maxTotalQuantity: record.maxTotalQuantity,
      items: record.items.map(item => ({ ...item, id: `custom-combo-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` })),
      relatedCount: 0,
    });
  };

  const handleDeleteCustomCombo = (record: CustomComboRecord) => {
    const confirmed = window.confirm(`确认删除随心配分组“${record.groupName}”吗？删除后不可恢复。`);
    if (!confirmed) return;
    setCustomComboRecords(prev => prev.filter(item => item.id !== record.id));
  };

  const handleSaveCustomCombo = () => {
    if (!customComboEditor) return;
    const groupName = customComboEditor.groupName.trim() || '未命名分组';
    const items = customComboEditor.items.filter(item => item.name.trim());
    const normalizedRequiredOptionCount = Math.min(Math.max(1, customComboEditor.requiredOptionCount || 1), Math.max(items.length, 1));
    const minFloor = customComboEditor.configMode === 'flexible' && customComboEditor.isRequired ? 1 : 0;
    const normalizedMinTotalQuantity = Math.max(minFloor, customComboEditor.minTotalQuantity || 0);
    const normalizedMaxTotalQuantity = Math.min(100, Math.max(normalizedMinTotalQuantity, customComboEditor.maxTotalQuantity || 100));
    const nextRecord: CustomComboRecord = {
      id: customComboEditor.id || `cc-${Date.now()}`,
      groupName,
      groupCode: customComboEditor.groupCode.trim(),
      remark: customComboEditor.remark.trim(),
      productCode: customComboEditor.productCode.trim(),
      barcode: customComboEditor.barcode.trim(),
      configMode: customComboEditor.configMode,
      isRelativePrice: customComboEditor.isRelativePrice,
      isRequired: customComboEditor.isRequired,
      requiredOptionCount: normalizedRequiredOptionCount,
      minTotalQuantity: customComboEditor.configMode === 'flexible' ? normalizedMinTotalQuantity : 0,
      maxTotalQuantity: customComboEditor.configMode === 'flexible' ? normalizedMaxTotalQuantity : 100,
      items: items.length ? items : [createMockCustomComboItem()],
      relatedCount: customComboEditor.relatedCount,
    };

    if (customComboEditor.mode === 'edit' && customComboEditor.id) {
      setCustomComboRecords(prev => prev.map(item => item.id === customComboEditor.id ? nextRecord : item));
    } else {
      setCustomComboRecords(prev => [nextRecord, ...prev]);
    }
    setCustomComboEditor(null);
  };

  const openPrimaryChannelLibraryEditor = () => {
    if (activeTab === 'label') {
      setChannelLibraryEditor({ kind: 'label_group', mode: 'create', groupName: '' });
    } else if (activeTab === 'badge') {
      setChannelLibraryEditor({ kind: 'badge', mode: 'create', name: '', bgColor: '#2DB55D', effectText: '', image: '', validPeriod: '' });
    } else if (activeTab === 'series') {
      setChannelLibraryEditor({ kind: 'series', mode: 'create', name: '', image: '', enabled: true, relatedCount: 0 });
    }
  };

  const saveChannelLibraryEditor = () => {
    if (!channelLibraryEditor) return;

    if (channelLibraryEditor.kind === 'label_group') {
      const groupName = channelLibraryEditor.groupName.trim();
      if (!groupName) return;
      setLabelGroups(prev => {
        const source = prev[activeLabelTab];
        const next = channelLibraryEditor.mode === 'edit' && channelLibraryEditor.groupId
          ? source.map(group => group.id === channelLibraryEditor.groupId ? { ...group, groupName } : group)
          : [{ id: `label-group-${Date.now()}`, groupName, labels: [] }, ...source];
        return { ...prev, [activeLabelTab]: next };
      });
    }

    if (channelLibraryEditor.kind === 'label') {
      const name = channelLibraryEditor.name.trim();
      if (!name) return;
      setLabelGroups(prev => ({
        ...prev,
        [activeLabelTab]: prev[activeLabelTab].map(group => {
          if (group.id !== channelLibraryEditor.groupId) return group;
          const nextLabel = {
            id: channelLibraryEditor.labelId || `label-${Date.now()}`,
            name,
            bgColor: channelLibraryEditor.bgColor,
            textColor: channelLibraryEditor.textColor,
            createdAt: channelLibraryEditor.mode === 'edit'
              ? group.labels.find(item => item.id === channelLibraryEditor.labelId)?.createdAt || new Date().toLocaleString('zh-CN', { hour12: false })
              : new Date().toLocaleString('zh-CN', { hour12: false }),
          };
          return {
            ...group,
            labels: channelLibraryEditor.mode === 'edit'
              ? group.labels.map(item => item.id === channelLibraryEditor.labelId ? nextLabel : item)
              : [nextLabel, ...group.labels],
          };
        }),
      }));
      setExpandedLabelGroups(prev => new Set([...prev, channelLibraryEditor.groupId]));
    }

    if (channelLibraryEditor.kind === 'badge') {
      const name = channelLibraryEditor.name.trim();
      if (!name) return;
      const nextRecord: BadgeRecord = {
        id: channelLibraryEditor.id || `badge-${Date.now()}`,
        name,
        bgColor: channelLibraryEditor.bgColor,
        effectText: channelLibraryEditor.effectText.trim() || name,
        image: channelLibraryEditor.image.trim() || undefined,
        validPeriod: channelLibraryEditor.validPeriod.trim() || '长期有效',
        createdAt: channelLibraryEditor.mode === 'edit'
          ? badges.find(item => item.id === channelLibraryEditor.id)?.createdAt || new Date().toLocaleString('zh-CN', { hour12: false })
          : new Date().toLocaleString('zh-CN', { hour12: false }),
      };
      setBadges(prev => channelLibraryEditor.mode === 'edit'
        ? prev.map(item => item.id === channelLibraryEditor.id ? nextRecord : item)
        : [nextRecord, ...prev]);
    }

    if (channelLibraryEditor.kind === 'series') {
      const name = channelLibraryEditor.name.trim();
      if (!name) return;
      const nextRecord: SeriesRecord = {
        id: channelLibraryEditor.id || `series-${Date.now()}`,
        name,
        image: channelLibraryEditor.image.trim() || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=120&q=80',
        enabled: channelLibraryEditor.enabled,
        relatedCount: channelLibraryEditor.relatedCount,
      };
      setSeriesRecords(prev => channelLibraryEditor.mode === 'edit'
        ? prev.map(item => item.id === channelLibraryEditor.id ? nextRecord : item)
        : [nextRecord, ...prev]);
    }

    setChannelLibraryEditor(null);
  };

  const confirmChannelLibraryDelete = () => {
    if (!channelLibraryDelete || channelLibraryDelete.blockedCount) return;
    if (channelLibraryDelete.kind === 'label_group') {
      setLabelGroups(prev => ({ ...prev, [activeLabelTab]: prev[activeLabelTab].filter(group => group.id !== channelLibraryDelete.id) }));
    } else if (channelLibraryDelete.kind === 'label' && channelLibraryDelete.parentId) {
      setLabelGroups(prev => ({
        ...prev,
        [activeLabelTab]: prev[activeLabelTab].map(group => group.id === channelLibraryDelete.parentId
          ? { ...group, labels: group.labels.filter(label => label.id !== channelLibraryDelete.id) }
          : group),
      }));
    } else if (channelLibraryDelete.kind === 'badge') {
      setBadges(prev => prev.filter(item => item.id !== channelLibraryDelete.id));
    } else if (channelLibraryDelete.kind === 'series') {
      setSeriesRecords(prev => prev.filter(item => item.id !== channelLibraryDelete.id));
    }
    setChannelLibraryDelete(null);
  };

  return (
    <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F6FA]">
      {actionNotice && <div className="absolute left-1/2 top-3 z-[120] -translate-x-1/2 rounded-md bg-[#1D2129] px-4 py-2 text-[13px] text-white shadow-lg">{actionNotice}</div>}
      <div className="flex h-[52px] shrink-0 items-stretch border-b border-[#E5E7EB] bg-white px-4">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist" aria-label={pageMeta.title}>
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex h-full min-w-[112px] shrink-0 items-center justify-center gap-2 border-b-2 px-3 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#00B460] bg-[#F5FCF8] text-[#008F4C]'
                    : 'border-transparent bg-white text-[#667085] hover:bg-[#F7F8FA] hover:text-[#333]'
                }`}
              >
                  <div className={activeTab === tab.id ? 'text-[#008F4C]' : 'text-[#8C8C8C]'}>
                    {tab.icon}
                  </div>
                  <div className="whitespace-nowrap text-[13px] font-medium">{tab.label}</div>
              </button>
            ))}
        </div>
        <button type="button" onClick={() => setShowFieldOwnership(true)} className="my-2 ml-3 shrink-0 rounded-md border border-[#D9DDE3] bg-white px-3 text-[12px] font-medium text-[#4E5969] hover:border-[#9AA2AE] hover:bg-[#F7F8FA]">字段归属</button>
      </div>

      {activeTab === 'category' && (
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="flex h-full min-h-0 overflow-hidden rounded-lg bg-white shadow-sm">
            <WebCategoryListManager
              scope={scope === 'master' ? 'all' : scope === 'channel' ? 'frontend' : 'all'}
            />
          </div>
        </div>
      )}

      <div className={activeTab === 'category' ? 'hidden' : 'flex-1 overflow-auto p-4'}>
        <div className="min-h-full rounded-lg bg-white shadow-sm">
          {activeTab === 'label' && visibleLabelTabs.length > 1 && (
            <div className="border-b border-[#E8E8E8] px-6 pt-3">
              <div className="flex gap-8 text-sm">
                {visibleLabelTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLabelTab(tab.id)}
                    className={`border-b-2 pb-3 transition-colors ${activeLabelTab === tab.id ? 'border-[#00C06B] text-[#00C06B] font-bold' : 'border-transparent text-[#666]'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom_attribute' ? null : activeTab === 'addon' ? (
            <div className="border-b border-[#E8E8E8] px-6 py-4">
              {scope === 'channel' && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-[#D9EFE4] bg-[#F5FCF8] px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-[#1D2129]">抖音在线点加料品</div>
                    <div className="mt-1 text-xs text-[#667085]">维护平台专属资料和品牌级同步状态；商品与加料的关联关系在下发门店点单品时处理。</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#667085]">共 {douyinAddons.length} 个</span>
                    <span className="text-[#008F4C]">已同步 {douyinAddons.filter(item => item.status === 'synced').length}</span>
                    <span className="text-[#C76600]">待同步 {douyinAddons.filter(item => item.status === 'not_synced').length}</span>
                    <span className="text-[#D9363E]">失败 {douyinAddons.filter(item => item.status === 'failed').length}</span>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder={placeholderMap[activeTab]}
                    className="h-[38px] w-[220px] rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#333] outline-none focus:border-[#00C06B]"
                  />
                  <div className="flex items-center gap-2 text-sm text-[#666]">
                    <span>{scope === 'channel' ? '同步状态' : '是否启用'}</span>
                    <span>=</span>
                    <select value={scope === 'channel' ? douyinAddonStatusFilter : undefined} onChange={event => scope === 'channel' && setDouyinAddonStatusFilter(event.target.value as 'all' | DouyinAddonStatus)} className="h-[38px] w-[120px] rounded-lg border border-[#E8E8E8] bg-white px-3 outline-none focus:border-[#00C06B]">
                      {scope === 'channel' ? <><option value="all">全部状态</option><option value="not_synced">待同步</option><option value="syncing">同步中</option><option value="synced">已同步</option><option value="failed">同步失败</option></> : <><option>启售</option><option>停用</option></>}
                    </select>
                  </div>
                  <button onClick={() => showActionNotice('加料列表已按当前条件刷新')} className="rounded-lg bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">查询</button>
                  <button onClick={() => { setKeyword(''); setDouyinAddonStatusFilter('all'); }} className="rounded-lg border border-[#E8E8E8] px-5 py-2.5 text-sm text-[#666] hover:bg-[#FAFAFA]">重置</button>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => showActionNotice('加料类型排序管理已打开；拖动能力需接入真实排序接口')} className="rounded-lg border border-[#E8E8E8] px-4 py-2.5 text-sm text-[#666] hover:bg-[#FAFAFA]">排序管理</button>
                  {scope === 'channel' ? (
                    <>
                      <button onClick={onOpenSyncRecords} className="rounded-lg border border-[#D9DDE7] bg-white px-4 py-2.5 text-sm font-bold text-[#5B6475] hover:bg-[#FAFAFA]">同步记录</button>
                      <button onClick={syncSelectedDouyinAddons} className="rounded-lg border border-[#00C06B] bg-white px-4 py-2.5 text-sm font-bold text-[#008F4C] hover:bg-[#F3FCF7]">同步抖音在线点{selectedDouyinAddonIds.length ? `（${selectedDouyinAddonIds.length}）` : ''}</button>
                      <div className="relative">
                        <button onClick={() => setShowDouyinAddonCreateMenu(value => !value)} className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">添加抖音加料品</button>
                        {showDouyinAddonCreateMenu && (
                          <div className="absolute right-0 top-[42px] z-50 w-[260px] overflow-hidden rounded-md border border-[#E5E6EB] bg-white py-1 text-left shadow-xl">
                            <button type="button" onClick={() => { setShowDouyinAddonCreateMenu(false); setDouyinAddonEditor({ mode: 'master', selectedIds: [], categories: {} }); }} className="block w-full px-4 py-3 hover:bg-[#F7F8FA]"><strong className="block text-sm text-[#1D2129]">从主档加料添加</strong><span className="mt-1 block text-xs text-[#86909C]">复用主档名称、类型与价格，补充抖音商品分类</span></button>
                            <button type="button" onClick={() => { setShowDouyinAddonCreateMenu(false); setDouyinAddonEditor({ mode: 'platform', name: '', category: '', addonType: '', price: '0' }); }} className="block w-full border-t border-[#F0F1F2] px-4 py-3 hover:bg-[#F7F8FA]"><strong className="block text-sm text-[#1D2129]">直接创建平台加料品</strong><span className="mt-1 block text-xs text-[#86909C]">只填写抖音需要的精简资料，不生成主档加料</span></button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <button onClick={() => showActionNotice('创建加料沿用现有加料商品字段，正式编辑器需接入商品创建流程')} className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">创建加料</button>
                      <button onClick={() => showActionNotice('发布加料类型将进入发布中心，不会在当前页直接下发')} className="rounded-lg border border-[#00C06B] bg-white px-4 py-2.5 text-sm font-bold text-[#008F4C] hover:bg-[#F3FCF7]">发布加料类型</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'spec' ? (
            <div className="flex items-center justify-between gap-4 border-b border-[#E8E8E8] px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#666]">规格名称</span>
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                  <input
                    value={specNameInput}
                    onChange={e => setSpecNameInput(e.target.value)}
                    placeholder="请输入"
                    className="h-[38px] w-[220px] rounded-lg border border-[#E8E8E8] bg-white pl-[72px] pr-10 text-sm text-[#333] outline-none focus:border-[#00C06B]"
                  />
                </div>
                <button onClick={handleSearchSpecs} className="rounded-lg bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">搜索</button>
                <button onClick={handleResetSpecs} className="rounded-lg border border-[#D9DDE7] bg-white px-5 py-2.5 text-sm font-bold text-[#5B6475] hover:bg-[#FAFAFA]">重置</button>
              </div>

              <div className="relative flex items-center gap-3">
                <button
                  onClick={() => setShowSpecColumnPanel(prev => !prev)}
                  className="inline-flex items-center rounded-lg border border-[#E8E8E8] bg-white px-3 py-2.5 text-sm font-medium text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]"
                >
                  <ListFilter size={14} />
                </button>
                {showSpecColumnPanel && (
                  <SpecColumnPanel
                    keyword={specColumnKeyword}
                    visibleColumns={visibleSpecColumns}
                    onChangeKeyword={setSpecColumnKeyword}
                    onToggleColumn={key => setVisibleSpecColumns(prev => ({ ...prev, [key]: !prev[key] }))}
                  />
                )}
                <button onClick={handleOpenCreateSpec} className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">新增规格</button>
              </div>
            </div>
          ) : (
          <div className="flex items-center justify-between gap-4 border-b border-[#E8E8E8] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder={placeholderMap[activeTab]}
                  className="h-[38px] w-[180px] rounded-lg border border-[#E8E8E8] bg-white pl-9 pr-3 text-sm text-[#333] outline-none focus:border-[#00C06B]"
                />
              </div>
              <button onClick={() => showActionNotice('当前页已显示该类型全部可用筛选项')} className="inline-flex items-center rounded-lg border border-[#E8E8E8] px-4 py-2.5 text-sm font-bold text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]">
                <Filter size={14} className="mr-1.5 text-[#999]" />
                筛选
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => showActionNotice('列表字段显示设置已按默认方案展示')} className="inline-flex items-center rounded-lg border border-[#E8E8E8] bg-white px-3 py-2.5 text-sm font-medium text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]">
                <ListFilter size={14} />
              </button>
              {activeTab === 'label' && <button onClick={() => showActionNotice('标签排序修改将在保存后应用到商品选择器')} className="rounded-lg border border-[#E8E8E8] px-4 py-2.5 text-sm font-bold text-[#666] hover:bg-[#FAFAFA]">排序管理</button>}
              {activeTab === 'custom_combo' && <button onClick={() => showActionNotice('已按当前 2 个条件筛选随心配方案')} className="rounded-lg border border-[#00C06B] bg-[#F3FCF7] px-4 py-2.5 text-sm font-bold text-[#00C06B] hover:bg-[#EAF9F1]">筛选(2)</button>}
              <button
                onClick={activeTab === 'custom_combo'
                  ? handleOpenCreateCustomCombo
                  : ['label', 'badge', 'series'].includes(activeTab)
                    ? openPrimaryChannelLibraryEditor
                    : () => showActionNotice(`${buttonLabelMap[activeTab]}编辑器需按现有字段接入；当前不创建伪业务数据`)}
                className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]"
              >
                {buttonLabelMap[activeTab]}
              </button>
            </div>
          </div>
          )}

          {activeTab === 'spec' && (
            <SpecTable
              groups={filteredSpecGroups}
              visibleColumns={visibleSpecColumns}
              expandedGroupIds={expandedSpecGroups}
              onToggleGroup={(id) => toggleExpanded(setExpandedSpecGroups, id)}
              onCreateValue={handleOpenSpecValueEditor}
              onEditGroup={handleOpenEditSpec}
              onDeleteGroup={handleRequestDeleteSpec}
              onEditValue={handleOpenSpecValueEditor}
              onDeleteValue={handleRequestDeleteSpecValue}
              onViewProducts={handleOpenSpecProducts}
            />
          )}
          {activeTab === 'method' && (
            <MethodTable
              groups={filteredMethodGroups}
              expandedGroupIds={expandedMethodGroups}
              onToggleGroup={(id) => toggleExpanded(setExpandedMethodGroups, id)}
              onAction={(action, name) => showActionNotice(`${name}：${action}操作已记录；正式保存需接入属性权限与关联商品校验`)}
            />
          )}
          {activeTab === 'label' && (
            <LabelTable
              groups={filteredLabelGroups}
              expandedGroupIds={expandedLabelGroups}
              onToggleGroup={(id) => toggleExpanded(setExpandedLabelGroups, id)}
              onCreateLabel={(group) => setChannelLibraryEditor({ kind: 'label', mode: 'create', groupId: group.id, name: '', bgColor: '#ECFDF3', textColor: '#12B76A' })}
              onEditGroup={(group) => setChannelLibraryEditor({ kind: 'label_group', mode: 'edit', groupId: group.id, groupName: group.groupName })}
              onDeleteGroup={(group) => setChannelLibraryDelete({ kind: 'label_group', id: group.id, name: group.groupName })}
              onEditLabel={(group, label) => setChannelLibraryEditor({ kind: 'label', mode: 'edit', groupId: group.id, labelId: label.id, name: label.name, bgColor: label.bgColor, textColor: label.textColor })}
              onDeleteLabel={(group, label) => setChannelLibraryDelete({ kind: 'label', id: label.id, parentId: group.id, name: label.name })}
            />
          )}
          {activeTab === 'badge' && (
            <BadgeTable
              records={filteredBadges}
              onEdit={(record) => setChannelLibraryEditor({ kind: 'badge', mode: 'edit', id: record.id, name: record.name, bgColor: record.bgColor, effectText: record.effectText, image: record.image || '', validPeriod: record.validPeriod })}
              onDelete={(record) => setChannelLibraryDelete({ kind: 'badge', id: record.id, name: record.name })}
            />
          )}
          {activeTab === 'series' && (
            <SeriesTable
              records={filteredSeries}
              onToggle={(record) => setSeriesRecords(prev => prev.map(item => item.id === record.id ? { ...item, enabled: !item.enabled } : item))}
              onEdit={(record) => setChannelLibraryEditor({ kind: 'series', mode: 'edit', id: record.id, name: record.name, image: record.image, enabled: record.enabled, relatedCount: record.relatedCount })}
              onDelete={(record) => setChannelLibraryDelete({ kind: 'series', id: record.id, name: record.name, blockedCount: record.relatedCount })}
            />
          )}
          {activeTab === 'custom_attribute' && <WebCustomAttributeManager embedded />}
          {activeTab === 'custom_combo' && (
            <CustomComboTable
              records={filteredCustomCombos}
              onCreate={handleOpenCreateCustomCombo}
              onEdit={handleOpenEditCustomCombo}
              onCopy={handleCopyCustomCombo}
              onDelete={handleDeleteCustomCombo}
            />
          )}
          {activeTab === 'addon' && (
            scope === 'channel' ? (
              <DouyinAddonTable
                records={douyinAddons.filter(item => (
                  (!keyword.trim() || item.name.includes(keyword.trim()))
                  && (douyinAddonStatusFilter === 'all' || item.status === douyinAddonStatusFilter)
                ))}
                selectedIds={selectedDouyinAddonIds}
                onSelectedIdsChange={setSelectedDouyinAddonIds}
                onSync={(id) => { setSelectedDouyinAddonIds([id]); setShowDouyinAddonSyncDialog(true); }}
                onEdit={(record) => setDouyinAddonEditor({ mode: 'platform', recordId: record.id, name: record.name, category: record.douyinCategory, addonType: record.addonType, price: String(record.price) })}
              />
            ) : (
              <AddonTable
                groups={filteredAddonGroups}
                expandedGroupIds={expandedAddonGroups}
                onToggleGroup={(id) => toggleExpanded(setExpandedAddonGroups, id)}
                onAction={(action, name) => showActionNotice(`${name}：${action}操作已记录；发布与删除需先校验关联商品`)}
              />
            )
          )}
          {douyinAddonEditor?.mode === 'master' && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="从主档加料添加">
              <div className="flex max-h-[82vh] w-[880px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
                  <div>
                    <div className="text-lg font-bold text-[#1D2129]">从主档加料添加</div>
                    <div className="mt-1 text-xs text-[#86909C]">复用主档的名称、类型和价格；抖音商品分类属于平台资料，需要单独维护。</div>
                  </div>
                  <button type="button" onClick={() => setDouyinAddonEditor(null)} aria-label="关闭" className="text-xl text-[#667085]">×</button>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-6">
                  <div className="mb-4 flex h-10 items-center rounded-md border border-[#D9DDE7] px-3 text-sm text-[#98A2B3]">搜索主档加料名称</div>
                  <div className="overflow-hidden rounded-md border border-[#E5E6EB]">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#4E5969]"><tr><th className="w-12 px-4 py-3"></th><th className="px-4 py-3">主档加料</th><th className="w-28 px-4 py-3">类型</th><th className="w-24 px-4 py-3">价格</th><th className="w-[270px] px-4 py-3">抖音商品分类 *</th></tr></thead>
                      <tbody>
                        {MASTER_ADDON_OPTIONS.map(option => {
                          const alreadyAdded = douyinAddons.some(item => item.masterAddonId === option.id);
                          const checked = douyinAddonEditor.selectedIds.includes(option.id);
                          return (
                            <tr key={option.id} className="border-t border-[#EEF0F3]">
                              <td className="px-4 py-4"><input type="checkbox" checked={checked || alreadyAdded} disabled={alreadyAdded} onChange={(event) => setDouyinAddonEditor(current => current?.mode === 'master' ? { ...current, selectedIds: event.target.checked ? [...current.selectedIds, option.id] : current.selectedIds.filter(id => id !== option.id) } : current)} /></td>
                              <td className="px-4 py-4"><div className="font-medium text-[#1D2129]">{option.name}</div><div className="mt-1 text-xs text-[#98A2B3]">关联 {option.relatedCount} 个商品{alreadyAdded ? ' · 已添加' : ''}</div></td>
                              <td className="px-4 py-4 text-[#4E5969]">{option.type}</td>
                              <td className="px-4 py-4 text-[#4E5969]">¥{option.price.toFixed(2)}</td>
                              <td className="px-4 py-4">
                                <select disabled={!checked || alreadyAdded} value={douyinAddonEditor.categories[option.id] || ''} onChange={(event) => setDouyinAddonEditor(current => current?.mode === 'master' ? { ...current, categories: { ...current.categories, [option.id]: event.target.value } } : current)} className="h-9 w-full rounded-md border border-[#D9DDE7] bg-white px-3 text-sm outline-none disabled:bg-[#F5F6F7] disabled:text-[#B8BDC7]">
                                  <option value="">请选择抖音商品分类</option><option>饮品 / 奶茶</option><option>饮品 / 果茶</option><option>饮品 / 其他饮品</option><option>餐饮 / 小吃配料</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
                  <span className="text-sm text-[#667085]">已选择 {douyinAddonEditor.selectedIds.length} 个</span>
                  <div className="flex gap-2"><button type="button" onClick={() => setDouyinAddonEditor(null)} className="rounded-lg border border-[#D9DDE7] bg-white px-5 py-2 text-sm font-bold text-[#5B6475]">取消</button><button type="button" onClick={() => saveDouyinAddonEditor(false)} className="rounded-lg border border-[#00C06B] bg-white px-5 py-2 text-sm font-bold text-[#008F4C]">仅添加</button><button type="button" onClick={() => saveDouyinAddonEditor(true)} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white">添加并同步</button></div>
                </div>
              </div>
            </div>
          )}
          {douyinAddonEditor?.mode === 'platform' && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="直接创建抖音加料品">
              <div className="w-[660px] overflow-hidden rounded-lg bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5"><div><div className="text-lg font-bold text-[#1D2129]">{douyinAddonEditor.recordId ? '维护抖音加料资料' : '直接创建抖音加料品'}</div><div className="mt-1 text-xs text-[#86909C]">{douyinAddonEditor.recordId ? '只修改当前抖音平台扩展资料，不回写主档加料。' : '适用于只在抖音使用的加料品，不创建完整主档加料。'}</div></div><button type="button" onClick={() => setDouyinAddonEditor(null)} aria-label="关闭" className="text-xl text-[#667085]">×</button></div>
                <div className="space-y-5 p-6">
                  <label className="block"><span className="mb-2 block text-sm font-medium text-[#1D2129]">加料品名称 <b className="text-[#F53F3F]">*</b></span><input value={douyinAddonEditor.name} onChange={event => setDouyinAddonEditor(current => current?.mode === 'platform' ? { ...current, name: event.target.value } : current)} maxLength={20} placeholder="请输入加料品名称" className="h-10 w-full rounded-md border border-[#D9DDE7] px-3 outline-none focus:border-[#00C06B]" /></label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block"><span className="mb-2 block text-sm font-medium text-[#1D2129]">抖音商品分类 <b className="text-[#F53F3F]">*</b></span><select value={douyinAddonEditor.category} onChange={event => setDouyinAddonEditor(current => current?.mode === 'platform' ? { ...current, category: event.target.value } : current)} className="h-10 w-full rounded-md border border-[#D9DDE7] bg-white px-3 outline-none focus:border-[#00C06B]"><option value="">请选择</option><option>饮品 / 奶茶</option><option>饮品 / 果茶</option><option>饮品 / 其他饮品</option><option>餐饮 / 小吃配料</option></select></label>
                    <label className="block"><span className="mb-2 block text-sm font-medium text-[#1D2129]">加料商品类型 <b className="text-[#F53F3F]">*</b></span><select value={douyinAddonEditor.addonType} onChange={event => setDouyinAddonEditor(current => current?.mode === 'platform' ? { ...current, addonType: event.target.value } : current)} className="h-10 w-full rounded-md border border-[#D9DDE7] bg-white px-3 outline-none focus:border-[#00C06B]"><option value="">请选择</option><option>小料</option><option>水果加料</option><option>饮品加料</option><option>其他</option></select></label>
                  </div>
                  <label className="block"><span className="mb-2 block text-sm font-medium text-[#1D2129]">实付价（元） <b className="text-[#F53F3F]">*</b></span><input type="number" min="0" step="0.01" value={douyinAddonEditor.price} onChange={event => setDouyinAddonEditor(current => current?.mode === 'platform' ? { ...current, price: event.target.value } : current)} className="h-10 w-[240px] rounded-md border border-[#D9DDE7] px-3 outline-none focus:border-[#00C06B]" /></label>
                  <div className="rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-xs leading-5 text-[#245B8A]">平台加料品先独立同步。与商品的关联关系在下发门店点单品时，按渠道商品当前关联关系一并传递。</div>
                </div>
                <div className="flex justify-end gap-2 border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4"><button type="button" onClick={() => setDouyinAddonEditor(null)} className="rounded-lg border border-[#D9DDE7] bg-white px-5 py-2 text-sm font-bold text-[#5B6475]">取消</button><button type="button" onClick={() => saveDouyinAddonEditor(false)} className="rounded-lg border border-[#00C06B] bg-white px-5 py-2 text-sm font-bold text-[#008F4C]">仅保存</button><button type="button" onClick={() => saveDouyinAddonEditor(true)} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white">保存并同步</button></div>
              </div>
            </div>
          )}
          {showDouyinAddonSyncDialog && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="同步抖音在线点加料品">
              <div className="w-[660px] overflow-hidden rounded-lg bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
                  <div>
                    <div className="text-lg font-bold text-[#1D2129]">同步抖音在线点加料品</div>
                    <div className="mt-1 text-xs text-[#86909C]">品牌级独立同步，不选择门店范围。</div>
                  </div>
                  <button type="button" onClick={() => setShowDouyinAddonSyncDialog(false)} aria-label="关闭" className="text-[#667085]">×</button>
                </div>
                <div className="space-y-4 p-6">
                  <div className="grid grid-cols-3 gap-3 rounded-md border border-[#E5E6EB] bg-[#F7F8FA] p-4 text-sm">
                    <div><div className="text-xs text-[#86909C]">同步对象</div><div className="mt-1 font-bold">{selectedDouyinAddons.length} 个加料品</div></div>
                    <div><div className="text-xs text-[#86909C]">目标平台</div><div className="mt-1 font-bold">抖音在线点</div></div>
                    <div><div className="text-xs text-[#86909C]">门店范围</div><div className="mt-1 font-bold">不涉及门店</div></div>
                  </div>
                  <div className="rounded-md border border-[#B8DBFF] bg-[#F2F8FF] px-4 py-3 text-xs leading-5 text-[#245B8A]">
                    本次只创建或更新平台加料品。加料与商品的关联关系不随本任务同步，后续下发门店点单品时按商品当前关联关系一并传递。
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDouyinAddons.map(item => <span key={item.id} className="rounded border border-[#E5E6EB] px-3 py-1.5 text-xs text-[#4E5969]">{item.name}</span>)}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
                  <button type="button" onClick={onOpenSyncRecords} className="text-sm font-medium text-[#008F4C]">查看历史同步记录</button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDouyinAddonSyncDialog(false)} className="rounded-lg border border-[#D9DDE7] bg-white px-5 py-2 text-sm font-bold text-[#5B6475]">取消</button>
                    <button type="button" onClick={() => { setDouyinAddons(current => current.map(item => selectedDouyinAddonIds.includes(item.id) ? { ...item, status: 'syncing', updatedAt: '2026-08-19 16:35' } : item)); setSelectedDouyinAddonIds([]); setShowDouyinAddonSyncDialog(false); showActionNotice('已创建抖音在线点加料品同步任务，可在发布中心「同步记录」查看进度'); }} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-bold text-white">确认同步</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {specEditor && (
            <SpecEditorModal
              draft={specEditor}
              onChange={setSpecEditor}
              onCancel={() => setSpecEditor(null)}
              onConfirm={handleSaveSpecEditor}
            />
          )}
          {specValueEditor && (
            <SpecValueEditorModal
              draft={specValueEditor}
              onChange={setSpecValueEditor}
              onCancel={() => setSpecValueEditor(null)}
              onConfirm={handleSaveSpecValueEditor}
            />
          )}
          {specDeleteDialog && (
            <SpecDeleteModal
              dialog={specDeleteDialog}
              onCancel={() => setSpecDeleteDialog(null)}
              onConfirm={handleConfirmDeleteSpec}
            />
          )}
          {specProductsViewer && (
            <SpecLinkedProductsModal
              viewer={specProductsViewer}
              onClose={() => setSpecProductsViewer(null)}
            />
          )}
          {customComboEditor && (
            <CustomComboEditorModal
              draft={customComboEditor}
              onChange={setCustomComboEditor}
              onCancel={() => setCustomComboEditor(null)}
              onConfirm={handleSaveCustomCombo}
            />
          )}
          {channelLibraryEditor && (
            <ChannelLibraryEditorModal
              draft={channelLibraryEditor}
              onChange={setChannelLibraryEditor}
              onCancel={() => setChannelLibraryEditor(null)}
              onConfirm={saveChannelLibraryEditor}
            />
          )}
          {channelLibraryDelete && (
            <ChannelLibraryDeleteModal
              draft={channelLibraryDelete}
              onCancel={() => setChannelLibraryDelete(null)}
              onConfirm={confirmChannelLibraryDelete}
            />
          )}
          {showFieldOwnership && createPortal((
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#111827]/35 p-6" role="dialog" aria-modal="true" aria-labelledby="field-ownership-title">
              <div className="w-full max-w-[680px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-[#EEF0F3] px-6 py-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 id="field-ownership-title" className="text-[18px] font-semibold text-[#1D2129]">字段归属说明</h2>
                      <span className="rounded-full bg-[#EAF8F1] px-2 py-0.5 text-[11px] font-semibold text-[#008F4C]">{pageMeta.badge}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-[#667085]">用于判断字段应在哪里维护，以及变更如何影响上下游商品资料。</p>
                  </div>
                  <button type="button" aria-label="关闭" onClick={() => setShowFieldOwnership(false)} className="rounded-md p-1.5 text-[#7A8699] hover:bg-[#F2F4F7] hover:text-[#1D2129]"><X size={18} /></button>
                </div>
                <div className="grid gap-4 p-6 md:grid-cols-2">
                  <div className="rounded-lg border border-[#E5E7EB] p-4">
                    <div className="text-[13px] font-semibold text-[#1D2129]">本页面可维护</div>
                    <div className="mt-3 space-y-2 text-[13px] leading-5 text-[#4E5969]">
                      {(scope === 'channel'
                        ? ['描述标签、角标与商品系列', '渠道自定义属性及可选值', '渠道平台扩展属性']
                        : scope === 'master'
                          ? ['前台分类与后台分类', '规格与规格值', '做法、统计标签、加料候选关系']
                          : ['后台与前台分类', '规格、做法、标签与展示属性', '统一入口中的默认售卖属性']
                      ).map(item => <div key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00B460]" />{item}</div>)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] p-4">
                    <div className="text-[13px] font-semibold text-[#1D2129]">不可在此覆盖</div>
                    <div className="mt-3 space-y-2 text-[13px] leading-5 text-[#4E5969]">
                      {(scope === 'channel'
                        ? ['商品身份、SPU/SKU 编码', '主档规格结构与候选关系', '平台自维护商品的权威资料']
                        : scope === 'master'
                          ? ['渠道商品名称、图片与渠道售价', '渠道展示属性与平台专属字段', '门店即时库存与上下架状态']
                          : ['门店即时库存与上下架状态', '平台商品 ID 与映射权威关系', '合同渠道范围与授权令牌']
                      ).map(item => <div key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F79009]" />{item}</div>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#EEF0F3] bg-[#FAFBFC] px-6 py-4">
                  <span className="text-[12px] text-[#7A8699]">结构字段变更会按当前全渠道策略生成下游待确认或待发布差异。</span>
                  <button type="button" onClick={() => setShowFieldOwnership(false)} className="rounded-md bg-[#00B460] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#009D54]">我知道了</button>
                </div>
              </div>
            </div>
          ), document.body)}
        </div>
      </div>
    </div>
  );
};

const ChannelLibraryEditorModal = ({
  draft,
  onChange,
  onCancel,
  onConfirm,
}: {
  draft: ChannelLibraryEditorState;
  onChange: (draft: ChannelLibraryEditorState) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const titleMap = {
    label_group: draft.mode === 'create' ? '新建标签分组' : '编辑标签分组',
    label: draft.mode === 'create' ? '新增标签' : '编辑标签',
    badge: draft.mode === 'create' ? '新增角标' : '编辑角标',
    series: draft.mode === 'create' ? '创建系列' : '编辑系列',
  } as const;
  const canSave = draft.kind === 'label_group' ? Boolean(draft.groupName.trim()) : Boolean(draft.name.trim());
  const patchDraft = (patch: Record<string, unknown>) => onChange({ ...draft, ...patch } as ChannelLibraryEditorState);

  return createPortal(
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-[#111827]/35 p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-[640px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#EEF0F3] px-6 py-5">
          <div>
            <h2 className="text-[18px] font-semibold text-[#1D2129]">{titleMap[draft.kind]}</h2>
            <p className="mt-1 text-[12px] text-[#7A8699]">保存后用于渠道商品展示；不会改变商品主档身份与规格结构。</p>
          </div>
          <button type="button" aria-label="关闭" onClick={onCancel} className="rounded-md p-1.5 text-[#7A8699] hover:bg-[#F2F4F7]"><X size={18} /></button>
        </div>
        <div className="max-h-[62vh] space-y-5 overflow-y-auto px-6 py-5 no-scrollbar">
          {draft.kind === 'label_group' ? (
            <FieldRow label="分组名称" required>
              <input value={draft.groupName} maxLength={20} onChange={event => patchDraft({ groupName: event.target.value })} placeholder="请输入标签分组名称" className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 text-[13px] outline-none focus:border-[#00B460]" />
              <div className="mt-1 text-right text-[11px] text-[#98A2B3]">{draft.groupName.length}/20</div>
            </FieldRow>
          ) : (
            <FieldRow label={draft.kind === 'label' ? '标签名称' : draft.kind === 'badge' ? '角标名称' : '系列名称'} required>
              <input value={draft.name} maxLength={30} onChange={event => patchDraft({ name: event.target.value })} placeholder="请输入名称" className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 text-[13px] outline-none focus:border-[#00B460]" />
            </FieldRow>
          )}

          {draft.kind === 'label' && (
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="背景颜色"><input type="color" value={draft.bgColor} onChange={event => patchDraft({ bgColor: event.target.value })} className="h-10 w-full rounded-md border border-[#D9DDE3] bg-white p-1" /></FieldRow>
              <FieldRow label="字体颜色"><input type="color" value={draft.textColor} onChange={event => patchDraft({ textColor: event.target.value })} className="h-10 w-full rounded-md border border-[#D9DDE3] bg-white p-1" /></FieldRow>
            </div>
          )}

          {draft.kind === 'badge' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="背景颜色"><input type="color" value={draft.bgColor} onChange={event => patchDraft({ bgColor: event.target.value })} className="h-10 w-full rounded-md border border-[#D9DDE3] bg-white p-1" /></FieldRow>
                <FieldRow label="角标文案"><input value={draft.effectText} maxLength={8} onChange={event => patchDraft({ effectText: event.target.value })} placeholder="例如：新品" className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 text-[13px] outline-none focus:border-[#00B460]" /></FieldRow>
              </div>
              <FieldRow label="角标图片"><input value={draft.image} onChange={event => patchDraft({ image: event.target.value })} placeholder="可选；填写图片地址后优先展示图片角标" className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 text-[13px] outline-none focus:border-[#00B460]" /></FieldRow>
              <FieldRow label="有效期"><input value={draft.validPeriod} onChange={event => patchDraft({ validPeriod: event.target.value })} placeholder="例如：2026-08-01 00:00:00 - 2026-12-31 23:59:59；留空为长期有效" className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 text-[13px] outline-none focus:border-[#00B460]" /></FieldRow>
            </>
          )}

          {draft.kind === 'series' && (
            <>
              <FieldRow label="系列图片"><input value={draft.image} onChange={event => patchDraft({ image: event.target.value })} placeholder="填写系列图片地址；留空使用默认占位图" className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 text-[13px] outline-none focus:border-[#00B460]" /></FieldRow>
              <FieldRow label="启用状态">
                <label className="flex items-center gap-3 rounded-md border border-[#E5E7EB] px-3 py-3 text-[13px] text-[#4E5969]">
                  <input type="checkbox" checked={draft.enabled} onChange={event => patchDraft({ enabled: event.target.checked })} className="h-4 w-4 rounded border-[#D9DDE3] text-[#00B460] focus:ring-[#00B460]" />
                  启用后可在渠道商品中选择该系列
                </label>
              </FieldRow>
              {draft.mode === 'edit' && <div className="rounded-md bg-[#F7F8FA] px-4 py-3 text-[12px] text-[#667085]">当前关联 {draft.relatedCount} 个商品。关联关系请从系列详情或商品编辑页维护。</div>}
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EEF0F3] bg-[#FAFBFC] px-6 py-4">
          <button type="button" onClick={onCancel} className="rounded-md border border-[#D9DDE3] bg-white px-4 py-2 text-[13px] font-medium text-[#4E5969] hover:bg-[#F7F8FA]">取消</button>
          <button type="button" disabled={!canSave} onClick={onConfirm} className="rounded-md bg-[#00B460] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#009D54] disabled:cursor-not-allowed disabled:bg-[#BFC6CF]">保存</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const ChannelLibraryDeleteModal = ({ draft, onCancel, onConfirm }: { draft: ChannelLibraryDeleteState; onCancel: () => void; onConfirm: () => void }) => {
  const blocked = Boolean(draft.blockedCount);
  return createPortal(
    <div className="fixed inset-0 z-[97] flex items-center justify-center bg-[#111827]/35 p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-[480px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EEF0F3] px-6 py-5">
          <h2 className="text-[18px] font-semibold text-[#1D2129]">{blocked ? '暂时无法删除' : '确认删除'}</h2>
          <button type="button" aria-label="关闭" onClick={onCancel} className="rounded-md p-1.5 text-[#7A8699] hover:bg-[#F2F4F7]"><X size={18} /></button>
        </div>
        <div className="px-6 py-6">
          <div className={`rounded-lg border px-4 py-4 text-[13px] leading-6 ${blocked ? 'border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]' : 'border-[#FEE4E2] bg-[#FEF3F2] text-[#B42318]'}`}>
            {blocked
              ? `“${draft.name}”已关联 ${draft.blockedCount} 个商品。请先查看并移除关联商品，再删除该对象。`
              : `删除“${draft.name}”后将无法继续被渠道商品选择，此操作不可恢复。`}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EEF0F3] bg-[#FAFBFC] px-6 py-4">
          <button type="button" onClick={onCancel} className="rounded-md border border-[#D9DDE3] bg-white px-4 py-2 text-[13px] font-medium text-[#4E5969]">{blocked ? '我知道了' : '取消'}</button>
          {!blocked && <button type="button" onClick={onConfirm} className="rounded-md bg-[#E5484D] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#C93C41]">删除</button>}
        </div>
      </div>
    </div>,
    document.body,
  );
};

const FieldRow = ({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-[13px] font-medium text-[#344054]">{required && <span className="mr-1 text-[#E5484D]">*</span>}{label}</span>
    {children}
  </label>
);

const ActionButtons = ({ actions }: { actions: Array<string | { label: string; onClick?: () => void; danger?: boolean }> }) => (
  <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 whitespace-nowrap">
    {actions.map(action => (
      (() => {
        const item = typeof action === 'string' ? { label: action } : action;
        return (
      <button
        key={item.label}
        type="button"
        onClick={item.onClick}
        className={`inline-flex items-center text-sm ${item.danger ? 'text-[#FF4D4F] hover:text-[#D9363E]' : 'text-[#00C06B] hover:text-[#00A35B]'}`}
      >
        {item.label}
      </button>
        );
      })()
    ))}
  </div>
);

const TreeGroupName = ({
  name,
  expanded,
  hasChildren,
  onClick,
}: {
  name: string;
  expanded: boolean;
  hasChildren: boolean;
  onClick: () => void;
}) => (
  <div className="flex items-center gap-3">
    <ExpandButton expanded={expanded} hasChildren={hasChildren} onClick={onClick} />
    <div>{name}</div>
  </div>
);

const TreeChildName = ({ name }: { name?: string }) => (
  <div className="pl-8 text-[#666]">{name || '-'}</div>
);

const SpecTable = ({
  groups,
  visibleColumns,
  expandedGroupIds,
  onToggleGroup,
  onCreateValue,
  onEditGroup,
  onDeleteGroup,
  onEditValue,
  onDeleteValue,
  onViewProducts,
}: {
  groups: SpecGroup[];
  visibleColumns: Record<SpecColumnKey, boolean>;
  expandedGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onCreateValue: (group: SpecGroup) => void;
  onEditGroup: (group: SpecGroup) => void;
  onDeleteGroup: (group: SpecGroup) => void;
  onEditValue: (group: SpecGroup) => void;
  onDeleteValue: (group: SpecGroup, value: SpecValue) => void;
  onViewProducts: (title: string, products: LinkedSpecProduct[]) => void;
}) => (
  <div className="overflow-auto">
    <table className="w-full min-w-[960px] border-collapse text-left">
      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
        <tr>
          {visibleColumns.name && <th className="w-[260px] border-b border-[#E8E8E8] px-4 py-4">规格名称</th>}
          {visibleColumns.value && <th className="border-b border-[#E8E8E8] px-4 py-4">规格值</th>}
          {visibleColumns.code && <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">规格值编码</th>}
          {visibleColumns.relatedProducts && <th className="w-[160px] border-b border-[#E8E8E8] px-4 py-4">关联商品数量</th>}
          <th className="w-[260px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="text-sm text-[#333]">
        {groups.map(group => (
          <React.Fragment key={group.id}>
            <tr className="border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
              {visibleColumns.name && (
                <td className="px-4 py-4 font-medium">
                  <TreeGroupName
                    name={group.name}
                    expanded={expandedGroupIds.has(group.id)}
                    hasChildren={group.values.length > 0}
                    onClick={() => onToggleGroup(group.id)}
                  />
                </td>
              )}
              {visibleColumns.value && <td className="px-4 py-4 text-[#999]">{group.values.length ? '' : '-'}</td>}
              {visibleColumns.code && <td className="px-4 py-4 text-[#999]">{group.values.length ? '' : '-'}</td>}
              {visibleColumns.relatedProducts && (
                <td className="px-4 py-4">
                  {group.relatedProducts.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onViewProducts(`${group.name} 已关联商品`, group.relatedProducts)}
                      className="text-sm font-medium text-[#00C06B] hover:text-[#00A35B] hover:underline"
                    >
                      {group.relatedProducts.length} 个
                    </button>
                  ) : (
                    <span className="text-[#999]">0</span>
                  )}
                </td>
              )}
              <td className="px-4 py-4 text-right">
                <ActionButtons
                  actions={[
                    { label: '新增规格值', onClick: () => onCreateValue(group) },
                    { label: '编辑', onClick: () => onEditGroup(group) },
                    { label: '删除', onClick: () => onDeleteGroup(group), danger: true },
                  ]}
                />
              </td>
            </tr>
            {expandedGroupIds.has(group.id) && group.values.map(value => (
              <tr key={value.id} className="border-b border-[#F7F7F7] bg-[#FCFCFC]">
                {visibleColumns.name && <td className="px-4 py-4 text-[#666]"><TreeChildName /></td>}
                {visibleColumns.value && <td className="px-4 py-4 text-[#666]">{value.name}</td>}
                {visibleColumns.code && <td className="px-4 py-4 text-[#666]">{value.code}</td>}
                {visibleColumns.relatedProducts && (
                  <td className="px-4 py-4">
                    {value.relatedProducts.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onViewProducts(`${group.name} / ${value.name} 已关联商品`, value.relatedProducts)}
                        className="text-sm font-medium text-[#00C06B] hover:text-[#00A35B] hover:underline"
                      >
                        {value.relatedProducts.length} 个
                      </button>
                    ) : (
                      <span className="text-[#999]">0</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-4 text-right">
                  <ActionButtons
                    actions={[
                      { label: '编辑', onClick: () => onEditValue(group) },
                      { label: '删除', onClick: () => onDeleteValue(group, value), danger: true },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

const SpecColumnPanel = ({
  keyword,
  visibleColumns,
  onChangeKeyword,
  onToggleColumn,
}: {
  keyword: string;
  visibleColumns: Record<SpecColumnKey, boolean>;
  onChangeKeyword: (keyword: string) => void;
  onToggleColumn: (key: SpecColumnKey) => void;
}) => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const matchedColumns = SPEC_COLUMN_DEFS.filter(def => !normalizedKeyword || def.label.toLowerCase().includes(normalizedKeyword));
  const visibleItems = matchedColumns.filter(def => visibleColumns[def.key]);
  const hiddenItems = matchedColumns.filter(def => !visibleColumns[def.key]);

  const renderItem = (def: { key: SpecColumnKey; label: string }, visible: boolean) => (
    <button
      key={def.key}
      type="button"
      onClick={() => onToggleColumn(def.key)}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-[#333] transition-colors hover:bg-[#F7F8FA]"
    >
      <span>{def.label}</span>
      {visible ? <Eye size={16} className="text-[#98A2B3]" /> : <EyeOff size={16} className="text-[#D1D5DB]" />}
    </button>
  );

  return (
    <div className="absolute right-0 top-12 z-40 w-[420px] rounded-2xl border border-[#E8E8E8] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
        <input
          value={keyword}
          onChange={e => onChangeKeyword(e.target.value)}
          placeholder="搜索"
          className="h-10 w-full rounded-lg border border-[#E8E8E8] pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]"
        />
      </div>
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#EEF1F5]">
        <div className="min-h-[220px] border-r border-[#EEF1F5] px-3 py-3">
          <div className="mb-3 flex items-center justify-between text-sm text-[#666]">
            <span>在列表中展示</span>
            <span className="inline-flex items-center gap-1 text-xs text-[#98A2B3]"><Lock size={12} />冻结</span>
          </div>
          <div className="space-y-1">
            {visibleItems.map(def => renderItem(def, true))}
            <div className="flex items-center justify-between rounded-lg bg-[#F7F8FA] px-3 py-2 text-sm text-[#333]">
              <span>操作</span>
              <Lock size={16} className="text-[#98A2B3]" />
            </div>
            {!visibleItems.length && <div className="px-3 py-8 text-center text-sm text-[#98A2B3]">暂无匹配字段</div>}
          </div>
        </div>
        <div className="min-h-[220px] px-3 py-3">
          <div className="mb-3 text-sm text-[#666]">在列表中隐藏</div>
          <div className="space-y-1">
            {hiddenItems.map(def => renderItem(def, false))}
            {!hiddenItems.length && <div className="px-3 py-8 text-center text-sm text-[#98A2B3]">暂无隐藏字段</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const SpecValueRowsEditor = ({
  values,
  onChange,
}: {
  values: SpecValue[];
  onChange: (values: SpecValue[]) => void;
}) => {
  const updateRow = (valueId: string, patch: Partial<SpecValue>) => {
    onChange(values.map(value => (value.id === valueId ? { ...value, ...patch } : value)));
  };

  const appendRow = () => {
    onChange([...values, createEmptySpecValue()]);
  };

  const removeRow = (valueId: string) => {
    const nextValues = values.filter(value => value.id !== valueId);
    onChange(nextValues.length ? nextValues : [createEmptySpecValue()]);
  };

  return (
    <div className="rounded-xl border border-[#EEF1F5]">
      <div className="grid grid-cols-[minmax(0,1fr)_340px_96px] bg-[#F7F8FA] px-4 py-3 text-sm font-bold text-[#333]">
        <div><span className="mr-1 text-[#FF4D4F]">*</span>规格值</div>
        <div>规格值编码</div>
        <div className="text-right">操作</div>
      </div>
      <div className="px-4">
        {values.map(value => (
          <div key={value.id} className="grid grid-cols-[minmax(0,1fr)_340px_96px] items-start gap-4 border-t border-[#EEF1F5] py-3 first:border-t-0">
            <div className="relative">
              <input
                value={value.name}
                maxLength={70}
                onChange={e => updateRow(value.id, { name: e.target.value.slice(0, 70) })}
                placeholder="请输入规格名称"
                className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 pr-14 text-sm text-[#333] outline-none focus:border-[#00C06B]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3]">{value.name.length}/70</span>
            </div>
            <div className="relative">
              <input
                value={value.code}
                maxLength={50}
                onChange={e => updateRow(value.id, { code: e.target.value.slice(0, 50) })}
                placeholder="请输入规格值编码"
                className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 pr-14 text-sm text-[#333] outline-none focus:border-[#00C06B]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3]">{value.code.length}/50</span>
            </div>
            <div className="flex h-10 items-center justify-end">
              <button type="button" onClick={() => removeRow(value.id)} className="text-sm text-[#00C06B] hover:text-[#00A35B]">删除</button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[#EEF1F5] px-4 py-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={appendRow}
            className="inline-flex items-center gap-1 rounded-lg border border-[#D9DDE7] bg-white px-4 py-2 text-sm text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]"
          >
            <Plus size={14} />
            添加规格值
          </button>
        </div>
      </div>
    </div>
  );
};

const SpecEditorModal = ({
  draft,
  onChange,
  onCancel,
  onConfirm,
}: {
  draft: SpecEditorState;
  onChange: (draft: SpecEditorState) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/35 px-6">
    <div className="w-full max-w-[1024px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="text-[20px] font-bold text-[#1F2129]">{draft.mode === 'create' ? '新增规格' : '编辑规格'}</div>
        <button onClick={onCancel} className="text-[#98A2B3] hover:text-[#5B6475]"><X size={20} /></button>
      </div>
      <div className="space-y-6 px-6 pb-6">
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4">
          <div className="text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>规格名称:</div>
          <div className="relative max-w-[420px]">
            <input
              value={draft.name}
              maxLength={20}
              onChange={e => onChange({ ...draft, name: e.target.value.slice(0, 20) })}
              placeholder="请输入规格名称"
              className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 pr-14 text-sm text-[#333] outline-none focus:border-[#00C06B]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3]">{draft.name.length}/20</span>
          </div>
        </div>
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4">
          <div className="text-sm text-[#333]">规格描述:</div>
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-[420px]">
              <input
                value={draft.description}
                maxLength={50}
                onChange={e => onChange({ ...draft, description: e.target.value.slice(0, 50) })}
                placeholder="请输入规格描述"
                className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 pr-14 text-sm text-[#333] outline-none focus:border-[#00C06B]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3]">{draft.description.length}/50</span>
            </div>
            <button type="button" disabled title="示例：规格名称“大杯”，规格描述“适用于 700ml 饮品”" className="cursor-help text-sm font-medium text-[#00C06B]">查看示例</button>
          </div>
        </div>
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-4">
          <div className="pt-3 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>规格值:</div>
          <SpecValueRowsEditor
            values={draft.values}
            onChange={values => onChange({ ...draft, values })}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-6 py-5">
        <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">确定</button>
        <button onClick={onCancel} className="rounded-[10px] bg-white px-2 py-2.5 text-sm font-medium text-[#00C06B] hover:text-[#00A35B]">取消</button>
      </div>
    </div>
  </div>
);

const SpecValueEditorModal = ({
  draft,
  onChange,
  onCancel,
  onConfirm,
}: {
  draft: SpecValueEditorState;
  onChange: (draft: SpecValueEditorState) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/35 px-6">
    <div className="w-full max-w-[1024px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="text-[20px] font-bold text-[#1F2129]">新增规格值</div>
        <button onClick={onCancel} className="text-[#98A2B3] hover:text-[#5B6475]"><X size={20} /></button>
      </div>
      <div className="space-y-5 px-6 pb-6">
        <div className="rounded-xl bg-[#F7F8FA] px-4 py-3 text-sm text-[#5B6475]">规格名称：{draft.groupName}</div>
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-4">
          <div className="pt-3 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>规格值:</div>
          <SpecValueRowsEditor
            values={draft.values}
            onChange={values => onChange({ ...draft, values })}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-6 py-5">
        <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">确定</button>
        <button onClick={onCancel} className="rounded-[10px] bg-white px-2 py-2.5 text-sm font-medium text-[#00C06B] hover:text-[#00A35B]">取消</button>
      </div>
    </div>
  </div>
);

const SpecDeleteModal = ({
  dialog,
  onCancel,
  onConfirm,
}: {
  dialog: SpecDeleteDialogState;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const targetLabel = dialog.targetType === 'group' ? `规格“${dialog.groupName}”` : `规格值“${dialog.valueName || '-'}”`;
  const isBlocked = dialog.mode === 'blocked';

  return (
    <div className="fixed inset-0 z-[97] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[520px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-6 py-5">
          <div className="text-[20px] font-bold text-[#1F2129]">{isBlocked ? '无法删除' : '删除确认'}</div>
          <button onClick={onCancel} className="text-[#98A2B3] hover:text-[#5B6475]"><X size={20} /></button>
        </div>
        <div className="px-6 py-6">
          <div className={`rounded-xl px-4 py-4 text-sm leading-6 ${isBlocked ? 'bg-[#FFF7E8] text-[#D97706]' : 'bg-[#F8FAFB] text-[#5B6475]'}`}>
            {isBlocked
              ? `${targetLabel} 已关联 ${dialog.relationCount} 个商品，请先解除关联后再删除。`
              : `确认删除${targetLabel}吗？删除后不可恢复。`}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-6 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">
            {isBlocked ? '我知道了' : '取消'}
          </button>
          {!isBlocked && (
            <button onClick={onConfirm} className="rounded-[10px] bg-[#FF4D4F] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#D9363E]">删除</button>
          )}
        </div>
      </div>
    </div>
  );
};

const SpecLinkedProductsModal = ({
  viewer,
  onClose,
}: {
  viewer: SpecLinkedProductsViewer;
  onClose: () => void;
}) => {
  const typeClassMap: Record<LinkedSpecProduct['type'], string> = {
    标准商品: 'bg-[#F0FDF4] text-[#00A35B]',
    套餐商品: 'bg-[#FFF7ED] text-[#EA580C]',
    商城商品: 'bg-[#EEF4FF] text-[#2563EB]',
    加料商品: 'bg-[#F5F3FF] text-[#7C3AED]',
  };

  return (
    <div className="fixed inset-0 z-[97] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[920px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div>
            <div className="text-[20px] font-bold text-[#1F2129]">已关联商品</div>
            <div className="mt-1 text-sm text-[#98A2B3]">{viewer.title}</div>
          </div>
          <button onClick={onClose} className="text-[#98A2B3] hover:text-[#5B6475]"><X size={22} /></button>
        </div>
        <div className="px-8 py-6">
          <div className="mb-5 rounded-xl bg-[#F8FAFB] px-4 py-3 text-sm text-[#5B6475]">当前已关联 {viewer.products.length} 个商品</div>
          <div className="overflow-hidden rounded-xl border border-[#EEF1F5]">
            <div className="grid grid-cols-[minmax(0,1fr)_140px_120px] bg-[#F8FAFB] px-4 py-3 text-sm font-bold text-[#5B6475]">
              <div>商品名称</div>
              <div>商品类型</div>
              <div>商品ID</div>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {viewer.products.map(product => (
                <div key={product.id} className="grid grid-cols-[minmax(0,1fr)_140px_120px] items-center border-t border-[#EEF1F5] px-4 py-4 first:border-t-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#DDF5E6,#CFF3DB)] text-sm font-bold text-[#00A35B]">
                      {product.imageText || product.name.slice(0, 2)}
                    </div>
                    <div className="truncate text-sm text-[#1F2129]">{product.name}</div>
                  </div>
                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${typeClassMap[product.type]}`}>{product.type}</span>
                  </div>
                  <div className="text-sm text-[#5B6475]">{product.id}</div>
                </div>
              ))}
              {!viewer.products.length && <div className="px-4 py-12 text-center text-sm text-[#98A2B3]">暂无关联商品</div>}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onClose} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">关闭</button>
        </div>
      </div>
    </div>
  );
};

const MethodTable = ({
  groups,
  expandedGroupIds,
  onToggleGroup,
  onAction,
}: {
  groups: MethodGroup[];
  expandedGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onAction: (action: string, name: string) => void;
}) => (
  <div className="overflow-auto">
    <table className="w-full min-w-[1100px] border-collapse text-left">
      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
        <tr>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">做法名称</th>
          <th className="w-[160px] border-b border-[#E8E8E8] px-4 py-4">做法值</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">做法标识码</th>
          <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4">备注</th>
          <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4">温馨提示</th>
          <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4">关联商品数</th>
          <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4">做法值多选</th>
          <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4">做法选项</th>
          <th className="w-[260px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="text-sm text-[#333]">
        {groups.map(group => (
          <React.Fragment key={group.id}>
            <tr className="border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
              <td className="px-4 py-4 font-medium">
                <TreeGroupName
                  name={group.name}
                  expanded={expandedGroupIds.has(group.id)}
                  hasChildren={group.values.length > 0}
                  onClick={() => onToggleGroup(group.id)}
                />
              </td>
              <td className="px-4 py-4 text-[#999]"></td>
              <td className="px-4 py-4 text-[#999]"></td>
              <td className="px-4 py-4 text-[#666]">{group.remark || '-'}</td>
              <td className="px-4 py-4 text-[#666]">{group.tip || '-'}</td>
              <td className="px-4 py-4 text-[#00C06B]">{group.relationCount || '-'}</td>
              <td className="px-4 py-4">
                <button onClick={() => onAction(group.multi ? '关闭做法值多选' : '开启做法值多选', group.name)} className={`relative inline-flex h-6 w-11 items-center rounded-full border ${group.multi ? 'border-[#0FBE6C] bg-[#0FBE6C]' : 'border-[#E5E7EB] bg-[#F3F4F6]'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm ${group.multi ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </td>
              <td className="px-4 py-4 text-[#666]">{group.optionType}</td>
              <td className="px-4 py-4 text-right">
                <ActionButtons actions={['新增做法值', '编辑', '删除'].map(label => ({ label, danger: label === '删除', onClick: () => onAction(label, group.name) }))} />
              </td>
            </tr>
            {expandedGroupIds.has(group.id) && group.values.map(value => (
              <tr key={value.id} className="border-b border-[#F7F7F7] bg-[#FCFCFC]">
                <td className="px-4 py-4 text-[#666]"><TreeChildName /></td>
                <td className="px-4 py-4 text-[#666]">{value.name}</td>
                <td className="px-4 py-4 text-[#666]">{value.code}</td>
                <td className="px-4 py-4 text-[#666]"></td>
                <td className="px-4 py-4 text-[#666]"></td>
                <td className="px-4 py-4 text-[#00C06B]">{group.relationCount ? Math.max(1, group.relationCount - 1) : '-'}</td>
                <td className="px-4 py-4"></td>
                <td className="px-4 py-4"></td>
                <td className="px-4 py-4 text-right">
                  <ActionButtons actions={['编辑', '关联商品', '解除关联'].map(label => ({ label, danger: label === '解除关联', onClick: () => onAction(label, `${group.name}/${value.name}`) }))} />
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

const LabelTable = ({
  groups,
  expandedGroupIds,
  onToggleGroup,
  onCreateLabel,
  onEditGroup,
  onDeleteGroup,
  onEditLabel,
  onDeleteLabel,
}: {
  groups: LabelGroup[];
  expandedGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onCreateLabel: (group: LabelGroup) => void;
  onEditGroup: (group: LabelGroup) => void;
  onDeleteGroup: (group: LabelGroup) => void;
  onEditLabel: (group: LabelGroup, label: LabelGroup['labels'][number]) => void;
  onDeleteLabel: (group: LabelGroup, label: LabelGroup['labels'][number]) => void;
}) => (
  <div className="overflow-auto">
    <table className="w-full min-w-[1100px] border-collapse text-left">
      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
        <tr>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">标签分组</th>
          <th className="w-[180px] border-b border-[#E8E8E8] px-4 py-4">标签</th>
          <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4">背景颜色</th>
          <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4">字体颜色</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">效果</th>
          <th className="w-[180px] border-b border-[#E8E8E8] px-4 py-4">创建时间</th>
          <th className="w-[260px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="text-sm text-[#333]">
        {groups.map(group => (
          <React.Fragment key={group.id}>
            <tr className="border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
              <td className="px-4 py-4 font-medium">
                <TreeGroupName
                  name={group.groupName}
                  expanded={expandedGroupIds.has(group.id)}
                  hasChildren={group.labels.length > 0}
                  onClick={() => onToggleGroup(group.id)}
                />
              </td>
              <td className="px-4 py-4 text-[#999]"></td>
              <td className="px-4 py-4 text-[#999]"></td>
              <td className="px-4 py-4 text-[#999]"></td>
              <td className="px-4 py-4 text-[#999]"></td>
              <td className="px-4 py-4 text-[#666]">{group.labels[0]?.createdAt || '2025-09-10 15:36:29'}</td>
              <td className="px-4 py-4 text-right">
                <ActionButtons actions={[
                  { label: '新增标签', onClick: () => onCreateLabel(group) },
                  { label: '编辑', onClick: () => onEditGroup(group) },
                  { label: '删除', onClick: () => onDeleteGroup(group), danger: true },
                ]} />
              </td>
            </tr>
            {expandedGroupIds.has(group.id) && group.labels.map(label => (
              <tr key={label.id} className="border-b border-[#F7F7F7] bg-[#FCFCFC]">
                <td className="px-4 py-4 text-[#666]"><TreeChildName /></td>
                <td className="px-4 py-4 text-[#666]">{label.name}</td>
                <td className="px-4 py-4"><div className="h-5 w-10 rounded-sm" style={{ backgroundColor: label.bgColor }} /></td>
                <td className="px-4 py-4" style={{ color: label.textColor }}>{label.name === '0910文字' ? '标签' : '标签'}</td>
                <td className="px-4 py-4"><span className="inline-flex rounded-sm px-3 py-1 text-xs font-bold" style={{ backgroundColor: label.bgColor, color: label.textColor }}>标签</span></td>
                <td className="px-4 py-4 text-[#666]">{label.createdAt}</td>
                <td className="px-4 py-4 text-right">
                  <ActionButtons actions={[
                    '关联商品',
                    '解除关联',
                    { label: '编辑', onClick: () => onEditLabel(group, label) },
                    { label: '删除', onClick: () => onDeleteLabel(group, label), danger: true },
                  ]} />
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

const BadgeTable = ({ records, onEdit, onDelete }: { records: BadgeRecord[]; onEdit: (record: BadgeRecord) => void; onDelete: (record: BadgeRecord) => void }) => (
  <div className="overflow-auto">
    <table className="w-full min-w-[1080px] border-collapse text-left">
      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
        <tr>
          <th className="w-[180px] border-b border-[#E8E8E8] px-4 py-4">角标名称</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">背景颜色</th>
          <th className="w-[160px] border-b border-[#E8E8E8] px-4 py-4">效果</th>
          <th className="w-[260px] border-b border-[#E8E8E8] px-4 py-4">有效期</th>
          <th className="w-[180px] border-b border-[#E8E8E8] px-4 py-4">创建时间</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="text-sm text-[#333]">
        {records.map(record => (
          <tr key={record.id} className="border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
            <td className="px-4 py-4">{record.name}</td>
            <td className="px-4 py-4">{record.bgColor === '#FFFFFF' ? '-' : <div className="h-5 w-8 rounded-sm" style={{ backgroundColor: record.bgColor }} />}</td>
            <td className="px-4 py-4">
              {record.image ? (
                <img src={record.image} alt={record.name} className="h-8 w-10 rounded object-cover" />
              ) : (
                <span className="inline-flex rounded-sm px-4 py-1 text-xs font-bold text-white" style={{ backgroundColor: record.bgColor }}>{record.effectText}</span>
              )}
            </td>
            <td className="px-4 py-4 text-[#666]">{record.validPeriod}</td>
            <td className="px-4 py-4 text-[#666]">{record.createdAt}</td>
            <td className="px-4 py-4 text-right">
              <button type="button" onClick={() => onEdit(record)} className="mr-4 text-[#00C06B] hover:text-[#00A35B]">编辑</button>
              <button type="button" onClick={() => onDelete(record)} className="text-[#FF4D4F] hover:text-[#D9363E]">删除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SeriesTable = ({ records, onToggle, onEdit, onDelete }: { records: SeriesRecord[]; onToggle: (record: SeriesRecord) => void; onEdit: (record: SeriesRecord) => void; onDelete: (record: SeriesRecord) => void }) => (
  <div className="overflow-auto">
    <table className="w-full min-w-[960px] border-collapse text-left">
      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
        <tr>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">系列名称</th>
          <th className="w-[160px] border-b border-[#E8E8E8] px-4 py-4">系列图片</th>
          <th className="w-[160px] border-b border-[#E8E8E8] px-4 py-4">关联商品</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">是否启用</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="text-sm text-[#333]">
        {records.map(record => (
          <tr key={record.id} className="border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
            <td className="px-4 py-4">{record.name}</td>
            <td className="px-4 py-4"><img src={record.image} alt={record.name} className="h-10 w-10 rounded object-cover" /></td>
            <td className="px-4 py-4 text-[#00C06B]">{record.relatedCount}</td>
            <td className="px-4 py-4">
              <button type="button" onClick={() => onToggle(record)} aria-label={`${record.enabled ? '停用' : '启用'}${record.name}`} className={`relative inline-flex h-7 w-12 items-center rounded-full border ${record.enabled ? 'border-[#0FBE6C] bg-[#0FBE6C]' : 'border-[#E5E7EB] bg-[#F3F4F6]'}`}>
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm ${record.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </td>
            <td className="px-4 py-4 text-right">
              <button type="button" onClick={() => onEdit(record)} className="mr-4 text-[#00C06B] hover:text-[#00A35B]">编辑</button>
              <button type="button" onClick={() => onDelete(record)} className="text-[#FF4D4F] hover:text-[#D9363E]">删除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CustomComboTable = ({
  records,
  onCreate,
  onEdit,
  onCopy,
  onDelete,
}: {
  records: CustomComboRecord[];
  onCreate: () => void;
  onEdit: (record: CustomComboRecord) => void;
  onCopy: (record: CustomComboRecord) => void;
  onDelete: (record: CustomComboRecord) => void;
}) => (
  <div className="overflow-auto">
    <table className="w-full min-w-[1540px] border-collapse text-left">
      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
        <tr>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">分组ID</th>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">分组名称</th>
          <th className="w-[100px] border-b border-[#E8E8E8] px-4 py-4">分组编码</th>
          <th className="w-[180px] border-b border-[#E8E8E8] px-4 py-4">备注</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">商品标识</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">商品条码</th>
          <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4">配置方式</th>
          <th className="w-[120px] border-b border-[#E8E8E8] px-4 py-4">按种类选择</th>
          <th className="w-[110px] border-b border-[#E8E8E8] px-4 py-4">是否必选</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">购买数量限制</th>
          <th className="w-[100px] border-b border-[#E8E8E8] px-4 py-4">关联商品</th>
          <th className="w-[170px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="text-sm text-[#333]">
        {records.map(record => (
          <tr key={record.id} className="border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
            <td className="px-4 py-4 text-[#666]">{record.id}</td>
            <td className="px-4 py-4">{record.groupName}</td>
            <td className="px-4 py-4">{record.groupCode}</td>
            <td className="px-4 py-4 text-[#666]">{record.remark || '-'}</td>
            <td className="px-4 py-4 text-[#666]">{record.productCode || '-'}</td>
            <td className="px-4 py-4 text-[#666]">{record.barcode || '-'}</td>
            <td className="px-4 py-4 text-[#666]">{getCustomComboModeLabel(record.configMode)}</td>
            <td className="px-4 py-4 text-[#666]">{getCustomComboOptionRule(record)}</td>
            <td className="px-4 py-4">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${record.configMode === 'flexible' ? (record.isRequired ? 'bg-[#FFF1F0] text-[#FF4D4F]' : 'bg-[#F0F5FF] text-[#2F54EB]') : 'bg-[#F5F5F5] text-[#98A2B3]'}`}>
                {getCustomComboRequiredLabel(record)}
              </span>
            </td>
            <td className="px-4 py-4 text-[#666]">{getCustomComboQuantityLimit(record)}</td>
            <td className="px-4 py-4 text-[#00C06B]">{record.relatedCount}</td>
            <td className="px-4 py-4 text-right">
              <ActionButtons
                actions={[
                  { label: '编辑', onClick: () => onEdit(record) },
                  { label: '复制', onClick: () => onCopy(record) },
                  { label: '删除', onClick: () => onDelete(record), danger: true },
                ]}
              />
            </td>
          </tr>
        ))}
        {!records.length && (
          <tr>
            <td colSpan={11} className="px-4 py-12 text-center text-sm text-[#98A2B3]">
              暂无随心配分组，点击右上角“创建分组”开始配置
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const CustomComboEditorModal = ({
  draft,
  onChange,
  onCancel,
  onConfirm,
}: {
  draft: CustomComboEditorState;
  onChange: (draft: CustomComboEditorState) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const updateField = <K extends keyof CustomComboEditorState>(key: K, value: CustomComboEditorState[K]) => {
    onChange({ ...draft, [key]: value });
  };

  const updateItem = (itemId: string, patch: Partial<CustomComboItem>) => {
    onChange({
      ...draft,
      items: draft.items.map(item => (item.id === itemId ? { ...item, ...patch } : item)),
    });
  };

  const appendItem = () => {
    onChange({
      ...draft,
      items: [...draft.items, createMockCustomComboItem(draft.items.length + 1)],
    });
  };

  const removeItem = (itemId: string) => {
    const nextItems = draft.items.filter(item => item.id !== itemId);
    onChange({
      ...draft,
      items: nextItems.length ? nextItems : [createMockCustomComboItem()],
    });
  };

  return (
    <div className="fixed inset-0 z-[98] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[1180px] overflow-hidden rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-6 py-5">
          <div>
            <div className="text-[20px] font-bold text-[#1F2129]">{draft.mode === 'create' ? '新建随心配分组' : '编辑随心配分组'}</div>
            <div className="mt-1 text-sm text-[#98A2B3]">在 Web 后台直接配置分组规则、是否必选和购买数量限制。</div>
          </div>
          <button onClick={onCancel} className="text-[#98A2B3] hover:text-[#5B6475]"><X size={20} /></button>
        </div>
        <div className="max-h-[76vh] overflow-y-auto bg-[#F8FAFB] px-6 py-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <div className="mb-5 text-sm font-bold text-[#1F2129]">分组信息</div>
              <div className="max-w-[620px] space-y-4">
                <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
                  <div className="text-sm text-[#333]">分组ID：</div>
                  <input
                    value={draft.id || '保存后自动生成'}
                    disabled
                    className="h-10 w-full rounded-lg border border-[#E8E8E8] bg-[#F5F7FA] px-3 text-sm text-[#98A2B3] outline-none"
                  />
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
                  <div className="text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>分组名称：</div>
                  <input
                    value={draft.groupName}
                    onChange={e => updateField('groupName', e.target.value)}
                    placeholder="请输入分组名称"
                    className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]"
                  />
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
                  <div className="text-sm text-[#333]">分组编码：</div>
                  <input
                    value={draft.groupCode}
                    onChange={e => updateField('groupCode', e.target.value)}
                    placeholder="请输入分组编码"
                    className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]"
                  />
                </div>
                <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-3">
                  <div className="pt-2 text-sm text-[#333]">备注</div>
                  <textarea
                    value={draft.remark}
                    onChange={e => updateField('remark', e.target.value)}
                    placeholder="请输入备注"
                    className="min-h-[84px] w-full resize-none rounded-lg border border-[#E8E8E8] px-3 py-2 text-sm outline-none focus:border-[#00C06B]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-bold text-[#1F2129]">商品信息</div>
                <button type="button" onClick={appendItem} className="inline-flex items-center rounded-lg bg-[#00C06B] px-3 py-2 text-sm font-bold text-white hover:bg-[#00A35B]">
                  <Plus size={14} className="mr-1" />
                  添加商品
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#EEF1F5]">
                <div className="grid grid-cols-[minmax(0,1.6fr)_140px_140px_160px_100px_96px] gap-4 bg-[#F7F8FA] px-4 py-3 text-sm font-bold text-[#333]">
                  <div>商品名称</div>
                  <div>规格</div>
                  <div>商品标识</div>
                  <div>商品条码</div>
                  <div>数量</div>
                  <div className="text-right">操作</div>
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  {draft.items.map(item => (
                    <div key={item.id} className="grid grid-cols-[minmax(0,1.6fr)_140px_140px_160px_100px_96px] gap-4 border-t border-[#EEF1F5] px-4 py-3 first:border-t-0">
                      <input value={item.name} onChange={e => updateItem(item.id, { name: e.target.value })} className="h-10 rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]" />
                      <input value={item.spec} onChange={e => updateItem(item.id, { spec: e.target.value })} className="h-10 rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]" />
                      <input value={item.productCode} onChange={e => updateItem(item.id, { productCode: e.target.value })} className="h-10 rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]" />
                      <input value={item.barcode} onChange={e => updateItem(item.id, { barcode: e.target.value })} className="h-10 rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]" />
                      <input type="number" value={item.quantity} onChange={e => updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} className="h-10 rounded-lg border border-[#E8E8E8] px-3 text-center text-sm outline-none focus:border-[#00C06B]" />
                      <div className="flex items-center justify-end">
                        <button type="button" onClick={() => removeItem(item.id)} className="text-sm text-[#FF4D4F] hover:text-[#D9363E]">删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <div className="mb-4 text-sm font-bold text-[#1F2129]">分组设置</div>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-6 rounded-xl bg-[#F8FAFB] px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-[#333]">配置方式</div>
                    <div className="mt-1 text-xs text-[#98A2B3]">请选择分组的选购方式。“按种类选择”用于限制用户需要选择几种不同商品；“按数量选择”用于设置该分组是否必选，以及用户在本组内可买多少件商品。</div>
                  </div>
                  <div className="flex rounded-lg border border-[#D9DDE7] bg-white p-1">
                    <button
                      type="button"
                      onClick={() => updateField('configMode', 'pick')}
                      className={`min-w-[112px] whitespace-nowrap rounded-md px-5 py-1.5 text-sm font-medium ${draft.configMode === 'pick' ? 'bg-[#00C06B] text-white' : 'text-[#666] hover:bg-[#F7F8FA]'}`}
                    >
                      按种类选择
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({
                        ...draft,
                        configMode: 'flexible',
                        isRequired: draft.configMode === 'flexible' ? draft.isRequired : false,
                        minTotalQuantity: draft.configMode === 'flexible'
                          ? draft.minTotalQuantity
                          : 0,
                        maxTotalQuantity: draft.configMode === 'flexible'
                          ? draft.maxTotalQuantity
                          : 100,
                      })}
                      className={`min-w-[112px] whitespace-nowrap rounded-md px-5 py-1.5 text-sm font-medium ${draft.configMode === 'flexible' ? 'bg-[#00C06B] text-white' : 'text-[#666] hover:bg-[#F7F8FA]'}`}
                    >
                      按数量选择
                    </button>
                  </div>
                </div>

                {draft.configMode === 'pick' && (
                  <div className="flex items-center justify-between gap-6 rounded-xl bg-[#F8FAFB] px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-[#333]">分组内必选商品种类数</div>
                      <div className="mt-1 text-xs text-[#98A2B3]">设置用户在该分组中必须选择几种不同商品，例如当前 `3选1` 表示 3 种商品中必须选择 1 种。<span className="ml-2 cursor-pointer text-[#00C06B] hover:underline">查看示例</span></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#5B6475]">当前 {draft.items.length}选{Math.min(draft.requiredOptionCount, Math.max(draft.items.length, 1))}</span>
                      <div className="flex items-center overflow-hidden rounded-lg border border-[#D9DDE7] bg-white">
                        <button type="button" onClick={() => updateField('requiredOptionCount', Math.max(1, draft.requiredOptionCount - 1))} className="px-3 py-2 text-[#666] hover:bg-[#F7F8FA]">-</button>
                        <input
                          type="number"
                          value={draft.requiredOptionCount}
                          onChange={e => updateField('requiredOptionCount', Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-10 w-16 border-x border-[#D9DDE7] text-center text-sm outline-none"
                        />
                        <button type="button" onClick={() => updateField('requiredOptionCount', draft.requiredOptionCount + 1)} className="px-3 py-2 text-[#666] hover:bg-[#F7F8FA]">+</button>
                      </div>
                    </div>
                  </div>
                )}

                {draft.configMode === 'flexible' && (
                  <>
                    <div className="flex items-center justify-between gap-6 rounded-xl bg-[#F8FAFB] px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-[#333]">是否必选</div>
                        <div className="mt-1 text-xs text-[#98A2B3]">开启后，用户下单时必须从该分组中选择商品；关闭后，用户可以跳过这个分组不选。</div>
                      </div>
                      <div className="flex rounded-lg border border-[#D9DDE7] bg-white p-1">
                        <button
                          type="button"
                          onClick={() => onChange({
                            ...draft,
                            isRequired: true,
                            minTotalQuantity: Math.max(1, draft.minTotalQuantity || 0),
                          })}
                          className={`rounded-md px-4 py-1.5 text-sm font-medium ${draft.isRequired ? 'bg-[#00C06B] text-white' : 'text-[#666] hover:bg-[#F7F8FA]'}`}
                        >
                          必选
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('isRequired', false)}
                          className={`rounded-md px-4 py-1.5 text-sm font-medium ${!draft.isRequired ? 'bg-[#00C06B] text-white' : 'text-[#666] hover:bg-[#F7F8FA]'}`}
                        >
                          非必选
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#F8FAFB] px-4 py-3">
                      <div className="text-sm font-medium text-[#333]">商品购买数量限制</div>
                      <div className="mt-1 text-xs text-[#98A2B3]">设置用户在该分组内最少买几件、最多买几件，单个商品可重复选择。默认起购数量为 0，限购数量为 100，且限购数量最多不超过 100。<span className="ml-2 cursor-pointer text-[#00C06B] hover:underline">查看示例</span></div>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-sm text-[#5B6475]">起购数量</span>
                        <input
                          type="number"
                          value={draft.minTotalQuantity}
                          min={draft.isRequired ? 1 : 0}
                          max={100}
                          onChange={e => {
                            const nextMinTotalQuantity = Math.min(100, Math.max(draft.isRequired ? 1 : 0, parseInt(e.target.value) || 0));
                            onChange({
                              ...draft,
                              minTotalQuantity: nextMinTotalQuantity,
                              maxTotalQuantity: Math.max(nextMinTotalQuantity, draft.maxTotalQuantity),
                            });
                          }}
                          className="h-10 w-20 rounded-lg border border-[#E8E8E8] px-3 text-center text-sm outline-none focus:border-[#00C06B]"
                        />
                        <span className="text-[#98A2B3]">~</span>
                        <span className="text-sm text-[#5B6475]">限购数量</span>
                        <input
                          type="number"
                          value={draft.maxTotalQuantity}
                          min={draft.minTotalQuantity}
                          max={100}
                          onChange={e => updateField('maxTotalQuantity', Math.min(100, Math.max(draft.minTotalQuantity, parseInt(e.target.value) || 100)))}
                          className="h-10 w-20 rounded-lg border border-[#E8E8E8] px-3 text-center text-sm outline-none focus:border-[#00C06B]"
                        />
                      </div>
                      {draft.isRequired && (
                        <div className="mt-2 text-xs text-[#98A2B3]">该分组设为必选时，起购数量必须大于 0。</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[#EEF1F5] bg-white px-6 py-5">
          <div className="text-sm text-[#98A2B3]">
            规则预览：{draft.configMode === 'pick'
              ? `按种类选择 / ${draft.items.length}选${Math.min(draft.requiredOptionCount, Math.max(draft.items.length, 1))}`
              : `按数量选择 / ${draft.isRequired ? '必选' : '非必选'} / ${draft.minTotalQuantity} ~ ${draft.maxTotalQuantity}`}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">取消</button>
            <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">保存</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DouyinAddonTable = ({
  records,
  selectedIds,
  onSelectedIdsChange,
  onSync,
  onEdit,
}: {
  records: DouyinAddonRecord[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onSync: (id: string) => void;
  onEdit: (record: DouyinAddonRecord) => void;
}) => {
  const allSelected = records.length > 0 && records.every(record => selectedIds.includes(record.id));
  const statusMeta: Record<DouyinAddonStatus, { label: string; tone: string; dot: string }> = {
    not_synced: { label: '待同步', tone: 'text-[#C76600]', dot: 'bg-[#F79009]' },
    syncing: { label: '同步中', tone: 'text-[#245B8A]', dot: 'bg-[#2E90FA]' },
    synced: { label: '已同步', tone: 'text-[#008F4C]', dot: 'bg-[#00B96B]' },
    failed: { label: '同步失败', tone: 'text-[#D9363E]', dot: 'bg-[#F04438]' },
  };
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[1180px] border-collapse text-left">
        <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]"><tr>
          <th className="w-12 border-b border-[#E8E8E8] px-4 py-4"><input type="checkbox" checked={allSelected} onChange={event => onSelectedIdsChange(event.target.checked ? records.map(record => record.id) : [])} aria-label="全选抖音加料品" /></th>
          <th className="w-[250px] border-b border-[#E8E8E8] px-4 py-4">加料名称</th>
          <th className="w-[130px] border-b border-[#E8E8E8] px-4 py-4">来源</th>
          <th className="w-[150px] border-b border-[#E8E8E8] px-4 py-4">加料类型</th>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">抖音商品分类</th>
          <th className="w-[110px] border-b border-[#E8E8E8] px-4 py-4">实付价</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">同步状态</th>
          <th className="w-[170px] border-b border-[#E8E8E8] px-4 py-4">最近更新</th>
          <th className="w-[190px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
        </tr></thead>
        <tbody className="text-sm text-[#333]">
          {records.map(record => {
            const meta = statusMeta[record.status];
            return <tr key={record.id} className="border-b border-[#F0F1F2] hover:bg-[#FCFFFD]">
              <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(record.id)} onChange={event => onSelectedIdsChange(event.target.checked ? [...selectedIds, record.id] : selectedIds.filter(id => id !== record.id))} aria-label={`选择${record.name}`} /></td>
              <td className="px-4 py-4"><div className="font-medium text-[#1D2129]">{record.name}</div><div className="mt-1 text-xs text-[#98A2B3]">{record.platformId ? `抖音商品ID ${record.platformId}` : '尚未生成抖音商品ID'}</div></td>
              <td className="px-4 py-4"><span className={`rounded px-2 py-1 text-xs ${record.source === 'master' ? 'bg-[#E8F7EF] text-[#008F4C]' : 'bg-[#F2F3F5] text-[#667085]'}`}>{record.source === 'master' ? '来自主档加料' : '平台直接创建'}</span></td>
              <td className="px-4 py-4 text-[#4E5969]">{record.addonType}</td>
              <td className="px-4 py-4 text-[#4E5969]">{record.douyinCategory}</td>
              <td className="px-4 py-4">¥{record.price.toFixed(2)}</td>
              <td className="px-4 py-4"><span className={`inline-flex items-center gap-2 font-medium ${meta.tone}`}><i className={`h-2 w-2 rounded-full ${meta.dot}`} />{meta.label}</span>{record.status === 'failed' && <div className="mt-1 text-xs text-[#D9363E]">类目属性校验未通过</div>}</td>
              <td className="px-4 py-4 text-[#667085]">{record.updatedAt}</td>
              <td className="px-4 py-4 text-right"><div className="inline-flex items-center gap-4"><button type="button" onClick={() => onEdit(record)} className="font-medium text-[#008F4C]">维护资料</button>{record.status !== 'syncing' && <button type="button" onClick={() => onSync(record.id)} className="font-medium text-[#008F4C]">{record.status === 'failed' ? '重新同步' : record.status === 'synced' ? '同步更新' : '同步'}</button>}</div></td>
            </tr>;
          })}
          {records.length === 0 && <tr><td colSpan={9} className="px-6 py-16 text-center text-sm text-[#98A2B3]">暂无符合条件的抖音加料品</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

const AddonTable = ({
  groups,
  expandedGroupIds,
  onToggleGroup,
  onAction,
  showDouyinStatus = false,
}: {
  groups: AddonGroup[];
  expandedGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onAction: (action: string, name: string) => void;
  showDouyinStatus?: boolean;
}) => (
  <div className="overflow-auto">
    <table className="w-full min-w-[1180px] border-collapse text-left">
      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
        <tr>
          <th className="w-[260px] border-b border-[#E8E8E8] px-4 py-4">加料类型</th>
          <th className="w-[100px] border-b border-[#E8E8E8] px-4 py-4">排序</th>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">加料商品名称</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">初始价格</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">关联商品数量</th>
          {showDouyinStatus && <th className="w-[150px] border-b border-[#E8E8E8] px-4 py-4">抖音同步状态</th>}
          <th className="w-[180px] border-b border-[#E8E8E8] px-4 py-4">创建时间</th>
          <th className="w-[240px] border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="text-sm text-[#333]">
        {groups.map(group => (
          <React.Fragment key={group.id}>
            <tr className="border-b border-[#F3F4F6] bg-[#FCFCFC]">
              <td className="px-4 py-4 font-medium">
                <TreeGroupName
                  name={group.typeName}
                  expanded={expandedGroupIds.has(group.id)}
                  hasChildren={(group.children?.length || 0) > 0}
                  onClick={() => onToggleGroup(group.id)}
                />
              </td>
              <td className="px-4 py-4 text-[#666]">{group.sort}</td>
              <td className="px-4 py-4 text-[#999]">{group.productName || ''}</td>
              <td className="px-4 py-4">
                <input value={group.initialPrice} readOnly className="h-8 w-14 rounded border border-[#E8E8E8] bg-white px-2 text-sm text-[#666]" />
              </td>
              <td className="px-4 py-4 text-[#666]">{group.relatedCount || ''}</td>
              {showDouyinStatus && <td className="px-4 py-4 text-[#98A2B3]">类型不单独同步</td>}
              <td className="px-4 py-4 text-[#666]">{group.createdAt || ''}</td>
              <td className="px-4 py-4 text-right">
                <ActionButtons actions={['编辑类型', '新增加料项', '删除'].map(label => ({ label, danger: label === '删除', onClick: () => onAction(label, group.typeName) }))} />
              </td>
            </tr>
            {expandedGroupIds.has(group.id) && group.children?.map(item => (
              <tr key={item.id} className="border-b border-[#F3F4F6] hover:bg-[#FCFFFD]">
                <td className="px-4 py-4 text-[#666]"><TreeChildName name={item.typeName} /></td>
                <td className="px-4 py-4">{item.sort}</td>
                <td className="px-4 py-4 text-[#666]">{item.productName || '-'}</td>
                <td className="px-4 py-4">
                  <input value={item.initialPrice} readOnly className="h-8 w-14 rounded border border-[#E8E8E8] bg-white px-2 text-sm text-[#666]" />
                </td>
                <td className="px-4 py-4 text-[#666]">{item.relatedCount}</td>
                {showDouyinStatus && (
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded border px-2 py-1 text-[11px] font-bold ${item.id.endsWith('1') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : item.id.endsWith('2') ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {item.id.endsWith('1') ? '已同步' : item.id.endsWith('2') ? '同步失败' : '待同步'}
                    </span>
                  </td>
                )}
                <td className="px-4 py-4 text-[#666]">{item.createdAt}</td>
                <td className="px-4 py-4 text-right">
                  <ActionButtons actions={['编辑', '删除'].map(label => ({ label, danger: label === '删除', onClick: () => onAction(label, item.typeName) }))} />
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

const ExpandButton = ({
  expanded,
  hasChildren,
  onClick,
}: {
  expanded: boolean;
  hasChildren: boolean;
  onClick: () => void;
}) => {
  if (!hasChildren) {
    return <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-transparent text-[#D9D9D9]">-</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#D9D9D9] bg-white text-[#999] hover:border-[#00C06B] hover:text-[#00C06B]"
    >
      {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
    </button>
  );
};
