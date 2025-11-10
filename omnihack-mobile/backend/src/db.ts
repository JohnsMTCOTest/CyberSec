import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'omnihack.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

sqlite3.verbose();

export const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    accepted_ethics INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    lab_id TEXT,
    seed TEXT,
    parameters TEXT,
    status TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

export function ensureUser(userId: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT OR IGNORE INTO users (id, accepted_ethics) VALUES (?, 0)',
      [userId],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

export function markEthicsAccepted(userId: string) {
  return new Promise<void>((resolve, reject) => {
    db.run('UPDATE users SET accepted_ethics = 1 WHERE id = ?', [userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function hasAcceptedEthics(userId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.get('SELECT accepted_ethics FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.accepted_ethics === 1 : false);
    });
  });
}

export function createSession(session: {
  id: string;
  userId: string;
  labId: string;
  seed: string;
  parameters: string;
  status: string;
}) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT INTO sessions (id, user_id, lab_id, seed, parameters, status) VALUES (?, ?, ?, ?, ?, ?)',
      [session.id, session.userId, session.labId, session.seed, session.parameters, session.status],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export function updateSessionStatus(sessionId: string, status: string) {
  return new Promise<void>((resolve, reject) => {
    db.run('UPDATE sessions SET status = ? WHERE id = ?', [status, sessionId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function getSession(sessionId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM sessions WHERE id = ?', [sessionId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
