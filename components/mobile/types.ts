
import React from 'react';

export type ChannelType = 'all' | 'mini' | 'meituan' | 'taobao' | 'pos';

export interface LocalCategory {
  id: string;
  name: string;
  source: 'brand' | 'store';
  channels: ChannelType[];
  description?: string;
  icon?: string;
  banner?: string;
  code?: string;
  count: number;
}

export interface LocalMethodValue {
  id: string;
  name: string;
  linkedProductIds: string[];
  status?: 'active' | 'inactive';
}

export interface LocalMethod {
  id: string;
  name: string;
  source: 'brand' | 'store';
  values: LocalMethodValue[];
}

export interface LocalSpec {
  id: string;
  name: string;
  source: 'brand' | 'store';
  values: string[];
}

export interface LocalComboItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  isDefault: boolean;
  markupPrice: string;
  hasPackFee: boolean;
}

export interface LocalComboGroup {
  id: string;
  name: string;
  source: 'brand' | 'store';
  isRelativePrice: boolean;
  code?: string;
  remark?: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  items: LocalComboItem[];
}
