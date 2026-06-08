import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutGrid,
  RotateCcw,
  Search,
  Store,
  X,
} from 'lucide-react';

type DomainId = 'archive' | 'operations' | 'store';
type LogTypeId =
  | 'archive_product'
  | 'archive_category'
  | 'archive_spec'
  | 'archive_method'
  | 'archive_addon'
  | 'archive_customization'
  | 'ops_template'
  | 'ops_template_product'
  | 'ops_price'
  | 'store_product'
  | 'store_category'
  | 'store_method'
  | 'store_addon';

type FilterKey =
  | 'operationType'
  | 'operatorAccount'
  | 'keyword'
  | 'objectName'
  | 'objectId'
  | 'objectType'
  | 'categoryType'
  | 'addonType'
  | 'sourceType'
  | 'taskName'
  | 'templateName'
  | 'strategyName'
  | 'storeName'
  | 'channel'
  | 'methodValue'
  | 'taskId';

type FilterState = {
  startDate: string;
  endDate: string;
  operationType: string;
  operatorAccount: string;
  keyword: string;
  objectName: string;
  objectId: string;
  objectType: string;
  categoryType: string;
  addonType: string;
  sourceType: string;
  taskName: string;
  templateName: string;
  strategyName: string;
  storeName: string;
  channel: string;
  methodValue: string;
  taskId: string;
};

type SnapshotField = {
  label: string;
  before: string;
  after: string;
};

type SnapshotSection = {
  title: string;
  fields: SnapshotField[];
};

type LogSnapshot = {
  title: string;
  sections: SnapshotSection[];
  displayMode?: 'after_only' | 'before_after';
};

type DetailList = {
  title: string;
  beforeTitle: string;
  afterTitle: string;
  beforeItems: string[];
  afterItems: string[];
};

type LogRecord = {
  id: string;
  objectName: string;
  objectId?: string;
  objectType?: string;
  categoryType?: string;
  categoryLevel?: string;
  addonType?: string;
  sourceType?: string;
  taskName?: string;
  templateName?: string;
  strategyName?: string;
  storeName?: string;
  channel?: string;
  methodValue?: string;
  taskId?: string;
  operationType: string;
  operationContent: string;
  beforeChange?: string;
  afterChange?: string;
  operatorName: string;
  operatorAccount: string;
  operationPlatform: string;
  operationTime: string;
  operationModule: string;
  operationIp?: string;
  snapshot?: LogSnapshot;
  detailList?: DetailList;
};

type FilterDef = {
  key: FilterKey;
  label: string;
  type: 'text' | 'select';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  span?: string;
};

type ColumnDef = {
  key: string;
  label: string;
  minWidth?: string;
  render: (record: LogRecord) => React.ReactNode;
};

type LogTypeConfig = {
  id: LogTypeId;
  domain: DomainId;
  name: string;
  subtitle: string;
  filterDefs: FilterDef[];
  operationOptions: Array<{ value: string; label: string }>;
  columns: ColumnDef[];
  records: LogRecord[];
  enableSnapshot: boolean;
  searchText: (record: LogRecord) => string;
};

const DEFAULT_FILTERS: FilterState = {
  startDate: '',
  endDate: '',
  operationType: '',
  operatorAccount: '',
  keyword: '',
  objectName: '',
  objectId: '',
  objectType: '',
  categoryType: '',
  addonType: '',
  sourceType: '',
  taskName: '',
  templateName: '',
  strategyName: '',
  storeName: '',
  channel: '',
  methodValue: '',
  taskId: '',
};

const ITEMS_PER_PAGE = 8;

const STORE_OPTIONS = [
  { value: '', label: '全部门店' },
  { value: '一级门店5', label: '一级门店5' },
  { value: '一级门店8', label: '一级门店8' },
  { value: '南山万象店', label: '南山万象店' },
];

const CHANNEL_OPTIONS = [
  { value: '', label: '全部渠道' },
  { value: 'POS', label: 'POS' },
  { value: '小程序-堂食', label: '小程序-堂食' },
  { value: '小程序-外卖', label: '小程序-外卖' },
  { value: '美团外卖', label: '美团外卖' },
];

const SOURCE_OPTIONS = [
  { value: '', label: '全部来源' },
  { value: '门店手工修改', label: '门店手工修改' },
  { value: '商品库下发', label: '商品库下发' },
  { value: '批量修改工具', label: '批量修改工具' },
  { value: '商品同步', label: '商品同步' },
  { value: '自动补足', label: '自动补足' },
];

const COMMON_OPERATOR_FILTER: FilterDef = {
  key: 'operatorAccount',
  label: '操作人账号',
  type: 'text',
  placeholder: '请输入操作人账号',
};

const operationOptions = (items: string[]) => [{ value: '', label: '全部' }, ...items.map(item => ({ value: item, label: item }))];

const snapshot = (title: string, sections: SnapshotSection[], displayMode: LogSnapshot['displayMode'] = 'before_after'): LogSnapshot => ({
  title,
  sections,
  displayMode,
});

const getChangeView = (record: LogRecord) => {
  if (record.sourceType) {
    if (['商品库下发', '批量修改工具', '商品同步'].includes(record.sourceType)) {
      return '品牌视角';
    }
    return '门店视角';
  }
  return record.storeName ? '门店视角' : '品牌视角';
};

const DOMAIN_META: Array<{ id: DomainId; name: string; icon: React.ReactNode; description: string }> = [
  {
    id: 'archive',
    name: '商品档案',
    icon: <Box size={18} />,
    description: '查看商品库商品、分类、规格、做法、加料、随心配等总部级信息变动。',
  },
  {
    id: 'operations',
    name: '商品运营',
    icon: <LayoutGrid size={18} />,
    description: '查看模板、模板商品、价格体系等运营级信息变动。',
  },
  {
    id: 'store',
    name: '门店商品',
    icon: <Store size={18} />,
    description: '查看门店商品、门店分类、门店做法、门店加料等门店级信息变动。',
  },
];

const nameColumn = (label: string): ColumnDef => ({
  key: 'objectName',
  label,
  minWidth: 'min-w-[220px]',
  render: record => (
    <div>
      <div className="font-medium text-[#1F2129]">{record.objectName}</div>
      {record.objectId ? <div className="mt-1 text-[12px] text-[#98A2B3]">ID: {record.objectId}</div> : null}
    </div>
  ),
});

const templateColumn: ColumnDef = {
  key: 'templateName',
  label: '模板名称',
  minWidth: 'min-w-[190px]',
  render: record => record.templateName || '--',
};

const strategyColumn: ColumnDef = {
  key: 'strategyName',
  label: '价格体系',
  minWidth: 'min-w-[180px]',
  render: record => record.strategyName || '--',
};

const objectTypeColumn = (label = '商品类型'): ColumnDef => ({
  key: 'objectType',
  label,
  minWidth: 'min-w-[120px]',
  render: record => <span className="whitespace-nowrap">{record.objectType || '--'}</span>,
});

const categoryTypeColumn: ColumnDef = {
  key: 'categoryType',
  label: '类型',
  minWidth: 'min-w-[120px]',
  render: record => <span className="whitespace-nowrap">{record.categoryType || '--'}</span>,
};

const categoryLevelColumn: ColumnDef = {
  key: 'categoryLevel',
  label: '分类层级',
  minWidth: 'min-w-[120px]',
  render: record => <span className="whitespace-nowrap">{record.categoryLevel || '--'}</span>,
};

const addonTypeColumn: ColumnDef = {
  key: 'addonType',
  label: '加料类型',
  minWidth: 'min-w-[160px]',
  render: record => <span className="whitespace-nowrap">{record.addonType || '--'}</span>,
};

const sourceTypeColumn: ColumnDef = {
  key: 'sourceType',
  label: '变更来源',
  minWidth: 'min-w-[180px]',
  render: record => <span className="whitespace-nowrap">{record.sourceType ? `${getChangeView(record)} / ${record.sourceType}` : '--'}</span>,
};

const taskNameColumn: ColumnDef = {
  key: 'taskName',
  label: '任务名称',
  minWidth: 'min-w-[180px]',
  render: record => <span className="whitespace-nowrap">{record.taskName || '--'}</span>,
};

const storeColumn: ColumnDef = {
  key: 'storeName',
  label: '所属门店',
  minWidth: 'min-w-[150px]',
  render: record => record.storeName || '--',
};

const channelColumn: ColumnDef = {
  key: 'channel',
  label: '销售渠道',
  minWidth: 'min-w-[120px]',
  render: record => <span className="whitespace-nowrap">{record.channel || '--'}</span>,
};

const operationTypeColumn: ColumnDef = {
  key: 'operationType',
  label: '操作类型',
  minWidth: 'min-w-[130px]',
  render: record => <OperationBadge value={record.operationType} />,
};

const operationContentColumn: ColumnDef = {
  key: 'operationContent',
  label: '操作内容',
  minWidth: 'min-w-[300px]',
  render: record => (
    <div className="text-[#667085]">
      <div className="line-clamp-2">{`${getChangeView(record)} - ${record.operationContent}`}</div>
    </div>
  ),
};

const beforeColumn: ColumnDef = {
  key: 'before',
  label: '变更前',
  minWidth: 'min-w-[220px]',
  render: record => (record.beforeChange ? <div className="text-[#667085]">{record.beforeChange}</div> : <EmptyCell />),
};

const afterColumn: ColumnDef = {
  key: 'after',
  label: '变更后',
  minWidth: 'min-w-[220px]',
  render: record => (record.afterChange ? <div className="text-[#667085]">{record.afterChange}</div> : <EmptyCell />),
};

const taskColumn: ColumnDef = {
  key: 'taskId',
  label: '任务ID',
  minWidth: 'min-w-[160px]',
  render: record => (record.taskId ? <span className="whitespace-nowrap text-[#667085]">{record.taskId}</span> : <EmptyCell />),
};

const operatorColumn: ColumnDef = {
  key: 'operator',
  label: '操作人',
  minWidth: 'min-w-[170px]',
  render: record => (
    <div>
      <div>{record.operatorName}</div>
      <div className="mt-1 text-[12px] text-[#98A2B3]">{record.operatorAccount}</div>
    </div>
  ),
};

const platformColumn: ColumnDef = {
  key: 'platform',
  label: '操作平台',
  minWidth: 'min-w-[120px]',
  render: record => <span className="whitespace-nowrap">{record.operationPlatform}</span>,
};

const ipColumn: ColumnDef = {
  key: 'ip',
  label: '操作IP',
  minWidth: 'min-w-[130px]',
  render: record => (record.operationIp ? <span className="whitespace-nowrap">{record.operationIp}</span> : <EmptyCell />),
};

const timeColumn: ColumnDef = {
  key: 'time',
  label: '操作时间',
  minWidth: 'min-w-[180px]',
  render: record => <span className="whitespace-nowrap">{record.operationTime}</span>,
};

const moduleColumn: ColumnDef = {
  key: 'module',
  label: '操作模块',
  minWidth: 'min-w-[140px]',
  render: record => <span className="whitespace-nowrap">{record.operationModule}</span>,
};

const methodValueColumn: ColumnDef = {
  key: 'methodValue',
  label: '做法值',
  minWidth: 'min-w-[120px]',
  render: record => <span className="whitespace-nowrap">{record.methodValue || '--'}</span>,
};

const LOG_TYPE_CONFIGS: LogTypeConfig[] = [
  {
    id: 'archive_product',
    domain: 'archive',
    name: '商品库商品变动日志',
    subtitle: '记录商品库商品的启售、停售、归档、资料变更及分类、规格、做法、加料调整。',
    operationOptions: operationOptions(['商品新建', '商品停售', '商品启售', '商品归档', '商品资料变更', '销售价变更', '前台分类变更', '后台分类变更', '规格变更', '做法变更', '加料变更']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['商品新建', '商品停售', '商品启售', '商品归档', '商品资料变更', '销售价变更', '前台分类变更', '后台分类变更', '规格变更', '做法变更', '加料变更']) },
      { key: 'objectName', label: '商品名称', type: 'text', placeholder: '请输入商品名称' },
      { key: 'objectId', label: '商品ID', type: 'text', placeholder: '请输入商品ID' },
      { key: 'objectType', label: '商品类型', type: 'select', options: operationOptions(['标准商品', '套餐商品']) },
      COMMON_OPERATOR_FILTER,
      { key: 'keyword', label: '关键词', type: 'text', placeholder: '请输入摘要关键词' },
    ],
    columns: [nameColumn('商品名称'), objectTypeColumn(), operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, moduleColumn, timeColumn],
    records: [
      {
        id: 'archive-product-1',
        objectName: '招牌芝士莓莓',
        objectId: 'P1008601',
        objectType: '标准商品',
        operationType: '商品新建',
        operationContent: '新建标准商品并保存商品资料。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: '开放平台',
        operationTime: '2026-05-28 11:35:53',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-2',
        objectName: '招牌芝士莓莓',
        objectId: 'P1008645',
        objectType: '标准商品',
        operationType: '商品停售',
        operationContent: '商品状态由启售调整为停售。',
        beforeChange: '启售',
        afterChange: '停售',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 10:23:16',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-3',
        objectName: '杨枝甘露',
        objectId: 'P1008892',
        objectType: '标准商品',
        operationType: '商品启售',
        operationContent: '商品状态由停售调整为启售。',
        beforeChange: '停售',
        afterChange: '启售',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 09:58:16',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-4',
        objectName: '双人欢聚套餐',
        objectId: 'P2001021',
        objectType: '套餐商品',
        operationType: '商品归档',
        operationContent: '商品状态调整为已归档。',
        beforeChange: '启售',
        afterChange: '已归档',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 09:15:08',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-5',
        objectName: '轻芝葡萄冰',
        objectId: 'P1008790',
        objectType: '标准商品',
        operationType: '商品资料变更',
        operationContent: '编辑商品资料，更新基础信息、商品属性、展示设置和销售属性。',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 18:33:42',
        operationModule: '商品库商品',
        snapshot: snapshot('标准商品编辑页快照', [
          {
            title: '基础信息',
            fields: [
              { label: '商品名称', before: '', after: '轻芝葡萄冰' },
              { label: '商品别名', before: '', after: '轻芝葡萄' },
              { label: '商品编码', before: '', after: 'P1008790' },
              { label: '前台分类', before: '', after: '冰饮推荐' },
              { label: '后台分类', before: '', after: '饮品成品' },
              { label: '商品类目', before: '', after: '水果茶' },
              { label: '计量单位', before: '', after: '杯' },
              { label: '商品主图', before: '', after: '已上传 1 张' },
            ],
          },
          {
            title: '商品属性',
            fields: [
              { label: '规格', before: '', after: '多规格' },
              { label: '规格明细', before: '', after: '中杯 | 销售价 18 元 | 规格编码 SG-GRAPE-M\n大杯 | 销售价 20 元 | 规格编码 SG-GRAPE-L' },
              { label: '做法', before: '', after: '糖度: 无糖 / 半糖 / 七分糖 / 全糖\n温度: 正常冰 / 少冰 / 去冰' },
              { label: '加料配置', before: '', after: '珍珠 / 椰果 / 西柚粒' },
              { label: '加料规则', before: '', after: '点餐时起购 0 份，单个加料限购 2 份' },
            ],
          },
          {
            title: '展示设置',
            fields: [
              { label: '描述标签', before: '', after: '果香 / 人气推荐' },
              { label: '点单页简介', before: '', after: '葡萄果肉搭配轻芝，支持冰饮展示' },
              { label: '商品详情图', before: '', after: '已上传 2 张' },
              { label: '商品详情', before: '', after: '详情页已补充大图与饮用建议' },
            ],
          },
          {
            title: '销售属性',
            fields: [
              { label: '销售价', before: '', after: '中杯 18 元\n大杯 20 元' },
              { label: '市场价', before: '', after: '中杯 22 元\n大杯 24 元' },
              { label: '预估成本价', before: '', after: '中杯 6.5 元\n大杯 7.8 元' },
              { label: '库存设置', before: '', after: '按规格管理库存' },
              { label: '销售渠道', before: '', after: 'POS / 小程序堂食 / 小程序外卖' },
            ],
          },
          {
            title: '其他属性',
            fields: [
              { label: '备注', before: '', after: '夏季主推单品' },
              { label: '商品分享', before: '', after: '分享标题：轻芝葡萄冰\n分享描述：葡萄果香更清爽' },
            ],
          },
        ], 'after_only'),
      },
      {
        id: 'archive-product-6',
        objectName: '招牌芝士莓莓',
        objectId: 'P1008645',
        objectType: '标准商品',
        operationType: '销售价变更',
        operationContent: '调整了多规格商品销售价。',
        beforeChange: '中杯 18 元 / 大杯 20 元',
        afterChange: '中杯 19 元 / 大杯 22 元',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 08:36:22',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-7',
        objectName: '轻芝葡萄冰',
        objectId: 'P1008790',
        objectType: '标准商品',
        operationType: '前台分类变更',
        operationContent: '商品前台分类由“水果茶”调整为“冰饮推荐”。',
        beforeChange: '水果茶',
        afterChange: '冰饮推荐',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 17:55:42',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-8',
        objectName: '轻芝葡萄冰',
        objectId: 'P1008790',
        objectType: '标准商品',
        operationType: '后台分类变更',
        operationContent: '商品后台分类由“夏季饮品”调整为“饮品成品”。',
        beforeChange: '夏季饮品',
        afterChange: '饮品成品',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 17:40:12',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-9',
        objectName: '双人欢聚套餐',
        objectId: 'P2001021',
        objectType: '套餐商品',
        operationType: '规格变更',
        operationContent: '套餐商品规格由“默认”调整为“2人餐 / 4人餐”。',
        beforeChange: '默认',
        afterChange: '2人餐 / 4人餐',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 16:28:42',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-10',
        objectName: '招牌芝士莓莓',
        objectId: 'P1008645',
        objectType: '标准商品',
        operationType: '做法变更',
        operationContent: '商品关联做法由“糖度、温度”调整为“糖度、温度、冷热建议”。',
        beforeChange: '糖度 / 温度',
        afterChange: '糖度 / 温度 / 冷热建议',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 15:08:58',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-11',
        objectName: '招牌芝士莓莓',
        objectId: 'P1008645',
        objectType: '标准商品',
        operationType: '加料变更',
        operationContent: '商品关联加料由“珍珠、椰果”调整为“珍珠、椰果、西柚粒”。',
        beforeChange: '珍珠 / 椰果',
        afterChange: '珍珠 / 椰果 / 西柚粒',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 14:24:18',
        operationModule: '商品库商品',
      },
      {
        id: 'archive-product-12',
        objectName: '双人欢聚套餐',
        objectId: 'P2001021',
        objectType: '套餐商品',
        operationType: '商品资料变更',
        operationContent: '编辑了套餐商品资料和套餐商品配置。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 13:40:21',
        operationModule: '商品库商品',
        snapshot: snapshot('套餐商品编辑页快照', [
          {
            title: '基础信息',
            fields: [
              { label: '套餐名称', before: '', after: '双人欢聚套餐' },
              { label: '基础价格', before: '', after: '58 元' },
              { label: '前台分类', before: '', after: '双人套餐' },
              { label: '商品类目', before: '', after: '套餐商品' },
              { label: '计量单位', before: '', after: '份' },
              { label: '商品主图', before: '', after: '已上传 1 张' },
              { label: '后台分类', before: '', after: '套餐成品' },
              { label: '备注', before: '', after: '堂食主推双人套餐' },
            ],
          },
          {
            title: '套餐商品配置',
            fields: [
              { label: '固定搭配', before: '', after: '招牌奶茶 x2 | 打印\n小食拼盘 x1 | 不打印' },
              { label: '可选分组', before: '', after: '小吃二选一：鸡米花 / 薯条\n分组设置：必选 1，默认 鸡米花' },
              { label: '选择随心配', before: '', after: '饮品升级随心配\n模板编码 FM-2201' },
            ],
          },
          {
            title: '展示设置',
            fields: [
              { label: '点单页简介', before: '', after: '双人分享更划算' },
              { label: '描述标签', before: '', after: '双人套餐 / 门店推荐' },
              { label: '商品详情图', before: '', after: '已上传 3 张' },
              { label: '商品详情', before: '', after: '详情页说明已补充套餐组成与规则' },
            ],
          },
          {
            title: '销售属性',
            fields: [
              { label: '起购设置', before: '', after: '最低起购 1 份' },
              { label: '限购设置', before: '', after: '单笔最多购买 2 份' },
              { label: '售卖设置', before: '', after: '堂食 / 外带' },
              { label: '税率', before: '', after: '6%' },
            ],
          },
          {
            title: '其他属性',
            fields: [
              { label: '预留备货时间', before: '', after: '提前 20 分钟备货' },
              { label: '设为主食', before: '', after: '否' },
              { label: '商品分享', before: '', after: '分享标题：双人欢聚套餐\n分享描述：双人点单更省心' },
            ],
          },
        ], 'after_only'),
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.objectName}${record.objectId || ''}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'archive_category',
    domain: 'archive',
    name: '商品分类变动日志',
    subtitle: '记录商品分类新建、删除、编辑及排序变化，支持区分前台分类与后台分类。',
    operationOptions: operationOptions(['分类新建', '分类删除', '分类编辑', '分类排序变更']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['分类新建', '分类删除', '分类编辑', '分类排序变更']) },
      { key: 'objectName', label: '分类名称', type: 'text', placeholder: '请输入分类名称' },
      { key: 'categoryType', label: '类型', type: 'select', options: operationOptions(['前台分类', '后台分类']) },
      { key: 'objectId', label: '分类ID', type: 'text', placeholder: '请输入分类ID' },
      COMMON_OPERATOR_FILTER,
      { key: 'keyword', label: '关键词', type: 'text', placeholder: '请输入关键词' },
    ],
    columns: [nameColumn('分类名称'), categoryTypeColumn, categoryLevelColumn, operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'archive-category-1',
        objectName: '招牌奶茶',
        objectId: 'C101',
        categoryType: '前台分类',
        categoryLevel: '一级分类',
        operationType: '分类新建',
        operationContent: '新建前台一级分类。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 09:18:20',
        operationModule: '商品分类',
      },
      {
        id: 'archive-category-2',
        objectName: '春季新品',
        objectId: 'C109',
        categoryType: '前台分类',
        categoryLevel: '一级分类',
        operationType: '分类排序变更',
        operationContent: '调整了前台分类排序。',
        beforeChange: '5',
        afterChange: '2',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 15:40:11',
        operationModule: '商品分类',
      },
      {
        id: 'archive-category-3',
        objectName: '春季新品',
        objectId: 'C116',
        categoryType: '前台分类',
        categoryLevel: '一级分类',
        operationType: '分类编辑',
        operationContent: '编辑前台分类信息，更新图标、banner 和展示渠道。',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 13:08:45',
        operationModule: '商品分类',
        snapshot: snapshot('商品分类编辑页快照', [
          {
            title: '基础信息',
            fields: [
              { label: '分类名称', before: '春日上新', after: '春季新品' },
              { label: '分类标识', before: 'spring-special', after: 'spring-new' },
              { label: '分类标签', before: '春日', after: '新品' },
              { label: '分类描述', before: '春季活动饮品', after: '春季限定饮品优先展示' },
              { label: '分类备注', before: '活动期默认展示', after: '首页活动期间置顶展示' },
              { label: '图标', before: '已上传 0 张', after: '已上传 1 张' },
              { label: '分类banner', before: '已上传 0 张', after: '已上传 1 张' },
            ],
          },
          {
            title: '分类设置',
            fields: [
              { label: '排序', before: '5', after: '2' },
              { label: '展示渠道', before: '微信小程序 / 企迈POS', after: '微信小程序 / 企迈POS / 企迈H5' },
            ],
          },
        ]),
      },
      {
        id: 'archive-category-4',
        objectName: '季节限定',
        objectId: 'C120',
        categoryType: '后台分类',
        categoryLevel: '二级分类',
        operationType: '分类删除',
        operationContent: '删除后台二级分类。',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 19:12:16',
        operationModule: '商品分类',
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.objectName}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'archive_spec',
    domain: 'archive',
    name: '规格变动日志',
    subtitle: '记录规格和规格值的新建、删除、编辑。',
    operationOptions: operationOptions(['规格新建', '规格删除', '规格编辑', '规格值新增', '规格值删除', '规格值编辑']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['规格新建', '规格删除', '规格编辑', '规格值新增', '规格值删除', '规格值编辑']) },
      { key: 'objectName', label: '规格名称', type: 'text', placeholder: '请输入规格名称' },
      { key: 'objectId', label: '规格ID', type: 'text', placeholder: '请输入规格ID' },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [nameColumn('规格名称'), operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'archive-spec-1',
        objectName: '糖度',
        objectId: 'SPEC001',
        operationType: '规格新建',
        operationContent: '新建规格组。',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 16:10:20',
        operationModule: '规格',
      },
      {
        id: 'archive-spec-2',
        objectName: '杯型',
        objectId: 'SPEC003',
        operationType: '规格删除',
        operationContent: '删除规格组。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 14:18:55',
        operationModule: '规格',
      },
      {
        id: 'archive-spec-3',
        objectName: '温度',
        objectId: 'SPEC018',
        operationType: '规格编辑',
        operationContent: '编辑规格组信息。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 12:42:03',
        operationModule: '规格',
        snapshot: snapshot('规格编辑页快照', [
          {
            title: '规格组信息',
            fields: [
              { label: '规格名称', before: '商品温度', after: '温度' },
              { label: '规格描述', before: '默认温度设置', after: '默认提供标准温度及微冰选项' },
            ],
          },
          {
            title: '规格值设置',
            fields: [
              { label: '规格值', before: '热 / 常温 / 去冰 / 少冰 / 正常冰', after: '热 / 常温 / 去冰 / 少冰 / 正常冰 / 微冰' },
              { label: '规格值编码', before: 'HOT / NORMAL / NOICE / LESS / ICE', after: 'HOT / NORMAL / NOICE / LESS / ICE / MICROICE' },
            ],
          },
        ]),
      },
      {
        id: 'archive-spec-4',
        objectName: '糖度',
        objectId: 'SPEC010',
        operationType: '规格值新增',
        operationContent: '新增规格值“七分糖”。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 13:04:55',
        operationModule: '规格',
      },
      {
        id: 'archive-spec-5',
        objectName: '糖度',
        objectId: 'SPEC010',
        operationType: '规格值删除',
        operationContent: '删除规格值“少糖”。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 12:54:55',
        operationModule: '规格',
      },
      {
        id: 'archive-spec-6',
        objectName: '糖度',
        objectId: 'SPEC010',
        operationType: '规格值编辑',
        operationContent: '规格值由“全糖”调整为“标准糖”。',
        beforeChange: '无糖 / 半糖 / 全糖',
        afterChange: '无糖 / 半糖 / 标准糖',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 12:44:55',
        operationModule: '规格',
        snapshot: snapshot('规格值编辑页快照', [
          {
            title: '规格值设置',
            fields: [
              { label: '规格名称', before: '糖度', after: '糖度' },
              { label: '规格值', before: '无糖 / 半糖 / 全糖', after: '无糖 / 半糖 / 标准糖' },
              { label: '规格值编码', before: 'NO-SUGAR / HALF-SUGAR / FULL-SUGAR', after: 'NO-SUGAR / HALF-SUGAR / NORMAL-SUGAR' },
            ],
          },
        ]),
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.objectName}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'archive_method',
    domain: 'archive',
    name: '做法变动日志',
    subtitle: '记录做法和做法值的新建、删除、编辑。',
    operationOptions: operationOptions(['做法新建', '做法删除', '做法编辑', '做法值新增', '做法值删除', '做法值编辑']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['做法新建', '做法删除', '做法编辑', '做法值新增', '做法值删除', '做法值编辑']) },
      { key: 'objectName', label: '做法名称', type: 'text', placeholder: '请输入做法名称' },
      { key: 'objectId', label: '做法ID', type: 'text', placeholder: '请输入做法ID' },
      { key: 'methodValue', label: '做法值', type: 'text', placeholder: '请输入做法值' },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [nameColumn('做法名称'), methodValueColumn, operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'archive-method-1',
        objectName: '糖度',
        objectId: 'METHOD001',
        operationType: '做法新建',
        operationContent: '新建做法并配置默认值。',
        methodValue: '--',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 12:25:22',
        operationModule: '商品属性-做法',
      },
      {
        id: 'archive-method-2',
        objectName: '口感',
        objectId: 'METHOD008',
        operationType: '做法删除',
        operationContent: '做法已删除。',
        methodValue: '--',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 10:35:22',
        operationModule: '商品属性-做法',
      },
      {
        id: 'archive-method-3',
        objectName: '温度',
        objectId: 'METHOD003',
        operationType: '做法编辑',
        operationContent: '编辑做法组基础信息。',
        methodValue: '--',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 17:30:18',
        operationModule: '商品属性-做法',
        snapshot: snapshot('做法编辑页快照', [
          {
            title: '做法组信息',
            fields: [
              { label: '做法名称', before: '商品温度', after: '温度' },
              { label: '备注', before: '门店通用温度', after: '基础温度做法' },
              { label: '温馨提示', before: '少冰口感更佳', after: '微冰口感更轻' },
              { label: '做法值多选', before: '开启', after: '关闭' },
              { label: '做法选项', before: '非必选', after: '必选' },
            ],
          },
          {
            title: '做法值设置',
            fields: [
              { label: '做法值', before: '正常冰 / 少冰 / 去冰', after: '正常冰 / 少冰 / 微冰 / 去冰' },
              { label: '做法标识码', before: 'ICE / LESS / NOICE', after: 'ICE / LESS / MICROICE / NOICE' },
            ],
          },
        ]),
      },
      {
        id: 'archive-method-4',
        objectName: '糖度',
        objectId: 'METHOD001',
        operationType: '做法值新增',
        operationContent: '新增做法值“七分糖”。',
        methodValue: '七分糖',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 12:35:22',
        operationModule: '商品属性-做法',
      },
      {
        id: 'archive-method-5',
        objectName: '糖度',
        objectId: 'METHOD001',
        operationType: '做法值删除',
        operationContent: '删除做法值“全糖”。',
        methodValue: '全糖',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 12:15:22',
        operationModule: '商品属性-做法',
      },
      {
        id: 'archive-method-6',
        objectName: '糖度',
        objectId: 'METHOD001',
        operationType: '做法值编辑',
        operationContent: '编辑做法值信息。',
        methodValue: '七分糖',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 11:55:22',
        operationModule: '商品属性-做法',
        snapshot: snapshot('做法值编辑页快照', [
          {
            title: '做法值设置',
            fields: [
              { label: '做法名称', before: '糖度', after: '糖度' },
              { label: '做法值', before: '全糖', after: '七分糖' },
              { label: '做法标识码', before: 'FULL-SUGAR', after: 'SEVEN-SUGAR' },
              { label: '备注', before: '默认推荐甜度', after: '推荐茶饮默认糖度' },
              { label: '温馨提示', before: '口感偏甜', after: '口感较清爽' },
            ],
          },
        ]),
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.objectName}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'archive_addon',
    domain: 'archive',
    name: '加料变动日志',
    subtitle: '记录加料类型和加料商品的新建、删除、编辑、价格与库存变化。',
    operationOptions: operationOptions(['加料类型新建', '加料类型删除', '加料类型编辑', '加料新建', '加料编辑', '加料删除', '加料价格变更', '加料初始库存变更', '加料排序变更']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['加料类型新建', '加料类型删除', '加料类型编辑', '加料新建', '加料编辑', '加料删除', '加料价格变更', '加料初始库存变更', '加料排序变更']) },
      { key: 'addonType', label: '加料类型', type: 'text', placeholder: '请输入加料类型' },
      { key: 'objectName', label: '加料名称', type: 'text', placeholder: '请输入加料名称' },
      { key: 'objectId', label: '加料ID', type: 'text', placeholder: '请输入加料ID' },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [addonTypeColumn, nameColumn('加料名称'), operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'archive-addon-1',
        objectName: '默认类型',
        objectId: 'ATYPE000',
        addonType: '默认类型',
        operationType: '加料类型新建',
        operationContent: '新建加料类型。',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 11:07:10',
        operationModule: '商品属性-加料',
      },
      {
        id: 'archive-addon-2',
        objectName: '季节限定类型',
        objectId: 'ATYPE010',
        addonType: '季节限定类型',
        operationType: '加料类型删除',
        operationContent: '删除加料类型。',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 10:57:10',
        operationModule: '商品属性-加料',
      },
      {
        id: 'archive-addon-3',
        objectName: '0506加料',
        objectId: 'ATYPE001',
        addonType: '0506加料',
        operationType: '加料类型编辑',
        operationContent: '编辑加料类型基础信息。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 20:10:56',
        operationModule: '商品属性-加料',
        snapshot: snapshot('加料类型编辑页快照', [
          {
            title: '加料类型信息',
            fields: [
              { label: '加料类型', before: '0506水果加料', after: '0506加料' },
              { label: '排序', before: '5', after: '3' },
              { label: '描述', before: '水果加料', after: '水果类加料，支持多选' },
            ],
          },
        ]),
      },
      {
        id: 'archive-addon-4',
        objectName: '奶油顶',
        objectId: 'ADDON008',
        addonType: '默认类型',
        operationType: '加料新建',
        operationContent: '新建加料。',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 11:07:10',
        operationModule: '商品属性-加料',
      },
      {
        id: 'archive-addon-5',
        objectName: '0506葡萄改',
        objectId: 'ADDON056',
        addonType: '0506加料',
        operationType: '加料编辑',
        operationContent: '编辑加料商品基础信息。',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 11:17:10',
        operationModule: '商品属性-加料',
        snapshot: snapshot('加料编辑页快照', [
          {
            title: '基础信息',
            fields: [
              { label: '加料商品名称', before: '0506葡萄', after: '0506葡萄改' },
              { label: '加料类型', before: '默认类型', after: '0506加料' },
              { label: '加料商品编码', before: 'ADDON-0506', after: 'ADDON-0506-G' },
              { label: '初始价格', before: '6.88 元', after: '8.88 元' },
              { label: '库存设置', before: '不限库存', after: '自定义库存' },
              { label: '商品状态', before: '禁用', after: '启用' },
            ],
          },
        ]),
      },
      {
        id: 'archive-addon-6',
        objectName: '布丁',
        objectId: 'ADDON018',
        addonType: '默认类型',
        operationType: '加料删除',
        operationContent: '删除加料。',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 16:41:51',
        operationModule: '商品属性-加料',
      },
      {
        id: 'archive-addon-7',
        objectName: '奶油顶',
        objectId: 'ADDON008',
        addonType: '默认类型',
        operationType: '加料价格变更',
        operationContent: '调整了加料售价。',
        beforeChange: '2 元',
        afterChange: '3 元',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 10:17:10',
        operationModule: '商品属性-加料',
      },
      {
        id: 'archive-addon-8',
        objectName: '西柚粒',
        objectId: 'ADDON028',
        addonType: '0506加料',
        operationType: '加料初始库存变更',
        operationContent: '调整了加料初始库存。',
        beforeChange: '20',
        afterChange: '50',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 11:01:51',
        operationModule: '商品属性-加料',
      },
      {
        id: 'archive-addon-9',
        objectName: '椰果',
        objectId: 'ADDON019',
        addonType: '默认类型',
        operationType: '加料排序变更',
        operationContent: '调整了加料排序。',
        beforeChange: '5',
        afterChange: '2',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 10:07:10',
        operationModule: '商品属性-加料',
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.objectName}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'archive_customization',
    domain: 'archive',
    name: '随心配变动日志',
    subtitle: '记录随心配的新建、删除和整体变更。',
    operationOptions: operationOptions(['随心配新建', '随心配删除', '随心配变更']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['随心配新建', '随心配删除', '随心配变更']) },
      { key: 'objectName', label: '随心配名称', type: 'text', placeholder: '请输入随心配名称' },
      { key: 'objectId', label: '随心配ID', type: 'text', placeholder: '请输入随心配ID' },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [nameColumn('随心配名称'), operationTypeColumn, operationContentColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'archive-custom-1',
        objectName: '冰量随心配',
        objectId: 'DIY001',
        operationType: '随心配新建',
        operationContent: '新建随心配模板。',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 15:20:09',
        operationModule: '商品属性-随心配',
      },
      {
        id: 'archive-custom-2',
        objectName: '冰量随心配',
        objectId: 'DIY001',
        operationType: '随心配变更',
        operationContent: '编辑随心配信息、分组选项和关联商品。',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 15:30:09',
        operationModule: '商品属性-随心配',
        snapshot: snapshot('随心配编辑页快照', [
          {
            title: '基础信息',
            fields: [
              { label: '分组ID', before: '1259918567343030272', after: '1259918567343030272' },
              { label: '分组名称', before: '冰量默认组', after: '冰量随心配' },
              { label: '分组编码', before: 'ICE-GROUP-01', after: 'ICE-GROUP-02' },
              { label: '备注', before: '默认冰量分组', after: '默认冰量分组，补充套餐商品适配' },
            ],
          },
          {
            title: '商品信息',
            fields: [
              { label: '商品标识', before: 'DIY-ICE-001', after: 'DIY-ICE-001' },
              { label: '商品条码', before: '8800001221', after: '8800001221' },
              { label: '关联商品', before: '多肉葡萄（标准商品）\n轻芝葡萄冰（标准商品）', after: '多肉葡萄（标准商品）\n轻芝葡萄冰（标准商品）\n双人欢聚套餐（套餐商品）' },
            ],
          },
          {
            title: '分组选项',
            fields: [
              { label: '分组设置', before: '单选', after: '随机可选' },
              { label: '随机可选', before: '2 选 1', after: '3 选 1' },
              { label: '单个商品可多选', before: '开启', after: '关闭' },
              { label: '最少购买数 / 最多购买数', before: '1 / 2', after: '1 / 1' },
            ],
          },
        ]),
      },
      {
        id: 'archive-custom-3',
        objectName: '奶基底随心配',
        objectId: 'DIY006',
        operationType: '随心配删除',
        operationContent: '删除随心配模板。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 19:06:25',
        operationModule: '商品属性-随心配',
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.objectName}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'ops_template',
    domain: 'operations',
    name: '商品模板变动日志',
    subtitle: '记录模板本身的新增、删除、编辑及适用门店、适用渠道变化。',
    operationOptions: operationOptions(['模板新建', '模板删除', '模板编辑', '模板适用门店变更', '模板适用渠道变更']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['模板新建', '模板删除', '模板编辑', '模板适用门店变更', '模板适用渠道变更']) },
      { key: 'templateName', label: '模板名称', type: 'text', placeholder: '请输入模板名称' },
      { key: 'storeName', label: '适用门店', type: 'select', options: STORE_OPTIONS },
      { key: 'channel', label: '适用渠道', type: 'select', options: CHANNEL_OPTIONS },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [templateColumn, operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, timeColumn, moduleColumn],
    records: [
      {
        id: 'ops-template-1',
        objectName: '模板对象',
        objectId: 'TPL001',
        templateName: '春季饮品模板',
        operationType: '模板新建',
        operationContent: '新建商品模板。',
        operatorName: '运营静静',
        operatorAccount: '15051404240',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 15:04:31',
        operationModule: '商品模板',
        snapshot: snapshot('商品模板编辑页快照', [
          {
            title: '模板基础信息',
            fields: [
              { label: '模板名称', before: '', after: '春季饮品模板' },
              { label: '适用门店', before: '', after: '一级门店5 / 一级门店8' },
              { label: '适用渠道', before: '', after: 'POS / 小程序堂食' },
            ],
          },
        ]),
      },
      {
        id: 'ops-template-2',
        objectName: '模板对象',
        objectId: 'TPL003',
        templateName: '通用奶茶模板',
        operationType: '模板编辑',
        operationContent: '编辑模板基础信息。',
        operatorName: '小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 21:14:47',
        operationModule: '商品模板',
        snapshot: snapshot('商品模板编辑页快照', [
          {
            title: '模板基础信息',
            fields: [
              { label: '模板名称', before: '门店奶茶模板', after: '通用奶茶模板' },
              { label: '适用门店', before: '一级门店5 / 一级门店8', after: '一级门店5 / 一级门店8 / 南山万象店' },
              { label: '适用渠道', before: 'POS / 小程序堂食', after: 'POS / 小程序堂食 / 小程序外卖' },
            ],
          },
        ]),
      },
      {
        id: 'ops-template-3',
        objectName: '模板对象',
        objectId: 'TPL001',
        templateName: '春季饮品模板',
        operationType: '模板适用门店变更',
        operationContent: '模板适用门店由 18 家调整为 32 家。',
        beforeChange: '18 家门店',
        afterChange: '32 家门店',
        operatorName: '运营静静',
        operatorAccount: '15051404240',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 16:04:31',
        operationModule: '商品模板',
        detailList: {
          title: '模板适用门店明细',
          beforeTitle: '变更前门店',
          afterTitle: '变更后门店',
          beforeItems: ['一级门店5', '一级门店8', '华强北店', '海岸城店', '车公庙店', '南头古城店'],
          afterItems: ['一级门店5', '一级门店8', '华强北店', '海岸城店', '车公庙店', '南头古城店', '南山万象店', '欢乐海岸店'],
        },
      },
      {
        id: 'ops-template-4',
        objectName: '模板对象',
        objectId: 'TPL007',
        templateName: '门店基础模板',
        operationType: '模板适用渠道变更',
        operationContent: '模板适用渠道由“POS”调整为“POS / 小程序堂食”。',
        beforeChange: 'POS',
        afterChange: 'POS / 小程序堂食',
        operatorName: '运营静静',
        operatorAccount: '15051404240',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 15:08:19',
        operationModule: '商品模板',
      },
      {
        id: 'ops-template-5',
        objectName: '模板对象',
        objectId: 'TPL006',
        templateName: '短期活动模板',
        operationType: '模板删除',
        operationContent: '删除商品模板。',
        operatorName: '运营静静',
        operatorAccount: '15051404240',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 14:08:19',
        operationModule: '商品模板',
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.templateName || ''}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'ops_template_product',
    domain: 'operations',
    name: '模板商品变动日志',
    subtitle: '记录模板内具体商品的新增、删除、更新及售价、做法、加料、前台分类变化。',
    operationOptions: operationOptions(['模板商品新增', '模板商品删除', '模板商品更新', '模板商品售价变更', '模板商品做法变更', '模板商品加料变更', '模板商品前台分类变更']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['模板商品新增', '模板商品删除', '模板商品更新', '模板商品售价变更', '模板商品做法变更', '模板商品加料变更', '模板商品前台分类变更']) },
      { key: 'templateName', label: '模板名称', type: 'text', placeholder: '请输入模板名称' },
      { key: 'objectName', label: '商品名称', type: 'text', placeholder: '请输入商品名称' },
      { key: 'objectId', label: '商品ID', type: 'text', placeholder: '请输入商品ID' },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [templateColumn, nameColumn('商品名称'), operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'ops-template-product-1',
        objectName: '抹茶拿铁',
        objectId: 'P1008622',
        templateName: '春季饮品模板',
        operationType: '模板商品新增',
        operationContent: '模板内新增商品。',
        operatorName: '运营静静',
        operatorAccount: '15051404240',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 14:38:48',
        operationModule: '模板商品',
      },
      {
        id: 'ops-template-product-2',
        objectName: '抹茶拿铁',
        objectId: 'P1008622',
        templateName: '春季饮品模板',
        operationType: '模板商品售价变更',
        operationContent: '模板商品售价由 16 元调整为 18 元。',
        beforeChange: '16 元',
        afterChange: '18 元',
        operatorName: '运营静静',
        operatorAccount: '15051404240',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 14:48:48',
        operationModule: '模板商品',
      },
      {
        id: 'ops-template-product-3',
        objectName: '草莓冰沙',
        objectId: 'P1008741',
        templateName: '夏季饮品模板',
        operationType: '模板商品更新',
        operationContent: '编辑模板商品基础信息。',
        operatorName: '产品同学',
        operatorAccount: '16688005231',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 18:16:33',
        operationModule: '模板商品',
        snapshot: snapshot('模板商品编辑页快照', [
          {
            title: '商品基础信息',
            fields: [
              { label: '模板名称', before: '', after: '夏季饮品模板' },
              { label: '商品名称', before: '', after: '草莓冰沙' },
              { label: '模板售价', before: '', after: '22 元' },
            ],
          },
          {
            title: '商品属性',
            fields: [
              { label: '规格', before: '', after: '中杯 / 大杯 / 超大杯' },
              { label: '默认规格', before: '', after: '大杯' },
            ],
          },
        ], 'after_only'),
      },
      {
        id: 'ops-template-product-4',
        objectName: '经典红茶',
        objectId: 'P1008301',
        templateName: '通用奶茶模板',
        operationType: '模板商品做法变更',
        operationContent: '模板商品做法由“糖度、温度”调整为“糖度、温度、冷热建议”。',
        beforeChange: '糖度 / 温度',
        afterChange: '糖度 / 温度 / 冷热建议',
        operatorName: '小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 18:15:09',
        operationModule: '模板商品',
      },
      {
        id: 'ops-template-product-5',
        objectName: '经典红茶',
        objectId: 'P1008301',
        templateName: '通用奶茶模板',
        operationType: '模板商品加料变更',
        operationContent: '模板商品加料由“珍珠”调整为“珍珠、椰果”。',
        beforeChange: '珍珠',
        afterChange: '珍珠 / 椰果',
        operatorName: '小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 18:05:09',
        operationModule: '模板商品',
      },
      {
        id: 'ops-template-product-6',
        objectName: '经典红茶',
        objectId: 'P1008301',
        templateName: '通用奶茶模板',
        operationType: '模板商品前台分类变更',
        operationContent: '模板商品前台分类由“经典茶饮”调整为“招牌推荐”。',
        beforeChange: '经典茶饮',
        afterChange: '招牌推荐',
        operatorName: '小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 17:55:09',
        operationModule: '模板商品',
      },
      {
        id: 'ops-template-product-7',
        objectName: '经典红茶',
        objectId: 'P1008301',
        templateName: '通用奶茶模板',
        operationType: '模板商品删除',
        operationContent: '商品从模板中删除。',
        operatorName: '小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 17:45:09',
        operationModule: '模板商品',
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.templateName || ''}${record.objectName}${record.objectId || ''}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'ops_price',
    domain: 'operations',
    name: '价格体系价格变动日志',
    subtitle: '记录价格体系基础信息、适用范围及商品体系价格变化。',
    operationOptions: operationOptions(['价格体系新建', '价格体系删除', '价格体系启用', '价格体系禁用', '价格体系生效日期变更', '价格体系生效渠道变更', '价格体系基础信息编辑', '价格体系适用门店变更', '商品体系价格变更']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['价格体系新建', '价格体系删除', '价格体系启用', '价格体系禁用', '价格体系生效日期变更', '价格体系生效渠道变更', '价格体系基础信息编辑', '价格体系适用门店变更', '商品体系价格变更']) },
      { key: 'strategyName', label: '价格体系名称', type: 'text', placeholder: '请输入价格体系名称' },
      { key: 'objectName', label: '商品名称', type: 'text', placeholder: '请输入商品名称' },
      { key: 'objectId', label: '商品ID', type: 'text', placeholder: '请输入商品ID' },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [strategyColumn, nameColumn('商品名称'), operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'ops-price-1',
        objectName: '--',
        objectId: '',
        strategyName: '春季活动价格体系',
        operationType: '价格体系新建',
        operationContent: '新建价格体系并配置生效时间与渠道。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 17:00:26',
        operationModule: '价格体系',
        snapshot: snapshot('价格体系编辑页快照', [
          {
            title: '基础信息',
            fields: [
              { label: '价格体系名称', before: '', after: '春季活动价格体系' },
              { label: '生效日期', before: '', after: '2026-05-28 至 2026-06-30' },
              { label: '生效渠道', before: '', after: 'POS / 小程序堂食' },
            ],
          },
        ]),
      },
      {
        id: 'ops-price-2',
        objectName: '--',
        objectId: '',
        strategyName: '春季活动价格体系',
        operationType: '价格体系删除',
        operationContent: '删除价格体系。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 17:10:26',
        operationModule: '价格体系',
      },
      {
        id: 'ops-price-3',
        objectName: '--',
        objectId: '',
        strategyName: '春季活动价格体系',
        operationType: '价格体系启用',
        operationContent: '价格体系由禁用调整为启用。',
        beforeChange: '禁用',
        afterChange: '启用',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: '供应链',
        operationTime: '2026-05-28 16:10:26',
        operationModule: '价格体系',
      },
      {
        id: 'ops-price-4',
        objectName: '--',
        objectId: '',
        strategyName: '周末活动价格体系',
        operationType: '价格体系禁用',
        operationContent: '价格体系由启用调整为禁用。',
        beforeChange: '启用',
        afterChange: '禁用',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 13:12:43',
        operationModule: '价格体系',
      },
      {
        id: 'ops-price-5',
        objectName: '--',
        objectId: '',
        strategyName: '五一促销价格体系',
        operationType: '价格体系生效日期变更',
        operationContent: '调整了价格体系生效日期。',
        beforeChange: '2026-05-01 至 2026-05-07',
        afterChange: '2026-05-01 至 2026-05-15',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 09:42:33',
        operationModule: '价格体系',
      },
      {
        id: 'ops-price-6',
        objectName: '--',
        objectId: '',
        strategyName: '节日活动价格体系',
        operationType: '价格体系生效渠道变更',
        operationContent: '调整了价格体系生效渠道。',
        beforeChange: 'POS',
        afterChange: 'POS / 小程序外卖',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 11:09:43',
        operationModule: '价格体系',
      },
      {
        id: 'ops-price-7',
        objectName: '--',
        objectId: '',
        strategyName: '周末活动价格体系',
        operationType: '价格体系基础信息编辑',
        operationContent: '编辑价格体系基础信息。',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 10:09:43',
        operationModule: '价格体系',
        snapshot: snapshot('价格体系编辑页快照', [
          {
            title: '基础信息',
            fields: [
              { label: '价格体系名称', before: '周末专享价格体系', after: '周末活动价格体系' },
              { label: '生效日期', before: '2026-05-29 至 2026-06-01', after: '2026-05-30 至 2026-06-02' },
              { label: '生效渠道', before: 'POS', after: 'POS / 小程序外卖' },
            ],
          },
        ]),
      },
      {
        id: 'ops-price-8',
        objectName: '--',
        objectId: '',
        strategyName: '周末活动价格体系',
        operationType: '价格体系适用门店变更',
        operationContent: '价格体系适用门店由 12 家调整为 18 家。',
        beforeChange: '12 家门店',
        afterChange: '18 家门店',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 09:49:43',
        operationModule: '价格体系',
      },
      {
        id: 'ops-price-9',
        objectName: '茉莉奶绿',
        objectId: 'P1008613',
        strategyName: '五一促销价格体系',
        operationType: '商品体系价格变更',
        operationContent: '价格体系内商品售价由中杯 19 元 / 大杯 21 元调整为中杯 17 元 / 大杯 19 元。',
        beforeChange: '中杯 19 元 / 大杯 21 元',
        afterChange: '中杯 17 元 / 大杯 19 元',
        operatorName: '运营小雨',
        operatorAccount: '18362905581',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 09:29:43',
        operationModule: '价格体系',
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.strategyName || ''}${record.objectName}${record.objectId || ''}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'store_product',
    domain: 'store',
    name: '门店商品变动日志',
    subtitle: '记录门店商品新建、删除、变更、上下架、库存、价格、做法、加料及分类排序变化。',
    operationOptions: operationOptions(['商品新建', '商品删除', '商品变更', '上下架', '库存变动', '价格变动', '做法变动', '加料变动', '前台分类变动', '分类下商品排序']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['商品新建', '商品删除', '商品变更', '上下架', '库存变动', '价格变动', '做法变动', '加料变动', '前台分类变动', '分类下商品排序']) },
      { key: 'storeName', label: '机构门店', type: 'select', options: STORE_OPTIONS },
      { key: 'channel', label: '销售渠道', type: 'select', options: CHANNEL_OPTIONS },
      { key: 'sourceType', label: '变更来源', type: 'select', options: SOURCE_OPTIONS },
      { key: 'objectName', label: '商品名称', type: 'text', placeholder: '请输入商品名称' },
      { key: 'objectId', label: '商品ID', type: 'text', placeholder: '请输入商品ID' },
      { key: 'taskId', label: '任务ID', type: 'text', placeholder: '请输入任务ID' },
      COMMON_OPERATOR_FILTER,
      { key: 'keyword', label: '关键词', type: 'text', placeholder: '请输入摘要关键词' },
    ],
    columns: [nameColumn('商品名称'), storeColumn, channelColumn, sourceTypeColumn, operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, taskNameColumn, taskColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'store-product-1',
        objectName: '0119 可达鸭',
        objectId: '1233082679507476480',
        storeName: '一级门店5',
        channel: 'POS',
        sourceType: '门店手工修改',
        operationType: '商品新建',
        operationContent: '门店自建商品',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 15:13:26',
        operationModule: '门店商品',
      },
      {
        id: 'store-product-2',
        objectName: '0119哈气',
        objectId: '1233084172608397313',
        storeName: '一级门店5',
        channel: 'POS',
        sourceType: '商品库下发',
        taskName: '商品库商品下发任务',
        taskId: 'SYNC-20260528-0001',
        operationType: '价格变动',
        operationContent: '商品库下发（任务ID:SYNC-20260528-0001）：大杯价格变更',
        beforeChange: '堂食价 16 元 / 外卖价 18 元',
        afterChange: '堂食价 18 元 / 外卖价 20 元',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 13:58:02',
        operationModule: '门店商品',
      },
      {
        id: 'store-product-3',
        objectName: '1126 葡萄',
        objectId: '1201168035407372288',
        storeName: '一级门店5',
        channel: '小程序-堂食',
        sourceType: '自动补足',
        taskName: '库存自动补足任务',
        taskId: 'AUTO-20260528-0007',
        operationType: '库存变动',
        operationContent: '自动补足：大杯',
        beforeChange: '剩余 0（自动补足最大值 1000）',
        afterChange: '剩余 1000（自动补足最大值 1000）',
        operatorName: 'chesster',
        operatorAccount: '18654050176',
        operationPlatform: '企迈数店App',
        operationTime: '2026-05-28 11:24:19',
        operationModule: '门店商品',
      },
      {
        id: 'store-product-4',
        objectName: '0119-跑',
        objectId: '1220007005803954176',
        storeName: '一级门店5',
        channel: '美团外卖',
        sourceType: '商品库下发',
        taskName: '商品库商品下发任务',
        taskId: 'SYNC-20260528-0002',
        operationType: '做法变动',
        operationContent: '商品库下发（任务ID:SYNC-20260528-0002）：大杯做法变更',
        beforeChange: '不辣',
        afterChange: '微辣 / 不辣 / 麻辣',
        operatorName: '运营同学',
        operatorAccount: '18715019751',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 10:21:31',
        operationModule: '门店商品',
      },
      {
        id: 'store-product-5',
        objectName: '0119 可达鸭',
        objectId: '1233082679507476480',
        storeName: '一级门店5',
        channel: 'POS',
        sourceType: '批量修改工具',
        taskName: '商品同步批量修改任务',
        taskId: 'BATCH-20260528-0003',
        operationType: '商品变更',
        operationContent: '商品同步批量修改（任务ID:BATCH-20260528-0003）：商品名称、售价、做法同步更新',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 14:13:26',
        operationModule: '门店商品',
        snapshot: snapshot('门店商品编辑快照', [
          {
            title: '基础信息',
            fields: [
              { label: '商品名称', before: '0119可达鸭', after: '0119可达鸭-大杯' },
              { label: '前台分类', before: '经典饮品', after: '经典饮品' },
              { label: '商品条码', before: 'SP-0119', after: 'SP-0119' },
            ],
          },
          {
            title: '售价设置',
            fields: [
              { label: '堂食价', before: '18 元', after: '19 元' },
              { label: '外卖价', before: '20 元', after: '21 元' },
              { label: '会员价', before: '17 元', after: '18 元' },
            ],
          },
          {
            title: '做法与加料',
            fields: [
              { label: '做法配置', before: '全糖 / 半糖', after: '全糖 / 七分糖 / 半糖' },
              { label: '加料配置', before: '珍珠 +2 元', after: '珍珠 +2 元；椰果 +2 元' },
            ],
          },
        ], 'after_only'),
      },
      {
        id: 'store-product-6',
        objectName: '0119 可达鸭',
        objectId: '1233082679507476480',
        storeName: '一级门店5',
        channel: 'POS',
        sourceType: '商品同步',
        taskName: '商品同步上架任务',
        taskId: 'PUSH-20260527-0008',
        operationType: '上下架',
        operationContent: '商品同步下架（任务ID:PUSH-20260527-0008）',
        beforeChange: '上架',
        afterChange: '下架',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'POS',
        operationTime: '2026-05-27 19:42:06',
        operationModule: '门店商品',
      },
      {
        id: 'store-product-7',
        objectName: '0119 可达鸭',
        objectId: '1233082679507476480',
        storeName: '一级门店5',
        channel: 'POS',
        sourceType: '商品库下发',
        taskName: '商品库商品下发任务',
        taskId: 'SYNC-20260527-0010',
        operationType: '加料变动',
        operationContent: '商品库下发（任务ID:SYNC-20260527-0010）：大杯加料变更',
        beforeChange: '珍珠 / 椰果 / 小料',
        afterChange: '珍珠',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 19:22:06',
        operationModule: '门店商品',
      },
      {
        id: 'store-product-8',
        objectName: '0119 可达鸭',
        objectId: '1233082679507476480',
        storeName: '一级门店5',
        channel: 'POS',
        sourceType: '商品库下发',
        taskName: '商品库商品下发任务',
        taskId: 'SYNC-20260527-0011',
        operationType: '前台分类变动',
        operationContent: '商品库下发（任务ID:SYNC-20260527-0011）：商品名称变更后为 0119 可达鸭；前台分类变更后为门店推荐、经典饮品',
        beforeChange: '经典饮品',
        afterChange: '门店推荐 / 经典饮品',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 19:02:06',
        operationModule: '门店商品',
      },
      {
        id: 'store-product-9',
        objectName: '0119 可达鸭',
        objectId: '1233082679507476480',
        storeName: '一级门店5',
        channel: 'POS',
        sourceType: '门店手工修改',
        operationType: '分类下商品排序',
        operationContent: '门店修改分类下商品排序',
        beforeChange: '分类1下排序：12\n分类2下排序：13',
        afterChange: '分类1下排序：6\n分类2下排序：15',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 18:52:06',
        operationModule: '门店商品',
      },
      {
        id: 'store-product-10',
        objectName: '0119大袋',
        objectId: '1220006723623763969',
        storeName: '一级门店5',
        channel: 'POS',
        sourceType: '商品库下发',
        taskName: '商品库归档同步任务',
        taskId: 'SYNC-20260527-0012',
        operationType: '商品删除',
        operationContent: '商品库归档同步删除门店商品',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 18:42:06',
        operationModule: '门店商品',
      },
    ],
    enableSnapshot: true,
    searchText: record =>
      `${record.objectName}${record.objectId || ''}${record.storeName || ''}${record.channel || ''}${record.sourceType || ''}${record.taskName || ''}${record.taskId || ''}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'store_category',
    domain: 'store',
    name: '门店分类变动日志',
    subtitle: '记录门店分类名称、排序、基础信息和关联商品调整。',
    operationOptions: operationOptions(['分类新建', '分类删除', '分类名称编辑', '分类排序变更', '分类基础信息变更', '分类关联商品调整']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['分类新建', '分类删除', '分类名称编辑', '分类排序变更', '分类基础信息变更', '分类关联商品调整']) },
      { key: 'storeName', label: '机构门店', type: 'select', options: STORE_OPTIONS },
      { key: 'sourceType', label: '变更来源', type: 'select', options: SOURCE_OPTIONS },
      { key: 'objectName', label: '分类名称', type: 'text', placeholder: '请输入分类名称' },
      { key: 'objectId', label: '分类ID', type: 'text', placeholder: '请输入分类ID' },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [nameColumn('分类名称'), storeColumn, sourceTypeColumn, operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'store-category-1',
        objectName: '门店饮品',
        objectId: 'SC1001',
        storeName: '一级门店8',
        sourceType: '门店手工修改',
        operationType: '分类新建',
        operationContent: '门店新建商品分类。',
        operatorName: '督导王芳',
        operatorAccount: '18900012311',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 10:06:50',
        operationModule: '门店分类',
      },
      {
        id: 'store-category-2',
        objectName: '门店饮品',
        objectId: 'SC1001',
        storeName: '一级门店8',
        sourceType: '门店手工修改',
        operationType: '分类排序变更',
        operationContent: '门店分类排序由 4 调整为 1。',
        beforeChange: '4',
        afterChange: '1',
        operatorName: '督导王芳',
        operatorAccount: '18900012311',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 10:16:50',
        operationModule: '门店分类',
      },
      {
        id: 'store-category-3',
        objectName: '门店新品专区',
        objectId: 'SC1009',
        storeName: '一级门店5',
        sourceType: '商品库下发',
        operationType: '分类基础信息变更',
        operationContent: '商品库下发：分类展示说明和营业时段更新。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 17:56:40',
        operationModule: '门店分类',
        snapshot: snapshot('门店分类变更快照', [
          {
            title: '基础信息',
            fields: [
              { label: '分类名称', before: '门店新品', after: '门店新品专区' },
              { label: '展示说明', before: '新品展示', after: '春季新品专区' },
              { label: '营业时段', before: '09:00 - 20:00', after: '10:00 - 21:00' },
            ],
          },
        ]),
      },
      {
        id: 'store-category-4',
        objectName: '门店饮品',
        objectId: 'SC1001',
        storeName: '一级门店8',
        sourceType: '门店手工修改',
        operationType: '分类名称编辑',
        operationContent: '分类名称由“门店茶饮”调整为“门店饮品”。',
        beforeChange: '门店茶饮',
        afterChange: '门店饮品',
        operatorName: '督导王芳',
        operatorAccount: '18900012311',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 18:26:40',
        operationModule: '门店分类',
      },
      {
        id: 'store-category-5',
        objectName: '门店新品专区',
        objectId: 'SC1009',
        storeName: '一级门店5',
        sourceType: '商品库下发',
        operationType: '分类关联商品调整',
        operationContent: '商品库下发：分类关联商品更新。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 17:36:40',
        operationModule: '门店分类',
        snapshot: snapshot('门店分类关联商品快照', [
          {
            title: '关联商品',
            fields: [
              { label: '分类名称', before: '门店新品专区', after: '门店新品专区' },
              { label: '关联商品', before: '轻芝葡萄冰\n多肉葡萄', after: '轻芝葡萄冰\n多肉葡萄\n杨枝甘露' },
            ],
          },
        ]),
      },
      {
        id: 'store-category-6',
        objectName: '门店季节限定',
        objectId: 'SC1018',
        storeName: '一级门店5',
        sourceType: '门店手工修改',
        operationType: '分类删除',
        operationContent: '删除门店分类。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-26 18:16:40',
        operationModule: '门店分类',
      },
    ],
    enableSnapshot: true,
    searchText: record => `${record.objectName}${record.storeName || ''}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
  {
    id: 'store_method',
    domain: 'store',
    name: '门店做法变动日志',
    subtitle: '仅记录门店做法启用与禁用。',
    operationOptions: operationOptions(['启用', '禁用']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['启用', '禁用']) },
      { key: 'storeName', label: '机构门店', type: 'select', options: STORE_OPTIONS },
      { key: 'sourceType', label: '变更来源', type: 'select', options: SOURCE_OPTIONS },
      { key: 'objectName', label: '做法名称', type: 'text', placeholder: '请输入做法名称' },
      { key: 'methodValue', label: '做法值', type: 'text', placeholder: '请输入做法值' },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [nameColumn('做法名称'), methodValueColumn, storeColumn, sourceTypeColumn, operationTypeColumn, operationContentColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'store-method-1',
        objectName: 'KOI温度',
        methodValue: '正常冰',
        storeName: '一级门店8',
        sourceType: '门店手工修改',
        operationType: '禁用',
        operationContent: '门店做法值单个禁用',
        operatorName: 'chesster',
        operatorAccount: '18654050176',
        operationPlatform: '企迈数店App',
        operationTime: '2026-05-28 13:11:28',
        operationModule: '门店做法',
      },
      {
        id: 'store-method-2',
        objectName: 'KOI温度',
        methodValue: '去冰',
        storeName: '一级门店8',
        sourceType: '门店手工修改',
        operationType: '启用',
        operationContent: '门店做法值单个启用',
        operatorName: 'chesster',
        operatorAccount: '18654050176',
        operationPlatform: '企迈数店App',
        operationTime: '2026-05-28 10:02:47',
        operationModule: '门店做法',
      },
      {
        id: 'store-method-3',
        objectName: 'KOI甜度',
        methodValue: '全糖',
        storeName: '一级门店5',
        sourceType: '门店手工修改',
        operationType: '禁用',
        operationContent: '门店做法值单个禁用',
        operatorName: '督导王芳',
        operatorAccount: '18900012311',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 18:06:09',
        operationModule: '门店做法',
      },
    ],
    enableSnapshot: false,
    searchText: record => `${record.objectName}${record.methodValue || ''}${record.storeName || ''}${record.operationContent}`,
  },
  {
    id: 'store_addon',
    domain: 'store',
    name: '门店加料变动日志',
    subtitle: '记录门店加料售价、库存、上下架、新建、删除和加料变更。',
    operationOptions: operationOptions(['售价变动', '库存变动', '上下架', '新建加料', '删除加料', '加料变更']),
    filterDefs: [
      { key: 'operationType', label: '操作类型', type: 'select', options: operationOptions(['售价变动', '库存变动', '上下架', '新建加料', '删除加料', '加料变更']) },
      { key: 'storeName', label: '机构门店', type: 'select', options: STORE_OPTIONS },
      { key: 'sourceType', label: '变更来源', type: 'select', options: SOURCE_OPTIONS },
      { key: 'objectName', label: '加料名称', type: 'text', placeholder: '请输入加料名称' },
      COMMON_OPERATOR_FILTER,
    ],
    columns: [nameColumn('加料名称'), storeColumn, sourceTypeColumn, operationTypeColumn, operationContentColumn, beforeColumn, afterColumn, operatorColumn, platformColumn, timeColumn],
    records: [
      {
        id: 'store-addon-1',
        objectName: '珍珠',
        storeName: '一级门店5',
        sourceType: '门店手工修改',
        operationType: '新建加料',
        operationContent: '门店新建加料。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 09:46:15',
        operationModule: '门店加料',
      },
      {
        id: 'store-addon-2',
        objectName: '珍珠',
        storeName: '一级门店5',
        sourceType: '门店手工修改',
        operationType: '售价变动',
        operationContent: '门店加料售价由 2 元调整为 3 元。',
        beforeChange: '2 元',
        afterChange: '3 元',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-28 09:56:15',
        operationModule: '门店加料',
      },
      {
        id: 'store-addon-3',
        objectName: '椰果',
        storeName: '一级门店8',
        sourceType: '门店手工修改',
        operationType: '库存变动',
        operationContent: '门店加料库存由 15 调整为 8。',
        beforeChange: '15',
        afterChange: '8',
        operatorName: '督导王芳',
        operatorAccount: '18900012311',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 18:13:12',
        operationModule: '门店加料',
      },
      {
        id: 'store-addon-4',
        objectName: '椰果',
        storeName: '一级门店8',
        sourceType: '门店手工修改',
        operationType: '上下架',
        operationContent: '门店加料由上架调整为下架。',
        beforeChange: '上架',
        afterChange: '下架',
        operatorName: '督导王芳',
        operatorAccount: '18900012311',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 18:03:12',
        operationModule: '门店加料',
      },
      {
        id: 'store-addon-5',
        objectName: '西柚粒',
        storeName: '一级门店8',
        sourceType: '门店手工修改',
        operationType: '删除加料',
        operationContent: '删除门店加料。',
        operatorName: '督导王芳',
        operatorAccount: '18900012311',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 17:53:12',
        operationModule: '门店加料',
      },
      {
        id: 'store-addon-6',
        objectName: '珍珠',
        storeName: '一级门店5',
        sourceType: '商品库下发',
        operationType: '加料变更',
        operationContent: '商品库下发：门店加料基础信息更新。',
        operatorName: '企迈静静',
        operatorAccount: '18656028950',
        operationPlatform: 'PC后台',
        operationTime: '2026-05-27 17:43:12',
        operationModule: '门店加料',
      },
    ],
    enableSnapshot: false,
    searchText: record => `${record.objectName}${record.storeName || ''}${record.operationContent}${record.beforeChange || ''}${record.afterChange || ''}`,
  },
];

const LOG_TYPE_MAP: Record<LogTypeId, LogTypeConfig> = LOG_TYPE_CONFIGS.reduce((acc, config) => {
  acc[config.id] = config;
  return acc;
}, {} as Record<LogTypeId, LogTypeConfig>);

const inputClassName =
  'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#111827] outline-none transition-all focus:border-[#00C06B] focus:ring-2 focus:ring-[#00C06B]/10';
const tableHeadClassName = 'px-4 py-3 text-left text-[12px] font-bold text-[#667085] bg-[#F8FAFC] whitespace-nowrap';
const tableCellClassName = 'px-4 py-3 align-top text-[13px] text-[#344054] border-t border-[#F0F2F5] bg-white';
const stickyActionHeadClassName = `${tableHeadClassName} sticky right-0 z-20 bg-[#F8FAFC] shadow-[-12px_0_16px_-16px_rgba(15,23,42,0.32)]`;
const stickyActionCellClassName = `${tableCellClassName} sticky right-0 z-10 bg-white shadow-[-12px_0_16px_-16px_rgba(15,23,42,0.32)]`;

const EmptyCell: React.FC = () => <span className="text-[#B7BDC7]">--</span>;

const FilterField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <div className={className}>
    <div className="mb-2 text-[12px] font-medium text-[#667085]">{label}</div>
    {children}
  </div>
);

const TextInput: React.FC<{ value: string; onChange: (value: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className={inputClassName} />
);

const SelectInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}> = ({ value, onChange, options }) => (
  <select value={value} onChange={event => onChange(event.target.value)} className={inputClassName}>
    {options.map(option => (
      <option key={`${option.value}-${option.label}`} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const DateInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => (
  <div className="relative">
    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
    <input type="date" value={value} onChange={event => onChange(event.target.value)} className={`${inputClassName} pl-9`} />
  </div>
);

const OperationBadge: React.FC<{ value: string }> = ({ value }) => {
  let className = 'bg-[#F2F4F7] text-[#475467]';
  if (/删除|禁用/.test(value)) className = 'bg-[#FFF1F0] text-[#D4380D]';
  else if (/新建|新增|启用/.test(value)) className = 'bg-[#EFFBF4] text-[#18A058]';
  else if (/价格|库存/.test(value)) className = 'bg-[#EEF4FF] text-[#1D4ED8]';
  else if (/排序|上下架/.test(value)) className = 'bg-[#FFF7E6] text-[#D48806]';
  else if (/编辑|变更|调整/.test(value)) className = 'bg-[#F5F3FF] text-[#6D28D9]';
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[12px] font-bold leading-none ${className}`}>{value}</span>;
};

const paginate = <T,>(items: T[], currentPage: number) => items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

const compareDate = (recordTime: string, dateValue: string, operator: 'gte' | 'lte') => {
  if (!dateValue) return true;
  const target = recordTime.slice(0, 10);
  return operator === 'gte' ? target >= dateValue : target <= dateValue;
};

const getFilterValue = (record: LogRecord, key: FilterKey) => {
  switch (key) {
    case 'operationType':
      return record.operationType;
    case 'operatorAccount':
      return record.operatorAccount;
    case 'keyword':
      return '';
    case 'objectName':
      return record.objectName;
    case 'objectId':
      return record.objectId || '';
    case 'objectType':
      return record.objectType || '';
    case 'categoryType':
      return record.categoryType || '';
    case 'addonType':
      return record.addonType || '';
    case 'sourceType':
      return record.sourceType || '';
    case 'taskName':
      return record.taskName || '';
    case 'templateName':
      return record.templateName || '';
    case 'strategyName':
      return record.strategyName || '';
    case 'storeName':
      return record.storeName || '';
    case 'channel':
      return record.channel || '';
    case 'methodValue':
      return record.methodValue || '';
    case 'taskId':
      return record.taskId || '';
    default:
      return '';
  }
};

export const WebProductLogPage: React.FC = () => {
  const [activeLogType, setActiveLogType] = useState<LogTypeId | null>(null);
  const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSnapshot, setSelectedSnapshot] = useState<{ record: LogRecord; title: string } | null>(null);
  const [selectedDetailList, setSelectedDetailList] = useState<{ record: LogRecord; title: string } | null>(null);

  useEffect(() => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, [activeLogType]);

  const activeConfig = activeLogType ? LOG_TYPE_MAP[activeLogType] : null;
  const currentDomain = activeConfig ? DOMAIN_META.find(item => item.id === activeConfig.domain) || null : null;

  const filteredRecords = useMemo(() => {
    if (!activeConfig) return [];
    return activeConfig.records.filter(record => {
      if (!compareDate(record.operationTime, appliedFilters.startDate, 'gte')) return false;
      if (!compareDate(record.operationTime, appliedFilters.endDate, 'lte')) return false;

      for (const filterDef of activeConfig.filterDefs) {
        const value = appliedFilters[filterDef.key];
        if (!value) continue;
        if (filterDef.key === 'keyword') {
          if (!activeConfig.searchText(record).includes(value)) return false;
          continue;
        }
        const recordValue = getFilterValue(record, filterDef.key);
        if (filterDef.type === 'select') {
          if (recordValue !== value) return false;
        } else if (!recordValue.includes(value)) {
          return false;
        }
      }

      return true;
    });
  }, [activeConfig, appliedFilters]);

  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const pageRecords = paginate(filteredRecords, currentPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const updateDraftFilter = (key: keyof FilterState, value: string) => {
    setDraftFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const renderHome = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E7ECF1] bg-white px-6 py-5 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
        <div className="text-[22px] font-bold text-[#111827]">商品日志</div>
        <div className="mt-2 text-[14px] text-[#667085]">按商品档案、商品运营、门店商品三大板块查看对应信息变动日志。</div>
      </div>

      {DOMAIN_META.map(domain => {
        const cards = LOG_TYPE_CONFIGS.filter(item => item.domain === domain.id);
        return (
          <div key={domain.id} className="rounded-2xl border border-[#E7ECF1] bg-white p-6 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3FCF7] text-[#00C06B]">{domain.icon}</div>
                <div>
                  <div className="text-[18px] font-bold text-[#111827]">{domain.name}</div>
                  <div className="mt-1 text-[13px] leading-6 text-[#667085]">{domain.description}</div>
                </div>
              </div>
              <div className="text-[12px] text-[#98A2B3]">{cards.length} 类日志</div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {cards.map(card => (
                <button
                  key={card.id}
                  onClick={() => setActiveLogType(card.id)}
                  className="group rounded-2xl border border-[#E8EEF4] bg-white p-5 text-left transition-all hover:border-[#B7E8CB] hover:bg-[#FBFFFD] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[16px] font-bold text-[#111827]">{card.name}</div>
                      <div className="mt-1 text-[13px] leading-6 text-[#667085]">{card.subtitle}</div>
                    </div>
                    <div className="text-[18px] font-semibold text-[#D0D5DD] transition-all group-hover:text-[#00C06B]">{'>'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderToolbar = (config: LogTypeConfig) => (
    <div className="rounded-2xl border border-[#E7ECF1] bg-[#FAFBFD] p-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterField label="操作时间" className="xl:col-span-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <DateInput value={draftFilters.startDate} onChange={value => updateDraftFilter('startDate', value)} />
            <span className="text-[#98A2B3]">至</span>
            <DateInput value={draftFilters.endDate} onChange={value => updateDraftFilter('endDate', value)} />
          </div>
        </FilterField>
        {config.filterDefs.map(filter => (
          <FilterField key={filter.key} label={filter.label} className={filter.span}>
            {filter.type === 'select' ? (
              <SelectInput value={draftFilters[filter.key]} onChange={value => updateDraftFilter(filter.key, value)} options={filter.options || []} />
            ) : (
              <TextInput value={draftFilters[filter.key]} onChange={value => updateDraftFilter(filter.key, value)} placeholder={filter.placeholder || ''} />
            )}
          </FilterField>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={applyFilters} className="inline-flex h-10 items-center whitespace-nowrap rounded-lg bg-[#00C06B] px-4 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#00AF62]">
          <Search size={14} className="mr-1.5" />
          查询
        </button>
        <button onClick={resetFilters} className="inline-flex h-10 items-center whitespace-nowrap rounded-lg px-2 text-[13px] font-medium text-[#00C06B] transition-all hover:text-[#00AF62]">
          <RotateCcw size={14} className="mr-1.5" />
          清空筛选条件
        </button>
      </div>
    </div>
  );

  const renderTable = (config: LogTypeConfig) => {
    const hasAction = config.records.some(record => record.snapshot || record.detailList);
    return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {config.columns.map(column => (
              <th key={column.key} className={`${tableHeadClassName} ${column.minWidth || ''}`}>
                {column.label}
              </th>
            ))}
            {hasAction ? <th className={stickyActionHeadClassName}>操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {pageRecords.map(record => (
            <tr key={record.id} className="hover:bg-[#FAFAFA]">
              {config.columns.map(column => (
                <td key={`${record.id}-${column.key}`} className={`${tableCellClassName} ${column.minWidth || ''}`}>
                  {column.render(record)}
                </td>
              ))}
              {hasAction ? (
                <td className={stickyActionCellClassName}>
                  {record.snapshot ? (
                    <button
                      onClick={() => setSelectedSnapshot({ record, title: config.name })}
                      className="inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-[13px] font-medium text-[#00C06B] transition-all hover:bg-[#F3FCF7]"
                    >
                      <Eye size={14} className="mr-1" />
                      查看变更快照
                    </button>
                  ) : record.detailList ? (
                    <button
                      onClick={() => setSelectedDetailList({ record, title: config.name })}
                      className="inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-[13px] font-medium text-[#00C06B] transition-all hover:bg-[#F3FCF7]"
                    >
                      <Eye size={14} className="mr-1" />
                      查看门店明细
                    </button>
                  ) : (
                    <EmptyCell />
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    );
  };

  const renderLogPage = (config: LogTypeConfig) => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {currentDomain ? <span className="rounded-full bg-[#F3FCF7] px-2.5 py-1 text-[12px] font-semibold text-[#00A85D]">{currentDomain.name}</span> : null}
            <span className="text-[22px] font-bold text-[#111827]">{config.name}</span>
          </div>
        </div>
        <button
          onClick={() => setActiveLogType(null)}
          className="inline-flex items-center whitespace-nowrap rounded-lg px-1 py-2 text-[13px] font-medium text-[#667085] transition-all hover:text-[#111827]"
        >
          <ChevronLeft size={16} className="mr-1" />
          返回商品日志首页
        </button>
      </div>

      {renderToolbar(config)}

      <div className="overflow-hidden rounded-2xl border border-[#E7ECF1] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
        {pageRecords.length > 0 ? (
          renderTable(config)
        ) : (
          <div className="px-6 py-14 text-center">
            <div className="text-[16px] font-bold text-[#111827]">暂无符合条件的日志记录</div>
            <div className="mt-2 text-[13px] text-[#667085]">可以调整时间、对象名称、对象 ID 或操作类型后重新查询。</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-[#E7ECF1] bg-white px-4 py-3 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
        <div className="text-[13px] text-[#667085]">
          共 <span className="font-bold text-[#111827]">{totalItems}</span> 条记录
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#667085] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
            const pageNumber = index + 1;
            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-md px-2 text-[13px] font-bold ${
                  currentPage === pageNumber ? 'bg-[#00C06B] text-white' : 'border border-[#E5E7EB] bg-white text-[#667085]'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#667085] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-w-0 overflow-auto bg-[#F5F6FA] p-6">
      {activeConfig ? renderLogPage(activeConfig) : renderHome()}

      {selectedSnapshot?.record.snapshot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6">
          <div className="max-h-[88vh] w-full max-w-[1120px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-[#EEF2F6] px-6 py-4">
              <div>
                <div className="text-[18px] font-bold text-[#111827]">{selectedSnapshot.record.snapshot.title}</div>
                <div className="mt-1 text-[13px] text-[#667085]">
                  {selectedSnapshot.title} / {selectedSnapshot.record.objectName} / {selectedSnapshot.record.operationTime}
                </div>
              </div>
              <button onClick={() => setSelectedSnapshot(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition-all hover:bg-[#F5F6FA]">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(88vh-80px)] overflow-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-[12px] text-[#98A2B3]">操作对象</div>
                  <div className="mt-2 text-[14px] font-bold text-[#111827]">{selectedSnapshot.record.objectName}</div>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-[12px] text-[#98A2B3]">操作类型</div>
                  <div className="mt-2"><OperationBadge value={selectedSnapshot.record.operationType} /></div>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-[12px] text-[#98A2B3]">操作人</div>
                  <div className="mt-2 text-[14px] font-bold text-[#111827]">{selectedSnapshot.record.operatorName}</div>
                  <div className="mt-1 text-[12px] text-[#667085]">{selectedSnapshot.record.operatorAccount}</div>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-[12px] text-[#98A2B3]">操作平台</div>
                  <div className="mt-2 text-[14px] font-bold text-[#111827]">{selectedSnapshot.record.operationPlatform}</div>
                  <div className="mt-1 text-[12px] text-[#667085]">{selectedSnapshot.record.operationTime}</div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {selectedSnapshot.record.snapshot.sections.map(section => (
                  <div key={section.title} className="overflow-hidden rounded-2xl border border-[#E7ECF1]">
                    <div className="border-b border-[#EEF2F6] bg-[#FAFBFC] px-5 py-3 text-[14px] font-bold text-[#111827]">{section.title}</div>
                    {selectedSnapshot.record.snapshot.displayMode === 'after_only' ? (
                      <div className="divide-y divide-[#EEF2F6] bg-white">
                        {section.fields.map(field => (
                          <div key={`${section.title}-${field.label}`} className="grid gap-3 px-5 py-4 md:grid-cols-[180px_minmax(0,1fr)]">
                            <div className="pt-1 text-[13px] font-medium text-[#667085]">{field.label}</div>
                            <div className="min-w-0 rounded-xl border border-[#E7ECF1] bg-[#FCFCFD] px-4 py-3 text-[13px] leading-6 text-[#111827] whitespace-pre-wrap break-words">
                              {field.after || '--'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white">
                        <div className="grid gap-3 border-b border-[#EEF2F6] bg-[#FCFCFD] px-5 py-3 text-[12px] font-medium text-[#98A2B3] md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
                          <div>字段</div>
                          <div>变更前</div>
                          <div>变更后</div>
                        </div>
                        <div className="divide-y divide-[#EEF2F6]">
                          {section.fields.map(field => (
                            <div key={`${section.title}-${field.label}`} className="grid gap-3 px-5 py-4 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
                              <div className="pt-1 text-[13px] font-medium text-[#667085]">{field.label}</div>
                              <div className="min-w-0 rounded-xl border border-[#E7ECF1] bg-[#FFF7ED] px-4 py-3 text-[13px] leading-6 text-[#9A3412] whitespace-pre-wrap break-words">
                                {field.before || '--'}
                              </div>
                              <div className="min-w-0 rounded-xl border border-[#E7ECF1] bg-[#ECFDF3] px-4 py-3 text-[13px] leading-6 text-[#166534] whitespace-pre-wrap break-words">
                                {field.after || '--'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedDetailList?.record.detailList ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6">
          <div className="max-h-[88vh] w-full max-w-[980px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-[#EEF2F6] px-6 py-4">
              <div>
                <div className="text-[18px] font-bold text-[#111827]">{selectedDetailList.record.detailList.title}</div>
                <div className="mt-1 text-[13px] text-[#667085]">
                  {selectedDetailList.title} / {selectedDetailList.record.templateName || selectedDetailList.record.objectName} / {selectedDetailList.record.operationTime}
                </div>
              </div>
              <button onClick={() => setSelectedDetailList(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] transition-all hover:bg-[#F5F6FA]">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(88vh-80px)] overflow-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-[12px] text-[#98A2B3]">模板名称</div>
                  <div className="mt-2 text-[14px] font-bold text-[#111827]">{selectedDetailList.record.templateName || '--'}</div>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-[12px] text-[#98A2B3]">操作类型</div>
                  <div className="mt-2"><OperationBadge value={selectedDetailList.record.operationType} /></div>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-[12px] text-[#98A2B3]">操作人</div>
                  <div className="mt-2 text-[14px] font-bold text-[#111827]">{selectedDetailList.record.operatorName}</div>
                  <div className="mt-1 text-[12px] text-[#667085]">{selectedDetailList.record.operatorAccount}</div>
                </div>
                <div className="rounded-xl bg-[#F8FAFC] p-4">
                  <div className="text-[12px] text-[#98A2B3]">操作平台</div>
                  <div className="mt-2 text-[14px] font-bold text-[#111827]">{selectedDetailList.record.operationPlatform}</div>
                  <div className="mt-1 text-[12px] text-[#667085]">{selectedDetailList.record.operationTime}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-[#E7ECF1] bg-white">
                  <div className="border-b border-[#EEF2F6] bg-[#FFF7ED] px-5 py-3 text-[14px] font-bold text-[#9A3412]">
                    {selectedDetailList.record.detailList.beforeTitle}（{selectedDetailList.record.detailList.beforeItems.length} 家）
                  </div>
                  <div className="max-h-[420px] overflow-auto px-5 py-4">
                    <div className="space-y-2">
                      {selectedDetailList.record.detailList.beforeItems.map(item => (
                        <div key={`before-${item}`} className="rounded-lg bg-[#FFF7ED] px-3 py-2 text-[13px] text-[#7C2D12]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#E7ECF1] bg-white">
                  <div className="border-b border-[#EEF2F6] bg-[#ECFDF3] px-5 py-3 text-[14px] font-bold text-[#166534]">
                    {selectedDetailList.record.detailList.afterTitle}（{selectedDetailList.record.detailList.afterItems.length} 家）
                  </div>
                  <div className="max-h-[420px] overflow-auto px-5 py-4">
                    <div className="space-y-2">
                      {selectedDetailList.record.detailList.afterItems.map(item => (
                        <div key={`after-${item}`} className="rounded-lg bg-[#ECFDF3] px-3 py-2 text-[13px] text-[#166534]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
