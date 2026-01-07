import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db

function ensureDb() {
  if (db) return db

  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, 'stomp.sqlite')
  db = new Database(dbPath)

  db.exec(`
    CREATE TABLE IF NOT EXISTS stomps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_image TEXT,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_stomps_created_at ON stomps(created_at DESC);
  `)

  return db
}

export function listStomps(limit = 30) {
  const database = ensureDb()
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 30))
  const stmt = database.prepare(
    `SELECT id, user_id, user_name, user_image, message, created_at
     FROM stomps
     ORDER BY created_at DESC
     LIMIT ?`
  )
  return stmt.all(safeLimit)
}

export function insertStomp({ userId, userName, userImage, message }) {
  const database = ensureDb()
  const createdAt = Date.now()

  const stmt = database.prepare(
    `INSERT INTO stomps (user_id, user_name, user_image, message, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
  const info = stmt.run(userId, userName, userImage || null, message, createdAt)

  return {
    id: info.lastInsertRowid,
    user_id: userId,
    user_name: userName,
    user_image: userImage || null,
    message,
    created_at: createdAt,
  }
}
