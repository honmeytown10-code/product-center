import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetUrl = process.argv[2] || 'http://127.0.0.1:5184/';
const outputDir = path.resolve(process.argv[3] || 'design-handoff/audit/current');
const port = 9231;
const profileDir = path.join(os.tmpdir(), `product-center-audit-${Date.now()}`);

await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=old',
  '--no-sandbox',
  '--disable-gpu-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--hide-scrollbars',
  '--window-size=1920,1200',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  targetUrl,
], { stdio: 'ignore', windowsHide: true });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

let pageTarget;
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
    pageTarget = targets.find(target => target.type === 'page');
    if (pageTarget) break;
  } catch {}
  await delay(250);
}

if (!pageTarget) {
  chrome.kill();
  throw new Error('Chrome remote debugging target was not ready.');
}

const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const consoleErrors = [];

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    consoleErrors.push(message.params.args.map(arg => arg.value || arg.description || '').join(' '));
  }
  if (message.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(message.params.exceptionDetails?.text || 'Runtime exception');
  }
});

function command(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function screenshot(name) {
  const result = await command('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  const file = path.join(outputDir, `${name}.png`);
  await writeFile(file, Buffer.from(result.data, 'base64'));
  return file;
}

async function clickText(text, selector = 'button') {
  const clicked = await evaluate(`(() => {
    const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
    const target = nodes.find(node => {
      const rect = node.getBoundingClientRect();
      return node.innerText.trim() === ${JSON.stringify(text)} && rect.width > 0 && rect.height > 0;
    });
    if (!target) return false;
    target.click();
    return true;
  })()`);
  await delay(350);
  return clicked;
}

async function clickContaining(text, selector = 'button') {
  const clicked = await evaluate(`(() => {
    const nodes = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
    const target = nodes.find(node => {
      const rect = node.getBoundingClientRect();
      return node.innerText.includes(${JSON.stringify(text)}) && rect.width > 0 && rect.height > 0;
    });
    if (!target) return false;
    target.click();
    return true;
  })()`);
  await delay(350);
  return clicked;
}

async function snapshot(label) {
  return evaluate(`(() => {
    const visible = node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const titles = Array.from(document.querySelectorAll('h1,h2,h3')).filter(visible).slice(0, 8).map(node => node.innerText.trim());
    const drawers = Array.from(document.querySelectorAll('aside[aria-label]')).filter(visible).map(node => node.getAttribute('aria-label'));
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]')).filter(visible).length;
    const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).filter(visible).length;
    const horizontalOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    return { label: ${JSON.stringify(label)}, titles, drawers, dialogs, checked, horizontalOverflow, viewport: [innerWidth, innerHeight] };
  })()`);
}

await command('Page.enable');
await command('Runtime.enable');
await command('Network.enable');
for (let attempt = 0; attempt < 60; attempt += 1) {
  const ready = await evaluate(`document.body.innerText.includes('商品工作台') && Array.from(document.querySelectorAll('th')).some(node => node.innerText.trim() === '操作')`);
  if (ready) break;
  await delay(250);
}

const results = [];
const workbenchBeforeWidth = await evaluate('document.querySelector("main")?.getBoundingClientRect().width || document.querySelector(".flex-1")?.getBoundingClientRect().width || 0');
results.push(await snapshot('商品工作台-初始'));
await screenshot('01-workbench-initial');

const stickyAction = await evaluate(`(() => {
  const th = Array.from(document.querySelectorAll('th')).find(node => node.innerText.trim() === '操作');
  if (!th) return { found: false };
  const scroller = th.closest('.overflow-auto');
  const before = th.getBoundingClientRect();
  if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  const after = th.getBoundingClientRect();
  return {
    found: true,
    position: getComputedStyle(th).position,
    right: getComputedStyle(th).right,
    beforeRight: Math.round(before.right),
    afterRight: Math.round(after.right),
    viewportRight: innerWidth,
    scrollerRight: scroller ? Math.round(scroller.getBoundingClientRect().right) : null,
  };
})()`);

const openedDrawer = await clickText('去处理');
const workbenchAfterWidth = await evaluate('document.querySelector("main")?.getBoundingClientRect().width || document.querySelector(".flex-1")?.getBoundingClientRect().width || 0');
results.push(await snapshot('商品工作台-详情抽屉'));
await screenshot('02-workbench-drawer');
await clickText('关闭待办详情', '[aria-label="关闭待办详情"]');

const menuShots = [
  ['商品主档', '03-product-master'],
  ['分类与属性', '04-category-attribute'],
  ['配方与营养', '05-recipe-nutrition'],
  ['渠道商品', '06-channel-product'],
  ['渠道分类与属性', '07-channel-category-attribute'],
  ['商品模板', '08-product-template'],
  ['销售规则', '09-sales-rules'],
  ['商品推荐', '10-recommendation'],
  ['发布中心', '11-publish-center'],
  ['映射治理', '12-mapping'],
  ['差异巡检', '13-difference'],
  ['门店商品', '14-store-product'],
  ['商品设置', '15-settings'],
];

for (const [label, file] of menuShots) {
  const clicked = await clickText(label);
  results.push({ ...(await snapshot(label)), clicked });
  await screenshot(file);
}

const flowResults = [];

await clickText('商品主档');
const masterCreateOpened = await clickText('新建商品主档');
flowResults.push({ ...(await snapshot('新建商品主档')), opened: masterCreateOpened });
await screenshot('16-product-master-create');
await clickText('取消');

await clickText('商品模板');
const templateCreateOpened = await clickText('创建模板');
flowResults.push({ ...(await snapshot('创建商品模板')), opened: templateCreateOpened });
await screenshot('17-template-create');
await clickText('关闭', '[aria-label="关闭"]');

await clickText('销售规则');
for (const [tab, file] of [
  ['售卖范围', '18-sales-scope'],
  ['价格策略', '19-price-strategy'],
  ['属性互斥', '20-attribute-mutex'],
  ['必选商品', '21-required-product'],
]) {
  const clicked = await clickText(tab);
  flowResults.push({ ...(await snapshot(tab)), clicked });
  await screenshot(file);
}

await clickText('商品设置');
const strategyOpened = await clickText('管理策略');
flowResults.push({ ...(await snapshot('全渠道商品管理策略')), opened: strategyOpened });
await screenshot('22-omnichannel-strategy');

const unifiedSelected = await clickContaining('统一商品维护');
const impactOpened = await clickText('保存策略');
flowResults.push({ ...(await snapshot('统一维护-影响确认')), unifiedSelected, impactOpened });
await screenshot('23-unified-impact-confirm');
const unifiedSaved = await clickText('确认保存');
await delay(900);
const unifiedMenu = await evaluate(`Array.from(document.querySelectorAll('aside button')).filter(node => node.getBoundingClientRect().width > 0).map(node => node.innerText.trim()).filter(Boolean)`);
await clickText('商品管理');
flowResults.push({ ...(await snapshot('统一维护-商品管理')), unifiedSaved, unifiedMenu });
await screenshot('24-unified-product-management');

await clickText('商品模板');
const templateContext = await evaluate(`Array.from(document.querySelectorAll('[role="tablist"],nav[aria-label],div[aria-label]')).filter(node => node.getBoundingClientRect().width > 0).map(node => ({ label: node.getAttribute('aria-label'), text: node.innerText.trim() })).filter(item => item.label)`);
await clickText('销售规则');
const salesContext = await evaluate(`Array.from(document.querySelectorAll('[role="tablist"],nav[aria-label],div[aria-label]')).filter(node => node.getBoundingClientRect().width > 0).map(node => ({ label: node.getAttribute('aria-label'), text: node.innerText.trim() })).filter(item => item.label)`);

const audit = {
  targetUrl,
  createdAt: new Date().toISOString(),
  results,
  workbench: {
    openedDrawer,
    initialDrawerCount: results[0].drawers.length,
    initialCheckedCount: results[0].checked,
    contentWidthBefore: workbenchBeforeWidth,
    contentWidthWithDrawer: workbenchAfterWidth,
    stickyAction,
  },
  templateContext,
  salesContext,
  flowResults,
  consoleErrors,
};

await writeFile(path.join(outputDir, 'audit.json'), JSON.stringify(audit, null, 2));
socket.close();
chrome.kill();
console.log(JSON.stringify(audit, null, 2));
