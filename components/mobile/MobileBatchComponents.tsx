import React from 'react';
import { ChevronLeft, ArrowUpCircle, ArrowDownCircle, Ban, RefreshCw, Trash, FileEdit, CheckCircle2, ChevronRight, Tag, Layers, Clock, FileText, Scale, ImageIcon, List, Edit3, Check, Trash2, Share2, Lock, Package, X, Info } from 'lucide-react';
import { ChannelType } from './types';
import { Product } from '../../types';

export type BatchActionType = 'on_shelf' | 'off_shelf' | 'sold_out' | 'restore_stock' | 'delete' | 'edit_attr' | null;
export type BatchStep = 'selection' | 'menu' | 'status_config' | 'attr_editor';

const ALL_CHANNELS_DEF: { id: ChannelType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: '全部渠道', icon: <Layers size={14}/>, color: 'text-gray-800' },
  { id: 'mini', label: '小程序', icon: null, color: 'text-green-600' },
  { id: 'meituan', label: '美团外卖', icon: null, color: 'text-yellow-600' },
  { id: 'taobao', label: '淘宝闪购', icon: null, color: 'text-orange-600' },
  { id: 'pos', label: 'POS收银', icon: null, color: 'text-blue-600' },
];

/**
 * 批量操作选择组件
 * 深度复刻企迈交互：点击操作项即刻跳转至下一步，减少点击路径
 */
export const BatchOperationSelect = ({ onBack, onSelectAction }: { onBack: () => void, onSelectAction: (action: BatchActionType) => void }) => {
    const statusActions = [
        { id: 'on_shelf', label: '批量上架', icon: <ArrowUpCircle size={28}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'off_shelf', label: '批量下架', icon: <ArrowDownCircle size={28}/>, color: 'text-gray-600', bg: 'bg-gray-100' },
        { id: 'sold_out', label: '批量沽清', icon: <Ban size={28}/>, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'restore_stock', label: '取消沽清', icon: <RefreshCw size={28}/>, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'delete', label: '删除商品', icon: <Trash size={28}/>, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black active:scale-95 transition-transform">
                    <ChevronLeft size={24}/>
                </button>
                <span className="font-bold text-base text-[#1F2129]">选择批量操作</span>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto no-scrollbar">
                {/* 状态操作区域 */}
                <div className="mb-4">
                    <div className="grid grid-cols-3 gap-3">
                        {statusActions.map(action => (
                            <div 
                              key={action.id}
                              onClick={() => onSelectAction(action.id as BatchActionType)}
                              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all cursor-pointer active:scale-95 active:bg-gray-50 aspect-square"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${action.bg} ${action.color}`}>
                                    {action.icon}
                                </div>
                                <span className="text-xs font-bold text-gray-600">{action.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 复杂信息修改卡片 */}
                <div className="mb-6">
                    <div 
                      onClick={() => onSelectAction('edit_attr')}
                      className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center transition-all cursor-pointer active:scale-95 active:bg-gray-50"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mr-4 shrink-0">
                            <FileEdit size={28}/>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">批量修改商品信息</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">支持同时修改价格、分类、图片、描述等多个属性</p>
                        </div>
                        <ChevronRight size={20} className="text-gray-300 ml-2" />
                    </div>
                </div>
            </div>
            
            {/* 底部填充，保持视觉平衡 */}
            <div className="h-8 bg-transparent shrink-0"></div>
        </div>
    );
};

export const BatchConfigStep = ({ 
    actionType, 
    selectedIds, 
    products, 
    onBack, 
    onConfirm, 
    isShelvesUnited 
}: { 
    actionType: BatchActionType, 
    selectedIds: Set<string>, 
    products: Product[], 
    onBack: () => void, 
    onConfirm: (data: any) => void,
    isShelvesUnited: boolean
}) => {
    const [batchEditFields, setBatchEditFields] = React.useState<string[]>([]);
    const [batchFormData, setBatchFormData] = React.useState<Record<string, any>>({});
    const [batchTargetChannels, setBatchTargetChannels] = React.useState<ChannelType[]>(['all']);

    const editableFieldsDef = [
        { id: 's_price', label: '基础价格', type: 'number', icon: <Tag size={14}/> },
        { id: 'p_cat', label: '商品分类', type: 'selector', icon: <Layers size={14}/> },
        { id: 'st_time', label: '售卖时间', type: 'time', icon: <Clock size={14}/> },
        { id: 'p_desc', label: '商品描述', type: 'text', icon: <FileText size={14}/> },
        { id: 'p_unit', label: '售卖单位', type: 'text', icon: <Scale size={14}/> },
        { id: 'p_img', label: '商品主图', type: 'image', icon: <ImageIcon size={14}/> },
    ];

    const isAttributeMode = actionType === 'edit_attr';
    
    const toggleEditField = (id: string) => {
        setBatchEditFields(prev => {
            if (prev.includes(id)) return prev.filter(f => f !== id);
            return [...prev, id];
        });
    };

    const getActionTitle = () => {
        switch(actionType) {
            case 'on_shelf': return '批量上架';
            case 'off_shelf': return '批量下架';
            case 'sold_out': return '批量沽清';
            case 'restore_stock': return '取消沽清';
            case 'delete': return '删除商品';
            case 'edit_attr': return '修改商品信息';
            default: return '批量操作';
        }
    };

    const handleApply = () => {
        onConfirm({
            action: actionType,
            fields: batchEditFields,
            data: batchFormData,
            channels: batchTargetChannels
        });
    };

    return (
        <div className="flex-1 flex flex-col bg-[#F5F6FA] relative h-full">
            <div className="h-[50px] flex items-center justify-between px-4 border-b border-gray-100 shrink-0 bg-white z-10">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-black">
                    <ChevronLeft size={24}/>
                </button>
                <span className="font-bold text-base">设置修改内容</span>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                {isAttributeMode && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-white rounded-2xl p-5 shadow-sm">
                            <h4 className="text-sm font-black text-[#1F2129] mb-3 flex items-center">
                                <List size={16} className="mr-2 text-purple-600"/> 
                                选择修改项
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {editableFieldsDef.map(f => {
                                    const active = batchEditFields.includes(f.id);
                                    return (
                                        <button 
                                          key={f.id}
                                          onClick={() => toggleEditField(f.id)}
                                          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center ${active ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            {f.icon}
                                            <span className="ml-1.5">{f.label}</span>
                                            {active && <Check size={12} className="ml-1.5"/>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {batchEditFields.length > 0 ? (
                            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                                <h4 className="text-sm font-black text-[#1F2129] mb-2 flex items-center">
                                    <Edit3 size={16} className="mr-2 text-blue-600"/> 
                                    输入新内容
                                </h4>
                                {batchEditFields.map(fieldId => {
                                    const def = editableFieldsDef.find(f => f.id === fieldId);
                                    if (!def) return null;
                                    return (
                                        <div key={fieldId} className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-in slide-in-from-top-2">
                                            <div className="flex items-center mb-2">
                                                <span className="text-gray-400 mr-2">{def.icon}</span>
                                                <span className="text-xs font-bold text-gray-500">{def.label}</span>
                                            </div>
                                            {def.type === 'number' ? (
                                                <div className="flex items-center">
                                                    <span className="text-lg font-bold mr-1 text-[#1F2129]">¥</span>
                                                    <input 
                                                      type="number" 
                                                      className="w-full text-lg font-bold outline-none bg-transparent text-[#1F2129]" 
                                                      placeholder="0.00"
                                                      value={batchFormData[fieldId] || ''}
                                                      onChange={e => setBatchFormData(prev => ({ ...prev, [fieldId]: e.target.value }))}
                                                    />
                                                </div>
                                            ) : def.type === 'image' ? (
                                                <div className="w-20 h-20 bg-white rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                                                    <ImageIcon size={20}/>
                                                    <span className="text-[10px] mt-1">点击上传</span>
                                                </div>
                                            ) : (
                                                <input 
                                                  className="w-full text-sm font-bold outline-none bg-transparent text-[#1F2129] placeholder-gray-300"
                                                  placeholder={`输入新的${def.label}`}
                                                  value={batchFormData[fieldId] || ''}
                                                  onChange={e => setBatchFormData(prev => ({ ...prev, [fieldId]: e.target.value }))}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-400">
                                <span className="text-xs font-bold">请先在上方选择需要修改的字段</span>
                            </div>
                        )}
                    </div>
                )}

                {!isAttributeMode && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center text-center animate-in zoom-in-95">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${actionType === 'delete' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                            {actionType === 'delete' ? <Trash2 size={32}/> : <RefreshCw size={32}/>}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">{getActionTitle()}</h3>
                        <p className="text-sm text-gray-500 mb-6">即将对 <span className="font-bold text-black mx-1">{selectedIds.size}</span> 个商品执行操作</p>
                    </div>
                )}

                {actionType !== 'delete' && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-black text-[#1F2129] mb-4 flex items-center">
                            <Share2 size={16} className="mr-2 text-orange-500"/> 
                            生效渠道
                        </h4>
                        {isShelvesUnited && !isAttributeMode ? (
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-3 flex items-center">
                                <Lock size={12} className="text-orange-500 mr-2"/>
                                <span className="text-[10px] font-bold text-orange-600">全渠道统管已开启，修改将同步至所有渠道</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {ALL_CHANNELS_DEF.filter(c => c.id !== 'all').map(ch => {
                                    const isSelected = batchTargetChannels.includes(ch.id);
                                    return (
                                        <button 
                                          key={ch.id}
                                          onClick={() => {
                                              if (batchTargetChannels.includes(ch.id)) {
                                                  setBatchTargetChannels(prev => prev.filter(c => c !== ch.id));
                                              } else {
                                                  setBatchTargetChannels(prev => [...prev, ch.id]);
                                              }
                                          }}
                                          className={`
                                              px-3 py-2 rounded-lg border flex items-center text-xs font-bold transition-all
                                              ${isSelected ? 'bg-[#1F2129] text-white border-[#1F2129]' : 'bg-white text-gray-500 border-gray-200'}
                                              active:scale-95
                                          `}
                                        >
                                            {ch.icon}
                                            <span className="ml-1.5">{ch.label}</span>
                                            {isSelected && <Check size={12} className="ml-1.5"/>}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-black text-[#1F2129] flex items-center">
                            <Package size={16} className="mr-2 text-gray-400"/> 
                            已选商品 ({selectedIds.size})
                        </h4>
                    </div>
                    <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-1">
                        {Array.from(selectedIds).map(id => {
                            const p = products.find(prod => prod.id === id);
                            return (
                                <div key={id} className="w-14 h-14 rounded-lg bg-gray-100 shrink-0 border border-gray-200 overflow-hidden relative">
                                    <img src={p?.image} className="w-full h-full object-cover" alt="product"/>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 pb-10">
                <button 
                  onClick={handleApply}
                  disabled={isAttributeMode && batchEditFields.length === 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center
                      ${actionType === 'delete' ? 'bg-red-500 shadow-red-200' : 'bg-[#00C06B] shadow-green-100'}
                      ${isAttributeMode && batchEditFields.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-400 shadow-none' : ''}
                  `}
                >
                    {actionType === 'delete' ? (
                        <><Trash2 size={18} className="mr-2"/> 确认删除</>
                    ) : (
                        <><CheckCircle2 size={18} className="mr-2"/> 确认执行</>
                    )}
                </button>
            </div>
        </div>
    );
};

export const BatchActionMenu = ({ 
    selectedCount, 
    onClose, 
    onSelectAction 
}: { 
    selectedCount: number, 
    onClose: () => void, 
    onSelectAction: (action: BatchActionType) => void 
}) => (
    <div className="absolute inset-0 z-50 bg-black/50 flex flex-col justify-end animate-in fade-in">
        <div className="flex-1" onClick={onClose}></div>
        <div className="bg-white rounded-t-[24px] p-6 animate-in slide-in-from-bottom pb-10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-900">批量操作 ({selectedCount})</h3>
                <button onClick={onClose} className="bg-gray-100 p-1.5 rounded-full"><X size={16} className="text-gray-500"/></button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-2">
                 <div onClick={() => onSelectAction('on_shelf')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ArrowUpCircle size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">上架</span>
                 </div>
                 <div onClick={() => onSelectAction('off_shelf')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center"><ArrowDownCircle size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">下架</span>
                 </div>
                 <div onClick={() => onSelectAction('sold_out')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><Ban size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">沽清</span>
                 </div>
                 <div onClick={() => onSelectAction('edit_attr')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><Edit3 size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">改信息</span>
                 </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
                 <div onClick={() => onSelectAction('delete')} className="flex flex-col items-center gap-2 cursor-pointer active:opacity-70">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><Trash2 size={28}/></div>
                    <span className="text-xs font-bold text-gray-600">删除</span>
                 </div>
            </div>
        </div>
    </div>
);