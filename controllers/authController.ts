import type { Request, Response } from "express";
import { IS_PRODUCTION, REFRESH_COOKIE_MAX_AGE_MS } from "../config/auth.js";
import { loginUser, logoutUser, refreshAccessToken, signupUser } from "../services/authService.js";
import { AppError } from "../utils/errors.js";
import { loginSchema, parseWithSchema, signupSchema } from "../utils/validation.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "strict" as const,
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
};

export async function signup(req: Request, res: Response): Promise<Response> {
  const credentials = parseWithSchema(signupSchema, req.body);
  const user = await signupUser(credentials.username, credentials.password);

  if (!user) {
    throw new AppError(409, "User already exists");
  }

  return res.status(201).json({
    message: "User created successfully",
    user: {
      id: user.id,
      username: user.username,
    },
  });
}

export async function login(req: Request, res: Response): Promise<Response> {
  const credentials = parseWithSchema(loginSchema, req.body);
  const session = await loginUser(credentials.username, credentials.password);

  if (!session) {
    throw new AppError(401, "Invalid credentials");
  }

  res.cookie("refreshToken", session.refreshToken, refreshCookieOptions);

  return res.status(200).json({
    message: "Login Successful",
    token: session.accessToken,
  });
}

export async function refresh(req: Request, res: Response): Promise<Response> {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  if (!refreshToken) {
    throw new AppError(401, "Refresh token missing");
  }

  const result = await refreshAccessToken(refreshToken);

  if ("error" in result && result.error === "INVALID_REFRESH_TOKEN") {
    throw new AppError(403, "Invalid refresh token");
  }

  if ("error" in result && result.error === "EXPIRED_OR_INVALID_REFRESH_TOKEN") {
    throw new AppError(403, "Refresh token expired or invalid");
  }

  if ("error" in result) {
    throw new AppError(500, "Failed to refresh access token");
  }

  return res.status(200).json({
    message: "Access token refreshed successfully",
    token: result.accessToken,
  });
}

export function getCurrentUser(req: Request, res: Response): Response {
  return res.status(200).json({
    message: "User info fetched successfully",
    user: req.user,
  });
}

export async function logout(req: Request, res: Response): Promise<Response> {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  res.clearCookie("refreshToken", refreshCookieOptions);

  return res.status(200).json({
    message: "Logout successful",
  });
}
