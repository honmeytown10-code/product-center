import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile, unlink } from 'node:fs/promises';
const compiled = await build({ stdin: { contents: `export { WebThirdPartyChannelFields, resolveChannelFieldValues } from './components/web/WebThirdPartyChannelFields'; export { checkMeituanMutexPairs } from './takeoutSync';`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false });
const temp = new URL('../.takeout-fields-smoke.mjs', import.meta.url);
try {
  await writeFile(temp, compiled.outputFiles[0].text);
  const { WebThirdPartyChannelFields, resolveChannelFieldValues, checkMeituanMutexPairs } = await import(temp.href);
  const React = await import('react'); const { renderToStaticMarkup } = await import('react-dom/server');
  const snapshot = { skus: [{id:'s1',name:'大杯',packagingFee:'0'}], methods: [], addonItems: [{id:'a',name:'珍珠',groupName:'小料'},{id:'b',name:'椰果',groupName:'小料'}] };
  for (const channel of ['meituan','taobao']) {
    const html = renderToStaticMarkup(React.createElement(WebThirdPartyChannelFields,{channelIds:[channel], location:'channel', snapshot, onPackagingFeeChange:()=>{}, value:{[channel]:{attributeMutex:true}},packagingFeeMode:'product'}));
    assert(html.includes('餐盒费金额'));
    assert(!html.includes('readOnly'));
    assert.equal(html.includes('餐盒费计费步长'),channel==='meituan');
    assert(html.includes('各规格共用'));
    assert(!/md:col-span-2[^>]*>\s*<label[^>]*>\s*商品特色/.test(html));
    if(channel==='meituan') assert(html.includes('添加互斥属性'));
    else assert(html.includes('默认按 1 份进行同步处理'));
  }
  assert.equal(resolveChannelFieldValues(['taobao'],{taobao:{'packingStep:s1':'3'}}).taobao['packingStep:s1'],'1');
  assert.equal(resolveChannelFieldValues(['meituan'],{meituan:{'packingStep:s1':'3'}}).meituan['packingStep:s1'],'3');
  assert.equal(checkMeituanMutexPairs([JSON.stringify(['addon:a','addon:b'])],snapshot),null);
  assert(checkMeituanMutexPairs([JSON.stringify(['addon:a','addon:a'])],snapshot));
  assert(checkMeituanMutexPairs([JSON.stringify(['addon:a','addon:b']),JSON.stringify(['addon:b','addon:a'])],snapshot));
  assert(checkMeituanMutexPairs([JSON.stringify(['addon:a','addon:removed'])],snapshot));
  console.log('PASS takeout fields: editable zero fee, channel-specific steps, shared fee notice, paired layout, mutex validation and legacy step normalization');
} finally { await unlink(temp).catch(()=>{}); }
