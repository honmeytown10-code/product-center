import React, { useEffect, useMemo, useState } from 'react';
import { Blend, ChefHat, Lock, Plus, Search, X } from 'lucide-react';
import { WebStoreAddonList } from './WebStoreAddonList';
import { PosMethodView } from '../pos/PosMethodView';
import { BadgeOptionConfig, GroupedTagFieldId, GroupedTagGroup, TagStyleType } from './WebProductForm';

type StoreAttributeTab = 'addon' | 'method' | 'label' | 'badge';

type StoreAttributeSource = 'brand' | 'store';

type LabelEditorState =
  | {
      type: 'group';
      mode: 'create' | 'edit';
      groupId?: string;
      name: string;
    }
  | {
      type: 'label';
      mode: 'create' | 'edit';
      groupId: string;
      labelId?: string;
      name: string;
      styleType: TagStyleType;
      backgroundColor: string;
      textColor: string;
    };

type BadgeEditorState = {
  mode: 'create' | 'edit';
  badgeId?: string;
  name: string;
  badgeType: TagStyleType;
  backgroundColor: string;
  startDate: string;
  endDate: string;
};

export const WebStoreAttributeManager: React.FC<{
  initialTab?: StoreAttributeTab;
  groupedTagOptions: Record<GroupedTagFieldId, GroupedTagGroup[]>;
  badgeOptions: BadgeOptionConfig[];
  onGroupedTagOptionsChange: (value: Record<GroupedTagFieldId, GroupedTagGroup[]>) => void;
  onBadgeOptionsChange: (value: BadgeOptionConfig[]) => void;
}> = ({
  initialTab = 'addon',
  groupedTagOptions,
  badgeOptions,
  onGroupedTagOptionsChange,
  onBadgeOptionsChange,
}) => {
  const [activeTab, setActiveTab] = useState<StoreAttributeTab>(initialTab);
  const [keyword, setKeyword] = useState('');
  const [labelEditor, setLabelEditor] = useState<LabelEditorState | null>(null);
  const [badgeEditor, setBadgeEditor] = useState<BadgeEditorState | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs: Array<{ id: StoreAttributeTab; label: string; desc: string; icon: React.ReactNode }> = [
    { id: 'addon', label: '加料', desc: '管理门店加料价格、库存与投放状态', icon: <Blend size={16} /> },
    { id: 'method', label: '做法', desc: '管理门店做法启用状态与关联商品', icon: <ChefHat size={16} /> },
  ];

  const descTagGroups = groupedTagOptions.p_desc_tags || [];
  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredLabelGroups = useMemo(() => {
    if (!normalizedKeyword) return descTagGroups;
    return descTagGroups.filter(group =>
      [group.name, ...group.options.map(option => option.name)].join(' ').toLowerCase().includes(normalizedKeyword)
    );
  }, [descTagGroups, normalizedKeyword]);

  const filteredBadges = useMemo(() => {
    if (!normalizedKeyword) return badgeOptions;
    return badgeOptions.filter(item => item.name.toLowerCase().includes(normalizedKeyword));
  }, [badgeOptions, normalizedKeyword]);

  const getSourceMeta = (source: StoreAttributeSource) => (
    source === 'brand'
      ? { label: '总部下发', className: 'bg-[#F5F5F5] text-[#5B6475]' }
      : { label: '门店自建', className: 'bg-[#F3FCF7] text-[#00A35B]' }
  );

  const updateDescTagGroups = (updater: (prev: GroupedTagGroup[]) => GroupedTagGroup[]) => {
    onGroupedTagOptionsChange({
      ...groupedTagOptions,
      p_desc_tags: updater(descTagGroups),
    });
  };

  const handleDeleteLabelGroup = (group: GroupedTagGroup) => {
    if ((group.source || 'store') === 'brand') return;
    if (!window.confirm(`确认删除标签分组“${group.name}”吗？`)) return;
    updateDescTagGroups(prev => prev.filter(item => item.id !== group.id));
  };

  const handleDeleteLabel = (groupId: string, labelId: string, source: StoreAttributeSource) => {
    if (source === 'brand') return;
    if (!window.confirm('确认删除当前标签吗？')) return;
    updateDescTagGroups(prev => prev.map(group => (
      group.id === groupId
        ? { ...group, options: group.options.filter(option => option.id !== labelId) }
        : group
    )));
  };

  const handleSaveLabelEditor = () => {
    if (!labelEditor) return;
    const nextName = labelEditor.name.trim();
    if (!nextName) return;

    if (labelEditor.type === 'group') {
      if (labelEditor.mode === 'create') {
        updateDescTagGroups(prev => [
          {
            id: `store-label-group-${Date.now()}`,
            name: nextName,
            source: 'store',
            options: [],
          },
          ...prev,
        ]);
      } else if (labelEditor.groupId) {
        updateDescTagGroups(prev => prev.map(group => (
          group.id === labelEditor.groupId ? { ...group, name: nextName } : group
        )));
      }
      setLabelEditor(null);
      return;
    }

    updateDescTagGroups(prev => prev.map(group => {
      if (group.id !== labelEditor.groupId) return group;
      if (labelEditor.mode === 'edit' && labelEditor.labelId) {
        return {
          ...group,
          options: group.options.map(option => (
            option.id === labelEditor.labelId
              ? {
                  ...option,
                  name: nextName,
                  styleType: labelEditor.styleType,
                  backgroundColor: labelEditor.backgroundColor,
                  textColor: labelEditor.textColor,
                  source: 'store',
                }
              : option
          )),
        };
      }
      return {
        ...group,
        options: [
          ...group.options,
          {
            id: `store-label-${Date.now()}`,
            name: nextName,
            styleType: labelEditor.styleType,
            backgroundColor: labelEditor.backgroundColor,
            textColor: labelEditor.textColor,
            source: 'store',
          },
        ],
      };
    }));
    setLabelEditor(null);
  };

  const handleDeleteBadge = (badgeId: string, source: StoreAttributeSource) => {
    if (source === 'brand') return;
    if (!window.confirm('确认删除当前角标吗？')) return;
    onBadgeOptionsChange(badgeOptions.filter(item => item.id !== badgeId));
  };

  const handleSaveBadgeEditor = () => {
    if (!badgeEditor) return;
    const nextName = badgeEditor.name.trim();
    if (!nextName) return;
    const nextBadge: BadgeOptionConfig = {
      id: badgeEditor.badgeId || `store-badge-${Date.now()}`,
      name: nextName,
      badgeType: badgeEditor.badgeType,
      backgroundColor: badgeEditor.backgroundColor,
      startDate: badgeEditor.startDate,
      endDate: badgeEditor.endDate,
      source: 'store',
    };
    if (badgeEditor.mode === 'edit' && badgeEditor.badgeId) {
      onBadgeOptionsChange(badgeOptions.map(item => item.id === badgeEditor.badgeId ? nextBadge : item));
    } else {
      onBadgeOptionsChange([nextBadge, ...badgeOptions]);
    }
    setBadgeEditor(null);
  };

  const renderReadonlyHint = (source: StoreAttributeSource) => {
    if (source !== 'brand') return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F5] px-2 py-1 text-xs text-[#5B6475]">
        <Lock size={12} />
        总部数据只读
      </span>
    );
  };

  const renderLabelManager = () => (
      <div className="flex-1 overflow-auto p-3">
        <div className="pc-surface min-h-full bg-white">
        <div className="border-b border-[#E8E8E8] px-6 pt-5 pb-4">
          <div className="text-xs leading-6 text-[#666]">
            描述标签会展示在商品名称下方，可用于口味、食材、卖点说明。总部下发的标签组和标签门店仅可选择，不可编辑或删除。
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索标签分组/标签"
                className="h-[38px] w-[260px] rounded-lg border border-[#E8E8E8] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]"
              />
            </div>
            <button
              onClick={() => setLabelEditor({ type: 'group', mode: 'create', name: '' })}
              className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]"
            >
              <Plus size={14} className="mr-1.5" />
              新建标签分组
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
              <tr>
                <th className="border-b border-[#E8E8E8] px-4 py-4">标签分组</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">标签</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">标签样式</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">预览效果</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">来源</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {filteredLabelGroups.map(group => {
                const groupSource = (group.source || 'store') as StoreAttributeSource;
                const sourceMeta = getSourceMeta(groupSource);
                const canEditGroup = groupSource === 'store';
                return (
                  <React.Fragment key={group.id}>
                    <tr className="border-b border-[#F3F4F6] bg-[#FCFCFC]">
                      <td className="px-4 py-4 font-medium">{group.name}</td>
                      <td className="px-4 py-4 text-[#98A0B3]">{group.options.length ? `${group.options.length} 个标签` : '暂无标签'}</td>
                      <td className="px-4 py-4 text-[#98A0B3]">-</td>
                      <td className="px-4 py-4">{renderReadonlyHint(groupSource)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${sourceMeta.className}`}>
                          {sourceMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-4">
                          {canEditGroup ? (
                            <>
                              <button
                                onClick={() => setLabelEditor({ type: 'label', mode: 'create', groupId: group.id, name: '', styleType: 'text', backgroundColor: '#ECFDF3', textColor: '#047857' })}
                                className="text-[#00A35B] hover:underline"
                              >
                                新增标签
                              </button>
                              <button
                                onClick={() => setLabelEditor({ type: 'group', mode: 'edit', groupId: group.id, name: group.name })}
                                className="text-[#00A35B] hover:underline"
                              >
                                编辑
                              </button>
                              <button onClick={() => handleDeleteLabelGroup(group)} className="text-[#FF4D4F] hover:underline">删除</button>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-[#98A0B3]"><Lock size={12} />不可编辑</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {group.options.map(option => {
                      const optionSource = (option.source || group.source || 'store') as StoreAttributeSource;
                      const optionMeta = getSourceMeta(optionSource);
                      const canEditOption = optionSource === 'store';
                      return (
                        <tr key={option.id} className="border-b border-[#F7F7F7]">
                          <td className="px-4 py-4 text-[#98A0B3]">└─</td>
                          <td className="px-4 py-4">{option.name}</td>
                          <td className="px-4 py-4">{option.styleType === 'image' ? '图片' : '文字'}</td>
                          <td className="px-4 py-4">
                            <span
                              className="inline-flex rounded-sm px-3 py-1 text-xs font-bold"
                              style={{ backgroundColor: option.backgroundColor || '#ECFDF3', color: option.textColor || '#047857' }}
                            >
                              {option.name}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${optionMeta.className}`}>
                              {optionMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="inline-flex items-center gap-4">
                              {canEditOption ? (
                                <>
                                  <button
                                    onClick={() => setLabelEditor({
                                      type: 'label',
                                      mode: 'edit',
                                      groupId: group.id,
                                      labelId: option.id,
                                      name: option.name,
                                      styleType: option.styleType || 'text',
                                      backgroundColor: option.backgroundColor || '#ECFDF3',
                                      textColor: option.textColor || '#047857',
                                    })}
                                    className="text-[#00A35B] hover:underline"
                                  >
                                    编辑
                                  </button>
                                  <button onClick={() => handleDeleteLabel(group.id, option.id, optionSource)} className="text-[#FF4D4F] hover:underline">删除</button>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-[#98A0B3]"><Lock size={12} />不可编辑</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {filteredLabelGroups.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#98A0B3]">暂无符合条件的描述标签数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBadgeManager = () => (
      <div className="flex-1 overflow-auto p-3">
        <div className="pc-surface min-h-full bg-white">
        <div className="border-b border-[#E8E8E8] px-6 pt-5 pb-4">
          <div className="text-xs leading-6 text-[#666]">
            商品角标会展示在商品图片区域，创建商品时会默认带入角标有效期，并支持在表单内二次修改。
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索角标名称"
                className="h-[38px] w-[260px] rounded-lg border border-[#E8E8E8] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#00C06B]"
              />
            </div>
            <button
              onClick={() => setBadgeEditor({ mode: 'create', name: '', badgeType: 'text', backgroundColor: '#ECFDF3', startDate: '2026-06-08', endDate: '2026-07-08' })}
              className="inline-flex items-center rounded-lg bg-[#00C06B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]"
            >
              <Plus size={14} className="mr-1.5" />
              新增角标
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[#F7F8FA] text-xs font-bold text-[#333]">
              <tr>
                <th className="border-b border-[#E8E8E8] px-4 py-4">角标名称</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">角标类型</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">默认有效期</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">预览效果</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4">来源</th>
                <th className="border-b border-[#E8E8E8] px-4 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#333]">
              {filteredBadges.map(badge => {
                const badgeSource = (badge.source || 'store') as StoreAttributeSource;
                const sourceMeta = getSourceMeta(badgeSource);
                const canEdit = badgeSource === 'store';
                return (
                  <tr key={badge.id} className="border-b border-[#F3F4F6]">
                    <td className="px-4 py-4">{badge.name}</td>
                    <td className="px-4 py-4">{badge.badgeType === 'image' ? '图片' : '文字'}</td>
                    <td className="px-4 py-4 text-[#5B6475]">{badge.startDate} 至 {badge.endDate}</td>
                    <td className="px-4 py-4">
                      <span
                        className="inline-flex rounded-sm px-3 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: badge.backgroundColor }}
                      >
                        {badge.name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${sourceMeta.className}`}>
                        {sourceMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-4">
                        {canEdit ? (
                          <>
                            <button
                              onClick={() => setBadgeEditor({
                                mode: 'edit',
                                badgeId: badge.id,
                                name: badge.name,
                                badgeType: badge.badgeType,
                                backgroundColor: badge.backgroundColor,
                                startDate: badge.startDate,
                                endDate: badge.endDate,
                              })}
                              className="text-[#00A35B] hover:underline"
                            >
                              编辑
                            </button>
                            <button onClick={() => handleDeleteBadge(badge.id, badgeSource)} className="text-[#FF4D4F] hover:underline">删除</button>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#98A0B3]"><Lock size={12} />不可编辑</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBadges.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#98A0B3]">暂无符合条件的角标数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pc-page flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F5F6FA]">
      <div className="shrink-0 border-b border-[#E8E8E8] bg-white px-5 pt-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-[18px] font-semibold text-[#333]">门店商品属性</div>
            <div className="mt-1 text-[12px] text-[#999]">{tabs.find(tab => tab.id === activeTab)?.desc}</div>
          </div>
        </div>
        <div role="tablist" className="mt-3 flex h-10 gap-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-1 text-[13px] font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-[#00C06B] text-[#00C06B]'
                  : 'border-transparent text-[#666] hover:text-[#333]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'addon' && <WebStoreAddonList />}
        {activeTab === 'method' && <PosMethodView />}
        {activeTab === 'label' && renderLabelManager()}
        {activeTab === 'badge' && renderBadgeManager()}
      </div>

      {labelEditor && (
        <FormModal
          title={labelEditor.type === 'group'
            ? (labelEditor.mode === 'create' ? '新增标签分组' : '编辑标签分组')
            : (labelEditor.mode === 'create' ? '新增标签' : '编辑标签')}
          onClose={() => setLabelEditor(null)}
          onConfirm={handleSaveLabelEditor}
          confirmText={labelEditor.mode === 'create' ? '确定' : '保存'}
        >
          <div className="space-y-4">
            <ModalInput
              label={labelEditor.type === 'group' ? '标签分组名称' : '标签名称'}
              value={labelEditor.name}
              onChange={value => setLabelEditor(prev => prev ? { ...prev, name: value.slice(0, 10) } as LabelEditorState : prev)}
              placeholder={labelEditor.type === 'group' ? '请输入标签分组名称' : '请输入标签名称'}
            />
            {labelEditor.type === 'label' && (
              <>
                <RadioGroup
                  label="标签样式"
                  value={labelEditor.styleType}
                  options={[
                    { value: 'text', label: '文字' },
                    { value: 'image', label: '图片' },
                  ]}
                  onChange={value => setLabelEditor(prev => prev && prev.type === 'label' ? { ...prev, styleType: value as TagStyleType } : prev)}
                />
                <ColorInput
                  label="背景颜色"
                  value={labelEditor.backgroundColor}
                  onChange={value => setLabelEditor(prev => prev && prev.type === 'label' ? { ...prev, backgroundColor: value } : prev)}
                />
                <ColorInput
                  label="字体颜色"
                  value={labelEditor.textColor}
                  onChange={value => setLabelEditor(prev => prev && prev.type === 'label' ? { ...prev, textColor: value } : prev)}
                />
                <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
                  <div className="text-sm font-bold text-[#1F2129]">标签预览</div>
                  <div>
                    <span
                      className="inline-flex rounded-sm px-3 py-1 text-xs font-bold"
                      style={{ backgroundColor: labelEditor.backgroundColor, color: labelEditor.textColor }}
                    >
                      {labelEditor.name || '标签'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </FormModal>
      )}

      {badgeEditor && (
        <FormModal
          title={badgeEditor.mode === 'create' ? '新增角标' : '编辑角标'}
          onClose={() => setBadgeEditor(null)}
          onConfirm={handleSaveBadgeEditor}
          confirmText={badgeEditor.mode === 'create' ? '保存' : '保存'}
        >
          <div className="space-y-4">
            <ModalInput
              label="角标名称"
              value={badgeEditor.name}
              onChange={value => setBadgeEditor(prev => prev ? { ...prev, name: value.slice(0, 10) } : prev)}
              placeholder="请输入角标名称"
            />
            <RadioGroup
              label="角标类型"
              value={badgeEditor.badgeType}
              options={[
                { value: 'text', label: '文字' },
                { value: 'image', label: '图片' },
              ]}
              onChange={value => setBadgeEditor(prev => prev ? { ...prev, badgeType: value as TagStyleType } : prev)}
            />
            <ColorInput
              label="背景颜色"
              value={badgeEditor.backgroundColor}
              onChange={value => setBadgeEditor(prev => prev ? { ...prev, backgroundColor: value } : prev)}
            />
            <DateRangeInput
              startDate={badgeEditor.startDate}
              endDate={badgeEditor.endDate}
              onStartDateChange={value => setBadgeEditor(prev => prev ? { ...prev, startDate: value } : prev)}
              onEndDateChange={value => setBadgeEditor(prev => prev ? { ...prev, endDate: value } : prev)}
            />
            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
              <div className="text-sm font-bold text-[#1F2129]">预览</div>
              <div>
                <span
                  className="inline-flex rounded-sm px-3 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: badgeEditor.backgroundColor }}
                >
                  {badgeEditor.name || '角标'}
                </span>
              </div>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
};

const FormModal = ({
  title,
  children,
  onClose,
  onConfirm,
  confirmText,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-6">
    <div className="w-full max-w-[680px] rounded-[16px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between border-b border-[#EEF1F5] px-6 py-5">
        <div className="text-[18px] font-black text-[#1F2129]">{title}</div>
        <button onClick={onClose} className="text-[#9AA3B2] hover:text-[#5B6475]">
          <X size={20} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
      <div className="flex justify-end gap-3 border-t border-[#EEF1F5] px-6 py-4">
        <button onClick={onClose} className="rounded-[10px] border border-[#E8E8E8] px-6 py-2.5 text-sm text-[#666] hover:bg-[#FAFAFA]">取消</button>
        <button onClick={onConfirm} className="rounded-[10px] bg-[#00C06B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00A35B]">{confirmText}</button>
      </div>
    </div>
  </div>
);

const ModalInput = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
    <div className="text-sm font-bold text-[#1F2129]">{label}</div>
    <div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[40px] w-full rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]"
      />
      <div className="mt-2 text-right text-xs text-[#98A0B3]">{value.length}/10</div>
    </div>
  </div>
);

const RadioGroup = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) => (
  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
    <div className="text-sm font-bold text-[#1F2129]">{label}</div>
    <div className="flex items-center gap-6">
      {options.map(option => (
        <label key={option.value} className="inline-flex items-center gap-2 text-sm text-[#333]">
          <input type="radio" checked={value === option.value} onChange={() => onChange(option.value)} />
          {option.label}
        </label>
      ))}
    </div>
  </div>
);

const ColorInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
    <div className="text-sm font-bold text-[#1F2129]">{label}</div>
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 w-12 rounded border border-[#E8E8E8] bg-white p-1"
      />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-[40px] w-[160px] rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]"
      />
    </div>
  </div>
);

const DateRangeInput = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) => (
  <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
    <div className="text-sm font-bold text-[#1F2129]">有效期</div>
    <div className="grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)] gap-3">
      <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} className="h-[40px] rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]" />
      <div className="flex items-center justify-center text-sm text-[#98A0B3]">至</div>
      <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} className="h-[40px] rounded-lg border border-[#E8E8E8] px-3 text-sm outline-none focus:border-[#00C06B]" />
    </div>
  </div>
);
