import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

const { verifyMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: verifyMock,
  },
}));

const { default: authMiddleware } = await import("../middleware/authMiddleware.js");

function createResponseMock() {
  const response = {} as Response;
  response.status = vi.fn().mockReturnValue(response);
  response.json = vi.fn().mockReturnValue(response);
  return response;
}

describe("authMiddleware", () => {
  beforeEach(() => {
    verifyMock.mockReset();
  });

  it("rejects requests without an authorization header", () => {
    const req = { headers: {} } as Request;
    const res = createResponseMock();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Missing Authorization Header" });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects requests that do not use the bearer scheme", () => {
    const req = { headers: { authorization: "Token abc" } } as Request;
    const res = createResponseMock();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authorization header must use the Bearer scheme",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next for valid tokens", () => {
    verifyMock.mockReturnValue({ userId: "user-1", role: "user" });

    const req = {
      headers: { authorization: "Bearer valid-token" },
    } as Request;
    const res = createResponseMock();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ userId: "user-1", role: "user" });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when token verification fails", () => {
    verifyMock.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const req = {
      headers: { authorization: "Bearer bad-token" },
    } as Request;
    const res = createResponseMock();
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });
});
