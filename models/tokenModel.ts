import { getDb } from "../config/database.js";

export async function saveRefreshToken(token: string, userId: string): Promise<string> {
  const db = await getDb();
  await db.run("INSERT INTO refresh_tokens (token, user_id) VALUES (?, ?)", token, userId);
  return token;
}

export async function hasRefreshToken(token: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM refresh_tokens WHERE token = ?",
    token
  );

  return (result?.count ?? 0) > 0;
}

export async function deleteRefreshToken(token: string): Promise<void> {
  const db = await getDb();
  await db.run("DELETE FROM refresh_tokens WHERE token = ?", token);
}
