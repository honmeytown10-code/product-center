
import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone, ShieldCheck } from 'lucide-react';
import { ProductProvider } from './context';
import { WebAdmin } from './components/WebAdmin';
import { PosSystem } from './components/PosSystem';
import { MobileApp } from './components/MobileApp';
import { MerchantOps } from './components/MerchantOps';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'ops' | 'web' | 'pos' | 'mobile'>('web');

  return (
    <ProductProvider>
      <div className="h-screen bg-slate-800 flex flex-col items-center font-sans overflow-hidden">
        
        {/* Navigation Switcher - 4 Clients (Floating or Static) */}
        <div className="fixed top-2 z-[9999] opacity-20 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl flex space-x-1 shadow-2xl border border-slate-700 pointer-events-auto">
            <button
              onClick={() => setCurrentView('ops')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all text-xs ${currentView === 'ops' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <ShieldCheck size={14} />
              <span className="font-bold whitespace-nowrap">Ops</span>
            </button>
            <button
              onClick={() => setCurrentView('web')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all text-xs ${currentView === 'web' ? 'bg-qimai-green text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Monitor size={14} />
              <span className="font-bold whitespace-nowrap">Web</span>
            </button>
            <button
              onClick={() => setCurrentView('pos')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all text-xs ${currentView === 'pos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Tablet size={14} />
              <span className="font-bold whitespace-nowrap">POS</span>
            </button>
            <button
              onClick={() => setCurrentView('mobile')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all text-xs ${currentView === 'mobile' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Smartphone size={14} />
              <span className="font-bold whitespace-nowrap">App</span>
            </button>
          </div>
        </div>

        {/* Full Screen Viewports */}
        <div className="w-full h-full flex-1 relative">
          
          {/* OPS VIEW */}
          {currentView === 'ops' && (
            <div className="absolute inset-0 bg-white">
               <MerchantOps />
            </div>
          )}

          {/* WEB VIEW (FULL REPLICA) */}
          {currentView === 'web' && (
            <div className="absolute inset-0 bg-white">
              <WebAdmin />
            </div>
          )}

          {/* POS VIEW */}
          {currentView === 'pos' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="w-[1280px] h-[850px] bg-black rounded-[24px] shadow-2xl overflow-hidden border-[12px] border-slate-900 relative">
                <PosSystem />
              </div>
            </div>
          )}

          {/* MOBILE VIEW */}
          {currentView === 'mobile' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="w-[375px] h-[812px] bg-white rounded-[40px] shadow-2xl overflow-hidden border-[12px] border-slate-900 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-[16px] z-50"></div>
                <div className="h-11 bg-white w-full flex justify-between items-center px-6 pt-2 select-none">
                   <span className="text-xs font-bold ml-2">10:54</span>
                   <div className="flex space-x-1"><div className="w-4 h-2.5 bg-black rounded-[1px]"></div></div>
                </div>
                <div className="h-[calc(100%-44px)]">
                    <MobileApp />
                </div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full z-50"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProductProvider>
  );
};

export default App;
