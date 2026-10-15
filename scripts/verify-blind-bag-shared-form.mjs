import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const url = process.argv[2] || 'http://127.0.0.1:5196/?menu=blind_bag_products';
const split = url.includes('scenario=split');
const libraryMenu = split ? '商品主档' : '商品库';
const output = path.resolve(process.argv[3] || 'design-handoff/audit/blind-bag-publish-20261015');
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
  await waitFor('新建盲袋商品');
  check(await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] button")].filter(node=>node.innerText.trim()==="下发门店").length === 1'), 'List has one shared publication entry');
  check(!await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] button")].some(node=>/导入|导出|^批量下发门店$/.test(node.innerText.trim()))'), 'Blind-bag list has no import or export actions');
  check(await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] tbody tr")].every(row=>row.querySelectorAll("button").length <= 3) && [...document.querySelectorAll("[data-testid=blind-bag-list] tbody button")].some(node=>node.innerText.trim()==="归档")'), 'Rows offer lifecycle actions with at most three buttons');
  check((await body()).includes('已启用') && (await body()).includes('已停用') && (await body()).includes('草稿'), 'Product statuses remain visible');
  check(await evaluate('(() => { const text=document.querySelector("[data-testid=blind-bag-list] header p").innerText; return text.includes("尾货损耗") && text.includes("到店自提") && !/单规格|销售渠道|商品库/.test(text); })()'), 'Description explains fresh-food blind bags to merchants');
  check(await evaluate('(() => { const input=document.getElementById("blind-list-search").getBoundingClientRect(); const label=document.querySelector("label[for=blind-list-search]").getBoundingClientRect(); return Math.abs((input.y+input.height/2)-(label.y+label.height/2)) < 2 && label.right <= input.left; })()'), 'Search label and input share one horizontal control');
  await input('blind-list-search', '烘焙惊喜');
  await click('查询');
  check(await evaluate('document.querySelectorAll("[data-testid=blind-bag-list] tbody tr").length === 1'), 'Search filters blind-bag products');
  await click('重置');
  await evaluate('document.querySelector("input[aria-label=选择小食惊喜盲袋]").click()');
  check(await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] button")].find(node=>node.innerText.trim()==="下发门店").disabled') && (await body()).includes('停用商品请先启用'), 'Stopped product selection requires enabling before publication');
  await click('清空选择');
  await screenshot('00-list-toolbar');
  await click('下发门店');
  await click('选择商品');
  await evaluate('document.querySelector("button[title=关闭]").parentElement.parentElement.setAttribute("data-testid", "publish-selector")');
  check(await evaluate('[...document.querySelectorAll("[data-testid=publish-selector] tbody tr")].every(row=>row.innerText.includes("demo-blind-bag")) && document.querySelectorAll("[data-testid=publish-selector] tbody tr").length === 2 && !document.querySelector("[data-testid=publish-selector]").innerText.includes("甜品盲袋（待完善）")'), 'Shared publication selector offers only blind bags and hides drafts');
  check(await evaluate('[...document.querySelectorAll("[data-testid=publish-selector] tbody tr")].find(row=>row.innerText.includes("小食惊喜")).querySelector("input[type=checkbox]").disabled'), 'Shared selector keeps stopped or channel-incompatible products disabled');
  await screenshot('00a-blind-bag-only-selector');
  await evaluate('([...document.querySelectorAll("[data-testid=publish-selector] tbody tr")].find(row=>row.innerText.includes("烘焙惊喜盲袋"))).querySelector("input[type=checkbox]").click()');
  await click('确定');
  check((await body()).includes('烘焙惊喜盲袋'), 'Shared publication tool accepts a selected blind bag');
  check(await evaluate('[...document.querySelectorAll("label")].filter(node=>node.innerText.includes("小程序")).length === 1') && !(await body()).includes('小程序外卖'), 'Unselected publication entry only offers mini-program dine-in');
  await screenshot('00b-dine-in-only-publication');
  await click('盲袋商品', '.console-sidebar button');
  let acceptLeave = true;
  socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.method === 'Page.javascriptDialogOpening') void command('Page.handleJavaScriptDialog', { accept: acceptLeave }); });
  await click('新建盲袋商品');
  check(await evaluate('!!document.querySelector("[data-testid=blind-bag-form]")'), 'Blind-bag adapter opens the library form');
  check(await evaluate('document.querySelector("[data-testid=fixed-scene-category]")?.innerText === "商品类目：盲袋商品" && ![...document.querySelectorAll("button")].some(node=>node.innerText.trim()==="商品类目：盲袋商品")'), 'Blind-bag creation defaults to its fixed special category');
  const documentText = await body();
  check(['基础信息','商品结构','销售范围','展示设置','销售设置','其他设置'].every(label => documentText.includes(label)), 'Library form sections restored');
  check(!await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-form] label")].some(node=>node.innerText.trim()==="多规格")'), 'Multi-spec selector is absent');
  check(!await evaluate('!!document.getElementById("field-m_methods") || !!document.getElementById("field-a_addons")'), 'Method and addon configuration remains unavailable');
  await screenshot('01-library-layout');
  await writeFile(path.join(output, 'form-body.txt'), await body());
  await click('取消');
  await evaluate(`(() => { const row = [...document.querySelectorAll('tr')].find(node => node.innerText.includes('烘焙惊喜盲袋')); [...row.querySelectorAll('button')].find(node => node.innerText.trim() === '编辑').click(); })()`);
  await pause(400);
  await screenshot('02-library-edit');
  check((await body()).includes('展示设置'), 'Edit keeps display settings available');
  const change = async (selector, value) => {
    assert(await evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); if (!node) return false; Object.getOwnPropertyDescriptor(node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`), selector); await pause(100);
  };
  await change('textarea[placeholder="请输入商品列表页简述"]', '当天烘焙惊喜，内容以门店装袋为准');
  await change('textarea[placeholder="请输入商品详情内容"]', '盲袋商品详情回显验证：取袋后查看实际食品内容。');
  await change('input[placeholder="请输入销售价"]', '0');
  await change('input[aria-label="盲袋初始库存"]', '4');
  await evaluate('document.querySelector("[aria-label=添加商品封面]").click()');
  await pause(150);
  await click('展示设置');
  await screenshot('03-display-settings');
  for (const label of ['商品角标', '角标展示日期', '商品视频', '售卖设置', '基础销量', '商品分享']) await click(label);
  check((await body()).includes('参与会员折扣') && (await body()).includes('分享标题'), 'Applicable sales and advanced settings restored');
  await click('展示设置');
  await screenshot('04-expanded-display');
  await writeFile(path.join(output, 'expanded-form-body.txt'), await body());
  await click('保存');
  await waitFor('编辑成功');
  check(!(await body()).includes('通过模板下发'), 'Blind-bag result does not offer unsupported template publication');
  await click('返回商品列表');
  await evaluate(`(() => { const row = [...document.querySelectorAll('tr')].find(node => node.innerText.includes('烘焙惊喜盲袋')); [...row.querySelectorAll('button')].find(node => node.innerText.trim() === '编辑').click(); })()`);
  await pause(250);
  check(await evaluate('document.querySelector("textarea[placeholder=请输入商品列表页简述]").value === "当天烘焙惊喜，内容以门店装袋为准"'), 'List description survives save and reopen');
  check(await evaluate('document.querySelector("textarea[placeholder=请输入商品详情内容]").value.includes("详情回显验证")'), 'Rich detail text survives save and reopen');
  check(await evaluate('document.querySelector("input[placeholder=请输入销售价]").value === "0"'), 'Zero price survives shared form serialization');
  check(await evaluate('document.querySelector("input[aria-label=盲袋初始库存]").value === "4"'), 'Single-SKU stock survives shared form serialization');
  check(await evaluate('!!document.querySelector("[aria-label=移除商品封面]")'), 'Cover image survives save and reopen');
  await click('销售设置');
  await screenshot('05-sales-settings');
  await click('其他设置');
  await screenshot('06-other-settings');
  await click('取消');
  await evaluate('document.querySelector("input[aria-label=选择烘焙惊喜盲袋]").click()');
  await click('下发门店');
  await pause(600);
  check(await evaluate('[...document.querySelectorAll("label")].filter(node=>node.innerText.includes("小程序")).length === 1') && !(await body()).includes('小程序外卖'), 'Preselected publication only offers mini-program dine-in');
  await click('下一步');
  const publishText = await body();
  check(['列表页简述','商品封面图','详情页描述','商品分享','包装费'].every(label=>publishText.includes(label)), 'Publication overwrite options include the restored settings');
  check(!await evaluate('[...document.querySelectorAll("label")].some(node=>/^(做法|加料|计划库存|商品档口|渠道专属属性)$/.test(node.innerText.trim()))'), 'Publication excludes incompatible structures and platform fields');
  await evaluate('document.querySelector("input[aria-label=全选筛选结果中的门店]").click()');
  await evaluate('([...document.querySelectorAll("label")].find(node=>node.innerText.trim()==="立即执行")).querySelector("input").click()');
  await screenshot('07-publish-display-fields');
  await click('提交并同步');
  await waitFor('同步任务已提交');
  await click('门店商品', '.console-sidebar button');
  await pause(300);
  await change('input[placeholder="搜索商品名称/ID"]', '烘焙惊喜盲袋');
  await pause(300);
  await evaluate(`(() => { const row = [...document.querySelectorAll('tr')].find(node => node.innerText.includes('烘焙惊喜盲袋')); [...row.querySelectorAll('button')].find(node => node.innerText.trim() === '编辑').click(); })()`);
  await pause(350);
  check(await evaluate('document.querySelector("textarea[placeholder=请输入商品列表页简述]").value === "当天烘焙惊喜，内容以门店装袋为准"'), 'List description reaches the store form');
  check(await evaluate('document.querySelector("textarea[placeholder=请输入商品详情内容]").value.includes("详情回显验证") && !!document.querySelector("[aria-label=移除商品封面]")'), 'Rich detail and cover reach the store form');
  await change('textarea[placeholder="请输入商品列表页简述"]', '门店盲袋独立展示资料');
  await change('input[aria-label="盲袋初始库存"]', '2');
  await click('保存修改');
  await waitFor('确认保存门店商品');
  await click('确认保存');
  await waitFor('门店商品保存完成');
  await screenshot('08-store-save');
  await click('返回门店商品');
  await click('盲袋商品', '.console-sidebar button');
  await evaluate(`(() => { const row = [...document.querySelectorAll('tr')].find(node => node.innerText.includes('烘焙惊喜盲袋')); [...row.querySelectorAll('button')].find(node => node.innerText.trim() === '编辑').click(); })()`);
  await pause(350);
  check(await evaluate('document.querySelector("textarea[placeholder=请输入商品列表页简述]").value === "当天烘焙惊喜，内容以门店装袋为准" && document.querySelector("input[aria-label=盲袋初始库存]").value === "4"'), 'Store edits leave master display and stock unchanged');
  await click('取消');
  await click(libraryMenu, '.console-sidebar button');
  await click(split ? '新建单品主档' : '新建单品');
  check((await body()).includes('选择商品类目') && !await evaluate('[...document.querySelectorAll("[data-testid=product-category-picker] button")].some(node=>node.innerText.trim().startsWith("盲袋商品"))'), 'Ordinary creation hides categories reserved for the blind-bag scene');
  await evaluate('([...document.querySelectorAll("button")].find(node=>node.getClientRects().length && node.innerText.startsWith("通用菜品"))).click()');
  await pause(350);
  const normalText = await body();
  check(!await evaluate('!!document.querySelector("[data-testid=blind-bag-form]")') && ['多规格','做法','加料'].every(label=>normalText.includes(label)), 'Normal products keep multi-spec, methods and addons');
  await screenshot('09-normal-form');
  await click('盲袋商品', '.console-sidebar button');
  await click('新建盲袋商品');
  await change('#field-master-name input', '原生表单恢复测试');
  await change('input[placeholder="请输入销售价"]', '8.5');
  await change('input[aria-label="盲袋初始库存"]', '3');
  acceptLeave = false;
  await click('取消');
  check(await evaluate('document.querySelector("#field-master-name input")?.value === "原生表单恢复测试"'), 'Rejected leave preserves native form input');
  acceptLeave = true;
  await pause(450);
  // The existing demo router removes scenario from the address bar. Re-enter
  // its original URL to keep the split-mode fixture during the recovery check.
  if (split) await command('Page.navigate', { url });
  else await command('Page.reload');
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate('!!document.getElementById("blind-list-search")')) break;
    await pause(150);
  }
  check(await evaluate('!!document.getElementById("blind-list-search")'), 'Reload returns to the blind-bag list');
  await click('新建盲袋商品');
  check(await evaluate('document.querySelector("#field-master-name input")?.value === "原生表单恢复测试"') && (await body()).includes('已恢复上次意外退出'), 'Unexpected reload recovers blind-bag form separately from ordinary create');
  check(await evaluate('document.querySelector("input[placeholder=请输入销售价]").value === "8.5" && document.querySelector("input[aria-label=盲袋初始库存]").value === "3"'), 'Recovery retains unsaved native single-SKU price and stock');
  await click('保存为草稿');
  await waitFor('草稿已保存');
  await click('取消');
  await click('新建盲袋商品');
  check(await evaluate('document.querySelector("#field-master-name input")?.value === ""'), 'Saved draft clears the creation recovery cache');
  await change('#field-master-name input', '连续创建第二袋');
  await click('保存为草稿');
  await waitFor('草稿已保存');
  await click('取消');
  check((await body()).includes('原生表单恢复测试') && (await body()).includes('连续创建第二袋'), 'Repeated creation saves two distinct blind-bag drafts');
  // The recovery check reloads the demo and resets store state. Publish again
  // so lifecycle cleanup is checked against actual related store records.
  await evaluate('document.querySelector("input[aria-label=选择烘焙惊喜盲袋]").click()');
  await click('下发门店');
  await click('下一步');
  await evaluate('document.querySelector("input[aria-label=全选筛选结果中的门店]").click()');
  await evaluate('([...document.querySelectorAll("label")].find(node=>node.innerText.trim()==="立即执行")).querySelector("input").click()');
  await click('提交并同步');
  await waitFor('同步任务已提交');
  await click('门店商品', '.console-sidebar button');
  await change('input[placeholder="搜索商品名称/ID"]', '烘焙惊喜盲袋');
  check(await evaluate('[...document.querySelectorAll("tbody tr")].some(row=>row.innerText.includes("烘焙惊喜盲袋"))'), 'Lifecycle verification starts with real published store records');
  await click('盲袋商品', '.console-sidebar button');
  const rowAction = async (name, action) => {
    assert(await evaluate(`(() => { const row=[...document.querySelectorAll('[data-testid=blind-bag-list] tbody tr')].find(node=>node.innerText.includes(${JSON.stringify(name)})); const action=[...row.querySelectorAll('button')].find(node=>node.innerText.trim()===${JSON.stringify(action)}); if (!action) return false; action.click(); return true; })()`), `${name}: ${action}`); await pause(300);
  };
  await rowAction('烘焙惊喜盲袋', '停用');
  check(await evaluate('!!document.querySelector("dialog[open] #product-lifecycle-confirmation")'), 'Disable reuses the library lifecycle confirmation');
  check(await evaluate('[...document.querySelectorAll("dialog[open] button")].find(node=>node.innerText.trim()==="确认停用").disabled'), 'Disable requires the exact confirmation phrase');
  await screenshot('10-disable-confirmation');
  await click('取消');
  check(await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] tbody tr")].find(row=>row.innerText.includes("烘焙惊喜盲袋")).innerText.includes("已启用")'), 'Cancelling disable keeps the product enabled');
  await rowAction('烘焙惊喜盲袋', '停用');
  await input('product-lifecycle-confirmation', '我确认停用');
  await click('确认停用');
  check(await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] tbody tr")].find(row=>row.innerText.includes("烘焙惊喜盲袋")).innerText.includes("已停用")'), 'Disable updates the shared blind-bag product');
  await rowAction('烘焙惊喜盲袋', '启用');
  await click('确认');
  check((await body()).includes('未自动上架门店商品'), 'Enable keeps store publication independent');
  await click(libraryMenu, '.console-sidebar button');
  check((await body()).includes('烘焙惊喜盲袋'), 'Library shows the same re-enabled blind-bag product');
  await click('盲袋商品', '.console-sidebar button');
  await rowAction('烘焙惊喜盲袋', '归档');
  check(await evaluate('[...document.querySelectorAll("dialog[open] button")].find(node=>node.innerText.trim()==="确认归档").disabled'), 'Archive requires confirmation');
  await click('取消');
  check((await body()).includes('烘焙惊喜盲袋'), 'Cancelling archive preserves product data');
  await rowAction('烘焙惊喜盲袋', '归档');
  await input('product-lifecycle-confirmation', '我确认归档');
  await click('确认归档');
  check(!await evaluate('document.querySelector("[data-testid=blind-bag-list] tbody").innerText.includes("烘焙惊喜盲袋")'), 'Archive removes the product from the blind-bag list');
  await click(libraryMenu, '.console-sidebar button');
  check(!await evaluate('[...document.querySelectorAll("tbody tr")].some(row=>row.innerText.includes("烘焙惊喜盲袋"))'), 'Archive removes the product from the shared library');
  await click('门店商品', '.console-sidebar button');
  await change('input[placeholder="搜索商品名称/ID"]', '烘焙惊喜盲袋');
  check(await evaluate(`[...document.querySelectorAll('tbody tr')].some(row=>row.innerText.includes('烘焙惊喜盲袋')) === ${split}`), 'Archive follows the existing management-mode store cleanup rules');
  await click('盲袋商品', '.console-sidebar button');
  await evaluate('document.querySelector("input[aria-label=选择小食惊喜盲袋]").click()');
  await click('批量启用');
  await click('确认');
  check(await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] tbody tr")].find(row=>row.innerText.includes("小食惊喜盲袋")).innerText.includes("已启用")'), 'Batch enable updates selected products');
  await evaluate('document.querySelector("input[aria-label=选择小食惊喜盲袋]").click()');
  await click('批量停用');
  await input('product-lifecycle-confirmation', '我确认停用');
  await click('确认停用');
  check(await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] tbody tr")].find(row=>row.innerText.includes("小食惊喜盲袋")).innerText.includes("已停用")'), 'Batch disable updates selected products');
  for (const name of ['原生表单恢复测试', '连续创建第二袋']) await evaluate(`document.querySelector('input[aria-label="选择${name}"]').click()`);
  check(await evaluate('[...document.querySelectorAll("[data-testid=blind-bag-list] button")].find(node=>node.innerText.trim()==="批量启用").disabled'), 'Drafts cannot bypass validation through batch enable');
  await click('批量归档');
  check((await body()).includes('共 2 个'), 'Batch archive confirmation identifies selected products');
  await input('product-lifecycle-confirmation', '我确认归档');
  await click('确认归档');
  check(!await evaluate('/原生表单恢复测试|连续创建第二袋/.test(document.querySelector("[data-testid=blind-bag-list] tbody").innerText)'), 'Batch archive removes both selected drafts');
  await screenshot('11-lifecycle-result');
  for (const [kind, expected] of [['loading', '正在加载盲袋商品'], ['error', '盲袋商品加载失败'], ['no-permission', '暂无盲袋商品查看权限'], ['no-range', '暂无获授权的盲袋商品范围'], ['partial-permission', '当前仅展示获授权范围'], ['first-empty', '尚未创建盲袋商品'], ['long-name', '长文案验收']]) {
    await evaluate(`import('/scripts/blind-bag-state-harness.jsx').then(module => module.mount(${JSON.stringify(kind)}))`);
    await pause(200);
    const stateText = await evaluate('document.getElementById("blind-bag-state-harness").innerText');
    check(stateText.includes(expected), `List state ${kind}`);
    if (kind === 'partial-permission') check(!stateText.includes('小食惊喜盲袋'), 'Partial range hides unauthorized records');
    if (kind === 'no-permission' || kind === 'no-range') check(!stateText.includes('烘焙惊喜盲袋'), 'Permission denial hides product records');
    if (kind === 'long-name') check(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Long names fit the 1440px page');
  }
  await evaluate("import('/scripts/blind-bag-state-harness.jsx').then(module => module.unmount())");
  check(!failures.length, 'No browser runtime exceptions');
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
