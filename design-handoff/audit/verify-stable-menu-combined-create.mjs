import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = process.argv[2] || 'http://127.0.0.1:5183/';
const outputDir = path.resolve(process.argv[3] || 'design-handoff/audit/stable-menu-combined-create-2026-08-06');
const port = 9236;
const profileDir = path.join(os.tmpdir(), `product-center-stable-menu-${Date.now()}`);
await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=old', '--no-sandbox', '--disable-gpu-sandbox', '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader', '--hide-scrollbars', '--window-size=1440,900',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, targetUrl,
], { stdio: 'ignore', windowsHide: true });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let target;
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    target = (await response.json()).find(item => item.type === 'page');
    if (target) break;
  } catch {}
  await delay(250);
}
if (!target) throw new Error('Browser target unavailable');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let id = 1;
const pending = new Map();
const consoleErrors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const item = pending.get(message.id);
    pending.delete(message.id);
    message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
  }
  if (message.method === 'Runtime.exceptionThrown') consoleErrors.push(
    message.params.exceptionDetails?.exception?.description
    || message.params.exceptionDetails?.text
    || 'Runtime exception'
  );
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    consoleErrors.push(message.params.args.map(arg => arg.value || arg.description || '').join(' '));
  }
});

const command = (method, params = {}) => {
  const callId = id++;
  socket.send(JSON.stringify({ id: callId, method, params }));
  return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
};
const evaluate = async expression => {
  const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const clickExact = async text => {
  const clicked = await evaluate(`(() => { const node=[...document.querySelectorAll('button')].find(item=>item.getBoundingClientRect().width>0&&item.innerText.trim()===${JSON.stringify(text)}); if(!node)return false; node.click(); return true; })()`);
  await delay(450);
  return clicked;
};
const clickIncludes = async text => {
  const clicked = await evaluate(`(() => { const node=[...document.querySelectorAll('button')].find(item=>item.getBoundingClientRect().width>0&&item.innerText.includes(${JSON.stringify(text)})); if(!node)return false; node.click(); return true; })()`);
  await delay(450);
  return clicked;
};
const capture = async name => {
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(path.join(outputDir, `${name}.png`), Buffer.from(result.data, 'base64'));
};

await command('Page.enable');
await command('Runtime.enable');
await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await delay(1800);

const initialText = await evaluate('document.body.innerText');
const initialStableMenu = await evaluate(`(() => { const labels=[...document.querySelectorAll('button')].map(item=>item.innerText.trim()); return ['商品主档','渠道商品','渠道分类与属性'].every(text=>labels.includes(text)); })()`);
await capture('00-initial');

const clickedSettings = await clickExact('商品设置');
const clickedManageStrategy = await clickExact('管理策略');
const clickedUnified = await clickIncludes('统一管理');
const creationSettingVisible = (await evaluate('document.body.innerText')).includes('允许同时创建主档与渠道商品');
const clickedSave = await clickExact('保存策略');
const clickedConfirmSave = await clickExact('确认保存');
await delay(900);

const unifiedText = await evaluate('document.body.innerText');
const unifiedStableMenu = ['商品主档', '渠道商品', '渠道分类与属性'].every(text => unifiedText.includes(text));
const clickedChannelProduct = await clickExact('渠道商品');
await delay(700);
const catalogText = await evaluate('document.body.innerText');
const singleDefaultCatalog = catalogText.includes('品牌默认商品库');
const createButtonVisible = catalogText.includes('新建商品');
await capture('01-unified-channel-catalog');

const clickedCreate = await clickExact('新建商品');
const clickedStandard = await clickIncludes('新建标准商品');
const categoryModalVisible = (await evaluate('document.body.innerText')).includes('选择商品类目');
await clickIncludes('通用菜品');
await delay(700);
const formText = await evaluate('document.body.innerText');
const combinedFormVisible = formText.includes('主档 + 渠道商品')
  && formText.includes('主档基础资料')
  && formText.includes('渠道展示资料');
await capture('02-combined-create-form');

const results = {
  initialStableMenu,
  clickedSettings,
  clickedManageStrategy,
  clickedUnified,
  creationSettingVisible,
  clickedSave,
  clickedConfirmSave,
  unifiedStableMenu,
  clickedChannelProduct,
  singleDefaultCatalog,
  createButtonVisible,
  clickedCreate,
  clickedStandard,
  categoryModalVisible,
  combinedFormVisible,
  horizontalOverflow: await evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth'),
  consoleErrors,
};
await writeFile(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2), 'utf8');
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);

socket.close();
chrome.kill();

if (Object.entries(results).some(([key, value]) => key !== 'consoleErrors' && key !== 'horizontalOverflow' && value !== true)
  || results.horizontalOverflow
  || consoleErrors.length > 0) {
  process.exitCode = 1;
}
