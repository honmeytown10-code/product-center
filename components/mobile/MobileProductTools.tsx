
import React from 'react';
import { 
  ChevronLeft, ShoppingBag, Plus, Layers, Database, Tag, Scale, Box, Edit3, 
  ChevronRight, Settings, Coffee, Utensils
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export const MobileProductTools: React.FC<Props> = ({ onBack, onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#F5F6FA] h-full relative">
      {/* Header */}
      <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-base text-[#1F2129]">商品管理</span>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        
        {/* Group: Core Management */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center mb-4">
                <span className="w-1 h-4 bg-[#00C06B] rounded-full mr-2"></span>
                <span className="text-sm font-black text-[#1F2129]">菜品与菜单</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <ToolCard 
                    icon={<ShoppingBag size={24}/>} 
                    label="门店商品" 
                    desc="管理商品库与上下架"
                    color="text-orange-500"
                    bg="bg-orange-50"
                    onClick={() => onNavigate('product_list')}
                />
                <ToolCard 
                    icon={<Layers size={24}/>} 
                    label="商品分类" 
                    desc="管理前台展示分类"
                    color="text-green-500"
                    bg="bg-green-50"
                    onClick={() => onNavigate('category_list')}
                />
                <ToolCard 
                    icon={<Plus size={24}/>} 
                    label="新建商品" 
                    desc="录入新菜品/套餐"
                    color="text-blue-500"
                    bg="bg-blue-50"
                    onClick={() => onNavigate('product_create')}
                />
                <ToolCard 
                    icon={<Box size={24}/>} 
                    label="随心配" 
                    desc="管理套餐分组"
                    color="text-teal-500"
                    bg="bg-teal-50"
                    onClick={() => onNavigate('combo_list')}
                />
            </div>
        </div>

        {/* Group: Attributes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center mb-4">
                <span className="w-1 h-4 bg-blue-500 rounded-full mr-2"></span>
                <span className="text-sm font-black text-[#1F2129]">属性管理</span>
            </div>
            <div className="space-y-0.5">
                <ListItem 
                    icon={<Scale size={18}/>} 
                    label="规格管理" 
                    color="text-blue-600"
                    bg="bg-blue-50"
                    onClick={() => onNavigate('spec_list')} 
                />
                <ListItem 
                    icon={<Tag size={18}/>} 
                    label="做法管理" 
                    color="text-purple-600"
                    bg="bg-purple-50"
                    onClick={() => onNavigate('method_list')} 
                />
                <ListItem 
                    icon={<Database size={18}/>} 
                    label="加料管理" 
                    color="text-[#00C06B]"
                    bg="bg-[#E6F8F0]"
                    onClick={() => onNavigate('addon_list')} 
                />
            </div>
        </div>

        {/* Group: Tools */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center mb-4">
                <span className="w-1 h-4 bg-purple-500 rounded-full mr-2"></span>
                <span className="text-sm font-black text-[#1F2129]">效率工具</span>
            </div>
            <div onClick={() => onNavigate('batch_operation_select')} className="flex items-center p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center mr-3">
                    <Edit3 size={20}/>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-gray-800">批量修改</div>
                    <div className="text-xs text-gray-400 mt-0.5">支持批量改价、上下架、沽清等</div>
                </div>
                <ChevronRight size={16} className="text-gray-300"/>
            </div>
        </div>

      </div>
    </div>
  );
};

const ToolCard = ({ icon, label, desc, color, bg, onClick }: any) => (
    <div onClick={onClick} className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-100 active:border-[#00C06B] active:bg-[#00C06B]/5 transition-all cursor-pointer">
        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center mb-2`}>
            {icon}
        </div>
        <div className="font-bold text-sm text-gray-800 mb-0.5">{label}</div>
        <div className="text-[10px] text-gray-400">{desc}</div>
    </div>
);

const ListItem = ({ icon, label, color, bg, onClick }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
        <div className="flex items-center">
            <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center mr-3`}>
                {icon}
            </div>
            <span className="text-sm font-bold text-gray-700">{label}</span>
        </div>
        <ChevronRight size={16} className="text-gray-300"/>
    </div>
);
