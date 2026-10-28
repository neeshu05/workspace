import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = await scrypt(pw, Buffer.from(salt, 'hex'), 64);
  const expected = Buffer.from(key, 'hex');
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

export type Session = { userId: string; businessId: string; role: 'owner' | 'staff' };

export const COOKIE = 'sp_session';
const MAX_AGE_MS = 12 * 3600_000;

export function setSession(res: Response, s: Session) {
  const token = jwt.sign(s, config.jwtSecret, { expiresIn: '12h' });
  // Cookie (not a bearer header) so EventSource, which cannot set headers, is authenticated too.
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: config.production, maxAge: MAX_AGE_MS });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE);
}

function readCookie(req: Request, name: string) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: Session;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readCookie(req, COOKIE);
  try {
    if (!token) throw new Error('no token');
    req.session = jwt.verify(token, config.jwtSecret) as Session;
    next();
  } catch {
    res.status(401).json({ error: 'Not authenticated' });
  }
}
