
import React from 'react';
import { ChevronRight } from 'lucide-react';

export const SectionHeader: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
   <div className="mb-12">
      <h4 className="text-3xl font-black text-gray-800 tracking-tight">{title}</h4>
      <p className="text-[15px] text-gray-400 font-medium mt-2 leading-relaxed">{desc}</p>
   </div>
);

export const FormRow: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required }) => (
   <div className="flex flex-col space-y-4">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">
         {label}
         {required && <span className="text-red-500 ml-1.5 text-lg leading-none">*</span>}
      </label>
      {children}
   </div>
);

export const Radio: React.FC<{ active: boolean; children: React.ReactNode; onClick: () => void }> = ({ active, children, onClick }) => (
   <div onClick={onClick} className="flex items-center cursor-pointer group bg-gray-50/50 p-6 rounded-[28px] border-2 border-transparent hover:border-gray-100 transition-all flex-1 min-h-[90px]">
      <div className={`w-6 h-6 rounded-full border-2 mr-5 flex items-center justify-center transition-all shrink-0 ${active ? 'border-orange-500' : 'border-gray-300'}`}>
         {active && <div className="w-3 h-3 bg-orange-500 rounded-full shadow-lg"></div>}
      </div>
      <div className={`text-[13px] font-bold leading-relaxed ${active ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-600'}`}>{children}</div>
   </div>
);

export const Switch: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
   <div onClick={onClick} className={`w-14 h-8 rounded-full relative cursor-pointer transition-all ${active ? 'bg-blue-500 shadow-md shadow-blue-100' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${active ? 'left-7' : 'left-1'}`}></div>
   </div>
);

export const NavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <div 
    onClick={onClick}
    className={`px-5 py-4 rounded-2xl flex items-center cursor-pointer transition-all border-l-[6px] mx-2 ${active ? 'bg-orange-500/10 text-white font-black border-orange-500 shadow-xl' : 'text-gray-500 hover:bg-white/5 hover:text-white border-transparent'}`}
  >
    <div className={`mr-4 transition-colors ${active ? 'text-orange-500' : 'text-gray-500'}`}>{icon}</div>
    <span className="text-[14px] tracking-tight">{label}</span>
    {active && <ChevronRight size={14} className="ml-auto text-orange-500 animate-in slide-in-from-left-2"/>}
  </div>
);

export const EditAnchor: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
   <div 
      onClick={onClick}
      className={`px-8 py-5 text-[14px] cursor-pointer flex items-center border-r-[6px] transition-all ${active ? 'bg-white text-orange-600 font-black border-orange-500 shadow-sm' : 'text-gray-400 border-transparent hover:bg-gray-50 hover:pl-10'}`}
   >
      <div className={`mr-4 transition-colors ${active ? 'text-orange-600' : 'text-gray-300'}`}>{icon}</div>
      {label}
   </div>
);
