import type {
  BrandConfig,
  OmnichannelBrandConfig,
  OmnichannelChannelId,
  PrivateChannelId,
  ThirdPartyChannelId,
} from './types';

export type ProductSource =
  | { type: 'master'; id: 'master'; label: '商品主档'; description: string }
  | { type: 'channel_catalog'; id: string; label: string; description: string }
  | { type: 'missing'; id: 'missing'; label: '配置待完善'; description: string };

export type OmnichannelChannel = {
  id: OmnichannelChannelId;
  name: string;
  shortName: string;
  type: 'private' | 'third_party';
  platformProductScope?: 'brand_and_store' | 'store_only';
  requiresBrandReview?: boolean;
  supportsServiceProviderBilling?: boolean;
};

export const PRIVATE_CHANNELS: Array<OmnichannelChannel & { id: PrivateChannelId }> = [
  { id: 'pos', name: 'POS', shortName: 'POS', type: 'private' },
  { id: 'mini_program_dine_in', name: '小程序堂食', shortName: '小程序堂食', type: 'private' },
  { id: 'mini_program_delivery', name: '小程序外卖', shortName: '小程序外卖', type: 'private' },
];

export const THIRD_PARTY_CHANNELS: Array<OmnichannelChannel & { id: ThirdPartyChannelId }> = [
  { id: 'meituan', name: '美团外卖', shortName: '美团外卖', type: 'third_party', platformProductScope: 'store_only', supportsServiceProviderBilling: true },
  { id: 'taobao', name: '淘宝闪购', shortName: '淘宝闪购', type: 'third_party', platformProductScope: 'store_only', supportsServiceProviderBilling: true },
  { id: 'douyin', name: '抖音在线点', shortName: '抖音在线点', type: 'third_party', platformProductScope: 'brand_and_store', requiresBrandReview: true },
  { id: 'meituan_dine', name: '美团在线点', shortName: '美团在线点', type: 'third_party', platformProductScope: 'brand_and_store' },
  { id: 'meituan_pinhaofan', name: '美团拼好饭', shortName: '美团拼好饭', type: 'third_party', platformProductScope: 'store_only' },
];

export const ALL_OMNICHANNEL_CHANNELS = [...PRIVATE_CHANNELS, ...THIRD_PARTY_CHANNELS];
export const MINI_PROGRAM_CHANNEL_IDS: PrivateChannelId[] = [
  'mini_program_dine_in',
  'mini_program_delivery',
];
export const UNIFIED_CHANNEL_CATALOG_ID = 'unified-default-catalog';
export const TAKEAWAY_STORE_BINDING_URL = 'https://console.qmai.co/commonCenter/takeaway/binding';

export const DEFAULT_OMNICHANNEL_CONFIG: OmnichannelBrandConfig = {
  enabled: true,
  collaborationMode: 'channel_division',
  channelProductCreationMode: 'existing_master_only',
  thirdPartyStrategies: {
    meituan: 'qimai',
    taobao: 'qimai',
    douyin: 'qimai',
    meituan_dine: 'qimai',
    meituan_pinhaofan: 'qimai',
  },
  channelConnections: {
    meituan: { capabilities: ['order_receiving', 'product_operations'] },
    taobao: { capabilities: ['order_receiving', 'product_operations'] },
    douyin: { capabilities: ['order_receiving', 'product_operations'] },
    meituan_dine: { capabilities: ['order_receiving', 'product_operations'] },
    meituan_pinhaofan: { capabilities: ['order_receiving', 'product_operations'] },
  },
  channelGroups: [
    {
      id: 'dine-in-catalog',
      name: '堂食商品库',
      channels: ['pos', 'mini_program_dine_in'],
    },
    {
      id: 'delivery-catalog',
      name: '外卖商品库',
      channels: ['mini_program_delivery', 'meituan', 'taobao', 'meituan_pinhaofan'],
    },
    {
      id: 'online-order-catalog',
      name: '在线点商品库',
      channels: ['douyin', 'meituan_dine'],
    },
  ],
};

export const getOmnichannelConfig = (brandConfig?: BrandConfig): OmnichannelBrandConfig => ({
  ...DEFAULT_OMNICHANNEL_CONFIG,
  ...(brandConfig?.omnichannel || {}),
  thirdPartyStrategies: {
    ...DEFAULT_OMNICHANNEL_CONFIG.thirdPartyStrategies,
    ...(brandConfig?.omnichannel?.thirdPartyStrategies || {}),
  },
  channelConnections: {
    ...DEFAULT_OMNICHANNEL_CONFIG.channelConnections,
    ...(brandConfig?.omnichannel?.channelConnections || {}),
  },
  channelGroups: brandConfig?.omnichannel?.channelGroups || DEFAULT_OMNICHANNEL_CONFIG.channelGroups,
});

export const channelNeedsAuthorization = (
  config: OmnichannelBrandConfig,
  channelId: ThirdPartyChannelId
) => (
  config.thirdPartyStrategies[channelId] === 'qimai'
  || config.channelConnections[channelId].capabilities.length > 0
);

export const getThirdPartyChannel = (channelId: ThirdPartyChannelId) => (
  THIRD_PARTY_CHANNELS.find(channel => channel.id === channelId)!
);

export const getOmnichannelChannel = (channelId: OmnichannelChannelId) => (
  ALL_OMNICHANNEL_CHANNELS.find(channel => channel.id === channelId)!
);

export const channelGroupIncludesMiniProgram = (channelIds: OmnichannelChannelId[]) => (
  channelIds.some(channelId => MINI_PROGRAM_CHANNEL_IDS.includes(channelId as PrivateChannelId))
);

export const isThirdPartyChannelId = (channelId: OmnichannelChannelId): channelId is ThirdPartyChannelId => (
  THIRD_PARTY_CHANNELS.some(channel => channel.id === channelId)
);

export const getQimaiManagedThirdPartyChannels = (config: OmnichannelBrandConfig) => (
  THIRD_PARTY_CHANNELS.filter(channel => config.thirdPartyStrategies[channel.id] === 'qimai')
);

export const getQimaiManagedChannels = (config: OmnichannelBrandConfig) => (
  ALL_OMNICHANNEL_CHANNELS.filter(channel => (
    channel.type === 'private' || config.thirdPartyStrategies[channel.id as ThirdPartyChannelId] === 'qimai'
  ))
);

/**
 * 需要由渠道商品库准备企迈侧门店渠道商品的渠道。
 * 平台维护平台资料并不等于退出企迈商品链路：只要启用了接单或商品经营能力，
 * 仍需从渠道商品库下发门店渠道商品，并以此建立映射。
 */
export const getChannelCatalogChannels = (config: OmnichannelBrandConfig) => (
  ALL_OMNICHANNEL_CHANNELS.filter(channel => {
    if (channel.type === 'private') return true;
    const channelId = channel.id as ThirdPartyChannelId;
    return config.thirdPartyStrategies[channelId] === 'qimai'
      || config.channelConnections[channelId].capabilities.length > 0;
  })
);

export const getPlatformManagedThirdPartyChannels = (config: OmnichannelBrandConfig) => (
  THIRD_PARTY_CHANNELS.filter(channel => config.thirdPartyStrategies[channel.id] === 'platform')
);

export const shouldShowChannelCatalog = (config: OmnichannelBrandConfig) => (
  config.enabled
  && getChannelCatalogChannels(config).length > 0
);

export const getMasterChannelAttributeIds = (_config: OmnichannelBrandConfig): ThirdPartyChannelId[] => [];

export const getEffectiveChannelGroups = (config: OmnichannelBrandConfig) => {
  const catalogChannelIds = new Set(getChannelCatalogChannels(config).map(channel => channel.id));
  if (!config.enabled || catalogChannelIds.size === 0) return [];

  if (config.collaborationMode === 'unified') {
    return [{
      id: UNIFIED_CHANNEL_CATALOG_ID,
      name: '品牌默认商品库',
      channels: Array.from(catalogChannelIds),
    }];
  }

  return config.channelGroups
    .map(group => ({
      ...group,
      channels: group.channels.filter(channelId => catalogChannelIds.has(channelId)),
    }))
    .filter(group => group.channels.length > 0);
};

export const findChannelGroup = (config: OmnichannelBrandConfig, channelId: OmnichannelChannelId) => (
  getEffectiveChannelGroups(config).find(group => group.channels.includes(channelId))
);

export const getProductSourceForChannel = (
  config: OmnichannelBrandConfig,
  channelId: OmnichannelChannel['id']
): ProductSource => {
  if (!config.enabled) {
    return {
      type: 'master',
      id: 'master',
      label: '商品主档',
      description: '未启用全渠道商品管理，使用商品主档。',
    };
  }

  if (
    isThirdPartyChannelId(channelId)
    && config.thirdPartyStrategies[channelId] === 'platform'
    && config.channelConnections[channelId].capabilities.length === 0
  ) {
    return {
      type: 'master',
      id: 'master',
      label: '商品主档',
      description: '商品中心仅生成企迈侧渠道商品，平台售卖资料由平台维护。',
    };
  }

  if (config.collaborationMode === 'unified') {
    const group = findChannelGroup(config, channelId);
    return {
      type: 'channel_catalog',
      id: `channel_catalog:${group?.id || UNIFIED_CHANNEL_CATALOG_ID}`,
      label: `渠道商品库 · ${group?.name || '品牌默认商品库'}`,
      description: '新建商品主档后自动生成渠道商品，渠道销售属性在品牌默认商品库维护。',
    };
  }

  const group = findChannelGroup(config, channelId);
  if (!group) {
    return {
      type: 'missing',
      id: 'missing',
      label: '配置待完善',
      description: `${getOmnichannelChannel(channelId).name}尚未加入渠道商品库分组。`,
    };
  }

  return {
    type: 'channel_catalog',
    id: `channel_catalog:${group.id}`,
    label: `渠道商品库 · ${group.name}`,
    description: `${group.name}维护该组渠道的售卖资料。`,
  };
};

export const resolveTemplateProductSource = (
  config: OmnichannelBrandConfig,
  channelIds: OmnichannelChannel['id'][]
) => {
  const sources = channelIds.map(channelId => ({
    channelId,
    source: getProductSourceForChannel(config, channelId),
  }));
  const sourceIds = Array.from(new Set(sources.map(item => item.source.id)));
  const missing = sources.find(item => item.source.type === 'missing');

  if (missing) {
    return {
      valid: false,
      source: missing.source,
      sources,
      message: missing.source.description,
    };
  }

  if (sourceIds.length > 1) {
    return {
      valid: false,
      source: null,
      sources,
      message: '所选渠道对应多个商品来源，请拆分为不同模板后分别下发。',
    };
  }

  return {
    valid: true,
    source: sources[0]?.source || getProductSourceForChannel(config, 'pos'),
    sources,
    message: sources[0]?.source.description || '模板使用渠道商品库。',
  };
};

export const getOmnichannelModeSummary = (config: OmnichannelBrandConfig) => {
  const catalogChannels = getChannelCatalogChannels(config);
  const platformChannels = getPlatformManagedThirdPartyChannels(config);

  if (!config.enabled) {
    return {
      title: '未启用全渠道商品管理',
      description: '商品中心按原有商品主档和渠道链路运行。',
    };
  }

  if (config.collaborationMode === 'unified') {
    return {
      title: '统一商品团队管理',
      description: `商品身份与${catalogChannels.map(channel => channel.shortName).join('、')}的企迈侧经营资料使用品牌默认商品库${platformChannels.length ? `；${platformChannels.map(channel => channel.shortName).join('、')}的平台专属资料仍在平台维护，启用企迈能力时下发门店商品用于映射` : ''}。`,
    };
  }

  return {
    title: '按渠道职责协作',
    description: `${catalogChannels.map(channel => channel.shortName).join('、')}按渠道商品库分组维护企迈侧经营资料${platformChannels.length ? `；${platformChannels.map(channel => channel.shortName).join('、')}的平台专属资料仍在平台维护，企迈侧门店商品从所属商品库下发并用于映射` : ''}。`,
  };
};
