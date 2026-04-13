
import React, { useState } from 'react';
import { 
  ArrowLeft, FileText, Scale, Sliders, Settings, Printer, 
  CupSoda, ShoppingBag, Store, Check, Plus, ImageIcon, ChevronRight
} from 'lucide-react';
import { Category, AVAILABLE_DYNAMIC_FIELDS, DynamicFieldConfig } from '../../types';
import { Switch, SectionHeader, FormRow, ChannelSwitch } from './WebCommon';

interface WebProductFormProps {
    type: 'standard' | 'combo';
    category: Category;
    onClose: () => void;
}

export const WebProductForm: React.FC<WebProductFormProps> = ({ type, category, onClose }) => {
    const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
    const [activeFormSection, setActiveFormSection] = useState('basic');

    const scrollToSection = (id: string) => {
        setActiveFormSection(id);
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Form Renderer Helper
    const renderDynamicInput = (field: DynamicFieldConfig & { isRequiredConfig: boolean }) => {
        const value = dynamicFormData[field.id] || '';
        const setValue = (v: any) => setDynamicFormData(prev => ({ ...prev, [field.id]: v }));
        
        if (field.id === 'p_cat') {
             return (
                 <div className="relative">
                     <div className="q-form-select bg-gray-50 text-gray-500 cursor-not-allowed border border-[#E8E8E8] rounded-lg px-3 py-2.5 text-[13px]">
                        {category.name}
                     </div>
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

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-16 px-8 bg-white border-b border-[#E8E8E8] flex justify-between items-center shrink-0 shadow-sm z-20">
                <div className="flex items-center">
                    <button onClick={onClose} className="mr-4 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={20} className="text-gray-600"/></button>
                    <div>
                        <h3 className="text-lg font-black text-[#1F2129]">填写商品资料</h3>
                        <p className="text-xs text-gray-400 mt-0.5">当前类目: {category.name}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm">取消</button>
                    <button onClick={onClose} className="px-6 py-2 bg-[#1F2129] text-white font-bold rounded-lg shadow-lg hover:bg-black transition-all active:scale-95 text-sm flex items-center"><Check size={16} className="mr-2"/> 完成创建</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
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
                <div className="flex-1 overflow-y-auto p-8 scroll-smooth no-scrollbar">
                    <div className="w-full max-w-[1600px] mx-auto pb-24 space-y-6">
                        
                        {/* Basic & Display Section */}
                        <div id="basic" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="基础与展示信息" icon={<FileText size={20}/>} />
                            <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-8 gap-y-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'base' || f.module === 'display').map(field => {
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
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'sales').map(field => (
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
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'product_attr').map(field => (
                                    <FormRow key={field.id} label={field.label} required={field.isRequired}>
                                        {renderDynamicInput({ ...field, isRequiredConfig: field.isRequired || false })}
                                    </FormRow>
                                ))}
                            </div>
                        </div>

                        {/* Others Section */}
                        <div id="settings" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm space-y-6">
                            <SectionHeader title="其他与高级设置" icon={<Settings size={20}/>} />
                            <div className="grid grid-cols-3 xl:grid-cols-4 gap-6">
                                {AVAILABLE_DYNAMIC_FIELDS.filter(f => f.module === 'others').map(field => {
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
            <style>{`.q-form-input { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 10px 12px; font-size: 13px; outline: none; transition: all 0.2s; background: white; } .q-form-input:focus { border-color: #00C06B; box-shadow: 0 0 0 3px rgba(0, 192, 107, 0.1); } .q-form-select { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 10px 12px; font-size: 13px; outline: none; transition: all 0.2s; background: white; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; }`}</style>
        </div>
    );
}
