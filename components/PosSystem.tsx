import React, { useEffect, useState } from 'react';
import { Monitor, ClipboardList, Settings, ShoppingBag, Search, X, RefreshCw, Printer, Wifi, HelpCircle, Volume2, Layers } from 'lucide-react';
import { useProducts } from '../context';
import { PosShelfView } from './pos/PosShelfView';
import { PosStockoutView } from './pos/PosStockoutView';
import { PosMethodView } from './pos/PosMethodView';
import { PosSettingsView } from './pos/PosSettingsView';
import { PosDialog } from './pos/PosWorkspace';
import { CHANNEL_TABS, ChannelType } from './pos/PosCommon';
import './pos/pos.css';

type SubTab = 'stockout' | 'method' | 'shelf' | 'item';
export const PosSystem: React.FC = () => {
  const { activeBrandId, brandConfigs } = useProducts();
  const config = brandConfigs[activeBrandId];
  const stockShared = config?.features.stock_shared ?? true;
  const shelfUnited = config?.features.shelves_unite ?? true;
  const [module, setModule] = useState<'product' | 'settings'>('product');
  const [tab, setTab] = useState<SubTab>(() => {
    const value = new URLSearchParams(window.location.search).get('posTab');
    return value === 'method' || value === 'shelf' || value === 'item' ? value : 'stockout';
  });
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<ChannelType>('pos');
  const [shelfChannel, setShelfChannel] = useState<ChannelType>('pos');
  const [showImage, setShowImage] = useState(() => localStorage.getItem('pos_local_showImage') === 'true');
  const [guideOpen, setGuideOpen] = useState(false);
  const searchesStoreLibrary = module === 'product' && (tab === 'stockout' && !stockShared || tab === 'shelf' && !shelfUnited);
  useEffect(() => { setChannel(stockShared ? 'all' : current => current === 'all' ? 'pos' : current); }, [stockShared]);
  useEffect(() => { setShelfChannel(shelfUnited ? 'all' : current => current === 'all' ? 'pos' : current); }, [shelfUnited]);
  const tabs: { id: SubTab; label: string }[] = [{ id: 'stockout', label: '商品沽清' }, { id: 'method', label: '做法管理' }, { id: 'shelf', label: '商品上下架' }, { id: 'item', label: '品项沽清' }];
  return <div className="pos-system">
    <aside className="pos-rail" aria-label="POS 主导航">
      <div className="pos-brand">小丽</div>
      <button className="pos-rail-button" disabled title="当前原型未接入点单模块"><Monitor size={25} /><span>点单</span></button>
      <button className="pos-rail-button" disabled title="当前原型未接入订单模块"><ClipboardList size={25} /><span>订单</span></button>
      <button className="pos-rail-button" disabled title="当前原型未接入取餐模块"><Volume2 size={25} /><span>取餐</span></button>
      <button className={'pos-rail-button' + (module === 'settings' ? ' active' : '')} onClick={() => setModule('settings')}><Settings size={25} /><span>设置</span></button>
      <button className={'pos-rail-button' + (module === 'product' ? ' active' : '')} onClick={() => setModule('product')}><ShoppingBag size={25} /><span>商品</span></button>
    </aside>
    <main className="pos-main">
      <header className="pos-header">
        {module === 'product' ? <nav className="pos-tabs" aria-label="商品管理功能">{tabs.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} aria-pressed={tab === item.id} onClick={() => { setTab(item.id); setSearch(''); setGuideOpen(false); }}>{item.label}</button>)}</nav> : <h1 className="text-xl font-bold">系统设置</h1>}
        {module === 'product' && tab === 'stockout' && (stockShared ? <div className="pos-header-scope"><Layers size={17} /><span>全渠道统一库存</span></div> : <label className="pos-channel-select"><span>渠道</span><select aria-label="商品沽清当前渠道" value={channel} onChange={event => setChannel(event.target.value as ChannelType)}>{CHANNEL_TABS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>)}
        {module === 'product' && tab === 'shelf' && (shelfUnited ? <div className="pos-header-scope"><Layers size={17} /><span>全渠道统一上下架</span></div> : <label className="pos-channel-select"><span>渠道</span><select aria-label="商品上下架当前渠道" value={shelfChannel} onChange={event => setShelfChannel(event.target.value as ChannelType)}>{CHANNEL_TABS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>)}
        {module === 'product' && tab !== 'item' && <label className="pos-search"><Search size={18} /><input aria-label={tab === 'method' ? '搜索做法' : '搜索商品'} placeholder={tab === 'method' ? '搜索做法名 / 首字母 / 标识码' : searchesStoreLibrary ? '搜索门店全部渠道商品 / 扫码' : '搜索商品名 / 首字母 / 扫码'} value={search} onChange={event => setSearch(event.target.value)} />{search && <button aria-label="清除搜索" onClick={() => setSearch('')}><X size={16} /></button>}</label>}
        {module === 'product' && <div className="pos-header-tools">{tab === 'stockout' && <button className="pos-guide-button" onClick={() => setGuideOpen(true)}><HelpCircle size={17} />如何沽清</button>}<button className="pos-icon-button" aria-label="刷新商品" onClick={() => window.location.reload()}><RefreshCw size={18} /></button><span className="pos-icon-button" role="img" aria-label="打印机已连接"><Printer size={18} /></span><span className="pos-icon-button" role="img" aria-label="网络已连接"><Wifi size={18} /></span></div>}
      </header>
      <section className="pos-view" hidden={module !== 'settings'}><PosSettingsView showImage={showImage} setShowImage={value => { setShowImage(value); localStorage.setItem('pos_local_showImage', String(value)); }} /></section>
      <section className="pos-view" hidden={module !== 'product' || tab !== 'stockout'}><PosStockoutView showImage={showImage} search={search} onReset={() => setSearch('')} channel={channel} onChannelChange={setChannel} /></section>
      <section className="pos-view" hidden={module !== 'product' || tab !== 'shelf'}><PosShelfView showImage={showImage} search={search} onReset={() => setSearch('')} channel={shelfChannel} onChannelChange={setShelfChannel} /></section>
      <section className="pos-view" hidden={module !== 'product' || tab !== 'method'}><PosMethodView search={search} onReset={() => setSearch('')} /></section>
      <section className="pos-view" hidden={module !== 'product' || tab !== 'item'}><div className="pos-empty"><ShoppingBag size={36} /><h3>品项沽清</h3><p>当前原型尚未接入品项数据，此入口保留。</p><button className="pos-button secondary" onClick={() => setTab('stockout')}>返回商品沽清</button></div></section>
      {guideOpen && <PosDialog title="如何沽清商品" className="pos-guide-dialog" onClose={() => setGuideOpen(false)}>
        <section className="pos-guide-scene">
          <span className="pos-guide-label blue">场景一</span>
          <h3>今天不卖了<br />明天自动恢复</h3>
          <p>选择「当日沽清」，把<b>今日剩余</b>填 0；如需明日按固定份数开卖，在<b>次日补足</b>填数量。</p>
          <div className="pos-guide-inputs">
            <div className="active"><small>今日剩余</small><strong>0</strong></div>
            <div><small>次日补足</small><strong className="muted">20</strong></div>
          </div>
        </section>
        <section className="pos-guide-scene">
          <span className="pos-guide-label orange">场景二</span>
          <h3>无限期停售<br />补货后人工恢复</h3>
          <p>选择「长期沽清」，只需填<b>剩余可售数量</b>；卖完即停，不会自动恢复。</p>
          <div className="pos-guide-inputs single"><div className="warning"><small>剩余可售数量</small><strong>0</strong></div></div>
          <span className="pos-guide-tip">卡片显示「长期沽清」</span>
        </section>
        <section className="pos-guide-scene">
          <span className="pos-guide-label green">场景三</span>
          <h3>恢复正常售卖</h3>
          <p>在已沽清卡片上点<b>恢复售卖</b>，或在弹窗内点「取消沽清」。二次确认后恢复为无限库存。</p>
          <div className="pos-guide-product"><strong>生椰拿铁</strong><span>已沽清</span><button type="button">恢复售卖</button></div>
        </section>
      </PosDialog>}
    </main>
  </div>;
};
