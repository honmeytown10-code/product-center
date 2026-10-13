import React, { useMemo, useState } from 'react';
import { Check, Image as ImageIcon } from 'lucide-react';
import type { ThirdPartyChannelId } from '../../types';
import { getThirdPartyChannel } from '../../omnichannel';
import { isTakeoutChannel, type TakeoutSnapshot } from '../../takeoutSync';
import { WebJdCategoryBrandFields } from './WebJdCategoryBrandFields';
import { WebMeituanProductMutex } from './WebMeituanProductMutex';

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
      description: '用于商品在抖音内展示和归类。',
    },
    {
      id: 'settleType',
      label: '抖音收款方式',
      type: 'radio',
      required: true,
      options: ['总部收款', '门店收款', '区域收款'],
      description: '决定顾客付款后由总部、门店还是区域结算。',
    },
  ],
  meituan_dine: [],
  jd: [],
  meituan: [
    { id: 'category', label: '美团商品类目', type: 'select', required: true, options: ['饮品 / 奶茶', '饮品 / 果茶', '小吃 / 甜品'] },
    { id: 'comboOnly', label: '仅在套餐内售卖', type: 'radio', options: ['是', '否'] },
    { id: 'noSingleDelivery', label: '单点不送', type: 'radio', options: ['是', '否'], description: '商品需与其他商品一起下单' },
    { id: 'features', label: '商品特色', type: 'checkbox', options: ['招牌菜'] },
    { id: 'attributeMutex', label: '属性互斥', type: 'switch', description: '设置当前商品不能同时选择的做法或加料，如“0卡糖”和“去糖”。' },
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
  jd: { category: '', brandId: '', categoryVerified: false, brandVerified: false },
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

export type ThirdPartyFieldValues = Record<string, Record<string, string | boolean | string[]>>;
/** Use the existing channel form contract; no review status or platform mechanism checks here. */
export const checkChannelRequiredFields = (channel: ThirdPartyChannelId, data: Record<string, any>) => {
  const values = data.channelSpecificValues?.[channel] || {};
  return (CHANNEL_FIELDS[channel] || []).filter(field => field.required && (values[field.id] == null || String(values[field.id]).trim() === ''))
    .map(field => ({ field: field.label, message: `请补充${field.label}。` }));
};
export const resolveChannelFieldValues = (channelIds: ThirdPartyChannelId[], values: ThirdPartyFieldValues) => Object.fromEntries(channelIds.map(id => [id, { ...CHANNEL_INITIAL_VALUES[id], ...values[id] }]));

export type ChannelAddonItem = { groupName: string; name: string };
const ONLINE_CHANNEL_IDS: ThirdPartyChannelId[] = ['douyin', 'meituan_dine'];
export const resolveSelectedSalesChannelIds = (
  channelIds: ThirdPartyChannelId[],
  formData?: { salesChannelIds?: unknown; onlineSalesChannelIds?: unknown },
): ThirdPartyChannelId[] => {
  const selected = formData?.salesChannelIds;
  const onlineSelected = formData?.onlineSalesChannelIds;
  if (Array.isArray(selected)) return channelIds.filter(id => selected.includes(id));
  if (Array.isArray(onlineSelected)) return channelIds.filter(id => !ONLINE_CHANNEL_IDS.includes(id) || onlineSelected.includes(id));
  return channelIds;
};
const DOUYIN_LONG_SALE_END_AT = '2099-12-31 23:59:59';
const getDouyinSaleMode = (settings?: ThirdPartyFieldValues['douyin']) =>
  settings?.soldTimeMode === 'range' || (!settings?.soldTimeMode && (settings?.soldStartAt !== undefined || settings?.soldEndAt !== undefined)) ? 'range' : 'long';
export const formatPlatformDateTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number: number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
export const resolveDouyinSalePeriod = (values: ThirdPartyFieldValues, createdTime?: string) => {
  const settings = values.douyin || {};
  if (getDouyinSaleMode(settings) === 'long') {
    const startAt = formatPlatformDateTime(createdTime || new Date());
    return startAt && startAt < DOUYIN_LONG_SALE_END_AT ? { startAt, endAt: DOUYIN_LONG_SALE_END_AT } : null;
  }
  const startAt = formatPlatformDateTime(String(settings.soldStartAt || ''));
  const endAt = formatPlatformDateTime(String(settings.soldEndAt || ''));
  return startAt && endAt && endAt > startAt ? { startAt, endAt } : null;
};
export const normalizeDouyinChannelValues = (values: ThirdPartyFieldValues, addonItems: ChannelAddonItem[] = []): ThirdPartyFieldValues => {
  const douyin = { ...(values.douyin || {}) };
  if (getDouyinSaleMode(douyin) === 'long') {
    douyin.soldTimeMode = 'long';
    delete douyin.soldStartAt;
    delete douyin.soldEndAt;
  } else {
    const period = resolveDouyinSalePeriod(values);
    if (period) {
      douyin.soldTimeMode = 'range';
      douyin.soldStartAt = period.startAt.replace(' ', 'T');
      douyin.soldEndAt = period.endAt.replace(' ', 'T');
    }
  }
  for (const groupName of new Set(addonItems.map(item => item.groupName).filter(Boolean))) {
    const count = addonItems.filter(item => item.groupName === groupName).length;
    const key = `addonChoice:${groupName}`;
    if (String(douyin[key] || 'all') === String(count)) douyin[key] = 'all';
  }
  return { ...values, douyin };
};
export const getDouyinSettingsError = (values: ThirdPartyFieldValues, addonItems: ChannelAddonItem[] = []): string => {
  const settings = values.douyin || {};
  if (getDouyinSaleMode(settings) === 'range' && !resolveDouyinSalePeriod(values)) return '请填写完整的售卖时间，且结束时间晚于开始时间';
  for (const groupName of new Set(addonItems.map(item => item.groupName).filter(Boolean))) {
    const count = addonItems.filter(item => item.groupName === groupName).length;
    const choice = String(settings[`addonChoice:${groupName}`] || 'all');
    if (choice !== 'all' && (!Number.isInteger(Number(choice)) || Number(choice) < 1 || Number(choice) >= count)) return `请重新设置“${groupName}”的加料组购买限制`;
  }
  return '';
};

type Props = {
  channelIds: ThirdPartyChannelId[];
  selectedSalesChannelIds?: ThirdPartyChannelId[];
  onSelectedSalesChannelIdsChange?: (ids: ThirdPartyChannelId[]) => void;
  showSalesChannelSelector?: boolean;
  addonItems?: ChannelAddonItem[];
  validationError?: string;
  location: 'master' | 'channel' | 'channel_catalog' | 'template' | 'store';
  title?: string;
  compact?: boolean;
  embedded?: boolean;
  unifiedManagementView?: boolean;
  value?: ThirdPartyFieldValues;
  onChange?: (value: ThirdPartyFieldValues) => void;
  productType?: string;
  snapshot?: TakeoutSnapshot;
};

export const WebThirdPartyChannelFields: React.FC<Props> = ({ channelIds, selectedSalesChannelIds, onSelectedSalesChannelIdsChange, showSalesChannelSelector = true, addonItems = [], validationError, location, title, compact = false, embedded = false, unifiedManagementView = false, value, onChange, productType, snapshot }) => {
  const [activeChannelId, setActiveChannelId] = useState<ThirdPartyChannelId>(channelIds[0]);
  const [inheritBasic, setInheritBasic] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, Record<string, string | boolean | string[]>>>({});

  const selectedChannelIds = selectedSalesChannelIds ?? channelIds;
  const visibleChannelIds = location === 'master' ? channelIds : channelIds.filter(id => selectedChannelIds.includes(id));
  const activeId = visibleChannelIds.includes(activeChannelId) ? activeChannelId : visibleChannelIds[0];
  const activeChannel = activeId ? getThirdPartyChannel(activeId) : null;
  const isCombo = productType === 'combo' || productType === '套餐商品';
  const fields = useMemo(() => activeId ? (CHANNEL_FIELDS[activeId] || []).filter(field => !isCombo || !['attributeMutex', 'comboOnly'].includes(field.id)) : [], [activeId, isCombo]);

  const inherited = inheritBasic[activeId] ?? true;
  const channelValues = { ...(CHANNEL_INITIAL_VALUES[activeId] || {}), ...(values[activeId] || {}) };
  const isDouyinChannelForm = activeId === 'douyin' && location !== 'master';
  const isMeituanDineChannelForm = activeId === 'meituan_dine' && location !== 'master';
  const isOnlineChannelForm = isDouyinChannelForm || isMeituanDineChannelForm;
  const isTakeout = isTakeoutChannel(activeId);
  const savedValues = value || values;
  Object.assign(channelValues, savedValues[activeId] || {});
  const updateValue = (fieldId: string, value: string | boolean | string[]) => {
    const nextChannelValues = { ...channelValues };
    if (activeId === 'douyin' && fieldId === 'soldTimeMode') {
      delete nextChannelValues.soldStartAt;
      delete nextChannelValues.soldEndAt;
    }
    const next = { ...savedValues, [activeId]: { ...nextChannelValues, [fieldId]: value } };
    setValues(next);
    onChange?.(next);
  };

  return (
    <div className={`overflow-hidden bg-white ${embedded ? '' : 'border border-[#DDE3E8]'}`}>
      {validationError && <p role="alert" className="px-5 pt-3 text-xs text-[#B42318]">{validationError}</p>}
      {showSalesChannelSelector && location !== 'master' && location !== 'store' && channelIds.length > 0 && <fieldset className="px-5 py-4">
        <legend className="sr-only">售卖渠道</legend>
        <div className="mb-2 text-sm font-semibold text-[#4E5969]">售卖渠道</div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">{channelIds.map(id => <label key={id} className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#344054]"><input type="checkbox" checked={selectedChannelIds.includes(id)} onChange={() => onSelectedSalesChannelIdsChange?.(selectedChannelIds.includes(id) ? selectedChannelIds.filter(item => item !== id) : channelIds.filter(item => item === id || selectedChannelIds.includes(item)))} className="h-4 w-4 accent-[#00B460]" />{getThirdPartyChannel(id).name}</label>)}</div>
      </fieldset>}
      {visibleChannelIds.length > 0 &&
      <div className="console-segmented-tabs flex overflow-x-auto border-b border-[#E8E8E8] bg-white px-4" role="tablist" aria-label={title || '渠道专属属性'}>
        {visibleChannelIds.map(channelId => {
          const channel = getThirdPartyChannel(channelId);
          return (
            <button
              key={channel.id}
              type="button"
                aria-pressed={activeId === channel.id}
                role="tab"
                aria-selected={activeId === channel.id}
              onClick={() => setActiveChannelId(channel.id)}
              className={`shrink-0 border-b-2 px-5 py-3 text-sm font-bold ${activeId === channel.id ? 'border-[#00C06B] text-[#00A35B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {channel.name}
            </button>
          );
        })}
      </div>}
      {visibleChannelIds.length === 0 && <div className="px-5 py-6 text-sm text-[#667085]">请先选择售卖渠道，再维护对应渠道的商品属性。</div>}

      {activeChannel && <div className={compact ? 'space-y-4 p-4' : 'space-y-6 p-5'}>
        {!isOnlineChannelForm && !isTakeout && <div className="flex items-center justify-between border border-[#E8E8E8] bg-[#F8FAFB] px-4 py-3">
          <div>
            <div className="text-sm font-bold text-gray-800">名称、价格、图片使用{unifiedManagementView ? '当前商品资料' : '商品主档'}</div>
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

        {!isOnlineChannelForm && !isTakeout && !inherited && (
          <div className="grid grid-cols-1 gap-4 border border-[#E8E8E8] p-4 md:grid-cols-3">
            <label className="space-y-2 text-xs font-bold text-gray-600">
              <span>渠道商品名称</span>
              <input className="h-10 w-full border border-gray-200 px-3 text-sm font-medium outline-none focus:border-[#00C06B]" defaultValue="招牌珍珠奶茶（外卖版）" />
            </label>
            <label className="space-y-2 text-xs font-bold text-gray-600">
              <span>渠道售价</span>
              <div className="flex h-10 items-center border border-gray-200 bg-white px-3 focus-within:border-[#00C06B]"><span className="mr-2 text-gray-400">¥</span><input className="w-full text-sm font-medium outline-none" defaultValue="18.00" /></div>
            </label>
            <label className="space-y-2 text-xs font-bold text-gray-600">
              <span>渠道商品图片</span>
              <button type="button" disabled title="图片素材选择器尚未接入当前原型" className="flex h-10 w-full cursor-not-allowed items-center justify-center border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400"><ImageIcon size={15} className="mr-2" /> 独立图片待接入</button>
            </label>
          </div>
        )}

        {(isOnlineChannelForm || isTakeout) && <div className="grid gap-x-6 gap-y-2 bg-[#F7F8FA] px-4 py-3 text-xs leading-5 text-[#667085] md:grid-cols-2">
          <p><strong className="font-semibold text-[#4E5969]">商品信息：</strong>名称、图片、规格、SKU 与售价</p>
          <p><strong className="font-semibold text-[#4E5969]">售卖设置：</strong>{isDouyinChannelForm ? '包装费、当前渠道已启用的做法，以及下方设置的售卖时间' : isTakeout ? '已启用的做法与加料选择规则' : '售卖时间、做法与加料选择规则'}</p>
          <p className="md:col-span-2"><strong className="font-semibold text-[#4E5969]">商品加料：</strong>{isDouyinChannelForm ? '当前渠道已启用的加料及下方的分组选择数量；加料售价和抖音类目在“抖音在线点加料”维护。' : '使用当前商品已关联且在本渠道启用的加料。'}</p>
        </div>}

        {activeId === 'jd' && <WebJdCategoryBrandFields values={channelValues} onChange={(patch) => { const next = { ...savedValues, [activeId]: { ...channelValues, ...patch } }; setValues(next); onChange?.(next); }} />}
        {fields.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            {fields.map(field => {
              const value = channelValues[field.id];
              return (
                <div key={field.id} className={field.type === 'checkbox' || field.id === 'attributeMutex' ? 'md:col-span-2' : ''}>
                  <label htmlFor={`platform-field-${activeId}-${field.id}`} className="mb-2 block text-sm font-semibold text-[#4E5969]">
                    {field.required && <span className="mr-1 text-red-500">*</span>}{field.label}
                  </label>
                  {field.type === 'select' && (
                    <select id={`platform-field-${activeId}-${field.id}`} value={String(value)} onChange={event => updateValue(field.id, event.target.value)} className="h-10 w-full rounded border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#00C06B]">
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
                    <div className="flex items-center gap-2"><button id={`platform-field-${activeId}-${field.id}`} type="button" role="switch" aria-label={field.label} aria-checked={Boolean(value)} onClick={() => updateValue(field.id, !value)} className={`relative h-6 w-11 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B460] ${value ? 'bg-[#00C06B]' : 'bg-gray-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${value ? 'left-6' : 'left-1'}`} /></button><span className="text-sm text-[#667085]">{value ? '已开启' : '已关闭'}</span></div>
                  )}
                  {field.type === 'radio' && (
                    <div id={`platform-field-${activeId}-${field.id}`} role="group" aria-label={field.label} className="flex flex-wrap gap-5">
                      {field.options?.map(option => (
                        <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"><input type="radio" name={`platform-${activeId}-${field.id}`} checked={value === option} onChange={() => updateValue(field.id, option)} className="h-4 w-4 accent-[#00B460]" />{option}</label>
                      ))}
                    </div>
                  )}
                  {field.type === 'checkbox' && (
                    <div className="flex flex-wrap gap-3">
                      {field.options?.map(option => {
                        const selectedValues = Array.isArray(value) ? value : [];
                        const selected = selectedValues.includes(option);
                        return (
                          <button key={option} type="button" aria-pressed={selected} onClick={() => updateValue(field.id, selected ? selectedValues.filter(item => item !== option) : [...selectedValues, option])} className={`flex items-center border px-3 py-2 text-sm ${selected ? 'border-[#8BD7AE] bg-[#F0FBF5] text-[#008F53]' : 'border-gray-200 text-gray-600'}`}>
                            <span className={`mr-2 flex h-4 w-4 items-center justify-center border ${selected ? 'border-[#00C06B] bg-[#00C06B]' : 'border-gray-300'}`}>{selected && <Check size={11} className="text-white" />}</span>{option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {field.description && <p className="mt-2 text-xs leading-5 text-[#667085]">{field.description}</p>}
                  {field.id === 'attributeMutex' && Boolean(value) && <WebMeituanProductMutex snapshot={snapshot} pairs={Array.isArray(channelValues.attributeMutexPairs) ? channelValues.attributeMutexPairs : []} onChange={pairs => updateValue('attributeMutexPairs', pairs)} />}
                </div>
              );
            })}
            </div>
          </div>
        ) : isMeituanDineChannelForm ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#667085]">
            <Check size={16} className="text-[#008F4C]" />暂无其他渠道专属属性需要维护
          </div>
        ) : activeId !== 'jd' ? (
          <div className="border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
            <div className="text-sm font-bold text-gray-700">暂无其他设置</div>
            <div className="mt-1 text-xs text-gray-500">当前渠道仅需维护上方的名称、价格和图片。</div>
          </div>
        ) : null}
            {activeId === 'douyin' && <div className="space-y-5">
              <div>
                <div className="mb-2 text-xs font-bold text-[#344054]">售卖时间</div>
                <div className="flex flex-wrap gap-5 text-sm text-[#344054]">
                  {(['long', 'range'] as const).map(mode => <label key={mode} className="inline-flex cursor-pointer items-center gap-2"><input type="radio" name="douyin-sold-time-mode" checked={getDouyinSaleMode(channelValues) === mode} onChange={() => updateValue('soldTimeMode', mode)} className="h-4 w-4 accent-[#00B460]" />{mode === 'long' ? '长期售卖' : '指定日期售卖'}</label>)}
                </div>
                {getDouyinSaleMode(channelValues) === 'long' && <p className="mt-2 text-xs text-[#667085]">同步时按商品创建时间至 2099-12-31 23:59:59 设置售卖时间。</p>}
                {getDouyinSaleMode(channelValues) === 'range' && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#667085]">
                  <input aria-label="抖音售卖开始时间" type="datetime-local" step="1" value={String(channelValues.soldStartAt || '')} onChange={event => updateValue('soldStartAt', event.target.value)} className="h-9 border border-[#DDE3E8] bg-white px-2 text-[#344054]" />
                  <span>至</span>
                  <input aria-label="抖音售卖结束时间" type="datetime-local" step="1" value={String(channelValues.soldEndAt || '')} onChange={event => updateValue('soldEndAt', event.target.value)} className="h-9 border border-[#DDE3E8] bg-white px-2 text-[#344054]" />
                </div>}
                {getDouyinSaleMode(channelValues) === 'range' && (channelValues.soldStartAt || channelValues.soldEndAt) && !resolveDouyinSalePeriod({ douyin: channelValues }) && <p role="alert" className="mt-2 text-xs text-[#B42318]">请填写完整的售卖时间，且结束时间晚于开始时间。</p>}
              </div>
              {(() => {
                const groups = Array.from(new Set(addonItems.map(item => item.groupName).filter(Boolean)));
                return groups.length > 0 ? <div><div className="mb-2 text-xs font-bold text-[#344054]">加料组购买限制</div><div className="divide-y divide-[#E8E8E8] border-y border-[#E8E8E8]">{groups.map(groupName => {
                  const groupAddons = addonItems.filter(item => item.groupName === groupName);
                  const count = groupAddons.length;
                  const key = `addonChoice:${groupName}`;
                  const storedChoice = String(channelValues[key] || 'all');
                  const choice = storedChoice === String(count) ? 'all' : storedChoice;
                  return <div key={groupName} className="flex flex-wrap items-center justify-between gap-4 py-3"><div className="min-w-0 flex-1"><div className="text-sm font-medium text-[#344054]">{groupName} <span className="ml-1 text-xs font-normal text-[#667085]">{count} 个加料</span></div><div className="mt-1 text-xs leading-5 text-[#667085]">{groupAddons.map(item => item.name).join('、')}</div></div><select aria-label={`${groupName}加料组购买限制`} value={choice} onChange={event => updateValue(key, event.target.value)} className="h-9 min-w-[140px] border border-[#DDE3E8] bg-white px-2 text-sm text-[#344054]"><option value="all">全部可选</option>{Array.from({ length: Math.max(count - 1, 0) }, (_, index) => index + 1).map(number => <option key={number} value={String(number)}>{count} 选 {number}</option>)}</select></div>;
                })}</div></div> : <p className="text-xs text-[#667085]">当前商品没有已启用的加料，无需设置加料组购买限制。</p>;
              })()}
            </div>}

        {isTakeout && activeId !== 'jd' && snapshot && snapshot.skus.length > 0 && <section className="border-t border-[#E5E6EB] pt-4"><h4 className="mb-3 text-sm font-semibold text-[#4E5969]">餐盒费计费方式</h4><div className="space-y-2">{snapshot.skus.map(sku => <div key={sku.id} className="flex flex-wrap items-center gap-3 text-sm"><span className="w-40 break-words text-[#4E5969]">{sku.name || '单规格'}</span><span className="text-[#667085]">¥{sku.packagingFee || '0'} / 每</span><input aria-label={`${activeChannel.name}${sku.name || '单规格'}餐盒费计费步长`} type="number" min="1" step="1" value={String(channelValues[`packingStep:${sku.id}`] ?? '1')} onChange={event => updateValue(`packingStep:${sku.id}`, event.target.value)} className="h-9 w-20 rounded border border-[#DDE2E8] px-2" /><span className="text-[#667085]">份</span></div>)}</div><p className="mt-2 text-xs leading-5 text-[#667085]">餐盒费金额在商品结构中维护。</p></section>}
      </div>}
    </div>
  );
};
