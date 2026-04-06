declare namespace Express {
  interface UserPayload {
    userId: string;
    role?: string;
  }

  interface Request {
    user?: UserPayload;
  }
}
