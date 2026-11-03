import type { PublishBatch } from './WebPublishRecords';
import { matchesTask } from './taskModel.ts';

// Use recorded target IDs, including pending/failed rows. Summary text is not a store identity.
export function taskStoreRows(batch: PublishBatch, channel = 'all') {
  return (batch.details || []).filter(row => row.storeId && row.storeName
    && (channel === 'all' || row.channel === channel)
    && batch.tasks.some(task => matchesTask(row, task)));
}

export function matchesAffectedStores(batch: PublishBatch, storeIds: string[], channel = 'all') {
  return !storeIds.length || taskStoreRows(batch, channel).some(row => storeIds.includes(row.storeId));
}
