import dotenv from "dotenv";

dotenv.config();

export const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
export const JWT_SECRET = process.env.JWT_SECRET ?? "mysecretkey";
export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? "15m";
export const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL ?? "7d";
export const REFRESH_COOKIE_MAX_AGE_MS = Number.parseInt(
  process.env.REFRESH_COOKIE_MAX_AGE_MS ?? "604800000",
  10
);
export const DB_PATH = process.env.DB_PATH ?? "./data/todo-manager.sqlite";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
