import assert from 'node:assert/strict';
import { matchesAffectedStores, taskStoreRows } from '../components/web/taskStoreFilter.ts';
const batch={ storeScope:'甲店、乙店',tasks:[{id:'q',type:'qimai',channels:['POS']},{id:'p',type:'platform',channels:['美团外卖']}],details:[
 {taskId:'q',storeId:'A',storeName:'甲店',channel:'POS',status:'pending'},
 {taskId:'p',storeId:'B',storeName:'乙店',channel:'美团外卖',status:'failed'},
]};
assert(matchesAffectedStores(batch,[]));
assert(matchesAffectedStores(batch,['A'])); // Not executed yet still affects this store.
assert(matchesAffectedStores(batch,['B'])); // Failed targets remain searchable for diagnosis.
assert(matchesAffectedStores(batch,['missing','A'])); // Multiple stores use any-match.
assert(!matchesAffectedStores(batch,['missing']));
assert(!matchesAffectedStores(batch,['A'],'美团外卖')); // Channel and store must match the same target row.
assert(matchesAffectedStores(batch,['B'],'美团外卖'));
const limited={...batch,tasks:[batch.tasks[0]]};
assert(!matchesAffectedStores(limited,['B'])); // Invisible child targets cannot leak through the filter.
assert.equal(taskStoreRows(limited).length,1);
assert(!matchesAffectedStores({...batch,storeCount:0,details:[]},['A']));
assert(!matchesAffectedStores({...batch,details:undefined},['A'])); // Do not guess historical targets from summary text.
assert(!matchesAffectedStores(batch,['甲店'])); // IDs, not fuzzy names, decide identity.
console.log('Affected-store filtering: 12 behavioral checks passed.');
