import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = process.argv[2] || 'http://127.0.0.1:5183/';
const outputDir = path.resolve(process.argv[3] || 'design-handoff/audit/claude-style-current');
const port = 9232;
const profileDir = path.join(os.tmpdir(), `product-center-style-${Date.now()}`);
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
    const targets = await response.json();
    target = targets.find(item => item.type === 'page');
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
const screenshot = async name => {
  const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const file = path.join(outputDir, `${name}.png`);
  await writeFile(file, Buffer.from(result.data, 'base64'));
  return file;
};
const clickExact = async (text, selector = 'button') => {
  const clicked = await evaluate(`(() => { const nodes=[...document.querySelectorAll(${JSON.stringify(selector)})]; const node=nodes.find(item=>item.getBoundingClientRect().width>0&&item.innerText.trim()===${JSON.stringify(text)}); if(!node)return false; node.click(); return true; })()`);
  await delay(400);
  return clicked;
};
const snapshot = label => evaluate(`(() => { const visible=n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0}; return { label:${JSON.stringify(label)}, titles:[...document.querySelectorAll('h1,h2')].filter(visible).map(n=>n.innerText.trim()).slice(0,12), horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth, viewport:[innerWidth,innerHeight], dialogs:[...document.querySelectorAll('[role="dialog"],[aria-modal="true"]')].filter(visible).length }; })()`);

await command('Page.enable');
await command('Runtime.enable');
await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
for (let attempt = 0; attempt < 60; attempt += 1) {
  if (await evaluate(`document.body.innerText.includes('商品工作台')`)) break;
  await delay(200);
}

const results = [];
results.push(await snapshot('workbench'));
await screenshot('01-workbench');
const taskOpened = await clickExact('去处理');
results.push({ ...(await snapshot('workbench-drawer')), taskOpened });
await screenshot('02-workbench-drawer');
await clickExact('关闭待办详情', '[aria-label="关闭待办详情"]');

const settingsOpened = await clickExact('商品设置');
await delay(250);
const strategyOpened = await clickExact('管理策略');
results.push({ ...(await snapshot('strategy-top')), settingsOpened, strategyOpened });
await screenshot('03-strategy-top');

await evaluate(`(() => { const scrollers=[...document.querySelectorAll('*')].filter(n=>{const s=getComputedStyle(n);return /(auto|scroll)/.test(s.overflowY)&&n.scrollHeight>n.clientHeight+100}); const target=scrollers.sort((a,b)=>b.clientHeight-a.clientHeight)[0]; if(target){target.scrollTop=Math.min(720,target.scrollHeight-target.clientHeight); target.dispatchEvent(new Event('scroll')); return {tag:target.tagName,top:target.scrollTop};} return null; })()`);
await delay(300);
results.push(await snapshot('strategy-lower'));
await screenshot('04-strategy-lower');

await writeFile(path.join(outputDir, 'capture.json'), JSON.stringify({ targetUrl, results, consoleErrors }, null, 2));
socket.close();
chrome.kill();
console.log(JSON.stringify({ results, consoleErrors }, null, 2));
