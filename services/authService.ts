import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import {
  ACCESS_TOKEN_TTL,
  JWT_SECRET,
  REFRESH_TOKEN_TTL,
} from "../config/auth.js";
import { createUser, findUserByUsername, userExists } from "../models/userModel.js";
import { deleteRefreshToken, hasRefreshToken, saveRefreshToken } from "../models/tokenModel.js";
import type { User } from "../models/dataStore.js";

interface LoginSession {
  accessToken: string;
  refreshToken: string;
}

type RefreshAccessTokenResult =
  | { accessToken: string }
  | { error: "INVALID_REFRESH_TOKEN" | "EXPIRED_OR_INVALID_REFRESH_TOKEN" };

interface JwtPayload {
  userId: string;
  role?: string;
}

const accessTokenOptions: SignOptions = { expiresIn: ACCESS_TOKEN_TTL as SignOptions["expiresIn"] };
const refreshTokenOptions: SignOptions = { expiresIn: REFRESH_TOKEN_TTL as SignOptions["expiresIn"] };

export async function signupUser(username: string, password: string): Promise<User | null> {
  if (await userExists(username)) {
    return null;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    password: hashedPassword,
  };

  return createUser(newUser);
}

export async function loginUser(username: string, password: string): Promise<LoginSession | null> {
  const user = await findUserByUsername(username);

  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return null;
  }

  const accessToken = jwt.sign(
    {
      userId: user.id,
      role: "user",
    },
    JWT_SECRET,
    accessTokenOptions
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
    },
    JWT_SECRET,
    refreshTokenOptions
  );

  await saveRefreshToken(refreshToken, user.id);

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshAccessTokenResult> {
  if (!(await hasRefreshToken(refreshToken))) {
    return { error: "INVALID_REFRESH_TOKEN" };
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload;
    const accessToken = jwt.sign(
      {
        userId: decoded.userId,
        role: "user",
      },
      JWT_SECRET,
      accessTokenOptions
    );

    return { accessToken };
  } catch (error) {
    await deleteRefreshToken(refreshToken);
    return { error: "EXPIRED_OR_INVALID_REFRESH_TOKEN" };
  }
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await deleteRefreshToken(refreshToken);
}
