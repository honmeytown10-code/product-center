import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Download,
  Edit3,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useProducts } from '../../context';
import { ALL_OMNICHANNEL_CHANNELS, getOmnichannelConfig, isThirdPartyChannelId, resolveTemplateProductSource } from '../../omnichannel';
import type { OmnichannelChannel } from '../../omnichannel';
import { WebProductTemplateDetail } from './WebProductTemplateDetail';

type TemplateStatus = 'enabled' | 'disabled';

type TemplateGroup = {
  id: string;
  name: string;
  level: number;
};

type ProductTemplateRecord = {
  id: string;
  name: string;
  description: string;
  status: TemplateStatus;
  productCount: number;
  storeCount: number;
  groupId: string;
  channels: OmnichannelChannel['id'][];
};

type TemplateEditorState = {
  id?: string;
  name: string;
  description: string;
  groupId: string;
  channels: OmnichannelChannel['id'][];
};

const INITIAL_GROUPS: TemplateGroup[] = [
  { id: 'all', name: '全部模板', level: 0 },
  { id: 'area-1', name: '区域模板', level: 0 },
  { id: 'test-2', name: '渠道试点', level: 0 },
  { id: 'test-2-1', name: '在线点', level: 1 },
  { id: 'test-2-2', name: '外卖渠道', level: 1 },
  { id: 'test-1', name: '新品试点', level: 0 },
  { id: 'ungrouped', name: '未分组', level: 0 },
];

const INITIAL_RECORDS: ProductTemplateRecord[] = [
  { id: 'tpl-1', name: '全国堂食标准模板', description: 'POS与小程序堂食统一菜单', status: 'enabled', productCount: 8, storeCount: 10, groupId: 'ungrouped', channels: ['pos', 'mini_program_dine_in'] },
  { id: 'tpl-2', name: '华东外卖菜单模板', description: '外卖区域商品差异', status: 'enabled', productCount: 7, storeCount: 8, groupId: 'area-1', channels: ['meituan', 'taobao'] },
  { id: 'tpl-3', name: '在线点渠道模板', description: '在线点新品测试', status: 'enabled', productCount: 5, storeCount: 5, groupId: 'test-2-1', channels: ['douyin', 'meituan_dine'] },
  { id: 'tpl-4', name: '全国外卖渠道模板', description: '外卖渠道统一菜单', status: 'enabled', productCount: 9, storeCount: 9, groupId: 'test-2-2', channels: ['meituan', 'taobao', 'meituan_pinhaofan'] },
  { id: 'tpl-6', name: '华南外卖菜单模板', description: '华南区域门店', status: 'enabled', productCount: 7, storeCount: 6, groupId: 'area-1', channels: ['meituan', 'taobao'] },
  { id: 'tpl-7', name: '外卖新品试点模板', description: '小程序外卖与三方外卖固定门店试售', status: 'enabled', productCount: 4, storeCount: 4, groupId: 'test-1', channels: ['mini_program_delivery', 'meituan', 'taobao'] },
  { id: 'tpl-8', name: '停用历史模板', description: '-', status: 'disabled', productCount: 2, storeCount: 0, groupId: 'ungrouped', channels: ['pos'] },
];

const EMPTY_EDITOR: TemplateEditorState = {
  name: '',
  description: '',
  groupId: 'ungrouped',
  channels: ['pos', 'mini_program_dine_in'],
};

export const WebProductTemplateManager: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { products, activeBrandId, brandConfigs } = useProducts();
  const omnichannelConfig = getOmnichannelConfig(brandConfigs[activeBrandId] || brandConfigs.b_1);
  const [records, setRecords] = useState<ProductTemplateRecord[]>(INITIAL_RECORDS);
  const [groups, setGroups] = useState<TemplateGroup[]>(INITIAL_GROUPS);
  const [keyword, setKeyword] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | OmnichannelChannel['id']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TemplateStatus>('all');
  const [activeGroupId, setActiveGroupId] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editor, setEditor] = useState<TemplateEditorState | null>(null);
  const [managedTemplateId, setManagedTemplateId] = useState<string | null>(null);
  const [groupEditor, setGroupEditor] = useState<{ id?: string; name: string } | null>(null);
  const [groupMenuId, setGroupMenuId] = useState<string | null>(null);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'enable' | 'disable' | 'delete-group'; ids?: string[]; record?: ProductTemplateRecord; group?: TemplateGroup } | null>(null);
  const [message, setMessage] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState('');
  const [templateProductIds, setTemplateProductIds] = useState<Record<string, string[]>>(() => Object.fromEntries(
    INITIAL_RECORDS.map(record => [record.id, products.slice(0, Math.min(record.productCount, products.length)).map(product => product.id)]),
  ));
  const [templateStoreIds, setTemplateStoreIds] = useState<Record<string, string[]>>(() => Object.fromEntries(
    INITIAL_RECORDS.map(record => [record.id, Array.from({ length: Math.min(record.storeCount, 12) }, (_, index) => `store-${index + 1}`)]),
  ));

  const editorSource = resolveTemplateProductSource(omnichannelConfig, editor?.channels || []);
  const statusCounts = useMemo(() => ({
    all: records.length,
    enabled: records.filter(record => record.status === 'enabled').length,
    disabled: records.filter(record => record.status === 'disabled').length,
  }), [records]);

  const filteredRecords = useMemo(() => records.filter(record => {
    const normalized = keyword.trim().toLowerCase();
    if (normalized && !record.name.toLowerCase().includes(normalized) && !record.description.toLowerCase().includes(normalized) && !record.id.toLowerCase().includes(normalized)) return false;
    if (statusFilter !== 'all' && record.status !== statusFilter) return false;
    if (channelFilter !== 'all' && !record.channels.includes(channelFilter)) return false;
    if (activeGroupId !== 'all' && record.groupId !== activeGroupId) return false;
    return true;
  }), [activeGroupId, channelFilter, keyword, records, statusFilter]);

  const visibleIds = filteredRecords.map(record => record.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

  const openCreate = () => {
    setEditor({ ...EMPTY_EDITOR, channels: [...EMPTY_EDITOR.channels] });
  };

  const openEdit = (record: ProductTemplateRecord) => {
    setRowMenuId(null);
    setEditor({ id: record.id, name: record.name, description: record.description === '-' ? '' : record.description, groupId: record.groupId, channels: [...record.channels] });
  };

  const saveTemplate = () => {
    if (!editor || !editor.name.trim() || editor.channels.length === 0 || !editorSource.valid) return;
    if (editor.id) {
      setRecords(prev => prev.map(record => record.id === editor.id ? { ...record, name: editor.name.trim(), description: editor.description.trim() || '-', groupId: editor.groupId, channels: editor.channels } : record));
      setMessage(`模板“${editor.name.trim()}”已保存`);
    } else {
      const id = `tpl-${Date.now()}`;
      setRecords(prev => [{ id, name: editor.name.trim(), description: editor.description.trim() || '-', status: 'enabled', productCount: 0, storeCount: 0, groupId: editor.groupId, channels: editor.channels }, ...prev]);
      setTemplateProductIds(prev => ({ ...prev, [id]: [] }));
      setTemplateStoreIds(prev => ({ ...prev, [id]: [] }));
      setMessage(`模板“${editor.name.trim()}”已创建，请继续添加商品和门店`);
    }
    setEditor(null);
  };

  const copyTemplate = (record: ProductTemplateRecord) => {
    const id = `tpl-${Date.now()}`;
    setRecords(prev => [{ ...record, id, name: `${record.name}-副本`, status: 'disabled' }, ...prev]);
    setTemplateProductIds(prev => ({ ...prev, [id]: [...(prev[record.id] || [])] }));
    setTemplateStoreIds(prev => ({ ...prev, [id]: [...(prev[record.id] || [])] }));
    setRowMenuId(null);
    setMessage(`已复制“${record.name}”，副本默认停用`);
  };

  const executeConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete-group' && confirmAction.group) {
      const group = confirmAction.group;
      setRecords(prev => prev.map(record => record.groupId === group.id ? { ...record, groupId: 'ungrouped' } : record));
      setGroups(prev => prev.filter(item => item.id !== group.id));
      if (activeGroupId === group.id) setActiveGroupId('all');
      setMessage(`分组“${group.name}”已删除，原模板已移至未分组`);
    } else {
      const ids = confirmAction.ids || (confirmAction.record ? [confirmAction.record.id] : []);
      if (confirmAction.type === 'delete') {
        setRecords(prev => prev.filter(record => !ids.includes(record.id)));
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        setMessage(`已删除 ${ids.length} 个模板`);
      } else {
        const status: TemplateStatus = confirmAction.type === 'enable' ? 'enabled' : 'disabled';
        setRecords(prev => prev.map(record => ids.includes(record.id) ? { ...record, status } : record));
        setMessage(`${ids.length} 个模板已${status === 'enabled' ? '启用' : '停用'}`);
      }
    }
    setConfirmAction(null);
    setRowMenuId(null);
    setGroupMenuId(null);
  };

  const saveGroup = () => {
    if (!groupEditor?.name.trim()) return;
    if (groupEditor.id) setGroups(prev => prev.map(group => group.id === groupEditor.id ? { ...group, name: groupEditor.name.trim() } : group));
    else setGroups(prev => [...prev.slice(0, -1), { id: `group-${Date.now()}`, name: groupEditor.name.trim(), level: 0 }, prev[prev.length - 1]]);
    setGroupEditor(null);
  };

  const exportTemplates = () => {
    const rows = records.map(record => [record.name, record.description, record.status === 'enabled' ? '启用' : '停用', record.channels.map(id => ALL_OMNICHANNEL_CHANNELS.find(channel => channel.id === id)?.name).join('、'), record.productCount, record.storeCount]);
    const blob = new Blob([`\uFEFF${['模板名称,描述,状态,渠道,商品数,门店数', ...rows.map(row => row.join(','))].join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '商品模板.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('商品模板已导出');
  };

  const managedTemplate = records.find(record => record.id === managedTemplateId);
  if (managedTemplate) {
    const source = resolveTemplateProductSource(omnichannelConfig, managedTemplate.channels);
    const storeConflicts = (Object.entries(templateStoreIds) as Array<[string, string[]]>).reduce<Record<string, string>>((acc, [templateId, storeIds]) => {
      const other = records.find(record => record.id === templateId && record.id !== managedTemplate.id && record.status === 'enabled' && record.channels.some(channel => managedTemplate.channels.includes(channel)));
      if (other) storeIds.forEach(storeId => { acc[storeId] = other.name; });
      return acc;
    }, {});
    return (
      <WebProductTemplateDetail
        template={managedTemplate}
        products={products}
        productIds={templateProductIds[managedTemplate.id] || []}
        storeIds={templateStoreIds[managedTemplate.id] || []}
        sourceLabel={source.source?.label || '配置待完善'}
        sourceDescription={source.message}
        storeConflicts={storeConflicts}
        onCreatePublish={() => onNavigate?.('product_sync')}
        onProductIdsChange={ids => {
          setTemplateProductIds(prev => ({ ...prev, [managedTemplate.id]: ids }));
          setRecords(prev => prev.map(record => record.id === managedTemplate.id ? { ...record, productCount: ids.length } : record));
        }}
        onStoreIdsChange={ids => {
          setTemplateStoreIds(prev => ({ ...prev, [managedTemplate.id]: ids }));
          setRecords(prev => prev.map(record => record.id === managedTemplate.id ? { ...record, storeCount: ids.length } : record));
        }}
        onBack={() => setManagedTemplateId(null)}
      />
    );
  }

  return (
    <div className="relative flex-1 bg-[#F5F6FA] p-3">
      <div className="console-panel flex h-full flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#EDEDED] px-4">
          <div className="flex h-full items-center gap-8">
            {(['all', 'enabled', 'disabled'] as const).map(status => <button key={status} type="button" onClick={() => { setStatusFilter(status); setSelectedIds([]); }} className={`h-full border-b-2 px-1 text-sm font-medium ${statusFilter === status ? 'border-[#00C06B] text-[#00A35B]' : 'border-transparent text-[#666]'}`}>{status === 'all' ? '全部' : status === 'enabled' ? '已启用' : '已停用'} <span className="ml-1 text-xs text-[#999]">{statusCounts[status]}</span></button>)}
          </div>
          <button type="button" onClick={openCreate} className="console-primary-button"><Plus size={16} />创建模板</button>
        </div>

        {message && <div className="flex shrink-0 items-center justify-between border-b border-[#CBEFDC] bg-[#F1FFF7] px-4 py-2 text-sm text-[#087A49]"><span>{message}</span><button type="button" onClick={() => setMessage('')} className="rounded p-1 hover:bg-white/70" aria-label="关闭提示"><X size={14} /></button></div>}

        <div className="flex shrink-0 items-center justify-between border-b border-[#EDEDED] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索模板名称、描述、ID" className="w-64 rounded-lg border border-[#E5E7EB] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]" /></div>
            <select value={channelFilter} onChange={event => setChannelFilter(event.target.value as typeof channelFilter)} className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#555] outline-none focus:border-[#00C06B]"><option value="all">全部渠道</option>{ALL_OMNICHANNEL_CHANNELS.map(channel => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select>
            {(keyword || channelFilter !== 'all' || statusFilter !== 'all') && <button type="button" onClick={() => { setKeyword(''); setChannelFilter('all'); setStatusFilter('all'); }} className="text-sm text-[#00A35B]">清空筛选</button>}
          </div>
          <div className="flex items-center gap-3"><button type="button" onClick={() => { setImportFile(''); setShowImport(true); }} className="inline-flex items-center rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#555] hover:bg-[#FAFAFA]"><Upload size={15} className="mr-1.5" />导入</button><button type="button" onClick={exportTemplates} className="inline-flex items-center rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#555] hover:bg-[#FAFAFA]"><Download size={15} className="mr-1.5" />导出</button></div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex w-[196px] shrink-0 flex-col border-r border-[#EDEDED] bg-[#FAFAFA]">
            <div className="p-3"><button type="button" onClick={() => setGroupEditor({ name: '' })} className="flex w-full items-center justify-center rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#555] hover:border-[#8BD7AE] hover:text-[#00A35B]"><FolderPlus size={15} className="mr-1.5" />新增分组</button></div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">{groups.map(group => { const active = activeGroupId === group.id; const count = group.id === 'all' ? records.length : records.filter(record => record.groupId === group.id).length; return <div key={group.id} className="relative"><button type="button" onClick={() => { setActiveGroupId(group.id); setSelectedIds([]); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${active ? 'bg-[#EAF8F1] font-medium text-[#00A35B]' : 'text-[#666] hover:bg-white'}`} style={{ paddingLeft: `${12 + group.level * 16}px` }}><span className="truncate">{group.name}</span><span className="ml-2 text-xs text-[#999]">{count}</span></button>{group.id !== 'all' && group.id !== 'ungrouped' && <button type="button" onClick={() => setGroupMenuId(groupMenuId === group.id ? null : group.id)} className="absolute right-7 top-1.5 rounded p-1 text-[#999] hover:bg-white" aria-label={`${group.name}更多操作`}><MoreHorizontal size={14} /></button>}{groupMenuId === group.id && <div className="absolute left-10 top-9 z-20 w-28 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"><button type="button" onClick={() => { setGroupEditor({ id: group.id, name: group.name }); setGroupMenuId(null); }} className="block w-full px-3 py-2 text-left text-xs text-[#555] hover:bg-[#F5FBF8]">重命名</button><button type="button" onClick={() => setConfirmAction({ type: 'delete-group', group })} className="block w-full px-3 py-2 text-left text-xs text-[#D92D20] hover:bg-[#FFF8F7]">删除分组</button></div>}</div>; })}</div>
          </div>

          <div className="min-w-0 flex-1 overflow-auto">
            <table className="min-w-[1040px] table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-xs font-bold text-[#555]"><tr><th className="w-12 border-b border-[#EDEDED] px-4 py-3"><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedIds(prev => allVisibleSelected ? prev.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds])))} className="h-4 w-4 accent-[#00C06B]" /></th><th className="w-[260px] border-b border-[#EDEDED] px-4 py-3">模板</th><th className="w-[200px] border-b border-[#EDEDED] px-4 py-3">商品来源</th><th className="w-[260px] border-b border-[#EDEDED] px-4 py-3">适用渠道</th><th className="w-[110px] border-b border-[#EDEDED] px-4 py-3">范围</th><th className="w-[100px] border-b border-[#EDEDED] px-4 py-3">状态</th><th className="w-[160px] border-b border-[#EDEDED] px-4 py-3">操作</th></tr></thead>
              <tbody>{filteredRecords.map(record => { const source = resolveTemplateProductSource(omnichannelConfig, record.channels); const selected = selectedIds.includes(record.id); return <tr key={record.id} className={selected ? 'bg-[#F0FBF5]' : 'hover:bg-[#FAFBFC]'}><td className="border-b border-[#F1F1F1] px-4 py-4"><input type="checkbox" checked={selected} onChange={() => setSelectedIds(prev => selected ? prev.filter(id => id !== record.id) : [...prev, record.id])} className="h-4 w-4 accent-[#00C06B]" /></td><td className="border-b border-[#F1F1F1] px-4 py-4"><button type="button" onClick={() => setManagedTemplateId(record.id)} className="max-w-full truncate font-medium text-[#00A35B] hover:underline" title={record.name}>{record.name}</button><div className="mt-1 truncate text-xs text-[#999]" title={record.description}>{record.description} · {record.id}</div></td><td className="border-b border-[#F1F1F1] px-4 py-4"><div className={`text-sm ${source.valid ? 'text-[#444]' : 'text-[#D92D20]'}`}>{source.source?.label || '来源冲突'}</div>{!source.valid && <div className="mt-1 text-xs text-[#D92D20]">需拆分模板</div>}</td><td className="border-b border-[#F1F1F1] px-4 py-4"><div className="flex flex-wrap gap-1">{record.channels.map(channelId => <span key={channelId} className="rounded border border-[#E5E7EB] bg-white px-2 py-1 text-[11px] text-[#666]">{ALL_OMNICHANNEL_CHANNELS.find(channel => channel.id === channelId)?.shortName}</span>)}</div></td><td className="border-b border-[#F1F1F1] px-4 py-4 text-[#666]">{record.productCount} 商品<br /><span className="text-xs text-[#999]">{record.storeCount} 门店</span></td><td className="border-b border-[#F1F1F1] px-4 py-4"><span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${record.status === 'enabled' ? 'bg-[#EAF8F1] text-[#00A35B]' : 'bg-[#F5F5F5] text-[#999]'}`}>{record.status === 'enabled' ? '已启用' : '已停用'}</span></td><td className="relative border-b border-[#F1F1F1] px-4 py-4"><button type="button" onClick={() => setManagedTemplateId(record.id)} className="mr-4 text-[#00A35B]">管理</button><button type="button" onClick={() => openEdit(record)} className="mr-3 text-[#00A35B]">编辑</button><button type="button" onClick={() => setRowMenuId(rowMenuId === record.id ? null : record.id)} className="rounded p-1 text-[#999] hover:bg-[#F5F5F5]" aria-label={`${record.name}更多操作`}><MoreHorizontal size={16} /></button>{rowMenuId === record.id && <div className="absolute right-4 top-11 z-20 w-32 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"><button type="button" onClick={() => copyTemplate(record)} className="flex w-full items-center px-3 py-2 text-left text-xs text-[#555] hover:bg-[#F5FBF8]"><Copy size={13} className="mr-2" />复制模板</button><button type="button" onClick={() => setConfirmAction({ type: record.status === 'enabled' ? 'disable' : 'enable', record })} className="flex w-full items-center px-3 py-2 text-left text-xs text-[#555] hover:bg-[#F5FBF8]">{record.status === 'enabled' ? '停用模板' : '启用模板'}</button><button type="button" onClick={() => setConfirmAction({ type: 'delete', record })} className="flex w-full items-center px-3 py-2 text-left text-xs text-[#D92D20] hover:bg-[#FFF8F7]"><Trash2 size={13} className="mr-2" />删除模板</button></div>}</td></tr>; })}{filteredRecords.length === 0 && <tr><td colSpan={7} className="py-16 text-center"><div className="text-sm text-[#999]">{records.length === 0 ? '暂未创建商品模板' : '没有符合条件的模板'}</div><button type="button" onClick={() => records.length === 0 ? openCreate() : (setKeyword(''), setChannelFilter('all'), setStatusFilter('all'), setActiveGroupId('all'))} className="mt-2 text-sm text-[#00A35B]">{records.length === 0 ? '创建第一个模板' : '清空筛选条件'}</button></td></tr>}</tbody>
            </table>
          </div>
        </div>

        <div className="flex h-12 shrink-0 items-center justify-between border-t border-[#EDEDED] px-4 text-sm text-[#666]"><span>{selectedIds.length > 0 ? `已选择 ${selectedIds.length} 个模板` : `共 ${filteredRecords.length} 条`}</span>{selectedIds.length > 0 ? <div className="flex gap-2"><button type="button" onClick={() => setConfirmAction({ type: 'enable', ids: selectedIds })} className="rounded-lg border border-[#E5E7EB] px-3 py-1.5">批量启用</button><button type="button" onClick={() => setConfirmAction({ type: 'disable', ids: selectedIds })} className="rounded-lg border border-[#E5E7EB] px-3 py-1.5">批量停用</button><button type="button" onClick={() => setConfirmAction({ type: 'delete', ids: selectedIds })} className="rounded-lg border border-red-200 px-3 py-1.5 text-[#D92D20]">批量删除</button><button type="button" onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-[#999]">取消选择</button></div> : <span className="text-xs text-[#999]">20 条/页 · 第 1 页</span>}</div>
      </div>

      {editor && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-6"><div className="flex max-h-[86vh] w-[760px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4"><div><div className="text-base font-bold text-[#222]">{editor.id ? '编辑商品模板' : '创建商品模板'}</div><div className="mt-1 text-xs text-[#999]">全部售卖渠道均可选择；商品来源和可维护字段由全渠道策略自动判定</div></div><button type="button" onClick={() => setEditor(null)} className="text-[#999]" aria-label="关闭"><X size={18} /></button></div><div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5"><label className="block text-sm text-[#555]"><span><span className="mr-1 text-red-500">*</span>模板名称</span><input value={editor.name} maxLength={30} onChange={event => setEditor(prev => prev && ({ ...prev, name: event.target.value }))} placeholder="请输入模板名称" className={`mt-2 w-full rounded-lg border px-3 py-2 outline-none ${editor.name.trim() ? 'border-[#E5E7EB] focus:border-[#00C06B]' : 'border-red-300'}`} /></label><label className="block text-sm text-[#555]"><span>模板描述</span><textarea value={editor.description} maxLength={200} onChange={event => setEditor(prev => prev && ({ ...prev, description: event.target.value }))} placeholder="选填，请说明该模板的经营差异" className="mt-2 min-h-[72px] w-full rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#00C06B]" /><div className="mt-1 text-right text-xs text-[#999]">{editor.description.length}/200</div></label><label className="block text-sm text-[#555]"><span>所属分组</span><select value={editor.groupId} onChange={event => setEditor(prev => prev && ({ ...prev, groupId: event.target.value }))} className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 outline-none focus:border-[#00C06B]">{groups.filter(group => group.id !== 'all').map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><div><div className="mb-2 text-sm text-[#555]"><span className="mr-1 text-red-500">*</span>适用渠道</div><div className="grid grid-cols-3 gap-2">{ALL_OMNICHANNEL_CHANNELS.map(channel => { const selected = editor.channels.includes(channel.id); const platformManaged = isThirdPartyChannelId(channel.id) && omnichannelConfig.thirdPartyStrategies[channel.id] === 'platform'; return <button key={channel.id} type="button" onClick={() => setEditor(prev => prev && ({ ...prev, channels: selected ? prev.channels.filter(id => id !== channel.id) : [...prev.channels, channel.id] }))} className={`flex items-center rounded-lg border px-3 py-3 text-left text-sm ${selected ? 'border-[#8BD7AE] bg-[#F0FBF5] text-[#008F53]' : 'border-[#E5E7EB] text-[#666]'}`}><span className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${selected ? 'border-[#00C06B] bg-[#00C06B]' : 'border-[#C9CDD4]'}`}>{selected && <Check size={11} className="text-white" />}</span><span className="min-w-0"><span className="block truncate">{channel.name}</span>{platformManaged && <span className="mt-0.5 block text-[10px] text-[#86909C]">平台维护资料 · 企迈生成镜像</span>}</span></button>; })}</div></div><div className={`rounded-lg border p-4 ${editorSource.valid ? 'border-[#CBEFDC] bg-[#F1FFF7]' : 'border-red-200 bg-red-50'}`}><div className="flex items-start"><AlertTriangle size={16} className={`mr-2 mt-0.5 shrink-0 ${editorSource.valid ? 'text-[#00A35B]' : 'text-[#D92D20]'}`} /><div><div className={`text-sm font-bold ${editorSource.valid ? 'text-[#087A49]' : 'text-[#D92D20]'}`}>{editorSource.valid ? `商品来源：${editorSource.source?.label}` : '适用渠道存在商品来源冲突'}</div><div className="mt-1 text-xs leading-5 text-[#666]">{editorSource.message || '请至少选择一个渠道'}</div>{editorSource.valid && editorSource.source?.type === 'master' && <div className="mt-1.5 text-xs leading-5 text-[#667085]">该模板用于下发企迈侧门店渠道商品；平台特有字段和平台商品仍在对应平台维护，下发后通过商品映射支撑接单、上下架与库存。</div>}</div></div></div>{editor.id && <div className="rounded-lg border border-orange-100 bg-orange-50 p-3 text-xs leading-5 text-orange-700">修改适用渠道可能改变商品来源和发布目标；若来源变为多个商品库，必须拆分模板后才能保存。</div>}</div><div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4"><button type="button" onClick={() => setEditor(null)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={saveTemplate} disabled={!editor.name.trim() || editor.channels.length === 0 || !editorSource.valid} className="rounded-lg bg-[#00C06B] px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{editor.id ? '保存修改' : '创建并继续配置'}</button></div></div></div>}

      {groupEditor && <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/35 p-6"><div className="w-[420px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4"><div className="font-bold text-[#222]">{groupEditor.id ? '重命名模板分组' : '新增模板分组'}</div><button type="button" onClick={() => setGroupEditor(null)} className="text-[#999]" aria-label="关闭"><X size={18} /></button></div><div className="p-5"><label className="text-sm text-[#555]">分组名称<input value={groupEditor.name} maxLength={20} autoFocus onChange={event => setGroupEditor(prev => prev && ({ ...prev, name: event.target.value }))} className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#00C06B]" placeholder="请输入分组名称" /></label></div><div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-5 py-4"><button type="button" onClick={() => setGroupEditor(null)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" disabled={!groupEditor.name.trim()} onClick={saveGroup} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">保存</button></div></div></div>}

      {showImport && <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/35 p-6"><div className="w-[500px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4"><div><div className="font-bold text-[#222]">导入商品模板</div><div className="mt-1 text-xs text-[#999]">上传后先校验模板名称、渠道和商品来源，不直接创建</div></div><button type="button" onClick={() => setShowImport(false)} className="text-[#999]" aria-label="关闭"><X size={18} /></button></div><div className="p-5"><label className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-[#CFCFCF] bg-[#FAFAFA] px-4 py-8"><Upload size={24} className="text-[#00A35B]" /><span className="mt-2 text-sm text-[#555]">选择 Excel 或 CSV 文件</span><input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={event => setImportFile(event.target.files?.[0]?.name || '')} /></label>{importFile && <div className="mt-3 rounded-lg bg-[#F1FFF7] px-3 py-2 text-sm text-[#087A49]">已选择：{importFile}</div>}</div><div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-5 py-4"><button type="button" onClick={() => setShowImport(false)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" disabled={!importFile} onClick={() => { setShowImport(false); setMessage('文件校验完成：模板字段和商品来源均可导入'); }} className="rounded-lg bg-[#00C06B] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">开始校验</button></div></div></div>}

      {confirmAction && <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/35 p-6"><div className="w-[470px] overflow-hidden rounded-lg bg-white shadow-xl"><div className="flex items-start gap-3 px-6 py-5"><div className="rounded-full bg-[#FFF1F0] p-2 text-[#D92D20]"><AlertTriangle size={18} /></div><div><div className="font-bold text-[#222]">{confirmAction.type === 'delete-group' ? '删除模板分组' : confirmAction.type === 'delete' ? '删除商品模板' : confirmAction.type === 'disable' ? '停用商品模板' : '启用商品模板'}</div><div className="mt-2 text-sm leading-6 text-[#666]">{confirmAction.type === 'delete-group' ? `分组“${confirmAction.group?.name}”删除后，其中模板移至“未分组”，模板本身不会删除。` : confirmAction.type === 'delete' ? `将删除 ${confirmAction.ids?.length || 1} 个模板及其商品、门店范围配置；已创建的发布记录不受影响。` : confirmAction.type === 'disable' ? `停用后模板不再用于新的发布任务；现有门店商品不会自动回滚。` : `启用后模板可用于创建新的发布任务，仍需通过发布中心下发。`}</div></div></div><div className="flex justify-end gap-3 border-t border-[#E5E7EB] px-6 py-4"><button type="button" onClick={() => setConfirmAction(null)} className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#666]">取消</button><button type="button" onClick={executeConfirm} className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${confirmAction.type === 'enable' ? 'bg-[#00C06B]' : 'bg-[#D92D20]'}`}>确认{confirmAction.type === 'delete-group' || confirmAction.type === 'delete' ? '删除' : confirmAction.type === 'disable' ? '停用' : '启用'}</button></div></div></div>}
    </div>
  );
};
