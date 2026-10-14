import React, { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { menuStoreName, type StoreMenuRecord } from './storeMenus';

// Prototype media upload; production should use the existing media-library upload service.
export const WebStoreMenuFormDialog: React.FC<{
  storeId: string;
  menu?: StoreMenuRecord;
  menus: StoreMenuRecord[];
  onCancel: () => void;
  onSave: (value: { name: string; icon?: string }) => void;
}> = ({ storeId, menu, menus, onCancel, onSave }) => {
  const [name, setName] = useState(menu?.name || '');
  const [icon, setIcon] = useState(menu?.icon || '');
  const [error, setError] = useState('');
  const [iconError, setIconError] = useState('');
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<FileReader | null>(null);
  const uploadVersion = useRef(0);
  const dialogRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => { uploadVersion.current++; readerRef.current?.abort(); previous?.focus(); };
  }, []);
  const close = () => {
    if ((uploading || name !== (menu?.name || '') || icon !== (menu?.icon || '')) && !window.confirm('菜单信息尚未保存，确认放弃修改？')) return;
    onCancel();
  };
  const upload = (file?: File) => {
    if (!file) return;
    const version = ++uploadVersion.current;
    readerRef.current?.abort();
    setIconError('');
    if (file.type && !file.type.startsWith('image/')) { setUploading(false); setIconError('请选择图片文件'); return; }
    setUploading(true);
    const reader = new FileReader();
    readerRef.current = reader;
    const fail = () => { if (version === uploadVersion.current) { setUploading(false); setIconError('图片读取失败，请重新选择'); } };
    reader.onerror = fail;
    reader.onload = () => {
      if (version !== uploadVersion.current) return;
      if (typeof reader.result !== 'string') { fail(); return; }
      const dataUrl = reader.result;
      const image = new Image();
      image.onerror = fail;
      image.onload = () => { if (version === uploadVersion.current) { setIcon(dataUrl); setUploading(false); } };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (uploading) return;
    const trimmed = name.trim();
    if (!trimmed) { setError('请输入菜单名称'); return; }
    if (menus.some(item => item.storeId === storeId && item.id !== menu?.id && item.name.toLowerCase() === trimmed.toLowerCase())) { setError('当前门店已存在同名菜单，请修改名称'); return; }
    onSave({ name: trimmed, icon: icon || undefined });
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
    if (event.key !== 'Tab') return;
    const controls = Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled)') || []) as HTMLElement[];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-6">
    <form ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="store-menu-form-title" onKeyDown={onKeyDown} onSubmit={save} className="flex max-h-[calc(100vh-48px)] w-[480px] max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
      <div className="flex shrink-0 items-center justify-between border-b border-[#E9EDF2] px-5 py-4"><h3 id="store-menu-form-title" className="text-[16px] font-semibold">{menu ? '编辑菜单' : '新建菜单'}</h3><button type="button" aria-label="关闭菜单编辑" onClick={close}><X size={18} className="text-[#667085]" /></button></div>
      <div className="space-y-4 overflow-auto no-scrollbar p-5 text-[13px]">
        <div className="flex gap-4"><span className="w-20 shrink-0 text-[#667085]">所属门店</span><span className="min-w-0 break-words">{menuStoreName(storeId)}</span></div>
        <label className="block"><span className="mb-2 block"><span className="text-[#D92D20]">* </span>菜单名称</span><input autoFocus aria-label="菜单名称" aria-invalid={!!error} aria-describedby={error ? 'menu-name-error' : undefined} value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="请输入菜单名称，如人气推荐" className="h-9 w-full rounded-md border border-[#DDE2E8] px-3 outline-none focus:border-[#00B460]" /></label>
        {error && <p id="menu-name-error" role="alert" className="text-[#D92D20]">{error}</p>}
        <div><div className="mb-2">菜单图标</div><div className="relative w-[100px]">
          <button type="button" disabled={uploading} aria-label={icon ? '更换菜单图标' : '上传菜单图标'} onClick={() => uploadRef.current?.click()} className="flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-md bg-[#F7F8FA] text-[#777] hover:bg-[#F0F1F3] disabled:opacity-50">{uploading ? <span role="status" className="text-[12px] text-[#667085]">读取中…</span> : icon ? <img src={icon} alt="菜单图标预览" className="h-full w-full object-contain" /> : <Plus size={24} strokeWidth={1.5} />}</button>
          {icon && !uploading && <button type="button" aria-label="移除菜单图标" title="移除图标" onClick={() => { setIcon(''); setIconError(''); }} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#DDE2E8] bg-white text-[#667085]"><X size={12} /></button>}
          <input ref={uploadRef} type="file" accept="image/*" aria-label="选择菜单图标文件" className="hidden" onChange={event => { upload(event.target.files?.[0]); event.target.value = ''; }} />
        </div><p className="mt-2 text-[12px] text-[#98A2B3]">建议尺寸：60*60px</p>{iconError && <p role="alert" className="mt-2 text-[#D92D20]">{iconError}</p>}</div>
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-[#E9EDF2] px-5 py-3"><button type="button" onClick={close} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px]">取消</button><button type="submit" disabled={uploading} className="h-9 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white disabled:opacity-50">{menu ? '保存' : '创建菜单'}</button></div>
    </form>
  </div>;
};
