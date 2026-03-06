// ═══════════════════════════════════════════════
// CFO Dashboard v2 — Offline Layer (Dexie + Sync Queue)
// ═══════════════════════════════════════════════

const DB_NAME = 'cfo_dashboard_v2';
const DB_VERSION = 1;

let db = null;

function getDB() {
    if (db) return db;
    db = new Dexie(DB_NAME);
    db.version(DB_VERSION).stores({
        lancamentos: 'id, tipo, data, categoria, status, cliente, projeto',
        projecoes: 'id, tipo, mes, categoria, status',
        config: 'id',
        syncQueue: '++queueId, table, action, itemId, timestamp'
    });
    return db;
}

// ─── Cache Operations ──────────────────────────

export async function cacheLancamentos(items) {
    const d = getDB();
    await d.lancamentos.clear();
    if (items.length > 0) await d.lancamentos.bulkPut(items);
}

export async function cacheProjecoes(items) {
    const d = getDB();
    await d.projecoes.clear();
    if (items.length > 0) await d.projecoes.bulkPut(items);
}

export async function cacheConfig(config) {
    const d = getDB();
    await d.config.put({ id: 1, ...config });
}

export async function getCachedLancamentos() {
    return getDB().lancamentos.toArray();
}

export async function getCachedProjecoes() {
    return getDB().projecoes.toArray();
}

export async function getCachedConfig() {
    return getDB().config.get(1);
}

// ─── Offline Mutations ─────────────────────────

export async function offlinePutLancamento(item) {
    const d = getDB();
    await d.lancamentos.put(item);
    await d.syncQueue.add({
        table: 'cfo_lancamentos',
        action: 'upsert',
        itemId: item.id,
        payload: item,
        timestamp: Date.now()
    });
}

export async function offlineDeleteLancamento(id) {
    const d = getDB();
    await d.lancamentos.delete(id);
    await d.syncQueue.add({
        table: 'cfo_lancamentos',
        action: 'delete',
        itemId: id,
        timestamp: Date.now()
    });
}

export async function offlinePutProjecao(item) {
    const d = getDB();
    await d.projecoes.put(item);
    await d.syncQueue.add({
        table: 'cfo_projecoes',
        action: 'upsert',
        itemId: item.id,
        payload: item,
        timestamp: Date.now()
    });
}

export async function offlineDeleteProjecao(id) {
    const d = getDB();
    await d.projecoes.delete(id);
    await d.syncQueue.add({
        table: 'cfo_projecoes',
        action: 'delete',
        itemId: id,
        timestamp: Date.now()
    });
}

export async function offlineUpdateCaixa(valor) {
    const d = getDB();
    await d.config.put({ id: 1, caixa_disponivel: valor });
    await d.syncQueue.add({
        table: 'cfo_config_v2',
        action: 'update_caixa',
        itemId: '1',
        payload: { caixa_disponivel: valor },
        timestamp: Date.now()
    });
}

// ─── Sync Queue Processing ────────────────────

export async function getPendingSyncCount() {
    return getDB().syncQueue.count();
}

export async function processSyncQueue(dbModule) {
    const d = getDB();
    const items = await d.syncQueue.orderBy('timestamp').toArray();
    if (items.length === 0) return 0;

    let processed = 0;
    let failed = 0;
    const MAX_RETRIES = 3;

    for (const item of items) {
        try {
            if (item.table === 'cfo_lancamentos') {
                if (item.action === 'upsert') {
                    await dbModule.upsertLancamento(item.payload);
                } else if (item.action === 'delete') {
                    await dbModule.deleteLancamento(item.itemId);
                }
            } else if (item.table === 'cfo_projecoes') {
                if (item.action === 'upsert') {
                    await dbModule.upsertProjecao(item.payload);
                } else if (item.action === 'delete') {
                    await dbModule.deleteProjecao(item.itemId);
                }
            } else if (item.table === 'cfo_config_v2') {
                if (item.action === 'update_caixa') {
                    await dbModule.updateCaixa(item.payload.caixa_disponivel);
                }
            }
            await d.syncQueue.delete(item.queueId);
            processed++;
        } catch (err) {
            console.error('[Offline] Sync failed for item:', item.queueId, err);
            failed++;
            const retries = (item._retries || 0) + 1;
            if (retries >= MAX_RETRIES) {
                console.warn('[Offline] Max retries reached, discarding item:', item.queueId);
                await d.syncQueue.delete(item.queueId);
            } else {
                await d.syncQueue.update(item.queueId, { _retries: retries });
            }
        }
    }
    if (failed > 0) console.warn(`[Offline] Sync: ${processed} ok, ${failed} failed`);
    return processed;
}

export async function clearSyncQueue() {
    return getDB().syncQueue.clear();
}

// ─── Network Status ────────────────────────────

export function isOnline() {
    return navigator.onLine;
}

export function onNetworkChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
}
