import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runMigrations() {
	const db = getDb();
	const schemaPath = path.join(__dirname, "schema.sql");
	const schema = fs.readFileSync(schemaPath, "utf8");
	db.exec(schema);
	try {
		db.exec(`ALTER TABLE instances ADD COLUMN last_ip TEXT`);
	} catch {
		// column already exists
	}
}
