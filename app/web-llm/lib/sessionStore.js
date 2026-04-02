import { SESSION_DB_NAME, SESSION_STORE_NAME } from './constants'

const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(SESSION_DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
        db.createObjectStore(SESSION_STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('INDEXEDDB_OPEN_FAILED'))
  })
}

async function withStore(mode, callback) {
  const db = await openDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE_NAME, mode)
    const store = tx.objectStore(SESSION_STORE_NAME)
    const request = callback(store)

    tx.oncomplete = () => resolve(request?.result)
    tx.onerror = () => reject(tx.error || request?.error || new Error('INDEXEDDB_TX_FAILED'))
    tx.onabort = () => reject(tx.error || request?.error || new Error('INDEXEDDB_TX_ABORTED'))
  }).finally(() => db.close())
}

export async function listSessions() {
  const db = await openDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE_NAME, 'readonly')
    const store = tx.objectStore(SESSION_STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const sessions = Array.isArray(request.result) ? request.result : []
      resolve(
        sessions.sort((a, b) => {
          const aTime = a?.updatedAt || a?.createdAt || 0
          const bTime = b?.updatedAt || b?.createdAt || 0
          return bTime - aTime
        })
      )
    }
    request.onerror = () => reject(request.error || new Error('INDEXEDDB_READ_FAILED'))
    tx.oncomplete = () => db.close()
    tx.onabort = () => reject(tx.error || new Error('INDEXEDDB_TX_ABORTED'))
  })
}

export async function saveSession(session) {
  return withStore('readwrite', (store) => store.put(session))
}

export async function deleteSessionById(id) {
  return withStore('readwrite', (store) => store.delete(id))
}
