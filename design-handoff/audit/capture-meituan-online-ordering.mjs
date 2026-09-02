import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = process.argv[2] || 'http://127.0.0.1:5186/';
const outputDir = path.resolve(process.argv[3] || 'design-handoff/audit/meituan-online-ordering');
const port = 9238;
const profileDir = path.join(os.tmpdir(), `product-center-meituan-${Date.now()}`);
await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader', '--hide-scrollbars', '--window-size=1600,1000',
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
const clickText = async (text, selector = 'button,a') => {
  const clicked = await evaluate(`(() => { const nodes=[...document.querySelectorAll(${JSON.stringify(selector)})]; const visible=n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0}; const node=nodes.find(item=>visible(item)&&item.innerText.trim()===${JSON.stringify(text)})||nodes.find(item=>visible(item)&&item.innerText.includes(${JSON.stringify(text)})); if(!node)return false; node.click(); return true; })()`);
  await delay(650);
  return clicked;
};
const setLargestScroll = async ratio => evaluate(`(() => { const nodes=[...document.querySelectorAll('*')].filter(n=>{const s=getComputedStyle(n);return /(auto|scroll)/.test(s.overflowY)&&n.scrollHeight>n.clientHeight+120}); const target=nodes.sort((a,b)=>b.clientHeight-a.clientHeight)[0]; if(!target)return null; target.scrollTop=(target.scrollHeight-target.clientHeight)*${ratio}; target.dispatchEvent(new Event('scroll')); return {top:target.scrollTop,height:target.scrollHeight}; })()`);
const snapshot = label => evaluate(`(() => ({label:${JSON.stringify(label)},text:document.body.innerText.slice(0,2500),dialogs:[...document.querySelectorAll('[role="dialog"],[aria-modal="true"]')].filter(n=>n.getBoundingClientRect().width>0).length}))()`);

await command('Page.enable');
await command('Runtime.enable');
await command('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await delay(1600);

const results = [];
results.push({ channelMenu: await clickText('渠道商品') });
await clickText('在线点商品库');
await clickText('维护渠道资料');
await clickText('美团在线点');
await clickText('渠道专属属性');
results.push(await snapshot('meituan-channel-fields'));
await screenshot('01-meituan-channel-fields');

await clickText('发布中心');
await clickText('发布商品至门店');
await clickText('在线点商品库');
await clickText('下一步');
await delay(500);
await setLargestScroll(0.6);
results.push(await snapshot('meituan-publish-orchestration'));
await screenshot('02-meituan-publish-orchestration');

await clickText('同步记录');
results.push(await snapshot('meituan-publish-record'));
await screenshot('03-meituan-publish-record');

await writeFile(path.join(outputDir, 'capture.json'), JSON.stringify({ targetUrl, results, consoleErrors }, null, 2));
socket.close();
chrome.kill();
console.log(JSON.stringify({ results: results.map(item => ({ label: item.label, channelMenu: item.channelMenu, dialogs: item.dialogs })), consoleErrors }, null, 2));
