import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, MinusCircle, Plus, Trash2 } from 'lucide-react';
import type { LocalMethod } from './types';
import { associatedMethodConfig, enablesStoreDisabledMethod, methodAvailabilityChanged, methodConfigError, methodToggleBlockReason, PRODUCT_METHOD_TOGGLE_PERMISSION, STORE_METHOD_DISABLED_MESSAGE, ProductMethodConfig, visibleMethodConfig } from './productMethodState';
import { MobileProductMethodSelector } from './MobileProductMethodSelector';

export function MethodDiscardDialog({ onCancel, onDiscard, description, title = '放弃本次修改？', confirmText = '放弃修改' }: { onCancel: () => void; onDiscard: () => void; description: string; title?: string; confirmText?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby="method-discard-title" onCancel={event => { event.preventDefault(); onCancel(); }} className="m-auto w-[min(320px,calc(100%-48px))] rounded-2xl bg-white p-5 text-gray-800 backdrop:bg-black/40">
    <h3 id="method-discard-title" className="text-base font-bold">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
    <div className="mt-5 flex gap-3">
      <button autoFocus onClick={onCancel} className="h-11 flex-1 rounded-xl border border-gray-300 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">{confirmText === '移除' ? '取消' : '继续编辑'}</button>
      <button onClick={onDiscard} className="h-11 flex-1 rounded-xl bg-[#00C06B] text-sm font-bold text-gray-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">{confirmText}</button>
    </div>
  </dialog>;
}

export function MobileProductMethodEditor({ productName, storeName, config, library, onBack, onConfirm, mode = 'edit', canToggleMethods = true }: {
  productName: string;
  storeName: string;
  config: ProductMethodConfig[];
  library: LocalMethod[];
  onBack: () => void;
  onConfirm: (next: ProductMethodConfig[], library: LocalMethod[]) => void;
  mode?: 'create' | 'edit';
  canToggleMethods?: boolean;
}) {
  const [draft, setDraft] = useState<ProductMethodConfig[]>(() => structuredClone(config));
  const [definitions, setDefinitions] = useState(() => structuredClone(library));
  const [selecting, setSelecting] = useState(mode === 'create' && !visibleMethodConfig(config, library).length);
  const [removal, setRemoval] = useState<{ groupId: string; valueId?: string; name: string } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; attempt: number } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  const showToast = (message: string) => setToast(previous => ({ message, attempt: (previous?.attempt ?? 0) + 1 }));
  const changed = JSON.stringify(draft) !== JSON.stringify(config) || JSON.stringify(definitions) !== JSON.stringify(library);
  const visible = associatedMethodConfig(draft, definitions);
  const toggle = (groupId: string, valueId: string) => {
    const nextEnabled = draft.find(group => group.groupId === groupId)?.disabledValueIds.includes(valueId) ?? false;
    const message = methodToggleBlockReason(library, groupId, valueId, canToggleMethods, nextEnabled);
    if (message) { showToast(message); return; }
    setDraft(previous => previous.map(group => group.groupId !== groupId ? group : {
      ...group,
      disabledValueIds: group.disabledValueIds.includes(valueId) ? group.disabledValueIds.filter(id => id !== valueId) : [...group.disabledValueIds, valueId],
    }));
    setError('');
  };
  const confirm = () => {
    if (!canToggleMethods && methodAvailabilityChanged(config, draft)) {
      showToast(PRODUCT_METHOD_TOGGLE_PERMISSION.deniedMessage);
      return;
    }
    if (enablesStoreDisabledMethod(config, draft, library)) { showToast(STORE_METHOD_DISABLED_MESSAGE); return; }
    const message = methodConfigError(draft, definitions);
    if (message) { setError(message); return; }
    onConfirm(draft, definitions);
  };

  return <section aria-label="商品做法设置页" className="absolute inset-0 z-[100] flex flex-col overflow-hidden bg-[#F5F6FA] text-gray-800">
    <header className="flex h-[50px] shrink-0 items-center border-b border-gray-100 bg-white px-4">
      <button aria-label="返回商品编辑" onClick={() => changed ? setLeaving(true) : onBack()} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700"><ChevronLeft size={24} /></button>
      <h2 className="mr-9 flex-1 text-center text-base font-bold">商品做法</h2>
    </header>
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
      <div className="mb-4 px-1">
        <h3 className="break-words text-base font-bold">{productName || '当前商品'}</h3>
        <p className="mt-1 text-xs leading-5 text-gray-600">{storeName} · 仅影响此商品</p>
        <p className="mt-2 text-xs leading-5 text-gray-600">如需加价请填写金额，默认 0 元。{mode === 'edit' ? '禁用不删除做法。' : ''}</p>
      </div>
      {!visible.length ? <div className="rounded-2xl bg-white px-5 py-10 text-center"><p className="text-sm font-bold">暂无关联做法</p><button onClick={() => setSelecting(true)} className="mt-4 inline-flex h-11 items-center gap-1 rounded-lg border border-gray-200 px-4 text-sm font-medium text-green-700"><Plus size={16} />新增做法</button></div> : <div className="space-y-4">
        {visible.map(group => {
          const definition = definitions.find(item => item.id === group.groupId)!;
          const values = definition.values.filter(value => group.valueIds.includes(value.id));
          return <section key={group.groupId} aria-label={`${definition.name}做法`} className="overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <h3 className="break-words text-sm font-bold">{definition.name}</h3>
              <div className="flex shrink-0 items-center gap-1">{group.required && <span className="text-[11px] text-gray-600">必选</span>}<button aria-label={`移除${definition.name}整组`} onClick={() => setRemoval({ groupId: group.groupId, name: definition.name })} className="flex h-11 w-8 items-center justify-center text-gray-500"><Trash2 size={16} /></button></div>
            </div>
            <div className="flex items-center gap-2 px-3 pb-1 pt-3 text-[11px] text-gray-600"><span className="min-w-0 flex-1">做法名称</span><span className="w-[70px] shrink-0 text-center">加价（元）</span>{mode === 'edit' && <span className="w-10 shrink-0 text-center">启用</span>}<span className="w-7 shrink-0" /></div>
            {values.map(value => {
              const storeDisabled = library.find(item => item.id === group.groupId)?.values.find(item => item.id === value.id)?.status === 'inactive';
              const enabled = !group.disabledValueIds.includes(value.id);
              return <div key={value.id} className="flex min-h-[64px] items-center gap-2 border-b border-gray-100 px-3 py-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="break-words text-sm font-medium">{value.name}</span>{group.defaultValueId === value.id && <span className="text-xs text-gray-600">默认</span>}</div>
                  {mode === 'edit' && storeDisabled && <p className="mt-1 text-[11px] text-gray-500">门店已禁用</p>}
                </div>
                <input aria-label={`${definition.name} ${value.name} 加价`} inputMode="decimal" placeholder="0" value={group.valuePrices?.[value.id] ?? ''} onChange={event => { const price = event.target.value; setDraft(previous => previous.map(item => item.groupId !== group.groupId ? item : { ...item, valuePrices: { ...item.valuePrices, [value.id]: price } })); setError(''); }} className="h-10 w-[70px] shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2 text-right text-sm tabular-nums outline-green-700 placeholder:text-gray-500" />
                {mode === 'edit' && <button type="button" role="switch" aria-label={`${definition.name} ${value.name}`} aria-checked={enabled} aria-disabled={(storeDisabled && !enabled) || !canToggleMethods || undefined} onClick={() => toggle(group.groupId, value.id)} className={`relative h-11 w-10 shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${!canToggleMethods ? 'opacity-50' : ''}`}>
                  <span aria-hidden="true" className={`absolute inset-x-0 top-1/2 h-6 -translate-y-1/2 rounded-full transition-colors motion-reduce:transition-none ${enabled ? 'bg-[#00C06B]' : 'bg-gray-300'}`} />
                  <span aria-hidden="true" className={`absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-[left] motion-reduce:transition-none ${enabled ? 'left-[19px]' : 'left-[3px]'}`} />
                </button>}
                <button aria-label={`移除${definition.name} ${value.name}`} onClick={() => setRemoval({ groupId: group.groupId, valueId: value.id, name: value.name })} className="flex h-11 w-7 shrink-0 items-center justify-center text-red-600"><MinusCircle size={18} /></button>
              </div>;
            })}
          </section>;
        })}
      </div>}
      <p className="mt-4 px-1 text-[11px] leading-5 text-gray-500">原型演示，未连接生产数据。</p>
    </div>
    <footer className="shrink-0 border-t border-gray-100 bg-white px-4 pb-7 pt-3">
      {error && <p role="alert" className="mb-2 text-xs leading-5 text-red-700">{error}</p>}
      <p className="mb-2 text-center text-xs leading-5 text-gray-600">保存后返回，保存商品后生效</p>
      <div className="flex gap-3"><button onClick={() => setSelecting(true)} className="h-12 flex-1 rounded-xl border border-gray-200 bg-white text-sm font-bold">新增做法</button><button onClick={confirm} className="h-12 flex-1 rounded-xl bg-[#00C06B] text-sm font-bold text-gray-950 active:bg-[#00A35B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">保存</button></div>
    </footer>
    {toast && <div key={toast.attempt} role="status" aria-live="polite" className="pointer-events-none absolute inset-x-4 bottom-36 z-[210] rounded-xl bg-gray-900 px-4 py-3 text-center text-xs leading-5 text-white shadow-lg">{toast.message}</div>}
    {leaving && <MethodDiscardDialog onCancel={() => setLeaving(false)} onDiscard={onBack} description="尚未确认的做法修改不会回填商品表单。" />}
    {removal && <MethodDiscardDialog title={`移除“${removal.name}”？`} confirmText="移除" onCancel={() => setRemoval(null)} onDiscard={() => {
      setDraft(previous => previous.flatMap(group => {
        if (group.groupId !== removal.groupId) return [group];
        if (!removal.valueId) return [];
        const ids = group.valueIds.filter(id => id !== removal.valueId);
        if (!ids.length) return [];
        return [{ ...group, valueIds: ids, disabledValueIds: group.disabledValueIds.filter(id => id !== removal.valueId), valuePrices: Object.fromEntries(Object.entries(group.valuePrices ?? {}).filter(([id]) => id !== removal.valueId)), defaultValueId: group.defaultValueId === removal.valueId ? undefined : group.defaultValueId }];
      }));
      setRemoval(null); setError('');
    }} description="仅移除当前商品的关联，不删除公共做法；保存商品后生效。" />}
    {selecting && <MobileProductMethodSelector config={draft} library={definitions} onBack={() => !changed && mode === 'create' && !config.length ? onBack() : setSelecting(false)} onConfirm={(next, nextLibrary) => { setDraft(next); setDefinitions(nextLibrary); setSelecting(false); setError(''); }} />}
  </section>;
}
