import type { Request, Response } from "express";
import { IS_PRODUCTION, REFRESH_COOKIE_MAX_AGE_MS } from "../config/auth.js";
import { loginUser, logoutUser, refreshAccessToken, signupUser } from "../services/authService.js";
import { validateCredentials } from "../utils/validation.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "strict" as const,
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
};

export async function signup(req: Request, res: Response): Promise<Response> {
  const validation = validateCredentials(
    (req.body as { username?: unknown }).username,
    (req.body as { password?: unknown }).password,
    "signup"
  );

  if ("error" in validation) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const user = await signupUser(validation.value.username, validation.value.password);

    if (!user) {
      return res.status(409).json({ message: "User already exists" });
    }

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create User" });
  }
}

export async function login(req: Request, res: Response): Promise<Response> {
  const validation = validateCredentials(
    (req.body as { username?: unknown }).username,
    (req.body as { password?: unknown }).password,
    "login"
  );

  if ("error" in validation) {
    return res.status(400).json({ message: validation.error });
  }

  const session = await loginUser(validation.value.username, validation.value.password);

  if (!session) {
    return res.status(401).json({ message: "Invalid credentials" });
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
    return res.status(401).json({ message: "Refresh token missing" });
  }

  const result = await refreshAccessToken(refreshToken);

  if ("error" in result && result.error === "INVALID_REFRESH_TOKEN") {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  if ("error" in result && result.error === "EXPIRED_OR_INVALID_REFRESH_TOKEN") {
    return res.status(403).json({ message: "Refresh token expired or invalid" });
  }

  if ("error" in result) {
    return res.status(500).json({ message: "Failed to refresh access token" });
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
