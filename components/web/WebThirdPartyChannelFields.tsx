import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, Image as ImageIcon, Info, Link2, LockKeyhole, RefreshCw } from 'lucide-react';
import type { ThirdPartyChannelId } from '../../types';
import { getThirdPartyChannel } from '../../omnichannel';

type FieldDefinition = {
  id: string;
  label: string;
  type: 'select' | 'switch' | 'radio' | 'checkbox' | 'text';
  required?: boolean;
  options?: string[];
  description?: string;
  placeholder?: string;
};

const CHANNEL_FIELDS: Partial<Record<ThirdPartyChannelId, FieldDefinition[]>> = {
  douyin: [
    {
      id: 'douyinStandardCategory',
      label: '抖音标品类目',
      type: 'select',
      required: true,
      options: ['美食 / 饮品 / 奶茶', '美食 / 饮品 / 果茶', '美食 / 小吃甜品 / 烘焙甜品'],
      description: '创建或更新抖音标品时使用，选项来自平台当前有效类目能力。',
    },
    {
      id: 'douyinOrderCategory',
      label: '抖音点单品三级类目',
      type: 'select',
      required: true,
      options: ['美食 / 饮品 / 奶茶', '美食 / 饮品 / 果茶', '美食 / 小吃甜品 / 烘焙甜品'],
      description: '创建门店点单品时使用，需与标品类目兼容。',
    },
    {
      id: 'settleType',
      label: '抖音收款方式',
      type: 'radio',
      required: true,
      options: ['总部收款', '门店收款', '区域收款'],
      description: '生成门店点单品时写入结算信息。',
    },
  ],
  meituan_dine: [],
  meituan: [
    { id: 'category', label: '美团商品类目', type: 'select', required: true, options: ['饮品 / 奶茶', '饮品 / 果茶', '小吃 / 甜品'] },
    { id: 'attributeMutex', label: '属性互斥', type: 'switch', description: '加料属性按美团互斥规则发布' },
    { id: 'comboOnly', label: '仅在套餐内售卖', type: 'radio', options: ['是', '否'] },
    { id: 'noSingleDelivery', label: '单点不送', type: 'radio', options: ['是', '否'], description: '商品需与其他商品一起下单' },
    { id: 'features', label: '商品特色', type: 'checkbox', options: ['招牌菜'] },
  ],
  taobao: [
    { id: 'category', label: '淘宝闪购商品类目', type: 'select', required: true, options: ['茶饮 / 奶茶', '茶饮 / 果茶', '即时零售 / 甜品'] },
    { id: 'comboOnly', label: '仅在套餐内售卖', type: 'radio', options: ['是', '否'] },
    { id: 'noSingleDelivery', label: '单点不送', type: 'radio', options: ['是', '否'], description: '商品需与其他商品一起下单' },
    { id: 'features', label: '商品特色', type: 'checkbox', options: ['招牌菜', '配菜', '新菜', '辣'] },
  ],
};

const CHANNEL_INITIAL_VALUES: Partial<Record<ThirdPartyChannelId, Record<string, string | boolean | string[]>>> = {
  douyin: {
    douyinStandardCategory: '美食 / 饮品 / 奶茶',
    douyinOrderCategory: '美食 / 饮品 / 奶茶',
    settleType: '总部收款',
  },
  meituan_dine: {},
  meituan: {
    category: '饮品 / 奶茶',
    attributeMutex: false,
    comboOnly: '否',
    noSingleDelivery: '否',
    features: [],
  },
  taobao: {
    category: '茶饮 / 奶茶',
    comboOnly: '否',
    noSingleDelivery: '否',
    features: [],
  },
};

const DOUYIN_REUSE_ROWS = [
  {
    source: '商品名称、主图',
    target: '标品名称、标品图片 / 点单品名称、头图',
    rule: '直接复用渠道商品当前生效值',
  },
  {
    source: '规格与 SKU',
    target: '标品规格 / 点单品销售属性与 SKU',
    rule: '复用主档规格和当前渠道启用子集；规格价格继续按 SKU 提交',
  },
  {
    source: '不加价做法',
    target: '点单品描述属性（spec_type=2）',
    rule: '按当前渠道启用子集提交做法组和选项编码；加价做法一期不提交，并在预检结果中逐项提示',
  },
  {
    source: '渠道销售价',
    target: '点单品 SKU 实付价',
    rule: '元换算为分；同步前校验非负整数分',
  },
  {
    source: 'SKU 包装费',
    target: '点单品包装费结构',
    rule: '复用当前渠道包装费，按平台单位与计费步长转换',
  },
  {
    source: '渠道售卖时间',
    target: '点单品售卖起止时间',
    rule: '转换为秒级时间戳；长期售卖生成远期结束时间',
  },
];

const MEITUAN_DINE_REUSE_ROWS = [
  {
    source: '名称、规格、SKU、价格与后台分类',
    target: '品牌标准商品基础结构',
    rule: '直接复用企迈发布快照；标准商品描述、简述、图片和售卖时间一期不提交。',
  },
  {
    source: '加料与选择规则',
    target: '品牌加料、加料组与客制化规则',
    rule: '仅商品实际关联且能够等价转换时提交；标签和互斥规则一期不提交。',
  },
  {
    source: '套餐结构、简述与图片',
    target: '美团套餐、分组和套餐明细',
    rule: '仅兼容套餐提交；简述与图片按套餐接口硬必填规则复用和预检。',
  },
  {
    source: '门店价格、上下架与库存',
    target: '美团门店商品经营数据',
    rule: '随门店下发任务提交；售卖日期和时段一期不提交。',
  },
];

type Props = {
  channelIds: ThirdPartyChannelId[];
  location: 'master' | 'channel' | 'channel_catalog';
  title?: string;
  compact?: boolean;
};

export const WebThirdPartyChannelFields: React.FC<Props> = ({ channelIds, location, title, compact = false }) => {
  const [activeChannelId, setActiveChannelId] = useState<ThirdPartyChannelId>(channelIds[0]);
  const [inheritBasic, setInheritBasic] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, Record<string, string | boolean | string[]>>>({});

  const activeId = channelIds.includes(activeChannelId) ? activeChannelId : channelIds[0];
  const activeChannel = activeId ? getThirdPartyChannel(activeId) : null;
  const fields = useMemo(() => activeId ? (CHANNEL_FIELDS[activeId] || []) : [], [activeId]);
  if (!activeChannel) return null;

  const inherited = inheritBasic[activeId] ?? true;
  const channelValues = { ...(CHANNEL_INITIAL_VALUES[activeId] || {}), ...(values[activeId] || {}) };
  const isDouyinChannelForm = activeId === 'douyin' && location !== 'master';
  const isMeituanDineChannelForm = activeId === 'meituan_dine' && location !== 'master';
  const isOnlineChannelForm = isDouyinChannelForm || isMeituanDineChannelForm;
  const reuseRows = isDouyinChannelForm ? DOUYIN_REUSE_ROWS : MEITUAN_DINE_REUSE_ROWS;
  const updateValue = (fieldId: string, value: string | boolean | string[]) => {
    setValues(prev => ({ ...prev, [activeId]: { ...(prev[activeId] || {}), [fieldId]: value } }));
  };

  return (
    <div className="overflow-hidden border border-[#DDE3E8] bg-white">
      <div className="flex items-start justify-between gap-5 border-b border-[#E8E8E8] bg-[#FAFBFC] px-5 py-4">
        <div>
          <div className="text-sm font-black text-[#1F2129]">{title || '三方渠道商品资料'}</div>
          <div className="mt-1 text-xs text-gray-500">
            {location === 'master'
              ? '商品主档保持统一身份和公共资料，渠道销售属性请前往渠道商品库维护。'
              : '当前商品来自渠道商品库，基础资料继承商品主档，渠道团队维护售卖差异。'}
          </div>
        </div>
        <div className="flex items-center border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700">
          <Link2 size={13} className="mr-1.5" /> 已关联商品主档
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-[#E8E8E8] bg-white px-4">
        {channelIds.map(channelId => {
          const channel = getThirdPartyChannel(channelId);
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => setActiveChannelId(channel.id)}
              className={`shrink-0 border-b-2 px-5 py-3 text-sm font-bold ${activeId === channel.id ? 'border-[#00C06B] text-[#00A35B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {channel.name}
            </button>
          );
        })}
      </div>

      <div className={compact ? 'space-y-4 p-4' : 'space-y-6 p-5'}>
        {!isOnlineChannelForm && <div className="flex items-center justify-between border border-[#E8E8E8] bg-[#F8FAFB] px-4 py-3">
          <div>
            <div className="text-sm font-bold text-gray-800">名称、价格、图片使用商品主档</div>
            <div className="mt-0.5 text-xs text-gray-400">关闭后可为{activeChannel.name}维护独立的基础售卖资料。</div>
          </div>
          <button
            type="button"
            aria-pressed={inherited}
            onClick={() => setInheritBasic(prev => ({ ...prev, [activeId]: !inherited }))}
            className={`relative h-6 w-11 rounded-full transition-colors ${inherited ? 'bg-[#00C06B]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${inherited ? 'left-6' : 'left-1'}`} />
          </button>
        </div>}

        {!isOnlineChannelForm && !inherited && (
          <div className="grid grid-cols-1 gap-4 border border-[#E8E8E8] p-4 md:grid-cols-3">
            <label className="space-y-2 text-xs font-bold text-gray-600">
              <span>渠道商品名称</span>
              <input className="h-10 w-full border border-gray-200 px-3 text-sm font-medium outline-none focus:border-[#00C06B]" defaultValue="招牌珍珠奶茶（外卖版）" />
            </label>
            <label className="space-y-2 text-xs font-bold text-gray-600">
              <span>渠道销售价</span>
              <div className="flex h-10 items-center border border-gray-200 bg-white px-3 focus-within:border-[#00C06B]"><span className="mr-2 text-gray-400">¥</span><input className="w-full text-sm font-medium outline-none" defaultValue="18.00" /></div>
            </label>
            <label className="space-y-2 text-xs font-bold text-gray-600">
              <span>渠道商品图片</span>
              <button type="button" disabled title="图片素材选择器尚未接入当前原型" className="flex h-10 w-full cursor-not-allowed items-center justify-center border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400"><ImageIcon size={15} className="mr-2" /> 独立图片待接入</button>
            </label>
          </div>
        )}

        {isOnlineChannelForm && (
          <div className="overflow-hidden border border-[#DDE3E8] bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E8E8E8] bg-[#FAFBFC] px-4 py-3.5">
              <div>
                <div className="flex items-center text-sm font-black text-[#1F2129]"><RefreshCw size={15} className="mr-2 text-[#00A35B]" />复用现有渠道资料</div>
                <div className="mt-1 text-xs leading-5 text-[#667085]">以下字段继续在通用表单维护，不重复增加平台字段；同步时由系统完成对象拆分和格式转换。</div>
              </div>
              <span className="inline-flex items-center border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700"><LockKeyhole size={12} className="mr-1.5" />无需重复填写</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[880px] w-full border-collapse text-left">
                <thead className="bg-[#F7F8FA] text-[11px] font-bold text-[#667085]">
                  <tr>
                    <th className="w-[190px] border-b border-[#E5E6EB] px-4 py-2.5">企迈资料来源</th>
                    <th className="w-[310px] border-b border-[#E5E6EB] px-4 py-2.5">{isDouyinChannelForm ? '抖音接口目标' : '美团接口目标'}</th>
                    <th className="border-b border-[#E5E6EB] px-4 py-2.5">同步适配规则</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-[#4E5969]">
                  {reuseRows.map(row => (
                    <tr key={row.source}>
                      <td className="border-b border-[#EEF0F2] px-4 py-3 font-bold text-[#1F2129]">{row.source}</td>
                      <td className="border-b border-[#EEF0F2] px-4 py-3"><span className="inline-flex items-center gap-2"><ArrowRight size={13} className="text-[#98A2B3]" />{row.target}</span></td>
                      <td className="border-b border-[#EEF0F2] px-4 py-3 leading-5">{row.rule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#E8E8E8] bg-[#F2F8FF] px-4 py-3 text-[11px] leading-5 text-[#245B8A]">
              {isDouyinChannelForm
                ? '标品同步只使用品牌级资料；包装费、售卖时间、收款方式和门店范围在“下发门店并创建点单品”时写入，不随标品提交。'
                : '渠道商品用于生成品牌商品；门店价格、上下架、售卖时间和门店差异在下发门店时写入平台门店商品。'}
            </div>
          </div>
        )}

        {fields.length > 0 ? (
          <div>
            {isOnlineChannelForm && (
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-[#E8E8E8] pb-3">
                <div>
                  <div className="text-sm font-black text-[#1F2129]">{isDouyinChannelForm ? '抖音在线点专属属性' : '美团在线点专属属性'}</div>
                  <div className="mt-1 text-xs text-[#667085]">仅维护无法由企迈通用商品字段等价生成的平台资料。</div>
                </div>
                <span className="border border-[#E5E6EB] bg-[#F7F8FA] px-2.5 py-1 text-[11px] text-[#667085]">随当前渠道商品维护</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            {fields.map(field => {
              const value = channelValues[field.id];
              return (
                <div key={field.id} className={field.type === 'checkbox' ? 'md:col-span-2' : ''}>
                  <div className="mb-2 flex items-center text-xs font-bold text-gray-700">
                    {field.required && <span className="mr-1 text-red-500">*</span>}{field.label}
                    {field.description && <span title={field.description}><Info size={13} className="ml-1.5 text-gray-400" /></span>}
                  </div>
                  {field.type === 'select' && (
                    <select value={String(value)} onChange={event => updateValue(field.id, event.target.value)} className="h-10 w-full border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#00C06B]">
                      {field.options?.map(option => <option key={option}>{option}</option>)}
                    </select>
                  )}
                  {field.type === 'text' && (
                    <input
                      value={String(value || '')}
                      onChange={event => updateValue(field.id, event.target.value)}
                      className="h-10 w-full border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#00C06B]"
                      placeholder={field.placeholder || '请输入'}
                    />
                  )}
                  {field.type === 'switch' && (
                    <button type="button" onClick={() => updateValue(field.id, !value)} className={`relative h-6 w-11 rounded-full ${value ? 'bg-[#00C06B]' : 'bg-gray-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${value ? 'left-6' : 'left-1'}`} /></button>
                  )}
                  {field.type === 'radio' && (
                    <div className="flex gap-5">
                      {field.options?.map(option => (
                        <button key={option} type="button" onClick={() => updateValue(field.id, option)} className="flex items-center text-sm text-gray-700">
                          <span className={`mr-2 flex h-5 w-5 items-center justify-center rounded-full border-2 ${value === option ? 'border-[#00C06B]' : 'border-gray-300'}`}>{value === option && <span className="h-2.5 w-2.5 rounded-full bg-[#00C06B]" />}</span>{option}
                        </button>
                      ))}
                    </div>
                  )}
                  {field.type === 'checkbox' && (
                    <div className="flex flex-wrap gap-3">
                      {field.options?.map(option => {
                        const selectedValues = Array.isArray(value) ? value : [];
                        const selected = selectedValues.includes(option);
                        return (
                          <button key={option} type="button" onClick={() => updateValue(field.id, selected ? selectedValues.filter(item => item !== option) : [...selectedValues, option])} className={`flex items-center border px-3 py-2 text-sm ${selected ? 'border-[#8BD7AE] bg-[#F0FBF5] text-[#008F53]' : 'border-gray-200 text-gray-600'}`}>
                            <span className={`mr-2 flex h-4 w-4 items-center justify-center border ${selected ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300'}`}>{selected && <Check size={11} className="text-white" />}</span>{option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        ) : isMeituanDineChannelForm ? (
          <div className="border border-[#CFE8DA] bg-[#F3FCF7] px-5 py-4">
            <div className="flex items-center text-sm font-black text-[#087443]"><Check size={15} className="mr-2" />一期无需额外填写美团专属字段</div>
            <div className="mt-2 text-xs leading-5 text-[#4D7C62]">
              标准商品所需的名称、规格、SKU、价格和后台分类复用企迈资料；管理模式、来源、门店连接和平台编码由系统生成。商品简述、平台标签、属性互斥、售卖日期与时段等增强字段一期不展示、不提交。
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
            <div className="text-sm font-bold text-gray-700">{activeChannel.name}属性能力待补充</div>
            <div className="mt-1 text-xs text-gray-400">当前先支持名称、价格和图片差异；平台专属字段将在能力规则确认后补齐。</div>
          </div>
        )}
      </div>
    </div>
  );
};
