import React, { useEffect, useMemo, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import type { Product } from '../../types';

interface Props {
  product: Product;
  onClose: () => void;
}

type DetailTabKey = 'stores' | 'templates' | 'combos' | 'combo_detail' | 'free_match' | 'optional_groups';

const INITIAL_GROUPS = [
  {
    id: 'og_1',
    name: '生椰拿铁必选规格',
    code: '124621886011',
    associatedCombo: '生椰拿铁套餐等(3个)',
    remark: '必选项',
    status: 'valid',
    isLastProduct: true,
  },
  {
    id: 'og_2',
    name: '废弃的无效分组',
    code: '124621886012',
    associatedCombo: '-',
    remark: '已经没用了',
    status: 'invalid',
    isLastProduct: true,
  },
];

const getFrontendCategoryName = (product: Product) => {
  if (product.type === 'combo') return '套餐组合';
  if (product.category === '现制饮品') return Number(product.id) % 2 === 0 ? '咖啡类' : '奶茶类';
  if (product.category === '中式正餐') return product.name.includes('火锅') ? '火锅锅底' : '炒菜/烧菜类';
  if (product.category === '西式快餐') return '轻食简餐';
  if (product.category === '烘焙甜品') return '甜品烘焙';
  if (product.category === '零售商品') return '零售周边';
  return '未分类';
};

const getStatusMeta = (product: Product) => {
  if (product.status === 'on_shelf') return { label: '可售', className: 'bg-[#EAF9F1] text-[#00A35B]' };
  if (product.status === 'off_shelf') return { label: '停售', className: 'bg-[#F5F7FA] text-[#5B6475]' };
  return { label: '草稿', className: 'bg-[#FFF7E8] text-[#D48806]' };
};

const createDetailTabs = (isCombo: boolean, counts: { stores: number; templates: number; combos: number; freeMatch: number; optionalGroups: number }) => {
  if (isCombo) {
    return [
      { key: 'stores' as DetailTabKey, label: `在售门店 (${counts.stores})` },
      { key: 'templates' as DetailTabKey, label: `商品模板 (${counts.templates})` },
      { key: 'combo_detail' as DetailTabKey, label: `套餐明细 (${counts.combos})` },
      { key: 'free_match' as DetailTabKey, label: `随心配 (${counts.freeMatch})` },
    ];
  }

  return [
    { key: 'stores' as DetailTabKey, label: `在售门店 (${counts.stores})` },
    { key: 'templates' as DetailTabKey, label: `商品模板 (${counts.templates})` },
    { key: 'combos' as DetailTabKey, label: `套餐组合 (${counts.combos})` },
    { key: 'free_match' as DetailTabKey, label: `随心配 (${counts.freeMatch})` },
    { key: 'optional_groups' as DetailTabKey, label: `可选分组 (${counts.optionalGroups})` },
  ];
};

export const WebProductDetail: React.FC<Props> = ({ product, onClose }) => {
  const isCombo = product.type === 'combo';
  const [activeTab, setActiveTab] = useState<DetailTabKey>(isCombo ? 'stores' : 'stores');
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setActiveTab('stores');
    setGroups(INITIAL_GROUPS);
    setSelectedIds([]);
  }, [product.id]);

  const statusMeta = getStatusMeta(product);
  const frontendCategory = getFrontendCategoryName(product);

  const salesMetrics = useMemo(() => {
    const baseSales = Number(product.id) * 18;
    return {
      saleCount: baseSales,
      grossAmount: baseSales * product.price,
      receiptAmount: Math.round(baseSales * product.price * 0.93),
      avgPrice: product.price,
    };
  }, [product.id, product.price]);

  const storeRows = useMemo(
    () => [
      { id: 's_1', name: '国贸店', code: '1151709', status: '营业中', price: product.price, stock: product.stock ?? (isCombo ? 20 : 999), updatedAt: '2026-05-24 12:30' },
      { id: 's_2', name: '望京店', code: '1151708', status: '营业中', price: product.price + (isCombo ? 0 : 1), stock: product.stock ?? 86, updatedAt: '2026-05-24 10:18' },
      { id: 's_3', name: '三里屯店', code: '1151716', status: product.status === 'off_shelf' ? '停售' : '已下发', price: product.price, stock: product.stock ?? 42, updatedAt: '2026-05-23 18:42' },
    ],
    [isCombo, product.price, product.status, product.stock]
  );

  const templateRows = useMemo(
    () => [
      { id: 'tpl_1', name: isCombo ? '套餐通用模板' : '饮品标准模板', scope: '品牌模板', updatedAt: '2026-05-20 16:42', fields: isCombo ? '基础信息、套餐分组、价格' : '基础信息、规格、做法、展示信息' },
      { id: 'tpl_2', name: isCombo ? '午市套餐模板' : '新品商品模板', scope: '门店模板', updatedAt: '2026-05-18 11:06', fields: isCombo ? '套餐价格、售卖时段、展示信息' : '前后台分类、价格、售卖设置' },
    ],
    [isCombo]
  );

  const comboRows = useMemo(
    () => [
      { id: 'combo_ref_1', name: `${product.name}双人套餐`, type: '固定套餐', saleStatus: '可售', updatedAt: '2026-05-22 09:15' },
      { id: 'combo_ref_2', name: `${product.name}轻享套餐`, type: '营销套餐', saleStatus: '可售', updatedAt: '2026-05-16 18:20' },
    ],
    [product.name]
  );

  const freeMatchRows = useMemo(
    () =>
      isCombo
        ? [
            { id: 'fm_1', name: '主食替换规则', scope: '套餐套餐内商品替换', priceRule: '同价替换', updatedAt: '2026-05-23 17:20' },
            { id: 'fm_2', name: '饮品升级规则', scope: '可加价升级大杯饮品', priceRule: '+3元', updatedAt: '2026-05-21 14:08' },
          ]
        : [
            { id: 'fm_1', name: `${product.name}随心配`, scope: '套餐内可替换商品', priceRule: '同价替换', updatedAt: '2026-05-23 17:20' },
            { id: 'fm_2', name: `${product.name}升级规则`, scope: '支持规格升级', priceRule: '+2元', updatedAt: '2026-05-21 14:08' },
          ],
    [isCombo, product.name]
  );

  const comboGroups = useMemo(
    () => [
      {
        id: 'cg_1',
        name: '主食区',
        required: true,
        selectRule: '1选1',
        items: ['经典牛肉汉堡', '香辣鸡腿堡'],
      },
      {
        id: 'cg_2',
        name: '饮品区',
        required: true,
        selectRule: '1选1',
        items: ['可乐', '柠檬红茶', '美式咖啡'],
      },
      {
        id: 'cg_3',
        name: '加餐区',
        required: false,
        selectRule: '0-2选',
        items: ['薯条', '鸡块', '沙拉'],
      },
    ],
    []
  );

  const detailTabs = createDetailTabs(isCombo, {
    stores: storeRows.length,
    templates: templateRows.length,
    combos: isCombo ? comboGroups.length : comboRows.length,
    freeMatch: freeMatchRows.length,
    optionalGroups: groups.length,
  });

  const handleUnlink = (groupIds: string[]) => {
    if (groupIds.length === 0) {
      alert('请选择要解除关联的分组');
      return;
    }

    let hasError = false;
    const toRemove: string[] = [];

    for (const id of groupIds) {
      const group = groups.find(item => item.id === id);
      if (!group) continue;

      if (group.status === 'valid' && group.isLastProduct) {
        alert(`解除失败！该商品为生效分组【${group.name}】的最后一个商品，不可解除关联，否则会导致套餐点单报错。`);
        hasError = true;
        break;
      }

      toRemove.push(id);
    }

    if (!hasError && toRemove.length > 0) {
      const cleanedGroups = toRemove.filter(id => {
        const current = groups.find(item => item.id === id);
        return current?.status === 'invalid' && current?.isLastProduct;
      });

      if (cleanedGroups.length > 0) {
        alert(`解除关联成功！已自动清理 ${cleanedGroups.length} 个无效分组。`);
      } else {
        alert('解除关联成功！');
      }

      setGroups(prev => prev.filter(item => !toRemove.includes(item.id)));
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedIds.length === groups.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(groups.map(group => group.id));
    }
  };

  const renderStores = () => (
    <table className="w-full border-collapse text-left">
      <thead className="bg-[#F7F8FA]">
        <tr className="border-b border-[#E8E8E8] text-[13px] font-bold text-[#666]">
          <th className="px-4 py-3">门店名称</th>
          <th className="px-4 py-3">门店编码</th>
          <th className="px-4 py-3">售卖状态</th>
          <th className="px-4 py-3">门店售价</th>
          <th className="px-4 py-3">可售库存</th>
          <th className="px-4 py-3">最近同步时间</th>
        </tr>
      </thead>
      <tbody className="text-[13px] text-[#333]">
        {storeRows.map(item => (
          <tr key={item.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC]">
            <td className="px-4 py-3 font-medium">{item.name}</td>
            <td className="px-4 py-3 text-[#666]">{item.code}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${item.status === '营业中' || item.status === '已下发' ? 'bg-[#EAF9F1] text-[#00A35B]' : 'bg-[#F5F7FA] text-[#5B6475]'}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3">￥{item.price}</td>
            <td className="px-4 py-3">{item.stock}</td>
            <td className="px-4 py-3 text-[#666]">{item.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTemplates = () => (
    <table className="w-full border-collapse text-left">
      <thead className="bg-[#F7F8FA]">
        <tr className="border-b border-[#E8E8E8] text-[13px] font-bold text-[#666]">
          <th className="px-4 py-3">模板名称</th>
          <th className="px-4 py-3">模板范围</th>
          <th className="px-4 py-3">覆盖字段</th>
          <th className="px-4 py-3">更新时间</th>
        </tr>
      </thead>
      <tbody className="text-[13px] text-[#333]">
        {templateRows.map(item => (
          <tr key={item.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC]">
            <td className="px-4 py-3 font-medium">{item.name}</td>
            <td className="px-4 py-3 text-[#666]">{item.scope}</td>
            <td className="px-4 py-3 text-[#666]">{item.fields}</td>
            <td className="px-4 py-3 text-[#666]">{item.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderStandardCombos = () => (
    <table className="w-full border-collapse text-left">
      <thead className="bg-[#F7F8FA]">
        <tr className="border-b border-[#E8E8E8] text-[13px] font-bold text-[#666]">
          <th className="px-4 py-3">套餐名称</th>
          <th className="px-4 py-3">套餐类型</th>
          <th className="px-4 py-3">售卖状态</th>
          <th className="px-4 py-3">更新时间</th>
        </tr>
      </thead>
      <tbody className="text-[13px] text-[#333]">
        {comboRows.map(item => (
          <tr key={item.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC]">
            <td className="px-4 py-3 font-medium">{item.name}</td>
            <td className="px-4 py-3 text-[#666]">{item.type}</td>
            <td className="px-4 py-3 text-[#666]">{item.saleStatus}</td>
            <td className="px-4 py-3 text-[#666]">{item.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderComboDetail = () => (
    <div className="space-y-4">
      {comboGroups.map(group => (
        <div key={group.id} className="rounded-lg border border-[#E8E8E8] bg-[#FAFBFC] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-[14px] font-bold text-[#333]">{group.name}</h4>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${group.required ? 'bg-[#FFF7E8] text-[#D48806]' : 'bg-[#F0F5FF] text-[#2F54EB]'}`}>
                {group.required ? '必选' : '可选'}
              </span>
            </div>
            <span className="text-[12px] text-[#666]">{group.selectRule}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.items.map(item => (
              <span key={item} className="rounded-md border border-[#DCE1E8] bg-white px-3 py-1.5 text-[12px] text-[#333]">
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderFreeMatch = () => (
    <table className="w-full border-collapse text-left">
      <thead className="bg-[#F7F8FA]">
        <tr className="border-b border-[#E8E8E8] text-[13px] font-bold text-[#666]">
          <th className="px-4 py-3">规则名称</th>
          <th className="px-4 py-3">适用范围</th>
          <th className="px-4 py-3">价格规则</th>
          <th className="px-4 py-3">更新时间</th>
        </tr>
      </thead>
      <tbody className="text-[13px] text-[#333]">
        {freeMatchRows.map(item => (
          <tr key={item.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC]">
            <td className="px-4 py-3 font-medium">{item.name}</td>
            <td className="px-4 py-3 text-[#666]">{item.scope}</td>
            <td className="px-4 py-3 text-[#666]">{item.priceRule}</td>
            <td className="px-4 py-3 text-[#666]">{item.updatedAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderOptionalGroups = () => (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={() => handleUnlink(selectedIds)} className="rounded-md border border-[#E8E8E8] px-4 py-1.5 text-[13px] text-[#333] transition-colors hover:border-[#00C06B] hover:text-[#00C06B]">
          批量解除关联
        </button>
      </div>

      <table className="w-full border-collapse text-left">
        <thead className="bg-[#F7F8FA]">
          <tr className="border-b border-[#E8E8E8] text-[13px] font-bold text-[#666]">
            <th className="w-[50px] py-3 pl-4">
              <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === groups.length} onChange={toggleAll} />
            </th>
            <th className="px-4 py-3">分组ID</th>
            <th className="px-4 py-3">分组名称</th>
            <th className="px-4 py-3">分组状态</th>
            <th className="px-4 py-3">分组编码</th>
            <th className="px-4 py-3">关联套餐</th>
            <th className="px-4 py-3">分组备注</th>
            <th className="px-4 py-3 text-center">操作</th>
          </tr>
        </thead>
        <tbody className="text-[13px] text-[#333]">
          {groups.length > 0 ? (
            groups.map(group => (
              <tr key={group.id} className="border-b border-[#F5F5F5] hover:bg-[#F9FFFC]">
                <td className="py-3 pl-4">
                  <input type="checkbox" checked={selectedIds.includes(group.id)} onChange={() => toggleSelect(group.id)} />
                </td>
                <td className="px-4 py-3 text-[#999]">{group.id}</td>
                <td className="px-4 py-3 font-bold">{group.name}</td>
                <td className="px-4 py-3">
                  {group.status === 'valid' ? (
                    <span className="rounded bg-[#E6F8F0] px-2 py-0.5 text-[11px] text-[#00C06B]">生效中</span>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-[#999]">已失效(无关联)</span>
                  )}
                </td>
                <td className="px-4 py-3">{group.code}</td>
                <td className="px-4 py-3 text-[#999]">{group.associatedCombo}</td>
                <td className="px-4 py-3 text-[#999]">{group.remark}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleUnlink([group.id])} className="text-[#00C06B] hover:text-[#00A35B] hover:underline">
                    解除关联
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="py-16 text-center text-[#999]">
                暂无数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );

  const renderTabContent = () => {
    if (activeTab === 'stores') return renderStores();
    if (activeTab === 'templates') return renderTemplates();
    if (activeTab === 'combos') return renderStandardCombos();
    if (activeTab === 'combo_detail') return renderComboDetail();
    if (activeTab === 'free_match') return renderFreeMatch();
    if (activeTab === 'optional_groups') return renderOptionalGroups();
    return <div className="py-20 text-center text-[#999]">暂无数据</div>;
  };

  return (
    <div className="relative flex h-full flex-1 flex-col bg-[#F5F6FA]">
      <div className="z-10 flex h-[48px] shrink-0 items-center border-b border-[#E8E8E8] bg-white px-4 shadow-sm">
        <div className="flex items-center text-[13px] text-[#666]">
          <span className="cursor-pointer hover:text-[#00C06B]">商品管理</span>
          <ChevronRight size={14} className="mx-1" />
          <span className="cursor-pointer hover:text-[#00C06B]">全部商品</span>
          <ChevronRight size={14} className="mx-1" />
          <span className="font-bold text-[#333]">商品详情</span>
        </div>
        <div className="ml-auto flex items-center">
          <button onClick={onClose} className="p-1 text-[#999] transition-colors hover:text-[#333]">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 no-scrollbar">
        <div className="relative mb-4 rounded-lg border border-[#E8E8E8] bg-white p-6 shadow-sm">
          <button className="absolute right-6 top-6 rounded-md border border-[#E8E8E8] px-4 py-1.5 text-[13px] text-[#333] transition-colors hover:border-[#00C06B] hover:text-[#00C06B]">
            编辑
          </button>
          <div className="flex items-start justify-between gap-6">
            <div className="flex min-w-[320px] items-start">
              <img src={product.image || 'https://via.placeholder.com/60'} className="mr-4 h-16 w-16 rounded-md border border-gray-100 object-cover" />
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-[20px] font-bold text-[#333]">{product.name}</h2>
                  <span className="rounded-sm border border-[#00C06B] bg-white px-1.5 py-0.5 text-[10px] text-[#00C06B]">{isCombo ? '套餐商品' : '标准商品'}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusMeta.className}`}>{statusMeta.label}</span>
                </div>
                <div className="space-y-2 text-[12px] text-[#999]">
                  <div className="flex">
                    <span className="w-[68px]">商品ID:</span>
                    <span className="text-[#333]">{product.id}</span>
                  </div>
                  <div className="flex">
                    <span className="w-[68px]">SKUID:</span>
                    <span className="text-[#333]">{product.skuCode}</span>
                  </div>
                  <div className="flex">
                    <span className="w-[68px]">后台分类:</span>
                    <span className="text-[#333]">{product.category || '未分类'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-3 gap-6 text-[12px] text-[#333]">
              <div className="space-y-3">
                <div className="text-[20px] font-bold">
                  ￥{product.price}
                  <span className="ml-1 text-[12px] font-normal text-[#666]">{isCombo ? '套餐价' : product.isMultiSpec ? '元起' : '元'}</span>
                </div>
                <div className="flex text-[#999]">
                  <span className="w-[72px]">前台分类:</span>
                  <span className="text-[#333]">{frontendCategory}</span>
                </div>
                <div className="flex text-[#999]">
                  <span className="w-[72px]">商品标识:</span>
                  <span className="text-[#333]">{isCombo ? '套餐商品' : '标准售卖'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex text-[#999]">
                  <span className="w-[72px]">创建时间:</span>
                  <span className="text-[#333]">{product.createdTime || '2026-05-01 10:00'}</span>
                </div>
                <div className="flex text-[#999]">
                  <span className="w-[72px]">库存状态:</span>
                  <span className="text-[#333]">{product.stockStatus === 'sold_out' ? '已售罄' : '可售'}</span>
                </div>
                <div className="flex text-[#999]">
                  <span className="w-[72px]">计价方式:</span>
                  <span className="text-[#333]">{isCombo ? '按套餐收银' : product.isMultiSpec ? '按规格售卖' : '单规格售卖'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex text-[#999]">
                  <span className="w-[72px]">售卖渠道:</span>
                  <span className="text-[#333]">堂食、外卖、自提</span>
                </div>
                <div className="flex text-[#999]">
                  <span className="w-[72px]">打印设置:</span>
                  <span className="text-[#333]">{isCombo ? '套餐商品不支持打印设置' : '已配置后厨打印模板'}</span>
                </div>
                <div className="flex text-[#999]">
                  <span className="w-[72px]">商品路径:</span>
                  <span className="text-[#333]">商品中心 / {frontendCategory}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-[#E8E8E8] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#333]">商品销售数据</h3>
            <span className="text-[12px] text-[#999]">2026-04-26 ~ 2026-05-25 | 近30日</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg bg-[#F7F8FA] p-4">
              <div className="mb-2 text-[13px] text-[#666]">累计销量</div>
              <div className="text-[28px] font-bold text-[#333]">{salesMetrics.saleCount}</div>
            </div>
            <div className="rounded-lg bg-[#F7F8FA] p-4">
              <div className="mb-2 text-[13px] text-[#666]">累计销售金额</div>
              <div className="text-[28px] font-bold text-[#333]">{salesMetrics.grossAmount}</div>
            </div>
            <div className="rounded-lg bg-[#F7F8FA] p-4">
              <div className="mb-2 text-[13px] text-[#666]">累计实收金额</div>
              <div className="text-[28px] font-bold text-[#333]">{salesMetrics.receiptAmount}</div>
            </div>
            <div className="rounded-lg bg-[#F7F8FA] p-4">
              <div className="mb-2 text-[13px] text-[#666]">平均单价(元)</div>
              <div className="text-[28px] font-bold text-[#333]">{salesMetrics.avgPrice}</div>
            </div>
          </div>
        </div>

        <div className="min-h-[400px] rounded-lg border border-[#E8E8E8] bg-white shadow-sm">
          <div className="flex border-b border-[#E8E8E8] px-6">
            {detailTabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <div
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative cursor-pointer px-4 py-4 text-[14px] ${isActive ? 'font-bold text-[#00C06B]' : 'text-[#666] hover:text-[#333]'}`}
                >
                  {tab.label}
                  {isActive && <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#00C06B]" />}
                </div>
              );
            })}
          </div>

          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};
