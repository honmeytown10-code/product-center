import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  GripVertical,
  ListOrdered,
  Plus,
  Search,
  Store,
  Ticket,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Switch } from './WebCommon';
import { WebProductSelectorDialog, type SelectableProduct } from './WebProductSelectorDialog';

type MenuStatus = 'enabled' | 'disabled';
type ItemMode = 'unlimited' | 'limited';
type StoreScopeMode = 'all' | 'selected';
type EditorStep = 1 | 2 | 3;

type StoreOption = {
  id: string;
  name: string;
  code: string;
  organization: string;
  region: string;
};

type TicketProduct = {
  id: string;
  name: string;
  code: string;
  price: number;
  applicablePeople: number;
  frontendCategory: string;
  requiresDeposit: boolean;
  allowPosTemporaryPrice: boolean;
  availableStoreIds: string[];
};

type NewTicketForm = {
  name: string;
  frontendCategory: string;
  price: string;
  applicablePeople: string;
  requiresDeposit: boolean;
  allowPosTemporaryPrice: boolean;
};

type MenuSku = {
  id: string;
  name: string;
  code: string;
  price: number;
  unavailableStoreIds?: string[];
};

type MenuProduct = {
  id: string;
  name: string;
  code: string;
  category: string;
  skus: MenuSku[];
};

type BuffetMenuItem = {
  productId: string;
  mode: ItemMode;
  limitQty?: number;
};

type BuffetMenu = {
  id: string;
  name: string;
  sort: number;
  ticketIds: string[];
  storeScope: StoreScopeMode;
  storeIds: string[];
  items: BuffetMenuItem[];
  status: MenuStatus;
  updatedAt: string;
  updatedBy: string;
};

const STORES: StoreOption[] = [
  { id: 's001', name: '南山万象店', code: 'SZ001', organization: '深圳直营区', region: '华南' },
  { id: 's002', name: '福田卓悦店', code: 'SZ002', organization: '深圳直营区', region: '华南' },
  { id: 's003', name: '宝安壹方城店', code: 'SZ003', organization: '深圳直营区', region: '华南' },
  { id: 's004', name: '虹桥天地店', code: 'SH001', organization: '上海直营区', region: '华东' },
  { id: 's005', name: '静安大悦城店', code: 'SH002', organization: '上海直营区', region: '华东' },
  { id: 's006', name: '杭州湖滨店', code: 'HZ001', organization: '浙江直营区', region: '华东' },
  { id: 's007', name: '北京国贸店', code: 'BJ001', organization: '北京直营区', region: '华北' },
  { id: 's008', name: '成都太古里店', code: 'CD001', organization: '成都直营区', region: '西南' },
  { id: 's009', name: '西安赛格店', code: 'XA001', organization: '西北加盟区', region: '西北' },
];

const ALL_STORE_IDS = STORES.map(store => store.id);

const TICKETS: TicketProduct[] = [
  { id: 't-adult-lunch', name: '成人午市自助餐门票', code: 'BUFFET-A-L', price: 118, applicablePeople: 1, frontendCategory: '成人自助餐', requiresDeposit: false, allowPosTemporaryPrice: false, availableStoreIds: ALL_STORE_IDS },
  { id: 't-child-lunch', name: '儿童午市自助餐门票', code: 'BUFFET-C-L', price: 68, applicablePeople: 1, frontendCategory: '儿童自助餐', requiresDeposit: false, allowPosTemporaryPrice: true, availableStoreIds: ALL_STORE_IDS },
  { id: 't-child-dinner', name: '儿童晚市自助餐门票', code: 'BUFFET-C-D', price: 88, applicablePeople: 1, frontendCategory: '儿童自助餐', requiresDeposit: false, allowPosTemporaryPrice: false, availableStoreIds: ALL_STORE_IDS },
  { id: 't-adult-dinner', name: '成人晚市自助餐门票', code: 'BUFFET-A-D', price: 168, applicablePeople: 1, frontendCategory: '成人自助餐', requiresDeposit: false, allowPosTemporaryPrice: true, availableStoreIds: ALL_STORE_IDS },
  { id: 't-premium', name: '尊享海鲜双人自助餐门票', code: 'BUFFET-P', price: 438, applicablePeople: 2, frontendCategory: '双人自助餐', requiresDeposit: true, allowPosTemporaryPrice: false, availableStoreIds: ['s001', 's002', 's004', 's007'] },
];

const FRONTEND_CATEGORIES = ['成人自助餐', '儿童自助餐', '双人自助餐', '家庭自助餐'];

const PRODUCTS: MenuProduct[] = [
  { id: 'p001', name: '和牛寿喜锅', code: 'SPU-10021', category: '锅物', skus: [
    { id: 'p001-s1', name: '单人份', code: 'SKU-10021-01', price: 88 },
    { id: 'p001-s2', name: '双人份', code: 'SKU-10021-02', price: 158 },
  ] },
  { id: 'p002', name: '现切三文鱼', code: 'SPU-10036', category: '刺身', skus: [
    { id: 'p002-s1', name: '标准份', code: 'SKU-10036-01', price: 58, unavailableStoreIds: ['s009'] },
  ] },
  { id: 'p003', name: '炙烤鳗鱼', code: 'SPU-10042', category: '日料', skus: [
    { id: 'p003-s1', name: '标准份', code: 'SKU-10042-01', price: 38 },
  ] },
  { id: 'p004', name: '黑椒牛仔骨', code: 'SPU-10058', category: '热菜', skus: [
    { id: 'p004-s1', name: '标准份', code: 'SKU-10058-01', price: 46 },
  ] },
  { id: 'p005', name: '蒜蓉烤生蚝', code: 'SPU-10063', category: '海鲜', skus: [
    { id: 'p005-s1', name: '2 只装', code: 'SKU-10063-01', price: 36, unavailableStoreIds: ['s006', 's009'] },
    { id: 'p005-s2', name: '4 只装', code: 'SKU-10063-02', price: 68, unavailableStoreIds: ['s006', 's009'] },
  ] },
  { id: 'p006', name: '芝士焗龙虾', code: 'SPU-10079', category: '海鲜', skus: [
    { id: 'p006-s1', name: '半只', code: 'SKU-10079-01', price: 128, unavailableStoreIds: ['s003', 's005', 's006', 's008', 's009'] },
    { id: 'p006-s2', name: '整只', code: 'SKU-10079-02', price: 238, unavailableStoreIds: ['s003', 's005', 's006', 's008', 's009'] },
  ] },
  { id: 'p007', name: '杨枝甘露', code: 'SPU-10106', category: '甜品', skus: [
    { id: 'p007-s1', name: '小杯', code: 'SKU-10106-01', price: 18 },
    { id: 'p007-s2', name: '标准杯', code: 'SKU-10106-02', price: 22 },
    { id: 'p007-s3', name: '大杯', code: 'SKU-10106-03', price: 28 },
  ] },
  { id: 'p008', name: '哈根达斯单球', code: 'SPU-10118', category: '甜品', skus: [
    { id: 'p008-s1', name: '香草味', code: 'SKU-10118-01', price: 28 },
    { id: 'p008-s2', name: '巧克力味', code: 'SKU-10118-02', price: 28 },
    { id: 'p008-s3', name: '草莓味', code: 'SKU-10118-03', price: 28 },
    { id: 'p008-s4', name: '抹茶味', code: 'SKU-10118-04', price: 28 },
  ] },
  { id: 'p009', name: '鲜榨西瓜汁', code: 'SPU-10130', category: '饮品', skus: [
    { id: 'p009-s1', name: '标准杯', code: 'SKU-10130-01', price: 18 },
    { id: 'p009-s2', name: '大杯', code: 'SKU-10130-02', price: 24 },
  ] },
  { id: 'p010', name: '精酿啤酒', code: 'SPU-10145', category: '饮品', skus: [
    { id: 'p010-s1', name: '小麦白 330ml', code: 'SKU-10145-01', price: 26, unavailableStoreIds: ['s007'] },
    { id: 'p010-s2', name: 'IPA 330ml', code: 'SKU-10145-02', price: 32, unavailableStoreIds: ['s007'] },
  ] },
];

const SPU_SELECTOR_PRODUCTS: SelectableProduct[] = PRODUCTS.map(product => ({
  id: product.id,
  name: product.name,
  productCode: product.code,
  category: product.category,
  type: 'standard',
  price: Math.min(...product.skus.map(sku => sku.price)),
  status: 'on_shelf',
}));

const INITIAL_MENUS: BuffetMenu[] = [
  {
    id: 'bm-001',
    name: '深圳午市成人畅享菜单',
    sort: 1,
    ticketIds: ['t-adult-lunch'],
    storeScope: 'selected',
    storeIds: ['s001', 's002', 's003'],
    items: [
      { productId: 'p001', mode: 'unlimited' },
      { productId: 'p002', mode: 'unlimited' },
      { productId: 'p004', mode: 'unlimited' },
      { productId: 'p005', mode: 'limited', limitQty: 2 },
      { productId: 'p008', mode: 'limited', limitQty: 1 },
    ],
    status: 'enabled',
    updatedAt: '2026-08-18 18:32',
    updatedBy: '周静',
  },
  {
    id: 'bm-002',
    name: '深圳儿童自助菜单',
    sort: 2,
    ticketIds: ['t-child-lunch', 't-child-dinner'],
    storeScope: 'selected',
    storeIds: ['s001', 's002', 's003'],
    items: [
      { productId: 'p001', mode: 'unlimited' },
      { productId: 'p003', mode: 'unlimited' },
      { productId: 'p007', mode: 'unlimited' },
      { productId: 'p008', mode: 'limited', limitQty: 1 },
    ],
    status: 'enabled',
    updatedAt: '2026-08-18 17:06',
    updatedBy: '周静',
  },
  {
    id: 'bm-003',
    name: '全门店晚市成人菜单',
    sort: 3,
    ticketIds: ['t-adult-dinner'],
    storeScope: 'all',
    storeIds: ALL_STORE_IDS,
    items: [
      { productId: 'p001', mode: 'unlimited' },
      { productId: 'p002', mode: 'unlimited' },
      { productId: 'p003', mode: 'unlimited' },
      { productId: 'p008', mode: 'limited', limitQty: 1 },
    ],
    status: 'disabled',
    updatedAt: '2026-08-17 11:20',
    updatedBy: '陈望',
  },
  {
    id: 'bm-004',
    name: '尊享海鲜试点菜单',
    sort: 4,
    ticketIds: ['t-premium'],
    storeScope: 'selected',
    storeIds: ['s001', 's004'],
    items: [
      { productId: 'p002', mode: 'unlimited' },
      { productId: 'p005', mode: 'unlimited' },
      { productId: 'p006', mode: 'limited', limitQty: 1 },
    ],
    status: 'disabled',
    updatedAt: '2026-08-16 09:42',
    updatedBy: '王茜',
  },
];

const STATUS_LABELS: Record<MenuStatus, string> = {
  enabled: '已启用',
  disabled: '已停用',
};

const MODE_LABELS: Record<ItemMode, string> = {
  unlimited: '不限量商品',
  limited: '限量商品',
};
const ITEM_MODES: ItemMode[] = ['unlimited', 'limited'];

const MODE_STYLES: Record<ItemMode, { badge: string; icon: React.ReactNode }> = {
  unlimited: { badge: 'bg-[#E8F8F0] text-[#008F4C]', icon: <UtensilsCrossed size={15} /> },
  limited: { badge: 'bg-[#FFF7E8] text-[#B76500]', icon: <Clock3 size={15} /> },
};

const getStore = (id: string) => STORES.find(store => store.id === id);
const getProduct = (productId: string) => PRODUCTS.find(product => product.id === productId);
const hasIntersection = (left: string[], right: string[]) => left.some(value => right.includes(value));

const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean; helper?: string }> = ({ children, required, helper }) => (
  <div className="mb-2 flex items-center gap-2">
    <label className="text-[13px] font-semibold text-[#344054]">
      {children}{required && <span className="ml-1 text-[#E5484D]">*</span>}
    </label>
    {helper && <span className="text-[12px] text-[#98A2B3]">{helper}</span>}
  </div>
);

const StatusBadge: React.FC<{ status: MenuStatus }> = ({ status }) => {
  const className = status === 'enabled'
    ? 'bg-[#E8F8F0] text-[#008F4C]'
    : 'bg-[#F2F4F7] text-[#667085]';
  return <span className={`inline-flex rounded px-2 py-0.5 text-[12px] font-medium ${className}`}>{STATUS_LABELS[status]}</span>;
};

const TicketScopeSummary: React.FC<{ ticketIds: string[]; resolve: (id: string) => string | undefined }> = ({ ticketIds, resolve }) => {
  const labels = ticketIds.map(resolve).filter(Boolean) as string[];
  if (!labels.length) return <span className="text-[#98A2B3]">--</span>;
  return (
    <div title={labels.join('、')} className="min-w-0">
      <div className="truncate text-[#344054]">{labels[0]}</div>
      {labels.length > 1 && <div className="mt-1 text-[12px] text-[#008F4C]">共 {labels.length} 张餐标</div>}
    </div>
  );
};

const StoreScopeSummary: React.FC<{ menu: BuffetMenu }> = ({ menu }) => {
  if (menu.storeScope === 'all') {
    return (
      <div title={`全部门店，当前共 ${STORES.length} 家`}>
        <span className="inline-flex rounded bg-[#E8F8F0] px-2 py-0.5 text-[12px] font-medium text-[#008F4C]">全部门店</span>
        <div className="mt-1 text-[12px] text-[#667085]">当前 {STORES.length} 家</div>
      </div>
    );
  }
  const labels = menu.storeIds.map(id => getStore(id)?.name).filter(Boolean) as string[];
  if (!labels.length) return <span className="text-[#98A2B3]">--</span>;
  return (
    <div title={labels.join('、')} className="min-w-0">
      <div className="truncate text-[#475467]">{labels[0]}</div>
      <div className="mt-1 text-[12px] text-[#98A2B3]">指定 {labels.length} 家</div>
    </div>
  );
};

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F4F7] text-[#667085]">{icon}</div>
    <div className="text-[15px] font-semibold text-[#1D2939]">{title}</div>
    <div className="mt-2 max-w-[480px] text-[13px] leading-6 text-[#667085]">{description}</div>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

const SelectionModal: React.FC<{
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
  selectedCount: number;
  width?: string;
}> = ({ title, onClose, onConfirm, children, selectedCount, width = 'w-[920px]' }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`flex max-h-[calc(100vh-48px)] ${width} max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl`}>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#EAECF0] px-5">
        <div className="text-[16px] font-semibold text-[#1D2939]">{title}</div>
        <button type="button" onClick={onClose} aria-label="关闭" className="rounded p-1.5 text-[#667085] hover:bg-[#F2F4F7]"><X size={18} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      <div className="flex h-16 shrink-0 items-center justify-between border-t border-[#EAECF0] px-5">
        <span className="text-[13px] text-[#667085]">已选 {selectedCount} 项</span>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px] text-[#344054] hover:bg-[#F9FAFB]">取消</button>
          <button type="button" onClick={onConfirm} className="h-8 rounded bg-[#00B460] px-4 text-[13px] font-medium text-white hover:bg-[#009F56]">确认选择</button>
        </div>
      </div>
    </div>
  </div>
);

const MenuSortModal: React.FC<{
  rows: BuffetMenu[];
  dirty: boolean;
  onMoveRow: (dragId: string, targetId: string) => void;
  onChangeSort: (menuId: string, nextSort: number) => void;
  onCancel: () => void;
  onSave: () => void;
}> = ({ rows, dirty, onMoveRow, onChangeSort, onCancel, onSave }) => {
  const [draggingMenuId, setDraggingMenuId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="自助餐菜单排序">
      <div className="flex max-h-[calc(100vh-48px)] w-[760px] max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[#EAECF0] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-semibold text-[#1D2939]">自助餐菜单排序</h3>
              {dirty && <span className="rounded bg-[#FFF7E8] px-2 py-0.5 text-[12px] text-[#B76500]">有未保存修改</span>}
            </div>
            <p className="mt-1.5 text-[12px] text-[#667085]">拖动菜单调整顺序，排序值越小越靠前。</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="关闭" className="rounded p-1.5 text-[#667085] hover:bg-[#F2F4F7]"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="overflow-hidden rounded border border-[#EAECF0]">
            <div className="grid grid-cols-[minmax(0,1fr)_120px] bg-[#F9FAFB] px-4 py-3 text-[13px] font-medium text-[#667085]">
              <div>菜单名称</div>
              <div>排序</div>
            </div>
            <div className="max-h-[460px] overflow-y-auto no-scrollbar">
              {rows.map(menu => (
                <div
                  key={menu.id}
                  draggable
                  onDragStart={event => {
                    setDraggingMenuId(menu.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', menu.id);
                  }}
                  onDragOver={event => {
                    if (!draggingMenuId || draggingMenuId === menu.id) return;
                    event.preventDefault();
                  }}
                  onDrop={event => {
                    if (!draggingMenuId || draggingMenuId === menu.id) return;
                    event.preventDefault();
                    onMoveRow(draggingMenuId, menu.id);
                    setDraggingMenuId(null);
                  }}
                  onDragEnd={() => setDraggingMenuId(null)}
                  className={`grid grid-cols-[minmax(0,1fr)_120px] items-center border-t border-[#EAECF0] px-4 py-3 text-[13px] ${draggingMenuId === menu.id ? 'bg-[#F0FBF6]' : 'bg-white hover:bg-[#FCFCFD]'}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <GripVertical size={16} className="shrink-0 cursor-grab text-[#98A2B3] active:cursor-grabbing" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[#344054]" title={menu.name}>{menu.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-[#98A2B3]"><span>{menu.id.toUpperCase()}</span><StatusBadge status={menu.status} /></div>
                    </div>
                  </div>
                  <select value={menu.sort} onChange={event => onChangeSort(menu.id, Number(event.target.value))} className="h-9 w-full rounded border border-[#D0D5DD] bg-white px-3 text-[13px] text-[#344054] outline-none focus:border-[#00B460]">
                    {rows.map((_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-[#EAECF0] px-5">
          <button type="button" onClick={onCancel} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px] text-[#344054] hover:bg-[#F9FAFB]">取消</button>
          <button type="button" onClick={onSave} disabled={!dirty} className="h-8 rounded bg-[#00B460] px-4 text-[13px] font-medium text-white hover:bg-[#009F56] disabled:cursor-not-allowed disabled:bg-[#A6DCC2]">保存</button>
        </div>
      </div>
    </div>
  );
};

export const WebBuffetMenuManager: React.FC = () => {
  const [menus, setMenus] = useState<BuffetMenu[]>(INITIAL_MENUS);
  const [ticketProducts, setTicketProducts] = useState<TicketProduct[]>(TICKETS);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MenuStatus>('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<'all' | MenuStatus>('all');
  const [appliedStoreFilter, setAppliedStoreFilter] = useState('all');
  const [detailMenu, setDetailMenu] = useState<BuffetMenu | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState<EditorStep>(1);
  const [draftName, setDraftName] = useState('');
  const [draftTicketIds, setDraftTicketIds] = useState<string[]>([]);
  const [draftStoreScope, setDraftStoreScope] = useState<StoreScopeMode>('all');
  const [draftStoreIds, setDraftStoreIds] = useState<string[]>([]);
  const [draftItems, setDraftItems] = useState<BuffetMenuItem[]>([]);
  const [validatedSteps, setValidatedSteps] = useState<Partial<Record<EditorStep, boolean>>>({});
  const [activeProductMode, setActiveProductMode] = useState<ItemMode>('unlimited');
  const [ticketSelectorOpen, setTicketSelectorOpen] = useState(false);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [productSelectorMode, setProductSelectorMode] = useState<ItemMode | null>(null);
  const [pendingTicketIds, setPendingTicketIds] = useState<string[]>([]);
  const [pendingStoreIds, setPendingStoreIds] = useState<string[]>([]);
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const [selectorKeyword, setSelectorKeyword] = useState('');
  const [confirmToggleMenu, setConfirmToggleMenu] = useState<BuffetMenu | null>(null);
  const [confirmDeleteMenu, setConfirmDeleteMenu] = useState<BuffetMenu | null>(null);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [sortDraftRows, setSortDraftRows] = useState<BuffetMenu[]>([]);
  const [sortDirty, setSortDirty] = useState(false);
  const [discardSortOpen, setDiscardSortOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState<NewTicketForm>({
    name: '',
    frontendCategory: '',
    price: '',
    applicablePeople: '1',
    requiresDeposit: false,
    allowPosTemporaryPrice: false,
  });

  const getTicket = (id: string) => ticketProducts.find(ticket => ticket.id === id);

  const filteredMenus = useMemo(() => [...menus].sort((left, right) => left.sort - right.sort).filter(menu => {
    const normalized = appliedKeyword.trim().toLowerCase();
    const matchesKeyword = !normalized
      || menu.name.toLowerCase().includes(normalized)
      || menu.id.toLowerCase().includes(normalized)
      || menu.ticketIds.some(id => getTicket(id)?.name.toLowerCase().includes(normalized));
    const matchesStatus = appliedStatusFilter === 'all' || menu.status === appliedStatusFilter;
    const matchesStore = appliedStoreFilter === 'all' || menu.storeIds.includes(appliedStoreFilter);
    return matchesKeyword && matchesStatus && matchesStore;
  }), [appliedKeyword, appliedStatusFilter, appliedStoreFilter, menus, ticketProducts]);

  const effectiveDraftStoreIds = useMemo(
    () => draftStoreScope === 'all' ? ALL_STORE_IDS : draftStoreIds,
    [draftStoreIds, draftStoreScope],
  );

  const conflicts = useMemo(() => menus.filter(menu => {
    if (menu.id === editingId || menu.status !== 'enabled') return false;
    return hasIntersection(menu.ticketIds, draftTicketIds) && hasIntersection(menu.storeIds, effectiveDraftStoreIds);
  }), [draftTicketIds, editingId, effectiveDraftStoreIds, menus]);

  const ticketStoreIssues = useMemo(() => draftTicketIds.flatMap(ticketId => {
    const ticket = getTicket(ticketId);
    if (!ticket) return [];
    return effectiveDraftStoreIds
      .filter(storeId => !ticket.availableStoreIds.includes(storeId))
      .map(storeId => `${ticket.name}未在${getStore(storeId)?.name || storeId}售卖`);
  }), [draftTicketIds, effectiveDraftStoreIds]);

  const productModeConflicts = useMemo(() => {
    const modesByProduct = new Map<string, Set<ItemMode>>();
    draftItems.forEach(item => {
      const modes = modesByProduct.get(item.productId) || new Set<ItemMode>();
      modes.add(item.mode);
      modesByProduct.set(item.productId, modes);
    });
    return Array.from(modesByProduct.entries())
      .filter(([, modes]) => modes.has('unlimited') && modes.has('limited'))
      .map(([productId]) => productId);
  }, [draftItems]);

  const nameConflict = menus.some(menu => menu.id !== editingId && menu.name.trim() === draftName.trim() && draftName.trim().length > 0);
  const rangeIssueCount = conflicts.length + ticketStoreIssues.length;
  const basicsComplete = draftName.trim().length > 0 && !nameConflict && draftTicketIds.length > 0;
  const menuComplete = draftItems.length > 0;
  const scopeComplete = draftStoreScope === 'all' || draftStoreIds.length > 0;
  const newTicketPrice = Number(newTicketForm.price);
  const newTicketPeople = Number(newTicketForm.applicablePeople);
  const newTicketValid = newTicketForm.name.trim().length > 0
    && newTicketForm.frontendCategory.length > 0
    && newTicketForm.price !== ''
    && Number.isFinite(newTicketPrice)
    && newTicketPrice >= 0
    && newTicketForm.applicablePeople !== ''
    && Number.isInteger(newTicketPeople)
    && newTicketPeople >= 1;

  const openEditor = (menu?: BuffetMenu) => {
    setEditingId(menu?.id || null);
    setDraftName(menu?.name || '');
    setDraftTicketIds(menu?.ticketIds || []);
    setDraftStoreScope(menu?.storeScope || 'all');
    setDraftStoreIds(menu?.storeScope === 'selected' ? menu.storeIds : []);
    setDraftItems(menu?.items || []);
    setActiveProductMode('unlimited');
    setValidatedSteps({});
    setStep(1);
    setEditorOpen(true);
    setDetailMenu(null);
  };

  const copyMenu = (menu: BuffetMenu) => {
    setEditingId(null);
    setDraftName(`${menu.name} - 副本`);
    setDraftTicketIds([]);
    setDraftStoreScope('selected');
    setDraftStoreIds([]);
    setDraftItems(menu.items.map(item => ({ ...item })));
    setActiveProductMode('unlimited');
    setValidatedSteps({});
    setStep(1);
    setEditorOpen(true);
    setDetailMenu(null);
  };

  const openTicketSelector = () => {
    setPendingTicketIds(draftTicketIds);
    setSelectorKeyword('');
    setTicketSelectorOpen(true);
  };

  const openCreateTicket = () => {
    setNewTicketForm({ name: '', frontendCategory: '', price: '', applicablePeople: '1', requiresDeposit: false, allowPosTemporaryPrice: false });
    setCreateTicketOpen(true);
  };

  const confirmCreateTicket = () => {
    if (!newTicketValid) return;
    const sequence = ticketProducts.length + 1;
    const ticket: TicketProduct = {
      id: `t-created-${sequence}`,
      name: newTicketForm.name.trim(),
      code: `BUFFET-${String(sequence).padStart(3, '0')}`,
      price: newTicketPrice,
      applicablePeople: newTicketPeople,
      frontendCategory: newTicketForm.frontendCategory,
      requiresDeposit: newTicketForm.requiresDeposit,
      allowPosTemporaryPrice: newTicketForm.allowPosTemporaryPrice,
      availableStoreIds: ALL_STORE_IDS,
    };
    setTicketProducts(current => [ticket, ...current]);
    setPendingTicketIds(current => current.includes(ticket.id) ? current : [...current, ticket.id]);
    setSelectorKeyword('');
    setCreateTicketOpen(false);
  };

  const openStoreSelector = () => {
    setPendingStoreIds(draftStoreIds);
    setSelectorKeyword('');
    setStoreSelectorOpen(true);
  };

  const openProductSelector = (mode: ItemMode) => {
    setPendingProductIds(draftItems.filter(item => item.mode === mode).map(item => item.productId));
    setProductSelectorMode(mode);
  };

  const confirmProducts = () => {
    if (!productSelectorMode) return;
    const otherItems = draftItems.filter(item => item.mode !== productSelectorMode);
    const existingById = new Map<string, BuffetMenuItem>(draftItems.map(item => [item.productId, item] as [string, BuffetMenuItem]));
    const nextItems = pendingProductIds.flatMap(productId => {
      const product = getProduct(productId);
      if (!product) return [];
      const previous = existingById.get(productId);
      return {
        productId,
        mode: productSelectorMode,
        limitQty: productSelectorMode === 'limited' ? previous?.limitQty || 1 : undefined,
      } as BuffetMenuItem;
    });
    setDraftItems([...otherItems, ...nextItems]);
    setProductSelectorMode(null);
  };

  const updateItem = (productId: string, patch: Partial<BuffetMenuItem>) => {
    setDraftItems(items => items.map(item => item.productId === productId ? { ...item, ...patch } : item));
  };

  const removeItem = (productId: string) => setDraftItems(items => items.filter(item => item.productId !== productId));

  const goToNextStep = () => {
    setValidatedSteps(current => ({ ...current, [step]: true }));
    if (step === 1 && basicsComplete) setStep(2);
    if (step === 2 && menuComplete && productModeConflicts.length === 0) setStep(3);
  };

  const goToEditorStep = (targetStep: EditorStep) => {
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }
    goToNextStep();
  };

  const saveMenu = (enable: boolean) => {
    const existing = editingId ? menus.find(menu => menu.id === editingId) : null;
    const nextStatus: MenuStatus = enable ? 'enabled' : existing?.status || 'disabled';
    if (!basicsComplete) {
      setValidatedSteps(current => ({ ...current, 1: true }));
      setStep(1);
      return;
    }
    if (!menuComplete || productModeConflicts.length > 0) {
      setValidatedSteps(current => ({ ...current, 2: true }));
      setStep(2);
      return;
    }
    setValidatedSteps(current => ({ ...current, 3: true }));
    if (!scopeComplete || ticketStoreIssues.length > 0 || (nextStatus === 'enabled' && conflicts.length > 0)) {
      setStep(3);
      return;
    }
    const nextMenu: BuffetMenu = {
      id: existing?.id || `bm-${String(menus.length + 1).padStart(3, '0')}`,
      name: draftName.trim() || '未命名自助餐菜单',
      sort: existing?.sort || Math.max(0, ...menus.map(menu => menu.sort)) + 1,
      ticketIds: draftTicketIds,
      storeScope: draftStoreScope,
      storeIds: effectiveDraftStoreIds,
      items: draftItems,
      status: nextStatus,
      updatedAt: '2026-08-19 16:08',
      updatedBy: '当前用户',
    };
    setMenus(current => existing
      ? current.map(menu => menu.id === existing.id ? nextMenu : menu)
      : [...current, nextMenu]);
    setEditorOpen(false);
  };

  const confirmToggle = () => {
    if (!confirmToggleMenu) return;
    setMenus(current => current.map(menu => menu.id === confirmToggleMenu.id
      ? { ...menu, status: menu.status === 'enabled' ? 'disabled' : 'enabled', updatedAt: '2026-08-19 16:08', updatedBy: '当前用户' }
      : menu));
    setConfirmToggleMenu(null);
  };

  const confirmDelete = () => {
    if (!confirmDeleteMenu || confirmDeleteMenu.status === 'enabled') return;
    setMenus(current => current
      .filter(menu => menu.id !== confirmDeleteMenu.id)
      .sort((left, right) => left.sort - right.sort)
      .map((menu, index) => ({ ...menu, sort: index + 1 })));
    setConfirmDeleteMenu(null);
  };

  const openSortModal = () => {
    setSortDraftRows([...menus]
      .sort((left, right) => left.sort - right.sort)
      .map((menu, index) => ({ ...menu, sort: index + 1 })));
    setSortDirty(false);
    setSortModalOpen(true);
  };

  const moveSortDraftRow = (dragId: string, targetId: string) => {
    const next = [...sortDraftRows];
    const dragIndex = next.findIndex(menu => menu.id === dragId);
    const targetIndex = next.findIndex(menu => menu.id === targetId);
    if (dragIndex === -1 || targetIndex === -1 || dragIndex === targetIndex) return;
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setSortDraftRows(next.map((menu, index) => ({ ...menu, sort: index + 1 })));
    setSortDirty(true);
  };

  const updateSortDraftRow = (menuId: string, nextSort: number) => {
    const next = [...sortDraftRows];
    const currentIndex = next.findIndex(menu => menu.id === menuId);
    const targetIndex = nextSort - 1;
    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= next.length || currentIndex === targetIndex) return;
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    setSortDraftRows(next.map((menu, index) => ({ ...menu, sort: index + 1 })));
    setSortDirty(true);
  };

  const requestCloseSortModal = () => {
    if (sortDirty) {
      setDiscardSortOpen(true);
      return;
    }
    setSortModalOpen(false);
  };

  const saveSortDraft = () => {
    const sortMap = new Map(sortDraftRows.map(menu => [menu.id, menu.sort]));
    setMenus(current => current.map(menu => ({ ...menu, sort: sortMap.get(menu.id) || menu.sort })));
    setSortDirty(false);
    setSortModalOpen(false);
  };

  const renderListState = () => {
    if (!filteredMenus.length) {
      return <EmptyState icon={<Search size={22} />} title="没有符合条件的菜单" description="请调整查询条件后重试。" action={<button type="button" onClick={() => { setKeyword(''); setStatusFilter('all'); setStoreFilter('all'); setAppliedKeyword(''); setAppliedStatusFilter('all'); setAppliedStoreFilter('all'); }} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px]">清空筛选</button>} />;
    }
    return (
      <div className="min-h-0 flex-1 overflow-auto no-scrollbar">
        <table className="w-full min-w-[1130px] table-fixed border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-[#F9FAFB] text-[#667085]">
            <tr className="h-10 border-y border-[#EAECF0]">
              <th className="w-[72px] px-4 font-medium">排序</th>
              <th className="w-[210px] px-4 font-medium">菜单名称</th>
              <th className="w-[220px] px-4 font-medium">关联自助餐门票（餐标）</th>
              <th className="w-[150px] px-4 font-medium">菜单商品</th>
              <th className="w-[150px] px-4 font-medium">适用门店</th>
              <th className="w-[88px] px-4 font-medium">状态</th>
              <th className="w-[138px] px-4 font-medium">最近更新</th>
              <th className="sticky right-0 z-20 w-[190px] border-l border-[#EAECF0] bg-[#F9FAFB] px-4 font-medium shadow-[-6px_0_10px_-10px_rgba(16,24,40,0.45)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMenus.map(menu => {
              const counts = ITEM_MODES.map(mode => ({ mode, count: menu.items.filter(item => item.mode === mode).length }));
              return (
                <tr key={menu.id} className="group h-[76px] border-b border-[#EAECF0] hover:bg-[#FAFFFC]">
                  <td className="px-4 text-[#475467]">{menu.sort}</td>
                  <td className="px-4">
                    <button type="button" onClick={() => setDetailMenu(menu)} className="block max-w-full truncate text-left font-semibold text-[#1D2939] hover:text-[#008F4C]" title={menu.name}>{menu.name}</button>
                    <div className="mt-1 text-[12px] text-[#98A2B3]">{menu.id.toUpperCase()}</div>
                  </td>
                  <td className="px-4"><TicketScopeSummary ticketIds={menu.ticketIds} resolve={id => getTicket(id)?.name} /></td>
                  <td className="px-4">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
                      {counts.map(({ mode, count }) => <span key={mode} className={count ? 'text-[#475467]' : 'text-[#C1C7D0]'}>{MODE_LABELS[mode].replace('商品', '')} {count}</span>)}
                    </div>
                  </td>
                  <td className="px-4"><StoreScopeSummary menu={menu} /></td>
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <Switch active={menu.status === 'enabled'} onClick={() => setConfirmToggleMenu(menu)} label={`${menu.name}${menu.status === 'enabled' ? '已启用' : '已停用'}`} />
                    </div>
                  </td>
                  <td className="px-4 text-[#475467]">
                    <div>{menu.updatedAt}</div>
                    <div className="mt-1 text-[12px] text-[#98A2B3]">{menu.updatedBy}</div>
                  </td>
                  <td className="sticky right-0 z-[5] border-l border-[#F2F4F7] bg-white px-4 shadow-[-6px_0_10px_-10px_rgba(16,24,40,0.45)] group-hover:bg-[#FAFFFC]">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setDetailMenu(menu)} className="text-[#008F4C] hover:text-[#006F3B]">查看</button>
                      <button type="button" onClick={() => openEditor(menu)} className="text-[#008F4C] hover:text-[#006F3B]">编辑</button>
                      <button type="button" onClick={() => copyMenu(menu)} className="text-[#667085] hover:text-[#344054]">复制</button>
                      <button type="button" onClick={() => setConfirmDeleteMenu(menu)} className="text-[#E5484D] hover:text-[#B42318]">删除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderList = () => (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA] p-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#EAECF0] px-4 py-3">
          <div className="relative min-w-[260px] flex-1 max-w-[360px]">
            <Search size={15} className="absolute left-3 top-2.5 text-[#98A2B3]" />
            <input value={keyword} onChange={event => setKeyword(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { setAppliedKeyword(keyword); setAppliedStatusFilter(statusFilter); setAppliedStoreFilter(storeFilter); } }} className="h-9 w-full rounded border border-[#D0D5DD] pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]" placeholder="搜索菜单名称、编号或餐标" />
          </div>
          <select value={storeFilter} onChange={event => setStoreFilter(event.target.value)} className="h-9 w-[170px] rounded border border-[#D0D5DD] px-3 text-[13px] text-[#344054] outline-none focus:border-[#00B460]">
            <option value="all">全部适用门店</option>
            {STORES.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
          </select>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'all' | MenuStatus)} className="h-9 w-[130px] rounded border border-[#D0D5DD] px-3 text-[13px] text-[#344054] outline-none focus:border-[#00B460]">
            <option value="all">全部状态</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已停用</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => { setKeyword(''); setStatusFilter('all'); setStoreFilter('all'); setAppliedKeyword(''); setAppliedStatusFilter('all'); setAppliedStoreFilter('all'); }} className="h-9 rounded border border-[#D0D5DD] px-4 text-[13px] text-[#344054] hover:bg-[#F9FAFB]">重置</button>
            <button type="button" onClick={() => { setAppliedKeyword(keyword); setAppliedStatusFilter(statusFilter); setAppliedStoreFilter(storeFilter); }} className="h-9 rounded bg-[#00B460] px-5 text-[13px] font-medium text-white hover:bg-[#009F56]">查询</button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-b border-[#EAECF0] px-4 py-3">
          <button type="button" onClick={openSortModal} className="flex h-8 items-center gap-2 rounded border border-[#D0D5DD] px-3 text-[13px] text-[#344054] hover:bg-[#F9FAFB]"><ListOrdered size={15} />排序管理</button>
          <button type="button" onClick={() => openEditor()} className="flex h-8 items-center gap-2 rounded bg-[#00B460] px-4 text-[13px] font-medium text-white hover:bg-[#009F56]"><Plus size={16} />创建自助餐菜单</button>
        </div>
        {renderListState()}
        {filteredMenus.length > 0 && (
          <div className="flex h-14 shrink-0 items-center justify-between border-t border-[#EAECF0] px-4 text-[13px] text-[#667085]">
            <span>每页 20 条</span>
            <div className="flex items-center gap-2"><button className="h-8 rounded border border-[#D0D5DD] px-3 text-[#98A2B3]" disabled>上一页</button><span className="flex h-8 w-8 items-center justify-center rounded bg-[#E8F8F0] font-medium text-[#008F4C]">1</span><button className="h-8 rounded border border-[#D0D5DD] px-3 text-[#98A2B3]" disabled>下一页</button></div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStepNavigation = () => {
    const steps: Array<{ id: EditorStep; title: string }> = [
      { id: 1, title: '餐标' },
      { id: 2, title: '菜单商品' },
      { id: 3, title: '适用门店' },
    ];
    return (
      <div className="border-b border-[#EAECF0] bg-white px-6">
        <div className="mx-auto flex h-[60px] max-w-[980px] items-center justify-between">
          {steps.map((item, index) => (
            <React.Fragment key={item.id}>
              <button type="button" onClick={() => goToEditorStep(item.id)} className="flex items-center gap-3 text-left">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${step === item.id ? 'bg-[#00B460] text-white' : step > item.id ? 'bg-[#E8F8F0] text-[#008F4C]' : 'bg-[#F2F4F7] text-[#98A2B3]'}`}>{step > item.id ? <Check size={16} /> : item.id}</span>
                <span className={`text-[13px] font-semibold ${step === item.id ? 'text-[#1D2939]' : 'text-[#667085]'}`}>{item.title}</span>
              </button>
              {index < steps.length - 1 && <div className={`mx-4 h-px min-w-[60px] flex-1 ${step > item.id ? 'bg-[#7DD3AA]' : 'bg-[#EAECF0]'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderTicketStep = () => (
    <div className="mx-auto w-full max-w-[980px] space-y-6 p-6">
      <h2 className="text-[18px] font-semibold text-[#1D2939]">菜单与餐标</h2>
      <div className="rounded-lg border border-[#EAECF0] bg-white p-5">
        <FieldLabel required helper="品牌内不可重名，最多 40 个字符">菜单名称</FieldLabel>
        <input value={draftName} maxLength={40} onChange={event => setDraftName(event.target.value)} className={`h-9 w-full max-w-[520px] rounded border px-3 text-[13px] outline-none ${validatedSteps[1] && (!draftName.trim() || nameConflict) ? 'border-[#E5484D]' : 'border-[#D0D5DD] focus:border-[#00B460]'}`} placeholder="例如：深圳午市成人畅享菜单" />
        {validatedSteps[1] && !draftName.trim() && <div className="mt-2 text-[12px] text-[#E5484D]">请输入菜单名称</div>}
        {validatedSteps[1] && nameConflict && <div className="mt-2 text-[12px] text-[#E5484D]">菜单名称已存在，请修改后再继续</div>}
      </div>
      <div className="rounded-lg border border-[#EAECF0] bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-5 py-4">
          <FieldLabel required>关联自助餐门票（餐标）</FieldLabel>
          <button type="button" onClick={openTicketSelector} className="flex h-8 items-center gap-2 rounded border border-[#A6E3C6] px-3 text-[13px] font-medium text-[#008F4C] hover:bg-[#F0FBF6]"><Ticket size={15} />选择自助餐门票</button>
        </div>
        {draftTicketIds.length ? <div className="overflow-x-auto"><table className="w-full min-w-[860px] table-fixed text-left text-[13px]"><thead className="bg-[#F9FAFB] text-[#475467]"><tr><th className="w-[300px] px-5 py-3 font-medium">商品名称</th><th className="w-[110px] px-4 py-3 font-medium">适用人数</th><th className="w-[110px] px-4 py-3 font-medium">收取押金</th><th className="w-[130px] px-4 py-3 font-medium">POS临时改价</th><th className="w-[120px] px-4 py-3 font-medium">售价</th><th className="w-[80px] px-4 py-3 font-medium">操作</th></tr></thead><tbody className="divide-y divide-[#EAECF0]">{draftTicketIds.map(id => { const ticket = getTicket(id); return ticket ? <tr key={id} className="text-[#344054]"><td className="px-5 py-3"><span className="block truncate font-medium text-[#1D2939]" title={ticket.name}>{ticket.name}</span><span className="mt-1 block text-[12px] text-[#98A2B3]">{ticket.code}</span></td><td className="px-4 py-3">{ticket.applicablePeople} 人</td><td className="px-4 py-3">{ticket.requiresDeposit ? '是' : '否'}</td><td className="px-4 py-3">{ticket.allowPosTemporaryPrice ? '是' : '否'}</td><td className="px-4 py-3">¥{ticket.price.toFixed(2)}</td><td className="px-4 py-3"><button type="button" onClick={() => setDraftTicketIds(ids => ids.filter(ticketId => ticketId !== id))} className="text-[#008F4C] hover:text-[#007A41]" aria-label={`移除${ticket.name}`}>移除</button></td></tr> : null; })}</tbody></table></div> : <div className="py-10 text-center text-[13px] text-[#98A2B3]">尚未选择自助餐门票</div>}
        {validatedSteps[1] && draftTicketIds.length === 0 && <div className="border-t border-[#F1B7B3] bg-[#FFF5F4] px-5 py-3 text-[12px] text-[#B42318]">请至少选择一张自助餐门票</div>}
      </div>
    </div>
  );

  const renderModeSection = (mode: ItemMode) => {
    const items = draftItems.filter(item => item.mode === mode);
    return (
      <section className="overflow-hidden rounded-lg border border-[#EAECF0] bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] bg-[#FCFCFD] px-4 py-3">
          <span className="text-[13px] text-[#667085]">共 {items.length} 个商品</span>
          <button type="button" onClick={() => openProductSelector(mode)} className="flex h-8 shrink-0 items-center gap-1.5 rounded border border-[#A6E3C6] px-3 text-[13px] font-medium text-[#008F4C] hover:bg-[#F0FBF6]"><Plus size={15} />添加商品</button>
        </div>
        {items.length === 0 ? (
          <button type="button" onClick={() => openProductSelector(mode)} className="flex w-full items-center justify-center gap-2 py-8 text-[13px] text-[#98A2B3] hover:bg-[#FAFFFC] hover:text-[#008F4C]"><Plus size={16} />添加{MODE_LABELS[mode]}</button>
        ) : (
          <table className="w-full table-fixed text-left text-[13px]">
            <thead className="bg-white text-[12px] text-[#98A2B3]"><tr className="h-9 border-b border-[#EAECF0]"><th className="px-4 font-medium">商品</th>{mode === 'limited' && <th className="w-[180px] px-4 font-medium">每人限量</th>}<th className="w-[72px] px-4 font-medium">操作</th></tr></thead>
            <tbody>
              {items.map(item => {
                const product = getProduct(item.productId);
                if (!product) return null;
                return (
                  <tr key={item.productId} className="h-[62px] border-b border-[#F2F4F7] last:border-0">
                    <td className="px-4"><div className="font-medium text-[#1D2939]">{product.name}</div><div className="mt-1 text-[12px] text-[#98A2B3]">{product.code} · {product.category}</div></td>
                    {mode === 'limited' && <td className="px-4"><div className="flex items-center gap-2"><input type="number" min={1} max={99} value={item.limitQty || 1} onChange={event => updateItem(item.productId, { limitQty: Math.max(1, Number(event.target.value) || 1) })} className="h-8 w-20 rounded border border-[#D0D5DD] px-2 text-right outline-none focus:border-[#00B460]" /><span className="text-[#667085]">份 / 人</span></div></td>}
                    <td className="px-4"><button type="button" onClick={() => removeItem(item.productId)} className="rounded p-1.5 text-[#98A2B3] hover:bg-[#FFF1F0] hover:text-[#E5484D]" aria-label={`移除${product.name}`}><Trash2 size={15} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    );
  };

  const renderProductsStep = () => (
    <div className="mx-auto w-full max-w-[1080px] space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[18px] font-semibold text-[#1D2939]">菜单商品</h2>
        <span className="text-[12px] text-[#667085]">共 {draftItems.length} 个商品</span>
      </div>
      <div className="flex h-11 items-end gap-6 border-b border-[#EAECF0] bg-white px-4" role="tablist" aria-label="菜单商品类型">
        {ITEM_MODES.map(mode => <button key={mode} type="button" role="tab" aria-selected={activeProductMode === mode} onClick={() => setActiveProductMode(mode)} className={`relative flex h-full items-center gap-2 px-1 text-[13px] ${activeProductMode === mode ? 'font-semibold text-[#008F4C] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#00B460]' : 'text-[#667085] hover:text-[#344054]'}`}><span>{MODE_LABELS[mode]}</span><span className={`rounded-full px-1.5 py-0.5 text-[11px] ${activeProductMode === mode ? 'bg-[#E8F8F0] text-[#008F4C]' : 'bg-[#F2F4F7] text-[#98A2B3]'}`}>{draftItems.filter(item => item.mode === mode).length}</span></button>)}
      </div>
      {validatedSteps[2] && !menuComplete && <div className="flex items-center gap-2 rounded border border-[#F1B7B3] bg-[#FFF5F4] px-4 py-3 text-[13px] text-[#B42318]"><AlertCircle size={16} />请至少添加一个菜单商品。</div>}
      {validatedSteps[2] && productModeConflicts.length > 0 && <div className="flex items-center gap-2 rounded border border-[#F1B7B3] bg-[#FFF5F4] px-4 py-3 text-[13px] text-[#B42318]"><AlertCircle size={16} />不限量与限量商品存在相同商品，请移除重复商品后再继续。</div>}
      {renderModeSection(activeProductMode)}
    </div>
  );

  const renderStoreStep = () => (
    <div className="mx-auto w-full max-w-[1020px] space-y-5 p-6">
      <h2 className="text-[18px] font-semibold text-[#1D2939]">适用门店</h2>
      <div className="rounded-lg border border-[#EAECF0] bg-white">
        <div className="border-b border-[#EAECF0] px-5 py-4">
          <FieldLabel required>适用范围</FieldLabel>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {([
              { value: 'all' as const, title: '全部门店' },
              { value: 'selected' as const, title: '指定门店' },
            ]).map(option => (
              <label key={option.value} className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${draftStoreScope === option.value ? 'border-[#00B460] bg-[#F0FBF6]' : 'border-[#D0D5DD] hover:border-[#98A2B3]'}`}>
                <input type="radio" name="buffet-store-scope" checked={draftStoreScope === option.value} onChange={() => setDraftStoreScope(option.value)} className="h-4 w-4 accent-[#00B460]" />
                <span className="text-[13px] font-medium text-[#344054]">{option.title}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mx-5 mt-4 flex items-start gap-3 rounded border border-[#B2CCFF] bg-[#F5F8FF] px-4 py-3 text-[12px] leading-5 text-[#475467]">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#3370FF]" />
          <span><strong className="font-medium text-[#344054]">下发提醒：</strong>菜单关联的餐标和商品需下发至适用门店；未下发的商品不会在门店 POS、扫码点单页面展示。</span>
        </div>
        {draftStoreScope === 'all' ? (
          <div className="flex items-center gap-3 px-5 py-5 text-[13px] text-[#344054]"><span className="flex h-9 w-9 items-center justify-center rounded bg-[#E8F8F0] text-[#008F4C]"><Store size={18} /></span><span className="font-medium">全部门店适用</span></div>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] px-5 py-3"><span className="text-[13px] text-[#667085]">已选 {draftStoreIds.length} 家门店</span><button type="button" onClick={openStoreSelector} className="flex h-8 items-center gap-2 rounded border border-[#A6E3C6] px-3 text-[13px] font-medium text-[#008F4C] hover:bg-[#F0FBF6]"><Store size={15} />选择门店</button></div>
            {draftStoreIds.length ? <div className="grid grid-cols-2 gap-3 p-5">
              {draftStoreIds.map(id => {
                const store = getStore(id);
                if (!store) return null;
                return <div key={id} className="flex items-center justify-between rounded border border-[#EAECF0] px-3 py-2.5"><span><span className="block font-medium text-[#344054]">{store.name}</span><span className="mt-0.5 block text-[12px] text-[#98A2B3]">{store.organization} · {store.code}</span></span><button type="button" onClick={() => setDraftStoreIds(ids => ids.filter(storeId => storeId !== id))} className="rounded p-1 text-[#98A2B3] hover:bg-[#F2F4F7]" aria-label={`移除${store.name}`}><X size={15} /></button></div>;
              })}
            </div> : <div className="flex flex-col items-center justify-center py-10 text-[13px] text-[#98A2B3]"><Store size={24} className="mb-2" />尚未选择指定门店</div>}
          </div>
        )}
      </div>
      {validatedSteps[3] && (!scopeComplete || rangeIssueCount > 0) && (
        <div className="overflow-hidden rounded-lg border border-[#F1B7B3] bg-white">
          <div className="flex items-center justify-between border-b border-[#F1B7B3] bg-[#FFF5F4] px-5 py-4"><h3 className="font-semibold text-[#B42318]">请处理后再保存</h3><span className="rounded bg-[#FFE9E7] px-2 py-1 text-[12px] font-medium text-[#B42318]">{(!scopeComplete ? 1 : 0) + rangeIssueCount} 个问题</span></div>
          <div className="divide-y divide-[#EAECF0]">
            {!scopeComplete && <div className="flex items-start gap-3 px-5 py-4"><AlertCircle size={17} className="mt-0.5 shrink-0 text-[#E5484D]" /><div><div className="font-medium text-[#B42318]">请选择适用门店</div><div className="mt-1 text-[12px] text-[#667085]">选择“指定门店”时，至少需要选择一家门店。</div></div></div>}
            {conflicts.map(menu => {
              const duplicateTickets = menu.ticketIds.filter(id => draftTicketIds.includes(id)).map(id => getTicket(id)?.name).filter(Boolean);
              const duplicateStores = menu.storeIds.filter(id => effectiveDraftStoreIds.includes(id)).map(id => getStore(id)?.name).filter(Boolean);
              return <div key={menu.id} className="flex items-start gap-3 px-5 py-4"><AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#E5484D]" /><div className="min-w-0 flex-1"><div className="font-medium text-[#B42318]">餐标与已启用菜单重复</div><div className="mt-1 text-[12px] leading-5 text-[#667085]">{duplicateTickets.join('、')} 在 {duplicateStores.join('、')} 已关联“{menu.name}”。需移除重叠门店或停用原菜单。</div></div><button type="button" onClick={() => setDetailMenu(menu)} className="shrink-0 text-[12px] text-[#008F4C]">查看原菜单</button></div>;
            })}
            {ticketStoreIssues.map(issue => <div key={issue} className="flex items-start gap-3 px-5 py-4"><AlertCircle size={17} className="mt-0.5 shrink-0 text-[#E5484D]" /><div><div className="font-medium text-[#B42318]">餐标不在门店售卖</div><div className="mt-1 text-[12px] text-[#667085]">{issue}，请先调整门票的门店覆盖或从本菜单移除该门店。</div></div></div>)}
          </div>
        </div>
      )}
    </div>
  );

  const renderEditor = () => (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#EAECF0] bg-white px-5">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setEditorOpen(false)} className="rounded p-1.5 text-[#667085] hover:bg-[#F2F4F7]" aria-label="返回列表"><ArrowLeft size={18} /></button><div><div className="font-semibold text-[#1D2939]">{editingId ? '编辑自助餐菜单' : '创建自助餐菜单'}</div><div className="text-[12px] text-[#98A2B3]">{editingId ? editingId.toUpperCase() : '保存后生成菜单编号'}</div></div></div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => setEditorOpen(false)} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px] text-[#344054]">取消</button><button type="button" onClick={() => saveMenu(false)} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px] text-[#344054]">保存</button><button type="button" onClick={() => saveMenu(true)} className="h-8 rounded bg-[#00B460] px-4 text-[13px] font-medium text-white">保存并启用</button></div>
      </div>
      {renderStepNavigation()}
      <div className="min-h-0 flex-1 overflow-auto">
        {step === 1 && renderTicketStep()}
        {step === 2 && renderProductsStep()}
        {step === 3 && renderStoreStep()}
      </div>
      <div className="flex h-16 shrink-0 items-center justify-between border-t border-[#EAECF0] bg-white px-6">
        <button type="button" onClick={() => step > 1 && setStep((step - 1) as EditorStep)} disabled={step === 1} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px] text-[#344054] disabled:opacity-40">上一步</button>
        <div className="text-[12px] text-[#98A2B3]">第 {step} / 3 步</div>
        {step < 3 ? <button type="button" onClick={goToNextStep} className="h-8 rounded bg-[#00B460] px-4 text-[13px] font-medium text-white">下一步</button> : <div className="flex gap-2"><button type="button" onClick={() => saveMenu(false)} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px] text-[#344054]">保存</button><button type="button" onClick={() => saveMenu(true)} className="h-8 rounded bg-[#00B460] px-4 text-[13px] font-medium text-white">保存并启用</button></div>}
      </div>
    </div>
  );

  const renderDetailDrawer = () => {
    if (!detailMenu) return null;
    return (
      <div className="fixed inset-0 z-[80] bg-black/20" onMouseDown={event => { if (event.target === event.currentTarget) setDetailMenu(null); }}>
        <aside className="absolute inset-y-0 right-0 flex w-[520px] max-w-[calc(100vw-48px)] flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="自助餐菜单详情">
          <div className="flex h-16 shrink-0 items-start justify-between border-b border-[#EAECF0] px-5 py-3"><div className="min-w-0"><div className="truncate text-[16px] font-semibold text-[#1D2939]">{detailMenu.name}</div><div className="mt-1 flex items-center gap-2 text-[12px] text-[#98A2B3]">{detailMenu.id.toUpperCase()}<StatusBadge status={detailMenu.status} /></div></div><button type="button" onClick={() => setDetailMenu(null)} className="rounded p-1.5 text-[#667085] hover:bg-[#F2F4F7]" aria-label="关闭"><X size={18} /></button></div>
          <div className="min-h-0 flex-1 overflow-auto p-5">
            <section className="border-b border-[#EAECF0] pb-5"><h3 className="text-[13px] font-semibold text-[#344054]">关联餐标</h3><div className="mt-3 space-y-2">{detailMenu.ticketIds.map(id => { const ticket = getTicket(id); return ticket ? <div key={id} className="flex items-center gap-3 rounded bg-[#F9FAFB] px-3 py-2.5"><Ticket size={16} className="text-[#008F4C]" /><span className="min-w-0 flex-1"><span className="block truncate font-medium text-[#344054]">{ticket.name}</span><span className="text-[12px] text-[#98A2B3]">{ticket.code}</span></span><span className="shrink-0 text-right text-[12px] text-[#667085]"><span className="block">适用人数 {ticket.applicablePeople} 人</span><span className="mt-1 block">售价 ¥{ticket.price.toFixed(2)}</span></span></div> : null; })}</div></section>
            <section className="border-b border-[#EAECF0] py-5"><h3 className="text-[13px] font-semibold text-[#344054]">菜单商品</h3><div className="mt-3 space-y-4">{ITEM_MODES.map(mode => { const items = detailMenu.items.filter(item => item.mode === mode); return <div key={mode}><div className="mb-2 flex items-center gap-2"><span className={`rounded px-2 py-0.5 text-[12px] font-medium ${MODE_STYLES[mode].badge}`}>{MODE_LABELS[mode]}</span><span className="text-[12px] text-[#98A2B3]">{items.length} 个商品</span></div><div className="space-y-1.5">{items.map(item => { const product = getProduct(item.productId); return product ? <div key={item.productId} className="flex items-center justify-between gap-3 rounded bg-[#F9FAFB] px-3 py-2 text-[13px]"><span className="min-w-0 text-[#344054]"><span className="block truncate">{product.name}</span><span className="mt-0.5 block text-[11px] text-[#98A2B3]">{product.code} · {product.category}</span></span><span className="shrink-0 text-[12px] text-[#667085]">{mode === 'limited' ? `${item.limitQty} 份 / 人` : '不限量'}</span></div> : null; })}</div></div>; })}</div></section>
            <section className="py-5"><h3 className="text-[13px] font-semibold text-[#344054]">适用门店</h3>{detailMenu.storeScope === 'all' ? <div className="mt-3 inline-flex rounded border border-[#A6E3C6] bg-[#F0FBF6] px-2.5 py-1.5 text-[12px] text-[#176B45]">全部门店（{STORES.length} 家）</div> : <div className="mt-3 flex flex-wrap gap-2">{detailMenu.storeIds.map(id => <span key={id} className="rounded border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-[12px] text-[#475467]">{getStore(id)?.name}</span>)}</div>}<div className="mt-4 text-[12px] text-[#98A2B3]">最近由 {detailMenu.updatedBy} 于 {detailMenu.updatedAt} 更新</div></section>
          </div>
          <div className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-[#EAECF0] px-5"><button type="button" onClick={() => copyMenu(detailMenu)} className="flex h-8 items-center gap-2 rounded border border-[#D0D5DD] px-3 text-[13px] text-[#344054]"><Copy size={14} />复制</button><button type="button" onClick={() => openEditor(detailMenu)} className="h-8 rounded bg-[#00B460] px-4 text-[13px] font-medium text-white">编辑菜单</button></div>
        </aside>
      </div>
    );
  };

  const filteredSelectorTickets = ticketProducts.filter(ticket => !selectorKeyword.trim() || `${ticket.name}${ticket.code}${ticket.frontendCategory}`.toLowerCase().includes(selectorKeyword.trim().toLowerCase()));
  const filteredSelectorStores = STORES.filter(store => !selectorKeyword.trim() || `${store.name}${store.code}${store.organization}${store.region}`.toLowerCase().includes(selectorKeyword.trim().toLowerCase()));
  const storeGroups = Array.from(new Set(filteredSelectorStores.map(store => store.organization)));

  return (
    <>
      {editorOpen ? renderEditor() : renderList()}
      {renderDetailDrawer()}

      {sortModalOpen && (
        <MenuSortModal
          rows={sortDraftRows}
          dirty={sortDirty}
          onMoveRow={moveSortDraftRow}
          onChangeSort={updateSortDraftRow}
          onCancel={requestCloseSortModal}
          onSave={saveSortDraft}
        />
      )}

      {discardSortOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="确认放弃菜单排序修改">
          <div className="w-[440px] max-w-full rounded-lg bg-white shadow-2xl">
            <div className="flex items-start gap-3 p-5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF7E8] text-[#B76500]"><AlertTriangle size={18} /></span>
              <div><h3 className="text-[16px] font-semibold text-[#1D2939]">放弃排序修改？</h3><p className="mt-2 text-[13px] leading-6 text-[#667085]">当前菜单顺序尚未保存，放弃后将恢复为调整前的排序。</p></div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#EAECF0] px-5 py-4">
              <button type="button" onClick={() => setDiscardSortOpen(false)} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px] text-[#344054]">继续调整</button>
              <button type="button" onClick={() => { setDiscardSortOpen(false); setSortModalOpen(false); setSortDirty(false); }} className="h-8 rounded bg-[#E5484D] px-4 text-[13px] font-medium text-white">放弃修改</button>
            </div>
          </div>
        </div>
      )}

      {ticketSelectorOpen && (
        <SelectionModal title="选择自助餐门票" selectedCount={pendingTicketIds.length} width="w-[760px]" onClose={() => setTicketSelectorOpen(false)} onConfirm={() => { setDraftTicketIds(pendingTicketIds); setTicketSelectorOpen(false); }}>
          <div className="flex items-center justify-between gap-4 border-b border-[#EAECF0] p-4"><div className="relative w-[380px]"><Search size={15} className="absolute left-3 top-2.5 text-[#98A2B3]" /><input value={selectorKeyword} onChange={event => setSelectorKeyword(event.target.value)} className="h-9 w-full rounded border border-[#D0D5DD] pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]" placeholder="搜索门票名称、编码或前台分类" /></div><button type="button" onClick={openCreateTicket} className="flex h-9 shrink-0 items-center gap-1.5 rounded border border-[#A6E3C6] px-3 text-[13px] font-medium text-[#008F4C] hover:bg-[#F0FBF6]"><Plus size={15} />新增自助餐门票</button></div>
          <div className="min-h-[360px] divide-y divide-[#EAECF0]">
            {filteredSelectorTickets.map(ticket => { const selected = pendingTicketIds.includes(ticket.id); return <label key={ticket.id} className={`flex cursor-pointer items-center gap-4 px-5 py-4 ${selected ? 'bg-[#F5FCF8]' : 'hover:bg-[#F9FAFB]'}`}><input type="checkbox" checked={selected} onChange={() => setPendingTicketIds(ids => selected ? ids.filter(id => id !== ticket.id) : [...ids, ticket.id])} className="h-4 w-4 accent-[#00B460]" /><span className="flex h-10 w-10 items-center justify-center rounded bg-[#E8F8F0] text-[#008F4C]"><Ticket size={18} /></span><span className="min-w-0 flex-1"><span className="block font-medium text-[#1D2939]">{ticket.name}</span><span className="mt-1 block text-[12px] text-[#98A2B3]">{ticket.code} · {ticket.frontendCategory} · {ticket.requiresDeposit ? '收取押金' : '不收押金'}</span></span><span className="w-[88px] shrink-0 text-right"><span className="block text-[13px] text-[#344054]">{ticket.applicablePeople} 人</span><span className="mt-1 block text-[11px] text-[#98A2B3]">适用人数</span></span><span className="w-[100px] shrink-0 text-right"><span className="block text-[13px] text-[#344054]">¥{ticket.price.toFixed(2)}</span><span className="mt-1 block text-[11px] text-[#98A2B3]">售价</span></span></label>; })}
          </div>
        </SelectionModal>
      )}

      {createTicketOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal="true" aria-label="新增自助餐门票">
          <div className="w-[640px] max-w-full overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-[#EAECF0] px-5">
              <h3 className="text-[16px] font-semibold text-[#1D2939]">新增自助餐门票</h3>
              <button type="button" onClick={() => setCreateTicketOpen(false)} aria-label="关闭" className="rounded p-1.5 text-[#667085] hover:bg-[#F2F4F7]"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 p-5">
              <label className="col-span-2"><span className="mb-2 block text-[13px] font-medium text-[#344054]">商品名称 <span className="text-[#E5484D]">*</span></span><input value={newTicketForm.name} maxLength={40} onChange={event => setNewTicketForm(form => ({ ...form, name: event.target.value }))} className="h-9 w-full rounded border border-[#D0D5DD] px-3 text-[13px] outline-none focus:border-[#00B460]" placeholder="请输入自助餐门票名称" /></label>
              <label><span className="mb-2 block text-[13px] font-medium text-[#344054]">前台分类 <span className="text-[#E5484D]">*</span></span><select value={newTicketForm.frontendCategory} onChange={event => setNewTicketForm(form => ({ ...form, frontendCategory: event.target.value }))} className="h-9 w-full rounded border border-[#D0D5DD] bg-white px-3 text-[13px] outline-none focus:border-[#00B460]"><option value="">请选择前台分类</option>{FRONTEND_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
              <label><span className="mb-2 block text-[13px] font-medium text-[#344054]">商品售价 <span className="text-[#E5484D]">*</span></span><span className="flex h-9 items-center rounded border border-[#D0D5DD] px-3 focus-within:border-[#00B460]"><span className="mr-2 text-[13px] text-[#667085]">¥</span><input type="number" min={0} step={0.01} value={newTicketForm.price} onChange={event => setNewTicketForm(form => ({ ...form, price: event.target.value }))} className="min-w-0 flex-1 text-[13px] outline-none" placeholder="0.00" /></span></label>
              <label><span className="mb-2 block text-[13px] font-medium text-[#344054]">适用人数 <span className="text-[#E5484D]">*</span></span><span className="flex h-9 items-center rounded border border-[#D0D5DD] px-3 focus-within:border-[#00B460]"><input type="number" min={1} step={1} value={newTicketForm.applicablePeople} onChange={event => setNewTicketForm(form => ({ ...form, applicablePeople: event.target.value }))} className="min-w-0 flex-1 text-[13px] outline-none" /><span className="ml-2 text-[13px] text-[#667085]">人</span></span></label>
              <div><span className="mb-2 block text-[13px] font-medium text-[#344054]">是否收取押金</span><div className="flex h-9 items-center gap-3"><Switch active={newTicketForm.requiresDeposit} onClick={() => setNewTicketForm(form => ({ ...form, requiresDeposit: !form.requiresDeposit }))} label={newTicketForm.requiresDeposit ? '收取押金' : '不收取押金'} /><span className="text-[13px] text-[#475467]">{newTicketForm.requiresDeposit ? '收取押金' : '不收取押金'}</span></div></div>
              <label className="col-span-2 flex cursor-pointer items-start gap-3 rounded border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3"><input type="checkbox" checked={newTicketForm.allowPosTemporaryPrice} onChange={event => setNewTicketForm(form => ({ ...form, allowPosTemporaryPrice: event.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-[#D0D5DD] accent-[#00B460]" /><span><span className="block text-[13px] font-medium text-[#344054]">POS临时改价</span><span className="mt-1 block text-[12px] text-[#98A2B3]">开启后，用于企迈 POS 端临时改价场景</span></span></label>
            </div>
            <div className="flex h-16 items-center justify-end gap-2 border-t border-[#EAECF0] px-5">
              <button type="button" onClick={() => setCreateTicketOpen(false)} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px] text-[#344054]">取消</button>
              <button type="button" onClick={confirmCreateTicket} disabled={!newTicketValid} className="h-8 rounded bg-[#00B460] px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#A6DCC2]">保存并选择</button>
            </div>
          </div>
        </div>
      )}

      <WebProductSelectorDialog
        open={productSelectorMode !== null}
        title={productSelectorMode ? `添加${MODE_LABELS[productSelectorMode]}` : '选择商品'}
        description="按商品选择；已加入其他菜单分组的商品不可重复选择。"
        products={SPU_SELECTOR_PRODUCTS}
        selectedIds={pendingProductIds}
        onSelectedIdsChange={setPendingProductIds}
        onCancel={() => setProductSelectorMode(null)}
        onConfirm={confirmProducts}
        confirmLabel="确认添加"
        disabledIds={draftItems.filter(item => item.mode !== productSelectorMode).map(item => item.productId)}
        disabledLabel="已在其他分组"
        showSkuFields={false}
      />

      {storeSelectorOpen && (
        <SelectionModal title="选择适用门店" selectedCount={pendingStoreIds.length} onClose={() => setStoreSelectorOpen(false)} onConfirm={() => { setDraftStoreIds(pendingStoreIds); setStoreSelectorOpen(false); }}>
          <div className="grid min-h-[500px] grid-cols-[1fr_280px]">
            <div className="border-r border-[#EAECF0]">
              <div className="border-b border-[#EAECF0] p-4"><div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-[#98A2B3]" /><input value={selectorKeyword} onChange={event => setSelectorKeyword(event.target.value)} className="h-9 w-full rounded border border-[#D0D5DD] pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]" placeholder="搜索门店名称、编码、区域或组织" /></div></div>
              <div className="max-h-[470px] overflow-auto p-3">{storeGroups.map(group => { const groupStores = filteredSelectorStores.filter(store => store.organization === group); const allSelected = groupStores.every(store => pendingStoreIds.includes(store.id)); return <div key={group} className="mb-3 overflow-hidden rounded border border-[#EAECF0]"><label className="flex cursor-pointer items-center gap-3 bg-[#F9FAFB] px-3 py-2.5 font-medium text-[#344054]"><input type="checkbox" checked={allSelected} onChange={() => setPendingStoreIds(ids => allSelected ? ids.filter(id => !groupStores.some(store => store.id === id)) : Array.from(new Set([...ids, ...groupStores.map(store => store.id)])))} className="h-4 w-4 accent-[#00B460]" />{group}<span className="text-[12px] font-normal text-[#98A2B3]">{groupStores.length} 家</span></label>{groupStores.map(store => { const selected = pendingStoreIds.includes(store.id); return <label key={store.id} className={`flex cursor-pointer items-center gap-3 border-t border-[#EAECF0] px-4 py-3 ${selected ? 'bg-[#F5FCF8]' : 'hover:bg-[#FCFCFD]'}`}><input type="checkbox" checked={selected} onChange={() => setPendingStoreIds(ids => selected ? ids.filter(id => id !== store.id) : [...ids, store.id])} className="h-4 w-4 accent-[#00B460]" /><span className="flex-1"><span className="block text-[13px] text-[#344054]">{store.name}</span><span className="text-[12px] text-[#98A2B3]">{store.code} · {store.region}</span></span></label>; })}</div>; })}</div>
            </div>
            <div className="bg-[#FCFCFD] p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[13px] font-semibold text-[#344054]">已选门店</span>{pendingStoreIds.length > 0 && <button type="button" onClick={() => setPendingStoreIds([])} className="text-[12px] text-[#667085]">清空</button>}</div><div className="space-y-2">{pendingStoreIds.length ? pendingStoreIds.map(id => <div key={id} className="flex items-center justify-between rounded border border-[#EAECF0] bg-white px-3 py-2 text-[12px] text-[#475467]"><span className="truncate">{getStore(id)?.name}</span><button type="button" onClick={() => setPendingStoreIds(ids => ids.filter(storeId => storeId !== id))} aria-label={`移除${getStore(id)?.name}`}><X size={14} /></button></div>) : <div className="pt-16 text-center text-[12px] text-[#98A2B3]">尚未选择门店</div>}</div></div>
          </div>
        </SelectionModal>
      )}

      {confirmToggleMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="确认切换菜单状态">
          <div className="w-[460px] max-w-full rounded-lg bg-white shadow-2xl"><div className="flex items-start gap-3 p-5"><span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${confirmToggleMenu.status === 'enabled' ? 'bg-[#FFF1F0] text-[#E5484D]' : 'bg-[#E8F8F0] text-[#008F4C]'}`}><AlertTriangle size={18} /></span><div><h3 className="text-[16px] font-semibold text-[#1D2939]">确认{confirmToggleMenu.status === 'enabled' ? '停用' : '启用'}“{confirmToggleMenu.name}”</h3><p className="mt-2 text-[13px] leading-6 text-[#667085]">影响 {confirmToggleMenu.ticketIds.length} 张餐标、{confirmToggleMenu.storeIds.length} 家门店。{confirmToggleMenu.status === 'enabled' ? '停用后，顾客将无法通过这些餐标匹配该菜单；已下单商品不回滚。' : '启用前系统将再次校验同餐标、同门店是否已有启用菜单。'}</p></div></div><div className="flex justify-end gap-2 border-t border-[#EAECF0] px-5 py-4"><button type="button" onClick={() => setConfirmToggleMenu(null)} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px]">取消</button><button type="button" onClick={confirmToggle} className={`h-8 rounded px-4 text-[13px] font-medium text-white ${confirmToggleMenu.status === 'enabled' ? 'bg-[#E5484D]' : 'bg-[#00B460]'}`}>确认{confirmToggleMenu.status === 'enabled' ? '停用' : '启用'}</button></div></div>
        </div>
      )}

      {confirmDeleteMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true" aria-label="确认删除自助餐菜单">
          <div className="w-[480px] max-w-full rounded-lg bg-white shadow-2xl">
            <div className="flex items-start gap-3 p-5">
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${confirmDeleteMenu.status === 'enabled' ? 'bg-[#FFF7E8] text-[#B76500]' : 'bg-[#FFF1F0] text-[#E5484D]'}`}><AlertTriangle size={18} /></span>
              <div>
                <h3 className="text-[16px] font-semibold text-[#1D2939]">{confirmDeleteMenu.status === 'enabled' ? '请先停用菜单' : `确认删除“${confirmDeleteMenu.name}”`}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#667085]">{confirmDeleteMenu.status === 'enabled' ? `该菜单正在 ${confirmDeleteMenu.storeIds.length} 家门店生效，不能直接删除。请先停用，确认顾客不再命中该菜单后再删除。` : `将删除该菜单及其 ${confirmDeleteMenu.items.length} 个商品配置，影响 ${confirmDeleteMenu.ticketIds.length} 张餐标、${confirmDeleteMenu.storeIds.length} 家门店。删除后无法恢复，不影响已产生的订单，操作将记录日志。`}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#EAECF0] px-5 py-4">
              <button type="button" onClick={() => setConfirmDeleteMenu(null)} className="h-8 rounded border border-[#D0D5DD] px-4 text-[13px]">取消</button>
              {confirmDeleteMenu.status === 'enabled' ? <button type="button" onClick={() => { const menu = confirmDeleteMenu; setConfirmDeleteMenu(null); setConfirmToggleMenu(menu); }} className="h-8 rounded bg-[#00B460] px-4 text-[13px] font-medium text-white">先停用</button> : <button type="button" onClick={confirmDelete} className="h-8 rounded bg-[#E5484D] px-4 text-[13px] font-medium text-white">确认删除</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
