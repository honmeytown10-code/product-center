import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, RotateCcw, Search, ShieldOff, X } from 'lucide-react';

export type ExemptionCandidate = {
  id: string;
  platformName: string;
  platformProductId: string;
  platformSku: string;
  platformSpec: string;
  platformType: 'standard' | 'combo' | 'display';
};

type Props = {
  channelName: string;
  rows: ExemptionCandidate[];
  exemptRowIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
};

const typeLabels = { standard: '标准商品', combo: '套餐商品', display: '展示商品' } as const;

export const WebMappingExemptionManager: React.FC<Props> = ({ channelName, rows, exemptRowIds, onChange, onClose }) => {
  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [keyword, setKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [restoreRow, setRestoreRow] = useState<ExemptionCandidate | null>(null);

  const currentRows = useMemo(() => rows.filter(row => exemptRowIds.includes(row.id)), [exemptRowIds, rows]);
  const availableRows = useMemo(() => rows.filter(row => !exemptRowIds.includes(row.id)), [exemptRowIds, rows]);
  const visibleRows = (mode === 'list' ? currentRows : availableRows).filter(row =>
    !keyword || `${row.platformName}${row.platformProductId}${row.platformSku}`.toLowerCase().includes(keyword.trim().toLowerCase()),
  );

  const toggle = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const addSelected = () => {
    onChange(Array.from(new Set([...exemptRowIds, ...selectedIds])));
    setSelectedIds([]);
    setMode('list');
  };

  return (
    <div className="fixed inset-0 z-[340] flex justify-end bg-[#1D2129]/45" role="dialog" aria-modal="true" aria-label="免绑定商品配置">
      <section className="flex h-full w-[860px] flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#E5E6EB] px-6 py-5">
          <div>
            <div className="flex items-center gap-2"><ShieldOff size={20} className="text-[#D46B08]" /><h3 className="text-[18px] font-bold text-[#1D2129]">免绑定商品配置</h3></div>
            <p className="mt-1 text-[12px] text-[#667085]">{channelName} · 品牌范围</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭免绑定商品配置" className="rounded p-1.5 hover:bg-[#F2F3F5]"><X size={18} /></button>
        </header>

        <div className="border-b border-[#E5E6EB] bg-[#FFF9F0] px-6 py-4">
          <div className="flex items-start gap-3 text-[12px] leading-5 text-[#8A5315]">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#D46B08]" />
            <div><b className="text-[#7A4300]">免绑定商品不会进入映射处理。</b> 门店商品映射和批量商品映射默认隐藏；自动关联、映射诊断和映射任务均跳过。恢复后重新进入待映射范围。</div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-[#E5E6EB] px-6 py-3">
          <div className="flex rounded-md bg-[#F2F3F5] p-0.5">
            <button type="button" onClick={() => { setMode('list'); setSelectedIds([]); }} className={`h-8 rounded px-3 text-[12px] ${mode === 'list' ? 'bg-white font-semibold text-[#00A35B] shadow-sm' : 'text-[#667085]'}`}>已免绑定 {currentRows.length}</button>
            <button type="button" onClick={() => { setMode('add'); setSelectedIds([]); }} className={`h-8 rounded px-3 text-[12px] ${mode === 'add' ? 'bg-white font-semibold text-[#00A35B] shadow-sm' : 'text-[#667085]'}`}>添加商品</button>
          </div>
          <label className="ml-auto flex h-9 w-[320px] items-center rounded-md border border-[#C9CDD4] bg-white px-3">
            <Search size={15} className="mr-2 text-[#86909C]" /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索平台商品名称、商品 ID、SKU 码" className="min-w-0 flex-1 text-[12px] outline-none" />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="overflow-hidden rounded-md border border-[#E5E6EB]">
            <div className={`grid ${mode === 'add' ? 'grid-cols-[44px_1fr_160px_130px_120px]' : 'grid-cols-[1fr_160px_130px_120px_90px]'} bg-[#F7F8FA] px-4 py-3 text-[12px] font-medium text-[#4E5969]`}>
              {mode === 'add' && <div />}
              <div>平台商品</div><div>平台商品 ID</div><div>商品类型</div><div>平台 SKU 码</div>{mode === 'list' && <div>操作</div>}
            </div>
            {visibleRows.map(row => {
              const selected = selectedIds.includes(row.id);
              return <div key={row.id} className={`grid min-h-[68px] ${mode === 'add' ? 'grid-cols-[44px_1fr_160px_130px_120px]' : 'grid-cols-[1fr_160px_130px_120px_90px]'} items-center border-t border-[#F0F1F2] px-4 py-3 text-[12px]`}>
                {mode === 'add' && <button type="button" onClick={() => toggle(row.id)} aria-label={`选择 ${row.platformName}`} className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-[#00B460] bg-[#00B460] text-white' : 'border-[#C9CDD4]'}`}>{selected && <Check size={12} strokeWidth={3} />}</button>}
                <div className="min-w-0"><div className="truncate font-semibold text-[#1D2129]">{row.platformName}</div><div className="mt-1 truncate text-[#86909C]">{row.platformSpec}</div></div>
                <div className="font-mono text-[#4E5969]">{row.platformProductId}</div>
                <div><span className={`rounded px-2 py-1 ${row.platformType === 'display' ? 'bg-[#FFF1E8] text-[#C45A00]' : 'bg-[#F2F3F5] text-[#4E5969]'}`}>{typeLabels[row.platformType]}</span></div>
                <div className="font-mono text-[#4E5969]">{row.platformSku}</div>
                {mode === 'list' && <button type="button" onClick={() => setRestoreRow(row)} className="inline-flex items-center font-medium text-[#00A35B]"><RotateCcw size={13} className="mr-1" />恢复</button>}
              </div>;
            })}
            {!visibleRows.length && <div className="py-16 text-center text-[13px] text-[#86909C]">{mode === 'list' ? '当前没有免绑定商品' : '没有可添加的平台商品'}</div>}
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-[#E5E6EB] bg-[#F7F8FA] px-6 py-4">
          <span className="text-[12px] text-[#667085]">配置变更将记录操作人、时间和商品范围</span>
          <div className="flex gap-2"><button type="button" onClick={onClose} className="h-9 rounded-md border border-[#C9CDD4] bg-white px-4 text-[13px] text-[#4E5969]">关闭</button>{mode === 'add' && <button type="button" disabled={!selectedIds.length} onClick={addSelected} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-semibold text-white disabled:bg-[#C9CDD4]">设为免绑定（{selectedIds.length}）</button>}</div>
        </footer>
      </section>

      {restoreRow && <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1D2129]/35"><div className="w-[460px] rounded-lg bg-white shadow-xl"><div className="px-6 py-5"><h4 className="font-bold text-[#1D2129]">恢复为待映射商品？</h4><p className="mt-3 text-[13px] leading-6 text-[#4E5969]">“{restoreRow.platformName}”恢复后将重新显示在映射页面，并参与后续自动关联、诊断和映射任务。</p></div><div className="flex justify-end gap-2 border-t border-[#E5E6EB] px-6 py-4"><button type="button" onClick={() => setRestoreRow(null)} className="h-9 rounded-md border border-[#C9CDD4] px-4 text-[13px]">取消</button><button type="button" onClick={() => { onChange(exemptRowIds.filter(id => id !== restoreRow.id)); setRestoreRow(null); }} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-semibold text-white">确认恢复</button></div></div></div>}
    </div>
  );
};
