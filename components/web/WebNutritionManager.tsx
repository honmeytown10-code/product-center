import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Beaker,
  CheckCircle2,
  CircleAlert,
  Package2,
  X,
} from 'lucide-react';
import { useProducts } from '../../context';

type NutritionMethod = {
  id: string;
  name: string;
  levelTag?: string;
  configured: boolean;
  nutrientValues?: {
    energy: string;
    protein: string;
    fat: string;
    carbohydrate: string;
    sodium: string;
  };
};

type NutritionSpec = {
  id: string;
  name: string;
  skuId: string;
  mark: string;
  configured: boolean;
  methods: NutritionMethod[];
};

type NutritionProduct = {
  id: string;
  name: string;
  category: string;
  imageColor: string;
  specs: NutritionSpec[];
};

type NutritionEditor = {
  productId: string;
  specId: string;
  methodId: string;
  methodName: string;
  energy: string;
  protein: string;
  fat: string;
  carbohydrate: string;
  sodium: string;
};

const MOCK_PRODUCTS: NutritionProduct[] = [
  {
    id: '764883681966465025',
    name: '占位333',
    category: '现制饮品',
    imageColor: 'from-[#9BE15D] to-[#00E3AE]',
    specs: [
      {
        id: 'spec-1',
        name: '标准规格',
        skuId: '764883681966465025',
        mark: 'ZWB-001',
        configured: false,
        methods: [
          { id: 'm-1', name: '做法', levelTag: '分级变量', configured: false },
        ],
      },
    ],
  },
  {
    id: '1244042102445998081',
    name: '0326门店标品-1预定',
    category: '咖啡',
    imageColor: 'from-[#D7D2CC] to-[#304352]',
    specs: [
      {
        id: 'spec-2',
        name: '大杯',
        skuId: '1244042102445998081',
        mark: 'CF-XL',
        configured: true,
        methods: [
          {
            id: 'm-2',
            name: '冰',
            levelTag: '温度',
            configured: true,
            nutrientValues: {
              energy: '188 kcal',
              protein: '4.2 g',
              fat: '7.8 g',
              carbohydrate: '25.6 g',
              sodium: '68 mg',
            },
          },
          {
            id: 'm-3',
            name: '热',
            levelTag: '温度',
            configured: true,
            nutrientValues: {
              energy: '194 kcal',
              protein: '4.6 g',
              fat: '8.1 g',
              carbohydrate: '26.8 g',
              sodium: '72 mg',
            },
          },
        ],
      },
      {
        id: 'spec-3',
        name: '中杯',
        skuId: '1244042102445998082',
        mark: 'CF-M',
        configured: false,
        methods: [
          { id: 'm-4', name: '冰', levelTag: '温度', configured: false },
        ],
      },
    ],
  },
  {
    id: '1228390099775653537',
    name: '0211标品-3',
    category: '轻乳茶',
    imageColor: 'from-[#E0EAFC] to-[#CFDEF3]',
    specs: [
      {
        id: 'spec-4',
        name: '默认规格',
        skuId: '1228390099775653537',
        mark: 'MILK-01',
        configured: false,
        methods: [
          { id: 'm-5', name: '常规', configured: false },
        ],
      },
    ],
  },
  {
    id: '1228392140522553345',
    name: '0211标品-4',
    category: '奶昔',
    imageColor: 'from-[#89F7FE] to-[#66A6FF]',
    specs: [
      {
        id: 'spec-5',
        name: '默认规格',
        skuId: '1228392140522553345',
        mark: 'NX-01',
        configured: true,
        methods: [
          {
            id: 'm-6',
            name: '常规',
            configured: true,
            nutrientValues: {
              energy: '246 kcal',
              protein: '5.1 g',
              fat: '10.2 g',
              carbohydrate: '33.4 g',
              sodium: '86 mg',
            },
          },
        ],
      },
    ],
  },
];

const NUTRIENT_META = [
  { key: 'energy', label: '热量', unit: 'kcal' },
  { key: 'protein', label: '蛋白质', unit: 'g' },
  { key: 'fat', label: '脂肪', unit: 'g' },
  { key: 'carbohydrate', label: '碳水', unit: 'g' },
  { key: 'sodium', label: '钠', unit: 'mg' },
] as const;

export const WebNutritionManager: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { products: brandProducts } = useProducts();
  const [nutritionProducts, setNutritionProducts] = useState<NutritionProduct[]>(MOCK_PRODUCTS);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'configured' | 'unconfigured'>('all');
  const [selectedProductId, setSelectedProductId] = useState(MOCK_PRODUCTS[0].id);
  const [selectedSpecId, setSelectedSpecId] = useState(MOCK_PRODUCTS[0].specs[0].id);
  const [selectedMethodId, setSelectedMethodId] = useState(MOCK_PRODUCTS[0].specs[0].methods[0].id);
  const [editor, setEditor] = useState<NutritionEditor | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const filteredProducts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return nutritionProducts.filter(product => {
      const matchedKeyword =
        !normalizedKeyword ||
        product.name.toLowerCase().includes(normalizedKeyword) ||
        product.id.toLowerCase().includes(normalizedKeyword);

      if (!matchedKeyword) return false;

      if (statusFilter === 'all') return true;

      const hasConfigured = product.specs.some(spec => spec.configured);
      return statusFilter === 'configured' ? hasConfigured : !hasConfigured;
    });
  }, [keyword, nutritionProducts, statusFilter]);

  const selectedProduct = filteredProducts.find(product => product.id === selectedProductId) ?? filteredProducts[0] ?? nutritionProducts[0];

  const selectedSpec =
    selectedProduct.specs.find(spec => spec.id === selectedSpecId) ??
    selectedProduct.specs[0];

  const configuredMethodCount = selectedSpec.methods.filter(method => method.configured).length;
  const selectedMethod = selectedSpec.methods.find(method => method.id === selectedMethodId) ?? selectedSpec.methods.find(method => method.configured) ?? selectedSpec.methods[0];

  const handleSelectProduct = (product: NutritionProduct) => {
    setSelectedProductId(product.id);
    setSelectedSpecId(product.specs[0]?.id ?? '');
    setSelectedMethodId(product.specs[0]?.methods[0]?.id ?? '');
  };

  const openNutritionEditor = () => {
    if (!selectedMethod) return;
    const values = selectedMethod.nutrientValues;
    setEditor({
      productId: selectedProduct.id,
      specId: selectedSpec.id,
      methodId: selectedMethod.id,
      methodName: selectedMethod.name,
      energy: values?.energy.replace(/\s*kcal$/i, '') || '',
      protein: values?.protein.replace(/\s*g$/i, '') || '',
      fat: values?.fat.replace(/\s*g$/i, '') || '',
      carbohydrate: values?.carbohydrate.replace(/\s*g$/i, '') || '',
      sodium: values?.sodium.replace(/\s*mg$/i, '') || '',
    });
  };

  const saveNutrition = () => {
    if (!editor) return;
    const hasAnyValue = [editor.energy, editor.protein, editor.fat, editor.carbohydrate, editor.sodium].some(value => value.trim() !== '');
    setNutritionProducts(prev => prev.map(product => product.id !== editor.productId ? product : {
      ...product,
      specs: product.specs.map(spec => spec.id !== editor.specId ? spec : {
        ...spec,
        configured: hasAnyValue || spec.methods.some(method => method.id !== editor.methodId && method.configured),
        methods: spec.methods.map(method => method.id !== editor.methodId ? method : {
          ...method,
          configured: hasAnyValue,
          nutrientValues: hasAnyValue ? {
            energy: editor.energy.trim() ? `${editor.energy.trim()} kcal` : '--',
            protein: editor.protein.trim() ? `${editor.protein.trim()} g` : '--',
            fat: editor.fat.trim() ? `${editor.fat.trim()} g` : '--',
            carbohydrate: editor.carbohydrate.trim() ? `${editor.carbohydrate.trim()} g` : '--',
            sodium: editor.sodium.trim() ? `${editor.sodium.trim()} mg` : '--',
          } : undefined,
        }),
      }),
    }));
    setEditor(null);
    setMessage(hasAnyValue ? '营养成分已保存' : '已清空当前做法的营养成分');
  };

  const addSelectedProducts = () => {
    const additions = brandProducts.filter(product => pendingProductIds.includes(product.id) && !nutritionProducts.some(item => item.id === product.id)).map(product => ({
      id: product.id,
      name: product.name,
      category: product.category || '未分类',
      imageColor: 'from-[#E0EAFC] to-[#CFDEF3]',
      specs: [{ id: `spec-${product.id}`, name: '默认规格', skuId: product.skuCode, mark: product.skuCode, configured: false, methods: [{ id: `method-${product.id}`, name: '常规', configured: false }] }],
    } as NutritionProduct));
    setNutritionProducts(prev => [...prev, ...additions]);
    setShowProductSelector(false);
    setMessage(`已添加 ${additions.length} 个商品`);
  };

  return (
    <div className="pc-page flex-1 bg-[#F5F6FA] p-3">
      <div className="pc-surface flex h-full flex-col overflow-hidden bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-[#EDEDED] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索商品名称、ID"
                className="w-[220px] rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-[#333] outline-none transition-colors focus:border-[#00C06B]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'configured' | 'unconfigured')}
              className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#333] outline-none focus:border-[#00C06B]"
            >
              <option value="all">规格状态 全部</option>
              <option value="configured">规格状态 已配置</option>
              <option value="unconfigured">规格状态 未配置</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.('ingredient_library')}
              className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#666] transition-colors hover:bg-[#FAFAFA]"
            >
              原料库
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingProductIds([]);
                setShowProductSelector(true);
              }}
              className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00A35B]"
            >
              <Plus size={16} className="mr-2" />
              添加商品
            </button>
          </div>
        </div>

        {message && (
          <div className="flex items-center justify-between border-b border-[#CBEFDC] bg-[#F1FFF7] px-6 py-2 text-sm text-[#087A49]">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} className="rounded p-1 hover:bg-white/70" aria-label="关闭提示">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_320px]">
          <div className="flex min-h-0 flex-col border-r border-[#EDEDED] bg-[#FCFCFD]">
            <div className="flex items-center justify-between border-b border-[#EDEDED] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[#666]">
                <span>商品列表</span>
                <span className="text-xs text-[#999]">{filteredProducts.length} 条</span>
              </div>
              <span className="text-xs text-[#999]">全部结果</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="space-y-2">
                {filteredProducts.map(product => {
                  const isSelected = product.id === selectedProduct.id;
                  const configuredCount = product.specs.filter(spec => spec.configured).length;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? 'border-[#8BE1B2] bg-[#F0FFF7] shadow-[0_0_0_1px_rgba(0,192,107,0.15)]'
                          : 'border-transparent bg-white hover:border-[#E5E7EB] hover:bg-[#FAFBFC]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${product.imageColor}`} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-[#333]">{product.name}</div>
                          <div className="mt-1 text-xs text-[#999]">商品ID: {product.id}</div>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-[#999]">{product.category}</span>
                            <span className={configuredCount > 0 ? 'text-[#00A35B]' : 'text-[#999]'}>
                              已配置 {configuredCount}/{product.specs.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b border-[#EDEDED] px-5 py-3">
              <div className="text-sm font-bold text-[#333]">"{selectedProduct.name}" 的商品规格</div>
              <div className="text-xs text-[#999]">
                共 {selectedProduct.specs.length} 个规格
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full table-fixed border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                  <tr className="text-left text-xs font-bold text-[#666]">
                    <th className="border-b border-[#EDEDED] px-5 py-3">商品规格</th>
                    <th className="w-[180px] border-b border-[#EDEDED] px-5 py-3">SKU ID</th>
                    <th className="w-[140px] border-b border-[#EDEDED] px-5 py-3">商品标识</th>
                    <th className="w-[120px] border-b border-[#EDEDED] px-5 py-3">状态</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-sm text-[#333]">
                  {selectedProduct.specs.map(spec => {
                    const isActive = spec.id === selectedSpec.id;

                    return (
                      <tr
                        key={spec.id}
                        onClick={() => {
                          setSelectedSpecId(spec.id);
                          setSelectedMethodId(spec.methods[0]?.id ?? '');
                        }}
                        className={`cursor-pointer transition-colors ${isActive ? 'bg-[#F7FFFB]' : 'hover:bg-[#FAFBFC]'}`}
                      >
                        <td className="border-b border-[#F1F1F1] px-5 py-4 font-medium">{spec.name}</td>
                        <td className="border-b border-[#F1F1F1] px-5 py-4 text-[#666]">{spec.skuId}</td>
                        <td className="border-b border-[#F1F1F1] px-5 py-4 text-[#666]">{spec.mark}</td>
                        <td className="border-b border-[#F1F1F1] px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            spec.configured ? 'bg-[#E9FFF3] text-[#00A35B]' : 'bg-[#F5F5F5] text-[#999]'
                          }`}>
                            {spec.configured ? <CheckCircle2 size={12} /> : <CircleAlert size={12} />}
                            {spec.configured ? '已配置' : '未配置'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex min-h-0 flex-col border-l border-[#EDEDED] bg-[#FCFCFD]">
            <div className="flex items-center justify-between border-b border-[#EDEDED] px-5 py-3">
              <div className="text-sm font-bold text-[#333]">营养成分（{selectedSpec.methods.length}）</div>
              <button type="button" onClick={openNutritionEditor} className="text-sm font-medium text-[#00A35B] hover:text-[#007D46]">
                编辑
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <div className="rounded-xl border border-[#E9E9E9] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#333]">{selectedSpec.name}</div>
                      <div className="mt-1 text-xs text-[#999]">SKU ID: {selectedSpec.skuId}</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      selectedSpec.configured ? 'bg-[#E9FFF3] text-[#00A35B]' : 'bg-[#F5F5F5] text-[#999]'
                    }`}>
                      {selectedSpec.configured ? '已配置' : '未配置'}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-[#FAFAFA] px-3 py-2 text-[#666]">
                      <span className="text-[#999]">商品标识</span>
                      <div className="mt-1 font-medium text-[#333]">{selectedSpec.mark}</div>
                    </div>
                    <div className="rounded-lg bg-[#FAFAFA] px-3 py-2 text-[#666]">
                      <span className="text-[#999]">已配置做法</span>
                      <div className="mt-1 font-medium text-[#333]">{configuredMethodCount}/{selectedSpec.methods.length}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E9E9E9] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#333]">
                      <Beaker size={16} className="text-[#00C06B]" />
                      <span>做法营养值</span>
                    </div>
                    <span className="text-xs text-[#999]">支持按做法单独维护</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedSpec.methods.map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors ${
                          selectedMethod?.id === method.id
                            ? 'border-[#8BE1B2] bg-[#F0FFF7]'
                            : 'border-[#F0F0F0] bg-[#FAFAFA] hover:border-[#DADADA]'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium text-[#333]">
                            {method.name}
                            {method.levelTag && <span className="ml-1 text-[#00A35B]">({method.levelTag})</span>}
                          </div>
                          <div className="mt-1 text-xs text-[#999]">
                            {method.configured ? '已设置营养成分值，可同步用于商品详情展示。' : '未配置营养值，当前不会在商品详情页展示。'}
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${method.configured ? 'text-[#00A35B]' : 'text-[#999]'}`}>
                          {method.configured ? '已配置' : '未配置'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#E9E9E9] bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#333]">
                    <Package2 size={16} className="text-[#00C06B]" />
                    <span>基础营养值预览</span>
                  </div>

                  {selectedMethod?.configured && selectedMethod.nutrientValues ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {NUTRIENT_META.map(item => (
                        <div key={item.key} className="rounded-lg bg-[#FAFAFA] px-3 py-3">
                          <div className="text-xs text-[#999]">{item.label}</div>
                          <div className="mt-1 text-sm font-semibold text-[#333]">
                            {selectedMethod.nutrientValues[item.key]}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-dashed border-[#D8D8D8] bg-[#FAFAFA] px-4 py-6 text-center">
                      <div className="text-sm font-medium text-[#666]">当前做法尚未配置营养值</div>
                      <div className="mt-1 text-xs text-[#999]">建议先补充热量、蛋白质、脂肪、碳水和钠等核心指标。</div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {showProductSelector && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-6">
          <div className="flex max-h-[72vh] w-[620px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDEDED] px-6 py-4">
              <div>
                <div className="text-base font-bold text-[#222]">添加营养成分商品</div>
                <div className="mt-1 text-xs text-[#999]">仅展示尚未加入营养成分管理的商品</div>
              </div>
              <button type="button" onClick={() => setShowProductSelector(false)} className="rounded p-1.5 text-[#777] hover:bg-[#F5F5F5]" aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="overflow-hidden rounded-lg border border-[#E8E8E8]">
                {brandProducts.filter(product => !nutritionProducts.some(item => item.id === product.id)).map(product => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-3 border-b border-[#F0F0F0] px-4 py-3 last:border-b-0 hover:bg-[#FAFBFC]">
                    <input
                      type="checkbox"
                      checked={pendingProductIds.includes(product.id)}
                      onChange={event => setPendingProductIds(prev => event.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id))}
                      className="h-4 w-4 accent-[#00C06B]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[#333]">{product.name}</div>
                      <div className="mt-1 text-xs text-[#999]">商品ID：{product.id} · {product.category || '未分类'}</div>
                    </div>
                  </label>
                ))}
                {brandProducts.every(product => nutritionProducts.some(item => item.id === product.id)) && (
                  <div className="px-4 py-10 text-center text-sm text-[#999]">暂无可添加商品</div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#EDEDED] px-6 py-4">
              <span className="text-sm text-[#999]">已选 {pendingProductIds.length} 个</span>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowProductSelector(false)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666] hover:bg-[#FAFAFA]">取消</button>
                <button type="button" disabled={pendingProductIds.length === 0} onClick={addSelectedProducts} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white hover:bg-[#00A35B] disabled:cursor-not-allowed disabled:opacity-40">确认添加</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-6">
          <div className="w-[560px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDEDED] px-6 py-4">
              <div>
                <div className="text-base font-bold text-[#222]">编辑营养成分</div>
                <div className="mt-1 text-xs text-[#999]">{selectedProduct.name} / {selectedSpec.name} / {editor.methodName}</div>
              </div>
              <button type="button" onClick={() => setEditor(null)} className="rounded p-1.5 text-[#777] hover:bg-[#F5F5F5]" aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 px-6 py-5">
              {NUTRIENT_META.map(item => (
                <label key={item.key} className="text-sm text-[#555]">
                  <span>{item.label}</span>
                  <div className="mt-2 flex overflow-hidden rounded-lg border border-[#E5E7EB] focus-within:border-[#00C06B]">
                    <input
                      value={editor[item.key]}
                      onChange={event => {
                        const value = event.target.value;
                        if (value === '' || /^\d*(\.\d{0,2})?$/.test(value)) setEditor(current => current ? { ...current, [item.key]: value } : current);
                      }}
                      inputMode="decimal"
                      placeholder="请输入"
                      className="min-w-0 flex-1 px-3 py-2 outline-none"
                    />
                    <span className="border-l border-[#EEEEEE] bg-[#FAFAFA] px-3 py-2 text-[#999]">{item.unit}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-[#EDEDED] px-6 py-4">
              <button type="button" onClick={() => setEditor(null)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666] hover:bg-[#FAFAFA]">取消</button>
              <button type="button" onClick={saveNutrition} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white hover:bg-[#00A35B]">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
