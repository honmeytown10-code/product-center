import { readFile, writeFile } from 'node:fs/promises';
const input = new URL('../exports/product-center-prototype.html', import.meta.url);
const output = new URL('../exports/meituan-online-mutex.html', import.meta.url);
let html = await readFile(input, 'utf8');
// Select the isolated demo before the bundled application starts, including file://.
const bootstrap = `<script>(function(){if(!new URLSearchParams(location.search).has('preview')){var url=new URL(location.href);url.searchParams.set('preview','meituan-online-mutex');try{history.replaceState(null,'',url.href)}catch(e){location.replace(url.href)}}})();</script>`;
if (!html.includes('<head>')) throw new Error('Expected an HTML head in the single-file build.');
html = html.replace('<head>', `<head>${bootstrap}`).replace(/<title>[^<]*<\/title>/, '<title>美团在线点 · 商品属性互斥演示</title>');
await writeFile(output, html, 'utf8');
console.log('Standalone demo: exports/meituan-online-mutex.html');
