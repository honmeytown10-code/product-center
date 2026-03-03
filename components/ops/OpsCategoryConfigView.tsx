import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, ChevronDown, Save, Check, LayoutList, GripVertical, 
  Trash2, X, Layers, ListTree, 
  Type as TypeIcon, Hash, ToggleRight, MousePointer, 
  Tag, ImageIcon, AlignLeft, Edit3, Lock,
  Info, ChevronRight, Globe, Store, AlertCircle, Search, MoreHorizontal
} from 'lucide-react';
import { AVAILABLE_DYNAMIC_FIELDS, FieldModule, CategoryFieldConfig, ControlType, MOCK_BRANDS, DynamicFieldConfig } from '../../types';
import { Switch } from './OpsCommon';

interface OpsCategory {
  id: string;
  name: string;
  classification: 'standard' | 'combo';
  fields: CategoryFieldConfig[];
  productCount: number;
  source: 'system' | 'custom';
  applicableBrands: string[] | 'all';
  industryDefaults: string[];
  status: 'active' | 'disabled';
  icon?: string;
}

const INDUSTRY_OPTIONS = ['饮品', '小吃快餐', '中式正餐', '异国料理', '火锅', '地方菜系', '烘焙甜品', '零售'];

// 初始系统字段生成逻辑
const generateInitialFields = (type: 'standard' | 'combo') => {
    const fields: CategoryFieldConfig[] = [];
    AVAILABLE_DYNAMIC_FIELDS.filter(f => f.isSystem && !f.id.includes('_spec_') && !f.id.includes('_method_')).forEach(f => {
        fields.push({ id: f.id, isRequired: true });
    });
    if (type === 'combo') {
        fields.push({ id: 'c_groups', isRequired: true });
    }
    return fields;
};

const INITIAL_OPS_CATEGORIES: OpsCategory[] = [
  { id: 'cat_s1', name: '通用菜品', classification: 'standard', fields: generateInitialFields('standard'), productCount: 120, source: 'system', applicableBrands: 'all', industryDefaults: ['中式正餐', '地方菜系'], status: 'active' },
  { id: 'cat_s2', name: '现制饮品', classification: 'standard', fields: [...generateInitialFields('standard'), {id: 'm_methods', isRequired: true, childConfigs: {'m_method_name': true, 'm_method_markup': true}}], productCount: 45, source: 'system', applicableBrands: 'all', industryDefaults: ['饮品'], status: 'active' },
  { id: 'cat_s3', name: '称重商品', classification: 'standard', fields: generateInitialFields('standard'), productCount: 15, source: 'system', applicableBrands: 'all', industryDefaults: [], status: 'active' },
  { id: 'cat_s4', name: '蛋糕/烘焙', classification: 'standard', fields: generateInitialFields('standard'), productCount: 30, source: 'system', applicableBrands: 'all', industryDefaults: ['烘焙甜品'], status: 'active' },
  { id: 'cat_s5', name: '零售商品', classification: 'standard', fields: generateInitialFields('standard'), productCount: 80, source: 'system', applicableBrands: 'all', industryDefaults: ['零售'], status: 'active' },
];

const productModules: { id: FieldModule; label: string; icon: React.ReactNode }[] = [
    { id: 'base', label: '基础属性', icon: null },
    { id: 'product_attr', label: '商品属性', icon: null },
    { id: 'sales', label: '销售信息', icon: null },
    { id: 'display', label: '展示信息', icon: null },
    { id: 'others', label: '其他信息', icon: null }
];

const controlTypes: { id: ControlType; label: string; icon: React.ReactNode }[] = [
    { id: 'input', label: '文本', icon: <TypeIcon size={12}/> },
    { id: 'number', label: '数字', icon: <Hash size={12}/> },
    { id: 'switch', label: '开关', icon: <ToggleRight size={12}/> },
    { id: 'selector', label: '选项', icon: <MousePointer size={12}/> },
    { id: 'tag_group', label: '标签', icon: <Tag size={12}/> },
    { id: 'image', label: '图片', icon: <ImageIcon size={12}/> },
    { id: 'textarea', label: '多行', icon: <AlignLeft size={12}/> },
    { id: 'rich_text', label: '富文本', icon: <AlignLeft size={12}/> },
    { id: 'ref_selector', label: '关联', icon: <MousePointer size={12}/> },
];

// Helper Component: MultiSelectDropdown with Portal
const MultiSelectDropdown = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "请选择",
    disabledOptions = [] 
}: { 
    options: { label: string, value: string }[], 
    value: string[], 
    onChange: (val: string[]) => void,
    placeholder?: string,
    disabledOptions?: string[]
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // Check if click is inside the portal content (which is not a child of containerRef in DOM)
            }
        };
        // Simple close on scroll to prevent detached UI
        const handleScroll = () => { if(isOpen) setIsOpen(false); };
        
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen]);

    // Handle clicking outside the dropdown menu
    useEffect(() => {
        if (!isOpen) return;
        const closeMenu = (e: MouseEvent) => {
            if (containerRef.current && containerRef.current.contains(e.target as Node)) return;
            const menuEl = document.getElementById('multiselect-menu');
            if (menuEl && menuEl.contains(e.target as Node)) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', closeMenu);
        return () => document.removeEventListener('mousedown', closeMenu);
    }, [isOpen]);

    const toggleOpen = () => {
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    const toggleOption = (val: string) => {
        if (disabledOptions.includes(val)) return;
        const newValue = value.includes(val)
            ? value.filter(v => v !== val)
            : [...value, val];
        onChange(newValue);
    };

    const selectedLabels = options.filter(o => value.includes(o.value)).map(o => o.label);
    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchText.toLowerCase()));

    return (
        <div className="relative" ref={containerRef}>
            <div 
                onClick={toggleOpen}
                className={`min-h-[44px] px-3 py-2 bg-white border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : ''}`}
            >
                <div className="flex flex-wrap gap-2">
                    {selectedLabels.length > 0 ? (
                        selectedLabels.map(label => (
                            <span key={label} className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md text-xs font-bold text-blue-700 flex items-center">
                                {label}
                                <div 
                                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5 cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); toggleOption(options.find(o => o.label === label)?.value || ''); }}
                                >
                                    <X size={10} />
                                </div>
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-gray-400 font-medium ml-1">{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-gray-400 shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isOpen && createPortal(
                <div 
                    id="multiselect-menu"
                    className="fixed z-[9999] bg-white border border-gray-100 rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
                    style={{ 
                        top: position.top, 
                        left: position.left, 
                        width: position.width,
                        maxHeight: '300px'
                    }}
                >
                    <div className="p-2 border-b border-gray-50 bg-gray-50/80 backdrop-blur-sm">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>
                            <input 
                                autoFocus
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 transition-all" 
                                placeholder="搜索..." 
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto p-2 no-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => {
                            const isDisabled = disabledOptions.includes(opt.value);
                            const isSelected = value.includes(opt.value);
                            return (
                                <div 
                                    key={opt.value}
                                    onClick={() => toggleOption(opt.value)}
                                    className={`
                                        flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-colors
                                        ${isDisabled ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50 text-gray-700'}
                                        ${isSelected ? 'bg-blue-50 text-blue-600' : ''}
                                    `}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={14} />}
                                    {isDisabled && !isSelected && <span className="text-[10px] text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded">已关联</span>}
                                </div>
                            );
                        }) : (
                            <div className="py-4 text-center text-xs text-gray-400">无匹配结果</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// Optimized Category Status Toggle
const CategoryStatusSwitch = ({ active, onClick }: { active: boolean; onClick: (e: React.MouseEvent) => void }) => (
    <div 
        onClick={onClick}
        className={`
            relative w-11 h-6 transition-all rounded-full cursor-pointer flex items-center border border-transparent shadow-sm
            ${active ? 'bg-[#00C06B]' : 'bg-gray-200 hover:bg-gray-300'}
        `}
        title={active ? "当前已启用，点击禁用" : "当前已禁用，点击启用"}
    >
        <div className={`
            absolute w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
            ${active ? 'translate-x-[24px]' : 'translate-x-[4px]'}
        `}></div>
    </div>
);

// Smaller Switch for list items (Used in other parts, keeping for compatibility if needed, but updating style)
const SmallSwitch: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
   <div onClick={onClick} className={`w-8 h-4.5 rounded-full relative cursor-pointer transition-all ${active ? 'bg-[#00C06B]' : 'bg-gray-300'}`}>
      <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all duration-300 shadow-sm ${active ? 'left-4' : 'left-0.5'}`}></div>
   </div>
);

export const OpsCategoryConfigView: React.FC = () => {
  const [categories, setCategories] = useState<OpsCategory[]>(INITIAL_OPS_CATEGORIES);
  const [activeTab, setActiveTab] = useState<'standard' | 'combo'>('standard');
  const [selectedCategory, setSelectedCategory] = useState<OpsCategory | null>(null);
  
  // Category Form Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalData, setCategoryModalData] = useState<OpsCategory | null>(null);

  const [pendingFields, setPendingFields] = useState<CategoryFieldConfig[]>([]);
  const [isConfigChanged, setIsConfigChanged] = useState(false);

  const displayCategories = categories.filter(c => c.classification === activeTab);

  useEffect(() => {
    if (selectedCategory) {
      setPendingFields(JSON.parse(JSON.stringify(selectedCategory.fields)));
      setIsConfigChanged(false);
    }
  }, [selectedCategory]);

  const handleUpdateCategory = (id: string, updates: Partial<OpsCategory>) => {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      if (selectedCategory?.id === id) {
          setSelectedCategory(prev => prev ? { ...prev, ...updates } : null);
      }
  };

  const handleSaveConfig = () => {
     if (!selectedCategory) return;
     handleUpdateCategory(selectedCategory.id, { fields: pendingFields });
     setIsConfigChanged(false);
     alert('字段配置已保存');
  };

  const handleAddField = (fieldId: string) => {
      if (pendingFields.some(f => f.id === fieldId)) return;
      const fieldDef = AVAILABLE_DYNAMIC_FIELDS.find(f => f.id === fieldId);
      if (!fieldDef) return;

      const initialChildConfigs: Record<string, boolean> = {};
      const initialChildReqs: Record<string, boolean> = {};
      
      if (fieldDef.children) {
          fieldDef.children.forEach(child => {
              initialChildConfigs[child.id] = (child.isDefaultSelected || child.isSystem) ? true : false;
              initialChildReqs[child.id] = false; // default not required
          });
      }

      const newField: CategoryFieldConfig = { 
          id: fieldId, 
          isRequired: fieldDef.isRequired || false,
          childConfigs: fieldDef.children ? initialChildConfigs : undefined,
          childRequiredConfigs: fieldDef.children ? initialChildReqs : undefined
      };
      
      setPendingFields(prev => [...prev, newField]);
      setIsConfigChanged(true);
  };

  const handleRemoveField = (id: string) => {
     const fieldDef = AVAILABLE_DYNAMIC_FIELDS.find(f => f.id === id);
     if (fieldDef?.isSystem) return; 
     setPendingFields(prev => prev.filter(f => f.id !== id));
     setIsConfigChanged(true);
  };

  const handleToggleRequired = (id: string) => {
     setPendingFields(prev => prev.map(f => f.id === id ? { ...f, isRequired: !f.isRequired } : f));
     setIsConfigChanged(true);
  };

  const handleToggleChildRequired = (parentId: string, childId: string) => {
      setPendingFields(prev => prev.map(f => {
          if (f.id !== parentId) return f;
          const currentReq = f.childRequiredConfigs?.[childId] || false;
          return {
              ...f,
              childRequiredConfigs: {
                  ...f.childRequiredConfigs,
                  [childId]: !currentReq
              }
          };
      }));
      setIsConfigChanged(true);
  };

  const handleToggleSubField = (parentId: string, childId: string) => {
      const fieldDef = AVAILABLE_DYNAMIC_FIELDS.find(f => f.id === parentId);
      const childDef = fieldDef?.children?.find(c => c.id === childId);
      if (childDef?.isSystem) return;

      setPendingFields(prev => prev.map(f => {
          if (f.id === parentId && f.childConfigs) {
              return { ...f, childConfigs: { ...f.childConfigs, [childId]: !f.childConfigs[childId] } };
          }
          return f;
      }));
      setIsConfigChanged(true);
  };

  const handleOpenCreateModal = () => {
      setCategoryModalData({
          id: '',
          name: '',
          classification: activeTab,
          fields: generateInitialFields(activeTab),
          productCount: 0,
          source: 'system', // or custom based on logic, keeping system for simplicity in prototype
          applicableBrands: 'all',
          industryDefaults: [],
          status: 'active'
      });
      setShowCategoryModal(true);
  };

  const handleOpenEditModal = (cat: OpsCategory) => {
      setCategoryModalData(JSON.parse(JSON.stringify(cat)));
      setShowCategoryModal(true);
  };

  const handleSaveCategoryModal = (data: OpsCategory) => {
      if (!data.name) return;
      if (data.id) {
          // Update
          setCategories(prev => prev.map(c => c.id === data.id ? data : c));
          if (selectedCategory?.id === data.id) setSelectedCategory(data);
      } else {
          // Create
          const newCat = { ...data, id: `cat_new_${Date.now()}` };
          setCategories(prev => [...prev, newCat]);
          setSelectedCategory(newCat);
      }
      setShowCategoryModal(false);
  };

  // Group pending fields by module for unified display in canvas
  const groupedPendingFields = useMemo(() => {
      const groups: Record<FieldModule, { fieldConfig: CategoryFieldConfig, fieldDef: DynamicFieldConfig }[]> = {
          base: [], product_attr: [], sales: [], display: [], others: []
      };
      
      pendingFields.forEach(pf => {
          const def = AVAILABLE_DYNAMIC_FIELDS.find(f => f.id === pf.id);
          if (def) groups[def.module].push({ fieldConfig: pf, fieldDef: def });
      });
      return groups;
  }, [pendingFields]);

  return (
    <div className="flex h-full overflow-hidden animate-in fade-in duration-300 relative">
        {/* Sidebar */}
        <div className="w-[280px] bg-white border-r border-[#E8E8E8] flex flex-col shadow-sm shrink-0">
            <div className="p-6 border-b border-[#F5F5F5]">
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                   <button onClick={() => { setActiveTab('standard'); setSelectedCategory(null); }} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'standard' ? 'bg-white text-[#00C06B] shadow-sm' : 'text-gray-500'}`}>标准商品类目</button>
                   <button onClick={() => { setActiveTab('combo'); setSelectedCategory(null); }} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'combo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>套餐商品类目</button>
                </div>
                <div className="flex justify-between items-center">
                   <span className="font-black text-[#1F2129] text-[13px]">{activeTab === 'standard' ? '标准类目' : '套餐类目'}列表</span>
                   <button onClick={handleOpenCreateModal} className="bg-[#1F2129] text-white hover:bg-gray-800 p-1.5 rounded-lg transition-colors shadow-sm active:scale-95"><Plus size={16}/></button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {displayCategories.map(cat => (
                    <div key={cat.id} className={`px-4 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group border ${selectedCategory?.id === cat.id ? 'bg-[#F0FDF4] border-[#DCFCE7]' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                        <div className="flex items-center min-w-0 flex-1" onClick={() => setSelectedCategory(cat)}>
                            <Layers size={16} className={`mr-3 shrink-0 ${selectedCategory?.id === cat.id ? 'text-[#00C06B]' : 'text-gray-400'}`}/>
                            <div className="flex flex-col min-w-0">
                                <span className={`text-[13px] font-bold truncate ${selectedCategory?.id === cat.id ? 'text-[#333]' : 'text-[#666]'}`}>{cat.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(cat); }} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-md hover:bg-gray-100 transition-all">
                                <Edit3 size={14}/>
                            </button>
                            <div onClick={(e) => e.stopPropagation()}>
                                <CategoryStatusSwitch 
                                    active={cat.status === 'active'} 
                                    onClick={() => handleUpdateCategory(cat.id, { status: cat.status === 'active' ? 'disabled' : 'active' })} 
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 bg-gray-50/50 overflow-hidden flex flex-col">
            {selectedCategory ? (
            <>
                <header className="px-8 py-4 border-b border-[#E8E8E8] bg-white flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center">
                            <h2 className="text-xl font-black text-[#1F2129] mr-3">{selectedCategory.name}</h2>
                            <button onClick={() => handleOpenEditModal(selectedCategory)} className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-500 rounded-lg transition-colors">
                                <Edit3 size={16}/>
                            </button>
                        </div>
                        <div className="flex items-center mt-1 space-x-2">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium uppercase tracking-widest bg-[#E6F8F0] text-[#00C06B]">{selectedCategory.classification.toUpperCase()}</span>
                            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tight">ID: {selectedCategory.id}</span>
                            {selectedCategory.status === 'disabled' && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-lg font-bold">已禁用</span>}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={handleSaveConfig} disabled={!isConfigChanged} className={`flex items-center space-x-2 px-6 h-10 rounded-xl text-xs font-black transition-all shadow-md ${isConfigChanged ? 'bg-[#1F2129] text-white shadow-gray-200 hover:bg-black active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                            <Save size={16}/><span>保存字段配置</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Field Library - Simplified, no nested children display */}
                    <div className="w-[300px] bg-white border-r border-[#E8E8E8] flex flex-col overflow-y-auto no-scrollbar p-6">
                        <h3 className="text-[13px] font-black text-gray-900 mb-5">可选字段库</h3>
                        <div className="space-y-8">
                            {productModules.map(mod => {
                                const moduleFields = AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === mod.id);
                                if (moduleFields.length === 0) return null;
                                return (
                                    <div key={mod.id}>
                                        <div className="flex items-center mb-4"><span className="text-[13px] font-black text-gray-800">{mod.label}</span><ChevronDown size={14} className="ml-1 text-gray-400"/></div>
                                        <div className="space-y-2.5">
                                            {moduleFields.map(f => {
                                                const isAdded = pendingFields.some(pf => pf.id === f.id);
                                                const isSystem = f.isSystem;
                                                const hasBrands = f.applyToBrands && f.applyToBrands.length > 0;

                                                return (
                                                    <div key={f.id} onClick={() => !isSystem && !isAdded && handleAddField(f.id)} className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all flex justify-between items-center group select-none ${isAdded || isSystem ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-default' : 'bg-white border-gray-200 hover:border-[#00C06B] hover:text-[#00C06B] hover:shadow-sm cursor-pointer text-gray-700'}`}>
                                                        <div className="flex items-center min-w-0">
                                                            <span className="truncate">{f.label}</span>
                                                            {isSystem && <Lock size={10} className="ml-1.5 opacity-40"/>}
                                                            {hasBrands && <Globe size={10} className="ml-1.5 text-blue-400"/>}
                                                        </div>
                                                        <div className="shrink-0 flex items-center ml-2">{isAdded || isSystem ? <Check size={14} className="text-gray-300"/> : <Plus size={14} className="text-gray-400 group-hover:text-[#00C06B] transition-colors"/>}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Canvas Area - Module based grouping with uniform styling */}
                    <div className="flex-1 bg-[#F5F7FA] flex flex-col p-8 overflow-y-auto no-scrollbar scroll-smooth">
                        <div className="w-full max-w-4xl mx-auto space-y-10">
                            {productModules.map(mod => {
                                const moduleItems = groupedPendingFields[mod.id];
                                if (moduleItems.length === 0) return null;
                                
                                return (
                                    <div key={mod.id} className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center">
                                                <div className="w-1 h-4 bg-gray-300 rounded-full mr-3"></div>
                                                {mod.label}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-bold">已启用 {moduleItems.length} 项</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {moduleItems.map(({ fieldConfig, fieldDef }) => (
                                                <div key={fieldDef.id} className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${fieldDef.isSystem ? 'border-gray-100 opacity-90' : 'border-white shadow-sm hover:shadow-md hover:border-[#00C06B]/30'}`}>
                                                    {/* Card Header/Body Unified */}
                                                    <div className="p-5 flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="mr-4 text-gray-300"><GripVertical size={16}/></div>
                                                            <div>
                                                                <div className="flex items-center">
                                                                    <span className="font-black text-[15px] text-gray-900">{fieldDef.label}</span>
                                                                    {fieldDef.isSystem && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[9px] font-bold border border-gray-200">系统内置</span>}
                                                                    
                                                                    {/* Brand Specific Badge with Hover List */}
                                                                    {fieldDef.applyToBrands && fieldDef.applyToBrands.length > 0 && (
                                                                        <div className="ml-2 relative group/brands">
                                                                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded text-[9px] font-bold border border-blue-100 cursor-help flex items-center">
                                                                                部分品牌适用
                                                                            </span>
                                                                            {/* Hover Tooltip for Brands */}
                                                                            <div className="absolute left-0 top-full mt-1 z-50 invisible group-hover/brands:visible bg-white border border-gray-200 shadow-xl rounded-xl p-4 min-w-[160px] animate-in fade-in zoom-in-95">
                                                                                <div className="text-[10px] font-black text-gray-400 mb-3 border-b border-gray-100 pb-2 uppercase tracking-widest">适用品牌列表</div>
                                                                                <div className="space-y-2">
                                                                                    {fieldDef.applyToBrands.map(bid => {
                                                                                        const brand = MOCK_BRANDS.find(b => b.id === bid);
                                                                                        return (
                                                                                            <div key={bid} className="text-xs font-bold text-gray-700 flex items-center">
                                                                                                <span className="mr-2 text-sm">{brand?.icon}</span>
                                                                                                {brand?.name || bid}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-tighter opacity-60">ID: {fieldDef.id}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center space-x-6">
                                                            {/* Only show parent required toggle if NO children */}
                                                            {!fieldDef.children && (
                                                                <label className="flex items-center cursor-pointer space-x-2 bg-gray-50/50 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                                                                    <input type="checkbox" checked={fieldConfig.isRequired} onChange={() => handleToggleRequired(fieldDef.id)} className={`w-4 h-4 rounded border-gray-300 text-[#00C06B] focus:ring-[#00C06B] cursor-pointer`}/>
                                                                    <span className={`text-xs font-bold ${fieldConfig.isRequired ? 'text-[#00C06B]' : 'text-gray-400'}`}>必填</span>
                                                                </label>
                                                            )}
                                                            {!fieldDef.isSystem && <button onClick={() => handleRemoveField(fieldDef.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>}
                                                        </div>
                                                    </div>

                                                    {/* Sub-fields: Uniformed layout to avoid "big/small" issue */}
                                                    {fieldDef.children && fieldDef.children.length > 0 && (
                                                        <div className="bg-[#F8FAFB] px-8 py-5 border-t border-dashed border-gray-200">
                                                            <div className="flex items-center mb-4">
                                                                <div className="w-1.5 h-1.5 bg-[#00C06B] rounded-full mr-2"></div>
                                                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">细分配置字段 (三级管控)</span>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                {fieldDef.children.map(child => {
                                                                    const isActive = fieldConfig.childConfigs?.[child.id] ?? false;
                                                                    const isChildRequired = fieldConfig.childRequiredConfigs?.[child.id] ?? false;
                                                                    const isLocked = child.isSystem;
                                                                    return (
                                                                        <div 
                                                                            key={child.id} 
                                                                            onClick={() => !isLocked && handleToggleSubField(fieldDef.id, child.id)} 
                                                                            className={`px-3 py-2.5 rounded-xl border flex items-center justify-between transition-all group/item min-h-[48px] ${isActive ? (isLocked ? 'bg-gray-100 border-gray-200' : 'bg-white border-[#00C06B] shadow-sm') : 'bg-gray-50/50 border-gray-200 grayscale opacity-60'} ${isLocked ? 'cursor-default' : 'cursor-pointer hover:border-[#00C06B] hover:bg-white'}`}
                                                                        >
                                                                            <div className="flex items-center min-w-0 mr-2">
                                                                                <span className={`text-[11px] font-bold truncate ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{child.label}</span>
                                                                                {isLocked && <Lock size={10} className="ml-1.5 text-gray-300 shrink-0"/>}
                                                                            </div>
                                                                            <div className="flex items-center space-x-3">
                                                                                {/* Child Required Toggle */}
                                                                                {isActive && (
                                                                                    <div 
                                                                                        onClick={(e) => { e.stopPropagation(); handleToggleChildRequired(fieldDef.id, child.id); }}
                                                                                        className="flex items-center space-x-1 cursor-pointer group/req select-none"
                                                                                    >
                                                                                        <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all ${isChildRequired ? 'bg-[#00C06B] border-[#00C06B]' : 'bg-white border-gray-300 group-hover/req:border-[#00C06B]'}`}>
                                                                                            {isChildRequired && <Check size={8} className="text-white" strokeWidth={4}/>}
                                                                                        </div>
                                                                                        <span className={`text-[10px] font-bold ${isChildRequired ? 'text-[#00C06B]' : 'text-gray-400 group-hover/req:text-gray-600'}`}>必填</span>
                                                                                    </div>
                                                                                )}
                                                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isActive ? (isLocked ? 'bg-gray-300 border-gray-300' : 'bg-[#00C06B] border-[#00C06B]') : 'bg-white border-gray-300'}`}>
                                                                                    {isActive && <Check size={10} className="text-white" strokeWidth={4}/>}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 bg-[#FAFAFA]">
                    <ListTree size={64} className="mb-6 opacity-10 text-gray-400"/>
                    <h3 className="text-lg font-black text-gray-400 mb-2">请选择业务类目</h3>
                    <p className="text-sm text-gray-400 opacity-60">点击左侧列表中的分类节点，配置该类目下的标准字段结构。</p>
                </div>
            )}
        </div>

        {/* Category Create/Edit Modal */}
        {showCategoryModal && categoryModalData && (
            <CategoryFormModal 
                data={categoryModalData}
                existingCategories={categories}
                onClose={() => setShowCategoryModal(false)}
                onSave={handleSaveCategoryModal}
            />
        )}
    </div>
  );
};

const CategoryFormModal = ({ 
    data, 
    existingCategories,
    onClose, 
    onSave 
}: { 
    data: OpsCategory, 
    existingCategories: OpsCategory[],
    onClose: () => void, 
    onSave: (data: OpsCategory) => void 
}) => {
    const [formData, setFormData] = useState(data);
    const [brandsMode, setBrandsMode] = useState<'all' | 'specific'>(data.applicableBrands === 'all' ? 'all' : 'specific');
    
    // Calculate used industries for the SAME classification, excluding current category
    const disabledIndustries = useMemo(() => {
        const otherCats = existingCategories.filter(c => c.classification === data.classification && c.id !== data.id);
        const used = new Set<string>();
        otherCats.forEach(c => c.industryDefaults.forEach(i => used.add(i)));
        return Array.from(used);
    }, [existingCategories, data]);

    const handleBrandsChange = (ids: string[]) => {
        setFormData(prev => ({ ...prev, applicableBrands: ids }));
    };

    const handleIndustryChange = (ids: string[]) => {
        setFormData(prev => ({ ...prev, industryDefaults: ids }));
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1F2129]/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 overflow-visible">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-[#1F2129]">{data.id ? '编辑类目' : '新建类目'}</h3>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{data.classification.toUpperCase()} CATEGORY</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
                </div>
                
                <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] overflow-visible">
                    <div className="space-y-4">
                        <label className="text-[13px] font-black text-gray-700">类目名称 <span className="text-red-500">*</span></label>
                        <input 
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                            placeholder="请输入类目名称"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[13px] font-black text-gray-700">类目图标 <span className="text-gray-400 font-normal text-xs ml-1">(选填)</span></label>
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:text-blue-500 text-gray-400 transition-colors">
                                {formData.icon ? <img src={formData.icon} className="w-full h-full object-cover rounded-lg" /> : <Plus size={20} />}
                            </div>
                            <div className="text-[10px] text-gray-400 leading-tight">
                                建议尺寸 100x100px<br/>支持 JPG, PNG 格式
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[13px] font-black text-gray-700">适用品牌</label>
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-3">
                            <button onClick={() => { setBrandsMode('all'); setFormData(prev => ({ ...prev, applicableBrands: 'all' })); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${brandsMode === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>全品牌通用</button>
                            <button onClick={() => { setBrandsMode('specific'); setFormData(prev => ({ ...prev, applicableBrands: [] })); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${brandsMode === 'specific' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>指定品牌</button>
                        </div>
                        {brandsMode === 'specific' && (
                            <MultiSelectDropdown 
                                options={MOCK_BRANDS.map(b => ({ label: b.name, value: b.id }))}
                                value={Array.isArray(formData.applicableBrands) ? formData.applicableBrands : []}
                                onChange={handleBrandsChange}
                                placeholder="请选择适用品牌"
                            />
                        )}
                    </div>

                    <div className="space-y-4">
                        <label className="text-[13px] font-black text-gray-700 flex items-center justify-between">
                            <span>关联行业</span>
                            <span className="text-[10px] text-gray-400 font-normal bg-gray-50 px-2 py-0.5 rounded">关联后对应行业下的商家创建商品时默认选择该类目</span>
                        </label>
                        <MultiSelectDropdown 
                            options={INDUSTRY_OPTIONS.map(i => ({ label: i, value: i }))}
                            value={formData.industryDefaults}
                            onChange={handleIndustryChange}
                            placeholder="请选择关联行业"
                            disabledOptions={disabledIndustries}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all">取消</button>
                    <button 
                        onClick={() => onSave(formData)}
                        disabled={!formData.name}
                        className={`px-8 py-3 rounded-xl text-xs font-black text-white shadow-lg transition-all active:scale-95 ${formData.name ? 'bg-[#1F2129] hover:bg-black' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        保存配置
                    </button>
                </div>
            </div>
        </div>
    );
};