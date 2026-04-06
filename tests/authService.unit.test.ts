import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../models/dataStore.js";

const {
  hashMock,
  compareMock,
  signMock,
  verifyMock,
  randomUuidMock,
  userExistsMock,
  createUserMock,
  findUserByUsernameMock,
  hasRefreshTokenMock,
  saveRefreshTokenMock,
  deleteRefreshTokenMock,
} = vi.hoisted(() => ({
  hashMock: vi.fn(),
  compareMock: vi.fn(),
  signMock: vi.fn(),
  verifyMock: vi.fn(),
  randomUuidMock: vi.fn(),
  userExistsMock: vi.fn(),
  createUserMock: vi.fn(),
  findUserByUsernameMock: vi.fn(),
  hasRefreshTokenMock: vi.fn(),
  saveRefreshTokenMock: vi.fn(),
  deleteRefreshTokenMock: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: hashMock,
    compare: compareMock,
  },
}));

vi.mock("node:crypto", () => ({
  default: {
    randomUUID: randomUuidMock,
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: signMock,
    verify: verifyMock,
  },
}));

vi.mock("../models/userModel.js", () => ({
  userExists: userExistsMock,
  createUser: createUserMock,
  findUserByUsername: findUserByUsernameMock,
}));

vi.mock("../models/tokenModel.js", () => ({
  hasRefreshToken: hasRefreshTokenMock,
  saveRefreshToken: saveRefreshTokenMock,
  deleteRefreshToken: deleteRefreshTokenMock,
}));

const { loginUser, logoutUser, refreshAccessToken, signupUser } = await import("../services/authService.js");

describe("authService", () => {
  beforeEach(() => {
    hashMock.mockReset();
    compareMock.mockReset();
    signMock.mockReset();
    verifyMock.mockReset();
    randomUuidMock.mockReset();
    userExistsMock.mockReset();
    createUserMock.mockReset();
    findUserByUsernameMock.mockReset();
    hasRefreshTokenMock.mockReset();
    saveRefreshTokenMock.mockReset();
    deleteRefreshTokenMock.mockReset();
  });

  it("creates a new user during signup when the username is available", async () => {
    const createdUser: User = {
      id: "generated-user-id",
      username: "new_user",
      password: "hashed-password",
    };

    userExistsMock.mockResolvedValue(false);
    hashMock.mockResolvedValue("hashed-password");
    randomUuidMock.mockReturnValue("generated-user-id");
    createUserMock.mockResolvedValue(createdUser);

    const result = await signupUser("new_user", "secret123");

    expect(userExistsMock).toHaveBeenCalledWith("new_user");
    expect(hashMock).toHaveBeenCalledWith("secret123", 10);
    expect(createUserMock).toHaveBeenCalledWith(createdUser);
    expect(result).toEqual(createdUser);
  });

  it("returns null during login when the password check fails", async () => {
    findUserByUsernameMock.mockResolvedValue({
      id: "user-1",
      username: "demo",
      password: "stored-hash",
    });
    compareMock.mockResolvedValue(false);

    const result = await loginUser("demo", "wrong-password");

    expect(compareMock).toHaveBeenCalledWith("wrong-password", "stored-hash");
    expect(result).toBeNull();
    expect(signMock).not.toHaveBeenCalled();
  });

  it("creates access and refresh tokens during login", async () => {
    findUserByUsernameMock.mockResolvedValue({
      id: "user-1",
      username: "demo",
      password: "stored-hash",
    });
    compareMock.mockResolvedValue(true);
    signMock.mockReturnValueOnce("access-token").mockReturnValueOnce("refresh-token");
    saveRefreshTokenMock.mockResolvedValue("refresh-token");

    const result = await loginUser("demo", "secret123");

    expect(signMock).toHaveBeenCalledTimes(2);
    expect(saveRefreshTokenMock).toHaveBeenCalledWith("refresh-token", "user-1");
    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("refreshes an access token when the refresh token is valid", async () => {
    hasRefreshTokenMock.mockResolvedValue(true);
    verifyMock.mockReturnValue({ userId: "user-1" });
    signMock.mockReturnValue("new-access-token");

    const result = await refreshAccessToken("refresh-token");

    expect(hasRefreshTokenMock).toHaveBeenCalledWith("refresh-token");
    expect(verifyMock).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: "new-access-token" });
  });

  it("deletes invalid refresh tokens when verification fails", async () => {
    hasRefreshTokenMock.mockResolvedValue(true);
    verifyMock.mockImplementation(() => {
      throw new Error("expired");
    });

    const result = await refreshAccessToken("expired-token");

    expect(deleteRefreshTokenMock).toHaveBeenCalledWith("expired-token");
    expect(result).toEqual({ error: "EXPIRED_OR_INVALID_REFRESH_TOKEN" });
  });

  it("delegates logout to token deletion", async () => {
    deleteRefreshTokenMock.mockResolvedValue(undefined);

    await logoutUser("refresh-token");

    expect(deleteRefreshTokenMock).toHaveBeenCalledWith("refresh-token");
  });
});
