import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  FileSliders,
  LockKeyhole,
  MoreHorizontal,
  PackageSearch,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Users,
  X,
} from 'lucide-react';

type ActivityOrigin = 'system' | 'merchant';
type ActivityStatus = 'enabled' | 'disabled';
type StatusFilter = 'all' | ActivityStatus;
type OriginFilter = 'all' | ActivityOrigin;
type ActivityMode = 'manual' | 'algorithm' | 'promotion' | 'pairing';
type Audience = 'all' | 'member_tag' | 'paid_member';
type NonMemberVisibility = 'hidden' | 'visible_locked';

type RecommendationActivity = {
  id: string;
  name: string;
  description: string;
  origin: ActivityOrigin;
  mode: ActivityMode;
  modeLabel: string;
  templateCount: number;
  deliverySummary: string;
  enabled: boolean;
  updatedAt: string;
  supportsTemplates: boolean;
  productAction?: 'manage' | 'exclude';
};

type DeliveryRule = {
  channels: string[];
  saleTypes: string[];
  timeMode: 'all_day' | 'custom';
  customTime: string;
  audience: Audience;
  paidMemberCardId: string;
  nonMemberVisibility: NonMemberVisibility;
  stores: string[];
};

type RecommendationTemplate = {
  id: string;
  activityId: string;
  name: string;
  description: string;
  productCount: number;
  displayTime: string;
  enabled: boolean;
  updatedAt: string;
  rule: DeliveryRule;
};

const CUSTOM_ACTIVITY_LIMIT = 20;
const CHANNELS = ['微信小程序', '支付宝小程序'];
const SALE_TYPES = ['堂食', '外卖'];
const STORE_OPTIONS = ['上海静安店', '上海虹桥店', '杭州湖滨店', '杭州城西店', '南京新街口店', '苏州中心店'];
const PAID_MEMBER_CARDS = [
  { id: 'CARD-SLIM-0', name: '减肥 0 元卡' },
  { id: 'CARD-YIXIN', name: 'yixin 卡' },
  { id: 'CARD-UNLOCK', name: '付费会员解锁' },
  { id: 'CARD-GUOZI', name: '郭子权益卡' },
  { id: 'CARD-VIP', name: '尊享会员权益卡' },
  { id: 'CARD-0812', name: '权益卡 0812' },
  { id: 'CARD-97', name: '97 的付费会员' },
  { id: 'CARD-FANGYUAN', name: '测试权益卡方圆' },
];
const PRODUCT_OPTIONS = [
  { id: 'P10018', name: '招牌厚乳拿铁', category: '咖啡', price: '￥22' },
  { id: 'P10027', name: '茉莉轻乳茶', category: '茶饮', price: '￥18' },
  { id: 'P10036', name: '海盐芝士蛋糕', category: '烘焙甜品', price: '￥16' },
  { id: 'P10045', name: '香辣鸡米花', category: '小食', price: '￥14' },
  { id: 'P10053', name: '经典薯条', category: '小食', price: '￥12' },
  { id: 'P10069', name: '葡萄冰萃', category: '果茶', price: '￥20' },
];

const INITIAL_ACTIVITIES: RecommendationActivity[] = [
  { id: 'REC-SYS-001', name: '商家推荐', description: '设置门店主推商品，在点单页重点展示。', origin: 'system', mode: 'manual', modeLabel: '商品配置', templateCount: 2, deliverySummary: '微信小程序 · 全部门店', enabled: true, updatedAt: '2026-09-12 14:32', supportsTemplates: true, productAction: 'manage' },
  { id: 'REC-SYS-002', name: '新品推荐', description: '设置需要重点曝光的新品。', origin: 'system', mode: 'manual', modeLabel: '商品配置', templateCount: 1, deliverySummary: '微信小程序 · 全部门店', enabled: true, updatedAt: '2026-09-11 10:18', supportsTemplates: true, productAction: 'manage' },
  { id: 'REC-SYS-003', name: '猜你喜欢', description: '根据顾客偏好，由系统智能生成推荐商品。', origin: 'system', mode: 'algorithm', modeLabel: '智能生成', templateCount: 0, deliverySummary: '微信小程序 · 全部门店', enabled: true, updatedAt: '2026-09-08 09:40', supportsTemplates: false },
  { id: 'REC-SYS-004', name: '我的常点', description: '根据用户历史购买商品的件数排序展示。', origin: 'system', mode: 'algorithm', modeLabel: '智能生成', templateCount: 0, deliverySummary: '微信小程序 · 会员用户', enabled: true, updatedAt: '2026-09-08 09:38', supportsTemplates: false },
  { id: 'REC-SYS-005', name: '热销商品', description: '根据历史销量排行展示商品。', origin: 'system', mode: 'algorithm', modeLabel: '智能生成', templateCount: 0, deliverySummary: '微信小程序 · 全部门店', enabled: true, updatedAt: '2026-09-05 16:20', supportsTemplates: false },
  { id: 'REC-SYS-006', name: '活动商品', description: '根据促销活动设置自动生成，支持屏蔽不需展示的商品。', origin: 'system', mode: 'promotion', modeLabel: '活动生成', templateCount: 0, deliverySummary: '微信小程序 · 活动适用门店', enabled: true, updatedAt: '2026-09-03 13:16', supportsTemplates: false, productAction: 'exclude' },
  { id: 'REC-SYS-007', name: 'X 秒未点推荐', description: '进入点单页指定时间未点商品时自动推荐。', origin: 'system', mode: 'algorithm', modeLabel: '智能生成', templateCount: 0, deliverySummary: '微信小程序 · 20 秒触发', enabled: false, updatedAt: '2026-08-29 11:04', supportsTemplates: false },
  { id: 'REC-SYS-008', name: '单品搭配', description: '选购指定商品时，推荐与其搭配的商品。', origin: 'system', mode: 'pairing', modeLabel: '商品搭配', templateCount: 1, deliverySummary: '微信小程序 · 全部门店', enabled: true, updatedAt: '2026-08-26 17:52', supportsTemplates: true, productAction: 'manage' },
  { id: 'REC-CUS-001', name: '秋日暖饮专区', description: '秋季限定热饮和烘焙搭配推荐。', origin: 'merchant', mode: 'manual', modeLabel: '自定义推荐', templateCount: 2, deliverySummary: '微信小程序 · 华东 68 家', enabled: true, updatedAt: '2026-09-14 18:06', supportsTemplates: true, productAction: 'manage' },
  { id: 'REC-CUS-002', name: '工作日下午茶', description: '工作日 14:00–17:00 展示下午茶组合。', origin: 'merchant', mode: 'manual', modeLabel: '自定义推荐', templateCount: 1, deliverySummary: '微信小程序 · 12 家门店', enabled: false, updatedAt: '2026-09-10 15:22', supportsTemplates: true, productAction: 'manage' },
];

const defaultRule = (overrides: Partial<DeliveryRule> = {}): DeliveryRule => ({
  channels: ['微信小程序'],
  saleTypes: ['堂食', '外卖'],
  timeMode: 'all_day',
  customTime: '09:00–22:00',
  audience: 'all',
  paidMemberCardId: 'all',
  nonMemberVisibility: 'hidden',
  stores: [...STORE_OPTIONS],
  ...overrides,
});

const INITIAL_TEMPLATES: RecommendationTemplate[] = [
  { id: 'TPL-1001', activityId: 'REC-SYS-001', name: '全国门店默认推荐', description: '主推饮品与当季新品', productCount: 4, displayTime: '全时段', enabled: true, updatedAt: '2026-09-12 14:32', rule: defaultRule() },
  { id: 'TPL-1002', activityId: 'REC-SYS-001', name: '付费会员专享推荐', description: '付费会员专属组合，非会员可见并引导升级', productCount: 3, displayTime: '全时段', enabled: true, updatedAt: '2026-09-12 10:08', rule: defaultRule({ audience: 'paid_member', nonMemberVisibility: 'visible_locked', stores: STORE_OPTIONS.slice(0, 4) }) },
  { id: 'TPL-1101', activityId: 'REC-SYS-002', name: '9 月新品首发', description: '9 月新品推荐位', productCount: 2, displayTime: '2026-09-01 至 2026-09-30', enabled: true, updatedAt: '2026-09-11 10:18', rule: defaultRule({ timeMode: 'custom', customTime: '2026-09-01 至 2026-09-30' }) },
  { id: 'TPL-1201', activityId: 'REC-SYS-008', name: '咖啡搭配烘焙', description: '购买咖啡时推荐烘焙商品', productCount: 2, displayTime: '全时段', enabled: true, updatedAt: '2026-08-26 17:52', rule: defaultRule({ saleTypes: ['堂食'] }) },
  { id: 'TPL-2001', activityId: 'REC-CUS-001', name: '华东秋季主推', description: '华东区域门店秋日暖饮', productCount: 3, displayTime: '2026-09-01 至 2026-11-30', enabled: true, updatedAt: '2026-09-14 18:06', rule: defaultRule({ timeMode: 'custom', customTime: '2026-09-01 至 2026-11-30', stores: STORE_OPTIONS.slice(0, 4) }) },
  { id: 'TPL-2002', activityId: 'REC-CUS-001', name: '付费会员暖饮', description: '会员专享暖饮，非会员展示升级入口', productCount: 2, displayTime: '全时段', enabled: false, updatedAt: '2026-09-13 09:45', rule: defaultRule({ audience: 'paid_member', nonMemberVisibility: 'visible_locked' }) },
  { id: 'TPL-2101', activityId: 'REC-CUS-002', name: '工作日下午茶', description: '仅工作日下午时段展示', productCount: 3, displayTime: '工作日 14:00–17:00', enabled: false, updatedAt: '2026-09-10 15:22', rule: defaultRule({ timeMode: 'custom', customTime: '工作日 14:00–17:00', stores: STORE_OPTIONS.slice(0, 3) }) },
];

const INITIAL_TEMPLATE_PRODUCTS: Record<string, string[]> = {
  'TPL-1001': ['P10018', 'P10027', 'P10036', 'P10045'],
  'TPL-1002': ['P10018', 'P10036', 'P10053'],
  'TPL-1101': ['P10027', 'P10069'],
  'TPL-1201': ['P10036', 'P10045'],
  'TPL-2001': ['P10018', 'P10027', 'P10036'],
  'TPL-2002': ['P10018', 'P10069'],
  'TPL-2101': ['P10027', 'P10036', 'P10053'],
};

export const WebProductRecommendationManager: React.FC = () => {
  const preview = new URLSearchParams(window.location.search).get('recommendPreview');
  const previewTemplate = INITIAL_TEMPLATES.find(template => template.id === 'TPL-1002') || null;
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [templateProducts, setTemplateProducts] = useState(INITIAL_TEMPLATE_PRODUCTS);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all');
  const [activeActivityId, setActiveActivityId] = useState<string | null>(preview === 'templates' || preview === 'delivery' ? 'REC-SYS-001' : null);
  const [activityEditor, setActivityEditor] = useState<RecommendationActivity | 'create' | null>(null);
  const [activityDetail, setActivityDetail] = useState<RecommendationActivity | null>(null);
  const [templateEditor, setTemplateEditor] = useState<RecommendationTemplate | 'create' | null>(null);
  const [productEditor, setProductEditor] = useState<RecommendationTemplate | null>(null);
  const [deliveryEditor, setDeliveryEditor] = useState<RecommendationTemplate | null>(preview === 'delivery' ? previewTemplate : null);
  const [excludedProductsOpen, setExcludedProductsOpen] = useState(false);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ kind: 'toggle-activity' | 'delete-activity' | 'toggle-template' | 'delete-template'; id: string } | null>(null);
  const [toast, setToast] = useState('');

  const activeActivity = activities.find(activity => activity.id === activeActivityId) || null;
  const customCount = activities.filter(activity => activity.origin === 'merchant').length;
  const visibleActivities = useMemo(() => activities.filter(activity => {
    const normalized = keyword.trim().toLowerCase();
    const matchesKeyword = !normalized || `${activity.name} ${activity.id} ${activity.description} ${activity.modeLabel} ${activity.deliverySummary}`.toLowerCase().includes(normalized);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'enabled' ? activity.enabled : !activity.enabled);
    const matchesOrigin = originFilter === 'all' || activity.origin === originFilter;
    return matchesKeyword && matchesStatus && matchesOrigin;
  }), [activities, keyword, originFilter, statusFilter]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const openTemplates = (activity: RecommendationActivity) => {
    if (!activity.supportsTemplates) return;
    setActiveActivityId(activity.id);
    setKeyword('');
    setStatusFilter('all');
    setRowMenuId(null);
  };

  const saveActivity = (draft: Pick<RecommendationActivity, 'id' | 'name' | 'description' | 'enabled'>) => {
    if (activityEditor === 'create') {
      const next: RecommendationActivity = { ...draft, origin: 'merchant', mode: 'manual', modeLabel: '自定义推荐', templateCount: 0, deliverySummary: '尚未配置投放规则', updatedAt: '刚刚', supportsTemplates: true, productAction: 'manage' };
      setActivities(current => [next, ...current]);
      notify(`自定义推荐“${next.name}”已创建，请继续配置推荐模板`);
    } else {
      setActivities(current => current.map(activity => activity.id === draft.id ? { ...activity, ...draft, updatedAt: '刚刚' } : activity));
      notify(`推荐活动“${draft.name}”已保存`);
    }
    setActivityEditor(null);
  };

  const saveTemplate = (draft: RecommendationTemplate) => {
    const creating = templateEditor === 'create';
    setTemplates(current => creating ? [draft, ...current] : current.map(template => template.id === draft.id ? draft : template));
    if (creating) setTemplateProducts(current => ({ ...current, [draft.id]: [] }));
    if (activeActivity) setActivities(current => current.map(activity => activity.id === activeActivity.id ? { ...activity, templateCount: creating ? activity.templateCount + 1 : activity.templateCount, updatedAt: '刚刚' } : activity));
    notify(creating ? `模板“${draft.name}”已创建，默认停用` : `模板“${draft.name}”已保存`);
    setTemplateEditor(null);
  };

  const executePending = () => {
    if (!pending) return;
    if (pending.kind === 'toggle-activity') {
      const target = activities.find(item => item.id === pending.id);
      if (target) {
        setActivities(current => current.map(item => item.id === target.id ? { ...item, enabled: !item.enabled, updatedAt: '刚刚' } : item));
        notify(`推荐活动“${target.name}”已${target.enabled ? '停用' : '启用'}`);
      }
    } else if (pending.kind === 'delete-activity') {
      const target = activities.find(item => item.id === pending.id);
      if (target?.origin === 'merchant') {
        setActivities(current => current.filter(item => item.id !== target.id));
        setTemplates(current => current.filter(template => template.activityId !== target.id));
        notify(`自定义推荐“${target.name}”已删除`);
      }
    } else if (pending.kind === 'toggle-template') {
      const target = templates.find(item => item.id === pending.id);
      if (target) {
        setTemplates(current => current.map(item => item.id === target.id ? { ...item, enabled: !item.enabled, updatedAt: '刚刚' } : item));
        notify(`模板“${target.name}”已${target.enabled ? '停用' : '启用'}`);
      }
    } else {
      const target = templates.find(item => item.id === pending.id);
      if (target) {
        setTemplates(current => current.filter(item => item.id !== target.id));
        setActivities(current => current.map(activity => activity.id === target.activityId ? { ...activity, templateCount: Math.max(0, activity.templateCount - 1), updatedAt: '刚刚' } : activity));
        notify(`模板“${target.name}”已删除`);
      }
    }
    setPending(null);
    setRowMenuId(null);
  };

  const copyTemplate = (template: RecommendationTemplate) => {
    const id = `TPL-${Date.now()}`;
    setTemplates(current => [{ ...template, id, name: `${template.name}-副本`, enabled: false, updatedAt: '刚刚', rule: { ...template.rule, channels: [...template.rule.channels], saleTypes: [...template.rule.saleTypes], stores: [...template.rule.stores] } }, ...current]);
    setTemplateProducts(current => ({ ...current, [id]: [...(current[template.id] || [])] }));
    setActivities(current => current.map(activity => activity.id === template.activityId ? { ...activity, templateCount: activity.templateCount + 1, updatedAt: '刚刚' } : activity));
    setRowMenuId(null);
    notify(`已复制“${template.name}”，副本默认停用`);
  };

  const pendingTarget = pending?.kind.includes('activity') ? activities.find(item => item.id === pending.id) : templates.find(item => item.id === pending?.id);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#F5F6FA] p-3 text-[#1D2129]">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {activeActivity ? (
        <TemplateWorkspace activity={activeActivity} templates={templates.filter(template => template.activityId === activeActivity.id)} keyword={keyword} statusFilter={statusFilter} rowMenuId={rowMenuId} onKeywordChange={setKeyword} onStatusChange={setStatusFilter} onBack={() => { setActiveActivityId(null); setKeyword(''); setStatusFilter('all'); setRowMenuId(null); }} onCreate={() => setTemplateEditor('create')} onEdit={setTemplateEditor} onProducts={setProductEditor} onDelivery={setDeliveryEditor} onToggle={template => setPending({ kind: 'toggle-template', id: template.id })} onCopy={copyTemplate} onDelete={template => setPending({ kind: 'delete-template', id: template.id })} onRowMenuChange={setRowMenuId} />
      ) : (
        <ActivityWorkspace activities={activities} visibleActivities={visibleActivities} keyword={keyword} statusFilter={statusFilter} originFilter={originFilter} customCount={customCount} rowMenuId={rowMenuId} onKeywordChange={setKeyword} onStatusChange={setStatusFilter} onOriginChange={setOriginFilter} onReset={() => { setKeyword(''); setStatusFilter('all'); setOriginFilter('all'); }} onCreate={() => setActivityEditor('create')} onDetail={setActivityDetail} onEdit={setActivityEditor} onTemplates={openTemplates} onExcludeProducts={() => setExcludedProductsOpen(true)} onToggle={activity => setPending({ kind: 'toggle-activity', id: activity.id })} onDelete={activity => setPending({ kind: 'delete-activity', id: activity.id })} onRowMenuChange={setRowMenuId} />
      )}
      {activityEditor && <ActivityEditor initial={activityEditor === 'create' ? undefined : activityEditor} customCount={customCount} onClose={() => setActivityEditor(null)} onSave={saveActivity} />}
      {activityDetail && <ActivityDetail activity={activityDetail} onClose={() => setActivityDetail(null)} onEdit={() => { setActivityDetail(null); setActivityEditor(activityDetail); }} onTemplates={() => { setActivityDetail(null); openTemplates(activityDetail); }} />}
      {templateEditor && activeActivity && <TemplateEditor activity={activeActivity} initial={templateEditor === 'create' ? undefined : templateEditor} onClose={() => setTemplateEditor(null)} onSave={saveTemplate} />}
      {productEditor && <ProductManager template={productEditor} selectedIds={templateProducts[productEditor.id] || []} onClose={() => setProductEditor(null)} onSave={ids => { setTemplateProducts(current => ({ ...current, [productEditor.id]: ids })); setTemplates(current => current.map(template => template.id === productEditor.id ? { ...template, productCount: ids.length, updatedAt: '刚刚' } : template)); notify(`“${productEditor.name}”已保存 ${ids.length} 个推荐商品`); setProductEditor(null); }} />}
      {deliveryEditor && <DeliveryRuleEditor template={deliveryEditor} onClose={() => setDeliveryEditor(null)} onSave={rule => { setTemplates(current => current.map(template => template.id === deliveryEditor.id ? { ...template, rule, displayTime: rule.timeMode === 'all_day' ? '全时段' : rule.customTime, updatedAt: '刚刚' } : template)); notify(`“${deliveryEditor.name}”的投放规则已保存`); setDeliveryEditor(null); }} />}
      {excludedProductsOpen && <ExcludedProductsModal onClose={() => setExcludedProductsOpen(false)} onSave={() => { setExcludedProductsOpen(false); notify('活动商品屏蔽清单已保存'); }} />}
      {pending && pendingTarget && <ConfirmDialog kind={pending.kind} target={pendingTarget} onCancel={() => setPending(null)} onConfirm={executePending} />}
    </div>
  );
};

const ActivityWorkspace = ({
  activities, visibleActivities, keyword, statusFilter, originFilter, customCount, rowMenuId,
  onKeywordChange, onStatusChange, onOriginChange, onReset, onCreate, onDetail, onEdit,
  onTemplates, onExcludeProducts, onToggle, onDelete, onRowMenuChange,
}: {
  activities: RecommendationActivity[];
  visibleActivities: RecommendationActivity[];
  keyword: string;
  statusFilter: StatusFilter;
  originFilter: OriginFilter;
  customCount: number;
  rowMenuId: string | null;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onOriginChange: (value: OriginFilter) => void;
  onReset: () => void;
  onCreate: () => void;
  onDetail: (activity: RecommendationActivity) => void;
  onEdit: (activity: RecommendationActivity) => void;
  onTemplates: (activity: RecommendationActivity) => void;
  onExcludeProducts: () => void;
  onToggle: (activity: RecommendationActivity) => void;
  onDelete: (activity: RecommendationActivity) => void;
  onRowMenuChange: (id: string | null) => void;
}) => (
  <div className="console-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E9EDF2] px-4">
      <div className="flex h-full items-center gap-7">
        {([['all', '全部'], ['enabled', '已启用'], ['disabled', '已停用']] as Array<[StatusFilter, string]>).map(([value, label]) => (
          <button key={value} type="button" onClick={() => onStatusChange(value)} className={`h-full border-b-2 px-1 text-sm font-medium ${statusFilter === value ? 'border-[#00B460] text-[#008F4C]' : 'border-transparent text-[#667085]'}`}>
            {label}<span className="ml-1 text-xs text-[#98A2B3]">{value === 'all' ? activities.length : activities.filter(item => value === 'enabled' ? item.enabled : !item.enabled).length}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#667085]">自定义活动 {customCount}/{CUSTOM_ACTIVITY_LIMIT}</span>
        <button type="button" onClick={onCreate} disabled={customCount >= CUSTOM_ACTIVITY_LIMIT} className="console-primary-button disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} />新建自定义推荐</button>
      </div>
    </div>

    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E9EDF2] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <SearchInput value={keyword} onChange={onKeywordChange} placeholder="推荐活动名称、编号或描述" />
        <CompactSelect value={originFilter} onChange={value => onOriginChange(value as OriginFilter)} options={[['all', '全部来源'], ['system', '系统固定'], ['merchant', '商家自定义']]} />
        <button type="button" onClick={onReset} className="h-9 rounded-md border border-[#DDE2E8] px-4 text-[13px] text-[#4E5969] hover:bg-[#F7F8FA]">重置</button>
      </div>
      <div className="flex items-center gap-2 text-xs text-[#667085]"><ShieldCheck size={15} className="text-[#00A35B]" />系统固定活动不可删除；自定义活动上限已放宽至 {CUSTOM_ACTIVITY_LIMIT} 个</div>
    </div>

    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[1160px] table-fixed border-collapse text-left text-[13px]">
        <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-[#4E5969]">
          <tr className="border-b border-[#E5E7EB]">
            <th className="w-[250px] px-4 py-3 font-medium">推荐活动</th>
            <th className="w-[120px] px-3 py-3 font-medium">来源</th>
            <th className="w-[130px] px-3 py-3 font-medium">推荐生成方式</th>
            <th className="w-[110px] px-3 py-3 font-medium">推荐模板</th>
            <th className="px-3 py-3 font-medium">当前投放</th>
            <th className="w-[150px] px-3 py-3 font-medium">更新时间</th>
            <th className="w-[116px] px-3 py-3 font-medium">状态</th>
            <th className="sticky right-0 w-[218px] border-l border-[#E9EDF2] bg-[#F7F8FA] px-3 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {visibleActivities.map(activity => (
            <tr key={activity.id} className="border-b border-[#EEF0F3] hover:bg-[#FAFCFB]">
              <td className="px-4 py-3 align-top">
                <button type="button" onClick={() => onDetail(activity)} className="max-w-full text-left font-medium text-[#1D2129] hover:text-[#008F4C]">{activity.name}</button>
                <div className="mt-1 truncate text-xs text-[#98A2B3]" title={activity.description}>{activity.id} · {activity.description}</div>
              </td>
              <td className="px-3 py-3 align-top"><OriginBadge origin={activity.origin} /></td>
              <td className="px-3 py-3 align-top"><ModeBadge mode={activity.mode} label={activity.modeLabel} /></td>
              <td className="px-3 py-3 align-top">{activity.supportsTemplates ? <button type="button" onClick={() => onTemplates(activity)} className="font-medium text-[#008F4C]">{activity.templateCount} 个模板</button> : <span className="text-[#98A2B3]">无需模板</span>}</td>
              <td className="px-3 py-3 align-top text-[#4E5969]"><span className="line-clamp-2" title={activity.deliverySummary}>{activity.deliverySummary}</span></td>
              <td className="px-3 py-3 align-top text-[#667085]">{activity.updatedAt}</td>
              <td className="px-3 py-3 align-top"><StatusSwitch enabled={activity.enabled} onClick={() => onToggle(activity)} label={activity.enabled ? `停用${activity.name}` : `启用${activity.name}`} /></td>
              <td className="sticky right-0 border-l border-[#EEF0F3] bg-white px-3 py-3 align-top">
                <div className="relative flex items-center gap-3 whitespace-nowrap">
                  {activity.supportsTemplates && <button type="button" onClick={() => onTemplates(activity)} className="text-[#008F4C]">模板配置</button>}
                  {activity.productAction === 'exclude' && <button type="button" onClick={onExcludeProducts} className="text-[#008F4C]">屏蔽商品</button>}
                  <button type="button" onClick={() => onEdit(activity)} className="text-[#008F4C]">编辑</button>
                  <button type="button" onClick={() => onRowMenuChange(rowMenuId === activity.id ? null : activity.id)} aria-label={`更多${activity.name}操作`} className="rounded p-1 text-[#667085] hover:bg-[#F2F4F7]"><MoreHorizontal size={17} /></button>
                  {rowMenuId === activity.id && <div className="absolute right-0 top-7 z-30 w-36 rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg"><button type="button" onClick={() => onDetail(activity)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#F7F8FA]"><Eye size={14} />查看详情</button>{activity.origin === 'merchant' ? <button type="button" onClick={() => onDelete(activity)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#D92D20] hover:bg-[#FFF5F5]"><Trash2 size={14} />删除活动</button> : <div className="flex items-center gap-2 px-3 py-2 text-[#98A2B3]"><LockKeyhole size={14} />系统活动不可删除</div>}</div>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {visibleActivities.length === 0 && <EmptyState title="没有符合当前条件的推荐活动" action="清空筛选" onAction={onReset} />}
    </div>
  </div>
);

const TemplateWorkspace = ({ activity, templates, keyword, statusFilter, rowMenuId, onKeywordChange, onStatusChange, onBack, onCreate, onEdit, onProducts, onDelivery, onToggle, onCopy, onDelete, onRowMenuChange }: {
  activity: RecommendationActivity;
  templates: RecommendationTemplate[];
  keyword: string;
  statusFilter: StatusFilter;
  rowMenuId: string | null;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onBack: () => void;
  onCreate: () => void;
  onEdit: (template: RecommendationTemplate) => void;
  onProducts: (template: RecommendationTemplate) => void;
  onDelivery: (template: RecommendationTemplate) => void;
  onToggle: (template: RecommendationTemplate) => void;
  onCopy: (template: RecommendationTemplate) => void;
  onDelete: (template: RecommendationTemplate) => void;
  onRowMenuChange: (id: string | null) => void;
}) => {
  const visibleTemplates = templates.filter(template => {
    const normalized = keyword.trim().toLowerCase();
    const matchesKeyword = !normalized || `${template.name} ${template.id} ${template.description}`.toLowerCase().includes(normalized);
    return matchesKeyword && (statusFilter === 'all' || (statusFilter === 'enabled' ? template.enabled : !template.enabled));
  });
  return (
    <div className="console-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-[#E9EDF2] px-4 py-2">
        <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={onBack} aria-label="返回推荐活动" className="rounded-md border border-[#DDE2E8] p-2 text-[#667085] hover:bg-[#F7F8FA]"><ArrowLeft size={16} /></button><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{activity.name}</span><OriginBadge origin={activity.origin} /></div><div className="mt-0.5 text-xs text-[#98A2B3]">推荐模板 · 模板分别维护商品和投放规则</div></div></div>
        <button type="button" onClick={onCreate} className="console-primary-button"><Plus size={16} />创建推荐模板</button>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E9EDF2] px-4 py-3"><div className="flex items-center gap-2"><SearchInput value={keyword} onChange={onKeywordChange} placeholder="模板名称、编号或描述" /><CompactSelect value={statusFilter} onChange={value => onStatusChange(value as StatusFilter)} options={[['all', '全部状态'], ['enabled', '已启用'], ['disabled', '已停用']]} /></div><span className="text-xs text-[#667085]">共 {visibleTemplates.length} 个模板 · 启用 {templates.filter(item => item.enabled).length} 个</span></div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1220px] table-fixed border-collapse text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-[#F7F8FA] text-[#4E5969]"><tr className="border-b border-[#E5E7EB]"><th className="w-[210px] px-4 py-3 font-medium">模板名称</th><th className="w-[150px] px-3 py-3 font-medium">模板描述</th><th className="w-[110px] px-3 py-3 font-medium">模板类型</th><th className="w-[130px] px-3 py-3 font-medium">展示时间</th><th className="w-[90px] px-3 py-3 font-medium">推荐商品</th><th className="w-[200px] px-3 py-3 font-medium">投放规则</th><th className="w-[110px] px-3 py-3 font-medium">状态</th><th className="sticky right-0 w-[220px] border-l border-[#E9EDF2] bg-[#F7F8FA] px-3 py-3 font-medium">操作</th></tr></thead>
          <tbody>{visibleTemplates.map(template => <tr key={template.id} className="border-b border-[#EEF0F3] hover:bg-[#FAFCFB]"><td className="px-4 py-3 align-top"><div className="font-medium">{template.name}</div><div className="mt-1 text-xs text-[#98A2B3]">{template.id} · {template.updatedAt}</div></td><td className="px-3 py-3 align-top text-[#667085]"><span className="line-clamp-2" title={template.description}>{template.description || '--'}</span></td><td className="px-3 py-3 align-top"><span className="rounded bg-[#EEF8F3] px-2 py-1 text-xs text-[#008F4C]">{activity.origin === 'merchant' ? '自定义推荐' : activity.name}</span></td><td className="px-3 py-3 align-top text-[#4E5969]">{template.displayTime}</td><td className="px-3 py-3 align-top"><button type="button" onClick={() => onProducts(template)} className="font-medium text-[#008F4C]">{template.productCount} 个商品</button></td><td className="px-3 py-3 align-top text-[#4E5969]"><RuleSummary rule={template.rule} /></td><td className="px-3 py-3 align-top"><StatusSwitch enabled={template.enabled} onClick={() => onToggle(template)} label={template.enabled ? `停用${template.name}` : `启用${template.name}`} /></td><td className="sticky right-0 border-l border-[#EEF0F3] bg-white px-3 py-3 align-top"><div className="relative flex items-center gap-3 whitespace-nowrap"><button type="button" onClick={() => onProducts(template)} className="text-[#008F4C]">商品管理</button><button type="button" onClick={() => onDelivery(template)} className="text-[#008F4C]">投放规则</button><button type="button" onClick={() => onRowMenuChange(rowMenuId === template.id ? null : template.id)} aria-label={`更多${template.name}操作`} className="rounded p-1 text-[#667085] hover:bg-[#F2F4F7]"><MoreHorizontal size={17} /></button>{rowMenuId === template.id && <div className="absolute right-0 top-7 z-30 w-32 rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg"><button type="button" onClick={() => onEdit(template)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#F7F8FA]"><Settings2 size={14} />编辑模板</button><button type="button" onClick={() => onCopy(template)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#F7F8FA]"><Copy size={14} />复制模板</button><button type="button" onClick={() => onDelete(template)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#D92D20] hover:bg-[#FFF5F5]"><Trash2 size={14} />删除模板</button></div>}</div></td></tr>)}</tbody>
        </table>
        {visibleTemplates.length === 0 && <EmptyState title={templates.length ? '没有符合当前条件的推荐模板' : '还没有推荐模板'} description={templates.length ? '可调整关键词或状态筛选。' : '创建模板后，再配置推荐商品和投放规则。'} action={templates.length ? '清空筛选' : '创建推荐模板'} onAction={templates.length ? () => { onKeywordChange(''); onStatusChange('all'); } : onCreate} />}
      </div>
    </div>
  );
};

const ActivityEditor = ({ initial, customCount, onClose, onSave }: {
  initial?: RecommendationActivity;
  customCount: number;
  onClose: () => void;
  onSave: (draft: Pick<RecommendationActivity, 'id' | 'name' | 'description' | 'enabled'>) => void;
}) => {
  const systemFixed = initial?.origin === 'system';
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [error, setError] = useState('');
  const submit = () => {
    if (!name.trim()) return setError('请输入推荐活动名称');
    if (!description.trim()) return setError('请输入推荐活动说明');
    onSave({ id: initial?.id || `REC-CUS-${Date.now()}`, name: name.trim(), description: description.trim(), enabled });
  };
  return (
    <ModalFrame width="w-[620px]" title={initial ? `编辑推荐活动 · ${initial.name}` : '新建自定义推荐'} subtitle={systemFixed ? '系统固定活动仅可调整展示说明和启用状态，不可删除或改变生成方式。' : `商家可创建独立推荐活动，当前 ${customCount}/${CUSTOM_ACTIVITY_LIMIT} 个。`} onClose={onClose} footerActions={<><button type="button" onClick={onClose} className="console-secondary-button">取消</button><button type="button" onClick={submit} className="console-primary-button">保存</button></>}>
      <div className="space-y-5 p-5 text-[13px]">
        <FormRow label="活动名称" required><input value={name} onChange={event => setName(event.target.value.slice(0, 30))} disabled={systemFixed} placeholder="最多 30 个字" className="console-input w-full disabled:bg-[#F5F6F7] disabled:text-[#98A2B3]" /><div className="mt-1 text-right text-xs text-[#98A2B3]">{name.length}/30</div></FormRow>
        <FormRow label="活动来源"><div className="flex h-9 items-center gap-2"><OriginBadge origin={systemFixed ? 'system' : 'merchant'} />{systemFixed && <span className="text-xs text-[#98A2B3]">名称和生成方式由系统维护</span>}</div></FormRow>
        <FormRow label="推荐生成方式"><div className="rounded-md border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-2.5 text-[#4E5969]">{initial?.modeLabel || '自定义推荐 · 商品配置'}</div></FormRow>
        <FormRow label="活动说明" required><textarea value={description} onChange={event => setDescription(event.target.value.slice(0, 100))} rows={3} className="w-full resize-none rounded-md border border-[#DDE2E8] px-3 py-2 outline-none focus:border-[#00B460]" /><div className="mt-1 text-right text-xs text-[#98A2B3]">{description.length}/100</div></FormRow>
        <FormRow label="启用状态"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} className="accent-[#00B460]" />{enabled ? '启用' : '停用'}</label><div className="mt-1 text-xs text-[#98A2B3]">新建自定义推荐默认停用，完成模板、商品和投放规则配置后再启用。</div></FormRow>
        {error && <div className="ml-[116px] flex items-center gap-2 text-[#D92D20]"><AlertCircle size={15} />{error}</div>}
      </div>
    </ModalFrame>
  );
};

const TemplateEditor = ({ activity, initial, onClose, onSave }: { activity: RecommendationActivity; initial?: RecommendationTemplate; onClose: () => void; onSave: (template: RecommendationTemplate) => void }) => {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError] = useState('');
  const submit = () => {
    if (!name.trim()) return setError('请输入模板名称');
    onSave(initial ? { ...initial, name: name.trim(), description: description.trim(), updatedAt: '刚刚' } : { id: `TPL-${Date.now()}`, activityId: activity.id, name: name.trim(), description: description.trim(), productCount: 0, displayTime: '全时段', enabled: false, updatedAt: '刚刚', rule: defaultRule() });
  };
  return (
    <ModalFrame width="w-[600px]" title={initial ? '编辑推荐模板' : '创建推荐模板'} subtitle={`所属推荐活动：${activity.name}`} onClose={onClose} footerActions={<><button type="button" onClick={onClose} className="console-secondary-button">取消</button><button type="button" onClick={submit} className="console-primary-button">保存</button></>}>
      <div className="space-y-5 p-5 text-[13px]">
        <FormRow label="模板名称" required><input value={name} onChange={event => setName(event.target.value.slice(0, 30))} placeholder="最多 30 个字" className="console-input w-full" /></FormRow>
        <FormRow label="模板描述"><textarea value={description} onChange={event => setDescription(event.target.value.slice(0, 100))} rows={3} placeholder="说明模板适用场景" className="w-full resize-none rounded-md border border-[#DDE2E8] px-3 py-2 outline-none focus:border-[#00B460]" /></FormRow>
        <FormRow label="模板类型"><div className="rounded-md border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-2.5 text-[#4E5969]">{activity.origin === 'merchant' ? '自定义推荐' : activity.name}</div></FormRow>
        <div className="ml-[116px] rounded-md border border-[#D9E9FF] bg-[#F5F9FF] p-3 text-xs leading-5 text-[#41658A]">保存后分别进入“商品管理”和“投放规则”完成配置。新模板默认停用，不会立即影响点单页。</div>
        {error && <div className="ml-[116px] text-[#D92D20]">{error}</div>}
      </div>
    </ModalFrame>
  );
};

const ProductManager = ({ template, selectedIds, onClose, onSave }: { template: RecommendationTemplate; selectedIds: string[]; onClose: () => void; onSave: (ids: string[]) => void }) => {
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState(selectedIds);
  const visibleProducts = PRODUCT_OPTIONS.filter(product => `${product.name} ${product.id} ${product.category}`.toLowerCase().includes(keyword.trim().toLowerCase()));
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  return (
    <ModalFrame width="w-[900px]" title="商品管理" subtitle={`推荐模板：${template.name} · 商品按 SPU 选择，实际可售规格沿用点单页商品状态。`} onClose={onClose} footer={<div className="mr-auto text-xs text-[#667085]">已选择 {selected.length} 个商品</div>} footerActions={<><button type="button" onClick={onClose} className="console-secondary-button">取消</button><button type="button" onClick={() => onSave(selected)} className="console-primary-button">保存商品</button></>}>
      <div className="flex h-[520px] min-h-0 text-[13px]">
        <div className="flex min-w-0 flex-1 flex-col border-r border-[#E9EDF2]">
          <div className="border-b border-[#E9EDF2] p-3"><SearchInput value={keyword} onChange={setKeyword} placeholder="搜索商品名称、编码或分类" width="w-full" /></div>
          <div className="min-h-0 flex-1 overflow-y-auto"><div className="grid grid-cols-[32px_1fr_110px_80px] border-b border-[#E9EDF2] bg-[#F7F8FA] px-4 py-2.5 font-medium text-[#4E5969]"><span /><span>商品</span><span>分类</span><span>参考价</span></div>{visibleProducts.map(product => <label key={product.id} className="grid cursor-pointer grid-cols-[32px_1fr_110px_80px] items-center border-b border-[#EEF0F3] px-4 py-3 hover:bg-[#FAFCFB]"><input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggle(product.id)} className="accent-[#00B460]" /><span><span className="font-medium">{product.name}</span><span className="mt-0.5 block text-xs text-[#98A2B3]">{product.id}</span></span><span className="text-[#667085]">{product.category}</span><span>{product.price}</span></label>)}</div>
        </div>
        <div className="flex w-[290px] flex-col"><div className="flex h-[61px] items-center justify-between border-b border-[#E9EDF2] px-4"><span className="font-medium">已选商品 {selected.length}</span><button type="button" onClick={() => setSelected([])} className="text-[#008F4C]">清空</button></div><div className="min-h-0 flex-1 overflow-y-auto p-3">{selected.map(id => { const product = PRODUCT_OPTIONS.find(item => item.id === id); return product ? <div key={id} className="mb-2 flex items-center justify-between rounded-md border border-[#E5E7EB] px-3 py-2"><div><div className="font-medium">{product.name}</div><div className="text-xs text-[#98A2B3]">{product.id}</div></div><button type="button" onClick={() => toggle(id)} aria-label={`移除${product.name}`} className="rounded p-1 text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#D92D20]"><X size={14} /></button></div> : null; })}{selected.length === 0 && <div className="flex h-full flex-col items-center justify-center text-[#98A2B3]"><PackageSearch size={30} className="mb-2" /><span>尚未选择商品</span></div>}</div></div>
      </div>
    </ModalFrame>
  );
};

const DeliveryRuleEditor = ({ template, onClose, onSave }: { template: RecommendationTemplate; onClose: () => void; onSave: (rule: DeliveryRule) => void }) => {
  const [rule, setRule] = useState<DeliveryRule>({ ...template.rule, channels: [...template.rule.channels], saleTypes: [...template.rule.saleTypes], stores: [...template.rule.stores] });
  const [storeKeyword, setStoreKeyword] = useState('');
  const [error, setError] = useState('');
  const updateList = (key: 'channels' | 'saleTypes' | 'stores', value: string) => setRule(current => ({ ...current, [key]: current[key].includes(value) ? current[key].filter(item => item !== value) : [...current[key], value] }));
  const submit = () => {
    if (!rule.channels.length) return setError('请至少选择一个展示渠道');
    if (!rule.saleTypes.length) return setError('请至少选择一个售卖类型');
    if (!rule.stores.length) return setError('请至少选择一家展示门店');
    if (rule.timeMode === 'custom' && !rule.customTime.trim()) return setError('请填写自定义展示时间');
    if (rule.audience === 'paid_member' && rule.paidMemberCardId !== 'all' && !PAID_MEMBER_CARDS.some(card => card.id === rule.paidMemberCardId)) return setError('请选择有效的付费会员卡');
    onSave(rule);
  };
  const filteredStores = STORE_OPTIONS.filter(store => store.includes(storeKeyword.trim()));
  const usesAllPaidMemberCards = rule.paidMemberCardId === 'all';
  const selectedPaidMemberCard = PAID_MEMBER_CARDS.find(card => card.id === rule.paidMemberCardId);
  return (
    <ModalFrame width="w-[940px]" title="投放规则" subtitle={`推荐模板：${template.name}`} onClose={onClose} footer={<div className="mr-auto flex items-center gap-2 text-xs text-[#667085]"><Store size={14} />已选 {rule.stores.length} 家门店</div>} footerActions={<><button type="button" onClick={onClose} className="console-secondary-button">取消</button><button type="button" onClick={submit} className="console-primary-button">保存投放规则</button></>}>
      <div className="max-h-[680px] overflow-y-auto p-5 text-[13px]">
        <section className="border-b border-[#EEF0F3] pb-5">
          <SectionTitle icon={<FileSliders size={16} />} title="展示场景" description="控制推荐模板在哪些点单场景生效。" />
          <div className="mt-4 space-y-4">
            <FormRow label="展示渠道" required><div className="flex gap-5">{CHANNELS.map(channel => <CheckOption key={channel} checked={rule.channels.includes(channel)} onChange={() => updateList('channels', channel)} label={channel} disabled={channel === '支付宝小程序'} suffix={channel === '支付宝小程序' ? '暂未接入' : undefined} />)}</div></FormRow>
            <FormRow label="售卖类型" required><div className="flex gap-5">{SALE_TYPES.map(type => <CheckOption key={type} checked={rule.saleTypes.includes(type)} onChange={() => updateList('saleTypes', type)} label={type} />)}</div></FormRow>
            <FormRow label="展示时间" required><div className="space-y-3"><div className="flex gap-5"><RadioOption checked={rule.timeMode === 'all_day'} onChange={() => setRule(current => ({ ...current, timeMode: 'all_day' }))} label="全时段" /><RadioOption checked={rule.timeMode === 'custom'} onChange={() => setRule(current => ({ ...current, timeMode: 'custom' }))} label="自定义时间" /></div>{rule.timeMode === 'custom' && <input value={rule.customTime} onChange={event => setRule(current => ({ ...current, customTime: event.target.value }))} placeholder="例如：工作日 14:00–17:00" className="console-input w-[320px]" />}</div></FormRow>
          </div>
        </section>

        <section className="border-b border-[#EEF0F3] py-5">
          <SectionTitle icon={<Users size={16} />} title="用户范围" description="先设置目标用户及会员卡范围，再配置未命中该范围的用户是否能看到推荐。" />
          <div className="mt-4 space-y-4">
            <FormRow label="目标用户" required><div className="flex flex-wrap gap-5"><RadioOption checked={rule.audience === 'all'} onChange={() => setRule(current => ({ ...current, audience: 'all', paidMemberCardId: 'all', nonMemberVisibility: 'hidden' }))} label="全部用户" /><RadioOption checked={rule.audience === 'member_tag'} onChange={() => setRule(current => ({ ...current, audience: 'member_tag', paidMemberCardId: 'all', nonMemberVisibility: 'hidden' }))} label="按会员标签" /><RadioOption checked={rule.audience === 'paid_member'} onChange={() => setRule(current => ({ ...current, audience: 'paid_member' }))} label="付费会员" /></div></FormRow>
            {rule.audience === 'paid_member' && (
              <>
                <FormRow label="付费会员卡" required>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <RadioOption checked={usesAllPaidMemberCards} onChange={() => setRule(current => ({ ...current, paidMemberCardId: 'all' }))} label="全部付费会员卡" />
                      <RadioOption checked={!usesAllPaidMemberCards} onChange={() => setRule(current => ({ ...current, paidMemberCardId: current.paidMemberCardId === 'all' ? '' : current.paidMemberCardId }))} label="指定付费会员卡" />
                      {!usesAllPaidMemberCards && (
                        <label className="relative block w-[280px] max-w-full">
                          <select value={rule.paidMemberCardId} onChange={event => setRule(current => ({ ...current, paidMemberCardId: event.target.value }))} className="h-9 w-full appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-9 text-[13px] outline-none focus:border-[#00B460]">
                            <option value="" disabled>请选择付费会员卡</option>
                            {PAID_MEMBER_CARDS.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                          </select>
                          <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
                        </label>
                      )}
                    </div>
                    <div className="text-xs leading-5 text-[#667085]">{usesAllPaidMemberCards ? '持有任一有效付费会员卡的用户均为目标用户；未持卡用户按非目标用户规则处理。' : selectedPaidMemberCard ? `仅持有“${selectedPaidMemberCard.name}”的用户为目标用户；其他用户（含持有其他付费会员卡的用户）均按非目标用户规则处理。` : '请选择一张付费会员卡。选中后，仅持有该卡的用户为目标用户。'}</div>
                  </div>
                </FormRow>
                <FormRow label="非目标用户" required alignTop>
                  <div>
                    <div className="mb-3 text-xs leading-5 text-[#667085]">设置未命中上述目标范围的用户是否看到推荐；目标用户可正常查看并购买。</div>
                    <div className="grid grid-cols-2 gap-3">
                      <ChoiceCard selected={rule.nonMemberVisibility === 'hidden'} icon={<EyeOff size={18} />} title="不展示" description="非目标用户看不到当前模板中的推荐商品。" onClick={() => setRule(current => ({ ...current, nonMemberVisibility: 'hidden' }))} />
                      <ChoiceCard selected={rule.nonMemberVisibility === 'visible_locked'} icon={<Eye size={18} />} title="展示但不可购买" description="非目标用户可看到当前模板中的推荐商品，但不能购买；具体提示或引导由点单页处理。" onClick={() => setRule(current => ({ ...current, nonMemberVisibility: 'visible_locked' }))} />
                    </div>
                  </div>
                </FormRow>
              </>
            )}
          </div>
        </section>

        <section className="pt-5">
          <SectionTitle icon={<Store size={16} />} title="展示门店" description="规则仅在已选门店生效，门店范围保存为本次选择快照。" />
          <div className="mt-4 grid grid-cols-[1fr_280px] overflow-hidden rounded-md border border-[#E5E7EB]">
            <div className="border-r border-[#E5E7EB]"><div className="flex items-center gap-2 border-b border-[#E5E7EB] p-3"><SearchInput value={storeKeyword} onChange={setStoreKeyword} placeholder="搜索门店名称" width="w-full" /><button type="button" onClick={() => setRule(current => ({ ...current, stores: [...STORE_OPTIONS] }))} className="h-9 shrink-0 text-[#008F4C]">全选</button></div><div className="grid max-h-44 grid-cols-2 overflow-y-auto p-2">{filteredStores.map(store => <label key={store} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-[#F7F8FA]"><input type="checkbox" checked={rule.stores.includes(store)} onChange={() => updateList('stores', store)} className="accent-[#00B460]" />{store}</label>)}</div></div>
            <div><div className="flex h-[61px] items-center justify-between border-b border-[#E5E7EB] px-3"><span className="font-medium">已选 {rule.stores.length} 家</span><button type="button" onClick={() => setRule(current => ({ ...current, stores: [] }))} className="text-[#008F4C]">清空</button></div><div className="max-h-44 overflow-y-auto p-2">{rule.stores.map(store => <div key={store} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-[#F7F8FA]"><span>{store}</span><button type="button" onClick={() => updateList('stores', store)} aria-label={`移除${store}`}><X size={13} className="text-[#98A2B3]" /></button></div>)}</div></div>
          </div>
        </section>
        {error && <div className="mt-4 flex items-center gap-2 text-[#D92D20]"><AlertCircle size={15} />{error}</div>}
      </div>
    </ModalFrame>
  );
};

const ActivityDetail = ({ activity, onClose, onEdit, onTemplates }: { activity: RecommendationActivity; onClose: () => void; onEdit: () => void; onTemplates: () => void }) => (
  <div className="fixed inset-0 z-[80] flex justify-end bg-black/35">
    <div className="flex h-full w-[560px] flex-col bg-white shadow-2xl">
      <div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-5"><div><h3 className="text-base font-semibold">推荐活动详情</h3><p className="mt-0.5 text-xs text-[#98A2B3]">{activity.id}</p></div><button type="button" onClick={onClose} aria-label="关闭"><X size={20} className="text-[#667085]" /></button></div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 text-[13px]"><div className="rounded-md border border-[#E5E7EB] bg-[#F7F8FA] p-4"><div className="flex items-center justify-between"><div className="text-base font-semibold">{activity.name}</div><OriginBadge origin={activity.origin} /></div><div className="mt-2 leading-6 text-[#667085]">{activity.description}</div></div><DetailField label="推荐生成方式" value={activity.modeLabel} /><DetailField label="推荐模板" value={activity.supportsTemplates ? `${activity.templateCount} 个；分别维护推荐商品和投放规则` : '系统智能生成，无需配置模板'} /><DetailField label="当前投放" value={activity.deliverySummary} /><DetailField label="状态" value={activity.enabled ? '已启用' : '已停用'} /><DetailField label="最近更新" value={activity.updatedAt} /><div className="rounded-md border border-[#D9E9FF] bg-[#F5F9FF] p-3 text-xs leading-5 text-[#41658A]">推荐配置只改变点单页的推荐展示与购买资格，不修改商品主档、渠道商品资料、价格或上下架状态。</div></div>
      <div className="flex justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3"><button type="button" onClick={onClose} className="console-secondary-button">关闭</button><button type="button" onClick={onEdit} className="console-secondary-button">编辑活动</button>{activity.supportsTemplates && <button type="button" onClick={onTemplates} className="console-primary-button">配置模板</button>}</div>
    </div>
  </div>
);

const ExcludedProductsModal = ({ onClose, onSave }: { onClose: () => void; onSave: () => void }) => {
  const [selected, setSelected] = useState(['P10053']);
  return (
    <ModalFrame width="w-[720px]" title="屏蔽活动商品" subtitle="被屏蔽商品仍参加原促销活动，只是不在“活动商品”推荐中展示。" onClose={onClose} footer={<div className="mr-auto text-xs text-[#667085]">已屏蔽 {selected.length} 个商品</div>} footerActions={<><button type="button" onClick={onClose} className="console-secondary-button">取消</button><button type="button" onClick={onSave} className="console-primary-button">保存屏蔽清单</button></>}>
      <div className="max-h-[480px] overflow-y-auto p-5 text-[13px]">{PRODUCT_OPTIONS.map(product => <label key={product.id} className="mb-2 flex cursor-pointer items-center justify-between rounded-md border border-[#E5E7EB] px-4 py-3 hover:bg-[#FAFCFB]"><div className="flex items-center gap-3"><input type="checkbox" checked={selected.includes(product.id)} onChange={() => setSelected(current => current.includes(product.id) ? current.filter(id => id !== product.id) : [...current, product.id])} className="accent-[#00B460]" /><div><div className="font-medium">{product.name}</div><div className="mt-0.5 text-xs text-[#98A2B3]">{product.id} · {product.category}</div></div></div><span className="text-[#667085]">{product.price}</span></label>)}</div>
    </ModalFrame>
  );
};

const ConfirmDialog = ({ kind, target, onCancel, onConfirm }: {
  kind: 'toggle-activity' | 'delete-activity' | 'toggle-template' | 'delete-template';
  target: RecommendationActivity | RecommendationTemplate;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const deleting = kind.startsWith('delete');
  const isActivity = kind.includes('activity');
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35">
      <div className="w-[500px] rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex gap-3">
          <AlertTriangle size={22} className={`mt-0.5 shrink-0 ${deleting ? 'text-[#D92D20]' : 'text-[#F79009]'}`} />
          <div><h3 className="font-semibold">{deleting ? `删除${isActivity ? '自定义推荐' : '推荐模板'}` : `${target.enabled ? '停用' : '启用'}${isActivity ? '推荐活动' : '推荐模板'}`}</h3><p className="mt-2 text-[13px] leading-6 text-[#667085]">对象：{target.name}。{deleting ? '删除后不可恢复，已产生的历史订单和审计记录保留。' : target.enabled ? '停用后，新打开的点单页将不再展示该推荐；已打开页面可能需要刷新。' : '启用后，将按当前商品和投放规则在新打开的点单页生效。'}</p>{isActivity && 'deliverySummary' in target && <p className="text-[13px] leading-6 text-[#667085]">当前范围：{target.deliverySummary}。</p>}</div>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="console-secondary-button">取消</button><button type="button" onClick={onConfirm} className={`h-9 rounded-md px-4 text-[13px] font-medium text-white ${deleting ? 'bg-[#D92D20]' : 'bg-[#00B460]'}`}>确认{deleting ? '删除' : target.enabled ? '停用' : '启用'}</button></div>
      </div>
    </div>
  );
};

const ModalFrame = ({ width, title, subtitle, onClose, children, footer, footerActions }: {
  width: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerActions?: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-6">
    <div className={`${width} flex max-h-[calc(100vh-48px)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl`}>
      <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-5 py-2"><div><h3 className="text-base font-semibold">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-[#667085]">{subtitle}</p>}</div><button type="button" onClick={onClose} aria-label="关闭" className="rounded p-1 text-[#667085] hover:bg-[#F2F4F7]"><X size={20} /></button></div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      <div className="flex min-h-14 shrink-0 items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">{footer}{footerActions}</div>
    </div>
  </div>
);

const SearchInput = ({ value, onChange, placeholder, width = 'w-[300px]' }: { value: string; onChange: (value: string) => void; placeholder: string; width?: string }) => (
  <label className={`relative block ${width}`}><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="h-9 w-full rounded-md border border-[#DDE2E8] pl-9 pr-3 text-[13px] outline-none focus:border-[#00B460]" /></label>
);

const CompactSelect = ({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<[string, string]> }) => (
  <label className="relative"><select value={value} onChange={event => onChange(event.target.value)} className="h-9 w-36 appearance-none rounded-md border border-[#DDE2E8] bg-white px-3 pr-8 text-[13px] outline-none focus:border-[#00B460]">{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" /></label>
);

const StatusSwitch = ({ enabled, onClick, label }: { enabled: boolean; onClick: () => void; label: string }) => (
  <button type="button" role="switch" aria-checked={enabled} aria-label={label} title={enabled ? '已启用，点击停用' : '已停用，点击启用'} onClick={onClick} className="inline-flex items-center gap-2"><span className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${enabled ? 'bg-[#00B460]' : 'bg-[#C8CDD4]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></span><span className={enabled ? 'text-[#008F4C]' : 'text-[#667085]'}>{enabled ? '已启用' : '已停用'}</span></button>
);

const OriginBadge = ({ origin }: { origin: ActivityOrigin }) => origin === 'system'
  ? <span className="inline-flex items-center gap-1 rounded bg-[#F2F4F7] px-2 py-1 text-xs text-[#4E5969]"><LockKeyhole size={12} />系统固定</span>
  : <span className="inline-flex items-center gap-1 rounded bg-[#EEF8F3] px-2 py-1 text-xs text-[#008F4C]"><Sparkles size={12} />商家自定义</span>;

const ModeBadge = ({ mode, label }: { mode: ActivityMode; label: string }) => {
  const icon = mode === 'manual' ? <FileSliders size={12} /> : mode === 'promotion' ? <ShieldCheck size={12} /> : <Sparkles size={12} />;
  return <span className="inline-flex items-center gap-1 rounded border border-[#E5E7EB] px-2 py-1 text-xs text-[#4E5969]">{icon}{label}</span>;
};

const RuleSummary = ({ rule }: { rule: DeliveryRule }) => {
  const paidMemberCardName = rule.paidMemberCardId === 'all'
    ? '全部付费会员卡用户'
    : `${PAID_MEMBER_CARDS.find(card => card.id === rule.paidMemberCardId)?.name || '指定付费会员卡'}用户`;
  const audienceSummary = rule.audience === 'all'
    ? '全部用户可购买'
    : rule.audience === 'member_tag'
      ? '会员标签用户可购买'
      : rule.nonMemberVisibility === 'visible_locked'
        ? `${paidMemberCardName}可购买；非目标用户可见不可购买`
        : `仅${paidMemberCardName}可见并购买`;
  return <div className="space-y-1"><div>{rule.channels.join('、')} · {rule.saleTypes.join('、')}</div><div className="text-xs text-[#98A2B3]">{audienceSummary} · {rule.stores.length === STORE_OPTIONS.length ? '全部门店' : `${rule.stores.length} 家门店`}</div></div>;
};

const FormRow = ({ label, required, alignTop = false, children }: { label: string; required?: boolean; alignTop?: boolean; children: React.ReactNode }) => <div className="flex items-start"><div className={`w-[116px] shrink-0 text-right text-[#4E5969] ${alignTop ? 'pt-0' : 'pt-2'}`}>{required && <span className="mr-1 text-[#D92D20]">*</span>}{label}：</div><div className="min-w-0 flex-1 pl-4">{children}</div></div>;
const DetailField = ({ label, value }: { label: string; value: string }) => <div><div className="text-xs text-[#98A2B3]">{label}</div><div className="mt-2 rounded-md border border-[#E5E7EB] p-3 leading-6 text-[#4E5969]">{value}</div></div>;
const CheckOption = ({ checked, onChange, label, disabled, suffix }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean; suffix?: string }) => <label className={`inline-flex items-center gap-2 ${disabled ? 'cursor-not-allowed text-[#B8C0CC]' : 'cursor-pointer'}`}><input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="accent-[#00B460]" />{label}{suffix && <span className="text-xs text-[#98A2B3]">{suffix}</span>}</label>;
const RadioOption = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => <label className="inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap"><input type="radio" checked={checked} onChange={onChange} className="accent-[#00B460]" />{label}</label>;

const ChoiceCard = ({ selected, icon, title, description, onClick }: { selected: boolean; icon: React.ReactNode; title: string; description: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className={`relative flex min-h-[88px] gap-3 rounded-md border p-3 text-left ${selected ? 'border-[#00B460] bg-[#F3FCF7]' : 'border-[#DDE2E8] hover:border-[#9AD9BA]'}`}><span className={selected ? 'text-[#008F4C]' : 'text-[#667085]'}>{icon}</span><span><span className="block font-medium text-[#1D2129]">{title}</span><span className="mt-1 block text-xs leading-5 text-[#667085]">{description}</span></span>{selected && <span className="absolute right-2 top-2 rounded-full bg-[#00B460] p-0.5 text-white"><Check size={11} /></span>}</button>
);

const SectionTitle = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => <div className="flex items-start gap-2"><span className="mt-0.5 text-[#008F4C]">{icon}</span><div><div className="font-semibold">{title}</div><div className="mt-0.5 text-xs text-[#98A2B3]">{description}</div></div></div>;
const EmptyState = ({ title, description, action, onAction }: { title: string; description?: string; action: string; onAction: () => void }) => <div className="flex h-64 flex-col items-center justify-center text-[13px]"><PackageSearch size={32} className="mb-3 text-[#B8C0CC]" /><div className="font-medium text-[#4E5969]">{title}</div>{description && <div className="mt-1 text-[#98A2B3]">{description}</div>}<button type="button" onClick={onAction} className="mt-3 text-[#008F4C]">{action}</button></div>;
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => <div className="absolute left-1/2 top-4 z-[120] flex -translate-x-1/2 items-center gap-3 rounded-md bg-[#1D2129] px-4 py-2.5 text-[13px] text-white shadow-lg"><Check size={15} className="text-[#6EE7A8]" /><span>{message}</span><button type="button" onClick={onClose} aria-label="关闭提示"><X size={14} className="text-white/70" /></button></div>;
