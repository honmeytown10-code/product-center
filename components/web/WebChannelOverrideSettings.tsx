import React, { useMemo, useState } from 'react';
import {
    ArrowLeft,
    Check,
    CircleDollarSign,
    Image,
    ListChecks,
    LockKeyhole,
    Save,
    SlidersHorizontal,
    Type,
} from 'lucide-react';

type OverrideField = {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
};

const OVERRIDE_FIELDS: OverrideField[] = [
    {
        id: 'p_name',
        label: '商品展示名称',
        description: '开放后，渠道可在不改变商品主档标准名称的前提下维护前台展示名称。',
        icon: <Type size={18} />,
    },
    {
        id: 'p_img',
        label: '渠道商品主图',
        description: '开放后，渠道可根据售卖场景和平台图片规范维护独立商品主图。',
        icon: <Image size={18} />,
    },
];

const CHANNEL_OWNED_FIELDS = [
    {
        name: '规格销售价',
        scope: '渠道商品 / 规格',
        rule: '创建渠道商品时按主档规格售价初始化，保存后由渠道独立维护。',
        icon: <CircleDollarSign size={17} />,
    },
    {
        name: '前台分类与售卖规则',
        scope: '具体渠道',
        rule: '按渠道维护分类、售卖时间、售卖方式、起购限购及包装规则。',
        icon: <SlidersHorizontal size={17} />,
    },
    {
        name: '做法售卖配置',
        scope: '渠道商品',
        rule: '可从主档候选做法中设置启用子集、排序、默认、必选和加价。',
        icon: <ListChecks size={17} />,
    },
    {
        name: '加料与套餐售卖配置',
        scope: '渠道商品',
        rule: '可从主档候选范围中设置启用项、价格和选择规则，不可新增主档不存在的关系。',
        icon: <ListChecks size={17} />,
    },
];

const MASTER_ONLY_FIELDS = [
    {
        name: '商品身份与类目',
        examples: '商品主档 ID、商品类目、后台分类、商品类型',
    },
    {
        name: '内部识别字段',
        examples: '数字助记码、商家商品标识、统计标签',
    },
    {
        name: 'SKU 与规格结构',
        examples: 'SKU ID、规格标准名称、规格数量和规格层级',
    },
    {
        name: '规格事实字段',
        examples: '条码、SKU 码、规格码、计量单位、商品分量',
    },
    {
        name: '公共候选关系',
        examples: '可用做法、可用加料、标准套餐结构及候选商品',
    },
];

interface Props {
    value: string[];
    onChange: (value: string[]) => void;
    onBack: () => void;
}

export const WebChannelOverrideSettings: React.FC<Props> = ({ value, onChange, onBack }) => {
    const configurableFieldIds = useMemo(() => new Set(OVERRIDE_FIELDS.map(field => field.id)), []);
    const [draft, setDraft] = useState<string[]>(() => value.filter(id => configurableFieldIds.has(id)));
    const [saved, setSaved] = useState(false);
    const selectedSet = useMemo(() => new Set(draft), [draft]);

    const toggleField = (fieldId: string) => {
        setSaved(false);
        setDraft(prev => (
            prev.includes(fieldId)
                ? prev.filter(id => id !== fieldId)
                : [...prev, fieldId]
        ));
    };

    const handleSave = () => {
        onChange(draft);
        setSaved(true);
    };

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-6">
                <div className="flex min-w-0 items-center gap-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-[#1F2129]"
                        title="返回"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-[18px] font-bold text-[#1F2129]">渠道字段覆盖规则</h2>
                            <span className="rounded-md bg-[#F2F4F7] px-2.5 py-1 text-xs font-bold text-[#475467]">主档管理权限</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-400">品牌级统一设置，仅管控少量从主档复制的公共字段。</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center rounded-md bg-[#1F2129] px-5 py-2.5 text-sm font-bold text-white hover:bg-black"
                >
                    <Save size={15} className="mr-2" />
                    保存规则
                </button>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="w-full space-y-5">
                    <section className="border border-[#DDEEE4] bg-[#F7FFF9] px-5 py-4">
                        <h3 className="text-sm font-bold text-[#1F2129]">规则说明</h3>
                        <p className="mt-1 text-sm leading-6 text-gray-500">
                            本页只决定“从主档首次复制的公共字段”能否被渠道改写。渠道固有的销售配置无需在此授权；商品身份、规格结构和内部识别字段固定继承主档。
                        </p>
                    </section>

                    <section className="border border-gray-200 bg-white">
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                            <div>
                                <h3 className="text-base font-bold text-[#1F2129]">可由品牌开放的公共字段</h3>
                                <p className="mt-1 text-sm text-gray-400">渠道商品首次按主档初始化，开放后允许渠道团队独立维护。</p>
                            </div>
                            <span className="text-sm font-bold text-[#00A35B]">已开放 {draft.length}/{OVERRIDE_FIELDS.length}</span>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-gray-100">
                            {OVERRIDE_FIELDS.map(field => {
                                const enabled = selectedSet.has(field.id);
                                return (
                                    <div key={field.id} className="flex min-h-[92px] items-center justify-between gap-6 px-5 py-4">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${enabled ? 'bg-[#EAF9F1] text-[#00A35B]' : 'bg-[#F2F4F7] text-gray-400'}`}>
                                                {field.icon}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#1F2129]">{field.label}</div>
                                                <div className="mt-1 text-sm leading-5 text-gray-400">{field.description}</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleField(field.id)}
                                            aria-pressed={enabled}
                                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-[#00C06B]' : 'bg-gray-300'}`}
                                        >
                                            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${enabled ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="border border-gray-200 bg-white">
                        <div className="border-b border-gray-200 px-5 py-4">
                            <h3 className="text-base font-bold text-[#1F2129]">渠道固定可维护的销售配置</h3>
                            <p className="mt-1 text-sm text-gray-400">这些内容本来就属于渠道售卖版本，不受上方开关控制。</p>
                        </div>
                        <div className="grid grid-cols-2">
                            {CHANNEL_OWNED_FIELDS.map((field, index) => (
                                <div
                                    key={field.name}
                                    className={`grid min-h-[98px] grid-cols-[40px_150px_1fr] items-start gap-3 px-5 py-4 ${
                                        index % 2 === 0 ? 'border-r border-gray-100' : ''
                                    } ${index >= 2 ? 'border-t border-gray-100' : ''}`}
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#EEF8FF] text-[#2476C7]">
                                        {field.icon}
                                    </span>
                                    <div>
                                        <div className="text-sm font-bold text-[#1F2129]">{field.name}</div>
                                        <div className="mt-1 text-xs text-gray-400">{field.scope}</div>
                                    </div>
                                    <div className="text-sm leading-6 text-gray-500">{field.rule}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="border border-gray-200 bg-white">
                        <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F2F4F7] text-[#667085]">
                                <LockKeyhole size={17} />
                            </span>
                            <div>
                                <h3 className="text-base font-bold text-[#1F2129]">固定继承主档，不允许渠道修改</h3>
                                <p className="mt-1 text-sm text-gray-400">渠道表单可只读展示这些字段，但不能形成独立值。</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 divide-x divide-gray-100">
                            {MASTER_ONLY_FIELDS.map(field => (
                                <div key={field.name} className="min-h-[104px] px-5 py-4">
                                    <div className="text-sm font-bold text-[#1F2129]">{field.name}</div>
                                    <div className="mt-2 text-sm leading-6 text-gray-400">{field.examples}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {saved && (
                        <div className="flex items-center gap-2 text-sm font-bold text-[#00A35B]">
                            <Check size={16} />
                            覆盖规则已保存
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
