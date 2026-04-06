import { getDb } from "../config/database.js";
import type { List } from "./dataStore.js";

export async function getListsByCreatorId(creatorId: string): Promise<List[]> {
  const db = await getDb();
  return db.all<List[]>(
    "SELECT id, name, creator_id as creatorId FROM lists WHERE creator_id = ? ORDER BY created_at DESC",
    creatorId
  );
}

export async function createList(list: List): Promise<List> {
  const db = await getDb();
  await db.run("INSERT INTO lists (id, name, creator_id) VALUES (?, ?, ?)", list.id, list.name, list.creatorId);
  return list;
}

export async function findListById(id: string): Promise<List | undefined> {
  const db = await getDb();
  const list = await db.get<List>(
    "SELECT id, name, creator_id as creatorId FROM lists WHERE id = ?",
    id
  );

  return list ?? undefined;
}

export async function updateListNameById(id: string, name: string): Promise<void> {
  const db = await getDb();
  await db.run("UPDATE lists SET name = ? WHERE id = ?", name, id);
}

export async function deleteList(id: string): Promise<void> {
  const db = await getDb();
  await db.run("DELETE FROM lists WHERE id = ?", id);
}
