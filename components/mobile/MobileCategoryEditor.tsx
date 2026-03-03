import React, { useState } from 'react';
import { X, ChevronDown, Check, Plus, ChevronRight, Smartphone, Store, ShoppingBag, Printer, LayoutGrid, Info, Trash2, Calendar, Clock, Minus, Layers } from 'lucide-react';
import { LocalCategory, ChannelType } from './types';
import { MobileCategoryTimeEditor } from './MobileCategoryTimeEditor';
import { MobileCategoryChannelSelector } from './MobileCategoryChannelSelector';
import { MobileCategoryRequiredGroupEditor, RequiredGroupConfig } from './MobileCategoryRequiredGroupEditor';

interface Props {
  item?: LocalCategory;
  onBack: () => void;
  onSave: (data: Partial<LocalCategory>) => void;
  onDelete?: () => void;
}

export const MobileCategoryEditor: React.FC<Props> = ({ item, onBack, onSave, onDelete }) => {
  const isEdit = !!item;
  
  // Sub-page states
  const [subPage, setSubPage] = useState<'none' | 'time' | 'display_channels' | 'sales_channels' | 'required_group'>('none');

  // Form State
  const [name, setName] = useState(item?.name || '');
  const [isBasicExpanded, setIsBasicExpanded] = useState(false);
  const [description, setDescription] = useState(item?.description || '');
  const [remark, setRemark] = useState('');

  // Channel States
  const [displayChannels, setDisplayChannels] = useState<string[]>(
    (item?.channels as string[]) || ['mini_wechat', 'mini_alipay', 'mini_douyin', 'app_pos', 'h5']
  );
  const [salesChannels, setSalesChannels] = useState<string[]>(['pos', 'mini_dine', 'mini_take', 'mini_mall']);

  // Time Config State
  const [listingTimeType, setListingTimeType] = useState<'all' | 'custom'>('all');
  const [customTimeConfig, setCustomTimeConfig] = useState<any>({
    startDate: '',
    endDate: '',
    days: [1, 2, 3, 4, 5, 6, 7],
    timeRanges: [{ start: '00:00:00', end: '23:59:59' }]
  });

  // Required Group State
  const [requiredGroupConfig, setRequiredGroupConfig] = useState<RequiredGroupConfig>({
    enabled: false,
    dineIn: { required: true, limit: 0 },
    takeaway: { required: true, limit: 0 }
  });

  // Advanced toggles
  const [backendOnly, setBackendOnly] = useState(false);
  const [noIndividualOrder, setNoIndividualOrder] = useState(false);
  const [queueMode, setQueueMode] = useState<'enter' | 'none'>('enter');
  const [limitRule, setLimitRule] = useState<'participate' | 'none'>('participate');

  const handleSave = () => {
    if (!name || displayChannels.length === 0) return;
    onSave({
      name,
      channels: displayChannels as ChannelType[],
      description,
    });
  };

  if (subPage === 'time') {
    return <MobileCategoryTimeEditor config={customTimeConfig} onBack={() => setSubPage('none')} onSave={(next) => { setCustomTimeConfig(next); setSubPage('none'); }} />;
  }

  if (subPage === 'display_channels') {
    return <MobileCategoryChannelSelector title="选择展示渠道" selected={displayChannels} onBack={() => setSubPage('none')} onSave={(next) => { setDisplayChannels(next); setSubPage('none'); }} type="display" />;
  }

  if (subPage === 'sales_channels') {
    return <MobileCategoryChannelSelector title="选择售卖渠道" selected={salesChannels} onBack={() => setSubPage('none')} onSave={(next) => { setSalesChannels(next); setSubPage('none'); }} type="sales" />;
  }

  if (subPage === 'required_group') {
    return (
      <MobileCategoryRequiredGroupEditor 
        config={requiredGroupConfig} 
        onBack={() => setSubPage('none')} 
        onSave={(next) => { setRequiredGroupConfig(next); setSubPage('none'); }} 
      />
    );
  }

  return (
    <div className="absolute inset-0 z-[150] flex flex-col bg-[#F5F6FA] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-[56px] bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0 z-50">
        <h3 className="text-[17px] font-black text-[#1F2129]">{isEdit ? '编辑分类' : '新建分类'}</h3>
        <button onClick={onBack} className="p-2 -mr-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 p-3 pb-32">
        
        {/* Section 1: 基本信息 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-6">
          <h4 className="font-black text-base text-gray-800 border-l-[3px] border-[#00C06B] pl-2 leading-none">基本信息</h4>
          
          <FormRow label="分类名称" required>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-[#F8F9FB] border border-transparent rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-[#00C06B] transition-all" 
              placeholder="请输入分类名称"
            />
          </FormRow>

          <NavRow label="展示渠道" required value={`已选 ${displayChannels.length} 个`} onClick={() => setSubPage('display_channels')} />
          <NavRow label="售卖渠道" required value={`已选 ${salesChannels.length} 个`} onClick={() => setSubPage('sales_channels')} />

          <FormRow label="上架时间" required>
            <div className="flex space-x-8 pt-2">
              <RadioOption label="全时段售卖" active={listingTimeType === 'all'} onClick={() => setListingTimeType('all')}/>
              <RadioOption label="自定义时间" active={listingTimeType === 'custom'} onClick={() => setListingTimeType('custom')}/>
            </div>
          </FormRow>

          {listingTimeType === 'custom' && (
            <div 
              onClick={() => setSubPage('time')}
              className="bg-[#F8F9FB] rounded-xl p-4 flex items-center justify-between cursor-pointer active:bg-gray-100 transition-all animate-in fade-in slide-in-from-top-2"
            >
              <div className="flex items-center space-x-3">
                <Calendar size={16} className="text-[#00C06B]" />
                <div className="text-xs font-bold text-gray-600">
                   {customTimeConfig.startDate || '未设置日期'} - {customTimeConfig.endDate || '未设置日期'}
                   <div className="mt-1 text-[10px] text-gray-400 font-medium">包含 {customTimeConfig.timeRanges.length} 个时间段</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          )}

          {isBasicExpanded && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="h-px bg-gray-50 my-2"></div>
              <FormRow label="分类描述">
                <input 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full bg-[#F8F9FB] border border-transparent rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-[#00C06B] transition-all" 
                  placeholder="请输入分类描述"
                />
              </FormRow>
              <FormRow label="分类备注">
                <input 
                  value={remark} 
                  onChange={e => setRemark(e.target.value)} 
                  className="w-full bg-[#F8F9FB] border border-transparent rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:bg-white focus:border-[#00C06B] transition-all" 
                  placeholder="请输入分类备注"
                />
              </FormRow>
              <FormRow label="分类图标" description="建议图标尺寸：180px * 180px">
                <div className="w-16 h-16 bg-[#F8F9FB] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                  <Plus size={20} />
                </div>
              </FormRow>
              <FormRow label="分类banner" description="建议图片尺寸：530px * 150px">
                <div className="w-full h-24 bg-[#F8F9FB] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                  <Plus size={20} />
                </div>
              </FormRow>

              {/* Category Settings now inside the expanded area */}
              <div className="pt-6 border-t border-gray-50 space-y-6">
                <h4 className="font-black text-base text-gray-800 border-l-[3px] border-[#00C06B] pl-2 leading-none">分类设置</h4>
                
                <SwitchRow label="仅在后台展示此分组" active={backendOnly} onClick={() => setBackendOnly(!backendOnly)}/>
                <SwitchRow label="不可单独下单" active={noIndividualOrder} onClick={() => setNoIndividualOrder(!noIndividualOrder)}/>
                
                <NavRow 
                  label="必选分组" 
                  value={requiredGroupConfig.enabled ? '已开启' : '未开启'} 
                  onClick={() => setSubPage('required_group')} 
                />

                <FormRow label="排队取餐">
                  <div className="flex space-x-8">
                    <RadioOption label="进入排队" active={queueMode === 'enter'} onClick={() => setQueueMode('enter')}/>
                    <RadioOption label="不进入排队" active={queueMode === 'none'} onClick={() => setQueueMode('none')}/>
                  </div>
                </FormRow>

                <FormRow label="订单购买限制">
                  <div className="flex space-x-8">
                    <RadioOption label="参与" active={limitRule === 'participate'} onClick={() => setLimitRule('participate')}/>
                    <RadioOption label="不参与" active={limitRule === 'none'} onClick={() => setLimitRule('none')}/>
                  </div>
                </FormRow>
              </div>
            </div>
          )}

          <button 
            onClick={() => setIsBasicExpanded(!isBasicExpanded)}
            className="w-full py-2 flex items-center justify-center text-[#00C06B] text-xs font-black space-x-1 pt-4 mt-2"
          >
            <span>{isBasicExpanded ? '收起更多设置' : '展开更多设置'}</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isBasicExpanded ? 'rotate-180' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-10 flex gap-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] items-center">
        {isEdit && onDelete && (
          <button 
            onClick={onDelete}
            className="flex flex-col items-center justify-center px-4 py-2 text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-95"
          >
            <Trash2 size={24} className="mb-0.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">删除分类</span>
          </button>
        )}
        <button 
          onClick={handleSave} 
          disabled={!name || displayChannels.length === 0}
          className={`flex-1 h-[52px] rounded-2xl text-[15px] font-black transition-all active:scale-[0.98] shadow-lg flex items-center justify-center ${name && displayChannels.length > 0 ? 'bg-[#00C06B] text-white shadow-green-100' : 'bg-gray-200 text-gray-400'}`}
        >
          保存
        </button>
      </div>
    </div>
  );
};

const FormRow = ({ label, required, description, children }: { label: string, required?: boolean, description?: string, children?: React.ReactNode }) => (
  <div className="flex flex-col space-y-2.5">
    <div className="flex justify-between items-baseline">
      <label className="text-[13px] font-black text-[#5C6173]">{label} {required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {description && <span className="text-[10px] text-gray-400 font-bold">{description}</span>}
    </div>
    {children}
  </div>
);

const NavRow = ({ label, required, value, onClick }: any) => (
  <div onClick={onClick} className="flex justify-between items-center py-3 border-b border-gray-50 cursor-pointer active:bg-gray-50 transition-colors">
     <label className="text-sm font-bold text-gray-700">{label} {required && <span className="text-red-500 ml-0.5">*</span>}</label>
     <div className="flex items-center space-x-1">
        <span className="text-sm font-bold text-[#1F2129]">{value}</span>
        <ChevronRight size={16} className="text-gray-300" />
     </div>
  </div>
);

const RadioOption = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <label className="flex items-center space-x-3 cursor-pointer group" onClick={onClick}>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-[#00C06B]' : 'border-gray-300'}`}>
      {active && <div className="w-2.5 h-2.5 bg-[#00C06B] rounded-full animate-in zoom-in-50"></div>}
    </div>
    <span className={`text-sm font-black transition-colors ${active ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
  </label>
);

const SwitchRow = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm font-black text-gray-700">{label}</span>
    <div 
      onClick={onClick}
      className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${active ? 'bg-[#00C06B]' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${active ? 'left-6' : 'left-1'}`}></div>
    </div>
  </div>
);