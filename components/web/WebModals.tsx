import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  FileUp,
  Info,
  Link2,
  Loader2,
  Search,
  ShoppingBag,
  Store,
  X,
  CupSoda,
  Utensils,
  Scale,
  CakeSlice,
  Flame,
  Ticket,
} from 'lucide-react';
import { Category } from '../../types';
import { WebImportReviewModal } from './WebImportReviewModal';

type ImportSource = 'local' | 'external_file' | 'takeout_auth';
type ImportStep = 'source' | 'file_upload' | 'analyzing' | 'review' | 'auth_setup' | 'auth_pulling' | 'auth_review' | 'auth_done';
type PlatformId = 'meituan' | 'taobao';
type AuthStatus = 'idle' | 'binding' | 'authorized' | 'pulled';
type BindingType = 'takeout_service' | 'takeout_self' | 'non_order_service' | 'service' | 'self';
type ProductType = 'standard' | 'combo';

type AuthStore = {
  id: string;
  name: string;
  brand: string;
  storeNo: string;
  authorized: boolean;
  bindType?: string;
  lastImportAt?: string;
};

type AuthProduct = {
  id: string;
  name: string;
  productType: ProductType;
  category: string;
  price?: number;
  specSummary: string;
  hasMultipleSpecs?: boolean;
  specs?: Array<{ id: string; name: string; price?: number }>;
  addons: string;
  methods: string;
  sameName?: string;
  importable: boolean;
};

type ProductEditDraft = Partial<Omit<AuthProduct, 'price'>> & { price?: number | string };

const IMPORT_SOURCES: Array<{ id: ImportSource; name: string; desc: string; icon: React.ReactNode }> = [
  { id: 'local', name: '本地标准导入', desc: '上传模板文件导入商品', icon: <FileSpreadsheet size={20} /> },
  { id: 'external_file', name: '三方平台文件导入', desc: '上传外部平台导出的商品文件', icon: <FileText size={20} /> },
  { id: 'takeout_auth', name: '三方外卖授权导入', desc: '授权门店后拉取商品导入', icon: <Link2 size={20} /> },
];

const AUTH_PLATFORMS: Array<{ id: PlatformId; name: string; desc: string; color: string }> = [
  { id: 'meituan', name: '美团外卖', desc: '授权门店后拉取外卖商品资料', color: 'bg-[#FFE68A] text-[#5B3B00]' },
  { id: 'taobao', name: '淘宝闪购', desc: '授权门店后拉取闪购商品资料', color: 'bg-[#FFF0E6] text-[#D95000]' },
];

const AUTH_STORES: Record<PlatformId, AuthStore[]> = {
  meituan: [
    { id: 'mt-1', name: '静静咖啡国贸店', brand: '静静咖啡', storeNo: '538', authorized: true, bindType: '外卖接单-服务商', lastImportAt: '2026-06-08 14:22' },
    { id: 'mt-2', name: '静静咖啡望京店', brand: '静静咖啡', storeNo: '612', authorized: false },
    { id: 'mt-3', name: '静静咖啡中关村店', brand: '静静咖啡', storeNo: '711', authorized: false },
  ],
  taobao: [
    { id: 'tb-1', name: '青芽轻食软件园店', brand: '青芽轻食', storeNo: '538', authorized: true, bindType: '服务商', lastImportAt: '2026-06-09 11:06' },
    { id: 'tb-2', name: '青芽轻食会展店', brand: '青芽轻食', storeNo: '802', authorized: false },
    { id: 'tb-3', name: '青芽轻食万象城店', brand: '青芽轻食', storeNo: '916', authorized: false },
  ],
};

const AUTH_PRODUCTS: Record<PlatformId, AuthProduct[]> = {
  meituan: [
    { id: 'mt-p1', name: '生椰拿铁', productType: 'standard', category: '咖啡', price: 22, specSummary: '多规格', hasMultipleSpecs: true, specs: [{ id: 'mt-p1-s1', name: '中杯', price: 22 }, { id: 'mt-p1-s2', name: '大杯', price: 26 }], addons: '加椰乳 / 加浓缩', methods: '少冰 / 热饮', sameName: '总部商品库已有同名商品，请确认是否仍导入', importable: true },
    { id: 'mt-p2', name: '抹茶芝士', productType: 'standard', category: '茶饮', price: 19, specSummary: '单规格', addons: '波波 / 椰果', methods: '少糖 / 温热', importable: true },
    { id: 'mt-p3', name: '双人咖啡套餐', productType: 'combo', category: '套餐', price: 39, specSummary: '套餐组合', addons: '含拿铁 / 可颂', methods: '冰热任选', importable: true },
    { id: 'mt-p4', name: '双柚轻果茶', productType: 'standard', category: '', price: 21, specSummary: '单规格', addons: '西柚粒', methods: '少糖', importable: false },
  ],
  taobao: [
    { id: 'tb-p1', name: '轻盈鸡肉沙拉', productType: 'standard', category: '轻食', price: 26, specSummary: '单规格', addons: '玉米粒 / 牛油果', methods: '酱汁分装', importable: true },
    { id: 'tb-p2', name: '双拼嫩牛饭套餐', productType: 'combo', category: '盖饭', price: 32, specSummary: '套餐组合', addons: '加蛋', methods: '少饭', sameName: '总部商品库已有相近商品，请确认是否仍导入', importable: true },
    { id: 'tb-p3', name: '招牌芒果酸奶', productType: 'standard', category: '饮品', price: undefined, specSummary: '多规格', hasMultipleSpecs: true, specs: [{ id: 'tb-p3-s1', name: '中杯', price: undefined }, { id: 'tb-p3-s2', name: '大杯', price: 18 }], addons: '脆啵啵', methods: '去冰', importable: false },
  ],
};

const BINDING_TYPES: Record<PlatformId, Array<{ id: BindingType; label: string; desc: string }>> = {
  meituan: [
    { id: 'takeout_service', label: '外卖接单-服务商', desc: '由服务商完成外卖接单与商品资料授权' },
    { id: 'takeout_self', label: '外卖接单-品牌自研', desc: '品牌自研应用完成外卖接单与商品资料授权' },
    { id: 'non_order_service', label: '非接单-服务商', desc: '仅授权商品资料等非接单能力' },
  ],
  taobao: [
    { id: 'service', label: '服务商', desc: '由服务商完成淘宝闪购门店授权' },
    { id: 'self', label: '品牌自研', desc: '品牌自研应用完成淘宝闪购门店授权' },
  ],
};

type ThirdPartyImportRecord = {
  id: string;
  platform: string;
  storeName: string;
  storeNo: string;
  importTime: string;
  operator: string;
  status: 'success' | 'partial' | 'failed';
  total: number;
  success: number;
  failed: number;
  skipped: number;
};

const THIRD_PARTY_IMPORT_RECORDS: ThirdPartyImportRecord[] = [
  { id: 'IMP-20260612-001', platform: '美团外卖', storeName: '静静咖啡国贸店', storeNo: '538', importTime: '2026-06-12 10:18', operator: '企迈静静', status: 'success', total: 48, success: 45, failed: 0, skipped: 3 },
  { id: 'IMP-20260611-006', platform: '淘宝闪购', storeName: '青芽轻食软件园店', storeNo: '538', importTime: '2026-06-11 16:42', operator: '企迈静静', status: 'partial', total: 36, success: 31, failed: 2, skipped: 3 },
  { id: 'IMP-20260610-002', platform: '美团外卖', storeName: '静静咖啡望京店', storeNo: '612', importTime: '2026-06-10 14:05', operator: '实施-王明', status: 'failed', total: 24, success: 0, failed: 24, skipped: 0 },
];

const getDefaultSelectedIds = (platform: PlatformId) => AUTH_PRODUCTS[platform].filter(item => item.importable).map(item => item.id);
const getInitialAuthorizedIds = () => Object.values(AUTH_STORES).flat().filter(store => store.authorized).map(store => store.id);
const getProductTypeText = (type?: ProductType) => (type === 'combo' ? '套餐商品' : '标准商品');
const hasValidProductPrice = (product: Partial<AuthProduct> & { price?: number | string }) => {
  if (product.hasMultipleSpecs) {
    return !!product.specs?.length && product.specs.every(spec => typeof spec.price === 'number' && !Number.isNaN(spec.price));
  }
  return typeof product.price === 'number' && !Number.isNaN(product.price);
};
const getProductPriceText = (product: AuthProduct) => {
  if (product.hasMultipleSpecs) {
    const prices = product.specs?.map(spec => spec.price).filter((price): price is number => typeof price === 'number' && !Number.isNaN(price)) || [];
    if (!prices.length) return '';
    return `￥${Math.min(...prices)}起`;
  }
  if (typeof product.price !== 'number') return '';
  return `￥${product.price}`;
};
const canImportProduct = (product: AuthProduct) => !!product.name && !!product.category && hasValidProductPrice(product);

const downloadProductTemplate = (type: ProductType) => {
  const headers = type === 'combo'
    ? ['套餐名称', '套餐分类', '套餐售价', '子商品名称', '子商品数量']
    : ['商品名称', '商品分类', '商品售价', '规格名称', '商品条码'];
  const blob = new Blob([`\uFEFF${headers.join(',')}\n`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = type === 'combo' ? '套餐商品导入模板.csv' : '标准商品导入模板.csv';
  link.click();
  URL.revokeObjectURL(url);
};

export const WebThirdPartyImportRecordsModal: React.FC<{ onClose: () => void; onStartImport?: () => void }> = ({ onClose, onStartImport }) => {
  return (
    <ModalShell widthClass="w-[calc(100vw-48px)] max-w-[1040px]">
      <ModalHeader title="授权导入记录" onClose={onClose} />
      <div className="space-y-5 px-8 py-7">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#667085]">仅展示三方外卖授权导入记录，文件导入记录仍在原入口查看。</div>
          <button
            onClick={() => {
              onClose();
              onStartImport?.();
            }}
            className="rounded-xl bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]"
          >
            发起授权导入
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E6ECF2] bg-white">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-[#667085]">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">导入时间</th>
                <th className="whitespace-nowrap px-4 py-3">平台</th>
                <th className="whitespace-nowrap px-4 py-3">门店</th>
                <th className="whitespace-nowrap px-4 py-3">结果</th>
                <th className="whitespace-nowrap px-4 py-3">操作人</th>
                <th className="whitespace-nowrap px-4 py-3">状态</th>
                <th className="sticky right-0 z-10 whitespace-nowrap bg-[#F8FAFC] px-4 py-3 shadow-[-8px_0_16px_rgba(15,23,42,0.04)]">操作</th>
              </tr>
            </thead>
            <tbody>
              {THIRD_PARTY_IMPORT_RECORDS.map(record => (
                <tr key={record.id} className="border-t border-[#EEF2F6]">
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="font-bold text-[#1F2937]">{record.importTime}</div>
                    <div className="mt-1 text-xs text-[#98A2B3]">{record.id}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#344054]">{record.platform}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="font-bold text-[#344054]">{record.storeName}</div>
                    <div className="mt-1 text-xs text-[#98A2B3]">门店ID：{record.storeNo}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#344054]">
                    <div>成功 {record.success} / 失败 {record.failed} / 跳过 {record.skipped}</div>
                    <div className="mt-1 text-xs text-[#98A2B3]">共 {record.total} 个商品</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[#344054]">{record.operator}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <RecordStatusBadge status={record.status} />
                  </td>
                  <td className="sticky right-0 whitespace-nowrap bg-white px-4 py-4 shadow-[-8px_0_16px_rgba(15,23,42,0.04)]">
                    <button type="button" disabled title="导入明细接口尚未接入当前原型" className="cursor-not-allowed text-xs font-bold text-[#98A2B3]">明细待接入</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
};

export const WebImportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [importSource, setImportSource] = useState<ImportSource>('local');
  const [step, setStep] = useState<ImportStep>('source');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('meituan');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeKeyword, setStoreKeyword] = useState('');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authorizedStoreIds, setAuthorizedStoreIds] = useState<string[]>(getInitialAuthorizedIds);
  const [bindingModalOpen, setBindingModalOpen] = useState(false);
  const [bindingType, setBindingType] = useState<BindingType>('takeout_service');
  const [authRedirectOpen, setAuthRedirectOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => getDefaultSelectedIds('meituan'));
  const [removedProductIds, setRemovedProductIds] = useState<string[]>([]);
  const [productOverrides, setProductOverrides] = useState<Record<string, Partial<AuthProduct>>>({});
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ProductEditDraft>({});

  const currentStores = AUTH_STORES[selectedPlatform];
  const selectedStore = currentStores.find(item => item.id === selectedStoreId) || null;
  const selectedStoreAuthorized = !!selectedStore && authorizedStoreIds.includes(selectedStore.id);
  const reviewProducts = useMemo(
    () => AUTH_PRODUCTS[selectedPlatform]
      .filter(item => !removedProductIds.includes(item.id))
      .map(item => ({ ...item, ...productOverrides[item.id] })),
    [selectedPlatform, removedProductIds, productOverrides],
  );
  const sameNameCount = reviewProducts.filter(item => item.sameName).length;
  const requiredIssueCount = reviewProducts.filter(item => !canImportProduct(item)).length;

  const visibleStores = useMemo(() => {
    const keyword = storeKeyword.trim().toLowerCase();
    if (!keyword) return currentStores;
    return currentStores.filter(item => `${item.name} ${item.brand}`.toLowerCase().includes(keyword));
  }, [currentStores, storeKeyword]);

  const selectedAuthProducts = reviewProducts.filter(item => selectedProductIds.includes(item.id) && canImportProduct(item));
  const selectedPlatformName = AUTH_PLATFORMS.find(item => item.id === selectedPlatform)?.name || '';

  const handleLocalConfirm = () => {
    setStep('analyzing');
    setTimeout(() => setStep('review'), 1800);
  };

  const handleFinalConfirm = () => {
    alert('导入成功！商品已加入商品库。');
    onClose();
  };

  const uploadConfig = importSource === 'external_file'
    ? {
        title: '三方平台文件导入',
        prepTitle: '支持文件来源',
        prepTags: ['美团POS', '客如云'],
        prepDesc: '上传外部系统导出的商品文件后开始校验',
        uploadTitle: '上传平台导出文件',
        uploadDesc: '支持上传美团POS、客如云导出的商品文件',
      }
    : {
        title: '本地标准导入',
        prepTitle: '导入前准备',
        prepTags: [] as string[],
        prepDesc: '准备好文件后上传即可',
        uploadTitle: '上传导入文件',
        uploadDesc: '点击上传并开始校验',
      };

  const goBack = () => {
    if (step === 'file_upload' || step === 'auth_setup') return setStep('source');
    if (step === 'review') return setStep('file_upload');
    if (step === 'auth_pulling') return setStep('auth_setup');
    if (step === 'auth_review') return setStep('auth_setup');
    if (step === 'auth_done') return setStep('auth_review');
  };

  const startSourceFlow = () => {
    setStep(importSource === 'takeout_auth' ? 'auth_setup' : 'file_upload');
  };

  const handlePlatformChange = (platform: PlatformId) => {
    setSelectedPlatform(platform);
    setSelectedStoreId('');
    setStoreKeyword('');
    setAuthStatus('idle');
    setBindingType(platform === 'meituan' ? 'takeout_service' : 'service');
    setSelectedProductIds(getDefaultSelectedIds(platform));
    setRemovedProductIds([]);
    setEditingProductId(null);
    setEditDraft({});
  };

  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    setAuthStatus(authorizedStoreIds.includes(storeId) ? 'authorized' : 'idle');
  };

  const startBinding = () => {
    if (!selectedStore) return;
    setBindingModalOpen(true);
    setBindingType(selectedPlatform === 'meituan' ? 'takeout_service' : 'service');
  };

  const submitBinding = () => {
    if (!selectedStore) return;
    setBindingModalOpen(false);
    setAuthRedirectOpen(true);
    setAuthStatus('binding');
  };

  const finishPlatformAuthorization = () => {
    if (!selectedStore) return;
    setAuthorizedStoreIds(prev => (prev.includes(selectedStore.id) ? prev : [...prev, selectedStore.id]));
    setAuthRedirectOpen(false);
    setAuthStatus('authorized');
  };

  const pullProducts = () => {
    if (!selectedStoreAuthorized && authStatus !== 'authorized') return;
    setStep('auth_pulling');
    setAuthStatus('pulled');
    window.setTimeout(() => setStep('auth_review'), 1800);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => (prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]));
  };

  const startEditProduct = (product: AuthProduct) => {
    setEditingProductId(product.id);
    setEditDraft({
      name: product.name,
      productType: product.productType,
      category: product.category,
      price: product.price,
      specSummary: product.specSummary,
      hasMultipleSpecs: product.hasMultipleSpecs,
      specs: product.specs?.map(spec => ({ ...spec })),
      methods: product.methods,
      addons: product.addons,
    });
  };

  const updateProductSpecPrice = (product: AuthProduct, specId: string, value: string) => {
    const specs = (product.specs || []).map(spec =>
      spec.id === specId
        ? { ...spec, price: value === '' || Number.isNaN(Number(value)) ? undefined : Number(value) }
        : spec
    );
    const nextProduct = { ...product, specs };
    setProductOverrides(prev => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        specs,
        importable: canImportProduct(nextProduct),
      },
    }));
  };

  const saveEditProduct = () => {
    if (!editingProductId) return;
    const normalizedDraft = {
      ...editDraft,
      price: editDraft.price === undefined || editDraft.price === null || editDraft.price === '' || Number.isNaN(Number(editDraft.price)) ? undefined : Number(editDraft.price),
    };
    setProductOverrides(prev => ({
      ...prev,
      [editingProductId]: {
        ...prev[editingProductId],
        ...normalizedDraft,
        importable: !!normalizedDraft.name && !!normalizedDraft.category && hasValidProductPrice(normalizedDraft),
      },
    }));
    setEditingProductId(null);
    setEditDraft({});
  };

  const removeProduct = (productId: string) => {
    setRemovedProductIds(prev => (prev.includes(productId) ? prev : [...prev, productId]));
    setSelectedProductIds(prev => prev.filter(id => id !== productId));
  };

  if (step === 'analyzing') {
    return (
      <ModalShell widthClass="w-[380px]">
        <div className="flex min-h-[260px] flex-col items-center justify-center px-8 text-center">
          <Loader2 size={40} className="animate-spin text-[#00C06B]" />
          <div className="mt-5 text-lg font-bold text-[#1F2937]">正在校验文件</div>
          <div className="mt-2 text-sm text-[#667085]">请稍候</div>
        </div>
      </ModalShell>
    );
  }

  if (step === 'review') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
        <div className="h-[700px] w-[1000px] overflow-hidden rounded-[20px] bg-white shadow-2xl">
          <WebImportReviewModal onBack={goBack} onConfirm={handleFinalConfirm} onClose={onClose} />
        </div>
      </div>
    );
  }

  if (step === 'auth_pulling') {
    return (
      <ModalShell widthClass="w-[760px]">
        <ModalHeader title="三方外卖授权导入" onClose={onClose} onBack={goBack} />
        <div className="space-y-8 px-10 py-10">
          <StepBar current={2} items={['选择门店并授权', '拉取商品', '确认导入']} />
          <div className="rounded-[24px] border border-[#E6ECF2] bg-[#FAFBFC] px-10 py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF8F1] text-[#00A35B]">
              <Loader2 size={34} className="animate-spin" />
            </div>
              <div className="mt-6 text-[18px] font-semibold text-[#1F2937]">正在拉取并校验商品资料</div>
            <div className="mt-2 text-sm text-[#667085]">
              {selectedPlatformName} · {selectedStore?.name || '已选门店'}，完成后将自动进入商品确认页
            </div>
            <div className="mx-auto mt-8 w-full max-w-[520px] overflow-hidden rounded-full bg-[#E8EEF5]">
              <div className="h-2 w-[78%] rounded-full bg-[#00C06B]" />
            </div>
            <div className="mx-auto mt-6 grid max-w-[520px] grid-cols-3 gap-3 text-left">
              <ProgressItem done title="读取商品" desc="商品、分类、图片" />
              <ProgressItem done title="整理资料" desc="规格、做法、加料" />
              <ProgressItem title="生成确认页" desc="异常、重复、新增项" />
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  if (step === 'auth_done') {
    return (
      <ModalShell widthClass="w-[760px]">
        <ModalHeader title="三方外卖授权导入" onClose={onClose} onBack={goBack} />
        <div className="px-8 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF8F1] text-[#00A35B]">
            <CheckCircle2 size={30} />
          </div>
          <div className="mt-5 text-2xl font-bold text-[#1F2937]">导入完成</div>
          <div className="mt-2 text-sm text-[#667085]">已导入 {selectedAuthProducts.length} 个商品到品牌商品库</div>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button onClick={onClose} className="rounded-xl border border-[#D8E0E8] px-5 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F8FAFC]">
              关闭
            </button>
            <button onClick={() => setStep('auth_setup')} className="rounded-xl bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">
              再次授权导入
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell widthClass={step === 'source' ? 'w-[calc(100vw-48px)] max-w-[1080px]' : step === 'auth_setup' ? 'w-[calc(100vw-48px)] max-w-[1120px]' : step === 'auth_review' ? 'w-[calc(100vw-48px)] max-w-[1180px]' : 'w-[920px]'}>
      <ModalHeader
        title={
          step === 'source'
            ? '批量导入商品'
            : importSource === 'takeout_auth'
              ? '三方外卖授权导入'
              : uploadConfig.title
        }
        onClose={onClose}
        onBack={step === 'source' ? undefined : goBack}
      />

      {step === 'source' && (
        <div className="space-y-6 px-8 py-8">
          <div className="grid grid-cols-3 gap-4">
            {IMPORT_SOURCES.map(source => {
              const active = importSource === source.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setImportSource(source.id)}
                  className={`group min-h-[156px] cursor-pointer rounded-[20px] border p-5 text-left transition-all ${active ? 'border-[#00C06B] bg-[#F0FFF7] shadow-[0_14px_30px_rgba(0,192,107,0.10)]' : 'border-[#E3E8EF] bg-white hover:border-[#BFD2E2] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]'}`}
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-[14px] transition-colors ${active ? 'bg-[#00C06B] text-white' : 'bg-[#F2F4F7] text-[#667085] group-hover:bg-[#EEF7F3] group-hover:text-[#00A35B]'}`}>
                    {source.icon}
                  </div>
                  <div className="mt-5 text-[20px] font-black leading-none text-[#1F2937]">{source.name}</div>
                  <div className="mt-3 text-[15px] leading-6 text-[#667085]">{source.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[20px] border border-[#E3E8EF] bg-[#FAFBFC] p-6">
            {importSource === 'takeout_auth' ? (
              <div className="space-y-5">
                <div className="text-[18px] font-black text-[#344054]">支持范围</div>
                <div className="flex gap-3">
                  <TagPill text="美团外卖" />
                  <TagPill text="淘宝闪购" />
                </div>
                <div className="text-[15px] leading-6 text-[#667085]">先选择平台门店，已授权门店可直接拉取，未授权门店先完成绑定授权。</div>
              </div>
            ) : importSource === 'local' ? (
              <div className="space-y-4">
                <div className="text-[18px] font-black text-[#344054]">导入前准备</div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => downloadProductTemplate('standard')} className="rounded-xl border border-[#D8E0E8] bg-white px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F8FAFC]">
                    <FileSpreadsheet size={14} className="mr-1.5 inline" />
                    下载标准商品模板
                  </button>
                  <button type="button" onClick={() => downloadProductTemplate('combo')} className="rounded-xl border border-[#D8E0E8] bg-white px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F8FAFC]">
                    <FileText size={14} className="mr-1.5 inline" />
                    下载套餐商品模板
                  </button>
                </div>
                <div className="text-[15px] text-[#667085]">准备好文件后上传即可</div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-[18px] font-black text-[#344054]">支持文件来源</div>
                <div className="flex gap-3">
                  <TagPill text="美团POS" />
                  <TagPill text="客如云" />
                </div>
                <div className="text-[15px] leading-6 text-[#667085]">上传外部系统导出的商品文件后开始校验，适用于暂不支持授权拉取的迁移场景。</div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={startSourceFlow} className="rounded-[14px] bg-[#00C06B] px-6 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(0,192,107,0.18)] hover:bg-[#00A35B]">
              继续
            </button>
          </div>
        </div>
      )}

      {step === 'file_upload' && (
        <div className="space-y-5 px-8 py-8">
          <div className="rounded-2xl border border-[#E6ECF2] bg-[#FAFBFC] p-5">
            <div className="text-sm font-bold text-[#344054]">{uploadConfig.prepTitle}</div>
            {importSource === 'local' ? (
              <div className="mt-3 flex gap-3">
                <button type="button" onClick={() => downloadProductTemplate('standard')} className="rounded-xl border border-[#D8E0E8] bg-white px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F8FAFC]">
                  <FileSpreadsheet size={14} className="mr-1.5 inline" />
                  下载标准商品模板
                </button>
                <button type="button" onClick={() => downloadProductTemplate('combo')} className="rounded-xl border border-[#D8E0E8] bg-white px-4 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F8FAFC]">
                  <FileText size={14} className="mr-1.5 inline" />
                  下载套餐商品模板
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                {uploadConfig.prepTags.map(tag => <TagPill key={tag} text={tag} />)}
              </div>
            )}
            <div className="mt-3 text-sm text-[#667085]">{uploadConfig.prepDesc}</div>
          </div>

          <button
            type="button"
            onClick={handleLocalConfirm}
            className="flex min-h-[280px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D5E2] bg-[#FAFBFC] text-center transition-colors hover:border-[#00C06B] hover:bg-[#F3FFF8]"
          >
            <FileUp size={36} className="text-[#98A2B3]" />
            <div className="mt-4 text-lg font-bold text-[#1F2937]">{uploadConfig.uploadTitle}</div>
            <div className="mt-1 text-sm text-[#667085]">{uploadConfig.uploadDesc}</div>
          </button>
        </div>
      )}

      {step === 'auth_setup' && (
        <div className="space-y-5 px-8 py-8">
          <StepBar current={1} items={['选择门店并授权', '拉取商品', '确认导入']} />

          <div className="grid grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="space-y-4 rounded-[22px] border border-[#E6ECF2] bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
              <div className="grid grid-cols-2 gap-4">
                {AUTH_PLATFORMS.map(platform => {
                  const active = platform.id === selectedPlatform;
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => handlePlatformChange(platform.id)}
                      className={`cursor-pointer rounded-2xl border p-4 text-left transition-colors ${active ? 'border-[#00C06B] bg-[#F3FFF8]' : 'border-[#E6ECF2] hover:border-[#BFD2E2]'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${platform.color}`}>
                          {platform.id === 'meituan' ? '美' : '淘'}
                        </span>
                        <div className="text-sm font-bold text-[#1F2937]">{platform.name}</div>
                      </div>
                      <div className="mt-1 text-xs text-[#667085]">{platform.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-[#344054]">选择门店</div>
                <div className="relative w-[260px]">
                  <Search size={15} className="absolute left-3 top-2.5 text-[#98A2B3]" />
                  <input
                    value={storeKeyword}
                    onChange={event => setStoreKeyword(event.target.value)}
                    className="h-9 w-full rounded-lg border border-[#D8E0E8] pl-8 pr-3 text-sm outline-none focus:border-[#00C06B]"
                    placeholder="搜索门店"
                  />
                </div>
              </div>
              <div className="max-h-[300px] space-y-2 overflow-auto">
                {visibleStores.map(store => {
                  const active = selectedStoreId === store.id;
                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => handleStoreSelect(store.id)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${active ? 'border-[#00C06B] bg-[#F3FFF8]' : 'border-[#E6ECF2] hover:border-[#BFD2E2]'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-[#1F2937]">{store.name}</div>
                          {store.lastImportAt && <span className="text-xs text-[#98A2B3]">上次导入 {store.lastImportAt}</span>}
                        </div>
                        <div className="mt-1 text-xs text-[#667085]">{store.brand} · 门店ID：{store.storeNo}</div>
                      </div>
                      <TagPill text={authorizedStoreIds.includes(store.id) ? '已授权' : '未授权'} active={authorizedStoreIds.includes(store.id)} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5 rounded-[22px] border border-[#E6ECF2] bg-[#FAFBFC] p-6 shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
              <div>
                <div className="text-sm font-bold text-[#344054]">本次导入</div>
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
                  <InfoField label="渠道" value={AUTH_PLATFORMS.find(item => item.id === selectedPlatform)?.name || ''} />
                  <InfoField label="门店" value={selectedStore?.name || '未选择'} />
                  <InfoField label="门店ID" value={selectedStore?.storeNo || '-'} />
                  <InfoField label="商品去向" value="品牌商品库" />
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#344054]">当前状态</div>
                <div className="mt-3 flex gap-2">
                  <TagPill text={selectedStoreAuthorized || authStatus === 'authorized' || authStatus === 'pulled' ? '已授权' : '未授权'} active={selectedStoreAuthorized || authStatus === 'authorized' || authStatus === 'pulled'} />
                  <TagPill text={authStatus === 'pulled' ? '已拉取' : '未拉取'} active={authStatus === 'pulled'} />
                </div>
              </div>
              {selectedStore && !selectedStoreAuthorized && authStatus === 'idle' && (
                <div className="rounded-xl border border-[#FDE3A7] bg-[#FFFBEB] p-3 text-xs leading-5 text-[#92400E]">
                  该门店尚未完成授权，需要先选择绑定模式并跳转至{selectedPlatformName}完成授权。
                </div>
              )}
              <div className="space-y-3">
                <button
                  onClick={startBinding}
                  disabled={!selectedStoreId || selectedStoreAuthorized}
                  className="w-full rounded-xl border border-[#00C06B] px-4 py-2.5 text-sm font-bold text-[#00A35B] hover:bg-[#F3FFF8] disabled:cursor-not-allowed disabled:border-[#D8E0E8] disabled:text-[#98A2B3]"
                >
                  {selectedStoreAuthorized ? '门店已授权' : '立即绑定'}
                </button>
                <button
                  onClick={pullProducts}
                  disabled={!selectedStoreId || (!selectedStoreAuthorized && authStatus !== 'authorized')}
                  className="w-full rounded-xl bg-[#00C06B] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(0,192,107,0.18)] hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:bg-[#B7DCC9] disabled:shadow-none"
                >
                  拉取商品
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'auth_review' && (
        <div className="space-y-5 px-8 py-8">
          <StepBar current={3} items={['选择门店并授权', '拉取商品', '确认导入']} />

          <div className="grid grid-cols-3 gap-4">
            <SummaryCard label="待导入商品" value={String(reviewProducts.length)} />
            <SummaryCard label="同名提示" value={String(sameNameCount)} />
            <SummaryCard label="必填异常" value={String(requiredIssueCount)} />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E6ECF2] bg-white">
            <table className="min-w-[1220px] w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] text-[#667085]">
                <tr>
                  <th className="w-[56px] px-4 py-3">导入</th>
                  <th className="min-w-[180px] px-4 py-3">商品名称</th>
                  <th className="w-[110px] px-4 py-3">商品类型</th>
                  <th className="px-4 py-3">分类</th>
                  <th className="px-4 py-3">售价</th>
                  <th className="min-w-[220px] px-4 py-3">规格</th>
                  <th className="px-4 py-3">做法</th>
                  <th className="px-4 py-3">加料</th>
                  <th className="sticky right-0 z-10 w-[110px] bg-[#F8FAFC] px-4 py-3 shadow-[-8px_0_16px_rgba(15,23,42,0.04)]">操作</th>
                </tr>
              </thead>
              <tbody>
                {reviewProducts.map(product => {
                  const missingName = !product.name;
                  const missingCategory = !product.category;
                  const missingPrice = !hasValidProductPrice(product);
                  return (
                    <tr key={product.id} className="border-t border-[#EEF2F6]">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          disabled={!canImportProduct(product)}
                          onChange={() => toggleProduct(product.id)}
                          className="h-4 w-4 rounded border-[#CBD5E1] text-[#00C06B] focus:ring-[#00C06B]"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <RequiredCell invalid={missingName} value={product.name || '未识别商品名称'} />
                        {product.sameName && <div className="mt-1 text-xs leading-5 text-[#2563EB]">{product.sameName}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${product.productType === 'combo' ? 'bg-[#FFF4E5] text-[#B45309]' : 'bg-[#EAF8F1] text-[#00A35B]'}`}>
                          {getProductTypeText(product.productType)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <RequiredCell invalid={missingCategory} value={product.category || '缺少分类'} />
                      </td>
                      <td className="px-4 py-4">
                        <RequiredCell invalid={missingPrice} value={getProductPriceText(product) || '缺少售价'} />
                      </td>
                      <td className="px-4 py-4 text-[#344054]">
                        {product.hasMultipleSpecs && product.specs?.length ? (
                          <div className="space-y-2">
                            {product.specs.map(spec => (
                              <div key={spec.id} className="flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-2 py-1.5">
                                <span className="min-w-[52px] text-xs font-bold text-[#344054]">{spec.name}</span>
                                <input
                                  value={spec.price ?? ''}
                                  onChange={event => updateProductSpecPrice(product, spec.id, event.target.value.replace(/[^\d.]/g, ''))}
                                  placeholder="价格"
                                  className={`w-20 rounded-md border px-2 py-1 text-right text-xs font-bold outline-none focus:border-[#00C06B] ${typeof spec.price === 'number' ? 'border-[#D8E0E8] text-[#344054]' : 'border-[#FDA29B] text-[#E11D48]'}`}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          product.specSummary
                        )}
                      </td>
                      <td className="px-4 py-4 text-[#667085]">{product.methods || '-'}</td>
                      <td className="px-4 py-4 text-[#667085]">{product.addons || '-'}</td>
                      <td className="sticky right-0 bg-white px-4 py-4 shadow-[-8px_0_16px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center gap-3">
                          <button onClick={() => startEditProduct(product)} className="text-xs font-bold text-[#00A35B] hover:text-[#008C5A]">编辑</button>
                          <button onClick={() => removeProduct(product.id)} className="text-xs font-bold text-[#E11D48] hover:text-[#BE123C]">移除</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-[#667085]">已选 {selectedAuthProducts.length} 个商品</div>
            <button
              onClick={() => setStep('auth_done')}
              disabled={selectedAuthProducts.length === 0}
              className="rounded-xl bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:bg-[#B7DCC9]"
            >
              确认导入
            </button>
          </div>
        </div>
      )}

      {bindingModalOpen && selectedStore && (
        <BindingModeModal
          platform={selectedPlatform}
          platformName={selectedPlatformName}
          store={selectedStore}
          bindingType={bindingType}
          onBindingTypeChange={setBindingType}
          onCancel={() => setBindingModalOpen(false)}
          onSubmit={submitBinding}
        />
      )}

      {authRedirectOpen && selectedStore && (
        <PlatformAuthorizationModal
          platform={selectedPlatform}
          platformName={selectedPlatformName}
          store={selectedStore}
          bindingLabel={BINDING_TYPES[selectedPlatform].find(item => item.id === bindingType)?.label || ''}
          onCancel={() => {
            setAuthRedirectOpen(false);
            setAuthStatus('idle');
          }}
          onFinish={finishPlatformAuthorization}
        />
      )}

      {editingProductId && (
        <ProductEditModal
          draft={editDraft}
          onChange={setEditDraft}
          onCancel={() => {
            setEditingProductId(null);
            setEditDraft({});
          }}
          onSave={saveEditProduct}
        />
      )}
    </ModalShell>
  );
};

const BindingModeModal: React.FC<{
  platform: PlatformId;
  platformName: string;
  store: AuthStore;
  bindingType: BindingType;
  onBindingTypeChange: (value: BindingType) => void;
  onCancel: () => void;
  onSubmit: () => void;
}> = ({ platform, platformName, store, bindingType, onBindingTypeChange, onCancel, onSubmit }) => {
  const options = BINDING_TYPES[platform];
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45">
      <div className="w-[900px] overflow-hidden rounded-[12px] bg-white shadow-2xl">
        <div className="flex items-center justify-between px-8 py-7">
              <div className="text-[18px] font-semibold text-[#1F2937]">
            {platform === 'meituan' ? '选择绑定模式' : '外卖门店绑定'}
          </div>
          <button onClick={onCancel} className="rounded-lg p-2 text-[#8B95A1] hover:bg-[#F4F5F7]">
            <X size={24} />
          </button>
        </div>

        <div className="px-8">
              <div className="rounded-lg bg-[#F7F8FB] px-6 py-6 text-[16px] text-[#9AA1AD]">
            门店ID：<span className="ml-2 text-[#313844]">{store.storeNo}</span>
          </div>

                <div className="mt-6 flex items-center gap-2 text-[16px] text-[#59616E]">
            <span className="text-[#F04438]">*</span>
            <span>授权绑定类型</span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#98A2B3] text-[13px] text-[#667085]">?</span>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-12 gap-y-5">
            {options.map(option => (
              <label key={option.id} className="group flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  className="mt-1 h-5 w-5 border-[#C8D0DA] text-[#00C06B] focus:ring-[#00C06B]"
                  checked={bindingType === option.id}
                  onChange={() => onBindingTypeChange(option.id)}
                />
                <span>
                        <span className="block text-[16px] leading-6 text-[#59616E] group-hover:text-[#00A35B]">{option.label}</span>
                  <span className="mt-1 block max-w-[230px] text-xs leading-5 text-[#98A2B3]">{option.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-16 flex justify-end gap-4 px-8 pb-8">
          <button onClick={onCancel} className="h-[50px] rounded-md border border-[#D8DCE3] px-7 text-[20px] text-[#687080] hover:bg-[#F8FAFC]">
            取 消
          </button>
          <button onClick={onSubmit} className="h-[50px] rounded-md bg-[#00B96B] px-7 text-[20px] font-medium text-white hover:bg-[#00A35B]">
            立即绑定
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductEditModal: React.FC<{
  draft: ProductEditDraft;
  onChange: React.Dispatch<React.SetStateAction<ProductEditDraft>>;
  onCancel: () => void;
  onSave: () => void;
}> = ({ draft, onChange, onCancel, onSave }) => (
  <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45">
    <div className="w-[640px] overflow-hidden rounded-[18px] bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#EEF2F6] px-6 py-5">
        <div className="text-xl font-black text-[#1F2937]">编辑待导入商品</div>
        <button onClick={onCancel} className="rounded-lg p-2 text-[#667085] hover:bg-[#F4F5F7]">
          <X size={20} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 px-6 py-6">
        <EditField
          required
          label="商品名称"
          value={draft.name || ''}
          onChange={value => onChange(prev => ({ ...prev, name: value }))}
        />
        <EditField
          required
          label="分类"
          value={draft.category || ''}
          onChange={value => onChange(prev => ({ ...prev, category: value }))}
        />
        <EditField
          required
          label="售价"
          value={draft.price ?? ''}
          onChange={value => onChange(prev => ({ ...prev, price: value }))}
        />
        <EditField
          label="规格"
          value={draft.specSummary || ''}
          onChange={value => onChange(prev => ({ ...prev, specSummary: value }))}
        />
        <EditField
          label="做法"
          value={draft.methods || ''}
          onChange={value => onChange(prev => ({ ...prev, methods: value }))}
        />
        <EditField
          label="加料"
          value={draft.addons || ''}
          onChange={value => onChange(prev => ({ ...prev, addons: value }))}
        />
      </div>
      <div className="flex justify-end gap-3 border-t border-[#EEF2F6] px-6 py-5">
        <button onClick={onCancel} className="rounded-xl border border-[#D8E0E8] px-5 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F8FAFC]">
          取消
        </button>
        <button onClick={onSave} className="rounded-xl bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">
          保存
        </button>
      </div>
    </div>
  </div>
);

const PlatformAuthorizationModal: React.FC<{
  platform: PlatformId;
  platformName: string;
  store: AuthStore;
  bindingLabel: string;
  onCancel: () => void;
  onFinish: () => void;
}> = ({ platform, platformName, store, bindingLabel, onCancel, onFinish }) => (
  <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#111827]/70">
    <div className="w-[720px] overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className={`px-8 py-6 ${platform === 'meituan' ? 'bg-[#FFE477]' : 'bg-[#FFF0E6]'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#667085]">正在跳转至平台授权页面</div>
            <div className="mt-2 text-2xl font-black text-[#1F2937]">{platformName}授权</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-lg font-black text-[#1F2937]">
            {platform === 'meituan' ? '美' : '淘'}
          </div>
        </div>
      </div>
      <div className="space-y-5 px-8 py-8">
        <div className="rounded-xl border border-[#E6ECF2] bg-[#FAFBFC] p-5">
          <div className="flex items-center gap-3">
            <Store size={22} className="text-[#00A35B]" />
            <div>
              <div className="text-base font-bold text-[#1F2937]">{store.name}</div>
              <div className="mt-1 text-sm text-[#667085]">门店ID：{store.storeNo} · 授权类型：{bindingLabel}</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#E6ECF2] p-5">
          <div className="text-sm font-bold text-[#344054]">授权后商品中心可读取</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-[#667085]">
            <div>商品资料、分类</div>
            <div>规格、SKU</div>
            <div>做法、加料</div>
            <div>商品图片</div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-xl border border-[#D8E0E8] px-5 py-2.5 text-sm font-bold text-[#344054] hover:bg-[#F8FAFC]">
            取消授权
          </button>
          <button onClick={onFinish} className="rounded-xl bg-[#00C06B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">
            同意授权并返回
          </button>
        </div>
      </div>
    </div>
  </div>
);

const ModalShell: React.FC<{ widthClass: string; children: React.ReactNode }> = ({ widthClass, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
    <div className={`${widthClass} max-h-[calc(100vh-48px)] overflow-hidden rounded-[28px] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]`}>{children}</div>
  </div>
);

const ModalHeader: React.FC<{ title: string; onClose: () => void; onBack?: () => void }> = ({ title, onClose, onBack }) => (
  <div className="flex items-center justify-between border-b border-[#EEF2F6] px-8 py-6">
    <div className="flex items-center gap-3">
      {onBack && (
        <button onClick={onBack} className="rounded-lg p-2 text-[#667085] hover:bg-[#F4F5F7] hover:text-[#344054]">
          <ArrowLeft size={18} />
        </button>
      )}
          <div className="text-[18px] font-semibold leading-none text-[#1F2937]">{title}</div>
    </div>
    <button onClick={onClose} className="rounded-lg p-2 text-[#667085] hover:bg-[#F4F5F7] hover:text-[#344054]">
      <X size={22} />
    </button>
  </div>
);

const StepBar: React.FC<{ current: number; items: string[] }> = ({ current, items }) => (
  <div className="flex items-center gap-3">
    {items.map((item, index) => {
      const active = current === index + 1;
      const done = current > index + 1;
      return (
        <React.Fragment key={item}>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${active || done ? 'bg-[#F3FFF8] text-[#00A35B]' : 'bg-[#F4F5F7] text-[#667085]'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${active || done ? 'bg-[#00C06B] text-white' : 'bg-white text-[#98A2B3]'}`}>{done ? '✓' : index + 1}</span>
            {item}
          </div>
          {index < items.length - 1 && <ChevronRight size={14} className="text-[#98A2B3]" />}
        </React.Fragment>
      );
    })}
  </div>
);

const TagPill: React.FC<{ text: string; active?: boolean }> = ({ text, active }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'bg-[#EAF8F1] text-[#00A35B]' : 'bg-[#F4F5F7] text-[#667085]'}`}>{text}</span>
);

const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-xs font-bold text-[#98A2B3]">{label}</div>
    <div className="mt-1 text-sm font-medium text-[#1F2937]">{value}</div>
  </div>
);

const SummaryCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4">
    <div className="text-xs font-bold text-[#98A2B3]">{label}</div>
          <div className="mt-2 text-[18px] font-semibold text-[#1F2937]">{value}</div>
  </div>
);

const RecordStatusBadge: React.FC<{ status: ThirdPartyImportRecord['status'] }> = ({ status }) => {
  const config = status === 'success'
    ? { text: '成功', className: 'bg-[#EAF8F1] text-[#00A35B]' }
    : status === 'partial'
      ? { text: '部分成功', className: 'bg-[#FFF7E8] text-[#D97706]' }
      : { text: '失败', className: 'bg-[#FFF1F2] text-[#E11D48]' };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${config.className}`}>{config.text}</span>;
};

const RequiredCell: React.FC<{ invalid: boolean; value: string }> = ({ invalid, value }) => (
  <div>
    <div className={`font-bold ${invalid ? 'text-[#E11D48]' : 'text-[#344054]'}`}>{value}</div>
    {invalid && <div className="mt-1 text-xs font-bold text-[#E11D48]">必填</div>}
  </div>
);

const EditField: React.FC<{ label: string; value: string | number; onChange: (value: string) => void; required?: boolean }> = ({ label, value, onChange, required }) => (
  <label className="block">
    <div className="mb-2 text-sm font-bold text-[#344054]">{required && <span className="mr-1 text-[#E11D48]">*</span>}{label}</div>
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      className="h-10 w-full rounded-xl border border-[#D8E0E8] px-3 text-sm text-[#1F2937] outline-none focus:border-[#00C06B]"
    />
  </label>
);

const ProgressItem: React.FC<{ title: string; desc: string; done?: boolean }> = ({ title, desc, done }) => (
  <div className={`rounded-2xl border p-4 ${done ? 'border-[#CDEFE0] bg-white' : 'border-[#E6ECF2] bg-white/70'}`}>
    <div className="flex items-center gap-2">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${done ? 'bg-[#00C06B] text-white' : 'bg-[#E8EEF5] text-[#98A2B3]'}`}>
        {done ? '✓' : '…'}
      </span>
      <span className="text-sm font-bold text-[#1F2937]">{title}</span>
    </div>
    <div className="mt-2 text-xs text-[#667085]">{desc}</div>
  </div>
);

const InlineHint: React.FC<{ tone: 'blue' | 'orange' | 'red'; text: string }> = ({ tone, text }) => {
  const className = tone === 'blue'
    ? 'bg-[#EEF5FF] text-[#2563EB]'
    : tone === 'orange'
      ? 'bg-[#FFF7E8] text-[#D97706]'
      : 'bg-[#FFF1F2] text-[#E11D48]';

  return <div className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${className}`}>{text}</div>;
};

export const WebCategorySelectModal = ({ 
    type, 
    onClose, 
    onSelect,
    categories 
}: { 
    type: 'standard' | 'combo', 
    onClose: () => void, 
    onSelect: (category: Category) => void,
    categories: Category[] 
}) => {
    const getCategoryIcon = (name: string) => {
        if (name.includes('饮品') || name.includes('咖啡') || name.includes('茶')) return <CupSoda size={28} strokeWidth={1.5} />;
        if (name.includes('火锅')) return <Flame size={28} strokeWidth={1.5} />;
        if (name.includes('烘焙') || name.includes('蛋糕')) return <CakeSlice size={28} strokeWidth={1.5} />;
        if (name.includes('零售')) return <ShoppingBag size={28} strokeWidth={1.5} />;
        if (name.includes('称重')) return <Scale size={28} strokeWidth={1.5} />;
        if (name.includes('自助餐')) return <Ticket size={28} strokeWidth={1.5} />;
        return <Utensils size={28} strokeWidth={1.5} />;
    };

    const getCategoryDesc = (name: string) => {
        if (name.includes('通用') && type === 'standard') return '热菜、凉菜、小吃';
        if (name.includes('饮品') && type === 'standard') return '奶茶、咖啡、果汁';
        if (name.includes('称重') && type === 'standard') return '海鲜、麻辣烫';
        if ((name.includes('烘焙') || name.includes('蛋糕')) && type === 'standard') return '面包、甜点、整糕';
        if (name.includes('零售') && type === 'standard') return '预包装零食、饮料';
        if (name.includes('自助餐') && type === 'standard') return '按份售卖、按人数核验';
        
        if (name.includes('通用') && type === 'combo') return '超值午餐、多人餐';
        if (name.includes('饮品') && type === 'combo') return '双杯优惠、下午茶';
        if ((name.includes('烘焙') || name.includes('蛋糕')) && type === 'combo') return '甜点搭配';
        if (name.includes('零售') && type === 'combo') return '礼盒、组合装';
        if (name.includes('火锅') && type === 'combo') return '鸳鸯锅、九宫格';
        
        return '暂无描述';
    };

    const visibleCategories = categories.filter(cat => {
        const classification = cat.classification;

        if (type === 'standard') {
            if (classification && classification !== 'standard') return false;
            if (cat.name.includes('套餐')) return false;
            if (cat.name.includes('称重')) return false;
            return true;
        }

        if (classification && classification !== 'combo') return false;
        if (!cat.name.includes('套餐') && !cat.name.includes('火锅')) return false;
        return true;
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="flex h-[min(700px,calc(100vh-32px))] w-[900px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-[#1F2129]">选择商品类目</h3>
                        <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-400 mr-2">当前正在创建:</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${type === 'standard' ? 'bg-green-50 text-[#00C06B]' : 'bg-orange-50 text-orange-500'}`}>
                                {type === 'standard' ? '标准商品' : '套餐商品'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-[#333] transition-colors"><X size={20}/></button>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-8 bg-[#F8FAFB] overflow-y-auto no-scrollbar">
                    <div className="flex items-start bg-[#00C06B]/5 border border-[#00C06B]/20 rounded-xl p-4 mb-6">
                        <Info size={16} className="text-[#00C06B] mt-0.5 mr-2 shrink-0"/>
                        <span className="text-sm text-[#00C06B] font-medium">点击一个类目后将直接进入商品创建表单，不同类目可管理不同的商品属性</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-1 lg:grid-cols-4">
                        {visibleCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => onSelect(cat)}
                                    className="group cursor-pointer flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all relative h-40 bg-white border-transparent hover:border-[#00C06B] hover:shadow-md hover:-translate-y-0.5 text-left"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors bg-gray-50 text-gray-400 ${type === 'standard' ? 'group-hover:bg-green-50 group-hover:text-[#00C06B]' : 'group-hover:bg-orange-50 group-hover:text-orange-500'}`}>
                                        {getCategoryIcon(cat.name)}
                                    </div>
                                    <span className="text-sm font-bold text-gray-600 transition-colors group-hover:text-[#1F2129]">{cat.name}</span>
                                    <span className="text-[10px] text-gray-400 mt-1 transition-colors group-hover:text-gray-500">{getCategoryDesc(cat.name)}</span>
                                </button>
                        ))}
                    </div>
                </div>
                <div className="px-8 py-4 border-t border-gray-100 bg-white flex justify-end shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all text-sm">取消</button>
                </div>
            </div>
        </div>
    );
}
