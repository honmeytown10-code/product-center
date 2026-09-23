import React, { useMemo, useState } from 'react';
import { Building2, Check, ChevronDown, Search, Store, Tag, X } from 'lucide-react';

export type StoreScopeOption = {
  id: string;
  name: string;
  code: string;
  organization: string;
  tags: string[];
};

type ScopeTab = 'store' | 'organization' | 'tag';

type Props = {
  stores: StoreScopeOption[];
  value: string[];
  onChange: (storeIds: string[]) => void;
  widthClassName?: string;
};

const tabs: Array<{ id: ScopeTab; label: string; icon: React.ElementType }> = [
  { id: 'store', label: '门店', icon: Store },
  { id: 'organization', label: '机构', icon: Building2 },
  { id: 'tag', label: '标签', icon: Tag },
];

const toggleIds = (current: string[], ids: string[]) => {
  const allSelected = ids.every(id => current.includes(id));
  return allSelected ? current.filter(id => !ids.includes(id)) : Array.from(new Set([...current, ...ids]));
};

export const WebStoreScopeSelector: React.FC<Props> = ({
  stores,
  value,
  onChange,
  widthClassName = 'w-[190px]',
}) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ScopeTab>('store');
  const [keyword, setKeyword] = useState('');
  const [draftValue, setDraftValue] = useState<string[]>(value);

  const organizations = useMemo(() => Array.from(new Set(stores.map(store => store.organization))), [stores]);
  const tags = useMemo(() => Array.from(new Set(stores.flatMap(store => store.tags))), [stores]);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleStores = stores.filter(store =>
    !normalizedKeyword
      || `${store.name}${store.code}${store.organization}${store.tags.join('')}`.toLowerCase().includes(normalizedKeyword),
  );
  const visibleOrganizations = organizations.filter(item => !normalizedKeyword || item.toLowerCase().includes(normalizedKeyword));
  const visibleTags = tags.filter(item => !normalizedKeyword || item.toLowerCase().includes(normalizedKeyword));

  const openSelector = () => {
    setDraftValue(value);
    setKeyword('');
    setOpen(true);
  };

  const renderCheckbox = (checked: boolean) => (
    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-[#00B460] bg-[#00B460] text-white' : 'border-[#C9CDD4] bg-white'}`}>
      {checked && <Check size={12} strokeWidth={3} />}
    </span>
  );

  return (
    <div className={`relative shrink-0 ${widthClassName}`}>
      <button
        type="button"
        onClick={() => open ? setOpen(false) : openSelector()}
        aria-expanded={open}
        className={`flex h-8 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-[12px] ${open ? 'border-[#00B460] shadow-[0_0_0_2px_rgba(0,180,96,0.08)]' : 'border-[#C9CDD4]'}`}
      >
        <span className={value.length ? 'truncate text-[#1D2129]' : 'truncate text-[#98A2B3]'}>
          {value.length ? `已选 ${value.length} 家门店` : '请选择门店'}
        </span>
        <ChevronDown size={14} className={`ml-2 shrink-0 text-[#86909C] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[420] mt-1 w-[480px] overflow-hidden rounded-md border border-[#E5E6EB] bg-white shadow-[0_10px_32px_rgba(29,33,41,0.16)]">
          <div className="flex h-11 items-center border-b border-[#E5E6EB] bg-[#F7F8FA] px-1">
            {tabs.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setTab(item.id); setKeyword(''); }}
                  className={`flex h-10 flex-1 items-center justify-center gap-1.5 border-b-2 text-[13px] ${tab === item.id ? 'border-[#00B460] bg-white font-semibold text-[#00A35B]' : 'border-transparent text-[#4E5969]'}`}
                >
                  <Icon size={14} />{item.label}
                </button>
              );
            })}
          </div>

          <div className="p-3">
            <label className="flex h-9 items-center rounded-md border border-[#C9CDD4] bg-white px-3 focus-within:border-[#00B460]">
              <Search size={14} className="mr-2 shrink-0 text-[#86909C]" />
              <input
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
                placeholder={tab === 'store' ? '门店名称 / 编码 / ID' : tab === 'organization' ? '搜索机构' : '搜索标签'}
                className="min-w-0 flex-1 bg-transparent text-[12px] outline-none"
              />
              {keyword && <button type="button" onClick={() => setKeyword('')} aria-label="清空搜索"><X size={14} className="text-[#86909C]" /></button>}
            </label>

            <div className="mt-2 max-h-[300px] overflow-y-auto rounded-md border border-[#EEF0F3]">
              {tab === 'store' && visibleStores.map(store => {
                const checked = draftValue.includes(store.id);
                return (
                  <button key={store.id} type="button" onClick={() => setDraftValue(toggleIds(draftValue, [store.id]))} className="flex min-h-11 w-full items-center gap-3 border-b border-[#F0F1F2] px-3 py-2 text-left last:border-b-0 hover:bg-[#F7F8FA]">
                    {renderCheckbox(checked)}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-[#1D2129]">{store.name}</div>
                      <div className="mt-0.5 truncate text-[11px] text-[#86909C]">{store.code} · {store.organization}</div>
                    </div>
                  </button>
                );
              })}

              {tab === 'organization' && visibleOrganizations.map(organization => {
                const storeIds = stores.filter(store => store.organization === organization).map(store => store.id);
                const selectedCount = storeIds.filter(id => draftValue.includes(id)).length;
                const checked = selectedCount === storeIds.length;
                return (
                  <button key={organization} type="button" onClick={() => setDraftValue(toggleIds(draftValue, storeIds))} className="flex min-h-11 w-full items-center gap-3 border-b border-[#F0F1F2] px-3 py-2 text-left last:border-b-0 hover:bg-[#F7F8FA]">
                    {renderCheckbox(checked)}
                    <div className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#1D2129]">{organization}</div>
                    <span className="shrink-0 text-[11px] text-[#86909C]">{selectedCount ? `已选 ${selectedCount} / ` : ''}{storeIds.length} 家</span>
                  </button>
                );
              })}

              {tab === 'tag' && visibleTags.map(tag => {
                const storeIds = stores.filter(store => store.tags.includes(tag)).map(store => store.id);
                const selectedCount = storeIds.filter(id => draftValue.includes(id)).length;
                const checked = selectedCount === storeIds.length;
                return (
                  <button key={tag} type="button" onClick={() => setDraftValue(toggleIds(draftValue, storeIds))} className="flex min-h-11 w-full items-center gap-3 border-b border-[#F0F1F2] px-3 py-2 text-left last:border-b-0 hover:bg-[#F7F8FA]">
                    {renderCheckbox(checked)}
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#1D2129]">{tag}</span>
                    <span className="shrink-0 text-[11px] text-[#86909C]">{selectedCount ? `已选 ${selectedCount} / ` : ''}{storeIds.length} 家</span>
                  </button>
                );
              })}

              {((tab === 'store' && visibleStores.length === 0) || (tab === 'organization' && visibleOrganizations.length === 0) || (tab === 'tag' && visibleTags.length === 0)) && (
                <div className="flex h-28 items-center justify-center text-[12px] text-[#98A2B3]">没有符合条件的结果</div>
              )}
            </div>
          </div>

          <div className="flex h-12 items-center justify-between border-t border-[#E5E6EB] bg-[#FAFBFC] px-3">
            <span className="text-[12px] text-[#667085]">{draftValue.length ? `已选 ${draftValue.length} 家门店` : '暂未选择门店'}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDraftValue([])} className="h-8 rounded-md px-3 text-[12px] text-[#4E5969]">清空</button>
              <button type="button" onClick={() => setOpen(false)} className="h-8 rounded-md border border-[#C9CDD4] bg-white px-3 text-[12px] text-[#4E5969]">取消</button>
              <button type="button" onClick={() => { onChange(draftValue); setOpen(false); }} className="h-8 rounded-md bg-[#00B460] px-3 text-[12px] font-semibold text-white">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
