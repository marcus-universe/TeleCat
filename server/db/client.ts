import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_DB_PATH = "./data/sb.sqlite";

let db: DatabaseSync | null = null;

export function getDbPath() {
	return process.env.TELECAT_DB_PATH ?? DEFAULT_DB_PATH;
}

export function getDb() {
	if (!db) {
		const dbPath = getDbPath();
		fs.mkdirSync(path.dirname(dbPath), { recursive: true });
		db = new DatabaseSync(dbPath);
		db.exec("PRAGMA journal_mode = WAL");
		db.exec("PRAGMA foreign_keys = ON");
	}
	return db;
}

export function closeDb() {
	if (db) {
		db.close();
		db = null;
	}
}

export function dbAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
	return getDb().prepare(sql).all(...params) as T[];
}

export function dbGet<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
	return getDb().prepare(sql).get(...params) as T | undefined;
}

export function dbRun(sql: string, params: unknown[] = []) {
	return getDb().prepare(sql).run(...params);
}
