
import React, { useState, useEffect } from 'react';
import { Plus, Folder, Edit2, Trash2, Save, Check, GripVertical, LayoutList, CheckCircle2, Type as TypeIcon, Hash, ToggleRight, MousePointer, Tag, ImageIcon, AlignLeft, Check as CheckIcon, X } from 'lucide-react';
import { Category, AVAILABLE_DYNAMIC_FIELDS, FieldModule, CategoryFieldConfig, ControlType } from '../../types';
import { WebCategory } from '../WebAdmin';

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

interface Props {
    categories: WebCategory[];
    selectedManageCat: Category | null;
    setSelectedManageCat: (cat: Category | null) => void;
    onAdd: (cat: WebCategory) => void;
    onUpdate: (id: string, updates: Partial<WebCategory>) => void;
    onDelete: (id: string) => void;
}

export const WebCategoryManager: React.FC<Props> = ({ 
    categories, selectedManageCat, setSelectedManageCat, onAdd, onUpdate, onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'combo'>('standard');
  const [editingCatName, setEditingCatName] = useState('');
  const [isCatNameEditing, setIsCatNameEditing] = useState(false);
  const [pendingFields, setPendingFields] = useState<CategoryFieldConfig[]>([]);
  const [isConfigChanged, setIsConfigChanged] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const displayCategories = categories.filter(c => c.classification === activeTab);

  useEffect(() => {
    if (selectedManageCat) {
      const fieldKey = (selectedManageCat as WebCategory).classification === 'standard' ? 'standardFields' : 'comboFields';
      const currentFields = selectedManageCat[fieldKey] || [];
      
      if (currentFields.length === 0) {
         const baseFields = AVAILABLE_DYNAMIC_FIELDS.filter(f => f.isBase).map(f => ({ id: f.id, isRequired: f.isRequired || false }));
         setPendingFields(baseFields);
         setIsConfigChanged(true);
      } else {
         setPendingFields(JSON.parse(JSON.stringify(currentFields)));
         setIsConfigChanged(false);
      }
    }
  }, [selectedManageCat]);

  const handleAddCategory = () => {
     const newCat: WebCategory = {
        id: `w_cat_new_${Date.now()}`,
        name: '新建类目',
        productCount: 0,
        standardFields: [],
        comboFields: [],
        source: 'brand', 
        classification: activeTab,
        children: []
     };
     onAdd(newCat);
     setSelectedManageCat(newCat);
     setEditingCatName(newCat.name);
     setIsCatNameEditing(true);
  };

  const handleDeleteCategory = (id: string) => {
     if(confirm('确认删除此分类吗？操作不可恢复。')) {
        onDelete(id);
        setSelectedManageCat(null);
     }
  };

  const handleSaveConfig = () => {
     if (!selectedManageCat) return;
     const cat = selectedManageCat as WebCategory;
     const key = cat.classification === 'standard' ? 'standardFields' : 'comboFields';
     onUpdate(cat.id, { [key]: pendingFields });
     setIsConfigChanged(false);
     alert('字段配置已保存');
  };

  const handleDragStartNew = (e: React.DragEvent, fieldId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'NEW', id: fieldId }));
    e.dataTransfer.effectAllowed = 'copy';
  };
  const handleDragStartSort = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'SORT', index }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    if (typeof index === 'number') setDragOverIndex(index);
  };
  const handleDrop = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    const data = JSON.parse(dataStr);
    if (data.type === 'NEW') {
       const fieldId = data.id;
       if (pendingFields.some(f => f.id === fieldId)) return;
       const newField = { id: fieldId, isRequired: false };
       setPendingFields(prev => {
          const next = [...prev];
          if (typeof dropIndex === 'number') next.splice(dropIndex, 0, newField);
          else next.push(newField);
          return next;
       });
       setIsConfigChanged(true);
    } else if (data.type === 'SORT') {
       const fromIdx = data.index;
       const toIdx = typeof dropIndex === 'number' ? dropIndex : pendingFields.length - 1;
       if (fromIdx === toIdx) return;
       setPendingFields(prev => {
          const next = [...prev];
          const [moved] = next.splice(fromIdx, 1);
          next.splice(toIdx, 0, moved);
          return next;
       });
       setIsConfigChanged(true);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
        <aside className="w-[280px] bg-white border-r border-[#E8E8E8] flex flex-col shrink-0">
           <div className="p-6 border-b">
              <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                 <button onClick={() => setActiveTab('standard')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'standard' ? 'bg-white text-[#00C06B] shadow-sm' : 'text-gray-500'}`}>标准类目</button>
                 <button onClick={() => setActiveTab('combo')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'combo' ? 'bg-white text-[#00C06B] shadow-sm' : 'text-gray-500'}`}>套餐类目</button>
              </div>
              <button onClick={handleAddCategory} className="w-full bg-[#00C06B] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center hover:bg-[#00A35B] transition-colors shadow-sm">
                 <Plus size={14} className="mr-1"/> 新建业务类目
              </button>
           </div>
           <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
              {displayCategories.map(cat => (
                 <div 
                    key={cat.id} 
                    onClick={() => setSelectedManageCat(cat)}
                    className={`group px-4 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${selectedManageCat?.id === cat.id ? 'bg-[#F0FDF4] border-[#DCFCE7]' : 'bg-white border-transparent hover:bg-gray-50'}`}
                 >
                    <div className="flex items-center min-w-0">
                       <Folder size={16} className={`mr-3 shrink-0 ${selectedManageCat?.id === cat.id ? 'text-[#00C06B]' : 'text-gray-400'}`}/>
                       <span className={`text-[13px] font-bold truncate ${selectedManageCat?.id === cat.id ? 'text-[#333]' : 'text-[#666]'}`}>{cat.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => { e.stopPropagation(); setEditingCatName(cat.name); setIsCatNameEditing(true); setSelectedManageCat(cat); }} className="p-1 hover:bg-gray-200 rounded text-gray-400"><Edit2 size={12}/></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-gray-400"><Trash2 size={12}/></button>
                    </div>
                 </div>
              ))}
           </div>
        </aside>

        <main className="flex-1 bg-[#F5F6FA] flex flex-col overflow-hidden">
           {selectedManageCat ? (
              <>
                 <header className="px-8 py-4 border-b border-[#E8E8E8] bg-white flex justify-between items-center shrink-0">
                    <div className="flex items-center">
                       {isCatNameEditing ? (
                          <div className="flex items-center space-x-2">
                             <input 
                                autoFocus
                                value={editingCatName}
                                onChange={e => setEditingCatName(e.target.value)}
                                onBlur={() => { onUpdate(selectedManageCat.id, { name: editingCatName }); setIsCatNameEditing(false); }}
                                onKeyDown={e => e.key === 'Enter' && (e.target as any).blur()}
                                className="border border-[#00C06B] rounded px-3 py-1 text-lg font-bold outline-none"
                             />
                             <Check size={18} className="text-[#00C06B] cursor-pointer" onClick={() => setIsCatNameEditing(false)}/>
                          </div>
                       ) : (
                          <h2 className="text-xl font-black text-[#1F2129] flex items-center group">
                             {selectedManageCat.name}
                             <Edit2 size={14} className="ml-2 text-gray-300 group-hover:text-[#00C06B] cursor-pointer" onClick={() => { setEditingCatName(selectedManageCat.name); setIsCatNameEditing(true); }}/>
                          </h2>
                       )}
                       <span className="ml-4 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-400 uppercase tracking-widest">{activeTab} classification</span>
                    </div>
                    <button 
                       onClick={handleSaveConfig}
                       disabled={!isConfigChanged}
                       className={`flex items-center space-x-2 px-6 h-10 rounded-xl text-xs font-black transition-all shadow-md ${isConfigChanged ? 'bg-[#1F2129] text-white shadow-gray-200 hover:bg-black active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                       <Save size={16}/> <span>保存配置方案</span>
                    </button>
                 </header>

                 <div className="flex-1 flex overflow-hidden">
                    <div className="w-[320px] bg-white border-r border-[#E8E8E8] flex flex-col overflow-y-auto no-scrollbar p-6">
                       <h3 className="text-[13px] font-black text-gray-900 mb-5">通用字段仓库 (拖拽至右侧)</h3>
                       <div className="space-y-6">
                          {productModules.map(mod => (
                             <div key={mod.id}>
                                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">{mod.label}</div>
                                <div className="grid grid-cols-1 gap-2">
                                   {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === mod.id).map(f => {
                                      const isAdded = pendingFields.some(pf => pf.id === f.id);
                                      return (
                                         <div 
                                            key={f.id} 
                                            draggable={!isAdded}
                                            onDragStart={(e) => handleDragStartNew(e, f.id)}
                                            className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all flex justify-between items-center group ${isAdded ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-default' : 'bg-white border-gray-200 hover:border-[#00C06B] hover:text-[#00C06B] hover:shadow-sm cursor-grab active:cursor-grabbing'}`}
                                         >
                                            <span className="truncate">{f.label}</span>
                                            {isAdded ? <CheckIcon size={14}/> : <Plus size={14} className="text-gray-400 group-hover:text-[#00C06B]"/>}
                                         </div>
                                      );
                                   })}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div 
                       className="flex-1 bg-[#F5F7FA] p-8 overflow-y-auto no-scrollbar scroll-smooth"
                       onDragOver={(e) => handleDragOver(e)}
                       onDrop={(e) => handleDrop(e)}
                    >
                       <div className="max-w-3xl mx-auto space-y-4">
                          <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-[#E8E8E8]">
                             <div className="flex items-center">
                                <LayoutList size={20} className="text-[#00C06B] mr-3"/>
                                <span className="font-bold text-gray-800">表单排布布局预览</span>
                             </div>
                             <div className="text-xs text-gray-400">共 {pendingFields.length} 个启用字段</div>
                          </div>

                          <div className="space-y-3">
                             {pendingFields.map((field, idx) => {
                                const def = AVAILABLE_DYNAMIC_FIELDS.find(f => f.id === field.id);
                                if (!def) return null;
                                return (
                                   <div 
                                      key={`${field.id}_${idx}`}
                                      draggable
                                      onDragStart={(e) => handleDragStartSort(e, idx)}
                                      onDragOver={(e) => handleDragOver(e, idx)}
                                      onDrop={(e) => handleDrop(e, idx)}
                                      className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all flex items-center justify-between group ${dragOverIndex === idx ? 'border-[#00C06B] border-dashed bg-[#00C06B]/5' : 'border-white hover:border-gray-200'}`}
                                   >
                                      <div className="flex items-center">
                                         <div className="p-2 cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-gray-400 mr-4"><GripVertical size={18}/></div>
                                         <div className="flex flex-col">
                                            <div className="flex items-center">
                                               <span className="font-black text-gray-900 mr-3">{def.label}</span>
                                               <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-400 text-[10px] font-bold uppercase">{controlTypes.find(t => t.id === def.type)?.label}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-400 mt-0.5 uppercase tracking-tighter opacity-60">ID: {def.id}</span>
                                         </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-4">
                                         <div 
                                            onClick={() => { setPendingFields(prev => prev.map(pf => pf.id === field.id ? { ...pf, isRequired: !pf.isRequired } : pf)); setIsConfigChanged(true); }}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all border ${field.isRequired ? 'bg-[#00C06B] text-white border-[#00C06B]' : 'bg-white text-gray-400 border-gray-200'}`}
                                         >
                                            {field.isRequired ? '必填' : '选填'}
                                         </div>
                                         <button 
                                            onClick={() => { setPendingFields(prev => prev.filter((_, i) => i !== idx)); setIsConfigChanged(true); }}
                                            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl text-gray-300 transition-colors"
                                         >
                                            <X size={18}/>
                                         </button>
                                      </div>
                                   </div>
                                );
                             })}

                             <div 
                                className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-gray-300 transition-all ${dragOverIndex === pendingFields.length ? 'border-[#00C06B] bg-[#00C06B]/5 text-[#00C06B]' : 'border-gray-200 hover:border-gray-300'}`}
                                onDragOver={(e) => handleDragOver(e, pendingFields.length)}
                                onDrop={(e) => handleDrop(e, pendingFields.length)}
                             >
                                <Plus size={24} className="mb-1"/>
                                <span className="text-xs font-bold uppercase tracking-widest">释放鼠标以追加字段</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/50">
                 <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-6"><LayoutList size={32} className="opacity-20"/></div>
                 <h3 className="text-lg font-black text-gray-400">请选择左侧类目进行字段编排</h3>
                 <p className="text-sm mt-2 opacity-60">不同业务类目可以拥有独立的商品数据描述模型</p>
              </div>
           )}
        </main>
    </div>
  );
};
