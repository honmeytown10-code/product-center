import React from 'react';

const JD_CATEGORY_OPTIONS = [
  { value: 'jd-category-milk-tea', label: '餐饮 / 饮品 / 奶茶' },
  { value: 'jd-category-fruit-tea', label: '餐饮 / 饮品 / 果茶' },
  { value: 'jd-category-coffee', label: '餐饮 / 饮品 / 咖啡' },
  { value: 'jd-category-bakery', label: '餐饮 / 小吃甜品 / 烘焙甜品' },
];

const JD_BRAND_OPTIONS = [
  { value: 'jd-brand-huai-dian-wang-po', label: '槐店王婆' },
  { value: 'jd-brand-qimai-tea', label: '企迈茶饮' },
  { value: 'jd-brand-generic-food', label: '其他餐饮品牌' },
];

export const WebJdCategoryBrandFields = ({ values, onChange }: {
  values: Record<string, string | boolean | string[]>;
  onChange: (patch: Record<string, string | boolean | string[]>) => void;
}) => (
  <section aria-label="京东秒送类目与品牌" className="grid gap-x-6 gap-y-5 md:grid-cols-2">
    <div>
      <label htmlFor="jd-category" className="mb-2 block text-sm font-semibold text-[#4E5969]">
        <span className="text-[#B42318]">* </span>商品类目
      </label>
      <select
        id="jd-category"
        value={String(values.category || '')}
        onChange={(event) => {
          const option = JD_CATEGORY_OPTIONS.find(item => item.value === event.target.value);
          onChange({
            category: event.target.value,
            categoryName: option?.label || '',
            categoryVerified: Boolean(option),
          });
        }}
        className="h-10 w-full rounded border border-[#DDE2E8] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#00B460] focus:ring-1 focus:ring-[#00B460]"
      >
        <option value="">请选择京东秒送末级类目</option>
        {JD_CATEGORY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <p className="mt-1.5 text-xs leading-5 text-[#86909C]">用于商品在京东秒送内展示和归类。</p>
    </div>

    <div>
      <label htmlFor="jd-brand" className="mb-2 block text-sm font-semibold text-[#4E5969]">
        <span className="text-[#B42318]">* </span>商品品牌
      </label>
      <select
        id="jd-brand"
        value={String(values.brandId || '')}
        onChange={(event) => {
          const option = JD_BRAND_OPTIONS.find(item => item.value === event.target.value);
          onChange({
            brandId: event.target.value,
            brandName: option?.label || '',
            brandVerified: Boolean(option),
          });
        }}
        className="h-10 w-full rounded border border-[#DDE2E8] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#00B460] focus:ring-1 focus:ring-[#00B460]"
      >
        <option value="">请选择京东秒送商品品牌</option>
        {JD_BRAND_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <p className="mt-1.5 text-xs leading-5 text-[#86909C]">请选择已在京东秒送维护的品牌。</p>
    </div>
  </section>
);
