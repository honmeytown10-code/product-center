
import React, { useState } from 'react';
import { X, Check, ChevronDown, Printer, Smartphone, Store, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { ChannelType } from './types';

interface Props {
  product: Product;
  activeChannel: ChannelType;
  onClose: () => void;
  onConfirm: (updatedProduct: Partial<Product>) => void;
}

const CHANNELS = [
  { id: 'pos', label: 'POS收银', icon: <Printer size={12}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'mini', label: '小程序', icon: <Smartphone size={12}/>, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'meituan', label: '美团外卖', icon: <Store size={12}/>, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'taobao', label: '淘宝闪购', icon: <ShoppingBag size={12}/>, color: 'text-orange-600', bg: 'bg-orange-50' },
];

export const MobilePriceEditor: React.FC<Props> = ({ product, activeChannel, onClose, onConfirm }) => {
  const isMultiSpec = product.isMultiSpec;
  const isSingleChannelView = activeChannel !== 'all';
  
  // State for sync option (default true)
  const [syncChannels, setSyncChannels] = useState(true);
  const [isChannelExpanded, setIsChannelExpanded] = useState(true); 

  // Single Spec State
  const [basePrice, setBasePrice] = useState(product.price.toString());
  const [channelPrices, setChannelPrices] = useState({
      pos: product.price.toString(),
      mini: product.price.toString(),
      meituan: (product.price + 1).toString(),
      taobao: product.price.toString()
  });

  // Multi Spec State
  const [specs, setSpecs] = useState(product.specs?.map(s => ({
      ...s,
      price: s.price?.toString() || product.price.toString(),
      channelPrices: {
          pos: s.price?.toString() || product.price.toString(),
          mini: s.price?.toString() || product.price.toString(),
          meituan: (s.price ? (s.price + 1).toString() : (product.price + 1).toString()),
          taobao: s.price?.toString() || product.price.toString()
      } as Record<string, string>
  })) || []);

  // --- Handlers ---

  // Update Base Spec Price
  const handleSpecBasePriceChange = (index: number, val: string) => {
      const newSpecs = [...specs];
      newSpecs[index].price = val;
      // If sync is ON, also update all channel prices for this spec
      if (syncChannels) {
          Object.keys(newSpecs[index].channelPrices).forEach(key => {
              newSpecs[index].channelPrices[key] = val;
          });
      }
      setSpecs(newSpecs);
  };

  // Update Spec Channel Price
  const handleSpecChannelPriceChange = (index: number, channelId: string, val: string) => {
      const newSpecs = [...specs];
      newSpecs[index].channelPrices = {
          ...newSpecs[index].channelPrices,
          [channelId]: val
      };
      setSpecs(newSpecs);
  };

  // Save Logic
  const handleSave = () => {
      if (isMultiSpec) {
          const updatedSpecs = specs.map(s => ({
              name: s.name,
              stock: s.stock,
              unlimited: s.unlimited,
              // If single channel view, we technically only update that channel price in backend
              // For mock, we just use the base price or the specific channel price logic
              price: parseFloat(s.price) || 0,
          }));
          onConfirm({
              specs: updatedSpecs,
              price: updatedSpecs.length > 0 ? updatedSpecs[0].price : product.price
          });
      } else {
          // Single Spec
          let newPrice = parseFloat(basePrice) || 0;
          if (isSingleChannelView) {
              // In single channel view, we might update a separate field in real app
              // Here we just mock update the base price if it matches
              const val = parseFloat(channelPrices[activeChannel as keyof typeof channelPrices] || basePrice);
              newPrice = val; 
          }
          onConfirm({
              price: newPrice
          });
      }
      onClose();
  };

  // Get active channel label
  const activeChannelLabel = CHANNELS.find(c => c.id === activeChannel)?.label || activeChannel;

  return (
    <div className="absolute inset-0 bg-black/50 z-[100] flex flex-col justify-end animate-in fade-in duration-200">
        <div className="flex-1" onClick={onClose}></div>
        <div className="bg-white rounded-t-[24px] overflow-hidden w-full flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div className="flex flex-col">
                    <span className="font-black text-lg text-[#1F2129]">
                        {isSingleChannelView ? `修改价格 (${activeChannelLabel})` : '修改价格'}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">{product.name} {isMultiSpec && '(多规格)'}</span>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors">
                    <X size={18}/>
                </button>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar">
                
                {isMultiSpec ? (
                    /* --- Multi Spec Layout --- */
                    <div className="space-y-6">
                        
                        {/* 1. Base Prices (Visible in All Channels View) */}
                        {!isSingleChannelView && (
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 block uppercase tracking-wide">规格价格配置</label>
                                {specs.map((spec, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="font-bold text-sm text-gray-700">{spec.name}</span>
                                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 w-32 focus-within:border-[#00C06B] focus-within:ring-1 focus-within:ring-[#00C06B]/20 transition-all">
                                            <span className="text-sm font-black text-[#1F2129] mr-1">¥</span>
                                            <input 
                                                type="number" 
                                                className="w-full text-lg font-bold text-right outline-none text-[#1F2129] bg-transparent placeholder-gray-300"
                                                value={spec.price}
                                                onChange={e => handleSpecBasePriceChange(idx, e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 2. Sync Toggle (Only in All Channels View) */}
                        {!isSingleChannelView && (
                             <div 
                                className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer select-none ${syncChannels ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                                onClick={() => setSyncChannels(!syncChannels)}
                            >
                                <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center transition-all shrink-0 ${syncChannels ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                    {syncChannels && <Check size={12} className="text-white"/>}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${syncChannels ? 'text-blue-900' : 'text-gray-600'}`}>一键同步所有渠道</span>
                                    <span className={`text-[10px] ${syncChannels ? 'text-blue-600/70' : 'text-gray-400'}`}>
                                        {syncChannels ? '各渠道价格将与门店基础价保持一致' : '可为不同渠道设置不同价格'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 3. Independent Channel Prices (Breakdown) */}
                        {/* Show if: Single Channel View OR (All Channels View AND Sync is OFF) */}
                        {(isSingleChannelView || !syncChannels) && (
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 transition-all animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center cursor-pointer mb-4" onClick={() => setIsChannelExpanded(!isChannelExpanded)}>
                                    <span className="font-bold text-sm text-gray-700">
                                        {isSingleChannelView ? '当前渠道售价' : '各渠道独立售价'}
                                    </span>
                                    <div className="flex items-center text-xs text-gray-400">
                                        {isChannelExpanded ? '收起' : '展开'} 
                                        <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${isChannelExpanded ? 'rotate-180' : ''}`}/>
                                    </div>
                                </div>
                                
                                {isChannelExpanded && (
                                    <div className="space-y-6">
                                        {(isSingleChannelView 
                                            ? CHANNELS.filter(c => c.id === activeChannel) 
                                            : CHANNELS
                                        ).map(ch => (
                                            <div key={ch.id} className="border-t border-gray-200 border-dashed pt-4 first:border-0 first:pt-0">
                                                <div className="flex items-center mb-3">
                                                    <div className={`w-6 h-6 rounded ${ch.bg} ${ch.color} flex items-center justify-center mr-2`}>
                                                        {ch.icon}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-600">{ch.label}</span>
                                                </div>
                                                <div className="space-y-3 pl-2">
                                                    {specs.map((spec, idx) => (
                                                        <div key={idx} className="flex items-center justify-between">
                                                            <span className="text-sm font-bold text-gray-700">{spec.name}</span>
                                                            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 w-28 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20">
                                                                <span className="text-xs text-gray-400 mr-1 font-bold">¥</span>
                                                                <input 
                                                                    className="w-full text-sm font-bold text-right outline-none text-gray-800" 
                                                                    value={spec.channelPrices[ch.id]} 
                                                                    onChange={e => handleSpecChannelPriceChange(idx, ch.id, e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* --- Single Spec Layout --- */
                    <div className="space-y-6">
                        
                        {/* 1. Base Price (All Channels View Only) */}
                        {!isSingleChannelView && (
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-3 block uppercase tracking-wide">门店基础售价</label>
                                <div className="flex items-center border-b-2 border-gray-100 pb-2 focus-within:border-[#00C06B] transition-colors">
                                    <span className="text-3xl font-black text-[#1F2129] mr-2">¥</span>
                                    <input 
                                        type="number" 
                                        className="flex-1 text-4xl font-black text-[#1F2129] outline-none bg-transparent placeholder-gray-200 w-full" 
                                        value={basePrice} 
                                        onChange={e => {
                                            setBasePrice(e.target.value);
                                            if (syncChannels) {
                                                setChannelPrices({ pos: e.target.value, mini: e.target.value, meituan: e.target.value, taobao: e.target.value });
                                            }
                                        }} 
                                        placeholder="0.00" 
                                        autoFocus 
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2. Sync Toggle (All Channels View Only) */}
                        {!isSingleChannelView && (
                            <div 
                                className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer select-none ${syncChannels ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                                onClick={() => setSyncChannels(!syncChannels)}
                            >
                                <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center transition-all shrink-0 ${syncChannels ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                    {syncChannels && <Check size={12} className="text-white"/>}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${syncChannels ? 'text-blue-900' : 'text-gray-600'}`}>一键同步所有渠道</span>
                                    <span className={`text-[10px] ${syncChannels ? 'text-blue-600/70' : 'text-gray-400'}`}>勾选后，各渠道价格将与门店基础价保持一致</span>
                                </div>
                            </div>
                        )}

                        {/* 3. Independent Channel Prices */}
                        {(isSingleChannelView || !syncChannels) && (
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 transition-all animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center cursor-pointer mb-2" onClick={() => setIsChannelExpanded(!isChannelExpanded)}>
                                    <span className="font-bold text-sm text-gray-700">
                                        {isSingleChannelView ? '当前渠道售价' : '各渠道独立售价'}
                                    </span>
                                    <div className="flex items-center text-xs text-gray-400">
                                        {isChannelExpanded ? '收起' : '展开'} 
                                        <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${isChannelExpanded ? 'rotate-180' : ''}`}/>
                                    </div>
                                </div>
                                
                                {isChannelExpanded && (
                                    <div className="space-y-3 mt-4 pt-2 border-t border-gray-200 border-dashed">
                                        {(isSingleChannelView 
                                            ? CHANNELS.filter(c => c.id === activeChannel) 
                                            : CHANNELS
                                        ).map(ch => (
                                            <div key={ch.id} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`w-6 h-6 rounded ${ch.bg} ${ch.color} flex items-center justify-center mr-2`}>
                                                        {ch.icon}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-600">{ch.label}</span>
                                                </div>
                                                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 w-28 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20">
                                                    <span className="text-xs text-gray-400 mr-1 font-bold">¥</span>
                                                    <input 
                                                        className="w-full text-sm font-bold text-right outline-none text-gray-800" 
                                                        value={channelPrices[ch.id as keyof typeof channelPrices]} 
                                                        onChange={e => setChannelPrices({...channelPrices, [ch.id]: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-white shrink-0">
                <button 
                    onClick={handleSave}
                    className="w-full bg-[#1F2129] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-gray-200 active:scale-[0.98] transition-transform"
                >
                    确认修改
                </button>
            </div>
        </div>
    </div>
  );
};
