import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, ChevronDown, ArrowUpDown, ChevronLeft,
  ChevronRight, GripVertical, CheckCircle2, X, Circle, Plus, Minus
} from 'lucide-react';

type StoreCategoryRecord = {
  id: string;
  storeId: string;
  storeName: string;
  channelId: string;
  level: 1 | 2;
  parentCode?: string;
  parentName?: string;
  sortIndex: number;
  iconText: string;
  name: string;
  alias: string;
  code: string;
  tag: string;
  requiredGroup: boolean;
  displayChannels: string[];
  limitTop: boolean;
};

type StoreCategoryListRow = StoreCategoryRecord & {
  sourceIds: string[];
  channelIds: string[];
};

type StoreCategoryEditorDraft = Omit<StoreCategoryListRow, 'channelId'> & {
  channelId: string;
  categoryLabel: string;
  remark: string;
  shelfChannels: string[];
  saleTypes: string[];
  displayChannels: string[];
  shelfTime: 'all_day' | 'custom';
  limitTop: boolean;
  onlyBackstageGroup: boolean;
  classicMenuHidden: boolean;
  notOrderAlone: boolean;
  queueSetting: 'join' | 'skip';
  orderLimit: 'participate' | 'not_participate';
};

type SecondaryCategoryEditorDraft = {
  id: string;
  sourceIds: string[];
  parentCode: string;
  parentName: string;
  name: string;
  alias: string;
  sortIndex: number;
};

type CategorySortDraftRow = {
  id: string;
  code: string;
  name: string;
  sortIndex: number;
};

type StoreOption = {
  id: string;
  name: string;
  code: string;
  merchantId: string;
  groupId: string;
  groupName: string;
  rootGroupId: string;
  rootGroupName: string;
};

const STORE_OPTIONS: StoreOption[] = [
  { id: 's1', name: '南山万象店', code: '870525145', merchantId: '1151703', groupId: 'g1-1', groupName: '华南区域', rootGroupId: 'g1', rootGroupName: '测试品牌' },
  { id: 's2', name: '福田卓悦店', code: '39914002', merchantId: '1151699', groupId: 'g1-1', groupName: '华南区域', rootGroupId: 'g1', rootGroupName: '测试品牌' },
  { id: 's3', name: '宝安壹方城店', code: '80193701', merchantId: '1151573', groupId: 'g1-2', groupName: '直营门店', rootGroupId: 'g1', rootGroupName: '测试品牌' },
  { id: 's4', name: '龙华红山店', code: '39792129', merchantId: '1151570', groupId: 'g1-2', groupName: '直营门店', rootGroupId: 'g1', rootGroupName: '测试品牌' },
];

const CHANNEL_DEFS: Record<string, { label: string; color: string }> = {
  pos: { label: 'POS', color: 'bg-blue-100 text-blue-700' },
  mini_dine: { label: '小程序-堂食', color: 'bg-[#00C06B]/10 text-[#00C06B]' },
  mini_take: { label: '小程序-外卖', color: 'bg-[#00C06B]/10 text-[#00C06B]' },
  meituan: { label: '美团-外卖', color: 'bg-yellow-100 text-yellow-700' },
  taobao: { label: '淘宝闪购', color: 'bg-orange-100 text-orange-700' },
  eleme: { label: '饿了么', color: 'bg-blue-100 text-blue-600' },
};

const DISPLAY_CHANNEL_DEFS: Record<string, { label: string; shortLabel: string; className: string }> = {
  wechat_mini: { label: '微信小程序', shortLabel: '微', className: 'bg-[#DDF5D8] text-[#22C55E]' },
  alipay_mini: { label: '支付宝小程序', shortLabel: '支', className: 'bg-[#DDEEFF] text-[#3B82F6]' },
  douyin_mini: { label: '抖音小程序', shortLabel: '抖', className: 'bg-[#F5E8FF] text-[#8B5CF6]' },
  qimai_app: { label: '企迈数店 app&企迈数店POS', shortLabel: '企', className: 'bg-[#EAF7F0] text-[#00A35B]' },
  qimai_h5: { label: '企迈H5', shortLabel: 'H5', className: 'bg-[#FFF4D6] text-[#D97706]' },
};

const DEFAULT_CHANNELS = [
  { id: 'mini_dine', label: '小程序-堂食' },
  { id: 'mini_take', label: '小程序-外卖' },
  { id: 'meituan', label: '美团-外卖' },
  { id: 'taobao', label: '淘宝闪购' },
  { id: 'pos', label: 'POS' },
];

const MOCK_STORE_CATEGORIES: StoreCategoryRecord[] = [
  { id: 'c-001', storeId: 's1', storeName: '南山万象店', channelId: 'mini_dine', level: 1, sortIndex: 1, iconText: '奶', name: '奶茶系列', alias: '现萃好茶', code: 'milk-tea', tag: '热销', requiredGroup: false, displayChannels: ['wechat_mini', 'alipay_mini', 'douyin_mini', 'qimai_app'], limitTop: false },
  { id: 'c-002', storeId: 's1', storeName: '南山万象店', channelId: 'mini_take', level: 1, sortIndex: 1, iconText: '奶', name: '奶茶系列', alias: '现萃好茶', code: 'milk-tea', tag: '热销', requiredGroup: false, displayChannels: ['wechat_mini', 'alipay_mini', 'douyin_mini', 'qimai_app'], limitTop: false },
  { id: 'c-001-1', storeId: 's1', storeName: '南山万象店', channelId: 'mini_dine', level: 2, parentCode: 'milk-tea', parentName: '奶茶系列', sortIndex: 1, iconText: '子', name: '经典奶茶', alias: '经典回味', code: 'milk-tea-classic', tag: '招牌', requiredGroup: false, displayChannels: ['wechat_mini', 'qimai_app'], limitTop: false },
  { id: 'c-001-2', storeId: 's1', storeName: '南山万象店', channelId: 'mini_take', level: 2, parentCode: 'milk-tea', parentName: '奶茶系列', sortIndex: 1, iconText: '子', name: '经典奶茶', alias: '经典回味', code: 'milk-tea-classic', tag: '招牌', requiredGroup: false, displayChannels: ['wechat_mini', 'qimai_app'], limitTop: false },
  { id: 'c-001-3', storeId: 's1', storeName: '南山万象店', channelId: 'mini_dine', level: 2, parentCode: 'milk-tea', parentName: '奶茶系列', sortIndex: 2, iconText: '子', name: '鲜果奶茶', alias: '鲜果轻乳', code: 'milk-tea-fruit', tag: '', requiredGroup: false, displayChannels: ['wechat_mini'], limitTop: false },
  { id: 'c-001-4', storeId: 's1', storeName: '南山万象店', channelId: 'mini_take', level: 2, parentCode: 'milk-tea', parentName: '奶茶系列', sortIndex: 2, iconText: '子', name: '鲜果奶茶', alias: '鲜果轻乳', code: 'milk-tea-fruit', tag: '', requiredGroup: false, displayChannels: ['wechat_mini'], limitTop: false },
  { id: 'c-003', storeId: 's1', storeName: '南山万象店', channelId: 'mini_take', level: 1, sortIndex: 2, iconText: '果', name: '果茶系列', alias: '新鲜果香', code: 'fruit-tea', tag: '推荐', requiredGroup: true, displayChannels: ['wechat_mini', 'qimai_app'], limitTop: true },
  { id: 'c-003-1', storeId: 's1', storeName: '南山万象店', channelId: 'mini_take', level: 2, parentCode: 'fruit-tea', parentName: '果茶系列', sortIndex: 1, iconText: '子', name: '鲜柠果茶', alias: '鲜柠清爽', code: 'fruit-tea-lemon', tag: '', requiredGroup: false, displayChannels: ['wechat_mini'], limitTop: false },
  { id: 'c-004', storeId: 's1', storeName: '南山万象店', channelId: 'mini_dine', level: 1, sortIndex: 3, iconText: '咖', name: '咖啡系列', alias: '每日现磨', code: 'coffee', tag: '新品', requiredGroup: false, displayChannels: ['wechat_mini', 'alipay_mini', 'qimai_app'], limitTop: false },
  { id: 'c-005', storeId: 's2', storeName: '福田卓悦店', channelId: 'pos', level: 1, sortIndex: 1, iconText: '甜', name: '甜品系列', alias: '今日甜点', code: 'dessert', tag: '甜品', requiredGroup: false, displayChannels: ['qimai_app'], limitTop: false },
  { id: 'c-006', storeId: 's3', storeName: '宝安壹方城店', channelId: 'meituan', level: 1, sortIndex: 1, iconText: '早', name: '早餐系列', alias: '元气早餐', code: 'breakfast', tag: '早餐', requiredGroup: false, displayChannels: ['wechat_mini', 'alipay_mini'], limitTop: false },
  { id: 'c-007', storeId: 's4', storeName: '龙华红山店', channelId: 'taobao', level: 1, sortIndex: 1, iconText: '夜', name: '夜宵系列', alias: '深夜食堂', code: 'supper', tag: '夜宵', requiredGroup: true, displayChannels: ['wechat_mini', 'qimai_h5'], limitTop: false },
];

const FilterInput = ({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex items-center">
    <span className="text-xs text-[#666] mr-2 shrink-0">{label}</span>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-[170px] h-[34px] px-3 border border-[#E8E8E8] rounded text-sm focus:border-[#00C06B] focus:outline-none transition-colors"
      placeholder={placeholder}
    />
  </div>
);

export const WebStoreCategoryList: React.FC<{ onCancelEntry?: () => void }> = ({ onCancelEntry }) => {
  const [activeTabId, setActiveTabId] = useState('all');
  const [activeStoreId, setActiveStoreId] = useState('');
  const [draftStoreId, setDraftStoreId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categories, setCategories] = useState(MOCK_STORE_CATEGORIES);
  const [editingCategory, setEditingCategory] = useState<StoreCategoryEditorDraft | null>(null);
  const [editingSecondCategory, setEditingSecondCategory] = useState<SecondaryCategoryEditorDraft | null>(null);
  const [showAliasExample, setShowAliasExample] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortDraftRows, setSortDraftRows] = useState<CategorySortDraftRow[]>([]);
  const [expandedParentCodes, setExpandedParentCodes] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showStorePicker, setShowStorePicker] = useState(true);
  const [storePickerKeyword, setStorePickerKeyword] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('g1');
  const [limitTimeSlots, setLimitTimeSlots] = useState([{ id: 'slot-1', startDate: '', endDate: '', startTime: '00:00', endTime: '23:59' }]);

  const tabs = useMemo(() => [{ id: 'all', label: '全部渠道' }, ...DEFAULT_CHANNELS], []);
  const currentStore = STORE_OPTIONS.find(item => item.id === activeStoreId);
  const storeGroupTree = useMemo(() => {
    const rootGroups = [...new Map(
      STORE_OPTIONS.map(store => [
        store.rootGroupId,
        { id: store.rootGroupId, name: store.rootGroupName, children: [] as Array<{ id: string; name: string }> },
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

  const storePickerRows = useMemo(() => {
    return STORE_OPTIONS.filter(store => {
      const matchGroup = selectedGroupId ? (store.rootGroupId === selectedGroupId || store.groupId === selectedGroupId) : true;
      const keyword = storePickerKeyword.trim().toLowerCase();
      const matchKeyword = !keyword || [store.name, store.code, store.merchantId].join(' ').toLowerCase().includes(keyword);
      return matchGroup && matchKeyword;
    });
  }, [selectedGroupId, storePickerKeyword]);

  const scopedCategories = useMemo<StoreCategoryListRow[]>(() => {
    let next = categories.filter(item => item.storeId === activeStoreId);

    if (activeTabId !== 'all') {
      next = next.filter(item => item.channelId === activeTabId);
    }

    if (activeTabId === 'all') {
      const grouped = new Map<string, StoreCategoryListRow>();
      next.forEach(item => {
        const key = `${item.storeId}:${item.parentCode || 'root'}:${item.code}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.sourceIds.push(item.id);
          existing.channelIds = Array.from(new Set([...existing.channelIds, item.channelId]));
          existing.displayChannels = Array.from(new Set([...existing.displayChannels, ...item.displayChannels]));
          existing.sortIndex = Math.min(existing.sortIndex, item.sortIndex);
          return;
        }
        grouped.set(key, {
          ...item,
          id: key,
          sourceIds: [item.id],
          channelIds: [item.channelId],
        });
      });
      return [...grouped.values()];
    }

    return next.map(item => ({
      ...item,
      sourceIds: [item.id],
      channelIds: [item.channelId],
    }));
  }, [activeStoreId, activeTabId, categories]);

  const filteredCategories = useMemo<StoreCategoryListRow[]>(() => {
    const trimName = categoryName.trim().toLowerCase();
    const trimCode = categoryCode.trim().toLowerCase();
    const matchesKeyword = (item: StoreCategoryListRow) => {
      const matchName = !trimName || item.name.toLowerCase().includes(trimName) || item.parentName?.toLowerCase().includes(trimName);
      const matchCode = !trimCode || item.code.toLowerCase().includes(trimCode) || item.parentCode?.toLowerCase().includes(trimCode);
      return matchName && matchCode;
    };

    const matched = scopedCategories.filter(matchesKeyword);
    const visibleKeys = new Set(matched.map(item => `${item.parentCode || 'root'}:${item.code}`));
    const childParentCodes = new Set(matched.filter(item => item.level === 2).map(item => item.parentCode).filter(Boolean));

    const matchedWithParents = [...scopedCategories.filter(item => (
      visibleKeys.has(`${item.parentCode || 'root'}:${item.code}`)
      || (item.level === 1 && childParentCodes.has(item.code))
    ))];

    const parentRows = matchedWithParents
      .filter(item => item.level === 1)
      .sort((a, b) => a.sortIndex - b.sortIndex);

    const childrenByParent = matchedWithParents
      .filter(item => item.level === 2)
      .reduce((acc, item) => {
        const key = item.parentCode || 'root';
        if (!acc.has(key)) acc.set(key, []);
        acc.get(key)?.push(item);
        return acc;
      }, new Map<string, StoreCategoryListRow[]>());

    parentRows.forEach(item => {
      const children = childrenByParent.get(item.code);
      if (children) {
        children.sort((a, b) => a.sortIndex - b.sortIndex);
      }
    });

    return parentRows.flatMap(item => [item, ...(childrenByParent.get(item.code) || [])]);
  }, [categoryCode, categoryName, scopedCategories]);

  const sortablePrimaryCategories = useMemo<CategorySortDraftRow[]>(() => (
    scopedCategories
      .filter(item => item.level === 1)
      .sort((a, b) => a.sortIndex - b.sortIndex)
      .map(item => ({ id: item.id, code: item.code, name: item.name, sortIndex: item.sortIndex }))
  ), [scopedCategories]);
  const childCountByParent = useMemo(() => (
    scopedCategories.reduce((acc, item) => {
      if (item.level !== 2 || !item.parentCode) return acc;
      acc.set(item.parentCode, (acc.get(item.parentCode) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ), [scopedCategories]);
  const hasKeywordSearch = !!categoryName.trim() || !!categoryCode.trim();
  const autoExpandedParentCodes = useMemo(() => (
    new Set(
      filteredCategories
        .filter(item => item.level === 2 && item.parentCode)
        .map(item => item.parentCode as string)
    )
  ), [filteredCategories]);
  const visibleCategories = useMemo(() => (
    filteredCategories.filter(item => (
      item.level === 1
      || expandedParentCodes.includes(item.parentCode || '')
      || (hasKeywordSearch && autoExpandedParentCodes.has(item.parentCode || ''))
    ))
  ), [autoExpandedParentCodes, expandedParentCodes, filteredCategories, hasKeywordSearch]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    setExpandedParentCodes([]);
  }, [activeStoreId, activeTabId]);

  const openEditor = (item: StoreCategoryListRow) => {
    if (item.level === 2) {
      setEditingSecondCategory({
        id: item.id,
        sourceIds: item.sourceIds,
        parentCode: item.parentCode || '',
        parentName: item.parentName || '-',
        name: item.name,
        alias: item.alias,
        sortIndex: item.sortIndex,
      });
      return;
    }

    setEditingCategory({
      ...item,
      channelId: activeTabId === 'all' ? 'all' : item.channelId,
      categoryLabel: item.tag,
      remark: `${item.name} 备注`,
      shelfChannels: ['mini_dine', 'meituan', 'taobao', 'pos'],
      saleTypes: ['dine', 'takeout'],
      displayChannels: item.displayChannels,
      shelfTime: 'all_day',
      limitTop: item.limitTop,
      onlyBackstageGroup: false,
      classicMenuHidden: false,
      notOrderAlone: false,
      queueSetting: 'join',
      orderLimit: 'participate',
    });
  };

  const openSortModal = () => {
    setSortDraftRows(sortablePrimaryCategories.map((item, index) => ({
      ...item,
      sortIndex: index + 1,
    })));
    setShowSortModal(true);
  };

  const updateSortDraftRow = (rowId: string, nextPosition: number) => {
    setSortDraftRows(prev => {
      const currentIndex = prev.findIndex(item => item.id === rowId);
      if (currentIndex === -1) return prev;
      const nextIndex = Math.max(0, Math.min(prev.length - 1, nextPosition - 1));
      const nextRows = [...prev];
      const [moved] = nextRows.splice(currentIndex, 1);
      nextRows.splice(nextIndex, 0, moved);
      return nextRows.map((item, index) => ({ ...item, sortIndex: index + 1 }));
    });
  };

  const moveSortDraftRow = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;
    setSortDraftRows(prev => {
      const currentIndex = prev.findIndex(item => item.id === dragId);
      const targetIndex = prev.findIndex(item => item.id === targetId);
      if (currentIndex === -1 || targetIndex === -1) return prev;
      const nextRows = [...prev];
      const [moved] = nextRows.splice(currentIndex, 1);
      nextRows.splice(targetIndex, 0, moved);
      return nextRows.map((item, index) => ({ ...item, sortIndex: index + 1 }));
    });
  };

  const saveSort = () => {
    const sortMap = new Map(sortDraftRows.map(item => [item.code, item.sortIndex]));
    setCategories(prev => prev.map(item => (
      item.storeId === activeStoreId
      && item.level === 1
      && sortMap.has(item.code)
      && (activeTabId === 'all' || item.channelId === activeTabId)
        ? { ...item, sortIndex: sortMap.get(item.code) as number }
        : item
    )));
    setShowSortModal(false);
    setNotification({
      type: 'success',
      message: activeTabId === 'all'
        ? '门店商品分类排序已保存'
        : `${CHANNEL_DEFS[activeTabId]?.label || '当前渠道'} 分类排序保存成功`
    });
  };

  const updateEditingField = (field: keyof StoreCategoryEditorDraft, value: string | boolean | string[]) => {
    if (!editingCategory) return;
    setEditingCategory({ ...editingCategory, [field]: value } as StoreCategoryEditorDraft);
  };

  const saveEditing = () => {
    if (!editingCategory) return;
    const targetIds = new Set(editingCategory.sourceIds);
    setCategories(prev => prev.map(item => targetIds.has(item.id) ? {
      ...item,
      name: editingCategory.name,
      alias: editingCategory.alias,
      code: editingCategory.code,
      tag: editingCategory.categoryLabel || editingCategory.tag,
      requiredGroup: editingCategory.requiredGroup,
      displayChannels: editingCategory.displayChannels,
      limitTop: editingCategory.limitTop,
    } : item));
    setEditingCategory(null);
    setNotification({ type: 'success', message: '分类编辑已保存' });
  };

  const saveSecondCategory = () => {
    if (!editingSecondCategory) return;
    const targetIds = new Set(editingSecondCategory.sourceIds);
    setCategories(prev => prev.map(item => targetIds.has(item.id) ? {
      ...item,
      name: editingSecondCategory.name,
      alias: editingSecondCategory.alias,
      sortIndex: editingSecondCategory.sortIndex,
    } : item));
    setEditingSecondCategory(null);
    setNotification({ type: 'success', message: '二级分类编辑已保存' });
  };

  const toggleParentExpand = (parentCode: string) => {
    setExpandedParentCodes(prev => (
      prev.includes(parentCode)
        ? prev.filter(item => item !== parentCode)
        : [...prev, parentCode]
    ));
  };

  const handleConfirmStore = () => {
    if (!draftStoreId) return;
    setActiveStoreId(draftStoreId);
    setShowStorePicker(false);
  };

  const handleOpenStorePicker = () => {
    setDraftStoreId(activeStoreId || draftStoreId);
    setStorePickerKeyword('');
    setSelectedGroupId(STORE_OPTIONS.find(store => store.id === (activeStoreId || draftStoreId))?.rootGroupId || 'g1');
    setShowStorePicker(true);
  };

  const handleCancelStorePicker = () => {
    if (!activeStoreId && onCancelEntry) {
      onCancelEntry();
      return;
    }
    setShowStorePicker(false);
  };

  const renderNotification = () => (
    <>
      {notification && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
          <div className={`${notification.type === 'error' ? 'bg-[#FDECEC] border-[#F7C6C6] text-[#FF5C5C]' : 'bg-[#1F2129] border-gray-700 text-white'} px-5 py-3 rounded-xl shadow-2xl flex items-center border`}>
            <CheckCircle2 size={18} className={`mr-3 ${notification.type === 'error' ? 'text-[#FF5C5C]' : 'text-[#00C06B]'}`} />
            <span className="text-sm font-bold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className={`ml-4 ${notification.type === 'error' ? 'text-[#E58A8A] hover:text-[#FF5C5C]' : 'text-gray-500 hover:text-white'}`}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (editingCategory) {
    return (
      <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4 relative">
        {renderNotification()}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
          <div className="shrink-0 border-b border-[#E8E8E8] bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E8E8E8] text-[#666] transition-colors hover:border-[#00C06B] hover:text-[#00C06B]"
                >
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                <div>
                  <div className="text-lg font-bold text-[#1F2129]">编辑分类</div>
                  <div className="mt-1 text-xs text-[#999]">
                    当前门店：{editingCategory.storeName}，当前渠道：{editingCategory.channelId === 'all' ? '全部渠道' : (CHANNEL_DEFS[editingCategory.channelId]?.label || editingCategory.channelId)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditingCategory(null)}
                  className="px-5 py-2 rounded-lg border border-[#E8E8E8] text-sm text-[#333] hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={saveEditing}
                  className="px-5 py-2 rounded-lg bg-[#00C06B] text-white text-sm font-bold hover:bg-[#00A35B]"
                >
                  保存
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-[#F8FAFB] px-6 py-6">
            <div className="rounded-2xl bg-white border border-[#E8E8E8] p-6">
              <div className="space-y-8">
                {editingCategory.channelId === 'all' && (
                  <div className="rounded-xl border border-[#DDEFE4] bg-[#F3FCF7] px-4 py-3 text-sm text-[#1B9B5F]">
                    全部渠道下修改分类信息后将同步至所有渠道
                  </div>
                )}
                <div>
                  <div className="mb-5 text-lg font-bold text-[#1F2129]">基础信息</div>
                  <div className="grid grid-cols-[1fr_420px] gap-10">
                    <div className="space-y-4">
                      <div className="grid grid-cols-[88px_1fr] items-start gap-3">
                        <div className="pt-2 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>分类名称</div>
                        <div>
                          <input value={editingCategory.name} onChange={e => updateEditingField('name', e.target.value)} className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm focus:border-[#00C06B] focus:outline-none" />
                          <div className="mt-1 text-right text-xs text-[#999]">{editingCategory.name.length}/10</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-3">
                        <div className="pt-2 text-sm text-[#333]">分类别名</div>
                        <div>
                          <div className="relative">
                            <input
                              value={editingCategory.alias}
                              maxLength={10}
                              placeholder="请输入分类别名"
                              onChange={e => updateEditingField('alias', e.target.value.slice(0, 10))}
                              className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 pr-14 text-sm focus:border-[#00C06B] focus:outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#999]">{editingCategory.alias.length}/10</div>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-[#999]">
                            <span>用于补充说明分类，配置后将在小程序分类名称下方默认展示</span>
                            <button type="button" onClick={() => setShowAliasExample(true)} className="shrink-0 font-bold text-[#00A35B] hover:text-[#008F50]">查看示例</button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-3">
                        <div className="pt-2 text-sm text-[#333]">分类标识</div>
                        <div>
                          <input value={editingCategory.code} onChange={e => updateEditingField('code', e.target.value)} className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm focus:border-[#00C06B] focus:outline-none" />
                          <div className="mt-1 text-xs text-[#999]">用于外部对接的分类标识</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-3">
                        <div className="pt-2 text-sm text-[#333]">分类标签</div>
                        <select value={editingCategory.categoryLabel} onChange={e => updateEditingField('categoryLabel', e.target.value)} className="h-10 w-full rounded-lg border border-[#E8E8E8] bg-white px-3 text-sm focus:border-[#00C06B] focus:outline-none">
                          <option value="">请选择</option>
                          <option value="热销">热销</option>
                          <option value="推荐">推荐</option>
                          <option value="新品">新品</option>
                          <option value="早餐">早餐</option>
                          <option value="夜宵">夜宵</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-3">
                        <div className="pt-2 text-sm text-[#333]">分类备注</div>
                        <div>
                          <input value={editingCategory.remark} onChange={e => updateEditingField('remark', e.target.value)} className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm focus:border-[#00C06B] focus:outline-none" />
                          <div className="mt-1 text-right text-xs text-[#999]">{editingCategory.remark.length}/10</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-3">
                        <div className="pt-2 text-sm text-[#333]">图标</div>
                        <div>
                          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-xl bg-[#F7F8FA] text-3xl text-[#999]">+</div>
                          <div className="mt-2 text-xs text-[#999]">备注：建议图标尺寸：180px * 180px</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[88px_1fr] items-start gap-3">
                        <div className="pt-2 text-sm text-[#333]">分类banner</div>
                        <div>
                          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-xl bg-[#F7F8FA] text-3xl text-[#999]">+</div>
                          <div className="mt-2 text-xs text-[#999]">备注：建议图标尺寸：530px * 150px</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 text-base font-bold text-[#333]">小程序端预览</div>
                      <div className="rounded-2xl bg-[#F6F7FB] p-4">
                        <div className="flex h-[340px] gap-4 rounded-2xl bg-[#F2F3F7] p-4">
                          <div className="w-[92px] space-y-3">
                            <div className="h-[84px] rounded-xl bg-white/70 p-2 text-xs text-[#666] shadow-sm">
                               <div className="mb-2 h-10 w-10 rounded-lg bg-[#D1D5DB]" />
                               <div className="truncate">{editingCategory.name}</div>
                               {editingCategory.alias && <div className="mt-0.5 truncate text-[10px] text-[#98A2B3]">{editingCategory.alias}</div>}
                             </div>
                            <div className="h-[84px] rounded-xl bg-white/40" />
                          </div>
                          <div className="flex-1 rounded-xl bg-white p-4 shadow-sm">
                            <div className="mb-4">
                              <div className="text-lg font-bold text-[#333]">{editingCategory.name}</div>
                              {editingCategory.alias && <div className="mt-1 text-xs text-[#98A2B3]">{editingCategory.alias}</div>}
                            </div>
                            <div className="space-y-4">
                              <div className="h-16 rounded-xl bg-[#F7F8FA]" />
                              <div className="h-16 rounded-xl bg-[#F7F8FA]" />
                              <div className="h-16 rounded-xl bg-[#F7F8FA]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-5 text-lg font-bold text-[#1F2129]">分类设置</div>
                  <div className="space-y-5">
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="pt-1 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>展示渠道</div>
                      <div className="flex flex-wrap gap-6 rounded-xl bg-[#F7F8FA] px-5 py-4">
                        {[{ id: 'wechat_mini', label: '微信小程序' }, { id: 'alipay_mini', label: '支付宝小程序' }, { id: 'douyin_mini', label: '抖音小程序' }, { id: 'qimai_app', label: '企迈数店 app&企迈数店POS' }, { id: 'qimai_h5', label: '企迈H5' }].map(option => (
                          <label key={option.id} className={`flex items-center text-sm ${editingCategory.displayChannels.includes(option.id) ? 'text-[#00B96B]' : 'text-[#999]'}`}>
                            <input type="checkbox" checked={editingCategory.displayChannels.includes(option.id)} onChange={e => updateEditingField('displayChannels', e.target.checked ? [...editingCategory.displayChannels, option.id] : editingCategory.displayChannels.filter(item => item !== option.id))} className="mr-2 h-4 w-4 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="pt-1 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>上架时间</div>
                      <div className="flex items-center gap-8 py-2 text-sm">
                        <label className="flex items-center text-[#00B96B]">
                          <input type="radio" checked={editingCategory.shelfTime === 'all_day'} onChange={() => updateEditingField('shelfTime', 'all_day')} className="mr-2 h-4 w-4 accent-[#00C06B]" />
                          全时段售卖
                        </label>
                        <label className="flex items-center text-[#666]">
                          <input type="radio" checked={editingCategory.shelfTime === 'custom'} onChange={() => updateEditingField('shelfTime', 'custom')} className="mr-2 h-4 w-4 accent-[#00C06B]" />
                          自定义时间
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="pt-1 text-sm text-[#333]">限时置顶</div>
                      <div>
                        <button
                          onClick={() => updateEditingField('limitTop', !editingCategory.limitTop)}
                          className={`relative h-7 w-12 rounded-full transition-colors ${editingCategory.limitTop ? 'bg-[#00C06B]' : 'bg-[#D9DDE7]'}`}
                        >
                          <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${editingCategory.limitTop ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    </div>
                    {editingCategory.limitTop && (
                      <div className="grid grid-cols-[88px_1fr] gap-3">
                        <div></div>
                        <div className="rounded-xl bg-[#F7F8FA] px-5 py-4 text-sm text-[#666]">
                          <div className="grid grid-cols-[220px_24px_220px_auto] items-center gap-3">
                            <div className="h-11 rounded-lg border border-[#E5E7EB] bg-white px-4 leading-[44px] text-[#B0B7C3]">开始日期</div>
                            <div className="text-center">至</div>
                            <div className="h-11 rounded-lg border border-[#E5E7EB] bg-white px-4 leading-[44px] text-[#B0B7C3]">结束日期</div>
                            <div className="flex items-center gap-4 text-[#00A35B]">
                              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-[#00C06B]" />周一</label>
                              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-[#00C06B]" />周二</label>
                              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-[#00C06B]" />周三</label>
                              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-[#00C06B]" />周四</label>
                              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-[#00C06B]" />周五</label>
                            </div>
                          </div>
                          {limitTimeSlots.map(slot => <div key={slot.id} className="mt-3 grid grid-cols-[220px_24px_220px_auto] items-center gap-3">
                            <input type="time" value={slot.startTime} onChange={e => setLimitTimeSlots(current => current.map(item => item.id === slot.id ? { ...item, startTime: e.target.value } : item))} className="h-11 rounded-lg border border-[#E5E7EB] bg-white px-4" />
                            <div className="text-center">至</div>
                            <input type="time" value={slot.endTime} onChange={e => setLimitTimeSlots(current => current.map(item => item.id === slot.id ? { ...item, endTime: e.target.value } : item))} className="h-11 rounded-lg border border-[#E5E7EB] bg-white px-4" />
                            <button onClick={() => setLimitTimeSlots(current => current.filter(item => item.id !== slot.id))} disabled={limitTimeSlots.length === 1} className="justify-self-start text-[#00A35B] hover:underline disabled:cursor-not-allowed disabled:text-[#B8C0CC]">删除</button>
                          </div>)}
                          <button disabled={limitTimeSlots.length >= 3} onClick={() => setLimitTimeSlots(current => [...current, { id: `slot-${Date.now()}`, startDate: '', endDate: '', startTime: '00:00', endTime: '23:59' }])} className="mt-4 text-[#00A35B] hover:underline disabled:cursor-not-allowed disabled:text-[#B8C0CC]">+ 添加时间段（最多添加3个）</button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="pt-1 text-sm text-[#333]">其他设置</div>
                      <div className="rounded-xl bg-[#F7F8FA] px-5 py-4 text-sm">
                        <div className="space-y-5">
                          <label className="flex items-center justify-between max-w-[280px]">
                            <span>仅在后台展示此分组</span>
                            <input type="checkbox" checked={editingCategory.onlyBackstageGroup} onChange={e => updateEditingField('onlyBackstageGroup', e.target.checked)} className="h-5 w-9 rounded-full border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" />
                          </label>
                          <label className="flex items-center justify-between max-w-[280px]">
                            <span>经典菜单隐藏</span>
                            <input type="checkbox" checked={editingCategory.classicMenuHidden} onChange={e => updateEditingField('classicMenuHidden', e.target.checked)} className="h-5 w-9 rounded-full border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" />
                          </label>
                          <label className="flex items-center justify-between max-w-[280px]">
                            <span>必选分组</span>
                            <input type="checkbox" checked={editingCategory.requiredGroup} onChange={e => updateEditingField('requiredGroup', e.target.checked)} className="h-5 w-9 rounded-full border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" />
                          </label>
                          <div className="space-y-2">
                            <div className="font-medium text-[#333]">不可单独下单</div>
                            <div className="flex items-center gap-8">
                              <label className="flex items-center text-[#00B96B]">
                                <input type="radio" checked={!editingCategory.notOrderAlone} onChange={() => updateEditingField('notOrderAlone', false)} className="mr-2 h-4 w-4 accent-[#00C06B]" />
                                不启用
                              </label>
                              <label className="flex items-center text-[#666]">
                                <input type="radio" checked={editingCategory.notOrderAlone} onChange={() => updateEditingField('notOrderAlone', true)} className="mr-2 h-4 w-4 accent-[#00C06B]" />
                                启用
                              </label>
                            </div>
                            <div className="text-xs text-[#999]">若启用，则小程序下单时选购的商品仅包含该分组的商品时，则不可下单</div>
                          </div>
                          <div className="space-y-2">
                            <div className="font-medium text-[#333]">排队取餐</div>
                            <div className="flex items-center gap-8">
                              <label className="flex items-center text-[#00B96B]">
                                <input type="radio" checked={editingCategory.queueSetting === 'join'} onChange={() => updateEditingField('queueSetting', 'join')} className="mr-2 h-4 w-4 accent-[#00C06B]" />
                                进入排队
                              </label>
                              <label className="flex items-center text-[#666]">
                                <input type="radio" checked={editingCategory.queueSetting === 'skip'} onChange={() => updateEditingField('queueSetting', 'skip')} className="mr-2 h-4 w-4 accent-[#00C06B]" />
                                不进入排队
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="font-medium text-[#333]">订单购买限制</div>
                            <div className="flex items-center gap-8">
                              <label className="flex items-center text-[#00B96B]">
                                <input type="radio" checked={editingCategory.orderLimit === 'participate'} onChange={() => updateEditingField('orderLimit', 'participate')} className="mr-2 h-4 w-4 accent-[#00C06B]" />
                                参与
                              </label>
                              <label className="flex items-center text-[#666]">
                                <input type="radio" checked={editingCategory.orderLimit === 'not_participate'} onChange={() => updateEditingField('orderLimit', 'not_participate')} className="mr-2 h-4 w-4 accent-[#00C06B]" />
                                不参与
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {showAliasExample && <CategoryAliasExampleModal onClose={() => setShowAliasExample(false)} />}
      </div>
    );
  }

  return (
    <div className="pc-page relative flex min-w-0 flex-1 overflow-hidden bg-[#F0F2F5] p-3 font-sans">
      {renderNotification()}

      <div className="pc-surface flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <div className="border-b border-[#E8E8E8] bg-white px-5 py-[18px] shrink-0 z-20">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <div className="flex flex-wrap gap-3 items-center">
            <FilterInput label="分类名称" placeholder="请输入" value={categoryName} onChange={setCategoryName} />
            <FilterInput label="分类标识" placeholder="请输入" value={categoryCode} onChange={setCategoryCode} />
            <div className="flex items-center">
              <span className="text-xs text-[#666] mr-2 shrink-0">机构门店</span>
              <div className="flex min-h-[34px] min-w-[220px] items-center justify-between rounded border border-[#E8E8E8] bg-white px-3">
                <span className="truncate text-sm text-[#333]">{currentStore?.name || '请选择门店'}</span>
                <button
                  onClick={handleOpenStorePicker}
                  className="ml-3 shrink-0 text-xs font-bold text-[#00C06B] hover:text-[#00A35B]"
                >
                  更换门店
                </button>
              </div>
            </div>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <button onClick={() => { setCategoryName(''); setCategoryCode(''); }} className="px-6 py-1.5 border border-[#E8E8E8] text-[#333] rounded text-xs hover:bg-gray-50 transition-colors">重置</button>
              <button onClick={() => setNotification({ type: 'success', message: `已查询到 ${filteredCategories.length} 个门店分类` })} className="px-6 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">查询</button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 flex justify-between items-center border-b border-[#E8E8E8] bg-white shrink-0 z-10 gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#999]" />
              <input
                className="h-[34px] pl-9 pr-4 border border-[#E8E8E8] rounded w-56 text-sm focus:border-[#00C06B] focus:outline-none transition-colors"
                placeholder="搜索分类名称/标识"
                value={categoryName}
                onChange={e => setCategoryName(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto max-w-[560px] no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`relative px-4 py-1.5 text-sm font-bold transition-colors whitespace-nowrap rounded-lg ${activeTabId === tab.id ? 'text-[#00C06B] bg-[#00C06B]/5' : 'text-[#666] hover:text-[#333] hover:bg-gray-50'}`}
                >
                  {tab.label}
                  {activeTabId === tab.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#00C06B] rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={openSortModal}
              className="flex items-center px-3 py-1.5 border rounded text-xs font-medium transition-colors border-[#E8E8E8] text-[#333] hover:bg-gray-50"
            >
              <ArrowUpDown size={14} className="mr-1.5 text-[#666]" /> 排序管理
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto no-scrollbar pt-3.5">
          <table className="w-full text-left border-collapse min-w-[1160px]">
            <thead className="sticky top-0 bg-[#F7F8FA] z-10 text-xs font-bold text-[#333]">
              <tr>
                <th className="w-14 py-3 pl-5 border-b border-[#E8E8E8]">排序</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-28">分类图标</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-44">分类名称</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-40">分类标识</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-28">分类标签</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-36">是否必选分组</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-44">展示渠道</th>
                <th className="sticky right-0 py-3 px-4 border-b border-[#E8E8E8] w-32 text-center bg-[#F7F8FA] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {visibleCategories.map(item => (
                <tr
                  key={item.id}
                  className={`border-b border-[#F5F5F5] transition-colors group ${item.level === 2 ? 'bg-[#FCFCFD] hover:bg-[#F7FFF9]' : 'hover:bg-[#F9FFFC]'}`}
                >
                  <td className="py-4 pl-5">
                    <div className={`flex items-center text-[#666] ${item.level === 2 ? 'pl-7' : ''}`}>
                      {item.level === 1 && (childCountByParent.get(item.code) || 0) > 0 && (
                        <button
                          onClick={() => toggleParentExpand(item.code)}
                          className="mr-2 flex h-5 w-5 items-center justify-center rounded border border-[#D9DDE7] text-[#667085] hover:border-[#00C06B] hover:text-[#00C06B]"
                          aria-label={expandedParentCodes.includes(item.code) || (hasKeywordSearch && autoExpandedParentCodes.has(item.code)) ? '收起二级分类' : '展开二级分类'}
                        >
                          {expandedParentCodes.includes(item.code) || (hasKeywordSearch && autoExpandedParentCodes.has(item.code)) ? <Minus size={12} /> : <Plus size={12} />}
                        </button>
                      )}
                      <span className="font-medium">{item.sortIndex}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {item.level === 1 ? (
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#F0FDF4] font-bold text-[#00C06B]">
                        {item.iconText}
                      </div>
                    ) : (
                      <span className="text-[#999]">-</span>
                    )}
                  </td>
                   <td className="py-4 px-4">
                     {item.level === 2 ? (
                       <div className="pl-5">
                         <div className="font-bold text-[#333]">{item.name}</div>
                         {item.alias && <div className="mt-1 text-xs text-[#98A2B3]">{item.alias}</div>}
                       </div>
                     ) : (
                       <div>
                         <div className="font-bold text-[#333]">{item.name}</div>
                         {item.alias && <div className="mt-1 text-xs text-[#98A2B3]">{item.alias}</div>}
                       </div>
                     )}
                  </td>
                  <td className="py-4 px-4 text-[#666] font-mono">{item.level === 2 ? '-' : item.code}</td>
                  <td className="py-4 px-4">
                    {item.level === 1 && item.tag ? (
                      <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-bold bg-[#F5F3FF] text-[#7C3AED]">
                        {item.tag}
                      </span>
                    ) : (
                      <span className="text-[#999]">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-[#666]">{item.level === 2 ? '-' : (item.requiredGroup ? '是' : '否')}</td>
                  <td className="py-4 px-4">
                    {item.level === 1 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {item.displayChannels.map(channelId => renderDisplayChannelIcon(channelId))}
                      </div>
                    ) : (
                      <span className="text-[#999]">-</span>
                    )}
                  </td>
                  <td className={`sticky right-0 py-4 px-4 text-center shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)] ${item.level === 2 ? 'bg-[#FCFCFD] group-hover:bg-[#F7FFF9]' : 'bg-white group-hover:bg-[#F9FFFC]'}`}>
                    <div className="flex items-center justify-center text-sm">
                      <button
                        onClick={() => openEditor(item)}
                        className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline"
                      >
                        {item.level === 2 ? '编辑二级分类' : '编辑分类'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleCategories.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#999]">暂无门店商品分类数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="h-12 border-t border-[#E8E8E8] flex items-center justify-end px-5 text-xs text-[#666] bg-white shrink-0">
          <span className="mr-4">共 {visibleCategories.length} 条</span>
          <div className="flex items-center mr-4">
            <span className="mr-2">20条/页</span>
            <ChevronDown size={14} />
          </div>
          <div className="flex items-center space-x-1">
            <button type="button" disabled aria-label="上一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40">
              <ChevronLeft size={12} />
            </button>
            <button type="button" disabled aria-current="page" className="w-6 h-6 flex items-center justify-center bg-[#00C06B] text-white rounded font-bold">1</button>
            <button type="button" disabled title="当前演示数据仅一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40">2</button>
            <button type="button" disabled title="当前演示数据仅一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40">3</button>
            <button type="button" disabled title="当前演示数据仅一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40">...</button>
            <button type="button" disabled aria-label="下一页" className="w-6 h-6 flex items-center justify-center border rounded opacity-40">
              <ChevronRight size={12} />
            </button>
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
          onCancel={handleCancelStorePicker}
          onConfirm={handleConfirmStore}
          disableCancel={false}
        />
      )}
      {editingSecondCategory && (
        <SecondaryCategoryEditorModal
          draft={editingSecondCategory}
          onChange={setEditingSecondCategory}
          onCancel={() => setEditingSecondCategory(null)}
          onConfirm={saveSecondCategory}
          onViewAliasExample={() => setShowAliasExample(true)}
        />
      )}
      {showAliasExample && <CategoryAliasExampleModal onClose={() => setShowAliasExample(false)} />}
      {showSortModal && (
        <CategorySortModal
          rows={sortDraftRows}
          activeTabId={activeTabId}
          onChangeSort={updateSortDraftRow}
          onMoveRow={moveSortDraftRow}
          onCancel={() => setShowSortModal(false)}
          onConfirm={saveSort}
        />
      )}
    </div>
  );
};

const SecondaryCategoryEditorModal = ({
  draft,
  onChange,
  onCancel,
  onConfirm,
  onViewAliasExample,
}: {
  draft: SecondaryCategoryEditorDraft;
  onChange: (draft: SecondaryCategoryEditorDraft) => void;
  onCancel: () => void;
  onConfirm: () => void;
  onViewAliasExample: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[900px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-6">
          <div className="text-[20px] font-black text-[#1F2129]">编辑二级分类</div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-7 px-8 py-8">
          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-center gap-4">
            <div className="text-[16px] text-[#5B6475]">所属一级分类：</div>
            <div className="flex items-center gap-2 text-[18px] text-[#1F2129]">
              <span>{draft.parentName}</span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#D9DDE7] text-xs text-[#98A2B3]">?</span>
            </div>
          </div>

          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-center gap-4">
            <div className="text-[16px] text-[#5B6475]"><span className="mr-1 text-[#FF4D4F]">*</span>二级分类名称：</div>
            <div className="relative">
              <input
                value={draft.name}
                maxLength={10}
                onChange={e => onChange({ ...draft, name: e.target.value.slice(0, 10) })}
                className="h-[48px] w-full rounded-[10px] border border-[#D9DDE7] px-4 pr-16 text-[16px] text-[#1F2129] outline-none focus:border-[#00C06B]"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]">{draft.name.length}/10</div>
            </div>
          </div>

          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-start gap-4">
            <div className="pt-3 text-[16px] text-[#5B6475]">分类别名：</div>
            <div>
              <div className="relative">
                <input
                  value={draft.alias}
                  maxLength={10}
                  placeholder="请输入分类别名"
                  onChange={e => onChange({ ...draft, alias: e.target.value.slice(0, 10) })}
                  className="h-[48px] w-full rounded-[10px] border border-[#D9DDE7] px-4 pr-16 text-[16px] text-[#1F2129] outline-none focus:border-[#00C06B]"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#98A2B3]">{draft.alias.length}/10</div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-[#98A2B3]">
                <span>用于补充说明分类，配置后将在小程序分类名称下方默认展示</span>
                <button type="button" onClick={onViewAliasExample} className="shrink-0 font-bold text-[#00A35B] hover:text-[#008F50]">查看示例</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[160px_minmax(0,1fr)] items-center gap-4">
            <div className="text-[16px] text-[#5B6475]"><span className="mr-1 text-[#FF4D4F]">*</span>排序：</div>
            <div>
              <div className="inline-flex overflow-hidden rounded-[10px] border border-[#D9DDE7]">
                <button
                  onClick={() => onChange({ ...draft, sortIndex: Math.max(1, draft.sortIndex - 1) })}
                  className="flex h-[46px] w-[48px] items-center justify-center bg-[#F8FAFB] text-[24px] text-[#98A2B3] hover:text-[#1F2129]"
                >
                  -
                </button>
                <div className="flex h-[46px] w-[96px] items-center justify-center border-x border-[#D9DDE7] text-[20px] text-[#1F2129]">
                  {draft.sortIndex}
                </div>
                <button
                  onClick={() => onChange({ ...draft, sortIndex: draft.sortIndex + 1 })}
                  className="flex h-[46px] w-[48px] items-center justify-center bg-[#F8FAFB] text-[24px] text-[#5B6475] hover:text-[#1F2129]"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-[#EEF1F5] px-8 py-6">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-8 py-3 text-[16px] font-bold text-[#5B6475]">
            取消
          </button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-8 py-3 text-[16px] font-bold text-white">
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoryAliasExampleModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 px-6" onClick={onClose}>
    <div className="w-full max-w-[680px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]" onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[#EEF1F5] px-7 py-5">
        <div>
          <div className="text-[20px] font-black text-[#1F2129]">分类别名展示示例</div>
          <div className="mt-1 text-sm text-[#98A2B3]">配置别名后，小程序会在分类名称下方展示补充说明</div>
        </div>
        <button type="button" onClick={onClose} className="text-[#9AA3B2] hover:text-[#5B6475]"><X size={22} /></button>
      </div>
      <div className="px-7 py-7">
        <div className="rounded-2xl bg-[#F6F7FB] p-5">
          <div className="mb-4 text-sm font-bold text-[#5B6475]">小程序点单页</div>
          <div className="grid grid-cols-[128px_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-r border-[#EEF1F5] bg-[#F8FAFB] p-3">
              <div className="rounded-xl border border-[#BFECD3] bg-white px-3 py-4 text-center shadow-sm">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9FAF1] text-lg font-black text-[#00A35B]">披</div>
                <div className="text-sm font-bold leading-5 text-[#1F2129]">披萨系列</div>
                <div className="mt-1 text-xs leading-4 text-[#98A2B3]">现烤薄脆</div>
              </div>
              <div className="mt-3 rounded-xl px-3 py-4 text-center text-sm text-[#5B6475]">能量碗</div>
            </div>
            <div className="p-5">
              <div className="text-lg font-black text-[#1F2129]">披萨系列</div>
              <div className="mt-1 text-sm text-[#98A2B3]">现烤薄脆</div>
              <div className="mt-5 space-y-3">
                <div className="h-16 rounded-xl bg-[#F7F8FA]" />
                <div className="h-16 rounded-xl bg-[#F7F8FA]" />
                <div className="h-16 rounded-xl bg-[#F7F8FA]" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-5 text-xs text-[#5B6475]">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#1F2129]" />分类名称：披萨系列</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#98A2B3]" />分类别名：现烤薄脆</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end border-t border-[#EEF1F5] px-7 py-5">
        <button type="button" onClick={onClose} className="rounded-[10px] bg-[#00C06B] px-7 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">我知道了</button>
      </div>
    </div>
  </div>
);

const CategorySortModal = ({
  rows,
  activeTabId,
  onChangeSort,
  onMoveRow,
  onCancel,
  onConfirm,
}: {
  rows: CategorySortDraftRow[];
  activeTabId: string;
  onChangeSort: (rowId: string, nextPosition: number) => void;
  onMoveRow: (dragId: string, targetId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[980px] rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-8 py-5">
          <div>
            <div className="text-[20px] font-black text-[#1F2129]">分类排序</div>
            {activeTabId === 'all' && (
              <div className="mt-3 rounded-lg border border-[#DDEFE4] bg-[#F3FCF7] px-4 py-3 text-sm text-[#1B9B5F]">
                全局排序：保存后分类排序将同步至所有渠道
              </div>
            )}
          </div>
          <button onClick={onCancel} className="text-[#9AA3B2] hover:text-[#5B6475]">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-5">
          <div className="overflow-hidden rounded-[12px] border border-[#EEF1F5]">
            <div className="grid grid-cols-[minmax(0,1fr)_160px] bg-[#F8FAFB] px-4 py-3 text-sm font-bold text-[#5B6475]">
              <div>分类名称</div>
              <div>排序</div>
            </div>
            <div className="max-h-[520px] overflow-y-auto no-scrollbar">
              {rows.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => {
                    setDraggingRowId(item.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item.id);
                  }}
                  onDragOver={e => {
                    if (!draggingRowId || draggingRowId === item.id) return;
                    e.preventDefault();
                  }}
                  onDrop={e => {
                    if (!draggingRowId || draggingRowId === item.id) return;
                    e.preventDefault();
                    onMoveRow(draggingRowId, item.id);
                    setDraggingRowId(null);
                  }}
                  onDragEnd={() => setDraggingRowId(null)}
                  className={`grid grid-cols-[minmax(0,1fr)_160px] items-center border-t border-[#F2F4F7] px-4 py-3 text-sm ${draggingRowId === item.id ? 'bg-[#F3FCF7]' : 'bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="cursor-grab text-[#98A2B3] active:cursor-grabbing" />
                    <div className="font-medium text-[#333]">{item.name}</div>
                  </div>
                  <div>
                    <select
                      value={item.sortIndex}
                      onChange={e => onChangeSort(item.id, Number(e.target.value))}
                      className="h-9 w-full rounded-lg border border-[#D9DDE7] bg-white px-3 text-sm text-[#333] outline-none focus:border-[#00C06B]"
                    >
                      {rows.map((_, index) => (
                        <option key={index + 1} value={index + 1}>{index + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#EEF1F5] px-8 py-5">
          <button onClick={onCancel} className="rounded-[10px] border border-[#D9DDE7] bg-white px-6 py-2.5 text-sm font-bold text-[#5B6475]">
            取消
          </button>
          <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white">
            确定
          </button>
        </div>
      </div>
    </div>
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
  const selectedStore = stores.find(store => store.id === selectedStoreId) || STORE_OPTIONS.find(store => store.id === selectedStoreId) || null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-6">
      <div className="w-full max-w-[1120px] rounded-[16px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-6 py-4">
              <div className="text-[18px] font-semibold text-[#1F2129]">请选择需要管理的门店</div>
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
                {!stores.length ? <div className="px-4 py-14 text-center text-sm text-[#98A0B3]">暂无符合条件的门店</div> : null}
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

const renderDisplayChannelIcon = (channelId: string) => {
  const def = DISPLAY_CHANNEL_DEFS[channelId];
  if (!def) return null;

  return (
    <div
      key={channelId}
      title={def.label}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${def.className}`}
    >
      {def.shortLabel}
    </div>
  );
};
