
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Coffee, AlertCircle, ClipboardList, Power, ChevronLeft, Clock, User, Settings } from 'lucide-react';
import { NavIcon, Tab } from './pos/PosCommon';
import { PosShelfView } from './pos/PosShelfView';
import { PosStockoutView } from './pos/PosStockoutView';
import { PosMethodView } from './pos/PosMethodView';
import { PosSettingsView } from './pos/PosSettingsView';

type MainModule = 'product' | 'settings';
type SubTab = 'shelf' | 'stockout' | 'method' | 'item';

export const PosSystem: React.FC = () => {
  const [mainModule, setMainModule] = useState<MainModule>('product');
  const [subTab, setSubTab] = useState<SubTab>('stockout');
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pos_local_showImage');
    if (stored !== null) {
      setShowImage(stored === 'true');
    } else {
      // Ensure default is false if not set in local storage
      setShowImage(false);
    }
  }, []);

  const handleToggleImage = (val: boolean) => {
    setShowImage(val);
    localStorage.setItem('pos_local_showImage', String(val));
  };

  const handleModuleChange = (module: MainModule) => {
    setMainModule(module);
    setSubTab('stockout');
  };

  return (
    <div className="flex w-full h-full bg-[#1F2129] text-gray-100 font-sans overflow-hidden">
      
      {/* --- A AREA: Main Sidebar --- */}
      <div className="w-24 bg-[#1F2129] flex flex-col items-center py-6 space-y-8 z-20 shadow-xl border-r border-gray-800 shrink-0">
         <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-4 cursor-pointer hover:ring-2 ring-gray-500 transition-all">
             <User size={24} className="text-gray-300" />
         </div>
         <NavIcon icon={<LayoutGrid size={28} />} label="点单" />
         <NavIcon icon={<Settings size={28} />} label="设置" active={mainModule === 'settings'} onClick={() => handleModuleChange('settings')} />
         <div className="w-8 border-b border-gray-700 my-4"></div>
         <NavIcon icon={<Coffee size={28} />} label="商品管理" active={mainModule === 'product'} onClick={() => handleModuleChange('product')} />
         <NavIcon icon={<ClipboardList size={28} />} label="订单" />
         <div className="mt-auto"><NavIcon icon={<Power size={28} />} label="退出" /></div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F6FA]">
        
        {/* --- B AREA: Top Navigation --- */}
        <div className="h-16 bg-[#1F2129] border-b border-gray-700 flex justify-between items-center px-8 shrink-0 z-20 text-white">
           <div className="flex items-center space-x-8">
              <div className="flex items-center font-bold text-xl">
                 <ChevronLeft className="mr-3 text-gray-400 cursor-pointer hover:text-white" size={24}/>
                 {mainModule === 'product' ? '商品管理' : '系统设置'}
              </div>
              {mainModule === 'product' && (
                  <>
                      <div className="h-8 w-px bg-gray-600 mx-2"></div>
                      <div className="flex space-x-2">
                         <Tab active={subTab === 'stockout'} label="商品沽清" onClick={() => setSubTab('stockout')}/>
                         <Tab active={subTab === 'method'} label="做法沽清" onClick={() => setSubTab('method')}/>
                         <Tab active={subTab === 'shelf'} label="商品上下架" onClick={() => setSubTab('shelf')}/>
                         <Tab active={subTab === 'item'} label="品项沽清" onClick={() => setSubTab('item')}/>
                      </div>
                  </>
              )}
           </div>
           <div className="flex items-center text-base text-gray-400">
              <Clock size={18} className="mr-2"/> 2025年 12月 02日 星期二 17:47
           </div>
        </div>

        {/* --- C AREA: Workspace --- */}
        {mainModule === 'settings' ? (
            <PosSettingsView showImage={showImage} setShowImage={handleToggleImage} />
        ) : (
            <>
                {subTab === 'shelf' && <PosShelfView showImage={showImage} />}
                {subTab === 'stockout' && <PosStockoutView showImage={showImage} />}
                {subTab === 'method' && <PosMethodView />}
                {subTab === 'item' && <div className="flex items-center justify-center h-full text-gray-400">暂未实装品项沽清功能</div>}
            </>
        )}
      </div>
    </div>
  );
};
