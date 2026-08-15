import React, { useMemo, useState } from 'react';
import { Braces, Check, Pencil, Plus, Search, X } from 'lucide-react';

type CustomAttributeType = '单选' | '多选' | '文本' | '数字';

type CustomAttributeRecord = {
  id: string;
  name: string;
  code: string;
  type: CustomAttributeType;
  options: string[];
  productTypes: string[];
  relatedCount: number;
  enabled: boolean;
  updatedAt: string;
};

type CustomAttributeDraft = Omit<CustomAttributeRecord, 'id' | 'relatedCount' | 'updatedAt'> & {
  id?: string;
};

const INITIAL_RECORDS: CustomAttributeRecord[] = [
  {
    id: 'custom-1',
    name: '辣度偏好',
    code: 'spicy_preference',
    type: '单选',
    options: ['不辣', '微辣', '中辣', '特辣'],
    productTypes: ['标准商品', '套餐商品'],
    relatedCount: 18,
    enabled: true,
    updatedAt: '2026-07-28 14:32',
  },
  {
    id: 'custom-2',
    name: '过敏原提示',
    code: 'allergen_notice',
    type: '多选',
    options: ['乳制品', '坚果', '麸质', '海鲜'],
    productTypes: ['标准商品', '套餐商品'],
    relatedCount: 32,
    enabled: true,
    updatedAt: '2026-07-26 10:18',
  },
  {
    id: 'custom-3',
    name: '杯贴短文案',
    code: 'cup_label_copy',
    type: '文本',
    options: [],
    productTypes: ['标准商品'],
    relatedCount: 9,
    enabled: true,
    updatedAt: '2026-07-23 17:06',
  },
  {
    id: 'custom-4',
    name: '咖啡因含量',
    code: 'caffeine_value',
    type: '数字',
    options: [],
    productTypes: ['标准商品'],
    relatedCount: 6,
    enabled: false,
    updatedAt: '2026-07-20 09:41',
  },
];

const EMPTY_DRAFT: CustomAttributeDraft = {
  name: '',
  code: '',
  type: '单选',
  options: [],
  productTypes: ['标准商品'],
  enabled: true,
};

export const WebCustomAttributeManager: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'全部' | '启用' | '停用'>('全部');
  const [draft, setDraft] = useState<CustomAttributeDraft | null>(null);
  const [optionText, setOptionText] = useState('');

  const filteredRecords = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return records.filter(record => {
      const matchesKeyword = !normalized
        || `${record.name} ${record.code} ${record.type} ${record.options.join(' ')}`.toLowerCase().includes(normalized);
      const matchesStatus = status === '全部'
        || (status === '启用' ? record.enabled : !record.enabled);
      return matchesKeyword && matchesStatus;
    });
  }, [keyword, records, status]);

  const openEditor = (record?: CustomAttributeRecord) => {
    setDraft(record
      ? {
          id: record.id,
          name: record.name,
          code: record.code,
          type: record.type,
          options: [...record.options],
          productTypes: [...record.productTypes],
          enabled: record.enabled,
        }
      : { ...EMPTY_DRAFT, productTypes: [...EMPTY_DRAFT.productTypes] });
    setOptionText(record?.options.join('、') || '');
  };

  const saveDraft = () => {
    if (!draft) return;
    const name = draft.name.trim();
    const code = draft.code.trim();
    if (!name || !code) return;
    const options = ['单选', '多选'].includes(draft.type)
      ? optionText.split(/[、,，]/).map(item => item.trim()).filter(Boolean)
      : [];

    if (draft.id) {
      setRecords(previous => previous.map(record => (
        record.id === draft.id
          ? {
              ...record,
              ...draft,
              name,
              code,
              options,
              updatedAt: '2026-07-30 11:20',
            }
          : record
      )));
    } else {
      setRecords(previous => [
        {
          id: `custom-${Date.now()}`,
          name,
          code,
          type: draft.type,
          options,
          productTypes: draft.productTypes,
          relatedCount: 0,
          enabled: draft.enabled,
          updatedAt: '2026-07-30 11:20',
        },
        ...previous,
      ]);
    }
    setDraft(null);
  };

  return (
    <div className={embedded ? '' : 'flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA] p-4'}>
      <div className={embedded ? '' : 'min-h-full overflow-hidden rounded-lg bg-white'}>
        {!embedded && (
          <div className="border-b border-[#E6E8EB] px-6 py-5">
            <h2 className="text-[18px] font-semibold text-[#1D2129]">自定义属性</h2>
            <p className="mt-1 text-[13px] text-[#86909C]">维护渠道商品的扩展售卖与展示字段，不改变商品主档身份。</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E8EB] px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A2A9B3]" />
              <input
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
                placeholder="搜索属性名称或编码"
                className="h-9 w-[240px] rounded-md border border-[#D9DDE3] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]"
              />
            </div>
            <select
              value={status}
              onChange={event => setStatus(event.target.value as typeof status)}
              className="h-9 w-[120px] rounded-md border border-[#D9DDE3] bg-white px-3 text-[13px] text-[#4E5969] outline-none focus:border-[#00B460]"
            >
              <option>全部</option>
              <option>启用</option>
              <option>停用</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#00B460] px-4 text-[13px] font-medium text-white hover:bg-[#009F55]"
          >
            <Plus size={16} />
            新增属性
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-[13px]">
            <thead className="bg-[#F7F8FA] text-[#4E5969]">
              <tr>
                <th className="px-5 py-3 font-medium">属性名称</th>
                <th className="px-5 py-3 font-medium">属性编码</th>
                <th className="px-5 py-3 font-medium">类型</th>
                <th className="px-5 py-3 font-medium">可选值 / 规则</th>
                <th className="px-5 py-3 font-medium">适用商品</th>
                <th className="px-5 py-3 font-medium">关联商品</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">更新时间</th>
                <th className="sticky right-0 w-[150px] bg-[#F7F8FA] px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id} className="border-b border-[#EEF0F2] hover:bg-[#FAFCFB]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ECF9F2] text-[#00A95A]">
                        <Braces size={16} />
                      </span>
                      <span className="font-medium text-[#1D2129]">{record.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-[12px] text-[#667085]">{record.code}</td>
                  <td className="px-5 py-4 text-[#4E5969]">{record.type}</td>
                  <td className="max-w-[260px] px-5 py-4 text-[#4E5969]">
                    {record.options.length ? record.options.join('、') : record.type === '数字' ? '数值输入' : '自由文本'}
                  </td>
                  <td className="px-5 py-4 text-[#4E5969]">{record.productTypes.join('、')}</td>
                  <td className="px-5 py-4 text-[#00A95A]">{record.relatedCount} 个</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setRecords(previous => previous.map(item => item.id === record.id ? { ...item, enabled: !item.enabled } : item))}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[12px] ${record.enabled ? 'bg-[#EAF8F1] text-[#008F4C]' : 'bg-[#F2F3F5] text-[#86909C]'}`}
                    >
                      {record.enabled && <Check size={12} />}
                      {record.enabled ? '启用' : '停用'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-[#667085]">{record.updatedAt}</td>
                  <td className="sticky right-0 bg-white px-5 py-4 text-right group-hover:bg-[#FAFCFB]">
                    <button
                      type="button"
                      onClick={() => openEditor(record)}
                      className="inline-flex items-center gap-1 text-[#00A95A] hover:text-[#008F4C]"
                    >
                      <Pencil size={14} />
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6">
          <div className="w-full max-w-[620px] rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E6E8EB] px-6 py-4">
              <h3 className="text-[17px] font-semibold text-[#1D2129]">{draft.id ? '编辑自定义属性' : '新增自定义属性'}</h3>
              <button type="button" onClick={() => setDraft(null)} className="text-[#86909C] hover:text-[#1D2129]"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-5 px-6 py-5">
              <label className="text-[13px] text-[#4E5969]">
                <span className="mb-2 block font-medium">属性名称 <em className="not-italic text-[#F53F3F]">*</em></span>
                <input
                  value={draft.name}
                  onChange={event => setDraft({ ...draft, name: event.target.value })}
                  className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 outline-none focus:border-[#00B460]"
                  placeholder="例如：辣度偏好"
                />
              </label>
              <label className="text-[13px] text-[#4E5969]">
                <span className="mb-2 block font-medium">属性编码 <em className="not-italic text-[#F53F3F]">*</em></span>
                <input
                  value={draft.code}
                  onChange={event => setDraft({ ...draft, code: event.target.value })}
                  className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 outline-none focus:border-[#00B460]"
                  placeholder="英文或数字"
                />
              </label>
              <label className="text-[13px] text-[#4E5969]">
                <span className="mb-2 block font-medium">属性类型</span>
                <select
                  value={draft.type}
                  onChange={event => setDraft({ ...draft, type: event.target.value as CustomAttributeType })}
                  className="h-10 w-full rounded-md border border-[#D9DDE3] bg-white px-3 outline-none focus:border-[#00B460]"
                >
                  <option>单选</option>
                  <option>多选</option>
                  <option>文本</option>
                  <option>数字</option>
                </select>
              </label>
              <label className="text-[13px] text-[#4E5969]">
                <span className="mb-2 block font-medium">适用商品</span>
                <select
                  value={draft.productTypes.join(',')}
                  onChange={event => setDraft({ ...draft, productTypes: event.target.value.split(',') })}
                  className="h-10 w-full rounded-md border border-[#D9DDE3] bg-white px-3 outline-none focus:border-[#00B460]"
                >
                  <option value="标准商品">标准商品</option>
                  <option value="套餐商品">套餐商品</option>
                  <option value="标准商品,套餐商品">标准商品、套餐商品</option>
                </select>
              </label>
              {['单选', '多选'].includes(draft.type) && (
                <label className="col-span-2 text-[13px] text-[#4E5969]">
                  <span className="mb-2 block font-medium">可选值</span>
                  <input
                    value={optionText}
                    onChange={event => setOptionText(event.target.value)}
                    className="h-10 w-full rounded-md border border-[#D9DDE3] px-3 outline-none focus:border-[#00B460]"
                    placeholder="使用顿号或逗号分隔，例如：不辣、微辣、中辣"
                  />
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-[#E6E8EB] px-6 py-4">
              <button type="button" onClick={() => setDraft(null)} className="h-9 rounded-md border border-[#D9DDE3] px-5 text-[13px] text-[#4E5969]">取消</button>
              <button type="button" onClick={saveDraft} className="h-9 rounded-md bg-[#00B460] px-5 text-[13px] font-medium text-white hover:bg-[#009F55]">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
