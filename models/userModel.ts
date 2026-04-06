import { getDb } from "../config/database.js";
import type { User } from "./dataStore.js";

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const db = await getDb();
  const user = await db.get<User>(
    "SELECT id, username, password FROM users WHERE LOWER(username) = LOWER(?)",
    username
  );

  return user ?? undefined;
}

export async function userExists(username: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM users WHERE LOWER(username) = LOWER(?)",
    username
  );

  return (result?.count ?? 0) > 0;
}

export async function createUser(user: User): Promise<User> {
  const db = await getDb();
  await db.run("INSERT INTO users (id, username, password) VALUES (?, ?, ?)", user.id, user.username, user.password);
  return user;
}
