import React, { useState } from 'react';
import { checkMeituanMutexPairs, getMeituanMutexOptions, type TakeoutSnapshot } from '../../takeoutSync';
import type { OnlineMutexOption, OnlineMutexRule } from '../../meituanOnlineMutex';
import { MutexDialog } from './WebMeituanOnlineMutex';
import { WebMutexRuleBuilder } from './WebMutexRuleBuilder';

/** Shared online ordering interaction; keep the existing takeout pair payload. */
export const WebMeituanProductMutex = ({ pairs, snapshot, onChange }: {
  pairs: string[]; snapshot?: TakeoutSnapshot; onChange: (pairs: string[]) => void;
}) => {
  const labels = getMeituanMutexOptions(snapshot);
  const options: OnlineMutexOption[] = [
    ...(snapshot?.methods || []).map(item => ({ id: `method:${item.id || JSON.stringify([item.groupName, item.name])}`, name: item.name, groupId: `method:${item.groupName || '做法'}`, groupName: item.groupName || '做法', source: 'method' as const })),
    ...(snapshot?.addonItems || []).map(item => ({ id: `addon:${item.id}`, name: item.name, groupId: `addon:${item.groupName}`, groupName: item.groupName || '加料', source: 'addon' as const })),
  ];
  const label = (id: string) => labels.find(item => item.id === id)?.label || '原属性已停用或移除';
  const read = (encoded: string): string[] => { try { const pair = JSON.parse(encoded); return Array.isArray(pair) ? pair.slice(0, 2).map(String) : ['', '']; } catch { return ['', '']; } };
  const [editor, setEditor] = useState<{index: number | null; rule: OnlineMutexRule} | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const open = (index: number | null) => {
    const pair = index === null ? [] : read(pairs[index]);
    setError(''); setEditor({ index, rule: { version: 2, id: 'takeout-draft', left: pair[0] ? [pair[0]] : [], right: pair[1] ? [pair[1]] : [], labels: {} } });
  };
  const apply = () => {
    if (!editor) return;
    const {left, right} = editor.rule;
    if (!left.length || !right.length) return setError('两个属性组都至少选择一项。');
    const expanded = left.flatMap(a => right.map(b => JSON.stringify([a,b])));
    const next = [...pairs.filter((_,index) => index !== editor.index), ...expanded];
    const message = checkMeituanMutexPairs(next, snapshot);
    if (message) return setError(message);
    onChange(next); setEditor(null);
  };
  const currentError = pairs.length ? checkMeituanMutexPairs(pairs,snapshot) : null;
  const button = 'h-9 rounded border border-[#DDE3E8] px-4 text-sm';
  return <div className="mt-3 space-y-3" aria-label="当前商品的美团互斥属性">
    <button type="button" disabled={options.length<2} onClick={()=>open(null)} className="text-sm text-[#008F4C] disabled:text-[#86909C]">添加互斥属性</button>
    {options.length<2 && <p className="text-xs text-[#667085]">请先在商品结构中配置并启用至少两个做法或加料项。</p>}
    <div className="overflow-x-auto rounded border border-[#E5E6EB]"><table className="w-full table-fixed text-left text-sm"><thead className="bg-[#F7F8FA] text-[#4E5969]"><tr><th className="px-3 py-2 font-medium">属性</th><th className="px-3 py-2 font-medium">互斥属性</th><th className="w-28 px-3 py-2 font-medium">操作</th></tr></thead><tbody>
      {pairs.map((encoded,index)=>{const pair=read(encoded);return <tr key={index} className="border-t border-[#E5E6EB]"><td className="break-words px-3 py-3">{label(pair[0])}</td><td className="break-words px-3 py-3">{label(pair[1])}</td><td className="px-3 py-3"><div className="flex gap-3"><button type="button" onClick={()=>open(index)} className="text-[#008F4C]">编辑</button><button type="button" aria-label={`删除第${index+1}组互斥属性`} onClick={()=>setDeleting(index)} className="text-[#667085]">删除</button></div></td></tr>})}
      {!pairs.length && <tr><td colSpan={3} className="px-3 py-5 text-center text-[#86909C]">尚未配置互斥属性</td></tr>}
    </tbody></table></div>
    {currentError && <p role="alert" className="text-xs text-[#B42318]">{currentError}</p>}
    {editor && <MutexDialog wide title="选择互斥属性" onClose={()=>setEditor(null)} footer={<><button type="button" className={button} onClick={()=>setEditor(null)}>取消</button><button type="button" className={`${button} bg-[#00B460] text-white`} onClick={apply}>确定</button></>}>
      <p className="mb-4 text-xs leading-5 text-[#667085]">将属性分别放入两个属性组，两组之间不可同时选择；仅影响当前商品的美团外卖渠道。</p>
      <WebMutexRuleBuilder rule={editor.rule} options={options} label={label} disabled={false} onChange={rule=>{setEditor({...editor,rule});setError('')}} onError={setError}/>
      {error && <p role="alert" className="mt-3 text-sm text-[#B42318]">{error}</p>}
    </MutexDialog>}
    {deleting!==null && <MutexDialog title="删除互斥属性" onClose={()=>setDeleting(null)} footer={<><button type="button" className={button} onClick={()=>setDeleting(null)}>取消</button><button type="button" className={`${button} text-[#B42318]`} onClick={()=>{onChange(pairs.filter((_,index)=>index!==deleting));setDeleting(null)}}>确认删除</button></>}><p className="text-sm">确定删除“{label(read(pairs[deleting])[0])}”与“{label(read(pairs[deleting])[1])}”的互斥关系吗？</p><p className="mt-3 text-xs leading-5 text-[#667085]">仅修改当前商品的美团外卖配置，保存并同步后解除限制，不回写主档或其他商品库。可重新添加恢复。</p></MutexDialog>}
  </div>;
};
