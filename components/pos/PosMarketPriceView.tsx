import React, { useMemo, useState } from 'react';
import { Clock3, Delete, Image, RotateCcw } from 'lucide-react';
import { PosCategories, PosDialog, PosEmpty, PosResult, PosStatusFilters } from './PosWorkspace';

type MarketPriceItem = {
  id: string;
  name: string;
  category: string;
  unit?: string;
  standardPrice: number;
  price: number;
  updatedAt: string;
};

const INITIAL_ITEMS: MarketPriceItem[] = [
  { id: 'mp1', name: '帝王蟹', category: '海鲜河鲜', unit: '斤', standardPrice: 328, price: 358, updatedAt: '今天 10:26' },
  { id: 'mp2', name: '梭子蟹', category: '海鲜河鲜', unit: '斤', standardPrice: 98, price: 88, updatedAt: '今天 09:42' },
  { id: 'mp3', name: '蓝鳍金枪鱼刺身', category: '海鲜河鲜', standardPrice: 168, price: 168, updatedAt: '使用标准价' },
  { id: 'mp4', name: '鲜活鲍鱼', category: '海鲜河鲜', unit: '只', standardPrice: 28, price: 32, updatedAt: '昨天 18:10' },
  { id: 'mp5', name: '波士顿龙虾', category: '鲜活水产', unit: '只', standardPrice: 168, price: 188, updatedAt: '今天 11:08' },
  { id: 'mp6', name: '澳洲龙虾', category: '鲜活水产', unit: '斤', standardPrice: 488, price: 528, updatedAt: '今天 10:51' },
  { id: 'mp7', name: '东星斑', category: '鲜活水产', unit: '斤', standardPrice: 238, price: 268, updatedAt: '今天 08:35' },
  { id: 'mp8', name: '多宝鱼', category: '鲜活水产', unit: '斤', standardPrice: 88, price: 88, updatedAt: '使用标准价' },
  { id: 'mp9', name: '清蒸石斑鱼', category: '鲜活水产', unit: '斤', standardPrice: 128, price: 138, updatedAt: '昨天 16:24' },
  { id: 'mp10', name: '鲜活皮皮虾', category: '鲜活水产', unit: '斤', standardPrice: 78, price: 78, updatedAt: '使用标准价' },
  { id: 'mp11', name: '春笋', category: '时令蔬菜', standardPrice: 38, price: 42, updatedAt: '今天 09:06' },
  { id: 'mp12', name: '香椿炒鸡蛋', category: '时令蔬菜', unit: '份', standardPrice: 48, price: 52, updatedAt: '今天 09:12' },
  { id: 'mp13', name: '清炒菜心', category: '时令蔬菜', unit: '份', standardPrice: 32, price: 32, updatedAt: '使用标准价' },
  { id: 'mp14', name: '鲜松茸', category: '时令蔬菜', unit: '份', standardPrice: 88, price: 98, updatedAt: '昨天 20:18' },
  { id: 'mp15', name: '竹荪炖汤', category: '时令蔬菜', unit: '份', standardPrice: 68, price: 68, updatedAt: '使用标准价' },
  { id: 'mp16', name: '黑猪五花肉', category: '肉禽', unit: '份', standardPrice: 58, price: 62, updatedAt: '今天 10:02' },
  { id: 'mp17', name: '黄牛肉', category: '肉禽', unit: '份', standardPrice: 78, price: 82, updatedAt: '今天 10:04' },
  { id: 'mp18', name: '法式羊排', category: '肉禽', standardPrice: 118, price: 118, updatedAt: '使用标准价' },
  { id: 'mp19', name: '清远鸡', category: '肉禽', unit: '只', standardPrice: 128, price: 138, updatedAt: '昨天 19:46' },
  { id: 'mp20', name: '散养乳鸽', category: '肉禽', unit: '只', standardPrice: 58, price: 58, updatedAt: '使用标准价' }
];

const formatPrice = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

function MarketPriceDialog({ item, onClose, onConfirm }: { item: MarketPriceItem; onClose: () => void; onConfirm: (price: number) => void }) {
  const [value, setValue] = useState(formatPrice(item.price));
  const parsed = Number(value);
  const valid = /^\d{1,5}(\.\d{0,2})?$/.test(value) && parsed > 0 && parsed <= 99999.99;
  const changed = valid && parsed !== item.price;
  const append = (key: string) => setValue(previous => {
    if (key === '.') return previous.includes('.') ? previous : `${previous || '0'}.`;
    const next = previous === '0' ? key : `${previous}${key}`;
    return next.length <= 8 ? next : previous;
  });
  const unitSuffix = item.unit ? ` / ${item.unit}` : '';
  return <PosDialog title="修改时价" className="pos-market-price-dialog" onClose={onClose} footer={<>
    <button className="pos-button quiet" onClick={onClose}>取消</button>
    <button className="pos-button" disabled={!changed} onClick={() => onConfirm(parsed)}>确认改价</button>
  </>}>
    <div className="pos-market-editor">
      <section className="pos-market-editor-main">
        <div className="pos-market-product-head"><div><strong>{item.name}</strong><span>当前门店 POS</span></div></div>
        <div className="pos-market-price-compare">
          <div><span>标准价格</span><strong>¥{formatPrice(item.standardPrice)}{item.unit && <small>{unitSuffix}</small>}</strong></div>
          <div><span>当前时价</span><strong>¥{formatPrice(item.price)}{item.unit && <small>{unitSuffix}</small>}</strong></div>
        </div>
        <div className="pos-market-new-price" data-invalid={!!value && !valid}>
          <span>新时价</span><div><b>¥</b><strong>{value || '0'}</strong>{item.unit && <small>/ {item.unit}</small>}</div>
        </div>
        {!valid && <p className="pos-market-error">请输入大于 0 且不超过 99999.99 的价格，最多保留两位小数。</p>}
        <button type="button" className="pos-market-restore" onClick={() => setValue(formatPrice(item.standardPrice))}><RotateCcw size={15} />恢复标准价</button>
      </section>
      <section className="pos-market-keypad" aria-label="数字键盘">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(key => <button key={key} type="button" onClick={() => append(String(key))}>{key}</button>)}
        <button type="button" aria-label="退格" onClick={() => setValue(previous => previous.slice(0, -1))}><Delete size={25} /></button>
        <button type="button" className="clear" onClick={() => setValue('')}>清空</button>
      </section>
    </div>
  </PosDialog>;
}

export const PosMarketPriceView: React.FC<{ showImage: boolean; search: string; onReset: () => void }> = ({ showImage, search, onReset }) => {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [category, setCategory] = useState('全部');
  const [filter, setFilter] = useState<'all' | 'changed' | 'standard'>('all');
  const [editing, setEditing] = useState<MarketPriceItem | null>(null);
  const [result, setResult] = useState('');
  const categories = ['全部', ...Array.from(new Set(items.map(item => item.category)))];
  const matched = useMemo(() => items.filter(item => item.name.toLowerCase().includes(search.trim().toLowerCase()) && (category === '全部' || item.category === category)), [items, search, category]);
  const visible = matched.filter(item => filter === 'all' || (filter === 'changed' ? item.price !== item.standardPrice : item.price === item.standardPrice));
  const changedCount = matched.filter(item => item.price !== item.standardPrice).length;
  const standardCount = matched.length - changedCount;
  const save = (price: number) => {
    if (!editing) return;
    setItems(previous => previous.map(item => item.id === editing.id ? { ...item, price, updatedAt: price === item.standardPrice ? '使用标准价' : '刚刚' } : item));
    setResult(`${editing.name} 时价已更新为 ¥${formatPrice(price)}${editing.unit ? ` / ${editing.unit}` : ''}`);
    setEditing(null);
  };
  return <div className="pos-view">
    <PosResult message={result} onClose={() => setResult('')} />
    <PosCategories items={categories} value={category} onChange={setCategory} />
    <div className="pos-grid-scroll"><div className="pos-grid pos-market-grid">{visible.map(item => {
      const changed = item.price !== item.standardPrice;
      return <button key={item.id} className="pos-card pos-market-card" onClick={() => setEditing(item)} aria-label={`${item.name}，当前时价 ${item.price} 元${item.unit ? `每${item.unit}` : ''}`}>
        {showImage && <span className="pos-image-placeholder"><Image size={26} /></span>}
        <div className="pos-card-heading"><h3>{item.name}</h3>{changed && <span className="pos-tag warning">已调价</span>}</div>
        <div className="pos-market-reference">标准价 ¥{formatPrice(item.standardPrice)}{item.unit ? ` / ${item.unit}` : ''}</div>
        <div className="pos-market-card-footer"><div><small>当前时价</small><strong>¥{formatPrice(item.price)}{item.unit && <em>/{item.unit}</em>}</strong></div><span><Clock3 size={12} />{item.updatedAt}</span></div>
      </button>;
    })}</div>
      {!visible.length && <PosEmpty filtered onReset={() => { onReset(); setCategory('全部'); setFilter('all'); }} />}
    </div>
    <footer className="pos-dock pos-market-dock">
      <PosStatusFilters value={filter} onChange={value => setFilter(value as typeof filter)} options={[{ id: 'all', label: '全部', count: matched.length }, { id: 'changed', label: '已调价', count: changedCount, tone: 'warning' }, { id: 'standard', label: '使用标准价', count: standardCount }]} />
      <span className="pos-divider" /><span className="pos-market-count">共 {matched.length} 道时价菜</span>
    </footer>
    {editing && <MarketPriceDialog item={editing} onClose={() => setEditing(null)} onConfirm={save} />}
  </div>;
};
