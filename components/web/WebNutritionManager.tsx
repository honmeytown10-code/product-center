import React, { useMemo, useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Beaker,
  CheckCircle2,
  CircleAlert,
  Package2,
} from 'lucide-react';

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

export const WebNutritionManager: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'configured' | 'unconfigured'>('all');
  const [selectedProductId, setSelectedProductId] = useState(MOCK_PRODUCTS[0].id);
  const [selectedSpecId, setSelectedSpecId] = useState(MOCK_PRODUCTS[0].specs[0].id);

  const filteredProducts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return MOCK_PRODUCTS.filter(product => {
      const matchedKeyword =
        !normalizedKeyword ||
        product.name.toLowerCase().includes(normalizedKeyword) ||
        product.id.toLowerCase().includes(normalizedKeyword);

      if (!matchedKeyword) return false;

      if (statusFilter === 'all') return true;

      const hasConfigured = product.specs.some(spec => spec.configured);
      return statusFilter === 'configured' ? hasConfigured : !hasConfigured;
    });
  }, [keyword, statusFilter]);

  const selectedProduct = filteredProducts.find(product => product.id === selectedProductId) ?? filteredProducts[0] ?? MOCK_PRODUCTS[0];

  const selectedSpec =
    selectedProduct.specs.find(spec => spec.id === selectedSpecId) ??
    selectedProduct.specs[0];

  const configuredMethodCount = selectedSpec.methods.filter(method => method.configured).length;
  const selectedMethod = selectedSpec.methods.find(method => method.configured) ?? selectedSpec.methods[0];

  const handleSelectProduct = (product: NutritionProduct) => {
    setSelectedProductId(product.id);
    setSelectedSpecId(product.specs[0]?.id ?? '');
  };

  return (
    <div className="flex-1 bg-[#F5F6FA] p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
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
              className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#666] transition-colors hover:bg-[#FAFAFA]"
            >
              原料库
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#666] transition-colors hover:bg-[#FAFAFA]"
            >
              <Settings size={16} className="mr-2 text-[#999]" />
              基础配置
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00A35B]"
            >
              <Plus size={16} className="mr-2" />
              添加商品
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_320px]">
          <div className="flex min-h-0 flex-col border-r border-[#EDEDED] bg-[#FCFCFD]">
            <div className="flex items-center justify-between border-b border-[#EDEDED] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[#666]">
                <span>商品列表</span>
                <span className="text-xs text-[#999]">{filteredProducts.length} 条</span>
              </div>
              <div className="flex items-center gap-1 text-[#999]">
                <button type="button" className="rounded p-1 hover:bg-white">
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[38px] text-center text-xs">1 / 15</span>
                <button type="button" className="rounded p-1 hover:bg-white">
                  <ChevronRight size={16} />
                </button>
              </div>
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
              <div>
                <div className="text-sm font-bold text-[#333]">"{selectedProduct.name}" 的商品规格</div>
                <div className="mt-1 text-xs text-[#999]">支持按规格查看营养成分配置状态，点击右侧详情继续维护。</div>
              </div>
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
                        onClick={() => setSelectedSpecId(spec.id)}
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
            <div className="flex items-center justify-between border-b border-[#EDEDED] px-5 py-4">
              <div>
                <div className="text-sm font-bold text-[#333]">营养成分（{selectedSpec.methods.length}）</div>
                <div className="mt-1 text-xs text-[#999]">按规格维度维护做法营养值，便于前台展示和商品管理。</div>
              </div>
              <button type="button" className="text-sm font-medium text-[#666] hover:text-[#333]">
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
                      <div
                        key={method.id}
                        className="flex items-center justify-between rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] px-3 py-3"
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
                      </div>
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

                <div className="rounded-xl border border-[#E9E9E9] bg-[#FFFCF5] p-4 text-xs leading-6 text-[#8A6D3B]">
                  <div className="font-medium text-[#7A5A21]">配置建议</div>
                  <div className="mt-1">
                    1. 建议优先覆盖高销量商品和 KA 客户重点商品。
                    <br />
                    2. 若商品存在多规格或多做法差异，请按规格和做法分别维护，避免前台展示偏差。
                    <br />
                    3. 配置完成后可结合商品详情页一起检查展示效果。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
