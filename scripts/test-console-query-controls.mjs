import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import { build } from 'esbuild';

// Run with QUERY_TEST_JSDOM pointing at an installed jsdom entry; no browser,
// network, production data, or production credentials are used by these tests.
const require = createRequire(import.meta.url);
const { JSDOM } = require(process.env.QUERY_TEST_JSDOM || 'jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/?scenario=unified' });
for (const name of ['window','document','location','HTMLElement','HTMLInputElement','HTMLButtonElement','Element','Node','localStorage','Event','KeyboardEvent','MouseEvent']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
HTMLElement.prototype.scrollIntoView = function () {};
const { default: React, act, useState } = await import('react');
const { createRoot } = await import('react-dom/client');
const folder = path.resolve('task-review/query-unit'); await fs.mkdir(folder,{recursive:true});
await build({ stdin: { contents: `export * from './components/web/WebQueryControls'; export {ProductProvider} from './context'; export {matchesStoreProductQuery,EMPTY_STORE_PRODUCT_QUERY} from './components/web/storeProductQuery'; export {matchesQueryKeyword} from './components/web/queryKeyword'; export {WebAdmin} from './components/WebAdmin';`, resolveDir:process.cwd(), loader:'tsx' }, outfile:path.join(folder,'controls.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty','.png':'dataurl','.jpg':'dataurl','.svg':'dataurl'},logLevel:'silent' });
const { WebQuerySearch, matchesQueryKeyword, matchesStoreProductQuery, EMPTY_STORE_PRODUCT_QUERY, WebAdmin, WebQueryInput, WebQuerySelect, WebQueryMore, WebQueryDateRange, WebQuerySchemes, WebQueryBar, ProductProvider } = await import(pathToFileURL(path.join(folder,'controls.mjs')));
const root = createRoot(document.getElementById('root')); let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const eq=(value,expected,message)=>{assert.deepEqual(value,expected,message);checks++;};
const all=(selector)=>Array.from(document.querySelectorAll(selector));
const button=(text)=>all('button').find(node=>node.textContent===text);
async function render(component){await act(async()=>{root.render(React.createElement(ProductProvider,null,component));});}
async function click(node){assert.ok(node,'Missing click target');await act(async()=>{node.dispatchEvent(new MouseEvent('click',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,1));});}
async function input(node,value){await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));});}
async function key(node,key,extra={}){await act(async()=>{node.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...extra}));});}
let searches=0,last='';
function InputHarness(){const [value,setValue]=useState('初始值');return React.createElement(WebQueryInput,{'aria-label':'关键词',value,onValueChange:value=>{last=value;setValue(value);},onSearch:()=>searches++,placeholder:'搜索商品'});}
await render(React.createElement(InputHarness));
await input(document.querySelector('input'),'拿铁');eq(last,'拿铁','Controlled input changes reach page state');
await key(document.querySelector('input'),'Enter',{isComposing:true});eq(searches,0,'IME confirmation must not submit');
await key(document.querySelector('input'),'Enter');eq(searches,1,'Enter submits once');
await click(document.querySelector('[aria-label="清空关键词"]'));eq(last,'','Clear reaches page predicate');eq(document.activeElement,document.querySelector('input'),'Clear restores input focus');
function Nested(){const [value,setValue]=useState('all');return React.createElement(WebQueryMore,null,React.createElement('label',null,'状态',React.createElement(WebQuerySelect,{'aria-label':'状态',value,onValueChange:setValue},React.createElement('option',{value:'all'},'全部'),React.createElement('option',{value:'enabled'},'已启用'),React.createElement('option',{value:'disabled'},'已停用'))));}
await render(React.createElement(Nested));await click(button('更多'));ok(document.querySelector('[role="dialog"]'),'More opens');
await click(document.querySelector('[role="combobox"]'));ok(document.querySelector('[role="listbox"]'),'Nested dropdown opens in portal');
const option=all('[role="option"]').find(n=>n.textContent==='已停用');await act(async()=>{option.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));option.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
ok(document.querySelector('[role="dialog"]'),'Selecting nested option does not dismiss More');eq(document.querySelector('[role="combobox"]').textContent,'已停用','Selection label is correct');
await click(button('查询'));ok(!document.querySelector('[role="dialog"]'),'Apply closes More');
await click(button('更多'));await key(document.activeElement,'Escape');ok(!document.querySelector('[role="dialog"]'),'Escape dismisses More');
function SelectHarness(){const [value,setValue]=useState('0');return React.createElement(WebQuerySelect,{'aria-label':'分类',value,onValueChange:setValue},Array.from({length:9},(_,i)=>React.createElement('option',{key:i,value:String(i)},'分类'+i)));}
await render(React.createElement(SelectHarness));await click(document.querySelector('[role="combobox"]'));await input(document.querySelector('input'),'分类7');eq(all('[role="option"]').length,1,'Search filters options');await key(document.querySelector('input'),'Enter');eq(document.querySelector('[role="combobox"]').textContent,'分类7','Keyboard selects matching option');
await click(document.querySelector('[role="combobox"]'));await act(async()=>document.body.dispatchEvent(new MouseEvent('mousedown',{bubbles:true})));ok(!document.querySelector('[role="listbox"]'),'Outside click closes dropdown');
let dateChanges=[];
function DateHarness(){const [value,setValue]=useState(['','']);return React.createElement(WebQueryDateRange,{label:'创建时间',value,onChange:next=>{dateChanges.push(next);setValue(next);}});}
await render(React.createElement(DateHarness));await click(document.querySelector('[aria-label="创建时间范围"]'));await click(button('近7天'));await click(button('取消'));eq(dateChanges.length,0,'Date cancel leaves applied range intact');
await click(document.querySelector('[aria-label="创建时间范围"]'));await input(document.querySelector('[aria-label="创建时间开始日期"]'),'2026-11-10');await input(document.querySelector('[aria-label="创建时间结束日期"]'),'2026-11-01');await click(button('确定'));ok(document.querySelector('[role="alert"]'),'Inverted date range is rejected');eq(dateChanges.length,0,'Invalid range never applies');await click(button('今天'));await click(button('确定'));eq(dateChanges.length,1,'Preset applies once');eq(dateChanges[0][0],dateChanges[0][1],'Today is one day');await click(document.querySelector('[aria-label="清空创建时间"]'));eq(dateChanges.at(-1),['',''],'Date clear resets both bounds');
let applied;
const scheme=(scope,value)=>React.createElement(WebQuerySchemes,{scope,value,onApply:next=>{applied=next;}});
await render(scheme('unit-a',{keyword:'拿铁',status:'enabled'}));await click(button('筛选方案'));await input(document.querySelector('[aria-label="筛选方案名称"]'),'常用商品');await click(button('保存'));ok(button('常用商品'),'Saved scheme appears');await click(button('常用商品'));eq(applied,{keyword:'拿铁',status:'enabled'},'Scheme restores full values');
await render(scheme('unit-b',{keyword:''}));await click(button('筛选方案'));ok(!button('常用商品'),'Schemes do not leak between page scopes');await key(document.activeElement,'Escape');
await render(scheme('unit-a',{keyword:''}));await click(button('筛选方案'));ok(button('常用商品'),'Scheme survives component remount');await input(document.querySelector('[aria-label="筛选方案名称"]'),'常用商品');await click(button('保存'));ok(document.querySelector('[role="alert"]')?.textContent.includes('已存在'),'Duplicate names are rejected');await click(document.querySelector('[aria-label="删除方案常用商品"]'));ok(!button('常用商品'),'Scheme can be removed');
// Verify that selecting a search type changes the actual field predicate.
const record = {name:'生椰拿铁',id:'P001',sku:['SKU001','SKU002']};
ok(matchesQueryKeyword(' 拿铁 ','all',record),'All searches existing fields and trims spaces');
ok(!matchesQueryKeyword('拿铁','id',record),'ID search does not accidentally match product name');
ok(matchesQueryKeyword('sku002','sku',record),'SKU search supports arrays and case folding');
ok(matchesQueryKeyword('','name',record),'Clearing keyword restores unfiltered matches');
function SearchHarness(){const [field,setField]=useState('all');return React.createElement(WebQuerySearch,{'aria-label':'商品',searchType:field,onSearchTypeChange:setField,searchOptions:[{value:'all',label:'全部'},{value:'id',label:'商品ID'}],value:'P001'});}
await render(React.createElement(SearchHarness));await click(document.querySelector('[role="combobox"]'));await click(button('商品ID'));eq(document.querySelector('[role="combobox"]').textContent,'商品ID','Integrated search type dropdown changes selection');
const storeRecord={baseProductId:'P001',specs:[{id:'S001'}],type:'Standard',status:'on_shelf',stockStatus:'normal'};
ok(matchesStoreProductQuery(storeRecord,EMPTY_STORE_PRODUCT_QUERY),'Default store filters retain records');
ok(matchesStoreProductQuery(storeRecord,{...EMPTY_STORE_PRODUCT_QUERY,skuId:'s001',shelfStatus:'on_shelf'}),'Store SKU and shelf conditions combine');
ok(!matchesStoreProductQuery(storeRecord,{...EMPTY_STORE_PRODUCT_QUERY,stockStatus:'empty'}),'Stock filter excludes unmatched records');
ok(!matchesStoreProductQuery(storeRecord,{...EMPTY_STORE_PRODUCT_QUERY,productType:'Combo'}),'Product type filter excludes unmatched records');
// Portal controls must not submit the owning list before their own confirmation.
let barSearches=0;
await render(React.createElement(WebQueryBar,{onSearch:()=>barSearches++},React.createElement(WebQueryInput,{'aria-label':'列表关键词',defaultValue:''}),React.createElement(WebQueryDateRange,{label:'列表时间',value:['',''],onChange:()=>{}})));
await key(document.querySelector('[aria-label="列表关键词"]'),'Enter');eq(barSearches,1,'Direct query Enter applies once');
await click(document.querySelector('[aria-label="列表时间范围"]'));await key(document.querySelector('[aria-label="列表时间开始日期"]'),'Enter');eq(barSearches,1,'Date popup Enter does not submit parent list');
await key(document.activeElement,'Escape');
// Smoke-render actual menu pages: catches missing imports, invalid JSX and
// runtime render failures. It does not substitute for browser layout review.
const {renderToString}=await import('react-dom/server');
const menus=['product_list','channel_product_library','store_product_list','store_product_coverage','categories','channel_categories','category_management','product_attributes','channel_attributes','channel_custom_attributes','recipe_legacy','recipe_new','ingredient_library','nutrition_manager','addon_group','price_systems','product_records','product_mapping','difference_inspection','product_recommendation','product_template','sales_scope','buffet_menu','online_ordering','required_product_policy','attribute_mutex_rules','store_addon_list','store_method_list','store_attribute_list','store_category_list','store_region_list','blind_bag_products','group_meal_products','product_logs'];
for(const menu of menus){window.history.replaceState({},'',`/?menu=${menu}&view=web&recordView=qimai`);const html=renderToString(React.createElement(ProductProvider,null,React.createElement(WebAdmin)));ok(html.length>300,`Menu ${menu} renders without crashing`);}
await act(async()=>root.unmount());dom.window.close();console.log(`Console query controls: ${checks} interaction and menu-render checks passed.`);
