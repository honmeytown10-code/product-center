import React, { useMemo, useState } from 'react';
import { Info, Search, Square, CheckSquare, X } from 'lucide-react';

type StoreOption = {
  id: string;
  name: string;
};

type MethodRow = {
  id: string;
  storeId: string;
  methodName: string;
  methodValue: string;
  methodCode: string;
  remark: string;
  prompt: string;
  multiValue: boolean;
  optionType: '必选' | '非必选';
  enabled: boolean;
};

const STORE_OPTIONS: StoreOption[] = [
  { id: 's1', name: '测试-bcz' },
  { id: 's2', name: '南山万象店' },
  { id: 's3', name: '福田卓悦店' },
];

const INITIAL_METHOD_ROWS: MethodRow[] = [
  { id: 'r1', storeId: 's1', methodName: '温度哒', methodValue: '热', methodCode: '', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r2', storeId: 's1', methodName: '温度哒', methodValue: '少冰', methodCode: '', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r3', storeId: 's1', methodName: '温度哒', methodValue: '多冰', methodCode: '', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r4', storeId: 's1', methodName: '温度1111', methodValue: '冷', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r5', storeId: 's1', methodName: '温度1111', methodValue: '热', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r6', storeId: 's1', methodName: '温度1111', methodValue: '温', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r7', storeId: 's1', methodName: '温度1111', methodValue: '冰', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r8', storeId: 's1', methodName: '温度1111', methodValue: '少冰', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r9', storeId: 's1', methodName: '温度1111', methodValue: '多冰', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r10', storeId: 's1', methodName: '温度1111', methodValue: '正常冰', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r11', storeId: 's2', methodName: '甜度', methodValue: '七分糖', methodCode: 'sweet-7', remark: '区域门店自定义', prompt: '糖度调整后口感更佳', multiValue: false, optionType: '必选', enabled: false },
];

export const PosMethodView: React.FC = () => {
  const [methodRows, setMethodRows] = useState(INITIAL_METHOD_ROWS);
  const [activeStoreId, setActiveStoreId] = useState('s1');
  const [draftStoreId, setDraftStoreId] = useState('s1');
  const [keyword, setKeyword] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return methodRows.filter(row => {
      const matchStore = !activeStoreId || row.storeId === activeStoreId;
      const matchKeyword = !normalizedKeyword || [row.methodName, row.methodValue, row.methodCode, row.remark]
        .join(' ')
        .toLowerCase()
        .includes(normalizedKeyword);
      return matchStore && matchKeyword;
    });
  }, [activeStoreId, keyword, methodRows]);

  const allChecked = filteredRows.length > 0 && filteredRows.every(row => selectedIds.has(row.id));

  const currentStore = STORE_OPTIONS.find(item => item.id === draftStoreId);

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allChecked) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredRows.forEach(row => next.delete(row.id));
        return next;
      });
      return;
    }

    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredRows.forEach(row => next.add(row.id));
      return next;
    });
  };

  const handleApplyFilters = () => {
    setActiveStoreId(draftStoreId);
    setKeyword(draftKeyword);
    setSelectedIds(new Set());
  };

  const handleResetFilters = () => {
    setDraftStoreId('');
    setActiveStoreId('');
    setDraftKeyword('');
    setKeyword('');
    setSelectedIds(new Set());
  };

  const updateEnabled = (ids: string[], enabled: boolean) => {
    const idSet = new Set(ids);
    setMethodRows(prev => prev.map(row => (idSet.has(row.id) ? { ...row, enabled } : row)));
  };

  const handleBatchUpdate = (enabled: boolean) => {
    if (selectedIds.size === 0) return;
    updateEnabled([...selectedIds], enabled);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex-1 overflow-auto bg-[#F5F6FA] p-6">
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-[#FAFAFA] px-6 py-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <FilterLabel label="机构门店">
              <div className="flex min-h-[42px] min-w-[320px] items-center rounded-lg border border-gray-200 bg-white px-3">
                {currentStore ? (
                  <div className="flex items-center rounded-md border border-[#D9F7E7] bg-[#F3FCF7] px-3 py-1 text-sm text-[#1F9D55]">
                    <span>{currentStore.name}</span>
                    <button
                      onClick={() => setDraftStoreId('')}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                      aria-label="清除机构门店"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={draftStoreId}
                    onChange={e => setDraftStoreId(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-500 outline-none"
                  >
                    <option value="">请选择机构门店</option>
                    {STORE_OPTIONS.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </FilterLabel>

            <FilterLabel label="做法名称">
              <div className="relative min-w-[280px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={draftKeyword}
                  onChange={e => setDraftKeyword(e.target.value)}
                  placeholder="请输入做法名称"
                  className="h-[42px] w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-[#00C06B]"
                />
              </div>
            </FilterLabel>

            <div className="flex items-center gap-4">
              <button
                onClick={handleApplyFilters}
                className="h-[42px] rounded-lg bg-[#00C06B] px-6 text-sm font-bold text-white hover:bg-[#00A35B]"
              >
                筛选
              </button>
              <button
                onClick={handleResetFilters}
                className="text-sm font-bold text-[#00C06B] hover:text-[#00A35B]"
              >
                清空筛选条件
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBatchUpdate(true)}
              disabled={selectedIds.size === 0}
              className="rounded-lg bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:bg-[#9DDDBB]"
            >
              批量启用
            </button>
            <button
              onClick={() => handleBatchUpdate(false)}
              disabled={selectedIds.size === 0}
              className="rounded-lg bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:bg-[#9DDDBB]"
            >
              批量禁用
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#F6FFFA] px-3 py-2 text-xs text-[#1F9D55]">
            <Info size={14} />
            <span>门店做法启用/禁用默认对该门店全部渠道生效，不区分渠道配置</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1380px] w-full border-collapse text-left">
            <thead className="bg-[#F7F8FA] text-sm font-bold text-[#333]">
              <tr>
                <th className="w-14 border-y border-gray-100 px-3 py-4">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-[#00C06B]">
                    {allChecked ? <CheckSquare size={18} className="text-[#00C06B]" /> : <Square size={18} />}
                  </button>
                </th>
                <th className="min-w-[130px] border-y border-gray-100 px-4 py-4">做法名称</th>
                <th className="min-w-[100px] border-y border-gray-100 px-4 py-4">做法值</th>
                <th className="min-w-[120px] border-y border-gray-100 px-4 py-4">做法标识码</th>
                <th className="min-w-[110px] border-y border-gray-100 px-4 py-4">备注</th>
                <th className="min-w-[120px] border-y border-gray-100 px-4 py-4">温馨提示</th>
                <th className="min-w-[120px] border-y border-gray-100 px-4 py-4">做法值多选</th>
                <th className="min-w-[110px] border-y border-gray-100 px-4 py-4">做法选项</th>
                <th className="min-w-[140px] border-y border-gray-100 px-4 py-4 text-center">是否启用</th>
                <th className="sticky right-0 z-20 min-w-[160px] border-y border-gray-100 bg-[#F7F8FA] px-4 py-4 text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.24)]">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {filteredRows.map(row => {
                const checked = selectedIds.has(row.id);
                return (
                  <tr key={row.id} className="group border-b border-gray-100 hover:bg-[#FCFFFD]">
                    <td className="px-3 py-4">
                      <button onClick={() => toggleSelected(row.id)} className="text-gray-400 hover:text-[#00C06B]">
                        {checked ? <CheckSquare size={18} className="text-[#00C06B]" /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-[15px] text-gray-700">{row.methodName}</td>
                    <td className="px-4 py-4 text-[15px] text-gray-700">{row.methodValue}</td>
                    <td className="px-4 py-4 text-[15px] text-gray-700">{row.methodCode || '-'}</td>
                    <td className="px-4 py-4 text-[15px] text-gray-500">{row.remark || '-'}</td>
                    <td className="px-4 py-4 text-[15px] text-gray-500">{row.prompt || '-'}</td>
                    <td className="px-4 py-4 text-[15px] text-gray-700">{row.multiValue ? '已开启' : '已关闭'}</td>
                    <td className="px-4 py-4 text-[15px] text-gray-700">{row.optionType}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <ToggleSwitch checked={row.enabled} onChange={checkedState => updateEnabled([row.id], checkedState)} />
                      </div>
                    </td>
                    <td className="sticky right-0 z-10 bg-white px-4 py-4 text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.24)] group-hover:bg-[#FCFFFD]">
                      <button className="text-[15px] font-medium text-[#00C06B] hover:text-[#00A35B]">
                        查看关联商品
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center text-sm text-gray-400">
                    暂无符合条件的门店做法数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FilterLabel = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3">
    <span className="shrink-0 text-sm font-medium text-gray-700">{label}：</span>
    {children}
  </div>
);

const ToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <button
    onClick={() => onChange(!checked)}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={checked ? '禁用做法' : '启用做法'}
    className={`relative inline-flex h-7 w-[46px] items-center rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00C06B]/20 ${
      checked
        ? 'border-[#00C06B] bg-[#00C06B]'
        : 'border-[#D9DDE3] bg-[#EEF1F4]'
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18)] transition-transform duration-200 ${
        checked ? 'translate-x-[18px]' : 'translate-x-0'
      }`}
    />
  </button>
);
