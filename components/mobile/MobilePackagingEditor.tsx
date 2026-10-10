import React, { useState } from 'react';
import { ChevronDown, ChevronLeft, Info } from 'lucide-react';

export interface PackagingDraft {
  storePackFee?: string;
  storePackMark?: string;
  takePackFee?: string;
  takePackMark?: string;
}

export const hasPackaging = (row: PackagingDraft) =>
  [row.storePackFee, row.storePackMark, row.takePackFee, row.takePackMark].some(value => !!value?.trim());

export const packagingError = (row: PackagingDraft) => {
  if ([row.storePackFee, row.takePackFee].some(value => value?.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
    return '包装费请输入大于或等于 0 的有效金额';
  }
  if ([row.storePackMark, row.takePackMark].some(value => (value?.length ?? 0) > 128)) return '包装标识最多填写 128 字';
  return '';
};

export const packagingSummary = (row: PackagingDraft) => [
  row.storePackFee?.trim() ? `外带 ¥${row.storePackFee}` : '',
  row.takePackFee?.trim() ? `配送 ¥${row.takePackFee}` : '',
  row.storePackMark?.trim() || row.takePackMark?.trim() ? '已填包装标识' : '',
].filter(Boolean).join(' · ');

interface Props {
  level: 'product' | 'spec';
  multiple: boolean;
  data: PackagingDraft;
  specs: Array<PackagingDraft & { name: string }>;
  productName: string;
  onBack: () => void;
  onSave: (data: PackagingDraft, specs: PackagingDraft[]) => void;
}

export const MobilePackagingEditor = ({ level, multiple, data, specs, productName, onBack, onSave }: Props) => {
  const isSkuList = level === 'spec' && multiple;
  const initialRows = isSkuList ? specs.map(packagingFields) : [packagingFields(data)];
  const [rows, setRows] = useState(initialRows);
  const [expanded, setExpanded] = useState<number | null>(isSkuList ? null : 0);
  const [errors, setErrors] = useState<string[]>([]);
  const [leaving, setLeaving] = useState(false);
  const changed = JSON.stringify(rows) !== JSON.stringify(initialRows);
  const configured = rows.filter(hasPackaging).length;
  const update = (index: number, field: keyof PackagingDraft, value: string) => {
    setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    setErrors([]);
  };
  const save = () => {
    const nextErrors = rows.map(packagingError);
    setErrors(nextErrors);
    const invalidIndex = nextErrors.findIndex(Boolean);
    if (invalidIndex !== -1) { setExpanded(invalidIndex); return; }
    onSave(isSkuList ? data : rows[0], isSkuList ? rows : []);
  };

  return (
    <section aria-label="包装费设置页" className="absolute inset-0 z-[100] flex flex-col bg-[#F5F6FA]">
      <header className="flex h-[50px] shrink-0 items-center border-b border-gray-100 bg-white px-4">
        <button aria-label="返回商品表单" onClick={() => changed ? setLeaving(true) : onBack()} className="-ml-2 p-2 text-gray-600"><ChevronLeft size={24} /></button>
        <h2 className="mr-6 flex-1 text-center text-base font-bold text-[#1F2129]">包装费</h2>
      </header>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-4 rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 break-words text-sm font-bold text-gray-800">{productName || '当前商品'}</span>
            <span className="shrink-0 rounded-md bg-[#EAFBF2] px-2 py-1 text-xs font-medium text-[#00A35B]">{level === 'product' ? '商品级' : '规格级'}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-gray-500">{level === 'product' ? '所有规格共用一组包装费和包装标识' : isSkuList ? `共 ${rows.length} 个规格，已配置 ${configured} 个` : '为单规格设置包装费和包装标识'}</p>
        </div>
        {isSkuList && !rows.length ? <div className="rounded-2xl bg-white p-5 text-sm leading-6 text-gray-500">请返回“商品属性”完成规格设置，再配置各规格的包装费。</div> : (
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={`${specs[index]?.name || 'product'}-${index}`} className="overflow-hidden rounded-2xl bg-white">
                {isSkuList && <button aria-label={`配置包装费 ${specs[index].name}`} aria-expanded={expanded === index} onClick={() => setExpanded(expanded === index ? null : index)} className="flex w-full items-center gap-3 p-4 text-left">
                  <div className="min-w-0 flex-1"><div className="break-words text-sm font-bold text-gray-800">{specs[index].name}</div>{packagingSummary(row) && <div className="mt-1 text-xs leading-5 text-gray-500">{packagingSummary(row)}</div>}</div>
                  <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform ${expanded === index ? 'rotate-180' : ''}`} />
                </button>}
                {expanded === index && <div className={`space-y-5 p-4 ${isSkuList ? 'border-t border-gray-100' : ''}`}>
                  {([
                    { title: '到店外带', fee: 'storePackFee', mark: 'storePackMark' },
                    { title: '外卖配送', fee: 'takePackFee', mark: 'takePackMark' },
                  ] as const).map(scene => <div key={scene.fee}>
                    <h3 className="mb-3 text-sm font-bold text-gray-800">{scene.title}</h3>
                    <label className="mb-3 block">
                      <span className="mb-1.5 block text-xs text-gray-500">包装费</span>
                      <div className="flex items-center rounded-xl border border-gray-200 px-3 focus-within:border-[#00C06B]">
                        <span className="mr-2 text-sm text-gray-400">¥</span>
                        <input aria-label={`${isSkuList ? `${specs[index].name} ` : ''}${scene.title}包装费`} type="text" inputMode="decimal" value={row[scene.fee] || ''} placeholder="请输入包装费" onChange={event => update(index, scene.fee, event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none" />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs text-gray-500">包装标识</span>
                      <input aria-label={`${isSkuList ? `${specs[index].name} ` : ''}${scene.title}包装标识`} aria-describedby="packaging-mark-help" maxLength={128} value={row[scene.mark] || ''} placeholder="请输入包装标识" onChange={event => update(index, scene.mark, event.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#00C06B]" />
                      <span className="mt-1 block text-right text-[11px] leading-5 text-gray-400">{row[scene.mark]?.length || 0}/128</span>
                    </label>
                  </div>)}
                  {errors[index] && <p role="alert" className="text-xs text-red-500">{errors[index]}</p>}
                </div>}
              </div>
            ))}
          </div>
        )}
        <p id="packaging-mark-help" className="mt-4 flex items-start gap-2 text-xs leading-5 text-gray-500"><Info size={14} className="mt-0.5 shrink-0" />包装标识用于三方系统对接。</p>
      </div>
      <footer className="shrink-0 border-t border-gray-100 bg-white p-4 pb-8">
        <button disabled={!rows.length} onClick={save} className="h-12 w-full rounded-xl bg-[#00C06B] text-sm font-bold text-white disabled:bg-gray-300">确认</button>
      </footer>
      {leaving && <div role="dialog" aria-modal="true" aria-label="放弃包装费修改" className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-6">
        <div className="w-full rounded-2xl bg-white p-5"><h3 className="font-bold text-gray-800">放弃本次修改？</h3><p className="mt-2 text-sm leading-6 text-gray-500">尚未确认的包装费和标识不会回填商品表单。</p><div className="mt-5 flex gap-3"><button onClick={() => setLeaving(false)} className="h-11 flex-1 rounded-xl border border-gray-200 text-sm font-bold text-gray-700">继续编辑</button><button onClick={onBack} className="h-11 flex-1 rounded-xl bg-[#00C06B] text-sm font-bold text-white">放弃修改</button></div></div>
      </div>}
    </section>
  );
};

function packagingFields(row: PackagingDraft): Required<PackagingDraft> {
  return { storePackFee: row.storePackFee || '', storePackMark: row.storePackMark || '', takePackFee: row.takePackFee || '', takePackMark: row.takePackMark || '' };
}
