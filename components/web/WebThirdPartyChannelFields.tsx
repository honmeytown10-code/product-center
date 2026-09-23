import React, { useMemo, useState } from 'react';
import { Check, CircleCheck, Image as ImageIcon, Link2 } from 'lucide-react';
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
      id: 'douyinCategory',
      label: '抖音商品类目',
      type: 'select',
      required: true,
      options: ['美食 / 饮品 / 奶茶', '美食 / 饮品 / 果茶', '美食 / 小吃甜品 / 烘焙甜品'],
      description: '用于商品在抖音内展示和归类，品牌商品与门店点单品使用同一选择。',
    },
    {
      id: 'settleType',
      label: '抖音收款方式',
      type: 'radio',
      required: true,
      options: ['总部收款', '门店收款', '区域收款'],
      description: '决定顾客付款后由总部、门店还是区域结算，下发门店商品时生效。',
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
    douyinCategory: '美食 / 饮品 / 奶茶',
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

type Props = {
  channelIds: ThirdPartyChannelId[];
  location: 'master' | 'channel' | 'channel_catalog';
  title?: string;
  compact?: boolean;
};

const PLATFORM_PUBLISH_SUMMARIES: Partial<Record<ThirdPartyChannelId, {
  groups: Array<{ label: string; detail: string; wide?: boolean }>;
}>> = {
  douyin: {
    groups: [
      { label: '商品信息', detail: '名称、图片、规格、SKU 与售价' },
      { label: '售卖设置', detail: '包装费、售卖时间和当前渠道已启用的做法' },
      { label: '商品加料', detail: '已关联且在当前渠道启用的加料随商品同步；名称和类型沿用主档，平台售价和抖音商品类目在“抖音在线点加料”中维护', wide: true },
    ],
  },
  meituan_dine: {
    groups: [
      { label: '商品信息', detail: '名称、图片和后台分类' },
      { label: '销售内容', detail: '规格、SKU、售价、售卖时间，以及当前渠道已启用的做法和加料' },
    ],
  },
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
  const publishSummary = PLATFORM_PUBLISH_SUMMARIES[activeId];
  const channelValues = { ...(CHANNEL_INITIAL_VALUES[activeId] || {}), ...(values[activeId] || {}) };
  const isOnlineChannelForm = Boolean(publishSummary && location !== 'master');
  const updateValue = (fieldId: string, value: string | boolean | string[]) => {
    setValues(prev => ({ ...prev, [activeId]: { ...(prev[activeId] || {}), [fieldId]: value } }));
  };

  return (
    <div className="overflow-hidden border border-[#DDE3E8] bg-white">
      {!isOnlineChannelForm && <div className="flex items-start justify-between gap-5 border-b border-[#E8E8E8] bg-[#FAFBFC] px-5 py-4">
        <div>
          <div className="text-sm font-black text-[#1F2129]">{title || '三方渠道商品资料'}</div>
          <div className="mt-1 text-xs text-gray-500">
            {location === 'master'
              ? '商品主档保持统一身份和公共资料，渠道销售属性请前往渠道商品库维护。'
              : `在这里调整${activeChannel.name}的售卖资料和平台设置，不会影响其他商品库。`}
          </div>
        </div>
        <div className="flex items-center border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700">
          <Link2 size={13} className="mr-1.5" /> 已关联商品主档
        </div>
      </div>}

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
            <div className="text-sm font-bold text-gray-800">跟随商品主档</div>
            <div className="mt-0.5 text-xs text-gray-500">当前名称、价格和图片与商品主档保持一致；关闭后可为{activeChannel.name}单独设置。</div>
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

        {isOnlineChannelForm && publishSummary && (
          <section className="space-y-5" aria-label={`${activeChannel.name}同步资料`}>
            <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-2 bg-[#F7F8FA] px-4 py-3.5 md:grid-cols-2">
              {publishSummary.groups.map(group => (
                <div key={group.label} className={`min-w-0 text-xs leading-5 text-[#667085] ${group.wide ? 'md:col-span-2' : ''}`}>
                  <span className="font-bold text-[#475467]">{group.label}：</span>{group.detail}
                </div>
              ))}
            </div>

            {fields.length > 0 && (
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  {fields.map(field => {
                    const value = channelValues[field.id];
                    return (
                      <div key={field.id} className={field.type === 'checkbox' ? 'md:col-span-2' : ''}>
                        <div className="mb-2 flex items-center text-xs font-bold text-gray-700">
                          {field.required && <span className="mr-1 text-red-500">*</span>}{field.label}
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
                        {field.description && <div className="mt-2 text-xs leading-5 text-[#667085]">{field.description}</div>}
                      </div>
                    );
                  })}
              </div>
            )}

            {fields.length === 0 && (
              <div className="flex items-center gap-3 border border-[#D9EDE2] bg-[#F7FCF9] px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF8F1] text-[#008F53]" aria-hidden="true">
                  <CircleCheck size={16} />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1D2129]">无需额外设置</div>
                  <div className="mt-0.5 text-xs leading-5 text-[#667085]">
                    当前商品没有其他{activeChannel.name}专属属性。
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {!isOnlineChannelForm && fields.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            {fields.map(field => {
              const value = channelValues[field.id];
              return (
                <div key={field.id} className={field.type === 'checkbox' ? 'md:col-span-2' : ''}>
                  <div className="mb-2 flex items-center text-xs font-bold text-gray-700">
                    {field.required && <span className="mr-1 text-red-500">*</span>}{field.label}
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
                  {field.description && <div className="mt-2 text-xs leading-5 text-[#667085]">{field.description}</div>}
                </div>
              );
            })}
          </div>
        ) : !isOnlineChannelForm && !publishSummary ? (
          <div className="border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
            <div className="text-sm font-bold text-gray-700">暂无其他设置</div>
            <div className="mt-1 text-xs text-gray-500">当前渠道仅需维护上方的名称、价格和图片。</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
