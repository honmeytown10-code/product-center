import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Store, ShoppingBag, Database, Layers, CheckCircle2, 
  Info, Download, FileUp, ChevronRight, X, Check, ArrowLeft, 
  CupSoda, Utensils, Scale, CakeSlice, Flame, Loader2, CloudUpload, FileText
} from 'lucide-react';
import { Category } from '../../types';
import { WebImportReviewModal } from './WebImportReviewModal';

// --- Import Modal ---
type ImportSource = 'local' | 'external';
type ImportStep = 'source' | 'analyzing' | 'review';

const IMPORT_SOURCES: { id: ImportSource; name: string; icon: React.ReactNode; desc: string; color: string; disabled?: boolean; tag?: string }[] = [
  { id: 'local', name: '本地标准导入', icon: <FileSpreadsheet size={24}/>, desc: '按系统模板填写并导入', color: 'text-green-600 bg-green-50' },
  { id: 'external', name: '三方平台导入', icon: <CloudUpload size={24}/>, desc: '自动识别美团/饿了么/淘宝等文件', color: 'text-blue-600 bg-blue-50', disabled: true, tag: '敬请期待' },
];

export const WebImportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [importSource, setImportSource] = useState<ImportSource>('local');
  const [step, setStep] = useState<ImportStep>('source');

  const handleStartAnalysis = () => {
    setStep('analyzing');
    // Simulate API delay
    setTimeout(() => {
        setStep('review');
    }, 2000);
  };

  const handleFinalConfirm = () => {
      alert('导入成功！商品已加入商品库。');
      onClose();
  };

  if (step === 'analyzing') {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] shadow-2xl w-[400px] p-10 flex flex-col items-center justify-center animate-in zoom-in-95">
                <Loader2 size={48} className="text-[#00C06B] animate-spin mb-6"/>
                <h3 className="text-lg font-black text-[#1F2129] mb-2">正在解析文件...</h3>
                <p className="text-xs text-gray-400 text-center">系统正在识别商品、分类及规格信息<br/>请勿关闭窗口</p>
            </div>
        </div>
      );
  }

  if (step === 'review') {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] shadow-2xl w-[1000px] h-[700px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <WebImportReviewModal 
                    onBack={() => setStep('source')}
                    onConfirm={handleFinalConfirm}
                    onClose={onClose}
                />
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-[24px] shadow-2xl w-[960px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-white">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Database size={24}/></div>
                    <div><h3 className="text-xl font-black text-[#1F2129]">选择导入来源</h3><p className="text-xs text-gray-400 mt-0.5">我们将根据来源自动转换 Excel 格式，无需手动修改原始表头。</p></div>
                </div>
                <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-[#333] transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 bg-[#F8FAFB] min-h-[500px]">
                <div className="grid grid-cols-2 gap-6 mb-8">
                    {IMPORT_SOURCES.map(source => {
                    const isSelected = importSource === source.id;
                    return (
                        <div 
                            key={source.id} 
                            onClick={() => !source.disabled && setImportSource(source.id)} 
                            className={`
                                relative rounded-[20px] p-5 flex items-center border-2 transition-all 
                                ${source.disabled ? 'opacity-60 cursor-not-allowed border-transparent bg-white' : 'cursor-pointer hover:shadow-lg'}
                                ${isSelected && !source.disabled ? 'bg-white border-blue-500 shadow-md ring-4 ring-blue-500/10' : 'bg-white border-transparent hover:border-gray-200 shadow-sm'}
                            `}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 transition-colors shrink-0 ${isSelected && !source.disabled ? source.color : 'bg-gray-100 text-gray-500'}`}>{source.icon}</div>
                            <div className="flex-1">
                                <div className="flex items-center mb-1">
                                    <span className="font-black text-sm text-gray-800 mr-2">{source.name}</span>
                                    {source.tag && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold border border-gray-200">{source.tag}</span>}
                                </div>
                                <div className="text-xs text-gray-400 leading-tight">{source.desc}</div>
                            </div>
                            {isSelected && !source.disabled && (<div className="absolute top-3 right-3 text-blue-500"><CheckCircle2 size={20} fill="currentColor" className="text-white"/></div>)}
                        </div>
                    );
                    })}
                </div>
                <div className="flex gap-6 h-[420px]">
                    <div className="w-[320px] bg-white rounded-[24px] p-8 border border-gray-100 shadow-sm flex flex-col">
                        <h4 className="text-sm font-black text-gray-800 flex items-center mb-6"><Info size={16} className="mr-2 text-blue-500"/> 操作引导</h4>
                        <div className="relative pl-6 space-y-8 flex-1">
                            <div className="absolute left-[9px] top-2 bottom-4 w-[2px] bg-gray-100"></div>
                            
                            {/* Step 1 */}
                            <div className="relative">
                                <div className="absolute -left-[23px] w-6 h-6 rounded-full bg-white border-2 border-gray-200 text-[10px] font-bold text-gray-400 flex items-center justify-center">1</div>
                                <div className="font-bold text-sm text-gray-800 mb-1">{importSource === 'local' ? '下载标准模板' : '导出平台数据'}</div>
                                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                                    {importSource === 'local' ? '请下载下方模版，标准商品与套餐商品需分别填写。' : `请前往【${IMPORT_SOURCES.find(s=>s.id===importSource)?.name}】商户后台，导出商品数据报表。`}
                                </p>
                                {importSource === 'local' && (
                                    <div className="flex flex-col space-y-2 w-full">
                                        <button className="flex items-center justify-center w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                                            <FileSpreadsheet size={14} className="mr-2 text-gray-400 group-hover:text-blue-500"/> 下载标准商品模版
                                        </button>
                                        <button className="flex items-center justify-center w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-colors group">
                                            <FileText size={14} className="mr-2 text-gray-400 group-hover:text-orange-500"/> 下载套餐商品模版
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Step 2 */}
                            <div className="relative">
                                <div className="absolute -left-[23px] w-6 h-6 rounded-full bg-white border-2 border-gray-200 text-[10px] font-bold text-gray-400 flex items-center justify-center">2</div>
                                <div className="font-bold text-sm text-gray-800 mb-1">{importSource === 'local' ? '填写商品数据' : '准备文件'}</div>
                                <p className="text-xs text-gray-400 leading-relaxed">{importSource === 'local' ? '根据模板内的示例样式，在本地填入您的商品资料。' : '无需修改导出的 Excel 文件格式，直接上传即可。'}</p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative">
                                <div className="absolute -left-[23px] w-6 h-6 rounded-full bg-white border-2 border-gray-200 text-[10px] font-bold text-gray-400 flex items-center justify-center">3</div>
                                <div className="font-bold text-sm text-gray-800 mb-1">保存并上传</div>
                                <p className="text-xs text-gray-400 leading-relaxed">确认信息无误后，将 Excel 文件上传至右侧区域。</p>
                            </div>
                        </div>
                    </div>
                    <div 
                        className="flex-1 bg-white rounded-[24px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative hover:border-blue-400 hover:bg-blue-50/10 transition-all group cursor-pointer"
                        onClick={handleStartAnalysis}
                    >
                        <div className="w-64 h-64 bg-gray-50 rounded-[48px] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform"><FileUp size={64} className="text-gray-300 group-hover:text-blue-500 transition-colors"/></div>
                        <h4 className="text-xl font-black text-gray-800 mb-2">上传已填写的标准数据</h4>
                        <p className="text-xs text-gray-400 mb-8">请确保已按照下载的模板格式填写。</p>
                        <button className="px-10 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center pointer-events-none">开始校验并导入 <ChevronRight size={16} className="ml-1"/></button>
                        <div className="absolute inset-4 rounded-[20px] bg-blue-500/5 border-2 border-blue-500 border-dashed opacity-0 group-hover:opacity-100 pointer-events-none flex items-center justify-center transition-opacity"><span className="bg-white px-4 py-2 rounded-lg text-blue-600 font-bold text-sm shadow-sm">释放鼠标以上传</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// ... Category Selection Modal (unchanged) ...
export const WebCategorySelectModal = ({ 
    type, 
    onClose, 
    onSelect,
    categories 
}: { 
    type: 'standard' | 'combo', 
    onClose: () => void, 
    onSelect: (category: Category) => void,
    categories: Category[] 
}) => {
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Auto-select first category if available
    useEffect(() => {
        if (categories.length > 0 && !selectedCategory) {
            setSelectedCategory(categories[0]);
        }
    }, [categories]);

    const getCategoryIcon = (name: string) => {
        if (name.includes('饮品') || name.includes('咖啡') || name.includes('茶')) return <CupSoda size={28} strokeWidth={1.5} />;
        if (name.includes('火锅')) return <Flame size={28} strokeWidth={1.5} />;
        if (name.includes('烘焙') || name.includes('蛋糕')) return <CakeSlice size={28} strokeWidth={1.5} />;
        if (name.includes('零售')) return <ShoppingBag size={28} strokeWidth={1.5} />;
        if (name.includes('称重')) return <Scale size={28} strokeWidth={1.5} />;
        return <Utensils size={28} strokeWidth={1.5} />;
    };

    const getCategoryDesc = (name: string) => {
        if (name.includes('通用') && type === 'standard') return '热菜、凉菜、小吃';
        if (name.includes('饮品') && type === 'standard') return '奶茶、咖啡、果汁';
        if (name.includes('称重') && type === 'standard') return '海鲜、麻辣烫';
        if ((name.includes('烘焙') || name.includes('蛋糕')) && type === 'standard') return '面包、甜点、整糕';
        if (name.includes('零售') && type === 'standard') return '预包装零食、饮料';
        
        if (name.includes('通用') && type === 'combo') return '超值午餐、多人餐';
        if (name.includes('饮品') && type === 'combo') return '双杯优惠、下午茶';
        if ((name.includes('烘焙') || name.includes('蛋糕')) && type === 'combo') return '甜点搭配';
        if (name.includes('零售') && type === 'combo') return '礼盒、组合装';
        if (name.includes('火锅') && type === 'combo') return '鸳鸯锅、九宫格';
        
        return '暂无描述';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 w-[900px] h-[600px]`}>
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-[#1F2129]">选择商品类目</h3>
                        <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-400 mr-2">当前正在创建:</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${type === 'standard' ? 'bg-green-50 text-[#00C06B]' : 'bg-orange-50 text-orange-500'}`}>
                                {type === 'standard' ? '标准商品' : '套餐商品'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-[#333] transition-colors"><X size={20}/></button>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-8 bg-[#F8FAFB] overflow-y-auto no-scrollbar">
                    <div className="flex items-start bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                        <Info size={16} className="text-blue-500 mt-0.5 mr-2 shrink-0"/>
                        <span className="text-sm text-blue-700 font-medium">请选择您要创建的商品类目，不同类目可管理不同的商品属性</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {categories.map(cat => {
                            const isSelected = selectedCategory?.id === cat.id;
                            return (
                                <div 
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`
                                        cursor-pointer flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all relative h-40
                                        ${isSelected ? 'bg-white border-[#00C06B] shadow-md' : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'}
                                    `}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${isSelected ? (type === 'standard' ? 'bg-green-50 text-[#00C06B]' : 'bg-orange-50 text-orange-500') : 'bg-gray-50 text-gray-400'}`}>
                                        {getCategoryIcon(cat.name)}
                                    </div>
                                    <span className={`text-sm font-bold ${isSelected ? 'text-[#1F2129]' : 'text-gray-600'}`}>{cat.name}</span>
                                    <span className="text-[10px] text-gray-400 mt-1">{getCategoryDesc(cat.name)}</span>
                                    
                                    {isSelected && (
                                        <div className="absolute top-0 right-0 w-8 h-8">
                                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[32px] border-l-[32px] border-t-[#00C06B] border-l-transparent rounded-tr-xl"></div>
                                            <Check size={14} className="absolute top-1 right-1 text-white" strokeWidth={3}/>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all text-sm">取消</button>
                    <button 
                        onClick={() => { if(selectedCategory) onSelect(selectedCategory); }} 
                        disabled={!selectedCategory}
                        className={`px-8 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all active:scale-95 ${selectedCategory ? 'bg-[#00C06B] hover:bg-[#00A35B]' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        下一步
                    </button>
                </div>
            </div>
        </div>
    );
}
