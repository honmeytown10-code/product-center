
import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CakeSlice,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CupSoda,
  Edit3,
  Flame,
  ImageIcon,
  Loader2,
  Mic,
  Scale,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { Category, Product } from '../../types';
import { MobileProductEditor } from './MobileProductEditor';
import { MobileComboProductCreator } from './MobileComboProductCreator';
import { MobileStandardProductCreator } from './MobileStandardProductCreator';
import { MobileQuickCreate, QuickCreateSavedDraft, QuickEntryScreen } from './MobileQuickCreate';
import { MobileBadgeItem, MobileLabelGroup, STORE_CREATION_CATEGORIES } from './productMeta';

type CreateStep =
  | 'type_select'
  | 'quick'
  | 'photo_intro'
  | 'voice_intro'
  | 'voice_recording'
  | 'ai_processing'
  | 'ai_confirm'
  | 'form'
  | 'success'
  | 'third_auth_setup'
  | 'third_auth_platform'
  | 'third_auth_pulling'
  | 'third_auth_confirm'
  | 'third_auth_success';
type CreateMode = 'manual' | 'scan' | 'voice';
type ScanSource = 'camera' | 'upload' | null;
type MobileThirdPlatform = 'meituan' | 'taobao';

type MobileThirdProduct = {
  id: string;
  name: string;
  productType: 'standard' | 'combo';
  category: string;
  price: string;
  multiSpec?: boolean;
  specs?: Array<{ id: string; name: string; price: string }>;
  methods: string[];
  addons: string[];
  sameName?: boolean;
};

type AiDraftItem = {
  id: string;
  name: string;
  basePrice: string;
  category: string;
  imageVariant: number;
  specs?: { id: string; name: string; price: string }[];
  confidence: 'high' | 'medium';
  warnings: string[];
};

type VoiceExample = {
  id: string;
  label: string;
  transcript: string;
  items: AiDraftItem[];
};

interface Props {
  onBack: () => void;
  categories: Category[];
  labelGroups: MobileLabelGroup[];
  badges: MobileBadgeItem[];
  onLabelGroupsChange: (groups: MobileLabelGroup[]) => void;
  onBadgesChange: (badges: MobileBadgeItem[]) => void;
}

const PHOTO_POSITIVE_TIPS = ['菜单平整', '正对拍摄', '清晰无遮挡'];
const PHOTO_NEGATIVE_TIPS = ['倾斜或颠倒', '被遮挡', '有反光', '有褶皱'];

const PHOTO_CAMERA_ITEMS: AiDraftItem[] = [
  { id: 'p1', name: '速溶咖啡', basePrice: '10', category: '现制饮品', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'p2', name: '五粮香', basePrice: '25', category: '零售商品', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'p3', name: '招牌奶茶', basePrice: '', category: '', imageVariant: 0, specs: [{ id: 'p3-s1', name: '中杯', price: '12' }, { id: 'p3-s2', name: '大杯', price: '15' }], confidence: 'high', warnings: [] },
  { id: 'p4', name: '江小白', basePrice: '20', category: '', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'p5', name: '红牛', basePrice: '10', category: '零售商品', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'p6', name: '雪碧', basePrice: '5', category: '零售商品', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'p7', name: '可乐', basePrice: '5', category: '零售商品', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'p8', name: '冰红茶', basePrice: '5', category: '', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'p9', name: '苏打水', basePrice: '6', category: '零售商品', imageVariant: 0, confidence: 'high', warnings: [] },
];

const PHOTO_UPLOAD_ITEMS: AiDraftItem[] = [
  { id: 'u1', name: '满杯水果茶', basePrice: '22', category: '现制饮品', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'u2', name: '冰红茶', basePrice: '5', category: '零售商品', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'u3', name: '牛肉饭', basePrice: '', category: '通用菜品', imageVariant: 0, specs: [{ id: 'u3-s1', name: '小份', price: '20' }, { id: 'u3-s2', name: '大份', price: '26' }], confidence: 'high', warnings: [] },
  { id: 'u4', name: '可乐', basePrice: '5', category: '零售商品', imageVariant: 0, confidence: 'high', warnings: [] },
  { id: 'u5', name: '奶茶', basePrice: '30', category: '', imageVariant: 0, confidence: 'medium', warnings: [] },
  { id: 'u6', name: '各种酒水', basePrice: '20', category: '', imageVariant: 0, confidence: 'medium', warnings: ['名称较泛，建议保存后再完善'] },
];

const VOICE_EXAMPLES: VoiceExample[] = [
  {
    id: 'v1',
    label: '单个商品',
    transcript: '生椰拿铁，18元',
    items: [{ id: 'v1-1', name: '生椰拿铁', basePrice: '18', category: '现制饮品', imageVariant: 0, confidence: 'high', warnings: [] }],
  },
  {
    id: 'v3',
    label: '小批量录入',
    transcript: '奶茶30元，草莓蛋糕26元，牛肉饭20元',
    items: [
      { id: 'v3-1', name: '奶茶', basePrice: '30', category: '现制饮品', imageVariant: 0, confidence: 'high', warnings: [] },
      { id: 'v3-2', name: '草莓蛋糕', basePrice: '26', category: '', imageVariant: 0, confidence: 'high', warnings: [] },
      { id: 'v3-3', name: '牛肉饭', basePrice: '20', category: '通用菜品', imageVariant: 0, confidence: 'high', warnings: [] },
    ],
  },
];

const MOBILE_THIRD_PLATFORM_META: Record<MobileThirdPlatform, {
  label: string;
  desc: string;
  mark: string;
  color: string;
  tint: string;
}> = {
  meituan: {
    label: '美团外卖',
    desc: '授权后拉取外卖门店商品资料',
    mark: '美',
    color: '#00A862',
    tint: '#EAF8EF',
  },
  taobao: {
    label: '淘宝闪购',
    desc: '授权后拉取闪购商品资料',
    mark: '淘',
    color: '#FF7A00',
    tint: '#FFF3E8',
  },
};

const MOBILE_THIRD_BINDING_TYPES: Record<MobileThirdPlatform, string[]> = {
  meituan: ['外卖接单-服务商', '外卖接单-品牌自研', '非接单-服务商'],
  taobao: ['服务商', '品牌自研'],
};

const MOBILE_THIRD_PRODUCTS: Record<MobileThirdPlatform, MobileThirdProduct[]> = {
  meituan: [
    {
      id: 'mt-1',
      name: '招牌珍珠奶茶',
      productType: 'standard',
      category: '招牌奶茶',
      price: '12',
      multiSpec: true,
      specs: [{ id: 'mt-1-s1', name: '中杯', price: '12' }, { id: 'mt-1-s2', name: '大杯', price: '15' }],
      methods: ['少冰', '正常冰', '多糖'],
      addons: ['珍珠 +2', '椰果 +2'],
      sameName: true,
    },
    {
      id: 'mt-2',
      name: '手打柠檬茶',
      productType: 'standard',
      category: '鲜果茶',
      price: '13',
      methods: ['少冰', '去冰'],
      addons: ['青柠片 +1'],
    },
    {
      id: 'mt-3',
      name: '盐酥鸡',
      productType: 'standard',
      category: '小吃',
      price: '',
      methods: ['微辣', '不辣'],
      addons: [],
    },
    {
      id: 'mt-4',
      name: '双人下午茶套餐',
      productType: 'combo',
      category: '套餐',
      price: '39',
      methods: ['饮品可选冰/热'],
      addons: ['含拿铁、可颂'],
    },
  ],
  taobao: [
    {
      id: 'tb-1',
      name: '冰美式',
      productType: 'standard',
      category: '现制饮品',
      price: '12',
      multiSpec: true,
      specs: [{ id: 'tb-1-s1', name: '中杯', price: '12' }, { id: 'tb-1-s2', name: '大杯', price: '15' }],
      methods: ['正常冰', '少冰'],
      addons: [],
    },
    {
      id: 'tb-2',
      name: '拿铁',
      productType: 'standard',
      category: '现制饮品',
      price: '18',
      methods: ['热', '冰'],
      addons: ['燕麦奶 +3'],
      sameName: true,
    },
    {
      id: 'tb-3',
      name: '牛肉饭套餐',
      productType: 'combo',
      category: '',
      price: '20',
      methods: [],
      addons: ['煎蛋 +3'],
    },
  ],
};

export const MobileProductCreator: React.FC<Props> = ({ onBack, categories, labelGroups, badges, onLabelGroupsChange, onBadgesChange }) => {
  const [createStep, setCreateStep] = useState<CreateStep>('type_select');
  const [createMode, setCreateMode] = useState<CreateMode>('manual');
  const [quickMode, setQuickMode] = useState<'photo' | 'voice'>('photo');
  const [targetProductType, setTargetProductType] = useState<'standard' | 'combo'>('standard');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPhotoActionSheet, setShowPhotoActionSheet] = useState(false);
  const [creationCategory, setCreationCategory] = useState<{ id: string; name: string } | null>(null);
  const [creationFormData, setCreationFormData] = useState<Record<string, any>>({});
  const [formEntrySource, setFormEntrySource] = useState<'manual' | 'ai_confirm'>('manual');
  const [scanSource, setScanSource] = useState<ScanSource>(null);
  const [selectedVoiceExampleId, setSelectedVoiceExampleId] = useState('v3');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceRecordingStartedAt, setVoiceRecordingStartedAt] = useState<number | null>(null);
  const [voiceInputError, setVoiceInputError] = useState('');
  const [recognitionQueue, setRecognitionQueue] = useState<AiDraftItem[]>([]);
  const [recognizedItems, setRecognizedItems] = useState<AiDraftItem[]>([]);
  const [processingDone, setProcessingDone] = useState(false);
  const [successSummary, setSuccessSummary] = useState({ savedCount: 0, pendingCount: 0 });
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [processingBaseItems, setProcessingBaseItems] = useState<AiDraftItem[]>([]);
  const [confirmFilter, setConfirmFilter] = useState<'all' | 'uncategorized' | string>('all');
  const [quickDraft, setQuickDraft] = useState<QuickCreateSavedDraft | null>(null);
  const [resumeQuickDraft, setResumeQuickDraft] = useState(false);
  const [thirdPlatform, setThirdPlatform] = useState<MobileThirdPlatform>('meituan');
  const [thirdAuthorized, setThirdAuthorized] = useState<Record<MobileThirdPlatform, boolean>>({ meituan: false, taobao: true });
  const [thirdBindingType, setThirdBindingType] = useState<Record<MobileThirdPlatform, string>>({
    meituan: MOBILE_THIRD_BINDING_TYPES.meituan[0],
    taobao: MOBILE_THIRD_BINDING_TYPES.taobao[0],
  });
  const [thirdSelectedIds, setThirdSelectedIds] = useState<string[]>(MOBILE_THIRD_PRODUCTS.meituan.map(item => item.id));
  const [thirdRemovedIds, setThirdRemovedIds] = useState<string[]>([]);
  const [thirdOverrides, setThirdOverrides] = useState<Record<string, Partial<MobileThirdProduct>>>({});
  const [thirdEditingId, setThirdEditingId] = useState<string | null>(null);
  const [thirdEditDraft, setThirdEditDraft] = useState<MobileThirdProduct | null>(null);
  const [thirdImportedCount, setThirdImportedCount] = useState(0);
  const [thirdConfirmCategory, setThirdConfirmCategory] = useState<'all' | 'issues' | string>('all');
  const [thirdTypeFilter, setThirdTypeFilter] = useState<'all' | 'standard' | 'combo'>('all');
  const [thirdOnlySameName, setThirdOnlySameName] = useState(false);
  const [thirdSearchKeyword, setThirdSearchKeyword] = useState('');
  const [thirdFilterSheetOpen, setThirdFilterSheetOpen] = useState(false);
  const timerRefs = useRef<number[]>([]);
  const voiceHoldingRef = useRef(false);
  const voiceAppendRef = useRef(false);
  const aiDefaultCategory = categories[0]?.name || '通用菜品';

  const selectedVoiceExample = VOICE_EXAMPLES.find(item => item.id === selectedVoiceExampleId) || VOICE_EXAMPLES[0];
  const categoryOptions = [...new Set([
    ...categories.slice(0, 12).map(item => item.name),
    ...recognizedItems.map(item => item.category).filter(Boolean),
    aiDefaultCategory,
  ])];

  const isMultiSpecItem = (item: AiDraftItem) => !!item.specs?.length;
  const areSpecsValid = (item: AiDraftItem) => !!item.specs?.length && item.specs.every(spec => spec.name.trim() && spec.price.trim());
  const isDraftValid = (item: AiDraftItem) =>
    !!item.name.trim() &&
    !!item.category.trim() &&
    (isMultiSpecItem(item) ? areSpecsValid(item) : !!item.basePrice.trim());

  const validDrafts = recognizedItems.filter(isDraftValid);
  const invalidDrafts = recognizedItems.filter(item => !isDraftValid(item));
  const uncategorizedCount = recognizedItems.filter(item => !item.category.trim()).length;
  const orderedRecognizedItems = [...recognizedItems].sort((a, b) => Number(!!a.category.trim()) - Number(!!b.category.trim()));
  const filteredRecognizedItems = orderedRecognizedItems.filter(item => {
    if (confirmFilter === 'all') return true;
    if (confirmFilter === 'uncategorized') return !item.category.trim();
    return item.category === confirmFilter;
  });
  const confirmFilters: Array<{ id: 'all' | 'uncategorized' | string; label: string; count: number }> = [
    { id: 'all', label: '全部', count: recognizedItems.length },
    { id: 'uncategorized', label: '未分类', count: uncategorizedCount },
    ...categoryOptions
      .filter(category => category && recognizedItems.some(item => item.category === category))
      .map(category => ({
        id: category,
        label: category,
        count: recognizedItems.filter(item => item.category === category).length,
      })),
  ].filter(filter => filter.id === 'all' || filter.count > 0);
  const thirdMeta = MOBILE_THIRD_PLATFORM_META[thirdPlatform];
  const thirdProducts = MOBILE_THIRD_PRODUCTS[thirdPlatform]
    .map(item => ({ ...item, ...thirdOverrides[item.id] }))
    .filter(item => !thirdRemovedIds.includes(item.id));
  const getThirdSpecPrices = (item: MobileThirdProduct) =>
    (item.specs || []).map(spec => spec.price).filter(price => price.trim());
  const getThirdMinPrice = (item: MobileThirdProduct) => {
    if (!item.multiSpec) return item.price.trim();
    const prices = getThirdSpecPrices(item).map(Number).filter(price => !Number.isNaN(price));
    return prices.length ? String(Math.min(...prices)) : '';
  };
  const hasThirdValidPrice = (item: MobileThirdProduct) => {
    if (!item.multiSpec) return !!item.price.trim();
    return !!item.specs?.length && item.specs.every(spec => spec.price.trim());
  };
  const canImportThirdProduct = (item: MobileThirdProduct) =>
    item.name.trim() && item.category.trim() && hasThirdValidPrice(item);
  const thirdValidProducts = thirdProducts.filter(canImportThirdProduct);
  const thirdSelectedValidProducts = thirdProducts.filter(
    item => thirdSelectedIds.includes(item.id) && canImportThirdProduct(item)
  );

  const clearTimers = () => {
    timerRefs.current.forEach(timer => window.clearTimeout(timer));
    timerRefs.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (createStep !== 'ai_processing' || recognitionQueue.length === 0) return;
    clearTimers();
    setRecognizedItems(processingBaseItems);
    setProcessingDone(false);

    recognitionQueue.forEach((item, index) => {
      const timer = window.setTimeout(() => {
        setRecognizedItems(prev => [...prev, item]);
        if (index === recognitionQueue.length - 1) {
          setProcessingDone(true);
          const finishTimer = window.setTimeout(() => {
            setCreateStep('ai_confirm');
          }, 550);
          timerRefs.current.push(finishTimer);
        }
      }, 380 * (index + 1));
      timerRefs.current.push(timer);
    });
  }, [createStep, recognitionQueue, processingBaseItems]);

  useEffect(() => {
    if (createStep !== 'voice_recording') return;

    const handleRelease = () => {
      if (!voiceHoldingRef.current) return;
      voiceHoldingRef.current = false;
      beginRecognition('voice', null, voiceAppendRef.current);
    };

    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);
    window.addEventListener('touchcancel', handleRelease);

    return () => {
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
      window.removeEventListener('touchcancel', handleRelease);
    };
  }, [createStep, selectedVoiceExample]);

  useEffect(() => {
    if (createStep !== 'ai_confirm') return;
    setConfirmFilter(uncategorizedCount > 0 ? 'uncategorized' : 'all');
  }, [createStep]);

  const resetAiFlow = () => {
    clearTimers();
    setRecognitionQueue([]);
    setRecognizedItems([]);
    setProcessingBaseItems([]);
    setProcessingDone(false);
    setScanSource(null);
    setVoiceRecordingStartedAt(null);
    setSuccessSummary({ savedCount: 0, pendingCount: 0 });
    setVoiceInputError('');
    voiceHoldingRef.current = false;
    voiceAppendRef.current = false;
  };

  const resetThirdAuthFlow = (platform = thirdPlatform) => {
    setThirdSelectedIds(MOBILE_THIRD_PRODUCTS[platform].map(item => item.id));
    setThirdRemovedIds([]);
    setThirdOverrides({});
    setThirdEditingId(null);
    setThirdEditDraft(null);
    setThirdImportedCount(0);
    setThirdConfirmCategory('all');
    setThirdTypeFilter('all');
    setThirdOnlySameName(false);
    setThirdSearchKeyword('');
    setThirdFilterSheetOpen(false);
  };

  const handleThirdPlatformChange = (platform: MobileThirdPlatform) => {
    setThirdPlatform(platform);
    resetThirdAuthFlow(platform);
  };

  const beginThirdPull = () => {
    clearTimers();
    setThirdSelectedIds(MOBILE_THIRD_PRODUCTS[thirdPlatform].map(item => item.id));
    setThirdRemovedIds([]);
    setThirdOverrides({});
    setThirdConfirmCategory('all');
    setThirdTypeFilter('all');
    setThirdOnlySameName(false);
    setThirdSearchKeyword('');
    setThirdFilterSheetOpen(false);
    setCreateStep('third_auth_pulling');
    const timer = window.setTimeout(() => {
      setCreateStep('third_auth_confirm');
    }, 1500);
    timerRefs.current.push(timer);
  };

  const handleThirdAuthorizeDone = () => {
    setThirdAuthorized(prev => ({ ...prev, [thirdPlatform]: true }));
    setCreateStep('third_auth_setup');
  };

  const handleThirdRemoveProduct = (id: string) => {
    setThirdRemovedIds(prev => [...prev, id]);
    setThirdSelectedIds(prev => prev.filter(itemId => itemId !== id));
    if (thirdEditingId === id) {
      setThirdEditingId(null);
      setThirdEditDraft(null);
    }
  };

  const handleThirdEditProduct = (item: MobileThirdProduct) => {
    setThirdEditingId(item.id);
    setThirdEditDraft({ ...item });
  };

  const toEditableThirdProduct = (item: MobileThirdProduct): Product => {
    const basePrice = Number(getThirdMinPrice(item) || item.price) || 0;
    return {
      id: `third_import_${item.id}`,
      name: item.name,
      price: basePrice,
      category: item.category,
      status: 'draft',
      stockStatus: 'available',
      image: '',
      skuCode: item.id,
      type: item.productType,
      isCombo: item.productType === 'combo',
      isMultiSpec: !!item.multiSpec,
      stock: -1,
      specs: (item.specs || []).map(spec => ({
        name: spec.name,
        price: Number(spec.price) || 0,
        stock: -1,
        unlimited: true,
      })),
    };
  };

  const handleThirdEditorSave = (sourceId: string, updates: Partial<Product>) => {
    const source = thirdProducts.find(item => item.id === sourceId);
    const patch: Partial<MobileThirdProduct> = {};
    if (typeof updates.name === 'string') patch.name = updates.name;
    if (typeof updates.category === 'string') patch.category = updates.category;
    if (typeof updates.price === 'number') patch.price = updates.price > 0 ? String(updates.price) : '';
    if (updates.specs?.length) {
      patch.multiSpec = true;
      patch.specs = updates.specs.map((spec, index) => ({
        id: source?.specs?.[index]?.id || `${sourceId}-spec-${index}`,
        name: spec.name,
        price: spec.price && spec.price > 0 ? String(spec.price) : '',
      }));
    }
    handleThirdFieldChange(sourceId, patch);
  };

  const handleThirdFieldChange = (id: string, patch: Partial<MobileThirdProduct>) => {
    setThirdOverrides(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
  };

  const handleThirdImport = () => {
    setThirdImportedCount(thirdSelectedValidProducts.length);
    setCreateStep('third_auth_success');
  };

  const handleStartCreation = (mode: CreateMode) => {
    setCreateMode(mode);
    if (mode === 'manual') return;
    setResumeQuickDraft(false);
    // 拍菜单 / 语音录入：进入重设计后的快捷录入链路
    setQuickMode(mode === 'voice' ? 'voice' : 'photo');
    setCreateStep('quick');
  };

  const handleTypeSelect = (type: 'standard' | 'combo') => {
    setTargetProductType(type);
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (cat: { id: string; name: string }) => {
    setCreationCategory({ id: cat.id, name: cat.name });
    setShowCategoryModal(false);
    setCreateStep('form');
  };

  const normalizeAiItems = (items: AiDraftItem[]) =>
    items.map((item, index) => ({
      ...item,
      id: `${item.id}_${Date.now()}_${index}`,
      category: item.category || '',
      specs: item.specs?.map((spec, specIndex) => ({
        ...spec,
        id: `${spec.id}_${Date.now()}_${index}_${specIndex}`,
      })),
    }));

  const isVoiceTranscriptValid = (transcript: string) => {
    const normalized = transcript.trim();
    if (!normalized) return false;
    if (!/\d+(\.\d+)?元/.test(normalized)) return false;
    return normalized.length >= 4;
  };

  const beginRecognition = (mode: CreateMode, source?: ScanSource | null, append = false) => {
    setCreateMode(mode);
    if (mode === 'scan') {
      resetAiFlow();
      setScanSource(source || 'camera');
      setProcessingBaseItems([]);
      setRecognitionQueue(normalizeAiItems(source === 'upload' ? PHOTO_UPLOAD_ITEMS : PHOTO_CAMERA_ITEMS));
      setShowPhotoActionSheet(false);
    } else {
      if (!isVoiceTranscriptValid(selectedVoiceExample.transcript)) {
        voiceHoldingRef.current = false;
        voiceAppendRef.current = false;
        setVoiceRecordingStartedAt(null);
        setVoiceInputError('未识别到有效商品，请按“商品名 + 价格”重新说一遍，例如：奶茶30元、宫保鸡丁28元');
        setCreateStep('voice_intro');
        return;
      }
      clearTimers();
      setVoiceInputError('');
      setVoiceTranscript(selectedVoiceExample.transcript);
      setProcessingBaseItems(append ? recognizedItems : []);
      setRecognitionQueue(normalizeAiItems(selectedVoiceExample.items));
      setProcessingDone(false);
      setScanSource(null);
      setVoiceRecordingStartedAt(null);
    }
    setCreateStep('ai_processing');
  };

  const beginVoiceHold = (append = false) => {
    if (voiceHoldingRef.current) return;
    setCreateMode('voice');
    setVoiceInputError('');
    setVoiceRecordingStartedAt(Date.now());
    voiceHoldingRef.current = true;
    voiceAppendRef.current = append;
    setCreateStep('voice_recording');
  };

  const handleStopRecognition = () => {
    clearTimers();
    setProcessingDone(true);
    if (recognizedItems.length > 0) {
      setCreateStep('ai_confirm');
    } else {
      setCreateStep(createMode === 'voice' ? 'voice_intro' : 'photo_intro');
    }
  };

  const handleDraftChange = (id: string, field: 'name' | 'basePrice' | 'category', value: string) => {
    setRecognizedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSpecChange = (draftId: string, specId: string, field: 'name' | 'price', value: string) => {
    setRecognizedItems(prev =>
      prev.map(item =>
        item.id === draftId
          ? {
              ...item,
              specs: item.specs?.map(spec =>
                spec.id === specId ? { ...spec, [field]: field === 'price' ? value.replace(/[^\d.]/g, '') : value } : spec
              ),
            }
          : item
      )
    );
  };

  const handleRemoveSpec = (draftId: string, specId: string) => {
    setRecognizedItems(prev =>
      prev.map(item =>
        item.id === draftId
          ? {
              ...item,
              specs: item.specs?.filter(spec => spec.id !== specId),
            }
          : item
      )
    );
  };

  const handleDraftEditMore = (item: AiDraftItem) => {
    setFormEntrySource('ai_confirm');
    setEditingDraftId(item.id);
    setTargetProductType('standard');
    setCreationCategory(null);
    setCreationFormData({
      name: item.name,
      basePrice: item.basePrice,
      category: item.category,
      sourceMode: createMode === 'voice' ? 'voice' : 'scan',
      sourceLabel: createMode === 'voice' ? '语音录入' : '拍照录入',
      sourceHint: '系统已根据识别结果预填基础信息，您可以继续补充图片、渠道、规格和展示信息。',
    });
    setCreateStep('form');
  };

  const handleDeleteDraft = (id: string) => {
    setRecognizedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDraftImageReplace = (id: string) => {
    setRecognizedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, imageVariant: item.imageVariant + 1 } : item))
    );
  };

  const handleStandardFormSave = (data: { name: string; basePrice: string; category: string }) => {
    if (editingDraftId) {
      setRecognizedItems(prev =>
        prev.map(item =>
          item.id === editingDraftId
            ? { ...item, name: data.name, basePrice: data.basePrice, category: data.category }
            : item
        )
      );
    }
    setEditingDraftId(null);
    setCreateStep('ai_confirm');
  };

  const handleSaveDrafts = () => {
    setSuccessSummary({
      savedCount: validDrafts.length,
      pendingCount: invalidDrafts.length,
    });
    setCreateStep('success');
  };

  const handleBack = () => {
    if (createStep === 'type_select') {
      onBack();
      return;
    }
    if (createStep === 'third_auth_setup') {
      resetThirdAuthFlow();
      setCreateStep('type_select');
      return;
    }
    if (createStep === 'third_auth_platform') {
      setCreateStep('third_auth_setup');
      return;
    }
    if (createStep === 'third_auth_pulling') {
      clearTimers();
      setCreateStep('third_auth_setup');
      return;
    }
    if (createStep === 'third_auth_confirm') {
      setCreateStep('third_auth_setup');
      return;
    }
    if (createStep === 'third_auth_success') {
      setCreateStep('type_select');
      return;
    }
    if (createStep === 'form') {
      if (formEntrySource === 'ai_confirm') {
        setCreateStep('ai_confirm');
      } else {
        setCreateStep('type_select');
        setCreationFormData({});
      }
      return;
    }
    if (createStep === 'ai_processing') {
      handleStopRecognition();
      return;
    }
    if (createStep === 'ai_confirm') {
      setCreateStep(createMode === 'voice' ? 'voice_intro' : 'photo_intro');
      return;
    }
    if (createStep === 'voice_recording') {
      setCreateStep('voice_intro');
      return;
    }
    if (createStep === 'success') {
      setCreateStep(createMode === 'voice' ? 'voice_intro' : 'photo_intro');
      return;
    }
    resetAiFlow();
    setCreateStep('type_select');
  };

  const renderTypeSelection = () => (
    <div className="flex-1 min-h-0 flex flex-col relative h-full animate-in slide-in-from-right duration-300">
      <QuickEntryScreen
        draft={quickDraft?.meta || null}
        onPick={(k) => {
          if (k === 'resume') {
            if (!quickDraft) return;
            setResumeQuickDraft(true);
            setQuickMode(quickDraft.source);
            setCreateStep('quick');
          } else if (k === 'discard') {
            setQuickDraft(null);
            setResumeQuickDraft(false);
          } else if (k === 'photo') handleStartCreation('scan');
          else if (k === 'voice') handleStartCreation('voice');
          else if (k === 'standard') handleTypeSelect('standard');
          else if (k === 'combo') handleTypeSelect('combo');
          else if (k === 'third_auth') setCreateStep('third_auth_setup');
          // 'weigh' 暂未开放
        }}
      />
    </div>
  );

  // 保留旧版 type-select（设计稿之前的入口），如需对比可启用
  const renderLegacyTypeSelection = () => (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F7] relative h-full animate-in slide-in-from-right duration-300">
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-8">
        <div className="mb-5 text-[13px] font-bold text-[#9AA2B1]">智能录入 · 推荐</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleStartCreation('scan')}
            className="rounded-[24px] bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-transform active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2DC55D] text-white shadow-[0_10px_20px_rgba(45,197,93,0.18)]">
                <Camera size={22} strokeWidth={2.4} />
              </div>
              <span className="rounded-full bg-[#EEF8EF] px-2 py-0.5 text-[10px] font-black text-[#67A86D]">AI</span>
            </div>
            <div className="mt-5 text-[15px] font-black text-[#1F2129]">拍菜单</div>
            <div className="mt-1 text-[12px] leading-5 text-[#99A1B1]">整本菜单一次录入</div>
          </button>

          <button
            onClick={() => handleStartCreation('voice')}
            className="rounded-[24px] bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-transform active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7A5AF8] text-white shadow-[0_10px_20px_rgba(122,90,248,0.22)]">
                <Mic size={22} strokeWidth={2.4} />
              </div>
              <span className="rounded-full bg-[#F4F0FF] px-2 py-0.5 text-[10px] font-black text-[#8A70F8]">AI</span>
            </div>
            <div className="mt-5 text-[15px] font-black text-[#1F2129]">语音录入</div>
            <div className="mt-1 text-[12px] leading-5 text-[#99A1B1]">对着手机说，AI 整理</div>
          </button>
        </div>

        <div className="mt-7 text-[13px] font-bold text-[#9AA2B1]">手动添加</div>
        <div className="mt-3 overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <button
            onClick={() => handleTypeSelect('standard')}
            className="flex w-full items-center px-4 py-4 text-left transition-colors active:bg-[#F8FAFB]"
          >
            <div className="mr-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF8EF] text-[#2DC55D]">
              <CupSoda size={21} strokeWidth={2.3} />
            </div>
            <div className="flex-1">
              <div className="text-[16px] font-black text-[#1F2129]">标准商品</div>
              <div className="mt-1 text-[12px] text-[#9AA2B1]">单品，如咖啡、面包、零售品</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F6F8] text-[#B3B9C7]">
              <ChevronRight size={18} />
            </div>
          </button>

          <div className="mx-4 h-px bg-[#EEF1F5]"></div>

          <button
            onClick={() => handleTypeSelect('combo')}
            className="flex w-full items-center px-4 py-4 text-left transition-colors active:bg-[#F8FAFB]"
          >
            <div className="mr-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF2E9] text-[#FF9448]">
              <Utensils size={21} strokeWidth={2.3} />
            </div>
            <div className="flex-1">
              <div className="text-[16px] font-black text-[#1F2129]">套餐商品</div>
              <div className="mt-1 text-[12px] text-[#9AA2B1]">组合，如双人餐、超值午餐</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F6F8] text-[#B3B9C7]">
              <ChevronRight size={18} />
            </div>
          </button>

          <div className="mx-4 h-px bg-[#EEF1F5]"></div>

          <div className="flex items-center px-4 py-4 opacity-70">
            <div className="mr-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF6DD] text-[#F3AA22]">
              <Scale size={21} strokeWidth={2.3} />
            </div>
            <div className="flex-1">
              <div className="text-[16px] font-black text-[#1F2129]">称重商品</div>
              <div className="mt-1 text-[12px] text-[#9AA2B1]">按重量计算售价，如水果、散称</div>
            </div>
            <span className="rounded-full bg-[#F4F6F8] px-2 py-1 text-[10px] font-bold text-[#A1A8B8]">暂未开放</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoryModal = () => {
    if (!showCategoryModal) return null;
    const activeCategoryList = STORE_CREATION_CATEGORIES[targetProductType];
    const isStandard = targetProductType === 'standard';

    return (
      <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in duration-200">
        <div className="flex-1" onClick={() => setShowCategoryModal(false)}></div>
        <div className="bg-white rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300 pb-10 shadow-2xl flex flex-col max-h-[80vh]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div>
              <h3 className="text-xl font-black text-[#1F2129]">选择所属类目</h3>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-400 mr-1">当前正在创建:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isStandard ? 'bg-green-50 text-[#00C06B]' : 'bg-orange-50 text-orange-500'}`}>
                  {isStandard ? '标准商品' : '套餐商品'}
                </span>
              </div>
            </div>
            <button onClick={() => setShowCategoryModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar pb-6">
            {activeCategoryList.map(cat => (
              <div
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className="flex flex-col items-center justify-center py-4 px-2 bg-[#F8FAFB] rounded-2xl border border-transparent active:border-[#00C06B] active:bg-[#00C06B]/5 cursor-pointer min-h-[110px] transition-all"
              >
                <div className={`mb-2 p-2.5 rounded-2xl ${isStandard ? 'bg-white text-[#00C06B] shadow-sm' : 'bg-white text-orange-500 shadow-sm'}`}>
                  {cat.icon ? React.cloneElement(cat.icon as React.ReactElement<any>, { size: 24, strokeWidth: 2.5 }) : <Utensils size={24} strokeWidth={2.5} />}
                </div>
                <span className="font-bold text-sm text-gray-800 text-center mb-0.5">{cat.name}</span>
                <span className="text-[10px] text-gray-400 text-center leading-tight px-1">{cat.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCreationForm = () => {
    if (targetProductType === 'combo') {
      return (
        <MobileComboProductCreator
          onBack={handleBack}
          categories={categories}
          categoryName={creationCategory?.name}
        />
      );
    }

    return (
      <MobileStandardProductCreator
        onBack={handleBack}
        categories={categories}
        productType={targetProductType}
        categoryName={creationFormData.category || creationCategory?.name}
        initialData={creationFormData}
        saveMode={formEntrySource === 'ai_confirm' ? 'ai_confirm' : 'default'}
        onSaveDraft={handleStandardFormSave}
        labelGroups={labelGroups}
        badges={badges}
        onLabelGroupsChange={onLabelGroupsChange}
        onBadgesChange={onBadgesChange}
      />
    );
  };

  const renderPhotoIntro = () => (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F7] animate-in slide-in-from-right duration-300">
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-28">
        <div className="text-[13px] font-bold text-[#9AA2B1]">智能录入 · 拍照</div>

        <div className="mt-3 rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[25px] font-black leading-9 text-[#1F2129]">拍照录入菜单</div>
              <div className="mt-2 text-[14px] leading-6 text-[#8B92A3]">上传清晰的菜单图片，系统会自动识别商品名称、价格和规格信息。</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF8EF] text-[#2DC55D]">
              <Camera size={22} />
            </div>
          </div>

          <div className="mt-5 rounded-[24px] bg-[#F6F8FB] p-4">
            <div className="grid grid-cols-[120px_1fr] gap-4">
              <div className="rounded-2xl bg-white p-4">
                {PHOTO_POSITIVE_TIPS.map(item => (
                  <div key={item} className="mb-4 flex items-center text-sm font-medium text-[#4D5566] last:mb-0">
                    <div className="mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#E9F7EF] text-[#00B563]">✓</div>
                    {item}
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-[#E4E8F0] bg-white p-4">
                <div className="flex h-full min-h-[140px] items-center justify-center rounded-xl border border-dashed border-[#D9DEE8] bg-[#FAFBFC] text-center text-[12px] leading-5 text-[#98A0B3]">
                  菜单示例图占位
                  <br />
                  后续可替换为真实示意图
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[13px] font-bold text-[#9AA2B1]">拍摄提示</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {PHOTO_NEGATIVE_TIPS.map(item => (
              <div key={item} className="rounded-[22px] bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <div className="mb-2 flex items-center text-[13px] font-bold text-[#EB5A5A]">
                  <X size={14} className="mr-1.5" />
                  {item}
                </div>
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[#E3E7EF] bg-[#F8F9FB] text-[12px] text-[#A1A8B8]">
                  示例图占位
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#F0F1F4] bg-white px-4 pb-6 pt-4 shadow-[0_-6px_20px_rgba(15,23,42,0.05)]">
        <div className="mb-3 text-center text-[12px] text-[#8A91A3]">单次支持 1 张菜单照片，可拍照或从相册上传</div>
        <button
          onClick={() => setShowPhotoActionSheet(true)}
          className="w-full rounded-full bg-[#2DC55D] py-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(45,197,93,0.22)]"
        >
          拍照或上传菜单
        </button>
      </div>
    </div>
  );

  const renderVoiceEntry = () => {
    const isRecording = createStep === 'voice_recording';

    return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-[#F4F7F7] animate-in slide-in-from-right duration-300">
      <div className={`min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 py-4 ${isRecording ? 'opacity-50' : ''}`}>
        <div className="text-[13px] font-bold text-[#9AA2B1]">智能录入 · 语音</div>
        <div className="mt-3 rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[24px] font-black text-[#1F2129]">语音录入菜品</div>
              <div className="mt-2 text-sm leading-6 text-[#7D8395]">适合快速录入简单商品，直接说“商品名 + 价格”即可。</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9F7EF] text-[#00C06B]">
              <Mic size={22} />
            </div>
          </div>

          <div className="mt-5 rounded-[24px] bg-[#F7F8FC] p-4">
            <div className="text-xs font-bold text-[#969CAF]">可以这样说</div>
            <div className="mt-3 space-y-3">
              {VOICE_EXAMPLES.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedVoiceExampleId(item.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${selectedVoiceExampleId === item.id ? 'border-[#CFC4FF] bg-[#F5F2FF]' : 'border-[#EEF0F3] bg-white'}`}
                >
                  <div className="text-xs font-bold text-[#8F94A8]">{item.label}</div>
                  <div className="mt-1 text-sm font-bold text-[#1F2129]">{item.transcript}</div>
                </button>
              ))}
            </div>
          </div>
          {voiceInputError ? (
            <div className="mt-4 rounded-2xl bg-[#FFF2F2] px-4 py-3">
              <div className="text-[12px] font-bold text-[#E35D5D]">识别失败，请重新说一遍</div>
              <div className="mt-1 text-[12px] leading-5 text-[#E35D5D]">
                {voiceInputError}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#F0F1F4] bg-white px-4 pb-6 pt-4">
        <button
          onMouseDown={() => beginVoiceHold(false)}
          onTouchStart={() => beginVoiceHold(false)}
          className="w-full rounded-full bg-[#7A5AF8] py-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(122,90,248,0.22)]"
        >
          长按说话
        </button>
      </div>

      {isRecording ? (
        <div className="absolute inset-0 z-20 flex flex-col bg-black/20">
          <div
            className="flex-1"
            onClick={() => {
              voiceHoldingRef.current = false;
              voiceAppendRef.current = false;
              setVoiceRecordingStartedAt(null);
              setCreateStep('voice_intro');
            }}
          ></div>
          <div className="rounded-t-[28px] bg-white px-5 pb-6 pt-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#E6E8EF]"></div>
            <button
              onClick={() => {
                voiceHoldingRef.current = false;
                voiceAppendRef.current = false;
                setVoiceRecordingStartedAt(null);
                setCreateStep('voice_intro');
              }}
              className="absolute right-5 top-5 text-[#7D8395]"
            >
              <X size={22} />
            </button>
            <div className="mt-8 text-center">
              <div className="text-[28px] font-black leading-9 text-[#1F2129]">
                请大声说<span className="text-[#FF7A00]">商品名称和价格</span>
              </div>
              <div className="mt-2 text-[13px] leading-6 text-[#8A91A3]">松开完成，上滑取消</div>
            </div>

            <div className="mt-8 flex flex-col items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FF7A00] text-white shadow-[0_12px_30px_rgba(255,122,0,0.28)]">
                <Mic size={34} />
              </div>
              <div className="mt-5 text-[13px] font-medium text-[#8A91A3]">
                已录制 {voiceRecordingStartedAt ? Math.max(1, Math.round((Date.now() - voiceRecordingStartedAt) / 1000)) : 1} 秒
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    );
  };

  const renderRecognizing = () => (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F7] animate-in slide-in-from-right duration-300">
      <div className="px-4 pt-4">
        <div className="text-[13px] font-bold text-[#9AA2B1]">智能识别中</div>
      </div>
      <div className="px-5 pt-4 text-center">
        <div className={`mx-auto flex h-[94px] w-[94px] items-center justify-center rounded-[28px] shadow-sm ${createMode === 'voice' ? 'bg-[#EFE9FF] text-[#7A5AF8]' : 'bg-[#EAF8EF] text-[#2DC55D]'}`}>
          {createMode === 'voice' ? <Mic size={34} /> : <ImageIcon size={34} />}
        </div>
        <div className={`mt-5 text-[15px] font-bold ${createMode === 'voice' ? 'text-[#7A5AF8]' : 'text-[#2DC55D]'}`}>
          当前已识别出{recognizedItems.length}个菜品
        </div>
        <div className="mt-1 text-sm text-[#80869A]">
          {createMode === 'voice' ? '正在识别语音内容，请耐心等待...' : '正在加速识别中，请耐心等待...'}
        </div>
        <button
          onClick={handleStopRecognition}
          className="mt-5 inline-flex items-center rounded-full border border-[#D8DDE8] bg-white px-5 py-2.5 text-[15px] font-bold text-[#4F5565]"
        >
          <Loader2 size={16} className="mr-1.5 animate-spin" />
          停止识别
        </button>
      </div>

      <div className="mx-4 mt-5 min-h-0 flex-1 overflow-y-auto no-scrollbar rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
        <div className="space-y-0">
          {recognizedItems.map(item => (
            <div key={item.id} className="flex items-center justify-between border-b border-[#EEF1F5] py-4 last:border-b-0">
              <span className="text-[17px] text-[#20232D]">{item.name}</span>
              <span className="text-[15px] text-[#20232D]">
                {item.specs?.length ? `${item.specs.length}个规格` : `￥${item.basePrice}`}
              </span>
            </div>
          ))}
          {!recognizedItems.length && (
            <div className="py-10 text-center text-sm text-[#A1A7B7]">正在识别第一条商品...</div>
          )}
        </div>
        {!processingDone && (
          <div className="flex items-center justify-center py-4 text-sm text-[#A1A7B7]">
            <Loader2 size={16} className="mr-2 animate-spin" />
            加载中...
          </div>
        )}
      </div>
    </div>
  );

  const renderAiConfirm = () => (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F7] animate-in slide-in-from-right duration-300">
      <div className="px-4 pt-4 pb-2">
        <div className="text-[13px] font-bold text-[#9AA2B1]">{createMode === 'voice' ? '语音录入结果' : '拍照识别结果'}</div>
        <div className="mt-1 text-[22px] font-black text-[#1F2129]">确认商品（{recognizedItems.length}个）</div>
      </div>

      <div className="shrink-0 px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {confirmFilters.map(filter => {
            const active = confirmFilter === filter.id;
            return (
              <button
                key={`${filter.id}`}
                onClick={() => setConfirmFilter(filter.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition-colors ${
                  active ? 'bg-[#1F2129] text-white' : 'bg-white text-[#707789]'
                }`}
              >
                {filter.label} {filter.count > 0 ? `(${filter.count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3 pb-8">
        {filteredRecognizedItems.map(item => {
          const isMultiSpec = isMultiSpecItem(item);
          return (
            <div key={item.id} className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-start justify-between">
                <div className="flex min-w-0 flex-1 items-start">
                  <button className="mr-3 shrink-0" onClick={() => handleDraftImageReplace(item.id)}>
                      <GeneratedProductImage name={item.name} variant={item.imageVariant} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-h-[58px] items-center rounded-[20px] border border-[#E9EDF3] bg-[#F7F9FC] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                      <input
                        value={item.name}
                        onChange={e => handleDraftChange(item.id, 'name', e.target.value)}
                        placeholder="请输入商品名称"
                        className={`min-w-0 flex-1 cursor-text bg-transparent text-[18px] font-black leading-7 outline-none placeholder:font-bold placeholder:text-[#C0C4CF] ${!item.name.trim() ? 'text-[#E35D5D]' : 'text-[#1F2129]'}`}
                      />
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDeleteDraft(item.id)} className="text-[#A0A6B7]">
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {!isMultiSpec ? (
                  <InlineField label="售价" required>
                    <input
                      value={item.basePrice}
                      onChange={e => handleDraftChange(item.id, 'basePrice', e.target.value.replace(/[^\d.]/g, ''))}
                      placeholder="请输入售价"
                      className={`w-full text-right text-[15px] font-medium outline-none placeholder:text-[#C0C4CF] ${!item.basePrice.trim() ? 'text-[#E35D5D]' : 'text-[#1F2129]'}`}
                    />
                  </InlineField>
                ) : null}
                <InlineField label="商品分类" required>
                  <select
                    value={item.category}
                    onChange={e => handleDraftChange(item.id, 'category', e.target.value)}
                    className={`w-full bg-transparent text-right text-[15px] font-medium outline-none ${!item.category.trim() ? 'text-[#E35D5D]' : 'text-[#1F2129]'}`}
                  >
                    <option value="">请选择分类</option>
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </InlineField>
              </div>

              {isMultiSpec ? (
                <div className="mt-4 rounded-[20px] bg-[#F7F9FC] p-3">
                  <div className="mb-3 text-[13px] font-black text-[#1F2129]">规格价格</div>
                  <div className="space-y-2">
                    {item.specs?.map(spec => (
                      <div key={spec.id} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2">
                        <input
                          value={spec.name}
                          onChange={e => handleSpecChange(item.id, spec.id, 'name', e.target.value)}
                          placeholder="规格名称"
                          className="min-w-0 flex-1 text-[14px] font-medium text-[#1F2129] outline-none placeholder:text-[#C0C4CF]"
                        />
                        <input
                          value={spec.price}
                          onChange={e => handleSpecChange(item.id, spec.id, 'price', e.target.value)}
                          placeholder="价格"
                          className="w-20 text-right text-[14px] font-medium text-[#1F2129] outline-none placeholder:text-[#C0C4CF]"
                        />
                        <button onClick={() => handleRemoveSpec(item.id, spec.id)} className="text-[#A0A6B7]">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {!!item.warnings.length && (
                <div className="mt-3 space-y-2">
                  {item.warnings.map(warning => (
                    <div key={warning} className="rounded-2xl bg-[#FFF8E8] px-3 py-2 text-[11px] text-[#9A6B00]">
                      {warning}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDraftEditMore(item)}
                  className="text-[13px] font-bold text-[#00A862]"
                >
                  编辑更多
                </button>
              </div>
            </div>
          );
        })}
        {!filteredRecognizedItems.length ? (
          <div className="rounded-[24px] bg-white px-4 py-8 text-center text-[13px] text-[#98A0B3] shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            当前筛选下暂无商品
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-[#EEF1F5] bg-white px-4 py-3 shadow-[0_-6px_20px_rgba(15,23,42,0.05)]">
        <div className="flex gap-3">
          {createMode === 'voice' ? (
            <button
              onMouseDown={() => beginVoiceHold(true)}
              onTouchStart={() => beginVoiceHold(true)}
              className="flex-1 rounded-full border border-[#7A5AF8] bg-white py-3.5 text-[15px] font-black text-[#7A5AF8]"
            >
              长按继续录入
            </button>
          ) : null}
          <button
            onClick={handleSaveDrafts}
            disabled={!validDrafts.length}
            className="flex-1 rounded-full bg-[#2DC55D] py-3.5 text-[15px] font-black text-white shadow-[0_10px_24px_rgba(45,197,93,0.22)] disabled:opacity-50"
          >
            确认保存
          </button>
        </div>
      </div>
    </div>
  );

  const renderThirdAuthSetup = () => {
    const authorized = thirdAuthorized[thirdPlatform];

    return (
      <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F7] animate-in slide-in-from-right duration-300">
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-4 py-3 pb-24">
          <div className="rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[12px] font-bold text-[#9AA2B1]">当前门店</div>
                <div className="mt-1 text-[16px] font-black text-[#1F2129]">静静咖啡国贸店</div>
                <div className="mt-0.5 text-[12px] font-medium text-[#8B92A3]">门店ID：538 · 导入到当前门店商品库</div>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF8EF] text-[#00A862]">
                <Store size={20} strokeWidth={2.4} />
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {(Object.keys(MOBILE_THIRD_PLATFORM_META) as MobileThirdPlatform[]).map(platform => {
              const meta = MOBILE_THIRD_PLATFORM_META[platform];
              const active = thirdPlatform === platform;
              const isAuthorized = thirdAuthorized[platform];
              return (
                <button
                  key={platform}
                  onClick={() => handleThirdPlatformChange(platform)}
                  className={`rounded-[20px] border p-3 text-left transition-all active:scale-[0.98] ${
                    active ? 'border-[#00C06B] bg-[#F0FCF5]' : 'border-transparent bg-white'
                  } shadow-[0_10px_24px_rgba(15,23,42,0.04)]`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-black"
                      style={{ background: meta.tint, color: meta.color }}
                    >
                      {meta.mark}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                      isAuthorized ? 'bg-[#EAF8EF] text-[#00A862]' : 'bg-[#F1F3F6] text-[#8B92A3]'
                    }`}>
                      {isAuthorized ? '已授权' : '未授权'}
                    </span>
                  </div>
                  <div className="mt-3 text-[15px] font-black text-[#1F2129]">{meta.label}</div>
                  <div className="mt-1 text-[11.5px] leading-4 text-[#7D8395]">{meta.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-black text-[#1F2129]">{thirdMeta.label}</div>
                <div className="mt-1 text-[12px] font-medium text-[#8B92A3]">
                  {authorized ? '当前门店已完成授权，可直接拉取商品。' : '该门店未授权，请先选择授权绑定类型。'}
                </div>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-[12px] font-black ${
                authorized ? 'bg-[#EAF8EF] text-[#00A862]' : 'bg-[#FFF3E8] text-[#FF7A00]'
              }`}>
                {authorized ? '已授权' : '未授权'}
              </span>
            </div>

            {!authorized ? (
              <div className="mt-4">
                <div className="mb-2 text-[12px] font-black text-[#4D5566]">授权绑定类型</div>
                <div className="space-y-2">
                  {MOBILE_THIRD_BINDING_TYPES[thirdPlatform].map(type => {
                    const checked = thirdBindingType[thirdPlatform] === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setThirdBindingType(prev => ({ ...prev, [thirdPlatform]: type }))}
                        className={`flex w-full items-center justify-between rounded-[16px] border px-4 py-2.5 text-left ${
                          checked ? 'border-[#00C06B] bg-[#F0FCF5]' : 'border-[#EEF1F5] bg-[#F8FAFB]'
                        }`}
                      >
                        <span className="text-[14px] font-bold text-[#1F2129]">{type}</span>
                        <span className={`h-5 w-5 rounded-full border-2 ${
                          checked ? 'border-[#00C06B] bg-[#00C06B]' : 'border-[#C8CEDA] bg-white'
                        }`}>
                          {checked ? <CheckCircle size={16} className="text-white" /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[18px] bg-[#F7F9FC] px-4 py-3">
                <div className="text-[12px] font-bold text-[#8B92A3]">预计拉取 {MOBILE_THIRD_PRODUCTS[thirdPlatform].length} 个商品草稿</div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#EEF1F5] bg-white px-4 py-3 shadow-[0_-6px_20px_rgba(15,23,42,0.05)]">
          <button
            onClick={authorized ? beginThirdPull : () => setCreateStep('third_auth_platform')}
            className="w-full rounded-full bg-[#2DC55D] py-4 text-[16px] font-black text-white shadow-[0_12px_24px_rgba(45,197,93,0.22)]"
          >
            {authorized ? '拉取商品' : '立即授权'}
          </button>
        </div>
      </div>
    );
  };

  const renderThirdAuthPlatform = () => (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F7] animate-in slide-in-from-right duration-300">
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-5">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-[18px] font-black"
              style={{ background: thirdMeta.tint, color: thirdMeta.color }}
            >
              {thirdMeta.mark}
            </div>
            <div>
              <div className="text-[18px] font-black text-[#1F2129]">{thirdMeta.label}授权</div>
              <div className="mt-0.5 text-[12px] font-medium text-[#8B92A3]">模拟平台授权页面</div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] bg-[#F7F9FC] p-4">
            <div className="text-[13px] font-black text-[#4D5566]">授权门店</div>
            <div className="mt-2 text-[18px] font-black text-[#1F2129]">静静咖啡国贸店</div>
            <div className="mt-1 text-[12px] text-[#8B92A3]">门店ID：538</div>
          </div>

          <div className="mt-4 space-y-3">
            {['读取外卖商品资料', '读取分类、规格、做法、加料', '生成门店商品导入草稿'].map(item => (
              <div key={item} className="flex items-center gap-3 rounded-[18px] bg-white px-1 py-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF8EF] text-[#00A862]">
                  <CheckCircle size={16} />
                </div>
                <span className="text-[14px] font-bold text-[#4D5566]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#EEF1F5] bg-white px-4 py-3">
        <button
          onClick={handleThirdAuthorizeDone}
          className="w-full rounded-full bg-[#1F2129] py-4 text-[16px] font-black text-white"
        >
          同意授权并返回
        </button>
      </div>
    </div>
  );

  const renderThirdAuthPulling = () => (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-[#F4F7F7] px-6 animate-in fade-in duration-300">
      <div className="w-full rounded-[30px] bg-white p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px]"
          style={{ background: thirdMeta.tint, color: thirdMeta.color }}
        >
          <Loader2 size={34} className="animate-spin" />
        </div>
        <div className="mt-5 text-[22px] font-black text-[#1F2129]">正在拉取商品</div>
        <div className="mt-2 text-[13px] leading-6 text-[#7D8395]">
          正在从{thirdMeta.label}读取商品，并生成确认页。
        </div>
        <div className="mt-6 space-y-3 text-left">
          {['读取商品资料', '清洗分类、规格、做法、加料', `生成${thirdValidProducts.length}个可导入商品草稿`].map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-[18px] bg-[#F7F9FC] px-4 py-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                index < 2 ? 'bg-[#EAF8EF] text-[#00A862]' : 'bg-[#EEF1F5] text-[#8B92A3]'
              }`}>
                {index < 2 ? <CheckCircle size={15} /> : <Loader2 size={15} className="animate-spin" />}
              </div>
              <span className="text-[13px] font-bold text-[#4D5566]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderThirdAuthConfirm = () => {
    const issueCount = thirdProducts.filter(item => !canImportThirdProduct(item)).length;
    const categoryCounts = thirdProducts.reduce<Record<string, number>>((acc, item) => {
      const key = item.category.trim() || '未分类';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const categoryOptions: Array<{ id: string; label: string; count: number; alert?: boolean }> = [
      ...(issueCount ? [{ id: 'issues', label: '待完善', count: issueCount, alert: true }] : []),
      ...Object.entries(categoryCounts).map(([label, count]) => ({ id: label, label, count })),
    ];
    const effectiveThirdConfirmCategory = categoryOptions.some(option => option.id === thirdConfirmCategory)
      ? thirdConfirmCategory
      : categoryOptions[0]?.id;
    const orderedProducts = [...thirdProducts].sort((a, b) => {
      const aReady = canImportThirdProduct(a);
      const bReady = canImportThirdProduct(b);
      if (aReady !== bReady) return Number(aReady) - Number(bReady);
      if (!!a.sameName !== !!b.sameName) return Number(!!b.sameName) - Number(!!a.sameName);
      return a.name.localeCompare(b.name, 'zh-Hans-CN');
    });
    const keyword = thirdSearchKeyword.trim().toLowerCase();
    const visibleProducts = orderedProducts.filter(item => {
      const itemCategory = item.category.trim() || '未分类';
      const categoryMatched = effectiveThirdConfirmCategory === 'issues'
        ? !canImportThirdProduct(item)
        : itemCategory === effectiveThirdConfirmCategory;
      const typeMatched = thirdTypeFilter === 'all' || item.productType === thirdTypeFilter;
      const sameNameMatched = !thirdOnlySameName || !!item.sameName;
      const keywordMatched = !keyword || `${item.name} ${item.category} ${item.methods.join(' ')} ${item.addons.join(' ')}`.toLowerCase().includes(keyword);
      return categoryMatched && typeMatched && sameNameMatched && keywordMatched;
    });
    const activeFilterCount = (thirdTypeFilter !== 'all' ? 1 : 0) + (thirdOnlySameName ? 1 : 0);
    const getListPriceText = (item: MobileThirdProduct) => {
      if (item.multiSpec) return getThirdMinPrice(item) ? `￥${getThirdMinPrice(item)}起` : '缺售价';
      return item.price.trim() ? `￥${item.price}` : '缺售价';
    };

    return (
      <div className="flex-1 min-h-0 flex flex-col bg-[#F4F7F7] animate-in slide-in-from-right duration-300">
        <div className="shrink-0 bg-white px-4 pb-3 pt-3 shadow-[0_1px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-bold text-[#9AA2B1]">{thirdMeta.label}导入结果</div>
              <div className="mt-0.5 text-[18px] font-black text-[#1F2129]">确认商品 · {thirdProducts.length}</div>
            </div>
            <div className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12px] font-black ${
              issueCount === 0 ? 'bg-[#EAF8EF] text-[#00A862]' : 'bg-[#FFF0F0] text-[#E35D5D]'
            }`}>
              {issueCount === 0 ? '全部就绪' : `${issueCount} 个待完善`}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-2xl bg-[#F2F5F6] px-3 py-2.5 text-[#9AA2B1]">
              <Search size={17} className="mr-2 shrink-0" />
              <input
                value={thirdSearchKeyword}
                onChange={event => setThirdSearchKeyword(event.target.value)}
                placeholder="搜索商品..."
                className="min-w-0 flex-1 bg-transparent text-[13px] font-bold text-[#1F2129] outline-none placeholder:text-[#9AA2B1]"
              />
            </div>
            <button
              onClick={() => setThirdFilterSheetOpen(true)}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F2F5F6] text-[#4B5565]"
            >
              <SlidersHorizontal size={19} />
              {activeFilterCount ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E35D5D] px-1 text-[10px] font-black leading-none text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 flex">
          <div className="w-[84px] shrink-0 overflow-y-auto border-r border-[#E5EAEE] bg-[#EEF2F3] py-2">
            {categoryOptions.map(option => {
              const active = effectiveThirdConfirmCategory === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setThirdConfirmCategory(option.id)}
                  className={`relative flex w-full flex-col items-start px-3 py-3 text-left ${
                    active ? 'bg-white' : 'bg-transparent'
                  }`}
                >
                  {active ? <span className="absolute left-0 top-3 h-5 w-1 rounded-r-full bg-[#00A862]" /> : null}
                  <span className={`max-w-full truncate text-[12.5px] font-black ${
                    option.alert ? 'text-[#E35D5D]' : active ? 'text-[#00A862]' : 'text-[#6B7280]'
                  }`}>
                    {option.label}
                  </span>
                  <span className={`mt-0.5 text-[10px] font-bold ${option.alert ? 'text-[#F04438]' : 'text-[#A0A6B7]'}`}>
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="min-w-0 flex-1 overflow-y-auto no-scrollbar px-3 py-3 pb-8">
            <div className="space-y-2">
              {visibleProducts.map(item => {
                const selected = thirdSelectedIds.includes(item.id);
                const importable = !!canImportThirdProduct(item);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleThirdEditProduct(item)}
                    className={`rounded-[18px] bg-white p-3 shadow-[0_5px_18px_rgba(15,23,42,0.04)] active:scale-[0.99] ${selected ? '' : 'opacity-60'}`}
                  >
                    <div className="flex gap-3">
                      <div className="relative h-[74px] w-[74px] shrink-0">
                        <div className={`flex h-full w-full items-center justify-center rounded-2xl text-[17px] font-black shadow-sm ${
                          item.productType === 'combo' ? 'bg-[#FFF3E6] text-[#B45309]' : 'bg-[#EAF8EF] text-[#00A862]'
                        }`}>
                          {(item.name || '商品').slice(0, 2)}
                        </div>
                        <button
                          onClick={event => {
                            event.stopPropagation();
                            if (!importable) return;
                            setThirdSelectedIds(prev => selected ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                          }}
                          className={`absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-sm ${
                            selected ? 'bg-[#00C06B]' : 'bg-[#F2F5F6]'
                          } ${!importable ? 'opacity-40' : ''}`}
                        >
                          {selected ? <CheckCircle size={18} className="text-white" /> : <span className="h-3.5 w-3.5 rounded-full border-2 border-[#AEB6C4]" />}
                        </button>
                      </div>

                      <div className="min-w-0 flex-1 self-stretch">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[16px] font-black leading-5 text-[#1F2129]">{item.name || '未命名商品'}</div>
                            {item.sameName ? <div className="mt-1 text-[11px] font-bold text-[#E35D5D]">存在同名商品，请确认后导入</div> : null}
                          </div>
                          <button
                            onClick={event => {
                              event.stopPropagation();
                              handleThirdEditProduct(item);
                            }}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#A0A6B7]"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={event => {
                              event.stopPropagation();
                              handleThirdRemoveProduct(item.id);
                            }}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#A0A6B7]"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-black ${
                            item.productType === 'combo' ? 'bg-[#FFF4E5] text-[#B45309]' : 'bg-[#EAF8EF] text-[#00A862]'
                          }`}>
                            {item.productType === 'combo' ? '套餐' : '标准'}
                          </span>
                          <span className="rounded-full bg-[#F1F3F6] px-2 py-0.5 text-[10.5px] font-bold text-[#6F7788]">
                            {item.multiSpec ? '多规格' : '单规格'}
                          </span>
                        </div>

                        <div className="mt-2 flex items-end justify-end gap-3">
                          <div className={`shrink-0 text-[15px] font-black ${hasThirdValidPrice(item) ? 'text-[#1F2129]' : 'text-[#E35D5D]'}`}>
                            {getListPriceText(item)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!visibleProducts.length ? (
              <div className="rounded-[18px] bg-white px-4 py-10 text-center text-[13px] font-bold text-[#98A2B3]">
                当前筛选下暂无商品
              </div>
            ) : null}
          </div>
        </div>

        {thirdFilterSheetOpen ? (
          <div className="absolute inset-0 z-40 flex items-end bg-black/35" onClick={() => setThirdFilterSheetOpen(false)}>
            <div className="w-full rounded-t-[24px] bg-white px-4 pb-6 pt-4 shadow-[0_-12px_30px_rgba(15,23,42,0.18)]" onClick={event => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[17px] font-black text-[#1F2129]">筛选商品</div>
                <button onClick={() => setThirdFilterSheetOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F5F6] text-[#6B7280]">
                  <X size={16} />
                </button>
              </div>
              <div className="mb-4">
                <div className="mb-2 text-[12px] font-black text-[#8B92A3]">商品类型</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'standard', label: '标准商品' },
                    { id: 'combo', label: '套餐商品' },
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setThirdTypeFilter(option.id as typeof thirdTypeFilter)}
                      className={`rounded-2xl px-2 py-2.5 text-[12px] font-black ${
                        thirdTypeFilter === option.id ? 'bg-[#EAF8EF] text-[#00A862]' : 'bg-[#F4F6F8] text-[#667085]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setThirdOnlySameName(prev => !prev)}
                className="mb-5 flex w-full items-center justify-between rounded-2xl bg-[#F4F6F8] px-3 py-3 text-left"
              >
                <div>
                  <div className="text-[13px] font-black text-[#1F2129]">只看同名商品</div>
                  <div className="mt-0.5 text-[11px] font-bold text-[#98A2B3]">用于快速确认可能重复的商品</div>
                </div>
                <span className={`h-6 w-11 rounded-full p-0.5 transition ${thirdOnlySameName ? 'bg-[#00C06B]' : 'bg-[#D8DEE6]'}`}>
                  <span className={`block h-5 w-5 rounded-full bg-white transition ${thirdOnlySameName ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setThirdTypeFilter('all');
                    setThirdOnlySameName(false);
                  }}
                  className="flex-1 rounded-full bg-[#F4F6F8] py-3 text-[14px] font-black text-[#667085]"
                >
                  重置
                </button>
                <button
                  onClick={() => setThirdFilterSheetOpen(false)}
                  className="flex-1 rounded-full bg-[#2DC55D] py-3 text-[14px] font-black text-white"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="shrink-0 border-t border-[#EEF1F5] bg-white px-4 py-3 shadow-[0_-6px_20px_rgba(15,23,42,0.05)]">
          <button
            onClick={handleThirdImport}
            disabled={!thirdSelectedValidProducts.length}
            className="w-full rounded-full bg-[#2DC55D] py-4 text-[16px] font-black text-white shadow-[0_12px_24px_rgba(45,197,93,0.22)] disabled:opacity-50"
          >
            确认导入 {thirdSelectedValidProducts.length} 个商品
          </button>
        </div>

      {thirdEditDraft ? (
        <div className="absolute inset-0 z-50 bg-white">
          <MobileProductEditor
            product={toEditableThirdProduct(thirdEditDraft)}
            activeChannel={thirdPlatform === 'meituan' ? 'meituan' : 'taobao'}
            draftBasePrice={thirdEditDraft.multiSpec ? undefined : thirdEditDraft.price}
            draftSpecItems={(thirdEditDraft.specs || []).map(spec => ({
              name: spec.name,
              price: spec.price,
              stock: '',
              unlimited: true,
            }))}
            onBack={() => {
              setThirdEditingId(null);
              setThirdEditDraft(null);
            }}
            categories={categories}
            labelGroups={labelGroups}
            badges={badges}
            onLabelGroupsChange={onLabelGroupsChange}
            onBadgesChange={onBadgesChange}
            onSave={updates => {
              if (thirdEditingId) handleThirdEditorSave(thirdEditingId, updates);
              setThirdEditingId(null);
              setThirdEditDraft(null);
            }}
          />
        </div>
      ) : null}
      </div>
    );
  };

  const renderThirdAuthSuccess = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 animate-in zoom-in-95">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
        <CheckCircle size={48} className="text-[#00C06B]" />
      </div>
      <h2 className="mb-2 text-2xl font-black text-[#1F2129]">导入成功</h2>
      <p className="mb-6 text-center text-[14px] leading-6 text-gray-500">
        已从{thirdMeta.label}导入 {thirdImportedCount} 个商品到当前门店商品库。
      </p>
      <div className="flex w-full flex-col space-y-3">
        <button onClick={onBack} className="w-full rounded-xl bg-[#1F2129] py-4 font-bold text-white">查看商品列表</button>
        <button
          onClick={() => {
            resetThirdAuthFlow();
            setCreateStep('third_auth_setup');
          }}
          className="w-full rounded-xl bg-gray-50 py-4 font-bold text-gray-600"
        >
          继续授权导入
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 animate-in zoom-in-95">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={48} className="text-[#00C06B]" />
      </div>
      <h2 className="text-2xl font-black text-[#1F2129] mb-2">保存成功</h2>
      <p className="text-gray-500 text-center mb-3">
        已成功保存 {successSummary.savedCount} 个商品
        {successSummary.pendingCount ? `，仍有 ${successSummary.pendingCount} 个商品待补充` : ''}
      </p>
      <div className="flex flex-col w-full space-y-3">
        <button onClick={onBack} className="w-full py-4 bg-[#1F2129] text-white rounded-xl font-bold">查看商品列表</button>
        <button
          onClick={() => {
            resetAiFlow();
            setCreateStep(createMode === 'voice' ? 'voice_intro' : 'photo_intro');
          }}
          className="w-full py-4 bg-gray-50 text-gray-600 rounded-xl font-bold"
        >
          {createMode === 'voice' ? '继续录菜' : '继续录入'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white relative h-full">
      {createStep !== 'form' && createStep !== 'quick' && (
        <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 relative z-20 bg-white">
          <button onClick={handleBack} className="p-2 -ml-2 text-gray-600">
            <ChevronLeft size={24} />
          </button>
          <span className="font-bold text-lg text-[#1F2129]">
            {createStep === 'third_auth_setup' || createStep === 'third_auth_platform' || createStep === 'third_auth_pulling' || createStep === 'third_auth_confirm' || createStep === 'third_auth_success' ? '三方授权导入' : createStep === 'photo_intro'
              ? '拍照录入'
              : createStep === 'voice_intro' || createStep === 'voice_recording'
                ? '语音录入'
                : '新建商品'}
          </span>
          <div className="w-8"></div>
        </div>
      )}

      {createStep === 'type_select' && renderTypeSelection()}
      {createStep === 'quick' && (
        <div className="flex-1 min-h-0">
          <MobileQuickCreate
            initialMode={quickMode}
            categories={categories}
            initialDraft={resumeQuickDraft ? quickDraft : null}
            onExit={() => {
              setResumeQuickDraft(false);
              setCreateStep('type_select');
            }}
            onSaveDraft={(draft) => {
              setQuickDraft(draft);
              setResumeQuickDraft(false);
              setCreateStep('type_select');
            }}
            onClearDraft={() => {
              setQuickDraft(null);
              setResumeQuickDraft(false);
            }}
            onViewList={onBack}
          />
        </div>
      )}
      {createStep === 'photo_intro' && renderPhotoIntro()}
      {(createStep === 'voice_intro' || createStep === 'voice_recording') && renderVoiceEntry()}
      {createStep === 'ai_processing' && renderRecognizing()}
      {createStep === 'ai_confirm' && renderAiConfirm()}
      {createStep === 'third_auth_setup' && renderThirdAuthSetup()}
      {createStep === 'third_auth_platform' && renderThirdAuthPlatform()}
      {createStep === 'third_auth_pulling' && renderThirdAuthPulling()}
      {createStep === 'third_auth_confirm' && renderThirdAuthConfirm()}
      {createStep === 'third_auth_success' && renderThirdAuthSuccess()}
      {createStep === 'form' && renderCreationForm()}
      {createStep === 'success' && renderSuccess()}

      {renderCategoryModal()}

      {showPhotoActionSheet && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/45">
          <div className="flex-1" onClick={() => setShowPhotoActionSheet(false)}></div>
          <div className="rounded-t-[28px] bg-white px-6 pt-4 pb-8">
            <div className="text-center text-[13px] text-[#9AA0B0]">支持jpg、jpeg、png格式，不可超过20MB</div>
            <div className="mt-4 overflow-hidden rounded-[20px] bg-[#F7F8FB]">
              <button
                onClick={() => beginRecognition('scan', 'camera')}
                className="flex h-16 w-full items-center justify-center border-b border-[#E8EBF1] text-[18px] font-medium text-[#1F2129]"
              >
                拍照
              </button>
              <button
                onClick={() => beginRecognition('scan', 'upload')}
                className="flex h-16 w-full items-center justify-center text-[18px] font-medium text-[#1F2129]"
              >
                从相册选择
              </button>
            </div>
            <button
              onClick={() => setShowPhotoActionSheet(false)}
              className="mt-3 flex h-16 w-full items-center justify-center rounded-[20px] bg-[#F7F8FB] text-[18px] font-medium text-[#1F2129]"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const InlineField = ({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="flex items-center border-b border-[#F1F3F7] py-3 last:border-b-0">
    <div className="mr-4 shrink-0 text-[14px] font-bold text-[#444B5A]">
      {required ? <span className="mr-1 text-[#FF6B6B]">*</span> : null}
      {label}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

const GeneratedProductImage = ({ name, variant = 0 }: { name: string; variant?: number }) => {
  const displayText = (name || '商品').slice(0, 2);
  const palettes = [
    'from-[#EAF8F0] to-[#D9F2E4] text-[#00A862]',
    'from-[#EEF6FF] to-[#DCEBFF] text-[#3B77F1]',
    'from-[#FFF5E8] to-[#FFE8C8] text-[#D9822B]',
  ];
  const showUploadState = variant % 2 === 1;
  const palette = palettes[(name.length + Math.floor(variant / 2)) % palettes.length];

  if (showUploadState) {
    return (
      <div className="flex h-[58px] w-[58px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D8DEEA] bg-[#F7F9FC] text-[#9AA3B3] shadow-sm">
        <ImageIcon size={18} />
      </div>
    );
  }

  return (
    <div className={`flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-gradient-to-br ${palette} text-[16px] font-black shadow-sm`}>
      {displayText}
    </div>
  );
};
