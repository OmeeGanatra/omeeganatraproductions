declare namespace Express {
  interface Request {
    user?: {
      id: string;
      type: "admin" | "client";
      role: string;
    };
  }
}
