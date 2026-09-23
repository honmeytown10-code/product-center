import React, { useState, useEffect } from 'react';
import { ChevronRight, Image, RotateCcw } from 'lucide-react';
import { useProducts } from '../../context';
import { CATEGORIES } from '../../types';
import { CHANNEL_TABS, ChannelType } from './PosCommon';
import { ClearanceSettingsModal, ClearanceUpdate } from './PosModals';
import { PosCategories, PosStatusFilters, PosDock, PosEmpty, PosResult, PosSelection, PosDialog, POS_STORE_NAME } from './PosWorkspace';
// Most restaurant items have no selling limit. These samples represent the few items
// that the store has explicitly limited or sold out through stockout management.
const MOCK_LIMITED_PRODUCT_IDS = new Set(['p8', 'p9', 'p16', 'p18', 'p22', 'p23', 'p29', 'p30', 'p34', 'p38']);
const createMockProduct = (id: string, name: string, price: number, spec: string, sampleStock: number, category: string, tags: { text: string; color: string }[] = []) => {
  const stock = MOCK_LIMITED_PRODUCT_IDS.has(id) ? sampleStock : Infinity;
  const soldOut = stock <= 0;
  const status = soldOut ? 'sold_out' : stock < 30 ? 'warning' : 'normal';
  const specNames = spec.includes('/') && !spec.includes('约') ? spec.split('/') : [spec];
  const specs = specNames.length > 1 ? specNames.map((specName, index) => ({ id: `${id}_s${index + 1}`, name: specName, stock: stock === Infinity ? Infinity : Math.floor(stock / specNames.length) + (index < stock % specNames.length ? 1 : 0) })) : undefined;
  return {
    id, name, price, spec, stock, category, status, tags,
    hasMultipleSpecs: !!specs,
    specs,
    channels: Object.fromEntries(CHANNEL_TABS.map(item => [item.id, soldOut ? 'sold_out' : 'normal'])),
    channelStocks: Object.fromEntries(CHANNEL_TABS.map(item => [item.id, stock])),
    channelTypes: soldOut ? Object.fromEntries(CHANNEL_TABS.map(item => [item.id, '长期'])) : {},
  };
};

const ADDITIONAL_MOCK_PRODUCTS = [
  createMockProduct('p7', '港式冻柠茶', 16, '中杯/大杯', 48, '现制饮品'),
  createMockProduct('p8', '杨枝甘露', 22, '标准杯', 0, '现制饮品'),
  createMockProduct('p9', '桂花乌龙奶茶', 18, '中杯/大杯', 18, '现制饮品'),
  createMockProduct('p10', '黑糖珍珠鲜奶', 20, '大杯', 36, '现制饮品'),
  createMockProduct('p11', '冰美式', 12, '中杯/大杯', 66, '现制饮品'),
  createMockProduct('p12', '抹茶生椰', 21, '大杯', 0, '现制饮品'),
  createMockProduct('p13', '白桃乌龙气泡水', 19, '标准杯', 12, '现制饮品'),
  createMockProduct('p14', '芋泥波波牛乳', 23, '大杯', 42, '现制饮品'),
  createMockProduct('p15', '蜜汁叉烧饭', 36, '标准份', 24, '中式正餐'),
  createMockProduct('p16', '川香水煮牛肉', 48, '标准份', 0, '中式正餐'),
  createMockProduct('p17', '台式卤肉饭', 28, '标准份', 50, '中式正餐'),
  createMockProduct('p18', '菌菇鸡汤面', 26, '标准份', 8, '中式正餐'),
  createMockProduct('p19', '葱油拌面', 18, '标准份', 35, '中式正餐'),
  createMockProduct('p20', '金汤酸菜鱼', 58, '双人份', 0, '中式正餐'),
  createMockProduct('p21', '经典香辣鸡腿堡', 24, '单品/套餐', 60, '西式快餐'),
  createMockProduct('p22', '黑椒牛柳意面', 32, '标准份', 14, '西式快餐'),
  createMockProduct('p23', '芝士培根披萨', 52, '九英寸', 0, '西式快餐'),
  createMockProduct('p24', '香脆薯条', 12, '中份/大份', 28, '西式快餐'),
  createMockProduct('p25', '奥尔良烤翅', 22, '六只装', 45, '西式快餐'),
  createMockProduct('p26', '流心巴斯克', 28, '单块', 0, '烘焙甜品'),
  createMockProduct('p27', '海盐芝士蛋糕', 26, '单块', 12, '烘焙甜品'),
  createMockProduct('p28', '黄油可颂', 15, '单个', 32, '烘焙甜品'),
  createMockProduct('p29', '肉桂苹果卷', 18, '单个', 7, '烘焙甜品'),
  createMockProduct('p30', '巧克力熔岩蛋糕', 30, '单份', 0, '烘焙甜品'),
  createMockProduct('p31', '抹茶红豆司康', 16, '单个', 38, '烘焙甜品'),
  createMockProduct('p32', '无糖气泡水', 8, '330ml', 120, '零售商品'),
  createMockProduct('p33', '冷萃咖啡液', 28, '250ml', 0, '零售商品'),
  createMockProduct('p34', '坚果能量棒', 12, '45g', 16, '零售商品'),
  createMockProduct('p35', '挂耳咖啡礼盒', 68, '10袋装', 75, '零售商品'),
  createMockProduct('p36', '门店限定保温杯', 99, '500ml', 9, '零售商品'),
  createMockProduct('p37', '珍珠加料', 2, '单份', 40, '加料', [{ text: '加料', color: 'blue' }]),
  createMockProduct('p38', '小芋圆加料', 3, '单份', 0, '加料', [{ text: '加料', color: 'blue' }]),
  createMockProduct('p39', '仙草冻加料', 2, '单份', 22, '加料', [{ text: '加料', color: 'blue' }]),
  createMockProduct('p40', '燕麦奶加料', 3, '单份', 55, '加料', [{ text: '加料', color: 'blue' }]),
];

const MOCK_DISPLAY_PRODUCTS = [
  { id: 'p1', name: '招牌红烧肉盖饭', price: 38.00, spec: '标准套餐', specialType: '套餐', stock: Infinity, category: '中式正餐', status: 'normal', tags: [{ text: '套餐', color: 'green' }], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'normal', mini_pickup: 'normal', meituan: 'normal', taobao: 'normal' }, channelStocks: { pos: Infinity, mini_dine: Infinity, mini_take: Infinity, mini_pickup: Infinity, meituan: Infinity, taobao: Infinity } },
  { id: 'p2', name: '香煎三文鱼', price: 0.58, spec: '默认规格', specialType: '称重', stock: Infinity, category: '西式快餐', status: 'normal', tags: [{ text: '称重', color: 'blue' }], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'sold_out', mini_pickup: 'sold_out', meituan: 'sold_out', taobao: 'sold_out' }, channelStocks: { pos: Infinity, mini_dine: Infinity, mini_take: 0, mini_pickup: 0, meituan: 0, taobao: 0 }, channelTypes: { mini_take: '当日', mini_pickup: '当日', meituan: '当日', taobao: '当日' } },
  { id: 'p3', name: '生椰拿铁', price: 18.00, spec: '多规格', stock: 15, category: '现制饮品', status: 'sold_out', tags: [], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'sold_out', mini_pickup: 'normal', meituan: 'sold_out', taobao: 'normal' }, channelStocks: { pos: 15, mini_dine: 15, mini_take: 0, mini_pickup: 15, meituan: 0, taobao: 5 }, hasMultipleSpecs: true, specs: [{id: 's1', name: '大杯', stock: 10}, {id: 's2', name: '中杯', stock: 5}, {id: 's3', name: '小杯', stock: 0}], channelTypes: { mini_take: '当日', meituan: '长期' } },
  { id: 'p4', name: '老火例汤', price: 12.00, spec: '标准份', specialType: '按餐段', stock: Infinity, category: '中式正餐', status: 'normal', tags: [{ text: '按餐段', color: 'orange' }], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'normal', mini_pickup: 'normal', meituan: 'normal', taobao: 'normal' }, channelStocks: { pos: Infinity, mini_dine: Infinity, mini_take: Infinity, mini_pickup: Infinity, meituan: Infinity, taobao: Infinity } },
  { id: 'p5', name: '麻辣小龙虾', price: 128.00, spec: '大份/约500g', stock: Infinity, category: '中式正餐', status: 'normal', tags: [], channels: { pos: 'normal', mini_dine: 'normal', mini_take: 'normal', mini_pickup: 'normal', meituan: 'sold_out', taobao: 'normal' }, channelStocks: { pos: Infinity, mini_dine: Infinity, mini_take: Infinity, mini_pickup: Infinity, meituan: 0, taobao: Infinity }, channelTypes: { meituan: '当日' } },
  { id: 'p6', name: '手打柠檬茶', price: 18.00, spec: '多规格', stock: 0, category: '现制饮品', status: 'sold_out', tags: [], channels: { pos: 'sold_out', mini_dine: 'sold_out', mini_take: 'sold_out', mini_pickup: 'sold_out', meituan: 'sold_out', taobao: 'sold_out' }, channelStocks: { pos: 0, mini_dine: 0, mini_take: 0, mini_pickup: 0, meituan: 0, taobao: 0 }, hasMultipleSpecs: true, specs: [{id: 's4', name: '标准', stock: 0}], channelTypes: { pos: '长期', mini_dine: '长期', mini_take: '长期', mini_pickup: '长期', meituan: '长期', taobao: '长期' } },
  { id: 'p41', name: '美团限定香辣鸡排', price: 26.00, spec: '单份', stock: 32, category: '西式快餐', status: 'normal', tags: [{ text: '渠道限定', color: 'blue' }], channels: { pos: 'unmapped', mini_dine: 'unmapped', mini_take: 'unmapped', mini_pickup: 'unmapped', meituan: 'normal', taobao: 'normal' }, channelStocks: { meituan: 22, taobao: 10 }, channelTypes: {} },
  ...ADDITIONAL_MOCK_PRODUCTS,
];

const MOCK_LEFT_LOGS = [
  // 场景1：部分渠道售罄（混合模式：美团长期沽清，小程序当日沽清）
  { id: 'l1', name: '生椰拿铁', price: 18.00, spec: '大杯', stock: 5, status: 'warning', tags: [], type: 'mixed', time: '10:30', rank: 1, channels: { pos: 'normal', mini_take: 'sold_out', meituan: 'sold_out', taobao: 'normal' }, channelStocks: { pos: 3, mini_take: 0, meituan: 0, taobao: 2 }, channelTypes: { mini_take: '当日', meituan: '长期' }, hasMultipleSpecs: true, specs: [{id: 's1', name: '大杯', stock: 3}, {id: 's2', name: '中杯', stock: 0}, {id: 's3', name: '小杯', stock: 0}] },
  
  // 场景2：全渠道彻底售罄
  { id: 'l2', name: '多肉葡萄冻冻', price: 15.00, spec: '标准', stock: 0, status: 'sold_out', tags: [], type: '长期沽清', time: '11:15', rank: 2, channels: { pos: 'sold_out', mini_take: 'sold_out', meituan: 'sold_out', taobao: 'sold_out' }, channelStocks: { pos: 0, mini_take: 0, meituan: 0, taobao: 0 }, channelTypes: { pos: '长期', mini_take: '长期', meituan: '长期', taobao: '长期' } },
  
  // 场景3：各渠道库存不同，但都没有售罄（低库存预警）
  { id: 'l3', name: '招牌红烧肉盖饭', price: 38.00, spec: '标准', stock: 25, status: 'warning', tags: [], type: '当日沽清', time: '09:00', rank: 3, channels: { pos: 'normal', mini_take: 'normal', meituan: 'normal', taobao: 'normal' }, channelStocks: { pos: 10, mini_take: 5, meituan: 8, taobao: 2 }, channelTypes: { pos: '当日', mini_take: '当日', meituan: '当日', taobao: '当日' } },
  
  // 场景4：全渠道库存完全一致的低库存
  { id: 'l4', name: '老火例汤', price: 12.00, spec: '按餐段', stock: 8, status: 'warning', tags: [], type: '长期沽清', time: '14:20', rank: 4, channels: { pos: 'normal', mini_take: 'normal', meituan: 'normal' }, channelStocks: { pos: 8, mini_take: 8, meituan: 8 }, channelTypes: { pos: '长期', mini_take: '长期', meituan: '长期' } },
  
  // 场景5：单渠道特殊沽清（仅美团沽清）
  { id: 'l5', name: '麻辣小龙虾', price: 128.00, spec: '大份/约500g', stock: 15, status: 'warning', tags: [], type: 'mixed', time: '15:00', rank: 5, channels: { pos: 'normal', mini_take: 'normal', meituan: 'sold_out' }, channelStocks: { pos: 15, mini_take: 5, meituan: 0 }, channelTypes: { meituan: '当日' } },
  
  // 场景6：分组隔离示例（仅外卖渠道沽清）
  { id: 'l6', name: '香煎三文鱼', price: 0.58, spec: '称重', stock: 1200, status: 'warning', tags: [], type: 'mixed', time: '16:00', rank: 6, channels: { pos: 'normal', mini_take: 'sold_out', meituan: 'sold_out' }, channelStocks: { pos: 1200, mini_take: 0, meituan: 0 }, channelTypes: { mini_take: '当日', meituan: '当日' } },
  ...ADDITIONAL_MOCK_PRODUCTS.filter(item => item.stock < 30).map((item, index) => ({
    ...item,
    id: `l${index + 7}`,
    type: item.stock <= 0 ? '长期沽清' : '当日沽清',
    time: `${String(9 + (index % 10)).padStart(2, '0')}:${index % 2 ? '45' : '20'}`,
    rank: index + 7,
    channelTypes: Object.fromEntries(CHANNEL_TABS.map(channelItem => [channelItem.id, item.stock <= 0 ? '长期' : '当日'])),
  })),
];


export const PosStockoutView: React.FC<{ showImage: boolean; search: string; onReset: () => void; channel: ChannelType; onChannelChange: (channel: ChannelType) => void }> = ({ showImage, search, onReset, channel, onChannelChange }) => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = brandConfigs[activeBrandId];
  const shared = config?.features.stock_shared ?? true;
  const displayMode = config?.posStockoutMode ?? 'spu';
  const threshold = config?.posStockoutWarningThreshold ?? 30;
  const [products, setProducts] = useState<any[]>(MOCK_DISPLAY_PRODUCTS);
  const [logs, setLogs] = useState<any[]>(MOCK_LEFT_LOGS);
  const [category, setCategory] = useState('全部');
  const [filter, setFilter] = useState<'all' | 'sold' | 'low' | 'long'>('all');
  const [batch, setBatch] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<any>(null);
  const [batchTargets, setBatchTargets] = useState<any[] | null>(null);
  const [recovery, setRecovery] = useState<any[] | null>(null);
  const [result, setResult] = useState('');
  const [recoveryChannels, setRecoveryChannels] = useState<string[]>([]);
  const [crossChannelChoice, setCrossChannelChoice] = useState<{ item: any; channels: ChannelType[] } | null>(null);
  const [locatedProductId, setLocatedProductId] = useState('');
  useEffect(() => {
    if (recovery) setRecoveryChannels(shared || channel === 'all' ? CHANNEL_TABS.map(item => item.id) : [channel]);
  }, [recovery, shared, channel]);
  const stock = (item: any): number => shared || channel === 'all' ? item.stock : item.channelStocks?.[channel] ?? item.stock;
  const channelStocks = (item: any) => CHANNEL_TABS.map(itemChannel => item.channelStocks?.[itemChannel.id]).filter((value): value is number => typeof value === 'number');
  const isSold = (item: any) => {
    if (shared || channel !== 'all') return stock(item) <= 0;
    const stocks = channelStocks(item);
    return stocks.length ? stocks.every(value => value <= 0) : item.stock <= 0;
  };
  const clearanceTypes = (item: any): string[] => {
    if (shared) return item.type ? [item.type] : [];
    if (channel !== 'all') return item.channelTypes?.[channel] ? [item.channelTypes[channel]] : [];
    return CHANNEL_TABS.map(itemChannel => item.channelTypes?.[itemChannel.id]).filter(Boolean);
  };
  const isLongClearance = (item: any) => clearanceTypes(item).some(type => String(type).includes('长期'));
  const isLowStock = (item: any) => !isSold(item) && stock(item) > 0 && stock(item) < threshold;
  const match = (item: any) => item.name.toLowerCase().includes(search.trim().toLowerCase());
  const matchesCategory = (item: any) => category === '全部' || (category === '加料' ? item.tags?.some((tag: any) => tag.text === '加料') : item.category === category);
  const searching = !!search.trim();
  const mappedChannelIds = (item: any): ChannelType[] => CHANNEL_TABS.filter(itemChannel => item.channels?.[itemChannel.id] && item.channels[itemChannel.id] !== 'unmapped').map(itemChannel => itemChannel.id);
  const isMappedToCurrentChannel = (item: any) => shared || channel === 'all' || mappedChannelIds(item).includes(channel);
  const scoped = products.filter(item => isMappedToCurrentChannel(item) && match(item) && (searching || matchesCategory(item)));
  const matched = displayMode === 'sku' ? scoped.flatMap(item => item.hasMultipleSpecs ? item.specs.map((sku: any) => ({ ...item, id: item.id + '_' + sku.id, parentId: item.id, skuId: sku.id, spec: sku.name, stock: sku.stock, channelStocks: sku.channelStocks || Object.fromEntries(CHANNEL_TABS.map(channel => [channel.id, sku.stock])), hasMultipleSpecs: false, specs: undefined })) : [item]) : scoped;
  const visible = matched.filter(item => filter === 'all' || filter === 'sold' && isSold(item) || filter === 'low' && isLowStock(item) || filter === 'long' && isLongClearance(item));
  const otherChannelMatches = !shared && searching ? products.filter(item => match(item) && !isMappedToCurrentChannel(item) && mappedChannelIds(item).some(itemChannel => itemChannel !== channel)) : [];
  useEffect(() => { setSelection(new Set()); setBatch(false); }, [search, category, filter, channel, displayMode]);
  useEffect(() => { if (searching) setCategory('全部'); }, [searching]);
  useEffect(() => {
    if (!locatedProductId) return;
    const timer = window.setTimeout(() => setLocatedProductId(''), 2600);
    return () => window.clearTimeout(timer);
  }, [locatedProductId, channel]);
  const openCrossChannel = (item: any) => {
    const channels = mappedChannelIds(item).filter(itemChannel => itemChannel !== channel);
    if (channels.length === 1) {
      setLocatedProductId(item.id);
      onChannelChange(channels[0]);
      return;
    }
    setCrossChannelChoice({ item, channels });
  };
  const chooseCrossChannel = (target: ChannelType) => {
    if (!crossChannelChoice) return;
    setLocatedProductId(crossChannelChoice.item.id);
    onChannelChange(target);
    setCrossChannelChoice(null);
  };
  const openEditor = (item: any) => setEditing({ ...item, stock: stock(item), status: isSold(item) ? 'sold_out' : item.status, specs: item.specs?.map((sku: any) => ({ ...sku, stock: stock(sku) })) });
  const exit = () => { setBatch(false); setSelection(new Set()); };
  const click = (item: any) => {
    if (!batch) { openEditor(item); return; }
    setSelection(prev => { const next = new Set(prev); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; });
  };
  const apply = (update: ClearanceUpdate, targets: any[]) => {
    const updateItem = (item: any) => {
      const itemTargets = targets.filter(target => target.id === item.id || target.parentId === item.id || target.name === item.name);
      if (!itemTargets.length) return item;
      const selectedSkuIds = new Set(itemTargets.map(target => target.skuId).filter(Boolean));
      const channels = shared ? CHANNEL_TABS.map(item => item.id) : update.channels;
      const quantity = update.recover ? Infinity : Number(update.method === 'day' ? update.values.dayRemain || 0 : update.values.longLimit || 0);
      const patchSpec = (spec: any) => {
        if (selectedSkuIds.size && !selectedSkuIds.has(spec.id)) return spec;
        if (!update.recover && update.mode === 'sku' && !update.selectedSpecs.includes(spec.id)) return spec;
        const values = update.mode === 'sku' ? update.specValues[spec.id] || update.values : update.values;
        const qty = update.recover ? Infinity : Number(update.method === 'day' ? values.dayRemain || 0 : values.longLimit || 0);
        return { ...spec, stock: shared ? qty : spec.stock, channelStocks: { ...spec.channelStocks, ...Object.fromEntries(channels.map(id => [id, qty])) } };
      };
      const specs = item.specs?.map(patchSpec);
      const totalFor = (id?: string) => specs ? specs.reduce((sum: number, spec: any) => sum + (id ? spec.channelStocks?.[id] ?? spec.stock : spec.stock), 0) : quantity;
      const nextStock = shared ? totalFor() : item.stock;
      return { ...item, specs, stock: nextStock, maxStock: update.method === 'day' ? update.values.dayNextLimit === '' ? undefined : Number(update.values.dayNextLimit) : item.maxStock, status: shared ? nextStock <= 0 ? 'sold_out' : 'normal' : item.status, channelStocks: { ...item.channelStocks, ...Object.fromEntries(channels.map(id => [id, totalFor(id)])) }, channels: { ...item.channels, ...Object.fromEntries(channels.map(id => [id, totalFor(id) <= 0 ? 'sold_out' : 'normal'])) }, type: update.recover ? '' : update.method === 'day' ? '当日沽清' : '长期沽清', channelTypes: { ...item.channelTypes, ...Object.fromEntries(channels.map(id => [id, update.recover ? '' : update.method === 'day' ? '当日' : '长期'])) } };
    };
    setProducts(prev => prev.map(updateItem));
    setLogs(prev => {
      const next = prev.map(updateItem);
      targets.forEach(target => { if (!next.some(item => item.name === target.name)) next.push(updateItem(target)); });
      return next;
    });
    setResult(targets.length + ' 项商品' + (update.recover ? '已恢复无限库存' : '沽清设置已更新') + ' · ' + (shared ? '全部关联渠道' : update.channels.map(id => CHANNEL_TABS.find(item => item.id === id)?.label).join('、')));
    setEditing(null); setBatchTargets(null); setRecovery(null); exit();
  };
  const chosen = visible.filter(item => selection.has(item.id));
  return <div className="pos-view">
    <PosResult message={result} onClose={() => setResult('')} />
      <div className="pos-view"><PosCategories items={['全部', '加料', ...CATEGORIES.slice(1)]} value={category} onChange={setCategory} />
        <div className="pos-grid-scroll" key={category + filter + search + channel}><div className="pos-grid" data-status-view={filter !== 'all'}>{visible.map(item => {
          const qty = stock(item);
          const specsPartial = item.hasMultipleSpecs && item.specs?.some((sku: any) => stock(sku) <= 0) && item.specs?.some((sku: any) => stock(sku) > 0);
          const stocks = channel === 'all' && !shared ? channelStocks(item) : [];
          const channelsPartial = stocks.some(value => value <= 0) && stocks.some(value => value > 0);
          const partial = specsPartial || channelsPartial;
          const types = clearanceTypes(item);
          const clearanceType = types.some(type => String(type).includes('长期')) ? '长期沽清' : types.some(Boolean) ? '当日沽清' : '';
          const sold = isSold(item);
          const badge = sold ? (isLongClearance(item) ? '长期沽清' : '当日沽清') : partial ? '部分售罄' : null;
          const specialTags = [...new Set([item.specialType, ...(item.tags || []).map((tag: any) => tag.text)].filter(Boolean))];
          return <button key={item.id} data-product-id={item.parentId || item.id} className={'pos-card' + (sold ? ' is-disabled' : '') + (batch && selection.has(item.id) ? ' is-selected' : '') + (locatedProductId === (item.parentId || item.id) ? ' is-located' : '')} aria-label={item.name + ' · ' + (sold ? '已售罄' : qty === Infinity ? '无限库存' : '剩余 ' + qty)} aria-pressed={batch ? selection.has(item.id) : undefined} onClick={() => click(item)}>
            {showImage && <span className="pos-image-placeholder"><Image size={26} /></span>}
            <div className="pos-card-heading"><h3>{item.name}</h3>{batch ? <PosSelection selected={selection.has(item.id)} /> : badge && <span className={'pos-tag ' + (badge === '长期沽清' ? 'long' : badge === '部分售罄' ? 'warning' : 'danger')}>{badge}</span>}</div>
            {displayMode === 'sku' ? <div className="pos-card-meta"><span className="pos-card-spec">{item.spec || '默认规格'}</span>{specialTags.map(tag => <span key={tag} className="pos-special-tag">{tag}</span>)}</div> : filter === 'long' && clearanceType ? <div className="pos-card-meta"><span className="pos-tag long">{clearanceType}</span></div> : null}
            <div className="pos-card-footer">{qty !== Infinity && <span className={'pos-state' + (sold ? ' danger' : isLowStock(item) ? ' warning' : '')}>{sold ? '已售罄' : '剩余 ' + qty}</span>}{sold && !batch ? <span className="pos-recover" onClick={event => { event.stopPropagation(); setRecovery([item]); }}><RotateCcw size={14} />恢复售卖</span> : <span className="pos-card-price"><small>¥</small>{item.price}</span>}</div>
          </button>;
        })}</div>
          {!visible.length && !!otherChannelMatches.length && <div className="pos-current-channel-empty"><strong>当前渠道没有这个商品</strong><span>已在门店其他渠道找到结果，可直接切换后操作。</span></div>}
          {!!otherChannelMatches.length && <section className="pos-other-results" aria-label="其他渠道搜索结果">
            <header><div><strong>其他渠道找到 {otherChannelMatches.length} 个商品</strong><span>当前「{CHANNEL_TABS.find(item => item.id === channel)?.label}」没有这些商品</span></div><em>门店全部渠道搜索</em></header>
            <div className="pos-other-result-list">{otherChannelMatches.map(item => {
              const channels = mappedChannelIds(item).filter(itemChannel => itemChannel !== channel);
              const labels = channels.map(itemChannel => CHANNEL_TABS.find(tab => tab.id === itemChannel)?.label).filter(Boolean);
              const description = displayMode === 'sku' ? item.hasMultipleSpecs ? `${item.specs.length} 个规格` : item.spec || '默认规格' : item.category;
              return <button key={item.id} className="pos-other-result" onClick={() => openCrossChannel(item)}><span className="pos-other-result-main"><strong>{item.name}</strong><small>{description}</small></span><span className="pos-other-result-channel">可在 {labels.join('、')}</span><ChevronRight size={19} /></button>;
            })}</div>
          </section>}
          {!visible.length && !otherChannelMatches.length && <PosEmpty filtered={!!search || category !== '全部' || filter !== 'all'} onReset={() => { onReset(); setCategory('全部'); setFilter('all'); }} />}
        </div>
        <PosDock batch={batch} count={selection.size} allSelected={!!visible.length && visible.every(item => selection.has(item.id))} onSelectAll={() => setSelection(selection.size === visible.length ? new Set() : new Set(visible.map(item => item.id)))} onBatch={() => setBatch(true)} onExit={exit} filters={<PosStatusFilters value={filter} onChange={value => setFilter(value as 'all' | 'sold' | 'low' | 'long')} options={[{ id: 'all', label: '全部', count: matched.length }, { id: 'sold', label: '已沽清', count: matched.filter(isSold).length, tone: 'danger' }, { id: 'low', label: '低库存', count: matched.filter(isLowStock).length, tone: 'warning' }, { id: 'long', label: '长期沽清', count: matched.filter(isLongClearance).length, tone: 'long' }]} />}><button className="pos-button danger" disabled={!selection.size} onClick={() => setBatchTargets(chosen)}>批量沽清</button><button className="pos-button secondary" disabled={!selection.size} onClick={() => setRecovery(chosen)}>恢复库存</button></PosDock>
      </div>
    {(editing || batchTargets) && <ClearanceSettingsModal product={editing} batchIds={batchTargets?.map(item => item.id)} isBatch={!!batchTargets} onClose={() => { setEditing(null); setBatchTargets(null); }} onConfirm={update => apply(update, batchTargets || [editing])} activeChannel={shared ? 'all' : channel} />}
    {recovery && <PosDialog title="确认恢复无限库存？" onClose={() => setRecovery(null)} footer={<><button className="pos-button quiet" onClick={() => setRecovery(null)}>取消</button><button className="pos-button" disabled={!recoveryChannels.length} onClick={() => apply({ recover: true, method: 'day', mode: 'spu', values: { dayRemain: '0', dayNextLimit: '', longLimit: '0' }, specValues: {}, selectedSpecs: [], channels: recoveryChannels }, recovery)}>确认恢复</button></>}><h3>{recovery.map(item => item.name).join('、')}</h3><p>{POS_STORE_NAME} · {shared ? '全部关联渠道' : recoveryChannels.map(id => CHANNEL_TABS.find(item => item.id === id)?.label).join('、') || '请选择渠道'}</p><p>确认后立即取消沽清并恢复为无限库存，商品可继续售卖。需要限制售卖数量时，可重新设置沽清。</p>{!shared && <div className="pos-channel-options"><p>生效渠道（当前渠道必须保留，可追加其他渠道）</p>{config?.enableChannelGrouping && config.channelGroups?.map(group => <button key={group.id} className="pos-button secondary" onClick={() => { const ids = group.channels.filter(id => CHANNEL_TABS.some(item => item.id === id)); setRecoveryChannels(prev => ids.every(id => prev.includes(id)) ? prev.filter(id => !ids.includes(id) || id === channel) : [...new Set([...prev, ...ids])]); }}>{group.name}</button>)}<div className="flex flex-wrap gap-2 mt-3">{CHANNEL_TABS.map(item => <button key={item.id} disabled={item.id === channel} className={'pos-button ' + (recoveryChannels.includes(item.id) ? 'secondary' : 'quiet')} aria-pressed={recoveryChannels.includes(item.id)} onClick={() => setRecoveryChannels(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}>{item.label}{item.id === channel ? ' · 当前' : ''}</button>)}</div></div>}</PosDialog>}
    {crossChannelChoice && <PosDialog title="选择要切换的渠道" onClose={() => setCrossChannelChoice(null)}><div className="pos-channel-choice-intro"><strong>{crossChannelChoice.item.name}</strong><span>该商品不在当前渠道，请选择一个有此商品的渠道。</span></div><div className="pos-channel-choice-list">{crossChannelChoice.channels.map(itemChannel => { const qty = crossChannelChoice.item.channelStocks?.[itemChannel]; return <button key={itemChannel} onClick={() => chooseCrossChannel(itemChannel)}><span><strong>{CHANNEL_TABS.find(tab => tab.id === itemChannel)?.label}</strong><small>{typeof qty === 'number' ? qty <= 0 ? '已沽清' : '剩余 ' + qty : '可售'}</small></span><ChevronRight size={20} /></button>; })}</div></PosDialog>}
  </div>;
};
