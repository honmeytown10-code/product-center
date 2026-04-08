import React, { useState } from 'react';
import { Settings, Check, Image as ImageIcon, AlignJustify } from 'lucide-react';

interface Props {
    showImage: boolean;
    setShowImage: (val: boolean) => void;
}

export const PosSettingsView: React.FC<Props> = ({ showImage, setShowImage }) => {
    const [activeTab, setActiveTab] = useState('order');
    const [showStockInfo, setShowStockInfo] = useState(true);

    const SETTINGS_TABS = [
        { id: 'general', label: '通用' },
        { id: 'business', label: '营业设置' },
        { id: 'order', label: '点单设置' },
        { id: 'checkout', label: '结账设置' },
        { id: 'payment', label: '支付设置' },
        { id: 'print', label: '打印设置' },
        { id: 'pickup', label: '取餐设置' },
        { id: 'ai', label: 'AI识别' },
        { id: 'scale', label: '称重设置' },
        { id: 'sub_screen', label: '副屏设置' },
        { id: 'customer_display', label: '客显设置' },
        { id: 'scan', label: '扫码设置' },
        { id: 'remark', label: '备注管理' },
        { id: 'expiration', label: '效期设置' },
        { id: 'account', label: '账号与版本' },
    ];

    return (
        <div className="flex h-full w-full bg-white text-[#333] font-sans">
            {/* Secondary Sidebar */}
            <div className="w-[140px] bg-white border-r border-[#E8E8E8] flex flex-col overflow-y-auto no-scrollbar shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-10">
                {SETTINGS_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-5 py-3.5 text-[13px] transition-colors relative ${
                            activeTab === tab.id 
                                ? 'bg-[#EEF2FC] text-[#3B6BDB] font-bold' 
                                : 'text-[#666] hover:bg-gray-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Settings Content */}
            <div className="flex-1 bg-[#F5F6FA] p-6 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-full p-8">
                    {activeTab === 'order' ? (
                        <div className="max-w-3xl">
                            
                            {/* Section 1: 点单页商品展示 */}
                            <div className="mb-10">
                                <h3 className="text-[15px] font-bold text-[#333] mb-5">点单页商品展示</h3>
                                
                                <div className="flex items-start space-x-6 mb-6">
                                    {/* No Image Card */}
                                    <div className="flex flex-col">
                                        <div className="text-[13px] font-bold text-[#333] mb-3">无图卡片</div>
                                        <div 
                                            onClick={() => setShowImage(false)}
                                            className={`relative w-[280px] h-[140px] rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                                                !showImage ? 'border-[#3B6BDB]' : 'border-transparent'
                                            }`}
                                        >
                                            <div className="absolute inset-0 bg-[#808080] p-4 flex items-start justify-between">
                                                {/* Mock No-Image Item */}
                                                <div className="w-[140px] h-[60px] bg-white rounded flex flex-col justify-center px-3 shadow-sm">
                                                    <div className="text-[12px] text-[#333] mb-2">商品01</div>
                                                    <div className="text-[12px] text-[#666]">￥18</div>
                                                </div>
                                                {/* Mock lines */}
                                                <div className="flex-1 ml-4 flex flex-col space-y-3 mt-1">
                                                    <div className="w-16 h-2.5 bg-[#666] rounded-full opacity-50"></div>
                                                    <div className="w-24 h-2.5 bg-[#666] rounded-full opacity-50"></div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                                                <div className="w-12 h-2.5 bg-[#666] rounded-full opacity-50"></div>
                                                <div className="w-24 h-2.5 bg-[#666] rounded-full opacity-50"></div>
                                            </div>
                                            {!showImage && (
                                                <div className="absolute top-0 right-0 w-0 h-0 border-t-[28px] border-t-[#3B6BDB] border-l-[28px] border-l-transparent">
                                                    <Check size={14} className="absolute -top-[24px] -left-[14px] text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Image Card */}
                                    <div className="flex flex-col">
                                        <div className="text-[13px] font-bold text-[#333] mb-3">大图卡片</div>
                                        <div 
                                            onClick={() => setShowImage(true)}
                                            className={`relative w-[280px] h-[140px] rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                                                showImage ? 'border-[#3B6BDB]' : 'border-transparent'
                                            }`}
                                        >
                                            <div className="absolute inset-0 bg-[#808080] p-4 flex items-start justify-between">
                                                {/* Mock Image Item */}
                                                <div className="w-[140px] h-[60px] bg-white rounded flex items-center p-2 shadow-sm space-x-2">
                                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                                        <ImageIcon size={16} className="text-gray-300" />
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <div className="text-[12px] text-[#333] mb-1">商品01</div>
                                                        <div className="text-[12px] text-[#666]">￥18</div>
                                                    </div>
                                                </div>
                                                {/* Mock cards */}
                                                <div className="flex-1 ml-4 grid grid-cols-1 gap-2">
                                                    <div className="h-[28px] bg-[#666] rounded opacity-30"></div>
                                                    <div className="h-[28px] bg-[#666] rounded opacity-30"></div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 left-4 right-4 flex space-x-2">
                                                <div className="h-6 w-16 bg-[#666] rounded opacity-30"></div>
                                                <div className="h-6 w-16 bg-[#666] rounded opacity-30"></div>
                                                <div className="h-6 flex-1 bg-[#666] rounded opacity-30"></div>
                                            </div>
                                            {showImage && (
                                                <div className="absolute top-0 right-0 w-0 h-0 border-t-[28px] border-t-[#3B6BDB] border-l-[28px] border-l-transparent">
                                                    <Check size={14} className="absolute -top-[24px] -left-[14px] text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <label className="flex items-center cursor-pointer mt-4">
                                    <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center mr-2 transition-colors ${showStockInfo ? 'bg-[#3B6BDB] border-[#3B6BDB]' : 'border-gray-300 bg-white'}`}>
                                        {showStockInfo && <Check size={12} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <span className="text-[13px] text-[#333]">显示库存信息</span>
                                </label>
                            </div>

                            {/* Section 2: 商品更新 */}
                            <div className="mb-10">
                                <h3 className="text-[15px] font-bold text-[#333] mb-5">商品更新</h3>
                                <label className="flex items-center cursor-pointer">
                                    <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center mr-2 transition-colors border-gray-300 bg-white`}>
                                    </div>
                                    <span className="text-[13px] text-[#333]">结账完商品更新</span>
                                </label>
                            </div>

                            {/* Section 3: 全部商品分类 */}
                            <div className="mb-10">
                                <h3 className="text-[15px] font-bold text-[#333] mb-5">全部商品分类</h3>
                                <label className="flex items-center cursor-pointer">
                                    <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center mr-2 transition-colors border-gray-300 bg-white`}>
                                    </div>
                                    <span className="text-[13px] text-[#333]">显示全部分类</span>
                                </label>
                            </div>

                            {/* Section 4: 常点商品分类 */}
                            <div>
                                <h3 className="text-[15px] font-bold text-[#333] mb-5">常点商品分类</h3>
                                <div className="flex items-start space-x-6">
                                    <div className="flex flex-col">
                                        <div className="text-[13px] font-bold text-[#333] mb-3">不显示常点商品</div>
                                        <div className="w-[240px] h-[120px] bg-[#808080] rounded-t-lg overflow-hidden relative">
                                            <div className="flex border-b border-[#666] opacity-80">
                                                <div className="px-4 py-2 bg-[#3B6BDB] text-white text-[12px]">全部</div>
                                                <div className="px-4 py-2 text-white text-[12px]">商品分类1</div>
                                                <div className="px-4 py-2 text-white text-[12px]">商品分类2</div>
                                            </div>
                                            <div className="flex p-2 space-x-2">
                                                <div className="bg-white w-16 h-16 rounded"></div>
                                                <div className="bg-white w-16 h-16 rounded"></div>
                                                <div className="bg-white w-16 h-16 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[13px] font-bold text-[#333] mb-3">显示常点商品</div>
                                        <div className="w-[240px] h-[120px] bg-[#808080] rounded-t-lg overflow-hidden relative">
                                            <div className="flex border-b border-[#666] opacity-80">
                                                <div className="px-4 py-2 bg-[#3B6BDB] text-white text-[12px]">常点商品</div>
                                                <div className="px-4 py-2 text-white text-[12px]">全部</div>
                                                <div className="px-4 py-2 text-white text-[12px]">商品分类1</div>
                                            </div>
                                            <div className="flex p-2 space-x-2">
                                                <div className="bg-white w-16 h-16 rounded"></div>
                                                <div className="bg-white w-16 h-16 rounded"></div>
                                                <div className="bg-white w-16 h-16 rounded"></div>
                                            </div>
                                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[28px] border-t-[#3B6BDB] border-l-[28px] border-l-transparent">
                                                <Check size={14} className="absolute -top-[24px] -left-[14px] text-white" strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[400px] text-gray-400">
                            {SETTINGS_TABS.find(t => t.id === activeTab)?.label} 功能暂未实装
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
