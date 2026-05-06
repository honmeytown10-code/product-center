
import React, { useMemo, useState } from 'react';
import { 
  ArrowLeft, FileText, Scale, Sliders, Settings, Printer, 
  CupSoda, ShoppingBag, Store, Check, Plus, ImageIcon, ChevronRight, AlertTriangle, Clock3
} from 'lucide-react';
import { Category, AVAILABLE_DYNAMIC_FIELDS, DynamicFieldConfig } from '../../types';
import { Switch, SectionHeader, FormRow, ChannelSwitch } from './WebCommon';

interface WebProductFormProps {
    type: 'standard' | 'combo';
    category: Category;
    categories: Category[];
    onClose: () => void;
}

const DEFAULT_RESET_FIELD_IDS = new Set(['p_weight_flag', 'st_member']);

type PrepUnit = '分钟' | '小时' | '天';
type PrepWindow = 'same_day' | 'advance';
type PrepScope = 'spu' | 'spec';

type PrepRule = {
    duration: string;
    unit: PrepUnit;
    window: PrepWindow;
    deferNextDay: boolean;
    deferAfterTime: string;
};

type SpecPrepRuleSet = {
    specId: string;
    specName: string;
    inStock: PrepRule;
    nonStock: PrepRule;
};

const PREP_UNIT_OPTIONS: PrepUnit[] = ['分钟', '小时', '天'];

const createDefaultPrepRule = (overrides: Partial<PrepRule> = {}): PrepRule => ({
    duration: '0',
    unit: '分钟',
    window: 'same_day',
    deferNextDay: false,
    deferAfterTime: '21:00',
    ...overrides,
});

const DEFAULT_SPEC_PREP_RULES: SpecPrepRuleSet[] = [
    {
        specId: 'classic',
        specName: '8寸',
        inStock: createDefaultPrepRule({ duration: '15', unit: '分钟', window: 'same_day' }),
        nonStock: createDefaultPrepRule({ duration: '2', unit: '小时', window: 'advance', deferNextDay: true, deferAfterTime: '21:00' }),
    },
    {
        specId: 'large',
        specName: '10寸',
        inStock: createDefaultPrepRule({ duration: '25', unit: '分钟', window: 'same_day' }),
        nonStock: createDefaultPrepRule({ duration: '4', unit: '小时', window: 'advance', deferNextDay: true, deferAfterTime: '20:00' }),
    },
    {
        specId: 'gift',
        specName: '12寸',
        inStock: createDefaultPrepRule({ duration: '1', unit: '小时', window: 'same_day' }),
        nonStock: createDefaultPrepRule({ duration: '1', unit: '天', window: 'advance', deferNextDay: true, deferAfterTime: '18:00' }),
    },
];

const clonePrepRule = (rule: PrepRule): PrepRule => ({ ...rule });

const formatPrepRuleSummary = (rule: PrepRule) => {
    const duration = rule.duration || '0';
    const windowText = rule.window === 'same_day' ? '当天备货' : '提前备货';
    const deferText = rule.window === 'advance' && rule.deferNextDay ? `，${rule.deferAfterTime}后下单顺延至次日制作` : '';
    return `${duration}${rule.unit}，${windowText}${deferText}`;
};

export const WebProductForm: React.FC<WebProductFormProps> = ({ type, category, categories, onClose }) => {
    const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
    const [activeFormSection, setActiveFormSection] = useState('basic');
    const [currentCategory, setCurrentCategory] = useState(category);
    const [pendingCategory, setPendingCategory] = useState<Category | null>(null);
    const [showCategoryImpactModal, setShowCategoryImpactModal] = useState(false);
    const [prepEnabled, setPrepEnabled] = useState(true);
    const [prepScope, setPrepScope] = useState<PrepScope>('spu');
    const [splitByStockState, setSplitByStockState] = useState(false);
    const [uniformPrepRule, setUniformPrepRule] = useState<PrepRule>(() => createDefaultPrepRule({ duration: '30', unit: '分钟', window: 'same_day' }));
    const [uniformStockRules, setUniformStockRules] = useState<{ inStock: PrepRule; nonStock: PrepRule }>(() => ({
        inStock: createDefaultPrepRule({ duration: '20', unit: '分钟', window: 'same_day' }),
        nonStock: createDefaultPrepRule({ duration: '4', unit: '小时', window: 'advance', deferNextDay: true, deferAfterTime: '21:00' }),
    }));
    const [specPrepRules, setSpecPrepRules] = useState<SpecPrepRuleSet[]>(() => DEFAULT_SPEC_PREP_RULES.map(item => ({
        specId: item.specId,
        specName: item.specName,
        inStock: clonePrepRule(item.inStock),
        nonStock: clonePrepRule(item.nonStock),
    })));

    const scrollToSection = (id: string) => {
        setActiveFormSection(id);
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const currentCategoryFieldIds = useMemo(() => {
        const fields = type === 'combo' ? currentCategory.comboFields : currentCategory.standardFields;
        return fields.map(field => field.id);
    }, [currentCategory, type]);

    const visibleFieldIds = useMemo(() => new Set(currentCategoryFieldIds), [currentCategoryFieldIds]);

    const getImpactedFieldsForCategory = (targetCategory: Category) => {
        const nextFieldIds = new Set((type === 'combo' ? targetCategory.comboFields : targetCategory.standardFields).map(field => field.id));
        const removedIds = currentCategoryFieldIds.filter(id => !nextFieldIds.has(id));
        const removedFields = removedIds
            .map(id => AVAILABLE_DYNAMIC_FIELDS.find(field => field.id === id))
            .filter((field): field is DynamicFieldConfig => !!field);

        return {
            resetFields: removedFields.filter(field => DEFAULT_RESET_FIELD_IDS.has(field.id)),
            clearFields: removedFields.filter(field => !DEFAULT_RESET_FIELD_IDS.has(field.id))
        };
    };

    const impactedFields = useMemo(() => {
        if (!pendingCategory) return { resetFields: [] as DynamicFieldConfig[], clearFields: [] as DynamicFieldConfig[] };
        return getImpactedFieldsForCategory(pendingCategory);
    }, [pendingCategory, currentCategoryFieldIds, type]);


    const handleCategoryChangeRequest = (categoryId: string) => {
        const targetCategory = categories.find(item => item.id === categoryId);
        if (!targetCategory || targetCategory.id === currentCategory.id) return;
        const nextImpactedFields = getImpactedFieldsForCategory(targetCategory);
        if (nextImpactedFields.resetFields.length === 0 && nextImpactedFields.clearFields.length === 0) {
            setCurrentCategory(targetCategory);
            setPendingCategory(null);
            setShowCategoryImpactModal(false);
            return;
        }
        setPendingCategory(targetCategory);
        setShowCategoryImpactModal(true);
    };

    const confirmCategoryChange = () => {
        if (!pendingCategory) return;
        setCurrentCategory(pendingCategory);
        setPendingCategory(null);
        setShowCategoryImpactModal(false);
    };

    const cancelCategoryChange = () => {
        setPendingCategory(null);
        setShowCategoryImpactModal(false);
    };

    // Form Renderer Helper
    const renderDynamicInput = (field: DynamicFieldConfig & { isRequiredConfig: boolean }) => {
        const value = dynamicFormData[field.id] || '';
        const setValue = (v: any) => setDynamicFormData(prev => ({ ...prev, [field.id]: v }));
        
        if (field.id === 'p_cat') {
             return (
                 <div className="relative">
                     <select
                        className="q-form-select"
                        value={currentCategory.id}
                        onChange={e => handleCategoryChangeRequest(e.target.value)}
                     >
                        {categories.map(option => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                     </select>
                     <p className="text-[11px] text-gray-400 mt-2">切换类目后，不适用字段会在保存时被清空或恢复默认值。</p>
                 </div>
             );
        }

        switch (field.type) {
           case 'input': return (<div className="relative"><input className="q-form-input" placeholder={field.placeholder || `请输入${field.label}`} value={value} onChange={e => setValue(e.target.value)} />{field.id === 'p_name' && <span className="absolute right-4 top-3 text-xs text-gray-400">{value.length}/70</span>}</div>);
           case 'number': return (<div className="relative"><input type="number" className="q-form-input pl-8" placeholder="0.00" value={value} onChange={e => setValue(e.target.value)} /><span className="absolute left-3 top-3 text-gray-400">¥</span></div>);
           case 'selector': return (<select className="q-form-select" value={value} onChange={e => setValue(e.target.value)}><option value="">请选择{field.label}...</option><option value="opt1">选项一</option><option value="opt2">选项二</option></select>);
           case 'switch': return (<div className="flex items-center space-x-3"><Switch active={!!value} onClick={() => setValue(!value)}/><span className="text-sm text-gray-600">{value ? '已开启' : '已关闭'}</span></div>);
           case 'radio_group': {
               const radioVal = value || {};
               const activeRadioKey = Object.keys(radioVal)[0];
               return (
                   <div className="flex flex-col space-y-2 w-full">
                       <div className="flex flex-wrap gap-x-8 gap-y-3 items-center">
                           {(field.presetValues || []).map(opt => {
                               const isActive = activeRadioKey === opt;
                               const qty = radioVal[opt] || 1;
                               return (
                                   <div key={opt} className="flex items-center space-x-3">
                                   <label className="flex items-center space-x-2 cursor-pointer group py-1.5">
                                       <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'border-[#00C06B]' : 'border-gray-300 group-hover:border-[#00C06B]'}`}>
                                           {isActive && <div className="w-2 h-2 bg-[#00C06B] rounded-full"></div>}
                                       </div>
                                       <span className={`text-[13px] ${isActive ? 'text-[#00C06B] font-bold' : 'text-gray-600'}`}>{opt}</span>
                                       <input type="radio" className="hidden" checked={isActive} onChange={() => setValue({ [opt]: 1 })} />
                                   </label>
                                   {isActive && (
                                       <div className="flex items-center bg-white border border-gray-200 rounded text-xs font-bold animate-in slide-in-from-left-1 fade-in duration-200 shadow-sm overflow-hidden">
                                           <button onClick={(e) => { e.preventDefault(); if (qty <= 1) setValue({}); else setValue({ [opt]: qty - 1 }); }} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#00C06B] hover:bg-[#00C06B]/5 transition-colors">-</button>
                                           <span className="w-6 text-center text-[#1F2129] border-x border-gray-100 bg-gray-50/50 leading-6">{qty}</span>
                                           <button onClick={(e) => { e.preventDefault(); setValue({ [opt]: qty + 1 }); }} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#00C06B] hover:bg-[#00C06B]/5 transition-colors">+</button>
                                       </div>
                                   )}
                               </div>
                           );
                       })}
                       </div>
                   </div>
               );
           }
           case 'checkbox_group': {
               const checkVal = value || {};
               return (
                   <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-2 gap-x-6 items-center w-full">
                       {(field.presetValues || []).map(opt => {
                           const isActive = !!checkVal[opt];
                           const qty = checkVal[opt] || 1;
                           return (
                               <div key={opt} className="flex items-center space-x-3">
                                   <label className="flex items-center space-x-2 cursor-pointer group py-1.5">
                                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-[#00C06B] border-[#00C06B]' : 'border-gray-300 group-hover:border-[#00C06B]'}`}>
                                           {isActive && <Check size={12} className="text-white stroke-[3]"/>}
                                       </div>
                                       <span className={`text-[13px] ${isActive ? 'text-[#00C06B] font-bold' : 'text-gray-600'}`}>{opt}</span>
                                       <input type="checkbox" className="hidden" checked={isActive} onChange={() => {
                                           const newVal = { ...checkVal };
                                           if (isActive) delete newVal[opt];
                                           else newVal[opt] = 1;
                                           setValue(newVal);
                                       }} />
                                   </label>
                                   {isActive && (
                                       <div className="flex items-center bg-white border border-gray-200 rounded text-xs font-bold animate-in slide-in-from-left-1 fade-in duration-200 shadow-sm overflow-hidden">
                                           <button onClick={(e) => { e.preventDefault(); if (qty <= 1) { const newVal = { ...checkVal }; delete newVal[opt]; setValue(newVal); } else setValue({ ...checkVal, [opt]: qty - 1 }); }} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#00C06B] hover:bg-[#00C06B]/5 transition-colors">-</button>
                                           <span className="w-6 text-center text-[#1F2129] border-x border-gray-100 bg-gray-50/50 leading-6">{qty}</span>
                                           <button onClick={(e) => { e.preventDefault(); setValue({ ...checkVal, [opt]: qty + 1 }); }} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#00C06B] hover:bg-[#00C06B]/5 transition-colors">+</button>
                                       </div>
                                   )}
                               </div>
                           );
                       })}
                   </div>
               );
           }
           case 'tag_group': return (<div className="flex flex-wrap gap-2">{(field.presetValues || ['热门', '推荐', '新品']).map(tag => (<button key={tag} onClick={() => { const currentTags = (value as string[]) || []; if (currentTags.includes(tag)) setValue(currentTags.filter(t => t !== tag)); else setValue([...currentTags, tag]); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${(value as string[])?.includes(tag) ? 'bg-[#00C06B]/10 border-[#00C06B] text-[#00C06B]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{tag}</button>))}<button className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-gray-300 text-gray-400 hover:text-[#00C06B] hover:border-[#00C06B] transition-all flex items-center"><Plus size={12} className="mr-1"/> 自定义</button></div>);
           case 'image': return (<div className="flex items-start space-x-4"><div className="w-24 h-24 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-[#00C06B] hover:text-[#00C06B] transition-colors cursor-pointer group"><ImageIcon size={24} className="mb-1"/><span className="text-xs">添加图片</span></div><div className="text-xs text-gray-400 pt-2"><p>建议尺寸: 800x800px</p><p>支持格式: JPG, PNG</p><p>大小限制: 2MB</p></div></div>);
           case 'textarea': return (<textarea className="q-form-input min-h-[100px] py-3" placeholder={field.placeholder || "请输入..."} value={value} onChange={e => setValue(e.target.value)}></textarea>);
           case 'rich_text': return (<div className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">富文本编辑器占位</div>);
           case 'ref_selector': return (<div className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm flex justify-between items-center cursor-pointer hover:bg-white hover:border-[#00C06B] transition-all"><span>点击选择关联项</span><ChevronRight size={16}/></div>);
           default: return <div className="text-gray-400 text-xs">暂不支持该控件类型</div>;
        }
    };

    const updatePrepRuleValue = (
        updater: React.Dispatch<React.SetStateAction<PrepRule>>,
        key: keyof PrepRule,
        value: string | boolean
    ) => {
        updater(prev => ({ ...prev, [key]: value }));
    };

    const updateStockRuleValue = (
        groupUpdater: React.Dispatch<React.SetStateAction<{ inStock: PrepRule; nonStock: PrepRule }>>,
        stockKey: 'inStock' | 'nonStock',
        fieldKey: keyof PrepRule,
        value: string | boolean
    ) => {
        groupUpdater(prev => ({
            ...prev,
            [stockKey]: {
                ...prev[stockKey],
                [fieldKey]: value,
            },
        }));
    };

    const updateSpecRuleValue = (
        specId: string,
        stockKey: 'inStock' | 'nonStock',
        fieldKey: keyof PrepRule,
        value: string | boolean
    ) => {
        setSpecPrepRules(prev => prev.map(item => (
            item.specId === specId
                ? {
                    ...item,
                    [stockKey]: {
                        ...item[stockKey],
                        [fieldKey]: value,
                    },
                }
                : item
        )));
    };

    const handleRuleNumberStep = (
        currentRule: PrepRule,
        updater: React.Dispatch<React.SetStateAction<PrepRule>>,
        delta: number
    ) => {
        const current = Number(currentRule.duration || 0);
        const next = Math.max(0, current + delta);
        updater(prev => ({ ...prev, duration: String(next) }));
    };

    const handleStockRuleNumberStep = (
        rules: { inStock: PrepRule; nonStock: PrepRule },
        updater: React.Dispatch<React.SetStateAction<{ inStock: PrepRule; nonStock: PrepRule }>>,
        stockKey: 'inStock' | 'nonStock',
        delta: number
    ) => {
        const current = Number(rules[stockKey].duration || 0);
        const next = Math.max(0, current + delta);
        updateStockRuleValue(updater, stockKey, 'duration', String(next));
    };

    const handleSpecRuleNumberStep = (specId: string, stockKey: 'inStock' | 'nonStock', currentRule: PrepRule, delta: number) => {
        const current = Number(currentRule.duration || 0);
        const next = Math.max(0, current + delta);
        updateSpecRuleValue(specId, stockKey, 'duration', String(next));
    };

    const handleStockSplitChange = (nextValue: boolean) => {
        setSplitByStockState(nextValue);
        if (nextValue) {
            setUniformStockRules(prev => ({
                inStock: clonePrepRule(prev.inStock.duration ? prev.inStock : uniformPrepRule),
                nonStock: clonePrepRule(prev.nonStock.duration ? prev.nonStock : uniformPrepRule),
            }));
            setSpecPrepRules(prev => prev.map(item => ({
                ...item,
                nonStock: clonePrepRule(item.nonStock.duration ? item.nonStock : item.inStock),
            })));
            return;
        }

        setUniformPrepRule(clonePrepRule(uniformStockRules.inStock));
    };

    const renderPrepRuleEditor = (
        title: string,
        description: string,
        rule: PrepRule,
        onChange: (key: keyof PrepRule, value: string | boolean) => void,
        onStep: (delta: number) => void
    ) => (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4 shadow-sm">
            <div>
                <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-[#1F2129]">{title}</div>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-500">{formatPrepRuleSummary(rule)}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1 leading-5">{description}</div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
                <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <button
                        type="button"
                        onClick={() => onStep(-1)}
                        className="w-11 h-11 text-lg text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        -
                    </button>
                    <input
                        type="number"
                        min="0"
                        value={rule.duration}
                        onChange={e => onChange('duration', e.target.value)}
                        className="flex-1 h-11 text-center text-sm font-bold text-[#1F2129] outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => onStep(1)}
                        className="w-11 h-11 text-lg text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        +
                    </button>
                </div>
                <select
                    value={rule.unit}
                    onChange={e => onChange('unit', e.target.value)}
                    className="q-form-select h-11"
                >
                    {PREP_UNIT_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-wrap gap-3">
                {[
                    { value: 'same_day' as PrepWindow, label: '当天备货', desc: '下单后按当日节奏制作' },
                    { value: 'advance' as PrepWindow, label: '提前备货', desc: '可提前开始制作或预处理' },
                ].map(option => {
                    const active = rule.window === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange('window', option.value)}
                            className={`flex-1 min-w-[180px] rounded-xl border px-4 py-3 text-left transition-all ${active ? 'border-[#00C06B] bg-[#F0FDF4]' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                        >
                            <div className={`text-sm font-bold ${active ? 'text-[#00C06B]' : 'text-[#1F2129]'}`}>{option.label}</div>
                            <div className="text-xs text-gray-400 mt-1">{option.desc}</div>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-xl bg-[#FAFAFA] border border-gray-200 px-4 py-3">
                {rule.window === 'advance' ? (
                    <>
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="text-sm font-bold text-[#1F2129]">顺延设置</div>
                                <div className="text-xs text-gray-400 mt-1">可设置几点后的订单顺延至次日开始制作</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={rule.deferNextDay}
                                onChange={e => onChange('deferNextDay', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                            />
                        </label>
                        {rule.deferNextDay && (
                            <div className="mt-3 flex items-center gap-3">
                                <input
                                    type="time"
                                    value={rule.deferAfterTime}
                                    onChange={e => onChange('deferAfterTime', e.target.value)}
                                    className="q-form-input max-w-[180px]"
                                />
                                <span className="text-sm text-gray-500">后下单顺延至次日开始制作</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-xs text-gray-400">当天备货按下单后立即进入制作节奏，无需额外顺延设置。</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 px-8 bg-white border-b border-[#E8E8E8] flex justify-between items-center shrink-0 shadow-sm z-20">
                <div className="flex items-center">
                    <button onClick={onClose} className="mr-4 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={20} className="text-gray-600"/></button>
                    <div>
                        <h3 className="text-lg font-black text-[#1F2129]">填写商品资料</h3>
                        <p className="text-xs text-gray-400 mt-0.5">当前类目: {currentCategory.name}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm">取消</button>
                    <button onClick={onClose} className="px-6 py-2 bg-[#1F2129] text-white font-bold rounded-lg shadow-lg hover:bg-black transition-all active:scale-95 text-sm flex items-center"><Check size={16} className="mr-2"/> 完成创建</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden min-w-0">
                {/* Anchor Sidebar */}
                <div className="w-48 bg-white border-r border-[#E8E8E8] py-6 flex flex-col space-y-1 overflow-y-auto no-scrollbar shrink-0">
                    <div className="px-6 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">填写导航</div>
                    {['basic', 'spec', 'method', 'settings'].map(section => (
                        <div 
                            key={section}
                            onClick={() => scrollToSection(section)}
                            className={`px-6 py-3 text-sm font-bold cursor-pointer border-r-[3px] transition-all flex items-center ${activeFormSection === section ? 'border-[#00C06B] text-[#00C06B] bg-[#00C06B]/5' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                        >
                            {section === 'basic' && '基础与展示'}
                            {section === 'spec' && '销售/规格'}
                            {section === 'method' && '属性/做法/加料'}
                            {section === 'settings' && '其他信息'}
                        </div>
                    ))}
                </div>

                {/* Form Content */}
                <div className="flex-1 min-w-0 overflow-y-auto p-8 scroll-smooth no-scrollbar">
                    <div className="w-full min-w-0 max-w-[1600px] mx-auto pb-24 space-y-6">
                        {/* Basic & Display Section */}
                        <div id="basic" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="基础与展示信息" icon={<FileText size={20}/>} />
                            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-8 gap-y-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => (f.module === 'base' || f.module === 'display') && visibleFieldIds.has(f.id)).map(field => {
                                    const isFullWidth = ['p_rich_desc', 'p_list_desc', 'p_img', 'p_desc_tags', 'p_order_tags'].includes(field.id) || field.type === 'textarea' || field.type === 'rich_text';
                                    return (
                                        <div key={field.id} className={isFullWidth ? 'col-span-full' : 'col-span-1'}>
                                            <FormRow label={field.label} required={field.isRequired} description={field.description}>
                                                {renderDynamicInput({ ...field, isRequiredConfig: field.isRequired || false })}
                                            </FormRow>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sales & Spec Section */}
                        <div id="spec" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="销售信息" icon={<Scale size={20}/>} />
                            <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'sales' && visibleFieldIds.has(f.id)).map(field => (
                                    <div key={field.id} className={field.type === 'textarea' ? 'col-span-full' : 'col-span-1'}>
                                        <FormRow label={field.label} required={field.isRequired}>
                                            {renderDynamicInput({ ...field, isRequiredConfig: field.isRequired || false })}
                                        </FormRow>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Product Attr Section */}
                        <div id="method" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="商品属性配置" icon={<Sliders size={20}/>} />
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'product_attr' && visibleFieldIds.has(f.id)).map(field => (
                                    <FormRow key={field.id} label={field.label} required={field.isRequired}>
                                        {renderDynamicInput({ ...field, isRequiredConfig: field.isRequired || false })}
                                    </FormRow>
                                ))}
                            </div>
                        </div>

                        {/* Others Section */}
                        <div id="settings" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6 min-w-0 overflow-hidden">
                            <SectionHeader title="其他与高级设置" icon={<Settings size={20}/>} />
                            <div className="rounded-2xl border border-[#DCFCE7] bg-gradient-to-br from-[#F7FFF9] to-white p-6 space-y-5 min-w-0">
                                <div className="space-y-4">
                                    <div className="max-w-[720px]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-xl bg-[#00C06B]/10 text-[#00C06B] flex items-center justify-center">
                                                <Clock3 size={18} />
                                            </div>
                                            <div>
                                                <div className="text-base font-black text-[#1F2129]">备货时间设置</div>
                                                <div className="text-xs text-gray-400 mt-1">按商品制作方式设置下单后的备货规则，支持统一配置或按规格分别设置。</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`flex justify-end ${prepScope === 'spec' ? 'pr-4 xl:pr-6' : ''}`}>
                                        <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-3">
                                        <Switch active={prepEnabled} onClick={() => setPrepEnabled(prev => !prev)} />
                                        </div>
                                    </div>
                                </div>

                                {!prepEnabled ? (
                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-6 text-sm text-gray-400">
                                        当前商品无需预留备货时间；如需控制不同规格或不同库存状态的制作节奏，可重新开启后进行设置。
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className={`grid grid-cols-1 gap-5 w-full 2xl:grid-cols-2 ${prepScope === 'spec' ? 'pr-4 xl:pr-6' : ''}`}>
                                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                                <div className="text-sm font-bold text-[#1F2129] mb-3">配置方式</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { value: 'spu' as PrepScope, label: '统一设置', desc: '适用于各规格备货规则一致的商品' },
                                                        { value: 'spec' as PrepScope, label: '按规格设置', desc: '适用于不同规格备货规则不一致的商品' },
                                                    ].map(option => {
                                                        const active = prepScope === option.value;
                                                        return (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setPrepScope(option.value)}
                                                                className={`rounded-xl border px-4 py-4 text-left transition-all ${active ? 'border-[#00C06B] bg-[#F0FDF4]' : 'border-gray-200 hover:border-gray-300'}`}
                                                            >
                                                                <div className={`text-sm font-bold ${active ? 'text-[#00C06B]' : 'text-[#1F2129]'}`}>{option.label}</div>
                                                                <div className="text-xs text-gray-400 mt-1 leading-5">{option.desc}</div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                                <div className="text-sm font-bold text-[#1F2129] mb-3">现货状态</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { value: false, label: '不区分现货/非现货', desc: '无论是否有现货，都使用同一套规则' },
                                                        { value: true, label: '区分现货/非现货', desc: '现货与非现货分别设置备货时间' },
                                                    ].map(option => {
                                                        const active = splitByStockState === option.value;
                                                        return (
                                                            <button
                                                                key={option.label}
                                                                type="button"
                                                                onClick={() => handleStockSplitChange(option.value)}
                                                                className={`rounded-xl border px-4 py-4 text-left transition-all ${active ? 'border-[#00C06B] bg-[#F0FDF4]' : 'border-gray-200 hover:border-gray-300'}`}
                                                            >
                                                                <div className={`text-sm font-bold ${active ? 'text-[#00C06B]' : 'text-[#1F2129]'}`}>{option.label}</div>
                                                                <div className="text-xs text-gray-400 mt-1 leading-5">{option.desc}</div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {prepScope === 'spu' ? (
                                            splitByStockState ? (
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                    {renderPrepRuleEditor(
                                                        '现货规则',
                                                        '适用于有现货、可快速出餐的商品。',
                                                        uniformStockRules.inStock,
                                                        (key, value) => updateStockRuleValue(setUniformStockRules, 'inStock', key, value),
                                                        delta => handleStockRuleNumberStep(uniformStockRules, setUniformStockRules, 'inStock', delta)
                                                    )}
                                                    {renderPrepRuleEditor(
                                                        '非现货规则',
                                                        '适用于需提前生产、解冻、预加工的商品。',
                                                        uniformStockRules.nonStock,
                                                        (key, value) => updateStockRuleValue(setUniformStockRules, 'nonStock', key, value),
                                                        delta => handleStockRuleNumberStep(uniformStockRules, setUniformStockRules, 'nonStock', delta)
                                                    )}
                                                </div>
                                            ) : (
                                                renderPrepRuleEditor(
                                                    '统一备货规则',
                                                    '适用于商品下各规格使用同一套备货规则的场景。',
                                                    uniformPrepRule,
                                                    (key, value) => updatePrepRuleValue(setUniformPrepRule, key, value),
                                                    delta => handleRuleNumberStep(uniformPrepRule, setUniformPrepRule, delta)
                                                )
                                            )
                                        ) : (
                                            <div className="space-y-5">
                                                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                                                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-bold text-[#1F2129]">规格规则明细</div>
                                                        </div>
                                                        <div className="text-xs text-gray-400">如规格较多，可左右滚动查看完整内容</div>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-[980px] w-full border-collapse">
                                                            <thead className="bg-[#F7F8FA]">
                                                                <tr className="text-left text-xs font-bold text-gray-500">
                                                                    <th className="px-4 py-3 border-b border-gray-200 w-[140px]">商品规格</th>
                                                                    {splitByStockState && <th className="px-4 py-3 border-b border-gray-200 w-[100px]">库存状态</th>}
                                                                    <th className="px-4 py-3 border-b border-gray-200 w-[220px]">备货时长</th>
                                                                    <th className="px-4 py-3 border-b border-gray-200 w-[220px]">备货时段</th>
                                                                    <th className="px-4 py-3 border-b border-gray-200 min-w-[260px]">制作顺延设置</th>
                                                                </tr>
                                                            </thead>
                                                            {specPrepRules.map(specRule => (
                                                                <tbody key={specRule.specId}>
                                                                    {[
                                                                        { key: 'inStock' as const, label: '现货', rule: specRule.inStock },
                                                                        ...(splitByStockState ? [{ key: 'nonStock' as const, label: '非现货', rule: specRule.nonStock }] : []),
                                                                    ].map((item, index) => (
                                                                        <tr key={`${specRule.specId}-${item.key}`} className="align-top">
                                                                            {index === 0 && (
                                                                                <td rowSpan={splitByStockState ? 2 : 1} className="px-4 py-4 border-b border-gray-100 bg-white">
                                                                                    <div className="font-bold text-[#1F2129]">{specRule.specName}</div>
                                                                                </td>
                                                                            )}
                                                                            {splitByStockState && (
                                                                                <td className="px-4 py-4 border-b border-gray-100">
                                                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${item.key === 'inStock' ? 'bg-[#E6F8F0] text-[#00A35B]' : 'bg-[#FFF7E6] text-[#C77A00]'}`}>
                                                                                        {item.label}
                                                                                    </span>
                                                                                </td>
                                                                            )}
                                                                            <td className="px-4 py-4 border-b border-gray-100">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleSpecRuleNumberStep(specRule.specId, item.key, item.rule, -1)}
                                                                                            className="w-9 h-9 text-gray-500 hover:bg-gray-50 transition-colors"
                                                                                        >
                                                                                            -
                                                                                        </button>
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            value={item.rule.duration}
                                                                                            onChange={e => updateSpecRuleValue(specRule.specId, item.key, 'duration', e.target.value)}
                                                                                            className="w-14 h-9 text-center text-sm font-bold text-[#1F2129] outline-none border-x border-gray-100"
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleSpecRuleNumberStep(specRule.specId, item.key, item.rule, 1)}
                                                                                            className="w-9 h-9 text-gray-500 hover:bg-gray-50 transition-colors"
                                                                                        >
                                                                                            +
                                                                                        </button>
                                                                                    </div>
                                                                                    <select
                                                                                        value={item.rule.unit}
                                                                                        onChange={e => updateSpecRuleValue(specRule.specId, item.key, 'unit', e.target.value)}
                                                                                        className="q-form-select h-9 min-w-[88px]"
                                                                                    >
                                                                                        {PREP_UNIT_OPTIONS.map(option => (
                                                                                            <option key={option} value={option}>{option}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-4 border-b border-gray-100">
                                                                                <div className="flex items-center gap-4">
                                                                                    {[
                                                                                        { value: 'same_day' as PrepWindow, label: '当天备货' },
                                                                                        { value: 'advance' as PrepWindow, label: '提前备货' },
                                                                                    ].map(option => (
                                                                                        <label key={option.value} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                                                            <input
                                                                                                type="radio"
                                                                                                name={`window-${specRule.specId}-${item.key}`}
                                                                                                checked={item.rule.window === option.value}
                                                                                                onChange={() => updateSpecRuleValue(specRule.specId, item.key, 'window', option.value)}
                                                                                                className="text-[#00C06B] focus:ring-[#00C06B]"
                                                                                            />
                                                                                            <span>{option.label}</span>
                                                                                        </label>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-4 border-b border-gray-100">
                                                                                {item.rule.window === 'advance' ? (
                                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={item.rule.deferNextDay}
                                                                                            onChange={e => updateSpecRuleValue(specRule.specId, item.key, 'deferNextDay', e.target.checked)}
                                                                                            className="h-4 w-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B]"
                                                                                        />
                                                                                        <input
                                                                                            type="time"
                                                                                            value={item.rule.deferAfterTime}
                                                                                            disabled={!item.rule.deferNextDay}
                                                                                            onChange={e => updateSpecRuleValue(specRule.specId, item.key, 'deferAfterTime', e.target.value)}
                                                                                            className="q-form-input h-9 w-[126px] disabled:bg-gray-100 disabled:text-gray-400"
                                                                                        />
                                                                                        <span className="text-sm text-gray-500">后顺延至次日制作</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="text-sm text-gray-400">当天备货不支持顺延设置</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            ))}
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'others' && visibleFieldIds.has(f.id)).map(field => {
                                    const isFullWidth = field.type === 'radio_group' || field.type === 'checkbox_group' || field.type === 'textarea';
                                    return (
                                         <div key={field.id} className={isFullWidth ? 'col-span-full' : 'col-span-1'}>
                                             <div className={`rounded-xl ${isFullWidth && field.type !== 'textarea' ? 'bg-gray-50/20 border border-gray-100 p-6 shadow-sm mt-4' : 'border-transparent'}`}>
                                                 <FormRow 
                                                     key={field.id} 
                                                     label={field.label} 
                                                     required={field.isRequired}
                                                     isHorizontal={field.type === 'radio_group' || field.type === 'checkbox_group'}
                                                 >
                                                     {renderDynamicInput({ ...field, isRequiredConfig: field.isRequired || false })}
                                                 </FormRow>
                                             </div>
                                         </div>
                                     );
                                })}
                            </div>
                                
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-800 mb-4">售卖渠道配置</h4>
                                <div className="grid grid-cols-4 xl:grid-cols-5 gap-6">
                                    <ChannelSwitch label="POS收银" icon={<Printer size={16}/>} active={true} onChange={()=>{}}/>
                                    <ChannelSwitch label="小程序堂食" icon={<CupSoda size={16}/>} active={true} onChange={()=>{}}/>
                                    <ChannelSwitch label="小程序外卖" icon={<ShoppingBag size={16}/>} active={true} onChange={()=>{}}/>
                                    <ChannelSwitch label="美团外卖" icon={<Store size={16}/>} active={false} onChange={()=>{}}/>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            {showCategoryImpactModal && pendingCategory && (
                <div className="fixed inset-0 z-50 bg-[#1F2129]/40 flex items-center justify-center p-6">
                    <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-start">
                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mr-3 shrink-0">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-[#1F2129]">确认切换商品类目</h4>
                                <p className="text-sm text-gray-500 mt-1">当前类目将从“{currentCategory.name}”切换为“{pendingCategory.name}”。保存后，部分字段会被清空或恢复默认值。</p>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-5">
                            {impactedFields.resetFields.length > 0 && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="text-sm font-bold text-amber-800 mb-2">将恢复默认值的字段</div>
                                    <div className="flex flex-wrap gap-2">
                                        {impactedFields.resetFields.map(field => (
                                            <span key={field.id} className="px-3 py-1 rounded-full text-xs font-bold bg-white text-amber-700 border border-amber-200">
                                                {field.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {impactedFields.clearFields.length > 0 && (
                                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                                    <div className="text-sm font-bold text-red-700 mb-2">将清空配置的字段</div>
                                    <div className="flex flex-wrap gap-2">
                                        {impactedFields.clearFields.map(field => (
                                            <span key={field.id} className="px-3 py-1 rounded-full text-xs font-bold bg-white text-red-600 border border-red-100">
                                                {field.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {impactedFields.resetFields.length === 0 && impactedFields.clearFields.length === 0 && (
                                <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-4 text-sm text-[#166534]">
                                    新类目与当前类目字段差异较小，切换后不会产生额外字段清理。
                                </div>
                            )}
                            <div className="text-xs text-gray-400 leading-6">
                                保存后系统会按新类目保留字段；不再适用的可选配置会被清空，系统基础字段会恢复默认值，不会继续以隐藏状态生效。
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={cancelCategoryChange} className="px-5 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                                取消
                            </button>
                            <button onClick={confirmCategoryChange} className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-[#1F2129] hover:bg-black transition-colors">
                                确认切换
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.q-form-input { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 10px 12px; font-size: 13px; outline: none; transition: all 0.2s; background: white; } .q-form-input:focus { border-color: #00C06B; box-shadow: 0 0 0 3px rgba(0, 192, 107, 0.1); } .q-form-select { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 10px 12px; font-size: 13px; outline: none; transition: all 0.2s; background: white; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; }`}</style>
        </div>
    );
}
