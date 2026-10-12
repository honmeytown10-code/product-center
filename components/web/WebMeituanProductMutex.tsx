import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { checkMeituanMutexPairs, getMeituanMutexOptions, type TakeoutSnapshot } from '../../takeoutSync';

/** Console product-local selector. A pair represents both directions of the same exclusion. */
export const WebMeituanProductMutex = ({ pairs, snapshot, onChange }: {
  pairs: string[];
  snapshot?: TakeoutSnapshot;
  onChange: (pairs: string[]) => void;
}) => {
  const options = getMeituanMutexOptions(snapshot);
  const error = pairs.length ? checkMeituanMutexPairs(pairs, snapshot) : null;
  const readPair = (encoded: string): string[] => {
    try { const pair = JSON.parse(encoded); return Array.isArray(pair) ? pair.slice(0, 2).map(String) : ['', '']; }
    catch { return ['', '']; }
  };
  return <div className="mt-3 space-y-3" aria-label="当前商品的美团互斥属性">
    {options.length < 2 && <p className="text-xs leading-5 text-[#667085]">请先在商品结构中配置并启用至少两个做法或加料项。</p>}
    {pairs.length > 0 && <div className="space-y-2">
      {pairs.map((encoded, index) => {
        const pair = readPair(encoded);
        return <div key={index} className="flex flex-wrap items-center gap-3">
          {[0, 1].map(side => <React.Fragment key={side}>
            {side === 1 && <span className="text-xs text-[#667085]">不能同时选择</span>}
            <select aria-label={`第${index + 1}组互斥属性${side + 1}`} value={pair[side] || ''}
              onChange={event => onChange(pairs.map((item, row) => row === index ? JSON.stringify(pair.map((id, column) => column === side ? event.target.value : id)) : item))}
              className="h-10 min-w-0 flex-1 basis-48 rounded border border-[#DDE2E8] bg-white px-3 text-sm text-[#4E5969] outline-none focus:border-[#00B460] focus-visible:ring-2 focus-visible:ring-[#00B460]/20">
              <option value="">请选择属性</option>
              {pair[side] && !options.some(option => option.id === pair[side]) && <option value={pair[side]}>原属性已停用或移除</option>}
              {options.map(option => <option key={option.id} value={option.id} disabled={option.id === pair[1 - side]}>{option.label}</option>)}
            </select>
          </React.Fragment>)}
          <button type="button" aria-label={`移除第${index + 1}组互斥属性`} onClick={() => onChange(pairs.filter((_, row) => row !== index))}
            className="flex h-10 w-10 items-center justify-center rounded text-[#667085] hover:bg-[#F7F8FA] hover:text-[#B42318] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460]"><Trash2 size={16} /></button>
        </div>;
      })}
    </div>}
    <button type="button" disabled={options.length < 2} onClick={() => onChange([...pairs, JSON.stringify(['', ''])])}
      className="inline-flex items-center gap-1 text-sm text-[#008F4C] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460] disabled:cursor-not-allowed disabled:text-[#667085] disabled:no-underline"><Plus size={15} />添加互斥组合</button>
    {error && <p role="alert" className="text-xs text-[#B42318]">{error}</p>}
  </div>;
};
