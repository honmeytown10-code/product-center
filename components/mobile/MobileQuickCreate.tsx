/* ============================================================
   企迈 App · 门店视角 · 快捷录菜（拍菜单 / 语音）重设计
   —— 拍照取景（连拍）→ 流式识别 → 统一确认页 → 成功
   —— 语音长按实时上屏 → 统一确认页 → 成功
   忠实移植自 Claude Design 交付稿（App录菜-拍照与语音重设计）。
   仅负责 AI 快捷录入链路，手动建品仍由 MobileProductCreator 负责。
   ============================================================ */

import React from 'react';
import { Category } from '../../types';

const { useState, useRef, useEffect } = React;

/* ---------- 设计 token ---------- */
const T = {
  bg: '#F1F4F4',
  surface: '#FFFFFF',
  ink: '#1B1E24',
  ink2: '#5B6472',
  ink3: '#9AA3B2',
  hair: '#ECEFF3',
  green: '#00BE6E',
  greenDk: '#00A35F',
  greenTint: '#E4F8EE',
  violet: '#7A5AF8',
  violetDk: '#6A48F0',
  violetTint: '#F1ECFF',
  indigo: '#4F5BD5',
  indigoTint: '#ECEEFB',
  amber: '#F2A516',
  amberTint: '#FFF3DC',
  red: '#FF4D55',
  redTint: '#FFECEC',
  ink0: '#0E0F14',
};

const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",-apple-system,system-ui,sans-serif';

type Accent = { main: string; dk: string; tint: string };
// AI 强调色（拍照=绿 / 语音=紫，固定双色方案）
function accentFor(kind: 'photo' | 'voice'): Accent {
  return kind === 'voice'
    ? { main: T.violet, dk: T.violetDk, tint: T.violetTint }
    : { main: T.green, dk: T.greenDk, tint: T.greenTint };
}

/* 设计稿默认方案（原型 Tweaks 已收敛的推荐值） */
const T_DEFAULTS = {
  confirmDensity: '速确认' as '速确认' | '卡片',
  imageStrategy: '图库匹配' as '图库匹配' | 'AI生成' | '占位手动',
  voiceMode: '长按说话' as '长按说话' | '点击连续',
};
type Tweaks = typeof T_DEFAULTS;

/* ---------- 动画关键帧（注入一次） ---------- */
const KEYFRAMES = `
@keyframes qkAuroraA{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(28px,18px) scale(1.16)}}
@keyframes qkAuroraB{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-24px,-16px) scale(1.1)}}
@keyframes qkScanY{0%{top:0}50%{top:calc(100% - 3px)}100%{top:0}}
@keyframes qkSpin{to{transform:rotate(360deg)}}
@keyframes qkSlideIn{from{transform:translateY(9px)}to{transform:translateY(0)}}
@keyframes qkWave{0%,100%{height:8px}50%{height:32px}}
@keyframes qkPulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes qkPopIn{0%{transform:scale(.4)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
.qk-root *::-webkit-scrollbar{width:0;height:0;display:none}
.qk-root *{scrollbar-width:none;-ms-overflow-style:none}
`;

/* ---------- 图标（线性 SVG） ---------- */
type IcProps = { s?: number; c?: string; w?: number };
const Ic: Record<string, (p?: IcProps) => React.ReactElement> = {
  camera: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5A2 2 0 015 6.5h1.4l.8-1.4A1.5 1.5 0 018.5 4.3h7a1.5 1.5 0 011.3.8l.8 1.4H19a2 2 0 012 2V18a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><circle cx="12" cy="12.8" r="3.4" /></svg>),
  mic: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3" /></svg>),
  sparkle: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill={p.c || 'currentColor'}><path d="M12 2.6l1.7 4.6L18.3 9l-4.6 1.7L12 15.3l-1.7-4.6L5.7 9l4.6-1.8zM18.5 13.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9zM5.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8L3 17.7l1.8-.7z" /></svg>),
  check: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 20} height={p.s || 20} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>),
  plus: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>),
  chevR: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 18} height={p.s || 18} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>),
  chevL: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>),
  x: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 20} height={p.s || 20} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>),
  image: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5-9 9" /></svg>),
  edit: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 18} height={p.s || 18} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M14 5l5 5M4 20l1-4L16 5l3 3L8 19z" /></svg>),
  trash: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 18} height={p.s || 18} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>),
  album: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="M21 15l-5-4-8 7" /></svg>),
  alert: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 18} height={p.s || 18} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v5M12 16.5v.01" /><circle cx="12" cy="12" r="9" /></svg>),
  bolt: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 18} height={p.s || 18} fill={p.c || 'currentColor'}><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>),
  tag: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 16} height={p.s || 16} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12V5a2 2 0 012-2h7l9 9-9 9z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>),
  retry: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 18} height={p.s || 18} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0113.7-5.7L20 8M20 4v4h-4" /><path d="M20 12a8 8 0 01-13.7 5.7L4 16M4 20v-4h4" /></svg>),
  stop: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 18} height={p.s || 18} fill={p.c || 'currentColor'}><rect x="6" y="6" width="12" height="12" rx="2.5" /></svg>),
  flash: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 20} height={p.s || 20} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L5 13h6l-1 9 8-12h-6z" /></svg>),
  list: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 18} height={p.s || 18} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>),
  cup: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1 11a2 2 0 01-2 1.8H9a2 2 0 01-2-1.8zM7.5 8l.7-3.2A1.5 1.5 0 019.7 3.6h4.6a1.5 1.5 0 011.5 1.2L16.5 8" /><path d="M9 12.5h6" /></svg>),
  combo: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 3v8a2 2 0 002 2v8M9 3v6M6.5 3v6M19 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v8" /></svg>),
  scale: (p = {}) => (<svg viewBox="0 0 24 24" width={p.s || 22} height={p.s || 22} fill="none" stroke={p.c || 'currentColor'} strokeWidth={p.w || 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M7 6h10M12 6l-5 8a3 3 0 006 0zM12 6l5 8a3 3 0 01-6 0M9 21h6" /></svg>),
};

/* ---------- emoji 占位「商品图」 ---------- */
const FOOD_ART: Record<string, [string, string]> = {
  '招牌珍珠奶茶': ['🧋', '#EADBC8'], '黑糖波波奶茶': ['🧋', '#E6D2C0'],
  '芝士葡萄茶': ['🍇', '#E3DDF3'], '满杯红柚': ['🍊', '#FBE2CC'],
  '杨枝甘露': ['🥭', '#FBEAC2'], '多肉葡萄': ['🍇', '#E6DDF2'],
  '手打柠檬茶': ['🍋', '#F4F0C8'], '黄金薯条': ['🍟', '#FBE6C2'],
  '盐酥鸡': ['🍗', '#F4D9C2'], '古早蛋挞': ['🥧', '#FBEBCB'],
  '芋圆奶茶': ['🧋', '#E7DCC8'], '抹茶拿铁': ['🍵', '#D7E7CC'],
  '奶茶': ['🧋', '#EADBC8'], '草莓蛋糕': ['🍰', '#F6D7DE'], '牛肉饭': ['🍚', '#EFDFC8'],
  '冰美式': ['☕', '#E3D5C7'], '生椰拿铁': ['🥥', '#EDE6D8'], '可乐': ['🥤', '#E7C9C4'],
};
function artFor(name: string): [string, string] {
  if (FOOD_ART[name]) return FOOD_ART[name];
  const keys = Object.keys(FOOD_ART);
  const hit = keys.find(k => name && (name.includes(k) || k.includes(name)));
  return hit ? FOOD_ART[hit] : ['🍽️', '#E9EDF2'];
}

/* ---------- 数据模型 ---------- */
type Spec = { n: string; p: number | null };
export type Draft = {
  id: string;
  name: string;
  category: string;
  price: number | null;
  specs: Spec[] | null;
  image: string;
  conf: number;
  needs: string[];
};

let _uid = 0;
const nid = () => 'qk' + (++_uid);
function mk(o: Partial<Draft>): Draft {
  return { id: nid(), name: '', category: '', price: null, specs: null, image: 'matched', conf: 0.95, needs: [], ...o };
}
// 拍照（整本菜单 → 12 条，含缺失/多规格/待核对）
function photoDrafts(): Draft[] {
  _uid = 0;
  return [
    mk({ name: '招牌珍珠奶茶', category: '招牌奶茶', specs: [{ n: '中杯', p: 12 }, { n: '大杯', p: 15 }] }),
    mk({ name: '黑糖波波奶茶', category: '招牌奶茶', specs: [{ n: '中杯', p: 14 }, { n: '大杯', p: 17 }] }),
    mk({ name: '芋圆奶茶', category: '招牌奶茶', price: 13 }),
    mk({ name: '多肉葡萄', category: '', specs: [{ n: '中杯', p: 18 }, { n: '大杯', p: 21 }], needs: ['category'] }),
    mk({ name: '芝士葡萄茶', category: '鲜果茶', price: 18 }),
    mk({ name: '满杯红柚', category: '鲜果茶', price: 16 }),
    mk({ name: '杨枝甘露', category: '鲜果茶', price: 19 }),
    mk({ name: '手打柠檬茶', category: '鲜果茶', price: 13 }),
    mk({ name: '盐酥鸡', category: '小吃', price: null, needs: ['price'] }),
    mk({ name: '黄金薯条', category: '小吃', price: 9 }),
    mk({ name: '古早蛋挞', category: '小吃', price: 6 }),
    mk({ name: '抹茶拿铁', category: '', price: 16, conf: 0.62, needs: ['category', 'verify'] }),
  ];
}
// 拍照「继续拍照补菜」第二批
function photoDraftsMore(): Draft[] {
  return [
    mk({ name: '冰美式', category: '咖啡', price: 12 }),
    mk({ name: '生椰拿铁', category: '', price: 18, needs: ['category'] }),
  ];
}
// 语音（一批口播 → 3 条）
function voiceDrafts(): Draft[] {
  return [
    mk({ name: '奶茶', category: '', price: 30, needs: ['category'] }),
    mk({ name: '草莓蛋糕', category: '', price: 26, needs: ['category'] }),
    mk({ name: '牛肉饭', category: '', price: 20, needs: ['category'] }),
  ];
}
const CATEGORIES = ['招牌奶茶', '鲜果茶', '小吃', '主食', '甜品', '其他'];

function priceText(d: Draft): string | null {
  if (d.specs && d.specs.length) {
    const ps = d.specs.map(s => s.p).filter((x): x is number => x != null);
    if (!ps.length) return null;
    const min = Math.min(...ps), max = Math.max(...ps);
    return min === max ? `¥${min}` : `¥${min}~${max}`;
  }
  return d.price != null ? `¥${d.price}` : null;
}

const priceMissing = (d: Draft) => d.specs ? d.specs.some(s => s.p == null) : d.price == null;
const catMissing = (d: Draft) => !d.category;
const incomplete = (d: Draft) => priceMissing(d) || catMissing(d);   // 价格 + 分类 均为必填
const isReady = (d: Draft) => !incomplete(d) && !d.needs.includes('verify');

/* ============================================================
   共享原子组件
   ============================================================ */

// 商品缩略图（emoji 演示 + 状态角标）
function Thumb({ d, size = 54, strategy = '图库匹配' }: { d: Draft; size?: number; strategy?: Tweaks['imageStrategy'] }) {
  const [emoji, bg] = artFor(d.name);
  const isPh = strategy === '占位手动' && d.image !== 'user';
  return (
    <div style={{
      width: size, height: size, borderRadius: 14, flexShrink: 0, position: 'relative',
      background: isPh ? '#F3F5F8' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)',
    }}>
      {isPh ? Ic.image({ s: size * 0.4, c: '#C2C9D4' }) : <span>{emoji}</span>}
      {!isPh && strategy === 'AI生成' && (
        <div style={{
          position: 'absolute', right: -4, bottom: -4, width: 18, height: 18, borderRadius: 9,
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}>{Ic.sparkle({ s: 11, c: T.violet })}</div>
      )}
    </div>
  );
}

// 主操作 pill 按钮
function PillBtn({ children, onClick, bg = T.ink, color = '#fff', disabled, style = {} }: {
  children: React.ReactNode; onClick?: () => void; bg?: string; color?: string; disabled?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      width: '100%', height: 54, borderRadius: 999, border: 'none', cursor: disabled ? 'default' : 'pointer',
      background: disabled ? '#D7DCE3' : bg, color: disabled ? '#fff' : color,
      fontFamily: FONT, fontSize: 17, fontWeight: 800, letterSpacing: 0.3,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: disabled ? 'none' : '0 10px 22px rgba(0,0,0,0.12)', transition: 'transform .12s',
      ...style,
    }}
      onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.975)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
      {children}
    </button>
  );
}

// 小圆 chip
function Chip({ children, tone = 'ink' }: { children: React.ReactNode; tone?: 'ink' | 'green' | 'violet' | 'red' | 'amber' }) {
  const map: Record<string, { bg: string; c: string }> = {
    ink: { bg: '#F1F4F8', c: T.ink2 }, green: { bg: T.greenTint, c: T.greenDk },
    violet: { bg: T.violetTint, c: T.violetDk }, red: { bg: T.redTint, c: T.red },
    amber: { bg: T.amberTint, c: '#B97400' },
  };
  const s = map[tone] || map.ink;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 8,
      background: s.bg, color: s.c, fontSize: 12, fontWeight: 700, fontFamily: FONT, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// 顶部导航条（贴合 App，深色字）
function TopBar({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '14px 8px 10px',
      position: 'relative', zIndex: 5,
    }}>
      <button onClick={onBack} style={{
        width: 40, height: 40, border: 'none', background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink,
      }}>{Ic.chevL({ c: T.ink })}</button>
      <div style={{ flex: 1, fontFamily: FONT, fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: 0.2 }}>{title}</div>
      <div style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end', paddingRight: 8 }}>{right}</div>
    </div>
  );
}

/* ---------- 通用底部 sheet ---------- */
function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,18,24,0.42)' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderRadius: '26px 26px 0 0',
        paddingBottom: 28, boxShadow: '0 -10px 40px rgba(0,0,0,0.18)', transform: 'translateZ(0)',
      }}>
        <div style={{ width: 38, height: 5, borderRadius: 5, background: '#E2E6EC', margin: '10px auto 6px' }} />
        {children}
      </div>
    </div>
  );
}

/* ---------- 数字键盘 sheet ---------- */
function NumPad({ title, value, onInput, onClose }: {
  title: string; value: number | null; onInput: (v: number | null) => void; onClose: () => void;
}) {
  const [v, setV] = useState(value == null ? '' : String(value));
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
  const tap = (k: string) => {
    if (k === 'del') setV(s => s.slice(0, -1));
    else if (k === '.') { if (!v.includes('.')) setV(s => (s || '0') + '.'); }
    else setV(s => s === '0' ? k : s + k);
  };
  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '4px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{title}</span>
        <button onClick={onClose} style={{
          border: 'none', background: '#F1F3F6', borderRadius: 999, width: 30, height: 30,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Ic.x({ s: 16, c: T.ink2 })}</button>
      </div>
      <div style={{
        margin: '0 18px 14px', height: 56, borderRadius: 14, background: T.bg, display: 'flex',
        alignItems: 'center', padding: '0 18px', fontFamily: FONT,
      }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: v ? T.ink : T.ink3 }}>¥ {v || '0'}</span>
        <span style={{ width: 2, height: 26, background: T.green, marginLeft: 3, animation: 'qkPulse 1s infinite' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '0 18px' }}>
        {keys.map(k => (
          <button key={k} onClick={() => tap(k)} style={{
            height: 52, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: k === 'del' ? 'transparent' : '#fff', boxShadow: k === 'del' ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
            fontFamily: FONT, fontSize: 22, fontWeight: 700, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{k === 'del' ? Ic.x({ s: 20, c: T.ink2 }) : k}</button>
        ))}
      </div>
      <div style={{ padding: '14px 18px 4px' }}>
        <PillBtn bg={T.green} onClick={() => { onInput(v === '' ? null : Number(v)); onClose(); }}>确定</PillBtn>
      </div>
    </Sheet>
  );
}

/* ---------- 分类选择 sheet（支持当场新建分类） ---------- */
function CatSheet({ cats, current, onPick, onCreate, onClose, title = '选择商品分类' }: {
  cats?: string[]; current: string | null; onPick: (c: string) => void; onCreate?: (c: string) => void; onClose: () => void; title?: string;
}) {
  const list = cats || CATEGORIES;
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const submit = () => { const n = name.trim(); if (!n) return; onCreate && onCreate(n); onPick(n); onClose(); };
  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '4px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{creating ? '新建分类' : title}</span>
        <button onClick={creating ? () => setCreating(false) : onClose} style={{
          border: 'none', background: '#F1F3F6', borderRadius: 999, width: 30, height: 30,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{Ic.x({ s: 16, c: T.ink2 })}</button>
      </div>
      {!creating ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, padding: '0 18px 18px' }}>
          {list.map(c => {
            const on = c === current;
            return (
              <button key={c} onClick={() => { onPick(c); onClose(); }} style={{
                border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: 12, fontFamily: FONT,
                fontSize: 14, fontWeight: 700, background: on ? T.ink : T.bg, color: on ? '#fff' : T.ink,
              }}>{c}</button>
            );
          })}
          <button onClick={() => setCreating(true)} style={{
            cursor: 'pointer', padding: '10px 16px', borderRadius: 12, fontFamily: FONT, fontSize: 14, fontWeight: 800,
            color: T.green, background: '#fff', border: `1.5px dashed ${T.green}80`, display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>{Ic.plus({ s: 15, c: T.green })}新建分类</button>
        </div>
      ) : (
        <div style={{ padding: '0 18px 8px' }}>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="输入新分类名称，如：招牌奶茶"
            style={{
              width: '100%', boxSizing: 'border-box', height: 50, borderRadius: 14, border: `1.5px solid ${T.green}`,
              outline: 'none', padding: '0 16px', fontFamily: FONT, fontSize: 16, fontWeight: 700, color: T.ink, background: T.bg,
            }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '10px 2px 14px', fontSize: 11.5, color: T.ink3 }}>
            {Ic.sparkle({ s: 13, c: T.ink3 })} 新分类会随商品一起创建，无需提前去分类管理里维护</div>
          <PillBtn bg={T.green} disabled={!name.trim()} onClick={submit}>创建并选中</PillBtn>
        </div>
      )}
    </Sheet>
  );
}

/* ---------- 替换图片 sheet ---------- */
function ImgSheet({ d, t, onPick, onClose }: { d: Draft; t: Tweaks; onPick: () => void; onClose: () => void }) {
  const opts: [string, string][] = [['拍照', 'camera'], ['从相册选', 'album'], ['AI 生成配图', 'sparkle']];
  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '4px 18px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Thumb d={d} size={48} strategy={t.imageStrategy} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{d.name} 的图片</div>
          <div style={{ fontSize: 12, color: T.ink2, marginTop: 2 }}>当前为系统配图，可替换为自己的图</div>
        </div>
      </div>
      <div style={{ padding: '0 18px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opts.map(([label, ic]) => (
          <button key={label} onClick={onPick} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', cursor: 'pointer',
            background: T.bg, borderRadius: 14, padding: '13px 14px', fontFamily: FONT,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, background: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>{Ic[ic]({ s: 20, c: T.ink2 })}</div>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{label}</span>
            <div style={{ flex: 1 }} />{Ic.chevR({ s: 18, c: T.ink3 })}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ============================================================
   拍照录入：取景拍摄（连拍多张）+ 流式识别中
   ============================================================ */

// AI 工作态极光底
function AuroraBg({ accent }: { accent: Accent }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: T.ink0 }}>
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', top: -60, left: -40, background: accent.main, opacity: 0.28, filter: 'blur(70px)', animation: 'qkAuroraA 7s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', bottom: -40, right: -30, background: T.violet, opacity: 0.22, filter: 'blur(70px)', animation: 'qkAuroraB 9s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', top: '40%', right: '30%', background: '#1E9BFF', opacity: 0.14, filter: 'blur(60px)', animation: 'qkAuroraA 11s ease-in-out infinite' }} />
    </div>
  );
}

// 菜单 mock（取景框内/缩略图通用）
function MenuMock({ scale = 1, dim = false }: { scale?: number; dim?: boolean }) {
  const Row = (n: string, p: string) => (
    <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: `${3 * scale}px 0` }}>
      <span style={{ fontSize: 11 * scale, color: '#2A2E36', fontWeight: 600 }}>{n}</span>
      <span style={{ fontSize: 11 * scale, color: '#C0392B', fontWeight: 800 }}>{p}</span>
    </div>
  );
  const Head = (txt: string) => (
    <div key={txt} style={{ fontSize: 12 * scale, fontWeight: 900, color: '#1B1E24', borderLeft: `${3 * scale}px solid #C0392B`, paddingLeft: 6 * scale, margin: `${7 * scale}px 0 ${3 * scale}px` }}>{txt}</div>
  );
  return (
    <div style={{ background: '#FBF7EF', borderRadius: 8 * scale, padding: `${12 * scale}px ${14 * scale}px`, fontFamily: FONT, filter: dim ? 'brightness(0.9)' : 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
      <div style={{ textAlign: 'center', fontSize: 14 * scale, fontWeight: 900, color: '#1B1E24', letterSpacing: 2 * scale, marginBottom: 4 * scale }}>茶 言 观 色</div>
      <div style={{ textAlign: 'center', fontSize: 8 * scale, color: '#9A8C72', letterSpacing: 3 * scale, marginBottom: 4 * scale }}>MENU · 菜单</div>
      {Head('招牌奶茶')}
      {Row('招牌珍珠奶茶', '中12/大15')}
      {Row('黑糖波波奶茶', '中14/大17')}
      {Row('芋圆奶茶', '13')}
      {Row('多肉葡萄', '中18/大21')}
      {Head('鲜果茶')}
      {Row('芝士葡萄茶', '18')}
      {Row('满杯红柚', '16')}
      {Row('杨枝甘露', '19')}
      {Row('手打柠檬茶', '13')}
      {Head('小吃')}
      {Row('盐酥鸡', '15')}
      {Row('黄金薯条', '9')}
    </div>
  );
}

function PhotoCapture({ t, onClose, onRecognize }: { t: Tweaks; onClose: () => void; onRecognize: (pages: number) => void }) {
  const acc = accentFor('photo');
  const [shots, setShots] = useState<number[]>([]);
  const [flash, setFlash] = useState(false);
  const take = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    setShots(s => [...s, s.length]);
  };
  const corners: [string, number, number][] = [['tl', 0, 0], ['tr', 1, 0], ['bl', 0, 1], ['br', 1, 1]];
  return (
    <div style={{ height: '100%', position: 'relative', background: '#000', overflow: 'hidden', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% 30%, #2A2D33 0%, #111317 70%)' }} />

      {/* 顶部条 */}
      <div style={{ position: 'relative', zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 0' }}>
        <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ic.x({ s: 20, c: '#fff' })}</button>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, opacity: 0.9 }}>拍照录入</div>
        <button style={{ width: 38, height: 38, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ic.flash({ s: 19, c: '#fff' })}</button>
      </div>

      {/* 取景框 + 菜单 */}
      <div style={{ position: 'relative', zIndex: 5, flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 34px' }}>
        <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
          <div style={{ maxHeight: '100%', overflow: 'hidden', borderRadius: 10 }}><MenuMock scale={1.05} /></div>
          {corners.map(([k, x, y]) => (
            <div key={k} style={{
              position: 'absolute', width: 26, height: 26,
              [x ? 'right' : 'left']: -2, [y ? 'bottom' : 'top']: -2,
              borderTop: y ? 'none' : `3px solid ${acc.main}`, borderBottom: y ? `3px solid ${acc.main}` : 'none',
              borderLeft: x ? 'none' : `3px solid ${acc.main}`, borderRight: x ? `3px solid ${acc.main}` : 'none',
              borderRadius: `${y ? 0 : 8}px 0px`,
            } as React.CSSProperties} />
          ))}
        </div>
      </div>
      {flash && <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 9, opacity: 0.85 }} />}

      {/* 提示 */}
      <div style={{ position: 'relative', zIndex: 6, textAlign: 'center', padding: '0 16px 10px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 12.5, fontWeight: 600 }}>
          {Ic.sparkle({ s: 13, c: acc.main })}
          {shots.length === 0 ? '把整页菜单放进框内 · 光线充足 · 避免反光' : `已拍 ${shots.length} 页，可继续拍下一页菜单`}
        </span>
      </div>

      {/* 已拍缩略图 filmstrip */}
      {shots.length > 0 && (
        <div style={{ position: 'relative', zIndex: 6, display: 'flex', gap: 8, padding: '0 18px 10px', overflowX: 'auto' }}>
          {shots.map(i => (
            <div key={i} style={{ width: 46, height: 58, borderRadius: 8, flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.9)', position: 'relative', background: '#FBF7EF' }}>
              <div style={{ transform: 'scale(0.34)', transformOrigin: 'top left', width: 135 }}><MenuMock scale={1} dim /></div>
              <div style={{ position: 'absolute', top: 1, right: 1, width: 14, height: 14, borderRadius: 7, background: acc.main, color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
            </div>
          ))}
        </div>
      )}

      {/* 底部控制 */}
      <div style={{ position: 'relative', zIndex: 7, paddingBottom: 22, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 30px 8px' }}>
          {/* 相册 */}
          <button onClick={take} style={{ width: 50, height: 50, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: '#fff' }}>
            {Ic.album({ s: 22, c: '#fff' })}
            <span style={{ fontSize: 9, fontWeight: 700 }}>相册</span>
          </button>
          {/* 快门 */}
          <button onClick={take} style={{ width: 74, height: 74, borderRadius: 999, border: '5px solid rgba(255,255,255,0.9)', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 58, height: 58, borderRadius: 999, background: '#fff' }} />
          </button>
          {/* 完成识别 */}
          <button onClick={() => onRecognize(Math.max(1, shots.length))} disabled={shots.length === 0}
            style={{ width: 50, minHeight: 50, borderRadius: 14, border: 'none', cursor: shots.length ? 'pointer' : 'default', background: shots.length ? acc.main : 'rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: shots.length ? '#fff' : 'rgba(255,255,255,0.4)', padding: '6px 4px' }}>
            {Ic.sparkle({ s: 20, c: shots.length ? '#fff' : 'rgba(255,255,255,0.4)' })}
            <span style={{ fontSize: 9, fontWeight: 800 }}>识别{shots.length > 0 ? ` ${shots.length}` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoRecognizing({ t, drafts, pages, onComplete, onStop }: { t: Tweaks; drafts: Draft[]; pages: number; onComplete: () => void; onStop: () => void }) {
  const acc = accentFor('photo');
  const [revealed, setRevealed] = useState(0);
  const total = drafts.length;
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;
  // 确定性流式：挂载后按固定节奏逐条揭示，跑完自动进入确认
  useEffect(() => {
    if (!total) return;
    let n = 0; setRevealed(0);
    const id = setInterval(() => {
      n += 1; setRevealed(n);
      if (n >= total) { clearInterval(id); setTimeout(() => doneRef.current(), 650); }
    }, 300);
    return () => clearInterval(id);
  }, [total]);
  const done = revealed >= total && total > 0;
  const list = drafts.slice(0, revealed);

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden', fontFamily: FONT }}>
      <AuroraBg accent={acc} />
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
        {/* 顶部：缩略图 + 状态 */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0, position: 'relative', border: '2px solid rgba(255,255,255,0.25)', background: '#FBF7EF' }}>
              <div style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: 135 }}><MenuMock scale={1} /></div>
              {!done && <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: acc.main, boxShadow: `0 0 12px ${acc.main}`, animation: 'qkScanY 1.4s ease-in-out infinite' }} />}
              {pages > 1 && <div style={{ position: 'absolute', bottom: 1, right: 1, fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '0 4px' }}>共{pages}页</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {!done
                  ? <div style={{ width: 18, height: 18 }}><div style={{ width: 18, height: 18, borderRadius: 999, border: '2.5px solid rgba(255,255,255,0.25)', borderTopColor: acc.main, animation: 'qkSpin .8s linear infinite' }} /></div>
                  : <div style={{ width: 20, height: 20, borderRadius: 999, background: acc.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ic.check({ s: 13, c: '#fff', w: 3 })}</div>}
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{done ? '识别完成' : 'AI 识别中'}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 5 }}>
                已识别 <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{revealed}</span> 个商品{done ? ' · 即将进入确认' : ''}</div>
            </div>
          </div>
        </div>

        {/* 流式列表 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((d, i) => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 14,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.12)',
              animation: i === revealed - 1 ? 'qkSlideIn .3s ease both' : 'none',
            }}>
              <Thumb d={d} size={38} strategy={t.imageStrategy} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{d.category || '未分类'}{d.specs ? ` · ${d.specs.length} 规格` : ''}</div>
              </div>
              <span style={{ color: priceText(d) ? acc.main : 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 800 }}>
                {priceText(d) || '缺价'}</span>
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div style={{ flexShrink: 0, padding: '10px 20px 30px' }}>
          {done
            ? <div style={{ width: '100%', height: 50, borderRadius: 999, background: 'rgba(255,255,255,0.10)', color: '#fff', fontFamily: FONT, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: 999, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'qkSpin .8s linear infinite' }} />
              正在进入确认页…</div>
            : <button onClick={onStop} style={{ width: '100%', height: 50, borderRadius: 999, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: FONT, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {Ic.stop({ s: 15, c: '#fff' })} 停止并确认已识别的</button>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   语音录入：长按说话 + 实时上屏 + 流式识别（含失败态）
   ============================================================ */

// 录音波形
function Waveform({ active, color }: { active: boolean; color: string }) {
  const bars = 28;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 40 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 3, background: color,
          height: active ? undefined : 4,
          animation: active ? `qkWave 0.9s ease-in-out ${i * 0.045}s infinite` : 'none',
          opacity: active ? 1 : 0.3,
        }} />
      ))}
    </div>
  );
}

// 语音批次脚本
function voiceBatch(i: number): { transcript: string; drafts: Draft[] } {
  if (i === 0) return { transcript: '奶茶30元，草莓蛋糕26元，牛肉饭20元', drafts: voiceDrafts() };
  return {
    transcript: '可乐5元，黄金薯条9元',
    drafts: [mk({ name: '可乐', price: 5, needs: ['category'] }), mk({ name: '黄金薯条', category: '小吃', price: 9 })],
  };
}

function VoiceScreen({ t, onClose, onComplete }: { t: Tweaks; onClose: () => void; onComplete: (drafts: Draft[]) => void }) {
  const acc = accentFor('voice');
  const hold = t.voiceMode !== '点击连续';
  const [phase, setPhase] = useState<'idle' | 'recording' | 'fail'>('idle');
  const [collected, setCollected] = useState<Draft[]>([]);
  const [live, setLive] = useState('');
  const [liveChips, setLiveChips] = useState<Draft[]>([]);
  const [batchIdx, setBatchIdx] = useState(0);
  const [secs, setSecs] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startAt = useRef(0);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const beginRec = () => {
    clearTimers();
    startAt.current = Date.now();
    setPhase('recording'); setLive(''); setLiveChips([]); setSecs(0);
    const b = voiceBatch(batchIdx);
    const words = b.transcript.split('，');
    let acc1 = '';
    words.forEach((w, i) => {
      timers.current.push(setTimeout(() => {
        acc1 += (i ? '，' : '') + w;
        setLive(acc1);
        setLiveChips(b.drafts.slice(0, i + 1));
      }, 700 + i * 850));
    });
    const tick = () => { setSecs(Math.floor((Date.now() - startAt.current) / 1000)); timers.current.push(setTimeout(tick, 250)); };
    tick();
  };

  const endRec = () => {
    const held = Date.now() - startAt.current;
    clearTimers();
    if (hold && held < 550) { setPhase('fail'); setLive(''); setLiveChips([]); return; }
    const b = voiceBatch(batchIdx);
    setCollected(c => [...c, ...b.drafts]);
    setBatchIdx(i => i + 1);
    setLive(''); setLiveChips([]); setPhase('idle');
  };

  useEffect(() => () => clearTimers(), []);
  const recording = phase === 'recording';
  const examples = ['奶茶 30 元', '宫保鸡丁 28 元，米饭 2 元', '牛肉饭 20 元，可乐 5 元'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: FONT, position: 'relative' }}>
      <TopBar title="语音录入" onBack={onClose}
        right={collected.length > 0 ? <span style={{ fontSize: 13, fontWeight: 800, color: acc.dk }}>{collected.length} 个</span> : undefined} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 12px' }}>
        {/* 顶部说明 */}
        {collected.length === 0 && phase !== 'recording' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>说出菜名和价格</div>
            <div style={{ fontSize: 13, color: T.ink2, marginTop: 6 }}>一口气说一批也行，AI 会自动拆成多个商品</div>
          </div>
        )}

        {/* 示例说法 */}
        {collected.length === 0 && phase === 'idle' && (
          <div style={{ background: '#fff', borderRadius: 18, padding: '14px 14px', boxShadow: '0 4px 16px rgba(20,30,50,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: T.ink2, marginBottom: 10 }}>
              {Ic.sparkle({ s: 14, c: acc.main })} 这样说，识别最准</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {examples.map(e => (
                <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: T.bg, fontSize: 14, color: T.ink, fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 6, background: acc.main, flexShrink: 0 }} />
                  「{e}」
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 已收集草稿（继续录入累积） */}
        {collected.length > 0 && phase !== 'recording' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 2px 10px' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>已录入 {collected.length} 个商品</span>
              <span style={{ fontSize: 12, color: T.ink3 }}>可继续说，或去确认</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {collected.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(20,30,50,0.04)' }}>
                  <Thumb d={d} size={40} strategy={t.imageStrategy} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: T.ink }}>{d.name}</div>
                    <div style={{ fontSize: 11.5, color: T.ink3, marginTop: 2 }}>
                      {d.needs.includes('category') ? <span style={{ color: T.amber }}>待选分类</span> : d.category}</div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: acc.dk }}>{priceText(d)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 失败提示 */}
        {phase === 'fail' && (
          <div style={{ background: T.redTint, borderRadius: 18, padding: '16px', marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.red, fontWeight: 800, fontSize: 15 }}>
              {Ic.alert({ s: 19, c: T.red })} 没听清，请重新说一遍</div>
            <div style={{ fontSize: 13, color: '#B23', marginTop: 8, lineHeight: 1.6 }}>
              请按「菜名 + 价格」说，例如：<b>奶茶 30 元</b>、<b>宫保鸡丁 28 元</b></div>
          </div>
        )}
      </div>

      {/* 录音中的浮层（实时上屏） */}
      {recording && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 148, top: 60, zIndex: 8, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 16px 6px', background: 'linear-gradient(to top, rgba(241,244,244,0.96) 60%, rgba(241,244,244,0))' }}>
          {/* 实时解析卡片 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {liveChips.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', borderRadius: 14, boxShadow: `0 4px 16px ${acc.main}1F`, border: `1px solid ${acc.tint}`, animation: 'qkSlideIn .3s cubic-bezier(.2,.9,.3,1.3) both' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: acc.tint, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ic.check({ s: 15, c: acc.main, w: 3 })}</div>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: T.ink }}>{d.name}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: acc.dk }}>{priceText(d)}</span>
              </div>
            ))}
          </div>
          {/* 实时转写 */}
          <div style={{ background: T.ink0, borderRadius: 16, padding: '14px 16px', color: '#fff' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 7, background: T.red, animation: 'qkPulse 1s infinite' }} />
              实时转写 · {secs}s</div>
            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, minHeight: 24 }}>
              {live || '请开始说话…'}</div>
          </div>
        </div>
      )}

      {/* 底部录音控制区 */}
      <div style={{ flexShrink: 0, padding: '10px 16px 30px', background: T.bg, position: 'relative', zIndex: 9 }}>
        {/* 完成按钮（有草稿时） */}
        {collected.length > 0 && !recording && (
          <button onClick={() => onComplete(collected)} style={{ width: '100%', height: 48, borderRadius: 999, border: 'none', cursor: 'pointer', background: T.ink, color: '#fff', fontFamily: FONT, fontSize: 15.5, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            去确认 {collected.length} 个商品 {Ic.chevR({ s: 17, c: '#fff' })}</button>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {recording && <Waveform active color={acc.main} />}
          <button
            onPointerDown={hold ? beginRec : undefined}
            onPointerUp={hold ? endRec : undefined}
            onPointerLeave={hold && recording ? endRec : undefined}
            onClick={!hold ? (recording ? endRec : beginRec) : undefined}
            style={{ width: '100%', height: 58, borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 16.5, fontWeight: 800, color: '#fff', background: recording ? T.red : acc.main, touchAction: 'none', userSelect: 'none', boxShadow: `0 12px 26px ${recording ? '#FF4D5540' : acc.main + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'background .2s' }}>
            {recording
              ? <>{hold ? '松开完成' : '点击停止'} · {secs}s</>
              : <>{Ic.mic({ s: 22, c: '#fff' })} {hold ? '长按说话' : '点击开始说话'}</>}
          </button>
          <div style={{ fontSize: 11.5, color: T.ink3 }}>
            {recording ? (hold ? '上滑可取消' : '再次点击结束本批') : (hold ? '按住说，松手即识别' : '点一下开始，说完再点结束')}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   统一确认商品页 + 单张草稿卡
   ============================================================ */

interface DraftCardProps {
  d: Draft; t: Tweaks; compact: boolean;
  onEdit: (patch: Partial<Draft>) => void; openPrice: (i: number | null) => void; openCat: () => void;
  onDelete: () => void; onEditMore: () => void; onReplaceImg: () => void;
  selMode: boolean; selected: boolean; onToggleSel: () => void;
}
const DraftCard: React.FC<DraftCardProps> = ({ d, t, compact, onEdit, openPrice, openCat, onDelete, onEditMore, onReplaceImg, selMode, selected, onToggleSel }) => {
  const bad = incomplete(d);
  const ready = isReady(d);
  const ph = compact ? 46 : 56;
  const [editName, setEditName] = useState(false);
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: compact ? '11px 12px' : '14px 14px',
      boxShadow: '0 3px 14px rgba(20,30,50,0.05)', position: 'relative',
      border: selMode ? (selected ? `1.5px solid ${T.green}` : `1.5px solid ${T.hair}`) : (bad ? `1.5px solid ${T.red}33` : '1.5px solid transparent'),
      fontFamily: FONT,
    }}>
      {selMode && (
        <div onClick={onToggleSel} style={{ position: 'absolute', inset: 0, zIndex: 6, borderRadius: 18, cursor: 'pointer', background: selected ? `${T.green}0D` : 'transparent' }}>
          <div style={{ position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: 999, border: `2px solid ${selected ? T.green : '#CDD4DE'}`, background: selected ? T.green : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selected && Ic.check({ s: 14, c: '#fff', w: 3 })}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* 图片 */}
        <button onClick={onReplaceImg} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', position: 'relative' }}>
          <Thumb d={d} size={ph} strategy={t.imageStrategy} />
          <div style={{ position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 999, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {Ic.edit({ s: 11, c: T.ink2 })}</div>
        </button>

        {/* 主体 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            {editName
              ? <input autoFocus defaultValue={d.name} onBlur={e => { onEdit({ name: e.target.value || d.name }); setEditName(false); }}
                style={{ flex: 1, border: 'none', borderBottom: `2px solid ${T.green}`, outline: 'none', fontFamily: FONT, fontSize: 15.5, fontWeight: 800, color: T.ink, padding: '0 0 2px', background: 'transparent' }} />
              : <div onClick={() => setEditName(true)} style={{ flex: 1, fontSize: 15.5, fontWeight: 800, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name || '未命名'}</div>}
            {d.needs.includes('verify') && <Chip tone="amber">{Ic.alert({ s: 12, c: '#B97400' })}待核对</Chip>}
            {ready && <div style={{ width: 18, height: 18, borderRadius: 999, background: T.greenTint, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ic.check({ s: 12, c: T.green, w: 3 })}</div>}
          </div>

          {/* 分类（必填） */}
          <div style={{ marginTop: 7 }}>
            {d.category
              ? <span onClick={openCat} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, background: T.bg, color: T.ink2, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {Ic.tag({ s: 12, c: T.ink3 })}{d.category}</span>
              : <span onClick={openCat} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, background: T.redTint, color: T.red, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                {Ic.tag({ s: 12, c: T.red })}选择分类</span>}
          </div>

          {/* 价格 / 规格 */}
          {d.specs
            ? <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.specs.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 10, background: T.bg }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.ink2 }}>{s.n}</span>
                  <button onClick={() => openPrice(i)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontSize: 14.5, fontWeight: 800, color: s.p == null ? T.red : T.ink }}>
                    {s.p == null ? '填价格' : `¥${s.p}`}</button>
                </div>
              ))}
            </div>
            : <div style={{ marginTop: 9 }}>
              <button onClick={() => openPrice(null)} style={{ border: 'none', cursor: 'pointer', fontFamily: FONT, padding: '6px 12px', borderRadius: 10, fontWeight: 800, fontSize: 15, background: d.price == null ? T.redTint : T.greenTint, color: d.price == null ? T.red : T.greenDk }}>
                {d.price == null ? '+ 填写价格' : `¥${d.price}`}</button>
            </div>}
        </div>
      </div>

      {/* 底部操作 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 11, paddingTop: 10, borderTop: `1px solid ${T.hair}` }}>
        <button onClick={onEditMore} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: T.ink2, display: 'flex', alignItems: 'center', gap: 5 }}>
          {Ic.edit({ s: 14, c: T.ink2 })}编辑更多</button>
        <div style={{ flex: 1 }} />
        <button onClick={onDelete} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.ink3, padding: 2 }}>
          {Ic.trash({ s: 16 })}</button>
      </div>
    </div>
  );
}

type Sheet = { type: 'price' | 'cat' | 'img' | 'batchcat'; id?: string; spec?: number | null };

function ConfirmScreen({ list, setList, t, source, cats, onAddCat, onAddMore, onSaveExit, onDiscardExit, onCreate, onEditMore }: {
  list: Draft[]; setList: React.Dispatch<React.SetStateAction<Draft[]>>; t: Tweaks; source: 'photo' | 'voice';
  cats: string[]; onAddCat: (c: string) => void; onAddMore: () => void; onSaveExit: () => void; onDiscardExit: () => void;
  onCreate: () => void; onEditMore: (id: string) => void;
}) {
  const acc = accentFor(source);
  const compact = t.confirmDensity !== '卡片';
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [selMode, setSelMode] = useState(false);
  const [leave, setLeave] = useState(false);
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  const toggleSel = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const exitSel = () => { setSelMode(false); setSel(new Set()); };

  const upd = (id: string, patch: Partial<Draft>) => setList(L => L.map(d => {
    if (d.id !== id) return d;
    const nd = { ...d, ...patch };
    nd.needs = nd.needs.filter(n => {
      if (n === 'price') return priceMissing(nd);
      if (n === 'category') return !nd.category;
      return true;
    });
    return nd;
  }));
  const setSpecPrice = (id: string, i: number, val: number | null) => setList(L => L.map(d => {
    if (d.id !== id || !d.specs) return d;
    const specs = d.specs.map((s, si) => si === i ? { ...s, p: val } : s);
    const nd = { ...d, specs }; nd.needs = nd.needs.filter(n => n === 'price' ? priceMissing(nd) : true);
    return nd;
  }));
  const del = (id: string) => setList(L => L.filter(d => d.id !== id));
  const applyCatTo = (ids: Set<string>, c: string) => setList(L => L.map(d => ids.has(d.id) ? { ...d, category: c, needs: d.needs.filter(n => n !== 'category') } : d));

  const badN = list.filter(incomplete).length;
  const priceN = list.filter(priceMissing).length;
  const catN = list.filter(catMissing).length;
  const verify = list.filter(d => d.needs.includes('verify')).length;
  const allReady = badN === 0;
  const target = sheet && sheet.id ? list.find(d => d.id === sheet.id) : undefined;

  // 价格优先，其次分类
  const gotoFirstBad = () => {
    let d = list.find(priceMissing);
    if (d) { setSheet({ type: 'price', id: d.id, spec: d.specs ? d.specs.findIndex(s => s.p == null) : null }); return; }
    d = list.find(catMissing);
    if (d) setSheet({ type: 'cat', id: d.id });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: FONT, position: 'relative' }}>
      <TopBar title={selMode ? `已选 ${sel.size} 个` : `确认商品 · ${list.length}`} onBack={selMode ? exitSel : () => setLeave(true)}
        right={<button onClick={() => selMode ? exitSel() : setSelMode(true)} style={{ border: 'none', background: 'transparent', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: acc.dk, cursor: 'pointer' }}>{selMode ? '取消' : '批量分类'}</button>} />

      {/* 完成度横幅 / 批量提示 */}
      <div style={{ padding: '0 16px 10px', flexShrink: 0 }}>
        {selMode ? (
          <div style={{ borderRadius: 16, padding: '11px 14px', background: acc.tint, display: 'flex', alignItems: 'center', gap: 8 }}>
            {Ic.tag({ s: 16, c: acc.dk })}
            <span style={{ fontSize: 13, fontWeight: 700, color: acc.dk, flex: 1 }}>勾选要归到同一分类的商品</span>
            <button onClick={() => setSel(new Set(list.map(d => d.id)))} style={{ border: 'none', background: 'transparent', fontFamily: FONT, fontSize: 12.5, fontWeight: 800, color: acc.dk, cursor: 'pointer' }}>全选</button>
          </div>
        ) : (
          <div onClick={allReady ? undefined : gotoFirstBad} style={{
            borderRadius: 16, padding: '12px 14px', background: allReady ? T.greenTint : '#fff', cursor: allReady ? 'default' : 'pointer',
            boxShadow: allReady ? 'none' : '0 4px 16px rgba(255,77,85,0.10)', border: allReady ? 'none' : `1.5px solid ${T.redTint}`,
            display: 'flex', alignItems: 'center', gap: 11,
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: allReady ? T.green : T.redTint }}>
              {allReady ? Ic.check({ s: 20, c: '#fff', w: 3 }) : Ic.alert({ s: 20, c: T.red })}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: allReady ? T.greenDk : T.ink }}>
                {allReady ? '全部就绪，可以创建' : `还差 ${badN} 个商品待完善`}</div>
              <div style={{ fontSize: 12, color: allReady ? T.greenDk : T.ink2, marginTop: 3, opacity: 0.9 }}>
                {allReady
                  ? '价格、分类、图片均已就绪'
                  : `${priceN > 0 ? `${priceN} 缺价格 · ` : ''}${catN > 0 ? `${catN} 待选分类 · ` : ''}${verify > 0 ? `${verify} 待核对 · ` : ''}点这里逐项补全`}</div>
            </div>
            {!allReady && <span style={{ fontSize: 12.5, fontWeight: 800, color: T.red, display: 'flex', alignItems: 'center', gap: 2 }}>
              去补全 {Ic.chevR({ s: 15, c: T.red })}</span>}
          </div>
        )}
      </div>

      {/* 列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map(d => (
          <DraftCard key={d.id} d={d} t={t} compact={compact}
            selMode={selMode} selected={sel.has(d.id)} onToggleSel={() => toggleSel(d.id)}
            onEdit={p => upd(d.id, p)}
            openPrice={i => setSheet({ type: 'price', id: d.id, spec: i })}
            openCat={() => setSheet({ type: 'cat', id: d.id })}
            onReplaceImg={() => setSheet({ type: 'img', id: d.id })}
            onDelete={() => del(d.id)}
            onEditMore={() => onEditMore(d.id)} />
        ))}
        {!selMode && <div style={{ textAlign: 'center', fontSize: 11.5, color: T.ink3, padding: '6px 0 2px' }}>
          {Ic.sparkle({ s: 12, c: T.ink3 })} 共 {list.length} 个草稿 · 删除不需要的，确认后统一创建</div>}
      </div>

      {/* 底部 CTA */}
      <div style={{ flexShrink: 0, padding: '10px 16px 30px', background: 'linear-gradient(to top,#F1F4F4 70%,rgba(241,244,244,0))' }}>
        {selMode
          ? <PillBtn bg={acc.main} disabled={sel.size === 0} onClick={() => setSheet({ type: 'batchcat' })}>
            {Ic.tag({ s: 17, c: '#fff' })} 设为同一分类（{sel.size}）</PillBtn>
          : <div style={{ display: 'flex', gap: 10 }}>
            {source === 'voice' && (
              <button onClick={onAddMore} style={{ flexShrink: 0, height: 54, padding: '0 18px', borderRadius: 999, border: `1.5px solid ${acc.main}`, background: '#fff', cursor: 'pointer', fontFamily: FONT, fontSize: 14.5, fontWeight: 800, color: acc.dk, display: 'flex', alignItems: 'center', gap: 6 }}>
                {Ic.mic({ s: 19, c: acc.dk })} 继续说</button>
            )}
            <div style={{ flex: 1 }}>
              {allReady
                ? <PillBtn bg={T.green} onClick={onCreate}>{Ic.check({ s: 18, c: '#fff', w: 3 })} 全部创建（{list.length}）</PillBtn>
                : <PillBtn bg={T.ink} onClick={gotoFirstBad}>去补全剩余 {badN} 项</PillBtn>}
            </div>
          </div>}
      </div>

      {/* sheets */}
      {sheet?.type === 'price' && target && (
        <NumPad title={`${target.name}${sheet.spec != null && target.specs ? ' · ' + target.specs[sheet.spec].n : ''} 价格`}
          value={sheet.spec != null && target.specs ? target.specs[sheet.spec].p : target.price}
          onInput={v => sheet.spec != null ? setSpecPrice(target.id, sheet.spec, v) : upd(target.id, { price: v })}
          onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'cat' && target && (
        <CatSheet cats={cats} current={target.category} onCreate={onAddCat}
          title={`为「${target.name || '该商品'}」选择分类`}
          onPick={c => upd(target.id, { category: c })} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'img' && target && (
        <ImgSheet d={target} t={t} onPick={() => { upd(target.id, { image: 'user' }); setSheet(null); }} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'batchcat' && (
        <CatSheet cats={cats} current={null} onCreate={onAddCat} title={`为 ${sel.size} 个商品设置分类`}
          onPick={c => { applyCatTo(sel, c); exitSel(); }} onClose={() => setSheet(null)} />
      )}

      {/* 退出确认 */}
      {leave && (
        <Sheet onClose={() => setLeave(false)}>
          <div style={{ padding: '2px 20px 6px', fontFamily: FONT }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: T.ink }}>还有 {list.length} 个商品未创建</div>
            <div style={{ fontSize: 13, color: T.ink2, marginTop: 6, lineHeight: 1.5 }}>可以存为草稿下次接着改，或直接放弃本次录入</div>
          </div>
          <div style={{ padding: '14px 18px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PillBtn bg={T.ink} onClick={() => { setLeave(false); onSaveExit(); }}>
              {Ic.list({ s: 17, c: '#fff' })} 保存为草稿</PillBtn>
            <button onClick={() => { setLeave(false); onDiscardExit(); }}
              style={{ width: '100%', height: 50, borderRadius: 999, border: 'none', cursor: 'pointer', background: T.redTint, color: T.red, fontFamily: FONT, fontSize: 15.5, fontWeight: 800 }}>放弃本次录入</button>
            <button onClick={() => setLeave(false)} style={{ width: '100%', height: 46, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'transparent', color: T.ink2, fontFamily: FONT, fontSize: 15, fontWeight: 700 }}>继续编辑</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ============================================================
   编辑更多（单品完整编辑，仅保存回流）+ 成功页
   ============================================================ */

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: `1px solid ${T.hair}` }}>
      <div style={{ width: 74, flexShrink: 0, fontSize: 14, fontWeight: 700, color: T.ink2 }}>
        {label}{required && <span style={{ color: T.red, marginLeft: 2 }}>*</span>}</div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function EditMore({ product, t, cats, onAddCat, onSave, onBack }: {
  product: Draft; t: Tweaks; cats: string[]; onAddCat: (c: string) => void; onSave: (d: Draft) => void; onBack: () => void;
}) {
  const [d, setD] = useState<Draft>(() => JSON.parse(JSON.stringify(product)));
  const [sheet, setSheet] = useState<'cat' | 'price' | { price: number } | null>(null);
  const set = (p: Partial<Draft>) => setD(s => ({ ...s, ...p }));
  const inputS: React.CSSProperties = { width: '100%', border: 'none', outline: 'none', fontFamily: FONT, fontSize: 15, fontWeight: 700, color: T.ink, background: 'transparent', textAlign: 'right' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: FONT, position: 'relative' }}>
      <TopBar title="编辑商品" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 16px 16px' }}>
        {/* 图片 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 18, padding: '16px', marginBottom: 14, boxShadow: '0 3px 14px rgba(20,30,50,0.05)' }}>
          <Thumb d={d} size={64} strategy={t.imageStrategy} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>商品主图</div>
            <div style={{ fontSize: 12, color: T.ink2, marginTop: 3 }}>系统已配图，点击可替换</div>
          </div>
          <button onClick={() => set({ image: 'user' })} style={{ border: `1.5px solid ${T.hair}`, background: '#fff', borderRadius: 999, padding: '8px 16px', fontFamily: FONT, fontSize: 13, fontWeight: 800, color: T.ink2, cursor: 'pointer' }}>替换</button>
        </div>

        {/* 基础信息 */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '2px 16px', marginBottom: 14, boxShadow: '0 3px 14px rgba(20,30,50,0.05)' }}>
          <Field label="商品名称" required>
            <input value={d.name} onChange={e => set({ name: e.target.value })} style={inputS} placeholder="请输入" />
          </Field>
          <Field label="商品分类" required>
            <button onClick={() => setSheet('cat')} style={{ ...inputS, cursor: 'pointer', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, color: d.category ? T.ink : T.ink3 }}>
              {d.category || '请选择'}{Ic.chevR({ s: 16, c: T.ink3 })}</button>
          </Field>
          {!d.specs && (
            <Field label="售价" required>
              <button onClick={() => setSheet('price')} style={{ ...inputS, cursor: 'pointer', display: 'flex', justifyContent: 'flex-end', color: d.price == null ? T.red : T.ink, fontSize: 16 }}>
                {d.price == null ? '填写价格' : `¥ ${d.price}`}</button>
            </Field>
          )}
          <Field label="商品单位">
            <input defaultValue={d.specs ? '杯' : '份'} style={inputS} />
          </Field>
        </div>

        {/* 规格 */}
        {d.specs && (
          <div style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', marginBottom: 14, boxShadow: '0 3px 14px rgba(20,30,50,0.05)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 10 }}>规格价格</div>
            {d.specs.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: T.bg, marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{s.n}</span>
                <button onClick={() => setSheet({ price: i })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontSize: 15, fontWeight: 800, color: s.p == null ? T.red : T.green }}>
                  {s.p == null ? '填价格' : `¥${s.p}`}</button>
              </div>
            ))}
          </div>
        )}

        {/* 更多（演示项） */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '2px 16px', boxShadow: '0 3px 14px rgba(20,30,50,0.05)' }}>
          <Field label="商品描述"><input placeholder="选填，如：精选茶底现泡" style={inputS} /></Field>
          <Field label="包装费"><input placeholder="¥0" style={inputS} /></Field>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.ink2 }}>立即上架售卖</span>
            <div style={{ width: 46, height: 28, borderRadius: 999, background: T.green, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 3, right: 3, width: 22, height: 22, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} /></div>
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '10px 16px 30px' }}>
        <PillBtn bg={T.green} onClick={() => onSave(d)}>保存</PillBtn>
      </div>

      {sheet === 'cat' && <CatSheet cats={cats} current={d.category} onCreate={onAddCat} onPick={c => set({ category: c })} onClose={() => setSheet(null)} />}
      {sheet === 'price' && <NumPad title={`${d.name} 售价`} value={d.price} onInput={v => set({ price: v })} onClose={() => setSheet(null)} />}
      {sheet && typeof sheet === 'object' && 'price' in sheet && d.specs && (
        <NumPad title={`${d.name} · ${d.specs[sheet.price].n} 价格`} value={d.specs[sheet.price].p}
          onInput={v => set({ specs: d.specs!.map((s, i) => i === sheet.price ? { ...s, p: v } : s) })} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

function SuccessScreen({ count, source, onMore, onList }: { count: number; source: 'photo' | 'voice'; onMore: () => void; onList: () => void }) {
  const acc = accentFor(source);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: FONT }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px' }}>
        <div style={{ width: 96, height: 96, borderRadius: 999, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 18px 40px ${T.green}45`, animation: 'qkPopIn .5s cubic-bezier(.2,.9,.3,1.4) both' }}>
          {Ic.check({ s: 50, c: '#fff', w: 3 })}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, marginTop: 26 }}>已创建 {count} 个商品</div>
        <div style={{ fontSize: 14, color: T.ink2, marginTop: 8, textAlign: 'center', lineHeight: 1.6 }}>
          通过{source === 'voice' ? '语音' : '拍照'}录入快速建好一批商品<br />已自动上架，可在商品列表查看</div>

        <div style={{ display: 'flex', gap: 18, marginTop: 30, background: '#fff', borderRadius: 18, padding: '16px 26px', boxShadow: '0 4px 16px rgba(20,30,50,0.05)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>{count}</div>
            <div style={{ fontSize: 11.5, color: T.ink3, marginTop: 2 }}>新增商品</div></div>
          <div style={{ width: 1, background: T.hair }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: acc.dk }}>{source === 'voice' ? '~20s' : '~30s'}</div>
            <div style={{ fontSize: 11.5, color: T.ink3, marginTop: 2 }}>本次用时</div></div>
        </div>
      </div>
      <div style={{ flexShrink: 0, padding: '10px 16px 30px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PillBtn bg={T.ink} onClick={onMore}>{Ic.plus({ s: 18, c: '#fff' })} 继续录入下一批</PillBtn>
        <button onClick={onList} style={{ width: '100%', height: 50, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'transparent', color: T.ink2, fontFamily: FONT, fontSize: 15, fontWeight: 700 }}>查看商品列表</button>
      </div>
    </div>
  );
}

/* ============================================================
   新建入口聚合页（与 EntryScreen 设计稿 1:1 对齐）
   - AI 拍照 / AI 语音 两张大卡前置突出
   - 手动添加：标准 / 套餐 / 称重（点击回调上抛由 MobileProductCreator 处理）
   ============================================================ */

function AICard({ kind, accent, title, sub, badge, onClick }: {
  kind: 'photo' | 'voice'; accent: Accent; title: string; sub: string; badge: string; onClick: () => void;
}) {
  const icon = kind === 'photo' ? Ic.camera({ s: 24, c: '#fff' }) : Ic.mic({ s: 24, c: '#fff' });
  return (
    <button onClick={onClick} style={{
      flex: 1, minWidth: 0, textAlign: 'left', border: 'none', cursor: 'pointer',
      background: T.surface, borderRadius: 22, padding: '16px 14px 14px', position: 'relative',
      boxShadow: '0 6px 20px rgba(20,30,50,0.06)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: 0, minHeight: 156, fontFamily: FONT,
    }}>
      {/* 柔光角 */}
      <div style={{ position: 'absolute', right: -30, top: -30, width: 100, height: 100, borderRadius: '50%', background: accent.tint, opacity: 0.8 }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: accent.main, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 18px ${accent.main}38` }}>{icon}</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 8, background: accent.tint, color: accent.dk, fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {Ic.bolt({ s: 10, c: accent.dk })}{badge}</span>
      </div>
      <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 14 }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: T.ink, display: 'flex', alignItems: 'center', gap: 5 }}>
          {title}
          <span style={{ fontSize: 9.5, fontWeight: 800, color: accent.main, background: accent.tint, padding: '1px 5px', borderRadius: 5 }}>AI</span>
        </div>
        <div style={{ fontSize: 11.5, color: T.ink2, marginTop: 5, lineHeight: 1.5 }}>{sub}</div>
      </div>
    </button>
  );
}

type EntryPick = 'photo' | 'voice' | 'standard' | 'combo' | 'weigh' | 'resume' | 'discard';

export interface QuickEntryDraft { count: number; from: string; time: string }
export interface QuickCreateSavedDraft {
  meta: QuickEntryDraft;
  source: 'photo' | 'voice';
  list: Draft[];
  cats: string[];
}

export const QuickEntryScreen: React.FC<{
  onPick: (k: EntryPick) => void;
  draft?: QuickEntryDraft | null;
}> = ({ onPick, draft }) => {
  const gAcc = accentFor('photo');
  const vAcc = accentFor('voice');
  // 注入一次性 no-scrollbar 样式（与 .qk-root 组合时也兜底）
  const _styleOnce = (
    <style>{`.qk-root *::-webkit-scrollbar{width:0;height:0;display:none}.qk-root *{scrollbar-width:none;-ms-overflow-style:none}
@keyframes qkPopIn{0%{transform:scale(.4)}60%{transform:scale(1.08)}100%{transform:scale(1)}}`}</style>
  );
  const manualTypes: { k: EntryPick; ic: string; tile: string; ico: string; title: string; sub: string; soon?: boolean }[] = [
    { k: 'standard', ic: 'cup', tile: T.greenTint, ico: T.greenDk, title: '标准商品', sub: '单品，如咖啡、面包、零售品' },
    { k: 'combo', ic: 'combo', tile: T.amberTint, ico: '#C77E12', title: '套餐商品', sub: '组合，如双人餐、超值午餐' },
    { k: 'weigh', ic: 'scale', tile: T.indigoTint, ico: T.indigo, title: '称重商品', sub: '按重量计算售价，如水果、散称', soon: true },
  ];
  return (
    <div className="qk-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      {_styleOnce}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 28px' }}>
        {/* 引导语 */}
        <div style={{ fontFamily: FONT, marginBottom: 14 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: T.ink, letterSpacing: 0.2 }}>用 AI 快速建一批菜</div>
          <div style={{ fontSize: 12.5, color: T.ink2, marginTop: 5 }}>拍菜单或说菜名，几秒生成商品草稿，确认即上架</div>
        </div>

        {/* 续传草稿 */}
        {draft && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 18,
            padding: '12px 14px', marginBottom: 14, boxShadow: '0 4px 16px rgba(20,30,50,0.05)',
            border: `1px solid ${T.hair}`, fontFamily: FONT,
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: T.amberTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {Ic.list({ s: 20, c: '#B97400' })}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>上次未完成的草稿</div>
              <div style={{ fontSize: 12, color: T.ink2, marginTop: 2 }}>{draft.count} 个商品 · {draft.from} · {draft.time}</div>
            </div>
            <button onClick={() => onPick('discard')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.ink3, padding: 4 }}>
              {Ic.trash({ s: 17 })}</button>
            <button onClick={() => onPick('resume')} style={{ border: 'none', cursor: 'pointer', background: T.ink, color: '#fff', fontFamily: FONT, fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 999 }}>继续</button>
          </div>
        )}

        {/* 两张 AI 卡 */}
        <div style={{ display: 'flex', gap: 12 }}>
          <AICard kind="photo" accent={gAcc} title="拍照录入" badge="整本菜单" sub="拍下菜单照片，一次识别一整批商品" onClick={() => onPick('photo')} />
          <AICard kind="voice" accent={vAcc} title="语音录入" badge="最快" sub="说出菜名和价格，边说边生成草稿" onClick={() => onPick('voice')} />
        </div>

        {/* 分隔 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 4px 12px' }}>
          <div style={{ flex: 1, height: 1, background: T.hair }} />
          <span style={{ fontFamily: FONT, fontSize: 12, color: T.ink3, fontWeight: 600 }}>或手动创建</span>
          <div style={{ flex: 1, height: 1, background: T.hair }} />
        </div>

        {/* 手动创建三类 */}
        <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 16px rgba(20,30,50,0.04)' }}>
          {manualTypes.map((m, i) => (
            <React.Fragment key={m.k}>
              {i > 0 && <div style={{ height: 1, background: T.hair, marginLeft: 72 }} />}
              <button onClick={() => !m.soon && onPick(m.k)} disabled={m.soon} style={{
                width: '100%', border: 'none', background: 'transparent', cursor: m.soon ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', fontFamily: FONT, opacity: m.soon ? 0.62 : 1,
              }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: m.tile, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ic[m.ic]({ s: 23, c: m.ico })}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: T.ink }}>{m.title}</div>
                  <div style={{ fontSize: 11.5, color: T.ink2, marginTop: 3 }}>{m.sub}</div>
                </div>
                {m.soon
                  ? <span style={{ fontSize: 11, fontWeight: 700, color: T.ink3, background: '#F1F3F6', padding: '3px 9px', borderRadius: 999 }}>暂未开放</span>
                  : Ic.chevR({ s: 18, c: T.ink3 })}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* 底部提示 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 22, fontFamily: FONT, fontSize: 11.5, color: T.ink3 }}>
          {Ic.sparkle({ s: 13, c: T.ink3 })} AI 识别结果均生成为草稿，确认后才会正式创建
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   状态机容器
   ============================================================ */

type QScreen = 'photo_capture' | 'photo_recognizing' | 'voice' | 'confirm' | 'edit_more' | 'success';

interface Props {
  initialMode: 'photo' | 'voice';
  categories: Category[];
  initialDraft?: QuickCreateSavedDraft | null;
  onExit: () => void;      // 返回新建入口
  onSaveDraft: (draft: QuickCreateSavedDraft) => void;
  onClearDraft: () => void;
  onViewList: () => void;  // 去商品列表
}

const formatDraftTime = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `今天 ${hh}:${mm}`;
};

export const MobileQuickCreate: React.FC<Props> = ({ initialMode, categories, initialDraft, onExit, onSaveDraft, onClearDraft, onViewList }) => {
  const t = T_DEFAULTS;
  const [screen, setScreen] = useState<QScreen>(initialDraft ? 'confirm' : (initialMode === 'voice' ? 'voice' : 'photo_capture'));
  const [source] = useState<'photo' | 'voice'>(initialDraft?.source || initialMode);
  const [list, setList] = useState<Draft[]>(() => initialDraft?.list || []);
  const [editId, setEditId] = useState<string | null>(null);
  const [pages, setPages] = useState(1);
  const [batch, setBatch] = useState<Draft[]>([]);
  const [created, setCreated] = useState(0);
  const [cats, setCats] = useState<string[]>(() => {
    const seed = categories.map(c => c.name).filter(Boolean);
    return Array.from(new Set([...CATEGORIES, ...seed, ...(initialDraft?.cats || [])]));
  });
  const addCat = (name: string) => setCats(c => c.includes(name) ? c : [...c, name]);
  const saveDraftAndExit = () => {
    onSaveDraft({
      meta: {
        count: list.length,
        from: source === 'voice' ? '语音录入' : '拍照录入',
        time: formatDraftTime(),
      },
      source,
      list,
      cats,
    });
    onExit();
  };

  const go = (s: QScreen) => setScreen(s);
  const editProduct = list.find(d => d.id === editId) || null;

  return (
    <div className="qk-root" style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden', background: T.bg }}>
      <style>{KEYFRAMES}</style>

      {screen === 'photo_capture' && (
        <PhotoCapture t={t} onClose={() => list.length ? go('confirm') : onExit()}
          onRecognize={(p) => { setPages(p); setBatch(list.length ? photoDraftsMore() : photoDrafts()); go('photo_recognizing'); }} />
      )}
      {screen === 'photo_recognizing' && (
        <PhotoRecognizing t={t} drafts={batch} pages={pages}
          onComplete={() => { setList(L => [...L, ...batch]); go('confirm'); }}
          onStop={() => { setList(L => [...L, ...batch]); go('confirm'); }} />
      )}
      {screen === 'voice' && (
        <VoiceScreen t={t} onClose={() => list.length ? go('confirm') : onExit()}
          onComplete={(drafts) => { setList(L => [...L, ...drafts]); go('confirm'); }} />
      )}
      {screen === 'confirm' && (
        <ConfirmScreen list={list} setList={setList} t={t} source={source} cats={cats} onAddCat={addCat}
          onAddMore={() => go(source === 'voice' ? 'voice' : 'photo_capture')}
          onSaveExit={saveDraftAndExit}
          onDiscardExit={() => { setList([]); onClearDraft(); onExit(); }}
          onCreate={() => { onClearDraft(); setCreated(list.length); go('success'); }}
          onEditMore={(id) => { setEditId(id); go('edit_more'); }} />
      )}
      {screen === 'edit_more' && editProduct && (
        <EditMore product={editProduct} t={t} cats={cats} onAddCat={addCat}
          onBack={() => go('confirm')}
          onSave={(d) => { setList(L => L.map(x => x.id === d.id ? d : x)); go('confirm'); }} />
      )}
      {screen === 'success' && (
        <SuccessScreen count={created} source={source}
          onMore={() => { setList([]); onClearDraft(); onExit(); }} onList={() => { setList([]); onClearDraft(); onViewList(); }} />
      )}
    </div>
  );
};
