import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import ids from '@/data/video-ids.json';
import { dirname, join } from 'node:path';

export function db() {
  // Vercel's filesystem is ephemeral; expose a read-only seeded preview there.
  const path = process.env.VERCEL ? ':memory:' : process.env.DATABASE_URL?.replace(/^file:/, '') || join(process.cwd(), 'data/academy.db');
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec(`CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT, description TEXT, duration TEXT, status TEXT NOT NULL DEFAULT 'pending', error TEXT, transcript TEXT, summary TEXT, updated_at TEXT)`);
  const insert = database.prepare('INSERT OR IGNORE INTO videos (id) VALUES (?)');
  [...new Set(ids)].forEach(id => insert.run(id));
  return database;
}
