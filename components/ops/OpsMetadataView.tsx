
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Database, Search, Plus, Layout, Trash2, Edit, Save, Hash, Type as TypeIcon, ToggleRight, MousePointer, Tag, ImageIcon, AlignLeft, Check, ListTree, Box, Store, ChevronDown, X, Globe, Sliders, Info, AlertTriangle, ExternalLink, CheckCircle2, ChevronUp } from 'lucide-react';
import { AVAILABLE_DYNAMIC_FIELDS, FieldModule, DynamicFieldConfig, ControlType, MOCK_BRANDS } from '../../types';
import { Switch } from './OpsCommon';

const productModules: { id: FieldModule; label: string; icon: React.ReactNode }[] = [
    { id: 'base', label: '基础属性', icon: null },
    { id: 'product_attr', label: '商品属性', icon: null },
    { id: 'sales', label: '销售信息', icon: null },
    { id: 'display', label: '展示信息', icon: null },
    { id: 'others', label: '其他信息', icon: null }
];

const controlTypes: { id: ControlType; label: string; icon: React.ReactNode }[] = [
    { id: 'input', label: '单行文本', icon: <TypeIcon size={14}/> },
    { id: 'number', label: '数字输入', icon: <Hash size={14}/> },
    { id: 'switch', label: '开关控制', icon: <ToggleRight size={14}/> },
    { id: 'selector', label: '下拉选择', icon: <MousePointer size={14}/> },
    { id: 'tag_group', label: '标签组', icon: <Tag size={14}/> },
    { id: 'image', label: '图片上传', icon: <ImageIcon size={14}/> },
    { id: 'textarea', label: '多行文本', icon: <AlignLeft size={14}/> },
];

const METADATA_CATEGORIES = [
  { id: 'cat_s1', name: '通用菜品', classification: 'standard' },
  { id: 'cat_s2', name: '现制饮品', classification: 'standard' },
  { id: 'cat_s3', name: '称重商品', classification: 'standard' },
  { id: 'cat_s4', name: '蛋糕/烘焙', classification: 'standard' },
  { id: 'cat_s5', name: '零售商品', classification: 'standard' },
  { id: 'cat_c1', name: '通用套餐', classification: 'combo' },
  { id: 'cat_c5', name: '火锅锅底', classification: 'combo' },
];

// Helper Component for Multi-Select Box
const MultiSelectBox = ({ 
    options, 
    selectedIds, 
    onChange, 
    placeholder = "点击选择..." 
}: { 
    options: { id: string, name: string }[], 
    selectedIds: string[], 
    onChange: (ids: string[]) => void,
    placeholder?: string
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(item => item !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectedItems = options.filter(opt => selectedIds.includes(opt.id));

    return (
        <div className="relative" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full min-h-[56px] bg-white border rounded-xl p-3 flex flex-wrap gap-2 cursor-pointer transition-all ${isOpen ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-gray-200 hover:border-gray-300'}`}
            >
                {selectedItems.length > 0 ? (
                    selectedItems.map(item => (
                        <span key={item.id} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold border border-orange-100">
                            {item.name}
                            <div 
                                onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                                className="ml-1.5 hover:bg-orange-200 rounded-full p-0.5 cursor-pointer transition-colors"
                            >
                                <X size={10} />
                            </div>
                        </span>
                    ))
                ) : (
                    <span className="text-sm text-gray-400 self-center pl-1">{placeholder}</span>
                )}
                <div className="ml-auto self-center text-gray-400">
                    {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
                        {options.map(opt => {
                            const isSelected = selectedIds.includes(opt.id);
                            return (
                                <div 
                                    key={opt.id}
                                    onClick={() => toggleSelection(opt.id)}
                                    className={`
                                        px-3 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-between
                                        ${isSelected ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'}
                                    `}
                                >
                                    <span>{opt.name}</span>
                                    {isSelected && <Check size={12} strokeWidth={3}/>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for Mode Selection
const ApplyModeSelector = ({ activeMode, onChange, allLabel, partialLabel }: { activeMode: 'all' | 'partial', onChange: (m: 'all' | 'partial') => void, allLabel: string, partialLabel: string }) => (
    <div className="flex items-center space-x-3 mb-2">
        <div 
            onClick={() => onChange('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border flex items-center ${activeMode === 'all' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
        >
            {activeMode === 'all' && <Check size={12} className="mr-1.5" strokeWidth={3}/>}
            {allLabel}
        </div>
        <div 
            onClick={() => onChange('partial')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border flex items-center ${activeMode === 'partial' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
        >
            {activeMode === 'partial' && <Check size={12} className="mr-1.5" strokeWidth={3}/>}
            {partialLabel}
        </div>
    </div>
);

export const OpsMetadataView: React.FC = () => {
  const [allFields, setAllFields] = useState<DynamicFieldConfig[]>(AVAILABLE_DYNAMIC_FIELDS);
  const [metadataSearch, setMetadataSearch] = useState('');
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [filterModule, setFilterModule] = useState<FieldModule | 'all'>('all');
  
  // 增强后的编辑状态，适配图2需求
  const [editingField, setEditingField] = useState<any>({
    label: '', id: '', module: 'base', type: 'input', description: '', presetValues: [],
    applyToTypes: ['standard', 'combo'], applyToCategories: [], applyToBrands: [],
    isRequired: false, sortOrder: 0, isHidden: false, placeholder: '',
    isDefaultField: false, entity: 'Product', parentAttr: 'Root', descInfo: ''
  });
  
  // New State for handling All vs Partial selection mode
  const [categoryMode, setCategoryMode] = useState<'all' | 'partial'>('all');
  const [brandMode, setBrandMode] = useState<'all' | 'partial'>('all');

  const filteredMetadata = useMemo(() => {
    return allFields.filter(f => {
      const matchSearch = f.label.toLowerCase().includes(metadataSearch.toLowerCase()) || 
                          f.id.toLowerCase().includes(metadataSearch.toLowerCase());
      const matchModule = filterModule === 'all' || f.module === filterModule;
      return matchSearch && matchModule;
    });
  }, [allFields, metadataSearch, filterModule]);

  const handleOpenEdit = (field: DynamicFieldConfig) => {
    // Initialize modes based on existing data
    const hasCategories = field.applyToCategories && field.applyToCategories.length > 0;
    const hasBrands = field.applyToBrands && field.applyToBrands.length > 0;

    setCategoryMode(hasCategories ? 'partial' : 'all');
    setBrandMode(hasBrands ? 'partial' : 'all');

    setEditingField({
      ...field,
      applyToTypes: field.applyToTypes || ['standard', 'combo'],
      applyToCategories: field.applyToCategories || [],
      applyToBrands: field.applyToBrands || [],
      isRequired: field.isRequired || false,
      sortOrder: field.sortOrder || 0,
      isHidden: field.isHidden || false,
      placeholder: field.placeholder || '',
      isDefaultField: field.isSystem || false,
      entity: 'Product',
      parentAttr: 'Root',
      descInfo: ''
    });
    setShowFieldModal(true);
  };

  const handleOpenCreate = () => {
    setCategoryMode('all');
    setBrandMode('all');
    
    setEditingField({ 
      label: '', id: '', module: 'base', type: 'input', description: '', presetValues: [],
      applyToTypes: ['standard', 'combo'], applyToCategories: [], applyToBrands: [],
      isRequired: false, sortOrder: 0, isHidden: false, placeholder: '',
      isDefaultField: false, entity: 'Product', parentAttr: 'Root', descInfo: ''
    });
    setShowFieldModal(true);
  };

  const handleSaveField = () => {
    if (!editingField.label || !editingField.id) return;
    
    // Clear arrays if mode is 'all'
    const finalFieldData = {
        ...editingField,
        applyToCategories: categoryMode === 'all' ? [] : editingField.applyToCategories,
        applyToBrands: brandMode === 'all' ? [] : editingField.applyToBrands,
        isSystem: editingField.isDefaultField
    } as DynamicFieldConfig;

    setAllFields(prev => {
      const existingIndex = prev.findIndex(f => f.id === finalFieldData.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...finalFieldData, isBase: prev[existingIndex].isBase };
        return next;
      } else {
        return [...prev, { ...finalFieldData, isBase: false }];
      }
    });
    setShowFieldModal(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
        <header className="px-10 py-6 border-b bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
        <div>
            <h2 className="text-xl font-black text-[#1F2129]">元数据资产 center</h2>
            <p className="text-xs text-gray-400 mt-1 font-bold">定义全系统通用的字段资产，支持不同业态商家的经营所需。</p>
        </div>
        <div className="flex items-center space-x-4">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-300"/>
                <input 
                value={metadataSearch}
                onChange={(e) => setMetadataSearch(e.target.value)}
                placeholder="搜索字段名称或ID..." 
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-orange-500 transition-all w-60 font-bold"
                />
            </div>
            <button onClick={handleOpenCreate} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-black shadow-lg hover:bg-orange-600 transition-all flex items-center active:scale-95">
                <Plus size={16} className="mr-2"/> 定义新资产
            </button>
        </div>
        </header>

        <div className="flex-1 flex overflow-hidden bg-[#F8FAFB]">
        <div className="w-56 bg-white border-r p-6 space-y-2 shrink-0 overflow-y-auto no-scrollbar">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">资产归口分类</div>
            <button onClick={() => setFilterModule('all')} className={`w-full flex items-center px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${filterModule === 'all' ? 'bg-[#1F2129] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Layout size={16} className="mr-3 opacity-60"/> 全部资产
            </button>
            {productModules.map(m => (
                <button key={m.id} onClick={() => setFilterModule(m.id)} className={`w-full flex items-center px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${filterModule === m.id ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <span className="mr-3 opacity-60">{m.icon}</span> {m.label}
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMetadata.map(field => (
                <div key={field.id} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col h-48 group hover:shadow-xl transition-all relative">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 rounded-xl bg-gray-100 text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                            {controlTypes.find(t => t.id === field.type)?.icon || <Hash size={18}/>}
                        </div>
                    </div>
                    <h4 className="font-black text-gray-800 mb-1 flex items-center">{field.label}</h4>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter truncate">{field.id}</p>
                    {field.description ? (
                        <p className="text-[11px] text-gray-400 mt-2 line-clamp-1 italic">{field.description}</p>
                    ) : (
                        <p className="text-[11px] text-gray-300 mt-2 italic opacity-50">暂无描述定义</p>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {controlTypes.find(t => t.id === field.type)?.label}
                        </div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!field.isBase && (
                            <button onClick={() => setAllFields(prev => prev.filter(f => f.id !== field.id))} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"><Trash2 size={14}/></button>
                            )}
                            <button onClick={() => handleOpenEdit(field)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all rounded-lg"><Edit size={14}/></button>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
        </div>

        {/* Modal for Edit/Create - 深度复刻图2 */}
        {showFieldModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1F2129]/60 backdrop-blur-md animate-in fade-in duration-200 p-10">
            <div className="bg-white rounded-[40px] shadow-2xl w-[1000px] h-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-inner"><Database size={28}/></div>
                        <div>
                        <h3 className="text-2xl font-black text-[#1F2129] tracking-tight">{allFields.find(f => f.id === editingField.id) ? '完善元数据配置' : '定义新元数据'}</h3>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Metadata Configuration</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => setShowFieldModal(false)} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-all active:scale-95">取消</button>
                        <button onClick={handleSaveField} className="px-10 py-3 bg-[#1F2129] text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center"><Save size={18} className="mr-2"/> 保存配置</button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto bg-[#F8FAFB] p-10 space-y-12 no-scrollbar">
                    
                    {/* 1. 基础信息 */}
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-full"></div>
                        <div className="mb-6 flex items-baseline">
                           <h4 className="text-xl font-black text-[#1F2129]">基础信息</h4>
                           <span className="text-xs font-bold text-gray-300 ml-3 uppercase tracking-widest">Basic Info</span>
                        </div>
                        
                        <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm space-y-8">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <FormInput label="数据名称" required value={editingField.label} onChange={v => setEditingField({...editingField, label: v})} placeholder="请输入" />
                                <FormInput label="字段" required value={editingField.id} onChange={v => setEditingField({...editingField, id: v})} placeholder="建议输入全英文" helpText="建议输入全英文" />
                                
                                <FormSelect label="模块" required value={editingField.module} onChange={v => setEditingField({...editingField, module: v})} options={productModules.map(m=>({label: m.label, value: m.id}))} />
                                <FormSelect label="实体" required value={editingField.entity} onChange={v => setEditingField({...editingField, entity: v})} options={[{label:'商品(Product)', value:'Product'}]} actionLabel="新增实体" />
                                <FormSelect label="父属性" required value={editingField.parentAttr} onChange={v => setEditingField({...editingField, parentAttr: v})} options={[{label:'根属性(Root)', value:'Root'}]} actionLabel="新增父属性" />
                                
                                <div className="col-span-full">
                                    <FormInput label="数据描述" required value={editingField.description} onChange={v => setEditingField({...editingField, description: v})} placeholder="请输入" />
                                </div>

                                <FormSelect label="组件类型" required value={editingField.type} onChange={v => setEditingField({...editingField, type: v})} options={controlTypes.map(t=>({label: t.label, value: t.id}))} />
                            </div>
                        </div>
                    </div>

                    {/* 2. 业务设置 */}
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-full"></div>
                        <div className="mb-6 flex items-baseline">
                           <h4 className="text-xl font-black text-[#1F2129]">业务设置</h4>
                           <span className="text-xs font-bold text-gray-300 ml-3 uppercase tracking-widest">Business Config</span>
                        </div>
                        <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm space-y-10 border-blue-200 ring-4 ring-blue-50/50">
                            
                            {/* System Built-in */}
                            <div className="flex flex-col space-y-4">
                                <label className="text-[13px] font-black text-gray-700 flex items-center">
                                    <span className="text-red-500 mr-1">*</span> 系统内置
                                </label>
                                <div className="flex items-center space-x-3">
                                    <div 
                                        onClick={() => setEditingField({...editingField, isDefaultField: true})}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border flex items-center ${editingField.isDefaultField ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {editingField.isDefaultField && <Check size={12} className="mr-1.5" strokeWidth={3}/>}
                                        是
                                    </div>
                                    <div 
                                        onClick={() => setEditingField({...editingField, isDefaultField: false})}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border flex items-center ${!editingField.isDefaultField ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {!editingField.isDefaultField && <Check size={12} className="mr-1.5" strokeWidth={3}/>}
                                        否
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-gray-400 mt-1">开启后，新建类目时该字段将自动作为必选内置字段</p>
                            </div>

                            {/* Applicable Categories */}
                            <div className="flex flex-col space-y-4">
                                <label className="text-[13px] font-black text-gray-700 flex items-center">
                                    <span className="text-red-500 mr-1">*</span> 适用类目
                                </label>
                                <ApplyModeSelector 
                                    activeMode={categoryMode} 
                                    onChange={setCategoryMode} 
                                    allLabel="所有类目可用" 
                                    partialLabel="部分类目可用"
                                />
                                {categoryMode === 'partial' && (
                                    <div className="animate-in slide-in-from-top-2 fade-in">
                                        <MultiSelectBox 
                                            options={METADATA_CATEGORIES}
                                            selectedIds={editingField.applyToCategories || []}
                                            onChange={(ids) => setEditingField({...editingField, applyToCategories: ids})}
                                            placeholder="请选择适用类目"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Applicable Brands */}
                            <div className="flex flex-col space-y-4">
                                <label className="text-[13px] font-black text-gray-700 flex items-center">
                                    <span className="text-red-500 mr-1">*</span> 适用品牌
                                </label>
                                <ApplyModeSelector 
                                    activeMode={brandMode} 
                                    onChange={setBrandMode} 
                                    allLabel="所有品牌可用" 
                                    partialLabel="部分品牌可用"
                                />
                                {brandMode === 'partial' && (
                                    <div className="animate-in slide-in-from-top-2 fade-in">
                                        <MultiSelectBox 
                                            options={MOCK_BRANDS}
                                            selectedIds={editingField.applyToBrands || []}
                                            onChange={(ids) => setEditingField({...editingField, applyToBrands: ids})}
                                            placeholder="请选择适用品牌"
                                        />
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* 3. 组件设置 */}
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-full"></div>
                        <div className="mb-6 flex items-baseline">
                           <h4 className="text-xl font-black text-[#1F2129]">组件设置</h4>
                           <span className="text-xs font-bold text-gray-300 ml-3 uppercase tracking-widest">Component Config</span>
                        </div>
                        <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm space-y-8">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <div className="col-span-full">
                                    <FormInput label="展示顺序" value={editingField.sortOrder} onChange={v => setEditingField({...editingField, sortOrder: Number(v)})} type="number" placeholder="0" />
                                </div>
                                <div className="flex flex-col space-y-4">
                                    <label className="text-[13px] font-black text-gray-700">标签组</label>
                                    <div className="bg-gray-50 border border-gray-100 h-14 rounded-xl flex items-center px-4 text-sm font-bold text-gray-400">
                                        暂无标签
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-4">
                                    <label className="text-[13px] font-black text-gray-700">数字输入</label>
                                    <div className="bg-gray-50 border border-gray-100 h-14 rounded-xl flex items-center px-4 text-sm font-bold text-gray-400">
                                        默认配置
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            </div>
        )}
    </div>
  );
};

const FormInput = ({ label, required, value, onChange, placeholder, helpText, type = 'text' }: any) => (
    <div className="flex flex-col space-y-3">
        <label className="text-[13px] font-black text-gray-700 flex items-center">
            {required && <span className="text-red-500 mr-1">*</span>}{label}
        </label>
        <input 
            type={type}
            value={value} 
            onChange={e => onChange(e.target.value)} 
            placeholder={placeholder}
            className="w-full h-14 px-5 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
        />
        {helpText && <p className="text-[11px] font-bold text-gray-400 pl-1">{helpText}</p>}
    </div>
);

const FormSelect = ({ label, required, value, onChange, options, actionLabel }: any) => (
    <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-center">
            <label className="text-[13px] font-black text-gray-700 flex items-center">
                {required && <span className="text-red-500 mr-1">*</span>}{label}
            </label>
            {actionLabel && <button className="text-[11px] font-bold text-blue-500 hover:text-blue-600 flex items-center"><Plus size={12} className="mr-1"/>{actionLabel}</button>}
        </div>
        <div className="relative">
            <select 
                value={value} 
                onChange={e => onChange(e.target.value)}
                className="w-full h-14 px-5 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm appearance-none cursor-pointer"
            >
                {options.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <ChevronDown size={16} className="absolute right-5 top-5 text-gray-400 pointer-events-none"/>
        </div>
    </div>
);
