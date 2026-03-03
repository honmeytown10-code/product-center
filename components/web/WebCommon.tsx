
import React from 'react';
import { Plus, ChevronDown, Check } from 'lucide-react';

export const Switch: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <div onClick={onClick} className={`w-11 h-6 rounded-full relative cursor-pointer transition-all ${active ? 'bg-[#00C06B]' : 'bg-gray-300'}`}>
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`}></div>
  </div>
);

export const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
    {icon && <div className="mr-3 text-[#00C06B] opacity-80">{icon}</div>}
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

export const FormRow: React.FC<{ label: string; required?: boolean; description?: string; children: React.ReactNode }> = ({ label, required, description, children }) => (
  <div className="flex flex-col space-y-2">
    <div className="flex justify-between items-baseline">
      <label className="text-[13px] font-bold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && <span className="text-[11px] text-gray-400 font-medium">{description}</span>}
    </div>
    {children}
  </div>
);

export const SidebarItem: React.FC<{ label: string; active?: boolean; onClick?: () => void }> = ({ label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      px-6 py-2.5 text-[13px] font-medium cursor-pointer transition-all border-r-[3px]
      ${active ? 'text-[#00C06B] bg-[#00C06B]/5 border-[#00C06B]' : 'text-[#666] hover:bg-gray-50 hover:text-[#333] border-transparent'}
    `}
  >
    {label}
  </div>
);

export const TabItem: React.FC<{ label: string; count?: number; active: boolean; onClick: () => void }> = ({ label, count, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      h-full flex items-center px-2 cursor-pointer border-b-[3px] transition-all relative
      ${active ? 'border-[#00C06B] text-[#00C06B] font-bold' : 'border-transparent text-[#666] hover:text-[#333]'}
    `}
  >
    <span className="text-[13px] mr-1.5">{label}</span>
    {count !== undefined && <span className={`text-[10px] px-1.5 rounded-full ${active ? 'bg-[#00C06B] text-white' : 'bg-gray-100 text-gray-400'}`}>{count}</span>}
  </div>
);

export const FormAnchor: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
   <div 
      onClick={onClick}
      className={`
         px-6 py-3 text-[13px] font-medium cursor-pointer transition-all border-r-2
         ${active ? 'text-[#00C06B] border-[#00C06B] bg-[#00C06B]/5' : 'text-gray-500 border-transparent hover:bg-gray-50'}
      `}
   >
      {label}
   </div>
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
