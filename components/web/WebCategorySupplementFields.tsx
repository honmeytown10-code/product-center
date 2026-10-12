import React, { useEffect, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { categorySupplementFields, isCategorySupplementActive } from './productCategoryFields';
import type { FieldModule } from '../../types';

type CategoryFieldsProps = {
    categoryId: string; module: FieldModule; value: Record<string, any>;
    onChange: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    allowedIds: Set<string>; requiredIds: Set<string>; errors: Record<string, string>; autoCartEligible?: boolean;
};
export const WebCategorySupplementFields: React.FC<CategoryFieldsProps> = ({ categoryId, module, value, onChange, allowedIds, requiredIds, errors, autoCartEligible = true }) => {
    const fields = categorySupplementFields(categoryId).filter(field => field.module === module && allowedIds.has(field.id));
    const [open, setOpen] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const hasError = fields.some(field => errors[field.id]);
    const filled = fields.filter(field => value[field.id] !== undefined && value[field.id] !== '' && value[field.id] !== false).length;
    useEffect(() => { if (hasError) setOpen(true); }, [hasError]);
    useEffect(() => { setOpen(false); setUploadError(''); }, [categoryId]);
    useEffect(() => {
        if (categoryId === 'w_cat_c5' && allowedIds.has('c_hotpot_type') && !value.c_hotpot_type) onChange(previous => ({ ...previous, c_hotpot_type: '固定锅底' }));
    }, [categoryId, module, value.c_hotpot_type, allowedIds.has('c_hotpot_type')]);
    if (!fields.length) return null;
    const title = module === 'base' ? '锅底设置' : module === 'sales' ? '类目销售设置' : module === 'display' ? '营养公开设置' : categoryId === 'w_cat_c5' ? '用餐人数限制' : '类目补充信息';
    const set = (id: string, next: any) => onChange(previous => ({ ...previous, [id]: next }));
    return <div className="pt-2" data-category-supplement={module}>
        <button type="button" aria-expanded={open} aria-controls={`category-${module}-fields`} onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 rounded py-2 text-left text-sm text-[#008F4C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460]">
            <ChevronDown size={16} className={open ? 'rotate-180' : ''} /><span className="font-medium">{title}</span><span className="text-xs text-[#667085]">{filled ? `已填写 ${filled} 项` : `${fields.length} 项可选`}</span>
        </button>
        {open && <div id={`category-${module}-fields`} className="grid grid-cols-1 gap-x-6 gap-y-5 py-3 lg:grid-cols-2">
            {fields.filter(field => isCategorySupplementActive(field, value)).map(field => {
                const disabled = field.id === 's_auto_cart' && !autoCartEligible;
                const fieldValue = value[field.id] ?? '';
                return <div key={field.id} id={`field-${field.id}`} className={field.type === 'image' ? 'col-span-full' : 'min-w-0'}>
                    {field.type === 'switch' ? <label className={`flex items-start gap-3 ${disabled ? 'text-[#667085]' : 'cursor-pointer'}`}>
                        <input type="checkbox" aria-label={field.label} className="mt-1 h-4 w-4 accent-[#00B460]" checked={!!value[field.id]} disabled={disabled} onChange={event => set(field.id, event.target.checked)} />
                        <span><span className="block text-sm font-medium text-[#1F2129]">{field.label}</span>{field.description && <span className="mt-1 block text-xs leading-5 text-[#667085]">{field.description}</span>}{disabled && <span className="mt-1 block text-xs text-[#667085]">当前配置不支持自动加入购物车。</span>}</span>
                    </label> : <>
                        <label htmlFor={`category-input-${field.id}`} className="mb-2 block text-sm font-medium text-[#1F2129]">{field.label}{requiredIds.has(field.id) && <span className="ml-1 text-[#D92D20]">*</span>}</label>
                        {field.type === 'radio_group' ? <div role="radiogroup" aria-label={field.label} className="flex flex-wrap gap-6 py-2">{field.presetValues?.map(option => <label key={option} className="flex items-center gap-2 text-sm text-[#4E5969]"><input type="radio" name={field.id} className="accent-[#00B460]" checked={(fieldValue || field.presetValues![0]) === option} onChange={() => set(field.id, option)} />{option}</label>)}</div>
                        : field.type === 'image' ? <div className="flex flex-wrap items-start gap-4">
                            {fieldValue && <div className="relative"><img src={fieldValue} alt="营养成分图片" className="h-24 w-32 rounded-md border border-[#E6E8EB] object-contain" /><button type="button" aria-label="移除营养成分图片" onClick={() => set(field.id, '')} className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-[#667085] shadow"><X size={14} /></button></div>}
                            <input id={`category-input-${field.id}`} type="file" accept="image/jpeg" aria-label={field.label} className="max-w-full text-sm text-[#4E5969] file:mr-3 file:rounded-md file:border file:border-[#D9DDE3] file:bg-white file:px-3 file:py-2 file:text-[#008F4C]" onChange={event => {
                                const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
                                if (file.type !== 'image/jpeg' || file.size > 20 * 1024) { setUploadError('请选择不超过 20KB 的 JPG 图片。'); return; }
                                setUploadError(''); const reader = new FileReader(); reader.onload = () => set(field.id, String(reader.result)); reader.onerror = () => setUploadError('图片读取失败，请重新选择。'); reader.readAsDataURL(file);
                            }} />
                        </div> : field.type === 'textarea' ? <textarea id={`category-input-${field.id}`} aria-label={field.label} value={fieldValue} maxLength={field.maxLength} rows={2} onChange={event => set(field.id, event.target.value)} className="q-form-input h-auto py-2" placeholder={`请输入${field.label}`} />
                        : <div className="flex items-center gap-2"><div className="relative min-w-0 flex-1"><input id={`category-input-${field.id}`} aria-label={field.label} aria-invalid={!!errors[field.id]} type={field.inputType || (field.type === 'number' ? 'number' : 'text')} min={field.id === 'o_storage_temperature' ? undefined : field.type === 'number' ? 0 : undefined} max={field.maxNumber} step={field.integer ? 1 : 'any'} maxLength={field.maxLength} value={fieldValue} onChange={event => set(field.id, event.target.value)} placeholder={`请输入${field.label}`} className={`q-form-input ${field.unit ? 'pr-12' : ''} ${errors[field.id] ? 'border-[#D92D20]' : ''}`} />{field.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#667085]">{field.unit}</span>}</div>{field.unitField && <div className="w-24 shrink-0"><select aria-label="提前预约单位" className="q-form-select" value={value[field.unitField] || ''} onChange={event => set(field.unitField!, event.target.value)}><option value="">单位</option>{field.unitOptions?.map(unit => <option key={unit}>{unit}</option>)}</select></div>}</div>}
                        {field.description && <p className="mt-1 text-xs leading-5 text-[#667085]">{field.description}</p>}
                    </>}
                    {field.maxLength && <p className="mt-1 text-right text-xs text-[#667085]">{String(fieldValue).length}/{field.maxLength}</p>}
                    {errors[field.id] && <p role="alert" className="mt-1 text-xs text-[#D92D20]">{errors[field.id]}</p>}
                    {field.type === 'image' && uploadError && <p role="alert" className="mt-1 text-xs text-[#D92D20]">{uploadError}</p>}
                </div>;
            })}
        </div>}
    </div>;
};
