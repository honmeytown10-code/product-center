import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { POS_STORE_NAME, PosCategories, PosStatusFilters, PosDialog, PosDock, PosEmpty, PosResult, PosSelection } from './PosWorkspace';
type MethodRow = {
  id: string;
  storeId: string;
  methodName: string;
  methodValue: string;
  methodCode: string;
  remark: string;
  prompt: string;
  multiValue: boolean;
  optionType: '必选' | '非必选';
  enabled: boolean;
};

const INITIAL_METHOD_ROWS: MethodRow[] = [
  { id: 'r1', storeId: 's1', methodName: '温度哒', methodValue: '热', methodCode: '', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r2', storeId: 's1', methodName: '温度哒', methodValue: '少冰', methodCode: '', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r3', storeId: 's1', methodName: '温度哒', methodValue: '多冰', methodCode: '', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r4', storeId: 's1', methodName: '温度1111', methodValue: '冷', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r5', storeId: 's1', methodName: '温度1111', methodValue: '热', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r6', storeId: 's1', methodName: '温度1111', methodValue: '温', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r7', storeId: 's1', methodName: '温度1111', methodValue: '冰', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r8', storeId: 's1', methodName: '温度1111', methodValue: '少冰', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r9', storeId: 's1', methodName: '温度1111', methodValue: '多冰', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r10', storeId: 's1', methodName: '温度1111', methodValue: '正常冰', methodCode: '1', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r11', storeId: 's2', methodName: '甜度', methodValue: '七分糖', methodCode: 'sweet-7', remark: '区域门店自定义', prompt: '糖度调整后口感更佳', multiValue: false, optionType: '必选', enabled: false },
  { id: 'r12', storeId: 's1', methodName: '温度', methodValue: '去冰', methodCode: 'temp-no-ice', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r13', storeId: 's1', methodName: '温度', methodValue: '少冰', methodCode: 'temp-less-ice', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r14', storeId: 's1', methodName: '温度', methodValue: '常温', methodCode: 'temp-room', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r15', storeId: 's1', methodName: '温度', methodValue: '温热', methodCode: 'temp-warm', remark: '', prompt: '小心烫口', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r16', storeId: 's1', methodName: '温度', methodValue: '热饮', methodCode: 'temp-hot', remark: '冬季限定', prompt: '小心烫口', multiValue: false, optionType: '必选', enabled: false },
  { id: 'r17', storeId: 's1', methodName: '甜度', methodValue: '无糖', methodCode: 'sweet-0', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r18', storeId: 's1', methodName: '甜度', methodValue: '三分糖', methodCode: 'sweet-3', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r19', storeId: 's1', methodName: '甜度', methodValue: '五分糖', methodCode: 'sweet-5', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r20', storeId: 's1', methodName: '甜度', methodValue: '七分糖', methodCode: 'sweet-7', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r21', storeId: 's1', methodName: '甜度', methodValue: '正常糖', methodCode: 'sweet-10', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: false },
  { id: 'r22', storeId: 's1', methodName: '奶基底', methodValue: '鲜牛乳', methodCode: 'milk-fresh', remark: '', prompt: '', multiValue: false, optionType: '非必选', enabled: true },
  { id: 'r23', storeId: 's1', methodName: '奶基底', methodValue: '燕麦奶', methodCode: 'milk-oat', remark: '加价 3 元', prompt: '', multiValue: false, optionType: '非必选', enabled: true },
  { id: 'r24', storeId: 's1', methodName: '奶基底', methodValue: '椰乳', methodCode: 'milk-coconut', remark: '加价 2 元', prompt: '', multiValue: false, optionType: '非必选', enabled: true },
  { id: 'r25', storeId: 's1', methodName: '奶基底', methodValue: '厚乳', methodCode: 'milk-thick', remark: '原料临时缺货', prompt: '', multiValue: false, optionType: '非必选', enabled: false },
  { id: 'r26', storeId: 's1', methodName: '加料', methodValue: '珍珠', methodCode: 'addon-pearl', remark: '加价 2 元', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r27', storeId: 's1', methodName: '加料', methodValue: '椰果', methodCode: 'addon-coconut-jelly', remark: '加价 2 元', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r28', storeId: 's1', methodName: '加料', methodValue: '仙草冻', methodCode: 'addon-grass-jelly', remark: '加价 2 元', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r29', storeId: 's1', methodName: '加料', methodValue: '蜜红豆', methodCode: 'addon-red-bean', remark: '加价 3 元', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r30', storeId: 's1', methodName: '加料', methodValue: '小芋圆', methodCode: 'addon-taro-ball', remark: '原料临时缺货', prompt: '', multiValue: true, optionType: '非必选', enabled: false },
  { id: 'r31', storeId: 's1', methodName: '加料', methodValue: '脆啵啵', methodCode: 'addon-popping', remark: '加价 3 元', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r32', storeId: 's1', methodName: '口味偏好', methodValue: '少盐', methodCode: 'taste-less-salt', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r33', storeId: 's1', methodName: '口味偏好', methodValue: '免辣', methodCode: 'taste-no-spicy', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r34', storeId: 's1', methodName: '口味偏好', methodValue: '微辣', methodCode: 'taste-mild', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r35', storeId: 's1', methodName: '口味偏好', methodValue: '中辣', methodCode: 'taste-medium', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r36', storeId: 's1', methodName: '口味偏好', methodValue: '特辣', methodCode: 'taste-extra', remark: '暂不供应', prompt: '', multiValue: true, optionType: '非必选', enabled: false },
  { id: 'r37', storeId: 's1', methodName: '口味偏好', methodValue: '免葱', methodCode: 'taste-no-scallion', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r38', storeId: 's1', methodName: '口味偏好', methodValue: '免香菜', methodCode: 'taste-no-coriander', remark: '', prompt: '', multiValue: true, optionType: '非必选', enabled: true },
  { id: 'r39', storeId: 's1', methodName: '包装', methodValue: '堂食', methodCode: 'pack-dine', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r40', storeId: 's1', methodName: '包装', methodValue: '打包', methodCode: 'pack-takeaway', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r41', storeId: 's1', methodName: '包装', methodValue: '分装', methodCode: 'pack-separate', remark: '高峰期暂停', prompt: '', multiValue: false, optionType: '非必选', enabled: false },
  { id: 'r42', storeId: 's1', methodName: '包装', methodValue: '需要餐具', methodCode: 'pack-cutlery', remark: '', prompt: '', multiValue: false, optionType: '非必选', enabled: true },
  { id: 'r43', storeId: 's1', methodName: '咖啡浓度', methodValue: '单份浓缩', methodCode: 'coffee-single', remark: '', prompt: '', multiValue: false, optionType: '非必选', enabled: true },
  { id: 'r44', storeId: 's1', methodName: '咖啡浓度', methodValue: '双份浓缩', methodCode: 'coffee-double', remark: '加价 3 元', prompt: '', multiValue: false, optionType: '非必选', enabled: true },
  { id: 'r45', storeId: 's1', methodName: '咖啡浓度', methodValue: '低咖啡因', methodCode: 'coffee-decaf', remark: '原料临时缺货', prompt: '', multiValue: false, optionType: '非必选', enabled: false },
  { id: 'r46', storeId: 's1', methodName: '杯型', methodValue: '中杯', methodCode: 'cup-medium', remark: '', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r47', storeId: 's1', methodName: '杯型', methodValue: '大杯', methodCode: 'cup-large', remark: '加价 2 元', prompt: '', multiValue: false, optionType: '必选', enabled: true },
  { id: 'r48', storeId: 's1', methodName: '杯型', methodValue: '超大杯', methodCode: 'cup-extra-large', remark: '加价 4 元', prompt: '', multiValue: false, optionType: '必选', enabled: true },
];


export const PosMethodView: React.FC<{ search: string; onReset: () => void }> = ({ search, onReset }) => {
  const [rows, setRows] = useState(INITIAL_METHOD_ROWS);
  const [category, setCategory] = useState('全部');
  const [filter, setFilter] = useState<'all' | 'disabled'>('all');
  const [batch, setBatch] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<{ rows: MethodRow[]; enabled: boolean } | null>(null);
  const [result, setResult] = useState('');
  const storeRows = rows.filter(row => row.storeId === 's1');
  const categories: string[] = ['全部', ...new Set<string>(storeRows.map((row: MethodRow) => row.methodName))];
  const matched = storeRows.filter(row => (category === '全部' || row.methodName === category) && [row.methodName, row.methodValue, row.methodCode, row.remark].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  const visible = matched.filter(row => filter === 'all' || !row.enabled);
  useEffect(() => { setSelection(new Set()); }, [category, filter, search]);
  const toggle = (id: string) => setSelection(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const exit = () => { setBatch(false); setSelection(new Set()); };
  const openAction = (enabled: boolean) => setAction({ rows: visible.filter(row => selection.has(row.id)), enabled });
  const confirm = () => {
    if (!action) return;
    const ids = new Set(action.rows.map(row => row.id));
    setRows(prev => prev.map(row => ids.has(row.id) ? { ...row, enabled: action.enabled } : row));
    setResult('已' + (action.enabled ? '启用' : '禁用') + ' ' + ids.size + ' 项做法 · 当前门店全部渠道生效');
    setAction(null); exit();
  };
  return <div className="pos-view">
    <PosCategories items={categories} value={category} onChange={setCategory} />
    <PosResult message={result} onClose={() => setResult('')} />
    <div className="pos-grid-scroll" key={category + filter + search}>
      <div className="pos-grid pos-method-grid" data-status-view={filter !== 'all'}>{visible.map(row => <button key={row.id} className={'pos-card' + (!row.enabled ? ' is-disabled' : '') + (batch && selection.has(row.id) ? ' is-selected' : '')} aria-label={row.methodName + ' · ' + row.methodValue + ' · ' + (row.enabled ? '已启用' : '已禁用')} aria-pressed={batch ? selection.has(row.id) : undefined} onClick={() => batch ? toggle(row.id) : setAction({ rows: [row], enabled: !row.enabled })}>
        <div className="pos-card-heading"><h3>{row.methodValue}</h3>{batch ? <PosSelection selected={selection.has(row.id)} /> : !row.enabled && <span className="pos-tag danger">已禁用</span>}</div>
        <div className="pos-card-footer">{row.enabled ? <><span className="pos-state">已启用</span><span className="pos-tag">{row.methodName}</span></> : <><span className="pos-tag">{row.methodName}</span>{!batch && <span className="pos-recover"><RotateCcw size={16} />恢复</span>}</>}</div>
      </button>)}</div>
      {!visible.length && <PosEmpty filtered={!!search || category !== '全部' || filter !== 'all'} onReset={() => { onReset(); setCategory('全部'); setFilter('all'); }} />}
    </div>
    <PosDock batch={batch} count={selection.size} allSelected={!!visible.length && visible.every(row => selection.has(row.id))} onSelectAll={() => setSelection(selection.size === visible.length ? new Set() : new Set(visible.map(row => row.id)))} onBatch={() => setBatch(true)} onExit={exit} filters={<PosStatusFilters value={filter} onChange={value => setFilter(value as 'all' | 'disabled')} options={[{ id: 'all', label: '全部', count: matched.length }, { id: 'disabled', label: '已禁用', count: matched.filter(row => !row.enabled).length, attention: true }]} />}>
      <button className="pos-button secondary" disabled={!selection.size} onClick={() => openAction(true)}>批量启用</button><button className="pos-button danger" disabled={!selection.size} onClick={() => openAction(false)}>批量禁用</button>
    </PosDock>
    {action && <PosDialog title={'确认' + (action.enabled ? '启用' : '禁用') + (action.rows.length > 1 ? '所选做法？' : '此做法？')} onClose={() => setAction(null)} footer={<><button className="pos-button quiet" onClick={() => setAction(null)}>取消</button><button className={'pos-button' + (!action.enabled ? ' danger' : '')} onClick={confirm}>{action.enabled ? '确认启用' : '确认禁用'}</button></>}>
      <h3>{action.rows.map(row => row.methodValue).join('、')}</h3>
      <p>{POS_STORE_NAME} · 全部渠道</p>
      <p>{action.enabled ? '确认后立即恢复可选，关联商品可继续选择这些做法。' : '确认后立即禁用，关联商品点单时不可再选择这些做法；需要时可在卡片上恢复。'}</p>
      {action.rows.length === 1 && <dl>{Object.entries({ '做法名称': action.rows[0].methodName, '做法标识码': action.rows[0].methodCode || '—', '备注': action.rows[0].remark || '—', '温馨提示': action.rows[0].prompt || '—', '做法值多选': action.rows[0].multiValue ? '已开启' : '已关闭', '做法选项': action.rows[0].optionType }).map(([key, value]) => <React.Fragment key={key}><dt>{key}</dt><dd>{value}</dd></React.Fragment>)}</dl>}
    </PosDialog>}
  </div>;
};
