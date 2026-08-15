
import React from 'react';
import { Plus, ChevronDown, Check } from 'lucide-react';

export const Switch: React.FC<{ active: boolean; onClick: () => void; label?: string }> = ({ active, onClick, label = '切换状态' }) => (
  <button
    type="button"
    role="switch"
    aria-label={label}
    aria-checked={active}
    onClick={onClick}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${active ? 'bg-[#00B460]' : 'bg-gray-300'}`}
  >
    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${active ? 'left-6' : 'left-1'}`} />
  </button>
);

export const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode; meta?: React.ReactNode }> = ({ title, icon, meta }) => (
  <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
    <div className="flex items-center min-w-0">
      {icon && <div className="mr-2.5 text-[#00C06B] opacity-80">{icon}</div>}
      <h3 className="text-base font-bold text-gray-800">{title}</h3>
    </div>
    {meta && <div className="shrink-0">{meta}</div>}
  </div>
);

export const FormRow: React.FC<{ label: string; required?: boolean; description?: string; children: React.ReactNode; isHorizontal?: boolean; descriptionPlacement?: 'top' | 'bottom' }> = ({ label, required, description, children, isHorizontal, descriptionPlacement = 'top' }) => {
  if (isHorizontal) {
      return (
          <div className="flex items-start">
              <div className="w-[120px] shrink-0 mt-1.5 flex justify-end pr-4 items-baseline border-r border-gray-200/60 h-full min-h-[32px]">
                <label className="text-[14px] font-bold text-gray-700 text-right">
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>
              <div className="flex-1 flex flex-col space-y-1 pl-4">
                  {children}
                  {description && <span className="text-[11px] text-gray-400 font-medium">{description}</span>}
              </div>
          </div>
      );
  }
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-[13px] font-bold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && descriptionPlacement === 'top' && <span className="text-[11px] text-gray-400 font-medium">{description}</span>}
      </div>
      {children}
      {description && descriptionPlacement === 'bottom' && <span className="text-[11px] text-gray-400 font-medium">{description}</span>}
    </div>
  );
};

export const SidebarItem: React.FC<{
  label: string;
  active?: boolean;
  nested?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}> = ({ label, active, nested = false, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
        flex min-h-[36px] w-full items-center border-l-[3px] py-2 pr-6 text-left text-[13px] transition-colors
        ${nested ? 'pl-10 font-normal' : 'pl-5 font-medium'}
      ${active ? 'border-[#00B460] bg-[#EDF9F3] text-[#008F4C]' : 'border-transparent text-[#3F4652] hover:bg-[#F5F7F9] hover:text-[#1D2129]'}
    `}
  >
    {icon && <span className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>}
    <span className="truncate">{label}</span>
  </button>
);

export const TabItem: React.FC<{ label: string; count?: number; active: boolean; onClick: () => void }> = ({ label, count, active, onClick }) => (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`
        flex h-8 items-center rounded-md px-3 transition-colors
        ${active ? 'bg-white font-semibold text-[#008F4C] shadow-sm' : 'font-medium text-[#667085] hover:bg-white/70 hover:text-[#333]'}
      `}
    >
      <span className="mr-1.5 text-[13px]">{label}</span>
      {count !== undefined && <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-[#E7F8EF] text-[#008F4C]' : 'bg-[#E5E7EB] text-[#98A2B3]'}`}>{count}</span>}
    </button>
  );

export const FormAnchor: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
   <button
      type="button"
      onClick={onClick}
      className={`
         w-full border-r-2 px-6 py-3 text-left text-[13px] font-medium transition-colors
         ${active ? 'border-[#00B460] bg-[#EDF9F3] text-[#008F4C]' : 'border-transparent text-gray-500 hover:bg-gray-50'}
      `}
   >
      {label}
   </button>
);

export const ChannelSwitch: React.FC<{ label: string; icon: React.ReactNode; active: boolean; onChange: () => void }> = ({ label, icon, active, onChange }) => (
  <div onClick={onChange} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${active ? 'border-[#00C06B] bg-[#00C06B]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
     <div className="flex items-center">
        <div className={`p-2 rounded-lg mr-3 ${active ? 'bg-[#00C06B] text-white' : 'bg-gray-100 text-gray-400'}`}>{icon}</div>
        <span className={`text-sm font-bold ${active ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
     </div>
     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-[#00C06B]' : 'border-gray-300'}`}>
        {active && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full"></div>}
     </div>
  </div>
);
