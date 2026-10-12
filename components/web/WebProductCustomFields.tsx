import React from 'react';
import type { Attribute } from './customAttributeDefinitions';

export function WebProductCustomFields({ attributes, value, onChange, showErrors }: {
    attributes: Attribute[]; value: Record<string, any>; onChange: React.Dispatch<React.SetStateAction<Record<string, any>>>; showErrors: boolean;
}) {
    if (!attributes.length) return null;
    const values = value.customAttributes || {};
    const set = (id: string, next: any) => onChange(previous => ({ ...previous, customAttributes: { ...previous.customAttributes, [id]: next } }));
    return <div className="py-2"><h3 className="mb-3 text-sm font-medium text-[#1F2129]">自定义属性</h3><div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
        {attributes.map(attribute => {
            const current = values[attribute.id] ?? '';
            const empty = Array.isArray(current) ? !current.length : String(current).trim() === '';
            return <div key={attribute.id} id={`field-custom-${attribute.id}`}>
                <label htmlFor={`custom-${attribute.id}`} className="mb-2 block text-sm text-[#4E5969]">{attribute.name}{attribute.required && <span className="ml-1 text-[#D92D20]">*</span>}</label>
                {attribute.type === '多选' ? <div className="flex min-h-10 flex-wrap gap-x-5 gap-y-2 py-2">{attribute.options.map(option => <label key={option} className="flex items-center gap-2 text-sm text-[#4E5969]"><input type="checkbox" className="accent-[#00B460]" checked={Array.isArray(current) && current.includes(option)} onChange={event => set(attribute.id, event.target.checked ? [...(Array.isArray(current) ? current : []), option] : current.filter((item: string) => item !== option))} />{option}</label>)}</div>
                : attribute.type === '单选' ? <select id={`custom-${attribute.id}`} aria-label={attribute.name} className="q-form-select" value={current} onChange={event => set(attribute.id, event.target.value)}><option value="">请选择</option>{attribute.options.map(option => <option key={option}>{option}</option>)}</select>
                : <input id={`custom-${attribute.id}`} aria-label={attribute.name} className="q-form-input" type={attribute.type === '数字' ? 'number' : 'text'} value={current} onChange={event => set(attribute.id, event.target.value)} placeholder={`请输入${attribute.name}`} />}
                {attribute.description && <p className="mt-1 text-xs leading-5 text-[#667085]">{attribute.description}</p>}
                {showErrors && attribute.required && empty && <p role="alert" className="mt-1 text-xs text-[#D92D20]">请填写{attribute.name}。</p>}
            </div>;
        })}
    </div></div>;
}
