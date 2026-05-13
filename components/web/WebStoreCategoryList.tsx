import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, ChevronDown, FileUp, ArrowUpDown, ChevronLeft,
  ChevronRight, GripVertical, CheckCircle2, X, Eye
} from 'lucide-react';

type StoreCategoryRecord = {
  id: string;
  storeId: string;
  storeName: string;
  channelId: string;
  sortIndex: number;
  iconText: string;
  name: string;
  code: string;
  tag: string;
  requiredGroup: boolean;
};

type StoreCategoryEditorDraft = StoreCategoryRecord & {
  categoryLabel: string;
  description: string;
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

const STORE_OPTIONS = [
  { id: 'all', name: '全部门店' },
  { id: 's1', name: '南山万象店' },
  { id: 's2', name: '福田卓悦店' },
  { id: 's3', name: '宝安壹方城店' },
  { id: 's4', name: '龙华红山店' },
];

const CHANNEL_DEFS: Record<string, { label: string; color: string }> = {
  pos: { label: 'POS', color: 'bg-blue-100 text-blue-700' },
  mini_dine: { label: '小程序-堂食', color: 'bg-[#00C06B]/10 text-[#00C06B]' },
  mini_take: { label: '小程序-外卖', color: 'bg-[#00C06B]/10 text-[#00C06B]' },
  meituan: { label: '美团-外卖', color: 'bg-yellow-100 text-yellow-700' },
  taobao: { label: '淘宝闪购', color: 'bg-orange-100 text-orange-700' },
  eleme: { label: '饿了么', color: 'bg-blue-100 text-blue-600' },
};

const DEFAULT_CHANNELS = [
  { id: 'mini_dine', label: '小程序-堂食' },
  { id: 'mini_take', label: '小程序-外卖' },
  { id: 'meituan', label: '美团-外卖' },
  { id: 'taobao', label: '淘宝闪购' },
  { id: 'pos', label: 'POS' },
];

const MOCK_STORE_CATEGORIES: StoreCategoryRecord[] = [
  { id: 'c-001', storeId: 's1', storeName: '南山万象店', channelId: 'mini_dine', sortIndex: 1, iconText: '奶', name: '奶茶系列', code: 'milk-tea', tag: '热销', requiredGroup: false },
  { id: 'c-002', storeId: 's1', storeName: '南山万象店', channelId: 'mini_dine', sortIndex: 2, iconText: '咖', name: '咖啡系列', code: 'coffee', tag: '新品', requiredGroup: false },
  { id: 'c-003', storeId: 's1', storeName: '南山万象店', channelId: 'mini_take', sortIndex: 1, iconText: '果', name: '果茶系列', code: 'fruit-tea', tag: '推荐', requiredGroup: true },
  { id: 'c-004', storeId: 's2', storeName: '福田卓悦店', channelId: 'pos', sortIndex: 1, iconText: '轻', name: '轻食系列', code: 'light-food', tag: '午餐', requiredGroup: false },
  { id: 'c-005', storeId: 's2', storeName: '福田卓悦店', channelId: 'pos', sortIndex: 2, iconText: '甜', name: '甜品系列', code: 'dessert', tag: '甜品', requiredGroup: false },
  { id: 'c-006', storeId: 's3', storeName: '宝安壹方城店', channelId: 'meituan', sortIndex: 1, iconText: '早', name: '早餐系列', code: 'breakfast', tag: '早餐', requiredGroup: false },
  { id: 'c-007', storeId: 's4', storeName: '龙华红山店', channelId: 'taobao', sortIndex: 1, iconText: '夜', name: '夜宵系列', code: 'supper', tag: '夜宵', requiredGroup: true },
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

const FilterStoreSelect = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex items-center">
    <span className="text-xs text-[#666] mr-2 shrink-0">{label}</span>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-[170px] h-[34px] pl-3 pr-8 border border-[#E8E8E8] rounded text-sm bg-white focus:border-[#00C06B] focus:outline-none transition-colors"
      >
        {STORE_OPTIONS.map(option => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none" />
    </div>
  </div>
);

const FieldSettingTrigger = () => (
  <button className="w-8 h-8 border border-[#E8E8E8] rounded flex items-center justify-center text-[#666] hover:border-[#00C06B] hover:text-[#00C06B] transition-colors bg-white">
    <Eye size={15} />
  </button>
);

export const WebStoreCategoryList: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState('all');
  const [activeStoreId, setActiveStoreId] = useState('all');
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categories, setCategories] = useState(MOCK_STORE_CATEGORIES);
  const [isSorting, setIsSorting] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<StoreCategoryEditorDraft | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const tabs = useMemo(() => [{ id: 'all', label: '全部渠道' }, ...DEFAULT_CHANNELS], []);

  const filteredCategories = useMemo(() => {
    let next = categories;

    if (activeStoreId !== 'all') {
      next = next.filter(item => item.storeId === activeStoreId);
    }

    if (activeTabId !== 'all') {
      next = next.filter(item => item.channelId === activeTabId);
    }

    const trimName = categoryName.trim().toLowerCase();
    if (trimName) {
      next = next.filter(item => item.name.toLowerCase().includes(trimName));
    }

    const trimCode = categoryCode.trim().toLowerCase();
    if (trimCode) {
      next = next.filter(item => item.code.toLowerCase().includes(trimCode));
    }

    return [...next].sort((a, b) => a.sortIndex - b.sortIndex);
  }, [activeStoreId, activeTabId, categories, categoryCode, categoryName]);

  useEffect(() => {
    setIsSorting(false);
  }, [activeStoreId, activeTabId]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(timer);
  }, [notification]);

  const canSortCurrentScope = activeStoreId !== 'all';

  const openEditor = (item: StoreCategoryRecord) => {
    setEditingCategory({
      ...item,
      categoryLabel: item.tag,
      description: `${item.name} 分类描述`,
      remark: `${item.name} 备注`,
      shelfChannels: ['mini_dine', 'meituan', 'taobao', 'pos'],
      saleTypes: ['dine', 'takeout'],
      displayChannels: ['wechat_mini', 'alipay_mini', 'douyin_mini', 'qimai_app'],
      shelfTime: 'all_day',
      limitTop: false,
      onlyBackstageGroup: false,
      classicMenuHidden: false,
      notOrderAlone: false,
      queueSetting: 'join',
      orderLimit: 'participate',
    });
  };

  const moveCategory = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    const scopedIds = filteredCategories.map(item => item.id);
    const currentOrder = scopedIds.filter(id => categories.some(item => item.id === id));
    const fromIndex = currentOrder.indexOf(fromId);
    const toIndex = currentOrder.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, moved);

    const sortMap = new Map(nextOrder.map((id, index) => [id, index + 1]));
    setCategories(prev => prev.map(item => (
      sortMap.has(item.id) ? { ...item, sortIndex: sortMap.get(item.id) as number } : item
    )));
  };

  const saveSort = () => {
    setIsSorting(false);
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
    setCategories(prev => prev.map(item => item.id === editingCategory.id ? {
      ...item,
      name: editingCategory.name,
      code: editingCategory.code,
      tag: editingCategory.categoryLabel || editingCategory.tag,
      requiredGroup: editingCategory.requiredGroup,
    } : item));
    setEditingCategory(null);
    setNotification({ type: 'success', message: '分类编辑已保存' });
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
                    当前门店：{editingCategory.storeName}，当前渠道：{CHANNEL_DEFS[editingCategory.channelId]?.label || editingCategory.channelId}
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
                        <div className="pt-2 text-sm text-[#333]">分类描述</div>
                        <input value={editingCategory.description} onChange={e => updateEditingField('description', e.target.value)} className="h-10 w-full rounded-lg border border-[#E8E8E8] px-3 text-sm focus:border-[#00C06B] focus:outline-none" />
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
                            </div>
                            <div className="h-[84px] rounded-xl bg-white/40" />
                          </div>
                          <div className="flex-1 rounded-xl bg-white p-4 shadow-sm">
                            <div className="mb-4 text-lg font-bold text-[#333]">{editingCategory.name}</div>
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
                      <div className="pt-1 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>售卖渠道</div>
                      <div className="flex flex-wrap gap-6 rounded-xl bg-[#F7F8FA] px-5 py-4">
                        {DEFAULT_CHANNELS.map(channel => (
                          <label key={channel.id} className="flex items-center text-sm text-[#00B96B]">
                            <input type="checkbox" checked={editingCategory.shelfChannels.includes(channel.id)} onChange={e => updateEditingField('shelfChannels', e.target.checked ? [...editingCategory.shelfChannels, channel.id] : editingCategory.shelfChannels.filter(item => item !== channel.id))} className="mr-2 h-4 w-4 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" />
                            {channel.label.replace('-', '')}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-[88px_1fr] gap-3">
                      <div className="pt-1 text-sm text-[#333]"><span className="mr-1 text-[#FF4D4F]">*</span>售卖类型</div>
                      <div className="flex flex-wrap gap-6 rounded-xl bg-[#F7F8FA] px-5 py-4">
                        {[{ id: 'dine', label: '堂食' }, { id: 'takeout', label: '外卖' }, { id: 'mall', label: '商城' }].map(option => (
                          <label key={option.id} className={`flex items-center text-sm ${editingCategory.saleTypes.includes(option.id) ? 'text-[#00B96B]' : 'text-[#999]'}`}>
                            <input type="checkbox" checked={editingCategory.saleTypes.includes(option.id)} onChange={e => updateEditingField('saleTypes', e.target.checked ? [...editingCategory.saleTypes, option.id] : editingCategory.saleTypes.filter(item => item !== option.id))} className="mr-2 h-4 w-4 rounded border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
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
                      <label className="flex items-center py-2">
                        <input type="checkbox" checked={editingCategory.limitTop} onChange={e => updateEditingField('limitTop', e.target.checked)} className="h-5 w-9 rounded-full border border-[#D9D9D9] text-[#00C06B] focus:ring-[#00C06B]" />
                      </label>
                    </div>
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
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-[#F0F2F5] overflow-hidden min-w-0 font-sans p-4 relative">
      {renderNotification()}

      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
        <div className="p-5 border-b border-[#E8E8E8] bg-white space-y-4 shrink-0 z-20">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterInput label="分类名称" placeholder="请输入" value={categoryName} onChange={setCategoryName} />
            <FilterInput label="分类标识" placeholder="请输入" value={categoryCode} onChange={setCategoryCode} />
            <FilterStoreSelect label="机构门店" value={activeStoreId} onChange={setActiveStoreId} />
            <button className="h-[34px] px-3 border border-dashed border-[#AAA] text-[#666] rounded hover:border-[#00C06B] hover:text-[#00C06B] transition-colors text-xs flex items-center bg-white">
              <Plus size={14} className="mr-1" /> 添加筛选
            </button>
          </div>

          <div className="flex justify-between items-center gap-4">
            <button className="flex items-center text-xs text-[#666] border border-[#E8E8E8] px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
              <FileUp size={14} className="mr-1.5" /> 保存快捷筛选选项
            </button>
            <div className="flex space-x-3">
              <button className="px-6 py-1.5 border border-[#E8E8E8] text-[#333] rounded text-xs hover:bg-gray-50 transition-colors">重置</button>
              <button className="px-6 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] shadow-sm transition-colors">查询</button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 flex justify-between items-center border-b border-[#E8E8E8] bg-white shrink-0 z-10 gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#999]" />
              <input
                className="pl-9 pr-4 py-1.5 border border-[#E8E8E8] rounded w-56 text-sm focus:border-[#00C06B] focus:outline-none transition-colors"
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
                  className={`relative px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap rounded-lg ${activeTabId === tab.id ? 'text-[#00C06B] bg-[#00C06B]/5' : 'text-[#666] hover:text-[#333] hover:bg-gray-50'}`}
                >
                  {tab.label}
                  {activeTabId === tab.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#00C06B] rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {isSorting ? (
              <>
                <button
                  onClick={() => setIsSorting(false)}
                  className="px-4 py-1.5 border border-[#E8E8E8] rounded text-xs text-[#333] hover:bg-gray-50 font-medium"
                >
                  取消排序
                </button>
                <button
                  onClick={saveSort}
                  className="px-4 py-1.5 bg-[#00C06B] text-white rounded text-xs font-bold hover:bg-[#00A35B] transition-colors"
                >
                  保存排序
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (!canSortCurrentScope) {
                    setNotification({ type: 'error', message: '请选择一个门店' });
                    return;
                  }
                  setIsSorting(true);
                }}
                className={`flex items-center px-3 py-1.5 border rounded text-xs font-medium transition-colors ${
                  canSortCurrentScope
                    ? 'border-[#E8E8E8] text-[#333] hover:bg-gray-50'
                    : 'border-[#E8E8E8] text-[#B5B5B5] bg-[#FAFAFA]'
                }`}
              >
                <ArrowUpDown size={14} className="mr-1.5 text-[#666]" /> 排序管理
              </button>
            )}
            <FieldSettingTrigger />
          </div>
        </div>

        {isSorting && activeTabId === 'all' && (
          <div className="mx-5 mt-4 rounded-lg border border-[#DDEFE4] bg-[#F3FCF7] px-4 py-3 text-sm text-[#1B9B5F]">
            全局排序：保存后分类排序将同步至所有渠道
          </div>
        )}

        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1160px]">
            <thead className="sticky top-0 bg-[#F7F8FA] z-10 text-xs font-bold text-[#333]">
              <tr>
                <th className="w-14 py-3 pl-5 border-b border-[#E8E8E8]">排序</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-28">分类图标</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-44">分类名称</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-40">分类标识</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-28">分类标签</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-36">是否必选分组</th>
                <th className="py-3 px-4 border-b border-[#E8E8E8] w-36">门店名称</th>
                <th className="sticky right-0 py-3 px-4 border-b border-[#E8E8E8] w-32 text-center bg-[#F7F8FA] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {filteredCategories.map(item => (
                <tr
                  key={item.id}
                  draggable={isSorting}
                  onDragStart={e => {
                    if (!isSorting) return;
                    setDraggedId(item.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item.id);
                  }}
                  onDragOver={e => {
                    if (!isSorting || !draggedId || draggedId === item.id) return;
                    e.preventDefault();
                  }}
                  onDrop={e => {
                    if (!isSorting || !draggedId || draggedId === item.id) return;
                    e.preventDefault();
                    moveCategory(draggedId, item.id);
                    setDraggedId(item.id);
                  }}
                  onDragEnd={() => setDraggedId(null)}
                  className={`border-b border-[#F5F5F5] hover:bg-[#F9FFFC] transition-colors group ${draggedId === item.id ? 'bg-[#F0FDF4]' : ''}`}
                >
                  <td className="py-4 pl-5">
                    <div className={`flex items-center text-[#666] ${isSorting ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                      {isSorting && <GripVertical size={15} className="mr-1 text-[#999]" />}
                      <span className="font-medium">{item.sortIndex}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] text-[#00C06B] flex items-center justify-center font-bold">
                      {item.iconText}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-[#333]">{item.name}</div>
                    <div className="mt-1 text-[11px] text-[#999]">{CHANNEL_DEFS[item.channelId]?.label || item.channelId}</div>
                  </td>
                  <td className="py-4 px-4 text-[#666] font-mono">{item.code}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex px-2 py-1 rounded-full text-[11px] font-bold bg-[#F5F3FF] text-[#7C3AED]">
                      {item.tag}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#666]">{item.requiredGroup ? '是' : '否'}</td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-[#333]">{item.storeName}</div>
                    <div className="mt-1 text-[11px] text-[#999]">{item.storeId.toUpperCase()}</div>
                  </td>
                  <td className="sticky right-0 py-4 px-4 text-center bg-white group-hover:bg-[#F9FFFC] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.28)]">
                    <div className="flex items-center justify-center text-sm">
                      <button
                        onClick={() => openEditor(item)}
                        className="text-[#00C06B] font-medium hover:text-[#008f53] hover:underline"
                      >
                        编辑分类
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#999]">暂无门店商品分类数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="h-12 border-t border-[#E8E8E8] flex items-center justify-end px-5 text-xs text-[#666] bg-white shrink-0">
          <span className="mr-4">共 {filteredCategories.length} 条</span>
          <div className="flex items-center mr-4">
            <span className="mr-2">20条/页</span>
            <ChevronDown size={14} />
          </div>
          <div className="flex items-center space-x-1">
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B] disabled:opacity-50">
              <ChevronLeft size={12} />
            </button>
            <button className="w-6 h-6 flex items-center justify-center bg-[#00C06B] text-white rounded font-bold">1</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">2</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">3</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">...</button>
            <button className="w-6 h-6 flex items-center justify-center border rounded hover:border-[#00C06B] hover:text-[#00C06B]">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
