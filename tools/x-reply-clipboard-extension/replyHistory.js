(function (root) {
  "use strict";

  const DATABASE = "xrc-reply-history";
  const STORE = "targets";
  const LEGACY_PREFIX = "xrcRepliedTargets:v1:";
  const LEGACY_BUCKETS = 32;
  const MIGRATION_BATCH = 500;

  function createReplyHistory(storage, indexedDB = root.indexedDB) {
    let databasePromise;
    const knownReplied = new Set();
    const loadedAccounts = new Set();
    const migrations = new Map();

    function accountName(value) {
      const name = String(value || "").replace(/^@/u, "").toLowerCase();
      if (!/^[a-z0-9_]{1,15}$/u.test(name) || name === "default") throw new Error("无法识别账号，无法读取已回复记录");
      return name;
    }

    function database() {
      if (databasePromise) return databasePromise;
      if (!indexedDB?.open) return Promise.reject(new Error("IndexedDB 不可用，无法安全去重"));
      databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("已回复记录打开失败"));
      }).catch((error) => {
        databasePromise = undefined;
        throw error;
      });
      return databasePromise;
    }

    async function read(key) {
      const db = await database();
      return new Promise((resolve, reject) => {
        const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("已回复记录读取失败"));
      });
    }

    async function write(keys) {
      if (!keys.length) return;
      const db = await database();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error || new Error("已回复记录写入失败"));
        tx.onerror = () => reject(tx.error || new Error("已回复记录写入失败"));
        const store = tx.objectStore(STORE);
        for (const key of keys) store.put(1, key);
      });
    }

    async function needsMigration(value) {
      const name = accountName(value);
      return !(await read(`meta:${name}`));
    }

    async function load(value, legacyIds = []) {
      const name = accountName(value);
      if (loadedAccounts.has(name)) return true;
      if (migrations.has(name)) return migrations.get(name);
      const migration = (async () => {
        if (!await needsMigration(name)) {
          loadedAccounts.add(name);
          return true;
        }
        const legacyKeys = Array.from({ length: LEGACY_BUCKETS }, (_, index) => `${LEGACY_PREFIX}${name}:${index}`);
        const old = storage?.get ? await storage.get([...legacyKeys, "xrcDailyReports"]) : {};
        const ids = new Set(legacyIds.map(String));
        for (const key of legacyKeys) for (const id of old?.[key]?.ids || []) ids.add(String(id));
        for (const row of Array.isArray(old?.xrcDailyReports) ? old.xrcDailyReports : []) {
          if (String(row.accountHandle || "").replace(/^@/u, "").toLowerCase() !== name) continue;
          for (const item of Array.isArray(row.targetKeys) ? row.targetKeys : []) {
            const id = String(item).match(/^(?:timeline-reply|notification-reply|kol-reply):(\d+)$/u)?.[1];
            if (id) ids.add(id);
          }
        }
        const valid = [...ids].filter((id) => /^\d+$/u.test(id));
        for (let index = 0; index < valid.length; index += MIGRATION_BATCH) {
          await write(valid.slice(index, index + MIGRATION_BATCH).map((id) => `${name}:${id}`));
        }
        await write([`meta:${name}`]);
        try { await storage?.remove?.(legacyKeys); }
        catch (error) { /* Migration is complete; stale Chrome storage can be removed later. */ }
        loadedAccounts.add(name);
        return true;
      })();
      migrations.set(name, migration);
      try { return await migration; }
      finally { migrations.delete(name); }
    }

    async function has(value, id) {
      const name = accountName(value);
      const target = String(id || "");
      if (!/^\d+$/u.test(target)) return false;
      const key = `${name}:${target}`;
      if (knownReplied.has(key)) return true;
      const found = Boolean(await read(key));
      if (found) {
        if (knownReplied.size >= 2000) knownReplied.clear();
        knownReplied.add(key);
      }
      return found;
    }

    async function add(value, id) {
      const name = accountName(value);
      const target = String(id || "");
      if (!/^\d+$/u.test(target)) return false;
      await write([`${name}:${target}`]);
      if (knownReplied.size >= 2000) knownReplied.clear();
      knownReplied.add(`${name}:${target}`);
      return true;
    }

    return { needsMigration, load, has, add };
  }

  const api = { createReplyHistory };
  root.XrcReplyHistory = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
