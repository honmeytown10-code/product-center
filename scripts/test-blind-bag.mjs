import { createRequire } from 'node:module';
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const esbuild = createRequire(import.meta.url)('esbuild');
const out = path.resolve('design-handoff/audit/blind-bag-20261013');
mkdirSync(out, { recursive: true });
const bundle = path.join(out, 'rules.bundle.local.mjs');
await esbuild.build({ stdin: { contents: 'export * from "./blindBag"; export * from "./categoryConfiguration"; export { mergePublishedFormData, publishedStockCount } from "./components/web/WebProductPublishRules";', resolveDir: process.cwd(), loader: 'ts' }, outfile: bundle, bundle: true, platform: 'node', format: 'esm', packages: 'external' });
const rules = await import(pathToFileURL(bundle));
const results = [];
const test = (name, fn) => { fn(); results.push(name); console.log(`PASS ${name}`); };
const source = () => rules.buildBlindBagProduct({ id: 'bb-test', skuCode: 'sku-bb-test', createdTime: '2026-10-13 09:00:00', status: 'on_shelf', channelIds: [...rules.BLIND_BAG_CHANNEL_IDS], unlimited: false, formData: { p_name: '烘焙盲袋', p_front_cat: ['热销推荐'], p_unit: '袋', p_cat: '蛋糕/烘焙', s_price: '0', s_stock: '0', m_methods: ['旧做法'], channelSpecificValues: { meituan: {} } } });
test('A blind bag retains standard product identity, one SKU and real zero values', () => {
  const product = source(); assert.equal(product.type, 'standard'); assert.equal(product.businessType, 'blind_bag'); assert.equal(product.specs.length, 1); assert.equal(product.price, 0); assert.equal(product.stock, 0); assert.equal(product.stockStatus, 'sold_out'); assert.equal(product.formData.takeoutSnapshot.skus[0].id, 'sku-bb-test');
});
test('Hidden legacy method/addon/platform/display properties cannot survive dedicated save', () => {
  const product = source(); assert.deepEqual(product.formData.m_methods, []); assert.deepEqual(product.formData.a_addons, []); assert.equal(product.formData.channelSpecificValues, undefined); assert.deepEqual(product.formData.p_display_type, []);
});
test('Reject every incompatible structure at the common save boundary', () => {
  for (const mutate of [p => { p.type = 'combo'; }, p => { p.isMultiSpec = true; }, p => { p.specs.push({ name: '大袋', stock: 1 }); }, p => { p.formData.takeoutFormState.specDisplayMode = 'multi'; }, p => { p.formData.takeoutFormState.methodConfigRows.push({ id: 'method' }); }, p => { p.formData.takeoutSnapshot.addonItems.push({ id: 'addon' }); }, p => { p.formData.takeoutSnapshot.comboGroupCount = 1; }, p => { p.formData.p_weight_flag = true; }, p => { p.formData.p_display_type.push('group_meal'); }, p => { p.formData.channelSpecificValues = { meituan: {} }; }]) { const product = source(); mutate(product); assert(rules.blindBagStructureError(product)); }
});
test('Reject POS/platform channels, no channels and inconsistent channel projections', () => {
  for (const channel of ['pos', 'meituan', 'taobao', 'jd', 'douyin']) { const product = source(); product.formData.applicableChannelIds.push(channel); assert(rules.blindBagStructureError(product)); }
  const empty = source(); empty.formData.salesScope.channelIds = []; assert(rules.blindBagStructureError(empty));
  const mismatch = source(); mismatch.formData.applicableChannelIds = ['mini_program_delivery']; assert(rules.blindBagStructureError(mismatch));
});
test('Normal standard/combo products keep their original rules', () => {
  assert.equal(rules.blindBagStructureError({ type: 'combo', isMultiSpec: true, formData: { m_methods: ['甜度'], salesScope: { channelIds: ['pos'] } } }), undefined);
});
test('Limited overwrite keeps store stock and price while carrying blind-bag identity', () => {
  const product = source();
  const previous = { ...product.formData, p_name: '旧名称', s_price: '18', s_stock: '7', takeoutFormState: { ...product.formData.takeoutFormState, specConfigRows: [{ ...product.formData.takeoutFormState.specConfigRows[0], s_spec_price: '18', s_spec_initial_stock: '7' }] } };
  const merged = rules.mergePublishedFormData(previous, { ...product.formData, p_name: '新名称' }, ['商品名称']);
  assert.equal(merged.p_name, '新名称'); assert.equal(merged.p_business_type, 'blind_bag'); assert.equal(merged.s_price, '18'); assert.equal(merged.s_stock, '7'); assert.equal(merged.takeoutFormState.specConfigRows[0].s_spec_price, '18'); assert.equal(rules.publishedStockCount(merged, 9999), 7); assert.deepEqual(merged.takeoutFormState.methodConfigRows, []);
});
test('Demo products use the dedicated blind-bag category and deterministic SKU IDs', () => { const products = rules.createBlindBagDemoProducts(''); assert.equal(products.length, 3); for (const product of products) { assert.equal(rules.blindBagStructureError(product), undefined); assert.equal(product.formData.p_cat, '盲袋商品'); assert.equal(product.formData.prototypeCategoryId, rules.BLIND_BAG_CATEGORY_ID); } });
test('Shared library form preserves compatible display, sales and advanced settings', () => {
  const product = source();
  const settings = { p_cover_img: 'cover', p_img_gallery: ['main', 'main-2'], p_list_desc: '列表简述', p_desc_tags: ['店长推荐'], p_order_tags: ['热销'], p_badge: '新品', p_badge_start_date: '2026-10-13', p_badge_end_date: '2026-10-31', p_video: 'video', p_rich_desc: '详情', p_detail_images: ['detail'], p_detail_bottom_img: 'bottom', s_time_sale_toggle: true, s_time_sale_rule: { startDate: '2026-10-13', endDate: '2026-10-31' }, st_member: true, o_base_sales: '10', o_share_title: '分享标题', o_share_image: 'share', customAttributes: { 'custom-2': ['乳制品'] }, s_sale_settings: { '参与会员折扣': true, '关联档口': true } };
  product.formData = { ...product.formData, ...settings };
  const row = product.formData.takeoutFormState.specConfigRows[0]; row.s_spec_store_pack_fee = '1'; row.s_spec_take_pack_fee = '2';
  const normalized = rules.normalizeBlindBagDraft(product, 'save', product);
  for (const [key, value] of Object.entries(settings).filter(([key]) => key !== 's_sale_settings')) assert.deepEqual(normalized.formData[key], value, key);
  assert.deepEqual(normalized.formData.s_sale_settings, { '参与会员折扣': true });
  assert.equal(normalized.formData.takeoutFormState.specConfigRows[0].s_spec_take_pack_fee, '2');
  assert.equal(normalized.formData.takeoutSnapshot.skus[0].packagingFee, '2');
  assert.equal(normalized.skuCode, product.skuCode);
});
test('Restored display and packaging fields obey selective overwrite without resetting store inventory', () => {
  const product = source();
  const previous = { ...product.formData, p_cover_img: 'store-cover', p_list_desc: 'store-description', p_rich_desc: 'store-rich', o_share_title: 'store-share', s_stock: '7', takeoutFormState: { ...product.formData.takeoutFormState, specConfigRows: [{ ...product.formData.takeoutFormState.specConfigRows[0], s_spec_initial_stock: '7', s_spec_take_pack_fee: '1' }] } };
  const incoming = { ...product.formData, p_cover_img: 'master-cover', p_list_desc: 'master-description', p_rich_desc: 'master-rich', o_share_title: 'master-share', takeoutFormState: { ...product.formData.takeoutFormState, specConfigRows: [{ ...product.formData.takeoutFormState.specConfigRows[0], s_spec_take_pack_fee: '2' }] } };
  const merged = rules.mergePublishedFormData(previous, incoming, ['商品封面图', '详情页描述', '商品分享', '包装费']);
  assert.equal(merged.p_cover_img, 'master-cover'); assert.equal(merged.p_list_desc, 'store-description'); assert.equal(merged.p_rich_desc, 'master-rich'); assert.equal(merged.o_share_title, 'master-share');
  assert.equal(merged.takeoutFormState.specConfigRows[0].s_spec_take_pack_fee, '2'); assert.equal(merged.takeoutSnapshot.skus[0].packagingFee, '2'); assert.equal(rules.publishedStockCount(merged, 9999), 7);
});
test('Ops category field additions and removals drive persisted form values', () => {
  const product = source(); product.formData.p_code = 'BBSEARCH'; product.formData.p_cover_img = 'cover';
  const fields = rules.DEFAULT_BLIND_BAG_CATEGORY_FIELDS.filter(field => field.id !== 'p_cover_img').concat([{ id: 'p_code', isRequired: false }]);
  const normalized = rules.normalizeBlindBagDraft(product, 'save', product, fields);
  assert.equal(normalized.formData.p_code, 'BBSEARCH'); assert.equal(normalized.formData.p_cover_img, undefined);
  assert.deepEqual(normalized.formData.m_methods, []);
});
test('Scene visibility is independent of category names and ordinary defaults remain unchanged', () => {
  const baseline = [{ id: 'w_cat_s1', name: '通用菜品', classification: 'standard', standardFields: [{ id: 'p_name', isRequired: true }, { id: 'p_remark', isRequired: false }], comboFields: [], productCount: 0 }];
  const resolved = rules.resolveWebCategoryConfigs(baseline, rules.INITIAL_OPS_CATEGORY_CONFIGS, 'b_1');
  assert.deepEqual(resolved.find(category => category.id === 'w_cat_s1').standardFields, baseline[0].standardFields);
  const special = resolved.find(category => category.creationScene === 'blind_bag');
  assert.equal(rules.isOrdinaryCreationCategory({ ...special, name: '尾货优惠袋' }), false);
  assert.equal(rules.isOrdinaryCreationCategory(baseline[0]), true);
  const restricted = rules.INITIAL_OPS_CATEGORY_CONFIGS.map(config => config.creationScene ? { ...config, applicableBrands: ['b_3'] } : config);
  assert(!rules.resolveWebCategoryConfigs(baseline, restricted, 'b_1').some(category => category.creationScene === 'blind_bag'));
});
test('Scene uniqueness covers activation and overlapping brand ranges', () => {
  const original = rules.INITIAL_OPS_CATEGORY_CONFIGS.find(category => category.creationScene);
  assert(rules.hasCategorySceneConflict({ ...original, id: 'other-scene-category' }, [original]));
  assert.equal(rules.hasCategorySceneConflict({ ...original, id: 'other-scene-category', status: 'disabled' }, [original]), false);
  assert.equal(rules.hasCategorySceneConflict({ ...original, id: 'other-scene-category', applicableBrands: ['b_2'] }, [{ ...original, applicableBrands: ['b_1'] }]), false);
});
test('Blind-bag publication is dine-in only and a dedicated entry rejects ordinary products', () => {
  const product = source();
  assert.equal(rules.blindBagPublishError([product], ['mini_program_dine_in'], true), undefined);
  assert(rules.blindBagPublishError([product], ['mini_program_delivery'], true));
  assert(rules.blindBagPublishError([product], ['mini_program_dine_in', 'mini_program_delivery']));
  assert(rules.blindBagPublishError([{ type: 'standard' }], ['mini_program_dine_in'], true));
  assert.equal(rules.blindBagPublishError([{ type: 'standard' }], ['pos']), undefined);
  assert.equal(rules.blindBagStructureError(product), undefined);
});
writeFileSync(path.join(out, 'rules-results.json'), JSON.stringify({ passed: results.length, checks: results }, null, 2));
unlinkSync(bundle);
