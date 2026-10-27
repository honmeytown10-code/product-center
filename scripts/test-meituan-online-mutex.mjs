import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../meituanOnlineMutex.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { validateOnlineMutex: validate, onlineMutexBlocker: blocker, serializeOnlineMutex: serialize, readOnlineMutexPairs: read, readOnlineMutexRules: readRules, expandOnlineMutexRules: expand, planOnlineMutex: plan } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const options = [
  { id: 'small', source: 'spec', groupId: 'size', groupName: '杯型', name: '中杯' },
  { id: 'large', source: 'spec', groupId: 'size', groupName: '杯型', name: '大杯' },
  { id: 'original', source: 'spec', groupId: 'flavor', groupName: '风味', name: '原味' },
  { id: 'hot', source: 'method', groupId: 'temperature', groupName: '温度', name: '热' },
  { id: 'ice', source: 'method', groupId: 'temperature', groupName: '温度', name: '冰' },
  { id: 'sweet', source: 'method', groupId: 'sugar', groupName: '糖度', name: '标准糖' },
  { id: 'pearl', source: 'addon', groupId: 'topping', groupName: '小料', name: '珍珠' },
  { id: 'fruit', source: 'addon', groupId: 'fruit-group', groupName: '果粒', name: '芒果粒' },
];
const context = { options, skus: [{ id: 's1', name: '中杯 / 原味', optionIds: ['small', 'original'] }, { id: 's2', name: '大杯 / 原味', optionIds: ['large', 'original'] }], defaultIds: [] };
const pair = (left, right, kind = 'mixed') => ({ left, right, kind, leftLabel: left, rightLabel: right });
const rule = (left, right, id = 'r1') => ({ version: 2, id, left, right, labels: Object.fromEntries([...left, ...right].map(id => [id, id])) });
const checks = [];
function test(name, run) { run(); checks.push(name); console.log('PASS', name); }
for (const [left, right] of [['small', 'original'], ['small', 'ice'], ['small', 'pearl'], ['ice', 'sweet'], ['ice', 'pearl'], ['pearl', 'fruit']]) {
  test(`${left}/${right} supports semantic cross-object exclusion`, () => assert.deepEqual(validate([pair(left, right)], context), []));
}
test('both multi-select sides expand only across the two sides', () => {
  const pairs = expand([rule(['large', 'ice'], ['sweet', 'fruit'])]);
  assert.equal(pairs.length, 4); assert.equal(blocker('large', ['ice'], pairs), undefined); assert.equal(blocker('sweet', ['fruit'], pairs), undefined);
  for (const a of ['large', 'ice']) for (const b of ['sweet', 'fruit']) { assert.equal(blocker(a, [b], pairs), b); assert.equal(blocker(b, [a], pairs), a); }
});
test('group identity and multi-selects round-trip for editing', () => { const r = rule(['large', 'ice'], ['sweet', 'fruit']); assert.deepEqual(readRules([JSON.stringify(r)]), { rules: [r], error: '' }); assert.equal(read([JSON.stringify(r)]).pairs.length, 4); });
test('legacy rows migrate without losing any relation', () => { const legacy = [pair('small', 'ice', 'sale'), pair('pearl', 'fruit', 'premium')]; const decoded = readRules(legacy.map(JSON.stringify)); assert.equal(decoded.rules.length, 2); assert.deepEqual(expand(decoded.rules).map(p => [p.left, p.right]), legacy.map(p => [p.left, p.right])); });
test('duplicate and reverse duplicates cannot bypass checks by changing type', () => assert.match(validate([pair('small', 'ice', 'sale'), pair('ice', 'small')], context).join(), /重复/));
test('partially overlapping multi-select rules are detected', () => assert.match(validate(expand([rule(['large'], ['fruit']), rule(['large', 'ice'], ['fruit'], 'r2')]), context).join(), /重复/));
test('same option cannot appear on both sides', () => assert.match(validate(expand([rule(['large', 'ice'], ['ice'])]), context).join(), /同一个/));
test('same single-choice group needs no redundant exclusion', () => assert.match(validate([pair('small', 'large')], context).join(), /同一单选组/));
test('disabled or removed option blocks save', () => assert.match(validate([pair('small', 'removed')], context).join(), /停用或移除/));
test('cross-object default conflict blocks save', () => assert.match(validate([pair('small', 'pearl')], { ...context, defaultIds: ['small', 'pearl'] }).join(), /默认选中/));
test('specification exclusions preserve the master SKU and a valid channel combination', () => { const before = structuredClone(context.skus); assert.deepEqual(validate([pair('small', 'original')], context), []); assert.deepEqual(context.skus, before); });
test('excluding every SKU combination blocks save', () => assert.match(validate([pair('small', 'original'), pair('large', 'original')], context).join(), /所有商品组合/));
test('SKU-specific required addon restrictions are solved jointly', () => { const requirement = [{ label: '珍珠必选', minimum: 1, items: [{ id: 'pearl', capacity: 1 }] }]; assert.deepEqual(validate([pair('small', 'pearl')], { ...context, addonRequirements: requirement }), []); assert.match(validate([pair('small', 'pearl'), pair('large', 'pearl')], { ...context, addonRequirements: requirement }).join(), /必选/); });
test('method-specific addon restrictions cannot eliminate every required choice', () => assert.match(validate([pair('hot', 'pearl'), pair('ice', 'pearl')], { ...context, addonRequirements: [{ label: '小料', minimum: 1, items: [{ id: 'pearl', capacity: 1 }] }] }).join(), /必选/));
test('separate required addon groups must be satisfiable together', () => assert.match(validate([pair('pearl', 'fruit')], { ...context, addonRequirements: [{ label: '小料', minimum: 1, items: [{ id: 'pearl', capacity: 1 }] }, { label: '果粒', minimum: 1, items: [{ id: 'fruit', capacity: 1 }] }] }).join(), /必选/));
test('fixed addons participate in specification feasibility', () => assert.match(validate([pair('small', 'pearl'), pair('large', 'pearl')], { ...context, mandatoryIds: ['pearl'] }).join(), /所有商品组合/));
test('quantity rules allow repeated quantity from one valid addon', () => assert.deepEqual(validate([pair('pearl', 'fruit')], { ...context, addonRequirements: [{ label: '全部加料', minimum: 2, items: [{ id: 'pearl', capacity: 2 }, { id: 'fruit', capacity: 1 }] }] }), []));
test('blockers are symmetric but never transitive', () => { const pairs = [pair('small', 'ice'), pair('ice', 'sweet')]; assert.equal(blocker('small', ['ice'], pairs), 'ice'); assert.equal(blocker('sweet', ['small'], pairs), undefined); });
test('post-conversion bindings route converted addon to a direct sale map', () => { const result = plan([pair('small', 'pearl')], id => ({ code: `mt-${id}`, kind: 'sale' })); assert.deepEqual(JSON.parse(result.extendInfoMap.SALE_ATTRIBUTE_MUTEX_MAP), { 'mt-small': ['mt-pearl'], 'mt-pearl': ['mt-small'] }); assert.deepEqual(result.conditionalVisibility, []); });
test('actual sale/premium bindings produce conditional visibility in either order', () => { const binding = id => ({ code: `mt-${id}`, kind: id === 'pearl' ? 'premium' : 'sale' }); const result = plan([pair('small', 'pearl')], binding); assert.deepEqual(result.conditionalVisibility, [{ saleAttributeCode: 'mt-small', premiumCodes: ['mt-pearl'], hide: true }]); assert.deepEqual(result, plan([pair('pearl', 'small')], binding)); assert.equal(result.extendInfoMap.SALE_ATTRIBUTE_MUTEX_MAP, '{}'); });
test('missing and colliding platform bindings fail explicitly', () => { assert.throws(() => plan([pair('small', 'pearl')], () => ({ code: '', kind: 'sale' })), /编码映射/); assert.throws(() => plan([pair('small', 'ice')], () => ({ code: 'same', kind: 'sale' })), /同一个平台编码/); assert.throws(() => serialize([pair('small', 'pearl')], id => id), /平台编码和类型映射/); });
test('legacy transport helper remains available for known homogeneous pairs', () => { const result = serialize([pair('small', 'ice', 'sale'), pair('pearl', 'fruit', 'premium')], id => `code-${id}`); assert.deepEqual(JSON.parse(result.PREMIUM_ATTRIBUTE_MUTEX_MAP), { 'code-pearl': ['code-fruit'], 'code-fruit': ['code-pearl'] }); });
test('malformed storage and duplicate group IDs cannot be overwritten', () => { assert.match(read(['broken']).error, /无法读取/); assert.match(read(false).error, /无法读取/); assert.deepEqual(read(undefined), { pairs: [], error: '' }); assert.match(readRules([JSON.stringify(rule(['small'], ['ice'])), JSON.stringify(rule(['large'], ['fruit']))]).error, /标识重复/); });
console.log(`${checks.length} checks passed.`);
