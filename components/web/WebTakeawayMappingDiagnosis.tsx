import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  PlayCircle,
  SearchCheck,
  ShieldCheck,
  Store,
  X,
  Zap,
} from 'lucide-react';
import { THIRD_PARTY_CHANNELS } from '../../omnichannel';
import type { ThirdPartyChannelId } from '../../types';

type DiagnosisMode = 'quick' | 'deep';
type DiagnosisState = 'idle' | 'running' | 'completed';

type DiagnosisRecord = {
  id: string;
  platform: string;
  store: string;
  mode: DiagnosisMode;
  createdAt: string;
  successRate: number;
  normalCount: number;
  issueCount: number;
};

const stores = [
  { id: 'store-001', name: '易到家（五一广场店）' },
  { id: 'store-002', name: '易到家（南山万象店）' },
  { id: 'store-003', name: '易到家（福田卓悦店）' },
];

const initialRecords: DiagnosisRecord[] = [
  {
    id: 'diagnosis-20260528-01',
    platform: '美团外卖',
    store: '易到家（五一广场店）',
    mode: 'deep',
    createdAt: '2026-05-28 11:31:44',
    successRate: 94,
    normalCount: 47,
    issueCount: 3,
  },
  {
    id: 'diagnosis-20260521-02',
    platform: '淘宝闪购',
    store: '易到家（南山万象店）',
    mode: 'quick',
    createdAt: '2026-05-21 16:08:12',
    successRate: 98,
    normalCount: 58,
    issueCount: 1,
  },
];

const modeMeta: Record<DiagnosisMode, { title: string; description: string; Icon: React.ElementType }> = {
  quick: {
    title: '快速诊断',
    description: '使用系统最近一次获取的平台商品数据模拟下单，适合日常高频巡检。',
    Icon: Zap,
  },
  deep: {
    title: '深度检测',
    description: '实时拉取最新平台商品后执行完整模拟下单校验，适合定期全量诊断。',
    Icon: SearchCheck,
  },
};

export const WebTakeawayMappingDiagnosis: React.FC = () => {
  const [platformId, setPlatformId] = useState<ThirdPartyChannelId>('meituan');
  const [storeId, setStoreId] = useState(stores[0].id);
  const [mode, setMode] = useState<DiagnosisMode>('quick');
  const [state, setState] = useState<DiagnosisState>('idle');
  const [records, setRecords] = useState<DiagnosisRecord[]>(initialRecords);
  const [showRecords, setShowRecords] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const platform = THIRD_PARTY_CHANNELS.find(item => item.id === platformId) || THIRD_PARTY_CHANNELS[0];
  const store = stores.find(item => item.id === storeId) || stores[0];
  const latestRecord = records[0];

  const startDiagnosis = () => {
    if (state === 'running') return;
    setState('running');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const nextRecord: DiagnosisRecord = {
        id: `diagnosis-${Date.now()}`,
        platform: platform.name,
        store: store.name,
        mode,
        createdAt: '刚刚',
        successRate: mode === 'quick' ? 96 : 98,
        normalCount: mode === 'quick' ? 48 : 49,
        issueCount: mode === 'quick' ? 2 : 1,
      };
      setRecords(current => [nextRecord, ...current]);
      setState('completed');
      timerRef.current = null;
    }, 900);
  };

  return (
    <div className="flex min-h-[620px] overflow-hidden rounded-lg border border-[#E5E6EB] bg-white">
      <aside className="w-[300px] shrink-0 border-r border-[#E5E6EB] bg-[#FBFCFD] p-4">
        <h2 className="text-[15px] font-bold text-[#1D2129]">诊断范围</h2>

        <label className="mt-5 block">
          <span className="mb-2 flex items-center text-[12px] font-medium text-[#4E5969]">
            <ShieldCheck size={14} className="mr-1.5 text-[#86909C]" />
            目标平台
          </span>
          <select
            value={platformId}
            onChange={event => setPlatformId(event.target.value as ThirdPartyChannelId)}
            disabled={state === 'running'}
            className="h-10 w-full rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#1D2129] outline-none focus:border-[#00B460] disabled:bg-[#F2F3F5]"
          >
            {THIRD_PARTY_CHANNELS.map(channel => (
              <option key={channel.id} value={channel.id}>{channel.name}</option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-2 flex items-center text-[12px] font-medium text-[#4E5969]">
            <Store size={14} className="mr-1.5 text-[#86909C]" />
            目标门店
          </span>
          <select
            value={storeId}
            onChange={event => setStoreId(event.target.value)}
            disabled={state === 'running'}
            className="h-10 w-full rounded-md border border-[#C9CDD4] bg-white px-3 text-[13px] text-[#1D2129] outline-none focus:border-[#00B460] disabled:bg-[#F2F3F5]"
          >
            {stores.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>

        <div className="mt-5 rounded-md border border-[#FFD8A8] bg-[#FFF9F0] p-3 text-[12px] leading-5 text-[#9A5A16]">
          <div className="flex items-center font-bold text-[#C45A00]">
            <AlertCircle size={15} className="mr-1.5" />
            诊断提示
          </div>
          <p className="mt-1.5">
            诊断会模拟正常外卖订单的商品匹配链路，不产生真实订单。门店首次使用时建议先执行深度检测。
          </p>
        </div>
      </aside>

      <section className="min-w-0 flex-1 p-6">
        <div className="mx-auto max-w-[1080px]">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E8FFF3] text-[#00A35B] ring-8 ring-[#F2FFF8]">
              <ShieldCheck size={40} strokeWidth={1.8} />
            </div>
            <h1 className="mt-5 text-[24px] font-bold text-[#1D2129]">映射诊断中心</h1>
            <p className="mt-2 text-[13px] text-[#86909C]">
              模拟下单链路，对所选门店的平台商品进行解析与匹配校验，主动发现商品映射风险。
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4">
            {(Object.keys(modeMeta) as DiagnosisMode[]).map(item => {
              const meta = modeMeta[item];
              const active = mode === item;
              return (
                <button
                  key={item}
                  type="button"
                  disabled={state === 'running'}
                  onClick={() => setMode(item)}
                  className={`relative min-h-[170px] rounded-lg border-2 p-5 text-left transition ${
                    active ? 'border-[#00B460] bg-[#FBFFFD]' : 'border-[#E5E6EB] bg-white hover:border-[#B7C4BD]'
                  } disabled:cursor-not-allowed`}
                >
                  {active && (
                    <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#00B460] text-white">
                      <CheckCircle2 size={16} />
                    </span>
                  )}
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${item === 'quick' ? 'bg-[#E8FFF3] text-[#00A35B]' : 'bg-[#F4EFFF] text-[#7A52CC]'}`}>
                    <meta.Icon size={22} />
                  </span>
                  <div className="mt-4 text-[16px] font-bold text-[#1D2129]">{meta.title}</div>
                  <p className="mt-2 text-[13px] leading-6 text-[#4E5969]">{meta.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={startDiagnosis}
              disabled={state === 'running'}
              className="inline-flex h-11 min-w-[220px] items-center justify-center rounded-md bg-[#00B460] px-6 text-[14px] font-bold text-white hover:bg-[#009A52] disabled:cursor-wait disabled:bg-[#7BD6AB]"
            >
              {state === 'running' ? <Loader2 size={17} className="mr-2 animate-spin" /> : <PlayCircle size={17} className="mr-2" />}
              {state === 'running' ? '正在执行诊断' : state === 'completed' ? '重新执行诊断' : '立即执行诊断'}
            </button>
          </div>

          {state === 'completed' && latestRecord && (
            <div className="mt-5 grid grid-cols-[1.4fr_repeat(3,1fr)_auto] items-center gap-4 rounded-md border border-[#BCEBD2] bg-[#F4FFF9] px-5 py-4">
              <div>
                <div className="flex items-center text-[13px] font-bold text-[#008A4B]"><CheckCircle2 size={16} className="mr-1.5" />诊断完成</div>
                <div className="mt-1 text-[12px] text-[#667085]">{latestRecord.platform} · {latestRecord.store}</div>
              </div>
              <div><div className="text-[11px] text-[#86909C]">匹配成功率</div><div className="mt-1 text-[18px] font-bold text-[#1D2129]">{latestRecord.successRate}%</div></div>
              <div><div className="text-[11px] text-[#86909C]">正常商品</div><div className="mt-1 text-[18px] font-bold text-[#1D2129]">{latestRecord.normalCount}</div></div>
              <div><div className="text-[11px] text-[#86909C]">风险商品</div><div className="mt-1 text-[18px] font-bold text-[#CB2634]">{latestRecord.issueCount}</div></div>
              <button type="button" onClick={() => setShowRecords(true)} className="inline-flex items-center text-[13px] font-medium text-[#00A35B]">查看结果<ChevronRight size={15} /></button>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-[#86909C]">
            <Clock3 size={14} />
            <span>上次诊断：{latestRecord?.createdAt || '--'} · 成功率 <strong className="text-[#00A35B]">{latestRecord?.successRate ?? 0}%</strong></span>
            <button type="button" onClick={() => setShowRecords(true)} className="inline-flex items-center font-medium text-[#00A35B]">查看记录<ChevronRight size={14} /></button>
          </div>
        </div>
      </section>

      {showRecords && (
        <div className="fixed inset-0 z-[320] flex justify-end bg-[#1D2129]/45" role="dialog" aria-modal="true" aria-label="诊断记录">
          <div className="flex h-full w-[760px] flex-col bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
              <div><h3 className="text-[18px] font-bold text-[#1D2129]">诊断记录</h3><p className="mt-1 text-[12px] text-[#86909C]">保留诊断范围、模式与匹配结果，便于追溯映射风险。</p></div>
              <button type="button" onClick={() => setShowRecords(false)} className="rounded p-1.5 hover:bg-[#F2F3F5]" aria-label="关闭诊断记录"><X size={18} /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="overflow-hidden rounded-md border border-[#E5E6EB]">
                <div className="grid grid-cols-[150px_1fr_90px_90px_90px] bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]"><div>执行时间</div><div>诊断范围</div><div>模式</div><div>成功率</div><div>风险数</div></div>
                {records.map(record => (
                  <div key={record.id} className="grid min-h-[66px] grid-cols-[150px_1fr_90px_90px_90px] items-center border-t border-[#F0F1F2] px-4 py-3 text-[12px]">
                    <div className="text-[#4E5969]">{record.createdAt}</div>
                    <div><div className="font-medium text-[#1D2129]">{record.store}</div><div className="mt-1 text-[#86909C]">{record.platform}</div></div>
                    <div className="text-[#4E5969]">{record.mode === 'quick' ? '快速' : '深度'}</div>
                    <div className="font-bold text-[#00A35B]">{record.successRate}%</div>
                    <div className={record.issueCount ? 'font-bold text-[#CB2634]' : 'text-[#4E5969]'}>{record.issueCount}</div>
                  </div>
                ))}
              </div>
            </div>
            <footer className="flex justify-end border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4"><button type="button" onClick={() => setShowRecords(false)} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]">关闭</button></footer>
          </div>
        </div>
      )}
    </div>
  );
};
