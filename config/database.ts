import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import { DB_PATH } from "./env.js";

let databaseInstance: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null = null;
let resolvedDatabasePath: string | null = null;

async function createDatabaseConnection(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  const resolvedPath = path.resolve(DB_PATH);
  resolvedDatabasePath = resolvedPath;
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  const db = await open({
    filename: resolvedPath,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON");
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      task TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      list_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export async function getDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (!databaseInstance) {
    databaseInstance = createDatabaseConnection();
  }

  return databaseInstance;
}

export async function initializeDatabase(): Promise<void> {
  await getDb();
}

export async function resetDatabase(): Promise<void> {
  const db = await getDb();

  await db.exec(`
    DELETE FROM refresh_tokens;
    DELETE FROM todos;
    DELETE FROM lists;
    DELETE FROM users;
  `);
}

export async function closeDatabase(): Promise<void> {
  if (!databaseInstance) {
    return;
  }

  const db = await databaseInstance;
  await db.close();
  databaseInstance = null;
}

export function getDatabasePath(): string {
  return resolvedDatabasePath ?? path.resolve(DB_PATH);
}
