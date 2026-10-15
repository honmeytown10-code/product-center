import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const url = process.argv[2] || 'http://127.0.0.1:5196/?view=ops';
const split = url.includes('scenario=split');
const libraryMenu = split ? '商品主档' : '商品库';
const output = path.resolve(process.argv[3] || 'design-handoff/audit/blind-bag-category-20261014/ops');
await mkdir(output, { recursive: true });
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1440,900',
  '--remote-debugging-port=9248', `--user-data-dir=${path.join(os.tmpdir(), `blind-bag-qa-${Date.now()}`)}`, url,
], { stdio: 'ignore', windowsHide: true });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let serial = 0;
const pending = new Map();
const failures = [];
const checks = [];
const screenshots = [];
try {
  let target;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { target = (await (await fetch('http://127.0.0.1:9248/json/list')).json()).find(item => item.type === 'page'); } catch {}
    if (target) break;
    await pause(200);
  }
  assert(target, 'Headless browser available');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const task = pending.get(message.id); if (task) { pending.delete(message.id); message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result); } }
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  const command = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  const body = () => evaluate('document.body?.innerText || ""');
  const check = (condition, label) => { assert(condition, label); checks.push(label); console.log(`PASS ${label}`); };
  const click = async (text, selector = 'button') => {
    assert(await evaluate(`(() => { const item = [...document.querySelectorAll(${JSON.stringify(selector)})].find(node => node.getClientRects().length && !node.disabled && node.innerText.trim() === ${JSON.stringify(text)}); if (!item) return false; item.click(); return true; })()`), `Click ${text}`);
    await pause(350);
  };
  const input = async (id, value) => {
    assert(await evaluate(`(() => { const node = document.getElementById(${JSON.stringify(id)}); if (!node) return false; Object.getOwnPropertyDescriptor(node.tagName === 'SELECT' ? HTMLSelectElement.prototype : node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); return true; })()`), `Input ${id}`);
    await pause(80);
  };
  const screenshot = async name => { const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); await writeFile(path.join(output, `${name}.png`), Buffer.from(result.data, 'base64')); screenshots.push(name); };
  const waitFor = async text => { for (let attempt = 0; attempt < 180; attempt++) { if ((await body()).includes(text)) return; await pause(300); } throw new Error(`Timed out waiting for ${text}: ${(await body()).slice(-4000)}`); };
  await command('Page.enable'); await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  socket.addEventListener('message', event => { const message=JSON.parse(event.data); if (message.method==='Page.javascriptDialogOpening') void command('Page.handleJavaScriptDialog',{accept:true}); });
  const change = async (selector, value) => {
    assert(await evaluate(`(() => { const node=document.querySelector(${JSON.stringify(selector)}); if(!node)return false; Object.getOwnPropertyDescriptor(node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(node,${JSON.stringify(value)});node.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`), selector); await pause(120);
  };
  const switchClient = async name => { await evaluate('document.querySelector("button[aria-label=切换客户端]").click()'); await click(name); await pause(250); };
  await waitFor('类目配置管理');
  await click('类目配置管理','div');
  await evaluate('document.querySelector("[data-ops-category=w_cat_blind_bag] > div").click()');
  await pause(250);
  check((await body()).includes('特殊场景 · 仅盲袋入口使用'), 'Ops category displays the blind-bag scene marker');
  check((await body()).includes('保存字段配置') && (await body()).includes('细分配置字段'), 'Existing category field and child editor is retained');
  await screenshot('01-ops-category-fields');
  await evaluate('document.querySelector("[aria-label=编辑类目盲袋商品]").click()');
  await pause(250);
  check(await evaluate('document.querySelector("input[name=category-creation-scene]:checked").parentElement.innerText.includes("特殊场景")'), 'Category metadata preselects the special-scene marker');
  check(await evaluate('document.getElementById("ops-category-scene").value === "blind_bag"'), 'Special scene identifies blind-bag creation');
  check((await body()).includes('普通商品创建及类目切换不展示此类目') && !(await evaluate('document.querySelector("[data-testid=ops-category-modal]").innerText.includes("关联行业")')), 'Special usage explains visibility and avoids ordinary industry defaults');
  await screenshot('02-special-scene-marker');
  await change('[data-testid=ops-category-modal] input[placeholder=请输入类目名称]', '鲜食优惠袋');
  await click('保存配置');
  await evaluate('document.querySelector("[data-ops-add-field=p_code]").click()');
  await evaluate('document.querySelector("[aria-label=移除字段商品封面]").click()');
  await click('保存字段配置');
  check(!await evaluate('!!document.querySelector("[data-ops-field=p_cover_img]")') && await evaluate('!!document.querySelector("[data-ops-field=p_code]")'), 'Existing Ops editor saves a field addition and removal');
  await switchClient('Web');
  await click('盲袋商品','.console-sidebar button');
  await click('新建盲袋商品');
  check(await evaluate('document.querySelector("[data-testid=fixed-scene-category]").innerText === "商品类目：鲜食优惠袋"'), 'Blind-bag entry binds the category by scene instead of its name');
  check(await evaluate('!!document.querySelector("#field-p_code input")'), 'Ops-added field appears in the shared product form');
  check(!await evaluate('!!document.querySelector("[aria-label=添加商品封面]")'), 'Ops-removed field disappears from the product form');
  await screenshot('03-config-driven-product-form');
  await click('取消');
  await evaluate('([...document.querySelectorAll("tr")].find(row=>row.innerText.includes("烘焙惊喜盲袋"))).querySelector("button").click()');
  await pause(250);
  await change('#field-p_code input','BLINDBAGSEARCH');
  await click('保存');
  await waitFor('编辑成功');
  await click('返回商品列表');
  await evaluate('([...document.querySelectorAll("tr")].find(row=>row.innerText.includes("烘焙惊喜盲袋"))).querySelector("button").click()');
  await pause(250);
  check(await evaluate('document.querySelector("#field-p_code input").value === "BLINDBAGSEARCH"'), 'Ops-added field survives save and reopen without a code whitelist');
  await click('取消');
  await click('商品库','.console-sidebar button');
  await click('新建单品');
  check(!await evaluate('document.querySelector("[data-testid=product-category-picker]").innerText.includes("鲜食优惠袋")'), 'Ordinary create picker excludes the renamed special category');
  await evaluate('([...document.querySelectorAll("[data-testid=product-category-picker] button")].find(node=>node.innerText.startsWith("通用菜品"))).click()');
  await pause(250);
  await evaluate('([...document.querySelectorAll("button")].find(node=>node.innerText.trim()==="商品类目：通用菜品")).click()');
  check(!await evaluate('document.querySelector("[data-testid=product-category-picker]").innerText.includes("鲜食优惠袋")'), 'Ordinary category switch also excludes the special category');
  await screenshot('04-ordinary-picker');
  await switchClient('Ops');
  await click('类目配置管理','div');
  await evaluate('document.querySelector("[aria-label=编辑类目通用菜品]").click()');
  await evaluate('([...document.querySelectorAll("[data-testid=ops-category-modal] label")].find(node=>node.innerText.trim()==="特殊场景使用")).querySelector("input").click()');
  check((await body()).includes('所选品牌已配置盲袋专用类目') && await evaluate('[...document.querySelectorAll("[data-testid=ops-category-modal] button")].find(node=>node.innerText.trim()==="保存配置").disabled'), 'Ops prevents duplicate active scene categories for the same brands');
  await click('取消');
  await evaluate('document.querySelector("[data-ops-category=w_cat_blind_bag] [title=当前已启用，点击禁用]").click()');
  await switchClient('Web');
  await click('盲袋商品','.console-sidebar button');
  check((await body()).includes('暂无可用的盲袋专用类目') && await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] button")].find(node=>node.innerText.trim()==="新建盲袋商品").disabled'), 'Disabled scene category blocks blind-bag creation with an actionable message');
  await screenshot('05-disabled-category');
  check(!failures.length,'No browser runtime exceptions');
} catch (error) {
  failures.push(error.stack || String(error));
  if (socket?.readyState === WebSocket.OPEN) {
    const id = ++serial; socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: 'document.body.innerText', returnByValue: true } }));
    socket.addEventListener('message', async event => { const message = JSON.parse(event.data); if (message.id === id) await writeFile(path.join(output, 'failure-body.txt'), message.result?.result?.value || ''); });
    await pause(200);
  }
} finally {
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ url, checks, screenshots, failures }, null, 2));
  socket?.close(); browser.kill();
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
