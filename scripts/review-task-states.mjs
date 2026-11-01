import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await fs.mkdir(new URL('task-review/', root), { recursive: true });
const pages = await (await fetch('http://127.0.0.1:9258/json/list')).json();
const target = pages.find(page => page.type === 'page' && page.url.startsWith('http://127.0.0.1:')); 
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let seq = 0; const pending = new Map(); const errors = [];
socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (pending.has(message.id)) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(message.error) : p.resolve(message.result); } if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails); });
const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const ev = async expression => { const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); assert(!response.exceptionDetails, JSON.stringify(response.exceptionDetails)); return response.result.value; };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

await call('Runtime.enable');await call('Page.navigate',{url:'http://127.0.0.1:5219/?menu=product_records'});await wait(6500);
const checks=[];const check=(name,value)=>{assert(value,name);checks.push(name);};
await ev(`(async()=>{const repo=await import('/components/web/taskRepository.ts');const seed=repo.demonstrationTasks()[0];repo.saveTask('b_1',{...seed,id:'QA-SCHEDULER',scheduledAt:new Date(Date.now()+1200).toISOString()});})()`);await wait(2800);
check('scheduled task executes after due time',await ev(`JSON.parse(localStorage.getItem('product-tasks-demo-v1:b_1')).find(batch=>batch.id==='QA-SCHEDULER').status==='success'`));
await ev(`[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='演示说明').click()`);await wait(150);
for(const state of ['loading','empty','error','no-permission','partial-permission','normal']){
 await ev(`(()=>{const select=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='no-permission'));Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,${JSON.stringify(state)});select.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait(180);
 const body=await ev('document.body.innerText');const expected={loading:'正在加载任务记录',empty:'还没有商品任务',error:'任务记录暂时无法加载','no-permission':'暂无任务查看权限','partial-permission':'当前仅展示你有权访问的门店与渠道',normal:'主任务保留统一配置'}[state];check('state '+state,body.includes(expected));
 if(state==='no-permission')check('no permission exposes no task rows',await ev('document.querySelectorAll("[data-task-id]").length===0'));
 if(state==='partial-permission')check('partial permission reduces visible scope',await ev('document.querySelectorAll("[data-task-id]").length===1'));
}
await ev(`(()=>{for(const key of Object.keys(localStorage).filter(key=>key.startsWith('product-tasks-demo-v1:')&&!key.endsWith(':source'))){localStorage.setItem(key,JSON.stringify(JSON.parse(localStorage.getItem(key)).filter(batch=>!batch.id.startsWith('DEMO-')&&!batch.id.startsWith('QA-')&&!batch.remark?.startsWith('验收备注'))));}window.dispatchEvent(new CustomEvent('product-tasks-changed'));})()`);
await call('Page.reload');await wait(5500);
const shot=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(new URL('task-review/tasks-final-1440.png',root),Buffer.from(shot.data,'base64'));
await fs.writeFile(new URL('task-review/state-checks.json',root),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors}));socket.close();
