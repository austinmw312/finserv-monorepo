import { createHmac } from "crypto";
import { UnauthorizedError } from "@finserv/common";

const JWT_SECRET = process.env.JWT_SECRET || "finserv-dev-secret";
const TOKEN_EXPIRY_SECONDS = 3600;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString("base64url");
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createToken(
  userId: string,
  email: string,
  role: string
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));

  const payload: TokenPayload = {
    userId,
    email,
    role,
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${header}.${encodedPayload}`, JWT_SECRET);

  return `${header}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): TokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new UnauthorizedError("Invalid token format");
  }

  const [header, payload, signature] = parts;
  const expectedSignature = sign(`${header}.${payload}`, JWT_SECRET);

  if (signature !== expectedSignature) {
    throw new UnauthorizedError("Invalid token signature");
  }

  const decoded: TokenPayload = JSON.parse(base64UrlDecode(payload!));
  const now = Math.floor(Date.now() / 1000);

  if (decoded.exp > now) {
    return decoded;
  }

  throw new UnauthorizedError("Token has expired");
}
