import React, { useMemo, useState } from 'react';
import { Info, Search, Square, CheckSquare, X, ChevronRight, ChevronDown, Circle, CheckCircle2 } from 'lucide-react';

type StoreOption = {
  id: string;
  name: string;
  code: string;
  merchantId: string;
  groupId: string;
  groupName: string;
  rootGroupId: string;
  rootGroupName: string;
  tags: string[];
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
  { id: 's1', name: '【杭州】技术测试账号', code: '870525145', merchantId: '1151703', groupId: 'g1-1', groupName: '测试品牌直营', rootGroupId: 'g1', rootGroupName: '测试品牌', tags: ['直营', '杭州'] },
  { id: 's2', name: '【成都】演示账号', code: '39914002', merchantId: '1151699', groupId: 'g1-1', groupName: '测试品牌直营', rootGroupId: 'g1', rootGroupName: '测试品牌', tags: ['直营', '成都'] },
  { id: 's3', name: '南山万象店', code: '80193701', merchantId: '1151573', groupId: 'g1-2', groupName: '华南区域', rootGroupId: 'g1', rootGroupName: '测试品牌', tags: ['加盟', '深圳'] },
  { id: 's4', name: '福田卓悦店', code: '39792129', merchantId: '1151570', groupId: 'g1-2', groupName: '华南区域', rootGroupId: 'g1', rootGroupName: '测试品牌', tags: ['直营', '深圳'] },
  { id: 's5', name: '运维备机示例门店', code: '1151569', merchantId: '1151569', groupId: 'g1-3', groupName: '品牌直营', rootGroupId: 'g1', rootGroupName: '测试品牌', tags: ['备用'] },
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
  const [activeStoreId, setActiveStoreId] = useState('');
  const [draftStoreId, setDraftStoreId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showStorePicker, setShowStorePicker] = useState(true);
  const [storePickerKeyword, setStorePickerKeyword] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('g1');

  const storeGroupTree = useMemo(() => {
    const rootGroups = [...new Map(
      STORE_OPTIONS.map(store => [
        store.rootGroupId,
        {
          id: store.rootGroupId,
          name: store.rootGroupName,
          children: [] as Array<{ id: string; name: string }>,
        },
      ])
    ).values()];

    rootGroups.forEach(root => {
      root.children = [...new Map(
        STORE_OPTIONS
          .filter(store => store.rootGroupId === root.id)
          .map(store => [store.groupId, { id: store.groupId, name: store.groupName }])
      ).values()];
    });

    return rootGroups;
  }, []);

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

  const currentStore = STORE_OPTIONS.find(item => item.id === activeStoreId);
  const storePickerRows = STORE_OPTIONS.filter(store => {
    const matchGroup = selectedGroupId ? (store.rootGroupId === selectedGroupId || store.groupId === selectedGroupId) : true;
    const normalizedKeyword = storePickerKeyword.trim().toLowerCase();
    const matchKeyword =
      !normalizedKeyword ||
      [store.name, store.code, store.merchantId].join(' ').toLowerCase().includes(normalizedKeyword);
    return matchGroup && matchKeyword;
  });

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
    setKeyword(draftKeyword);
    setSelectedIds(new Set());
  };

  const handleResetFilters = () => {
    setDraftKeyword('');
    setKeyword('');
    setSelectedIds(new Set());
  };

  const handleConfirmStore = () => {
    if (!draftStoreId) return;
    setActiveStoreId(draftStoreId);
    setShowStorePicker(false);
    setSelectedIds(new Set());
  };

  const handleOpenStorePicker = () => {
    setDraftStoreId(activeStoreId || draftStoreId);
    setStorePickerKeyword('');
    setSelectedGroupId(STORE_OPTIONS.find(store => store.id === (activeStoreId || draftStoreId))?.rootGroupId || 'g1');
    setShowStorePicker(true);
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
    <>
      <div className="flex-1 overflow-auto bg-[#F5F6FA] p-6">
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-[#FAFAFA] px-6 py-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <FilterLabel label="机构门店">
              <div className="flex min-h-[42px] min-w-[320px] items-center justify-between rounded-lg border border-gray-200 bg-white px-3">
                {currentStore ? (
                  <div className="flex items-center rounded-md border border-[#D9F7E7] bg-[#F3FCF7] px-3 py-1 text-sm text-[#1F9D55]">
                    <span>{currentStore.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">请选择机构门店</span>
                )}
                <button
                  onClick={handleOpenStorePicker}
                  className="ml-3 text-sm font-bold text-[#00C06B] hover:text-[#00A35B]"
                >
                  更换门店
                </button>
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
      {showStorePicker && (
        <StorePickerModal
          groups={storeGroupTree}
          stores={storePickerRows}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          selectedStoreId={draftStoreId}
          onSelectStore={setDraftStoreId}
          searchValue={storePickerKeyword}
          onSearchChange={setStorePickerKeyword}
          onCancel={() => setShowStorePicker(false)}
          onConfirm={handleConfirmStore}
          disableCancel={!activeStoreId}
        />
      )}
    </>
  );
};

const StorePickerModal = ({
  groups,
  stores,
  selectedGroupId,
  onSelectGroup,
  selectedStoreId,
  onSelectStore,
  searchValue,
  onSearchChange,
  onCancel,
  onConfirm,
  disableCancel,
}: {
  groups: Array<{ id: string; name: string; children: Array<{ id: string; name: string }> }>;
  stores: StoreOption[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  disableCancel: boolean;
}) => {
  const selectedStore = stores.find(store => store.id === selectedStoreId) || null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[1120px] rounded-[16px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-6 py-4">
          <div className="text-[28px] font-black text-[#1F2129]">请选择需要管理的门店</div>
          {!disableCancel ? (
            <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]">
              <X size={22} />
            </button>
          ) : (
            <div className="w-[22px]"></div>
          )}
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A6AEBE]" />
              <input
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="请输入门店名称/编码/ID"
                className="h-[42px] w-full rounded-[10px] border border-[#E5EAF1] bg-white pl-9 pr-3 text-sm text-[#1F2129] outline-none focus:border-[#00C06B]"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[260px_minmax(0,1fr)] gap-4">
            <div className="rounded-[12px] border border-[#EEF1F5] bg-white">
              <div className="border-b border-[#F1F3F7] px-4 py-3 text-sm font-bold text-[#1F2129]">门店组</div>
              <div className="max-h-[340px] overflow-y-auto no-scrollbar py-2">
                {groups.map(group => {
                  const activeRoot = selectedGroupId === group.id;
                  return (
                    <div key={group.id}>
                      <button
                        onClick={() => onSelectGroup(group.id)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                          activeRoot ? 'bg-[#EAF7F0] text-[#16A34A]' : 'text-[#3C4353] hover:bg-[#FAFBFC]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown size={16} className={activeRoot ? 'text-[#16A34A]' : 'text-[#94A3B8]'} />
                          <span className="font-bold">{group.name}</span>
                        </div>
                        <span className={`text-xs font-bold ${activeRoot ? 'text-[#16A34A]' : 'text-[#B6BDCA]'}`}>品牌+</span>
                      </button>
                      {group.children.map(child => {
                        const activeChild = selectedGroupId === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => onSelectGroup(child.id)}
                            className={`flex w-full items-center justify-between pl-10 pr-4 py-3 text-left text-sm transition-colors ${
                              activeChild ? 'bg-[#F1FCF4] text-[#16A34A]' : 'text-[#3C4353] hover:bg-[#FAFBFC]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight size={14} className={activeChild ? 'text-[#16A34A]' : 'text-[#94A3B8]'} />
                              <span className="font-medium">{child.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[12px] border border-[#EEF1F5] bg-white">
              <div className="grid grid-cols-[56px_minmax(0,1fr)_220px_180px] border-b border-[#F1F3F7] px-4 py-3 text-sm font-bold text-[#5B6475]">
                <div></div>
                <div>门店名称</div>
                <div>门店 ID</div>
                <div>门店编码</div>
              </div>
              <div className="max-h-[340px] overflow-y-auto no-scrollbar">
                {stores.map(store => {
                  const checked = selectedStoreId === store.id;
                  return (
                    <button
                      key={store.id}
                      onClick={() => onSelectStore(store.id)}
                      className={`grid w-full grid-cols-[56px_minmax(0,1fr)_220px_180px] items-center border-b border-[#F5F7FA] px-4 py-4 text-left text-sm transition-colors ${
                        checked ? 'bg-[#F1FCF4]' : 'hover:bg-[#FCFDFE]'
                      }`}
                    >
                      <div className="flex justify-center">
                        {checked ? <CheckCircle2 size={18} className="text-[#00C06B]" /> : <Circle size={18} className="text-[#C7CEDA]" />}
                      </div>
                      <div className="font-medium text-[#1F2129]">{store.name}</div>
                      <div className="text-[#4B5565]">{store.merchantId}</div>
                      <div className="text-[#4B5565]">{store.code}</div>
                    </button>
                  );
                })}
                {!stores.length ? (
                  <div className="px-4 py-14 text-center text-sm text-[#98A0B3]">暂无符合条件的门店</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#EEF1F5] px-6 py-4">
          <div className="text-sm text-[#5B6475]">
            已选择：
            <span className="ml-1 font-bold text-[#1F2129]">{selectedStore ? selectedStore.name : '未选择门店'}</span>
          </div>
          <div className="flex items-center gap-3">
            {!disableCancel ? (
              <button
                onClick={onCancel}
                className="rounded-[10px] border border-[#E5EAF1] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]"
              >
                取消
              </button>
            ) : null}
            <button
              onClick={onConfirm}
              disabled={!selectedStoreId}
              className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9DDDBB]"
            >
              确定
            </button>
          </div>
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
