import React from 'react';
import { ArrowRight, CheckCircle2, CircleDashed } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  domain: string;
  plannedUnits: string[];
  onBack?: () => void;
}

export const WebPendingDesignPage: React.FC<Props> = ({
  title,
  description,
  domain,
  plannedUnits,
  onBack,
}) => (
  <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA] p-4">
    <div className="mb-3 flex shrink-0 items-center justify-between">
      <div>
        <div className="mb-1 text-[12px] text-[#98A2B3]">{domain}</div>
        <h1 className="text-[20px] font-bold text-[#1D2129]">{title}</h1>
        <p className="mt-1 text-[13px] text-[#86909C]">{description}</p>
      </div>
      {onBack && <button type="button" onClick={onBack} className="h-9 rounded-md border border-[#D9DDE2] bg-white px-4 text-[13px] text-[#4E5969]">返回工作台</button>}
    </div>
    <section className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-[#E5E6EB] bg-white">
      <div className="w-[560px] max-w-[80%]">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#EAF8F1] text-[#008F4C]"><CircleDashed size={24} /></span>
        <h2 className="text-[18px] font-bold text-[#1D2129]">该页面尚未进入高保真优化批次</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#667085]">菜单入口已按确认后的信息架构恢复；现有业务能力不会被虚构字段替代。后续会基于原功能逐字段、逐按钮和逐弹窗完成。</p>
        <div className="mt-5 overflow-hidden rounded-lg border border-[#E5E6EB]">
          {plannedUnits.map((item, index) => <div key={item} className={`flex min-h-[48px] items-center gap-3 px-4 text-[13px] text-[#4E5969] ${index > 0 ? 'border-t border-[#F0F0F0]' : ''}`}><CheckCircle2 size={16} className="shrink-0 text-[#00B460]" />{item}<ArrowRight size={14} className="ml-auto text-[#C9CDD4]" /></div>)}
        </div>
      </div>
    </section>
  </main>
);
