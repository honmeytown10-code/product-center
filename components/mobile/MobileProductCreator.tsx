
import React, { useMemo, useState } from 'react';
import { ChevronLeft, CupSoda, Utensils, Camera, Mic, LayoutGrid, Layers, ImageIcon, ChevronRight, CheckCircle, Loader2, Box, Package, Scale, ShoppingBag, CakeSlice, Flame, ArrowRight, X, Info } from 'lucide-react';
import { Category, AVAILABLE_DYNAMIC_FIELDS, DynamicFieldConfig } from '../../types';
import { MobileComboProductCreator } from './MobileComboProductCreator';
import { MobileStandardProductCreator } from './MobileStandardProductCreator';

type CreateStep = 'type_select' | 'photo_intro' | 'voice_intro' | 'ai_processing' | 'ai_result' | 'form' | 'success';
type CreateMode = 'manual' | 'scan' | 'voice';
type ScanSource = 'camera' | 'upload' | null;

interface AiDraftResult {
  name: string;
  basePrice: string;
  confidence: 'high' | 'medium';
  sourceMode: CreateMode;
  sourceLabel: string;
  sourceHint: string;
  transcript?: string;
  warnings: string[];
}

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
  const [scanSource, setScanSource] = useState<ScanSource>(null);
  const [voiceExample, setVoiceExample] = useState('生椰拿铁，18元');
  const [aiResult, setAiResult] = useState<AiDraftResult | null>(null);

  const handleStartCreation = (mode: CreateMode) => {
      setCreateMode(mode);
      if (mode === 'manual') return;
      setShowCategoryModal(false);
      setAiResult(null);
      setCreationFormData({});
      setCreationCategory(null);
      setCreateStep(mode === 'voice' ? 'voice_intro' : 'photo_intro');
  };

  const photoTips = [
    '请拍摄商品名称和价格都清晰可见的一页菜单',
    '建议正对菜单拍摄，避免反光、模糊和大角度倾斜',
    '单次仅支持 1 张照片，若有多页菜单请分次上传',
  ];

  const voiceExamples = [
    '生椰拿铁，18元',
    '爆浆芝士蛋糕，26元',
    '冰美式，大杯15元，中杯13元',
  ];

  const buildAiResult = (mode: CreateMode, source?: ScanSource): AiDraftResult => {
    if (mode === 'voice') {
      return {
        name: voiceExample.includes('生椰') ? '生椰拿铁' : voiceExample.includes('蛋糕') ? '爆浆芝士蛋糕' : '冰美式',
        basePrice: voiceExample.includes('26') ? '26' : voiceExample.includes('15') ? '15' : '18',
        confidence: voiceExample.includes('大杯') ? 'medium' : 'high',
        sourceMode: 'voice',
        sourceLabel: '语音录入',
        sourceHint: '已根据语音内容预填商品名称和基础售价，请重点确认价格和规格信息。',
        transcript: voiceExample,
        warnings: voiceExample.includes('大杯')
          ? ['识别到多个规格表达，当前仅预填首个价格，建议后续补充规格']
          : ['复杂做法、加料和套餐信息建议在表单中继续完善'],
      };
    }

    return {
      name: source === 'upload' ? '招牌手打柠檬茶' : '招牌杨枝甘露',
      basePrice: source === 'upload' ? '16' : '18',
      confidence: 'medium',
      sourceMode: 'scan',
      sourceLabel: source === 'upload' ? '上传照片识别' : '拍照识别',
      sourceHint: '当前仅根据单张菜单图片预填商品名称和基础售价，复杂规格和做法请继续补充。',
      warnings: [
        '已按单张菜单识别，建议核对商品名称和价格是否完整',
        '套餐、做法、加料等复杂信息暂不会自动补全',
      ],
    };
  };

  const startAiProcessing = (mode: CreateMode, source?: ScanSource) => {
    setCreateMode(mode);
    if (mode === 'scan') {
      setScanSource(source || 'camera');
      setAiProcessingState('scanning');
    } else {
      setAiProcessingState('listening');
    }
    setCreateStep('ai_processing');
    setTimeout(() => {
      setAiProcessingState('analyzing');
      setTimeout(() => {
        const result = buildAiResult(mode, source);
        setAiResult(result);
        setCreationFormData({
          name: result.name,
          basePrice: result.basePrice,
          sourceMode: result.sourceMode,
          sourceLabel: result.sourceLabel,
          sourceHint: result.sourceHint,
        });
        setCreateStep('ai_result');
      }, 1300);
    }, mode === 'voice' ? 2200 : 1800);
  };

  const handleAiConfirm = () => {
    setTargetProductType('standard');
    setCreationCategory(null);
    setCreateStep('form');
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
          setAiResult(null);
          setScanSource(null);
      } else if (createStep === 'photo_intro' || createStep === 'voice_intro' || createStep === 'ai_result') {
          setCreateStep('type_select');
          setAiResult(null);
          setScanSource(null);
      } else {
          setCreateStep(createMode === 'voice' ? 'voice_intro' : 'photo_intro');
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
                initialData={creationFormData}
            />
        );
    }

    return null;
  };

  const renderPhotoIntro = () => (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] h-full animate-in slide-in-from-right duration-300">
      <div className="px-5 pt-5 pb-3 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-black text-[#1F2129]">拍照识别快速录入</div>
            <div className="mt-1 text-xs leading-5 text-gray-500">支持拍照或上传照片，单次识别 1 张菜单图片，先生成商品草稿再继续编辑。</div>
          </div>
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Camera size={22} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-[#1F2129] mb-3">选择录入方式</div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => startAiProcessing('scan', 'camera')} className="rounded-2xl border border-[#DCEBFF] bg-[#F4F9FF] p-4 text-left active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-white text-blue-500 flex items-center justify-center mb-3 shadow-sm">
                <Camera size={18} />
              </div>
              <div className="text-sm font-black text-[#1F2129]">拍照识别</div>
              <div className="mt-1 text-[11px] leading-4 text-gray-500">现场拍一张菜单照片进行识别</div>
            </button>
            <button onClick={() => startAiProcessing('scan', 'upload')} className="rounded-2xl border border-[#E4E7EC] bg-[#FAFBFC] p-4 text-left active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-xl bg-white text-gray-600 flex items-center justify-center mb-3 shadow-sm">
                <ImageIcon size={18} />
              </div>
              <div className="text-sm font-black text-[#1F2129]">上传照片</div>
              <div className="mt-1 text-[11px] leading-4 text-gray-500">从相册选择 1 张菜单照片上传</div>
            </button>
          </div>
          <div className="mt-3 rounded-xl bg-[#FFF8E8] px-3 py-2 text-[11px] leading-5 text-[#9A6B00]">
            单次仅支持 1 张照片，识别后先生成草稿，确认无误再继续编辑商品。
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-[#1F2129] mb-3">这样拍更容易识别准确</div>
          <div className="space-y-3">
            {photoTips.map((tip, index) => (
              <div key={tip} className="flex items-start text-[12px] leading-5 text-gray-600">
                <div className="w-5 h-5 rounded-full bg-[#E6F8F0] text-[#00C06B] flex items-center justify-center text-[10px] font-black mr-3 mt-0.5 shrink-0">
                  {index + 1}
                </div>
                <div>{tip}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-[#1F2129] mb-3">识别说明</div>
          <div className="space-y-2 text-[12px] leading-5 text-gray-500">
            <div>系统当前优先识别商品名称和基础售价。</div>
            <div>规格、做法、加料、套餐等复杂信息需要进入表单后继续补充。</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVoiceIntro = () => (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] h-full animate-in slide-in-from-right duration-300">
      <div className="px-5 pt-5 pb-3 bg-white border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-black text-[#1F2129]">语音识别录入菜品</div>
            <div className="mt-1 text-xs leading-5 text-gray-500">适合快速录入简单商品，请尽量按“商品名 + 价格”方式表达，复杂规格建议后续补充。</div>
          </div>
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
            <Mic size={22} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-[#1F2129] mb-3">推荐这样说</div>
          <div className="space-y-3">
            {voiceExamples.map((item) => (
              <button
                key={item}
                onClick={() => setVoiceExample(item)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${voiceExample === item ? 'border-purple-200 bg-purple-50' : 'border-[#EEF0F3] bg-[#FAFBFC]'}`}
              >
                <div className="text-[11px] font-bold text-gray-400 mb-1">示例话术</div>
                <div className="text-sm font-bold text-[#1F2129]">{item}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-black text-[#1F2129] mb-3">使用提示</div>
          <div className="space-y-2 text-[12px] leading-5 text-gray-500">
            <div>请直接说出商品名称和价格，语速尽量平稳。</div>
            <div>如果包含多个规格，系统只会先预填一个价格，建议稍后补充规格设置。</div>
            <div>移动端当前不做类目匹配，识别后会先进入商品编辑页继续完善。</div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 p-4">
        <button onClick={() => startAiProcessing('voice')} className="w-full rounded-2xl bg-[#1F2129] py-4 text-sm font-black text-white active:scale-[0.98] transition-transform">
          开始语音录入
        </button>
      </div>
    </div>
  );

  const renderAiOverlay = () => ( 
    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-in fade-in"> 
        <div className="relative mb-8"> 
            {aiProcessingState === 'listening' && ( <div className="w-32 h-32 rounded-full border-4 border-purple-500/50 flex items-center justify-center animate-pulse"> <Mic size={48} className="text-white"/> <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-ping opacity-50"></div> </div> )} 
            {aiProcessingState === 'scanning' && ( <div className="w-64 h-40 border-2 border-blue-500/50 rounded-xl relative overflow-hidden bg-gray-800"> <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] animate-[scan_2s_ease-in-out_infinite]"></div> <div className="flex items-center justify-center h-full text-gray-500"><ImageIcon size={32}/></div> </div> )} 
            {aiProcessingState === 'analyzing' && ( <div className="w-20 h-20"> <Loader2 size={80} className="text-[#00C06B] animate-spin"/> </div> )} 
        </div> 
        <h3 className="text-white text-xl font-bold mb-2"> {aiProcessingState === 'listening' ? '正在聆听...' : aiProcessingState === 'scanning' ? (scanSource === 'upload' ? '正在读取照片...' : '正在扫描菜单...') : 'AI 智能解析中...'} </h3> 
        <p className="text-gray-400 text-sm text-center px-10 leading-6"> {aiProcessingState === 'listening' ? '请按“商品名称 + 价格”方式描述，例如：生椰拿铁，18元' : aiProcessingState === 'scanning' ? (scanSource === 'upload' ? '正在识别您上传的菜单照片，请稍候' : '请保持菜单名称和价格清晰，系统正在提取文字内容') : '正在生成可编辑的商品草稿，识别完成后需要您确认'} </p> 
        <button onClick={() => setCreateStep('type_select')} className="mt-12 text-gray-500 text-sm">取消</button> 
        <style>{` @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } } `}</style> 
    </div> 
  );

  const resultBadgeClass = useMemo(() => (
    aiResult?.sourceMode === 'voice'
      ? 'bg-purple-50 text-purple-600'
      : 'bg-blue-50 text-blue-600'
  ), [aiResult]);

  const renderAiResult = () => {
    if (!aiResult) return null;

    return (
      <div className="flex-1 flex flex-col bg-[#F5F6FA] h-full animate-in slide-in-from-right duration-300">
        <div className="bg-white px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-black text-[#1F2129]">识别结果确认</div>
              <div className="mt-1 text-xs leading-5 text-gray-500">系统已生成 1 条商品草稿，请先确认商品名称和价格，再进入编辑页继续完善。</div>
            </div>
            <div className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${resultBadgeClass}`}>
              {aiResult.sourceLabel}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-black text-[#1F2129]">商品草稿</div>
              <div className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${aiResult.confidence === 'high' ? 'bg-[#E6F8F0] text-[#00A862]' : 'bg-[#FFF4E5] text-[#C27A00]'}`}>
                {aiResult.confidence === 'high' ? '识别较稳定' : '建议重点确认'}
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow label="商品名称" value={aiResult.name} />
              <InfoRow label="基础售价" value={`${aiResult.basePrice} 元`} />
              {aiResult.transcript && <InfoRow label="识别原话" value={aiResult.transcript} />}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-sm font-black text-[#1F2129] mb-3">识别提醒</div>
            <div className="space-y-2">
              {aiResult.warnings.map((warning) => (
                <div key={warning} className="rounded-xl bg-[#FFF8E8] px-3 py-2 text-[11px] leading-5 text-[#9A6B00]">
                  {warning}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-sm font-black text-[#1F2129] mb-2">进入编辑页后你还可以继续补充</div>
            <div className="flex flex-wrap gap-2">
              {['商品主图', '销售渠道', '规格价格', '做法/加料', '展示信息'].map((item) => (
                <div key={item} className="rounded-full bg-[#F5F6FA] px-3 py-1.5 text-[11px] font-bold text-gray-500">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-gray-100 p-4 space-y-3">
          <button onClick={handleAiConfirm} className="w-full rounded-2xl bg-[#00C06B] py-4 text-sm font-black text-white active:scale-[0.98] transition-transform">
            确认并继续编辑
          </button>
          <button onClick={() => setCreateStep(createMode === 'voice' ? 'voice_intro' : 'photo_intro')} className="w-full rounded-2xl bg-gray-100 py-4 text-sm font-black text-gray-600 active:scale-[0.98] transition-transform">
            重新识别
          </button>
        </div>
      </div>
    );
  };

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
        {createStep === 'photo_intro' && renderPhotoIntro()}
        {createStep === 'voice_intro' && renderVoiceIntro()}
        {createStep === 'ai_result' && renderAiResult()}
        {createStep === 'form' && renderCreationForm()}
        
        {renderCategoryModal()}
        
        {createStep === 'ai_processing' && renderAiOverlay()}
        {createStep === 'success' && renderSuccess()}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl bg-[#FAFBFC] px-3 py-3">
    <div className="text-[12px] font-bold text-gray-500">{label}</div>
    <div className="text-right text-[13px] font-black text-[#1F2129] leading-5">{value}</div>
  </div>
);
