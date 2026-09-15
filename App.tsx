
import React, { useRef, useState } from 'react';
import { Monitor, Tablet, Smartphone, ShieldCheck } from 'lucide-react';
import { ProductProvider } from './context';
import { WebAdmin } from './components/WebAdmin';
import { PosSystem } from './components/PosSystem';
import { MobileApp } from './components/MobileApp';
import { MerchantOps } from './components/MerchantOps';

const App: React.FC = () => {
  type ClientView = 'ops' | 'web' | 'pos' | 'mobile';
  const [currentView, setCurrentView] = useState<ClientView>(() => {
    const view = new URLSearchParams(window.location.search).get('view');
    return view === 'ops' || view === 'pos' || view === 'mobile' ? view : 'web';
  });
  const [clientSwitcherOpen, setClientSwitcherOpen] = useState(false);
  const clientSwitcherCloseTimer = useRef<number | null>(null);
  const openClientSwitcher = () => {
    if (clientSwitcherCloseTimer.current !== null) window.clearTimeout(clientSwitcherCloseTimer.current);
    clientSwitcherCloseTimer.current = null;
    setClientSwitcherOpen(true);
  };
  const closeClientSwitcherSoon = () => {
    if (clientSwitcherCloseTimer.current !== null) window.clearTimeout(clientSwitcherCloseTimer.current);
    clientSwitcherCloseTimer.current = window.setTimeout(() => {
      setClientSwitcherOpen(false);
      clientSwitcherCloseTimer.current = null;
    }, 260);
  };
  const switchClient = (view: ClientView) => {
    if (clientSwitcherCloseTimer.current !== null) window.clearTimeout(clientSwitcherCloseTimer.current);
    setCurrentView(view);
    setClientSwitcherOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    if (view !== 'pos') url.searchParams.delete('posTab');
    window.history.replaceState(null, '', url);
  };
  const clients: { id: ClientView; label: string; icon: React.ReactNode; activeClass: string }[] = [
    { id: 'ops', label: 'Ops', icon: <ShieldCheck size={14} />, activeClass: 'bg-orange-500 text-white' },
    { id: 'web', label: 'Web', icon: <Monitor size={14} />, activeClass: 'bg-qimai-green text-white' },
    { id: 'pos', label: 'POS', icon: <Tablet size={14} />, activeClass: 'bg-blue-600 text-white' },
    { id: 'mobile', label: 'App', icon: <Smartphone size={14} />, activeClass: 'bg-white text-slate-900' },
  ];

  return (
    <ProductProvider>
      <div className="h-screen bg-slate-800 flex flex-col items-center font-sans overflow-hidden">
        
        {/* Compact client switcher: hover/focus/click to expand. */}
        <div
          className="fixed left-3 bottom-3 z-[9999]"
          onMouseEnter={openClientSwitcher}
          onMouseLeave={closeClientSwitcherSoon}
          onFocus={openClientSwitcher}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setClientSwitcherOpen(false); }}
        >
          <div className={`absolute left-0 bottom-full pb-2 transition-all duration-150 origin-bottom-left ${clientSwitcherOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
            <nav className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-md" aria-label="客户端切换">
              {clients.map(client => <button
                key={client.id}
                onClick={() => switchClient(client.id)}
                aria-current={currentView === client.id ? 'page' : undefined}
                className={`flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${currentView === client.id ? `${client.activeClass} shadow-md` : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                {client.icon}<span>{client.label}</span>
              </button>)}
            </nav>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 bg-slate-900/90 text-white shadow-xl backdrop-blur-md transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="切换客户端"
            aria-expanded={clientSwitcherOpen}
            title="切换客户端"
            onClick={openClientSwitcher}
          >
            {currentView === 'ops' ? <ShieldCheck size={18} /> : currentView === 'pos' ? <Tablet size={18} /> : currentView === 'mobile' ? <Smartphone size={18} /> : <Monitor size={18} />}
          </button>
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
              <div className="w-full h-full overflow-hidden relative">
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
