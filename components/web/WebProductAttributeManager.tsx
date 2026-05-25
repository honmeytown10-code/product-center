import React, { useMemo, useState } from 'react';
import { Layers3, ChefHat, Tags, Tag, Grid2X2, Search, Filter, ListFilter, Heart, Blend, ChevronRight, ChevronDown } from 'lucide-react';

type AttributeTab = 'spec' | 'method' | 'label' | 'badge' | 'series' | 'custom_combo' | 'addon';
type LabelTab = 'desc' | 'order' | 'stats';

type SpecGroup = {
  id: string;
  name: string;
  values: Array<{ id: string; name: string; code: string }>;
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

type CustomComboRecord = {
  id: string;
  groupName: string;
  groupCode: string;
  remark: string;
  productCode: string;
  barcode: string;
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

const SPEC_GROUPS: SpecGroup[] = [
  {
    id: 'spec-1',
    name: '0325规格1',
    values: [{ id: 'sv-1', name: '050811', code: '050811' }],
  },
  {
    id: 'spec-2',
    name: '验收-自建规格',
    values: [],
  },
  {
    id: 'spec-3',
    name: '人数222',
    values: [
      { id: 'sv-2', name: '2人', code: '2' },
      { id: 'sv-3', name: '4人', code: '4' },
    ],
  },
  {
    id: 'spec-4',
    name: 'KOI规格',
    values: [],
  },
];

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
  { id: 'order', label: '点单标签' },
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
  order: [
    { id: 'order-group-1', groupName: '新品推荐', labels: [{ id: 'ol-1', name: '新品', bgColor: '#FEE2E2', textColor: '#EF4444', createdAt: '2025-04-16 09:59:21' }] },
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
  { id: 'cc-1', groupName: '0509随心配-3', groupCode: '1', remark: '0509随心配-3', productCode: '', barcode: '', relatedCount: 0 },
  { id: 'cc-2', groupName: '0509随心配-2', groupCode: '1', remark: '0509随心配-2', productCode: '', barcode: '', relatedCount: 0 },
  { id: 'cc-3', groupName: '0509随心配-1', groupCode: '1', remark: '0509随心配-1', productCode: '', barcode: '', relatedCount: 0 },
  { id: 'cc-4', groupName: '4月27-3选1', groupCode: '1', remark: '', productCode: '', barcode: '', relatedCount: 1 },
  { id: 'cc-5', groupName: '0427可选分组-1', groupCode: '1', remark: '', productCode: '04270402', barcode: '04270401', relatedCount: 1 },
  { id: 'cc-6', groupName: '果茶随心配', groupCode: '1', remark: '', productCode: 'zfb123', barcode: '', relatedCount: 2 },
  { id: 'cc-7', groupName: '0330可选分组-3', groupCode: '1', remark: '', productCode: '', barcode: '', relatedCount: 2 },
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

const tabs: Array<{ id: AttributeTab; label: string; icon: React.ReactNode }> = [
  { id: 'spec', label: '规格管理', icon: <Layers3 size={16} /> },
  { id: 'method', label: '做法管理', icon: <ChefHat size={16} /> },
  { id: 'label', label: '标签管理', icon: <Tags size={16} /> },
  { id: 'badge', label: '角标管理', icon: <Tag size={16} /> },
  { id: 'series', label: '系列商品', icon: <Grid2X2 size={16} /> },
  { id: 'custom_combo', label: '随心配管理', icon: <Heart size={16} /> },
  { id: 'addon', label: '加料', icon: <Blend size={16} /> },
];

export const WebProductAttributeManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AttributeTab>('spec');
  const [activeLabelTab, setActiveLabelTab] = useState<LabelTab>('desc');
  const [keyword, setKeyword] = useState('');
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

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredSpecGroups = useMemo(() => {
    if (!normalizedKeyword) return SPEC_GROUPS;
    return SPEC_GROUPS.filter(group => [group.name, ...group.values.map(value => `${value.name} ${value.code}`)].join(' ').toLowerCase().includes(normalizedKeyword));
  }, [normalizedKeyword]);

  const filteredMethodGroups = useMemo(() => {
    if (!normalizedKeyword) return METHOD_GROUPS;
    return METHOD_GROUPS.filter(group => [group.name, group.optionType, ...group.values.map(value => `${value.name} ${value.code}`)].join(' ').toLowerCase().includes(normalizedKeyword));
  }, [normalizedKeyword]);

  const filteredLabelGroups = useMemo(() => {
    const source = LABEL_GROUPS[activeLabelTab];
    if (!normalizedKeyword) return source;
    return source.filter(group => [group.groupName, ...group.labels.map(label => label.name)].join(' ').toLowerCase().includes(normalizedKeyword));
  }, [activeLabelTab, normalizedKeyword]);

  const filteredBadges = useMemo(() => {
    if (!normalizedKeyword) return BADGE_RECORDS;
    return BADGE_RECORDS.filter(item => [item.name, item.effectText].join(' ').toLowerCase().includes(normalizedKeyword));
  }, [normalizedKeyword]);

  const filteredSeries = useMemo(() => {
    if (!normalizedKeyword) return SERIES_RECORDS;
    return SERIES_RECORDS.filter(item => item.name.toLowerCase().includes(normalizedKeyword));
  }, [normalizedKeyword]);

  const filteredCustomCombos = useMemo(() => {
    if (!normalizedKeyword) return CUSTOM_COMBO_RECORDS;
    return CUSTOM_COMBO_RECORDS.filter(item =>
      [item.groupName, item.groupCode, item.remark, item.productCode, item.barcode].join(' ').toLowerCase().includes(normalizedKeyword)
    );
  }, [normalizedKeyword]);

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
    spec: '搜索规格名称',
    method: '搜索做法名称',
    label: '搜索标签分组/标签',
    badge: '搜索角标名称',
    series: '搜索系列名称',
    custom_combo: '搜索分组名称/商品标识',
    addon: '请输入加料名称',
  };

  const buttonLabelMap: Record<AttributeTab, string> = {
    spec: '新增规格',
    method: '新增做法',
    label: activeLabelTab === 'desc' ? '新建标签分组' : '新增标签',
    badge: '新增角标',
    series: '创建系列',
    custom_combo: '创建分组',
    addon: '创建加料',
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

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F6FA]">
      <div className="shrink-0 bg-white px-6 pt-5">
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-2">
          <div className="grid grid-cols-7 gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl border px-3 py-3 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#B7E8CB] bg-[#F3FCF7] text-[#00C06B]'
                    : 'border-transparent bg-white text-[#666] hover:border-[#E8E8E8] hover:bg-[#FAFAFA] hover:text-[#333]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${activeTab === tab.id ? 'bg-[#E6F8F0] text-[#00C06B]' : 'bg-[#F3F4F6] text-[#8C8C8C]'}`}>
                    {tab.icon}
                  </div>
                  <div className="text-sm font-bold whitespace-nowrap">{tab.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="min-h-full rounded-lg bg-white shadow-sm">
          <div className="px-6 pt-5 text-xs leading-6 text-[#666]">
            {activeTab === 'spec' && <>商品规格库，用户可选择商品的规格，如：大杯、小杯等，规格影响商品价格 <span className="text-[#00C06B]">查看示例</span> <span className="ml-3 text-[#00C06B]">查看帮助文档</span></>}
            {activeTab === 'method' && <>商品做法库，用户可选择商品的做法，如：去冰、少冰等，做法不影响商品价格 <span className="text-[#00C06B]">查看示例</span> <span className="ml-3 text-[#00C06B]">查看帮助文档</span></>}
            {activeTab === 'label' && <>描述标签展示在小程序端的商品名称下方、分类名称上方，用于口味做饮、食材等商品信息或分类式说明 <span className="text-[#00C06B]">查看示例</span></>}
            {activeTab === 'badge' && <>商品角标展示在小程序点单页商品列表的商品图片中，用于新品、套餐等特殊标记展示 <span className="text-[#00C06B]">查看示例</span> <span className="ml-3 text-[#00C06B]">查看帮助文档</span></>}
            {activeTab === 'series' && <>如果商品存在商品系列，小程序点单页购买商品时，可快速切换相同系列的商品 <span className="text-[#00C06B]">查看示例</span></>}
            {activeTab === 'custom_combo' && <>管理商品随心配分组，支持配置分组编码、商品标识、商品条码和关联商品 <span className="text-[#00C06B]">查看示例</span></>}
            {activeTab === 'addon' && <>管理商品加料类型与加料商品，可配置初始价格、启停状态及关联商品范围 <span className="text-[#00C06B]">查看示例</span></>}
          </div>

          {activeTab === 'label' && (
            <div className="mt-4 border-b border-[#E8E8E8] px-6">
              <div className="flex gap-8 text-sm">
                {LABEL_TABS.map(tab => (
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

          {activeTab === 'addon' ? (
            <div className="border-b border-[#E8E8E8] px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder={placeholderMap[activeTab]}
                    className="h-[38px] w-[220px] rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm text-[#333] outline-none focus:border-[#00C06B]"
                  />
                  <div className="flex items-center gap-2 text-sm text-[#666]">
                    <span>是否启用</span>
                    <span>=</span>
                    <select className="h-[38px] w-[120px] rounded-lg border border-[#E8E8E8] bg-white px-3 outline-none focus:border-[#00C06B]">
                      <option>启售</option>
                      <option>停用</option>
                    </select>
                  </div>
                  <button className="rounded-lg bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">查询</button>
                  <button className="rounded-lg border border-[#E8E8E8] px-5 py-2.5 text-sm text-[#666] hover:bg-[#FAFAFA]">重置</button>
                </div>
                <div className="flex items-center gap-3">
                  <button className="rounded-lg border border-[#E8E8E8] px-4 py-2.5 text-sm text-[#666] hover:bg-[#FAFAFA]">排序管理</button>
                  <button className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">创建加料</button>
                  <button className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">发布加料类型</button>
                </div>
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
              <button className="inline-flex items-center rounded-lg border border-[#E8E8E8] px-4 py-2.5 text-sm font-bold text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]">
                <Filter size={14} className="mr-1.5 text-[#999]" />
                筛选
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button className="inline-flex items-center rounded-lg border border-[#E8E8E8] bg-white px-3 py-2.5 text-sm font-medium text-[#666] hover:border-[#00C06B] hover:text-[#00C06B]">
                <ListFilter size={14} />
              </button>
              {activeTab === 'label' && <button className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">排序管理</button>}
              {activeTab === 'custom_combo' && <button className="rounded-lg border border-[#00C06B] bg-[#F3FCF7] px-4 py-2.5 text-sm font-bold text-[#00C06B] hover:bg-[#EAF9F1]">筛选(2)</button>}
              <button className="rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">{buttonLabelMap[activeTab]}</button>
            </div>
          </div>
          )}

          {activeTab === 'spec' && (
            <SpecTable
              groups={filteredSpecGroups}
              expandedGroupIds={expandedSpecGroups}
              onToggleGroup={(id) => toggleExpanded(setExpandedSpecGroups, id)}
            />
          )}
          {activeTab === 'method' && (
            <MethodTable
              groups={filteredMethodGroups}
              expandedGroupIds={expandedMethodGroups}
              onToggleGroup={(id) => toggleExpanded(setExpandedMethodGroups, id)}
            />
          )}
          {activeTab === 'label' && (
            <LabelTable
              groups={filteredLabelGroups}
              expandedGroupIds={expandedLabelGroups}
              onToggleGroup={(id) => toggleExpanded(setExpandedLabelGroups, id)}
            />
          )}
          {activeTab === 'badge' && <BadgeTable records={filteredBadges} />}
          {activeTab === 'series' && <SeriesTable records={filteredSeries} />}
          {activeTab === 'custom_combo' && <CustomComboTable records={filteredCustomCombos} />}
          {activeTab === 'addon' && (
            <AddonTable
              groups={filteredAddonGroups}
              expandedGroupIds={expandedAddonGroups}
              onToggleGroup={(id) => toggleExpanded(setExpandedAddonGroups, id)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButtons = ({ actions }: { actions: string[] }) => (
  <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 whitespace-nowrap">
    {actions.map(action => (
      <button
        key={action}
        type="button"
        className="inline-flex items-center text-sm text-[#00C06B] hover:text-[#00A35B]"
      >
        {action}
      </button>
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
  expandedGroupIds,
  onToggleGroup,
}: {
  groups: SpecGroup[];
  expandedGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
}) => (
  <div className="overflow-auto">
    <table className="w-full min-w-[900px] border-collapse text-left">
      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
        <tr>
          <th className="w-[260px] border-b border-[#E8E8E8] px-4 py-4">规格名称</th>
          <th className="border-b border-[#E8E8E8] px-4 py-4">规格值</th>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">规格值编码</th>
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
              <td className="px-4 py-4 text-[#999]">{group.values.length ? '' : '-'}</td>
              <td className="px-4 py-4 text-[#999]">{group.values.length ? '' : '-'}</td>
              <td className="px-4 py-4 text-right">
                <ActionButtons actions={['新增规格值', '编辑', '删除']} />
              </td>
            </tr>
            {expandedGroupIds.has(group.id) && group.values.map(value => (
              <tr key={value.id} className="border-b border-[#F7F7F7] bg-[#FCFCFC]">
                <td className="px-4 py-4 text-[#666]"><TreeChildName /></td>
                <td className="px-4 py-4 text-[#666]">{value.name}</td>
                <td className="px-4 py-4 text-[#666]">{value.code}</td>
                <td className="px-4 py-4 text-right">
                  <ActionButtons actions={['编辑', '删除']} />
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

const MethodTable = ({
  groups,
  expandedGroupIds,
  onToggleGroup,
}: {
  groups: MethodGroup[];
  expandedGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
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
                <button className={`relative inline-flex h-6 w-11 items-center rounded-full border ${group.multi ? 'border-[#0FBE6C] bg-[#0FBE6C]' : 'border-[#E5E7EB] bg-[#F3F4F6]'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm ${group.multi ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </td>
              <td className="px-4 py-4 text-[#666]">{group.optionType}</td>
              <td className="px-4 py-4 text-right">
                <ActionButtons actions={['新增做法值', '编辑', '删除']} />
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
                  <ActionButtons actions={['编辑', '关联商品', '解除关联']} />
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
}: {
  groups: LabelGroup[];
  expandedGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
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
                <ActionButtons actions={['新增标签', '编辑', '删除']} />
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
                  <ActionButtons actions={['关联商品', '解除关联', '编辑', '删除']} />
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

const BadgeTable = ({ records }: { records: BadgeRecord[] }) => (
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
              <span className="mr-4 text-[#00C06B]">编辑</span>
              <span className="text-[#00C06B]">删除</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SeriesTable = ({ records }: { records: SeriesRecord[] }) => (
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
              <button className={`relative inline-flex h-7 w-12 items-center rounded-full border ${record.enabled ? 'border-[#0FBE6C] bg-[#0FBE6C]' : 'border-[#E5E7EB] bg-[#F3F4F6]'}`}>
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm ${record.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </td>
            <td className="px-4 py-4 text-right">
              <span className="mr-4 text-[#00C06B]">编辑</span>
              <span className="text-[#00C06B]">删除</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CustomComboTable = ({ records }: { records: CustomComboRecord[] }) => (
  <div className="overflow-auto">
    <table className="w-full min-w-[1180px] border-collapse text-left">
      <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
        <tr>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">分组ID</th>
          <th className="w-[220px] border-b border-[#E8E8E8] px-4 py-4">分组名称</th>
          <th className="w-[100px] border-b border-[#E8E8E8] px-4 py-4">分组编码</th>
          <th className="w-[180px] border-b border-[#E8E8E8] px-4 py-4">备注</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">商品标识</th>
          <th className="w-[140px] border-b border-[#E8E8E8] px-4 py-4">商品条码</th>
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
            <td className="px-4 py-4 text-[#00C06B]">{record.relatedCount}</td>
            <td className="px-4 py-4 text-right">
              <span className="mr-4 text-[#00C06B]">编辑</span>
              <span className="mr-4 text-[#00C06B]">复制</span>
              <span className="text-[#00C06B]">删除</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AddonTable = ({
  groups,
  expandedGroupIds,
  onToggleGroup,
}: {
  groups: AddonGroup[];
  expandedGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
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
              <td className="px-4 py-4 text-[#666]">{group.createdAt || ''}</td>
              <td className="px-4 py-4 text-right">
                <ActionButtons actions={['编辑类型', '新增加料项', '删除']} />
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
                <td className="px-4 py-4 text-[#666]">{item.createdAt}</td>
                <td className="px-4 py-4 text-right">
                  <ActionButtons actions={['编辑', '删除']} />
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
