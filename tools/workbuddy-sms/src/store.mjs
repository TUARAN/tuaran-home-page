import { chmod, mkdir } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { dirname } from 'node:path';

const EVENT_COLUMNS = new Map([
  ['status', 'status'],
  ['taskId', 'task_id'],
  ['conversationId', 'conversation_id'],
  ['command', 'command'],
  ['runId', 'run_id'],
  ['completedAt', 'completed_at'],
  ['errorCode', 'error_code'],
]);

function eventFromRow(row) {
  if (!row) return null;
  return {
    eventId: row.event_id,
    senderId: row.sender_id,
    receivedAt: row.received_at,
    status: row.status,
    taskId: row.task_id ?? undefined,
    conversationId: row.conversation_id ?? undefined,
    command: row.command ?? undefined,
    runId: row.run_id ?? undefined,
    completedAt: row.completed_at ?? undefined,
    errorCode: row.error_code ?? undefined,
  };
}

export class SqliteStore {
  constructor(path) {
    this.path = path;
    this.db = null;
  }

  async open() {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(this.path);
    await chmod(this.path, 0o600);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS inbound_events (
        event_id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        received_at INTEGER NOT NULL,
        status TEXT NOT NULL,
        task_id TEXT,
        conversation_id TEXT,
        command TEXT,
        run_id TEXT,
        completed_at INTEGER,
        error_code TEXT
      );
      CREATE TABLE IF NOT EXISTS sender_rate_events (
        sender_id TEXT NOT NULL,
        occurred_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sender_rate
        ON sender_rate_events (sender_id, occurred_at);
      CREATE TABLE IF NOT EXISTS stopped_senders (
        sender_id TEXT PRIMARY KEY,
        stopped_at INTEGER NOT NULL
      );
    `);
    return this;
  }

  getEvent(eventId) {
    return eventFromRow(this.db.prepare('SELECT * FROM inbound_events WHERE event_id = ?').get(eventId));
  }

  async acceptEvent(event) {
    const result = this.db.prepare(`
      INSERT OR IGNORE INTO inbound_events (event_id, sender_id, received_at, status)
      VALUES (?, ?, ?, 'accepted')
    `).run(event.eventId, event.senderId, event.receivedAt);
    return result.changes > 0;
  }

  async updateEvent(eventId, patch) {
    const entries = Object.entries(patch).filter(([key]) => EVENT_COLUMNS.has(key));
    if (entries.length) {
      const assignments = entries.map(([key]) => `${EVENT_COLUMNS.get(key)} = ?`).join(', ');
      this.db.prepare(`UPDATE inbound_events SET ${assignments} WHERE event_id = ?`).run(...entries.map(([, value]) => value), eventId);
    }
    return this.getEvent(eventId);
  }

  async setStopped(senderId, stopped) {
    if (stopped) {
      this.db.prepare('INSERT OR REPLACE INTO stopped_senders (sender_id, stopped_at) VALUES (?, ?)').run(senderId, Date.now());
    } else {
      this.db.prepare('DELETE FROM stopped_senders WHERE sender_id = ?').run(senderId);
    }
  }

  isStopped(senderId) {
    return Boolean(this.db.prepare('SELECT 1 AS found FROM stopped_senders WHERE sender_id = ?').get(senderId));
  }

  async consumeRate(senderId, now, limit) {
    const cutoff = now - 3_600_000;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM sender_rate_events WHERE occurred_at <= ?').run(cutoff);
      const count = this.db.prepare('SELECT COUNT(*) AS count FROM sender_rate_events WHERE sender_id = ?').get(senderId).count;
      if (count >= limit) {
        this.db.exec('COMMIT');
        return false;
      }
      this.db.prepare('INSERT INTO sender_rate_events (sender_id, occurred_at) VALUES (?, ?)').run(senderId, now);
      this.db.exec('COMMIT');
      return true;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}
