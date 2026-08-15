import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = process.argv[2] || 'http://127.0.0.1:5183/';
const outputDir = path.resolve(process.argv[3] || 'design-handoff/audit/menu-consolidation-2026-08-02');
const port = 9234;
const profileDir = path.join(os.tmpdir(), `product-center-menu-${Date.now()}`);
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
  if (message.method === 'Runtime.exceptionThrown') consoleErrors.push(message.params.exceptionDetails?.text || 'Runtime exception');
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
  await delay(500);
  return clicked;
};
const clickIncludes = async text => {
  const clicked = await evaluate(`(() => { const node=[...document.querySelectorAll('button')].find(item=>item.getBoundingClientRect().width>0&&item.innerText.includes(${JSON.stringify(text)})); if(!node)return false; node.click(); return true; })()`);
  await delay(500);
  return clicked;
};
const capture = async name => {
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(path.join(outputDir, `${name}.png`), Buffer.from(result.data, 'base64'));
};

await command('Page.enable');
await command('Runtime.enable');
await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
for (let attempt = 0; attempt < 60; attempt += 1) {
  if (await evaluate(`document.body.innerText.includes('商品工作台')`)) break;
  await delay(200);
}

const visibleTexts = await evaluate(`(() => [...document.querySelectorAll('button')].filter(node=>{const rect=node.getBoundingClientRect();return rect.width>0&&rect.height>0}).map(node=>node.innerText.trim()))()`);
const summaryOpened = await clickIncludes('商品资料待完善');
const summaryDrawerVisible = await evaluate(`Boolean([...document.querySelectorAll('[aria-label="待办详情"]')].find(node=>{const rect=node.getBoundingClientRect();return rect.width>0&&rect.height>0}))`);
await capture('workbench-summary-drawer');
await evaluate(`(() => { const node=[...document.querySelectorAll('button')].find(item=>item.getAttribute('aria-label')==='关闭待办详情'); if(node) node.click(); })()`);
await delay(300);
const salesRuleOpened = await clickExact('销售规则');
const tabOrder = await evaluate(`(() => { const expected=['门店售卖规则','商品模板','价格策略','属性互斥','必选商品']; const buttons=[...document.querySelectorAll('button')].filter(node=>{const rect=node.getBoundingClientRect();return rect.width>0&&rect.height>0}); return buttons.map(node=>node.innerText.trim()).filter(text=>expected.includes(text)); })()`);
const templateOpened = await clickExact('商品模板');
const templatePageVisible = await evaluate(`document.body.innerText.includes('创建模板') && [...document.querySelectorAll('input')].some(input => input.placeholder === '搜索模板名称、描述、ID')`);
const horizontalOverflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth`);
await capture('sales-rules-template-tab');

const result = {
  targetUrl,
  sidebar: {
    salesRulesVisible: visibleTexts.includes('销售规则'),
    standaloneTemplateVisible: visibleTexts.includes('商品模板'),
    differenceInspectionVisible: visibleTexts.includes('差异巡检'),
  },
  workbench: {
    summaryOpened,
    summaryDrawerVisible,
    duplicateTaskTableVisible: await evaluate(`document.body.innerText.includes('搜索商品、任务编号')`),
  },
  salesRuleOpened,
  tabOrder,
  templateOpened,
  templatePageVisible,
  horizontalOverflow,
  consoleErrors,
};
await writeFile(path.join(outputDir, 'result.json'), JSON.stringify(result, null, 2));
socket.close();
chrome.kill();
console.log(JSON.stringify(result, null, 2));
