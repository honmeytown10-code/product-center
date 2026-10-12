import React from 'react';
import { useProducts } from '../context';
import { getOmnichannelConfig } from '../omnichannel';
import { WebAdmin } from './WebAdmin';

type Item = { id: string; label: string; matches?: string[] };
type Group = { title: string; items: Item[] };

// One Web, using the existing business modules and the saved brand strategy.
export const WebProductCenter: React.FC = () => {
  const { brandConfigs, activeBrandId } = useProducts();
  const config = getOmnichannelConfig(brandConfigs[activeBrandId] || brandConfigs.b_1);
  const unified = config.collaborationMode === 'unified';
  const params = new URLSearchParams(window.location.search);
  const oldPages: Record<string, string> = {
    settings: 'omnichannel_settings', products: 'product_list', foundation: 'product_attributes', recipe: 'recipe_new',
    'store-products': 'store_product_list', 'store-foundation': 'store_addon_list',
    'channel-products': 'channel_product_library', 'platform-products': 'platform_douyin',
    'sales-rules': 'sales_scope', publish: 'product_sync', mapping: 'product_mapping',
  };
  const oldMenu = params.get('menu') || oldPages[params.get('page') || ''] || 'product_list';
  const initialMenu = oldMenu === 'v2_management' ? 'omnichannel_settings' : ['takeout_menu_sync', 'product_publish', 'product_batch'].includes(oldMenu) ? 'product_sync' : oldMenu;
  const groups: Group[] = [
    { title: '商品资料', items: [
      { id: 'product_list', label: unified ? '商品库' : '商品主档', matches: unified ? ['platform_douyin', 'platform_douyin_addons', 'platform_meituan'] : [] },
      { id: 'product_attributes', label: '分类与属性', matches: ['categories', 'category_management'] },
      { id: 'group_meal_products', label: '团餐商品' },
      { id: 'recipe_new', label: '配方与营养', matches: ['ingredient_library', 'recipe_default', 'recipe_legacy', 'nutrition_manager', 'addon_group'] },
    ] },
    { title: '商品运营', items: [
      ...(!unified ? [
        { id: 'channel_product_library', label: '渠道商品', matches: ['platform_douyin', 'platform_douyin_addons', 'platform_meituan'] },
        { id: 'channel_attributes', label: '渠道属性', matches: ['channel_categories', 'channel_custom_attributes'] },
      ] : []),
      { id: 'product_sync', label: '商品批量管理', matches: ['product_publish', 'product_batch', 'product_records', 'product_template'] },
      { id: 'sales_scope', label: '销售规则', matches: ['price_systems', 'attribute_mutex_rules', 'required_product_policy'] },
      { id: 'buffet_menu', label: '自助餐菜单' },
      { id: 'product_recommendation', label: '商品推荐' },
      { id: 'product_mapping', label: '外卖商品映射' },
    ] },
    { title: '门店经营', items: [
      { id: 'store_product_list', label: '门店商品', matches: ['store_product_coverage', 'store_region_list'] },
      { id: 'store_category_list', label: '门店分类与属性', matches: ['store_attribute_list', 'store_addon_list', 'store_method_list'] },
    ] },
  ];
  return <WebAdmin experience={{ unified, initialMenu,
    renderSidebar: (activeMenu, navigate) => {
      const visibleGroups = [...groups, { title: '商品设置', items: [
        { id: 'general_settings', label: '商品设置', matches: ['channel_override_settings', 'omnichannel_settings', 'common_field_settings'] },
      ] }];
      return <aside className="console-sidebar z-30 flex w-[216px] shrink-0 flex-col overflow-y-auto border-r border-[#E8E8E8] bg-white py-2 no-scrollbar" aria-label="商品中心菜单" tabIndex={0}>
        <div className="flex items-center gap-2 px-5 py-4 text-[14px] font-semibold">商品中心</div>
        {visibleGroups.map(group => <div key={group.title} className="pb-2">
          <div className="px-5 pb-1 pt-2 text-[12px] text-[#667085]">{group.title}</div>
          {group.items.map(item => {
            const active = activeMenu === item.id || item.matches?.includes(activeMenu);
            return <button key={item.id} aria-current={active ? 'page' : undefined} onClick={() => navigate(item.id === 'store_category_list' ? 'store_addon_list' : item.id)} className={`flex min-h-10 w-full items-center gap-3 px-5 py-2 text-left text-[14px] leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00B460] ${active ? 'bg-[#EAF8F2] font-semibold text-[#008F4C]' : 'text-[#4E5969] hover:bg-[#F7F8FA]'}`}><span className="min-w-0">{item.label}</span></button>;
          })}
        </div>)}
      </aside>;
    },
  }} />;
};
