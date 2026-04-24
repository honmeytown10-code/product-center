import React from 'react';
import { ChevronLeft, ArrowUpCircle, ArrowDownCircle, Ban, RefreshCw, Trash, FileEdit, CheckCircle2, ChevronRight, Tag, Layers, Clock, List, Edit3, Check, Trash2, Share2, Lock, Package, X, Info, Plus } from 'lucide-react';
import { ChannelType } from './types';
import { Product, TimeSalesConfig } from '../../types';

export type BatchActionType = 'on_shelf' | 'off_shelf' | 'sold_out' | 'restore_stock' | 'delete' | 'edit_attr' | null;
export type BatchStep = 'selection' | 'menu' | 'status_config' | 'attr_editor';

const ALL_CHANNELS_DEF: { id: ChannelType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: '全部渠道', icon: <Layers size={14}/>, color: 'text-gray-800' },
  { id: 'mini', label: '小程序', icon: null, color: 'text-green-600' },
  { id: 'meituan', label: '美团外卖', icon: null, color: 'text-yellow-600' },
  { id: 'taobao', label: '淘宝闪购', icon: null, color: 'text-orange-600' },
  { id: 'pos', label: 'POS收银', icon: null, color: 'text-blue-600' },
];

type BatchTimeSaleFormData = {
  mode: 'always' | 'timed';
  config: TimeSalesConfig;
};

type BatchPriceEditorData = {
  uniformPrice: string;
  specPrices: Record<string, Record<number, string>>;
};

const DEFAULT_TIME_SALES_CONFIG: TimeSalesConfig = {
  startDate: '2025年9月23日',
  endDate: '2025年10月23日',
  rules: [
    { id: '1', days: [1, 2, 3, 4, 5], times: ['00:00-23:59'] },
    { id: '2', days: [6, 7], times: ['00:00-23:59'] },
  ],
};

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const cloneTimeSalesConfig = (config?: TimeSalesConfig | null): TimeSalesConfig => (
  JSON.parse(JSON.stringify(config || DEFAULT_TIME_SALES_CONFIG))
);

const getTimeSaleDateSummary = (config: TimeSalesConfig) => {
  if (!config.startDate && !config.endDate) return '不限销售日期';
  if (config.startDate && config.endDate) return `${config.startDate}-${config.endDate}`;
  return config.startDate || config.endDate;
};

const getRuleSummary = (rule: TimeSalesConfig['rules'][number]) => {
  const days = rule.days.length > 0 ? rule.days.map(day => DAY_LABELS[day - 1]).join('、') : '未选择星期';
  const times = rule.times.length > 0 ? rule.times.join(' / ') : '未设置时段';
  return { days, times };
};

const getCompactRuleSummary = (rule: TimeSalesConfig['rules'][number]) => {
  const daySummary = rule.days.length === 7
    ? '全周'
    : rule.days.length > 0
      ? rule.days.map(day => DAY_LABELS[day - 1]).join('、')
      : '未选星期';
  const timeSummary = rule.times.length > 0 ? rule.times.join(' / ') : '未设置时间';
  return `${daySummary} ${timeSummary}`;
};

const getSpecPriceSummary = (product: Product, draftPrices?: Record<number, string>) => {
  if (!product.specs || product.specs.length === 0) return `¥${product.price}`;
  const validPrices = product.specs
    .map((spec, index) => {
      const draftPrice = draftPrices?.[index];
      const nextPrice = draftPrice !== undefined && draftPrice !== '' ? Number(draftPrice) : spec.price;
      return Number.isFinite(nextPrice) ? nextPrice : undefined;
    })
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));

  if (validPrices.length === 0) return `¥${product.price} 起`;

  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);
  return min === max ? `¥${min}` : `¥${min} - ¥${max}`;
};


const TimeSalesBatchEditor = ({
  data,
  onBack,
  onSave,
}: {
  data: TimeSalesConfig;
  onBack: () => void;
  onSave: (config: TimeSalesConfig) => void;
}) => {
  const [config, setConfig] = React.useState<TimeSalesConfig>(cloneTimeSalesConfig(data));

  const toggleDay = (ruleId: string, day: number) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(rule => {
        if (rule.id !== ruleId) return rule;
        return {
          ...rule,
          days: rule.days.includes(day) ? rule.days.filter(item => item !== day) : [...rule.days, day],
        };
      }),
    }));
  };

  const addTimeRange = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(rule => {
        if (rule.id !== ruleId || rule.times.length >= 3) return rule;
        return { ...rule, times: [...rule.times, '00:00-23:59'] };
      }),
    }));
  };

  const removeTimeRange = (ruleId: string, index: number) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(rule => {
        if (rule.id !== ruleId) return rule;
        return { ...rule, times: rule.times.filter((_, idx) => idx !== index) };
      }),
    }));
  };

  const addRule = () => {
    if (config.rules.length >= 3) return;
    setConfig(prev => ({
      ...prev,
      rules: [...prev.rules, { id: Date.now().toString(), days: [], times: ['00:00-23:59'] }],
    }));
  };

  const removeRule = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId),
    }));
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-bottom duration-300">
      <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
          <ChevronLeft size={24}/>
        </button>
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">分时段售卖</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h4 className="text-base font-black text-gray-800">销售日期</h4>
            <p className="text-[10px] text-gray-400 mt-1">日期可为空，为空表示不限制商品售卖日期</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-100">{config.startDate}</div>
            <span className="text-gray-300">-</span>
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center text-sm font-bold text-gray-700 border border-gray-100">{config.endDate}</div>
          </div>
        </div>

        {config.rules.map(rule => (
          <div key={rule.id} className="bg-white rounded-2xl p-5 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-black text-gray-800">每周销售时间</h4>
              {config.rules.length > 1 && (
                <button onClick={() => removeRule(rule.id)} className="p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={18}/>
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                const isActive = rule.days.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(rule.id, day)}
                    className={`py-2.5 rounded-lg text-xs font-bold transition-all border relative ${isActive ? 'bg-[#E6F8F0] text-[#00C06B] border-[#00C06B]' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                  >
                    {DAY_LABELS[day - 1]}
                    {isActive && <div className="absolute top-0 right-0 w-2 h-2 bg-[#00C06B] rounded-bl-sm"><Check size={8} className="text-white"/></div>}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {rule.times.map((time, index) => (
                <div key={index} className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <span className="flex-1 text-sm font-bold text-gray-700">{time}</span>
                  {rule.times.length > 1 && (
                    <button onClick={() => removeTimeRange(rule.id, index)} className="p-1 text-gray-400">
                      <Trash2 size={16}/>
                    </button>
                  )}
                </div>
              ))}
              {rule.times.length < 3 && (
                <button
                  onClick={() => addTimeRange(rule.id)}
                  className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[#00C06B] text-xs font-black flex items-center justify-center active:bg-green-50 transition-colors"
                >
                  <Plus size={14} className="mr-1"/> 添加时间段 ({rule.times.length}/3)
                </button>
              )}
            </div>
          </div>
        ))}

        {config.rules.length < 3 && (
          <button
            onClick={addRule}
            className="w-full py-4 flex items-center justify-center space-x-1 text-[#00C06B] text-sm font-black"
          >
            <Plus size={18}/>
            <span>添加销售时间 ({config.rules.length}/3)</span>
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-white border-t border-gray-100 shadow-lg">
        <button onClick={() => onSave(config)} className="w-full h-12 bg-[#00C06B] text-white rounded-xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all">
          保存
        </button>
      </div>
    </div>
  );
};

const BatchPriceEditor = ({
  products,
  data,
  onBack,
  onSave,
}: {
  products: Product[];
  data: BatchPriceEditorData;
  onBack: () => void;
  onSave: (data: BatchPriceEditorData) => void;
}) => {
  const [priceData, setPriceData] = React.useState<BatchPriceEditorData>(() => JSON.parse(JSON.stringify(data)));
  const productSpecs = products.map(product => ({
    product,
    specs: product.isMultiSpec && product.specs && product.specs.length > 0
      ? product.specs.map((spec, index) => ({ name: spec.name, price: spec.price ?? product.price, index }))
      : [{ name: '标准', price: product.price, index: 0 }],
  }));

  const updateUniformPrice = (value: string) => {
    setPriceData(prev => ({ ...prev, uniformPrice: value }));
  };

  const updateSpecPrice = (productId: string, index: number, value: string) => {
    setPriceData(prev => ({
      ...prev,
      specPrices: {
        ...prev.specPrices,
        [productId]: {
          ...(prev.specPrices[productId] || {}),
          [index]: value,
        },
      },
    }));
  };

  const applyUniformPrice = () => {
    if (priceData.uniformPrice === '') return;
    setPriceData(prev => {
      const nextSpecPrices: Record<string, Record<number, string>> = {};
      productSpecs.forEach(({ product, specs }) => {
        nextSpecPrices[product.id] = {};
        specs.forEach(spec => {
          nextSpecPrices[product.id][spec.index] = prev.uniformPrice;
        });
      });
      return { ...prev, specPrices: nextSpecPrices };
    });
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-bottom duration-300">
      <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
          <ChevronLeft size={24}/>
        </button>
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">基础价格</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start">
            <Info size={14} className="text-blue-500 mt-0.5 mr-2 shrink-0"/>
            <div className="text-[11px] leading-5 text-gray-500 font-medium">
              保存后将统一覆盖所选商品当前基础价格配置。
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-sm font-black text-[#1F2129]">统一修改价格</div>
          <div className="text-[11px] text-gray-400 mt-1 mb-4">支持将价格统一应用到所选商品全部规格</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <span className="text-lg font-bold mr-1 text-[#1F2129]">¥</span>
              <input
                type="number"
                className="w-full text-lg font-bold outline-none bg-transparent text-[#1F2129]"
                placeholder="0.00"
                value={priceData.uniformPrice}
                onChange={e => updateUniformPrice(e.target.value)}
              />
            </div>
            <button
              onClick={applyUniformPrice}
              className="px-4 py-3 rounded-xl bg-[#E6F8F0] text-[#00C06B] text-sm font-bold whitespace-nowrap"
            >
              应用到全部
            </button>
          </div>
        </div>

        {productSpecs.map(({ product, specs }) => (
          <div key={product.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="font-bold text-sm text-[#1F2129]">{product.name}</div>
            </div>
            <div className="p-4 space-y-3">
              {specs.map(spec => (
                <div key={`${product.id}-${spec.index}`} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-700 truncate">{spec.name}</div>
                    <div className="text-[11px] text-gray-400 mt-1">规格价格</div>
                  </div>
                  <div className="w-[132px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex items-center">
                    <span className="text-sm font-bold text-[#1F2129] mr-1">¥</span>
                    <input
                      type="number"
                      className="w-full bg-transparent outline-none text-sm font-bold text-[#1F2129]"
                      value={priceData.specPrices?.[product.id]?.[spec.index] ?? `${spec.price}`}
                      onChange={e => updateSpecPrice(product.id, spec.index, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-white border-t border-gray-100 shadow-lg">
        <button
          onClick={() => onSave(priceData)}
          className="w-full h-12 bg-[#00C06B] text-white rounded-xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all"
        >
          保存
        </button>
      </div>
    </div>
  );
};

const BatchCategoryEditor = ({
  options,
  selectedValues,
  onBack,
  onSave,
}: {
  options: string[];
  selectedValues: string[];
  onBack: () => void;
  onSave: (values: string[]) => void;
}) => {
  const [values, setValues] = React.useState<string[]>(selectedValues);

  const toggleValue = (value: string) => {
    setValues(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-bottom duration-300">
      <div className="h-[50px] bg-white border-b border-gray-100 flex items-center px-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
          <ChevronLeft size={24}/>
        </button>
        <span className="flex-1 text-center font-bold text-base mr-6 text-[#1F2129]">商品分类</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-32">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm font-black text-[#1F2129]">选择分类</div>
          <div className="text-[11px] text-gray-400 mt-1">支持多选，保存后将统一覆盖所选商品分类</div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-2">
            {options.map(option => {
              const active = values.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggleValue(option)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${active ? 'bg-[#E6F8F0] text-[#00C06B] border-[#00C06B]' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-white border-t border-gray-100 shadow-lg">
        <button
          onClick={() => onSave(values)}
          className="w-full h-12 bg-[#00C06B] text-white rounded-xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all"
        >
          保存
        </button>
      </div>
    </div>
  );
};


/**
 * 批量操作选择组件
 * 深度复刻企迈交互：点击操作项即刻跳转至下一步，减少点击路径
 */
export const BatchOperationSelect = ({ onBack, onSelectAction }: { onBack: () => void, onSelectAction: (action: BatchActionType) => void }) => {
    const statusActions = [
        { id: 'on_shelf', label: '批量上架', icon: <ArrowUpCircle size={28}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'off_shelf', label: '批量下架', icon: <ArrowDownCircle size={28}/>, color: 'text-gray-600', bg: 'bg-gray-100' },
        { id: 'sold_out', label: '批量沽清', icon: <Ban size={28}/>, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'restore_stock', label: '取消沽清', icon: <RefreshCw size={28}/>, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'delete', label: '删除商品', icon: <Trash size={28}/>, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black active:scale-95 transition-transform">
                    <ChevronLeft size={24}/>
                </button>
                <span className="font-bold text-base text-[#1F2129]">选择批量操作</span>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto no-scrollbar">
                {/* 状态操作区域 */}
                <div className="mb-4">
                    <div className="grid grid-cols-3 gap-3">
                        {statusActions.map(action => (
                            <div 
                              key={action.id}
                              onClick={() => onSelectAction(action.id as BatchActionType)}
                              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all cursor-pointer active:scale-95 active:bg-gray-50 aspect-square"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${action.bg} ${action.color}`}>
                                    {action.icon}
                                </div>
                                <span className="text-xs font-bold text-gray-600">{action.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 复杂信息修改卡片 */}
                <div className="mb-6">
                    <div 
                      onClick={() => onSelectAction('edit_attr')}
                      className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center transition-all cursor-pointer active:scale-95 active:bg-gray-50"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mr-4 shrink-0">
                            <FileEdit size={28}/>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">批量修改商品信息</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">支持同时修改价格、分类、售卖时间等属性</p>
                        </div>
                        <ChevronRight size={20} className="text-gray-300 ml-2" />
                    </div>
                </div>
            </div>
            
            {/* 底部填充，保持视觉平衡 */}
            <div className="h-8 bg-transparent shrink-0"></div>
        </div>
    );
};

export const BatchConfigStep = ({ 
    actionType, 
    selectedIds, 
    products, 
    onBack, 
    onConfirm, 
    isShelvesUnited 
}: { 
    actionType: BatchActionType, 
    selectedIds: Set<string>, 
    products: Product[], 
    onBack: () => void, 
    onConfirm: (data: any) => void,
    isShelvesUnited: boolean
}) => {
    const [batchEditFields, setBatchEditFields] = React.useState<string[]>([]);
    const [batchFormData, setBatchFormData] = React.useState<Record<string, any>>({});
    const [batchTargetChannels, setBatchTargetChannels] = React.useState<ChannelType[]>(['all']);
    const [showTimeSalesEditor, setShowTimeSalesEditor] = React.useState(false);
    const [showPriceEditor, setShowPriceEditor] = React.useState(false);
    const [showCategoryEditor, setShowCategoryEditor] = React.useState(false);

    const editableFieldsDef = [
        { id: 's_price', label: '基础价格', type: 'number', icon: <Tag size={14}/> },
        { id: 'p_cat', label: '商品分类', type: 'selector', icon: <Layers size={14}/> },
        { id: 'st_time', label: '售卖时间', type: 'time', icon: <Clock size={14}/> },
    ];

    const isAttributeMode = actionType === 'edit_attr';
    const selectedProducts = React.useMemo(
        () => Array.from(selectedIds).map(id => products.find(product => product.id === id)).filter(Boolean) as Product[],
        [products, selectedIds]
    );
    const categoryOptions = React.useMemo(
        () => Array.from(new Set(products.map(product => product.category).filter(Boolean))),
        [products]
    );
    const multiSpecProducts = React.useMemo(
        () => selectedProducts.filter(product => product.isMultiSpec && product.specs && product.specs.length > 0),
        [selectedProducts]
    );
    const singleSpecProducts = React.useMemo(
        () => selectedProducts.filter(product => !product.isMultiSpec || !product.specs || product.specs.length === 0),
        [selectedProducts]
    );
    const hasMultiSpecSelected = multiSpecProducts.length > 0;

    const ensurePriceDraft = () => {
        setBatchFormData(prev => {
            if (prev.s_price) return prev;
            const specPrices: Record<string, Record<number, string>> = {};
            selectedProducts.forEach(product => {
                specPrices[product.id] = {};
                if (product.isMultiSpec && product.specs && product.specs.length > 0) {
                    product.specs.forEach((spec, index) => {
                        specPrices[product.id][index] = `${spec.price ?? product.price}`;
                    });
                } else {
                    specPrices[product.id][0] = `${product.price}`;
                }
            });
            return {
                ...prev,
                s_price: {
                    uniformPrice: '',
                    specPrices,
                } as BatchPriceEditorData,
            };
        });
    };

    const ensureTimeSalesDraft = () => {
        setBatchFormData(prev => {
            if (prev.st_time) return prev;
            return {
                ...prev,
                st_time: {
                    mode: 'timed',
                    config: cloneTimeSalesConfig(),
                } as BatchTimeSaleFormData,
            };
        });
    };
    
    const toggleEditField = (id: string) => {
        if (!batchEditFields.includes(id)) {
            if (id === 's_price') ensurePriceDraft();
            if (id === 'st_time') ensureTimeSalesDraft();
        }
        setBatchEditFields(prev => {
            if (prev.includes(id)) return prev.filter(f => f !== id);
            return [...prev, id];
        });
    };

    const getActionTitle = () => {
        switch(actionType) {
            case 'on_shelf': return '批量上架';
            case 'off_shelf': return '批量下架';
            case 'sold_out': return '批量沽清';
            case 'restore_stock': return '取消沽清';
            case 'delete': return '删除商品';
            case 'edit_attr': return '修改商品信息';
            default: return '批量操作';
        }
    };

    const handleApply = () => {
        onConfirm({
            action: actionType,
            fields: batchEditFields,
            data: batchFormData,
            channels: batchTargetChannels
        });
    };

    const updateTimeSaleMode = (mode: 'always' | 'timed') => {
        setBatchFormData(prev => ({
            ...prev,
            st_time: {
                mode,
                config: ((prev.st_time as BatchTimeSaleFormData)?.config || cloneTimeSalesConfig()),
            },
        }));
    };

    const toggleCategory = (category: string) => {
        setBatchFormData(prev => {
            const currentCategories: string[] = Array.isArray(prev.p_cat) ? prev.p_cat : [];
            return {
                ...prev,
                p_cat: currentCategories.includes(category)
                    ? currentCategories.filter(item => item !== category)
                    : [...currentCategories, category],
            };
        });
    };

    const renderCategoryEditor = () => {
        const selectedCategories: string[] = Array.isArray(batchFormData.p_cat) ? batchFormData.p_cat : [];
        const previewCategories = selectedCategories.slice(0, 3);
        const hiddenCategoryCount = Math.max(selectedCategories.length - previewCategories.length, 0);

        return (
            <div className="space-y-4">
                <button
                    onClick={() => setShowCategoryEditor(true)}
                    className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm active:scale-[0.99] transition-transform"
                >
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-[#1F2129]">商品分类</div>
                            <div className="text-[11px] text-gray-400 mt-1">
                                {selectedCategories.length > 0 ? `已选择 ${selectedCategories.length} 个分类` : '选择要统一修改的商品分类'}
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 ml-3 shrink-0"/>
                    </div>
                </button>

                {selectedCategories.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {previewCategories.map(category => (
                                <span key={category} className="px-3 py-1.5 rounded-full bg-white text-[12px] font-bold text-gray-700 border border-gray-200">
                                    {category}
                                </span>
                            ))}
                        </div>
                        {hiddenCategoryCount > 0 && (
                            <div className="text-[12px] font-bold text-gray-500">另有 {hiddenCategoryCount} 个已选分类</div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderPriceEditor = () => {
        const priceData = (batchFormData.s_price as BatchPriceEditorData | undefined) || { uniformPrice: '', specPrices: {} };

        return (
            <div>
                <button
                    onClick={() => setShowPriceEditor(true)}
                    className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm active:scale-[0.99] transition-transform"
                >
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-[#1F2129]">基础价格</div>
                            <div className="text-[11px] text-gray-400 mt-1">
                                {priceData.uniformPrice ? `已设置统一价格 ¥${priceData.uniformPrice}` : `共 ${selectedProducts.length} 个商品，支持统一修改或逐规格调整`}
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 ml-3 shrink-0"/>
                    </div>
                </button>
            </div>
        );
    };

    const renderTimeSaleEditor = () => {
        const timeSaleData = (batchFormData.st_time as BatchTimeSaleFormData | undefined) || {
            mode: 'timed' as const,
            config: cloneTimeSalesConfig(),
        };
        const previewRules = timeSaleData.config.rules.slice(0, 2);
        const hiddenRuleCount = Math.max(timeSaleData.config.rules.length - previewRules.length, 0);

        return (
            <div className="space-y-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 flex items-start">
                    <Info size={14} className="text-blue-500 mt-0.5 mr-2 shrink-0"/>
                    <div className="text-[11px] leading-5 text-blue-700 font-medium">
                        保存后将统一覆盖所选商品当前售卖时间配置。
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => updateTimeSaleMode('always')}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${timeSaleData.mode === 'always' ? 'border-[#00C06B] bg-[#E6F8F0] text-[#00C06B]' : 'border-gray-200 bg-white text-gray-500'}`}
                    >
                        全时段售卖
                    </button>
                    <button
                        onClick={() => updateTimeSaleMode('timed')}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${timeSaleData.mode === 'timed' ? 'border-[#00C06B] bg-[#E6F8F0] text-[#00C06B]' : 'border-gray-200 bg-white text-gray-500'}`}
                    >
                        分时段售卖
                    </button>
                </div>

                {timeSaleData.mode === 'always' ? (
                    <div className="rounded-xl border border-gray-100 bg-white px-4 py-4">
                        <div className="text-sm font-bold text-[#1F2129]">恢复为全时段售卖</div>
                        <div className="text-[11px] text-gray-400 mt-1">保存后，所选商品将不再限制销售日期与每周销售时间。</div>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setShowTimeSalesEditor(true)}
                            className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm active:scale-[0.99] transition-transform"
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-[#1F2129]">分时段售卖</div>
                                <div className="text-sm font-bold text-gray-400 ml-3 truncate max-w-[170px]">{getTimeSaleDateSummary(timeSaleData.config)}</div>
                                <ChevronRight size={16} className="ml-3 flex-shrink-0 text-gray-300"/>
                            </div>
                        </button>

                        {previewRules.map(rule => {
                            const days = rule.days.length === 7 ? '全周' : (rule.days.length > 0 ? rule.days.map(day => DAY_LABELS[day - 1]).join('、') : '未选星期');
                            const timeText = rule.times.length > 0 ? rule.times.join(' / ') : '未设置时间';
                            return (
                                <div key={rule.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between animate-in fade-in">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[13px] font-bold text-gray-700 truncate">{days}</div>
                                        <div className="text-[11px] text-gray-400 mt-1">{timeText}</div>
                                    </div>
                                    <Clock size={16} className="text-gray-300 ml-3 shrink-0"/>
                                </div>
                            );
                        })}
                        {hiddenRuleCount > 0 && (
                            <div className="bg-gray-50 rounded-xl px-4 py-3 text-[12px] font-bold text-gray-500 text-center">
                                另有 {hiddenRuleCount} 组售卖时间规则
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };


    return (
        <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
            <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black">
                    <ChevronLeft size={24}/>
                </button>
                <span className="font-bold text-base">设置修改内容</span>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                {isAttributeMode && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-white rounded-2xl p-5 shadow-sm">
                            <h4 className="text-sm font-black text-[#1F2129] mb-3 flex items-center">
                                <List size={16} className="mr-2 text-purple-600"/> 
                                选择修改项
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {editableFieldsDef.map(f => {
                                    const active = batchEditFields.includes(f.id);
                                    return (
                                        <button 
                                          key={f.id}
                                          onClick={() => toggleEditField(f.id)}
                                          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center ${active ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            {f.icon}
                                            <span className="ml-1.5">{f.label}</span>
                                            {active && <Check size={12} className="ml-1.5"/>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {batchEditFields.length > 0 ? (
                            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                                <h4 className="text-sm font-black text-[#1F2129] mb-2 flex items-center">
                                    <Edit3 size={16} className="mr-2 text-blue-600"/> 
                                    输入新内容
                                </h4>
                                {batchEditFields.map(fieldId => {
                                    const def = editableFieldsDef.find(f => f.id === fieldId);
                                    if (!def) return null;
                                    return (
                                        <div key={fieldId} className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-in slide-in-from-top-2">
                                            <div className="flex items-center mb-2">
                                                <span className="text-gray-400 mr-2">{def.icon}</span>
                                                <span className="text-xs font-bold text-gray-500">{def.label}</span>
                                            </div>
                                            {fieldId === 's_price' ? (
                                                renderPriceEditor()
                                            ) : fieldId === 'p_cat' ? (
                                                renderCategoryEditor()
                                            ) : fieldId === 'st_time' ? (
                                                renderTimeSaleEditor()
                                            ) : def.type === 'number' ? (
                                                <div className="flex items-center">
                                                    <span className="text-lg font-bold mr-1 text-[#1F2129]">¥</span>
                                                    <input 
                                                      type="number" 
                                                      className="w-full text-lg font-bold outline-none bg-transparent text-[#1F2129]" 
                                                      placeholder="0.00"
                                                      value={batchFormData[fieldId] || ''}
                                                      onChange={e => setBatchFormData(prev => ({ ...prev, [fieldId]: e.target.value }))}
                                                    />
                                                </div>
                                            ) : (
                                                <input 
                                                  className="w-full text-sm font-bold outline-none bg-transparent text-[#1F2129] placeholder-gray-300"
                                                  placeholder={`输入新的${def.label}`}
                                                  value={batchFormData[fieldId] || ''}
                                                  onChange={e => setBatchFormData(prev => ({ ...prev, [fieldId]: e.target.value }))}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400">
                                <span className="text-xs font-bold">请先在上方选择需要修改的字段</span>
                            </div>
                        )}
                    </div>
                )}

                {!isAttributeMode && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center text-center animate-in zoom-in-95">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${actionType === 'delete' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                            {actionType === 'delete' ? <Trash2 size={32}/> : <RefreshCw size={32}/>}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">{getActionTitle()}</h3>
                        <p className="text-sm text-gray-500 mb-6">即将对 <span className="font-bold text-black mx-1">{selectedIds.size}</span> 个商品执行操作</p>
                    </div>
                )}

                {actionType !== 'delete' && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-black text-[#1F2129] mb-4 flex items-center">
                            <Share2 size={16} className="mr-2 text-orange-500"/> 
                            生效渠道
                        </h4>
                        {isShelvesUnited && !isAttributeMode ? (
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-3 flex items-center">
                                <Lock size={12} className="text-orange-500 mr-2"/>
                                <span className="text-[10px] font-bold text-orange-600">全渠道统管已开启，修改将同步至所有渠道</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(ch => {
                                    const isSelected = batchTargetChannels.includes(ch.id);
                                    return (
                                        <button 
                                          key={ch.id}
                                          onClick={() => {
                                              if (batchTargetChannels.includes(ch.id)) {
                                                  setBatchTargetChannels(prev => prev.filter(c => c !== ch.id));
                                              } else {
                                                  setBatchTargetChannels(prev => [...prev, ch.id]);
                                              }
                                          }}
                                          className={`
                                              px-3 py-2 rounded-lg border flex items-center text-xs font-bold transition-all
                                              ${isSelected ? 'bg-[#1F2129] text-white border-[#1F2129]' : 'bg-white text-gray-500 border-gray-200'}
                                              active:scale-95
                                          `}
                                        >
                                            {ch.icon}
                                            <span className="ml-1.5">{ch.label}</span>
                                            {isSelected && <Check size={12} className="ml-1.5"/>}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-black text-[#1F2129] flex items-center">
                            <Package size={16} className="mr-2 text-gray-400"/> 
                            已选商品 ({selectedIds.size})
                        </h4>
                    </div>
                    <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-1">
                        {Array.from(selectedIds).map(id => {
                            const p = products.find(prod => prod.id === id);
                            return (
                                <div key={id} className="w-14 h-14 rounded-lg bg-gray-100 shrink-0 border border-gray-200 overflow-hidden relative">
                                    <img src={p?.image} className="w-full h-full object-cover" alt="product"/>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 pb-10">
                <button 
                  onClick={handleApply}
                  disabled={isAttributeMode && batchEditFields.length === 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center
                      ${actionType === 'delete' ? 'bg-red-500 shadow-red-200' : 'bg-[#00C06B] shadow-green-100'}
                      ${isAttributeMode && batchEditFields.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400 shadow-none' : ''}
                  `}
                >
                    {actionType === 'delete' ? (
                        <><Trash2 size={18} className="mr-2"/> 确认删除</>
                    ) : (
                        <><CheckCircle2 size={18} className="mr-2"/> 确认执行</>
                    )}
                </button>
            </div>

            {showTimeSalesEditor && (
                <TimeSalesBatchEditor
                    data={((batchFormData.st_time as BatchTimeSaleFormData | undefined)?.config) || cloneTimeSalesConfig()}
                    onBack={() => setShowTimeSalesEditor(false)}
                    onSave={config => {
                        setBatchFormData(prev => ({
                            ...prev,
                            st_time: {
                                mode: 'timed',
                                config,
                            },
                        }));
                        setShowTimeSalesEditor(false);
                    }}
                />
            )}

            {showPriceEditor && (
                <BatchPriceEditor
                    products={selectedProducts}
                    data={((batchFormData.s_price as BatchPriceEditorData | undefined) || { uniformPrice: '', specPrices: {} })}
                    onBack={() => setShowPriceEditor(false)}
                    onSave={data => {
                        setBatchFormData(prev => ({
                            ...prev,
                            s_price: data,
                        }));
                        setShowPriceEditor(false);
                    }}
                />
            )}

            {showCategoryEditor && (
                <BatchCategoryEditor
                    options={categoryOptions}
                    selectedValues={Array.isArray(batchFormData.p_cat) ? batchFormData.p_cat : []}
                    onBack={() => setShowCategoryEditor(false)}
                    onSave={values => {
                        setBatchFormData(prev => ({
                            ...prev,
                            p_cat: values,
                        }));
                        setShowCategoryEditor(false);
                    }}
                />
            )}
        </div>
    );
};

export const BatchActionMenu = ({ 
    selectedCount, 
    onClose, 
    onSelectAction 
}: { 
    selectedCount: number, 
    onClose: () => void, 
    onSelectAction: (action: BatchActionType) => void 
}) => (
    <div className="absolute inset-0 z-50 bg-black/50 flex flex-col justify-end animate-in fade-in">
        <div className="flex-1" onClick={onClose}></div>
        <div className="bg-white rounded-t-[24px] p-6 animate-in slide-in-from-bottom pb-10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-900">批量操作 ({selectedCount})</h3>
                <button onClick={onClose} className="bg-gray-100 p-1.5 rounded-full"><X size={16} className="text-gray-500"/></button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-2">
                 <div onClick={() => onSelectAction('on_shelf')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ArrowUpCircle size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">上架</span>
                 </div>
                 <div onClick={() => onSelectAction('off_shelf')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center"><ArrowDownCircle size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">下架</span>
                 </div>
                 <div onClick={() => onSelectAction('sold_out')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><Ban size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">沽清</span>
                 </div>
                 <div onClick={() => onSelectAction('edit_attr')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><Edit3 size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">改信息</span>
                 </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
                 <div onClick={() => onSelectAction('delete')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><Trash2 size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">删除</span>
                 </div>
            </div>
        </div>
    </div>
);
