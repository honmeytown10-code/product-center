import React from 'react';
import { CupSoda, ShoppingBag, Utensils, Flame, CakeSlice } from 'lucide-react';

export type StoreDataSource = 'brand' | 'store';
export type VisualStyleType = 'text' | 'image';

export interface MobileCategoryNode {
  id: string;
  name: string;
  desc?: string;
  icon?: React.ReactNode;
  source?: StoreDataSource;
  children?: MobileCategoryNode[];
}

export interface MobileLabelItem {
  id: string;
  name: string;
  styleType: VisualStyleType;
  backgroundColor: string;
  textColor: string;
  imageName?: string;
  source: StoreDataSource;
}

export interface MobileLabelGroup {
  id: string;
  name: string;
  source: StoreDataSource;
  items: MobileLabelItem[];
}

export interface MobileBadgeItem {
  id: string;
  name: string;
  badgeType: VisualStyleType;
  backgroundColor: string;
  imageName?: string;
  startDate: string;
  endDate: string;
  source: StoreDataSource;
}

export const STORE_CREATION_CATEGORIES: Record<'standard' | 'combo', MobileCategoryNode[]> = {
  standard: [
    {
      id: 'std_food',
      name: '通用菜品',
      icon: React.createElement(Utensils, {}),
      desc: '热菜、凉菜、小吃',
      source: 'brand',
      children: [
        { id: 'std_food_hot', name: '热菜', source: 'brand' },
        { id: 'std_food_snack', name: '小吃', source: 'brand' },
      ],
    },
    {
      id: 'std_drink',
      name: '现制饮品',
      icon: React.createElement(CupSoda, {}),
      desc: '奶茶、咖啡、果汁',
      source: 'brand',
      children: [
        { id: 'std_drink_tea', name: '茶饮', source: 'brand' },
        { id: 'std_drink_coffee', name: '咖啡', source: 'brand' },
        { id: 'std_drink_fruit', name: '果饮', source: 'store' },
      ],
    },
    {
      id: 'std_bake',
      name: '蛋糕/烘焙',
      icon: React.createElement(CakeSlice, {}),
      desc: '面包、甜点、整糕',
      source: 'brand',
      children: [
        { id: 'std_bake_cake', name: '蛋糕', source: 'brand' },
        { id: 'std_bake_bread', name: '面包', source: 'brand' },
      ],
    },
    {
      id: 'std_retail',
      name: '零售商品',
      icon: React.createElement(ShoppingBag, {}),
      desc: '预包装零食、饮料',
      source: 'brand',
    },
  ],
  combo: [
    {
      id: 'combo_common',
      name: '通用套餐',
      icon: React.createElement(Utensils, {}),
      desc: '超值午餐、多人餐',
      source: 'brand',
      children: [
        { id: 'combo_common_single', name: '单人餐', source: 'brand' },
        { id: 'combo_common_multi', name: '多人餐', source: 'brand' },
      ],
    },
    {
      id: 'combo_drink',
      name: '饮品套餐',
      icon: React.createElement(CupSoda, {}),
      desc: '双杯优惠、下午茶',
      source: 'brand',
      children: [
        { id: 'combo_drink_double', name: '双杯套餐', source: 'brand' },
        { id: 'combo_drink_snack', name: '茶点套餐', source: 'store' },
      ],
    },
    {
      id: 'combo_hotpot',
      name: '火锅锅底',
      icon: React.createElement(Flame, {}),
      desc: '鸳鸯锅、九宫格',
      source: 'brand',
    },
  ],
};

export const DEFAULT_STORE_LABEL_GROUPS: MobileLabelGroup[] = [
  {
    id: 'label_group_brand_1',
    name: '口味卖点',
    source: 'brand',
    items: [
      {
        id: 'label_brand_1',
        name: '店长推荐',
        styleType: 'text',
        backgroundColor: '#FFF1D6',
        textColor: '#B76A00',
        source: 'brand',
      },
      {
        id: 'label_brand_2',
        name: '低糖低脂',
        styleType: 'text',
        backgroundColor: '#E7F7EE',
        textColor: '#0E9F6E',
        source: 'brand',
      },
    ],
  },
  {
    id: 'label_group_store_1',
    name: '门店特色',
    source: 'store',
    items: [
      {
        id: 'label_store_1',
        name: '现萃茶底',
        styleType: 'text',
        backgroundColor: '#EAF2FF',
        textColor: '#2F6FED',
        source: 'store',
      },
      {
        id: 'label_store_2',
        name: '限店供应',
        styleType: 'text',
        backgroundColor: '#F6EBFF',
        textColor: '#8B3DFF',
        source: 'store',
      },
    ],
  },
];

export const DEFAULT_STORE_BADGES: MobileBadgeItem[] = [
  {
    id: 'badge_brand_1',
    name: '新品',
    badgeType: 'text',
    backgroundColor: '#00C06B',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    source: 'brand',
  },
  {
    id: 'badge_brand_2',
    name: '招牌',
    badgeType: 'text',
    backgroundColor: '#FF8A00',
    startDate: '2026-06-01',
    endDate: '2026-12-31',
    source: 'brand',
  },
  {
    id: 'badge_store_1',
    name: '限时',
    badgeType: 'text',
    backgroundColor: '#7A5AF8',
    startDate: '2026-06-08',
    endDate: '2026-06-20',
    source: 'store',
  },
];

export const cloneCategoryTree = (categories: MobileCategoryNode[]) =>
  categories.map(category => ({
    ...category,
    children: category.children ? cloneCategoryTree(category.children) : undefined,
  }));

export const cloneLabelGroups = (groups: MobileLabelGroup[]) =>
  groups.map(group => ({
    ...group,
    items: group.items.map(item => ({ ...item })),
  }));

export const cloneBadges = (badges: MobileBadgeItem[]) =>
  badges.map(item => ({ ...item }));
