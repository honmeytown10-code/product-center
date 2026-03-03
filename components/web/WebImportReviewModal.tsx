
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertCircle, Box, Layers, Scale, Tag, 
  ChevronDown, ChevronRight, ArrowLeft, Check, FileText, Database,
  ChevronLeft as ChevronLeftIcon, LayoutGrid, Search, Utensils, ChefHat,
  AlertTriangle, RefreshCw
} from 'lucide-react';

interface SpecOrMethod {
  name: string;
  values: string[];
}

interface AddonGroup {
  name: string;
  values: string[];
}

interface ImportError {
  row: number;
  productName: string;
  reason: string;
}

interface AnalysisResult {
  totalProducts: number;
  newCategories: string[];
  newSpecs: SpecOrMethod[];
  newMethods: SpecOrMethod[];
  newAddons: AddonGroup[];
  previewData: any[];
  errors?: ImportError[];
}

const BASE_DATA: AnalysisResult = {
  totalProducts: 128,
  newCategories: ['当季新品 (Seasonals)', '轻食沙拉 (Salads)'],
  newSpecs: [
    { name: '甜度 (Sugar Level)', values: ['标准糖', '七分糖', '五分糖', '三分糖', '不加糖'] },
    { name: '温度 (Temp)', values: ['正常冰', '少冰', '去冰', '温', '热'] },
    { name: '牛排熟度 (Doneness)', values: ['三分熟', '五分熟', '七分熟', '全熟'] }
  ],
  newMethods: [
    { name: '切块', values: ['切块', '不切'] },
    { name: '去冰', values: ['去冰'] },
    { name: '加热', values: ['加热', '不加热'] }
  ],
  newAddons: [
      { name: '常规配料', values: ['脆波波', '黑糖珍珠', '椰果', '布丁', '红豆', '芋圆', '仙草'] },
      { name: '坚果干果', values: ['花生碎', '葡萄干'] },
      { name: '奶制品', values: ['燕麦奶'] }
  ],
  previewData: [
    { name: '牛油果甘露', price: '28.00', cat: '当季新品', spec: '多规格' },
    { name: '美式咖啡', price: '22.00', cat: '现制饮品', spec: '多规格' },
    { name: '凯撒鸡肉卷', price: '18.00', cat: '轻食沙拉', spec: '统一规格' },
    { name: '奥利奥蛋糕', price: '32.00', cat: '蛋糕/烘焙', spec: '统一规格' },
    { name: '草莓圣代', price: '12.00', cat: '冰淇淋', spec: '统一规格' },
    { name: '超级水果茶', price: '25.00', cat: '现制饮品', spec: '多规格' },
    { name: '黑糖珍珠鲜奶', price: '24.00', cat: '现制饮品', spec: '多规格' },
    { name: '经典意面', price: '35.00', cat: '西式正餐', spec: '统一规格' },
    { name: '香辣鸡翅', price: '15.00', cat: '小吃', spec: '统一规格' },
    { name: '鲜榨橙汁', price: '18.00', cat: '现制饮品', spec: '统一规格' },
    { name: '招牌红烧肉', price: '48.00', cat: '中式正餐', spec: '统一规格' },
    { name: '米饭', price: '2.00', cat: '主食', spec: '统一规格' },
    { name: '例汤', price: '0.00', cat: '赠品', spec: '统一规格' },
  ],
  errors: []
};

const ERROR_DATA: AnalysisResult = {
    ...BASE_DATA,
    errors: [
        { row: 12, productName: '超级至尊披萨', reason: '必填字段缺失：基础售价' },
        { row: 45, productName: '未知商品', reason: '分类“得克萨斯小吃”不存在，请检查分类名称' },
        { row: 88, productName: '冰可乐', reason: '规格值重复：少冰' }
    ]
};

const SUCCESS_DATA: AnalysisResult = {
    ...BASE_DATA,
    errors: []
};

interface Props {
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

type ViewTab = 'total' | 'categories' | 'specs' | 'methods' | 'addons' | 'errors';

export const WebImportReviewModal: React.FC<Props> = ({ onBack, onConfirm, onClose }) => {
  const [isErrorScenario, setIsErrorScenario] = useState(true);
  
  const currentData = isErrorScenario ? ERROR_DATA : SUCCESS_DATA;
  const hasErrors = (currentData.errors?.length || 0) > 0;
  
  // Default to 'errors' tab if there are errors, otherwise 'total'
  const [activeTab, setActiveTab] = useState<ViewTab>(hasErrors ? 'errors' : 'total');

  const totalAddonsCount = currentData.newAddons.reduce((acc, group) => acc + group.values.length, 0);

  useEffect(() => {
      if (hasErrors) {
          setActiveTab('errors');
      } else {
          setActiveTab('total');
      }
  }, [hasErrors]);

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 font-sans">
      {/* Header */}
      <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors group">
            <ArrowLeft size={20} className="text-gray-500 group-hover:text-gray-800"/>
          </button>
          <div>
            <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-[#1F2129]">导入数据概览</h3>
                <button 
                    onClick={() => setIsErrorScenario(!isErrorScenario)}
                    className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-50"
                    title="切换演示状态"
                >
                    <RefreshCw size={14}/>
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
                {hasErrors ? '存在数据异常，请下载报告修改后重新上传' : '系统已完成文件解析，请确认以下变更内容'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            {hasErrors ? (
                <div 
                    onClick={() => setIsErrorScenario(false)}
                    className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                    title="点击切换至成功状态"
                >
                    <AlertCircle size={14} className="mr-1.5"/> 数据校验异常
                </div>
            ) : (
                <div 
                    onClick={() => setIsErrorScenario(true)}
                    className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center border border-green-100 cursor-pointer hover:bg-green-100 transition-colors"
                    title="点击切换至异常状态"
                >
                    <CheckCircle2 size={14} className="mr-1.5"/> 文件校验通过
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFB]">
        {/* Top Cards Section */}
        <div className="p-8 pb-4 shrink-0">
            <div className="grid grid-cols-5 gap-4">
                <div 
                    onClick={() => setActiveTab('total')}
                    className={`
                        p-5 rounded-2xl shadow-lg flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all
                        ${activeTab === 'total' ? 'bg-[#1F2129] text-white ring-4 ring-gray-200 scale-[1.02]' : 'bg-[#1F2129] text-white/90 hover:scale-[1.02]'}
                    `}
                >
                    <div className="relative z-10">
                        <div className="text-white/60 text-xs font-bold mb-1">预计导入商品数</div>
                        <div className="text-3xl font-black">{currentData.totalProducts}</div>
                    </div>
                    <div className={`relative z-10 flex items-center mt-4 text-xs font-bold ${hasErrors ? 'text-red-400' : 'text-[#00C06B]'}`}>
                        {hasErrors ? <><AlertTriangle size={14} className="mr-1"/> 存在异常</> : <><CheckCircle2 size={14} className="mr-1"/> 数据格式正常</>}
                    </div>
                    <Database size={80} className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform duration-500"/>
                    {activeTab === 'total' && <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${hasErrors ? 'bg-red-500' : 'bg-[#00C06B]'}`}></div>}
                </div>

                {hasErrors && (
                    <SummaryCard 
                        label="异常数据" 
                        count={currentData.errors?.length || 0} 
                        icon={<AlertCircle size={24}/>} 
                        color="text-red-600" bg="bg-red-50"
                        onClick={() => setActiveTab('errors')}
                        active={activeTab === 'errors'}
                        warning
                    />
                )}

                {!hasErrors && (
                    <>
                        <SummaryCard 
                            label="新增前台分类" 
                            count={currentData.newCategories.length} 
                            icon={<Layers size={24}/>} 
                            color="text-blue-600" bg="bg-blue-50"
                            onClick={() => setActiveTab('categories')}
                            active={activeTab === 'categories'}
                        />
                        
                        <SummaryCard 
                            label="新增规格组" 
                            count={currentData.newSpecs.length} 
                            icon={<Scale size={24}/>} 
                            color="text-orange-600" bg="bg-orange-50"
                            onClick={() => setActiveTab('specs')}
                            active={activeTab === 'specs'}
                        />

                        <SummaryCard 
                            label="新增做法组" 
                            count={currentData.newMethods.length} 
                            icon={<ChefHat size={24}/>} 
                            color="text-red-500" bg="bg-red-50"
                            onClick={() => setActiveTab('methods')}
                            active={activeTab === 'methods'}
                        />

                        <SummaryCard 
                            label="新增加料" 
                            count={totalAddonsCount} 
                            icon={<Tag size={24}/>} 
                            color="text-purple-600" bg="bg-purple-50"
                            onClick={() => setActiveTab('addons')}
                            active={activeTab === 'addons'}
                        />
                    </>
                )}
            </div>
        </div>

        {/* Content Area - Switches based on Active Tab */}
        <div className="flex-1 overflow-hidden px-8 pb-8">
            <div className="h-full bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden shadow-sm animate-in fade-in zoom-in-[0.99] duration-200">
                {activeTab === 'total' && <ProductPreviewTable data={currentData} />}
                {activeTab === 'errors' && <ErrorsDetailView errors={currentData.errors || []} />}
                {activeTab === 'categories' && <CategoriesDetailView items={currentData.newCategories} />}
                {activeTab === 'specs' && <AttributesDetailView items={currentData.newSpecs} type="spec" />}
                {activeTab === 'methods' && <AttributesDetailView items={currentData.newMethods} type="method" />}
                {activeTab === 'addons' && <AddonsDetailView items={currentData.newAddons} />}
            </div>
        </div>

      </div>

      {/* Footer */}
      <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0 z-10">
        <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all text-sm">取消导入</button>
        {hasErrors ? (
             <button 
                onClick={() => alert('已下载异常报告，请修改Excel后重新上传')} 
                className="px-8 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center"
            >
                <FileText size={16} className="mr-2"/> 下载异常报告
            </button>
        ) : (
            <button 
                onClick={onConfirm}
                className="px-8 py-2.5 rounded-xl bg-[#00C06B] text-white font-bold text-sm shadow-lg shadow-green-100 hover:bg-[#00A35B] active:scale-95 transition-all flex items-center"
            >
                <Check size={16} className="mr-2"/> 确认并导入
            </button>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, count, icon, color, bg, onClick, active, warning }: any) => (
    <div 
        onClick={onClick}
        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative group flex flex-col justify-between ${active ? `border-${color.split('-')[1]}-200 bg-white shadow-lg ring-2 ring-${color.split('-')[1]}-50` : 'border-transparent bg-white hover:border-gray-200 shadow-sm'}`}
    >
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-xl ${bg} ${color}`}>
                {icon}
            </div>
            {count > 0 && !warning && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">New</span>}
            {warning && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-red-200">Action Needed</span>}
        </div>
        <div>
            <div className={`text-xs font-bold mb-1 ${warning ? 'text-red-400' : 'text-gray-400'}`}>{label}</div>
            <div className={`text-2xl font-black ${count > 0 ? (warning ? 'text-red-600' : 'text-gray-800') : 'text-gray-300'}`}>{count}</div>
        </div>
        {active && (
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-b-2 border-${color.split('-')[1]}-200 rotate-45 z-10`}></div>
        )}
    </div>
);

// --- Sub Views ---

const ProductPreviewTable = ({ data }: { data: AnalysisResult }) => (
    <>
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
            <h4 className="font-bold text-sm text-gray-800 flex items-center">
                <FileText size={16} className="mr-2 text-gray-500"/>
                全部商品预览
            </h4>
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-2 text-gray-400"/>
                    <input className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:border-gray-400 w-48" placeholder="搜索商品..."/>
                </div>
                <span className="text-xs text-gray-400">仅展示部分字段</span>
            </div>
        </div>
        <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-xs font-bold text-gray-500 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-6 py-3 bg-gray-50/50">商品名称</th>
                        <th className="px-6 py-3 bg-gray-50/50">所属分类</th>
                        <th className="px-6 py-3 bg-gray-50/50">规格类型</th>
                        <th className="px-6 py-3 bg-gray-50/50 text-right">基础售价</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {data.previewData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-3.5 font-bold text-gray-800">{row.name}</td>
                            <td className="px-6 py-3.5 text-gray-600">
                                <span className={`px-2 py-0.5 rounded text-xs ${data.newCategories.includes(row.cat) ? 'bg-blue-50 text-blue-600 font-bold' : ''}`}>
                                    {row.cat} {data.newCategories.includes(row.cat) && '(新)'}
                                </span>
                            </td>
                            <td className="px-6 py-3.5 text-gray-500">{row.spec}</td>
                            <td className="px-6 py-3.5 text-right font-mono font-medium">¥{row.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="px-6 py-3 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
            <span className="text-xs text-gray-400">共 {data.totalProducts} 条数据</span>
            <div className="flex items-center space-x-2">
                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50" disabled><ChevronLeftIcon size={14}/></button>
                <span className="text-xs font-bold text-gray-700 px-2">1 / 13</span>
                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"><ChevronRight size={14}/></button>
                <select className="ml-2 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none">
                    <option>20条/页</option>
                    <option>50条/页</option>
                </select>
            </div>
        </div>
    </>
);

const ErrorsDetailView = ({ errors }: { errors: ImportError[] }) => (
    <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50/30 shrink-0 flex justify-between items-center">
            <h4 className="font-bold text-sm text-red-800 flex items-center">
                <AlertCircle size={16} className="mr-2 text-red-600"/>
                异常数据列表 ({errors.length})
            </h4>
            <span className="text-xs text-red-500 font-medium">请参考错误原因修改Excel文件</span>
        </div>
        <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-xs font-bold text-gray-500 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 bg-gray-50/50 w-24">Excel行号</th>
                        <th className="px-6 py-3 bg-gray-50/50 w-64">商品名称</th>
                        <th className="px-6 py-3 bg-gray-50/50">异常原因</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {errors.map((err, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-red-50/10 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-500 font-bold bg-gray-50/30 border-r border-gray-50">Row {err.row}</td>
                            <td className="px-6 py-4 font-bold text-gray-800">{err.productName || '-'}</td>
                            <td className="px-6 py-4 text-red-600 font-medium flex items-center">
                                <AlertTriangle size={14} className="mr-2 flex-shrink-0"/>
                                {err.reason}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const CategoriesDetailView = ({ items }: { items: string[] }) => (
    <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <h4 className="font-bold text-sm text-gray-800 flex items-center">
                <Layers size={16} className="mr-2 text-blue-600"/>
                新增前台分类列表
            </h4>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-4 gap-4">
                {items.map((cat, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all">
                        <span className="font-bold text-sm text-blue-900">{cat}</span>
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                ))}
            </div>
            {items.length === 0 && <EmptyState text="无新增分类" />}
        </div>
    </div>
);

const AttributesDetailView = ({ items, type }: { items: SpecOrMethod[], type: 'spec' | 'method' }) => (
    <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <h4 className="font-bold text-sm text-gray-800 flex items-center">
                {type === 'spec' ? <Scale size={16} className="mr-2 text-orange-600"/> : <ChefHat size={16} className="mr-2 text-red-500"/>}
                {type === 'spec' ? '新增规格组及规格值' : '新增做法组及做法值'}
            </h4>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-3 gap-6">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className={`px-4 py-3 border-b border-gray-100 flex items-center justify-between ${type === 'spec' ? 'bg-orange-50/50' : 'bg-red-50/50'}`}>
                            <span className="font-bold text-sm text-gray-800">{item.name}</span>
                            <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">{item.values.length}项</span>
                        </div>
                        <div className="p-4 flex flex-wrap gap-2">
                            {item.values.map((v, vIdx) => (
                                <span key={vIdx} className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                    {v}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {items.length === 0 && <EmptyState text={type === 'spec' ? "无新增规格" : "无新增做法"} />}
        </div>
    </div>
);

const AddonsDetailView = ({ items }: { items: AddonGroup[] }) => (
    <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <h4 className="font-bold text-sm text-gray-800 flex items-center">
                <Tag size={16} className="mr-2 text-purple-600"/>
                新增加料项列表
            </h4>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-3 gap-6">
                {items.map((group, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="px-4 py-3 border-b border-gray-100 bg-purple-50/50 flex items-center justify-between">
                             <span className="font-bold text-sm text-gray-800">{group.name}</span>
                             <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">{group.values.length}项</span>
                        </div>
                        <div className="p-4 flex flex-wrap gap-2">
                            {group.values.map((item, vIdx) => (
                                <div key={vIdx} className="bg-purple-50 border border-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {items.length === 0 && <EmptyState text="无新增加料" />}
        </div>
    </div>
);

const EmptyState = ({ text }: { text: string }) => (
    <div className="h-full flex flex-col items-center justify-center text-gray-300 pb-10">
        <Box size={48} className="mb-3 opacity-20"/>
        <span className="text-sm font-bold">{text}</span>
    </div>
);
