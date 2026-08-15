import React, { useMemo, useState } from 'react';
import { Check, Image as ImageIcon, Info, Link2 } from 'lucide-react';
import type { ThirdPartyChannelId } from '../../types';
import { getThirdPartyChannel } from '../../omnichannel';

type FieldDefinition = {
  id: string;
  label: string;
  type: 'select' | 'switch' | 'radio' | 'checkbox';
  required?: boolean;
  options?: string[];
  description?: string;
};

const CHANNEL_FIELDS: Partial<Record<ThirdPartyChannelId, FieldDefinition[]>> = {
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

const initialValues: Record<string, string | boolean | string[]> = {
  category: '饮品 / 奶茶',
  attributeMutex: false,
  comboOnly: '否',
  noSingleDelivery: '否',
  features: [],
};

type Props = {
  channelIds: ThirdPartyChannelId[];
  location: 'master' | 'channel_catalog';
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
  const channelValues = { ...initialValues, ...(values[activeId] || {}) };
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
        <div className="flex items-center justify-between border border-[#E8E8E8] bg-[#F8FAFB] px-4 py-3">
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
        </div>

        {!inherited && (
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

        {fields.length > 0 ? (
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
