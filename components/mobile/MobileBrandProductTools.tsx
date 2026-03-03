
import React from 'react';
import { 
  ChevronLeft, MoreHorizontal, FileText, Plus, Layers, ArrowDownCircle, 
  RefreshCw, Trash2, Eraser, Settings, Database, FileBox, History, 
  Smartphone, CheckSquare, Clock, Utensils, LayoutGrid 
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export const MobileBrandProductTools: React.FC<Props> = ({ onBack, onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] h-full relative">
        {/* Header */}
        <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black">
            <ChevronLeft size={24} />
            </button>
            <span className="font-bold text-base text-[#1F2129]">菜品中心</span>
            <button className="p-2 -mr-2 text-gray-600"><MoreHorizontal size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4">
            
            {/* Top Grid: Core Actions */}
            <div className="grid grid-cols-2 gap-3">
                <BigCard 
                    title="菜品库" 
                    desc="管理菜品和套餐" 
                    icon={<FileText size={24}/>} 
                    iconBg="bg-blue-50 text-blue-600"
                    onClick={() => onNavigate('product_list')}
                />
                <BigCard 
                    title="菜品分类" 
                    desc="管理菜品分类" 
                    icon={<Layers size={24}/>} 
                    iconBg="bg-orange-50 text-orange-600"
                    onClick={() => onNavigate('category_list')}
                />
                <BigCard 
                    title="新增菜品" 
                    desc="普通/规格/称重菜" 
                    icon={<Plus size={24}/>} 
                    iconBg="bg-green-50 text-green-600"
                    onClick={() => {}}
                />
                <BigCard 
                    title="新增套餐" 
                    desc="固定/可选套餐" 
                    icon={<Utensils size={24}/>} 
                    iconBg="bg-purple-50 text-purple-600"
                    onClick={() => {}}
                />
            </div>

            {/* Section: Chain Management */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-base text-[#1F2129]">连锁管理</h3>
                    <span className="text-xs text-gray-400 flex items-center">下发功能说明 <i className="ml-1 text-[10px] border border-gray-300 rounded-full w-3 h-3 flex items-center justify-center font-serif">?</i></span>
                </div>
                
                <div className="mb-4">
                    <div className="text-xs font-bold text-gray-400 mb-3 pl-1">下发菜品</div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <ListItem icon={<ArrowDownCircle size={20}/>} label="上新及更新菜品" desc="上新部分或整个菜谱" color="text-blue-600" bg="bg-blue-50"/>
                        <ListItem icon={<RefreshCw size={20}/>} label="更新门店已有菜品" desc="仅更新，不下发新菜品" color="text-blue-500" bg="bg-blue-50"/>
                        <ListItem icon={<LayoutGrid size={20}/>} label="更新门店下分类" desc="批量管理门店分类" color="text-indigo-600" bg="bg-indigo-50"/>
                        <ListItem icon={<Trash2 size={20}/>} label="删除门店菜品" desc="删除不售卖的菜品" color="text-red-500" bg="bg-red-50"/>
                        <ListItem icon={<RefreshCw size={20}/>} label="更换菜谱" desc="整体替换门店菜谱" color="text-orange-500" bg="bg-orange-50"/>
                        <ListItem icon={<Eraser size={20}/>} label="清空门店菜品" desc="清空门店所有菜品" color="text-red-600" bg="bg-red-50"/>
                    </div>
                </div>

                <div className="mb-4 pt-4 border-t border-gray-50">
                    <div className="text-xs font-bold text-gray-400 mb-3 pl-1">下发菜品属性</div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <ListItem icon={<Settings size={20}/>} label="批量下发做法" desc="批量管理门店做法" color="text-purple-600" bg="bg-purple-50"/>
                        <ListItem icon={<Database size={20}/>} label="批量下发加料" desc="批量管理门店加料" color="text-green-600" bg="bg-green-50"/>
                    </div>
                </div>

                <div className="mb-4 pt-4 border-t border-gray-50">
                    <div className="text-xs font-bold text-gray-400 mb-3 pl-1">菜谱模板</div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <ListItem icon={<FileBox size={20}/>} label="菜谱模板管理" desc="差异化管理门店菜品" color="text-blue-600" bg="bg-blue-50"/>
                        <ListItem icon={<ArrowDownCircle size={20}/>} label="批量下发模板" desc="一次下发多个模板" color="text-blue-500" bg="bg-blue-50"/>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-50">
                    <div className="text-xs font-bold text-gray-400 mb-3 pl-1">下发记录</div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <ListItem icon={<History size={20}/>} label="下发记录" desc="查看历史下发记录" color="text-blue-600" bg="bg-blue-50"/>
                        <ListItem icon={<RefreshCw size={20}/>} label="还原记录" desc="查看历史还原记录" color="text-blue-500" bg="bg-blue-50"/>
                    </div>
                </div>
            </div>

            {/* Section: Dine-in/Takeout */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-black text-base text-[#1F2129] mb-4">堂食外卖</h3>
                <div className="mb-4">
                    <div className="text-xs font-bold text-gray-400 mb-3 pl-1">堂食</div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <ListItem icon={<Smartphone size={20}/>} label="手机点餐菜谱" desc="小程序扫码点餐" color="text-blue-600" bg="bg-blue-50"/>
                        <ListItem icon={<CheckSquare size={20}/>} label="必点菜" desc="服务费/纸巾" color="text-blue-500" bg="bg-blue-50"/>
                        <ListItem icon={<Clock size={20}/>} label="时段菜单" desc="早午市/秋冬季菜单" color="text-blue-600" bg="bg-blue-50"/>
                        <ListItem icon={<Utensils size={20}/>} label="自助餐菜单" desc="自助点单" color="text-blue-500" bg="bg-blue-50"/>
                        <ListItem icon={<Utensils size={20}/>} label="宴会套餐" desc="团圆饭/升学宴" color="text-blue-600" bg="bg-blue-50"/>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};

const BigCard = ({ title, desc, icon, iconBg, onClick }: any) => (
    <div onClick={onClick} className="bg-white p-4 rounded-xl flex flex-col justify-between h-24 shadow-sm active:scale-95 transition-transform cursor-pointer relative overflow-hidden border border-gray-100">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-2 translate-y-2 scale-150">{icon}</div>
        <div className="flex justify-between items-start">
            <div className="font-black text-sm text-[#1F2129] z-10">{title}</div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} z-10`}>
                {icon}
            </div>
        </div>
        <div className="text-[10px] text-gray-400 font-medium z-10">{desc}</div>
    </div>
);

const ListItem = ({ icon, label, desc, color, bg }: any) => (
    <div className="flex items-center space-x-3 active:opacity-60 cursor-pointer">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
            {icon}
        </div>
        <div className="flex flex-col overflow-hidden">
            <div className="text-sm font-bold text-[#1F2129] truncate">{label}</div>
            <div className="text-[10px] text-gray-400 truncate">{desc}</div>
        </div>
    </div>
);
