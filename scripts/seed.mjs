import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const path = process.env.DATABASE_URL?.replace(/^file:/, '') || 'data/academy.db';
mkdirSync(dirname(path), { recursive: true });
const db = new DatabaseSync(path);
db.exec(`CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT, description TEXT, duration TEXT, status TEXT NOT NULL DEFAULT 'pending', error TEXT, transcript TEXT, summary TEXT, updated_at TEXT);`);
const ids = JSON.parse(readFileSync(new URL('../data/video-ids.json', import.meta.url), 'utf8'));
const add = db.prepare('INSERT OR IGNORE INTO videos (id) VALUES (?)');
for (const id of new Set(ids)) { if (!/^[\w-]{11}$/.test(id)) throw Error(`Invalid video ID: ${id}`); add.run(id); }
console.log(`Seeded ${new Set(ids).size} unique videos (${ids.length} entries).`);
db.close();
