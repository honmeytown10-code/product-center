import React, { useState, useEffect } from 'react';
import { ChevronRight, Image, RotateCcw } from 'lucide-react';
import { useProducts } from '../../context';
import { CHANNEL_TABS, ChannelTabType, ChannelType } from './PosCommon';
import { ShelfActionDialog } from './PosModals';
import { PosCategories, PosStatusFilters, PosDock, PosEmpty, PosResult, PosSelection, PosDialog } from './PosWorkspace';
const MOCK_SHELF_CATEGORIES = ["全部", "加料", "后台分类展示合集", "大雪花分类--小程序", "仅小程序分类", "测试分类A", "测试分类B"];
const RAW_SHELF_ITEMS = [
    { id: 'g1', name: '1121beta多规格商品-1', status: 'on_shelf', category: '后台分类展示合集' },
    { id: 'g2', name: '测试归档标品', status: 'on_shelf', category: '测试分类A' },
    { id: 'g3', name: '新建电商商城1', status: 'on_shelf', category: '仅小程序分类' },
    { id: 'g4', name: '大雪花', status: 'on_shelf', category: '大雪花分类--小程序' },
    { id: 'g5', name: '测试归档', status: 'off_shelf', category: '测试分类A' },
    { id: 'g6', name: '珍珠加料', status: 'on_shelf', category: '加料' },
    { id: 'g7', name: '1027标品-02', status: 'on_shelf', category: '后台分类展示合集' },
    { id: 'g8', name: '1110商品', status: 'on_shelf', category: '测试分类B' },
    { id: 'g9', name: '新建电商商城商品2', status: 'on_shelf', category: '仅小程序分类' },
    { id: 'g10', name: '0827beta单规格套餐-4', status: 'on_shelf', category: '后台分类展示合集' },
    { id: 'g11', name: '红烧排骨', status: 'off_shelf', category: '后台分类展示合集' },
    { id: 'g12', name: '清蒸鲈鱼', status: 'off_shelf', category: '测试分类A' },
    { id: 'g13', name: '麻婆豆腐', status: 'off_shelf', category: '测试分类B' },
    { id: 'g14', name: '宫保鸡丁', status: 'off_shelf', category: '后台分类展示合集' },
    { id: 'g15', name: '回锅肉', status: 'off_shelf', category: '仅小程序分类' },
    { id: 'g16', name: '番茄炒蛋', status: 'off_shelf', category: '测试分类A' },
    { id: 'g17', name: '招牌红烧肉盖饭', status: 'on_shelf', category: '后台分类展示合集' },
    { id: 'g18', name: '黑椒牛柳意面', status: 'on_shelf', category: '后台分类展示合集' },
    { id: 'g19', name: '经典香辣鸡腿堡', status: 'on_shelf', category: '仅小程序分类' },
    { id: 'g20', name: '港式冻柠茶', status: 'on_shelf', category: '大雪花分类--小程序' },
    { id: 'g21', name: '生椰拿铁', status: 'on_shelf', category: '大雪花分类--小程序' },
    { id: 'g22', name: '杨枝甘露', status: 'off_shelf', category: '大雪花分类--小程序' },
    { id: 'g23', name: '手打柠檬茶', status: 'on_shelf', category: '仅小程序分类' },
    { id: 'g24', name: '桂花乌龙奶茶', status: 'on_shelf', category: '仅小程序分类' },
    { id: 'g25', name: '香煎三文鱼', status: 'on_shelf', category: '测试分类A' },
    { id: 'g26', name: '蜜汁叉烧饭', status: 'off_shelf', category: '测试分类A' },
    { id: 'g27', name: '老火例汤', status: 'on_shelf', category: '测试分类B' },
    { id: 'g28', name: '麻辣小龙虾', status: 'on_shelf', category: '测试分类B' },
    { id: 'g29', name: '海盐芝士蛋糕', status: 'on_shelf', category: '后台分类展示合集' },
    { id: 'g30', name: '流心巴斯克', status: 'off_shelf', category: '后台分类展示合集' },
    { id: 'g31', name: '黄油可颂', status: 'on_shelf', category: '仅小程序分类' },
    { id: 'g32', name: '肉桂苹果卷', status: 'on_shelf', category: '仅小程序分类' },
    { id: 'g33', name: '椰果加料', status: 'on_shelf', category: '加料' },
    { id: 'g34', name: '仙草冻加料', status: 'on_shelf', category: '加料' },
    { id: 'g35', name: '小芋圆加料', status: 'off_shelf', category: '加料' },
    { id: 'g36', name: '厚乳加料', status: 'on_shelf', category: '加料' },
    { id: 'g37', name: '家庭分享套餐', status: 'on_shelf', category: '测试分类A' },
    { id: 'g38', name: '双人下午茶套餐', status: 'on_shelf', category: '测试分类B' },
    { id: 'g39', name: '儿童欢乐套餐', status: 'off_shelf', category: '后台分类展示合集' },
    { id: 'g40', name: '周末限定早午餐', status: 'on_shelf', category: '仅小程序分类' },
    { id: 'g41', name: '无糖气泡水', status: 'on_shelf', category: '大雪花分类--小程序' },
    { id: 'g42', name: '冷萃咖啡液', status: 'on_shelf', category: '测试分类A' },
    { id: 'g43', name: '坚果能量棒', status: 'off_shelf', category: '测试分类B' },
    { id: 'g44', name: '门店限定保温杯', status: 'on_shelf', category: '后台分类展示合集' },
    { id: 'g45', name: '美团限定香辣鸡排', status: 'on_shelf', category: '测试分类A' },
];

// Enrich mock data to have channel specific statuses for testing
const INITIAL_SHELF_ITEMS = RAW_SHELF_ITEMS.map((item, index) => ({
    ...item,
    channels: {
        pos: item.id === 'g45' || item.category.includes('小程序') ? 'unmapped' : item.status === 'off_shelf' && index % 4 === 0 ? 'on_shelf' : item.status,
        mini_dine: item.id === 'g45' ? 'unmapped' : item.status,
        mini_take: item.id === 'g45' ? 'unmapped' : item.status === 'on_shelf' && index % 6 === 0 ? 'off_shelf' : item.status,
        mini_pickup: item.id === 'g45' ? 'unmapped' : item.status,
        meituan: item.id === 'g45' ? 'on_shelf' : index % 5 === 4 ? 'unmapped' : item.status === 'off_shelf' && index % 2 === 0 ? 'on_shelf' : item.status === 'on_shelf' && index % 7 === 0 ? 'off_shelf' : item.status,
        taobao: item.id === 'g45' ? 'on_shelf' : index % 5 === 4 ? 'unmapped' : item.status === 'on_shelf' && index % 9 === 0 ? 'off_shelf' : item.status,
        meituan_dine: item.id === 'g45' ? 'unmapped' : item.status,
        douyin_dine: item.id === 'g45' ? 'unmapped' : item.status
    }
}));


export const PosShelfView: React.FC<{ showImage: boolean; search: string; onReset: () => void; channel: ChannelType; onChannelChange: (channel: ChannelType) => void; posOnlyProducts: boolean; posOnlyOperation: boolean }> = ({ showImage, search, onReset, channel, onChannelChange, posOnlyProducts, posOnlyOperation }) => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = brandConfigs[activeBrandId];
  const united = config?.features.shelves_unite ?? true;
  const [items, setItems] = useState(INITIAL_SHELF_ITEMS);
  const [category, setCategory] = useState('全部');
  const [filter, setFilter] = useState<'all' | 'off'>('all');
  const [batch, setBatch] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<{ items: typeof items; action: 'on' | 'off'; targetChannel: ChannelType; isAllView: boolean; visibleChannels?: string[]; batch: boolean } | null>(null);
  const [result, setResult] = useState('');
  const [crossChannelChoice, setCrossChannelChoice] = useState<{ item: typeof items[number]; channels: ChannelType[] } | null>(null);
  const [locatedProductId, setLocatedProductId] = useState('');
  const shelfState = (item: typeof items[number]): 'on' | 'partial' | 'off' | 'unmapped' => {
    if (united) return item.status === 'off_shelf' ? 'off' : 'on';
    if (channel !== 'all') {
      const status = item.channels[channel as ChannelTabType];
      return status === 'off_shelf' ? 'off' : status === 'on_shelf' ? 'on' : 'unmapped';
    }
    const statuses = CHANNEL_TABS.map(tab => item.channels[tab.id]).filter(status => status !== 'unmapped');
    if (!statuses.length) return 'unmapped';
    if (statuses.every(status => status === 'off_shelf')) return 'off';
    if (statuses.every(status => status === 'on_shelf')) return 'on';
    return 'partial';
  };
  const searching = !!search.trim();
  const mappedChannelIds = (item: typeof items[number]): ChannelType[] => CHANNEL_TABS.filter(tab => item.channels[tab.id] !== 'unmapped').map(tab => tab.id);
  const scopedItems = items.filter(item => !posOnlyProducts || item.channels.pos !== 'unmapped');
  const categories: string[] = ['全部', ...Array.from(new Set<string>(scopedItems.map(item => item.category)))];
  const matched = scopedItems.filter(item => shelfState(item) !== 'unmapped' && item.name.toLowerCase().includes(search.trim().toLowerCase()) && (searching || category === '全部' || item.category === category));
  const visible = matched.filter(item => filter === 'all' || shelfState(item) !== 'on');
  const otherChannelMatches = !posOnlyProducts && !united && searching ? items.filter(item => item.name.toLowerCase().includes(search.trim().toLowerCase()) && shelfState(item) === 'unmapped' && mappedChannelIds(item).some(itemChannel => itemChannel !== channel)) : [];
  useEffect(() => { setSelection(new Set()); }, [search, category, filter, channel]);
  useEffect(() => { if (searching) setCategory('全部'); }, [searching]);
  useEffect(() => {
    if (!locatedProductId) return;
    const timer = window.setTimeout(() => setLocatedProductId(''), 2600);
    return () => window.clearTimeout(timer);
  }, [locatedProductId, channel]);
  const openCrossChannel = (item: typeof items[number]) => {
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
  const exit = () => { setSelection(new Set()); setBatch(false); };
  const click = (item: typeof items[number]) => {
    if (!batch) { openAction([item], shelfState(item) === 'off' ? 'on' : 'off'); return; }
    setSelection(prev => { const next = new Set(prev); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; });
  };
  const openAction = (target: typeof items, action: 'on' | 'off') => setAction({ items: target, action, targetChannel: channel, isAllView: channel === 'all', visibleChannels: channel === 'all' ? undefined : [channel], batch });
  const apply = (updates: Record<string, 'on_shelf' | 'off_shelf'>) => {
    if (!action) return;
    const ids = new Set(action.items.map(item => item.id));
    setItems(prev => prev.map(item => {
      if (!ids.has(item.id)) return item;
      const channels = { ...item.channels };
      Object.entries(updates).forEach(([channel, status]) => { if (channels[channel] !== 'unmapped') channels[channel] = status; });
      const status = united ? Object.values(updates)[0] || item.status : Object.values(channels).filter(value => value !== 'unmapped').every(value => value === 'off_shelf') ? 'off_shelf' : 'on_shelf';
      return { ...item, status, channels };
    }));
    setResult('已' + (action.action === 'on' ? '上架' : '下架') + ' ' + ids.size + ' 个商品 · ' + (united ? '全部关联渠道' : Object.keys(updates).map(id => CHANNEL_TABS.find(channel => channel.id === id)?.label).join('、')));
    setAction(null); exit();
  };
  return <div className="pos-view">
    <PosResult message={result} onClose={() => setResult('')} />
      <div className="pos-view">
        <PosCategories items={posOnlyProducts ? categories : MOCK_SHELF_CATEGORIES} value={category} onChange={setCategory} />
        <div className="pos-grid-scroll" key={category + filter + search + channel}><div className="pos-grid" data-status-view={filter !== 'all'}>{visible.map(item => {
          const state = shelfState(item);
          return <button key={item.id} data-product-id={item.id} className={'pos-card' + (state === 'off' ? ' is-disabled' : '') + (batch && selection.has(item.id) ? ' is-selected' : '') + (locatedProductId === item.id ? ' is-located' : '')} aria-label={item.name + ' · ' + (state === 'off' ? '已下架' : state === 'partial' ? '部分下架' : '已上架')} aria-pressed={batch ? selection.has(item.id) : undefined} onClick={() => click(item)}>
            {showImage && <span className="pos-image-placeholder"><Image size={26} /></span>}
            <div className="pos-card-heading"><h3>{item.name}</h3>{batch ? <PosSelection selected={selection.has(item.id)} /> : state !== 'on' && <span className={'pos-tag ' + (state === 'off' ? 'danger' : 'warning')}>{state === 'off' ? '已下架' : '部分下架'}</span>}</div>
            <div className="pos-card-footer">{state === 'on' ? <span className="pos-state">正常售卖</span> : <span />}{state !== 'on' && !batch && <span className="pos-recover" onClick={event => { event.stopPropagation(); openAction([item], 'on'); }}><RotateCcw size={14} />上架</span>}</div>
          </button>;
        })}</div>
          {!visible.length && !!otherChannelMatches.length && <div className="pos-current-channel-empty"><strong>当前渠道没有这个商品</strong><span>已在门店其他渠道找到结果，可直接切换后操作。</span></div>}
          {!!otherChannelMatches.length && <section className="pos-other-results" aria-label="其他渠道搜索结果">
            <header><div><strong>其他渠道找到 {otherChannelMatches.length} 个商品</strong><span>当前「{CHANNEL_TABS.find(item => item.id === channel)?.label}」没有这些商品</span></div><em>门店全部渠道搜索</em></header>
            <div className="pos-other-result-list">{otherChannelMatches.map(item => {
              const channels = mappedChannelIds(item).filter(itemChannel => itemChannel !== channel);
              const labels = channels.map(itemChannel => CHANNEL_TABS.find(tab => tab.id === itemChannel)?.label).filter(Boolean);
              return <button key={item.id} className="pos-other-result" onClick={() => openCrossChannel(item)}><span className="pos-other-result-main"><strong>{item.name}</strong><small>{item.category}</small></span><span className="pos-other-result-channel">可在 {labels.join('、')}</span><ChevronRight size={19} /></button>;
            })}</div>
          </section>}
          {!visible.length && !otherChannelMatches.length && <PosEmpty filtered={!!search || category !== '全部' || filter !== 'all'} onReset={() => { onReset(); setCategory('全部'); setFilter('all'); }} />}
        </div>
        <PosDock batch={batch} count={selection.size} allSelected={!!visible.length && visible.every(item => selection.has(item.id))} onSelectAll={() => setSelection(selection.size === visible.length ? new Set() : new Set(visible.map(item => item.id)))} onBatch={() => setBatch(true)} onExit={exit} filters={<PosStatusFilters value={filter} onChange={value => setFilter(value as 'all' | 'off')} options={[{ id: 'all', label: '全部', count: matched.length }, { id: 'off', label: '已下架', count: matched.filter(item => shelfState(item) !== 'on').length, attention: true }]} />}><button className="pos-button secondary" disabled={!selection.size} onClick={() => openAction(visible.filter(item => selection.has(item.id)), 'on')}>批量上架</button><button className="pos-button danger" disabled={!selection.size} onClick={() => openAction(visible.filter(item => selection.has(item.id)), 'off')}>批量下架</button></PosDock>
      </div>
    {action && <ShelfActionDialog open data={action} onClose={() => setAction(null)} onConfirm={apply} isShelvesUnited={united} posOnlyOperation={posOnlyOperation} enableChannelGrouping={config?.enableChannelGrouping} channelGroups={config?.channelGroups} />}
    {crossChannelChoice && <PosDialog title="选择要切换的渠道" onClose={() => setCrossChannelChoice(null)}><div className="pos-channel-choice-intro"><strong>{crossChannelChoice.item.name}</strong><span>该商品不在当前渠道，请选择一个有此商品的渠道。</span></div><div className="pos-channel-choice-list">{crossChannelChoice.channels.map(itemChannel => { const status = crossChannelChoice.item.channels[itemChannel]; return <button key={itemChannel} onClick={() => chooseCrossChannel(itemChannel)}><span><strong>{CHANNEL_TABS.find(tab => tab.id === itemChannel)?.label}</strong><small>{status === 'off_shelf' ? '已下架' : '已上架'}</small></span><ChevronRight size={20} /></button>; })}</div></PosDialog>}
  </div>;
};
