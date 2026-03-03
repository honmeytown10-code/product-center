
import React, { useState } from 'react';
import { ChevronLeft, CupSoda, Utensils, Camera, Mic, LayoutGrid, Layers, ImageIcon, ChevronRight, CheckCircle, Loader2, Box, Package, Scale, ShoppingBag, CakeSlice, Flame, ArrowRight, X, Info } from 'lucide-react';
import { Category, AVAILABLE_DYNAMIC_FIELDS, DynamicFieldConfig } from '../../types';
import { MobileComboProductCreator } from './MobileComboProductCreator';
import { MobileStandardProductCreator } from './MobileStandardProductCreator';

type CreateStep = 'type_select' | 'form' | 'ai_processing' | 'success';
type CreateMode = 'manual' | 'scan' | 'voice';

interface Props {
  onBack: () => void;
  categories: Category[];
}

// Optimized Category Definitions with Descriptions
const CREATION_CATEGORIES = {
  standard: [
    { id: 'sc_1', name: '通用菜品', icon: <Utensils/>, desc: '热菜、凉菜、小吃' },
    { id: 'sc_2', name: '现制饮品', icon: <CupSoda/>, desc: '奶茶、咖啡、果汁' },
    { id: 'sc_3', name: '称重商品', icon: <Scale/>, desc: '海鲜、麻辣烫' },
    { id: 'sc_4', name: '蛋糕/烘焙', icon: <CakeSlice/>, desc: '面包、甜点、整糕' },
    { id: 'sc_5', name: '零售商品', icon: <ShoppingBag/>, desc: '预包装零食、饮料' },
  ],
  combo: [
    { id: 'cc_1', name: '通用套餐', icon: <Utensils/>, desc: '超值午餐、多人餐' },
    { id: 'cc_2', name: '饮品套餐', icon: <CupSoda/>, desc: '双杯优惠、下午茶' },
    { id: 'cc_3', name: '烘焙套餐', icon: <CakeSlice/>, desc: '甜点搭配' },
    { id: 'cc_4', name: '零售套餐', icon: <ShoppingBag/>, desc: '礼盒、组合装' },
    { id: 'cc_5', name: '火锅锅底', icon: <Flame/>, desc: '鸳鸯锅、九宫格' },
  ]
};

export const MobileProductCreator: React.FC<Props> = ({ onBack, categories }) => {
  const [createStep, setCreateStep] = useState<CreateStep>('type_select');
  const [createMode, setCreateMode] = useState<CreateMode>('manual');
  const [targetProductType, setTargetProductType] = useState<'standard' | 'combo'>('standard');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [creationCategory, setCreationCategory] = useState<{ id: string, name: string } | null>(null);
  const [creationFormData, setCreationFormData] = useState<Record<string, any>>({});
  const [aiProcessingState, setAiProcessingState] = useState<'idle' | 'listening' | 'scanning' | 'analyzing'>('idle');

  const handleStartCreation = (mode: CreateMode) => {
      setCreateMode(mode);
      if (mode === 'manual') { /* No op */ } else {
          setAiProcessingState(mode === 'voice' ? 'listening' : 'scanning');
          setCreateStep('ai_processing');
          setTimeout(() => {
              setAiProcessingState('analyzing');
              setTimeout(() => {
                  const mockData = mode === 'voice' ? { p_name: '语音识别拿铁', s_price: '28', p_unit: '杯' } : { p_name: 'OCR识别菜单A', s_price: '58', p_unit: '份' };
                  setCreationFormData(mockData);
                  setCreationCategory({ id: 'sc_2', name: '现制饮品' });
                  setCreateStep('form');
              }, 1500);
          }, 2000);
      }
  };

  const handleTypeSelect = (type: 'standard' | 'combo') => {
      setTargetProductType(type);
      setShowCategoryModal(true);
  };

  const handleCategorySelect = (cat: any) => {
      setCreationCategory({ id: cat.id, name: cat.name });
      setShowCategoryModal(false);
      setCreateStep('form');
  };

  const handleBack = () => {
      if (createStep === 'type_select') {
          onBack();
      } else if (createStep === 'form') {
          setCreateStep('type_select');
          setCreationFormData({});
      } else {
          onBack();
      }
  };

  const renderTypeSelection = () => {
      return (
          <div className="flex-1 flex flex-col bg-white relative h-full animate-in slide-in-from-right duration-300">
              <div className="px-6 py-4">
                  {/* Removed instruction text as requested */}
              </div>

              <div className="flex-1 px-6 space-y-4 overflow-y-auto">
                  <div 
                      onClick={() => handleTypeSelect('standard')}
                      className="bg-[#F5F9F7] border-2 border-transparent active:border-[#00C06B] p-6 rounded-[24px] flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] group relative overflow-hidden h-32"
                  >
                      <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                          <CupSoda size={120} />
                      </div>
                      <div className="flex items-center relative z-10">
                          <div className="w-14 h-14 bg-[#E6F8F0] rounded-2xl flex items-center justify-center text-[#00C06B] mr-5 shadow-sm group-active:scale-110 transition-transform">
                              <CupSoda size={28} strokeWidth={2.5} />
                          </div>
                          <div>
                              <h4 className="text-lg font-black text-[#1F2129] mb-1">标准商品</h4>
                              <p className="text-xs text-gray-500 font-medium">单品，如咖啡、面包、零售品</p>
                          </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-300 group-active:text-[#00C06B] shadow-sm relative z-10">
                          <ArrowRight size={18} />
                      </div>
                  </div>

                  <div 
                      onClick={() => handleTypeSelect('combo')}
                      className="bg-[#FFF8F5] border-2 border-transparent active:border-orange-500 p-6 rounded-[24px] flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] group relative overflow-hidden h-32"
                  >
                      <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                          <Utensils size={120} />
                      </div>
                      <div className="flex items-center relative z-10">
                          <div className="w-14 h-14 bg-[#FFF0E6] rounded-2xl flex items-center justify-center text-orange-500 mr-5 shadow-sm group-active:scale-110 transition-transform">
                              <Utensils size={28} strokeWidth={2.5} />
                          </div>
                          <div>
                              <h4 className="text-lg font-black text-[#1F2129] mb-1">套餐商品</h4>
                              <p className="text-xs text-gray-500 font-medium">组合，如双人餐、超值午餐</p>
                          </div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-300 group-active:text-orange-500 shadow-sm relative z-10">
                          <ArrowRight size={18} />
                      </div>
                  </div>
              </div>

              {/* AI Entry - Bottom */}
              <div className="px-6 pb-10 pt-4 bg-white">
                 <div className="flex items-center justify-center mb-5 opacity-60">
                    <span className="h-px bg-gray-200 w-12"></span>
                    <span className="mx-3 text-[10px] font-bold text-gray-400 tracking-wider">AI 智能辅助录入</span>
                    <span className="h-px bg-gray-200 w-12"></span>
                 </div>
                 <div className="flex space-x-4">
                    <button onClick={() => handleStartCreation('scan')} className="flex-1 bg-white border border-gray-200 text-gray-600 py-4 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center group">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-2 group-active:bg-blue-100 transition-colors">
                            <Camera size={16} className="text-blue-500"/>
                        </div>
                        拍照识别
                    </button>
                    <button onClick={() => handleStartCreation('voice')} className="flex-1 bg-white border border-gray-200 text-gray-600 py-4 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center group">
                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mr-2 group-active:bg-purple-100 transition-colors">
                            <Mic size={16} className="text-purple-500"/>
                        </div>
                        语音录入
                    </button>
                 </div>
              </div>
          </div>
      );
  };

  const renderCategoryModal = () => {
      if (!showCategoryModal) return null;
      const activeCategoryList = CREATION_CATEGORIES[targetProductType];
      const isStandard = targetProductType === 'standard';

      return (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in duration-200">
              <div className="flex-1" onClick={() => setShowCategoryModal(false)}></div>
              <div className="bg-white rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300 pb-10 shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                      <div>
                          <h3 className="text-xl font-black text-[#1F2129]">选择所属类目</h3>
                          <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-400 mr-1">当前正在创建:</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isStandard ? 'bg-green-50 text-[#00C06B]' : 'bg-orange-50 text-orange-500'}`}>
                                  {isStandard ? '标准商品' : '套餐商品'}
                              </span>
                          </div>
                      </div>
                      <button onClick={() => setShowCategoryModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={20}/></button>
                  </div>

                  <div className="mb-4 px-3 py-2.5 bg-gray-50 rounded-xl text-xs text-gray-500 font-medium flex items-start shrink-0">
                      <Info size={14} className="mr-2 mt-0.5 text-blue-500 shrink-0"/>
                      请选择您要创建的商品类目，不同类目可管理不同的商品属性
                  </div>

                  <div className="grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar pb-6">
                      {activeCategoryList.map((cat) => (
                          <div 
                              key={cat.id} 
                              onClick={() => handleCategorySelect(cat)} 
                              className="flex flex-col items-center justify-center py-4 px-2 bg-[#F8FAFB] rounded-2xl border border-transparent active:border-[#00C06B] active:bg-[#00C06B]/5 cursor-pointer min-h-[110px] transition-all hover:bg-gray-50"
                          >
                              <div className={`mb-2 p-2.5 rounded-2xl ${isStandard ? 'bg-white text-[#00C06B] shadow-sm' : 'bg-white text-orange-500 shadow-sm'}`}>
                                  {/* Fix: cast icon to any to avoid prop errors with cloneElement on unknown ReactElement */}
                                  {React.cloneElement(cat.icon as React.ReactElement<any>, { size: 24, strokeWidth: 2.5 })}
                              </div>
                              <span className="font-bold text-sm text-gray-800 text-center mb-0.5">{cat.name}</span>
                              <span className="text-[10px] text-gray-400 text-center leading-tight px-1">{cat.desc}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const renderCreationForm = () => {
    // If it's a combo product, use the optimized MobileComboProductCreator
    if (targetProductType === 'combo') {
        return (
            <MobileComboProductCreator 
                onBack={handleBack} 
                categories={categories} 
                categoryName={creationCategory?.name} 
            />
        );
    }
    
    // If it's a standard product, use the newly optimized MobileStandardProductCreator
    if (targetProductType === 'standard') {
        return (
            <MobileStandardProductCreator 
                onBack={handleBack} 
                categories={categories} 
                categoryName={creationCategory?.name} 
            />
        );
    }

    return null;
  };

  const renderAiOverlay = () => ( 
    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-in fade-in"> 
        <div className="relative mb-8"> 
            {aiProcessingState === 'listening' && ( <div className="w-32 h-32 rounded-full border-4 border-purple-500/50 flex items-center justify-center animate-pulse"> <Mic size={48} className="text-white"/> <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-ping opacity-50"></div> </div> )} 
            {aiProcessingState === 'scanning' && ( <div className="w-64 h-40 border-2 border-blue-500/50 rounded-xl relative overflow-hidden bg-gray-800"> <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] animate-[scan_2s_ease-in-out_infinite]"></div> <div className="flex items-center justify-center h-full text-gray-500"><ImageIcon size={32}/></div> </div> )} 
            {aiProcessingState === 'analyzing' && ( <div className="w-20 h-20"> <Loader2 size={80} className="text-[#00C06B] animate-spin"/> </div> )} 
        </div> 
        <h3 className="text-white text-xl font-bold mb-2"> {aiProcessingState === 'listening' ? '正在聆听...' : aiProcessingState === 'scanning' ? '正在扫描...' : 'AI 智能解析中...'} </h3> 
        <p className="text-gray-400 text-sm"> {aiProcessingState === 'listening' ? '请描述商品名称和价格' : aiProcessingState === 'scanning' ? '请对准菜单或小票' : '正在提取关键信息填入表单'} </p> 
        <button onClick={() => setCreateStep('type_select')} className="mt-12 text-gray-500 text-sm">取消</button> 
        <style>{` @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } } `}</style> 
    </div> 
  );

  const renderSuccess = () => ( 
    <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 animate-in zoom-in-95"> 
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6"> <CheckCircle size={48} className="text-[#00C06B]"/> </div> 
        <h2 className="text-2xl font-black text-[#1F2129] mb-2">创建成功</h2> 
        <p className="text-gray-500 text-center mb-8">商品已添加至门店库，您可以继续完善详细信息。</p> 
        <div className="flex flex-col w-full space-y-3"> 
            <button onClick={onBack} className="w-full py-4 bg-[#1F2129] text-white rounded-xl font-bold">查看商品列表</button> 
            <button onClick={() => { setCreateStep('type_select'); setCreationFormData({}); }} className="w-full py-4 bg-gray-50 text-gray-600 rounded-xl font-bold">继续创建</button> 
        </div> 
    </div> 
  );

  return (
    <div className="flex-1 flex flex-col bg-white relative h-full">
        {/* Fix: removed redundant ternary in title because createStep narrowed by condition */}
        {createStep !== 'form' && (
            <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 relative z-20 bg-white">
                <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 hover:text-black"><ChevronLeft size={24}/></button>
                <span className="font-bold text-lg text-[#1F2129]">
                    {'新建商品'}
                </span>
                <div className="w-8"></div>
            </div>
        )}

        {createStep === 'type_select' && renderTypeSelection()}
        {createStep === 'form' && renderCreationForm()}
        
        {renderCategoryModal()}
        
        {createStep === 'ai_processing' && renderAiOverlay()}
        {createStep === 'success' && renderSuccess()}
    </div>
  );
};
